"use client";
import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

/**
 * 📍 거제반석교회 카카오맵 컴포넌트
 * 
 * - Kakao Maps JavaScript API + Geocoder 라이브러리
 * - 주소 → 좌표 동적 변환 (하드코딩 좌표 X)
 * - 마커 + 인포윈도우 + 줌 컨트롤
 * - 카카오내비/T맵 실행 버튼 내장
 */

declare global {
  interface Window {
    kakao: any;
  }
}

const CHURCH_ADDRESS = '거제시 연초면 소오비길 40-6';
const CHURCH_FULL_ADDRESS = '경상남도 거제시 연초면 소오비길 40-6';
const CHURCH_NAME = '거제반석교회';
// Fallback 좌표 (Geocoder 실패 시에만 사용)
const FALLBACK_LAT = 34.868;
const FALLBACK_LNG = 128.694;

interface KakaoMapProps {
  height?: string;
  showNavButtons?: boolean;
}

export default function KakaoMap({ height = '380px', showNavButtons = true }: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [geocodedAddress, setGeocodedAddress] = useState<string | null>(null);
  const mapInstanceRef = useRef<any>(null);

  const kakaoAppKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

  // 🗺️ 지도 초기화 함수
  const initMap = () => {
    if (!window.kakao || !window.kakao.maps || !mapRef.current) return;

    window.kakao.maps.load(() => {
      try {
        const container = mapRef.current;
        if (!container) return;

        // 1️⃣ 임시 중심점으로 지도 생성
        const options = {
          center: new window.kakao.maps.LatLng(FALLBACK_LAT, FALLBACK_LNG),
          level: 3,
        };
        const map = new window.kakao.maps.Map(container, options);
        mapInstanceRef.current = map;

        // 2️⃣ 줌 컨트롤 추가
        const zoomControl = new window.kakao.maps.ZoomControl();
        map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);

        // 3️⃣ Geocoder로 주소 → 좌표 변환 (핵심!)
        const geocoder = new window.kakao.maps.services.Geocoder();
        geocoder.addressSearch(CHURCH_ADDRESS, (result: any[], status: any) => {
          let coords;

          if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
            coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);
            setGeocodedAddress(result[0].address_name || CHURCH_FULL_ADDRESS);
            console.log('✅ [카카오맵] 주소 → 좌표 변환 성공:', result[0].y, result[0].x);
          } else {
            // Fallback 좌표 사용
            coords = new window.kakao.maps.LatLng(FALLBACK_LAT, FALLBACK_LNG);
            setGeocodedAddress(CHURCH_FULL_ADDRESS);
            console.warn('⚠️ [카카오맵] Geocoder 실패, 폴백 좌표 사용');
          }

          // 4️⃣ 지도 중심 이동
          map.setCenter(coords);

          // 5️⃣ 커스텀 마커
          const markerContent = document.createElement('div');
          markerContent.innerHTML = `
            <div style="
              display: flex; flex-direction: column; align-items: center;
              filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
            ">
              <div style="
                background: linear-gradient(135deg, #5B272F, #8B4513);
                color: white; padding: 8px 14px; border-radius: 20px;
                font-size: 13px; font-weight: 700; white-space: nowrap;
                display: flex; align-items: center; gap: 5px;
              ">
                ⛪ ${CHURCH_NAME}
              </div>
              <div style="
                width: 0; height: 0;
                border-left: 8px solid transparent;
                border-right: 8px solid transparent;
                border-top: 10px solid #5B272F;
              "></div>
            </div>
          `;

          const customOverlay = new window.kakao.maps.CustomOverlay({
            map: map,
            position: coords,
            content: markerContent,
            yAnchor: 1.3,
          });

          // 일반 마커도 추가 (지도 축소 시 표시)
          const marker = new window.kakao.maps.Marker({
            map: map,
            position: coords,
            title: CHURCH_NAME,
          });

          setMapReady(true);
        });
      } catch (err: any) {
        console.error('🔥 [카카오맵] 초기화 에러:', err.message);
        setMapError('지도 초기화에 실패했습니다.');
      }
    });
  };

  // API 키가 없을 때 폴백 UI
  if (!kakaoAppKey) {
    return (
      <div style={{ width: '100%', borderRadius: '16px', overflow: 'hidden' }}>
        {/* 정적 지도 폴백 */}
        <a
          href={`https://map.kakao.com/?q=${encodeURIComponent(CHURCH_FULL_ADDRESS)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: '12px', padding: '40px 20px', textDecoration: 'none',
            background: 'linear-gradient(135deg, #f0ebe5, #e8ddd0)',
            height, cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          <span style={{ fontSize: '3rem' }}>🗺️</span>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#3E2723' }}>카카오맵에서 보기</span>
          <span style={{ fontSize: '0.85rem', color: '#795548' }}>{CHURCH_FULL_ADDRESS}</span>
        </a>
        {showNavButtons && <NavButtons />}
      </div>
    );
  }

  return (
    <div style={{ width: '100%', borderRadius: '16px', overflow: 'hidden', position: 'relative' }}>
      {/* 카카오맵 SDK 로드 */}
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoAppKey}&libraries=services&autoload=false`}
        strategy="afterInteractive"
        onLoad={initMap}
        onError={() => setMapError('카카오맵 SDK 로드 실패. API 키를 확인하세요.')}
      />

      {/* 지도 컨테이너 */}
      <div
        ref={mapRef}
        id="church-map"
        style={{
          width: '100%',
          height,
          borderRadius: '16px 16px 0 0',
          background: mapReady ? 'transparent' : 'linear-gradient(135deg, #f0ebe5, #e8ddd0)',
        }}
      >
        {/* 로딩 상태 */}
        {!mapReady && !mapError && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100%', gap: '12px',
          }}>
            <div style={{ fontSize: '2rem', animation: 'kakaoMapPulse 1.5s infinite' }}>📍</div>
            <p style={{ color: '#8D6E63', fontSize: '0.9rem', fontWeight: 600 }}>지도를 불러오는 중...</p>
          </div>
        )}
      </div>

      {/* 에러 상태 */}
      {mapError && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(240,235,229,0.95)', borderRadius: '16px', gap: '10px',
        }}>
          <span style={{ fontSize: '2rem' }}>⚠️</span>
          <p style={{ color: '#5B272F', fontSize: '0.9rem', fontWeight: 600, textAlign: 'center', padding: '0 20px' }}>{mapError}</p>
          <a
            href={`https://map.kakao.com/?q=${encodeURIComponent(CHURCH_FULL_ADDRESS)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: '10px 24px', background: '#5B272F', color: 'white', borderRadius: '20px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}
          >
            카카오맵에서 직접 보기 →
          </a>
        </div>
      )}

      {/* Geocoded 주소 표시 바 */}
      {mapReady && geocodedAddress && (
        <div style={{
          padding: '10px 16px', background: 'rgba(91,39,47,0.06)',
          borderTop: '1px solid rgba(91,39,47,0.1)',
          display: 'flex', alignItems: 'center', gap: '8px',
          fontSize: '0.82rem', color: '#5B272F',
        }}>
          <span>📍</span>
          <span style={{ fontWeight: 600 }}>{geocodedAddress}</span>
          <span style={{ marginLeft: 'auto', color: '#22C55E', fontSize: '0.75rem' }}>● Geocoded</span>
        </div>
      )}

      {/* 내비게이션 버튼 */}
      {showNavButtons && <NavButtons />}

      <style>{`
        @keyframes kakaoMapPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}

// 🚗 내비게이션 연동 버튼
function NavButtons() {
  return (
    <div style={{
      display: 'flex', gap: '8px', padding: '12px 16px',
      background: 'white', borderRadius: '0 0 16px 16px',
      borderTop: '1px solid #f0ebe5',
    }}>
      <a
        href={`https://map.kakao.com/link/to/${CHURCH_NAME},${FALLBACK_LAT},${FALLBACK_LNG}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          padding: '12px', background: '#FEE500', color: '#3C1E1E',
          borderRadius: '12px', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem',
          transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(254,229,0,0.3)',
        }}
      >
        🚗 카카오내비
      </a>
      <a
        href={`nmap://navigation?dlat=${FALLBACK_LAT}&dlng=${FALLBACK_LNG}&dname=${encodeURIComponent(CHURCH_NAME)}&appname=banseok`}
        style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          padding: '12px', background: '#1EC800', color: 'white',
          borderRadius: '12px', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem',
          transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(30,200,0,0.3)',
        }}
      >
        🧭 네이버내비
      </a>
      <a
        href={`tmap://route?goalname=${encodeURIComponent(CHURCH_NAME)}&goaly=${FALLBACK_LAT}&goalx=${FALLBACK_LNG}`}
        style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          padding: '12px', background: '#1A73E8', color: 'white',
          borderRadius: '12px', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem',
          transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(26,115,232,0.3)',
        }}
      >
        🚙 T맵
      </a>
    </div>
  );
}
