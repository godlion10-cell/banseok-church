import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Route Segment Config — 파일 첨부 대응
export const maxDuration = 60; // Vercel 서버리스 타임아웃 (초) — 멀티모달 분석 + DB 조회에 충분한 시간

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
- [ACTION: ADD_NEWS] — 교회 소식 추가 (그리드 박스 1개 = News 레코드 1개. 각 소식을 개별 항목으로 분리하여 order 번호를 순서대로 지정. 중복 제목은 추가하지 말 것)
- [ACTION: DELETE_NEWS] — 교회 소식 삭제 (제목 또는 번호로 삭제)
- [ACTION: CLEAR_NEWS] — 교회 소식 전체 삭제
- [ACTION: UPDATE_SCHEDULE] — 예배 일정 수정 요청
- [ACTION: UPDATE_WORSHIP_ORDER] — 예배 순서 수정 요청
- [ACTION: BULLETIN_UPDATE] — 주보 이미지 분석 및 온라인 주보 업데이트 요청
- [ACTION: DB_MODIFY] — 기타 DB 수정 요청
- [ACTION: DEPLOY] — 배포/코드 수정 요청
- [ACTION: PASTORAL_CHECK] — 심방 레이더 확인 요청
- [ACTION: NONE] — 단순 질문/대화 (액션 불필요)

## 교회소식 그리드 박스 구조
홈페이지 '교회소식' 탭에는 소식이 가로세로 그리드(3열) 박스로 표시됨.
DB의 News 테이블에서 각 레코드가 1개의 그리드 박스임.
- title: 소식 제목 (중복 방지용)
- content: 소식 내용 (박스에 표시되는 전체 텍스트)
- order: 순서 번호 (1, 2, 3...)

사장님이 소식 이미지를 첨부하면, 이미지를 분석하여 각 소식 항목을 개별 그리드 박스로 분류하여 추가해라.
ADD_NEWS 시 newsItems 배열에 각 항목을 {title, content, order} 객체로 넣어라.

## 응답 형식
반드시 아래 JSON 형식으로만 답변하세요:
{
  "reply": "울트라 반석이의 답변",
  "actionCode": "ACTION_CODE (위 목록 중 하나)",
  "actionLabel": "버튼 텍스트 (선택사항, 없으면 null)",
  "actionLink": "이동할 경로 (선택사항, 없으면 null)",
  "dbCommand": "실행할 DB 명령 설명 (선택사항, 없으면 null)",
  "newsItems": [{"title": "제목", "content": "내용", "order": 1}] // ADD_NEWS 시만 필수, 아니면 null
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

    // 파일 첨부 정보 로깅 + 유효성 검증
    if (file) {
      const b64Start = typeof file.base64 === 'string' ? file.base64.substring(0, 50) : 'NOT_STRING';
      console.log(`📎 [관리자 API] 파일 첨부: ${file.name}`);
      console.log(`   └─ type: ${file.type}, base64 시작: ${b64Start}...`);
      console.log(`   └─ base64 길이: ${file.base64?.length || 0} 문자 (≈${Math.round((file.base64?.length || 0) * 0.75 / 1024)}KB)`);
      
      if (!file.base64 || file.base64.length < 100) {
        console.error('🚨 [관리자 API] base64 데이터가 너무 작거나 없습니다!');
        return NextResponse.json({ success: false, reply: '파일 데이터가 손상되었습니다. 다시 첨부해주세요, 사장님.' }, { status: 400 });
      }
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

    // ━━━ 멀티모달 파일 처리 유틸리티 ━━━
    const fileToGenerativePart = (base64Data: string, mimeType: string) => {
      let cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
      if (cleanBase64.includes(',')) {
        cleanBase64 = cleanBase64.split(',').pop() || cleanBase64;
      }
      console.log(`🧪 [fileToGenerativePart] mimeType=${mimeType}, 원본=${base64Data.length}자, 정제후=${cleanBase64.length}자, 첫20자=${cleanBase64.slice(0,20)}`);
      return {
        inlineData: {
          data: cleanBase64,
          mimeType: mimeType
        }
      };
    };

    // 멀티모달 지원 파일 타입
    const MULTIMODAL_TYPES = [
      'image/png', 'image/jpeg', 'image/webp', 'image/gif',
      'application/pdf',
    ];
    const isMultimodalFile = file && MULTIMODAL_TYPES.some(t => file.type?.startsWith(t.split('/')[0]) || file.type === t);

    // 텍스트 기반 파일
    let fileContext = '';
    if (file && !isMultimodalFile) {
      try {
        const cleanBase64 = file.base64.includes(',') ? file.base64.split(',')[1] : file.base64;
        const decoded = Buffer.from(cleanBase64, 'base64').toString('utf-8');
        fileContext = `\n\n[📎 첨부 파일: ${file.name} (${file.type})]\n--- 파일 내용 시작 ---\n${decoded.slice(0, 5000)}\n--- 파일 내용 끝 ---`;
        console.log(`📄 [관리자 API] 텍스트 파일 디코딩 성공: ${decoded.length}자`);
      } catch {
        fileContext = `\n\n[📎 첨부 파일: ${file.name}] (바이너리 파일 — 텍스트 디코딩 불가)`;
      }
    }

    const fullPrompt = `${ADMIN_SYSTEM_PROMPT}${timeContext}${dbStatus}${fileContext}\n\n[이전 대화]\n${recentHistory || '(첫 대화)'}\n\n[사장님의 명령]\n${message}`;

    // ━━━ 5️⃣ Gemini AI 호출 ━━━
    const genAI = new GoogleGenerativeAI(apiKey);
    const MODELS = isMultimodalFile 
      ? ['gemini-2.5-flash', 'gemini-2.5-pro'] 
      : ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.5-flash-lite'];

    let result;
    let usedModel = '';

    for (const modelName of MODELS) {
      try {
        console.log(`👑 [관리자 AI] ${modelName} 시도...${isMultimodalFile ? ` (멀티모달: ${file.type})` : ''}`);
        const model = genAI.getGenerativeModel({ model: modelName });

        if (isMultimodalFile && file) {
          const filePart = fileToGenerativePart(file.base64, file.type);
          console.log(`📦 [멀티모달] 파일 파트 생성 완료: ${file.type}, ${Math.round(filePart.inlineData.data.length * 0.75 / 1024)}KB`);
          result = await model.generateContent([fullPrompt, filePart]);
        } else {
          result = await model.generateContent(fullPrompt);
        }

        usedModel = modelName;
        console.log(`✅ [관리자 AI] ${modelName} 성공!`);
        break;
      } catch (modelError: any) {
        console.error(`❌ [관리자 AI] ${modelName} 실패:`, modelError.message);
        if (modelError.message?.includes('Could not process')) {
          console.error(`⚠️ [멀티모달] 파일 처리 거부 — mimeType: ${file?.type}, base64 길이: ${file?.base64?.length}`);
        }
      }
    }

    if (!result) {
      console.error('🔥🔥🔥 [관리자 AI] 모든 모델 실패!');
      const isFileRelated = !!file;
      return NextResponse.json({
        success: false,
        reply: isFileRelated 
          ? `사장님, 파일(${file.name}) 처리 중 AI 서비스가 실패했습니다.\n파일 크기를 줄이거나, 파일 없이 다시 시도해주세요.`
          : '사장님, AI 서비스가 일시적으로 불안정합니다. 잠시 후 다시 명령해주세요.',
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
      const actionCode = parsed.actionCode || 'NONE';
      let autoProcessed = false;

      // 심방 레이더 확인
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

      // 📢 교회소식 추가 — newsItems 배열을 DB에 자동 저장
      if (actionCode === 'ADD_NEWS' && parsed.newsItems && Array.isArray(parsed.newsItems)) {
        try {
          const existing = await prisma.news.findMany({ select: { title: true } });
          const existingTitles = new Set(existing.map((n: any) => n.title));
          let added = 0;
          for (const item of parsed.newsItems) {
            if (item.title && item.content && !existingTitles.has(item.title)) {
              await prisma.news.create({ data: { title: item.title, content: item.content, order: item.order || 0 } });
              added++;
            }
          }
          parsed.reply += `\n\n✅ 교회소식 ${added}건이 그리드 박스로 등록되었습니다.`;
          autoProcessed = true;
        } catch (e: any) {
          parsed.reply += `\n\n❌ 소식 등록 실패: ${e.message}`;
        }
      }

      // 🗑️ 교회소식 삭제 — 번호 또는 키워드로 삭제
      if (actionCode === 'DELETE_NEWS') {
        try {
          const allText = [parsed.dbCommand, parsed.reply, message].filter(Boolean).join(' ');
          let deleted = false;
          // 1차: 번호로 삭제 (예: "3번 삭제")
          const numMatch = allText.match(/(\d+)\s*번/);
          if (numMatch) {
            const idx = parseInt(numMatch[1]);
            const allNews = await prisma.news.findMany({ orderBy: { order: 'asc' } });
            if (allNews[idx - 1]) {
              const t = allNews[idx - 1];
              await prisma.news.delete({ where: { id: t.id } });
              parsed.reply = `${idx}번 그리드 박스 '${t.title}' 삭제 완료, 사장님.`;
              deleted = true;
            }
          }
          // 2차: 키워드 매칭
          if (!deleted) {
            const allNews = await prisma.news.findMany();
            for (const n of allNews) {
              if (allText.includes(n.title)) {
                await prisma.news.delete({ where: { id: n.id } });
                parsed.reply = `'${n.title}' 소식 삭제 완료, 사장님.`;
                deleted = true;
                break;
              }
            }
          }
          if (!deleted) parsed.reply += '\n삭제 대상을 찾지 못했습니다. "3번 삭제" 형태로 명령해주세요.';
          autoProcessed = true;
        } catch (e: any) {
          parsed.reply += `\n삭제 실패: ${e.message}`;
        }
      }

      // 🗑️ 교회소식 전체 삭제
      if (actionCode === 'CLEAR_NEWS') {
        try {
          const result = await prisma.news.deleteMany({});
          parsed.reply += `\n\n✅ 교회소식 ${result.count}건이 전체 삭제되었습니다.`;
          autoProcessed = true;
        } catch (e: any) {
          parsed.reply += `\n\n❌ 전체 삭제 실패: ${e.message}`;
        }
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
