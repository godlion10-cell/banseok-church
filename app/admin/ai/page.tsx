// @ts-nocheck
'use client';

import { useState, useRef } from 'react';

export default function SmartAdminPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; type: string; base64: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 📎 이미지 압축 유틸리티
  const compressImage = (file: File, maxWidth = 1200, quality = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas 생성 실패')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('이미지 로드 실패'));
      img.src = URL.createObjectURL(file);
    });
  };

  // 📎 파일 첨부 핸들러
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { alert('파일 크기는 4MB 이하여야 합니다.'); return; }

    if (file.type.startsWith('image/')) {
      try {
        const compressedBase64 = await compressImage(file);
        setAttachedFile({ name: file.name, type: 'image/jpeg', base64: compressedBase64 });
      } catch { alert('이미지 처리 실패'); }
    } else {
      const reader = new FileReader();
      reader.onload = () => setAttachedFile({ name: file.name, type: file.type, base64: reader.result as string });
      reader.onerror = () => alert('파일 읽기 실패');
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  // 🧠 스마트 분석 실행 (텍스트 or 파일)
  const handleSmartAnalyze = async () => {
    if (!text && !attachedFile) return alert('분석할 텍스트를 입력하거나 파일을 첨부해주세요!');

    setLoading(true);
    setResult(null);

    try {
      const requestBody: any = { message: '스마트 분류 분석 요청' };
      if (attachedFile) requestBody.file = attachedFile;
      if (text) requestBody.text = text;

      const res = await fetch('/api/admin/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => `HTTP ${res.status}`);
        alert(`서버 오류 (${res.status}): ${errorText.slice(0, 100)}`);
        return;
      }

      const data = await res.json();
      if (data.success) {
        setResult(data);
        setAttachedFile(null);
      } else {
        alert('분석 실패: ' + (data.error || '알 수 없는 오류'));
      }
    } catch (error) {
      alert('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 📋 기존 텍스트 전용 분석 (설교/주보 리소스 체크)
  const handleLegacyAnalyze = async (type: 'sermon' | 'bulletin') => {
    if (!text) return alert('분석할 텍스트를 먼저 입력해주세요!');

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/ai-helper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentText: text, taskType: type }),
      });

      if (!res.ok) { alert(`서버 오류 (${res.status})`); return; }
      const data = await res.json();
      if (data.success) setResult({ ...data.data, _legacyMode: true });
      else alert('분석 실패: ' + data.error);
    } catch { alert('네트워크 오류'); }
    finally { setLoading(false); }
  };

  // 카테고리별 배지 색상
  const getCategoryStyle = (cat: string) => {
    switch (cat) {
      case 'BULLETIN': return { bg: '#1E3A8A', icon: '📋', label: '주보' };
      case 'SERMON': return { bg: '#7C3AED', icon: '🎤', label: '설교' };
      case 'NEWS': return { bg: '#059669', icon: '📢', label: '교회 소식' };
      default: return { bg: '#475569', icon: '❓', label: cat };
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1012 0%, #2a1a1e 60%, #3a252a 100%)', fontFamily: "'Inter', sans-serif" }}>
      {/* 헤더 */}
      <div style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(193,156,114,0.15)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.8rem' }}>🧠</span>
          <div>
            <h1 style={{ margin: 0, color: '#fff', fontSize: '1.3rem', fontWeight: 700 }}>스마트 분류 엔진</h1>
            <p style={{ margin: 0, color: 'rgba(193,156,114,0.8)', fontSize: '0.78rem' }}>파일 첨부 → AI 자동 분류 → DB 저장 → UI 즉시 동기화</p>
          </div>
        </div>
        <a href="/admin" style={{ color: '#c19c72', textDecoration: 'none', fontSize: '0.85rem', padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(193,156,114,0.3)', transition: 'all 0.2s' }}>← 관리자 페이지</a>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* 🧠 스마트 분류 카드 */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(59,130,246,0.08))',
          border: '1px solid rgba(139,92,246,0.3)',
          borderRadius: '20px', padding: '2rem', marginBottom: '1.5rem'
        }}>
          <h2 style={{ color: '#A78BFA', fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🧠 스마트 분류 모드 — 파일 또는 텍스트를 넣으면 AI가 자동 판별
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginBottom: '1.2rem', lineHeight: 1.7 }}>
            주보 이미지, 설교 원고, 교회 소식 — 무엇이든 넣으면 AI가 분류하고 올바른 DB에 저장한 후 페이지를 즉시 업데이트합니다.
          </p>

          {/* 파일 첨부 영역 */}
          <div style={{ marginBottom: '1rem' }}>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*,.pdf,.txt,.doc,.docx" style={{ display: 'none' }} />
            <button onClick={() => fileInputRef.current?.click()} style={{
              padding: '14px 28px', background: 'rgba(139,92,246,0.15)', color: '#A78BFA',
              border: '2px dashed rgba(139,92,246,0.4)', borderRadius: '16px',
              fontSize: '1rem', fontWeight: 600, cursor: 'pointer', width: '100%',
              transition: 'all 0.2s',
            }}>
              {attachedFile ? `📎 ${attachedFile.name} (변경하려면 클릭)` : '📎 파일 첨부 (이미지, PDF, 문서)'}
            </button>
            {attachedFile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', padding: '8px 14px', background: 'rgba(139,92,246,0.08)', borderRadius: '10px' }}>
                <span style={{ color: '#A78BFA', fontSize: '0.85rem', flex: 1 }}>📎 {attachedFile.name} ({attachedFile.type})</span>
                <button onClick={() => setAttachedFile(null)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
              </div>
            )}
          </div>

          {/* 텍스트 입력 (선택) */}
          <textarea
            placeholder="또는 여기에 텍스트를 붙여넣으세요 (설교 원고, 교회 소식 등)..."
            value={text} onChange={(e) => setText(e.target.value)}
            style={{
              width: '100%', minHeight: '150px', padding: '1.2rem',
              background: 'rgba(0,0,0,0.3)', color: '#e8e0d8',
              border: '1px solid rgba(193,156,114,0.2)', borderRadius: '12px',
              fontSize: '0.95rem', lineHeight: '1.8', resize: 'vertical',
              outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
              marginBottom: '1rem',
            }}
          />

          {/* 🧠 스마트 분석 버튼 */}
          <button
            onClick={handleSmartAnalyze} disabled={loading}
            style={{
              width: '100%', padding: '1.2rem',
              background: loading ? '#555' : 'linear-gradient(135deg, #7C3AED, #3B82F6)',
              color: 'white', border: 'none', borderRadius: '14px',
              fontSize: '1.1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 6px 20px rgba(124,58,237,0.4)',
              transition: 'all 0.2s',
            }}
          >
            {loading ? '⏳ AI 분석 + DB 저장 + UI 동기화 중...' : '🧠 스마트 분류 실행 → 자동 DB 저장 + UI 동기화'}
          </button>
        </div>

        {/* 기존 텍스트 분석 도구 (레거시) */}
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '16px', padding: '1.5rem', border: '1px solid rgba(193,156,114,0.08)', marginBottom: '1.5rem' }}>
          <h3 style={{ color: 'rgba(193,156,114,0.6)', fontSize: '0.9rem', marginBottom: '1rem' }}>📝 텍스트 전용 분석 도구 (DB 저장 없음 — 결과만 확인)</h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button onClick={() => handleLegacyAnalyze('sermon')} disabled={loading}
              style={{ flex: '1 1 200px', padding: '0.8rem', background: loading ? '#555' : 'rgba(91,39,47,0.5)', color: 'white', border: '1px solid rgba(91,39,47,0.3)', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
              🎤 설교 멀티유즈 분석
            </button>
            <button onClick={() => handleLegacyAnalyze('bulletin')} disabled={loading}
              style={{ flex: '1 1 200px', padding: '0.8rem', background: loading ? '#555' : 'rgba(2,56,92,0.5)', color: 'white', border: '1px solid rgba(2,56,92,0.3)', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
              📋 예배 리소스 체크
            </button>
          </div>
        </div>

        {/* 로딩 */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#A78BFA' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'pulse 1.5s infinite' }}>🧠</div>
            <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>AI가 분석하고 분류하고 저장하는 중...</p>
            <p style={{ fontSize: '0.82rem', color: 'rgba(193,156,114,0.6)' }}>보통 5~15초 정도 소요됩니다</p>
          </div>
        )}

        {/* ✨ 스마트 분류 결과 */}
        {result && !result._legacyMode && (
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', padding: '2rem', border: '1px solid rgba(193,156,114,0.15)' }}>
            <h2 style={{ color: '#c19c72', fontSize: '1.2rem', margin: '0 0 1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ✨ 스마트 분류 결과
            </h2>

            {/* 카테고리 배지 + 확신도 */}
            {result.category && (() => {
              const cs = getCategoryStyle(result.category);
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: cs.bg, borderRadius: '30px', color: 'white', fontWeight: 700, fontSize: '1rem', boxShadow: `0 4px 15px ${cs.bg}44` }}>
                    <span style={{ fontSize: '1.3rem' }}>{cs.icon}</span> {cs.label}
                  </div>
                  {result.confidence && (
                    <div style={{ padding: '8px 16px', borderRadius: '20px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e8e0d8', fontSize: '0.85rem' }}>
                      🎯 확신도: <strong>{Math.round(result.confidence * 100)}%</strong>
                    </div>
                  )}
                  {result.savedTo && (
                    <div style={{ padding: '8px 16px', borderRadius: '20px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ADE80', fontSize: '0.85rem' }}>
                      💾 {result.savedTo} 테이블 저장 완료
                    </div>
                  )}
                  {result.revalidatedPath && (
                    <div style={{ padding: '8px 16px', borderRadius: '20px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#60A5FA', fontSize: '0.85rem' }}>
                      🔄 {result.revalidatedPath} 즉시 갱신
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 요약 */}
            {result.summary && <ResultCard emoji="📝" title="AI 분석 요약" content={result.summary} />}

            {/* 응답 메시지 */}
            {result.reply && (
              <div style={{ ...resultCardStyle, marginTop: '1rem', borderLeft: '4px solid #22C55E' }}>
                <div style={resultCardTitleStyle}><span>✅</span> 처리 결과</div>
                <p style={{ margin: 0, color: '#4ADE80', fontSize: '0.95rem', lineHeight: '1.8', whiteSpace: 'pre-line' }}>{result.reply}</p>
              </div>
            )}

            {/* DB 에러 시 */}
            {result.dbError && (
              <div style={{ ...resultCardStyle, marginTop: '1rem', borderLeft: '4px solid #EF4444' }}>
                <div style={{ ...resultCardTitleStyle, color: '#EF4444' }}><span>⚠️</span> DB 저장 오류</div>
                <p style={{ margin: 0, color: '#FCA5A5', fontSize: '0.9rem' }}>{result.dbError}</p>
              </div>
            )}

            {/* 사용 모델 */}
            {result.model && (
              <p style={{ marginTop: '1rem', textAlign: 'right', fontSize: '0.75rem', color: 'rgba(193,156,114,0.4)' }}>
                모델: {result.model}
              </p>
            )}
          </div>
        )}

        {/* 기존 레거시 결과 */}
        {result && result._legacyMode && (
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', padding: '2rem', border: '1px solid rgba(193,156,114,0.15)' }}>
            <h2 style={{ color: '#c19c72', fontSize: '1.2rem', margin: '0 0 1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ✨ AI 분석 결과 (텍스트 전용)
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
        whiteSpace: 'pre-line',
      }}>{content}</p>
    </div>
  );
}
