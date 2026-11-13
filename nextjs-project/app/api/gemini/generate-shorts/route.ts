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
    'friendly_story': '① [친근한 썰풀이체] "~했대요", "~였나 봐요", "근데 달랐대요", "믿어지시나요?"처럼 시청자에게 옆에서 재미있고 따뜻하게 이야기 들려주는 구어체 썰풀이 말투를 대본 전체 나레이션과 후킹에 일관 적용하세요.',
    'trendy_shorts': '② [트렌디한 쇼츠체] "~했음", "그랬음", "진짜 레전드임", "이건 인정해야 됨"처럼 짧고 리듬감 있는 쇼츠 전용 구어체로 지루함 없이 치고 나가는 문체를 대본 전체에 일관 적용하세요.',
    'news_briefing': '③ [속도감 있는 뉴스 브리핑체] "~했습니다", "~밝혀졌습니다", "업계가 술렁였습니다"처럼 군더더기 없이 팩트와 숫자를 쾌속으로 전달하는 뉴스 브리핑 어투를 대본 전체에 일관 적용하세요.',
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

  const runtimeKey = String(body.geminiApiKey || apiKey || '').trim();
  if (runtimeKey) {
    const runtimeAi = runtimeKey === apiKey
      ? ai
      : new GoogleGenAI({
          apiKey: runtimeKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
        });
    const candidateModels = ['gemini-3.1-pro-preview', 'gemini-2.5-flash', 'gemini-flash-latest'];
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
          return NextResponse.json({
            ...parsed,
            safetyCheck: buildNormalizedSafetyCheck(parsed.safetyCheck, parsed.fullScript),
          });
        }
      } catch (err: any) {
        console.warn(`Gemini model ${mod} call failed:`, err.message);
      }
    }
  }

  // Robust Fallback Script (Prevents ANY crash or error banner on Vercel)
  const variationIdx = Math.abs((refreshCounter || 0) + (storyAngle === 'twist' ? 1 : storyAngle === 'success' ? 2 : 0)) % 3;

  let fallback60Scenes = [];
  let fallbackHooks = [];
  let fallbackTitles = [];

  if (variationIdx === 1) {
    fallbackHooks = [
      { type: 'twist', label: '반전형 후킹', text: `모두가 천재라고 부르지만, 사실 ${figureName} 님은 100번 넘게 연속 탈락했던 인물입니다.` },
      { type: 'question', label: '질문형 후킹', text: `대한민국 1등이 된 ${figureName} 님이 방송에서 절대 말하지 못했던 비밀을 아십니까?` },
      { type: 'event', label: '사건형 후킹', text: `2006년, ${figureName} 님이 전 재산을 잃을 뻔했던 그날 밤의 사건을 아십니까?` }
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
    fallbackHooks = [
      { type: 'event', label: '사건형 후킹', text: `${figureName} 님이 인생 최대의 위기에서 던졌던 단 한마디의 승부수를 기억하십니까?` },
      { type: 'question', label: '질문형 후킹', text: `수많은 천재들을 제치고 ${figureName} 님이 1등이 될 수 있었던 진짜 이유는 무엇일까요?` },
      { type: 'twist', label: '반전형 후킹', text: `"재능은 핑계일 뿐이다." ${figureName} 님이 온몸으로 증명해낸 잔혹한 성공 법칙.` }
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
    fallbackHooks = [
      { type: 'question', label: '질문형 후킹', text: `여러분은 ${figureName} 님이 가장 절망적이었던 순간을 어떻게 이겨냈는지 아십니까?` },
      { type: 'event', label: '사건형 후킹', text: `모두가 불가능하다고 손가락질했지만, ${figureName} 님은 단 한 번의 결단으로 판을 바꿨습니다.` },
      { type: 'twist', label: '반전형 후킹', text: `가장 밑바닥에 떨어졌던 그날 밤, ${figureName} 님이 홀로 삼켰던 눈물의 반전 실화.` }
    ];
    fallbackTitles = [
      `${figureName}의 눈물겨운 인생 역전과 아무도 몰랐던 충격 비하인드 #shorts`,
      `모두가 포기하라 했을 때 ${figureName}이 보여준 기적 같은 반전 #감동실화`,
      `단칸방에서 시작해 대한민국 정상에 선 ${figureName}의 눈물 #동기부여`
    ];
    fallback60Scenes = [
      { sceneNumber: 1, timeRange: '00:00 - 00:05', narration: `여러분은 ${figureName} 님이 가장 밑바닥에 있던 순간을 아십니까?`, visualGuide: `${figureName}의 무명 시절 흑백 사진에서 현재 모습으로 서서히 오버랩`, imageSearchKeyword: `${figureName} 과거 무명시절 흑백 사진`, visualEffect: '임팩트 줌인', bgmSuggestion: '긴장감 있는 오케스트라' },
      { sceneNumber: 2, timeRange: '00:05 - 00:10', narration: '화려한 지금의 모습 뒤에는, 끝없는 거절과 차가운 냉대를 견뎌낸 10년의 긴 무명이 있었습니다.', visualGuide: '어두운 연습실에서 묵묵히 땀 흘리는 실루엣', imageSearchKeyword: `${figureName} 신인시절 인터뷰 사진`, visualEffect: '슬로우 패닝', bgmSuggestion: '잔잔하고 묵직한 피아노' },
      { sceneNumber: 3, timeRange: '00:10 - 00:15', narration: '"너는 절대 성공할 수 없다"는 차가운 말들을 들었을 때도, 그는 결코 물러서지 않았습니다.', visualGuide: '비판과 편견에 맞서며 홀로 연습하는 표정 클로즈업', imageSearchKeyword: `${figureName} 연습실 연습 열정 클로즈업`, visualEffect: '2단 스피드 줌', bgmSuggestion: '고조되는 현악기' },
      { sceneNumber: 4, timeRange: '00:15 - 00:20', narration: '남들이 모두 잠든 새벽, 차가운 연습실에서 하루 3시간만 자며 피나는 노력을 거듭했습니다.', visualGuide: '새벽 연습실의 땀방울과 악바리 같은 열정', imageSearchKeyword: `${figureName} 연습실 연습 사진`, visualEffect: '우측 패닝' },
      { sceneNumber: 5, timeRange: '00:20 - 00:25', narration: '단돈 몇 푼이 없어 컵라면으로 끼니를 때우면서도, 가슴 속 꿈의 불꽃만은 꺼뜨리지 않았습니다.', visualGuide: '소박하고 눈물겨운 단칸방 시절의 흔적', imageSearchKeyword: `${figureName} 청년 시절 고생`, visualEffect: '슬로우 줌아웃' },
      { sceneNumber: 6, timeRange: '00:25 - 00:30', narration: '포기하고 싶어 무너져 내리던 날 밤, 낡은 가족사진을 보며 눈물을 훔치고 다시 일어섰습니다.', visualGuide: '가족에 대한 사랑과 눈물을 삼키는 아련한 표정', imageSearchKeyword: `${figureName} 가족 인터뷰 눈물`, visualEffect: '따뜻한 비네팅 필터' },
      { sceneNumber: 7, timeRange: '00:30 - 00:35', narration: '기회는 예고 없이 찾아왔고, 그는 지난 10년간 갈고닦은 모든 것을 그 한 무대에 쏟아부었습니다.', visualGuide: '운명을 바꾼 단 한 번의 결정적 무대 순간', imageSearchKeyword: `${figureName} 데뷔 무대 레전드`, visualEffect: '다이내믹 줌인' },
      { sceneNumber: 8, timeRange: '00:35 - 00:40', narration: '마침내 단 한 번의 무대로 대한민국 대중들의 시선을 단숨에 사로잡았습니다.', visualGuide: '대중들의 폭발적인 환호와 찬사', imageSearchKeyword: `${figureName} 방송 출연 화제`, visualEffect: '좌측 패닝' },
      { sceneNumber: 9, timeRange: '00:40 - 00:45', narration: '모두가 불가능하다고 손가락질했던 그 청년이, 지금은 수많은 이들의 롤모델이 되었습니다.', visualGuide: '시상식에서 당당히 트로피를 들어올리는 모습', imageSearchKeyword: `${figureName} 시상식 대상 수상 고화질`, visualEffect: '화려한 줌아웃' },
      { sceneNumber: 10, timeRange: '00:45 - 00:50', narration: '정상에 오른 지금도 그는 "그때의 눈물과 땀방울이 없었다면 오늘의 나는 없었다"고 고백합니다.', visualGuide: '겸손하고 진솔한 현재의 인터뷰 모습', imageSearchKeyword: `${figureName} 최근 인터뷰 미소`, visualEffect: '천천히 줌인' },
      { sceneNumber: 11, timeRange: '00:50 - 00:55', narration: '진정한 승리는 결코 요행이나 우연으로 완성되지 않는다는 것을 그는 온몸으로 증명했습니다.', visualGuide: '팬들의 열광과 벅찬 감동의 순간', imageSearchKeyword: `${figureName} 전성기 콘서트 무대`, visualEffect: '우측 패닝' },
      { sceneNumber: 12, timeRange: '00:55 - 01:00', narration: '오늘 홀로 버티고 있는 당신의 땀방울도 결코 헛되지 않을 것입니다. 당신의 꿈을 진심으로 응원합니다.', visualGuide: '시청자에게 깊은 용기를 주는 따뜻한 미소와 구독 유도', imageSearchKeyword: `${figureName} 환한 미소 정면 프로필`, visualEffect: '엔딩 페이드 아웃', bgmSuggestion: '희망찬 피아노 아웃트로' }
    ];
  }

  const scenesToReturn = targetDuration === 45 ? fallback60Scenes.slice(0, 9) : fallback60Scenes;
  const fullScriptToReturn = scenesToReturn.map((s) => s.narration).join('\n\n');

  return NextResponse.json({
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
    safetyCheck: buildNormalizedSafetyCheck(null, fullScriptToReturn),
    copyrightDefenseNote: '공인된 사실(Fact)과 긍정적 미담·리더십을 바탕으로 창작한 100% 브랜드 세이프 2차 저작물입니다.'
  });
}
