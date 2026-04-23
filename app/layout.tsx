import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '거제반석교회 | 반석 위에 굳게 서는 교회',
  description: '대한예수교장로회 거제반석교회 — 하나님의 손에 붙잡혀 세상을 이기는 교회. 경남 거제시 연초면 소오비길 40-6',
  keywords: '거제반석교회, 반석교회, 거제도교회, 이주민목사, 장로교',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
