import fs from 'node:fs';
import {
  mintS2DidV4,
  CharacterContainer9m6,
  S2rbLocalDaemon,
  EIGHT_ENGINE_PLUGINS,
  TaohuayuanGenesisOperationsCenter
} from '../src/index.js';

const daemon = new S2rbLocalDaemon();
const hub = new TaohuayuanGenesisOperationsCenter(daemon);

const commanderDid = mintS2DidV4('D', 'MILES', '261126', '88888888');
const companionDid = mintS2DidV4('V', 'TAOHU', '261126', '00000108');

const container = new CharacterContainer9m6({
  s2Did: commanderDid,
  s2Category: 'HUMAN',
  displayName: 'Miles_Genesis_Commander',
  modality: 'VOLUMETRIC_HUMAN_HOLOGRAM',
  backpackItems: {
    MAT_OBSIDIAN_BLOCK: 16,
    WP_ASHBRINGER_GREATSWORD: 1,
    REL_TAOHUAYUAN_SPIRIT_JADE: 1
  },
  originCurrencies: { EMERALD: 999, WOW_GOLD: 50000 }
});

daemon.registerContainer(container);

for (const targetSuns of [
  'FILM-WA-009-ROMANEMP2-108-2',
  'GAME-CN-002-HONORKING2-005-2',
  'GAME-NA-003-CS2TACTIC2-012-4'
]) {
  daemon.dispatchIpc({
    type: 'CMD_FAST_LOCAL_SINGLETON_JUMP',
    s2Did: container.s2Did,
    targetWorldSuns: targetSuns
  });
}

const pass = hub.issueTaoyuanTravelPass({
  travelerDid: container.s2Did,
  companionDid,
  routeCode: 'TY-ROUTE-01-STAR_PLAZA'
});

const recall = hub.triggerGlobalRedAnchorDrill('Grand Finale Acceptance Verification');
const snapshotPath = process.argv[2];
const exported = container.toContainerManifest();
if (snapshotPath) {
  fs.writeFileSync(snapshotPath, JSON.stringify(exported, null, 2));
}

console.log(
  JSON.stringify(
    {
      mountedEngines: EIGHT_ENGINE_PLUGINS.length,
      issuedPassId: pass.passId,
      entryGateSuns: pass.entryGateSuns,
      globalRedAnchorMs: recall.totalElapsedMs,
      chronicleEvents: exported.chronicleSummary.totalEvents,
      merkleRoot: exported.chronicleSummary.merkleRoot
    },
    null,
    2
  )
);
