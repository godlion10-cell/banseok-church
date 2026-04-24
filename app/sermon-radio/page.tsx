"use client";
import React, { useState, useRef } from 'react';

export default function SermonRadioPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('00:00');
  const [duration, setDuration] = useState('00:00');
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentSermon = {
    title: "사망의 음침한 골짜기를 지날 때",
    date: "2026. 04. 19 주일 2부",
    preacher: "담임목사님",
    audioSrc: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const total = audioRef.current.duration;
      setProgress((current / total) * 100);
      setCurrentTime(formatTime(current));
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(formatTime(audioRef.current.duration));
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current) {
      const bar = e.currentTarget;
      const clickPosition = e.nativeEvent.offsetX;
      const newTime = (clickPosition / bar.offsetWidth) * audioRef.current.duration;
      audioRef.current.currentTime = newTime;
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'sans-serif' }}>
      
      <div style={{ maxWidth: '400px', width: '100%', background: '#1E293B', padding: '40px 25px', borderRadius: '30px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', textAlign: 'center' }}>
        
        <div style={{ background: '#334155', display: 'inline-block', padding: '8px 16px', borderRadius: '20px', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '30px', fontWeight: 'bold' }}>
          🎧 데이터 절약 라디오 모드
        </div>

        <div style={{ width: '180px', height: '180px', background: 'linear-gradient(135deg, #2563EB, #9333EA)', borderRadius: '50%', margin: '0 auto 30px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(147, 51, 234, 0.4)', animation: isPlaying ? 'spin 15s linear infinite' : 'none' }}>
          <span style={{ fontSize: '4rem' }}>📖</span>
        </div>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '10px', lineHeight: '1.4' }}>{currentSermon.title}</h2>
        <p style={{ color: '#94A3B8', fontSize: '1rem', marginBottom: '30px' }}>{currentSermon.preacher} | {currentSermon.date}</p>

        <audio 
          ref={audioRef} 
          src={currentSermon.audioSrc} 
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
        />

        <div style={{ marginBottom: '30px' }}>
          <div onClick={handleProgressClick} style={{ width: '100%', height: '8px', background: '#334155', borderRadius: '5px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: '#3B82F6', transition: 'width 0.1s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.85rem', color: '#64748B' }}>
            <span>{currentTime}</span>
            <span>{duration}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '30px' }}>
          <button style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.8rem', cursor: 'pointer' }}>⏮</button>
          
          <button onClick={togglePlay} style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'white', color: '#0F172A', border: 'none', fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,0,0,0.3)', transition: 'transform 0.2s' }}
                  onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                  onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}>
            {isPlaying ? '⏸' : '▶'}
          </button>
          
          <button style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.8rem', cursor: 'pointer' }}>⏭</button>
        </div>

      </div>

      <style jsx>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
