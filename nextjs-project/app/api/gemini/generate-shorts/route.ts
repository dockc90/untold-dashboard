import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { applyToneToShortsPayload, getSpeechTonePromptDirective } from '@/lib/speechTone';

export const maxDuration = 60;

const apiKey =
  process.env.GEMINI_API_KEY ||
  process.env.VITE_GEMINI_API_KEY ||
  process.env.NEXT_PUBLIC_GEMINI_API_KEY;

const ai = new GoogleGenAI({
  apiKey: apiKey || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

function extractJsonObj(raw: string): Record<string, any> {
  const cleaned = String(raw || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  const s = cleaned.indexOf('{');
  const e = cleaned.lastIndexOf('}');
  const slice = s >= 0 && e > s ? cleaned.slice(s, e + 1) : cleaned;
  return JSON.parse(slice || '{}');
}

function cleanSnippet(text: string, maxLen = 78): string {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  if (!s) return '';
  if (s.length <= maxLen) return s.replace(/[.!?]+$/, '');
  return s.slice(0, maxLen).replace(/\s+\S*$/, '').replace(/[.!?]+$/, '');
}

export async function POST(request: Request) {
  let body: any = {};
  try {
    body = await request.json();
  } catch {
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
    overcoming_story:
      '① [역경극복·감동미담형] 기업이나 기업인이 적자·위기·거절을 무릅쓰고 누군가의 삶을 바꾸거나 기술/품질에 끝까지 집념을 쏟아 낸 실제 감동 미담과 통 큰 결단 중심으로 서사를 전개하세요.',
    humble_twist:
      '② [소박한 반전매력형] 수조 원대 자산가나 글로벌 리더임에도 길거리 음식을 즐기거나, 소탈한 차림을 고집하거나, 직원/팬과 격의 없이 어울리는 인간적이고 소탈한 반전 매력에 집중하세요.',
    life_timeline:
      '③ [어린시절~현재 인생변천사형] 어려운 어린 시절이나 무명·초기 창업기의 결정적 한 장면에서 출발해, 한 번의 터닝포인트를 거쳐 현재 정상에 오른 극적인 인생 궤적을 속도감 있게 압축하세요.',
    biz_sports_owner:
      '④ [기업인+스포츠 구단주/비즈니스형] 구단주·스폰서·비즈니스 리더로서 보여준 남다른 팬 사랑, 파격적 투자, 현장 뒷이야기와 통 큰 결단·성과를 흥미진진하게 풀어내세요.',
  };

  const personaDescriptions: Record<string, string> = {
    '4060_emotional': '40~60대 중장년층 타겟: 가슴을 울리는 진정성, 묵직한 책임감과 따뜻한 인간미 강조.',
    '1020_dopamine': '10~20대 숏폼 타겟: 빠른 템포, 반전 디테일, 소셜에서 바로 공유하고 싶은 흥미진진한 전개.',
    '3040_success': '30~40대 직장인/투자자 타겟: 비즈니스 인사이트, 위기 돌파 결단력, 일과 삶의 태도에 대한 영감.',
    mystery_twist: '반전 스토리 타겟: 의외의 숫자와 예상 밖의 선행/행보로 끝까지 시선을 붙잡는 전개.',
    ceo_branding: '기업인/CEO 브랜드 스토리: 홍보팀도 자랑스러워할 품격 있는 미담, 기술 혁신, 사회공헌 서사.',
  };

  const moodToneDescriptions: Record<string, string> = {
    Cinematic: 'Cinematic (영화적 연출): 묵직하고 드라마틱한 몰입감, 슬로우 줌과 감정선을 살리는 피아노/스트링 BGM 제안.',
    Documentary: 'Documentary (다큐멘터리): 아카이브 사진과 현장감을 살린 진솔한 연출, 담백한 어쿠스틱 BGM 제안.',
    'Fast-paced': 'Fast-paced (쾌속 비트): 빠른 컷전환, 핵심 숫자 강조 자막, 속도감 있는 비트 BGM 제안.',
    Minimal: 'Minimal (절제된 미니멀): 팩트와 숫자가 또렷이 보이는 정갈한 연출, 미니멀한 앰비언트 BGM 제안.',
    CorporatePR: 'CorporatePR (기업 브랜딩): 포브스/블룸버그 다큐 풍의 신뢰감과 품격을 살린 세련된 비즈니스 톤.',
  };

  const storyAngleDirectives: Record<string, string> = {
    overcoming_story: formatDirectives.overcoming_story,
    humble_twist: formatDirectives.humble_twist,
    life_timeline: formatDirectives.life_timeline,
    biz_sports_owner: formatDirectives.biz_sports_owner,
    choice: '결정적 결단 앵글: 남들이 주저할 때 내린 통 큰 결단과 긍정적 성과에 집중하세요.',
    adversity: formatDirectives.overcoming_story,
    twist: formatDirectives.humble_twist,
    success: formatDirectives.biz_sports_owner,
    legend: formatDirectives.life_timeline,
    random: `새로운 앵글 버전 #${refreshCounter + 1}: 선택한 기획 포맷을 충실히 따르되 신선한 실제 에피소드와 숫자로 구성하세요.`,
  };

  const chosenFormatText = formatDirectives[scriptFormat] || formatDirectives.overcoming_story;
  const chosenSpeechText = getSpeechTonePromptDirective(speechTone);
  const targetToneText = personaDescriptions[targetPersona] || personaDescriptions['4060_emotional'];
  const videoToneText = moodToneDescriptions[videoTone] || moodToneDescriptions.Cinematic;
  const chosenAngleText = storyAngleDirectives[storyAngle] || chosenFormatText;
  const totalScenes = targetDuration === 45 ? 9 : 12;
  const targetCharMin = targetDuration === 45 ? 290 : 390;
  const targetCharMax = targetDuration === 45 ? 360 : 470;

  const prompt = `당신은 조회수 100만 뷰와 대기업 브랜디드 광고를 부르는 '국내외 기업인·부자 전문' 쇼츠 작가입니다.

[★ 절대 원칙 3대 철칙 (최우선 준수)]
1. 첫째, 철저히 '그 기업과 인물의 홍보팀'이라는 마인드로 긍정적인 미담, 위기 극복, 소박한 인간미, 통 큰 결단만 다루세요.
   - 비난, 악인전, 스캔들 폭로, 부정적 가십, 미검증 루머는 초상권·명예훼손 고소 위험이 있으므로 **절대 금지**합니다.
   - **중요**: 아래 참고 리듬 사례에 있는 숫자("290만 개", "17년", "햇반")를 다른 인물에게 그대로 베껴 쓰지 마세요! 오직 대상 인물(${figureName})의 실제 이력과 팩트로만 작성하세요.
2. 둘째, 첫 0~3초에 "19XX년에 태어난...", "오늘은 ~를 소개합니다" 같은 출생연도·지루한 인물 설명 대신 **충격적인 숫자(액수·기간·수량)나 반전 질문**으로 무조건 후킹하세요.
3. 셋째, ${targetDuration}초 대본을 반드시 아래 **5단계 구조**로 작성해 총 ${totalScenes}개 씬에 정확히 배분하세요:
   - [1단계: 0~3초 강렬한 후킹] (씬 1): 충격적 숫자 또는 반전 질문 1~2단문 (20~35자)
   - [2단계: 3~15초 의외의 배경] (씬 2~3): 예상을 뒤엎는 출발점/소박한 계기/인간적인 배경
   - [3단계: 15~40초 위기/반전 디테일] (씬 4~8): 구체적인 숫자·기간·현장 디테일이 담긴 위기 또는 반전 포인트
   - [4단계: 40~55초 통 큰 결단과 성취] (씬 9~10): 홍보팀이 자랑스러워할 통 큰 결단, 선행, 기술/사업적 성취
   - [5단계: 55~60초 칭찬 댓글을 유도하는 여운 엔딩] (씬 11~12): 기업의 존재 이유와 인물의 품격이 남아 시청자가 자연스럽게 존경·칭찬 댓글을 달게 만드는 묵직한 여운

[★ 레퍼런스 호흡 참고 (구조와 호흡만 참고 — 내용은 반드시 ${figureName}의 실제 사실만 사용)]
- 짧은 호흡, 구체적 숫자, 인간적 사연, 자연스럽게 변화하는 문장 어미(같은 어미 연속 반복 금지!), 뭉클한 엔딩 리듬을 참고하세요.

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
- 대본에 등장하는 핵심 숫자·연도 중 팩트체크가 필요한 2개 항목을 safetyCheck.numbersToVerify 배열(길이 2)에 정확히 적으세요.
- safetyCheck.positivePrFit에는 홍보팀 기준 긍정 서사 적합 여부 1줄을 작성하세요.
- safetyCheck.isPrSafe는 긍정 서사 원칙을 완벽히 준수했으면 true로 지정하세요.

[2026 SNS 알고리즘 치트키 메타데이터]
- 클릭률(CTR) 높은 쇼츠 제목 3개 (출생연도 나열 금지, 긍정적 미담/반전 호기심 자극)
- 클린 해시태그 3~5개, 첫 2줄 SEO 문구(firstTwoLinesSeo), 타임스탬프(timestamps), 댓글 칭찬/토론 유도(commentBaits), 시맨틱 키워드 5개, 공유 유도(shareTrigger)
- 씬별 imageSearchKeyword는 구글 이미지 검색 시 바로 과거/기사 사진이 나오는 구체적 한국어+인물명 키워드로 작성하세요.

반드시 정해진 JSON 스키마로만 응답하세요.`;

  const extractTwoFactNumbers = (scriptText: string) => {
    const matches =
      scriptText.match(
        /\d+(?:,\d{3})*(?:\.\d+)?\s*(?:년|개월|일|시간|원|만\s*원|억\s*원|조\s*원|억|만|배|%|개|명|위|차|번|초|달러)?/g
      ) || [];
    const unique = Array.from(new Set(matches.map((m) => m.trim()).filter((m) => m.length >= 2))).slice(0, 2);
    if (unique.length >= 2) return unique;
    if (unique.length === 1) return [unique[0], '핵심 연도/공식 발표 수치 확인 필요'];
    return ['인물 핵심 연도·기간 확인 필요', '주요 실적·투자 금액 공식 보도 확인 필요'];
  };

  const buildNormalizedSafetyCheck = (parsedSafety: any, scriptText: string) => {
    const fallbackNums = extractTwoFactNumbers(scriptText);
    const nums =
      Array.isArray(parsedSafety?.numbersToVerify) && parsedSafety.numbersToVerify.length > 0
        ? parsedSafety.numbersToVerify.slice(0, 2)
        : fallbackNums;
    return {
      numbersToVerify: nums.length >= 2 ? nums : [nums[0] || fallbackNums[0], fallbackNums[1]],
      positivePrFit:
        parsedSafety?.positivePrFit || '적합 — 비난·루머 배제, 미담·인간미·결단 중심의 홍보팀 친화 서사',
      isPrSafe: parsedSafety?.isPrSafe !== false,
    };
  };

  const runtimeKey = String(body.geminiApiKey || apiKey || '').trim();
  let lastErrorMsg = runtimeKey ? '' : 'Gemini API 키 미설정';

  if (runtimeKey) {
    const runtimeAi =
      runtimeKey === apiKey
        ? ai
        : new GoogleGenAI({
            apiKey: runtimeKey,
            httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
          });
    const candidateModels = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-flash-lite-latest'];
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
                      text: { type: Type.STRING, description: '3초 후킹 멘트 문장' },
                    },
                    required: ['type', 'label', 'text'],
                  },
                },
                titles: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '쇼츠 제목 3가지 추천',
                },
                hashtags: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '스팸 없는 클린 태그 3~5개',
                },
                cleanSemanticTags: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
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
                    pinnedCommentDraft: { type: Type.STRING, description: '고정 댓글 완성본' },
                  },
                  required: ['debateQuestion', 'optionA', 'optionB', 'pinnedCommentDraft'],
                },
                semanticKeywords: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '자연어 시맨틱 검색 키워드 5개',
                },
                shareTrigger: { type: Type.STRING, description: '도달률 1위 DM 공유 및 저장 유도 카피' },
                timestamps: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      time: { type: Type.STRING, description: '00:00 형태' },
                      label: { type: Type.STRING, description: '챕터 제목' },
                    },
                    required: ['time', 'label'],
                  },
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
                      bgmSuggestion: { type: Type.STRING, description: '배경음악 무드' },
                    },
                    required: ['sceneNumber', 'timeRange', 'narration', 'visualGuide', 'imageSearchKeyword', 'visualEffect'],
                  },
                },
                safetyCheck: {
                  type: Type.OBJECT,
                  properties: {
                    numbersToVerify: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: '대본 속 검증이 필요한 핵심 숫자/연도 2개',
                    },
                    positivePrFit: {
                      type: Type.STRING,
                      description: '긍정 서사(홍보팀 기준) 적합 여부 한 줄 요약',
                    },
                    isPrSafe: { type: Type.BOOLEAN },
                  },
                  required: ['numbersToVerify', 'positivePrFit', 'isPrSafe'],
                },
                copyrightDefenseNote: { type: Type.STRING, description: '2차 창작물 보호 근거' },
              },
              required: [
                'hooks',
                'titles',
                'hashtags',
                'description',
                'pinnedComment',
                'fullScript',
                'scenes',
                'safetyCheck',
                'copyrightDefenseNote',
              ],
            },
          },
        });

        const parsed = extractJsonObj(response.text || '{}');
        if (parsed.fullScript && Array.isArray(parsed.scenes) && parsed.scenes.length > 0) {
          const toned = applyToneToShortsPayload(parsed, speechTone);
          return NextResponse.json({
            ...toned,
            isFallback: false,
            modelUsed: mod,
            safetyCheck: buildNormalizedSafetyCheck(parsed.safetyCheck, toned.fullScript),
          });
        }
      } catch (err: any) {
        lastErrorMsg = err?.message || String(err);
        console.warn(`Gemini model ${mod} call failed:`, lastErrorMsg);
      }
    }
  }

  // Figure-aware PR-safe fallback (tailored to actual figure metadata, never copying CJ numbers onto unrelated figures)
  const kw = customKeyword ? String(customKeyword).trim() : '';
  const fmt = scriptFormat || 'overcoming_story';
  const isJensen = figureName.includes('젠슨') || figureName.includes('Jensen') || figureName.includes('엔비디아');
  const isCJ = figureName.includes('이재현') || figureName.includes('CJ');

  const hookSnippet = cleanSnippet(hookLine, 56);
  const titleSnippet = cleanSnippet(title, 62);
  const buzzSnippet = cleanSnippet(buzzSummary, 90);
  const issueSnippet = cleanSnippet(controversyOrIssue, 88);
  const angleSnippet = cleanSnippet(suggestedAngle, 80);

  let fallbackHooks = [
    {
      type: 'question',
      label: '핵심 후킹',
      text: hookSnippet || (kw ? `${figureName}이 '${kw}'으로 시장을 뒤집은 진짜 비결은 뭘까요?` : `${figureName}, 모두가 고개 젓던 순간에 보여준 뜻밖의 한 수`),
    },
    {
      type: 'provocative',
      label: '반전 후킹',
      text: titleSnippet || `${figureName}의 화려한 성과 뒤에 숨은 치열한 땀방울`,
    },
    {
      type: 'emotional',
      label: '여운 후킹',
      text: `숫자보다 사람을 먼저 택했던 ${figureName}의 소탈한 리더십`,
    },
  ];
  let fallbackTitles = [
    `${figureName}, ${titleSnippet || '모두의 예상을 깬 통 큰 결단 비하인드'} #shorts`,
    `${figureName}의 '${kw || '성공 비결'}' 뒤에 숨은 소탈하고 뜨거운 실화 #미담`,
    `왜 사람들은 ${figureName}에게 열광할까? 화제의 한 장면 #기업인스토리`,
  ];
  let fallback60Scenes: any[] = [];

  if (isCJ) {
    fallback60Scenes = [
      { sceneNumber: 1, timeRange: '00:00 - 00:05', narration: `${figureName}, 만들수록 손해가 나는 제품을 17년째 290만 개나 찍어낸 진짜 이유가 있어요.`, visualGuide: 'CJ 햇반 저단백밥 아카이브와 숫자 강조 자막', imageSearchKeyword: `${figureName} 햇반 저단백밥`, visualEffect: '임팩트 줌인', bgmSuggestion: '잔잔하고 묵직한 피아노' },
      { sceneNumber: 2, timeRange: '00:05 - 00:10', narration: '한 임직원 딸이 희귀 질환 때문에 평범한 쌀밥 한 그릇조차 먹지 못한다는 사연에서 시작되었거든요.', visualGuide: '초기 사연이 담긴 따뜻한 자료 사진', imageSearchKeyword: `햇반 저단백밥 희귀질환 사연`, visualEffect: '좌측 패닝' },
      { sceneNumber: 3, timeRange: '00:10 - 00:15', narration: '시장성을 따져 보면 도저히 답이 안 나오는 구조였죠. 팔릴수록 비용과 적자가 커졌답니다.', visualGuide: '연구개발 공정과 고민하는 회의실 분위기', imageSearchKeyword: `CJ제일제당 연구개발 R&D`, visualEffect: '슬로우 줌인' },
      { sceneNumber: 4, timeRange: '00:15 - 00:20', narration: '일반 제품보다 10배나 손이 더 가는 특수 공정 탓에 실무진의 우려도 컸던 거예요.', visualGuide: '정밀한 특수 공정 생산 라인', imageSearchKeyword: `햇반 생산라인 공정`, visualEffect: '우측 패닝' },
      { sceneNumber: 5, timeRange: '00:20 - 00:25', narration: '근데 달랐대요. "우리가 즉석밥 기술을 가지고 있으니 반드시 해야 한다"며 과감히 밀어붙였거든요.', visualGuide: '결단을 내리는 CEO 모습', imageSearchKeyword: `${figureName} 경영 철학 인터뷰`, visualEffect: '화이트 플래시' },
      { sceneNumber: 6, timeRange: '00:25 - 00:30', narration: '그렇게 탄생한 저단백 햇반은 환우들에게 평범한 일상을 선물하는 생명줄이 되어주었답니다.', visualGuide: '밝게 웃는 환우 가족들의 모습', imageSearchKeyword: `햇반 저단백밥 나눔 캠페인`, visualEffect: '따뜻한 비네팅' },
      { sceneNumber: 7, timeRange: '00:30 - 00:35', narration: '단발성 이벤트가 아니었죠. 해가 바뀌어도 17년 동안 한결같이 생산 라인을 지켰거든요.', visualGuide: '17년 누적 생산 290만 개 타임라인 그래픽', imageSearchKeyword: `햇반 저단백밥 290만개`, visualEffect: '2단 줌인' },
      { sceneNumber: 8, timeRange: '00:35 - 00:40', narration: kw ? `여기에 '${kw}'이라는 진심이 더해지자 뒤늦게 대중들이 먼저 알아보고 박수를 보냈어요.` : '뒤늦게 이 조용한 약속이 알려지자 대중들이 먼저 뜨거운 응원으로 화답했답니다.', visualGuide: '감동 뉴스 보도와 댓글 반응', imageSearchKeyword: `CJ 햇반 저단백밥 미담 기사`, visualEffect: '슬로우 줌아웃' },
      { sceneNumber: 9, timeRange: '00:40 - 00:45', narration: '당장의 적자보다 누군가의 한 끼를 지키는 가치가 훨씬 크다는 걸 몸소 보여준 셈이죠.', visualGuide: '신뢰감 있는 기업 전경과 비전', imageSearchKeyword: `CJ그룹 사회공헌 비전`, visualEffect: '다이내믹 줌인' },
      { sceneNumber: 10, timeRange: '00:45 - 00:50', narration: '돈이 되는 길보다 옳은 길을 택했을 때 기업은 비로소 존경받는 브랜드로 남게 됩니다.', visualGuide: '따뜻한 분위기의 임직원 모습', imageSearchKeyword: `${figureName} 최근 사진`, visualEffect: '시네마틱 페이드' },
      { sceneNumber: 11, timeRange: '00:50 - 00:55', narration: '사업의 가치는 장부 위 숫자가 아니라 바뀐 삶의 온기로 완성되는 법이에요.', visualGuide: '온화한 엔딩 배경 컷', imageSearchKeyword: `햇반 저단백밥 공식 이미지`, visualEffect: '천천히 줌인' },
      { sceneNumber: 12, timeRange: '00:55 - 01:00', narration: '17년간 이어진 이 따뜻한 약속, 여러분은 어떤 장면이 가장 뭉클하셨나요?', visualGuide: '댓글 유도 엔딩 카드', imageSearchKeyword: `${figureName} 프로필 고화질`, visualEffect: '엔딩 페이드 아웃', bgmSuggestion: '벅차오르는 피아노 아웃트로' },
    ];
  } else if (isJensen) {
    fallbackHooks = [
      { type: 'question', label: '숫자 후킹', text: kw ? `통장 잔고 30일 치만 남았던 청년이 '${kw}'으로 세계 1위가 됐거든요` : `16살에 식당 변기 닦던 소년이 어떻게 시총 1위 CEO가 됐을까요?` },
      { type: 'provocative', label: '반전 후킹', text: `한국 치맥집에서 먼저 고개 숙인 세계 최고 CEO의 소탈한 반전` },
      { type: 'emotional', label: '결단 후킹', text: `직원 80%를 내보낼 뻔한 파산 직전, 세가 사장을 움직인 한마디` },
    ];
    fallback60Scenes = [
      { sceneNumber: 1, timeRange: '00:00 - 00:05', narration: kw ? `지금은 세계 AI 황제로 불리지만, ${figureName}이 '${kw}'을 완성하기 전엔 파산 30일 전까지 몰렸었거든요.` : `세계 시총 최정상에 선 ${figureName}, 사실 시작은 열여섯 살 식당 접시닦이 소년이었죠.`, visualGuide: '젠슨 황 청년 시절 덴니스 레스토랑과 현재 키노트 대비', imageSearchKeyword: `젠슨황 덴니스 레스토랑 과거`, visualEffect: '임팩트 줌인', bgmSuggestion: '잔잔하고 묵직한 피아노' },
      { sceneNumber: 2, timeRange: '00:05 - 00:10', narration: '말도 안 통하던 타국 식당에서 화장실 청소까지 도맡으면서도 "가장 완벽하게 해내겠다"고 다짐했답니다.', visualGuide: '젊은 시절 아르바이트와 대학 졸업 사진', imageSearchKeyword: `젠슨황 젊은 시절 대학 사진`, visualEffect: '좌측 패닝' },
      { sceneNumber: 3, timeRange: '00:10 - 00:15', narration: '1993년 서른 살에 엔비디아를 세웠지만 첫 번째 칩은 시장에서 외면받으며 위기가 찾아왔어요.', visualGuide: '초기 실리콘밸리 사무실과 첫 칩 NV1 사진', imageSearchKeyword: `엔비디아 NV1 초기 사무실`, visualEffect: '슬로우 줌인' },
      { sceneNumber: 4, timeRange: '00:15 - 00:20', narration: '결국 회사 통장에는 딱 30일 치 월급만 남았고, 벼랑 끝에서 혼자 일본 세가 사장을 찾아갔죠.', visualGuide: '고뇌하는 창업자와 세가 담판 배경', imageSearchKeyword: `젠슨황 1995년 세가 500만달러`, visualEffect: '우측 패닝' },
      { sceneNumber: 5, timeRange: '00:20 - 00:25', narration: '"우리 설계는 틀렸지만 기술력만은 진짜"라는 솔직한 고백에 기적처럼 500만 달러 투자가 성사됐대요.', visualGuide: '계약 성사와 RIVA 128 그래픽카드', imageSearchKeyword: `엔비디아 RIVA 128 그래픽카드`, visualEffect: '화이트 플래시' },
      { sceneNumber: 6, timeRange: '00:25 - 00:30', narration: kw ? `그 절박한 순간에 다져진 '${kw}' 덕분에 네 달 만에 칩 100만 개가 팔리며 극적으로 부활한 거예요.` : '그 투자로 만든 칩이 넉 달 만에 100만 개나 팔려나가며 회사가 기적처럼 살아났답니다.', visualGuide: '가파른 성장 그래프와 나스닥 상장 장면', imageSearchKeyword: `엔비디아 나스닥 상장 1999`, visualEffect: '2단 줌인' },
      { sceneNumber: 7, timeRange: '00:30 - 00:35', narration: '더 놀라운 건 수백조 기업을 이끄는 지금도 검은 가죽자켓 하나만 고집하는 소탈함이에요.', visualGuide: '시그니처 가죽자켓을 입은 친근한 모습', imageSearchKeyword: `젠슨황 검은 가죽자켓 키노트`, visualEffect: '슬로우 줌아웃' },
      { sceneNumber: 8, timeRange: '00:35 - 00:40', narration: '한국에 와서도 화려한 연회장 대신 소박한 치맥 자리에서 격의 없이 어울리며 큰 화제를 모았죠.', visualGuide: '이재용 회장·국내 CEO들과 어울린 소탈한 현장', imageSearchKeyword: `젠슨황 방한 치맥 이재용`, visualEffect: '따뜻한 비네팅' },
      { sceneNumber: 9, timeRange: '00:40 - 00:45', narration: '밑바닥에서 배운 겸손함과 절벽 끝에서도 포기하지 않던 뚝심이 오늘의 제국을 만든 거랍니다.', visualGuide: '글로벌 무대에서 기립 박수를 받는 장면', imageSearchKeyword: `젠슨황 컴퓨텍스 기립박수`, visualEffect: '다이내믹 줌인' },
      { sceneNumber: 10, timeRange: '00:45 - 00:50', narration: '"고통과 시련은 실패가 아니라 나를 단련시키는 가장 값진 축복"이라는 그의 말이 묵직하게 와닿네요.', visualGuide: '스탠퍼드·대만대 축사 강연 클립', imageSearchKeyword: `젠슨황 졸업식 축사 명언`, visualEffect: '시네마틱 페이드' },
      { sceneNumber: 11, timeRange: '00:50 - 00:55', narration: '가난한 유학생에서 시대의 아이콘이 되기까지, 그의 발자취는 도전하는 모든 이들에게 용기를 줍니다.', visualGuide: '미소 짓는 젠슨 황 클로즈업', imageSearchKeyword: `젠슨황 미소 클로즈업`, visualEffect: '천천히 줌인' },
      { sceneNumber: 12, timeRange: '00:55 - 01:00', narration: '접시닦이 시절의 초심을 잃지 않은 거장 젠슨 황, 여러분은 어떤 장면이 가장 인상 깊으셨나요?', visualGuide: '엔딩 타이틀과 댓글 소통 유도', imageSearchKeyword: `젠슨황 공식 프로필 고화질`, visualEffect: '엔딩 페이드 아웃', bgmSuggestion: '희망찬 피아노 아웃트로' },
    ];
  } else if (fmt === 'humble_twist') {
    fallback60Scenes = [
      { sceneNumber: 1, timeRange: '00:00 - 00:05', narration: hookSnippet || `${figureName}, 화려한 자리 대신 소탈한 일상 한 컷으로 화제가 된 이유를 아시나요?`, visualGuide: '화려한 공식석상과 소박한 일상 컷 대비', imageSearchKeyword: `${figureName} 소탈한 일상 모습`, visualEffect: '임팩트 줌인', bgmSuggestion: '따뜻한 어쿠스틱 피아노' },
      { sceneNumber: 2, timeRange: '00:05 - 00:10', narration: buzzSnippet ? `${buzzSnippet}. 이 소식이 전해지자 대중의 시선이 집중됐죠.` : '수많은 카메라와 화려한 의전 대신, 평소처럼 소박한 모습으로 현장을 찾은 게 시작이었거든요.', visualGuide: '격식을 내려놓고 미소 짓는 장면', imageSearchKeyword: `${figureName} 목격담 사진`, visualEffect: '좌측 패닝' },
      { sceneNumber: 3, timeRange: '00:10 - 00:15', narration: kw ? `특히 '${kw}' 속에서도 사람들의 눈높이를 맞추던 소박한 태도가 돋보였답니다.` : '바쁜 일정 속에서도 먼저 다가가 인사를 건네는 소탈한 태도가 현장을 훈훈하게 만들었어요.', visualGuide: '시민·동료와 격의 없이 대화하는 장면', imageSearchKeyword: `${figureName} 시민 소통 미소`, visualEffect: '슬로우 줌인' },
      { sceneNumber: 4, timeRange: '00:15 - 00:20', narration: issueSnippet ? `여기에 ${issueSnippet}이라는 이야기가 더해지며 반전 매력이 빛났거든요.` : '높은 자리에 오르고도 오래된 습관과 검소함을 지키는 모습이 뜻밖의 감동을 준 거예요.', visualGuide: '소탈한 생활 습관과 현장 디테일', imageSearchKeyword: `${figureName} 현장 사진`, visualEffect: '우측 패닝' },
      { sceneNumber: 5, timeRange: '00:20 - 00:25', narration: '사실 어려웠던 초창기 시절, 직접 발로 뛰며 배웠던 현장의 감각을 잊지 않았던 거죠.', visualGuide: '과거 초기 시절 아카이브 사진', imageSearchKeyword: `${figureName} 젊은 시절 과거`, visualEffect: '흑백 컷전환' },
      { sceneNumber: 6, timeRange: '00:25 - 00:30', narration: '사람을 귀하게 여기고 격식을 줄이는 데서 진짜 품격이 나온다는 걸 몸소 보여줬대요.', visualGuide: '함께 웃으며 사진 찍는 따뜻한 현장', imageSearchKeyword: `${figureName} 팬서비스 셀카`, visualEffect: '따뜻한 비네팅' },
      { sceneNumber: 7, timeRange: '00:30 - 00:35', narration: '일상에서는 한없이 낮아지다가도, 정작 중요한 결단의 순간엔 누구보다 대범하게 움직였답니다.', visualGuide: '공식 무대·발표 현장의 카리스마', imageSearchKeyword: `${figureName} 공식 행사 발표`, visualEffect: '화이트 플래시' },
      { sceneNumber: 8, timeRange: '00:35 - 00:40', narration: angleSnippet ? `결국 ${angleSnippet}이라는 평가처럼, 겉치레보다 진정성이 통했던 거예요.` : '화려한 수식어 대신 한결같은 행동으로 신뢰를 쌓아 온 시간이 빛을 발했죠.', visualGuide: '호평 기사와 긍정 반응 화면', imageSearchKeyword: `${figureName} 호감 미담 기사`, visualEffect: '슬로우 줌아웃' },
      { sceneNumber: 9, timeRange: '00:40 - 00:45', narration: '작은 약속도 허투루 넘기지 않는 겸손함이 오늘날 수많은 팬과 동료의 응원을 끌어냈거든요.', visualGuide: '박수 갈채와 환호하는 현장', imageSearchKeyword: `${figureName} 인터뷰 환호`, visualEffect: '다이내믹 줌인' },
      { sceneNumber: 10, timeRange: '00:45 - 00:50', narration: '자리가 높아질수록 고개를 숙일 줄 아는 태도가 결국 가장 강력한 경쟁력이 된 셈이죠.', visualGuide: '온화하고 당당한 포트레이트', imageSearchKeyword: `${figureName} 최근 인터뷰`, visualEffect: '시네마틱 페이드' },
      { sceneNumber: 11, timeRange: '00:50 - 00:55', narration: '성공보다 먼저 인간미를 지켜낸 진심이 세대를 넘어 잔잔한 울림을 주네요.', visualGuide: '따뜻한 빛이 감도는 엔딩 컷', imageSearchKeyword: `${figureName} 미소 클로즈업`, visualEffect: '천천히 줌인' },
      { sceneNumber: 12, timeRange: '00:55 - 01:00', narration: '소탈한 반전 매력으로 마음을 사로잡은 이 장면, 여러분은 어떻게 보셨나요?', visualGuide: '댓글 유도 엔딩 카드', imageSearchKeyword: `${figureName} 프로필 고화질`, visualEffect: '엔딩 페이드 아웃', bgmSuggestion: '기분 좋은 피아노 피날레' },
    ];
  } else {
    fallback60Scenes = [
      { sceneNumber: 1, timeRange: '00:00 - 00:05', narration: hookSnippet || (kw ? `${figureName}, '${kw}' 하나로 판도를 뒤집기까지 남모를 시간이 있었거든요.` : `${figureName}, 오늘의 자리에 오르기까지 모두의 예상을 깬 결정적 순간이 있었죠.`), visualGuide: '인물의 강렬한 클로즈업과 핵심 키워드', imageSearchKeyword: `${figureName} 대표 인터뷰 사진`, visualEffect: '임팩트 줌인', bgmSuggestion: '잔잔하고 묵직한 피아노' },
      { sceneNumber: 2, timeRange: '00:05 - 00:10', narration: buzzSnippet ? `${buzzSnippet}.` : '화려한 겉모습과 달리, 시작점엔 끝없는 고민과 치열한 현장의 시간이 쌓여 있었거든요.', visualGuide: '최근 화제 배경 및 자료 사진', imageSearchKeyword: `${figureName} 최근 화제 뉴스`, visualEffect: '좌측 패닝' },
      { sceneNumber: 3, timeRange: '00:10 - 00:15', narration: '주변에서는 현실적으로 어렵다며 고개를 저었지만, 쉽게 물러서지 않았답니다.', visualGuide: '어려웠던 초기 현장과 회의실 모습', imageSearchKeyword: `${figureName} 과거 초기 시절`, visualEffect: '슬로우 줌인' },
      { sceneNumber: 4, timeRange: '00:15 - 00:20', narration: issueSnippet ? `${issueSnippet}. 이 대목에서 진짜 승부사 기질이 드러났죠.` : '당장의 편안함보다 본질과 기본기를 먼저 붙잡고 밤낮없이 파고들었던 거예요.', visualGuide: '핵심 문제에 몰입하는 실루엣', imageSearchKeyword: `${figureName} 열정 현장 모습`, visualEffect: '우측 패닝' },
      { sceneNumber: 5, timeRange: '00:20 - 00:25', narration: kw ? `남들이 외면하던 '${kw}'의 가치를 끝까지 믿고 뚝심 있게 밀어붙였대요.` : '남들이 주저하며 돌아갈 때, 오히려 한 걸음 더 들어가 해법을 찾아냈대요.', visualGuide: '결단력 있는 눈빛과 데이터·현장 컷', imageSearchKeyword: `${figureName} 결단 인터뷰`, visualEffect: '화이트 플래시' },
      { sceneNumber: 6, timeRange: '00:25 - 00:30', narration: '작은 디테일 하나도 타협하지 않는 집념 덕분에 결국 사람들의 마음이 움직이기 시작했거든요.', visualGuide: '성과가 드러나는 성장 곡선과 현장 반응', imageSearchKeyword: `${figureName} 성과 달성 기사`, visualEffect: '2단 줌인' },
      { sceneNumber: 7, timeRange: '00:30 - 00:35', narration: angleSnippet ? `그래서 ${angleSnippet}라는 찬사가 쏟아진 거죠.` : '마침내 묵묵히 버텨온 시간이 결과로 증명되며 업계와 대중이 동시에 반응했답니다.', visualGuide: '환호와 언론 조명을 받는 무대', imageSearchKeyword: `${figureName} 화제 보도`, visualEffect: '따뜻한 비네팅' },
      { sceneNumber: 8, timeRange: '00:35 - 00:40', narration: '성과를 얻은 뒤에도 공을 혼자 차지하지 않고 함께 땀 흘린 동료와 대중을 먼저 챙겼어요.', visualGuide: '동료·팬과 웃으며 인사하는 모습', imageSearchKeyword: `${figureName} 팬 소통 미담`, visualEffect: '슬로우 줌아웃' },
      { sceneNumber: 9, timeRange: '00:40 - 00:45', narration: '화려한 말보다 행동으로 약속을 지켜온 뚝심이 오늘의 두터운 신뢰를 만든 셈이죠.', visualGuide: '당당한 카리스마와 박수 갈채', imageSearchKeyword: `${figureName} 공식 행사 연설`, visualEffect: '다이내믹 줌인' },
      { sceneNumber: 10, timeRange: '00:45 - 00:50', narration: '위기 앞에서는 냉철하게, 사람 앞에서는 따뜻하게 다가가는 리더십이 오래 남네요.', visualGuide: '진솔한 인터뷰 클로즈업', imageSearchKeyword: `${figureName} 최근 인터뷰 미소`, visualEffect: '시네마틱 페이드' },
      { sceneNumber: 11, timeRange: '00:50 - 00:55', narration: '꾸준함과 진정성이 결국 가장 멀리 간다는 걸 이번에도 멋지게 증명해주었거든요.', visualGuide: '희망찬 전경과 엔딩 준비 컷', imageSearchKeyword: `${figureName} 비전 글로벌`, visualEffect: '천천히 줌인' },
      { sceneNumber: 12, timeRange: '00:55 - 01:00', narration: `${figureName}의 다음 행보가 더욱 기대되는데요, 여러분은 어떤 순간이 가장 인상 깊으셨나요?`, visualGuide: '여운 남는 엔딩 타이틀과 댓글 유도', imageSearchKeyword: `${figureName} 프로필 고화질`, visualEffect: '엔딩 페이드 아웃', bgmSuggestion: '희망찬 피아노 아웃트로' },
    ];
  }

  const scenesToReturn = targetDuration === 45 ? fallback60Scenes.slice(0, 9) : fallback60Scenes;
  const tonedFallback = applyToneToShortsPayload(
    {
      hooks: fallbackHooks,
      titles: fallbackTitles,
      hashtags: ['#shorts', `#${figureName.replace(/\s+/g, '')}`, '#기업인스토리'],
      cleanSemanticTags: [`#${figureName.replace(/\s+/g, '')}`, '#인물스토리', '#성공미담'],
      firstTwoLinesSeo: `${figureName}의 긍정적 리더십과 통 큰 결단 미담 스토리.`,
      timestamps: [
        { time: '00:00', label: '강렬한 후킹' },
        { time: '00:15', label: '의외의 배경과 디테일' },
        { time: '00:40', label: '통 큰 결단과 성취' },
        { time: '00:55', label: '여운 엔딩' },
      ],
      commentBaits: {
        debateQuestion: `${figureName} 님의 이야기 중 가장 인상 깊었던 포인트는 무엇인가요?`,
        optionA: 'A. 위기에도 원칙을 지킨 통 큰 결단',
        optionB: 'B. 격의 없이 다가가는 소탈한 인간미',
        pinnedCommentDraft: `📌 [댓글 소통] ${figureName} 님의 이야기 중 가장 멋졌던 장면을 댓글로 남겨주세요! 👇`,
      },
      semanticKeywords: [figureName, '인물 미담', '통 큰 결단', '소탈한 매력', '리더십'],
      shareTrigger: `따뜻한 영감이 필요한 지인에게 이 영상을 공유해보세요! 🚀`,
      description: `${figureName}의 긍정적인 미담과 통 큰 결단을 5단계 쇼츠 서사로 재구성한 브랜드 세이프 콘텐츠입니다.`,
      pinnedComment: `📌 [댓글 소통] ${figureName} 님의 이야기 중 가장 멋졌던 장면을 댓글로 남겨주세요! 👇`,
      fullScript: scenesToReturn.map((s) => s.narration).join('\n\n'),
      scenes: scenesToReturn,
      copyrightDefenseNote: '공인된 사실(Fact)과 긍정적 미담·리더십을 바탕으로 창작한 100% 브랜드 세이프 2차 저작물입니다.',
    },
    speechTone
  );

  return NextResponse.json({
    ...tonedFallback,
    isFallback: true,
    fallbackReason: lastErrorMsg || 'offline_fallback',
    safetyCheck: buildNormalizedSafetyCheck(null, tonedFallback.fullScript),
  });
}
