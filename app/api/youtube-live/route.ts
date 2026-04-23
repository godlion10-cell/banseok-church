import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CHANNEL_ID = 'UCc_eP0i4YwSQmQ9du5-RHbA';
const CHANNEL_HANDLE = 'petros-church';

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

async function getVideoIdFromChannelLive(): Promise<{ videoId: string; title: string } | null> {
  try {
    const res = await fetch(`https://www.youtube.com/@${CHANNEL_HANDLE}/live`, {
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

export async function GET(request: Request) {
  try {
    const result = await getVideoIdFromChannelLive();
    if (result) {
      return NextResponse.json({ live: true, videoId: result.videoId, title: result.title, method: 'scrape' });
    }
    if (isWorshipTime()) {
      return NextResponse.json({ live: true, videoId: null, title: '실시간 예배', method: 'time-fallback', channelId: CHANNEL_ID });
    }
    return NextResponse.json({ live: false, videoId: null, title: '' });
  } catch {
    if (isWorshipTime()) {
      return NextResponse.json({ live: true, videoId: null, title: '실시간 예배', method: 'error-fallback', channelId: CHANNEL_ID });
    }
    return NextResponse.json({ live: false, videoId: null });
  }
}
