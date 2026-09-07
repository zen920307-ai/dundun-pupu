import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: '墩墩和噗噗 — 不太正经，但超要好。',
  description:
    '设计师拯的原创 IP。一个不想营业，一个非要贴贴。欢迎来到墩墩和噗噗的胡闹现场。',
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
