"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';

export default function AccessibilityWidget() {
  const [fontLevel, setFontLevel] = useState(0); // 0: 기본, 1: 중간, 2: 최대
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);

    // 🧠 반석이 신경망 — 챗봇에서 UI 제어 이벤트 수신
    const handleFontUp = () => changeFontSize('up');
    const handleFontDown = () => changeFontSize('down');
    const handleFontReset = () => { setFontLevel(0); document.documentElement.style.fontSize = '100%'; };
    const handleDarkToggle = () => toggleDarkMode();

    window.addEventListener('banseok:font-up', handleFontUp);
    window.addEventListener('banseok:font-down', handleFontDown);
    window.addEventListener('banseok:font-reset', handleFontReset);
    window.addEventListener('banseok:dark-toggle', handleDarkToggle);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('banseok:font-up', handleFontUp);
      window.removeEventListener('banseok:font-down', handleFontDown);
      window.removeEventListener('banseok:font-reset', handleFontReset);
      window.removeEventListener('banseok:dark-toggle', handleDarkToggle);
    };
  }, []);

  // 글자 크기 3단계 순환 (100% → 120% → 140% → 100%)
  const FONT_SIZES = ['100%', '120%', '140%'];
  const FONT_LABELS = ['기본', '크게', '최대'];
  const changeFontSize = (direction: 'up' | 'down' | 'cycle') => {
    setFontLevel(prev => {
      let next: number;
      if (direction === 'cycle') {
        next = (prev + 1) % 3;
      } else {
        next = direction === 'up' ? Math.min(prev + 1, 2) : Math.max(prev - 1, 0);
      }
      document.documentElement.style.fontSize = FONT_SIZES[next];
      return next;
    });
  };

  // 다크모드 토글
  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      if (next) {
        document.documentElement.style.filter = 'invert(0.88) hue-rotate(180deg)';
        document.querySelectorAll('img, video, svg, canvas').forEach(el => {
          (el as HTMLElement).style.filter = 'invert(1) hue-rotate(180deg)';
        });
      } else {
        document.documentElement.style.filter = 'none';
        document.querySelectorAll('img, video, svg, canvas').forEach(el => {
          (el as HTMLElement).style.filter = 'none';
        });
      }
      return next;
    });
  };

  // 반석이 챗봇 열기
  const openChatbot = () => {
    // ChatbotWidget의 토글 버튼 클릭 이벤트 시뮬레이션
    const chatBtn = document.querySelector('[data-chatbot-toggle]') as HTMLElement;
    if (chatBtn) {
      chatBtn.click();
    } else {
      // 폴백: 커스텀 이벤트
      window.dispatchEvent(new Event('banseok:open-chatbot'));
    }
  };

  const btnSize = isMobile ? 48 : 52;

  return (
    <>
      <div style={{
        position: 'fixed',
        bottom: isMobile ? '90px' : '30px',
        right: isMobile ? '12px' : '22px',
        zIndex: 9998,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px'
      }}>
        {/* ① A/a 돋보기 — 글자 크기 순환 */}
        <button
          onClick={() => changeFontSize('cycle')}
          title={`글자 크기: ${FONT_LABELS[fontLevel]}`}
          style={{
            position: 'relative',
            width: btnSize, height: btnSize,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(12px)',
            border: fontLevel > 0 ? '2px solid #3B82F6' : '1px solid rgba(0,0,0,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            transition: 'all 0.25s ease'
          }}
        >
          <Image src="/icons/realistic-font-control.png" alt="글자크기" width={32} height={32} style={{ objectFit: 'contain' }} />
          {/* 레벨 인디케이터 */}
          {fontLevel > 0 && (
            <span style={{
              position: 'absolute', top: '-4px', right: '-4px',
              background: '#3B82F6', color: 'white',
              borderRadius: '50%', width: '18px', height: '18px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.6rem', fontWeight: '900',
              boxShadow: '0 2px 6px rgba(59,130,246,0.4)'
            }}>
              {fontLevel}
            </span>
          )}
        </button>

        {/* ② 달 모양 — 다크모드 토글 */}
        <button
          onClick={toggleDarkMode}
          title={isDarkMode ? '주간 모드' : '야간 모드'}
          style={{
            width: btnSize, height: btnSize,
            borderRadius: '50%',
            background: isDarkMode ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(12px)',
            border: isDarkMode ? '2px solid #A78BFA' : '1px solid rgba(0,0,0,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: isDarkMode ? '0 4px 20px rgba(167,139,250,0.3)' : '0 4px 20px rgba(0,0,0,0.12)',
            transition: 'all 0.25s ease'
          }}
        >
          <Image
            src="/icons/realistic-moon.png"
            alt="야간모드"
            width={30} height={30}
            style={{ objectFit: 'contain', filter: isDarkMode ? 'invert(1) hue-rotate(180deg)' : 'none' }}
          />
        </button>

        {/* ③ 반석이 로봇 — 챗봇 열기 (가장 크고 화려하게) */}
        <button
          onClick={openChatbot}
          title="반석이와 대화하기"
          style={{
            width: btnSize + 10, height: btnSize + 10,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0F172A, #1E3A8A)',
            border: '3px solid rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 6px 25px rgba(15,23,42,0.35)',
            transition: 'all 0.3s ease',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Image src="/icons/realistic-banseok-robot.png" alt="반석이" width={40} height={40} style={{ objectFit: 'contain' }} />
        </button>
      </div>
    </>
  );
}
