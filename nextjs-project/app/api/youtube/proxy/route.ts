import { NextResponse } from 'next/server';

const YT_BASE = 'https://www.googleapis.com/youtube/v3';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const path = String(body.path || '');
    const params = (body.params && typeof body.params === 'object' ? body.params : {}) as Record<string, any>;
    const key = String(body.apiKey || process.env.YOUTUBE_API_KEY || process.env.VITE_YOUTUBE_API_KEY || '').trim();

    if (!key) {
      return NextResponse.json({ error: 'YouTube API key not configured on server' }, { status: 401 });
    }
    if (!path.startsWith('/')) {
      return NextResponse.json({ error: 'Invalid YouTube API path' }, { status: 400 });
    }

    const u = new URL(YT_BASE + path);
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && v !== '') u.searchParams.set(k, String(v));
    });
    u.searchParams.set('key', key);

    const ytRes = await fetch(u.toString());
    const data = await ytRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: ytRes.status });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'YouTube proxy failed' }, { status: 500 });
  }
}
