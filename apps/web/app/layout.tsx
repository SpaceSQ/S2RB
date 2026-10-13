import type { ReactNode } from "react";
import { S2RB_FREE_NOTICE, S2RB_HOME, S2RB_NAME } from "../src/config.ts";
import "./globals.css";

export const metadata = {
  title: S2RB_NAME,
  description: S2RB_FREE_NOTICE,
  metadataBase: new URL(S2RB_HOME),
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="shell">
          <nav>
            <a href="/">解析</a>
            <a href="/sandbox">红锚</a>
            <a href="/about">关于</a>
          </nav>
          {children}
        </div>
      </body>
    </html>
  );
}
