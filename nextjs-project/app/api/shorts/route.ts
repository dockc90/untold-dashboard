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
타겟 어투: ${targetPersona === '4060_emotional' ? '40~60대 감동 극복 스토리텔링' : '10~20대 숏폼 도파민'}
반드시 JSON 형식으로 응답하세요.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
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
