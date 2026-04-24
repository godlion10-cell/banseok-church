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
    <div style={{ padding: '20px', background: 'white', borderRadius: '20px', textAlign: 'center', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}>
      {step === 'start' && (
        <div>
          <h4 style={{ color: '#1E3A8A', marginBottom: '15px' }}>오늘의 말씀 퀴즈 ⚔️</h4>
          <p style={{ fontSize: '0.9rem', color: '#64748B', marginBottom: '20px' }}>오늘 읽으신 말씀을 얼마나 기억하시나요?</p>
          <button onClick={() => setStep('quiz')} style={{ padding: '10px 25px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer' }}>게임 시작!</button>
        </div>
      )}

      {step === 'quiz' && (
        <div>
          <p style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '20px', lineHeight: '1.4' }}>{quizData.question}</p>
          <div style={{ display: 'grid', gap: '10px' }}>
            {quizData.options.map((opt, i) => (
              <button 
                key={i} 
                onClick={() => {
                  if(i === quizData.answer) { setStep('result'); setScore(100); }
                  else alert("앗! 다시 한 번 생각해 보세요! 🤔");
                }}
                style={{ padding: '12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', textAlign: 'left', cursor: 'pointer', transition: '0.2s' }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'result' && (
        <div style={{ animation: 'bounce 0.5s' }}>
          <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🎊</div>
          <h3 style={{ color: '#059669', fontWeight: 'bold' }}>정답입니다!</h3>
          <p style={{ fontSize: '0.9rem', color: '#475569', margin: '15px 0' }}>{quizData.praise}</p>
          <div style={{ padding: '10px', background: '#ECFDF5', borderRadius: '10px', color: '#047857', fontWeight: 'bold' }}>
            영적 경험치 +100 UP! ⬆️
          </div>
          <button onClick={() => setStep('start')} style={{ marginTop: '20px', background: 'none', border: 'none', color: '#64748B', textDecoration: 'underline', cursor: 'pointer' }}>닫기</button>
        </div>
      )}
      <style jsx>{`@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }`}</style>
    </div>
  );
}
