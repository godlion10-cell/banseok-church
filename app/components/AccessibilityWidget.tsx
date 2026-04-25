"use client";
import React, { useState, useEffect } from 'react';

export default function AccessibilityWidget() {
  const [isBigFont, setIsBigFont] = useState(false);
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

    return () => {
      window.removeEventListener('resize', handleResize);
      window.speechSynthesis.cancel();
    };
  }, []);

  const toggleBigFont = () => {
    setIsBigFont(!isBigFont);
    document.documentElement.style.fontSize = !isBigFont ? '115%' : '100%';
  };

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    let textToRead = window.getSelection()?.toString();
    if (!textToRead || textToRead.trim() === "") {
      textToRead = document.body.innerText.substring(0, 500);
      alert("선택한 문장이 없어 화면 상단부터 읽어드립니다. 특정 부분을 선택(드래그)하고 누르시면 그 부분만 읽어드려요!");
    }

    const utterance = new SpeechSynthesisUtterance(textToRead);
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

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const closeMenu = () => {
    handleStop();
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'fixed', bottom: isMobile ? '20px' : '30px', right: isMobile ? '20px' : '30px', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
      
      {isOpen && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', animation: 'fadeInUp 0.3s' }}>
          <button onClick={toggleBigFont} style={btnStyle(isMobile, '#1E3A8A')}>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{isBigFont ? '가' : '가+'}</span>
          </button>
          
          <button onClick={isSpeaking ? handleStop : handleSpeak} style={btnStyle(isMobile, isSpeaking ? '#EF4444' : '#D97706')}>
            {isSpeaking ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><rect x="6" y="6" width="12" height="12"></rect></svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
            )}
          </button>
        </div>
      )}

      <button 
        onClick={isOpen ? closeMenu : () => setIsOpen(true)}
        style={mainBtnStyle(isMobile, isOpen ? '#4B5563' : '#0F172A')}>
        {isOpen ? (
          <span style={{ fontSize: '1.5rem' }}>✕</span>
        ) : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
        )}
      </button>

      <style dangerouslySetInnerHTML={{ __html: `@keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }` }} />
    </div>
  );
}

const btnStyle = (isMobile: boolean, bg: string): React.CSSProperties => ({
  width: isMobile ? '55px' : '60px',
  height: isMobile ? '55px' : '60px',
  borderRadius: '50%',
  background: bg,
  color: 'white',
  border: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
  transition: '0.2s'
});

const mainBtnStyle = (isMobile: boolean, bg: string): React.CSSProperties => ({
  width: isMobile ? '60px' : '65px',
  height: isMobile ? '60px' : '65px',
  borderRadius: '50%',
  background: bg,
  color: 'white',
  border: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
  transition: '0.3s'
});
