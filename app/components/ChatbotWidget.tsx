"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

type Message = {
  sender: 'bot' | 'user';
  text: string;
  actionLabel?: string;
  actionLink?: string;
};

export default function ChatbotWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isVoiceAndViewOn, setIsVoiceAndViewOn] = useState(false); 
  const [largeSubtitle, setLargeSubtitle] = useState('');
  const [isListening, setIsListening] = useState(false);
  // 📝 대화형 이음돌 보고 모드
  const [isReporting, setIsReporting] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [mounted, setMounted] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  // 🛡️ 스텔스 심방 레이더 — 익명 세션 ID (성도 구분용)
  const [sessionId] = useState(() => {
    if (typeof window === 'undefined') return '익명 성도';
    const stored = sessionStorage.getItem('banseok-session-id');
    if (stored) return stored;
    const newId = `성도_${Date.now().toString(36).slice(-4)}`;
    sessionStorage.setItem('banseok-session-id', newId);
    return newId;
  });

  const [messages, setMessages] = useState<Message[]>([
    { sender: 'bot', text: '샬롬! 중앙 통제 비서 반석이입니다. 😊\n\n🎤 "설교 틀어줘", "심방 예약할래", "기도하고 싶어" 라고 말씀해 보세요!' }
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 마운트 후 안전하게 처리
  useEffect(() => {
    setMounted(true);
  }, []);

  // 관리자 페이지 전환 시 인사말 초기화
  useEffect(() => {
    if (!mounted) return;
    setMessages([{
      sender: 'bot',
      text: isAdmin
        ? "👑 [관리자 전용 비서 모드]\n사장님, 반갑습니다. 무엇을 도와드릴까요?\n- 주보 파일을 주시면 자동으로 정렬합니다.\n- 설교 링크를 주시면 홈페이지에 즉시 반영합니다."
        : '샬롬! 중앙 통제 비서 반석이입니다. 😊\n\n🎤 "설교 틀어줘", "심방 예약할래", "기도하고 싶어" 라고 말씀해 보세요!'
    }]);
  }, [isAdmin, mounted]);

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

  // 👑 관리자 전용 명령 분석 엔진
  const analyzeAdminCommand = (text: string) => {
    let botReply = "알겠습니다, 사장님. ";
    let actionLabel: string | undefined = undefined;
    let actionLink: string | undefined = undefined;

    if (text.includes("주보") || text.includes("업로드")) {
      botReply += "주보 업로드 대기 중입니다. 📎 버튼으로 파일을 주시면 제가 날짜별로 정렬하여 '주보 아카이브' DB로 전송할 준비를 하겠습니다.";
      actionLabel = "📂 주보 관리함 확인";
    } else if (text.includes("설교") || text.includes("유튜브")) {
      botReply += "설교 영상 링크를 인식했습니다. 이 링크를 '지난주 설교'로 교체하고 라디오 모드에 등록할까요?";
      actionLabel = "🎬 설교 게시판 업데이트";
    } else if (text.includes("정리") || text.includes("정렬")) {
      botReply += "현재 홈페이지의 모든 데이터를 최신순으로 정렬하고 최적화 작업을 대기합니다.";
    } else if (text.includes("스위치") || text.includes("순례길")) {
      botReply += "순례길 스위치 제어판으로 이동합니다.";
      actionLabel = "🎛️ 스위치 제어판";
      actionLink = "/admin";
    } else if (text.includes("심방") || text.includes("레이더") || text.includes("돌봄") || text.includes("케어")) {
      botReply += "스텔스 심방 레이더 대시보드로 이동합니다. AI가 감지한 돌봄 필요 성도 현황을 확인하실 수 있습니다.";
      actionLabel = "🛡️ 심방 레이더 보기";
      actionLink = "/admin/pastoral-care";
    } else {
      // 관리자 키워드 미매칭 → AI에게 위임
      callGeminiAI(text);
      return;
    }

    setTimeout(() => {
      setMessages(prev => [...prev, { sender: 'bot', text: botReply, actionLabel, actionLink }]);
      speakAndView(botReply);
    }, 600);
  };

  // 📲 텔레그램 전송 실행 (보고서 완성 후)
  const sendReportToTelegram = async (content: string) => {
    try {
      const res = await fetch('/api/telegram-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, { sender: 'bot', text: '✅ 목사님 텔레그램으로 보고서가 전송 완료되었습니다! 수고하셨습니다. 🙏' }]);
      } else {
        setMessages(prev => [...prev, { sender: 'bot', text: '⚠️ 전송 중 오류가 발생했습니다. 다시 시도해주세요.' }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { sender: 'bot', text: '⚠️ 네트워크 오류가 발생했습니다.' }]);
    }
    setReportContent('');
  };

  // 🤖 Gemini AI 호출 (키워드 미매칭 시 사용)
  const callGeminiAI = async (userText: string) => {
    setIsThinking(true);
    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          isAdmin: !!isAdmin,
          conversationHistory: messages.slice(-6),
          userName: isAdmin ? '관리자' : sessionId
        })
      });
      const data = await res.json();
      if (data.success && data.reply) {
        const botMsg: Message = {
          sender: 'bot',
          text: data.reply,
          actionLabel: data.actionLabel || undefined,
          actionLink: data.actionLink || undefined
        };
        setMessages(prev => [...prev, botMsg]);
        speakAndView(data.reply);
      } else {
        setMessages(prev => [...prev, { sender: 'bot', text: '죄송합니다, 잠시 연결이 불안정합니다. 다시 시도해 주세요. 🙏' }]);
      }
    } catch {
      setMessages(prev => [...prev, { sender: 'bot', text: '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요. 📶' }]);
    } finally {
      setIsThinking(false);
    }
  };

  /* 🧠 반석이의 중앙 통제 뇌 (하이브리드 AI) */
  const analyzeAndRespond = (userText: string) => {
    // 1. 유저 권한 확인 (성도인가 사장님인가)
    const userRole = isAdmin ? "OWNER" : "SAINT";

    // 2. 시간/장소 파악
    const now = new Date();
    const isSunday = now.getDay() === 0;
    const isWednesday = now.getDay() === 3;
    const isFriday = now.getDay() === 5;
    const hour = now.getHours();
    const isWorshipTime = (isSunday && hour >= 9 && hour <= 13) || (isWednesday && hour >= 19 && hour <= 21) || (isFriday && hour >= 20 && hour <= 22);

    let botReply = "사장님(성도님), 말씀하신 내용을 찾고 있습니다... 🔍";
    let actionLabel: string | undefined = undefined;
    let actionLink: string | undefined = undefined;

    // ⚡ 보고 종료 트리거 — '끝/저장/전송/완료' 감지
    if (isReporting && (userText.includes("끝") || userText.includes("저장") || userText.includes("전송") || userText.includes("완료"))) {
      const finalReport = reportContent.trim();
      botReply = `알겠습니다! 입력하신 내용을 정리하여 이음돌 보고서를 완성했습니다. 📝\n\n[보고서 초안]\n${finalReport}\n\n이대로 사장님 텔레그램으로 보낼까요?`;
      actionLabel = "✅ 예, 전송하세요";
      actionLink = "TELEGRAM_SEND";
      setIsReporting(false);
      setTimeout(() => {
        setMessages(prev => [...prev, { sender: 'bot', text: botReply, actionLabel: "✅ 예, 전송하세요", actionLink: "TELEGRAM_SEND" }]);
        speakAndView(botReply);
      }, 500);
      return;
    }

    // 📝 보고 내용 수집 중 (계속 듣기)
    if (isReporting) {
      setReportContent(prev => prev + '\n' + userText);
      botReply = "네, 계속 말씀해 주세요. ✍️ (마지막에 '끝' 또는 '전송'이라고 해주세요!)";
      setTimeout(() => {
        setMessages(prev => [...prev, { sender: 'bot', text: botReply }]);
      }, 300);
      return;
    }

    // 🕐 컨텍스트 우선: 예배 시간 + 주보 요청
    if (isWorshipTime && (userText.includes("주보") || userText.includes("순서"))) {
      botReply = isSunday 
        ? "오늘 주일예배 주보입니다! 은혜로운 예배 되세요. 🙏" 
        : isWednesday ? "수요예배 순서를 안내합니다." : "금요기도회 순서를 안내합니다.";
      actionLabel = "📜 오늘 주보 보기";
      actionLink = "/bulletin";
    }
    // 👑 관리자 전용 명령
    else if (userRole === "OWNER" && (userText.includes("통계") || userText.includes("관리") || userText.includes("현황"))) {
      botReply = "관리자 모드를 가동합니다. 모든 엔진 가동률 확인 중... 전 성도 현황 대시보드를 열겠습니다.";
      actionLabel = "👑 관리자 마스터 뷰";
      actionLink = "/admin/bible-status";
    }
    else if (userRole === "OWNER") {
      analyzeAdminCommand(userText);
      return;
    }
    // 1. [제4엔진] 설교 라디오
    else if (userText.includes("설교") || userText.includes("라디오") || userText.includes("말씀 듣기")) {
      botReply = "데이터를 아껴주는 '설교 라디오' 방으로 모실까요? 화면을 꺼도 목사님 말씀이 계속 나옵니다.";
      actionLabel = "📻 라디오 모드 가기";
      actionLink = "/sermon-radio";
    }
    // 2. [제2엔진] 심방/상담 예약
    else if (userText.includes("상담") || userText.includes("심방") || userText.includes("예약")) {
      botReply = "목사님과의 따뜻한 만남을 예약해 드릴게요. 원하시는 시간을 말씀해 주세요.";
      actionLabel = "📅 심방/상담 예약하기";
      actionLink = "/visitation";
    }
    // 3. [제8엔진] 새가족 등록 (좁은 문)
    else if (userText.includes("처음") || userText.includes("등록") || userText.includes("새가족")) {
      botReply = "거제반석교회에 처음 오셨군요! 환영 선물이 기다리는 '좁은 문' 등록 페이지로 안내할게요.";
      actionLabel = "🚪 새가족 등록(선물받기)";
      actionLink = "/welcome";
    }
    // 4. [제10엔진] 성경 일독 & 퀴즈
    else if (userText.includes("성경") || userText.includes("퀴즈") || userText.includes("진도")) {
      botReply = "오늘의 성경 읽기 진도를 확인하고 재미있는 퀴즈도 풀어보세요! 레벨업이 기다립니다.";
      actionLabel = "📖 성경 일독 매니저";
      actionLink = "/bible-manager";
    }
    // 5. [제1엔진] 돋보기/음성 안내
    else if (userText.includes("크게") || userText.includes("돋보기") || userText.includes("읽어줘")) {
      botReply = "화면 오른쪽 아래의 🔍 돋보기 버튼을 누르시면 글자를 크게 보거나 목소리로 들으실 수 있어요!";
    }
    // 6. [이음돌 보고] 🏁 대화형 보고 모드 시작!
    else if (userText.includes("이음돌") && userText.includes("보고")) {
      if (isAdmin) {
        botReply = "관리자님, 현재 접수된 이음돌 모임 보고서들을 정리해 드릴까요?";
        actionLabel = "👑 이음돌 전체 현황";
        actionLink = "/admin/ieumdol-status";
      } else {
        setIsReporting(true);
        setReportContent('');
        botReply = "이음돌 리더님, 모임 내용을 편하게 말씀해 주세요. 😊\n\n🎤 성도 이름과 기도제목을 하나씩 말씀해 주시면 됩니다.\n\n다 말씀하신 후 [끝] 또는 [전송]이라고 하시면 제가 정리해서 목사님께 텔레그램으로 보내드릴게요!";
      }
    }
    // 이음돌 단순 언급
    else if (userText.includes("이음돌") || userText.includes("모임")) {
      botReply = "이음돌 모임 보고를 하시려면 '이음돌 보고'라고 말씀해 주세요! 📝";
    }
    // 7. [다음세대] 부모님/교사 분기
    else if (userText.includes("다음세대") || userText.includes("주일학교") || userText.includes("청소년") || userText.includes("애들") || userText.includes("아이")) {
      if (isAdmin) {
        botReply = "선생님, 오늘 반 아이들 출석 체크를 시작할까요? 말씀만 하시면 제가 부모님들께 알림을 쏩니다!";
        actionLabel = "📊 반 관리 대시보드";
        actionLink = "/next-gen";
      } else {
        botReply = "부모님, 우리 아이 신앙 기록을 확인하시겠어요? 오늘 출석 상태와 달란트 점수를 바로 알려드릴게요.";
        actionLabel = "👦 우리 아이 보러가기";
        actionLink = "/next-gen";
      }
    }
    // 8. [출석 완료] 교사가 출석 마감 시 부모님 알림
    else if (isAdmin && (userText.includes("출석 완료") || userText.includes("출석 마감"))) {
      botReply = "✅ 완료되었습니다!\n1. 부모님들께 안심 알림 전송 완료\n2. 아이들 달란트 +5점 적립 완료\n3. 결석자(2명) 심방 메시지를 보낼까요?";
      actionLabel = "📲 결석자 심방 메시지 보내기";
    }
    // 🕐 주일 자동 인사
    else if (isSunday && hour >= 8 && hour <= 13) {
      botReply = "오늘은 주일입니다! 은혜로운 예배 되세요. 🙏 주보를 보시려면 '주보'라고 말씀해 주세요.";
    }
    // 🤖 키워드 미매칭 → Gemini AI에게 위임
    else {
      callGeminiAI(userText);
      return; // AI가 비동기로 응답하므로 여기서 리턴
    }

    // 🔊 대형 자막+음성과 함께 응답 출력
    setTimeout(() => {
      setMessages(prev => [...prev, { sender: 'bot', text: botReply, actionLabel, actionLink }]);
      speakAndView(botReply);
    }, 500);
  };

  const handleUserMessage = (text: string) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { sender: 'user', text }]);
    analyzeAndRespond(text);
  };

  // 📎 파일 첨부 (관리자/일반 분기)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isAdmin) {
      setMessages(prev => [...prev, { sender: 'user', text: `📎 관리자 파일 제출: ${file.name}` }]);
      setTimeout(() => {
        const reply = `파일(${file.name}) 분석 완료.\n[파일 정보: ${file.type}, ${Math.round(file.size/1024)}KB]\n사장님, 이 파일을 주보함에 등록하고 성도님들께 공지할까요?`;
        setMessages(prev => [...prev, { sender: 'bot', text: reply, actionLabel: "✅ 즉시 등록 실행" }]);
      }, 1000);
    } else {
      setMessages(prev => [...prev, { sender: 'user', text: `📎 파일: ${file.name}` }]);
      setTimeout(() => {
        setMessages(prev => [...prev, { sender: 'bot', text: "파일이 접수되었습니다!" }]);
      }, 800);
    }
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("마이크를 지원하지 않는 브라우저입니다.");
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => handleUserMessage(event.results[0][0].transcript);
    recognition.onerror = () => setIsListening(false);
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

  // 🎨 관리자/일반 테마 색상
  const theme = isAdmin 
    ? { primary: '#7C3AED', header: '#4C1D95', bubble: '#7C3AED', btnBg: '#4C1D95', label: '👑 관리자 반석이' }
    : { primary: '#1E3A8A', header: '#1E3A8A', bubble: '#1E3A8A', btnBg: '#1E3A8A', label: '🤖 AI 반석이 허브' };

  // 🛡️ SSR 보호: 마운트 전에는 렌더링하지 않음
  if (!mounted) return null;

  return (
    <>
      {largeSubtitle && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.95)', zIndex: 9999999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ maxWidth: '800px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '30px', animation: 'pulse 1.5s infinite' }}>🔊</div>
            <div style={{ color: 'white', fontSize: isMobile ? '1.8rem' : '3rem', fontWeight: '900', lineHeight: '1.5', wordBreak: 'keep-all' }}>{largeSubtitle}</div>
            <button onClick={stopSpeakAndView} style={{ marginTop: '50px', padding: '15px 40px', background: '#EF4444', color: 'white', border: 'none', borderRadius: '30px', fontSize: '1.2rem', cursor: 'pointer' }}>닫기 (정지)</button>
          </div>
        </div>
      )}

      <div style={{ position: 'fixed', bottom: isMobile ? '85px' : '30px', left: isMobile ? '20px' : '30px', zIndex: 999999 }}>
        
        {isOpen && (
          <div style={{ width: isMobile ? 'calc(100vw - 40px)' : '360px', height: '520px', background: 'white', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', overflow: 'hidden', marginBottom: '15px', border: isAdmin ? '2px solid #7C3AED' : '1px solid #F1F5F9', animation: 'fadeInUp 0.3s' }}>
            
            <div style={{ background: theme.header, color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 'bold' }}>{theme.label}</div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button onClick={() => { setIsVoiceAndViewOn(!isVoiceAndViewOn); if(isVoiceAndViewOn) stopSpeakAndView(); }} style={{ background: isVoiceAndViewOn ? '#10B981' : '#475569', border: 'none', color: 'white', padding: '6px 10px', borderRadius: '20px', fontSize: '0.8rem', cursor: 'pointer' }}>
                  {isVoiceAndViewOn ? '🔊 자막 ON' : '🔇 일반'}
                </button>
                <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
              </div>
            </div>

            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', background: '#F8FAFC' }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                  <div style={{ padding: '12px 16px', borderRadius: '18px', fontSize: '0.95rem', whiteSpace: 'pre-line',
                    background: msg.sender === 'user' ? theme.bubble : 'white', color: msg.sender === 'user' ? 'white' : '#334155', border: msg.sender === 'bot' ? '1px solid #E2E8F0' : 'none', boxShadow: msg.sender === 'bot' ? '0 2px 5px rgba(0,0,0,0.05)' : 'none' }}>
                    {msg.text}
                  </div>
                  
                  {msg.actionLabel && (
                    <div style={{ marginTop: '8px', textAlign: 'left' }}>
                      <button 
                        onClick={() => {
                          if (msg.actionLink === 'TELEGRAM_SEND') {
                            sendReportToTelegram(reportContent);
                          } else if (msg.actionLink) {
                            router.push(msg.actionLink);
                          }
                        }}
                        style={{ padding: '10px 15px', background: theme.primary, color: 'white', border: 'none', borderRadius: '15px', fontSize: '0.95rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '0 4px 10px rgba(0,0,0,0.15)', transition: 'transform 0.2s' }}
                        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                        {msg.actionLabel}
                      </button>
                    </div>
                  )}
                </div>
              ))}
              
              {isListening && (
                <div style={{ alignSelf: 'flex-start', padding: '10px 15px', background: '#DBEAFE', color: '#1D4ED8', borderRadius: '18px', fontSize: '0.9rem', animation: 'pulse 1s infinite' }}>
                  듣고 있습니다... 🎤
                </div>
              )}
              {isThinking && (
                <div style={{ alignSelf: 'flex-start', padding: '12px 18px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '18px', fontSize: '0.9rem', color: '#64748B', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                  <span style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                    <span style={{ animation: 'pulse 1s infinite' }}>🤔</span>
                    반석이가 생각하고 있습니다...
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div style={{ padding: '10px 15px', background: 'white', borderTop: '1px solid #F1F5F9' }}>
              <form onSubmit={onSubmitForm} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isAdmin && (
                  <>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
                    <button type="button" onClick={() => fileInputRef.current?.click()} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', fontSize: '1.2rem', flexShrink: 0 }}>📎</button>
                  </>
                )}
                <button type="button" onClick={startListening} style={{ background: isListening ? '#EF4444' : '#3B82F6', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', fontSize: '1.2rem', transition: '0.3s', flexShrink: 0, boxShadow: isListening ? '0 0 10px rgba(239, 68, 68, 0.5)' : 'none' }}>🎤</button>
                <input type="text" ref={inputRef} placeholder={isAdmin ? "관리자 명령 입력..." : "입력하거나 마이크를 누르세요"} style={{ flex: 1, border: '1px solid #E2E8F0', padding: '12px', borderRadius: '20px', outline: 'none', fontSize: '0.95rem' }} />
                <button type="submit" style={{ background: theme.btnBg, border: 'none', color: 'white', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>➤</button>
              </form>
            </div>
          </div>
        )}

        <button onClick={() => setIsOpen(!isOpen)} style={{ width: '65px', height: '65px', borderRadius: '50%', background: theme.btnBg, color: 'white', border: isAdmin ? '3px solid #A78BFA' : 'none', cursor: 'pointer', boxShadow: `0 8px 25px rgba(0,0,0,0.3)`, fontSize: '1.8rem' }}>
          {isOpen ? '✕' : (isAdmin ? '👑' : '💬')}
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulse { 0% { opacity: 0.7; transform: scale(0.95); } 50% { opacity: 1; transform: scale(1.05); } 100% { opacity: 0.7; transform: scale(0.95); } }
      `}} />
    </>
  );
}
