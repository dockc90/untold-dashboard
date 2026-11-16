import React, { useEffect, useState } from 'react';
import { X, Zap, Check, Crown, User, LogOut, KeyRound, Sparkles } from 'lucide-react';
import {
  PLAN_CATALOG,
  PlanTier,
  UserAccountState,
  signInAccount,
  signOutAccount,
  switchSubscriptionPlan,
} from '../utils/subscription';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: UserAccountState;
  onAccountChange: (next: UserAccountState) => void;
  onOpenApiSettings?: () => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  account,
  onAccountChange,
  onOpenApiSettings,
}) => {
  const [emailInput, setEmailInput] = useState(account.email || '');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !emailInput.includes('@')) {
      setStatusMsg('올바른 이메일 주소를 입력해 주세요.');
      return;
    }
    const next = signInAccount(emailInput.trim());
    onAccountChange(next);
    setStatusMsg(`✅ ${next.email} 계정으로 로그인되었습니다.`);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleSelectPlan = (tier: PlanTier) => {
    const next = switchSubscriptionPlan(tier);
    onAccountChange(next);
    setStatusMsg(`🎉 ${PLAN_CATALOG[tier].name} 플랜이 적용되었습니다! (크레딧 ${tier === 'agency' ? '무제한' : `${next.creditsRemaining}회`})`);
    setTimeout(() => setStatusMsg(null), 3500);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-[#E3E2DE] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#EDEDEB] bg-[#FBFBFA] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-extrabold text-[#191919] truncate">
                요금제 · 내 계정 & 크레딧 관리
              </h2>
              <p className="text-[11px] text-[#787774] truncate">
                별도 API 키 발급 없이 바로 AI 대본과 성우 음성을 사용할 수 있습니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#787774] hover:text-[#191919] hover:bg-[#F1F1EF] transition cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {statusMsg && (
            <div className="px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold">
              {statusMsg}
            </div>
          )}

          {/* Current Account & Credit Bar */}
          <div className="p-4 rounded-2xl bg-[#FBFBFA] border border-[#E3E2DE] flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-extrabold text-sm shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-extrabold text-[#191919]">
                    {account.isLoggedIn ? account.name : '게스트 체험 중'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-black">
                    {PLAN_CATALOG[account.plan].name}
                  </span>
                </div>
                <p className="text-[11px] text-[#787774] mt-0.5">
                  {account.isLoggedIn
                    ? account.email
                    : '이메일로 간편 로그인하면 작업 내역과 플랜이 안전하게 연결됩니다.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="px-3 py-2 rounded-xl bg-white border border-[#E3E2DE] flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                <div className="text-xs">
                  <span className="text-[#787774] font-semibold mr-1">잔여 크레딧:</span>
                  <span className="font-extrabold text-[#191919]">
                    {account.plan === 'agency'
                      ? '무제한'
                      : `${account.creditsRemaining} / ${account.monthlyLimit}회`}
                  </span>
                </div>
              </div>

              {account.isLoggedIn ? (
                <button
                  type="button"
                  onClick={() => onAccountChange(signOutAccount())}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white hover:bg-rose-50 border border-[#E3E2DE] text-xs font-bold text-[#787774] hover:text-rose-700 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>로그아웃</span>
                </button>
              ) : (
                <form onSubmit={handleLogin} className="flex items-center gap-1.5">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="이메일 주소 입력"
                    className="px-3 py-1.5 rounded-xl bg-white border border-[#E3E2DE] text-xs w-44 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-[#23272A] hover:bg-black text-white text-xs font-bold cursor-pointer shrink-0"
                  >
                    간편 시작
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* 3-Tier SaaS Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {(['free', 'pro', 'agency'] as PlanTier[]).map((tier) => {
              const p = PLAN_CATALOG[tier];
              const isCurrent = account.plan === tier;
              const isPro = tier === 'pro';
              return (
                <div
                  key={tier}
                  className={`p-4 rounded-2xl border flex flex-col justify-between space-y-4 transition ${
                    isPro
                      ? 'bg-gradient-to-b from-indigo-50/70 to-white border-indigo-400 shadow-md ring-1 ring-indigo-200'
                      : 'bg-white border-[#E3E2DE]'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-extrabold text-[#191919]">{p.name}</span>
                      {p.badge && (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-black">
                          {p.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-2xl font-black text-[#191919] tracking-tight">
                      {p.priceLabel}
                    </div>
                    <ul className="space-y-2 pt-1">
                      {p.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-[#37352F] leading-snug">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectPlan(tier)}
                    className={`w-full py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      isCurrent
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                        : isPro
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                        : 'bg-[#23272A] hover:bg-black text-white'
                    }`}
                  >
                    {isCurrent ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>현재 이용 중인 플랜</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{p.name} 선택하기</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Advanced Developer Option (Hidden from main confusion) */}
          {onOpenApiSettings && (
            <div className="pt-2 border-t border-[#EDEDEB] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[#787774]">
              <span>
                💡 <strong>Hosted AI 기본 탑재:</strong> 별도 API 키 없이 서버 크레딧으로 바로 동작합니다. 개인 키를 직접 연결하려면 고급 설정을 이용하세요.
              </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenApiSettings();
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#F1F1EF] hover:bg-[#E3E2DE] text-[#37352F] font-bold shrink-0 cursor-pointer"
              >
                <KeyRound className="w-3 h-3" />
                <span>고급: 개인 API 키 설정</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
