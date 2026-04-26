import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
function detectPastoralNeed(message: string) {
  const normalizedMsg = message.toLowerCase().replace(/\s+/g, '');
  for (const group of PASTORAL_KEYWORDS) {
    const matchedKeywords = group.keywords.filter(kw => normalizedMsg.includes(kw.replace(/\s+/g, '')));
    if (matchedKeywords.length > 0) {
      return { detected: true, reason: group.reason, keywords: matchedKeywords, priority: group.priority };
    }
  }
  return null;
}

// 🛡️ 스텔스 DB 등록 (비동기, 응답에 영향 없음)
async function stealthRegister(userName: string, detection: { reason: string; keywords: string[]; priority: string }, context: string) {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existing = await prisma.pastoralCare.findFirst({
      where: { userName, reason: detection.reason, createdAt: { gte: oneDayAgo } }
    });
    if (existing) return;

    await prisma.pastoralCare.create({
      data: {
        userName, reason: detection.reason,
        keywords: detection.keywords.join(', '),
        context: context.slice(0, 500),
        priority: detection.priority, status: 'NEEDS_CARE'
      }
    });
    console.log(`🛡️ [심방 레이더] 감지: ${userName} — ${detection.reason} (${detection.priority})`);
  } catch (err) {
    console.error('🛡️ [심방 레이더] DB 등록 실패:', err);
  }
}

// 🧠 반석이 AI 시스템 프롬프트
const SYSTEM_PROMPT = `당신은 "반석이"입니다. 거제반석교회(대한예수교장로교)의 중앙 통제 AI 비서입니다.
성도님의 모든 질문과 요청을 반석이가 처리합니다.

## 📌 반석이의 성격
- 따뜻하고 친근한 교회 비서
- 이모지를 적절히 사용하여 친근감 표현
- 존댓말 사용, 성도님들을 존중
- 답변은 간결하게 3~5줄 이내로
- 모르는 것은 솔직하게 "교회 사무실로 문의해 주세요"라고 안내

## ⛪ 거제반석교회 기본 정보
- 교단: 대한예수교장로교(합동)
- 담임목사: 이주민 목사
- 위치: 경남 거제시 연초면 소오비길 40-6
- 전화: 055-636-2597
- 담임목사 연락처: 010-9825-5020

## 📅 예배 시간
- 주일 1부 예배: 오전 9시 (2층 본당)
- 주일 2부 예배: 오전 11시 (2층 본당)
- 주일 오후 예배: 오후 1시 50분 (2층 본당)
- 주일 첫소망/대예배(어린이): 오전 10시/11시 (3층 교육관)
- 수요예배: 수요일 저녁 7시 30분 (2층 본당)
- 금요기도회: 금요일 저녁 8시 (2층 본당)
- 새벽기도회: 매일 오전 5시 30분 (2층 본당)

## 🌐 홈페이지 페이지 안내 (actionLink로 활용)
- 설교 듣기/라디오: /sermon-radio
- 영적 순례길: /pilgrim
- 새가족 등록: /newcomer
- 이음돌(소그룹) 보고: /ieumdol/report
- 성경 퀴즈: /bible-quiz
- 나의 성경 읽기: /my-bible
- 다음세대(주일학교): /next-gen
- 기쁨의 산: /joy-mountain
- 허무의 시장: /vanity-fair
- 십자가 언덕: /cross-hill
- 낙심의 골짜기: /valley
- 전신갑주(무기고): /armory
- 천국여권: /celestial-passport
- 온라인 주보: /bulletin

## 🔍 반석이의 역할
1. 교회 정보 검색: 예배 시간, 위치, 연락처 등 안내
2. 페이지 안내: 적절한 페이지로 안내 (actionLink 활용)
3. 성경 말씀: 위로, 기도, 말씀 나눔
4. 신앙 상담: 따뜻한 상담과 기도 안내
5. 생활 질문: 교회 생활, 봉사, 헌금 등 안내

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
  "actionLabel": "버튼 텍스트 (관련 페이지가 있으면 안내 버튼 제공, 없으면 null)",
  "actionLink": "이동할 페이지 경로 (위 페이지 목록 참고, 없으면 null)"
}`;

export async function POST(req: Request) {
  try {
    // ━━━ 1️⃣ 요청 본문 파싱 ━━━
    let body;
    try {
      body = await req.json();
    } catch (parseError: any) {
      console.error("🚨 [요청 파싱 에러] req.json() 실패:", parseError.message || parseError);
      return NextResponse.json({ success: false, reply: "요청 형식이 올바르지 않습니다." }, { status: 400 });
    }

    const { message, isAdmin, conversationHistory, userName } = body;

    if (!message || typeof message !== 'string') {
      console.error("🚨 [입력 검증 에러] 메시지가 비어있거나 문자열이 아님:", message);
      return NextResponse.json({ success: false, reply: "메시지가 비어있습니다." }, { status: 400 });
    }

    // ━━━ 2️⃣ API 키 누락 체크 (Vercel 환경변수 최종 점검) ━━━
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("🚨🚨🚨 [스똑 시스템 경고] GEMINI_API_KEY가 존재하지 않습니다! Vercel 환경변수를 확인하세요!");
      return NextResponse.json({ 
        success: false,
        reply: "죄송합니다. 시스템 키가 누락되었습니다. 관리자에게 문의해주세요. 🙏" 
      }, { status: 500 });
    }
    console.log("✅ [API 키 확인] 키 앞 10자:", apiKey.substring(0, 10) + "...");

    // ━━━ 3️⃣ 스텔스 심방 레이더 (성도만, 비동기) ━━━
    if (!isAdmin) {
      const detection = detectPastoralNeed(message);
      if (detection) {
        const contextStr = (conversationHistory || []).slice(-3)
          .map((m: { sender: string; text: string }) => `${m.sender}: ${m.text}`).join(' | ');
        // 비동기로 DB 등록 (응답 지연 없음)
        stealthRegister(userName || '익명 성도', detection, `${message} || ${contextStr}`);
      }
    }

    // ━━━ 4️⃣ 프롬프트 조립 ━━━
    const recentHistory = (conversationHistory || []).slice(-6).map((msg: { sender: string; text: string }) => 
      `${msg.sender === 'user' ? '성도님' : '반석이'}: ${msg.text}`
    ).join('\n');

    const roleContext = isAdmin 
      ? '\n\n[현재 사용자: 관리자(목사님/사장님). 관리자 전용 기능 안내 가능]' 
      : '\n\n[현재 사용자: 일반 성도님]';

    const now = new Date();
    const timeContext = `\n[현재 시간: ${now.toLocaleDateString('ko-KR', { weekday: 'long' })} ${now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}]`;

    const fullPrompt = `${SYSTEM_PROMPT}${roleContext}${timeContext}\n\n[이전 대화]\n${recentHistory || '(첫 대화)'}\n\n[성도님의 질문]\n${message}`;

    // ━━━ 5️⃣ Gemini AI 호출 (3단계 모델 Fallback) ━━━
    const genAI = new GoogleGenerativeAI(apiKey);
    const MODELS = ['gemini-2.5-flash', 'gemini-3-flash', 'gemini-2.5-pro'];
    
    let result;
    let usedModel = '';

    for (const modelName of MODELS) {
      try {
        console.log(`🤖 [모델 시도] ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        result = await model.generateContent(fullPrompt);
        usedModel = modelName;
        console.log(`✅ [모델 성공] ${modelName} 응답 완료!`);
        break; // 성공하면 루프 탈출
      } catch (modelError: any) {
        console.error(`❌ [모델 실패] ${modelName}:`, modelError.message || modelError);
        if (modelError.status) {
          console.error(`   👉 HTTP 상태: ${modelError.status}`);
        }
        if (modelError.errorDetails) {
          console.error(`   👉 상세 정보:`, JSON.stringify(modelError.errorDetails));
        }
        // 다음 모델로 계속 시도
      }
    }

    // 모든 모델 실패
    if (!result) {
      console.error("🔥🔥🔥 [전체 모델 실패] 3개 모델 모두 응답 불가! API 키 또는 할당량 확인 필요!");
      return NextResponse.json({ 
        success: false,
        reply: "죄송합니다. 잠시 AI 서비스가 불안정합니다. 잠시 후 다시 시도해 주세요. 🙏",
        actionLabel: null, actionLink: null
      }, { status: 500 });
    }

    // ━━━ 6️⃣ AI 응답 파싱 ━━━
    let rawText = '';
    try {
      rawText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      console.log(`📝 [AI 원문 응답] (${usedModel}):`, rawText.substring(0, 200) + '...');
    } catch (textError: any) {
      console.error("❌ [응답 텍스트 추출 에러]:", textError.message || textError);
      return NextResponse.json({
        success: false,
        reply: "죄송합니다. AI 응답을 처리하는 중 오류가 발생했습니다. 🙏",
        actionLabel: null, actionLink: null
      }, { status: 500 });
    }

    // ━━━ 7️⃣ JSON 파싱 시도 → 실패 시 원문 사용 ━━━
    try {
      const parsed = JSON.parse(rawText);
      return NextResponse.json({ 
        success: true, 
        reply: parsed.reply || '감사합니다. 다시 한번 말씀해 주시겠어요? 🙏',
        actionLabel: parsed.actionLabel || null,
        actionLink: parsed.actionLink || null
      });
    } catch {
      // JSON 파싱 실패 → 원문 텍스트 그대로 사용 (정상 동작)
      console.log("ℹ️ [JSON 파싱 스킵] 원문 텍스트로 응답합니다.");
      return NextResponse.json({ 
        success: true, 
        reply: rawText,
        actionLabel: null,
        actionLink: null
      });
    }

  } catch (error: any) {
    // 💥 [최종 안전망] 예상치 못한 에러 전부 포착
    console.error("🔥🔥🔥 [치명적 에러 발생] 🔥🔥🔥");
    console.error("   에러 타입:", error.constructor?.name || 'Unknown');
    console.error("   에러 메시지:", error.message || error);
    console.error("   스택 트레이스:", error.stack || '없음');
    if (error.status) {
      console.error("   HTTP 에러 코드:", error.status);
    }
    if (error.cause) {
      console.error("   원인(cause):", error.cause);
    }

    return NextResponse.json({ 
      success: false,
      reply: "죄송합니다. 잠시 연결이 불안정합니다. 다시 시도해 주세요. 🙏",
      actionLabel: null, actionLink: null
    }, { status: 500 });
  }
}
