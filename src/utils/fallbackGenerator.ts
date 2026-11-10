import { getSceneFallbackImage } from './sceneImages';

export function generateClientFallbackScript(
  figureName: string = '화제의 인물',
  targetDuration: 45 | 60 = 60,
  refreshCounter: number = 0,
  storyAngle: string = 'random',
  targetPersona: string = '4060_emotional',
  customKeyword: string = ''
) {
  const kw = customKeyword ? customKeyword.trim() : '';
  const isJensen = figureName.includes('젠슨') || figureName.includes('Jensen') || figureName.includes('엔비디아');

  let fallback60Scenes: any[] = [];
  let fallbackHooks: any[] = [];
  let fallbackTitles: any[] = [];

  // Determine angle behavior: if random, cycle through distinct angles
  const effectiveAngle = storyAngle === 'random' 
    ? (refreshCounter % 4 === 0 ? 'adversity' : refreshCounter % 4 === 1 ? 'twist' : refreshCounter % 4 === 2 ? 'success' : 'legend')
    : storyAngle;

  if (effectiveAngle === 'adversity') {
    // 💧 감동 역전 실화
    if (isJensen) {
      fallbackHooks = [
        { type: 'question', label: '충격 실화형', text: kw ? `'${kw}'의 신화 젠슨 황이 16살에 식당 변기를 닦았다는 사실을 아십니까?` : `세계 시총 1위 젠슨 황이 열여섯 살에 식당 변기를 닦았다는 사실을 아십니까?` },
        { type: 'provocative', label: '눈물의 고생담', text: `첫 사업 실패로 직원 80%를 해고하고, 통장에 단 30일 치 월급만 남았던 젠슨 황.` },
        { type: 'emotional', label: '인간 승리', text: `기름때 묻은 접시를 닦던 무일푼 소년이 4,000조 황제가 되기까지의 처절한 눈물.` }
      ];
      fallbackTitles = [
        `식당 접시닦이에서 4,000조 황제가 된 젠슨 황의 눈물 실화 #shorts`,
        `통장 잔고 0원, 직원 80% 해고했던 젠슨 황의 절망적인 과거 #감동실화`,
        `16살에 화장실 청소하던 소년이 세계를 지배한 방법 #인생역전`
      ];
      fallback60Scenes = [
        { sceneNumber: 1, timeRange: '00:00 - 00:05', narration: '세계 시총 1위 기업 엔비디아의 젠슨 황, 사실 그는 열여섯 살에 식당 화장실 변기를 닦던 소년이었습니다.', visualGuide: '1970년대 미국 덴니스 레스토랑 아카이브 사진과 흑백 교차', imageSearchKeyword: '젠슨황 청년 시절 덴니스 레스토랑', visualEffect: '슬로우 줌인', bgmSuggestion: '잔잔하고 묵직한 피아노' },
        { sceneNumber: 2, timeRange: '00:05 - 00:10', narration: '말도 통하지 않던 미국에 홀로 던져져, 매일 기름때에 찌든 접시 수천 개를 닦아야 했던 지독한 가난.', visualGuide: '거친 손과 어두운 주방에서 묵묵히 일하는 실루엣', imageSearchKeyword: '식당 주방 접시닦이 아카이브', visualEffect: '흑백 컷전환', bgmSuggestion: '애잔한 첼로 선율' },
        { sceneNumber: 3, timeRange: '00:10 - 00:15', narration: '하지만 그는 불평하는 대신 "세상에서 화장실 청소를 가장 완벽하게 하는 사람이 되겠다"고 다짐했습니다.', visualGuide: '눈물을 삼키며 이를 악무는 청년의 결연한 눈빛', imageSearchKeyword: '젠슨황 대학 시절 학사모', visualEffect: '임팩트 줌인' },
        { sceneNumber: 4, timeRange: '00:15 - 00:20', narration: '1993년 서른 살에 엔비디아를 창업했지만, 첫 번째 칩 NV1은 시장에서 처참하게 실패했습니다.', visualGuide: '텅 빈 실리콘밸리 초기 사무실과 쌓인 실패작 기판', imageSearchKeyword: 'Nvidia NV1 첫번째 칩 실패', visualEffect: '좌측 패닝' },
        { sceneNumber: 5, timeRange: '00:20 - 00:25', narration: '직원 80%를 눈물로 정리해고해야 했고, 회사 통장에는 고작 30일 치 월급만 남아있었습니다.', visualGuide: '어두운 회의실에서 고개 숙인 채 고뇌하는 창업자', imageSearchKeyword: '젠슨황 1995년 위기', visualEffect: '슬로우 줌아웃' },
        { sceneNumber: 6, timeRange: '00:25 - 00:30', narration: '파산 직전의 절벽 끝에서 그는 자신의 모든 자존심을 버리고 일본 세가(SEGA) 사장을 찾아갔습니다.', visualGuide: '도쿄의 비 내리는 밤거리와 절박한 담판 현장', imageSearchKeyword: '젠슨황 세가 투자 유치', visualEffect: '스피드 줌인' },
        { sceneNumber: 7, timeRange: '00:30 - 00:35', narration: '"우리 기술 설계는 실패했습니다. 하지만 기술력은 진짜입니다." 그의 진심에 기적 같은 500만 달러 투자가 이뤄졌습니다.', visualGuide: '계약서에 서명하는 떨리는 손과 극적인 반전', imageSearchKeyword: 'Nvidia RIVA 128 성공', visualEffect: '화이트 플래시' },
        { sceneNumber: 8, timeRange: '00:35 - 00:40', narration: '그 돈으로 완성한 RIVA 128이 4달 만에 100만 개가 팔려나가며, 기적처럼 회사가 부활했습니다.', visualGuide: '가파르게 상승하는 주가와 환호하는 연구진들', imageSearchKeyword: '엔비디아 나스닥 상장 1999', visualEffect: '우측 패닝' },
        { sceneNumber: 9, timeRange: '00:40 - 00:45', narration: '밑바닥 화장실 청소부터 파산 위기까지 버텨낸 그 지독한 회복탄력성이 오늘의 황제를 만들었습니다.', visualGuide: '시그니처 가죽 자켓을 입고 무대에 선 압도적인 아우라', imageSearchKeyword: '젠슨황 가죽자켓 키노트 고화질', visualEffect: '시네마틱 페이드' },
        { sceneNumber: 10, timeRange: '00:45 - 00:50', narration: '지금도 젠슨 황은 말합니다. "고통과 시련은 실패가 아니라, 나를 단련시키는 가장 값진 축복이다."', visualGuide: '진심 어린 눈빛으로 청년들에게 강연하는 모습', imageSearchKeyword: '젠슨황 스탠퍼드 졸업 축사', visualEffect: '천천히 줌인' },
        { sceneNumber: 11, timeRange: '00:50 - 00:55', narration: '통장 잔고 0원에서 세계 1위까지, 불가능을 증명해낸 그의 눈물겨운 발자취.', visualGuide: '글로벌 무대에서 수만 명의 기립 박수를 받는 순간', imageSearchKeyword: '젠슨황 컴퓨텍스 기립박수', visualEffect: '와이드 줌아웃' },
        { sceneNumber: 12, timeRange: '00:55 - 01:00', narration: '오늘 지독한 시련 앞에 서 있는 당신에게, 젠슨 황의 실화가 새로운 용기가 되길 바랍니다.', visualGuide: '신뢰감 있는 따뜻한 엔딩 컷과 구독 유도', imageSearchKeyword: '젠슨황 온화한 미소 클로즈업', visualEffect: '엔딩 페이드 아웃', bgmSuggestion: '희망찬 피아노 피날레' }
      ];
    } else {
      fallbackHooks = [
        { type: 'question', label: '눈물의 첫 시작', text: kw ? `'${kw}' 뒤에 숨겨진 ${figureName} 님의 10년 무명 단칸방 시절을 아십니까?` : `가장 처절했던 밑바닥 시절, ${figureName} 님이 삼켜야 했던 눈물을 아십니까?` },
        { type: 'provocative', label: '충격적 사실', text: `통장 잔고 0원, 100번 넘는 거절 끝에 마침내 판을 뒤집어버린 ${figureName}의 반전 실화.` },
        { type: 'emotional', label: '가슴 뭉클한 한마디', text: `"너는 절대 성공 못 해." 수많은 조롱을 온몸으로 받아냈던 그날 밤의 맹세.` }
      ];
      fallbackTitles = [
        `통장 잔고 0원에서 대한민국 1등이 된 ${figureName}의 충격 실화 #shorts`,
        `100번 거절당하고 피눈물 흘렸던 ${figureName}의 반전 인생 #감동실화`,
        `모두가 끝났다고 비웃었을 때 ${figureName}이 보여준 기적 #인생역전`
      ];
      fallback60Scenes = [
        { sceneNumber: 1, timeRange: '00:00 - 00:05', narration: `화려한 지금의 모습과 달리, ${figureName} 님은 10년간 단칸방에서 하루 삼각김밥 하나로 버텼습니다.`, visualGuide: '초라하지만 결연한 눈빛의 과거 흑백 사진', imageSearchKeyword: `${figureName} 과거 무명시절`, visualEffect: '슬로우 줌인', bgmSuggestion: '애잔한 피아노 선율' },
        { sceneNumber: 2, timeRange: '00:05 - 00:10', narration: '"너는 재능이 없다, 다른 길 찾아라"는 차가운 폭언을 매일같이 들어야 했습니다.', visualGuide: '차가운 문을 닫고 나서는 쓸쓸한 뒷모습', imageSearchKeyword: `${figureName} 오디션 탈락`, visualEffect: '좌측 패닝' },
        { sceneNumber: 3, timeRange: '00:10 - 00:15', narration: kw ? `하지만 그는 상처받아 숨는 대신, '${kw}'이라는 본질 하나만 붙잡고 거울 앞에서 울었습니다.` : '하지만 그는 상처받아 숨는 대신, 단점을 1,000번씩 고치며 거울 앞에서 피눈물을 훔쳤습니다.', visualGuide: '어두운 방에서 눈물을 닦으며 자세를 고쳐잡는 장면', imageSearchKeyword: `${figureName} 연습실 눈물`, visualEffect: '2단 스피드 줌' },
        { sceneNumber: 4, timeRange: '00:15 - 00:20', narration: '발목이 꺾이고 목이 쉬어 피가 나도, 그의 연습실 불빛은 새벽 4시까지 꺼지지 않았습니다.', visualGuide: '깊은 밤 홀로 켜진 조명과 땀에 젖은 실루엣', imageSearchKeyword: `${figureName} 새벽 연습 열정`, visualEffect: '천천히 줌인' },
        { sceneNumber: 5, timeRange: '00:20 - 00:25', narration: '통장 잔고 0원, 월세가 밀려 쫓겨날 위기 속에서 마침내 인생 마지막 기회가 찾아왔습니다.', visualGuide: '떨리는 손으로 문을 열고 무대로 나서는 순간', imageSearchKeyword: `${figureName} 첫 무대 오디션`, visualEffect: '슬로우 줌아웃' },
        { sceneNumber: 6, timeRange: '00:25 - 00:30', narration: '모두가 냉소를 보낼 때, 그는 10년간 흘린 피와 땀을 그 단 3분에 전부 쏟아부었습니다.', visualGuide: '공기를 얼어붙게 만든 압도적인 몰입과 절규', imageSearchKeyword: `${figureName} 레전드 무대`, visualEffect: '다이내믹 줌인' },
        { sceneNumber: 7, timeRange: '00:30 - 00:35', narration: '단 10초 만에 심사위원들의 표정은 경악으로 바뀌었고, 장내는 정적에 휩싸였습니다.', visualGuide: '놀라움에 입을 다물지 못하는 관객과 관계자들', imageSearchKeyword: `${figureName} 화제의 무대 반응`, visualEffect: '화이트 플래시' },
        { sceneNumber: 8, timeRange: '00:35 - 00:40', narration: '그날 이후, 그를 조롱했던 모든 사람들은 앞다투어 그에게 고개를 숙였습니다.', visualGuide: '쏟아지는 섭외 기사와 인터뷰 헤드라인', imageSearchKeyword: `${figureName} 라이징 스타 기사`, visualEffect: '우측 패닝' },
        { sceneNumber: 9, timeRange: '00:40 - 00:45', narration: '100번의 거절은 그를 무너뜨린 것이 아니라, 아무도 넘볼 수 없는 괴물로 단련시켰습니다.', visualGuide: '정상에서 당당하게 마이크를 쥔 압도적 카리스마', imageSearchKeyword: `${figureName} 전성기 카리스마`, visualEffect: '슬로우 줌인' },
        { sceneNumber: 10, timeRange: '00:45 - 00:50', narration: '"세상이 당신을 버렸다고 느낄 때 포기하지 마세요. 그것은 가장 위대한 반전의 전조입니다."', visualGuide: '따뜻한 눈빛으로 시청자를 위로하는 인터뷰 클립', imageSearchKeyword: `${figureName} 인터뷰 명언`, visualEffect: '천천히 줌인' },
        { sceneNumber: 11, timeRange: '00:50 - 00:55', narration: '통장 잔고 0원에서 정상에 오르기까지, 피눈물로 써 내려간 그의 감동적인 승부수.', visualGuide: '환호하는 수만 명의 팬들과 빛나는 조명', imageSearchKeyword: `${figureName} 시상식 대상`, visualEffect: '와이드 줌아웃' },
        { sceneNumber: 12, timeRange: '00:55 - 01:00', narration: '오늘 쓰러질 것 같은 당신에게, 이 실화가 끝까지 버텨낼 힘이 되길 진심으로 응원합니다.', visualGuide: '따뜻한 미소와 구독/좋아요 유도 엔딩 카드', imageSearchKeyword: `${figureName} 환한 미소 프로필`, visualEffect: '엔딩 페이드 아웃', bgmSuggestion: '벅차오르는 피아노 피날레' }
      ];
    }
  } else if (effectiveAngle === 'twist') {
    // ⚡ 충격 반전 비하인드
    fallbackHooks = [
      { type: 'provocative', label: '충격 반전', text: `세상은 그를 '운 좋은 천재'라 부르지만, 사실 99%는 모르는 충격적인 사건이 있었습니다.` },
      { type: 'question', label: '비하인드 폭로', text: `${figureName} 님이 성공하기 직전, 가장 믿었던 동업자에게 배신당했던 사건을 아십니까?` },
      { type: 'emotional', label: '숨겨진 진실', text: `언론에 한 줄도 보도되지 않았던 ${figureName}의 사형선고 같았던 위기.` }
    ];
    fallbackTitles = [
      `[충격] ${figureName}, 세상에 감춰졌던 소름 돋는 비하인드 스토리 #shorts`,
      `모두가 속았던 ${figureName}의 진짜 성공 뒤 충격적인 비밀 #반전실화`,
      `언론에서 숨겼던 ${figureName}의 파산 직전 72시간 비하인드 #shorts`
    ];
    fallback60Scenes = [
      { sceneNumber: 1, timeRange: '00:00 - 00:05', narration: `세상은 ${figureName} 님을 단번에 뜬 천재라 부르지만, 사실 그는 역사상 가장 비참한 배신을 당했던 인물입니다.`, visualGuide: '충격적인 흑백 헤드라인과 긴장감 넘치는 스피드 줌', imageSearchKeyword: `${figureName} 과거 인터뷰 클로즈업`, visualEffect: '임팩트 줌인', bgmSuggestion: '미스터리 현악기' },
      { sceneNumber: 2, timeRange: '00:05 - 00:10', narration: '전 재산을 투자해 개발했던 핵심 프로젝트를 가장 믿었던 동료들이 하루아침에 훔쳐 달아났습니다.', visualGuide: '텅 빈 연구실과 바닥에 흩어진 서류들', imageSearchKeyword: `${figureName} 위기 순간`, visualEffect: '좌측 패닝' },
      { sceneNumber: 3, timeRange: '00:10 - 00:15', narration: '남겨진 것은 수십억 원의 빚과 사기꾼이라는 세상 사람들의 잔인한 손가락질뿐이었습니다.', visualGuide: '차가운 경찰서와 법원 앞을 나서는 무거운 발걸음', imageSearchKeyword: `${figureName} 시련의 시절`, visualEffect: '슬로우 줌아웃' },
      { sceneNumber: 4, timeRange: '00:15 - 00:20', narration: '하지만 그는 법정 다툼에 매달리는 대신, 모든 원망을 삼키고 지하실 골방에 틀어박혔습니다.', visualGuide: '어두운 방에서 밤새 모니터를 노려보는 결연한 실루엣', imageSearchKeyword: `${figureName} 연구 몰입`, visualEffect: '천천히 줌인' },
      { sceneNumber: 5, timeRange: '00:20 - 00:25', narration: '"너희들이 훔쳐 간 건 과거의 기술일 뿐, 내 머릿속 미래까지 훔칠 순 없다."', visualGuide: '벽에 빼곡히 적힌 차세대 설계도와 공식들', imageSearchKeyword: `${figureName} 기술 개발`, visualEffect: '화이트 플래시' },
      { sceneNumber: 6, timeRange: '00:25 - 00:30', narration: '단 6개월 만에 그는 훔쳐 간 자들이 흉내조차 낼 수 없는 10배 뛰어난 독점 기술을 완성해냈습니다.', visualGuide: '새롭게 탄생한 혁신적인 시제품과 특허 서류', imageSearchKeyword: `${figureName} 혁신 특허`, visualEffect: '다이내믹 줌인' },
      { sceneNumber: 7, timeRange: '00:30 - 00:35', narration: '그리고 시장이 열리자마자 배신자들의 제품을 단 1주일 만에 시장에서 완전히 퇴출시켰습니다.', visualGuide: '압도적인 시장 점유율 그래프와 고객들의 폭발적 찬사', imageSearchKeyword: `${figureName} 시장 1위`, visualEffect: '우측 패닝' },
      { sceneNumber: 8, timeRange: '00:35 - 00:40', narration: '가장 잔인했던 배신이 오히려 그를 대체 불가능한 업계의 거인으로 진화시킨 것입니다.', visualGuide: '글로벌 컨퍼런스에서 기조연설하는 당당한 모습', imageSearchKeyword: `${figureName} 기조연설 카리스마`, visualEffect: '슬로우 줌인' },
      { sceneNumber: 9, timeRange: '00:40 - 00:45', narration: '그는 훗날 말했습니다. "나를 죽이지 못한 고통은 나를 세상에서 가장 강하게 만들었다."', visualGuide: '여유로운 미소 뒤에 숨은 서늘한 통찰력의 눈빛', imageSearchKeyword: `${figureName} 최근 인터뷰 정면`, visualEffect: '정적 포커스' },
      { sceneNumber: 10, timeRange: '00:45 - 00:50', narration: '상처받고 분노하는 대신 압도적인 결과로 침묵하게 만드는 진짜 승자의 품격.', visualGuide: '업계 최고의 상을 수상하며 손을 흔드는 장면', imageSearchKeyword: `${figureName} 수상 소감`, visualEffect: '부드러운 패닝' },
      { sceneNumber: 11, timeRange: '00:50 - 00:55', narration: '배신과 시련을 기적으로 바꾼 ${figureName}의 반전 드라마는 오늘 우리에게 전율을 줍니다.', visualGuide: '화려한 도시 전경과 뻗어나가는 기업의 비전', imageSearchKeyword: `${figureName} 글로벌 활약`, visualEffect: '와이드 줌아웃' },
      { sceneNumber: 12, timeRange: '00:55 - 01:00', narration: '억울한 공격 앞에 서 있다면 기억하세요. 당신의 압도적인 실력이 최고의 복수입니다.', visualGuide: '강렬한 엔딩 타이틀과 채널 구독 카드', imageSearchKeyword: `${figureName} 당당한 프로필`, visualEffect: '엔딩 페이드 아웃', bgmSuggestion: '웅장한 오케스트라 피날레' }
    ];
  } else if (effectiveAngle === 'success') {
    // 💼 성공 스토리 & 3가지 원칙
    fallbackHooks = [
      { type: 'question', label: '성공 방정식', text: `수많은 천재들을 제치고 ${figureName} 님이 1등이 된 진짜 비밀 3가지를 아십니까?` },
      { type: 'provocative', label: '뼈 때리는 조언', text: `"재능은 핑계일 뿐이다." ${figureName} 님이 온몸으로 증명해낸 잔혹한 성공 공식.` },
      { type: 'emotional', label: '실행의 힘', text: `게으른 나를 완전히 뒤바꿔놓을 ${figureName}의 3가지 철학.` }
    ];
    fallbackTitles = [
      `1%만 실천하는 ${figureName}의 3가지 성공 원칙 (소름 주의) #shorts`,
      `게으른 당신을 당장 각성시키는 ${figureName}의 뼈 때리는 조언 #동기부여`,
      `모두가 안 된다 할 때 ${figureName}이 보여준 압도적 실행력 #성공학`
    ];
    fallback60Scenes = [
      { sceneNumber: 1, timeRange: '00:00 - 00:05', narration: `남들은 그를 천재라 부르지만, ${figureName} 님의 성공 뒤에는 지독할 만큼 잔혹한 3가지 원칙이 있었습니다.`, visualGuide: '카리스마 넘치는 시선과 강렬한 타이포그래피', imageSearchKeyword: `${figureName} 카리스마 눈빛 클로즈업`, visualEffect: '스피드 줌인', bgmSuggestion: '절제된 묵직한 비트' },
      { sceneNumber: 2, timeRange: '00:05 - 00:10', narration: '첫 번째 원칙, "가장 하기 싫고 두려운 일을 아침 8시 전에 먼저 끝내라."', visualGuide: '새벽 시계와 홀로 일어나는 고독한 출근길 연출', imageSearchKeyword: `${figureName} 새벽 출근`, visualEffect: '천천히 패닝' },
      { sceneNumber: 3, timeRange: '00:10 - 00:15', narration: '그는 미루는 습관을 영혼의 암이라 불렀으며, 결코 두려움 앞에서 타협하지 않았습니다.', visualGuide: '결단력 있게 서류를 결재하고 지시하는 현장', imageSearchKeyword: `${figureName} 업무 몰입`, visualEffect: '슬로우 줌인' },
      { sceneNumber: 4, timeRange: '00:15 - 00:20', narration: '두 번째 원칙, "더 많이 소비할수록 망하지만, 더 많이 실행할수록 부자가 된다."', visualGuide: '책상 위에 쌓인 수많은 테스트 데이터와 메모들', imageSearchKeyword: `${figureName} 연구 노트`, visualEffect: '화이트 플래시' },
      { sceneNumber: 5, timeRange: '00:20 - 00:25', narration: '아이디어는 1원짜리에 불과하며, 오직 끝까지 밀어붙이는 실행력만이 판을 바꾼다고 믿었습니다.', visualGuide: '실패한 시제품들을 뒤로하고 다시 작업대에 앉는 모습', imageSearchKeyword: `${figureName} 끈기 집념`, visualEffect: '2단 줌인' },
      { sceneNumber: 6, timeRange: '00:25 - 00:30', narration: '세 번째 원칙, "매일 아침 망할 각오로 일터에 출근하라."', visualGuide: '위기의식을 강조하며 팀원들과 눈을 맞추는 회의', imageSearchKeyword: `${figureName} 열정 회의`, visualEffect: '좌측 패닝' },
      { sceneNumber: 7, timeRange: '00:30 - 00:35', narration: '성공에 취하는 순간 도태된다는 것을 알았기에, 그는 가장 화려한 정상에서도 긴장을 늦추지 않았습니다.', visualGuide: '세계 최고 시총을 달성한 날에도 묵묵히 일하는 모습', imageSearchKeyword: `${figureName} 업무 현장`, visualEffect: '다이내믹 줌인' },
      { sceneNumber: 8, timeRange: '00:35 - 00:40', narration: '하루아침에 반짝 뜬 스타가 아닌, 10년이 지나도 대체 불가능한 괴물이 된 비결.', visualGuide: '글로벌 언론과 테크 리더들의 압도적인 찬사', imageSearchKeyword: `${figureName} 타임지 표지`, visualEffect: '우측 패닝' },
      { sceneNumber: 9, timeRange: '00:40 - 00:45', narration: '"탁월함은 타고난 재능이 아닙니다. 포기하고 싶은 순간 한 걸음 더 내딛는 태도입니다."', visualGuide: '깊은 울림을 주는 명언 인터뷰 방송 캡처', imageSearchKeyword: `${figureName} 감동 강연`, visualEffect: '슬로우 줌인' },
      { sceneNumber: 10, timeRange: '00:45 - 00:50', narration: '오늘 우리가 마주한 막막한 현실도, 이 지독한 원칙들이 모여 반드시 기적으로 바뀝니다.', visualGuide: '어두운 터널 끝에서 눈부신 빛으로 전환되는 연출', imageSearchKeyword: `${figureName} 밝은 미소`, visualEffect: '따뜻한 비네팅' },
      { sceneNumber: 11, timeRange: '00:50 - 00:55', narration: '변명 대신 행동을 선택하는 오늘, 당신의 운명도 완전히 새롭게 쓰일 것입니다.', visualGuide: '시청자에게 용기를 북돋는 당당한 정면 눈빛', imageSearchKeyword: `${figureName} 최근 프로필`, visualEffect: '천천히 줌인' },
      { sceneNumber: 12, timeRange: '00:55 - 01:00', narration: '당신의 치열한 도전을 진심으로 응원합니다. 지금 바로 당신의 첫 행동을 시작하세요.', visualGuide: '희망찬 엔딩 화면과 구독/좋아요 유도 카드', imageSearchKeyword: `${figureName} 엔딩 프로필 고화질`, visualEffect: '엔딩 페이드 아웃', bgmSuggestion: '웅장하고 희망찬 아웃트로' }
    ];
  } else if (effectiveAngle === 'legend') {
    // 🏆 결정적 순간 (운명의 3초)
    fallbackHooks = [
      { type: 'question', label: '운명의 3초', text: `${figureName}의 전 인생을 180도 뒤집어놓았던 '단 3초의 승부수'를 기억하십니까?` },
      { type: 'provocative', label: '단 하나의 결단', text: `모두가 도망치라 외쳤을 때, 전 재산을 걸고 앞으로 돌진했던 ${figureName}의 전설적 순간.` },
      { type: 'emotional', label: '역사의 전환점', text: `세계의 역사가 바뀐 것은 수십 년의 회의가 아니라, 그의 단 한 번의 결단이었습니다.` }
    ];
    fallbackTitles = [
      `세계의 판도를 바꾼 ${figureName}의 '단 3초' 승부수 (전율 주의) #shorts`,
      `모두가 반대했던 그날, ${figureName}이 던진 전설의 한마디 #레전드`,
      `1초 만에 인생을 180도 바꾼 ${figureName}의 결정적 순간 #인생역전`
    ];
    fallback60Scenes = [
      { sceneNumber: 1, timeRange: '00:00 - 00:05', narration: `세계의 역사를 바꾼 것은 수십 년의 회의가 아니었습니다. 바로 ${figureName}의 '단 3초' 결단이었습니다.`, visualGuide: '역사적인 결단의 순간을 포착한 강렬한 슬로우 줌', imageSearchKeyword: `${figureName} 역사적 결단`, visualEffect: '임팩트 줌인', bgmSuggestion: '긴박한 오케스트라 스트링' },
      { sceneNumber: 2, timeRange: '00:05 - 00:10', narration: '이사회와 투자자 전원이 "이 프로젝트를 강행하면 회사 전체가 파산한다"며 결사반대했습니다.', visualGuide: '살얼음판 같은 긴장감이 감도는 이사회 회의실', imageSearchKeyword: `${figureName} 이사회 갈등`, visualEffect: '좌측 패닝' },
      { sceneNumber: 3, timeRange: '00:10 - 00:15', narration: '수많은 언론조차 "무모한 망상", "돈 낭비"라며 그의 도전을 조롱하고 비웃었습니다.', visualGuide: '비판적인 언론 헤드라인과 차가운 칼럼들', imageSearchKeyword: `${figureName} 언론 비판`, visualEffect: '흑백 컷전환' },
      { sceneNumber: 4, timeRange: '00:15 - 00:20', narration: '하지만 그는 타협하지 않았습니다. "모두가 두려워할 때가 바로 판을 바꿀 유일한 기회다."', visualGuide: '단호하게 마이크를 잡고 선언하는 카리스마', imageSearchKeyword: `${figureName} 단호한 결단`, visualEffect: '2단 줌인' },
      { sceneNumber: 5, timeRange: '00:20 - 00:25', narration: '그는 자신의 전 재산과 회사의 모든 운명을 걸고, 마지막 단 한 번의 버튼을 눌렀습니다.', visualGuide: '운명의 카운트다운과 시스템 가동 순간', imageSearchKeyword: `${figureName} 시스템 런칭`, visualEffect: '화이트 플래시' },
      { sceneNumber: 6, timeRange: '00:25 - 00:30', narration: '공기가 멈춘 듯한 정적 속에서, 마침내 믿을 수 없는 결과가 모니터에 터져 나왔습니다.', visualGuide: '경악하며 기립하는 엔지니어들과 연구진들', imageSearchKeyword: `${figureName} 기술 시연 성공`, visualEffect: '다이내믹 줌인' },
      { sceneNumber: 7, timeRange: '00:30 - 00:35', narration: '단 3초 만에 회의실의 반대는 우레와 같은 함성과 기립 박수로 뒤바뀌었습니다.', visualGuide: '눈물을 흘리며 서로를 끌어안는 임직원들', imageSearchKeyword: `${figureName} 환호 기립박수`, visualEffect: '우측 패닝' },
      { sceneNumber: 8, timeRange: '00:35 - 00:40', narration: '그 단 한 번의 결단으로, 그는 경쟁사들이 10년을 따라잡지 못할 독점적 지위를 차지했습니다.', visualGuide: '세계를 뒤흔든 제품 출시와 끝없는 대기 행렬', imageSearchKeyword: `${figureName} 글로벌 신드롬`, visualEffect: '와이드 줌아웃' },
      { sceneNumber: 9, timeRange: '00:40 - 00:45', narration: '비난하던 자들은 이제 그를 "미래를 내다본 시대의 선구자"라 칭송하기 시작했습니다.', visualGuide: '경제지 표지를 장식한 자랑스러운 영웅의 모습', imageSearchKeyword: `${figureName} 포브스 표지`, visualEffect: '슬로우 줌인' },
      { sceneNumber: 10, timeRange: '00:45 - 00:50', narration: '"운명은 기다리는 자의 것이 아닙니다. 공포를 뚫고 결단하는 자의 것입니다."', visualGuide: '깊은 통찰을 전하는 온화한 인터뷰 장면', imageSearchKeyword: `${figureName} 명언 인터뷰`, visualEffect: '정적 포커스' },
      { sceneNumber: 11, timeRange: '00:50 - 00:55', narration: '역사의 갈림길에서 망설이지 않았던 그의 단 3초는 오늘날 전 세계를 움직이고 있습니다.', visualGuide: '지구를 비추는 거대한 테크 네트워크 그래픽', imageSearchKeyword: `${figureName} 글로벌 영향력`, visualEffect: '상승 틸트' },
      { sceneNumber: 12, timeRange: '00:55 - 01:00', narration: '당신의 인생을 바꿀 결정적 순간도 바로 지금입니다. 주저하지 말고 당신의 결단을 내리세요.', visualGuide: '시청자에게 용기를 주는 강렬한 엔딩 프로필', imageSearchKeyword: `${figureName} 정면 눈빛`, visualEffect: '엔딩 페이드 아웃', bgmSuggestion: '웅장하고 벅찬 피날레' }
    ];
  } else {
    // 🏛️ CEO 영웅 서사 & 기업 브랜딩
    fallbackHooks = [
      { type: 'question', label: '혁신 질문형', text: kw ? `모두가 불가능하다고 했던 '${kw}', ${figureName} 대표는 왜 전 재산을 걸었을까요?` : `모두가 망할 거라 비웃었던 시장, ${figureName} 대표는 왜 전 재산을 걸었을까요?` },
      { type: 'provocative', label: '비즈니스 반전', text: kw ? `대기업조차 손대지 못했던 '${kw}'의 시장, ${figureName} 님이 완전히 뒤집었습니다.` : `기존 대기업들이 절대 바꾸지 못했던 시장의 낡은 관행, ${figureName} 님이 완전히 뒤집어버렸습니다.` },
      { type: 'emotional', label: 'CEO 철학', text: kw ? `수많은 적자 속에서도 ${figureName} 님이 끝까지 증명해낸 '${kw}'의 진짜 가치.` : `수많은 적자와 파산 위기 속에서도 ${figureName} 님이 끝까지 타협하지 않았던 단 하나의 원칙.` }
    ];
    fallbackTitles = [
      kw ? `${figureName}의 '${kw}' 대역전 실화 #CEO #비즈니스` : `모두가 망할 거라 했던 시장을 뒤집은 ${figureName}의 충격 실화 #CEO #성공`,
      kw ? `대기업도 무릎 꿇린 ${figureName}의 '${kw}' 비밀 #shorts` : `대기업도 쩔쩔맨 ${figureName}의 독점 기술과 역전 스토리 #비즈니스 #shorts`,
      kw ? `세상을 바꾼 ${figureName}의 '${kw}' 집념 #다큐멘터리` : `단 한 명의 창업가가 세상을 바꾼 방법: ${figureName}의 집념 #다큐멘터리`
    ];
    fallback60Scenes = [
      { sceneNumber: 1, timeRange: '00:00 - 00:05', narration: kw ? `모두가 불가능하다고 손가락질했던 '${kw}', ${figureName} 대표는 전 재산을 걸었습니다.` : `모두가 불가능하다고 손가락질했던 순간, ${figureName} 대표는 전 재산을 걸었습니다.`, visualGuide: '창업 초기 고뇌하는 CEO의 진중한 다큐 실루엣', imageSearchKeyword: `${figureName} 대표 인터뷰 사진`, visualEffect: '슬로우 줌인', bgmSuggestion: '웅장한 앰비언트 신스' },
      { sceneNumber: 2, timeRange: '00:05 - 00:10', narration: '"그 아이템은 절대 안 된다", 수많은 투자자들의 냉대와 거절이 이어졌습니다.', visualGuide: '거절당한 사업계획서와 텅 빈 사무실', imageSearchKeyword: `${figureName} 창업 초기`, visualEffect: '흑백 컷전환', bgmSuggestion: '긴장감 넘치는 피아노' },
      { sceneNumber: 3, timeRange: '00:10 - 00:15', narration: kw ? `하지만 그는 '${kw}'이라는 본질을 절대 포기하지 않았습니다.` : '하지만 그는 기존 시장의 낡은 모순을 그냥 지나칠 수 없었습니다.', visualGuide: '심야 연구실에서 불을 밝힌 채 모니터를 응시하는 모습', imageSearchKeyword: `${figureName} 연구개발 R&D`, visualEffect: '미세 줌인', bgmSuggestion: '몰입감 있는 스트링' },
      { sceneNumber: 4, timeRange: '00:15 - 00:20', narration: '자본금이 바닥나고 수개월간 적자가 이어지며 파산의 문턱까지 내몰렸지만,', visualGuide: '위기 속에서도 팀원들을 독려하는 현장', imageSearchKeyword: `${figureName} 위기 극복`, visualEffect: '좌측 패닝' },
      { sceneNumber: 5, timeRange: '00:20 - 00:25', narration: '그는 품질과 기술에 대한 타협만큼은 결코 허락하지 않았습니다.', visualGuide: '정밀한 기술 공정과 독점 특허 데이터', imageSearchKeyword: `${figureName} 기술력 특허`, visualEffect: '슬로우 줌인' },
      { sceneNumber: 6, timeRange: '00:25 - 00:30', narration: kw ? `밤낮없는 집념 끝에 완성된 '${kw}' 솔루션, 마침내 시장의 폭발적 반응이 터졌습니다.` : '밤낮없는 집념 끝에 완성된 독보적인 솔루션, 마침내 고객들의 반응이 터졌습니다.', visualGuide: '가파르게 상승하는 성장 그래프와 고객 리뷰', imageSearchKeyword: `${figureName} 제품 출시 혁신`, visualEffect: '다이내믹 줌' },
      { sceneNumber: 7, timeRange: '00:30 - 00:35', narration: '입소문만으로 업계의 판도를 바꾸며, 시장 점유율 1위를 거머쥐게 된 것입니다.', visualGuide: '글로벌 무대에서 프레젠테이션하는 모습', imageSearchKeyword: `${figureName} 기조연설 컨퍼런스`, visualEffect: '우측 패닝' },
      { sceneNumber: 8, timeRange: '00:35 - 00:40', narration: '기존 대기업들조차 그의 혁신적인 방식에 주목하기 시작했습니다.', visualGuide: '유명 언론 보도와 경제지 헤드라인', imageSearchKeyword: `${figureName} 언론 보도 인터뷰`, visualEffect: '슬로우 줌아웃' },
      { sceneNumber: 9, timeRange: '00:40 - 00:45', narration: '단순히 돈을 버는 회사가 아니라, 세상을 더 편리하게 만드는 기업.', visualGuide: '기업의 밝은 비전과 임직원들의 미소', imageSearchKeyword: `${figureName} 기업 문화`, visualEffect: '시네마틱 페이드' },
      { sceneNumber: 10, timeRange: '00:45 - 00:50', narration: kw ? `지금도 ${figureName} 대표는 "'${kw}'은 타협하지 않는 태도에서 완성된다"고 말합니다.` : `지금도 ${figureName} 대표는 "혁신은 결코 타협하지 않는 태도에서 나온다"고 말합니다.`, visualGuide: '신뢰감 있는 CEO의 온화하고 당당한 시선', imageSearchKeyword: `${figureName} 최근 인터뷰 사진`, visualEffect: '정적 포커스' },
      { sceneNumber: 11, timeRange: '00:50 - 00:55', narration: '멈추지 않는 도전으로 다음 세대의 미래를 열어갈 그의 여정은 이제 시작입니다.', visualGuide: '글로벌 시장으로 뻗어나가는 기업의 비전 그래픽', imageSearchKeyword: `${figureName} 미래 비전`, visualEffect: '상승 틸트' },
      { sceneNumber: 12, timeRange: '00:55 - 01:00', narration: kw ? `불가능을 기적으로 바꾼 '${kw}'의 교훈, 여러분은 어떤 영감을 얻으셨습니까?` : '불가능을 혁신으로 바꾼 그 신념에 여러분은 어떤 영감을 얻으셨습니까?', visualGuide: '기업 로고와 함께 신뢰감 있는 엔딩 컷', imageSearchKeyword: `${figureName} 공식 프로필 고화질`, visualEffect: '슬로우 줌아웃', bgmSuggestion: '웅장하고 희망찬 피날레' }
    ];
  }

  const rawSliced = targetDuration === 45 ? fallback60Scenes.slice(0, 9) : fallback60Scenes;
  const scenesToReturn = rawSliced.map((s, idx) => ({
    ...s,
    uploadedImageUrl: getSceneFallbackImage(figureName, 'entertainment', idx),
  }));
  const fullScriptToReturn = scenesToReturn.map((s) => s.narration).join('\n\n');

  return {
    hooks: fallbackHooks,
    titles: fallbackTitles,
    hashtags: ['#shorts', `#${figureName}`, '#인생역전', '#동기부여'],
    cleanSemanticTags: [`#${figureName}`, '#인생역전', '#비하인드'],
    firstTwoLinesSeo: `${figureName}의 숨겨진 비하인드 스토리와 역경 극복 드라마. 아무도 몰랐던 ${figureName}의 충격 실화.`,
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
    copyrightDefenseNote: '본 영상은 공인된 언론 인터뷰 및 다큐멘터리 사실(Fact)을 기반으로 창작자가 독창적인 서사와 연출을 가미하여 제작한 100% 2차적 저작물입니다.'
  };
}
