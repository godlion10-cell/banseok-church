import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    const adminPw = process.env.ADMIN_PASSWORD || 'banseok2026!';

    if (password === adminPw) {
      // 간단 토큰 생성 (서버 시작 시간 기반)
      const token = Buffer.from(`admin:${Date.now()}:${adminPw}`).toString('base64');
      return NextResponse.json({ success: true, token });
    }

    return NextResponse.json({ success: false, error: '비밀번호가 틀렸습니다.' });
  } catch {
    return NextResponse.json({ success: false, error: '오류가 발생했습니다.' });
  }
}
