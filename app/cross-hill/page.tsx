"use client";
import React, { useState } from 'react';

export default function CrossHillPage() {
  const [prayer, setPrayer] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prayer.trim()) return alert('내려놓으실 마음의 짐을 적어주세요.');

    setIsLoading(true);

    // 📱 목사님 텔레그램으로 기도 제목 전달
    const BOT_TOKEN = "8538286497:AAG0QaI4dnjsBMmv82gMNpWiLlYYGdyeBFg";
    const CHAT_ID = "8747696435";
    
    // 텔레그램에 예쁘게 보일 메시지 포맷
    const text = `🙏 [십자가 언덕 누군가의 기도]\n\n"${prayer}"\n\n목사님, 기도가 필요합니다.`;

    try {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(text)}`);
      setIsSubmitted(true);
    } catch (error) {
      console.error("텔레그램 발송 오류:", error);
      alert("일시적인 오류가 발생했습니다. 다시 시도해주세요.");
    }
    setIsLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#111827', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      
      {isSubmitted ? (
        // ✅ 제출 완료 후 은혜로운 화면
        <div style={{ textAlign: 'center', animation: 'fadeIn 2s' }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🕊️</div>
          <h2 style={{ color: '#FDE047', fontSize: '2rem', marginBottom: '15px' }}>무거운 짐이 십자가 아래로 내려졌습니다.</h2>
          <p style={{ color: '#D1D5DB', fontSize: '1.2rem', lineHeight: '1.6', maxWidth: '500px' }}>
            &ldquo;수고하고 무거운 짐 진 자들아 다 내게로 오라 내가 너희를 쉬게 하리라&rdquo; (마 11:28)<br/><br/>
            성도님의 기도는 목사님께 안전하게 전달되었습니다.<br/>그리스도의 보혈이 성도님의 마음을 덮기를 축복합니다.
          </p>
          <button 
            onClick={() => { setPrayer(''); setIsSubmitted(false); }} 
            style={{ marginTop: '30px', padding: '10px 20px', background: 'transparent', color: '#9CA3AF', border: '1px solid #4B5563', borderRadius: '8px', cursor: 'pointer' }}>
            돌아가기
          </button>
        </div>
      ) : (
        // ✍️ 기도 제목 입력 화면
        <div style={{ width: '100%', maxWidth: '500px', textAlign: 'center' }}>
          <h2 style={{ color: '#FCA5A5', fontSize: '2.5rem', marginBottom: '10px', fontWeight: 'bold' }}>✝️ 십자가 언덕</h2>
          <p style={{ color: '#9CA3AF', marginBottom: '30px', fontSize: '1.1rem' }}>
            누구에게도 말하지 못한 무거운 죄의 짐, 아픔, 기도 제목을<br/>이곳 십자가 앞에 익명으로 내려놓으세요.
          </p>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <textarea 
              value={prayer}
              onChange={(e) => setPrayer(e.target.value)}
              placeholder="하나님, 저는 지금..."
              style={{ width: '100%', height: '200px', padding: '20px', borderRadius: '15px', border: 'none', background: '#1F2937', color: 'white', fontSize: '1.1rem', resize: 'none', outline: 'none', boxSizing: 'border-box', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)' }}
            />
            <button 
              type="submit" 
              disabled={isLoading}
              style={{ background: '#B91C1C', color: 'white', border: 'none', padding: '18px', borderRadius: '15px', fontSize: '1.2rem', fontWeight: 'bold', cursor: isLoading ? 'not-allowed' : 'pointer', transition: '0.2s', boxShadow: '0 4px 15px rgba(220, 38, 38, 0.4)' }}>
              {isLoading ? '내려놓는 중...' : '십자가 앞에 내려놓기'}
            </button>
          </form>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
