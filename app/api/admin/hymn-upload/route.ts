import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

/**
 * 🎵 찬송가 악보 일괄 업로드 API
 * 
 * POST /api/admin/hymn-upload
 * FormData: hymns[] = File[] (각 파일명이 {번호}.jpg)
 * 
 * ⚠️ 참고: Vercel 서버리스에서는 파일시스템 쓰기가 임시 디렉토리에만 가능합니다.
 * 프로덕션에서는 이 API 대신 git push 방식 또는 외부 스토리지(S3/Cloudinary) 연동을 권장합니다.
 * 로컬 개발 환경에서는 정상 작동합니다.
 */

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('hymns');
    
    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, error: '업로드할 파일이 없습니다.' }, { status: 400 });
    }

    const hymnsDir = path.join(process.cwd(), 'public', 'assets', 'hymns');
    
    // 디렉토리 생성 (없으면)
    if (!existsSync(hymnsDir)) {
      await mkdir(hymnsDir, { recursive: true });
    }

    let uploaded = 0;
    let errors: string[] = [];

    for (const file of files) {
      if (!(file instanceof File)) continue;
      
      try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // 파일명에서 번호 추출
        const match = file.name.match(/^(\d{1,3})\./);
        const hymnNumber = match ? parseInt(match[1], 10) : 0;
        
        if (hymnNumber < 1 || hymnNumber > 645) {
          errors.push(`${file.name}: 유효하지 않은 번호`);
          continue;
        }

        // jpg로 저장
        const filePath = path.join(hymnsDir, `${hymnNumber}.jpg`);
        await writeFile(filePath, buffer);
        uploaded++;
        
        console.log(`🎵 [찬송가 업로드] ${hymnNumber}.jpg 저장 완료 (${Math.round(buffer.length / 1024)}KB)`);
      } catch (err: any) {
        errors.push(`${file.name}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      uploaded,
      total: files.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `${uploaded}개 찬송가 악보가 저장되었습니다.${errors.length > 0 ? ` (${errors.length}개 오류)` : ''}`,
    });
    
  } catch (error: any) {
    console.error('🔥 [찬송가 업로드 에러]:', error.message);
    return NextResponse.json({ 
      success: false, 
      error: error.message?.includes('read-only') 
        ? 'Vercel 서버리스 환경에서는 파일 업로드가 지원되지 않습니다. git push 방식을 사용해주세요.'
        : error.message 
    }, { status: 500 });
  }
}
