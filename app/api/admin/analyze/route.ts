import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

// Route Segment Config — 멀티모달 AI 분석 + DB 저장
export const maxDuration = 60;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧠 유니버설 AI 분석 프롬프트 — 카테고리 자동 판별 + 구조화
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const UNIVERSAL_ANALYSIS_PROMPT = `너는 거제반석교회의 "스마트 분류 엔진"이다.
첨부된 이미지/텍스트를 분석하여, 해당 콘텐츠의 카테고리를 정확하게 판별하고
카테고리에 맞는 구조화된 데이터를 추출해야 한다.

## 📌 카테고리 판별 기준

### BULLETIN (주보/예배 순서지)
- 예배 순서가 있다 (묵도, 찬송, 기도, 설교, 축도 등)
- 찬송가 번호가 있다
- 날짜 + 예배 종류가 명시되어 있다
- 대표기도자, 성경 본문, 설교 제목이 있다
- 교회 광고/소식 섹션이 있다

### SERMON (설교 원고/요약)
- 설교 제목과 성경 본문이 주요 내용이다
- 설교 내용이 본문 해설, 적용, 결론 구조다
- 예배 순서 없이 설교만 독립적으로 존재한다
- 목사님의 메시지/강해가 중심이다

### NEWS (교회 소식/공지/광고)
- 교회 행사, 일정, 공지사항이 주 내용이다
- 단독 소식/이벤트 안내다
- 예배 순서나 설교 원고가 아닌 일반 알림이다

## 🎯 응답 형식 (반드시 이 JSON 형식으로만 답변)

카테고리에 따라 content 구조가 달라진다:

### BULLETIN인 경우:
{
  "category": "BULLETIN",
  "confidence": 0.95,
  "summary": "2026년 4월 27일 주일 1부 예배 주보",
  "content": {
    "date": "2026년 4월 27일 주일",
    "worshipType": "주일 1부 예배",
    "worshipOrder": [
      {"order": 1, "item": "묵도", "detail": ""},
      {"order": 2, "item": "찬송", "detail": "28장 (복의 근원 강림하사)"}
    ],
    "announcements": ["광고1", "광고2"],
    "prayerPerson": "홍길동 장로",
    "hymns": ["28장 복의 근원 강림하사", "94장 만세 반석 열린 곳에"],
    "hymnNumbers": [28, 94],
    "scripture": "고린도전서 15:1-10",
    "sermonTitle": "부활의 소망",
    "offering": "헌금 안내"
  }
}

⚠️ **hymnNumbers 추출 규칙 (매우 중요):**
- hymns 배열에서 찬송가 번호(숫자만)를 별도로 추출하여 hymnNumbers 정수 배열에 넣을 것
- 예: hymns: ["28장 복의 근원"] → hymnNumbers: [28]
- 예배 순서의 "찬송" 항목에서도 번호를 추출할 것
- 새찬송가 범위(1~645)에 해당하는 숫자만 포함
- 찬송가가 없으면 빈 배열 [] 반환

### SERMON인 경우:
{
  "category": "SERMON",
  "confidence": 0.90,
  "summary": "설교 제목과 핵심 요약",
  "content": {
    "category": "주일오전",
    "title": "설교 제목",
    "content": "설교 핵심 요약 (3~5줄)",
    "scripture": "성경 본문"
  }
}

### NEWS인 경우:
{
  "category": "NEWS",
  "confidence": 0.85,
  "summary": "소식 제목 요약",
  "content": {
    "title": "소식 제목",
    "content": "소식 상세 내용"
  }
}

## ⚠️ 주의사항
- 이미지에서 읽을 수 없는 항목은 빈 문자열("")로 채워
- confidence는 판별 확신도 (0.0~1.0)
- 반드시 위 3개 카테고리 중 하나만 선택
- JSON 이외의 텍스트는 절대 출력하지 마`;

// ━━━ Base64 정제 유틸리티 ━━━
function cleanBase64Data(raw: string): string {
  let clean = raw.replace(/^data:[^;]+;base64,/, '');
  if (clean.includes(',')) {
    clean = clean.split(',').pop() || clean;
  }
  return clean;
}

export async function POST(req: Request) {
  try {
    // ━━━ 1️⃣ 요청 바디 파싱 ━━━
    let body;
    try {
      body = await req.json();
    } catch (parseError: any) {
      console.error('🚨 [스마트 분석] req.json() 파싱 실패:', parseError.message);
      return NextResponse.json({
        success: false,
        error: `요청 파싱 실패: ${parseError.message?.slice(0, 100)}. 파일이 너무 큰 것 같습니다.`
      }, { status: 400 });
    }

    const { file, text, message } = body;

    // ━━━ 2️⃣ API 키 체크 ━━━
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('🚨 [스마트 분석] GEMINI_API_KEY 환경변수 누락!');
      return NextResponse.json({ success: false, error: 'GEMINI_API_KEY 환경변수 누락' }, { status: 500 });
    }

    // 파일 또는 텍스트 중 하나는 있어야 함
    if (!file?.base64 && !text) {
      return NextResponse.json({ success: false, error: '분석할 파일 또는 텍스트가 필요합니다.' }, { status: 400 });
    }

    console.log('🧠 [스마트 분석] 시작:', file ? `파일: ${file.name} (${file.type})` : `텍스트: ${text?.length}자`);

    // ━━━ 3️⃣ Gemini AI 분석 (멀티모달/텍스트 자동 분기) ━━━
    const genAI = new GoogleGenerativeAI(apiKey);
    const MODELS = ['gemini-2.5-flash', 'gemini-2.5-pro'];

    let aiResult: any = null;
    let usedModel = '';
    let lastError = '';

    const promptWithExtra = UNIVERSAL_ANALYSIS_PROMPT + (message ? `\n\n추가 지시사항: ${message}` : '');

    for (const modelName of MODELS) {
      try {
        console.log(`🧠 [스마트 분석] ${modelName} 시도...`);
        const model = genAI.getGenerativeModel({ model: modelName });

        let result;
        if (file?.base64) {
          // 멀티모달: 이미지/PDF 분석
          const cleanBase64 = cleanBase64Data(file.base64);
          const mimeType = file.type || 'image/jpeg';
          console.log(`   📎 멀티모달: ${mimeType}, base64 ${cleanBase64.length}자`);

          result = await model.generateContent([
            promptWithExtra,
            { inlineData: { mimeType, data: cleanBase64 } }
          ]);
        } else {
          // 텍스트만 분석
          result = await model.generateContent(`${promptWithExtra}\n\n[분석할 내용]\n${text}`);
        }

        const rawText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        console.log(`🧠 [스마트 분석] AI 응답:`, rawText.slice(0, 200));

        aiResult = JSON.parse(rawText);
        usedModel = modelName;
        console.log(`✅ [스마트 분석] ${modelName} 성공! 카테고리: ${aiResult.category}, 확신도: ${aiResult.confidence}`);
        break;
      } catch (err: any) {
        lastError = err.message || String(err);
        console.error(`❌ [스마트 분석] ${modelName} 실패:`, lastError);
      }
    }

    if (!aiResult || !aiResult.category) {
      return NextResponse.json({
        success: false,
        error: `AI 분석 실패: ${lastError.slice(0, 100)}`
      }, { status: 500 });
    }

    // ━━━ 4️⃣ 카테고리별 DB 라우팅 + 저장 + revalidatePath ━━━
    const { category, content, confidence, summary } = aiResult;
    let dbResult: any = null;
    let savedTo = '';
    let revalidatedPath = '';
    let reply = '';

    try {
      switch (category) {
        // ═══════════════════════════════════════════
        // 📋 BULLETIN — 주보 저장
        // ═══════════════════════════════════════════
        case 'BULLETIN': {
          // 기존 활성 주보 비활성화
          await prisma.$executeRawUnsafe(
            `CREATE TABLE IF NOT EXISTS "Bulletin" (
              "id" TEXT PRIMARY KEY NOT NULL,
              "date" TEXT NOT NULL,
              "worshipType" TEXT NOT NULL DEFAULT '주일예배',
              "worshipOrder" TEXT NOT NULL,
              "announcements" TEXT,
              "prayerPerson" TEXT,
              "hymns" TEXT,
              "scripture" TEXT,
              "sermonTitle" TEXT,
              "offering" TEXT,
              "rawText" TEXT,
              "isActive" BOOLEAN NOT NULL DEFAULT true,
              "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )`
          );
          await prisma.$executeRawUnsafe(`UPDATE "Bulletin" SET "isActive" = false WHERE "isActive" = true`);

          const bulletinId = `bull_${Date.now().toString(36)}`;
          await prisma.$executeRawUnsafe(
            `INSERT INTO "Bulletin" ("id", "date", "worshipType", "worshipOrder", "announcements", "prayerPerson", "hymns", "scripture", "sermonTitle", "offering", "rawText", "isActive")
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true)`,
            bulletinId,
            content.date || '날짜 미상',
            content.worshipType || '주일예배',
            JSON.stringify(content.worshipOrder || []),
            JSON.stringify(content.announcements || []),
            content.prayerPerson || null,
            JSON.stringify(content.hymns || []),
            content.scripture || null,
            content.sermonTitle || null,
            content.offering || null,
            JSON.stringify(content)
          );

          dbResult = { id: bulletinId, ...content };
          savedTo = 'Bulletin';
          revalidatedPath = '/bulletin';
          revalidatePath('/bulletin');
          reply = `📋 주보 분석 완료! "${content.date}" ${content.worshipType}\n설교: ${content.sermonTitle || '미확인'}\n본문: ${content.scripture || '미확인'}\n\n✅ 온라인 주보가 자동으로 업데이트되었습니다!`;
          break;
        }

        // ═══════════════════════════════════════════
        // 🎤 SERMON — 설교 저장
        // ═══════════════════════════════════════════
        case 'SERMON': {
          dbResult = await prisma.sermon.create({
            data: {
              category: content.category || '주일오전',
              title: content.title || summary || '제목 미상',
              content: content.content || content.scripture || null,
              videoId: content.videoId || null,
            }
          });
          savedTo = 'Sermon';
          revalidatedPath = '/sermon-video';
          revalidatePath('/sermon-video');
          revalidatePath('/sermon-radio');
          revalidatePath('/');
          reply = `🎤 설교 등록 완료!\n제목: "${content.title}"\n카테고리: ${content.category || '주일오전'}\n${content.scripture ? `본문: ${content.scripture}` : ''}\n\n✅ 설교 페이지가 자동으로 업데이트되었습니다!`;
          break;
        }

        // ═══════════════════════════════════════════
        // 📢 NEWS — 교회 소식 저장
        // ═══════════════════════════════════════════
        case 'NEWS': {
          // 현재 최대 order 조회해서 +1
          let maxOrder = 0;
          try {
            const newsItems = await prisma.news.findMany({ orderBy: { order: 'desc' }, take: 1 });
            if (newsItems.length > 0) maxOrder = newsItems[0].order;
          } catch { /* 첫 번째 뉴스 */ }

          dbResult = await prisma.news.create({
            data: {
              title: content.title || summary || '교회 소식',
              content: content.content || '',
              order: maxOrder + 1,
            }
          });
          savedTo = 'News';
          revalidatedPath = '/';
          revalidatePath('/');
          reply = `📢 교회 소식 등록 완료!\n제목: "${content.title}"\n\n✅ 홈페이지 교회소식 탭이 자동으로 업데이트되었습니다!`;
          break;
        }

        default:
          return NextResponse.json({
            success: false,
            error: `AI가 알 수 없는 카테고리를 반환했습니다: "${category}". BULLETIN, SERMON, NEWS 중 하나여야 합니다.`
          }, { status: 400 });
      }

      console.log(`✅ [스마트 분석] DB 저장 완료! 카테고리: ${category}, 테이블: ${savedTo}, 모델: ${usedModel}`);

      return NextResponse.json({
        success: true,
        category,
        confidence,
        summary,
        savedTo,
        revalidatedPath,
        dbResult,
        reply,
        model: usedModel,
      });

    } catch (dbError: any) {
      console.error(`🔥 [스마트 분석] DB 저장 에러 (${category}):`, dbError.message);
      // DB 에러 시에도 AI 분석 결과는 반환
      return NextResponse.json({
        success: true,
        category,
        confidence,
        summary,
        savedTo: null,
        dbError: dbError.message?.slice(0, 100),
        reply: `AI 분석은 성공했지만 DB 저장 중 오류 발생: ${dbError.message?.slice(0, 80)}\n\n분석 카테고리: ${category}\n요약: ${summary}`,
        content,
        model: usedModel,
      });
    }

  } catch (error: any) {
    console.error('🔥 [스마트 분석 치명적 에러]:', error.message);
    return NextResponse.json({
      success: false,
      error: `분석 처리 중 오류: ${error.message}`
    }, { status: 500 });
  }
}
