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

export default function SermonVideoPage() {
  const [sermons, setSermons] = useState<SermonVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<SermonVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('전체');

  useEffect(() => {
    const fetchSermons = async () => {
      try {
        const res = await fetch('/api/youtube-videos');
        if (!res.ok) throw new Error('fetch failed');
        const data = await res.json();
        if (data.success && data.videos.length > 0) {
          setSermons(data.videos);
          setSelectedVideo(data.videos[0]);
        }
      } catch {
        setSermons([]);
      }
      setLoading(false);
    };
    fetchSermons();
  }, []);

  const categories = ['전체', ...Array.from(new Set(sermons.map(s => s.category)))];
  const filtered = filter === '전체' ? sermons : sermons.filter(s => s.category === filter);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case '주일오전': return '⛪';
      case '수요예배': return '📖';
      case '새벽기도': return '🌅';
      case '금요기도': return '🙏';
      case 'QT': return '✝️';
      default: return '🎬';
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0F0A1A 0%, #1A1025 50%, #0F172A 100%)', fontFamily: "'Inter', sans-serif" }}>

      {/* 헤더 */}
      <div style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(139,92,246,0.15)', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.6rem' }}>🎬</span>
          <div>
            <h1 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', fontWeight: 800 }}>설교 영상</h1>
            <p style={{ margin: 0, color: 'rgba(139,92,246,0.7)', fontSize: '0.72rem' }}>거제반석교회 · 은혜의 말씀</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <a href="/sermon-radio" style={{ color: '#8B5CF6', textDecoration: 'none', fontSize: '0.82rem', padding: '7px 14px', borderRadius: '8px', border: '1px solid rgba(139,92,246,0.3)', transition: 'all 0.2s' }}>📻 라디오 모드</a>
          <a href="/" style={{ color: '#64748B', textDecoration: 'none', fontSize: '0.82rem', padding: '7px 14px', borderRadius: '8px', border: '1px solid rgba(100,116,139,0.2)' }}>← 홈</a>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem 1rem' }}>

        {/* 메인 영상 플레이어 */}
        {selectedVideo && (
          <div style={{ marginBottom: '2rem' }}>
            <div style={{
              position: 'relative', paddingBottom: '56.25%', height: 0,
              borderRadius: '20px', overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(139,92,246,0.2)',
              border: '1px solid rgba(139,92,246,0.15)'
            }}>
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo.videoId}?autoplay=1&rel=0&modestbranding=1`}
                title={selectedVideo.title}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div style={{ marginTop: '1rem', padding: '0 4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{
                  padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
                  background: 'rgba(139,92,246,0.15)', color: '#A78BFA'
                }}>{getCategoryIcon(selectedVideo.category)} {selectedVideo.category}</span>
                <span style={{ color: '#64748B', fontSize: '0.8rem' }}>{selectedVideo.date}</span>
              </div>
              <h2 style={{ color: '#F1F5F9', fontSize: '1.3rem', fontWeight: 700, lineHeight: 1.4, margin: 0 }}>
                {selectedVideo.title}
              </h2>
            </div>
          </div>
        )}

        {/* 카테고리 필터 */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              style={{
                padding: '7px 16px', borderRadius: '20px', border: 'none',
                fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                background: filter === cat ? 'linear-gradient(135deg, #7C3AED, #A78BFA)' : 'rgba(255,255,255,0.06)',
                color: filter === cat ? '#fff' : '#94A3B8',
                transition: 'all 0.2s',
                boxShadow: filter === cat ? '0 4px 12px rgba(124,58,237,0.3)' : 'none'
              }}
            >{cat === '전체' ? '🎬 전체' : `${getCategoryIcon(cat)} ${cat}`}</button>
          ))}
        </div>

        {/* 로딩 */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#8B5CF6' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'pulse 1.5s infinite' }}>🎬</div>
            <p style={{ fontSize: '1rem', fontWeight: 600 }}>설교 영상을 불러오는 중...</p>
          </div>
        )}

        {/* 영상 목록 그리드 */}
        {!loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {filtered.map(sermon => (
              <div
                key={sermon.id}
                onClick={() => { setSelectedVideo(sermon); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                style={{
                  background: selectedVideo?.id === sermon.id ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.04)',
                  borderRadius: '16px',
                  border: selectedVideo?.id === sermon.id ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(255,255,255,0.06)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.25s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                {/* 썸네일 */}
                <div style={{ position: 'relative', paddingBottom: '56.25%', background: sermon.gradient }}>
                  <img
                    src={`https://img.youtube.com/vi/${sermon.videoId}/mqdefault.jpg`}
                    alt={sermon.title}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    loading="lazy"
                  />
                  {selectedVideo?.id === sermon.id && (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                      background: 'rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <span style={{ fontSize: '2rem', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▶</span>
                    </div>
                  )}
                </div>

                {/* 정보 */}
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <span style={{
                      fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px',
                      background: 'rgba(139,92,246,0.12)', color: '#A78BFA', fontWeight: 700
                    }}>{getCategoryIcon(sermon.category)} {sermon.category}</span>
                    <span style={{ fontSize: '0.7rem', color: '#475569' }}>{sermon.date}</span>
                  </div>
                  <h3 style={{
                    margin: 0, color: selectedVideo?.id === sermon.id ? '#A78BFA' : '#E2E8F0',
                    fontSize: '0.9rem', fontWeight: 600, lineHeight: 1.5,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                  }}>{sermon.title}</h3>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 빈 상태 */}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
            <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</p>
            <p>해당 카테고리의 영상이 없습니다.</p>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.05); } }
      `}} />
    </div>
  );
}
