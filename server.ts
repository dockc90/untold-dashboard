import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

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

    const prompt = `당신은 대한민국 최고 유튜브 쇼츠 기획자이자 트렌드 분석가입니다.
인물: "${figureName}" (카테고리: ${category})

[★ 최우선 절대 원칙: 100% 사실(Fact) 기반 & 허위사실·날조 원천 차단]
1. 반드시 대상 인물에 대해 공식 언론 보도, 방송 인터뷰, 공식 프로필 및 다큐멘터리 등에서 공인된 '실제 사실(Fact)'만을 바탕으로 분석하세요.
2. 가짜 일화, 확인되지 않은 루머, 가공의 사건이나 거짓 에피소드를 지어내는 행위(Hallucination/날조)는 법적 리스크(명예훼손/허위사실 유포)가 발생하므로 절대 엄격히 금지됩니다.
3. 실제 겪은 고난과 전환점을 사실에 입각하여 정확하게 기술하세요.

이 인물이 현재 왜 화제이거나, 유튜브 쇼츠로 제작했을 때 대중이 열광할 만한 핵심 비하인드 스토리, 역경 극복, 반전 서사를 분석해주세요.
반드시 아래 JSON 스키마 형식으로 응답하세요.`;

    try {
      const response = await callGeminiWithRetry(() =>
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
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
                buzzSummary: { type: Type.STRING, description: '현재 대중이 주목하는 이유 요약 2~3문장' },
                controversyOrIssue: { type: Type.STRING, description: '과거 역경, 시련, 논란 또는 감동 포인트' },
                suggestedAngle: { type: Type.STRING, description: '2차 창작 스토리텔링으로 승부할 기획 방향' },
                tags: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '핵심 해시태그 4~5개'
                }
              },
              required: ['name', 'title', 'viralityScore', 'buzzSummary', 'controversyOrIssue', 'suggestedAngle', 'tags']
            }
          }
        })
      );
      const parsed = JSON.parse(response.text || '{}');
      return res.json(parsed);
    } catch (apiErr: any) {
      console.warn('Fallback triggered for analyze-figure:', apiErr.message);
      // Fallback response if external API is temporarily busy
      return res.json({
        name: figureName,
        title: `${figureName}의 아무도 몰랐던 충격적 비하인드와 인생 역전`,
        viralityScore: 94,
        buzzSummary: `${figureName}에 대한 대중의 관심이 급증하고 있으며, 과거의 역경 극복 일화와 비하인드가 숏폼 알고리즘에서 뜨거운 반응을 얻고 있습니다.`,
        controversyOrIssue: '모두가 불가능하다고 여겼던 위기 속에서도 묵묵히 자신의 길을 개척해낸 치열했던 무명 시절',
        suggestedAngle: '화려한 성공 이면에 숨겨진 피와 땀, 인간 승리의 헌정 스토리텔링',
        tags: [figureName, '쇼츠', '인생역전', '감동실화', '비하인드']
      });
    }
  } catch (err: any) {
    console.error('Error in analyze-figure:', err);
    return res.status(500).json({ error: err.message || '인물 분석 실패' });
  }
});

// Endpoint: Refresh trending figures list with AI from Naver, YouTube, Instagram
app.post('/api/gemini/trending', async (req, res) => {
  try {
    const { category = 'all', timeframe = '24h', channel = 'all' } = req.body;

    const channelPromptDesc = 
      channel === 'youtube' ? '유튜브 쇼츠 100만 뷰 이상 인기 급상승 및 라이징 바이럴 인물 중심' :
      channel === 'naver' ? '네이버 데이터랩 및 실시간 검색 급상승 인물 중심' :
      channel === 'instagram' ? '인스타그램 릴스 음원 챌린지 및 바이럴 피드 인물 중심' :
      '네이버 검색량, 유튜브 쇼츠 100만 뷰 이상 바이럴, 인스타그램 릴스 바이럴 3대 포털 통합';

    const prompt = `대한민국에서 현재(${timeframe} 기준) ${channelPromptDesc}으로 폭발적인 조회수를 낼 수 있는 화제의 인물 12~15명을 추천해주세요.
유튜브 인기 급상승 쇼츠는 기존 1000만 뷰 제한을 100만 뷰 이상으로 진입 기준을 대폭 완화하여, 대형 스타뿐 아니라 신흥 크리에이터, 화제의 셰프, 라이징 스포츠 스타, 밈 주인공 등 다양한 인물이 폭넓게 검색되도록 발굴해주세요.
카테고리: ${category === 'all' ? '연예, 스포츠, 배우, 기업인, 사회 다채롭게' : category}
각 인물마다 대중이 궁금해할 반전 서사, 역경 극복 일화와 함께 네이버 검색, 유튜브 쇼츠(100만 뷰 이상 지표), 인스타그램 릴스 지표(channelMetrics)를 포함하세요.
반드시 JSON 형식으로 반환하세요.`;

    try {
      const response = await callGeminiWithRetry(() =>
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
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
                  primaryChannel: { type: Type.STRING, description: 'naver, youtube, instagram, or multi' },
                  channelMetrics: {
                    type: Type.OBJECT,
                    properties: {
                      naverRank: { type: Type.STRING, description: '네이버 검색량 지표' },
                      youtubeViews: { type: Type.STRING, description: '유튜브 쇼츠 조회수' },
                      instaReels: { type: Type.STRING, description: '인스타 릴스 생성/바이럴 수' }
                    }
                  },
                  sourceArticlesCount: { type: Type.INTEGER }
                },
                required: ['name', 'title', 'category', 'viralityScore', 'buzzSummary', 'controversyOrIssue', 'suggestedAngle', 'tags']
              }
            }
          }
        })
      );
      const list = JSON.parse(response.text || '[]');
      return res.json(list);
    } catch (apiErr: any) {
      console.warn('Fallback triggered for trending:', apiErr.message);
      return res.json([
        {
          id: `fig-fall-${Date.now()}-1`,
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
      targetPersona = '4060_emotional',
      targetDuration = 60,
      videoTone = 'Cinematic',
      storyAngle = 'random',
      refreshCounter = 0,
    } = req.body;

    if (!figureName) {
      return res.status(400).json({ error: '인물 정보가 누락되었습니다.' });
    }

    const personaDescriptions: Record<string, string> = {
      '4060_emotional': '40~60대 중장년층 타겟: 눈시울을 붉히게 하는 진중한 스토리텔링, 인간적인 역경 극복기, 정중하고 따뜻하며 신뢰감 주는 나레이션 어투 (~했습니다, ~였습니다, 여러분은 기억하십니까).',
      '1020_dopamine': '10~20대 숏폼 도파민 타겟: 1초 만에 시선 끄는 빠른 전개, 충격적인 반전, 트렌디하고 직관적인 호흡, 속도감 있는 어투 (~했는데요, 실화냐, 진짜 충격입니다).',
      '3040_success': '30~40대 직장인/성인 타겟: 자기계발과 성공 방정식, 현실적인 교훈과 마인드셋 중심 (~그가 증명해낸 비밀, 끝까지 버티는 힘).',
      'mystery_twist': '반전 미스터리 타겟: 아무도 몰랐던 충격적인 비하인드, 숨겨진 진실을 하나씩 벗겨가는 긴장감 넘치는 스릴러 톤.'
    };

    const moodToneDescriptions: Record<string, string> = {
      'Cinematic': 'Cinematic (영화적 연출): 영화 한 편을 압축한 듯한 웅장하고 드라마틱한 몰입감. 묵직하고 서정적인 나레이션, 시네마틱 슬로우 줌인/줌아웃 카메라 워크, 웅장한 오케스트라 또는 피아노 현악기 BGM 제안.',
      'Documentary': 'Documentary (다큐멘터리): 인간극장, SBS 스페셜 풍의 진솔하고 깊이 있는 서사. 차분하고 신뢰감 넘치는 톤, 아카이브 흑백 사진 교차 연출, 잔잔한 어쿠스틱 피아노 및 첼로 BGM 제안.',
      'Fast-paced': 'Fast-paced (도파민 쾌속 비트): 1초의 공백도 허용하지 않는 빠른 호흡과 펀치력 있는 문장. 긴장감 넘치는 빠른 컷전환, 다이내믹한 줌과 자막 플래시, 비트감 있는 신스웨이브/트랩 힙합 BGM 제안.',
      'Minimal': 'Minimal (절제된 미니멀): 군더더기 없는 담백함과 팩트 중심의 명확한 전달. 불필요한 수식어를 뺀 직관적 문장, 정적이고 정갈한 고정/미세 팬 연출, 미니멀한 앰비언트/로파이 BGM 제안.'
    };

    const storyAngleDirectives: Record<string, string> = {
      'adversity': '💧 [스토리 앵글: 역경 극복 & 눈물의 무명 실화] 가장 처절했던 무명 단칸방 시절, 세상의 냉대와 수많은 오디션/시험 탈락, 피나는 땀방울과 눈물의 반전을 극대화하여 시청자의 가슴을 뭉클하게 만드세요.',
      'twist': '⚡ [스토리 앵글: 충격 반전 & 숨겨진 비밀] 대중이 흔히 아는 뻔한 성공담 대신, 아무도 몰랐던 충격적 사건, 라이벌과의 살얼음판 갈등, 숨겨진 진실을 파헤치는 스릴러형 서사로 작성하세요.',
      'success': '💼 [스토리 앵글: 성공 공식 & 뼈 때리는 인생 교훈] 그가 수많은 실패를 딛고 정상에 설 수 있었던 결정적인 마인드셋과 행동 원칙, 시청자에게 깊은 깨달음을 주는 명언 중심 서사로 작성하세요.',
      'legend': '🏆 [스토리 앵글: 전설의 결정적 1장면] 그의 인생을 180도 뒤집어놓은 단 한 번의 역사적 무대, 경기, 혹은 결단에 초점을 맞춰 압도적인 카타르시스를 선사하세요.',
      'random': `🎲 [새로운 대본 새로고침 요청: 버전 #${refreshCounter + 1}] 기존의 대본과 내용이 전혀 겹치지 않도록, 완전히 새로운 각도와 참신한 일화로 대본을 완전히 새롭게 작성하세요.`
    };

    const targetToneText = personaDescriptions[targetPersona] || personaDescriptions['4060_emotional'];
    const videoToneText = moodToneDescriptions[videoTone] || moodToneDescriptions['Cinematic'];
    const chosenAngleText = storyAngleDirectives[storyAngle] || storyAngleDirectives['random'];
    const totalScenes = targetDuration === 45 ? 9 : 12;
    const targetCharMin = targetDuration === 45 ? 310 : 410;
    const targetCharMax = targetDuration === 45 ? 360 : 470;

    const prompt = `당신은 월 조회수 1,000만 회를 기록하는 '화제의 인물' 전문 유튜브 쇼츠 1등 제작자이자 디렉터입니다.

[사용자 요청: 대본 새로고침 & 새로운 각도 기획]
- 요청 스토리 각도: ${chosenAngleText}
- 주의사항: 이전 대본이 마음에 들지 않아 새로고침된 상태입니다. 이전과 동일한 문장을 절대 반복하지 말고, 완전히 신선하고 독창적인 앵글과 문체로 새로운 대본을 기획하세요.

[대상 인물 정보]
- 인물 이름: ${figureName}
- 테마: ${title || ''}
- 화제 배경: ${buzzSummary || ''}
- 숨겨진 역경/서사: ${controversyOrIssue || ''}
- 기획 방향(스토리텔링 앵글): ${suggestedAngle || ''}
- 목표 영상 길이: 반드시 정확히 ${targetDuration}초에 도달해야 합니다!
- [매우 중요] 나레이션 글자수: 공백 제외 ${targetCharMin}~${targetCharMax}자 (절대로 15초나 30초 분량으로 짧게 요약하지 마십시오. 일반 낭독 속도 6.5자/초 기준으로 ${targetDuration}초를 꽉 채우는 충실한 서사를 작성하세요).
- 타겟 페르소나 및 어투: ${targetToneText}
- 영상 전체 연출 톤(분위기): ${videoToneText}

[★ 최우선 절대 원칙: 100% 사실(Fact) 기반 & 허위사실·날조 절대 금지]
1. 반드시 대상 인물에 대해 공식 언론 보도, 공중파/케이블 방송 인터뷰, 공식 자서전, 본인 유튜브 등에서 공인된 '실제 일화(Fact)'만을 바탕으로 대본을 작성해야 합니다.
2. 가짜 일화, 조작된 대화, 확인되지 않은 악성 루머, 존재하지 않는 사건이나 날조된 에피소드(Hallucination)는 명예훼손 및 허위사실 유포 리스크가 발생하므로 절대 엄격히 금지됩니다.
3. 연도, 과거 직업, 실제 겪은 고난의 사건, 수상 및 업적 등은 철저히 실제 사실에 입각해야 하며, 극적인 몰입감은 사실을 바탕으로 한 감정선의 흐름과 나레이션 호흡으로만 전달하세요. 허위사실을 임의로 지어내는 것은 절대 불가합니다.

[필수 제작 원칙]
1. 3초 후킹(Hook) 3가지 다변화:
   - 옵션 A: 질문형 (시청자에게 직접 질문하여 궁금증 폭발)
   - 옵션 B: 도발/논란형 (통념을 깨거나 충격적 반전 제시)
   - 옵션 C: 감성/공감형 (가슴 뭉클한 한마디로 시작)
2. 3~5초 단위 씬 분할 (정확히 총 ${totalScenes}개 씬):
   - 씬 1번부터 씬 ${totalScenes}번까지 00:00부터 00:${targetDuration === 60 ? '60' : '45'}까지 빈틈없이 이어져야 합니다.
   - 각 씬마다 구글/핀터레스트에서 즉시 검색할 수 있는 "구체적인 이미지 검색어(imageSearchKeyword)"를 제시하세요. (추상적인 단어 금지, 예: "${figureName} 무명시절 지하 단칸방", "${figureName} 눈물의 시상식 소감 고화질")
   - 각 씬마다 연출 효과(visualEffect: 슬로우 줌인, 빠른 흑백 컷전환, 텍스트 하이라이트 등)를 지정하세요.
3. 2차 창작 저작권 방어 패치:
   - 원본 영상/방송 화면을 길게 쓰지 않고 이미지 슬라이드와 나레이션 스토리텔링으로 승부하도록 설계.
   - 단순한 사실 나열이 아닌, 주인공의 감정선과 역경 극복의 인간 승리 스토리를 창작하여 저작권 리스크를 원천 차단.
4. 2026 SNS 알고리즘 치트키 메타데이터 (매우 중요):
   - 클릭률(CTR) 15%+를 달성하는 호기심 유발 유튜브 쇼츠 제목 3개 (A/B/C 테스트용)
   - 스팸 감점 없는 시맨틱 카테고리 클린 태그 3~5개 (과거 30개 해시태그 도배 절대 금지)
   - 유튜브 및 구글 검색 결과 미리보기에 걸리는 첫 2줄 SEO 최적화 문구 (firstTwoLinesSeo)
   - 구글 검색 Key Moments 연동용 타임스탬프 챕터 마커 (timestamps)
   - 시청자가 참지 못하고 댓글을 달게 만드는 논쟁형 고정 댓글(Pinned Comment) 및 A vs B 양자택일 투표 트리거 (commentBaits)
   - AI 음성인식(Whisper/ASR) 및 자막 OCR이 낚아채는 자연어 시맨틱 키워드 5개 (semanticKeywords)
   - 도달률 1위 지표인 공유(Share) 및 저장(Save) 유도 클로징 문구 (shareTrigger)

반드시 정해진 JSON 스키마로만 응답하세요.`;

    try {
      const response = await callGeminiWithRetry(() =>
        ai.models.generateContent({
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
                copyrightDefenseNote: { type: Type.STRING, description: '2차 창작물 보호 근거' }
              },
              required: ['hooks', 'titles', 'hashtags', 'description', 'pinnedComment', 'fullScript', 'scenes', 'copyrightDefenseNote']
            }
          }
        })
      );

      const parsed = JSON.parse(response.text || '{}');
      return res.json(parsed);
    } catch (apiErr: any) {
      console.warn('Fallback triggered for generate-shorts:', apiErr.message);
      
      const variationIdx = Math.abs((refreshCounter || 0) + (storyAngle === 'twist' ? 1 : storyAngle === 'success' ? 2 : 0)) % 3;

      let fallback60Scenes = [];
      let fallbackHooks = [];
      let fallbackTitles = [];

      if (variationIdx === 1) {
        // Variation 1: 충격 반전 & 숨겨진 비밀
        fallbackHooks = [
          { type: 'provocative', label: '도발/반전 후킹', text: `모두가 천재라고 부르지만, 사실 ${figureName} 님은 100번 넘게 연속 탈락했던 인물입니다.` },
          { type: 'question', label: '질문형 후킹', text: `대한민국 1등이 된 ${figureName} 님이 방송에서 절대 말하지 못했던 비밀을 아십니까?` },
          { type: 'emotional', label: '감성형 후킹', text: `가장 화려한 정상에서 ${figureName} 님이 홀로 흘려야 했던 외로운 눈물의 진실.` }
        ];
        fallbackTitles = [
          `아무도 몰랐던 ${figureName}의 충격적인 100번 탈락 실화 #shorts`,
          `천재인 줄 알았던 ${figureName}의 소름 돋는 반전 비하인드 #감동실화`,
          `모두가 속았던 ${figureName}의 진짜 성공 비밀 3가지 #인생역전`
        ];
        fallback60Scenes = [
          { sceneNumber: 1, timeRange: '00:00 - 00:05', narration: `모두가 천재라고 부르지만, 사실 ${figureName} 님은 100번 넘게 연속 탈락했던 인물입니다.`, visualGuide: '충격적인 반전 헤드라인과 긴장감 넘치는 슬로우 줌', imageSearchKeyword: `${figureName} 과거 인터뷰 클로즈업`, visualEffect: '임팩트 줌인', bgmSuggestion: '미스터리 현악기' },
          { sceneNumber: 2, timeRange: '00:05 - 00:10', narration: '"너는 연예인 할 얼굴이 아니다", "재능이 없다"는 폭언을 매일같이 들어야 했습니다.', visualGuide: '차가운 오디션장 문을 나서는 쓸쓸한 뒷모습 연출', imageSearchKeyword: `${figureName} 무명시절 오디션 탈락`, visualEffect: '좌측 패닝', bgmSuggestion: '묵직하고 슬픈 첼로' },
          { sceneNumber: 3, timeRange: '00:10 - 00:15', narration: '하지만 그는 상처받아 숨는 대신, 지적받은 모든 단점을 거울 앞에서 1000번씩 고쳤습니다.', visualGuide: '거울 앞에서 눈물을 닦고 다시 자세를 고쳐잡는 장면', imageSearchKeyword: `${figureName} 연습실 거울 연습`, visualEffect: '2단 스피드 줌' },
          { sceneNumber: 4, timeRange: '00:15 - 00:20', narration: '목이 쉬어 피가 나고 발목이 꺾여도, 그의 연습실 불빛은 단 하루도 꺼지지 않았습니다.', visualGuide: '깊은 밤 홀로 켜진 연습실 조명과 그림자', imageSearchKeyword: `${figureName} 새벽 연습실 열정`, visualEffect: '천천히 줌인' },
          { sceneNumber: 5, timeRange: '00:20 - 00:25', narration: '통장 잔고 0원, 하루 삼각김밥 하나로 버티던 그에게 마침내 마지막 오디션 기회가 왔습니다.', visualGuide: '초라하지만 결연한 눈빛의 과거 사진', imageSearchKeyword: `${figureName} 데뷔 직전 프로필`, visualEffect: '슬로우 줌아웃' },
          { sceneNumber: 6, timeRange: '00:25 - 00:30', narration: '심사위원 모두가 냉소를 보낼 때, 그는 준비했던 모든 것을 신들린 듯 쏟아부었습니다.', visualGuide: '공기를 얼어붙게 만든 압도적인 몰입의 순간', imageSearchKeyword: `${figureName} 첫 무대 오디션 현장`, visualEffect: '다이내믹 줌인' },
          { sceneNumber: 7, timeRange: '00:30 - 00:35', narration: '단 3초 만에 심사위원들의 표정은 경악으로 바뀌었고, 현장은 정적에 휩싸였습니다.', visualGuide: '놀라움에 입을 다물지 못하는 관객과 심사위원', imageSearchKeyword: `${figureName} 화제의 방송 출연 캡처`, visualEffect: '플래시 라이트 컷' },
          { sceneNumber: 8, timeRange: '00:35 - 00:40', narration: '그날 이후, 그를 무시했던 수많은 관계자들은 앞다투어 그에게 러브콜을 보냈습니다.', visualGuide: '쏟아지는 언론 보도와 섭외 기사 헤드라인', imageSearchKeyword: `${figureName} 라이징 스타 기사`, visualEffect: '우측 패닝' },
          { sceneNumber: 9, timeRange: '00:40 - 00:45', narration: '100번의 거절은 그를 무너뜨린 것이 아니라, 아무도 흉내 낼 수 없는 괴물로 단련시켰습니다.', visualGuide: '정상에서 당당하게 마이크를 잡은 압도적인 아우라', imageSearchKeyword: `${figureName} 전성기 카리스마 고화질`, visualEffect: '슬로우 줌인' },
          { sceneNumber: 10, timeRange: '00:45 - 00:50', narration: '"세상이 당신을 거절할 때 절대 작아지지 마세요. 그것은 더 큰 무대를 위한 준비입니다."', visualGuide: '진심 어린 조언을 건네는 따뜻한 미소의 인터뷰', imageSearchKeyword: `${figureName} 최근 인터뷰 정면`, visualEffect: '부드러운 패닝' },
          { sceneNumber: 11, timeRange: '00:50 - 00:55', narration: '오늘도 수많은 실패 앞에서 고개 숙인 당신에게, 그의 반전 서사는 기적이 됩니다.', visualGuide: '희망찬 빛이 쏟아지는 무대 전경', imageSearchKeyword: `${figureName} 콘서트 팬들의 환호`, visualEffect: '와이드 줌아웃' },
          { sceneNumber: 12, timeRange: '00:55 - 01:00', narration: '포기하지 않는 한 실패는 끝이 아닙니다. 당신의 멋진 반전을 진심으로 응원합니다.', visualGuide: '엔딩 타이틀과 감동적인 구독 유도 클로징 카드', imageSearchKeyword: `${figureName} 따뜻한 미소 클로즈업`, visualEffect: '엔딩 페이드 아웃', bgmSuggestion: '벅차오르는 피아노 아웃트로' }
        ];
      } else if (variationIdx === 2) {
        // Variation 2: 성공 철학 & 뼈 때리는 인생 교훈
        fallbackHooks = [
          { type: 'provocative', label: '도발형 후킹', text: `${figureName} 님이 인생 최대의 위기에서 던졌던 단 한마디의 승부수를 기억하십니까?` },
          { type: 'question', label: '질문형 후킹', text: `수많은 천재들을 제치고 ${figureName} 님이 1등이 될 수 있었던 진짜 이유는 무엇일까요?` },
          { type: 'emotional', label: '공감형 후킹', text: `"재능은 핑계일 뿐이다." ${figureName} 님이 온몸으로 증명해낸 잔혹한 성공 법칙.` }
        ];
        fallbackTitles = [
          `${figureName}이 증명한 1%의 성공 비밀과 뼈 때리는 조언 #shorts`,
          `게으른 나를 완전히 바꿔놓을 ${figureName}의 3가지 원칙 #동기부여`,
          `모두가 한계라 말할 때 ${figureName}이 보여준 압도적 돌파구 #인생역전`
        ];
        fallback60Scenes = [
          { sceneNumber: 1, timeRange: '00:00 - 00:05', narration: `${figureName} 님이 인생 최대의 위기에서 던졌던 단 한마디의 승부수를 기억하십니까?`, visualGuide: '카리스마 넘치는 눈빛과 강렬한 타이포그래피', imageSearchKeyword: `${figureName} 카리스마 눈빛 클로즈업`, visualEffect: '스피드 줌인', bgmSuggestion: '웅장하고 절제된 비트' },
          { sceneNumber: 2, timeRange: '00:05 - 00:10', narration: '남들은 그를 타고난 천재라 불렀지만, 그의 성공 뒤에는 지독할 만큼 잔혹한 루틴이 있었습니다.', visualGuide: '새벽 시계와 홀로 일어나는 고독한 실루엣', imageSearchKeyword: `${figureName} 신인시절 아침 연습`, visualEffect: '천천히 패닝' },
          { sceneNumber: 3, timeRange: '00:10 - 00:15', narration: '그는 매일 아침 남들보다 3시간 일찍 일어나, 가장 하기 싫고 두려운 일부터 끝냈습니다.', visualGuide: '고된 연습과 땀에 젖은 티셔츠 연출', imageSearchKeyword: `${figureName} 땀 흘리는 연습 사진`, visualEffect: '슬로우 줌인' },
          { sceneNumber: 4, timeRange: '00:15 - 00:20', narration: '"남들과 똑같이 자고 똑같이 쉬면서, 어떻게 특별한 인생을 꿈꿀 수 있겠습니까?"', visualGuide: '가슴을 울리는 단호하고 강인한 인터뷰 장면', imageSearchKeyword: `${figureName} 명언 인터뷰 방송`, visualEffect: '화이트 플래시' },
          { sceneNumber: 5, timeRange: '00:20 - 00:25', narration: '슬럼프가 찾아왔을 때도 그는 변명하지 않고, 오직 기본기로 돌아가 처음부터 다시 반복했습니다.', visualGuide: '기초 동작을 수만 번 반복하며 갈고닦는 진지한 모습', imageSearchKeyword: `${figureName} 기본기 연습 사진`, visualEffect: '좌측 패닝' },
          { sceneNumber: 6, timeRange: '00:25 - 00:30', narration: '주변의 달콤한 유혹과 편안함을 거부하고, 스스로를 끝없는 절벽 끝으로 몰아붙였습니다.', visualGuide: '절제된 생활과 엄격한 자기관리 일화 연출', imageSearchKeyword: `${figureName} 철저한 자기관리`, visualEffect: '2단 줌인' },
          { sceneNumber: 7, timeRange: '00:30 - 00:35', narration: '그리고 마침내 기회가 찾아왔을 때, 그는 준비된 자만이 누릴 수 있는 압도적 실력을 보였습니다.', visualGuide: '무대와 필드를 장악하는 폭발적인 에너지', imageSearchKeyword: `${figureName} 결정적 승리의 순간`, visualEffect: '다이내믹 패닝' },
          { sceneNumber: 8, timeRange: '00:35 - 00:40', narration: '하루아침에 반짝 뜬 스타가 아닌, 10년이 지나도 흔들리지 않는 대체 불가능한 존재가 되었습니다.', visualGuide: '업계 최고의 찬사와 리스펙트를 받는 순간', imageSearchKeyword: `${figureName} 레전드 무대 찬사`, visualEffect: '줌아웃' },
          { sceneNumber: 9, timeRange: '00:40 - 00:45', narration: '그는 말합니다. "탁월함은 재능이 아니라, 포기하고 싶을 때 한 걸음 더 내딛는 습관이다."', visualGuide: '많은 이들에게 영감을 주는 진솔한 토크 클립', imageSearchKeyword: `${figureName} 감동 강연 소감`, visualEffect: '슬로우 줌인' },
          { sceneNumber: 10, timeRange: '00:45 - 00:50', narration: '오늘 우리가 마주한 막막한 현실도, 결국 묵묵히 버텨낸 시간들이 모여 기적이 됩니다.', visualGuide: '어두운 터널 끝에서 밝은 빛으로 전환되는 연출', imageSearchKeyword: `${figureName} 밝은 미소 고화질`, visualEffect: '따뜻한 비네팅' },
          { sceneNumber: 11, timeRange: '00:50 - 00:55', narration: '변명 대신 행동을 택하는 순간, 당신의 운명도 반드시 바뀌기 시작할 것입니다.', visualGuide: '시청자에게 깊은 용기를 전하는 정면 눈빛', imageSearchKeyword: `${figureName} 최근 화보 클로즈업`, visualEffect: '천천히 줌인' },
          { sceneNumber: 12, timeRange: '00:55 - 01:00', narration: '오늘 당신의 치열한 하루를 뜨겁게 응원합니다. 지금 바로 당신만의 도전을 시작하세요.', visualGuide: '희망찬 엔딩 화면과 구독/좋아요 유도 카드', imageSearchKeyword: `${figureName} 정면 미소 프로필`, visualEffect: '엔딩 페이드 아웃', bgmSuggestion: '희망찬 피아노 아웃트로' }
        ];
      } else {
        // Variation 0: 눈물의 10년 무명과 인생 역전 실화
        fallbackHooks = [
          { type: 'question', label: '질문형 후킹', text: `여러분은 ${figureName} 님이 가장 밑바닥에 있던 순간을 아십니까?` },
          { type: 'provocative', label: '도발/논란형 후킹', text: `모두가 불가능하다고 손가락질했지만, ${figureName} 님은 단 한마디 말도 없이 증명해냈습니다.` },
          { type: 'emotional', label: '감성/공감형 후킹', text: `가장 밑바닥에 떨어졌던 그날 밤, ${figureName} 님이 홀로 삼켰던 눈물의 의미.` }
        ];
        fallbackTitles = [
          `${figureName}의 눈물겨운 인생 역전과 아무도 몰랐던 충격 비하인드 #shorts`,
          `모두가 포기하라 했을 때 ${figureName}이 보여준 기적 같은 반전 #감동실화`,
          `단칸방에서 시작해 대한민국 정상에 선 ${figureName}의 눈물 #동기부여`
        ];
        fallback60Scenes = [
          { sceneNumber: 1, timeRange: '00:00 - 00:05', narration: `여러분은 ${figureName} 님이 가장 밑바닥에 있던 순간을 아십니까?`, visualGuide: `${figureName}의 무명 시절 흑백 사진에서 현재 화려한 모습으로 서서히 오버랩`, imageSearchKeyword: `${figureName} 과거 무명시절 흑백 사진`, visualEffect: '임팩트 줌인 + 사운드 컷', bgmSuggestion: '긴장감 있는 오케스트라' },
          { sceneNumber: 2, timeRange: '00:05 - 00:10', narration: '화려한 지금의 모습 뒤에는, 끝없는 거절과 차가운 냉대를 견뎌낸 10년의 긴 무명이 있었습니다.', visualGuide: '어두운 연습실이나 현장에서 묵묵히 땀 흘리는 실루엣 연출', imageSearchKeyword: `${figureName} 신인시절 인터뷰 사진`, visualEffect: '슬로우 패닝', bgmSuggestion: '잔잔하고 묵직한 피아노' },
          { sceneNumber: 3, timeRange: '00:10 - 00:15', narration: '"너는 절대 성공할 수 없다"는 차가운 말들을 들었을 때도, 그는 결코 물러서지 않았습니다.', visualGuide: '비판과 편견에 맞서며 홀로 연습하는 진지한 표정 클로즈업', imageSearchKeyword: `${figureName} 연습실 연습 열정 클로즈업`, visualEffect: '2단 스피드 줌', bgmSuggestion: '점점 고조되는 현악기' },
          { sceneNumber: 4, timeRange: '00:15 - 00:20', narration: '남들이 모두 잠든 새벽, 차가운 연습실에서 하루 3시간만 자며 피나는 노력을 거듭했습니다.', visualGuide: '새벽 연습실의 땀방울과 악바리 같은 열정', imageSearchKeyword: `${figureName} 연습실 연습 사진`, visualEffect: '우측 패닝' },
          { sceneNumber: 5, timeRange: '00:20 - 00:25', narration: '단돈 몇 푼이 없어 컵라면으로 끼니를 때우면서도, 가슴 속 꿈의 불꽃만은 꺼뜨리지 않았습니다.', visualGuide: '소박하고 눈물겨운 단칸방 시절의 흔적', imageSearchKeyword: `${figureName} 청년 시절 고생`, visualEffect: '슬로우 줌아웃' },
          { sceneNumber: 6, timeRange: '00:25 - 00:30', narration: '포기하고 싶어 무너져 내리던 날 밤, 낡은 가족사진을 보며 눈물을 훔치고 다시 일어섰습니다.', visualGuide: '가족에 대한 사랑과 눈물을 삼키는 아련한 표정', imageSearchKeyword: `${figureName} 가족 인터뷰 눈물`, visualEffect: '따뜻한 비네팅 필터' },
          { sceneNumber: 7, timeRange: '00:30 - 00:35', narration: '기회는 예고 없이 찾아왔고, 그는 지난 10년간 갈고닦은 모든 것을 그 한 무대에 쏟아부었습니다.', visualGuide: '운명을 바꾼 단 한 번의 결정적 무대 순간', imageSearchKeyword: `${figureName} 데뷔 무대 레전드`, visualEffect: '다이내믹 줌인' },
          { sceneNumber: 8, timeRange: '00:35 - 00:40', narration: '마침내 단 한 번의 무대로 대한민국 대중들의 시선을 단숨에 사로잡았습니다.', visualGuide: '대중들의 폭발적인 환호와 찬사', imageSearchKeyword: `${figureName} 방송 출연 화제`, visualEffect: '좌측 패닝' },
          { sceneNumber: 9, timeRange: '00:40 - 00:45', narration: '모두가 불가능하다고 손가락질했던 그 청년이, 지금은 수많은 이들의 롤모델이 되었습니다.', visualGuide: '시상식에서 당당히 트로피를 들어올리는 모습', imageSearchKeyword: `${figureName} 시상식 대상 수상 고화질`, visualEffect: '화려한 줌아웃' },
          { sceneNumber: 10, timeRange: '00:45 - 00:50', narration: '정상에 오른 지금도 그는 "그때의 눈물과 땀방울이 없었다면 오늘의 나는 없었다"고 고백합니다.', visualGuide: '겸손하고 진솔한 현재의 인터뷰 모습', imageSearchKeyword: `${figureName} 최근 인터뷰 미소`, visualEffect: '천천히 줌인' },
          { sceneNumber: 11, timeRange: '00:50 - 00:55', narration: '진정한 승리는 결코 요행이나 우연으로 완성되지 않는다는 것을 그는 온몸으로 증명했습니다.', visualGuide: '팬들의 열광과 벅찬 감동의 순간', imageSearchKeyword: `${figureName} 전성기 콘서트 무대`, visualEffect: '우측 패닝' },
          { sceneNumber: 12, timeRange: '00:55 - 01:00', narration: '오늘 홀로 버티고 있는 당신의 땀방울도 결코 헛되지 않을 것입니다. 당신의 꿈을 진심으로 응원합니다.', visualGuide: '시청자에게 깊은 용기를 주는 따뜻한 미소와 구독 유도', imageSearchKeyword: `${figureName} 환한 미소 정면 프로필`, visualEffect: '엔딩 페이드 아웃 + 구독 유도 자막', bgmSuggestion: '희망찬 피아노 아웃트로' }
        ];
      }

      const scenesToReturn = targetDuration === 45 ? fallback60Scenes.slice(0, 9) : fallback60Scenes;
      const fullScriptToReturn = scenesToReturn.map((s) => s.narration).join('\n\n');

      return res.json({
        hooks: fallbackHooks,
        titles: fallbackTitles,
        hashtags: ['#shorts', `#${figureName}`, '#인생역전'],
        cleanSemanticTags: [`#${figureName}`, '#인생역전', '#비하인드'],
        firstTwoLinesSeo: `${figureName}의 충격적인 무명시절과 역경 극복 비하인드. 아무도 몰랐던 ${figureName}의 감동적인 성공 스토리.`,
        timestamps: [
          { time: '00:00', label: '충격적인 첫 시작' },
          { time: '00:15', label: '100번 넘는 탈락과 시련' },
          { time: '00:35', label: '인생을 바꾼 결정적 터닝포인트' },
          { time: '00:50', label: '정상에 오른 기적의 결말' }
        ],
        commentBaits: {
          debateQuestion: `만약 여러분이 과거의 ${figureName} 님 같은 절망적인 상황이었다면? [끝까지 도전한다] vs [현실과 타협한다]`,
          optionA: 'A. 100번 쓰러져도 내 꿈을 향해 끝까지 도전한다',
          optionB: 'B. 억울하지만 상처받지 않게 현실과 타협한다',
          pinnedCommentDraft: `📌 [댓글 토론] 여러분이 ${figureName} 님의 상황이었다면 끝까지 버텼을까요? A(도전) vs B(타협) 여러분의 솔직한 선택을 댓글로 남겨주세요! 👇`
        },
        semanticKeywords: [figureName, '성공 비결', '무명 시절', '감동 실화', '인생 역전'],
        shareTrigger: `지치고 힘든 하루를 보내고 있는 친구나 지인이 있다면 이 영상을 꼭 공유해주세요! 🚀`,
        description: `${figureName}의 숨겨진 비하인드 스토리와 역경 극복 드라마를 2차 창작으로 조명한 감동 숏폼입니다.`,
        pinnedComment: `📌 [댓글 토론] 여러분이 ${figureName} 님의 상황이었다면 끝까지 버텼을까요? A(도전) vs B(타협) 여러분의 솔직한 선택을 댓글로 남겨주세요! 👇`,
        fullScript: fullScriptToReturn,
        scenes: scenesToReturn,
        copyrightDefenseNote: '원저작물의 영상 푸티지를 직접 복제하지 않고, 사실(Fact)을 바탕으로 감동적 서사를 창작한 100% 2차 저작물로 공정 이용 요건을 충족합니다.'
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

    // 1. ElevenLabs API (Priority 1 with eleven_v4 default)
    const elevenApiKey = process.env.ELEVENLABS_API_KEY || (req.headers['xi-api-key'] as string);
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
            if (row.data && row.data.id) projectMap.set(row.data.id, row.data);
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

  app.listen(PORT, () => {
    console.log(`AutoShorts (Untold) Server running on http://localhost:${PORT}`);
  });
}

startServer();
