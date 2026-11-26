use std::fmt;

/// 7-Category S2 Taxonomy.
/// CONSTITUTIONAL RULE: The 7th category is strictly `Myth` (`MYTH`), NEVER `MATH`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum S2Category {
    Human,
    Silicon,
    Space,
    Thing,
    Org,
    Rule,
    Myth,
}

impl S2Category {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Human => "HUMAN",
            Self::Silicon => "SILICON",
            Self::Space => "SPACE",
            Self::Thing => "THING",
            Self::Org => "ORG",
            Self::Rule => "RULE",
            Self::Myth => "MYTH",
        }
    }

    pub fn parse(raw: &str) -> Result<Self, S2DidError> {
        match raw {
            "HUMAN" => Ok(Self::Human),
            "SILICON" => Ok(Self::Silicon),
            "SPACE" => Ok(Self::Space),
            "THING" => Ok(Self::Thing),
            "ORG" => Ok(Self::Org),
            "RULE" => Ok(Self::Rule),
            "MYTH" => Ok(Self::Myth),
            "MATH" => Err(S2DidError::ForbiddenMathCategory),
            _ => Err(S2DidError::UnknownTaxonomyCategory(raw.to_string())),
        }
    }
}

/// Species Prefix Class (1st character of 22-char S2-DID v4.0)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum SpeciesClass {
    /// `D`: Carbon-sovereign Digital Human / Player Principal Avatar
    DigitalHumanD,
    /// `V`: Native Companion Silicon Agent / Hero Adjutant
    CompanionAgentV,
    /// `I`: Independent Public / Wild Silicon Entity
    PublicAgentI,
    /// `A`: Official Brand / Taohuayuan Landmark Avatar
    AnchorAvatarA,
}

impl SpeciesClass {
    pub fn from_char(c: char) -> Result<Self, S2DidError> {
        match c {
            'D' => Ok(Self::DigitalHumanD),
            'V' => Ok(Self::CompanionAgentV),
            'I' => Ok(Self::PublicAgentI),
            'A' => Ok(Self::AnchorAvatarA),
            _ => Err(S2DidError::InvalidSpeciesPrefix(c)),
        }
    }

    pub fn as_char(&self) -> char {
        match self {
            Self::DigitalHumanD => 'D',
            Self::CompanionAgentV => 'V',
            Self::PublicAgentI => 'I',
            Self::AnchorAvatarA => 'A',
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum S2DidError {
    InvalidLength(usize),
    InvalidSpeciesPrefix(char),
    InvalidOriginCode,
    InvalidDateSegment,
    InvalidSerialSegment,
    InvalidChecksumFormat,
    ChecksumMismatch { expected: [char; 2], actual: [char; 2] },
    ForbiddenMathCategory,
    UnknownTaxonomyCategory(String),
}

impl fmt::Display for S2DidError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{:?}", self)
    }
}

/// Validated 22-character S2-DID v4.0 identifier:
/// `[1-char Species][5-char Origin][6-digit YYMMDD][8-digit Serial][2-letter Checksum A-Z]`
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct S2Did {
    raw: String,
    pub species: SpeciesClass,
    pub origin_tag: String,
    pub yymmdd: String,
    pub serial: String,
    pub checksum: [char; 2],
    pub migrated_from_v3: bool,
}

impl S2Did {
    /// Computes deterministic position-sensitive orthogonal Base-26 checksum over the 20-char body.
    pub fn compute_v4_checksum(body20: &str) -> [char; 2] {
        const WEIGHTS_HI: [u32; 20] = [
            7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83,
        ];
        const WEIGHTS_LO: [u32; 20] = [
            89, 83, 79, 73, 71, 67, 61, 59, 53, 47, 43, 41, 37, 31, 29, 23, 19, 17, 13, 11,
        ];
        let mut acc_hi: u32 = 0x5242; // 'RB' seed
        let mut acc_lo: u32 = 0x5332; // 'S2' seed
        for (idx, b) in body20.bytes().take(20).enumerate() {
            acc_hi = acc_hi.wrapping_add((b as u32).wrapping_mul(WEIGHTS_HI[idx]));
            acc_lo = acc_lo.wrapping_add(((b as u32) ^ (idx as u32 * 7)).wrapping_mul(WEIGHTS_LO[idx]));
        }
        let c0 = (b'A' + (acc_hi % 26) as u8) as char;
        let c1 = (b'A' + (acc_lo % 26) as u8) as char;
        [c0, c1]
    }

    /// Generates a brand-new canonical S2-DID v4.0 with valid orthogonal checksum.
    pub fn mint_v4(
        species: SpeciesClass,
        origin5: &str,
        yymmdd: &str,
        serial8: &str,
    ) -> Result<Self, S2DidError> {
        let origin_up = origin5.to_ascii_uppercase();
        if origin_up.len() != 5 || !origin_up.chars().all(|c| c.is_ascii_alphanumeric()) {
            return Err(S2DidError::InvalidOriginCode);
        }
        if yymmdd.len() != 6 || !yymmdd.chars().all(|c| c.is_ascii_digit()) {
            return Err(S2DidError::InvalidDateSegment);
        }
        if serial8.len() != 8 || !serial8.chars().all(|c| c.is_ascii_digit()) {
            return Err(S2DidError::InvalidSerialSegment);
        }
        let body20 = format!("{}{}{}{}", species.as_char(), origin_up, yymmdd, serial8);
        let chk = Self::compute_v4_checksum(&body20);
        let full = format!("{}{}{}", body20, chk[0], chk[1]);
        Self::parse_or_migrate(&full, true)
    }

    /// Parses a 22-char S2-DID, automatically migrating legacy v3.0 format
    /// (`[6-char Prefix][6-digit YYMMDD][2-letter Checksum][8-digit Serial]`) to v4.0.
    /// When `strict_checksum` is true, enforces exact `compute_v4_checksum` match.
    pub fn parse_or_migrate(input: &str, strict_checksum: bool) -> Result<Self, S2DidError> {
        let trimmed = input.trim().to_ascii_uppercase();
        if trimmed.len() != 22 {
            return Err(S2DidError::InvalidLength(trimmed.len()));
        }
        let chars: Vec<char> = trimmed.chars().collect();
        let species = SpeciesClass::from_char(chars[0])?;
        let origin_tag: String = chars[1..6].iter().collect();
        if !origin_tag.chars().all(|c| c.is_ascii_alphanumeric()) {
            return Err(S2DidError::InvalidOriginCode);
        }
        let yymmdd: String = chars[6..12].iter().collect();
        if !yymmdd.chars().all(|c| c.is_ascii_digit()) {
            return Err(S2DidError::InvalidDateSegment);
        }

        // Detect v3.0 legacy layout: positions 12..14 are A-Z letters and 14..22 are 8 digits
        let pos12_14_alpha = chars[12].is_ascii_alphabetic() && chars[13].is_ascii_alphabetic();
        let pos14_22_digits = chars[14..22].iter().all(|c| c.is_ascii_digit());

        let (serial, mut checksum, migrated) = if pos12_14_alpha && pos14_22_digits {
            let ser: String = chars[14..22].iter().collect();
            let body20 = format!("{}{}{}{}", species.as_char(), origin_tag, yymmdd, ser);
            let recomputed = Self::compute_v4_checksum(&body20);
            (ser, recomputed, true)
        } else {
            let ser: String = chars[12..20].iter().collect();
            if !ser.chars().all(|c| c.is_ascii_digit()) {
                return Err(S2DidError::InvalidSerialSegment);
            }
            if !chars[20].is_ascii_alphabetic() || !chars[21].is_ascii_alphabetic() {
                return Err(S2DidError::InvalidChecksumFormat);
            }
            (ser, [chars[20], chars[21]], false)
        };

        let body20 = format!("{}{}{}{}", species.as_char(), origin_tag, yymmdd, serial);
        let expected = Self::compute_v4_checksum(&body20);
        if strict_checksum && !migrated && checksum != expected {
            return Err(S2DidError::ChecksumMismatch {
                expected,
                actual: checksum,
            });
        }
        if migrated {
            checksum = expected;
        }
        let canonical = format!("{}{}{}", body20, checksum[0], checksum[1]);
        Ok(Self {
            raw: canonical,
            species,
            origin_tag,
            yymmdd,
            serial,
            checksum,
            migrated_from_v3: migrated,
        })
    }

    pub fn as_str(&self) -> &str {
        &self.raw
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_mint_and_strict_verify_v4() {
        let did = S2Did::mint_v4(SpeciesClass::DigitalHumanD, "TAOHU", "261126", "00000001").unwrap();
        assert_eq!(did.as_str().len(), 22);
        let parsed = S2Did::parse_or_migrate(did.as_str(), true).unwrap();
        assert_eq!(parsed, did);
        assert!(!parsed.migrated_from_v3);
    }

    #[test]
    fn test_legacy_v3_lossless_migration() {
        let legacy = "VTAOHU260412JE70806749";
        let migrated = S2Did::parse_or_migrate(legacy, true).unwrap();
        assert!(migrated.migrated_from_v3);
        assert_eq!(migrated.as_str().len(), 22);
        assert_eq!(&migrated.serial, "70806749");
    }

    #[test]
    fn test_myth_taxonomy_blocks_math() {
        assert_eq!(S2Category::parse("MYTH").unwrap(), S2Category::Myth);
        assert_eq!(S2Category::parse("MATH"), Err(S2DidError::ForbiddenMathCategory));
    }
}
