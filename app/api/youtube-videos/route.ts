import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API_KEY = process.env.YOUTUBE_API_KEY;
// 💡 채널 ID(UC...)의 'C'를 'U'로 바꾸면 업로드 재생목록 ID가 됩니다!
// playlistItems API는 할당량 1 (search API는 100) → 비용 1/100 절감!
const UPLOADS_PLAYLIST_ID = 'UUc_eP0i4YwSQmQ9du5-RHbA';

export async function GET() {
  try {
    if (!API_KEY) {
      return NextResponse.json({ success: false, error: 'API 키 미설정', videos: [] });
    }

    // playlistItems API 사용 (할당량 1단위로 매우 저렴!)
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${UPLOADS_PLAYLIST_ID}&maxResults=12&key=${API_KEY}`;
    const response = await fetch(url, { cache: 'no-store' });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('YouTube API 에러 응답:', errorBody);
      return NextResponse.json({ success: false, error: `YouTube API ${response.status}`, videos: [] });
    }

    const data = await response.json();

    if (!data.items) {
      return NextResponse.json({ success: true, videos: [] });
    }

    const videos = data.items.map((item: any) => {
      const title = item.snippet.title;
      const videoId = item.snippet.resourceId.videoId; // playlistItems는 resourceId 경로 사용
      let category = '기타 말씀';
      let gradient = 'linear-gradient(135deg, #1E293B, #334155)';

      if (title.includes('주일')) { category = '주일오전'; gradient = 'linear-gradient(135deg, #701a75, #9f1239)'; }
      else if (title.includes('수요')) { category = '수요예배'; gradient = 'linear-gradient(135deg, #064e3b, #0f766e)'; }
      else if (title.includes('새벽')) { category = '새벽기도'; gradient = 'linear-gradient(135deg, #451a03, #78350f)'; }

      const dateObj = new Date(item.snippet.publishedAt);
      const dateStr = `${dateObj.getFullYear()}. ${dateObj.getMonth() + 1}. ${dateObj.getDate()}`;

      return { id: videoId, videoId, title, category, verse: '은혜의 말씀', date: dateStr, gradient, summary: ["아래 재생 버튼을 눌러 생생한 은혜의 말씀을 들어보세요.", "언제 어디서나 반석교회와 함께 예배할 수 있습니다."] };
    });

    return NextResponse.json({ success: true, videos });
  } catch (error) {
    console.error('유튜브 영상 목록 오류:', error);
    return NextResponse.json({ success: false, error: '영상 목록 조회 실패', videos: [] });
  }
}
