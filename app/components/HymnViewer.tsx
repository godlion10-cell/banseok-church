"use client";
import React, { useState } from 'react';

/**
 * 🎵 Zero-Error Hymn Display System
 * 
 * 찬송가 번호를 받아 로컬 /assets/hymns/{번호}.jpg (또는 .svg) 이미지를 표시합니다.
 * - 실제 악보 이미지(.jpg)가 있으면 우선 표시
 * - 없으면 자동 생성된 SVG 플레이스홀더 표시
 * - 네트워크 의존 없이 로컬 에셋으로 100% 오프라인 안정성
 */

interface HymnViewerProps {
  hymnNumber: number;
  hymnTitle?: string;    // AI가 추출한 찬송가 제목 (선택)
  compact?: boolean;     // 컴팩트 모드 (목록에서 사용)
}

export default function HymnViewer({ hymnNumber, hymnTitle, compact = false }: HymnViewerProps) {
  const [imageType, setImageType] = useState<'jpg' | 'svg'>('jpg');
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [imageError, setImageError] = useState(false);

  // 🎯 Zero-Error 이미지 경로 결정: jpg → svg → 에러 fallback
  const getImagePath = () => {
    if (imageType === 'jpg') return `/assets/hymns/${hymnNumber}.jpg`;
    return `/assets/hymns/${hymnNumber}.svg`;
  };

  const handleImageError = () => {
    if (imageType === 'jpg') {
      // jpg 실패 → svg 시도
      setImageType('svg');
    } else {
      // svg도 실패 → 에러 UI
      setImageError(true);
    }
  };

  // 유효 범위 체크 (새찬송가 1~645장)
  if (hymnNumber < 1 || hymnNumber > 645) {
    return null;
  }

  // ═══ 컴팩트 모드: 목록에서 작은 카드로 표시 ═══
  if (compact) {
    return (
      <>
        <div
          onClick={() => setShowFullscreen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '14px',
            padding: '14px 18px', background: '#FFFBF5',
            borderRadius: '14px', marginBottom: '10px',
            border: '1px solid #E8DDD0',
            cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(139,69,19,0.06)',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(139,69,19,0.12)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(139,69,19,0.06)'; }}
        >
          {/* 번호 배지 */}
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #5B272F, #8B4513)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: '800', fontSize: '1rem',
            flexShrink: 0, boxShadow: '0 3px 10px rgba(91,39,47,0.3)',
          }}>
            {hymnNumber}
          </div>

          {/* 정보 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: '700', color: '#3E2723', fontSize: '0.95rem' }}>
              찬송가 {hymnNumber}장
            </div>
            {hymnTitle && (
              <div style={{ color: '#8D6E63', fontSize: '0.82rem', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                ♪ {hymnTitle}
              </div>
            )}
          </div>

          {/* 보기 아이콘 */}
          <div style={{ color: '#C19C72', fontSize: '1.2rem', flexShrink: 0 }}>🎵</div>
        </div>

        {/* 풀스크린 오버레이 */}
        {showFullscreen && (
          <div
            onClick={() => setShowFullscreen(false)}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(15,10,5,0.95)', zIndex: 99999,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '20px', cursor: 'pointer',
            }}
          >
            <div style={{ color: '#C19C72', fontSize: '0.9rem', marginBottom: '12px', letterSpacing: '0.1em' }}>
              찬송가 {hymnNumber}장 {hymnTitle ? `— ${hymnTitle}` : ''}
            </div>
            {!imageError ? (
              <img
                src={getImagePath()}
                alt={`찬송가 ${hymnNumber}장`}
                onError={handleImageError}
                style={{
                  maxWidth: '95vw', maxHeight: '80vh',
                  borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                  objectFit: 'contain', background: 'white',
                }}
              />
            ) : (
              <div style={{ padding: '40px', background: '#FFF8F0', borderRadius: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🎵</div>
                <div style={{ color: '#5B272F', fontWeight: '700', fontSize: '2rem' }}>{hymnNumber}장</div>
                {hymnTitle && <div style={{ color: '#8B6914', marginTop: '8px' }}>{hymnTitle}</div>}
                <div style={{ color: '#A0937D', fontSize: '0.8rem', marginTop: '12px' }}>악보 이미지를 준비 중입니다</div>
              </div>
            )}
            <button
              onClick={() => setShowFullscreen(false)}
              style={{
                marginTop: '20px', padding: '12px 36px',
                background: 'rgba(193,156,114,0.2)', color: '#C19C72',
                border: '1px solid rgba(193,156,114,0.4)', borderRadius: '30px',
                fontSize: '0.95rem', cursor: 'pointer',
              }}
            >
              닫기
            </button>
          </div>
        )}
      </>
    );
  }

  // ═══ 풀 모드: 단독 악보 뷰어 ═══
  return (
    <div style={{
      background: '#FFFBF5', borderRadius: '20px',
      border: '1px solid #E8DDD0', overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(139,69,19,0.08)',
      marginBottom: '16px',
    }}>
      {/* 헤더 */}
      <div style={{
        background: 'linear-gradient(135deg, #5B272F, #8B4513)',
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.3rem' }}>🎵</span>
          <div>
            <div style={{ color: 'white', fontWeight: '800', fontSize: '1.05rem' }}>
              찬송가 {hymnNumber}장
            </div>
            {hymnTitle && (
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', marginTop: '2px' }}>
                {hymnTitle}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowFullscreen(true)}
          style={{
            padding: '6px 14px', background: 'rgba(255,255,255,0.15)',
            color: 'white', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '20px', fontSize: '0.78rem', cursor: 'pointer',
          }}
        >
          🔍 크게보기
        </button>
      </div>

      {/* 악보 이미지 */}
      <div style={{ padding: '16px' }}>
        {!imageError ? (
          <img
            src={getImagePath()}
            alt={`찬송가 ${hymnNumber}장${hymnTitle ? ` - ${hymnTitle}` : ''}`}
            onError={handleImageError}
            onClick={() => setShowFullscreen(true)}
            style={{
              width: '100%', height: 'auto', borderRadius: '12px',
              cursor: 'pointer', transition: 'transform 0.2s',
              boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
            }}
          />
        ) : (
          <div style={{
            padding: '40px', textAlign: 'center',
            background: 'linear-gradient(135deg, #FFF8F0, #F5E6D3)',
            borderRadius: '12px', border: '2px dashed #D4A574',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎵</div>
            <div style={{ color: '#5B272F', fontWeight: '800', fontSize: '2.5rem' }}>{hymnNumber}장</div>
            {hymnTitle && <div style={{ color: '#8B6914', fontSize: '1.1rem', marginTop: '8px', fontWeight: '600' }}>{hymnTitle}</div>}
            <div style={{ color: '#A0937D', fontSize: '0.82rem', marginTop: '16px' }}>
              악보 이미지를 /public/assets/hymns/{hymnNumber}.jpg 에 넣어주세요
            </div>
          </div>
        )}
      </div>

      {/* 풀스크린 */}
      {showFullscreen && (
        <div
          onClick={() => setShowFullscreen(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15,10,5,0.95)', zIndex: 99999,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '20px', cursor: 'pointer',
          }}
        >
          <div style={{ color: '#C19C72', fontSize: '1rem', marginBottom: '15px', letterSpacing: '0.15em', fontWeight: '600' }}>
            🎵 찬송가 {hymnNumber}장 {hymnTitle ? `— ${hymnTitle}` : ''}
          </div>
          {!imageError ? (
            <img
              src={getImagePath()}
              alt={`찬송가 ${hymnNumber}장`}
              onError={handleImageError}
              style={{
                maxWidth: '95vw', maxHeight: '80vh',
                borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                objectFit: 'contain', background: 'white',
              }}
            />
          ) : (
            <div style={{ padding: '50px', background: '#FFF8F0', borderRadius: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '10px' }}>🎵</div>
              <div style={{ color: '#5B272F', fontWeight: '800', fontSize: '3rem' }}>{hymnNumber}장</div>
            </div>
          )}
          <button
            onClick={() => setShowFullscreen(false)}
            style={{
              marginTop: '20px', padding: '14px 40px',
              background: 'rgba(193,156,114,0.2)', color: '#C19C72',
              border: '1px solid rgba(193,156,114,0.4)', borderRadius: '30px',
              fontSize: '1rem', fontWeight: '600', cursor: 'pointer',
            }}
          >
            닫기
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * 🔢 찬송가 텍스트에서 번호 추출 유틸리티
 * "28장 복의 근원 강림하사" → { number: 28, title: "복의 근원 강림하사" }
 * "찬 94" → { number: 94, title: "" }
 * "새94" → { number: 94, title: "" }
 */
export function parseHymnNumber(text: string): { number: number; title: string } | null {
  if (!text) return null;
  
  // 패턴들: "28장", "찬 28", "새28", "찬송 28", "#28", "No.28"
  const patterns = [
    /(\d{1,3})\s*장\s*(.*)/,           // 28장 복의 근원...
    /(?:찬|찬송|새)\s*(\d{1,3})\s*(.*)/,  // 찬 28, 새28
    /(?:#|No\.?)\s*(\d{1,3})\s*(.*)/i,    // #28, No.28
    /^(\d{1,3})\s+(.*)/,                   // 28 복의 근원...
  ];
  
  for (const pattern of patterns) {
    const match = text.trim().match(pattern);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num >= 1 && num <= 645) {
        return { number: num, title: (match[2] || '').trim() };
      }
    }
  }
  
  // 숫자만 있는 경우
  const numOnly = text.trim().match(/^(\d{1,3})$/);
  if (numOnly) {
    const num = parseInt(numOnly[1], 10);
    if (num >= 1 && num <= 645) return { number: num, title: '' };
  }
  
  return null;
}
