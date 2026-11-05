import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Play, 
  Pause, 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  Layers, 
  Clock, 
  Type as TypeIcon, 
  Flame, 
  ShieldCheck, 
  Bookmark, 
  Tag, 
  MessageSquareQuote,
  Film,
  Upload,
  Image as ImageIcon,
  Sliders,
  Trash2,
  Video,
  ArrowLeft,
  RotateCw,
  Search,
  Share2,
  Info
} from 'lucide-react';
import { TrendingFigure, ShortsProject, TargetPersona, VideoMoodTone, SceneItem, MotionEffectType, VoiceOption } from '../types';
import { VOICE_OPTIONS } from '../data/voices';
import { playDistinctVoicePreview, stopAllVoicePreviews } from '../utils/voicePlayer';

interface ScriptStudioProps {
  selectedFigure: TrendingFigure | null;
  currentProject: ShortsProject | null;
  onGenerateScript: (persona: TargetPersona, duration: 45 | 60, videoTone: VideoMoodTone, storyAngle?: string) => Promise<void>;
  onSaveProject: (project: ShortsProject) => void;
  onOpenVideoRenderer: (project: ShortsProject) => void;
  onOpenViralStudio?: (topic: string) => void;
  onBackToTrends?: () => void;
  isGenerating: boolean;
}

const STORY_ANGLES = [
  { id: 'random', label: '🎲 다른 대본 무작위 새로고침', desc: '이전과 다른 새로운 서사 생성' },
  { id: 'adversity', label: '💧 감동 역전 실화', desc: '눈물의 고생담과 인생역전' },
  { id: 'twist', label: '⚡ 충격 반전 비하인드', desc: '아무도 몰랐던 충격적 사실' },
  { id: 'success', label: '💼 성공 공식 & 명언', desc: '뼈 때리는 마인드셋과 깨달음' },
  { id: 'legend', label: '🏆 전설의 결정적 순간', desc: '역사를 바꾼 단 하나의 순간' },
];

const MOTION_EFFECTS: { id: MotionEffectType; label: string; desc: string }[] = [
  { id: 'zoom_in', label: '🔍 천천히 줌인', desc: '중심으로 서서히 확대' },
  { id: 'zoom_out', label: '🔎 천천히 줌아웃', desc: '서서히 축소' },
  { id: 'pan_left', label: '⬅️ 좌측 이동', desc: '화면이 오른쪽에서 왼쪽으로 패닝' },
  { id: 'pan_right', label: '➡️ 우측 이동', desc: '화면이 왼쪽에서 오른쪽으로 패닝' },
  { id: 'pan_down', label: '⬇️ 아래로 이동', desc: '위에서 아래로 자연스러운 이동' },
  { id: 'fade', label: '✨ 부드러운 페이드', desc: '부드러운 디졸브 전환' },
  { id: 'static', label: '⏹️ 고정', desc: '정지 화면 유지' },
];

export const ScriptStudio: React.FC<ScriptStudioProps> = ({
  selectedFigure,
  currentProject,
  onGenerateScript,
  onSaveProject,
  onOpenVideoRenderer,
  onOpenViralStudio,
  onBackToTrends,
  isGenerating,
}) => {
  const [targetPersona, setTargetPersona] = useState<TargetPersona>('4060_emotional');
  const [videoTone, setVideoTone] = useState<VideoMoodTone>('Cinematic');
  const [duration, setDuration] = useState<45 | 60>(60);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('voice-1');
  const [activeTab, setActiveTab] = useState<'scenes' | 'script' | 'metadata' | 'copyright'>('scenes');
  const [selectedHookIndex, setSelectedHookIndex] = useState(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Local editable project state
  const [editableScript, setEditableScript] = useState('');
  const [editableScenes, setEditableScenes] = useState<SceneItem[]>([]);

  // TTS states
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [isPlayingVoiceSample, setIsPlayingVoiceSample] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(1.1);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // File input refs for uploading image per scene
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  // Sync state when project changes
  useEffect(() => {
    if (currentProject) {
      setEditableScript(currentProject.fullScript);
      setEditableScenes(currentProject.scenes);
      setSelectedHookIndex(currentProject.selectedHookIndex ?? 0);
      if (currentProject.selectedVoiceId) setSelectedVoiceId(currentProject.selectedVoiceId);
      if (currentProject.voiceSpeedMultiplier) setSpeechRate(currentProject.voiceSpeedMultiplier);
      if (currentProject.videoTone) setVideoTone(currentProject.videoTone);
    }
  }, [currentProject]);

  // Handle TTS setup
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleHookSelect = (index: number) => {
    setSelectedHookIndex(index);
    if (!currentProject || !currentProject.hooks[index]) return;

    const hookText = currentProject.hooks[index].text;
    if (editableScenes.length > 0) {
      const updated = [...editableScenes];
      updated[0] = {
        ...updated[0],
        narration: hookText,
      };
      setEditableScenes(updated);
      setEditableScript(updated.map((s) => s.narration).join('\n\n'));
    }
  };

  const handleSceneNarrationChange = (index: number, val: string) => {
    const updated = [...editableScenes];
    updated[index] = { ...updated[index], narration: val };
    setEditableScenes(updated);
    setEditableScript(updated.map((s) => s.narration).join('\n\n'));
  };

  const handleSceneMotionChange = (index: number, motion: MotionEffectType) => {
    const updated = [...editableScenes];
    updated[index] = { ...updated[index], motionEffect: motion };
    setEditableScenes(updated);
  };

  // Scene photo file upload
  const handleImageFileUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const updated = [...editableScenes];
      updated[index] = { ...updated[index], uploadedImageUrl: dataUrl };
      setEditableScenes(updated);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveSceneImage = (index: number) => {
    const updated = [...editableScenes];
    updated[index] = { ...updated[index], uploadedImageUrl: undefined };
    setEditableScenes(updated);
  };

  // Batch motion applicator helpers
  const handleApplyMotionToAll = (motion: MotionEffectType) => {
    const updated = editableScenes.map((s) => ({
      ...s,
      motionEffect: motion,
    }));
    setEditableScenes(updated);
  };

  const handleApplyAlternatingMotions = () => {
    const pattern: MotionEffectType[] = ['zoom_in', 'pan_left', 'zoom_out', 'pan_right', 'pan_down'];
    const updated = editableScenes.map((s, i) => ({
      ...s,
      motionEffect: pattern[i % pattern.length],
    }));
    setEditableScenes(updated);
  };

  // CapCut / Vrew text exporter
  const generateCapCutVrewFormat = () => {
    if (!editableScenes.length) return '';
    return editableScenes
      .map(
        (scene) =>
          `[Scene ${scene.sceneNumber}] (${scene.timeRange})\n자막: ${scene.narration}\n에셋: ${scene.imageSearchKeyword}\n모션효과: ${scene.motionEffect || 'zoom_in'}`
      )
      .join('\n\n---\n\n');
  };

  // Download TXT
  const handleDownloadTxt = () => {
    const cleanTags = currentProject?.cleanSemanticTags || currentProject?.hashtags?.slice(0, 4) || ['#shorts', `#${selectedFigure?.name || '트렌드'}`];
    const times = (currentProject?.timestamps || [
      { time: '00:00', label: '충격적인 첫 시작' },
      { time: '00:15', label: '위기와 시련' },
      { time: '00:35', label: '인생을 바꾼 결정적 터닝포인트' },
      { time: '00:50', label: '정상에 오른 기적의 신화' }
    ]).map(t => `${t.time} ${t.label}`).join('\n');

    const content = `[Untold 쇼츠 프로젝트: ${selectedFigure?.name || '화제의 인물'}]\n\n` +
      `================ 2026 알고리즘 최적화 메타데이터 ================\n\n` +
      `🔥 클릭률(CTR 15%+) 제목 추천:\n${currentProject?.titles.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n\n` +
      `🔍 검색창 첫 2줄 미리보기 SEO:\n${currentProject?.firstTwoLinesSeo || `${selectedFigure?.name || ''} 비하인드 스토리`}\n\n` +
      `⏱️ 구글 검색 연동 타임스탬프 챕터:\n${times}\n\n` +
      `💬 댓글 폭발 고정 댓글 & A/B 투표:\n${currentProject?.pinnedComment || ''}\n\n` +
      `🏷️ 스팸 없는 클린 색인 태그 (단 3~5개):\n${cleanTags.join(' ')}\n\n` +
      (currentProject?.semanticKeywords ? `🎙️ AI 음성/자막 인식용 키워드: ${currentProject.semanticKeywords.join(', ')}\n\n` : '') +
      `==================== 전체 대본 ====================\n` +
      `${editableScript}\n\n` +
      `================ 3초 단위 씬별 에셋 가이드 ================\n` +
      generateCapCutVrewFormat();

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Untold_${selectedFigure?.name || 'shorts'}_대본_알고리즘치트키.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stopVoiceRef = useRef<(() => void) | null>(null);

  // Play sample of selected voice with distinct pitch and timbre
  const playVoiceSample = async (voice: VoiceOption) => {
    if (isPlayingVoiceSample) {
      if (stopVoiceRef.current) stopVoiceRef.current();
      stopAllVoicePreviews();
      setIsPlayingVoiceSample(false);
      return;
    }

    try {
      setIsPlayingVoiceSample(true);
      const stopFn = await playDistinctVoicePreview(voice, speechRate, () => {
        setIsPlayingVoiceSample(false);
      });
      stopVoiceRef.current = stopFn;
    } catch (e) {
      setIsPlayingVoiceSample(false);
    }
  };

  // Web Speech TTS playback for full script
  const toggleTTS = () => {
    if (!synthRef.current) return;

    if (isPlayingTTS) {
      synthRef.current.cancel();
      setIsPlayingTTS(false);
      return;
    }

    const textToRead = editableScript;
    if (!textToRead.trim()) return;

    synthRef.current.cancel();
    const currentVoice = VOICE_OPTIONS.find((v) => v.id === selectedVoiceId) || VOICE_OPTIONS[0];

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'ko-KR';
    utterance.rate = speechRate * (currentVoice.rate || 1.0);
    utterance.pitch = currentVoice.pitch || 1.0;

    const voices = synthRef.current.getVoices();
    const koVoices = voices.filter((v) => v.lang.startsWith('ko'));
    if (koVoices.length > 0) {
      if (currentVoice.gender === 'female' && koVoices.length > 1) {
        utterance.voice = koVoices[1];
      } else {
        utterance.voice = koVoices[0];
      }
    }

    utterance.onend = () => setIsPlayingTTS(false);
    utterance.onerror = () => setIsPlayingTTS(false);

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
    setIsPlayingTTS(true);
  };

  const charCount = editableScript.replace(/\s+/g, '').length;
  const estimatedSeconds = Math.round((charCount / 6.5) / speechRate);

  const getUpdatedProject = (): ShortsProject => {
    if (!currentProject) {
      const fallbackFigure = selectedFigure ? selectedFigure.name : '화제의 인물';
      const fallbackScenes: SceneItem[] = editableScenes.length > 0 ? editableScenes : [
        {
          sceneNumber: 1,
          timeRange: '00:00 - 00:05',
          narration: `${fallbackFigure}의 충격적인 인생 역전과 아무도 몰랐던 비하인드 스토리!`,
          visualGuide: `${fallbackFigure}의 대표 사진과 강렬한 타이틀`,
          imageSearchKeyword: `${fallbackFigure} 고화질`,
          visualEffect: '슬로우 줌인',
          uploadedImageUrl: selectedFigure?.imageUrl,
          motionEffect: 'zoom_in',
        },
        {
          sceneNumber: 2,
          timeRange: '00:05 - 00:11',
          narration: '모두가 불가능하다고 여겼던 순간에도 묵묵히 자신의 길을 증명해냈습니다.',
          visualGuide: '어두운 무명 시절을 상징하는 흑백 아카이브 사진',
          imageSearchKeyword: `${fallbackFigure} 무명시절 인터뷰`,
          visualEffect: '좌측 패닝',
          motionEffect: 'pan_left',
        },
        {
          sceneNumber: 3,
          timeRange: '00:11 - 00:18',
          narration: '수많은 시련과 실패를 딛고 일어선 그의 감동적인 발자취는 오늘 우리에게 깊은 울림을 줍니다.',
          visualGuide: '정상에 올라선 감동적인 순간',
          imageSearchKeyword: `${fallbackFigure} 시상식 소감`,
          visualEffect: '천천히 줌아웃',
          motionEffect: 'zoom_out',
        }
      ];

      return {
        id: `proj-${Date.now()}`,
        figureName: fallbackFigure,
        category: selectedFigure ? selectedFigure.category : 'entertainment',
        targetPersona,
        targetDuration: duration,
        videoTone,
        hooks: [
          {
            type: 'question',
            label: '질문형 후킹',
            text: `여러분은 ${fallbackFigure} 님이 가장 절망적이었던 순간을 어떻게 이겨냈는지 아십니까?`
          }
        ],
        selectedHookIndex: 0,
        titles: [`${fallbackFigure}의 눈물겨운 인생 역전 스토리 #shorts`],
        hashtags: ['#shorts', `#${fallbackFigure}`, '#인생역전', '#감동실화'],
        description: `${fallbackFigure}의 비하인드 스토리 2차 창작 숏폼`,
        pinnedComment: `${fallbackFigure} 님의 이야기를 보고 느낀 점을 댓글로 나눠주세요!`,
        fullScript: editableScript || fallbackScenes.map((s) => s.narration).join('\n\n'),
        scenes: fallbackScenes,
        copyrightDefenseNote: '2차 저작물 공정 이용 가이드라인 준수',
        charCount: (editableScript || '').length || 100,
        estimatedSeconds: estimatedSeconds || 45,
        createdAt: new Date().toISOString(),
        selectedVoiceId,
        voiceSpeedMultiplier: speechRate,
      };
    }

    return {
      ...currentProject,
      fullScript: editableScript,
      scenes: editableScenes,
      selectedHookIndex,
      selectedVoiceId,
      voiceSpeedMultiplier: speechRate,
      videoTone,
      charCount,
      estimatedSeconds,
    };
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
      {/* Top Banner / Selected Figure Info */}
      <div className="p-4 bg-slate-50/80 border-b border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            {onBackToTrends && (
              <button
                type="button"
                onClick={onBackToTrends}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition shadow-2xs flex items-center space-x-1.5 cursor-pointer font-bold text-xs"
                title="1단계: 트렌드 인물 선택으로 돌아가기"
              >
                <ArrowLeft className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="hidden sm:inline">인물 다시 선택</span>
              </button>
            )}
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-base shadow-sm shrink-0">
              {selectedFigure ? selectedFigure.name.slice(0, 2) : '쇼츠'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-extrabold text-slate-900">
                  {selectedFigure ? selectedFigure.name : '인물을 선택해주세요'}
                </h2>
                {selectedFigure && (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full font-black bg-rose-50 text-rose-600 border border-rose-200 flex items-center gap-1">
                    <Flame className="w-3 h-3 fill-rose-500 text-rose-500" />
                    화제성 {selectedFigure.viralityScore}점
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium line-clamp-1">
                {selectedFigure?.suggestedAngle || '화제의 인물 맞춤 대본과 3초 단위 씬별 에셋을 기획합니다.'}
              </p>
            </div>
          </div>

          {/* Persona, Duration & Voice Selectors & Generate Button */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Voice Selector */}
            <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-xl px-2 py-1 shadow-2xs">
              <span className="text-[11px] font-extrabold text-indigo-700 mr-0.5">🎙️ Fish Audio 성우 (15인)</span>
              <select
                value={selectedVoiceId}
                onChange={(e) => setSelectedVoiceId(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer max-w-[190px]"
              >
                {VOICE_OPTIONS.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.gender === 'male' ? '👨' : '👩'} {v.name} ({v.role}) • [{v.categoryTag}]
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  const voice = VOICE_OPTIONS.find((v) => v.id === selectedVoiceId) || VOICE_OPTIONS[0];
                  playVoiceSample(voice);
                }}
                className={`p-1 rounded-lg text-[10px] font-bold transition flex items-center space-x-1 ${
                  isPlayingVoiceSample
                    ? 'bg-rose-500 text-white'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
                title="목소리 샘플 미리듣기"
              >
                {isPlayingVoiceSample ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5 fill-current" />}
                <span>{isPlayingVoiceSample ? '정지' : '샘플'}</span>
              </button>
            </div>

            {/* Persona Selector */}
            <select
              value={targetPersona}
              onChange={(e) => setTargetPersona(e.target.value as TargetPersona)}
              className="bg-white border border-slate-200 text-xs font-bold text-slate-700 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 shadow-2xs"
            >
              <option value="4060_emotional">👵 40~60대 감동 극복</option>
              <option value="1020_dopamine">⚡ 10~20대 도파민 밈</option>
              <option value="3040_success">💼 30~40대 동기부여</option>
              <option value="mystery_twist">🕵️ 반전 미스터리</option>
            </select>

            {/* Target Duration Selector (45s vs 60s) */}
            <div className="flex items-center bg-slate-200/70 rounded-xl border border-slate-200 p-0.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setDuration(45)}
                className={`px-2.5 py-1 rounded-lg transition ${
                  duration === 45 ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="45초 쇼츠 규격 (약 300~330자, 9개 씬)"
              >
                45초 (9씬)
              </button>
              <button
                type="button"
                onClick={() => setDuration(60)}
                className={`px-2.5 py-1 rounded-lg transition ${
                  duration === 60 ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="60초 쇼츠 완벽 규격 (약 400~450자, 12개 씬)"
              >
                60초 (12씬)
              </button>
            </div>

            <button
              type="button"
              onClick={() => onGenerateScript(targetPersona, duration, videoTone, 'random')}
              disabled={isGenerating || !selectedFigure}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md shadow-amber-500/20 transition disabled:opacity-50 cursor-pointer"
              title="대본이 마음에 안 드시나요? 새로운 스토리로 즉시 새로고침합니다"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>대본 새로고침</span>
            </button>

            <button
              onClick={() => onGenerateScript(targetPersona, duration, videoTone)}
              disabled={isGenerating || !selectedFigure}
              className="flex items-center space-x-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-indigo-500/20 transition disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? '대본 생성 중...' : `${duration}초 대본 자동 생성`}</span>
            </button>
          </div>
        </div>

        {/* 3초 후킹(Hook) 3단 선택기 */}
        {currentProject && currentProject.hooks && currentProject.hooks.length > 0 && (
          <div className="mt-3.5 pt-3.5 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-1.5 text-xs font-extrabold text-amber-600">
                <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span>시청자 이탈 방지 3초 후킹(Hook) 선택</span>
                <span className="text-[11px] text-slate-500 font-medium">
                  (클릭 시 도입부 씬1에 실시간 자동 적용)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {currentProject.hooks.map((hook, idx) => {
                const isHookSelected = selectedHookIndex === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleHookSelect(idx)}
                    className={`text-left p-3 rounded-2xl border text-xs transition relative ${
                      isHookSelected
                        ? 'bg-amber-50 border-amber-400 text-amber-950 shadow-xs ring-1 ring-amber-400'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {hook.label || `옵션 ${idx + 1}`}
                      </span>
                      {isHookSelected && (
                        <span className="text-[10px] font-black text-amber-600 flex items-center gap-1">
                          <Check className="w-3 h-3" /> 적용됨
                        </span>
                      )}
                    </div>
                    <p className="line-clamp-2 leading-relaxed font-semibold">"{hook.text}"</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 대본 새로고침 & 다양한 스토리 각도 선택 배너 */}
        <div className="mt-3.5 p-3 rounded-2xl bg-gradient-to-r from-amber-50/90 via-indigo-50/70 to-rose-50/90 border border-amber-200/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5 text-xs shadow-2xs">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-xl bg-amber-500 text-white shadow-2xs shrink-0">
              <RotateCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 block sm:inline">대본이 마음에 안 드시나요?</span>{' '}
              <span className="text-[11px] text-slate-600 font-medium">원하는 스토리 테마를 클릭하면 즉시 새로운 각도의 대본으로 새로고침됩니다.</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {STORY_ANGLES.map((angle) => (
              <button
                key={angle.id}
                type="button"
                onClick={() => onGenerateScript(targetPersona, duration, videoTone, angle.id)}
                disabled={isGenerating}
                className="px-2.5 py-1 rounded-xl bg-white hover:bg-amber-500 hover:text-white border border-slate-200 hover:border-amber-400 text-slate-700 font-bold text-[11px] transition shadow-2xs cursor-pointer flex items-center space-x-1 disabled:opacity-50"
                title={angle.desc}
              >
                <span>{angle.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs Row & Live Narration Stats */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-1 text-xs">
          <button
            onClick={() => setActiveTab('scenes')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold transition ${
              activeTab === 'scenes'
                ? 'bg-white text-slate-900 border border-slate-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>🎬 씬별 사진 & 모션 에셋 ({editableScenes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('script')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold transition ${
              activeTab === 'script'
                ? 'bg-white text-slate-900 border border-slate-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TypeIcon className="w-3.5 h-3.5 text-indigo-600" />
            <span>📝 전체 대본 에디터</span>
          </button>

          <button
            onClick={() => setActiveTab('metadata')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold transition ${
              activeTab === 'metadata'
                ? 'bg-white text-slate-900 border border-slate-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-600" />
            <span>🚀 2026 알고리즘 치트키 & 메타</span>
          </button>

          <button
            onClick={() => setActiveTab('copyright')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold transition ${
              activeTab === 'copyright'
                ? 'bg-white text-slate-900 border border-slate-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>🛡️ 저작권 방어 패치</span>
          </button>
        </div>

        {/* Live Narration Reading Time Bar & TTS */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1 text-slate-600 font-bold">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span>예상 {estimatedSeconds}초</span>
            <span className="text-slate-300">/</span>
            <span>{charCount}자</span>
          </div>

          <div className="flex items-center space-x-1 bg-white px-2 py-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              onClick={toggleTTS}
              className={`p-1.5 rounded-lg transition ${
                isPlayingTTS ? 'bg-rose-500 text-white' : 'bg-slate-100 text-indigo-600 hover:bg-indigo-50'
              }`}
              title={isPlayingTTS ? '정지' : '음성 미리듣기'}
            >
              {isPlayingTTS ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
            </button>
            <span className="text-[10px] text-slate-600 px-1 font-bold">{speechRate}x</span>
            <select
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              className="bg-transparent text-[10px] font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value={0.8}>0.8x (차분함)</option>
              <option value={1.0}>1.0x (표준)</option>
              <option value={1.1}>1.1x (쇼츠 추천)</option>
              <option value={1.2}>1.2x (스피디)</option>
              <option value={1.3}>1.3x (고속)</option>
              <option value={1.5}>1.5x (초고속)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
        {!currentProject ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-sm">
              <Film className="w-8 h-8" />
            </div>
            <div className="max-w-md space-y-2">
              <h3 className="text-base font-extrabold text-slate-900">화제의 인물 쇼츠 기획을 시작하세요</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                좌측에서 인물을 선택한 후 우측 상단의 <strong className="text-indigo-600">[쇼츠 대본 자동 생성]</strong> 버튼을 누르면,
                3초 후킹 멘트, 3초 단위 씬별 에셋 가이드, 사진 업로드, 줌인/팬 모션 효과 및 1080p 영상 변환이 원스톱으로 지원됩니다.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* VIEW 1: SCENES STORYBOARD, PHOTO UPLOADER & MOTION CONTROLS */}
            {activeTab === 'scenes' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2 bg-slate-100/80 p-2.5 rounded-2xl border border-slate-200">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-extrabold text-slate-900 mr-1">
                      총 {editableScenes.length}개 씬 에셋
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="text-[11px] font-bold text-slate-500">모션 일괄:</span>
                    <button
                      type="button"
                      onClick={handleApplyAlternatingMotions}
                      className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-[11px] border border-indigo-200 shadow-2xs transition cursor-pointer"
                      title="모든 씬에 줌인·패닝·줌아웃 모션을 리듬감 있게 자동 분배합니다"
                    >
                      🎲 다이내믹 자동 분배
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyMotionToAll('zoom_in')}
                      className="px-2 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-bold text-[11px] border border-slate-200 shadow-2xs transition cursor-pointer"
                    >
                      🔍 전체 줌인
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyMotionToAll('pan_left')}
                      className="px-2 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-bold text-[11px] border border-slate-200 shadow-2xs transition cursor-pointer"
                    >
                      ⬅️ 전체 좌측패닝
                    </button>
                  </div>

                  <button
                    onClick={() => handleCopy(generateCapCutVrewFormat(), 'capcut-all')}
                    className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-700 font-bold text-xs"
                  >
                    {copiedKey === 'capcut-all' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>캡컷/브루 전체 포맷 복사</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3.5">
                  {editableScenes.map((scene, idx) => (
                    <div
                      key={scene.sceneNumber || idx}
                      className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-xs space-y-3 transition"
                    >
                      {/* Scene Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white">
                            Scene {scene.sceneNumber}
                          </span>
                          <span className="text-xs font-bold text-slate-500">
                            {scene.timeRange}
                          </span>
                          {idx === 0 && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                              3초 골든 후킹
                            </span>
                          )}
                        </div>

                        {/* Motion effect quick badge */}
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                            모션: {MOTION_EFFECTS.find((m) => m.id === (scene.motionEffect || 'zoom_in'))?.label || '천천히 줌인'}
                          </span>
                          {scene.bgmSuggestion && (
                            <span className="text-[11px] text-slate-400 hidden sm:inline font-medium">
                              🎵 {scene.bgmSuggestion}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Narration Text Input */}
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 mb-1 flex items-center justify-between">
                          <span>나레이션 (TTS 자막 문장)</span>
                          <span className="text-[10px] text-slate-400 font-medium">{scene.narration.length}자</span>
                        </label>
                        <textarea
                          rows={2}
                          value={scene.narration}
                          onChange={(e) => handleSceneNarrationChange(idx, e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-medium leading-relaxed focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      {/* Photo Upload & Motion Controls Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                        {/* Image Preview & Upload Button */}
                        <div className="sm:col-span-5 flex items-center space-x-3">
                          {scene.uploadedImageUrl ? (
                            <div className="relative group w-16 h-20 rounded-xl overflow-hidden border border-slate-300 shadow-2xs flex-shrink-0">
                              <img
                                src={scene.uploadedImageUrl}
                                alt={`Scene ${scene.sceneNumber}`}
                                className="w-full h-full object-cover"
                              />
                              <button
                                onClick={() => handleRemoveSceneImage(idx)}
                                className="absolute top-1 right-1 p-1 rounded-md bg-black/60 text-white hover:bg-rose-600 transition"
                                title="사진 삭제"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="w-16 h-20 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 flex-shrink-0 bg-white">
                              <ImageIcon className="w-5 h-5 mb-0.5" />
                              <span className="text-[9px] font-bold">사진 없음</span>
                            </div>
                          )}

                          <div className="space-y-1.5 flex-1">
                            <input
                              type="file"
                              accept="image/*"
                              ref={(el) => {
                                fileInputRefs.current[idx] = el;
                              }}
                              onChange={(e) => handleImageFileUpload(idx, e)}
                              className="hidden"
                            />
                            <div className="flex items-center space-x-1.5">
                              <button
                                type="button"
                                onClick={() => fileInputRefs.current[idx]?.click()}
                                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] border border-indigo-200 transition"
                              >
                                <Upload className="w-3 h-3" />
                                <span>{scene.uploadedImageUrl ? '사진 교체' : '사진 업로드'}</span>
                              </button>

                              <a
                                href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(scene.imageSearchKeyword)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] border border-amber-200 transition"
                                title="새 탭에서 구글 이미지 검색"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>구글 검색</span>
                              </a>
                            </div>
                            <p className="text-[10px] text-slate-500 font-medium truncate">
                              키워드: "{scene.imageSearchKeyword}"
                            </p>
                          </div>
                        </div>

                        {/* Motion Effect Selector for this scene */}
                        <div className="sm:col-span-7 flex flex-col justify-center space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                            <Sliders className="w-3 h-3 text-indigo-600" />
                            <span>카메라 모션 효과 (천천히 줌인/이동)</span>
                          </label>
                          <select
                            value={scene.motionEffect || 'zoom_in'}
                            onChange={(e) => handleSceneMotionChange(idx, e.target.value as MotionEffectType)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-indigo-500 shadow-2xs"
                          >
                            {MOTION_EFFECTS.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.label} ({m.desc})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Visual Direction detail */}
                      <p className="text-[11px] text-slate-500 italic font-medium">
                        연출 가이드: {scene.visualGuide}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 2: FULL SCRIPT EDITOR */}
            {activeTab === 'script' && (
              <div className="space-y-4">
                {/* 대본 마음에 안 들 때 원클릭 새로고침 배너 */}
                <div className="flex flex-wrap items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-indigo-50 border border-amber-200 text-xs gap-2.5 shadow-2xs">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <span className="font-extrabold text-amber-950">
                        현재 대본의 서사나 문장이 마음에 들지 않으신가요?
                      </span>
                      <p className="text-[11px] text-slate-500 font-medium">
                        새로고침 버튼을 누르면 다른 앵글과 에피소드로 대본 전체를 즉시 다시 작성합니다.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onGenerateScript(targetPersona, duration, videoTone, 'random')}
                    disabled={isGenerating}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-xs transition cursor-pointer disabled:opacity-50 shrink-0"
                    title="다른 대본으로 즉시 새로고침"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                    <span>🎲 다른 대본으로 새로고침</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600">
                  <p className="font-medium">
                    쇼츠 호흡에 맞게 한 문장씩 자연스럽게 다듬을 수 있는 통합 대본 에디터입니다.
                  </p>
                  <button
                    onClick={() => handleCopy(editableScript, 'full-script')}
                    className="flex items-center space-x-1 px-3 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs cursor-pointer"
                  >
                    {copiedKey === 'full-script' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>대본 전체 복사</span>
                  </button>
                </div>

                <div className="relative">
                  <textarea
                    rows={16}
                    value={editableScript}
                    onChange={(e) => setEditableScript(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm text-slate-900 font-mono leading-loose focus:outline-none focus:border-indigo-500 shadow-2xs"
                  />
                </div>
              </div>
            )}

            {/* VIEW 3: 2026 ALGORITHM CHEATSHEET & METADATA */}
            {activeTab === 'metadata' && (
              <div className="space-y-4">
                {/* 2026 Factcheck Alert */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white shadow-sm space-y-1.5 border border-indigo-500/30">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-black text-[10px] tracking-wider uppercase">
                      2026 알고리즘 치트키
                    </span>
                    <span className="text-xs font-bold text-indigo-200">
                      유튜브 쇼츠 & 인스타 릴스 떡상 핵심 공식
                    </span>
                  </div>
                  <p className="text-xs text-indigo-100/90 leading-relaxed">
                    과거 30개 해시태그 도배는 <strong>스팸 필터링 대상</strong>입니다! 현재 유튜브와 릴스는 <strong className="text-amber-300">① 첫 2줄 검색 SEO</strong>, <strong className="text-emerald-300">② 구글 검색 연동 타임스탬프</strong>, <strong className="text-rose-300">③ 댓글 논쟁 유도(A vs B 투표)</strong>, <strong className="text-cyan-300">④ 클린 색인 태그 3개</strong>로 알고리즘 피드에 노출됩니다.
                  </p>
                </div>

                {/* 1. CTR 15%+ Titles */}
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold text-amber-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>1단계: 클릭률(CTR) 15%+ 극대화 제목 (A/B/C 테스트)</span>
                  </h4>
                  <div className="space-y-2">
                    {currentProject.titles.map((title, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200 text-xs shadow-2xs hover:border-amber-300 transition"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-black text-amber-600 shrink-0">#{i + 1}</span>
                          <span className="font-bold text-slate-900">{title}</span>
                        </div>
                        <button
                          onClick={() => handleCopy(title, `title-${i}`)}
                          className="flex items-center space-x-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold shrink-0 cursor-pointer"
                        >
                          {copiedKey === `title-${i}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>복사</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. YouTube & Google Search First 2 Lines SEO + Chapter Timestamps */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-xs font-extrabold text-slate-900">
                        2단계: 구글 & 유튜브 검색 최적화 (첫 2줄 미리보기 & 타임스탬프)
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        const seoText = currentProject.firstTwoLinesSeo || `${selectedFigure?.name || ''} 비하인드 스토리.`;
                        const times = (currentProject.timestamps || [
                          { time: '00:00', label: '인트로 후킹' },
                          { time: '00:15', label: '사건의 전말' },
                          { time: '00:35', label: '위기와 반전' },
                          { time: '00:50', label: '충격 결말' }
                        ]).map(t => `${t.time} ${t.label}`).join('\n');
                        const combined = `${seoText}\n\n[타임라인]\n${times}\n\n${currentProject.description || ''}`;
                        handleCopy(combined, 'seo-desc');
                      }}
                      className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'seo-desc' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>설명란 전체 복사</span>
                    </button>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-500">
                      🔍 모바일 검색 결과창 미리보기 첫 2줄:
                    </div>
                    <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                      {currentProject.firstTwoLinesSeo || `${selectedFigure?.name || '화제의 인물'}의 충격적인 인생역전 실화. 방송에서 편집된 무명시절 비하인드 스토리 공개.`}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-500">
                      ⏱️ 구글 검색 Key Moments 연동 챕터 마커:
                    </div>
                    <div className="font-mono text-xs text-slate-700 space-y-1">
                      {(currentProject.timestamps || [
                        { time: '00:00', label: '충격적인 첫 시작' },
                        { time: '00:15', label: '인생을 바꾼 운명적 선택' },
                        { time: '00:35', label: '위기와 지옥의 수련' },
                        { time: '00:50', label: '정상에 오른 기적의 신화' }
                      ]).map((t, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="font-bold text-blue-600">{t.time}</span>
                          <span>{t.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. Interactive Debate Comment Baits & Pinned Comment */}
                <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <MessageSquareQuote className="w-3.5 h-3.5 text-rose-600" />
                      <span className="text-xs font-extrabold text-rose-950">
                        3단계: 댓글 폭발 치트키 (A vs B 논쟁 투표 & 고정 댓글)
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopy(currentProject.pinnedComment, 'pinned-comment')}
                      className="text-xs font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'pinned-comment' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>고정댓글 복사</span>
                    </button>
                  </div>

                  <p className="text-xs font-bold text-slate-800 leading-relaxed bg-white p-3.5 rounded-xl border border-rose-200">
                    "{currentProject.pinnedComment}"
                  </p>

                  <div className="bg-white/80 p-3 rounded-xl border border-rose-100 text-[11px] text-slate-600 space-y-1">
                    <div className="font-bold text-rose-700 flex items-center gap-1">
                      <span>💡 시청자 반응 알고리즘 원리:</span>
                    </div>
                    <p className="leading-snug">
                      시청자가 양자택일(A vs B) 투표에 참전하는 순간, 영상의 인터랙션 점수가 급상승하여 유튜브 알고리즘이 추천 피드로 밀어올립니다.
                    </p>
                  </div>
                </div>

                {/* 4. Clean Category Semantic Tags (Only 3~5) & AI Voice Keywords */}
                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="text-xs font-extrabold text-indigo-950">
                        4단계: 스팸 없는 클린 카테고리 색인 태그 (단 3~5개)
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        const tags = (currentProject.cleanSemanticTags || currentProject.hashtags.slice(0, 4)).map(t => `#${t.replace('#','')}`).join(' ');
                        handleCopy(tags, 'clean-tags');
                      }}
                      className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'clean-tags' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>태그 복사</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {(currentProject.cleanSemanticTags || currentProject.hashtags.slice(0, 4)).map((t, idx) => (
                      <span key={idx} className="text-xs font-bold px-3 py-1 rounded-xl bg-white text-indigo-700 border border-indigo-200 shadow-2xs">
                        #{t.replace('#','')}
                      </span>
                    ))}
                  </div>

                  {/* AI Speech Voice Keywords */}
                  <div className="pt-2 border-t border-indigo-100 flex flex-wrap items-center gap-1 text-[11px] text-indigo-900 font-medium">
                    <span className="font-bold text-indigo-600">🎙️ AI 음성(Whisper) 자동 색인 키워드:</span>
                    <span>
                      {(currentProject.semanticKeywords || [selectedFigure?.name || '인물', '비하인드', '감동실화', '인생역전', '성공비결']).join(', ')}
                    </span>
                  </div>
                </div>

                {/* One-click Full Metadata Copy */}
                <button
                  onClick={() => {
                    const cleanTags = (currentProject.cleanSemanticTags || currentProject.hashtags.slice(0, 4)).map(t => `#${t.replace('#','')}`).join(' ');
                    const times = (currentProject.timestamps || [
                      { time: '00:00', label: '충격적인 첫 시작' },
                      { time: '00:15', label: '위기와 시련' },
                      { time: '00:35', label: '인생을 바꾼 결정적 터닝포인트' },
                      { time: '00:50', label: '정상에 오른 기적의 신화' }
                    ]).map(t => `${t.time} ${t.label}`).join('\n');
                    const fullMeta = `[유튜브 쇼츠 업로드용 2026 알고리즘 최적화 메타]\n\n` +
                      `1. 추천 제목:\n${currentProject.titles[0]}\n\n` +
                      `2. 설명란 (첫 2줄 SEO + 타임스탬프):\n${currentProject.firstTwoLinesSeo || ''}\n\n${currentProject.description}\n\n[타임라인]\n${times}\n\n${cleanTags}\n\n` +
                      `3. 고정 댓글:\n${currentProject.pinnedComment}`;
                    handleCopy(fullMeta, 'full-shorts-meta');
                  }}
                  className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                >
                  {copiedKey === 'full-shorts-meta' ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>쇼츠 업로드 메타데이터 원클릭 전체 복사 (제목+설명+고정댓글)</span>
                </button>
              </div>
            )}

            {/* VIEW 4: COPYRIGHT DEFENSE PATCH */}
            {activeTab === 'copyright' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-2">
                  <div className="flex items-center space-x-2 text-blue-900 font-extrabold text-sm">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    <span>100% 실화 및 사실(Fact) 기반 검증 보증</span>
                  </div>
                  <p className="text-xs text-blue-950 leading-relaxed font-medium">
                    본 시스템의 AI 엔진은 공식 언론 보도, 방송 인터뷰, 공인된 프로필 등 검증된 <strong>실제 사실(Fact)</strong>만을 바탕으로 대본을 구성합니다. 허위사실 날조나 왜곡으로 인한 법적 리스크(명예훼손 및 허위사실 유포)를 원천 차단하기 위해 엄격한 팩트 준수 규칙 및 저온도(Low-temperature) 생성 가이드라인이 강제되어 있습니다.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span>저작권 안전 2차 저작물 보증 리포트</span>
                  </div>
                  <p className="text-xs text-emerald-950 leading-relaxed font-medium">
                    {currentProject.copyrightDefenseNote}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                    <h5 className="font-extrabold text-slate-900 flex items-center gap-1.5">
                      <span className="text-rose-500">❌</span> 위반 위험이 높은 방식
                    </h5>
                    <ul className="text-slate-600 space-y-1 list-disc list-inside font-medium">
                      <li>방송사 원본 영상을 그대로 이어 붙이는 행위</li>
                      <li>단순 사실 전달만 하는 무지성 AI 기계음 뉴스 낭독</li>
                      <li>인물에 대한 비방 및 사실 왜곡</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                    <h5 className="font-extrabold text-slate-900 flex items-center gap-1.5">
                      <span className="text-emerald-600">✅</span> Untold의 2차 창작 방식
                    </h5>
                    <ul className="text-slate-700 space-y-1 list-disc list-inside font-medium">
                      <li>이미지 슬라이드 3초 컷 + 천천히 줌인/팬 모션 효과</li>
                      <li>인물의 역경 극복과 긍정적 서사를 조명하는 헌정형 기획</li>
                      <li>대법원 판례 및 유튜브 공정 이용(Fair Use) 가이드라인 준수</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Export & Video Renderer Toolbar */}
      {currentProject && (
        <div className="p-3 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center space-x-2">
            {/* Primary Video Render Button */}
            <button
              onClick={() => onOpenVideoRenderer(getUpdatedProject())}
              className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-rose-500 via-indigo-600 to-indigo-700 hover:from-rose-600 hover:to-indigo-800 text-white font-black text-xs rounded-xl transition shadow-md shadow-indigo-500/20"
            >
              <Video className="w-4 h-4" />
              <span>🎬 1080p/720p 쇼츠 영상 변환 & 저장</span>
            </button>

            {onOpenViralStudio && (
              <button
                onClick={() => onOpenViralStudio(selectedFigure?.name || currentProject.figureName)}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-black text-xs rounded-xl transition shadow-sm cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span>🔥 SNS 떡상 에셋(캐러셀·썸네일) 제작</span>
              </button>
            )}

            <button
              onClick={() => handleCopy(generateCapCutVrewFormat(), 'capcut-bar')}
              className="flex items-center space-x-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition"
            >
              {copiedKey === 'capcut-bar' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>CapCut / Vrew 복사</span>
            </button>

            <button
              onClick={handleDownloadTxt}
              className="flex items-center space-x-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>대본 TXT</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                const updated = getUpdatedProject();
                onSaveProject({ ...updated, isSaved: true });
                handleCopy('', 'saved-project');
              }}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition shadow-sm"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{copiedKey === 'saved-project' ? '저장 완료!' : '보관함에 저장'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
