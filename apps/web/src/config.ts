export const S2RB_NAME = "S2 Rainbow Bridge";
export const S2RB_SHORT = "S2RB";
export const S2RB_HOME = "https://s2rb.space2.world";
export const S2RB_REPO = "https://github.com/SpaceSQ/S2RB";
export const S2RB_VERCEL = "https://vercel.com/spacesqs-projects/s2-rb";
/** Official S2 AIOS site. Bare origin only — a path or directory will not load. */
export const S2AIOS_HOME = "https://s2aios.space2.world";
/** Source repository. Footer copyright credit, not the public desk. */
export const S2AIOS_REPO = "https://github.com/SpaceSQ/S2AIOS";

/** Series plate. Stamped on the public desk and in metadata. */
export const S2RB_SERIES = "S2-NF-001";
export const S2RB_AUTHORITY = "ROBOTZERO";
export const S2RB_AUTHORITY_ZH = "广州零号软件科技有限公司";
export const S2RB_AUTHORITY_EN = "Guangzhou Linghao Software Technology Co., Ltd.";

/** Hardcoded on every surface, including About. */
export const S2RB_FREE_NOTICE =
  "S2RB 仅限个人免费使用，严禁商用、打包及修改后二次销售";

export const S2RB_FREE_NOTICE_EN =
  "S2RB is free for personal use only. Commercial use, repackaging, and resale of modified copies are forbidden.";

/** Local SITE fixture used on the desk. Not a cloud row. */
export const SITE_EXAMPLE = "SITE-GZTIANHE-TIYUXILU-SHEJIDASHA-ROOM01-01";

/** App Store reviewer fixture. Skips LAN discovery and injects local virtual devices. */
export const REVIEWER_EMAIL = "apple@robot0.com";

export const LOCAL_DOMAINS = ["MARS", "MOON", "PHYS", "GAME", "SITE", "MYTH"] as const;
export type LocalDomain = (typeof LOCAL_DOMAINS)[number];

export const TAOHUAYUAN_ROOT = {
  code: "TAOHUAYUAN",
  locale: "CN-HUNAN-CHANGDE",
  title: "桃花源根节点",
} as const;
