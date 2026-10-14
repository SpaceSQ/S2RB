import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  S2RB_FREE_NOTICE_EN,
  S2RB_HOME,
  S2RB_NAME,
  S2RB_SERIES,
} from "../src/config.ts";
import { SiteRoot } from "./chrome.tsx";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${S2RB_NAME} · ${S2RB_SERIES}`,
    template: "%s · S2RB",
  },
  description: `${S2RB_FREE_NOTICE_EN} Federation customs for 22-character S2-DID. Not a chat door. Never energizes mains. Does not replace S2 AIOS.`,
  metadataBase: new URL(S2RB_HOME),
  openGraph: {
    title: `${S2RB_NAME} · ${S2RB_SERIES}`,
    description: S2RB_FREE_NOTICE_EN,
    url: S2RB_HOME,
    siteName: "S2RB",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteRoot>{children}</SiteRoot>
      </body>
    </html>
  );
}
