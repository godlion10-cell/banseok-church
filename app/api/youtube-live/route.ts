import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || 'UCc_eP0i4YwSQmQ9du5-RHbA';
const API_KEY = process.env.YOUTUBE_API_KEY;

function isWorshipTime(): boolean {
  const now = new Date();
  const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000) + (now.getTimezoneOffset() * 60 * 1000));
  const day = kst.getDay();
  const t = kst.getHours() * 60 + kst.getMinutes();
  return (
    (day === 0 && t >= 520 && t <= 640) ||
    (day === 0 && t >= 630 && t <= 760) ||
    (day === 0 && t >= 820 && t <= 940) ||
    (day === 3 && t >= 1150 && t <= 1270) ||
    (day === 5 && t >= 1180 && t <= 1300) ||
    (day >= 1 && day <= 5 && t >= 325 && t <= 380)
  );
}

// 💡 유튜브 API로 라이브 감지 (정확하고 안정적)
async function getLiveStreamFromAPI(): Promise<{ videoId: string; title: string; thumbnail: string } | null> {
  if (!API_KEY) return null;
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&type=video&eventType=live&key=${API_KEY}`;
    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();

    if (data.items && data.items.length > 0) {
      const liveVideo = data.items[0];
      return {
        videoId: liveVideo.id.videoId,
        title: liveVideo.snippet.title,
        thumbnail: liveVideo.snippet.thumbnails?.high?.url || '',
      };
    }
  } catch (error) {
    console.error('유튜브 API 라이브 감지 오류:', error);
  }
  return null;
}

// 🔄 HTML 스크래핑 폴백 (API 키가 없거나 할당량 초과 시)
async function getLiveStreamFromScrape(): Promise<{ videoId: string; title: string } | null> {
  try {
    const res = await fetch(`https://www.youtube.com/@petros-church/live`, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9',
        'Cookie': 'CONSENT=PENDING+987; SOCS=CAESEwgDEgk2MTcyNTcyNTIaAmVuIAEaBgiA_LyaBg',
      },
    });
    if (!res.ok) return null;
    const html = await res.text();
    if (!html.includes('BADGE_STYLE_TYPE_LIVE_NOW')) return null;
    const match = html.match(/<link\s+rel="canonical"\s+href="https:\/\/www\.youtube\.com\/watch\?v=([^"&]+)"/) ||
                  html.match(/<meta\s+property="og:url"\s+content="https:\/\/www\.youtube\.com\/watch\?v=([^"&]+)"/);
    if (!match) return null;
    return { videoId: match[1], title: '' };
  } catch { return null; }
}

export async function GET() {
  try {
    // 1차: 유튜브 API로 정확한 라이브 감지
    const apiResult = await getLiveStreamFromAPI();
    if (apiResult) {
      return NextResponse.json({
        live: true, videoId: apiResult.videoId, title: apiResult.title,
        thumbnail: apiResult.thumbnail, method: 'youtube-api'
      });
    }

    // 2차: API 실패 시 HTML 스크래핑 폴백
    const scrapeResult = await getLiveStreamFromScrape();
    if (scrapeResult) {
      return NextResponse.json({
        live: true, videoId: scrapeResult.videoId, title: scrapeResult.title, method: 'scrape-fallback'
      });
    }

    // 3차: 예배 시간 기반 폴백
    if (isWorshipTime()) {
      return NextResponse.json({
        live: true, videoId: null, title: '실시간 예배', method: 'time-fallback', channelId: CHANNEL_ID
      });
    }

    return NextResponse.json({ live: false, videoId: null, title: '' });
  } catch {
    if (isWorshipTime()) {
      return NextResponse.json({
        live: true, videoId: null, title: '실시간 예배', method: 'error-fallback', channelId: CHANNEL_ID
      });
    }
    return NextResponse.json({ live: false, videoId: null });
  }
}
