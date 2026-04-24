"use client";
import React, { useState, useEffect } from 'react';

export default function WelcomeEngine() {
  const [showPopup, setShowPopup] = useState(false);
  const [hasWelcomed, setHasWelcomed] = useState(false);

  // 📍 거제반석교회 좌표 (실제 좌표로 수정 필요)
  const CHURCH_COORDS = {
    lat: 34.8800,
    lng: 128.6200
  };

  useEffect(() => {
    // 오늘 이미 환영한 적 있으면 스킵
    const today = new Date().toDateString();
    const lastWelcome = localStorage.getItem('banseok_welcome_date');
    if (lastWelcome === today) {
      setHasWelcomed(true);
      return;
    }

    const checkLocation = () => {
      if (!navigator.geolocation || hasWelcomed) return;

      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        
        const distance = Math.sqrt(
          Math.pow(latitude - CHURCH_COORDS.lat, 2) + 
          Math.pow(longitude - CHURCH_COORDS.lng, 2)
        );

        // 약 50~100m 반경
        if (distance < 0.001 && !hasWelcomed) {
          setShowPopup(true);
          setHasWelcomed(true);
          localStorage.setItem('banseok_welcome_date', today);
        }
      }, () => { /* 위치 권한 거부 시 무시 */ });
    };

    // 30초마다 위치 체크 (배터리 절약)
    const interval = setInterval(checkLocation, 30000);
    checkLocation();

    return () => clearInterval(interval);
  }, [hasWelcomed]);

  if (!showPopup) return null;

  return (
    <div style={{ position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', zIndex: 9999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '25px', padding: '30px', maxWidth: '400px', width: '100%', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', animation: 'zoomIn 0.5s ease-out' }}>
        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>⛪</div>
        <h2 style={{ color: '#1E3A8A', fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '10px' }}>샬롬! 환영합니다.</h2>
        <p style={{ color: '#64748B', lineHeight: '1.6', marginBottom: '30px' }}>
          거제반석교회 성전에 오신 것을 기쁘게 환영합니다.<br/>오늘의 예배 순서와 주보를 확인해 보세요!
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={() => { window.location.href='/bulletin'; setShowPopup(false); }} style={{ padding: '15px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}>
            📜 오늘 주보 보기
          </button>
          <button onClick={() => setShowPopup(false)} style={{ padding: '12px', background: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
            나중에 보기
          </button>
        </div>
      </div>
      <style jsx>{`@keyframes zoomIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  );
}
