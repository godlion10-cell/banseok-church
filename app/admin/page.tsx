"use client";
import React, { useState, useEffect } from 'react';
import { sendAdminLoginAlert } from './actions';
import Link from 'next/link';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 🎛️ 순례길 스위치 상태 (DB에서 로드)
  const [switches, setSwitches] = useState<Record<string, boolean>>({
    narrowGate: true, crossHill: true, armory: true,
    valley: true, vanityFair: true, joyMountain: true, passport: true
  });
  const [loading, setLoading] = useState(false);

  // DB에서 스위치 상태 로드
  useEffect(() => {
    if (isLoggedIn) {
      fetch('/api/admin/switches').then(r => r.json()).then(data => {
        if (data.success) setSwitches(data.switches);
      });
    }
  }, [isLoggedIn]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'banseok1004') {
      setIsLoggedIn(true);
      await sendAdminLoginAlert();
    } else {
      alert('비밀번호가 틀렸습니다.');
    }
  };

  const toggleSwitch = async (key: string) => {
    const newValue = !switches[key];
    setSwitches({ ...switches, [key]: newValue });
    setLoading(true);

    try {
      const res = await fetch('/api/admin/switches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: newValue })
      });
      const data = await res.json();
      if (!data.success) {
        alert('저장 실패! 다시 시도해주세요.');
        setSwitches({ ...switches, [key]: !newValue }); // 롤백
      }
    } catch {
      alert('서버 오류! 다시 시도해주세요.');
      setSwitches({ ...switches, [key]: !newValue }); // 롤백
    }
    setLoading(false);
  };

  // ✅ 로그인 성공 시 [마스터 제어판]
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

    const quickActions = [
      { icon: '🤖', label: '반석이 대화', desc: '좌측 하단 채팅 버튼 클릭', action: () => window.dispatchEvent(new Event('banseok:open-chatbot')) },
      { icon: '📋', label: 'AI 분석 도구', desc: '설교 분석 / 주보 체크', action: () => window.location.href = '/admin/ai' },
      { icon: '🛡️', label: '심방 레이더', desc: '돌봄 필요 성도 감지', action: () => window.location.href = '/admin/pastoral-care' },
      { icon: '📖', label: '성경 현황', desc: '전체 성도 진도 관리', action: () => window.location.href = '/admin/bible-status' },
    ];

    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1012 0%, #2a1a1e 60%, #3a252a 100%)', fontFamily: "'Inter', sans-serif" }}>
        {/* 헤더 */}
        <div style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(193,156,114,0.15)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.8rem' }}>👑</span>
            <div>
              <h1 style={{ margin: 0, color: '#fff', fontSize: '1.3rem', fontWeight: 700 }}>스마트 관리자 제어판</h1>
              <p style={{ margin: 0, color: 'rgba(193,156,114,0.8)', fontSize: '0.78rem' }}>반석이를 통해 모든 것을 관리합니다</p>
            </div>
          </div>
          <Link href="/" style={{ color: '#c19c72', textDecoration: 'none', fontSize: '0.85rem', padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(193,156,114,0.3)', transition: 'all 0.2s' }}>← 성전 로비</Link>
        </div>

        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' }}>

          {/* 🤖 반석이 안내 배너 */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(139,92,246,0.1))',
            border: '1px solid rgba(139,92,246,0.3)',
            borderRadius: '16px',
            padding: '1.5rem 2rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            flexWrap: 'wrap'
          }}>
            <div style={{ fontSize: '3rem' }}>🤖</div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <h3 style={{ color: '#A78BFA', margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 700 }}>👑 관리자 반석이가 대기 중입니다</h3>
              <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0, fontSize: '0.9rem', lineHeight: 1.7 }}>
                좌측 하단 <strong style={{ color: '#A78BFA' }}>👑 버튼</strong>을 누르면 관리자 모드 반석이가 열립니다.<br/>
                검색, 지시, 실행, 수정, 파일첨부 등 모든 명령을 수행합니다.
              </p>
            </div>
            <button
              onClick={() => window.dispatchEvent(new Event('banseok:open-chatbot'))}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #7C3AED, #A78BFA)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(124,58,237,0.4)',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              💬 반석이 열기
            </button>
          </div>

          {/* ⚡ 빠른 실행 버튼 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '2rem' }}>
            {quickActions.map((qa, idx) => (
              <button
                key={idx}
                onClick={qa.action}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(193,156,114,0.15)',
                  borderRadius: '14px',
                  padding: '1.2rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'center'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(193,156,114,0.1)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{qa.icon}</div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px' }}>{qa.label}</div>
                <div style={{ color: 'rgba(193,156,114,0.7)', fontSize: '0.75rem' }}>{qa.desc}</div>
              </button>
            ))}
          </div>

          {/* 🗺️ 순례길 스위치 */}
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', padding: '2rem', border: '1px solid rgba(193,156,114,0.12)' }}>
            <h3 style={{ color: '#c19c72', fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🗺️ 영적 순례길 스위치
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {rooms.map((room) => (
                <div key={room.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: switches[room.id] ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                  borderRadius: '12px',
                  border: '1px solid',
                  borderColor: switches[room.id] ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                  transition: '0.3s'
                }}>
                  <span style={{ fontSize: '1rem', fontWeight: 600, color: '#e8e0d8' }}>{room.name}</span>
                  
                  <button 
                    onClick={() => toggleSwitch(room.id)}
                    disabled={loading}
                    style={{
                      width: '52px', height: '28px', borderRadius: '28px', border: 'none',
                      position: 'relative', cursor: loading ? 'wait' : 'pointer',
                      transition: '0.3s',
                      background: switches[room.id] ? '#22C55E' : '#64748B'
                    }}
                  >
                    <div style={{
                      width: '22px', height: '22px', background: 'white', borderRadius: '50%',
                      position: 'absolute', top: '3px',
                      left: switches[room.id] ? '27px' : '3px',
                      transition: '0.3s',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }} />
                  </button>
                </div>
              ))}
            </div>
            <p style={{ color: '#22C55E', fontSize: '0.8rem', marginTop: '15px', textAlign: 'center' }}>✅ DB 연동 완료! 스위치 변경 시 실시간 저장됩니다.</p>
          </div>

          {/* 💡 사용 가이드 */}
          <div style={{
            marginTop: '1.5rem',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '14px',
            padding: '1.5rem',
            border: '1px solid rgba(193,156,114,0.08)'
          }}>
            <h4 style={{ color: '#c19c72', marginBottom: '12px', fontSize: '0.95rem' }}>💡 반석이 관리자 명령어 예시</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
              {[
                { cmd: '"주보 분석해줘"', desc: '📎 파일 첨부 후 → AI가 주보 자동 등록' },
                { cmd: '"심방 레이더 확인"', desc: '돌봄 필요 성도 현황 조회' },
                { cmd: '"설교 추가해줘"', desc: '설교 데이터 DB 등록' },
                { cmd: '"교회 소식 추가"', desc: '교회 공지사항 등록' },
                { cmd: '"스위치 제어"', desc: '순례길 문 열기/닫기' },
                { cmd: '"현황 알려줘"', desc: 'DB 통계 및 시스템 상태' },
              ].map((item, idx) => (
                <div key={idx} style={{ padding: '10px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', fontSize: '0.82rem' }}>
                  <span style={{ color: '#A78BFA', fontWeight: 700 }}>{item.cmd}</span>
                  <br />
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>{item.desc}</span>
                </div>
              ))}
            </div>
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
