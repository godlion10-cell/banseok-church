"use client";
import React, { useState } from 'react';
import { sendAdminLoginAlert } from './actions';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 🎛️ 천로역정 7개 방의 스위치 상태 (ON/OFF)
  const [switches, setSwitches] = useState({
    narrowGate: true,
    crossHill: true,
    armory: true,
    valley: true,
    vanityFair: true,
    joyMountain: true,
    passport: true
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'banseok1004') {
      setIsLoggedIn(true);
      await sendAdminLoginAlert();
      console.log("텔레그램 발송 완료!");
    } else {
      alert('비밀번호가 틀렸습니다.');
    }
  };

  const toggleSwitch = (key: keyof typeof switches) => {
    setSwitches({ ...switches, [key]: !switches[key] });
    alert(`${key} 기능이 ${!switches[key] ? '활성화' : '비활성화'} 되었습니다! (현재는 UI 테스트 모드입니다)`);
  };

  // ✅ 로그인 성공 시 보여줄 [마스터 제어판]
  if (isLoggedIn) {
    const rooms = [
      { id: 'narrowGate', name: '🚪 좁은 문' },
      { id: 'crossHill', name: '✝️ 십자가 언덕' },
      { id: 'armory', name: '🛡️ 무기고' },
      { id: 'valley', name: '🌑 사망의 음침한 골짜기' },
      { id: 'vanityFair', name: '🎪 허영의 시장' },
      { id: 'joyMountain', name: '⛰️ 기쁨의 산' },
      { id: 'passport', name: '🎫 천성 여권' }
    ];

    return (
      <div style={{ padding: '40px 20px', background: '#F8FAFC', minHeight: '100vh', fontFamily: 'sans-serif' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ color: '#1E3A8A', fontSize: '2rem', fontWeight: '900' }}>👑 스마트 관리자 제어판</h2>
            <p style={{ color: '#64748B' }}>영적 순례길의 모든 문을 통제합니다.</p>
          </div>

          <div style={{ background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
            <h3 style={{ color: '#0F172A', marginBottom: '20px', borderBottom: '2px solid #F1F5F9', paddingBottom: '10px' }}>🗺️ 순례길 스위치 설정</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {rooms.map((room) => (
                <div key={room.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', background: switches[room.id as keyof typeof switches] ? '#F0FDF4' : '#FFF1F2', borderRadius: '12px', border: '1px solid', borderColor: switches[room.id as keyof typeof switches] ? '#BBF7D0' : '#FECDD3', transition: '0.3s' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1E293B' }}>{room.name}</span>
                  
                  <button 
                    onClick={() => toggleSwitch(room.id as keyof typeof switches)}
                    style={{ width: '60px', height: '30px', borderRadius: '30px', border: 'none', position: 'relative', cursor: 'pointer', transition: '0.3s', background: switches[room.id as keyof typeof switches] ? '#22C55E' : '#E2E8F0' }}
                  >
                    <div style={{ width: '24px', height: '24px', background: 'white', borderRadius: '50%', position: 'absolute', top: '3px', left: switches[room.id as keyof typeof switches] ? '33px' : '3px', transition: '0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                  </button>
                </div>
              ))}
            </div>
            <p style={{ color: '#EF4444', fontSize: '0.85rem', marginTop: '20px', textAlign: 'center' }}>* 현재는 디자인 확인용 스위치입니다. 실제 홈페이지 적용은 DB 연결 후 작동합니다.</p>
          </div>
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
