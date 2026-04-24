"use client";
import React, { useState } from 'react';

export default function MyBibleProgress() {
  // 실제로는 로그인한 사용자의 정보만 DB에서 가져옴
  const [myProgress, setMyProgress] = useState({
    name: "홍길동",
    percent: 42,
    lastRead: "시편 23편",
    goal: "1년 1독"
  });

  return (
    <div style={{ minHeight: '100vh', background: '#FFF', padding: '30px 20px' }}>
      <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ color: '#1E3A8A', fontWeight: 'bold' }}>🔒 나의 영적 일기장</h2>
        <p style={{ color: '#64748B', fontSize: '0.9rem' }}>이 페이지는 성도님 본인만 볼 수 있습니다.</p>
        
        <div style={{ marginTop: '40px', padding: '30px', borderRadius: '25px', background: '#F8FAFC', border: '2px solid #E2E8F0' }}>
          <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🏃‍♂️</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{myProgress.name} 성도님, 잘하고 계셔요!</h3>
          <div style={{ height: '20px', background: '#E2E8F0', borderRadius: '10px', margin: '20px 0', overflow: 'hidden' }}>
            <div style={{ width: `${myProgress.percent}%`, height: '100%', background: '#3B82F6', borderRadius: '10px', transition: 'width 1s ease' }} />
          </div>
          <p style={{ color: '#1E3A8A', fontWeight: 'bold' }}>현재 {myProgress.percent}% 완주 중</p>
          <p style={{ color: '#64748B', fontSize: '0.9rem', marginTop: '10px' }}>마지막 읽은 곳: {myProgress.lastRead}</p>
          <p style={{ color: '#64748B', fontSize: '0.9rem' }}>목표: {myProgress.goal}</p>
        </div>
      </div>
    </div>
  );
}
