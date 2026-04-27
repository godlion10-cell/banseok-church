"use client";
/**
 * 🏅 Gold Line Icon Library
 * 
 * Premium single-line gold SVG icons for 거제반석교회 platform.
 * Style: Elegant thin-stroke gold (#C5A55A) on transparent background.
 * All icons are pure inline SVG — zero external files, infinite scaling.
 */

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

const D = '#C5A55A'; // Default gold

// ━━━━━━ 핵심 서비스 아이콘 ━━━━━━

/** 📋 온라인 주보 — Elegant scroll/document */
export function IconBulletin({ size = 32, color = D }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="6" width="28" height="36" rx="3" stroke={color} strokeWidth="1.8"/>
      <line x1="16" y1="15" x2="32" y2="15" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="16" y1="21" x2="32" y2="21" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="16" y1="27" x2="28" y2="27" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="24" cy="35" r="2.5" stroke={color} strokeWidth="1.5"/>
      <path d="M6 12 C6 8, 10 6, 10 6" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
      <path d="M42 12 C42 8, 38 6, 38 6" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
    </svg>
  );
}

/** 🎬 설교 영상 — Film/Play button */
export function IconSermonVideo({ size = 32, color = D }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="10" width="36" height="24" rx="4" stroke={color} strokeWidth="1.8"/>
      <polygon points="20,17 20,29 32,23" fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
      <line x1="12" y1="38" x2="36" y2="38" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="24" cy="38" r="1.5" fill={color} opacity="0.6"/>
    </svg>
  );
}

/** 📻 설교 라디오 — Elegant radio waves */
export function IconRadio({ size = 32, color = D }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="16" width="32" height="24" rx="4" stroke={color} strokeWidth="1.8"/>
      <circle cx="20" cy="28" r="6" stroke={color} strokeWidth="1.5"/>
      <circle cx="20" cy="28" r="2" fill={color} opacity="0.5"/>
      <line x1="32" y1="22" x2="36" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="32" y1="26" x2="36" y2="26" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="32" y1="30" x2="36" y2="30" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="30" y1="16" x2="20" y2="6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="20" cy="5" r="1.5" fill={color} opacity="0.6"/>
    </svg>
  );
}

/** 📖 성경 퀴즈 — Open book with star */
export function IconBibleQuiz({ size = 32, color = D }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 38 L6 34 V10 L24 14 L42 10 V34 Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
      <line x1="24" y1="14" x2="24" y2="38" stroke={color} strokeWidth="1.5"/>
      <path d="M24 8 L25.5 11 L29 11.5 L26.5 14 L27 17.5 L24 16 L21 17.5 L21.5 14 L19 11.5 L22.5 11 Z" fill={color} opacity="0.4" stroke={color} strokeWidth="0.8"/>
    </svg>
  );
}

// ━━━━━━ 신앙 생활 아이콘 ━━━━━━

/** 📖 나의 성경 — Bible with cross */
export function IconMyBible({ size = 32, color = D }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="6" width="28" height="36" rx="3" stroke={color} strokeWidth="1.8"/>
      <line x1="10" y1="6" x2="10" y2="42" stroke={color} strokeWidth="2.5"/>
      <line x1="24" y1="14" x2="24" y2="28" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="18" y1="20" x2="30" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M14 6 C14 6, 14 4, 16 4 L34 4 C36 4, 36 6, 36 6" stroke={color} strokeWidth="1.2" opacity="0.4"/>
    </svg>
  );
}

/** 🚪 새가족 등록 — Door with heart */
export function IconNewcomer({ size = 32, color = D }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="6" width="24" height="36" rx="2" stroke={color} strokeWidth="1.8"/>
      <path d="M12 6 L8 10 V42 L12 42" stroke={color} strokeWidth="1.2" opacity="0.4"/>
      <circle cx="30" cy="24" r="2" fill={color} opacity="0.6"/>
      <path d="M24 16 C22 14, 19 14.5, 19 17 C19 19, 24 23, 24 23 C24 23, 29 19, 29 17 C29 14.5, 26 14, 24 16 Z" stroke={color} strokeWidth="1.2" fill={color} opacity="0.2"/>
    </svg>
  );
}

/** 👶 다음세대 — Sprouting seedling */
export function IconNextGen({ size = 32, color = D }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 42 V24" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M24 24 C24 24, 14 22, 14 14 C14 10, 18 8, 24 12" stroke={color} strokeWidth="1.8" fill="none"/>
      <path d="M24 20 C24 20, 34 18, 34 10 C34 6, 30 4, 24 8" stroke={color} strokeWidth="1.8" fill="none"/>
      <path d="M24 28 C20 28, 16 30, 16 30" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.4"/>
      <path d="M24 28 C28 28, 32 30, 32 30" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.4"/>
      <ellipse cx="24" cy="44" rx="8" ry="2" fill={color} opacity="0.15"/>
    </svg>
  );
}

/** 🤝 이음돌 — Connected hands */
export function IconIeumdol({ size = 32, color = D }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 28 C8 28, 14 20, 20 22 C22 22.5, 24 24, 24 24" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      <path d="M40 28 C40 28, 34 20, 28 22 C26 22.5, 24 24, 24 24" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      <circle cx="24" cy="14" r="4" stroke={color} strokeWidth="1.5"/>
      <path d="M24 14 L24.8 16 L27 16.3 L25.5 17.8 L25.8 20 L24 19 L22.2 20 L22.5 17.8 L21 16.3 L23.2 16 Z" fill={color} opacity="0.3"/>
      <path d="M12 32 L36 32" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeDasharray="3 3" opacity="0.4"/>
    </svg>
  );
}

// ━━━━━━ 영적 순례길 아이콘 ━━━━━━

/** 🚪 좁은 문 */
export function IconNarrowGate({ size = 28, color = D }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 36 V8 C12 6, 14 4, 20 4 C26 4, 28 6, 28 8 V36" stroke={color} strokeWidth="1.5" fill="none"/>
      <line x1="12" y1="36" x2="28" y2="36" stroke={color} strokeWidth="1.5"/>
      <line x1="20" y1="4" x2="20" y2="36" stroke={color} strokeWidth="0.8" opacity="0.3"/>
      <circle cx="23" cy="20" r="1.5" fill={color} opacity="0.5"/>
      <path d="M8 36 L12 36" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M28 36 L32 36" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

/** ✝️ 십자가 언덕 */
export function IconCrossHill({ size = 28, color = D }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 34 Q20 20, 34 34" stroke={color} strokeWidth="1.5" fill="none"/>
      <line x1="20" y1="6" x2="20" y2="30" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="14" y1="13" x2="26" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M20 6 L20.5 4 L20 3 L19.5 4 Z" fill={color} opacity="0.6"/>
    </svg>
  );
}

/** 🛡️ 무기고 */
export function IconArmory({ size = 28, color = D }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 4 L6 12 V22 C6 30, 20 38, 20 38 C20 38, 34 30, 34 22 V12 Z" stroke={color} strokeWidth="1.8" fill="none"/>
      <line x1="20" y1="14" x2="20" y2="24" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="15" y1="19" x2="25" y2="19" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

/** 🌑 사망의 음침한 골짜기 */
export function IconValley({ size = 28, color = D }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 12 L14 34 L20 24 L26 34 L36 12" stroke={color} strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
      <circle cx="20" cy="10" r="4" stroke={color} strokeWidth="1.2"/>
      <path d="M18 9 L19 11 L21 11 L19.5 12.5 L20 14.5 L18.5 13 L17 14.5 L17.5 12.5 L16 11 L18 11 Z" fill={color} opacity="0.4"/>
    </svg>
  );
}

/** 🎪 허영의 시장 */
export function IconVanityFair({ size = 28, color = D }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 16 Q10 6, 20 6 Q30 6, 34 16" stroke={color} strokeWidth="1.5" fill="none"/>
      <rect x="6" y="16" width="28" height="18" rx="2" stroke={color} strokeWidth="1.5"/>
      <line x1="20" y1="6" x2="20" y2="2" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M18 1 L20 3 L22 1" stroke={color} strokeWidth="1" opacity="0.5"/>
      <line x1="14" y1="22" x2="14" y2="28" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
      <line x1="20" y1="22" x2="20" y2="28" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
      <line x1="26" y1="22" x2="26" y2="28" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
    </svg>
  );
}

/** ⛰️ 기쁨의 산 */
export function IconJoyMountain({ size = 28, color = D }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 34 L16 10 L22 18 L28 8 L36 34" stroke={color} strokeWidth="1.8" fill="none" strokeLinejoin="round"/>
      <circle cx="32" cy="8" r="3" stroke={color} strokeWidth="1.2"/>
      <path d="M30.5 7 L32 5 L33.5 7" stroke={color} strokeWidth="0.8" opacity="0.5"/>
    </svg>
  );
}

/** 🎫 천성 여권 */
export function IconPassport({ size = 28, color = D }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="4" width="24" height="32" rx="3" stroke={color} strokeWidth="1.8"/>
      <circle cx="20" cy="18" r="6" stroke={color} strokeWidth="1.5"/>
      <path d="M14 18 Q20 12, 26 18" stroke={color} strokeWidth="0.8" opacity="0.4"/>
      <path d="M14 18 Q20 24, 26 18" stroke={color} strokeWidth="0.8" opacity="0.4"/>
      <line x1="14" y1="30" x2="26" y2="30" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="16" y1="34" x2="24" y2="34" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
    </svg>
  );
}

/** 🗺️ 전체 지도 */
export function IconMap({ size = 28, color = D }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 8 L14 4 L26 10 L36 6 V32 L26 36 L14 30 L4 34 Z" stroke={color} strokeWidth="1.5" fill="none"/>
      <line x1="14" y1="4" x2="14" y2="30" stroke={color} strokeWidth="1" opacity="0.4"/>
      <line x1="26" y1="10" x2="26" y2="36" stroke={color} strokeWidth="1" opacity="0.4"/>
      <circle cx="20" cy="18" r="2" fill={color} opacity="0.4"/>
      <path d="M20 16 L20 14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

// ━━━━━━ 골드 아이콘 래퍼 (hover 효과 포함) ━━━━━━

interface GoldIconCardProps {
  icon: React.ReactNode;
  name: string;
  dark?: boolean;
  compact?: boolean;
}

export function GoldIconCard({ icon, name, dark = false, compact = false }: GoldIconCardProps) {
  return (
    <div className="gold-icon-card" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: compact ? '5px' : '10px',
      padding: compact ? '12px 4px' : '20px 8px',
      borderRadius: compact ? '12px' : '16px',
      background: dark
        ? (compact ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.04)')
        : (compact ? 'rgba(255,255,255,0.7)' : 'white'),
      boxShadow: dark || compact ? 'none' : '0 2px 12px rgba(197,165,90,0.08)',
      border: dark
        ? '1px solid rgba(197,165,90,0.12)'
        : '1px solid rgba(197,165,90,0.15)',
      transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
      cursor: 'pointer',
    }}>
      <div style={{ transition: 'transform 0.3s', display: 'flex' }}>
        {icon}
      </div>
      <span style={{
        fontSize: compact ? '0.68rem' : '0.78rem',
        fontWeight: 700,
        color: dark ? '#C5A55A' : '#5B272F',
        textAlign: 'center', lineHeight: 1.2,
        letterSpacing: '-0.01em',
      }}>{name}</span>

      <style>{`
        .gold-icon-card:hover {
          transform: scale(1.05) translateY(-2px);
          box-shadow: 0 6px 20px rgba(197,165,90,0.15) !important;
          border-color: rgba(197,165,90,0.35) !important;
        }
        .gold-icon-card:active {
          transform: scale(0.98);
        }
      `}</style>
    </div>
  );
}
