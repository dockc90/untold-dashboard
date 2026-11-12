import React from 'react';
import { Sparkles, Layers, Flame, FolderHeart } from 'lucide-react';
import { AppTab } from './Header';

interface MobileBottomNavProps {
  currentTab: AppTab;
  setCurrentTab: (tab: AppTab) => void;
  savedCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  setCurrentTab,
  savedCount,
}) => {
  return (
    <nav 
      aria-label="모바일 하단 내비게이션"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] pb-safe transition-transform"
    >
      <div className="grid grid-cols-4 h-14 max-w-md mx-auto px-1">
        {/* 1. 쇼츠 제작 */}
        <button
          type="button"
          onClick={() => {
            setCurrentTab('studio');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center gap-0.5 transition active:scale-95 cursor-pointer touch-manipulation ${
            currentTab === 'studio'
              ? 'text-indigo-600 font-black'
              : 'text-slate-500 font-medium hover:text-slate-900'
          }`}
        >
          <div className={`p-1 rounded-xl transition ${currentTab === 'studio' ? 'bg-indigo-50 text-indigo-600' : ''}`}>
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight leading-none">쇼츠 제작</span>
        </button>

        {/* 2. 캐러셀 */}
        <button
          type="button"
          onClick={() => {
            setCurrentTab('carousel');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center gap-0.5 transition active:scale-95 cursor-pointer touch-manipulation relative ${
            currentTab === 'carousel'
              ? 'text-rose-600 font-black'
              : 'text-slate-500 font-medium hover:text-slate-900'
          }`}
        >
          <div className={`p-1 rounded-xl transition ${currentTab === 'carousel' ? 'bg-rose-50 text-rose-600' : ''}`}>
            <Layers className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight leading-none">캐러셀</span>
          <span className="absolute top-2 right-4 w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
        </button>

        {/* 3. 썸네일 */}
        <button
          type="button"
          onClick={() => {
            setCurrentTab('viral');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center gap-0.5 transition active:scale-95 cursor-pointer touch-manipulation ${
            currentTab === 'viral'
              ? 'text-amber-600 font-black'
              : 'text-slate-500 font-medium hover:text-slate-900'
          }`}
        >
          <div className={`p-1 rounded-xl transition ${currentTab === 'viral' ? 'bg-amber-50 text-amber-600' : ''}`}>
            <Flame className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight leading-none">썸네일</span>
        </button>

        {/* 4. 보관함 */}
        <button
          type="button"
          onClick={() => {
            setCurrentTab('saved');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center gap-0.5 transition active:scale-95 cursor-pointer touch-manipulation relative ${
            currentTab === 'saved'
              ? 'text-slate-900 font-black'
              : 'text-slate-500 font-medium hover:text-slate-900'
          }`}
        >
          <div className={`p-1 rounded-xl transition ${currentTab === 'saved' ? 'bg-slate-100 text-slate-900' : ''}`}>
            <FolderHeart className="w-5 h-5 text-rose-500" />
          </div>
          <span className="text-[10px] tracking-tight leading-none">보관함</span>
          {savedCount > 0 && (
            <span className="absolute top-1.5 right-3 px-1.5 py-0.2 min-w-[16px] text-center text-[9px] font-black bg-rose-500 text-white rounded-full">
              {savedCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
};
