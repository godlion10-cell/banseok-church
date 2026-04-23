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
    console.error('Content API error:', e.message);
    return NextResponse.json({ success: false, news: [], sermons: [], schedules: [], worshipOrders: [] });
  }
}
