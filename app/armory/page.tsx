"use client";
import React, { useState } from 'react';

export default function ArmoryPage() {
  const armorItems = [
    { name: "진리의 허리띠", sub: "오늘도 정직하게 살았나요?" },
    { name: "의의 호심경", sub: "예수의 의로 마음을 지켰나요?" },
    { name: "복음의 신", sub: "평화의 소식을 전하러 발을 뗐나요?" },
    { name: "믿음의 방패", sub: "불안과 의심을 믿음으로 막았나요?" },
    { name: "구원의 투구", sub: "구원의 확신으로 생각을 보호했나요?" },
    { name: "성령의 검", sub: "말씀으로 세상을 이겼나요?" }
  ];

  const [checked, setChecked] = useState<boolean[]>(new Array(armorItems.length).fill(false));

  const toggleCheck = (index: number) => {
    const newChecked = [...checked];
    newChecked[index] = !newChecked[index];
    setChecked(newChecked);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9', padding: '40px 20px', textAlign: 'center' }}>
      <h2 style={{ color: '#1E3A8A', fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '10px' }}>🛡️ 무기고</h2>
      <p style={{ color: '#475569', marginBottom: '40px' }}>오늘 하루, 전신갑주를 입고 승리하세요!</p>

      <div style={{ maxWidth: '500px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {armorItems.map((item, index) => (
          <div 
            key={index} 
            onClick={() => toggleCheck(index)}
            style={{ padding: '20px', borderRadius: '12px', background: checked[index] ? '#DBEAFE' : 'white', border: checked[index] ? '2px solid #3B82F6' : '2px solid #E2E8F0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '15px', transition: '0.2s' }}
          >
            <div style={{ fontSize: '1.5rem' }}>{checked[index] ? '✅' : '⬜'}</div>
            <div style={{ textAlign: 'left' }}>
              <h4 style={{ color: '#1E293B', margin: 0 }}>{item.name}</h4>
              <p style={{ color: '#64748B', fontSize: '0.85rem', margin: 0 }}>{item.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
