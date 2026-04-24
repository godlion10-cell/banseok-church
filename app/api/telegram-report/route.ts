import { sendTelegramAlert } from '../../actions/telegram';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { content } = await request.json();
    
    const text = `📢 [이음돌 모임 보고 - 음성 접수]\n\n${content}\n\n⏰ ${new Date().toLocaleString('ko-KR')}`;
    const result = await sendTelegramAlert(text);
    
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
