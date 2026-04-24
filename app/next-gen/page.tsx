"use client";
import React, { useState } from 'react';

export default function NextGenMainPage() {
  const [userRole, setUserRole] = useState<'PARENT' | 'TEACHER' | 'ADMIN'>('PARENT');
  const [childData, setChildData] = useState({ name: "김반석", attendance: "완료", points: 150 });

  return (
    <div style={{ minHeight: '100vh', background: '#F0F9FF', padding: '30px 20px' }}>
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#1E3A8A', fontSize: '2rem', fontWeight: '900' }}>🌳 다음세대</h1>
        <p style={{ color: '#64748B' }}>거제반석교회의 미래를 키워가는 공간</p>
        {/* 역할 전환 (임시 UI — DB 연결 후 자동 판별) */}
        <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
          {(['PARENT', 'TEACHER', 'ADMIN'] as const).map(role => (
            <button key={role} onClick={() => setUserRole(role)} style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', background: userRole === role ? '#1E3A8A' : '#E2E8F0', color: userRole === role ? 'white' : '#64748B', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}>
              {role === 'PARENT' ? '👨‍👩‍👧 부모님' : role === 'TEACHER' ? '📚 교사' : '👑 관리자'}
            </button>
          ))}
        </div>
      </header>

      {/* --- [A] 부모님 모드 --- */}
      {userRole === 'PARENT' && (
        <div style={{ maxWidth: '400px', margin: '0 auto', background: 'white', borderRadius: '30px', padding: '25px', boxShadow: '0 15px 35px rgba(0,0,0,0.1)' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '4rem' }}>👦</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1E293B' }}>{childData.name} 어린이</h2>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div style={{ background: '#EFF6FF', padding: '20px', borderRadius: '20px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.8rem', color: '#3B82F6', marginBottom: '5px' }}>오늘 출석</p>
              <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1E3A8A' }}>{childData.attendance} ✅</p>
            </div>
            <div style={{ background: '#FFF7ED', padding: '20px', borderRadius: '20px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.8rem', color: '#F97316', marginBottom: '5px' }}>누적 달란트</p>
              <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#C2410C' }}>{childData.points} 🪙</p>
            </div>
          </div>
          
          <button style={{ width: '100%', marginTop: '20px', padding: '15px', background: '#1E3A8A', color: 'white', border: 'none', borderRadius: '15px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>
            📸 이번 주 활동 사진 보기
          </button>
        </div>
      )}

      {/* --- [B] 교사/관리자 모드 --- */}
      {(userRole === 'TEACHER' || userRole === 'ADMIN') && (
        <div style={{ maxWidth: '800px', margin: '0 auto', background: 'white', borderRadius: '20px', padding: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontWeight: 'bold', marginBottom: '20px' }}>📊 소망반 출석 및 달란트 관리</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #F1F5F9', textAlign: 'left' }}>
                  <th style={{ padding: '15px' }}>이름</th>
                  <th style={{ padding: '15px' }}>출석상태</th>
                  <th style={{ padding: '15px' }}>달란트</th>
                  <th style={{ padding: '15px' }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: '김반석', status: '출석', points: 150 },
                  { name: '이사랑', status: '출석', points: 120 },
                  { name: '박믿음', status: '결석', points: 90 },
                ].map((child, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '15px', fontWeight: 'bold' }}>{child.name}</td>
                    <td style={{ padding: '15px' }}>
                      <span style={{ color: child.status === '출석' ? '#059669' : '#DC2626', fontWeight: 'bold' }}>{child.status}</span>
                    </td>
                    <td style={{ padding: '15px' }}>{child.points} 🪙</td>
                    <td style={{ padding: '15px' }}>
                      <button style={{ padding: '6px 12px', background: '#F1F5F9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>편집</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
