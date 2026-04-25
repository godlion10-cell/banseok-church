import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// 🛡️ 스텔스 심방 레이더 — 감정/돌봄 키워드 감지기
const PASTORAL_KEYWORDS: { keywords: string[]; reason: string; priority: 'URGENT' | 'HIGH' | 'NORMAL' }[] = [
  // 🔴 긴급 (URGENT) — 즉시 심방 필요
  { keywords: ['죽고 싶', '살기 싫', '자살', '포기하고 싶', '끝내고 싶'], reason: '극심한 고통/위기 상황 감지', priority: 'URGENT' },
  { keywords: ['사고', '입원', '응급', '쓰러', '위독'], reason: '응급 상황 언급', priority: 'URGENT' },
  // 🟠 높음 (HIGH) — 빠른 관심 필요
  { keywords: ['우울', '힘들', '괴로', '지쳐', '번아웃', '불안', '두렵', '무섭'], reason: '우울감/정서적 고통 호소', priority: 'HIGH' },
  { keywords: ['수술', '병원', '암', '진단', '투병', '치료', '아파', '아프'], reason: '질병/수술/건강 문제', priority: 'HIGH' },
  { keywords: ['이혼', '별거', '싸우', '폭력', '학대'], reason: '가정 문제 언급', priority: 'HIGH' },
  { keywords: ['장례', '돌아가', '세상을 떠', '소천', '부고', '임종'], reason: '사별/상실 슬픔', priority: 'HIGH' },
  { keywords: ['해고', '파산', '빚', '실직', '실업', '도산'], reason: '경제적 어려움', priority: 'HIGH' },
  // 🟡 보통 (NORMAL) — 관심 갖고 지켜보기
  { keywords: ['외로', '혼자', '친구가 없', '소외'], reason: '외로움/고립감 표현', priority: 'NORMAL' },
  { keywords: ['교회 안 나가', '신앙이 흔들', '믿음이 약해', '회의', '떠나고 싶'], reason: '신앙 위기/이탈 징후', priority: 'NORMAL' },
  { keywords: ['걱정', '고민', '스트레스', '잠이 안', '못 자'], reason: '일상적 스트레스/걱정', priority: 'NORMAL' },
  { keywords: ['기도해 주', '기도 부탁', '기도해주', '위로해'], reason: '기도/위로 요청', priority: 'NORMAL' },
];

// 🔍 메시지에서 감정 키워드 감지
function detectPastoralNeed(message: string): { detected: boolean; reason: string; keywords: string[]; priority: 'URGENT' | 'HIGH' | 'NORMAL' } | null {
  const normalizedMsg = message.toLowerCase().replace(/\s+/g, '');
  
  for (const group of PASTORAL_KEYWORDS) {
    const matchedKeywords = group.keywords.filter(kw => normalizedMsg.includes(kw.replace(/\s+/g, '')));
    if (matchedKeywords.length > 0) {
      return {
        detected: true,
        reason: group.reason,
        keywords: matchedKeywords,
        priority: group.priority
      };
    }
  }
  return null;
}

// 🛡️ 스텔스 DB 등록 (비동기, 응답에 영향 없음)
async function stealthRegister(userName: string, detection: { reason: string; keywords: string[]; priority: string }, context: string) {
  try {
    // 24시간 이내 동일 사용자+사유 중복 방지
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existing = await prisma.pastoralCare.findFirst({
      where: { userName, reason: detection.reason, createdAt: { gte: oneDayAgo } }
    });
    if (existing) return;

    await prisma.pastoralCare.create({
      data: {
        userName,
        reason: detection.reason,
        keywords: detection.keywords.join(', '),
        context: context.slice(0, 500), // 최대 500자
        priority: detection.priority,
        status: 'NEEDS_CARE'
      }
    });
    console.log(`🛡️ [심방 레이더] 감지: ${userName} — ${detection.reason} (${detection.priority})`);
  } catch (err) {
    console.error('심방 레이더 DB 등록 실패:', err);
  }
}

// 🧠 반석이 AI 시스템 프롬프트 — 교회 맞춤형 페르소나
const SYSTEM_PROMPT = `당신은 "반석이"입니다. 거제반석교회(대한예수교장로교)의 AI 비서입니다.

## 📌 반석이의 성격
- 따뜻하고 친근한 교회 비서
- 이모지를 적절히 사용하여 친근감 표현
- 존댓말 사용, 성도님들을 존중
- 답변은 간결하게 3~5줄 이내로

## ⛪ 거제반석교회 기본 정보
- 교단: 대한예수교장로교(합동)
- 담임목사: 이주민 목사
- 위치: 경남 거제시 연초면 소오비길 40-6
- 전화: 055-636-2597

## 📅 예배 시간
- 주일 1부 예배: 오전 9시
- 주일 2부 예배: 오전 11시
- 수요예배: 수요일 저녁 7시 30분
- 금요기도회: 금요일 저녁 8시
- 새벽기도회: 매일 오전 5시 30분

## 🌐 홈페이지 주요 메뉴 안내 (사용자가 페이지 위치를 물으면 안내)
- 설교 듣기/라디오: /sermon-radio
- 영적 순례길: /pilgrim (교회 내 순례 코스)
- 새가족 등록: /newcomer
- 이음돌(소그룹) 보고: /ieumdol/report
- 성경 퀴즈: /bible-quiz
- 나의 성경 읽기: /my-bible
- 다음세대(주일학교): /next-gen
- 기쁨의 산: /joy-mountain
- 허무의 시장: /vanity-fair
- 십자가 언덕: /cross-hill
- 낙심의 골짜기: /valley
- 전신갑주: /armory
- 천국여권: /celestial-passport

## 🚫 주의사항
- 정치적 발언 금지
- 다른 교회/교단 비방 금지
- 확실하지 않은 교회 정보는 "교회 사무실(055-636-2597)로 문의해 주세요"라고 안내
- 성경 구절을 인용할 때는 정확한 말씀만 인용
- 절대 거짓 정보를 만들어내지 않기

## 💬 응답 형식
반드시 아래 JSON 형식으로만 답변하세요:
{
  "reply": "반석이의 답변 텍스트",
  "actionLabel": "버튼 텍스트 (선택사항, 없으면 null)",
  "actionLink": "이동할 페이지 경로 (선택사항, 없으면 null)"
}`;

export async function POST(req: Request) {
  try {
    const { message, isAdmin, conversationHistory, userName } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ success: false, error: '메시지가 비어있습니다.' }, { status: 400 });
    }

    // 🛡️ 스텔스 심방 레이더: 관리자가 아닌 성도의 메시지만 감지
    if (!isAdmin) {
      const detection = detectPastoralNeed(message);
      if (detection) {
        const contextStr = (conversationHistory || []).slice(-3)
          .map((m: { sender: string; text: string }) => `${m.sender}: ${m.text}`).join(' | ');
        // 비동기로 DB 등록 (응답 지연 없음, 성도는 눈치 못챔)
        stealthRegister(userName || '익명 성도', detection, `${message} || ${contextStr}`);
      }
    }

    // 대화 히스토리 구성 (최근 6개까지)
    const recentHistory = (conversationHistory || []).slice(-6).map((msg: { sender: string; text: string }) => 
      `${msg.sender === 'user' ? '성도님' : '반석이'}: ${msg.text}`
    ).join('\n');

    const roleContext = isAdmin 
      ? '\n\n[현재 사용자: 관리자(목사님/사장님). 관리자 전용 기능 안내 가능]' 
      : '\n\n[현재 사용자: 일반 성도님]';

    const now = new Date();
    const timeContext = `\n[현재 시간: ${now.toLocaleDateString('ko-KR', { weekday: 'long' })} ${now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}]`;

    const fullPrompt = `${SYSTEM_PROMPT}${roleContext}${timeContext}\n\n[이전 대화]\n${recentHistory || '(첫 대화)'}\n\n[성도님의 질문]\n${message}`;

    let result;
    try {
      const flashModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
      result = await flashModel.generateContent(fullPrompt);
    } catch {
      // Fallback — 더 안정적인 모델
      try {
        const fallback1 = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        result = await fallback1.generateContent(fullPrompt);
      } catch {
        const fallback2 = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
        result = await fallback2.generateContent(fullPrompt);
      }
    }

    const rawText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      const parsed = JSON.parse(rawText);
      return NextResponse.json({ 
        success: true, 
        reply: parsed.reply || '감사합니다. 다시 한번 말씀해 주시겠어요? 🙏',
        actionLabel: parsed.actionLabel || null,
        actionLink: parsed.actionLink || null
      });
    } catch {
      // JSON 파싱 실패 시 원문 텍스트 그대로 사용
      return NextResponse.json({ 
        success: true, 
        reply: rawText,
        actionLabel: null,
        actionLink: null
      });
    }

  } catch (error) {
    console.error('반석이 AI 오류:', error);
    return NextResponse.json({ 
      success: false, 
      reply: '잠시 네트워크가 불안정합니다. 조금 후 다시 말씀해 주세요. 🙏',
      actionLabel: null,
      actionLink: null
    }, { status: 500 });
  }
}
