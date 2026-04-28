import { NextRequest, NextResponse } from 'next/server';
import ytdl from '@distube/ytdl-core';
import { Readable } from 'stream';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * 🎵 설교 라디오 — 백엔드 오디오 프록시 스트리머
 * GET /api/radio?videoId=XXXXXXXXXXX
 */
export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get('videoId');

  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return new NextResponse('Video ID is required', { status: 400 });
  }

  const url = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    const info = await ytdl.getInfo(url);

    const format = ytdl.chooseFormat(info.formats, {
      quality: 'highestaudio',
      filter: 'audioonly',
    });

    const audioStream = ytdl.downloadFromInfo(info, { format });

    const webStream = Readable.toWeb(audioStream) as ReadableStream;

    const headers = new Headers({
      'Content-Type': format.mimeType?.split(';')[0] || 'audio/webm',
      'Cache-Control': 'public, max-age=3600',
    });

    if (format.contentLength) {
      headers.set('Content-Length', format.contentLength);
    }

    return new NextResponse(webStream, { headers });
  } catch (error: any) {
    console.error('🔥 [Radio API]', error.message);
    return new NextResponse('Failed to stream audio', { status: 500 });
  }
}
