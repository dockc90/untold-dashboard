import React from 'react';

/**
 * 🌟 Official Brand Icons & Badges
 * 인스타그램, 유튜브, 네이버, 오늘의집, 틱톡, 캡컷 등 공식 브랜드 고유 아이콘 및 비주얼 배지
 */

// 1. 인스타그램 (Instagram) 공식 카메라 글리프 & 그라데이션
export const InstagramIcon: React.FC<{ className?: string; size?: number }> = ({ 
  className = "w-4 h-4", 
  size 
}) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor"
    style={size ? { width: size, height: size } : undefined}
    className={className}
    aria-label="Instagram"
  >
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

// 인스타그램 컬러풀 그라데이션 배지
export const InstagramBadge: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ 
  size = 'md',
  className = ""
}) => {
  const sizeClasses = {
    sm: 'w-5 h-5 rounded-md p-0.5',
    md: 'w-7 h-7 rounded-lg p-1',
    lg: 'w-9 h-9 rounded-xl p-1.5'
  };

  return (
    <div 
      className={`inline-flex items-center justify-center bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white shadow-xs shrink-0 transition-transform hover:scale-105 ${sizeClasses[size]} ${className}`}
      title="인스타그램 (Instagram)"
    >
      <InstagramIcon className="w-full h-full fill-white" />
    </div>
  );
};

// 2. 유튜브 (YouTube) 공식 플레이 로고 & 배지
export const YouTubeIcon: React.FC<{ className?: string; size?: number }> = ({ 
  className = "w-5 h-5", 
  size 
}) => (
  <svg 
    viewBox="0 0 24 24" 
    style={size ? { width: size, height: size } : undefined}
    className={className}
    aria-label="YouTube"
  >
    <path 
      fill="#FF0000" 
      d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
    />
    <path fill="#FFFFFF" d="m9.545 15.568 6.273-3.568-6.273-3.568z"/>
  </svg>
);

export const YouTubeBadge: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ 
  size = 'md',
  className = ""
}) => {
  const sizeClasses = {
    sm: 'w-5 h-5 rounded-md',
    md: 'w-7 h-7 rounded-lg',
    lg: 'w-9 h-9 rounded-xl'
  };

  return (
    <div 
      className={`inline-flex items-center justify-center bg-[#FF0000] text-white shadow-xs shrink-0 transition-transform hover:scale-105 ${sizeClasses[size]} ${className}`}
      title="유튜브 (YouTube)"
    >
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white">
        <path d="m9.545 15.568 6.273-3.568-6.273-3.568z"/>
      </svg>
    </div>
  );
};

// 3. 네이버 (Naver) 공식 그린 N 로고 & 배지
export const NaverIcon: React.FC<{ className?: string; size?: number }> = ({
  className = "w-4 h-4",
  size
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    style={size ? { width: size, height: size } : undefined}
    className={className}
    aria-label="Naver"
  >
    <path d="M16.273 12.845 7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z" />
  </svg>
);

export const NaverBadge: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className = ""
}) => {
  const sizeClasses = {
    sm: 'w-5 h-5 rounded-md p-1',
    md: 'w-7 h-7 rounded-lg p-1.5',
    lg: 'w-9 h-9 rounded-xl p-2'
  };

  return (
    <div
      className={`inline-flex items-center justify-center bg-[#03C75A] text-white shadow-xs shrink-0 transition-transform hover:scale-105 ${sizeClasses[size]} ${className}`}
      title="네이버 (Naver)"
    >
      <NaverIcon className="w-full h-full fill-white" />
    </div>
  );
};

// 4. 틱톡 (TikTok) 뮤직 음표 배지
export const TikTokBadge: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ 
  size = 'md',
  className = ""
}) => {
  const sizeClasses = {
    sm: 'w-5 h-5 rounded-md p-1',
    md: 'w-7 h-7 rounded-lg p-1.5',
    lg: 'w-9 h-9 rounded-xl p-2'
  };

  return (
    <div 
      className={`inline-flex items-center justify-center bg-[#010101] text-white shadow-xs shrink-0 transition-transform hover:scale-105 ${sizeClasses[size]} ${className}`}
      title="틱톡 (TikTok)"
    >
      <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68 6.34 6.34 0 0 0 9.35 22a6.33 6.33 0 0 0 6.38-6.32V9.06a8.16 8.16 0 0 0 4.86 1.6V7.21a4.84 4.84 0 0 1-1-.52z" />
      </svg>
    </div>
  );
};

// 5. 오늘의집 (OHouse) 시그니처 배지
export const OHouseBadge: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ 
  size = 'md',
  className = ""
}) => {
  const sizeClasses = {
    sm: 'w-5 h-5 rounded-md text-[9px]',
    md: 'w-7 h-7 rounded-lg text-xs',
    lg: 'w-9 h-9 rounded-xl text-sm'
  };

  return (
    <div 
      className={`inline-flex items-center justify-center bg-[#35C5F0] text-white font-extrabold shadow-xs shrink-0 transition-transform hover:scale-105 ${sizeClasses[size]} ${className}`}
      title="오늘의집 (OHouse)"
    >
      <span className="leading-none tracking-tighter">집</span>
    </div>
  );
};

// 6. 캡컷 (CapCut) 배지
export const CapCutBadge: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ 
  size = 'md',
  className = ""
}) => {
  const sizeClasses = {
    sm: 'w-5 h-5 rounded-md',
    md: 'w-7 h-7 rounded-lg',
    lg: 'w-9 h-9 rounded-xl'
  };

  return (
    <div 
      className={`inline-flex items-center justify-center bg-[#191919] border border-[#3F4448] text-white font-bold shadow-xs shrink-0 transition-transform hover:scale-105 ${sizeClasses[size]} ${className}`}
      title="캡컷 (CapCut)"
    >
      <span className="text-white text-[10px] font-mono leading-none">✂️</span>
    </div>
  );
};
