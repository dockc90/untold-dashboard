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
    title: `${figureName}의 아무도 몰랐던 충격적 비하인드와 인생 역전`,
    viralityScore: 95,
    buzzSummary: `${figureName}의 공식 활동 이력과 반전 에피소드가 숏폼·검색에서 다시 급상승하며 48시간 화제 인물로 주목받고 있습니다.`,
    controversyOrIssue: '모두가 불가능하다고 여겼던 위기 속에서도 묵묵히 자신의 길을 개척해낸 치열했던 무명 시절',
    suggestedAngle: '화려한 성공 이면에 숨겨진 피와 땀, 인간 승리의 헌정 스토리텔링',
    hookLine: `대중이 미처 몰랐던 ${figureName}의 결정적 한 장면, 진짜 시작은 여기였습니다`,
    tags: [figureName, '쇼츠', '인생역전', '감동실화', '비하인드']
  };

  if (!apiKey) {
    return NextResponse.json(fallback);
  }

  const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
  const prompt = `당신은 대한민국 최고 유튜브 쇼츠 기획자이자 실시간 트렌드 분석가입니다.
오늘 날짜: ${todayStr}
인물: "${figureName}" (카테고리: ${category})

[★ 최우선 절대 원칙: Google Search 실시간 팩트 기반 & 허위사실·날조 차단]
1. 반드시 Google Search 도구로 대상 인물의 가장 최신 뉴스·사건·공식 보도와 공인된 '실제 사실(Fact)'을 검색해 분석하세요.
2. 가짜 일화, 확인되지 않은 루머, 가공의 사건을 지어내는 행위는 절대 엄격히 금지됩니다.
3. buzzSummary에는 "왜 지금 주목받는지 + 확인된 날짜·연도·숫자" 팩트를 구체적으로 담고, hookLine에는 첫 3초 스크롤을 멈추는 오프닝 훅 1줄(30~45자 내외)을 작성하세요.
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
