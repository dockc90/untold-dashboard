export type PlanTier = 'free' | 'pro' | 'agency';

export interface UserAccountState {
  isLoggedIn: boolean;
  email: string;
  name: string;
  plan: PlanTier;
  creditsRemaining: number;
  monthlyLimit: number;
  updatedAt: string;
}

export const PLAN_CATALOG: Record<
  PlanTier,
  {
    id: PlanTier;
    name: string;
    priceLabel: string;
    monthlyCredits: number;
    badge?: string;
    features: string[];
  }
> = {
  free: {
    id: 'free',
    name: 'Free 스타터',
    priceLabel: '무료',
    monthlyCredits: 5,
    features: [
      'API 키 없이 바로 AI 대본·성우 체험 (월 5회)',
      '실시간 트렌드 레이더 & 1인 3각도 연작',
      '인스타 캐러셀 변환 & 9:16 쇼츠 미리보기',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Creator Pro',
    priceLabel: '₩39,000 / 월',
    monthlyCredits: 100,
    badge: '인기 1위',
    features: [
      '월 100편 AI 대본 + ElevenLabs v4 성우 무제한 포함',
      '내 채널 단일 카테고리 고정 & 논란 우회 공략 무제한',
      '1인 언론사 협찬 단가표·제안서 자동 생성기',
      '1080p 고화질 워터마크 없는 쇼츠 렌더링',
    ],
  },
  agency: {
    id: 'agency',
    name: 'Agency 무제한',
    priceLabel: '₩99,000 / 월',
    monthlyCredits: 9999,
    badge: '다채널',
    features: [
      'AI 대본·성우·트렌드 분석 무제한 크레딧',
      '다채널 운영팀용 무제한 클라우드 보관함 동기화',
      '대기업 브랜디드 네이티브 광고 컨설팅 템플릿',
    ],
  },
};

const STORAGE_KEY = 'untold_saas_account_v1';

export function loadAccountState(): UserAccountState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as UserAccountState;
      if (parsed && typeof parsed.creditsRemaining === 'number' && parsed.plan) {
        return parsed;
      }
    }
  } catch {}
  return {
    isLoggedIn: false,
    email: '',
    name: '운영자 (무제한)',
    plan: 'agency',
    creditsRemaining: PLAN_CATALOG.agency.monthlyCredits,
    monthlyLimit: PLAN_CATALOG.agency.monthlyCredits,
    updatedAt: new Date().toISOString(),
  };
}

export function saveAccountState(state: UserAccountState): UserAccountState {
  const next = { ...state, updatedAt: new Date().toISOString() };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
  return next;
}

export function signInAccount(email: string, name?: string): UserAccountState {
  const cur = loadAccountState();
  const cleanEmail = email.trim();
  const displayName = (name || cleanEmail.split('@')[0] || '크리에이터').trim();
  return saveAccountState({
    ...cur,
    isLoggedIn: true,
    email: cleanEmail,
    name: displayName,
  });
}

export function signOutAccount(): UserAccountState {
  return saveAccountState({
    isLoggedIn: false,
    email: '',
    name: '게스트 크리에이터',
    plan: 'free',
    creditsRemaining: PLAN_CATALOG.free.monthlyCredits,
    monthlyLimit: PLAN_CATALOG.free.monthlyCredits,
    updatedAt: new Date().toISOString(),
  });
}

export function switchSubscriptionPlan(plan: PlanTier): UserAccountState {
  const cur = loadAccountState();
  const info = PLAN_CATALOG[plan];
  return saveAccountState({
    ...cur,
    plan,
    creditsRemaining: info.monthlyCredits,
    monthlyLimit: info.monthlyCredits,
  });
}

export function consumeAccountCredit(amount = 1): { ok: boolean; state: UserAccountState } {
  const cur = loadAccountState();
  if (cur.plan === 'agency') {
    return { ok: true, state: cur };
  }
  if (cur.creditsRemaining < amount) {
    return { ok: false, state: cur };
  }
  const next = saveAccountState({
    ...cur,
    creditsRemaining: Math.max(0, cur.creditsRemaining - amount),
  });
  return { ok: true, state: next };
}
