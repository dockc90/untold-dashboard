import { ShortsProject } from '../types';

export const SAMPLE_PROJECT: ShortsProject = {
  id: 'proj-sample-ahn',
  figureName: '안성재 셰프',
  category: 'entertainment',
  targetPersona: '4060_emotional',
  targetDuration: 60,
  videoTone: 'Documentary',
  selectedHookIndex: 0,
  hooks: [
    {
      type: 'question',
      label: '질문형 후킹',
      text: '이라크 전쟁터에서 총을 들던 정비병이 어떻게 전 세계 0.001% 미슐랭 3스타 셰프가 되었을까요?'
    },
    {
      type: 'provocative',
      label: '도발/논란형 후킹',
      text: '모두가 미쳤다고 비웃었던 한 청년의 10년, 결국 대한민국 요리 역사를 완전히 뒤바꿨습니다.'
    },
    {
      type: 'emotional',
      label: '감성/공감형 후킹',
      text: '기름때 묻은 군복을 벗고 앞치마를 둘렀을 때, 그가 흘렸던 눈물을 아는 사람은 아무도 없었습니다.'
    }
  ],
  titles: [
    '이라크 파병 정비병에서 미슐랭 3스타까지... 안성재 셰프의 눈물겨운 반전 실화 #shorts',
    '기름때 묻은 군복 벗고 세계 1위 셰프가 된 충격적인 비밀 #흑백요리사',
    '아무도 몰랐던 안성재 셰프의 무명 시절과 미군 참전 스토리 #감동실화'
  ],
  hashtags: ['#shorts', '#안성재', '#흑백요리사'],
  cleanSemanticTags: ['#안성재', '#흑백요리사', '#미슐랭3스타'],
  firstTwoLinesSeo: '이라크 파병 정비병에서 미슐랭 3스타까지 올라간 안성재 셰프의 충격적인 인생역전 실화. 흑백요리사 심사위원의 숨겨진 무명시절 비하인드 공개.',
  timestamps: [
    { time: '00:00', label: '이라크 파병 정비병 시절' },
    { time: '00:15', label: '운명을 바꾼 요리학교의 만남' },
    { time: '00:35', label: '하루 16시간 지옥의 주방 수련' },
    { time: '00:50', label: '대한민국 유일 미슐랭 3스타 신화' }
  ],
  commentBaits: {
    debateQuestion: '이라크 파병 정비병 출신 vs 유학파 금수저 셰프, 안성재의 성공은 [타고난 재능] vs [군대식 악바리 근성] 중 무엇 때문일까요?',
    optionA: 'A. 포기를 모르는 군대식 악바리 근성과 규율',
    optionB: 'B. 미각과 집중력을 타고난 천재적 감각',
    pinnedCommentDraft: '📌 [댓글 투표] 여러분은 안성재 셰프의 미슐랭 3스타 비결이 "타고난 감각"과 "군대식 악바리 근성" 중 어느 쪽에 더 가깝다고 보시나요? A vs B 댓글로 투표해주세요! 👇'
  },
  semanticKeywords: ['안성재', '흑백요리사', '미슐랭 3스타', '모수', '이라크 파병', '인생 역전', '정비병 출신'],
  shareTrigger: '주변에 지금 포기하고 싶어하는 지인이나 도전 중인 친구가 있다면 꼭 공유해주세요! 🚀',
  description: '이라크 파병 정비병 출신에서 대한민국 유일의 미슐랭 3스타 모수(MOSU)를 이끌기까지, 안성재 셰프의 치열했던 삶과 집념의 비하인드 스토리입니다.',
  pinnedComment: '📌 [댓글 투표] 여러분은 안성재 셰프의 미슐랭 3스타 비결이 "타고난 감각"과 "군대식 악바리 근성" 중 어느 쪽에 더 가깝다고 보시나요? A vs B 댓글로 투표해주세요! 👇',
  fullScript: `이라크 전쟁터에서 총을 들던 정비병이 어떻게 전 세계 0.001% 미슐랭 3스타 셰프가 되었을까요?

안성재 셰프는 가난했던 집안 형편 탓에 미군에 자원입대했고, 생사를 넘나드는 이라크 파병지에서 매일 밤 정비 트럭을 고치며 청춘을 보냈습니다.

제대 후 정비공이 되려던 그는 우연히 하얀 조리복을 입은 요리학교 학생들을 보고 운명처럼 칼을 잡았습니다.

시작은 남들보다 훨씬 늦었지만, 그는 군대에서 배운 혹독한 규율과 집중력으로 하루 16시간씩 주방 바닥을 닦으며 버텼습니다.

"타협하지 않는 완벽함."
손끝에 물집이 터지고 손목이 끊어질 듯한 고통 속에서도 그는 자신의 철학을 지켰습니다.

그리고 마침내 대한민국 유일의 미슐랭 3스타 셰프라는 위대한 신화를 써냈습니다.

밑바닥에서 피어난 그의 칼날은 오늘도 우리에게 말합니다.
당신의 과거가 무엇이든, 오늘 시작하면 전설이 될 수 있다고 말이죠.`,
  scenes: [
    {
      sceneNumber: 1,
      timeRange: '00:00 - 00:05',
      narration: '이라크 전쟁터에서 총을 들던 정비병이 어떻게 전 세계 0.001% 미슐랭 3스타 셰프가 되었을까요?',
      visualGuide: '이라크 파병 당시 군복 입은 흑백 사진에서 현재 미슐랭 3스타 셰프복으로 교차 줌인',
      imageSearchKeyword: '안성재 미군 정비병 이라크 파병 시절 사진',
      visualEffect: '슬로우 줌인 + 임팩트 사운드',
      bgmSuggestion: '긴장감 있는 오케스트라 현악기',
      uploadedImageUrl: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80',
      motionEffect: 'zoom_in'
    },
    {
      sceneNumber: 2,
      timeRange: '00:05 - 00:10',
      narration: '안성재 셰프는 가난했던 집안 형편 탓에 미군에 자원입대했고,',
      visualGuide: '미국 이민 초기 고생하던 가족과 젊은 시절 모습',
      imageSearchKeyword: '안성재 어린시절 미국 이민 가족',
      visualEffect: '흑백 필터 + 서정적 텍스트 자막',
      bgmSuggestion: '잔잔하고 묵직한 피아노',
      uploadedImageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
      motionEffect: 'pan_left'
    },
    {
      sceneNumber: 3,
      timeRange: '00:10 - 00:15',
      narration: '생사를 넘나드는 이라크 파병지에서 매일 밤 정비 트럭을 고치며 청춘을 보냈습니다.',
      visualGuide: '이라크 모래바람 속 군용 험비 정비 장면',
      imageSearchKeyword: '이라크 파병 한국계 미군 정비병 훈련',
      visualEffect: '모래 먼지 비네팅 효과',
      bgmSuggestion: '낮은 드럼 쿵 소리',
      uploadedImageUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80',
      motionEffect: 'zoom_out'
    },
    {
      sceneNumber: 4,
      timeRange: '00:15 - 00:20',
      narration: '제대 후 정비공이 되려던 그는 우연히 하얀 조리복을 입은 요리학교 학생들을 보고 운명처럼 칼을 잡았습니다.',
      visualGuide: '요리학교 앞을 지나치며 눈빛이 흔들리는 젊은 청년 실루엣',
      imageSearchKeyword: '르꼬르동블루 셰프 조리복 요리사',
      visualEffect: '화면 전환 플래시 컷',
      bgmSuggestion: '상승하는 멜로디',
      uploadedImageUrl: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=800&q=80',
      motionEffect: 'zoom_in'
    },
    {
      sceneNumber: 5,
      timeRange: '00:20 - 00:25',
      narration: '시작은 남들보다 훨씬 늦었지만, 그는 군대에서 배운 혹독한 규율과 집중력으로',
      visualGuide: '주방에서 날카롭게 칼질하는 손과 집중하는 눈빛 클로즈업',
      imageSearchKeyword: '안성재 주방 칼질 요리 집중 클로즈업',
      visualEffect: '빠른 2단 줌',
      uploadedImageUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80',
      motionEffect: 'pan_right'
    },
    {
      sceneNumber: 6,
      timeRange: '00:25 - 00:30',
      narration: '하루 16시간씩 주방 바닥을 닦으며 버텼습니다.',
      visualGuide: '새벽 주방 바닥을 닦으며 땀을 흘리는 셰프의 뒷모습',
      imageSearchKeyword: '파인다이닝 주방 마감 청소 셰프',
      visualEffect: '슬로우 모션 페이드',
      uploadedImageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80',
      motionEffect: 'pan_down'
    },
    {
      sceneNumber: 7,
      timeRange: '00:30 - 00:35',
      narration: '"타협하지 않는 완벽함."',
      visualGuide: '모수(MOSU)의 정교한 예술 요리 디테일 샷',
      imageSearchKeyword: '모수 서울 시그니처 파인다이닝 코스 요리',
      visualEffect: '골드 텍스트 팝업 강조',
      uploadedImageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
      motionEffect: 'zoom_in'
    },
    {
      sceneNumber: 8,
      timeRange: '00:35 - 00:40',
      narration: '손끝에 물집이 터지고 손목이 끊어질 듯한 고통 속에서도 그는 자신의 철학을 지켰습니다.',
      visualGuide: '불꽃 앞 웍을 잡은 굳은살 박인 손',
      imageSearchKeyword: '요리사 굳은살 손 화상 상처',
      visualEffect: '붉은 비네팅 강조',
      uploadedImageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
      motionEffect: 'zoom_out'
    },
    {
      sceneNumber: 9,
      timeRange: '00:40 - 00:46',
      narration: '그리고 마침내 대한민국 유일의 미슐랭 3스타 셰프라는 위대한 신화를 써냈습니다.',
      visualGuide: '미슐랭 가이드 시상식에서 트로피를 들고 환하게 웃는 안성재',
      imageSearchKeyword: '안성재 셰프 미슐랭 3스타 수상 시상식',
      visualEffect: '환한 조명 플래시 효과',
      bgmSuggestion: '벅차오르는 클라이맥스 오케스트라',
      uploadedImageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
      motionEffect: 'zoom_in'
    },
    {
      sceneNumber: 10,
      timeRange: '00:46 - 00:52',
      narration: '밑바닥에서 피어난 그의 칼날은 오늘도 우리에게 말합니다.',
      visualGuide: '흑백요리사 심사위원석에서 날카롭지만 따뜻하게 바라보는 모습',
      imageSearchKeyword: '안성재 흑백요리사 심사위원 슈트',
      visualEffect: '슬로우 줌아웃',
      uploadedImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
      motionEffect: 'pan_left'
    },
    {
      sceneNumber: 11,
      timeRange: '00:52 - 00:58',
      narration: '당신의 과거가 무엇이든, 오늘 시작하면 전설이 될 수 있다고 말이죠.',
      visualGuide: '희망찬 미소와 함께 "구독과 좋아요는 큰 힘이 됩니다" 엔딩 카드',
      imageSearchKeyword: '안성재 셰프 미소 고화질 정면',
      visualEffect: '엔딩 페이드 아웃 + 구독 유도 자막',
      bgmSuggestion: '잔잔하고 여운 있는 피아노 아웃트로',
      uploadedImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      motionEffect: 'zoom_in'
    }
  ],
  copyrightDefenseNote: '본 쇼츠 대본은 방송사의 원본 영상을 복제하지 않고, 공개된 인물의 생애 인터뷰 사실(Fact)을 재구성하여 "역경 극복과 헌정 서사"라는 새로운 창작적 가치와 비평적 시각을 부여한 100% 2차 저작물(Transformative Work)입니다.',
  estimatedSeconds: 58,
  charCount: 395,
  createdAt: new Date().toISOString(),
  isSaved: true,
  selectedVoiceId: 'JBFqnCBsd6RMkjVDRZzb', // George (ElevenLabs v4)
  voiceSpeedMultiplier: 1.05,
  elevenLabsModel: 'eleven_v4',
};
