// @ts-nocheck
'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  IconBulletin, IconSermonVideo, IconRadio, IconBibleQuiz,
  IconMyBible, IconNewcomer, IconNextGen, IconIeumdol,
  IconNarrowGate, IconCrossHill, IconArmory, IconValley,
  IconVanityFair, IconJoyMountain, IconPassport, IconMap,
  GoldIconCard
} from '@/app/components/GoldIcons';



// 유튜브 API 실패 시 사용할 폴백 데이터
const FALLBACK_SERMONS = [
  { id: 's1', videoId: '', title: '부활, 죽음을 이기는 하나님의 소망', category: '주일오전', date: '2026. 4. 19', gradient: 'linear-gradient(135deg, #701a75, #9f1239)', verse: '고전 15:1-10', summary: ["부활은 기독교 신앙의 핵심입니다.", "죽음의 권세를 이기신 예수님을 찬양합시다."] },
  { id: 's2', videoId: '', title: '다시 시작된 하나님의 인도', category: '수요예배', date: '2026. 4. 22', gradient: 'linear-gradient(135deg, #064e3b, #0f766e)', verse: '창 45:16-28', summary: ["요셉의 고난 뒤에 숨겨진 하나님의 계획.", "우리 삶을 인도하시는 섭리를 믿으십시오."] },
  { id: 's3', videoId: '', title: '모세를 부르신 하나님', category: '새벽기도', date: '2026. 4. 23', gradient: 'linear-gradient(135deg, #451a03, #78350f)', verse: '출 3:1-10', summary: ["자격 없는 자를 부르시는 은혜", "사명을 깨닫고 순종하는 삶"] },
];

// ━━━ 다음 예배 카운트다운 유틸 (초단위 정밀도) ━━━
const WORSHIP_SCHEDULE = [
  { day: 0, hour: 9, min: 0, name: '주일 1부 예배', duration: 90 },
  { day: 0, hour: 11, min: 0, name: '주일 2부 예배', duration: 90 },
  { day: 0, hour: 13, min: 50, name: '주일 오후 예배', duration: 60 },
  { day: 1, hour: 5, min: 30, name: '새벽기도', duration: 40 },
  { day: 2, hour: 5, min: 30, name: '새벽기도', duration: 40 },
  { day: 3, hour: 5, min: 30, name: '새벽기도', duration: 40 },
  { day: 3, hour: 19, min: 30, name: '수요 저녁 예배', duration: 60 },
  { day: 4, hour: 5, min: 30, name: '새벽기도', duration: 40 },
  { day: 5, hour: 5, min: 30, name: '새벽기도', duration: 40 },
  { day: 5, hour: 20, min: 0, name: '금요 기도회', duration: 60 },
  { day: 6, hour: 5, min: 30, name: '새벽기도', duration: 40 },
];

function getNextWorship(now: Date) {
  const currentDay = now.getDay();
  for (let offset = 0; offset <= 7; offset++) {
    const targetDay = (currentDay + offset) % 7;
    const candidates = WORSHIP_SCHEDULE
      .filter(w => w.day === targetDay)
      .sort((a, b) => a.hour * 60 + a.min - (b.hour * 60 + b.min));
    for (const w of candidates) {
      // 목표 시각 Date 객체 생성
      const target = new Date(now);
      target.setDate(target.getDate() + offset);
      target.setHours(w.hour, w.min, 0, 0);
      if (target.getTime() <= now.getTime()) continue; // 이미 지난 예배 스킵
      const diffMs = target.getTime() - now.getTime();
      const totalSec = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSec / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);
      const secs = totalSec % 60;
      const timeStr = `${String(w.hour).padStart(2, '0')}:${String(w.min).padStart(2, '0')}`;
      return { name: w.name, time: timeStr, hours, mins, secs, isToday: offset === 0, targetDate: target };
    }
  }
  return { name: '주일 1부 예배', time: '09:00', hours: 0, mins: 0, secs: 0, isToday: false, targetDate: new Date() };
}

export default function HomeClient() {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [activeVideoTitle, setActiveVideoTitle] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [fontSize, setFontSize] = useState(16);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('설교말씀');
  const [showBulletin, setShowBulletin] = useState(false);
  const [sermonPage, setSermonPage] = useState(0);
  const [bulletinData, setBulletinData] = useState<any>(null);
  const [newsItems, setNewsItems] = useState<any[]>([]);
  const [dbSchedules, setDbSchedules] = useState<any[]>([]);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [sermons, setSermons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [liveVideoId, setLiveVideoId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [nextWorship, setNextWorship] = useState(getNextWorship(new Date()));
  const [showFloatingBulletin, setShowFloatingBulletin] = useState(false);
  const [bulletinPos, setBulletinPos] = useState({ x: 0, y: 0 });
  const bulletinDragRef = useRef<{ dragging: boolean; offsetX: number; offsetY: number }>({ dragging: false, offsetX: 0, offsetY: 0 });
  const floatingBulletinRef = useRef<HTMLDivElement>(null);

  // 📄 플로팅 주보 드래그 핸들러 (화면 경계 제한)
  const handleBulletinDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const el = floatingBulletinRef.current;
    if (!el) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const rect = el.getBoundingClientRect();
    bulletinDragRef.current = { dragging: true, offsetX: clientX - rect.left, offsetY: clientY - rect.top };
    e.preventDefault();
  };
  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!bulletinDragRef.current.dragging) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const el = floatingBulletinRef.current;
      if (!el) return;
      const w = el.offsetWidth, h = el.offsetHeight;
      const maxX = window.innerWidth - w, maxY = window.innerHeight - h;
      const newX = Math.max(0, Math.min(clientX - bulletinDragRef.current.offsetX, maxX));
      const newY = Math.max(0, Math.min(clientY - bulletinDragRef.current.offsetY, maxY));
      setBulletinPos({ x: newX, y: newY });
    };
    const handleEnd = () => { bulletinDragRef.current.dragging = false; };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleEnd); window.removeEventListener('touchmove', handleMove); window.removeEventListener('touchend', handleEnd); };
  }, []);

  // 🤫 비밀 관리자 진입: 푸터 5번 클릭
  const secretClickCount = useRef(0);
  const secretClickTimer = useRef<any>(null);
  const handleSecretClick = () => {
    secretClickCount.current++;
    if (secretClickTimer.current) clearTimeout(secretClickTimer.current);
    secretClickTimer.current = setTimeout(() => { secretClickCount.current = 0; }, 2000);
    if (secretClickCount.current >= 5) { secretClickCount.current = 0; window.location.href = '/admin'; }
  };

  // 🚀 유튜브 영상 자동 로딩 (1시간 캐싱 + 서버 API 경유)
  useEffect(() => {
    const CACHE_KEY = 'banseok_youtube_cache';
    const CACHE_TIME_KEY = 'banseok_youtube_cache_time';
    const CACHE_EXPIRY = 60 * 60 * 1000; // 1시간

    // 1. 캐시 확인 (1시간 이내면 API 호출 안 함)
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
      if (cachedData && cachedTime && (Date.now() - parseInt(cachedTime) < CACHE_EXPIRY)) {
        setSermons(JSON.parse(cachedData));
        setIsLoading(false);
        return;
      }
    } catch { /* localStorage 접근 실패 시 무시 */ }

    // 2. 서버 API로 새 데이터 요청
    fetch('/api/youtube-videos').then(r => r.json()).then(data => {
      if (data.success && data.videos?.length > 0) {
        setSermons(data.videos);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(data.videos));
          localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
        } catch { /* 저장 실패 무시 */ }
      } else {
        setSermons(FALLBACK_SERMONS);
      }
      setIsLoading(false);
    }).catch(() => {
      // 에러 시 기존 캐시라도 사용
      try {
        const old = localStorage.getItem(CACHE_KEY);
        if (old) { setSermons(JSON.parse(old)); setIsLoading(false); return; }
      } catch { }
      setSermons(FALLBACK_SERMONS);
      setIsLoading(false);
    });
  }, []);

  // 🏅 챗봇 허브 → 글꼴/다크모드 글로벌 이벤트 수신
  useEffect(() => {
    const handleFont = (e: Event) => {
      const dir = (e as CustomEvent).detail;
      setFontSize(prev => dir === 'up' ? Math.min(prev + 0.15, 2.5) : Math.max(prev - 0.15, 0.8));
    };
    const handleDark = () => setIsDarkMode(prev => !prev);
    window.addEventListener('banseok:font', handleFont);
    window.addEventListener('banseok:darkmode', handleDark);
    return () => {
      window.removeEventListener('banseok:font', handleFont);
      window.removeEventListener('banseok:darkmode', handleDark);
    };
  }, []);

  // 🔴 실시간 방송 감지 (예배시간: 60초 / 평소: 5분)
  useEffect(() => {
    let timer: any;
    const sync = async () => {
      try {
        const res = await fetch(`/api/youtube-live?t=${Date.now()}`, { cache: 'no-store' });
        const data = await res.json();
        setIsLive(data.live); setLiveVideoId(data.videoId || null);
        // 서버가 알려주는 예배 시간 여부에 따라 폴링 주기 조절
        const nextInterval = data.isWorshipTime ? 60000 : 300000; // 60초 vs 5분
        if (timer) clearTimeout(timer);
        timer = setTimeout(sync, nextInterval);
      } catch {
        setIsLive(false);
        timer = setTimeout(sync, 300000); // 에러 시 5분 후 재시도
      }
    };
    sync();
    return () => { if (timer) clearTimeout(timer); };
  }, []);

  const filteredSermons = activeFilter
    ? sermons.filter(s => s.category.includes(activeFilter) && s.title.includes(searchTerm))
    : [];

  // 설교 제목 파싱 ("20260419 주일오전(1) - 제목" → 날짜/예배명/제목 분리)
  const parseTitle = (title: string) => {
    // 패턴: 날짜 예배종류 - 제목
    const match = title.match(/^(\d{4,8})\s*(.+?)\s*[-–]\s*(.+)$/);
    if (match) {
      const rawDate = match[1];
      const worship = match[2].trim();
      const sermonTitle = match[3].trim();
      // 날짜 포맷 (20260419 → 2026.04.19)
      let formatted = rawDate;
      if (rawDate.length === 8) {
        formatted = `${rawDate.slice(0, 4)}.${rawDate.slice(4, 6)}.${rawDate.slice(6, 8)}`;
      }
      return { date: formatted, worship, sermonTitle };
    }
    return { date: '', worship: '', sermonTitle: title };
  };

  // 📋 주보 + 교회소식 + 예배안내 DB 로딩
  useEffect(() => {
    fetch('/api/admin/bulletin', { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.bulletin) setBulletinData(data.bulletin);
      })
      .catch(e => console.error('주보 로딩 실패:', e));

    fetch('/api/content', { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          if (data.news?.length > 0) setNewsItems(data.news);
          if (data.schedules?.length > 0) setDbSchedules(data.schedules);
        }
      })
      .catch(e => console.error('콘텐츠 로딩 실패:', e));
  }, []);

  useEffect(() => {
    setIsMounted(true);
    // ⏱️ Zero-Cost JavaScript 카운트다운 타이머 (매초 갱신)
    const timer = setInterval(() => {
      setNextWorship(getNextWorship(new Date()));
    }, 1000); // 🚨 1초마다 틱
    return () => clearInterval(timer);
  }, []);
  // 디자인이 적용되기 전(isMounted가 false)에는 깜빡이는 쌩얼 대신 깔끔한 배경색만 보여줌
  if (!isMounted) return <div style={{ minHeight: '100vh', backgroundColor: '#FDFBF7' }} />;

  return (
    <div className={`pw ${isDarkMode ? 'dk' : 'lt'}`}>
      {/* 교회 헤더 메뉴 */}
      <header className="ch-header">
        <div className="ch-logo">
          <img src="/church-logo.png" alt="반석교회" className="ch-logo-img" />
        </div>
        <nav className={`ch-nav ${showMobileMenu ? 'ch-nav-open' : ''}`}>
          {['교회소개', '비전과사명', '설교말씀', '교회소식', '예배안내', '오시는길'].map(tab => (
            <button key={tab} className={`ch-nav-link ${activeTab === tab ? 'ch-nav-active' : ''}`} onClick={() => { setActiveTab(tab); setShowMobileMenu(false); }}>{tab}</button>
          ))}
          <Link href="/pilgrim" style={{ fontWeight: 'bold', color: '#D97706', textDecoration: 'none', marginLeft: '15px', whiteSpace: 'nowrap' }}>
            🗺️ 영적 순례길
          </Link>
        </nav>
        <button className="ch-hamburger" onClick={() => setShowMobileMenu(!showMobileMenu)}>{showMobileMenu ? '✕' : '☰'}</button>
      </header>


      {/* ━━━ 시스템 컨트롤 — 왼쪽 고정 (fixed) ━━━ */}
      <div className="sys-ctrl">
        <button onClick={() => { setFontSize(prev => { const next = Math.min(prev + 2, 24); document.documentElement.style.fontSize = next + 'px'; return next; }); }} className="sys-btn" aria-label="글자 크게">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 19L10.2 5h3.6L19 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M7.5 14h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M19 5h3M20.5 3.5v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
        </button>
        <button onClick={() => { setFontSize(prev => { const next = Math.max(prev - 2, 12); document.documentElement.style.fontSize = next + 'px'; return next; }); }} className="sys-btn" aria-label="글자 작게">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 19L10.2 5h3.6L19 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M7.5 14h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M18 5h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
        </button>
        <button onClick={() => setIsDarkMode(!isDarkMode)} className="sys-btn sys-dark" aria-label="다크모드">
          {isDarkMode ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.8" /><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          )}
        </button>
      </div>

      <div className="ct">
        {/* 📺 VOD 인라인 플레이어 */}
        {activeVideo ? (
          <div className="live-section">
            <div className="live-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#FBBF24' }}>▶</span><strong style={{ fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70vw' }}>{activeVideoTitle || '영상 재생 중'}</strong>
              </div>
              {activeVideo && (
                <button onClick={() => { setActiveVideo(null); setActiveVideoTitle(''); }} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', padding: '6px 14px', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem', flexShrink: 0 }}>✕ 닫기</button>
              )}
            </div>
            <div className="live-player-wrap">
              <iframe
                src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1&mute=0&rel=0&modestbranding=1`}
                title={activeVideoTitle || '예배 방송'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="live-player"
              />
            </div>
            {activeVideo && (
              <div style={{ display: 'flex', gap: '8px', padding: '10px 16px', background: 'rgba(15,23,42,0.8)' }}>
                <button onClick={() => { if (navigator.share) navigator.share({ title: activeVideoTitle, url: `https://www.youtube.com/watch?v=${activeVideo}` }); }} style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>📤 말씀 공유</button>
                <a href={`https://www.youtube.com/watch?v=${activeVideo}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: '10px', background: '#FF0000', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 700, textAlign: 'center', textDecoration: 'none', fontSize: '0.85rem' }}>▶ 유튜브에서 보기</a>
              </div>
            )}
          </div>
        ) : null}

        {/* ===== 교회소개 탭 ===== */}
        {activeTab === '교회소개' && (
          <div className="tab-content about-hero">
            <div className="about-bg"></div>
            <div className="about-content">
              <div className="about-tagline">그리스도를 사랑하는 모든 공동체</div>
              <h1 className="about-title">
                <span className="about-gold">하나님의 손에 붙잡혀</span>
                <span className="about-burgundy">세상을 이기는 교회</span>
              </h1>
              <div className="about-buttons">
                <button onClick={() => setActiveTab('설교말씀')} className="about-btn-primary">다시가는 예배 참여하기</button>
                <button onClick={() => setActiveTab('비전과사명')} className="about-btn-outline">비전과 사명 보기</button>
              </div>
            </div>
          </div>
        )}

        {/* ===== 비전과사명 탭 ===== */}
        {activeTab === '비전과사명' && (
          <div className="tab-content">
            <div className="vm-page">
              {/* 헤더 */}
              <div className="vm-header">
                <span className="vm-sub">거제반석교회 비전과 사명</span>
                <h2 className="vm-title">비전과 사명</h2>
                <p className="vm-verse">Stand on Grace!!</p>
                <div className="vm-divider"></div>
              </div>

              {/* Z-패턴 아이템 1: 포도 (좌 이미지 — 우 텍스트) */}
              <div className="vm-row">
                <div className="vm-img-wrap">
                  <div className="vm-glow"></div>
                  <img src="/assets/vision/grapes.png" alt="생수가 가득한 교회" className="vm-img" />
                </div>
                <div className="vm-text">
                  <span className="vm-num">01</span>
                  <span className="vm-tag">RESTORATION</span>
                  <h3 className="vm-item-title">회복의 공동체</h3>
                  <p className="vm-desc">생수로 다시 채워지는 은혜의 포도나무 — 세상의 가치가 아닌 성령의 능력으로만 가능한 생명에 집중합니다.</p>
                </div>
              </div>

              {/* Z-패턴 아이템 2: 성전 (우 이미지 — 좌 텍스트) */}
              <div className="vm-row vm-row-reverse">
                <div className="vm-img-wrap">
                  <div className="vm-glow"></div>
                  <img src="/assets/vision/temple.png" alt="거제반석교회 성전" className="vm-img" />
                </div>
                <div className="vm-text">
                  <span className="vm-num">02</span>
                  <span className="vm-tag">WORSHIP</span>
                  <h3 className="vm-item-title">예배의 공동체</h3>
                  <p className="vm-desc">진리와 영으로 드려지는 거룩한 성전 — 하나님의 절대주권 아래 예수님을 머리로 삼고 순종하는 감격의 신앙입니다.</p>
                </div>
              </div>

              {/* Z-패턴 아이템 3: 생명나무 (좌 이미지 — 우 텍스트) */}
              <div className="vm-row">
                <div className="vm-img-wrap">
                  <div className="vm-glow"></div>
                  <img src="/assets/vision/tree.png" alt="목회 철학" className="vm-img" />
                </div>
                <div className="vm-text">
                  <span className="vm-num">03</span>
                  <span className="vm-tag">LIFE</span>
                  <h3 className="vm-item-title">생명의 공동체</h3>
                  <p className="vm-desc">다시 채우는 생수, 생명나무의 뿌리 — 오직 예수와 성경을 기준으로 삼는 순전한 신앙의 기초입니다.</p>
                </div>
              </div>

              {/* 4대 비전 글래스 카드 */}
              <div className="vm-glass-grid">
                <div className="vm-glass"><div className="vm-glass-icon">💎</div><h4 className="vm-glass-title">단단한 교회</h4><p className="vm-glass-desc">하나님의 진리로 순전해지며</p></div>
                <div className="vm-glass"><div className="vm-glass-icon">🛡️</div><h4 className="vm-glass-title">강건한 교회</h4><p className="vm-glass-desc">예수의 생명력으로 세상을 이김</p></div>
                <div className="vm-glass"><div className="vm-glass-icon">🏛️</div><h4 className="vm-glass-title">세우는 교회</h4><p className="vm-glass-desc">다음 세대를 리더로 키우고</p></div>
                <div className="vm-glass"><div className="vm-glass-icon">⚓</div><h4 className="vm-glass-title">굳건한 교회</h4><p className="vm-glass-desc">모든 영역에 하나님 나라를 확장함</p></div>
              </div>

              {/* 물맷돌 배너 */}
              <div className="vm-stone">
                <img src="/vision/stone-hand.png" alt="물맷돌" className="vm-stone-img" />
                <div className="vm-stone-text">
                  <h3>하나님의 손에 붙잡힌 매끄러운 돌</h3>
                  <p>다윗의 물맷돌처럼 성도 각 사람이 하나님의 도구가 되어 세상을 이기는 비전입니다.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== 설교말씀 탭 ===== */}
        {activeTab === '설교말씀' && (<>
          {/* 히어로: 활성 영상이 없을 때만 표시 */}
          {!activeVideo && (
            <div className="hero" style={{ background: 'linear-gradient(135deg, #1E1F30, #2a1a2e)', padding: '35px 20px', borderRadius: '20px' }}>
              {isLive && liveVideoId ? (
                <>
                  <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>✝️</div>
                  <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#E8D5C4', marginBottom: '16px' }}>온라인 예배</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', marginBottom: '15px' }}>
                    <span className="live-blink" style={{ fontSize: '1rem', color: '#FF4444' }}>● LIVE</span>
                    <strong style={{ color: '#E8D5C4', fontSize: '1.2rem' }}>생방송 예배가 진행 중입니다</strong>
                  </div>
                  <div className="live-player-wrap" style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '15px' }}>
                    <iframe
                      src={`https://www.youtube.com/embed/${liveVideoId}?autoplay=1&mute=0&rel=0&modestbranding=1`}
                      title="예배 생방송"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="live-player"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => { setShowFloatingBulletin(true); setBulletinPos({ x: Math.min(window.innerWidth - 340, window.innerWidth - 20), y: 80 }); }} style={{ padding: '10px 24px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', color: '#E8D5C4', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>📄 주보 보기</button>
                    <a href={`https://www.youtube.com/watch?v=${liveVideoId}`} target="_blank" rel="noopener noreferrer" style={{ padding: '10px 24px', background: '#FF0000', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 700, textAlign: 'center', textDecoration: 'none', fontSize: '0.85rem' }}>▶ 유튜브에서 보기</a>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>✝️</div>
                  <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#E8D5C4', marginBottom: '16px' }}>온라인 예배</h3>
              <div style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '10px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem' }}>다음 예배는</span>
                  <span style={{
                    fontSize: '1.35rem', fontWeight: 900, color: '#FBBF24',
                    background: 'rgba(251,191,36,0.12)', padding: '4px 16px', borderRadius: '24px',
                    letterSpacing: '0.02em',
                  }}>{nextWorship.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', justifyContent: 'center' }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffffff', fontFamily: "'Outfit', monospace", letterSpacing: '0.05em' }}>{nextWorship.time}</span>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>입니다</span>
                </div>
                {/* ⏱️ 초단위 카운트다운 타이머 */}
                <div style={{
                  marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                  fontFamily: "'Outfit', monospace", fontSize: '1.05rem', color: '#c19c72', fontWeight: 700,
                }}>
                  <span style={{ background: 'rgba(193,156,114,0.12)', padding: '4px 10px', borderRadius: '8px', minWidth: '36px', textAlign: 'center' }}>{String(nextWorship.hours).padStart(2, '0')}</span>
                  <span style={{ color: 'rgba(255,255,255,0.3)' }}>:</span>
                  <span style={{ background: 'rgba(193,156,114,0.12)', padding: '4px 10px', borderRadius: '8px', minWidth: '36px', textAlign: 'center' }}>{String(nextWorship.mins).padStart(2, '0')}</span>
                  <span style={{ color: 'rgba(255,255,255,0.3)' }}>:</span>
                  <span style={{ background: 'rgba(193,156,114,0.12)', padding: '4px 10px', borderRadius: '8px', minWidth: '36px', textAlign: 'center' }}>{String(nextWorship.secs).padStart(2, '0')}</span>
                  <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem', marginLeft: '6px' }}>후</span>
                </div>
              </div>
              <button className="bb" onClick={() => setShowBulletin(true)} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#E8D5C4', padding: '12px 28px', borderRadius: '30px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s' }}>📄 이번 주 스마트 주보 보기</button>
                </>
              )}
            </div>
          )}
          {/* 카테고리 필터 — '전체' 제거, 버튼명 변경 */}
          <div className="fa"><div className="fb">
            {[{ key: '주일오전', label: '주일예배 보기' }, { key: '수요예배', label: '수요예배 보기' }, { key: '새벽기도', label: '새벽기도 보기' }].map(tag => (
              <button key={tag.key} onClick={() => setActiveFilter(activeFilter === tag.key ? null : tag.key)} className={`ftb ${activeFilter === tag.key ? 'act' : ''}`}>{tag.label}</button>
            ))}
          </div></div>
          <div className="cd">
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '50px', fontWeight: 'bold' }}>📡 유튜브에서 최신 은혜의 말씀을 불러오는 중입니다...</div>
            ) : !activeFilter ? (
              /* 미선택 시 안내 — 한 줄 텍스트만 */
              <div style={{ textAlign: 'center', padding: '30px 20px' }}>
                <p style={{ fontSize: '1rem', color: '#94A3B8', fontWeight: '600', margin: 0 }}>원하시는 예배를 선택하여 시청해 주세요.</p>
              </div>
            ) : filteredSermons.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px', color: '#94A3B8' }}>해당 카테고리 설교 영상이 아직 없습니다.</div>
            ) : (
              /* 카드 그리드 — 텍스트 줄바꿈 + 중앙 정렬 */
              <div className="ll">
                {filteredSermons.map(s => {
                  const parsed = parseTitle(s.title);
                  return (
                    <div key={s.id} onClick={() => { if (s.videoId) { setActiveVideo(s.videoId); setActiveVideoTitle(parsed.sermonTitle || s.title); window.scrollTo({ top: 0, behavior: 'smooth' }); } }} className="lc" style={{ background: s.gradient, cursor: s.videoId ? 'pointer' : 'default', border: activeVideo === s.videoId ? '3px solid #FBBF24' : 'none' }}>
                      <div className="lh" style={{ flexDirection: 'column', gap: '8px', padding: '35px 25px' }}>
                        {parsed.date && <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', fontWeight: '500', letterSpacing: '0.05em' }}>{parsed.date}</div>}
                        {parsed.worship && <div style={{ color: '#FBBF24', fontSize: '0.9rem', fontWeight: '700', padding: '4px 14px', background: 'rgba(0,0,0,0.25)', borderRadius: '20px', display: 'inline-block' }}>{parsed.worship}</div>}
                        <h3 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold', lineHeight: '1.4', wordBreak: 'keep-all', margin: '5px 0' }}>"{parsed.sermonTitle}"</h3>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {/* 다시 채우는 생수 → 서몬 VOD 위로 이동 */}
          {!isLoading && sermons.length > 0 && (() => {
            const perPage = 5;
            const totalPages = Math.ceil(sermons.length / perPage);
            const pagedSermons = sermons.slice(sermonPage * perPage, (sermonPage + 1) * perPage);
            return (
              <div className="arc">
                <h2 className="arc-t">💧 다시 채우는 생수</h2>
                <p className="arc-s">최근 은혜로운 말씀 모음</p>
                <div className="smb">
                  <div className="mhb">최신 설교 영상 <span>▲</span></div>
                  {pagedSermons.map(s => {
                    const p = parseTitle(s.title);
                    return (
                      <div key={s.id} className="sr" onClick={() => { if (s.videoId) { setActiveVideo(s.videoId); setActiveVideoTitle(p.sermonTitle || s.title); window.scrollTo({ top: 0, behavior: 'smooth' }); } }} style={{ cursor: 'pointer', background: activeVideo === s.videoId ? 'rgba(251,191,36,0.08)' : undefined, borderLeft: activeVideo === s.videoId ? '3px solid #FBBF24' : undefined }}>
                        <span className="rb" style={{ background: s.category === '주일오전' ? '#9f1239' : s.category === '수요예배' ? '#0f766e' : '#475569' }}>{s.category}</span>
                        <span className="rt">{p.sermonTitle || s.title}</span>
                        <span style={{ fontSize: '0.8rem', color: '#888', marginRight: '10px' }}>{s.date}</span>
                        <button className="rbt">{activeVideo === s.videoId ? '재생중' : '재생'}</button>
                      </div>
                    );
                  })}
                </div>
                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '15px', flexWrap: 'wrap' }}>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button key={i} onClick={() => setSermonPage(i)} style={{
                        width: '36px', height: '36px', borderRadius: '50%', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem', transition: 'all 0.2s',
                        background: sermonPage === i ? '#5b272f' : 'rgba(91,39,47,0.08)',
                        color: sermonPage === i ? 'white' : '#5b272f',
                        boxShadow: sermonPage === i ? '0 4px 12px rgba(91,39,47,0.25)' : 'none',
                      }}>{i + 1}</button>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </>)}

        {/* ===== 교회소식 탭 (바둑판 그리드) ===== */}
        {activeTab === '교회소식' && (
          <div className="tab-content">
            <div className="hero"><h3 style={{ fontSize: '1.6rem', fontWeight: 'bold' }}>📢 반석교회 소식</h3></div>
            {(() => {
              // 모든 소식을 개별 항목으로 분리 → 바둑판 그리드
              const allItems: string[] = [];
              newsItems.forEach((n: any) => {
                const text = (n.content || '').trim();
                // 줄바꾼으로 분리
                const lines = text.split(/\n/).map((l: string) => l.trim()).filter((l: string) => l.length > 0);
                lines.forEach((line: string) => {
                  // 번호 접두사 제거 (1. 2) 3- 등)
                  const cleaned = line.replace(/^\s*\d+[\.)\-\s]+/, '').trim();
                  if (cleaned.length > 0) allItems.push(cleaned);
                });
              });
              // 중복 제거
              const unique = allItems.filter((item, idx, arr) => arr.indexOf(item) === idx);
              return unique.length > 0 ? (
                <div className="news-grid-box">
                  {unique.map((item, idx) => (
                    <div key={idx} className="news-box">
                      <p className="news-box-text"><strong>{idx + 1}.</strong> {item}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '50px 20px', color: '#94A3B8' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '15px', opacity: 0.4 }}>📢</div>
                  <p style={{ fontSize: '1.05rem', fontWeight: '600' }}>아직 등록된 교회 소식이 없습니다.</p>
                  <p style={{ fontSize: '0.9rem', marginTop: '8px' }}>관리자가 소식을 등록하면 자동으로 표시됩니다.</p>
                </div>
              );
            })()}
          </div>
        )}

        {/* ===== 예배안내 탭 ===== */}
        {activeTab === '예배안내' && (
          <div className="tab-content">
            <div className="hero"><h3 style={{ fontSize: '1.6rem', fontWeight: 'bold' }}>🙏 예배안내</h3></div>
            <div className="worship-wrap">
              <div className="worship-table-wrap">
                <table className="schedule-tbl"><tbody>
                  {(dbSchedules.length > 0 ? dbSchedules : [
                    { title: '주일예배 (1부)', time: '오전 09:00', place: '2층 본당', officer: '이주민 목사' },
                    { title: '주일예배 (2부)', time: '오전 11:00', place: '2층 본당', officer: '이주민 목사' },
                    { title: '주일오후예배', time: '오후 01:50', place: '2층 본당', officer: '이주민 목사' },
                    { title: '청소년 예배', time: '오전 10:00', place: '3층 교육관', officer: '김민정 전도사' },
                    { title: '어린이 예배', time: '오전 11:00', place: '3층 교육관', officer: '김민정 전도사' },
                    { title: '수요 저녁예배', time: '오후 07:30', place: '2층 본당', officer: '이주민 목사' },
                    { title: '금요기도회', time: '오후 08:00', place: '2층 본당', officer: '이주민 목사' },
                    { title: '새벽예배', time: '오전 05:30', place: '2층 본당', officer: '이주민 목사' },
                  ]).map((s: any, i: number) => (
                    <tr key={s.id || i} className="worship-row"><th>{s.title}</th><td><span className="sch-time">{s.time}</span></td><td>{s.place}</td><td>{s.officer}</td></tr>
                  ))}
                </tbody></table>
                <div className="worship-verse">
                  <div style={{ fontSize: '2rem', opacity: 0.4 }}>✝️</div>
                  <div style={{ fontFamily: "'Nanum Myeongjo',serif", fontSize: '0.95rem', color: '#5b272f', fontStyle: 'italic', opacity: 0.75, maxWidth: 380, lineHeight: 1.9 }}>"예배드리려 하거든 신령과 진리로 예배드려야 하느니라"</div>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#c19c72', fontWeight: 600 }}>요한복음 4:24</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== 오시는길 탭 (정적 이미지 — 클릭 요소 없음) ===== */}
        {activeTab === '오시는길' && (
          <div className="tab-content">
            <div className="hero"><h3 style={{ fontSize: '1.6rem', fontWeight: 'bold' }}>📍 오시는 길</h3></div>
            <div className="location-wrap">
              <div className="location-info">
                <h3 style={{ fontFamily: "'Nanum Myeongjo',serif", fontSize: '1.6rem', color: '#5b272f', marginBottom: '2rem', lineHeight: 1.3 }}>대한예수교장로회<br />거제반석교회</h3>
                <div className="loc-item"><span className="loc-label">🏠 주소</span><span>경상남도 거제시 연초면 소오비길 40-6</span></div>
                <div className="loc-item"><span className="loc-label">📞 문의</span><span>이주민 목사 (010.9825.5020)</span></div>
                <div className="loc-item"><span className="loc-label">⏰ 예배</span><span>주일 오전 9시 / 11시, 수요 오후 7:30, 금요 오후 8시</span></div>
                <div className="loc-item"><span className="loc-label">📺 유튜브</span><span style={{ color: '#c19c72', fontWeight: 600 }}>@petros-church</span></div>
              </div>
              {/* 📍 교회 위치 지도 — 바로 보이는 깔끔한 지도 */}
              <div style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', border: '1px solid #e8ddd0' }}>
                <iframe
                  src="https://maps.google.com/maps?q=반석교회+거제시+연초면+소오비길+40-6&t=&z=16&ie=UTF8&iwloc=&output=embed"
                  style={{ width: '100%', height: '350px', border: 'none' }}
                  allowFullScreen
                  loading="lazy"
                  title="반석교회 위치"
                />
                <div style={{ padding: '12px 18px', background: isDarkMode ? '#1E293B' : '#FDFBF7', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 10px', fontSize: '0.9rem', fontWeight: 600, color: isDarkMode ? '#e0d5c8' : '#5b272f' }}>📍 경상남도 거제시 연초면 소오비길 40-6</p>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <a href="https://map.kakao.com/link/to/반석교회,34.9099,128.6472" target="_blank" rel="noopener noreferrer"
                      style={{ padding: '10px 18px', background: '#FEE500', color: '#3C1E1E', borderRadius: '12px', textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}>
                      🚗 카카오내비
                    </a>
                    <a href={`nmap://navigation?dlat=34.9099&dlng=128.6472&dname=${encodeURIComponent('반석교회')}&appname=banseok`}
                      style={{ padding: '10px 18px', background: '#1EC800', color: 'white', borderRadius: '12px', textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}>
                      🧭 네이버내비
                    </a>
                    <a href={`tmap://route?goalname=${encodeURIComponent('반석교회')}&goaly=34.9099&goalx=128.6472`}
                      style={{ padding: '10px 18px', background: '#1A73E8', color: 'white', borderRadius: '12px', textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}>
                      🚙 T맵
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* 바로가기/영적순례길 → Banseok Chatbot Hub로 이동 */}

      </div>

      {/* 스마트 주보 모달 */}
      {showBulletin && (
        <div className="mbg" onClick={() => setShowBulletin(false)}>
          <div className="bm" onClick={e => e.stopPropagation()} style={{ padding: '30px', maxHeight: '85vh', overflowY: 'auto' }}>
            {bulletinData ? (
              <>
                <h2 style={{ fontSize: '1.4rem', color: '#5b272f', textAlign: 'center', marginBottom: '5px', marginTop: '0' }}>{bulletinData.worshipType || '주일 예배 순서'}</h2>
                <div style={{ textAlign: 'center', color: '#888', marginBottom: '20px', fontSize: '0.9rem' }}>{bulletinData.date}</div>

                {bulletinData.worshipOrder && bulletinData.worshipOrder.length > 0 ? (
                  bulletinData.worshipOrder.map((order: any, idx: number) => (
                    <div className="br" key={idx}>
                      <span style={{ fontWeight: 'bold', color: '#444' }}>{order.item}</span>
                      <span style={{ textAlign: 'right', flex: 1, marginLeft: '10px' }}>{order.detail}</span>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>예배 순서 정보가 없습니다.</div>
                )}

                {bulletinData.announcements && bulletinData.announcements.length > 0 && (
                  <>
                    <h3 style={{ fontSize: '1.1rem', color: '#5b272f', marginTop: '25px', marginBottom: '10px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>교회 소식</h3>
                    <ul style={{ paddingLeft: '20px', fontSize: '0.9rem', color: '#444', lineHeight: '1.6', margin: 0 }}>
                      {bulletinData.announcements.map((ann: string, idx: number) => (
                        <li key={idx} style={{ marginBottom: '8px' }}>{ann}</li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                <div style={{ marginBottom: '10px', fontSize: '2rem' }}>📄</div>
                아직 이번 주 주보가 등록되지 않았습니다.
              </div>
            )}
            <button className="clb" onClick={() => setShowBulletin(false)} style={{ background: '#f5f0eb', color: '#5b272f' }}>닫기</button>
          </div>
        </div>
      )}

      {/* 지도 모달 (정적 이미지 — 클릭 요소 없음) */}
      {showMapModal && (
        <div className="mbg" onClick={() => setShowMapModal(false)}>
          <div className="mm" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', width: '90vw', padding: '0', borderRadius: '20px', overflow: 'hidden' }}>
            <div style={{ padding: '20px 20px 12px', background: 'white' }}>
              <h3 style={{ margin: '0 0 4px', color: '#5b272f', fontSize: '1.15rem' }}>📍 오시는 길 안내</h3>
            </div>
            <img src="/assets/map-image.png" alt="거제반석교회 위치" style={{ width: '100%', display: 'block', objectFit: 'cover' }} draggable={false} />
            <div style={{ padding: '14px 20px', background: 'white', textAlign: 'center' }}>
              <p style={{ margin: '0 0 12px', fontSize: '0.88rem', fontWeight: 600, color: '#5b272f' }}>📍 경상남도 거제시 연초면 소오비길 40-6</p>
              <button className="clb" onClick={() => setShowMapModal(false)} style={{ width: '100%', padding: '12px', background: '#f5f0eb', border: 'none', borderRadius: '12px', fontWeight: 700, color: '#5b272f', cursor: 'pointer', fontSize: '0.95rem' }}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* 🎬 레거시 팝업 제거됨 — Master-Detail 인라인 플레이어로 대체 */}

      {/* 📄 플로팅 주보 위젯 (라이브 시 드래그 가능, 화면 경계 제한) */}
      {showFloatingBulletin && (
        <div
          ref={floatingBulletinRef}
          className="floating-bulletin"
          style={{ left: bulletinPos.x, top: bulletinPos.y }}
        >
          <div className="fb-header" onMouseDown={handleBulletinDragStart} onTouchStart={handleBulletinDragStart}>
            <span>📄 이번 주 주보</span>
            <button onClick={() => setShowFloatingBulletin(false)} className="fb-close">✕</button>
          </div>
          <div className="fb-body">
            {bulletinData ? (
              <>
                <h3 style={{ fontSize: '1rem', color: '#5b272f', textAlign: 'center', margin: '0 0 5px' }}>{bulletinData.worshipType || '주일 예배 순서'}</h3>
                <div style={{ textAlign: 'center', color: '#888', marginBottom: '12px', fontSize: '0.8rem' }}>{bulletinData.date}</div>
                {bulletinData.worshipOrder?.map((order: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #eee', fontSize: '0.82rem' }}>
                    <span style={{ fontWeight: 'bold', color: '#444' }}>{order.item}</span>
                    <span style={{ textAlign: 'right', flex: 1, marginLeft: '8px', color: '#666' }}>{order.detail}</span>
                  </div>
                ))}
                {bulletinData.announcements?.length > 0 && (
                  <>
                    <h4 style={{ fontSize: '0.85rem', color: '#5b272f', marginTop: '12px', marginBottom: '6px', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>교회 소식</h4>
                    <ul style={{ paddingLeft: '16px', fontSize: '0.8rem', color: '#444', lineHeight: '1.5', margin: 0 }}>
                      {bulletinData.announcements.map((ann: string, idx: number) => (
                        <li key={idx} style={{ marginBottom: '4px' }}>{ann}</li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#888', fontSize: '0.85rem' }}>
                📄 아직 이번 주 주보가 등록되지 않았습니다.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 📲 앱 설치 가이드 모달 */}
      {showInstallGuide && (
        <div className="mbg" onClick={() => setShowInstallGuide(false)}>
          <div className="bm" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '20px', color: '#1E293B', textAlign: 'center' }}>📲 거제반석교회 앱 설치 방법</h3>
            <div style={{ background: '#F8FAFC', padding: '15px', borderRadius: '10px', marginBottom: '15px', textAlign: 'left' }}>
              <h4 style={{ color: '#000', marginBottom: '10px' }}>🍎 아이폰 (Safari)</h4>
              <p style={{ fontSize: '0.95rem', color: '#444', lineHeight: '1.6', margin: 0 }}>1. 화면 맨 아래 <b>[공유 ⍗]</b> 버튼을 누르세요.<br />2. <b>[홈 화면에 추가 ⊞]</b>를 선택하세요.</p>
            </div>
            <div style={{ background: '#F8FAFC', padding: '15px', borderRadius: '10px', marginBottom: '15px', textAlign: 'left' }}>
              <h4 style={{ color: '#000', marginBottom: '10px' }}>🤖 갤럭시 (Chrome/삼성인터넷)</h4>
              <p style={{ fontSize: '0.95rem', color: '#444', lineHeight: '1.6', margin: 0 }}>1. 화면 우측 상단 <b>[메뉴 ⋮]</b> 버튼을 누르세요.<br />2. <b>[홈 화면에 추가]</b>를 선택하세요.</p>
            </div>
            <button style={{ marginTop: '10px', width: '100%', padding: '15px', background: '#FFEB3B', border: 'none', borderRadius: '10px', fontWeight: 'bold', color: '#333', fontSize: '1.1rem', cursor: 'pointer' }} onClick={() => setShowInstallGuide(false)}>확인했습니다</button>
          </div>
        </div>
      )}

      {/* 하단 네비 */}
      <div className="bn">
        <div className="ni act">🏠 홈</div>
        <div className="ni" onClick={() => setShowBulletin(true)}>📄 주보</div>
        <div className="ni" onClick={() => setShowMapModal(true)}>📍 지도</div>
      </div>

      {/* 🤫 푸터 */}
      <footer className="ft" onClick={handleSecretClick}>
        <p>© 2026 대한예수교장로회 반석교회 · 거제시 연초면 소오비길 40-6</p>
      </footer>

      <style jsx>{`
        .pw{min-height:100vh;padding-bottom:80px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
        .lt{background:#FDFBF7;color:#333}.dk{background:#0F172A;color:#eee}
        .ct{max-width:1000px;margin:0 auto;padding:20px}

        .ch-header{position:sticky;top:0;width:100%;z-index:2000;padding:0.8rem 5%;display:flex;justify-content:space-between;align-items:center;background:white;border-bottom:1px solid #eee;box-shadow:0 2px 8px rgba(0,0,0,0.04)}
        .dk .ch-header{background:#1E293B;border-bottom-color:#334155}
        .ch-logo{display:flex;align-items:center;cursor:pointer}
        .ch-logo-img{height:40px;width:auto;object-fit:contain}
        .ch-nav{display:flex;gap:0.3rem}
        .ch-nav-link{cursor:pointer;padding:0.5rem 1rem;background:none;border:none;font-size:0.95rem;font-weight:500;color:#5b272f;border-radius:8px;transition:all 0.2s;font-family:inherit}
        .ch-nav-link:hover{background:rgba(193,156,114,0.1);color:#c19c72}
        .ch-nav-active{color:#c19c72;font-weight:700}
        .dk .ch-nav-link{color:#ccc}
        .dk .ch-nav-link:hover{background:rgba(255,255,255,0.1)}
        .ch-hamburger{display:none;background:none;border:none;font-size:1.6rem;color:#5b272f;cursor:pointer;padding:0.3rem}
        .dk .ch-hamburger{color:#ccc}
        @keyframes blink{0%{opacity:1}50%{opacity:0.3}100%{opacity:1}}

        .tab-content{animation:fadeIn 0.3s ease}
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}

        /* 교회소개 히어로 */
        .about-hero{position:relative;min-height:420px;display:flex;align-items:center;justify-content:center;border-radius:20px;overflow:hidden}
        .about-bg{position:absolute;inset:0;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)}
        .about-content{position:relative;z-index:1;text-align:center;padding:40px 20px}
        .about-tagline{color:#c19c72;font-size:0.95rem;letter-spacing:0.15em;margin-bottom:1rem;font-weight:500}
        .about-title{font-family:'Nanum Myeongjo',serif;line-height:1.5;margin:0 0 2rem}
        .about-gold{display:block;font-size:2rem;color:#c19c72;font-weight:800}
        .about-burgundy{display:block;font-size:1.8rem;color:white;font-weight:700}
        .about-buttons{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
        .about-btn-primary{padding:14px 28px;background:#5b272f;color:white;border:none;border-radius:12px;font-weight:700;font-size:1rem;cursor:pointer;transition:all 0.3s;font-family:inherit}
        .about-btn-primary:hover{background:#7a3a44;transform:translateY(-2px)}
        .about-btn-outline{padding:14px 28px;background:transparent;color:#c19c72;border:2px solid #c19c72;border-radius:12px;font-weight:700;font-size:1rem;cursor:pointer;transition:all 0.3s;font-family:inherit}
        .about-btn-outline:hover{background:rgba(193,156,114,0.1)}

        /* ✅ 비전과 사명 — Seamless Dark Navy Theme */
        .vm-page{background:#0B101E;padding:60px 30px 50px;border-radius:20px;display:flex;flex-direction:column;gap:70px;max-width:900px;margin:0 auto}
        .vm-header{text-align:center}
        .vm-sub{display:block;font-size:0.85rem;color:rgba(197,165,90,0.6);letter-spacing:0.15em;text-transform:uppercase;margin-bottom:8px}
        .vm-title{font-size:2.4rem;font-weight:900;color:#E5B871;margin:0 0 10px;font-family:'Nanum Myeongjo',serif}
        .vm-verse{font-size:1rem;color:rgba(255,255,255,0.5);font-style:italic;letter-spacing:0.05em;margin:0}
        .vm-divider{width:50px;height:3px;background:linear-gradient(90deg,transparent,#C5A55A,transparent);margin:18px auto 0;border-radius:2px}

        .vm-row{display:flex;align-items:center;gap:40px}
        .vm-row-reverse{flex-direction:row-reverse}
        .vm-img-wrap{position:relative;flex-shrink:0;width:220px;height:220px;display:flex;align-items:center;justify-content:center}
        .vm-glow{position:absolute;inset:10%;border-radius:50%;background:radial-gradient(circle,rgba(197,165,90,0.12) 0%,transparent 70%);filter:blur(20px);z-index:0}
        .vm-img{position:relative;z-index:1;width:200px;height:200px;object-fit:contain;mix-blend-mode:screen;filter:brightness(1.4) contrast(1.3) drop-shadow(0 0 15px rgba(197,165,90,0.4));transition:transform 0.4s ease}
        .vm-img:hover{transform:scale(1.08)}
        .vm-text{flex:1}
        .vm-num{font-size:3.5rem;font-weight:900;color:rgba(197,165,90,0.08);line-height:1;display:block;margin-bottom:-15px;font-family:'Outfit',sans-serif}
        .vm-tag{display:inline-block;font-size:0.7rem;font-weight:800;color:#E5B871;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:8px}
        .vm-item-title{font-size:1.6rem;font-weight:800;color:white;margin:0 0 12px;font-family:'Nanum Myeongjo',serif}
        .vm-desc{font-size:0.95rem;color:rgba(255,255,255,0.6);line-height:1.8;word-break:keep-all;margin:0}

        .vm-glass-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:18px}
        .vm-glass{padding:28px 20px;border-radius:16px;text-align:center;background:rgba(255,255,255,0.03);border:1px solid rgba(197,165,90,0.12);backdrop-filter:blur(8px);transition:all 0.3s}
        .vm-glass:hover{border-color:rgba(197,165,90,0.35);transform:translateY(-4px);box-shadow:0 8px 30px rgba(197,165,90,0.08)}
        .vm-glass-icon{font-size:2rem;margin-bottom:10px}
        .vm-glass-title{font-size:1.05rem;font-weight:800;color:#FDE047;margin:0 0 6px;font-family:'Nanum Myeongjo',serif}
        .vm-glass-desc{font-size:0.88rem;color:rgba(255,255,255,0.5);word-break:keep-all;margin:0;line-height:1.5}

        .vm-stone{display:flex;align-items:center;gap:30px;padding:30px;border-radius:16px;background:linear-gradient(135deg,rgba(229,184,113,0.05),rgba(229,184,113,0.02))}
        .vm-stone-img{width:90px;height:auto;object-fit:contain;flex-shrink:0;border-radius:12px;filter:brightness(0.95) contrast(1.1)}
        .vm-stone-text h3{color:#FDE047;font-size:1.3rem;font-weight:800;margin:0 0 8px;font-family:'Nanum Myeongjo',serif}
        .vm-stone-text p{font-size:0.95rem;color:rgba(255,255,255,0.6);line-height:1.7;word-break:keep-all;margin:0}

        @media(max-width:700px){
          .vm-page{padding:40px 20px 30px;gap:50px}
          .vm-row,.vm-row-reverse{flex-direction:column;text-align:center;gap:20px}
          .vm-img-wrap{width:160px;height:160px}
          .vm-img{width:150px;height:150px}
          .vm-num{font-size:2.5rem}
          .vm-item-title{font-size:1.3rem}
          .vm-glass-grid{grid-template-columns:1fr}
          .vm-stone{flex-direction:column;text-align:center;gap:15px}
        }

        /* 교회소식 — 바둑판 그리드 */
        .news-grid-box{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;margin-top:25px}
        .news-box{background:white;border-radius:12px;padding:18px 20px;box-shadow:0 1px 8px rgba(0,0,0,0.05);border-left:3px solid #c19c72;transition:transform 0.2s,box-shadow 0.2s}
        .news-box:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,0.08)}
        .dk .news-box{background:#1E293B;border-left-color:#C5A55A}
        .news-box-text{color:#444;font-size:0.9rem;line-height:1.75;margin:0;word-break:keep-all}
        .news-box-text strong{color:#5b272f;font-size:1rem}
        .dk .news-box-text{color:#bbb}
        .dk .news-box-text strong{color:#E5B871}
        @media(max-width:768px){.news-grid-box{grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}}

        /* 예배안내 */
        .worship-wrap{margin-top:25px}
        .worship-table-wrap{max-width:800px;margin:0 auto}
        .worship-row th{background:rgba(91,39,47,0.06);color:#5b272f;padding:15px 20px;text-align:left;font-weight:600;white-space:nowrap}
        .worship-row td{padding:15px 20px;border-top:1px solid #eee;color:#444;font-size:0.95rem}
        .dk .worship-row th{background:rgba(193,156,114,0.1);color:#c19c72}
        .dk .worship-row td{border-top-color:#334155;color:#ccc}
        .worship-verse{text-align:center;padding:30px;margin-top:20px}
        .schedule-tbl{width:100%;border-collapse:collapse;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.06)}
        .dk .schedule-tbl{background:#1E293B}
        .sch-time{font-weight:700;color:#c19c72}

        /* 오시는길 */
        .location-wrap{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:25px}
        .location-info{background:white;border-radius:16px;padding:30px;box-shadow:0 4px 12px rgba(0,0,0,0.06)}
        .dk .location-info{background:#1E293B}
        .loc-item{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #eee;font-size:0.95rem;color:#444}
        .dk .loc-item{border-bottom-color:#334155;color:#ccc}
        .loc-label{font-weight:600;white-space:nowrap;min-width:80px}
        .map-frame{display:flex}
        .map-placeholder{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:white;border-radius:16px;padding:40px;text-align:center;text-decoration:none;color:#333;box-shadow:0 4px 12px rgba(0,0,0,0.06);width:100%;transition:transform 0.3s}
        .map-placeholder:hover{transform:translateY(-4px)}
        .dk .map-placeholder{background:#1E293B;color:#ccc}


        /* ━━━ 시스템 컨트롤 — 오른쪽 고정 (fixed) ━━━ */
        .sys-ctrl{position:fixed;top:150px;right:16px;z-index:2100;display:flex;flex-direction:column;gap:6px;padding:7px;background:rgba(255,255,255,0.95);backdrop-filter:blur(16px);border-radius:14px;border:2px solid rgba(193,156,114,0.4);box-shadow:0 4px 24px rgba(0,0,0,0.12)}
        .dk .sys-ctrl{background:rgba(15,23,42,0.9);border-color:rgba(197,165,90,0.4)}
        .sys-btn{width:36px;height:36px;border-radius:50%;border:none;background:rgba(91,39,47,0.06);color:#5b272f;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.25s;font-weight:700}
        .sys-btn:hover{background:rgba(193,156,114,0.2);color:#C5A55A;transform:scale(1.12)}
        .sys-btn:active{transform:scale(0.92)}
        .dk .sys-btn{color:#E5B871;background:rgba(229,184,113,0.1)}
        .dk .sys-btn:hover{background:rgba(197,165,90,0.25)}
        .sys-dark{}



        .live-section{margin-bottom:25px}
        .live-banner{display:flex;align-items:center;justify-content:center;background:#D32F2F;color:white;padding:12px 20px;font-weight:bold;font-size:1.1rem;gap:10px;border-radius:12px 12px 0 0;flex-wrap:wrap}
        .live-blink{font-size:0.8rem;color:#FFEB3B;animation:blink 1s infinite}
        .live-player-wrap{position:relative;width:100%;padding-top:56.25%;background:#000;border-radius:0 0 12px 12px;overflow:hidden}
        .live-player{position:absolute;top:0;left:0;width:100%;height:100%;border:none}

        .hero{background:linear-gradient(135deg,#1E293B,#0F172A);border-radius:20px;padding:30px;text-align:center;color:white;margin-bottom:30px}
        .nb{display:inline-block;background:rgba(255,255,255,0.1);padding:8px 20px;border-radius:30px;font-weight:bold;margin:15px 0}
        .bb{display:block;width:100%;max-width:300px;margin:0 auto;background:#FFEB3B;color:#333;border:none;padding:12px;border-radius:10px;font-weight:bold;cursor:pointer}

        .sb input{width:100%;padding:12px 20px;border-radius:30px;border:1px solid #ddd;margin-bottom:15px;box-sizing:border-box}
        .fb{display:flex;gap:8px;overflow-x:auto;padding-bottom:10px;justify-content:center}
        .ftb{padding:8px 18px;border-radius:20px;border:1px solid #ddd;background:white;white-space:nowrap;cursor:pointer}
        .ftb.act{background:#5C3A40;color:white;border-color:#5C3A40}

        .sg{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px}
        .sc{background:white;border-radius:15px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);cursor:pointer;transition:transform 0.3s}
        .sc:hover{transform:translateY(-5px)}
        .dk .sc{background:#1E293B}
        .sch{height:140px;display:flex;flex-direction:column;justify-content:center;align-items:center;color:white;text-align:center;padding:20px}
        .st{font-size:1.1rem;font-weight:bold}

        .ll{display:flex;flex-direction:column;gap:25px}
        .lc{position:relative;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.1);cursor:pointer;min-height:200px}
        .lh{padding:40px 30px;text-align:center;display:flex;align-items:center;justify-content:center;min-height:200px}


        .arc{margin-top:60px}
        .arc-t{font-size:1.6rem;font-weight:800;margin-bottom:10px}
        .arc-s{color:#888;margin-bottom:30px}
        .smb{background:white;border-radius:12px;border:1px solid #eee;overflow:hidden}
        .dk .smb{background:#1E293B;border-color:#334155}
        .mhb{padding:18px 25px;background:#F8FAFC;font-weight:bold;display:flex;justify-content:space-between}
        .dk .mhb{background:#0F172A}
        .sr{padding:15px 25px;display:flex;align-items:center;gap:15px;border-top:1px solid #eee;cursor:pointer}
        .sr:hover{background:#F8FAFC}
        .dk .sr:hover{background:#1a2744}
        .rb{padding:2px 8px;border-radius:4px;font-size:0.75rem;font-weight:bold;color:white;white-space:nowrap}
        .rt{flex:1;font-weight:500;text-overflow:ellipsis;overflow:hidden;white-space:nowrap}
        .rbt{background:#334155;color:white;border:none;padding:5px 12px;border-radius:20px;font-size:0.75rem;cursor:pointer}

        .yt-link{display:inline-flex;align-items:center;gap:8px;padding:12px 28px;background:#FF0000;color:#FFF;border-radius:50px;font-weight:700;font-size:0.95rem;text-decoration:none;box-shadow:0 4px 12px rgba(255,0,0,0.3)}

        .mbg{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center}
        .bm,.mm{width:90%;max-width:450px;background:white;border-radius:20px;padding:30px;max-height:80vh;overflow-y:auto}
        .dk .bm,.dk .mm{background:#1E293B;color:white}
        .br{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #eee}
        .nvb{display:flex;flex-direction:column;gap:10px;margin-top:20px}
        .nl{padding:15px;border-radius:10px;text-decoration:none;font-weight:bold;text-align:center}
        .kk{background:#FEE500;color:black}.tm{background:#000;color:white}
        .clb{margin-top:20px;width:100%;padding:10px;background:#eee;border:none;border-radius:5px;font-weight:bold;cursor:pointer}

        .vc{width:95%;max-width:900px;aspect-ratio:16/9;background:black;border-radius:15px;overflow:hidden}
        .va{padding:15px;display:flex;justify-content:space-between;background:black}
        .kb{background:#FEE500;border:none;padding:8px 20px;border-radius:20px;font-weight:bold;cursor:pointer}

        .bn{position:fixed;bottom:0;left:0;width:100%;height:60px;background:white;border-top:1px solid #eee;display:none;z-index:1000}
        .ni{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:0.8rem;font-weight:bold;color:#888;cursor:pointer}
        .ni.act{color:#5C3A40}

        .ft{text-align:center;padding:20px;padding-bottom:80px;color:#aaa;font-size:0.8rem;cursor:default;user-select:none}

        @media(max-width:768px){
          .ch-nav{display:none;position:absolute;top:100%;left:0;right:0;background:rgba(253,245,234,0.97);backdrop-filter:blur(16px);flex-direction:column;padding:1rem;gap:0.3rem;border-bottom:1px solid rgba(193,156,114,0.15);box-shadow:0 4px 12px rgba(0,0,0,0.1)}
          .dk .ch-nav{background:rgba(30,41,59,0.97)}
          .ch-nav-open{display:flex!important}
          .ch-hamburger{display:block}
          .ch-nav-link{padding:0.8rem 1rem;text-align:center;border-radius:8px}
          .sr{flex-direction:column;align-items:flex-start;gap:10px}
          .rbt{width:100%;padding:10px}
          .bn{display:flex}
          .sys-ctrl{right:10px;top:70px;gap:4px;padding:4px}
          .sys-btn{width:32px;height:32px}
          .floating-bulletin{width:280px!important;max-height:50vh!important}
        }

        /* ━━━ 플로팅 주보 위젯 ━━━ */
        .floating-bulletin{position:fixed;z-index:8000;width:320px;max-height:60vh;background:white;border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,0.2);border:1px solid rgba(197,165,90,0.3);overflow:hidden;display:flex;flex-direction:column}
        .dk .floating-bulletin{background:#1E293B;border-color:rgba(197,165,90,0.3)}
        .fb-header{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:linear-gradient(135deg,#5b272f,#7a3a44);color:white;cursor:grab;user-select:none;font-size:0.9rem;font-weight:700}
        .fb-header:active{cursor:grabbing}
        .fb-close{background:rgba(255,255,255,0.2);border:none;color:white;width:26px;height:26px;border-radius:50%;cursor:pointer;font-size:0.85rem;display:flex;align-items:center;justify-content:center;transition:background 0.2s}
        .fb-close:hover{background:rgba(255,255,255,0.35)}
        .fb-body{flex:1;overflow-y:auto;padding:14px;font-size:0.85rem}
        .dk .fb-body{color:#ccc}
      `}</style>
    </div>
  );
}
