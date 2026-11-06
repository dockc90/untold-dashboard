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
  Search, 
  ExternalLink, 
  Type as TypeIcon, 
  AlignLeft, 
  AlignCenter, 
  Scissors,
  Palette,
  Bookmark,
  Tag,
  X,
  Share2
} from 'lucide-react';
import { CarouselSlide, ViralAssetPackage } from '../types';

interface CarouselStudioProps {
  initialTopic?: string;
  initialCategory?: string;
  initialScript?: string;
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

// Helper: Compresses long narrative sentences into 1~2 punchy lines (max 15~18 chars) for viral Instagram Carousel cards
export function compressToPunchline(text: string): { headline: string; detail: string } {
  let cleaned = text.replace(/["'“”]/g, '').trim();
  if (cleaned.length <= 18) {
    return { headline: cleaned, detail: text };
  }

  // Look for natural clause boundaries
  const splitClauses = cleaned.split(/(?<=[,?!])\s+|(?<=\b(?:하지만|그러나|결국|그리고|어떻게|당시|과거)\b)\s+/);
  if (splitClauses.length > 1) {
    const firstClause = splitClauses[0].trim();
    if (firstClause.length >= 5 && firstClause.length <= 22) {
      const rest = splitClauses.slice(1).join(' ').trim();
      return { headline: firstClause, detail: rest || text };
    }
  }

  // Split into 2 short lines around 10-14 chars
  const words = cleaned.split(/\s+/);
  let line1 = '';
  let line2 = '';
  let remainingWords: string[] = [];
  
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (!line1 || (line1 + ' ' + w).length <= 11) {
      line1 = line1 ? `${line1} ${w}` : w;
    } else if (!line2 || (line2 + ' ' + w).length <= 14) {
      line2 = line2 ? `${line2} ${w}` : w;
    } else {
      remainingWords = words.slice(i);
      break;
    }
  }

  const punchline = line2 ? `${line1}\n${line2}` : line1;
  return {
    headline: punchline,
    detail: remainingWords.length > 0 ? remainingWords.join(' ') : text,
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

  // Styling
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
  const [selectedFont, setSelectedFont] = useState(FONT_OPTIONS[0]);
  const [selectedTextColor, setSelectedTextColor] = useState('#ffffff');
  const [fontSizeMode, setSizeMode] = useState<'sm' | 'md' | 'lg'>('md');
  const [textAlign, setTextAlign] = useState<'center' | 'left'>('center');

  // SubDetail Styling (Request 5: 폰트, 글자 크기, 컬러구성, 배경)
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
    handleGenerate(initialTopic);
  }, []);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Convert Shorts Script to Carousel Slides with Golden Ratio
  const handleConvertScriptToCarousel = () => {
    if (!scriptInput.trim()) return;

    const cleaned = scriptInput
      .replace(/\[씬\s*\d+[^\]]*\]/g, '')
      .replace(/\(\d{2}:\d{2}\s*-\s*\d{2}:\d{2}\)/g, '')
      .replace(/내레이션[:\s]*/g, '')
      .replace(/#\S+/g, '')
      .trim();

    const rawParts = cleaned
      .split(/(?<=[.?!])\s+|\n+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 4);

    if (rawParts.length === 0) return;

    const newSlides: CarouselSlide[] = [];

    // Slide 1: Cover Hook (인스타 떡상 트렌드: 1~2줄 압축 펀치라인, 15자 내외)
    const coverRaw = rawParts[0] || `${topic}에 대한 충격 진실`;
    const coverPunch = compressToPunchline(coverRaw);
    const coverSub = coverPunch.detail && coverPunch.detail !== coverPunch.headline
      ? coverPunch.detail
      : (rawParts[1] || '알고리즘이 숨겨둔 결정적 비하인드 (옆으로 넘겨보기 👉)');

    newSlides.push({
      slideNumber: 1,
      type: 'cover',
      mainHook: coverPunch.headline,
      subDetail: coverSub,
      visualGuide: '인물 고화질 사진 또는 임팩트 그래픽',
      imageSearchKeyword: `${topic} 고화질 프로필 사진`,
      badgeText: '🔥 떡상 카드뉴스',
      imageUrl: slides[0]?.imageUrl
    });

    // Middle slides
    const remaining = rawParts.slice(1);
    let step = 1;
    for (let i = 0; i < remaining.length; i += 2) {
      const mainRaw = remaining[i];
      const punch = compressToPunchline(mainRaw);
      const subCandidate = remaining[i + 1] ? remaining[i + 1] : (punch.detail || '더 깊은 이야기와 반전이 계속됩니다.');

      newSlides.push({
        slideNumber: newSlides.length + 1,
        type: 'body',
        mainHook: punch.headline,
        subDetail: subCandidate,
        visualGuide: '스토리 장면에 맞는 현장 사진 또는 자료 사진',
        imageSearchKeyword: `${topic} ${punch.headline.replace(/[^\w\s가-힣]/g, '').slice(0, 15)} 사진`,
        badgeText: `POINT 0${step}`,
        imageUrl: slides[newSlides.length]?.imageUrl
      });
      step++;
    }

    // Final CTA
    newSlides.push({
      slideNumber: newSlides.length + 1,
      type: 'cta',
      mainHook: `${topic}의 반전 서사,\n어떻게 생각하시나요?`,
      subDetail: '📌 나중에 다시 보려면 지금 바로 [저장] 해두세요!\n💬 댓글로 자유롭게 의견을 들려주세요.',
      visualGuide: '저장 & 공유 유도 엔딩 카드',
      imageSearchKeyword: `${topic} 최근 근황 사진`,
      badgeText: '💬 토론 & 저장'
    });

    setSlides(newSlides);
    setCurrentSlideIndex(0);
    setScriptToast(`대본이 총 ${newSlides.length}장의 인스타 트렌드 펀치라인 카드뉴스로 변환되었습니다! ✨`);
    setTimeout(() => setScriptToast(null), 3500);
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

  const handleQuickCompressHeadline = () => {
    if (!currentSlide?.mainHook) return;
    const punch = compressToPunchline(currentSlide.mainHook);
    const updated = [...slides];
    updated[currentSlideIndex] = {
      ...updated[currentSlideIndex],
      mainHook: punch.headline,
      subDetail: punch.detail && (!currentSlide.subDetail || currentSlide.subDetail.length < 10)
        ? punch.detail
        : currentSlide.subDetail
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

  // Clean Watermark-Free HD Canvas Export
  const drawAndDownloadSlide = async () => {
    if (!slides[currentSlideIndex]) return;
    const slide = slides[currentSlideIndex];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 1080;
    let height = 1350; // 4:5
    if (carouselRatio === '1:1') {
      height = 1080;
    } else if (carouselRatio === '9:16') {
      height = 1920;
    }

    canvas.width = width;
    canvas.height = height;

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

    const { titlePx, descPx } = FONT_SIZE_PRESETS.find(p => p.id === fontSizeMode) || FONT_SIZE_PRESETS[1];

    // Badge
    const badgeText = slide.badgeText || (slide.type === 'cover' ? '🔥 떡상 카드뉴스' : `POINT 0${slide.slideNumber}`);
    ctx.font = `bold 24px ${selectedFont.family}`;
    ctx.fillStyle = selectedTheme.badgeBg;
    const badgeWidth = ctx.measureText(badgeText).width + 36;
    const badgeX = textAlign === 'center' ? (width - badgeWidth) / 2 : 80;
    const badgeY = height * 0.18;

    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeWidth, 48, 24);
    ctx.fill();

    ctx.fillStyle = selectedTheme.badgeText;
    ctx.textAlign = 'center';
    ctx.fillText(badgeText, badgeX + badgeWidth / 2, badgeY + 32);

    // Headline
    ctx.fillStyle = selectedTextColor;
    ctx.font = `900 ${titlePx}px ${selectedFont.family}`;
    ctx.textAlign = textAlign;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 14;

    const maxTextWidth = width - 160;
    const lines = wrapCanvasText(ctx, slide.mainHook, maxTextWidth);
    let startY = height * 0.36;
    const textX = textAlign === 'center' ? width / 2 : 80;

    for (const line of lines) {
      ctx.fillText(line, textX, startY);
      startY += titlePx * 1.35;
    }

    // SubDetail (Request 5: 폰트, 글자 크기, 컬러구성, 배경 박스 커스텀 반영)
    const activeSubPx = SUB_DETAIL_SIZE_PRESETS.find(p => p.id === (slide.subDetailFontSize || subDetailFontSize))?.canvasPx || 32;
    const activeSubFont = slide.subDetailFont || subDetailFont.family;
    const activeSubColor = slide.subDetailColor || subDetailColor;
    const activeSubBg = slide.subDetailBgStyle || subDetailBgStyle;

    ctx.font = `500 ${activeSubPx}px ${activeSubFont}`;
    const subLines = wrapCanvasText(ctx, slide.subDetail, maxTextWidth);
    startY += 26;

    if (activeSubBg !== 'none' && subLines.length > 0) {
      const boxPaddingX = 24;
      const boxPaddingY = 14;
      let maxLineWidth = 0;
      for (const line of subLines) {
        maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line).width);
      }
      const boxWidth = Math.min(width - 120, maxLineWidth + boxPaddingX * 2);
      const boxHeight = (subLines.length * activeSubPx * 1.42) + boxPaddingY * 2;
      const boxX = textAlign === 'center' ? (width - boxWidth) / 2 : 70;
      const boxY = startY - activeSubPx + 6;

      ctx.save();
      ctx.fillStyle = activeSubBg === 'box' ? 'rgba(15, 23, 42, 0.82)' : 'rgba(0, 0, 0, 0.62)';
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 16);
      ctx.fill();
      if (activeSubBg === 'box') {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();
      startY += boxPaddingY * 0.5;
    }

    ctx.fillStyle = activeSubColor;
    ctx.shadowBlur = activeSubBg === 'none' ? 8 : 2;
    for (const sLine of subLines) {
      ctx.fillText(sLine, textX, startY);
      startY += activeSubPx * 1.45;
    }

    // Footer page number (No watermark!)
    ctx.shadowBlur = 0;
    ctx.fillStyle = slide.imageUrl ? '#94a3b8' : selectedTheme.subText;
    ctx.font = `bold 22px ${selectedFont.family}`;
    ctx.textAlign = 'center';
    ctx.fillText(`${slide.slideNumber} / ${slides.length}`, width / 2, height - 70);

    // Trigger download
    const link = document.createElement('a');
    link.download = `carousel_slide_${slide.slideNumber}_${topic}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const currentSlide = slides[currentSlideIndex];
  const { titleClass, descClass } = FONT_SIZE_PRESETS.find(p => p.id === fontSizeMode) || FONT_SIZE_PRESETS[1];
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
              <span>← 첫 화면(인물 선택)으로 돌아가기</span>
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
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                취소
              </button>
              <button
                onClick={() => handleApplySlideCustomUrl(customUrlInput)}
                className="px-4 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
              >
                적용하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shorts Script to Carousel Auto-Chunker Bar */}
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-rose-50 border border-indigo-100 rounded-3xl p-5 sm:p-6 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-indigo-600" />
            <h4 className="font-black text-slate-900 text-sm sm:text-base">
              🎬 쇼츠 대본을 인스타 캐러셀로 자동 변환하기
            </h4>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
              황금 글자량 분할
            </span>
          </div>
          <span className="text-xs text-slate-500">
            대본을 붙여넣으면 가독성 최적 문장 단위로 자동 쪼개어 슬라이드에 입혀줍니다
          </span>
        </div>

        <div className="relative">
          <textarea
            value={scriptInput}
            onChange={(e) => setScriptInput(e.target.value)}
            rows={2}
            placeholder="쇼츠 대본 전체를 여기에 붙여넣으세요. (예: 100번 넘게 오디션에 떨어졌던 무명 배우가...)"
            className="w-full bg-white rounded-2xl p-3 text-xs sm:text-sm text-slate-800 border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner pr-28 sm:pr-40"
          />
          <button
            onClick={handleConvertScriptToCarousel}
            disabled={!scriptInput.trim()}
            className="absolute bottom-3 right-3 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-700 hover:to-rose-700 text-white font-black text-xs shadow-md flex items-center gap-1.5 transition disabled:opacity-40 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>✨ 자동 분할 & 입히기</span>
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
              <p className="text-xs text-slate-500">폰트, 컬러, 글자 크기, 사진이 실시간 반영됩니다</p>
            </div>

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

          {/* Photo & Keyword Search Bar for Current Slide (Matching Shorts Studio) */}
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

            {/* Visual Guide line matching screenshot */}
            {currentSlide?.visualGuide && (
              <p className="text-xs text-slate-500 italic font-medium px-1">
                연출 가이드: {currentSlide.visualGuide}
              </p>
            )}
          </div>

          {/* Visual Canvas Card with Photo Layer & Selected Font/Color */}
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
                textAlign: textAlign
              }}
            >
              {/* Dark Overlay when photo is active */}
              {currentSlide?.imageUrl && (
                <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/65 to-black/85 z-0" />
              )}

              {/* Top Header Badge */}
              <div className={`relative z-10 flex ${textAlign === 'center' ? 'justify-center' : 'justify-start'}`}>
                <span 
                  className="px-3.5 py-1 rounded-full text-xs font-black shadow-md tracking-wide"
                  style={{ 
                    backgroundColor: selectedTheme.badgeBg, 
                    color: selectedTheme.badgeText 
                  }}
                >
                  {currentSlide?.badgeText || (currentSlide?.type === 'cover' ? '🔥 떡상 카드뉴스' : `POINT 0${currentSlide?.slideNumber || 1}`)}
                </span>
              </div>

              {/* Main Content Area */}
              <div className="relative z-10 my-auto py-4 space-y-4">
                <h2 
                  className={`font-black tracking-tight leading-snug drop-shadow-lg whitespace-pre-line ${titleClass}`}
                  style={{ color: selectedTextColor }}
                >
                  {currentSlide?.mainHook || '메인 헤드라인을 입력하세요'}
                </h2>

                {/* SubDetail with capsule / box styling (Request 5) */}
                <div className={`transition-all ${
                  (currentSlide?.subDetailBgStyle || subDetailBgStyle) === 'capsule'
                    ? 'px-4 py-2.5 rounded-2xl bg-black/60 backdrop-blur-xs max-w-fit mx-auto'
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
                    {currentSlide?.subDetail || '보조 상세 설명을 작성해주세요.'}
                  </p>
                </div>
              </div>

              {/* Bottom Footer Page Count (Clean, No Watermark) */}
              <div className="relative z-10 flex items-center justify-between text-xs pt-4 border-t border-white/10 font-bold text-slate-300">
                <span>{topic}</span>
                <span className="px-2 py-0.5 rounded-full bg-black/40 text-[11px]">
                  {(currentSlideIndex + 1)} / {slides.length}
                </span>
              </div>
            </div>
          </div>

          {/* Slide Navigation & Canvas Export Bar */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                disabled={currentSlideIndex === 0}
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 transition cursor-pointer"
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
              >
                <ChevronRight className="w-5 h-5 text-slate-700" />
              </button>
            </div>

            <button
              onClick={drawAndDownloadSlide}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>현재 슬라이드 HD 다운로드</span>
            </button>
          </div>
        </div>

        {/* Right: Slide Content Inputs & Typography Customizer */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. Current Slide Text Editor */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-rose-600" />
                <h4 className="font-black text-slate-900 text-sm">
                  {currentSlideIndex + 1}번 카드 내용 직접 입력
                </h4>
              </div>
              <span className="text-xs font-bold text-slate-500">
                실시간 카드 반영
              </span>
            </div>

            {/* Badge text input */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">상단 배지 문구</label>
              <input
                type="text"
                value={currentSlide?.badgeText || ''}
                onChange={(e) => handleUpdateCurrentSlide('badgeText', e.target.value)}
                placeholder="예: ⚠️ 긴급 분석, POINT 01"
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Main Headline Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <label className="text-[11px] font-bold text-slate-800">메인 헤드라인 (큰 글씨)</label>
                  <button
                    type="button"
                    onClick={handleQuickCompressHeadline}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-black border border-rose-200 transition cursor-pointer active:scale-95 shadow-2xs"
                    title="인스타 트렌드에 맞춰 15자 내외 펀치라인으로 자동 축약합니다"
                  >
                    <Sparkles className="w-3 h-3 text-rose-600" />
                    <span>⚡ 15자 펀치라인 축약</span>
                  </button>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  mainHookLen <= 18
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : mainHookLen <= 28
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {mainHookLen}자 {
                    mainHookLen <= 18
                      ? '🟢 인스타 최적 (18자 이내)'
                      : mainHookLen <= 28
                      ? '🟠 다소 긺'
                      : '🔴 글씨 과다 (축약 권장)'
                  }
                </span>
              </div>
              <textarea
                value={currentSlide?.mainHook || ''}
                onChange={(e) => handleUpdateCurrentSlide('mainHook', e.target.value)}
                rows={2}
                placeholder="한눈에 꽂히는 핵심 문장을 적어주세요 (엔터로 줄바꿈 가능)"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Sub Detail Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-700">상세 보조 설명 (작은 글씨)</label>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  subDetailLen <= 60 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {subDetailLen}자 {subDetailLen <= 60 ? '🟢 읽기 편함 (60자 이내)' : '🟠 분할 추천'}
                </span>
              </div>
              <textarea
                value={currentSlide?.subDetail || ''}
                onChange={(e) => handleUpdateCurrentSlide('subDetail', e.target.value)}
                rows={3}
                placeholder="보조 설명이나 디테일한 내용을 적어주세요."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
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

          {/* 2. Main Headline Typography & Color Customizer */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-sm font-black text-slate-900">
              <TypeIcon className="w-4 h-4 text-indigo-600" />
              <span>2. 메인 헤드라인 스타일 (서체 • 크기 • 정렬 • 컬러)</span>
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

            {/* Font Size & Align */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5">헤드라인 크기</label>
                <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
                  {FONT_SIZE_PRESETS.map((sz) => (
                    <button
                      key={sz.id}
                      onClick={() => setSizeMode(sz.id as any)}
                      className={`flex-1 py-1 text-center rounded-lg text-xs font-bold transition cursor-pointer ${
                        fontSizeMode === sz.id ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600'
                      }`}
                    >
                      {sz.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5">정렬</label>
                <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setTextAlign('center')}
                    className={`flex-1 py-1 flex items-center justify-center rounded-lg text-xs font-bold transition cursor-pointer ${
                      textAlign === 'center' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    <AlignCenter className="w-3.5 h-3.5 mr-1" />
                    <span>중앙</span>
                  </button>
                  <button
                    onClick={() => setTextAlign('left')}
                    className={`flex-1 py-1 flex items-center justify-center rounded-lg text-xs font-bold transition cursor-pointer ${
                      textAlign === 'left' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    <AlignLeft className="w-3.5 h-3.5 mr-1" />
                    <span>좌측</span>
                  </button>
                </div>
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
                      selectedTextColor === c.hex ? 'border-indigo-600 ring-2 ring-indigo-500/30' : 'border-slate-200'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: c.hex }} />
                    <span className="text-[11px] text-slate-700">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. SubDetail Customizer (폰트 • 글자 크기 • 컬러 • 배경 박스) */}
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
                      ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/50 text-indigo-950'
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
                <span>5. 전체 슬라이드 순서 ({slides.length}장)</span>
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

          {/* 5. 2026 Instagram Viral Caption & Algorithm Cheatsheet */}
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
