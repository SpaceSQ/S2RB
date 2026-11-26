//! Host 7-Dimension Admission Governance Engine (`s2rb.world.manifest.json`)

use s2rb_container::{NormalizedPowerVector, VirtualAvatarCharacter, WorldTrustTier};
use s2rb_protocol::{CoordinateConvention, SunsAddress, ZeroImportedCurrency};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HostNetworkMode {
    StandaloneMod,
    OnlineAuthoritative,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SkinPolicy {
    FullPbr,
    ShaderAdapted,
    HiddenDefaultBody,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ApparelPolicy {
    Enabled,
    CosmeticStatic,
    Disabled,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EquipmentPolicy {
    FullStats,
    TransmogOnly,
    Disabled,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BackpackPolicy {
    ActiveUse,
    ViewOnly,
    Disabled,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SkillPolicy {
    SemanticMapped,
    VfxEmoteOnly,
    Disabled,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum OriginXpPolicy {
    CurveSync,
    PrestigeBadgeOnly,
    Disabled,
}

#[derive(Debug, Clone, PartialEq)]
pub struct HostWorldManifest {
    pub world_name: String,
    pub world_suns: SunsAddress,
    pub network_mode: HostNetworkMode,
    pub trust_tier: WorldTrustTier,
    pub coord_convention: CoordinateConvention,
    pub host_hp_bracket: (f64, f64),
    pub allow_skin: SkinPolicy,
    pub allow_apparel: ApparelPolicy,
    pub allow_equipment: EquipmentPolicy,
    pub allow_backpack_items: BackpackPolicy,
    pub allow_skills: SkillPolicy,
    pub allow_origin_xp: OriginXpPolicy,
    /// Must strictly be `false`! Any `true` manifest is rejected before mounting.
    pub allow_currency_import: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum GovernanceError {
    CurrencyUnlockForbidden,
    InvalidHpBracket,
}

#[derive(Debug, Clone, PartialEq)]
pub struct AdmittedContainerProjection {
    pub target_world_suns: String,
    pub effective_level_in_host: u32,
    pub projected_hp_max: f64,
    pub active_skin_uri: Option<String>,
    pub shader_adapted: bool,
    pub visible_apparel_count: usize,
    pub weapon_stats_active: bool,
    pub weapon_transmog_visible: bool,
    pub backpack_interactive: bool,
    pub combat_skills_enabled: bool,
    pub imported_currency: ZeroImportedCurrency,
}

pub struct Host7DimGovernanceFilter;

impl Host7DimGovernanceFilter {
    pub fn validate_manifest(manifest: &HostWorldManifest) -> Result<(), GovernanceError> {
        if manifest.allow_currency_import {
            return Err(GovernanceError::CurrencyUnlockForbidden);
        }
        if manifest.host_hp_bracket.0 <= 0.0 || manifest.host_hp_bracket.1 < manifest.host_hp_bracket.0 {
            return Err(GovernanceError::InvalidHpBracket);
        }
        Ok(())
    }

    pub fn project_avatar_into_host(
        avatar: &VirtualAvatarCharacter,
        manifest: &HostWorldManifest,
    ) -> Result<AdmittedContainerProjection, GovernanceError> {
        Self::validate_manifest(manifest)?;

        let is_competitive = manifest.network_mode == HostNetworkMode::OnlineAuthoritative;
        let include_sandbox_xp = manifest.trust_tier == WorldTrustTier::Tier3LocalSandbox;

        let effective_level = match manifest.allow_origin_xp {
            OriginXpPolicy::CurveSync => avatar.effective_genesis_level(include_sandbox_xp),
            OriginXpPolicy::PrestigeBadgeOnly | OriginXpPolicy::Disabled => 1,
        };

        let projected_hp_max = match manifest.allow_origin_xp {
            OriginXpPolicy::CurveSync => NormalizedPowerVector::project_to_host(
                avatar.power_vector.vitality,
                manifest.host_hp_bracket.0,
                manifest.host_hp_bracket.1,
                is_competitive,
            ),
            OriginXpPolicy::PrestigeBadgeOnly | OriginXpPolicy::Disabled => {
                (manifest.host_hp_bracket.0 + manifest.host_hp_bracket.1) * 0.5
            }
        };

        let (active_skin_uri, shader_adapted) = match manifest.allow_skin {
            SkinPolicy::FullPbr => (Some(avatar.skin_uri.clone()), false),
            SkinPolicy::ShaderAdapted => (Some(avatar.skin_uri.clone()), true),
            SkinPolicy::HiddenDefaultBody => (None, true),
        };

        let visible_apparel_count = match manifest.allow_apparel {
            ApparelPolicy::Enabled | ApparelPolicy::CosmeticStatic => avatar.apparel_sockets.len(),
            ApparelPolicy::Disabled => 0,
        };

        let (weapon_stats_active, weapon_transmog_visible) = match manifest.allow_equipment {
            EquipmentPolicy::FullStats => (!is_competitive, true),
            EquipmentPolicy::TransmogOnly => (false, true),
            EquipmentPolicy::Disabled => (false, false),
        };

        Ok(AdmittedContainerProjection {
            target_world_suns: manifest.world_suns.to_canonical_string(),
            effective_level_in_host: effective_level,
            projected_hp_max,
            active_skin_uri,
            shader_adapted,
            visible_apparel_count,
            weapon_stats_active,
            weapon_transmog_visible,
            backpack_interactive: manifest.allow_backpack_items == BackpackPolicy::ActiveUse,
            combat_skills_enabled: manifest.allow_skills == SkillPolicy::SemanticMapped,
            imported_currency: avatar.origin_vault.export_for_target_world(),
        })
    }
}
