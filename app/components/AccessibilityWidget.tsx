"use client";
import React, { useState, useEffect } from 'react';

export default function AccessibilityWidget() {
  const [isBigFont, setIsBigFont] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleBigFont = () => {
    setIsBigFont(!isBigFont);
    document.documentElement.style.fontSize = !isBigFont ? '115%' : '100%';
  };

  const speakContent = () => {
    if (!('speechSynthesis' in window)) {
      alert("현재 사용 중인 기기(브라우저)는 음성 읽어주기를 지원하지 않습니다.");
      return;
    }
    window.speechSynthesis.cancel();
    const textToRead = document.body.innerText.substring(0, 300);
    const utterance = new SpeechSynthesisUtterance("화면을 읽어드립니다. " + textToRead);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
    alert("🔊 화면을 읽어드립니다. 폰의 미디어 볼륨을 올려주세요.");
  };

  return (
    <div style={{ position: 'fixed', bottom: isMobile ? '20px' : '30px', right: isMobile ? '20px' : '30px', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
      
      {isOpen && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', animation: 'fadeInUp 0.3s' }}>
          <button onClick={toggleBigFont} style={{ padding: '10px', borderRadius: '50%', background: '#1E3A8A', color: 'white', border: 'none', width: isMobile ? '55px' : '60px', height: isMobile ? '55px' : '60px', fontSize: '1.4rem', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', touchAction: 'manipulation' }}>
            {isBigFont ? 'A' : 'a'}
          </button>
          <button onClick={speakContent} style={{ padding: '10px', borderRadius: '50%', background: '#D97706', color: 'white', border: 'none', width: isMobile ? '55px' : '60px', height: isMobile ? '55px' : '60px', fontSize: '1.4rem', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', touchAction: 'manipulation' }}>
            🔊
          </button>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ padding: '10px', borderRadius: '50%', background: '#0F172A', color: 'white', border: 'none', width: isMobile ? '60px' : '65px', height: isMobile ? '60px' : '65px', fontSize: '1.8rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.4)', transition: 'transform 0.2s', touchAction: 'manipulation' }}>
        {isOpen ? '✖' : '🧓'}
      </button>

      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
