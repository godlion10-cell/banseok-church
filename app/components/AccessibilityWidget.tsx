"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';

export default function AccessibilityWidget() {
  const [fontLevel, setFontLevel] = useState(0); // 0: 기본, 1: 중간, 2: 최대
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);

    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    // 🧠 반석이 신경망 연결 — 챗봇에서 UI 제어 이벤트 수신
    const handleFontUp = () => changeFontSize('up');
    const handleFontDown = () => changeFontSize('down');
    const handleFontReset = () => { setFontLevel(0); document.documentElement.style.fontSize = '100%'; };
    const handleDarkToggle = () => toggleDarkMode();
    const handleTTS = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.text) {
        speakText(customEvent.detail.text);
      } else {
        handleSpeak();
      }
    };

    window.addEventListener('banseok:font-up', handleFontUp);
    window.addEventListener('banseok:font-down', handleFontDown);
    window.addEventListener('banseok:font-reset', handleFontReset);
    window.addEventListener('banseok:dark-toggle', handleDarkToggle);
    window.addEventListener('banseok:tts', handleTTS);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('banseok:font-up', handleFontUp);
      window.removeEventListener('banseok:font-down', handleFontDown);
      window.removeEventListener('banseok:font-reset', handleFontReset);
      window.removeEventListener('banseok:dark-toggle', handleDarkToggle);
      window.removeEventListener('banseok:tts', handleTTS);
      window.speechSynthesis.cancel();
    };
  }, []);

  // 글자 크기 변경 (3단계)
  const FONT_SIZES = ['100%', '120%', '140%'];
  const changeFontSize = (direction: 'up' | 'down') => {
    setFontLevel(prev => {
      const next = direction === 'up' ? Math.min(prev + 1, 2) : Math.max(prev - 1, 0);
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

  // TTS 음성 읽기
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const koreanVoices = voices.filter(v => v.lang.includes('ko'));
    const bestVoice = koreanVoices.find(v => v.name.includes('Yuna') || v.name.includes('Siri') || v.name.includes('Google') || v.name.includes('Premium'));
    if (bestVoice) utterance.voice = bestVoice;
    else if (koreanVoices.length > 0) utterance.voice = koreanVoices[0];
    utterance.rate = 0.85;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    let textToRead = window.getSelection()?.toString();
    if (!textToRead || textToRead.trim() === "") {
      textToRead = document.body.innerText.substring(0, 500);
    }
    speakText(textToRead);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const closeMenu = () => {
    handleStop();
    setIsOpen(false);
  };

  const btnSize = isMobile ? 50 : 54;
  const mainBtnSize = isMobile ? 60 : 65;

  return (
    <div style={{ position: 'fixed', bottom: isMobile ? '90px' : '30px', right: isMobile ? '15px' : '25px', zIndex: 9998, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>

      {/* 펼쳐진 메뉴 */}
      {isOpen && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', animation: 'fadeInUp 0.3s' }}>

          {/* 🌙 다크모드 */}
          <button onClick={toggleDarkMode} title={isDarkMode ? '주간 모드' : '야간 모드'}
            style={{ ...quickBtnStyle(btnSize), background: isDarkMode ? 'linear-gradient(135deg, #1E40AF, #7C3AED)' : 'linear-gradient(135deg, #1E293B, #334155)', border: isDarkMode ? '2px solid #A78BFA' : '2px solid rgba(255,255,255,0.1)' }}>
            <Image src="/icons/realistic-moon.png" alt="야간모드" width={34} height={34} style={{ objectFit: 'contain', filter: isDarkMode ? 'invert(1) hue-rotate(180deg)' : 'none' }} />
          </button>

          {/* 가+ 가- 글자 크기 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', borderRadius: '28px', padding: '4px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', border: '1px solid rgba(0,0,0,0.06)' }}>
            <button onClick={() => changeFontSize('up')} title="글자 확대"
              style={{ ...innerBtnStyle, opacity: fontLevel >= 2 ? 0.4 : 1 }}>
              <Image src="/icons/realistic-font-up.png" alt="글자확대" width={28} height={28} style={{ objectFit: 'contain' }} />
            </button>
            <div style={{ width: '70%', height: '1px', background: '#E2E8F0', margin: '0 auto' }} />
            <button onClick={() => changeFontSize('down')} title="글자 축소"
              style={{ ...innerBtnStyle, opacity: fontLevel <= 0 ? 0.4 : 1 }}>
              <Image src="/icons/realistic-font-down.png" alt="글자축소" width={28} height={28} style={{ objectFit: 'contain' }} />
            </button>
          </div>

          {/* 🔊 음성 읽기 */}
          <button onClick={isSpeaking ? handleStop : handleSpeak} title={isSpeaking ? '읽기 중지' : '화면 읽어주기'}
            style={{ ...quickBtnStyle(btnSize), background: isSpeaking ? 'linear-gradient(135deg, #DC2626, #EF4444)' : 'linear-gradient(135deg, #D97706, #F59E0B)', animation: isSpeaking ? 'pulse 1.5s infinite' : 'none' }}>
            {isSpeaking ? (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="white"><rect x="6" y="6" width="12" height="12" rx="2"></rect></svg>
            ) : (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
            )}
          </button>
        </div>
      )}

      {/* 🤖 메인 반석이 버튼 */}
      <button
        onClick={isOpen ? closeMenu : () => setIsOpen(true)}
        title="접근성 도우미"
        style={{
          width: mainBtnSize, height: mainBtnSize,
          borderRadius: '50%',
          background: isOpen ? 'linear-gradient(135deg, #475569, #64748B)' : 'linear-gradient(135deg, #0F172A, #1E3A8A)',
          border: '3px solid rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 8px 30px rgba(0,0,0,0.35)',
          transition: 'all 0.3s ease',
          overflow: 'hidden'
        }}
      >
        {isOpen ? (
          <span style={{ fontSize: '1.6rem', color: 'white', fontWeight: 'bold' }}>✕</span>
        ) : (
          <Image src="/icons/realistic-banseok-robot.png" alt="반석이 도우미" width={42} height={42} style={{ objectFit: 'contain' }} />
        )}
      </button>

      {/* 글자 크기 인디케이터 */}
      {fontLevel > 0 && (
        <div style={{ position: 'absolute', top: '-8px', right: '-5px', background: '#EF4444', color: 'white', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: '900', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>
          {fontLevel}
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0% { opacity: 0.8; transform: scale(0.95); } 50% { opacity: 1; transform: scale(1.05); } 100% { opacity: 0.8; transform: scale(0.95); } }
      `}} />
    </div>
  );
}

const quickBtnStyle = (size: number): React.CSSProperties => ({
  width: size, height: size,
  borderRadius: '50%',
  color: 'white', border: 'none',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer',
  boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
  transition: 'all 0.25s ease',
  overflow: 'hidden'
});

const innerBtnStyle: React.CSSProperties = {
  padding: '8px',
  background: 'transparent',
  border: 'none',
  borderRadius: '50%',
  cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: '0.2s'
};
