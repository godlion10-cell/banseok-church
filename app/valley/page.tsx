"use client";
import React from 'react';

export default function ValleyPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#94A3B8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' }}>
      
      {/* 🎵 저작권 안전! 유튜브 찬양 연주곡 임베딩 */}
      <div style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}>
        <iframe width="1" height="1" src="https://www.youtube.com/embed/videoseries?list=PL4fGSI1pDJn6jU1pWpXWn-k5s9P1_P-vA&autoplay=1&mute=0" allow="autoplay"></iframe>
      </div>

      <div style={{ maxWidth: '600px', zIndex: 1 }}>
        <h2 style={{ color: '#6366F1', fontSize: '2rem', marginBottom: '20px', fontWeight: 'bold' }}>🌑 사망의 음침한 골짜기</h2>
        <div style={{ fontSize: '1.2rem', lineHeight: '1.8', fontStyle: 'italic', color: '#CBD5E1', marginBottom: '40px' }}>
          &ldquo;내가 사망의 음침한 골짜기로 다닐지라도<br/>
          해를 두려워하지 않을 것은<br/>
          주께서 나와 함께 하심이라...&rdquo; (시 23:4)
        </div>

        <div className="scroll-verses" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <p style={{ fontSize: '1.1rem', opacity: 0.8 }}>고난은 당신을 무너뜨리려는 것이 아니라,<br/>하나님께 더 가까이 이끄는 통로입니다.</p>
          <hr style={{ border: '0', borderTop: '1px solid #1E293B', width: '50px', margin: '0 auto' }} />
          <p style={{ fontSize: '1.1rem', opacity: 0.8 }}>가장 어두운 밤에 가장 밝은 별이 보이듯,<br/>지금 이 순간 주님의 손이 당신을 붙들고 있습니다.</p>
        </div>

        <button 
          onClick={() => window.history.back()}
          style={{ marginTop: '50px', padding: '12px 24px', background: 'transparent', border: '1px solid #334155', color: '#64748B', borderRadius: '30px', cursor: 'pointer' }}>
          골짜기를 지나 다시 걷기
        </button>
      </div>

      <style jsx>{`
        .scroll-verses { animation: fadeIn 3s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
