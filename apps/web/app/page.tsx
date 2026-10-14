import { S2RB_FREE_NOTICE_EN, S2RB_NAME, S2RB_SERIES } from "../src/config.ts";
import { HomeDesk } from "./home.tsx";

export const metadata = {
  title: `${S2RB_NAME} · ${S2RB_SERIES}`,
  description: S2RB_FREE_NOTICE_EN,
};

export default function HomePage() {
  return <HomeDesk />;
}
