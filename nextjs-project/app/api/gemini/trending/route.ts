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

  const { timeframe = '24h', refresh = false } = body;

  const fallbackList = [
    {
      id: `fig-fall-${Date.now()}-1`,
      name: '안성재 셰프',
      title: '이라크 파병 정비병에서 대한민국 유일 미슐랭 3스타가 된 기적',
      category: 'entertainment',
      viralityScore: 99,
      timeframe,
      buzzSummary: '흑백요리사 신드롬의 주인공, 미군 정비병 전역 후 자동차 정비공을 꿈꾸다 요리에 빠져든 반전 실화',
      controversyOrIssue: '어려웠던 이민 생활과 혹독한 주방 밑바닥에서 피눈물 흘리며 버텨낸 15년의 치열한 집념',
      suggestedAngle: '이라크 전장의 총 대신 주방 칼을 잡고 세계 최정상에 오른 기적의 인간 승리',
      tags: ['안성재', '흑백요리사', '미슐랭3스타', '모수', '감동실화'],
      primaryChannel: 'youtube',
      channelMetrics: {
        naverRank: '네이버 인물 검색 1위',
        youtubeViews: '유튜브 하이라이트 2,800만 뷰',
        instaReels: '인스타 릴스 25만 개'
      }
    },
    {
      id: `fig-fall-${Date.now()}-2`,
      name: '변우석',
      title: '오디션 100번 탈락을 딛고 10년 만에 맞이한 기적',
      category: 'actor',
      viralityScore: 97,
      timeframe,
      buzzSummary: '선재 신드롬 이전 10년의 긴 무명 생활과 폭언을 견뎌내며 버틴 눈물의 감동 실화',
      controversyOrIssue: '배우 하지 말라는 주변의 만류 속에서도 단역을 전전하며 끝까지 포기하지 않은 집념',
      suggestedAngle: '포기하고 싶을 때 거울을 보며 버틴 10년의 인내와 폭풍 눈물',
      tags: ['변우석', '선재업고튀어', '무명10년', '인생역전', '감동실화'],
      primaryChannel: 'naver',
      channelMetrics: {
        naverRank: '네이버 인물 검색 2위 (+380%)',
        youtubeViews: '유튜브 쇼츠 2,100만 뷰',
        instaReels: '인스타 릴스 14만 개'
      }
    },
    {
      id: `fig-fall-${Date.now()}-3`,
      name: '손흥민',
      title: '아시아 최초 득점왕 뒤에 숨겨진 아버지의 10년 맹훈련',
      category: 'sports',
      viralityScore: 98,
      timeframe,
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
      id: `fig-fall-${Date.now()}-4`,
      name: '로제',
      title: '술자리 게임 하나로 전 세계 차트를 올킬한 천재성',
      category: 'global',
      viralityScore: 99,
      timeframe,
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
      id: `fig-fall-${Date.now()}-5`,
      name: '페이커 (이상혁)',
      title: '11년째 세계 최정상에서 군림하는 신의 손목',
      category: 'sports',
      viralityScore: 99,
      timeframe,
      buzzSummary: '롤드컵 5회 우승의 전무후무한 역사, 손목 부상과 슬럼프를 극복한 리더십',
      controversyOrIssue: '손목이 마비되는 고통 속에서도 동료들을 믿고 다시 정상에 선 헌신',
      suggestedAngle: '연봉 수백억 유혹을 뿌리치고 한국에 남아 역사를 쓴 e스포츠의 살아있는 신화',
      tags: ['페이커', 'T1', '롤드컵', '대상혁', '월즈5회우승'],
      primaryChannel: 'youtube',
      channelMetrics: {
        naverRank: '네이버 e스포츠 1위',
        youtubeViews: '유튜브 롤드컵 클립 1,500만 뷰',
        instaReels: '인스타 밈 18만 개'
      }
    },
    {
      id: `fig-fall-${Date.now()}-6`,
      name: '침착맨 (이말년)',
      title: 'B급 만화가에서 대한민국 1등 방송국이 된 썰 풀기의 신',
      category: 'entertainment',
      viralityScore: 93,
      timeframe,
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
  ];

  if (!apiKey) {
    return NextResponse.json(fallbackList);
  }

  const prompt = `당신은 대한민국 최고 숏폼 바이럴 트렌드 레이더입니다.
현재 (${timeframe}) 네이버 실시간 검색, 유튜브 급상승 쇼츠, 인스타그램 릴스에서 가장 폭발적으로 회자되는 인물 6명을 추천하세요.
반드시 공인된 실제 사실(Fact)을 기반으로 작성해야 합니다.
반드시 아래 JSON 스키마 형식의 배열로 응답하세요.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.35,
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              title: { type: Type.STRING },
              category: { type: Type.STRING },
              viralityScore: { type: Type.INTEGER },
              timeframe: { type: Type.STRING },
              buzzSummary: { type: Type.STRING },
              controversyOrIssue: { type: Type.STRING },
              suggestedAngle: { type: Type.STRING },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              primaryChannel: { type: Type.STRING },
              channelMetrics: {
                type: Type.OBJECT,
                properties: {
                  naverRank: { type: Type.STRING },
                  youtubeViews: { type: Type.STRING },
                  instaReels: { type: Type.STRING }
                }
              },
              sourceArticlesCount: { type: Type.INTEGER }
            },
            required: ['name', 'title', 'category', 'viralityScore', 'buzzSummary', 'controversyOrIssue', 'suggestedAngle', 'tags']
          }
        }
      }
    });

    const parsed = JSON.parse(response.text || '[]');
    if (Array.isArray(parsed) && parsed.length > 0) {
      return NextResponse.json(parsed);
    }
  } catch (err: any) {
    console.warn('Gemini trending fetch failed, using fallback:', err.message);
  }

  return NextResponse.json(fallbackList);
}
