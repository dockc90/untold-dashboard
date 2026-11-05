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
  ArrowLeft
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
  VideoMoodTone
} from '../types';
import { VOICE_OPTIONS } from '../data/voices';
import { playDistinctVoicePreview, stopAllVoicePreviews } from '../utils/voicePlayer';

interface VideoRendererModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ShortsProject;
  isPageMode?: boolean;
  onBackToEditor?: () => void;
  onBackToTrends?: () => void;
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
    recommendedVoiceId: 'voice-6', // 성진 (동기부여 멘토)
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
    recommendedVoiceId: 'voice-13', // 영호 (인간극장 다큐)
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
    recommendedVoiceId: 'voice-2', // 준호 (도파민 숏폼남)
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
    recommendedVoiceId: 'voice-5', // 서연 (또박또박 지식형)
    recommendedSpeed: 1.05,
  },
];

// Helper: Splits long narration into 2-3 readable subtitle chunks while maintaining the scene photo
export const getSubtitleChunks = (narration: string): string[] => {
  const clean = narration.trim().replace(/\s+/g, ' ');
  if (!clean) return [''];

  // Short sentences (under 18 chars) stay as 1 chunk
  if (clean.length <= 18) {
    return [clean];
  }

  // Punctuation-based splitting if natural
  const punctDelimiters = /(?<=[.?!~,])\s+/;
  if (punctDelimiters.test(clean)) {
    const punctSplits = clean.split(punctDelimiters).map((s) => s.trim()).filter(Boolean);
    if (punctSplits.length >= 2 && punctSplits.every((p) => p.length >= 6 && p.length <= 32)) {
      return punctSplits;
    }
  }

  // Word-based splitting into 2 or 3 balanced chunks (approx 14~18 chars each)
  const words = clean.split(' ');
  if (words.length <= 3) {
    return [clean];
  }

  const numChunks = Math.max(2, Math.round(clean.length / 16));
  const targetLen = Math.ceil(clean.length / numChunks);

  const chunks: string[] = [];
  let currentWords: string[] = [];
  let currentLen = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const wouldBeLen = currentLen + (currentWords.length > 0 ? 1 : 0) + word.length;

    if (currentWords.length > 0 && wouldBeLen > targetLen + 3 && chunks.length < numChunks - 1) {
      chunks.push(currentWords.join(' '));
      currentWords = [word];
      currentLen = word.length;
    } else {
      currentWords.push(word);
      currentLen = wouldBeLen;
    }
  }

  if (currentWords.length > 0) {
    chunks.push(currentWords.join(' '));
  }

  // Merge trailing tiny chunk (under 5 chars) with previous
  if (chunks.length > 1 && chunks[chunks.length - 1].length < 6) {
    const last = chunks.pop()!;
    chunks[chunks.length - 1] += ' ' + last;
  }

  return chunks.length > 0 ? chunks : [clean];
};

export const VideoRendererModal: React.FC<VideoRendererModalProps> = ({
  isOpen,
  onClose,
  project,
  isPageMode = false,
  onBackToEditor,
  onBackToTrends,
}) => {
  // Video Resolution
  const [resolution, setResolution] = useState<'1080p' | '720p'>('1080p');

  // Photo Aspect Ratio & Backdrop Framing (1:1 정사각형, 9:16 전체, 4:5, 16:9, fit)
  const [photoAspectRatio, setPhotoAspectRatio] = useState<PhotoAspectRatio>(project.photoAspectRatio || '1:1');
  const [backdropStyle, setBackdropStyle] = useState<BackdropStyle>(project.backdropStyle || 'blur');

  // Subtitle Customizations
  const [subtitleFont, setSubtitleFont] = useState<SubtitleFontFamily>('GmarketSans');
  const [subtitleYPercent, setSubtitleYPercent] = useState<number>(78); // 15 to 90
  const [subtitleSizeScale, setSubtitleSizeScale] = useState<number>(1.1); // 0.8 to 1.4
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleEffectStyle>('yellow_box');

  // Voice & Speed
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(project.selectedVoiceId || 'voice-1');
  const [voiceSpeedMultiplier, setVoiceSpeedMultiplier] = useState<number>(project.voiceSpeedMultiplier || 1.1);
  const [voiceCategoryFilter, setVoiceCategoryFilter] = useState<string>('all');
  
  // Video Mood Tone State
  const [videoTone, setVideoTone] = useState<VideoMoodTone>(project.videoTone || 'Cinematic');

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

  // Active custom tab on left ('tone' | 'ratio' | 'subtitle' | 'voice' | 'output')
  const [activeSettingsSection, setActiveSettingsSection] = useState<'tone' | 'ratio' | 'subtitle' | 'voice' | 'output'>('tone');

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
      return saved ? JSON.parse(saved) : ['voice-1', 'voice-7', 'voice-13', 'voice-19', 'voice-25'];
    } catch {
      return ['voice-1', 'voice-7', 'voice-13', 'voice-19', 'voice-25'];
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
    if (backdropStyle === 'blur') {
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
      cardW = w * 0.90;
      cardH = cardW; // 1:1 Square
      cardY = h * 0.15;
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
    const cornerRadius = resolution === '1080p' ? 32 : 22;

    // 4. Card Drop Shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = resolution === '1080p' ? 40 : 25;
    ctx.shadowOffsetY = resolution === '1080p' ? 18 : 10;
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(cardX, cardY, cardW, cardH, cornerRadius);
    } else {
      ctx.rect(cardX, cardY, cardW, cardH);
    }
    ctx.fill();
    ctx.restore();

    // 5. Clip Image to Rounded Card
    ctx.save();
    ctx.beginPath();
    if (ctx.roundRect) {
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
      const previewImgUrl = activeScene?.uploadedImageUrl || `https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80`;

      try {
        const img = await loadImage(previewImgUrl);
        if (isCancelled || !canvasRef.current) return;

        // Draw photo with selected aspect ratio and backdrop
        drawSceneImage(ctx, img, width, height, 0, 'static');

        // Vignette based on subtitle position
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

        // Draw Subtitles: if text is long, preview the first punchy chunk
        const previewChunks = getSubtitleChunks(previewText);
        drawSubtitles(ctx, previewChunks[0], width, height);
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
    photoAspectRatio,
    backdropStyle,
    resolution,
    isRendering,
    scenes,
    project.figureName,
    width,
    height
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
      const stopFn = await playDistinctVoicePreview(voice, currentSpeed, () => {
        setIsPlayingVoiceSample(false);
        setPlayingVoiceId(null);
      });
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
        const res = await fetch(`/api/tts?text=${encodeURIComponent(scenes[i].narration)}`);
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
    for (let i = 0; i < scenes.length; i++) {
      setStatusMessage(`사진 에셋 및 렌더링 최적화 중... (${i + 1}/${scenes.length})`);
      const imgUrl = scenes[i].uploadedImageUrl || `https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80`;
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
    const sceneDurationsSec = scenes.map((s, idx) => {
      const buffer = audioBuffers[idx];
      if (buffer) {
        const effectiveRate = voiceSpeedMultiplier * (selectedVoice.rate || 1.0);
        // Buffer duration divided by effective speed rate + natural breathing pause
        return Math.max(2.4, (buffer.duration / effectiveRate) + 0.35);
      }
      const chars = s.narration.length;
      return Math.max(2.5, Math.min(5.5, (chars * 0.16) / voiceSpeedMultiplier));
    });

    // Exact cumulative start times for each scene (seconds from video start)
    const sceneStartTimesSec: number[] = [];
    let curTime = 0.1;
    for (let i = 0; i < scenes.length; i++) {
      sceneStartTimesSec.push(curTime);
      curTime += sceneDurationsSec[i];
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

          // Apply authentic pitch of the chosen Instagram Reels voice actor
          const effectivePitch = selectedVoice.pitch || 1.0;
          src.playbackRate.value = effectivePitch * voiceSpeedMultiplier;

          const filter = audioCtx.createBiquadFilter();
          if (selectedVoice.gender === 'male') {
            filter.type = 'lowshelf';
            filter.frequency.value = 280;
            filter.gain.value = 5.0; // Warm resonant male presence
          } else {
            filter.type = 'highshelf';
            filter.frequency.value = 2600;
            filter.gain.value = 4.5; // Bright clear female presence
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

      // Adaptive vignette based on subtitle position
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

      // Subtitle Chunking: keep the scene photo intact while subtitles advance if long
      const chunks = getSubtitleChunks(scene.narration);
      const chunkIdx = Math.min(chunks.length - 1, Math.floor(progressInScene * chunks.length));
      const activeSubtitleText = chunks[chunkIdx];

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
          {/* Settings Navigation Tabs (5 Sections) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setActiveSettingsSection('tone')}
              className={`py-2 px-2 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                activeSettingsSection === 'tone'
                  ? 'bg-white text-indigo-700 shadow-2xs font-black ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="truncate">영상 톤 ({videoTone})</span>
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
              <span className="truncate">사진 비율 ({photoAspectRatio})</span>
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
              <span className="truncate">자막 설정</span>
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
              <span className="truncate">성우·배속 ({voiceSpeedMultiplier}x)</span>
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
              <span className="truncate">해상도 ({resolution})</span>
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

              {/* SECTION 1: Subtitle Customizer */}
            {activeSettingsSection === 'subtitle' && (
              <div className="space-y-4">
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

            {/* SECTION 2: Voice & Speed Customizer */}
            {activeSettingsSection === 'voice' && (
              <div className="space-y-4">
                {/* 1. Voice Persona Selector (30 Voices + Favorites 찜) */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Mic className="w-4 h-4 text-indigo-600" />
                      <span>내레이션 성우 선택 (인스타 릴스 인기 15인 성우 • 찜 기능)</span>
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
                            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
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

                    {['all', '감동/다큐', '숏폼/도파민', '뉴스/지식', '공감/힐링', '스릴러/미스터리'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setVoiceCategoryFilter(cat)}
                        className={`whitespace-nowrap px-2 py-0.5 rounded-lg font-bold border transition ${
                          voiceCategoryFilter === cat
                            ? 'bg-indigo-600 text-white border-indigo-600'
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
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-indigo-500 shadow-2xs"
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
                      <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-xs">
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
                                  ? 'bg-indigo-50/80 border-indigo-500 shadow-xs ring-1 ring-indigo-300'
                                  : 'bg-white hover:bg-slate-50 border-slate-200'
                              }`}
                            >
                              <div className="flex items-center space-x-2 min-w-0 flex-1">
                                <span className="text-sm shrink-0">{v.gender === 'male' ? '👨' : '👩'}</span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center space-x-1.5">
                                    <span className="font-extrabold text-slate-900 truncate">{v.name}</span>
                                    <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded font-bold">{v.role}</span>
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
                                      : 'bg-slate-100 hover:bg-indigo-100 text-slate-700 hover:text-indigo-700'
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

                {/* 2. Voice Speed Multiplier Controller + Live Speed Preview */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Gauge className="w-4 h-4 text-amber-500" />
                      <span>성우 목소리 스피드 배속 조절 & 실시간 미리듣기</span>
                    </label>
                    <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                      {voiceSpeedMultiplier.toFixed(1)}x {voiceSpeedMultiplier === 1.1 && '(쇼츠 추천)'}
                    </span>
                  </div>

                  {/* Quick Select Buttons */}
                  <div className="grid grid-cols-6 gap-1 text-xs">
                    {SPEED_PRESETS.map((spd) => (
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
                    max={1.5}
                    step={0.05}
                    value={voiceSpeedMultiplier}
                    onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                    disabled={isRendering}
                    className="w-full accent-amber-500 cursor-pointer"
                  />

                  {/* Dedicated Real-time Speed Preview Test Button */}
                  <div className="pt-2 mt-1 border-t border-slate-200/80 flex items-center justify-between">
                    <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                      <Volume2 className={`w-3.5 h-3.5 ${isPlayingVoiceSample ? 'text-amber-500 animate-pulse' : 'text-slate-400'}`} />
                      <span>{selectedVoice.name} 성우 ({voiceSpeedMultiplier.toFixed(1)}x 배속 적용)</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePlayVoiceSample(selectedVoice, voiceSpeedMultiplier)}
                      disabled={isRendering}
                      className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center space-x-1.5 transition shadow-xs cursor-pointer ${
                        isPlayingVoiceSample
                          ? 'bg-rose-500 hover:bg-rose-600 text-white ring-2 ring-rose-300'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
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
                          <span>{voiceSpeedMultiplier.toFixed(1)}x 배속 미리듣기</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500 font-medium">
                    슬라이더나 배속 버튼을 누르면 즉시 해당 배속으로 샘플 음성이 조정되어 실시간으로 들어보실 수 있습니다.
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
