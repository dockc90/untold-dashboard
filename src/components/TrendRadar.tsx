import React, { useRef, useState } from 'react';
import { 
  Flame, 
  Search, 
  RotateCw, 
  PlusCircle, 
  Sparkles, 
  TrendingUp, 
  Tag, 
  CheckCircle2, 
  Compass, 
  ArrowRight,
  Globe,
  BarChart2,
  Info,
  Film,
  Layers,
  X
} from 'lucide-react';
import { TrendingFigure, CategoryType, TimeFilter, SourceChannel } from '../types';
import { 
  InstagramIcon, 
  InstagramBadge, 
  YouTubeIcon, 
  YouTubeBadge, 
  NaverIcon, 
  NaverBadge 
} from './BrandIcons';

interface TrendRadarProps {
  figures: TrendingFigure[];
  selectedFigure: TrendingFigure | null;
  onSelectFigure: (figure: TrendingFigure) => void;
  onSelectFigureForCarousel?: (figure: TrendingFigure) => void;
  onRefreshTrends: (timeframe: TimeFilter, category: CategoryType, channel?: SourceChannel) => Promise<void>;
  onAnalyzeCustomFigure: (figureName: string, category: CategoryType) => Promise<void>;
  isLoading: boolean;
  isLiveData?: boolean;
  lastLiveSyncedAt?: string | null;
}

const CATEGORIES: { id: CategoryType; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'upcoming', label: '🔭 내일 예고·선점' },
  { id: 'viral', label: '🔥 SNS 바이럴·밈' },
  { id: 'entertainment', label: '연예·가수' },
  { id: 'actor', label: '배우·드라마' },
  { id: 'sports', label: '스포츠' },
  { id: 'economy', label: '경제·기업' },
  { id: 'global', label: '글로벌·셀럽' },
  { id: 'social', label: '사회·이슈' },
];

const CATEGORY_ICONS: Record<CategoryType, string> = {
  all: '🔥',
  upcoming: '🔭',
  viral: '⚡',
  sports: '⚽',
  entertainment: '🍳',
  actor: '🎬',
  economy: '💼',
  global: '🎤',
  social: '📰',
};

const CATEGORY_GRADIENTS: Record<CategoryType, string> = {
  all: 'from-[#1E1E1E] to-[#4338CA]',
  upcoming: 'from-violet-600 to-indigo-600',
  viral: 'from-orange-500 to-amber-500',
  sports: 'from-blue-600 to-indigo-600',
  entertainment: 'from-amber-500 to-rose-500',
  actor: 'from-purple-600 to-indigo-600',
  economy: 'from-slate-700 to-slate-900',
  global: 'from-fuchsia-600 to-pink-500',
  social: 'from-emerald-600 to-teal-700',
};

// 엑박(Broken Image) 완벽 방지 아바타 컴포넌트
export const FigureAvatar: React.FC<{ name: string; category: CategoryType; imageUrl?: string }> = ({
  name,
  category,
  imageUrl,
}) => {
  const [hasError, setHasError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const initial = name.replace(/[^가-힣a-zA-Z]/g, '').slice(0, 2) || name.slice(0, 2);
  const icon = CATEGORY_ICONS[category] || '🔥';
  const gradient = CATEGORY_GRADIENTS[category] || 'from-[#1E1E1E] to-[#4338CA]';

  if (!imageUrl || hasError) {
    return (
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${gradient} flex flex-col items-center justify-center text-white shadow-2xs relative shrink-0 overflow-hidden`}>
        <span className="text-xs font-bold tracking-tight leading-none">{initial}</span>
        <span className="text-[9px] leading-none mt-0.5 opacity-90">{icon}</span>
      </div>
    );
  }

  return (
    <div className={`w-11 h-11 rounded-xl relative shrink-0 overflow-hidden bg-gradient-to-tr ${gradient} border border-[#E9E9E7] shadow-2xs`}>
      <img
        src={imageUrl}
        alt=""
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover transition-opacity duration-200 ${
          loaded ? 'block opacity-100' : 'hidden'
        }`}
      />
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <span className="text-xs font-bold">{initial}</span>
          <span className="text-[9px] mt-0.5">{icon}</span>
        </div>
      )}
    </div>
  );
};

export const normalizeChannel = (ch?: string): 'youtube' | 'naver' | 'instagram' | 'multi' => {
  if (!ch) return 'multi';
  const lower = ch.toLowerCase().trim();
  if (lower.includes('you') || lower.includes('유튜브') || lower.includes('쇼츠') || lower.includes('shorts') || lower.includes('yt')) return 'youtube';
  if (lower.includes('nav') || lower.includes('네이버') || lower.includes('블로그') || lower.includes('카페') || lower.includes('검색')) return 'naver';
  if (lower.includes('insta') || lower.includes('인스타') || lower.includes('릴스') || lower.includes('reels') || lower.includes('ig')) return 'instagram';
  return 'multi';
};

export const TrendRadar: React.FC<TrendRadarProps> = ({
  figures,
  selectedFigure,
  onSelectFigure,
  onSelectFigureForCarousel,
  onRefreshTrends,
  onAnalyzeCustomFigure,
  isLoading,
  isLiveData = false,
  lastLiveSyncedAt = null,
}) => {
  const [sourceChannel, setSourceChannel] = useState<SourceChannel>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('24h');
  const [categoryFilter, setCategoryFilter] = useState<CategoryType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState<CategoryType>('entertainment');
  const [isSubmittingCustom, setIsSubmittingCustom] = useState(false);
  const [showDbInfo, setShowDbInfo] = useState(false);
  const [refreshToast, setRefreshToast] = useState<string | null>(null);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string | null>(null);
  const fetchedSlicesRef = useRef<Map<string, number>>(new Map());

  const ensureSliceFresh = (nextTf: TimeFilter, nextCat: CategoryType, nextChan: SourceChannel) => {
    if (isLoading) return;
    const key = `${nextTf}:${nextCat}:${nextChan}`;
    const lastTry = fetchedSlicesRef.current.get(key) || 0;
    if (Date.now() - lastTry < 5 * 60 * 1000) return;

    const liveMatching = figures.filter((fig) => {
      if (!fig.isLive) return false;
      const catOk =
        nextCat === 'all'
          ? true
          : nextCat === 'upcoming'
          ? Boolean(fig.isUpcoming || fig.category === 'upcoming')
          : fig.category === nextCat;
      const tfOk = nextTf === '7d' ? true : nextTf === '48h' ? fig.timeframe === '24h' || fig.timeframe === '48h' : fig.timeframe === '24h';
      return catOk && tfOk;
    });

    const minNeeded = nextCat === 'all' ? 5 : 2;
    if (liveMatching.length < minNeeded) {
      fetchedSlicesRef.current.set(key, Date.now());
      onRefreshTrends(nextTf, nextCat, nextChan).catch(() => {});
    }
  };

  const handleRefreshClick = async () => {
    if (isLoading) return;
    setRefreshToast('⏳ 구글 급상승·실시간 뉴스 & Google Search로 오늘의 화제 인물을 수집 중...');
    try {
      fetchedSlicesRef.current.set(`${timeFilter}:${categoryFilter}:${sourceChannel}`, Date.now());
      await onRefreshTrends(timeFilter, categoryFilter, sourceChannel);
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      setLastUpdatedTime(timeStr);
      setRefreshToast('✨ 오늘 기준 최신 화제 인물로 업데이트되었습니다!');
      setTimeout(() => setRefreshToast(null), 4000);
    } catch (err: any) {
      setRefreshToast(`⚠️ ${err?.message || '실시간 검색 갱신에 실패했습니다. API 설정을 확인해 주세요.'}`);
      setTimeout(() => setRefreshToast(null), 4500);
    }
  };

  // Filter figures
  const filteredFigures = figures.filter((fig) => {
    const norm = normalizeChannel(fig.primaryChannel);

    const matchesChannel = (() => {
      if (sourceChannel === 'all') return true;
      if (norm === 'multi') return true;
      if (norm === sourceChannel) return true;
      if (sourceChannel === 'youtube' && (fig.channelMetrics?.youtubeViews || norm === 'youtube')) return true;
      if (sourceChannel === 'naver' && (fig.channelMetrics?.naverRank || norm === 'naver')) return true;
      if (sourceChannel === 'instagram' && (fig.channelMetrics?.instaReels || norm === 'instagram')) return true;
      return false;
    })();

    const matchesTime = (() => {
      if (timeFilter === '7d') return true;
      if (timeFilter === '48h') return fig.timeframe === '24h' || fig.timeframe === '48h' || !fig.timeframe;
      return fig.timeframe === '24h' || !fig.timeframe || fig.isHot;
    })();

    const matchesCategory =
      categoryFilter === 'all'
        ? true
        : categoryFilter === 'upcoming'
        ? Boolean(fig.isUpcoming || fig.category === 'upcoming')
        : fig.category === categoryFilter;
    const matchesQuery =
      searchQuery === '' ||
      fig.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fig.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fig.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesChannel && matchesTime && matchesCategory && matchesQuery;
  });

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    setIsSubmittingCustom(true);
    try {
      await onAnalyzeCustomFigure(customName.trim(), customCategory);
      setCustomName('');
      setIsCustomModalOpen(false);
    } finally {
      setIsSubmittingCustom(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-[#E9E9E7] rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      {/* Top Header of Radar: Notion Minimalist Style */}
      <div className="p-4 sm:p-5 bg-[#FBFBFA] border-b border-[#EDEDEB] space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#F1F1EF] border border-[#E3E2DE] text-[#37352F] flex items-center justify-center shrink-0">
              <Compass className="w-4 h-4 text-[#37352F]" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h2 className="text-sm sm:text-base font-bold text-[#191919]">
                  Untold 트렌드 레이더
                </h2>
                <button
                  type="button"
                  onClick={() => setShowDbInfo(!showDbInfo)}
                  className="p-0.5 text-[#9B9A97] hover:text-[#37352F] transition cursor-pointer"
                  title="DB 수집 출처 안내"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-[#787774] font-medium leading-none mt-0.5">실시간 3대 플랫폼 트렌드 분석</p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            <button
              type="button"
              onClick={handleRefreshClick}
              disabled={isLoading}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#23272A] hover:bg-[#111213] text-white rounded-xl text-xs font-semibold transition shadow-xs cursor-pointer disabled:opacity-50 active:scale-95"
              title="실시간 네이버·유튜브·인스타 최신 화제 인물 데이터로 새로고침"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? '새로고침 중...' : '실시간 새로고침'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCustomModalOpen(true)}
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-[#F1F1EF] hover:bg-white text-[#37352F] border border-[#E3E2DE] rounded-xl text-xs font-medium transition shadow-2xs cursor-pointer"
              title="원하는 인물 직접 추가하기"
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#787774]" />
              <span className="hidden sm:inline">직접 추가</span>
            </button>
          </div>
        </div>

        {/* Real-time Refresh Toast Notification */}
        {refreshToast && (
          <div className="p-2.5 rounded-xl bg-[#23272A] text-white font-medium text-xs text-center shadow-md animate-fade-in flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse shrink-0" />
            <span>{refreshToast}</span>
          </div>
        )}

        {/* DB Source Explanation Box */}
        {showDbInfo && (
          <div className="p-3.5 rounded-xl bg-[#F1F1EF] border border-[#E3E2DE] text-[11px] text-[#37352F] space-y-1.5 animate-fadeIn">
            <div className="flex items-center space-x-1.5 font-bold text-[#191919]">
              <BarChart2 className="w-4 h-4 text-indigo-600" />
              <span>실시간 데이터 수집 및 교차 검증 파이프라인</span>
            </div>
            <p className="text-[#787774] leading-relaxed font-normal">
              1. <strong>Google Trends KR & 뉴스 RSS</strong>: 오늘 기준 국내 급상승 검색어와 연예·스포츠·경제·사회·글로벌 최신 헤드라인을 실시간 수집합니다.<br/>
              2. <strong>Google Search AI 교차 분석</strong>: 수집된 최신 신호를 바탕으로 지금 실제 화제인 인물·사건·숫자 팩트를 검증해 추천합니다.<br/>
              3. <strong>자동 최신성 유지</strong>: 앱 진입 시, 카테고리/기간 이동 시, 10분 경과 복귀 시 최신 데이터로 자동 갱신됩니다.
            </p>
          </div>
        )}

        {/* 1. Source Channels Tabs with Official Brand Badges (Notion Pill Bar) */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-[#F1F1EF] rounded-xl border border-[#E3E2DE] text-xs font-medium">
          <button
            onClick={() => setSourceChannel('all')}
            className={`py-1.5 px-1 sm:px-2.5 rounded-lg transition flex items-center justify-center space-x-1 cursor-pointer touch-manipulation active:scale-95 ${
              sourceChannel === 'all'
                ? 'bg-white text-[#191919] shadow-xs font-bold'
                : 'text-[#787774] hover:text-[#191919]'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="truncate">전체</span>
          </button>

          <button
            onClick={() => setSourceChannel('youtube')}
            className={`py-1.5 px-1 sm:px-2.5 rounded-lg transition flex items-center justify-center space-x-1.5 cursor-pointer touch-manipulation active:scale-95 ${
              sourceChannel === 'youtube'
                ? 'bg-white text-red-600 shadow-xs font-bold'
                : 'text-[#787774] hover:text-red-600'
            }`}
          >
            <YouTubeIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">유튜브</span>
          </button>

          <button
            onClick={() => setSourceChannel('naver')}
            className={`py-1.5 px-1 sm:px-2.5 rounded-lg transition flex items-center justify-center space-x-1.5 cursor-pointer touch-manipulation active:scale-95 ${
              sourceChannel === 'naver'
                ? 'bg-white text-emerald-700 shadow-xs font-bold'
                : 'text-[#787774] hover:text-emerald-700'
            }`}
          >
            <NaverIcon className="w-3 h-3 text-[#03C75A] shrink-0" />
            <span className="truncate">네이버</span>
          </button>

          <button
            onClick={() => setSourceChannel('instagram')}
            className={`py-1.5 px-1 sm:px-2.5 rounded-lg transition flex items-center justify-center space-x-1.5 cursor-pointer touch-manipulation active:scale-95 ${
              sourceChannel === 'instagram'
                ? 'bg-white text-[#bc1888] shadow-xs font-bold'
                : 'text-[#787774] hover:text-[#bc1888]'
            }`}
          >
            <InstagramIcon className="w-3.5 h-3.5 text-[#e1306c] shrink-0" />
            <span className="truncate">인스타</span>
          </button>
        </div>

        {/* 2. Time Tabs (Notion Clean Pill) */}
        <div className="grid grid-cols-3 gap-1 bg-[#F1F1EF] p-1 rounded-xl border border-[#E3E2DE] text-[11px] sm:text-xs">
          {(['24h', '48h', '7d'] as TimeFilter[]).map((tf) => (
            <button
              key={tf}
              onClick={() => {
                setTimeFilter(tf);
                ensureSliceFresh(tf, categoryFilter, sourceChannel);
              }}
              className={`py-1.5 text-center rounded-lg transition whitespace-nowrap px-1 cursor-pointer ${
                timeFilter === tf
                  ? 'bg-white text-[#191919] font-bold shadow-xs'
                  : 'text-[#787774] hover:text-[#191919] font-medium'
              }`}
            >
              {tf === '24h' && '24시간'}
              {tf === '48h' && '48시간'}
              {tf === '7d' && '7일'}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#9B9A97] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="인물, 채널, 키워드 검색 (예: 젠슨 황, 손흥민, 유튜브)"
            className="w-full bg-white border border-[#E3E2DE] rounded-xl pl-9 pr-3 py-2 text-xs text-[#37352F] placeholder-[#9B9A97] focus:outline-none focus:border-[#23272A] focus:ring-1 focus:ring-[#23272A] transition"
          />
        </div>

        {/* Categories Bar */}
        <div className="w-full min-w-0 max-w-full overflow-x-auto pb-1 scrollbar-none text-[11px] touch-pan-x overscroll-x-contain">
          <div className="flex items-center space-x-1.5 w-max min-w-full px-0.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setCategoryFilter(cat.id);
                  ensureSliceFresh(timeFilter, cat.id, sourceChannel);
                }}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg transition font-medium border shrink-0 cursor-pointer ${
                  categoryFilter === cat.id
                    ? 'bg-[#23272A] text-white border-[#23272A] shadow-2xs font-semibold'
                    : cat.id === 'upcoming'
                    ? 'bg-violet-50/70 text-violet-800 border-violet-200/80 hover:bg-violet-100/70'
                    : 'bg-white text-[#787774] border-[#E3E2DE] hover:text-[#37352F] hover:bg-[#F1F1EF]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Figures Scroll List / Grid */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-[#FAF9F7]/50 space-y-3.5">
        {/* Real-time Status & 1-Click Refresh Bar */}
        <div className="flex items-center justify-between px-1 text-[11px] font-semibold text-[#787774]">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span className="text-[#37352F] font-bold">실시간 화제 인물 랭킹 ({filteredFigures.length}명)</span>
            {isLoading ? (
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/70 text-[9px] font-bold">
                실시간 검색 중...
              </span>
            ) : isLiveData ? (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[9px] font-bold">
                구글 검색 실시간{lastLiveSyncedAt || lastUpdatedTime ? ` · ${lastLiveSyncedAt || lastUpdatedTime}` : ''}
              </span>
            ) : (
              <span className="px-1.5 py-0.2 rounded-full bg-[#F1F1EF] text-[#787774] border border-[#E3E2DE] text-[9px] font-semibold">
                기본 큐레이션
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleRefreshClick}
            disabled={isLoading}
            className="text-[11px] text-[#37352F] hover:text-black font-semibold flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
            title="새로고침 버튼을 눌러 최신 화제 인물로 다시 갱신"
          >
            <RotateCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? '갱신 중...' : '새로고침'}</span>
          </button>
        </div>

        {filteredFigures.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3">
            <Flame className="w-10 h-10 text-[#D3D1CB] mx-auto" />
            <p className="text-sm font-semibold text-[#787774]">조건에 맞는 화제 인물이 없습니다.</p>
            <button
              onClick={() => setIsCustomModalOpen(true)}
              className="text-xs text-[#23272A] hover:underline font-semibold"
            >
              원하는 인물을 직접 등록하여 분석해보세요
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {[...filteredFigures]
              .sort((a, b) => {
                if (Boolean(b.isLive) !== Boolean(a.isLive)) {
                  return b.isLive ? 1 : -1;
                }
                if (b.viralityScore !== a.viralityScore) {
                  return b.viralityScore - a.viralityScore;
                }
                return (b.sourceArticlesCount || 0) - (a.sourceArticlesCount || 0);
              })
              .map((fig, idx) => {
                const isSelected = selectedFigure?.id === fig.id;
                const rank = idx + 1;
                return (
                  <div
                    key={fig.id}
                    onClick={() => onSelectFigure(fig)}
                    className={`group relative p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-white border-[#23272A] shadow-xs ring-1 ring-[#23272A]/10'
                        : 'bg-white hover:bg-[#FAF9F7] border-[#E9E9E7] hover:border-[#D3D1CB] shadow-[0_1px_3px_rgba(0,0,0,0.02)]'
                    }`}
                  >
                    <div>
                      {/* Header row in card */}
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <div className="flex items-center space-x-3">
                          <FigureAvatar name={fig.name} category={fig.category} imageUrl={fig.imageUrl} />
                          <div>
                            <div className="flex items-center space-x-1.5 flex-wrap">
                              <span className="font-bold text-sm sm:text-base text-[#191919] group-hover:text-black transition">
                                {fig.name}
                              </span>
                              {fig.isLive && (
                                <span className="px-1.5 py-0.2 text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70 rounded-md">
                                  실시간
                                </span>
                              )}
                              {rank === 1 ? (
                                <span className="px-1.5 py-0.2 text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80 rounded-md">
                                  🥇 1위
                                </span>
                              ) : rank === 2 ? (
                                <span className="px-1.5 py-0.2 text-[9px] font-bold bg-[#F1F1EF] text-[#37352F] border border-[#E3E2DE] rounded-md">
                                  🥈 2위
                                </span>
                              ) : rank === 3 ? (
                                <span className="px-1.5 py-0.2 text-[9px] font-bold bg-[#F1F1EF] text-[#787774] border border-[#E3E2DE] rounded-md">
                                  🥉 3위
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.2 text-[9px] font-medium bg-[#F1F1EF] text-[#9B9A97] rounded-md">
                                  #{rank}
                                </span>
                              )}
                              {fig.isHot && (
                                <span className="px-1.5 py-0.2 text-[9px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60 rounded-md flex items-center gap-0.5">
                                  <TrendingUp className="w-2.5 h-2.5" /> 급상승
                                </span>
                              )}
                              {(fig.isUpcoming || fig.category === 'upcoming') && (
                                <span className="px-1.5 py-0.2 text-[9px] font-bold bg-violet-50 text-violet-700 border border-violet-200/80 rounded-md">
                                  🔭 {fig.scheduledDate ? `내일 선점 · ${fig.scheduledDate}` : '내일 예고·선점'}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#787774] font-medium line-clamp-1 mt-0.5">{fig.title}</p>
                          </div>
                        </div>

                        {/* Virality Score */}
                        <div className="flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-rose-50/80 border border-rose-200/60 text-rose-700 font-bold text-xs shrink-0">
                          <Flame className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                          <span>{fig.viralityScore}점</span>
                        </div>
                      </div>

                      {/* Multi-Channel Live Metrics Pills with Official Brand Badges */}
                      {fig.channelMetrics && (
                        <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                          {fig.channelMetrics.youtubeViews && (
                            <span className="flex items-center space-x-1 text-[10px] font-medium px-2 py-0.5 rounded-lg bg-red-50/60 text-red-700 border border-red-200/60">
                              <YouTubeIcon className="w-3 h-3 shrink-0" />
                              <span>{fig.channelMetrics.youtubeViews}</span>
                            </span>
                          )}
                          {fig.channelMetrics.naverRank && (
                            <span className="flex items-center space-x-1 text-[10px] font-medium px-2 py-0.5 rounded-lg bg-emerald-50/60 text-emerald-800 border border-emerald-200/60">
                              <NaverIcon className="w-2.5 h-2.5 text-[#03C75A] shrink-0" />
                              <span>{fig.channelMetrics.naverRank}</span>
                            </span>
                          )}
                          {fig.channelMetrics.instaReels && (
                            <span className="flex items-center space-x-1 text-[10px] font-medium px-2 py-0.5 rounded-lg bg-purple-50/60 text-purple-800 border border-purple-200/60">
                              <InstagramIcon className="w-2.5 h-2.5 text-[#e1306c] shrink-0" />
                              <span>{fig.channelMetrics.instaReels}</span>
                            </span>
                          )}
                        </div>
                      )}

                      {/* Buzz Summary (왜 지금 · 핵심 팩트) */}
                      <p className="text-xs text-[#5C5A54] line-clamp-3 mb-2.5 leading-relaxed font-normal">
                        {fig.buzzSummary}
                      </p>

                      {/* Hook Line & Suggested Angle */}
                      <div className="p-2.5 rounded-xl bg-[#F1F1EF] border border-[#E3E2DE] mb-2.5 space-y-1">
                        <div className="flex items-center space-x-1 text-[11px] font-semibold text-[#37352F]">
                          <TrendingUp className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>{fig.hookLine ? '첫 3초 훅 · 기획 포인트' : '추천 기획 방향'}</span>
                        </div>
                        {fig.hookLine ? (
                          <>
                            <p className="text-[11px] text-[#191919] leading-snug line-clamp-2 font-semibold">
                              “{fig.hookLine}”
                            </p>
                            {fig.suggestedAngle && (
                              <p className="text-[10px] text-[#787774] leading-snug line-clamp-1 font-normal">
                                앵글: {fig.suggestedAngle}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-[11px] text-[#787774] leading-snug line-clamp-2 font-normal">
                            "{fig.suggestedAngle}"
                          </p>
                        )}
                      </div>

                      {/* Tags */}
                      <div className="flex items-center space-x-1 overflow-hidden mb-3">
                        <span className="text-[10px] font-semibold text-[#37352F] bg-[#F1F1EF] px-1.5 py-0.5 rounded border border-[#E3E2DE] shrink-0">
                          태그
                        </span>
                        <span className="text-[10px] text-[#9B9A97] truncate font-medium">
                          {fig.tags.slice(0, 4).map((t) => `#${t}`).join(' ')}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons: 쇼츠 제작 & 캐러셀 제작 */}
                    <div className="grid grid-cols-2 gap-2 mt-auto pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectFigure(fig);
                        }}
                        className="min-h-[42px] py-2 px-2 rounded-xl bg-[#23272A] hover:bg-[#111213] active:scale-95 text-white font-semibold text-xs shadow-xs flex items-center justify-center space-x-1.5 transition cursor-pointer touch-manipulation"
                        title="쇼츠 대본 및 영상 제작"
                      >
                        <Film className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">쇼츠 제작</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectFigureForCarousel) {
                            onSelectFigureForCarousel(fig);
                          } else {
                            onSelectFigure(fig);
                          }
                        }}
                        className="min-h-[42px] py-2 px-2 rounded-xl bg-white hover:bg-[#F1F1EF] active:scale-95 text-[#37352F] border border-[#E3E2DE] font-semibold text-xs shadow-xs flex items-center justify-center space-x-1.5 transition cursor-pointer touch-manipulation"
                        title="카드뉴스 캐러셀 제작"
                      >
                        <Layers className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="truncate">캐러셀 제작</span>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Modal for adding custom figure */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E9E9E7] rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-xl space-y-4 text-[#37352F]">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-[#F1F1EF] text-[#37352F] border border-[#E3E2DE] shrink-0">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-[#191919] truncate">원하는 인물 직접 AI 분석</h3>
                  <p className="text-xs text-[#787774] truncate">네이버·유튜브·인스타 트렌드를 종합 분석합니다.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomModalOpen(false)}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-[#F1F1EF] hover:bg-rose-50 text-[#787774] hover:text-rose-600 font-medium text-xs transition cursor-pointer shrink-0 active:scale-95"
                title="닫기"
              >
                <X className="w-3.5 h-3.5" />
                <span>닫기</span>
              </button>
            </div>

            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#37352F] mb-1.5">
                  인물 이름 또는 별칭
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 안성재, 손흥민, 변우석, 로제, 페이커..."
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-[#FAF9F7] border border-[#E3E2DE] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#37352F] placeholder-[#9B9A97] focus:outline-none focus:border-[#23272A] focus:ring-1 focus:ring-[#23272A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#37352F] mb-1.5">
                  카테고리
                </label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value as CategoryType)}
                  className="w-full bg-[#FAF9F7] border border-[#E3E2DE] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#37352F] focus:outline-none focus:border-[#23272A] font-medium"
                >
                  <option value="entertainment">연예·가수</option>
                  <option value="actor">배우·드라마</option>
                  <option value="sports">스포츠</option>
                  <option value="economy">경제·기업인</option>
                  <option value="social">사회·이슈</option>
                  <option value="global">글로벌 셀럽</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCustomModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-[#787774] hover:text-[#37352F] bg-[#F1F1EF]"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCustom || !customName.trim()}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#23272A] hover:bg-[#111213] text-white transition shadow-xs disabled:opacity-50"
                >
                  {isSubmittingCustom ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      <span>포털 빅데이터 교차 분석 중...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>분석 및 대본 기획 시작</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
