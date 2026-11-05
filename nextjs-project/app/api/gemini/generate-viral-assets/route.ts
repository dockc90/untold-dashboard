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

  const { topic = '화제의 인물', category = 'general', targetAudience = '2040 남녀', tone = '충격과 반전의 흥미진진한 톤' } = body;

  const fallback = {
    topic,
    viralityStrategySummary: '호기심 극대화 3단 구조 + DM 공유 유발 + 시맨틱 클린 태그로 알고리즘 피드 점유',
    carousel: {
      title: `${topic}의 숨겨진 비하인드`,
      slides: [
        {
          slideNumber: 1,
          type: 'cover',
          mainHook: `당신이 몰랐던 ${topic}의 실체`,
          subDetail: '가장 화려한 성공 이면에 숨겨진 충격적인 반전',
          visualGuide: '시선 강탈 흑백 인물 클로즈업 사진 + 옐로우 볼드 자막',
          imageSearchKeyword: `${topic} 고화질 프로필 사진`,
          badgeText: '단독 비하인드'
        },
        {
          slideNumber: 2,
          type: 'hook',
          mainHook: '처음부터 천재였던 것은 아닙니다',
          subDetail: '모두가 외면했던 10년의 긴 무명 시절과 단칸방의 눈물',
          visualGuide: '어두운 연습실에서 흘린 땀방울 아카이브 사진',
          imageSearchKeyword: `${topic} 과거 무명 시절`,
          badgeText: 'POINT 01'
        },
        {
          slideNumber: 3,
          type: 'insight',
          mainHook: '100번의 거절이 그를 괴물로 만들었다',
          subDetail: '주변의 만류와 냉소 속에서도 단 하루도 연습을 멈추지 않았던 집념',
          visualGuide: '거울 앞에서 자세를 다잡는 결연한 실루엣',
          imageSearchKeyword: `${topic} 열정 연습 사진`,
          badgeText: 'POINT 02'
        },
        {
          slideNumber: 4,
          type: 'body',
          mainHook: '단 한 번의 기회에 모든 것을 걸다',
          subDetail: '마침내 찾아온 결정적 무대에서 증명해낸 압도적 실력',
          visualGuide: '대중을 사로잡은 레전드 데뷔 방송 장면',
          imageSearchKeyword: `${topic} 레전드 무대 방송`,
          badgeText: 'POINT 03'
        },
        {
          slideNumber: 5,
          type: 'cta',
          mainHook: '포기하지 않는 자에게 기적은 찾아옵니다',
          subDetail: '오늘 당신의 고된 하루도 결국 눈부신 반전이 될 것입니다.',
          visualGuide: '밝은 미소의 현재 모습 + 저장 및 공유 유도 그래픽',
          imageSearchKeyword: `${topic} 최근 밝은 미소 화보`,
          badgeText: '오늘의 교훈'
        }
      ]
    },
    thumbnails: [
      {
        conceptName: '🔥 극강 호기심 자극형',
        mainText: '이것 몰랐죠?',
        subText: `${topic} 충격적인 실체`,
        badgeText: '단독 최초',
        visualComposition: '얼굴 극단적 클로즈업 + 눈동자 하이라이트 + 붉은색 의문부호(?) 스티커',
        colorScheme: { bg: '#0f172a', text: '#ffffff', accent: '#ef4444' },
        ctrRationale: '인간의 손실회피 및 미완성 효과(Zeigarnik Effect)를 극대화하여 0.5초 만에 클릭 유도'
      },
      {
        conceptName: '⚡ 반전 대비형',
        mainText: '모두 속았습니다',
        subText: '진짜 이유는 따로 있었다',
        badgeText: '팩트체크',
        visualComposition: '좌우 흑백 vs 풀컬러 명암 대비 + 노란색 굵은 고딕 볼드 폰트',
        colorScheme: { bg: '#18181b', text: '#facc15', accent: '#3b82f6' },
        ctrRationale: '기존 통념을 뒤엎는 헤드라인으로 쇼츠 피드 스크롤을 즉각 정지시킴'
      },
      {
        conceptName: '💎 감동 & 인생역전형',
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
        bodyText: `다들 겉으로 드러난 부분만 보고 넘어가지만,\n파고들수록 상상도 못 했던 결정적 반전이 숨어있었습니다.\n\n✔️ 첫 번째: 아무도 주목하지 않았던 무명 시절의 시련\n✔️ 두 번째: 위기의 순간에 던진 단 한 번의 승부수\n✔️ 세 번째: 끝내 판을 뒤집어버린 치열한 실행력\n\n여러분이 보셨을 때 가장 인상 깊었던 포인트는 무엇인가요?`,
        bulletSummary: [
          '모두가 실패라고 단정 지었던 순간의 충격적인 반전',
          '10년간 숨겨져 있던 결정적 성장 트리거와 실행력',
          '지금 우리 삶에 바로 적용할 수 있는 단 1가지 인사이트'
        ],
        saveShareTrigger: '📌 3초 만에 잊어버리기 전에 왼쪽 아래 [저장] 누르고, 이 사실 모르는 친구에게 [공유]해서 알려주세요!',
        cleanSemanticTags: [topic, `${topic}비하인드`, '인생역전', '동기부여', '트렌드'],
        callToAction: '👉 지금 저장해두고 영감이 필요할 때마다 꺼내보세요!\n💬 여러분의 솔직한 생각을 댓글로 들려주세요.',
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
          { time: '00:50', label: '우리가 얻어야 할 인사이트' }
        ],
        pinnedComment: `📌 [오늘의 질문] 여러분이 ${topic} 님 상황이었다면 끝까지 버텼을까요? 솔직한 생각을 댓글로 남겨주세요! 👇`,
        semanticKeywords: [topic, '비하인드', '충격 진실', '인생역전', '성공비결'],
        tags: [topic, `${topic} 쇼츠`, '화제의인물', '인생역전', '동기부여']
      },
      naver: {
        blogTitleCandidates: [
          `${topic} 충격적인 무명 시절과 성공 비결 3가지 총정리`,
          `${topic}이 10년의 시련을 딛고 대세가 된 진짜 이유`,
          `[단독] ${topic}의 숨겨진 일화와 프로필 비하인드 팩트체크`
        ],
        metaDescription: `${topic}의 숨겨진 인생 역전 스토리와 비하인드를 심층 팩트체크했습니다.`,
        sectionHeadings: ['1. 아무도 몰랐던 시작', '2. 위기를 기회로 바꾼 승부수', '3. 우리에게 남긴 교훈'],
        threeLineSummary: [
          `${topic}의 감동적인 무명 극복 실화`,
          '끝까지 포기하지 않은 집념이 낳은 기적',
          '시청자들의 뜨거운 찬사를 받는 이유'
        ]
      }
    },
    viralTriggers: {
      shareAndSaveKit: {
        dmShareScript: `이거 보고 소름 돋았어... 너도 ${topic} 좋아하지? 이 비하인드 꼭 봐봐 ㄷㄷ`,
        saveHookText: '📌 나중에 다시 보며 동기부여 얻으려고 저장해둠 (필독)',
        cleanSemanticTags: [topic, '인생역전', '동기부여', '비하인드', '성공학']
      },
      commentBaits: [
        {
          baitTitle: '🔥 호불호 갈리는 양자택일 난상토론',
          debateQuestion: `솔직히 ${topic}의 성공은 '압도적인 재능' vs '처절한 노력', 둘 중 무엇일까요?`,
          optionA: '1번: 타고난 재능이 80% 이상이다',
          optionB: '2번: 포기하지 않은 노력이 전부다',
          pinnedCommentDraft: `💬 [오늘의 밸런스 게임] 솔직히 1번 재능 vs 2번 꺾이지 않는 마음, 여러분의 선택은?`
        }
      ],
      semanticSeo: {
        voiceKeywords: [topic, '비하인드', '충격 진실', '인생역전', '성공비결'],
        searchQueries: [`${topic} 과거`, `${topic} 근황`, `${topic} 쇼츠`, `${topic} 명언`],
        sampleTimestamps: ['00:00 오프닝', '00:15 시련', '00:35 반전', '00:50 결론']
      }
    },
    hashtagIntelligence: {
      instagram: {
        mega: [`#${topic}`, '#이슈', '#트렌드', '#유튜브', '#릴스'],
        mid: ['#화제의인물', '#인생역전', '#동기부여', '#자기계발', '#인사이트'],
        niche: [`#${topic}비하인드`, `#${topic}근황`, '#쇼츠크리에이터', '#떡상비결']
      },
      youtube: [topic, `${topic} 근황`, `${topic} 쇼츠`, '화제의인물', '실시간이슈'],
      naver: [topic, `${topic} 비하인드`, `${topic} 총정리`, `${topic} 반응`]
    }
  };

  if (!apiKey) {
    return NextResponse.json(fallback);
  }

  const prompt = `당신은 2026년 SNS 바이럴 콘텐츠 디렉터입니다.
주제/인물: "${topic}" (카테고리: "${category}", 타겟: "${targetAudience}", 톤: "${tone}")
반드시 100% 공인된 실제 사실(Fact)을 기반으로 바이럴 카드뉴스, 썸네일, 카피라이팅 패키지를 작성하세요.
반드시 JSON 형식으로 응답하세요.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.35,
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    if (parsed.carousel && parsed.carousel.slides) {
      return NextResponse.json(parsed);
    }
  } catch (err: any) {
    console.warn('Gemini generate-viral-assets failed, using fallback:', err.message);
  }

  return NextResponse.json(fallback);
}
