import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// 환경 변수에서 API 키를 가져옵니다.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { documentText, taskType } = await req.json();

    // 임무에 따른 맞춤형 프롬프트(명령어) 설정
    let systemPrompt = '';
    if (taskType === 'sermon') {
      systemPrompt = `
        당신은 탁월한 교회 행정 비서입니다. 다음 설교 원고를 분석하여 JSON 형식으로만 답변하세요.
        {
          "summary": "설교 3줄 요약",
          "snsText": "인스타그램용 감성적인 짧은 글귀 1개",
          "qtQuestions": ["묵상 질문 1", "묵상 질문 2"],
          "youtubeTitle": "클릭을 유도하는 유튜브 제목 추천 1개"
        }
      `;
    } else if (taskType === 'bulletin') {
      systemPrompt = `
        당신은 꼼꼼한 예배 디렉터입니다. 다음 주보 내용을 분석하여 준비해야 할 리소스를 JSON 형식으로만 답변하세요.
        {
          "missingItems": ["누락된 것으로 보이는 항목 1", "항목 2 (없으면 빈 배열)"],
          "actionItems": ["찬양 PPT 제작 (곡명: ...)", "성경 봉독 텍스트 준비 (본문: ...)"]
        }
      `;
    }

    const finalPrompt = `${systemPrompt}\n\n[분석할 내용]\n${documentText}`;

    // 💡 모델 자동 전환(Fallback) 시스템
    let result;
    try {
      // 1차 시도: 빠르고 가성비 좋은 Flash 모델
      const flashModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
      result = await flashModel.generateContent(finalPrompt);
      console.log('Flash 모델로 성공적으로 처리했습니다.');
    } catch (flashError) {
      console.warn('Flash 모델 처리 중 에러 발생. Pro 모델로 자동 전환합니다...', flashError);
      // 2차 시도: Flash가 실패하면 Pro 모델로 전환
      const proModel = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });
      result = await proModel.generateContent(finalPrompt);
      console.log('Pro 모델로 복구 처리 완료했습니다.');
    }

    // 결과값에서 순수 JSON 텍스트만 추출
    const responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '');

    return NextResponse.json({ success: true, data: JSON.parse(responseText) });

  } catch (error) {
    console.error('AI 분석 최종 실패:', error);
    return NextResponse.json({ success: false, error: 'AI 분석 중 서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
