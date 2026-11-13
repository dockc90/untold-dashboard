/* eslint-disable @typescript-eslint/no-explicit-any */
// Client-side AI & Media Services ported cleanly from ssamtool/sinsoo architecture.
// All API requests run directly from the user's browser using user-supplied keys stored in localStorage.
import type { CategoryType, SourceChannel, TimeFilter, TrendingFigure, YoutubeBreakoutMetric } from '../types';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com';
const YT_BASE = 'https://www.googleapis.com/youtube/v3';

const LS_SETTINGS = 'autoshorts.sinsoo.settings.v1';
const LS_TRANSPORT = 'autoshorts.sinsoo.transport.v1';
const LS_DAILY_TTS = 'autoshorts.sinsoo.ttsDaily.v1';
const LS_MODEL_STATE = 'autoshorts.sinsoo.modelState.v1';

export interface SinsooSettings {
  geminiKey: string;
  ytKey: string;
  elevenLabsKey: string;
  ttsProvider: 'elevenlabs' | 'gemini';
  elevenLabsModel: string;
  elevenLabsVoiceId: string;
  model: string;
  models: string[];
  okModels: string[];
  ttsModel: string;
  ttsModels?: string[];
  voice: string;
  ttsStyle: string;
  imgModel: string;
  imgModels?: string[];
  brand: string;
  handle: string;
  outW: 720 | 1080;
  layout: 'blur' | 'crop' | 'full' | 'frame';
  monitor: boolean;
  keepSource: boolean;
  subSize: number;
  titleFont: string;
  titleAccent: string;
  candCount: number;
  candMin: number;
  candMax: number;
  analysisRes: 'auto' | 'low' | 'medium';
}

export const ELEVENLABS_MODELS = [
  { id: 'eleven_v4', label: 'Eleven v4 (최신 · 유료 구독 기본)' },
  { id: 'eleven_multilingual_v2', label: 'Multilingual v2 (다국어 안정형)' },
  { id: 'eleven_flash_v2_5', label: 'Flash v2.5 (초저지연 고속)' },
] as const;

export const DEFAULT_SINSOO_SETTINGS: SinsooSettings = {
  geminiKey: '',
  ytKey: '',
  elevenLabsKey: '',
  ttsProvider: 'gemini',
  elevenLabsModel: 'eleven_v4',
  elevenLabsVoiceId: 'JBFqnCBsd6RMkjVDRZzb',
  model: 'gemini-flash-latest',
  models: [
    'gemini-flash-latest',
    'gemini-flash-lite-latest',
    'gemini-3.8-flash',
    'gemini-3.7-flash',
    'gemini-3.1-flash-lite',
    'gemini-4-hydrogen',
    'gemini-2.5-flash',
  ],
  okModels: [],
  ttsModel: 'gemini-3.8-flash-tts',
  ttsModels: [
    'gemini-3.8-flash-tts',
    'gemini-3.8-flash-lite-tts',
    'gemini-3.1-flash-tts-preview',
    'gemini-2.5-flash-preview-tts',
    'gemini-2.5-pro-preview-tts',
  ],
  voice: 'Kore',
  ttsStyle: '차분하고 또렷한 다큐멘터리 내레이션',
  imgModel: 'gemini-nano-banana-2.1',
  imgModels: [
    'gemini-nano-banana-2.1',
    'gemini-3.1-flash-image',
    'gemini-3.1-flash-lite-image',
    'gemini-3.1-flash-image-preview',
    'gemini-3-pro-image',
    'gemini-3-pro-image-preview',
    'nano-banana-pro-preview',
    'gemini-2.5-flash-image',
  ],
  brand: '',
  handle: '',
  outW: 1080,
  layout: 'blur',
  monitor: true,
  keepSource: true,
  subSize: 54,
  titleFont: 'Black Han Sans',
  titleAccent: '#ffd54a',
  candCount: 6,
  candMin: 20,
  candMax: 50,
  analysisRes: 'auto',
};

export const GEMINI_FALLBACK_CATALOG = {
  text: [
    'gemini-flash-latest',
    'gemini-flash-lite-latest',
    'gemini-3.8-flash',
    'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-4-hydrogen',
    'gemini-pro-latest',
    'gemini-2.5-flash',
  ],
  textLite: [
    'gemini-flash-lite-latest',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-3.8-flash',
    'gemini-4-hydrogen',
  ],
  tts: [
    'gemini-3.8-flash-tts',
    'gemini-3.8-flash-lite-tts',
    'gemini-3.1-flash-tts-preview',
    'gemini-2.5-flash-preview-tts',
    'gemini-2.5-pro-preview-tts',
  ],
  image: [
    'gemini-nano-banana-2.1',
    'gemini-3.1-flash-image',
    'gemini-3.1-flash-lite-image',
    'gemini-3.1-flash-image-preview',
    'gemini-3-pro-image',
    'gemini-3-pro-image-preview',
    'nano-banana-pro-preview',
    'gemini-2.5-flash-image',
  ],
};

export const GEMINI_VOICES = [
  'Kore', 'Zephyr', 'Puck', 'Charon', 'Fenrir', 'Leda', 'Orus', 'Aoede',
  'Callirrhoe', 'Autonoe', 'Enceladus', 'Iapetus', 'Umbriel', 'Algieba',
  'Despina', 'Erinome', 'Algenib', 'Rasalgethi', 'Laomedeia', 'Achernar',
  'Alnilam', 'Schedar', 'Gacrux', 'Pulcherrima', 'Achird', 'Zubenelgenubi',
  'Vindemiatrix', 'Sadachbia', 'Sadaltager', 'Sulafat',
] as const;

export type GeminiVoiceId = (typeof GEMINI_VOICES)[number];

export const GEMINI_VOICE_META: Record<string, [gender: '여' | '남', desc: string]> = {
  Kore: ['여', '단단하고 또렷한'],
  Zephyr: ['여', '밝고 명랑한'],
  Puck: ['남', '경쾌하고 활달한'],
  Charon: ['남', '차분한 정보 전달형'],
  Fenrir: ['남', '힘차고 들뜬'],
  Leda: ['여', '젊고 생기 있는'],
  Orus: ['남', '단호하고 묵직한'],
  Aoede: ['여', '산뜻하고 자연스러운'],
  Callirrhoe: ['여', '느긋하고 편안한'],
  Autonoe: ['여', '밝고 긍정적인'],
  Enceladus: ['남', '숨결 섞인 차분한'],
  Iapetus: ['남', '명료한'],
  Umbriel: ['남', '편안하고 느긋한'],
  Algieba: ['남', '부드러운'],
  Despina: ['여', '부드럽고 매끄러운'],
  Erinome: ['여', '또렷한'],
  Algenib: ['남', '거칠고 낮은'],
  Rasalgethi: ['남', '정보 전달형'],
  Laomedeia: ['여', '활기찬'],
  Achernar: ['여', '부드러운'],
  Alnilam: ['남', '단단한'],
  Schedar: ['남', '고르고 안정된'],
  Gacrux: ['여', '성숙한'],
  Pulcherrima: ['여', '직설적인'],
  Achird: ['남', '친근한'],
  Zubenelgenubi: ['남', '캐주얼한'],
  Vindemiatrix: ['여', '온화한'],
  Sadachbia: ['남', '생기 있는'],
  Sadaltager: ['남', '지적인'],
  Sulafat: ['여', '따뜻한'],
};

export interface GeminiVoiceInfo {
  id: string;
  name: string;
  gender: '여' | '남';
  desc: string;
  label: string;
}

export function listGeminiVoices(): GeminiVoiceInfo[] {
  return GEMINI_VOICES.map((id) => {
    const [gender, desc] = GEMINI_VOICE_META[id] || ['여', '기본'];
    return {
      id,
      name: id,
      gender,
      desc,
      label: `${id} · ${gender}성 · ${desc}`,
    };
  });
}

export class SinsooApiError extends Error {
  api: 'gemini' | 'youtube' | 'elevenlabs' | 'parse';
  status: number;
  raw?: unknown;
  aborted?: 'timeout' | 'cancel';
  daily?: boolean;
  wait?: string;

  constructor(api: 'gemini' | 'youtube' | 'elevenlabs' | 'parse', status: number, message: string, raw?: unknown) {
    super(message);
    this.name = 'SinsooApiError';
    this.api = api;
    this.status = status;
    this.raw = raw;
  }
}

export function loadSinsooSettings(): SinsooSettings {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_SETTINGS) || '{}');
    const merged: SinsooSettings = { ...DEFAULT_SINSOO_SETTINGS, ...raw };
    // Auto-migrate deprecated Gemini 2.5 default if user hasn't explicitly verified it in okModels
    if (
      /^gemini-2\.5-(flash|pro)(-lite)?$/.test(merged.model || '') &&
      !(merged.okModels || []).includes(merged.model)
    ) {
      merged.model = DEFAULT_SINSOO_SETTINGS.model;
    }
    if (
      Array.isArray(merged.models) &&
      merged.models.length > 0 &&
      merged.models.every((m) => /^gemini-2\./.test(m))
    ) {
      merged.models = Array.from(new Set([...DEFAULT_SINSOO_SETTINGS.models, ...merged.models]));
    }
    if (!merged.elevenLabsKey?.trim() && merged.ttsProvider === 'elevenlabs') {
      merged.ttsProvider = 'gemini';
    }
    return merged;
  } catch {
    return { ...DEFAULT_SINSOO_SETTINGS };
  }
}

export function saveSinsooSettings(next: Partial<SinsooSettings>): SinsooSettings {
  const merged = { ...loadSinsooSettings(), ...next };
  try {
    localStorage.setItem(LS_SETTINGS, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent('autoshorts:sinsoo-settings-changed', { detail: merged }));
  } catch {
    // ignore storage quota errors
  }
  return merged;
}

export function getActiveGeminiKey(): string {
  const s = loadSinsooSettings();
  if (s.geminiKey?.trim()) return s.geminiKey.trim();
  // Fallback: check env or legacy keys
  try {
    const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (envKey) return String(envKey).trim();
  } catch {
    // ignore
  }
  return '';
}

export function getActiveYoutubeKey(): string {
  return loadSinsooSettings().ytKey?.trim() || '';
}

export function getActiveElevenLabsKey(): string {
  return loadSinsooSettings().elevenLabsKey?.trim() || '';
}

/* ───────── Error Classification (ported from gemini.js & api.js) ───────── */

type ErrorCategory =
  | 'key'
  | 'disabled'
  | 'region'
  | 'billing'
  | 'search'
  | 'zero'
  | 'daily'
  | 'rate'
  | 'overload'
  | 'model'
  | 'network'
  | 'other';

export function classifyGeminiError(status: number, text: string): ErrorCategory {
  const t = String(text || '');
  if (status === 0) return 'network';
  if (
    status === 401 ||
    /API_KEY_INVALID|API key not valid|API key expired|API_KEY_SERVICE_BLOCKED|API_KEY_HTTP_REFERRER_BLOCKED|referer.*blocked|unregistered callers|API key.*(blocked|revoked|restricted)/i.test(t)
  ) {
    return 'key';
  }
  if (status === 403 && /SERVICE_DISABLED|has not been used in project|it is disabled|Enable it by visiting/i.test(t)) {
    return 'disabled';
  }
  if (/location is not supported|User location/i.test(t)) return 'region';
  if (
    status === 402 ||
    /prepay|prepaid|credit balance|out of credits|billing account|BILLING_DISABLED|insufficient (funds|balance)|payment required/i.test(t)
  ) {
    return 'billing';
  }
  if (status === 429 && /limit:\s*0\b|limit of 0|"quota_?[vV]alue":\s*"?0"?\b/i.test(t)) {
    return /grounding|search/i.test(t) ? 'search' : 'zero';
  }
  if (status === 429 && /per ?day|PerDay|per_day|daily/i.test(t)) return 'daily';
  if (status === 429) return 'rate';
  if (status >= 500 || /UNAVAILABLE|overloaded|DEADLINE_EXCEEDED/i.test(t)) return 'overload';
  if (/google_search|googleSearch|grounding|Search tool|search is not/i.test(t) && status >= 400 && status < 500) {
    return 'search';
  }
  if (status === 404) return 'model';
  if (status === 403) return 'key';
  if (
    status === 400 &&
    /not supported|does not support|unsupported|not found|is not a valid model|invalid model|not available|no longer|not allowed for|access to model|only available to/i.test(t)
  ) {
    return 'model';
  }
  return 'other';
}

export function explainSinsooError(err: unknown): string {
  if (!err) return '알 수 없는 오류가 발생했습니다.';
  if (err instanceof SinsooApiError) {
    if (err.aborted || err.daily) return err.message;
    if (err.api === 'elevenlabs') {
      if (err.status === 401 || /invalid_api_key|unauthorized/i.test(err.message)) {
        return 'ElevenLabs API 키가 유효하지 않거나 만료되었습니다. .env 또는 API 설정의 ElevenLabs 키를 확인해 주세요.';
      }
      if (err.status === 402 || err.status === 429 || /quota_exceeded|character limit/i.test(err.message)) {
        return 'ElevenLabs 구독 크레딧(글자 수 한도)이 부족하거나 요청이 너무 많습니다.';
      }
      return err.message || `ElevenLabs TTS 오류 (${err.status})`;
    }
    if (err.api === 'youtube') {
      const m = err.message || '';
      if (err.status === 401) return m;
      if (/quotaExceeded|dailyLimitExceeded|rateLimitExceeded/i.test(m)) {
        return 'YouTube API 할당량을 모두 사용했습니다(하루 10,000단위, 검색 하루 100회). 한국 시간 오후 4~5시에 초기화됩니다.';
      }
      if (/keyInvalid|API key not valid/i.test(m)) return 'YouTube API 키가 올바르지 않습니다.';
      if (/accessNotConfigured|SERVICE_DISABLED/i.test(m)) {
        return '이 키의 프로젝트에서 "YouTube Data API v3"가 꺼져 있습니다. Google Cloud 콘솔에서 사용 설정해 주세요.';
      }
      if (/ipRefererBlocked|referer/i.test(m)) {
        return 'YouTube API 키의 웹사이트 도메인 제한 때문에 차단되었습니다. 허용 도메인에 현재 주소를 추가하거나 제한을 해제해 주세요.';
      }
      return `YouTube 오류 (${err.status}): ${m}`;
    }

    const combined = `${err.message} ${err.raw ? JSON.stringify(err.raw) : ''}`;
    const cat = classifyGeminiError(err.status, combined);
    switch (cat) {
      case 'key':
        return 'API 키가 올바르지 않거나 차단되었습니다. Google AI Studio에서 키(AIza… 또는 AQ.…)를 확인해 주세요.';
      case 'disabled':
        return '이 키의 Google Cloud 프로젝트에서 "Generative Language API"가 꺼져 있습니다. AI Studio에서 새 키를 만들어 주세요.';
      case 'region':
        return '현재 접속 지역에서는 Gemini API를 사용할 수 없습니다(VPN이 켜져 있다면 해제해 주세요).';
      case 'billing':
        return '결제 문제로 요청이 거절되었습니다. AI Studio 결제 설정을 확인해 주세요.';
      case 'zero':
        return '이 키는 무료 사용량이 0으로 잡혀 있습니다(429 limit: 0). 설정에서 "키 확인"을 누르거나 다른 Google 계정으로 새 키를 발급받아 보세요.';
      case 'daily':
        return '오늘 사용할 수 있는 무료 요청 한도를 모두 소진했습니다. 한국 시간 오후 4~5시에 초기화됩니다.';
      case 'rate':
        return '1분당 요청 한도에 도달했습니다. 잠시 후(30~60초) 다시 시도해 주세요.';
      case 'overload':
        return 'Gemini 서버가 일시적으로 혼잡합니다(503). 잠시 후 다시 시도해 주세요.';
      case 'model':
        return '선택한 모델을 현재 키에서 사용할 수 없습니다(404). API 설정 → "키 확인 · 모델 불러오기"를 눌러 주세요.';
      case 'network':
        return '네트워크 오류입니다. 인터넷 연결 또는 광고 차단기를 확인해 주세요.';
      default:
        return err.message || `Gemini 오류 (${err.status})`;
    }
  }
  return err instanceof Error ? err.message : String(err);
}

/* ───────── Core Gemini Transport (Interactions + generateContent Fallback) ───────── */

interface ModelRuntimeState {
  searchBlockedUntil?: number;
  badModels?: Record<string, number>;
}

function readModelState(): ModelRuntimeState {
  try {
    return JSON.parse(localStorage.getItem(LS_MODEL_STATE) || '{}');
  } catch {
    return {};
  }
}

function writeModelState(patch: Partial<ModelRuntimeState>) {
  try {
    localStorage.setItem(LS_MODEL_STATE, JSON.stringify({ ...readModelState(), ...patch }));
  } catch {
    // ignore
  }
}

function readTransportCache(): Record<string, 'i' | 'i2' | 'g'> {
  try {
    return JSON.parse(localStorage.getItem(LS_TRANSPORT) || '{}');
  } catch {
    return {};
  }
}

function rememberTransport(model: string, mode: 'i' | 'i2' | 'g') {
  try {
    const cache = readTransportCache();
    if (cache[model] === mode) return;
    cache[model] = mode;
    localStorage.setItem(LS_TRANSPORT, JSON.stringify(cache));
  } catch {
    // ignore
  }
}

const isModelUnusable = (e: SinsooApiError) =>
  e.api === 'gemini' &&
  (e.status === 404 ||
    (e.status === 429 && /limit:\s*0|limit of 0/i.test(e.message || '')) ||
    (e.status === 400 && /not supported|does not support|unsupported|not found|invalid model/i.test(e.message || '')) ||
    (e.status === 403 && !/api key|API_KEY/i.test(e.message || '')));

function withTimeout(signal: AbortSignal | undefined, ms: number): AbortSignal | undefined {
  if (typeof AbortSignal === 'undefined' || !AbortSignal.timeout) return signal;
  const timeoutSig = AbortSignal.timeout(ms);
  if (!signal) return timeoutSig;
  if ('any' in AbortSignal && typeof (AbortSignal as any).any === 'function') {
    return (AbortSignal as any).any([signal, timeoutSig]);
  }
  const c = new AbortController();
  const relay = (s: AbortSignal) => () => c.abort((s as any).reason);
  signal.addEventListener('abort', relay(signal), { once: true });
  timeoutSig.addEventListener('abort', relay(timeoutSig), { once: true });
  return c.signal;
}

function abortError(e: unknown, signal?: AbortSignal): SinsooApiError | null {
  const err = e as { name?: string };
  if (!(err && err.name === 'AbortError') && !(signal && signal.aborted)) return null;
  const isTimeout = Boolean(signal && (signal as any).reason?.name === 'TimeoutError');
  const wrapped = new SinsooApiError(
    'gemini',
    0,
    isTimeout ? '응답 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.' : '사용자가 작업을 취소했습니다.'
  );
  wrapped.aborted = isTimeout ? 'timeout' : 'cancel';
  return wrapped;
}

async function gFetch(path: string, opt: RequestInit & { apiKey?: string } = {}): Promise<any> {
  const apiKey = opt.apiKey || getActiveGeminiKey();
  if (!apiKey) {
    throw new SinsooApiError('gemini', 401, 'Gemini API 키가 없습니다. 상단 [API 키 설정]에서 키를 입력해 주세요.');
  }
  let res: Response;
  try {
    res = await fetch(GEMINI_BASE + path, {
      ...opt,
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
        ...(opt.headers || {}),
      },
    });
  } catch (e) {
    throw abortError(e, opt.signal ?? undefined) || new SinsooApiError('gemini', 0, '네트워크 오류: ' + (e as Error).message);
  }
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const msg =
      data?.error?.message ||
      (Array.isArray(data?.errors) ? data.errors.map((x: any) => x.message).join('; ') : '') ||
      res.statusText;
    throw new SinsooApiError('gemini', res.status, msg, data);
  }
  return data;
}

export interface GeminiMediaPart {
  kind: 'video' | 'image' | 'audio';
  uri?: string;
  data?: string;
  mime?: string;
  start?: number;
  end?: number;
  fps?: number;
  res?: 'low' | 'medium' | 'high';
}

const fmtDur = (s: number) => `${Math.round(Math.max(0, +s || 0) * 1000) / 1000}s`;

function toInteractionItem(m: GeminiMediaPart) {
  const item: any = { type: m.kind };
  if (m.uri) item.uri = m.uri;
  else if (m.data) item.data = m.data;
  if (m.mime) item.mime_type = m.mime;
  if (m.res) item.resolution = m.res;
  if (m.start != null || m.end != null || m.fps) {
    item.processing = { type: 'static' };
    if (m.start != null) item.processing.start_offset = fmtDur(m.start);
    if (m.end != null) item.processing.end_offset = fmtDur(m.end);
    if (m.fps) item.processing.fps = m.fps;
  }
  return item;
}

function toContentPart(m: GeminiMediaPart) {
  const part: any = m.uri
    ? { fileData: { fileUri: m.uri, ...(m.mime ? { mimeType: m.mime } : {}) } }
    : { inlineData: { mimeType: m.mime || 'video/mp4', data: m.data || '' } };
  if (m.start != null || m.end != null || m.fps) {
    part.videoMetadata = {};
    if (m.start != null) part.videoMetadata.startOffset = fmtDur(m.start);
    if (m.end != null) part.videoMetadata.endOffset = fmtDur(m.end);
    if (m.fps) part.videoMetadata.fps = m.fps;
  }
  if (m.res) {
    part.mediaResolution = { level: `MEDIA_RESOLUTION_${m.res.toUpperCase()}` };
  }
  return part;
}

function pickInteractionOutput(j: any) {
  let text = '';
  const blocks: any[] = [];
  const cites: { title: string; uri: string }[] = [];
  const queries: string[] = [];

  (j.steps || []).forEach((s: any) => {
    if (s.type === 'google_search_call') {
      (s.arguments?.queries || []).forEach((q: string) => queries.push(q));
    }
    if (s.type !== 'model_output') return;
    (s.content || []).forEach((b: any) => {
      if (b.type === 'text') {
        text += b.text || '';
        (b.annotations || []).forEach((a: any) => {
          if (a.type === 'url_citation' && a.url) cites.push({ title: a.title || a.url, uri: a.url });
        });
      } else if (b.type === 'audio' || b.type === 'image' || b.type === 'video') {
        blocks.push(b);
      }
    });
  });
  const seen = new Set<string>();
  const sources = cites.filter((c) => (seen.has(c.uri) ? false : (seen.add(c.uri), true)));
  return { text, blocks, sources, queries, usage: j.usage || null };
}

export async function generateContentRaw(
  model: string,
  body: Record<string, unknown>,
  o: { signal?: AbortSignal; apiKey?: string } = {}
) {
  const j = await gFetch(`/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    body: JSON.stringify(body),
    signal: o.signal,
    apiKey: o.apiKey,
  });
  const c = j.candidates?.[0];
  if (!c) {
    throw new SinsooApiError(
      'gemini',
      200,
      '응답이 비어 있습니다' + (j.promptFeedback?.blockReason ? ` (차단 사유: ${j.promptFeedback.blockReason})` : ''),
      j
    );
  }
  const parts: any[] = c.content?.parts || [];
  const text = parts
    .filter((p) => p.text && !p.thought)
    .map((p) => p.text)
    .join('');
  const gm = c.groundingMetadata || {};
  const sources = (gm.groundingChunks || [])
    .map((x: any) => x.web)
    .filter(Boolean)
    .map((w: any) => ({ title: w.title || w.uri, uri: w.uri }));
  return {
    text,
    parts,
    sources,
    queries: (gm.webSearchQueries || []) as string[],
    finish: c.finishReason as string,
    raw: j,
  };
}

export async function listGeminiModels(apiKey?: string) {
  const j = await gFetch('/v1beta/models?pageSize=200', { apiKey });
  const all = (j.models || []).map((m: any) => ({
    name: String(m.name || '').replace(/^models\//, ''),
    methods: (m.supportedGenerationMethods || []) as string[],
    display: String(m.displayName || ''),
  }));
  const rawText = all
    .filter(
      (m: any) =>
        (m.methods.includes('generateContent') || m.methods.includes('interactions')) &&
        /^gemini-((flash|pro)(-lite)?-latest|[\d.]+-(flash|pro)(-lite)?(-preview.*)?|4-(hydrogen|carbon|argon))$/i.test(
          m.name
        ) &&
        !/(tts|image|live|embedding|transcribe|omni|audio|veo|imagen|computer-use|robotics|thinking|customtools)/.test(m.name)
    )
    .map((m: any) => m.name);

  // Rank live/newest models before deprecated 2.5 series
  const priorityScore = (name: string) => {
    if (name === 'gemini-flash-latest') return 0;
    if (name === 'gemini-flash-lite-latest') return 1;
    if (name === 'gemini-3.8-flash') return 2;
    if (name === 'gemini-4-hydrogen') return 3;
    if (/^gemini-3\./.test(name) && /flash/.test(name)) return 4;
    if (/^gemini-4-/.test(name)) return 5;
    if (/^gemini-3/.test(name)) return 6;
    if (name === 'gemini-pro-latest') return 7;
    if (/^gemini-2\.5/.test(name)) return 90;
    return 50;
  };
  const text = Array.from(new Set(rawText)).sort((a: any, b: any) => priorityScore(a) - priorityScore(b)) as string[];

  const tts = all
    .map((m: any) => m.name)
    .filter((n: string) => /tts/.test(n))
    .sort((a: string, b: string) => (/^gemini-3/.test(a) ? 0 : 1) - (/^gemini-3/.test(b) ? 0 : 1));
  const imgPriority = (name: string) => {
    if (name === 'gemini-nano-banana-2.1') return 0;
    if (/^gemini-4/.test(name)) return 1;
    if (name === 'gemini-3.1-flash-image') return 2;
    if (name === 'gemini-3.1-flash-lite-image') return 3;
    if (name === 'gemini-3.1-flash-image-preview') return 4;
    if (name === 'gemini-3-pro-image') return 5;
    if (name === 'gemini-3-pro-image-preview') return 6;
    if (name === 'nano-banana-pro-preview') return 7;
    if (/^gemini-3/.test(name)) return 8;
    if (/^gemini-2\.5/.test(name)) return 90;
    return 40;
  };
  const image = Array.from(
    new Set(
      all
        .map((m: any) => m.name)
        .filter((n: string) => /image|banana/i.test(n) && !/imagen|embedding/i.test(n))
    )
  ).sort((a: any, b: any) => imgPriority(a) - imgPriority(b)) as string[];
  return { all, text, tts, image };
}

export interface GenTextOptions {
  model?: string;
  fallbackModels?: string[];
  text: string;
  media?: GeminiMediaPart[];
  json?: boolean;
  tools?: ('google_search' | 'url_context')[];
  system?: string;
  thinking?: 'low' | 'medium' | 'high';
  maxTokens?: number;
  timeoutMs?: number;
  attemptTimeoutMs?: number;
  signal?: AbortSignal;
  onNote?: (note: string) => void;
  apiKey?: string;
  bypassSearchBlock?: boolean;
}

export async function genGeminiText(opt: GenTextOptions) {
  const settings = loadSinsooSettings();
  const rawList = [
    opt.model,
    settings.model,
    ...settings.okModels,
    ...(opt.fallbackModels || []),
    ...(settings.models || []),
    ...GEMINI_FALLBACK_CATALOG.text,
  ].filter(Boolean) as string[];
  // Ensure deprecated gemini-2.5-* never blocks all fallback slots unless already confirmed working
  const nonLegacy = rawList.filter((m) => !/^gemini-2\./.test(m));
  const legacyOnly = rawList.filter((m) => /^gemini-2\./.test(m));
  const candidates = Array.from(new Set([...nonLegacy, ...legacyOnly]));

  const totalTimeout = opt.timeoutMs || 180000;
  const signal = withTimeout(opt.signal, totalTimeout);
  const perAttemptMs = opt.attemptTimeoutMs || (opt.media?.length ? 90000 : 12000);
  const state = readModelState();
  const searchAllowed =
    opt.bypassSearchBlock || !state.searchBlockedUntil || state.searchBlockedUntil < Date.now();
  let useTools = searchAllowed ? opt.tools || [] : (opt.tools || []).filter((t) => t !== 'google_search');
  let lastError: unknown;

  for (const model of candidates.slice(0, 8)) {
    const legacy = /^gemini-2\./.test(model);
    const transportCache = readTransportCache();
    const attemptSig = withTimeout(signal, perAttemptMs);

    // 1) Try standard generateContent first (reliable & fast across 2.5 / 3.x / 4.x / -latest)
    let generateFailedStatus = 0;
    try {
      const attemptGenerate = async (toolsForTry: string[]) => {
        // NOTE: Gemini REST API rejects combining tools (e.g. google_search) with responseMimeType: 'application/json' on several models.
        const useJson = opt.json !== false && toolsForTry.length === 0;
        const promptText =
          opt.text +
          (opt.json !== false && !useJson ? '\n\n반드시 유효한 JSON만 출력하세요. 코드펜스(```)나 부연 설명은 절대 금지.' : '');
        const body: any = {
          contents: [
            {
              role: 'user',
              parts: [...(opt.media || []).map(toContentPart), { text: promptText }],
            },
          ],
          generationConfig: {
            maxOutputTokens: opt.maxTokens || 16384,
            ...(useJson ? { responseMimeType: 'application/json' } : {}),
          },
        };
        if (toolsForTry.length) {
          body.tools = toolsForTry.map((t) => ({ [t]: {} }));
        }
        if (opt.system) {
          body.systemInstruction = { parts: [{ text: opt.system }] };
        }
        return generateContentRaw(model, body, { signal: attemptSig, apiKey: opt.apiKey });
      };

      let r;
      try {
        r = await attemptGenerate(useTools);
      } catch (e0) {
        if (signal?.aborted) throw abortError(e0, signal) || e0;
        const e = (e0 as SinsooApiError);
        const cat = classifyGeminiError(e.status || 0, `${e.message} ${JSON.stringify(e.raw || '')}`);
        if (useTools.includes('google_search') && (cat === 'search' || cat === 'zero' || cat === 'rate')) {
          useTools = useTools.filter((t) => t !== 'google_search');
          writeModelState({ searchBlockedUntil: Date.now() + 12 * 3600e3 });
          opt.onNote?.('무료 키 제한으로 검색 연동 없이 진행합니다.');
          r = await attemptGenerate(useTools);
        } else if (useTools.includes('google_search') && e.status === 400) {
          useTools = useTools.filter((t) => t !== 'google_search');
          opt.onNote?.('이 모델에서 검색 도구 호환 실패 → 일반 모드로 재시도합니다.');
          r = await attemptGenerate(useTools);
        } else {
          throw e;
        }
      }

      if (!r.text) {
        opt.onNote?.(`${model} 빈 응답 → 다음 모델 시도`);
        lastError = new SinsooApiError('gemini', 200, '응답이 비어 있습니다', r.raw);
        continue;
      }
      if (!legacy) rememberTransport(model, 'g');
      const okModels = Array.from(new Set([model, ...settings.okModels])).slice(0, 6);
      saveSinsooSettings({ okModels });
      return {
        text: r.text,
        blocks: [] as any[],
        sources: r.sources,
        queries: r.queries,
        usage: r.raw?.usageMetadata || null,
        model,
        transport: 'generateContent' as const,
      };
    } catch (err1) {
      if (signal?.aborted) throw abortError(err1, signal) || err1;
      const e = abortError(err1, attemptSig) || (err1 as SinsooApiError);
      lastError = e;
      generateFailedStatus = e.status || 0;
      const cat = classifyGeminiError(e.status || 0, `${e.message} ${JSON.stringify(e.raw || '')}`);
      if (cat === 'key' || cat === 'disabled' || cat === 'region' || cat === 'billing') throw e;
      if (e.aborted === 'timeout') {
        opt.onNote?.(`${model} 응답 지연 → 다음 모델 시도`);
        continue;
      }
      if (isModelUnusable(e) || cat === 'zero' || cat === 'overload' || cat === 'rate' || cat === 'daily') {
        // Skip directly to next model for 404/429/503 unless interactions fallback is worth trying
        if (generateFailedStatus !== 404 && generateFailedStatus !== 400) {
          opt.onNote?.(`${model} 일시 제한(${e.status}) → 다음 모델 시도`);
          continue;
        }
      } else {
        throw e;
      }
    }

    // 2) Fallback to Interactions API if generateContent returned 400/404 for a newer model
    if (!legacy && transportCache[model] !== 'g' && (generateFailedStatus === 400 || generateFailedStatus === 404)) {
      const intSig = withTimeout(signal, perAttemptMs);
      try {
        const body: any = {
          model,
          store: false,
          input: [...(opt.media || []).map(toInteractionItem), { type: 'text', text: opt.text }],
          generation_config: { max_output_tokens: opt.maxTokens || 16384 },
        };
        if (useTools.length) body.tools = useTools.map((t) => ({ type: t }));
        if (opt.json !== false) body.response_format = { type: 'text', mime_type: 'application/json' };
        if (opt.system) body.system_instruction = opt.system;
        if (opt.thinking) body.generation_config.thinking_level = opt.thinking;

        const j = await gFetch('/v1beta/interactions', {
          method: 'POST',
          body: JSON.stringify(body),
          signal: intSig,
          apiKey: opt.apiKey,
        });
        const out = pickInteractionOutput(j);
        if (!out.text) throw new SinsooApiError('gemini', 200, '응답이 비어 있습니다', j);
        rememberTransport(model, 'i');
        const okModels = Array.from(new Set([model, ...settings.okModels])).slice(0, 6);
        saveSinsooSettings({ okModels });
        return { ...out, model, transport: 'interactions' as const };
      } catch (err0) {
        if (signal?.aborted) throw abortError(err0, signal) || err0;
        const e = abortError(err0, intSig) || (err0 as SinsooApiError);
        lastError = e;
        const cat = classifyGeminiError(e.status || 0, `${e.message} ${JSON.stringify(e.raw || '')}`);
        if (cat === 'key' || cat === 'disabled' || cat === 'region' || cat === 'billing') throw e;
        opt.onNote?.(`${model} 사용 불가(${e.status || 'timeout'}) → 다음 모델 시도`);
      }
    }
  }

  throw lastError || new SinsooApiError('gemini', 404, '사용 가능한 Gemini 모델을 찾을 수 없습니다.');
}

export function parseGeminiJson<T = any>(text: string): T {
  let t = String(text || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  const a = t.indexOf('{');
  const b = t.lastIndexOf('}');
  const a2 = t.indexOf('[');
  const b2 = t.lastIndexOf(']');
  if (a >= 0 && b > a && (a2 < 0 || a < a2)) t = t.slice(a, b + 1);
  else if (a2 >= 0 && b2 > a2) t = t.slice(a2, b2 + 1);

  try {
    return JSON.parse(t);
  } catch {
    const fixed = t.replace(/,\s*([}\]])/g, '$1').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]+/g, ' ');
    try {
      return JSON.parse(fixed);
    } catch {
      const cut = fixed.lastIndexOf('}');
      if (cut > 0) {
        let s = fixed.slice(0, cut + 1);
        const opens = (s.match(/\[/g) || []).length - (s.match(/\]/g) || []).length;
        const ob = (s.match(/\{/g) || []).length - (s.match(/\}/g) || []).length;
        s += ']'.repeat(Math.max(0, opens)) + '}'.repeat(Math.max(0, ob));
        try {
          return JSON.parse(s);
        } catch {
          // ignore
        }
      }
      throw new SinsooApiError('parse', 0, 'AI 응답을 JSON으로 해석하지 못했습니다. 다시 시도해 주세요.');
    }
  }
}

/* ───────── Gemini Files API (Resumable upload for large videos > 19MB) ───────── */

export function guessMediaMime(name: string): string {
  const ext = (name.split('.').pop() || '').toLowerCase();
  const map: Record<string, string> = {
    mp4: 'video/mp4',
    m4v: 'video/mp4',
    mov: 'video/quicktime',
    webm: 'video/webm',
    mkv: 'video/x-matroska',
    avi: 'video/x-msvideo',
    mpg: 'video/mpeg',
    mpeg: 'video/mpeg',
    '3gp': 'video/3gpp',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    m4a: 'audio/mp4',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
  };
  return map[ext] || 'application/octet-stream';
}

function xhrUpload(
  url: string,
  body: Blob,
  headers: Record<string, string>,
  onProgress?: (loaded: number) => void,
  signal?: AbortSignal
): Promise<any> {
  return new Promise((res, rej) => {
    const x = new XMLHttpRequest();
    x.open('POST', url, true);
    Object.entries(headers).forEach(([k, v]) => x.setRequestHeader(k, v));
    x.upload.onprogress = (e) => onProgress?.(e.loaded);
    x.onload = () => {
      let j: any = null;
      try {
        j = JSON.parse(x.responseText || 'null');
      } catch {
        j = null;
      }
      if (x.status >= 200 && x.status < 300) res(j);
      else rej(new SinsooApiError('gemini', x.status, j?.error?.message || `업로드 실패 HTTP ${x.status}`, j));
    };
    x.onerror = () => rej(new SinsooApiError('gemini', 0, '업로드 중 네트워크 오류가 발생했습니다.'));
    x.onabort = () => rej(new SinsooApiError('gemini', 0, '업로드가 취소되었습니다.'));
    signal?.addEventListener('abort', () => x.abort(), { once: true });
    x.send(body);
  });
}

export async function uploadGeminiFile(
  file: File,
  opt: { onProgress?: (ratio: number) => void; signal?: AbortSignal } = {}
) {
  const apiKey = getActiveGeminiKey();
  if (!apiKey) throw new SinsooApiError('gemini', 401, 'Gemini API 키가 없습니다.');
  const mime = file.type || guessMediaMime(file.name);
  const kh = { 'x-goog-api-key': apiKey };

  let uploadUrl = '';
  try {
    const r = await fetch(`${GEMINI_BASE}/upload/v1beta/files`, {
      method: 'POST',
      signal: opt.signal,
      headers: {
        ...kh,
        'X-Goog-Upload-Protocol': 'resumable',
        'X-Goog-Upload-Command': 'start',
        'X-Goog-Upload-Header-Content-Length': String(file.size),
        'X-Goog-Upload-Header-Content-Type': mime,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ file: { display_name: file.name.slice(0, 120) } }),
    });
    if (!r.ok) {
      let j: any = null;
      try {
        j = await r.json();
      } catch {
        j = null;
      }
      throw new SinsooApiError('gemini', r.status, j?.error?.message || r.statusText, j);
    }
    uploadUrl = r.headers.get('x-goog-upload-url') || '';
  } catch (e) {
    if (e instanceof SinsooApiError) throw e;
    throw new SinsooApiError('gemini', 0, '업로드 시작 실패: ' + (e as Error).message);
  }

  let fileObj: any;
  if (uploadUrl) {
    const CHUNK = 8 * 1024 * 1024;
    let off = 0;
    let last: any = null;
    while (off < file.size) {
      const end = Math.min(file.size, off + CHUNK);
      const isLast = end >= file.size;
      last = await xhrUpload(
        uploadUrl,
        file.slice(off, end),
        {
          'X-Goog-Upload-Offset': String(off),
          'X-Goog-Upload-Command': isLast ? 'upload, finalize' : 'upload',
        },
        (loaded) => opt.onProgress?.((off + loaded) / file.size),
        opt.signal
      );
      off = end;
    }
    fileObj = last?.file;
  } else {
    const boundary = 'hb' + Math.random().toString(36).slice(2);
    const head = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({
      file: { display_name: file.name.slice(0, 120) },
    })}\r\n--${boundary}\r\nContent-Type: ${mime}\r\n\r\n`;
    const body = new Blob([head, file, `\r\n--${boundary}--`]);
    const j = await xhrUpload(
      `${GEMINI_BASE}/upload/v1beta/files?uploadType=multipart`,
      body,
      { ...kh, 'Content-Type': `multipart/related; boundary=${boundary}` },
      (loaded) => opt.onProgress?.(loaded / body.size),
      opt.signal
    );
    fileObj = j?.file;
  }

  if (!fileObj?.uri) throw new SinsooApiError('gemini', 500, 'Files API 업로드 응답이 올바르지 않습니다.');
  return {
    uri: fileObj.uri as string,
    name: fileObj.name as string,
    mime: (fileObj.mimeType || mime) as string,
    state: fileObj.state as string,
    expires: (fileObj.expirationTime || '') as string,
  };
}

export async function waitGeminiFileActive(
  name: string,
  opt: { onNote?: (msg: string) => void; signal?: AbortSignal; timeoutMs?: number } = {}
) {
  const timeoutMs = opt.timeoutMs || 20 * 60 * 1000;
  const t0 = Date.now();
  let n = 0;
  while (true) {
    if (opt.signal?.aborted) throw new SinsooApiError('gemini', 0, '취소되었습니다.');
    const j = await gFetch(`/v1beta/${name}`);
    if (j.state === 'ACTIVE') return j;
    if (j.state === 'FAILED') throw new SinsooApiError('gemini', 500, '영상 처리 실패: ' + (j.error?.message || ''), j);
    if (Date.now() - t0 > timeoutMs) throw new SinsooApiError('gemini', 504, '영상 처리 대기 시간이 초과되었습니다.');
    n++;
    opt.onNote?.(`Google 서버에서 영상 분석 준비 중… (${Math.round((Date.now() - t0) / 1000)}초)`);
    await new Promise((r) => setTimeout(r, n < 5 ? 3000 : 5000));
  }
}

export async function getGeminiFile(name: string) {
  try {
    return await gFetch(`/v1beta/${name}`);
  } catch {
    return null;
  }
}

/* ───────── Gemini TTS & DP Batch Pause Splitter & WSOLA Stretch ───────── */

function readTtsDaily(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(LS_DAILY_TTS) || '{}');
  } catch {
    return {};
  }
}

function markTtsDailyLimit(model: string, text: string) {
  const m = String(text || '').match(/retry in\s+((?:\d+h)?(?:\d+m)?(?:[\d.]+s)?)/i);
  let waitMs = 12 * 3600e3;
  if (m && m[1]) {
    const h = +(m[1].match(/(\d+)h/) || [])[1] || 0;
    const mi = +(m[1].match(/(\d+)m/) || [])[1] || 0;
    const se = +(m[1].match(/([\d.]+)s/) || [])[1] || 0;
    const parsed = (h * 3600 + mi * 60 + se) * 1000;
    if (parsed >= 30e3) waitMs = parsed;
  }
  const d = readTtsDaily();
  d[model] = Date.now() + waitMs;
  try {
    localStorage.setItem(LS_DAILY_TTS, JSON.stringify(d));
  } catch {
    // ignore
  }
}

export function getTtsDailyStatus(prefModel?: string) {
  const candidates = Array.from(new Set([prefModel, ...GEMINI_FALLBACK_CATALOG.tts].filter(Boolean))) as string[];
  const d = readTtsDaily();
  const now = Date.now();
  const usable = candidates.filter((m) => !d[m] || d[m] <= now);
  if (usable.length > 0) return null;
  const until = Math.min(...candidates.map((m) => d[m] || Infinity));
  const leftMs = Math.max(60e3, until - now);
  const wait = leftMs < 3600e3 ? `${Math.max(1, Math.ceil(leftMs / 60e3))}분` : `${Math.ceil(leftMs / 3600e3)}시간`;
  return { leftMs, wait };
}

function b64ToBytes(b64: string): Uint8Array {
  const s = atob(b64);
  const u = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
  return u;
}

export function pcm16ToWav(bytes: Uint8Array, rate = 24000, ch = 1): Blob {
  const buf = new ArrayBuffer(44 + bytes.length);
  const v = new DataView(buf);
  const ws = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i));
  };
  ws(0, 'RIFF');
  v.setUint32(4, 36 + bytes.length, true);
  ws(8, 'WAVE');
  ws(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, ch, true);
  v.setUint32(24, rate, true);
  v.setUint32(28, rate * ch * 2, true);
  v.setUint16(32, ch * 2, true);
  v.setUint16(34, 16, true);
  ws(36, 'data');
  v.setUint32(40, bytes.length, true);
  new Uint8Array(buf, 44).set(bytes);
  return new Blob([buf], { type: 'audio/wav' });
}

function audioBlobFromBase64(b64: string, mime: string): Blob {
  const bytes = b64ToBytes(b64);
  const m = (mime || '').toLowerCase();
  if (m.includes('wav') || (bytes.length > 4 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46)) {
    return new Blob([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer], { type: 'audio/wav' });
  }
  if (m.includes('l16') || m.includes('pcm')) {
    const rate = +(m.match(/rate=(\d+)/) || [])[1] || 24000;
    return pcm16ToWav(bytes, rate, 1);
  }
  return new Blob([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer], { type: mime || 'audio/mpeg' });
}

export async function synthesizeGeminiTts(opt: {
  text: string;
  voice?: string;
  style?: string;
  model?: string;
  signal?: AbortSignal;
  onNote?: (note: string) => void;
}): Promise<{ blob: Blob; model: string }> {
  const settings = loadSinsooSettings();
  const voice = opt.voice || settings.voice || 'Kore';
  const style = opt.style ?? settings.ttsStyle ?? '';
  const candidates = Array.from(
    new Set([opt.model, settings.ttsModel, ...GEMINI_FALLBACK_CATALOG.tts].filter(Boolean))
  ) as string[];
  const dailyMap = readTtsDaily();
  const models = candidates.filter((m) => !dailyMap[m] || dailyMap[m] <= Date.now());
  if (!models.length) {
    const st = getTtsDailyStatus(opt.model);
    const e = new SinsooApiError('gemini', 429, `오늘 무료 Gemini TTS 한도를 모두 사용했습니다. ${st?.wait || '몇 시간'} 뒤에 초기화됩니다.`);
    e.daily = true;
    throw e;
  }

  let lastErr: unknown;
  for (const model of models) {
    try {
      const promptText = (style ? `${style}: ` : '') + opt.text;
      const body = {
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
        },
      };
      const r = await generateContentRaw(model, body, { signal: opt.signal });
      const inlinePart = r.parts.find((x: any) => x.inlineData);
      if (!inlinePart?.inlineData?.data) {
        throw new SinsooApiError('gemini', 200, '음성이 생성되지 않았습니다.', r.raw);
      }
      return {
        blob: audioBlobFromBase64(inlinePart.inlineData.data, inlinePart.inlineData.mimeType || 'audio/L16;rate=24000'),
        model,
      };
    } catch (e0) {
      const e = abortError(e0, opt.signal) || (e0 as SinsooApiError);
      if (e.aborted) throw e;
      lastErr = e;
      const cat = classifyGeminiError(e.status || 0, `${e.message} ${JSON.stringify(e.raw || '')}`);
      if (cat === 'daily') {
        markTtsDailyLimit(model, `${e.message} ${JSON.stringify(e.raw || '')}`);
        opt.onNote?.(`${model} 오늘 한도 도달 → 다른 TTS 모델 시도`);
        continue;
      }
      if (isModelUnusable(e) || e.status === 400) {
        opt.onNote?.(`${model} 사용 불가 → 다음 모델 시도`);
        continue;
      }
      throw e;
    }
  }
  const st = getTtsDailyStatus(opt.model);
  if (st) {
    const e = new SinsooApiError('gemini', 429, `오늘 무료 Gemini TTS 한도를 모두 사용했습니다. ${st.wait} 뒤에 초기화됩니다.`);
    e.daily = true;
    throw e;
  }
  throw lastErr || new SinsooApiError('gemini', 404, '사용 가능한 Gemini TTS 모델이 없습니다.');
}

export interface ElevenLabsTtsOptions {
  text: string;
  voiceId?: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  speakerBoost?: boolean;
  apiKey?: string;
  signal?: AbortSignal;
}

export interface ElevenLabsTtsResult {
  blob: Blob;
  model: string;
  voiceId: string;
  engine: 'elevenlabs';
  source: 'server' | 'direct';
}

export async function synthesizeElevenLabsTts(opt: ElevenLabsTtsOptions): Promise<ElevenLabsTtsResult> {
  const settings = loadSinsooSettings();
  const cleanText = (opt.text || '').trim();
  if (!cleanText) {
    throw new SinsooApiError('elevenlabs', 400, '변환할 대사가 비어 있습니다.');
  }

  const voiceId = (opt.voiceId || settings.elevenLabsVoiceId || 'JBFqnCBsd6RMkjVDRZzb').trim();
  const modelId = (opt.modelId || settings.elevenLabsModel || 'eleven_v4').trim();
  const stability = typeof opt.stability === 'number' ? opt.stability : 0.5;
  const similarityBoost = typeof opt.similarityBoost === 'number' ? opt.similarityBoost : 0.75;
  const style = typeof opt.style === 'number' ? opt.style : 0.15;
  const useSpeakerBoost = opt.speakerBoost !== false;
  const userKey = (opt.apiKey ?? settings.elevenLabsKey ?? '').trim();
  if (!userKey) {
    throw new SinsooApiError(
      'elevenlabs',
      401,
      'ElevenLabs API 키가 입력되지 않았습니다. [API 설정 → API 키 · 모델]에서 본인의 ElevenLabs 키(sk_...)를 입력해 주세요.'
    );
  }
  const signal = withTimeout(opt.signal, 45000);

  // 1) Try workspace/Vercel /api/tts proxy with client-supplied xi-api-key header
  let serverFallbackReason = '';
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (userKey) headers['xi-api-key'] = userKey;
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers,
      signal,
      body: JSON.stringify({
        text: cleanText,
        voice_id: voiceId,
        model_id: modelId,
        stability,
        similarity_boost: similarityBoost,
        style,
        use_speaker_boost: useSpeakerBoost,
      }),
    });
    const engineHeader = res.headers.get('X-TTS-Engine') || '';
    if (res.ok && engineHeader.startsWith('ElevenLabs-')) {
      const blob = await res.blob();
      if (blob.size > 0) {
        return {
          blob,
          model: engineHeader.replace(/^ElevenLabs-/, '') || modelId,
          voiceId,
          engine: 'elevenlabs',
          source: 'server',
        };
      }
    }
    if (res.ok && engineHeader === 'System-Fallback') {
      serverFallbackReason = '입력한 ElevenLabs API 키가 거부되거나 한도 초과로 폴백되었습니다.';
    } else if (!res.ok) {
      serverFallbackReason = `서버 /api/tts 응답 오류 (${res.status})`;
    }
  } catch (err) {
    const ab = abortError(err, signal);
    if (ab) throw ab;
    serverFallbackReason = '서버 /api/tts 엔드포인트에 연결할 수 없습니다.';
  }

  // 2) Direct browser call when personal xi-api-key override is supplied
  if (userKey) {
    try {
      const elRes = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': userKey,
            'Content-Type': 'application/json',
          },
          signal,
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
        }
      );
      if (!elRes.ok) {
        const rawErr = await elRes.json().catch(() => ({}));
        const msg = rawErr?.detail?.message || rawErr?.detail?.status || rawErr?.message || `ElevenLabs HTTP ${elRes.status}`;
        throw new SinsooApiError('elevenlabs', elRes.status, String(msg), rawErr);
      }
      const blob = await elRes.blob();
      if (!blob.size) {
        throw new SinsooApiError('elevenlabs', 502, 'ElevenLabs에서 빈 오디오가 반환되었습니다.');
      }
      return {
        blob,
        model: modelId,
        voiceId,
        engine: 'elevenlabs',
        source: 'direct',
      };
    } catch (err) {
      const ab = abortError(err, signal);
      if (ab) throw ab;
      if (err instanceof SinsooApiError) throw err;
      throw new SinsooApiError('elevenlabs', 0, err instanceof Error ? err.message : 'ElevenLabs 직접 호출 실패');
    }
  }

  throw new SinsooApiError(
    'elevenlabs',
    503,
    serverFallbackReason || 'ElevenLabs 유료 TTS가 응답하지 않았습니다. API 설정에서 서버 연동 상태를 확인하거나 개인 키를 입력해 주세요.'
  );
}

export async function testElevenLabsTts(opt?: { apiKey?: string; voiceId?: string; modelId?: string }) {
  const res = await synthesizeElevenLabsTts({
    text: '안녕하세요. 일레븐랩스 유료 음성이 정상 연동되었습니다.',
    voiceId: opt?.voiceId,
    modelId: opt?.modelId,
    apiKey: opt?.apiKey,
  });
  return {
    ok: true as const,
    model: res.model,
    source: res.source,
    bytes: res.blob.size,
    blob: res.blob,
  };
}

export async function checkElevenLabsServerStatus(): Promise<{
  serverConfigured: boolean;
  hasUserKey: boolean;
  connected: boolean;
}> {
  const hasUserKey = Boolean(getActiveElevenLabsKey());
  let serverConfigured = false;
  try {
    const res = await fetch('/api/tts?check=1', { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json().catch(() => null);
      serverConfigured = Boolean(data?.configured);
    }
  } catch {
    serverConfigured = false;
  }
  return {
    serverConfigured,
    hasUserKey,
    connected: serverConfigured || hasUserKey,
  };
}

async function wavToMonoFloat32(blob: Blob): Promise<{ data: Float32Array; sr: number }> {
  const buf = await blob.arrayBuffer();
  const v = new DataView(buf);
  if (buf.byteLength >= 44 && v.getUint32(0, false) === 0x52494646) {
    let p = 12;
    let ch = 1;
    let sr = 24000;
    let bits = 16;
    while (p + 8 <= buf.byteLength) {
      const id = v.getUint32(p, false);
      const len = v.getUint32(p + 4, true);
      if (id === 0x666d7420) {
        ch = v.getUint16(p + 10, true);
        sr = v.getUint32(p + 12, true);
        bits = v.getUint16(p + 22, true);
      }
      if (id === 0x64617461 && bits === 16) {
        const n = Math.floor(Math.min(len, buf.byteLength - p - 8) / 2 / ch);
        const out = new Float32Array(n);
        for (let i = 0; i < n; i++) {
          let s = 0;
          for (let c = 0; c < ch; c++) s += v.getInt16(p + 8 + (i * ch + c) * 2, true);
          out[i] = s / ch / 32768;
        }
        return { data: out, sr };
      }
      p += 8 + len + (len % 2);
    }
  }
  const ac = new OfflineAudioContext(1, 1, 24000);
  const ab = await ac.decodeAudioData(buf.slice(0));
  const out = new Float32Array(ab.length);
  for (let c = 0; c < ab.numberOfChannels; c++) {
    const d = ab.getChannelData(c);
    for (let i = 0; i < d.length; i++) out[i] += d[i] / ab.numberOfChannels;
  }
  return { data: out, sr: ab.sampleRate };
}

function monoFloat32ToWav(f32: Float32Array, sr: number): Blob {
  const bytes = new Uint8Array(f32.length * 2);
  const v = new DataView(bytes.buffer);
  for (let i = 0; i < f32.length; i++) {
    const x = Math.max(-1, Math.min(1, f32[i]));
    v.setInt16(i * 2, x < 0 ? x * 0x8000 : x * 0x7fff, true);
  }
  return pcm16ToWav(bytes, sr, 1);
}

function frameDb(a: Float32Array, sr: number, sec: number): Float32Array {
  const n = Math.max(1, Math.round(sr * sec));
  const out = new Float32Array(Math.ceil(a.length / n));
  for (let f = 0; f < out.length; f++) {
    let s = 0;
    const e = Math.min(a.length, (f + 1) * n);
    for (let i = f * n; i < e; i++) s += a[i] * a[i];
    out[f] = 10 * Math.log10(s / Math.max(1, e - f * n) + 1e-10);
  }
  return out;
}

function trimSilence(a: Float32Array, sr: number): Float32Array {
  const db = frameDb(a, sr, 0.01);
  const th = -45;
  let s = 0;
  let e = db.length - 1;
  while (s < e && db[s] < th) s++;
  while (e > s && db[e] < th) e--;
  const fr = sr * 0.01;
  return a.subarray(Math.max(0, Math.round(s * fr - 0.04 * sr)), Math.min(a.length, Math.round((e + 1) * fr + 0.04 * sr)));
}

function splitByPauses(audio: Float32Array, sr: number, weights: number[]): Float32Array[] | null {
  const n = weights.length;
  if (n === 1) return [audio];
  const db = frameDb(audio, sr, 0.01);
  const sorted = Array.from(db).sort((x, y) => x - y);
  const floor = sorted[Math.floor(sorted.length * 0.1)] ?? -80;
  const speech = sorted[Math.floor(sorted.length * 0.9)] ?? -20;
  const th = Math.max(floor + 6, Math.min(speech - 22, -38));

  const gaps: { at: number; len: number; from: number; to: number }[] = [];
  let s = -1;
  for (let i = 0; i <= db.length; i++) {
    const q = i < db.length && db[i] < th;
    if (q && s < 0) s = i;
    if (!q && s >= 0) {
      if (i - s >= 12 && s > 0 && i < db.length) gaps.push({ at: Math.round((s + i) / 2), len: i - s, from: s, to: i });
      s = -1;
    }
  }
  for (let i = gaps.length - 1; i > 0; i--) {
    if (gaps[i].from - gaps[i - 1].to <= 5) {
      gaps[i - 1] = {
        from: gaps[i - 1].from,
        to: gaps[i].to,
        len: gaps[i].to - gaps[i - 1].from,
        at: Math.round((gaps[i - 1].from + gaps[i].to) / 2),
      };
      gaps.splice(i, 1);
    }
  }
  if (gaps.length < n - 1) return null;
  const longs = gaps.filter((g) => g.len >= 70);
  if (longs.length >= n - 1) {
    gaps.length = 0;
    longs.forEach((g) => gaps.push(g));
  }

  const total = db.length;
  const sumW = weights.reduce((x, y) => x + y, 0) || 1;
  const expLen = weights.map((w) => (w / sumW) * total);
  const G = gaps.length;
  const INF = 1e18;
  const pc = (k: number, len: number) => {
    const r = len / Math.max(1, expLen[k]);
    const e = Math.log(Math.max(0.05, r));
    return e * e * 4;
  };
  const gb = (j: number) => -Math.log(gaps[j].len) * 0.15;
  const dp: Float64Array[] = [];
  const from: Int32Array[] = [];
  for (let k = 0; k < n - 1; k++) {
    dp.push(new Float64Array(G).fill(INF));
    from.push(new Int32Array(G).fill(-1));
    for (let j = k; j < G - (n - 2 - k); j++) {
      if (k === 0) {
        dp[0][j] = pc(0, gaps[j].at) + gb(j);
        continue;
      }
      let best = INF;
      let bi = -1;
      for (let p = k - 1; p < j; p++) {
        if (dp[k - 1][p] >= INF) continue;
        const v = dp[k - 1][p] + pc(k, gaps[j].at - gaps[p].at);
        if (v < best) {
          best = v;
          bi = p;
        }
      }
      if (bi >= 0) {
        dp[k][j] = best + gb(j);
        from[k][j] = bi;
      }
    }
  }
  let end = -1;
  let bv = INF;
  for (let j = 0; j < G; j++) {
    if (dp[n - 2][j] >= INF) continue;
    const v = dp[n - 2][j] + pc(n - 1, total - gaps[j].at);
    if (v < bv) {
      bv = v;
      end = j;
    }
  }
  if (end < 0) return null;
  const picks: number[] = [];
  for (let k = n - 2, j = end; k >= 0; k--) {
    picks.unshift(j);
    j = from[k][j];
  }
  const fr = sr * 0.01;
  const pieces: Float32Array[] = [];
  let start = 0;
  for (let k = 0; k <= n - 1; k++) {
    const g = k < n - 1 ? gaps[picks[k]] : null;
    const e = g ? Math.round(g.from * fr + 0.03 * sr) : audio.length;
    pieces.push(audio.subarray(start, Math.min(audio.length, e)));
    if (g) start = Math.max(0, Math.round(g.to * fr - 0.03 * sr));
  }
  const totalSec = audio.length / sr;
  for (let k = 0; k < n; k++) {
    const ex = (weights[k] / sumW) * totalSec;
    const got = pieces[k].length / sr;
    if (ex > 0.6 && (got < ex * 0.3 || got > ex * 3)) return null;
  }
  return pieces.map((p) => trimSilence(p, sr));
}

function splitEven(audio: Float32Array, sr: number, weights: number[]): Float32Array[] {
  const db = frameDb(audio, sr, 0.01);
  const sumW = weights.reduce((x, y) => x + y, 0) || 1;
  const fr = sr * 0.01;
  const cuts: number[] = [];
  let acc = 0;
  for (let k = 0; k < weights.length - 1; k++) {
    acc += weights[k];
    const c = Math.round((acc / sumW) * db.length);
    let best = c;
    let bv = Infinity;
    for (let j = Math.max(1, c - 150); j < Math.min(db.length - 1, c + 150); j++) {
      const v = db[j - 1] + db[j] + db[j + 1];
      if (v < bv) {
        bv = v;
        best = j;
      }
    }
    cuts.push(Math.round(best * fr));
  }
  const pts = [0, ...cuts, audio.length];
  const out: Float32Array[] = [];
  for (let k = 0; k < pts.length - 1; k++) {
    out.push(trimSilence(audio.subarray(pts[k], Math.max(pts[k] + 1, pts[k + 1])), sr));
  }
  return out;
}

// Single-request Batch TTS across multiple scene texts using <long pause> markers + DP pause alignment.
export async function synthesizeGeminiTtsBatch(opt: {
  texts: string[];
  voice?: string;
  style?: string;
  model?: string;
  signal?: AbortSignal;
  onPiece?: (index: number, piece: { blob: Blob; dur: number; model: string }) => void;
  onProgress?: (done: number, total: number) => void;
  onNote?: (note: string) => void;
}): Promise<({ blob: Blob; dur: number; model: string } | null)[]> {
  const { texts, onPiece, onProgress } = opt;
  const out: ({ blob: Blob; dur: number; model: string } | null)[] = texts.map(() => null);
  const groups: number[][] = [];
  let cur: number[] = [];
  let sec = 0;
  texts.forEach((t, i) => {
    if (!t?.trim()) return;
    const d = t.length / 5.5 + 1.4;
    if (cur.length && (sec + d > 480 || cur.length >= 60)) {
      groups.push(cur);
      cur = [];
      sec = 0;
    }
    cur.push(i);
    sec += d;
  });
  if (cur.length) groups.push(cur);

  let done = 0;
  for (const g of groups) {
    onProgress?.(done, groups.length);
    const r = await synthesizeGeminiTts({
      text: g.map((i) => texts[i]).join('\n<long pause>\n'),
      voice: opt.voice,
      style: opt.style,
      model: opt.model,
      signal: opt.signal,
      onNote: opt.onNote,
    });
    const { data, sr } = await wavToMonoFloat32(r.blob);
    const weights = g.map((i) => Math.max(4, texts[i].length));
    const pieces =
      g.length === 1
        ? [trimSilence(data, sr)]
        : splitByPauses(data, sr, weights) || splitEven(data, sr, weights);
    g.forEach((sceneIdx, k) => {
      const p = pieces[k] || new Float32Array(Math.round(sr * 0.5));
      const piece = { blob: monoFloat32ToWav(p, sr), dur: p.length / sr, model: r.model };
      out[sceneIdx] = piece;
      onPiece?.(sceneIdx, piece);
    });
    done++;
    onProgress?.(done, groups.length);
  }
  return out;
}

// WSOLA pitch-preserving time stretch (for speeding up/slowing down intro/scene AudioBuffers cleanly).
export function stretchAudioBuffer(buf: AudioBuffer, rate: number): AudioBuffer {
  const r = +rate || 1;
  if (Math.abs(r - 1) < 0.01) return buf;
  const sr = buf.sampleRate;
  const nch = buf.numberOfChannels;
  const inLen = buf.length;
  const win = Math.round(sr * 0.03);
  const hopOut = Math.round(win / 2);
  const hopIn = hopOut * r;
  const search = Math.round(sr * 0.007);
  const outLen = Math.max(win * 2, Math.floor(inLen / r));
  const out = new AudioBuffer({ length: outLen, sampleRate: sr, numberOfChannels: nch });
  const mono = new Float32Array(inLen);
  for (let c = 0; c < nch; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < inLen; i++) mono[i] += d[i] / nch;
  }
  const hann = new Float32Array(win);
  for (let i = 0; i < win; i++) hann[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / win);
  const chans = Array.from({ length: nch }, (_, c) => buf.getChannelData(c));
  const outs = Array.from({ length: nch }, (_, c) => out.getChannelData(c));

  let pos = 0;
  let outPos = 0;
  let lastStart = -1;
  while (outPos + win <= outLen) {
    let target = Math.round(pos);
    if (target + win > inLen) target = inLen - win;
    if (target < 0) target = 0;
    let best = target;
    if (lastStart >= 0) {
      const ref = lastStart + hopOut;
      let bestScore = -Infinity;
      const lo = Math.max(0, target - search);
      const hi = Math.min(inLen - win, target + search);
      for (let cand = lo; cand <= hi; cand += 2) {
        let sc = 0;
        for (let i = 0; i < win; i += 4) sc += mono[ref + i] * mono[cand + i];
        if (sc > bestScore) {
          bestScore = sc;
          best = cand;
        }
      }
    }
    for (let c = 0; c < nch; c++) {
      const src = chans[c];
      const dst = outs[c];
      for (let i = 0; i < win; i++) dst[outPos + i] += src[best + i] * hann[i];
    }
    lastStart = best;
    pos += hopIn;
    outPos += hopOut;
    if (pos + win > inLen) {
      pos = inLen - win;
      if (outPos + win > outLen) break;
    }
  }
  return out;
}

export async function decodeAudioBlob(blob: Blob): Promise<AudioBuffer> {
  const ac = new (window.AudioContext || (window as any).webkitAudioContext)();
  try {
    return await ac.decodeAudioData(await blob.arrayBuffer());
  } finally {
    try {
      await ac.close();
    } catch {
      // ignore
    }
  }
}

export function audioBufferToWavBlob(buf: AudioBuffer): Blob {
  const ch = Math.min(2, buf.numberOfChannels);
  const len = buf.length;
  const rate = buf.sampleRate;
  const out = new ArrayBuffer(44 + len * ch * 2);
  const v = new DataView(out);
  const ws = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i));
  };
  ws(0, 'RIFF');
  v.setUint32(4, 36 + len * ch * 2, true);
  ws(8, 'WAVE');
  ws(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, ch, true);
  v.setUint32(24, rate, true);
  v.setUint32(28, rate * ch * 2, true);
  v.setUint16(32, ch * 2, true);
  v.setUint16(34, 16, true);
  ws(36, 'data');
  v.setUint32(40, len * ch * 2, true);
  const chans = Array.from({ length: ch }, (_, c) => buf.getChannelData(c));
  let off = 44;
  for (let i = 0; i < len; i++) {
    for (let c = 0; c < ch; c++) {
      const s = Math.max(-1, Math.min(1, chans[c][i]));
      v.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      off += 2;
    }
  }
  return new Blob([out], { type: 'audio/wav' });
}

/* ───────── Gemini Image Generation ───────── */

export async function generateGeminiImage(opt: {
  prompt: string;
  aspect?: '9:16' | '16:9' | '1:1' | '4:3';
  model?: string;
}): Promise<{ dataUrl: string; model: string }> {
  const settings = loadSinsooSettings();
  const model = opt.model || settings.imgModel || GEMINI_FALLBACK_CATALOG.image[0];
  try {
    const body = {
      contents: [{ parts: [{ text: opt.prompt }] }],
      generationConfig: {
        responseModalities: ['IMAGE'],
        ...(opt.aspect ? { imageConfig: { aspectRatio: opt.aspect } } : {}),
      },
    };
    const r = await generateContentRaw(model, body);
    const p = r.parts.find((x: any) => x.inlineData);
    if (!p?.inlineData?.data) throw new SinsooApiError('gemini', 200, '이미지가 생성되지 않았습니다.', r.raw);
    return { dataUrl: `data:${p.inlineData.mimeType || 'image/jpeg'};base64,${p.inlineData.data}`, model };
  } catch (e) {
    if (e instanceof SinsooApiError && (e.status === 403 || e.status === 404 || (e.status === 429 && /limit:\s*0/i.test(e.message)))) {
      throw new SinsooApiError(
        'gemini',
        e.status,
        '이미지 생성 모델은 유료 결제가 연결된 Google AI 프로젝트 키에서만 동작합니다. 직접 이미지를 업로드하거나 무료 소재 검색을 이용해 주세요.',
        e.raw
      );
    }
    throw e;
  }
}

/* ───────── YouTube Data API v3 ───────── */

export function parseYoutubeId(url: string): string {
  try {
    const u = new URL(/^https?:\/\//i.test(url) ? url : 'https://' + url);
    const h = u.hostname.replace(/^(www|m|music)\./, '');
    if (h === 'youtu.be') return (u.pathname.split('/')[1] || '').slice(0, 11);
    if (/^(youtube\.com|youtube-nocookie\.com)$/.test(h)) {
      if (u.searchParams.get('v')) return (u.searchParams.get('v') || '').slice(0, 11);
      const m = u.pathname.match(/\/(shorts|embed|live|v)\/([\w-]{11})/);
      if (m) return m[2];
    }
  } catch {
    // ignore
  }
  const m = String(url || '').trim().match(/^[\w-]{11}$/);
  return m ? m[0] : '';
}

function parseIsoDuration(s?: string): number {
  const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(s || '');
  return m ? (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0) : 0;
}

export async function yFetch(path: string, params: Record<string, string | number | undefined>, apiKey?: string) {
  const key = apiKey || getActiveYoutubeKey();
  if (!key) throw new SinsooApiError('youtube', 401, 'YouTube API 키가 없습니다. [API 키 설정]에서 입력해 주세요.');
  const u = new URL(YT_BASE + path);
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') u.searchParams.set(k, String(v));
  });
  u.searchParams.set('key', key);
  let r: Response;
  try {
    r = await fetch(u.toString());
  } catch (e) {
    throw new SinsooApiError('youtube', 0, '네트워크 오류: ' + (e as Error).message);
  }
  let j: any = null;
  try {
    j = await r.json();
  } catch {
    j = null;
  }
  if (!r.ok) {
    const reason = j?.error?.errors?.[0]?.reason || '';
    throw new SinsooApiError('youtube', r.status, (reason ? `${reason}: ` : '') + (j?.error?.message || r.statusText), j);
  }
  return j;
}

export interface YoutubeVideoInfo {
  id: string;
  title: string;
  channel: string;
  description: string;
  duration: number;
  thumb: string;
  views: number;
  likes: number;
  license: string;
  orient?: 'portrait' | 'landscape' | '';
}

export async function fetchYoutubeVideoInfo(id: string): Promise<YoutubeVideoInfo> {
  const j = await yFetch('/videos', { part: 'snippet,contentDetails,statistics,status', id });
  const v = j.items?.[0];
  if (!v) throw new SinsooApiError('youtube', 404, '영상을 찾을 수 없습니다 (비공개 또는 삭제됨).');
  const th = v.snippet?.thumbnails || {};
  return {
    id: v.id,
    title: v.snippet?.title || '',
    channel: v.snippet?.channelTitle || '',
    description: v.snippet?.description || '',
    duration: parseIsoDuration(v.contentDetails?.duration),
    thumb: (th.maxres || th.standard || th.high || th.medium || th.default || {}).url || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
    views: +v.statistics?.viewCount || 0,
    likes: +v.statistics?.likeCount || 0,
    license: v.status?.license || '',
  };
}

export async function searchYoutubeVideos(opt: {
  q: string;
  maxResults?: number;
  license?: '' | 'creativeCommon';
  order?: 'relevance' | 'viewCount' | 'date';
  duration?: '' | 'short' | 'medium' | 'long';
}): Promise<YoutubeVideoInfo[]> {
  const j = await yFetch('/search', {
    part: 'snippet',
    type: 'video',
    q: opt.q,
    maxResults: opt.maxResults || 20,
    order: opt.order || 'relevance',
    regionCode: 'KR',
    relevanceLanguage: 'ko',
    safeSearch: 'none',
    videoLicense: opt.license || undefined,
    videoDuration: opt.duration || undefined,
  });

  const items: YoutubeVideoInfo[] = (j.items || [])
    .map((it: any) => ({
      id: it.id?.videoId,
      title: it.snippet?.title || '',
      channel: it.snippet?.channelTitle || '',
      description: '',
      duration: 0,
      thumb: it.snippet?.thumbnails?.medium?.url || it.snippet?.thumbnails?.default?.url || '',
      views: 0,
      likes: 0,
      license: '',
      orient: '' as const,
    }))
    .filter((x: YoutubeVideoInfo) => x.id);

  if (items.length > 0) {
    try {
      const v = await yFetch('/videos', {
        part: 'contentDetails,statistics,status,player',
        maxWidth: 320,
        id: items.map((x) => x.id).join(','),
      });
      const byId: Record<string, any> = {};
      (v.items || []).forEach((x: any) => {
        byId[x.id] = x;
      });
      items.forEach((x) => {
        const d = byId[x.id];
        if (!d) return;
        x.duration = parseIsoDuration(d.contentDetails?.duration);
        x.views = +d.statistics?.viewCount || 0;
        x.license = d.status?.license || '';
        const ew = +d.player?.embedWidth || 0;
        const eh = +d.player?.embedHeight || 0;
        x.orient = ew && eh ? (eh > ew ? 'portrait' : 'landscape') : '';
      });
    } catch {
      // ignore optional enrichment failures
    }
  }

  return items;
}

const LS_YT_BREAKOUT = 'autoshorts.yt.breakout.v1';
const YT_BREAKOUT_TTL_MS = 6 * 60 * 60 * 1000;

export function formatKoreanViewCount(n: number): string {
  if (!n || Number.isNaN(n)) return '0';
  if (n >= 100000000) return `${(n / 100000000).toFixed(1).replace(/\.0$/, '')}억`;
  if (n >= 10000) return `${Math.round(n / 10000).toLocaleString()}만`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}천`;
  return n.toLocaleString();
}

function readYtBreakoutCache(): Record<string, { expiresAt: number; metric: YoutubeBreakoutMetric }> {
  try {
    const raw = localStorage.getItem(LS_YT_BREAKOUT);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeYtBreakoutCache(cache: Record<string, { expiresAt: number; metric: YoutubeBreakoutMetric }>) {
  try {
    const now = Date.now();
    const pruned: Record<string, { expiresAt: number; metric: YoutubeBreakoutMetric }> = {};
    Object.entries(cache).forEach(([k, v]) => {
      if (v && v.expiresAt > now) pruned[k] = v;
    });
    localStorage.setItem(LS_YT_BREAKOUT, JSON.stringify(pruned));
  } catch {
    // ignore storage quota
  }
}

export async function measureYoutubeBreakoutForFigure(
  figureName: string,
  opt?: { timeframe?: TimeFilter; shortsOnly?: boolean; bypassCache?: boolean }
): Promise<YoutubeBreakoutMetric | null> {
  const cleanName = String(figureName || '').replace(/\([^)]*\)/g, '').trim();
  if (!cleanName) return null;
  const timeframe = opt?.timeframe || '24h';
  const shortsOnly = opt?.shortsOnly ?? false;
  const cacheKey = `${cleanName.toLowerCase()}:${timeframe}:${shortsOnly ? 's' : 'a'}`;

  if (!opt?.bypassCache) {
    const cache = readYtBreakoutCache();
    const hit = cache[cacheKey];
    if (hit && hit.expiresAt > Date.now() && hit.metric) {
      return hit.metric;
    }
  }

  const daysBack = timeframe === '24h' ? 3 : timeframe === '48h' ? 5 : 10;
  const publishedAfter = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();

  const searchRes = await yFetch('/search', {
    part: 'snippet',
    type: 'video',
    q: cleanName,
    maxResults: 8,
    order: 'viewCount',
    publishedAfter,
    regionCode: 'KR',
    relevanceLanguage: 'ko',
    safeSearch: 'none',
    videoDuration: shortsOnly ? 'short' : undefined,
  });

  const videoIds = Array.from(
    new Set((searchRes.items || []).map((it: any) => it?.id?.videoId).filter(Boolean))
  ) as string[];
  if (videoIds.length === 0) return null;

  const videosRes = await yFetch('/videos', {
    part: 'snippet,statistics,contentDetails',
    id: videoIds.join(','),
  });

  const videos = (videosRes.items || []).filter((v: any) => {
    if (!v?.id) return false;
    if (!shortsOnly) return true;
    const dur = parseIsoDuration(v.contentDetails?.duration);
    return dur > 0 && dur < 240;
  });
  if (videos.length === 0) return null;

  const channelIds = Array.from(
    new Set(videos.map((v: any) => v.snippet?.channelId).filter(Boolean))
  ) as string[];

  const subByChannel: Record<string, { subs: number; title: string }> = {};
  if (channelIds.length > 0) {
    try {
      const chRes = await yFetch('/channels', {
        part: 'snippet,statistics',
        id: channelIds.join(','),
      });
      (chRes.items || []).forEach((c: any) => {
        if (!c?.id) return;
        const hidden = Boolean(c.statistics?.hiddenSubscriberCount);
        const subs = hidden ? 0 : +c.statistics?.subscriberCount || 0;
        subByChannel[c.id] = {
          subs,
          title: c.snippet?.title || '',
        };
      });
    } catch {
      // ignore optional channel stats error
    }
  }

  let totalViews = 0;
  let maxViews = 0;
  let bestSubRatio = 0;
  let ratioSum = 0;
  let ratioCount = 0;
  let engageSum = 0;
  let bestVideo: any = videos[0];

  videos.forEach((v: any) => {
    const views = +v.statistics?.viewCount || 0;
    const likes = +v.statistics?.likeCount || 0;
    const comments = +v.statistics?.commentCount || 0;
    const chId = v.snippet?.channelId || '';
    const subs = subByChannel[chId]?.subs || 0;
    // Floor denominator at 1,000 subscribers so micro-test channels don't skew ratios unrealistically
    const ratio = subs > 0 ? views / Math.max(1000, subs) : 0;

    totalViews += views;
    if (views > maxViews) maxViews = views;
    engageSum += ((likes + comments) / Math.max(1, views)) * 100;

    if (ratio > 0) {
      ratioSum += ratio;
      ratioCount += 1;
      if (ratio > bestSubRatio) {
        bestSubRatio = ratio;
        bestVideo = v;
      }
    } else if (!bestSubRatio && views >= maxViews) {
      bestVideo = v;
    }
  });

  const bestChId = bestVideo?.snippet?.channelId || '';
  const bestCh = subByChannel[bestChId];

  const metric: YoutubeBreakoutMetric = {
    totalViews,
    maxViews,
    bestSubRatio: Number(bestSubRatio.toFixed(1)),
    avgSubRatio: Number((ratioCount > 0 ? ratioSum / ratioCount : 0).toFixed(1)),
    engagementRate: Number((engageSum / Math.max(1, videos.length)).toFixed(2)),
    videoCount: videos.length,
    bestVideoTitle: bestVideo?.snippet?.title || undefined,
    bestVideoId: bestVideo?.id || undefined,
    bestChannelTitle: bestCh?.title || bestVideo?.snippet?.channelTitle || undefined,
    bestChannelSubs: bestCh?.subs || undefined,
    shortsOnly,
    measuredAt: new Date().toISOString(),
  };

  const cache = readYtBreakoutCache();
  cache[cacheKey] = { expiresAt: Date.now() + YT_BREAKOUT_TTL_MS, metric };
  writeYtBreakoutCache(cache);
  return metric;
}

export async function measureYoutubeBreakoutForFigures(
  figures: TrendingFigure[],
  opt?: { timeframe?: TimeFilter; shortsOnly?: boolean; maxFigures?: number }
): Promise<Map<string, YoutubeBreakoutMetric>> {
  const key = getActiveYoutubeKey();
  if (!key) {
    throw new SinsooApiError(
      'youtube',
      401,
      'YouTube Data API v3 키가 필요합니다. 상단 [API 설정]에서 키를 입력하면 실측 랭킹이 계산됩니다.'
    );
  }

  const targetSlice = figures.slice(0, opt?.maxFigures || 8);
  const out = new Map<string, YoutubeBreakoutMetric>();
  const concurrency = 3;

  for (let i = 0; i < targetSlice.length; i += concurrency) {
    const batch = targetSlice.slice(i, i + concurrency);
    const settled = await Promise.allSettled(
      batch.map(async (fig) => {
        const metric = await measureYoutubeBreakoutForFigure(fig.name, {
          timeframe: opt?.timeframe || fig.timeframe,
          shortsOnly: opt?.shortsOnly,
        });
        return { id: fig.id, metric };
      })
    );
    for (const res of settled) {
      if (res.status === 'fulfilled' && res.value.metric) {
        out.set(res.value.id, res.value.metric);
      } else if (res.status === 'rejected') {
        const err = res.reason;
        if (err instanceof SinsooApiError && (err.status === 401 || err.status === 403)) {
          throw err;
        }
      }
    }
  }

  return out;
}

/* ───────── IndexedDB Asset Vault (ported from store.js) ───────── */

export type VaultAssetKind = 'source' | 'tts' | 'rec' | 'image' | 'media' | 'output' | 'recording';

export interface VaultAsset {
  id: string;
  projectId: string;
  kind: VaultAssetKind;
  name: string;
  type: string;
  size: number;
  blob?: Blob;
  createdAt: string;
  meta?: Record<string, unknown>;
}

const VAULT_DB_NAME = 'UntoldSinsooAssets';
const VAULT_STORE = 'assets';
let vaultDbPromise: Promise<IDBDatabase> | null = null;

function openVaultDb(): Promise<IDBDatabase> {
  if (vaultDbPromise) return vaultDbPromise;
  vaultDbPromise = new Promise((res, rej) => {
    const req = indexedDB.open(VAULT_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(VAULT_STORE)) {
        const st = db.createObjectStore(VAULT_STORE, { keyPath: 'id' });
        st.createIndex('projectId', 'projectId', { unique: false });
        st.createIndex('kind', 'kind', { unique: false });
      }
    };
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error || new Error('IndexedDB 자료함을 열 수 없습니다.'));
  });
  return vaultDbPromise;
}

async function vaultTx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest | void): Promise<T> {
  const db = await openVaultDb();
  return new Promise((res, rej) => {
    const t = db.transaction(VAULT_STORE, mode);
    const st = t.objectStore(VAULT_STORE);
    let req: IDBRequest | void;
    try {
      req = fn(st);
    } catch (e) {
      rej(e);
      return;
    }
    t.oncomplete = () => res((req ? (req as IDBRequest).result : undefined) as T);
    t.onerror = () => rej(t.error);
    t.onabort = () => rej(t.error || new Error('브라우저 저장 공간이 부족합니다.'));
  });
}

export const sinsooVault = {
  uid: () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
  async putAsset(input: Omit<VaultAsset, 'id' | 'createdAt' | 'size'> & { id?: string; createdAt?: string; size?: number }): Promise<VaultAsset> {
    const asset: VaultAsset = {
      id: input.id || sinsooVault.uid(),
      projectId: input.projectId || '',
      kind: input.kind,
      name: input.name,
      type: input.type || input.blob?.type || 'application/octet-stream',
      size: input.size ?? (input.blob ? input.blob.size : 0),
      blob: input.blob,
      createdAt: input.createdAt || new Date().toISOString(),
      meta: input.meta,
    };
    await vaultTx('readwrite', (st) => st.put(asset));
    return asset;
  },
  async getAsset(id: string): Promise<VaultAsset | null> {
    if (!id) return null;
    try {
      return (await vaultTx<VaultAsset | undefined>('readonly', (st) => st.get(id))) || null;
    } catch {
      return null;
    }
  },
  async deleteAsset(id: string): Promise<void> {
    if (!id) return;
    try {
      await vaultTx('readwrite', (st) => st.delete(id));
    } catch {
      // ignore
    }
  },
  async listMetadata(): Promise<Omit<VaultAsset, 'blob'>[]> {
    try {
      const all = await vaultTx<VaultAsset[]>('readonly', (st) => st.getAll());
      return (all || [])
        .map(({ blob: _b, ...rest }) => rest)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch {
      return [];
    }
  },
  async clearAll(): Promise<void> {
    try {
      await vaultTx('readwrite', (st) => st.clear());
    } catch {
      // ignore
    }
  },
};

/* ───────── Live Google-Search Trend Radar & Figure Analysis ───────── */

function getKstDateString(): string {
  try {
    return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export async function fetchLiveTrendingFigures(opt: {
  timeframe: TimeFilter;
  category: CategoryType;
  channel: SourceChannel;
  limit?: number;
}): Promise<{ figures: TrendingFigure[]; usedSearch: boolean; model: string }> {
  const settings = loadSinsooSettings();
  if (!settings.geminiKey?.trim()) {
    throw new SinsooApiError('gemini', 401, 'Gemini API 키가 연결되어 있지 않습니다.');
  }

  // Step 1: Collect today's live Korean Google Trends + Google News RSS signals from our backend endpoint
  let liveBrief = '';
  try {
    const sigCtrl = new AbortController();
    const sigTimer = setTimeout(() => sigCtrl.abort(), 5500);
    const sigRes = await fetch(
      `/api/trends/live-signals?timeframe=${encodeURIComponent(opt.timeframe)}&category=${encodeURIComponent(opt.category)}&channel=${encodeURIComponent(opt.channel)}`,
      { signal: sigCtrl.signal, cache: 'no-store' }
    ).finally(() => clearTimeout(sigTimer));
    if (sigRes.ok) {
      const sigJson = await sigRes.json();
      if (sigJson?.formattedBrief) {
        liveBrief = String(sigJson.formattedBrief);
      }
    }
  } catch {
    // Non-fatal: still continue with Google Search tool
  }

  const todayKst = getKstDateString();
  const tomorrowKst = new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
  const timeframeLabel =
    opt.timeframe === '24h' ? '최근 24시간' : opt.timeframe === '48h' ? '최근 48시간' : '최근 7일간';
  const channelLabel =
    opt.channel === 'youtube'
      ? '유튜브 쇼츠·인기 급상승 동영상'
      : opt.channel === 'naver'
      ? '네이버 실시간 뉴스·인물 검색'
      : opt.channel === 'instagram'
      ? '인스타그램 릴스·SNS 바이럴'
      : '한국 및 글로벌 주요 뉴스·유튜브·네이버·SNS 통합';
  const limit = opt.limit || (opt.category === 'all' ? 18 : 12);
  const categoryLabel =
    opt.category === 'upcoming'
      ? `🔭 [내일 예고·선점] 오늘(${todayKst}) 밤부터 내일(${tomorrowKst})·이번 주 사이 공개/개봉/컴백/경기/선발대결/발표/개막 등이 예정되어 있어 지금 올리면 내일 검색량 폭발을 선점할 수 있는 인물 ${limit}명 (모든 인물의 category를 'upcoming', isUpcoming을 true로 지정하고 scheduledDate에 "내일(M/D)" 등 예정 시점 표기)`
      : opt.category === 'all'
      ? `7개 분야 균형 배분 (viral·entertainment·actor·sports·economy·social·global 각 분야 최소 2~3명씩 골고루) + 그중 내일(${tomorrowKst}) 예정 이슈로 선점이 유리한 인물 2~3명에는 "isUpcoming": true, "scheduledDate": "내일·예정" 표기`
      : `요청 카테고리 '${opt.category}' 전용 (모든 인물의 category 필드를 '${opt.category}'로 지정)`;

  const liveSignalsSection = liveBrief
    ? `\n[★ 방금 수집된 실시간 구글 급상승 검색어 & 분야별 최신 뉴스 헤드라인]\n${liveBrief}\n`
    : '';

  const prompt = `당신은 대한민국 실시간 쇼츠 트렌드 리서처입니다.
오늘 날짜는 ${todayKst}(한국 시간), 내일은 ${tomorrowKst}입니다.
${liveSignalsSection}
[필수 작업]
1. 위 실시간 뉴스·급상승 검색어에 포착된 인물들을 최우선으로 반영하고, 추가로 Google Search 도구로 오늘(${todayKst}) 및 ${timeframeLabel} 동안 ${channelLabel}에서 새롭게 급부상한 화제의 인물(또는 내일 예고·선점 이슈)까지 총 ${limit}명을 선정하세요.
2. 카테고리 조건: ${categoryLabel}
3. **절대 금지**: 과거 수년 전 성공담, 오래된 드라마/음원, 예전 밈 등 낡은 내용을 오늘 화제인 것처럼 쓰지 마세요. 반드시 **지금(${todayKst} 기준 ${timeframeLabel}) 뉴스·커뮤니티·숏폼에서 실제로 뜨고 있는 최신 사건 또는 내일(${tomorrowKst}) 확정 예정 일정**으로 모든 인물을 업데이트하세요.
4. 확인되지 않은 날짜나 숫자를 절대 지어내지 말고, 검색·뉴스로 확인된 실제 날짜(예: 11월 12일, 11월 13일, 내일 11월 14일)·숫자만 쓰세요.

아래 형식의 JSON 배열로만 출력하세요(설명·마크다운 금지):
[
  {
    "name": "인물명",
    "title": "지금 왜 화제인지(또는 내일 무슨 일정인지) 한 줄 헤드라인",
    "category": "${opt.category === 'all' ? 'viral | entertainment | actor | sports | economy | social | global | upcoming 중 하나' : opt.category}",
    "viralityScore": 91~100 사이 정수,
    "timeframe": "${opt.timeframe}",
    "isUpcoming": false,
    "scheduledDate": "내일 예정 일정이 있을 때만 예: 내일(11/14), 없으면 빈 문자열",
    "buzzSummary": "왜 지금(${timeframeLabel}) 화제인지(또는 내일 예정 일정) 구체적 날짜·사건·숫자 포함 팩트를 1~2문장으로 작성",
    "controversyOrIssue": "핵심 논란, 반전 포인트, 관전 포인트 또는 대중 반응",
    "suggestedAngle": "쇼츠/캐러셀 2차 창작 기획 앵글 1문장",
    "hookLine": "첫 3초 스크롤을 멈추게 하는 오프닝 훅 1줄(30~45자 내외)",
    "tags": ["해시태그1", "해시태그2", "해시태그3", "해시태그4"],
    "primaryChannel": "youtube | naver | instagram | multi 중 하나",
    "channelMetrics": {
      "naverRank": "네이버 관련 이슈/검색 동향 (선택)",
      "youtubeViews": "유튜브 화제성 동향 (선택)",
      "instaReels": "SNS/릴스 반응 (선택)"
    }
  }
]`;

  const res = await genGeminiText({
    text: prompt,
    json: true,
    tools: ['google_search'],
    bypassSearchBlock: true,
    attemptTimeoutMs: 28000,
    timeoutMs: 70000,
  });

  const rawParsed = parseGeminiJson<any>(res.text);
  const rawList: any[] = Array.isArray(rawParsed)
    ? rawParsed
    : Array.isArray(rawParsed?.figures)
    ? rawParsed.figures
    : Array.isArray(rawParsed?.items)
    ? rawParsed.items
    : [];

  const validCategories = new Set<CategoryType>([
    'upcoming',
    'viral',
    'entertainment',
    'actor',
    'sports',
    'economy',
    'social',
    'global',
  ]);

  const now = Date.now();
  const figures: TrendingFigure[] = rawList
    .filter((item) => item && item.name && item.buzzSummary)
    .map((item, idx) => {
      const cat: CategoryType =
        opt.category !== 'all'
          ? opt.category
          : validCategories.has(item.category)
          ? item.category
          : 'viral';
      const isUpcoming = Boolean(item.isUpcoming) || cat === 'upcoming';
      return {
        id: `fig-live-${now}-${idx}`,
        name: String(item.name).trim(),
        title: String(item.title || `${item.name} 최신 이슈`).trim(),
        category: cat,
        viralityScore: Math.min(100, Math.max(88, Number(item.viralityScore) || 98 - Math.floor(idx / 2))),
        timeframe: opt.timeframe,
        buzzSummary: String(item.buzzSummary).trim(),
        controversyOrIssue: String(item.controversyOrIssue || '').trim(),
        suggestedAngle: String(item.suggestedAngle || '').trim(),
        hookLine: item.hookLine ? String(item.hookLine).trim() : undefined,
        tags: Array.isArray(item.tags) ? item.tags.map((t: any) => String(t).replace(/^#/, '')) : [String(item.name), '실시간이슈'],
        primaryChannel:
          item.primaryChannel === 'youtube' ||
          item.primaryChannel === 'naver' ||
          item.primaryChannel === 'instagram'
            ? item.primaryChannel
            : 'multi',
        channelMetrics: item.channelMetrics || undefined,
        isHot: idx < 5,
        isLive: true,
        ...(isUpcoming ? { isUpcoming: true } : {}),
        ...(item.scheduledDate ? { scheduledDate: String(item.scheduledDate).trim() } : {}),
      };
    });

  if (figures.length === 0) {
    throw new SinsooApiError('parse', 0, '실시간 화제 인물 목록을 파싱하지 못했습니다.');
  }

  return {
    figures,
    usedSearch: (res.sources?.length || 0) > 0 || (res.queries?.length || 0) > 0,
    model: res.model,
  };
}

export async function analyzeLiveFigure(opt: {
  figureName: string;
  category: CategoryType;
}): Promise<TrendingFigure> {
  const settings = loadSinsooSettings();
  if (!settings.geminiKey?.trim()) {
    throw new SinsooApiError('gemini', 401, 'Gemini API 키가 연결되어 있지 않습니다.');
  }

  const todayKst = getKstDateString();
  const prompt = `오늘 날짜는 ${todayKst}(한국 시간)입니다.
Google Search 도구로 인물 "${opt.figureName}"(카테고리: ${opt.category})에 대한 가장 최신 뉴스, 최근 이슈, 공식 프로필·인터뷰·보도 팩트를 검색하여 분석하세요.

[원칙]
1. 반드시 검색으로 확인된 실제 사실(Fact)만 사용하고, 허위사실·가공 에피소드 날조는 절대 금지합니다.
2. 최근(${todayKst} 기준) 발생한 스캔들, 논란, 기록, 활동 등 "왜 지금 화제인지"를 날짜·숫자 포함 팩트로 가장 먼저 반영하세요.
3. 아래 JSON 객체 형식으로만 응답하세요(코드펜스·설명 금지):
{
  "name": "인물명",
  "title": "왜 지금 화제인지 한 줄 헤드라인",
  "viralityScore": 90~100 정수,
  "buzzSummary": "왜 지금 주목받는지 확인된 날짜·숫자 기반 팩트 1~2문장",
  "controversyOrIssue": "핵심 논란, 시련, 반전 또는 대중 반응",
  "suggestedAngle": "2차 창작 쇼츠·캐러셀 기획 방향",
  "hookLine": "첫 3초 스크롤 정지 오프닝 훅 1줄(30~45자 내외)",
  "tags": ["태그1", "태그2", "태그3", "태그4"]
}`;

  const res = await genGeminiText({
    text: prompt,
    json: true,
    tools: ['google_search'],
    bypassSearchBlock: true,
    attemptTimeoutMs: 24000,
    timeoutMs: 60000,
  });

  const data = parseGeminiJson<any>(res.text);
  return {
    id: `fig-custom-${Date.now()}`,
    name: String(data.name || opt.figureName).trim(),
    title: String(data.title || `${opt.figureName} 최신 이슈 분석`).trim(),
    category: opt.category,
    viralityScore: Math.min(100, Math.max(88, Number(data.viralityScore) || 96)),
    timeframe: '24h',
    buzzSummary: String(data.buzzSummary || '').trim(),
    controversyOrIssue: String(data.controversyOrIssue || '').trim(),
    suggestedAngle: String(data.suggestedAngle || '').trim(),
    hookLine: data.hookLine ? String(data.hookLine).trim() : undefined,
    tags: Array.isArray(data.tags) ? data.tags.map((t: any) => String(t).replace(/^#/, '')) : [opt.figureName, '화제의인물'],
    isHot: true,
    isLive: true,
  };
}
