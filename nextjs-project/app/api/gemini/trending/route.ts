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

  const { timeframe = '24h', refresh = false, category = 'all', channel = 'all' } = body;

  const fallbackList = [
    {
      id: `fig-fall-${Date.now()}-1`,
      name: '젠슨 황 (Jensen Huang)',
      title: '식당 설거지 소년에서 4,000조 엔비디아 황제가 된 가죽자켓의 신화',
      category: 'economy',
      viralityScore: 100,
      timeframe,
      buzzSummary: '전 세계 시가총액 1위 등극! 10대 시절 화장실 청소와 접시 닦기로 시작해 30년간 버텨낸 끝에 AI 혁명을 지배한 가죽자켓 CEO의 전설적 실화',
      controversyOrIssue: '창업 초기 3번의 부도 위기와 30세 청년 시절의 무모한 도전, "더 많이 살수록 더 많이 번다"는 역발상 승부수',
      suggestedAngle: '시련은 나를 더 단단하게 만든다, 매일 실패할 각오로 일하는 60대 억만장자의 뼈 때리는 조언',
      tags: ['젠슨황', '엔비디아', 'AI혁명', '가죽자켓', '시총1위', '인생역전', 'H100'],
      primaryChannel: 'youtube',
      channelMetrics: {
        naverRank: '네이버 글로벌 인물 1위 (+650%)',
        youtubeViews: '유튜브 쇼츠 누적 8,900만 뷰',
        instaReels: '글로벌 릴스 바이럴 75만 개'
      }
    },
    {
      id: `fig-fall-${Date.now()}-2`,
      name: '일론 머스크 (Elon Musk)',
      title: '전 재산 털어 로켓 3번 폭발시키고 기적을 쏜 미치광이 천재',
      category: 'global',
      viralityScore: 99,
      timeframe,
      buzzSummary: '스페이스X 우주선 발사대 젓가락 포획 성공과 테슬라 로보택시, xAI 슈퍼컴퓨터로 전 세계 숏폼 알고리즘을 독식 중인 혁신의 아이콘',
      controversyOrIssue: '2008년 크리스마스 이브 파산 직전까지 몰렸던 극한의 공포와 주변의 조롱을 극복한 집념',
      suggestedAngle: '모두가 미쳤다고 비웃었지만 결국 인류의 미래를 바꾼 불굴의 멘탈',
      tags: ['일론머스크', '테슬라', '스페이스X', 'xAI', '로보택시', '도전정신'],
      primaryChannel: 'youtube',
      channelMetrics: {
        naverRank: '네이버 경제/해외 1위',
        youtubeViews: '유튜브 쇼츠 9,500만 뷰',
        instaReels: '인스타 릴스 90만 개'
      }
    },
    {
      id: `fig-fall-${Date.now()}-3`,
      name: '안성재 셰프',
      title: '이라크 파병 정비병에서 대한민국 유일 미슐랭 3스타가 된 기적',
      category: 'entertainment',
      viralityScore: 98,
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
      name: '변우석',
      title: '오디션 100번 탈락을 딛고 10년 만에 맞이한 기적',
      category: 'actor',
      viralityScore: 96,
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
      id: `fig-fall-${Date.now()}-6`,
      name: '손흥민',
      title: '아시아 최초 득점왕 뒤에 숨겨진 아버지의 10년 맹훈련',
      category: 'sports',
      viralityScore: 97,
      timeframe,
      buzzSummary: '세계 최고 리그에서 증명한 월드클래스 실력과 겸손함, 손웅정 감독의 혹독한 기본기 훈련 일화',
      controversyOrIssue: '매일 볼 리프팅 4시간, 눈에 실핏줄이 터질 때까지 기본기만 반복했던 유년기',
      suggestedAngle: '천재가 아니라 피와땀으로 완성된 영웅의 눈물겨운 여정',
      tags: ['손흥민', '토트넘', '손웅정', '기본기', '국위선양'],
      primaryChannel: 'youtube',
      channelMetrics: {
        naverRank: '네이버 해외축구 1위',
        youtubeViews: '유튜브 하이라이트 3,200만 뷰',
        instaReels: '릴스 챌린지 21만 개'
      }
    }
  ];

  if (!apiKey) {
    return NextResponse.json(fallbackList);
  }

  const categoryInstruction = 
    category === 'economy'
      ? '반드시 젠슨 황(엔비디아 CEO, 전 세계 시가총액 1위 신화), 일론 머스크, 샘 알트만, 워런 버핏 등 글로벌 테크/경제 거물과 국내외 혁신 기업인을 최우선 포함하세요.'
      : category === 'global'
      ? '반드시 젠슨 황(엔비디아), 일론 머스크(테슬라/xAI), 로제(아파트 신드롬), 페이커 등 글로벌 무대에서 압도적 조회수를 올리고 있는 세계적 인물을 포함하세요.'
      : category === 'entertainment'
      ? '안성재 셰프, 로제, GD(지드래곤), 카리나 등 현재 유튜브·릴스에서 폭발적 관심을 받는 연예·대중문화 핫 인물을 추천하세요.'
      : category === 'sports'
      ? '손흥민, 페이커, 이강인, 김민재 등 역경을 딛고 세계 정상에 오른 스포츠 영웅을 추천하세요.'
      : '현재 전 세계와 대한민국 숏폼(유튜브 쇼츠, 릴스, 틱톡)에서 가장 도파민과 조회수가 폭발적인 인물들을 추천하세요. 특히 전 세계 시총 1위 AI 황제 젠슨 황(엔비디아)과 일론 머스크 등 글로벌 테크 신화 인물을 반드시 상위권에 포함하고, 셰프·가수·배우·스포츠 영웅 등 다채로운 감동 실화 인물을 조합하세요.';

  const prompt = `당신은 대한민국 최고 유튜브 쇼츠 & 인스타 릴스 바이럴 트렌드 레이더입니다.
현재 (${timeframe}) 네이버 실시간 검색, 유튜브 급상승 쇼츠, 인스타그램 릴스에서 가장 폭발적으로 조회수를 견인하는 최신 화제의 인물 6명을 추천하세요.

[★ 트렌드 선별 알고리즘 및 가중치 원칙]
1. ${categoryInstruction}
2. 숏폼 리텐션 최우선: 단순 인지도가 아니라, "밑바닥에서 정상까지의 극적인 인생 역전(Underdog)", "3초 만에 스크롤을 멈추게 하는 충격 반전"이 있는 인물에게 viralityScore(90~100점)를 최우선 부여하세요.
3. 100% 사실(Fact) 기반: 공인된 실제 인터뷰, 보도, 일화만을 다루고 절대 허위사실을 창작하지 마세요.
4. 채널(${channel}) 및 시간대(${timeframe})의 반응 지표(channelMetrics)를 현실감 있게 작성하세요.
반드시 아래 JSON 스키마 형식의 배열로 응답하세요.`;

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
      console.warn(`Gemini trending fetch (${mod}) failed:`, err.message);
    }
  }

  return NextResponse.json(fallbackList);
}
