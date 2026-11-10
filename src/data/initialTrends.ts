import { TrendingFigure } from '../types';

export const INITIAL_TRENDING_FIGURES: TrendingFigure[] = [
  {
    id: 'fig-jensen-huang',
    name: '젠슨 황 (Jensen Huang)',
    title: '식당 설거지 소년에서 4,000조 엔비디아 황제가 된 가죽자켓의 신화',
    category: 'economy',
    viralityScore: 100,
    timeframe: '24h',
    buzzSummary: '전 세계 시가총액 1위 등극! 10대 시절 화장실 청소와 접시 닦기로 시작해 30년간 버텨낸 끝에 AI 혁명을 지배한 가죽자켓 CEO의 전설적 실화',
    controversyOrIssue: '창업 초기 3번의 부도 위기와 30세 청년 시절의 무모한 도전, "더 많이 살수록 더 많이 번다"는 역발상 승부수',
    suggestedAngle: '시련은 나를 더 단단하게 만든다, 매일 실패할 각오로 일하는 60대 억만장자의 뼈 때리는 조언',
    tags: ['젠슨황', '엔비디아', 'AI혁명', '가죽자켓', '시총1위', '인생역전', 'H100'],
    sourceArticlesCount: 680,
    isHot: true,
    primaryChannel: 'multi',
    channelMetrics: {
      naverRank: '네이버 글로벌 인물 1위 (+650%)',
      youtubeViews: '유튜브 쇼츠 누적 8,900만 뷰',
      instaReels: '글로벌 릴스 바이럴 75만 개'
    }
  },
  {
    id: 'fig-elon-musk',
    name: '일론 머스크 (Elon Musk)',
    title: '전 재산 털어 로켓 3번 폭발시키고 기적을 쏜 미치광이 천재',
    category: 'global',
    viralityScore: 99,
    timeframe: '24h',
    buzzSummary: '스페이스X 우주선 발사대 젓가락 포획 성공과 테슬라 로보택시, xAI 슈퍼컴퓨터로 전 세계 숏폼 알고리즘을 독식 중인 혁신의 아이콘',
    controversyOrIssue: '2008년 크리스마스 이브 파산 직전까지 몰렸던 극한의 공포와 주변의 조롱을 극복한 집념',
    suggestedAngle: '모두가 미쳤다고 비웃었지만 결국 인류의 미래를 바꾼 불굴의 멘탈',
    tags: ['일론머스크', '테슬라', '스페이스X', 'xAI', '로보택시', '도전정신'],
    sourceArticlesCount: 720,
    isHot: true,
    primaryChannel: 'youtube',
    channelMetrics: {
      naverRank: '네이버 경제/해외 1위',
      youtubeViews: '유튜브 쇼츠 9,500만 뷰',
      instaReels: '인스타 릴스 90만 개'
    }
  },
  {
    id: 'fig-1',
    name: '안성재 셰프',
    title: '이라크 파병 정비병에서 미슐랭 3스타까지',
    category: 'entertainment',
    viralityScore: 99,
    timeframe: '24h',
    buzzSummary: '흑백요리사 이후 전 세계적 주목, 미군 참전 이라크 정비병 출신에서 세계 최고 셰프가 되기까지의 충격적 반전 스토리',
    controversyOrIssue: '군대 정비병 시절 경험과 파인다이닝 철학이 재조명되며 폭발적인 대중적 존경 형성',
    suggestedAngle: '정비병 출신 흙수저가 미슐랭 3스타가 된 기적의 인생 역전',
    tags: ['흑백요리사', '모수', '미슐랭3스타', '이라크파병', '인생역전'],
    sourceArticlesCount: 182,
    isHot: true,
    primaryChannel: 'multi',
    channelMetrics: {
      naverRank: '네이버 검색량 급상승 +520%',
      youtubeViews: '유튜브 쇼츠 4,800만 뷰',
      instaReels: '인스타 릴스 생성 18.4만 개'
    }
  },
  {
    id: 'fig-2',
    name: '손흥민',
    title: '아시아 최초 득점왕 뒤에 숨겨진 아버지의 10년 맹훈련',
    category: 'sports',
    viralityScore: 98,
    timeframe: '24h',
    buzzSummary: '경기장 안팎에서 보여준 품격 있는 인터뷰와 부상 투혼, 손웅정 감독의 혹독했던 기본기 훈련 일화 재부각',
    controversyOrIssue: '어릴 적 매일 볼 리프팅 4시간, 눈에 피멍이 들 때까지 연습했던 눈물겨운 유년기',
    suggestedAngle: '천재가 아니라 피와 땀으로 만들어진 아시아 역대 최고 공격수의 눈물',
    tags: ['토트넘', '손흥민', '손웅정', '기본기', '감동실화'],
    sourceArticlesCount: 230,
    isHot: true,
    primaryChannel: 'youtube',
    channelMetrics: {
      naverRank: '네이버 스포츠 통합 1위',
      youtubeViews: '유튜브 인기 급상승 쇼츠 3,200만 뷰',
      instaReels: '릴스 언급 9.2만 개'
    }
  },
  {
    id: 'fig-3',
    name: '로제 (BLACKPINK)',
    title: '한국 술자리 게임 ‘아파트’로 빌보드를 정복한 천재성',
    category: 'global',
    viralityScore: 99,
    timeframe: '24h',
    buzzSummary: '브루노 마스와 협업한 한국 술자리 게임 ‘아파트’가 전 세계 틱톡·쇼츠를 점령하며 빌보드 핫100 상위권 진입',
    controversyOrIssue: '가장 한국적인 놀이 문화를 가장 힙한 팝 음악으로 녹여낸 영리한 크리에이티브',
    suggestedAngle: '한국 술자리 게임 하나로 전 세계를 춤추게 만든 소녀의 번뜩이는 감각',
    tags: ['로제', '아파트', '브루노마스', '빌보드', 'K컬처'],
    sourceArticlesCount: 512,
    isHot: true,
    primaryChannel: 'instagram',
    channelMetrics: {
      naverRank: '네이버 엔터 1위',
      youtubeViews: '유튜브 뮤직 & 쇼츠 1.2억 뷰',
      instaReels: '글로벌 릴스 챌린지 85만 건 돌파'
    }
  },
  {
    id: 'fig-4',
    name: '변우석',
    title: '오디션 100번 탈락 후 맞이한 전성기',
    category: 'actor',
    viralityScore: 96,
    timeframe: '48h',
    buzzSummary: '‘선재 업고 튀어’로 신드롬급 인기를 얻기 전, 10년 가까이 무명으로 단역과 오디션 100번 낙방을 겪었던 비하인드',
    controversyOrIssue: '"너는 배우 할 얼굴이 아니다"라는 폭언을 들으며 모델에서 연기자로 버텨낸 세월',
    suggestedAngle: '포기하고 싶을 때마다 거울을 보며 버틴 10년의 인내와 폭풍 눈물',
    tags: ['선재업고튀어', '류선재', '무명10년', '오디션100번', '대기만성'],
    sourceArticlesCount: 188,
    isHot: true,
    primaryChannel: 'naver',
    channelMetrics: {
      naverRank: '네이버 인물 검색 1위 (+380%)',
      youtubeViews: '유튜브 쇼츠 2,100만 뷰',
      instaReels: '인스타 릴스 바이럴 14만 개'
    }
  },
  {
    id: 'fig-5',
    name: '페이커 (이상혁)',
    title: '롤드컵 5회 우승, 전설이 된 불사대마왕의 절제와 독서',
    category: 'global',
    viralityScore: 98,
    timeframe: '24h',
    buzzSummary: '중국팀의 연봉 240억 제안을 거절하고 한국 T1에 남았으며, 할머니 손에서 자라며 책을 손에서 놓지 않는 철저한 자기관리',
    controversyOrIssue: '부상과 슬럼프 속에서도 손목 통증을 참으며 다시 세계 정상에 오른 드라마',
    suggestedAngle: '돈보다 명예를 택한 20대 청년, 그가 10년 넘게 세계 1위를 지킨 이유',
    tags: ['페이커', 'T1', '롤드컵5회우승', '이상혁', '국위선양'],
    sourceArticlesCount: 420,
    isHot: true,
    primaryChannel: 'youtube',
    channelMetrics: {
      naverRank: '네이버 e스포츠 1위',
      youtubeViews: '유튜브 전세계 조회수 5,600만 뷰',
      instaReels: '릴스 리포스트 22만 건'
    }
  },
  {
    id: 'fig-6',
    name: '카리나 (에스파)',
    title: '‘쇠맛 K-POP’ 열풍을 이끄는 독보적 비주얼과 노력',
    category: 'entertainment',
    viralityScore: 97,
    timeframe: '24h',
    buzzSummary: '슈퍼노바와 아마겟돈에 이은 위플래시까지 연타석 메가히트, 인스타그램 개인 계정 개설 직후 최단기 1,000만 팔로워 달성',
    controversyOrIssue: '데뷔 초 수많은 악플을 딛고 실력과 무대 장악력으로 여론을 뒤집은 프로페셔널 멘탈',
    suggestedAngle: '신이 내린 비주얼 뒤에 가려진 피나는 연습과 독종 근성',
    tags: ['에스파', '카리나', '위플래시', '슈퍼노바', 'KPOP퀸'],
    sourceArticlesCount: 295,
    isHot: true,
    primaryChannel: 'instagram',
    channelMetrics: {
      naverRank: '네이버 연예 실시간 검색 2위',
      youtubeViews: '쇼츠 챌린지 6,500만 뷰',
      instaReels: '인스타 릴스 바이럴 42만 건'
    }
  },
  {
    id: 'fig-7',
    name: '임영웅',
    title: '군고구마 장사하던 청년의 기적 같은 영웅시대',
    category: 'entertainment',
    viralityScore: 97,
    timeframe: '24h',
    buzzSummary: '어머니와 단둘이 보일러도 안 들어오는 단칸방에서 살며 겨울마다 군고구마를 팔던 무명가수의 감동 실화',
    controversyOrIssue: '미스터트롯 우승 후에도 팬클럽 영웅시대와 함께 매년 수십억 기부를 이어가는 미담',
    suggestedAngle: '홀어머니의 눈물을 닦아주기 위해 노래했던 소년의 기적',
    tags: ['임영웅', '영웅시대', '군고구마', '효도', '미담제조기'],
    sourceArticlesCount: 310,
    isHot: true,
    primaryChannel: 'naver',
    channelMetrics: {
      naverRank: '네이버 검색량 압도적 1위',
      youtubeViews: '유튜브 쇼츠 누적 3,900만 뷰',
      instaReels: '릴스 음원 사용 11만 건'
    }
  },
  {
    id: 'fig-8',
    name: '지드래곤 (G-DRAGON)',
    title: '7년 만의 귀환, 1초 만에 음원 차트를 찢어버린 ‘파워’',
    category: 'entertainment',
    viralityScore: 98,
    timeframe: '24h',
    buzzSummary: '신곡 POWER 발매 직후 멜론 1위 및 전 세계 아이튠즈 차트 올킬, 독창적인 패션과 스카프 룩이 전 세계 릴스를 장악',
    controversyOrIssue: '각종 억측과 풍파 속에서도 침묵으로 음악을 준비해 완벽한 컴백을 이뤄낸 자존심',
    suggestedAngle: '시대가 흘러도 트렌드는 그가 만든다, 진정한 패션·음악의 제왕',
    tags: ['지드래곤', 'GD', 'POWER', '빅뱅', '트렌드세터'],
    sourceArticlesCount: 460,
    isHot: true,
    primaryChannel: 'multi',
    channelMetrics: {
      naverRank: '네이버 통합 검색 1위',
      youtubeViews: '유튜브 컴백 쇼츠 7,200만 뷰',
      instaReels: '스카프 패션 릴스 28만 개'
    }
  },
  {
    id: 'fig-9',
    name: '성심당 임영진 대표',
    title: '대기업 제안도 거절하고 대전에만 남은 빵집의 기적',
    category: 'economy',
    viralityScore: 93,
    timeframe: '48h',
    buzzSummary: '영업이익이 파리바게뜨를 앞선 대전 명물 성심당, 당일 남은 빵은 전량 고아원과 양로원에 기부하는 68년 전통',
    controversyOrIssue: '서울 백화점 수백억 입점 제안을 단칼에 거절한 "모든 이가 다 좋게 여기는 일을 하라"는 철학',
    suggestedAngle: '돈 욕심을 버렸더니 대한민국에서 가장 돈을 많이 버는 빵집이 된 역설',
    tags: ['성심당', '튀김소보로', '기부왕', '착한기업', '대전의자존심'],
    sourceArticlesCount: 138,
    isHot: false,
    primaryChannel: 'multi',
    channelMetrics: {
      naverRank: '네이버 경제/트렌드 2위',
      youtubeViews: '유튜브 탐방 쇼츠 1,800만 뷰',
      instaReels: '인스타 빵지순례 릴스 25만 개'
    }
  },
  {
    id: 'fig-10',
    name: '이재용 회장',
    title: '출장길 구내식당 식판 든 회장의 위기 돌파 경영',
    category: 'economy',
    viralityScore: 92,
    timeframe: '7d',
    buzzSummary: '삼성전자 반도체 위기론 속에서 직접 현장을 돌며 임직원들과 소탈하게 소통하는 장면들이 바이럴',
    controversyOrIssue: '사법 리스크 해소 이후 던진 "세상에 없는 기술을 만들자"는 결단의 메시지',
    suggestedAngle: '재벌 3세의 화려함 뒤에 가려진 냉혹한 글로벌 생존 전쟁',
    tags: ['삼성전자', '이재용', '반도체위기', '현장경영', '비하인드'],
    sourceArticlesCount: 160,
    isHot: false,
    primaryChannel: 'naver',
    channelMetrics: {
      naverRank: '네이버 경제 1위',
      youtubeViews: '쇼츠 조회수 1,200만 뷰',
      instaReels: '밈 릴스 3.4만 개'
    }
  },
  {
    id: 'fig-11',
    name: '침착맨 (이말년)',
    title: '웹툰 작가에서 대한민국 1등 토크쇼 MC로',
    category: 'entertainment',
    viralityScore: 94,
    timeframe: '24h',
    buzzSummary: '구독자 250만 명의 독보적 토크 채널 운영, 게스트의 속마음을 무장해제시키는 독특한 질문법과 무념무상의 매력',
    controversyOrIssue: '휴식기를 선언한 후에도 쇼츠와 클립 영상으로 매일 유튜브 피드를 점령하는 알고리즘 최강자',
    suggestedAngle: '열심히 살지 않는 척하지만 그 누구보다 치열하게 사람의 심리를 꿰뚫는 전략',
    tags: ['침착맨', '이말년', '유튜브킹', '토크장인', '알고리즘신'],
    sourceArticlesCount: 175,
    isHot: true,
    primaryChannel: 'youtube',
    channelMetrics: {
      naverRank: '네이버 방송/연예 3위',
      youtubeViews: '유튜브 쇼츠 주간 5,200만 뷰',
      instaReels: '클립 릴스 12만 개'
    }
  },
  {
    id: 'fig-12',
    name: '백종원 대표',
    title: '연돈 볼카츠 논란을 정면 돌파한 상장 신화',
    category: 'economy',
    viralityScore: 96,
    timeframe: '24h',
    buzzSummary: '더본코리아 코스피 상장으로 주식 평가액 수천억 원 돌파, 가맹점주와의 상생 갈등을 진정성 있는 소통으로 풀어낸 리더십',
    controversyOrIssue: '방송인 백종원이 아닌 상장 기업의 오너로서 시험대에 오른 비즈니스 승부수',
    suggestedAngle: '빚 17억의 실패를 딛고 외식업계 황제가 된 사나이의 끝장 승부',
    tags: ['더본코리아', '백종원', '코스피상장', '골목식당', '자수성가'],
    sourceArticlesCount: 380,
    isHot: true,
    primaryChannel: 'youtube',
    channelMetrics: {
      naverRank: '네이버 증권/경제 검색 1위',
      youtubeViews: '유튜브 해명 영상 1,800만 뷰',
      instaReels: '릴스 6.5만 개'
    }
  },
  {
    id: 'fig-13',
    name: '이정후',
    title: '‘이종범의 아들’이라는 그늘을 뚫고 1,500억 신화',
    category: 'sports',
    viralityScore: 91,
    timeframe: '48h',
    buzzSummary: '바람의 손자라는 꼬리표를 떼기 위해 아버지보다 2배 더 연습하며 메이저리그 샌프란시스코의 심장이 된 스토리',
    controversyOrIssue: '어릴 때부터 따라붙은 "아빠 빽"이라는 악플을 실력으로 잠재운 멘탈 관리법',
    suggestedAngle: '위대한 아버지의 그림자에 숨지 않고 스스로 전설이 된 청년',
    tags: ['이정후', '샌프란시스코', '바람의손자', 'MLB', '멘탈갑'],
    sourceArticlesCount: 115,
    isHot: false,
    primaryChannel: 'youtube',
    channelMetrics: {
      naverRank: '네이버 야구 뉴스 1위',
      youtubeViews: 'MLB 쇼츠 1,500만 뷰',
      instaReels: 'SF팬 릴스 5.8만 개'
    }
  },
  {
    id: 'fig-14',
    name: '김연경',
    title: '배구 여제의 마지막 라스트 댄스와 리더십',
    category: 'sports',
    viralityScore: 94,
    timeframe: '48h',
    buzzSummary: '선수 인생 마지막 시즌을 앞두고 팀을 이끄는 카리스마와 후배들을 챙기는 품격 있는 리더십',
    controversyOrIssue: '해외 리그 최고 연봉을 뒤로하고 한국 배구의 부흥을 위해 복귀했던 사명감',
    suggestedAngle: '세계 1등이 된 비결: 동료를 탓하지 않고 내가 먼저 몸을 던지는 헌신',
    tags: ['김연경', '배구여제', '식빵언니', '라스트댄스', '걸크러시'],
    sourceArticlesCount: 140,
    isHot: false,
    primaryChannel: 'youtube',
    channelMetrics: {
      naverRank: '네이버 스포츠 상위권',
      youtubeViews: '쇼츠 2,300만 뷰',
      instaReels: '릴스 7.8만 개'
    }
  },
  {
    id: 'fig-15',
    name: '차은우',
    title: '‘얼굴 천재’ 소리 뒤에 감춰진 하루 3시간 쪽잠',
    category: 'actor',
    viralityScore: 95,
    timeframe: '24h',
    buzzSummary: '학창 시절 전교 3등에 학생회장 출신, 데뷔 후에도 지각 한번 없이 대본을 닳도록 외우는 독종 노력파',
    controversyOrIssue: '외모에만 시선이 쏠려 연기력 논란이 있었을 때 밤샘 연습으로 연기력을 입증한 근성',
    suggestedAngle: '신이 몰아준 외모보다 무서운 것은 남들보다 2배 더 독하게 사는 그의 집념',
    tags: ['차은우', '아스트로', '얼굴천재', '노력파', '반전매력'],
    sourceArticlesCount: 197,
    isHot: true,
    primaryChannel: 'instagram',
    channelMetrics: {
      naverRank: '네이버 검색 상위권',
      youtubeViews: '쇼츠 3,100만 뷰',
      instaReels: '인스타 릴스 29만 개'
    }
  },
  {
    id: 'fig-16',
    name: '아이유 (이지은)',
    title: '단칸방 바퀴벌레 집에서 상암 월드컵경기장 매진까지',
    category: 'entertainment',
    viralityScore: 97,
    timeframe: '48h',
    buzzSummary: '여성 솔로 최초 상암월드컵경기장 10만 관객 올킬, 어린 시절 빚보증으로 친척 집을 전전했던 눈물의 유년기',
    controversyOrIssue: '데뷔 무대에서 관객들의 야유를 들었던 16세 소녀가 대한민국 최고 싱어송라이터가 된 드라마',
    suggestedAngle: '절망의 끝에서도 노래를 멈추지 않았던 작은 거인의 15년 기적',
    tags: ['아이유', '상암콘서트', '자수성가', '이지은', '음원퀸'],
    sourceArticlesCount: 320,
    isHot: true,
    primaryChannel: 'naver',
    channelMetrics: {
      naverRank: '네이버 공연/음악 1위',
      youtubeViews: '라이브 클립 4,400만 뷰',
      instaReels: '콘서트 릴스 21만 개'
    }
  },
  {
    id: 'fig-17',
    name: '민희진 전 대표',
    title: 'K-POP 판도를 뒤흔든 독보적 크리에이티브 디렉터',
    category: 'social',
    viralityScore: 98,
    timeframe: '24h',
    buzzSummary: '뉴진스를 탄생시킨 디렉팅 감각과 대형 기획사를 상대로 펼친 사상 초유의 기자회견 및 법적 공방',
    controversyOrIssue: '자본과 창작자의 권리 충돌이라는 K-POP 산업의 구조적 모순을 수면 위로 끌어올린 사건',
    suggestedAngle: '모두가 거인의 눈치를 볼 때 자기 목소리를 낸 창작자의 신념',
    tags: ['민희진', '뉴진스', '어도어', 'KPOP디렉터', '이슈메이커'],
    sourceArticlesCount: 650,
    isHot: true,
    primaryChannel: 'naver',
    channelMetrics: {
      naverRank: '네이버 실시간 이슈 1위',
      youtubeViews: '기자회견 관련 쇼츠 8,900만 뷰',
      instaReels: '패션/밈 릴스 35만 개'
    }
  },
  {
    id: 'fig-18',
    name: '뉴진스 민지',
    title: '혼돈 속에서도 팀을 지킨 단단한 맏언니의 품격',
    category: 'entertainment',
    viralityScore: 96,
    timeframe: '24h',
    buzzSummary: '어수선한 소속사 분쟁 속에서도 흔들림 없이 라이브 방송을 이끌며 멤버들을 챙긴 책임감',
    controversyOrIssue: '어린 나이에도 묵직한 태도와 바른 심성으로 팬들과 대중의 압도적 지지 획득',
    suggestedAngle: '외유내강의 표본: 위기 속에서 비로소 드러난 진짜 리더의 그릇',
    tags: ['뉴진스', '민지', '버니즈', '올바른리더', 'KPOP아이콘'],
    sourceArticlesCount: 280,
    isHot: true,
    primaryChannel: 'instagram',
    channelMetrics: {
      naverRank: '네이버 연예 2위',
      youtubeViews: '쇼츠 3,800만 뷰',
      instaReels: '릴스 31만 개'
    }
  },
  {
    id: 'fig-19',
    name: '봉준호 감독',
    title: '지하 단칸방에서 아카데미 4관왕에 오른 디테일의 신',
    category: 'global',
    viralityScore: 92,
    timeframe: '7d',
    buzzSummary: '기생충으로 한국 영화 100년 역사를 새로 쓴 봉준호 감독의 차기작 미키 17 개봉 임박에 따른 기대감',
    controversyOrIssue: '대학 시절 만화 동아리에서 쫓겨나고 제작비가 없어 결혼식 비디오를 찍던 무명 시절',
    suggestedAngle: '1인치의 장벽을 깨고 세계 영화사를 바꾼 ‘봉테일’의 집착',
    tags: ['봉준호', '기생충', '미키17', '오스카4관왕', '한국영화자존심'],
    sourceArticlesCount: 165,
    isHot: false,
    primaryChannel: 'naver',
    channelMetrics: {
      naverRank: '네이버 영화 1위',
      youtubeViews: '인터뷰 쇼츠 1,400만 뷰',
      instaReels: '명대사 릴스 6만 개'
    }
  },
  {
    id: 'fig-20',
    name: '김수현',
    title: '‘눈물의 여왕’ 신드롬을 만든 치밀한 눈물 연기',
    category: 'actor',
    viralityScore: 95,
    timeframe: '48h',
    buzzSummary: '‘눈물의 여왕’ 시청률 24.9%로 tvN 역대 1위 기록, 회당 수억 원 몸값을 입증한 감정 연기 몰입감',
    controversyOrIssue: '심장 질환으로 공익 판정을 받았음에도 재검을 거쳐 현역 1급 수색대대로 자원입대한 미담',
    suggestedAngle: '외모가 전부인 줄 알았던 배우가 독보적 연기력으로 정점에 서기까지',
    tags: ['김수현', '눈물의여왕', '백현우', '연기천재', '시청률보증수표'],
    sourceArticlesCount: 240,
    isHot: false,
    primaryChannel: 'naver',
    channelMetrics: {
      naverRank: '네이버 드라마 1위',
      youtubeViews: '쇼츠 클립 3,500만 뷰',
      instaReels: '릴스 18만 개'
    }
  },
  {
    id: 'fig-21',
    name: '정용진 신세계 회장',
    title: 'SNS 소통왕에서 그룹 경영 정상화로 승부수',
    category: 'economy',
    viralityScore: 90,
    timeframe: '7d',
    buzzSummary: '회장 취임 후 비상 경영을 선언하며 이마트 흑자 전환과 알리·테무 등 C-커머스 공세에 맞선 전략 실행',
    controversyOrIssue: '과거 논란을 딛고 실적 개선과 강력한 쇄신으로 시장의 신뢰를 되찾는 과정',
    suggestedAngle: '재벌 오너의 솔직한 민낯과 유통 제국을 지키기 위한 필사의 생존 전략',
    tags: ['신세계', '정용진', '이마트', '유통전쟁', '비하인드'],
    sourceArticlesCount: 110,
    isHot: false,
    primaryChannel: 'instagram',
    channelMetrics: {
      naverRank: '네이버 기업 검색 2위',
      youtubeViews: '쇼츠 950만 뷰',
      instaReels: '릴스 4.1만 개'
    }
  },
  {
    id: 'fig-22',
    name: '이강인',
    title: '논란을 딛고 파리 생제르맹(PSG)의 핵심으로',
    category: 'sports',
    viralityScore: 95,
    timeframe: '24h',
    buzzSummary: '아시안컵 논란 이후 진심 어린 사과와 경기장에서의 압도적 플레이메이킹으로 리그1 에이스 등극',
    controversyOrIssue: '어릴 적 ‘날아라 슛돌이’ 꼬마에서 유럽 최고의 빅클럽 주전으로 성장한 드라마',
    suggestedAngle: '비난을 침묵시킨 것은 변명이 아니라 그라운드 위에서 흘린 땀방울이었다',
    tags: ['이강인', 'PSG', '리그1', '골폭풍', '인생역전'],
    sourceArticlesCount: 215,
    isHot: true,
    primaryChannel: 'youtube',
    channelMetrics: {
      naverRank: '네이버 축구 1위',
      youtubeViews: '하이라이트 쇼츠 3,100만 뷰',
      instaReels: '릴스 16만 개'
    }
  },
  {
    id: 'fig-23',
    name: '방탄소년단 정국',
    title: '‘세븐(Seven)’으로 빌보드를 올킬한 황금 막내',
    category: 'global',
    viralityScore: 98,
    timeframe: '48h',
    buzzSummary: '군 복무 중에도 빌보드 글로벌 차트 상위권을 유지하며 스포티파이 최단기 10억 스트리밍 신기록',
    controversyOrIssue: '부산에서 홀로 상경해 형들의 사랑을 받으며 세계 최고 팝스타로 성장한 감동 성장기',
    suggestedAngle: '한국 소년이 전 세계 팝 음악의 새로운 스탠다드가 되기까지',
    tags: ['BTS', '정국', 'Seven', '빌보드1위', '황금막내'],
    sourceArticlesCount: 390,
    isHot: true,
    primaryChannel: 'multi',
    channelMetrics: {
      naverRank: '네이버 K-POP 1위',
      youtubeViews: '쇼츠 챌린지 1.1억 뷰',
      instaReels: '릴스 74만 개'
    }
  },
  {
    id: 'fig-24',
    name: '곽튜브 (곽준빈)',
    title: '학폭 피해를 딛고 200만 유튜버에서 방송인으로',
    category: 'entertainment',
    viralityScore: 93,
    timeframe: '24h',
    buzzSummary: '학창 시절 끔찍했던 괴롭힘을 이겨내고 아제르바이잔 대사관 실무관을 거쳐 최고의 여행 크리에이터로 우뚝 선 인생역전',
    controversyOrIssue: '최근 논란과 시련 속에서도 진솔한 자책과 반성으로 다시 대중 앞에 선 용기',
    suggestedAngle: '상처받은 사람들에게 위로를 건네는 그의 솔직하고 인간적인 눈물',
    tags: ['곽튜브', '곽준빈', '학폭극복', '여행유튜버', '인간승리'],
    sourceArticlesCount: 220,
    isHot: true,
    primaryChannel: 'youtube',
    channelMetrics: {
      naverRank: '네이버 예능 검색 3위',
      youtubeViews: '쇼츠 2,700만 뷰',
      instaReels: '릴스 8.5만 개'
    }
  },
  {
    id: 'fig-25',
    name: '최강록 셰프',
    title: '“나야, 들기름” 흑백요리사를 뒤흔든 조림의 신',
    category: 'entertainment',
    viralityScore: 97,
    timeframe: '24h',
    buzzSummary: '마스터셰프 코리아 우승 이후 10년 만에 흑백요리사로 복귀, 엉뚱하면서도 진지한 매력과 독보적 조림 요리로 폭발적 신드롬',
    controversyOrIssue: '만화 미스터 초밥왕을 보고 무작정 일본으로 건너가 설거지부터 시작했던 눈물겨운 20대',
    suggestedAngle: '요리에 인생을 바친 뚝심, 유행을 좇지 않고 오직 맛과 조림에만 몰두한 장인의 품격',
    tags: ['최강록', '흑백요리사', '조림의신', '나야들기름', '마스터셰프'],
    sourceArticlesCount: 195,
    isHot: true,
    primaryChannel: 'youtube',
    channelMetrics: {
      naverRank: '네이버 인물 검색 2위',
      youtubeViews: '유튜브 쇼츠 720만 뷰',
      instaReels: '릴스 밈 9.8만 개'
    }
  },
  {
    id: 'fig-26',
    name: '에드워드 리 셰프',
    title: '“이 떡볶이는 제 영혼입니다” 한국계 미국 셰프의 정체성 고백',
    category: 'global',
    viralityScore: 98,
    timeframe: '24h',
    buzzSummary: '미국 백악관 국빈 만찬 셰프이자 아이언 셰프 우승자가 한국 식재료로 자신의 뿌리와 이민자 정체성을 표현해 전 세계 눈물샘 자극',
    controversyOrIssue: '어릴 적 미국에서 차별을 겪으며 숨기고 싶었던 한국인 이름 ‘이균’을 가슴에 품고 살아온 세월',
    suggestedAngle: '음식으로 써내려간 한 편의 시, 자신의 뿌리를 인정하며 세계를 감동시킨 진정한 마스터',
    tags: ['에드워드 리', '이균', '흑백요리사', '백악관셰프', '인민자의눈물'],
    sourceArticlesCount: 310,
    isHot: true,
    primaryChannel: 'multi',
    channelMetrics: {
      naverRank: '네이버 요리 1위',
      youtubeViews: '유튜브 하이라이트 850만 뷰',
      instaReels: '릴스 14.2만 개'
    }
  },
  {
    id: 'fig-27',
    name: '비비 (BIBI)',
    title: '‘밤양갱’ 신드롬으로 음원 차트 올킬, 배우까지 섭렵한 괴물',
    category: 'entertainment',
    viralityScore: 96,
    timeframe: '48h',
    buzzSummary: '직접 작사·작곡한 ‘밤양갱’으로 멜론 1위 석권, 칸 영화제 레드카펫을 밟은 배우 김형서로서의 눈부신 활약',
    controversyOrIssue: '불안 장애와 우울증을 겪으며 음악으로 자신을 치유해 나갔던 10대 시절의 고백',
    suggestedAngle: '틀에 박힌 공식을 거부하고 날것의 솔직함으로 세상을 사로잡은 MZ의 아이콘',
    tags: ['비비', '밤양갱', '김형서', '칸영화제', '음원퀸'],
    sourceArticlesCount: 165,
    isHot: true,
    primaryChannel: 'instagram',
    channelMetrics: {
      naverRank: '네이버 뮤직 2위',
      youtubeViews: '유튜브 쇼츠 640만 뷰',
      instaReels: '릴스 챌린지 24만 개'
    }
  },
  {
    id: 'fig-28',
    name: '덱스 (김진영)',
    title: 'UDT 부사관에서 방송가 섭외 1순위 만능 엔터테이너로',
    category: 'entertainment',
    viralityScore: 95,
    timeframe: '24h',
    buzzSummary: '가짜사나이, 솔로지옥2, 피의 게임을 거쳐 연예대상 신인상까지 거머쥔 독보적인 남성미와 솔직한 입담',
    controversyOrIssue: '전역 후 보일러도 들어오지 않는 단칸방에서 컵라면으로 버티던 무명 크리에이터 시절',
    suggestedAngle: '군인 정신과 꺾이지 않는 자신감, 위기 앞에서도 물러서지 않는 진짜 남자의 매력',
    tags: ['덱스', '김진영', 'UDT', '솔로지옥', '대세남'],
    sourceArticlesCount: 205,
    isHot: true,
    primaryChannel: 'youtube',
    channelMetrics: {
      naverRank: '네이버 방송인 1위',
      youtubeViews: '유튜브 쇼츠 920만 뷰',
      instaReels: '릴스 바이럴 11.5만 개'
    }
  },
  {
    id: 'fig-29',
    name: '충주시 김선태 주무관',
    title: '연봉 3천 공무원이 B급 쇼츠로 70만 충TV를 만든 기적',
    category: 'social',
    viralityScore: 94,
    timeframe: '7d',
    buzzSummary: '예산 60만 원으로 충주시 공식 유튜브를 전국 지자체 1위로 올려놓고 초고속 승진 신화를 쓴 공무원 혁신의 대명사',
    controversyOrIssue: '기존 관료사회의 꼰대 문화와 보고 체계를 깨뜨리기 위해 겪었던 수많은 반대와 눈총',
    suggestedAngle: '시키는 일만 하는 공무원이 아니라, 틀을 깨고 스스로 가치를 입증한 일잘러의 비밀',
    tags: ['충주맨', '김선태', '충TV', '공무원혁신', 'B급감성'],
    sourceArticlesCount: 140,
    isHot: false,
    primaryChannel: 'youtube',
    channelMetrics: {
      naverRank: '네이버 인물 3위',
      youtubeViews: '유튜브 쇼츠 680만 뷰',
      instaReels: '충주시 밈 릴스 5.2만 개'
    }
  },
  {
    id: 'fig-30',
    name: '미미미누 (김민우)',
    title: '5수 끝에 고려대 합격, 대한민국 수험생의 멘토가 되다',
    category: 'social',
    viralityScore: 93,
    timeframe: '48h',
    buzzSummary: '5수라는 뼈아픈 실패를 컨텐츠로 승화시켜 160만 구독자를 모으고, 입시와 청춘들의 고민을 유쾌하게 상담하는 교육계 1인자',
    controversyOrIssue: '매년 수능 날 눈물을 흘리며 5번의 도전을 이어갔던 치열하고 고통스러웠던 20대 초반',
    suggestedAngle: '실패를 부끄러워하지 않고 웃음과 지혜로 바꾼 청춘의 용기와 회복탄력성',
    tags: ['미미미누', '김민우', '5수신화', '고려대', '수능멘토'],
    sourceArticlesCount: 115,
    isHot: false,
    primaryChannel: 'youtube',
    channelMetrics: {
      naverRank: '네이버 교육 1위',
      youtubeViews: '유튜브 쇼츠 430만 뷰',
      instaReels: '길거리 인터뷰 릴스 7.8만 개'
    }
  },
  {
    id: 'fig-31',
    name: '랄랄 (이유라)',
    title: '‘명기 엄마’ 부캐로 쇼츠를 뒤흔든 코미디 여왕',
    category: 'entertainment',
    viralityScore: 94,
    timeframe: '24h',
    buzzSummary: '기발한 부캐 ‘명기 엄마’, ‘안평만’으로 숏폼 밈을 연이어 히트시키며 출산 후에도 뜨거운 인기 구가',
    controversyOrIssue: '뮤지컬 배우 지망생 시절 수많은 오디션 탈락과 생계를 위해 안 해본 알바가 없던 과거',
    suggestedAngle: '망가지는 것을 두려워하지 않는 당당함과 대중을 웃기기 위한 뼈를 깎는 관찰력',
    tags: ['랄랄', '명기엄마', '부캐신드롬', '숏폼퀸', '웃음보장'],
    sourceArticlesCount: 130,
    isHot: true,
    primaryChannel: 'youtube',
    channelMetrics: {
      naverRank: '네이버 예능 2위',
      youtubeViews: '유튜브 쇼츠 890만 뷰',
      instaReels: '릴스 오디오 16만 개'
    }
  },
  {
    id: 'fig-32',
    name: '빠니보틀 (박재한)',
    title: '통장 잔고 200만 원으로 세계 여행 떠났던 흙수저의 반전',
    category: 'entertainment',
    viralityScore: 92,
    timeframe: '7d',
    buzzSummary: '회사 해고 후 마지막 희망으로 시작한 유튜브가 230만 구독자를 달성하고 지구마불 세계여행 기획자로 도약',
    controversyOrIssue: '인도 기차 슬리퍼 칸에서 땀을 뻘뻘 흘리며 카메라 하나 들고 버티던 눈물겨운 여정',
    suggestedAngle: '바닥을 친 순간 도전을 시작한 사람만이 누릴 수 있는 진짜 자유의 맛',
    tags: ['빠니보틀', '여행유튜버', '지구마불', '인생역전', '자유로운영혼'],
    sourceArticlesCount: 98,
    isHot: false,
    primaryChannel: 'youtube',
    channelMetrics: {
      naverRank: '네이버 여행 1위',
      youtubeViews: '유튜브 쇼츠 540만 뷰',
      instaReels: '릴스 6.1만 개'
    }
  },
  {
    id: 'fig-33',
    name: '김대호 아나운서',
    title: 'MBC 14년차 차장의 솔직 담백 비혼 라이프 신드롬',
    category: 'entertainment',
    viralityScore: 93,
    timeframe: '48h',
    buzzSummary: '단독주택 비바리움, 만화책, 솔직한 퇴근 갈망으로 전 국민 직장인들의 열렬한 공감과 지지 획득',
    controversyOrIssue: '과거 사표를 제출하고 방황했던 번아웃을 솔직하게 털어놓으며 자신만의 행복 기준을 정립',
    suggestedAngle: '남들의 시선이 아닌 내가 진짜 좋아하는 것으로 삶을 채워나가는 직장인의 용기',
    tags: ['김대호', '나혼자산다', '비바리움', '직장인공감', '소확행'],
    sourceArticlesCount: 155,
    isHot: false,
    primaryChannel: 'naver',
    channelMetrics: {
      naverRank: '네이버 방송인 3위',
      youtubeViews: '유튜브 쇼츠 390만 뷰',
      instaReels: '릴스 4.8만 개'
    }
  },
  {
    id: 'fig-34',
    name: '장도연',
    title: '‘살롱드립’으로 증명한 배려와 품격의 토크쇼 퀸',
    category: 'entertainment',
    viralityScore: 95,
    timeframe: '24h',
    buzzSummary: '게스트를 깎아내리지 않고 매력을 200% 끌어올리는 배려심 넘치는 진행으로 톱스타들이 줄 서는 MC 등극',
    controversyOrIssue: '초창기 몸 개그와 자학 개그를 거치며 자신만의 따뜻한 유머 철학을 완성하기까지의 고민',
    suggestedAngle: '선한 영향력과 겸손이 최고의 무기임을 증명한 대한민국 대체 불가 MC',
    tags: ['장도연', '살롱드립', '배려의토크', '국민MC', '토크의신'],
    sourceArticlesCount: 175,
    isHot: true,
    primaryChannel: 'youtube',
    channelMetrics: {
      naverRank: '네이버 예능 1위',
      youtubeViews: '유튜브 쇼츠 780만 뷰',
      instaReels: '명장면 릴스 8.9만 개'
    }
  },
  {
    id: 'fig-35',
    name: '이수지',
    title: '대치동 제이미 맘부터 린자오밍까지, 소름 돋는 관찰 연기 1인자',
    category: 'entertainment',
    viralityScore: 95,
    timeframe: '24h',
    buzzSummary: 'SNL 코리아에서 현실 인물 싱크로율 100% 캐릭터들을 쏟아내며 백상예술대상 예능상 수상',
    controversyOrIssue: '공채 개그맨 시절 무명과 코미디 프로 폐지 속에서도 사람을 관찰하며 캐릭터 노트를 채운 끈기',
    suggestedAngle: '사소한 디테일 하나 놓치지 않는 지독한 몰입과 연습이 만든 천재 코미디언',
    tags: ['이수지', 'SNL', '백상예술대상', '천재개그우먼', '관찰의신'],
    sourceArticlesCount: 180,
    isHot: true,
    primaryChannel: 'youtube',
    channelMetrics: {
      naverRank: '네이버 코미디 1위',
      youtubeViews: '유튜브 쇼츠 840만 뷰',
      instaReels: '패러디 릴스 12.3만 개'
    }
  },
  {
    id: 'fig-36',
    name: '황희찬',
    title: 'EPL 프리미어리그에서 폭발한 ‘코리안 가이’의 황소 질주',
    category: 'sports',
    viralityScore: 94,
    timeframe: '48h',
    buzzSummary: '맨시티 과르디올라 감독의 "코리안 가이" 발언 이후 결승골을 터뜨리며 울버햄튼 핵심 스트라이커로 도약',
    controversyOrIssue: '잦은 햄스트링 부상과 이적 초기 부진을 이겨내고 식단과 피지컬 훈련을 극대화한 프로 정신',
    suggestedAngle: '말보다 행동으로 증명하는 황소, 편견을 골로 깨뜨린 한국 축구의 자존심',
    tags: ['황희찬', '코리안가이', '울버햄튼', 'EPL', '황소돌파'],
    sourceArticlesCount: 160,
    isHot: false,
    primaryChannel: 'youtube',
    channelMetrics: {
      naverRank: '네이버 해외축구 2위',
      youtubeViews: '유튜브 쇼츠 360만 뷰',
      instaReels: '릴스 골 하이라이트 5.9만 개'
    }
  },
  {
    id: 'fig-37',
    name: '지드래곤 (G-DRAGON)',
    title: '7년의 침묵을 깨고 독보적 신곡 파워로 컴백한 K-POP의 제왕',
    category: 'entertainment',
    viralityScore: 99,
    timeframe: '24h',
    buzzSummary: '신곡 POWER로 음원 차트 올킬 및 유퀴즈 출연으로 폭발적인 대중적 환호와 패션 트렌드 독점',
    controversyOrIssue: '억울했던 루머와 공백기를 예술과 음악으로 완벽하게 제압한 진짜 아티스트의 품격',
    suggestedAngle: '세상이 나를 흔들어도 나는 음악으로 답한다, 지드래곤의 불멸의 영향력',
    tags: ['지드래곤', 'GD', 'POWER', '빅뱅', '패션아이콘'],
    sourceArticlesCount: 420,
    isHot: true,
    primaryChannel: 'multi',
    channelMetrics: {
      naverRank: '네이버 연예 종합 1위',
      youtubeViews: '유튜브 MV 5,200만 뷰',
      instaReels: '릴스 챌린지 85만 개'
    }
  },
  {
    id: 'fig-38',
    name: '오타니 쇼헤이 (Shohei Ohtani)',
    title: '만화도 이렇게 쓰면 욕먹는다! MLB 최초 50홈런-50도루 신화',
    category: 'sports',
    viralityScore: 100,
    timeframe: '24h',
    buzzSummary: '메이저리그 148년 역사상 최초로 50-50을 달성하고 월드시리즈 우승 트로피를 들어올린 야구 천재',
    controversyOrIssue: '고교 시절 쓰레기 줍기까지 운의 영역으로 계획했던 만다라트 계획표와 철저한 자기관리',
    suggestedAngle: '불가능을 목표로 삼았기에 역사가 되었다, 오타니의 위대한 멘탈리티',
    tags: ['오타니', '50-50', 'LA다저스', 'MLB', '만다라트'],
    sourceArticlesCount: 550,
    isHot: true,
    primaryChannel: 'youtube',
    channelMetrics: {
      naverRank: '네이버 해외스포츠 1위',
      youtubeViews: '유튜브 쇼츠 7,200만 뷰',
      instaReels: '글로벌 릴스 60만 개'
    }
  },
  {
    id: 'fig-39',
    name: '샘 알트만 (Sam Altman)',
    title: 'ChatGPT로 인류의 지능을 바꾼 OpenAI 창립자의 거침없는 승부수',
    category: 'economy',
    viralityScore: 97,
    timeframe: '24h',
    buzzSummary: '이사회의 기습 해임 쿠데타를 5일 만에 뒤집고 완벽하게 복귀한 실리콘밸리의 실세',
    controversyOrIssue: '인류를 위협할 수 있는 초지능(AGI) 개발과 기업 상업화 사이의 살얼음판 갈등',
    suggestedAngle: '모두가 안 된다고 할 때 전 재산과 미래를 베팅하는 빅테크 거물의 결단력',
    tags: ['샘알트만', 'OpenAI', 'ChatGPT', '인공지능', '실리콘밸리'],
    sourceArticlesCount: 380,
    isHot: true,
    primaryChannel: 'youtube',
    channelMetrics: {
      naverRank: '네이버 IT/테크 1위',
      youtubeViews: '유튜브 인터뷰 3,400만 뷰',
      instaReels: '테크 릴스 20만 개'
    }
  },
  {
    id: 'fig-40',
    name: '카리나 (aespa)',
    title: '쇠맛 신드롬 ‘슈퍼노바’와 ‘아마겟돈’으로 가요계를 평정한 AI 비주얼 리더',
    category: 'entertainment',
    viralityScore: 98,
    timeframe: '24h',
    buzzSummary: '독보적인 콘셉트와 라이브 실력으로 걸그룹 음원 차트 장기 집권 및 챌린지 열풍 주도',
    controversyOrIssue: '비주얼뿐만 아니라 밤낮없는 연습으로 다져진 보컬과 댄스 실력의 재평가',
    suggestedAngle: '완벽한 외모 뒤에 숨겨진 치열한 노력과 그룹을 이끄는 단단한 리더십',
    tags: ['카리나', '에스파', '슈퍼노바', '아마겟돈', 'KPOP리더'],
    sourceArticlesCount: 390,
    isHot: true,
    primaryChannel: 'instagram',
    channelMetrics: {
      naverRank: '네이버 엔터 2위',
      youtubeViews: '유튜브 쇼츠 6,100만 뷰',
      instaReels: '릴스 챌린지 110만 개'
    }
  },
  {
    id: 'fig-41',
    name: '미스터비스트 (MrBeast)',
    title: '하루 16시간 유튜브만 분석해 3억 구독자 제국을 세운 집념',
    category: 'global',
    viralityScore: 100,
    timeframe: '24h',
    buzzSummary: '전 세계 유튜브 구독자 1위! 벌어들인 수익의 100%를 다시 다음 영상에 재투자하는 미친 스케일',
    controversyOrIssue: '학창 시절 친구들과 작은 방에 모여 1,000개의 썸네일과 인트로를 초단위로 뜯어보며 연구한 일화',
    suggestedAngle: '천재 크리에이터는 없다, 오직 미치도록 집요한 분석과 실행만이 있을 뿐이다',
    tags: ['미스터비스트', '유튜브1위', '3억구독자', '챌린지', '성공방정식'],
    sourceArticlesCount: 610,
    isHot: true,
    primaryChannel: 'youtube',
    channelMetrics: {
      naverRank: '네이버 해외이슈 2위',
      youtubeViews: '유튜브 본편 및 쇼츠 누적 500억 뷰',
      instaReels: '글로벌 릴스 200만 개'
    }
  },
  {
    id: 'fig-42',
    name: '백종원',
    title: '통영 어촌 살리기부터 축제 혁신까지, 위기의 자영업을 살리는 장사의 신',
    category: 'social',
    viralityScore: 97,
    timeframe: '24h',
    buzzSummary: '지역 축제 바가지 요금 근절과 전통시장 재생 프로젝트로 전 국민적 신뢰와 박수를 받는 외식업계 거물',
    controversyOrIssue: '과거 IMF 시절 17억 빚더미에 앉아 유서까지 썼던 극한의 위기를 극복한 인생 실화',
    suggestedAngle: '바닥을 쳐본 사람만이 진정한 장사의 본질을 안다, 백종원의 눈물겨운 빚더미 탈출기',
    tags: ['백종원', '더본코리아', '골목식당', '지역축제', '인생역전'],
    sourceArticlesCount: 310,
    isHot: true,
    primaryChannel: 'youtube',
    channelMetrics: {
      naverRank: '네이버 경제/사회 1위',
      youtubeViews: '유튜브 채널 600만 구독자 & 쇼츠 4,000만 뷰',
      instaReels: '릴스 35만 개'
    }
  },
  {
    id: 'fig-43',
    name: '워런 버핏 (Warren Buffett)',
    title: '94세 오마하의 현인이 전하는 "가장 중요한 인생의 1가지 원칙"',
    category: 'economy',
    viralityScore: 96,
    timeframe: '48h',
    buzzSummary: '현금 보유액 사상 최대치 경신! 단 하루도 일희일비하지 않고 80년간 세계 부호 1위를 지킨 투자 황제',
    controversyOrIssue: '남들이 탐욕을 부릴 때 두려워하고, 남들이 두려워할 때 탐욕을 부리는 역발상 가치투자',
    suggestedAngle: '돈보다 중요한 것은 평생을 지킬 평판이다, 90대 거인이 청년들에게 전하는 뼈 때리는 조언',
    tags: ['워런버핏', '버크셔해서웨이', '가치투자', '오마하의현인', '인생교훈'],
    sourceArticlesCount: 290,
    isHot: false,
    primaryChannel: 'naver',
    channelMetrics: {
      naverRank: '네이버 경제 인물 1위',
      youtubeViews: '유튜브 다큐/쇼츠 2,500만 뷰',
      instaReels: '릴스 18만 개'
    }
  },
  {
    id: 'fig-44',
    name: '마동석',
    title: '미국 헬스트레이너에서 한국 영화계 천만 관객 4회 돌파의 괴물 배우',
    category: 'actor',
    viralityScore: 97,
    timeframe: '24h',
    buzzSummary: '범죄도시 시리즈로 한국 영화 역사상 최다 관객 동원 기록! 마크 콜먼 개인 트레이너 출신의 묵직한 액션',
    controversyOrIssue: '계단에서 추락해 척추와 어깨가 부러지는 대수술을 겪고도 진통제를 맞으며 촬영한 투혼',
    suggestedAngle: '온몸이 쇠조각투성이지만 액션을 멈출 수 없다, 불사조 마동석의 진짜 액션 인생',
    tags: ['마동석', '범죄도시', '천만배우', '액션히어로', '마블영화'],
    sourceArticlesCount: 350,
    isHot: true,
    primaryChannel: 'multi',
    channelMetrics: {
      naverRank: '네이버 영화 인물 1위',
      youtubeViews: '유튜브 액션 명장면 4,200만 뷰',
      instaReels: '릴스 28만 개'
    }
  },
  {
    id: 'fig-45',
    name: '김연경',
    title: '세계 최고 연봉을 거절하고 고국 리그로 돌아와 배구 부흥을 이끈 식빵언니',
    category: 'sports',
    viralityScore: 96,
    timeframe: '48h',
    buzzSummary: '도쿄올림픽 4강 신화와 V리그 전 경기 매진 돌풍을 일으킨 세계 배구계의 리빙 레전드',
    controversyOrIssue: '고교 시절 키가 작아 벤치에만 앉아 울던 무명 시절과 피나는 성장통을 견뎌낸 일화',
    suggestedAngle: '포기하지 않는 자에게 기적은 온다, 키 170cm 벤치 멤버에서 세계 1위가 된 식빵언니의 투혼',
    tags: ['김연경', '배구여제', '식빵언니', '도쿄올림픽', '걸크러시'],
    sourceArticlesCount: 240,
    isHot: false,
    primaryChannel: 'youtube',
    channelMetrics: {
      naverRank: '네이버 배구 1위',
      youtubeViews: '유튜브 쇼츠 1,800만 뷰',
      instaReels: '릴스 15만 개'
    }
  },
  {
    id: 'fig-46',
    name: '임영웅',
    title: '단칸방 군고구마 장사에서 전 세대를 울리는 영웅이 된 기적의 목소리',
    category: 'entertainment',
    viralityScore: 98,
    timeframe: '24h',
    buzzSummary: '상암 월드컵경기장 콘서트 10만 관객 올킬! 음원 차트 장기 독점과 중장년층 팬덤의 절대적 지지',
    controversyOrIssue: '어릴 적 아버지를 여의고 어머니와 단둘이 보일러도 안 들어오는 방에서 군고구마를 팔던 유년기',
    suggestedAngle: '시련은 나를 무너뜨리지 못한다, 눈물로 빚어낸 따뜻한 위로의 목소리',
    tags: ['임영웅', '영웅시대', '상암콘서트', '트로트황제', '효도의아이콘'],
    sourceArticlesCount: 460,
    isHot: true,
    primaryChannel: 'naver',
    channelMetrics: {
      naverRank: '네이버 검색 인물 1위',
      youtubeViews: '유튜브 뮤직 누적 25억 뷰',
      instaReels: '릴스 30만 개'
    }
  }
];

