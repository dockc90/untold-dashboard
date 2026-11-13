import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

const ai = new GoogleGenAI({
  apiKey: apiKey || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export async function POST(request: Request) {
  let body: any = {};
  try {
    body = await request.json();
  } catch (e) {
    body = {};
  }

  const { figureName = '화제의 인물', category = 'entertainment' } = body;

  const fallback = {
    name: figureName,
    title: `${figureName}의 아무도 몰랐던 긍정 미담과 통 큰 결단 스토리`,
    viralityScore: 95,
    trendingReason: `${figureName}의 공식 어록, 최근 행보 및 긍정 미담이 쇼츠·검색에서 급상승 중`,
    relatedFigures:
      category === 'economy'
        ? ['이재용 삼성전자 회장', '젠슨 황 (Jensen Huang)']
        : category === 'sports'
        ? ['손흥민', '이강인']
        : category === 'actor'
        ? ['변우석', '마동석']
        : category === 'global'
        ? ['일론 머스크', '오타니 쇼헤이']
        : ['유재석', '백종원'],
    buzzSummary: `${figureName}의 공식 활동 이력과 소탈한 반전 에피소드가 숏폼·검색에서 급상승하며 화제 인물로 주목받고 있습니다.`,
    controversyOrIssue: '위기 속에서도 원칙과 사람을 지켜낸 통 큰 결단과 인간미',
    suggestedAngle: '홍보팀 관점의 긍정 미담, 소탈한 반전 매력, 통 큰 결단 스토리텔링',
    hookLine: `대중이 미처 몰랐던 ${figureName}의 진짜 한 장면, 숫자가 증명합니다`,
    tags: [figureName, '쇼츠', '미담', '리더십', '반전매력']
  };

  if (!apiKey) {
    return NextResponse.json(fallback);
  }

  const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
  const prompt = `당신은 대한민국 최고 기업인·화제 인물 전문 쇼츠 기획자입니다.
오늘 날짜: ${todayStr}
인물: "${figureName}" (카테고리: ${category})

[★ 최우선 절대 원칙: 홍보팀 마인드 긍정 서사 & 실시간 팩트]
1. Google Search 도구로 대상 인물의 가장 최신 뉴스·주가/실적·어록·방한·미담 등 공인된 '실제 사실(Fact)'을 검색해 분석하세요.
2. 비난·악인전·미검증 루머는 초상권 고소 위험이 있으므로 제외하고, 긍정적 미담·위기 극복·소박한 인간미·통 큰 결단에 집중하세요.
3. 카테고리를 불문하고 모든 인물에게 trendingReason("왜 지금 화제인지: 주가 급등, 어록, 방한, 화제작, 신기록 등" 1줄)과 relatedFigures("같이 올리면 동반 떡상하는 파생 인물 2~3명" 배열, 예: 젠슨 황 -> 이재용·깐부치킨 대표)를 반드시 추천하세요.
4. hookLine에는 출생연도 나열 대신 충격적 숫자나 반전 질문으로 첫 0~3초에 꽂는 오프닝 훅 1줄(20~38자)을 작성하세요.
5. 반드시 아래 JSON 객체 형식으로만 응답하세요(코드펜스·부연 설명 금지):
{
  "name": "인물명",
  "title": "지금 왜 화제인지(미담/반전 포인트) 한 줄 헤드라인",
  "viralityScore": 95,
  "trendingReason": "최근 화제가 된 이유(주가 급등, 어록, 방한 등)",
  "relatedFigures": ["동반 떡상 파생 인물1", "동반 떡상 파생 인물2"],
  "buzzSummary": "왜 지금 주목받는지 날짜·숫자 기반 팩트 1~2문장",
  "controversyOrIssue": "핵심 위기 극복 포인트, 소탈한 인간미 또는 통 큰 결단",
  "suggestedAngle": "홍보팀 마인드 긍정 서사 기획 방향",
  "hookLine": "첫 3초 오프닝 훅 1줄",
  "tags": ["태그1", "태그2", "태그3", "태그4"]
}`;

  const extractJsonObj = (raw: string) => {
    const cleaned = String(raw || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    const s = cleaned.indexOf('{');
    const e = cleaned.lastIndexOf('}');
    return JSON.parse(s >= 0 && e > s ? cleaned.slice(s, e + 1) : cleaned);
  };

  const candidateModels = ['gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-2.5-flash'];
  for (const mod of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model: mod,
        contents: prompt,
        config: {
          temperature: 0.3,
          tools: [{ googleSearch: {} }],
        },
      });

      const parsed = extractJsonObj(response.text || '{}');
      if (parsed.name && parsed.title) {
        return NextResponse.json({ ...parsed, isLive: true });
      }
    } catch (err: any) {
      console.warn(`Gemini analyze-figure with search (${mod}) failed:`, err.message);
      try {
        const response = await ai.models.generateContent({
          model: mod,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.35,
          },
        });
        const parsed = extractJsonObj(response.text || '{}');
        if (parsed.name && parsed.title) {
          return NextResponse.json({ ...parsed, isLive: true });
        }
      } catch (err2: any) {
        console.warn(`Gemini analyze-figure fallback (${mod}) failed:`, err2.message);
      }
    }
  }

  return NextResponse.json(fallback);
}
