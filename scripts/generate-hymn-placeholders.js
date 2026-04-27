/**
 * 🎵 찬송가 악보 플레이스홀더 생성기
 * 
 * 사용법: node scripts/generate-hymn-placeholders.js
 * 
 * 새찬송가 645곡 전체에 대한 플레이스홀더 SVG 이미지를 생성합니다.
 * 실제 악보 이미지로 교체하려면 /public/assets/hymns/{번호}.jpg 로 넣으면 됩니다.
 * 
 * 실제 악보 이미지 일괄 등록 방법:
 * 1. 찬송가 스캔 이미지를 준비합니다 (1장 ~ 645장)
 * 2. 파일명을 번호.jpg 형식으로 변경합니다 (예: 1.jpg, 28.jpg, 94.jpg)
 * 3. /public/assets/hymns/ 폴더에 복사합니다
 * 4. SVG 플레이스홀더는 자동으로 무시됩니다 (jpg가 우선)
 */

const fs = require('fs');
const path = require('path');

const HYMNS_DIR = path.join(__dirname, '..', 'public', 'assets', 'hymns');

// 새찬송가 대표 제목 (일부 — 자주 사용되는 곡)
const HYMN_TITLES = {
  1: '만복의 근원 하나님',
  28: '복의 근원 강림하사',
  30: '영광을 받으신 만유의 주여',
  78: '시온의 영광이 빛나는 아침',
  86: '저 들 밖에 한밤 중에',
  87: '기쁘다 구주 오셨네',
  89: '참 반가운 성도여',
  92: '기쁘다 구주 오셨네',
  94: '만세 반석 열린 곳에',
  95: '위에 계신 우리 아버지',
  200: '예수를 나의 구주 삼고',
  204: '성령이여 강림하사',
  235: '이 세상에 근심된 일이',
  259: '나의 사랑하는 책',
  263: '아 하나님의 은혜로',
  279: '주가 필요합니다',
  283: '지금까지 지내온 것',
  288: '내 주 하나님 넓고 큰 은혜는',
  293: '주 하나님 지으신 모든 세계',
  310: '예수님은 너를 위해',
  320: '주 예수보다 더 귀한 것은 없네',
  330: '나 같은 죄인 살리신',
  338: '주님 뜻대로 살기원합니다',
  370: '예수 사랑하심은',
  380: '사랑하는 나의 아버지',
  384: '하나님을 가까이함이',
  405: '주는 나를 기르시는 목자',
  430: '내 맘에 한 노래 있어',
  435: '나의 갈 길 다 가도록',
  453: '내 구주 예수를 더욱 사랑',
  488: '주 하나님 독생자 예수',
  540: '빛나고 높은 보좌와',
  545: '성도여 다 함께',
};

function generatePlaceholderSVG(number) {
  const title = HYMN_TITLES[number] || '';
  const displayTitle = title ? `<text x="200" y="240" font-family="'Noto Serif KR',serif" font-size="14" fill="#8B7355" text-anchor="middle" font-weight="500">${title}</text>` : '';
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <defs>
    <linearGradient id="bg${number}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FFF8F0"/>
      <stop offset="100%" style="stop-color:#F5E6D3"/>
    </linearGradient>
  </defs>
  <rect width="400" height="300" rx="12" fill="url(#bg${number})" stroke="#D4A574" stroke-width="2"/>
  <rect x="15" y="15" width="370" height="270" rx="8" fill="none" stroke="#D4A574" stroke-width="0.5" stroke-dasharray="4,4"/>
  <text x="200" y="100" font-family="'Noto Serif KR',serif" font-size="16" fill="#8B6914" text-anchor="middle" letter-spacing="0.1em">새 찬 송 가</text>
  <text x="200" y="155" font-family="'Georgia',serif" font-size="64" fill="#5B272F" text-anchor="middle" font-weight="700">${number}</text>
  <text x="200" y="185" font-family="sans-serif" font-size="11" fill="#A0937D" text-anchor="middle">장</text>
  ${displayTitle}
  <line x1="80" y1="120" x2="320" y2="120" stroke="#D4A574" stroke-width="0.5"/>
  <line x1="80" y1="200" x2="320" y2="200" stroke="#D4A574" stroke-width="0.5"/>
  <text x="200" y="280" font-family="sans-serif" font-size="9" fill="#C0B090" text-anchor="middle">거제반석교회 · 실제 악보로 교체 가능</text>
</svg>`;
}

// 디렉토리 생성
if (!fs.existsSync(HYMNS_DIR)) {
  fs.mkdirSync(HYMNS_DIR, { recursive: true });
}

// 645곡 전체 플레이스홀더 생성
let created = 0;
for (let i = 1; i <= 645; i++) {
  const svgPath = path.join(HYMNS_DIR, `${i}.svg`);
  const jpgPath = path.join(HYMNS_DIR, `${i}.jpg`);
  
  // jpg가 이미 있으면 스킵 (실제 악보가 있는 경우)
  if (fs.existsSync(jpgPath)) {
    continue;
  }
  
  fs.writeFileSync(svgPath, generatePlaceholderSVG(i));
  created++;
}

console.log(`✅ 찬송가 플레이스홀더 ${created}개 생성 완료!`);
console.log(`📁 위치: ${HYMNS_DIR}`);
console.log(`\n💡 실제 악보로 교체하려면:`);
console.log(`   1. 악보 이미지를 {번호}.jpg 형식으로 준비`);
console.log(`   2. ${HYMNS_DIR} 폴더에 복사`);
console.log(`   3. 같은 번호의 .svg 플레이스홀더는 삭제하거나 그대로 두어도 됨 (jpg 우선)`);
