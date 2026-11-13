import React, { useEffect, useState } from 'react';
import {
  X,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Volume2,
  BookOpen,
  Settings,
  Eye,
  EyeOff,
  Loader2,
  ExternalLink,
  RefreshCw,
  Crown,
  Lock,
} from 'lucide-react';
import {
  SinsooSettings,
  loadSinsooSettings,
  saveSinsooSettings,
  listGeminiModels,
  genGeminiText,
  synthesizeGeminiTts,
  synthesizeElevenLabsTts,
  testElevenLabsTts,
  checkElevenLabsServerStatus,
  listGeminiVoices,
  yFetch,
  explainSinsooError,
  GEMINI_FALLBACK_CATALOG,
  ELEVENLABS_MODELS,
} from '../services/sinsooApi';
import { VOICE_OPTIONS } from '../data/voices';

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'keys' | 'voice' | 'guide';
}

export const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'keys',
}) => {
  const [tab, setTab] = useState<'keys' | 'voice' | 'guide'>(initialTab);
  const [form, setForm] = useState<SinsooSettings>(() => loadSinsooSettings());
  const [showGemini, setShowGemini] = useState(false);
  const [showYt, setShowYt] = useState(false);
  const [showEleven, setShowEleven] = useState(false);

  const [testingGemini, setTestingGemini] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState<{ ok?: boolean; text: string } | null>(null);

  const [testingYt, setTestingYt] = useState(false);
  const [ytStatus, setYtStatus] = useState<{ ok?: boolean; text: string } | null>(null);

  const [testingEleven, setTestingEleven] = useState(false);
  const [elevenStatus, setElevenStatus] = useState<{ ok?: boolean; text: string } | null>(null);
  const [elevenServerConnected, setElevenServerConnected] = useState(false);

  const [testingVoice, setTestingVoice] = useState(false);
  const [testingElevenVoice, setTestingElevenVoice] = useState(false);
  const [voiceNote, setVoiceNote] = useState<string>('');
  const [elevenVoiceNote, setElevenVoiceNote] = useState<string>('');
  const [saveToast, setSaveToast] = useState<string>('');

  const voices = listGeminiVoices();
  const hasElevenUserKey = Boolean(form.elevenLabsKey?.trim());
  const hasElevenConnected = Boolean(hasElevenUserKey || elevenServerConnected || elevenStatus?.ok === true);

  useEffect(() => {
    if (!isOpen) return;
    let alive = true;
    checkElevenLabsServerStatus().then((st) => {
      if (alive) setElevenServerConnected(st.serverConfigured);
    });
    return () => {
      alive = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const persist = (patch?: Partial<SinsooSettings>) => {
    const updated = saveSinsooSettings(patch || form);
    setForm(updated);
    return updated;
  };

  const handleSaveOnly = () => {
    const cleaned = {
      ...form,
      geminiKey: form.geminiKey.trim(),
      ytKey: form.ytKey.trim(),
      elevenLabsKey: (form.elevenLabsKey || '').trim(),
    };
    persist(cleaned);
    setSaveToast(
      cleaned.geminiKey
        ? '설정이 브라우저(localStorage)에 안전하게 저장되었습니다.'
        : '저장 완료 (Gemini 키를 입력하면 AI 분석/TTS 기능이 활성화됩니다.)'
    );
    setTimeout(() => setSaveToast(''), 3000);
  };

  const handleTestGemini = async () => {
    const cleanKey = form.geminiKey.trim();
    persist({ ...form, geminiKey: cleanKey });
    if (!cleanKey) {
      setGeminiStatus({ ok: false, text: 'Gemini API 키를 먼저 입력하세요.' });
      return;
    }
    setTestingGemini(true);
    setGeminiStatus({ text: '키 확인 및 사용 가능한 최신 모델 목록 조회 중…' });
    try {
      const models = await listGeminiModels(cleanKey);
      const nextTextModels = models.text.length ? models.text : GEMINI_FALLBACK_CATALOG.text;
      const nextTtsModels = models.tts.length ? models.tts : GEMINI_FALLBACK_CATALOG.tts;
      const nextImgModels = models.image.length ? models.image : GEMINI_FALLBACK_CATALOG.image;

      const selectedModel =
        nextTextModels.includes(form.model) && !/^gemini-2\./.test(form.model)
          ? form.model
          : nextTextModels.find((m: string) => !/^gemini-2\./.test(m) && /flash/.test(m)) || nextTextModels[0];
      const selectedTts = nextTtsModels.includes(form.ttsModel) && !/^gemini-2\./.test(form.ttsModel)
        ? form.ttsModel
        : nextTtsModels[0];
      const selectedImg = nextImgModels.includes(form.imgModel) && !/^gemini-2\./.test(form.imgModel)
        ? form.imgModel
        : nextImgModels[0];

      // Save discovered models right away so the dropdown updates immediately
      persist({
        ...form,
        geminiKey: cleanKey,
        model: selectedModel,
        models: nextTextModels,
        ttsModel: selectedTts,
        imgModel: selectedImg,
      });

      setGeminiStatus({
        text: `키 인식 ✓ (텍스트 ${nextTextModels.length}개 · TTS ${nextTtsModels.length}개). 실제 생성 테스트 중…`,
      });

      const testRes = await genGeminiText({
        model: selectedModel,
        fallbackModels: nextTextModels,
        text: '"OK" 라고만 답하세요.',
        json: false,
        thinking: 'low',
        maxTokens: 256,
        attemptTimeoutMs: 8000,
        apiKey: cleanKey,
        onNote: (msg) => setGeminiStatus({ text: msg }),
      });

      const okModels = Array.from(new Set([testRes.model, ...(form.okModels || [])])).slice(0, 6);
      const updated = persist({
        ...form,
        geminiKey: cleanKey,
        model: testRes.model,
        models: nextTextModels,
        okModels,
        ttsModel: selectedTts,
        imgModel: selectedImg,
      });
      setForm(updated);
      setGeminiStatus({
        ok: true,
        text: `정상 연결 ✓ (${testRes.model} · ${testRes.transport}). 자동 저장됨.`,
      });
    } catch (err) {
      setGeminiStatus({ ok: false, text: explainSinsooError(err) });
    } finally {
      setTestingGemini(false);
    }
  };

  const handleTestYoutube = async () => {
    persist(form);
    if (!form.ytKey.trim()) {
      setYtStatus({ ok: false, text: 'YouTube Data API 키를 입력하세요 (선택 사항).' });
      return;
    }
    setTestingYt(true);
    setYtStatus({ text: 'YouTube Data API v3 연결 확인 중…' });
    try {
      await yFetch('/videos', { part: 'id', id: 'jNQXAC9IVRw' }, form.ytKey.trim());
      setYtStatus({ ok: true, text: '정상 연결 ✓ YouTube 영상 조회 및 CC 소재 검색 사용 가능' });
    } catch (err) {
      setYtStatus({ ok: false, text: explainSinsooError(err) });
    } finally {
      setTestingYt(false);
    }
  };

  const handleVoicePreview = async () => {
    persist(form);
    if (!form.geminiKey.trim()) {
      setVoiceNote('미리듣기를 생성하려면 먼저 Gemini API 키를 입력해 주세요.');
      return;
    }
    setTestingVoice(true);
    setVoiceNote('선택한 음색으로 샘플 내레이션 합성 중…');
    try {
      const res = await synthesizeGeminiTts({
        text: '안녕하세요, 신수 스튜디오 AI 보이스 테스트입니다. 시청자의 시선을 3초 만에 사로잡아 보세요.',
        voice: form.voice,
        style: form.ttsStyle,
        model: form.ttsModel,
      });
      const url = URL.createObjectURL(res.blob);
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      await audio.play();
      setVoiceNote(`재생 완료 (${form.voice} · ${res.model})`);
    } catch (err) {
      setVoiceNote(explainSinsooError(err));
    } finally {
      setTestingVoice(false);
    }
  };

  const handleTestElevenLabs = async () => {
    const cleanKey = (form.elevenLabsKey || '').trim();
    persist({ ...form, elevenLabsKey: cleanKey });
    if (!cleanKey) {
      setElevenStatus({ ok: false, text: 'ElevenLabs API 키(sk_...)를 먼저 입력하세요.' });
      return;
    }
    setTestingEleven(true);
    setElevenStatus({ text: 'ElevenLabs API 키 확인 및 샘플 음성 생성 중…' });
    try {
      const res = await testElevenLabsTts({
        apiKey: cleanKey,
        voiceId: form.elevenLabsVoiceId,
        modelId: form.elevenLabsModel,
      });
      setElevenStatus({
        ok: true,
        text: `연동 성공 ✓ (${res.model} · ${(res.bytes / 1024).toFixed(1)}KB). TTS 모델 & 16인 성우가 오픈되었습니다.`,
      });
    } catch (err) {
      setElevenStatus({ ok: false, text: explainSinsooError(err) });
    } finally {
      setTestingEleven(false);
    }
  };

  const handleElevenVoicePreview = async () => {
    persist(form);
    setTestingElevenVoice(true);
    setElevenVoiceNote('일레븐랩스 유료 엔진으로 샘플 음성 생성 중…');
    try {
      const res = await synthesizeElevenLabsTts({
        text: '안녕하세요. 일레븐랩스 유료 성우 보이스 테스트입니다. 3초 만에 시선을 사로잡는 도입부를 만들어 보세요.',
        voiceId: form.elevenLabsVoiceId,
        modelId: form.elevenLabsModel,
        apiKey: form.elevenLabsKey?.trim() || undefined,
      });
      const url = URL.createObjectURL(res.blob);
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      await audio.play();
      const vName = VOICE_OPTIONS.find((v) => v.id === form.elevenLabsVoiceId)?.name || form.elevenLabsVoiceId;
      setElevenVoiceNote(`재생 완료 ✓ (${vName} · ${res.model})`);
    } catch (err) {
      setElevenVoiceNote(explainSinsooError(err));
    } finally {
      setTestingElevenVoice(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-3xl bg-[#FBFBFA] text-[#37352F] rounded-2xl border border-[#E3E2DE] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-white border-b border-[#EDEDEB] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#F1F1EF] border border-[#E3E2DE] flex items-center justify-center">
              <Settings className="w-4 h-4 text-[#37352F]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#191919]">API 키 · 음성 · 제작 환경 설정</h2>
              <p className="text-[11px] text-[#787774]">
                모든 API 키와 설정은 서버로 전송되지 않고 현재 브라우저에만 안전하게 저장됩니다.
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

        {/* Notion Pill Tabs */}
        <div className="px-5 pt-3 bg-[#FBFBFA] border-b border-[#EDEDEB] pb-3 flex items-center justify-between flex-wrap gap-2">
          <div className="inline-flex items-center bg-[#F1F1EF] p-1 rounded-xl border border-[#E3E2DE] text-xs gap-1">
            <button
              type="button"
              onClick={() => setTab('keys')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                tab === 'keys' ? 'bg-white text-[#191919] shadow-2xs font-semibold' : 'text-[#787774] hover:text-[#37352F]'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
              <span>API 키 · 모델</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('voice')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                tab === 'voice' ? 'bg-white text-[#191919] shadow-2xs font-semibold' : 'text-[#787774] hover:text-[#37352F]'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>음성 (ElevenLabs · Gemini) · 출력 기본값</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('guide')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                tab === 'guide' ? 'bg-white text-[#191919] shadow-2xs font-semibold' : 'text-[#787774] hover:text-[#37352F]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              <span>사용법 · 키 발급</span>
            </button>
          </div>
          {saveToast && (
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
              {saveToast}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {tab === 'keys' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Gemini Card */}
              <div className="bg-white p-4 rounded-xl border border-[#E9E9E7] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#191919] flex items-center gap-1.5">
                    Gemini API 키
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                      필수
                    </span>
                  </h3>
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-indigo-600 hover:underline flex items-center gap-0.5"
                  >
                    무료 발급 <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-xs text-[#787774] leading-relaxed">
                  영상 하이라이트 분석, 정밀 자막 전사, 대본 작성 및 Gemini 30종 한국어 TTS에 사용됩니다.
                </p>

                <div className="flex items-center gap-1.5 bg-[#FBFBFA] border border-[#E3E2DE] rounded-xl px-3 py-2 focus-within:border-[#37352F]">
                  <input
                    type={showGemini ? 'text' : 'password'}
                    value={form.geminiKey}
                    onChange={(e) => setForm({ ...form, geminiKey: e.target.value })}
                    placeholder="AIza... 또는 AQ.... 키 입력"
                    autoComplete="off"
                    className="w-full bg-transparent text-xs outline-none text-[#191919]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGemini((v) => !v)}
                    className="text-[#9B9A97] hover:text-[#37352F] cursor-pointer"
                  >
                    {showGemini ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestGemini}
                    disabled={testingGemini}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#23272A] text-white text-xs font-semibold hover:bg-black transition disabled:opacity-60 cursor-pointer"
                  >
                    {testingGemini ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    <span>키 확인 · 모델 불러오기</span>
                  </button>
                </div>

                {geminiStatus && (
                  <div
                    className={`text-xs p-2.5 rounded-lg border flex items-start gap-1.5 ${
                      geminiStatus.ok === true
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : geminiStatus.ok === false
                        ? 'bg-rose-50 border-rose-200 text-rose-800'
                        : 'bg-[#F7F6F3] border-[#E3E2DE] text-[#37352F]'
                    }`}
                  >
                    {geminiStatus.ok === true && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
                    {geminiStatus.ok === false && <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                    <span className="leading-relaxed">{geminiStatus.text}</span>
                  </div>
                )}

                <div className="space-y-2 pt-1">
                  <label className="block text-xs font-medium text-[#37352F]">
                    기본 텍스트/분석 모델
                    <select
                      value={form.model}
                      onChange={(e) => setForm({ ...form, model: e.target.value })}
                      className="mt-1 w-full px-2.5 py-2 rounded-lg border border-[#E3E2DE] bg-white text-xs"
                    >
                      {Array.from(new Set([form.model, ...(form.models || []), ...GEMINI_FALLBACK_CATALOG.text])).map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block text-xs font-medium text-[#37352F]">
                      TTS 모델 {hasElevenConnected && <span className="text-[10px] text-amber-600">(ElevenLabs 선택 가능)</span>}
                      <select
                        value={
                          hasElevenConnected && (form.ttsProvider || 'elevenlabs') === 'elevenlabs'
                            ? `elevenlabs:${form.elevenLabsModel || 'eleven_v4'}`
                            : form.ttsModel
                        }
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v.startsWith('elevenlabs:')) {
                            setForm({
                              ...form,
                              ttsProvider: 'elevenlabs',
                              elevenLabsModel: v.replace(/^elevenlabs:/, ''),
                            });
                          } else {
                            setForm({
                              ...form,
                              ttsProvider: 'gemini',
                              ttsModel: v,
                            });
                          }
                        }}
                        className="mt-1 w-full px-2 py-1.5 rounded-lg border border-[#E3E2DE] bg-white text-xs"
                      >
                        {hasElevenConnected && (
                          <optgroup label="👑 ElevenLabs 유료 TTS (API 키 연결됨)">
                            {ELEVENLABS_MODELS.map((m) => (
                              <option key={`elevenlabs:${m.id}`} value={`elevenlabs:${m.id}`}>
                                👑 ElevenLabs · {m.label}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        <optgroup label="✨ Gemini TTS (30종)">
                          {Array.from(new Set([form.ttsModel, ...GEMINI_FALLBACK_CATALOG.tts])).map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </label>
                    <label className="block text-xs font-medium text-[#37352F]">
                      이미지 모델 (유료 키)
                      <select
                        value={form.imgModel}
                        onChange={(e) => setForm({ ...form, imgModel: e.target.value })}
                        className="mt-1 w-full px-2 py-1.5 rounded-lg border border-[#E3E2DE] bg-white text-xs"
                      >
                        {Array.from(new Set([form.imgModel, ...GEMINI_FALLBACK_CATALOG.image])).map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
              </div>

              {/* YouTube + Brand Card */}
              <div className="bg-white p-4 rounded-xl border border-[#E9E9E7] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#191919] flex items-center gap-1.5">
                    YouTube Data API 키
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#F1F1EF] text-[#787774] border border-[#E3E2DE]">
                      선택
                    </span>
                  </h3>
                  <a
                    href="https://console.cloud.google.com/apis/library/youtube.googleapis.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-indigo-600 hover:underline flex items-center gap-0.5"
                  >
                    Cloud 콘솔 <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-xs text-[#787774] leading-relaxed">
                  유튜브 링크의 영상 길이·조회수·썸네일 자동 불러오기 및 CC 라이선스 소재 검색에 사용됩니다.
                </p>

                <div className="flex items-center gap-1.5 bg-[#FBFBFA] border border-[#E3E2DE] rounded-xl px-3 py-2 focus-within:border-[#37352F]">
                  <input
                    type={showYt ? 'text' : 'password'}
                    value={form.ytKey}
                    onChange={(e) => setForm({ ...form, ytKey: e.target.value })}
                    placeholder="YouTube Data API v3 키"
                    autoComplete="off"
                    className="w-full bg-transparent text-xs outline-none text-[#191919]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowYt((v) => !v)}
                    className="text-[#9B9A97] hover:text-[#37352F] cursor-pointer"
                  >
                    {showYt ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleTestYoutube}
                  disabled={testingYt}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F1F1EF] hover:bg-[#E9E9E7] text-[#37352F] border border-[#E3E2DE] text-xs font-semibold transition cursor-pointer"
                >
                  {testingYt && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>유튜브 키 확인</span>
                </button>

                {ytStatus && (
                  <div
                    className={`text-xs p-2.5 rounded-lg border ${
                      ytStatus.ok === true
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : ytStatus.ok === false
                        ? 'bg-rose-50 border-rose-200 text-rose-800'
                        : 'bg-[#F7F6F3] border-[#E3E2DE] text-[#37352F]'
                    }`}
                  >
                    {ytStatus.text}
                  </div>
                )}

                <div className="pt-2 border-t border-[#EDEDEB] space-y-2">
                  <h4 className="text-xs font-bold text-[#191919]">기본 채널 워터마크 · 브랜드 표기</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block text-xs text-[#37352F]">
                      채널명 / 브랜드
                      <input
                        type="text"
                        value={form.brand}
                        onChange={(e) => setForm({ ...form, brand: e.target.value })}
                        placeholder="예: AutoShorts Studio"
                        className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-[#E3E2DE] bg-white text-xs"
                      />
                    </label>
                    <label className="block text-xs text-[#37352F]">
                      핸들 (@)
                      <input
                        type="text"
                        value={form.handle}
                        onChange={(e) => setForm({ ...form, handle: e.target.value })}
                        placeholder="@mychannel"
                        className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-[#E3E2DE] bg-white text-xs"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* ElevenLabs Paid Subscription Card (Full Width) */}
              <div className="md:col-span-2 bg-white p-4 rounded-xl border border-[#E9E9E7] space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-sm font-bold text-[#191919] flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-amber-500" />
                    ElevenLabs API 키
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#F1F1EF] text-[#787774] border border-[#E3E2DE]">
                      선택 (유료 성우)
                    </span>
                  </h3>
                  <a
                    href="https://elevenlabs.io/app/settings/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-indigo-600 hover:underline flex items-center gap-0.5"
                  >
                    ElevenLabs 키 발급 <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-xs text-[#787774] leading-relaxed">
                  본인의 ElevenLabs API 키를 연결하면 <b>TTS 모델</b> 선택과 <b>ElevenLabs 유료 16인 성우</b>가 활성화됩니다. 입력한 키는 서버에 저장되지 않고 현재 브라우저에만 보관됩니다.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 items-end">
                  <div className="md:col-span-2">
                    <span className="block text-[11px] font-medium text-[#787774] mb-1">
                      ElevenLabs API 키 입력 (sk_...)
                    </span>
                    <div className="flex items-center gap-1.5 bg-[#FBFBFA] border border-[#E3E2DE] rounded-xl px-3 py-2 focus-within:border-[#37352F]">
                      <input
                        type={showEleven ? 'text' : 'password'}
                        value={form.elevenLabsKey || ''}
                        onChange={(e) => setForm({ ...form, elevenLabsKey: e.target.value })}
                        placeholder="sk_... 키 입력 (입력 시 ElevenLabs TTS 모델 · 16인 성우 오픈)"
                        autoComplete="off"
                        className="w-full bg-transparent text-xs outline-none text-[#191919]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEleven((v) => !v)}
                        className="text-[#9B9A97] hover:text-[#37352F] cursor-pointer"
                      >
                        {showEleven ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <label className="block text-xs font-medium text-[#37352F]">
                    ElevenLabs 모델
                    <select
                      value={form.elevenLabsModel || 'eleven_v4'}
                      onChange={(e) => setForm({ ...form, elevenLabsModel: e.target.value })}
                      className="mt-1 w-full px-2.5 py-2 rounded-lg border border-[#E3E2DE] bg-white text-xs"
                    >
                      {ELEVENLABS_MODELS.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleTestElevenLabs}
                    disabled={testingEleven}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition cursor-pointer disabled:opacity-60"
                  >
                    {testingEleven ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Volume2 className="w-3.5 h-3.5" />}
                    <span>ElevenLabs 유료 연동 테스트</span>
                  </button>
                  {elevenStatus && (
                    <span
                      className={`text-xs px-2.5 py-1 rounded-lg border ${
                        elevenStatus.ok === true
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : elevenStatus.ok === false
                          ? 'bg-rose-50 border-rose-200 text-rose-800'
                          : 'bg-[#F7F6F3] border-[#E3E2DE] text-[#37352F]'
                      }`}
                    >
                      {elevenStatus.text}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === 'voice' && (
            <div className="space-y-4">
              {/* Default TTS Engine & ElevenLabs 16 Voices */}
              <div className="bg-white p-4 rounded-xl border border-[#E9E9E7] space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-[#191919] flex items-center gap-1.5 flex-wrap">
                      <Crown className="w-4 h-4 text-amber-500" />
                      <span>기본 AI 음성 엔진 & ElevenLabs 유료 16인 성우</span>
                      {hasElevenConnected ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                          ✓ {hasElevenUserKey ? '개인 API 키 연결됨 (유료 오픈)' : '서버 .env 유료 키 자동 연결됨 (유료 오픈)'}
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F1F1EF] text-[#787774] border border-[#E3E2DE] font-semibold inline-flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          API 키 미연결 (연동 시 오픈)
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-[#787774] mt-0.5">
                      기존 영상 재가공(3~5초 도입 내레이션)과 씬별 오디오 생성에 우선 사용할 TTS 엔진을 선택하세요.
                    </p>
                  </div>
                  <div className="inline-flex bg-[#F1F1EF] p-0.5 rounded-xl border border-[#E3E2DE] text-xs gap-1">
                    <button
                      type="button"
                      disabled={!hasElevenConnected}
                      onClick={() => setForm({ ...form, ttsProvider: 'elevenlabs' })}
                      className={`px-3 py-1 rounded-lg font-medium transition ${
                        !hasElevenConnected
                          ? 'opacity-50 cursor-not-allowed text-[#9B9A97]'
                          : (form.ttsProvider || 'elevenlabs') === 'elevenlabs'
                          ? 'bg-white text-[#191919] shadow-2xs font-semibold cursor-pointer'
                          : 'text-[#787774] cursor-pointer'
                      }`}
                    >
                      {hasElevenConnected ? '👑 ElevenLabs (유료)' : '🔒 ElevenLabs (키 필요)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, ttsProvider: 'gemini' })}
                      className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                        !hasElevenConnected || form.ttsProvider === 'gemini'
                          ? 'bg-white text-[#191919] shadow-2xs font-semibold'
                          : 'text-[#787774]'
                      }`}
                    >
                      ✨ Gemini (무료 30종)
                    </button>
                  </div>
                </div>

                {!hasElevenConnected ? (
                  <div className="p-3 rounded-xl bg-[#FBFBFA] border border-[#E3E2DE] flex items-center justify-between gap-3 flex-wrap">
                    <div className="text-xs text-[#787774] flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        ElevenLabs 유료 16인 성우는 <b>API 키 · 모델</b> 탭에서 본인의 ElevenLabs API 키(sk_...)를 연결해야 오픈됩니다.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTab('keys')}
                      className="px-3 py-1.5 rounded-lg bg-[#23272A] text-white text-xs font-semibold hover:bg-black cursor-pointer shrink-0"
                    >
                      API 키 연결하러 가기 →
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="block text-xs font-medium text-[#37352F]">
                        ElevenLabs 기본 성우 (16인)
                        <select
                          value={form.elevenLabsVoiceId || VOICE_OPTIONS[0].id}
                          onChange={(e) => setForm({ ...form, elevenLabsVoiceId: e.target.value })}
                          className="mt-1 w-full px-2.5 py-2 rounded-lg border border-[#E3E2DE] bg-white text-xs"
                        >
                          {VOICE_OPTIONS.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.name} · {v.role} ({v.tone})
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block text-xs font-medium text-[#37352F]">
                        ElevenLabs 기본 모델
                        <select
                          value={form.elevenLabsModel || 'eleven_v4'}
                          onChange={(e) => setForm({ ...form, elevenLabsModel: e.target.value })}
                          className="mt-1 w-full px-2.5 py-2 rounded-lg border border-[#E3E2DE] bg-white text-xs"
                        >
                          {ELEVENLABS_MODELS.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap pt-1">
                      <button
                        type="button"
                        onClick={handleElevenVoicePreview}
                        disabled={testingElevenVoice}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold transition cursor-pointer"
                      >
                        {testingElevenVoice ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Volume2 className="w-3.5 h-3.5 text-amber-600" />}
                        <span>ElevenLabs 성우 테스트 재생</span>
                      </button>
                      {elevenVoiceNote && <span className="text-xs text-[#787774]">{elevenVoiceNote}</span>}
                    </div>
                  </>
                )}
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#E9E9E7] space-y-3">
                <h3 className="text-sm font-bold text-[#191919]">Gemini TTS 음성 (한국어 지원 30종)</h3>
                <p className="text-xs text-[#787774]">
                  기존 영상 재가공의 3~5초 도입 내레이션과 배치 TTS 대본 합성에 기본 적용됩니다.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block text-xs font-medium text-[#37352F]">
                    음성 선택
                    <select
                      value={form.voice}
                      onChange={(e) => setForm({ ...form, voice: e.target.value })}
                      className="mt-1 w-full px-2.5 py-2 rounded-lg border border-[#E3E2DE] bg-white text-xs"
                    >
                      {voices.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs font-medium text-[#37352F]">
                    말투 / 연기 지시 (Style)
                    <input
                      type="text"
                      value={form.ttsStyle}
                      onChange={(e) => setForm({ ...form, ttsStyle: e.target.value })}
                      placeholder="예: 차분하고 또렷한 다큐멘터리 내레이션"
                      className="mt-1 w-full px-2.5 py-2 rounded-lg border border-[#E3E2DE] bg-white text-xs"
                    />
                  </label>
                </div>
                <div className="flex items-center gap-3 flex-wrap pt-1">
                  <button
                    type="button"
                    onClick={handleVoicePreview}
                    disabled={testingVoice}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F1F1EF] hover:bg-[#E9E9E7] text-[#191919] border border-[#E3E2DE] text-xs font-semibold transition cursor-pointer"
                  >
                    {testingVoice ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Volume2 className="w-3.5 h-3.5 text-indigo-600" />}
                    <span>선택 음성 테스트 재생</span>
                  </button>
                  {voiceNote && <span className="text-xs text-[#787774]">{voiceNote}</span>}
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#E9E9E7] space-y-3">
                <h3 className="text-sm font-bold text-[#191919]">영상 출력 & 재가공 기본값</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <label className="block text-xs text-[#37352F]">
                    기본 해상도
                    <select
                      value={form.outW}
                      onChange={(e) => setForm({ ...form, outW: +e.target.value as 720 | 1080 })}
                      className="mt-1 w-full px-2.5 py-2 rounded-lg border border-[#E3E2DE] bg-white text-xs"
                    >
                      <option value={1080}>1080×1920 (권장)</option>
                      <option value={720}>720×1280 (고속)</option>
                    </select>
                  </label>
                  <label className="block text-xs text-[#37352F]">
                    기본 화면 구도
                    <select
                      value={form.layout}
                      onChange={(e) => setForm({ ...form, layout: e.target.value as SinsooSettings['layout'] })}
                      className="mt-1 w-full px-2.5 py-2 rounded-lg border border-[#E3E2DE] bg-white text-xs"
                    >
                      <option value="blur">블러 배경 + 원본 전체</option>
                      <option value="crop">9:16 꽉 찬 크롭</option>
                      <option value="frame">4:3 중앙 틀</option>
                    </select>
                  </label>
                  <label className="block text-xs text-[#37352F]">
                    기본 제목 폰트
                    <select
                      value={form.titleFont}
                      onChange={(e) => setForm({ ...form, titleFont: e.target.value })}
                      className="mt-1 w-full px-2.5 py-2 rounded-lg border border-[#E3E2DE] bg-white text-xs"
                    >
                      {['Black Han Sans', 'Jua', 'Do Hyeon', 'Noto Serif KR', 'Gowun Batang', 'Pretendard'].map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs text-[#37352F]">
                    강조 텍스트 색
                    <input
                      type="color"
                      value={form.titleAccent}
                      onChange={(e) => setForm({ ...form, titleAccent: e.target.value })}
                      className="mt-1 w-full h-9 rounded-lg border border-[#E3E2DE] bg-white p-1 cursor-pointer"
                    />
                  </label>
                </div>

                <div className="flex flex-wrap gap-4 pt-2 text-xs text-[#37352F]">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.monitor}
                      onChange={(e) => setForm({ ...form, monitor: e.target.checked })}
                      className="rounded border-[#D3D1CB]"
                    />
                    <span>렌더링 중 오디오 모니터링 켜기</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.keepSource}
                      onChange={(e) => setForm({ ...form, keepSource: e.target.checked })}
                      className="rounded border-[#D3D1CB]"
                    />
                    <span>업로드한 원본 영상 브라우저 보관(IndexedDB)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {tab === 'guide' && (
            <div className="space-y-3 text-xs leading-relaxed text-[#37352F]">
              <div className="bg-white p-4 rounded-xl border border-[#E9E9E7] space-y-2">
                <h3 className="text-sm font-bold text-[#191919]">1. Gemini API 키 무료 발급 방법</h3>
                <ol className="list-decimal ml-4 space-y-1 text-[#55534E]">
                  <li>
                    <a
                      href="https://aistudio.google.com/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 underline font-medium"
                    >
                      aistudio.google.com/apikey
                    </a>{' '}
                    접속 → Google 계정 로그인 → <b>API 키 만들기</b> 클릭
                  </li>
                  <li>
                    생성된 키(AIza… 또는 AQ.…)를 복사해 <b>[API 키 · 모델]</b> 탭에 넣고 <b>키 확인</b>을 누르세요.
                  </li>
                  <li>
                    무료 등급으로도 텍스트 대본, 유튜브/영상 파일 하이라이트 추출, 한국어 Gemini TTS 30종을 모두 쓸 수 있습니다. (단, AI 이미지 생성만 유료 결제 프로젝트 키 필요)
                  </li>
                </ol>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#E9E9E7] space-y-2">
                <h3 className="text-sm font-bold text-[#191919]">2. 무료 TTS 한도 절약 팁 (Batch TTS & WSOLA)</h3>
                <p className="text-[#55534E]">
                  무료 Gemini 키는 TTS 요청이 모델당 하루 약 10회로 제한됩니다. AutoShorts에 이식된 <b>배치 TTS 분할 엔진</b>은 여러 장면 대본을 <code>&lt;long pause&gt;</code> 마커로 묶어 <b>단 1회 호출</b>로 생성한 뒤 무음 구간을 동적 계획법(DP)으로 정밀 절단하여 쿼터를 90% 이상 절약합니다.
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#E9E9E7] space-y-2">
                <h3 className="text-sm font-bold text-[#191919]">3. 기존 영상 재가공 + 고도화 캔버스 렌더러 연동</h3>
                <p className="text-[#55534E]">
                  [기존 영상 재가공]에서 1시간짜리 긴 영상이나 유튜브 URL에서 3~6개의 숏츠 하이라이트를 뽑은 뒤, 자막·제목·3~5초 도입 내레이션(TTS 또는 마이크 녹음)을 붙이고 <b>고도화 캔버스 렌더러로 바로 보내거나</b> <b>편집용 자료 ZIP(SRT·컷시트·WAV·첫프레임)</b>을 1클릭으로 내려받을 수 있습니다.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-white border-t border-[#EDEDEB] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-[#787774] hover:bg-[#F1F1EF] transition cursor-pointer"
          >
            닫기
          </button>
          <button
            type="button"
            onClick={handleSaveOnly}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#23272A] text-white hover:bg-black transition cursor-pointer shadow-xs"
          >
            설정 저장하기
          </button>
        </div>
      </div>
    </div>
  );
};
