import { mintS2DidV4, CharacterContainer9m6, ChronicleMerkleLedger } from '../src/index.js';

const mcKnight = new CharacterContainer9m6({
  s2Did: mintS2DidV4('V', 'MC001', '261126', '00010842'),
  displayName: '方块创客骑士 · Steve-Prime',
  modality: 'VOXEL_HYBRID_MESH',
  originSuns: 'GAME-EA-101-MINECRAFT2-008-2',
  originCurrencies: { MC_EMERALD: 640, MC_GOLD_INGOT: 128 },
  originSkills: [{ skillId: 'SK_VOXEL_BUILD', name: '黑曜石筑垒', primitive: 'VOXEL_CONSTRUCT' }]
});

const wowPaladin = new CharacterContainer9m6({
  s2Did: mintS2DidV4('V', 'WOW02', '261126', '00029910'),
  displayName: '白银之手重装圣骑士 · Uther-Vanguard',
  modality: 'REALISTIC_PBR_HUMANOID',
  originSuns: 'GAME-NA-204-AZEROTH2-080-3',
  originCurrencies: { STORMWIND_GOLD: 128500 },
  originSkills: [{ skillId: 'SK_DIVINE_SHIELD', name: '圣盾奉献', primitive: 'PROTECTIVE_SHIELD' }]
});

const holoHuman = new CharacterContainer9m6({
  s2Did: mintS2DidV4('D', 'TAOHU', '261126', '00000001'),
  s2Category: 'HUMAN',
  displayName: '桃花源全息影像数字人 · 零号先遣官',
  modality: 'VOLUMETRIC_HUMAN_HOLOGRAM',
  originSuns: 'META-CN-001-TAOHUAYUAN2-001-2',
  originCurrencies: { TAOHUAYUAN_CREDIT: 58000 },
  originSkills: [{ skillId: 'SK_14D_SONAR', name: '14维声纹扫描', primitive: 'ACOUSTIC_WAVE_SCAN' }]
});

mcKnight.recordAdventureEvolution({
  worldSuns: 'FILM-WA-009-ROMANEMP2-108-2',
  trustTier: 'TIER_2_PARTNER_VERIFIED',
  xpDelta: 1450,
  originSkillId: 'SK_VOXEL_BUILD',
  hostWorldLawTag: 'ROMAN_SIEGE_LAW'
});

wowPaladin.recordAdventureEvolution({
  worldSuns: 'GAME-CN-505-HOKCANYON2-001-5',
  trustTier: 'TIER_1_AUTHORITATIVE',
  xpDelta: 1820,
  originSkillId: 'SK_DIVINE_SHIELD',
  hostWorldLawTag: 'MOBA_CANYON_LAW'
});

holoHuman.recordAdventureEvolution({
  worldSuns: 'GAME-WA-707-CS2ARENA2-016-4',
  trustTier: 'TIER_1_AUTHORITATIVE',
  xpDelta: 1560,
  originSkillId: 'SK_14D_SONAR',
  hostWorldLawTag: 'TACTICAL_CQB_LAW'
});

for (const c of [mcKnight, wowPaladin, holoHuman]) {
  const proof = c.chronicle.generateInclusionProof(c.chronicle.events.length - 1);
  console.log(
    `[OK] ${c.displayName} | DID=${c.s2Did} | Bounds=2x2x2.4m(${c.bounds.volumeM3}m3) | Hybrid=${c.avatar.hybridSkills[0]?.name} | MerkleProof=${ChronicleMerkleLedger.verifyInclusionProof(proof)}`
  );
}
