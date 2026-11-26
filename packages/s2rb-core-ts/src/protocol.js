// WP-01: S2RB Protocol Kernel (S2-DID v4.0, CD-U6A 6-Segment SUNS, 14 Elements & Silicon Three Laws)

export const GENESIS_HUB_ADDRESS = 'META-CN-001-TAOHUAYUAN2-001-2';
export const GENESIS_LANDMARK_CODE = 'TC-001-ARCH';

export const VALID_S2_CATEGORIES = Object.freeze([
  'HUMAN', 'SILICON', 'SPACE', 'THING', 'ORG', 'RULE', 'MYTH'
]);

export const VALID_L1_ROOTS = Object.freeze([
  'FILM', 'MARS', 'META', 'MYTH', 'ACGN', 'GAME', 'PHYS', 'MOON', 'STAR', 'ZERO'
]);

export const VALID_L2_SECTORS = Object.freeze([
  'CN', 'EA', 'WA', 'NA', 'SA', 'NE', 'NW', 'SE', 'SW'
]);

export const FOURTEEN_ELEMENTS_DICT = Object.freeze([
  { code: 'E01_LUMINA', group: 'EXPLICIT', nameZh: '光影与视觉场', overlayZh: '原生画风着色器/闪光抗性/5%棱镜光栅' },
  { code: 'E02_ATMOS', group: 'EXPLICIT', nameZh: '气象与空气呼吸生态', overlayZh: '9.6m³微氧维生池(360s)/水下真空呼吸续航' },
  { code: 'E03_ACOUSTIC', group: 'EXPLICIT', nameZh: '声学与次声波场', overlayZh: '专属战吼/静步消音/硅基副官声纹雷达' },
  { code: 'E04_THERMAL', group: 'EXPLICIT', nameZh: '热力学与温控场', overlayZh: '冰火抗性缓冲池/技能过热散热加速率' },
  { code: 'E05_MOMENTUM', group: 'EXPLICIT', nameZh: '物理动量与机械冲击', overlayZh: '刚体质量/冲刺动量/受击硬直韧性(Poise)' },
  { code: 'E06_METABOLIC', group: 'EXPLICIT', nameZh: '代谢功耗与能源网格', overlayZh: '法力/能量/耐力回复速率与副官算力配额' },
  { code: 'E07_BIOSENSOR', group: 'IMPLICIT', nameZh: '生物迹象与生命体征', overlayZh: '核心生命值(HP)/护盾/流血中毒净化状态机' },
  { code: 'E08_WAVE', group: 'IMPLICIT', nameZh: '电磁波与频谱通信场', overlayZh: '跨界迷雾侦测半径/加密战术频道/EMP抗性' },
  { code: 'E09_ODOR', group: 'IMPLICIT', nameZh: '嗅觉化学感与生化毒理', overlayZh: '炼金药水光环/气味追踪印记/瘴气毒雾免疫' },
  { code: 'E10_VIBRATION', group: 'IMPLICIT', nameZh: '微震与空间结构应力', overlayZh: '重击震地耦合/手柄高精力反馈/9.6m³护罩完整度' },
  { code: 'E11_HYDRO_NUTRIENT', group: 'IMPLICIT', nameZh: '水资源与能量补给链', overlayZh: '药水金苹果补给槽/持续回血灵泉/饥渴维生' },
  { code: 'E12_LOGIC_MEMORY', group: 'IMPLICIT', nameZh: '逻辑知识与历史记忆真实', overlayZh: '技能树/跨界融合技/Chronicle编年史Merkle根' },
  { code: 'E13_SOCIAL_TRUST', group: 'IMPLICIT', nameZh: '社会契约与群体阵营共识', overlayZh: '公会徽记/跨界荣誉墙/Tier1-3世界信誉污点隔离' },
  { code: 'E14_CARBON_SOVEREIGNTY', group: 'IMPLICIT', nameZh: '碳基伦理与终极决策主权', overlayZh: '22位S2-DID根私钥/5N-3ms红锚召回/原世界货币冻结锁' }
]);

export function validateS2Category(cat) {
  if (cat === 'MATH') {
    throw new Error('S2RB_TAXONOMY_ERROR: 7th category is strictly MYTH (never MATH)');
  }
  if (!VALID_S2_CATEGORIES.includes(cat)) {
    throw new Error(`S2RB_TAXONOMY_ERROR: Unknown category "${cat}"`);
  }
  return cat;
}

export function computeS2DidChecksumV4(body20) {
  const wHi = [7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83];
  const wLo = [89, 83, 79, 73, 71, 67, 61, 59, 53, 47, 43, 41, 37, 31, 29, 23, 19, 17, 13, 11];
  let accHi = 0x5242;
  let accLo = 0x5332;
  for (let i = 0; i < 20; i++) {
    const code = body20.charCodeAt(i);
    accHi = (accHi + Math.imul(code, wHi[i])) >>> 0;
    accLo = (accLo + Math.imul(code ^ (i * 7), wLo[i])) >>> 0;
  }
  return String.fromCharCode(65 + (accHi % 26)) + String.fromCharCode(65 + (accLo % 26));
}

export function mintS2DidV4(species, origin5, yymmdd, serial8) {
  const sp = String(species).toUpperCase();
  if (!['D', 'V', 'I', 'A'].includes(sp)) {
    throw new Error(`S2RB_DID_ERROR: Invalid species prefix "${sp}"`);
  }
  const org = String(origin5).toUpperCase();
  if (!/^[A-Z0-9]{5}$/.test(org)) {
    throw new Error(`S2RB_DID_ERROR: Origin tag must be 5 alphanumeric chars, got "${org}"`);
  }
  if (!/^\d{6}$/.test(yymmdd)) {
    throw new Error(`S2RB_DID_ERROR: Date segment must be 6 digits YYMMDD`);
  }
  if (!/^\d{8}$/.test(serial8)) {
    throw new Error(`S2RB_DID_ERROR: Serial segment must be 8 digits`);
  }
  const body20 = `${sp}${org}${yymmdd}${serial8}`;
  const chk = computeS2DidChecksumV4(body20);
  return `${body20}${chk}`;
}

export function parseOrMigrateS2Did(rawDid, strictChecksum = true) {
  const up = String(rawDid || '').trim().toUpperCase();
  if (up.length !== 22) {
    throw new Error(`S2RB_DID_ERROR: S2-DID must be strictly 22 chars (got ${up.length})`);
  }
  const species = up[0];
  if (!['D', 'V', 'I', 'A'].includes(species)) {
    throw new Error(`S2RB_DID_ERROR: Invalid species class "${species}"`);
  }
  const originTag = up.slice(1, 6);
  const yymmdd = up.slice(6, 12);
  if (!/^[A-Z0-9]{5}$/.test(originTag) || !/^\d{6}$/.test(yymmdd)) {
    throw new Error(`S2RB_DID_ERROR: Malformed header in "${up}"`);
  }

  // Detect v3.0 legacy layout (checksum letters at indices 12..14, 8 digits at 14..22)
  const isV3Legacy = /^[A-Z]{2}$/.test(up.slice(12, 14)) && /^\d{8}$/.test(up.slice(14, 22));
  let serial;
  let checksum;
  let migratedFromV3 = false;

  if (isV3Legacy) {
    serial = up.slice(14, 22);
    const body20 = `${species}${originTag}${yymmdd}${serial}`;
    checksum = computeS2DidChecksumV4(body20);
    migratedFromV3 = true;
  } else {
    serial = up.slice(12, 20);
    checksum = up.slice(20, 22);
    if (!/^\d{8}$/.test(serial) || !/^[A-Z]{2}$/.test(checksum)) {
      throw new Error(`S2RB_DID_ERROR: Invalid v4 serial or checksum format in "${up}"`);
    }
    const expected = computeS2DidChecksumV4(up.slice(0, 20));
    if (strictChecksum && checksum !== expected) {
      throw new Error(`S2RB_DID_CHECKSUM_MISMATCH: expected ${expected}, got ${checksum}`);
    }
  }

  const canonical = `${species}${originTag}${yymmdd}${serial}${checksum}`;
  return {
    did: canonical,
    species,
    originTag,
    yymmdd,
    serial,
    checksum,
    migratedFromV3
  };
}

export function parseSunsAddress(rawAddr) {
  const up = String(rawAddr || '').trim().toUpperCase();
  const parts = up.split('-');
  if (parts.length !== 6) {
    throw new Error(`S2RB_SUNS_ERROR: Expected 6 segments separated by '-', got ${parts.length}`);
  }
  const [l1, l2, l3Raw, l4Full, l5Raw, l6Raw] = parts;
  if (!VALID_L1_ROOTS.includes(l1)) {
    throw new Error(`S2RB_SUNS_ERROR: Invalid L1 root "${l1}"`);
  }
  if (!VALID_L2_SECTORS.includes(l2)) {
    throw new Error(`S2RB_SUNS_ERROR: Invalid L2 sector "${l2}"`);
  }
  if (!/^\d{3}$/.test(l3Raw) || Number(l3Raw) < 1 || Number(l3Raw) > 999) {
    throw new Error(`S2RB_SUNS_ERROR: Invalid L3 grid "${l3Raw}"`);
  }
  if (!/^[A-Z0-9]{2,}\d$/.test(l4Full)) {
    throw new Error(`S2RB_SUNS_ERROR: Invalid L4 sovereign+check "${l4Full}"`);
  }
  const l4Sovereign = l4Full.slice(0, -1);
  const l4CheckDigit = Number(l4Full.slice(-1));
  const l5Room = Number(l5Raw);
  const l6Berth = Number(l6Raw);
  if (!Number.isInteger(l5Room) || l5Room < 1 || l5Room > 99999) {
    throw new Error(`S2RB_SUNS_ERROR: Invalid L5 room "${l5Raw}"`);
  }
  if (!Number.isInteger(l6Berth) || l6Berth < 2 || l6Berth > 9) {
    throw new Error(`S2RB_SUNS_ERROR: L6 berth must be in [2..9], got "${l6Raw}"`);
  }
  return {
    canonical: `${l1}-${l2}-${l3Raw.padStart(3, '0')}-${l4Sovereign}${l4CheckDigit}-${String(l5Room).padStart(3, '0')}-${l6Berth}`,
    l1,
    l2,
    l3Grid: Number(l3Raw),
    l4Sovereign,
    l4CheckDigit,
    l5Room,
    l6Berth,
    isPublicCommons: l2 === 'CN' && Number(l3Raw) >= 1 && Number(l3Raw) <= 9
  };
}

/**
 * Divergent Module 02: Affine Coordinate Basis Transformer across game engines.
 * Canonical S2-Container: Right-Handed, +X Right, +Y Forward, +Z Up ([0..2.4m]), Meters.
 */
export function convertContainerPointToHost(pointS2Meters, convention, hostAvatarScale = 1.0) {
  const [x, y, z] = pointS2Meters.map((v) => v * hostAvatarScale);
  switch (convention) {
    case 'S2_CANONICAL_Z_UP_M':
      return [x, y, z];
    case 'UNREAL_LEFT_Z_UP_CM':
      return [y * 100.0, x * 100.0, z * 100.0];
    case 'UNITY_LEFT_Y_UP_M':
      return [x, z, y];
    case 'GLTF_RIGHT_Y_UP_M':
      return [x, z, -y];
    case 'SOURCE2_RIGHT_Z_UP_INCH':
      return [x / 0.0254, y / 0.0254, z / 0.0254];
    default:
      throw new Error(`Unsupported engine convention: ${convention}`);
  }
}

export function assertZeroCurrencyImport(attemptedAmount) {
  if (typeof attemptedAmount !== 'number' || !Number.isFinite(attemptedAmount) || Math.abs(attemptedAmount) > 0) {
    throw new Error(
      `S2RB_ERR_403_CURRENCY_IMPORT_FORBIDDEN: Cross-world currency import is hard-locked to 0 (attempted: ${attemptedAmount})`
    );
  }
  return Object.freeze({ importedAmount: 0, lockedInOriginVault: true });
}
