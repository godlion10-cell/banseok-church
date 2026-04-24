"use client";
import React, { useState, useEffect } from 'react';

export default function VanityFairPage() {
  const [timeLeft, setTimeLeft] = useState(900); // 15분
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isActive, timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' }}>
      <h2 style={{ color: '#0F172A', fontSize: '2.5rem', fontWeight: '800', marginBottom: '10px' }}>🎪 허영의 시장</h2>
      <p style={{ color: '#64748B', marginBottom: '40px' }}>세상의 소음을 끄고 15분간 말씀에만 잠기세요.</p>

      <div style={{ width: '250px', height: '250px', borderRadius: '50%', border: '8px solid #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: '40px', background: 'white', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
        <span style={{ fontSize: '3rem', fontWeight: 'bold', color: '#1E293B' }}>
          {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
        </span>
        <p style={{ fontSize: '0.9rem', color: '#94A3B8' }}>남은 시간</p>
      </div>

      {!isActive ? (
        <button 
          onClick={() => setIsActive(true)}
          style={{ padding: '18px 40px', background: '#0F172A', color: 'white', border: 'none', borderRadius: '40px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
          디지털 금식 시작하기
        </button>
      ) : (
        <div style={{ animation: 'fadeIn 1s' }}>
          <p style={{ fontSize: '1.5rem', color: '#1E3A8A', fontWeight: 'bold', wordBreak: 'keep-all' }}>
            &ldquo;너희는 가만히 있어 내가 하나님 됨을 알찌어다&rdquo; <br/> (시 46:10)
          </p>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
