import { NextResponse } from 'next/server';

// 🔍 환경변수 진단용 (디버깅 후 삭제할 것)
export async function GET() {
  const geminiKey = process.env.GEMINI_API_KEY;
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  // 키의 존재 여부와 앞 8자만 표시 (보안)
  return NextResponse.json({
    GEMINI_API_KEY: geminiKey ? `✅ 존재 (${geminiKey.slice(0, 8)}...)` : '❌ 누락!',
    TURSO_DATABASE_URL: tursoUrl ? `✅ 존재 (${tursoUrl.slice(0, 20)}...)` : '❌ 누락!',
    TURSO_AUTH_TOKEN: tursoToken ? `✅ 존재 (${tursoToken.slice(0, 8)}...)` : '❌ 누락!',
    NODE_ENV: process.env.NODE_ENV,
    allEnvKeys: Object.keys(process.env).filter(k => 
      k.includes('GEMINI') || k.includes('TURSO') || k.includes('API_KEY')
    )
  });
}
