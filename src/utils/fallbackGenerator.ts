import { getSceneFallbackImage } from './sceneImages';

export function generateClientFallbackScript(
  figureName: string = '화제의 인물',
  targetDuration: 45 | 60 = 60,
  refreshCounter: number = 0,
  storyAngle: string = 'random',
  targetPersona: string = '4060_emotional',
  customKeyword: string = ''
) {
  const variationIdx = Math.abs((refreshCounter || 0) + (storyAngle === 'twist' ? 1 : storyAngle === 'success' ? 2 : 0)) % 3;

  let fallback60Scenes = [];
  let fallbackHooks = [];
  let fallbackTitles = [];

  const kw = customKeyword ? customKeyword.trim() : '';

  if (targetPersona === 'ceo_branding' || storyAngle === 'ceo_hero' || storyAngle === 'corporate_pr') {
    fallbackHooks = [
      { type: 'question', label: '혁신 질문형', text: kw ? `모두가 불가능하다고 했던 '${kw}', ${figureName} 대표는 왜 전 재산을 걸었을까요?` : `모두가 불가능하다고 손가락질했던 순간, ${figureName} 대표는 왜 전 재산을 걸었을까요?` },
      { type: 'provocative', label: '비즈니스 반전', text: kw ? `대기업조차 손대지 못했던 '${kw}'의 시장, ${figureName} 님이 완전히 뒤집었습니다.` : `기존 대기업들이 절대 바꾸지 못했던 시장의 낡은 관행, ${figureName} 님이 완전히 뒤집어버렸습니다.` },
      { type: 'emotional', label: 'CEO 철학', text: kw ? `수많은 위기 속에서도 ${figureName} 님이 끝까지 증명해낸 '${kw}'의 진정한 가치.` : `수많은 적자와 파산 위기 속에서도 ${figureName} 님이 끝까지 타협하지 않았던 단 하나의 원칙.` }
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
  } else if (variationIdx === 1) {
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

  const rawSliced = targetDuration === 45 ? fallback60Scenes.slice(0, 9) : fallback60Scenes;
  const scenesToReturn = rawSliced.map((s, idx) => ({
    ...s,
    uploadedImageUrl: getSceneFallbackImage(figureName, 'entertainment', idx),
  }));
  const fullScriptToReturn = scenesToReturn.map((s) => s.narration).join('\n\n');

  return {
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
  };
}
