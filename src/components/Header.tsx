import React from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  Film, 
  FolderHeart, 
  CheckSquare,
  Flame,
  Layers
} from 'lucide-react';

export type AppTab = 'studio' | 'carousel' | 'viral' | 'todo' | 'roadmap' | 'architecture' | 'saved';

interface HeaderProps {
  currentTab: AppTab;
  setCurrentTab: (tab: AppTab) => void;
  savedCount: number;
  onResetToHome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, setCurrentTab, savedCount, onResetToHome }) => {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-800 shadow-xs w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Main Header Row */}
        <div className="h-14 sm:h-16 flex items-center justify-between gap-2">
          {/* Brand / Logo (Always Navigates to Home 1-Step Trends View) */}
          <button
            type="button"
            onClick={() => {
              if (onResetToHome) {
                onResetToHome();
              } else {
                setCurrentTab('studio');
              }
            }}
            className="flex items-center space-x-2 sm:space-x-2.5 text-left group transition cursor-pointer focus:outline-none shrink-0"
            title="홈 화면(1단계 트렌드 인물 선택)으로 이동"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-rose-500 via-amber-500 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform shrink-0">
              <Film className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-black text-base sm:text-lg tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 bg-clip-text text-transparent">
                  AutoShorts
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-black bg-rose-50 text-rose-600 border border-rose-200 shrink-0">
                  AI 2.0
                </span>
              </div>
              <p className="hidden sm:block text-[11px] text-slate-500 font-medium">화제의 인물 쇼츠 초고속 자동화 스튜디오</p>
            </div>
          </button>

          {/* Mobile Right: Quick Saved & Status */}
          <div className="flex items-center sm:hidden space-x-1">
            <button
              onClick={() => setCurrentTab('saved')}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                currentTab === 'saved' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              <FolderHeart className="w-3.5 h-3.5 text-rose-500" />
              <span>보관함</span>
              {savedCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 text-[9px] bg-rose-500 text-white font-black rounded-full">
                  {savedCount}
                </span>
              )}
            </button>
          </div>

          {/* Desktop Tab Navigation (Hidden on small mobile) */}
          <div className="hidden md:flex items-center space-x-1 bg-slate-100/90 p-1 rounded-2xl border border-slate-200 text-xs">
            <button
              onClick={() => setCurrentTab('studio')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                currentTab === 'studio'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>제작 스튜디오</span>
            </button>

            <button
              onClick={() => setCurrentTab('carousel')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                currentTab === 'carousel'
                  ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Layers className="w-4 h-4 text-rose-500" />
              <span>인스타 캐러셀</span>
              <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 ml-0.5">
                NEW
              </span>
            </button>

            <button
              onClick={() => setCurrentTab('viral')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                currentTab === 'viral'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Flame className="w-4 h-4 text-amber-500" />
              <span>썸네일 & 카피</span>
            </button>

            <button
              onClick={() => setCurrentTab('todo')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                currentTab === 'todo'
                  ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <CheckSquare className="w-4 h-4 text-rose-500" />
              <span>데일리 루틴 To-Do</span>
            </button>

            <button
              onClick={() => setCurrentTab('roadmap')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                currentTab === 'roadmap'
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <span>수익 전략 & 로드맵</span>
            </button>

            <button
              onClick={() => setCurrentTab('saved')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                currentTab === 'saved'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <FolderHeart className="w-4 h-4 text-rose-400" />
              <span>보관함</span>
              {savedCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-rose-500 text-white font-bold rounded-full">
                  {savedCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Scrollable Tab Bar (Only visible on mobile < md) */}
        <div className="relative md:hidden w-full min-w-0 max-w-full">
          <div className="overflow-x-auto scrollbar-none py-2 border-t border-slate-100 touch-pan-x overscroll-x-contain">
            <div className="flex items-center space-x-1.5 w-max min-w-full px-1 pr-6">
          <button
            onClick={() => setCurrentTab('studio')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer ${
              currentTab === 'studio'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>제작 스튜디오</span>
          </button>

          <button
            onClick={() => setCurrentTab('carousel')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer ${
              currentTab === 'carousel'
                ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-rose-500" />
            <span>인스타 캐러셀</span>
          </button>

          <button
            onClick={() => setCurrentTab('viral')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer ${
              currentTab === 'viral'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>썸네일 & 카피</span>
          </button>

          <button
            onClick={() => setCurrentTab('todo')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer ${
              currentTab === 'todo'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5 text-rose-500" />
            <span>데일리 루틴</span>
          </button>

          <button
            onClick={() => setCurrentTab('roadmap')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer ${
              currentTab === 'roadmap'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
            <span>수익 로드맵</span>
          </button>

            <button
              onClick={() => setCurrentTab('saved')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer ${
                currentTab === 'saved'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              <FolderHeart className="w-3.5 h-3.5 text-rose-400" />
              <span>보관함 ({savedCount})</span>
            </button>
            </div>
          </div>
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent" />
        </div>
      </div>
    </header>
  );
};
