import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function GET() {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const channelId = process.env.YOUTUBE_CHANNEL_ID;

    // 1. 유튜브에서 최근 영상 15개 가져오기
    const ytResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet,id&order=date&maxResults=15&type=video`
    );
    const ytData = await ytResponse.json();

    if (!ytData.items) throw new Error("유튜브 데이터를 가져오지 못했습니다.");

    // 2. 제목만 뽑아서 제미나이에게 분석시키기
    const rawVideos = ytData.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      publishedAt: item.snippet.publishedAt
    }));

    const prompt = `
      당신은 교회 행정 비서입니다. 아래 유튜브 영상 제목들을 분석해서 [예배종류, 날짜, 주제, 본문]을 추출해 JSON 배열로만 응답하세요.
      - 예배종류: '주일오전', '수요예배', '새벽기도', '기타'
      - 날짜 형식: 'YYYY-MM-DD'
      목록: ${JSON.stringify(rawVideos)}
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().replace(/```json|```/g, "");
    const analyzedVideos = JSON.parse(responseText);

    // 3. 분석된 결과 반환
    return NextResponse.json({ success: true, data: analyzedVideos });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "동기화 중 오류 발생" });
  }
}
