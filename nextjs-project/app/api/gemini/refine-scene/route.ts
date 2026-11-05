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

  const { figureName = '인물', currentNarration = '', instruction = '' } = body;

  const fallback = {
    narration: currentNarration || '치열한 노력 끝에 마침내 그는 기적을 만들어냈습니다.',
    imageSearchKeyword: `${figureName} 인터뷰 고화질`
  };

  if (!apiKey) {
    return NextResponse.json(fallback);
  }

  const prompt = `인물: ${figureName}
현재 씬 나레이션: "${currentNarration}"
수정 요청: "${instruction || '더 자극적이고 극적인 표현으로 다듬어줘'}"
결과를 오직 JSON { "narration": "수정된 문장", "imageSearchKeyword": "추천 이미지 검색어" } 형식으로만 답하세요.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.35,
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
    if (parsed.narration) {
      return NextResponse.json(parsed);
    }
  } catch (err: any) {
    console.warn('Gemini refine-scene failed, using fallback:', err.message);
  }

  return NextResponse.json(fallback);
}
