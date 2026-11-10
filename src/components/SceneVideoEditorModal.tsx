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
  Sparkles
} from 'lucide-react';
import { SceneItem } from '../types';

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
  initialCrop?: { xPercent: number; yPercent: number; zoom: number };
  onApplyVideo: (config: {
    videoUrl: string;
    startTime: number;
    endTime: number;
    playbackRate: number;
    volume: number;
    muted: boolean;
    fit: 'cover' | 'contain';
    crop: { xPercent: number; yPercent: number; zoom: number };
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
  initialCrop = { xPercent: 50, yPercent: 50, zoom: 1.0 },
  onApplyVideo,
  onChangeVideoFile,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
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
  const [loopSection, setLoopSection] = useState<boolean>(true);

  // Active Tool Tab ('trim' | 'transform' | 'speed' | 'audio')
  const [activeTab, setActiveTab] = useState<'trim' | 'transform' | 'speed' | 'audio'>('trim');

  // Handle Video Metadata Loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      if (dur && !isNaN(dur) && isFinite(dur)) {
        setTotalDuration(dur);
        if (!initialEndTime || initialEndTime > dur) {
          // Default to either 5s or total duration
          setEndTime(Math.min(dur, Math.max(2, initialStartTime + 5)));
        }
      }
      videoRef.current.currentTime = startTime;
    }
  };

  // Sync Video Playback with Trimmer Section
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    setCurrentTime(cur);

    if (loopSection && (cur >= endTime || cur < startTime)) {
      videoRef.current.currentTime = startTime;
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      }
    } else if (!loopSection && cur >= endTime) {
      videoRef.current.pause();
      setIsPlaying(false);
      videoRef.current.currentTime = startTime;
    }
  };

  // Toggle Play / Pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      if (videoRef.current.currentTime >= endTime || videoRef.current.currentTime < startTime) {
        videoRef.current.currentTime = startTime;
      }
      videoRef.current.playbackRate = playbackRate;
      videoRef.current.muted = muted;
      videoRef.current.volume = muted ? 0 : volume / 100;
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  // Adjust Start / End Time safely
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
  };

  // Speed Change
  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  // File Change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onChangeVideoFile) {
      onChangeVideoFile(file);
    }
  };

  // Apply Changes
  const handleApply = () => {
    onApplyVideo({
      videoUrl,
      startTime,
      endTime,
      playbackRate,
      volume,
      muted,
      fit,
      crop: { xPercent, yPercent, zoom },
    });
    onClose();
  };

  const selectedDuration = Math.max(0.5, endTime - startTime);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-4xl w-full flex flex-col max-h-[94vh] shadow-2xl overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-rose-500 flex items-center justify-center text-white shadow-md shrink-0">
              <Video className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2 min-w-0">
                <h3 className="text-sm sm:text-base font-black text-white truncate">
                  씬 {sceneNumber} 동영상 편집 (CapCut 스타일)
                </h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/50 shrink-0">
                  9:16 쇼츠
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                대사: "{narrationSnippet}"
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer shrink-0"
            title="닫기"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Modal Body: 2 Columns on Desktop, Stacked on Mobile */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-0">
          {/* Left Column: 9:16 Shorts Video Preview Screen */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center bg-slate-950/90 rounded-2xl p-3 border border-slate-800 relative">
            <div className="w-[200px] sm:w-[240px] aspect-[9/16] bg-black rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-800 relative flex items-center justify-center group">
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
                  transition: 'transform 0.1s ease-out',
                }}
              />

              {/* Play / Pause Overlay Icon */}
              <button
                type="button"
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
                </div>
              </button>

              {/* Safe Zone Grid Outline (CapCut Style) */}
              <div className="absolute inset-x-2 top-[12%] bottom-[20%] border border-dashed border-cyan-400/30 rounded-xl pointer-events-none flex items-start justify-end p-1">
                <span className="text-[8px] bg-cyan-950/80 text-cyan-300 font-bold px-1.5 py-0.5 rounded">
                  자막 안전구역
                </span>
              </div>
            </div>

            {/* Quick Player Bar */}
            <div className="w-full max-w-[240px] mt-3 flex items-center justify-between text-xs text-slate-300">
              <button
                type="button"
                onClick={togglePlay}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-xs cursor-pointer active:scale-95"
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
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                title="시작 구간부터 다시 재생"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <span className="font-mono text-[11px] text-cyan-300 font-extrabold bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700">
                {currentTime.toFixed(1)}s / {selectedDuration.toFixed(1)}s
              </span>
            </div>
          </div>

          {/* Right Column: CapCut Editing Controls */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            {/* Tool Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('trim')}
                className={`py-2 rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer ${
                  activeTab === 'trim'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>구간 자르기</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('transform')}
                className={`py-2 rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer ${
                  activeTab === 'transform'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>화면 & 줌</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('speed')}
                className={`py-2 rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer ${
                  activeTab === 'speed'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Gauge className="w-3.5 h-3.5" />
                <span>배속 ({playbackRate}x)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('audio')}
                className={`py-2 rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer ${
                  activeTab === 'audio'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {muted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
                <span>오디오</span>
              </button>
            </div>

            {/* TAB 1: TRIMMER (구간 자르기) */}
            {activeTab === 'trim' && (
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Scissors className="w-4 h-4 text-cyan-400" />
                    <span>재생할 구간 설정 (트리밍)</span>
                  </span>
                  <span className="text-xs font-black text-cyan-300 bg-cyan-950 px-2.5 py-0.5 rounded-full border border-cyan-800/60">
                    선택 구간: {selectedDuration.toFixed(1)}초
                  </span>
                </div>

                {/* Timeline Bar with Visual Trim Handles */}
                <div className="space-y-2 pt-2">
                  <div className="relative h-10 bg-slate-800 rounded-xl overflow-hidden border border-slate-700 flex items-center px-1">
                    {/* Active Trimmed Zone Highlight */}
                    <div
                      className="absolute top-0 bottom-0 bg-gradient-to-r from-cyan-600/40 via-indigo-600/50 to-rose-600/40 border-l-2 border-r-2 border-cyan-400"
                      style={{
                        left: `${(startTime / totalDuration) * 100}%`,
                        right: `${100 - (endTime / totalDuration) * 100}%`,
                      }}
                    />

                    {/* Current Scrubber Head */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-white z-10 shadow-md pointer-events-none"
                      style={{
                        left: `${(currentTime / totalDuration) * 100}%`,
                      }}
                    />
                  </div>

                  {/* Range Dual Sliders */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 flex items-center justify-between mb-1">
                        <span>시작 시간</span>
                        <span className="font-mono text-cyan-300">{startTime.toFixed(1)}초</span>
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={Math.max(0, endTime - 0.5)}
                        step={0.1}
                        value={startTime}
                        onChange={(e) => handleStartTimeChange(parseFloat(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400 flex items-center justify-between mb-1">
                        <span>종료 시간</span>
                        <span className="font-mono text-cyan-300">{endTime.toFixed(1)}초</span>
                      </label>
                      <input
                        type="range"
                        min={startTime + 0.5}
                        max={totalDuration}
                        step={0.1}
                        value={endTime}
                        onChange={(e) => handleEndTimeChange(parseFloat(e.target.value))}
                        className="w-full accent-rose-400 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
                  <span className="text-[11px] font-bold text-slate-400">빠른 설정:</span>
                  <button
                    type="button"
                    onClick={() => {
                      handleStartTimeChange(0);
                      handleEndTimeChange(Math.min(totalDuration, 5.0));
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700"
                  >
                    처음 5초
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleStartTimeChange(0);
                      handleEndTimeChange(totalDuration);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700"
                  >
                    전체 영상
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoopSection(!loopSection)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ml-auto ${
                      loopSection
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {loopSection ? '🔁 구간 무한반복 ON' : '구간 1회 재생'}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: TRANSFORM & ZOOM (화면 크기, 위치, 줌) */}
            {activeTab === 'transform' && (
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Maximize2 className="w-4 h-4 text-cyan-400" />
                    <span>화면 크기 및 프레이밍 (CapCut 줌/위치)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setZoom(1.0);
                      setXPercent(50);
                      setYPercent(50);
                      setFit('cover');
                    }}
                    className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    초기화
                  </button>
                </div>

                {/* Aspect Ratio Fit Style */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFit('cover')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                      fit === 'cover'
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-600 shadow-sm'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>9:16 전체 꽉 채우기 (추천)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFit('contain')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                      fit === 'contain'
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-600 shadow-sm'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span>원본 비율 유지 (레터박스)</span>
                  </button>
                </div>

                {/* Zoom Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400 font-bold flex items-center gap-1">
                      <Sliders className="w-3 h-3 text-cyan-400" />
                      <span>줌인 배율</span>
                    </span>
                    <span className="font-mono text-cyan-300 font-black">{Math.round(zoom * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={1.0}
                    max={2.5}
                    step={0.05}
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                {/* Pan X and Y Sliders */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 flex items-center justify-between mb-1">
                      <span>좌우 위치 이동</span>
                      <span className="font-mono text-cyan-300">{xPercent}%</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={xPercent}
                      onChange={(e) => setXPercent(parseInt(e.target.value, 10))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 flex items-center justify-between mb-1">
                      <span>상하 위치 이동</span>
                      <span className="font-mono text-cyan-300">{yPercent}%</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={yPercent}
                      onChange={(e) => setYPercent(parseInt(e.target.value, 10))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SPEED (배속 조절) */}
            {activeTab === 'speed' && (
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Gauge className="w-4 h-4 text-cyan-400" />
                    <span>비디오 재생 속도</span>
                  </span>
                  <span className="text-xs font-black text-cyan-300 bg-cyan-950 px-2.5 py-0.5 rounded-full border border-cyan-800/60">
                    현재: {playbackRate}x 배속
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
                  {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => handleSpeedChange(rate)}
                      className={`py-2 rounded-xl border text-xs font-extrabold transition cursor-pointer ${
                        playbackRate === rate
                          ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white border-cyan-500 shadow-md'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {rate === 1.0 ? '1.0x (기본)' : `${rate}x`}
                    </button>
                  ))}
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed font-medium pt-2 border-t border-slate-800/80">
                  💡 <strong>팁:</strong> 쇼츠 특성에 맞게 빠른 호흡을 원하시면 1.25x~1.5x를, 감동 다큐 장면에선 0.75x~1.0x를 추천합니다.
                </p>
              </div>
            )}

            {/* TAB 4: AUDIO / MUTE (오디오 & 볼륨) */}
            {activeTab === 'audio' && (
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                    <span>비디오 원본 소리 설정</span>
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">영상 원본 소리 음소거</h4>
                    <p className="text-[11px] text-slate-400">
                      AI 성우 내레이션과 충돌하지 않도록 기본 음소거를 권장합니다.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={muted}
                    onChange={(e) => {
                      const newMuted = e.target.checked;
                      setMuted(newMuted);
                      if (videoRef.current) {
                        videoRef.current.muted = newMuted;
                      }
                    }}
                    className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                  />
                </div>

                {!muted && (
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-400 font-bold">원본 볼륨 크기</span>
                      <span className="font-mono text-cyan-300 font-bold">{volume}%</span>
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
                        if (videoRef.current) {
                          videoRef.current.volume = val / 100;
                        }
                      }}
                      className="w-full accent-cyan-400 cursor-pointer"
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
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition border border-slate-700 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>다른 동영상으로 교체</span>
              </button>

              <span className="text-[11px] text-slate-400">
                씬 권장 길이: <strong className="text-cyan-300">{timeRange}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
          >
            취소
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-rose-600 hover:from-cyan-400 hover:to-rose-500 text-white text-xs font-black shadow-lg shadow-indigo-600/30 transition cursor-pointer active:scale-95"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>씬 {sceneNumber}에 동영상 적용</span>
          </button>
        </div>
      </div>
    </div>
  );
};
