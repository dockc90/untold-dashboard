import { NextRequest, NextResponse } from 'next/server';
import {
  buildDailyMorningIssue,
  isValidEmail,
  normalizeEmail,
  renderNewsletterEmailText,
  sendNewsletterEmail,
  subscribeNewsletter,
} from '../../../../lib/newsletterService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail(body?.email || '');
    if (!isValidEmail(email)) {
      return NextResponse.json({ ok: false, error: '올바른 이메일 주소를 입력해 주세요.' }, { status: 400 });
    }

    const geminiKey = typeof body?.geminiKey === 'string' ? body.geminiKey.trim() : undefined;
    await subscribeNewsletter(email, body?.name).catch(() => null);
    const issue = await buildDailyMorningIssue({
      forceRefresh: Boolean(body?.forceRefresh),
      geminiKey,
    });
    const sendRes = await sendNewsletterEmail(email, issue);

    return NextResponse.json({
      ok: sendRes.ok,
      configured: sendRes.configured,
      provider: sendRes.provider,
      message: sendRes.ok
        ? `${email} 주소로 오늘(${issue.dateKst}) 오전 7시 브리핑 샘플 메일을 발송했습니다.`
        : sendRes.error || '메일 발송 설정이 필요합니다.',
      issue,
      textBrief: renderNewsletterEmailText(issue),
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || '테스트 메일 발송 실패' }, { status: 500 });
  }
}
