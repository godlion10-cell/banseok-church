"use client";
import React from 'react';
import { useRouter } from 'next/navigation';

export default function AccessibilityWidget() {
  const router = useRouter();

  const btnSize = 48;
  const goldBorder = '1px solid rgba(197,165,90,0.3)';
  const goldBg = 'rgba(255,255,255,0.95)';
  const goldText = '#C5A55A';

  return (
    <div style={{
      position: 'fixed',
      bottom: '90px',
      right: '12px',
      zIndex: 9998,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '10px'
    }}>
      {/* ① 새가족 등록 */}
      <button
        onClick={() => router.push('/newcomer')}
        title="새가족 등록"
        style={{
          width: btnSize, height: btnSize,
          borderRadius: '50%',
          background: goldBg,
          backdropFilter: 'blur(12px)',
          border: goldBorder,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(197,165,90,0.15)',
          transition: 'all 0.25s ease'
        }}
      >
        <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
          <rect x="12" y="6" width="16" height="28" rx="2" stroke={goldText} strokeWidth="1.8"/>
          <circle cx="20" cy="18" r="3" stroke={goldText} strokeWidth="1.5"/>
          <path d="M15 28 C15 24, 25 24, 25 28" stroke={goldText} strokeWidth="1.5" fill="none"/>
          <line x1="28" y1="14" x2="34" y2="14" stroke={goldText} strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="31" y1="11" x2="31" y2="17" stroke={goldText} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      {/* ② 다음세대 */}
      <button
        onClick={() => router.push('/next-gen')}
        title="다음세대"
        style={{
          width: btnSize, height: btnSize,
          borderRadius: '50%',
          background: goldBg,
          backdropFilter: 'blur(12px)',
          border: goldBorder,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(197,165,90,0.15)',
          transition: 'all 0.25s ease'
        }}
      >
        <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
          <path d="M20 36 V20" stroke={goldText} strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M20 20 C20 20, 12 18, 12 12 C12 8, 16 6, 20 10" stroke={goldText} strokeWidth="1.8" fill="none"/>
          <path d="M20 16 C20 16, 28 14, 28 8 C28 4, 24 2, 20 6" stroke={goldText} strokeWidth="1.8" fill="none"/>
          <ellipse cx="20" cy="37" rx="6" ry="1.5" fill={goldText} opacity="0.15"/>
        </svg>
      </button>

      {/* ③ 이음돌 */}
      <button
        onClick={() => router.push('/ieumdol/report')}
        title="이음돌 보고"
        style={{
          width: btnSize + 10, height: btnSize + 10,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #2a1a1e, #1E1F30)',
          border: '2px solid rgba(197,165,90,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 6px 25px rgba(197,165,90,0.2)',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
          <path d="M8 24 C8 24, 14 16, 20 18 C22 18.5, 24 20, 24 20" stroke="#C5A55A" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
          <path d="M32 24 C32 24, 26 16, 20 18" stroke="#C5A55A" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
          <circle cx="20" cy="10" r="4" stroke="#C5A55A" strokeWidth="1.5"/>
          <path d="M18 9 L20 7 L22 9" stroke="#C5A55A" strokeWidth="1" opacity="0.5"/>
        </svg>
      </button>
    </div>
  );
}
