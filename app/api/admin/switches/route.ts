import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET: 모든 스위치 상태 조회
export async function GET() {
  try {
    const configs = await prisma.siteConfig.findMany();
    const switches: Record<string, boolean> = {};
    
    // DB에 저장된 값 읽기
    configs.forEach((c: any) => {
      switches[c.key] = c.value === 'true';
    });

    // 기본값 (DB에 없으면 true)
    const defaults = ['narrowGate', 'crossHill', 'armory', 'valley', 'vanityFair', 'joyMountain', 'passport'];
    defaults.forEach(key => {
      if (!(key in switches)) switches[key] = true;
    });

    return NextResponse.json({ success: true, switches });
  } catch (error: any) {
    // SiteConfig 테이블이 없으면 자동 생성 시도
    if (error.message?.includes('no such table') || error.code === 'P2021') {
      try {
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS SiteConfig (
            id TEXT PRIMARY KEY,
            key TEXT UNIQUE NOT NULL,
            value TEXT NOT NULL
          )
        `);
        return NextResponse.json({ success: true, switches: {
          narrowGate: true, crossHill: true, armory: true,
          valley: true, vanityFair: true, joyMountain: true, passport: true
        }});
      } catch {
        return NextResponse.json({ success: true, switches: {
          narrowGate: true, crossHill: true, armory: true,
          valley: true, vanityFair: true, joyMountain: true, passport: true
        }});
      }
    }
    return NextResponse.json({ success: false, error: String(error) });
  }
}

// POST: 스위치 토글
export async function POST(req: Request) {
  try {
    const { key, value } = await req.json();
    
    // 테이블 없으면 생성
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS SiteConfig (
        id TEXT PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL
      )
    `);

    // upsert: 있으면 업데이트, 없으면 생성
    await prisma.siteConfig.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) }
    });

    return NextResponse.json({ success: true, key, value });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) });
  }
}
