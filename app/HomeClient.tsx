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
  { emoji: '🪨', title: '견고한 반석', desc: '그리스도 위에 세워진 흔들리지 않는 신앙' },
  { emoji: '🙏', title: '변함없는 신실함', desc: '어떤 환경에서도 주님을 신뢰하는 믿음' },
  { emoji: '💪', title: '강건한 공동체', desc: '서로 사랑하고 세워주는 그리스도의 몸' },
  { emoji: '🌱', title: '다음 세대 세움', desc: '미래 세대에 신앙을 전수하는 교회' },
];

export default function HomeClient() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionKey>('about');
  const [isLive, setIsLive] = useState(false);
  const [liveVideoId, setLiveVideoId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

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
          <section className={styles.tabSection}>
            <div className={styles.vpHeader}>
              <h2 className={styles.vpTitle}>Stand on Grace</h2>
              <p className={styles.vpSubtitle}>은혜 위에 서다 — 거제반석교회의 비전</p>
            </div>
            <div className={styles.vpMinistryRow}>
              <div className={styles.vpTreeWrap}>
                <div style={{ fontSize: '8rem', lineHeight: 1 }}>🌳</div>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>반석 위에 뿌리내린 나무</p>
              </div>
              <div className={styles.vpMinistryCards}>
                {MINISTRY_CARDS.map((m, i) => (
                  <div key={i} className={styles.vpMCard}>
                    <span className={styles.vpMLabel} style={{ backgroundColor: m.color }}>{m.badge}</span>
                    <h4>{m.title}</h4>
                    <p>{m.desc}</p>
                    <span className={styles.vpMVerse}>{m.verse}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.vpPillarsSection}>
              <h3 className={styles.vpPillarsTitle}>반석교회 4대 지향점</h3>
              <div className={styles.vpPillarsGrid}>
                {PILLARS.map((p, i) => (
                  <div key={i} className={styles.vpPillarItem}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{p.emoji}</div>
                    <h4>{p.title}</h4>
                    <p>{p.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.vpVisionBanner}>
              <div className={styles.vpBannerImg}>
                <div style={{ fontSize: '5rem' }}>🪨</div>
              </div>
              <div className={styles.vpBannerText}>
                <h3>반석 위에 세워진 교회</h3>
                <p>예수 그리스도를 머릿돌 삼아, 말씀과 기도로 든든히 세워져 가는 공동체입니다.</p>
                <span className={styles.vpBannerVerse}>마태복음 16:18 — "내가 이 반석 위에 내 교회를 세우리니"</span>
              </div>
            </div>
          </section>
        )}

        {/* ── 설교말씀 ── */}
        {activeSection === 'sermon' && (
          <section className={styles.tabSection}>
            <h2 className={styles.sectionTitle}>설교 말씀</h2>
            <div className={styles.sermonContainer}>
              <div className={styles.sermonMain}>
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
                  <div className={styles.sermonVideoWrap} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #172554, #1e3a5f)', padding: '2rem', gap: '0.8rem' }}>
                    <div style={{ fontSize: '3rem' }}>✝️</div>
                    <h3 style={{ color: '#fff', margin: 0 }}>지금은 예배 시간이 아닙니다</h3>
                    <p style={{ color: '#bfdbfe', margin: 0 }}>예배 시간에 실시간 방송이 시작됩니다.</p>
                    <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.8rem 1.5rem', borderRadius: 12, color: '#fff' }}>📅 다음 예배: {getNextWorship()}</div>
                  </div>
                )}
              </div>
              <div className={styles.sermonGrid}>
                {displaySermons.map((s: any) => (
                  <div key={s.id} className={styles.sermonCard}>
                    <h4>{s.category}</h4>
                    <p>{s.title}</p>
                    <span className={styles.sermonMeta}>{s.content}</span>
                  </div>
                ))}
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
                <a href="https://map.kakao.com/?q=경상남도 거제시 연초면 소오비길 40-6" target="_blank" rel="noopener noreferrer" className={styles.mapPlaceholder}>
                  <span>🗺️</span><span>카카오맵에서 보기</span><span>거제시 연초면 소오비길 40-6</span>
                </a>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* 🤫 푸터: 5번 빠르게 클릭하면 관리자 페이지로 이동 */}
      <footer className={styles.footer} onClick={handleSecretClick} style={{ cursor: 'default', userSelect: 'none' }}>
        <p>© 2026 대한예수교장로회 반석교회 · 거제시 연초면 소오비길 40-6</p>
      </footer>
    </div>
  );
}
