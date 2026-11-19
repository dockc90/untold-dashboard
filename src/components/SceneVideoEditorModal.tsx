import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Scissors,
  Maximize2,
  Minimize2,
  Check,
  Video,
  Upload,
  Gauge,
  Sliders,
  Move,
  Clock,
  Sparkles,
  Crop,
  Music,
  Mic,
  Download
} from 'lucide-react';
import { SceneItem } from '../types';
import { separateVideoAudioStems } from '../utils/audioSeparator';

interface SceneVideoEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  sceneNumber: number;
  timeRange: string;
  narrationSnippet: string;
  videoUrl: string;
  initialStartTime?: number;
  initialEndTime?: number;
  initialPlaybackRate?: number;
  initialVolume?: number;
  initialMuted?: boolean;
  initialFit?: 'cover' | 'contain';
  initialCrop?: {
    xPercent: number;
    yPercent: number;
    zoom: number;
    cropTop?: number;
    cropBottom?: number;
    cropLeft?: number;
    cropRight?: number;
  };
  initialAudioMode?: 'original' | 'vocals_only' | 'bgm_only';
  initialSeparatedVocalsUrl?: string;
  initialSeparatedBgmUrl?: string;
  onApplyVideo: (config: {
    videoUrl: string;
    startTime: number;
    endTime: number;
    playbackRate: number;
    volume: number;
    muted: boolean;
    fit: 'cover' | 'contain';
    crop: {
      xPercent: number;
      yPercent: number;
      zoom: number;
      cropTop?: number;
      cropBottom?: number;
      cropLeft?: number;
      cropRight?: number;
    };
    audioMode?: 'original' | 'vocals_only' | 'bgm_only';
    separatedVocalsUrl?: string;
    separatedBgmUrl?: string;
  }) => void;
  onChangeVideoFile?: (file: File) => void;
}

export const SceneVideoEditorModal: React.FC<SceneVideoEditorModalProps> = ({
  isOpen,
  onClose,
  sceneNumber,
  timeRange,
  narrationSnippet,
  videoUrl,
  initialStartTime = 0,
  initialEndTime,
  initialPlaybackRate = 1.0,
  initialVolume = 0,
  initialMuted = true,
  initialFit = 'cover',
  initialCrop = { xPercent: 50, yPercent: 50, zoom: 1.0, cropTop: 0, cropBottom: 0, cropLeft: 0, cropRight: 0 },
  initialAudioMode = 'original',
  initialSeparatedVocalsUrl,
  initialSeparatedBgmUrl,
  onApplyVideo,
  onChangeVideoFile,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const stemAudioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Video metadata
  const [totalDuration, setTotalDuration] = useState<number>(10);
  const [currentTime, setCurrentTime] = useState<number>(initialStartTime);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // CapCut Editing States
  const [startTime, setStartTime] = useState<number>(initialStartTime);
  const [endTime, setEndTime] = useState<number>(initialEndTime || 5);
  const [playbackRate, setPlaybackRate] = useState<number>(initialPlaybackRate);
  const [volume, setVolume] = useState<number>(initialVolume);
  const [muted, setMuted] = useState<boolean>(initialMuted);
  const [fit, setFit] = useState<'cover' | 'contain'>(initialFit);
  const [zoom, setZoom] = useState<number>(initialCrop?.zoom || 1.0);
  const [xPercent, setXPercent] = useState<number>(initialCrop?.xPercent ?? 50);
  const [yPercent, setYPercent] = useState<number>(initialCrop?.yPercent ?? 50);
  const [cropTop, setCropTop] = useState<number>(initialCrop?.cropTop ?? 0);
  const [cropBottom, setCropBottom] = useState<number>(initialCrop?.cropBottom ?? 0);
  const [cropLeft, setCropLeft] = useState<number>(initialCrop?.cropLeft ?? 0);
  const [cropRight, setCropRight] = useState<number>(initialCrop?.cropRight ?? 0);
  const [loopSection, setLoopSection] = useState<boolean>(true);

  // Audio Stem Separation States
  const [audioMode, setAudioMode] = useState<'original' | 'vocals_only' | 'bgm_only'>(initialAudioMode);
  const [separatedVocalsUrl, setSeparatedVocalsUrl] = useState<string | undefined>(initialSeparatedVocalsUrl);
  const [separatedBgmUrl, setSeparatedBgmUrl] = useState<string | undefined>(initialSeparatedBgmUrl);
  const [isSeparatingAudio, setIsSeparatingAudio] = useState<boolean>(false);
  const [separationError, setSeparationError] = useState<string | null>(null);
  const [separationInfo, setSeparationInfo] = useState<string | null>(null);

  // Active Tool Tab: 'trim' | 'transform' | 'speed' | 'audio'
  const [activeTab, setActiveTab] = useState<'trim' | 'transform' | 'speed' | 'audio'>('trim');

  // Sync with initial props
  useEffect(() => {
    setStartTime(initialStartTime);
    if (initialEndTime) setEndTime(initialEndTime);
    setPlaybackRate(initialPlaybackRate);
    setVolume(initialVolume);
    setMuted(initialMuted);
    setFit(initialFit);
    if (initialCrop) {
      setZoom(initialCrop.zoom || 1.0);
      setXPercent(initialCrop.xPercent ?? 50);
      setYPercent(initialCrop.yPercent ?? 50);
      setCropTop(initialCrop.cropTop ?? 0);
      setCropBottom(initialCrop.cropBottom ?? 0);
      setCropLeft(initialCrop.cropLeft ?? 0);
      setCropRight(initialCrop.cropRight ?? 0);
    }
    setAudioMode(initialAudioMode);
    setSeparatedVocalsUrl(initialSeparatedVocalsUrl);
    setSeparatedBgmUrl(initialSeparatedBgmUrl);
  }, [
    initialStartTime,
    initialEndTime,
    initialPlaybackRate,
    initialVolume,
    initialMuted,
    initialFit,
    initialCrop,
    initialAudioMode,
    initialSeparatedVocalsUrl,
    initialSeparatedBgmUrl,
    videoUrl,
  ]);

  // Video metadata loaded
  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const dur = videoRef.current.duration;
    if (dur && !isNaN(dur) && isFinite(dur)) {
      setTotalDuration(dur);
      if (!initialEndTime || initialEndTime > dur) {
        setEndTime(Math.min(dur, Math.max(startTime + 3, 5)));
      }
    }
    videoRef.current.currentTime = startTime;
    videoRef.current.playbackRate = playbackRate;
    videoRef.current.volume = volume / 100;
    videoRef.current.muted = muted || Boolean(activeStemUrl);
  };

  // Determine which audio track to play
  const activeStemUrl =
    audioMode === 'vocals_only'
      ? separatedVocalsUrl
      : audioMode === 'bgm_only'
      ? separatedBgmUrl
      : undefined;

  // Sync video time updates & enforce section loop
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    setCurrentTime(cur);

    if (cur >= endTime) {
      if (loopSection) {
        videoRef.current.currentTime = startTime;
        if (stemAudioRef.current && activeStemUrl) {
          stemAudioRef.current.currentTime = startTime;
          stemAudioRef.current.play().catch(() => {});
        }
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
        if (stemAudioRef.current) stemAudioRef.current.pause();
        setIsPlaying(false);
      }
    }

    if (cur < startTime) {
      videoRef.current.currentTime = startTime;
    }
  };

  // Toggle Play / Pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      if (stemAudioRef.current) stemAudioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (videoRef.current.currentTime >= endTime || videoRef.current.currentTime < startTime) {
        videoRef.current.currentTime = startTime;
        if (stemAudioRef.current) stemAudioRef.current.currentTime = startTime;
      }
      videoRef.current.playbackRate = playbackRate;
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        if (stemAudioRef.current && activeStemUrl) {
          stemAudioRef.current.playbackRate = playbackRate;
          stemAudioRef.current.play().catch(() => {});
        }
      }).catch((err) => {
        console.warn('Playback error:', err);
      });
    }
  };

  // Trimmer adjustments
  const handleStartTimeChange = (val: number) => {
    const clamped = Math.max(0, Math.min(val, endTime - 0.5));
    setStartTime(clamped);
    if (videoRef.current) {
      videoRef.current.currentTime = clamped;
    }
  };

  const handleEndTimeChange = (val: number) => {
    const clamped = Math.min(totalDuration, Math.max(val, startTime + 0.5));
    setEndTime(clamped);
    if (videoRef.current && videoRef.current.currentTime > clamped) {
      videoRef.current.currentTime = startTime;
    }
  };

  // Speed adjustments
  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    if (stemAudioRef.current) {
      stemAudioRef.current.playbackRate = speed;
    }
  };

  // Audio Stem Separation
  const handleSeparateAudio = async () => {
    if (!videoUrl || isSeparatingAudio) return;
    setIsSeparatingAudio(true);
    setSeparationError(null);
    setSeparationInfo('오디오 트랙을 추출하여 보컬과 배경음악(BGM)으로 분리하는 중입니다...');

    try {
      const result = await separateVideoAudioStems(videoUrl, (progress) => {
        setSeparationInfo(`AI 트랙 분리 연산 중: ${Math.round(progress * 100)}%`);
      });
      setSeparatedVocalsUrl(result.vocalsUrl);
      setSeparatedBgmUrl(result.bgmUrl);
      setSeparationInfo('🎉 분리 완료! 보컬(목소리)만 듣거나 배경음악(BGM)만 선택할 수 있습니다.');
    } catch (err: any) {
      console.error('Audio separation error:', err);
      setSeparationError(err.message || '오디오 분리 중 오류가 발생했습니다.');
    } finally {
      setIsSeparatingAudio(false);
    }
  };

  // File replacement
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onChangeVideoFile) {
      onChangeVideoFile(file);
      setIsPlaying(false);
    }
  };

  // Apply changes to parent
  const handleApply = () => {
    onApplyVideo({
      videoUrl,
      startTime,
      endTime,
      playbackRate,
      volume,
      muted,
      fit,
      crop: {
        xPercent,
        yPercent,
        zoom,
        cropTop,
        cropBottom,
        cropLeft,
        cropRight,
      },
      audioMode,
      separatedVocalsUrl,
      separatedBgmUrl,
    });
    onClose();
  };

  const selectedDuration = Math.max(0.5, endTime - startTime);

  if (!isOpen) return null;

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
    >
      <div className="bg-[#FBFBFA] border border-[#EDEDEB] rounded-2xl sm:rounded-3xl max-w-4xl w-full flex flex-col max-h-[94vh] shadow-2xl overflow-hidden text-[#37352F]">
        {activeStemUrl && <audio ref={stemAudioRef} src={activeStemUrl} preload="auto" className="hidden" />}

        {/* Modal Header: Notion Minimalist Style */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-[#EDEDEB] bg-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-[#1E1E1E] via-[#2A2B32] to-[#4338CA] flex items-center justify-center text-white shadow-xs shrink-0">
              <Video className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2 min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-[#191919] truncate">
                  씬 {sceneNumber} 동영상 편집
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F1F1EF] text-[#37352F] border border-[#E3E2DE] shrink-0 leading-none">
                  9:16 쇼츠
                </span>
              </div>
              <p className="text-[11px] text-[#787774] font-normal truncate mt-0.5">
                대사: &quot;{narrationSnippet}&quot;
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl bg-[#F1F1EF] hover:bg-rose-50 text-[#787774] hover:text-rose-600 border border-[#E3E2DE] transition cursor-pointer shrink-0"
            title="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: 2 Columns on Desktop, Stacked with STICKY preview on Mobile */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-0">
          {/* Left Column: 9:16 Shorts Video Preview Screen (STICKY on mobile & desktop!) */}
          <div className="lg:col-span-5 sticky top-0 z-20 bg-[#FBFBFA]/95 lg:bg-transparent backdrop-blur-md lg:backdrop-blur-none p-2 sm:p-3 lg:p-0 border-b border-[#EDEDEB] lg:border-b-0 lg:sticky lg:top-0 lg:self-start">
            <div className="flex flex-row lg:flex-col items-center justify-center gap-3 bg-white rounded-2xl p-2.5 sm:p-3.5 border border-[#E9E9E7] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              {/* 9:16 Shorts Video Screen */}
              <div className="w-[110px] sm:w-[150px] lg:w-[220px] aspect-[9/16] bg-black rounded-xl overflow-hidden shadow-md border border-[#E3E2DE] relative flex items-center justify-center group shrink-0">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  onLoadedMetadata={handleLoadedMetadata}
                  onTimeUpdate={handleTimeUpdate}
                  playsInline
                  preload="auto"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: fit === 'cover' ? 'cover' : 'contain',
                    transform: `scale(${zoom}) translate(${(xPercent - 50) * 0.4}%, ${(yPercent - 50) * 0.4}%)`,
                    clipPath: `inset(${cropTop}% ${cropRight}% ${cropBottom}% ${cropLeft}%)`,
                    transition: 'transform 0.1s ease-out',
                  }}
                />
                {(cropTop > 0 || cropBottom > 0 || cropLeft > 0 || cropRight > 0) && (
                  <div
                    className="absolute border-2 border-amber-400 pointer-events-none rounded-sm shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
                    style={{
                      top: `${cropTop}%`,
                      bottom: `${cropBottom}%`,
                      left: `${cropLeft}%`,
                      right: `${cropRight}%`,
                    }}
                  />
                )}

                {/* Play / Pause Overlay Icon */}
                <button
                  type="button"
                  onClick={togglePlay}
                  className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-[#23272A]/90 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                  </div>
                </button>

                {/* Safe Zone Grid Outline */}
                <div className="absolute inset-x-2 top-[12%] bottom-[20%] border border-dashed border-white/40 rounded-lg pointer-events-none flex items-start justify-end p-1">
                  <span className="text-[7px] sm:text-[8px] bg-black/70 text-white font-semibold px-1 py-0.2 rounded">
                    자막 안전구역
                  </span>
                </div>
              </div>

              {/* Quick Player Bar */}
              <div className="flex-1 lg:w-full flex flex-col justify-center gap-2 min-w-0">
                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-[#23272A] hover:bg-[#111213] text-white font-semibold text-xs transition shadow-xs cursor-pointer active:scale-95"
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    <span>{isPlaying ? '일시정지' : '재생'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.currentTime = startTime;
                        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
                      }
                    }}
                    className="p-1.5 rounded-xl bg-[#F1F1EF] hover:bg-white text-[#37352F] border border-[#E3E2DE] transition cursor-pointer"
                    title="시작 구간부터 다시 재생"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-1 text-[11px] font-mono text-[#37352F] font-bold bg-[#F1F1EF] px-2.5 py-1 rounded-lg border border-[#E3E2DE]">
                  <span>{currentTime.toFixed(1)}s</span>
                  <span className="text-[#9B9A97]">/</span>
                  <span>{selectedDuration.toFixed(1)}s</span>
                </div>

                <button
                  type="button"
                  onClick={() => setLoopSection(!loopSection)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition border text-center cursor-pointer ${
                    loopSection
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'bg-[#F1F1EF] text-[#787774] border-[#E3E2DE]'
                  }`}
                >
                  {loopSection ? '🔁 무한반복 ON' : '1회 재생'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Editing Controls (Scrolls naturally while preview stays sticky) */}
          <div className="lg:col-span-7 flex flex-col space-y-4 min-w-0">
            {/* Tool Tabs: Notion Minimalist Pill Bar */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-[#F1F1EF] rounded-xl border border-[#E3E2DE] text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab('trim')}
                className={`py-2 rounded-lg transition flex items-center justify-center space-x-1 cursor-pointer ${
                  activeTab === 'trim'
                    ? 'bg-white text-[#191919] shadow-xs font-semibold'
                    : 'text-[#787774] hover:text-[#191919]'
                }`}
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>구간 자르기</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('transform')}
                className={`py-2 rounded-lg transition flex items-center justify-center space-x-1 cursor-pointer ${
                  activeTab === 'transform'
                    ? 'bg-white text-[#191919] shadow-xs font-semibold'
                    : 'text-[#787774] hover:text-[#191919]'
                }`}
              >
                <Crop className="w-3.5 h-3.5" />
                <span>화면 자르기</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('speed')}
                className={`py-2 rounded-lg transition flex items-center justify-center space-x-1 cursor-pointer ${
                  activeTab === 'speed'
                    ? 'bg-white text-[#191919] shadow-xs font-semibold'
                    : 'text-[#787774] hover:text-[#191919]'
                }`}
              >
                <Gauge className="w-3.5 h-3.5" />
                <span>배속 ({playbackRate}x)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('audio')}
                className={`py-2 rounded-lg transition flex items-center justify-center space-x-1 cursor-pointer ${
                  activeTab === 'audio'
                    ? 'bg-white text-[#191919] shadow-xs font-semibold'
                    : 'text-[#787774] hover:text-[#191919]'
                }`}
              >
                {muted ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5 text-indigo-600" />}
                <span>음성/BGM</span>
              </button>
            </div>

            {/* TAB 1: TRIMMER (구간 자르기) */}
            {activeTab === 'trim' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E9E9E7] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#191919] flex items-center gap-1.5">
                    <Scissors className="w-4 h-4 text-indigo-600" />
                    <span>재생할 구간 설정 (트리밍)</span>
                  </span>
                  <span className="text-xs font-semibold text-[#37352F] bg-[#F1F1EF] px-2.5 py-0.5 rounded-full border border-[#E3E2DE]">
                    선택 구간: {selectedDuration.toFixed(1)}초
                  </span>
                </div>

                {/* Timeline Bar with Visual Trim Handles */}
                <div className="space-y-2 pt-2">
                  <div className="relative h-10 bg-[#FAF9F7] rounded-xl overflow-hidden border border-[#E3E2DE] flex items-center px-1">
                    {/* Active Trimmed Zone Highlight */}
                    <div
                      className="absolute top-0 bottom-0 bg-indigo-500/20 border-l-2 border-r-2 border-indigo-600"
                      style={{
                        left: `${(startTime / totalDuration) * 100}%`,
                        right: `${100 - (endTime / totalDuration) * 100}%`,
                      }}
                    />

                    {/* Current Scrubber Head */}
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-[#23272A] z-10 shadow-sm pointer-events-none rounded-full"
                      style={{
                        left: `${(currentTime / totalDuration) * 100}%`,
                      }}
                    />
                  </div>

                  {/* Range Dual Sliders */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-medium text-[#787774] flex items-center justify-between mb-1">
                        <span>시작 시간</span>
                        <span className="font-mono text-[#191919] font-bold">{startTime.toFixed(1)}초</span>
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={Math.max(0, endTime - 0.5)}
                        step={0.1}
                        value={startTime}
                        onChange={(e) => handleStartTimeChange(parseFloat(e.target.value))}
                        className="w-full accent-[#23272A] cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-[#787774] flex items-center justify-between mb-1">
                        <span>종료 시간</span>
                        <span className="font-mono text-[#191919] font-bold">{endTime.toFixed(1)}초</span>
                      </label>
                      <input
                        type="range"
                        min={startTime + 0.5}
                        max={totalDuration}
                        step={0.1}
                        value={endTime}
                        onChange={(e) => handleEndTimeChange(parseFloat(e.target.value))}
                        className="w-full accent-rose-600 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#EDEDEB]">
                  <span className="text-[11px] font-medium text-[#787774]">빠른 설정:</span>
                  <button
                    type="button"
                    onClick={() => {
                      handleStartTimeChange(0);
                      handleEndTimeChange(Math.min(totalDuration, 5.0));
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#F1F1EF] hover:bg-white text-[#37352F] text-xs font-medium transition border border-[#E3E2DE] cursor-pointer"
                  >
                    처음 5초
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleStartTimeChange(0);
                      handleEndTimeChange(totalDuration);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#F1F1EF] hover:bg-white text-[#37352F] text-xs font-medium transition border border-[#E3E2DE] cursor-pointer"
                  >
                    전체 영상
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: TRANSFORM & CROP */}
            {activeTab === 'transform' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E9E9E7] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#191919] flex items-center gap-1.5">
                    <Crop className="w-4 h-4 text-amber-600" />
                    <span>쇼츠·릴스 화면 자르기 (Crop) & 프레이밍</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setZoom(1.0);
                      setXPercent(50);
                      setYPercent(50);
                      setCropTop(0);
                      setCropBottom(0);
                      setCropLeft(0);
                      setCropRight(0);
                      setFit('cover');
                    }}
                    className="text-[11px] text-[#787774] hover:text-[#191919] underline cursor-pointer font-medium"
                  >
                    전체 초기화
                  </button>
                </div>

                {/* Quick Shorts/Reels Crop Presets */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-[#191919] block">
                    ✂️ 1클릭 쇼츠/릴스 화면 자르기 프리셋 (자막·워터마크 제거):
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        setCropTop(0);
                        setCropBottom(0);
                        setCropLeft(0);
                        setCropRight(0);
                      }}
                      className="py-1.5 px-2 rounded-xl bg-[#F1F1EF] hover:bg-white border border-[#E3E2DE] text-[#37352F] font-medium cursor-pointer transition shadow-2xs"
                    >
                      원본 전체 (0%)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCropTop(14);
                        setCropBottom(22);
                        setCropLeft(0);
                        setCropRight(0);
                      }}
                      className="py-1.5 px-2 rounded-xl bg-amber-50 hover:bg-amber-100/70 border border-amber-200/80 text-amber-900 font-semibold cursor-pointer transition shadow-2xs"
                    >
                      📱 쇼츠/릴스 자막·UI 컷
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCropTop(20);
                        setCropBottom(20);
                        setCropLeft(0);
                        setCropRight(0);
                      }}
                      className="py-1.5 px-2 rounded-xl bg-[#F1F1EF] hover:bg-white border border-[#E3E2DE] text-[#37352F] font-medium cursor-pointer transition shadow-2xs"
                    >
                      🔲 중앙 정사각 1:1 컷
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCropTop(0);
                        setCropBottom(0);
                        setCropLeft(12);
                        setCropRight(12);
                      }}
                      className="py-1.5 px-2 rounded-xl bg-[#F1F1EF] hover:bg-white border border-[#E3E2DE] text-[#37352F] font-medium cursor-pointer transition shadow-2xs"
                    >
                      ↔️ 좌우 여백 컷 (12%)
                    </button>
                  </div>
                </div>

                {/* 4-Edge Fine Crop Sliders */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#FAF9F7] border border-[#EDEDEB]">
                  <div>
                    <label className="text-[11px] font-medium text-[#787774] flex items-center justify-between mb-1">
                      <span>상단 자르기</span>
                      <span className="font-mono text-[#191919] font-bold">{cropTop}%</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={40}
                      step={1}
                      value={cropTop}
                      onChange={(e) => setCropTop(parseInt(e.target.value, 10))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-[#787774] flex items-center justify-between mb-1">
                      <span>하단 자르기</span>
                      <span className="font-mono text-[#191919] font-bold">{cropBottom}%</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={40}
                      step={1}
                      value={cropBottom}
                      onChange={(e) => setCropBottom(parseInt(e.target.value, 10))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-[#787774] flex items-center justify-between mb-1">
                      <span>좌측 자르기</span>
                      <span className="font-mono text-[#191919] font-bold">{cropLeft}%</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={40}
                      step={1}
                      value={cropLeft}
                      onChange={(e) => setCropLeft(parseInt(e.target.value, 10))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-[#787774] flex items-center justify-between mb-1">
                      <span>우측 자르기</span>
                      <span className="font-mono text-[#191919] font-bold">{cropRight}%</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={40}
                      step={1}
                      value={cropRight}
                      onChange={(e) => setCropRight(parseInt(e.target.value, 10))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Aspect Ratio Fit Style */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFit('cover')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                      fit === 'cover'
                        ? 'bg-[#23272A] text-white border-[#23272A] shadow-xs'
                        : 'bg-white text-[#787774] border-[#E3E2DE] hover:bg-[#F1F1EF]'
                    }`}
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>9:16 전체 꽉 채우기 (추천)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFit('contain')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                      fit === 'contain'
                        ? 'bg-[#23272A] text-white border-[#23272A] shadow-xs'
                        : 'bg-white text-[#787774] border-[#E3E2DE] hover:bg-[#F1F1EF]'
                    }`}
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span>원본 비율 유지 (레터박스)</span>
                  </button>
                </div>

                {/* Zoom Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[#787774] font-medium flex items-center gap-1">
                      <Sliders className="w-3 h-3 text-indigo-600" />
                      <span>줌인 배율</span>
                    </span>
                    <span className="font-mono text-[#191919] font-bold">{Math.round(zoom * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={1.0}
                    max={2.5}
                    step={0.05}
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-full accent-[#23272A] cursor-pointer"
                  />
                </div>

                {/* Pan X and Y Sliders */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-medium text-[#787774] flex items-center justify-between mb-1">
                      <span>좌우 위치 이동</span>
                      <span className="font-mono text-[#191919] font-bold">{xPercent}%</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={xPercent}
                      onChange={(e) => setXPercent(parseInt(e.target.value, 10))}
                      className="w-full accent-[#23272A] cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-[#787774] flex items-center justify-between mb-1">
                      <span>상하 위치 이동</span>
                      <span className="font-mono text-[#191919] font-bold">{yPercent}%</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={yPercent}
                      onChange={(e) => setYPercent(parseInt(e.target.value, 10))}
                      className="w-full accent-[#23272A] cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SPEED (배속 조절) */}
            {activeTab === 'speed' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E9E9E7] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#191919] flex items-center gap-1.5">
                    <Gauge className="w-4 h-4 text-indigo-600" />
                    <span>비디오 재생 속도</span>
                  </span>
                  <span className="text-xs font-semibold text-[#37352F] bg-[#F1F1EF] px-2.5 py-0.5 rounded-full border border-[#E3E2DE]">
                    현재: {playbackRate}x 배속
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
                  {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => handleSpeedChange(rate)}
                      className={`py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                        playbackRate === rate
                          ? 'bg-[#23272A] text-white border-[#23272A] shadow-xs'
                          : 'bg-white text-[#787774] border-[#E3E2DE] hover:bg-[#F1F1EF]'
                      }`}
                    >
                      {rate === 1.0 ? '1.0x (기본)' : `${rate}x`}
                    </button>
                  ))}
                </div>

                <p className="text-[11px] text-[#787774] leading-relaxed font-normal pt-2 border-t border-[#EDEDEB]">
                  💡 <strong>팁:</strong> 쇼츠 특성에 맞게 빠른 호흡을 원하시면 1.25x~1.5x를, 감동 다큐 장면에선 0.75x~1.0x를 추천합니다.
                </p>
              </div>
            )}

            {/* TAB 4: AUDIO / BGM-VOICE SEPARATION */}
            {activeTab === 'audio' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E9E9E7] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#191919] flex items-center gap-1.5">
                    {muted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-indigo-600" />}
                    <span>동영상 배경음악(BGM) · 음성 분리 & 볼륨</span>
                  </span>
                </div>

                {/* Stem Separation CTA Box */}
                <div className="p-3.5 rounded-xl bg-[#FAF9F7] border border-[#EDEDEB] space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-[#191919] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>AI 배경음악(BGM) · 음성(목소리) 자동 분리</span>
                      </h4>
                      <p className="text-[11px] text-[#787774] mt-0.5 leading-snug font-normal">
                        쇼츠·릴스 원본 영상에서 배경음악과 사람 목소리를 분리해 원하는 트랙만 남기거나 WAV로 저장할 수 있습니다.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isSeparatingAudio}
                    onClick={handleSeparateAudio}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#23272A] hover:bg-[#111213] text-white font-semibold text-xs shadow-xs transition cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
                  >
                    <Music className="w-4 h-4" />
                    <span>{isSeparatingAudio ? '오디오 트랙 분리 중...' : separatedVocalsUrl ? '🔄 배경음악 · 음성 다시 분리하기' : '🎛️ 배경음악(BGM) · 음성 분리 실행'}</span>
                  </button>

                  {separationError && (
                    <p className="text-[11px] text-rose-700 font-medium bg-rose-50 border border-rose-200/60 px-2.5 py-1.5 rounded-lg">
                      ⚠️ {separationError}
                    </p>
                  )}

                  {separationInfo && (
                    <p className="text-[11px] text-emerald-700 font-medium bg-emerald-50 border border-emerald-200/60 px-2.5 py-1.5 rounded-lg">
                      ✓ {separationInfo}
                    </p>
                  )}

                  {(separatedVocalsUrl || separatedBgmUrl) && (
                    <div className="space-y-2 pt-1">
                      <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setAudioMode('original')}
                          className={`py-2 px-2 rounded-xl border font-semibold cursor-pointer transition ${
                            audioMode === 'original'
                              ? 'bg-[#23272A] text-white border-[#23272A]'
                              : 'bg-white text-[#787774] border-[#E3E2DE] hover:bg-[#F1F1EF]'
                          }`}
                        >
                          원본 사운드
                        </button>
                        <button
                          type="button"
                          disabled={!separatedVocalsUrl}
                          onClick={() => setAudioMode('vocals_only')}
                          className={`py-2 px-2 rounded-xl border font-semibold cursor-pointer transition disabled:opacity-40 ${
                            audioMode === 'vocals_only'
                              ? 'bg-[#23272A] text-white border-[#23272A]'
                              : 'bg-white text-[#787774] border-[#E3E2DE] hover:bg-[#F1F1EF]'
                          }`}
                        >
                          🎤 목소리만
                        </button>
                        <button
                          type="button"
                          disabled={!separatedBgmUrl}
                          onClick={() => setAudioMode('bgm_only')}
                          className={`py-2 px-2 rounded-xl border font-semibold cursor-pointer transition disabled:opacity-40 ${
                            audioMode === 'bgm_only'
                              ? 'bg-[#23272A] text-white border-[#23272A]'
                              : 'bg-white text-[#787774] border-[#E3E2DE] hover:bg-[#F1F1EF]'
                          }`}
                        >
                          🎵 BGM만
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {separatedVocalsUrl && (
                          <a
                            href={separatedVocalsUrl}
                            download={`scene_${sceneNumber}_목소리_vocals.wav`}
                            className="py-1.5 px-2.5 rounded-lg bg-white hover:bg-[#F1F1EF] border border-[#E3E2DE] text-[#37352F] text-[11px] font-medium flex items-center justify-center gap-1 shadow-2xs"
                          >
                            <Download className="w-3 h-3 text-[#787774]" />
                            <span>목소리만 WAV 저장</span>
                          </a>
                        )}
                        {separatedBgmUrl && (
                          <a
                            href={separatedBgmUrl}
                            download={`scene_${sceneNumber}_배경음악_bgm.wav`}
                            className="py-1.5 px-2.5 rounded-lg bg-white hover:bg-[#F1F1EF] border border-[#E3E2DE] text-[#37352F] text-[11px] font-medium flex items-center justify-center gap-1 shadow-2xs"
                          >
                            <Download className="w-3 h-3 text-[#787774]" />
                            <span>BGM만 WAV 저장</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-[#FAF9F7] border border-[#EDEDEB] flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-[#191919]">영상 소리 전체 음소거</h4>
                    <p className="text-[11px] text-[#787774] font-normal">
                      AI 성우 내레이션만 쓰려면 음소거를 켜두세요.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={muted}
                    onChange={(e) => {
                      const newMuted = e.target.checked;
                      setMuted(newMuted);
                      if (videoRef.current) {
                        videoRef.current.muted = newMuted || Boolean(activeStemUrl);
                      }
                      if (stemAudioRef.current) {
                        stemAudioRef.current.muted = newMuted;
                      }
                    }}
                    className="w-5 h-5 accent-[#23272A] rounded cursor-pointer"
                  />
                </div>

                {!muted && (
                  <div className="pt-1">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[#787774] font-medium">선택된 오디오 볼륨</span>
                      <span className="font-mono text-[#191919] font-bold">{volume}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={volume}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setVolume(val);
                        if (videoRef.current && !activeStemUrl) {
                          videoRef.current.volume = val / 100;
                        }
                        if (stemAudioRef.current) {
                          stemAudioRef.current.volume = val / 100;
                        }
                      }}
                      className="w-full accent-[#23272A] cursor-pointer"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Quick Change Video File Button */}
            <div className="flex items-center justify-between pt-1">
              <input
                type="file"
                ref={fileInputRef}
                accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#F1F1EF] text-[#37352F] text-xs font-medium transition border border-[#E3E2DE] cursor-pointer shadow-2xs"
              >
                <Upload className="w-3.5 h-3.5 text-[#787774]" />
                <span>다른 동영상으로 교체</span>
              </button>

              <span className="text-[11px] text-[#787774]">
                씬 권장 길이: <strong className="text-[#191919]">{timeRange}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer: Notion Style */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-[#EDEDEB] bg-white flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#F1F1EF] hover:bg-white text-[#37352F] border border-[#E3E2DE] text-xs font-semibold transition cursor-pointer shadow-2xs"
          >
            취소
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-[#23272A] hover:bg-[#111213] text-white text-xs font-bold shadow-xs transition cursor-pointer active:scale-95"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>씬 {sceneNumber}에 동영상 적용</span>
          </button>
        </div>
      </div>
    </div>
  );
};
