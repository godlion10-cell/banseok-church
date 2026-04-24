"use client";
import React from 'react';
import Link from 'next/link';

export default function PilgrimMapPage() {
  const routes = [
    { path: '/narrow-gate', icon: '🚪', name: '좁은 문', desc: '생명의 길로 들어서는 첫걸음', color: '#D97706' },
    { path: '/cross-hill', icon: '✝️', name: '십자가 언덕', desc: '죄의 짐을 내려놓는 곳', color: '#B91C1C' },
    { path: '/armory', icon: '🛡️', name: '무기고', desc: '영적 전쟁을 위한 전신갑주 무장', color: '#1E3A8A' },
    { path: '/valley', icon: '🌑', name: '사망의 골짜기', desc: '어둠 속에서 주님의 동행을 경험하는 곳', color: '#6366F1' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#FDFBF7', padding: '40px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '50px' }}>
        <h2 style={{ color: '#1E3A8A', fontSize: '2.5rem', fontWeight: '900' }}>🗺️ 영적 순례길 지도</h2>
        <p>거제반석교회 순례자들을 위한 여정입니다.</p>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {routes.map((route, i) => (
          <Link href={route.path} key={i} style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', padding: '25px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderLeft: `6px solid ${route.color}` }}>
              <div>
                <h3 style={{ color: route.color, fontSize: '1.3rem', marginBottom: '5px' }}>{route.icon} {route.name}</h3>
                <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>{route.desc}</p>
              </div>
              <div style={{ fontSize: '1.5rem' }}>👉</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
