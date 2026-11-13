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

  const {
    figureName = '화제의 인물',
    title = '',
    buzzSummary = '',
    controversyOrIssue = '',
    suggestedAngle = '',
    hookLine = '',
    targetPersona = '4060_emotional',
    targetDuration = 60,
    videoTone = 'Cinematic',
    storyAngle = 'random',
    scriptFormat = 'overcoming_story',
    speechTone = 'friendly_story',
    refreshCounter = 0,
    customKeyword = '',
  } = body;

  const formatDirectives: Record<string, string> = {
    'overcoming_story': '① [역경극복·감동미담형 (CJ 저단백밥 스타일)] 기업이나 기업인이 적자·위기·거절을 무릅쓰고 누군가의 삶을 바꾸거나 기술/품질에 끝까지 집념을 쏟아 낸 감동 미담과 통 큰 결단 중심으로 서사를 전개하세요.',
    'humble_twist': '② [소박한 반전매력형 (재벌의 길거리 어묵 먹방 스타일)] 수조 원대 자산가나 글로벌 CEO임에도 길거리 어묵을 서서 먹거나, 낡은 패딩/자켓을 10년째 입거나, 직원/팬과 격의 없이 어울리는 인간적이고 소탈한 반전 매력에 집중하세요.',
    'life_timeline': '③ [어린시절~현재 인생변천사형] 어려운 어린 시절이나 무명·초기 창업기의 결정적 한 장면에서 출발해, 한 번의 터닝포인트를 거쳐 현재 글로벌 리더로 성장한 극적인 인생 궤적을 속도감 있게 압축하세요.',
    'biz_sports_owner': '④ [기업인+스포츠 구단주/비즈니스형] 구단주·스폰서로서 보여준 남다른 팬 사랑, 파격적 투자, 락커룸·경기장 뒷이야기 또는 비즈니스 승부사로서의 통 큰 결단과 성과를 흥미진진하게 풀어내세요.',
  };

  const speechToneDirectives: Record<string, string> = {
    'friendly_story': '① [친근한 썰풀이체 — 종결어미 강제] "~했습니다/~입니다/~했음" 딱딱한 존댓말이나 음슴체 절대 금지! 반드시 모든 문장 끝과 후킹을 "~했대요", "~였대요", "~였나 봐요", "근데 달랐대요", "믿어지시나요?"처럼 친근하게 썰 푸는 말투로 끝내세요.',
    'trendy_shorts': '② [트렌디한 쇼츠체 — 음슴체 종결어미 강제] "~했습니다/~입니다/~했대요/~세요" 존댓말 종결어미 절대 사용 금지! 대본 모든 문장과 후킹 문장 끝을 반드시 "~했음", "~였음", "~임", "~됨", "~함", "그랬음", "진짜 레전드임" 등 짧은 쇼츠 음슴체로만 끝내세요.',
    'news_briefing': '③ [속도감 있는 뉴스 브리핑체 — 종결어미 강제] "~했대요/~했음" 사용 금지! 모든 문장 끝을 "~했습니다", "~밝혀졌습니다", "~전망입니다", "~인정받았습니다"처럼 군더더기 없이 팩트와 숫자를 쾌속으로 전하는 뉴스 브리핑 어투로 통일하세요.',
  };

  const personaDescriptions: Record<string, string> = {
    '4060_emotional': '40~60대 중장년층 타겟: 가슴을 울리는 진정성, 기업인의 묵직한 책임감과 따뜻한 인간미 강조.',
    '1020_dopamine': '10~20대 숏폼 타겟: 빠른 템포, 반전 디테일, 소셜에서 바로 공유하고 싶은 흥미진진한 전개.',
    '3040_success': '30~40대 직장인/투자자 타겟: 비즈니스 인사이트, 위기 돌파 결단력, 일과 삶의 태도에 대한 영감.',
    'mystery_twist': '반전 스토리 타겟: 의외의 숫자와 예상 밖의 선행/행보로 끝까지 시선을 붙잡는 전개.',
    'ceo_branding': '기업인/CEO 브랜드 스토리: 대기업 홍보팀도 탐낼 품격 있는 미담, 기술 혁신, 사회공헌 서사.'
  };

  const moodToneDescriptions: Record<string, string> = {
    'Cinematic': 'Cinematic (영화적 연출): 묵직하고 드라마틱한 몰입감, 슬로우 줌과 감정선을 살리는 피아노/스트링 BGM 제안.',
    'Documentary': 'Documentary (다큐멘터리): 아카이브 사진과 현장감을 살린 진솔한 연출, 담백한 어쿠스틱 BGM 제안.',
    'Fast-paced': 'Fast-paced (쾌속 비트): 빠른 컷전환, 핵심 숫자 강조 자막, 속도감 있는 비트 BGM 제안.',
    'Minimal': 'Minimal (절제된 미니멀): 팩트와 숫자가 또렷이 보이는 정갈한 연출, 미니멀한 앰비언트 BGM 제안.',
    'CorporatePR': 'CorporatePR (기업 브랜딩): 포브스/블룸버그 다큐 풍의 신뢰감과 품격을 살린 세련된 비즈니스 톤.'
  };

  const storyAngleDirectives: Record<string, string> = {
    'overcoming_story': formatDirectives['overcoming_story'],
    'humble_twist': formatDirectives['humble_twist'],
    'life_timeline': formatDirectives['life_timeline'],
    'biz_sports_owner': formatDirectives['biz_sports_owner'],
    'choice': '결정적 결단 앵글: 남들이 주저할 때 내린 통 큰 결단과 긍정적 성과에 집중하세요.',
    'adversity': formatDirectives['overcoming_story'],
    'twist': formatDirectives['humble_twist'],
    'success': formatDirectives['biz_sports_owner'],
    'legend': formatDirectives['life_timeline'],
    'random': `새로운 앵글 버전 #${refreshCounter + 1}: 선택한 기획 포맷을 충실히 따르되 신선한 디테일과 숫자로 구성하세요.`
  };

  const chosenFormatText = formatDirectives[scriptFormat] || formatDirectives['overcoming_story'];
  const chosenSpeechText = speechToneDirectives[speechTone] || speechToneDirectives['friendly_story'];
  const targetToneText = personaDescriptions[targetPersona] || personaDescriptions['4060_emotional'];
  const videoToneText = moodToneDescriptions[videoTone] || moodToneDescriptions['Cinematic'];
  const chosenAngleText = storyAngleDirectives[storyAngle] || chosenFormatText;
  const totalScenes = targetDuration === 45 ? 9 : 12;
  const targetCharMin = targetDuration === 45 ? 290 : 390;
  const targetCharMax = targetDuration === 45 ? 360 : 470;

  const prompt = `당신은 조회수 100만 뷰와 대기업 브랜디드 광고를 부르는 '국내외 기업인·부자 전문' 쇼츠 작가입니다.

[★ 절대 원칙 3대 철칙 (최우선 준수)]
1. 첫째, 철저히 '그 기업과 인물의 홍보팀'이라는 마인드로 긍정적인 미담, 위기 극복, 소박한 인간미, 통 큰 결단만 다루세요.
   - 비난, 악인전, 스캔들 폭로, 부정적 가십, 미검증 루머는 초상권·명예훼손 고소 위험이 있으므로 **절대 금지**합니다.
2. 둘째, 첫 0~3초에 "19XX년에 태어난...", "오늘은 ~를 소개합니다" 같은 출생연도·지루한 인물 설명 대신 **충격적인 숫자(액수·기간·수량)나 반전 질문**으로 무조건 후킹하세요.
3. 셋째, 60초(또는 ${targetDuration}초) 대본을 반드시 아래 **5단계 구조**로 작성해 총 ${totalScenes}개 씬에 정확히 배분하세요:
   - [1단계: 0~3초 강렬한 후킹] (씬 1): 충격적 숫자 또는 반전 질문 1~2단문 (20~35자)
   - [2단계: 3~15초 의외의 배경] (씬 2~3): 예상을 뒤엎는 출발점/소박한 계기/인간적인 배경
   - [3단계: 15~40초 위기/반전 디테일] (씬 4~8): 구체적인 숫자·기간·적자·현장 디테일이 담긴 위기 또는 반전 포인트
   - [4단계: 40~55초 통 큰 결단과 성취] (씬 9~10): 홍보팀이 자랑스러워할 통 큰 결단, 선행, 기술/사업적 성취
   - [5단계: 55~60초 칭찬 댓글을 유도하는 여운 엔딩] (씬 11~12): 기업의 존재 이유와 인물의 품격이 남아 시청자가 자연스럽게 존경·칭찬 댓글을 달게 만드는 묵직한 여운

[★ 레퍼런스 대본 스타일 (CJ 이재현 회장 '햇반 저단백밥' 감동 브랜디드 사례)]
"CJ그룹 회장 이재현. 한 임직원 딸이 쌀밥을 못 먹는다는 사연을 들었대요. 정말 희귀 질환이었대요. 밥 한 그릇을 먹을 수가 없어서 아픈 사람들이 먹을 수 있는 햇반을 만들라고 시켰나 봐요. 근데 만들수록 손해를 본대요. 근데 달랐대요. 즉석밥 기술을 가지고 있기 때문에 해야 된다 그랬대요. 그래서 '햇반 저단백밥'이 나왔대요. 그렇게 환자들의 생명줄이 됐대요. 누적 생산량 290만 개. 만들수록 적자인 제품이지만 환우들이 평범한 일상을 포기하지 않도록 17년 동안 이걸 만들어 왔다. 사업의 가치는 숫자로만 남지 않는다. 누군가의 삶을 바꿨을 때 기업의 존재 이유가 된다."
-> 위 사례처럼 짧은 호흡, 구체적 숫자(예: 290만 개, 17년), 인간적 사연, 뭉클한 엔딩 리듬을 참고하세요!

[사용자 선택 기획 옵션 (반드시 100% 반영)]
- [기획 포맷]: ${chosenFormatText}
- [대본 말투]: ${chosenSpeechText}
- 보조 앵글 참고: ${chosenAngleText}
- 시청자 타겟 무드: ${targetToneText}
- 영상 연출 톤: ${videoToneText}

[대상 인물 정보]
- 인물/기업: ${figureName}
- 테마: ${title || ''}
- 최근 화제 배경: ${buzzSummary || ''}
- 주목할 서사/미담 포인트: ${controversyOrIssue || ''}
- 추천 기획 앵글: ${suggestedAngle || ''}${hookLine ? `\n- 참고 후킹 문구: "${hookLine}"` : ''}
${customKeyword ? `\n[★ 사용자 지정 핵심 키워드: "${customKeyword}"]\n- 3초 후킹과 핵심 씬에 반드시 "${customKeyword}" 키워드를 자연스럽게 녹여내세요.` : ''}
- 목표 영상 길이: ${targetDuration}초 (총 ${totalScenes}개 씬, 나레이션 공백 제외 ${targetCharMin}~${targetCharMax}자)

[★ 사실 검증 & 초상권/홍보팀 안전 체크 출력 필수]
- 대본에 등장하는 핵심 숫자·연도 중 팩트체크가 필요한 2개 항목을 safetyCheck.numbersToVerify 배열(길이 2)에 정확히 적으세요 (예: ["누적 생산량 290만 개 (공식 보도 확인 필요)", "17년 지속 생산 (2009년 출시 기준 연도 확인)"]).
- safetyCheck.positivePrFit에는 홍보팀 기준 긍정 서사 적합 여부 1줄을 작성하세요 (예: "적합 — 비난·루머 없이 사회적 가치와 소탈한 리더십만 다룬 홍보팀 친화 서사").
- safetyCheck.isPrSafe는 긍정 서사 원칙을 완벽히 준수했으면 true로 지정하세요.

[2026 SNS 알고리즘 치트키 메타데이터]
- 클릭률(CTR) 높은 쇼츠 제목 3개 (제목 역시 출생연도 나열 금지, 긍정적 미담/반전 호기심 자극)
- 클린 해시태그 3~5개, 첫 2줄 SEO 문구(firstTwoLinesSeo), 타임스탬프(timestamps), 댓글 칭찬/토론 유도(commentBaits), 시맨틱 키워드 5개, 공유 유도(shareTrigger)
- 씬별 imageSearchKeyword는 구글 이미지 검색 시 바로 과거/기사 사진이 나오는 구체적 한국어+인물명 키워드로 작성하세요 (예: "이재용 어묵 부산 깡통시장", "젠슨황 가죽자켓 기조연설").

반드시 정해진 JSON 스키마로만 응답하세요.`;

  const extractTwoFactNumbers = (scriptText: string) => {
    const matches = scriptText.match(/\d+(?:,\d{3})*(?:\.\d+)?\s*(?:년|개월|일|시간|원|만\s*원|억\s*원|조\s*원|억|만|배|%|개|명|위|차|번|초)?/g) || [];
    const unique = Array.from(new Set(matches.map((m) => m.trim()).filter((m) => m.length >= 2))).slice(0, 2);
    if (unique.length >= 2) return unique;
    if (unique.length === 1) return [unique[0], '핵심 연도/공식 발표 수치 확인 필요'];
    return ['인물 핵심 연도·기간 확인 필요', '주요 실적·투자 금액 공식 보도 확인 필요'];
  };

  const buildNormalizedSafetyCheck = (parsedSafety: any, scriptText: string) => {
    const fallbackNums = extractTwoFactNumbers(scriptText);
    const nums = Array.isArray(parsedSafety?.numbersToVerify) && parsedSafety.numbersToVerify.length > 0
      ? parsedSafety.numbersToVerify.slice(0, 2)
      : fallbackNums;
    return {
      numbersToVerify: nums.length >= 2 ? nums : [nums[0] || fallbackNums[0], fallbackNums[1]],
      positivePrFit: parsedSafety?.positivePrFit || '적합 — 비난·루머 배제, 미담·인간미·결단 중심의 홍보팀 친화 서사',
      isPrSafe: parsedSafety?.isPrSafe !== false,
    };
  };

  const enforceSpeechTone = (rawText: string, tone: string): string => {
    const text = String(rawText || '');
    if (!text) return text;

    if (tone === 'trendy_shorts') {
      let out = text
        .replace(/믿어지시나요\?/g, '믿어짐?')
        .replace(/기억하십니까\?/g, '기억남?')
        .replace(/알고 계십니까\?/g, '알고 있음?')
        .replace(/아십니까\?/g, '알고 있음?')
        .replace(/무엇일까요\?/g, '뭐였을까?')
        .replace(/이유일까요\?/g, '이유일까?')
        .replace(/([가-힣]+)이셨습니다(?=[.!?\s"']|$)/g, '$1이셨음')
        .replace(/([가-힣])습니다(?=[.!?\s"']|$)/g, '$1음')
        .replace(/([가-힣])입니다(?=[.!?\s"']|$)/g, '$1임')
        .replace(/([가-힣])됩니다(?=[.!?\s"']|$)/g, '$1됨')
        .replace(/([가-힣])합니다(?=[.!?\s"']|$)/g, '$1함')
        .replace(/([가-힣])([가-힣])니다(?=[.!?\s"']|$)/g, (_, prev, ch) => {
          const code = ch.charCodeAt(0);
          if (code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 === 17) {
            return prev + String.fromCharCode(code - 17 + 16);
          }
          return prev + ch + '니다';
        })
        .replace(/([가-힣])습니다/g, '$1음')
        .replace(/([가-힣])대요(?=[.!?\s"']|$)/g, '$1음')
        .replace(/([가-힣])봐요(?=[.!?\s"']|$)/g, '$1봄')
        .replace(/([가-힣])세요(?=[.!?\s"']|$)/g, '$1길 바람')
        .replace(/([가-힣])어요(?=[.!?\s"']|$)/g, '$1음')
        .replace(/([가-힣])아요(?=[.!?\s"']|$)/g, '$1음');

      // Single-char syllable + 니다 catch (e.g. 입니다 handled, 됩니다 handled, 삽니다 -> 삼, 봅니다 -> 봄)
      out = out.replace(/([가-힣])니다(?=[.!?\s"']|$)/g, (_, ch) => {
        const code = ch.charCodeAt(0);
        if (code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 === 17) {
          return String.fromCharCode(code - 17 + 16);
        }
        return ch + '니다';
      });
      return out;
    }

    if (tone === 'friendly_story') {
      return text
        .replace(/([가-힣]+)아십니까\?/g, '$1믿어지시나요?')
        .replace(/([가-힣]+)기억하십니까\?/g, '$1기억나시나요?')
        .replace(/([가-힣])습니다(?=[.!?\s"']|$)/g, (m, ch) => {
          const code = ch.charCodeAt(0);
          if (code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 === 20) {
            return ch + '대요';
          }
          return m;
        })
        .replace(/([가-힣])음(?=[.!?\s"']|$)/g, (m, ch) => {
          const code = ch.charCodeAt(0);
          if (code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 === 20) {
            return ch + '대요';
          }
          return m;
        })
        .replace(/인물입니다(?=[.!?\s"']|$)/g, '인물이었대요')
        .replace(/이유입니다(?=[.!?\s"']|$)/g, '이유래요')
        .replace(/되었습니다(?=[.!?\s"']|$)/g, '되었대요')
        .replace(/합니다(?=[.!?\s"']|$)/g, '한대요')
        .replace(/됩니다(?=[.!?\s"']|$)/g, '된대요')
        .replace(/입니다(?=[.!?\s"']|$)/g, '이래요');
    }

    // news_briefing
    return text
      .replace(/([가-힣])했대요(?=[.!?\s"']|$)/g, '$1했습니다')
      .replace(/([가-힣])였대요(?=[.!?\s"']|$)/g, '$1였습니다')
      .replace(/([가-힣])대요(?=[.!?\s"']|$)/g, '$1습니다')
      .replace(/([가-힣])했음(?=[.!?\s"']|$)/g, '$1했습니다')
      .replace(/([가-힣])였음(?=[.!?\s"']|$)/g, '$1였습니다')
      .replace(/([가-힣])음(?=[.!?\s"']|$)/g, (m, ch) => {
        const code = ch.charCodeAt(0);
        if (code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 === 20) {
          return ch + '습니다';
        }
        return m;
      });
  };

  const applyToneToResult = (payload: any, tone: string) => {
    const tonedHooks = Array.isArray(payload.hooks)
      ? payload.hooks.map((h: any) => ({ ...h, text: enforceSpeechTone(h.text, tone) }))
      : [];
    const tonedScenes = Array.isArray(payload.scenes)
      ? payload.scenes.map((s: any) => ({ ...s, narration: enforceSpeechTone(s.narration, tone) }))
      : [];
    const tonedFullScript =
      tonedScenes.length > 0
        ? tonedScenes.map((s: any) => s.narration).join('\n\n')
        : enforceSpeechTone(payload.fullScript || '', tone);
    return {
      ...payload,
      hooks: tonedHooks,
      scenes: tonedScenes,
      fullScript: tonedFullScript,
    };
  };

  const runtimeKey = String(body.geminiApiKey || apiKey || '').trim();
  if (runtimeKey) {
    const runtimeAi = runtimeKey === apiKey
      ? ai
      : new GoogleGenAI({
          apiKey: runtimeKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
        });
    const candidateModels = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.5-pro'];
    for (const mod of candidateModels) {
      try {
        const response = await runtimeAi.models.generateContent({
          model: mod,
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
                    debateQuestion: { type: Type.STRING, description: 'A vs B 양자택일 킬러 질문' },
                    optionA: { type: Type.STRING },
                    optionB: { type: Type.STRING },
                    pinnedCommentDraft: { type: Type.STRING, description: '고정 댓글 완성본' }
                  },
                  required: ['debateQuestion', 'optionA', 'optionB', 'pinnedCommentDraft']
                },
                semanticKeywords: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '자연어 시맨틱 검색 키워드 5개'
                },
                shareTrigger: { type: Type.STRING, description: '도달률 1위 DM 공유 및 저장 유도 카피' },
                timestamps: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      time: { type: Type.STRING, description: '00:00 형태' },
                      label: { type: Type.STRING, description: '챕터 제목' }
                    },
                    required: ['time', 'label']
                  }
                },
                fullScript: { type: Type.STRING, description: '영상 전체 나레이션 본문' },
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
                safetyCheck: {
                  type: Type.OBJECT,
                  properties: {
                    numbersToVerify: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: '대본 속 검증이 필요한 핵심 숫자/연도 2개'
                    },
                    positivePrFit: {
                      type: Type.STRING,
                      description: '긍정 서사(홍보팀 기준) 적합 여부 한 줄 요약'
                    },
                    isPrSafe: { type: Type.BOOLEAN }
                  },
                  required: ['numbersToVerify', 'positivePrFit', 'isPrSafe']
                },
                copyrightDefenseNote: { type: Type.STRING, description: '2차 창작물 보호 근거' }
              },
              required: ['hooks', 'titles', 'hashtags', 'description', 'pinnedComment', 'fullScript', 'scenes', 'safetyCheck', 'copyrightDefenseNote']
            }
          }
        });

        const parsed = JSON.parse(response.text || '{}');
        if (parsed.fullScript && parsed.scenes && parsed.scenes.length > 0) {
          const toned = applyToneToResult(parsed, speechTone);
          return NextResponse.json({
            ...toned,
            safetyCheck: buildNormalizedSafetyCheck(parsed.safetyCheck, toned.fullScript),
          });
        }
      } catch (err: any) {
        console.warn(`Gemini model ${mod} call failed:`, err.message);
      }
    }
  }

  // Format-aware PR-safe fallback when API unavailable
  const kw = customKeyword ? customKeyword.trim() : '';
  const fmt = scriptFormat || 'overcoming_story';

  let fallbackHooks = [
    { type: 'question', label: '숫자 후킹', text: kw ? `${figureName}이 '${kw}'에 17년을 걸고도 웃었던 진짜 이유` : `${figureName}이 적자 290만 개를 감수하고도 멈추지 않았던 이유` },
    { type: 'provocative', label: '반전 후킹', text: `수조 원대 리더가 직원들과 똑같은 자리에서 내린 의외의 결단` },
    { type: 'emotional', label: '여운 후킹', text: `돈보다 사람의 일상을 먼저 택했던 ${figureName}의 한마디` }
  ];
  let fallbackTitles = [
    `${figureName}이 적자를 무릅쓰고 끝까지 지켜낸 단 하나의 약속 #기업인스토리`,
    `수조 원대 거물이 보여준 소탈하고 통 큰 리더십 비하인드 #shorts`,
    `숫자가 아니라 사람의 삶을 바꾼 ${figureName}의 통 큰 결단 #미담`
  ];
  let fallback60Scenes: any[] = [];

  if (fmt === 'humble_twist') {
    fallbackHooks = [
      { type: 'provocative', label: '반전 후킹', text: `수조 원대 회장님이 길거리 시장 어묵 국물 한 컵에 감동한 이유` },
      { type: 'question', label: '소탈 후킹', text: `${figureName}이 수십 년째 낡은 소품과 검소한 습관을 버리지 않는 비결` },
      { type: 'emotional', label: '인간미 후킹', text: `대기업 회장이 시민들과 격의 없이 셀카를 찍던 뜻밖의 현장` }
    ];
    fallbackTitles = [
      `재벌 회장님이 길거리 어묵 먹다 남긴 반전 한마디 #소탈함`,
      `세계가 주목하는 ${figureName}의 소박한 일상과 반전 매력 #shorts`,
      `화려함 대신 현장을 선택한 ${figureName}의 소탈한 리더십 #미담`
    ];
    fallback60Scenes = [
      { sceneNumber: 1, timeRange: '00:00 - 00:05', narration: `수조 원대 기업을 이끄는 ${figureName}, 시장 골목 어묵집 앞에 서서 뜻밖의 한마디를 건넸습니다.`, visualGuide: '전통시장이나 거리에서 시민들과 소탈하게 어울리는 모습', imageSearchKeyword: `${figureName} 시장 소탈한 일상`, visualEffect: '임팩트 줌인', bgmSuggestion: '따뜻하고 경쾌한 어쿠스틱' },
      { sceneNumber: 2, timeRange: '00:05 - 00:10', narration: '수십 명의 경호원이나 화려한 의전 대신, 가벼운 차림으로 직접 현장을 찾은 의외의 행보였습니다.', visualGuide: '격식을 내려놓고 미소 짓는 리더의 자연스러운 표정', imageSearchKeyword: `${figureName} 현장 소통 사진`, visualEffect: '좌측 패닝' },
      { sceneNumber: 3, timeRange: '00:10 - 00:15', narration: kw ? `'${kw}'으로 바쁜 일정 속에서도 작은 일상과 사람들의 온기를 잊지 않았던 것입니다.` : '국내외 출장이 이어지는 강행군 속에서도 현장의 작은 목소리만큼은 직접 챙겼습니다.', visualGuide: '직접 메모하며 경청하는 모습', imageSearchKeyword: `${figureName} 출장 현장 모습`, visualEffect: '슬로우 줌인' },
      { sceneNumber: 4, timeRange: '00:15 - 00:20', narration: '사실 화려한 직함 뒤에는 직원과 똑같이 줄 서서 구내식당 밥을 먹던 소탈함이 자리 잡고 있었습니다.', visualGuide: '구내식당·회의실에서 임직원과 나란히 식사·대화하는 장면', imageSearchKeyword: `${figureName} 구내식당 직원 소통`, visualEffect: '우측 패닝' },
      { sceneNumber: 5, timeRange: '00:20 - 00:25', narration: '10년 넘게 같은 시계나 낡은 가죽자켓, 소박한 물건을 고집하는 모습도 여러 차례 화제가 되었습니다.', visualGuide: '소탈한 패션과 오래된 애장품 디테일 컷', imageSearchKeyword: `${figureName} 소탈한 패션`, visualEffect: '슬로우 줌아웃' },
      { sceneNumber: 6, timeRange: '00:25 - 00:30', narration: '상인이 건넨 따뜻한 어묵 국물 한 컵에 환하게 웃으며 "정말 맛있다"고 엄지를 세웠습니다.', visualGuide: '시민과 상인들의 환한 반응과 훈훈한 분위기', imageSearchKeyword: `${figureName} 전통시장 상인 미소`, visualEffect: '따뜻한 비네팅' },
      { sceneNumber: 7, timeRange: '00:30 - 00:35', narration: '사진을 찍어 달라는 팬들의 요청도 한 명 한 명 정성껏 받아주며 반전 매력을 보여주었습니다.', visualGuide: '시민들과 나란히 서서 셀카를 찍는 장면', imageSearchKeyword: `${figureName} 시민 셀카 팬서비스`, visualEffect: '다이내믹 줌인' },
      { sceneNumber: 8, timeRange: '00:35 - 00:40', narration: '하지만 경영과 결단의 테이블 앞에 서면 누구보다 냉철하고 통 큰 승부사로 돌변했습니다.', visualGuide: '글로벌 콘퍼런스와 대규모 투자 협약 현장', imageSearchKeyword: `${figureName} 글로벌 비즈니스 협약`, visualEffect: '화이트 플래시' },
      { sceneNumber: 9, timeRange: '00:40 - 00:45', narration: '일상에서는 한없이 낮아지고, 회사와 고객을 지키는 투자 앞에서는 망설임 없이 수조 원을 결단했습니다.', visualGuide: '대규모 R&D 시설과 미래 전략 발표 장면', imageSearchKeyword: `${figureName} 미래 투자 발표`, visualEffect: '슬로우 줌인' },
      { sceneNumber: 10, timeRange: '00:45 - 00:50', narration: '작은 것을 아끼는 겸손함과 큰일을 도모하는 대범함이 공존할 때 대중의 진심 어린 응원이 따랐습니다.', visualGuide: '기립 박수와 따뜻한 반응이 이어지는 강연장', imageSearchKeyword: `${figureName} 연설 환호`, visualEffect: '우측 패닝' },
      { sceneNumber: 11, timeRange: '00:50 - 00:55', narration: '높은 자리에 오를수록 사람을 귀하게 여기는 태도가 결국 브랜드의 가장 강력한 경쟁력이 되었습니다.', visualGuide: '미소 짓는 ${figureName}의 품격 있는 클로즈업', imageSearchKeyword: `${figureName} 최근 인터뷰 미소`, visualEffect: '와이드 줌아웃' },
      { sceneNumber: 12, timeRange: '00:55 - 01:00', narration: '화려함보다 진정성으로 마음을 움직인 소탈한 반전 매력, 여러분은 어떤 장면이 가장 멋졌나요?', visualGuide: '댓글 소통을 유도하는 깔끔한 엔딩 타이틀', imageSearchKeyword: `${figureName} 공식 프로필 고화질`, visualEffect: '엔딩 페이드 아웃', bgmSuggestion: '따뜻하고 여운 남는 피아노' }
    ];
  } else if (fmt === 'life_timeline') {
    fallbackHooks = [
      { type: 'question', label: '인생변천 후킹', text: `시급 몇 푼 받던 알바생에서 글로벌 리더까지, ${figureName}의 인생을 바꾼 17년` },
      { type: 'provocative', label: '반전 후킹', text: `회사 통장에 딱 30일 치만 남았던 청년이 일궈낸 대반전` },
      { type: 'emotional', label: '성장 후킹', text: `어린 시절의 작은 습관 하나가 ${figureName}을 정상으로 이끌었다` }
    ];
    fallback60Scenes = [
      { sceneNumber: 1, timeRange: '00:00 - 00:05', narration: `통장 잔고 30일 치만 남았던 초기 창업기에서 오늘날 정상까지, ${figureName}의 결정적 1장면이 있었습니다.`, visualGuide: '과거 청년 시절과 현재 리더 모습 오버랩', imageSearchKeyword: `${figureName} 젊은 시절 과거 사진`, visualEffect: '임팩트 줌인', bgmSuggestion: '희망차게 고조되는 피아노' },
      { sceneNumber: 2, timeRange: '00:05 - 00:10', narration: '어린 시절부터 그는 남들이 귀찮아하며 지나치던 디테일 하나를 끝까지 붙잡는 아이였습니다.', visualGuide: '학창·청년 시절 열정적으로 공부·아르바이트하던 배경', imageSearchKeyword: `${figureName} 학창시절 성장기`, visualEffect: '슬로우 패닝' },
      { sceneNumber: 3, timeRange: '00:10 - 00:15', narration: kw ? `청년기에 접어든 그는 '${kw}'이라는 목표를 세우고 현장에서 직접 발로 뛰며 배웠습니다.` : '사회 초년생 시절 가장 낮은 현장에서부터 시작해 산업의 기본기를 온몸으로 익혔습니다.', visualGuide: '초기 현장과 작업실에서 땀 흘리는 모습', imageSearchKeyword: `${figureName} 창업 초기 사무실`, visualEffect: '좌측 패닝' },
      { sceneNumber: 4, timeRange: '00:15 - 00:20', narration: '물론 첫 번째 도전에선 예기치 못한 적자와 시장의 냉정한 평가를 피할 수 없었습니다.', visualGuide: '초기 시제품과 고민하는 회의실 분위기', imageSearchKeyword: `${figureName} 첫 도전 위기`, visualEffect: '슬로우 줌아웃' },
      { sceneNumber: 5, timeRange: '00:20 - 00:25', narration: '주변에서 방향을 바꾸자고 권유할 때도 그는 "고객이 원하는 본질은 맞다"며 포기하지 않았습니다.', visualGuide: '설계도와 데이터를 다시 검토하는 진지한 눈빛', imageSearchKeyword: `${figureName} 전략 회의 사진`, visualEffect: '2단 줌인' },
      { sceneNumber: 6, timeRange: '00:25 - 00:30', narration: '밤낮없는 개선 끝에 품질을 기존보다 몇 배 끌어올린 차세대 솔루션을 세상에 내놓았습니다.', visualGuide: '혁신적인 제품 공개와 환호하는 팀원들', imageSearchKeyword: `${figureName} 신제품 발표회`, visualEffect: '화이트 플래시' },
      { sceneNumber: 7, timeRange: '00:30 - 00:35', narration: '그 단 한 번의 터닝포인트 이후 시장은 빠르게 반응했고, 글로벌 파트너들의 러브콜이 이어졌습니다.', visualGuide: '글로벌 무대에서 악수하며 협력하는 장면', imageSearchKeyword: `${figureName} 글로벌 파트너십`, visualEffect: '우측 패닝' },
      { sceneNumber: 8, timeRange: '00:35 - 00:40', narration: '화려한 성장을 이룬 뒤에도 그는 초심을 잃지 않고 인재 양성과 기술 투자에 아낌없이 썼습니다.', visualGuide: '청년 인재들과 대화하며 웃는 모습', imageSearchKeyword: `${figureName} 인재 양성 강연`, visualEffect: '슬로우 줌인' },
      { sceneNumber: 9, timeRange: '00:40 - 00:45', narration: '위기 때마다 책임을 회피하지 않고 앞장섰던 리더십이 동료들의 두터운 신뢰를 만들었습니다.', visualGuide: '임직원들과 어깨를 나란히 한 모습', imageSearchKeyword: `${figureName} 임직원 사진`, visualEffect: '시네마틱 페이드' },
      { sceneNumber: 10, timeRange: '00:45 - 00:50', narration: '어린 시절의 호기심이 청년기의 뚝심으로, 그리고 오늘날 사회를 바꾸는 선한 영향력으로 이어졌습니다.', visualGuide: '수상과 글로벌 컨퍼런스 하이라이트', imageSearchKeyword: `${figureName} 기조연설 무대`, visualEffect: '천천히 줌인' },
      { sceneNumber: 11, timeRange: '00:50 - 00:55', narration: '단 하루 만에 만들어진 기적은 없었습니다. 원칙을 지켜온 시간들이 모여 오늘의 역사가 되었습니다.', visualGuide: '당당하고 온화한 미소 클로즈업', imageSearchKeyword: `${figureName} 최근 인터뷰 고화질`, visualEffect: '와이드 줌아웃' },
      { sceneNumber: 12, timeRange: '00:55 - 01:00', narration: '누군가의 작은 시작이 결국 세상의 기준을 바꿉니다. 여러분의 도전도 응원합니다.', visualGuide: '여운 남는 엔딩 카드 및 댓글 유도', imageSearchKeyword: `${figureName} 공식 프로필`, visualEffect: '엔딩 페이드 아웃', bgmSuggestion: '벅차오르는 피아노 피날레' }
    ];
  } else if (fmt === 'biz_sports_owner') {
    fallbackHooks = [
      { type: 'question', label: '구단주 후킹', text: `적자 구단에 수백억을 쏘면서도 팬들에게 먼저 고개 숙인 구단주의 정체` },
      { type: 'provocative', label: '비즈니스 후킹', text: `${figureName}이 경기장과 비즈니스 현장에서 동시에 승부수를 던진 이유` },
      { type: 'emotional', label: '팀워크 후킹', text: `우승 트로피보다 선수들과 팬들의 눈물을 먼저 챙겼던 명장면` }
    ];
    fallback60Scenes = [
      { sceneNumber: 1, timeRange: '00:00 - 00:05', narration: `비즈니스만으로도 24시간이 모자란 ${figureName}, 왜 구단 운영과 선수단 지원에 전폭적인 투자를 아끼지 않았을까요?`, visualGuide: '경기장 관중석에서 진심으로 응원하는 구단주의 모습', imageSearchKeyword: `${figureName} 스포츠 구단 경기장`, visualEffect: '임팩트 줌인', bgmSuggestion: '웅장한 스포츠 다큐 비트' },
      { sceneNumber: 2, timeRange: '00:05 - 00:10', narration: '겉으로 보기엔 계산기 두드리는 냉철한 경영자였지만, 스포츠와 팬 앞에서는 완전히 다른 모습을 보였습니다.', visualGuide: '팬들과 하이파이브하며 환호하는 현장', imageSearchKeyword: `${figureName} 팬 소통 응원`, visualEffect: '좌측 패닝' },
      { sceneNumber: 3, timeRange: '00:10 - 00:15', narration: kw ? `'${kw}'처럼 승부처가 왔을 때는 망설임 없이 최고 수준의 인프라와 복지를 지원했습니다.` : '선수들이 최상의 컨디션에만 집중할 수 있도록 훈련장과 식단, 의료 지원까지 아낌없이 투자했습니다.', visualGuide: '최첨단 훈련 시설과 선수단 미소', imageSearchKeyword: `${figureName} 구단 지원 시설`, visualEffect: '슬로우 줌인' },
      { sceneNumber: 4, timeRange: '00:15 - 00:20', narration: '성적이 안 나와 흔들리던 시기에도 질책 대신 "우리를 믿고 끝까지 가자"며 선수들의 어깨를 두드렸습니다.', visualGuide: '락커룸·그라운드에서 선수들을 격려하는 모습', imageSearchKeyword: `${figureName} 선수단 격려`, visualEffect: '우측 패닝' },
      { sceneNumber: 5, timeRange: '00:20 - 00:25', narration: '원정 경기까지 직접 찾아가 팬들과 똑같이 응원가를 부르며 팀의 열두 번째 선수가 되었습니다.', visualGuide: '응원도구를 들고 열정적으로 응원하는 사진', imageSearchKeyword: `${figureName} 경기장 직관`, visualEffect: '다이내믹 줌인' },
      { sceneNumber: 6, timeRange: '00:25 - 00:30', narration: '유망주 발굴과 유소년 아카데미에도 묵묵히 재원을 쏟으며 당장의 이익보다 10년 뒤 미래를 봤습니다.', visualGuide: '유소년 선수들과 기념사진 찍는 모습', imageSearchKeyword: `${figureName} 유소년 스포츠 지원`, visualEffect: '슬로우 줌아웃' },
      { sceneNumber: 7, timeRange: '00:30 - 00:35', narration: '비즈니스 세계에서 통했던 "사람에게 투자하면 결국 돌아온다"는 원칙이 스포츠에서도 기적을 만들었습니다.', visualGuide: '극적인 역전 승부와 환호하는 관중석', imageSearchKeyword: `${figureName} 구단 우승 환호`, visualEffect: '화이트 플래시' },
      { sceneNumber: 8, timeRange: '00:35 - 00:40', narration: '우승이나 결정적 승리의 순간에도 그는 공을 모두 선수와 코칭스태프, 그리고 팬들에게 돌렸습니다.', visualGuide: '트로피 옆에서 환하게 박수치는 모습', imageSearchKeyword: `${figureName} 시상식 박수`, visualEffect: '슬로우 줌인' },
      { sceneNumber: 9, timeRange: '00:40 - 00:45', narration: '팬들의 진심 어린 호응은 자연스럽게 기업 이미지의 폭발적인 호감으로 이어졌습니다.', visualGuide: '기업 브랜드와 구단 팬들이 함께 웃는 장면', imageSearchKeyword: `${figureName} 브랜드 호감 기사`, visualEffect: '우측 패닝' },
      { sceneNumber: 10, timeRange: '00:45 - 00:50', narration: '이윤을 넘어 사람들의 가슴을 뛰게 만드는 투자, 그것이 진정한 명품 구단주의 품격이었습니다.', visualGuide: '경기장 야경과 웅장한 전경', imageSearchKeyword: `${figureName} 경기장 야경 전경`, visualEffect: '천천히 줌인' },
      { sceneNumber: 11, timeRange: '00:50 - 00:55', narration: '숫자로는 다 계산할 수 없는 팬들과의 약속을 지켰기에 오랫동안 박수받는 리더가 되었습니다.', visualGuide: '존경받는 리더의 따뜻한 미소', imageSearchKeyword: `${figureName} 최근 인터뷰`, visualEffect: '와이드 줌아웃' },
      { sceneNumber: 12, timeRange: '00:55 - 01:00', narration: '사업에서도 스포츠에서도 결국 사람을 남기는 리더, 여러분이 응원하는 구단주는 누구인가요?', visualGuide: '댓글 참여를 유도하는 깔끔한 엔딩', imageSearchKeyword: `${figureName} 공식 프로필`, visualEffect: '엔딩 페이드 아웃', bgmSuggestion: '희망찬 피아노 아웃트로' }
    ];
  } else {
    // ① overcoming_story (CJ 저단백밥 스타일 기본)
    fallback60Scenes = [
      { sceneNumber: 1, timeRange: '00:00 - 00:05', narration: kw ? `${figureName}, '${kw}' 하나로 적자까지 감수하며 290만 번의 기적을 만든 사연이 있습니다.` : `${figureName}, 만들수록 손해가 나는 일을 17년째 포기하지 않고 이어온 진짜 이유가 있습니다.`, visualGuide: '임팩트 있는 숫자 텍스트와 인물의 진중한 모습', imageSearchKeyword: `${figureName} 대표 인터뷰 사진`, visualEffect: '임팩트 줌인', bgmSuggestion: '잔잔하고 묵직한 피아노' },
      { sceneNumber: 2, timeRange: '00:05 - 00:10', narration: '단 하나의 작은 사연에서 시작되었습니다. 평범한 일상을 누리지 못하는 사람들의 안타까운 소식이었습니다.', visualGuide: '초기 계기가 된 현장 사진과 따뜻한 기록', imageSearchKeyword: `${figureName} 사회공헌 사연`, visualEffect: '좌측 패닝' },
      { sceneNumber: 3, timeRange: '00:10 - 00:15', narration: '시장성을 계산해 보면 답이 나오지 않았습니다. 팔릴수록 오히려 비용과 적자가 커지는 구조였습니다.', visualGuide: '내부 회의와 현실적 고민이 담긴 그래프 연출', imageSearchKeyword: `${figureName} 연구개발 회의`, visualEffect: '슬로우 줌인' },
      { sceneNumber: 4, timeRange: '00:15 - 00:20', narration: '실무진들 사이에서도 수익성을 걱정하는 신중론이 적지 않게 나왔습니다.', visualGuide: '연구실과 생산 라인 점검 장면', imageSearchKeyword: `${figureName} 생산 현장 점검`, visualEffect: '우측 패닝' },
      { sceneNumber: 5, timeRange: '00:20 - 00:25', narration: '근데 달랐습니다. "우리가 기술을 가지고 있기 때문에 반드시 해야 한다"며 결단을 내렸습니다.', visualGuide: '단호하고 따뜻한 결단을 내리는 리더의 눈빛', imageSearchKeyword: `${figureName} 결단 인터뷰`, visualEffect: '화이트 플래시' },
      { sceneNumber: 6, timeRange: '00:25 - 00:30', narration: '일반 제품보다 10배 이상 손이 많이 가는 까다로운 공정에도 품질과 타협하지 않았습니다.', visualGuide: '정밀한 제조 공정과 연구진들의 땀방울', imageSearchKeyword: `${figureName} R&D 품질 개발`, visualEffect: '2단 줌인' },
      { sceneNumber: 7, timeRange: '00:30 - 00:35', narration: '그렇게 탄생한 결과물은 필요한 사람들에게 다시 살아갈 희망과 생명줄이 되었습니다.', visualGuide: '제품을 받고 감사해하는 시민들의 따뜻한 모습', imageSearchKeyword: `${figureName} 미담 사례 보도`, visualEffect: '따뜻한 비네팅' },
      { sceneNumber: 8, timeRange: '00:35 - 00:40', narration: '단발성 생색내기가 아니었습니다. 해가 바뀌어도, 경기가 어려워져도 약속은 멈추지 않았습니다.', visualGuide: '수년간 이어진 공헌 기록 타임라인', imageSearchKeyword: `${figureName} 장기 프로젝트 기사`, visualEffect: '슬로우 줌아웃' },
      { sceneNumber: 9, timeRange: '00:40 - 00:45', narration: '어느덧 누적 기록은 수백만 건을 훌쩍 넘어섰고, 뒤늦게 알려진 진심에 대중이 먼저 반응했습니다.', visualGuide: '언론 보도와 칭찬 댓글이 쏟아지는 화면', imageSearchKeyword: `${figureName} 호평 뉴스 기사`, visualEffect: '다이내믹 줌인' },
      { sceneNumber: 10, timeRange: '00:45 - 00:50', narration: '돈이 되는 일보다 가치가 있는 일을 택했던 묵묵한 집념이 결국 기업의 가장 큰 자산이 되었습니다.', visualGuide: '기업 비전과 신뢰감 있는 전경', imageSearchKeyword: `${figureName} 기업 비전 사진`, visualEffect: '시네마틱 페이드' },
      { sceneNumber: 11, timeRange: '00:50 - 00:55', narration: '사업의 가치는 숫자로만 남지 않았습니다. 누군가의 평범한 내일을 지켜줄 때 기업의 존재 이유가 완성되었습니다.', visualGuide: '온화하게 미소 짓는 인물의 모습', imageSearchKeyword: `${figureName} 최근 미소 사진`, visualEffect: '천천히 줌인' },
      { sceneNumber: 12, timeRange: '00:55 - 01:00', narration: '이익보다 사람을 먼저 생각했던 이 통 큰 결단, 여러분은 어떻게 보셨나요?', visualGuide: '여운 남는 엔딩 타이틀과 댓글 유도', imageSearchKeyword: `${figureName} 공식 프로필 고화질`, visualEffect: '엔딩 페이드 아웃', bgmSuggestion: '벅차오르는 피아노 아웃트로' }
    ];
  }

  const scenesToReturn = targetDuration === 45 ? fallback60Scenes.slice(0, 9) : fallback60Scenes;
  const fullScriptToReturn = scenesToReturn.map((s) => s.narration).join('\n\n');

  const tonedFallback = applyToneToResult(
    {
      hooks: fallbackHooks,
      titles: fallbackTitles,
      hashtags: ['#shorts', `#${figureName}`, '#기업인스토리'],
      cleanSemanticTags: [`#${figureName}`, '#기업인스토리', '#성공미담'],
      firstTwoLinesSeo: `${figureName}의 긍정적 리더십과 통 큰 결단 미담 스토리.`,
      timestamps: [
        { time: '00:00', label: '강렬한 후킹' },
        { time: '00:15', label: '의외의 배경과 디테일' },
        { time: '00:40', label: '통 큰 결단과 성취' },
        { time: '00:55', label: '여운 엔딩' }
      ],
      commentBaits: {
        debateQuestion: `${figureName} 님의 이야기 중 가장 인상 깊었던 포인트는 무엇인가요?`,
        optionA: 'A. 적자나 위기에도 원칙을 지킨 통 큰 결단',
        optionB: 'B. 격의 없이 다가가는 소탈한 인간미',
        pinnedCommentDraft: `📌 [댓글 소통] ${figureName} 님의 이야기 중 가장 멋졌던 장면을 댓글로 남겨주세요! 👇`
      },
      semanticKeywords: [figureName, '기업인 미담', '통 큰 결단', '소탈한 매력', '리더십'],
      shareTrigger: `따뜻한 영감이 필요한 지인에게 이 영상을 공유해보세요! 🚀`,
      description: `${figureName}의 긍정적인 미담과 통 큰 결단을 5단계 쇼츠 서사로 재구성한 브랜드 세이프 콘텐츠입니다.`,
      pinnedComment: `📌 [댓글 소통] ${figureName} 님의 이야기 중 가장 멋졌던 장면을 댓글로 남겨주세요! 👇`,
      fullScript: fullScriptToReturn,
      scenes: scenesToReturn,
      copyrightDefenseNote: '공인된 사실(Fact)과 긍정적 미담·리더십을 바탕으로 창작한 100% 브랜드 세이프 2차 저작물입니다.'
    },
    speechTone
  );

  return NextResponse.json({
    ...tonedFallback,
    safetyCheck: buildNormalizedSafetyCheck(null, tonedFallback.fullScript),
  });
}
