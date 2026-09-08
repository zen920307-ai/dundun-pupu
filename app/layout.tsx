import type { Metadata } from 'next';
import './globals.css';
import './collections.css';
import './travel.css';
import HashController from './HashController';
export const metadata: Metadata = {
  title: '墩墩和噗噗 — 不太正经，但超要好。',
  description:
    '设计师拯的原创 IP。一个不想营业，一个非要贴贴。欢迎来到墩墩和噗噗的胡闹现场。',
  icons: { icon: '/media/logo-flat.png', apple: '/media/logo-flat.png' },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <head>
        <link
          rel="preload"
          href="/fonts/duo-mochi.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/duo-round.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        {children}
        <HashController />
      </body>
    </html>
  );
}
