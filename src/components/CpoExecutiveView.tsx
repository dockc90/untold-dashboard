import React, { useState } from 'react';
import { 
  TrendingUp, 
  Clock, 
  ShieldCheck, 
  DollarSign, 
  Users, 
  Layers, 
  Sparkles, 
  Award, 
  PieChart, 
  BarChart3, 
  CheckCircle2, 
  ArrowUpRight,
  Calculator,
  ChevronRight,
  Briefcase,
  Target,
  Zap,
  Flame,
  Check
} from 'lucide-react';

export const CpoExecutiveView: React.FC = () => {
  // Interactive ROI Calculator State
  const [channelsCount, setChannelsCount] = useState<number>(2);
  const [videosPerDay, setVideosPerDay] = useState<number>(2);
  const [avgViews, setAvgViews] = useState<number>(250000); // 25만 뷰
  const [sponsoredDeals, setSponsoredDeals] = useState<number>(1); // 건당 200만 원

  // Calculations
  const totalMonthlyVideos = channelsCount * videosPerDay * 30;
  const totalMonthlyViews = totalMonthlyVideos * avgViews;
  const estimatedAdRevenue = Math.round((totalMonthlyViews / 1000) * 180);
  const sponsorshipRevenue = sponsoredDeals * 2000000;
  const totalMonthlyRevenue = estimatedAdRevenue + sponsorshipRevenue;

  // Time savings: Manual takes 3 hours (180 mins) per short. With HeyPapa, takes 20 mins.
  const hoursSaved = Math.round((totalMonthlyVideos * (180 - 20)) / 60);

  return (
    <div className="w-full min-w-0 max-w-full space-y-8 pb-16 text-slate-800 animate-fadeIn">
      {/* Header Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-50/80 via-white to-amber-50/50 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-200">
              월 500만+ 실전 로드맵
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
              Untold AutoShorts 수익 전략 보고서
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            화제의 인물 숏폼 자동화 사업화 전략 & 3단계 실행 마일스톤
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed font-medium">
            영상에서 검증된 <strong className="text-slate-900">1개월 차 300만 원 ➔ 3개월 차 500만 원 달성 공식</strong>을 그대로 시스템화했습니다. 
            단순 노가다 작업이 아닌, 네이버·유튜브·인스타 3대 트렌드 소싱과 AI 고속 제작 파이프라인을 결합하여 직장인 및 1인 창작자가 시간 레버리지를 극대화하는 실행 가이드입니다.
          </p>
        </div>
      </div>

      {/* 1. Problem & Solution Comparison (The Bottleneck) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Existing Bottleneck */}
        <div className="p-6 rounded-3xl bg-white border border-rose-200 shadow-2xs space-y-4">
          <div className="flex items-center space-x-2 text-rose-600 font-extrabold text-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span>기존 숏폼 수동 제작의 4대 핵심 병목</span>
          </div>
          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100 space-y-1">
              <span className="font-bold text-rose-900">1. 매일 겪는 소재 고갈과 감에 의존한 기획 (2시간 소요)</span>
              <p className="text-slate-600">어떤 인물이 오늘 터질지 몰라 포털 뉴스와 커뮤니티를 온종일 탐색하지만 결국 조회수 100회 미만 정체.</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100 space-y-1">
              <span className="font-bold text-rose-900">2. 3초 이탈률과 대본 작성 스트레스 (1시간 소요)</span>
              <p className="text-slate-600">초반 3초 후킹 실패 시 알고리즘 사망. 일반인이 흡입력 있는 대본과 카피를 매일 쓰기 불가능.</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100 space-y-1">
              <span className="font-bold text-rose-900">3. 3초 컷 이미지 수집 노가다 (1시간 소요)</span>
              <p className="text-slate-600">60초 영상에 12~15장의 사진이 필요한데, 어떤 키워드로 구글링할지 몰라 헤매다 지침.</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100 space-y-1">
              <span className="font-bold text-rose-900">4. 저작권 경고 및 채널 삭제 공포</span>
              <p className="text-slate-600">방송 화면을 그대로 캡처해 쓰다가 저작권 경고 누적으로 채널 폐쇄 및 수익 창출 박탈 위험 상존.</p>
            </div>
          </div>
        </div>

        {/* AutoShorts Solution */}
        <div className="p-6 rounded-3xl bg-white border border-emerald-200 shadow-2xs space-y-4">
          <div className="flex items-center space-x-2 text-emerald-700 font-extrabold text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Untold 도입 후 혁신 (93% 시간 절감 & 100% 안전)</span>
          </div>
          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-1">
              <span className="font-bold text-emerald-950">1. 트렌드 레이더 실시간 교차 소싱 (10초 완결)</span>
              <p className="text-slate-600">네이버 검색량 + 유튜브 쇼츠 조회수 + 릴스 바이럴 지표를 교차 검증해 화제성 95+ 인물 자동 추천.</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-1">
              <span className="font-bold text-emerald-950">2. 3초 후킹 3단 선택기 & 15인 자연 성우 (10초 완결)</span>
              <p className="text-slate-600">질문형/도발형/감성형 후킹 선택 + 15명 전문 성우 음성 및 1.1x 황금 배속으로 시청 유지율 85% 달성.</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-1">
              <span className="font-bold text-emerald-950">3. 씬별 사진 업로드 & 줌인/팬 모션 효과 (5분 완결)</span>
              <p className="text-slate-600">3초 단위 씬에 맞춤형 이미지 업로드 + 슬로우 줌인/팬 카메라 무빙으로 시각적 지루함 완전 탈피.</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-1">
              <span className="font-bold text-emerald-950">4. 1080p 고화질 쇼츠 직접 렌더링 & 2차 저작권 보호</span>
              <p className="text-slate-600">상단 워터마크 없는 깔끔한 9:16 비디오 생성 + 헌정형 스토리텔링으로 유튜브 공정 이용(Fair Use) 100% 충족.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive ROI & Financial Simulator */}
      <div className="p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">채널 운영 수익 & 시간 절감 시뮬레이터 (Unit Economics)</h3>
              <p className="text-xs text-slate-500">영상 속 실제 성과(월 500만 원 + 협찬 200만 원) 기준 현실적 추정 모델</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-500 font-medium">월 예상 총 창출 가치</span>
            <p className="text-2xl font-black text-indigo-700">
              {totalMonthlyRevenue.toLocaleString()}원 / 월
            </p>
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex justify-between font-bold text-slate-700">
              <span>운영 채널 수</span>
              <span className="text-indigo-600 font-black">{channelsCount}개</span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              value={channelsCount}
              onChange={(e) => setChannelsCount(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <p className="text-[10px] text-slate-500">1인 최대 2~3개 채널 병행 권장</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex justify-between font-bold text-slate-700">
              <span>채널당 1일 업로드 수</span>
              <span className="text-indigo-600 font-black">{videosPerDay}편</span>
            </div>
            <input
              type="range"
              min={1}
              max={4}
              value={videosPerDay}
              onChange={(e) => setVideosPerDay(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <p className="text-[10px] text-slate-500">Untold 기준 하루 30분~1시간 투자</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex justify-between font-bold text-slate-700">
              <span>편당 평균 조회수</span>
              <span className="text-indigo-600 font-black">{(avgViews / 10000).toFixed(0)}만 뷰</span>
            </div>
            <input
              type="range"
              min={50000}
              max={1000000}
              step={50000}
              value={avgViews}
              onChange={(e) => setAvgViews(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <p className="text-[10px] text-slate-500">쇼츠 터질 시 편당 100만~500만 뷰</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex justify-between font-bold text-slate-700">
              <span>월간 외부 광고/협찬 건수</span>
              <span className="text-rose-600 font-black">{sponsoredDeals}건</span>
            </div>
            <input
              type="range"
              min={0}
              max={4}
              value={sponsoredDeals}
              onChange={(e) => setSponsoredDeals(Number(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer"
            />
            <p className="text-[10px] text-slate-500">건당 평균 단가 150만~200만 원</p>
          </div>
        </div>

        {/* Calculated Results Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-center">
            <span className="text-[11px] text-indigo-700 font-bold">월 총 조회수</span>
            <p className="text-xl font-black text-slate-900 mt-0.5">
              {(totalMonthlyViews / 100000000 >= 1
                ? `${(totalMonthlyViews / 100000000).toFixed(1)}억`
                : `${Math.round(totalMonthlyViews / 10000)}만`)} 회
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 text-center">
            <span className="text-[11px] text-amber-700 font-bold">조회수 광고 수익 (추정)</span>
            <p className="text-xl font-black text-slate-900 mt-0.5">
              {estimatedAdRevenue.toLocaleString()}원
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-center">
            <span className="text-[11px] text-rose-700 font-bold">브랜드 광고/협찬 수익</span>
            <p className="text-xl font-black text-slate-900 mt-0.5">
              {sponsorshipRevenue.toLocaleString()}원
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
            <span className="text-[11px] text-emerald-700 font-bold">월간 절감 업무 시간</span>
            <p className="text-xl font-black text-emerald-700 mt-0.5">
              +{hoursSaved}시간 절약
            </p>
          </div>
        </div>
      </div>

      {/* 3. Detailed 3-Phase Execution Roadmap */}
      <div className="p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <span>0원에서 월 500만 원까지: 3단계 프로덕트 & 채널 성장 마일스톤</span>
          </h3>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            총 90일 완성 로드맵
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
          {/* Phase 1 */}
          <div className="p-5 rounded-2xl bg-indigo-50/50 border-2 border-indigo-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-lg font-black bg-indigo-600 text-white text-[11px]">
                1단계: 1~30일차 (기초 빌드업)
              </span>
              <span className="text-indigo-700 font-extrabold">목표: 30편 누적</span>
            </div>
            
            <h4 className="font-extrabold text-sm text-slate-900">
              알고리즘 신뢰도 확보 & 첫 떡상 경험
            </h4>

            <p className="text-slate-600 leading-relaxed font-medium">
              초반 30일은 유튜브 알고리즘이 채널의 카테고리와 시청 타겟을 학습하는 시기입니다. 1일 1쇼츠 원칙을 지키며 포기하지 않는 것이 핵심입니다.
            </p>

            <div className="p-3 rounded-xl bg-white border border-indigo-100 space-y-1.5 font-medium">
              <div className="font-extrabold text-slate-800 flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-indigo-600" /> 실행 목표 체크리스트
              </div>
              <ul className="text-slate-600 space-y-1 list-disc list-inside">
                <li>Untold 화제성 95+ 인물로 매일 1편씩 총 30편 업로드</li>
                <li>도입부 3초 후킹 질문형/도발형 A/B 테스트</li>
                <li>성우 15인 중 최적 목소리 2~3종 선정 (1.1x 배속 고정)</li>
                <li>시청 지속 시간(AVD) 70% 이상 달성 데이터 확인</li>
              </ul>
            </div>

            <div className="pt-1 text-[11px] font-bold text-indigo-900 bg-indigo-100/70 p-2.5 rounded-xl">
              💰 예상 수익: 0원 ~ 50만 원 (조회수 터지기 전 씨앗 뿌리기)
            </div>
          </div>

          {/* Phase 2 */}
          <div className="p-5 rounded-2xl bg-amber-50/50 border-2 border-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-lg font-black bg-amber-600 text-white text-[11px]">
                2단계: 31~60일차 (수익 창출 승인)
              </span>
              <span className="text-amber-800 font-extrabold">목표: 구독자 1,000명</span>
            </div>
            
            <h4 className="font-extrabold text-sm text-slate-900">
              YPP 승인 & 조회수 수익 본격화 (월 200~300만)
            </h4>

            <p className="text-slate-600 leading-relaxed font-medium">
              누적 영상 중 1~2편이 1,000만 뷰 이상 바이럴을 타며 유튜브 파트너 프로그램(YPP) 조건을 순식간에 충족하고 실질적인 현금 수익이 발생합니다.
            </p>

            <div className="p-3 rounded-xl bg-white border border-amber-100 space-y-1.5 font-medium">
              <div className="font-extrabold text-slate-800 flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-amber-600" /> 실행 목표 체크리스트
              </div>
              <ul className="text-slate-600 space-y-1 list-disc list-inside">
                <li>쇼츠 조회수 1,000만 뷰 & 구독자 1,000명 YPP 승인 신청</li>
                <li>조회수 상위 20% 인물군(스포츠/아이돌) 집중 공략</li>
                <li>고정 댓글 활용 시청자 반응 및 참여율 3배 극대화</li>
                <li>1080p 고화질 렌더링 유지로 프리미엄 피드 노출</li>
              </ul>
            </div>

            <div className="pt-1 text-[11px] font-bold text-amber-900 bg-amber-100/70 p-2.5 rounded-xl">
              💰 예상 수익: 월 200만 ~ 350만 원 (조회수 정산 첫 입금)
            </div>
          </div>

          {/* Phase 3 */}
          <div className="p-5 rounded-2xl bg-rose-50/50 border-2 border-rose-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-lg font-black bg-rose-600 text-white text-[11px]">
                3단계: 61~90일차 (스케일업)
              </span>
              <span className="text-rose-800 font-extrabold">목표: 월 500만+ 파이프라인</span>
            </div>
            
            <h4 className="font-extrabold text-sm text-slate-900">
              외부 광고 협찬 유치 & 2호 채널 확장
            </h4>

            <p className="text-slate-600 leading-relaxed font-medium">
              채널 구독자가 3만~5만 명을 넘어서면 기업 및 브랜드에서 건당 150~200만 원 선의 광고 제안이 들어옵니다. 광고 수익과 조회수 수익이 결합됩니다.
            </p>

            <div className="p-3 rounded-xl bg-white border border-rose-100 space-y-1.5 font-medium">
              <div className="font-extrabold text-slate-800 flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-rose-600" /> 실행 목표 체크리스트
              </div>
              <ul className="text-slate-600 space-y-1 list-disc list-inside">
                <li>비즈니스 메일 세팅 및 월 1~2건 브랜드 협찬 수주 (건당 200만)</li>
                <li>서브 채널(2호 채널) 론칭 및 동일 소재 멀티 배포</li>
                <li>인스타그램 릴스 & 틱톡 동시 업로드로 트래픽 다각화</li>
                <li>제작 시간 편당 15분으로 단축하여 주 10편 시스템화</li>
              </ul>
            </div>

            <div className="pt-1 text-[11px] font-bold text-rose-900 bg-rose-100/70 p-2.5 rounded-xl">
              💰 예상 수익: 월 500만 ~ 700만 원+ (조회수 300만 + 광고 200만)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
