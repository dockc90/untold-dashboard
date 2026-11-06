import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawText = searchParams.get('text') || '';
    const cleanText = rawText.trim().slice(0, 500);
    const referenceId = searchParams.get('reference_id') || searchParams.get('voice_id') || '';

    if (!cleanText) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // 1. Try Fish Audio S2.1-Pro REST API if FISH_AUDIO_API_KEY is configured
    const fishApiKey = process.env.FISH_AUDIO_API_KEY;
    if (fishApiKey) {
      try {
        const payload: Record<string, any> = {
          text: cleanText,
          format: 'mp3',
          mp3_bitrate: 128,
          normalize_loudness: true,
        };
        if (referenceId) {
          payload.reference_id = referenceId;
        }

        const fishRes = await fetch('https://api.fish.audio/v1/tts', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${fishApiKey}`,
            'Content-Type': 'application/json',
            'model': 's2.1-pro',
          },
          body: JSON.stringify(payload),
        });

        if (fishRes.ok) {
          const arrayBuffer = await fishRes.arrayBuffer();
          return new Response(arrayBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'audio/mpeg',
              'Cache-Control': 'public, max-age=86400',
              'X-TTS-Engine': 'Fish-Audio-S2.1-Pro',
            },
          });
        }
      } catch (fishErr: any) {
        console.warn('Fish Audio API request failed, falling back:', fishErr.message);
      }
    }

    // 2. High-performance acoustic fallback
    const speechText = cleanText.replace(/["“”'‘’]/g, ' ').replace(/\.{2,}/g, '. ').replace(/\s+/g, ' ').trim();
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ko&client=tw-ob&q=${encodeURIComponent(speechText.slice(0, 180))}`;
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
        'X-TTS-Engine': 'System-Fallback',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'TTS generation failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawText = body.text || '';
    const cleanText = rawText.trim().slice(0, 500);
    const referenceId = body.reference_id || body.voice_id || '';

    if (!cleanText) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const fishApiKey = process.env.FISH_AUDIO_API_KEY;
    if (fishApiKey) {
      try {
        const payload: Record<string, any> = {
          text: cleanText,
          format: 'mp3',
          mp3_bitrate: 128,
          normalize_loudness: true,
        };
        if (referenceId) {
          payload.reference_id = referenceId;
        }

        const fishRes = await fetch('https://api.fish.audio/v1/tts', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${fishApiKey}`,
            'Content-Type': 'application/json',
            'model': 's2.1-pro',
          },
          body: JSON.stringify(payload),
        });

        if (fishRes.ok) {
          const arrayBuffer = await fishRes.arrayBuffer();
          return new Response(arrayBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'audio/mpeg',
              'Cache-Control': 'public, max-age=86400',
              'X-TTS-Engine': 'Fish-Audio-S2.1-Pro',
            },
          });
        }
      } catch (fishErr: any) {
        console.warn('Fish Audio API request failed, falling back:', fishErr.message);
      }
    }

    const speechText = cleanText.replace(/["“”'‘’]/g, ' ').replace(/\.{2,}/g, '. ').replace(/\s+/g, ' ').trim();
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ko&client=tw-ob&q=${encodeURIComponent(speechText.slice(0, 180))}`;
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
        'X-TTS-Engine': 'System-Fallback',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'TTS generation failed' }, { status: 500 });
  }
}
