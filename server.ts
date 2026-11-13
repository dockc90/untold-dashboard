import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import { collectLiveTrendSignals, buildSignalFallbackFigures } from './nextjs-project/lib/liveTrendsSignals.ts';
import { applyToneToShortsPayload, getSpeechTonePromptDirective } from './nextjs-project/lib/speechTone.ts';
import {
  buildDailyMorningIssue,
  getNewsletterStatus,
  isValidEmail,
  normalizeEmail,
  renderNewsletterEmailText,
  runDailyNewsletterCron,
  sendNewsletterEmail,
  subscribeNewsletter,
  unsubscribeNewsletter,
} from './nextjs-project/lib/newsletterService.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize Supabase Admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder')) 
  ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } }) 
  : null;

function toValidUUID(id: string): string {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) return id;

  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `a1b2c3d4-e5f6-4a7b-8c9d-${hex.padEnd(12, '0').slice(0, 12)}`;
}

// Initialize GoogleGenAI server-side with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function callGeminiWithRetry(fn: () => Promise<any>, retries = 2, delayMs = 1500): Promise<any> {
  try {
    return await fn();
  } catch (err: any) {
    if (retries > 0) {
      console.warn(`Gemini call failed, retrying in ${delayMs}ms... (retries left: ${retries})`, err.message);
      await new Promise((res) => setTimeout(res, delayMs));
      return callGeminiWithRetry(fn, retries - 1, delayMs * 1.5);
    }
    throw err;
  }
}

// Endpoint: Deep-dive analyze a custom figure entered by the user
app.post('/api/gemini/analyze-figure', async (req, res) => {
  try {
    const { figureName, category = 'entertainment' } = req.body;
    if (!figureName) {
      return res.status(400).json({ error: '인물 이름을 입력해주세요.' });
    }

    const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
    const prompt = `당신은 대한민국 최고 유튜브 쇼츠 기획자이자 실시간 트렌드 분석가입니다.
오늘 날짜: ${todayStr}
인물: "${figureName}" (카테고리: ${category})

[★ 최우선 절대 원칙: Google Search 실시간 팩트 기반 & 허위사실·날조 원천 차단]
1. 반드시 Google Search 도구로 대상 인물의 가장 최신 뉴스·이슈·공식 보도 및 공인된 '실제 사실(Fact)'을 검색해 분석하세요.
2. 가짜 일화, 확인되지 않은 루머, 가공의 사건을 지어내는 행위는 법적 리스크가 발생하므로 절대 엄격히 금지됩니다.
3. buzzSummary에는 "왜 지금 주목받는지 + 확인된 날짜·연도·숫자(기록·경력·성과)" 팩트를 구체적으로 담고, hookLine에는 첫 3초 스크롤을 멈추는 오프닝 멘트 1줄(30~45자 내외)을 작성하세요.
4. 반드시 아래 JSON 객체 형식으로만 응답하세요(코드펜스·부연 설명 금지):
{
  "name": "인물명",
  "title": "지금 왜 화제인지 한 줄 헤드라인",
  "viralityScore": 95,
  "buzzSummary": "왜 지금 주목받는지 날짜·숫자 기반 팩트 1~2문장",
  "controversyOrIssue": "핵심 논란, 시련 또는 대중 반응",
  "suggestedAngle": "2차 창작 기획 방향",
  "hookLine": "첫 3초 오프닝 훅 1줄",
  "tags": ["태그1", "태그2", "태그3", "태그4"]
}`;

    const candidateModels = ['gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-2.5-flash'];
    for (const mod of candidateModels) {
      try {
        const response = await callGeminiWithRetry(() =>
          ai.models.generateContent({
            model: mod,
            contents: prompt,
            config: {
              temperature: 0.3,
              tools: [{ googleSearch: {} }],
            },
          })
        );
        const cleaned = String(response.text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
        const s = cleaned.indexOf('{');
        const e = cleaned.lastIndexOf('}');
        const parsed = JSON.parse(s >= 0 && e > s ? cleaned.slice(s, e + 1) : cleaned);
        if (parsed?.name) return res.json({ ...parsed, isLive: true });
      } catch (apiErr: any) {
        console.warn(`Analyze-figure (${mod}) failed:`, apiErr.message);
      }
    }

    return res.json({
      name: figureName,
      title: `${figureName}의 아무도 몰랐던 충격적 비하인드와 인생 역전`,
      viralityScore: 94,
      buzzSummary: `${figureName}의 공식 활동 이력과 반전 에피소드가 숏폼·검색에서 다시 급상승하며 48시간 화제 인물로 주목받고 있습니다.`,
      controversyOrIssue: '모두가 불가능하다고 여겼던 위기 속에서도 묵묵히 자신의 길을 개척해낸 치열했던 무명 시절',
      suggestedAngle: '화려한 성공 이면에 숨겨진 피와 땀, 인간 승리의 헌정 스토리텔링',
      hookLine: `대중이 미처 몰랐던 ${figureName}의 결정적 한 장면, 진짜 시작은 여기였습니다`,
      tags: [figureName, '쇼츠', '인생역전', '감동실화', '비하인드']
    });
  } catch (err: any) {
    console.error('Error in analyze-figure:', err);
    return res.status(500).json({ error: err.message || '인물 분석 실패' });
  }
});

// Endpoint: Fetch live Google Trends KR + Google News KR headlines
app.get('/api/trends/live-signals', async (req, res) => {
  try {
    const timeframe = String(req.query.timeframe || '24h');
    const category = String(req.query.category || 'all');
    const channel = String(req.query.channel || 'all');
    const bundle = await collectLiveTrendSignals({ timeframe, category, channel });
    return res.json(bundle);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || '실시간 신호 수집 실패', trendsKr: [], headlines: [], formattedBrief: '' });
  }
});

// Endpoints: Daily 07:00 KST Newsletter Preview, Subscribe, Send-Test, Cron
app.get('/api/newsletter/preview', async (req, res) => {
  const unsub = req.query.unsubscribe ? String(req.query.unsubscribe) : '';
  if (unsub) {
    try {
      const r = await unsubscribeNewsletter(unsub);
      return res.send(`<html><body style="font-family:sans-serif;text-align:center;margin-top:60px;"><h2>구독 해지 완료</h2><p>${r.email}</p></body></html>`);
    } catch (err: any) {
      return res.status(400).json({ error: err?.message || '구독 해지 실패' });
    }
  }
  try {
    const forceRefresh = req.query.force === '1';
    const [status, issue] = await Promise.all([getNewsletterStatus(), buildDailyMorningIssue({ forceRefresh })]);
    return res.json({ status, issue, textBrief: renderNewsletterEmailText(issue) });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || '뉴스레터 미리보기 실패' });
  }
});

app.post('/api/newsletter/subscribe', async (req, res) => {
  try {
    const result = await subscribeNewsletter(String(req.body?.email || ''), req.body?.name);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ ok: false, error: err?.message || '구독 등록 실패' });
  }
});

app.delete('/api/newsletter/subscribe', async (req, res) => {
  try {
    const email = String(req.body?.email || req.query.email || '');
    const result = await unsubscribeNewsletter(email);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ ok: false, error: err?.message || '구독 해지 실패' });
  }
});

app.post('/api/newsletter/send-test', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email || '');
    if (!isValidEmail(email)) {
      return res.status(400).json({ ok: false, error: '올바른 이메일 주소를 입력해 주세요.' });
    }
    await subscribeNewsletter(email, req.body?.name).catch(() => null);
    const issue = await buildDailyMorningIssue({
      forceRefresh: Boolean(req.body?.forceRefresh),
      geminiKey: req.body?.geminiKey,
    });
    const sendRes = await sendNewsletterEmail(email, issue);
    const status = await getNewsletterStatus();
    return res.json({
      ok: sendRes.ok,
      configured: sendRes.configured,
      provider: sendRes.provider,
      status,
      message: sendRes.ok ? `${email}로 샘플 메일을 발송했습니다.` : sendRes.error,
      issue,
      textBrief: renderNewsletterEmailText(issue),
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err?.message || '테스트 발송 실패' });
  }
});

app.all('/api/newsletter/cron', async (req, res) => {
  try {
    const result = await runDailyNewsletterCron({ forceResendSameDay: req.query.force === '1' });
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err?.message || '크론 실패' });
  }
});

// Endpoint: Refresh trending figures list with AI from Naver, YouTube, Instagram
app.post('/api/gemini/trending', async (req, res) => {
  try {
    const { category = 'all', timeframe = '24h', channel = 'all' } = req.body;
    const liveSignals = await collectLiveTrendSignals({ timeframe, category, channel }).catch(() => null);

    const channelPromptDesc = 
      channel === 'youtube' ? '유튜브 쇼츠 100만 뷰 이상 인기 급상승 및 라이징 바이럴 인물 중심' :
      channel === 'naver' ? '네이버 데이터랩 및 실시간 검색 급상승 인물 중심' :
      channel === 'instagram' ? '인스타그램 릴스 음원 챌린지 및 바이럴 피드 인물 중심' :
      '네이버 검색량, 유튜브 쇼츠 100만 뷰 이상 바이럴, 인스타그램 릴스 바이럴 3대 포털 통합';

    const todayStr = liveSignals?.todayKst || new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
    const tomorrowStr = liveSignals?.tomorrowKst || new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
    const targetCount = category === 'all' ? '18~20명(전 카테고리 최소 2~3명씩 골고루)' : '12~14명';
    const categoryGuide =
      category === 'upcoming'
        ? `🔭 [내일 예고·선점] 내일(${tomorrowStr})~이번 주 공개/개봉/컴백/경기/발표 예정이라 지금 올리면 선점 가능한 인물 12~14명 (모두 category:"upcoming", isUpcoming:true, scheduledDate:"내일(M/D)" 등 명시, 모든 인물에 trendingReason과 relatedFigures 필수 포함)`
        : category === 'economy'
        ? `💼 [국내외 기업인·부자 전문 경제/기업 소재 발굴] 비난·루머 없이 홍보팀 마인드로 다룰 긍정 미담·소박한 인간미·통 큰 결단·주가 급등/어록/방한 이슈 12~14명(category:"economy"). 모든 항목에 trendingReason(최근 화제 이유)과 relatedFigures(동반 떡상 파생 인물 2~3명)를 반드시 세트로 묶어 표기`
        : category === 'all'
        ? `viral, entertainment, actor, sports, economy, social, global 전 분야 균형 + 모든 분야의 모든 인물에 trendingReason(최근 화제 이유)과 relatedFigures(동반 떡상 파생 인물 2~3명)를 빠짐없이 필수 포함`
        : `${category} (모든 인물에 trendingReason과 relatedFigures 2~3명 필수 포함)`;
    const signalsBlock = liveSignals?.formattedBrief
      ? `\n[★ 방금 수집된 실시간 구글 급상승 검색어 & 분야별 뉴스 헤드라인]\n${liveSignals.formattedBrief}\n`
      : '';
    const prompt = `대한민국에서 오늘(${todayStr}, 내일 ${tomorrowStr}) 기준 최근 ${timeframe} 동안 ${channelPromptDesc}으로 실제로 가장 화제가 되고 있거나 내일 선점이 유리한 인물 ${targetCount}을 선정하세요.
${signalsBlock}
카테고리: ${categoryGuide}
1. 위 실시간 뉴스·급상승 검색어에 등장한 인물을 최우선 반영하고, 추가로 Google Search 도구로 오늘(${todayStr}) 새로 뜬 화제 인물 또는 내일(${tomorrowStr}) 예정 이슈까지 포함하세요.
2. 분야를 막론하고 **모든 인물(전원)**에게 단순 인물명만 주지 말고 "최근 화제가 된 이유(주가 급등, 어록, 방한, 화제작, 신기록 등)"(trendingReason)와 "같이 올리면 동반 떡상하는 파생 인물 2~3명"(relatedFigures, 예: 젠슨 황 -> 이재용·깐부치킨 대표, 손흥민 -> 이강인·이정후 등)을 세트로 묶어 빠짐없이 추천하세요.
3. buzzSummary에는 "왜 지금 화제인지 + 확인된 날짜·연도·숫자" 팩트 1~2문장을 작성하세요.
4. hookLine에는 출생연도 나열 대신 충격 숫자·반전 질문으로 시작하는 첫 3초 오프닝 훅 1줄(20~38자)을 작성하세요.
5. 반드시 아래와 같은 유효한 JSON 배열만 출력하세요(코드펜스·설명 금지):
[{"name":"","title":"","category":"${category === 'upcoming' ? 'upcoming' : 'viral'}","viralityScore":95,"timeframe":"${timeframe}","isUpcoming":false,"scheduledDate":"","trendingReason":"","relatedFigures":[""],"buzzSummary":"","controversyOrIssue":"","suggestedAngle":"","hookLine":"","tags":[""],"primaryChannel":"multi","channelMetrics":{"naverRank":"","youtubeViews":"","instaReels":""}}]`;

    const candidateModels = ['gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-2.5-flash'];
    for (const mod of candidateModels) {
      try {
        const response = await callGeminiWithRetry(() =>
          ai.models.generateContent({
            model: mod,
            contents: prompt,
            config: {
              temperature: 0.3,
              tools: [{ googleSearch: {} }],
            },
          })
        );
        const cleaned = String(response.text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
        const s = cleaned.indexOf('[');
        const e = cleaned.lastIndexOf(']');
        const list = JSON.parse(s >= 0 && e > s ? cleaned.slice(s, e + 1) : cleaned);
        if (Array.isArray(list) && list.length > 0) {
          return res.json(list.map((item: any) => ({ ...item, isLive: true })));
        }
      } catch (apiErr: any) {
        console.warn(`Trending (${mod}) failed:`, apiErr.message);
      }
    }

    const rssFallback = buildSignalFallbackFigures(liveSignals, timeframe, category);
    if (rssFallback.length > 0) {
      return res.json(rssFallback);
    }

    {
      return res.json([
        {
          id: `fig-fall-${Date.now()}-1`,
          name: '변우석',
          title: '오디션 100번 탈락을 딛고 10년 만에 맞이한 기적',
          category: 'actor',
          viralityScore: 97,
          timeframe,
          trendingReason: '선재 신드롬 이후 차기작·글로벌 브랜드 앰배서더 화제성 최상위권 유지',
          relatedFigures: ['김혜윤', '이선빈', '박보검'],
          buzzSummary: '선재 신드롬 이전 10년의 긴 무명 생활과 폭언을 견뎌내며 버틴 눈물의 감동 실화',
          controversyOrIssue: '배우 하지 말라는 주변의 만류 속에서도 단역을 전전하며 끝까지 포기하지 않은 집념',
          suggestedAngle: '포기하고 싶을 때 거울을 보며 버틴 10년의 인내와 폭풍 눈물',
          tags: ['변우석', '선재업고튀어', '무명10년', '인생역전', '감동실화'],
          primaryChannel: 'naver',
          channelMetrics: {
            naverRank: '네이버 인물 검색 1위 (+380%)',
            youtubeViews: '유튜브 쇼츠 2,100만 뷰',
            instaReels: '인스타 릴스 14만 개'
          }
        },
        {
          id: `fig-fall-${Date.now()}-2`,
          name: '손흥민',
          title: '아시아 최초 득점왕 뒤에 숨겨진 아버지의 10년 맹훈련',
          category: 'sports',
          viralityScore: 98,
          timeframe,
          trendingReason: '유럽 빅리그 최정상 활약 및 캡틴 리더십·동료 케어 미담 재조명',
          relatedFigures: ['이강인', '양민혁', '박지성'],
          buzzSummary: '세계 최고 리그에서 증명한 월드클래스 실력과 겸손함, 손웅정 감독의 혹독한 기본기 훈련 일화',
          controversyOrIssue: '매일 볼 리프팅 4시간, 눈에 실핏줄이 터질 때까지 기본기만 반복했던 유년기',
          suggestedAngle: '천재가 아니라 피와 땀으로 완성된 영웅의 눈물겨운 여정',
          tags: ['손흥민', '토트넘', '손웅정', '기본기', '국위선양'],
          primaryChannel: 'youtube',
          channelMetrics: {
            naverRank: '네이버 해외축구 1위',
            youtubeViews: '유튜브 하이라이트 3,200만 뷰',
            instaReels: '릴스 챌린지 21만 개'
          }
        },
        {
          id: `fig-fall-${Date.now()}-3`,
          name: '로제',
          title: '술자리 게임 하나로 전 세계 차트를 올킬한 천재성',
          category: 'global',
          viralityScore: 99,
          timeframe,
          trendingReason: '글로벌 메가 히트 APT. 롱런 및 한국 문화 세계화 일등 공신 화제',
          relatedFigures: ['브루노 마스', '제니', '지드래곤'],
          buzzSummary: '브루노 마스와 합작한 아파트(APT.)가 전 세계 음원 차트 1위를 휩쓸며 K-컬처 신기록 달성',
          controversyOrIssue: '전통적인 K팝 공식을 깨고 가장 한국적인 놀이를 가장 힙한 팝 음악으로 재창조한 감각',
          suggestedAngle: '한국의 술자리 게임으로 빌보드를 정복한 20대 소녀의 번뜩이는 크리에이티브',
          tags: ['로제', '아파트', '브루노마스', '빌보드', 'K컬처'],
          primaryChannel: 'instagram',
          channelMetrics: {
            naverRank: '네이버 뮤직 1위',
            youtubeViews: '유튜브 MV/쇼츠 1.8억 뷰',
            instaReels: '릴스 음원 사용 120만 건'
          }
        },
        {
          id: `fig-fall-${Date.now()}-4`,
          name: '페이커 (이상혁)',
          title: '11년째 세계 최정상에서 군림하는 신의 손목',
          category: 'sports',
          viralityScore: 99,
          timeframe,
          trendingReason: '롤드컵 통산 우승 신화 이후 프로의 자세·기부·팬 서비스 미담 릴레이',
          relatedFigures: ['구마유시', '정지훈(쵸비)', '손흥민'],
          buzzSummary: '롤드컵 5회 우승의 전무후무한 역사, 손목 부상과 슬럼프를 극복한 리더십',
          controversyOrIssue: '손목이 마비되는 고통 속에서도 동료들을 믿고 다시 정상에 선 헌신',
          suggestedAngle: '연봉 수백억 유혹을 뿌리치고 한국에 남아 역사를 쓴 e스포츠의 살아있는 신화',
          tags: ['페이커', 'T1', '롤드컵', '대상혁', '월즈5회우승'],
          primaryChannel: 'youtube',
          channelMetrics: {
            naverRank: '네이버 e스포츠 1위',
            youtubeViews: '유튜브 월즈 쇼츠 1,500만 뷰',
            instaReels: '릴스 응원 8만 개'
          }
        },
        {
          id: `fig-fall-${Date.now()}-5`,
          name: '안성재 셰프',
          title: '이라크 파병 정비병에서 미슐랭 3스타까지',
          category: 'entertainment',
          viralityScore: 98,
          timeframe,
          trendingReason: '흑백요리사 레전드 심사평 역주행 및 국내 파인다이닝 철학 재조명',
          relatedFigures: ['백종원', '에드워드 리', '최현석'],
          buzzSummary: '흑백요리사 최고 심사위원으로 전국민적 유행어 "고기가 이븐하게 익지 않았어요" 탄생',
          controversyOrIssue: '가난 때문에 미군에 입대해 이라크 전장을 누비다 20대 중반에 칼을 잡은 늦깎이 셰프',
          suggestedAngle: '이라크 사막에서 배운 군대식 규율과 완벽주의가 빚어낸 한국 유일 3스타 기적',
          tags: ['안성재', '흑백요리사', '모수', '미슐랭3스타', '이븐하게'],
          primaryChannel: 'multi',
          channelMetrics: {
            naverRank: '네이버 인물 검색 2위',
            youtubeViews: '유튜브 쇼츠 2,800만 뷰',
            instaReels: '인스타 패러디 릴스 15만 개'
          }
        },
        {
          id: `fig-fall-${Date.now()}-6`,
          name: '침착맨 (이말년)',
          title: 'B급 만화가에서 대한민국 1등 방송국이 된 썰 풀기의 신',
          category: 'entertainment',
          viralityScore: 93,
          timeframe,
          trendingReason: '초대석 게스트 섭외력 및 웹툰·유튜브 크리에이터 성공 문법 화제',
          relatedFigures: ['주호민', '기안84', '궤도'],
          buzzSummary: '배우, 아이돌, 정치인, 과학자까지 모두가 찾아오는 독보적 유튜브 토크쇼 플랫폼 구축',
          controversyOrIssue: '웹툰 연재 당시 마감 지각과 악플을 견디며 스트리머로 전향해 일군 반전',
          suggestedAngle: '어떤 게스트든 무장해제시키는 뻔뻔함 속의 날카로운 인터뷰 센스',
          tags: ['침착맨', '이말년', '유튜브토크', '롱런비결', '입담의신'],
          primaryChannel: 'youtube',
          channelMetrics: {
            naverRank: '네이버 유튜브 검색 3위',
            youtubeViews: '월간 누적 조회수 4,500만 뷰',
            instaReels: '침착맨 숏클립 6만 개'
          }
        }
      ]);
    }
  } catch (err: any) {
    console.error('Error generating trending list:', err);
    return res.status(500).json({ error: err.message || '트렌드 생성 실패' });
  }
});

// Endpoint: Generate Full Shorts Package
app.post('/api/gemini/generate-shorts', async (req, res) => {
  try {
    const {
      figureName,
      title,
      buzzSummary,
      controversyOrIssue,
      suggestedAngle,
      hookLine,
      targetPersona = '4060_emotional',
      targetDuration = 60,
      videoTone = 'Cinematic',
      storyAngle = 'random',
      scriptFormat = 'overcoming_story',
      speechTone = 'friendly_story',
      refreshCounter = 0,
      customKeyword = '',
    } = req.body;

    if (!figureName) {
      return res.status(400).json({ error: '인물 정보가 누락되었습니다.' });
    }

    const formatDirectives: Record<string, string> = {
      'overcoming_story': '① [역경극복·감동미담형 (CJ 저단백밥 스타일)] 기업이나 기업인이 적자·위기·거절을 무릅쓰고 누군가의 삶을 바꾸거나 기술/품질에 끝까지 집념을 쏟아 낸 감동 미담과 통 큰 결단 중심으로 서사를 전개하세요.',
      'humble_twist': '② [소박한 반전매력형 (재벌의 길거리 어묵 먹방 스타일)] 수조 원대 자산가나 글로벌 CEO임에도 길거리 어묵을 서서 먹거나, 낡은 패딩/자켓을 10년째 입거나, 직원/팬과 격의 없이 어울리는 인간적이고 소탈한 반전 매력에 집중하세요.',
      'life_timeline': '③ [어린시절~현재 인생변천사형] 어려운 어린 시절이나 무명·초기 창업기의 결정적 한 장면에서 출발해, 한 번의 터닝포인트를 거쳐 현재 글로벌 리더로 성장한 극적인 인생 궤적을 속도감 있게 압축하세요.',
      'biz_sports_owner': '④ [기업인+스포츠 구단주/비즈니스형] 구단주·스폰서로서 보여준 남다른 팬 사랑, 파격적 투자, 락커룸·경기장 뒷이야기 또는 비즈니스 승부사로서의 통 큰 결단과 성과를 흥미진진하게 풀어내세요.',
    };

    const chosenFormatText = formatDirectives[scriptFormat] || formatDirectives['overcoming_story'];
    const chosenSpeechText = getSpeechTonePromptDirective(speechTone);
    const totalScenes = targetDuration === 45 ? 9 : 12;
    const targetCharMin = targetDuration === 45 ? 290 : 390;
    const targetCharMax = targetDuration === 45 ? 360 : 470;

    const prompt = `당신은 조회수 100만 뷰와 대기업 브랜디드 광고를 부르는 '국내외 기업인·부자 전문' 쇼츠 작가입니다.

[★ 절대 원칙 3대 철칙 (최우선 준수)]
1. 첫째, 철저히 '그 기업과 인물의 홍보팀'이라는 마인드로 긍정적인 미담, 위기 극복, 소박한 인간미, 통 큰 결단만 다루세요.
   - 비난, 악인전, 스캔들 폭로, 부정적 가십, 미검증 루머는 초상권·명예훼손 고소 위험이 있으므로 **절대 금지**합니다.
   - 오직 대상 인물(${figureName})의 실제 이력과 팩트만 사용하고, 타인의 숫자(예: CJ 290만 개·17년)를 다른 인물에게 베껴 쓰지 마세요.
2. 둘째, 첫 0~3초에 출생연도 같은 지루한 설명 대신 **충격적인 숫자나 반전 질문**으로 무조건 후킹하세요.
3. 셋째, ${targetDuration}초 대본을 반드시 아래 **5단계 구조**로 작성해 총 ${totalScenes}개 씬에 정확히 배분하세요:
   - [1단계: 0~3초 강렬한 후킹] (씬 1)
   - [2단계: 3~15초 의외의 배경] (씬 2~3)
   - [3단계: 15~40초 위기/반전 디테일] (씬 4~8)
   - [4단계: 40~55초 통 큰 결단과 성취] (씬 9~10)
   - [5단계: 55~60초 칭찬 댓글을 유도하는 여운 엔딩] (씬 11~12)

[사용자 선택 기획 옵션]
- [기획 포맷]: ${chosenFormatText}
- [대본 말투]: ${chosenSpeechText}
- 타겟 무드/연출 톤: ${targetPersona} / ${videoTone} (스토리 각도 참고: ${storyAngle})

[대상 인물 정보]
- 인물/기업: ${figureName}
- 테마: ${title || ''}
- 최근 화제 배경: ${buzzSummary || ''}
- 주목할 서사/미담: ${controversyOrIssue || ''}
- 추천 기획 앵글: ${suggestedAngle || ''}${hookLine ? `\n- 참고 후킹 문구: "${hookLine}"` : ''}${customKeyword ? `\n- 강조 키워드: "${customKeyword}"` : ''}
- 목표 길이: ${targetDuration}초, 나레이션 공백 제외 ${targetCharMin}~${targetCharMax}자, 총 ${totalScenes}개 씬

[★ 팩트 & 초상권/홍보팀 안전 체크]
- safetyCheck.numbersToVerify: 대본 속 검증이 필요한 숫자/연도 2개 배열
- safetyCheck.positivePrFit: 긍정 서사(홍보팀 기준) 적합 여부 1줄
- safetyCheck.isPrSafe: boolean

반드시 정해진 JSON 스키마로만 응답하세요.`;

    const extractTwoFactNumbers = (scriptText: string) => {
      const matches = scriptText.match(/\d+(?:,\d{3})*(?:\.\d+)?\s*(?:년|개월|일|시간|원|만\s*원|억\s*원|조\s*원|억|만|배|%|개|명|위|차|번|초)?/g) || [];
      const unique = Array.from(new Set(matches.map((m) => m.trim()).filter((m) => m.length >= 2))).slice(0, 2);
      if (unique.length >= 2) return unique;
      if (unique.length === 1) return [unique[0], '핵심 연도/공식 발표 수치 확인 필요'];
      return ['인물 핵심 연도·기간 확인 필요', '주요 실적·투자 금액 공식 보도 확인 필요'];
    };

    try {
      const response = await callGeminiWithRetry(() =>
        ai.models.generateContent({
          model: 'gemini-flash-latest',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.35,
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                hooks: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      type: { type: Type.STRING, description: 'question, provocative, or emotional' },
                      label: { type: Type.STRING, description: '후킹 타입 라벨' },
                      text: { type: Type.STRING, description: '3초 후킹 멘트 문장' }
                    },
                    required: ['type', 'label', 'text']
                  }
                },
                titles: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '쇼츠 제목 3가지 추천'
                },
                hashtags: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '스팸 없는 클린 태그 3~5개'
                },
                cleanSemanticTags: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                firstTwoLinesSeo: { type: Type.STRING, description: '검색 노출 최적화 첫 2줄' },
                description: { type: Type.STRING, description: '유튜브 설명란 텍스트' },
                pinnedComment: { type: Type.STRING, description: '인터랙션 폭발 고정 댓글' },
                commentBaits: {
                  type: Type.OBJECT,
                  properties: {
                    debateQuestion: { type: Type.STRING },
                    optionA: { type: Type.STRING },
                    optionB: { type: Type.STRING },
                    pinnedCommentDraft: { type: Type.STRING }
                  }
                },
                semanticKeywords: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                shareTrigger: { type: Type.STRING },
                timestamps: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      time: { type: Type.STRING },
                      label: { type: Type.STRING }
                    },
                    required: ['time', 'label']
                  }
                },
                fullScript: { type: Type.STRING, description: '자연스럽게 이어진 전체 나레이션 대본' },
                scenes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      sceneNumber: { type: Type.INTEGER },
                      timeRange: { type: Type.STRING, description: '00:00 - 00:05 형태' },
                      narration: { type: Type.STRING, description: '나레이션 1~2문장' },
                      visualGuide: { type: Type.STRING, description: '화면 연출 가이드' },
                      imageSearchKeyword: { type: Type.STRING, description: '구글 이미지 검색어' },
                      visualEffect: { type: Type.STRING, description: '줌인/패닝/자막효과' },
                      bgmSuggestion: { type: Type.STRING, description: '배경음악 무드' }
                    },
                    required: ['sceneNumber', 'timeRange', 'narration', 'visualGuide', 'imageSearchKeyword', 'visualEffect']
                  }
                },
                safetyCheck: {
                  type: Type.OBJECT,
                  properties: {
                    numbersToVerify: { type: Type.ARRAY, items: { type: Type.STRING } },
                    positivePrFit: { type: Type.STRING },
                    isPrSafe: { type: Type.BOOLEAN }
                  }
                },
                copyrightDefenseNote: { type: Type.STRING, description: '2차 창작물 보호 근거' }
              },
              required: ['hooks', 'titles', 'hashtags', 'description', 'pinnedComment', 'fullScript', 'scenes', 'safetyCheck', 'copyrightDefenseNote']
            }
          }
        })
      );

      const cleanedJson = String(response.text || '{}').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
      const sIdx = cleanedJson.indexOf('{');
      const eIdx = cleanedJson.lastIndexOf('}');
      const parsed = JSON.parse(sIdx >= 0 && eIdx > sIdx ? cleanedJson.slice(sIdx, eIdx + 1) : cleanedJson);
      const tonedParsed = applyToneToShortsPayload(parsed, speechTone);
      return res.json({
        ...tonedParsed,
        isFallback: false,
        safetyCheck: parsed.safetyCheck || {
          numbersToVerify: extractTwoFactNumbers(tonedParsed.fullScript || ''),
          positivePrFit: '적합 — 비난·루머 배제, 미담·인간미·결단 중심의 홍보팀 친화 서사',
          isPrSafe: true,
        },
      });
    } catch (apiErr: any) {
      console.warn('Fallback triggered for generate-shorts:', apiErr.message);

      const kw = customKeyword ? String(customKeyword).trim() : '';
      let fallback60Scenes = [];
      let fallbackHooks = [];
      let fallbackTitles = [];

      if (scriptFormat === 'humble_twist') {
        fallbackHooks = [
          { type: 'provocative', label: '반전형 후킹', text: kw ? `수조 원대 거장 ${figureName} 님이 '${kw}' 앞에서 보인 소박한 행동.` : `수조 원대 자산가 ${figureName} 님이 길거리에서 보인 뜻밖의 행동.` },
          { type: 'question', label: '인간미 후킹', text: `수행비서도 없이 단골 식당에 줄 서서 기다린 이유.` },
          { type: 'emotional', label: '질문형 후킹', text: `정상에 오른 거장이 평생 지킨 소탈한 습관.` }
        ];
        fallbackTitles = [
          `수조 원대 자산가 ${figureName} 님이 길거리에서 포착된 소탈한 모습 #shorts`,
          `격식 다 내려놓고 시민과 어울린 ${figureName}의 인간미 미담 #shorts`,
          `큰 사람이 더 겸손한 이유, ${figureName} 실화 #인간미`
        ];
        fallback60Scenes = [
          { sceneNumber: 1, timeRange: '00:00 - 00:05', narration: `수조 원대 기업을 이끄는 ${figureName} 님, 하지만 일상 속 모습은 믿기 어려울 만큼 소박했습니다.`, visualGuide: '화려한 공식석상과 소탈한 일상 컷 대비', imageSearchKeyword: `${figureName} 일상 소탈한 모습`, visualEffect: '임팩트 줌인', bgmSuggestion: '따뜻한 어쿠스틱 피아노' },
          { sceneNumber: 2, timeRange: '00:05 - 00:10', narration: '고급 의전 대신 소탈한 차림으로 동네 단골 식당에 직접 줄을 서며 시민들과 웃음을 나눴습니다.', visualGuide: '골목 식당 앞에서 환하게 웃는 소박한 모습', imageSearchKeyword: `${figureName} 목격담 소탈`, visualEffect: '좌측 패닝' },
          { sceneNumber: 3, timeRange: '00:10 - 00:15', narration: '현장 직원들과 눈높이를 맞추고, 사진 요청에도 귀찮은 기색 하나 없이 진심으로 응대했습니다.', visualGuide: '시민·직원과 격의 없이 어울리는 장면', imageSearchKeyword: `${figureName} 팬서비스 미소`, visualEffect: '2단 줌인' },
          { sceneNumber: 4, timeRange: '00:15 - 00:20', narration: kw ? `그가 '${kw}'을 지킬 수 있었던 힘은 어려웠던 초심을 잊지 않는 태도에서 나왔습니다.` : '그가 소탈함을 잃지 않는 이유는 현장의 땀방울을 잊지 않으려는 오랜 신념 때문이었습니다.', visualGuide: '초창기 낡은 작업복을 입고 현장을 뛰던 젊은 시절', imageSearchKeyword: `${figureName} 젊은 시절 현장`, visualEffect: '흑백 컷전환' },
          { sceneNumber: 5, timeRange: '00:20 - 00:25', narration: '남다른 위치에 올랐지만, 불필요한 격식을 줄이고 사람과 상생에 집중하는 경영을 이어갔습니다.', visualGuide: '협력사·임직원과 함께 식사하며 소통하는 회의실', imageSearchKeyword: `${figureName} 소통 미담`, visualEffect: '슬로우 줌아웃' },
          { sceneNumber: 6, timeRange: '00:25 - 00:30', narration: '"가장 낮은 자리의 목소리를 들을 줄 알아야 진짜 리더가 된다"는 말처럼 몸소 모범을 보였습니다.', visualGuide: '온화한 미소로 현장을 살피는 클로즈업', imageSearchKeyword: `${figureName} 현장 방문`, visualEffect: '다이내믹 줌인' },
          { sceneNumber: 7, timeRange: '00:30 - 00:35', narration: '조용한 선행과 사회 공헌까지 뒤늦게 알려지며 수많은 대중의 찬사가 쏟아졌습니다.', visualGuide: '미담 보도 헤드라인과 호평 댓글 연출', imageSearchKeyword: `${figureName} 기부 선행 기사`, visualEffect: '화이트 플래시' },
          { sceneNumber: 8, timeRange: '00:35 - 00:40', narration: '겉치레보다 본질에 집중한 진심이 세대를 넘어 뜨거운 울림을 준 것입니다.', visualGuide: '글로벌 행사에서 기립 박수를 받는 장면', imageSearchKeyword: `${figureName} 키노트 박수`, visualEffect: '우측 패닝' },
          { sceneNumber: 9, timeRange: '00:40 - 00:45', narration: '권위를 내려놓을수록 더 큰 존경이 돌아온다는 사실을 삶으로 증명했습니다.', visualGuide: '존경받는 리더의 당당하고 따뜻한 카리스마', imageSearchKeyword: `${figureName} 대표 인터뷰`, visualEffect: '슬로우 줌인' },
          { sceneNumber: 10, timeRange: '00:45 - 00:50', narration: '화려한 수식어보다 한 사람의 따뜻한 인품이 얼마나 큰 울림을 주는지 보여주었습니다.', visualGuide: '온화하게 웃는 인물 포트레이트', imageSearchKeyword: `${figureName} 웃음 클로즈업`, visualEffect: '부드러운 패닝' },
          { sceneNumber: 11, timeRange: '00:50 - 00:55', narration: '높아질수록 겸손해지는 거인의 품격, 많은 이들의 롤모델로 남았습니다.', visualGuide: '밝은 빛이 감도는 엔딩 컷', imageSearchKeyword: `${figureName} 최근 모습`, visualEffect: '와이드 줌아웃' },
          { sceneNumber: 12, timeRange: '00:55 - 01:00', narration: '여러분은 어떤 점이 가장 인상 깊으셨나요? 소탈함 속 진짜 품격을 기억해 보시길 바랍니다.', visualGuide: '구독·댓글 유도 엔딩 카드', imageSearchKeyword: `${figureName} 프로필 고화질`, visualEffect: '엔딩 페이드 아웃', bgmSuggestion: '기분 좋은 피아노 피날레' }
        ];
      } else if (scriptFormat === 'life_timeline' || scriptFormat === 'biz_sports_owner') {
        fallbackHooks = [
          { type: 'provocative', label: '반전형 후킹', text: kw ? `무명 시절에서 '${kw}'까지, ${figureName}의 판도를 바꾼 한 수.` : `작은 시작에서 글로벌 정상까지, ${figureName}의 결정적 터닝포인트.` },
          { type: 'question', label: '질문형 후킹', text: `모두가 불가능하다며 말렸던 날, ${figureName} 님은 왜 전부를 걸었을까?` },
          { type: 'emotional', label: '감동형 후킹', text: `시련을 정면 돌파해 시대의 아이콘이 된 발자취.` }
        ];
        fallbackTitles = [
          `세계의 판도를 바꾼 ${figureName}의 결정적 승부수 #shorts`,
          `밑바닥에서 정상까지, ${figureName}의 극적인 인생 변천사 #기업인`,
          `모두가 반대할 때 홀로 증명해낸 ${figureName}의 통 큰 결단 #인생역전`
        ];
        fallback60Scenes = [
          { sceneNumber: 1, timeRange: '00:00 - 00:05', narration: `단돈 몇 만 원과 작은 열정으로 출발한 ${figureName} 님, 지금은 세계가 주목하는 거장이 되었습니다.`, visualGuide: '청년 시절 흑백 사진과 현재 모습 오버랩', imageSearchKeyword: `${figureName} 젊은 시절 과거`, visualEffect: '임팩트 줌인', bgmSuggestion: '웅장한 오케스트라 스트링' },
          { sceneNumber: 2, timeRange: '00:05 - 00:10', narration: '하지만 초창기에는 자본도 배경도 없어 수십 번 넘게 투자 거절을 당해야 했습니다.', visualGuide: '작은 창업 사무실과 쌓인 기획서', imageSearchKeyword: `${figureName} 창업 초기 사무실`, visualEffect: '좌측 패닝' },
          { sceneNumber: 3, timeRange: '00:10 - 00:15', narration: '적자가 깊어지고 주변의 우려가 쏟아지던 밤에도 그는 연구실 불을 끄지 않았습니다.', visualGuide: '심야 연구실과 치열하게 고민하는 실루엣', imageSearchKeyword: `${figureName} 초기 위기`, visualEffect: '슬로우 줌인' },
          { sceneNumber: 4, timeRange: '00:15 - 00:20', narration: kw ? `인생의 전환점은 '${kw}'에 모든 역량을 쏟아붓기로 한 대담한 결단이었습니다.` : '인생의 전환점은 모두가 두려워하던 순간 미래 기술과 사람에게 승부를 건 대담한 결단이었습니다.', visualGuide: '결단력 있는 눈빛과 미래 설계도 그래픽', imageSearchKeyword: `${figureName} 전략 결단`, visualEffect: '2단 줌인' },
          { sceneNumber: 5, timeRange: '00:20 - 00:25', narration: '단기 이익 대신 장기적 신뢰와 팬·고객의 감동을 최우선 가치로 삼았습니다.', visualGuide: '경기장·행사장에서 팬들과 환호하는 현장', imageSearchKeyword: `${figureName} 팬 소통 현장`, visualEffect: '화이트 플래시' },
          { sceneNumber: 6, timeRange: '00:25 - 00:30', narration: '마침내 묵묵히 쌓아온 내공이 터져 나오며 업계와 시장의 판도가 단숨에 뒤집혔습니다.', visualGuide: '가파르게 상승하는 성과 그래프와 언론 보도', imageSearchKeyword: `${figureName} 글로벌 성공 기사`, visualEffect: '다이내믹 줌인' },
          { sceneNumber: 7, timeRange: '00:30 - 00:35', narration: '그의 비전과 통 큰 투자는 단순한 숫자를 넘어 수많은 이들에게 새로운 기회를 열었습니다.', visualGuide: '인재 육성 및 상생 프로젝트 현장', imageSearchKeyword: `${figureName} 인재 투자 상생`, visualEffect: '우측 패닝' },
          { sceneNumber: 8, timeRange: '00:35 - 00:40', narration: '위기 앞에서는 냉철한 승부사로, 현장에서는 따뜻한 동반자로 묵묵히 길을 넓혔습니다.', visualGuide: '동료들과 어깨를 나란히 한 모습', imageSearchKeyword: `${figureName} 팀워크 리더십`, visualEffect: '줌아웃' },
          { sceneNumber: 9, timeRange: '00:40 - 00:45', narration: '그는 말합니다. "진정한 혁신은 사람에 대한 믿음과 끝까지 해내는 집념에서 나옵니다."', visualGuide: '무대 위에서 열정적으로 강연하는 장면', imageSearchKeyword: `${figureName} 명연설 인터뷰`, visualEffect: '슬로우 줌인' },
          { sceneNumber: 10, timeRange: '00:45 - 00:50', narration: '수십 년의 땀방울이 증명한 오늘의 성취는 다음 세대의 이정표가 되었습니다.', visualGuide: '희망찬 도시 전경과 미래 비전', imageSearchKeyword: `${figureName} 글로벌 비전`, visualEffect: '따뜻한 비네팅' },
          { sceneNumber: 11, timeRange: '00:50 - 00:55', narration: '시련의 시간을 기회로 바꾼 ${figureName} 님의 역전 드라마는 여전히 진행 중입니다.', visualGuide: '자신감 넘치는 미소와 박수 갈채', imageSearchKeyword: `${figureName} 기립박수`, visualEffect: '천천히 줌인' },
          { sceneNumber: 12, timeRange: '00:55 - 01:00', narration: '오늘 도전을 멈추지 않는 여러분의 내일도 이처럼 빛나는 반전으로 채워지길 응원합니다.', visualGuide: '따뜻한 엔딩 프로필 카드', imageSearchKeyword: `${figureName} 최근 인터뷰 고화질`, visualEffect: '엔딩 페이드 아웃', bgmSuggestion: '희망찬 피아노 아웃트로' }
        ];
      } else {
        fallbackHooks = [
          { type: 'question', label: '사건형 후킹', text: kw ? `'${kw}' 뒤에 숨은 ${figureName} 님의 가슴 뭉클한 결단.` : `남들이 다 어렵다고 말릴 때 ${figureName} 님이 끝까지 포기하지 않은 이유.` },
          { type: 'provocative', label: '반전형 후킹', text: `당장의 손해를 감수하고도 묵묵히 지켜낸 약속의 진실.` },
          { type: 'emotional', label: '공감형 후킹', text: `단 한 사람의 진심이 기업과 시장을 바꿨습니다.` }
        ];
        fallbackTitles = [
          `만들수록 적자였지만 ${figureName} 님이 끝내 포기하지 않은 이유 #shorts`,
          `차갑던 세상을 바꾼 ${figureName}의 통 큰 결단과 눈물 미담 #감동실화`,
          `숫자가 아닌 사람을 택한 ${figureName}의 위대한 리더십 #동기부여`
        ];
        fallback60Scenes = [
          { sceneNumber: 1, timeRange: '00:00 - 00:05', narration: `매출과 수익만 쫓던 시장에서 ${figureName} 님은 모두의 예상을 깨고 손해를 감수하는 결단을 내렸습니다.`, visualGuide: `${figureName}의 결단력 있는 시선과 초기 기록 오버랩`, imageSearchKeyword: `${figureName} 대표 결단 인터뷰`, visualEffect: '임팩트 줌인', bgmSuggestion: '잔잔하고 묵직한 피아노' },
          { sceneNumber: 2, timeRange: '00:05 - 00:10', narration: '주변에서는 "돈이 되지 않는다, 당장 접어야 한다"는 냉정한 계산서만 내밀었습니다.', visualGuide: '어두운 회의실에서 고민하는 경영진 실루엣', imageSearchKeyword: `${figureName} 경영 위기 회의`, visualEffect: '슬로우 패닝' },
          { sceneNumber: 3, timeRange: '00:10 - 00:15', narration: kw ? `하지만 ${figureName} 님은 '${kw}'이라는 본질을 끝까지 지켜내야 한다고 믿었습니다.` : `하지만 ${figureName} 님은 "우리가 가진 기술이라면 반드시 해야 할 일"이라며 물러서지 않았습니다.`, visualGuide: '진지한 눈빛으로 현장을 챙기는 모습', imageSearchKeyword: `${figureName} 현장 소통 사진`, visualEffect: '2단 스피드 줌' },
          { sceneNumber: 4, timeRange: '00:15 - 00:20', narration: '자금 압박과 잇따른 위기 속에서도 현장의 땀방울과 연구 개발은 단 하루도 멈추지 않았습니다.', visualGuide: '불이 꺼지지 않는 연구실과 직원들의 열정', imageSearchKeyword: `${figureName} 연구개발 R&D`, visualEffect: '우측 패닝' },
          { sceneNumber: 5, timeRange: '00:20 - 00:25', narration: '화려한 포장 대신 사람과 품질이라는 가장 단순한 약속 하나를 묵묵히 지켜나갔습니다.', visualGuide: '정성스럽게 제작되는 현장 공정', imageSearchKeyword: `${figureName} 품질 철학`, visualEffect: '슬로우 줌아웃' },
          { sceneNumber: 6, timeRange: '00:25 - 00:30', narration: '그리고 그 뚝심 있는 결정이 수많은 사람들의 평범한 일상을 지켜주는 버팀목이 되었습니다.', visualGuide: '환하게 웃는 고객과 가족들의 따뜻한 장면', imageSearchKeyword: `${figureName} 사회공헌 미담`, visualEffect: '따뜻한 비네팅' },
          { sceneNumber: 7, timeRange: '00:30 - 00:35', narration: '시간이 흐른 뒤, 당장의 적자보다 값졌던 이 진심이 언론을 통해 뒤늦게 세상에 알려졌습니다.', visualGuide: '감동적인 보도 헤드라인과 호평 기사', imageSearchKeyword: `${figureName} 감동 실화 보도`, visualEffect: '다이내믹 줌인' },
          { sceneNumber: 8, timeRange: '00:35 - 00:40', narration: '차갑기만 했던 평가가 순식간에 뜨거운 존경과 박수로 뒤바뀐 순간이었습니다.', visualGuide: '공감과 응원이 쏟아지는 여론 반응', imageSearchKeyword: `${figureName} 호감 인터뷰`, visualEffect: '좌측 패닝' },
          { sceneNumber: 9, timeRange: '00:40 - 00:45', narration: '사업의 가치는 장부 위 숫자로만 남는 것이 아니라는 걸 행동으로 증명해냈습니다.', visualGuide: '신뢰감 넘치는 리더의 당당한 모습', imageSearchKeyword: `${figureName} 공식 행사 연설`, visualEffect: '슬로우 줌인' },
          { sceneNumber: 10, timeRange: '00:45 - 00:50', narration: '정상에 오른 지금도 그는 여전히 가장 어려운 곳부터 먼저 살피는 초심을 잃지 않았습니다.', visualGuide: '겸손하게 인사하며 현장을 찾는 모습', imageSearchKeyword: `${figureName} 최근 인터뷰 미소`, visualEffect: '천천히 줌인' },
          { sceneNumber: 11, timeRange: '00:50 - 00:55', narration: '누군가의 삶을 바꿀 때 비로소 존재 이유가 완성된다는 아름다운 기업 정신.', visualGuide: '함께 웃는 임직원들과 밝은 미래 그래픽', imageSearchKeyword: `${figureName} 비전 글로벌`, visualEffect: '우측 패닝' },
          { sceneNumber: 12, timeRange: '00:55 - 01:00', narration: '여러분이 생각하는 진짜 멋진 리더의 조건은 무엇인가요? 오늘 이 이야기가 따뜻한 위로가 되길 바랍니다.', visualGuide: '따뜻한 미소와 댓글 소통 유도 엔딩', imageSearchKeyword: `${figureName} 환한 미소 프로필`, visualEffect: '엔딩 페이드 아웃', bgmSuggestion: '희망찬 피아노 아웃트로' }
        ];
      }

      const rawSliced = (targetDuration === 45 ? fallback60Scenes.slice(0, 9) : fallback60Scenes).map((s, idx) => {
        let narration = s.narration;
        if (idx === 0 && hookLine) narration = String(hookLine).trim();
        else if (idx === 1 && buzzSummary) narration = String(buzzSummary).trim().slice(0, 95);
        else if (idx === 3 && controversyOrIssue) narration = String(controversyOrIssue).trim().slice(0, 95);
        return { ...s, narration };
      });
      const basePayload = applyToneToShortsPayload({
        hooks: fallbackHooks,
        titles: fallbackTitles,
        hashtags: ['#shorts', `#${figureName.replace(/\s+/g, '')}`, '#기업인미담'],
        cleanSemanticTags: [`#${figureName.replace(/\s+/g, '')}`, '#기업인미담', '#성공스토리'],
        firstTwoLinesSeo: `${figureName}의 긍정적 리더십과 위기 극복 미담. 통 큰 결단과 인간미를 담은 브랜드 세이프 숏폼입니다.`,
        timestamps: [
          { time: '00:00', label: '강렬한 첫 후킹' },
          { time: '00:15', label: '의외의 배경과 위기' },
          { time: '00:35', label: '통 큰 결단과 반전' },
          { time: '00:50', label: '존경과 여운 엔딩' }
        ],
        commentBaits: {
          debateQuestion: `${figureName} 님의 이야기 중 가장 멋졌던 리더십 순간은 무엇인가요?`,
          optionA: 'A. 적자와 위기에도 원칙을 지킨 통 큰 결단',
          optionB: 'B. 격식을 내려놓고 진심으로 다가가던 소탈함',
          pinnedCommentDraft: `📌 [댓글 소통] ${figureName} 님의 이야기 중 가장 인상 깊었던 장면을 댓글로 남겨주세요! 👇`
        },
        semanticKeywords: [figureName, '기업인 미담', '통 큰 결단', '소탈한 매력', '리더십'],
        shareTrigger: `오늘 따뜻한 울림과 영감이 필요한 지인에게 이 영상을 공유해보세요! 🚀`,
        description: `${figureName}의 긍정적인 미담과 통 큰 결단을 5단계 쇼츠 서사로 재구성한 브랜드 세이프 콘텐츠입니다.`,
        pinnedComment: `📌 [댓글 소통] ${figureName} 님의 이야기 중 가장 인상 깊었던 장면을 댓글로 남겨주세요! 👇`,
        fullScript: rawSliced.map((s) => s.narration).join('\n\n'),
        scenes: rawSliced,
      }, speechTone);

      return res.json({
        ...basePayload,
        isFallback: true,
        safetyCheck: {
          numbersToVerify: extractTwoFactNumbers(basePayload.fullScript),
          positivePrFit: '적합 — 비난·루머 배제, 미담·인간미·결단 중심의 홍보팀 친화 서사',
          isPrSafe: true,
        },
        copyrightDefenseNote: '본 영상은 공인된 언론 보도와 긍정적 미담·리더십 팩트를 기반으로 창작한 100% 브랜드 세이프 2차 저작물입니다.'
      });
    }
  } catch (err: any) {
    console.error('Error in generate-shorts:', err);
    return res.status(500).json({ error: err.message || '쇼츠 대본 생성 실패' });
  }
});

// Endpoint: AI refine scene narration or keyword
app.post('/api/gemini/refine-scene', async (req, res) => {
  try {
    const { figureName, currentNarration, instruction } = req.body;
    const prompt = `인물: ${figureName}
현재 씬 나레이션: "${currentNarration}"
수정 요청: "${instruction || '더 자극적이고 극적인 표현으로 다듬어줘'}"
결과를 오직 JSON { "narration": "수정된 문장", "imageSearchKeyword": "추천 이미지 검색어" } 형식으로만 답하세요.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            narration: { type: Type.STRING },
            imageSearchKeyword: { type: Type.STRING }
          },
          required: ['narration', 'imageSearchKeyword']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (err: any) {
    console.error('Error in refine-scene:', err);
    return res.status(500).json({ error: err.message || '씬 수정 실패' });
  }
});

// Endpoint: Generate high-performing viral content assets for Instagram, YouTube, Naver
app.post('/api/gemini/generate-viral-assets', async (req, res) => {
  try {
    const { topic, category = 'general', targetAudience = '2040 남녀', tone = '충격과 반전의 흥미진진한 톤' } = req.body;
    if (!topic) {
      return res.status(400).json({ error: '주제 또는 인물명을 입력해주세요.' });
    }

    const prompt = `당신은 2026년 최신 인스타그램, 유튜브, 네이버 알고리즘(AI 시맨틱 검색, DM 공유 가중치, 체류시간 및 인터랙션 엔진)을 완벽히 꿰뚫고 있는 대한민국 1위 SNS 바이럴 그로스 마케터이자 콘텐츠 디렉터입니다.

주제/인물: "${topic}"
카테고리: "${category}"
타겟 독자: "${targetAudience}"
선호 어조: "${tone}"

[2026년 최신 알고리즘 팩트체크 & 필수 작성 가이드]
1. 해시태그 무용론과 시맨틱 SEO:
   - 과거의 30개 해시태그 도배는 알고리즘상 도달률(Reach)에 0% 기여하며, 과다 시 스팸 점수를 받습니다.
   - 인스타/유튜브 모두 "자연어 시맨틱 SEO(본문 단어, AI 음성 인식 키워드, 자막 OCR)"를 통해 피드에 추천합니다.
   - 따라서 해시태그는 카테고리 색인용 3~5개만 클린하게 제공하고, 대신 'DM 공유 유발'과 '저장(Save) 유도', '댓글 폭발 트리거'를 생성해야 합니다.
2. 인스타그램 (릴스/피드):
   - 첫 1~2줄 (125자 이내): 피드에서 잘리기 전 무조건 '...더 보기'를 탭하게 만드는 강렬한 호기심 문장.
   - 본문: 모바일에서 3초 만에 훑어보는 가독성 불릿포인트 요약.
   - 클로징: 인스타 알고리즘 1위 가중치인 "친구에게 DM 공유" 및 "저장(Save)" 유도 카피.
3. 유튜브 (쇼츠/롱폼):
   - 썸네일 & 제목: 0.5초 만에 클릭을 낚아채는 CTR 15%+ 제목 3종.
   - 설명란 첫 2줄: 구글/유튜브 검색창 미리보기에 노출되는 핵심 키워드 배치.
   - 챕터 타임스탬프: 구글 검색 'Key Moments' 연동용 타임코드 4~5개.
   - 고정 댓글: 단순 인사 금지. 시청자들이 댓글 창에서 뜨겁게 찬반 토론을 벌이게 만드는 킬러 질문.
4. 네이버 블로그 (DIA+ 및 스마트블록):
   - 스마트블록 상위 노출 3단 제목 (검색 의도 완벽 부합).
   - 4분 체류시간을 방어하는 [3초 결론 요약 -> 소제목 3단 심층 팩트체크 -> 이웃소통] 구조.
5. 알고리즘 치트키 (viralTriggers):
   - shareAndSaveKit: 친구 DM 공유 카피 + 저장(Save) 필수 유도 카피 + 클린 시맨틱 태그 3~5개.
   - commentBaits: 알고리즘 피드 강제 추천을 유발하는 찬반/양자택일 논쟁 질문 2종과 고정댓글 초안.
   - semanticSeo: AI 음성 인식용 발화 키워드 5개 + 검색창 자동완성 구어체 쿼리 5개 + 타임스탬프.`;

    try {
      const response = await callGeminiWithRetry(() =>
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                topic: { type: Type.STRING },
                viralityStrategySummary: { type: Type.STRING, description: '3대 플랫폼 알고리즘 공략 핵심 전략 한줄 요약' },
                carousel: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    slides: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          slideNumber: { type: Type.INTEGER },
                          type: { type: Type.STRING, description: 'cover | hook | insight | body | cta' },
                          mainHook: { type: Type.STRING, description: '해당 장면의 핵심 상황을 3초 도입부처럼 시선을 사로잡는 큰 글씨 펀치라인 (1~2줄 압축, 15자 내외 권장)' },
                          subDetail: { type: Type.STRING, description: '쇼츠 대본을 요약하지 않고, 전체 스토리 서사를 모바일에서 읽기 편하게 컷 분할한 상세 본문 (작은 글씨)' },
                          visualGuide: { type: Type.STRING, description: '배경 이미지 또는 그래픽 가이드' },
                          imageSearchKeyword: { type: Type.STRING, description: '구글 이미지 검색에 가장 적합한 키워드 (예: 안성재 미군 정비병 시절)' },
                          badgeText: { type: Type.STRING, description: '상단 포인트 태그 ex) 충격 진실, 필독' }
                        },
                        required: ['slideNumber', 'type', 'mainHook', 'subDetail', 'visualGuide', 'imageSearchKeyword']
                      }
                    }
                  },
                  required: ['title', 'slides']
                },
                thumbnails: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      conceptName: { type: Type.STRING, description: '컨셉 명칭 ex) 극강 호기심형, 감정 자극형' },
                      mainText: { type: Type.STRING, description: '썸네일 메인 카피 2~3단어 (예: 이것 몰랐죠?)' },
                      subText: { type: Type.STRING, description: '보조 카피' },
                      badgeText: { type: Type.STRING, description: '눈에 띄는 배지 문구' },
                      visualComposition: { type: Type.STRING, description: '인물 표정, 대비, 배경 연출 가이드' },
                      colorScheme: {
                        type: Type.OBJECT,
                        properties: {
                          bg: { type: Type.STRING },
                          text: { type: Type.STRING },
                          accent: { type: Type.STRING }
                        },
                        required: ['bg', 'text', 'accent']
                      },
                      ctrRationale: { type: Type.STRING, description: '이 썸네일이 떡상하는 CTR 이유' }
                    },
                    required: ['conceptName', 'mainText', 'subText', 'visualComposition', 'colorScheme', 'ctrRationale']
                  }
                },
                posts: {
                  type: Type.OBJECT,
                  properties: {
                    instagram: {
                      type: Type.OBJECT,
                      properties: {
                        hookFirstLine: { type: Type.STRING, description: '더보기 클릭을 유도하는 첫 1~2줄 (125자 스톱 라인)' },
                        bodyText: { type: Type.STRING, description: '인스타그램 맞춤 줄바꿈 본문' },
                        bulletSummary: { type: Type.ARRAY, items: { type: Type.STRING }, description: '가독성 3줄 요약' },
                        saveShareTrigger: { type: Type.STRING, description: '알고리즘 1위 가중치 DM 공유 및 저장 유도 카피' },
                        cleanSemanticTags: { type: Type.ARRAY, items: { type: Type.STRING }, description: '알고리즘 최적화 클린 태그 3~5개' },
                        callToAction: { type: Type.STRING, description: '댓글 및 저장 유도 문구' },
                        hashtagsFormatted: { type: Type.STRING }
                      },
                      required: ['hookFirstLine', 'bodyText', 'saveShareTrigger', 'cleanSemanticTags', 'callToAction']
                    },
                    youtube: {
                      type: Type.OBJECT,
                      properties: {
                        titleCandidates: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                          description: 'CTR 15%+ 극대화 유튜브 제목 후보 3종'
                        },
                        firstTwoLinesSeo: { type: Type.STRING, description: '검색 미리보기에 노출되는 핵심 2줄 설명' },
                        descriptionText: { type: Type.STRING, description: '알고리즘 검색 최적화 설명란' },
                        timestamps: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              time: { type: Type.STRING },
                              label: { type: Type.STRING }
                            },
                            required: ['time', 'label']
                          },
                          description: '구글 검색 키모먼트 연동용 챕터 타임스탬프'
                        },
                        pinnedComment: { type: Type.STRING, description: '시청자 댓글 난상토론 유발 고정 댓글' },
                        semanticKeywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'AI 음성/자막 검색용 핵심 키워드' },
                        tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                      },
                      required: ['titleCandidates', 'firstTwoLinesSeo', 'descriptionText', 'timestamps', 'pinnedComment', 'semanticKeywords', 'tags']
                    },
                    naver: {
                      type: Type.OBJECT,
                      properties: {
                        blogTitleCandidates: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                          description: '스마트블록 DIA+ 상위노출 블로그 제목 3종'
                        },
                        intro: { type: Type.STRING, description: '3초 결론 요약 및 체류시간 보장 도입부' },
                        sections: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              subTitle: { type: Type.STRING },
                              paragraph: { type: Type.STRING }
                            },
                            required: ['subTitle', 'paragraph']
                          }
                        },
                        conclusion: { type: Type.STRING, description: '마무리 인사 및 이웃 추가 유도' },
                        smartBlockKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                        dwellTimeSecret: { type: Type.STRING, description: '체류시간 4분 방어 팁' }
                      },
                      required: ['blogTitleCandidates', 'intro', 'sections', 'conclusion', 'smartBlockKeywords', 'dwellTimeSecret']
                    }
                  },
                  required: ['instagram', 'youtube', 'naver']
                },
                viralTriggers: {
                  type: Type.OBJECT,
                  properties: {
                    shareAndSaveKit: {
                      type: Type.OBJECT,
                      properties: {
                        dmShareCopy: { type: Type.STRING, description: '친구에게 DM으로 전송하게 만드는 멘트' },
                        saveTriggerCopy: { type: Type.STRING, description: '저장(Save) 필수 유도 문구' },
                        cleanTags: { type: Type.ARRAY, items: { type: Type.STRING }, description: '알고리즘 최적화 클린 태그 3~5개' }
                      },
                      required: ['dmShareCopy', 'saveTriggerCopy', 'cleanTags']
                    },
                    commentBaits: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          baitTitle: { type: Type.STRING },
                          debateQuestion: { type: Type.STRING },
                          optionA: { type: Type.STRING },
                          optionB: { type: Type.STRING },
                          pinnedCommentDraft: { type: Type.STRING }
                        },
                        required: ['baitTitle', 'debateQuestion', 'optionA', 'optionB', 'pinnedCommentDraft']
                      },
                      description: '댓글 폭발 논쟁/토론 유도 질문 및 고정댓글 템플릿'
                    },
                    semanticSeo: {
                      type: Type.OBJECT,
                      properties: {
                        voiceKeywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: '영상에서 소리내어 말해야 하는 키워드' },
                        searchQueries: { type: Type.ARRAY, items: { type: Type.STRING }, description: '구글/유튜브 검색창 자동완성 쿼리' },
                        sampleTimestamps: { type: Type.ARRAY, items: { type: Type.STRING }, description: '챕터 타임스탬프' }
                      },
                      required: ['voiceKeywords', 'searchQueries', 'sampleTimestamps']
                    }
                  },
                  required: ['shareAndSaveKit', 'commentBaits', 'semanticSeo']
                }
              },
              required: ['topic', 'viralityStrategySummary', 'carousel', 'thumbnails', 'posts', 'viralTriggers']
            }
          }
        })
      );

      const parsed = JSON.parse(response.text || '{}');
      return res.json(parsed);
    } catch (apiErr: any) {
      console.warn('Fallback triggered for generate-viral-assets:', apiErr.message);
      // High-quality fallback for robust UX
      return res.json({
        topic,
        viralityStrategySummary: `${topic}의 핵심 반전과 호기심 갭을 공략하여 인스타 3초 스탑, 유튜브 12%+ CTR, 네이버 4분 체류시간을 유도하는 3대 플랫폼 종합 세트`,
        carousel: {
          title: `${topic} 몰랐던 99%가 충격받은 반전 이야기`,
          slides: [
            {
              slideNumber: 1,
              type: 'cover',
              mainHook: `"${topic}"에 대해\n우리가 전혀 몰랐던 진실`,
              subDetail: '알고리즘이 숨겨둔 결정적 비하인드 (옆으로 넘겨보기 👉)',
              visualGuide: '어두운 그라데이션 배경 + 중앙에 강렬한 타이포그래피 + 돋보기 또는 비밀 아이콘',
              imageSearchKeyword: `${topic} 프로필 고화질`,
              badgeText: '⚠️ 긴급 분석'
            },
            {
              slideNumber: 2,
              type: 'hook',
              mainHook: '겉으로 보이는 모습이\n전부가 아니었습니다',
              subDetail: '수많은 사람들이 그냥 지나쳤던 첫 번째 복선과 이상 징후',
              visualGuide: '대비되는 두 장의 사진 분할 레이아웃',
              imageSearchKeyword: `${topic} 과거 무명시절`,
              badgeText: '1. 숨겨진 복선'
            },
            {
              slideNumber: 3,
              type: 'body',
              mainHook: '결정적인 순간,\n모두를 경악하게 만든 한마디',
              subDetail: '모두가 성공이라 믿었을 때 드러난 뜻밖의 이면과 치열한 승부수',
              visualGuide: '인용구 따옴표 그래픽 + 핵심 하이라이트 형광펜 효과',
              imageSearchKeyword: `${topic} 인터뷰 결정적 순간`,
              badgeText: '2. 반전 포인트'
            },
            {
              slideNumber: 4,
              type: 'insight',
              mainHook: '우리가 여기서\n반드시 배워야 할 1가지',
              subDetail: '결국 판을 뒤흔드는 것은 남들과 다른 단 1%의 관점과 실행력',
              visualGuide: '밝고 신뢰감을 주는 블루/골드 톤 + 핵심 요약 체크리스트 박스',
              imageSearchKeyword: `${topic} 명언 또는 성공 비하인드`,
              badgeText: '3. 핵심 인사이트'
            },
            {
              slideNumber: 5,
              type: 'cta',
              mainHook: '당신의 생각은 어떠신가요?\n댓글로 남겨주세요!',
              subDetail: '📌 나중에 다시 보려면 지금 바로 [저장] 해두세요!\n친구에게 [공유]하고 의견을 나눠보세요.',
              visualGuide: '공유/저장 아이콘 화살표 안내 + 깔끔한 엔딩 카드',
              imageSearchKeyword: `${topic} 최근 근황`,
              badgeText: '💬 토론해보기'
            }
          ]
        },
        thumbnails: [
          {
            conceptName: '🔥 극강 호기심 유발형 (CTR 14.8% 타겟)',
            mainText: '결국 터졌다...',
            subText: `${topic} 충격적인 실체`,
            badgeText: '단독 최초',
            visualComposition: '얼굴 극단적 클로즈업 + 눈동자 하이라이트 + 붉은색 의문부호(?) 스티커',
            colorScheme: { bg: '#0f172a', text: '#ffffff', accent: '#ef4444' },
            ctrRationale: '인간의 손실회피 및 미완성 효과(Zeigarnik Effect)를 극대화하여 0.5초 만에 클릭 유도'
          },
          {
            conceptName: '⚡ 반전 대비형 (알고리즘 추천 탭 최적화)',
            mainText: '모두 속았습니다',
            subText: `진짜 이유는 따로 있었다`,
            badgeText: '팩트체크',
            visualComposition: '좌우 흑백 vs 풀컬러 명암 대비 + 노란색 굵은 고딕 볼드 폰트',
            colorScheme: { bg: '#18181b', text: '#facc15', accent: '#3b82f6' },
            ctrRationale: '기존 통념을 뒤엎는 헤드라인으로 쇼츠 피드 스크롤을 즉각 정지시킴'
          },
          {
            conceptName: '💎 감동 & 인생역전형 (시청 지속시간 견인)',
            mainText: '눈물의 10년',
            subText: `${topic}이 끝내 버텨낸 이유`,
            badgeText: '인간 승리',
            visualComposition: '따뜻한 감성 톤 + 눈시울 붉어진 표정 포커스 + 깔끔한 화이트 볼드 자막',
            colorScheme: { bg: '#1e1b4b', text: '#ffffff', accent: '#818cf8' },
            ctrRationale: '공감대와 감정적 연대를 자극하여 높은 완독률 및 댓글 참여를 확보'
          }
        ],
        posts: {
          instagram: {
            hookFirstLine: `솔직히 ${topic}에 대해 여기까지 알고 계셨던 분 계신가요...? 🫢`,
            bodyText: `다들 겉으로 드러난 부분만 보고 넘어가지만,\n파고들수록 상상도 못 했던 결정적 반전이 숨어있었습니다.\n\n✔️ 첫 번째: 아무도 주목하지 않았던 무명 시절의 시련\n✔️ 두 번째: 위기의 순간에 던진 단 한 번의 승부수\n✔️ 세 번째: 끝내 판을 뒤집어버린 치열한 실행력\n\n결국 남다른 결과를 만들어내는 사람들은 위기를 바라보는 프레임 자체가 완전히 다르다는 걸 다시 한번 느끼게 되네요.\n\n여러분이 보셨을 때 가장 인상 깊었던 포인트는 무엇인가요?`,
            bulletSummary: [
              `모두가 실패라고 단정 지었던 순간의 충격적인 반전`,
              `10년간 숨겨져 있던 결정적 성장 트리거와 실행력`,
              `지금 우리 삶과 일에 바로 적용할 수 있는 단 1가지 인사이트`
            ],
            saveShareTrigger: `📌 3초 만에 잊어버리기 전에 왼쪽 아래 [저장] 누르고, 이 사실 모르는 친구에게 [공유]해서 알려주세요!`,
            cleanSemanticTags: [topic, `${topic}비하인드`, '인생역전', '동기부여', '트렌드'],
            callToAction: `👉 지금 저장해두고 영감이 필요할 때마다 꺼내보세요!\n💬 여러분의 솔직한 생각을 댓글로 들려주세요.`,
            hashtagsFormatted: `#${topic} #화제의인물 #인생역전 #동기부여 #성공마인드셋 #트렌드인사이트`
          },
          youtube: {
            titleCandidates: [
              `[충격] ${topic}, 세상에 밝혀진 소름 돋는 비하인드 (아무도 몰랐던 진실)`,
              `모두가 감탄한 ${topic}의 역대급 인생 반전... 어떻게 가능했을까?`,
              `${topic}이 위기 속에서도 끝까지 버틸 수 있었던 결정적 단 한마디`
            ],
            firstTwoLinesSeo: `🔥 실시간 화제의 중심 [${topic}]의 숨겨진 이야기와 떡상 비하인드를 정리했습니다. 100만 뷰 이상 화제가 된 진짜 이유를 지금 확인하세요!`,
            descriptionText: `🔥 실시간 화제의 중심 [${topic}]의 숨겨진 이야기와 떡상 비하인드를 정리했습니다.\n\n구독과 좋아요, 알림 설정은 다음 고퀄리티 분석 콘텐츠 제작에 큰 힘이 됩니다!\n\n타임라인:\n00:00 오프닝 및 충격의 시작\n00:15 아무도 몰랐던 무명 시절의 비밀\n00:35 판을 뒤흔든 결정적 사건\n00:50 우리가 얻어야 할 인사이트\n\n#${topic} #쇼츠 #비하인드 #이슈분석`,
            timestamps: [
              { time: '00:00', label: '오프닝 및 충격의 시작' },
              { time: '00:15', label: '아무도 몰랐던 무명 시절의 비밀' },
              { time: '00:35', label: '판을 뒤흔든 결정적 반전' },
              { time: '00:50', label: '우리가 얻어야 할 핵심 인사이트' }
            ],
            pinnedComment: `📌 여러분은 ${topic}의 이번 소식을 듣고 어떤 생각이 먼저 드셨나요? 여러분의 소중한 의견을 댓글로 자유롭게 남겨주세요! 가장 공감 가는 댓글은 고정해 드립니다 ✨`,
            semanticKeywords: [topic, `${topic} 근황`, `${topic} 과거`, `${topic} 인터뷰`, `${topic} 성공비결`],
            tags: [topic, `${topic} 비하인드`, `${topic} 쇼츠`, '화제의인물', '이슈정리', '인생역전', '실시간트렌드']
          },
          naver: {
            blogTitleCandidates: [
              `${topic} 논란과 숨겨진 비하인드 총정리 (모르면 손해인 핵심 요약)`,
              `요즘 핫한 ${topic}, 왜 이렇게 대중이 열광할까? 팩트와 반전 분석`,
              `${topic} 완벽 분석: 과거 무명 시절부터 현재 화제의 중심에 서기까지`
            ],
            intro: `안녕하세요! 트렌드와 화제의 인물을 깊이 있게 분석해 드리는 에디터입니다.\n\n요즘 온라인 커뮤니티와 유튜브, 인스타그램을 뜨겁게 달구고 있는 화제의 키워드, 바로 '${topic}'인데요.\n단순한 가십을 넘어 왜 이렇게 수많은 사람들이 주목하고 있는지, 핵심 팩트와 우리가 놓치기 쉬운 비하인드를 깔끔하게 정리해 드리겠습니다.`,
            sections: [
              {
                subTitle: `1. ${topic}, 도대체 왜 갑자기 화제가 되었을까?`,
                paragraph: `발단은 단순한 한 장면에서 시작되었지만, 그 이면에는 오랫동안 축적되어 온 내러티브가 있었습니다. 대중의 호기심을 자극하는 주요 계기를 타임라인 순으로 짚어보면...`
              },
              {
                subTitle: `2. 모두를 놀라게 만든 숨겨진 반전과 결정적 순간`,
                paragraph: `가장 뜨거운 반응을 이끌어낸 지점은 바로 예상치 못했던 선택이었습니다. 다수가 안전한 길을 택할 때 과감한 결단을 내림으로써 상황을 반전시켰는데요...`
              },
              {
                subTitle: `3. 우리가 주목해야 할 점과 앞으로의 파급력`,
                paragraph: `이번 이슈는 단순한 일회성 화제에 그치지 않고 앞으로의 트렌드 지형에도 상당한 영향을 미칠 것으로 전망됩니다.`
              }
            ],
            conclusion: `오늘 정리해 드린 ${topic}의 비하인드 스토리, 유익하셨나요?\n도움이 되셨다면 공감(❤️)과 이웃 추가 부탁드리며, 여러분의 생각도 댓글로 편하게 남겨주세요!`,
            smartBlockKeywords: [topic, `${topic} 근황`, `${topic} 나이`, `${topic} 프로필`, `${topic} 논란`, `${topic} 비하인드`],
            dwellTimeSecret: `본문 중간에 인용구 박스와 볼드 폰트를 적절히 배치하여 독자의 스크롤 속도를 늦추고 체류시간 4분 이상을 유지하세요.`
          }
        },
        viralTriggers: {
          shareAndSaveKit: {
            dmShareCopy: `이거 보고 소름 돋았음... @친구야 너도 ${topic} 좋아하지? 이 비하인드는 진짜 몰랐을걸? 지금 확인해봐!`,
            saveTriggerCopy: `📌 "나중에 봐야지" 하면 평생 못 봅니다! 지금 바로 [저장] 누르고 영감이 필요할 때 꺼내보세요.`,
            cleanTags: [topic, `${topic}이슈`, '트렌드인사이트', '인생역전', '숏폼바이럴']
          },
          commentBaits: [
            {
              baitTitle: '🔥 호불호 갈리는 양자택일 난상토론 (댓글 폭발)',
              debateQuestion: `솔직히 ${topic}의 성공은 '압도적인 재능' vs '처절한 노력', 여러분은 둘 중 무엇이라고 생각하시나요?`,
              optionA: '1번: 타고난 재능이 80% 이상이다',
              optionB: '2번: 포기하지 않은 집념과 노력이 전부다',
              pinnedCommentDraft: `💬 [오늘의 밸런스 게임] 솔직히 ${topic} 님처럼 되려면 1번 재능 vs 2번 꺾이지 않는 마음, 여러분의 선택은 무엇인가요? (댓글로 번호와 이유를 적어주시면 하트 쏴드립니다 ❤️)`
            },
            {
              baitTitle: '⚡ 공감 & 반발심 유발 질문 (조회수 급상승)',
              debateQuestion: `만약 당신이 ${topic} 님과 같은 위기 상황이었다면, 과연 똑같이 버텨낼 수 있었을까요?`,
              optionA: '솔직히 하루도 못 버티고 포기했을 것이다',
              optionB: '이 악물고 끝까지 버텼을 것이다',
              pinnedCommentDraft: `📌 솔직히 나라면 ${topic} 님 시절에 포기했다 vs 그래도 버텼다... 솔직한 심정을 댓글로 남겨주세요!`
            }
          ],
          semanticSeo: {
            voiceKeywords: [topic, '비하인드', '충격 진실', '인생역전', '성공비결'],
            searchQueries: [
              `${topic} 논란 비하인드`,
              `${topic} 과거 무명 시절`,
              `${topic} 최근 근황 나이 프로필`,
              `${topic} 쇼츠 떡상 이유`,
              `${topic} 인터뷰 명언`
            ],
            sampleTimestamps: [
              '00:00 오프닝 및 충격적인 첫 장면',
              '00:15 아무도 몰랐던 무명 시절의 시련',
              '00:35 운명을 뒤바꾼 결정적 승부수',
              '00:50 우리가 반드시 배워야 할 인사이트'
            ]
          }
        },
        hashtagIntelligence: {
          instagram: {
            mega: [`#${topic}`, '#이슈', '#트렌드', '#유튜브', '#릴스'],
            mid: ['#화제의인물', '#인생역전', '#동기부여', '#자기계발', '#인사이트'],
            niche: [`#${topic}비하인드`, `#${topic}근황`, '#쇼츠크리에이터', '#떡상비결']
          },
          youtube: [topic, `${topic} 근황`, `${topic} 쇼츠`, '화제의인물', '유튜브 알고리즘', '인기급상승', '실시간이슈'],
          naver: [topic, `${topic} 비하인드`, `${topic} 총정리`, `${topic} 반응`, '네이버 스마트블록']
        }
      });
    }
  } catch (err: any) {
    console.error('Error in generate-viral-assets:', err);
    return res.status(500).json({ error: err.message || '바이럴 에셋 생성 실패' });
  }
});

// Voice ID aliases for backwards compatibility
const VOICE_ALIAS_MAP: Record<string, string> = {
  'voice-1': 'JBFqnCBsd6RMkjVDRZzb', // George (Default Warm Storyteller)
  'voice-2': 'TX3LPaxmHKxFdv7VOQHJ', // Liam (Fast-paced Social Media)
  'voice-3': 'cgSgspJ2msm6clMCkdW9', // Jessica (Warm & Playful)
  'voice-4': 'CwhRBWXzGAHq8TQ4Fs17', // Roger (Casual)
  'voice-5': 'Xb7hH8MSUJpSbSDYk0k2', // Alice (Educator)
  'voice-6': 'pNInz6obpgDQGcFmaJgB', // Adam (Dominant / Cinematic)
  'voice-7': 'hpp4J3VqNfWAUOO0d1Us', // Bella (Professional)
  'voice-8': 'cjVigY5qzO86Huf0OWal', // Eric (Smooth / Business)
  'voice-9': 'pFZP5JQG7iQjIQuC4Bku', // Lily (Velvety Actress)
  'voice-10': 'N2lVS1w4EtoT3dr4eOWO', // Callum (Husky / Mystery)
  'voice-11': 'FGY2WhTYpPnrIDTdsKH5', // Laura (Enthusiast)
  'voice-12': 'IKne3meq5aSn9XLyUdCD', // Charlie (Confident / Sports)
  'voice-13': 'nPczCjzI2devNBz1zQrb', // Brian (Deep / Documentary)
  'voice-14': 'EXAVITQu4vr4xnSDxMaL', // Sarah (Mature / Reassuring)
  'voice-15': 'onwK4e9ZLuTAKqWW03F9', // Daniel (Steady Broadcaster)
};

function resolveVoiceId(rawId: string | null | undefined): string {
  if (!rawId) return 'JBFqnCBsd6RMkjVDRZzb'; // Default George
  return VOICE_ALIAS_MAP[rawId] || rawId;
}

// Endpoint: ElevenLabs v4 High-Quality Korean TTS streamer for video rendering & voice preview
app.all('/api/tts', async (req, res) => {
  try {
    if (req.method === 'GET' && req.query.check === '1') {
      return res.json({
        configured: Boolean(req.headers['xi-api-key']),
      });
    }
    const rawText = (req.method === 'POST' ? req.body?.text : req.query.text) || '';
    const cleanText = (rawText as string).trim().slice(0, 1000);
    const rawVoiceId = (req.method === 'POST' ? (req.body?.voice_id || req.body?.reference_id) : (req.query.voice_id || req.query.reference_id)) as string;
    const voiceId = resolveVoiceId(rawVoiceId);
    const modelId = ((req.method === 'POST' ? req.body?.model_id : req.query.model_id) as string) || 'eleven_v4'; // 'eleven_v4' as default!
    const stability = parseFloat((req.method === 'POST' ? req.body?.stability : req.query.stability) ?? 0.5);
    const similarityBoost = parseFloat((req.method === 'POST' ? req.body?.similarity_boost : req.query.similarity_boost) ?? 0.75);
    const style = parseFloat((req.method === 'POST' ? req.body?.style : req.query.style) ?? 0.15);
    const useSpeakerBoost = (req.method === 'POST' ? req.body?.use_speaker_boost : req.query.use_speaker_boost) !== false && (req.method === 'POST' ? req.body?.use_speaker_boost : req.query.use_speaker_boost) !== 'false';
    const withTimestamps = (req.method === 'POST' ? req.body?.with_timestamps : req.query.with_timestamps) === true || (req.query.with_timestamps === 'true');

    if (!cleanText) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // 1. ElevenLabs API (Requires user-supplied xi-api-key header; no shared server key)
    const elevenApiKey = (req.headers['xi-api-key'] as string) || '';
    if (elevenApiKey) {
      try {
        const endpoint = withTimestamps ? '/with-timestamps' : '';
        const elevenUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}${endpoint}?output_format=mp3_44100_128`;
        const elevenRes = await fetch(elevenUrl, {
          method: 'POST',
          headers: {
            'xi-api-key': elevenApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: cleanText,
            model_id: modelId,
            voice_settings: {
              stability: isNaN(stability) ? 0.5 : stability,
              similarity_boost: isNaN(similarityBoost) ? 0.75 : similarityBoost,
              style: isNaN(style) ? 0.15 : style,
              use_speaker_boost: useSpeakerBoost,
            },
          }),
        });

        if (elevenRes.ok) {
          const arrayBuffer = await elevenRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          res.set({
            'Content-Type': 'audio/mpeg',
            'Content-Length': buffer.length.toString(),
            'Cache-Control': 'public, max-age=86400',
            'X-TTS-Engine': `ElevenLabs-${modelId}`,
          });
          return res.end(buffer);
        } else {
          const errBody = await elevenRes.text();
          console.warn('ElevenLabs API failed, using fallback:', elevenRes.status, errBody);
        }
      } catch (elevenErr: any) {
        console.warn('ElevenLabs API error, using fallback:', elevenErr.message);
      }
    }

    // 2. High-performance fallback
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ko&client=tw-ob&q=${encodeURIComponent(cleanText.slice(0, 180))}`;
    const response = await fetch(ttsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://translate.google.com/'
      }
    });

    if (!response.ok) {
      throw new Error(`Upstream TTS returned status ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'public, max-age=86400',
      'X-TTS-Engine': 'System-Fallback',
    });

    return res.end(buffer);
  } catch (err: any) {
    console.error('Error in /api/tts:', err.message);
    return res.status(500).json({ error: err.message || 'TTS generation failed' });
  }
});

// ==========================================
// Cloud Sync & Projects Endpoints (Server Store + Supabase)
// ==========================================
const serverProjectsStore = new Map<string, any>();
const serverSyncCodes = new Map<string, { projects: any[]; expiresAt: number }>();
let serverActiveDraft: any = null;
const TMP_SERVER_STORE = path.join(os.tmpdir ? os.tmpdir() : '/tmp', 'untold_projects_store.json');
const TMP_SERVER_DRAFT = path.join(os.tmpdir ? os.tmpdir() : '/tmp', 'untold_draft_store.json');

try {
  if (fs.existsSync(TMP_SERVER_STORE)) {
    const list = JSON.parse(fs.readFileSync(TMP_SERVER_STORE, 'utf8'));
    if (Array.isArray(list)) {
      list.forEach((p: any) => { if (p && p.id) serverProjectsStore.set(p.id, p); });
    }
  }
} catch (e) {}

try {
  if (fs.existsSync(TMP_SERVER_DRAFT)) {
    serverActiveDraft = JSON.parse(fs.readFileSync(TMP_SERVER_DRAFT, 'utf8'));
  }
} catch (e) {}

function persistServerStore() {
  try {
    fs.writeFileSync(TMP_SERVER_STORE, JSON.stringify(Array.from(serverProjectsStore.values())), 'utf8');
  } catch (e) {}
}

function persistServerDraft(draft: any) {
  try {
    fs.writeFileSync(TMP_SERVER_DRAFT, JSON.stringify(draft), 'utf8');
  } catch (e) {}
}

app.get('/api/projects', async (req, res) => {
  try {
    const syncCode = req.query.sync_code as string;
    if (syncCode) {
      const codeKey = syncCode.replace(/[^0-9]/g, '');
      const entry = serverSyncCodes.get(codeKey);
      if (entry) {
        if (Date.now() > entry.expiresAt) {
          serverSyncCodes.delete(codeKey);
          return res.status(404).json({ error: '만료된 동기화 코드입니다.', projects: [] });
        }
        return res.json({ success: true, projects: entry.projects });
      }
      return res.status(404).json({ error: '동기화 코드를 찾을 수 없습니다.', projects: [] });
    }

    if (req.query.type === 'draft') {
      return res.json({ success: true, draft: serverActiveDraft });
    }

    const projectMap = new Map<string, any>();
    for (const [id, p] of serverProjectsStore.entries()) {
      projectMap.set(id, p);
    }

    if (supabase) {
      try {
        const { data: untoldData } = await supabase
          .from('untold_projects')
          .select('data')
          .order('created_at', { ascending: false });

        if (untoldData && untoldData.length > 0) {
          untoldData.forEach((row: any) => {
            if (row.data && !row.data.__system && row.data.id) projectMap.set(row.data.id, row.data);
          });
        }
      } catch (e) {}
    }

    const projects = Array.from(projectMap.values()).sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    return res.json({ projects, source: 'cloud_sync_ready' });
  } catch (err: any) {
    console.error('Error fetching projects:', err.message);
    return res.status(500).json({ error: err.message, projects: [] });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const body = req.body;
    if (!body) {
      return res.status(400).json({ error: 'Invalid project payload' });
    }

    if (body.action === 'create_sync_code' && Array.isArray(body.projects)) {
      const rawCode = Math.floor(100000 + Math.random() * 900000).toString();
      serverSyncCodes.set(rawCode, {
        projects: body.projects,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      });
      for (const p of body.projects) {
        if (p && p.id) {
          serverProjectsStore.set(p.id, { ...p, isSaved: true, updatedAt: p.updatedAt || new Date().toISOString() });
        }
      }
      persistServerStore();
      return res.json({
        success: true,
        syncCode: `${rawCode.slice(0, 3)}-${rawCode.slice(3)}`,
        rawCode,
        count: body.projects.length,
      });
    }

    if (body.type === 'draft' && body.project) {
      const draft = {
        ...body.project,
        autoSavedAt: new Date().toISOString(),
      };
      serverActiveDraft = draft;
      persistServerDraft(draft);
      return res.json({ success: true, autoSavedAt: draft.autoSavedAt });
    }

    const project = body;
    if (!project || !project.figureName) {
      return res.status(400).json({ error: 'Invalid project payload' });
    }

    const projectId = project.id || `proj-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const enrichedProject = {
      ...project,
      id: projectId,
      createdAt: project.createdAt || nowIso,
      updatedAt: nowIso,
      isSaved: true,
    };

    serverProjectsStore.set(projectId, enrichedProject);
    persistServerStore();

    if (supabase) {
      try {
        await supabase.from('untold_projects').upsert(
          {
            id: projectId,
            figure_name: enrichedProject.figureName,
            category: enrichedProject.category || 'entertainment',
            full_script: enrichedProject.fullScript || '',
            data: enrichedProject,
            updated_at: nowIso,
          },
          { onConflict: 'id' }
        );
      } catch (e) {}
    }

    return res.json({ success: true, savedId: projectId, savedAt: nowIso, source: 'server_cloud_sync' });
  } catch (err: any) {
    console.error('Error saving project:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/projects', async (req, res) => {
  try {
    const id = req.query.id as string;
    if (!id) {
      return res.status(400).json({ error: 'Missing id query parameter' });
    }

    serverProjectsStore.delete(id);
    persistServerStore();

    if (supabase) {
      try {
        const uuidId = toValidUUID(id);
        await supabase.from('untold_projects').delete().eq('id', id);
        await supabase.from('shorts_projects').delete().eq('id', uuidId);
      } catch (e) {}
    }

    return res.json({ success: true, deletedId: id });
  } catch (err: any) {
    console.error('Error deleting project:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Integrate Vite dev server middleware or serve dist in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const portNum = Number(PORT) || 3500;
  app.listen(portNum, '0.0.0.0', () => {
    console.log(`AutoShorts (Untold) Server running on http://localhost:${portNum} (Network: http://192.168.110.102:${portNum})`);
  });
}

startServer();
