import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { figureName, title, targetPersona = '4060_emotional', targetDuration = 60 } = body;

    if (!figureName) {
      return NextResponse.json({ error: '인물 이름이 필요합니다.' }, { status: 400 });
    }

    const prompt = `대한민국 최고 유튜브 쇼츠 기획자로서 인물 "${figureName}" (${title || ''})의 화제성과 역경 서사를 다룬 60초 쇼츠 대본과 3초 단위 씬별 에셋 가이드를 작성하세요.

[★ 최우선 절대 원칙: 100% 사실(Fact) 기반 & 허위사실·날조 원천 차단]
1. 반드시 대상 인물에 대해 공식 언론 보도, 방송 인터뷰, 공식 프로필 및 다큐멘터리 등에서 검증된 '실제 일화(Fact)'만을 바탕으로 대본을 작성해야 합니다.
2. 가짜 일화, 조작된 대화, 확인되지 않은 루머, 없는 사건을 지어내는 행위(Hallucination/날조)는 법적 리스크(명예훼손/허위사실 유포)가 발생하므로 절대 금지됩니다.
3. 연도, 과거 직업, 실제 겪은 고난의 과정은 철저히 팩트에 기반해야 하며, 허위사실을 섞는 것은 절대 불가합니다.

타겟 어투: ${targetPersona === '4060_emotional' ? '40~60대 감동 극복 스토리텔링' : '10~20대 숏폼 도파민'}
반드시 JSON 형식으로 응답하세요.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
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
                  type: { type: Type.STRING },
                  label: { type: Type.STRING },
                  text: { type: Type.STRING },
                },
                required: ['type', 'label', 'text'],
              },
            },
            titles: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            hashtags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            pinnedComment: { type: Type.STRING },
            fullScript: { type: Type.STRING },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sceneNumber: { type: Type.INTEGER },
                  timeRange: { type: Type.STRING },
                  narration: { type: Type.STRING },
                  visualGuide: { type: Type.STRING },
                  imageSearchKeyword: { type: Type.STRING },
                  visualEffect: { type: Type.STRING },
                },
                required: ['sceneNumber', 'timeRange', 'narration', 'visualGuide', 'imageSearchKeyword', 'visualEffect'],
              },
            },
            copyrightDefenseNote: { type: Type.STRING },
          },
          required: ['hooks', 'titles', 'hashtags', 'pinnedComment', 'fullScript', 'scenes', 'copyrightDefenseNote'],
        },
      },
    });

    const data = JSON.parse(response.text || '{}');
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error generating shorts in Next.js:', error);
    return NextResponse.json({ error: error.message || '쇼츠 생성 실패' }, { status: 500 });
  }
}
