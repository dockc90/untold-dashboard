import React from 'react';
import {
  Sparkles,
  Target,
  ShieldCheck,
  Film,
  Layers,
  Briefcase,
  Compass,
  Clock,
  ArrowRight,
  BookOpen,
  TrendingUp,
} from 'lucide-react';

interface AboutProgramViewProps {
  onStartStudio: () => void;
  onOpenManual?: () => void;
  onOpenSponsorKit?: () => void;
}

export const AboutProgramView: React.FC<AboutProgramViewProps> = ({
  onStartStudio,
  onOpenManual,
  onOpenSponsorKit,
}) => {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-8 text-[#37352F]">
      {/* Hero Section */}
      <div className="bg-white rounded-3xl border border-[#E9E9E7] p-6 sm:p-8 shadow-[0_1px_4px_rgba(0,0,0,0.03)] space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-extrabold">
          <Compass className="w-3.5 h-3.5" />
          <span>Untold (AutoShorts AI 2.0) 프로그램 소개</span>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-[#191919] tracking-tight leading-snug">
          하루 15–20분 투자로 ‘1인 언론사’ 인물 쇼츠·릴스·틱톡 채널을 운영하는 올인원 제작 스튜디오
        </h1>

        <p className="text-xs sm:text-sm text-[#5C5A54] leading-relaxed">
          이 프로그램은 영상 편집을 전문으로 배워본 적 없거나 시간이 부족한 직장인·크리에이터·가족 팀도
          <strong> 화제의 인물 발굴부터 5단계 후킹 대본, AI 성우, 자막, 9:16 영상 렌더링, 인스타그램 캐러셀 변환</strong>까지
          별도의 유료 편집 프로그램 없이 웹 브라우저에서 한 번에 끝낼 수 있도록 만들었습니다.
        </p>

        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={onStartStudio}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#23272A] hover:bg-black text-white text-xs sm:text-sm font-extrabold shadow-sm transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>지금 바로 쇼츠 만들기</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {onOpenManual && (
            <button
              type="button"
              onClick={onOpenManual}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs sm:text-sm font-bold transition cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>제작 실전 매뉴얼 보기</span>
            </button>
          )}
        </div>
      </div>

      {/* Why People Content + Goals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#E9E9E7] p-5 space-y-2.5">
          <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-extrabold text-[#191919]">1. 왜 ‘화제의 인물’인가요?</h3>
          <p className="text-xs text-[#5C5A54] leading-relaxed">
            모르는 일반인의 일상 영상은 클릭을 얻기 어렵지만, 대중이 이미 아는 인물(기업인·스포츠 스타·아티스트 등)은
            아는 얼굴과 이름만으로도 첫 3초 시선을 멈추게 하고 댓글·공유 반응을 빠르게 끌어냅니다.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E9E9E7] p-5 space-y-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-extrabold text-[#191919]">2. ‘홍보팀 마인드’ 안전 서사</h3>
          <p className="text-xs text-[#5C5A54] leading-relaxed">
            자극적인 비난·악인전·루머는 초상권·명예훼손 리스크와 광고주 기피로 이어집니다. Untold는 철저히
            <strong> 미담·위기 극복·소박한 인간미·통 큰 결단</strong>만 다루어 채널과 수익을 안전하게 지킵니다.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E9E9E7] p-5 space-y-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-extrabold text-[#191919]">3. 1편 제작으로 3대 플랫폼 동시 수익</h3>
          <p className="text-xs text-[#5C5A54] leading-relaxed">
            한 번 만든 스토리로 <strong>유튜브 쇼츠 · 인스타그램(릴스+캐러셀) · 틱톡</strong>에 동시에 올릴 수 있어
            조회수 수익뿐 아니라 인스타 보너스 및 기업 브랜디드 광고(협찬)까지 연결할 수 있습니다.
          </p>
        </div>
      </div>

      {/* 5-Step Workflow Explanation */}
      <div className="bg-white rounded-3xl border border-[#E9E9E7] p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-base sm:text-lg font-black text-[#191919]">
            이 프로그램으로 할 수 있는 핵심 기능 5가지
          </h2>
          <span className="text-[11px] font-bold text-[#787774] bg-[#F1F1EF] px-2.5 py-1 rounded-full">
            소재 발굴 → 대본 → 영상 → 캐러셀 → 협찬
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
          <div className="p-4 rounded-2xl bg-[#FBFBFA] border border-[#EDEDEB] space-y-1.5">
            <div className="font-extrabold text-[#191919] flex items-center gap-1.5">
              <Target className="w-4 h-4 text-indigo-600" />
              <span>① 실시간·월간 인물 발굴 & 채널 고정 브랜딩</span>
            </div>
            <p className="text-[#5C5A54] leading-relaxed">
              24시간/48시간 급상승 인물부터 30일 스테디셀러까지 찾아주고, <strong>내 채널 단일 카테고리 고정</strong>으로 채널 색깔이 섞이지 않게 지켜줍니다. 논란 인물은 <strong>논란 우회 공략</strong>으로 긍정 대안 인물을 추천해 줍니다.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FBFBFA] border border-[#EDEDEB] space-y-1.5">
            <div className="font-extrabold text-[#191919] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>② 100만 뷰 5단계 쇼츠 대본 & 1인 3각도 연작</span>
            </div>
            <p className="text-[#5C5A54] leading-relaxed">
              0–3초 후킹부터 여운 엔딩까지 5단계 구조로 대본을 생성하고, 터진 인물 1명을 <strong>무명·초창기 / 소박한 반전 / 눈물·감동</strong> 3편 연작으로 확장할 수 있습니다. <strong>🔍 사진 찾기</strong>로 실제 기사 사진도 1초 만에 찾습니다.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FBFBFA] border border-[#EDEDEB] space-y-1.5">
            <div className="font-extrabold text-[#191919] flex items-center gap-1.5">
              <Film className="w-4 h-4 text-rose-600" />
              <span>③ 9:16 영상 제작 · 화면 자르기 · BGM/음성 분리</span>
            </div>
            <p className="text-[#5C5A54] leading-relaxed">
              AI 성우(ElevenLabs/Gemini)와 자막 싱크를 자동 입히고, <strong>유튜브 기본 음원 모드</strong>로 저작권 걱정 없이 내보냅니다. 참고 쇼츠/릴스 클립을 넣을 때는 <strong>화면 자르기(Crop)</strong>와 <strong>BGM·음성 분리</strong>도 바로 가능합니다.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FBFBFA] border border-[#EDEDEB] space-y-1.5">
            <div className="font-extrabold text-[#191919] flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-pink-600" />
              <span>④ 인스타 캐러셀 변환 & 협찬 단가표 생성</span>
            </div>
            <p className="text-[#5C5A54] leading-relaxed">
              완성한 대본·사진을 클릭 한 번으로 인스타그램 카드뉴스(캐러셀)로 변환하고, 유튜브·인스타·틱톡 합산 지표 기반의 <strong>내 협찬 단가표 & 광고 제안 메일</strong>까지 자동으로 만들어 줍니다.
            </p>
          </div>
        </div>

        {onOpenSponsorKit && (
          <div className="pt-2 flex items-center justify-between flex-wrap gap-2 border-t border-[#EDEDEB]">
            <span className="text-xs text-[#787774]">
              채널이 성장한 뒤 기업/대행사 협찬을 제안할 때는 상단 <strong>‘내 협찬 단가표’</strong>를 바로 활용하세요.
            </span>
            <button
              type="button"
              onClick={onOpenSponsorKit}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold transition cursor-pointer"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>내 협찬 단가표 열어보기</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
