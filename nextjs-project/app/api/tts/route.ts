import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawText = searchParams.get('text') || '';
    const cleanText = rawText.trim().slice(0, 180);

    if (!cleanText) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ko&client=tw-ob&q=${encodeURIComponent(cleanText)}`;
    const response = await fetch(ttsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://translate.google.com/',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'TTS upstream failed' }, { status: 502 });
    }

    const arrayBuffer = await response.arrayBuffer();

    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'TTS generation failed' }, { status: 500 });
  }
}
