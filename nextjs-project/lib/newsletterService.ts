import fs from 'fs';
import os from 'os';
import path from 'path';
import nodemailer from 'nodemailer';
import { GoogleGenAI } from '@google/genai';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  collectLiveTrendSignals,
  buildSignalFallbackFigures,
  getKstTodayString,
  getKstTomorrowString,
} from './liveTrendsSignals';

export interface NewsletterSubscriber {
  id: string;
  email: string;
  name?: string;
  sendHourKst: number;
  isActive: boolean;
  lastSentKst?: string | null;
  createdAt: string;
}

export interface NewsletterBriefItem {
  rank: number;
  name: string;
  category: string;
  title: string;
  whyNow: string;
  facts: string[];
  hookLine: string;
  shortsIdea: string;
  tags: string[];
  viralityScore: number;
  scheduledDate?: string;
}

export interface NewsletterIssue {
  dateKst: string;
  tomorrowKst: string;
  subject: string;
  intro: string;
  generatedAt: string;
  usedAi: boolean;
  items: NewsletterBriefItem[];
  upcoming: NewsletterBriefItem[];
}

export interface NewsletterStatus {
  emailConfigured: boolean;
  emailProvider: 'resend' | 'brevo' | 'smtp' | 'none';
  supabaseConfigured: boolean;
  cronUtc: string;
  cronKst: string;
  subscriberCount: number;
}

const TMP_DIR = os.tmpdir ? os.tmpdir() : '/tmp';
const TMP_SUBS_FILE = path.join(TMP_DIR, 'untold_newsletter_subscribers.json');
const TMP_ISSUE_FILE = path.join(TMP_DIR, 'untold_newsletter_issue.json');

const SYS_SUBS_ROW_ID = '__sys_newsletter_subscribers';

const g = globalThis as any;
if (!g.__untoldNewsletterSubs) {
  g.__untoldNewsletterSubs = new Map<string, NewsletterSubscriber>();
}
if (!g.__untoldNewsletterIssues) {
  g.__untoldNewsletterIssues = new Map<string, NewsletterIssue>();
}

const memSubs: Map<string, NewsletterSubscriber> = g.__untoldNewsletterSubs;
const memIssues: Map<string, NewsletterIssue> = g.__untoldNewsletterIssues;

function getSupabaseAdminClient(): SupabaseClient | null {
  const rawUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    '';
  const url = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    '';
  if (!url || !key || url.includes('placeholder') || key === 'placeholder') {
    return null;
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function loadDiskSubs() {
  try {
    if (fs.existsSync(TMP_SUBS_FILE)) {
      const list = JSON.parse(fs.readFileSync(TMP_SUBS_FILE, 'utf8'));
      if (Array.isArray(list)) {
        list.forEach((s: NewsletterSubscriber) => {
          if (s?.email && !memSubs.has(s.email)) {
            memSubs.set(s.email, s);
          }
        });
      }
    }
  } catch {
    // ignore
  }
}

function saveDiskSubs() {
  try {
    fs.writeFileSync(TMP_SUBS_FILE, JSON.stringify(Array.from(memSubs.values())), 'utf8');
  } catch {
    // ignore
  }
}

function loadDiskIssue(dateKst: string): NewsletterIssue | null {
  if (memIssues.has(dateKst)) return memIssues.get(dateKst)!;
  try {
    if (fs.existsSync(TMP_ISSUE_FILE)) {
      const obj = JSON.parse(fs.readFileSync(TMP_ISSUE_FILE, 'utf8'));
      if (obj && obj.dateKst === dateKst && Array.isArray(obj.items)) {
        memIssues.set(dateKst, obj);
        return obj;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

function saveDiskIssue(issue: NewsletterIssue) {
  memIssues.set(issue.dateKst, issue);
  try {
    fs.writeFileSync(TMP_ISSUE_FILE, JSON.stringify(issue), 'utf8');
  } catch {
    // ignore
  }
}

loadDiskSubs();

export function normalizeEmail(raw: string): string {
  return String(raw || '').trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function getEnvMailConfig() {
  return {
    resendKey: process.env.RESEND_API_KEY?.trim() || '',
    brevoKey: process.env.BREVO_API_KEY?.trim() || '',
    smtpHost: process.env.SMTP_HOST?.trim() || '',
    smtpPort: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
    smtpUser: (process.env.SMTP_USER || process.env.GMAIL_USER)?.trim() || '',
    smtpPass: (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD)?.trim() || '',
    fromEmail: process.env.NEWSLETTER_FROM_EMAIL?.trim() || '',
  };
}

async function syncSubsToFallbackDb() {
  const sb = getSupabaseAdminClient();
  if (!sb) return;
  try {
    await sb.from('untold_projects').upsert(
      {
        id: SYS_SUBS_ROW_ID,
        figure_name: '__system_newsletter_subscribers__',
        category: 'social',
        full_script: '',
        data: { __system: true, subscribers: Array.from(memSubs.values()) },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  } catch {
    // ignore
  }
}

export async function listActiveSubscribers(): Promise<NewsletterSubscriber[]> {
  loadDiskSubs();
  const sb = getSupabaseAdminClient();
  if (sb) {
    try {
      const { data, error } = await sb
        .from('newsletter_subscribers')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (!error && Array.isArray(data)) {
        return data.map((row: any) => ({
          id: String(row.id),
          email: normalizeEmail(row.email),
          name: row.name || undefined,
          sendHourKst: Number(row.send_hour_kst) || 7,
          isActive: Boolean(row.is_active),
          lastSentKst: row.last_sent_kst || null,
          createdAt: row.created_at || new Date().toISOString(),
        }));
      }
    } catch {
      // fall through
    }

    try {
      const { data: sysRow } = await sb
        .from('untold_projects')
        .select('data')
        .eq('id', SYS_SUBS_ROW_ID)
        .maybeSingle();
      const dbSubs = sysRow?.data?.subscribers;
      if (Array.isArray(dbSubs)) {
        dbSubs.forEach((s: NewsletterSubscriber) => {
          if (s?.email) memSubs.set(normalizeEmail(s.email), s);
        });
        saveDiskSubs();
      }
    } catch {
      // fall through
    }
  }
  return Array.from(memSubs.values()).filter((s) => s.isActive);
}

export async function getNewsletterStatus(): Promise<NewsletterStatus> {
  const cfg = getEnvMailConfig();
  const emailProvider: 'resend' | 'brevo' | 'smtp' | 'none' = cfg.resendKey
    ? 'resend'
    : cfg.brevoKey
    ? 'brevo'
    : cfg.smtpUser && cfg.smtpPass
    ? 'smtp'
    : 'none';
  const subs = await listActiveSubscribers();

  return {
    emailConfigured: emailProvider !== 'none',
    emailProvider,
    supabaseConfigured: Boolean(getSupabaseAdminClient()),
    cronUtc: '0 22 * * *',
    cronKst: '매일 오전 07:00 (KST)',
    subscriberCount: subs.length,
  };
}

export async function subscribeNewsletter(
  rawEmail: string,
  name?: string
): Promise<{ ok: boolean; subscriber: NewsletterSubscriber; alreadySubscribed: boolean; status: NewsletterStatus }> {
  const email = normalizeEmail(rawEmail);
  if (!isValidEmail(email)) {
    throw new Error('올바른 이메일 주소를 입력해 주세요.');
  }

  await listActiveSubscribers().catch(() => {});
  const existing = memSubs.get(email);
  const nowIso = new Date().toISOString();
  const sub: NewsletterSubscriber = {
    id: existing?.id || `sub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    email,
    name: name?.trim() || existing?.name || undefined,
    sendHourKst: 7,
    isActive: true,
    lastSentKst: existing?.lastSentKst || null,
    createdAt: existing?.createdAt || nowIso,
  };

  memSubs.set(email, sub);
  saveDiskSubs();

  const sb = getSupabaseAdminClient();
  let alreadySubscribed = Boolean(existing?.isActive);
  let savedToDedicatedTable = false;
  if (sb) {
    try {
      const { data: prevRow, error: selErr } = await sb
        .from('newsletter_subscribers')
        .select('id, is_active')
        .eq('email', email)
        .maybeSingle();
      if (!selErr && prevRow?.is_active) alreadySubscribed = true;

      const { data: upserted, error: upErr } = await sb
        .from('newsletter_subscribers')
        .upsert(
          {
            email,
            name: sub.name || null,
            send_hour_kst: 7,
            is_active: true,
            updated_at: nowIso,
          },
          { onConflict: 'email' }
        )
        .select()
        .maybeSingle();
      if (!upErr) {
        savedToDedicatedTable = true;
        if (upserted?.id) sub.id = String(upserted.id);
      }
    } catch {
      // fall through
    }
    if (!savedToDedicatedTable) {
      await syncSubsToFallbackDb();
    }
  }

  const status = await getNewsletterStatus();
  return { ok: true, subscriber: sub, alreadySubscribed, status };
}

export async function unsubscribeNewsletter(rawEmail: string): Promise<{ ok: boolean; email: string }> {
  const email = normalizeEmail(rawEmail);
  if (!isValidEmail(email)) {
    throw new Error('올바른 이메일 주소가 아닙니다.');
  }
  await listActiveSubscribers().catch(() => {});
  const existing = memSubs.get(email);
  if (existing) {
    existing.isActive = false;
    memSubs.set(email, existing);
    saveDiskSubs();
  }
  const sb = getSupabaseAdminClient();
  if (sb) {
    try {
      await sb
        .from('newsletter_subscribers')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('email', email);
    } catch {
      // ignore
    }
    await syncSubsToFallbackDb();
  }
  return { ok: true, email };
}

async function markSubscriberSent(email: string, dateKst: string) {
  const existing = memSubs.get(email);
  if (existing) {
    existing.lastSentKst = dateKst;
    memSubs.set(email, existing);
    saveDiskSubs();
  }
  const sb = getSupabaseAdminClient();
  if (sb) {
    let saved = false;
    try {
      const { error } = await sb
        .from('newsletter_subscribers')
        .update({ last_sent_kst: dateKst, updated_at: new Date().toISOString() })
        .eq('email', email);
      if (!error) saved = true;
    } catch {
      // ignore
    }
    if (!saved) {
      await syncSubsToFallbackDb();
    }
  }
}

export async function buildDailyMorningIssue(opt?: {
  forceRefresh?: boolean;
  geminiKey?: string;
}): Promise<NewsletterIssue> {
  const dateKst = getKstTodayString();
  const tomorrowKst = getKstTomorrowString();

  if (!opt?.forceRefresh) {
    const cached = loadDiskIssue(dateKst);
    if (cached && cached.items.length > 0) {
      return cached;
    }
    const sb = getSupabaseAdminClient();
    if (sb) {
      try {
        const { data } = await sb
          .from('newsletter_issues')
          .select('*')
          .eq('issue_date', dateKst)
          .maybeSingle();
        if (data && Array.isArray(data.items_json) && data.items_json.length > 0) {
          const fromDb: NewsletterIssue = {
            dateKst,
            tomorrowKst,
            subject: data.subject,
            intro: data.summary || `오늘(${dateKst}) 오전 7시 기준 가장 뜨거운 화제 인물 6명 브리핑입니다.`,
            generatedAt: data.created_at || new Date().toISOString(),
            usedAi: true,
            items: data.items_json,
            upcoming: Array.isArray(data.upcoming_json) ? data.upcoming_json : [],
          };
          saveDiskIssue(fromDb);
          return fromDb;
        }
      } catch {
        // ignore missing table
      }
    }
  }

  const liveSignals = await collectLiveTrendSignals({
    timeframe: '24h',
    category: 'all',
    channel: 'all',
  }).catch(() => null);

  const apiKey = (opt?.geminiKey || process.env.GEMINI_API_KEY || '').trim();
  let items: NewsletterBriefItem[] = [];
  let upcoming: NewsletterBriefItem[] = [];
  let usedAi = false;
  let intro = `${dateKst} 오전 7시 기준, 실시간 검색어·뉴스에서 급상승한 오늘의 인물 6인과 내일(${tomorrowKst}) 선점 포인트를 정리했습니다.`;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const briefText = liveSignals?.formattedBrief
        ? `\n[실시간 수집 신호 (${dateKst} KST)]\n${liveSignals.formattedBrief}\n`
        : '';

      const prompt = `당신은 'Untold 오전 7시 모닝 브리핑' 수석 에디터입니다.
오늘 날짜는 ${dateKst}(한국시간), 내일은 ${tomorrowKst}입니다.
${briefText}
Google Search와 위 실시간 뉴스/검색어 신호를 결합하여 아래 JSON 객체만 출력하세요(설명·마크다운 금지):
1. "items": 오늘(${dateKst}) 쇼츠/캐러셀 조회수가 가장 잘 나올 분야별 화제 인물 정확히 6명 (연예·스포츠·경제·사회·바이럴·글로벌 고루 배분). 과거 수년 전 일화 절대 금지.
2. "upcoming": 내일(${tomorrowKst})~이번 주 예정 일정으로 오늘 미리 업로드하면 검색량을 선점할 인물 2명.
{
  "intro": "오늘 아침 한 줄 브리핑 요약",
  "items": [
    {
      "rank": 1,
      "name": "인물명",
      "category": "viral | entertainment | actor | sports | economy | social | global",
      "title": "지금 왜 화제인지 한 줄 제목",
      "whyNow": "최근 24~48시간 구체적 날짜·숫자 기반 핵심 사건 1~2문장",
      "facts": ["팩트 1", "팩트 2", "팩트 3"],
      "hookLine": "첫 3초 스크롤 정지 오프닝 훅 1줄",
      "shortsIdea": "바로 찍을 수 있는 쇼츠 구성 아이디어 1줄",
      "tags": ["태그1", "태그2", "태그3", "태그4"],
      "viralityScore": 98
    }
  ],
  "upcoming": [
    {
      "rank": 1,
      "name": "인물명",
      "category": "upcoming",
      "title": "내일 예정 이슈 제목",
      "whyNow": "내일(${tomorrowKst}) 예정 일정 및 기대 포인트",
      "facts": ["일정 팩트 1", "관전 포인트 2"],
      "hookLine": "선점용 첫 3초 오프닝 훅",
      "shortsIdea": "선점 쇼츠 아이디어 1줄",
      "tags": ["내일예고", "선점추천", "키워드"],
      "viralityScore": 94,
      "scheduledDate": "내일(${tomorrowKst.slice(5).replace('-', '/')})"
    }
  ]
}`;

      const models = ['gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-2.5-flash'];
      for (const mod of models) {
        try {
          const resp = await ai.models.generateContent({
            model: mod,
            contents: prompt,
            config: { temperature: 0.3, tools: [{ googleSearch: {} }] },
          });
          const raw = String(resp.text || '')
            .trim()
            .replace(/^```(?:json)?\s*/i, '')
            .replace(/\s*```$/, '');
          const s = raw.indexOf('{');
          const e = raw.lastIndexOf('}');
          const parsed = JSON.parse(s >= 0 && e > s ? raw.slice(s, e + 1) : raw);
          if (Array.isArray(parsed?.items) && parsed.items.length > 0) {
            if (parsed.intro) intro = String(parsed.intro).trim();
            items = parsed.items.slice(0, 6).map((it: any, i: number) => ({
              rank: i + 1,
              name: String(it.name || '').trim(),
              category: String(it.category || 'viral'),
              title: String(it.title || '').trim(),
              whyNow: String(it.whyNow || '').trim(),
              facts: Array.isArray(it.facts) ? it.facts.slice(0, 3).map(String) : [],
              hookLine: String(it.hookLine || '').trim(),
              shortsIdea: String(it.shortsIdea || '').trim(),
              tags: Array.isArray(it.tags) ? it.tags.slice(0, 5).map((t: any) => String(t).replace(/^#/, '')) : [],
              viralityScore: Math.min(100, Math.max(88, Number(it.viralityScore) || 98 - i)),
            }));
            upcoming = Array.isArray(parsed.upcoming)
              ? parsed.upcoming.slice(0, 3).map((u: any, i: number) => ({
                  rank: i + 1,
                  name: String(u.name || '').trim(),
                  category: 'upcoming',
                  title: String(u.title || '').trim(),
                  whyNow: String(u.whyNow || '').trim(),
                  facts: Array.isArray(u.facts) ? u.facts.slice(0, 3).map(String) : [],
                  hookLine: String(u.hookLine || '').trim(),
                  shortsIdea: String(u.shortsIdea || '').trim(),
                  tags: Array.isArray(u.tags) ? u.tags.slice(0, 4).map((t: any) => String(t).replace(/^#/, '')) : ['내일예고', '선점'],
                  viralityScore: Number(u.viralityScore) || 93,
                  scheduledDate: String(u.scheduledDate || `내일(${tomorrowKst.slice(5).replace('-', '/')})`),
                }))
              : [];
            usedAi = true;
            break;
          }
        } catch {
          // try next model
        }
      }
    } catch {
      // fall through
    }
  }

  if (items.length === 0) {
    const rssToday = buildSignalFallbackFigures(liveSignals, '24h', 'all').slice(0, 6);
    items = rssToday.map((f: any, idx: number) => ({
      rank: idx + 1,
      name: String(f.name || `이슈 ${idx + 1}`),
      category: String(f.category || 'viral'),
      title: String(f.title || ''),
      whyNow: String(f.buzzSummary || ''),
      facts: [String(f.controversyOrIssue || ''), String(f.suggestedAngle || '')].filter(Boolean),
      hookLine: String(f.hookLine || ''),
      shortsIdea: String(f.suggestedAngle || ''),
      tags: Array.isArray(f.tags) ? f.tags : ['오늘화제', '실시간'],
      viralityScore: Number(f.viralityScore) || 95 - idx,
    }));

    const rssUp = buildSignalFallbackFigures(liveSignals, '24h', 'upcoming').slice(0, 2);
    upcoming = rssUp.map((u: any, idx: number) => ({
      rank: idx + 1,
      name: String(u.name || `예정 ${idx + 1}`),
      category: 'upcoming',
      title: String(u.title || ''),
      whyNow: String(u.buzzSummary || ''),
      facts: [String(u.controversyOrIssue || '')].filter(Boolean),
      hookLine: String(u.hookLine || ''),
      shortsIdea: String(u.suggestedAngle || ''),
      tags: ['내일예고', '선점추천'],
      viralityScore: 93 - idx,
      scheduledDate: `내일(${tomorrowKst.slice(5).replace('-', '/')})`,
    }));
  }

  const leadNames = items.slice(0, 3).map((x) => x.name).filter(Boolean).join('·');
  const issue: NewsletterIssue = {
    dateKst,
    tomorrowKst,
    subject: `[Untold 오전 7시 브리핑 · ${dateKst.slice(5).replace('-', '/')}] 오늘의 인물 ${leadNames || '6인'} + 내일 선점`,
    intro,
    generatedAt: new Date().toISOString(),
    usedAi,
    items,
    upcoming,
  };

  saveDiskIssue(issue);

  const sb = getSupabaseAdminClient();
  if (sb) {
    try {
      await sb.from('newsletter_issues').upsert(
        {
          issue_date: dateKst,
          subject: issue.subject,
          summary: issue.intro,
          items_json: issue.items,
          upcoming_json: issue.upcoming,
          html_body: renderNewsletterEmailHtml(issue),
        },
        { onConflict: 'issue_date' }
      );
    } catch {
      // ignore if table not yet migrated
    }
  }

  return issue;
}

function escapeHtml(s: string): string {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderNewsletterEmailHtml(issue: NewsletterIssue, recipientEmail?: string): string {
  const appUrl = (process.env.APP_URL || 'https://untold-dashboard.vercel.app').replace(/\/+$/, '');
  const unsubUrl = recipientEmail
    ? `${appUrl}/api/newsletter/preview?unsubscribe=${encodeURIComponent(recipientEmail)}`
    : `${appUrl}/`;

  const cardsHtml = issue.items
    .map(
      (it) => `
      <div style="background:#ffffff;border:1px solid #e9e9e7;border-radius:14px;padding:18px;margin-bottom:14px;">
        <div style="font-size:12px;color:#6366f1;font-weight:700;margin-bottom:4px;">
          #${it.rank} · ${escapeHtml(it.category.toUpperCase())} · 화제성 ${it.viralityScore}점
        </div>
        <h2 style="margin:0 0 6px;font-size:18px;color:#191919;">${escapeHtml(it.name)} — ${escapeHtml(it.title)}</h2>
        <p style="margin:0 0 10px;font-size:14px;line-height:1.55;color:#37352f;">${escapeHtml(it.whyNow)}</p>
        ${
          it.facts.length > 0
            ? `<ul style="margin:0 0 10px;padding-left:18px;font-size:13px;color:#5c5a54;line-height:1.5;">
                ${it.facts.map((f) => `<li>${escapeHtml(f)}</li>`).join('')}
               </ul>`
            : ''
        }
        <div style="background:#f7f7f5;border-radius:10px;padding:10px 12px;margin-bottom:10px;">
          <div style="font-size:12px;font-weight:700;color:#191919;">🎬 첫 3초 훅: “${escapeHtml(it.hookLine)}”</div>
          ${it.shortsIdea ? `<div style="font-size:12px;color:#787774;margin-top:4px;">💡 쇼츠 앵글: ${escapeHtml(it.shortsIdea)}</div>` : ''}
        </div>
        <div style="font-size:12px;color:#6b7280;">
          ${it.tags.map((t) => `#${escapeHtml(t)}`).join('  ')}
        </div>
      </div>`
    )
    .join('');

  const upcomingHtml =
    issue.upcoming.length > 0
      ? `
      <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:14px;padding:16px;margin-top:18px;">
        <div style="font-size:13px;font-weight:700;color:#5b21b6;margin-bottom:8px;">🔭 내일(${escapeHtml(issue.tomorrowKst)}) 예고 · 선점 추천</div>
        ${issue.upcoming
          .map(
            (u) => `
          <div style="margin-bottom:10px;font-size:13px;color:#37352f;">
            <strong>${escapeHtml(u.name)}</strong> (${escapeHtml(u.scheduledDate || '내일 예정')}) — ${escapeHtml(u.title)}<br/>
            <span style="color:#6d28d9;">훅: “${escapeHtml(u.hookLine)}”</span>
          </div>`
          )
          .join('')}
      </div>`
      : '';

  return `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8" /><title>${escapeHtml(issue.subject)}</title></head>
<body style="margin:0;padding:0;background:#faf9f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Noto Sans KR',sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:24px 16px;">
    <div style="background:#23272a;color:#ffffff;border-radius:16px;padding:22px;margin-bottom:18px;">
      <div style="font-size:12px;color:#a5b4fc;font-weight:700;letter-spacing:0.04em;">UNTOLD · DAILY 07:00 KST BRIEFING</div>
      <h1 style="margin:6px 0 8px;font-size:22px;line-height:1.3;">오늘 아침 화제 인물 6인 &amp; 내일 선점 소재</h1>
      <p style="margin:0;font-size:14px;color:#e5e7eb;line-height:1.5;">${escapeHtml(issue.intro)}</p>
      <div style="margin-top:14px;">
        <a href="${appUrl}" style="display:inline-block;background:#ffffff;color:#191919;text-decoration:none;font-weight:700;font-size:13px;padding:10px 16px;border-radius:10px;">
          스튜디오에서 바로 쇼츠·캐러셀 제작하기 →
        </a>
      </div>
    </div>
    ${cardsHtml}
    ${upcomingHtml}
    <div style="text-align:center;margin-top:24px;font-size:11px;color:#9b9a97;line-height:1.6;">
      본 메일은 매일 오전 7시(KST) Untold AutoShorts 트렌드 레이더 구독자에게 발송됩니다.<br/>
      <a href="${unsubUrl}" style="color:#787774;">수신 거부(구독 해지)</a>
    </div>
  </div>
</body>
</html>`;
}

export function renderNewsletterEmailText(issue: NewsletterIssue): string {
  const lines: string[] = [
    `[Untold 오전 7시 브리핑 · ${issue.dateKst}]`,
    issue.intro,
    '',
  ];
  issue.items.forEach((it) => {
    lines.push(`#${it.rank} ${it.name} — ${it.title} (${it.viralityScore}점)`);
    lines.push(`- 왜 지금: ${it.whyNow}`);
    lines.push(`- 첫 3초 훅: "${it.hookLine}"`);
    if (it.shortsIdea) lines.push(`- 쇼츠 앵글: ${it.shortsIdea}`);
    lines.push(`- 태그: ${it.tags.map((t) => `#${t}`).join(' ')}`);
    lines.push('');
  });
  if (issue.upcoming.length > 0) {
    lines.push(`[🔭 내일(${issue.tomorrowKst}) 예고 · 선점 추천]`);
    issue.upcoming.forEach((u) => {
      lines.push(`- ${u.name} (${u.scheduledDate || '내일'}): ${u.title} / 훅: "${u.hookLine}"`);
    });
  }
  return lines.join('\n');
}

function inferSmtpFromEmail(email: string, hostOverride?: string, portOverride?: number) {
  if (hostOverride) {
    const port = portOverride || 587;
    return { host: hostOverride, port, secure: port === 465 };
  }
  const lower = email.toLowerCase();
  if (lower.endsWith('@naver.com')) {
    return { host: 'smtp.naver.com', port: 587, secure: false };
  }
  if (lower.endsWith('@daum.net') || lower.endsWith('@hanmail.net') || lower.endsWith('@kakao.com')) {
    return { host: 'smtp.daum.net', port: 465, secure: true };
  }
  return { host: 'smtp.gmail.com', port: 465, secure: true };
}

export async function sendNewsletterEmail(
  to: string,
  issue: NewsletterIssue
): Promise<{ ok: boolean; configured: boolean; provider: 'resend' | 'brevo' | 'smtp' | 'none'; error?: string }> {
  const cfg = getEnvMailConfig();
  const html = renderNewsletterEmailHtml(issue, to);
  const text = renderNewsletterEmailText(issue);

  if (cfg.resendKey) {
    const from = cfg.fromEmail || 'Untold 모닝 브리핑 <onboarding@resend.dev>';
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfg.resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: issue.subject,
        html,
        text,
      }),
    });
    if (!r.ok) {
      const errBody = await r.text().catch(() => '');
      const hint = /only send testing emails to your own email/i.test(errBody)
        ? ' (Resend 도메인 인증 완료 또는 운영자 본인 메일 테스트 시 정상 발송됩니다.)'
        : '';
      return {
        ok: false,
        configured: true,
        provider: 'resend',
        error: `Resend 오류 (${r.status})${hint}: ${errBody.slice(0, 160)}`,
      };
    }
    return { ok: true, configured: true, provider: 'resend' };
  }

  if (cfg.brevoKey) {
    const senderEmail = cfg.fromEmail || 'noreply@untold-dashboard.vercel.app';
    const r = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': cfg.brevoKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'Untold 모닝 브리핑', email: senderEmail },
        to: [{ email: to }],
        subject: issue.subject,
        htmlContent: html,
        textContent: text,
      }),
    });
    if (!r.ok) {
      const errBody = await r.text().catch(() => '');
      return { ok: false, configured: true, provider: 'brevo', error: `Brevo 오류 (${r.status}): ${errBody.slice(0, 160)}` };
    }
    return { ok: true, configured: true, provider: 'brevo' };
  }

  if (cfg.smtpUser && cfg.smtpPass) {
    const smtp = inferSmtpFromEmail(cfg.smtpUser, cfg.smtpHost, cfg.smtpPort);
    try {
      const transporter = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure,
        auth: {
          user: cfg.smtpUser,
          pass: cfg.smtpPass,
        },
      });
      await transporter.sendMail({
        from: `Untold 모닝 브리핑 <${cfg.smtpUser}>`,
        to,
        subject: issue.subject,
        text,
        html,
      });
      return { ok: true, configured: true, provider: 'smtp' };
    } catch (err: any) {
      const msg = String(err?.message || err);
      const hint = /auth|535|invalid|login|username/i.test(msg)
        ? ' (서버 SMTP 계정 또는 앱 비밀번호 환경변수를 확인해 주세요.)'
        : '';
      return {
        ok: false,
        configured: true,
        provider: 'smtp',
        error: `SMTP 발송 실패${hint}: ${msg.slice(0, 160)}`,
      };
    }
  }

  return {
    ok: false,
    configured: false,
    provider: 'none',
    error: '이메일은 구독 목록에 등록되었으며, 실제 외부 발송은 운영 서버(Vercel 환경변수 RESEND_API_KEY) 설정 후 매일 오전 7시 작동합니다. 지금은 [메일앱 열기] 또는 [전문 복사]로 바로 확인하실 수 있습니다.',
  };
}

export async function runDailyNewsletterCron(opt?: { forceResendSameDay?: boolean }): Promise<{
  ok: boolean;
  dateKst: string;
  totalActive: number;
  sent: number;
  skipped: number;
  failed: number;
  deliveryConfigured: boolean;
  message: string;
}> {
  const issue = await buildDailyMorningIssue({ forceRefresh: true });
  const subs = await listActiveSubscribers();
  const status = await getNewsletterStatus();

  if (!status.emailConfigured) {
    return {
      ok: true,
      dateKst: issue.dateKst,
      totalActive: subs.length,
      sent: 0,
      skipped: subs.length,
      failed: 0,
      deliveryConfigured: false,
      message: `오늘(${issue.dateKst}) 07:00 브리핑은 생성되었으나, 메일 발송 연동(SMTP 또는 Resend)이 아직 설정되지 않아 대기 중입니다.`,
    };
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const sub of subs) {
    if (!opt?.forceResendSameDay && sub.lastSentKst === issue.dateKst) {
      skipped += 1;
      continue;
    }
    const res = await sendNewsletterEmail(sub.email, issue);
    if (res.ok) {
      sent += 1;
      await markSubscriberSent(sub.email, issue.dateKst);
    } else {
      failed += 1;
    }
  }

  return {
    ok: failed === 0,
    dateKst: issue.dateKst,
    totalActive: subs.length,
    sent,
    skipped,
    failed,
    deliveryConfigured: true,
    message: `${issue.dateKst} 오전 7시 브리핑 발송 완료: 성공 ${sent}명, 건너뜀 ${skipped}명, 실패 ${failed}명`,
  };
}
