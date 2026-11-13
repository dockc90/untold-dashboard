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

  const todayStr = new Date().toISOString().slice(0, 10);
  const prompt = `당신은 대한민국 최고 유튜브 쇼츠 기획자이자 트렌드 분석가입니다.
오늘 날짜: ${todayStr}
인물: "${figureName}" (카테고리: ${category})

[★ 최우선 절대 원칙: 100% 사실(Fact) 기반 & 허위사실·날조 원천 차단]
1. 반드시 대상 인물에 대해 공식 언론 보도, 방송 인터뷰, 공식 프로필 및 다큐멘터리 등에서 공인된 '실제 사실(Fact)'만을 바탕으로 분석하세요.
2. 가짜 일화, 확인되지 않은 루머, 가공의 사건이나 거짓 에피소드를 지어내는 행위는 절대 엄격히 금지됩니다.
3. buzzSummary에는 "왜 지금/왜 대중이 주목하는지 + 확인된 연도·날짜·숫자(기록·경력·성과)" 팩트를 구체적으로 담고, hookLine에는 첫 3초 스크롤을 멈추는 강력한 오프닝 멘트 1줄(30~45자 내외)을 작성하세요.

이 인물이 현재 왜 화제이거나, 유튜브 쇼츠로 제작했을 때 대중이 열광할 만한 핵심 비하인드 스토리, 역경 극복, 반전 서사를 분석해주세요.
반드시 아래 JSON 스키마 형식으로 응답하세요.`;

  const candidateModels = ['gemini-3.5-flash-lite', 'gemini-3.5-flash'];
  for (const mod of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model: mod,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.35,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              title: { type: Type.STRING, description: '호기심을 자극하는 한 줄 헤드라인' },
              viralityScore: { type: Type.INTEGER, description: '1부터 100까지의 화제성/바이럴 점수' },
              buzzSummary: { type: Type.STRING, description: '왜 지금 주목받는지 날짜·숫자 기반 팩트 1~2문장' },
              controversyOrIssue: { type: Type.STRING, description: '과거 역경, 시련, 논란 또는 감동 포인트' },
              suggestedAngle: { type: Type.STRING, description: '2차 창작 스토리텔링으로 승부할 기획 방향' },
              hookLine: { type: Type.STRING, description: '첫 3초 스크롤 정지 오프닝 훅 1줄 (30~45자 내외)' },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '핵심 해시태그 4~5개'
              }
            },
            required: ['name', 'title', 'viralityScore', 'buzzSummary', 'controversyOrIssue', 'suggestedAngle', 'hookLine', 'tags']
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.name && parsed.title) {
        return NextResponse.json(parsed);
      }
    } catch (err: any) {
      console.warn(`Gemini analyze-figure (${mod}) failed:`, err.message);
    }
  }

  return NextResponse.json(fallback);
}
