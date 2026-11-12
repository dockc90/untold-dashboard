import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Video,
  Mic,
  Square,
  Search,
  Download,
  FolderArchive,
  Trash2,
  Play,
  Film,
  ExternalLink,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import {
  YoutubeVideoInfo,
  searchYoutubeVideos,
  getActiveYoutubeKey,
  explainSinsooError,
  sinsooVault,
  VaultAsset,
  decodeAudioBlob,
  audioBufferToWavBlob,
} from '../services/sinsooApi';
import { fmtBytes, fmtTimecode, triggerDownload } from '../utils/exportPackager';

interface MediaCollectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultQuery?: string;
  onSendFileToRepurpose?: (file: File, sourceUrl?: string) => void;
  onOpenSettings?: () => void;
}

export const MediaCollectorModal: React.FC<MediaCollectorModalProps> = ({
  isOpen,
  onClose,
  defaultQuery = '',
  onSendFileToRepurpose,
  onOpenSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'recorder' | 'cc' | 'vault'>('recorder');

  // Screen Recorder states
  const [isRecordingScreen, setIsRecordingScreen] = useState(false);
  const [screenRecSec, setScreenRecSec] = useState(0);
  const [screenResult, setScreenResult] = useState<{ blob: Blob; url: string; name: string } | null>(null);
  const [screenWarn, setScreenWarn] = useState('');
  const screenStreamRef = useRef<MediaStream | null>(null);
  const screenRecorderRef = useRef<MediaRecorder | null>(null);
  const screenTimerRef = useRef<number | null>(null);

  // Mic Recorder states
  const [isRecordingMic, setIsRecordingMic] = useState(false);
  const [micRecSec, setMicRecSec] = useState(0);
  const [micResult, setMicResult] = useState<{ blob: Blob; url: string; name: string } | null>(null);
  const [micWarn, setMicWarn] = useState('');
  const micStreamRef = useRef<MediaStream | null>(null);
  const micRecorderRef = useRef<MediaRecorder | null>(null);
  const micTimerRef = useRef<number | null>(null);

  // CC YouTube Search states
  const [ccQuery, setCcQuery] = useState(defaultQuery);
  const [ccOnly, setCcOnly] = useState(true);
  const [ccOrient, setCcOrient] = useState<'' | 'landscape' | 'portrait'>('');
  const [ccResults, setCcResults] = useState<YoutubeVideoInfo[]>([]);
  const [ccLoading, setCcLoading] = useState(false);
  const [ccError, setCcError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // IndexedDB Vault states
  const [vaultItems, setVaultItems] = useState<Omit<VaultAsset, 'blob'>[]>([]);
  const [vaultPreviewUrl, setVaultPreviewUrl] = useState<{ url: string; name: string; type: string } | null>(null);

  const loadVault = async () => {
    const items = await sinsooVault.listMetadata();
    setVaultItems(items);
  };

  useEffect(() => {
    if (isOpen) {
      loadVault();
      if (defaultQuery && !ccQuery) setCcQuery(defaultQuery);
    }
  }, [isOpen, defaultQuery]);

  useEffect(() => {
    return () => {
      if (screenTimerRef.current) clearInterval(screenTimerRef.current);
      if (micTimerRef.current) clearInterval(micTimerRef.current);
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  if (!isOpen) return null;

  const startScreenRecording = async () => {
    setScreenWarn('');
    setScreenResult(null);
    try {
      const stream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: { frameRate: 30 },
        audio: { suppressLocalAudioPlayback: false },
        preferCurrentTab: false,
        selfBrowserSurface: 'exclude',
        systemAudio: 'include',
      });
      if (!stream.getAudioTracks().length) {
        stream.getTracks().forEach((t: MediaStreamTrack) => t.stop());
        setScreenWarn(
          '오디오 트랙이 잡히지 않아 녹화를 취소했습니다. "Chrome 탭"을 선택하고 하단의 "탭 오디오도 공유" 체크박스를 켜 주세요.'
        );
        return;
      }

      const mimeType =
        [
          'video/mp4;codecs="avc1.42E01E,mp4a.40.2"',
          'video/mp4',
          'video/webm;codecs=vp9,opus',
          'video/webm;codecs=vp8,opus',
          'video/webm',
        ].find((t) => {
          try {
            return MediaRecorder.isTypeSupported(t);
          } catch {
            return false;
          }
        }) || '';

      const rec = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        videoBitsPerSecond: 8_000_000,
        audioBitsPerSecond: 192_000,
      });
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };
      rec.onstop = async () => {
        if (screenTimerRef.current) clearInterval(screenTimerRef.current);
        setIsRecordingScreen(false);
        stream.getTracks().forEach((t: MediaStreamTrack) => t.stop());
        const type = mimeType ? mimeType.split(';')[0] : 'video/webm';
        const blob = new Blob(chunks, { type });
        if (!blob.size) {
          setScreenWarn('녹화된 영상 데이터가 비어 있습니다.');
          return;
        }
        const ext = type.startsWith('video/mp4') ? 'mp4' : 'webm';
        const name = `화면녹화_${new Date().toLocaleTimeString('ko-KR').replace(/[:\s]/g, '_')}.${ext}`;
        const url = URL.createObjectURL(blob);
        setScreenResult({ blob, url, name });
      };

      stream.getVideoTracks()[0].onended = () => {
        if (rec.state !== 'inactive') rec.stop();
      };

      screenStreamRef.current = stream;
      screenRecorderRef.current = rec;
      rec.start(1000);
      setIsRecordingScreen(true);
      setScreenRecSec(0);
      const t0 = Date.now();
      screenTimerRef.current = window.setInterval(() => {
        setScreenRecSec(Math.floor((Date.now() - t0) / 1000));
      }, 500);
    } catch {
      setScreenWarn('화면 공유 선택이 취소되었습니다.');
    }
  };

  const stopScreenRecording = () => {
    if (screenRecorderRef.current && screenRecorderRef.current.state !== 'inactive') {
      screenRecorderRef.current.stop();
    }
  };

  const startMicRecording = async () => {
    setMicWarn('');
    setMicResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      const mimeType =
        ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find((t) => {
          try {
            return MediaRecorder.isTypeSupported(t);
          } catch {
            return false;
          }
        }) || '';
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };
      rec.onstop = async () => {
        if (micTimerRef.current) clearInterval(micTimerRef.current);
        setIsRecordingMic(false);
        stream.getTracks().forEach((t) => t.stop());
        const rawBlob = new Blob(chunks, { type: mimeType || 'audio/webm' });
        try {
          const decoded = await decodeAudioBlob(rawBlob);
          const wavBlob = audioBufferToWavBlob(decoded);
          const name = `음성녹음_${new Date().toLocaleTimeString('ko-KR').replace(/[:\s]/g, '_')}.wav`;
          setMicResult({ blob: wavBlob, url: URL.createObjectURL(wavBlob), name });
        } catch {
          setMicWarn('녹음된 오디오를 WAV로 변환하지 못했습니다.');
        }
      };

      micStreamRef.current = stream;
      micRecorderRef.current = rec;
      rec.start();
      setIsRecordingMic(true);
      setMicRecSec(0);
      const t0 = Date.now();
      micTimerRef.current = window.setInterval(() => {
        setMicRecSec(Math.floor((Date.now() - t0) / 1000));
      }, 250);
    } catch (e) {
      setMicWarn('마이크 권한을 허용해 주세요: ' + (e as Error).message);
    }
  };

  const stopMicRecording = () => {
    if (micRecorderRef.current && micRecorderRef.current.state !== 'inactive') {
      micRecorderRef.current.stop();
    }
  };

  const handleCcSearch = async () => {
    if (!ccQuery.trim()) return;
    if (!getActiveYoutubeKey()) {
      setCcError('YouTube Data API 키가 설정되어 있지 않습니다. [API 키 설정]에서 입력해 주세요.');
      return;
    }
    setCcLoading(true);
    setCcError('');
    try {
      const items = await searchYoutubeVideos({
        q: ccQuery.trim(),
        maxResults: 24,
        license: ccOnly ? 'creativeCommon' : '',
      });
      setCcResults(items);
    } catch (e) {
      setCcError(explainSinsooError(e));
    } finally {
      setCcLoading(false);
    }
  };

  const filteredCcResults = ccResults
    .filter((v) => !ccOrient || v.orient === ccOrient || !v.orient)
    .slice()
    .sort((a, b) => (ccOrient ? (a.orient === ccOrient ? 0 : 1) - (b.orient === ccOrient ? 0 : 1) : 0));

  const saveBlobToVault = async (blob: Blob, name: string, kind: VaultAsset['kind']) => {
    await sinsooVault.putAsset({
      projectId: '',
      kind,
      name,
      type: blob.type,
      blob,
    });
    await loadVault();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-4xl bg-[#FBFBFA] text-[#37352F] rounded-2xl border border-[#E3E2DE] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-white border-b border-[#EDEDEB] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#F1F1EF] border border-[#E3E2DE] flex items-center justify-center">
              <Video className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#191919]">소재 수집 · 브라우저 녹화 · 자료함</h2>
              <p className="text-[11px] text-[#787774]">
                화면/오디오 녹화, CC 라이선스 유튜브 소재 검색 및 로컬 IndexedDB 미디어 자산 보관소
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

        {/* Navigation Pill */}
        <div className="px-5 py-3 bg-[#FBFBFA] border-b border-[#EDEDEB] flex items-center justify-between flex-wrap gap-2">
          <div className="inline-flex items-center bg-[#F1F1EF] p-1 rounded-xl border border-[#E3E2DE] text-xs gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('recorder')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                activeTab === 'recorder' ? 'bg-white text-[#191919] shadow-2xs font-semibold' : 'text-[#787774]'
              }`}
            >
              <Video className="w-3.5 h-3.5 text-rose-500" />
              <span>화면 · 마이크 녹화</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('cc')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                activeTab === 'cc' ? 'bg-white text-[#191919] shadow-2xs font-semibold' : 'text-[#787774]'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-indigo-600" />
              <span>자유이용(CC) 유튜브 검색</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('vault');
                loadVault();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                activeTab === 'vault' ? 'bg-white text-[#191919] shadow-2xs font-semibold' : 'text-[#787774]'
              }`}
            >
              <FolderArchive className="w-3.5 h-3.5 text-amber-600" />
              <span>로컬 자료함 ({vaultItems.length})</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'recorder' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Screen + Audio Recorder */}
              <div className="bg-white p-4 rounded-xl border border-[#E9E9E7] space-y-3">
                <h3 className="text-sm font-bold text-[#191919] flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-rose-500" />
                  브라우저 탭 화면 + 시스템 소리 녹화
                </h3>
                <p className="text-xs text-[#787774] leading-relaxed">
                  별도 프로그램 없이 재생 중인 Chrome 탭의 영상과 소리를 그대로 녹화합니다. 녹화 시작 후{' '}
                  <b>“Chrome 탭”</b>을 고르고 <b>“탭 오디오도 공유”</b>를 켜세요.
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={startScreenRecording}
                    disabled={isRecordingScreen}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#23272A] text-white text-xs font-semibold hover:bg-black transition disabled:opacity-50 cursor-pointer"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>녹화 시작</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopScreenRecording}
                    disabled={!isRecordingScreen}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold disabled:opacity-40 cursor-pointer"
                  >
                    <Square className="w-3 h-3 fill-current" />
                    <span>정지</span>
                  </button>
                  {isRecordingScreen && (
                    <span className="text-xs font-bold text-rose-600 animate-pulse">
                      ● {fmtTimecode(screenRecSec)}
                    </span>
                  )}
                </div>

                {screenWarn && (
                  <div className="text-xs p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
                    {screenWarn}
                  </div>
                )}

                {screenResult && (
                  <div className="space-y-2 pt-2 border-t border-[#EDEDEB]">
                    <video src={screenResult.url} controls className="w-full rounded-lg bg-black max-h-52" />
                    <div className="flex flex-wrap items-center gap-2">
                      {onSendFileToRepurpose && (
                        <button
                          type="button"
                          onClick={() => {
                            const f = new File([screenResult.blob], screenResult.name, { type: screenResult.blob.type });
                            onSendFileToRepurpose(f);
                            onClose();
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>이 녹화로 재가공 숏츠 만들기</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => triggerDownload(screenResult.blob, screenResult.name)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#F1F1EF] text-[#37352F] text-xs font-medium hover:bg-[#E9E9E7] cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>다운로드 ({fmtBytes(screenResult.blob.size)})</span>
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await saveBlobToVault(screenResult.blob, screenResult.name, 'recording');
                          setScreenWarn('자료함에 보관되었습니다 ✓');
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E3E2DE] text-xs font-medium hover:bg-[#F7F6F3] cursor-pointer"
                      >
                        <FolderArchive className="w-3.5 h-3.5" />
                        <span>자료함 보관</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mic Voice Recorder */}
              <div className="bg-white p-4 rounded-xl border border-[#E9E9E7] space-y-3">
                <h3 className="text-sm font-bold text-[#191919] flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-indigo-600" />
                  직접 내레이션 / 성우 마이크 녹음 (WAV 변환)
                </h3>
                <p className="text-xs text-[#787774] leading-relaxed">
                  도입부 3~5초 훅 내레이션이나 장면 음성을 마이크로 직접 녹음하여 고음질 WAV 파일로 저장합니다.
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={startMicRecording}
                    disabled={isRecordingMic}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition disabled:opacity-50 cursor-pointer"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>녹음 시작</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopMicRecording}
                    disabled={!isRecordingMic}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F1F1EF] text-[#37352F] border border-[#E3E2DE] text-xs font-semibold disabled:opacity-40 cursor-pointer"
                  >
                    <Square className="w-3 h-3 fill-current" />
                    <span>정지</span>
                  </button>
                  {isRecordingMic && (
                    <span className="text-xs font-bold text-rose-600 animate-pulse">● {fmtTimecode(micRecSec)}</span>
                  )}
                </div>

                {micWarn && (
                  <div className="text-xs p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
                    {micWarn}
                  </div>
                )}

                {micResult && (
                  <div className="space-y-2 pt-2 border-t border-[#EDEDEB]">
                    <audio src={micResult.url} controls className="w-full h-9" />
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => triggerDownload(micResult.blob, micResult.name)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#F1F1EF] text-[#37352F] text-xs font-medium hover:bg-[#E9E9E7] cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>WAV 저장 ({fmtBytes(micResult.blob.size)})</span>
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await saveBlobToVault(micResult.blob, micResult.name, 'rec');
                          setMicWarn('자료함에 보관되었습니다 ✓');
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E3E2DE] text-xs font-medium hover:bg-[#F7F6F3] cursor-pointer"
                      >
                        <FolderArchive className="w-3.5 h-3.5" />
                        <span>자료함 보관</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'cc' && (
            <div className="bg-white p-4 rounded-xl border border-[#E9E9E7] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-[#191919]">
                    자유 이용(CC BY) 유튜브 소재 찾기
                  </h3>
                  <p className="text-xs text-[#787774]">
                    가로(4:3 틀/롱폼) 또는 세로(쇼츠) 비율별로 필터링해 재가공에 적합한 영상을 찾습니다.
                  </p>
                </div>
                {!getActiveYoutubeKey() && onOpenSettings && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenSettings();
                    }}
                    className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-100 cursor-pointer"
                  >
                    YouTube API 키 입력하러 가기 →
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex-1 min-w-[200px] flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E3E2DE] bg-[#FBFBFA]">
                  <Search className="w-4 h-4 text-[#9B9A97]" />
                  <input
                    type="search"
                    value={ccQuery}
                    onChange={(e) => setCcQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCcSearch()}
                    placeholder="예: 정주영 연설, Elon Musk interview"
                    className="w-full bg-transparent text-xs outline-none"
                  />
                </div>
                <label className="inline-flex items-center gap-1.5 text-xs text-[#37352F] px-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ccOnly}
                    onChange={(e) => setCcOnly(e.target.checked)}
                    className="rounded border-[#D3D1CB]"
                  />
                  <span>CC 라이선스만</span>
                </label>
                <div className="inline-flex bg-[#F1F1EF] p-0.5 rounded-lg border border-[#E3E2DE] text-[11px]">
                  {[
                    ['', '전체'],
                    ['landscape', '가로'],
                    ['portrait', '세로'],
                  ].map(([k, label]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setCcOrient(k as '' | 'landscape' | 'portrait')}
                      className={`px-2 py-1 rounded-md cursor-pointer ${
                        ccOrient === k ? 'bg-white text-[#191919] font-semibold shadow-2xs' : 'text-[#787774]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleCcSearch}
                  disabled={ccLoading}
                  className="px-4 py-2 rounded-xl bg-[#23272A] text-white text-xs font-semibold hover:bg-black transition disabled:opacity-60 cursor-pointer"
                >
                  {ccLoading ? '검색 중…' : '검색'}
                </button>
              </div>

              {ccError && (
                <div className="text-xs p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{ccError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredCcResults.map((v) => {
                  const ytUrl = `https://www.youtube.com/watch?v=${v.id}`;
                  return (
                    <div key={v.id} className="rounded-xl border border-[#E9E9E7] bg-[#FBFBFA] overflow-hidden flex flex-col">
                      <a href={ytUrl} target="_blank" rel="noreferrer" className="relative block aspect-video bg-black">
                        <img src={v.thumb} alt={v.title} className="w-full h-full object-cover" />
                        {v.duration > 0 && (
                          <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/75 text-white text-[10px] font-mono">
                            {fmtTimecode(v.duration)}
                          </span>
                        )}
                      </a>
                      <div className="p-3 flex-1 flex flex-col justify-between gap-2">
                        <div>
                          <div className="text-xs font-bold text-[#191919] line-clamp-2">{v.title}</div>
                          <div className="text-[11px] text-[#787774] mt-1 flex items-center flex-wrap gap-1">
                            <span>{v.channel}</span>
                            {v.orient && (
                              <span className="px-1.5 py-0.2 rounded bg-[#F1F1EF] border border-[#E3E2DE] text-[10px]">
                                {v.orient === 'portrait' ? '세로' : '가로'}
                              </span>
                            )}
                            {v.license === 'creativeCommon' && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                                CC BY
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(ytUrl);
                              setCopiedId(v.id);
                              setTimeout(() => setCopiedId(null), 1500);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-[#E3E2DE] bg-white text-[11px] hover:bg-[#F1F1EF] cursor-pointer"
                          >
                            {copiedId === v.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedId === v.id ? '복사됨' : '링크 복사'}</span>
                          </button>
                          <a
                            href={ytUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-[#E3E2DE] bg-white text-[11px] hover:bg-[#F1F1EF]"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>열기</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'vault' && (
            <div className="bg-white p-4 rounded-xl border border-[#E9E9E7] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#191919]">브라우저 로컬 자료함 (IndexedDB)</h3>
                  <p className="text-xs text-[#787774]">
                    녹화한 화면, 마이크 음성, AI 배경 이미지, 재가공 원본 파일이 보관됩니다.
                  </p>
                </div>
                {vaultItems.length > 0 && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm('자료함의 모든 임시 미디어 파일을 삭제할까요?')) return;
                      await sinsooVault.clearAll();
                      await loadVault();
                    }}
                    className="text-xs text-rose-600 hover:underline cursor-pointer"
                  >
                    자료함 비우기
                  </button>
                )}
              </div>

              {vaultPreviewUrl && (
                <div className="p-3 rounded-xl bg-[#F7F6F3] border border-[#E3E2DE] space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span>미리보기: {vaultPreviewUrl.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        URL.revokeObjectURL(vaultPreviewUrl.url);
                        setVaultPreviewUrl(null);
                      }}
                      className="text-[#787774] hover:text-[#191919] cursor-pointer"
                    >
                      닫기
                    </button>
                  </div>
                  {vaultPreviewUrl.type.startsWith('audio/') ? (
                    <audio src={vaultPreviewUrl.url} controls autoPlay className="w-full h-9" />
                  ) : vaultPreviewUrl.type.startsWith('image/') ? (
                    <img src={vaultPreviewUrl.url} alt="" className="max-h-60 rounded-lg mx-auto" />
                  ) : (
                    <video src={vaultPreviewUrl.url} controls autoPlay className="w-full max-h-60 rounded-lg bg-black" />
                  )}
                </div>
              )}

              {vaultItems.length === 0 ? (
                <div className="py-10 text-center text-xs text-[#9B9A97]">보관된 미디어 파일이 없습니다.</div>
              ) : (
                <div className="divide-y divide-[#EDEDEB]">
                  {vaultItems.map((it) => (
                    <div key={it.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#F1F1EF] flex items-center justify-center shrink-0">
                          <Film className="w-4 h-4 text-[#787774]" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-[#191919] truncate">{it.name}</div>
                          <div className="text-[11px] text-[#787774]">
                            {it.kind} · {fmtBytes(it.size)} · {new Date(it.createdAt).toLocaleString('ko-KR')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={async () => {
                            const full = await sinsooVault.getAsset(it.id);
                            if (!full?.blob) return;
                            setVaultPreviewUrl({
                              url: URL.createObjectURL(full.blob),
                              name: full.name,
                              type: full.type,
                            });
                          }}
                          className="p-1.5 rounded-lg border border-[#E3E2DE] hover:bg-[#F1F1EF] cursor-pointer"
                          title="재생/미리보기"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                        {onSendFileToRepurpose && it.type.startsWith('video/') && (
                          <button
                            type="button"
                            onClick={async () => {
                              const full = await sinsooVault.getAsset(it.id);
                              if (!full?.blob) return;
                              const f = new File([full.blob], full.name, { type: full.type });
                              onSendFileToRepurpose(f);
                              onClose();
                            }}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-[11px] font-semibold hover:bg-indigo-700 cursor-pointer"
                          >
                            재가공
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={async () => {
                            const full = await sinsooVault.getAsset(it.id);
                            if (full?.blob) triggerDownload(full.blob, full.name);
                          }}
                          className="p-1.5 rounded-lg border border-[#E3E2DE] hover:bg-[#F1F1EF] cursor-pointer"
                          title="다운로드"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await sinsooVault.deleteAsset(it.id);
                            await loadVault();
                          }}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
