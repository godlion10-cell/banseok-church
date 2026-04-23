// @ts-nocheck
'use client';

import { useState } from 'react';

export default function SmartAdminPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async (type: 'sermon' | 'bulletin') => {
    if (!text) return alert('분석할 텍스트를 먼저 입력해주세요!');

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/ai-helper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentText: text, taskType: type }),
      });

      const data = await res.json();
      if (data.success) {
        setResult(data.data);
      } else {
        alert('분석 실패: ' + data.error);
      }
    } catch (error) {
      alert('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1012 0%, #2a1a1e 60%, #3a252a 100%)', fontFamily: "'Inter', sans-serif" }}>
      {/* 헤더 */}
      <div style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(193,156,114,0.15)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.8rem' }}>🤖</span>
          <div>
            <h1 style={{ margin: 0, color: '#fff', fontSize: '1.3rem', fontWeight: 700 }}>반석교회 AI 어시스턴트</h1>
            <p style={{ margin: 0, color: 'rgba(193,156,114,0.8)', fontSize: '0.78rem' }}>Gemini AI 기반 · 설교 분석 & 주보 체크</p>
          </div>
        </div>
        <a href="/admin" style={{ color: '#c19c72', textDecoration: 'none', fontSize: '0.85rem', padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(193,156,114,0.3)', transition: 'all 0.2s' }}>← 관리자 페이지</a>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* 입력 영역 */}
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', padding: '2rem', border: '1px solid rgba(193,156,114,0.12)', marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', color: '#c19c72', fontWeight: 600, marginBottom: '0.8rem', fontSize: '0.9rem' }}>📋 분석할 내용 입력</label>
          <textarea
            placeholder="여기에 설교 원고나 주보 내용을 복사해서 붙여넣어 보세요..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{
              width: '100%', minHeight: '250px', padding: '1.2rem',
              background: 'rgba(0,0,0,0.3)', color: '#e8e0d8',
              border: '1px solid rgba(193,156,114,0.2)', borderRadius: '12px',
              fontSize: '0.95rem', lineHeight: '1.8', resize: 'vertical',
              outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.8rem' }}>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem' }}>{text.length}자 입력됨</span>
          </div>
        </div>

        {/* 버튼 영역 */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleAnalyze('sermon')}
            disabled={loading}
            style={{
              flex: '1 1 200px', padding: '1rem 1.5rem',
              background: loading ? '#555' : 'linear-gradient(135deg, #5b272f, #7a3a44)',
              color: 'white', border: 'none', borderRadius: '12px',
              fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(91,39,47,0.4)',
              transition: 'all 0.2s',
            }}
          >
            {loading ? '⏳ AI 분석 중...' : '🎤 설교 멀티유즈 분석'}
          </button>
          <button
            onClick={() => handleAnalyze('bulletin')}
            disabled={loading}
            style={{
              flex: '1 1 200px', padding: '1rem 1.5rem',
              background: loading ? '#555' : 'linear-gradient(135deg, #02385C, #0a5a8c)',
              color: 'white', border: 'none', borderRadius: '12px',
              fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(2,56,92,0.4)',
              transition: 'all 0.2s',
            }}
          >
            {loading ? '⏳ AI 체크 중...' : '📋 예배 리소스 자동 체크'}
          </button>
        </div>

        {/* 로딩 애니메이션 */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#c19c72' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'pulse 1.5s infinite' }}>🤖</div>
            <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>AI가 열심히 분석하고 있습니다...</p>
            <p style={{ fontSize: '0.82rem', color: 'rgba(193,156,114,0.6)' }}>보통 5~15초 정도 소요됩니다</p>
          </div>
        )}

        {/* 결과 출력 */}
        {result && (
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', padding: '2rem', border: '1px solid rgba(193,156,114,0.15)' }}>
            <h2 style={{ color: '#c19c72', fontSize: '1.2rem', margin: '0 0 1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ✨ AI 분석 결과
            </h2>

            {/* 설교 분석 결과 */}
            {result.summary && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <ResultCard emoji="📝" title="설교 요약" content={result.summary} />
                <ResultCard emoji="📱" title="SNS 글귀" content={result.snsText} highlight />
                {result.qtQuestions && (
                  <div style={resultCardStyle}>
                    <div style={resultCardTitleStyle}><span>🙏</span> 묵상 질문</div>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#e8e0d8', lineHeight: '2' }}>
                      {result.qtQuestions.map((q: string, i: number) => <li key={i}>{q}</li>)}
                    </ul>
                  </div>
                )}
                <ResultCard emoji="🎬" title="유튜브 제목 추천" content={result.youtubeTitle} highlight />
              </div>
            )}

            {/* 주보 분석 결과 */}
            {result.actionItems && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {result.missingItems?.length > 0 && (
                  <div style={resultCardStyle}>
                    <div style={resultCardTitleStyle}><span>⚠️</span> 누락 항목</div>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#ffb74d', lineHeight: '2' }}>
                      {result.missingItems.map((m: string, i: number) => <li key={i}>{m}</li>)}
                    </ul>
                  </div>
                )}
                <div style={resultCardStyle}>
                  <div style={resultCardTitleStyle}><span>✅</span> 준비 액션 아이템</div>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#81c784', lineHeight: '2' }}>
                    {result.actionItems.map((a: string, i: number) => <li key={i}>{a}</li>)}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}

// --- 재사용 컴포넌트 ---
const resultCardStyle: React.CSSProperties = {
  background: 'rgba(0,0,0,0.2)',
  borderRadius: '12px',
  padding: '1.2rem 1.5rem',
  border: '1px solid rgba(193,156,114,0.1)',
};

const resultCardTitleStyle: React.CSSProperties = {
  color: '#c19c72',
  fontWeight: 700,
  fontSize: '0.9rem',
  marginBottom: '0.6rem',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

function ResultCard({ emoji, title, content, highlight }: { emoji: string; title: string; content: string; highlight?: boolean }) {
  return (
    <div style={resultCardStyle}>
      <div style={resultCardTitleStyle}><span>{emoji}</span> {title}</div>
      <p style={{
        margin: 0, color: highlight ? '#c19c72' : '#e8e0d8',
        fontSize: highlight ? '1.05rem' : '0.95rem',
        lineHeight: '1.8', fontWeight: highlight ? 600 : 400,
      }}>{content}</p>
    </div>
  );
}
