import { loadZone } from "../../../../src/taohuayuan.ts";

export const runtime = "nodejs";

export function GET() {
  const url = Boolean(process.env.S2_TAOHUAYUAN_URL?.trim());
  const zone = loadZone() !== null;
  return Response.json({
    ok: true,
    service: "s2rb",
    mains: "deenergized",
    upload: false,
    root: { url, zone },
  });
}
