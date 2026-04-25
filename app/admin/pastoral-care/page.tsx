"use client";
import React, { useState, useEffect } from 'react';

type CareCase = {
  id: string;
  userName: string;
  reason: string;
  keywords: string | null;
  context: string | null;
  status: string;
  priority: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

type Stats = {
  total: number;
  needsCare: number;
  inProgress: number;
  completed: number;
  urgent: number;
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  URGENT: { label: '긴급', color: '#DC2626', bg: '#FEF2F2', icon: '🚨' },
  HIGH:   { label: '높음', color: '#EA580C', bg: '#FFF7ED', icon: '🔶' },
  NORMAL: { label: '보통', color: '#2563EB', bg: '#EFF6FF', icon: '🔵' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  NEEDS_CARE:  { label: '돌봄 필요', color: '#DC2626', bg: '#FEF2F2' },
  IN_PROGRESS: { label: '진행 중',   color: '#D97706', bg: '#FFFBEB' },
  COMPLETED:   { label: '완료',      color: '#16A34A', bg: '#F0FDF4' },
};

export default function PastoralCarePage() {
  const [cases, setCases] = useState<CareCase[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, needsCare: 0, inProgress: 0, completed: 0, urgent: 0 });
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');

  const fetchCases = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/pastoral-care?status=${filter}`);
      const data = await res.json();
      if (data.success) {
        setCases(data.cases);
        setStats(data.stats);
      }
    } catch (err) {
      console.error('조회 실패:', err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchCases(); }, [filter]);

  const updateCase = async (id: string, status?: string, note?: string) => {
    try {
      const res = await fetch('/api/admin/pastoral-care', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, note })
      });
      const data = await res.json();
      if (data.success) {
        fetchCases();
        setExpandedId(null);
        setNoteInput('');
      }
    } catch (err) {
      console.error('업데이트 실패:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (hours < 1) return '방금 전';
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  return (
    <div style={{ padding: '30px 20px', background: '#0F172A', minHeight: '100vh', fontFamily: 'sans-serif', color: '#E2E8F0' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* 헤더 */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '900', background: 'linear-gradient(135deg, #F59E0B, #EF4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>
            🛡️ 스텔스 심방 레이더
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '0.9rem' }}>
            AI가 감지한 돌봄 필요 성도 현황 — 성도 모르게 자동 수집
          </p>
        </div>

        {/* 통계 카드 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '25px' }}>
          {[
            { label: '전체', value: stats.total, color: '#3B82F6', icon: '📊' },
            { label: '돌봄 필요', value: stats.needsCare, color: '#EF4444', icon: '❤️‍🩹' },
            { label: '진행 중', value: stats.inProgress, color: '#F59E0B', icon: '🔄' },
            { label: '긴급', value: stats.urgent, color: '#DC2626', icon: '🚨' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#1E293B', borderRadius: '16px', padding: '16px', textAlign: 'center', border: `1px solid ${s.color}33` }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{s.icon}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '900', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* 필터 탭 */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {[
            { key: 'ALL', label: '전체 보기' },
            { key: 'NEEDS_CARE', label: '❤️‍🩹 돌봄 필요' },
            { key: 'IN_PROGRESS', label: '🔄 진행 중' },
            { key: 'COMPLETED', label: '✅ 완료' },
          ].map(f => (
            <button 
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{ 
                padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                fontSize: '0.85rem', fontWeight: '600', transition: '0.2s',
                background: filter === f.key ? '#3B82F6' : '#1E293B',
                color: filter === f.key ? 'white' : '#94A3B8',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* 케이스 리스트 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748B' }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px', animation: 'pulse 1.5s infinite' }}>🔍</div>
            레이더 스캔 중...
          </div>
        ) : cases.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', background: '#1E293B', borderRadius: '20px', color: '#64748B' }}>
            <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🛡️</div>
            <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>현재 감지된 케이스가 없습니다</p>
            <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>레이더가 조용합니다. 좋은 소식이에요!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {cases.map(c => {
              const pConfig = PRIORITY_CONFIG[c.priority] || PRIORITY_CONFIG.NORMAL;
              const sConfig = STATUS_CONFIG[c.status] || STATUS_CONFIG.NEEDS_CARE;
              const isExpanded = expandedId === c.id;

              return (
                <div 
                  key={c.id}
                  style={{ 
                    background: '#1E293B', borderRadius: '16px', overflow: 'hidden',
                    border: c.priority === 'URGENT' ? '1px solid #EF444466' : '1px solid #334155',
                    animation: c.priority === 'URGENT' ? 'pulse 2s infinite' : 'none'
                  }}
                >
                  {/* 메인 카드 */}
                  <div 
                    onClick={() => setExpandedId(isExpanded ? null : c.id)}
                    style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px' }}
                  >
                    {/* 우선순위 아이콘 */}
                    <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>{pConfig.icon}</div>
                    
                    {/* 정보 */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: '700', fontSize: '1rem', color: '#F1F5F9' }}>{c.userName}</span>
                        <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: '600', background: pConfig.bg, color: pConfig.color }}>
                          {pConfig.label}
                        </span>
                        <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: '600', background: sConfig.bg, color: sConfig.color }}>
                          {sConfig.label}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#94A3B8' }}>{c.reason}</div>
                      {c.keywords && (
                        <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
                          키워드: <span style={{ color: '#F59E0B' }}>{c.keywords}</span>
                        </div>
                      )}
                    </div>

                    {/* 시간 */}
                    <div style={{ fontSize: '0.75rem', color: '#64748B', flexShrink: 0, textAlign: 'right' }}>
                      {formatDate(c.createdAt)}
                      <div style={{ marginTop: '4px' }}>{isExpanded ? '▲' : '▼'}</div>
                    </div>
                  </div>

                  {/* 확장 패널 */}
                  {isExpanded && (
                    <div style={{ padding: '0 20px 20px', borderTop: '1px solid #334155' }}>
                      {/* 대화 문맥 */}
                      {c.context && (
                        <div style={{ marginTop: '15px', padding: '12px', background: '#0F172A', borderRadius: '10px', fontSize: '0.85rem', color: '#CBD5E1', lineHeight: '1.6' }}>
                          <div style={{ fontWeight: '600', color: '#F59E0B', marginBottom: '6px', fontSize: '0.75rem' }}>💬 감지된 대화 문맥</div>
                          {c.context}
                        </div>
                      )}

                      {/* 기존 메모 */}
                      {c.note && (
                        <div style={{ marginTop: '10px', padding: '10px', background: '#1A2332', borderRadius: '8px', fontSize: '0.85rem', color: '#93C5FD', border: '1px solid #1E40AF33' }}>
                          📝 메모: {c.note}
                        </div>
                      )}

                      {/* 액션 버튼들 */}
                      <div style={{ marginTop: '15px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {c.status === 'NEEDS_CARE' && (
                          <button onClick={() => updateCase(c.id, 'IN_PROGRESS')}
                            style={{ padding: '8px 16px', background: '#F59E0B', color: '#0F172A', border: 'none', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer' }}>
                            🏃 심방 시작
                          </button>
                        )}
                        {(c.status === 'NEEDS_CARE' || c.status === 'IN_PROGRESS') && (
                          <button onClick={() => updateCase(c.id, 'COMPLETED')}
                            style={{ padding: '8px 16px', background: '#22C55E', color: 'white', border: 'none', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer' }}>
                            ✅ 심방 완료
                          </button>
                        )}
                        {c.status === 'COMPLETED' && (
                          <button onClick={() => updateCase(c.id, 'NEEDS_CARE')}
                            style={{ padding: '8px 16px', background: '#64748B', color: 'white', border: 'none', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer' }}>
                            🔄 재오픈
                          </button>
                        )}
                      </div>

                      {/* 메모 입력 */}
                      <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                        <input 
                          type="text" 
                          placeholder="심방 메모 입력..." 
                          value={noteInput}
                          onChange={(e) => setNoteInput(e.target.value)}
                          style={{ flex: 1, padding: '10px 14px', background: '#0F172A', border: '1px solid #334155', borderRadius: '10px', color: '#E2E8F0', fontSize: '0.85rem', outline: 'none' }}
                        />
                        <button 
                          onClick={() => { if (noteInput.trim()) updateCase(c.id, undefined, noteInput); }}
                          style={{ padding: '10px 16px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', flexShrink: 0 }}>
                          💾 저장
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 하단 안내 */}
        <div style={{ marginTop: '30px', padding: '20px', background: '#1E293B', borderRadius: '16px', textAlign: 'center', border: '1px solid #334155' }}>
          <p style={{ color: '#64748B', fontSize: '0.8rem', lineHeight: '1.6' }}>
            🔒 이 페이지는 관리자만 접근 가능합니다<br/>
            AI 반석이가 성도님들의 대화에서 자동으로 감지한 돌봄 필요 케이스입니다<br/>
            성도님은 이 시스템의 존재를 알 수 없습니다 (스텔스 모드)
          </p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse { 0% { opacity: 0.8; } 50% { opacity: 1; } 100% { opacity: 0.8; } }
      `}} />
    </div>
  );
}
