"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('00:00');
  const [duration, setDuration] = useState('00:00');
  const [loading, setLoading] = useState(true);
  const [streamError, setStreamError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // 유튜브 설교 목록 불러오기 (기존 youtube-videos API 그대로 사용)
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

  const currentSermon = sermons[currentIndex] || null;

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds)) return '00:00';
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  // 🎵 오디오 이벤트 핸들러
  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    setProgress((audio.currentTime / audio.duration) * 100);
    setCurrentTime(formatTime(audio.currentTime));
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setDuration(formatTime(audio.duration));
    setStreamError(null);
  }, []);

  const handleEnded = useCallback(() => {
    // 자동 다음 트랙 재생
    if (sermons.length === 0) return;
    const nextIdx = currentIndex < sermons.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(nextIdx);
    setIsPlaying(true);
  }, [currentIndex, sermons.length]);

  const handleAudioError = useCallback(() => {
    setStreamError('오디오 스트림 로딩 실패 — 다른 설교를 선택해주세요.');
    setIsPlaying(false);
  }, []);

  // 트랙 변경 시 자동 로드 + 재생
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSermon?.videoId) return;
    
    setStreamError(null);
    setProgress(0);
    setCurrentTime('00:00');
    setDuration('00:00');
    
    audio.src = `/api/radio?videoId=${currentSermon.videoId}`;
    audio.load();
    
    if (isPlaying) {
      audio.play().catch(() => {
        setStreamError('자동 재생 차단됨 — ▶ 버튼을 눌러주세요.');
        setIsPlaying(false);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, currentSermon?.videoId]);

  // 재생/일시정지 토글
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !currentSermon?.videoId) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setStreamError('재생 실패 — 브라우저에서 자동 재생을 차단했습니다.');
      });
    }
  };

  // 프로그레스 바 클릭 → 탐색
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const bar = e.currentTarget;
    const clickPos = e.nativeEvent.offsetX;
    const seekRatio = clickPos / bar.offsetWidth;
    audio.currentTime = seekRatio * audio.duration;
  };

  const handlePrev = () => {
    if (sermons.length === 0) return;
    setCurrentIndex(currentIndex > 0 ? currentIndex - 1 : sermons.length - 1);
    setIsPlaying(true);
  };

  const handleNext = () => {
    if (sermons.length === 0) return;
    setCurrentIndex(currentIndex < sermons.length - 1 ? currentIndex + 1 : 0);
    setIsPlaying(true);
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

      {/* 🎵 HTML5 Audio Element (백엔드 프록시 스트림) */}
      <audio
        ref={audioRef}
        preload="none"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={handleAudioError}
      />

      {/* 메인 플레이어 카드 */}
      <div style={{ maxWidth: '420px', width: '100%', background: '#1E293B', padding: '35px 25px', borderRadius: '30px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', textAlign: 'center' }}>

        <div style={{ background: '#334155', display: 'inline-block', padding: '8px 18px', borderRadius: '20px', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '25px', fontWeight: 'bold' }}>
          🎧 설교 라디오 — 데이터 절약 모드
        </div>

        {/* 회전 앨범아트 */}
        <div style={{
          width: '180px', height: '180px',
          background: currentSermon?.gradient || 'linear-gradient(135deg, #2563EB, #9333EA)',
          borderRadius: '50%', margin: '0 auto 25px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 10px 40px rgba(147, 51, 234, 0.3)',
          animation: isPlaying ? 'spin 15s linear infinite' : 'none',
          transition: 'background 0.5s'
        }}>
          <span style={{ fontSize: '3.5rem' }}>
            {loading ? '⏳' : currentSermon ? getCategoryIcon(currentSermon.category) : '📻'}
          </span>
        </div>

        {/* 설교 정보 */}
        {loading ? (
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.2rem', color: '#94A3B8' }}>설교 불러오는 중...</h2>
          </div>
        ) : currentSermon ? (
          <div style={{ marginBottom: '25px' }}>
            <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700', background: 'rgba(59,130,246,0.2)', color: '#60A5FA', marginBottom: '10px' }}>
              {currentSermon.category}
            </div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 'bold', lineHeight: '1.4', marginBottom: '8px', color: '#F1F5F9', padding: '0 10px' }}>
              {currentSermon.title}
            </h2>
            <p style={{ color: '#64748B', fontSize: '0.9rem' }}>
              담임목사님 | {currentSermon.date}
            </p>
          </div>
        ) : null}

        {/* ⚠️ 스트리밍 에러 표시 */}
        {streamError && (
          <div style={{ padding: '10px 16px', marginBottom: '15px', borderRadius: '12px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5', fontSize: '0.82rem' }}>
            ⚠️ {streamError}
          </div>
        )}

        {/* 프로그레스 바 */}
        <div style={{ marginBottom: '25px' }}>
          <div
            onClick={handleSeek}
            style={{ width: '100%', height: '6px', background: '#334155', borderRadius: '5px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
          >
            <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)', borderRadius: '5px', transition: 'width 0.3s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.8rem', color: '#64748B' }}>
            <span>{currentTime}</span>
            <span>{duration}</span>
          </div>
        </div>

        {/* 컨트롤 버튼 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '25px' }}>
          <button onClick={handlePrev}
            style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.8rem', cursor: 'pointer', transition: '0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#F1F5F9'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#94A3B8'}>
            ⏮
          </button>

          <button onClick={togglePlay}
            style={{
              width: '70px', height: '70px', borderRadius: '50%',
              background: currentSermon?.videoId ? 'linear-gradient(135deg, #3B82F6, #8B5CF6)' : '#475569',
              color: 'white', border: 'none', fontSize: '1.8rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: currentSermon?.videoId ? 'pointer' : 'default',
              boxShadow: '0 8px 25px rgba(59,130,246,0.4)',
              transition: 'transform 0.2s'
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.92)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}>
            {isPlaying ? '⏸' : '▶'}
          </button>

          <button onClick={handleNext}
            style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.8rem', cursor: 'pointer', transition: '0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#F1F5F9'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#94A3B8'}>
            ⏭
          </button>
        </div>

        {/* 트랙 번호 */}
        {sermons.length > 0 && (
          <p style={{ marginTop: '20px', fontSize: '0.8rem', color: '#475569' }}>
            {currentIndex + 1} / {sermons.length} 트랙
          </p>
        )}
      </div>

      {/* 하단 설교 리스트 */}
      {sermons.length > 1 && (
        <div style={{ maxWidth: '420px', width: '100%', marginTop: '20px' }}>
          <div style={{ padding: '5px 15px', fontSize: '0.85rem', color: '#64748B', fontWeight: '700' }}>
            📋 설교 목록
          </div>
          <div style={{ maxHeight: '200px', overflowY: 'auto', borderRadius: '16px', background: '#1E293B' }}>
            {sermons.map((sermon, idx) => (
              <div
                key={sermon.id}
                onClick={() => { setCurrentIndex(idx); setIsPlaying(true); }}
                style={{
                  padding: '14px 18px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '12px',
                  borderBottom: idx < sermons.length - 1 ? '1px solid #334155' : 'none',
                  background: idx === currentIndex ? 'rgba(59,130,246,0.1)' : 'transparent',
                  transition: '0.2s'
                }}
              >
                <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>
                  {idx === currentIndex && isPlaying ? '🔊' : getCategoryIcon(sermon.category)}
                </span>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: idx === currentIndex ? '700' : '500', color: idx === currentIndex ? '#60A5FA' : '#CBD5E1', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
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

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
