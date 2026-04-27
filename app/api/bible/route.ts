import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * 📖 성경 구절 조회 API
 * 
 * GET /api/bible?ref=요한복음 3:16
 * GET /api/bible?ref=고린도전서 15:1-10
 * GET /api/bible?book=시편&chapter=23
 * GET /api/bible?book=창세기&chapter=1&verse=1
 */

// ━━━ 한글 권명 → bookKey 역매핑 ━━━
const BOOK_KEY_MAP: Record<string, string> = {
  '창세기': 'gn', '출애굽기': 'ex', '레위기': 'lv', '민수기': 'nm', '신명기': 'dt',
  '여호수아': 'js', '사사기': 'jud', '룻기': 'rt',
  '사무엘상': '1sm', '사무엘하': '2sm', '열왕기상': '1kgs', '열왕기하': '2kgs',
  '역대상': '1ch', '역대하': '2ch', '에스라': 'ezr', '느헤미야': 'ne', '에스더': 'et',
  '욥기': 'job', '시편': 'ps', '잠언': 'prv', '전도서': 'ec', '아가': 'so',
  '이사야': 'is', '예레미야': 'jr', '예레미야애가': 'lm', '에스겔': 'ez', '다니엘': 'dn',
  '호세아': 'ho', '요엘': 'jl', '아모스': 'am', '오바댜': 'ob', '요나': 'jn',
  '미가': 'mi', '나훔': 'na', '하박국': 'hk', '스바냐': 'zp', '학개': 'hg',
  '스가랴': 'zc', '말라기': 'ml',
  '마태복음': 'mt', '마가복음': 'mk', '누가복음': 'lk', '요한복음': 'jo',
  '사도행전': 'act', '로마서': 'rm',
  '고린도전서': '1co', '고린도후서': '2co', '갈라디아서': 'gl',
  '에베소서': 'eph', '빌립보서': 'ph', '골로새서': 'cl',
  '데살로니가전서': '1ts', '데살로니가후서': '2ts',
  '디모데전서': '1tm', '디모데후서': '2tm', '디도서': 'tt', '빌레몬서': 'phm',
  '히브리서': 'hb', '야고보서': 'jm',
  '베드로전서': '1pe', '베드로후서': '2pe',
  '요한일서': '1jo', '요한이서': '2jo', '요한삼서': '3jo',
  '유다서': 'jd', '요한계시록': 're',
  // 축약형 별명
  '창': 'gn', '출': 'ex', '레': 'lv', '민': 'nm', '신': 'dt',
  '수': 'js', '삿': 'jud', '룻': 'rt',
  '삼상': '1sm', '삼하': '2sm', '왕상': '1kgs', '왕하': '2kgs',
  '대상': '1ch', '대하': '2ch', '스': 'ezr', '느': 'ne', '에': 'et',
  '욥': 'job', '시': 'ps', '잠': 'prv', '전': 'ec',
  '사': 'is', '렘': 'jr', '애': 'lm', '겔': 'ez', '단': 'dn',
  '호': 'ho', '욜': 'jl', '암': 'am', '옵': 'ob', '욘': 'jn',
  '나': 'na', '합': 'hk', '습': 'zp', '학': 'hg', '슥': 'zc', '말': 'ml',
  '마': 'mt', '막': 'mk', '눅': 'lk', '요': 'jo',
  '행': 'act', '롬': 'rm',
  '고전': '1co', '고후': '2co', '갈': 'gl',
  '엡': 'eph', '빌': 'ph', '골': 'cl',
  '살전': '1ts', '살후': '2ts',
  '딤전': '1tm', '딤후': '2tm', '딛': 'tt', '몬': 'phm',
  '히': 'hb', '약': 'jm',
  '벧전': '1pe', '벧후': '2pe',
  '요일': '1jo', '요이': '2jo', '요삼': '3jo',
  '유': 'jd', '계': 're',
};

// bookKey → 한글 정식 권명
const KEY_TO_KOREAN: Record<string, string> = {};
Object.entries(BOOK_KEY_MAP).forEach(([ko, key]) => {
  if (ko.length > 1) KEY_TO_KOREAN[key] = ko;
});

/**
 * 🔍 성경 참조 파서
 * "요한복음 3:16" → { bookKey: "jo", chapter: 3, verseStart: 16, verseEnd: 16 }
 * "고린도전서 15:1-10" → { bookKey: "1co", chapter: 15, verseStart: 1, verseEnd: 10 }
 * "시 23:1-6" → { bookKey: "ps", chapter: 23, verseStart: 1, verseEnd: 6 }
 */
function parseScriptureRef(ref: string): { bookKey: string; bookName: string; chapter: number; verseStart: number; verseEnd: number } | null {
  if (!ref) return null;
  
  const cleaned = ref.trim().replace(/\s+/g, ' ');
  
  // 패턴: [권명] [장]:[절]-[절] 또는 [권명] [장]:[절]
  const match = cleaned.match(/^(.+?)\s*(\d+)\s*:\s*(\d+)(?:\s*[-–~]\s*(\d+))?/);
  if (!match) {
    // 장만 있는 경우: "시편 23"
    const chapterOnly = cleaned.match(/^(.+?)\s*(\d+)$/);
    if (chapterOnly) {
      const bookName = chapterOnly[1].trim();
      const bookKey = BOOK_KEY_MAP[bookName];
      if (bookKey) {
        return { bookKey, bookName: KEY_TO_KOREAN[bookKey] || bookName, chapter: parseInt(chapterOnly[2]), verseStart: 0, verseEnd: 0 };
      }
    }
    return null;
  }
  
  const bookName = match[1].trim();
  const bookKey = BOOK_KEY_MAP[bookName];
  if (!bookKey) return null;
  
  return {
    bookKey,
    bookName: KEY_TO_KOREAN[bookKey] || bookName,
    chapter: parseInt(match[2]),
    verseStart: parseInt(match[3]),
    verseEnd: match[4] ? parseInt(match[4]) : parseInt(match[3]),
  };
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const ref = url.searchParams.get('ref');
    const book = url.searchParams.get('book');
    const chapter = url.searchParams.get('chapter');
    const verse = url.searchParams.get('verse');

    // 모드 1: ref 파라미터로 전체 참조 파싱
    if (ref) {
      const parsed = parseScriptureRef(ref);
      if (!parsed) {
        return NextResponse.json({ 
          success: false, 
          error: `성경 참조를 파싱할 수 없습니다: "${ref}". 예시: "요한복음 3:16", "고전 15:1-10"` 
        }, { status: 400 });
      }

      let verses;
      if (parsed.verseStart === 0) {
        // 장 전체
        verses = await prisma.$queryRawUnsafe(
          'SELECT * FROM "BibleVerse" WHERE "bookKey"=? AND "chapter"=? ORDER BY "verse"',
          parsed.bookKey, parsed.chapter
        ) as any[];
      } else {
        // 특정 절 범위
        verses = await prisma.$queryRawUnsafe(
          'SELECT * FROM "BibleVerse" WHERE "bookKey"=? AND "chapter"=? AND "verse">=? AND "verse"<=? ORDER BY "verse"',
          parsed.bookKey, parsed.chapter, parsed.verseStart, parsed.verseEnd
        ) as any[];
      }

      return NextResponse.json({
        success: true,
        reference: `${parsed.bookName} ${parsed.chapter}${parsed.verseStart ? `:${parsed.verseStart}${parsed.verseEnd > parsed.verseStart ? `-${parsed.verseEnd}` : ''}` : ''}`,
        bookName: parsed.bookName,
        chapter: parsed.chapter,
        verses: verses.map((v: any) => ({ verse: v.verse, text: v.text })),
        fullText: verses.map((v: any) => `${v.verse} ${v.text}`).join('\n'),
      });
    }

    // 모드 2: book/chapter/verse 개별 파라미터
    if (book) {
      const bookKey = BOOK_KEY_MAP[book] || book;
      const bookName = KEY_TO_KOREAN[bookKey] || book;
      const chapterNum = chapter ? parseInt(chapter) : null;
      const verseNum = verse ? parseInt(verse) : null;

      if (chapterNum && verseNum) {
        // 특정 절
        const result = await prisma.$queryRawUnsafe(
          'SELECT * FROM "BibleVerse" WHERE "bookKey"=? AND "chapter"=? AND "verse"=?',
          bookKey, chapterNum, verseNum
        ) as any[];
        
        return NextResponse.json({
          success: true,
          reference: `${bookName} ${chapterNum}:${verseNum}`,
          bookName,
          chapter: chapterNum,
          verses: result.map((v: any) => ({ verse: v.verse, text: v.text })),
          fullText: result[0]?.text || '',
        });
      }

      if (chapterNum) {
        // 장 전체
        const result = await prisma.$queryRawUnsafe(
          'SELECT * FROM "BibleVerse" WHERE "bookKey"=? AND "chapter"=? ORDER BY "verse"',
          bookKey, chapterNum
        ) as any[];

        return NextResponse.json({
          success: true,
          reference: `${bookName} ${chapterNum}장`,
          bookName,
          chapter: chapterNum,
          verses: result.map((v: any) => ({ verse: v.verse, text: v.text })),
          totalVerses: result.length,
        });
      }

      // 권 정보만
      const chapCount = await prisma.$queryRawUnsafe(
        'SELECT MAX("chapter") as maxCh, COUNT(*) as totalVerses FROM "BibleVerse" WHERE "bookKey"=?',
        bookKey
      ) as any[];

      return NextResponse.json({
        success: true,
        bookName,
        bookKey,
        totalChapters: chapCount[0]?.maxCh || 0,
        totalVerses: chapCount[0]?.totalVerses || 0,
      });
    }

    // 모드 3: 전체 성경 통계
    const stats = await prisma.$queryRawUnsafe(
      'SELECT "bookName", "bookKey", MAX("chapter") as chapters, COUNT(*) as verses FROM "BibleVerse" GROUP BY "bookKey" ORDER BY ROWID'
    ) as any[];

    return NextResponse.json({
      success: true,
      totalBooks: stats.length,
      totalVerses: stats.reduce((sum: number, b: any) => sum + (b.verses || 0), 0),
      books: stats.map((b: any) => ({
        key: b.bookKey,
        name: b.bookName,
        chapters: b.chapters,
        verses: b.verses,
      })),
    });

  } catch (error: any) {
    if (error.message?.includes('no such table')) {
      return NextResponse.json({ 
        success: false, 
        error: '성경 DB가 아직 초기화되지 않았습니다. scripts/import-bible.js를 실행해주세요.' 
      }, { status: 500 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
