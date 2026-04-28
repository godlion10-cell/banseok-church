"use client";
import React, { useState, useEffect } from 'react';

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

      {/* 메인 플레이어 카드 */}
      <div style={{ maxWidth: '420px', width: '100%', background: '#1E293B', padding: '35px 25px', borderRadius: '30px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', textAlign: 'center' }}>

        <div style={{ background: '#334155', display: 'inline-block', padding: '8px 18px', borderRadius: '20px', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '25px', fontWeight: 'bold' }}>
          🎧 설교 라디오 — 데이터 절약 모드
        </div>

        {/* 앨범아트 */}
        <div style={{
          width: '140px', height: '140px',
          background: currentSermon?.gradient || 'linear-gradient(135deg, #2563EB, #9333EA)',
          borderRadius: '50%', margin: '0 auto 25px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 10px 40px rgba(147, 51, 234, 0.3)',
        }}>
          <span style={{ fontSize: '3rem' }}>
            {loading ? '⏳' : currentSermon ? getCategoryIcon(currentSermon.category) : '📻'}
          </span>
        </div>

        {/* 설교 정보 */}
        {loading ? (
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.2rem', color: '#94A3B8' }}>설교 불러오는 중...</h2>
          </div>
        ) : currentSermon ? (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700', background: 'rgba(59,130,246,0.2)', color: '#60A5FA', marginBottom: '10px' }}>
              {currentSermon.category}
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', lineHeight: '1.4', marginBottom: '8px', color: '#F1F5F9', padding: '0 10px' }}>
              {currentSermon.title}
            </h2>
            <p style={{ color: '#64748B', fontSize: '0.9rem' }}>
              담임목사님 | {currentSermon.date}
            </p>
          </div>
        ) : null}

        {/* 🚨 HTML5 순정 오디오 태그 (백그라운드 재생 완벽 지원) 🚨 */}
        {currentSermon && currentSermon.videoId && (
          <div style={{ background: '#1E1F30', padding: '16px', borderRadius: '16px', border: '1px solid rgba(229,184,113,0.2)', marginBottom: '20px' }}>
            <h4 style={{ fontWeight: 'bold', color: '#E5B871', marginBottom: '6px', fontSize: '0.9rem' }}>라디오 모드</h4>
            <p style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: '12px' }}>화면을 꺼도 설교가 계속 재생됩니다.</p>
            <audio
              controls
              src={`/api/radio?videoId=${currentSermon.videoId}`}
              preload="none"
              style={{ width: '100%', height: '40px', borderRadius: '8px' }}
            >
              브라우저가 오디오 재생을 지원하지 않습니다.
            </audio>
          </div>
        )}

        {/* 이전/다음 트랙 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '25px' }}>
          <button onClick={() => { if (sermons.length > 0) setCurrentIndex(currentIndex > 0 ? currentIndex - 1 : sermons.length - 1); }}
            style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.8rem', cursor: 'pointer', transition: '0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#F1F5F9'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#94A3B8'}>
            ⏮
          </button>
          <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 700 }}>
            {sermons.length > 0 ? `${currentIndex + 1} / ${sermons.length}` : '—'}
          </span>
          <button onClick={() => { if (sermons.length > 0) setCurrentIndex(currentIndex < sermons.length - 1 ? currentIndex + 1 : 0); }}
            style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.8rem', cursor: 'pointer', transition: '0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#F1F5F9'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#94A3B8'}>
            ⏭
          </button>
        </div>
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
                onClick={() => setCurrentIndex(idx)}
                style={{
                  padding: '14px 18px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '12px',
                  borderBottom: idx < sermons.length - 1 ? '1px solid #334155' : 'none',
                  background: idx === currentIndex ? 'rgba(59,130,246,0.1)' : 'transparent',
                  transition: '0.2s'
                }}
              >
                <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>
                  {getCategoryIcon(sermon.category)}
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
    </div>
  );
}
