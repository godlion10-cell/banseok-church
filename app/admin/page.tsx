// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import s from './admin.module.css';

type Tab = 'news' | 'sermons' | 'schedules' | 'worshipOrders';

export default function AdminPage() {
  // === AUTH ===
  const [isAuthed, setIsAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [tab, setTab] = useState<Tab>('news');

  // === DATA ===
  const [news, setNews] = useState<any[]>([]);
  const [sermons, setSermons] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [worshipOrders, setWorshipOrders] = useState<any[]>([]);

  // === FORMS ===
  const [editId, setEditId] = useState<string | null>(null);
  const [newsForm, setNewsForm] = useState({ title: '', content: '', order: 0 });
  const [sermonForm, setSermonForm] = useState({ category: '', title: '', content: '', videoId: '' });
  const [schedForm, setSchedForm] = useState({ title: '', time: '', place: '2층 본당', officer: '이주민 목사', order: 0 });
  const [woForm, setWoForm] = useState({ category: '', title: '', content: '' });

  // === AUTH ===
  useEffect(() => { if (sessionStorage.getItem('admin_token')) setIsAuthed(true); }, []);

  const handleLogin = async () => {
    setAuthLoading(true); setAuthError('');
    try {
      const res = await fetch('/api/admin/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      const data = await res.json();
      if (data.success) { sessionStorage.setItem('admin_token', data.token); setIsAuthed(true); }
      else setAuthError(data.error || '비밀번호가 틀렸습니다.');
    } catch { setAuthError('서버 연결 오류'); }
    setAuthLoading(false);
  };

  const handleLogout = () => { sessionStorage.removeItem('admin_token'); setIsAuthed(false); setPassword(''); };

  // === LOAD DATA ===
  const loadAll = () => fetch('/api/admin/cms').then(r => r.json()).then(d => {
    if (d.success) { setNews(d.news); setSermons(d.sermons); setSchedules(d.schedules); setWorshipOrders(d.worshipOrders); }
  }).catch(() => {});

  useEffect(() => { if (isAuthed) loadAll(); }, [isAuthed]);

  // === API HELPERS ===
  const api = async (body: any) => {
    await fetch('/api/admin/cms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    loadAll();
  };

  const resetForms = () => { setEditId(null); setNewsForm({ title: '', content: '', order: 0 }); setSermonForm({ category: '', title: '', content: '', videoId: '' }); setSchedForm({ title: '', time: '', place: '2층 본당', officer: '이주민 목사', order: 0 }); setWoForm({ category: '', title: '', content: '' }); };

  // === HANDLERS ===
  const saveNews = () => { if (!newsForm.title) return alert('제목 입력'); api({ _model: 'news', id: editId, ...newsForm }); resetForms(); };
  const saveSerm = () => { if (!sermonForm.title) return alert('제목 입력'); api({ _model: 'sermon', id: editId, ...sermonForm }); resetForms(); };
  const saveSched = () => { if (!schedForm.title) return alert('예배명 입력'); api({ _model: 'schedule', id: editId, ...schedForm }); resetForms(); };
  const saveWo = () => { if (!woForm.category) return alert('카테고리 입력'); api({ _model: 'worshipOrder', id: editId, ...woForm }); resetForms(); };

  const del = (model: string, id: string) => { if (confirm('삭제?')) { api({ _model: model, id, _delete: true }); } };

  if (!isAuthed) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'linear-gradient(135deg, #1a1012 0%, #2a1a1e 60%, #3a252a 100%)', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ background: 'white', borderRadius: 20, padding: '3rem 2.5rem', width: '100%', maxWidth: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.4)', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🔐</div>
        <h2 style={{ fontFamily: "'Nanum Myeongjo', serif", color: '#5b272f', marginBottom: '0.3rem' }}>관리자 인증</h2>
        <p style={{ color: '#999', fontSize: '0.85rem', marginBottom: '1.5rem' }}>반석교회 관리자 비밀번호를 입력하세요</p>
        <input type="password" value={password} onChange={e => { setPassword(e.target.value); setAuthError(''); }} onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="비밀번호 입력" style={{ width: '100%', padding: '0.9rem 1rem', border: `2px solid ${authError ? '#c62828' : '#ddd'}`, borderRadius: 12, fontSize: '1rem', marginBottom: '0.5rem', outline: 'none', boxSizing: 'border-box' }} autoFocus />
        {authError && <p style={{ color: '#c62828', fontSize: '0.82rem', margin: '0.3rem 0 0.5rem' }}>❌ {authError}</p>}
        <button onClick={handleLogin} disabled={authLoading || !password} style={{ width: '100%', padding: '0.9rem', background: authLoading ? '#999' : 'linear-gradient(135deg, #5b272f, #7a3a44)', color: 'white', border: 'none', borderRadius: 12, fontSize: '1rem', fontWeight: 700, cursor: 'pointer', marginTop: '0.5rem' }}>{authLoading ? '인증 중...' : '🔓 로그인'}</button>
        <a href="/" style={{ display: 'block', marginTop: '1.2rem', color: '#c19c72', fontSize: '0.82rem', textDecoration: 'none' }}>← 홈으로 돌아가기</a>
      </div>
    </div>
  );

  return (
    <div className={s.adminLayout}>
      <aside className={s.sidebar}>
        <div className={s.sidebarHeader}><h2>⛪ 반석교회</h2><p>관리자 모드</p></div>
        <nav className={s.sidebarNav}>
          <button className={`${s.sidebarLink} ${tab === 'news' ? s.sidebarLinkActive : ''}`} onClick={() => { setTab('news'); resetForms(); }}>📰 교회소식</button>
          <button className={`${s.sidebarLink} ${tab === 'sermons' ? s.sidebarLinkActive : ''}`} onClick={() => { setTab('sermons'); resetForms(); }}>🎤 설교관리</button>
          <button className={`${s.sidebarLink} ${tab === 'schedules' ? s.sidebarLinkActive : ''}`} onClick={() => { setTab('schedules'); resetForms(); }}>📅 예배시간</button>
          <button className={`${s.sidebarLink} ${tab === 'worshipOrders' ? s.sidebarLinkActive : ''}`} onClick={() => { setTab('worshipOrders'); resetForms(); }}>📋 예배순서</button>
        </nav>
        <a href="/admin/ai" className={s.sidebarLink} style={{ display: 'block', textAlign: 'center', marginTop: '0.5rem', background: 'linear-gradient(135deg, rgba(193,156,114,0.15), rgba(91,39,47,0.1))', border: '1px solid rgba(193,156,114,0.2)', textDecoration: 'none' }}>🤖 AI 어시스턴트</a>
        <button onClick={handleLogout} className={s.sidebarBack} style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8rem' }}>🚪 로그아웃</button>
        <a href="/" className={s.sidebarBack}>← 홈페이지로 돌아가기</a>
      </aside>

      <main className={s.adminMain}>
        {/* ========== 교회소식 ========== */}
        {tab === 'news' && (<>
          <div className={s.pageHeader}><h1>📰 교회소식 관리</h1></div>
          <div className={s.statsGrid}>
            <div className={s.statCard}><div className={s.statIcon} style={{ background: '#e8f5e9' }}>📰</div><div className={s.statInfo}><h4>{news.length}</h4><p>총 소식</p></div></div>
          </div>
          <div className={s.card} style={{ marginBottom: '1rem' }}>
            <div className={s.cardHeader}><h3>{editId ? '소식 수정' : '새 소식 추가'}</h3></div>
            <div className={s.cardBody}>
              <div className={s.formGrid}>
                <div className={s.formGroup}><label>제목 *</label><input value={newsForm.title} onChange={e => setNewsForm({ ...newsForm, title: e.target.value })} placeholder="소식 제목" /></div>
                <div className={s.formGroup}><label>순서</label><input type="number" value={newsForm.order} onChange={e => setNewsForm({ ...newsForm, order: Number(e.target.value) })} /></div>
                <div className={`${s.formGroup} ${s.formGroupFull}`}><label>내용 *</label><textarea value={newsForm.content} onChange={e => setNewsForm({ ...newsForm, content: e.target.value })} placeholder="소식 내용" /></div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className={`${s.btn} ${s.btnPrimary}`} onClick={saveNews}>{editId ? '✏️ 수정' : '➕ 추가'}</button>
                {editId && <button className={`${s.btn} ${s.btnGhost}`} onClick={resetForms}>취소</button>}
              </div>
            </div>
          </div>
          <div className={s.card}>
            <table className={s.table}>
              <thead><tr><th>순서</th><th>제목</th><th>내용</th><th>작업</th></tr></thead>
              <tbody>
                {news.length > 0 ? news.map(n => (
                  <tr key={n.id}>
                    <td>{n.order}</td>
                    <td style={{ fontWeight: 600 }}>{n.title}</td>
                    <td style={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.content}</td>
                    <td>
                      <button className={`${s.btn} ${s.btnGhost} ${s.btnSm}`} onClick={() => { setEditId(n.id); setNewsForm({ title: n.title, content: n.content, order: n.order }); }}>✏️</button>
                      <button className={`${s.btn} ${s.btnDanger} ${s.btnSm}`} style={{ marginLeft: 4 }} onClick={() => del('news', n.id)}>🗑</button>
                    </td>
                  </tr>
                )) : <tr><td colSpan={4}><div className={s.emptyState}><span>📭</span>소식이 없습니다.</div></td></tr>}
              </tbody>
            </table>
          </div>
        </>)}

        {/* ========== 설교관리 ========== */}
        {tab === 'sermons' && (<>
          <div className={s.pageHeader}><h1>🎤 설교 관리</h1></div>
          <div className={s.statsGrid}>
            <div className={s.statCard}><div className={s.statIcon} style={{ background: '#e3f2fd' }}>🎤</div><div className={s.statInfo}><h4>{sermons.length}</h4><p>총 설교</p></div></div>
          </div>
          <div className={s.card} style={{ marginBottom: '1rem' }}>
            <div className={s.cardHeader}><h3>{editId ? '설교 수정' : '새 설교 추가'}</h3></div>
            <div className={s.cardBody}>
              <div className={s.formGrid}>
                <div className={s.formGroup}><label>카테고리 *</label><input value={sermonForm.category} onChange={e => setSermonForm({ ...sermonForm, category: e.target.value })} placeholder="주일오전 설교" /></div>
                <div className={s.formGroup}><label>제목 *</label><input value={sermonForm.title} onChange={e => setSermonForm({ ...sermonForm, title: e.target.value })} placeholder="설교 제목" /></div>
                <div className={s.formGroup}><label>설교자/성경</label><input value={sermonForm.content} onChange={e => setSermonForm({ ...sermonForm, content: e.target.value })} placeholder="이주민 목사 (고전 15:1-10)" /></div>
                <div className={s.formGroup}><label>유튜브 영상 ID</label><input value={sermonForm.videoId} onChange={e => setSermonForm({ ...sermonForm, videoId: e.target.value })} placeholder="dQw4w9WgXcQ" /></div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className={`${s.btn} ${s.btnPrimary}`} onClick={saveSerm}>{editId ? '✏️ 수정' : '➕ 추가'}</button>
                {editId && <button className={`${s.btn} ${s.btnGhost}`} onClick={resetForms}>취소</button>}
              </div>
            </div>
          </div>
          <div className={s.card}>
            <table className={s.table}>
              <thead><tr><th>카테고리</th><th>제목</th><th>설교자/성경</th><th>영상ID</th><th>작업</th></tr></thead>
              <tbody>
                {sermons.length > 0 ? sermons.map(sr => (
                  <tr key={sr.id}>
                    <td><span className={s.badge} style={{ background: '#e3f2fd', color: '#1565c0' }}>{sr.category}</span></td>
                    <td style={{ fontWeight: 600 }}>{sr.title}</td>
                    <td>{sr.content || '-'}</td>
                    <td>{sr.videoId || '-'}</td>
                    <td>
                      <button className={`${s.btn} ${s.btnGhost} ${s.btnSm}`} onClick={() => { setEditId(sr.id); setSermonForm({ category: sr.category, title: sr.title, content: sr.content || '', videoId: sr.videoId || '' }); }}>✏️</button>
                      <button className={`${s.btn} ${s.btnDanger} ${s.btnSm}`} style={{ marginLeft: 4 }} onClick={() => del('sermon', sr.id)}>🗑</button>
                    </td>
                  </tr>
                )) : <tr><td colSpan={5}><div className={s.emptyState}><span>🎤</span>설교가 없습니다.</div></td></tr>}
              </tbody>
            </table>
          </div>
        </>)}

        {/* ========== 예배시간 ========== */}
        {tab === 'schedules' && (<>
          <div className={s.pageHeader}><h1>📅 예배시간 관리</h1></div>
          <div className={s.statsGrid}>
            <div className={s.statCard}><div className={s.statIcon} style={{ background: '#fff3e0' }}>📅</div><div className={s.statInfo}><h4>{schedules.length}</h4><p>예배 시간</p></div></div>
          </div>
          <div className={s.card} style={{ marginBottom: '1rem' }}>
            <div className={s.cardHeader}><h3>{editId ? '수정' : '새 예배시간 추가'}</h3></div>
            <div className={s.cardBody}>
              <div className={s.formGrid}>
                <div className={s.formGroup}><label>예배명 *</label><input value={schedForm.title} onChange={e => setSchedForm({ ...schedForm, title: e.target.value })} placeholder="주일대예배 (1부)" /></div>
                <div className={s.formGroup}><label>시간 *</label><input value={schedForm.time} onChange={e => setSchedForm({ ...schedForm, time: e.target.value })} placeholder="오전 09:00" /></div>
                <div className={s.formGroup}><label>장소</label><input value={schedForm.place} onChange={e => setSchedForm({ ...schedForm, place: e.target.value })} /></div>
                <div className={s.formGroup}><label>담당</label><input value={schedForm.officer} onChange={e => setSchedForm({ ...schedForm, officer: e.target.value })} /></div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className={`${s.btn} ${s.btnPrimary}`} onClick={saveSched}>{editId ? '✏️ 수정' : '➕ 추가'}</button>
                {editId && <button className={`${s.btn} ${s.btnGhost}`} onClick={resetForms}>취소</button>}
              </div>
            </div>
          </div>
          <div className={s.card}>
            <table className={s.table}>
              <thead><tr><th>예배명</th><th>시간</th><th>장소</th><th>담당</th><th>작업</th></tr></thead>
              <tbody>
                {schedules.length > 0 ? schedules.map(sc => (
                  <tr key={sc.id}>
                    <td style={{ fontWeight: 600 }}>{sc.title}</td>
                    <td><span className={s.badge} style={{ background: '#fff3e0', color: '#e65100' }}>{sc.time}</span></td>
                    <td>{sc.place}</td>
                    <td>{sc.officer}</td>
                    <td>
                      <button className={`${s.btn} ${s.btnGhost} ${s.btnSm}`} onClick={() => { setEditId(sc.id); setSchedForm({ title: sc.title, time: sc.time, place: sc.place, officer: sc.officer, order: sc.order }); }}>✏️</button>
                      <button className={`${s.btn} ${s.btnDanger} ${s.btnSm}`} style={{ marginLeft: 4 }} onClick={() => del('schedule', sc.id)}>🗑</button>
                    </td>
                  </tr>
                )) : <tr><td colSpan={5}><div className={s.emptyState}><span>📅</span>예배시간이 없습니다.</div></td></tr>}
              </tbody>
            </table>
          </div>
        </>)}

        {/* ========== 예배순서 ========== */}
        {tab === 'worshipOrders' && (<>
          <div className={s.pageHeader}><h1>📋 예배순서 관리</h1></div>
          <div className={s.statsGrid}>
            <div className={s.statCard}><div className={s.statIcon} style={{ background: '#f3e5f5' }}>📋</div><div className={s.statInfo}><h4>{worshipOrders.length}</h4><p>예배 순서</p></div></div>
          </div>
          <div className={s.card} style={{ marginBottom: '1rem' }}>
            <div className={s.cardHeader}><h3>{editId ? '수정' : '새 예배순서 추가'}</h3></div>
            <div className={s.cardBody}>
              <div className={s.formGrid}>
                <div className={s.formGroup}><label>카테고리 (고유) *</label><input value={woForm.category} onChange={e => setWoForm({ ...woForm, category: e.target.value })} placeholder="주일대예배 (1부)" /></div>
                <div className={s.formGroup}><label>제목</label><input value={woForm.title} onChange={e => setWoForm({ ...woForm, title: e.target.value })} placeholder="주일 오전 예배 순서" /></div>
                <div className={`${s.formGroup} ${s.formGroupFull}`}><label>순서 내용 (JSON)</label><textarea value={woForm.content} onChange={e => setWoForm({ ...woForm, content: e.target.value })} placeholder='[{"heading":"◀ 개회","rows":[{"label":"묵도","content":"","resp":"다같이"}]}]' style={{ minHeight: 120, fontFamily: 'monospace', fontSize: '0.82rem' }} /></div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className={`${s.btn} ${s.btnPrimary}`} onClick={saveWo}>{editId ? '✏️ 수정' : '➕ 추가'}</button>
                {editId && <button className={`${s.btn} ${s.btnGhost}`} onClick={resetForms}>취소</button>}
              </div>
            </div>
          </div>
          <div className={s.card}>
            <table className={s.table}>
              <thead><tr><th>카테고리</th><th>제목</th><th>순서 내용</th><th>작업</th></tr></thead>
              <tbody>
                {worshipOrders.length > 0 ? worshipOrders.map(wo => (
                  <tr key={wo.id}>
                    <td><span className={s.badge} style={{ background: '#f3e5f5', color: '#7b1fa2' }}>{wo.category}</span></td>
                    <td style={{ fontWeight: 600 }}>{wo.title}</td>
                    <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: '0.78rem' }}>{wo.content}</td>
                    <td>
                      <button className={`${s.btn} ${s.btnGhost} ${s.btnSm}`} onClick={() => { setEditId(wo.id); setWoForm({ category: wo.category, title: wo.title, content: wo.content }); }}>✏️</button>
                      <button className={`${s.btn} ${s.btnDanger} ${s.btnSm}`} style={{ marginLeft: 4 }} onClick={() => del('worshipOrder', wo.id)}>🗑</button>
                    </td>
                  </tr>
                )) : <tr><td colSpan={4}><div className={s.emptyState}><span>📋</span>예배순서가 없습니다.</div></td></tr>}
              </tbody>
            </table>
          </div>
        </>)}
      </main>
    </div>
  );
}
