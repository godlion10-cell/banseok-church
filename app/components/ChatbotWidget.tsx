"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { guardDangerousCommand, executeBanseokAction } from '@/app/lib/actionDispatcher';

type Message = {
  sender: 'bot' | 'user';
  text: string;
  actionLabel?: string;
  actionLink?: string;
};

// 🛡️ 안전한 fetch + JSON 파싱 유틸리티 (Vercel 비-JSON 에러 방어)
async function safeJsonFetch(url: string, options: RequestInit): Promise<{ ok: boolean; status: number; data: any; errorText?: string }> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      // 서버가 JSON이 아닌 텍스트("Request Entity Too Large" 등) 반환 시 안전 처리
      const errorText = await res.text().catch(() => `HTTP ${res.status} 오류`);
      console.error(`🔥 [API ${res.status}] ${url}:`, errorText.slice(0, 200));
      return { ok: false, status: res.status, data: null, errorText: errorText.slice(0, 100) };
    }
    // JSON 파싱 시도
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      return { ok: true, status: res.status, data };
    } catch {
      console.error('🔥 [JSON 파싱 실패]', text.slice(0, 200));
      return { ok: false, status: res.status, data: null, errorText: '서버 응답 형식 오류' };
    }
  } catch (err: any) {
    console.error('🔥 [네트워크 에러]', err.message);
    return { ok: false, status: 0, data: null, errorText: err.message || '네트워크 연결 실패' };
  }
}

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
    { sender: 'bot', text: '샬롬! 중앙 통제 비서 반석이입니다. 😊\n\n무엇이든 말씀해 주세요. 또는 아래 버튼으로 바로 이동하세요!' }
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
        : '샬롬! 중앙 통제 비서 반석이입니다. 😊\n\n무엇이든 말씀해 주세요. 또는 아래 버튼으로 바로 이동하세요!'
    }]);
  }, [isAdmin, mounted]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);

    // 퀵바 반석이 버튼에서 챗봇 열기 이벤트 수신
    const handleOpenChatbot = () => setIsOpen(true);
    window.addEventListener('banseok:open-chatbot', handleOpenChatbot);

    return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('banseok:open-chatbot', handleOpenChatbot);
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

  // 🎤 Web Speech API — 음성 인식 (청각 이식)
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMessages(prev => [...prev, { sender: 'bot', text: '이 브라우저에서는 음성 인식을 지원하지 않습니다. Chrome 브라우저를 사용해 주세요. 🎤' }]);
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setMessages(prev => [...prev, { sender: 'bot', text: '마이크 권한이 필요합니다. 브라우저 설정에서 마이크를 허용해주세요. 🔒' }]);
      }
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (inputRef.current) {
        inputRef.current.value = transcript;
        // 자동 제출
        const form = inputRef.current.closest('form');
        if (form) form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      }
    };
    recognition.start();
  };

  // 📎 파일 첨부 상태 (관리자 전용 멀티모달)
  const [attachedFile, setAttachedFile] = useState<{ name: string; type: string; base64: string } | null>(null);

  // 📎 이미지 압축 유틸리티 (Canvas API — 서버 전송 전 용량 최적화)
  const compressImage = (file: File, maxWidth = 1200, quality = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas 생성 실패')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        // JPEG로 압축 (quality 0.7 → 원본 대비 60-80% 감소)
        const compressed = canvas.toDataURL('image/jpeg', quality);
        console.log(`📸 [이미지 압축] ${file.name}: ${Math.round(file.size/1024)}KB → ${Math.round(compressed.length * 0.75 / 1024)}KB`);
        resolve(compressed);
      };
      img.onerror = () => reject(new Error('이미지 로드 실패'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 4MB 원본 제한 (압축 후에는 훨씬 작아짐)
    if (file.size > 4 * 1024 * 1024) {
      setMessages(prev => [...prev, { sender: 'bot', text: '파일 크기는 4MB 이하여야 합니다, 사장님. 📁' }]);
      return;
    }

    // 이미지인 경우 → Canvas 압축 후 전송
    if (file.type.startsWith('image/')) {
      try {
        const compressedBase64 = await compressImage(file);
        setAttachedFile({ name: file.name, type: 'image/jpeg', base64: compressedBase64 });
        const compressedSizeKB = Math.round(compressedBase64.length * 0.75 / 1024);
        setMessages(prev => [...prev, { sender: 'user', text: `📎 파일 첨부: ${file.name} (${Math.round(file.size / 1024)}KB → 압축: ${compressedSizeKB}KB)` }]);
        setMessages(prev => [...prev, { sender: 'bot', text: `파일을 받았습니다! "${file.name}" 분석할까요? 명령을 입력해주세요, 사장님.` }]);
      } catch (err) {
        setMessages(prev => [...prev, { sender: 'bot', text: '이미지 처리에 실패했습니다. 다른 이미지로 시도해주세요. ⚠️' }]);
      }
    } else {
      // 비이미지 파일 — 기존 방식 (2MB 제한)
      if (file.size > 2 * 1024 * 1024) {
        setMessages(prev => [...prev, { sender: 'bot', text: '텍스트/문서 파일은 2MB 이하여야 합니다, 사장님. 📁' }]);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const fullBase64 = reader.result as string;
        setAttachedFile({ name: file.name, type: file.type, base64: fullBase64 });
        setMessages(prev => [...prev, { sender: 'user', text: `📎 파일 첨부: ${file.name} (${Math.round(file.size / 1024)}KB)` }]);
        setMessages(prev => [...prev, { sender: 'bot', text: `파일을 받았습니다! "${file.name}" 분석할까요? 명령을 입력해주세요, 사장님.` }]);
      };
      reader.onerror = () => {
        setMessages(prev => [...prev, { sender: 'bot', text: '파일 읽기에 실패했습니다. 다른 파일로 시도해주세요. ⚠️' }]);
      };
      reader.readAsDataURL(file);
    }
    // input 초기화
    e.target.value = '';
  };

  // 🧠 스마트 분류 엔진 — 파일/텍스트 → AI 카테고리 판별 → DB 자동 저장 + UI 동기화
  const analyzeWithSmartRouter = async (fileData: { name: string; type: string; base64: string } | null, userMessage: string, textContent?: string) => {
    setIsThinking(true);
    setMessages(prev => [...prev, { sender: 'bot', text: '🧠 스마트 분류 엔진 가동 중... AI가 콘텐츠를 분석하고 자동 분류합니다.' }]);
    
    try {
      const requestBody: any = { message: userMessage };
      if (fileData) requestBody.file = fileData;
      if (textContent) requestBody.text = textContent;

      const { ok, status, data, errorText } = await safeJsonFetch('/api/admin/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!ok) {
        const serverError = data?.error || errorText || '';
        const msg = status === 413
          ? '파일이 너무 큽니다! 📦 더 작은 파일로 다시 올려주세요.'
          : status === 0
          ? '네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요. 📶'
          : `❌ 스마트 분석 실패 (${status})\n${serverError || '원인 불명 — Vercel Logs 확인 필요'}`;
        console.error(`🔥 [스마트 분석 실패] status=${status}, error=${serverError}`);
        setMessages(prev => [...prev, { sender: 'bot', text: msg }]);
        return;
      }
      
      if (data?.success) {
        const categoryLinks: Record<string, { label: string; link: string }> = {
          BULLETIN: { label: '📋 온라인 주보 확인하기', link: '/bulletin' },
          SERMON: { label: '🎬 설교 페이지 확인하기', link: '/sermon-video' },
          NEWS: { label: '📢 교회소식 확인하기', link: '/' },
        };
        const linkInfo = categoryLinks[data.category] || { label: '🏠 홈으로 가기', link: '/' };
        const confidenceEmoji = (data.confidence || 0) >= 0.9 ? '🎯' : (data.confidence || 0) >= 0.7 ? '✅' : '⚠️';

        setMessages(prev => [...prev, { 
          sender: 'bot', 
          text: `${confidenceEmoji} ${data.reply}\n\n📊 분류: ${data.category} (확신도: ${Math.round((data.confidence || 0) * 100)}%)\n💾 저장: ${data.savedTo || '실패'}\n🔄 UI 동기화: ${data.revalidatedPath || '—'}\n\n🏷️ [${data.category}_SAVED]`,
          actionLabel: linkInfo.label,
          actionLink: linkInfo.link
        }]);
      } else {
        setMessages(prev => [...prev, { sender: 'bot', text: `❌ 분석 실패: ${data?.error || errorText || '알 수 없는 오류'}\n다시 시도해주세요, 사장님.` }]);
      }
    } catch (err) {
      console.error('🔥 [스마트 분류 예외]', err);
      setMessages(prev => [...prev, { sender: 'bot', text: '⚠️ 예기치 못한 오류가 발생했습니다. 다시 시도해주세요.' }]);
    } finally {
      setIsThinking(false);
    }
  };

  // 👑 관리자 전용 명령 분석 엔진
  const analyzeAdminCommand = (text: string) => {
    let botReply = "알겠습니다, 사장님. ";
    let actionLabel: string | undefined = undefined;
    let actionLink: string | undefined = undefined;

    // 🧠 파일 첨부 + 소식 관련 → AI 챗봇으로 직접 전송 (newsItems 자동저장 지원)
    if (attachedFile && (text.includes("소식") || text.includes("뉴스") || text.includes("등록") || text.includes("추가"))) {
      callGeminiAI(text);
      return;
    }

    // 🧠 파일 첨부 + 기타 명령 → 스마트 분류 엔진
    if (attachedFile && (text.includes("분석") || text.includes("업로드") || text.includes("주보") || text.includes("설교") || text.includes("확인") || text.includes("해줘") || text.includes("처리"))) {
      const fileData = attachedFile;
      setAttachedFile(null);
      analyzeWithSmartRouter(fileData, text);
      return;
    }

    // 파일 첨부 상태에서 단순 메시지 → 스마트 분석 실행
    if (attachedFile) {
      const fileData = attachedFile;
      setAttachedFile(null);
      analyzeWithSmartRouter(fileData, text);
      return;
    }

    // 교회소식 관련 키워드 → AI에게 직접 위임 (DELETE_NEWS/ADD_NEWS/CLEAR_NEWS 자동 처리)
    if (text.includes("소식") || text.includes("뉴스") || text.includes("삭제") || text.includes("추가")) {
      callGeminiAI(text);
      return;
    }

    if (text.includes("주보") || text.includes("업로드")) {
      botReply += "파일을 📎 버튼으로 첨부한 후 아무 명령이나 하시면, AI가 자동으로 분류(주보/설교/소식)하여 등록합니다!";
      actionLabel = "📋 온라인 주보 보기";
      actionLink = "/bulletin";
    } else if (text.includes("설교") || text.includes("유튜브")) {
      botReply += "설교 관련 파일을 📎 첨부하시면 AI가 자동 분류하여 설교 DB에 등록합니다. 또는 명령을 입력해주세요.";
      actionLabel = "🎬 설교 영상 보기";
      actionLink = "/sermon-video";
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
    const { ok, data } = await safeJsonFetch('/api/telegram-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    if (ok && data?.success) {
      setMessages(prev => [...prev, { sender: 'bot', text: '✅ 목사님 텔레그램으로 보고서가 전송 완료되었습니다! 수고하셨습니다. 🙏' }]);
    } else {
      setMessages(prev => [...prev, { sender: 'bot', text: '⚠️ 전송 중 오류가 발생했습니다. 다시 시도해주세요.' }]);
    }
    setReportContent('');
  };

  // 🤖 Gemini AI 호출 — 관리자/일반 뇌 분리 라우팅
  const callGeminiAI = async (userText: string) => {
    setIsThinking(true);
    const apiEndpoint = isAdmin ? '/api/admin/chatbot' : '/api/chatbot';

    try {
      // 대화 히스토리에서 base64/파일 데이터 완전 제거 (페이로드 폭발 방지)
      const cleanHistory = messages.slice(-4).map(m => ({
        sender: m.sender,
        text: (m.text || '').replace(/data:[^;]+;base64,[^\s"]+/g, '[파일]').slice(0, 300)
      }));

      // 관리자 + 파일 첨부 시 멀티모달 데이터 포함
      const requestBody: any = {
        message: userText,
        isAdmin: !!isAdmin,
        conversationHistory: cleanHistory,
        userName: isAdmin ? '관리자' : sessionId
      };

      if (isAdmin && attachedFile) {
        requestBody.file = attachedFile;
        setAttachedFile(null);
      }

      const { ok, status, data, errorText } = await safeJsonFetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!ok) {
        const serverError = data?.reply || data?.error || errorText || '';
        let msg: string;
        if (status === 413) {
          msg = '전송 데이터가 너무 큽니다! 📦\n파일 크기를 줄이거나, 파일 없이 다시 시도해주세요.';
        } else if (status === 0) {
          msg = '네트워크 연결 실패! 인터넷 연결을 확인해주세요. 📶';
        } else {
          msg = `❌ 오류 (${status})\n${serverError || '원인 불명'}`;
        }
        console.error(`🔥 [AI 호출 실패] ${apiEndpoint} status=${status}, error=${serverError}`);
        setMessages(prev => [...prev, { sender: 'bot', text: msg }]);
        return;
      }

      if (data?.success && data?.reply) {
        let replyText = data.reply;
        if (isAdmin && data.actionCode && data.actionCode !== 'NONE') {
          replyText += `\n\n🏷️ [${data.actionCode}]`;
        }
        if (isAdmin && data.dbCommand) {
          replyText += `\n📋 DB 명령: ${data.dbCommand}`;
        }

        const botMsg: Message = {
          sender: 'bot',
          text: replyText,
          actionLabel: data.actionLabel || undefined,
          actionLink: data.actionLink || undefined
        };
        setMessages(prev => [...prev, botMsg]);
        speakAndView(data.reply);
      } else {
        setMessages(prev => [...prev, { sender: 'bot', text: data?.reply || '죄송합니다, 잠시 연결이 불안정합니다. 다시 시도해 주세요. 🙏' }]);
      }
    } catch (err) {
      console.error('🔥 [AI 호출 예외]', err);
      setMessages(prev => [...prev, { sender: 'bot', text: '⚠️ 예기치 못한 오류가 발생했습니다. 다시 시도해주세요. 🙏' }]);
    } finally {
      setIsThinking(false);
    }
  };

  /* 🧠 반석이의 중앙 통제 뇌 (하이브리드 AI) */
  const analyzeAndRespond = (userText: string) => {
    // 1. 유저 권한 확인 (성도인가 사장님인가)
    const userRole = isAdmin ? "OWNER" : "SAINT";

    // 🛡️ 보안 가드: 일반 성도의 위험 키워드 사전 차단
    const guardMessage = guardDangerousCommand(userText, !!isAdmin);
    if (guardMessage) {
      setMessages(prev => [...prev, { sender: 'bot', text: guardMessage }]);
      return;
    }

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
    // 1. [제4엔진] 설교 — 영상 vs 라디오 분기
    else if (userText.includes("영상") || userText.includes("동영상") || userText.includes("보여줘") || userText.includes("설교 봐") || userText.includes("설교 보")) {
      botReply = "네! 설교 영상 페이지로 모시겠습니다. 🎬 은혜로운 말씀을 영상으로 만나보세요!";
      actionLabel = "🎬 설교 영상 보기";
      actionLink = "/sermon-video";
    }
    else if (userText.includes("라디오") || userText.includes("음성") || userText.includes("듣기") || userText.includes("말씀 듣")) {
      botReply = "데이터를 아껴주는 '설교 라디오' 방으로 모실까요? 화면을 꺼도 목사님 말씀이 계속 나옵니다.";
      actionLabel = "📻 라디오 모드 가기";
      actionLink = "/sermon-radio";
    }
    else if (userText.includes("설교")) {
      botReply = "설교 영상 페이지로 안내합니다! 🎬\n라디오 모드(음성만)를 원하시면 '라디오'라고 말씀해주세요.";
      actionLabel = "🎬 설교 영상 보기";
      actionLink = "/sermon-video";
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
    // 5. [🧠 반석이 신경망] 글자 크기 / 다크모드 / 음성 읽기 — 진짜 UI 제어!
    else if (userText.includes("크게") || userText.includes("키워") || userText.includes("글자 크") || userText.includes("확대")) {
      window.dispatchEvent(new Event('banseok:font-up'));
      botReply = "네! 글자를 키워드렸습니다! 👀 더 키우시려면 '더 크게'라고 말씀해주세요. 원래대로 돌리려면 '글자 원래대로'라고 하세요.";
    }
    else if (userText.includes("작게") || userText.includes("줄여") || userText.includes("글자 작") || userText.includes("축소")) {
      window.dispatchEvent(new Event('banseok:font-down'));
      botReply = "네! 글자를 줄여드렸습니다. 📝";
    }
    else if (userText.includes("원래대로") || userText.includes("기본 크기") || userText.includes("글자 리셋")) {
      window.dispatchEvent(new Event('banseok:font-reset'));
      botReply = "글자 크기를 기본으로 돌려놨습니다! ✅";
    }
    else if (userText.includes("어둡게") || userText.includes("다크") || userText.includes("야간") || userText.includes("눈 아파")) {
      window.dispatchEvent(new Event('banseok:dark-toggle'));
      botReply = "야간 모드로 전환했습니다! 🌙 눈이 편하시길 바랍니다.";
    }
    else if (userText.includes("밝게") || userText.includes("라이트") || userText.includes("원래 화면")) {
      window.dispatchEvent(new Event('banseok:dark-toggle'));
      botReply = "밝은 화면으로 돌려놨습니다! ☀️";
    }
    else if (userText.includes("읽어줘") || userText.includes("소리로") || userText.includes("음성으로") || userText.includes("돋보기")) {
      window.dispatchEvent(new CustomEvent('banseok:tts', { detail: {} }));
      botReply = "화면을 음성으로 읽어드리겠습니다! 🔊 특정 부분만 읽고 싶으시면 텍스트를 드래그한 후 '읽어줘'라고 말씀해주세요.";
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
    // 🕐 주일 자동 인사 (단순 인사만 — 실질적 질문은 AI로 위임)
    else if (isSunday && hour >= 8 && hour <= 13 && (userText.includes("안녕") || userText.includes("반가") || userText.includes("샬롬") || userText.includes("하이") || userText.length <= 5)) {
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

  const onSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (isThinking) return; // 🛡️ 중복 제출 방지 — 응답 대기 중 잠금
    if (inputRef.current) {
      const val = inputRef.current.value.trim();
      if (!val) return;
      handleUserMessage(val);
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
                            // 🛡️ /admin 경로는 관리자 모드에서만 이동 허용
                            if (msg.actionLink.startsWith('/admin') && !isAdmin) {
                              setMessages(prev => [...prev, { sender: 'bot', text: '⛔ 관리자 전용 페이지입니다.' }]);
                              return;
                            }
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
              {/* 첨부 파일 미리보기 */}
              {attachedFile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', marginBottom: '8px', background: '#F0F9FF', borderRadius: '12px', fontSize: '0.8rem', color: '#0369A1' }}>
                  <span>📎</span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{attachedFile.name}</span>
                  <button onClick={() => setAttachedFile(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
                </div>
              )}
              <form onSubmit={onSubmitForm} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {/* 📎 파일 첨부 (관리자 전용) */}
                {isAdmin && (
                  <>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*,.pdf,.xlsx,.xls,.csv,.doc,.docx,.txt" style={{ display: 'none' }} />
                    <button type="button" onClick={() => fileInputRef.current?.click()} title="파일 첨부"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', transition: '0.2s' }}>
                      <Image src="/icons/realistic-paperclip.png" alt="파일첨부" width={26} height={26} style={{ objectFit: 'contain' }} />
                    </button>
                  </>
                )}
                {/* 🎤 음성 입력 */}
                <button type="button" onClick={startListening} title={isListening ? '음성 중지' : '음성 입력'}
                  style={{ background: isListening ? '#FEE2E2' : 'none', border: isListening ? '2px solid #EF4444' : 'none', cursor: 'pointer', flexShrink: 0, width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', transition: '0.2s', animation: isListening ? 'pulse 1s infinite' : 'none' }}>
                  <Image src="/icons/realistic-mic.png" alt="음성입력" width={26} height={26} style={{ objectFit: 'contain', filter: isListening ? 'drop-shadow(0 0 6px #EF4444)' : 'none' }} />
                </button>
                {/* 텍스트 입력 */}
                <input type="text" ref={inputRef} disabled={isThinking} placeholder={isThinking ? '반석이가 생각 중...' : (isAdmin ? '사장님, 명령하세요...' : '입력하거나 🎤을 누르세요')}
                  style={{ flex: 1, border: '1px solid #E2E8F0', padding: '11px 14px', borderRadius: '20px', outline: 'none', fontSize: '0.9rem', background: isThinking ? '#F1F5F9' : '#FAFAFA', opacity: isThinking ? 0.6 : 1, cursor: isThinking ? 'not-allowed' : 'text' }} />
                {/* 전송 */}
                <button type="submit" title="전송" disabled={isThinking}
                  style={{ background: isThinking ? '#94A3B8' : theme.btnBg, border: 'none', color: 'white', borderRadius: '50%', width: '38px', height: '38px', cursor: isThinking ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.1rem', transition: '0.2s' }}>{isThinking ? '⏳' : '➤'}</button>
              </form>
            </div>
          </div>
        )}

        <button data-chatbot-toggle onClick={() => setIsOpen(!isOpen)} style={{ width: '65px', height: '65px', borderRadius: '50%', background: theme.btnBg, color: 'white', border: isAdmin ? '3px solid #A78BFA' : 'none', cursor: 'pointer', boxShadow: `0 8px 25px rgba(0,0,0,0.3)`, fontSize: '1.8rem' }}>
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
