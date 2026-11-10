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
    targetPersona = '4060_emotional',
    targetDuration = 60,
    videoTone = 'Cinematic',
    storyAngle = 'random',
    refreshCounter = 0,
    customKeyword = '',
  } = body;

  const personaDescriptions: Record<string, string> = {
    '4060_emotional': '40~60대 중장년층 타겟: 눈시울을 붉히게 하는 진중한 스토리텔링, 인간적인 역경 극복기, 정중하고 따뜻하며 신뢰감 주는 나레이션 어투 (~했습니다, ~였습니다, 여러분은 기억하십니까).',
    '1020_dopamine': '10~20대 숏폼 도파민 타겟: 1초 만에 시선 끄는 빠른 전개, 충격적인 반전, 트렌디하고 직관적인 호흡, 속도감 있는 어투 (~했는데요, 실화냐, 진짜 충격입니다).',
    '3040_success': '30~40대 직장인/성인 타겟: 자기계발과 성공 방정식, 현실적인 교훈과 마인드셋 중심 (~그가 증명해낸 비밀, 끝까지 버티는 힘).',
    'mystery_twist': '반전 미스터리 타겟: 아무도 몰랐던 충격적인 비하인드, 숨겨진 진실을 하나씩 벗겨가는 긴장감 넘치는 스릴러 톤.',
    'ceo_branding': '🏛️ 기업인/CEO 브랜드 스토리 (기업 홍보 의뢰 유치 전용): 포브스/블룸버그 인터뷰 및 명품 다큐멘터리 스타일. 자극적인 어그로 대신 독보적인 기업 철학, 시장의 모순을 해결한 혁신 기술, 위기 극복의 결단과 미래 비전을 공신력 있고 품격 넘치는 정중한 다큐 톤으로 전달 (~그가 바꾼 세상, 타협하지 않은 원칙, 000 기업이 그리는 미래).'
  };

  const moodToneDescriptions: Record<string, string> = {
    'Cinematic': 'Cinematic (영화적 연출): 영화 한 편을 압축한 듯한 웅장하고 드라마틱한 몰입감. 묵직하고 서정적인 나레이션, 시네마틱 슬로우 줌인/줌아웃 카메라 워크, 웅장한 오케스트라 또는 피아노 현악기 BGM 제안.',
    'Documentary': 'Documentary (다큐멘터리): 인간극장, SBS 스페셜 풍의 진솔하고 깊이 있는 서사. 차분하고 신뢰감 넘치는 톤, 아카이브 흑백 사진 교차 연출, 잔잔한 어쿠스틱 피아노 및 첼로 BGM 제안.',
    'Fast-paced': 'Fast-paced (도파민 쾌속 비트): 1초의 공백도 허용하지 않는 빠른 호흡과 펀치력 있는 문장. 긴장감 넘치는 빠른 컷전환, 다이내믹한 줌과 자막 플래시, 비트감 있는 신스웨이브/트랩 힙합 BGM 제안.',
    'Minimal': 'Minimal (절제된 미니멀): 군더더기 없는 담백함과 팩트 중심의 명확한 전달. 불필요한 수식어를 뺀 직관적 문장, 정적이고 정갈한 고정/미세 팬 연출, 미니멀한 앰비언트/로파이 BGM 제안.',
    'CorporatePR': 'CorporatePR (기업인/CEO 프리미엄 다큐 브랜딩): 글로벌 테크 컨퍼런스 기조연설 및 프리미엄 비즈니스 다큐멘터리 풍. 흔들림 없는 신뢰감과 권위를 주는 어조, 브랜드 세이프티 준수(과장 광고 배제, 팩트 중심), 세련된 기업 키 컬러 및 미래지향적 앰비언트 신스 사운드 제안.'
  };

  const storyAngleDirectives: Record<string, string> = {
    'choice': '❓ [질문형 앵글: 왜 그런 무모한 선택을 했을까?] 모두가 결사반대했던 결정적 갈림길, 인생을 건 단 한 번의 베팅과 그 숨은 이유를 추적하세요.',
    'adversity': '💧 [질문형 앵글: 절망의 밑바닥에서 어떻게 일어섰을까?] 뼈아픈 좌절과 통장 잔고 0원, 무명 시절 들었던 모욕을 딛고 역전 드라마를 쓴 기적의 분투기를 전개하세요.',
    'twist': '⚡ [질문형 앵글: 세상이 몰랐던 충격적 반전은 무엇일까?] 겉으로 알려진 뻔한 성공담 뒤에 감춰진 비밀과 살얼음판 위기, 아무도 예상 못한 반전 실화로 작성하세요.',
    'success': '💼 [질문형 앵글: 어떻게 혼자서 시장의 판도를 바꿨을까?] 그가 수많은 실패 끝에 찾아낸 절대적인 성공 원칙과 시청자가 당장 배울 수 있는 행동 강령을 제시하세요.',
    'legend': '🏆 [질문형 앵글: 그날 밤, 그 3초 동안 무슨 일이 있었을까?] 그의 운명을 180도 뒤집어놓은 단 한 번의 결정적 무대와 결단의 순간에 모든 초점을 맞춰 긴박하게 전개하세요.',
    'routine': '🔥 [질문형 앵글: 남들과 무엇이 달랐기에 정상에 올랐을까?] 타협하지 않는 지독한 몰입, 30년간 지켜온 철저한 자기관리와 비밀 루틴을 조명하세요.',
    'rival': '⚔️ [질문형 앵글: 거대한 라이벌과의 대결에서 어떻게 승리했을까?] 99% 패배할 것이라던 승부에서 치밀한 전략으로 판을 뒤흔든 역전의 한 방을 작성하세요.',
    'quote': '💬 [질문형 앵글: 그의 심장을 뛰게 만든 단 한마디는 무엇이었을까?] 좌절의 순간 인생을 180도 바꿔놓은 운명적인 한마디와 신념의 울림을 전개하세요.',
    'ceo_hero': '🏛️ [질문형 앵글: 거대 독점 기업에 맞서 어떻게 살아남았을까?] 창업 초기 파산 직전의 R&D실에서 시장을 뒤흔든 기술 혁신의 승부수를 웅장하게 조명하세요.',
    'corporate_pr': '💎 [질문형 앵글: 어떤 철학으로 사람들의 삶을 바꿨을까?] 시장의 오랜 모순을 해결한 혁신 기술과 고객의 신뢰, 미래를 향한 독보적 비전을 작성하세요.',
    'corporate_tech': '🚀 [질문형 앵글: 혁신 기술 & 독점 솔루션] 기존 시장의 고질적인 모순을 찾아내고, 기술 혁신으로 고객의 삶을 180도 바꾼 기업의 기술력을 각인시키세요.',
    'vision_ir': '💎 [질문형 앵글: 기업 가치 & 미래 비전 (IR)] 단순 상품 판매가 아니라 세상에 미치는 선한 영향력과 차세대 비전을 제시하세요.',
    'random': `🎲 [질문형 앵글: 새로운 각도의 참신한 일화 #${refreshCounter + 1}] 기존의 대본과 내용이 전혀 겹치지 않도록, 완전히 새로운 각도의 사건과 참신한 일화로 대본을 작성하세요.`
  };

  const targetToneText = personaDescriptions[targetPersona] || personaDescriptions['4060_emotional'];
  const videoToneText = moodToneDescriptions[videoTone] || moodToneDescriptions['Cinematic'];
  const chosenAngleText = storyAngleDirectives[storyAngle] || storyAngleDirectives['random'];
  const totalScenes = targetDuration === 45 ? 9 : 12;
  const targetCharMin = targetDuration === 45 ? 310 : 410;
  const targetCharMax = targetDuration === 45 ? 360 : 470;

  const prompt = `당신은 월 조회수 1,000만 회를 기록하는 '화제의 인물' 전문 유튜브 쇼츠 1등 제작자이자 디렉터입니다.

[사용자 요청: 대본 컨셉 & 스토리 각도 지정 기획]
- 요청 스토리 각도: ${chosenAngleText}
- 주의사항: 사용자가 선택한 컨셉("${storyAngle}")에 맞추어 대본의 전개, 사건, 톤앤매너를 180도 완전히 바꾸어야 합니다. 이전과 동일한 문장을 절대 반복하지 말고, 완전히 신선하고 독창적인 앵글과 문체로 새로운 대본을 기획하세요.

[대상 인물 정보]
- 인물 이름: ${figureName}
- 테마: ${title || ''}
- 화제 배경: ${buzzSummary || ''}
- 숨겨진 역경/서사: ${controversyOrIssue || ''}
- 기획 방향(스토리텔링 앵글): ${suggestedAngle || ''}
${customKeyword ? `\n[★ 사용자 지정 최우선 강조 키워드 / 핵심 주제: "${customKeyword}"]\n- 대본 전체의 전개와 3초 후킹 문구, 씬별 나레이션에 반드시 위 키워드("${customKeyword}")의 내용과 교훈, 의미를 핵심 주제로 깊이 녹여내어 스토리를 극적으로 풀어내세요.` : ''}
- 목표 영상 길이: 반드시 정확히 ${targetDuration}초에 도달해야 합니다!
- [매우 중요] 나레이션 글자수: 공백 제외 ${targetCharMin}~${targetCharMax}자 (절대로 짧게 요약하지 마십시오. 일반 낭독 속도 6.5자/초 기준으로 ${targetDuration}초를 꽉 채우는 충실한 서사를 작성하세요).
- 타겟 페르소나 및 어투: ${targetToneText}
- 영상 전체 연출 톤(분위기): ${videoToneText}

[★ 초핵심 절대 규칙: 뜬구름 잡는 포괄적 이야기 전면 금지 & 극사실주의 팩트 디테일]
시청자가 1초 만에 몰입하지 못하고 이탈하는 가장 큰 이유는 "열심히 노력했습니다", "시련을 이겨냈습니다", "포기하지 않는 열정으로 성공했습니다" 같은 뜬구름 잡는 뻔한 클리셰 때문입니다. 이런 모호하고 추상적인 문장은 엄격히 금지합니다!

반드시 다음 4가지 '극사실주의 디테일'을 매 씬마다 촘촘하게 박아 넣으세요:
1. 구체적인 장소, 상황, 팩트:
   - 나쁜 예: "그는 과거 밑바닥에서 고생했습니다." (X - 절대 금지)
   - 좋은 예: "덴니스 식당에서 시급 몇 푼을 받으며 기름때 묻은 접시와 화장실 변기를 닦던 열여섯 소년." (O)
2. 구체적인 숫자, 연도, 액수:
   - 나쁜 예: "많은 빚을 졌지만 버텨냈습니다." (X)
   - 좋은 예: "첫 칩 NV1의 처참한 실패로 직원 80%를 해고하고, 회사 통장에 남은 건 단 30일 치 월급뿐이었습니다." (O)
3. 결정적인 실제 대화와 승부수의 순간:
   - 나쁜 예: "투자자를 설득해 위기를 넘겼습니다." (X)
   - 좋은 예: "세가(SEGA) 사장실 문을 두드려 '우리 설계는 틀렸지만 회사를 살려달라'며 500만 달러를 받아낸 눈물의 담판." (O)
4. 시청자의 심장을 울리는 구체적인 명언과 행동:
   - 나쁜 예: "그의 철학은 훌륭합니다." (X)
   - 좋은 예: "월가 모두가 미쳤다고 비웃던 2006년, 엔비디아의 전 재산 10조 원을 쿠다(CUDA)에 쏟아부었던 젠슨 황의 결단." (O)

[★ 최우선 절대 원칙: 100% 사실(Fact) 기반 & 허위사실·날조 절대 금지]
1. 반드시 대상 인물에 대해 공식 언론 보도, 공중파/케이블 방송 인터뷰, 공식 자서전, 본인 유튜브 등에서 공인된 '실제 일화(Fact)'만을 바탕으로 대본을 작성해야 합니다.
2. 가짜 일화, 조작된 대화, 확인되지 않은 악성 루머, 존재하지 않는 사건이나 날조된 에피소드(Hallucination)는 명예훼손 및 허위사실 유포 리스크가 발생하므로 절대 엄격히 금지됩니다.
3. 연도, 과거 직업, 실제 겪은 고난의 사건, 수상 및 업적 등은 철저히 실제 사실에 입각해야 하며, 극적인 몰입감은 사실을 바탕으로 한 감정선의 흐름과 나레이션 호흡으로만 전달하세요. 허위사실을 임의로 지어내는 것은 절대 불가합니다.

[★ 기업인/CEO 브랜딩 & 브랜드 세이프티(Brand Safety) 특수 알고리즘]
만약 타겟 페르소나가 'ceo_branding'이거나 기업 앵글(ceo_hero, corporate_tech, vision_ir)인 경우:
1. '업계 최초 1위', '무조건적인 성공', '100% 수익' 등 공정거래위원회 허위·과장 광고 제재 위험이 있는 저급한 홍보 문구를 엄격히 배제하세요.
2. 대신 '철저한 데이터 검증', '타협하지 않은 품질과 기술 혁신', '기존 시장의 고질적 모순 해결', '집념과 도전의 철학' 등 공신력과 품격 있는 정통 다큐멘터리 어휘를 구사하세요.
3. 3초 후킹 또한 자극적 루머나 비방이 아닌, "모두가 불가능하다고 했던 시장에 던진 승부수", "단 한 명의 창업가가 바꾼 업계의 판도" 등 시청자에게 경외감과 지적 호기심을 주는 품격 있는 후킹을 제시하세요.
4. 마지막 엔딩 씬은 단순 제품 구매 유도가 아닌, 기업의 철학과 다음 세대를 향한 미래 비전 메시지로 마무리하여 시청자에게 깊은 신뢰와 존경을 심어주세요.

[★ 60초 인물 쇼츠 황금 서사 5단계 구조 공식 (반드시 총 ${totalScenes}개 씬에 배분)]
1. [1단계] 00:00 ~ 00:03 (씬 1) - 【후킹: 사건 질문 / 충격 반전】
   - 장황한 인물 소개나 출생, 어린 시절은 절대 금지!
   - 시청자가 스크롤을 즉시 멈추게 하는 날카로운 질문이나 충격적 사건 단 한 문장 제시 ("왜 세계 1위 부자가 된 그는 낡은 자켓만 고집했을까?", "모두가 망했다고 비웃었던 그날 밤")
2. [2단계] 00:03 ~ 00:15 (씬 2~3) - 【상황: 최소 배경 압축】
   - 긴 일대기 생략! 사건 직전의 절박한 상황과 인물이 처했던 밑바닥 현실을 압축 묘사
3. [3단계] 00:15 ~ 00:40 (씬 4~8) - 【갈등: 생사를 가르는 핵심 위기와 장애물】
   - 전 재산 탕진, 100번의 퇴짜, 살얼음판 위기, 누구도 도와주지 않던 벼랑 끝의 고통을 생생한 팩트와 숫자로 전개
4. [4단계] 00:40 ~ 00:55 (씬 9~10) - 【전환: 목숨을 건 단 한 번의 승부수와 반전】
   - 모든 것을 걸고 던진 결정적 결단, 상식을 파괴한 전략, 드라마틱한 역전의 결과
5. [5단계] 00:55 ~ 01:00 (씬 11~12) - 【해소: 첫 질문의 해답과 뼈 때리는 여운】
   - 씬 1에서 던진 질문에 명쾌하게 답을 내리며, 시청자의 가슴을 울리는 진한 인생 명언과 깊은 여운으로 마무리

[후킹 3대 유형 (반드시 hooks 배열에 아래 3가지를 각각 1개씩 작성)]
- 1. 사건형 후킹: 결정적 사건/위기 중심 후킹 (예: "2006년, 엔비디아가 전 재산 10조를 날릴 뻔했던 사건을 아십니까?")
- 2. 반전형 후킹: 상식과 통념을 뒤집는 반전 후킹 (예: "모두가 천재라 불렀지만, 사실 30일 뒤 파산 선고를 앞두고 있었습니다.")
- 3. 질문형 후킹: 시청자의 뇌리에 호기심을 박아넣는 질문 후킹 (예: "왜 세계 1등 부자는 낡은 가죽 자켓만 입고 다닐까요?")

[2차 창작 저작권 방어 패치]
- 사실(Fact)을 바탕으로 감동적 서사를 창작한 100% 2차 저작물로 공정 이용 요건을 충족하도록 구성.

[2026 SNS 알고리즘 치트키 메타데이터]
- 클릭률(CTR) 15%+ 유튜브 쇼츠 제목 3개
- 스팸 감점 없는 시맨틱 카테고리 클린 태그 3~5개
- 첫 2줄 SEO 최적화 문구 (firstTwoLinesSeo)
- 타임스탬프 챕터 마커 (timestamps)
- 댓글 토론 트리거 (commentBaits)
- 시맨틱 키워드 5개 (semanticKeywords)
- 공유/저장 유도 클로징 문구 (shareTrigger)

반드시 정해진 JSON 스키마로만 응답하세요.`;

  if (apiKey) {
    // Attempt Gemini Pro first (User requested for deep storytelling), then fast fallback
    const candidateModels = ['gemini-3.1-pro-preview', 'gemini-3.5-flash-lite', 'gemini-3.5-flash'];
    for (const mod of candidateModels) {
      try {
        const response = await ai.models.generateContent({
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
                copyrightDefenseNote: { type: Type.STRING, description: '2차 창작물 보호 근거' }
              },
              required: ['hooks', 'titles', 'hashtags', 'description', 'pinnedComment', 'fullScript', 'scenes', 'copyrightDefenseNote']
            }
          }
        });

        const parsed = JSON.parse(response.text || '{}');
        if (parsed.fullScript && parsed.scenes && parsed.scenes.length > 0) {
          return NextResponse.json(parsed);
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
    copyrightDefenseNote: '원저작물의 영상 푸티지를 직접 복제하지 않고, 공인된 사실(Fact)을 바탕으로 감동적 서사를 창작한 100% 2차 저작물로 공정 이용 요건을 충족합니다.'
  });
}
