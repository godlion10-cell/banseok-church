"use client";
import React from 'react';
import Link from 'next/link';

export default function PilgrimMapPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#FDFBF7', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '50px' }}>
        <h2 style={{ color: '#1E3A8A', fontSize: '2.5rem', fontWeight: '900', marginBottom: '10px' }}>🗺️ 영적 순례길</h2>
        <p style={{ color: '#4B5563', fontSize: '1.1rem' }}>거제반석교회 성도님들을 위한 디지털 천로역정 여정입니다.</p>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* ✅ 활성화된 첫 번째 여정 : 십자가 언덕 */}
        <Link href="/cross-hill" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'linear-gradient(135deg, #111827, #374151)', padding: '30px', borderRadius: '15px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', transition: 'transform 0.2s', cursor: 'pointer' }}
               onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
               onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            <div>
              <h3 style={{ fontSize: '1.5rem', color: '#FCA5A5', marginBottom: '10px' }}>✝️ 십자가 언덕 (입장 가능)</h3>
              <p style={{ color: '#D1D5DB', fontSize: '0.95rem' }}>누구에게도 말하지 못한 무거운 짐을 십자가 앞에 익명으로 내려놓는 곳입니다.</p>
            </div>
            <div style={{ fontSize: '2rem' }}>👉</div>
          </div>
        </Link>

        {/* ✅ 활성화된 두 번째 여정 : 좁은 문 */}
        <Link href="/narrow-gate" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'linear-gradient(135deg, #78350F, #D97706)', padding: '30px', borderRadius: '15px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', transition: 'transform 0.2s', cursor: 'pointer' }}
               onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
               onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            <div>
              <h3 style={{ fontSize: '1.5rem', color: '#FEF3C7', marginBottom: '10px' }}>🚪 좁은 문 (입장 가능)</h3>
              <p style={{ color: '#FDE68A', fontSize: '0.95rem' }}>새가족을 위한 따뜻한 환영과 복음의 기초 안내소</p>
            </div>
            <div style={{ fontSize: '2rem' }}>👉</div>
          </div>
        </Link>

        <div style={{ background: '#F3F4F6', padding: '30px', borderRadius: '15px', color: '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '2px dashed #D1D5DB' }}>
          <div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '10px' }}>🛡️ 무기고 (준비 중)</h3>
            <p style={{ fontSize: '0.95rem' }}>영적 성장의 발자취를 기록하고 전신갑주를 입는 곳</p>
          </div>
          <div style={{ fontSize: '1.5rem' }}>🔒</div>
        </div>

      </div>
    </div>
  );
}
