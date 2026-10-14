import { S2RB_FREE_NOTICE_EN } from "../../src/config.ts";
import { AboutDesk } from "./desk.tsx";

export const metadata = {
  title: "About",
  description: S2RB_FREE_NOTICE_EN,
};

export default function AboutPage() {
  return <AboutDesk />;
}
