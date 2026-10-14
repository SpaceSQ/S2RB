import { mqttPublish, startMailSubscriber } from "./mqtt_link.ts";
import { createMailbox, mqttAddress, parseMailLetter, type TunnelLetter } from "./s2rb_tunnel.ts";

const bus = createMailbox();
let started = false;

function ensureSubscriber() {
  const url = process.env.MQTT_URL;
  if (!url || started) return;
  started = true;
  startMailSubscriber({
    url,
    ingest(letter) {
      bus.post(letter);
    },
  });
}

export function mailStore() {
  ensureSubscriber();
  return bus;
}

export async function postMail(letter: TunnelLetter) {
  const parsed = parseMailLetter(letter) ?? letter;
  const result = bus.post(parsed);
  if (!result.ok) return result;
  const url = process.env.MQTT_URL;
  const topic = mqttAddress(parsed.toDid);
  if (url && topic.ok) {
    const wired = parseMailLetter(parsed);
    if (wired) await mqttPublish(url, topic.topic, JSON.stringify(wired));
  }
  return result;
}
