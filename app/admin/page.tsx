"use client";
import React, { useState } from 'react';
import { sendAdminLoginAlert } from '../actions/telegram';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === 'banseok1004') {
      setIsLoggedIn(true);
      
      // 📱 서버 액션으로 텔레그램 알림 (토큰이 브라우저에 안 보임!)
      await sendAdminLoginAlert();
      console.log("텔레그램 발송 완료!");
    } else {
      alert('비밀번호가 틀렸습니다. 다시 입력해주세요.');
    }
  };

  // ✅ 로그인 성공 시 관리자 화면
  if (isLoggedIn) {
    return (
      <div style={{ padding: '50px', textAlign: 'center', background: '#FDFBF7', minHeight: '100vh' }}>
        <h2 style={{ color: '#1E3A8A', fontSize: '2rem', marginBottom: '20px' }}>👑 거제반석교회 스마트 관리자</h2>
        <p style={{ fontSize: '1.2rem', color: '#4B5563' }}>1단계 기초 공사 완료! 사장님 텔레그램으로 알림이 전송되었습니다.</p>
        <div style={{ marginTop: '40px', padding: '30px', background: 'white', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'inline-block' }}>
          <h3 style={{ color: '#D97706' }}>🛠️ (준비 중) 기능 제어판</h3>
          <p>여기에 십자가 언덕 스위치 등 천로역정 기능들이 추가될 예정입니다.</p>
        </div>
      </div>
    );
  }

  // 🔒 로그인 화면
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FDFBF7' }}>
      <form onSubmit={handleLogin} style={{ background: 'white', padding: '50px 40px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', textAlign: 'center', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ marginBottom: '10px', color: '#1E3A8A', fontWeight: '900', fontSize: '1.8rem' }}>🔒 비밀 통로</h2>
        <p style={{ marginBottom: '30px', color: '#6B7280', fontSize: '0.9rem' }}>관리자 전용 로그인 페이지입니다.</p>
        
        <input 
          type="password" 
          placeholder="비밀번호를 입력하세요" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: '15px', width: '100%', marginBottom: '20px', border: '2px solid #E5E7EB', borderRadius: '10px', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
        />
        
        <button type="submit" style={{ background: '#D97706', color: 'white', border: 'none', padding: '15px', width: '100%', borderRadius: '10px', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold', transition: 'background 0.2s' }}>
          입장하기
        </button>
      </form>
    </div>
  );
}
