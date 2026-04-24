import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || 'UCc_eP0i4YwSQmQ9du5-RHbA';
const API_KEY = process.env.YOUTUBE_API_KEY || 'AIzaSyA-r27nf8ikF5-JKDsAbkTpbOI67HG5NZU';

// ===== 예배 시간 판별 (한국시간 기준) =====
function getKST(): Date {
  const now = new Date();
  return new Date(now.getTime() + (9 * 60 * 60 * 1000) + (now.getTimezoneOffset() * 60 * 1000));
}

function isWorshipTime(): boolean {
  const kst = getKST();
  const day = kst.getDay(); // 0=일, 1=월, ..., 6=토
  const t = kst.getHours() * 60 + kst.getMinutes(); // 분 단위
  // ※ 전후 10분 여유 포함 (방송 시작/종료 버퍼)

  return (
    // 새벽기도 월~토 05:30~06:00 → 버퍼 05:20~06:10
    (day >= 1 && day <= 6 && t >= 320 && t <= 370) ||
    // 주일 1부 08:55~10:10 → 버퍼 08:45~10:20
    (day === 0 && t >= 525 && t <= 620) ||
    // 주일 2부 10:40~12:20 → 버퍼 10:30~12:30
    (day === 0 && t >= 630 && t <= 750) ||
    // 주일 오후 13:45~15:05 → 버퍼 13:35~15:15
    (day === 0 && t >= 815 && t <= 915) ||
    // 수요예배 19:25~20:35 → 버퍼 19:15~20:45
    (day === 3 && t >= 1155 && t <= 1245) ||
    // 금요기도회 19:50~21:05 → 버퍼 19:40~21:15
    (day === 5 && t >= 1180 && t <= 1275)
  );
}

// ===== 1순위: HTML 스크래핑 (무료! API 할당량 0) =====
async function detectLiveByScraping(): Promise<{ videoId: string; title: string } | null> {
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

    // 라이브 뱃지가 없으면 방송 중이 아님
    if (!html.includes('BADGE_STYLE_TYPE_LIVE_NOW')) return null;

    // 영상 ID 추출
    const match = html.match(/<link\s+rel="canonical"\s+href="https:\/\/www\.youtube\.com\/watch\?v=([^"&]+)"/) ||
                  html.match(/<meta\s+property="og:url"\s+content="https:\/\/www\.youtube\.com\/watch\?v=([^"&]+)"/);
    if (!match) return null;

    // 제목 추출
    const titleMatch = html.match(/<meta\s+name="title"\s+content="([^"]+)"/) ||
                       html.match(/<title>([^<]+)<\/title>/);
    const title = titleMatch ? titleMatch[1].replace(' - YouTube', '') : '실시간 예배';

    return { videoId: match[1], title };
  } catch {
    return null;
  }
}

// ===== 2순위: YouTube API (예배 시간에만 사용, 할당량 100) =====
async function detectLiveByAPI(): Promise<{ videoId: string; title: string; thumbnail: string } | null> {
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
    console.error('YouTube API 라이브 감지 오류:', error);
  }
  return null;
}

// ===== GET 핸들러 =====
export async function GET() {
  try {
    const worship = isWorshipTime();

    // 1순위: HTML 스크래핑 (무료, 항상 시도)
    const scrapeResult = await detectLiveByScraping();
    if (scrapeResult) {
      return NextResponse.json({
        live: true,
        videoId: scrapeResult.videoId,
        title: scrapeResult.title,
        method: 'scrape',
        isWorshipTime: worship,
      });
    }

    // 2순위: YouTube API (예배 시간에만 사용하여 할당량 절약)
    if (worship) {
      const apiResult = await detectLiveByAPI();
      if (apiResult) {
        return NextResponse.json({
          live: true,
          videoId: apiResult.videoId,
          title: apiResult.title,
          thumbnail: apiResult.thumbnail,
          method: 'api',
          isWorshipTime: worship,
        });
      }
    }

    // 3순위: 예배 시간이면 채널 임베드로 폴백
    if (worship) {
      return NextResponse.json({
        live: false,
        videoId: null,
        title: '',
        method: 'time-standby',
        isWorshipTime: true,
      });
    }

    // 예배 시간이 아님 → 라이브 없음
    return NextResponse.json({
      live: false,
      videoId: null,
      title: '',
      isWorshipTime: false,
    });
  } catch {
    return NextResponse.json({ live: false, videoId: null, isWorshipTime: isWorshipTime() });
  }
}
