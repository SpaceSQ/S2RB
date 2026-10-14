const WEIGHTS: [u32; 20] = [
    3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73,
];

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ScreenedDid {
    pub clean: String,
    pub agent_class: char,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ScreenReason {
    Length,
    Charset,
    Checksum,
    Class,
}

impl ScreenReason {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Length => "DID_LENGTH",
            Self::Charset => "DID_CHARSET",
            Self::Checksum => "DID_CHECKSUM",
            Self::Class => "DID_CLASS",
        }
    }
}

pub fn clean_token(raw: &str) -> String {
    raw.trim().to_ascii_uppercase()
}

pub fn generate_s2_checksum(header: &str, serial: &str) -> Option<String> {
    let raw = format!("{header}{serial}").to_ascii_uppercase();
    if raw.len() != 20 {
        return None;
    }
    let bytes = raw.as_bytes();
    if !bytes[..12]
        .iter()
        .all(|c| c.is_ascii_uppercase() || c.is_ascii_digit())
        || !bytes[12..].iter().all(|c| c.is_ascii_digit())
    {
        return None;
    }
    let mut sum = 0u32;
    for (index, byte) in bytes.iter().enumerate() {
        let value = match byte {
            b'0'..=b'9' => (byte - b'0') as u32,
            b'A'..=b'Z' => (byte - b'A' + 10) as u32,
            _ => return None,
        };
        sum += value * WEIGHTS[index];
    }
    let first = b'A' + (sum % 26) as u8;
    let second = b'A' + ((sum / 26) % 26) as u8;
    Some(String::from_utf8_lossy(&[first, second]).into_owned())
}

fn plausible_stamp(stamp: &str) -> bool {
    let month = stamp.get(2..4).and_then(|s| s.parse::<u32>().ok());
    let day = stamp.get(4..6).and_then(|s| s.parse::<u32>().ok());
    matches!((month, day), (Some(m), Some(d)) if (1..=12).contains(&m) && (1..=31).contains(&d))
}

fn parse_s2_did(raw: &str) -> Result<ScreenedDid, ScreenReason> {
    let did = clean_token(raw);
    if did.contains('-') || !did.chars().all(|c| c.is_ascii_uppercase() || c.is_ascii_digit()) {
        return Err(ScreenReason::Charset);
    }
    if did.len() != 22 {
        return Err(ScreenReason::Length);
    }
    let agent_class = did.chars().next().ok_or(ScreenReason::Class)?;
    if !matches!(agent_class, 'D' | 'V' | 'I' | 'R' | 'A' | 'E') {
        return Err(ScreenReason::Class);
    }
    let attribute = &did[1..6];
    if agent_class == 'I' && attribute != "DCARD" {
        return Err(ScreenReason::Checksum);
    }
    if agent_class == 'A' && attribute != "BRAND" {
        return Err(ScreenReason::Checksum);
    }
    let stamp = &did[6..12];
    if stamp.len() != 6 || !stamp.chars().all(|c| c.is_ascii_digit()) || !plausible_stamp(stamp) {
        return Err(ScreenReason::Checksum);
    }
    let checksum = &did[12..14];
    let serial = &did[14..];
    if !checksum.chars().all(|c| c.is_ascii_uppercase()) || serial.len() != 8 || !serial.chars().all(|c| c.is_ascii_digit())
    {
        return Err(ScreenReason::Checksum);
    }
    let header = &did[..12];
    let seal = generate_s2_checksum(header, serial).ok_or(ScreenReason::Checksum)?;
    if seal != checksum {
        return Err(ScreenReason::Checksum);
    }
    Ok(ScreenedDid {
        clean: did,
        agent_class,
    })
}

/// Same gate as packages/did `screenDid`. Length and charset fail first; parse faults collapse to checksum.
pub fn screen_did(raw: &str) -> Result<ScreenedDid, ScreenReason> {
    let clean = clean_token(raw);
    if clean.len() != 22 {
        return Err(ScreenReason::Length);
    }
    if !clean.chars().all(|c| c.is_ascii_uppercase() || c.is_ascii_digit()) {
        return Err(ScreenReason::Charset);
    }
    parse_s2_did(&clean)
}

#[cfg(test)]
mod tests {
    use super::{generate_s2_checksum, screen_did, ScreenReason};

    #[test]
    fn official_fixture_passes() {
        let hit = screen_did("DHOME1251009FA00000001").expect("valid");
        assert_eq!(hit.clean, "DHOME1251009FA00000001");
        assert_eq!(hit.agent_class, 'D');
        assert_eq!(generate_s2_checksum("DHOME1251009", "00000001").as_deref(), Some("FA"));
    }

    #[test]
    fn forged_checksum_is_local_reject() {
        assert_eq!(screen_did("ABC123").err(), Some(ScreenReason::Length));
        assert_eq!(screen_did("!!!!!!!!!!!!!!!!!!!!!!").err(), Some(ScreenReason::Charset));
        assert_eq!(screen_did("DHOME1251009AB00000001").err(), Some(ScreenReason::Checksum));
    }
}
