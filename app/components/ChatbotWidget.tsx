"use client";
import React, { useState, useEffect, useRef } from 'react';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isVoiceAndViewOn, setIsVoiceAndViewOn] = useState(false); 
  const [largeSubtitle, setLargeSubtitle] = useState('');
  const [isListening, setIsListening] = useState(false);

  const [messages, setMessages] = useState<{sender: 'bot'|'user', text: string, isAction?: boolean}[]>([
    { sender: 'bot', text: '샬롬! AI 비서 반석이입니다. 😊\n\n🎤 하단 마이크 버튼을 누르고 "예배 순서 알려줘", "설교 틀어줘"라고 편하게 말씀해 보세요!' }
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
        window.removeEventListener('resize', handleResize);
        window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const speakAndView = (text: string) => {
    if (!isVoiceAndViewOn) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.9; 
    setLargeSubtitle(text);
    utterance.onend = () => setLargeSubtitle('');
    utterance.onerror = () => setLargeSubtitle('');
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeakAndView = () => {
    window.speechSynthesis.cancel();
    setLargeSubtitle('');
  };

  const analyzeAndRespond = (userText: string) => {
    let botReply = "죄송해요, 아직 제가 배우는 중이라 그 부분은 잘 모르겠어요. 목사님이나 교역자님께 연결해 드릴까요?";
    let isAction = false;

    if (userText.includes("예배") && userText.includes("순서")) {
      botReply = "이번 주 주일예배 순서입니다.\n1. 묵도 및 기원\n2. 찬송 (장)\n3. 참회의 기도\n4. 성경봉독\n5. 목사님 설교\n6. 헌금\n7. 축도\n\n은혜로운 예배 되시기를 기도합니다.";
    } else if (userText.includes("설교") || userText.includes("말씀")) {
      botReply = "지난주 담임목사님의 은혜로운 주일 설교 영상입니다. 아래 버튼을 누르시면 바로 재생됩니다.";
      isAction = true;
    } else if (userText.includes("예배") && userText.includes("시간")) {
      botReply = "주일 1부 예배는 오전 9시, 2부는 11시입니다. 수요예배는 저녁 7시 30분입니다.";
    } else if (userText.includes("헌금")) {
      botReply = "온라인 헌금 계좌는 농협 123-4567-8901 (거제반석교회) 입니다.";
    }

    setTimeout(() => {
      setMessages(prev => [...prev, { sender: 'bot', text: botReply, isAction }]);
      speakAndView(botReply);
    }, 600);
  };

  const handleUserMessage = (text: string) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { sender: 'user', text }]);
    analyzeAndRespond(text);
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("현재 사용 중인 브라우저는 음성 인식(마이크)을 지원하지 않습니다. 네이버나 크롬 앱을 이용해주세요.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      handleUserMessage(transcript);
    };
    recognition.onerror = (e: any) => {
      console.error(e);
      alert("음성 인식 중 오류가 발생했습니다. 마이크 권한을 허용했는지 확인해 주세요.");
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const onSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputRef.current) {
      handleUserMessage(inputRef.current.value);
      inputRef.current.value = '';
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMessages(prev => [...prev, { sender: 'user', text: `📎 파일: ${file.name}` }]);
      setTimeout(() => {
        const reply = "파일이 접수되었습니다!";
        setMessages(prev => [...prev, { sender: 'bot', text: reply }]);
        speakAndView(reply);
      }, 800);
    }
  };

  return (
    <>
      {/* 대형 자막 오버레이 */}
      {largeSubtitle && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.95)', zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', animation: 'fadeIn 0.4s ease-out' }}>
          <div style={{ maxWidth: '800px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '30px', animation: 'pulse 1.5s infinite' }}>🔊</div>
            <div style={{ color: 'white', fontSize: isMobile ? '1.8rem' : '3rem', fontWeight: '900', lineHeight: '1.5', wordBreak: 'keep-all' }}>{largeSubtitle}</div>
            <button onClick={stopSpeakAndView} style={{ marginTop: '50px', padding: '15px 40px', background: '#EF4444', color: 'white', border: 'none', borderRadius: '30px', fontSize: '1.2rem', cursor: 'pointer' }}>닫기 (정지)</button>
          </div>
        </div>
      )}

      {/* 챗봇 창 */}
      <div style={{ position: 'fixed', bottom: isMobile ? '20px' : '30px', left: isMobile ? '20px' : '30px', zIndex: 9998 }}>
        
        {isOpen && (
          <div style={{ width: isMobile ? 'calc(100vw - 40px)' : '360px', height: '520px', background: 'white', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', overflow: 'hidden', marginBottom: '15px', border: '1px solid #F1F5F9', animation: 'fadeInUp 0.3s' }}>
            
            {/* 헤더 */}
            <div style={{ background: '#1E3A8A', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 'bold' }}>🤖 AI 반석이 (음성지원)</div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button onClick={() => { setIsVoiceAndViewOn(!isVoiceAndViewOn); if(isVoiceAndViewOn) stopSpeakAndView(); }} style={{ background: isVoiceAndViewOn ? '#10B981' : '#475569', border: 'none', color: 'white', padding: '6px 10px', borderRadius: '20px', fontSize: '0.8rem', cursor: 'pointer' }}>
                  {isVoiceAndViewOn ? '🔊 자막/음성 ON' : '🔇 텍스트 전용'}
                </button>
                <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
              </div>
            </div>

            {/* 대화 영역 */}
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', background: '#F8FAFC' }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                  <div style={{ padding: '12px 16px', borderRadius: '18px', fontSize: '0.95rem', whiteSpace: 'pre-line',
                    background: msg.sender === 'user' ? '#1E3A8A' : 'white', color: msg.sender === 'user' ? 'white' : '#334155', border: msg.sender === 'bot' ? '1px solid #E2E8F0' : 'none' }}>
                    {msg.text}
                  </div>
                  {msg.isAction && (
                    <div style={{ marginTop: '5px', textAlign: 'left' }}>
                      <button style={{ padding: '8px 15px', background: '#EF4444', color: 'white', border: 'none', borderRadius: '15px', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        ▶️ 지난주 설교 보기
                      </button>
                    </div>
                  )}
                </div>
              ))}
              
              {isListening && (
                <div style={{ alignSelf: 'flex-start', padding: '10px 15px', background: '#DBEAFE', color: '#1D4ED8', borderRadius: '18px', fontSize: '0.9rem', animation: 'pulse 1s infinite' }}>
                  듣고 있습니다... 말씀해 주세요 🎤
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 하단 입력 */}
            <div style={{ padding: '10px 15px', background: 'white', borderTop: '1px solid #F1F5F9' }}>
              <form onSubmit={onSubmitForm} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
                <button type="button" onClick={() => fileInputRef.current?.click()} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '38px', height: '38px', cursor: 'pointer', fontSize: '1.2rem' }}>📎</button>
                <button type="button" onClick={startListening} style={{ background: isListening ? '#EF4444' : '#3B82F6', color: 'white', border: 'none', borderRadius: '50%', width: '38px', height: '38px', cursor: 'pointer', fontSize: '1.1rem', transition: '0.3s', boxShadow: isListening ? '0 0 10px rgba(239, 68, 68, 0.5)' : 'none' }}>🎤</button>
                <input type="text" ref={inputRef} placeholder="입력하거나 마이크를 누르세요" style={{ flex: 1, border: '1px solid #E2E8F0', padding: '10px', borderRadius: '20px', outline: 'none', fontSize: '0.9rem' }} />
                <button type="submit" style={{ background: 'none', border: 'none', color: '#3B82F6', fontSize: '1.2rem', cursor: 'pointer', padding: '5px' }}>➤</button>
              </form>
            </div>
          </div>
        )}

        <button onClick={() => setIsOpen(!isOpen)} style={{ width: '65px', height: '65px', borderRadius: '50%', background: '#1E3A8A', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 8px 25px rgba(30, 58, 138, 0.4)', fontSize: '1.8rem' }}>
          {isOpen ? '✕' : '💬'}
        </button>
      </div>

      <style jsx>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulse { 0% { opacity: 0.7; transform: scale(0.95); } 50% { opacity: 1; transform: scale(1.05); } 100% { opacity: 0.7; transform: scale(0.95); } }
      `}</style>
    </>
  );
}
