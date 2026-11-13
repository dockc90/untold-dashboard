import { NextRequest, NextResponse } from 'next/server';
import {
  buildDailyMorningIssue,
  getNewsletterStatus,
  renderNewsletterEmailText,
  unsubscribeNewsletter,
} from '../../../../lib/newsletterService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const unsub = req.nextUrl.searchParams.get('unsubscribe');
  if (unsub) {
    try {
      const res = await unsubscribeNewsletter(unsub);
      return new NextResponse(
        `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8" /><title>구독 해지 완료</title></head><body style="font-family:sans-serif;max-width:480px;margin:60px auto;text-align:center;color:#191919;"><h2>구독 해지가 완료되었습니다</h2><p>${res.email} 주소로 더 이상 오전 7시 브리핑이 발송되지 않습니다.</p><p><a href="/" style="color:#4338ca;">Untold AutoShorts로 돌아가기</a></p></body></html>`,
        { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    } catch (err: any) {
      return NextResponse.json({ error: err?.message || '구독 해지 실패' }, { status: 400 });
    }
  }

  try {
    const forceRefresh = req.nextUrl.searchParams.get('force') === '1';
    const [status, issue] = await Promise.all([
      getNewsletterStatus(),
      buildDailyMorningIssue({ forceRefresh }),
    ]);
    return NextResponse.json(
      {
        status,
        issue,
        textBrief: renderNewsletterEmailText(issue),
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || '뉴스레터 미리보기 생성 실패' }, { status: 500 });
  }
}
