/**
 * 📖 성경 DB 임포트 스크립트
 * 
 * GitHub Open Source 개역한글(KRV 1938) JSON → Turso LibSQL DB
 * 
 * 사용법: node scripts/import-bible.js
 * 
 * 소스: https://github.com/m0ty/bible-io-json (Korean/kor-krv-1938.json)
 * 총 31,102절을 BibleVerse 테이블에 일괄 삽입합니다.
 */

const fs = require('fs');
const path = require('path');

// 동적 import로 @libsql/client/web 사용 (native 바인딩 문제 회피)
async function getClient() {
  const { createClient } = await import('@libsql/client/web');
  return createClient;
}

// ━━━ 한글 권명 매핑 (66권) ━━━
const BOOK_NAMES = {
  gn: '창세기', ex: '출애굽기', lv: '레위기', nm: '민수기', dt: '신명기',
  js: '여호수아', jud: '사사기', rt: '룻기',
  '1sm': '사무엘상', '2sm': '사무엘하', '1kgs': '열왕기상', '2kgs': '열왕기하',
  '1ch': '역대상', '2ch': '역대하', ezr: '에스라', ne: '느헤미야', et: '에스더',
  job: '욥기', ps: '시편', prv: '잠언', ec: '전도서', so: '아가',
  is: '이사야', jr: '예레미야', lm: '예레미야애가', ez: '에스겔', dn: '다니엘',
  ho: '호세아', jl: '요엘', am: '아모스', ob: '오바댜', jn: '요나',
  mi: '미가', na: '나훔', hk: '하박국', zp: '스바냐', hg: '학개',
  zc: '스가랴', ml: '말라기',
  // 신약 27권
  mt: '마태복음', mk: '마가복음', lk: '누가복음', jo: '요한복음',
  act: '사도행전', rm: '로마서',
  '1co': '고린도전서', '2co': '고린도후서', gl: '갈라디아서',
  eph: '에베소서', ph: '빌립보서', cl: '골로새서',
  '1ts': '데살로니가전서', '2ts': '데살로니가후서',
  '1tm': '디모데전서', '2tm': '디모데후서', tt: '디도서', phm: '빌레몬서',
  hb: '히브리서', jm: '야고보서',
  '1pe': '베드로전서', '2pe': '베드로후서',
  '1jo': '요한일서', '2jo': '요한이서', '3jo': '요한삼서',
  jd: '유다서', re: '요한계시록',
};

async function main() {
  // 1. JSON 파일 로드
  const jsonPath = path.join(__dirname, '..', 'data', 'kor-krv-1938.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('❌ 성경 JSON 파일을 찾을 수 없습니다:', jsonPath);
    console.log('💡 먼저 다운로드하세요:');
    console.log('   Invoke-WebRequest -Uri "https://raw.githubusercontent.com/m0ty/bible-io-json/main/Korean/kor-krv-1938.json" -OutFile "data/kor-krv-1938.json"');
    process.exit(1);
  }

  console.log('📖 성경 JSON 로딩...');
  const bible = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`✅ ${bible.name} (${bible.language}) 로드 완료`);

  // 2. DB 연결 (Turso LibSQL)
  const dbUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!dbUrl) {
    console.error('❌ DATABASE_URL 또는 TURSO_DATABASE_URL 환경변수가 필요합니다.');
    console.log('💡 .env 파일을 확인하세요.');
    process.exit(1);
  }

  console.log('🔌 DB 연결:', dbUrl.slice(0, 40) + '...');
  const createClient = await getClient();
  const db = createClient({
    url: dbUrl,
    authToken: authToken || undefined,
  });

  // 3. 테이블 생성
  console.log('🏗️ BibleVerse 테이블 생성...');
  await db.execute(`
    CREATE TABLE IF NOT EXISTS "BibleVerse" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "bookKey" TEXT NOT NULL,
      "bookName" TEXT NOT NULL,
      "chapter" INTEGER NOT NULL,
      "verse" INTEGER NOT NULL,
      "text" TEXT NOT NULL,
      UNIQUE("bookKey", "chapter", "verse")
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS "idx_bible_book_chapter" ON "BibleVerse" ("bookKey", "chapter")`);
  await db.execute(`CREATE INDEX IF NOT EXISTS "idx_bible_bookname_chapter" ON "BibleVerse" ("bookName", "chapter")`);

  // 4. 기존 데이터 확인
  const existing = await db.execute('SELECT COUNT(*) as cnt FROM "BibleVerse"');
  const existingCount = existing.rows[0].cnt;
  if (existingCount > 0) {
    console.log(`⚠️ 기존 데이터 ${existingCount}절이 있습니다. 삭제 후 재삽입합니다.`);
    await db.execute('DELETE FROM "BibleVerse"');
  }

  // 5. 일괄 삽입
  console.log('📥 성경 데이터 삽입 시작...');
  const bookKeys = Object.keys(bible.books);
  let totalVerses = 0;
  let bookCount = 0;

  for (const bookKey of bookKeys) {
    const book = bible.books[bookKey];
    const bookName = BOOK_NAMES[bookKey] || book.name;
    const chapters = book.chapters;
    const chapterKeys = Object.keys(chapters);
    let bookVerses = 0;

    // 배치 삽입 (100절씩)
    const batch = [];
    
    for (const chNum of chapterKeys) {
      const chapter = chapters[chNum];
      const verseKeys = Object.keys(chapter);
      
      for (const vNum of verseKeys) {
        const text = chapter[vNum];
        if (!text || typeof text !== 'string') continue;
        
        const id = `bv_${bookKey}_${chNum}_${vNum}`;
        batch.push({
          sql: 'INSERT OR REPLACE INTO "BibleVerse" ("id", "bookKey", "bookName", "chapter", "verse", "text") VALUES (?, ?, ?, ?, ?, ?)',
          args: [id, bookKey, bookName, parseInt(chNum), parseInt(vNum), text.trim()],
        });
        bookVerses++;
      }
    }

    // 배치 실행 (Turso는 한 번에 최대 ~100개 트랜잭션 권장)
    const BATCH_SIZE = 80;
    for (let i = 0; i < batch.length; i += BATCH_SIZE) {
      const chunk = batch.slice(i, i + BATCH_SIZE);
      await db.batch(chunk, 'write');
    }

    totalVerses += bookVerses;
    bookCount++;
    const progress = Math.round((bookCount / bookKeys.length) * 100);
    process.stdout.write(`\r   [${progress}%] ${bookName} (${bookKey}): ${bookVerses}절 → 누적 ${totalVerses}절`);
  }

  console.log(`\n\n✅ 성경 DB 임포트 완료!`);
  console.log(`   📖 ${bookCount}권 / ${totalVerses}절`);
  console.log(`   💾 테이블: BibleVerse`);
  console.log(`   🔍 조회 예시: SELECT * FROM BibleVerse WHERE bookName='요한복음' AND chapter=3 AND verse=16`);

  // 6. 검증
  console.log('\n🔍 검증...');
  const check = await db.execute('SELECT text FROM "BibleVerse" WHERE "bookKey"=\'jo\' AND "chapter"=3 AND "verse"=16');
  if (check.rows.length > 0) {
    console.log(`   요한복음 3:16 = "${check.rows[0].text}"`);
  }
  const check2 = await db.execute('SELECT text FROM "BibleVerse" WHERE "bookKey"=\'ps\' AND "chapter"=23 AND "verse"=1');
  if (check2.rows.length > 0) {
    console.log(`   시편 23:1 = "${check2.rows[0].text}"`);
  }

  const finalCount = await db.execute('SELECT COUNT(*) as cnt FROM "BibleVerse"');
  console.log(`\n📊 최종: ${finalCount.rows[0].cnt}절 저장 완료`);
}

main().catch(err => {
  console.error('🔥 치명적 에러:', err.message);
  process.exit(1);
});
