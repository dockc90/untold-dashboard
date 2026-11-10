import React from 'react';
import { 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare, 
  Share2, 
  Repeat, 
  Heart, 
  Send, 
  Bookmark, 
  MoreHorizontal, 
  Music, 
  Search, 
  Camera, 
  Plus, 
  Disc,
  ShieldAlert,
  ShieldCheck,
  EyeOff
} from 'lucide-react';

export type PlatformGuideType = 'none' | 'youtube' | 'instagram' | 'tiktok' | 'safezone';

interface ShortsSafeZoneOverlayProps {
  platform: PlatformGuideType;
  title?: string;
  authorName?: string;
  className?: string;
}

export const ShortsSafeZoneOverlay: React.FC<ShortsSafeZoneOverlayProps> = ({
  platform,
  title = '안성재 셰프가 가난했던 시절 미군에 입대한 진짜 이유...',
  authorName = 'Untold Story',
  className = '',
}) => {
  if (platform === 'none') return null;

  return (
    <div 
      className={`absolute inset-0 pointer-events-none select-none z-20 overflow-hidden text-white font-sans ${className}`}
      aria-hidden="true"
    >
      {/* 1. YouTube Shorts Overlay */}
      {platform === 'youtube' && (
        <div className="w-full h-full flex flex-col justify-between p-3 relative bg-gradient-to-b from-black/40 via-transparent to-black/60">
          {/* Top Bar */}
          <div className="flex items-center justify-between pt-1 px-1">
            <span className="text-[11px] font-black tracking-wider text-white/90 drop-shadow-md">
              Shorts
            </span>
            <div className="flex items-center space-x-3 text-white/90 drop-shadow-md">
              <Search className="w-4 h-4" />
              <Camera className="w-4 h-4" />
              <MoreHorizontal className="w-4 h-4" />
            </div>
          </div>

          {/* Safe Zone Inner Guide (Subtle neon outline) */}
          <div className="absolute inset-x-3 top-[12%] bottom-[22%] right-[20%] border border-dashed border-red-500/40 rounded-xl pointer-events-none flex items-start justify-end p-1">
            <span className="text-[8px] bg-red-600/70 text-white font-black px-1.5 py-0.5 rounded-sm">
              쇼츠 안전구역
            </span>
          </div>

          {/* Right Action Bar (Buttons) */}
          <div className="absolute right-2 bottom-[14%] flex flex-col items-center space-y-3.5 z-10">
            <div className="flex flex-col items-center drop-shadow-md">
              <div className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-xs flex items-center justify-center border border-white/10">
                <ThumbsUp className="w-4 h-4 fill-white" />
              </div>
              <span className="text-[10px] font-bold mt-0.5">14만</span>
            </div>

            <div className="flex flex-col items-center drop-shadow-md">
              <div className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-xs flex items-center justify-center border border-white/10">
                <ThumbsDown className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold mt-0.5">싫어요</span>
            </div>

            <div className="flex flex-col items-center drop-shadow-md">
              <div className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-xs flex items-center justify-center border border-white/10">
                <MessageSquare className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold mt-0.5">1,820</span>
            </div>

            <div className="flex flex-col items-center drop-shadow-md">
              <div className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-xs flex items-center justify-center border border-white/10">
                <Share2 className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold mt-0.5">공유</span>
            </div>

            <div className="flex flex-col items-center drop-shadow-md">
              <div className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-xs flex items-center justify-center border border-white/10">
                <Repeat className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold mt-0.5">리믹스</span>
            </div>

            {/* Sound Icon */}
            <div className="w-7 h-7 rounded-lg bg-slate-800 border-2 border-white/80 overflow-hidden flex items-center justify-center shadow-lg">
              <div className="w-full h-full bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center">
                <Music className="w-3.5 h-3.5 text-white animate-pulse" />
              </div>
            </div>
          </div>

          {/* Bottom Channel Info & Title */}
          <div className="w-[78%] pb-2 space-y-1.5 z-10 drop-shadow-md">
            {/* Channel Profile & Subscribe */}
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-rose-600 to-indigo-600 flex items-center justify-center text-white font-black text-xs border border-white/40 shadow-xs">
                U
              </div>
              <span className="text-[11px] font-black truncate max-w-[110px]">
                @{authorName.replace(/\s+/g, '')}
              </span>
              <button 
                type="button"
                className="px-2.5 py-0.5 rounded-full bg-red-600 text-white font-extrabold text-[10px] shadow-xs shrink-0"
              >
                구독
              </button>
            </div>

            {/* Video Title / Caption */}
            <p className="text-[11px] font-medium leading-snug line-clamp-2 text-white/95">
              {title}
            </p>

            {/* Sound track info */}
            <div className="flex items-center space-x-1.5 text-[9px] text-white/80">
              <Music className="w-3 h-3 shrink-0" />
              <span className="truncate max-w-[160px]">오리지널 사운드 · {authorName}</span>
            </div>
          </div>

          {/* YouTube Bottom Red Scrubber Bar */}
          <div className="absolute bottom-0 inset-x-0 h-0.5 bg-white/20">
            <div className="w-1/3 h-full bg-red-600" />
          </div>
        </div>
      )}

      {/* 2. Instagram Reels Overlay */}
      {platform === 'instagram' && (
        <div className="w-full h-full flex flex-col justify-between p-3 relative bg-gradient-to-b from-black/40 via-transparent to-black/60">
          {/* Top Bar */}
          <div className="flex items-center justify-between pt-1 px-1">
            <div className="flex items-center space-x-1 text-white/95 drop-shadow-md">
              <span className="text-xs font-black tracking-tight">릴스</span>
              <span className="text-[9px]">▼</span>
            </div>
            <div className="text-white/95 drop-shadow-md">
              <Camera className="w-4 h-4" />
            </div>
          </div>

          {/* Safe Zone Inner Guide */}
          <div className="absolute inset-x-3 top-[10%] bottom-[20%] right-[18%] border border-dashed border-fuchsia-400/40 rounded-xl pointer-events-none flex items-start justify-end p-1">
            <span className="text-[8px] bg-fuchsia-600/70 text-white font-black px-1.5 py-0.5 rounded-sm">
              릴스 안전구역
            </span>
          </div>

          {/* Right Action Bar (Instagram style) */}
          <div className="absolute right-2 bottom-[12%] flex flex-col items-center space-y-4 z-10">
            <div className="flex flex-col items-center drop-shadow-md">
              <Heart className="w-6 h-6 fill-white text-white" />
              <span className="text-[10px] font-bold mt-1">4.2만</span>
            </div>

            <div className="flex flex-col items-center drop-shadow-md">
              <MessageSquare className="w-6 h-6 text-white" />
              <span className="text-[10px] font-bold mt-1">890</span>
            </div>

            <div className="flex flex-col items-center drop-shadow-md">
              <Send className="w-5 h-5 text-white -rotate-12" />
              <span className="text-[10px] font-bold mt-1">1.1만</span>
            </div>

            <div className="flex flex-col items-center drop-shadow-md">
              <Bookmark className="w-5 h-5 text-white" />
            </div>

            <div className="flex flex-col items-center drop-shadow-md">
              <MoreHorizontal className="w-5 h-5 text-white" />
            </div>

            {/* Rotating Album Art */}
            <div className="w-6 h-6 rounded-md border border-white/60 overflow-hidden shadow-lg bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center">
              <Music className="w-3 h-3 text-white" />
            </div>
          </div>

          {/* Bottom Account Info & Caption */}
          <div className="w-[80%] pb-2 space-y-1.5 z-10 drop-shadow-md">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-full p-[1.5px] bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-[10px] font-black text-white">
                  U
                </div>
              </div>
              <span className="text-[11px] font-black truncate max-w-[100px]">
                {authorName.toLowerCase().replace(/\s+/g, '_')}
              </span>
              <button 
                type="button"
                className="px-2 py-0.5 rounded-md border border-white/40 text-white font-extrabold text-[9px] backdrop-blur-xs"
              >
                팔로우
              </button>
            </div>

            <p className="text-[11px] font-medium leading-snug line-clamp-2 text-white/95">
              {title} <span className="text-white/60 text-[10px]">... 더 보기</span>
            </p>

            <div className="flex items-center space-x-1.5 text-[9px] text-white/80">
              <Music className="w-3 h-3 shrink-0" />
              <span className="truncate max-w-[150px]">오리지널 오디오 · {authorName}</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. TikTok Overlay */}
      {platform === 'tiktok' && (
        <div className="w-full h-full flex flex-col justify-between p-3 relative bg-gradient-to-b from-black/40 via-transparent to-black/60">
          {/* Top Bar */}
          <div className="flex items-center justify-between pt-1 px-1 text-white/90 drop-shadow-md">
            <span className="text-[10px] font-extrabold text-white/60">LIVE</span>
            <div className="flex items-center space-x-2.5 text-[11px] font-black">
              <span className="text-white/60">친구</span>
              <span className="text-white/60">팔로잉</span>
              <span className="text-white border-b-2 border-white pb-0.5">추천</span>
            </div>
            <Search className="w-4 h-4" />
          </div>

          {/* Safe Zone Inner Guide */}
          <div className="absolute inset-x-3 top-[10%] bottom-[22%] right-[18%] border border-dashed border-cyan-400/40 rounded-xl pointer-events-none flex items-start justify-end p-1">
            <span className="text-[8px] bg-cyan-600/70 text-white font-black px-1.5 py-0.5 rounded-sm">
              틱톡 안전구역
            </span>
          </div>

          {/* Right Action Bar (TikTok style) */}
          <div className="absolute right-2 bottom-[10%] flex flex-col items-center space-y-3 z-10">
            {/* Avatar with Plus Badge */}
            <div className="relative mb-1">
              <div className="w-8 h-8 rounded-full border border-white bg-gradient-to-tr from-cyan-500 to-rose-500 flex items-center justify-center font-black text-xs">
                U
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-rose-500 flex items-center justify-center text-white">
                <Plus className="w-2.5 h-2.5" />
              </div>
            </div>

            <div className="flex flex-col items-center drop-shadow-md">
              <Heart className="w-6 h-6 fill-rose-500 text-rose-500" />
              <span className="text-[9px] font-bold mt-0.5">8.4만</span>
            </div>

            <div className="flex flex-col items-center drop-shadow-md">
              <MessageSquare className="w-6 h-6 text-white" />
              <span className="text-[9px] font-bold mt-0.5">2,140</span>
            </div>

            <div className="flex flex-col items-center drop-shadow-md">
              <Bookmark className="w-6 h-6 text-white" />
              <span className="text-[9px] font-bold mt-0.5">6,820</span>
            </div>

            <div className="flex flex-col items-center drop-shadow-md">
              <Share2 className="w-6 h-6 text-white" />
              <span className="text-[9px] font-bold mt-0.5">3,200</span>
            </div>

            {/* Rotating Vinyl Disc */}
            <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center shadow-lg">
              <Disc className="w-6 h-6 text-rose-400 animate-spin" />
            </div>
          </div>

          {/* Bottom Account Info & Caption */}
          <div className="w-[80%] pb-2 space-y-1.5 z-10 drop-shadow-md">
            <span className="text-xs font-black block">
              @{authorName.toLowerCase().replace(/\s+/g, '')}
            </span>

            <p className="text-[11px] font-medium leading-snug line-clamp-2 text-white/95">
              {title} <span className="text-cyan-300 font-bold">#쇼츠 #릴스 #실화</span>
            </p>

            <div className="flex items-center space-x-1.5 text-[9px] text-white/80">
              <Music className="w-3 h-3 shrink-0" />
              <span className="truncate max-w-[160px]">오리지널 음원 - {authorName}</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Complete Safe Zone Grid Overlay (가장 직관적인 가림 위험 구역 표시) */}
      {platform === 'safezone' && (
        <div className="w-full h-full relative p-2 flex flex-col justify-between">
          {/* Top Danger Bar (Header & notch area) */}
          <div className="h-[12%] bg-rose-500/25 border-b border-rose-500/50 backdrop-blur-[1px] flex items-center justify-between px-3">
            <span className="text-[9px] font-black text-rose-200 flex items-center gap-1 bg-rose-950/70 px-2 py-0.5 rounded-full border border-rose-500/40">
              <ShieldAlert className="w-2.5 h-2.5 text-rose-400" />
              상단 위험: 앱 헤더/노치 가림 (12%)
            </span>
            <span className="text-[8px] text-rose-300 font-mono">Top Bar</span>
          </div>

          {/* Middle Body with Right Action Button Block */}
          <div className="flex-1 flex justify-between relative my-1">
            {/* 100% Safe Center Zone */}
            <div className="flex-1 border-2 border-dashed border-emerald-400/90 rounded-2xl m-1 p-2 bg-emerald-500/5 flex flex-col justify-between relative">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-400/50 flex items-center gap-1 shadow-xs">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  100% 안전 구역 (Safe Zone)
                </span>
                <span className="text-[8px] font-bold text-emerald-300/80">
                  자막/인물 권장
                </span>
              </div>

              <div className="text-center py-2 px-1 bg-black/40 rounded-xl backdrop-blur-xs border border-white/10 mx-auto max-w-[190px]">
                <p className="text-[10px] font-black text-emerald-200">
                  ✨ 자막 및 핵심 피사체 안심 영역
                </p>
                <p className="text-[8px] text-slate-300 mt-0.5 leading-tight">
                  이 점선 상자 안에 자막을 두면 유튜브, 인스타, 틱톡 어디서도 가려지지 않습니다.
                </p>
              </div>

              <div className="text-right">
                <span className="text-[8px] font-mono text-emerald-400/70">
                  Optimal Canvas Zone
                </span>
              </div>
            </div>

            {/* Right Danger Bar (Like/Share buttons) */}
            <div className="w-[18%] bg-amber-500/25 border-l border-amber-500/50 backdrop-blur-[1px] flex flex-col items-center justify-center p-1 text-center">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-300 mb-1" />
              <span className="text-[8px] font-black text-amber-200 leading-tight">
                우측 위험
              </span>
              <span className="text-[7px] text-amber-100/90 mt-0.5 leading-tight">
                하트/댓글/공유 버튼 (18%)
              </span>
            </div>
          </div>

          {/* Bottom Danger Bar (Profile & Caption) */}
          <div className="h-[22%] bg-rose-500/25 border-t border-rose-500/50 backdrop-blur-[1px] flex flex-col justify-center px-3 py-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black text-rose-200 flex items-center gap-1 bg-rose-950/70 px-2 py-0.5 rounded-full border border-rose-500/40">
                <ShieldAlert className="w-2.5 h-2.5 text-rose-400" />
                하단 위험: 프로필·제목·음악바 가림 (22%)
              </span>
              <span className="text-[8px] text-rose-300 font-mono">Bottom Info</span>
            </div>
            <p className="text-[8px] text-rose-100/80 leading-tight">
              ⚠️ 자막 위치가 너무 아래에 있으면 앱 제목과 계정 정보에 자막이 겹쳐 보이지 않습니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

interface PlatformGuideSelectorProps {
  currentPlatform: PlatformGuideType;
  onChangePlatform: (platform: PlatformGuideType) => void;
  className?: string;
}

export const PlatformGuideSelector: React.FC<PlatformGuideSelectorProps> = ({
  currentPlatform,
  onChangePlatform,
  className = '',
}) => {
  const options: { id: PlatformGuideType; label: string; icon: string; activeClass: string }[] = [
    { id: 'none', label: '가이드 끔', icon: '✕', activeClass: 'bg-slate-700 text-white font-black shadow-xs' },
    { id: 'youtube', label: '유튜브', icon: '🔴', activeClass: 'bg-red-600 text-white font-black shadow-xs shadow-red-600/30' },
    { id: 'instagram', label: '인스타그램', icon: '🟣', activeClass: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black shadow-xs' },
    { id: 'tiktok', label: '틱톡', icon: '🎵', activeClass: 'bg-slate-900 text-cyan-300 font-black border border-cyan-400/40 shadow-xs' },
    { id: 'safezone', label: '안전구역', icon: '📐', activeClass: 'bg-emerald-600 text-white font-black shadow-xs shadow-emerald-600/30' },
  ];

  return (
    <div className={`flex flex-col items-center space-y-1.5 ${className}`}>
      <div className="flex items-center space-x-1 bg-slate-200/90 p-1 rounded-2xl border border-slate-300/80 text-[11px] font-bold shadow-2xs max-w-full overflow-x-auto">
        <span className="text-[10px] text-slate-500 font-black px-1.5 shrink-0 hidden sm:inline">
          플랫폼 가이드:
        </span>
        {options.map((opt) => {
          const isActive = currentPlatform === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChangePlatform(opt.id)}
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl transition flex items-center space-x-1 cursor-pointer shrink-0 active:scale-95 ${
                isActive
                  ? opt.activeClass
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/60'
              }`}
              title={`${opt.label} 미리보기 UI 오버레이`}
            >
              <span className="text-xs">{opt.icon}</span>
              <span className="whitespace-nowrap">{opt.label}</span>
            </button>
          );
        })}
      </div>

      {currentPlatform !== 'none' && (
        <p className="text-[10px] text-indigo-600 font-extrabold flex items-center gap-1 animate-in fade-in duration-150">
          <span>💡</span>
          <span>
            {currentPlatform === 'safezone'
              ? '녹색 점선(안전구역) 안에 자막을 배치하면 어떤 SNS 앱에서도 자막이 가려지지 않습니다!'
              : `${options.find(o => o.id === currentPlatform)?.label} 앱에서 좋아요·댓글·프로필에 영상이나 자막이 가려지는지 확인 중입니다 (실제 다운로드 영상에는 표시되지 않는 가이드 레이어입니다).`}
          </span>
        </p>
      )}
    </div>
  );
};
