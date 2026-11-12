import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Layers, 
  Image as ImageIcon, 
  FileText, 
  Hash, 
  Download, 
  Copy, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Flame, 
  Share2, 
  TrendingUp, 
  Instagram, 
  Youtube, 
  Eye, 
  Palette, 
  RefreshCw,
  Lightbulb,
  Bookmark,
  CheckCircle2,
  SlidersHorizontal,
  Upload,
  Trash2,
  Link as LinkIcon,
  Search,
  ExternalLink,
  ImagePlus,
  Type as TypeIcon,
  AlignLeft,
  AlignCenter,
  Wand2,
  Scissors,
  X,
  Send,
  MessageSquare,
  Clock,
  Mic,
  Zap,
  HelpCircle,
  ThumbsUp,
  Edit3
} from 'lucide-react';
import { ViralAssetPackage, CarouselSlide, ThumbnailConcept } from '../types';

interface ViralStudioProps {
  initialTopic?: string;
  initialCategory?: string;
  initialScript?: string;
  currentProject?: any;
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

// Helper to load image for Canvas drawing
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = src;
  });
};

// Helper for aspect-fill cover in canvas
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

export const ViralStudio: React.FC<ViralStudioProps> = ({ 
  initialTopic = '손흥민', 
  initialCategory = 'sports',
  initialScript = '',
  onBackToStudio
}) => {
  const [topic, setTopic] = useState(initialTopic);
  const [targetAudience, setTargetAudience] = useState('2040 남녀 직장인');
  const [tone, setTone] = useState('충격과 반전의 흥미진진한 톤');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<'thumbnail' | 'posts' | 'triggers'>('thumbnail');
  const [postPlatform, setPostPlatform] = useState<'instagram' | 'youtube' | 'naver'>('instagram');

  // Thumbnail state
  const [selectedThumbIndex, setSelectedThumbIndex] = useState(0);
  const [thumbAspect, setThumbAspect] = useState<'16:9' | '9:16'>('16:9');

  // URL modal input state
  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');

  // Hidden file input refs
  const thumbFileInputRef = useRef<HTMLInputElement | null>(null);

  // Viral asset package data
  const [assets, setAssets] = useState<ViralAssetPackage | null>(null);

  // Fetch or generate assets
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
      setAssets(data);
      setSelectedThumbIndex(0);
    } catch (err) {
      console.error('Viral assets generation failed:', err);
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

  // Image Upload Handlers for Thumbnail
  const handleThumbFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !assets) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const updatedThumbs = [...assets.thumbnails];
      updatedThumbs[selectedThumbIndex] = {
        ...updatedThumbs[selectedThumbIndex],
        imageUrl: dataUrl
      };
      setAssets({
        ...assets,
        thumbnails: updatedThumbs
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleThumbImageRemove = () => {
    if (!assets) return;
    const updatedThumbs = [...assets.thumbnails];
    updatedThumbs[selectedThumbIndex] = {
      ...updatedThumbs[selectedThumbIndex],
      imageUrl: undefined
    };
    setAssets({
      ...assets,
      thumbnails: updatedThumbs
    });
  };

  // Submit URL modal image
  const handleApplyUrlImage = () => {
    if (!customUrlInput.trim() || !assets) return;
    const updatedThumbs = [...assets.thumbnails];
    updatedThumbs[selectedThumbIndex] = {
      ...updatedThumbs[selectedThumbIndex],
      imageUrl: customUrlInput.trim()
    };
    setAssets({
      ...assets,
      thumbnails: updatedThumbs
    });
    setUrlModalOpen(false);
    setCustomUrlInput('');
  };

  // Directly edit thumbnail texts (badge, main, sub) to fix typos or customize copy
  const handleUpdateCurrentThumb = (field: 'badgeText' | 'mainText' | 'subText', value: string) => {
    if (!assets || !assets.thumbnails[selectedThumbIndex]) return;
    const updatedThumbs = [...assets.thumbnails];
    updatedThumbs[selectedThumbIndex] = {
      ...updatedThumbs[selectedThumbIndex],
      [field]: value
    };
    setAssets({
      ...assets,
      thumbnails: updatedThumbs
    });
  };

  // Canvas drawing helper for Thumbnail
  const drawAndDownloadThumbnail = async () => {
    if (!assets || !assets.thumbnails[selectedThumbIndex]) return;
    const thumb = assets.thumbnails[selectedThumbIndex];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 1280;
    let height = 720;
    if (thumbAspect === '9:16') {
      width = 1080;
      height = 1920;
    }

    canvas.width = width;
    canvas.height = height;

    if (thumb.imageUrl) {
      try {
        const img = await loadImage(thumb.imageUrl);
        drawImageCover(ctx, img, 0, 0, width, height);

        // High-contrast side/bottom gradient for text legibility
        const overlay = ctx.createLinearGradient(0, 0, width, 0);
        overlay.addColorStop(0, 'rgba(0, 0, 0, 0.92)');
        overlay.addColorStop(0.55, 'rgba(0, 0, 0, 0.65)');
        overlay.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
        ctx.fillStyle = overlay;
        ctx.fillRect(0, 0, width, height);
      } catch (e) {
        console.warn('Canvas thumb image error:', e);
      }
    } else {
      // Dynamic gradient
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, thumb.colorScheme.bg || '#0f172a');
      grad.addColorStop(1, '#000000');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }

    // Badge
    ctx.fillStyle = thumb.colorScheme.accent || '#ef4444';
    ctx.beginPath();
    ctx.roundRect(60, 60, 220, 60, 16);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(thumb.badgeText, 170, 102);

    // Main Text (HUGE CTR FONT)
    ctx.fillStyle = thumb.colorScheme.text || '#ffffff';
    ctx.font = '900 84px sans-serif';
    ctx.textAlign = 'left';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
    ctx.shadowBlur = 24;
    ctx.fillText(thumb.mainText, 60, height * 0.52);

    // Sub Text
    ctx.fillStyle = thumb.colorScheme.accent || '#facc15';
    ctx.font = '900 48px sans-serif';
    ctx.fillText(thumb.subText, 60, height * 0.65);

    // Download trigger (clean thumbnail with zero watermark)
    const link = document.createElement('a');
    link.download = `thumbnail_${selectedThumbIndex + 1}_${topic}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const currentThumb = assets?.thumbnails[selectedThumbIndex];

  return (
    <div className="w-full min-w-0 max-w-full py-2 sm:py-6 space-y-5 sm:space-y-8 animate-fade-in text-slate-800">
      {/* Hidden File Input for Upload */}
      <input
        ref={thumbFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleThumbFileUpload}
        className="hidden"
      />

      {/* URL Image Input Modal */}
      {urlModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-indigo-600" />
                <span>썸네일 이미지 URL 입력</span>
              </h4>
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
              웹 상의 사진 주소(https://...으로 끝나는 이미지 URL)를 붙여넣어 주세요.
            </p>
            <input
              type="url"
              value={customUrlInput}
              onChange={(e) => setCustomUrlInput(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setUrlModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                취소
              </button>
              <button
                onClick={handleApplyUrlImage}
                disabled={!customUrlInput.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                적용하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Banner & Controller */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-8 text-white shadow-2xl relative overflow-hidden border border-indigo-500/20 w-full min-w-0 max-w-full">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
          <div className="space-y-2 min-w-0 flex-1">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>유튜브 썸네일 • 3대 플랫폼 바이럴 카피라이터</span>
            </div>
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-black tracking-tight text-white flex flex-wrap items-center gap-2 break-words">
              <span className="break-keep">🎯 썸네일 & 바이럴 카피 스튜디오</span>
              <span className="text-[11px] sm:text-xs px-2.5 py-0.5 sm:py-1 rounded-lg bg-indigo-500/40 text-indigo-200 border border-indigo-400/30 font-semibold shrink-0">
                CTR 15%+ 극대화 & 스마트 포스팅
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl break-words leading-relaxed">
              0.5초 만에 클릭을 부르는 <strong>고화질 떡상 썸네일(16:9 / 9:16)</strong> 제작부터 인스타그램·유튜브·네이버 블로그 최적화 본문 카피와 해시태그를 원클릭으로 추출합니다.
            </p>
          </div>

          {onBackToStudio && (
            <button
              onClick={onBackToStudio}
              className="self-start lg:self-center px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition flex items-center gap-2 cursor-pointer shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
              쇼츠 스튜디오로 복귀
            </button>
          )}
        </div>

        {/* Input Form Bar */}
        <div className="mt-5 pt-5 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">인물 / 핵심 주제</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="예: 손흥민, 유재석, 일론 머스크"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">타겟 독자층</label>
            <select
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
            >
              <option value="2040 남녀 직장인">2040 남녀 직장인 (성장/인사이트)</option>
              <option value="1020 숏폼 Z세대">1020 숏폼 Z세대 (도파민/밈/반전)</option>
              <option value="4060 감동/휴먼">4060 감동/휴먼 (인생역전/눈물)</option>
              <option value="재테크/자기계발 독자">재테크/자기계발 독자 (실전 노하우)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">콘텐츠 어조</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
            >
              <option value="충격과 반전의 흥미진진한 톤">충격과 반전의 호기심 톤</option>
              <option value="가슴 뭉클한 인간 승리 톤">가슴 뭉클한 인간 승리 톤</option>
              <option value="팩트 중심의 날카로운 분석 톤">팩트 중심의 날카로운 분석 톤</option>
              <option value="트렌디하고 위트 있는 톤">트렌디하고 위트 있는 톤</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => handleGenerate(topic)}
              disabled={isLoading || !topic.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-rose-600 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-black text-sm shadow-lg shadow-indigo-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>떡상 에셋 분석 중...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>썸네일 & 카피 생성</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main 3 Feature Tabs */}
      <div className="w-full min-w-0 max-w-full overflow-x-auto scrollbar-none pb-2 border-b border-slate-200 touch-pan-x overscroll-x-contain">
        <div className="flex items-center space-x-2 w-max min-w-full px-0.5">
          <button
            onClick={() => setActiveTab('thumbnail')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === 'thumbnail'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>1. 떡상 썸네일 제작기 (인물 사진 & CTR 15%+)</span>
          </button>

          <button
            onClick={() => setActiveTab('posts')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === 'posts'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>2. 3대 플랫폼 바이럴 카피라이터 (2026 알고리즘 최적화)</span>
          </button>

          <button
            onClick={() => setActiveTab('triggers')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === 'triggers'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>3. 🚀 알고리즘 치트키 (공유·저장 & 댓글 폭발)</span>
            <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950">
              2026 트렌드
            </span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: VIRAL THUMBNAIL CREATOR WITH PHOTO INSERTION */}

      {/* ------------------------------------------------------------- */}
      {activeTab === 'thumbnail' && assets && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Thumbnail Preview & Canvas */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xl space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-slate-900 text-base sm:text-lg">유튜브 • 쇼츠 떡상 썸네일 엔진</h3>
                <p className="text-xs text-slate-500">인물 사진을 넣고 0.5초 만에 클릭을 유도하는 CTR 15%+ 썸네일을 제작하세요</p>
              </div>

              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setThumbAspect('16:9')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${thumbAspect === '16:9' ? 'bg-white text-amber-600 shadow-xs' : 'text-slate-600'}`}
                >
                  16:9 (유튜브 롱폼)
                </button>
                <button
                  onClick={() => setThumbAspect('9:16')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${thumbAspect === '9:16' ? 'bg-white text-amber-600 shadow-xs' : 'text-slate-600'}`}
                >
                  9:16 (쇼츠/릴스)
                </button>
              </div>
            </div>

            {/* Thumbnail Photo Control Bar */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center space-x-1.5 font-bold text-slate-700">
                <ImagePlus className="w-4 h-4 text-amber-600" />
                <span>썸네일 인물/배경 사진:</span>
                {currentThumb?.imageUrl ? (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black">
                    사진 적용됨
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-600 text-[10px]">
                    그래픽 모드
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => thumbFileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>인물 사진 업로드</span>
                </button>

                <button
                  onClick={() => {
                    setCustomUrlInput(currentThumb?.imageUrl || '');
                    setUrlModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>URL 입력</span>
                </button>

                <a
                  href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(topic + ' 고화질 인물')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5 text-rose-600" />
                  <span>인물 사진 검색</span>
                </a>

                {currentThumb?.imageUrl && (
                  <button
                    onClick={handleThumbImageRemove}
                    className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 transition cursor-pointer"
                    title="사진 제거"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Thumbnail Canvas Frame */}
            {currentThumb && (
              <div className="flex justify-center">
                <div 
                  className={`w-full max-w-lg rounded-2xl p-6 relative flex flex-col justify-between overflow-hidden shadow-2xl border-4 transition-all ${
                    thumbAspect === '16:9' ? 'aspect-16/9' : 'aspect-9/16 max-w-xs'
                  }`}
                  style={{
                    backgroundColor: currentThumb.colorScheme.bg || '#0f172a',
                    backgroundImage: currentThumb.imageUrl ? `url("${currentThumb.imageUrl}")` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderColor: currentThumb.colorScheme.accent || '#ef4444'
                  }}
                >
                  {/* Dark Vignette Overlay for Photo Legibility */}
                  {currentThumb.imageUrl && (
                    <div className="absolute inset-0 bg-gradient-to-r from-black/92 via-black/65 to-transparent pointer-events-none" />
                  )}

                  {/* Badge */}
                  <div className="relative z-10 self-start">
                    <span 
                      className="px-3 py-1 rounded-lg text-xs font-black tracking-wider text-white shadow-md uppercase"
                      style={{ backgroundColor: currentThumb.colorScheme.accent }}
                    >
                      {currentThumb.badgeText}
                    </span>
                  </div>

                  {/* Main & Sub Text */}
                  <div className="relative z-10 my-auto space-y-2">
                    <h2 
                      className="text-3xl sm:text-4xl font-black tracking-tight leading-tight drop-shadow-lg"
                      style={{ color: currentThumb.colorScheme.text }}
                    >
                      {currentThumb.mainText}
                    </h2>
                    <p 
                      className="text-lg sm:text-xl font-black drop-shadow-md"
                      style={{ color: currentThumb.colorScheme.accent }}
                    >
                      {currentThumb.subText}
                    </p>
                  </div>

                  {/* Visual Guide Footnote */}
                  <div className="relative z-10 bg-black/60 backdrop-blur-md -mx-6 -mb-6 p-3 text-[11px] text-white/90 border-t border-white/10 flex items-center justify-between">
                    <span>💡 비주얼 연출: {currentThumb.visualComposition}</span>
                    <Eye className="w-4 h-4 text-amber-400 shrink-0 ml-2" />
                  </div>
                </div>
              </div>
            )}

            {/* Direct Thumbnail Text Editor Box */}
            {currentThumb && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <div className="flex items-center space-x-1.5 text-xs font-black text-slate-800">
                    <Edit3 className="w-4 h-4 text-amber-600" />
                    <span>썸네일 문구 직접 수정 (오타·카피 맞춤 편집)</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    실시간 프리뷰 & PNG 다운로드 즉시 반영
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      상단 뱃지 문구
                    </label>
                    <input
                      type="text"
                      value={currentThumb.badgeText}
                      onChange={(e) => handleUpdateCurrentThumb('badgeText', e.target.value)}
                      placeholder="예: 인간 승리, 충격 실화"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      메인 헤드라인 (대형 볼드)
                    </label>
                    <input
                      type="text"
                      value={currentThumb.mainText}
                      onChange={(e) => handleUpdateCurrentThumb('mainText', e.target.value)}
                      placeholder="예: 눈물의 10년"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      서브 카피 문구
                    </label>
                    <input
                      type="text"
                      value={currentThumb.subText}
                      onChange={(e) => handleUpdateCurrentThumb('subText', e.target.value)}
                      placeholder="예: 안성재 셰프가 끝내 버텨낸 이유"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-amber-700 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <div className="text-xs text-slate-500 font-medium">
                🎯 CTR 떡상 전략: <strong>{currentThumb?.ctrRationale}</strong>
              </div>
              <button
                onClick={drawAndDownloadThumbnail}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>고화질 썸네일 PNG 다운로드 (사진 합성)</span>
              </button>
            </div>
          </div>

          {/* Right: A/B Concept Options */}
          <div className="lg:col-span-5 space-y-4">
            <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>A/B 테스트용 3종 떡상 컨셉 선택</span>
            </h4>

            {assets.thumbnails.map((th, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedThumbIndex(idx)}
                className={`p-5 rounded-2xl border transition cursor-pointer space-y-3 text-left ${
                  selectedThumbIndex === idx
                    ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20 shadow-md'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black px-2.5 py-1 rounded-md bg-amber-100 text-amber-900">
                      컨셉 {idx + 1}. {th.conceptName}
                    </span>
                    {th.imageUrl && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800">
                        📷 사진 포함
                      </span>
                    )}
                  </div>
                  {selectedThumbIndex === idx && (
                    <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> 선택됨
                    </span>
                  )}
                </div>

                <div>
                  <div className="text-base font-black text-slate-900">{th.mainText}</div>
                  <div className="text-xs font-bold text-amber-700 mt-0.5">{th.subText}</div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed bg-white/70 p-2.5 rounded-xl border border-slate-100">
                  {th.ctrRationale}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: MULTI-PLATFORM POSTINGS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'posts' && assets && (
        <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-xl space-y-6">
          {/* Platform Selector Buttons */}
          <div className="w-full min-w-0 max-w-full overflow-x-auto scrollbar-none pb-4 border-b border-slate-200 touch-pan-x overscroll-x-contain">
            <div className="flex items-center space-x-2 w-max min-w-full px-0.5">
              <button
                onClick={() => setPostPlatform('instagram')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer shrink-0 whitespace-nowrap ${
                  postPlatform === 'instagram'
                    ? 'bg-rose-50 text-rose-700 border-2 border-rose-500 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Instagram className="w-4 h-4 text-rose-600" />
                <span>인스타그램 캡션 (피드/릴스)</span>
              </button>

              <button
                onClick={() => setPostPlatform('youtube')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer shrink-0 whitespace-nowrap ${
                  postPlatform === 'youtube'
                    ? 'bg-red-50 text-red-700 border-2 border-red-500 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Youtube className="w-4 h-4 text-red-600" />
                <span>유튜브 (제목 후보 & 설명란)</span>
              </button>

              <button
                onClick={() => setPostPlatform('naver')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer shrink-0 whitespace-nowrap ${
                  postPlatform === 'naver'
                    ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-500 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>네이버 블로그 (스마트에디터 상위노출)</span>
              </button>
            </div>
          </div>

          {/* Sub-view: Instagram Post (2026 Algorithm Optimized) */}
          {postPlatform === 'instagram' && (
            <div className="space-y-6 max-w-3xl">
              {/* Algorithm Insight Alert */}
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-3">
                <Flame className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-black block text-rose-950 text-xs sm:text-sm">
                    ⚡ 2026 인스타그램 릴스·피드 알고리즘 맞춤 설계
                  </span>
                  <p className="mt-0.5 text-rose-800 leading-relaxed text-[11px] sm:text-xs">
                    인스타는 125자 이후 <code>...더 보기</code>로 잘립니다. 첫 1~2줄에서 클릭을 유도하고, 알고리즘 1위 노출 지표인 <strong>DM 공유</strong>와 <strong>저장(Save)</strong>을 트리거하도록 구성되었습니다.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-slate-900 text-base">인스타그램 떡상 캡션 팩</h4>
                  <p className="text-xs text-slate-500">더보기 클릭 ➔ 3초 불릿 요약 ➔ DM 공유 & 저장 유도 클로징</p>
                </div>
                <button
                  onClick={() => {
                    const cleanTagsStr = (assets.posts.instagram.cleanSemanticTags || assets.viralTriggers?.shareAndSaveKit.cleanTags || [topic, '트렌드', '인사이트']).map(t => `#${t.replace('#','')}`).join(' ');
                    const bulletsStr = assets.posts.instagram.bulletSummary?.map(b => `✔️ ${b}`).join('\n') || '';
                    const full = `${assets.posts.instagram.hookFirstLine}\n\n${bulletsStr ? bulletsStr + '\n\n' : ''}${assets.posts.instagram.bodyText}\n\n${assets.posts.instagram.saveShareTrigger}\n\n${cleanTagsStr}`;
                    copyToClipboard(full, 'insta_full');
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  {copiedKey === 'insta_full' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>전체 캡션 원클릭 복사</span>
                </button>
              </div>

              {/* Hook First Line */}
              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-rose-700 tracking-wider flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-rose-600" />
                    <span>1단계: 125자 스톱라인 (더보기 클릭 유도)</span>
                  </span>
                  <button
                    onClick={() => copyToClipboard(assets.posts.instagram.hookFirstLine, 'insta_hook')}
                    className="text-xs font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'insta_hook' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>복사</span>
                  </button>
                </div>
                <p className="text-sm font-bold text-slate-900 leading-snug">{assets.posts.instagram.hookFirstLine}</p>
              </div>

              {/* 3-sec Bullet Summary if present */}
              {assets.posts.instagram.bulletSummary && assets.posts.instagram.bulletSummary.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
                  <span className="text-[11px] font-black uppercase text-amber-800 tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>2단계: 3초 가독성 불릿포인트 요약 (모바일 최적화)</span>
                  </span>
                  <div className="space-y-1.5">
                    {assets.posts.instagram.bulletSummary.map((b, i) => (
                      <div key={i} className="text-xs font-medium text-amber-950 flex items-start gap-1.5">
                        <span className="text-amber-600 font-bold shrink-0">✔️</span>
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Body Text */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-500 uppercase">3단계: 상세 스토리텔링 본문</span>
                  <button
                    onClick={() => copyToClipboard(assets.posts.instagram.bodyText, 'insta_body')}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'insta_body' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>복사</span>
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed font-normal bg-white p-4 rounded-xl border border-slate-200">
                  {assets.posts.instagram.bodyText}
                </p>
              </div>

              {/* CTA & Save/Share Trigger */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-indigo-700 uppercase flex items-center gap-1">
                    <Bookmark className="w-3.5 h-3.5 text-indigo-600" />
                    <span>4단계: 알고리즘 1위 지표 [DM 공유 & 저장] 클로징 카피</span>
                  </span>
                  <button
                    onClick={() => copyToClipboard(assets.posts.instagram.saveShareTrigger, 'insta_cta')}
                    className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'insta_cta' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>복사</span>
                  </button>
                </div>
                <p className="text-xs font-bold text-indigo-950 whitespace-pre-line leading-relaxed">
                  {assets.posts.instagram.saveShareTrigger}
                </p>

                {/* Clean Semantic Tags */}
                <div className="pt-2 border-t border-indigo-100 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold text-indigo-500 mr-1">🔍 검색 색인용 클린 태그 (단 3~5개):</span>
                  {(assets.posts.instagram.cleanSemanticTags || assets.viralTriggers?.shareAndSaveKit.cleanTags || [topic, '트렌드', '인사이트']).map((tag, i) => (
                    <span key={i} className="text-xs font-bold px-2 py-0.5 rounded-md bg-white text-indigo-700 border border-indigo-200 shadow-2xs">
                      #{tag.replace('#','')}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sub-view: YouTube Post (2026 Algorithm Optimized) */}
          {postPlatform === 'youtube' && (
            <div className="space-y-6 max-w-3xl">
              {/* Algorithm Insight Alert */}
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-start gap-3">
                <Youtube className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-black block text-red-950 text-xs sm:text-sm">
                    ⚡ 2026 유튜브 알고리즘: CTR 15%+ 제목 • 구글 키모먼트 챕터 • 댓글 폭발
                  </span>
                  <p className="mt-0.5 text-red-800 leading-relaxed text-[11px] sm:text-xs">
                    유튜브는 태그보다 <strong>첫 30자 제목의 클릭률(CTR)</strong>, <strong>타임스탬프 챕터 마커(구글 검색 Key Moments 연동)</strong>, 그리고 <strong>고정 댓글의 토론 활성도</strong>로 추천량을 결정합니다.
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-black text-slate-900 text-base">유튜브 쇼츠 & 롱폼 알고리즘 풀패키지</h4>
                <p className="text-xs text-slate-500">호기심 갭 제목 3종 + 검색 미리보기 2줄 + 자동 챕터 타임라인</p>
              </div>

              {/* 3 Title Options */}
              <div className="space-y-2.5">
                <span className="text-xs font-black text-slate-700">🎯 알고리즘 추천 제목 후보 3종 (클릭률 1위 세팅)</span>
                {assets.posts.youtube.titleCandidates.map((title, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between hover:bg-slate-100 transition">
                    <span className="text-xs sm:text-sm font-bold text-slate-900">{title}</span>
                    <button
                      onClick={() => copyToClipboard(title, `yt_title_${idx}`)}
                      className="p-1.5 rounded-lg hover:bg-white text-slate-600 transition cursor-pointer"
                      title="제목 복사"
                    >
                      {copiedKey === `yt_title_${idx}` ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
              </div>

              {/* First 2 Lines SEO */}
              {assets.posts.youtube.firstTwoLinesSeo && (
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase text-amber-800 flex items-center gap-1">
                      <Search className="w-3.5 h-3.5 text-amber-600" />
                      <span>검색 결과 미리보기에 노출되는 핵심 첫 2줄 (자연어 SEO)</span>
                    </span>
                    <button
                      onClick={() => copyToClipboard(assets.posts.youtube.firstTwoLinesSeo!, 'yt_two_lines')}
                      className="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'yt_two_lines' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>복사</span>
                    </button>
                  </div>
                  <p className="text-xs font-bold text-amber-950 leading-relaxed">{assets.posts.youtube.firstTwoLinesSeo}</p>
                </div>
              )}

              {/* Timestamps Chapter Markers */}
              {assets.posts.youtube.timestamps && assets.posts.youtube.timestamps.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-700 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      <span>구글 검색 'Key Moments' 연동용 챕터 타임스탬프</span>
                    </span>
                    <button
                      onClick={() => {
                        const timeStr = assets.posts.youtube.timestamps!.map(t => `${t.time} ${t.label}`).join('\n');
                        copyToClipboard(timeStr, 'yt_times');
                      }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'yt_times' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>타임코드 전체 복사</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {assets.posts.youtube.timestamps.map((t, i) => (
                      <div key={i} className="p-2 rounded-xl bg-white border border-slate-200 text-xs flex items-center justify-between font-mono">
                        <span className="font-bold text-indigo-600">{t.time}</span>
                        <span className="font-medium text-slate-800 truncate ml-2">{t.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-700">📝 유튜브 설명란 전체 템플릿</span>
                  <button
                    onClick={() => copyToClipboard(assets.posts.youtube.descriptionText, 'yt_desc')}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'yt_desc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>설명란 복사</span>
                  </button>
                </div>
                <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed font-mono bg-white p-3.5 rounded-xl border border-slate-200">
                  {assets.posts.youtube.descriptionText}
                </p>
              </div>

              {/* Pinned Comment */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-900 flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                    <span>💬 시청자 댓글 폭발 난상토론 고정 댓글</span>
                  </span>
                  <button
                    onClick={() => copyToClipboard(assets.posts.youtube.pinnedComment, 'yt_comment')}
                    className="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'yt_comment' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>댓글 복사</span>
                  </button>
                </div>
                <p className="text-xs font-medium text-amber-950 leading-relaxed">{assets.posts.youtube.pinnedComment}</p>
              </div>
            </div>
          )}

          {/* Sub-view: Naver Post (2026 DIA+ Algorithm Optimized) */}
          {postPlatform === 'naver' && (
            <div className="space-y-6 max-w-3xl">
              {/* Algorithm Insight Alert */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-3">
                <FileText className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-black block text-emerald-950 text-xs sm:text-sm">
                    ⚡ 2026 네이버 DIA+ & 스마트블록 최적화 구조
                  </span>
                  <p className="mt-0.5 text-emerald-800 leading-relaxed text-[11px] sm:text-xs">
                    키워드 도배는 어뷰징으로 저품질 처리됩니다. 독자의 검색 의도에 맞춘 <strong>Q&A형 제목</strong>과 <strong>도입부 3초 결론 요약</strong>, 소제목 3단 팩트체크로 <strong>체류시간 4분 이상</strong>을 확보하도록 설계되었습니다.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-slate-900 text-base">네이버 블로그 상위노출 스마트에디터 원고</h4>
                  <p className="text-xs text-slate-500">체류시간 4분 보장 + 스마트블록 Q&A 검색 의도 완벽 매칭</p>
                </div>
                <button
                  onClick={() => {
                    const full = `${assets.posts.naver.blogTitleCandidates[0]}\n\n${assets.posts.naver.intro}\n\n` +
                      assets.posts.naver.sections.map(s => `[${s.subTitle}]\n${s.paragraph}`).join('\n\n') +
                      `\n\n${assets.posts.naver.conclusion}\n\n연관 키워드: ${assets.posts.naver.smartBlockKeywords.join(', ')}`;
                    copyToClipboard(full, 'naver_full');
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  {copiedKey === 'naver_full' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>원고 전체 복사</span>
                </button>
              </div>

              {/* Title Options */}
              <div className="space-y-2">
                <span className="text-xs font-black text-emerald-800">📌 스마트블록 추천 블로그 제목 3종 (검색 유입 극대화)</span>
                {assets.posts.naver.blogTitleCandidates.map((bt, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200 text-xs font-bold text-emerald-950 flex items-center justify-between">
                    <span>{bt}</span>
                    <button
                      onClick={() => copyToClipboard(bt, `naver_t_${idx}`)}
                      className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
                    >
                      {copiedKey === `naver_t_${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
              </div>

              {/* Dwell Time Secret Tip */}
              {assets.posts.naver.dwellTimeSecret && (
                <div className="p-3.5 rounded-xl bg-slate-900 text-white text-xs font-medium flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-[10px] shrink-0">
                    체류시간 4분 TIP
                  </span>
                  <span>{assets.posts.naver.dwellTimeSecret}</span>
                </div>
              )}

              {/* Intro */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase">도입부 (3초 결론 요약 & 프롤로그)</span>
                <p className="text-xs text-slate-800 whitespace-pre-line leading-relaxed">{assets.posts.naver.intro}</p>
              </div>

              {/* Sections */}
              <div className="space-y-3">
                {assets.posts.naver.sections.map((sec, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                    <h5 className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-600" />
                      {sec.subTitle}
                    </h5>
                    <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed font-normal">{sec.paragraph}</p>
                  </div>
                ))}
              </div>

              {/* Conclusion */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase">에필로그 & 이웃추가 유도</span>
                <p className="text-xs text-slate-800 whitespace-pre-line leading-relaxed mt-1">{assets.posts.naver.conclusion}</p>
              </div>

              {/* SmartBlock Keywords */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                <span className="text-[11px] font-black text-emerald-800 uppercase">🏷️ 스마트블록 연관 검색 키워드 5선</span>
                <div className="flex flex-wrap gap-1.5">
                  {assets.posts.naver.smartBlockKeywords.map((kw, i) => (
                    <span key={i} className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white text-emerald-800 border border-emerald-300 shadow-2xs">
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: VIRAL ALGORITHM TRIGGERS (REPLACING OBSOLETE HASHTAGS) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'triggers' && assets && (
        <div className="space-y-6">
          {/* Top Educational Reality Banner */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 text-white shadow-xl border border-indigo-500/30 space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-300" />
              <h3 className="font-black text-base sm:text-lg tracking-tight">
                2026 SNS 알고리즘 팩트체크: 왜 해시태그 30개 도배의 시대는 끝났을까요?
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed font-normal">
              인스타그램 CEO 아담 모세리의 공식 발표와 유튜브 가이드에 따르면, <strong>해시태그는 추천 피드 노출(Reach)에 기여하지 않으며, 무분별한 30개 도배는 오히려 스팸 점수</strong>를 받습니다.
              현재 알고리즘이 내 영상을 수십만 명에게 강제로 밀어넣는 핵심 3대 지표는 <strong>① 친구에게 DM 공유(Share)</strong>, <strong>② 나중에 보려고 누르는 저장(Save)</strong>, <strong>③ 댓글 창의 뜨거운 찬반 논쟁(Comments)</strong>, <strong>④ AI가 음성/자막으로 파싱하는 자연어 시맨틱 SEO</strong>입니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Tool 1: DM Share & Save Trigger Kit */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-sm">DM 공유 & 저장 트리거 팩</h4>
                  <p className="text-[11px] text-slate-500">인스타 도달률 1위 결정 지표</p>
                </div>
              </div>

              {/* DM Share Copy */}
              <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-rose-700 flex items-center gap-1">
                    <Share2 className="w-3.5 h-3.5" />
                    <span>친구 소환 DM 공유 멘트</span>
                  </span>
                  <button
                    onClick={() => {
                      const dmText = assets.viralTriggers?.shareAndSaveKit.dmShareCopy || `이거 보고 소름 돋았음... @친구야 너도 ${topic} 좋아하지? 이 비하인드는 진짜 몰랐을걸? 지금 확인해봐!`;
                      copyToClipboard(dmText, 'trig_dm');
                    }}
                    className="text-xs font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'trig_dm' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>복사</span>
                  </button>
                </div>
                <p className="text-xs font-medium text-slate-800 leading-relaxed bg-white p-3 rounded-xl border border-rose-100">
                  {assets.viralTriggers?.shareAndSaveKit.dmShareCopy || `이거 보고 소름 돋았음... @친구야 너도 ${topic} 좋아하지? 이 비하인드는 진짜 몰랐을걸? 지금 확인해봐!`}
                </p>
              </div>

              {/* Save Trigger Copy */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-indigo-700 flex items-center gap-1">
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>저장(Save) 강제 유도 클로징</span>
                  </span>
                  <button
                    onClick={() => {
                      const saveText = assets.viralTriggers?.shareAndSaveKit.saveTriggerCopy || `📌 "나중에 봐야지" 하면 평생 못 봅니다! 지금 바로 [저장] 누르고 영감이 필요할 때 꺼내보세요.`;
                      copyToClipboard(saveText, 'trig_save');
                    }}
                    className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'trig_save' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>복사</span>
                  </button>
                </div>
                <p className="text-xs font-medium text-slate-800 leading-relaxed bg-white p-3 rounded-xl border border-indigo-100">
                  {assets.viralTriggers?.shareAndSaveKit.saveTriggerCopy || `📌 "나중에 봐야지" 하면 평생 못 봅니다! 지금 바로 [저장] 누르고 영감이 필요할 때 꺼내보세요.`}
                </p>
              </div>

              {/* Clean Semantic Tags (3-5 only) */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-black text-slate-600">🏷️ 검색 색인용 클린 태그 (단 3~5개만)</span>
                <div className="flex flex-wrap gap-1.5">
                  {(assets.viralTriggers?.shareAndSaveKit.cleanTags || [topic, `${topic}이슈`, '트렌드인사이트', '인생역전', '숏폼바이럴']).map((t, i) => (
                    <span 
                      key={i}
                      onClick={() => copyToClipboard(`#${t.replace('#','')}`, `clean_t_${i}`)}
                      className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 cursor-pointer transition border border-slate-200"
                    >
                      #{t.replace('#','')}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Tool 2: Comment Baits (Debates / Polls) */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-sm">댓글 폭발 인터랙션 트리거</h4>
                  <p className="text-[11px] text-slate-500">알고리즘 강제 추천 견인 엔진</p>
                </div>
              </div>

              <div className="space-y-3.5">
                {(assets.viralTriggers?.commentBaits || [
                  {
                    baitTitle: '🔥 호불호 갈리는 양자택일 밸런스 게임',
                    debateQuestion: `솔직히 ${topic}의 성공은 '압도적인 재능' vs '처절한 노력', 여러분은 둘 중 무엇이라고 생각하시나요?`,
                    optionA: '1번: 타고난 재능이 80% 이상이다',
                    optionB: '2번: 포기하지 않은 집념과 노력이 전부다',
                    pinnedCommentDraft: `💬 [오늘의 밸런스 게임] 솔직히 ${topic} 님처럼 되려면 1번 재능 vs 2번 꺾이지 않는 마음, 여러분의 선택은 무엇인가요? (댓글로 번호와 이유를 적어주시면 하트 쏴드립니다 ❤️)`
                  }
                ]).map((bait, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-amber-800">{bait.baitTitle}</span>
                      <button
                        onClick={() => copyToClipboard(bait.pinnedCommentDraft, `bait_c_${idx}`)}
                        className="text-[11px] font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === `bait_c_${idx}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>고정댓글 복사</span>
                      </button>
                    </div>

                    <p className="text-xs font-bold text-slate-900 leading-snug">{bait.debateQuestion}</p>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-medium">
                      <div className="p-2 rounded-xl bg-white border border-amber-200 text-slate-800">
                        {bait.optionA}
                      </div>
                      <div className="p-2 rounded-xl bg-white border border-amber-200 text-slate-800">
                        {bait.optionB}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/80 border border-amber-200 text-[11px] text-amber-950 font-mono">
                      {bait.pinnedCommentDraft}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tool 3: Semantic SEO & Voice Keywords */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-sm">AI 자연어 시맨틱 SEO & 챕터</h4>
                  <p className="text-[11px] text-slate-500">음성인식(Whisper) & 구글 키모먼트</p>
                </div>
              </div>

              {/* Voice Spoken Keywords */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-2">
                <span className="text-[11px] font-black text-indigo-800 flex items-center gap-1">
                  <Mic className="w-3.5 h-3.5 text-indigo-600" />
                  <span>영상에서 소리내어 말해야 하는 음성 키워드 5선</span>
                </span>
                <p className="text-[10px] text-slate-500">
                  AI가 영상 음성을 자동 텍스트 변환(ASR)하여 해당 검색어를 찾은 시청자에게 우선 추천합니다.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(assets.viralTriggers?.semanticSeo.voiceKeywords || [topic, '비하인드', '충격 진실', '인생역전', '성공비결']).map((vk, i) => (
                    <span key={i} className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white text-indigo-700 border border-indigo-200">
                      🗣️ {vk}
                    </span>
                  ))}
                </div>
              </div>

              {/* High-Intent Search Queries */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[11px] font-black text-slate-700 flex items-center gap-1">
                  <Search className="w-3.5 h-3.5 text-slate-600" />
                  <span>실제 검색창에 자동완성되는 질문형 쿼리 5선</span>
                </span>
                <div className="space-y-1.5">
                  {(assets.viralTriggers?.semanticSeo.searchQueries || [
                    `${topic} 논란 비하인드`,
                    `${topic} 과거 무명 시절`,
                    `${topic} 최근 근황 나이 프로필`,
                    `${topic} 쇼츠 떡상 이유`,
                    `${topic} 인터뷰 명언`
                  ]).map((sq, i) => (
                    <div 
                      key={i} 
                      onClick={() => copyToClipboard(sq, `query_${i}`)}
                      className="p-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 flex items-center justify-between hover:bg-slate-100 cursor-pointer transition"
                    >
                      <span className="truncate">🔍 {sq}</span>
                      <Copy className="w-3 h-3 text-slate-400 shrink-0 ml-1" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Sample Timestamps */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-700 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-600" />
                    <span>구글 검색 연동 챕터 타임스탬프</span>
                  </span>
                  <button
                    onClick={() => {
                      const times = (assets.viralTriggers?.semanticSeo.sampleTimestamps || [
                        '00:00 오프닝 및 충격적인 첫 장면',
                        '00:15 아무도 몰랐던 무명 시절의 시련',
                        '00:35 운명을 뒤바꾼 결정적 승부수',
                        '00:50 우리가 반드시 배워야 할 인사이트'
                      ]).join('\n');
                      copyToClipboard(times, 'trig_times');
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'trig_times' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>복사</span>
                  </button>
                </div>
                <div className="space-y-1 font-mono text-[11px] text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200">
                  {(assets.viralTriggers?.semanticSeo.sampleTimestamps || [
                    '00:00 오프닝 및 충격적인 첫 장면',
                    '00:15 아무도 몰랐던 무명 시절의 시련',
                    '00:35 운명을 뒤바꾼 결정적 승부수',
                    '00:50 우리가 반드시 배워야 할 인사이트'
                  ]).map((t, i) => (
                    <div key={i} className="truncate">{t}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
