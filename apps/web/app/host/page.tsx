import { S2RB_FREE_NOTICE_EN } from "../../src/config.ts";
import { HostDesk } from "./desk.tsx";

export const metadata = {
  title: "Host",
  description: S2RB_FREE_NOTICE_EN,
};

export default function HostPage() {
  return <HostDesk />;
}
