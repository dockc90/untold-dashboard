import React from 'react';
import { 
  Sparkles, 
  Film, 
  FolderHeart, 
  Flame,
  Layers
} from 'lucide-react';

export type AppTab = 'studio' | 'carousel' | 'viral' | 'saved';

interface HeaderProps {
  currentTab: AppTab;
  setCurrentTab: (tab: AppTab) => void;
  savedCount: number;
  onResetToHome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, setCurrentTab, savedCount, onResetToHome }) => {
  return (
    <header className="sticky top-0 z-50 bg-[#FBFBFA]/95 backdrop-blur-md border-b border-[#EDEDEB] text-[#37352F] w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Main Header Row */}
        <div className="h-14 sm:h-16 flex items-center justify-between gap-2">
          {/* Brand / Logo (Sensory Notion Aesthetic) */}
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
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-[#1E1E1E] via-[#2A2B32] to-[#4338CA] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <Film className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-base sm:text-lg tracking-tight text-[#191919]">
                  AutoShorts
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-700 border border-amber-200/80 shrink-0 leading-none">
                  PRO
                </span>
              </div>
              <p className="hidden sm:block text-[11px] text-[#9B9A97] font-medium leading-none mt-0.5">화제의 인물 쇼츠 스튜디오</p>
            </div>
          </button>

          {/* Mobile Right: Quick Saved & Status */}
          <div className="flex items-center sm:hidden space-x-1">
            <button
              onClick={() => setCurrentTab('saved')}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                currentTab === 'saved' 
                  ? 'bg-[#23272A] text-white border-[#23272A]' 
                  : 'bg-[#F1F1EF] text-[#37352F] border-[#E3E2DE] hover:bg-white'
              }`}
            >
              <FolderHeart className="w-3.5 h-3.5 text-rose-500" />
              <span>보관함</span>
              {savedCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 text-[9px] bg-rose-500 text-white font-bold rounded-full">
                  {savedCount}
                </span>
              )}
            </button>
          </div>

          {/* Desktop Tab Navigation (Notion Minimalist Pill Container) */}
          <div className="hidden md:flex items-center space-x-1 bg-[#F1F1EF] p-1 rounded-xl border border-[#E3E2DE] text-xs">
            <button
              onClick={() => setCurrentTab('studio')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
                currentTab === 'studio'
                  ? 'bg-white text-[#37352F] shadow-xs font-semibold'
                  : 'text-[#787774] hover:text-[#37352F] hover:bg-white/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>쇼츠 제작</span>
            </button>

            <button
              onClick={() => setCurrentTab('carousel')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
                currentTab === 'carousel'
                  ? 'bg-white text-[#37352F] shadow-xs font-semibold'
                  : 'text-[#787774] hover:text-[#37352F] hover:bg-white/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-rose-500" />
              <span>캐러셀</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-600 border border-rose-200/80 ml-0.5">
                NEW
              </span>
            </button>

            <button
              onClick={() => setCurrentTab('viral')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
                currentTab === 'viral'
                  ? 'bg-white text-[#37352F] shadow-xs font-semibold'
                  : 'text-[#787774] hover:text-[#37352F] hover:bg-white/60'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>썸네일</span>
            </button>

            <button
              onClick={() => setCurrentTab('saved')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
                currentTab === 'saved'
                  ? 'bg-white text-[#37352F] shadow-xs font-semibold'
                  : 'text-[#787774] hover:text-[#37352F] hover:bg-white/60'
              }`}
            >
              <FolderHeart className="w-3.5 h-3.5 text-rose-500" />
              <span>보관함</span>
              {savedCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-rose-500 text-white font-bold rounded-full">
                  {savedCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
