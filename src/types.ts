export type SourceChannel = 'all' | 'naver' | 'youtube' | 'instagram';

export type CategoryType = 
  | 'all'
  | 'entertainment'
  | 'actor'
  | 'sports'
  | 'economy'
  | 'social'
  | 'global';

export type TimeFilter = '24h' | '48h' | '7d';

export interface ChannelMetrics {
  naverRank?: string;      // e.g. "네이버 검색 1위 (+340%)"
  youtubeViews?: string;   // e.g. "유튜브 쇼츠 2,800만 뷰"
  instaReels?: string;     // e.g. "릴스 챌린지 15만 개"
}

export interface VoiceOption {
  id: string;
  name: string;
  role: string;
  gender: 'male' | 'female';
  tone: string;
  categoryTag: '감동/다큐' | '숏폼/도파민' | '뉴스/지식' | '공감/힐링' | '스릴러/미스터리';
  description: string;
  pitch: number;
  rate: number;
  sampleNarration: string;
  provider?: 'fish_audio';
  model?: string;
  referenceId?: string;
  tagline?: string;
}

export type TargetPersona = 
  | '4060_emotional' // 40~60대 감동 극복 비하인드
  | '1020_dopamine'  // 10~20대 숏폼 도파민/밈
  | '3040_success'   // 30~40대 동기부여 & 성공 공식
  | 'mystery_twist'; // 반전 미스터리

// 영상의 전체적인 분위기를 결정하는 연출 톤
export type VideoMoodTone = 
  | 'Cinematic'    // 영화적 웅장함과 드라마틱한 몰입감
  | 'Documentary'  // 인간극장·다큐의 진솔하고 깊이 있는 서사
  | 'Fast-paced'   // 숨 쉴 틈 없는 도파민 폭발 빠른 비트
  | 'Minimal';     // 군더더기 없는 절제와 담백하고 명확한 전달

export interface TrendingFigure {
  id: string;
  name: string;
  title: string;
  category: CategoryType;
  viralityScore: number; // 1-100
  timeframe: TimeFilter;
  buzzSummary: string;
  controversyOrIssue: string;
  suggestedAngle: string;
  tags: string[];
  imageUrl?: string;
  sourceArticlesCount?: number;
  isHot?: boolean;
  primaryChannel?: 'naver' | 'youtube' | 'instagram' | 'multi';
  channelMetrics?: ChannelMetrics;
}

export interface HookOption {
  type: 'question' | 'provocative' | 'emotional';
  label: string;
  text: string;
}

export type MotionEffectType = 
  | 'zoom_in'    // 천천히 줌인 (Ken Burns In)
  | 'zoom_out'   // 천천히 줌아웃 (Ken Burns Out)
  | 'pan_left'   // 좌➔우 천천히 이동
  | 'pan_right'  // 우➔좌 천천히 이동
  | 'pan_down'   // 위➔아래 천천히 이동
  | 'fade'       // 부드러운 페이드
  | 'static';    // 고정

// 동영상 포맷: 숏폼용(9:16 세로) vs 롱폼용(16:9 가로)
export type VideoFormat = 'short' | 'long';
export type VideoAspectRatio = '9:16' | '16:9';

// 상업적 이용 가능한 무료 폰트 목록
export type SubtitleFontFamily = 
  | 'Pretendard'       // 프리텐다드 (모던 산세리프)
  | 'GmarketSans'      // 지마켓 산스 (쇼츠 최적화 볼드)
  | 'Black Han Sans'   // 검은고딕 (임팩트 헤드라인)
  | 'Do Hyeon'         // 배민 도현체 (인기 유튜브 예능)
  | 'ScoreDream'       // 에스코어 드림 (직선형 방송 자막)
  | 'Jua'              // 배민 주아체 (따뜻한 감성체)
  | 'Song Myung';      // 송명체 (인간극장 다큐 명조)

// 자막 위치 (화면 상하 위치)
export type SubtitlePosition = 
  | 'bottom'   // 하단 기본 (Y: 78%)
  | 'lower'    // 최하단 (Y: 86%)
  | 'center'   // 화면 정중앙 (Y: 50%)
  | 'top';     // 상단 (Y: 22%)

// 자막 디자인 효과 스타일
export type SubtitleEffectStyle = 
  | 'yellow_box'      // 옐로우 박스
  | 'black_capsule'   // 블랙 반투명 캡슐
  | 'white_outline'   // 화이트 텍스트 + 볼드 외곽선
  | 'neon_cyan'       // 사이버 네온 블루 글로우
  | 'netflix_red'     // 넷플릭스 레드 박스
  | 'shadow_drop';    // 3D 섀도우 드롭

// 자막 크기
export type SubtitleFontSize = 'small' | 'medium' | 'large' | 'xlarge';

// 동영상 제작 시 사진 프레이밍 비율
export type PhotoAspectRatio = 
  | '1:1'        // 1:1 정사각형 (인스타/뉴스 쇼츠 스타일)
  | '9:16'       // 9:16 전체 꽉 채움 (세로 몰입형)
  | '4:5'        // 4:5 인물 세로 피드 비율
  | '16:9'       // 16:9 가로 와이드 (방송/영상 캡처)
  | 'fit';       // 원본 비율 유지 (블러 배경 위 핏)

export type BackdropStyle = 'blur' | 'dark' | 'gradient' | 'card_white' | 'card_black';

// 사용자 추가 커스텀 자막/텍스트 오버레이 (캡컷 스타일 멀티 자막)
export interface CustomTextOverlay {
  id: string;
  text: string; // 자막 내용 (여러 줄 지원)
  startScene: number; // 시작 씬 번호 (1부터)
  endScene: number; // 종료 씬 번호 (원하는 지점까지 연장)
  positionYPercent: number; // Y 위치 (예: 상단 14%, 중상단 26%, 중앙 50%, 하단 80%)
  positionX: 'center' | 'left' | 'right';
  fontSizeScale: number; // 0.8 ~ 1.8
  fontFamily: SubtitleFontFamily;
  textColor: string; // e.g. '#000000', '#ffffff', '#facc15'
  backgroundColor: string; // e.g. 'transparent', '#facc15', '#ffffff', 'rgba(0,0,0,0.85)'
  isBold: boolean;
  boxPadding?: number;
}

// 채널 로고 / 워터마크 오버레이 (샘플 스타일)
export interface ChannelLogoOverlay {
  enabled: boolean;
  imageUrl?: string; // 업로드된 로고 이미지 URL/Base64
  channelName?: string; // 채널명 (예: "노빠꾸소개맨")
  position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-right';
  startScene: number; // 시작 씬
  endScene: number; // 종료 씬 (원하는 지점까지 연장)
  size: 'small' | 'medium' | 'large';
  shape: 'circle' | 'rounded' | 'original';
  showChannelName: boolean;
}

export interface SceneItem {
  sceneNumber: number;
  timeRange: string; // e.g. "00:00 - 00:04"
  narration: string;
  visualGuide: string;
  imageSearchKeyword: string;
  visualEffect: string; // e.g. "슬로우 줌인", "빠른 컷전환", "흑백 대비"
  bgmSuggestion?: string;
  uploadedImageUrl?: string; // 업로드되거나 설정된 이미지 URL
  motionEffect?: MotionEffectType; // 선택된 카메라 무빙 효과
}

export interface ShortsProject {
  id: string;
  figureName: string;
  category: CategoryType;
  targetPersona: TargetPersona;
  targetDuration: 45 | 60;
  hooks: HookOption[];
  selectedHookIndex: number;
  titles: string[];
  hashtags: string[];
  description: string;
  pinnedComment: string;
  fullScript: string;
  scenes: SceneItem[];
  copyrightDefenseNote: string;
  estimatedSeconds: number;
  charCount: number;
  createdAt: string;
  isSaved?: boolean;
  selectedVoiceId?: string; // 선택된 내레이션 성우 ID
  voiceSpeedMultiplier?: number; // 성우 목소리 스피드 배속 (0.8x ~ 1.5x)
  photoAspectRatio?: PhotoAspectRatio; // 동영상 제작 시 사진 프레이밍 비율
  backdropStyle?: BackdropStyle; // 사진 뒤 배경 스타일
  videoTone?: VideoMoodTone; // 영상 전체 분위기 톤 (Cinematic, Documentary, Fast-paced, Minimal)
  customTextOverlays?: CustomTextOverlay[]; // 캡컷 스타일 커스텀 자막 레이어 목록
  channelLogoOverlay?: ChannelLogoOverlay; // 채널 로고 & 워터마크 오버레이
  // 2026 알고리즘 치트키 필드
  firstTwoLinesSeo?: string;
  timestamps?: { time: string; label: string }[];
  cleanSemanticTags?: string[];
  semanticKeywords?: string[];
  commentBaits?: {
    debateQuestion: string;
    optionA: string;
    optionB: string;
    pinnedCommentDraft: string;
  };
  shareTrigger?: string;
}

// -------------------------------------------------------------
// SNS 떡상 바이럴 스튜디오 타입 정의 (인스타그램, 유튜브, 네이버)
// -------------------------------------------------------------
export interface CarouselSlide {
  slideNumber: number;
  type: 'cover' | 'hook' | 'insight' | 'body' | 'cta' | string;
  mainHook: string;
  subDetail: string;
  visualGuide: string;
  imageSearchKeyword?: string;
  badgeText?: string;
  imageUrl?: string;
}

export interface CarouselData {
  title: string;
  slides: CarouselSlide[];
}

export interface ThumbnailConcept {
  conceptName: string;
  mainText: string;
  subText: string;
  badgeText: string;
  visualComposition: string;
  colorScheme: {
    bg: string;
    text: string;
    accent: string;
  };
  ctrRationale: string;
  imageUrl?: string;
}

export interface InstagramPost {
  hookFirstLine: string; // 더보기 클릭을 부르는 첫 1~2줄
  bodyText: string;
  bulletSummary?: string[]; // 가독성 극대화 3줄 불릿 요약
  saveShareTrigger: string; // 알고리즘 1위 지표 DM 공유 & 저장 유도 문구
  cleanSemanticTags: string[]; // 알고리즘 감점 없는 클린 태그 3~5개
  hashtagsFormatted?: string;
}

export interface YouTubePost {
  titleCandidates: string[];
  firstTwoLinesSeo?: string; // 검색 결과 미리보기에 노출되는 핵심 2줄
  descriptionText: string;
  timestamps?: { time: string; label: string }[]; // 타임스탬프 챕터 마커
  pinnedComment: string; // 인터랙션 폭발 논쟁/토론 고정 댓글
  semanticKeywords?: string[]; // AI 음성/자막 검색용 키워드
  tags: string[];
}

export interface NaverSection {
  subTitle: string;
  paragraph: string;
}

export interface NaverPost {
  blogTitleCandidates: string[];
  intro: string;
  sections: NaverSection[];
  conclusion: string;
  smartBlockKeywords: string[];
  dwellTimeSecret?: string; // 4분 체류시간 방어 팁
}

export interface PlatformPosts {
  instagram: InstagramPost;
  youtube: YouTubePost;
  naver: NaverPost;
}

export interface ViralTriggers {
  // 1. DM 공유 & 저장(Save) 트리거 키트
  shareAndSaveKit: {
    dmShareCopy: string; // 친구에게 DM으로 전달하게 만드는 멘트
    saveTriggerCopy: string; // 저장(Save) 필수 유도 문구
    cleanTags: string[]; // 알고리즘 최적화 3~5개 시맨틱 카테고리 태그
  };
  // 2. 댓글 폭발 인터랙션 유발 (Comment Baits)
  commentBaits: {
    baitTitle: string;
    debateQuestion: string;
    optionA: string;
    optionB: string;
    pinnedCommentDraft: string;
  }[];
  // 3. AI 음성/자막 인식용 자연어 시맨틱 SEO & 챕터
  semanticSeo: {
    voiceKeywords: string[]; // 영상에서 반드시 소리내어 말해야 하는 키워드
    searchQueries: string[]; // 구글/유튜브 검색창 자동완성 구어체 쿼리
    sampleTimestamps: string[]; // 챕터 마커
  };
}

export interface HashtagIntelligence {
  instagram: {
    mega: string[];
    mid: string[];
    niche: string[];
  };
  youtube: string[];
  naver: string[];
}

export interface ViralAssetPackage {
  topic: string;
  viralityStrategySummary: string;
  carousel: CarouselData;
  thumbnails: ThumbnailConcept[];
  posts: PlatformPosts;
  viralTriggers?: ViralTriggers;
  hashtagIntelligence?: HashtagIntelligence;
}

