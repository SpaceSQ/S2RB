import assert from "node:assert/strict";
import test from "node:test";
import { parseMqttUrl } from "../src/mqtt_link.ts";
import { createMailbox, didFromMailTopic, MAIL_FILTER, mqttAddress } from "../src/s2rb_tunnel.ts";

const did = "DHOME1251009FA00000001";

test("the mailbox topic is S2/rainbow/<DID>/mail and dirty letters stay local", () => {
  const topic = mqttAddress(did);
  assert.equal(topic.ok, true);
  if (!topic.ok) return;
  assert.equal(topic.topic, `S2/rainbow/${did}/mail`);
  assert.equal(didFromMailTopic(topic.topic), did);
  assert.equal(didFromMailTopic("S2/#"), null);
  assert.equal(MAIL_FILTER, "S2/rainbow/+/mail");
  const box = createMailbox();
  assert.equal(box.post({ toDid: did, fromDid: did, body: "hello", atMs: 9 }).ok, true);
  assert.equal(box.post({ toDid: did, fromDid: did, body: "hello", atMs: 9 }).queued, 1);
  assert.equal(box.pull(did).length, 1);
  assert.equal(box.post({ toDid: "SHORT", fromDid: did, body: "x", atMs: 1 }).ok, false);
  assert.equal(parseMqttUrl("mqtt://s2rb:s2rb-local@mosquitto:1883")?.host, "mosquitto");
});
