"use client";
import React, { useState } from 'react';

export default function NewcomerPage() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [name, setName] = useState("");

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    // 나중에 안티가 여기에 DB 저장 코드를 넣을 자리!
    setIsRegistered(true);
  };

  if (isRegistered) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #EFF6FF, #DBEAFE)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ background: 'white', padding: '40px 30px', borderRadius: '30px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', maxWidth: '400px', width: '100%', animation: 'popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
          <div style={{ fontSize: '5rem', marginBottom: '20px' }}>🎊</div>
          <h2 style={{ color: '#1E3A8A', fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '10px' }}>{name} 성도님, 환영합니다!</h2>
          <p style={{ color: '#475569', lineHeight: '1.6', marginBottom: '30px' }}>
            거제반석교회의 소중한 가족이 되신 것을 진심으로 축복합니다. 아래 버튼을 눌러 디지털 웰컴 선물을 확인해 보세요!
          </p>
          <button style={{ width: '100%', padding: '15px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '15px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}>
            🎁 디지털 웰컴 선물함 열기
          </button>
          <button onClick={() => window.location.href='/'} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', textDecoration: 'underline' }}>
            홈으로 가기
          </button>
        </div>
        <style jsx>{`@keyframes popIn { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '50px 20px' }}>
      <div style={{ maxWidth: '450px', margin: '0 auto', background: 'white', padding: '40px 30px', borderRadius: '25px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
        <h2 style={{ color: '#1E3A8A', fontSize: '1.6rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '10px' }}>🚪 새가족 등록</h2>
        <p style={{ textAlign: 'center', color: '#64748B', marginBottom: '35px' }}>반석교회 공동체의 일원이 되어주세요.</p>
        
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#334155' }}>이름</label>
            <input required type="text" value={name} onChange={(e)=>setName(e.target.value)} placeholder="성함을 입력해 주세요" style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#334155' }}>연락처</label>
            <input required type="tel" placeholder="010-0000-0000" style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <button type="submit" style={{ marginTop: '20px', padding: '18px', background: '#1E3A8A', color: 'white', border: 'none', borderRadius: '15px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer' }}>
            등록하고 환영 선물 받기 ➤
          </button>
        </form>
      </div>
    </div>
  );
}
