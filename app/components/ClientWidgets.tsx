"use client";
import dynamic from 'next/dynamic';

// ✅ 클라이언트 전용 위젯 래퍼 — SSR 비활성화로 브라우저 API 안전 사용
const ChatbotWidget = dynamic(() => import('@/app/components/ChatbotWidget'), { ssr: false });
const AccessibilityWidget = dynamic(() => import('@/app/components/AccessibilityWidget'), { ssr: false });
const WelcomeEngine = dynamic(() => import('@/app/components/WelcomeEngine'), { ssr: false });

export default function ClientWidgets() {
  return (
    <>
      {/* 좌측 하단: AI 비서 반석이 */}
      <ChatbotWidget />
      {/* 우측 하단: 어르신 전용 돋보기/TTS 위젯 */}
      <AccessibilityWidget />
      {/* 📍 위치 기반 환영 엔진 */}
      <WelcomeEngine />
    </>
  );
}
