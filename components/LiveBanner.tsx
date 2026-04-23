'use client';

interface LiveBannerProps {
  isLive: boolean;
  title?: string;
  videoId?: string;
}

export default function LiveBanner({ isLive, title, videoId }: LiveBannerProps) {
  if (!isLive) return null;

  return (
    <a
      href={videoId ? `https://www.youtube.com/watch?v=${videoId}` : `https://www.youtube.com/@petros-church/live`}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#D32F2F',
        color: 'white',
        padding: '12px 20px',
        textDecoration: 'none',
        fontWeight: 'bold',
        fontSize: '1.1rem',
        gap: '10px',
        zIndex: 9998,
        flexWrap: 'wrap',
      }}
    >
      <span style={{ fontSize: '0.8rem', color: '#FFEB3B' }}>● LIVE</span>
      <span>현재 실시간 예배 중{title ? `: ${title}` : ''}</span>
      <span style={{ fontSize: '0.9rem', backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '4px' }}>
        참여하기 ➔
      </span>
    </a>
  );
}
