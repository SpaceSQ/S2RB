use std::io::{Read, Write};
use std::net::{TcpStream, ToSocketAddrs};
use std::time::Duration;

use crate::did::screen_did;

pub const MAIL_FILTER: &str = "S2/rainbow/+/mail";
const DEFAULT_PORT: u16 = 1883;

#[derive(Clone)]
pub struct MqttAuth {
    pub host: String,
    pub port: u16,
    pub username: String,
    pub password: String,
    pub client_id: String,
}

impl MqttAuth {
    pub fn new(host: String, username: String, password: String) -> Self {
        Self {
            host,
            port: DEFAULT_PORT,
            username,
            password,
            client_id: "s2rb-desktop".into(),
        }
    }
}

pub fn mail_topic(did: &str) -> Result<String, String> {
    let hit = screen_did(did).map_err(|reason| reason.as_str().to_string())?;
    Ok(format!("S2/rainbow/{}/mail", hit.clean))
}

pub fn did_from_mail_topic(topic: &str) -> Option<String> {
    let prefix = "S2/rainbow/";
    let suffix = "/mail";
    if !topic.starts_with(prefix) || !topic.ends_with(suffix) {
        return None;
    }
    let did = topic.get(prefix.len()..topic.len() - suffix.len())?;
    screen_did(did).ok().map(|hit| hit.clean)
}

pub fn remain(mut len: usize) -> Vec<u8> {
    let mut out = Vec::new();
    loop {
        let mut encoded = (len % 128) as u8;
        len /= 128;
        if len > 0 {
            encoded |= 0x80;
        }
        out.push(encoded);
        if len == 0 {
            break;
        }
    }
    out
}

fn read_remain(buf: &[u8]) -> Option<(usize, usize)> {
    let mut len = 0usize;
    let mut mul = 1usize;
    for (index, byte) in buf.iter().copied().take(4).enumerate() {
        len += (byte as usize & 0x7f) * mul;
        if byte & 0x80 == 0 {
            return Some((len, index + 1));
        }
        mul *= 128;
    }
    None
}

pub fn take_packet(buf: &mut Vec<u8>) -> Option<Vec<u8>> {
    if buf.is_empty() {
        return None;
    }
    let rest = buf.get(1..)?;
    let (len, header) = read_remain(rest)?;
    let total = 1 + header + len;
    if buf.len() < total {
        return None;
    }
    Some(buf.drain(..total).collect())
}

pub fn parse_publish(packet: &[u8]) -> Option<(String, Vec<u8>)> {
    if packet.first().map(|byte| byte >> 4) != Some(3) {
        return None;
    }
    let qos = (packet[0] & 0x06) >> 1;
    let (_, header) = read_remain(packet.get(1..)?)?;
    let mut cur = 1 + header;
    let topic_len = u16::from_be_bytes([*packet.get(cur)?, *packet.get(cur + 1)?]) as usize;
    cur += 2;
    let topic = std::str::from_utf8(packet.get(cur..cur + topic_len)?).ok()?.to_string();
    cur += topic_len;
    if qos > 0 {
        cur += 2;
    }
    let payload = packet.get(cur..)?.to_vec();
    Some((topic, payload))
}

pub fn mqtt_connect(auth: &MqttAuth) -> Result<TcpStream, String> {
    let addr = format!("{}:{}", auth.host, auth.port)
        .to_socket_addrs()
        .map_err(|e| e.to_string())?
        .next()
        .ok_or_else(|| "MQTT_ADDR".to_string())?;
    let mut stream = TcpStream::connect_timeout(&addr, Duration::from_secs(3)).map_err(|e| e.to_string())?;
    stream.set_read_timeout(Some(Duration::from_secs(2))).ok();
    stream.set_write_timeout(Some(Duration::from_secs(3))).ok();

    let id = auth.client_id.as_bytes();
    let user = auth.username.as_bytes();
    let pass = auth.password.as_bytes();
    let mut body = vec![0, 4];
    body.extend_from_slice(b"MQTT");
    body.push(4);
    body.push(0xC2);
    body.extend_from_slice(&60u16.to_be_bytes());
    body.extend_from_slice(&(id.len() as u16).to_be_bytes());
    body.extend_from_slice(id);
    body.extend_from_slice(&(user.len() as u16).to_be_bytes());
    body.extend_from_slice(user);
    body.extend_from_slice(&(pass.len() as u16).to_be_bytes());
    body.extend_from_slice(pass);
    let mut pkt = vec![0x10];
    pkt.extend(remain(body.len()));
    pkt.extend(body);
    stream.write_all(&pkt).map_err(|e| e.to_string())?;

    let mut ack = [0u8; 8];
    let n = stream.read(&mut ack).map_err(|e| e.to_string())?;
    if n < 4 || ack[0] != 0x20 || ack[3] != 0 {
        return Err("MQTT_CONNACK".into());
    }

    let topic = MAIL_FILTER.as_bytes();
    let mut sub = Vec::new();
    sub.extend_from_slice(&1u16.to_be_bytes());
    sub.extend_from_slice(&(topic.len() as u16).to_be_bytes());
    sub.extend_from_slice(topic);
    sub.push(0);
    let mut subpkt = vec![0x82];
    subpkt.extend(remain(sub.len()));
    subpkt.extend(sub);
    stream.write_all(&subpkt).map_err(|e| e.to_string())?;
    Ok(stream)
}

pub fn mqtt_publish(stream: &mut TcpStream, topic: &str, payload: &[u8]) -> Result<(), String> {
    let topic_bytes = topic.as_bytes();
    let mut body = Vec::new();
    body.extend_from_slice(&(topic_bytes.len() as u16).to_be_bytes());
    body.extend_from_slice(topic_bytes);
    body.extend_from_slice(payload);
    let mut pkt = vec![0x30];
    pkt.extend(remain(body.len()));
    pkt.extend(body);
    stream.write_all(&pkt).map_err(|e| e.to_string())
}

pub fn mqtt_ping(stream: &mut TcpStream) -> Result<(), String> {
    stream.write_all(&[0xC0, 0]).map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::{did_from_mail_topic, mail_topic, parse_publish, remain};

    #[test]
    fn topic_is_rainbow_mail() {
        let topic = mail_topic("DHOME1251009FA00000001").expect("topic");
        assert_eq!(topic, "S2/rainbow/DHOME1251009FA00000001/mail");
        assert_eq!(
            did_from_mail_topic(&topic).as_deref(),
            Some("DHOME1251009FA00000001")
        );
        assert!(mail_topic("short").is_err());
        assert!(did_from_mail_topic("S2/#").is_none());
    }

    #[test]
    fn remain_and_publish_roundtrip_shape() {
        assert_eq!(remain(0), vec![0]);
        assert_eq!(remain(127), vec![127]);
        let topic = b"S2/rainbow/DHOME1251009FA00000001/mail";
        let payload = br#"{"body":"x"}"#;
        let mut body = Vec::new();
        body.extend_from_slice(&(topic.len() as u16).to_be_bytes());
        body.extend_from_slice(topic);
        body.extend_from_slice(payload);
        let mut pkt = vec![0x30];
        pkt.extend(remain(body.len()));
        pkt.extend(body);
        let parsed = parse_publish(&pkt).expect("publish");
        assert_eq!(parsed.0, "S2/rainbow/DHOME1251009FA00000001/mail");
        assert_eq!(parsed.1, payload);
    }
}
