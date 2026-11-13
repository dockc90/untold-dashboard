import { NextRequest, NextResponse } from 'next/server';
import { runDailyNewsletterCron } from '../../../../lib/newsletterService';

export const dynamic = 'force-dynamic';

async function handleCron(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (cronSecret) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const forceResend = req.nextUrl.searchParams.get('force') === '1';
    const result = await runDailyNewsletterCron({ forceResendSameDay: forceResend });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || '07:00 뉴스레터 크론 실패' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handleCron(req);
}

export async function POST(req: NextRequest) {
  return handleCron(req);
}
