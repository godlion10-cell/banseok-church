/**
 * 🧠 중앙 신경망 — actionDispatcher.ts
 * 
 * 반석이의 모든 액션을 일원화하고, 관리자/일반 권한을 분리합니다.
 * 일반 성도가 수정/삭제 명령을 내려도 여기서 차단됩니다.
 */

// ━━━ 1. 공용 액션 (일반 성도 + 관리자 모두 사용 가능) ━━━
const PUBLIC_ACTIONS: Record<string, { label: string; path: string }> = {
  'NAVIGATE_HOME':          { label: '🏠 홈으로', path: '/' },
  'NAVIGATE_SERMON_VIDEO':  { label: '🎬 설교 영상', path: '/sermon-video' },
  'NAVIGATE_SERMON_RADIO':  { label: '📻 설교 라디오', path: '/sermon-radio' },
  'NAVIGATE_BULLETIN':      { label: '📋 온라인 주보', path: '/bulletin' },
  'NAVIGATE_VISITATION':    { label: '📅 심방/상담 예약', path: '/visitation' },
  'NAVIGATE_WELCOME':       { label: '🚪 새가족 등록', path: '/welcome' },
  'NAVIGATE_BIBLE':         { label: '📖 성경 일독', path: '/bible-manager' },
  'NAVIGATE_NEXT_GEN':      { label: '📊 다음세대', path: '/next-gen' },
  'NAVIGATE_PILGRIM':       { label: '🏔️ 순례길', path: '/pilgrim' },
};

// ━━━ 2. 관리자 전용 액션 (👑 관리자 모드에서만 실행) ━━━
const ADMIN_ACTIONS: Record<string, { label: string; path?: string; apiCall?: string }> = {
  'ADMIN_DASHBOARD':        { label: '👑 관리자 대시보드', path: '/admin' },
  'ADMIN_BIBLE_STATUS':     { label: '📖 성경 현황', path: '/admin/bible-status' },
  'ADMIN_PASTORAL_CARE':    { label: '🛡️ 심방 레이더', path: '/admin/pastoral-care' },
  'ADMIN_IEUMDOL':          { label: '👑 이음돌 현황', path: '/admin/ieumdol-status' },
  'ADMIN_AI':               { label: '🤖 AI 분석 도구', path: '/admin/ai' },
  'ADMIN_REFRESH_BULLETIN': { label: '📋 주보 새로고침', apiCall: '/api/revalidate?path=/bulletin' },
  'ADMIN_REFRESH_SERMONS':  { label: '🎬 설교 새로고침', apiCall: '/api/revalidate?path=/sermon-video' },
  'ADMIN_SWITCH_CONTROL':   { label: '🎛️ 순례길 스위치', path: '/admin' },
};

// ━━━ 3. 위험 키워드 — 일반 성도가 입력해도 무시할 단어들 ━━━
const DANGEROUS_KEYWORDS = ['수정', '삭제', '지워', '변경', '업로드', '등록', '추가해', '업데이트', '갱신'];

export type DispatchResult = {
  allowed: boolean;
  message?: string;     // 사용자에게 보여줄 응답
  navigate?: string;    // router.push 경로
  apiCall?: string;     // fetch 호출 URL
};

/**
 * 🧠 중앙 명령 실행기
 * @param actionCode - 액션 코드 (예: 'NAVIGATE_SERMON_VIDEO', 'ADMIN_REFRESH_BULLETIN')
 * @param isAdminMode - 현재 관리자 모드인지 여부
 */
export function executeBanseokAction(actionCode: string, isAdminMode: boolean): DispatchResult {
  if (!actionCode) return { allowed: false };

  // 1️⃣ 공용 액션 — 누구나 실행 가능
  if (PUBLIC_ACTIONS[actionCode]) {
    const action = PUBLIC_ACTIONS[actionCode];
    return { allowed: true, navigate: action.path, message: `${action.label} 페이지로 이동합니다.` };
  }

  // 2️⃣ 관리자 액션 — 👑 관리자 모드에서만 실행
  if (ADMIN_ACTIONS[actionCode]) {
    if (!isAdminMode) {
      console.error(`⛔ [보안 차단] 일반 사용자가 관리자 액션 시도: ${actionCode}`);
      return { 
        allowed: false, 
        message: '⛔ 이 기능은 관리자 전용입니다. 관리자 모드에서 이용해주세요.' 
      };
    }
    const action = ADMIN_ACTIONS[actionCode];
    return { 
      allowed: true, 
      navigate: action.path, 
      apiCall: action.apiCall,
      message: `👑 ${action.label} 실행합니다, 사장님.` 
    };
  }

  return { allowed: false, message: '알 수 없는 명령입니다.' };
}

/**
 * 🛡️ 일반 성도 위험 키워드 차단기
 * 일반 모드에서 수정/삭제 등 위험 키워드가 포함된 명령을 사전 차단
 * @param userText - 사용자 입력 텍스트
 * @param isAdminMode - 관리자 모드 여부
 * @returns 차단 메시지 또는 null (통과)
 */
export function guardDangerousCommand(userText: string, isAdminMode: boolean): string | null {
  if (isAdminMode) return null; // 관리자는 통과

  const lowerText = userText.toLowerCase();
  const matched = DANGEROUS_KEYWORDS.find(kw => lowerText.includes(kw));
  if (matched) {
    console.warn(`🛡️ [보안 필터] 일반 사용자 위험 키워드 차단: "${matched}" in "${userText}"`);
    return `안전을 위해 "${matched}" 관련 기능은 관리자 모드에서만 사용 가능합니다. 😊\n\n다른 도움이 필요하시면 말씀해주세요!`;
  }
  return null;
}

/**
 * 🔍 액션 코드 조회 — 공용/관리자 통합 검색
 */
export function getActionInfo(actionCode: string): { label: string; isAdmin: boolean } | null {
  if (PUBLIC_ACTIONS[actionCode]) {
    return { label: PUBLIC_ACTIONS[actionCode].label, isAdmin: false };
  }
  if (ADMIN_ACTIONS[actionCode]) {
    return { label: ADMIN_ACTIONS[actionCode].label, isAdmin: true };
  }
  return null;
}
