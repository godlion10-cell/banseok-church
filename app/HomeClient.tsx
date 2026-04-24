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
  const [showBulletin, setShowBulletin] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [sermons, setSermons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [liveVideoId, setLiveVideoId] = useState<string | null>(null);

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

  return (
    <div className={`pw ${isDarkMode ? 'dk' : 'lt'}`}>
      {/* 교회 헤더 메뉴 */}
      <header className="ch-header">
        <div className="ch-logo">
          <img src="/church-logo.png" alt="반석교회" className="ch-logo-img" />
        </div>
        <nav className={`ch-nav ${showMobileMenu ? 'ch-nav-open' : ''}`}>
          <button className="ch-nav-link" onClick={() => setShowMobileMenu(false)}>교회소개</button>
          <button className="ch-nav-link" onClick={() => setShowMobileMenu(false)}>비전과사명</button>
          <button className="ch-nav-link ch-nav-active" onClick={() => setShowMobileMenu(false)}>설교말씀</button>
          <button className="ch-nav-link" onClick={() => setShowMobileMenu(false)}>교회소식</button>
          <button className="ch-nav-link" onClick={() => { setShowBulletin(true); setShowMobileMenu(false); }}>예배안내</button>
          <button className="ch-nav-link" onClick={() => { setShowMapModal(true); setShowMobileMenu(false); }}>오시는길</button>
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

        {/* 히어로 */}
        <div className="hero">
          <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>✝️</div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>거제반석교회 온라인 성전</h3>
          <div className="nb">주일 대예배: 오전 9시 / 11시</div>
          <button className="bb" onClick={() => setShowBulletin(true)}>📄 이번 주 스마트 주보 보기</button>
        </div>

        {/* 검색 & 필터 */}
        <div className="fa">
          <div className="sb"><input type="text" placeholder="말씀 제목을 검색하세요..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
          <div className="fb">
            {['전체', '주일오전', '수요예배', '새벽기도'].map(tag => (
              <button key={tag} onClick={() => setActiveFilter(tag)} className={`ftb ${activeFilter === tag ? 'act' : ''}`}>{tag}</button>
            ))}
          </div>
        </div>

        {/* 설교 카드 */}
        <div className="cd">
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '50px', fontWeight: 'bold' }}>📡 유튜브에서 최신 은혜의 말씀을 불러오는 중입니다...</div>
          ) : activeFilter === '전체' && searchTerm === '' ? (
            <div className="sg">
              {filteredSermons.map(s => (
                <div key={s.id} onClick={() => setPopupVideo(s)} className="sc">
                  <div className="sch" style={{ background: s.gradient }}>
                    <div className="st">"{s.title}"</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="ll">
              {filteredSermons.map(s => (
                <div key={s.id} onClick={() => setPopupVideo(s)} className="lc">
                  <div className="lh" style={{ background: s.gradient }}><h3>"{s.title}"</h3></div>
                  <div className="ls">
                    <h4 style={{ color: '#5C3A40', marginBottom: '15px' }}>✨ 말씀 요약 안내</h4>
                    <div style={{ fontSize: `${fontSize}rem` }}><p>아래 재생 버튼을 눌러 생생한 은혜의 말씀을 들어보세요.</p></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 아카이브 */}
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

        {/* 유튜브 채널 바로가기 */}
        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <a href="https://www.youtube.com/@petros-church" target="_blank" rel="noopener noreferrer" className="yt-link">▶ 유튜브에서 더 보기</a>
        </div>
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
        .lc{background:white;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.1);cursor:pointer}
        .dk .lc{background:#1E293B}
        .lh{padding:30px;text-align:center;color:white}
        .ls{padding:30px;text-align:center}
        .ls p{line-height:1.8;margin-bottom:10px;font-weight:500}

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
