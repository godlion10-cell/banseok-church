// @ts-nocheck
'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';

// ===== 헬퍼 =====
function getNextWorship(): string { return '주일 오전 9시 주일대예배'; }

type SectionKey = 'about' | 'vision' | 'sermon' | 'news' | 'schedule' | 'location';

const NAV_ITEMS: { key: SectionKey; label: string }[] = [
  { key: 'about', label: '교회소개' },
  { key: 'vision', label: '비전과사명' },
  { key: 'sermon', label: '설교말씀' },
  { key: 'news', label: '교회소식' },
  { key: 'schedule', label: '예배안내' },
  { key: 'location', label: '오시는길' },
];

// ===== 목사님의 소중한 데이터 (복구완료) =====
const FALLBACK_NEWS = [
  { id: 'f1', title: '환영 및 등록 안내', content: '환영하고 축복합니다. 반석교회는 대한예수교 장로회 합동 측 소속입니다.\n• 유튜브: @petros-church\n• 온라인 헌금: 신협 131-017-687642\n• 다음세대 후원: 신협 131-018-242250' },
  { id: 'f2', title: '홈페이지 및 교회 소식', content: '반석교회 홈페이지 초안이 만들어졌습니다. 주소는 "거제반석교회.com" 입니다.' },
  { id: 'f3', title: '부활주일 감사', content: '할렐루야! 오늘은 부활주일입니다.' },
  { id: 'f4', title: '부활절 이벤트 동참', content: '본당 뒤편, 좋아하는 말씀 구절을 적어주세요. 함께 십자가를 채워요~' },
  { id: 'f5', title: '오늘 세례식 안내', content: '성인 세례: 설하나 자매. 함께 축복하고 환영해 주세요.' },
  { id: 'f6', title: '부활절 연합예배', content: '오늘 오후는 연초지역 연합예배로 드립니다. (송정교회 / 14:30)' },
  { id: 'f7', title: '새생명 축제 작정', content: '다음 주일에는 새생명을 작정하는 시간을 가집니다.' },
  { id: 'f8', title: '성전 보수 공사', content: '본당 방음 및 난방 벽 공사가 시작됩니다. 건축헌금 동참 부탁드립니다.' },
  { id: 'f9', title: '새가족 소개', content: '성시현 자매, 김원만 형제/허순 자매님을 환영하고 축복합니다.' },
  { id: 'f10', title: '전교인 성경퀴즈대회', content: '5월 5주차 진행 예정입니다. 범위는 주일말씀정리 유인물입니다.' },
];

const FALLBACK_SERMONS = [
  { id: 's1', title: '부활, 죽음을 이기는 하나님의 소망', category: '주일오전 설교', content: '이주민 목사 (고전 15:1-10)' },
  { id: 's2', title: '다시 시작된 하나님의 인도', category: '수요예배 말씀', content: '이주민 목사 (창 45:16-28)' },
  { id: 's3', title: '생명의 삶 (매일 새벽)', category: '큐티(QT) 안내', content: '경건의 시간' },
];

const FALLBACK_SCHEDULES = [
  { id: 'sc1', title: '주일대예배 (1부)', time: '오전 09:00', place: '2층 본당', officer: '이주민 목사' },
  { id: 'sc2', title: '주일대예배 (2부)', time: '오전 11:00', place: '2층 본당', officer: '이주민 목사' },
  { id: 'sc3', title: '주일오후예배', time: '오후 01:50', place: '2층 본당', officer: '이주민 목사' },
  { id: 'sc4', title: '주일청소년', time: '오전 10:00', place: '3층 교육관', officer: '김민정' },
  { id: 'sc5', title: '주일어린이', time: '오전 11:00', place: '3층 교육관', officer: '김민정' },
  { id: 'sc6', title: '수요저녁예배', time: '저녁 07:30', place: '2층 본당', officer: '이주민 목사' },
  { id: 'sc7', title: '금요기도회', time: '저녁 08:00', place: '2층 본당', officer: '이주민 목사' },
  { id: 'sc8', title: '새벽예배', time: '오전 05:30', place: '2층 본당', officer: '이주민 목사' },
];

const WORSHIP_ORDERS: Record<string, any> = {
  '주일대예배 (1부)': {
    title: '주일 오전 예배 순서',
    groups: [
      { heading: '◀ 개회 (하나님께 나아감)', rows: [
        { label: '묵도', content: '', resp: '다같이' },
        { label: '개회찬송', content: '예수 우리 왕이여 (38장)', resp: '다같이' },
        { label: '신앙고백', content: '사도신경', resp: '다같이' },
        { label: '교독문', content: '134번 (부활절2)', resp: '다같이' },
        { label: '찬송', content: '할렐루야 우리 예수 (161장)', resp: '다같이' },
      ]},
      { heading: '◀ 말씀의 선포', rows: [
        { label: '성경봉독', content: '고린도전서 15:1~10', resp: '다같이' },
        { label: '말씀', content: '부활, 죽음을 이기는 하나님의 소망', resp: '이주민 목사', bold: true },
        { label: '합심기도', content: '', resp: '다같이' },
      ]},
    ],
  },
  '주일대예배 (2부)': {
    title: '주일 오전 예배 순서',
    groups: [
      { heading: '◀ 개회', rows: [
        { label: '묵도', content: '', resp: '다같이' },
        { label: '개회찬송', content: '예수 우리 왕이여 (38장)', resp: '다같이' },
        { label: '찬송', content: '할렐루야 우리 예수 (161장)', resp: '다같이' },
      ]},
      { heading: '◀ 말씀', rows: [
        { label: '성경봉독', content: '고린도전서 15:1~10', resp: '다같이' },
        { label: '말씀', content: '부활, 죽음을 이기는 하나님의 소망', resp: '이주민 목사', bold: true },
      ]},
    ],
  },
};

const MINISTRY_CARDS = [
  { color: '#5b272f', badge: 'UP · 예배', title: '하나님을 향한 예배', desc: '온 마음을 다하여 하나님께 예배하는 공동체', verse: '요 4:24' },
  { color: '#c19c72', badge: 'IN · 양육', title: '말씀으로 세워지는 제자', desc: '성경 말씀을 통해 성숙한 그리스도인으로 자라감', verse: '딤후 3:16-17' },
  { color: '#02385C', badge: 'OUT · 선교', title: '세상을 향한 선교', desc: '복음을 전하고 이웃을 섬기는 사명 공동체', verse: '마 28:19-20' },
];

const PILLARS = [
  { icon: '/vision/icon-solid.png', title: '견고한 반석', desc: '그리스도 위에 세워진 흔들리지 않는 신앙' },
  { icon: '/vision/icon-steadfast.png', title: '변함없는 신실함', desc: '어떤 환경에서도 주님을 신뢰하는 믿음' },
  { icon: '/vision/icon-strong.png', title: '강건한 공동체', desc: '서로 사랑하고 세워주는 그리스도의 몸' },
  { icon: '/vision/icon-build.png', title: '다음 세대 세움', desc: '미래 세대에 신앙을 전수하는 교회' },
];

export default function HomeClient() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionKey>('about');
  const [isLive, setIsLive] = useState(false);
  const [liveVideoId, setLiveVideoId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [popupVideo, setPopupVideo] = useState<any>(null);

  // 팝업 열기/닫기 (스크롤 잠금)
  const openPopup = (video: any) => { setPopupVideo(video); document.body.style.overflow = 'hidden'; };
  const closePopup = () => { setPopupVideo(null); document.body.style.overflow = ''; };

  const [newsItems, setNewsItems] = useState<any[]>([]);
  const [sermonItems, setSermonItems] = useState<any[]>([]);
  const [scheduleItems, setScheduleItems] = useState<any[]>([]);
  const [selectedWorship, setSelectedWorship] = useState('주일대예배 (1부)');

  // 🤫 비밀 관리자 진입: 푸터 5번 클릭
  const secretClickCount = useRef(0);
  const secretClickTimer = useRef<any>(null);
  const handleSecretClick = () => {
    secretClickCount.current++;
    if (secretClickTimer.current) clearTimeout(secretClickTimer.current);
    secretClickTimer.current = setTimeout(() => { secretClickCount.current = 0; }, 2000);
    if (secretClickCount.current >= 5) {
      secretClickCount.current = 0;
      window.location.href = '/admin';
    }
  };

  useEffect(() => {
    const sync = async () => {
      try {
        const res = await fetch(`/api/youtube-live?t=${Date.now()}`, { cache: 'no-store' });
        const data = await res.json();
        setIsLive(data.live);
        setLiveVideoId(data.videoId || null);
      } catch { setIsLive(false); }
    };
    sync();
    const timer = setInterval(sync, 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch('/api/content').then(r => r.json()).then(data => {
      if (data.success) {
        if (data.news?.length > 0) setNewsItems(data.news);
        if (data.sermons?.length > 0) setSermonItems(data.sermons);
        if (data.schedules?.length > 0) setScheduleItems(data.schedules);
        // DB에 예배순서가 있으면 WORSHIP_ORDERS를 덮어씀
        if (data.worshipOrders?.length > 0) {
          data.worshipOrders.forEach((wo: any) => {
            try { WORSHIP_ORDERS[wo.category] = { title: wo.title, groups: JSON.parse(wo.content) }; } catch {}
          });
        }
      }
    }).catch(() => {});
  }, []);

  const displayNews = newsItems.length > 0 ? newsItems : FALLBACK_NEWS;
  const displaySermons = sermonItems.length > 0 ? sermonItems : FALLBACK_SERMONS;
  const displaySchedules = scheduleItems.length > 0 ? scheduleItems : FALLBACK_SCHEDULES;
  const currentOrder = WORSHIP_ORDERS[selectedWorship];

  return (
    <div className={styles.mainContainer}>
      {/* ===== HEADER ===== */}
      <header className={styles.header}>
        <div className={styles.logo} onClick={() => setActiveSection('about')}>
          <img src="/church-logo.png" alt="거제반석교회" style={{ height: '44px', width: 'auto' }} />
        </div>
        <button className={styles.mobileMenuBtn} onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? '✕' : '☰'}
        </button>
        <nav className={`${styles.nav} ${menuOpen ? styles.navOpen : ''}`}>
          {NAV_ITEMS.map(item => (
            <button key={item.key}
              className={`${styles.navLink} ${activeSection === item.key ? styles.navLinkActive : ''}`}
              onClick={() => { setActiveSection(item.key); setMenuOpen(false); }}>
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      {/* 🔴 실시간 방송 배너 */}
      {isLive && (
        <div
          onClick={() => openPopup({ videoId: liveVideoId, title: '실시간 예배 방송', category: 'LIVE' })}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: '#D32F2F', color: 'white',
            padding: '12px 20px', cursor: 'pointer',
            fontWeight: 'bold', fontSize: '1.1rem',
            gap: '10px', zIndex: 9998, flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '0.8rem', color: '#FFEB3B', animation: 'fadeSlideIn 1s infinite' }}>● LIVE</span>
          <strong>생방송 예배 중: 클릭하여 시청</strong>
          <span style={{ fontSize: '0.9rem', border: '1px solid rgba(255,255,255,0.5)', padding: '2px 8px', borderRadius: '4px' }}>
            참여하기 ➔
          </span>
        </div>
      )}

      <main className={styles.contentArea}>
        {/* ── 교회소개 ── */}
        {activeSection === 'about' && (
          <section className={styles.heroSection}>
            <div className={styles.heroBg}><div className={styles.heroBgImage} /><div className={styles.heroOverlay} /></div>
            <div className={styles.heroContent}>
              <div className={styles.heroTagline}>그리스도의 살아있는 몸 된 공동체</div>
              <h1 className={styles.heroTitle}>
                <span className={styles.gold}>하나님의 손에 붙잡혀</span>
                <span className={styles.burgundy}>세상을 이기는 교회</span>
              </h1>
              <div className={styles.heroButtons}>
                <button onClick={() => setActiveSection('sermon')} className={styles.btnPrimary}>실시간 예배 참여하기</button>
                <button onClick={() => setActiveSection('vision')} className={styles.btnOutline}>비전과 사명 보기</button>
              </div>
            </div>
          </section>
        )}

        {/* ── 비전과 사명 ── */}
        {activeSection === 'vision' && (
          <section style={{ backgroundColor: '#FDFBF7', padding: '60px 20px', width: '100%', overflow: 'hidden' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

              {/* 1. 타이틀 영역 */}
              <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                <h1 style={{ color: '#5C3A40', fontSize: '3rem', fontWeight: 'bold', margin: '0 0 10px 0', fontFamily: "'Nanum Myeongjo', serif" }}>
                  Stand on Grace
                </h1>
                <p style={{ color: '#8C7A6B', fontSize: '1.2rem', margin: 0, fontWeight: 700 }}>
                  은혜 위에 서다 — 거제반석교회의 비전
                </p>
              </div>

              {/* 2. 메인 비전 영역 (좌측 웅장한 거대 나무 vs 우측 3대 핵심) */}
              <div style={{ display: 'flex', flexDirection: 'row', gap: '60px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '100px' }}>

                {/* 좌측: 나무 영역 (여백을 무시하고 강제로 줌인!) */}
                <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {/* div 배경으로 넣고 backgroundSize로 확 당김 */}
                  <div style={{
                    width: '100%', height: '450px',
                    backgroundImage: 'url("/vision/tree.png")',
                    backgroundSize: '180%',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    mixBlendMode: 'darken',
                  }} />
                  <p style={{ color: '#333', fontWeight: 'bold', marginTop: '20px', fontSize: '1.3rem' }}>
                    반석 위에 뿌리내린 나무
                  </p>
                </div>

                {/* 우측: UP / IN / OUT 카드 */}
                <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
                  {MINISTRY_CARDS.map((m, i) => (
                    <div key={i} style={{ backgroundColor: '#FFF', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', transition: 'transform 0.2s ease' }}>
                      <span style={{ backgroundColor: m.color, color: '#FFF', padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '15px' }}>{m.badge}</span>
                      <h3 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '1.3rem', fontWeight: 'bold' }}>{m.title}</h3>
                      <p style={{ margin: '0 0 15px 0', color: '#666', fontSize: '1rem', lineHeight: '1.6' }}>{m.desc}</p>
                      <span style={{ color: '#B7791F', fontSize: '0.9rem', fontWeight: 'bold' }}>{m.verse}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. 4대 지향점 영역 */}
              <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                <h2 style={{ color: '#5C3A40', fontSize: '2rem', margin: '0 0 40px 0', fontFamily: "'Nanum Myeongjo', serif" }}>반석교회 4대 지향점</h2>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
                  {PILLARS.map((p, i) => (
                    <div key={i} style={{ backgroundColor: '#FFF', padding: '35px 25px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', flex: '1 1 200px', maxWidth: '260px', textAlign: 'center' }}>
                      <img src={p.icon} alt={p.title} style={{ width: '80px', height: '80px', marginBottom: '20px', mixBlendMode: 'darken' }} />
                      <h4 style={{ color: '#5C3A40', margin: '0 0 15px 0', fontSize: '1.2rem', fontWeight: 'bold' }}>{p.title}</h4>
                      <p style={{ color: '#666', fontSize: '0.95rem', margin: 0, wordBreak: 'keep-all', lineHeight: '1.5' }}>{p.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. 하단 결론 영역 */}
              <div style={{ backgroundColor: '#F4ECE1', padding: '40px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '30px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <img src="/vision/stones.png" alt="반석" style={{ width: '80px', mixBlendMode: 'darken' }} />
                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#5C3A40', fontSize: '1.5rem', fontFamily: "'Nanum Myeongjo', serif" }}>반석 위에 세워진 교회</h3>
                  <p style={{ margin: '0 0 5px 0', color: '#555', lineHeight: '1.7' }}>예수 그리스도를 머릿돌 삼아, 말씀과 기도로 든든히 세워져 가는 공동체입니다.</p>
                  <p style={{ margin: 0, color: '#8C7A6B', fontStyle: 'italic', fontSize: '0.9rem' }}>마태복음 16:18 — &quot;내가 이 반석 위에 내 교회를 세우리니&quot;</p>
                </div>
              </div>

            </div>
          </section>
        )}

        {/* ── 설교말씀 ── */}
        {activeSection === 'sermon' && (
          <section style={{ backgroundColor: '#FDFBF7', padding: '60px 20px', width: '100%' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
              <h2 style={{ color: '#5C3A40', fontSize: '2rem', marginBottom: '40px', textAlign: 'center', fontFamily: "'Nanum Myeongjo', serif" }}>
                예배 다시보기
              </h2>

              {/* 실시간 방송 영역 */}
              <div style={{ marginBottom: '50px' }}>
                {isLive ? (
                  <div className={styles.sermonVideoWrap} style={isExpanded ? { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, background: '#000' } : {}}>
                    <iframe width="100%" height="100%"
                      src={liveVideoId ? `https://www.youtube.com/embed/${liveVideoId}?autoplay=1&mute=1` : `https://www.youtube.com/embed/live_stream?channel=UCc_eP0i4YwSQmQ9du5-RHbA&autoplay=1`}
                      frameBorder="0" allowFullScreen />
                    <button onClick={() => { setIsExpanded(!isExpanded); document.body.style.overflow = !isExpanded ? 'hidden' : ''; }}
                      style={{ position: 'absolute', bottom: 15, left: 15, background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
                      {isExpanded ? '🔲 작게보기' : '📱 크게보기'}
                    </button>
                  </div>
                ) : (
                  <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: '15px', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #172554, #1e3a5f)', padding: '2rem', gap: '0.8rem', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                    <div style={{ fontSize: '3rem' }}>✝️</div>
                    <h3 style={{ color: '#fff', margin: 0 }}>지금은 예배 시간이 아닙니다</h3>
                    <p style={{ color: '#bfdbfe', margin: 0 }}>예배 시간에 실시간 방송이 시작됩니다.</p>
                    <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.8rem 1.5rem', borderRadius: 12, color: '#fff' }}>📅 다음 예배: {getNextWorship()}</div>
                  </div>
                )}
              </div>

              {/* 이번 달 말씀 카드 */}
              {displaySermons.length > 0 && (
                <div style={{ marginBottom: '60px' }}>
                  <h3 style={{ borderLeft: '5px solid #5C3A40', paddingLeft: '15px', marginBottom: '20px', color: '#5C3A40', fontSize: '1.2rem' }}>
                    최근 설교 말씀
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px' }}>
                    {displaySermons.map((s: any) => (
                      <div key={s.id} style={{ backgroundColor: '#FFF', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 10px 20px rgba(0,0,0,0.05)', transition: 'transform 0.2s', cursor: 'pointer' }}
                        onClick={() => openPopup(s)}
                        onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-5px)')}
                        onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}>
                        {s.videoId ? (
                          <div style={{ width: '100%', aspectRatio: '16/9', backgroundColor: '#000' }}>
                            <img src={`https://img.youtube.com/vi/${s.videoId}/hqdefault.jpg`} alt={s.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ) : (
                          <div style={{ width: '100%', aspectRatio: '16/9', background: 'linear-gradient(135deg, #5C3A40, #8C6A70)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '2.5rem' }}>🎤</span>
                          </div>
                        )}
                        <div style={{ padding: '20px' }}>
                          <span style={{ backgroundColor: '#5C3A40', color: '#FFF', padding: '4px 10px', borderRadius: '5px', fontSize: '0.8rem' }}>{s.category}</span>
                          <h4 style={{ margin: '10px 0 5px', color: '#333', fontSize: '1rem' }}>{s.title}</h4>
                          <p style={{ color: '#666', fontSize: '0.85rem', margin: 0 }}>{s.content} | {s.date ? new Date(s.date).toLocaleDateString('ko-KR') : ''}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 유튜브 채널 바로가기 */}
              <div style={{ textAlign: 'center', marginTop: '30px' }}>
                <a href="https://www.youtube.com/@petros-church" target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 28px', backgroundColor: '#FF0000', color: '#FFF', borderRadius: '50px', fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none', boxShadow: '0 4px 12px rgba(255,0,0,0.3)', transition: 'all 0.2s' }}>
                  ▶ 유튜브에서 더 보기
                </a>
              </div>
            </div>
          </section>
        )}

        {/* ── 교회소식 ── */}
        {activeSection === 'news' && (
          <section className={styles.tabSection}>
            <h2 className={styles.sectionTitle}>반석교회 소식</h2>
            <div className={styles.newsGrid}>
              {displayNews.map((n: any, idx: number) => (
                <div key={n.id} className={styles.newsCard}>
                  <h3>{idx + 1}. {n.title}</h3>
                  <p style={{ whiteSpace: 'pre-line' }}>{n.content}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── 예배안내 ── */}
        {activeSection === 'schedule' && (
          <section className={styles.tabSection}>
            <h2 className={styles.sectionTitle}>예배 안내</h2>
            <div className={styles.scheduleWrap}>
              <div className={styles.scheduleTableWrap}>
                <table className={styles.scheduleTable}>
                  <tbody>
                    {displaySchedules.map((s: any) => (
                      <tr key={s.id}
                        className={`${styles.scheduleRowClickable} ${selectedWorship === s.title ? styles.scheduleRowActive : ''}`}
                        onClick={() => { if (WORSHIP_ORDERS[s.title]) setSelectedWorship(s.title); }}>
                        <th>{s.title}</th>
                        <td><span className={styles.time}>{s.time}</span></td>
                        <td>{s.place}</td>
                        <td>{s.officer}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className={styles.scheduleFooterVerse}>
                  <div style={{ fontSize: '2rem', opacity: 0.4 }}>✝</div>
                  <div style={{ fontFamily: "'Nanum Myeongjo', serif", fontSize: '0.95rem', color: 'var(--color-primary)', fontStyle: 'italic', opacity: 0.75, maxWidth: 380, lineHeight: 1.9 }}>
                    "예배드리는 자는 영과 진리로 예배드려야 하느니라"
                  </div>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--color-logo-gold)', fontWeight: 600 }}>— 요한복음 4:24</div>
                </div>
              </div>
              {currentOrder && (
                <div className={styles.orderServiceBox}>
                  <div className={styles.orderHeader}>{selectedWorship}</div>
                  <div className={styles.orderSub}>{currentOrder.title}</div>
                  <div className={styles.orderFade} key={selectedWorship}>
                    {currentOrder.groups.map((g: any, gi: number) => (
                      <div key={gi} className={styles.orderGroup}>
                        <div className={styles.orderGroupTitle}>{g.heading}</div>
                        {g.rows.map((r: any, ri: number) => (
                          <div key={ri} className={styles.orderRow}>
                            <span className={styles.orderMark}>•</span>
                            <span className={styles.orderLabel} style={r.bold ? { fontWeight: 800, color: 'var(--color-primary)' } : {}}>{r.label}</span>
                            <span className={styles.orderContent} style={r.bold ? { fontWeight: 700, color: '#333' } : {}}>{r.content}</span>
                            <span className={styles.orderResp}>{r.resp}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── 오시는 길 ── */}
        {activeSection === 'location' && (
          <section className={styles.tabSection}>
            <h2 className={styles.sectionTitle}>오시는 길</h2>
            <div className={styles.locationWrap}>
              <div className={styles.locationInfo}>
                <h3>대한예수교장로회<br />거제반석교회</h3>
                <div className={styles.infoItem}><span className={styles.infoLabel}>📍 주소</span><span>경상남도 거제시 연초면 소오비길 40-6</span></div>
                <div className={styles.infoItem}><span className={styles.infoLabel}>📞 문의</span><span>이주민 목사 (010.9825.5020)</span></div>
                <div className={styles.infoItem}><span className={styles.infoLabel}>🕐 예배</span><span>주일 오전 9시 / 11시, 수요 저녁 7:30, 금요 저녁 8시</span></div>
                <div className={styles.infoItem}><span className={styles.infoLabel}>🎥 유튜브</span><span><a href="https://www.youtube.com/@petros-church" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-logo-gold)', fontWeight: 600 }}>@petros-church</a></span></div>
              </div>
              <div className={styles.mapFrame}>
                <iframe
                  src="https://maps.google.com/maps?q=거제시%20연초면%20소오비길%2040-6&t=&z=15&ie=UTF8&iwloc=&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={true}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="거제반석교회 위치"
                />
              </div>
            </div>
          </section>
        )}
      </main>

      {/* 🎬 극장식 팝업 (모달) */}
      {popupVideo && (
        <div onClick={closePopup} style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.92)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 99999,
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '90%', maxWidth: '1000px', position: 'relative' }}>
            {/* 상단: 카테고리 + 제목 + 닫기 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#FFEB3B', border: '1px solid #FFEB3B', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>{popupVideo.category || '설교'}</span>
                <span style={{ color: 'white', fontSize: '1.2rem', fontWeight: 'bold' }}>{popupVideo.title}</span>
              </div>
              <button onClick={closePopup} style={{ background: 'none', border: 'none', color: 'white', fontSize: '2.5rem', cursor: 'pointer', padding: '0 10px', lineHeight: 1 }}>×</button>
            </div>
            {/* 유튜브 영상 */}
            <div style={{ width: '100%', aspectRatio: '16/9', backgroundColor: '#000', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
              <iframe width="100%" height="100%"
                src={popupVideo.videoId ? `https://www.youtube.com/embed/${popupVideo.videoId}?autoplay=1` : `https://www.youtube.com/embed/live_stream?channel=UCc_eP0i4YwSQmQ9du5-RHbA&autoplay=1`}
                title="YouTube video player" frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen />
            </div>
            {/* 하단 정보 */}
            {popupVideo.content && (
              <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '12px', fontSize: '0.9rem', textAlign: 'center' }}>{popupVideo.content}</p>
            )}
          </div>
        </div>
      )}

      {/* 🤫 푸터: 5번 빠르게 클릭하면 관리자 페이지로 이동 */}
      <footer className={styles.footer} onClick={handleSecretClick} style={{ cursor: 'default', userSelect: 'none' }}>
        <p>© 2026 대한예수교장로회 반석교회 · 거제시 연초면 소오비길 40-6</p>
      </footer>
    </div>
  );
}
