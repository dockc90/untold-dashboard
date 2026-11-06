import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Layers, 
  Image as ImageIcon, 
  FileText, 
  Download, 
  Copy, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Flame, 
  ArrowLeft,
  Upload, 
  Trash2, 
  Link as LinkIcon, 
  ExternalLink, 
  Type as TypeIcon, 
  AlignLeft, 
  AlignCenter, 
  Scissors,
  Palette,
  Bookmark,
  X,
  Share2,
  Plus,
  RefreshCw,
  GitMerge,
  ArrowRight,
  Sliders,
  CheckCircle2,
  Film
} from 'lucide-react';
import { CarouselSlide, ViralAssetPackage, ShortsProject } from '../types';

export interface CarouselStudioProps {
  initialTopic?: string;
  initialCategory?: string;
  initialScript?: string;
  currentProject?: ShortsProject | null;
  onBackToStudio?: () => void;
}

const THEMES = [
  { id: 'dark', name: '미드나잇 다크', bg: 'linear-gradient(135deg, #090d16 0%, #1e1b4b 100%)', text: '#ffffff', subText: '#94a3b8', accent: '#6366f1', badgeBg: '#4f46e5', badgeText: '#ffffff' },
  { id: 'clean', name: '미니멀 화이트', bg: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)', text: '#0f172a', subText: '#475569', accent: '#2563eb', badgeBg: '#dbeafe', badgeText: '#1e40af' },
  { id: 'sunset', name: '선셋 바이올렛', bg: 'linear-gradient(135deg, #31103f 0%, #701a75 50%, #db2777 100%)', text: '#ffffff', subText: '#fbcfe8', accent: '#f43f5e', badgeBg: '#be185d', badgeText: '#ffffff' },
  { id: 'gold', name: '럭셔리 골드', bg: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)', text: '#fef08a', subText: '#d4d4d8', accent: '#eab308', badgeBg: '#ca8a04', badgeText: '#000000' },
  { id: 'neon', name: '사이버 네온', bg: 'linear-gradient(135deg, #022c22 0%, #064e3b 100%)', text: '#6ee7b7', subText: '#a7f3d0', accent: '#10b981', badgeBg: '#059669', badgeText: '#ffffff' },
];

const FONT_OPTIONS = [
  { id: 'Pretendard', name: '프리텐다드', family: "'Pretendard', -apple-system, sans-serif", desc: '인스타 감성 깔끔 고딕' },
  { id: 'Black Han Sans', name: '블랙한산스', family: "'Black Han Sans', sans-serif", desc: '시선 강탈 쇼츠 볼드' },
  { id: 'Do Hyeon', name: '도현체', family: "'Do Hyeon', sans-serif", desc: '단단하고 강렬한 타이틀' },
  { id: 'Gowun Dodum', name: '고운돋움', family: "'Gowun Dodum', sans-serif", desc: '부드럽고 신뢰감 있는 폰트' },
  { id: 'Song Myung', name: '송명체', family: "'Song Myung', serif", desc: '감성 다큐 & 스토리텔링 명조' },
];

const TEXT_COLOR_PRESETS = [
  { id: 'white', label: '화이트', hex: '#ffffff' },
  { id: 'yellow', label: '골드 옐로우', hex: '#facc15' },
  { id: 'mint', label: '네온 민트', hex: '#34d399' },
  { id: 'cyan', label: '스카이 시안', hex: '#38bdf8' },
  { id: 'rose', label: '코랄 핑크', hex: '#fb7185' },
];

const FONT_SIZE_PRESETS = [
  { id: 'sm', label: '보통', titleClass: 'text-xl sm:text-2xl', descClass: 'text-xs sm:text-sm', titlePx: 46, descPx: 26 },
  { id: 'md', label: '크게 (추천)', titleClass: 'text-2xl sm:text-3xl', descClass: 'text-sm sm:text-base', titlePx: 56, descPx: 32 },
  { id: 'lg', label: '특대 (강한 후킹)', titleClass: 'text-3xl sm:text-4xl', descClass: 'text-base sm:text-lg', titlePx: 66, descPx: 36 },
];

export const SUB_DETAIL_FONT_OPTIONS = [
  { id: 'Pretendard', name: '프리텐다드', family: "'Pretendard', -apple-system, sans-serif", desc: '가독성 1위 모던 고딕 (기본)' },
  { id: 'Gowun Dodum', name: '고운돋움', family: "'Gowun Dodum', sans-serif", desc: '차분하고 정돈된 텍스트' },
  { id: 'Song Myung', name: '송명체', family: "'Song Myung', serif", desc: '감성 다큐 스토리텔링' },
  { id: 'Do Hyeon', name: '도현체', family: "'Do Hyeon', sans-serif", desc: '단단한 예능 카드' },
  { id: 'Black Han Sans', name: '블랙한산스', family: "'Black Han Sans', sans-serif", desc: '볼드 임팩트' },
];

export const SUB_DETAIL_SIZE_PRESETS = [
  { id: 'sm', label: '소형 (14px)', descClass: 'text-xs sm:text-sm', canvasPx: 26 },
  { id: 'md', label: '보통 (16px 추천)', descClass: 'text-sm sm:text-base', canvasPx: 32 },
  { id: 'lg', label: '크게 (19px)', descClass: 'text-base sm:text-lg', canvasPx: 38 },
  { id: 'xl', label: '특대 (22px)', descClass: 'text-lg sm:text-xl', canvasPx: 44 },
];

export const SUB_DETAIL_COLOR_PRESETS = [
  { id: 'slate', label: '소프트 슬레이트', hex: '#e2e8f0' },
  { id: 'white', label: '순백 화이트', hex: '#ffffff' },
  { id: 'amber', label: '웜 옐로우', hex: '#fde047' },
  { id: 'mint', label: '네온 민트', hex: '#86efac' },
  { id: 'cyan', label: '스카이 시안', hex: '#7dd3fc' },
  { id: 'rose', label: '코랄 핑크', hex: '#fca5a5' },
];

export const SUB_DETAIL_BG_STYLES = [
  { id: 'none', label: '투명 (기본)' },
  { id: 'capsule', label: '다크 캡슐' },
  { id: 'box', label: '카드 박스' },
];

/**
 * 3초 도입부형 메인 헤드라인(큰 글씨) 생성 알고리즘
 * 각 장면의 핵심 갈등/사건/반전을 포착하여 3초 만에 시선을 강탈하는 1~2줄 펀치라인을 생성합니다.
 */
export function generate3SecondHook(
  narration: string,
  index: number,
  total: number,
  topic: string,
  variant: number = 0
): string {
  const clean = narration
    .replace(/\[씬\s*\d+[^\]]*\]/g, '')
    .replace(/\(\d{2}:\d{2}\s*-\s*\d{2}:\d{2}\)/g, '')
    .replace(/내레이션[:\s]*/g, '')
    .replace(/["'“”]/g, '')
    .trim();

  // 1. Cover Slide (Slide 1: 압도적 시선 강탈 훅)
  if (index === 0) {
    const coverVariants = [
      `${topic}의 숨겨진 반전 실화`,
      `전 세계를 경악하게 한\n${topic}의 충격 진실`,
      `모두가 불가능하다 했던\n${topic}의 기적`,
      `아무도 몰랐던\n${topic}의 진짜 시작`,
      `100번 넘게 거절당했던\n무명 시절의 기적`
    ];
    if (clean.includes('정비병') || clean.includes('이라크') || clean.includes('군대')) {
      coverVariants.unshift(`이라크 전쟁터에서\n미슐랭 3스타까지`);
    }
    return coverVariants[variant % coverVariants.length];
  }

  // 2. Ending Slide (Last Slide: 저장 & 공유 유발 클로징 훅)
  if (index === total - 1) {
    const ctaVariants = [
      `${topic}의 반전 서사,\n어떻게 생각하시나요?`,
      `당신의 가슴을 울린\n단 하나의 선택`,
      `지금 [저장]하고\n필요할 때 꺼내보세요`,
      `이 놀라운 여정,\n여러분의 의견은?`
    ];
    return ctaVariants[variant % ctaVariants.length];
  }

  // 3. Body Slides: 키워드 감지 기반 3초 도입부 훅 생성
  const candidates: string[] = [];

  if (clean.includes('전쟁') || clean.includes('군대') || clean.includes('이라크') || clean.includes('정비병')) {
    candidates.push('전쟁터 한가운데서\n총을 들던 시절', '생사를 넘나들던\n위기의 순간');
  }
  if (clean.includes('요리') || clean.includes('셰프') || clean.includes('미슐랭') || clean.includes('음식') || clean.includes('식당')) {
    candidates.push('세계를 사로잡은\n단 한 접시의 기적', '타협을 모르는\n완벽주의의 비밀');
  }
  if (clean.includes('포기') || clean.includes('눈물') || clean.includes('시련') || clean.includes('바닥') || clean.includes('실패') || clean.includes('탈락')) {
    candidates.push('바닥 끝에서 버텨낸\n눈물의 시간', '모두가 등을 돌렸던\n절망의 순간');
  }
  if (clean.includes('기회') || clean.includes('도전') || clean.includes('시작') || clean.includes('결심') || clean.includes('결단') || clean.includes('선택')) {
    candidates.push('단 한 번의 결단이\n뒤바꾼 운명', '모든 것을 걸었던\n인생 최대의 승부수');
  }
  if (clean.includes('성공') || clean.includes('기적') || clean.includes('반전') || clean.includes('합격') || clean.includes('최고') || clean.includes('증명')) {
    candidates.push('마침내 증명해낸\n0.001%의 실력', '전 세계가 기립박수를\n보낸 이유');
  }
  if (clean.includes('비밀') || clean.includes('진실') || clean.includes('몰랐') || clean.includes('이유') || clean.includes('숨겨')) {
    candidates.push('아무도 몰랐던\n그날의 결정적 비밀', '세상이 숨겨두었던\n진짜 비하인드');
  }

  // Fallback Dramatic Formula
  const fallbackPool = [
    '단 1초 만에\n뒤바뀐 운명의 갈림길',
    '그는 왜 모든 것을\n걸어야만 했을까?',
    '아무도 예상하지 못한\n결정적 순간',
    '상상조차 못 했던\n충격적인 전개',
    '피눈물 흘리며 버텨낸\n숨겨진 기록'
  ];

  const pool = candidates.length > 0 ? [...candidates, ...fallbackPool] : fallbackPool;
  return pool[variant % pool.length];
}

/**
 * 쇼츠 대본 100% 원문 보존 & 스마트 컷 편집 분할 알고리즘
 * - 어떤 문장이나 단어도 요약/누락하지 않고 100% 온전히 보존
 * - 씬 단위 또는 호흡 단위(60~120자)로 모바일 카드 읽기에 최적화된 컷 분할
 */
export function chunkScriptPreservingFullText(
  rawScript: string,
  targetTopic: string
): Array<{ hook: string; text: string; badge: string }> {
  if (!rawScript.trim()) return [];

  // 1. Check for scene markers like [씬 1], 씬 1:, etc.
  const hasSceneMarkers = /\[씬\s*\d+[^\]]*\]|(?<=^|\n)씬\s*\d+[:.\s]+/i.test(rawScript);

  let rawCuts: string[] = [];

  if (hasSceneMarkers) {
    const parts = rawScript.split(/(?:\[씬\s*\d+[^\]]*\]|(?<=^|\n)씬\s*\d+[:.\s]+)/i);
    rawCuts = parts
      .map(p => p.replace(/\(\d{2}:\d{2}\s*-\s*\d{2}:\d{2}\)/g, '').replace(/내레이션[:\s]*/g, '').trim())
      .filter(p => p.length >= 4);
  }

  // 2. If no scene markers or too few cuts, split into sentences without dropping any text
  if (rawCuts.length < 2) {
    const cleaned = rawScript
      .replace(/\[씬\s*\d+[^\]]*\]/g, '')
      .replace(/\(\d{2}:\d{2}\s*-\s*\d{2}:\d{2}\)/g, '')
      .replace(/내레이션[:\s]*/g, '')
      .replace(/#\S+/g, '')
      .trim();

    // Match all sentences including punctuation
    const sentences = cleaned.match(/[^.?!]+[.?!]+(?:\s+|$)|[^.?!]+$/g) || [cleaned];
    const grouped: string[] = [];
    let currentChunk = '';

    for (const rawSent of sentences) {
      const sent = rawSent.trim();
      if (!sent) continue;

      if (!currentChunk) {
        currentChunk = sent;
      } else if ((currentChunk + ' ' + sent).length <= 110) {
        currentChunk = currentChunk + '\n' + sent;
      } else {
        grouped.push(currentChunk);
        currentChunk = sent;
      }
    }
    if (currentChunk) {
      grouped.push(currentChunk);
    }
    rawCuts = grouped;
  }

  if (rawCuts.length === 0) return [];

  const total = rawCuts.length;
  return rawCuts.map((cutText, idx) => {
    const hook = generate3SecondHook(cutText, idx, total, targetTopic, 0);
    const badge = idx === 0 
      ? '🔥 3초 떡상 훅' 
      : idx === total - 1 
      ? '💬 토론 & 저장' 
      : `POINT 0${idx}`;

    return {
      hook,
      text: cutText,
      badge
    };
  });
}

// Helper: Compresses long narrative sentences into 1~2 punchy lines (backwards compatibility)
export function compressToPunchline(text: string): { headline: string; detail: string } {
  let cleaned = text.replace(/["'“”]/g, '').trim();
  if (cleaned.length <= 18) {
    return { headline: cleaned, detail: text };
  }
  const splitClauses = cleaned.split(/(?<=[,?!])\s+|(?<=\b(?:하지만|그러나|결국|그리고|어떻게|당시|과거)\b)\s+/);
  if (splitClauses.length > 1) {
    const firstClause = splitClauses[0].trim();
    if (firstClause.length >= 5 && firstClause.length <= 22) {
      return { headline: firstClause, detail: text };
    }
  }
  const words = cleaned.split(/\s+/);
  let line1 = '';
  let line2 = '';
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (!line1 || (line1 + ' ' + w).length <= 11) {
      line1 = line1 ? `${line1} ${w}` : w;
    } else if (!line2 || (line2 + ' ' + w).length <= 14) {
      line2 = line2 ? `${line2} ${w}` : w;
    } else {
      break;
    }
  }
  const punchline = line2 ? `${line1}\n${line2}` : line1;
  return {
    headline: punchline,
    detail: text,
  };
}

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = src;
  });
};

function drawImageCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const nw = img.naturalWidth || img.width;
  const nh = img.naturalHeight || img.height;
  const ar = nw / nh;
  let cw = w;
  let ch = w / ar;
  if (ch < h) {
    ch = h;
    cw = h * ar;
  }
  const cx = x + (w - cw) * 0.5;
  const cy = y + (h - ch) * 0.5;
  ctx.drawImage(img, cx, cy, cw, ch);
}

function wrapCanvasText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const result: string[] = [];
  const rawLines = text.split('\n');
  for (const rawLine of rawLines) {
    if (!rawLine.trim()) {
      result.push('');
      continue;
    }
    const words = rawLine.split(' ');
    let currentLine = '';
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(testLine).width <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          result.push(currentLine);
          currentLine = word;
        } else {
          let chunk = '';
          for (const char of word) {
            if (ctx.measureText(chunk + char).width <= maxWidth) {
              chunk += char;
            } else {
              result.push(chunk);
              chunk = char;
            }
          }
          currentLine = chunk;
        }
      }
    }
    if (currentLine) {
      result.push(currentLine);
    }
  }
  return result;
}

export const CarouselStudio: React.FC<CarouselStudioProps> = ({
  initialTopic = '안성재 셰프',
  initialCategory = 'entertainment',
  initialScript = '',
  currentProject,
  onBackToStudio
}) => {
  const [topic, setTopic] = useState(initialTopic);
  const [targetAudience, setTargetAudience] = useState('2040 남녀 직장인');
  const [tone, setTone] = useState('충격과 반전의 흥미진진한 톤');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Carousel Slides & Index
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [carouselRatio, setCarouselRatio] = useState<'4:5' | '1:1' | '9:16'>('4:5');
  const [viralData, setViralData] = useState<ViralAssetPackage | null>(null);

  // 2026 Instagram Algorithm features
  const [showSwipeIndicator, setShowSwipeIndicator] = useState(true);
  const [hookVariantIndex, setHookVariantIndex] = useState(0);
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [exportProgress, setExportProgress] = useState<string | null>(null);

  // Styling (Default text alignment is strictly 'left')
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
  const [selectedFont, setSelectedFont] = useState(FONT_OPTIONS[0]);
  const [selectedTextColor, setSelectedTextColor] = useState('#ffffff');
  const [fontSizeMode, setSizeMode] = useState<'sm' | 'md' | 'lg'>('md');
  const [textAlign, setTextAlign] = useState<'center' | 'left'>('left');
  const [textBottomYPercent, setTextBottomYPercent] = useState<number>(82);

  // SubDetail Styling
  const [subDetailFont, setSubDetailFont] = useState(SUB_DETAIL_FONT_OPTIONS[0]);
  const [subDetailFontSize, setSubDetailFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');
  const [subDetailColor, setSubDetailColor] = useState<string>('#e2e8f0');
  const [subDetailBgStyle, setSubDetailBgStyle] = useState<'none' | 'capsule' | 'box'>('none');

  // Script Input & Auto-chunker
  const [scriptInput, setScriptInput] = useState(initialScript);
  const [scriptToast, setScriptToast] = useState<string | null>(null);

  // URL modal input
  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');

  // Hidden file input
  const slideFileInputRef = useRef<HTMLInputElement | null>(null);

  // Initial Fetch or generate
  const handleGenerate = async (targetTopic: string = topic) => {
    if (!targetTopic.trim()) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/gemini/generate-viral-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: targetTopic,
          targetAudience,
          tone
        })
      });
      if (!response.ok) throw new Error('API failed');
      const data: ViralAssetPackage = await response.json();
      setViralData(data);
      if (data.carousel && Array.isArray(data.carousel.slides) && data.carousel.slides.length > 0) {
        setSlides(data.carousel.slides);
        setCurrentSlideIndex(0);
      }
    } catch (err) {
      console.error('Carousel generation failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // If project scenes exist, auto-import from project
    if (currentProject?.scenes && currentProject.scenes.length > 0) {
      handleImportProjectScenes();
    } else {
      handleGenerate(initialTopic);
    }
  }, []);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  /**
   * 1. 쇼츠 프로젝트 씬(사진 + 원본 대본) 1:1 완벽 가져오기
   * - 대본 요약 0%, 원본 대본 100% 그대로 슬라이드에 반영
   * - 메인 헤드라인은 3초 도입부형으로 자동 생성
   */
  const handleImportProjectScenes = () => {
    if (!currentProject?.scenes || currentProject.scenes.length === 0) return;

    const projectScenes = currentProject.scenes;
    const total = projectScenes.length;

    const newSlides: CarouselSlide[] = projectScenes.map((scene, idx) => {
      const isCover = idx === 0;
      const isCta = idx === total - 1;
      const narrationText = scene.narration.trim();
      const hook = generate3SecondHook(narrationText, idx, total, topic, 0);

      return {
        slideNumber: idx + 1,
        type: isCover ? 'cover' : isCta ? 'cta' : 'body',
        mainHook: hook,
        subDetail: narrationText, // 쇼츠 대본 원문 100% 그대로 (요약 0%)
        imageUrl: scene.uploadedImageUrl, // 현재 씬 사진 100% 그대로 매칭!
        visualGuide: scene.visualGuide || '쇼츠 프로젝트 씬 사진',
        imageSearchKeyword: scene.imageSearchKeyword || `${topic} 씬${idx + 1} 사진`,
        badgeText: isCover ? '🔥 3초 떡상 훅' : isCta ? '💬 토론 & 저장' : `POINT 0${idx + 1}`,
        textAlign: 'left',
        textBottomYPercent: 82
      };
    });

    setSlides(newSlides);
    setCurrentSlideIndex(0);
    setScriptToast(`쇼츠 프로젝트의 씬 사진 ${newSlides.length}장과 원본 대본 전체를 100% 온전히 가져왔습니다! ✨`);
    setTimeout(() => setScriptToast(null), 3500);
  };

  /**
   * 2. 붙여넣은 대본을 요약 없이 컷 편집하여 슬라이드로 변환
   */
  const handleConvertScriptToCarousel = () => {
    if (!scriptInput.trim()) return;

    const cuts = chunkScriptPreservingFullText(scriptInput, topic);
    if (cuts.length === 0) return;

    const newSlides: CarouselSlide[] = cuts.map((cut, idx) => ({
      slideNumber: idx + 1,
      type: idx === 0 ? 'cover' : idx === cuts.length - 1 ? 'cta' : 'body',
      mainHook: cut.hook, // 3초 도입부형 헤드라인 (큰 글씨)
      subDetail: cut.text, // 쇼츠 대본 100% 원문 그대로 (작은 글씨)
      visualGuide: '스토리 장면에 맞는 현장 사진 또는 자료 사진',
      imageSearchKeyword: `${topic} ${cut.hook.replace(/[^\w\s가-힣]/g, '').slice(0, 15)} 사진`,
      badgeText: cut.badge,
      imageUrl: slides[idx]?.imageUrl,
      textAlign: 'left',
      textBottomYPercent: 82
    }));

    setSlides(newSlides);
    setCurrentSlideIndex(0);
    setScriptToast(`대본 원문을 100% 보존하며 총 ${newSlides.length}장의 3초 후킹 카드뉴스로 컷 편집 분할되었습니다! ✨`);
    setTimeout(() => setScriptToast(null), 3500);
  };

  // 3. 3초 후킹 헤드라인 스타일 변경 (순환 토글)
  const handleCycle3SecondHook = () => {
    if (!currentSlide) return;
    const nextVar = hookVariantIndex + 1;
    setHookVariantIndex(nextVar);
    const newHook = generate3SecondHook(
      currentSlide.subDetail || currentSlide.mainHook,
      currentSlideIndex,
      slides.length,
      topic,
      nextVar
    );
    handleUpdateCurrentSlide('mainHook', newHook);
    setScriptToast(`⚡ 3초 후킹 헤드라인 스타일이 변경되었습니다!`);
    setTimeout(() => setScriptToast(null), 2000);
  };

  // 4. 슬라이드 컷 분할 (이 위치에서 슬라이드 나누기)
  const handleSplitCurrentSlide = () => {
    if (!currentSlide || !currentSlide.subDetail) return;
    const text = currentSlide.subDetail.trim();
    if (text.length < 20) {
      setScriptToast('내용이 너무 짧아 분할할 수 없습니다.');
      setTimeout(() => setScriptToast(null), 2000);
      return;
    }

    const sentences = text.match(/[^.?!]+[.?!]+(?:\s+|$)|[^.?!]+$/g) || [text];
    let part1 = '';
    let part2 = '';

    if (sentences.length >= 2) {
      const mid = Math.ceil(sentences.length / 2);
      part1 = sentences.slice(0, mid).join('\n').trim();
      part2 = sentences.slice(mid).join('\n').trim();
    } else {
      const half = Math.floor(text.length / 2);
      const splitIdx = text.indexOf(' ', half);
      if (splitIdx !== -1) {
        part1 = text.slice(0, splitIdx).trim();
        part2 = text.slice(splitIdx).trim();
      } else {
        part1 = text;
        part2 = '상세 보조 설명을 이어가세요.';
      }
    }

    const updated = [...slides];
    updated[currentSlideIndex] = {
      ...currentSlide,
      subDetail: part1,
      mainHook: generate3SecondHook(part1, currentSlideIndex, slides.length + 1, topic, 0)
    };

    const newSlide: CarouselSlide = {
      slideNumber: currentSlideIndex + 2,
      type: 'body',
      mainHook: generate3SecondHook(part2, currentSlideIndex + 1, slides.length + 1, topic, 1),
      subDetail: part2,
      visualGuide: currentSlide.visualGuide,
      imageSearchKeyword: currentSlide.imageSearchKeyword,
      badgeText: `POINT 0${currentSlideIndex + 2}`,
      imageUrl: currentSlide.imageUrl,
      textAlign: currentSlide.textAlign || textAlign,
      textBottomYPercent: currentSlide.textBottomYPercent ?? textBottomYPercent
    };

    updated.splice(currentSlideIndex + 1, 0, newSlide);

    const reindexed = updated.map((s, i) => ({
      ...s,
      slideNumber: i + 1,
      badgeText: i === 0 ? '🔥 3초 떡상 훅' : i === updated.length - 1 ? '💬 토론 & 저장' : `POINT 0${i + 1}`
    }));

    setSlides(reindexed);
    setScriptToast(`✂️ ${currentSlideIndex + 1}번 카드가 2장으로 분할되었습니다!`);
    setTimeout(() => setScriptToast(null), 3000);
  };

  // 5. 다음 슬라이드와 대본 합치기
  const handleMergeWithNextSlide = () => {
    if (currentSlideIndex >= slides.length - 1) return;
    const nextSlide = slides[currentSlideIndex + 1];

    const mergedText = `${currentSlide.subDetail}\n${nextSlide.subDetail}`.trim();
    const updated = [...slides];
    updated[currentSlideIndex] = {
      ...currentSlide,
      subDetail: mergedText
    };
    updated.splice(currentSlideIndex + 1, 1);

    const reindexed = updated.map((s, i) => ({
      ...s,
      slideNumber: i + 1,
      badgeText: i === 0 ? '🔥 3초 떡상 훅' : i === updated.length - 1 ? '💬 토론 & 저장' : `POINT 0${i + 1}`
    }));

    setSlides(reindexed);
    setScriptToast(`🔗 다음 슬라이드와 대본이 하나로 합쳐졌습니다!`);
    setTimeout(() => setScriptToast(null), 3000);
  };

  // 6. 새 슬라이드 추가
  const handleAddSlide = () => {
    const newSlide: CarouselSlide = {
      slideNumber: slides.length + 1,
      type: 'body',
      mainHook: '새로운 3초 도입부 헤드라인',
      subDetail: '대본 내용을 여기에 입력하세요.',
      visualGuide: '스토리 장면에 맞는 현장 사진',
      imageSearchKeyword: `${topic} 사진`,
      badgeText: `POINT 0${slides.length + 1}`,
      textAlign: textAlign,
      textBottomYPercent: textBottomYPercent
    };
    setSlides([...slides, newSlide]);
    setCurrentSlideIndex(slides.length);
  };

  // 7. 현재 슬라이드 삭제
  const handleDeleteCurrentSlide = () => {
    if (slides.length <= 1) return;
    const updated = slides.filter((_, idx) => idx !== currentSlideIndex);
    const reindexed = updated.map((s, i) => ({
      ...s,
      slideNumber: i + 1,
      badgeText: i === 0 ? '🔥 3초 떡상 훅' : i === updated.length - 1 ? '💬 토론 & 저장' : `POINT 0${i + 1}`
    }));
    setSlides(reindexed);
    setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1));
  };

  // Update specific field on current slide
  const handleUpdateCurrentSlide = (field: keyof CarouselSlide, val: any) => {
    if (!slides[currentSlideIndex]) return;
    const updated = [...slides];
    updated[currentSlideIndex] = {
      ...updated[currentSlideIndex],
      [field]: val
    };
    setSlides(updated);
  };

  // Image Upload Handlers
  const handleSlideFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        const updated = [...slides];
        updated[currentSlideIndex] = {
          ...updated[currentSlideIndex],
          imageUrl: result
        };
        setSlides(updated);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleApplySlideCustomUrl = (url: string) => {
    if (!url.trim()) return;
    const updated = [...slides];
    updated[currentSlideIndex] = {
      ...updated[currentSlideIndex],
      imageUrl: url.trim()
    };
    setSlides(updated);
    setUrlModalOpen(false);
    setCustomUrlInput('');
  };

  const handleSlideImageRemove = () => {
    if (!slides[currentSlideIndex]) return;
    const updated = [...slides];
    updated[currentSlideIndex] = {
      ...updated[currentSlideIndex],
      imageUrl: undefined
    };
    setSlides(updated);
  };

  // Active settings for current slide
  const currentSlide = slides[currentSlideIndex];
  const activeTextAlign = currentSlide?.textAlign || textAlign;
  const activeBottomYPercent = currentSlide?.textBottomYPercent ?? textBottomYPercent;

  // Specific Slide Canvas Generator (With Bottom-Anchored Layout Math)
  const renderSlideCanvas = async (slideIndex: number): Promise<HTMLCanvasElement | null> => {
    const slide = slides[slideIndex];
    if (!slide) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    let width = 1080;
    let height = 1350; // 4:5
    if (carouselRatio === '1:1') {
      height = 1080;
    } else if (carouselRatio === '9:16') {
      height = 1920;
    }

    canvas.width = width;
    canvas.height = height;

    const currentSlideAlign = slide.textAlign || textAlign;
    const currentBottomYPercent = slide.textBottomYPercent ?? textBottomYPercent;

    // Draw background
    if (slide.imageUrl) {
      try {
        const img = await loadImage(slide.imageUrl);
        drawImageCover(ctx, img, 0, 0, width, height);
        // Dark contrast overlay
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
        grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.65)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.88)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      } catch (e) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);
      }
    } else {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#090d16');
      grad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }

    // 2026 Instagram Algorithm: Top Story Progress Bar (Swipe Cue)
    if (showSwipeIndicator && slides.length > 1) {
      const barTop = 32;
      const barHeight = 6;
      const barSpacing = 8;
      const totalWidth = width - 120;
      const singleBarW = (totalWidth - (slides.length - 1) * barSpacing) / slides.length;

      for (let i = 0; i < slides.length; i++) {
        const bx = 60 + i * (singleBarW + barSpacing);
        ctx.beginPath();
        ctx.roundRect(bx, barTop, singleBarW, barHeight, 3);
        if (i === slideIndex) {
          ctx.fillStyle = selectedTheme.accent || '#6366f1';
        } else if (i < slideIndex) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
        }
        ctx.fill();
      }
    }

    const { titlePx } = FONT_SIZE_PRESETS.find(p => p.id === fontSizeMode) || FONT_SIZE_PRESETS[1];

    // Badge
    const badgeText = slide.badgeText || (slide.type === 'cover' ? '🔥 3초 떡상 훅' : `POINT 0${slide.slideNumber}`);
    ctx.font = `bold 24px ${selectedFont.family}`;
    ctx.fillStyle = selectedTheme.badgeBg;
    const badgeWidth = ctx.measureText(badgeText).width + 36;
    const badgeX = currentSlideAlign === 'center' ? (width - badgeWidth) / 2 : 80;
    const badgeY = height * 0.15;

    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeWidth, 48, 24);
    ctx.fill();

    ctx.fillStyle = selectedTheme.badgeText;
    ctx.textAlign = 'center';
    ctx.fillText(badgeText, badgeX + badgeWidth / 2, badgeY + 32);

    // Prepare Headline Lines & Height
    ctx.font = `900 ${titlePx}px ${selectedFont.family}`;
    const maxTextWidth = width - 160;
    const headlineLines = wrapCanvasText(ctx, slide.mainHook, maxTextWidth);
    const headlineLineHeight = titlePx * 1.35;
    const headlineTotalHeight = headlineLines.length * headlineLineHeight;

    // Prepare SubDetail Lines & Height
    const activeSubPx = SUB_DETAIL_SIZE_PRESETS.find(p => p.id === (slide.subDetailFontSize || subDetailFontSize))?.canvasPx || 32;
    const activeSubFont = slide.subDetailFont || subDetailFont.family;
    const activeSubColor = slide.subDetailColor || subDetailColor;
    const activeSubBg = slide.subDetailBgStyle || subDetailBgStyle;

    ctx.font = `500 ${activeSubPx}px ${activeSubFont}`;
    const subLines = wrapCanvasText(ctx, slide.subDetail, maxTextWidth);
    const subLineHeight = activeSubPx * 1.45;
    const subTextTotalHeight = subLines.length * subLineHeight;

    const boxPaddingX = 24;
    const boxPaddingY = 16;
    let subBoxWidth = 0;
    let subBoxHeight = 0;
    if (activeSubBg !== 'none' && subLines.length > 0) {
      let maxLineWidth = 0;
      for (const line of subLines) {
        maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line).width);
      }
      subBoxWidth = Math.min(width - 120, maxLineWidth + boxPaddingX * 2);
      subBoxHeight = (subLines.length * activeSubPx * 1.42) + boxPaddingY * 2;
    }

    const subDetailBlockHeight = (activeSubBg !== 'none' && subLines.length > 0) ? subBoxHeight : subTextTotalHeight;
    const gapBetweenHeadAndSub = 24;
    const totalBlockHeight = headlineTotalHeight + gapBetweenHeadAndSub + subDetailBlockHeight;

    // Bottom Anchor: The bottom of the text block sits exactly at targetBottomY
    const targetBottomY = height * (currentBottomYPercent / 100);

    // Starting Y baseline for headline
    const headlineTopY = targetBottomY - totalBlockHeight;
    let currentY = headlineTopY + titlePx * 0.88;

    const textX = currentSlideAlign === 'center' ? width / 2 : 80;
    ctx.textAlign = currentSlideAlign;
    ctx.fillStyle = selectedTextColor;
    ctx.font = `900 ${titlePx}px ${selectedFont.family}`;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 14;

    for (const line of headlineLines) {
      ctx.fillText(line, textX, currentY);
      currentY += headlineLineHeight;
    }

    currentY += (gapBetweenHeadAndSub - headlineLineHeight + titlePx * 0.35);

    if (activeSubBg !== 'none' && subLines.length > 0) {
      const boxX = currentSlideAlign === 'center' ? (width - subBoxWidth) / 2 : 70;
      const boxY = currentY;

      ctx.save();
      ctx.fillStyle = activeSubBg === 'box' ? 'rgba(15, 23, 42, 0.82)' : 'rgba(0, 0, 0, 0.62)';
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, subBoxWidth, subBoxHeight, 16);
      ctx.fill();
      if (activeSubBg === 'box') {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();

      currentY += boxPaddingY + activeSubPx * 0.88;
    } else {
      currentY += activeSubPx * 0.88;
    }

    ctx.fillStyle = activeSubColor;
    ctx.font = `500 ${activeSubPx}px ${activeSubFont}`;
    ctx.shadowBlur = activeSubBg === 'none' ? 8 : 2;
    for (const sLine of subLines) {
      ctx.fillText(sLine, textX, currentY);
      currentY += (activeSubBg !== 'none' ? activeSubPx * 1.42 : subLineHeight);
    }

    // Footer page number & Swipe Cue
    ctx.shadowBlur = 0;
    ctx.fillStyle = slide.imageUrl ? '#94a3b8' : selectedTheme.subText;
    ctx.font = `bold 22px ${selectedFont.family}`;
    ctx.textAlign = 'center';
    ctx.fillText(`${slide.slideNumber} / ${slides.length}`, width / 2, height - 65);

    if (showSwipeIndicator) {
      ctx.font = `bold 20px ${selectedFont.family}`;
      ctx.textAlign = 'right';
      if (slideIndex < slides.length - 1) {
        ctx.fillStyle = '#ffffff';
        ctx.fillText('옆으로 넘기기 👉', width - 70, height - 65);
      } else {
        ctx.fillStyle = '#facc15';
        ctx.fillText('📌 저장 & 공유', width - 70, height - 65);
      }
    }

    return canvas;
  };

  // Download Single Slide
  const drawAndDownloadSlide = async () => {
    const canvas = await renderSlideCanvas(currentSlideIndex);
    if (!canvas) return;
    const slide = slides[currentSlideIndex];
    const link = document.createElement('a');
    const orderNum = String(slide.slideNumber).padStart(2, '0');
    link.download = `${orderNum}_${slide.type}_${topic}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // 2026 Mobile Instant Share (Web Share API)
  const handleShareSlide = async () => {
    const canvas = await renderSlideCanvas(currentSlideIndex);
    if (!canvas) return;
    const slide = slides[currentSlideIndex];
    const orderNum = String(slide.slideNumber).padStart(2, '0');
    const fileName = `${orderNum}_${slide.type}_${topic}.png`;
    const shareText = `${slide.mainHook || topic}\n\n${slide.subDetail || ''}`;

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], fileName, { type: 'image/png' });

      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `${topic} - 카드 ${slide.slideNumber}`,
            text: shareText,
          });
          return;
        } catch (err: any) {
          if (err.name === 'AbortError') return;
        }
      }

      // Fallback: clipboard copy and image download
      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(shareText);
          setScriptToast('📋 카드 본문이 클립보드에 복사되었으며 이미지를 다운로드합니다!');
          setTimeout(() => setScriptToast(null), 3500);
        }
      } catch (clipErr) {
        // ignore
      }
      drawAndDownloadSlide();
    }, 'image/png');
  };

  // 2026 Batch Export: Download All Slides Sequentially
  const downloadAllSlides = async () => {
    if (slides.length === 0 || isExportingAll) return;
    setIsExportingAll(true);

    try {
      for (let i = 0; i < slides.length; i++) {
        setExportProgress(`${i + 1} / ${slides.length}장 고화질 렌더링 중...`);
        const canvas = await renderSlideCanvas(i);
        if (canvas) {
          const slide = slides[i];
          const orderNum = String(slide.slideNumber).padStart(2, '0');
          const link = document.createElement('a');
          link.download = `${orderNum}_${slide.type}_${topic}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
        }
        await new Promise(r => setTimeout(r, 400));
      }
      setScriptToast(`🎉 전체 ${slides.length}장의 고화질 카드뉴스가 일괄 다운로드되었습니다!`);
      setTimeout(() => setScriptToast(null), 4000);
    } catch (err) {
      console.error('All slides download failed:', err);
    } finally {
      setIsExportingAll(false);
      setExportProgress(null);
    }
  };

  const { titleClass } = FONT_SIZE_PRESETS.find(p => p.id === fontSizeMode) || FONT_SIZE_PRESETS[1];
  const mainHookLen = currentSlide?.mainHook ? currentSlide.mainHook.replace(/\s+/g, '').length : 0;
  const subDetailLen = currentSlide?.subDetail ? currentSlide.subDetail.replace(/\s+/g, '').length : 0;

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full pb-12">
      {/* Top Navigation & Status Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          {onBackToStudio && (
            <button
              onClick={onBackToStudio}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs transition border border-slate-200 cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4 text-indigo-600" />
              <span>← 쇼츠 스튜디오로 돌아가기</span>
            </button>
          )}

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-400 hidden sm:inline">제작 대상:</span>
            <span className="text-xs font-black text-slate-900 bg-rose-50 text-rose-700 px-3 py-1 rounded-xl border border-rose-200 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-rose-600" />
              <span>{topic}</span>
            </span>
          </div>
        </div>

        {/* Regenerate with AI */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="인물/주제 변경"
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 w-36 sm:w-48 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
          <button
            onClick={() => handleGenerate(topic)}
            disabled={isLoading}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-black text-xs flex items-center gap-1 shadow-sm transition disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isLoading ? '생성 중...' : 'AI 캐러셀 새로고침'}</span>
          </button>
        </div>
      </div>

      {/* Hidden File Input for Image Upload */}
      <input
        type="file"
        ref={slideFileInputRef}
        onChange={handleSlideFileUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Modal for URL input */}
      {urlModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2 text-indigo-700 font-black text-sm">
                <LinkIcon className="w-4 h-4" />
                <span>이미지 웹 주소(URL) 입력</span>
              </div>
              <button
                type="button"
                onClick={() => setUrlModalOpen(false)}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-600 font-black text-xs transition cursor-pointer active:scale-95"
                title="닫기"
              >
                <X className="w-4 h-4 text-slate-600" />
                <span>닫기</span>
              </button>
            </div>
            <p className="text-xs text-slate-500">
              구글 이미지에서 '이미지 주소 복사' 후 붙여넣으시면 고화질로 반영됩니다.
            </p>
            <input
              type="text"
              value={customUrlInput}
              onChange={(e) => setCustomUrlInput(e.target.value)}
              placeholder="https://images.unsplash.com/... 또는 웹 이미지 URL"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setUrlModalOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={() => handleApplySlideCustomUrl(customUrlInput)}
                className="px-4 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
              >
                적용하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feature 1: 쇼츠 프로젝트 1:1 직통 연동 바 (현재 씬 사진 + 원본 대본) */}
      {currentProject?.scenes && currentProject.scenes.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 border-2 border-indigo-200/80 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-indigo-600 text-white font-black text-[11px] flex items-center gap-1 shadow-2xs">
                <Film className="w-3.5 h-3.5" />
                <span>쇼츠 프로젝트 연동</span>
              </span>
              <h4 className="font-black text-slate-900 text-sm sm:text-base">
                현재 쇼츠 씬 사진({currentProject.scenes.length}장) + 원본 대본 1:1 완벽 가져오기
              </h4>
            </div>
            <p className="text-xs text-slate-600">
              쇼츠 대본을 <strong>요약하지 않고 100% 온전히 보존</strong>하여 각 카드에 나누어 담고, 메인 헤드라인은 3초 도입부형으로 자동 생성합니다.
            </p>
          </div>

          <button
            onClick={handleImportProjectScenes}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 hover:from-indigo-700 hover:to-rose-700 text-white font-black text-xs sm:text-sm shadow-md flex items-center gap-2 transition cursor-pointer active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>🎬 쇼츠 씬 사진 & 원본대본 1:1 가져오기</span>
          </button>
        </div>
      )}

      {/* Feature 2: Shorts Script to Carousel Auto-Chunker Bar */}
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-rose-50 border border-indigo-100 rounded-3xl p-5 sm:p-6 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-indigo-600" />
            <h4 className="font-black text-slate-900 text-sm sm:text-base">
              ✂️ 쇼츠 대본 100% 원문 보존 & 스마트 컷 편집 분할
            </h4>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              대본 요약 0% • 원문 100% 보존
            </span>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            헤드라인은 3초 도입부형 훅 요약, 보조설명은 쇼츠 대본 그대로 컷 편집
          </span>
        </div>

        <div className="relative">
          <textarea
            value={scriptInput}
            onChange={(e) => setScriptInput(e.target.value)}
            rows={2}
            placeholder="쇼츠 대본 전체를 여기에 붙여넣으세요. (내용을 요약하지 않고 모바일 카드 가독성에 맞게 컷 편집 분할됩니다)"
            className="w-full bg-white rounded-2xl p-3 text-xs sm:text-sm text-slate-800 border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner pr-36 sm:pr-48"
          />
          <button
            onClick={handleConvertScriptToCarousel}
            disabled={!scriptInput.trim()}
            className="absolute bottom-3 right-3 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-700 hover:to-rose-700 text-white font-black text-xs shadow-md flex items-center gap-1.5 transition disabled:opacity-40 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>✨ 원문 100% 컷 분할 적용</span>
          </button>
        </div>

        {scriptToast && (
          <div className="p-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold animate-bounce shadow-md text-center">
            {scriptToast}
          </div>
        )}
      </div>

      {/* Main Studio 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Interactive Preview & Photo Control Bar */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-slate-900 text-base sm:text-lg">캐러셀 실시간 비주얼 뷰어</h3>
              <p className="text-xs text-slate-500">좌측 정렬 기본 • 하단 기준 앵커링 텍스트 높이 실시간 반영</p>
            </div>

            <div className="flex items-center gap-2">
              {/* Swipe Indicator Toggle */}
              <button
                type="button"
                onClick={() => setShowSwipeIndicator(!showSwipeIndicator)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                  showSwipeIndicator
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}
                title="인스타 스토리 스타일 상단 프로그레스 바 및 하단 넘겨보기 큐레이션 표시"
              >
                <CheckCircle2 className={`w-3.5 h-3.5 ${showSwipeIndicator ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>스와이프 유도 바 {showSwipeIndicator ? 'ON' : 'OFF'}</span>
              </button>

              {/* Ratio Toggle */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setCarouselRatio('4:5')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${carouselRatio === '4:5' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'}`}
                >
                  4:5 (세로형)
                </button>
                <button
                  onClick={() => setCarouselRatio('1:1')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${carouselRatio === '1:1' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'}`}
                >
                  1:1 (정방형)
                </button>
                <button
                  onClick={() => setCarouselRatio('9:16')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${carouselRatio === '9:16' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'}`}
                >
                  9:16 (스토리)
                </button>
              </div>
            </div>
          </div>

          {/* Photo & Keyword Search Bar for Current Slide */}
          <div className="space-y-2">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center space-x-3.5">
              {/* Photo Preview Thumbnail */}
              {currentSlide?.imageUrl ? (
                <div className="relative group w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-slate-300 shadow-2xs shrink-0">
                  <img
                    src={currentSlide.imageUrl}
                    alt={`Slide ${currentSlide.slideNumber}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={handleSlideImageRemove}
                    className="absolute top-1 right-1 p-1 rounded-md bg-black/60 text-white hover:bg-rose-600 transition cursor-pointer"
                    title="사진 삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 bg-white shrink-0">
                  <ImageIcon className="w-5 h-5 mb-0.5 text-slate-400" />
                  <span className="text-[10px] font-bold">사진 없음</span>
                </div>
              )}

              {/* Buttons & Keyword Display */}
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => slideFileInputRef.current?.click()}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{currentSlide?.imageUrl ? '사진 교체' : '사진 업로드'}</span>
                  </button>

                  <a
                    href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(currentSlide?.imageSearchKeyword || `${topic} ${currentSlide?.mainHook || ''}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs border border-amber-200 transition cursor-pointer"
                    title="새 탭에서 구글 이미지 검색"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>구글 검색</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setCustomUrlInput(currentSlide?.imageUrl || '');
                      setUrlModalOpen(true);
                    }}
                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 transition cursor-pointer"
                    title="이미지 URL 직접 입력"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>URL</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                  <span className="font-bold text-slate-700 shrink-0">키워드:</span>
                  <input
                    type="text"
                    value={currentSlide?.imageSearchKeyword || ''}
                    onChange={(e) => handleUpdateCurrentSlide('imageSearchKeyword', e.target.value)}
                    placeholder="구글 이미지 검색 키워드 (클릭하여 수정 가능)"
                    className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-indigo-500 w-full"
                  />
                </div>
              </div>
            </div>

            {currentSlide?.visualGuide && (
              <p className="text-xs text-slate-500 italic font-medium px-1">
                연출 가이드: {currentSlide.visualGuide}
              </p>
            )}
          </div>

          {/* Visual Canvas Card with Photo Layer & Selected Font/Color & Bottom-Anchored Text Box */}
          <div className="flex justify-center">
            <div 
              className={`w-full max-w-md rounded-3xl p-8 relative flex flex-col justify-between transition-all duration-300 shadow-2xl border-4 overflow-hidden ${
                carouselRatio === '4:5' ? 'aspect-4/5' : carouselRatio === '1:1' ? 'aspect-square' : 'aspect-9/16'
              }`}
              style={{ 
                background: currentSlide?.imageUrl 
                  ? `url("${currentSlide.imageUrl}") center/cover no-repeat` 
                  : selectedTheme.bg, 
                color: selectedTextColor,
                borderColor: selectedTheme.accent,
                fontFamily: selectedFont.family,
                textAlign: activeTextAlign
              }}
            >
              {/* Dark Overlay when photo is active */}
              {currentSlide?.imageUrl && (
                <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/65 to-black/85 z-0" />
              )}

              {/* 2026 Instagram Algorithm: Top Story Progress Bar */}
              {showSwipeIndicator && slides.length > 1 && (
                <div className="relative z-10 flex items-center space-x-1.5 pt-0.5 pb-2">
                  {slides.map((_, i) => (
                    <div 
                      key={i}
                      className={`h-1 rounded-full flex-1 transition-all ${
                        i === currentSlideIndex 
                          ? 'bg-indigo-400 ring-1 ring-white/50' 
                          : i < currentSlideIndex 
                          ? 'bg-white/80' 
                          : 'bg-white/25'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Top Header Badge */}
              <div className={`relative z-10 flex ${activeTextAlign === 'center' ? 'justify-center' : 'justify-start'}`}>
                <span 
                  className="px-3.5 py-1 rounded-full text-xs font-black shadow-md tracking-wide"
                  style={{ 
                    backgroundColor: selectedTheme.badgeBg, 
                    color: selectedTheme.badgeText 
                  }}
                >
                  {currentSlide?.badgeText || (currentSlide?.type === 'cover' ? '🔥 3초 떡상 훅' : `POINT 0${currentSlide?.slideNumber || 1}`)}
                </span>
              </div>

              {/* Main Content Area - Anchored to Bottom! (텍스트 박스 하단 기준 앵커링) */}
              <div 
                className="absolute z-10 left-8 right-8 flex flex-col justify-end space-y-3.5 transition-all duration-200 pointer-events-none"
                style={{
                  bottom: `${100 - activeBottomYPercent}%`,
                  textAlign: activeTextAlign
                }}
              >
                {/* Main Headline (3-Second Hook Large Text) */}
                <h2 
                  className={`font-black tracking-tight leading-snug drop-shadow-lg whitespace-pre-line ${titleClass}`}
                  style={{ color: selectedTextColor }}
                >
                  {currentSlide?.mainHook || '3초 도입부 헤드라인을 입력하세요'}
                </h2>

                {/* SubDetail (Full Unsummarized Shorts Narration) */}
                <div className={`transition-all ${
                  (currentSlide?.subDetailBgStyle || subDetailBgStyle) === 'capsule'
                    ? `px-4 py-2.5 rounded-2xl bg-black/60 backdrop-blur-xs max-w-fit ${activeTextAlign === 'center' ? 'mx-auto' : 'mr-auto'}`
                    : (currentSlide?.subDetailBgStyle || subDetailBgStyle) === 'box'
                    ? 'p-3.5 rounded-2xl bg-slate-900/80 border border-white/15 backdrop-blur-sm'
                    : ''
                }`}>
                  <p 
                    className={`font-medium leading-relaxed drop-shadow-md whitespace-pre-line ${
                      SUB_DETAIL_SIZE_PRESETS.find(p => p.id === (currentSlide?.subDetailFontSize || subDetailFontSize))?.descClass || 'text-sm sm:text-base'
                    }`}
                    style={{ 
                      color: currentSlide?.subDetailColor || subDetailColor,
                      fontFamily: currentSlide?.subDetailFont || subDetailFont.family 
                    }}
                  >
                    {currentSlide?.subDetail || '쇼츠 대본 원문이 여기에 그대로 들어갑니다.'}
                  </p>
                </div>
              </div>

              {/* Bottom Footer Page Count & Swipe Cue */}
              <div className="relative z-10 flex items-center justify-between text-xs pt-4 border-t border-white/10 font-bold text-slate-300 mt-auto">
                <span>{topic}</span>
                <span className="px-2 py-0.5 rounded-full bg-black/40 text-[11px]">
                  {(currentSlideIndex + 1)} / {slides.length}
                </span>
                {showSwipeIndicator && (
                  <span className="text-[11px] text-amber-300 font-extrabold flex items-center gap-0.5">
                    {currentSlideIndex < slides.length - 1 ? '넘겨보기 👉' : '📌 저장하기'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Slide Navigation & Canvas Export Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                disabled={currentSlideIndex === 0}
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 transition cursor-pointer"
                title="이전 카드"
              >
                <ChevronLeft className="w-5 h-5 text-slate-700" />
              </button>
              <span className="text-xs font-bold text-slate-700">
                {currentSlideIndex + 1} / {slides.length}
              </span>
              <button
                onClick={() => setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1))}
                disabled={currentSlideIndex >= slides.length - 1}
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 transition cursor-pointer"
                title="다음 카드"
              >
                <ChevronRight className="w-5 h-5 text-slate-700" />
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleShareSlide}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer active:scale-95"
                title="인스타그램, 카카오톡, 틱톡, 갤러리로 즉시 전송"
              >
                <Share2 className="w-4 h-4 text-white" />
                <span>📱 즉시 공유</span>
              </button>

              <button
                onClick={drawAndDownloadSlide}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
                title="현재 보고 있는 1장만 다운로드"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>현재 슬라이드 HD</span>
              </button>

              <button
                onClick={downloadAllSlides}
                disabled={isExportingAll}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 text-white font-black text-xs flex items-center gap-1.5 shadow-md transition disabled:opacity-50 cursor-pointer"
                title="1번 카드부터 끝번 카드까지 순서대로 일괄 다운로드"
              >
                <Download className="w-4 h-4 text-amber-300" />
                <span>{isExportingAll ? (exportProgress || '일괄 저장 중...') : `📦 전체 슬라이드 일괄 다운로드 (${slides.length}장)`}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Slide Content Inputs & Typography Customizer */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. Current Slide Text Editor & Cut-Editing Tools */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-rose-600" />
                <h4 className="font-black text-slate-900 text-sm">
                  {currentSlideIndex + 1}번 카드 내용 & 컷 편집
                </h4>
              </div>
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={handleAddSlide}
                  className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-black border border-indigo-200 transition cursor-pointer flex items-center gap-0.5"
                  title="새 슬라이드 추가"
                >
                  <Plus className="w-3 h-3" />
                  <span>카드 추가</span>
                </button>
                {slides.length > 1 && (
                  <button
                    type="button"
                    onClick={handleDeleteCurrentSlide}
                    className="p-1 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 transition cursor-pointer"
                    title="현재 슬라이드 삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Badge text input */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">상단 배지 문구</label>
              <input
                type="text"
                value={currentSlide?.badgeText || ''}
                onChange={(e) => handleUpdateCurrentSlide('badgeText', e.target.value)}
                placeholder="예: 🔥 3초 떡상 훅, POINT 01"
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Main Headline (3-Second Hook) Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <label className="text-[11px] font-bold text-slate-800">
                    메인 헤드라인 (큰 글씨) - 3초 도입부형
                  </label>
                  <button
                    type="button"
                    onClick={handleCycle3SecondHook}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-black border border-amber-200 transition cursor-pointer active:scale-95 shadow-2xs"
                    title="클릭할 때마다 다른 3초 도입부 후킹 스타일로 즉시 변경됩니다"
                  >
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    <span>⚡ 3초 훅 다시 뽑기</span>
                  </button>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  mainHookLen <= 18
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : mainHookLen <= 28
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {mainHookLen}자 {mainHookLen <= 18 ? '🟢 3초 훅 최적' : '🟠 다소 긺'}
                </span>
              </div>
              <textarea
                value={currentSlide?.mainHook || ''}
                onChange={(e) => handleUpdateCurrentSlide('mainHook', e.target.value)}
                rows={2}
                placeholder="장면을 요약한 3초 도입부 헤드라인 (엔터로 줄바꿈 가능)"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Sub Detail (Full Unsummarized Shorts Script) & Cut-Editor */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <label className="text-[11px] font-bold text-slate-700">
                    상세 보조 설명 (작은 글씨) - 쇼츠 대본 원문
                  </label>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                    요약 0%
                  </span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  subDetailLen <= 80 ? 'bg-emerald-50 text-emerald-700' : subDetailLen <= 130 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                }`}>
                  {subDetailLen}자 {subDetailLen <= 110 ? '🟢 읽기 최적' : '🟠 분할 추천'}
                </span>
              </div>
              <textarea
                value={currentSlide?.subDetail || ''}
                onChange={(e) => handleUpdateCurrentSlide('subDetail', e.target.value)}
                rows={4}
                placeholder="쇼츠 대본 원문이 그대로 들어갑니다. (요약하지 않고 컷 편집으로 분할)"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 leading-relaxed"
              />

              {/* Cut-editing Action Buttons */}
              <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleSplitCurrentSlide}
                  className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition cursor-pointer flex items-center gap-1 active:scale-95"
                  title="이 카드의 대본을 2개의 슬라이드로 나눕니다"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>✂️ 이 문장에서 컷 분할 (슬라이드 나누기)</span>
                </button>

                {currentSlideIndex < slides.length - 1 && (
                  <button
                    type="button"
                    onClick={handleMergeWithNextSlide}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition cursor-pointer flex items-center gap-1 active:scale-95"
                    title="다음 슬라이드의 대본을 이 슬라이드 끝에 합칩니다"
                  >
                    <GitMerge className="w-3.5 h-3.5" />
                    <span>🔗 다음 카드와 합치기</span>
                  </button>
                )}
              </div>
            </div>

            {/* Image Search Keyword Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-700">추천 사진 검색 키워드</label>
                <a
                  href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(currentSlide?.imageSearchKeyword || `${topic} ${currentSlide?.mainHook || ''}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 hover:text-amber-800"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>구글 이미지 바로 검색</span>
                </a>
              </div>
              <input
                type="text"
                value={currentSlide?.imageSearchKeyword || ''}
                onChange={(e) => handleUpdateCurrentSlide('imageSearchKeyword', e.target.value)}
                placeholder="예: 안성재 미군 정비병 시절 사진"
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          {/* 2. Main Headline Typography, Color, Alignment & Bottom-Anchored Height */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-sm font-black text-slate-900">
              <TypeIcon className="w-4 h-4 text-indigo-600" />
              <span>2. 메인 헤드라인 스타일 (서체 • 크기 • 정렬 • 높이)</span>
            </div>

            {/* Font Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5">헤드라인 서체 선택</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {FONT_OPTIONS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFont(f)}
                    className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                      selectedFont.id === f.id
                        ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 text-indigo-950'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="text-xs font-black" style={{ fontFamily: f.family }}>{f.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{f.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size & Align (Default: Left-Aligned) */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5">헤드라인 크기</label>
                <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
                  {FONT_SIZE_PRESETS.map((sz) => (
                    <button
                      key={sz.id}
                      onClick={() => setSizeMode(sz.id as any)}
                      className={`flex-1 py-1 text-center rounded-lg text-xs font-bold transition cursor-pointer ${
                        fontSizeMode === sz.id ? 'bg-white text-indigo-600 shadow-2xs font-black' : 'text-slate-600'
                      }`}
                    >
                      {sz.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5">텍스트 정렬 (기본: 좌측)</label>
                <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => {
                      setTextAlign('left');
                      handleUpdateCurrentSlide('textAlign', 'left');
                    }}
                    className={`flex-1 py-1 flex items-center justify-center rounded-lg text-xs font-bold transition cursor-pointer ${
                      activeTextAlign === 'left' ? 'bg-white text-indigo-600 shadow-2xs font-black' : 'text-slate-600'
                    }`}
                  >
                    <AlignLeft className="w-3.5 h-3.5 mr-1" />
                    <span>좌측 (기본)</span>
                  </button>
                  <button
                    onClick={() => {
                      setTextAlign('center');
                      handleUpdateCurrentSlide('textAlign', 'center');
                    }}
                    className={`flex-1 py-1 flex items-center justify-center rounded-lg text-xs font-bold transition cursor-pointer ${
                      activeTextAlign === 'center' ? 'bg-white text-indigo-600 shadow-2xs font-black' : 'text-slate-600'
                    }`}
                  >
                    <AlignCenter className="w-3.5 h-3.5 mr-1" />
                    <span>중앙</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Height Position Controller (Anchored to Bottom of Text Block) */}
            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                  <label className="text-[11px] font-bold text-slate-800">
                    텍스트 박스 위치 높이 (하단 기준 앵커링)
                  </label>
                </div>
                <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200 shadow-2xs">
                  하단 {activeBottomYPercent}% 지점
                </span>
              </div>

              {/* Height Presets */}
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: '하단 (82% 기본)', value: 82 },
                  { label: '중하단 (72%)', value: 72 },
                  { label: '중앙 (60%)', value: 60 },
                  { label: '상단 (50%)', value: 50 },
                ].map((pos) => {
                  const isCurrent = Math.abs(activeBottomYPercent - pos.value) < 2;
                  return (
                    <button
                      key={pos.value}
                      type="button"
                      onClick={() => {
                        setTextBottomYPercent(pos.value);
                        handleUpdateCurrentSlide('textBottomYPercent', pos.value);
                      }}
                      className={`py-1.5 px-1 rounded-xl text-[11px] font-bold transition cursor-pointer text-center ${
                        isCurrent
                          ? 'bg-indigo-600 text-white shadow-xs font-black'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {pos.label}
                    </button>
                  );
                })}
              </div>

              {/* Slider for continuous adjustment */}
              <div className="flex items-center space-x-3 pt-1">
                <span className="text-[10px] font-bold text-slate-400">상단 (45%)</span>
                <input
                  type="range"
                  min={45}
                  max={88}
                  step={1}
                  value={activeBottomYPercent}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setTextBottomYPercent(val);
                    handleUpdateCurrentSlide('textBottomYPercent', val);
                  }}
                  className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />
                <span className="text-[10px] font-bold text-slate-400">하단 (88%)</span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                <span>💡 어느 높이를 선택하든 텍스트 박스 하단을 기준으로 글이 위로 자연스럽게 작성됩니다.</span>
                <button
                  type="button"
                  onClick={() => {
                    const updated = slides.map(s => ({ 
                      ...s, 
                      textBottomYPercent: activeBottomYPercent, 
                      textAlign: activeTextAlign 
                    }));
                    setSlides(updated);
                    setScriptToast(`모든 슬라이드에 높이 ${activeBottomYPercent}% 및 정렬이 일괄 적용되었습니다! ✨`);
                    setTimeout(() => setScriptToast(null), 2500);
                  }}
                  className="text-indigo-600 font-extrabold hover:text-indigo-800 shrink-0 ml-2 cursor-pointer underline"
                >
                  전체 슬라이드 일괄 적용
                </button>
              </div>
            </div>

            {/* Text Color Presets */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5">헤드라인 색상</label>
              <div className="flex items-center space-x-2">
                {TEXT_COLOR_PRESETS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedTextColor(c.hex)}
                    className={`flex-1 py-1.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedTextColor === c.hex ? 'border-indigo-600 ring-2 ring-indigo-500/30 font-black' : 'border-slate-200'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: c.hex }} />
                    <span className="text-[11px] text-slate-700">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. SubDetail Customizer (서체 • 크기 • 컬러 • 배경 박스) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                <TypeIcon className="w-4 h-4 text-emerald-600" />
                <span>3. 상세 보조 설명 스타일 (서체 • 크기 • 컬러 • 배경)</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                가독성 100% 최적화
              </span>
            </div>

            {/* SubDetail Font Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5">보조 설명 서체 선택</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SUB_DETAIL_FONT_OPTIONS.map((f) => {
                  const isSelected = (currentSlide?.subDetailFont || subDetailFont.family) === f.family;
                  return (
                    <button
                      key={f.id}
                      onClick={() => {
                        setSubDetailFont(f);
                        handleUpdateCurrentSlide('subDetailFont', f.family);
                      }}
                      className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 text-emerald-950 font-black'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold" style={{ fontFamily: f.family }}>{f.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{f.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SubDetail Font Size */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5">보조 설명 글자 크기</label>
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
                {SUB_DETAIL_SIZE_PRESETS.map((sz) => {
                  const isSelected = (currentSlide?.subDetailFontSize || subDetailFontSize) === sz.id;
                  return (
                    <button
                      key={sz.id}
                      onClick={() => {
                        setSubDetailFontSize(sz.id as any);
                        handleUpdateCurrentSlide('subDetailFontSize', sz.id);
                      }}
                      className={`flex-1 py-1 text-center rounded-lg text-xs font-bold transition cursor-pointer ${
                        isSelected ? 'bg-white text-emerald-700 shadow-2xs font-black' : 'text-slate-600'
                      }`}
                    >
                      {sz.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SubDetail Text Color */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5">보조 설명 글자 색상</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {SUB_DETAIL_COLOR_PRESETS.map((c) => {
                  const isSelected = (currentSlide?.subDetailColor || subDetailColor) === c.hex;
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSubDetailColor(c.hex);
                        handleUpdateCurrentSlide('subDetailColor', c.hex);
                      }}
                      className={`py-1.5 px-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                        isSelected ? 'border-emerald-600 ring-2 ring-emerald-500/30 bg-emerald-50/40 font-black' : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: c.hex }} />
                      <span className="text-[10px] text-slate-700 truncate">{c.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SubDetail Background Capsule / Box */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5">가독성 보강 배경 스타일</label>
              <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl">
                {SUB_DETAIL_BG_STYLES.map((bg) => {
                  const isSelected = (currentSlide?.subDetailBgStyle || subDetailBgStyle) === bg.id;
                  return (
                    <button
                      key={bg.id}
                      onClick={() => {
                        setSubDetailBgStyle(bg.id as any);
                        handleUpdateCurrentSlide('subDetailBgStyle', bg.id);
                      }}
                      className={`flex-1 py-1.5 text-center rounded-lg text-xs font-bold transition cursor-pointer ${
                        isSelected ? 'bg-white text-emerald-700 shadow-2xs font-black' : 'text-slate-600'
                      }`}
                    >
                      {bg.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 4. Theme Preset (Background Mood) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                <Palette className="w-4 h-4 text-indigo-600" />
                <span>배경 그라데이션 무드</span>
              </div>
              <span className="text-[11px] text-slate-500">사진 없을 시 적용</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {THEMES.map((th) => (
                <button
                  key={th.id}
                  onClick={() => setSelectedTheme(th)}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                    selectedTheme.id === th.id
                      ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/50 text-indigo-950 font-black'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>{th.name}</span>
                  <span 
                    className="w-4 h-4 rounded-full border border-black/10 shrink-0" 
                    style={{ background: th.bg }} 
                  />
                </button>
              ))}
            </div>
          </div>

          {/* 5. Slide List */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-rose-500" />
                <span>전체 슬라이드 순서 ({slides.length}장)</span>
              </h4>
              <button
                onClick={() => {
                  const fullText = slides.map(s => `[${s.slideNumber}장 - ${s.badgeText || s.type}]\n${s.mainHook}\n${s.subDetail}\n`).join('\n---\n\n');
                  copyToClipboard(fullText, 'all_slides');
                }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'all_slides' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>전체 대본 복사</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {slides.map((s, idx) => (
                <div
                  key={idx}
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer text-left space-y-1.5 relative ${
                    currentSlideIndex === idx
                      ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/10'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-slate-200 text-slate-800">
                        {idx + 1}장 • {s.badgeText || s.type}
                      </span>
                      {s.imageUrl && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                          📷 사진 있음
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">선택</span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 line-clamp-2">{s.mainHook.replace('\n', ' ')}</p>
                  <p className="text-[11px] text-slate-500 line-clamp-2">{s.subDetail}</p>
                  
                  {/* Keyword & Quick Google Search button */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-100">
                    <span className="truncate max-w-[200px] text-[10px] text-slate-600 font-medium">
                      키워드: "{s.imageSearchKeyword || topic}"
                    </span>
                    <a
                      href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(s.imageSearchKeyword || `${topic} ${s.mainHook}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold border border-amber-200 text-[10px] shrink-0 transition"
                      title="새 탭에서 구글 이미지 검색"
                    >
                      <ExternalLink className="w-2.5 h-2.5" />
                      <span>구글 검색</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 6. 2026 Instagram Viral Caption & Algorithm Cheatsheet */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-500" />
                  <span>인스타 떡상 캡션 & 알고리즘 치트키</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">2026 알고리즘: DM공유 • 저장(Save) • 첫 125자 최적화</p>
              </div>
              <button
                onClick={() => {
                  const insta = viralData?.posts?.instagram;
                  const hook = insta?.hookFirstLine || `${slides[0]?.mainHook || topic}의 충격적인 진실`;
                  const bullets = (insta?.bulletSummary || slides.slice(1, 4).map(s => s.mainHook.replace('\n', ' '))).map(b => `✔️ ${b}`).join('\n');
                  const body = insta?.bodyText || slides.map(s => s.subDetail).filter(Boolean).join('\n\n');
                  const closing = insta?.saveShareTrigger || '지금 저장해두고 꼭 다시 보세요! 주변 친구들에게도 공유해주세요 🚀';
                  const tags = (insta?.cleanSemanticTags || [topic, '인사이트', '트렌드']).map(t => `#${t.replace('#','')}`).join(' ');
                  const fullCaption = `${hook}\n\n${bullets ? bullets + '\n\n' : ''}${body}\n\n${closing}\n\n${tags}`;
                  copyToClipboard(fullCaption, 'insta_full_caption');
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition cursor-pointer"
              >
                {copiedKey === 'insta_full_caption' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                <span>전체 캡션 복사</span>
              </button>
            </div>

            {/* Fact Banner */}
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-900 leading-snug">
              💡 <strong>2026 인스타 알고리즘 팩트:</strong> 30개 해시태그 도배는 스팸 필터링됩니다. 친구에게 보내는 <strong>[DM 공유]</strong>와 <strong>[저장]</strong>이 도달률을 90% 결정합니다.
            </div>

            {/* 125 Char Stopline Hook */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-rose-600 uppercase">1. 125자 스톱라인 (더보기 클릭 유도)</span>
                <button
                  onClick={() => {
                    const hook = viralData?.posts?.instagram?.hookFirstLine || `${slides[0]?.mainHook || topic}의 충격적인 진실`;
                    copyToClipboard(hook, 'hook_copy');
                  }}
                  className="text-[10px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-0.5 cursor-pointer"
                >
                  {copiedKey === 'hook_copy' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>복사</span>
                </button>
              </div>
              <p className="text-xs font-bold text-slate-900">
                {viralData?.posts?.instagram?.hookFirstLine || `${slides[0]?.mainHook || topic}의 충격적인 진실. 끝까지 넘겨보세요.`}
              </p>
            </div>

            {/* 3-sec Bullets */}
            <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 space-y-1.5">
              <span className="text-[10px] font-bold text-amber-800 uppercase">2. 3초 가독성 불릿포인트 요약</span>
              <div className="space-y-1">
                {(viralData?.posts?.instagram?.bulletSummary || slides.slice(1, 4).map(s => s.mainHook.replace('\n', ' '))).map((b, i) => (
                  <div key={i} className="text-xs text-amber-950 flex items-start gap-1 font-medium">
                    <span className="text-amber-600 font-bold shrink-0">✔️</span>
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* DM Share & Save Closing */}
            <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-indigo-700 uppercase">3. DM 공유 & 저장 클로징 카피</span>
                <button
                  onClick={() => {
                    const closing = viralData?.posts?.instagram?.saveShareTrigger || '지금 저장해두고 필요할 때 꺼내보세요! 주변 친구에게도 공유해주세요 🚀';
                    copyToClipboard(closing, 'closing_copy');
                  }}
                  className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-0.5 cursor-pointer"
                >
                  {copiedKey === 'closing_copy' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>복사</span>
                </button>
              </div>
              <p className="text-xs font-bold text-indigo-950">
                {viralData?.posts?.instagram?.saveShareTrigger || '지금 저장해두고 나중에 꼭 다시 보세요! 주변 친구들에게도 DM으로 공유해주세요 🚀'}
              </p>
            </div>

            {/* Clean Semantic Tags (Only 3~5) */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-500 mr-1">🔍 클린 색인 태그 (단 3~5개):</span>
              {(viralData?.posts?.instagram?.cleanSemanticTags || [topic, '인사이트', '트렌드']).map((tag, i) => (
                <span key={i} className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                  #{tag.replace('#','')}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
