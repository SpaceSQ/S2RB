import fs from 'node:fs';
import path from 'node:path';
import { mintS2DidV4, CharacterContainer9m6, S2rbLocalDaemon } from '../src/index.js';

const outDir = process.argv[2] || '/tmp';
const daemon = new S2rbLocalDaemon();

daemon.registerHostWorld(
  {
    worldName: '古罗马帝国：军团纪元',
    worldSuns: 'FILM-WA-009-ROMANEMP2-108-2',
    networkMode: 'STANDALONE_MOD',
    trustTier: 'TIER_2_PARTNER_VERIFIED',
    coordConvention: 'UNREAL_LEFT_Z_UP_CM',
    hostHpBracket: [1000, 3800],
    allowSkin: 'FULL_PBR',
    allowApparel: 'ENABLED',
    allowEquipment: 'FULL_STATS',
    allowBackpackItems: 'ACTIVE_USE',
    allowSkills: 'SEMANTIC_MAPPED',
    allowOriginXp: 'CURVE_SYNC',
    allowCurrencyImport: false
  },
  { supportedPrimitives: ['PLACEABLE_BARRIER_1M3', 'MELEE_HOLY_CLEAVE'] }
);

const myDid = mintS2DidV4('D', 'MILES', '261126', '88888888');
const aiDid = mintS2DidV4('V', 'SONAR', '261126', '12345678');
const friendDid = mintS2DidV4('D', 'UTHER', '261126', '00029910');

const hero = new CharacterContainer9m6({
  s2Did: myDid,
  s2Category: 'HUMAN',
  displayName: '桃花源全息数字人·零号统帅',
  modality: 'VOLUMETRIC_HUMAN_HOLOGRAM',
  backpackItems: {
    MAT_OBSIDIAN_BLOCK: 32,
    REL_TAOHUAYUAN_SPIRIT_JADE: 1
  },
  originCurrencies: { TAOHUAYUAN_COIN: 58000 }
});

daemon.registerContainer(hero);
daemon.graph.bindCarbonSiliconCompanion({ principalDid: myDid, companionDid: aiDid, orbitalSlotIndex: 0 });
daemon.graph.linkMutualFriends(myDid, friendDid);
daemon.graph.updateFriendPresence({
  friendDid,
  displayName: '圣骑士·Uther',
  currentWorldName: '古罗马帝国：军团纪元',
  currentSuns: 'FILM-WA-009-ROMANEMP2-108-2'
});

const follow = daemon.dispatchIpc({ type: 'CMD_FOLLOW_FRIEND_JUMP', followerDid: myDid, leaderFriendDid: friendDid });
const overlay = daemon.dispatchIpc({ type: 'CMD_TOGGLE_ALT_R_OVERLAY', s2Did: myDid, open: true });
const fuse = daemon.dispatchIpc({ type: 'CMD_RED_ANCHOR_FUSE_RECALL', s2Did: myDid });

const manifestOut = path.join(outDir, 'wp06_daemon_verified.s2container.json');
fs.writeFileSync(manifestOut, JSON.stringify(hero.toContainerManifest(), null, 2));

console.log('[WP05-WP06 DAEMON & OVERLAY OK]');
console.log('  1. Follow-Jump Berth Allocated:', follow.ticket.targetBerthSuns);
console.log('  2. Alt+R Overlay UGO Translated Tier:', overlay.translatedItems[0]?.tier, '-', overlay.translatedItems[0]?.effectDescription);
console.log('  3. Law 1 Red Anchor Recall Latency:', fuse.elapsedMs, 'ms (<= 3.0ms SLA:', fuse.withinLaw1ThreeMsSla, ')');
console.log('  4. Saved verified container:', manifestOut);
