import React, { useEffect, useRef, useState } from 'react';
import {
  Upload,
  Link as LinkIcon,
  Sparkles,
  Play,
  Square,
  Check,
  PauseCircle,
  XCircle,
  Scissors,
  Type as TypeIcon,
  Mic,
  Volume2,
  Package,
  Film,
  Loader2,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Image as ImageIcon,
  Wand2,
  Clock,
  Sliders,
  AlertCircle,
} from 'lucide-react';
import {
  GeminiMediaPart,
  explainSinsooError,
  fetchYoutubeVideoInfo,
  genGeminiText,
  generateGeminiImage,
  getActiveGeminiKey,
  getActiveYoutubeKey,
  getGeminiFile,
  guessMediaMime,
  listGeminiVoices,
  loadSinsooSettings,
  parseGeminiJson,
  parseYoutubeId,
  sinsooVault,
  stretchAudioBuffer,
  decodeAudioBlob,
  audioBufferToWavBlob,
  synthesizeGeminiTts,
  synthesizeElevenLabsTts,
  ELEVENLABS_MODELS,
  uploadGeminiFile,
  waitGeminiFileActive,
} from '../services/sinsooApi';
import { VOICE_OPTIONS } from '../data/voices';
import {
  SubtitleCue,
  createZipBlob,
  fmtBytes,
  fmtTimecode,
  generateCsv,
  generateSrt,
  parseTimecode,
  safeFileName,
  triggerDownload,
} from '../utils/exportPackager';
import { ShortsProject, SceneItem } from '../types';

export interface RepurposeCandidate {
  id: string;
  start: number;
  end: number;
  title: string;
  thumb: string;
  reason: string;
  hook: number;
  tags: string[];
  status: 'pick' | 'hold' | 'drop';
  subtitles: SubtitleCue[];
  subOn: boolean;
  layout: 'blur' | 'crop' | 'frame';
  cropX: number;
  titleFont: string;
  accent: string;
  brand: string;
  subSize: number;
  subPos: 'bottom' | 'mid';
  subBg: 'box' | 'stroke' | 'none';
  intro: {
    mode: 'none' | 'tts' | 'rec';
    ttsEngine?: 'elevenlabs' | 'gemini';
    elevenVoiceId?: string;
    text: string;
    voice: string;
    style: string;
    speed: number;
    assetId: string;
    dur: number;
    visual: 'frame' | 'image';
    imageAssetId: string;
    showText: boolean;
  };
}

interface VideoRepurposeStudioProps {
  incomingFile?: File | null;
  onConsumeIncomingFile?: () => void;
  onOpenSettings: () => void;
  onOpenCollector: (defaultQuery?: string) => void;
  onSendToRenderer: (project: ShortsProject) => void;
}

const STEPS = ['원본 · 옵션', '후보 선택', '편집 · 자막', '도입 내레이션', '렌더 · 내보내기'];
const FONTS = ['Black Han Sans', 'Jua', 'Do Hyeon', 'GmarketSans', 'Pretendard', 'Song Myung'];

export const VideoRepurposeStudio: React.FC<VideoRepurposeStudioProps> = ({
  incomingFile,
  onConsumeIncomingFile,
  onOpenSettings,
  onOpenCollector,
  onSendToRenderer,
}) => {
  const settings = loadSinsooSettings();
  const [step, setStep] = useState(1);

  // Source state
  const [ytInput, setYtInput] = useState('');
  const [sourceInfo, setSourceInfo] = useState<{
    type: '' | 'youtube' | 'file';
    url: string;
    videoId: string;
    title: string;
    channel: string;
    thumb: string;
    duration: number;
    views?: number;
    fileName: string;
    fileSize: number;
    fileType: string;
    fileUrl: string;
    width: number;
    height: number;
    geminiFile?: { uri: string; name: string; mime: string; expires?: string };
  }>({
    type: '',
    url: '',
    videoId: '',
    title: '',
    channel: '',
    thumb: '',
    duration: 0,
    fileName: '',
    fileSize: 0,
    fileType: '',
    fileUrl: '',
    width: 0,
    height: 0,
  });
  const localFileRef = useRef<File | null>(null);
  const hiddenVideoRef = useRef<HTMLVideoElement | null>(null);

  // Options
  const [personName, setPersonName] = useState('');
  const [candCount, setCandCount] = useState(settings.candCount || 6);
  const [minSec, setMinSec] = useState(settings.candMin || 20);
  const [maxSec, setMaxSec] = useState(settings.candMax || 50);
  const [analysisRes, setAnalysisRes] = useState<'auto' | 'low' | 'medium'>(settings.analysisRes || 'auto');
  const [projectTitle, setProjectTitle] = useState('');

  // Analysis progress & results
  const [analyzing, setAnalyzing] = useState(false);
  const [progressNote, setProgressNote] = useState('');
  const [uploadRatio, setUploadRatio] = useState<number | null>(null);
  const [analysisError, setAnalysisError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const [analysisSummary, setAnalysisSummary] = useState('');
  const [analysisPerson, setAnalysisPerson] = useState('');
  const [analysisModel, setAnalysisModel] = useState('');
  const [candidates, setCandidates] = useState<RepurposeCandidate[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Step 2 Preview modal
  const [previewCandIdx, setPreviewCandIdx] = useState<number | null>(null);

  // Step 3 Preview canvas & playback
  const pvCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const rafRef = useRef<number>(0);
  const [thumbOptions, setThumbOptions] = useState<string[] | null>(null);
  const [subAiBusy, setSubAiBusy] = useState(false);
  const [subAiNote, setSubAiNote] = useState('');

  // Step 4 Intro narration
  const [introSuggests, setIntroSuggests] = useState<string[] | null>(null);
  const [ttsBusy, setTtsBusy] = useState(false);
  const [introAudioUrl, setIntroAudioUrl] = useState<string>('');
  const [isRecordingIntro, setIsRecordingIntro] = useState(false);
  const [introRecSec, setIntroRecSec] = useState(0);
  const introRecRef = useRef<MediaRecorder | null>(null);
  const introStreamRef = useRef<MediaStream | null>(null);
  const introTimerRef = useRef<number | null>(null);
  const [aiBgBusy, setAiBgBusy] = useState(false);

  // Step 5 Export & Upload copy
  const [zipBusyId, setZipBusyId] = useState<string | null>(null);
  const [uploadGenBusy, setUploadGenBusy] = useState(false);
  const [uploadCopy, setUploadCopy] = useState<{ titles: string[]; description: string; hashtags: string[] } | null>(null);
  const [step5Toast, setStep5Toast] = useState('');

  const picks = candidates.filter((c) => c.status !== 'drop');
  const activeCand = picks[Math.min(selectedIdx, Math.max(0, picks.length - 1))] || null;
  const voices = listGeminiVoices();

  const attachLocalFile = async (f: File) => {
    const url = URL.createObjectURL(f);
    localFileRef.current = f;
    const meta = await new Promise<{ duration: number; width: number; height: number }>((res) => {
      const v = hiddenVideoRef.current || document.createElement('video');
      v.preload = 'metadata';
      v.src = url;
      v.onloadedmetadata = () => {
        res({
          duration: v.duration || 0,
          width: v.videoWidth || 0,
          height: v.videoHeight || 0,
        });
      };
      v.onerror = () => res({ duration: 0, width: 0, height: 0 });
    });

    setSourceInfo((prev) => ({
      ...prev,
      type: prev.type === 'youtube' ? 'youtube' : 'file',
      title: prev.title || f.name.replace(/\.[^.]+$/, ''),
      fileName: f.name,
      fileSize: f.size,
      fileType: f.type || guessMediaMime(f.name),
      fileUrl: url,
      duration: prev.duration || meta.duration,
      width: meta.width,
      height: meta.height,
      geminiFile: undefined,
    }));
  };

  useEffect(() => {
    if (incomingFile) {
      attachLocalFile(incomingFile).finally(() => {
        onConsumeIncomingFile?.();
      });
    }
  }, [incomingFile]);

  const handleFetchYt = async (rawUrl: string) => {
    const id = parseYoutubeId(rawUrl);
    if (!id) {
      if (rawUrl.trim()) setAnalysisError('유효한 유튜브 링크 형식이 아닙니다.');
      return;
    }
    setAnalysisError('');
    const canonical = `https://www.youtube.com/watch?v=${id}`;
    setSourceInfo((prev) => ({
      ...prev,
      type: 'youtube',
      url: canonical,
      videoId: id,
      thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    }));
    if (getActiveYoutubeKey()) {
      try {
        const info = await fetchYoutubeVideoInfo(id);
        setSourceInfo((prev) => ({
          ...prev,
          title: info.title,
          channel: info.channel,
          thumb: info.thumb,
          duration: info.duration,
          views: info.views,
        }));
      } catch (e) {
        setAnalysisError(explainSinsooError(e));
      }
    }
  };

  const prepareMediaForGemini = async (signal: AbortSignal): Promise<GeminiMediaPart> => {
    if (sourceInfo.type === 'youtube' && sourceInfo.url && !localFileRef.current) {
      setProgressNote('유튜브 URL 링크로 직접 분석 요청을 준비합니다…');
      return { kind: 'video', uri: sourceInfo.url };
    }
    const f = localFileRef.current;
    if (!f) throw new Error('분석할 유튜브 URL 또는 로컬 영상 파일을 먼저 입력해 주세요.');

    if (sourceInfo.geminiFile?.name) {
      const existing = await getGeminiFile(sourceInfo.geminiFile.name);
      if (existing?.state === 'ACTIVE') {
        setProgressNote('이전에 업로드한 Google Files API 영상을 재사용합니다.');
        return { kind: 'video', uri: sourceInfo.geminiFile.uri, mime: sourceInfo.geminiFile.mime };
      }
    }

    if (f.size <= 19 * 1024 * 1024) {
      setProgressNote(`소형 영상(${fmtBytes(f.size)})을 요청에 직접 인라인 첨부 중…`);
      const b64 = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result).split(',')[1] || '');
        r.onerror = () => rej(new Error('파일을 읽을 수 없습니다.'));
        r.readAsDataURL(f);
      });
      return { kind: 'video', data: b64, mime: sourceInfo.fileType || 'video/mp4' };
    }

    setProgressNote('20MB 초과 대용량 영상 — Google Files API로 청크 업로드 중 0%');
    setUploadRatio(0);
    const up = await uploadGeminiFile(f, {
      onProgress: (p) => {
        setUploadRatio(p);
        setProgressNote(`Google Files API 업로드 중 ${Math.round(p * 100)}%`);
      },
      signal,
    });
    setUploadRatio(null);
    setProgressNote('업로드 완료 — Google 서버 미디어 처리 대기 중…');
    const active = await waitGeminiFileActive(up.name, {
      onNote: (m) => setProgressNote(m),
      signal,
    });
    const gf = {
      uri: active.uri || up.uri,
      name: up.name,
      mime: active.mimeType || up.mime,
      expires: active.expirationTime || '',
    };
    setSourceInfo((prev) => ({ ...prev, geminiFile: gf }));
    return { kind: 'video', uri: gf.uri, mime: gf.mime };
  };

  const handleAnalyze = async () => {
    if (analyzing) return;
    if (!getActiveGeminiKey()) {
      onOpenSettings();
      return;
    }
    if (!sourceInfo.url && !localFileRef.current) {
      setAnalysisError('유튜브 링크를 입력하거나 로컬 동영상 파일을 첨부해 주세요.');
      return;
    }

    setAnalyzing(true);
    setAnalysisError('');
    setProgressNote('원본 영상 준비 중…');
    const ac = new AbortController();
    abortRef.current = ac;

    const effMax = Math.max(minSec + 5, maxSec);
    try {
      const dur = sourceInfo.duration || 0;
      const media = await prepareMediaForGemini(ac.signal);
      const res: 'low' | 'medium' = analysisRes === 'auto' ? (dur && dur <= 15 * 60 ? 'medium' : 'low') : analysisRes;
      media.res = res;

      const chunks: (null | { start: number; end: number })[] =
        dur > 55 * 60
          ? Array.from({ length: Math.ceil(dur / (50 * 60)) }, (_, i) => ({
              start: i * 50 * 60,
              end: Math.min(dur, (i + 1) * 50 * 60),
            }))
          : [null];

      let allCands: RepurposeCandidate[] = [];
      let sum = '';
      let per = '';
      let usedMod = '';

      for (let i = 0; i < chunks.length; i++) {
        const ch = chunks[i];
        const countForChunk = Math.max(2, Math.round(candCount / chunks.length));
        const chunkMedia: GeminiMediaPart = ch ? { ...media, start: ch.start, end: ch.end } : media;
        setProgressNote(
          ch
            ? `AI 영상 분석 중 (${i + 1}/${chunks.length} 구간: ${fmtTimecode(ch.start)}~${fmtTimecode(ch.end)}, ${res})`
            : `AI가 영상 전체를 시청하며 쇼츠 하이라이트 ${candCount}개를 추출하는 중 (${res})… 1~3분 소요`
        );

        const rangeLine = ch
          ? `\n[분석 범위] 이 요청에서는 영상의 ${fmtTimecode(ch.start)} ~ ${fmtTimecode(ch.end)} 구간만 봅니다. 타임코드는 영상 전체 기준 절대 시각으로 적으세요.`
          : '';
        const prompt = `당신은 한국 유튜브 숏츠 전문 편집자입니다. 첨부한 영상${dur ? `(길이 약 ${fmtTimecode(dur)})` : ''}${personName ? ` (핵심 인물: ${personName})` : ''} 전체를 끝까지 보고 숏츠(세로 9:16, ${minSec}~${effMax}초) 후보 ${countForChunk}개를 뽑아 JSON으로만 출력하세요.${rangeLine}

[선정 기준] 1) 흥미도·후킹(첫 3초에 궁금증) 2) 그 구간만 봐도 이해되는 독립성 3) 반전·숫자·명언·감정 포인트 4) 맥락 왜곡 없음. 문장이 중간에 잘리지 않게 자연스러운 발화 경계에서 시작·종료하고, 후보끼리 겹치지 않게 하세요.
[타임코드] 반드시 영상의 실제 시각을 "MM:SS" 또는 "H:MM:SS" 형식(소수점 가능, 예 "12:03.5")으로 적으세요.
[자막] 각 후보의 subtitles는 그 구간에서 실제로 들리는 발언을 그대로(요약·의역 금지) 1.5~4초 단위, 한 줄 22자 이내로 끊어서 적으세요. 발언이 없으면 빈 배열.
[화면 제목] thumb는 그 숏츠 전체 내용을 가장 압축적으로 전달하는 후킹 문구, 1~2줄(줄바꿈 \\n, 줄당 10자 이내), 강조 단어는 **단어**.
[도입 내레이션] intro는 영상 시작 전에 3~5초간 들어갈 배경 설명 1~2문장(40~75자, 구어체 존댓말). 사실만 쓰고 추측은 금지.
[출력 JSON]
{"summary":"영상 전체 3문장 요약","person":"핵심 인물명(직함)","candidates":[{"start":"MM:SS","end":"MM:SS","title":"유튜브 업로드 제목(24자 이내)","thumb":"화면 큰 제목","reason":"선정 이유 1~2문장","hook":9,"tags":["키워드"],"intro":"도입 내레이션 문장","subtitles":[{"s":"MM:SS","e":"MM:SS","t":"자막"}]}]}`;

        const r = await genGeminiText({
          model: settings.model,
          text: prompt,
          media: [chunkMedia],
          json: true,
          thinking: 'medium',
          maxTokens: 32768,
          timeoutMs: 600000,
          signal: ac.signal,
          onNote: (m) => setProgressNote(m),
        });
        const j = parseGeminiJson<any>(r.text);
        usedMod = r.model;
        if (!sum) sum = String(j.summary || '');
        if (!per) per = String(j.person || '');

        const sGlobal = settings;
        (j.candidates || []).forEach((c: any) => {
          let s = parseTimecode(c.start);
          let e = parseTimecode(c.end);
          if (Number.isNaN(s) || Number.isNaN(e)) return;
          if (dur) {
            s = Math.max(0, Math.min(s, dur - 1));
            e = Math.max(s + 3, Math.min(e, dur));
          }
          if (e - s < 3) return;
          const subs: SubtitleCue[] = (c.subtitles || [])
            .map((x: any) => ({
              s: parseTimecode(x.s),
              e: parseTimecode(x.e),
              t: String(x.t || '').trim(),
            }))
            .filter((x: SubtitleCue) => !Number.isNaN(x.s) && !Number.isNaN(x.e) && x.t)
            .map((x: SubtitleCue) => ({ s: Math.max(s, x.s), e: Math.min(e, Math.max(x.s + 0.4, x.e)), t: x.t }))
            .filter((x: SubtitleCue) => x.e > x.s);

          allCands.push({
            id: sinsooVault.uid(),
            start: s,
            end: e,
            title: String(c.title || '').trim(),
            thumb: String(c.thumb || c.title || '').replace(/\\n/g, '\n').trim(),
            reason: String(c.reason || '').trim(),
            hook: Math.max(1, Math.min(10, +c.hook || 7)),
            tags: Array.isArray(c.tags) ? c.tags.map(String).slice(0, 6) : [],
            status: 'pick',
            subtitles: subs,
            subOn: true,
            layout: sGlobal.layout === 'crop' ? 'crop' : sGlobal.layout === 'frame' ? 'frame' : 'blur',
            cropX: 0.5,
            titleFont: sGlobal.titleFont || 'Black Han Sans',
            accent: sGlobal.titleAccent || '#ffd54a',
            brand: sGlobal.handle || sGlobal.brand || '',
            subSize: sGlobal.subSize || 54,
            subPos: 'bottom',
            subBg: 'box',
            intro: {
              mode: 'tts',
              ttsEngine:
                sGlobal.elevenLabsKey?.trim() && sGlobal.ttsProvider === 'elevenlabs' ? 'elevenlabs' : 'gemini',
              elevenVoiceId: sGlobal.elevenLabsVoiceId || VOICE_OPTIONS[0].id,
              text: String(c.intro || '').trim(),
              voice: sGlobal.voice || 'Kore',
              style: sGlobal.ttsStyle || '차분하고 또렷한 다큐멘터리 내레이션',
              speed: 1,
              assetId: '',
              dur: 0,
              visual: 'frame',
              imageAssetId: '',
              showText: true,
            },
          });
        });
      }

      if (!allCands.length) {
        throw new Error('후보 구간을 추출하지 못했습니다. 영상 길이 범위를 조정해 다시 시도해 주세요.');
      }
      allCands.sort((a, b) => a.start - b.start);
      allCands = allCands.slice(0, Math.max(candCount, 3));

      setAnalysisSummary(sum);
      setAnalysisPerson(per || personName);
      setAnalysisModel(usedMod);
      setCandidates(allCands);
      setSelectedIdx(0);
      setStep(2);
      setProgressNote('');
    } catch (e) {
      setAnalysisError(explainSinsooError(e));
    } finally {
      setAnalyzing(false);
      setUploadRatio(null);
      abortRef.current = null;
    }
  };

  const updateCandidate = (id: string, fn: (prev: RepurposeCandidate) => RepurposeCandidate) => {
    setCandidates((prev) => prev.map((c) => (c.id === id ? fn(c) : c)));
  };

  /* ───────── Step 3 Canvas Preview Rendering ───────── */
  const renderPreviewFrame = (cand: RepurposeCandidate, isIntro = false) => {
    const cv = pvCanvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const W = cv.width;
    const H = cv.height;
    ctx.fillStyle = '#0d0b0e';
    ctx.fillRect(0, 0, W, H);

    const v = hiddenVideoRef.current;
    const hasVid = Boolean(sourceInfo.fileUrl && v && v.videoWidth > 0);
    if (hasVid && v) {
      const vw = v.videoWidth;
      const vh = v.videoHeight;
      if (cand.layout === 'crop') {
        const scale = Math.max(W / vw, H / vh);
        const cw = W / scale;
        const ch = H / scale;
        const sx = Math.max(0, Math.min(vw - cw, (vw - cw) * cand.cropX));
        const sy = Math.max(0, Math.min(vh - ch, (vh - ch) * 0.4));
        ctx.drawImage(v, sx, sy, cw, ch, 0, 0, W, H);
      } else {
        // blur background or 4:3 frame
        ctx.save();
        ctx.filter = 'blur(18px) brightness(0.45)';
        const scBg = Math.max(W / vw, H / vh);
        const bw = W / scBg;
        const bh = H / scBg;
        ctx.drawImage(v, (vw - bw) / 2, (vh - bh) / 2, bw, bh, 0, 0, W, H);
        ctx.restore();

        const targetH = cand.layout === 'frame' ? Math.round((W * 3) / 4) : Math.round((W * vh) / vw);
        const vy = Math.round(H * 0.5 - targetH / 2 + 20);
        const scFg = Math.min(W / vw, targetH / vh);
        const fw = vw * scFg;
        const fh = vh * scFg;
        ctx.drawImage(v, (W - fw) / 2, vy + (targetH - fh) / 2, fw, fh);
      }
    } else {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, '#1e293b');
      g.addColorStop(1, '#0f172a');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    if (isIntro) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(0, 0, W, H);
    }

    // Top Title (up to 2 lines, **accent** support)
    if (cand.thumb) {
      const lines = cand.thumb.replace(/\*\*/g, '').split('\n').filter(Boolean).slice(0, 2);
      ctx.save();
      ctx.font = `800 36px "${cand.titleFont}", Pretendard, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      lines.forEach((line, i) => {
        const y = 96 + i * 46;
        ctx.lineWidth = 6;
        ctx.strokeStyle = 'rgba(0,0,0,0.9)';
        ctx.strokeText(line, W / 2, y);
        ctx.fillStyle = i === 1 ? cand.accent : '#ffffff';
        ctx.fillText(line, W / 2, y);
      });
      ctx.restore();
    }

    // Brand watermark
    if (cand.brand) {
      ctx.save();
      ctx.font = '600 16px Pretendard, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.fillText(cand.brand, W / 2, H - 56);
      ctx.restore();
    }

    // Subtitles
    const curT = hasVid && v ? v.currentTime : cand.start;
    const cueText = isIntro
      ? cand.intro.showText
        ? cand.intro.text
        : ''
      : cand.subOn
      ? cand.subtitles.find((s) => curT >= s.s && curT < s.e)?.t || (!hasVid ? cand.subtitles[0]?.t || '' : '')
      : '';

    if (cueText) {
      ctx.save();
      const px = Math.round((cand.subSize || 54) * 0.42);
      ctx.font = `700 ${px}px Pretendard, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const subY = cand.subPos === 'mid' ? Math.round(H * 0.58) : H - 150;
      const w = Math.min(W - 40, ctx.measureText(cueText).width + 24);
      if (cand.subBg === 'box') {
        ctx.fillStyle = 'rgba(0,0,0,0.72)';
        ctx.fillRect(W / 2 - w / 2, subY - px * 0.85, w, px * 1.7);
      } else if (cand.subBg === 'stroke') {
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(0,0,0,0.9)';
        ctx.strokeText(cueText, W / 2, subY, W - 48);
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillText(cueText, W / 2, subY, W - 48);
      ctx.restore();
    }
  };

  useEffect(() => {
    if ((step === 3 || step === 4) && activeCand) {
      renderPreviewFrame(activeCand, step === 4);
    }
  }, [step, activeCand, sourceInfo.fileUrl]);

  useEffect(() => {
    if ((step === 4 || step === 5) && activeCand?.intro.assetId) {
      sinsooVault.getAsset(activeCand.intro.assetId).then((a) => {
        if (a?.blob) {
          setIntroAudioUrl(URL.createObjectURL(a.blob));
        } else {
          setIntroAudioUrl('');
        }
      });
    } else {
      setIntroAudioUrl('');
    }
  }, [step, activeCand?.id, activeCand?.intro.assetId]);

  const stopPreviewLoop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    const v = hiddenVideoRef.current;
    if (v && !v.paused) v.pause();
    setIsPlayingPreview(false);
  };

  const togglePlayPreview = async () => {
    if (!activeCand) return;
    if (isPlayingPreview) {
      stopPreviewLoop();
      return;
    }
    const v = hiddenVideoRef.current;
    if (!v || !sourceInfo.fileUrl) {
      setAnalysisError('영상 구간 미리보기 재생에는 로컬 영상 파일 첨부가 필요합니다.');
      return;
    }
    v.currentTime = activeCand.start;
    v.muted = false;
    await v.play().catch(() => {});
    setIsPlayingPreview(true);
    const tick = () => {
      if (!v || v.paused || v.currentTime >= activeCand.end) {
        stopPreviewLoop();
        renderPreviewFrame(activeCand, false);
        return;
      }
      renderPreviewFrame(activeCand, false);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const handleSuggestThumbs = async (c: RepurposeCandidate) => {
    if (!getActiveGeminiKey()) return onOpenSettings();
    try {
      const r = await genGeminiText({
        text: `유튜브 쇼츠 화면 상단에 크게 들어갈 2줄 후킹 문구 6개를 JSON으로 제안하세요.
영상: ${projectTitle || sourceInfo.title} (${analysisPerson || personName})
제목: ${c.title}
이유: ${c.reason}
자막 발췌: ${c.subtitles.slice(0, 6).map((x) => x.t).join(' / ')}
형식: {"options":["첫줄\\n**둘째줄**", ...]}`,
        json: true,
        thinking: 'low',
        maxTokens: 1024,
      });
      const j = parseGeminiJson<{ options: string[] }>(r.text);
      setThumbOptions((j.options || []).map((x) => String(x).replace(/\\n/g, '\n')));
    } catch (e) {
      setAnalysisError(explainSinsooError(e));
    }
  };

  const handlePreciseSubs = async (c: RepurposeCandidate) => {
    if (!getActiveGeminiKey()) return onOpenSettings();
    setSubAiBusy(true);
    setSubAiNote('구간 정밀 자막 재전사 중…');
    try {
      const ac = new AbortController();
      const media = await prepareMediaForGemini(ac.signal);
      media.start = Math.max(0, c.start - 0.5);
      media.end = c.end + 0.5;
      media.fps = 2;
      media.res = 'low';
      const r = await genGeminiText({
        model: settings.model,
        text: `첨부 영상의 ${fmtTimecode(c.start, true)} ~ ${fmtTimecode(c.end, true)} 구간에서 들리는 발언을 정확히 전사해 자막 JSON으로만 출력하세요. 타임코드는 영상 전체 기준 절대 시각 "MM:SS.s". 1.5~4초 단위, 한 줄 22자 이내, 실제 발언 그대로(추임새 정리 가능). 형식: {"subtitles":[{"s":"MM:SS.s","e":"MM:SS.s","t":"자막"}]}`,
        media: [media],
        json: true,
        thinking: 'low',
        maxTokens: 8192,
      });
      const j = parseGeminiJson<{ subtitles: { s: string; e: string; t: string }[] }>(r.text);
      const nextSubs = (j.subtitles || [])
        .map((x) => ({ s: parseTimecode(x.s), e: parseTimecode(x.e), t: String(x.t || '').trim() }))
        .filter((x) => !Number.isNaN(x.s) && !Number.isNaN(x.e) && x.t && x.e > x.s)
        .map((x) => ({ s: Math.max(c.start, x.s), e: Math.min(c.end, x.e), t: x.t }));
      if (!nextSubs.length) throw new Error('자막 추출 결과가 비어 있습니다.');
      updateCandidate(c.id, (prev) => ({ ...prev, subtitles: nextSubs }));
      setSubAiNote(`${nextSubs.length}줄 정밀 전사 완료 (${r.model})`);
    } catch (e) {
      setSubAiNote(explainSinsooError(e));
    } finally {
      setSubAiBusy(false);
    }
  };

  /* ───────── Step 4 Intro Narration Helpers ───────── */
  const handleSuggestIntros = async (c: RepurposeCandidate) => {
    if (!getActiveGeminiKey()) return onOpenSettings();
    try {
      const r = await genGeminiText({
        text: `유튜브 숏츠 앞에 3~5초간 들어갈 도입 내레이션을 3가지 제안하세요.
제목: "${c.title}" (${analysisPerson || personName}).
이유: ${c.reason}.
자막: ${c.subtitles.slice(0, 6).map((x) => x.t).join(' / ')}
조건: 40~75자, 구어체 존댓말, 시점·맥락 설명, 사실만.
JSON: {"options":["문장1","문장2","문장3"]}`,
        json: true,
        thinking: 'low',
        maxTokens: 1024,
      });
      const j = parseGeminiJson<{ options: string[] }>(r.text);
      setIntroSuggests((j.options || []).map(String));
    } catch (e) {
      setAnalysisError(explainSinsooError(e));
    }
  };

  const generateIntroTtsForCandidate = async (c: RepurposeCandidate) => {
    if (!c.intro.text.trim()) throw new Error('도입 내레이션 문장을 먼저 입력해 주세요.');
    const hasEleven = Boolean(settings.elevenLabsKey?.trim());
    const engine = (c.intro.ttsEngine || settings.ttsProvider) === 'elevenlabs' && hasEleven ? 'elevenlabs' : 'gemini';
    let blob: Blob;
    let ext = 'wav';
    let mime = 'audio/wav';

    if (engine === 'elevenlabs') {
      const r = await synthesizeElevenLabsTts({
        text: c.intro.text,
        voiceId: c.intro.elevenVoiceId || settings.elevenLabsVoiceId || VOICE_OPTIONS[0].id,
        modelId: settings.elevenLabsModel || ELEVENLABS_MODELS[0].id,
        apiKey: settings.elevenLabsKey,
      });
      blob = r.blob;
      ext = 'mp3';
      mime = 'audio/mpeg';
    } else {
      const r = await synthesizeGeminiTts({
        text: c.intro.text,
        voice: c.intro.voice,
        style: c.intro.style,
        model: settings.ttsModel,
      });
      blob = r.blob;
    }

    const decoded = await decodeAudioBlob(blob);
    if (c.intro.assetId) await sinsooVault.deleteAsset(c.intro.assetId);
    const saved = await sinsooVault.putAsset({
      projectId: c.id,
      kind: 'tts',
      name: `도입_${safeFileName(c.title, 20)}.${ext}`,
      type: mime,
      blob,
    });
    updateCandidate(c.id, (prev) => ({
      ...prev,
      intro: {
        ...prev.intro,
        mode: 'tts',
        ttsEngine: engine,
        assetId: saved.id,
        dur: Math.round(decoded.duration * 10) / 10,
      },
    }));
  };

  const handleGenerateSingleIntroTts = async (c: RepurposeCandidate) => {
    const engine = c.intro.ttsEngine || settings.ttsProvider || 'gemini';
    if (engine === 'elevenlabs' && !settings.elevenLabsKey?.trim()) return onOpenSettings();
    if (engine === 'gemini' && !getActiveGeminiKey()) return onOpenSettings();
    setTtsBusy(true);
    setAnalysisError('');
    try {
      await generateIntroTtsForCandidate(c);
    } catch (e) {
      setAnalysisError(explainSinsooError(e));
    } finally {
      setTtsBusy(false);
    }
  };

  const handleGenerateAllIntroTts = async () => {
    const targets = picks.filter((c) => c.intro.mode === 'tts' && c.intro.text.trim());
    if (!targets.length) return;
    const needsEleven = targets.some((c) => (c.intro.ttsEngine || settings.ttsProvider || 'gemini') === 'elevenlabs');
    const needsGemini = targets.some((c) => (c.intro.ttsEngine || settings.ttsProvider || 'gemini') === 'gemini');
    if (needsEleven && !settings.elevenLabsKey?.trim()) return onOpenSettings();
    if (needsGemini && !getActiveGeminiKey()) return onOpenSettings();
    setTtsBusy(true);
    setAnalysisError('');
    try {
      for (const c of targets) {
        await generateIntroTtsForCandidate(c);
      }
      setStep5Toast(`채택된 후보 ${targets.length}개의 도입 음성을 모두 생성했습니다 ✓`);
    } catch (e) {
      setAnalysisError(explainSinsooError(e));
    } finally {
      setTtsBusy(false);
    }
  };

  const toggleIntroMicRecord = async (c: RepurposeCandidate) => {
    if (isRecordingIntro) {
      if (introRecRef.current && introRecRef.current.state !== 'inactive') {
        introRecRef.current.stop();
      }
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const mimeType =
        ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find((t) => MediaRecorder.isTypeSupported(t)) || '';
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      rec.onstop = async () => {
        if (introTimerRef.current) clearInterval(introTimerRef.current);
        setIsRecordingIntro(false);
        stream.getTracks().forEach((t) => t.stop());
        const raw = new Blob(chunks, { type: mimeType || 'audio/webm' });
        const decoded = await decodeAudioBlob(raw);
        const wav = audioBufferToWavBlob(decoded);
        if (c.intro.assetId) await sinsooVault.deleteAsset(c.intro.assetId);
        const saved = await sinsooVault.putAsset({
          projectId: c.id,
          kind: 'rec',
          name: `도입녹음_${safeFileName(c.title, 20)}.wav`,
          type: 'audio/wav',
          blob: wav,
        });
        updateCandidate(c.id, (prev) => ({
          ...prev,
          intro: {
            ...prev.intro,
            mode: 'rec',
            assetId: saved.id,
            dur: Math.round(decoded.duration * 10) / 10,
          },
        }));
      };
      introStreamRef.current = stream;
      introRecRef.current = rec;
      rec.start();
      setIsRecordingIntro(true);
      setIntroRecSec(0);
      const t0 = Date.now();
      introTimerRef.current = window.setInterval(() => setIntroRecSec((Date.now() - t0) / 1000), 100);
    } catch (e) {
      setAnalysisError('마이크 권한을 허용해 주세요: ' + (e as Error).message);
    }
  };

  /* ───────── Step 5 Export ZIP & Hand-off to Advanced Canvas Renderer ───────── */
  const handleExportZip = async (c: RepurposeCandidate) => {
    setZipBusyId(c.id);
    try {
      const sp = c.intro.speed || 1;
      const introDur = c.intro.mode !== 'none' && c.intro.assetId && c.intro.dur ? c.intro.dur / sp + 0.35 : 0;
      const shiftedSubs: SubtitleCue[] = c.subtitles.map((x) => ({
        s: x.s - c.start + introDur,
        e: x.e - c.start + introDur,
        t: x.t,
      }));
      const entries: { name: string; text?: string; blob?: Blob }[] = [
        { name: '자막_클립기준.srt', text: generateSrt(shiftedSubs, 0) },
        { name: '자막_원본기준.srt', text: generateSrt(c.subtitles, 0) },
        {
          name: '제목과_문구.txt',
          text: `업로드 제목: ${c.title}\n화면 제목: ${c.thumb}\n구간: ${fmtTimecode(c.start, true)} ~ ${fmtTimecode(c.end, true)} (${(c.end - c.start).toFixed(1)}초)\n도입 내레이션(${c.intro.mode}): ${c.intro.text}\n선정 이유: ${c.reason}\n태그: ${c.tags.join(', ')}\n원본: ${sourceInfo.url || sourceInfo.fileName}\n\n* 도입 내레이션은 AI 또는 제작자 음성이며 원본 인물의 실제 발언이 아닙니다.`,
        },
        {
          name: '컷시트.csv',
          text: generateCsv([
            ['순서', '구분', '시작(원본)', '끝(원본)', '길이(초)', '내용'],
            ...(introDur > 0 ? [[1, '도입 내레이션', '0:00', fmtTimecode(introDur, true), introDur.toFixed(1), c.intro.text]] : []),
            [introDur > 0 ? 2 : 1, '본편 클립', fmtTimecode(c.start, true), fmtTimecode(c.end, true), (c.end - c.start).toFixed(1), c.title],
          ]),
        },
      ];

      if (c.intro.assetId) {
        const a = await sinsooVault.getAsset(c.intro.assetId);
        if (a?.blob) {
          let finalBlob = a.blob;
          const isStretched = Math.abs(sp - 1) > 0.01;
          if (isStretched) {
            const decoded = await decodeAudioBlob(a.blob);
            finalBlob = audioBufferToWavBlob(stretchAudioBuffer(decoded, sp));
          }
          const ext = !isStretched && a.type.includes('mpeg') ? 'mp3' : 'wav';
          entries.push({
            name: sp !== 1 ? `도입_내레이션_${sp.toFixed(2)}x.${ext}` : `도입_내레이션.${ext}`,
            blob: finalBlob,
          });
        }
      }
      if (c.intro.imageAssetId) {
        const imgAsset = await sinsooVault.getAsset(c.intro.imageAssetId);
        if (imgAsset?.blob) entries.push({ name: '도입_이미지.jpg', blob: imgAsset.blob });
      }
      const v = hiddenVideoRef.current;
      if (sourceInfo.fileUrl && v && v.videoWidth > 0) {
        v.currentTime = c.start;
        await new Promise((r) => setTimeout(r, 180));
        const cv = document.createElement('canvas');
        cv.width = v.videoWidth;
        cv.height = v.videoHeight;
        cv.getContext('2d')?.drawImage(v, 0, 0);
        const frameBlob = await new Promise<Blob | null>((res) => cv.toBlob(res, 'image/jpeg', 0.92));
        if (frameBlob) entries.push({ name: '첫프레임.jpg', blob: frameBlob });
      }

      const zipBlob = await createZipBlob(entries);
      triggerDownload(zipBlob, `${safeFileName(c.title, 40)}_재가공_자료.zip`);
      setStep5Toast(`「${c.title}」 편집 자료 ZIP(SRT·컷시트·WAV) 다운로드 완료 ✓`);
    } catch (e) {
      setAnalysisError(explainSinsooError(e));
    } finally {
      setZipBusyId(null);
    }
  };

  const handleSendCandidateToCanvasRenderer = async (c: RepurposeCandidate) => {
    const scenes: SceneItem[] = [];
    let sceneIdx = 1;

    if (c.intro.mode !== 'none' && c.intro.text.trim()) {
      let introImgUrl = sourceInfo.thumb;
      if (c.intro.visual === 'image' && c.intro.imageAssetId) {
        const im = await sinsooVault.getAsset(c.intro.imageAssetId);
        if (im?.blob) introImgUrl = URL.createObjectURL(im.blob);
      }
      const introSec = Math.max(3, Math.round(c.intro.dur / (c.intro.speed || 1) || 4));
      scenes.push({
        sceneNumber: sceneIdx++,
        timeRange: `00:00 - 00:${String(introSec).padStart(2, '0')}`,
        narration: c.intro.text,
        visualGuide: '도입 후킹 배경 내레이션',
        imageSearchKeyword: analysisPerson || personName || c.title,
        visualEffect: '서서히 줌인 (Ken Burns)',
        uploadedImageUrl: introImgUrl,
        mediaType: 'image',
      });
    }

    // Main video clip scene(s) mapped from subtitles or whole range
    const subs = c.subtitles.length > 0 ? c.subtitles : [{ s: c.start, e: c.end, t: c.title }];
    subs.forEach((cue, i) => {
      const localStart = Math.max(0, cue.s - c.start);
      const localEnd = Math.max(localStart + 1, cue.e - c.start);
      scenes.push({
        sceneNumber: sceneIdx++,
        timeRange: `${fmtTimecode(localStart)} - ${fmtTimecode(localEnd)}`,
        narration: cue.t,
        visualGuide: `원본 클립 ${fmtTimecode(cue.s, true)} ~ ${fmtTimecode(cue.e, true)}`,
        imageSearchKeyword: analysisPerson || c.title,
        visualEffect: '원본 영상 클립 재생',
        uploadedVideoUrl: sourceInfo.fileUrl || undefined,
        uploadedImageUrl: sourceInfo.thumb || undefined,
        mediaType: sourceInfo.fileUrl ? 'video' : 'image',
        videoStartTime: cue.s,
        videoEndTime: cue.e,
        videoMuted: false,
        videoVolume: 100,
        videoFit: c.layout === 'crop' ? 'cover' : 'contain',
        videoCrop: { xPercent: Math.round(c.cropX * 100), yPercent: 50, zoom: 1 },
        text: cue.t,
        ...(i === 0 ? { bgmSuggestion: '원본 오디오 유지' } : {}),
      });
    });

    const durSec = Math.round(c.end - c.start + (c.intro.mode !== 'none' ? 4 : 0));
    const project: ShortsProject = {
      id: `repurpose_${c.id}_${Date.now()}`,
      figureName: analysisPerson || personName || c.title,
      category: 'viral',
      targetPersona: '3040_success',
      targetDuration: durSec >= 52 ? 60 : 45,
      hooks: [{ type: 'provocative', label: 'AI 재가공 훅', text: c.thumb || c.title }],
      selectedHookIndex: 0,
      titles: uploadCopy?.titles.length ? uploadCopy.titles : [c.title],
      hashtags: uploadCopy?.hashtags.length ? uploadCopy.hashtags : c.tags,
      description: uploadCopy?.description || c.reason,
      pinnedComment: '',
      fullScript: scenes.map((s) => s.narration).join(' '),
      scenes,
      copyrightDefenseNote: 'AI 재가공 클립 · 도입 내레이션은 제작자/AI 음성이며 원본 발언과 분리 표기됩니다.',
      estimatedSeconds: durSec,
      charCount: scenes.reduce((acc, s) => acc + s.narration.length, 0),
      createdAt: new Date().toISOString(),
      photoAspectRatio: c.layout === 'crop' ? '9:16' : 'fit',
      backdropStyle: 'blur',
      customTextOverlays: c.thumb
        ? [
            {
              id: 'repurpose_top_headline',
              text: c.thumb.replace(/\*\*/g, ''),
              startScene: 1,
              endScene: scenes.length,
              positionYPercent: 14,
              positionX: 'center',
              positionXPercent: 50,
              fontSizeScale: 1.25,
              fontFamily: c.titleFont === 'Black Han Sans' ? 'Black Han Sans' : 'GmarketSans',
              textColor: '#FFFFFF',
              backgroundColor: 'rgba(0,0,0,0.65)',
              bgOpacityPercent: 75,
              isBold: true,
            },
          ]
        : [],
      channelLogoOverlay: candBrandToLogo(c.brand, scenes.length),
    };

    onSendToRenderer(project);
  };

  const candBrandToLogo = (brand: string, totalScenes: number) =>
    brand
      ? {
          enabled: true,
          channelName: brand,
          position: 'top-center' as const,
          startScene: 1,
          endScene: totalScenes,
          size: 'small' as const,
          shape: 'rounded' as const,
          showChannelName: true,
          yPercent: 6,
        }
      : undefined;

  const handleGenerateUploadCopy = async () => {
    if (!getActiveGeminiKey()) return onOpenSettings();
    setUploadGenBusy(true);
    try {
      const r = await genGeminiText({
        text: `유튜브 숏츠 업로드 문구를 만드세요. 원본: "${projectTitle || sourceInfo.title}" (${analysisPerson || personName}).
요약: ${analysisSummary}
후보 쇼츠: ${picks.map((c) => c.title).join(' / ')}
브랜드: ${settings.brand || settings.handle || '개인 채널'}
JSON으로만 출력:
{"titles":["후킹 제목 5개(각 30자 이내)"],"description":"설명글 3~5문장 + 출처 표기 안내","hashtags":["해시태그 10개(# 제외)"]}`,
        json: true,
        thinking: 'low',
        maxTokens: 2048,
      });
      const j = parseGeminiJson<any>(r.text);
      setUploadCopy({
        titles: (j.titles || []).map(String),
        description: String(j.description || ''),
        hashtags: (j.hashtags || []).map(String),
      });
    } catch (e) {
      setAnalysisError(explainSinsooError(e));
    } finally {
      setUploadGenBusy(false);
    }
  };

  return (
    <div className="space-y-5 text-[#37352F]">
      {/* Hidden shared video decoder element */}
      <video ref={hiddenVideoRef} src={sourceInfo.fileUrl || undefined} className="hidden" preload="metadata" playsInline />

      {/* Top Notion Stepper Header */}
      <div className="bg-white rounded-2xl border border-[#EDEDEB] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-[#191919] flex items-center gap-2">
              <Film className="w-5 h-5 text-indigo-600" />
              <span>기존 영상 AI 재가공 (하이라이트 추출 · 도입 내레이션 · SRT/ZIP)</span>
            </h2>
          </div>
          <p className="text-xs text-[#787774] mt-0.5">
            긴 유튜브/로컬 영상에서 AI가 숏츠 후보를 뽑고, 자막·3~5초 도입 내레이션 후 고도화 캔버스 렌더러 또는 ZIP으로 출력합니다.
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => onOpenCollector(analysisPerson || personName)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F1F1EF] hover:bg-[#E9E9E7] text-[#37352F] border border-[#E3E2DE] text-xs font-semibold transition cursor-pointer"
          >
            <Mic className="w-3.5 h-3.5 text-rose-500" />
            <span>화면 녹화 · 소재함</span>
          </button>
        </div>
      </div>

      {/* Notion Pill 5-Step Progress Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {STEPS.map((label, idx) => {
          const stepNum = idx + 1;
          const canEnter = stepNum === 1 || (stepNum === 2 ? candidates.length > 0 : picks.length > 0);
          return (
            <button
              key={label}
              type="button"
              disabled={!canEnter}
              onClick={() => canEnter && setStep(stepNum)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap border transition cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                step === stepNum
                  ? 'bg-[#23272A] text-white border-[#23272A] shadow-xs font-semibold'
                  : canEnter
                  ? 'bg-white text-[#37352F] border-[#E3E2DE] hover:bg-[#F7F6F3]'
                  : 'bg-[#F1F1EF] text-[#9B9A97] border-transparent'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${
                  step === stepNum ? 'bg-white/20 text-white' : 'bg-[#F1F1EF] text-[#787774]'
                }`}
              >
                {stepNum}
              </span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {analysisError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{analysisError}</span>
          </div>
          <button
            type="button"
            onClick={() => setAnalysisError('')}
            className="text-rose-500 hover:text-rose-800 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ───────── STEP 1: Source & Options ───────── */}
      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-[#EDEDEB] p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[#191919] flex items-center gap-1.5">
                <LinkIcon className="w-4 h-4 text-indigo-600" />
                원본 영상 입력 (유튜브 URL 또는 로컬 파일)
              </h3>
              <p className="text-xs text-[#787774] mt-1">
                유튜브 링크만 넣어도 AI가 영상을 시청해 타임코드/자막을 분석합니다. 직접 MP4 렌더링이 필요하면 영상 파일도 첨부해 주세요.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#37352F]">유튜브 링크</label>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={ytInput}
                  onChange={(e) => setYtInput(e.target.value)}
                  onPaste={(e) => {
                    const pasted = e.clipboardData.getData('text');
                    setTimeout(() => handleFetchYt(pasted), 30);
                  }}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="flex-1 px-3 py-2 rounded-xl border border-[#E3E2DE] bg-[#FBFBFA] text-xs outline-none focus:border-[#37352F]"
                />
                <button
                  type="button"
                  onClick={() => handleFetchYt(ytInput)}
                  className="px-3 py-2 rounded-xl bg-[#F1F1EF] hover:bg-[#E9E9E7] border border-[#E3E2DE] text-xs font-semibold cursor-pointer"
                >
                  정보 불러오기
                </button>
              </div>
            </div>

            {sourceInfo.url && (
              <div className="p-3 rounded-xl bg-[#F7F6F3] border border-[#E3E2DE] flex items-center gap-3">
                <img src={sourceInfo.thumb} alt="" className="w-24 aspect-video rounded-lg object-cover bg-black shrink-0" />
                <div className="min-w-0 text-xs">
                  <div className="font-bold text-[#191919] truncate">{sourceInfo.title || sourceInfo.url}</div>
                  <div className="text-[#787774] mt-0.5">
                    {sourceInfo.channel || 'YouTube'}
                    {sourceInfo.duration > 0 && ` · ${fmtTimecode(sourceInfo.duration)}`}
                    {sourceInfo.views ? ` · 조회 ${sourceInfo.views.toLocaleString()}회` : ''}
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-[#EDEDEB] space-y-2">
              <label className="block text-xs font-semibold text-[#37352F]">
                로컬 동영상 파일 첨부 <span className="font-normal text-[#787774]">(20MB 초과 시 Files API 자동 업로드)</span>
              </label>
              <label className="flex flex-col items-center justify-center gap-1.5 p-5 rounded-xl border-2 border-dashed border-[#D3D1CB] hover:border-[#37352F] bg-[#FBFBFA] cursor-pointer transition">
                <Upload className="w-5 h-5 text-[#787774]" />
                <span className="text-xs font-medium text-[#37352F]">
                  {sourceInfo.fileName ? sourceInfo.fileName : 'MP4, MOV, WebM 파일 선택 또는 드래그'}
                </span>
                {sourceInfo.fileName && (
                  <span className="text-[11px] text-[#787774]">
                    {fmtBytes(sourceInfo.fileSize)} · {sourceInfo.width}×{sourceInfo.height} · {fmtTimecode(sourceInfo.duration)}
                  </span>
                )}
                <input
                  type="file"
                  accept="video/*,.mp4,.mov,.webm,.mkv,.m4v"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) attachLocalFile(f);
                  }}
                />
              </label>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#EDEDEB] p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#191919] flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-amber-600" />
                AI 분석 옵션
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <label className="block">
                  <span className="font-medium text-[#37352F]">핵심 인물명 (선택)</span>
                  <input
                    type="text"
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                    placeholder="예: 이건희, 유재석"
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-[#E3E2DE] bg-[#FBFBFA] outline-none"
                  />
                </label>
                <label className="block">
                  <span className="font-medium text-[#37352F]">뽑을 후보 개수</span>
                  <select
                    value={candCount}
                    onChange={(e) => setCandCount(+e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-[#E3E2DE] bg-white"
                  >
                    {[3, 4, 5, 6, 8, 10].map((n) => (
                      <option key={n} value={n}>
                        {n}개
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="font-medium text-[#37352F]">최소 길이 (초)</span>
                  <input
                    type="number"
                    min={8}
                    max={120}
                    value={minSec}
                    onChange={(e) => setMinSec(+e.target.value || 20)}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-[#E3E2DE] bg-[#FBFBFA]"
                  />
                </label>
                <label className="block">
                  <span className="font-medium text-[#37352F]">최대 길이 (초)</span>
                  <input
                    type="number"
                    min={10}
                    max={180}
                    value={maxSec}
                    onChange={(e) => setMaxSec(+e.target.value || 50)}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-[#E3E2DE] bg-[#FBFBFA]"
                  />
                </label>
                <label className="block">
                  <span className="font-medium text-[#37352F]">분석 해상도</span>
                  <select
                    value={analysisRes}
                    onChange={(e) => setAnalysisRes(e.target.value as 'auto' | 'low' | 'medium')}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-[#E3E2DE] bg-white"
                  >
                    <option value="auto">자동 (권장)</option>
                    <option value="low">low (토큰 절약 · 긴 영상)</option>
                    <option value="medium">medium (정밀 화면 분석)</option>
                  </select>
                </label>
                <label className="block">
                  <span className="font-medium text-[#37352F]">프로젝트 이름</span>
                  <input
                    type="text"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    placeholder="비우면 원본 제목 사용"
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-[#E3E2DE] bg-[#FBFBFA]"
                  />
                </label>
              </div>

              {analyzing && (
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-indigo-900">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      {progressNote}
                    </span>
                    <button
                      type="button"
                      onClick={() => abortRef.current?.abort()}
                      className="text-rose-600 hover:underline cursor-pointer"
                    >
                      취소
                    </button>
                  </div>
                  {uploadRatio != null && (
                    <div className="w-full h-1.5 bg-indigo-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 transition-all"
                        style={{ width: `${Math.round(uploadRatio * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#EDEDEB] gap-2">
              <span className="text-[11px] text-[#787774]">
                {getActiveGeminiKey() ? 'Gemini 키 연결됨 ✓' : '먼저 API 키를 설정하세요'}
              </span>
              <button
                type="button"
                disabled={analyzing}
                onClick={handleAnalyze}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#23272A] hover:bg-black text-white text-xs font-bold shadow-xs transition disabled:opacity-60 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{analyzing ? '분석 진행 중…' : 'AI 분석 시작 → 쇼츠 후보 뽑기'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────── STEP 2: Candidate Picker ───────── */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#EDEDEB] p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#191919]">{projectTitle || sourceInfo.title || '분석 완료'}</h3>
              <p className="text-xs text-[#787774] mt-0.5">
                {analysisPerson} · 전체 후보 {candidates.length}개 중 <b className="text-emerald-700">{picks.length}개 채택</b> ·{' '}
                {analysisModel}
              </p>
              {analysisSummary && <p className="text-xs text-[#55534E] mt-2 leading-relaxed">{analysisSummary}</p>}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-3 py-1.5 rounded-xl border border-[#E3E2DE] bg-white text-xs font-medium hover:bg-[#F7F6F3] cursor-pointer"
              >
                다시 분석
              </button>
              <button
                type="button"
                disabled={picks.length === 0}
                onClick={() => {
                  setSelectedIdx(0);
                  setStep(3);
                }}
                className="px-4 py-1.5 rounded-xl bg-[#23272A] text-white text-xs font-bold hover:bg-black disabled:opacity-40 cursor-pointer"
              >
                채택 후보 편집 →
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {candidates.map((c, idx) => (
              <div
                key={c.id}
                className={`bg-white rounded-2xl border p-4 flex flex-col justify-between gap-3 transition ${
                  c.status === 'drop' ? 'border-[#EDEDEB] opacity-55' : 'border-[#E3E2DE] hover:border-[#D3D1CB]'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono bg-[#F1F1EF] px-2 py-0.5 rounded-md text-[#37352F]">
                        <Clock className="w-3 h-3" />
                        {fmtTimecode(c.start)} – {fmtTimecode(c.end)} ({Math.round(c.end - c.start)}초)
                      </span>
                      <span className="ml-1.5 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                        후킹 {c.hook}/10
                      </span>
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        c.status === 'pick'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : c.status === 'hold'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-rose-50 text-rose-600'
                      }`}
                    >
                      {c.status === 'pick' ? '채택' : c.status === 'hold' ? '보류' : '제외'}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-[#191919]">{c.title}</h4>
                  <p className="text-xs text-[#55534E] leading-relaxed">{c.reason}</p>

                  <div className="text-[11px] bg-[#F7F6F3] p-2 rounded-lg border border-[#EDEDEB] text-[#37352F]">
                    <b>화면 문구:</b> {c.thumb.replace(/\n/g, ' / ')}
                    <br />
                    <b>도입 내레이션:</b> {c.intro.text || '없음'}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F1F1EF] text-[#787774]">
                      자막 {c.subtitles.length}줄
                    </span>
                    {c.tags.map((t) => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-[#F1F1EF] text-[#787774]">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#EDEDEB]">
                  <div className="inline-flex bg-[#F1F1EF] p-0.5 rounded-lg text-[11px]">
                    {(
                      [
                        ['pick', '채택', Check],
                        ['hold', '보류', PauseCircle],
                        ['drop', '제외', XCircle],
                      ] as const
                    ).map(([st, lb, Icon]) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => updateCandidate(c.id, (prev) => ({ ...prev, status: st }))}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer ${
                          c.status === st ? 'bg-white text-[#191919] font-bold shadow-2xs' : 'text-[#787774]'
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        {lb}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPreviewCandIdx(idx)}
                      className="px-2.5 py-1.5 rounded-lg border border-[#E3E2DE] text-xs font-medium hover:bg-[#F7F6F3] cursor-pointer"
                    >
                      ▶ 구간 재생
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (c.status === 'drop') updateCandidate(c.id, (p) => ({ ...p, status: 'pick' }));
                        const nextIdx = picks.findIndex((p) => p.id === c.id);
                        setSelectedIdx(nextIdx >= 0 ? nextIdx : 0);
                        setStep(3);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#23272A] text-white text-xs font-semibold hover:bg-black cursor-pointer"
                    >
                      편집
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {previewCandIdx != null && candidates[previewCandIdx] && (
            <div
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
              onClick={(e) => e.target === e.currentTarget && setPreviewCandIdx(null)}
            >
              <div className="w-full max-w-2xl bg-white rounded-2xl p-4 space-y-3 shadow-2xl">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#191919]">{candidates[previewCandIdx].title}</h4>
                  <button
                    type="button"
                    onClick={() => setPreviewCandIdx(null)}
                    className="text-sm text-[#787774] hover:text-black cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                {sourceInfo.fileUrl ? (
                  <video
                    src={sourceInfo.fileUrl}
                    controls
                    autoPlay
                    onLoadedMetadata={(e) => {
                      e.currentTarget.currentTime = candidates[previewCandIdx].start;
                    }}
                    onTimeUpdate={(e) => {
                      if (e.currentTarget.currentTime >= candidates[previewCandIdx].end) e.currentTarget.pause();
                    }}
                    className="w-full rounded-xl bg-black max-h-[60vh]"
                  />
                ) : (
                  <iframe
                    title="YouTube Preview"
                    className="w-full aspect-video rounded-xl bg-black"
                    src={`https://www.youtube-nocookie.com/embed/${sourceInfo.videoId}?start=${Math.floor(
                      candidates[previewCandIdx].start
                    )}&end=${Math.ceil(candidates[previewCandIdx].end)}&autoplay=1&rel=0`}
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ───────── STEP 3 & STEP 4: Two-column Sticky Preview + Editor ───────── */}
      {(step === 3 || step === 4) && activeCand && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Sticky 9:16 Live Preview Canvas */}
          <div className="lg:col-span-5 lg:sticky lg:top-20 bg-white rounded-2xl border border-[#EDEDEB] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={selectedIdx === 0}
                  onClick={() => {
                    stopPreviewLoop();
                    setSelectedIdx((i) => Math.max(0, i - 1));
                  }}
                  className="p-1 rounded-lg border border-[#E3E2DE] disabled:opacity-35 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold">
                  후보 {selectedIdx + 1}/{picks.length}
                </span>
                <button
                  type="button"
                  disabled={selectedIdx >= picks.length - 1}
                  onClick={() => {
                    stopPreviewLoop();
                    setSelectedIdx((i) => Math.min(picks.length - 1, i + 1));
                  }}
                  className="p-1 rounded-lg border border-[#E3E2DE] disabled:opacity-35 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {step === 3 && (
                <button
                  type="button"
                  onClick={togglePlayPreview}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#23272A] text-white text-xs font-semibold hover:bg-black cursor-pointer"
                >
                  {isPlayingPreview ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                  <span>{isPlayingPreview ? '정지' : '구간 미리보기'}</span>
                </button>
              )}
            </div>

            <div className="w-full max-w-[270px] mx-auto aspect-[9/16] rounded-2xl overflow-hidden bg-black border border-[#E3E2DE] shadow-md">
              <canvas ref={pvCanvasRef} width={450} height={800} className="w-full h-full block" />
            </div>

            <div className="text-center text-[11px] text-[#787774]">
              {fmtTimecode(activeCand.start, true)} → {fmtTimecode(activeCand.end, true)} (
              {(activeCand.end - activeCand.start).toFixed(1)}초)
            </div>
          </div>

          {/* Right Panel: Step 3 Edit OR Step 4 Intro Narration */}
          <div className="lg:col-span-7 space-y-4">
            {step === 3 ? (
              <>
                {/* Range Trim */}
                <div className="bg-white rounded-2xl border border-[#EDEDEB] p-4 space-y-3">
                  <h4 className="text-xs font-bold text-[#191919] flex items-center gap-1.5">
                    <Scissors className="w-3.5 h-3.5 text-indigo-600" />
                    구간 자르기 (Start / End)
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <label className="block">
                      시작 (초)
                      <input
                        type="number"
                        step={0.1}
                        value={activeCand.start.toFixed(1)}
                        onChange={(e) => {
                          const v = Math.max(0, parseFloat(e.target.value) || 0);
                          updateCandidate(activeCand.id, (p) => ({ ...p, start: v, end: Math.max(v + 1, p.end) }));
                        }}
                        className="mt-1 w-full px-3 py-1.5 rounded-lg border border-[#E3E2DE] bg-[#FBFBFA]"
                      />
                    </label>
                    <label className="block">
                      끝 (초)
                      <input
                        type="number"
                        step={0.1}
                        value={activeCand.end.toFixed(1)}
                        onChange={(e) => {
                          const v = Math.max(activeCand.start + 1, parseFloat(e.target.value) || activeCand.start + 1);
                          updateCandidate(activeCand.id, (p) => ({ ...p, end: v }));
                        }}
                        className="mt-1 w-full px-3 py-1.5 rounded-lg border border-[#E3E2DE] bg-[#FBFBFA]"
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    {[-2, -0.5, 0.5, 2].map((d) => (
                      <button
                        key={`s${d}`}
                        type="button"
                        onClick={() =>
                          updateCandidate(activeCand.id, (p) => ({
                            ...p,
                            start: Math.max(0, Math.min(p.end - 1, p.start + d)),
                          }))
                        }
                        className="px-2 py-1 rounded bg-[#F1F1EF] hover:bg-[#E9E9E7] cursor-pointer"
                      >
                        시작 {d > 0 ? `+${d}s` : `${d}s`}
                      </button>
                    ))}
                    <span className="mx-1 text-[#D3D1CB]">|</span>
                    {[-2, -0.5, 0.5, 2].map((d) => (
                      <button
                        key={`e${d}`}
                        type="button"
                        onClick={() =>
                          updateCandidate(activeCand.id, (p) => ({
                            ...p,
                            end: Math.max(p.start + 1, p.end + d),
                          }))
                        }
                        className="px-2 py-1 rounded bg-[#F1F1EF] hover:bg-[#E9E9E7] cursor-pointer"
                      >
                        끝 {d > 0 ? `+${d}s` : `${d}s`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Headlines & Layout */}
                <div className="bg-white rounded-2xl border border-[#EDEDEB] p-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-[#191919] flex items-center gap-1.5">
                      <TypeIcon className="w-3.5 h-3.5 text-amber-600" />
                      상단 2줄 제목 & 화면 구도
                    </h4>
                    <button
                      type="button"
                      onClick={() => handleSuggestThumbs(activeCand)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-semibold hover:bg-amber-100 cursor-pointer"
                    >
                      <Wand2 className="w-3 h-3" />
                      AI 화면 문구 6종 추천
                    </button>
                  </div>

                  {thumbOptions && (
                    <div className="p-2.5 rounded-xl bg-[#F7F6F3] border border-[#E3E2DE] space-y-1.5">
                      <div className="flex items-center justify-between font-semibold text-[11px]">
                        <span>추천 문구 클릭하여 적용</span>
                        <button type="button" onClick={() => setThumbOptions(null)} className="text-[#787774] cursor-pointer">
                          닫기
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {thumbOptions.map((opt, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              updateCandidate(activeCand.id, (p) => ({ ...p, thumb: opt }));
                              setThumbOptions(null);
                            }}
                            className="p-2 rounded-lg bg-white border border-[#E3E2DE] text-left hover:border-[#37352F] cursor-pointer"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <label className="block">
                    유튜브 업로드 제목
                    <input
                      type="text"
                      value={activeCand.title}
                      onChange={(e) => updateCandidate(activeCand.id, (p) => ({ ...p, title: e.target.value }))}
                      className="mt-1 w-full px-3 py-1.5 rounded-lg border border-[#E3E2DE] bg-[#FBFBFA]"
                    />
                  </label>
                  <label className="block">
                    화면 큰 제목 (줄바꿈 가능)
                    <textarea
                      rows={2}
                      value={activeCand.thumb}
                      onChange={(e) => updateCandidate(activeCand.id, (p) => ({ ...p, thumb: e.target.value }))}
                      className="mt-1 w-full px-3 py-1.5 rounded-lg border border-[#E3E2DE] bg-[#FBFBFA]"
                    />
                  </label>

                  <div className="grid grid-cols-3 gap-2">
                    <label className="block">
                      폰트
                      <select
                        value={activeCand.titleFont}
                        onChange={(e) => updateCandidate(activeCand.id, (p) => ({ ...p, titleFont: e.target.value }))}
                        className="mt-1 w-full px-2 py-1.5 rounded-lg border border-[#E3E2DE] bg-white"
                      >
                        {FONTS.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      화면 구도
                      <select
                        value={activeCand.layout}
                        onChange={(e) =>
                          updateCandidate(activeCand.id, (p) => ({
                            ...p,
                            layout: e.target.value as 'blur' | 'crop' | 'frame',
                          }))
                        }
                        className="mt-1 w-full px-2 py-1.5 rounded-lg border border-[#E3E2DE] bg-white"
                      >
                        <option value="blur">블러 배경 + 원본</option>
                        <option value="crop">9:16 꽉찬 크롭</option>
                        <option value="frame">4:3 액자 틀</option>
                      </select>
                    </label>
                    <label className="block">
                      채널 표기 (@핸들)
                      <input
                        type="text"
                        value={activeCand.brand}
                        onChange={(e) => updateCandidate(activeCand.id, (p) => ({ ...p, brand: e.target.value }))}
                        placeholder="@채널명"
                        className="mt-1 w-full px-2 py-1.5 rounded-lg border border-[#E3E2DE] bg-[#FBFBFA]"
                      />
                    </label>
                  </div>

                  {activeCand.layout === 'crop' && (
                    <label className="block">
                      인물 중심 가로 위치 ({Math.round(activeCand.cropX * 100)}%)
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.02}
                        value={activeCand.cropX}
                        onChange={(e) => updateCandidate(activeCand.id, (p) => ({ ...p, cropX: +e.target.value }))}
                        className="w-full"
                      />
                    </label>
                  )}
                </div>

                {/* Subtitle Editor */}
                <div className="bg-white rounded-2xl border border-[#EDEDEB] p-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="font-bold text-[#191919]">자막 ({activeCand.subtitles.length}줄)</h4>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handlePreciseSubs(activeCand)}
                        disabled={subAiBusy}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold hover:bg-indigo-100 cursor-pointer"
                      >
                        {subAiBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        <span>정밀 자막 AI 재전사</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateCandidate(activeCand.id, (p) => ({
                            ...p,
                            subtitles: [
                              ...p.subtitles,
                              { s: p.start, e: Math.min(p.end, p.start + 2.5), t: '새 자막 입력' },
                            ],
                          }))
                        }
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-[#E3E2DE] hover:bg-[#F1F1EF] cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> 줄 추가
                      </button>
                    </div>
                  </div>
                  {subAiNote && <div className="text-[11px] text-indigo-700">{subAiNote}</div>}

                  <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                    {activeCand.subtitles.map((cue, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={fmtTimecode(cue.s, true)}
                          onChange={(e) => {
                            const val = parseTimecode(e.target.value);
                            if (Number.isNaN(val)) return;
                            updateCandidate(activeCand.id, (p) => ({
                              ...p,
                              subtitles: p.subtitles.map((x, k) => (k === idx ? { ...x, s: val } : x)),
                            }));
                          }}
                          className="w-16 px-2 py-1 rounded border border-[#E3E2DE] bg-[#FBFBFA] font-mono text-[11px]"
                        />
                        <input
                          type="text"
                          value={fmtTimecode(cue.e, true)}
                          onChange={(e) => {
                            const val = parseTimecode(e.target.value);
                            if (Number.isNaN(val)) return;
                            updateCandidate(activeCand.id, (p) => ({
                              ...p,
                              subtitles: p.subtitles.map((x, k) => (k === idx ? { ...x, e: val } : x)),
                            }));
                          }}
                          className="w-16 px-2 py-1 rounded border border-[#E3E2DE] bg-[#FBFBFA] font-mono text-[11px]"
                        />
                        <input
                          type="text"
                          value={cue.t}
                          onChange={(e) =>
                            updateCandidate(activeCand.id, (p) => ({
                              ...p,
                              subtitles: p.subtitles.map((x, k) => (k === idx ? { ...x, t: e.target.value } : x)),
                            }))
                          }
                          className="flex-1 px-2.5 py-1 rounded border border-[#E3E2DE] bg-[#FBFBFA]"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updateCandidate(activeCand.id, (p) => ({
                              ...p,
                              subtitles: p.subtitles.filter((_, k) => k !== idx),
                            }))
                          }
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      stopPreviewLoop();
                      setStep(4);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#23272A] text-white text-xs font-bold hover:bg-black cursor-pointer"
                  >
                    4단계: 3~5초 도입 내레이션 설정 →
                  </button>
                </div>
              </>
            ) : (
              /* ───────── STEP 4: Intro Hook Narration ───────── */
              <>
                <div className="bg-white rounded-2xl border border-[#EDEDEB] p-4 space-y-3 text-xs">
                  <h4 className="font-bold text-[#191919] flex items-center gap-1.5">
                    <Mic className="w-4 h-4 text-indigo-600" />
                    도입 내레이션 방식 (영상 앞 3~5초 배경 설명 훅)
                  </h4>
                  <div className="inline-flex bg-[#F1F1EF] p-1 rounded-xl border border-[#E3E2DE] gap-1">
                    {[
                      ['none', '사용 안 함'],
                      ['tts', 'AI 음성 (Gemini 30종)'],
                      ['rec', '직접 마이크 녹음'],
                    ].map(([m, lb]) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() =>
                          updateCandidate(activeCand.id, (p) => ({
                            ...p,
                            intro: { ...p.intro, mode: m as 'none' | 'tts' | 'rec' },
                          }))
                        }
                        className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                          activeCand.intro.mode === m ? 'bg-white text-[#191919] shadow-2xs' : 'text-[#787774]'
                        }`}
                      >
                        {lb}
                      </button>
                    ))}
                  </div>

                  {activeCand.intro.mode !== 'none' && (
                    <div className="space-y-3 pt-2 border-t border-[#EDEDEB]">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">도입 내레이션 문장 (40~75자 권장)</span>
                        <button
                          type="button"
                          onClick={() => handleSuggestIntros(activeCand)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-semibold hover:bg-amber-100 cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          AI 3종 추천
                        </button>
                      </div>

                      {introSuggests && (
                        <div className="p-2.5 rounded-xl bg-[#F7F6F3] border border-[#E3E2DE] space-y-1.5">
                          {introSuggests.map((s, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                updateCandidate(activeCand.id, (p) => ({
                                  ...p,
                                  intro: { ...p.intro, text: s },
                                }));
                                setIntroSuggests(null);
                              }}
                              className="block w-full text-left p-2 rounded-lg bg-white border border-[#E3E2DE] hover:border-[#37352F] cursor-pointer"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}

                      <textarea
                        rows={3}
                        value={activeCand.intro.text}
                        onChange={(e) =>
                          updateCandidate(activeCand.id, (p) => ({
                            ...p,
                            intro: { ...p.intro, text: e.target.value },
                          }))
                        }
                        className="w-full px-3 py-2 rounded-xl border border-[#E3E2DE] bg-[#FBFBFA]"
                      />

                      {activeCand.intro.mode === 'tts' && (
                        <div className="space-y-2.5 p-2.5 rounded-xl bg-[#F7F6F3] border border-[#E3E2DE]">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="font-semibold text-[#191919]">AI 음성 엔진</span>
                            <div className="inline-flex bg-[#F1F1EF] p-0.5 rounded-xl border border-[#E3E2DE] text-[11px] gap-1">
                              {(['elevenlabs', 'gemini'] as const).map((eng) => {
                                const hasEleven = Boolean(settings.elevenLabsKey?.trim());
                                const activeEngine =
                                  (activeCand.intro.ttsEngine || settings.ttsProvider) === 'elevenlabs' && hasEleven
                                    ? 'elevenlabs'
                                    : 'gemini';
                                const locked = eng === 'elevenlabs' && !hasEleven;
                                return (
                                  <button
                                    key={eng}
                                    type="button"
                                    onClick={() => {
                                      if (locked) {
                                        onOpenSettings();
                                        return;
                                      }
                                      updateCandidate(activeCand.id, (p) => ({
                                        ...p,
                                        intro: { ...p.intro, ttsEngine: eng },
                                      }));
                                    }}
                                    className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                                      locked
                                        ? 'text-[#9B9A97] hover:text-[#37352F]'
                                        : activeEngine === eng
                                        ? 'bg-white text-[#191919] shadow-2xs font-bold'
                                        : 'text-[#787774] hover:text-[#191919]'
                                    }`}
                                    title={locked ? 'API 설정에서 ElevenLabs 키를 연결하면 활성화됩니다' : undefined}
                                  >
                                    {eng === 'elevenlabs'
                                      ? hasEleven
                                        ? '👑 일레븐랩스 (유료 16인)'
                                        : '🔒 일레븐랩스 (키 필요)'
                                      : '✨ Gemini TTS (30종)'}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {(activeCand.intro.ttsEngine || settings.ttsProvider) === 'elevenlabs' && Boolean(settings.elevenLabsKey?.trim()) ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <label className="block">
                                일레븐랩스 성우 (16인 · {settings.elevenLabsModel || 'eleven_v4'})
                                <select
                                  value={activeCand.intro.elevenVoiceId || settings.elevenLabsVoiceId || VOICE_OPTIONS[0].id}
                                  onChange={(e) =>
                                    updateCandidate(activeCand.id, (p) => ({
                                      ...p,
                                      intro: { ...p.intro, elevenVoiceId: e.target.value },
                                    }))
                                  }
                                  className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-[#E3E2DE] bg-white"
                                >
                                  {VOICE_OPTIONS.map((v) => (
                                    <option key={v.id} value={v.id}>
                                      {v.name} · {v.role} ({v.tone})
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <div className="flex items-end">
                                <p className="text-[11px] text-[#787774] bg-white px-2.5 py-1.5 rounded-lg border border-[#E3E2DE] w-full">
                                  입력한 ElevenLabs API 키 연결됨 · MP3 고음질 생성
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <label className="block">
                                Gemini 성우 음색 (30종)
                                <select
                                  value={activeCand.intro.voice}
                                  onChange={(e) =>
                                    updateCandidate(activeCand.id, (p) => ({
                                      ...p,
                                      intro: { ...p.intro, voice: e.target.value },
                                    }))
                                  }
                                  className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-[#E3E2DE] bg-white"
                                >
                                  {voices.map((v) => (
                                    <option key={v.id} value={v.id}>
                                      {v.label}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label className="block">
                                연기 톤 / 말투
                                <input
                                  type="text"
                                  value={activeCand.intro.style}
                                  onChange={(e) =>
                                    updateCandidate(activeCand.id, (p) => ({
                                      ...p,
                                      intro: { ...p.intro, style: e.target.value },
                                    }))
                                  }
                                  className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-[#E3E2DE] bg-white"
                                />
                              </label>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2">
                        {activeCand.intro.mode === 'tts' ? (
                          <>
                            <button
                              type="button"
                              disabled={ttsBusy}
                              onClick={() => handleGenerateSingleIntroTts(activeCand)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 disabled:opacity-50 cursor-pointer"
                            >
                              {ttsBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Volume2 className="w-3.5 h-3.5" />}
                              <span>도입 음성 생성</span>
                            </button>
                            <button
                              type="button"
                              disabled={ttsBusy}
                              onClick={handleGenerateAllIntroTts}
                              className="px-3 py-2 rounded-xl border border-[#E3E2DE] bg-white font-semibold hover:bg-[#F7F6F3] cursor-pointer"
                            >
                              채택 후보 전부 일괄 생성
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => toggleIntroMicRecord(activeCand)}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-white cursor-pointer ${
                              isRecordingIntro ? 'bg-slate-800' : 'bg-rose-600 hover:bg-rose-700'
                            }`}
                          >
                            {isRecordingIntro ? <Square className="w-3.5 h-3.5 fill-current" /> : <Mic className="w-3.5 h-3.5" />}
                            <span>{isRecordingIntro ? `녹음 중 ${introRecSec.toFixed(1)}초 (정지)` : '마이크 녹음 시작'}</span>
                          </button>
                        )}
                      </div>

                      <label className="block">
                        WSOLA 음정 유지 재생 배속: <b>{activeCand.intro.speed.toFixed(2)}x</b>
                        <input
                          type="range"
                          min={0.8}
                          max={2}
                          step={0.05}
                          value={activeCand.intro.speed}
                          onChange={(e) =>
                            updateCandidate(activeCand.id, (p) => ({
                              ...p,
                              intro: { ...p.intro, speed: +e.target.value },
                            }))
                          }
                          className="w-full"
                        />
                      </label>

                      {introAudioUrl && (
                        <div className="p-2.5 rounded-xl bg-[#F7F6F3] border border-[#E3E2DE]">
                          <audio
                            src={introAudioUrl}
                            controls
                            ref={(el) => {
                              if (el) el.playbackRate = activeCand.intro.speed || 1;
                            }}
                            className="w-full h-9"
                          />
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#EDEDEB]">
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={activeCand.intro.showText}
                            onChange={(e) =>
                              updateCandidate(activeCand.id, (p) => ({
                                ...p,
                                intro: { ...p.intro, showText: e.target.checked },
                              }))
                            }
                          />
                          <span>도입 내레이션 자막 표시</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#E3E2DE] bg-white hover:bg-[#F7F6F3] cursor-pointer">
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>배경 사진 업로드</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const f = e.target.files?.[0];
                                if (!f) return;
                                const saved = await sinsooVault.putAsset({
                                  projectId: activeCand.id,
                                  kind: 'image',
                                  name: f.name,
                                  type: f.type,
                                  blob: f,
                                });
                                updateCandidate(activeCand.id, (p) => ({
                                  ...p,
                                  intro: { ...p.intro, visual: 'image', imageAssetId: saved.id },
                                }));
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            disabled={aiBgBusy}
                            onClick={async () => {
                              if (!getActiveGeminiKey()) return onOpenSettings();
                              setAiBgBusy(true);
                              try {
                                const res = await generateGeminiImage({
                                  prompt: `Cinematic 9:16 vertical background for a Korean documentary short about ${analysisPerson || activeCand.title}, dramatic lighting, no text`,
                                  aspect: '9:16',
                                });
                                const b = await (await fetch(res.dataUrl)).blob();
                                const saved = await sinsooVault.putAsset({
                                  projectId: activeCand.id,
                                  kind: 'image',
                                  name: `AI배경_${safeFileName(activeCand.title, 18)}.jpg`,
                                  type: b.type,
                                  blob: b,
                                });
                                updateCandidate(activeCand.id, (p) => ({
                                  ...p,
                                  intro: { ...p.intro, visual: 'image', imageAssetId: saved.id },
                                }));
                              } catch (e) {
                                setAnalysisError(explainSinsooError(e));
                              } finally {
                                setAiBgBusy(false);
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#E3E2DE] bg-white hover:bg-[#F7F6F3] cursor-pointer"
                          >
                            {aiBgBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3 text-purple-600" />}
                            <span>AI 배경 (유료 키)</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-4 py-2 rounded-xl border border-[#E3E2DE] bg-white text-xs font-medium cursor-pointer"
                  >
                    ← 3단계 편집으로
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(5)}
                    className="px-5 py-2.5 rounded-xl bg-[#23272A] text-white text-xs font-bold hover:bg-black cursor-pointer"
                  >
                    5단계: 캔버스 렌더러 · ZIP 내보내기 →
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ───────── STEP 5: Export ZIP, Upload Copy & Launch Canvas Renderer ───────── */}
      {step === 5 && (
        <div className="space-y-4">
          {step5Toast && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              {step5Toast}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-[#EDEDEB] p-5 space-y-3">
            <h3 className="text-sm font-bold text-[#191919]">채택 후보 ({picks.length}개) 내보내기 · 고도화 렌더러 연동</h3>
            <p className="text-xs text-[#787774]">
              각 후보를 클릭하여 <b>자막 투명도·회전·드래그·스티키 미리보기가 가능한 고도화 캔버스 렌더러</b>로 바로 보내거나,
              편집 프로그램(캡컷·프리미어)용 <b>SRT·컷시트·WSOLA WAV ZIP</b>을 1클릭으로 다운로드할 수 있습니다.
            </p>

            <div className="divide-y divide-[#EDEDEB]">
              {picks.map((c, idx) => (
                <div key={c.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[#191919]">
                      #{idx + 1}. {c.title}
                    </div>
                    <div className="text-xs text-[#787774] mt-0.5">
                      {fmtTimecode(c.start)}–{fmtTimecode(c.end)} ({Math.round(c.end - c.start)}초) · 자막 {c.subtitles.length}줄 ·{' '}
                      {c.intro.mode !== 'none' && c.intro.assetId
                        ? `도입 음성 ${(c.intro.dur / (c.intro.speed || 1)).toFixed(1)}초 준비됨 ✓`
                        : '도입 음성 없음'}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSendCandidateToCanvasRenderer(c)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>고도화 캔버스 렌더러로 보내기</span>
                    </button>
                    <button
                      type="button"
                      disabled={zipBusyId === c.id}
                      onClick={() => handleExportZip(c)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F1F1EF] hover:bg-[#E9E9E7] text-[#37352F] border border-[#E3E2DE] text-xs font-semibold cursor-pointer"
                    >
                      {zipBusyId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Package className="w-3.5 h-3.5" />}
                      <span>SRT·컷시트·WAV ZIP</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedIdx(idx);
                        setStep(3);
                      }}
                      className="px-2.5 py-2 rounded-xl border border-[#E3E2DE] text-xs hover:bg-[#F7F6F3] cursor-pointer"
                    >
                      편집
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upload Copy Generator */}
          <div className="bg-white rounded-2xl border border-[#EDEDEB] p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-[#191919]">유튜브 쇼츠 업로드 문구 (AI 자동 생성)</h3>
              <button
                type="button"
                disabled={uploadGenBusy}
                onClick={handleGenerateUploadCopy}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#23272A] text-white font-semibold hover:bg-black disabled:opacity-50 cursor-pointer"
              >
                {uploadGenBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5 text-amber-300" />}
                <span>제목 5종 · 설명 · 해시태그 생성</span>
              </button>
            </div>

            {uploadCopy && (
              <div className="space-y-3 pt-2 border-t border-[#EDEDEB]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="block font-semibold">
                    후킹 제목 후보 5종
                    <textarea
                      rows={5}
                      value={uploadCopy.titles.join('\n')}
                      onChange={(e) => setUploadCopy({ ...uploadCopy, titles: e.target.value.split('\n') })}
                      className="mt-1 w-full p-2.5 rounded-xl border border-[#E3E2DE] bg-[#FBFBFA] font-normal"
                    />
                  </label>
                  <label className="block font-semibold">
                    추천 해시태그
                    <textarea
                      rows={5}
                      value={uploadCopy.hashtags.map((h) => `#${h.replace(/^#/, '')}`).join(' ')}
                      onChange={(e) => setUploadCopy({ ...uploadCopy, hashtags: e.target.value.split(/\s+/) })}
                      className="mt-1 w-full p-2.5 rounded-xl border border-[#E3E2DE] bg-[#FBFBFA] font-normal"
                    />
                  </label>
                </div>
                <label className="block font-semibold">
                  영상 설명글
                  <textarea
                    rows={4}
                    value={uploadCopy.description}
                    onChange={(e) => setUploadCopy({ ...uploadCopy, description: e.target.value })}
                    className="mt-1 w-full p-2.5 rounded-xl border border-[#E3E2DE] bg-[#FBFBFA] font-normal"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const txt = `${uploadCopy.titles.join('\n')}\n\n${uploadCopy.description}\n\n${uploadCopy.hashtags
                      .map((h) => `#${h.replace(/^#/, '')}`)
                      .join(' ')}`;
                    navigator.clipboard.writeText(txt);
                    setStep5Toast('업로드 제목·설명·해시태그가 클립보드에 복사되었습니다 ✓');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E3E2DE] bg-[#F1F1EF] hover:bg-[#E9E9E7] font-semibold cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>전체 복사</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
