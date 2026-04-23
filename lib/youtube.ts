// 유튜브 라이브 감지 유틸리티
export async function getLiveStreamStatus() {
  const API_KEY = process.env.YOUTUBE_API_KEY;
  const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || 'UCc_eP0i4YwSQmQ9du5-RHbA';

  // 유튜브 API로 라이브 감지
  if (API_KEY) {
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&type=video&eventType=live&key=${API_KEY}`;
      const res = await fetch(url, { next: { revalidate: 60 } });
      const data = await res.json();

      if (data.items && data.items.length > 0) {
        const liveVideo = data.items[0];
        return {
          isLive: true,
          videoId: liveVideo.id.videoId,
          title: liveVideo.snippet.title,
          thumbnail: liveVideo.snippet.thumbnails?.high?.url || '',
        };
      }
    } catch (error) {
      console.error('라이브 감지 오류:', error);
    }
  }

  return { isLive: false, videoId: '', title: '', thumbnail: '' };
}

// 설교 아카이브: 올해 영상 50개 가져오기
export async function getSermonArchive() {
  const API_KEY = process.env.YOUTUBE_API_KEY;
  const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || 'UCc_eP0i4YwSQmQ9du5-RHbA';

  if (!API_KEY) return [];

  try {
    const publishedAfter = "2026-01-01T00:00:00Z";
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&maxResults=50&order=date&publishedAfter=${publishedAfter}&type=video&key=${API_KEY}`;

    const res = await fetch(url, { next: { revalidate: 3600 } });
    const data = await res.json();

    if (!data.items) return [];

    return data.items.map((item: any) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      date: item.snippet.publishedAt.split('T')[0],
      thumbnail: item.snippet.thumbnails?.high?.url || '',
    }));
  } catch (error) {
    console.error('설교 아카이브 오류:', error);
    return [];
  }
}
