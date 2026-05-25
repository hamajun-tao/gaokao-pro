import type { Metadata } from "next";
import { Noto_Serif_SC, Noto_Sans_SC, ZCOOL_XiaoWei } from "next/font/google";
import "./globals.css";

const serif = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cjk-serif",
  display: "swap",
  preload: false
});
const sans = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-cjk-sans",
  display: "swap",
  preload: false
});
const brush = ZCOOL_XiaoWei({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-cjk-brush",
  display: "swap",
  preload: false
});

export const metadata: Metadata = {
  title: "gaokao.pro · 用 Claude Code 规划你的高考",
  description:
    "中国高考志愿规划 CLI。输入分数 + 省份 + 选科，从 3000+ 所院校里给出冲 / 稳 / 保推荐。本地离线、无需注册、开源，Claude Code / Codex / Cursor 原生支持。",
  metadataBase: new URL("https://gaokao.ha7ch.com"),
  openGraph: {
    title: "gaokao.pro",
    description: "用 Claude Code 规划你的高考。分数进，学校出。",
    url: "https://gaokao.ha7ch.com",
    siteName: "gaokao.pro",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "gaokao.pro",
    description: "高考志愿规划 CLI · 终端里跑。",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className={`${serif.variable} ${sans.variable} ${brush.variable}`}>
      <body>{children}</body>
    </html>
  );
}
