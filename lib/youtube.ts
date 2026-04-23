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
