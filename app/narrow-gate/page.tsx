"use client";
import React from 'react';

export default function NarrowGatePage() {
  const gospelSteps = [
    { title: "🌱 시작", text: "하나님은 당신을 사랑하십니다." },
    { title: "☁️ 문제", text: "우리 안의 죄가 하나님과 우리 사이를 멀게 했습니다." },
    { title: "✝️ 해결", text: "예수 그리스도가 우리 죄를 대신해 돌아가셨습니다." },
    { title: "🎁 선물", text: "믿음으로 우리는 하나님의 자녀가 되는 선물을 받습니다." }
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'white', padding: '40px 20px', textAlign: 'center' }}>
      <h2 style={{ color: '#D97706', fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '10px' }}>🚪 좁은 문</h2>
      <p style={{ color: '#4B5563', marginBottom: '40px' }}>생명의 길로 들어서는 첫 번째 발걸음입니다.</p>

      <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {gospelSteps.map((step, index) => (
          <div key={index} style={{ padding: '25px', borderRadius: '15px', background: '#FFFBEB', border: '1px solid #FEF3C7', textAlign: 'left' }}>
            <h3 style={{ color: '#92400E', marginBottom: '5px' }}>{step.title}</h3>
            <p style={{ color: '#78350F', fontSize: '1.1rem' }}>{step.text}</p>
          </div>
        ))}
        <div style={{ marginTop: '30px', padding: '20px', borderTop: '2px dashed #E5E7EB' }}>
          <p style={{ fontStyle: 'italic', color: '#6B7280' }}>&ldquo;좁은 문으로 들어가기를 힘쓰라...&rdquo; (눅 13:24)</p>
        </div>
      </div>
    </div>
  );
}
