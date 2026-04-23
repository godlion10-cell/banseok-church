import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  if (!prisma) return NextResponse.json({ success: false, news: [], sermons: [], schedules: [], worshipOrders: [] });
  try {
    const [news, sermons, schedules, worshipOrders] = await Promise.all([
      prisma.news.findMany({ orderBy: { order: 'asc' } }),
      prisma.sermon.findMany({ orderBy: { date: 'desc' } }),
      prisma.schedule.findMany({ orderBy: { order: 'asc' } }),
      prisma.worshipOrder.findMany(),
    ]);
    return NextResponse.json({ success: true, news, sermons, schedules, worshipOrders });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message, news: [], sermons: [], schedules: [], worshipOrders: [] });
  }
}

// === NEWS ===
export async function POST(req: Request) {
  if (!prisma) return NextResponse.json({ success: false, error: 'DB 없음' });
  try {
    const body = await req.json();
    const { _model, _delete, id, ...data } = body;

    if (_model === 'news') {
      if (_delete) { await prisma.news.delete({ where: { id } }); return NextResponse.json({ success: true }); }
      if (id) { const r = await prisma.news.update({ where: { id }, data: { title: data.title, content: data.content, order: data.order || 0 } }); return NextResponse.json({ success: true, item: r }); }
      const r = await prisma.news.create({ data: { title: data.title, content: data.content, order: data.order || 0 } });
      return NextResponse.json({ success: true, item: r });
    }

    if (_model === 'sermon') {
      if (_delete) { await prisma.sermon.delete({ where: { id } }); return NextResponse.json({ success: true }); }
      if (id) { const r = await prisma.sermon.update({ where: { id }, data: { category: data.category, title: data.title, content: data.content || null, videoId: data.videoId || null } }); return NextResponse.json({ success: true, item: r }); }
      const r = await prisma.sermon.create({ data: { category: data.category, title: data.title, content: data.content || null, videoId: data.videoId || null } });
      return NextResponse.json({ success: true, item: r });
    }

    if (_model === 'schedule') {
      if (_delete) { await prisma.schedule.delete({ where: { id } }); return NextResponse.json({ success: true }); }
      if (id) { const r = await prisma.schedule.update({ where: { id }, data: { title: data.title, time: data.time, place: data.place, officer: data.officer, order: data.order || 0 } }); return NextResponse.json({ success: true, item: r }); }
      const r = await prisma.schedule.create({ data: { title: data.title, time: data.time, place: data.place, officer: data.officer, order: data.order || 0 } });
      return NextResponse.json({ success: true, item: r });
    }

    if (_model === 'worshipOrder') {
      if (_delete) { await prisma.worshipOrder.delete({ where: { id } }); return NextResponse.json({ success: true }); }
      if (id) { const r = await prisma.worshipOrder.update({ where: { id }, data: { category: data.category, title: data.title, content: data.content } }); return NextResponse.json({ success: true, item: r }); }
      const r = await prisma.worshipOrder.create({ data: { category: data.category, title: data.title, content: data.content } });
      return NextResponse.json({ success: true, item: r });
    }

    return NextResponse.json({ success: false, error: 'Unknown _model' });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message });
  }
}
