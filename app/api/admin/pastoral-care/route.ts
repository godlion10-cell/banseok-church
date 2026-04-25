import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 📋 GET: 관리자용 — 돌봄 필요 성도 목록 조회
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'ALL';

    const where = status === 'ALL' ? {} : { status };

    const cases = await prisma.pastoralCare.findMany({
      where,
      orderBy: [
        { priority: 'asc' },  // URGENT > HIGH > NORMAL
        { createdAt: 'desc' }
      ]
    });

    // 통계 집계
    const stats = {
      total: cases.length,
      needsCare: cases.filter(c => c.status === 'NEEDS_CARE').length,
      inProgress: cases.filter(c => c.status === 'IN_PROGRESS').length,
      completed: cases.filter(c => c.status === 'COMPLETED').length,
      urgent: cases.filter(c => c.priority === 'URGENT').length,
    };

    return NextResponse.json({ success: true, cases, stats });
  } catch (error) {
    console.error('심방 레이더 조회 오류:', error);
    return NextResponse.json({ success: false, error: '데이터 조회 실패' }, { status: 500 });
  }
}

// 🛡️ POST: 챗봇에서 감지된 케이스 등록 (스텔스 모드)
export async function POST(req: Request) {
  try {
    const { userName, reason, keywords, context, priority } = await req.json();

    if (!userName || !reason) {
      return NextResponse.json({ success: false, error: '필수 필드 누락' }, { status: 400 });
    }

    // 중복 방지: 같은 사용자 + 같은 이유로 24시간 이내 이미 등록된 경우 스킵
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existing = await prisma.pastoralCare.findFirst({
      where: {
        userName,
        reason,
        createdAt: { gte: oneDayAgo }
      }
    });

    if (existing) {
      return NextResponse.json({ success: true, message: '이미 등록된 케이스입니다', duplicate: true });
    }

    const newCase = await prisma.pastoralCare.create({
      data: {
        userName,
        reason,
        keywords: keywords || null,
        context: context || null,
        priority: priority || 'NORMAL',
        status: 'NEEDS_CARE'
      }
    });

    return NextResponse.json({ success: true, case: newCase });
  } catch (error) {
    console.error('심방 레이더 등록 오류:', error);
    return NextResponse.json({ success: false, error: '등록 실패' }, { status: 500 });
  }
}

// ✏️ PATCH: 관리자 상태 업데이트 (심방 완료 처리 등)
export async function PATCH(req: Request) {
  try {
    const { id, status, note } = await req.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID 필요' }, { status: 400 });
    }

    const updated = await prisma.pastoralCare.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(note !== undefined && { note }),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, case: updated });
  } catch (error) {
    console.error('심방 레이더 업데이트 오류:', error);
    return NextResponse.json({ success: false, error: '업데이트 실패' }, { status: 500 });
  }
}
