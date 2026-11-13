export interface LiveSignalItem {
  source: string;
  title: string;
  pubDate: string;
  traffic?: string;
  relatedHeadline?: string;
}

export interface LiveSignalsBundle {
  fetchedAt: string;
  todayKst: string;
  trendsKr: LiveSignalItem[];
  headlines: LiveSignalItem[];
  formattedBrief: string;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const signalsCache = new Map<string, { expiresAt: number; data: LiveSignalsBundle }>();

export function getKstTodayString(): string {
  try {
    return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function decodeXmlEntities(str: string): string {
  return String(str || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTag(block: string, tagName: string): string {
  const escaped = tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`<${escaped}[^>]*>([\\s\\S]*?)<\\/${escaped}>`, 'i');
  const m = block.match(re);
  return m ? decodeXmlEntities(m[1]) : '';
}

function parseRssXml(xml: string, source: string, maxItems = 12): LiveSignalItem[] {
  const items: LiveSignalItem[] = [];
  const itemMatches = String(xml || '').match(/<item\b[\s\S]*?<\/item>/gi) || [];

  for (const raw of itemMatches.slice(0, maxItems)) {
    const title = extractTag(raw, 'title');
    if (!title) continue;
    const pubDate = extractTag(raw, 'pubDate');
    const traffic = extractTag(raw, 'ht:approx_traffic');
    const relatedHeadline = extractTag(raw, 'ht:news_item_title');
    items.push({
      source,
      title,
      pubDate,
      ...(traffic ? { traffic } : {}),
      ...(relatedHeadline ? { relatedHeadline } : {}),
    });
  }
  return items;
}

async function fetchFeed(url: string, source: string, maxItems = 12): Promise<LiveSignalItem[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4500);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AutoShortsRadar/1.0)',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRssXml(xml, source, maxItems);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

function formatKstShort(pubDate: string): string {
  if (!pubDate) return '';
  const ts = Date.parse(pubDate);
  if (Number.isNaN(ts)) return pubDate.slice(0, 16);
  try {
    return new Date(ts).toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return pubDate.slice(0, 16);
  }
}

export async function collectLiveTrendSignals(opts?: {
  timeframe?: string;
  category?: string;
  channel?: string;
}): Promise<LiveSignalsBundle> {
  const timeframe = opts?.timeframe || '24h';
  const category = opts?.category || 'all';
  const channel = opts?.channel || 'all';
  const cacheKey = `${timeframe}:${category}:${channel}`;
  const cached = signalsCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const whenParam = timeframe === '7d' ? '7d' : timeframe === '48h' ? '2d' : '1d';

  const feeds: Array<{ url: string; source: string; limit: number }> = [
    { url: 'https://trends.google.com/trending/rss?geo=KR', source: '구글 급상승 검색어(KR)', limit: 15 },
    { url: 'https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko', source: '주요뉴스', limit: 10 },
  ];

  const addTopic = (topic: string, source: string, limit = 8) => {
    feeds.push({
      url: `https://news.google.com/rss/headlines/section/topic/${topic}?hl=ko&gl=KR&ceid=KR:ko`,
      source,
      limit,
    });
  };

  if (category === 'all' || category === 'entertainment' || category === 'actor') {
    addTopic('ENTERTAINMENT', '연예·방송', category === 'all' ? 7 : 14);
  }
  if (category === 'all' || category === 'sports') {
    addTopic('SPORTS', '스포츠', category === 'all' ? 7 : 14);
  }
  if (category === 'all' || category === 'economy') {
    addTopic('BUSINESS', '경제·기업', category === 'all' ? 7 : 14);
  }
  if (category === 'all' || category === 'global') {
    addTopic('WORLD', '글로벌', category === 'all' ? 7 : 14);
  }
  if (category === 'all' || category === 'social') {
    addTopic('NATION', '사회·정치', category === 'all' ? 7 : 14);
  }
  if (category === 'all' || category === 'viral' || channel === 'youtube' || channel === 'instagram') {
    const viralQuery = encodeURIComponent(`when:${whenParam} (유튜브 OR 쇼츠 OR 릴스 OR 인스타 OR 유튜버 OR 화제)`);
    feeds.push({
      url: `https://news.google.com/rss/search?q=${viralQuery}&hl=ko&gl=KR&ceid=KR:ko`,
      source: 'SNS·유튜브 바이럴',
      limit: category === 'viral' ? 14 : 8,
    });
  }

  const results = await Promise.allSettled(feeds.map((f) => fetchFeed(f.url, f.source, f.limit)));

  const trendsKr: LiveSignalItem[] = [];
  const rawHeadlines: LiveSignalItem[] = [];

  results.forEach((res, idx) => {
    if (res.status !== 'fulfilled') return;
    if (idx === 0) {
      trendsKr.push(...res.value);
    } else {
      rawHeadlines.push(...res.value);
    }
  });

  // Sort headlines newest first & deduplicate
  const seen = new Set<string>();
  const headlines = rawHeadlines
    .sort((a, b) => (Date.parse(b.pubDate || '') || 0) - (Date.parse(a.pubDate || '') || 0))
    .filter((item) => {
      const key = item.title.replace(/\s+/g, '').slice(0, 28);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 42);

  const todayKst = getKstTodayString();
  const lines: string[] = [];

  if (trendsKr.length > 0) {
    lines.push(`[실시간 구글 급상승 검색어 KR (${todayKst} 기준)]`);
    trendsKr.slice(0, 12).forEach((t) => {
      const extra = [t.traffic ? `검색 ${t.traffic}` : '', t.relatedHeadline || ''].filter(Boolean).join(' · ');
      lines.push(`- ${t.title}${extra ? ` (${extra})` : ''}`);
    });
  }

  if (headlines.length > 0) {
    lines.push(`\n[실시간 분야별 최신 뉴스 헤드라인 (${todayKst} 기준)]`);
    headlines.forEach((h) => {
      const timeStr = formatKstShort(h.pubDate);
      lines.push(`- [${h.source}${timeStr ? ` · ${timeStr}` : ''}] ${h.title}`);
    });
  }

  const bundle: LiveSignalsBundle = {
    fetchedAt: new Date().toISOString(),
    todayKst,
    trendsKr,
    headlines,
    formattedBrief: lines.join('\n'),
  };

  if (trendsKr.length > 0 || headlines.length > 0) {
    signalsCache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, data: bundle });
  }

  return bundle;
}

function mapSourceToCategory(source: string): string {
  if (source.includes('연예')) return 'entertainment';
  if (source.includes('스포츠')) return 'sports';
  if (source.includes('경제')) return 'economy';
  if (source.includes('글로벌')) return 'global';
  if (source.includes('사회')) return 'social';
  return 'viral';
}

export function buildSignalFallbackFigures(
  bundle: LiveSignalsBundle | null,
  timeframe: string,
  requestedCategory: string
): Array<Record<string, any>> {
  if (!bundle || (bundle.headlines.length === 0 && bundle.trendsKr.length === 0)) {
    return [];
  }

  const now = Date.now();
  const out: Array<Record<string, any>> = [];

  bundle.headlines.slice(0, 14).forEach((h, idx) => {
    const [headlineBody, mediaName] = h.title.split(/\s+-\s+(?=[^-]+$)/);
    const cleanBody = (headlineBody || h.title).trim();
    const timeLabel = formatKstShort(h.pubDate) || bundle.todayKst;
    const cat = requestedCategory !== 'all' ? requestedCategory : mapSourceToCategory(h.source);
    const quoteOrSubject = cleanBody.match(/^['‘“"]?([^,·…:]{2,18})/)?.[1]?.trim() || h.source;

    out.push({
      id: `fig-rss-${now}-${idx}`,
      name: quoteOrSubject,
      title: cleanBody,
      category: cat,
      viralityScore: Math.max(88, 99 - idx),
      timeframe,
      buzzSummary: `[${timeLabel}${mediaName ? ` · ${mediaName}` : ''}] ${cleanBody}`,
      controversyOrIssue: `${h.source} 실시간 주요 이슈로 주목받고 있습니다.`,
      suggestedAngle: `오늘(${bundle.todayKst}) 화제 뉴스 핵심 요약 및 쟁점 정리`,
      hookLine: `오늘 뉴스 가장 많이 본 이슈: ${cleanBody.slice(0, 34)}${cleanBody.length > 34 ? '…' : ''}`,
      tags: [h.source.replace(/·/g, ''), '오늘화제', '실시간뉴스'],
      primaryChannel: 'naver',
      channelMetrics: {
        naverRank: `${h.source} 최신 이슈`,
      },
      isHot: idx < 5,
      isLive: true,
    });
  });

  return out;
}
