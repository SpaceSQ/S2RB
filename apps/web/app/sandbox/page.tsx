import { S2RB_FREE_NOTICE_EN } from "../../src/config.ts";
import { SandboxDesk } from "./desk.tsx";

export const metadata = {
  title: "Red Anchor",
  description: S2RB_FREE_NOTICE_EN,
};

export default function SandboxPage() {
  return <SandboxDesk />;
}
