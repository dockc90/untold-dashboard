import React, { useEffect, useMemo, useState } from 'react';
import { X, Briefcase, Copy, Check, TrendingUp, Mail, Sparkles, Calculator } from 'lucide-react';
import { CategoryType, ChannelBranding } from '../types';

interface SponsorKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelBranding?: ChannelBranding;
}

const CATEGORY_LABEL_MAP: Record<CategoryType, string> = {
  all: '화제 인물·미담 종합',
  upcoming: '선점·이슈 인물',
  viral: '바이럴·트렌드 인물',
  entertainment: '연예·아티스트',
  actor: '배우·콘텐츠',
  sports: '스포츠 스타',
  economy: '국내외 기업인·부자·CEO',
  global: '글로벌 리더·셀럽',
  social: '공공·사회 미담 인물',
};

export const SponsorKitModal: React.FC<SponsorKitModalProps> = ({
  isOpen,
  onClose,
  channelBranding,
}) => {
  const [channelName, setChannelName] = useState(channelBranding?.channelName || '언톨드 스토리');
  const [contactEmail, setContactEmail] = useState(channelBranding?.contactEmail || 'contact@example.com');
  const [brandTarget, setBrandTarget] = useState('국내 주요 기업 홍보팀 / 마케팅 대행사');
  const [ytSubs, setYtSubs] = useState(12000);
  const [ytAvgViews, setYtAvgViews] = useState(85000);
  const [igFollowers, setIgFollowers] = useState(9500);
  const [igAvgViews, setIgAvgViews] = useState(65000);
  const [ttFollowers, setTtFollowers] = useState(15000);
  const [ttAvgViews, setTtAvgViews] = useState(110000);
  const [activeTab, setActiveTab] = useState<'pitch' | 'ratecard' | 'native'>('pitch');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const categoryLabel =
    CATEGORY_LABEL_MAP[channelBranding?.pinnedCategory || 'economy'] || '국내외 기업인·화제 인물';

  const metrics = useMemo(() => {
    const totalFollowers = Math.max(0, ytSubs) + Math.max(0, igFollowers) + Math.max(0, ttFollowers);
    const totalViewsPerContent =
      Math.max(0, ytAvgViews) + Math.max(0, igAvgViews) + Math.max(0, ttAvgViews);

    // 3사 합산 평균 조회수 기준 1인 언론사 브랜디드 단가 산정 (기본 100만~300만+ 구간)
    const basePriceMan =
      totalViewsPerContent >= 500000
        ? 300
        : totalViewsPerContent >= 250000
        ? 200
        : totalViewsPerContent >= 100000
        ? 150
        : 100;

    const packagePriceMan = Math.round(basePriceMan * 1.4);

    return {
      totalFollowers,
      totalViewsPerContent,
      basePriceMan,
      packagePriceMan,
    };
  }, [ytSubs, ytAvgViews, igFollowers, igAvgViews, ttFollowers, ttAvgViews]);

  const formatNum = (n: number) => n.toLocaleString('ko-KR');

  const pitchText = `[협업 제안] '${brandTarget}' 브랜드 신뢰도를 높이는 ${categoryLabel} 숏폼 네이티브 스토리텔링 제안 (${channelName})

안녕하세요, '${channelName}' 채널을 운영하고 있는 크리에이터입니다.
저희 채널은 자극적인 가십이나 비난성 루머를 일절 배제하고, 오직 긍정적인 미담·위기 극복·통 큰 결단·인간적인 매력만을 다루는 100% 브랜드 세이프(Brand-Safe) 인물 숏폼 미디어입니다.

현재 저희 채널은 콘텐츠 1편 제작 시 유튜브 쇼츠 + 인스타그램(릴스·캐러셀) + 틱톡 3대 플랫폼에 동시 송출(OSMU)하고 있으며, 3사 합산 지표는 다음과 같습니다.

■ 3대 플랫폼 합산 채널 지표 (1편 업로드 기준)
- 합산 팔로워/구독자: ${formatNum(metrics.totalFollowers)}명
  (유튜브 ${formatNum(ytSubs)} / 인스타그램 ${formatNum(igFollowers)} / 틱톡 ${formatNum(ttFollowers)})
- 콘텐츠 1편당 3사 합산 평균 조회수: ${formatNum(metrics.totalViewsPerContent)}회 이상
  (유튜브 ${formatNum(ytAvgViews)} / 인스타 ${formatNum(igAvgViews)} / 틱톡 ${formatNum(ttAvgViews)})

■ 제안 방식 (광고 티 나지 않는 네이티브 미담 서사)
단순 제품 나열이 아니라, 대표님·임직원 또는 브랜드 탄생 비화에 담긴 '사람을 향한 진심과 철학'을 60초 5단계 스토리로 풀어내어 시청자가 자발적으로 칭찬 댓글을 남기고 공유하게 만듭니다.

■ 예상 제작 단가 (3사 동시 송출 기준)
- 숏폼 1편 단독 브랜디드 제작(유튜브·인스타·틱톡 동시 업로드): ${metrics.basePriceMan}만 원 (VAT 별도)
- 숏폼 + 인스타 캐러셀(카드뉴스) 풀 패키지: ${metrics.packagePriceMan}만 원 (VAT 별도)

검토 후 회신 주시면 귀사에 맞춘 60초 스토리 기획안 2종을 먼저 공유드리겠습니다.
감사합니다.

${channelName} 드림
문의: ${contactEmail}`;

  const rateCardText = `[${channelName}] 2026 미디어 킷 & 3사 통합 광고 단가표

1. 채널 포지셔닝: ${categoryLabel} 전문 (100% 긍정 서사 · 초상권/브랜드 세이프 준수)
2. 3대 플랫폼 합산 리치:
   - 합산 팔로워: ${formatNum(metrics.totalFollowers)}명
   - 1편당 합산 평균 조회수: ${formatNum(metrics.totalViewsPerContent)}뷰
   - 플랫폼 세부: YouTube Shorts(${formatNum(ytAvgViews)}) + Instagram(${formatNum(igAvgViews)}) + TikTok(${formatNum(ttAvgViews)})

3. 상품별 단가 안내 (VAT 별도)
   - [Option A] 숏폼 브랜디드 1편 (3사 동시 업로드): ${metrics.basePriceMan}만 원
   - [Option B] 숏폼 1편 + 인스타 캐러셀 카드뉴스 패키지: ${metrics.packagePriceMan}만 원
   - [Option C] 기획 시리즈 3부작 (무명/반전/감동 3각도): ${Math.round(metrics.basePriceMan * 2.5)}만 원

4. 포함 혜택
   - 홍보팀 검토 완료 후 최종 송출 (대본 사전 컨펌 100% 반영)
   - 고정 댓글 브랜드 링크/캠페인 문구 세팅
   - 2차 활용(자사 SNS·리포트 인용) 협의 가능

문의처: ${contactEmail}`;

  const nativeGuideText = `[브랜디드 네이티브 광고 5단계 황금 구조 (CJ 저단백밥 스타일)]

1단계 (0~3초 후킹):
"적자만 보는 제품인데 17년째 절대 단종시키지 않는 기업이 있다?"

2단계 (3~15초 사연/계기):
임직원 딸이 희귀 질환으로 일반 밥을 먹지 못한다는 사연을 들은 결정적 순간.

3단계 (15~40초 반전 디테일):
만들수록 손해가 나는 구조였지만 "우리가 가진 기술이 있으니 해야 한다"는 통 큰 결단.

4단계 (40~55초 성취 숫자):
누적 생산량 290만 개 돌파, 수많은 환우들에게 평범한 일상을 돌려준 기적의 기록.

5단계 (55~60초 여운 엔딩 — 광고주 극찬 포인트):
"사업의 가치는 숫자로만 남지 않는다. 누군가의 삶을 바꿨을 때 기업의 존재 이유가 된다."`;

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeText =
    activeTab === 'pitch' ? pitchText : activeTab === 'ratecard' ? rateCardText : nativeGuideText;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-[#E3E2DE] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#EDEDEB] bg-[#FBFBFA] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-extrabold text-[#191919] truncate">
                💼 내 채널 협찬 단가표 & 제안서 자동 생성기
              </h2>
              <p className="text-[11px] text-[#787774] truncate">
                유튜브·인스타·틱톡 3사 합산 리치로 대기업/대행사 브랜디드 광고 단가를 2배 높여 제안하세요.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#787774] hover:text-[#191919] hover:bg-[#F1F1EF] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Channel Basics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#37352F] mb-1">내 채널명</label>
              <input
                type="text"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FBFBFA] border border-[#E3E2DE] rounded-xl focus:outline-none focus:border-[#23272A]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#37352F] mb-1">광고 문의 이메일</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FBFBFA] border border-[#E3E2DE] rounded-xl focus:outline-none focus:border-[#23272A]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#37352F] mb-1">제안 대상 기업/대행사</label>
              <input
                type="text"
                value={brandTarget}
                onChange={(e) => setBrandTarget(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FBFBFA] border border-[#E3E2DE] rounded-xl focus:outline-none focus:border-[#23272A]"
              />
            </div>
          </div>

          {/* 3-Platform Input Grid */}
          <div className="bg-[#FBFBFA] border border-[#E3E2DE] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#191919]">
                <Calculator className="w-4 h-4 text-indigo-600" />
                <span>3대 플랫폼(OSMU) 지표 입력</span>
              </div>
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                주력 카테고리: {categoryLabel}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white border border-[#EDEDEB] rounded-xl p-3 space-y-2">
                <div className="text-xs font-bold text-rose-700">▶ 유튜브 쇼츠</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-[#787774]">구독자(명)</span>
                    <input
                      type="number"
                      min={0}
                      value={ytSubs}
                      onChange={(e) => setYtSubs(Number(e.target.value) || 0)}
                      className="w-full mt-0.5 px-2 py-1 text-xs border border-[#E3E2DE] rounded-lg"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#787774]">평균 조회수</span>
                    <input
                      type="number"
                      min={0}
                      value={ytAvgViews}
                      onChange={(e) => setYtAvgViews(Number(e.target.value) || 0)}
                      className="w-full mt-0.5 px-2 py-1 text-xs border border-[#E3E2DE] rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#EDEDEB] rounded-xl p-3 space-y-2">
                <div className="text-xs font-bold text-pink-700">📷 인스타 (릴스·캐러셀)</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-[#787774]">팔로워(명)</span>
                    <input
                      type="number"
                      min={0}
                      value={igFollowers}
                      onChange={(e) => setIgFollowers(Number(e.target.value) || 0)}
                      className="w-full mt-0.5 px-2 py-1 text-xs border border-[#E3E2DE] rounded-lg"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#787774]">평균 조회수</span>
                    <input
                      type="number"
                      min={0}
                      value={igAvgViews}
                      onChange={(e) => setIgAvgViews(Number(e.target.value) || 0)}
                      className="w-full mt-0.5 px-2 py-1 text-xs border border-[#E3E2DE] rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#EDEDEB] rounded-xl p-3 space-y-2">
                <div className="text-xs font-bold text-slate-900">🎵 틱톡</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-[#787774]">팔로워(명)</span>
                    <input
                      type="number"
                      min={0}
                      value={ttFollowers}
                      onChange={(e) => setTtFollowers(Number(e.target.value) || 0)}
                      className="w-full mt-0.5 px-2 py-1 text-xs border border-[#E3E2DE] rounded-lg"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#787774]">평균 조회수</span>
                    <input
                      type="number"
                      min={0}
                      value={ttAvgViews}
                      onChange={(e) => setTtAvgViews(Number(e.target.value) || 0)}
                      className="w-full mt-0.5 px-2 py-1 text-xs border border-[#E3E2DE] rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Summary KPI Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="bg-white border border-emerald-200 rounded-xl p-3">
                <div className="text-[10px] font-bold text-emerald-700">3사 합산 팔로워</div>
                <div className="text-lg font-extrabold text-[#191919] mt-0.5">
                  {formatNum(metrics.totalFollowers)}명
                </div>
              </div>
              <div className="bg-white border border-indigo-200 rounded-xl p-3">
                <div className="text-[10px] font-bold text-indigo-700">1편당 3사 합산 조회수</div>
                <div className="text-lg font-extrabold text-[#191919] mt-0.5">
                  {formatNum(metrics.totalViewsPerContent)}뷰
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <div className="text-[10px] font-bold text-amber-800">권장 브랜디드 광고 단가</div>
                <div className="text-lg font-extrabold text-amber-950 mt-0.5">
                  건당 {metrics.basePriceMan}만 ~ {metrics.packagePriceMan}만 원
                </div>
              </div>
            </div>
          </div>

          {/* Output Tabs */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="inline-flex bg-[#F1F1EF] p-1 rounded-xl border border-[#E3E2DE] text-xs gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('pitch')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                    activeTab === 'pitch' ? 'bg-white text-[#191919] shadow-xs' : 'text-[#787774]'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5 text-indigo-600" />
                  <span>광고 제안 메일 전문</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('ratecard')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                    activeTab === 'ratecard' ? 'bg-white text-[#191919] shadow-xs' : 'text-[#787774]'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span>3사 합산 단가표</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('native')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                    activeTab === 'native' ? 'bg-white text-[#191919] shadow-xs' : 'text-[#787774]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>네이티브 광고 구성안</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(activeText, activeTab)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#23272A] hover:bg-black text-white text-xs font-bold transition cursor-pointer"
              >
                {copiedKey === activeTab ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>복사 완료!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>전체 복사하기</span>
                  </>
                )}
              </button>
            </div>

            <pre className="w-full whitespace-pre-wrap font-sans text-xs leading-relaxed text-[#37352F] bg-[#FBFBFA] border border-[#E3E2DE] rounded-2xl p-4 max-h-72 overflow-y-auto">
              {activeText}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
