"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import HymnViewer, { parseHymnNumber } from '@/app/components/HymnViewer';

type OrderItem = { order: number; item: string; detail: string };

export default function BulletinPage() {
  const [bulletin, setBulletin] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/bulletin')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.bulletin) {
          setBulletin(data.bulletin);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FDFBF7' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '15px', animation: 'pulse 1.5s infinite' }}>📋</div>
          <p style={{ color: '#94A3B8', fontSize: '1.1rem' }}>주보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!bulletin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#FDFBF7', padding: '20px' }}>
        <div style={{ fontSize: '4rem', marginBottom: '20px', opacity: 0.3 }}>📋</div>
        <h2 style={{ color: '#5b272f', fontFamily: "'Nanum Myeongjo', serif", marginBottom: '10px' }}>이번 주 주보가 아직 등록되지 않았습니다</h2>
        <p style={{ color: '#94A3B8', marginBottom: '30px' }}>관리자가 주보 이미지를 업로드하면 자동으로 표시됩니다.</p>
        <Link href="/" style={{ padding: '12px 30px', background: '#5b272f', color: 'white', borderRadius: '30px', textDecoration: 'none', fontWeight: 'bold' }}>홈으로 돌아가기</Link>
      </div>
    );
  }

  const worshipOrder: OrderItem[] = bulletin.worshipOrder || [];
  const announcements: string[] = bulletin.announcements || [];
  const hymns: string[] = bulletin.hymns || [];
  const hymnNumbers: number[] = bulletin.hymnNumbers || [];

  // 🎵 hymns 텍스트에서 파싱된 번호+제목 매핑 생성
  const hymnEntries = hymns.map((h: string) => {
    const parsed = parseHymnNumber(h);
    return parsed || { number: 0, title: h };
  }).filter(e => e.number > 0);

  // hymnNumbers에 있지만 hymns 텍스트에서 못 잡은 것도 추가
  hymnNumbers.forEach((n: number) => {
    if (!hymnEntries.find(e => e.number === n)) {
      hymnEntries.push({ number: n, title: '' });
    }
  });

  return (
    <div style={{ minHeight: '100vh', background: '#FDFBF7', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* 헤더 */}
      <div style={{ background: 'linear-gradient(135deg, #1E293B, #0F172A)', color: 'white', padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '0.85rem', color: '#c19c72', letterSpacing: '0.15em', marginBottom: '8px' }}>거제반석교회</div>
        <h1 style={{ fontFamily: "'Nanum Myeongjo', serif", fontSize: '2rem', fontWeight: '800', margin: '0 0 10px' }}>스마트 주보</h1>
        <div style={{ background: 'rgba(255,255,255,0.1)', display: 'inline-block', padding: '8px 24px', borderRadius: '30px', fontSize: '1rem', fontWeight: '600' }}>
          📅 {bulletin.date}
        </div>
        {bulletin.worshipType && (
          <div style={{ marginTop: '10px', color: '#FBBF24', fontSize: '0.95rem', fontWeight: '600' }}>{bulletin.worshipType}</div>
        )}
      </div>

      <div style={{ maxWidth: '650px', margin: '0 auto', padding: '25px 20px 80px' }}>
        {/* 설교 정보 카드 */}
        {(bulletin.sermonTitle || bulletin.scripture) && (
          <div style={{ background: 'linear-gradient(135deg, #701a75, #9f1239)', borderRadius: '20px', padding: '30px', color: 'white', marginBottom: '25px', textAlign: 'center', boxShadow: '0 8px 25px rgba(159,18,57,0.2)' }}>
            {bulletin.scripture && <div style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '8px' }}>📖 {bulletin.scripture}</div>}
            {bulletin.sermonTitle && <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0', fontFamily: "'Nanum Myeongjo', serif", lineHeight: '1.4' }}>"{bulletin.sermonTitle}"</h2>}
          </div>
        )}

        {/* 예배 순서 */}
        {worshipOrder.length > 0 && (
          <div style={{ background: 'white', borderRadius: '20px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
            <h3 style={{ color: '#5b272f', fontSize: '1.2rem', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: '#5b272f', color: 'white', borderRadius: '50%', width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>✝</span>
              예배 순서
            </h3>
            {worshipOrder.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: i < worshipOrder.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ background: '#FEF3C7', color: '#92400E', borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '800', flexShrink: 0 }}>{item.order || i + 1}</span>
                  <span style={{ fontWeight: '700', color: '#1E293B', fontSize: '0.95rem' }}>{item.item}</span>
                </div>
                <span style={{ color: '#64748B', fontSize: '0.9rem', textAlign: 'right', maxWidth: '55%' }}>{item.detail}</span>
              </div>
            ))}
          </div>
        )}

        {/* 🎵 찬송가 악보 뷰어 — Zero-Error Hymn Display System */}
        {hymnEntries.length > 0 && (
          <div style={{ background: 'white', borderRadius: '20px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
            <h3 style={{ color: '#5b272f', fontSize: '1.2rem', fontWeight: '800', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: 'linear-gradient(135deg, #5B272F, #8B4513)', color: 'white', borderRadius: '50%', width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>♪</span>
              오늘의 찬송가
            </h3>
            <p style={{ color: '#94A3B8', fontSize: '0.78rem', marginBottom: '18px', marginTop: '0' }}>
              터치하면 악보를 크게 볼 수 있습니다
            </p>

            {hymnEntries.map((entry, i) => (
              <HymnViewer
                key={`hymn-${entry.number}-${i}`}
                hymnNumber={entry.number}
                hymnTitle={entry.title}
                compact={true}
              />
            ))}
          </div>
        )}

        {/* 기존 텍스트 찬송가 (hymnEntries가 비어있지만 hymns 텍스트가 있는 경우 fallback) */}
        {hymnEntries.length === 0 && hymns.length > 0 && (
          <div style={{ background: 'white', borderRadius: '20px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
            <h3 style={{ color: '#5b272f', fontSize: '1.1rem', fontWeight: '800', marginBottom: '15px' }}>🎵 찬송가</h3>
            {hymns.map((h: string, i: number) => (
              <div key={i} style={{ padding: '10px 15px', background: '#FEF3C7', borderRadius: '10px', marginBottom: '8px', color: '#92400E', fontWeight: '600', fontSize: '0.95rem' }}>♪ {h}</div>
            ))}
          </div>
        )}

        {/* 교회 소식 */}
        {announcements.length > 0 && (
          <div style={{ background: 'white', borderRadius: '20px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
            <h3 style={{ color: '#5b272f', fontSize: '1.1rem', fontWeight: '800', marginBottom: '15px' }}>📢 교회 소식</h3>
            {announcements.map((a, i) => (
              <div key={i} style={{ padding: '12px 15px', background: '#F0F9FF', borderRadius: '10px', marginBottom: '8px', color: '#0369A1', fontSize: '0.9rem', lineHeight: '1.6', borderLeft: '3px solid #0EA5E9' }}>{a}</div>
            ))}
          </div>
        )}

        {/* 헌금 안내 */}
        {bulletin.offering && (
          <div style={{ background: 'white', borderRadius: '20px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
            <h3 style={{ color: '#5b272f', fontSize: '1.1rem', fontWeight: '800', marginBottom: '10px' }}>💰 헌금 안내</h3>
            <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: '1.7', whiteSpace: 'pre-line', margin: 0 }}>{bulletin.offering}</p>
          </div>
        )}

        {/* 하단 정보 */}
        <div style={{ textAlign: 'center', padding: '30px 0', color: '#94A3B8', fontSize: '0.8rem' }}>
          <p>대한예수교장로회 거제반석교회</p>
          <p>경상남도 거제시 연초면 소오비길 40-6</p>
          <p style={{ marginTop: '10px', color: '#c19c72', fontStyle: 'italic' }}>"반석 위에 세운 교회"</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse { 0% { opacity: 0.7; transform: scale(0.95); } 50% { opacity: 1; transform: scale(1.05); } 100% { opacity: 0.7; transform: scale(0.95); } }
      `}</style>
    </div>
  );
}
