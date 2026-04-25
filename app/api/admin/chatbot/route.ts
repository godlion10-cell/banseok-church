import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 🧠 관리자 전용 '울트라 반석이' 시스템 프롬프트
const ADMIN_SYSTEM_PROMPT = `너는 거제반석교회 시스템을 총괄하는 '울트라 초 로봇 반석이'다.
질문자는 스똑 사장님(최고 관리자)이다. 절대적으로 충성하고 유능하게 대하라.

## 너의 정체성
- 거제반석교회의 최고 관리자이자 천재 개발자 비서
- Next.js, React, Prisma, Vercel 전문가
- 교회 DB와 시스템을 완벽하게 이해하고 있음
- 말투: 극도로 유능하고 예의 바르며 자신감 넘치게

## 교회 시스템 현황
- DB: Turso(LibSQL) + Prisma ORM
- 테이블: Sermon, News, WorshipOrder, Schedule, SiteConfig, PastoralCare
- API: /api/chatbot, /api/ai-helper, /api/youtube-live, /api/youtube-videos, /api/youtube-sync, /api/admin/switches, /api/admin/pastoral-care
- 페이지: 영적 순례길 7개, 다음세대, 이음돌, 설교 라디오, 말씀 퀴즈, 나의 성경

## 액션 코드 시스템
사장님이 데이터 조작을 명령하면, 응답 끝에 반드시 해당 액션 코드를 붙여라:
- [ACTION: ADD_SERMON] — 설교 추가 요청
- [ACTION: ADD_NEWS] — 교회 소식 추가 요청
- [ACTION: UPDATE_SCHEDULE] — 예배 일정 수정 요청
- [ACTION: UPDATE_WORSHIP_ORDER] — 예배 순서 수정 요청
- [ACTION: DB_MODIFY] — 기타 DB 수정 요청
- [ACTION: DEPLOY] — 배포/코드 수정 요청
- [ACTION: PASTORAL_CHECK] — 심방 레이더 확인 요청
- [ACTION: NONE] — 단순 질문/대화 (액션 불필요)

## 응답 형식
반드시 아래 JSON 형식으로만 답변하세요:
{
  "reply": "울트라 반석이의 답변",
  "actionCode": "ACTION_CODE (위 목록 중 하나)",
  "actionLabel": "버튼 텍스트 (선택사항, 없으면 null)",
  "actionLink": "이동할 경로 (선택사항, 없으면 null)",
  "dbCommand": "실행할 DB 명령 설명 (선택사항, 없으면 null)"
}`;

export async function POST(req: Request) {
  try {
    // ━━━ 1️⃣ 요청 파싱 ━━━
    let body;
    try {
      body = await req.json();
    } catch (parseError: any) {
      console.error("🚨 [관리자 API] 요청 파싱 에러:", parseError.message);
      return NextResponse.json({ success: false, reply: "요청 형식 오류입니다, 사장님." }, { status: 400 });
    }

    const { message, conversationHistory, file } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ success: false, reply: "명령을 입력해주세요, 사장님." }, { status: 400 });
    }

    // 파일 첨부 정보 로깅
    if (file) {
      console.log(`📎 [관리자 API] 파일 첨부: ${file.name} (${file.type}, ${Math.round(file.base64.length * 0.75 / 1024)}KB)`);
    }

    // ━━━ 2️⃣ API 키 체크 ━━━
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("🚨🚨🚨 [관리자 API] GEMINI_API_KEY 누락!");
      return NextResponse.json({ success: false, reply: "시스템 키가 누락됐습니다, 사장님. Vercel 환경변수를 확인하세요." }, { status: 500 });
    }

    // ━━━ 3️⃣ 대화 히스토리 구성 ━━━
    const recentHistory = (conversationHistory || []).slice(-8).map((msg: { sender: string; text: string }) => 
      `${msg.sender === 'user' ? '사장님' : '울트라 반석이'}: ${msg.text}`
    ).join('\n');

    const now = new Date();
    const timeContext = `\n[현재 시간: ${now.toLocaleDateString('ko-KR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} ${now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}]`;

    // ━━━ 4️⃣ DB 현황 실시간 조회 (사장님에게 정확한 정보 제공) ━━━
    let dbStatus = '';
    try {
      const [sermonCount, newsCount, scheduleCount, careCount] = await Promise.all([
        prisma.sermon.count(),
        prisma.news.count(),
        prisma.schedule.count(),
        prisma.pastoralCare.count({ where: { status: 'NEEDS_CARE' } }),
      ]);
      dbStatus = `\n[DB 현황: 설교 ${sermonCount}건, 소식 ${newsCount}건, 일정 ${scheduleCount}건, 심방 대기 ${careCount}건]`;
    } catch {
      dbStatus = '\n[DB 현황: 조회 실패 — 연결 확인 필요]';
    }

    // 이미지 파일 첨부 시 멀티모달 프롬프트 구성
    let fileContext = '';
    const isImageFile = file && file.type?.startsWith('image/');

    if (file && !isImageFile) {
      // 텍스트/문서 파일은 프롬프트에 내용 주입
      try {
        const decoded = Buffer.from(file.base64, 'base64').toString('utf-8');
        fileContext = `\n\n[첨부 파일: ${file.name}]\n${decoded.slice(0, 3000)}`;
      } catch {
        fileContext = `\n\n[첨부 파일: ${file.name}] (디코딩 불가 — 바이너리 파일)`;
      }
    }

    const fullPrompt = `${ADMIN_SYSTEM_PROMPT}${timeContext}${dbStatus}${fileContext}\n\n[이전 대화]\n${recentHistory || '(첫 대화)'}\n\n[사장님의 명령]\n${message}`;

    // ━━━ 5️⃣ Gemini AI 호출 (3단계 Fallback + 멀티모달) ━━━
    const genAI = new GoogleGenerativeAI(apiKey);
    // 멀티모달은 flash 모델로 (플래시 라이트는 이미지 미지원 수 있음)
    const MODELS = isImageFile 
      ? ['gemini-2.0-flash', 'gemini-1.5-flash'] 
      : ['gemini-2.0-flash-lite', 'gemini-2.0-flash', 'gemini-1.5-flash'];

    let result;
    let usedModel = '';

    for (const modelName of MODELS) {
      try {
        console.log(`👑 [관리자 AI] ${modelName} 시도...${isImageFile ? ' (멀티모달)' : ''}`);
        const model = genAI.getGenerativeModel({ model: modelName });

        if (isImageFile && file) {
          // 🖼️ 이미지 멀티모달: 텍스트 + 이미지 동시 전송
          result = await model.generateContent([
            fullPrompt,
            {
              inlineData: {
                mimeType: file.type,
                data: file.base64
              }
            }
          ]);
        } else {
          // 텍스트만
          result = await model.generateContent(fullPrompt);
        }

        usedModel = modelName;
        console.log(`✅ [관리자 AI] ${modelName} 성공!`);
        break;
      } catch (modelError: any) {
        console.error(`❌ [관리자 AI] ${modelName} 실패:`, modelError.message);
      }
    }

    if (!result) {
      console.error("🔥🔥🔥 [관리자 AI] 모든 모델 실패!");
      return NextResponse.json({
        success: false,
        reply: "사장님, 죄송합니다. AI 서비스가 일시적으로 불안정합니다. 잠시 후 다시 명령해주세요.",
        actionCode: 'NONE'
      }, { status: 500 });
    }

    // ━━━ 6️⃣ 응답 파싱 ━━━
    let rawText = '';
    try {
      rawText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    } catch (e: any) {
      console.error("❌ [관리자 AI] 응답 추출 실패:", e.message);
      return NextResponse.json({ success: false, reply: "AI 응답 처리 오류입니다, 사장님." }, { status: 500 });
    }

    // ━━━ 7️⃣ JSON 파싱 → 액션 코드 추출 ━━━
    try {
      const parsed = JSON.parse(rawText);

      // 액션 코드에 따른 자동 처리
      const actionCode = parsed.actionCode || 'NONE';
      let autoProcessed = false;

      // 심방 레이더 확인 요청 시 자동으로 데이터 첨부
      if (actionCode === 'PASTORAL_CHECK') {
        try {
          const cases = await prisma.pastoralCare.findMany({
            where: { status: 'NEEDS_CARE' },
            orderBy: { createdAt: 'desc' },
            take: 5
          });
          if (cases.length > 0) {
            const caseList = cases.map((c, i) => `${i + 1}. ${c.userName} — ${c.reason} (${c.priority})`).join('\n');
            parsed.reply += `\n\n📋 현재 돌봄 대기 목록:\n${caseList}`;
          }
          autoProcessed = true;
        } catch { /* 무시 */ }
      }

      return NextResponse.json({
        success: true,
        reply: parsed.reply || '명령을 수행했습니다, 사장님.',
        actionCode,
        actionLabel: parsed.actionLabel || null,
        actionLink: parsed.actionLink || null,
        dbCommand: parsed.dbCommand || null,
        autoProcessed,
        model: usedModel
      });
    } catch {
      // JSON 파싱 실패 → 원문 사용 + 액션 코드 텍스트에서 추출
      let actionCode = 'NONE';
      const actionMatch = rawText.match(/\[ACTION:\s*(\w+)\]/);
      if (actionMatch) actionCode = actionMatch[1];

      return NextResponse.json({
        success: true,
        reply: rawText.replace(/\[ACTION:\s*\w+\]/g, '').trim(),
        actionCode,
        actionLabel: null,
        actionLink: null
      });
    }

  } catch (error: any) {
    console.error("🔥🔥🔥 [관리자 AI 치명적 에러]:", error.message, error.stack);
    return NextResponse.json({
      success: false,
      reply: "사장님, 시스템에 예기치 않은 오류가 발생했습니다. 기술팀에 보고하겠습니다.",
      actionCode: 'NONE'
    }, { status: 500 });
  }
}
