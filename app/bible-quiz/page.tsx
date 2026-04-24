"use client";
import React, { useState } from 'react';

export default function BibleQuiz() {
  const [step, setStep] = useState('start');
  const [score, setScore] = useState(0);

  const quizData = {
    question: "하나님이 천지를 창조하실 때 가장 먼저 만드신 것은?",
    options: ["1. 물", "2. 빛", "3. 사람", "4. 동산"],
    answer: 1,
    praise: "창세기 1장 3절 정답! 역시 말씀의 박사님이시네요! 🌟"
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ maxWidth: '450px', width: '100%', padding: '40px 30px', background: 'white', borderRadius: '25px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
        {step === 'start' && (
          <div>
            <div style={{ fontSize: '3rem', marginBottom: '15px' }}>⚔️</div>
            <h2 style={{ color: '#1E3A8A', marginBottom: '15px', fontWeight: 'bold' }}>오늘의 말씀 퀴즈</h2>
            <p style={{ fontSize: '0.95rem', color: '#64748B', marginBottom: '30px', lineHeight: '1.5' }}>오늘 읽으신 말씀을 얼마나 기억하시나요?<br/>도전해 보세요!</p>
            <button onClick={() => setStep('quiz')} style={{ padding: '15px 40px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: '30px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}>게임 시작!</button>
          </div>
        )}

        {step === 'quiz' && (
          <div>
            <p style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '25px', lineHeight: '1.5', color: '#1E293B' }}>{quizData.question}</p>
            <div style={{ display: 'grid', gap: '12px' }}>
              {quizData.options.map((opt, i) => (
                <button 
                  key={i} 
                  onClick={() => {
                    if(i === quizData.answer) { setStep('result'); setScore(100); }
                    else alert("앗! 다시 한 번 생각해 보세요! 🤔");
                  }}
                  style={{ padding: '15px', background: '#F8FAFC', border: '2px solid #E2E8F0', borderRadius: '15px', textAlign: 'left', cursor: 'pointer', fontSize: '1rem', transition: '0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = '#3B82F6'}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = '#E2E8F0'}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'result' && (
          <div style={{ animation: 'bounce 0.5s' }}>
            <div style={{ fontSize: '4rem', marginBottom: '15px' }}>🎊</div>
            <h3 style={{ color: '#059669', fontWeight: 'bold', fontSize: '1.5rem', marginBottom: '10px' }}>정답입니다!</h3>
            <p style={{ fontSize: '0.95rem', color: '#475569', margin: '15px 0', lineHeight: '1.5' }}>{quizData.praise}</p>
            <div style={{ padding: '15px', background: '#ECFDF5', borderRadius: '15px', color: '#047857', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '20px' }}>
              영적 경험치 +100 UP! ⬆️
            </div>
            <button onClick={() => setStep('start')} style={{ background: 'none', border: 'none', color: '#64748B', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.95rem' }}>다시 도전하기</button>
          </div>
        )}
        <style jsx>{`@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }`}</style>
      </div>
    </div>
  );
}
