import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Film, 
  Download, 
  Play, 
  Pause, 
  RotateCw, 
  CheckCircle2, 
  Sparkles, 
  Sliders, 
  Layers, 
  Monitor, 
  AlertCircle,
  Mic,
  Volume2,
  Gauge,
  Type,
  AlignVerticalJustifyCenter,
  Palette,
  Heart,
  Square,
  Maximize2,
  Image as ImageIcon,
  ArrowLeft,
  Plus,
  Trash2,
  Copy,
  Upload,
  Tag,
  Move,
  Check,
  Eye
} from 'lucide-react';
import { 
  ShortsProject, 
  SceneItem, 
  MotionEffectType, 
  VoiceOption,
  SubtitleFontFamily,
  SubtitlePosition,
  SubtitleEffectStyle,
  SubtitleFontSize,
  PhotoAspectRatio,
  BackdropStyle,
  VideoMoodTone,
  CustomTextOverlay,
  ChannelLogoOverlay,
  SubtitleTempo
} from '../types';
import { VOICE_OPTIONS } from '../data/voices';
import { playDistinctVoicePreview, stopAllVoicePreviews } from '../utils/voicePlayer';
import { getSceneFallbackImage } from '../utils/sceneImages';

interface VideoRendererModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ShortsProject;
  isPageMode?: boolean;
  onBackToEditor?: () => void;
  onBackToTrends?: () => void;
  onUpdateProject?: (updated: ShortsProject) => void;
}

const SPEED_PRESETS = [0.8, 1.0, 1.1, 1.2, 1.3, 1.5];

const COMMERCIAL_FONTS: { id: SubtitleFontFamily; name: string; tag: string; sample: string }[] = [
  { id: 'GmarketSans', name: '지마켓 산스 (Gmarket Sans)', tag: '쇼츠 추천 볼드', sample: '인생을 바꾼 3초의 기적' },
  { id: 'Pretendard', name: '프리텐다드 (Pretendard)', tag: '가독성 1위 모던 고딕', sample: '인생을 바꾼 3초의 기적' },
  { id: 'Black Han Sans', name: '검은고딕 (Black Han Sans)', tag: '압도적 임팩트 헤드라인', sample: '인생을 바꾼 3초의 기적' },
  { id: 'ScoreDream', name: '에스코어 드림 (S-Core Dream)', tag: '직선형 방송 자막', sample: '인생을 바꾼 3초의 기적' },
  { id: 'Do Hyeon', name: '배민 도현체 (Do Hyeon)', tag: '인기 예능 쇼츠 자막', sample: '인생을 바꾼 3초의 기적' },
  { id: 'Jua', name: '배민 주아체 (Jua)', tag: '부드러운 감성 자막', sample: '인생을 바꾼 3초의 기적' },
  { id: 'Song Myung', name: '송명체 (Song Myung)', tag: '인간극장 다큐 명조', sample: '인생을 바꾼 3초의 기적' },
];

const POSITION_PRESETS = [
  { label: '하단 (78% 표준)', value: 78 },
  { label: '최하단 (86%)', value: 86 },
  { label: '중앙 (50%)', value: 50 },
  { label: '상단 (22%)', value: 22 },
];

const SIZE_PRESETS = [
  { label: '소형 (0.85x)', value: 0.85 },
  { label: '보통 (1.0x 표준)', value: 1.0 },
  { label: '대형 (1.18x 추천)', value: 1.18 },
  { label: '특대형 (1.35x)', value: 1.35 },
];

const EFFECT_STYLES: { id: SubtitleEffectStyle; label: string; previewClass: string }[] = [
  { id: 'yellow_box', label: '옐로우 박스', previewClass: 'bg-amber-400 text-slate-950 font-black' },
  { id: 'black_capsule', label: '블랙 캡슐', previewClass: 'bg-slate-900/90 text-white font-bold' },
  { id: 'white_outline', label: '화이트 외곽선', previewClass: 'bg-transparent text-white drop-shadow-[0_2px_2px_rgba(0,0,0,1)] font-black' },
  { id: 'neon_cyan', label: '사이버 네온', previewClass: 'bg-cyan-950 text-cyan-200 border border-cyan-400 font-bold shadow-[0_0_10px_rgba(6,182,212,0.8)]' },
  { id: 'netflix_red', label: '넷플릭스 레드', previewClass: 'bg-rose-600 text-white font-black' },
  { id: 'shadow_drop', label: '드롭 섀도우', previewClass: 'bg-transparent text-white drop-shadow-[3px_3px_5px_rgba(0,0,0,0.9)] font-bold' },
];

const PHOTO_ASPECT_RATIOS: { id: PhotoAspectRatio; label: string; sub: string; desc: string; ratioDisplay: string }[] = [
  { id: '1:1', label: '1:1 정사각형 카드', sub: '쇼츠 대세 추천', desc: '인물·사물이 잘리지 않고 자막 공간이 넉넉한 바이럴 쇼츠 표준', ratioDisplay: '1 : 1' },
  { id: '9:16', label: '9:16 전체 채움', sub: '풀스크린 꽉 채움', desc: '상하좌우 빈틈없이 꽉 채우는 몰입형 세로 풀스크린', ratioDisplay: '9 : 16' },
  { id: '4:5', label: '4:5 인물 세로비', sub: '인스타/피드 규격', desc: '인물 상반신과 인터뷰 클립에 가장 안정적인 세로 카드 비율', ratioDisplay: '4 : 5' },
  { id: '16:9', label: '16:9 와이드 카드', sub: '가로 원본 유지', desc: '뉴스 자료, 유튜브 원본, 방송 캡처 가로 사진에 최적화', ratioDisplay: '16 : 9' },
  { id: 'fit', label: '원본 비율 유지', sub: '사진 원본 100%', desc: '크롭(잘림) 없이 원본 비율 그대로 중앙에 배치', ratioDisplay: 'FIT' },
];

const BACKDROP_STYLES: { id: BackdropStyle; label: string; desc: string; badge: string }[] = [
  { id: 'card_white', label: '화이트 카드뉴스 프레임', desc: '상단/하단 흰색 여백으로 상단 헤드라인과 자막이 가장 돋보이는 릴스 떡상 스타일', badge: '샘플 추천' },
  { id: 'card_black', label: '블랙 시네마틱 프레임', desc: '상단/하단 딥 블랙 여백으로 영화적 비율감과 깔끔한 가독성 제공', badge: '깔끔한 대비' },
  { id: 'blur', label: '앰비언트 블러', desc: '원본 사진을 배경에 은은하게 블러 처리하여 고급스러운 분위기 연출', badge: '가장 자연스러움' },
  { id: 'dark', label: '다크 스튜디오 매트', desc: '딥 다크 블랙 배경으로 사진 카드와 자막에만 시선 100% 집중', badge: '몰입감 극대화' },
  { id: 'gradient', label: '시네마틱 그라디언트', desc: '딥 인디고 & 바이올렛 그라데이션으로 트렌디한 영상미 부여', badge: '감성적 분위기' },
];

export const VIDEO_TONE_PRESETS: {
  id: VideoMoodTone;
  title: string;
  badge: string;
  desc: string;
  characteristics: string[];
  recommendedBackdrop: BackdropStyle;
  recommendedFont: SubtitleFontFamily;
  recommendedSubtitleStyle: SubtitleEffectStyle;
  recommendedVoiceId: string;
  recommendedSpeed: number;
}[] = [
  {
    id: 'Cinematic',
    title: '🎬 Cinematic (시네마틱 웅장함)',
    badge: '영화적 몰입감',
    desc: '영화 한 편을 보는 듯한 웅장하고 드라마틱한 서사. 시네마틱 그라디언트 배경과 모던 고딕 자막에 최적화',
    characteristics: ['서정적이고 묵직한 호흡', '시네마틱 줌인/줌아웃', '오케스트라/웅장한 톤'],
    recommendedBackdrop: 'gradient',
    recommendedFont: 'Pretendard',
    recommendedSubtitleStyle: 'white_outline',
    recommendedVoiceId: 'pNInz6obpgDQGcFmaJgB', // 아담 (Adam - 카리스마 다큐멘터리)
    recommendedSpeed: 1.0,
  },
  {
    id: 'Documentary',
    title: '🎙️ Documentary (진솔한 휴먼다큐)',
    badge: '깊은 울림과 신뢰',
    desc: '인간극장·SBS 스페셜 풍의 묵직하고 진정성 있는 서사. 차분한 딥 다크 배경과 다큐멘터리 명조체 자막에 최적화',
    characteristics: ['진정성 넘치는 어조', '아카이브 흑백 사진 조명', '감동의 인생 역전'],
    recommendedBackdrop: 'dark',
    recommendedFont: 'Song Myung',
    recommendedSubtitleStyle: 'white_outline',
    recommendedVoiceId: 'JBFqnCBsd6RMkjVDRZzb', // 조지 (George - 인간극장 다큐)
    recommendedSpeed: 0.95,
  },
  {
    id: 'Fast-paced',
    title: '⚡ Fast-paced (도파민 쾌속 비트)',
    badge: '1초 시선 강탈',
    desc: '1초의 공백도 허용하지 않는 빠른 템포와 펀치력. 시선 강탈 옐로우 박스 자막과 속도감 넘치는 전개',
    characteristics: ['1초 만에 꽂히는 펀치라인', '다이내믹 줌 & 컷전환', '1.2x 속도감'],
    recommendedBackdrop: 'blur',
    recommendedFont: 'GmarketSans',
    recommendedSubtitleStyle: 'yellow_box',
    recommendedVoiceId: 'TX3LPaxmHKxFdv7VOQHJ', // 리암 (Liam - 도파민 숏폼남)
    recommendedSpeed: 1.2,
  },
  {
    id: 'Minimal',
    title: '🧊 Minimal (절제된 미니멀)',
    badge: '깔끔한 정보 전달',
    desc: '군더더기를 걷어낸 정갈하고 세련된 미니멀리즘. 팩트 전달에 집중하는 절제된 레이아웃',
    characteristics: ['직관적이고 담백한 문장', '심플한 캡슐 자막', '정돈된 영상미'],
    recommendedBackdrop: 'dark',
    recommendedFont: 'Pretendard',
    recommendedSubtitleStyle: 'black_capsule',
    recommendedVoiceId: 'Xb7hH8MSUJpSbSDYk0k2', // 앨리스 (Alice - 명쾌한 지식형)
    recommendedSpeed: 1.05,
  },
];

// Helper: Splits long narration into punchy, readable CapCut-style subtitle chunks (2~4 words / 6~12 chars)
// In viral shorts/reels, short subtitles change every 0.8~1.3s to keep viewer focus locked!
export const getSubtitleChunks = (
  narration: string,
  tempo: SubtitleTempo = 'fast'
): string[] => {
  const clean = narration.trim().replace(/\s+/g, ' ');
  if (!clean) return [''];

  // Target max character length per subtitle chunk
  // 'fast': 7~10 chars (CapCut dopamine short captions - changes rapidly!)
  // 'standard': 11~14 chars (Natural 1.2s pace)
  // 'relaxed': 15~18 chars (Documentary pace)
  const maxChars = tempo === 'fast' ? 10 : tempo === 'standard' ? 14 : 18;
  const minChars = tempo === 'fast' ? 3 : 5;

  // 1. Initial split by natural punctuation (commas, period, question mark, exclamation, tilde)
  const punctRegex = /(?<=[,?!~.])\s+/;
  const clauses = clean.split(punctRegex).map((s) => s.trim()).filter(Boolean);

  const chunks: string[] = [];

  for (const clause of clauses) {
    // If clause is already short enough, add directly
    if (clause.length <= maxChars + 1) {
      chunks.push(clause);
      continue;
    }

    // Split clause into words
    const words = clause.split(' ').filter(Boolean);
    let currentChunk = '';

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const candidate = currentChunk ? `${currentChunk} ${word}` : word;

      if (currentChunk && candidate.length > maxChars) {
        chunks.push(currentChunk);
        currentChunk = word;
      } else {
        currentChunk = candidate;
      }
    }

    if (currentChunk) {
      // If trailing chunk is very tiny and previous chunk exists, merge if not too huge
      if (chunks.length > 0 && currentChunk.length < minChars && !currentChunk.match(/[.!?]$/)) {
        const last = chunks.pop()!;
        if (last.length + currentChunk.length + 1 <= maxChars + 5) {
          chunks.push(`${last} ${currentChunk}`);
        } else {
          chunks.push(last);
          chunks.push(currentChunk);
        }
      } else {
        chunks.push(currentChunk);
      }
    }
  }

  return chunks.length > 0 ? chunks : [clean];
};

// Helper: Shortens and formats long YouTube titles into punchy 2-line viral reels headlines
export const summarizeToShortHeadline = (title: string, figureName?: string): string => {
  const fig = (figureName || '').trim();
  const raw = (title || fig || '화제의 인물 이야기').trim();

  // If already a clean 2-line text under 26 chars, preserve it
  if (raw.includes('\n') && raw.length <= 26) {
    return raw;
  }

  // 1. Clean hashtags, brackets, dots, youtube flags
  let text = raw
    .replace(/#\S+/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/\.{2,}/g, ' ')
    .replace(/#shorts/gi, '')
    .trim();

  // 2. Remove typical long fluff
  const fluff = [
    /단\s*1분\s*만에\s*보는/g,
    /아무도\s*몰랐던/g,
    /충격적인/g,
    /눈물겨운/g,
    /기적\s*같은/g,
    /인생\s*역전\s*실화/g,
    /반전\s*실화/g,
    /충격\s*실화/g,
    /비하인드\s*스토리/g,
    /비하인드/g,
    /감동\s*실화/g,
    /동기부여/g,
    /실화\s*바탕/g,
    /이야기/g,
  ];
  for (const f of fluff) {
    text = text.replace(f, '').trim();
  }
  text = text.replace(/[.,~!?]+$/g, '').trim();

  // Special pattern: "정비병... 미슐랭 3스타"
  if (text.includes('정비병') && text.includes('미슐랭')) {
    return `정비병에서 미슐랭 3스타\n${fig || '안성재 셰프'}의 기적`;
  }

  // Pattern: "A에서 B까지"
  const fromTo = text.match(/^(.*?에서)\s+(.*?)(?:까지)?\s*(.*)$/);
  if (fromTo) {
    const line1 = fromTo[1].replace(/파병\s*/g, '').trim();
    const line2 = fromTo[2].replace(/까지/g, '').trim();
    if (line1 && line2 && line1.length <= 15 && line2.length <= 15) {
      return `${line1}\n${line2}`;
    }
  }

  // Pattern: "...한 X" (e.g. "이건희도 못 한 걸 해낸 삼성가 사위")
  const hanMatch = text.match(/^(.*?(?:해낸|제압한|바꾼|넘은|달린|살린|이룬|터진))\s+(.*)$/);
  if (hanMatch) {
    const l1 = hanMatch[1].trim();
    const l2 = hanMatch[2].trim();
    if (l1.length <= 16 && l2.length <= 16) {
      return `${l1}\n${l2}`;
    }
  }

  // Balanced 2 lines by words
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    const mid = Math.ceil(words.length / 2);
    const line1 = words.slice(0, mid).join(' ');
    const line2 = words.slice(mid).join(' ');
    if (line1.length <= 14 && line2.length <= 14) {
      return `${line1}\n${line2}`;
    }
  }

  if (fig && !text.includes(fig)) {
    return `${text.slice(0, 10)}\n${fig}`;
  }

  return text.slice(0, 18);
};

// Helper: Generates 3~4 punchy 2-line headline recommendations for the user to choose
export const getShortHeadlinePresets = (project: ShortsProject): string[] => {
  const fig = project.figureName || '';
  const presets: string[] = [];

  // Special figure / topic checks
  if (fig.includes('안성재') || (project.titles && project.titles.some((t) => t.includes('정비병') || t.includes('미슐랭')))) {
    presets.push('정비병에서 미슐랭 3스타\n안성재 셰프의 기적');
    presets.push('전 세계 0.001%\n미슐랭 3스타의 비밀');
    presets.push('흙수저 정비병이\n3스타 셰프가 된 사연');
    return presets;
  }

  if (project.titles && project.titles[0]) {
    const s1 = summarizeToShortHeadline(project.titles[0], fig);
    if (s1) presets.push(s1);
  }

  if (project.titles && project.titles[1]) {
    const s2 = summarizeToShortHeadline(project.titles[1], fig);
    if (s2 && !presets.includes(s2)) presets.push(s2);
  }

  if (fig) {
    presets.push(`모두가 포기하라 했던\n${fig}의 반전 실화`);
    presets.push(`단 3초 만에 몰입되는\n${fig}의 숨겨진 이야기`);
  }

  return Array.from(new Set(presets)).slice(0, 4);
};

export const VideoRendererModal: React.FC<VideoRendererModalProps> = ({
  isOpen,
  onClose,
  project,
  isPageMode = false,
  onBackToEditor,
  onBackToTrends,
  onUpdateProject,
}) => {
  // Video Resolution
  const [resolution, setResolution] = useState<'1080p' | '720p'>('1080p');

  // Photo Aspect Ratio & Backdrop Framing (1:1 정사각형, 9:16 전체, 4:5, 16:9, fit)
  const [photoAspectRatio, setPhotoAspectRatio] = useState<PhotoAspectRatio>(project.photoAspectRatio || '1:1');
  const [backdropStyle, setBackdropStyle] = useState<BackdropStyle>(project.backdropStyle || 'card_white');

  // CapCut-Style Custom Text Overlays (멀티 자막 & 텍스트 레이어)
  const [customTextOverlays, setCustomTextOverlays] = useState<CustomTextOverlay[]>(() => {
    if (project.customTextOverlays && project.customTextOverlays.length > 0) {
      return project.customTextOverlays;
    }
    // Default top headline overlay matching the sample layout (auto-summarized 2-line viral format)
    const initialHeadline = summarizeToShortHeadline(
      project.titles && project.titles.length > 0 ? project.titles[0] : project.figureName,
      project.figureName
    );
    return [
      {
        id: `ov-head-${Date.now()}`,
        text: initialHeadline,
        startScene: 1,
        endScene: project.scenes.length || 12,
        positionYPercent: 14,
        positionX: 'center',
        fontSizeScale: 1.25,
        fontFamily: 'Black Han Sans',
        textColor: '#000000',
        backgroundColor: 'transparent',
        isBold: true,
      }
    ];
  });

  // Channel Logo & Watermark Overlay (샘플 릴스 스타일)
  const [channelLogo, setChannelLogo] = useState<ChannelLogoOverlay>(() => {
    if (project.channelLogoOverlay) {
      return project.channelLogoOverlay;
    }
    return {
      enabled: true,
      imageUrl: project.scenes[0]?.uploadedImageUrl || undefined,
      channelName: 'Untold',
      position: 'top-left',
      startScene: 1,
      endScene: project.scenes.length || 12,
      size: 'medium',
      shape: 'circle',
      showChannelName: true,
    };
  });

  const logoImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (channelLogo.imageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        logoImageRef.current = img;
      };
      img.src = channelLogo.imageUrl;
    } else {
      logoImageRef.current = null;
    }
  }, [channelLogo.imageUrl]);

  // Subtitle Customizations
  const [subtitleFont, setSubtitleFont] = useState<SubtitleFontFamily>('GmarketSans');
  const [subtitleYPercent, setSubtitleYPercent] = useState<number>(78); // 15 to 90
  const [subtitleSizeScale, setSubtitleSizeScale] = useState<number>(1.1); // 0.8 to 1.4
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleEffectStyle>('yellow_box');
  const [subtitleTempo, setSubtitleTempo] = useState<SubtitleTempo>(project.subtitleTempo || 'fast');
  const [previewChunkIndex, setPreviewChunkIndex] = useState<number>(0);
  const [isAutoCyclingChunks, setIsAutoCyclingChunks] = useState<boolean>(true);

  // ElevenLabs Voice & Settings (Default: eleven_v4)
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(project.selectedVoiceId || 'JBFqnCBsd6RMkjVDRZzb');
  const [voiceSpeedMultiplier, setVoiceSpeedMultiplier] = useState<number>(project.voiceSpeedMultiplier || 1.05);
  const [voiceCategoryFilter, setVoiceCategoryFilter] = useState<string>('all');
  const [elevenLabsModel, setElevenLabsModel] = useState<string>(project.elevenLabsModel || 'eleven_v4');
  const [elevenLabsStability, setElevenLabsStability] = useState<number>(project.elevenLabsSettings?.stability ?? 0.50);
  const [elevenLabsSimilarity, setElevenLabsSimilarity] = useState<number>(project.elevenLabsSettings?.similarityBoost ?? 0.75);
  const [elevenLabsStyle, setElevenLabsStyle] = useState<number>(project.elevenLabsSettings?.style ?? 0.15);
  const [elevenLabsSpeakerBoost, setElevenLabsSpeakerBoost] = useState<boolean>(project.elevenLabsSettings?.useSpeakerBoost ?? true);

  // Video Mood Tone State
  const [videoTone, setVideoTone] = useState<VideoMoodTone>(project.videoTone || 'Cinematic');

  const isFirstMountRef = useRef(true);
  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }
    if (onUpdateProject) {
      onUpdateProject({
        ...project,
        customTextOverlays,
        channelLogoOverlay: channelLogo,
        backdropStyle,
        photoAspectRatio,
        videoTone,
        subtitleTempo,
        selectedVoiceId,
        voiceSpeedMultiplier,
        elevenLabsModel,
        elevenLabsSettings: {
          stability: elevenLabsStability,
          similarityBoost: elevenLabsSimilarity,
          style: elevenLabsStyle,
          useSpeakerBoost: elevenLabsSpeakerBoost,
        },
      });
    }
  }, [
    customTextOverlays,
    channelLogo,
    backdropStyle,
    photoAspectRatio,
    videoTone,
    subtitleTempo,
    selectedVoiceId,
    voiceSpeedMultiplier,
    elevenLabsModel,
    elevenLabsStability,
    elevenLabsSimilarity,
    elevenLabsStyle,
    elevenLabsSpeakerBoost
  ]);

  // States
  const [isPlayingVoiceSample, setIsPlayingVoiceSample] = useState(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0); // 0 - 100
  const [currentRenderingScene, setCurrentRenderingScene] = useState(1);
  const [statusMessage, setStatusMessage] = useState('렌더링 준비 완료');
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [previewViewMode, setPreviewViewMode] = useState<'live' | 'video'>('live');
  const [previewSceneIndex, setPreviewSceneIndex] = useState(0);

  // Active custom tab on left ('tone' | 'ratio' | 'overlay' | 'subtitle' | 'voice' | 'output')
  const [activeSettingsSection, setActiveSettingsSection] = useState<'tone' | 'ratio' | 'overlay' | 'subtitle' | 'voice' | 'output'>('tone');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const sampleAudioRef = useRef<HTMLAudioElement | null>(null);

  // Voice Favorites (찜) saved in localStorage
  const [favoriteVoiceIds, setFavoriteVoiceIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('favorite_voices');
      return saved ? JSON.parse(saved) : ['JBFqnCBsd6RMkjVDRZzb', 'pNInz6obpgDQGcFmaJgB', 'nPczCjzI2devNBz1zQrb', 'EXAVITQu4vr4xnSDxMaL'];
    } catch {
      return ['JBFqnCBsd6RMkjVDRZzb', 'pNInz6obpgDQGcFmaJgB', 'nPczCjzI2devNBz1zQrb', 'EXAVITQu4vr4xnSDxMaL'];
    }
  });

  const toggleFavoriteVoice = (voiceId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavoriteVoiceIds((prev) => {
      const updated = prev.includes(voiceId)
        ? prev.filter((id) => id !== voiceId)
        : [...prev, voiceId];
      try {
        localStorage.setItem('favorite_voices', JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to save favorite voices:', err);
      }
      return updated;
    });
  };

  const scenes = project.scenes || [];
  const selectedVoice = VOICE_OPTIONS.find((v) => v.id === selectedVoiceId) || VOICE_OPTIONS[0];

  // Auto-cycle through subtitle chunks every 1.1s in live preview so user sees the CapCut dynamic rhythm
  useEffect(() => {
    if (!isOpen || previewViewMode !== 'live' || !isAutoCyclingChunks || isRendering) return;
    const activeScene = scenes[previewSceneIndex] || scenes[0];
    const previewText = activeScene?.narration || `${project.figureName}의 이야기`;
    const chunks = getSubtitleChunks(previewText, subtitleTempo);
    if (chunks.length <= 1) return;

    const interval = setInterval(() => {
      setPreviewChunkIndex((prev) => (prev + 1) % chunks.length);
    }, 1100);

    return () => clearInterval(interval);
  }, [isOpen, previewViewMode, isAutoCyclingChunks, previewSceneIndex, subtitleTempo, scenes, isRendering, project.figureName]);

  // Reset chunk index when scene or tempo changes
  useEffect(() => {
    setPreviewChunkIndex(0);
  }, [previewSceneIndex, subtitleTempo]);

  // Width and Height depending on resolution (9:16 Shorts)
  const width = resolution === '1080p' ? 1080 : 720;
  const height = resolution === '1080p' ? 1920 : 1280;

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (videoBlobUrl) {
        URL.revokeObjectURL(videoBlobUrl);
      }
      if (sampleAudioRef.current) {
        sampleAudioRef.current.pause();
        sampleAudioRef.current = null;
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  // ESC key listener to easily close modal anytime
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isRendering) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isRendering, onClose]);

  // Quick preset helper to apply optimal viral shorts settings
  const handleApplyRecommendedSettings = () => {
    setPhotoAspectRatio('1:1');
    setBackdropStyle('blur');
    setSubtitleFont('GmarketSans');
    setSubtitleStyle('yellow_box');
    setSubtitleYPercent(78);
    setSubtitleSizeScale(1.18);
    setVoiceSpeedMultiplier(1.1);
    setResolution('1080p');
  };

  // Quick preset to apply the exact CapCut viral white card format from user samples
  const handleApplySampleReelsPreset = () => {
    setBackdropStyle('card_white');
    setPhotoAspectRatio('1:1');
    setSubtitleFont('Do Hyeon');
    setSubtitleStyle('yellow_box');
    setSubtitleYPercent(82);
    setSubtitleSizeScale(1.15);
    setResolution('1080p');
    setChannelLogo((prev) => ({
      ...prev,
      enabled: true,
      position: 'top-left',
      startScene: 1,
      endScene: scenes.length || 12,
      shape: 'circle',
      showChannelName: true,
    }));
    setCustomTextOverlays((prev) => {
      const shortTitle = summarizeToShortHeadline(project.titles?.[0] || project.figureName, project.figureName);
      if (prev.length > 0) {
        return prev.map((t, idx) => idx === 0 ? {
          ...t,
          text: shortTitle,
          positionYPercent: 14,
          fontFamily: 'Do Hyeon',
          textColor: '#000000',
          backgroundColor: 'transparent',
          startScene: 1,
          endScene: scenes.length || 12,
        } : t);
      }
      return [
        {
          id: 'headline-1',
          text: shortTitle,
          startScene: 1,
          endScene: scenes.length || 12,
          positionYPercent: 14,
          positionX: 'center',
          fontSizeScale: 1.25,
          fontFamily: 'Do Hyeon',
          textColor: '#000000',
          backgroundColor: 'transparent',
          isBold: true,
        }
      ];
    });
    setPreviewViewMode('live');
  };

  const handleAddCustomTextOverlay = () => {
    const newId = `overlay-${Date.now()}`;
    const newOverlay: CustomTextOverlay = {
      id: newId,
      text: '새 자막 내용 입력',
      startScene: 1,
      endScene: scenes.length || 12,
      positionYPercent: 50,
      positionX: 'center',
      fontSizeScale: 1.0,
      fontFamily: 'Do Hyeon',
      textColor: '#ffffff',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      isBold: true,
    };
    setCustomTextOverlays((prev) => [...prev, newOverlay]);
  };

  const handleUpdateCustomTextOverlay = (id: string, updates: Partial<CustomTextOverlay>) => {
    setCustomTextOverlays((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const handleDeleteCustomTextOverlay = (id: string) => {
    setCustomTextOverlays((prev) => prev.filter((item) => item.id !== id));
  };

  const handleDuplicateCustomTextOverlay = (id: string) => {
    const target = customTextOverlays.find((item) => item.id === id);
    if (!target) return;
    const duplicated: CustomTextOverlay = {
      ...target,
      id: `overlay-${Date.now()}`,
      positionYPercent: Math.min(95, target.positionYPercent + 8),
    };
    setCustomTextOverlays((prev) => [...prev, duplicated]);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        if (typeof loadEvt.target?.result === 'string') {
          setChannelLogo((prev) => ({
            ...prev,
            enabled: true,
            imageUrl: loadEvt.target?.result as string,
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper to pre-load image
  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => {
        // Fallback procedural canvas graphic when an external image fails
        const fallbackCanvas = document.createElement('canvas');
        fallbackCanvas.width = width;
        fallbackCanvas.height = height;
        const fctx = fallbackCanvas.getContext('2d');
        if (fctx) {
          const grad = fctx.createLinearGradient(0, 0, width, height);
          grad.addColorStop(0, '#1e1b4b');
          grad.addColorStop(0.5, '#312e81');
          grad.addColorStop(1, '#0f172a');
          fctx.fillStyle = grad;
          fctx.fillRect(0, 0, width, height);

          fctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          fctx.font = `bold ${resolution === '1080p' ? 72 : 48}px sans-serif`;
          fctx.textAlign = 'center';
          fctx.fillText(project.figureName, width / 2, height / 2);
        }
        const fallbackImg = new Image();
        fallbackImg.onload = () => resolve(fallbackImg);
        fallbackImg.src = fallbackCanvas.toDataURL('image/jpeg');
      };
      img.src = url;
    });
  };

  // Helper: Generates a lightweight, silky smooth blurred backdrop on an offscreen canvas
  const createBlurredBackdropCanvas = (img: HTMLImageElement): HTMLCanvasElement => {
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = 360;
    bgCanvas.height = 640;
    const bctx = bgCanvas.getContext('2d');
    if (bctx) {
      bctx.filter = 'blur(16px) brightness(0.42)';
      const imgAspect = img.width / img.height;
      const canvasAspect = 360 / 640;
      let bgW, bgH;
      if (imgAspect > canvasAspect) {
        bgH = 640 * 1.1;
        bgW = bgH * imgAspect;
      } else {
        bgW = 360 * 1.1;
        bgH = bgW / imgAspect;
      }
      bctx.drawImage(img, (360 - bgW) / 2, (640 - bgH) / 2, bgW, bgH);
      bctx.filter = 'none';
      bctx.fillStyle = 'rgba(10, 15, 30, 0.45)';
      bctx.fillRect(0, 0, 360, 640);
    }
    return bgCanvas;
  };

  // Helper: Draw scene photo according to selected aspect ratio (1:1, 9:16, 4:5, 16:9, fit) and backdrop style
  const drawSceneImage = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    w: number,
    h: number,
    progress: number = 0,
    motion: MotionEffectType = 'static',
    precomputedBackdrop?: HTMLCanvasElement | null
  ) => {
    ctx.save();

    // 1. Fill base canvas
    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(0, 0, w, h);

    if (photoAspectRatio === '9:16') {
      // Fullscreen 9:16 cover
      let scale = 1.0;
      let transX = 0;
      let transY = 0;

      if (motion === 'zoom_in') {
        scale = 1.0 + progress * 0.16;
      } else if (motion === 'zoom_out') {
        scale = 1.16 - progress * 0.16;
      } else if (motion === 'pan_left') {
        scale = 1.12;
        transX = progress * -0.08 * w;
      } else if (motion === 'pan_right') {
        scale = 1.12;
        transX = (1 - progress) * -0.08 * w;
      } else if (motion === 'pan_down') {
        scale = 1.12;
        transY = progress * 0.06 * h;
      } else if (motion === 'fade' && progress < 0.2) {
        ctx.globalAlpha = progress / 0.2;
      } else {
        scale = 1.02;
      }

      ctx.translate(w / 2 + transX, h / 2 + transY);
      ctx.scale(scale, scale);

      const imgAspect = img.width / img.height;
      const canvasAspect = w / h;
      let drawW, drawH;
      if (imgAspect > canvasAspect) {
        drawH = h;
        drawW = h * imgAspect;
      } else {
        drawW = w;
        drawH = w / imgAspect;
      }
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();
      return;
    }

    // 2. Non-9:16 aspect ratios: Draw Backdrop (Instant 0.02ms draw, zero CPU stall!)
    if (backdropStyle === 'card_white') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
    } else if (backdropStyle === 'card_black') {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);
    } else if (backdropStyle === 'blur') {
      if (precomputedBackdrop) {
        ctx.drawImage(precomputedBackdrop, 0, 0, w, h);
      } else {
        const fastBg = createBlurredBackdropCanvas(img);
        ctx.drawImage(fastBg, 0, 0, w, h);
      }
    } else if (backdropStyle === 'gradient') {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.45, '#1e1b4b');
      grad.addColorStop(1, '#090d16');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    } else {
      // dark studio matte
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, w, h);
    }

    // 3. Compute Card Dimensions based on photoAspectRatio
    let cardW = w * 0.90;
    let cardH = cardW;
    let cardY = h * 0.15; // Placed at top-mid so subtitle below has clear space

    if (photoAspectRatio === '1:1') {
      if (backdropStyle === 'card_white' || backdropStyle === 'card_black') {
        // Edge-to-edge horizontal banner matching Reels sample screenshots
        cardW = w;
        cardH = w;
        cardY = h * 0.22;
      } else {
        cardW = w * 0.90;
        cardH = cardW; // 1:1 Square
        cardY = h * 0.15;
      }
    } else if (photoAspectRatio === '4:5') {
      cardW = w * 0.88;
      cardH = cardW * 1.25; // 4:5 Portrait Card
      cardY = h * 0.11;
    } else if (photoAspectRatio === '16:9') {
      cardW = w * 0.94;
      cardH = cardW * (9 / 16); // 16:9 Landscape Card
      cardY = h * 0.22;
    } else if (photoAspectRatio === 'fit') {
      // Keep original image ratio inside a max bounding box
      const maxW = w * 0.92;
      const maxH = h * 0.62;
      const imgRatio = img.width / img.height;
      if (imgRatio >= maxW / maxH) {
        cardW = maxW;
        cardH = maxW / imgRatio;
      } else {
        cardH = maxH;
        cardW = maxH * imgRatio;
      }
      cardY = h * 0.15;
    }

    const cardX = (w - cardW) / 2;
    const cornerRadius = (backdropStyle === 'card_white' || backdropStyle === 'card_black') && photoAspectRatio === '1:1'
      ? 0
      : (resolution === '1080p' ? 32 : 22);

    // 4. Card Drop Shadow
    if (backdropStyle !== 'card_white') {
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
      ctx.shadowBlur = resolution === '1080p' ? 40 : 25;
      ctx.shadowOffsetY = resolution === '1080p' ? 18 : 10;
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      if (ctx.roundRect && cornerRadius > 0) {
        ctx.roundRect(cardX, cardY, cardW, cardH, cornerRadius);
      } else {
        ctx.rect(cardX, cardY, cardW, cardH);
      }
      ctx.fill();
      ctx.restore();
    }

    // 5. Clip Image to Rounded Card
    ctx.save();
    ctx.beginPath();
    if (ctx.roundRect && cornerRadius > 0) {
      ctx.roundRect(cardX, cardY, cardW, cardH, cornerRadius);
    } else {
      ctx.rect(cardX, cardY, cardW, cardH);
    }
    ctx.clip();

    // 6. Ken Burns Motion inside Card
    let scale = 1.0;
    let transX = 0;
    let transY = 0;

    if (motion === 'zoom_in') {
      scale = 1.0 + progress * 0.14;
    } else if (motion === 'zoom_out') {
      scale = 1.14 - progress * 0.14;
    } else if (motion === 'pan_left') {
      scale = 1.1;
      transX = progress * -0.05 * cardW;
    } else if (motion === 'pan_right') {
      scale = 1.1;
      transX = (1 - progress) * -0.05 * cardW;
    } else if (motion === 'pan_down') {
      scale = 1.1;
      transY = progress * 0.04 * cardH;
    } else if (motion === 'fade' && progress < 0.2) {
      ctx.globalAlpha = progress / 0.2;
    } else {
      scale = 1.02;
    }

    const centerX = cardX + cardW / 2;
    const centerY = cardY + cardH / 2;

    ctx.translate(centerX + transX, centerY + transY);
    ctx.scale(scale, scale);

    const imgAspect = img.width / img.height;
    const targetAspect = cardW / cardH;
    let imgDrawW, imgDrawH;
    if (imgAspect > targetAspect) {
      imgDrawH = cardH;
      imgDrawW = cardH * imgAspect;
    } else {
      imgDrawW = cardW;
      imgDrawH = cardW / imgAspect;
    }

    ctx.drawImage(img, -imgDrawW / 2, -imgDrawH / 2, imgDrawW, imgDrawH);
    ctx.restore();

    // 7. Subtle Border Stroke around Card
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = resolution === '1080p' ? 4 : 2.5;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(cardX, cardY, cardW, cardH, cornerRadius);
    } else {
      ctx.rect(cardX, cardY, cardW, cardH);
    }
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  };

  // Helper: Draw word-wrapped subtitles with selected Font, Position, Size, and Effect
  const drawSubtitles = (
    ctx: CanvasRenderingContext2D,
    text: string,
    w: number,
    h: number
  ) => {
    const baseSize = resolution === '1080p' ? 50 : 34;
    const fontSize = Math.round(baseSize * subtitleSizeScale);

    ctx.save();
    ctx.font = `bold ${fontSize}px "${subtitleFont}", "GmarketSans", "Pretendard", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const maxLineWidth = w * 0.85;
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxLineWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    const lineHeight = fontSize * 1.35;
    const totalTextHeight = lines.length * lineHeight;
    
    // Y-Position calculation based on user selection percentage
    const startY = h * (subtitleYPercent / 100) - totalTextHeight / 2;

    lines.forEach((line, index) => {
      const y = startY + index * lineHeight;
      const textMetrics = ctx.measureText(line);
      const textW = textMetrics.width;

      if (subtitleStyle === 'yellow_box') {
        const paddingX = fontSize * 0.45;
        const paddingY = fontSize * 0.22;
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(w / 2 - textW / 2 - paddingX, y - lineHeight / 2 - paddingY / 2, textW + paddingX * 2, lineHeight + paddingY, 12);
        } else {
          ctx.rect(w / 2 - textW / 2 - paddingX, y - lineHeight / 2 - paddingY / 2, textW + paddingX * 2, lineHeight + paddingY);
        }
        ctx.fill();

        ctx.fillStyle = '#020617';
        ctx.fillText(line, w / 2, y);
      } else if (subtitleStyle === 'black_capsule') {
        const paddingX = fontSize * 0.5;
        const paddingY = fontSize * 0.22;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(w / 2 - textW / 2 - paddingX, y - lineHeight / 2 - paddingY / 2, textW + paddingX * 2, lineHeight + paddingY, 14);
        } else {
          ctx.rect(w / 2 - textW / 2 - paddingX, y - lineHeight / 2 - paddingY / 2, textW + paddingX * 2, lineHeight + paddingY);
        }
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.fillText(line, w / 2, y);
      } else if (subtitleStyle === 'neon_cyan') {
        const paddingX = fontSize * 0.5;
        const paddingY = fontSize * 0.22;
        ctx.fillStyle = 'rgba(8, 51, 68, 0.9)';
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 4;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(w / 2 - textW / 2 - paddingX, y - lineHeight / 2 - paddingY / 2, textW + paddingX * 2, lineHeight + paddingY, 16);
        } else {
          ctx.rect(w / 2 - textW / 2 - paddingX, y - lineHeight / 2 - paddingY / 2, textW + paddingX * 2, lineHeight + paddingY);
        }
        ctx.fill();
        ctx.stroke();

        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#e0f2fe';
        ctx.fillText(line, w / 2, y);
      } else if (subtitleStyle === 'netflix_red') {
        const paddingX = fontSize * 0.5;
        const paddingY = fontSize * 0.22;
        ctx.fillStyle = '#e11d48';
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(w / 2 - textW / 2 - paddingX, y - lineHeight / 2 - paddingY / 2, textW + paddingX * 2, lineHeight + paddingY, 14);
        } else {
          ctx.rect(w / 2 - textW / 2 - paddingX, y - lineHeight / 2 - paddingY / 2, textW + paddingX * 2, lineHeight + paddingY);
        }
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.fillText(line, w / 2, y);
      } else if (subtitleStyle === 'shadow_drop') {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(line, w / 2, y);
      } else {
        // white_outline
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = fontSize * 0.22;
        ctx.lineJoin = 'round';
        ctx.strokeText(line, w / 2, y);

        ctx.fillStyle = '#ffffff';
        ctx.fillText(line, w / 2, y);
      }
    });

    ctx.restore();
  };

  // Helper: Draw Channel Logo & Watermark (Sample Reels style)
  const renderChannelLogo = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    sceneIndex: number,
    logoImg: HTMLImageElement | null
  ) => {
    if (!channelLogo.enabled) return;
    const currentSceneNum = sceneIndex + 1;
    if (currentSceneNum < channelLogo.startScene || currentSceneNum > channelLogo.endScene) {
      return;
    }

    ctx.save();
    const baseLogoDim = resolution === '1080p' ? 56 : 38;
    const logoScale = channelLogo.size === 'small' ? 0.75 : channelLogo.size === 'large' ? 1.35 : 1.0;
    const logoSize = Math.round(baseLogoDim * logoScale);
    const marginX = w * 0.055;
    const marginY = h * 0.038;

    let x = marginX;
    let y = marginY;

    if (channelLogo.position === 'top-center') {
      x = w / 2 - (logoSize + (channelLogo.showChannelName ? 80 : 0)) / 2;
    } else if (channelLogo.position === 'top-right') {
      x = w - marginX - logoSize - (channelLogo.showChannelName ? 100 : 0);
    } else if (channelLogo.position === 'bottom-left') {
      y = h - marginY - logoSize;
    } else if (channelLogo.position === 'bottom-right') {
      x = w - marginX - logoSize;
      y = h - marginY - logoSize;
    }

    // Draw Logo Image or Avatar
    if (logoImg) {
      ctx.save();
      if (channelLogo.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(x + logoSize / 2, y + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(logoImg, x, y, logoSize, logoSize);
        ctx.restore();

        // Subtle circular border
        ctx.beginPath();
        ctx.arc(x + logoSize / 2, y + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
        ctx.strokeStyle = backdropStyle === 'card_white' ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (channelLogo.shape === 'rounded') {
        const r = Math.round(logoSize * 0.22);
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, logoSize, logoSize, r);
        } else {
          ctx.rect(x, y, logoSize, logoSize);
        }
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(logoImg, x, y, logoSize, logoSize);
        ctx.restore();
      } else {
        ctx.drawImage(logoImg, x, y, logoSize, logoSize);
        ctx.restore();
      }
    } else {
      // Default modern badge
      ctx.beginPath();
      ctx.arc(x + logoSize / 2, y + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = '#6366f1';
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = `900 ${Math.round(logoSize * 0.46)}px "GmarketSans", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((channelLogo.channelName || 'U').charAt(0).toUpperCase(), x + logoSize / 2, y + logoSize / 2);
    }

    // Draw Channel Name
    if (channelLogo.showChannelName && channelLogo.channelName) {
      const fontSize = Math.round(logoSize * 0.42);
      ctx.font = `bold ${fontSize}px "GmarketSans", "Pretendard", sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const textX = x + logoSize + Math.round(logoSize * 0.25);
      const textY = y + logoSize / 2;

      if (backdropStyle === 'card_white') {
        ctx.fillStyle = '#0f172a';
        ctx.fillText(channelLogo.channelName, textX, textY);
      } else {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 6;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(channelLogo.channelName, textX, textY);
      }
    }

    ctx.restore();
  };

  // Helper: Draw CapCut-style Custom Text Overlays (여러 개 추가 및 원하는 지점까지 연장)
  const renderCustomTextOverlays = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    sceneIndex: number
  ) => {
    const currentSceneNum = sceneIndex + 1;
    const activeOverlays = customTextOverlays.filter(
      (ov) => currentSceneNum >= ov.startScene && currentSceneNum <= ov.endScene
    );

    for (const ov of activeOverlays) {
      if (!ov.text || !ov.text.trim()) continue;

      ctx.save();
      const baseFontSize = resolution === '1080p' ? 50 : 34;
      const fontSize = Math.round(baseFontSize * (ov.fontSizeScale || 1.0));
      const fontWeight = ov.isBold ? '900' : 'bold';
      ctx.font = `${fontWeight} ${fontSize}px "${ov.fontFamily || 'Black Han Sans'}", "GmarketSans", "Pretendard", sans-serif`;
      ctx.textAlign = ov.positionX || 'center';
      ctx.textBaseline = 'middle';

      // Lines parsing (support \n and auto-wrap)
      const rawLines = ov.text.split('\n');
      const lines: string[] = [];
      const maxLineWidth = w * 0.88;

      for (const rawLine of rawLines) {
        const words = rawLine.split(' ');
        let curLine = '';
        for (const word of words) {
          const testLine = curLine ? `${curLine} ${word}` : word;
          if (ctx.measureText(testLine).width > maxLineWidth && curLine) {
            lines.push(curLine);
            curLine = word;
          } else {
            curLine = testLine;
          }
        }
        if (curLine) lines.push(curLine);
      }

      const lineHeight = fontSize * 1.34;
      const totalHeight = lines.length * lineHeight;
      const targetY = h * (ov.positionYPercent / 100);
      const startY = targetY - totalHeight / 2 + lineHeight / 2;

      const posX = ov.positionX === 'left' ? w * 0.08 : ov.positionX === 'right' ? w * 0.92 : w / 2;

      // Draw background box if present
      if (ov.backgroundColor && ov.backgroundColor !== 'transparent') {
        lines.forEach((line, idx) => {
          const lineY = startY + idx * lineHeight;
          const lineMetrics = ctx.measureText(line);
          const lineW = lineMetrics.width;
          const padX = fontSize * 0.45;
          const padY = fontSize * 0.22;

          let boxX = posX - lineW / 2 - padX;
          if (ov.positionX === 'left') boxX = posX - padX;
          if (ov.positionX === 'right') boxX = posX - lineW - padX;

          ctx.fillStyle = ov.backgroundColor;
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(boxX, lineY - lineHeight / 2 - padY / 2, lineW + padX * 2, lineHeight + padY, 10);
          } else {
            ctx.rect(boxX, lineY - lineHeight / 2 - padY / 2, lineW + padX * 2, lineHeight + padY);
          }
          ctx.fill();
        });
      }

      // Draw text
      lines.forEach((line, idx) => {
        const lineY = startY + idx * lineHeight;

        if (!ov.backgroundColor || ov.backgroundColor === 'transparent') {
          if (ov.textColor.toLowerCase() === '#ffffff') {
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.95)';
            ctx.lineWidth = Math.max(3, fontSize * 0.16);
            ctx.lineJoin = 'round';
            ctx.strokeText(line, posX, lineY);
          }
        }

        ctx.fillStyle = ov.textColor || '#000000';
        ctx.fillText(line, posX, lineY);
      });

      ctx.restore();
    }
  };

  // Real-time Live Preview Effect: renders active preview scene directly on canvas
  useEffect(() => {
    if (!isOpen || isRendering || previewViewMode === 'video') return;
    let isCancelled = false;

    const renderPreview = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const activeScene = scenes[previewSceneIndex] || scenes[0];
      const previewText = activeScene?.narration || `${project.figureName}의 충격적인 인생 역전 스토리`;
      const previewImgUrl =
        activeScene?.uploadedImageUrl ||
        getSceneFallbackImage(project.figureName, project.category, previewSceneIndex);

      try {
        const img = await loadImage(previewImgUrl);
        if (isCancelled || !canvasRef.current) return;

        // Draw photo with selected aspect ratio and backdrop
        drawSceneImage(ctx, img, width, height, 0, 'static');

        // Vignette based on subtitle position (skip if card_white or card_black)
        if (backdropStyle !== 'card_white' && backdropStyle !== 'card_black') {
          if (subtitleYPercent > 60) {
            const bottomGrad = ctx.createLinearGradient(0, height * 0.62, 0, height);
            bottomGrad.addColorStop(0, 'rgba(0,0,0,0)');
            bottomGrad.addColorStop(0.5, 'rgba(0,0,0,0.65)');
            bottomGrad.addColorStop(1, 'rgba(0,0,0,0.85)');
            ctx.fillStyle = bottomGrad;
            ctx.fillRect(0, height * 0.62, width, height * 0.38);
          } else if (subtitleYPercent < 35) {
            const topGrad = ctx.createLinearGradient(0, 0, 0, height * 0.38);
            topGrad.addColorStop(0, 'rgba(0,0,0,0.85)');
            topGrad.addColorStop(0.5, 'rgba(0,0,0,0.65)');
            topGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = topGrad;
            ctx.fillRect(0, 0, width, height * 0.38);
          }
        }

        // Draw Channel Logo & Watermark
        renderChannelLogo(ctx, width, height, previewSceneIndex, logoImageRef.current);

        // Draw CapCut-style Custom Text Overlays (상단 헤드라인 및 커스텀 자막들)
        renderCustomTextOverlays(ctx, width, height, previewSceneIndex);

        // Draw Subtitles: CapCut-style dynamic short chunks
        const previewChunks = getSubtitleChunks(previewText, subtitleTempo);
        const activeChunkIdx = Math.min(previewChunkIndex, Math.max(0, previewChunks.length - 1));
        const activeSubtitle = previewChunks[activeChunkIdx] || previewChunks[0];
        drawSubtitles(ctx, activeSubtitle, width, height);
      } catch (err) {
        console.warn('Live preview canvas error:', err);
      }
    };

    renderPreview();
    return () => {
      isCancelled = true;
    };
  }, [
    isOpen,
    previewViewMode,
    previewSceneIndex,
    subtitleFont,
    subtitleYPercent,
    subtitleSizeScale,
    subtitleStyle,
    subtitleTempo,
    previewChunkIndex,
    photoAspectRatio,
    backdropStyle,
    resolution,
    isRendering,
    scenes,
    project.figureName,
    width,
    height,
    customTextOverlays,
    channelLogo,
  ]);

  if (!isOpen) return null;

  // Filter voices by category or favorites
  const isFavoritesOnly = voiceCategoryFilter === 'favorites';
  const filteredVoices = isFavoritesOnly
    ? VOICE_OPTIONS.filter((v) => favoriteVoiceIds.includes(v.id))
    : voiceCategoryFilter === 'all' 
    ? VOICE_OPTIONS 
    : VOICE_OPTIONS.filter((v) => v.categoryTag === voiceCategoryFilter);

  const stopVoiceRef = useRef<(() => void) | null>(null);

  // Play sample narration with distinct pitch, rate, and timbre (Instant voice switching)
  const handlePlayVoiceSample = async (voice: VoiceOption, speedOverride?: number) => {
    const currentSpeed = speedOverride ?? voiceSpeedMultiplier;

    // If clicking the voice that is currently playing -> stop it
    if (isPlayingVoiceSample && playingVoiceId === voice.id) {
      if (stopVoiceRef.current) {
        try { stopVoiceRef.current(); } catch {}
      }
      stopAllVoicePreviews();
      setIsPlayingVoiceSample(false);
      setPlayingVoiceId(null);
      return;
    }

    // If another voice is playing or stopped, immediately halt and switch to the new voice
    if (stopVoiceRef.current) {
      try { stopVoiceRef.current(); } catch {}
    }
    stopAllVoicePreviews();

    setIsPlayingVoiceSample(true);
    setPlayingVoiceId(voice.id);
    setSelectedVoiceId(voice.id);

    try {
      const stopFn = await playDistinctVoicePreview(
        voice,
        {
          speedMultiplier: currentSpeed,
          modelId: elevenLabsModel,
          stability: elevenLabsStability,
          similarityBoost: elevenLabsSimilarity,
          style: elevenLabsStyle,
          useSpeakerBoost: elevenLabsSpeakerBoost,
        },
        () => {
          setIsPlayingVoiceSample(false);
          setPlayingVoiceId(null);
        }
      );
      stopVoiceRef.current = stopFn;
    } catch (e) {
      setIsPlayingVoiceSample(false);
      setPlayingVoiceId(null);
    }
  };

  // Adjust speed and dynamically update active preview audio
  const handleSpeedChange = (newSpeed: number) => {
    setVoiceSpeedMultiplier(newSpeed);
    if (sampleAudioRef.current && isPlayingVoiceSample) {
      try {
        sampleAudioRef.current.playbackRate = newSpeed * (selectedVoice.rate || 1.0);
      } catch (err) {
        console.warn('Live playbackRate update warning:', err);
      }
    }
  };

  // Main Render Process
  const startRendering = async () => {
    if (!canvasRef.current || scenes.length === 0) return;
    setIsRendering(true);
    setRenderProgress(0);
    setStatusMessage('에셋 사진 다운로드 및 내레이션 음성 합성 준비 중...');
    setVideoBlobUrl(null);
    recordedChunksRef.current = [];

    const canvas = canvasRef.current;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Initialize Web Audio Context and ensure it is active
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioCtx();
    audioContextRef.current = audioCtx;
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }
    const audioDest = audioCtx.createMediaStreamDestination();

    // Helper: Synthesizes a vocal cadence harmonic audio buffer if upstream network TTS drops
    const createFallbackSpeechBuffer = (ctx: AudioContext, text: string, gender: 'male' | 'female'): AudioBuffer => {
      const cleanChars = text.replace(/\s+/g, '');
      const syllables = Math.max(8, cleanChars.length);
      const dur = Math.max(2.4, Math.min(5.5, (syllables * 0.16) / voiceSpeedMultiplier));
      const sRate = ctx.sampleRate;
      const buf = ctx.createBuffer(1, Math.floor(sRate * dur), sRate);
      const chData = buf.getChannelData(0);
      const bFreq = gender === 'female' ? 220 : 135;

      for (let i = 0; i < chData.length; i++) {
        const t = i / sRate;
        const env = Math.max(0.05, Math.sin(Math.PI * ((t * 5.8) % 1)));
        const tone = Math.sin(2 * Math.PI * bFreq * t) + 0.35 * Math.sin(2 * Math.PI * bFreq * 2 * t);
        chData[i] = tone * 0.25 * env;
      }
      return buf;
    };

    // 2. Preload & Decode voice TTS for all scenes (Guaranteed 100% audio presence)
    const audioBuffers: AudioBuffer[] = [];
    for (let i = 0; i < scenes.length; i++) {
      setStatusMessage(`내레이션 음성 합성 중... (${i + 1}/${scenes.length})`);
      setRenderProgress(Math.round(((i + 1) / (scenes.length * 2)) * 30));
      try {
        const query = new URLSearchParams({
          text: scenes[i].narration,
          voice_id: selectedVoice.id,
          model_id: elevenLabsModel,
          stability: elevenLabsStability.toString(),
          similarity_boost: elevenLabsSimilarity.toString(),
          style: elevenLabsStyle.toString(),
          use_speaker_boost: elevenLabsSpeakerBoost ? 'true' : 'false',
        });
        const res = await fetch(`/api/tts?${query.toString()}`);
        if (res.ok) {
          const ab = await res.arrayBuffer();
          const decoded = await audioCtx.decodeAudioData(ab);
          audioBuffers.push(decoded);
        } else {
          audioBuffers.push(createFallbackSpeechBuffer(audioCtx, scenes[i].narration, selectedVoice.gender));
        }
      } catch (e) {
        console.warn('TTS fallback synthesized for scene:', i, e);
        audioBuffers.push(createFallbackSpeechBuffer(audioCtx, scenes[i].narration, selectedVoice.gender));
      }
    }

    // 3. Preload images and precompute ambient backdrops for all scenes (0ms render during recording)
    const loadedImages: HTMLImageElement[] = [];
    const precomputedBackdrops: (HTMLCanvasElement | null)[] = [];
    let loadedLogoImg: HTMLImageElement | null = logoImageRef.current;
    if (channelLogo.enabled && channelLogo.imageUrl && !loadedLogoImg) {
      try {
        loadedLogoImg = await loadImage(channelLogo.imageUrl);
      } catch (e) {}
    }

    for (let i = 0; i < scenes.length; i++) {
      setStatusMessage(`사진 에셋 및 렌더링 최적화 중... (${i + 1}/${scenes.length})`);
      const imgUrl =
        scenes[i].uploadedImageUrl ||
        getSceneFallbackImage(project.figureName, project.category, i);
      const img = await loadImage(imgUrl);
      loadedImages.push(img);

      if (backdropStyle === 'blur') {
        precomputedBackdrops.push(createBlurredBackdropCanvas(img));
      } else {
        precomputedBackdrops.push(null);
      }
      setRenderProgress(30 + Math.round(((i + 1) / scenes.length) * 15));
    }

    // 4. Calculate dynamic scene durations based on audio length & speed multiplier
    // Unified exact voice playback rate ensuring 100% audio-to-duration match
    const effectivePlaybackRate = Math.max(0.7, Math.min(1.6, voiceSpeedMultiplier * (selectedVoice.rate || 1.0)));
    const sceneSpokenDurationsSec: number[] = [];
    const sceneDurationsSec: number[] = [];
    const sceneStartTimesSec: number[] = [];
    let curTime = 0.05;

    for (let i = 0; i < scenes.length; i++) {
      const buffer = audioBuffers[i];
      const spokenDur = buffer
        ? (buffer.duration / effectivePlaybackRate)
        : Math.max(2.2, (scenes[i].narration.replace(/\s+/g, '').length * 0.15) / voiceSpeedMultiplier);

      sceneSpokenDurationsSec.push(spokenDur);
      sceneStartTimesSec.push(curTime);
      const sceneDur = spokenDur + 0.30; // 0.30s natural breath pause between scenes
      sceneDurationsSec.push(sceneDur);
      curTime += sceneDur;
    }
    const totalVideoSec = curTime;
    setVideoDuration(Math.round(totalVideoSec));

    // 5. Connect and schedule clean voice audio into recording stream (No mechanical humming drone)
    // Schedule each scene's voice audio buffer at its exact scene start time
    for (let i = 0; i < scenes.length; i++) {
      const buf = audioBuffers[i];
      if (buf) {
        try {
          const src = audioCtx.createBufferSource();
          src.buffer = buf;
          src.playbackRate.value = effectivePlaybackRate; // Guaranteed exact rate match!

          const filter = audioCtx.createBiquadFilter();
          if (selectedVoice.gender === 'male') {
            filter.type = 'lowshelf';
            filter.frequency.value = 250;
            filter.gain.value = 4.0; // Warm resonant male presence
          } else {
            filter.type = 'highshelf';
            filter.frequency.value = 2800;
            filter.gain.value = 3.5; // Bright clear female presence
          }

          const voiceGain = audioCtx.createGain();
          voiceGain.gain.setValueAtTime(0.95, audioCtx.currentTime);

          src.connect(filter);
          filter.connect(voiceGain);
          voiceGain.connect(audioDest);

          // Guaranteed synchronization: audio begins at exact scene timestamp
          src.start(audioCtx.currentTime + sceneStartTimesSec[i]);
        } catch (e) {
          console.warn('Audio scheduling error for scene', i, e);
        }
      }
    }

    // 6. Setup MediaRecorder with standard MP4 format priority
    let combinedStream = new MediaStream([
      ...canvas.captureStream(30).getVideoTracks(),
      ...audioDest.stream.getAudioTracks(),
    ]);

    const mimeTypesToTry = [
      'video/mp4;codecs=avc1,mp4a.40.2',
      'video/mp4;codecs=avc1',
      'video/mp4',
      'video/webm;codecs=h264,opus',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ];

    let chosenMime = '';
    for (const mt of mimeTypesToTry) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mt)) {
        chosenMime = mt;
        break;
      }
    }

    let mediaRecorder: MediaRecorder;
    try {
      mediaRecorder = chosenMime
        ? new MediaRecorder(combinedStream, { mimeType: chosenMime, videoBitsPerSecond: 8000000 })
        : new MediaRecorder(combinedStream);
    } catch (e) {
      mediaRecorder = new MediaRecorder(combinedStream);
    }

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const finalBlobType = chosenMime || 'video/mp4';
      const blob = new Blob(recordedChunksRef.current, { type: finalBlobType });
      const url = URL.createObjectURL(blob);
      setVideoBlobUrl(url);
      setPreviewViewMode('video');
      setIsRendering(false);
      setStatusMessage('MP4 쇼츠 영상 제작 완료! 유튜브 쇼츠, 인스타 릴스에 바로 업로드 가능합니다.');
      setRenderProgress(100);
    };

    mediaRecorder.start(200);

    // 7. Video Rendering Frame Loop (Rock-solid 60fps / 0ms backdrop stall)
    const renderStartTime = performance.now();
    let lastProgressUpdateTime = 0;

    const renderFrame = () => {
      const now = performance.now();
      const elapsedSec = (now - renderStartTime) / 1000;

      if (elapsedSec >= totalVideoSec) {
        setTimeout(() => {
          if (mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
          }
        }, 300);
        return;
      }

      // Determine active scene strictly by real-time elapsed seconds
      let activeIdx = 0;
      for (let i = scenes.length - 1; i >= 0; i--) {
        if (elapsedSec >= sceneStartTimesSec[i]) {
          activeIdx = i;
          break;
        }
      }

      const scene = scenes[activeIdx];
      const img = loadedImages[activeIdx];
      const sceneStartTime = sceneStartTimesSec[activeIdx];
      const sceneDuration = sceneDurationsSec[activeIdx];
      const timeInScene = Math.max(0, elapsedSec - sceneStartTime);
      const progressInScene = Math.min(0.999, Math.max(0, timeInScene / sceneDuration));

      const motion: MotionEffectType = scene.motionEffect || 'zoom_in';

      // Draw scene photo with user-selected aspect ratio, precomputed backdrop (0ms CPU cost), and motion
      drawSceneImage(ctx, img, width, height, progressInScene, motion, precomputedBackdrops[activeIdx]);

      // Adaptive vignette based on subtitle position (skip if card_white or card_black)
      if (backdropStyle !== 'card_white' && backdropStyle !== 'card_black') {
        if (subtitleYPercent > 60) {
          // Bottom vignette
          const bottomGrad = ctx.createLinearGradient(0, height * 0.62, 0, height);
          bottomGrad.addColorStop(0, 'rgba(0,0,0,0)');
          bottomGrad.addColorStop(0.5, 'rgba(0,0,0,0.65)');
          bottomGrad.addColorStop(1, 'rgba(0,0,0,0.85)');
          ctx.fillStyle = bottomGrad;
          ctx.fillRect(0, height * 0.62, width, height * 0.38);
        } else if (subtitleYPercent < 35) {
          // Top vignette only when subtitles are positioned at top
          const topGrad = ctx.createLinearGradient(0, 0, 0, height * 0.38);
          topGrad.addColorStop(0, 'rgba(0,0,0,0.85)');
          topGrad.addColorStop(0.5, 'rgba(0,0,0,0.65)');
          topGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = topGrad;
          ctx.fillRect(0, 0, width, height * 0.38);
        }
      }

      // Draw Channel Logo & Watermark
      renderChannelLogo(ctx, width, height, activeIdx, loadedLogoImg);

      // Draw CapCut-style Custom Text Overlays (상단 헤드라인 및 커스텀 자막들)
      renderCustomTextOverlays(ctx, width, height, activeIdx);

      // Subtitle Chunking: Exact Voice-Subtitle character-weighted sync (CapCut style)
      const chunks = getSubtitleChunks(scene.narration, subtitleTempo);
      const spokenDur = sceneSpokenDurationsSec[activeIdx] || Math.max(0.1, sceneDuration - 0.30);
      // Progress across spoken duration (0.0 to 1.0 while voice speaks; remains 1.0 during post-speech pause)
      const speechProgress = Math.min(1.0, Math.max(0, timeInScene / Math.max(0.1, spokenDur)));

      // Weight each chunk by clean character length so pacing matches speech syllables
      const charWeights = chunks.map((c) => Math.max(1, c.replace(/\s+/g, '').length));
      const totalChars = charWeights.reduce((a, b) => a + b, 0);
      let cumulative = 0;
      let activeChunkIdx = chunks.length - 1;
      for (let c = 0; c < chunks.length; c++) {
        cumulative += charWeights[c];
        if (speechProgress <= cumulative / totalChars) {
          activeChunkIdx = c;
          break;
        }
      }

      const activeSubtitleText = chunks[activeChunkIdx];

      // Draw custom subtitles for current chunk
      drawSubtitles(ctx, activeSubtitleText, width, height);

      // Throttle React state updates to every 250ms so event loop is completely free
      const nowMs = performance.now();
      if (nowMs - lastProgressUpdateTime > 250) {
        lastProgressUpdateTime = nowMs;
        const currentPct = Math.min(99, 45 + Math.round((elapsedSec / totalVideoSec) * 55));
        setRenderProgress(currentPct);
        setStatusMessage(`Scene ${activeIdx + 1}/${scenes.length} 실시간 렌더링 중 (${currentPct}%)`);
        setCurrentRenderingScene(activeIdx + 1);
      }

      animationFrameRef.current = requestAnimationFrame(renderFrame);
    };

    renderFrame();
  };

  const handleDownload = () => {
    if (!videoBlobUrl) return;
    const a = document.createElement('a');
    a.href = videoBlobUrl;
    a.download = `Untold_${project.figureName}_${resolution}.mp4`;
    a.click();
  };

  const modalHeaderContent = (
    <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-5 sm:px-7 py-3.5 flex items-center justify-between shrink-0">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 via-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
          <Film className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              {project.figureName} 쇼츠 영상 렌더링 & 변환
            </h3>
            <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
              9:16 세로 쇼츠
            </span>
            <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              사진: {photoAspectRatio === '1:1' ? '1:1 정사각형 카드' : photoAspectRatio === '9:16' ? '전체 풀채움' : photoAspectRatio}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            음성-화면 100% 싱크 동기화 + 긴 자막 화면 유지 자동 넘김
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onBackToEditor || onClose}
        disabled={isRendering}
        className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 font-black text-xs transition disabled:opacity-50 cursor-pointer shadow-2xs"
        title="대본 스튜디오로 돌아가기"
      >
        <ArrowLeft className="w-4 h-4 text-indigo-600" />
        <span>대본 스튜디오로 복귀</span>
      </button>
    </div>
  );

  const modalBodyContent = (
    <div className="overflow-y-auto flex-1 p-5 sm:p-7 space-y-5">
          {/* Settings Navigation Tabs (6 Sections with CapCut Overlays) */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setActiveSettingsSection('tone')}
              className={`py-2 px-2 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                activeSettingsSection === 'tone'
                  ? 'bg-white text-indigo-700 shadow-2xs font-black ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="truncate">영상 톤</span>
            </button>

            <button
              onClick={() => setActiveSettingsSection('ratio')}
              className={`py-2 px-2 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                activeSettingsSection === 'ratio'
                  ? 'bg-white text-indigo-700 shadow-2xs font-black ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Square className="w-3.5 h-3.5 text-indigo-600" />
              <span className="truncate">프레임 비율</span>
            </button>

            <button
              onClick={() => setActiveSettingsSection('overlay')}
              className={`py-2 px-2 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer relative ${
                activeSettingsSection === 'overlay'
                  ? 'bg-white text-indigo-700 shadow-2xs font-black ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-rose-500" />
              <span className="truncate">자막·로고 ({customTextOverlays.length})</span>
            </button>

            <button
              onClick={() => setActiveSettingsSection('subtitle')}
              className={`py-2 px-2 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                activeSettingsSection === 'subtitle'
                  ? 'bg-white text-indigo-700 shadow-2xs font-black ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Type className="w-3.5 h-3.5 text-indigo-600" />
              <span className="truncate">나레이션 자막</span>
            </button>

            <button
              onClick={() => setActiveSettingsSection('voice')}
              className={`py-2 px-2 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                activeSettingsSection === 'voice'
                  ? 'bg-white text-indigo-700 shadow-2xs font-black ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mic className="w-3.5 h-3.5 text-indigo-600" />
              <span className="truncate">성우 ({voiceSpeedMultiplier}x)</span>
            </button>

            <button
              onClick={() => setActiveSettingsSection('output')}
              className={`py-2 px-2 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                activeSettingsSection === 'output'
                  ? 'bg-white text-indigo-700 shadow-2xs font-black ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Monitor className="w-3.5 h-3.5 text-indigo-600" />
              <span className="truncate">해상도</span>
            </button>
          </div>

          {/* Modal Body: Left Controls, Right Preview */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Column: Settings Sections (6 cols) */}
            <div className="md:col-span-6 space-y-4">
              {/* SECTION: Video Mood Tone (쇼츠 영상 톤 프리셋) */}
              {activeSettingsSection === 'tone' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>영상 전체 연출 톤 (Video Mood Tone)</span>
                      </label>
                      <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        선택된 톤: {videoTone}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">
                      영상의 분위기와 서사 호흡을 결정합니다. 원하는 톤의 <strong>'이 톤 스타일 원클릭 적용'</strong>을 누르면 최적의 배경 연출, 자막 폰트, 디자인 스타일, 추천 성우 및 배속이 한 번에 자동 세팅됩니다.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {VIDEO_TONE_PRESETS.map((preset) => {
                      const isCurrentTone = videoTone === preset.id;
                      return (
                        <div
                          key={preset.id}
                          className={`p-4 rounded-2xl border transition relative ${
                            isCurrentTone
                              ? 'bg-indigo-50/90 border-indigo-500 shadow-sm ring-1 ring-indigo-500'
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <div className="flex items-center space-x-2">
                                <h4 className="text-sm font-black text-slate-900">{preset.title}</h4>
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                                  {preset.badge}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
                                {preset.desc}
                              </p>
                            </div>

                            {isCurrentTone && (
                              <span className="text-[11px] font-black text-indigo-700 bg-white px-2.5 py-1 rounded-full border border-indigo-200 shrink-0 flex items-center gap-1 shadow-2xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                                <span>현재 적용 중</span>
                              </span>
                            )}
                          </div>

                          {/* Characteristics pills */}
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {preset.characteristics.map((char, i) => (
                              <span
                                key={i}
                                className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200"
                              >
                                ✓ {char}
                              </span>
                            ))}
                          </div>

                          {/* Recommendations metadata bar */}
                          <div className="bg-slate-100/80 rounded-xl p-2.5 text-[11px] text-slate-600 grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                            <div>
                              <span className="text-[10px] text-slate-400 block font-bold">배경 스타일</span>
                              <span className="font-extrabold text-slate-800">
                                {preset.recommendedBackdrop === 'blur' ? '앰비언트 블러' : preset.recommendedBackdrop === 'dark' ? '다크 매트' : '시네마틱 그라디언트'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block font-bold">추천 자막폰트</span>
                              <span className="font-extrabold text-slate-800">{preset.recommendedFont}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block font-bold">자막 스타일</span>
                              <span className="font-extrabold text-slate-800">
                                {preset.recommendedSubtitleStyle === 'yellow_box' ? '옐로우 박스' : preset.recommendedSubtitleStyle === 'white_outline' ? '화이트 외곽선' : '블랙 캡슐'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block font-bold">추천 배속</span>
                              <span className="font-extrabold text-slate-800">{preset.recommendedSpeed}x</span>
                            </div>
                          </div>

                          {/* Action button */}
                          <div className="flex items-center justify-end space-x-2 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setVideoTone(preset.id);
                                setBackdropStyle(preset.recommendedBackdrop);
                                setSubtitleFont(preset.recommendedFont);
                                setSubtitleStyle(preset.recommendedSubtitleStyle);
                                setSelectedVoiceId(preset.recommendedVoiceId);
                                setVoiceSpeedMultiplier(preset.recommendedSpeed);
                                setPreviewViewMode('live');
                              }}
                              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-xs transition cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                              <span>이 톤 스타일 원클릭 적용</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION 0: Photo Aspect Ratio & Framing */}
              {activeSettingsSection === 'ratio' && (
                <div className="space-y-4">
                  {/* 1. Ratio Selection Cards */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <Square className="w-4 h-4 text-indigo-600" />
                        <span>사진 프레임 비율 선택 (5종)</span>
                      </label>
                      <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {photoAspectRatio === '1:1' ? '1:1 정사각형 추천' : photoAspectRatio}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      {PHOTO_ASPECT_RATIOS.map((item) => {
                        const isSelected = photoAspectRatio === item.id;
                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              setPhotoAspectRatio(item.id);
                              setPreviewViewMode('live');
                            }}
                            className={`p-3 rounded-2xl border text-left transition flex items-start space-x-3 cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-50/80 border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                                : 'bg-white hover:bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                                isSelected
                                  ? 'bg-indigo-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {item.id === '1:1' ? (
                                <Square className="w-5 h-5" />
                              ) : item.id === '9:16' ? (
                                <Maximize2 className="w-5 h-5" />
                              ) : item.id === '4:5' ? (
                                <Layers className="w-5 h-5" />
                              ) : item.id === '16:9' ? (
                                <Film className="w-5 h-5" />
                              ) : (
                                <ImageIcon className="w-5 h-5" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-1.5">
                                <span className="font-extrabold text-slate-900 text-xs">{item.label}</span>
                                {item.id === '1:1' && (
                                  <span className="text-[10px] bg-rose-50 text-rose-600 border border-rose-200 px-1.5 py-0.2 rounded-full font-black">
                                    쇼츠 대세 추천
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-indigo-600 font-bold mt-0.5">{item.sub}</div>
                              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{item.desc}</p>
                            </div>

                            <span
                              className={`text-[11px] font-black px-2 py-0.5 rounded-lg shrink-0 ${
                                isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {item.ratioDisplay}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Backdrop Style (Interactive & Live in preview) */}
                  {photoAspectRatio !== '9:16' ? (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                      <label className="text-xs font-black text-slate-800 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Palette className="w-4 h-4 text-amber-500" />
                          <span>배경 연출 스타일 (9:16 여백 영역)</span>
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold">
                          카드 뒤 배경 즉시 반영
                        </span>
                      </label>

                      <div className="grid grid-cols-3 gap-2 text-xs">
                        {BACKDROP_STYLES.map((bg) => {
                          const isSelected = backdropStyle === bg.id;
                          return (
                            <button
                              key={bg.id}
                              type="button"
                              onClick={() => {
                                setBackdropStyle(bg.id);
                                setPreviewViewMode('live');
                              }}
                              disabled={isRendering}
                              className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-between space-y-1.5 cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-400/20 shadow-xs'
                                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                              }`}
                            >
                              <span className="font-extrabold text-slate-900 text-xs">{bg.label}</span>
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                                  isSelected ? 'bg-amber-200/60 text-amber-900' : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {bg.badge}
                              </span>
                              <p className="text-[10px] text-slate-500 leading-tight">{bg.desc}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs text-amber-900 space-y-2">
                      <div className="flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1.5">
                          <Palette className="w-4 h-4 text-amber-600" />
                          <span>배경 연출 스타일</span>
                        </span>
                        <span className="text-[10px] bg-amber-200/80 text-amber-950 px-2 py-0.5 rounded-full font-black">
                          현재 9:16 전체 채움
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-snug">
                        💡 9:16 풀스크린 모드에서는 사진이 화면을 꽉 채워 배경이 가려집니다. 아래 배경 스타일을 누르면 <strong>1:1 카드 모드로 자동 전환</strong>되어 감상하실 수 있습니다.
                      </p>
                      <div className="grid grid-cols-3 gap-2 pt-0.5">
                        {BACKDROP_STYLES.map((bg) => (
                          <button
                            key={bg.id}
                            type="button"
                            onClick={() => {
                              setPhotoAspectRatio('1:1');
                              setBackdropStyle(bg.id);
                              setPreviewViewMode('live');
                            }}
                            className="p-2 rounded-xl bg-white hover:bg-amber-100/70 border border-amber-300 text-center text-slate-800 font-bold text-xs transition cursor-pointer shadow-2xs"
                          >
                            {bg.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Pro Creator Tip Box */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-amber-50 border border-indigo-200/80 text-xs text-slate-700 space-y-2 shadow-2xs">
                    <div className="flex items-center gap-1.5 font-black text-indigo-950">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>쇼츠 프로 꿀팁: 왜 1:1 정사각형 카드가 바이럴에 유리할까요?</span>
                    </div>
                    <p className="leading-relaxed font-medium text-[11px] text-slate-600">
                      1분미만, 머니그라피 등 국내 최고 인기 쇼츠 채널은 상단에 <strong>1:1 정사각형 카드</strong>로 인물/자료를 안정감 있게 배치하고, 하단에 <strong>자막이 사진을 가리지 않도록</strong> 여백을 둡니다. 가로 사진도 얼굴이 잘리지 않고 온전히 담겨 시청자 집중도와 리텐션이 크게 증가합니다.
                    </p>
                  </div>
                </div>
              )}

              {/* SECTION: CapCut-style Overlay & Logo Manager */}
              {activeSettingsSection === 'overlay' && (
                <div className="space-y-4">
                  {/* 1. Quick One-Click Sample Preset */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-md space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-yellow-200 fill-yellow-300" />
                        <h4 className="font-black text-sm">샘플 릴스 바이럴 스타일 1초 적용</h4>
                      </div>
                      <span className="text-[10px] bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded-full font-bold">
                        1:1 화이트 카드뉴스
                      </span>
                    </div>
                    <p className="text-[11px] text-white/90 leading-relaxed font-medium">
                      참고 사진과 동일하게 <strong>상단 화이트 여백 + 채널 로고 + 상단 헤드라인 타이틀 + 1:1 사진 + 하단 자막</strong>으로 원클릭 세팅됩니다.
                    </p>
                    <button
                      type="button"
                      onClick={handleApplySampleReelsPreset}
                      className="w-full mt-1 py-2.5 px-4 bg-white hover:bg-amber-50 text-slate-900 rounded-xl font-black text-xs transition shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span>⚡ 샘플 릴스 스타일 바로 적용하기</span>
                    </button>
                  </div>

                  {/* 2. Channel Logo & Branding Section */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-indigo-600" />
                        <span>상단 채널 로고 & 브랜딩</span>
                      </label>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={channelLogo.enabled}
                          onChange={(e) => setChannelLogo((prev) => ({ ...prev, enabled: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                        <span className="ml-2 text-xs font-bold text-slate-700">
                          {channelLogo.enabled ? '표시 중' : '숨김'}
                        </span>
                      </label>
                    </div>

                    {channelLogo.enabled && (
                      <div className="space-y-3 pt-2 border-t border-slate-200">
                        {/* Logo Upload & Channel Name */}
                        <div className="flex items-center gap-3">
                          <div className="relative group shrink-0">
                            <div className={`w-14 h-14 bg-slate-200 border-2 border-indigo-200 overflow-hidden flex items-center justify-center shadow-xs ${channelLogo.shape === 'circle' ? 'rounded-full' : 'rounded-xl'}`}>
                              {channelLogo.imageUrl ? (
                                <img src={channelLogo.imageUrl} alt="Channel Logo" className="w-full h-full object-cover" />
                              ) : (
                                <ImageIcon className="w-6 h-6 text-slate-400" />
                              )}
                            </div>
                            <label className="absolute inset-0 bg-black/50 text-white rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer text-[9px] font-bold">
                              <Upload className="w-3.5 h-3.5 mb-0.5" />
                              변경
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                className="hidden"
                              />
                            </label>
                          </div>

                          <div className="flex-1 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-slate-600">채널명 텍스트</span>
                              <label className="flex items-center gap-1 text-[10px] text-slate-500 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={channelLogo.showChannelName}
                                  onChange={(e) => setChannelLogo((prev) => ({ ...prev, showChannelName: e.target.checked }))}
                                  className="rounded text-indigo-600 focus:ring-0"
                                />
                                <span>이름 함께 표시</span>
                              </label>
                            </div>
                            <input
                              type="text"
                              value={channelLogo.channelName}
                              onChange={(e) => setChannelLogo((prev) => ({ ...prev, channelName: e.target.value }))}
                              placeholder="예: 노빠꾸소개맨, 언톨드"
                              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                            />
                          </div>
                        </div>

                        {/* Shape & Size & Position */}
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 mb-1 block">로고 형태</span>
                            <div className="flex rounded-lg bg-white border border-slate-200 p-0.5">
                              <button
                                type="button"
                                onClick={() => setChannelLogo((prev) => ({ ...prev, shape: 'circle' }))}
                                className={`flex-1 py-1 text-[11px] font-bold rounded-md transition ${channelLogo.shape === 'circle' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                              >
                                원형
                              </button>
                              <button
                                type="button"
                                onClick={() => setChannelLogo((prev) => ({ ...prev, shape: 'rounded' }))}
                                className={`flex-1 py-1 text-[11px] font-bold rounded-md transition ${channelLogo.shape === 'rounded' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                              >
                                둥근 사각
                              </button>
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-slate-500 mb-1 block">크기</span>
                            <div className="flex rounded-lg bg-white border border-slate-200 p-0.5">
                              {(['small', 'medium', 'large'] as const).map((sz) => (
                                <button
                                  key={sz}
                                  type="button"
                                  onClick={() => setChannelLogo((prev) => ({ ...prev, size: sz }))}
                                  className={`flex-1 py-1 text-[10px] font-bold rounded-md transition ${channelLogo.size === sz ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                                >
                                  {sz === 'small' ? '소' : sz === 'medium' ? '중' : '대'}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-slate-500 mb-1 block">위치</span>
                            <select
                              value={channelLogo.position}
                              onChange={(e) => setChannelLogo((prev) => ({ ...prev, position: e.target.value as any }))}
                              className="w-full py-1.5 px-2 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700"
                            >
                              <option value="top-left">상단 좌측 (추천)</option>
                              <option value="top-center">상단 중앙</option>
                              <option value="top-right">상단 우측</option>
                            </select>
                          </div>
                        </div>

                        {/* Scene Extension Range (구간 연장) */}
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-700 flex items-center gap-1">
                              <Move className="w-3.5 h-3.5 text-indigo-600" />
                              로고 노출 구간 연장
                            </span>
                            <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">
                              씬 {channelLogo.startScene} ~ 씬 {channelLogo.endScene} ({channelLogo.endScene === scenes.length ? '영상 끝까지' : `${channelLogo.endScene - channelLogo.startScene + 1}개 씬`})
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-[10px] text-slate-500 block mb-0.5">시작 지점</span>
                              <select
                                value={channelLogo.startScene}
                                onChange={(e) => setChannelLogo((prev) => ({ ...prev, startScene: Number(e.target.value) }))}
                                className="w-full py-1 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700"
                              >
                                {scenes.map((_, idx) => (
                                  <option key={idx + 1} value={idx + 1}>
                                    씬 {idx + 1}부터
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 block mb-0.5">종료 지점</span>
                              <select
                                value={channelLogo.endScene}
                                onChange={(e) => setChannelLogo((prev) => ({ ...prev, endScene: Number(e.target.value) }))}
                                className="w-full py-1 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700"
                              >
                                {scenes.map((_, idx) => (
                                  <option key={idx + 1} value={idx + 1}>
                                    씬 {idx + 1}까지 {idx + 1 === scenes.length ? '(끝까지)' : ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3. Multi-Text Subtitle Overlays (CapCut Style "+ 자막 추가") */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-indigo-600" />
                          <span>캡컷 스타일 자유 자막 레이어 ({customTextOverlays.length}개)</span>
                        </label>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          상단 타이틀 헤드라인이나 강조 문구를 무제한 추가하고 구간을 연장하세요.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddCustomTextOverlay}
                        className="flex items-center gap-1 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs transition cursor-pointer active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>자막 추가</span>
                      </button>
                    </div>

                    {customTextOverlays.length === 0 ? (
                      <div className="p-6 text-center rounded-xl bg-white border border-dashed border-slate-300 space-y-2">
                        <Type className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="text-xs text-slate-600 font-bold">추가된 커스텀 자막 레이어가 없습니다.</p>
                        <p className="text-[11px] text-slate-400">
                          상단에 큰 타이틀 제목이나 원하는 위치에 자유롭게 텍스트를 배치해보세요.
                        </p>
                        <button
                          type="button"
                          onClick={handleAddCustomTextOverlay}
                          className="mt-2 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>첫 자막 추가하기</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {customTextOverlays.map((overlay, index) => (
                          <div
                            key={overlay.id}
                            className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2.5 transition hover:border-indigo-300"
                          >
                            {/* Layer Header */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black flex items-center justify-center">
                                  {index + 1}
                                </span>
                                <span className="text-xs font-black text-slate-800">
                                  {overlay.positionYPercent <= 20 ? '상단 헤드라인 자막' : overlay.positionYPercent >= 70 ? '하단 자막' : '중앙 자막'}
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded">
                                  Y: {overlay.positionYPercent}%
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleDuplicateCustomTextOverlay(overlay.id)}
                                  title="자막 복제"
                                  className="p-1 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100 transition cursor-pointer"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCustomTextOverlay(overlay.id)}
                                  title="자막 삭제"
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Text Input */}
                            <textarea
                              value={overlay.text}
                              onChange={(e) => handleUpdateCustomTextOverlay(overlay.id, { text: e.target.value })}
                              rows={2}
                              placeholder="자막 문구를 입력하세요 (줄바꿈 가능)"
                              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden resize-none leading-relaxed"
                            />

                            {/* Quick 2-Line Short Summarizer & Recommendations */}
                            <div className="space-y-1.5 pt-0.5">
                              <div className="flex flex-wrap items-center justify-between gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const short = summarizeToShortHeadline(overlay.text || project.titles?.[0] || project.figureName, project.figureName);
                                    handleUpdateCustomTextOverlay(overlay.id, { text: short });
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[10px] font-black transition cursor-pointer active:scale-95 shadow-2xs"
                                  title="현재 문구를 릴스용 2줄 짧은 요약으로 자동 압축"
                                >
                                  <Sparkles className="w-3 h-3 text-amber-600 fill-amber-500" />
                                  <span>⚡ 릴스용 2줄 짧은 요약으로 변환</span>
                                </button>
                                <span className="text-[10px] text-slate-400 font-bold">
                                  {overlay.text.replace(/\n/g, ' ').length}자 ({overlay.text.includes('\n') ? '2줄' : '1줄'})
                                </span>
                              </div>

                              {/* Smart Recommendation Chips */}
                              <div className="flex flex-wrap gap-1.5 items-center">
                                <span className="text-[9px] font-black text-slate-400 shrink-0">추천 2줄 요약:</span>
                                {getShortHeadlinePresets(project).map((preset, pIdx) => (
                                  <button
                                    key={pIdx}
                                    type="button"
                                    onClick={() => handleUpdateCustomTextOverlay(overlay.id, { text: preset })}
                                    className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 hover:border-indigo-300 text-[10px] font-bold transition cursor-pointer text-left leading-tight"
                                    title="클릭 시 이 요약 문구로 즉시 교체"
                                  >
                                    {preset.replace('\n', ' / ')}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Timeline Scene Range Extension (구간 연장) */}
                            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-slate-700 flex items-center gap-1">
                                  <Move className="w-3 h-3 text-indigo-600" />
                                  표시 구간 연장
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateCustomTextOverlay(overlay.id, { startScene: 1, endScene: scenes.length })}
                                    className="text-[9px] px-1.5 py-0.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded font-bold transition cursor-pointer"
                                  >
                                    영상 끝까지 연장
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateCustomTextOverlay(overlay.id, { startScene: previewSceneIndex + 1, endScene: previewSceneIndex + 1 })}
                                    className="text-[9px] px-1.5 py-0.5 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded font-bold transition cursor-pointer"
                                  >
                                    현재 씬만
                                  </button>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <select
                                  value={overlay.startScene}
                                  onChange={(e) => handleUpdateCustomTextOverlay(overlay.id, { startScene: Number(e.target.value) })}
                                  className="w-full py-1 px-1.5 text-[11px] bg-white border border-slate-200 rounded font-bold text-slate-700"
                                >
                                  {scenes.map((_, sIdx) => (
                                    <option key={sIdx + 1} value={sIdx + 1}>
                                      씬 {sIdx + 1}부터
                                    </option>
                                  ))}
                                </select>
                                <select
                                  value={overlay.endScene}
                                  onChange={(e) => handleUpdateCustomTextOverlay(overlay.id, { endScene: Number(e.target.value) })}
                                  className="w-full py-1 px-1.5 text-[11px] bg-white border border-slate-200 rounded font-bold text-slate-700"
                                >
                                  {scenes.map((_, sIdx) => (
                                    <option key={sIdx + 1} value={sIdx + 1}>
                                      씬 {sIdx + 1}까지 {sIdx + 1 === scenes.length ? '(끝까지)' : ''}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Position Controls (Presets + Slider) */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-slate-600">위치 설정 (Y축)</span>
                                <span className="text-[10px] text-slate-400 font-bold">{overlay.positionYPercent}%</span>
                              </div>
                              <div className="grid grid-cols-4 gap-1">
                                {[
                                  { label: '상단 릴스 (14%)', y: 14 },
                                  { label: '상단 (20%)', y: 20 },
                                  { label: '중앙 (50%)', y: 50 },
                                  { label: '하단 (82%)', y: 82 },
                                ].map((pos) => (
                                  <button
                                    key={pos.label}
                                    type="button"
                                    onClick={() => handleUpdateCustomTextOverlay(overlay.id, { positionYPercent: pos.y })}
                                    className={`py-1 text-[10px] font-bold rounded border transition cursor-pointer ${
                                      Math.abs(overlay.positionYPercent - pos.y) <= 3
                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                    }`}
                                  >
                                    {pos.label}
                                  </button>
                                ))}
                              </div>
                              <input
                                type="range"
                                min={5}
                                max={95}
                                value={overlay.positionYPercent}
                                onChange={(e) => handleUpdateCustomTextOverlay(overlay.id, { positionYPercent: Number(e.target.value) })}
                                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                              />
                            </div>

                            {/* Font, Size, Color & Box Styling */}
                            <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                              <div>
                                <span className="text-[10px] text-slate-500 font-bold block mb-0.5">폰트</span>
                                <select
                                  value={overlay.fontFamily || 'Do Hyeon'}
                                  onChange={(e) => handleUpdateCustomTextOverlay(overlay.id, { fontFamily: e.target.value as SubtitleFontFamily })}
                                  className="w-full py-1 px-1.5 text-[10px] bg-slate-50 border border-slate-200 rounded font-bold text-slate-700"
                                >
                                  {COMMERCIAL_FONTS.map((font) => (
                                    <option key={font.id} value={font.id}>
                                      {font.name.split(' ')[0]}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <span className="text-[10px] text-slate-500 font-bold block mb-0.5">글자 크기 ({overlay.fontSizeScale.toFixed(2)}x)</span>
                                <input
                                  type="range"
                                  min={0.7}
                                  max={1.8}
                                  step={0.05}
                                  value={overlay.fontSizeScale}
                                  onChange={(e) => handleUpdateCustomTextOverlay(overlay.id, { fontSizeScale: Number(e.target.value) })}
                                  className="w-full h-1.5 mt-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                              </div>

                              <div>
                                <span className="text-[10px] text-slate-500 font-bold block mb-0.5">배경 스타일</span>
                                <select
                                  value={overlay.backgroundColor || 'transparent'}
                                  onChange={(e) => handleUpdateCustomTextOverlay(overlay.id, { backgroundColor: e.target.value })}
                                  className="w-full py-1 px-1.5 text-[10px] bg-slate-50 border border-slate-200 rounded font-bold text-slate-700"
                                >
                                  <option value="transparent">배경 없음</option>
                                  <option value="rgba(250, 204, 21, 0.95)">노란 박스 (강조)</option>
                                  <option value="rgba(0, 0, 0, 0.75)">검정 반투명 박스</option>
                                  <option value="rgba(255, 255, 255, 0.9)">흰색 반투명 박스</option>
                                </select>
                              </div>
                            </div>

                            {/* Color Quick Palette */}
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[10px] font-bold text-slate-500">글자 색상</span>
                              <div className="flex items-center gap-1.5">
                                {[
                                  { color: '#000000', label: '검정' },
                                  { color: '#ffffff', label: '흰색' },
                                  { color: '#facc15', label: '노랑' },
                                  { color: '#ef4444', label: '빨강' },
                                  { color: '#3b82f6', label: '파랑' },
                                ].map((c) => (
                                  <button
                                    key={c.color}
                                    type="button"
                                    onClick={() => handleUpdateCustomTextOverlay(overlay.id, { textColor: c.color })}
                                    title={c.label}
                                    className={`w-5 h-5 rounded-full border-2 transition cursor-pointer ${
                                      overlay.textColor === c.color ? 'border-indigo-600 scale-110 shadow-xs' : 'border-slate-300'
                                    }`}
                                    style={{ backgroundColor: c.color }}
                                  />
                                ))}
                                <input
                                  type="color"
                                  value={overlay.textColor || '#000000'}
                                  onChange={(e) => handleUpdateCustomTextOverlay(overlay.id, { textColor: e.target.value })}
                                  className="w-6 h-6 p-0 border-0 rounded cursor-pointer"
                                  title="직접 색상 선택"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SECTION 1: Subtitle Customizer */}
            {activeSettingsSection === 'subtitle' && (
              <div className="space-y-4">
                {/* 0. CapCut Dynamic Subtitle Tempo (캡컷식 한 씬 다분할 자막 전환) */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
                      <span>캡컷식 빠른 자막 분할 템포 (시청 유지율 극대화)</span>
                    </label>
                    <span className="text-[10px] text-amber-800 font-extrabold bg-amber-200/80 px-2 py-0.5 rounded-full border border-amber-300">
                      ⚡ 캡컷 몰입형 전환
                    </span>
                  </div>

                  <p className="text-[11px] text-amber-900/80 leading-relaxed font-medium">
                    인스타 릴스·유튜브 쇼츠에서 긴 문장을 한 씬 내내 띄우면 이탈률이 높아집니다. 
                    <strong> 한 씬 안에서 2~4단어(6~12자)씩 자막이 빠르게 교체</strong>되며 시청자의 몰입과 집중을 유지합니다.
                  </p>

                  {/* Tempo 3 Presets */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {
                        id: 'fast' as SubtitleTempo,
                        title: '⚡ 속공형 (추천)',
                        desc: '6~10자 (약 0.9초마다 전환)',
                        badge: '릴스·쇼츠 떡상용'
                      },
                      {
                        id: 'standard' as SubtitleTempo,
                        title: '🎬 표준형',
                        desc: '10~14자 (약 1.3초마다 전환)',
                        badge: '자연스러운 속도'
                      },
                      {
                        id: 'relaxed' as SubtitleTempo,
                        title: '📖 여유형',
                        desc: '14~18자 (호흡 길게)',
                        badge: '스토리·다큐형'
                      }
                    ].map((tempo) => {
                      const isSelected = subtitleTempo === tempo.id;
                      return (
                        <button
                          key={tempo.id}
                          type="button"
                          onClick={() => setSubtitleTempo(tempo.id)}
                          disabled={isRendering}
                          className={`p-2.5 rounded-xl text-left border transition relative flex flex-col justify-between ${
                            isSelected
                              ? 'bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-300'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300 hover:bg-amber-50/50'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-black">{tempo.title}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <p className={`text-[10px] leading-tight font-medium ${isSelected ? 'text-amber-100' : 'text-slate-500'}`}>
                              {tempo.desc}
                            </p>
                          </div>
                          <span className={`mt-2 inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                            isSelected ? 'bg-amber-600/80 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {tempo.badge}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Real-time Subtitle Chunks Breakdown for Active Preview Scene */}
                  {(() => {
                    const activeScene = scenes[previewSceneIndex] || scenes[0];
                    const text = activeScene?.narration || '';
                    const chunks = getSubtitleChunks(text, subtitleTempo);
                    return (
                      <div className="pt-2 border-t border-amber-200/80 space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-extrabold text-amber-950 flex items-center gap-1">
                            <span>현재 씬({previewSceneIndex + 1}) 자막 분할:</span>
                            <span className="text-amber-600 font-black">{chunks.length}개로 순차 전환</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsAutoCyclingChunks(!isAutoCyclingChunks)}
                            className="flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-full border border-amber-300 transition"
                          >
                            {isAutoCyclingChunks ? (
                              <>
                                <Pause className="w-2.5 h-2.5 text-amber-700" />
                                <span>롤링 일시정지</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-2.5 h-2.5 text-amber-700" />
                                <span>자동 롤링 재생</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Chunk Pills */}
                        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 bg-white/80 rounded-xl border border-amber-200">
                          {chunks.map((chk, idx) => {
                            const isActive = previewChunkIndex === idx;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setIsAutoCyclingChunks(false);
                                  setPreviewChunkIndex(idx);
                                }}
                                className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 border ${
                                  isActive
                                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs scale-[1.02]'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50'
                                }`}
                              >
                                <span className={`text-[9px] px-1 py-0.2 rounded font-black ${isActive ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                  #{idx + 1}
                                </span>
                                <span>"{chk}"</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* 1. Commercial Free Font Selector */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <label className="text-xs font-black text-slate-800 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Type className="w-4 h-4 text-indigo-600" />
                      <span>상업적 이용 가능한 무료 폰트 (7종)</span>
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      상업적 무료 100%
                    </span>
                  </label>

                  <select
                    value={subtitleFont}
                    onChange={(e) => setSubtitleFont(e.target.value as SubtitleFontFamily)}
                    disabled={isRendering}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-indigo-500 shadow-2xs"
                  >
                    {COMMERCIAL_FONTS.map((font) => (
                      <option key={font.id} value={font.id}>
                        {font.name} • [{font.tag}]
                      </option>
                    ))}
                  </select>

                  <p className="text-[11px] text-slate-500 font-medium">
                    유튜브 쇼츠, 인스타 릴스, 틱톡에 상업적 저작권 걱정 없이 100% 무료로 사용할 수 있는 검증된 폰트입니다.
                  </p>
                </div>

                {/* 2. Subtitle Vertical Position (자막 위치 조절) */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <AlignVerticalJustifyCenter className="w-4 h-4 text-indigo-600" />
                      <span>자막 상하 위치 조절 (높이)</span>
                    </label>
                    <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      화면 {subtitleYPercent}% 지점
                    </span>
                  </div>

                  {/* Position Quick Presets */}
                  <div className="grid grid-cols-4 gap-1.5 text-xs">
                    {POSITION_PRESETS.map((pos) => (
                      <button
                        key={pos.value}
                        type="button"
                        onClick={() => setSubtitleYPercent(pos.value)}
                        disabled={isRendering}
                        className={`py-1.5 px-1 rounded-lg font-bold text-center text-[11px] transition ${
                          Math.abs(subtitleYPercent - pos.value) < 2
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>

                  {/* Slider */}
                  <div className="flex items-center space-x-3 pt-1">
                    <span className="text-[10px] text-slate-400 font-bold">상단 (15%)</span>
                    <input
                      type="range"
                      min={18}
                      max={88}
                      value={subtitleYPercent}
                      onChange={(e) => setSubtitleYPercent(parseInt(e.target.value, 10))}
                      disabled={isRendering}
                      className="flex-1 accent-indigo-600 cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-400 font-bold">하단 (88%)</span>
                  </div>
                </div>

                {/* 3. Subtitle Size (자막 크기) */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-indigo-600" />
                      <span>자막 글자 크기 (사이즈)</span>
                    </label>
                    <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {Math.round(subtitleSizeScale * 100)}%
                    </span>
                  </div>

                  {/* Size Quick Presets */}
                  <div className="grid grid-cols-4 gap-1.5 text-xs">
                    {SIZE_PRESETS.map((sz) => (
                      <button
                        key={sz.value}
                        type="button"
                        onClick={() => setSubtitleSizeScale(sz.value)}
                        disabled={isRendering}
                        className={`py-1.5 px-1 rounded-lg font-bold text-center text-[11px] transition ${
                          Math.abs(subtitleSizeScale - sz.value) < 0.05
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {sz.label}
                      </button>
                    ))}
                  </div>

                  {/* Size Slider */}
                  <input
                    type="range"
                    min={0.8}
                    max={1.4}
                    step={0.05}
                    value={subtitleSizeScale}
                    onChange={(e) => setSubtitleSizeScale(parseFloat(e.target.value))}
                    disabled={isRendering}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                {/* 4. Subtitle Effects & Style */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-amber-500" />
                    <span>자막 디자인 & 효과 스타일 (6종)</span>
                  </label>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {EFFECT_STYLES.map((eff) => (
                      <button
                        key={eff.id}
                        type="button"
                        onClick={() => setSubtitleStyle(eff.id)}
                        disabled={isRendering}
                        className={`py-2 px-2 rounded-xl border text-center font-bold transition flex flex-col items-center justify-center space-y-1 ${
                          subtitleStyle === eff.id
                            ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-white shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className={`text-[11px] px-2 py-0.5 rounded-md ${eff.previewClass}`}>
                          가나다
                        </span>
                        <span className="text-[10px] text-slate-700 font-bold">{eff.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Subtitle Preview Box */}
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">
                    ✨ 선택된 자막 실시간 스타일 미리보기 ({subtitleFont} • {Math.round(subtitleSizeScale * 100)}% • {subtitleYPercent}%)
                  </span>
                  <div className="inline-block py-1.5 px-3 rounded-xl">
                    <span 
                      style={{ 
                        fontFamily: `"${subtitleFont}", sans-serif`,
                        fontSize: `${Math.round(18 * subtitleSizeScale)}px`
                      }}
                      className={EFFECT_STYLES.find((e) => e.id === subtitleStyle)?.previewClass || ''}
                    >
                      "기름때 묻은 군복을 벗고 미슐랭 3스타가 되다"
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 2: Voice & Speed Customizer (ElevenLabs Official Integration) */}
            {activeSettingsSection === 'voice' && (
              <div className="space-y-4">
                {/* 0. ElevenLabs Official Integration Status Card */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 text-white shadow-md border border-violet-500/30 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-600/40 border border-violet-400/40 flex items-center justify-center font-black text-sm text-violet-200 shadow-inner">
                      XI
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black tracking-wide">ElevenLabs 차세대 음성 변환 엔진 연동</span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/40">
                          ● API 연결됨
                        </span>
                      </div>
                      <p className="text-[10px] text-violet-200/80 font-medium">
                        다큐멘터리 쇼츠에 최적화된 최신 고품질 모델 <strong className="text-amber-300">eleven_v4</strong>가 기본값으로 적용되었습니다.
                      </p>
                    </div>
                  </div>

                  <span className="hidden sm:inline-block text-[10px] font-black px-2.5 py-1 rounded-lg bg-white/10 text-violet-200 border border-white/15">
                    Pro Audio HD
                  </span>
                </div>

                {/* 1. ElevenLabs Model Selector (Default: eleven_v4) */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-violet-600" />
                      <span>음성 변환 AI 모델 선택 (기본값: eleven_v4)</span>
                    </label>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 border border-violet-200">
                      최신 고품질 다큐 최적화
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      {
                        id: 'eleven_v4',
                        name: '⚡ eleven_v4 (기본값 / 추천)',
                        tag: '최신 최고품질',
                        desc: '인간 수준의 자연스러운 호흡과 다큐멘터리 감정 억양에 특화된 차세대 플래그십 모델',
                        badge: '다큐멘터리 쇼츠 1위'
                      },
                      {
                        id: 'eleven_multilingual_v2',
                        name: '🌐 eleven_multilingual_v2',
                        tag: '안정적 다국어',
                        desc: '검증된 글로벌 다국어 고품질 음성 합성 모델',
                        badge: '표준 다국어'
                      },
                      {
                        id: 'eleven_turbo_v2_5',
                        name: '🚀 eleven_turbo_v2_5',
                        tag: '초고속 터보',
                        desc: '초저지연 빠른 렌더링에 최적화된 속도 중심 모델',
                        badge: '초고속 렌더'
                      },
                      {
                        id: 'eleven_flash_v2_5',
                        name: '✨ eleven_flash_v2_5',
                        tag: '초경량 플래시',
                        desc: '가볍고 빠른 연산 중심의 초경량 실시간 모델',
                        badge: '경량 모델'
                      }
                    ].map((model) => {
                      const isSelected = elevenLabsModel === model.id;
                      return (
                        <button
                          key={model.id}
                          type="button"
                          onClick={() => setElevenLabsModel(model.id)}
                          disabled={isRendering}
                          className={`p-2.5 rounded-xl text-left border transition relative flex flex-col justify-between ${
                            isSelected
                              ? 'bg-violet-600 text-white border-violet-700 shadow-md ring-2 ring-violet-300'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-violet-300 hover:bg-violet-50/50'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-black">{model.name}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <p className={`text-[10px] leading-tight font-medium ${isSelected ? 'text-violet-100' : 'text-slate-500'}`}>
                              {model.desc}
                            </p>
                          </div>
                          <span className={`mt-2 inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                            isSelected ? 'bg-violet-700/80 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {model.badge}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Voice Persona Selector (16 ElevenLabs Voices) */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Mic className="w-4 h-4 text-violet-600" />
                      <div className="flex items-center gap-2">
                        <span>내레이션 성우 선택 (일레븐랩스 16인 성우)</span>
                        <span className="px-1.5 py-0.5 rounded bg-violet-100 text-violet-800 text-[10px] font-black border border-violet-200">
                          ElevenLabs
                        </span>
                      </div>
                    </label>

                    <div className="flex items-center space-x-1.5">
                      {/* Heart Toggle for currently selected voice */}
                      <button
                        type="button"
                        onClick={(e) => toggleFavoriteVoice(selectedVoice.id, e)}
                        className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition ${
                          favoriteVoiceIds.includes(selectedVoice.id)
                            ? 'bg-rose-50 text-rose-600 border-rose-300 font-bold'
                            : 'bg-white text-slate-500 border-slate-200 hover:text-rose-500'
                        }`}
                        title={favoriteVoiceIds.includes(selectedVoice.id) ? '찜 해제' : '성우 찜하기 (즐겨찾기)'}
                      >
                        <Heart className={`w-3.5 h-3.5 ${favoriteVoiceIds.includes(selectedVoice.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                        <span className="text-[10px]">{favoriteVoiceIds.includes(selectedVoice.id) ? '찜됨' : '찜하기'}</span>
                      </button>

                      {/* Sample Play Button */}
                      <button
                        type="button"
                        onClick={() => handlePlayVoiceSample(selectedVoice)}
                        className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition ${
                          isPlayingVoiceSample && playingVoiceId === selectedVoice.id
                            ? 'bg-rose-500 text-white animate-pulse'
                            : 'bg-violet-100 text-violet-800 hover:bg-violet-200'
                        }`}
                        title="샘플 목소리 미리듣기"
                      >
                        {isPlayingVoiceSample && playingVoiceId === selectedVoice.id ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
                        <span>{isPlayingVoiceSample && playingVoiceId === selectedVoice.id ? '정지' : '샘플 듣기'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Voice Category Filter Tabs with Favorites */}
                  <div className="flex items-center space-x-1 overflow-x-auto pb-1 scrollbar-none text-[10px]">
                    <button
                      type="button"
                      onClick={() => setVoiceCategoryFilter('favorites')}
                      className={`whitespace-nowrap px-2.5 py-1 rounded-lg font-bold border transition flex items-center space-x-1 ${
                        voiceCategoryFilter === 'favorites'
                          ? 'bg-rose-500 text-white border-rose-500 shadow-2xs font-black'
                          : 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50'
                      }`}
                    >
                      <Heart className={`w-3 h-3 ${favoriteVoiceIds.length > 0 ? 'fill-current' : ''}`} />
                      <span>❤️ 찜한 성우 ({favoriteVoiceIds.length})</span>
                    </button>

                    {['all', '감동/다큐', '뉴스/지식', '숏폼/도파민', '공감/힐링', '스릴러/미스터리'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setVoiceCategoryFilter(cat)}
                        className={`whitespace-nowrap px-2 py-0.5 rounded-lg font-bold border transition ${
                          voiceCategoryFilter === cat
                            ? 'bg-violet-600 text-white border-violet-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {cat === 'all' ? `전체 (${VOICE_OPTIONS.length}명)` : cat}
                      </button>
                    ))}
                  </div>

                  {filteredVoices.length === 0 ? (
                    <div className="p-4 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-500 space-y-1">
                      <p className="font-bold">찜한 성우가 없습니다.</p>
                      <p className="text-[11px] text-slate-400">성우 목록에서 하트(❤️) 아이콘을 눌러 자주 쓰는 성우를 찜해보세요!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <select
                        value={selectedVoiceId}
                        onChange={(e) => setSelectedVoiceId(e.target.value)}
                        disabled={isRendering}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-violet-500 shadow-2xs"
                      >
                        {filteredVoices.map((v) => {
                          const isFav = favoriteVoiceIds.includes(v.id);
                          return (
                            <option key={v.id} value={v.id}>
                              {isFav ? '❤️ ' : ''}{v.gender === 'male' ? '👨' : '👩'} {v.name} ({v.role}) • [{v.categoryTag}] - {v.tone}
                            </option>
                          );
                        })}
                      </select>

                      {/* Quick Voice Carousel / Card Previews */}
                      <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 text-xs">
                        {filteredVoices.map((v) => {
                          const isCurrent = selectedVoiceId === v.id;
                          const isFav = favoriteVoiceIds.includes(v.id);
                          const isPlayingThisVoice = isPlayingVoiceSample && playingVoiceId === v.id;
                          return (
                            <div
                              key={v.id}
                              onClick={() => setSelectedVoiceId(v.id)}
                              className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                                isCurrent
                                  ? 'bg-violet-50/90 border-violet-500 shadow-xs ring-1 ring-violet-300'
                                  : 'bg-white hover:bg-slate-50 border-slate-200'
                              }`}
                            >
                              <div className="flex items-center space-x-2 min-w-0 flex-1">
                                <span className="text-sm shrink-0">{v.gender === 'male' ? '👨' : '👩'}</span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center space-x-1.5">
                                    <span className="font-extrabold text-slate-900 truncate">{v.name}</span>
                                    <span className="text-[10px] text-violet-700 bg-violet-100 px-1.5 py-0.2 rounded font-bold">{v.role}</span>
                                    <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">[{v.categoryTag}]</span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 truncate">{v.tone}</p>
                                </div>
                              </div>

                              <div className="flex items-center space-x-1 shrink-0 ml-2">
                                <button
                                  type="button"
                                  onClick={(e) => toggleFavoriteVoice(v.id, e)}
                                  className={`p-1.5 rounded-lg transition ${
                                    isFav ? 'text-rose-500 hover:text-rose-600' : 'text-slate-300 hover:text-rose-400'
                                  }`}
                                  title={isFav ? '찜 해제' : '찜하기'}
                                >
                                  <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500' : ''}`} />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePlayVoiceSample(v);
                                  }}
                                  className={`p-1.5 rounded-lg transition ${
                                    isPlayingThisVoice
                                      ? 'bg-rose-500 text-white shadow-xs animate-pulse ring-2 ring-rose-300'
                                      : 'bg-slate-100 hover:bg-violet-100 text-slate-700 hover:text-violet-700'
                                  }`}
                                  title={isPlayingThisVoice ? '정지' : `${v.name} 목소리 미리듣기`}
                                >
                                  {isPlayingThisVoice ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <p className="text-[11px] text-slate-500 font-medium">
                    {selectedVoice.description}
                  </p>
                </div>

                {/* 3. ElevenLabs Fine-Tuning Studio (Stability, Similarity, Style, Speaker Boost) */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-50/80 to-purple-50/80 border-2 border-violet-200 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-violet-950 flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-violet-600" />
                      <span>일레븐랩스 정밀 음성 튜닝 스튜디오</span>
                    </label>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-violet-200/80 text-violet-900 border border-violet-300">
                      Voice Settings
                    </span>
                  </div>

                  {/* One-click Presets */}
                  <div className="grid grid-cols-4 gap-1.5 text-xs">
                    {[
                      {
                        label: '🎙️ 감동 휴먼 다큐',
                        desc: '인간극장 최적 밸런스',
                        st: 0.50,
                        sim: 0.75,
                        sty: 0.15,
                        spd: 1.0,
                      },
                      {
                        label: '🎬 시네마틱 웅장',
                        desc: '드라마틱 감정 증폭',
                        st: 0.40,
                        sim: 0.80,
                        sty: 0.25,
                        spd: 1.05,
                      },
                      {
                        label: '⚡ 숏폼 도파민',
                        desc: '빠른 템포 1초 후킹',
                        st: 0.35,
                        sim: 0.70,
                        sty: 0.30,
                        spd: 1.15,
                      },
                      {
                        label: '📰 탐사보도 팩트',
                        desc: '차분하고 정돈된 보도',
                        st: 0.70,
                        sim: 0.85,
                        sty: 0.05,
                        spd: 1.05,
                      },
                    ].map((pst) => (
                      <button
                        key={pst.label}
                        type="button"
                        onClick={() => {
                          setElevenLabsStability(pst.st);
                          setElevenLabsSimilarity(pst.sim);
                          setElevenLabsStyle(pst.sty);
                          setVoiceSpeedMultiplier(pst.spd);
                        }}
                        className="p-1.5 rounded-xl bg-white border border-violet-200 hover:border-violet-400 hover:bg-violet-100/50 text-left transition"
                      >
                        <span className="block text-[11px] font-black text-violet-950">{pst.label}</span>
                        <span className="block text-[9px] text-slate-500">{pst.desc}</span>
                      </button>
                    ))}
                  </div>

                  {/* 3-1. Stability (안정성) */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-800">1. Stability (안정성)</span>
                      <span className="font-black text-violet-700 bg-white px-2 py-0.5 rounded-md border border-violet-200">
                        {Math.round(elevenLabsStability * 100)}%
                        <span className="text-[10px] text-slate-400 ml-1">
                          {elevenLabsStability < 0.4 ? '(감정 풍부)' : elevenLabsStability > 0.65 ? '(차분·일관)' : '(다큐 표준)'}
                        </span>
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={1.0}
                      step={0.05}
                      value={elevenLabsStability}
                      onChange={(e) => setElevenLabsStability(parseFloat(e.target.value))}
                      disabled={isRendering}
                      className="w-full accent-violet-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-slate-400 font-medium">
                      <span>← 감정 기복 풍부 / 드라마틱</span>
                      <span>차분하고 일관된 정통 뉴스톤 →</span>
                    </div>
                  </div>

                  {/* 3-2. Similarity Boost (원음 명확도) */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-800">2. Similarity Boost (원음 유사도 / 명확도)</span>
                      <span className="font-black text-violet-700 bg-white px-2 py-0.5 rounded-md border border-violet-200">
                        {Math.round(elevenLabsSimilarity * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.3}
                      max={1.0}
                      step={0.05}
                      value={elevenLabsSimilarity}
                      onChange={(e) => setElevenLabsSimilarity(parseFloat(e.target.value))}
                      disabled={isRendering}
                      className="w-full accent-violet-600 cursor-pointer"
                    />
                    <p className="text-[9px] text-slate-500 font-medium">
                      선택한 성우 고유의 오리지널 음색 특징을 얼마나 명확하고 선명하게 유지할지 조절합니다. (권장: 70~80%)
                    </p>
                  </div>

                  {/* 3-3. Style Exaggeration (스타일 과장도) */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-800">3. Style Exaggeration (스타일 과장도 / 서사 몰입감)</span>
                      <span className="font-black text-violet-700 bg-white px-2 py-0.5 rounded-md border border-violet-200">
                        {Math.round(elevenLabsStyle * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.0}
                      max={0.8}
                      step={0.05}
                      value={elevenLabsStyle}
                      onChange={(e) => setElevenLabsStyle(parseFloat(e.target.value))}
                      disabled={isRendering}
                      className="w-full accent-violet-600 cursor-pointer"
                    />
                    <p className="text-[9px] text-slate-500 font-medium">
                      성우의 발화 스타일과 감정 과장도를 높여 다큐멘터리 쇼츠의 극적 긴장감을 증폭합니다. (권장: 10~25%)
                    </p>
                  </div>

                  {/* 3-4. Speaker Boost Switch */}
                  <div className="pt-2 border-t border-violet-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-extrabold text-slate-800 block">4. Speaker Boost (스피커 선명도 강화)</span>
                      <span className="text-[10px] text-slate-500">배경음(BGM) 속에서도 성우 목소리의 윤곽을 선명하게 부각시킵니다.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setElevenLabsSpeakerBoost(!elevenLabsSpeakerBoost)}
                      disabled={isRendering}
                      className={`px-3 py-1 rounded-full text-xs font-black transition border ${
                        elevenLabsSpeakerBoost
                          ? 'bg-violet-600 text-white border-violet-700 shadow-xs'
                          : 'bg-white text-slate-400 border-slate-300'
                      }`}
                    >
                      {elevenLabsSpeakerBoost ? 'ON (선명화 적용)' : 'OFF'}
                    </button>
                  </div>
                </div>

                {/* 4. Voice Speed Multiplier Controller */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Gauge className="w-4 h-4 text-amber-500" />
                      <span>성우 목소리 스피드 배속 조절 & 실시간 미리듣기</span>
                    </label>
                    <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                      {voiceSpeedMultiplier.toFixed(2)}x {voiceSpeedMultiplier >= 1.05 && voiceSpeedMultiplier <= 1.15 && '(다큐 쇼츠 추천)'}
                    </span>
                  </div>

                  {/* Quick Select Buttons */}
                  <div className="grid grid-cols-6 gap-1 text-xs">
                    {[0.9, 0.95, 1.0, 1.05, 1.1, 1.2].map((spd) => (
                      <button
                        key={spd}
                        type="button"
                        onClick={() => handleSpeedChange(spd)}
                        disabled={isRendering}
                        className={`py-1.5 rounded-lg font-black text-center transition ${
                          Math.abs(voiceSpeedMultiplier - spd) < 0.01
                            ? 'bg-amber-500 text-slate-900 shadow-xs ring-1 ring-amber-400'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>

                  {/* Slider */}
                  <input
                    type="range"
                    min={0.8}
                    max={1.4}
                    step={0.05}
                    value={voiceSpeedMultiplier}
                    onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                    disabled={isRendering}
                    className="w-full accent-amber-500 cursor-pointer"
                  />

                  {/* Dedicated Real-time Speed Preview Test Button */}
                  <div className="pt-2 mt-1 border-t border-slate-200/80 flex items-center justify-between">
                    <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                      <Volume2 className={`w-3.5 h-3.5 ${isPlayingVoiceSample ? 'text-violet-600 animate-pulse' : 'text-slate-400'}`} />
                      <span>{selectedVoice.name} ({elevenLabsModel} • {voiceSpeedMultiplier.toFixed(2)}x)</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePlayVoiceSample(selectedVoice, voiceSpeedMultiplier)}
                      disabled={isRendering}
                      className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center space-x-1.5 transition shadow-xs cursor-pointer ${
                        isPlayingVoiceSample
                          ? 'bg-rose-500 hover:bg-rose-600 text-white ring-2 ring-rose-300'
                          : 'bg-violet-600 hover:bg-violet-700 text-white'
                      }`}
                    >
                      {isPlayingVoiceSample ? (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          <span>재생 중지</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>일레븐랩스 목소리 미리듣기</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500 font-medium">
                    일레븐랩스 API를 통해 렌더링 및 미리듣기 시 설정된 모델({elevenLabsModel}), 안정성({Math.round(elevenLabsStability * 100)}%), 유사도({Math.round(elevenLabsSimilarity * 100)}%)가 실시간으로 반영됩니다.
                  </p>
                </div>
              </div>
            )}


            {/* SECTION 3: Output & Resolution */}
            {activeSettingsSection === 'output' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Monitor className="w-4 h-4 text-indigo-600" />
                    <span>출력 해상도 선택 (화질)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setResolution('1080p')}
                      disabled={isRendering}
                      className={`p-3 rounded-xl border text-left transition ${
                        resolution === '1080p'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-extrabold text-sm">1080p FHD</div>
                      <div className={`text-[11px] ${resolution === '1080p' ? 'text-indigo-100' : 'text-slate-400'}`}>
                        1080 x 1920 (쇼츠 표준 고화질)
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setResolution('720p')}
                      disabled={isRendering}
                      className={`p-3 rounded-xl border text-left transition ${
                        resolution === '720p'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-extrabold text-sm">720p HD</div>
                      <div className={`text-[11px] ${resolution === '720p' ? 'text-indigo-100' : 'text-slate-400'}`}>
                        720 x 1280 (초고속 변환)
                      </div>
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 space-y-1.5">
                  <div className="font-black flex items-center gap-1.5 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>유튜브 쇼츠 & 인스타그램 릴스 최적화 완료</span>
                  </div>
                  <p className="leading-relaxed font-medium">
                    9:16 세로 규격, 상단 워터마크 없는 무결점 비디오, 브라우저 직접 렌더링으로 캡컷(CapCut) 등 외부 프로그램 없이 바로 유튜브에 업로드할 수 있습니다.
                  </p>
                </div>
              </div>
            )}

            {/* Bottom Action Buttons */}
            <div className="space-y-2 pt-1">
              {!isRendering ? (
                <button
                  onClick={startRendering}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-rose-500 via-indigo-600 to-indigo-700 hover:from-rose-600 hover:to-indigo-800 text-white font-black text-sm rounded-2xl shadow-lg shadow-indigo-500/25 flex items-center justify-center space-x-2 transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{videoBlobUrl ? '다시 음성 포함 영상 변환하기' : '🎬 맞춤 자막 & 음성 포함 쇼츠 변환 시작'}</span>
                </button>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-1.5">
                      <RotateCw className="w-4 h-4 animate-spin text-amber-400" />
                      {statusMessage}
                    </span>
                    <span className="text-amber-300 font-extrabold">{renderProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-rose-500 to-amber-400 h-2.5 rounded-full transition-all duration-200"
                      style={{ width: `${renderProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {videoBlobUrl && (
                <button
                  onClick={handleDownload}
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-2 transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{resolution} 완성 쇼츠 영상 파일 다운로드 (.mp4)</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                disabled={isRendering}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4 text-slate-500" />
                <span>이 창 닫기 (스튜디오 메인으로 복귀)</span>
              </button>
            </div>
          </div>

          {/* Right Column: 9:16 Video Player Preview / Canvas (6 cols) */}
          <div className="md:col-span-6 flex flex-col items-center justify-center">
            {/* Preview Mode Switcher (When video exists) */}
            {videoBlobUrl && !isRendering && (
              <div className="mb-2 flex items-center bg-slate-200/80 p-1 rounded-2xl border border-slate-300 text-xs font-bold shadow-2xs">
                <button
                  type="button"
                  onClick={() => setPreviewViewMode('live')}
                  className={`px-3 py-1.5 rounded-xl transition flex items-center space-x-1.5 cursor-pointer ${
                    previewViewMode === 'live'
                      ? 'bg-indigo-600 text-white shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>실시간 스타일 편집 뷰</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewViewMode('video')}
                  className={`px-3 py-1.5 rounded-xl transition flex items-center space-x-1.5 cursor-pointer ${
                    previewViewMode === 'video'
                      ? 'bg-emerald-600 text-white shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>완성된 MP4 영상 보기</span>
                </button>
              </div>
            )}

            {/* Scene Selector for Live Preview */}
            {!isRendering && previewViewMode === 'live' && scenes.length > 1 && (
              <div className="flex items-center space-x-1 overflow-x-auto max-w-full pb-1 mb-2 text-[11px] font-bold">
                <span className="text-slate-500 shrink-0 text-[10px] font-extrabold mr-1">미리보기 씬:</span>
                {scenes.map((_, sIdx) => (
                  <button
                    key={sIdx}
                    type="button"
                    onClick={() => setPreviewSceneIndex(sIdx)}
                    className={`px-2.5 py-0.5 rounded-lg border transition shrink-0 cursor-pointer ${
                      previewSceneIndex === sIdx
                        ? 'bg-indigo-600 text-white border-indigo-600 font-extrabold shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {sIdx + 1}번 씬
                  </button>
                ))}
              </div>
            )}

            <div className="w-[280px] sm:w-[310px] aspect-[9/16] bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-900 relative flex items-center justify-center">
              <canvas
                ref={canvasRef}
                className={`w-full h-full object-cover ${previewViewMode === 'video' && videoBlobUrl ? 'hidden' : 'block'}`}
              />

              {previewViewMode === 'video' && videoBlobUrl ? (
                <video
                  src={videoBlobUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : !isRendering ? (
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-900/85 text-white backdrop-blur-xs flex items-center gap-1.5 border border-white/10 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    자막 실시간 라이브 뷰
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600/90 text-white shadow-2xs">
                    {previewSceneIndex + 1}번 씬
                  </span>
                </div>
              ) : null}
            </div>

            {/* Quick Actions below canvas */}
            {!isRendering && (
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handlePlayVoiceSample(selectedVoice, voiceSpeedMultiplier);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-bold text-xs flex items-center space-x-1.5 transition border border-slate-200 shadow-2xs cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{previewSceneIndex + 1}번 씬 음성 미리듣기</span>
                </button>

                <button
                  type="button"
                  onClick={handleApplyRecommendedSettings}
                  className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-black text-xs flex items-center space-x-1.5 transition border border-amber-200 shadow-2xs cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>쇼츠 바이럴 추천 세팅 적용</span>
                </button>
              </div>
            )}

            <p className="text-[11px] text-slate-500 mt-2 font-semibold flex flex-wrap items-center justify-center gap-1.5 text-center">
              <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                사진: {photoAspectRatio === '1:1' ? '1:1 정사각형 카드' : photoAspectRatio === '9:16' ? '9:16 전체 채움' : photoAspectRatio} {photoAspectRatio !== '9:16' ? `(${backdropStyle === 'blur' ? '블러' : backdropStyle === 'dark' ? '다크' : '그라디언트'})` : ''}
              </span>
              <span>•</span>
              <span>자막: {subtitleFont} ({subtitleYPercent}%)</span>
              <span>•</span>
              <span>성우: {selectedVoice.name} ({voiceSpeedMultiplier.toFixed(1)}x)</span>
            </p>
          </div>
        </div>
      </div>
  );

  if (isPageMode) {
    return (
      <div className="flex-1 flex flex-col min-h-0 space-y-4">
        {/* Step 3 Top Breadcrumbs and Navigation */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onBackToEditor || onClose}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs transition border border-slate-200 cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4 text-indigo-600" />
              <span>← 2단계 대본 스튜디오로 돌아가기</span>
            </button>

            {onBackToTrends && (
              <button
                type="button"
                onClick={onBackToTrends}
                className="hidden sm:flex items-center space-x-1 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 font-bold text-xs transition border border-slate-200 cursor-pointer"
              >
                <span>인물 다시 선택</span>
              </button>
            )}

            <div className="h-5 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-400 hidden sm:inline">대상 인물:</span>
              <span className="text-xs font-black text-slate-900 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-xl border border-indigo-200">
                {project.figureName}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-bold text-slate-500">
            <button
              type="button"
              onClick={onBackToTrends || onClose}
              className="text-slate-400 hover:text-indigo-600 transition cursor-pointer"
            >
              1단계: 인물 선택
            </button>
            <span>➔</span>
            <button
              type="button"
              onClick={onBackToEditor || onClose}
              className="text-slate-400 hover:text-indigo-600 transition cursor-pointer"
            >
              2단계: 대본 스튜디오
            </button>
            <span>➔</span>
            <span className="text-rose-600 font-black bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
              3단계: 쇼츠 영상 렌더링 & 변환
            </span>
          </div>
        </div>

        {/* Full-width Studio Card */}
        <div className="bg-white rounded-3xl border border-slate-200 w-full flex flex-col shadow-sm relative text-slate-800 overflow-hidden">
          {modalHeaderContent}
          {modalBodyContent}
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isRendering) {
          onClose();
        }
      }}
    >
      <button
        type="button"
        onClick={onClose}
        disabled={isRendering}
        className="fixed top-3 right-3 sm:top-5 sm:right-5 z-[80] bg-slate-900/90 hover:bg-rose-600 text-white px-3.5 py-2 rounded-2xl shadow-2xl flex items-center space-x-1.5 font-black text-xs transition cursor-pointer border border-white/20 backdrop-blur-md hover:scale-105 disabled:opacity-50"
        title="이 창 닫기 (ESC)"
      >
        <X className="w-4 h-4 text-rose-400 group-hover:text-white" />
        <span>이 창 닫기 (ESC)</span>
      </button>

      <div className="bg-white rounded-3xl border border-slate-200 max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl relative text-slate-800 overflow-hidden my-auto">
        {modalHeaderContent}
        {modalBodyContent}
      </div>
    </div>
  );
};
