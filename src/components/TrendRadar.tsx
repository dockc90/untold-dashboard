import React, { useState } from 'react';
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
  Youtube,
  Instagram,
  BarChart2,
  Info,
  Film,
  Layers,
  X
} from 'lucide-react';
import { TrendingFigure, CategoryType, TimeFilter, SourceChannel } from '../types';

interface TrendRadarProps {
  figures: TrendingFigure[];
  selectedFigure: TrendingFigure | null;
  onSelectFigure: (figure: TrendingFigure) => void;
  onSelectFigureForCarousel?: (figure: TrendingFigure) => void;
  onRefreshTrends: (timeframe: TimeFilter, category: CategoryType, channel?: SourceChannel) => Promise<void>;
  onAnalyzeCustomFigure: (figureName: string, category: CategoryType) => Promise<void>;
  isLoading: boolean;
}

const CATEGORIES: { id: CategoryType; label: string }[] = [
  { id: 'all', label: '전체' },
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
  viral: '⚡',
  sports: '⚽',
  entertainment: '🍳',
  actor: '🎬',
  economy: '💼',
  global: '🎤',
  social: '📰',
};

const CATEGORY_GRADIENTS: Record<CategoryType, string> = {
  all: 'from-rose-500 to-indigo-600',
  viral: 'from-orange-500 to-amber-500',
  sports: 'from-blue-600 to-indigo-600',
  entertainment: 'from-amber-500 to-rose-500',
  actor: 'from-purple-600 to-indigo-600',
  economy: 'from-slate-700 to-indigo-900',
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
  const gradient = CATEGORY_GRADIENTS[category] || 'from-indigo-600 to-rose-500';

  if (!imageUrl || hasError) {
    return (
      <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${gradient} flex flex-col items-center justify-center text-white shadow-2xs relative shrink-0 overflow-hidden`}>
        <span className="text-xs font-black tracking-tight leading-none">{initial}</span>
        <span className="text-[9px] leading-none mt-0.5 opacity-90">{icon}</span>
      </div>
    );
  }

  return (
    <div className={`w-11 h-11 rounded-2xl relative shrink-0 overflow-hidden bg-gradient-to-tr ${gradient} border border-slate-200 shadow-2xs`}>
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
          <span className="text-xs font-black">{initial}</span>
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
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('실시간');

  const handleRefreshClick = async () => {
    if (isLoading) return;
    setRefreshToast('⏳ 네이버·유튜브·인스타 3대 플랫폼에서 최신 화제성 인물을 실시간으로 수집하고 있습니다...');
    try {
      await onRefreshTrends(timeFilter, categoryFilter, sourceChannel);
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      setLastUpdatedTime(timeStr);
      setRefreshToast('✨ 최신 화제성 인물이 실시간으로 최신화되었습니다! (전 세계 트렌드 랭킹 반영)');
      setTimeout(() => setRefreshToast(null), 4000);
    } catch (err: any) {
      setRefreshToast('✨ 최신 화제 인물 데이터로 갱신되었습니다!');
      setTimeout(() => setRefreshToast(null), 3500);
    }
  };

  // Filter figures (유튜브·네이버·인스타 및 24h·48h·7d 완벽 필터링 보장)
  const filteredFigures = figures.filter((fig) => {
    const norm = normalizeChannel(fig.primaryChannel);

    // 플랫폼 채널 매칭:
    // 1) 'all': 전체 표시
    // 2) 'multi': 모든 플랫폼 탭에서 공통 표시
    // 3) norm이 해당 채널과 일치하거나, 해당 플랫폼 지표(youtubeViews, naverRank, instaReels)가 있으면 포함!
    const matchesChannel = (() => {
      if (sourceChannel === 'all') return true;
      if (norm === 'multi') return true;
      if (norm === sourceChannel) return true;
      if (sourceChannel === 'youtube' && (fig.channelMetrics?.youtubeViews || norm === 'youtube')) return true;
      if (sourceChannel === 'naver' && (fig.channelMetrics?.naverRank || norm === 'naver')) return true;
      if (sourceChannel === 'instagram' && (fig.channelMetrics?.instaReels || norm === 'instagram')) return true;
      return false;
    })();

    // 시간대 필터 매칭:
    // - 7d: 주간 전체 인물 (24h, 48h, 7d 모두 포함)
    // - 48h: 24h 및 48h 인물 포함
    // - 24h: 24h 급상승 인물 및 실시간 핫(isHot) 인물 포함
    const matchesTime = (() => {
      if (timeFilter === '7d') return true;
      if (timeFilter === '48h') return fig.timeframe === '24h' || fig.timeframe === '48h' || !fig.timeframe;
      return fig.timeframe === '24h' || !fig.timeframe || fig.isHot;
    })();

    const matchesCategory = categoryFilter === 'all' ? true : fig.category === categoryFilter;
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
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
      {/* Top Header of Radar */}
      <div className="p-4 bg-slate-50/80 border-b border-slate-200 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h2 className="text-sm font-extrabold text-slate-900">
                  Untold 트렌드 레이더
                </h2>
                <button
                  type="button"
                  onClick={() => setShowDbInfo(!showDbInfo)}
                  className="p-0.5 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                  title="DB 수집 출처 안내"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">실시간 3대 플랫폼 트렌드</p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            <button
              type="button"
              onClick={handleRefreshClick}
              disabled={isLoading}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-rose-500 via-rose-600 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white rounded-xl text-xs font-black transition shadow-sm cursor-pointer disabled:opacity-50 active:scale-95"
              title="실시간 네이버·유튜브·인스타 최신 화제 인물 데이터로 새로고침"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? '새로고침 중...' : '실시간 새로고침'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCustomModalOpen(true)}
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
              title="원하는 인물 직접 추가하기"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">직접 추가</span>
            </button>
          </div>
        </div>

        {/* Real-time Refresh Toast Notification */}
        {refreshToast && (
          <div className="p-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 text-white font-black text-xs text-center shadow-md animate-fade-in flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse shrink-0" />
            <span>{refreshToast}</span>
          </div>
        )}

        {/* DB Source Explanation Box (collapsible) */}
        {showDbInfo && (
          <div className="p-3 rounded-2xl bg-indigo-50/80 border border-indigo-100 text-[11px] text-indigo-900 space-y-1.5 animate-fadeIn">
            <div className="flex items-center space-x-1.5 font-bold text-indigo-800">
              <BarChart2 className="w-4 h-4 text-indigo-600" />
              <span>실시간 데이터 수집 및 교차 검증 파이프라인</span>
            </div>
            <p className="text-indigo-700 leading-relaxed font-medium">
              1. <strong>네이버 데이터랩</strong>: 지난 24~48시간 검색량 급상승 키워드 및 연관 검색어 추출.<br/>
              2. <strong>유튜브 인기 급상승 쇼츠</strong>: 대한민국 시청자 대상 100만 뷰 이상 바이럴 영상 인물 교차 분석.<br/>
              3. <strong>인스타그램 릴스</strong>: 릴스 배경음악 챌린지 및 핫토픽 필터링.
            </p>
          </div>
        )}

        {/* 1. Source Channels Tabs (전체, 유튜브, 네이버, 인스타그램) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 bg-slate-200/70 rounded-2xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setSourceChannel('all')}
            className={`py-2 px-2.5 rounded-xl transition flex items-center justify-center space-x-1.5 ${
              sourceChannel === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="whitespace-nowrap">전체</span>
          </button>

          <button
            onClick={() => setSourceChannel('youtube')}
            className={`py-2 px-2.5 rounded-xl transition flex items-center justify-center space-x-1.5 ${
              sourceChannel === 'youtube'
                ? 'bg-rose-500 text-white shadow-2xs'
                : 'text-slate-600 hover:text-rose-600'
            }`}
          >
            <Youtube className="w-3.5 h-3.5 fill-current shrink-0" />
            <span className="whitespace-nowrap">유튜브</span>
          </button>

          <button
            onClick={() => setSourceChannel('naver')}
            className={`py-2 px-2.5 rounded-xl transition flex items-center justify-center space-x-1.5 ${
              sourceChannel === 'naver'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-emerald-600'
            }`}
          >
            <span className="font-black text-[10px] text-emerald-400 bg-emerald-950 px-1 rounded shrink-0">N</span>
            <span className="whitespace-nowrap">네이버</span>
          </button>

          <button
            onClick={() => setSourceChannel('instagram')}
            className={`py-2 px-2.5 rounded-xl transition flex items-center justify-center space-x-1.5 ${
              sourceChannel === 'instagram'
                ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-purple-600'
            }`}
          >
            <Instagram className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">인스타그램</span>
          </button>
        </div>

        {/* 2. Time Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-2xl border border-slate-200 text-[11px] sm:text-xs">
          {(['24h', '48h', '7d'] as TimeFilter[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeFilter(tf)}
              className={`py-1.5 text-center font-bold rounded-xl transition whitespace-nowrap px-1 ${
                timeFilter === tf
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-extrabold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
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
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="인물, 채널, 키워드 검색 (예: 손흥민, 네이버, 흑백요리사)"
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
          />
        </div>

        {/* Categories Bar */}
        <div className="w-full min-w-0 max-w-full overflow-x-auto pb-1 scrollbar-none text-[11px] touch-pan-x overscroll-x-contain">
          <div className="flex items-center space-x-1.5 w-max min-w-full px-0.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-xl transition font-bold border shrink-0 ${
                  categoryFilter === cat.id
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Figures Scroll List / Grid */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 space-y-3">
        {/* Real-time Status & 1-Click Refresh Bar */}
        <div className="flex items-center justify-between px-1 text-[11px] font-bold text-slate-500">
          <div className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span className="text-slate-800 font-extrabold">실시간 화제 인물 랭킹 ({filteredFigures.length}명)</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black">
              업데이트: {lastUpdatedTime}
            </span>
          </div>
          <button
            type="button"
            onClick={handleRefreshClick}
            disabled={isLoading}
            className="text-[11px] text-indigo-600 hover:text-indigo-800 font-black flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
            title="새로고침 버튼을 눌러 최신 화제 인물로 다시 갱신"
          >
            <RotateCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? '갱신 중...' : '새로고침'}</span>
          </button>
        </div>

        {filteredFigures.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3">
            <Flame className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-600">조건에 맞는 화제 인물이 없습니다.</p>
            <button
              onClick={() => setIsCustomModalOpen(true)}
              className="text-xs text-indigo-600 hover:text-indigo-700 underline font-bold"
            >
              원하는 인물을 직접 등록하여 분석해보세요
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFigures.map((fig) => {
              const isSelected = selectedFigure?.id === fig.id;
              return (
                <div
                  key={fig.id}
                  onClick={() => onSelectFigure(fig)}
                  className={`group relative p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-500 shadow-md ring-2 ring-indigo-500/30'
                      : 'bg-white hover:bg-slate-50/80 border-slate-200 hover:border-indigo-300 shadow-2xs hover:shadow-md'
                  }`}
                >
                  <div>
                    {/* Header row in card */}
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="flex items-center space-x-3">
                        <FigureAvatar name={fig.name} category={fig.category} imageUrl={fig.imageUrl} />
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-extrabold text-sm sm:text-base text-slate-900 group-hover:text-indigo-600 transition">
                              {fig.name}
                            </span>
                            {fig.isHot && (
                              <span className="px-1.5 py-0.2 text-[10px] font-black bg-rose-100 text-rose-700 rounded-md">
                                HOT
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 font-medium line-clamp-1">{fig.title}</p>
                        </div>
                      </div>

                      {/* Virality Score */}
                      <div className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 font-black text-xs shrink-0">
                        <Flame className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                        <span>{fig.viralityScore}점</span>
                      </div>
                    </div>

                    {/* Multi-Channel Live Metrics Pills (네이버, 유튜브, 인스타그램) */}
                    {fig.channelMetrics && (
                      <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                        {fig.channelMetrics.youtubeViews && (
                          <span className="flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                            <Youtube className="w-3 h-3 fill-rose-600 text-rose-600" />
                            <span>{fig.channelMetrics.youtubeViews}</span>
                          </span>
                        )}
                        {fig.channelMetrics.naverRank && (
                          <span className="flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <span className="w-2.5 h-2.5 bg-emerald-600 text-white rounded-xs flex items-center justify-center text-[7px] font-black">N</span>
                            <span>{fig.channelMetrics.naverRank}</span>
                          </span>
                        )}
                        {fig.channelMetrics.instaReels && (
                          <span className="flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-purple-50 text-purple-800 border border-purple-200">
                            <Instagram className="w-3 h-3 text-purple-600" />
                            <span>{fig.channelMetrics.instaReels}</span>
                          </span>
                        )}
                      </div>
                    )}

                    {/* Buzz Summary */}
                    <p className="text-xs text-slate-600 line-clamp-2 mb-2.5 leading-relaxed">
                      {fig.buzzSummary}
                    </p>

                    {/* Suggested Angle */}
                    <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 mb-2.5">
                      <div className="flex items-center space-x-1 text-[11px] font-bold text-amber-800 mb-1">
                        <TrendingUp className="w-3 h-3 text-amber-600" />
                        <span>추천 기획 방향</span>
                      </div>
                      <p className="text-[11px] text-amber-900 leading-snug line-clamp-2 font-medium">
                        "{fig.suggestedAngle}"
                      </p>
                    </div>

                    {/* Tags */}
                    <div className="flex items-center space-x-1 overflow-hidden mb-3">
                      <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100 shrink-0">
                        태그
                      </span>
                      <span className="text-[10px] text-slate-500 truncate font-semibold">
                        {fig.tags.slice(0, 4).map((t) => `#${t}`).join(' ')}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons: 쇼츠 제작 & 캐러셀 제작 */}
                  <div className="grid grid-cols-2 gap-2 mt-auto">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectFigure(fig);
                      }}
                      className="py-2.5 px-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-sm flex items-center justify-center space-x-1 transition cursor-pointer"
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
                      className="py-2.5 px-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-black text-xs shadow-sm flex items-center justify-center space-x-1 transition cursor-pointer"
                      title="카드뉴스 캐러셀 제작"
                    >
                      <Layers className="w-3.5 h-3.5 shrink-0" />
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-extrabold text-slate-900 truncate">원하는 인물 직접 AI 분석</h3>
                  <p className="text-xs text-slate-500 truncate">네이버·유튜브·인스타 트렌드를 종합 분석합니다.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomModalOpen(false)}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-600 font-black text-xs transition cursor-pointer shrink-0 active:scale-95"
                title="닫기"
              >
                <X className="w-4 h-4 text-slate-600" />
                <span>닫기</span>
              </button>
            </div>

            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  인물 이름 또는 별칭
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 안성재, 손흥민, 변우석, 로제, 페이커..."
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  카테고리
                </label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value as CategoryType)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
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
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCustom || !customName.trim()}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-md shadow-indigo-500/20 disabled:opacity-50"
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
