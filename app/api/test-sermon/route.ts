import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const channelId = process.env.YOUTUBE_CHANNEL_ID;

    // 1. 유튜브에서 최근 영상 15개 가져오기
    const ytUrl = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet,id&order=date&maxResults=15&type=video`;
    const ytRes = await fetch(ytUrl);
    const ytData = await ytRes.json();

    if (!ytData.items) {
      return NextResponse.json({ error: "유튜브 데이터를 못 가져왔습니다. 키를 다시 확인해주세요!" });
    }

    // AI에게 줄 데이터(제목과 날짜만) 추리기
    const rawVideos = ytData.items.map((item: any) => ({
      title: item.snippet.title,
      date: item.snippet.publishedAt,
    }));

    // 2. 제미나이에게 "주일 대예배만 골라내!" 라고 명령하기
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const prompt = `
      다음은 거제반석교회 유튜브 영상들입니다. 
      당신은 이 목록에서 '주일 대예배(주일오전)'에 해당하는 설교 영상만 골라내야 합니다.
      (수요예배, 특송, 찬양 등은 무조건 제외할 것)
      
      결과는 아래 JSON 배열 형식으로만 대답하세요:
      [
        {"date": "YYYY-MM-DD", "title": "설교제목 (본문 제외)", "bible": "성경본문"}
      ]
      
      원본 데이터: ${JSON.stringify(rawVideos)}
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);

    // 불필요한 문자열 제거하고 깔끔한 JSON으로 변환
    const cleanText = result.response.text().replace(/```json|```/g, "").trim();
    const finalData = JSON.parse(cleanText);

    // 3. 화면에 쏴주기
    return NextResponse.json({
      status: "테스트 성공! 🎉",
      total_videos_checked: rawVideos.length,
      sunday_sermons_found: finalData
    });

  } catch (error: any) {
    console.error("테스트 에러:", error);
    return NextResponse.json({ status: "에러 발생 ㅠㅠ", message: error.message });
  }
}
