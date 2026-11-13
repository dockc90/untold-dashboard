import React, { useEffect, useState } from 'react';
import {
  Mail,
  X,
  Clock,
  Check,
  Copy,
  Send,
  Sparkles,
  RotateCw,
  Film,
  Layers,
  AlertCircle,
  CheckCircle2,
  Compass,
} from 'lucide-react';
import type { CategoryType, TrendingFigure } from '../types';
import { getActiveGeminiKey } from '../services/sinsooApi';

interface NewsletterBriefItem {
  rank: number;
  name: string;
  category: string;
  title: string;
  whyNow: string;
  facts: string[];
  hookLine: string;
  shortsIdea: string;
  tags: string[];
  viralityScore: number;
  scheduledDate?: string;
}

interface NewsletterIssue {
  dateKst: string;
  tomorrowKst: string;
  subject: string;
  intro: string;
  generatedAt: string;
  usedAi: boolean;
  items: NewsletterBriefItem[];
  upcoming: NewsletterBriefItem[];
}

interface NewsletterStatus {
  emailConfigured: boolean;
  emailProvider: 'resend' | 'brevo' | 'smtp' | 'none';
  supabaseConfigured: boolean;
  cronUtc: string;
  cronKst: string;
  subscriberCount: number;
}

interface NewsletterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectForShorts: (figure: TrendingFigure) => void;
  onSelectForCarousel?: (figure: TrendingFigure) => void;
}

const VALID_CATEGORIES = new Set<CategoryType>([
  'upcoming',
  'viral',
  'entertainment',
  'actor',
  'sports',
  'economy',
  'social',
  'global',
]);

function toTrendingFigure(item: NewsletterBriefItem, isUpcoming = false): TrendingFigure {
  const cat: CategoryType = isUpcoming
    ? 'upcoming'
    : VALID_CATEGORIES.has(item.category as CategoryType)
    ? (item.category as CategoryType)
    : 'viral';
  return {
    id: `fig-nl-${Date.now()}-${item.rank}-${isUpcoming ? 'up' : 'now'}`,
    name: item.name,
    title: item.title,
    category: cat,
    viralityScore: item.viralityScore || 95,
    timeframe: '24h',
    buzzSummary: item.whyNow,
    controversyOrIssue: (item.facts || []).join(' · ') || item.whyNow,
    suggestedAngle: item.shortsIdea || item.hookLine,
    hookLine: item.hookLine,
    tags: Array.isArray(item.tags) ? item.tags : [item.name, '오전7시브리핑'],
    primaryChannel: 'multi',
    isHot: item.rank <= 3,
    isLive: true,
    ...(isUpcoming ? { isUpcoming: true, scheduledDate: item.scheduledDate || '내일·예정' } : {}),
  };
}

export const NewsletterModal: React.FC<NewsletterModalProps> = ({
  isOpen,
  onClose,
  onSelectForShorts,
  onSelectForCarousel,
}) => {
  const [status, setStatus] = useState<NewsletterStatus | null>(null);
  const [issue, setIssue] = useState<NewsletterIssue | null>(null);
  const [textBrief, setTextBrief] = useState('');
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem('autoshorts.newsletter.email') || '';
    } catch {
      return '';
    }
  });
  const [name, setName] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadPreview = async (force = false) => {
    setIsLoadingPreview(true);
    try {
      const res = await fetch(`/api/newsletter/preview${force ? '?force=1' : ''}`, { cache: 'no-store' });
      const json = await res.json();
      if (res.ok && json?.issue) {
        setStatus(json.status || null);
        setIssue(json.issue);
        setTextBrief(json.textBrief || '');
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingPreview(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadPreview(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const copyText = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 1500);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsSubscribing(true);
    setNotice(null);
    try {
      localStorage.setItem('autoshorts.newsletter.email', email.trim());
    } catch {
      // ignore
    }
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || '구독 신청에 실패했습니다.');
      }
      if (json.status) setStatus(json.status);
      const deliveryHint = json.status?.emailConfigured
        ? '매일 오전 7시(KST) 이메일로 자동 발송됩니다.'
        : '이메일 주소만 입력해 구독 목록에 등록되었습니다. (실제 메일 발송은 서버 발신 키 설정 후 매일 오전 7시에 일괄 발송됩니다.)';
      setNotice({
        ok: true,
        text: `${json.subscriber.email} 등록 완료! ${deliveryHint}`,
      });
    } catch (err: any) {
      setNotice({ ok: false, text: err?.message || '구독 등록 중 오류가 발생했습니다.' });
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleSendTest = async () => {
    const targetEmail = email.trim();
    if (!targetEmail) {
      setNotice({ ok: false, text: '먼저 받아볼 이메일 주소를 입력해 주세요.' });
      return;
    }
    setIsSendingTest(true);
    setNotice(null);
    try {
      localStorage.setItem('autoshorts.newsletter.email', targetEmail);
    } catch {
      // ignore
    }
    try {
      const geminiKey = getActiveGeminiKey();
      const res = await fetch('/api/newsletter/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          name: name.trim() || undefined,
          geminiKey,
        }),
      });
      const json = await res.json();
      if (json?.status) setStatus(json.status);
      if (json?.issue) setIssue(json.issue);
      if (json?.textBrief) setTextBrief(json.textBrief);

      if (json?.ok) {
        setNotice({ ok: true, text: json.message || '테스트 메일을 발송했습니다!' });
      } else {
        setNotice({
          ok: false,
          text:
            json?.message ||
            '구독 이메일은 등록되었습니다. 실제 발송은 운영 서버(Vercel 환경변수 SMTP_USER · SMTP_PASS) 설정 후 작동하며, 지금은 상단 [전문 복사]로 바로 확인하실 수 있습니다.',
        });
      }
    } catch (err: any) {
      setNotice({ ok: false, text: err?.message || '테스트 메일 요청 중 오류가 발생했습니다.' });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white border border-[#E9E9E7] rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-[#37352F]">
        {/* Header */}
        <div className="px-5 py-4 bg-[#23272A] text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4 text-amber-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold truncate">매일 오전 7시(KST) 모닝 인물 뉴스레터</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/25 text-indigo-200 border border-indigo-400/30">
                  <Clock className="w-2.5 h-2.5" />
                  매일 07:00 KST
                </span>
              </div>
              <p className="text-[11px] text-neutral-300 truncate mt-0.5">
                이메일 주소만 입력하면 오늘의 화제 인물 6명 + 내일 선점 소재를 매일 아침 7시에 받아봅니다.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
            <span>닫기</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#FAF9F7] space-y-5">
          {/* Subscription & Status Box (Email ONLY — zero passwords!) */}
          <div className="bg-white border border-[#E9E9E7] rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="font-bold text-[#191919]">이메일만으로 간편 구독</span>
                {status && (
                  <>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        status.emailConfigured
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-[#F1F1EF] text-[#787774] border-[#E3E2DE]'
                      }`}
                    >
                      {status.emailConfigured ? '07:00 자동 메일 발송 활성' : '구독 접수 · 브리핑 미리보기 활성'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F1F1EF] text-[#37352F] border border-[#E3E2DE]">
                      구독자 {status.subscriberCount}명
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {textBrief && (
                  <button
                    type="button"
                    onClick={() => copyText('full-brief', textBrief)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F1F1EF] hover:bg-[#E9E9E7] border border-[#E3E2DE] text-[11px] font-semibold text-[#37352F] cursor-pointer transition"
                  >
                    {copiedKey === 'full-brief' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'full-brief' ? '전문 복사됨' : '전문 복사'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => loadPreview(true)}
                  disabled={isLoadingPreview}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F1F1EF] hover:bg-[#E9E9E7] border border-[#E3E2DE] text-[11px] font-semibold text-[#37352F] cursor-pointer transition disabled:opacity-50"
                >
                  <RotateCw className={`w-3 h-3 ${isLoadingPreview ? 'animate-spin' : ''}`} />
                  <span>새로고침</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubscribe} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="아침 7시에 받을 이메일 주소 (비밀번호 불필요)"
                className="sm:col-span-5 bg-[#FAF9F7] border border-[#E3E2DE] rounded-xl px-3 py-2 text-xs text-[#191919] placeholder-[#9B9A97] focus:outline-none focus:border-[#23272A]"
              />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="닉네임 (선택)"
                className="sm:col-span-3 bg-[#FAF9F7] border border-[#E3E2DE] rounded-xl px-3 py-2 text-xs text-[#191919] placeholder-[#9B9A97] focus:outline-none focus:border-[#23272A]"
              />
              <button
                type="submit"
                disabled={isSubscribing || !email.trim()}
                className="sm:col-span-2 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#23272A] hover:bg-[#111213] text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{isSubscribing ? '등록 중...' : '07:00 구독'}</span>
              </button>
              <button
                type="button"
                onClick={handleSendTest}
                disabled={isSendingTest || !email.trim()}
                className="sm:col-span-2 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-[#F1F1EF] hover:bg-[#E9E9E7] border border-[#E3E2DE] text-[#37352F] text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                title="등록한 이메일로 테스트 메일 받아보기"
              >
                <Send className="w-3 h-3" />
                <span>{isSendingTest ? '발송 중...' : '테스트 발송'}</span>
              </button>
            </form>

            {notice && (
              <div
                className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
                  notice.ok
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                {notice.ok ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <span>{notice.text}</span>
              </div>
            )}
          </div>

          {/* Preview Content */}
          {isLoadingPreview && !issue ? (
            <div className="bg-white border border-[#E9E9E7] rounded-2xl p-10 text-center text-xs text-[#787774] space-y-2">
              <RotateCw className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
              <p>오늘 오전 7시 기준 화제 인물 브리핑을 생성하고 있습니다...</p>
            </div>
          ) : issue ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2 px-1">
                <div>
                  <h4 className="text-sm font-bold text-[#191919] flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-indigo-600" />
                    <span>{issue.subject}</span>
                  </h4>
                  <p className="text-xs text-[#787774] mt-0.5">{issue.intro}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(issue.items || []).map((item) => {
                  const fig = toTrendingFigure(item, false);
                  return (
                    <div
                      key={`${item.rank}-${item.name}`}
                      className="bg-white border border-[#E9E9E7] rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-2xs"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md bg-[#23272A] text-white text-[10px] font-bold">
                              #{item.rank}
                            </span>
                            <span className="font-bold text-sm text-[#191919]">{item.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F1F1EF] text-[#787774] font-medium">
                              {item.category}
                            </span>
                          </div>
                          <span className="text-[11px] font-bold text-rose-600">{item.viralityScore}점</span>
                        </div>

                        <p className="text-xs font-semibold text-[#191919] leading-snug">{item.title}</p>
                        <p className="text-[11px] text-[#5C5A54] leading-relaxed">{item.whyNow}</p>

                        <div className="p-2.5 rounded-xl bg-[#F1F1EF] border border-[#E3E2DE] space-y-1">
                          <p className="text-[11px] font-semibold text-[#191919]">🎬 “{item.hookLine}”</p>
                          {item.shortsIdea && (
                            <p className="text-[10px] text-[#787774]">💡 {item.shortsIdea}</p>
                          )}
                        </div>

                        <div className="flex items-center flex-wrap gap-1">
                          {(item.tags || []).slice(0, 4).map((t) => {
                            const k = `${item.rank}-${t}`;
                            return (
                              <button
                                key={k}
                                type="button"
                                onClick={() => copyText(k, `#${t}`)}
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#F1F1EF] hover:bg-[#23272A] hover:text-white text-[10px] text-[#5C5A54] border border-[#E3E2DE] transition cursor-pointer"
                                title="클릭해서 해시태그 복사"
                              >
                                {copiedKey === k ? (
                                  <>
                                    <Check className="w-2.5 h-2.5 text-emerald-500" />
                                    <span>복사됨</span>
                                  </>
                                ) : (
                                  <span>#{t}</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectForShorts(fig);
                            onClose();
                          }}
                          className="py-2 px-2 rounded-xl bg-[#23272A] hover:bg-[#111213] text-white text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition"
                        >
                          <Film className="w-3.5 h-3.5" />
                          <span>쇼츠 제작</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectForCarousel) {
                              onSelectForCarousel(fig);
                            } else {
                              onSelectForShorts(fig);
                            }
                            onClose();
                          }}
                          className="py-2 px-2 rounded-xl bg-white hover:bg-[#F1F1EF] border border-[#E3E2DE] text-[#37352F] text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition"
                        >
                          <Layers className="w-3.5 h-3.5 text-rose-500" />
                          <span>캐러셀 제작</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {(issue.upcoming || []).length > 0 && (
                <div className="bg-violet-50/70 border border-violet-200/80 rounded-2xl p-4 space-y-2.5">
                  <div className="text-xs font-bold text-violet-900">
                    🔭 내일({issue.tomorrowKst}) 예고 · 선점 추천 소재
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {(issue.upcoming || []).map((u) => {
                      const upFig = toTrendingFigure(u, true);
                      return (
                        <div
                          key={`up-${u.rank}-${u.name}`}
                          className="bg-white border border-violet-200/70 rounded-xl p-3 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-[#191919]">{u.name}</span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-violet-100 text-violet-800 font-bold">
                                {u.scheduledDate || '내일 예정'}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#5C5A54] line-clamp-1 mt-0.5">{u.title}</p>
                            <p className="text-[10px] text-violet-700 line-clamp-1 mt-0.5">“{u.hookLine}”</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              onSelectForShorts(upFig);
                              onClose();
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-[#23272A] text-white text-[11px] font-semibold shrink-0 cursor-pointer hover:bg-black"
                          >
                            선점 제작
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
