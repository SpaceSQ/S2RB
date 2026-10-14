export const REQUEST_ACTUATION = "request_actuation";
export const GET_EXTENSION_STATUS = "get_extension_status";

/** Office agents may ask. The fuse always holds. Mains stay dark. */
export function requestActuation(_input: { axis?: string; grid?: number } = {}) {
  return {
    ok: false as const,
    tool: REQUEST_ACTUATION,
    code: "VETO_SECURITY" as const,
    mains: "deenergized" as const,
    upload: false as const,
    actuation: "TRUSTZONE" as const,
  };
}
