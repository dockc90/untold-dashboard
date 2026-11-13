import { NextRequest, NextResponse } from 'next/server';
import { subscribeNewsletter, unsubscribeNewsletter } from '../../../../lib/newsletterService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || '').trim();
    const name = body?.name ? String(body.name).trim() : undefined;
    const result = await subscribeNewsletter(email, name);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || '구독 등록 실패' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || req.nextUrl.searchParams.get('email') || '').trim();
    const res = await unsubscribeNewsletter(email);
    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || '구독 해지 실패' }, { status: 400 });
  }
}
