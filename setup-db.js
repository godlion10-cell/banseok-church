// Turso DB에 HTTP로 테이블 생성 (네이티브 모듈 없이)
require('dotenv').config();

const url = (process.env.TURSO_DATABASE_URL || '').replace('libsql://', 'https://');
const token = process.env.TURSO_AUTH_TOKEN;

async function exec(sql) {
  const res = await fetch(`${url}/v2/pipeline`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests: [{ type: 'execute', stmt: { sql } }, { type: 'close' }] }),
  });
  const data = await res.json();
  if (data.results?.[0]?.type === 'error') throw new Error(data.results[0].error.message);
  return data;
}

const tables = [
  `CREATE TABLE IF NOT EXISTS "Sermon" ("id" TEXT NOT NULL PRIMARY KEY, "category" TEXT NOT NULL, "title" TEXT NOT NULL, "content" TEXT, "videoId" TEXT, "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS "News" ("id" TEXT NOT NULL PRIMARY KEY, "title" TEXT NOT NULL, "content" TEXT NOT NULL, "order" INTEGER NOT NULL DEFAULT 0, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS "WorshipOrder" ("id" TEXT NOT NULL PRIMARY KEY, "category" TEXT NOT NULL, "title" TEXT NOT NULL, "content" TEXT NOT NULL)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "WorshipOrder_category_key" ON "WorshipOrder"("category")`,
  `CREATE TABLE IF NOT EXISTS "Schedule" ("id" TEXT NOT NULL PRIMARY KEY, "title" TEXT NOT NULL, "time" TEXT NOT NULL, "place" TEXT NOT NULL, "officer" TEXT NOT NULL, "order" INTEGER NOT NULL DEFAULT 0)`,
];

async function main() {
  console.log(`🔗 Turso: ${url.substring(0, 40)}...`);
  for (const sql of tables) {
    try {
      await exec(sql);
      const name = sql.match(/(?:TABLE|INDEX).*?"(\w+)"/)?.[1];
      console.log(`✅ ${name} 완료`);
    } catch (e) { console.error('❌', e.message); }
  }
  console.log('\n🎉 모든 테이블 준비 완료!');
}

main();
