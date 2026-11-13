import { NextRequest, NextResponse } from 'next/server';
import { getNewsletterStatus, saveMailDeliveryConfig } from '../../../../lib/newsletterService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const status = await getNewsletterStatus();
    return NextResponse.json({ ok: true, status }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || '상태 조회 실패' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const status = await saveMailDeliveryConfig({
      resendKey: body?.resendKey,
      brevoKey: body?.brevoKey,
      smtpHost: body?.smtpHost,
      smtpPort: body?.smtpPort ? Number(body.smtpPort) : undefined,
      smtpUser: body?.smtpUser,
      smtpPass: body?.smtpPass,
      fromEmail: body?.fromEmail,
    });
    return NextResponse.json({ ok: true, status });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || '메일 발송 설정 저장 실패' }, { status: 400 });
  }
}
