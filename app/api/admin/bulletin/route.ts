import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Route Segment Config — 주보 이미지 업로드 대응
export const maxDuration = 60; // Vercel 서버리스 타임아웃 (초) — AI 이미지 분석 + DB 저장에 충분한 시간

// 주보 이미지 분석용 특화 프롬프트
const BULLETIN_ANALYSIS_PROMPT = `너는 교회 주보(예배 순서지) 이미지를 분석하는 전문 AI야.
첨부된 주보 이미지에서 다음 정보를 정확하게 추출해서 JSON으로 반환해.

반드시 아래 JSON 형식으로만 응답해:
{
  "date": "주보 날짜 (예: 2026년 4월 27일 주일)",
  "worshipType": "예배 종류 (예: 주일 1부 예배)",
  "worshipOrder": [
    {"order": 1, "item": "묵도", "detail": ""},
    {"order": 2, "item": "찬송", "detail": "28장 (복의 근원 강림하사)"},
    {"order": 3, "item": "신앙고백", "detail": "사도신경"},
    {"order": 4, "item": "대표기도", "detail": "홍길동 장로"},
    {"order": 5, "item": "성경봉독", "detail": "고린도전서 15:1-10"},
    {"order": 6, "item": "설교", "detail": "부활의 소망 / 이주민 목사"},
    {"order": 7, "item": "축도", "detail": ""}
  ],
  "announcements": ["광고1 내용", "광고2 내용"],
  "prayerPerson": "대표기도자 이름",
  "hymns": ["28장 복의 근원 강림하사", "94장 만세 반석 열린 곳에"],
  "hymnNumbers": [28, 94],
  "scripture": "고린도전서 15:1-10",
  "sermonTitle": "설교 제목",
  "offering": "헌금 안내 내용 (계좌번호 등)"
}

주의사항:
- 이미지에서 읽을 수 없는 항목은 빈 문자열("")로 채워
- worshipOrder는 순서대로 배열해
- 찬송가 번호를 정확히 읽어
- hymns 배열의 찬송가에서 숫자만 추출하여 hymnNumbers 정수 배열에도 넣을 것
- 예: hymns: ["28장 복의 근원"] → hymnNumbers: [28]
- 새찬송가 범위(1~645)에 해당하는 숫자만 hymnNumbers에 포함
- 날짜, 설교자, 성경 본문은 반드시 추출해`;

export async function POST(req: Request) {
  try {
    // ━━━ 요청 바디 파싱 (여기서 터지면 462ms 즉사 — 바디 크기 초과) ━━━
    let body;
    try {
      body = await req.json();
    } catch (parseError: any) {
      console.error('🚨🚨🚨 [주보 API] req.json() 파싱 실패:', parseError.message);
      return NextResponse.json({ 
        success: false, 
        error: `요청 파싱 실패: ${parseError.message?.slice(0, 100)}. 이미지가 너무 큰 것 같습니다.` 
      }, { status: 400 });
    }
    const { file, message } = body;

    // API 키 체크
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('🚨 [주보 API] GEMINI_API_KEY 환경변수 누락!');
      return NextResponse.json({ success: false, error: 'GEMINI_API_KEY 환경변수 누락' }, { status: 500 });
    }

    if (!file || !file.base64) {
      return NextResponse.json({ success: false, error: '주보 이미지가 필요합니다.' }, { status: 400 });
    }

    console.log('📋 [주보 분석] 시작:', file.name, file.type, `base64 원본 길이: ${file.base64?.length}`);

    // ✅ Base64 헤더 완전 제거 — 이중 안전장치
    let cleanBase64 = file.base64;
    // 방법1: 정규식으로 data:...;base64, 접두사 제거
    cleanBase64 = cleanBase64.replace(/^data:[^;]+;base64,/, '');
    // 방법2: 혹시 정규식이 놓쳤으면 콤마 기준으로 한번 더
    if (cleanBase64.includes(',')) {
      cleanBase64 = cleanBase64.split(',').pop() || cleanBase64;
    }
    
    // mimeType 결정 (프론트에서 image/jpeg로 압축했으므로 이걸 우선 사용)
    const mimeType = file.type || 'image/jpeg';
    
    console.log(`📋 [주보 분석] 정제 완료: base64 ${cleanBase64.length}자, 첫30자: ${cleanBase64.slice(0, 30)}..., mimeType: ${mimeType}`);

    // Gemini 멀티모달 분석
    const genAI = new GoogleGenerativeAI(apiKey);
    const MODELS = ['gemini-2.5-flash', 'gemini-2.5-pro'];
    
    let analysisResult: any = null;
    let lastError = '';

    for (const modelName of MODELS) {
      try {
        console.log(`📋 [주보 분석] ${modelName} 시도...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const result = await model.generateContent([
          BULLETIN_ANALYSIS_PROMPT + (message ? `\n\n추가 지시: ${message}` : ''),
          {
            inlineData: {
              mimeType,
              data: cleanBase64
            }
          }
        ]);

        const rawText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        console.log('📋 [주보 분석] AI 응답 길이:', rawText.length, '첫100자:', rawText.slice(0, 100));
        
        analysisResult = JSON.parse(rawText);
        console.log(`✅ [주보 분석] ${modelName} 성공!`);
        break;
      } catch (err: any) {
        lastError = err.message || String(err);
        console.error(`❌ [주보 분석] ${modelName} 실패:`, lastError);
        if (err.status) console.error(`   HTTP 상태: ${err.status}`);
        if (err.errorDetails) console.error(`   상세:`, JSON.stringify(err.errorDetails));
      }
    }

    if (!analysisResult) {
      return NextResponse.json({ 
        success: false, 
        error: `주보 이미지 분석 실패: ${lastError.slice(0, 100)}` 
      }, { status: 500 });
    }

    // ━━━ DB 저장 (테이블 자동 생성 포함) ━━━
    try {
      // Bulletin 테이블이 없으면 자동 생성
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Bulletin" (
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
        )
      `);

      // 기존 활성 주보 비활성화
      await prisma.$executeRawUnsafe(`UPDATE "Bulletin" SET "isActive" = false WHERE "isActive" = true`);

      // 새 주보 DB 저장 (raw SQL로 안전 삽입)
      const bulletinId = `bull_${Date.now().toString(36)}`;
      await prisma.$executeRawUnsafe(`
        INSERT INTO "Bulletin" ("id", "date", "worshipType", "worshipOrder", "announcements", "prayerPerson", "hymns", "scripture", "sermonTitle", "offering", "rawText", "isActive")
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true)
      `,
        bulletinId,
        analysisResult.date || '날짜 미상',
        analysisResult.worshipType || '주일예배',
        JSON.stringify(analysisResult.worshipOrder || []),
        JSON.stringify(analysisResult.announcements || []),
        analysisResult.prayerPerson || null,
        JSON.stringify(analysisResult.hymns || []),
        analysisResult.scripture || null,
        analysisResult.sermonTitle || null,
        analysisResult.offering || null,
        JSON.stringify(analysisResult)
      );

      console.log('✅ [주보 분석] DB 저장 완료! ID:', bulletinId);

      return NextResponse.json({
        success: true,
        bulletin: {
          id: bulletinId,
          date: analysisResult.date,
          worshipType: analysisResult.worshipType,
          worshipOrder: analysisResult.worshipOrder,
          announcements: analysisResult.announcements,
          sermonTitle: analysisResult.sermonTitle,
          scripture: analysisResult.scripture
        },
        reply: `주보 분석 완료! "${analysisResult.date}" ${analysisResult.worshipType}\n설교: ${analysisResult.sermonTitle || '미확인'}\n본문: ${analysisResult.scripture || '미확인'}\n온라인 주보가 자동으로 업데이트되었습니다, 사장님!`
      });

    } catch (dbError: any) {
      console.error('🔥 [주보 DB 저장 에러]:', dbError.message);
      // DB 에러가 나더라도, AI 분석 결과는 반환
      return NextResponse.json({
        success: true,
        reply: `주보 분석은 성공했지만 DB 저장 중 오류: ${dbError.message?.slice(0, 80)}\n\n분석 결과:\n설교: ${analysisResult.sermonTitle || '미확인'}\n본문: ${analysisResult.scripture || '미확인'}\n찬송: ${(analysisResult.hymns || []).join(', ')}`,
        bulletin: analysisResult
      });
    }

  } catch (error: any) {
    console.error('🔥 [주보 분석 치명적 에러]:', error.message);
    return NextResponse.json({ 
      success: false, 
      error: `주보 처리 중 오류: ${error.message}` 
    }, { status: 500 });
  }
}

// GET: 현재 활성 주보 조회
export async function GET() {
  try {
    // 테이블 없을 수 있으므로 raw SQL 사용
    const results: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "Bulletin" WHERE "isActive" = true ORDER BY "createdAt" DESC LIMIT 1`
    );

    if (!results || results.length === 0) {
      return NextResponse.json({ success: true, bulletin: null });
    }

    const bulletin = results[0];
    const parsedHymns = JSON.parse(bulletin.hymns || '[]');
    
    // 🎵 hymnNumbers 추출: rawText에서 AI가 넣은 hymnNumbers 사용, 없으면 hymns에서 자동 파싱
    let hymnNumbers: number[] = [];
    try {
      const rawData = JSON.parse(bulletin.rawText || '{}');
      if (Array.isArray(rawData.hymnNumbers) && rawData.hymnNumbers.length > 0) {
        hymnNumbers = rawData.hymnNumbers.filter((n: any) => typeof n === 'number' && n >= 1 && n <= 645);
      }
    } catch { /* rawText 파싱 실패 시 무시 */ }

    // Fallback: hymns 텍스트에서 번호 자동 추출
    if (hymnNumbers.length === 0 && parsedHymns.length > 0) {
      hymnNumbers = parsedHymns
        .map((h: string) => {
          const match = h.match(/(\d{1,3})/);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter((n: number) => n >= 1 && n <= 645);
    }

    return NextResponse.json({
      success: true,
      bulletin: {
        ...bulletin,
        worshipOrder: JSON.parse(bulletin.worshipOrder || '[]'),
        announcements: JSON.parse(bulletin.announcements || '[]'),
        hymns: parsedHymns,
        hymnNumbers,
      }
    });
  } catch (error: any) {
    // 테이블이 없는 경우 null 반환
    if (error.message?.includes('no such table')) {
      return NextResponse.json({ success: true, bulletin: null });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
