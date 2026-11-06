import { NextResponse } from 'next/server';

// Voice ID aliases for backwards compatibility
const VOICE_ALIAS_MAP: Record<string, string> = {
  'voice-1': 'JBFqnCBsd6RMkjVDRZzb', // George (Default Warm Storyteller)
  'voice-2': 'TX3LPaxmHKxFdv7VOQHJ', // Liam (Fast-paced Social Media)
  'voice-3': 'cgSgspJ2msm6clMCkdW9', // Jessica (Warm & Playful)
  'voice-4': 'CwhRBWXzGAHq8TQ4Fs17', // Roger (Casual)
  'voice-5': 'Xb7hH8MSUJpSbSDYk0k2', // Alice (Educator)
  'voice-6': 'pNInz6obpgDQGcFmaJgB', // Adam (Dominant / Cinematic)
  'voice-7': 'hpp4J3VqNfWAUOO0d1Us', // Bella (Professional)
  'voice-8': 'cjVigY5qzO86Huf0OWal', // Eric (Smooth / Business)
  'voice-9': 'pFZP5JQG7iQjIQuC4Bku', // Lily (Velvety Actress)
  'voice-10': 'N2lVS1w4EtoT3dr4eOWO', // Callum (Husky / Mystery)
  'voice-11': 'FGY2WhTYpPnrIDTdsKH5', // Laura (Enthusiast)
  'voice-12': 'IKne3meq5aSn9XLyUdCD', // Charlie (Confident / Sports)
  'voice-13': 'nPczCjzI2devNBz1zQrb', // Brian (Deep / Documentary)
  'voice-14': 'EXAVITQu4vr4xnSDxMaL', // Sarah (Mature / Reassuring)
  'voice-15': 'onwK4e9ZLuTAKqWW03F9', // Daniel (Steady Broadcaster)
};

function resolveVoiceId(rawId: string | null): string {
  if (!rawId) return 'JBFqnCBsd6RMkjVDRZzb'; // Default George
  return VOICE_ALIAS_MAP[rawId] || rawId;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawText = searchParams.get('text') || '';
    const cleanText = rawText.trim().slice(0, 1000);
    const voiceId = resolveVoiceId(searchParams.get('voice_id') || searchParams.get('reference_id'));
    const modelId = searchParams.get('model_id') || 'eleven_v4'; // 'eleven_v4' as default!
    const stability = parseFloat(searchParams.get('stability') || '0.5');
    const similarityBoost = parseFloat(searchParams.get('similarity_boost') || '0.75');
    const style = parseFloat(searchParams.get('style') || '0.15');
    const useSpeakerBoost = searchParams.get('use_speaker_boost') !== 'false';
    const withTimestamps = searchParams.get('with_timestamps') === 'true';

    if (!cleanText) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // 1. ElevenLabs API (Priority 1 with eleven_v4 default)
    const elevenApiKey = process.env.ELEVENLABS_API_KEY;
    if (elevenApiKey) {
      try {
        const endpoint = withTimestamps ? '/with-timestamps' : '';
        const elevenUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}${endpoint}?output_format=mp3_44100_128`;
        const elevenRes = await fetch(elevenUrl, {
          method: 'POST',
          headers: {
            'xi-api-key': elevenApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: cleanText,
            model_id: modelId,
            voice_settings: {
              stability: isNaN(stability) ? 0.5 : stability,
              similarity_boost: isNaN(similarityBoost) ? 0.75 : similarityBoost,
              style: isNaN(style) ? 0.15 : style,
              use_speaker_boost: useSpeakerBoost,
            },
          }),
        });

        if (elevenRes.ok) {
          if (withTimestamps) {
            const data = await elevenRes.json();
            return NextResponse.json(data, {
              headers: {
                'Cache-Control': 'public, max-age=86400',
                'X-TTS-Engine': `ElevenLabs-${modelId}-Timestamps`,
              },
            });
          }
          const arrayBuffer = await elevenRes.arrayBuffer();
          return new Response(arrayBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'audio/mpeg',
              'Cache-Control': 'public, max-age=86400',
              'X-TTS-Engine': `ElevenLabs-${modelId}`,
            },
          });
        } else {
          const errBody = await elevenRes.text();
          console.warn('ElevenLabs API failed, falling back:', elevenRes.status, errBody);
        }
      } catch (elevenErr: any) {
        console.warn('ElevenLabs API error, falling back:', elevenErr.message);
      }
    }

    // 2. High-performance fallback
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
    if (withTimestamps) {
      const base64Audio = Buffer.from(arrayBuffer).toString('base64');
      return NextResponse.json({
        audio_base64: base64Audio,
        alignment: null,
      }, {
        headers: {
          'Cache-Control': 'public, max-age=86400',
          'X-TTS-Engine': 'System-Fallback',
        },
      });
    }

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
    const cleanText = rawText.trim().slice(0, 1000);
    const voiceId = resolveVoiceId(body.voice_id || body.reference_id);
    const modelId = body.model_id || 'eleven_v4'; // 'eleven_v4' as default!
    const stability = typeof body.stability === 'number' ? body.stability : 0.5;
    const similarityBoost = typeof body.similarity_boost === 'number' ? body.similarity_boost : 0.75;
    const style = typeof body.style === 'number' ? body.style : 0.15;
    const useSpeakerBoost = body.use_speaker_boost !== false;
    const withTimestamps = body.with_timestamps === true;

    if (!cleanText) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // 1. ElevenLabs API (Priority 1 with eleven_v4 default)
    const elevenApiKey = process.env.ELEVENLABS_API_KEY;
    if (elevenApiKey) {
      try {
        const endpoint = withTimestamps ? '/with-timestamps' : '';
        const elevenUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}${endpoint}?output_format=mp3_44100_128`;
        const elevenRes = await fetch(elevenUrl, {
          method: 'POST',
          headers: {
            'xi-api-key': elevenApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: cleanText,
            model_id: modelId,
            voice_settings: {
              stability,
              similarity_boost: similarityBoost,
              style,
              use_speaker_boost: useSpeakerBoost,
            },
          }),
        });

        if (elevenRes.ok) {
          if (withTimestamps) {
            const data = await elevenRes.json();
            return NextResponse.json(data, {
              headers: {
                'Cache-Control': 'public, max-age=86400',
                'X-TTS-Engine': `ElevenLabs-${modelId}-Timestamps`,
              },
            });
          }
          const arrayBuffer = await elevenRes.arrayBuffer();
          return new Response(arrayBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'audio/mpeg',
              'Cache-Control': 'public, max-age=86400',
              'X-TTS-Engine': `ElevenLabs-${modelId}`,
            },
          });
        } else {
          const errBody = await elevenRes.text();
          console.warn('ElevenLabs POST failed, falling back:', elevenRes.status, errBody);
        }
      } catch (elevenErr: any) {
        console.warn('ElevenLabs POST error, falling back:', elevenErr.message);
      }
    }

    // 2. Fallback
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
    if (withTimestamps) {
      const base64Audio = Buffer.from(arrayBuffer).toString('base64');
      return NextResponse.json({
        audio_base64: base64Audio,
        alignment: null,
      }, {
        headers: {
          'Cache-Control': 'public, max-age=86400',
          'X-TTS-Engine': 'System-Fallback',
        },
      });
    }

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
