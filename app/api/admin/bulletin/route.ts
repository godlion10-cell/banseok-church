import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Route Segment Config — 주보 이미지 업로드 대응
export const maxDuration = 30;

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
  "scripture": "고린도전서 15:1-10",
  "sermonTitle": "설교 제목",
  "offering": "헌금 안내 내용 (계좌번호 등)"
}

주의사항:
- 이미지에서 읽을 수 없는 항목은 빈 문자열("")로 채워
- worshipOrder는 순서대로 배열해
- 찬송가 번호를 정확히 읽어
- 날짜, 설교자, 성경 본문은 반드시 추출해`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { file, message } = body;

    // API 키 체크
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'API 키 누락' }, { status: 500 });
    }

    if (!file || !file.base64) {
      return NextResponse.json({ success: false, error: '주보 이미지가 필요합니다.' }, { status: 400 });
    }

    console.log('📋 [주보 분석] 시작:', file.name, file.type);

    // Base64 정제
    const cleanBase64 = file.base64.replace(/^data:[^;]+;base64,/, '');

    // Gemini 멀티모달 분석
    const genAI = new GoogleGenerativeAI(apiKey);
    const MODELS = ['gemini-2.5-flash', 'gemini-2.5-pro'];
    
    let analysisResult: any = null;

    for (const modelName of MODELS) {
      try {
        console.log(`📋 [주보 분석] ${modelName} 시도...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const result = await model.generateContent([
          BULLETIN_ANALYSIS_PROMPT + (message ? `\n\n추가 지시: ${message}` : ''),
          {
            inlineData: {
              mimeType: file.type || 'image/jpeg',
              data: cleanBase64
            }
          }
        ]);

        const rawText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        console.log('📋 [주보 분석] AI 응답 길이:', rawText.length);
        
        analysisResult = JSON.parse(rawText);
        console.log(`✅ [주보 분석] ${modelName} 성공!`);
        break;
      } catch (err: any) {
        console.error(`❌ [주보 분석] ${modelName} 실패:`, err.message);
      }
    }

    if (!analysisResult) {
      return NextResponse.json({ 
        success: false, 
        error: '주보 이미지 분석에 실패했습니다. 이미지를 더 선명하게 찍어주세요.' 
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
    return NextResponse.json({
      success: true,
      bulletin: {
        ...bulletin,
        worshipOrder: JSON.parse(bulletin.worshipOrder || '[]'),
        announcements: JSON.parse(bulletin.announcements || '[]'),
        hymns: JSON.parse(bulletin.hymns || '[]')
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
