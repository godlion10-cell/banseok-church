import type { Metadata, Viewport } from 'next';
import './globals.css';
// ✅ 스마트 엔진들
import ChatbotWidget from '@/app/components/ChatbotWidget';
import AccessibilityWidget from '@/app/components/AccessibilityWidget';
import WelcomeEngine from '@/app/components/WelcomeEngine';

export const metadata: Metadata = {
  title: '거제반석교회 - 스마트 성전',
  description: '영적 순례의 길과 AI 비서가 함께하는 거제반석교회입니다.',
  keywords: '거제반석교회, 반석교회, 거제도교회, 이주민목사, 장로교',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '반석교회',
  },
};

export const viewport: Viewport = {
  themeColor: '#5C3A40',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="icon" href="/icon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="반석교회" />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        {/* 실제 홈페이지 콘텐츠 */}
        <main>
          {children}
        </main>

        {/* 🚨 스마트 엔진 배치 — 스크롤 내려도 화면에 항상 고정 */}
        {/* 좌측 하단: AI 비서 반석이 */}
        <ChatbotWidget />
        {/* 우측 하단: 어르신 전용 돋보기/TTS 위젯 */}
        <AccessibilityWidget />
        {/* 📍 위치 기반 환영 엔진 */}
        <WelcomeEngine />
      </body>
    </html>
  );
}
