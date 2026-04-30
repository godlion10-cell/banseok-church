"use client";
import React, { useState, useEffect, useRef } from 'react';

type SermonVideo = {
  id: string;
  videoId: string;
  title: string;
  category: string;
  date: string;
  gradient: string;
};

export default function SermonRadioPage() {
  const [sermons, setSermons] = useState<SermonVideo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // YouTube IFrame API 로드
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((window as any).YT && (window as any).YT.Player) return;

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  }, []);

  // 유튜브 설교 목록 불러오기
  useEffect(() => {
    const fetchSermons = async () => {
      try {
        const res = await fetch('/api/youtube-videos');
        const data = await res.json();
        if (data.success && data.videos.length > 0) {
          setSermons(data.videos);
        } else {
          setSermons([{
            id: 'fallback', videoId: '', title: '설교 영상을 불러올 수 없습니다',
            category: '안내', date: '', gradient: 'linear-gradient(135deg, #334155, #475569)'
          }]);
        }
      } catch {
        setSermons([{
          id: 'fallback', videoId: '', title: '네트워크 오류 — 잠시 후 다시 시도해주세요',
          category: '오류', date: '', gradient: 'linear-gradient(135deg, #7F1D1D, #991B1B)'
        }]);
      }
      setLoading(false);
    };
    fetchSermons();
  }, []);

  // YouTube Player 초기화 + 영상 변경 시 자동 로드
  useEffect(() => {
    if (!sermons.length || !sermons[currentIndex]?.videoId) return;

    const videoId = sermons[currentIndex].videoId;

    // 이미 플레이어가 있으면 영상만 교체
    if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
      playerRef.current.loadVideoById(videoId);
      setIsPlaying(true);
      return;
    }

    // 플레이어 최초 생성
    const initPlayer = () => {
      if (!containerRef.current) return;

      // 기존 iframe 정리
      containerRef.current.innerHTML = '';
      const div = document.createElement('div');
      div.id = 'yt-radio-player';
      containerRef.current.appendChild(div);

      playerRef.current = new (window as any).YT.Player('yt-radio-player', {
        height: '1',
        width: '1',
        videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: () => {
            setPlayerReady(true);
            setIsPlaying(true);
            playerRef.current?.playVideo();
          },
          onStateChange: (event: any) => {
            // 0 = ended, 1 = playing, 2 = paused
            if (event.data === 0) {
              // 자동 다음 트랙
              if (currentIndex < sermons.length - 1) {
                setCurrentIndex(prev => prev + 1);
              } else {
                setIsPlaying(false);
              }
            } else if (event.data === 1) {
              setIsPlaying(true);
            } else if (event.data === 2) {
              setIsPlaying(false);
            }
          },
        },
      });
    };

    if ((window as any).YT && (window as any).YT.Player) {
      initPlayer();
    } else {
      (window as any).onYouTubeIframeAPIReady = initPlayer;
    }
  }, [sermons, currentIndex]);

  const currentSermon = sermons[currentIndex] || null;

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const prevTrack = () => {
    if (sermons.length > 0) setCurrentIndex(currentIndex > 0 ? currentIndex - 1 : sermons.length - 1);
  };

  const nextTrack = () => {
    if (sermons.length > 0) setCurrentIndex(currentIndex < sermons.length - 1 ? currentIndex + 1 : 0);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case '주일오전': return '⛪';
      case '수요예배': return '📖';
      case '새벽기도': return '🌅';
      case '금요기도': return '🙏';
      case 'QT': return '✝️';
      default: return '🎵';
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'sans-serif' }}>

      {/* 🎵 YouTube 플레이어 (화면 밖에 숨김 — 소리만 재생) */}
      <div ref={containerRef} style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden', pointerEvents: 'none' }} />

      {/* 메인 플레이어 카드 */}
      <div style={{ maxWidth: '420px', width: '100%', background: '#1E293B', padding: '35px 25px', borderRadius: '30px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', textAlign: 'center' }}>

        <div style={{ background: '#334155', display: 'inline-block', padding: '8px 18px', borderRadius: '20px', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '25px', fontWeight: 'bold' }}>
          🎧 설교 라디오 — 화면 꺼도 재생
        </div>

        {/* 앨범아트 + 파형 애니메이션 */}
        <div style={{
          width: '160px', height: '160px',
          background: currentSermon?.gradient || 'linear-gradient(135deg, #2563EB, #9333EA)',
          borderRadius: '50%', margin: '0 auto 25px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: isPlaying ? '0 0 50px rgba(147, 51, 234, 0.4), 0 10px 40px rgba(147, 51, 234, 0.3)' : '0 10px 40px rgba(147, 51, 234, 0.3)',
          animation: isPlaying ? 'spin 8s linear infinite' : 'none',
          transition: 'box-shadow 0.5s',
        }}>
          <span style={{ fontSize: '3.5rem' }}>
            {loading ? '⏳' : currentSermon ? getCategoryIcon(currentSermon.category) : '📻'}
          </span>
        </div>

        {/* 파형 인디케이터 */}
        {isPlaying && (
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '3px', height: '30px', marginBottom: '20px' }}>
            {[1,2,3,4,5,6,7].map(i => (
              <div key={i} style={{
                width: '4px', borderRadius: '2px', background: '#c19c72',
                animation: `wave ${0.4 + i * 0.1}s ease-in-out infinite alternate`,
              }} />
            ))}
          </div>
        )}

        {/* 설교 정보 */}
        {loading ? (
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.2rem', color: '#94A3B8' }}>설교 불러오는 중...</h2>
          </div>
        ) : currentSermon ? (
          <div style={{ marginBottom: '25px' }}>
            <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700', background: 'rgba(59,130,246,0.2)', color: '#60A5FA', marginBottom: '10px' }}>
              {currentSermon.category}
            </div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 'bold', lineHeight: '1.5', marginBottom: '8px', color: '#F1F5F9', padding: '0 10px' }}>
              {currentSermon.title}
            </h2>
            <p style={{ color: '#64748B', fontSize: '0.9rem', margin: 0 }}>
              담임목사님 | {currentSermon.date}
            </p>
          </div>
        ) : null}

        {/* 재생 컨트롤 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '30px', marginBottom: '10px' }}>
          <button onClick={prevTrack}
            style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '2rem', cursor: 'pointer', transition: '0.2s', padding: '5px' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#F1F5F9'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#94A3B8'}>
            ⏮
          </button>

          <button onClick={togglePlay}
            style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #c19c72, #8B6914)',
              border: 'none', color: 'white', fontSize: '1.8rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 25px rgba(193,156,114,0.4)',
              transition: 'transform 0.2s',
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.92)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}>
            {isPlaying ? '⏸' : '▶'}
          </button>

          <button onClick={nextTrack}
            style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '2rem', cursor: 'pointer', transition: '0.2s', padding: '5px' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#F1F5F9'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#94A3B8'}>
            ⏭
          </button>
        </div>

        <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 700 }}>
          {sermons.length > 0 ? `${currentIndex + 1} / ${sermons.length}` : '—'}
        </span>
      </div>

      {/* 하단 설교 리스트 */}
      {sermons.length > 1 && (
        <div style={{ maxWidth: '420px', width: '100%', marginTop: '20px' }}>
          <div style={{ padding: '5px 15px', fontSize: '0.85rem', color: '#64748B', fontWeight: '700' }}>
            📋 설교 목록
          </div>
          <div style={{ maxHeight: '250px', overflowY: 'auto', borderRadius: '16px', background: '#1E293B' }}>
            {sermons.map((sermon, idx) => (
              <div
                key={sermon.id}
                onClick={() => setCurrentIndex(idx)}
                style={{
                  padding: '14px 18px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '12px',
                  borderBottom: idx < sermons.length - 1 ? '1px solid #334155' : 'none',
                  background: idx === currentIndex ? 'rgba(193,156,114,0.1)' : 'transparent',
                  borderLeft: idx === currentIndex ? '3px solid #c19c72' : '3px solid transparent',
                  transition: '0.2s'
                }}
              >
                <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>
                  {idx === currentIndex && isPlaying ? '🔊' : getCategoryIcon(sermon.category)}
                </span>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: idx === currentIndex ? '700' : '500', color: idx === currentIndex ? '#c19c72' : '#CBD5E1', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {sermon.title}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>
                    {sermon.category} · {sermon.date}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes wave {
          from { height: 4px; }
          to { height: 24px; }
        }
      `}</style>
    </div>
  );
}
