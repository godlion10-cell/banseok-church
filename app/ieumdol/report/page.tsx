"use client";
import React, { useState } from 'react';
import { sendEumdolReport } from '../../actions/telegram';

type MemberPrayer = { name: string; prayer: string };

export default function IeumdolReportPage() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [eumdolName, setEumdolName] = useState('');
  const [leaderName, setLeaderName] = useState('');
  const [attendance, setAttendance] = useState(0);
  const [note, setNote] = useState('');
  
  const [members, setMembers] = useState<MemberPrayer[]>([
    { name: '', prayer: '' }
  ]);

  const addMember = () => setMembers([...members, { name: '', prayer: '' }]);
  const removeMember = (idx: number) => setMembers(members.filter((_, i) => i !== idx));
  const updateMember = (idx: number, field: 'name' | 'prayer', value: string) => {
    const updated = [...members];
    updated[idx][field] = value;
    setMembers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eumdolName || !leaderName) {
      alert('이음돌명과 리더 이름을 입력해주세요!');
      return;
    }
    setSending(true);

    const result = await sendEumdolReport({
      eumdolName,
      leaderName,
      attendance,
      members: members.filter(m => m.name.trim() !== ''),
      note
    });

    setSending(false);
    if (result.success) {
      setSubmitted(true);
    } else {
      alert('전송 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #EFF6FF, #DBEAFE)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ background: 'white', padding: '40px 30px', borderRadius: '30px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', maxWidth: '400px', width: '100%', animation: 'popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>✅</div>
          <h2 style={{ color: '#1E3A8A', fontSize: '1.6rem', fontWeight: 'bold', marginBottom: '10px' }}>이음돌 보고 완료!</h2>
          <p style={{ color: '#475569', lineHeight: '1.6', marginBottom: '20px' }}>
            목사님 텔레그램으로 보고가 전송되었습니다.<br/>성도별 기도제목도 함께 전달되었습니다. 🙏
          </p>
          <button onClick={() => window.location.href='/'} style={{ padding: '15px 30px', background: '#1E3A8A', color: 'white', border: 'none', borderRadius: '15px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>
            홈으로 돌아가기
          </button>
        </div>
        <style jsx>{`@keyframes popIn { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FDFCFB', padding: '40px 20px' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ color: '#1E3A8A', fontWeight: 'bold', fontSize: '1.8rem' }}>🪨 이음돌 모임 보고</h2>
          <p style={{ color: '#64748B' }}>오늘 나눈 은혜와 기도제목을 기록해 주세요.</p>
        </header>

        <form onSubmit={handleSubmit} style={{ background: 'white', padding: '25px', borderRadius: '25px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            <label style={labelStyle}>🪨 이음돌명</label>
            <select value={eumdolName} onChange={(e) => setEumdolName(e.target.value)} required style={inputStyle}>
              <option value="">선택해주세요</option>
              <option>제1이음돌 (소오비)</option>
              <option>제2이음돌 (내곡)</option>
              <option>제3이음돌 (중앙)</option>
              <option>제4이음돌 (연초)</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>👤 리더 이름</label>
            <input type="text" value={leaderName} onChange={(e) => setLeaderName(e.target.value)} required placeholder="리더 성함" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>👥 참석 인원</label>
            <input type="number" value={attendance || ''} onChange={(e) => setAttendance(Number(e.target.value))} placeholder="명" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>🙏 성도별 기도제목</label>
            <p style={{ fontSize: '0.85rem', color: '#94A3B8', marginBottom: '10px' }}>각 성도의 이름과 기도제목을 매칭해 주세요.</p>
            
            {members.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
                <input type="text" value={m.name} onChange={(e) => updateMember(i, 'name', e.target.value)} placeholder="성도 이름" style={{ ...inputStyle, flex: 1 }} />
                <input type="text" value={m.prayer} onChange={(e) => updateMember(i, 'prayer', e.target.value)} placeholder="기도제목" style={{ ...inputStyle, flex: 2 }} />
                {members.length > 1 && (
                  <button type="button" onClick={() => removeMember(i)} style={{ background: '#FEE2E2', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: '#DC2626', cursor: 'pointer', flexShrink: 0, fontSize: '0.9rem' }}>✕</button>
                )}
              </div>
            ))}

            <button type="button" onClick={addMember} style={{ width: '100%', padding: '10px', background: '#F1F5F9', border: '2px dashed #CBD5E1', borderRadius: '12px', color: '#64748B', cursor: 'pointer', fontWeight: 'bold' }}>
              + 성도 추가
            </button>
          </div>

          <div>
            <label style={labelStyle}>📝 추가 보고사항</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="목사님께 전달할 내용을 적어주세요." style={{ ...inputStyle, height: '100px', resize: 'none' }} />
          </div>

          <button type="submit" disabled={sending} style={{ padding: '18px', background: sending ? '#94A3B8' : '#1E3A8A', color: 'white', border: 'none', borderRadius: '15px', fontWeight: 'bold', fontSize: '1.1rem', cursor: sending ? 'wait' : 'pointer' }}>
            {sending ? '📲 텔레그램 전송 중...' : '🪨 이음돌 보고 완료 ➤'}
          </button>
        </form>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#334155' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '0.95rem', boxSizing: 'border-box' };
