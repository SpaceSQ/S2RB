export const S2RB_NAME = "S2 Rainbow Bridge";
export const S2RB_SHORT = "S2RB";
export const S2RB_HOME = "https://s2rb.space2.world";
export const S2RB_REPO = "https://github.com/SpaceSQ/S2RB";
export const S2RB_VERCEL = "https://vercel.com/spacesqs-projects/s2-rb";

/** Hardcoded on every surface, including About. */
export const S2RB_FREE_NOTICE =
  "S2RB 仅限个人免费使用，严禁商用、打包及修改后二次销售";

export const S2RB_FREE_NOTICE_EN =
  "S2RB is free for personal use only. Commercial use, repackaging, and resale of modified copies are forbidden.";

/** App Store reviewer fixture. Skips LAN discovery and injects local virtual devices. */
export const REVIEWER_EMAIL = "apple@robot0.com";

export const LOCAL_DOMAINS = ["MARS", "MOON", "PHYS", "GAME", "SITE", "MYTH"] as const;
export type LocalDomain = (typeof LOCAL_DOMAINS)[number];

export const TAOHUAYUAN_ROOT = {
  code: "TAOHUAYUAN",
  locale: "CN-HUNAN-CHANGDE",
  title: "桃花源根节点",
} as const;
