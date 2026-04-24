"use client";
import React from 'react';

export default function AdminBibleStatus() {
  // 관리자만 볼 수 있는 전체 성도 리스트 (DB 데이터 뼈대)
  const userStats = [
    { name: "김반석", progress: 85, status: "훌륭함" },
    { name: "이순신", progress: 12, status: "정체됨" },
    { name: "박사랑", progress: 45, status: "보통" },
  ];

  return (
    <div style={{ padding: '40px 20px', background: '#F1F5F9', minHeight: '100vh' }}>
      <h2 style={{ fontWeight: 'bold', marginBottom: '30px' }}>👑 전성도 말씀 읽기 현황 (관리자용)</h2>
      
      <div style={{ display: 'grid', gap: '15px', maxWidth: '700px', margin: '0 auto' }}>
        {userStats.map((user, i) => (
          <div key={i} style={{ background: 'white', padding: '20px', borderRadius: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div>
              <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{user.name}</span>
              <span style={{ marginLeft: '10px', fontSize: '0.8rem', padding: '4px 8px', borderRadius: '10px', background: user.status === '정체됨' ? '#FEE2E2' : '#DCFCE7', color: user.status === '정체됨' ? '#DC2626' : '#16A34A' }}>
                {user.status}
              </span>
            </div>
            <div style={{ width: '150px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ flex: 1, height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${user.progress}%`, height: '100%', background: '#1E3A8A', borderRadius: '4px' }} />
              </div>
              <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{user.progress}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
