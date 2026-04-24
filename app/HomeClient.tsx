// @ts-nocheck
'use client';
import { useState, useEffect, useRef } from 'react';



// 유튜브 API 실패 시 사용할 폴백 데이터
const FALLBACK_SERMONS = [
  { id: 's1', videoId: '', title: '부활, 죽음을 이기는 하나님의 소망', category: '주일오전', date: '2026. 4. 19', gradient: 'linear-gradient(135deg, #701a75, #9f1239)', verse: '고전 15:1-10', summary: ["부활은 기독교 신앙의 핵심입니다.", "죽음의 권세를 이기신 예수님을 찬양합시다."] },
  { id: 's2', videoId: '', title: '다시 시작된 하나님의 인도', category: '수요예배', date: '2026. 4. 22', gradient: 'linear-gradient(135deg, #064e3b, #0f766e)', verse: '창 45:16-28', summary: ["요셉의 고난 뒤에 숨겨진 하나님의 계획.", "우리 삶을 인도하시는 섭리를 믿으십시오."] },
  { id: 's3', videoId: '', title: '모세를 부르신 하나님', category: '새벽기도', date: '2026. 4. 23', gradient: 'linear-gradient(135deg, #451a03, #78350f)', verse: '출 3:1-10', summary: ["자격 없는 자를 부르시는 은혜", "사명을 깨닫고 순종하는 삶"] },
];

export default function HomeClient() {
  const [popupVideo, setPopupVideo] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeFilter, setActiveFilter] = useState('전체');
  const [searchTerm, setSearchTerm] = useState('');
  const [fontSize, setFontSize] = useState(1.3);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('설교말씀');
  const [showBulletin, setShowBulletin] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [sermons, setSermons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [liveVideoId, setLiveVideoId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

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
      } catch {}
      setSermons(FALLBACK_SERMONS);
      setIsLoading(false);
    });
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

  const filteredSermons = sermons.filter(s =>
    (activeFilter === '전체' || s.category.includes(activeFilter)) && s.title.includes(searchTerm)
  );

  useEffect(() => {
    setIsMounted(true); // 디자인 옷 입기 완료!
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
          {['교회소개','비전과사명','설교말씀','교회소식','예배안내','오시는길'].map(tab => (
            <button key={tab} className={`ch-nav-link ${activeTab === tab ? 'ch-nav-active' : ''}`} onClick={() => { setActiveTab(tab); setShowMobileMenu(false); }}>{tab}</button>
          ))}
        </nav>
        <button className="ch-hamburger" onClick={() => setShowMobileMenu(!showMobileMenu)}>{showMobileMenu ? '✕' : '☰'}</button>
      </header>

      {/* 플로팅 컨트롤 */}
      <div className="fctrl" style={{ top: '80px' }}>
        <button onClick={() => setFontSize(fontSize + 0.1)} className="cb">가+</button>
        <button onClick={() => setFontSize(fontSize - 0.1)} className="cb">가-</button>
        <button onClick={() => setIsDarkMode(!isDarkMode)} className="cb">{isDarkMode ? '☀️' : '🌙'}</button>
      </div>

      <div className="ct">
        {/* 🔴 실시간 방송 배너 */}
        {isLive && (
          <div className="live-banner" onClick={() => setPopupVideo({ videoId: liveVideoId, title: '실시간 예배 방송', category: 'LIVE' })}>
            <span className="live-blink">● LIVE</span>
            <strong>생방송 예배 중: 클릭하여 시청</strong>
            <span className="live-join">참여하기 ➔</span>
          </div>
        )}

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
            <div className="vision-wrapper">
              <div className="vision-header">
                <h2>Stand on Grace!!</h2>
                <p>반석교회 목회 철학</p>
              </div>
              <div className="tree-container">
                <div className="tree-box fruit"><span className="t-badge">열매</span><h4>사역의 가치 (생명)</h4><p>세상의 가치가 아닌 성령의 능력으로만 가능한 생명에 집중합니다.</p></div>
                <div className="tree-box pillar"><span className="t-badge">기둥</span><h4>신앙의 본질 (은혜)</h4><p>하나님의 절대주권 아래 예수님을 머리로 삼고 순종하는 감격의 신앙입니다.</p></div>
                <div className="tree-box root"><span className="t-badge">뿌리</span><h4>복음의 진리 (반석)</h4><p>오직 예수와 성경을 기준으로 삼는 순전한 신앙의 기초입니다.</p></div>
              </div>
              <div className="four-pillars-grid">
                <div className="p-card"><div className="p-icon">💎</div><h4>단단한 교회</h4><p>하나님의 진리로 순전해지며</p></div>
                <div className="p-card"><div className="p-icon">🛡️</div><h4>강건한 교회</h4><p>예수의 생명력으로 세상을 이김</p></div>
                <div className="p-card"><div className="p-icon">🌱</div><h4>세우는 교회</h4><p>다음 세대를 리더로 키우고</p></div>
                <div className="p-card"><div className="p-icon">⚓</div><h4>굳건한 교회</h4><p>모든 영역에 하나님 나라를 확장함</p></div>
              </div>
              <div className="stone-banner"><h3>하나님의 손에 붙잡힌 매끄러운 돌</h3><p>다윗의 물맷돌처럼 성도 각 사람이 하나님의 도구가 되어 세상을 이기는 비전입니다.</p></div>
            </div>
          </div>
        )}

        {/* ===== 설교말씀 탭 ===== */}
        {activeTab === '설교말씀' && (<>
          <div className="hero">
            <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>✝️</div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>거제반석교회 온라인 성전</h3>
            <div className="nb">주일 대예배: 오전 9시 / 11시</div>
            <button className="bb" onClick={() => setShowBulletin(true)}>📄 이번 주 스마트 주보 보기</button>
          </div>
          <div className="fa"><div className="fb">
            {['전체', '주일오전', '수요예배', '새벽기도'].map(tag => (
              <button key={tag} onClick={() => setActiveFilter(tag)} className={`ftb ${activeFilter === tag ? 'act' : ''}`}>{tag}</button>
            ))}
          </div></div>
          <div className="cd">
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '50px', fontWeight: 'bold' }}>📡 유튜브에서 최신 은혜의 말씀을 불러오는 중입니다...</div>
            ) : activeFilter === '전체' && searchTerm === '' ? (
              <div className="sg">
                {filteredSermons.map(s => (
                  <div key={s.id} onClick={() => setPopupVideo(s)} className="sc">
                    <div className="sch" style={{ background: s.gradient }}><div className="st">"{s.title}"</div></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ll">
                {filteredSermons.map(s => (
                  <div key={s.id} onClick={() => setPopupVideo(s)} className="lc" style={{ background: s.gradient }}>
                    <div className="lh"><h3 style={{ color: 'white', fontSize: '1.8rem', fontWeight: 'bold' }}>"{s.title}"</h3></div>
                    <div className="l-summary-overlay">
                       <h4 style={{ color: '#FFEB3B', marginBottom: '15px' }}>✨ 말씀 요약 안내</h4>
                       <div style={{ fontSize: `${fontSize}rem`, color: 'white' }}><p>아래 재생 버튼을 눌러 생생한 은혜의 말씀을 들어보세요.</p></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {!isLoading && sermons.length > 0 && (
            <div className="arc">
              <h2 className="arc-t">💧 다시 채우는 생수</h2>
              <p className="arc-s">최근 한 달간의 은혜로운 말씀 모음</p>
              <div className="smb">
                <div className="mhb">최신 설교 영상 <span>▲</span></div>
                {sermons.slice(0, 5).map(s => (
                  <div key={s.id} className="sr" onClick={() => setPopupVideo(s)}>
                    <span className="rb" style={{ background: s.category === '주일오전' ? '#9f1239' : s.category === '수요예배' ? '#0f766e' : '#475569' }}>{s.category}</span>
                    <span className="rt">{s.title}</span>
                    <span style={{ fontSize: '0.8rem', color: '#888', marginRight: '10px' }}>{s.date}</span>
                    <button className="rbt">재생</button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <a href="https://www.youtube.com/@petros-church" target="_blank" rel="noopener noreferrer" className="yt-link">▶ 유튜브에서 더 보기</a>
          </div>
        </>)}

        {/* ===== 교회소식 탭 ===== */}
        {activeTab === '교회소식' && (
          <div className="tab-content">
            <div className="hero"><h3 style={{fontSize:'1.6rem',fontWeight:'bold'}}>📢 반석교회 소식</h3></div>
            <div className="news-grid">
              {[{title:'헌영 및 등록 안내',content:'헌영하고 축하합니다! 반석교회는 대한예수교장로회 소속으로 활동 중입니다.\n📺 유튜브: @petros-church\n🏦 십일조헌금: 농협 131-017-687642\n🏦 감사헌금: 농협 131-018-242250'},{title:'홈페이지 및 교회 소식',content:'반석교회 홈페이지가 새롭게 만들어졌습니다!'},{title:'부활주일 감사',content:'할렐루야! 오늘은 부활주일입니다.'},{title:'부활절 이벤트 동참',content:'본당 입구에 좋아하는 말씀 구절을 적어주세요.'},{title:'오늘 세례식 안내',content:'세인 세례: 은혜를 나누시고 헌영해 주세요.'},{title:'부활절 합동예배',content:'오늘 오후에는 거제지역 합동예배로 모입니다. (거정교회 / 14:30)'},{title:'찬생목 축제 일정',content:'다음 주일에는 찬양생목 축제하는 시간을 갖습니다.'},{title:'성전 보수 공사',content:'본당 바닥 및 냉방 벽 공사가 시작됩니다. 기도 부탁드립니다.'},{title:'선교 지원 소개',content:'은혜를 나누시고 헌영하고 축하합니다.'},{title:'선교사 성경캠프 참여',content:'5월 5주간 진행 예정입니다.'}].map((n,idx)=>(
                <div key={idx} className="news-card"><h3>{idx+1}. {n.title}</h3><p style={{whiteSpace:'pre-line'}}>{n.content}</p></div>
              ))}
            </div>
          </div>
        )}

        {/* ===== 예배안내 탭 ===== */}
        {activeTab === '예배안내' && (
          <div className="tab-content">
            <div className="hero"><h3 style={{fontSize:'1.6rem',fontWeight:'bold'}}>🙏 예배안내</h3></div>
            <div className="worship-wrap">
              <div className="worship-table-wrap">
                <table className="schedule-tbl"><tbody>
                  {[{title:'주일예배 (1부)',time:'오전 09:00',place:'2층 본당',officer:'이주민 목사'},{title:'주일예배 (2부)',time:'오전 11:00',place:'2층 본당',officer:'이주민 목사'},{title:'주일오후예배',time:'오후 01:50',place:'2층 본당',officer:'이주민 목사'},{title:'주일 첫소망',time:'오전 10:00',place:'3층 교육관',officer:'김미정'},{title:'주일 대예배',time:'오전 11:00',place:'3층 교육관',officer:'김미정'},{title:'수요 저녁예배',time:'수 07:30',place:'2층 본당',officer:'이주민 목사'},{title:'금요기도회',time:'금 08:00',place:'2층 본당',officer:'이주민 목사'},{title:'새벽예배',time:'오전 05:30',place:'2층 본당',officer:'이주민 목사'}].map((s,i)=>(
                    <tr key={i} className="worship-row"><th>{s.title}</th><td><span className="sch-time">{s.time}</span></td><td>{s.place}</td><td>{s.officer}</td></tr>
                  ))}
                </tbody></table>
                <div className="worship-verse">
                  <div style={{fontSize:'2rem',opacity:0.4}}>✝️</div>
                  <div style={{fontFamily:"'Nanum Myeongjo',serif",fontSize:'0.95rem',color:'#5b272f',fontStyle:'italic',opacity:0.75,maxWidth:380,lineHeight:1.9}}>"예배드리려 하거든 신령과 진리로 예배드려야 하느니라"</div>
                  <div style={{marginTop:'0.5rem',fontSize:'0.8rem',color:'#c19c72',fontWeight:600}}>요한복음 4:24</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== 오시는길 탭 ===== */}
        {activeTab === '오시는길' && (
          <div className="tab-content">
            <div className="hero"><h3 style={{fontSize:'1.6rem',fontWeight:'bold'}}>📍 오시는 길</h3></div>
            <div className="location-wrap">
              <div className="location-info">
                <h3 style={{fontFamily:"'Nanum Myeongjo',serif",fontSize:'1.6rem',color:'#5b272f',marginBottom:'2rem',lineHeight:1.3}}>대한예수교장로회<br/>거제반석교회</h3>
                <div className="loc-item"><span className="loc-label">🏠 주소</span><span>경상남도 거제시 연초면 소오비길 40-6</span></div>
                <div className="loc-item"><span className="loc-label">📞 문의</span><span>이주민 목사 (010.9825.5020)</span></div>
                <div className="loc-item"><span className="loc-label">⏰ 예배</span><span>주일 오전 9시 / 11시, 수요 수 7:30, 금요 금 8시</span></div>
                <div className="loc-item"><span className="loc-label">📺 유튜브</span><span><a href="https://www.youtube.com/@petros-church" target="_blank" rel="noopener noreferrer" style={{color:'#c19c72',fontWeight:600}}>@petros-church</a></span></div>
              </div>
              <div className="map-frame">
                <a href="https://map.kakao.com/?q=경상남도 거제시 연초면 소오비길 40-6" target="_blank" rel="noopener noreferrer" className="map-placeholder">
                  <span style={{fontSize:'2.5rem'}}>🗺️</span><span style={{fontWeight:700,fontSize:'1.1rem'}}>카카오맵에서 보기</span><span style={{fontSize:'0.85rem',color:'#888'}}>거제시 연초면 소오비길 40-6</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 스마트 주보 모달 */}
      {showBulletin && (
        <div className="mbg" onClick={() => setShowBulletin(false)}>
          <div className="bm" onClick={e => e.stopPropagation()}>
            <h2>주일 예배 순서</h2>
            <div className="br"><span>신앙고백</span><span>사도신경</span></div>
            <div className="br"><span>찬송</span><span>28장 (복의 근원 강림하사)</span></div>
            <div className="br"><span>대표기도</span><span>홍길동 장로</span></div>
            <button className="clb" onClick={() => setShowBulletin(false)}>닫기</button>
          </div>
        </div>
      )}

      {/* 지도 모달 */}
      {showMapModal && (
        <div className="mbg" onClick={() => setShowMapModal(false)}>
          <div className="mm" onClick={e => e.stopPropagation()}>
            <h3>오시는 길 안내</h3>
            <p>경상남도 거제시 연초면 소오비길 40-6</p>
            <div className="nvb">
              <a href="https://map.kakao.com/link/to/거제반석교회,34.868,128.694" target="_blank" className="nl kk">🚗 카카오내비 실행</a>
              <a href="tmap://route?goalname=거제반석교회" className="nl tm">🚙 T맵 실행</a>
            </div>
            <button className="clb" onClick={() => setShowMapModal(false)}>닫기</button>
          </div>
        </div>
      )}

      {/* 영상 팝업 */}
      {popupVideo && (
        <div className="mbg" onClick={() => setPopupVideo(null)}>
          <div className="vc" onClick={e => e.stopPropagation()}>
            {popupVideo.videoId ? (
              <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${popupVideo.videoId}?autoplay=1&modestbranding=1&rel=0`} allowFullScreen style={{ border: 'none' }} />
            ) : (
              <div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#1a1a2e,#16213e)',color:'white',textAlign:'center',padding:'20px'}}>
                <div style={{fontSize:'3rem',marginBottom:'15px'}}>⛪</div>
                <h3 style={{margin:'0 0 10px 0'}}>유튜브에서 직접 시청해주세요</h3>
                <p style={{opacity:0.7,marginBottom:'20px',fontSize:'0.95rem'}}>{popupVideo.title}</p>
                <a href="https://www.youtube.com/@petros-church" target="_blank" rel="noopener noreferrer" style={{background:'#FF0000',color:'white',padding:'12px 30px',borderRadius:'30px',textDecoration:'none',fontWeight:'bold',fontSize:'1rem'}}>▶ 유튜브 채널 바로가기</a>
              </div>
            )}
            <div className="va">
              <button onClick={() => { if (navigator.share) { navigator.share({ title: popupVideo.title, url: popupVideo.videoId ? `https://www.youtube.com/watch?v=${popupVideo.videoId}` : 'https://www.youtube.com/@petros-church' }); } else { alert('링크가 복사되었습니다!'); } }} className="kb">📤 말씀 공유</button>
              <button onClick={() => setPopupVideo(null)} style={{ color: '#888', background: 'none', border: 'none', cursor: 'pointer' }}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* 📲 앱 설치 가이드 모달 */}
      {showInstallGuide && (
        <div className="mbg" onClick={() => setShowInstallGuide(false)}>
          <div className="bm" onClick={e => e.stopPropagation()}>
            <h3 style={{fontSize:'1.4rem',fontWeight:'bold',marginBottom:'20px',color:'#1E293B',textAlign:'center'}}>📲 거제반석교회 앱 설치 방법</h3>
            <div style={{background:'#F8FAFC',padding:'15px',borderRadius:'10px',marginBottom:'15px',textAlign:'left'}}>
              <h4 style={{color:'#000',marginBottom:'10px'}}>🍎 아이폰 (Safari)</h4>
              <p style={{fontSize:'0.95rem',color:'#444',lineHeight:'1.6',margin:0}}>1. 화면 맨 아래 <b>[공유 ⍗]</b> 버튼을 누르세요.<br/>2. <b>[홈 화면에 추가 ⊞]</b>를 선택하세요.</p>
            </div>
            <div style={{background:'#F8FAFC',padding:'15px',borderRadius:'10px',marginBottom:'15px',textAlign:'left'}}>
              <h4 style={{color:'#000',marginBottom:'10px'}}>🤖 갤럭시 (Chrome/삼성인터넷)</h4>
              <p style={{fontSize:'0.95rem',color:'#444',lineHeight:'1.6',margin:0}}>1. 화면 우측 상단 <b>[메뉴 ⋮]</b> 버튼을 누르세요.<br/>2. <b>[홈 화면에 추가]</b>를 선택하세요.</p>
            </div>
            <button style={{marginTop:'10px',width:'100%',padding:'15px',background:'#FFEB3B',border:'none',borderRadius:'10px',fontWeight:'bold',color:'#333',fontSize:'1.1rem',cursor:'pointer'}} onClick={() => setShowInstallGuide(false)}>확인했습니다</button>
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

        /* ✅ 비전 페이지 전용 CSS 추가 */
        .vision-wrapper { display: flex; flex-direction: column; gap: 40px; padding: 20px 0; }
        
        .vision-header { background: #111827; color: white; padding: 40px 20px; border-radius: 15px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
        .vision-header h2 { font-size: 2.2rem; color: #D97706; margin-bottom: 10px; font-weight: 800; }
        .vision-header p { font-size: 1.2rem; font-weight: bold; }

        .tree-container { display: flex; flex-direction: column; gap: 15px; position: relative; }
        .tree-container::before { content: ''; position: absolute; left: 50%; top: 0; bottom: 0; width: 4px; background: #E5E7EB; transform: translateX(-50%); z-index: -1; }
        .tree-box { background: white; padding: 25px; border-radius: 15px; border: 2px solid #F3F4F6; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .t-badge { display: inline-block; background: #D97706; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: bold; margin-bottom: 10px; }
        .tree-box h4 { font-size: 1.2rem; color: #1F2937; margin-bottom: 8px; font-weight: bold; }
        .tree-box p { color: #4B5563; font-size: 0.95rem; line-height: 1.5; word-break: keep-all; }
        .dk .tree-box { background: #1E293B; border-color: #334155; }
        .dk .tree-box h4 { color: #eee; }
        .dk .tree-box p { color: #aaa; }
        
        .four-pillars-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .p-card { background: white; padding: 25px 15px; border-radius: 15px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-top: 4px solid #1E3A8A; transition: transform 0.2s; }
        .p-card:hover { transform: translateY(-5px); }
        .dk .p-card { background: #1E293B; }
        .p-icon { font-size: 2.5rem; margin-bottom: 15px; }
        .p-card h4 { font-size: 1.1rem; font-weight: bold; margin-bottom: 10px; color: #111827; }
        .dk .p-card h4 { color: #c19c72; }
        .p-card p { font-size: 0.9rem; color: #6B7280; word-break: keep-all; }
        .dk .p-card p { color: #aaa; }

        .stone-banner { background: linear-gradient(135deg, #1E3A8A, #111827); color: white; padding: 30px; border-radius: 15px; text-align: center; margin-top: 10px; }
        .stone-banner h3 { font-size: 1.4rem; color: #FCD34D; margin-bottom: 10px; font-weight: bold; }
        .stone-banner p { font-size: 1rem; line-height: 1.6; opacity: 0.9; }

        @media (max-width: 768px) {
           .tree-container::before { display: none; }
        }

        /* 교회소식 */
        .news-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px;margin-top:25px}
        .news-card{background:white;border-radius:16px;padding:24px;box-shadow:0 4px 12px rgba(0,0,0,0.06);border-left:4px solid #c19c72;transition:transform 0.3s}
        .news-card:hover{transform:translateY(-4px)}
        .dk .news-card{background:#1E293B}
        .news-card h3{color:#5b272f;font-size:1rem;margin:0 0 10px}
        .dk .news-card h3{color:#c19c72}
        .news-card p{color:#555;font-size:0.9rem;line-height:1.7;margin:0}
        .dk .news-card p{color:#aaa}

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


        .fctrl{position:fixed;right:20px;z-index:1000;display:flex;flex-direction:column;gap:10px}
        .cb{width:45px;height:45px;border-radius:50%;border:1px solid #ddd;background:white;font-weight:bold;cursor:pointer;box-shadow:0 4px 10px rgba(0,0,0,0.1)}

        .live-banner{display:flex;align-items:center;justify-content:center;background:#D32F2F;color:white;padding:12px 20px;cursor:pointer;font-weight:bold;font-size:1.1rem;gap:10px;border-radius:12px;margin-bottom:20px;flex-wrap:wrap}
        .live-blink{font-size:0.8rem;color:#FFEB3B;animation:blink 1s infinite}
        .live-join{font-size:0.9rem;border:1px solid rgba(255,255,255,0.5);padding:2px 8px;border-radius:4px}

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
        .l-summary-overlay{position:absolute;inset:0;background:rgba(0,0,0,0.85);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:30px;opacity:0;transition:opacity 0.3s}
        .lc:hover .l-summary-overlay{opacity:1}
        .l-summary-overlay p{line-height:1.8;margin-bottom:10px;font-weight:500}

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
        }
      `}</style>
    </div>
  );
}
