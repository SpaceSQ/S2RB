import { S2RB_FREE_NOTICE_EN } from "../../src/config.ts";
import { NoticeDesk } from "./desk.tsx";

export const metadata = {
  title: "Notice",
  description: S2RB_FREE_NOTICE_EN,
};

export default function NoticePage() {
  return <NoticeDesk />;
}
