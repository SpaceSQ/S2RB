export declare const GENESIS_HUB_ADDRESS: string;
export declare const GENESIS_LANDMARK_CODE: string;
export declare const VALID_S2_CATEGORIES: readonly string[];
export declare const FOURTEEN_ELEMENTS_DICT: ReadonlyArray<{
  code: string;
  group: 'EXPLICIT' | 'IMPLICIT';
  nameZh: string;
  overlayZh: string;
}>;
export declare function validateS2Category(cat: string): string;
export declare function computeS2DidChecksumV4(body20: string): string;
export declare function mintS2DidV4(species: string, origin5: string, yymmdd: string, serial8: string): string;
export declare function parseOrMigrateS2Did(rawDid: string, strictChecksum?: boolean): {
  did: string;
  species: string;
  originTag: string;
  yymmdd: string;
  serial: string;
  checksum: string;
  migratedFromV3: boolean;
};
export declare function parseSunsAddress(rawAddr: string): {
  canonical: string;
  l1: string;
  l2: string;
  l3Grid: number;
  l4Sovereign: string;
  l4CheckDigit: number;
  l5Room: number;
  l6Berth: number;
  isPublicCommons: boolean;
};
export declare function convertContainerPointToHost(
  pointS2Meters: [number, number, number],
  convention: string,
  hostAvatarScale?: number
): [number, number, number];
export declare function assertZeroCurrencyImport(attemptedAmount: number): Readonly<{
  importedAmount: 0;
  lockedInOriginVault: true;
}>;
