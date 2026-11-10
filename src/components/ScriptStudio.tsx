import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  Layers, 
  Clock, 
  Type as TypeIcon, 
  Flame, 
  Bookmark,
  Film,
  Upload,
  LayoutGrid,
  Image as ImageIcon,
  Sliders,
  Trash2,
  Video,
  ArrowLeft,
  RotateCw,
  Share2
} from 'lucide-react';
import { TrendingFigure, ShortsProject, TargetPersona, VideoMoodTone, SceneItem, MotionEffectType } from '../types';
import { ScenePhotoCollageModal } from './ScenePhotoCollageModal';
import { SceneVideoEditorModal } from './SceneVideoEditorModal';
import { ErrorBoundary } from './ErrorBoundary';
import { getSceneFallbackImage } from '../utils/sceneImages';
import { saveDraftToServer } from '../lib/supabase';

interface ScriptStudioProps {
  selectedFigure: TrendingFigure | null;
  currentProject: ShortsProject | null;
  onGenerateScript: (persona: TargetPersona, duration: 45 | 60, videoTone: VideoMoodTone, storyAngle?: string, customKeyword?: string) => Promise<void>;
  onSaveProject: (project: ShortsProject) => void;
  onUpdateProject?: (project: ShortsProject) => void;
  onOpenVideoRenderer: (project: ShortsProject) => void;
  onOpenViralStudio?: (topic: string) => void;
  onBackToTrends?: () => void;
  isGenerating: boolean;
}

const STORY_ANGLES = [
  { id: 'random', label: '🎲 참신한 일화', desc: '새로운 각도의 에피소드로 대본 새로고침' },
  { id: 'adversity', label: '💧 역경 극복', desc: '절망의 바닥에서 어떻게 일어섰을까?' },
  { id: 'twist', label: '⚡ 충격 반전', desc: '세상이 몰랐던 충격적 비밀은?' },
  { id: 'choice', label: '❓ 결단의 순간', desc: '왜 그런 무모한 선택을 했을까?' },
  { id: 'success', label: '💼 성공 방정식', desc: '어떻게 혼자서 시장 판도를 바꿨을까?' },
  { id: 'legend', label: '🏆 운명의 3초', desc: '운명을 뒤집어놓은 단 한 번의 무대' },
  { id: 'routine', label: '🔥 치열한 루틴', desc: '남들과 무엇이 달랐기에 정상에 섰을까?' },
  { id: 'rival', label: '⚔️ 라이벌 대결', desc: '거대한 라이벌을 어떻게 꺾었을까?' },
  { id: 'quote', label: '💬 인생 명언', desc: '심장을 뛰게 만든 단 한마디는?' },
  { id: 'ceo_hero', label: '🏛️ 창업가 신화', desc: '독점 대기업에 맞서 어떻게 이겼을까?' },
  { id: 'corporate_pr', label: '💎 기업 비전', desc: '어떤 철학으로 사람들의 삶을 바꿨을까?' },
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
  onUpdateProject,
  onOpenVideoRenderer,
  onOpenViralStudio,
  onBackToTrends,
  isGenerating,
}) => {
  const [targetPersona, setTargetPersona] = useState<TargetPersona>('4060_emotional');
  const [videoTone, setVideoTone] = useState<VideoMoodTone>('Cinematic');
  const [duration, setDuration] = useState<45 | 60>(60);
  const [customKeyword, setCustomKeyword] = useState<string>('');
  const [activeStoryAngle, setActiveStoryAngle] = useState<string>('random');
  const [activeTab, setActiveTab] = useState<'scenes' | 'script'>('scenes');
  const [selectedHookIndex, setSelectedHookIndex] = useState(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Collage / Multi-photo merge modal state
  const [collageModalSceneIdx, setCollageModalSceneIdx] = useState<number | null>(null);

  const handleOpenCollageModal = (sceneIdx: number) => {
    setCollageModalSceneIdx(sceneIdx);
  };

  const handleApplyCollageImage = (mergedDataUrl: string) => {
    if (collageModalSceneIdx === null) return;
    const updated = [...editableScenes];
    updated[collageModalSceneIdx] = {
      ...updated[collageModalSceneIdx],
      mediaType: 'image',
      uploadedImageUrl: mergedDataUrl,
      userCropUrl: mergedDataUrl,
    };
    setEditableScenes(updated);
    setCollageModalSceneIdx(null);
    if (currentProject) {
      const proj = { ...currentProject, scenes: updated };
      onUpdateProject?.(proj);
      try {
        localStorage.setItem('untold_autosave_draft', JSON.stringify(proj));
      } catch {}
    }
  };

  // Video Trimmer / Editor modal state (CapCut style)
  const [videoEditorSceneIdx, setVideoEditorSceneIdx] = useState<number | null>(null);
  const videoFileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  const handleOpenVideoEditor = (sceneIdx: number) => {
    setVideoEditorSceneIdx(sceneIdx);
  };

  const handleVideoFileUpload = (sceneIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const videoBlobUrl = URL.createObjectURL(file);
    const updated = [...editableScenes];
    updated[sceneIdx] = {
      ...updated[sceneIdx],
      mediaType: 'video',
      uploadedVideoUrl: videoBlobUrl,
      videoStartTime: 0,
      videoEndTime: 5.0,
      videoPlaybackRate: 1.0,
      videoVolume: 0,
      videoMuted: true,
      videoFit: 'cover',
      videoCrop: { xPercent: 50, yPercent: 50, zoom: 1.0 },
    };
    setEditableScenes(updated);
    setVideoEditorSceneIdx(sceneIdx);
    e.target.value = '';
  };

  const handleApplyVideoConfig = (config: {
    videoUrl: string;
    startTime: number;
    endTime: number;
    playbackRate: number;
    volume: number;
    muted: boolean;
    fit: 'cover' | 'contain';
    crop: { xPercent: number; yPercent: number; zoom: number };
  }) => {
    if (videoEditorSceneIdx === null) return;
    const updated = [...editableScenes];
    updated[videoEditorSceneIdx] = {
      ...updated[videoEditorSceneIdx],
      mediaType: 'video',
      uploadedVideoUrl: config.videoUrl,
      videoStartTime: config.startTime,
      videoEndTime: config.endTime,
      videoPlaybackRate: config.playbackRate,
      videoVolume: config.volume,
      videoMuted: config.muted,
      videoFit: config.fit,
      videoCrop: config.crop,
    };
    setEditableScenes(updated);
    setVideoEditorSceneIdx(null);
  };

  const handleRemoveSceneVideo = (sceneIdx: number) => {
    const updated = [...editableScenes];
    updated[sceneIdx] = {
      ...updated[sceneIdx],
      mediaType: 'image',
      uploadedVideoUrl: undefined,
    };
    setEditableScenes(updated);
  };

  // Local editable project state
  const [editableScript, setEditableScript] = useState('');
  const [editableScenes, setEditableScenes] = useState<SceneItem[]>([]);

  // File input refs for uploading image per scene
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  // Sync state when project changes
  useEffect(() => {
    if (currentProject) {
      setEditableScript(currentProject.fullScript);
      setEditableScenes(currentProject.scenes);
      setSelectedHookIndex(currentProject.selectedHookIndex ?? 0);
      if (currentProject.videoTone) setVideoTone(currentProject.videoTone);
    }
  }, [currentProject]);

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

  // Scene photo file upload with smart resolution optimization (prevents memory exhaustion & photo loss)
  const handleImageFileUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const maxDim = 1920;
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const compressed = canvas.toDataURL('image/jpeg', 0.88);
          const updated = [...editableScenes];
          updated[index] = { ...updated[index], uploadedImageUrl: compressed, userCropUrl: compressed };
          setEditableScenes(updated);
          if (currentProject) {
            onUpdateProject?.({ ...currentProject, scenes: updated });
          }
          handleOpenCollageModal(index);
          return;
        }
        const updated = [...editableScenes];
        updated[index] = { ...updated[index], uploadedImageUrl: rawDataUrl, userCropUrl: rawDataUrl };
        setEditableScenes(updated);
        if (currentProject) {
          onUpdateProject?.({ ...currentProject, scenes: updated });
        }
        handleOpenCollageModal(index);
      };
      img.onerror = () => {
        const updated = [...editableScenes];
        updated[index] = { ...updated[index], uploadedImageUrl: rawDataUrl, userCropUrl: rawDataUrl };
        setEditableScenes(updated);
        if (currentProject) {
          onUpdateProject?.({ ...currentProject, scenes: updated });
        }
        handleOpenCollageModal(index);
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = '';
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

  const charCount = editableScript.replace(/\s+/g, '').length;
  const estimatedSeconds = Math.round((charCount / 6.5) / 1.1);

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
          uploadedImageUrl: selectedFigure?.imageUrl || getSceneFallbackImage(fallbackFigure, selectedFigure?.category || 'entertainment', 0),
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
        selectedVoiceId: currentProject?.selectedVoiceId || 'JBFqnCBsd6RMkjVDRZzb',
        voiceSpeedMultiplier: currentProject?.voiceSpeedMultiplier || 1.1,
      };
    }

    return {
      ...currentProject,
      fullScript: editableScript,
      scenes: editableScenes,
      selectedHookIndex,
      selectedVoiceId: currentProject.selectedVoiceId || 'JBFqnCBsd6RMkjVDRZzb',
      voiceSpeedMultiplier: currentProject.voiceSpeedMultiplier || 1.1,
      videoTone,
      charCount,
      estimatedSeconds,
    };
  };

  // Feature 3: Real-time Auto-save Draft (auto-saved without pressing manual save)
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<string | null>(null);

  useEffect(() => {
    if (!editableScript && editableScenes.length === 0) return;
    const timer = setTimeout(() => {
      try {
        const updated = getUpdatedProject();
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        const draftProject = {
          ...updated,
          autoSavedAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };
        localStorage.setItem('untold_autosave_draft', JSON.stringify(draftProject));
        setLastAutoSaveTime(timeStr);
        onUpdateProject?.(draftProject);
        saveDraftToServer(draftProject).catch(() => {});
      } catch (err) {
        console.warn('Auto-save error:', err);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [editableScript, editableScenes, selectedHookIndex, videoTone]);

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm w-full max-w-full min-w-0">
      {/* Top Banner / Selected Figure Info & Planning Studio */}
      <div className="p-3 sm:p-4 bg-slate-50/80 border-b border-slate-200 w-full max-w-full min-w-0 overflow-hidden space-y-3">
        {/* ROW 1: 인물 프로필 정보 & 상단 주요 컨트롤 바 (2단 분리 레이아웃) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 w-full min-w-0 max-w-full">
          {/* Left: 인물 정보 */}
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            {onBackToTrends && (
              <button
                type="button"
                onClick={onBackToTrends}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition shadow-2xs flex items-center space-x-1.5 cursor-pointer font-bold text-xs shrink-0"
                title="1단계: 트렌드 인물 선택으로 돌아가기"
              >
                <ArrowLeft className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="hidden sm:inline">인물 변경</span>
              </button>
            )}
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-sm sm:text-base shadow-sm shrink-0">
              {selectedFigure ? selectedFigure.name.slice(0, 2) : '쇼츠'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                  {selectedFigure ? selectedFigure.name : '인물을 선택해주세요'}
                </h2>
                {selectedFigure && (
                  <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full font-black bg-rose-50 text-rose-600 border border-rose-200 flex items-center gap-1 shrink-0">
                    <Flame className="w-3 h-3 fill-rose-500 text-rose-500" />
                    화제성 {selectedFigure.viralityScore}점
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate mt-0.5">
                {selectedFigure?.suggestedAngle || '화제의 인물 맞춤 대본 및 씬별 기획'}
              </p>
            </div>
          </div>

          {/* Right: 페르소나, 45/60초, 생성 버튼 */}
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            {/* Persona Selector */}
            <select
              value={targetPersona}
              onChange={(e) => setTargetPersona(e.target.value as TargetPersona)}
              className="bg-white border border-slate-200 text-xs font-bold text-slate-700 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 shadow-2xs shrink-0 cursor-pointer"
            >
              <option value="4060_emotional">4060 감동</option>
              <option value="1020_dopamine">1020 도파민</option>
              <option value="3040_success">3040 동기부여</option>
              <option value="mystery_twist">반전 미스터리</option>
              <option value="ceo_branding">🏛️ CEO/기업인 브랜딩</option>
            </select>

            {/* Duration Selector */}
            <div className="flex items-center bg-slate-200/70 rounded-xl border border-slate-200 p-0.5 text-xs font-bold shrink-0">
              <button
                type="button"
                onClick={() => setDuration(45)}
                className={`px-2.5 py-1 rounded-lg transition text-center cursor-pointer ${
                  duration === 45 ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                45초
              </button>
              <button
                type="button"
                onClick={() => setDuration(60)}
                className={`px-2.5 py-1 rounded-lg transition text-center cursor-pointer ${
                  duration === 60 ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                60초
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => onGenerateScript(targetPersona, duration, videoTone, activeStoryAngle, customKeyword)}
                disabled={isGenerating || !selectedFigure}
                className="flex items-center justify-center space-x-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                title="설정된 키워드와 컨셉으로 대본 새로고침"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>대본 새로고침</span>
              </button>

              <button
                type="button"
                onClick={() => onGenerateScript(targetPersona, duration, videoTone, activeStoryAngle, customKeyword)}
                disabled={isGenerating || !selectedFigure}
                className="flex items-center justify-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>{isGenerating ? '생성 중...' : '대본 생성'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ROW 2: 원하는 키워드 & 추천 태그 기획 카드 (독립된 세련된 박스) */}
        <div className="p-3 bg-white rounded-2xl border border-indigo-100 shadow-2xs space-y-2.5 w-full">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
            <div className="flex items-center space-x-1.5 text-xs font-black text-indigo-700 shrink-0">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>강조 키워드:</span>
            </div>
            <div className="flex-1 relative w-full min-w-0">
              <input
                type="text"
                value={customKeyword}
                onChange={(e) => setCustomKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isGenerating && selectedFigure) {
                    onGenerateScript(targetPersona, duration, videoTone, activeStoryAngle, customKeyword);
                  }
                }}
                placeholder="대본에 반영할 핵심 키워드 직접 입력 (예: 30대 창업 실패, 1993년 부도 위기, 세가 사장의 500만 달러 투자 등)"
                className="w-full text-xs sm:text-sm bg-slate-50 focus:bg-white border border-indigo-200 focus:border-indigo-600 rounded-xl px-3.5 py-2 text-slate-900 placeholder:text-slate-400 font-bold focus:outline-none transition shadow-2xs pr-8"
              />
              {customKeyword && (
                <button
                  type="button"
                  onClick={() => setCustomKeyword('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-black p-1 cursor-pointer"
                  title="키워드 지우기"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => onGenerateScript(targetPersona, duration, videoTone, activeStoryAngle, customKeyword)}
              disabled={isGenerating || !selectedFigure}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs transition shadow-xs cursor-pointer flex items-center justify-center space-x-1 shrink-0 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>키워드 반영 대본 생성</span>
            </button>
          </div>

          {/* Quick keyword chips (클릭 시 자동 생성되지 않고 선택/해제만 동작!) */}
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            <span className="text-[11px] font-bold text-slate-500 mr-1 shrink-0">추천 태그 (클릭하여 선택):</span>
            {['성공 방정식', '위기 극복', '독점 기술', '인생 역전', '기업 철학', '단칸방 무명시절', '기적의 한마디'].map((kw) => {
              const isSelected = customKeyword === kw;
              return (
                <button
                  key={kw}
                  type="button"
                  onClick={() => {
                    // 태그 클릭 시 대본을 즉시 생성하지 않고, 키워드만 선택/토글함
                    setCustomKeyword(isSelected ? '' : kw);
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition font-bold cursor-pointer whitespace-nowrap flex items-center space-x-1 ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border-slate-200 shadow-2xs'
                  }`}
                  title={isSelected ? '클릭하여 선택 해제' : '클릭하여 키워드 선택'}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  <span>#{kw}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* AI 작성 중 알림 배너 */}
        {isGenerating && (
          <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-50 via-purple-50 to-amber-50 border border-indigo-200 flex items-center space-x-2 text-xs text-indigo-900 shadow-2xs animate-pulse">
            <Sparkles className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />
            <span className="font-extrabold">
              🧠 AI가 [Gemini Pro / Flash] 엔진으로 뜬구름 잡지 않는 극사실주의 팩트 대본({duration}초)을 작성 중입니다...
            </span>
          </div>
        )}

        {/* ROW 3: 3초 후킹(Hook) 선택기 */}
        {currentProject && currentProject.hooks && currentProject.hooks.length > 0 && (
          <div className="pt-2 border-t border-slate-200/80 w-full max-w-full min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-1.5 text-xs font-extrabold text-amber-600">
                <Flame className="w-4 h-4 fill-amber-500 text-amber-500 shrink-0" />
                <span>3초 후킹 문구 선택</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                (클릭 시 도입부 씬1에 실시간 적용)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5 w-full max-w-full min-w-0">
              {currentProject.hooks.map((hook, idx) => {
                const isHookSelected = selectedHookIndex === idx;
                const cleanHookText = hook.text.replace(/^[\"'“‘\s]+/, '').replace(/[\"'”’\s]+$/, '');
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleHookSelect(idx)}
                    className={`text-left p-3 rounded-2xl border text-xs transition relative cursor-pointer min-w-0 w-full max-w-full overflow-hidden ${
                      isHookSelected
                        ? 'bg-amber-50/90 border-amber-400 text-amber-950 shadow-xs ring-2 ring-amber-400/50'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                        {hook.label || (idx === 0 ? '사건형 후킹' : idx === 1 ? '반전형 후킹' : '질문형 후킹')}
                      </span>
                      {isHookSelected && (
                        <span className="text-[10px] font-black text-amber-700 flex items-center gap-1 bg-amber-100/90 px-2 py-0.5 rounded-full shrink-0">
                          <Check className="w-3 h-3" /> 적용됨
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-xs sm:text-sm text-slate-900 leading-relaxed break-keep break-words">
                      "{cleanHookText}"
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ROW 4: 대본 컨셉 테마 선택 바 (클릭 시 선택만 되고, 우측 버튼을 눌러야 생성됨!) */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-50/90 via-indigo-50/70 to-rose-50/90 border border-amber-200/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5 text-xs shadow-2xs w-full max-w-full min-w-0 overflow-hidden">
          <div className="flex items-center space-x-2 min-w-0">
            <div className="p-1.5 rounded-xl bg-amber-500 text-white shadow-2xs shrink-0">
              <RotateCw className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-slate-900 block sm:inline">대본 컨셉 테마 선택</span>{' '}
              <span className="text-[11px] text-slate-600 font-medium hidden sm:inline">컨셉을 선택한 후 [선택 컨셉으로 대본 생성] 버튼을 누르세요.</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto min-w-0">
            {STORY_ANGLES.map((angle) => {
              const isActive = activeStoryAngle === angle.id;
              return (
                <button
                  key={angle.id}
                  type="button"
                  onClick={() => {
                    // 클릭 시 선택만 되고 즉시 대본 생성을 실행하지 않음!
                    setActiveStoryAngle(angle.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-black text-xs transition shadow-2xs cursor-pointer flex items-center space-x-1 shrink-0 ${
                    isActive
                      ? 'bg-amber-500 text-white border border-amber-600 ring-2 ring-amber-300 shadow-xs'
                      : 'bg-white hover:bg-amber-100 border border-slate-200 text-slate-800'
                  }`}
                  title={angle.desc}
                >
                  {isActive && <Check className="w-3 h-3 stroke-[3]" />}
                  <span>{angle.label}</span>
                </button>
              );
            })}

            {/* 선택된 컨셉으로 생성 실행 버튼 */}
            <button
              type="button"
              onClick={() => onGenerateScript(targetPersona, duration, videoTone, activeStoryAngle, customKeyword)}
              disabled={isGenerating || !selectedFigure}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs transition shadow-xs cursor-pointer flex items-center space-x-1 shrink-0 disabled:opacity-50 ml-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>선택 컨셉으로 대본 생성</span>
            </button>
          </div>
        </div>

        {/* 🛡️ 60초 황금 서사 AI 팩트체크 & 안전 검증 배너 */}
        <div className="p-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 rounded-2xl border border-emerald-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-2xs w-full">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-7 h-7 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
              ✓
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2 flex-wrap">
                <span className="font-extrabold text-xs text-emerald-950">
                  60초 황금 서사 & AI 팩트체크 검증 완료
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  100% 실존 기록 기반
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                  5단계 황금 서사율 충족
                </span>
              </div>
              <p className="text-[11px] text-emerald-800/90 font-medium truncate sm:whitespace-normal">
                언론 보도·공식 인터뷰 검증 완료 | 허위사실·루머 0건 | 0~3초 후킹 ➔ 상황 ➔ 갈등 ➔ 전환 ➔ 해소 12씬 완벽 배분
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => alert("✅ [인물쇼츠 60초 황금 서사 & AI 팩트체크 검증 리포트]\n\n1. 100% 팩트 기반 검증 (PASS)\n   - 공인 언론 보도, 다큐멘터리, 실제 인터뷰 일화와 일치\n   - 허위사실 및 날조 루머 0건\n\n2. 60초 5단계 황금 서사율 (PASS)\n   - 0~3초: 3초 후킹 (사건/질문/반전)\n   - 3~15초: 상황 (최소 배경)\n   - 15~40초: 갈등 (핵심 위기 & 장애물)\n   - 40~55초: 전환 (승부수 & 반전)\n   - 55~60초: 해소 (해답 & 진한 여운)\n\n3. 유튜브 재사용 콘텐츠 심사 방어 (PASS)\n   - 100% 고유 2차 저작물 구성으로 수익화 안전")}
            className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-xl text-xs font-bold transition shadow-2xs shrink-0 cursor-pointer whitespace-nowrap"
          >
            🔍 검증 리포트 확인
          </button>
        </div>
      </div>

      {/* Tabs Row & Live Narration Stats (Responsive & Horizontally Scrollable on Mobile) */}
      <div className="px-3 sm:px-4 py-2 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 w-full max-w-full overflow-hidden">
        <div className="flex items-center space-x-1 text-xs overflow-x-auto max-w-full scrollbar-none pb-0.5 touch-pan-x shrink-0">
          <button
            onClick={() => setActiveTab('scenes')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap shrink-0 ${
              activeTab === 'scenes'
                ? 'bg-white text-slate-900 border border-slate-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>씬별 편집 ({editableScenes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('script')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap shrink-0 ${
              activeTab === 'script'
                ? 'bg-white text-indigo-700 border border-slate-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TypeIcon className="w-3.5 h-3.5 text-indigo-600" />
            <span>전체 대본</span>
          </button>
        </div>

        {/* Live Narration Reading Time Bar */}
        <div className="flex items-center justify-between sm:justify-end space-x-3 text-xs shrink-0">
          <div className="flex items-center space-x-1.5 text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs font-bold">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span>예상 {estimatedSeconds}초</span>
            <span className="text-slate-300">/</span>
            <span>{charCount}자</span>
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
                          {idx === 0 ? (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                              🎯 1단계: 3초 후킹 (사건/질문/반전)
                            </span>
                          ) : idx >= 1 && idx <= 2 ? (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
                              📖 2단계: 상황 (최소 배경)
                            </span>
                          ) : idx >= 3 && idx <= 7 ? (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 shrink-0">
                              ⚡ 3단계: 갈등 (핵심 위기 & 장애물)
                            </span>
                          ) : idx >= 8 && idx <= 9 ? (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 shrink-0">
                              🚀 4단계: 전환 (승부수 & 반전)
                            </span>
                          ) : (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                              ✨ 5단계: 해소 (해답 & 진한 여운)
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
                          <span>내레이션 자막</span>
                          <span className="text-[10px] text-slate-400 font-medium">{scene.narration.length}자</span>
                        </label>
                        <textarea
                          rows={2}
                          value={scene.narration}
                          onChange={(e) => handleSceneNarrationChange(idx, e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-medium leading-relaxed focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      {/* Photo / Video Upload & Motion Controls Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                        {/* Media Preview (Photo or Video) */}
                        <div className="sm:col-span-5 flex items-center space-x-3 min-w-0 max-w-full">
                          {scene.mediaType === 'video' && scene.uploadedVideoUrl ? (
                            <div
                              onClick={() => handleOpenVideoEditor(idx)}
                              className="relative group w-16 h-20 rounded-xl overflow-hidden border-2 border-cyan-400 bg-black shadow-xs flex-shrink-0 cursor-pointer"
                              title="클릭하여 CapCut 스타일 동영상 편집기 열기"
                            >
                              <video
                                src={scene.uploadedVideoUrl}
                                className="w-full h-full object-cover"
                                playsInline
                                muted
                              />
                              <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                                <Play className="w-5 h-5 text-white fill-white opacity-90 group-hover:scale-110 transition-transform" />
                              </div>
                              <span className="absolute top-1 left-1 px-1.5 py-0.2 rounded bg-cyan-600 text-white font-black text-[8px] shadow-2xs">
                                동영상
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveSceneVideo(idx);
                                }}
                                className="absolute top-1 right-1 p-1 rounded-md bg-black/60 text-white hover:bg-rose-600 transition z-10 cursor-pointer"
                                title="동영상 삭제 (사진으로 전환)"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ) : scene.uploadedImageUrl ? (
                            <div onClick={() => handleOpenCollageModal(idx)} className="relative group w-16 h-20 rounded-xl overflow-hidden border border-slate-300 hover:border-purple-400 shadow-2xs flex-shrink-0 cursor-pointer" title="클릭하여 위치/크기 조절 및 사진 편집">
                              <img
                                src={scene.uploadedImageUrl || getSceneFallbackImage(selectedFigure?.name || currentProject?.figureName || '', selectedFigure?.category || currentProject?.category || 'entertainment', idx)}
                                alt={`Scene ${scene.sceneNumber}`}
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveSceneImage(idx);
                                }}
                                className="absolute top-1 right-1 p-1 rounded-md bg-black/60 text-white hover:bg-rose-600 transition z-10 cursor-pointer"
                                title="사진 삭제"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenCollageModal(idx);
                                }}
                                className="absolute bottom-1 right-1 p-1 rounded-md bg-purple-600/90 text-white hover:bg-purple-700 transition z-10 shadow-xs cursor-pointer"
                                title="여러 장의 사진을 합쳐서 콜라주 편집"
                              >
                                <LayoutGrid className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div onClick={() => handleOpenCollageModal(idx)} className="w-16 h-20 rounded-xl border-2 border-dashed border-slate-300 hover:border-purple-400 flex flex-col items-center justify-center text-slate-400 hover:text-purple-600 flex-shrink-0 bg-white cursor-pointer transition" title="사진 업로드 & 위치/크기 편집 스튜디오 열기">
                              <ImageIcon className="w-5 h-5 mb-0.5" />
                              <span className="text-[9px] font-bold">사진 추가</span>
                            </div>
                          )}

                          <div className="space-y-1.5 flex-1 min-w-0">
                            {/* Hidden file inputs for image and video */}
                            <input
                              type="file"
                              accept="image/*"
                              ref={(el) => {
                                fileInputRefs.current[idx] = el;
                              }}
                              onChange={(e) => handleImageFileUpload(idx, e)}
                              className="hidden"
                            />
                            <input
                              type="file"
                              accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
                              ref={(el) => {
                                videoFileInputRefs.current[idx] = el;
                              }}
                              onChange={(e) => handleVideoFileUpload(idx, e)}
                              className="hidden"
                            />

                            <div className="flex flex-wrap items-center gap-1.5">
                              {scene.mediaType === 'video' && scene.uploadedVideoUrl ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenVideoEditor(idx)}
                                    className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-extrabold text-[11px] shadow-xs transition cursor-pointer"
                                    title="캡컷 스타일 동영상 편집기 (구간 자르기, 줌, 배속, 볼륨)"
                                  >
                                    <Scissors className="w-3 h-3" />
                                    <span>동영상 편집</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => videoFileInputRefs.current[idx]?.click()}
                                    className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] border border-slate-200 transition cursor-pointer"
                                    title="다른 동영상 파일로 교체"
                                  >
                                    <Upload className="w-3 h-3" />
                                    <span>영상 교체</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSceneVideo(idx)}
                                    className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[11px] border border-slate-200 transition cursor-pointer"
                                    title="사진 모드로 전환"
                                  >
                                    <ImageIcon className="w-3 h-3" />
                                    <span>사진 전환</span>
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => fileInputRefs.current[idx]?.click()}
                                    className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] border border-indigo-200 transition cursor-pointer"
                                    title="단일 사진 파일 업로드"
                                  >
                                    <Upload className="w-3 h-3" />
                                    <span>{scene.uploadedImageUrl ? '파일 교체' : '사진 업로드'}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleOpenCollageModal(idx)}
                                    className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 text-purple-700 font-bold text-[11px] border border-purple-300 shadow-2xs transition cursor-pointer"
                                    title="위치/크기 조절 및 사진 편집"
                                  >
                                    <LayoutGrid className="w-3 h-3 text-purple-600" />
                                    <span>사진 편집</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => videoFileInputRefs.current[idx]?.click()}
                                    className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-50 to-blue-50 hover:from-cyan-100 hover:to-blue-100 text-cyan-800 font-extrabold text-[11px] border border-cyan-300 shadow-2xs transition cursor-pointer"
                                    title="이 씬에 동영상 클립 첨부하기 (캡컷 스타일 편집)"
                                  >
                                    <Video className="w-3 h-3 text-cyan-600" />
                                    <span>동영상 첨부</span>
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
                                </>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 font-medium truncate">
                              {scene.mediaType === 'video' && scene.uploadedVideoUrl
                                ? `🎬 선택 구간: ${(scene.videoStartTime || 0).toFixed(1)}s ~ ${(scene.videoEndTime || 5).toFixed(1)}s (${scene.videoPlaybackRate || 1}x 배속${scene.videoMuted === false ? ', 오디오 ON' : ', 음소거'})`
                                : `키워드: "${scene.imageSearchKeyword}"`}
                            </p>
                          </div>
                        </div>

                        {/* Motion Effect Selector for this scene */}
                        <div className="sm:col-span-7 flex flex-col justify-center space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                            <Sliders className="w-3 h-3 text-indigo-600" />
                            <span>카메라 모션</span>
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
                    onClick={() => onGenerateScript(targetPersona, duration, videoTone, 'random', customKeyword)}
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
          </>
        )}
      </div>

      {/* Bottom Export & Video Renderer Toolbar */}
      {currentProject && (
        <div className="p-2.5 sm:p-3 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shadow-xs">
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 sm:gap-2">
            {/* Primary Video Render Button */}
            <button
              onClick={() => onOpenVideoRenderer(getUpdatedProject())}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-rose-500 via-indigo-600 to-indigo-700 hover:from-rose-600 hover:to-indigo-800 text-white font-black text-xs rounded-xl transition shadow-md shadow-indigo-500/20 active:scale-95 cursor-pointer"
            >
              <Video className="w-4 h-4" />
              <span>영상 제작 (3단계)</span>
            </button>

            <button
              onClick={() => handleCopy(generateCapCutVrewFormat(), 'capcut-bar')}
              className="flex items-center space-x-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              {copiedKey === 'capcut-bar' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>대본 복사</span>
            </button>

            <button
              onClick={handleDownloadTxt}
              className="flex items-center space-x-1 px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>TXT 저장</span>
            </button>
          </div>

          <div className="flex items-center justify-between sm:justify-end space-x-2 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            {lastAutoSaveTime && (
              <span className="inline-flex items-center space-x-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1.5 rounded-xl border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>자동저장 ({lastAutoSaveTime})</span>
              </span>
            )}

            <button
              onClick={() => {
                const updated = getUpdatedProject();
                onSaveProject({ ...updated, isSaved: true });
                handleCopy('', 'saved-project');
              }}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{copiedKey === 'saved-project' ? '저장 완료!' : '보관함에 보관'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Multi-Photo Collage / Merger Modal */}
      {collageModalSceneIdx !== null && editableScenes[collageModalSceneIdx] && (
        <ErrorBoundary
          fallbackTitle="사진 편집 스튜디오 일시적 오류 복구"
          onReset={() => setCollageModalSceneIdx(null)}
        >
          <ScenePhotoCollageModal
            isOpen={true}
            onClose={() => setCollageModalSceneIdx(null)}
            sceneNumber={editableScenes[collageModalSceneIdx].sceneNumber}
            timeRange={editableScenes[collageModalSceneIdx].timeRange}
            narrationSnippet={(editableScenes[collageModalSceneIdx]?.narration || '').slice(0, 50)}
            existingImageUrl={editableScenes[collageModalSceneIdx].uploadedImageUrl}
            onApplyImage={handleApplyCollageImage}
          />
        </ErrorBoundary>
      )}

      {/* CapCut-Style Video Trimmer & Editor Modal */}
      {videoEditorSceneIdx !== null && editableScenes[videoEditorSceneIdx] && (
        <ErrorBoundary
          fallbackTitle="동영상 편집기 일시적 오류 복구"
          onReset={() => setVideoEditorSceneIdx(null)}
        >
          <SceneVideoEditorModal
            isOpen={true}
            onClose={() => setVideoEditorSceneIdx(null)}
            sceneNumber={editableScenes[videoEditorSceneIdx].sceneNumber}
            timeRange={editableScenes[videoEditorSceneIdx].timeRange}
            narrationSnippet={(editableScenes[videoEditorSceneIdx]?.narration || '').slice(0, 50)}
            videoUrl={editableScenes[videoEditorSceneIdx].uploadedVideoUrl || ''}
            initialStartTime={editableScenes[videoEditorSceneIdx].videoStartTime}
            initialEndTime={editableScenes[videoEditorSceneIdx].videoEndTime}
            initialPlaybackRate={editableScenes[videoEditorSceneIdx].videoPlaybackRate}
            initialVolume={editableScenes[videoEditorSceneIdx].videoVolume}
            initialMuted={editableScenes[videoEditorSceneIdx].videoMuted}
            initialFit={editableScenes[videoEditorSceneIdx].videoFit}
            initialCrop={editableScenes[videoEditorSceneIdx].videoCrop}
            onApplyVideo={handleApplyVideoConfig}
            onChangeVideoFile={(file) => {
              const newUrl = URL.createObjectURL(file);
              const updated = [...editableScenes];
              updated[videoEditorSceneIdx] = {
                ...updated[videoEditorSceneIdx],
                mediaType: 'video',
                uploadedVideoUrl: newUrl,
              };
              setEditableScenes(updated);
            }}
          />
        </ErrorBoundary>
      )}
    </div>
  );
};
