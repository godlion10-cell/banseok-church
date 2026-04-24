"use client";
import React, { useState } from 'react';

export default function CelestialPassportPage() {
  const [name, setName] = useState('');
  const [isIssued, setIsIssued] = useState(false);

  const handleIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() === '') {
      alert('성함을 입력해주세요!');
      return;
    }
    setIsIssued(true);
  };

  const today = new Date();
  const dateString = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', padding: '50px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      
      {!isIssued ? (
        <div style={{ background: '#1E293B', padding: '40px', borderRadius: '20px', textAlign: 'center', maxWidth: '400px', width: '100%', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
          <h2 style={{ color: '#FBBF24', fontSize: '2rem', marginBottom: '10px' }}>🎫 천성 여권 발급소</h2>
          <p style={{ color: '#94A3B8', marginBottom: '30px' }}>순례길을 걸어온 성도님의 이름을 적어주세요.</p>
          <form onSubmit={handleIssue}>
            <input 
              type="text" 
              placeholder="예: 홍길동" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: '15px', borderRadius: '10px', border: '1px solid #475569', background: '#0F172A', color: 'white', fontSize: '1.2rem', textAlign: 'center', marginBottom: '20px', outline: 'none', boxSizing: 'border-box' }}
            />
            <button type="submit" style={{ width: '100%', padding: '15px', borderRadius: '10px', background: '#D97706', color: 'white', border: 'none', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}>
              발급 받기
            </button>
          </form>
        </div>
      ) : (
        <div style={{ animation: 'zoomIn 0.8s ease-out', width: '100%', maxWidth: '450px' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h2 style={{ color: '#FDE047', fontSize: '1.8rem' }}>축하합니다! 여권이 발급되었습니다.</h2>
            <p style={{ color: '#94A3B8', fontSize: '0.9rem' }}>아래 여권을 캡처하여 간직하세요.</p>
          </div>
          
          <div style={{ background: 'linear-gradient(135deg, #B45309, #D97706)', padding: '5px', borderRadius: '25px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
            <div style={{ background: '#FFFBEB', padding: '30px', borderRadius: '20px', border: '2px dashed #B45309', position: 'relative' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #FEF3C7', paddingBottom: '15px' }}>
                <h3 style={{ color: '#92400E', fontSize: '1.5rem', fontWeight: '900', letterSpacing: '2px' }}>CELESTIAL PASSPORT</h3>
                <p style={{ color: '#B45309', fontSize: '0.9rem' }}>거제반석교회 영적 순례 증서</p>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <span style={{ color: '#92400E', fontWeight: 'bold' }}>순례자 (Name)</span>
                <span style={{ color: '#1E3A8A', fontSize: '1.3rem', fontWeight: '900' }}>{name} 성도</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px' }}>
                <span style={{ color: '#92400E', fontWeight: 'bold' }}>발급일 (Date)</span>
                <span style={{ color: '#4B5563', fontWeight: 'bold' }}>{dateString}</span>
              </div>

              <div style={{ background: '#FEF3C7', padding: '15px', borderRadius: '10px', textAlign: 'center' }}>
                <p style={{ color: '#78350F', fontStyle: 'italic', fontSize: '0.95rem', lineHeight: '1.5' }}>
                  &ldquo;내가 선한 싸움을 싸우고 나의 달려갈 길을 마치고 믿음을 지켰으니...&rdquo; <br/> (딤후 4:7)
                </p>
              </div>

              <div style={{ position: 'absolute', bottom: '20px', right: '20px', width: '60px', height: '60px', border: '3px solid #DC2626', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626', fontWeight: 'bold', fontSize: '1.2rem', transform: 'rotate(-15deg)', opacity: 0.8 }}>
                완주
              </div>
            </div>
          </div>

          <button 
            onClick={() => setIsIssued(false)} 
            style={{ width: '100%', marginTop: '30px', padding: '15px', background: 'transparent', color: '#94A3B8', border: '1px solid #475569', borderRadius: '10px', cursor: 'pointer' }}>
            다시 발급하기
          </button>
        </div>
      )}

      <style jsx>{`
        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
