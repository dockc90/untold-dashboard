import { getSceneFallbackImage } from './sceneImages';
import { ScriptFormatType, ScriptSpeechTone, ShortsSafetyCheck } from '../types';

function extractTwoFactNumbersFromScript(scriptText: string): string[] {
  const matches = scriptText.match(/\d+(?:,\d{3})*(?:\.\d+)?\s*(?:년|개월|일|시간|원|만\s*원|억\s*원|조\s*원|억|만|배|%|개|명|위|차|번|초)?/g) || [];
  const unique = Array.from(new Set(matches.map((m) => m.trim()).filter((m) => m.length >= 2))).slice(0, 2);
  if (unique.length >= 2) return unique;
  if (unique.length === 1) return [unique[0], '공식 보도 기준 연도·수치 확인 필요'];
  return ['핵심 실적·규모 공식 발표 확인 필요', '사건 발생 연도·기간 확인 필요'];
}

export function generateClientFallbackScript(
  figureName: string = '화제의 인물',
  targetDuration: 45 | 60 = 60,
  refreshCounter: number = 0,
  storyAngle: string = 'random',
  targetPersona: string = '4060_emotional',
  customKeyword: string = '',
  scriptFormat: ScriptFormatType = 'overcoming_story',
  speechTone: ScriptSpeechTone = 'friendly_story'
) {
  const kw = customKeyword ? customKeyword.trim() : '';
  const isJensen = figureName.includes('젠슨') || figureName.includes('Jensen') || figureName.includes('엔비디아');

  let fallback60Scenes: any[] = [];
  let fallbackHooks: any[] = [];
  let fallbackTitles: any[] = [];

  // Map format + storyAngle into unified fallback selection while keeping 100% PR-safe narrative
  const mappedAngle =
    scriptFormat === 'humble_twist'
      ? 'humble_twist'
      : scriptFormat === 'biz_sports_owner'
      ? 'legend'
      : scriptFormat === 'life_timeline'
      ? 'success'
      : 'adversity';
  const effectiveAngle = storyAngle === 'random' ? mappedAngle : storyAngle;

  if (effectiveAngle === 'adversity') {
    // 💧 감동 역전 실화
    if (isJensen) {
      fallbackHooks = [
        { type: 'question', label: '사건형 후킹', text: kw ? `'${kw}' 신화 젠슨 황이 16살에 변기 닦던 시절.` : `세계 1위 젠슨 황이 16살에 화장실 변기를 닦았던 이유.` },
        { type: 'provocative', label: '반전형 후킹', text: `직원 80% 자르고 통장에 30일 치 월급만 남았던 날.` },
        { type: 'emotional', label: '질문형 후킹', text: `식당 접시닦이 소년은 어떻게 4,000조 황제가 됐을까?` }
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
        { type: 'question', label: '사건형 후킹', text: kw ? `'${kw}' 뒤에 숨겨진 ${figureName}의 위기 극복 실화.` : `직원 급여조차 주기 막막했던 밤, ${figureName} 님이 선택한 한 수.` },
        { type: 'provocative', label: '반전형 후킹', text: `모두가 불가능하다던 시장에서 끝내 1등이 된 이유.` },
        { type: 'emotional', label: '질문형 후킹', text: `단 한 사람의 진심이 어떻게 거대한 기업을 살렸을까?` }
      ];
      fallbackTitles = [
        `통장 잔고 위기에서 업계 1등이 된 ${figureName}의 반전 실화 #shorts`,
        `모두가 안 된다고 할 때 ${figureName} 님이 보여준 통 큰 결단 #감동실화`,
        `작은 진심 하나로 세상을 바꾼 ${figureName}의 인생 역전 #기업인스토리`
      ];
      fallback60Scenes = [
        { sceneNumber: 1, timeRange: '00:00 - 00:05', narration: `화려한 정상에 서 있는 지금과 달리, ${figureName} 님의 시작은 한 평 남짓한 작은 사무실이었습니다.`, visualGuide: '초기 작은 사무실과 결연한 눈빛의 과거 아카이브 사진', imageSearchKeyword: `${figureName} 과거 초기 시절`, visualEffect: '슬로우 줌인', bgmSuggestion: '애잔한 피아노 선율' },
        { sceneNumber: 2, timeRange: '00:05 - 00:10', narration: `"현실을 모른다, 절대 성공할 수 없다"는 차가운 거절을 백 번 넘게 들어야 했습니다.`, visualGuide: '거절당한 기획안과 늦은 밤 꺼지지 않는 사무실 불빛', imageSearchKeyword: `${figureName} 창업 초기 위기`, visualEffect: '좌측 패닝' },
        { sceneNumber: 3, timeRange: '00:10 - 00:15', narration: kw ? `하지만 그는 포기하는 대신, '${kw}'이라는 본질 하나만 붙잡고 밤새 현장을 뛰었습니다.` : '하지만 그는 포기하는 대신, 현장의 목소리를 하나라도 더 듣기 위해 직접 발로 뛰었습니다.', visualGuide: '현장에서 메모하며 해결책을 고민하는 진지한 모습', imageSearchKeyword: `${figureName} 현장 소통`, visualEffect: '2단 스피드 줌' },
        { sceneNumber: 4, timeRange: '00:15 - 00:20', narration: '자금이 바닥나고 적자가 눈덩이처럼 불어나며 누구나 떠나갈 때도 그의 원칙은 흔들리지 않았습니다.', visualGuide: '어두운 회의실에서 끝까지 책임을 다짐하는 실루엣', imageSearchKeyword: `${figureName} 경영 위기 극복`, visualEffect: '천천히 줌인' },
        { sceneNumber: 5, timeRange: '00:20 - 00:25', narration: '오히려 그는 손해를 보더라도 사람과의 약속과 품질만큼은 절대 타협하지 않겠다고 선언했습니다.', visualGuide: '신뢰를 지켜낸 계약서와 진심이 담긴 악수', imageSearchKeyword: `${figureName} 경영 철학 원칙`, visualEffect: '슬로우 줌아웃' },
        { sceneNumber: 6, timeRange: '00:25 - 00:30', narration: '당장의 수익보다 사람을 먼저 본 그 결단에, 외면하던 고객과 파트너들의 마음이 움직이기 시작했습니다.', visualGuide: '진심이 전해지며 점차 밝아지는 현장의 표정들', imageSearchKeyword: `${figureName} 진정성 미담`, visualEffect: '다이내믹 줌인' },
        { sceneNumber: 7, timeRange: '00:30 - 00:35', narration: '단 하나의 상품, 단 한 명의 고객을 지키려던 집념이 결국 업계의 판도를 뒤집어 놓았습니다.', visualGuide: '가파르게 상승하는 신뢰 지표와 뜨거운 반응', imageSearchKeyword: `${figureName} 성공 전환점`, visualEffect: '화이트 플래시' },
        { sceneNumber: 8, timeRange: '00:35 - 00:40', narration: '그날 이후, 불가능이라던 사람들의 비웃음은 순식간에 뜨거운 존경으로 바뀌었습니다.', visualGuide: '쏟아지는 언론 호평과 감동 기사 헤드라인', imageSearchKeyword: `${figureName} 언론 호평 기사`, visualEffect: '우측 패닝' },
        { sceneNumber: 9, timeRange: '00:40 - 00:45', narration: '수십 번의 위기는 그를 무너뜨린 것이 아니라, 누구도 흉내 낼 수 없는 단단한 리더로 만들었습니다.', visualGuide: '정상에서 따뜻한 미소로 인사하는 당당한 모습', imageSearchKeyword: `${figureName} 리더십 강연`, visualEffect: '슬로우 줌인' },
        { sceneNumber: 10, timeRange: '00:45 - 00:50', narration: '"사업의 가치는 숫자가 아니라, 우리가 얼마나 많은 사람의 일상을 지켰는지로 남습니다."', visualGuide: '진심 어린 철학을 전하는 인터뷰 클립', imageSearchKeyword: `${figureName} 인터뷰 명언`, visualEffect: '천천히 줌인' },
        { sceneNumber: 11, timeRange: '00:50 - 00:55', narration: '가장 어두운 순간에도 사람과 신의를 택했던 ${figureName} 님의 통 큰 발자취.', visualGuide: '함께 웃는 임직원들과 빛나는 기업의 비전', imageSearchKeyword: `${figureName} 사회공헌 미담`, visualEffect: '와이드 줌아웃' },
        { sceneNumber: 12, timeRange: '00:55 - 01:00', narration: '오늘 묵묵히 버텨내는 당신의 진심 역시, 머지않아 세상을 바꾸는 기적이 되길 응원합니다.', visualGuide: '따뜻한 미소와 좋아요/구독 유도 엔딩 카드', imageSearchKeyword: `${figureName} 환한 미소 프로필`, visualEffect: '엔딩 페이드 아웃', bgmSuggestion: '벅차오르는 피아노 피날레' }
      ];
    }
  } else if (effectiveAngle === 'humble_twist') {
    // 🍢 소박한 반전 매력형
    fallbackHooks = [
      { type: 'question', label: '반전형 후킹', text: kw ? `수조 원대 자산가 ${figureName} 님이 '${kw}' 앞에서 보인 소박한 행동.` : `수조 원대 거부가 길거리 식당에서 보인 뜻밖의 행동.` },
      { type: 'provocative', label: '인간미 후킹', text: `수행비서도 없이 단골 국밥집에 줄 서서 기다린 이유.` },
      { type: 'emotional', label: '질문형 후킹', text: `돈과 권력을 다 가진 거장이 끝까지 지킨 소탈한 습관.` }
    ];
    fallbackTitles = [
      `수조 원대 자산가 ${figureName} 님이 길거리에서 포착된 뜻밖의 모습 #shorts`,
      `격식 다 내려놓고 사람들과 어울린 ${figureName}의 소탈한 반전 매력 #미담`,
      `진짜 큰 사람이 더 겸손한 이유, ${figureName} 실화 #인간미`
    ];
    fallback60Scenes = [
      { sceneNumber: 1, timeRange: '00:00 - 00:05', narration: `수조 원대 기업을 이끄는 ${figureName} 님, 하지만 퇴근 후 포착된 모습은 믿기 어려울 만큼 소박했습니다.`, visualGuide: '화려한 공식석상과 소탈한 일상 컷의 극적인 대비', imageSearchKeyword: `${figureName} 일상 소탈한 모습`, visualEffect: '슬로우 줌인', bgmSuggestion: '따뜻하고 경쾌한 어쿠스틱' },
      { sceneNumber: 2, timeRange: '00:05 - 00:10', narration: '수십억 원대 외제차와 고급 레스토랑 대신, 그가 직접 운전하거나 홀로 찾은 곳은 동네의 작은 가게였습니다.', visualGuide: '소박한 골목길과 정겨운 동네 풍경', imageSearchKeyword: `${figureName} 목격담 사진`, visualEffect: '좌측 패닝' },
      { sceneNumber: 3, timeRange: '00:10 - 00:15', narration: kw ? `현장 시민들과 똑같이 줄을 서서 '${kw}' 이야기를 나누며 소탈하게 웃었습니다.` : '현장 시민들과 똑같이 줄을 서서 먼저 반갑게 인사를 건네며 소탈하게 웃었습니다.', visualGuide: '시민들과 격의 없이 어울리며 웃는 모습', imageSearchKeyword: `${figureName} 시민 소통 미소`, visualEffect: '2단 줌인' },
      { sceneNumber: 4, timeRange: '00:15 - 00:20', narration: '어깨에 힘을 주기보다 상대의 눈높이에 맞춰 먼저 고개를 숙이는 그의 배려가 현장 분위기를 녹였습니다.', visualGuide: '직원과 가게 사장님에게 예의를 갖추는 장면', imageSearchKeyword: `${figureName} 배려 예의`, visualEffect: '천천히 줌인' },
      { sceneNumber: 5, timeRange: '00:20 - 00:25', narration: '사진 촬영을 요청하는 시민 한 명 한 명에게도 귀찮은 기색 없이 진심으로 응대했습니다.', visualGuide: '팬·시민과 다정하게 셀카를 찍는 따뜻한 현장', imageSearchKeyword: `${figureName} 사진 촬영 팬서비스`, visualEffect: '우측 패닝' },
      { sceneNumber: 6, timeRange: '00:25 - 00:30', narration: '그가 이토록 소탈함을 잃지 않는 데는, 어려웠던 젊은 시절 직접 현장을 뛰며 배운 철학이 있었습니다.', visualGuide: '과거 낡은 점퍼를 입고 현장을 누리던 젊은 시절', imageSearchKeyword: `${figureName} 젊은 시절 현장`, visualEffect: '흑백 컷전환' },
      { sceneNumber: 7, timeRange: '00:30 - 00:35', narration: '"현장의 땀방울을 잊는 순간, 리더의 자격도 사라진다"는 게 그의 오랜 신념이었습니다.', visualGuide: '현장 직원들과 식사하며 이야기를 듣는 모습', imageSearchKeyword: `${figureName} 직원 식사 소통`, visualEffect: '슬로우 줌아웃' },
      { sceneNumber: 8, timeRange: '00:35 - 00:40', narration: '화려한 의전은 줄이고, 아낀 시간과 마음은 고스란히 구성원과 이웃을 챙기는 데 썼습니다.', visualGuide: '조용한 기부와 상생 프로젝트 보도 화면', imageSearchKeyword: `${figureName} 조용한 선행 기부`, visualEffect: '화이트 플래시' },
      { sceneNumber: 9, timeRange: '00:40 - 00:45', narration: '자리를 떠난 뒤에도 가게에 따뜻한 여운과 넉넉한 응원을 남기고 조용히 사라졌습니다.', visualGuide: '소탈한 뒷모습과 훈훈한 미담 보도', imageSearchKeyword: `${figureName} 훈훈한 미담`, visualEffect: '슬로우 줌인' },
      { sceneNumber: 10, timeRange: '00:45 - 00:50', narration: '권위를 내려놓을수록 오히려 더 큰 존경이 돌아온다는 사실을 몸소 증명했습니다.', visualGuide: '온라인에서 쏟아지는 응원 댓글과 긍정 반응', imageSearchKeyword: `${figureName} 호감 여론 반응`, visualEffect: '시네마틱 페이드' },
      { sceneNumber: 11, timeRange: '00:50 - 00:55', narration: '높은 자리에 오를수록 더 낮아지는 겸손함이야말로 진짜 거인의 품격이었습니다.', visualGuide: '존경받는 리더의 온화한 클로즈업', imageSearchKeyword: `${figureName} 온화한 웃음`, visualEffect: '와이드 줌아웃' },
      { sceneNumber: 12, timeRange: '00:55 - 01:00', narration: '화려한 성공보다 더 빛났던 소박한 인간미, 여러분은 어떤 장면이 가장 인상 깊으셨나요?', visualGuide: '따뜻한 여운이 남는 엔딩 카드', imageSearchKeyword: `${figureName} 최근 인터뷰`, visualEffect: '엔딩 페이드 아웃', bgmSuggestion: '기분 좋은 피아노 아웃트로' }
    ];
  } else if (effectiveAngle === 'twist') {
    // ⚡ 충격 반전 비하인드
    fallbackHooks = [
      { type: 'provocative', label: '사건형 후킹', text: `세상이 몰랐던 ${figureName}의 충격적 배신 사건.` },
      { type: 'question', label: '반전형 후킹', text: `믿었던 동료에게 전 재산 털리고 판 뒤집은 비결.` },
      { type: 'emotional', label: '질문형 후킹', text: `언론에 한 줄도 안 나온 파산 직전 72시간의 진실.` }
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
      { type: 'question', label: '사건형 후킹', text: `${figureName}이 수많은 천재들을 꺾고 1등 된 비밀.` },
      { type: 'provocative', label: '반전형 후킹', text: `"재능은 핑계다." 상위 1%만 아는 지독한 실행력.` },
      { type: 'emotional', label: '질문형 후킹', text: `하루 만에 인생을 180도 바꾸는 3가지 원칙은?` }
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
      { type: 'question', label: '사건형 후킹', text: `${figureName}의 운명을 바꾼 단 3초의 순간.` },
      { type: 'provocative', label: '반전형 후킹', text: `모두가 도망칠 때 전 재산 걸고 돌진했던 이유.` },
      { type: 'emotional', label: '질문형 후킹', text: `역사를 바꾼 단 한 번의 결단은 무엇이었을까?` }
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

  const toBanmalNounEnding = (text: string): string => {
    let out = text
      .replace(/했습니다/g, '했음')
      .replace(/였습니다/g, '였음')
      .replace(/됐습니다/g, '됐음')
      .replace(/되었습니다/g, '됐음')
      .replace(/있습니다/g, '있음')
      .replace(/없습니다/g, '없음')
      .replace(/겠습니다/g, '겠음')
      .replace(/었습니다/g, '었음')
      .replace(/았습니다/g, '았음')
      .replace(/졌습니다/g, '졌음')
      .replace(/났습니다/g, '났음')
      .replace(/왔습니다/g, '왔음')
      .replace(/갔습니다/g, '갔음')
      .replace(/입니다/g, '임')
      .replace(/아닙니다/g, '아님')
      .replace(/됩니다/g, '됨')
      .replace(/합니다/g, '함')
      .replace(/바랍니다/g, '바람')
      .replace(/지킵니다/g, '지킴')
      .replace(/만듭니다/g, '만듦')
      .replace(/([가-힣])니다(?=[.!?,"'\s]|$)/g, (_m, ch: string) => {
        const code = ch.charCodeAt(0);
        if (code >= 0xac00 && code <= 0xd7a3) {
          const offset = code - 0xac00;
          if (offset % 28 === 17) {
            // Final consonant ㅂ -> ㅁ
            return `${String.fromCharCode(code - 1)}`;
          }
        }
        return `${ch}음`;
      })
      .replace(/([가-힣])습니다(?=[.!?,"'\s]|$)/g, '$1음')
      .replace(/했대요/g, '했음')
      .replace(/였대요/g, '였음')
      .replace(/있대요/g, '있음')
      .replace(/없대요/g, '없음')
      .replace(/됐대요/g, '됐음')
      .replace(/졌대요/g, '졌음')
      .replace(/본대요/g, '봄')
      .replace(/([가-힣])(었|았|였|졌)어요(?=[.!?,"'\s]|$)/g, '$1$2음')
      .replace(/아십니까\?/g, '알고 있음?')
      .replace(/믿어지시나요\?/g, '믿어짐?')
      .replace(/얻으셨습니까\?/g, '얻었음?')
      .replace(/있으셨나요\?/g, '있었음?')
      .replace(/깊으셨나요\?/g, '깊었음?')
      .replace(/했을까요\?/g, '했을까?')
      .replace(/됐을까요\?/g, '됐을까?')
      .replace(/있을까요\?/g, '있을까?')
      .replace(/일까요\?/g, '일까?')
      .replace(/무엇이었을까요\?/g, '뭐였을까?')
      .replace(/보세요\./g, '보길.')
      .replace(/내리세요\./g, '내리길.')
      .replace(/시작하세요\./g, '시작하길.')
      .replace(/이뤄집니다\./g, '이뤄짐.');
    return out;
  };

  const applySpeechTone = (text: string): string => {
    if (speechTone === 'friendly_story') {
      return text
        .replace(/했습니다/g, '했대요')
        .replace(/였습니다/g, '였대요')
        .replace(/되었습니다/g, '됐대요')
        .replace(/됐습니다/g, '됐대요')
        .replace(/밝혀졌습니다/g, '밝혀졌대요')
        .replace(/알려졌습니다/g, '알려졌대요')
        .replace(/있습니다/g, '있어요')
        .replace(/없습니다/g, '없어요')
        .replace(/입니다/g, '이래요')
        .replace(/아닙니다/g, '아니래요')
        .replace(/됩니다/g, '된대요')
        .replace(/합니다/g, '한대요')
        .replace(/바랍니다/g, '바라요')
        .replace(/아십니까\?/g, '믿어지시나요?')
        .replace(/얻으셨습니까\?/g, '얻으셨나요?');
    }
    if (speechTone === 'trendy_shorts') {
      return toBanmalNounEnding(text);
    }
    return text
      .replace(/했대요/g, '했습니다')
      .replace(/였대요/g, '였습니다')
      .replace(/됐대요/g, '되었습니다')
      .replace(/있대요/g, '있습니다')
      .replace(/믿어지시나요\?/g, '아십니까?');
  };

  const rawSliced = targetDuration === 45 ? fallback60Scenes.slice(0, 9) : fallback60Scenes;
  const hooksToReturn = fallbackHooks.map((h) => ({
    ...h,
    text: applySpeechTone(h.text),
  }));
  const scenesToReturn = rawSliced.map((s, idx) => ({
    ...s,
    narration: applySpeechTone(s.narration),
    uploadedImageUrl: getSceneFallbackImage(figureName, 'entertainment', idx),
  }));
  const fullScriptToReturn = scenesToReturn.map((s) => s.narration).join('\n\n');
  const safetyCheck: ShortsSafetyCheck = {
    numbersToVerify: extractTwoFactNumbersFromScript(fullScriptToReturn),
    positivePrFit: '적합 — 비난·루머 없이 미담·인간미·통 큰 결단만 다룬 홍보팀 친화 서사',
    isPrSafe: true,
  };

  return {
    hooks: hooksToReturn,
    titles: fallbackTitles,
    hashtags: ['#shorts', `#${figureName}`, '#기업인스토리'],
    cleanSemanticTags: [`#${figureName}`, '#기업인스토리', '#성공미담'],
    firstTwoLinesSeo: `${figureName}의 긍정적 리더십과 위기 극복 미담 스토리.`,
    timestamps: [
      { time: '00:00', label: '강렬한 후킹' },
      { time: '00:15', label: '의외의 배경과 위기' },
      { time: '00:40', label: '통 큰 결단과 성취' },
      { time: '00:55', label: '존경과 여운 엔딩' }
    ],
    commentBaits: {
      debateQuestion: `${figureName} 님의 리더십 중 가장 인상 깊었던 순간은 무엇인가요?`,
      optionA: 'A. 적자나 위기에도 원칙을 지킨 통 큰 결단',
      optionB: 'B. 격의 없이 다가가는 소탈하고 따뜻한 인간미',
      pinnedCommentDraft: `📌 [댓글 소통] ${figureName} 님의 이야기 중 가장 멋졌던 포인트를 댓글로 남겨주세요! 👇`
    },
    semanticKeywords: [figureName, '기업인 미담', '통 큰 결단', '소탈한 매력', '리더십'],
    shareTrigger: `오늘 하루 영감과 따뜻한 울림이 필요한 지인에게 이 영상을 공유해보세요! 🚀`,
    description: `${figureName}의 긍정적인 미담과 통 큰 결단을 5단계 쇼츠 서사로 재구성한 브랜드 세이프 콘텐츠입니다.`,
    pinnedComment: `📌 [댓글 소통] ${figureName} 님의 이야기 중 가장 멋졌던 포인트를 댓글로 남겨주세요! 👇`,
    fullScript: fullScriptToReturn,
    scenes: scenesToReturn,
    safetyCheck,
    copyrightDefenseNote: '본 영상은 공인된 언론 보도와 긍정적 미담·리더십 팩트를 기반으로 창작한 100% 브랜드 세이프 2차 저작물입니다.'
  };
}
