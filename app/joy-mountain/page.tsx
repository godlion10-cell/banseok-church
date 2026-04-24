"use client";
import React from 'react';

export default function JoyMountainPage() {
  const visions = [
    { icon: "🔥", title: "예배의 감격", desc: "영과 진리로 드리는 살아있는 예배의 산 산제사" },
    { icon: "🌱", title: "다음 세대", desc: "말씀의 반석 위에 굳게 자라나는 우리 아이들" },
    { icon: "📖", title: "제자 훈련", desc: "예수 그리스도의 장성한 분량까지 자라나는 삶" },
    { icon: "🤝", title: "지역 섬김", desc: "거제도를 그리스도의 사랑으로 품고 섬기는 교회" }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F0FDF4', padding: '50px 20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      
      <div style={{ animation: 'fadeInDown 1s ease-out' }}>
        <h2 style={{ color: '#166534', fontSize: '2.8rem', fontWeight: '900', marginBottom: '15px' }}>⛰️ 기쁨의 산</h2>
        <p style={{ color: '#15803D', fontSize: '1.1rem', marginBottom: '50px' }}>
          순례의 길에서 잠시 쉬며, 거제반석교회가 나아갈 영광스러운 천성을 내다봅니다.
        </p>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        {visions.map((vision, i) => (
          <div key={i} style={{ background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 20px rgba(22, 101, 52, 0.05)', borderTop: '5px solid #22C55E', transition: 'transform 0.3s', cursor: 'pointer' }}
               onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-10px)'}
               onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>{vision.icon}</div>
            <h3 style={{ color: '#14532D', fontSize: '1.4rem', marginBottom: '10px', fontWeight: 'bold' }}>{vision.title}</h3>
            <p style={{ color: '#4B5563', lineHeight: '1.6' }}>{vision.desc}</p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '60px', padding: '40px 20px', maxWidth: '800px', margin: '60px auto 0', background: 'white', borderRadius: '20px', border: '2px dashed #86EFAC' }}>
        <h3 style={{ color: '#166534', fontSize: '1.6rem', marginBottom: '20px' }}>🔭 &ldquo;저 멀리 천성이 보입니다&rdquo;</h3>
        <p style={{ color: '#4B5563', lineHeight: '1.8', fontSize: '1.1rem' }}>
          목자들의 망원경을 통해 아름다운 천성을 바라보았던 크리스천처럼,<br/>
          우리 반석교회의 모든 성도님들과 다음 세대가 손을 맞잡고<br/>
          영광의 그날까지 이 순례의 길을 기쁨으로 완주하게 될 것입니다.
        </p>
      </div>

      <style jsx>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
