//! # S2RB Protocol Core (`WP-01`)
//! Constitutional protocol primitives for the S2 Rainbow Bridge v3.0 Super Game Connector:
//! - 22-character `S2-DID v4.0` identity verification & legacy `v3.0` lossless migration
//! - `CD-U6A / S2-SUNS` 6-segment spatial addressing & cross-engine coordinate basis transforms
//! - Space2 `E01_LUMINA`..`E14_CARBON_SOVEREIGNTY` 14-element state & 14x14 coupling matrix
//! - Silicon Three Laws safety guards & compile-time `ZeroImportedCurrency` firewall

pub mod fourteen_elements;
pub mod s2_did;
pub mod silicon_laws;
pub mod suns_address;

pub use fourteen_elements::{ElementCode, ElementGroup, FourteenElementsState};
pub use s2_did::{S2Category, S2Did, SpeciesClass};
pub use silicon_laws::{SiliconLawsAudit, SiliconLawsGuard, ZeroImportedCurrency};
pub use suns_address::{CoordinateConvention, EngineBasisTransform, SunsAddress, GENESIS_HUB_ADDRESS, GENESIS_LANDMARK_CODE};
