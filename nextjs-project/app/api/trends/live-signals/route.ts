import { NextResponse } from 'next/server';
import { collectLiveTrendSignals } from '@/lib/liveTrendsSignals';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '24h';
    const category = searchParams.get('category') || 'all';
    const channel = searchParams.get('channel') || 'all';

    const bundle = await collectLiveTrendSignals({ timeframe, category, channel });
    return NextResponse.json(bundle, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || '실시간 신호 수집 실패', trendsKr: [], headlines: [], formattedBrief: '' },
      { status: 500 }
    );
  }
}
