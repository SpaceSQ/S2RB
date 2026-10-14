import { connect } from "node:net";
import { didFromMailTopic, MAIL_FILTER, type TunnelLetter } from "./s2rb_tunnel.ts";

export type MqttAuth = {
  host: string;
  port: number;
  username?: string;
  password?: string;
  clientId?: string;
};

export function parseMqttUrl(raw: string): MqttAuth | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== "mqtt:" && url.protocol !== "mqtts:") return null;
    return {
      host: url.hostname,
      port: url.port ? Number(url.port) : 1883,
      username: url.username ? decodeURIComponent(url.username) : undefined,
      password: url.password ? decodeURIComponent(url.password) : undefined,
    };
  } catch {
    return null;
  }
}

function remain(len: number): number[] {
  const out: number[] = [];
  let left = len;
  do {
    let encoded = left % 128;
    left = Math.floor(left / 128);
    if (left > 0) encoded |= 0x80;
    out.push(encoded);
  } while (left > 0);
  return out;
}

function encodePublish(topic: string, payload: Buffer): Buffer {
  const topicBuf = Buffer.from(topic, "utf8");
  const body = Buffer.concat([Buffer.from([(topicBuf.length >> 8) & 0xff, topicBuf.length & 0xff]), topicBuf, payload]);
  return Buffer.concat([Buffer.from([0x30, ...remain(body.length)]), body]);
}

function encodeConnect(auth: MqttAuth): Buffer {
  const id = Buffer.from(auth.clientId || "s2rb-web", "utf8");
  const user = Buffer.from(auth.username ?? "", "utf8");
  const pass = Buffer.from(auth.password ?? "", "utf8");
  const header = Buffer.from([0, 4, ...Buffer.from("MQTT"), 4, 0xc2, 0, 60]);
  const parts = [
    header,
    Buffer.from([(id.length >> 8) & 0xff, id.length & 0xff]),
    id,
    Buffer.from([(user.length >> 8) & 0xff, user.length & 0xff]),
    user,
    Buffer.from([(pass.length >> 8) & 0xff, pass.length & 0xff]),
    pass,
  ];
  const body = Buffer.concat(parts);
  return Buffer.concat([Buffer.from([0x10, ...remain(body.length)]), body]);
}

function encodeSubscribe(): Buffer {
  const topic = Buffer.from(MAIL_FILTER, "utf8");
  const body = Buffer.concat([
    Buffer.from([0, 1]),
    Buffer.from([(topic.length >> 8) & 0xff, topic.length & 0xff]),
    topic,
    Buffer.from([0]),
  ]);
  return Buffer.concat([Buffer.from([0x82, ...remain(body.length)]), body]);
}

function readRemain(buf: Buffer, offset: number): { len: number; header: number } | null {
  let len = 0;
  let mul = 1;
  for (let index = 0; index < 4; index += 1) {
    const byte = buf[offset + index];
    if (byte === undefined) return null;
    len += (byte & 0x7f) * mul;
    if ((byte & 0x80) === 0) return { len, header: index + 1 };
    mul *= 128;
  }
  return null;
}

function parsePublish(packet: Buffer): { topic: string; payload: Buffer } | null {
  if ((packet[0] >> 4) !== 3) return null;
  const qos = (packet[0] & 0x06) >> 1;
  const remainLen = readRemain(packet, 1);
  if (!remainLen) return null;
  let cur = 1 + remainLen.header;
  const topicLen = packet.readUInt16BE(cur);
  cur += 2;
  const topic = packet.subarray(cur, cur + topicLen).toString("utf8");
  cur += topicLen;
  if (qos > 0) cur += 2;
  return { topic, payload: packet.subarray(cur) };
}

function drain(buf: Buffer): { packets: Buffer[]; rest: Buffer } {
  const packets: Buffer[] = [];
  let rest = buf;
  while (rest.length > 1) {
    const size = readRemain(rest, 1);
    if (!size) break;
    const total = 1 + size.header + size.len;
    if (rest.length < total) break;
    packets.push(rest.subarray(0, total));
    rest = rest.subarray(total);
  }
  return { packets, rest };
}

export async function mqttPublish(url: string, topic: string, payload: string): Promise<{ ok: true } | { ok: false; code: "MQTT" }> {
  const auth = parseMqttUrl(url);
  if (!auth) return { ok: false, code: "MQTT" };
  return new Promise((resolve) => {
    const socket = connect({ host: auth.host, port: auth.port });
    const timer = setTimeout(() => {
      socket.destroy();
      resolve({ ok: false, code: "MQTT" });
    }, 4000);
    socket.once("error", () => {
      clearTimeout(timer);
      resolve({ ok: false, code: "MQTT" });
    });
    socket.once("connect", () => {
      socket.write(encodeConnect(auth));
    });
    socket.on("data", (chunk) => {
      if (chunk[0] !== 0x20 || chunk[3] !== 0) {
        clearTimeout(timer);
        socket.destroy();
        resolve({ ok: false, code: "MQTT" });
        return;
      }
      socket.write(encodePublish(topic, Buffer.from(payload, "utf8")));
      clearTimeout(timer);
      socket.end();
      resolve({ ok: true });
    });
  });
}

export function startMailSubscriber(input: {
  url: string;
  ingest: (letter: TunnelLetter) => void;
}): { stop: () => void } {
  const auth = parseMqttUrl(input.url);
  let stopped = false;
  let socket: ReturnType<typeof connect> | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;

  function open() {
    if (stopped || !auth) return;
    socket = connect({ host: auth.host, port: auth.port });
    let acc = Buffer.alloc(0);
    socket.once("connect", () => socket?.write(encodeConnect(auth)));
    socket.on("data", (chunk) => {
      acc = Buffer.concat([acc, chunk]);
      if (acc[0] === 0x20) {
        if (acc[3] !== 0) {
          socket?.destroy();
          return;
        }
        socket?.write(encodeSubscribe());
        acc = acc.subarray(acc.length >= 4 ? 4 : acc.length);
      }
      const frames = drain(acc);
      acc = Buffer.from(frames.rest);
      for (const packet of frames.packets) {
        const pub = parsePublish(packet);
        if (!pub || !didFromMailTopic(pub.topic)) continue;
        try {
          const letter = JSON.parse(pub.payload.toString("utf8")) as TunnelLetter;
          input.ingest(letter);
        } catch {
          // drop non-letter payloads
        }
      }
    });
    socket.on("error", () => socket?.destroy());
    socket.on("close", () => {
      if (stopped) return;
      timer = setTimeout(open, 2000);
    });
  }

  open();
  return {
    stop() {
      stopped = true;
      if (timer) clearTimeout(timer);
      socket?.destroy();
    },
  };
}
