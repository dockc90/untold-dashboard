/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header, AppTab } from './components/Header';
import { TrendRadar } from './components/TrendRadar';
import { ScriptStudio } from './components/ScriptStudio';
import { CpoExecutiveView } from './components/CpoExecutiveView';
import { DailyRoutineChecklist } from './components/DailyRoutineChecklist';
import { SavedProjectsView } from './components/SavedProjectsView';
import { ArchitectureView } from './components/ArchitectureView';
import { VideoRendererModal } from './components/VideoRendererModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ViralStudio } from './components/ViralStudio';
import { CarouselStudio } from './components/CarouselStudio';
import { INITIAL_TRENDING_FIGURES } from './data/initialTrends';
import { SAMPLE_PROJECT } from './data/sampleProject';
import { RAW_SUPABASE_SCHEMA } from './data/rawSqlSchema';
import { TrendingFigure, ShortsProject, CategoryType, TimeFilter, TargetPersona, VideoMoodTone, SourceChannel } from './types';
import { AlertCircle, X, Database, ArrowLeft, Flame, Sparkles } from 'lucide-react';
import { 
  fetchProjectsFromSupabase, 
  saveProjectToSupabase, 
  deleteProjectFromSupabase, 
  isSupabaseConfigured,
  fetchProjectsBySyncCode,
  fetchDraftFromServer
} from './lib/supabase';
import { generateClientFallbackScript } from './utils/fallbackGenerator';
import { getSceneFallbackImage } from './utils/sceneImages';

const STORAGE_KEY = 'autoshorts_saved_projects_v2';

export default function App() {
  const [currentTab, setCurrentTab] = useState<AppTab>('studio');
  const [studioStep, setStudioStep] = useState<'trends' | 'editor' | 'renderer'>('trends');
  const [figures, setFigures] = useState<TrendingFigure[]>(INITIAL_TRENDING_FIGURES);
  const [selectedFigure, setSelectedFigure] = useState<TrendingFigure | null>(INITIAL_TRENDING_FIGURES[0]);
  const [currentProject, setCurrentProject] = useState<ShortsProject | null>(SAMPLE_PROJECT);
  const [savedProjects, setSavedProjects] = useState<ShortsProject[]>([]);
  const [draftProject, setDraftProject] = useState<ShortsProject | null>(null);
  const [isLoadingTrends, setIsLoadingTrends] = useState<boolean>(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Video renderer modal state
  const [isVideoRendererOpen, setIsVideoRendererOpen] = useState(false);
  const [renderingProject, setRenderingProject] = useState<ShortsProject | null>(SAMPLE_PROJECT);
  const [viralTopic, setViralTopic] = useState<string>('손흥민');

  // Load saved projects on mount: LocalStorage cache + Supabase Cloud Database sync
  useEffect(() => {
    // 1. Immediate local cache retrieval
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSavedProjects(parsed);
        } else {
          setSavedProjects([SAMPLE_PROJECT]);
        }
      } else {
        setSavedProjects([SAMPLE_PROJECT]);
      }
    } catch (e) {
      console.warn('Local storage load warning:', e);
      setSavedProjects([SAMPLE_PROJECT]);
    }

    // 2. Draft retrieval (Auto-save)
    try {
      const localDraft = localStorage.getItem('untold_autosave_draft');
      if (localDraft) {
        const parsedDraft = JSON.parse(localDraft);
        if (parsedDraft && parsedDraft.fullScript) {
          setDraftProject(parsedDraft);
        }
      }
    } catch (e) {}

    fetchDraftFromServer().then((srvDraft) => {
      if (srvDraft && srvDraft.fullScript) {
        setDraftProject((prev) => {
          if (!prev) return srvDraft;
          const timeA = new Date(prev.autoSavedAt || 0).getTime();
          const timeB = new Date(srvDraft.autoSavedAt || 0).getTime();
          return timeB > timeA ? srvDraft : prev;
        });
      }
    }).catch(() => {});

    // 3. Background async sync with Supabase / Cloud Store
    fetchProjectsFromSupabase().then((cloudProjects) => {
      if (cloudProjects && cloudProjects.length > 0) {
        setSavedProjects((prev) => {
          const map = new Map<string, ShortsProject>();
          cloudProjects.forEach((p) => map.set(p.id, p));
          prev.forEach((p) => {
            if (!map.has(p.id)) map.set(p.id, p);
          });
          const merged = Array.from(map.values());
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          return merged;
        });
      }
    }).catch((err) => {
      console.warn('Supabase initial fetch failed, using local cache:', err);
    });

    // 4. Check for URL sync code parameter (?sync_code=123456) or persistently paired sync code
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlCode = params.get('sync_code');
      const savedCode = localStorage.getItem('untold_paired_sync_code');
      const activeCode = urlCode || savedCode;

      if (activeCode) {
        const cleanCode = activeCode.replace(/[^0-9]/g, '');
        if (cleanCode.length === 6) {
          if (urlCode) {
            localStorage.setItem('untold_paired_sync_code', cleanCode);
          }
          fetchProjectsBySyncCode(cleanCode).then((imported) => {
            if (imported && imported.length > 0) {
              handleImportProjects(imported);
            }
          }).catch(() => {});
        }
      }

      // Auto-sync on window focus (when switching between PC and Phone tabs)
      const onFocusSync = () => {
        const paired = localStorage.getItem('untold_paired_sync_code');
        if (paired) {
          fetchProjectsBySyncCode(paired).then((imported) => {
            if (imported && imported.length > 0) {
              handleImportProjects(imported);
            }
          }).catch(() => {});
        } else {
          handleSyncRefresh();
        }
      };
      window.addEventListener('focus', onFocusSync);
      return () => {
        window.removeEventListener('focus', onFocusSync);
      };
    }
  }, []);

  const handleSyncRefresh = async () => {
    try {
      // 1. If paired sync code exists, fetch from paired channel first
      if (typeof window !== 'undefined') {
        const paired = localStorage.getItem('untold_paired_sync_code');
        if (paired) {
          const clean = paired.replace(/[^0-9]/g, '');
          const imported = await fetchProjectsBySyncCode(clean);
          if (imported && imported.length > 0) {
            handleImportProjects(imported);
            return;
          }
        }
      }

      // 2. Fallback to Supabase cloud fetch
      const cloudProjects = await fetchProjectsFromSupabase();
      if (cloudProjects && cloudProjects.length > 0) {
        setSavedProjects((prev) => {
          const map = new Map<string, ShortsProject>();
          cloudProjects.forEach((p) => map.set(p.id, p));
          prev.forEach((p) => {
            if (!map.has(p.id)) map.set(p.id, p);
          });
          const merged = Array.from(map.values());
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          return merged;
        });
      }
    } catch (e) {
      console.warn('Sync refresh error:', e);
    }
  };

  const handleImportProjects = (imported: ShortsProject[]) => {
    setSavedProjects((prev) => {
      const map = new Map<string, ShortsProject>();
      imported.forEach((p) => map.set(p.id, { ...p, isSaved: true }));
      prev.forEach((p) => {
        if (!map.has(p.id)) map.set(p.id, p);
      });
      const merged = Array.from(map.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      imported.forEach((p) => saveProjectToSupabase(p).catch(() => {}));
      return merged;
    });
    setSuccessToast(`🎉 ${imported.length}개 프로젝트가 성공적으로 보관함에 연동되었습니다!`);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Save project helper (Syncs to both LocalStorage and Cloud Database)
  const handleSaveProject = async (project: ShortsProject) => {
    try {
      const nowIso = new Date().toISOString();
      const projectWithTime: ShortsProject = {
        ...project,
        createdAt: project.createdAt || nowIso,
        updatedAt: nowIso,
        isSaved: true,
      };

      const existingIdx = savedProjects.findIndex((p) => p.id === project.id);
      let updated: ShortsProject[];
      if (existingIdx >= 0) {
        updated = [...savedProjects];
        updated[existingIdx] = projectWithTime;
      } else {
        updated = [projectWithTime, ...savedProjects];
      }
      setSavedProjects(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      // Asynchronously sync to Cloud Database / Server Store
      const savedToDb = await saveProjectToSupabase(projectWithTime);
      if (savedToDb) {
        setSuccessToast(`☁️ 클라우드 보관함에 안전하게 자동 저장되었습니다!`);
        setTimeout(() => setSuccessToast(null), 3500);
      }
    } catch (e) {
      console.error('Save failed:', e);
    }
  };

  const handleDeleteProject = (id: string) => {
    const updated = savedProjects.filter((p) => p.id !== id);
    setSavedProjects(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    deleteProjectFromSupabase(id).catch(console.warn);
  };

  const handleOpenProject = (project: ShortsProject) => {
    setCurrentProject(project);
    const matchedFig = figures.find((f) => f.name === project.figureName);
    if (matchedFig) {
      setSelectedFigure(matchedFig);
    } else {
      setSelectedFigure({
        id: `fig-${Date.now()}`,
        name: project.figureName,
        title: project.titles[0] || '화제의 인물',
        category: project.category,
        viralityScore: 95,
        timeframe: '24h',
        buzzSummary: project.description,
        controversyOrIssue: '',
        suggestedAngle: '',
        tags: project.hashtags.map((h) => h.replace('#', '')),
      });
    }
    setCurrentTab('studio');
    setStudioStep('editor');
  };

  // Open Video Renderer: Transitions to Step 3 (페이지 넘김)
  const handleOpenVideoRenderer = (project: ShortsProject) => {
    setRenderingProject(project);
    setCurrentProject(project);
    setStudioStep('renderer');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // API Call: Refresh trends with Gemini from Naver, YouTube, Instagram
  const handleRefreshTrends = async (timeframe: TimeFilter, category: CategoryType, channel: SourceChannel = 'all') => {
    setIsLoadingTrends(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/gemini/trending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeframe, category, channel }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || '트렌드 데이터를 불러오는 중 오류가 발생했습니다.');
      }
      const newFigures: TrendingFigure[] = await res.json();
      if (Array.isArray(newFigures) && newFigures.length > 0) {
        const formatted = newFigures.map((item, idx) => ({
          ...item,
          id: item.id || `fig-gen-${Date.now()}-${idx}`,
          category: (item.category as CategoryType) || category,
          timeframe: (item.timeframe as TimeFilter) || timeframe,
        }));
        setFigures(formatted);
        setSelectedFigure(formatted[0]);
      }
    } catch (err: any) {
      console.error('Error refreshing trends:', err);
      setErrorMessage(err.message || 'AI 트렌드 갱신에 실패했습니다.');
    } finally {
      setIsLoadingTrends(false);
    }
  };

  // API Call: Analyze Custom Figure
  const handleAnalyzeCustomFigure = async (figureName: string, category: CategoryType) => {
    setErrorMessage(null);
    try {
      const res = await fetch('/api/gemini/analyze-figure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ figureName, category }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || '인물 분석 실패');
      }
      const data = await res.json();
      const newFig: TrendingFigure = {
        id: `fig-custom-${Date.now()}`,
        name: data.name || figureName,
        title: data.title || `${figureName}의 충격 비하인드`,
        category,
        viralityScore: data.viralityScore || 95,
        timeframe: '24h',
        buzzSummary: data.buzzSummary || '',
        controversyOrIssue: data.controversyOrIssue || '',
        suggestedAngle: data.suggestedAngle || '',
        tags: data.tags || ['쇼츠', '화제의인물'],
        isHot: true,
      };

      setFigures((prev) => [newFig, ...prev]);
      setSelectedFigure(newFig);
    } catch (err: any) {
      console.error('Error analyzing custom figure:', err);
      setErrorMessage(err.message || '인물 분석 중 오류가 발생했습니다.');
      throw err;
    }
  };

  const [refreshCounter, setRefreshCounter] = useState(0);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // API Call: Generate Complete Shorts Package (Supports Story Angles and Refresh)
  const handleGenerateScript = async (
    targetPersona: TargetPersona,
    duration: 45 | 60,
    videoTone: VideoMoodTone = 'Cinematic',
    storyAngle: string = 'random'
  ) => {
    if (!selectedFigure) return;
    setIsGeneratingScript(true);
    setErrorMessage(null);
    try {
      const nextCount = refreshCounter + 1;
      setRefreshCounter(nextCount);

      let data: any = null;
      try {
        const res = await fetch('/api/gemini/generate-shorts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            figureName: selectedFigure.name,
            title: selectedFigure.title,
            buzzSummary: selectedFigure.buzzSummary,
            controversyOrIssue: selectedFigure.controversyOrIssue,
            suggestedAngle: selectedFigure.suggestedAngle,
            targetPersona,
            targetDuration: duration,
            videoTone,
            storyAngle,
            refreshCounter: nextCount,
          }),
        });

        if (res.ok) {
          data = await res.json();
        }
      } catch (fetchErr) {
        console.warn('API call to /api/gemini/generate-shorts failed, using fallback:', fetchErr);
      }

      // If API was unavailable or returned empty data, use robust client fallback generator
      if (!data || !data.scenes || data.scenes.length === 0) {
        data = generateClientFallbackScript(selectedFigure.name, duration, nextCount, storyAngle);
      }
      const charCount = (data.fullScript || '').replace(/\s+/g, '').length;
      const estimatedSeconds = Math.round(charCount / 6.5);

      // Prepopulate default motion effects and image URLs from selectedFigure if present
      const rawScenes = data.scenes || [];
      const motions: ('zoom_in' | 'zoom_out' | 'pan_left' | 'pan_right' | 'pan_down')[] = [
        'zoom_in', 'pan_left', 'zoom_out', 'pan_right', 'pan_down'
      ];
      const scenesWithDefaults = rawScenes.map((s: any, i: number) => ({
        ...s,
        motionEffect: s.motionEffect || motions[i % motions.length],
        uploadedImageUrl: s.uploadedImageUrl || (i === 0 && selectedFigure.imageUrl ? selectedFigure.imageUrl : getSceneFallbackImage(selectedFigure.name, selectedFigure.category, i)),
      }));

      const newProject: ShortsProject = {
        id: `proj-${Date.now()}`,
        figureName: selectedFigure.name,
        category: selectedFigure.category,
        targetPersona,
        targetDuration: duration,
        videoTone,
        hooks: data.hooks || [],
        selectedHookIndex: 0,
        titles: data.titles || [],
        hashtags: data.hashtags || ['#shorts', `#${selectedFigure.name}`],
        description: data.description || '',
        pinnedComment: data.pinnedComment || '',
        fullScript: data.fullScript || '',
        scenes: scenesWithDefaults,
        copyrightDefenseNote: data.copyrightDefenseNote || '2차 저작물성 입증 완료',
        charCount,
        estimatedSeconds,
        createdAt: new Date().toISOString(),
        isSaved: false,
        selectedVoiceId: currentProject?.selectedVoiceId || 'voice-1',
        voiceSpeedMultiplier: currentProject?.voiceSpeedMultiplier || 1.1,
        photoAspectRatio: currentProject?.photoAspectRatio || '1:1',
        backdropStyle: currentProject?.backdropStyle || 'blur',
      };

      setCurrentProject(newProject);
      setRenderingProject(newProject);

      // Auto-save newly generated Untold Shorts project to Supabase Cloud & LocalStorage
      handleSaveProject(newProject);

      const angleLabel = 
        storyAngle === 'adversity' ? '역경 극복 감동 실화' :
        storyAngle === 'twist' ? '충격 반전 비하인드' :
        storyAngle === 'success' ? '성공 공식 & 명언' :
        storyAngle === 'legend' ? '전설의 결정적 명장면' : '새로운 스토리 앵글';

      setSuccessToast(`✨ [${angleLabel}] 쇼츠 대본 생성 및 Supabase DB 자동 저장 완료!`);
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err: any) {
      console.error('Error generating script:', err);
      setErrorMessage(err.message || '쇼츠 대본 생성에 실패했습니다.');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Global Reset to Home View (Step 1 Trending Radar)
  const handleResetToHome = () => {
    setCurrentTab('studio');
    setStudioStep('trends');
    setIsVideoRendererOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white w-full max-w-full overflow-x-hidden">
      {/* Global Header with Light Theme and HeyPapa Branding */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        savedCount={savedProjects.length}
        onResetToHome={handleResetToHome}
      />

      {/* Error notification banner */}
      {errorMessage && (
        <div className="bg-rose-50 border-b border-rose-200 text-rose-800 px-4 py-2 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Success / Refresh notification banner */}
      {successToast && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 text-xs font-black flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-300 flex-shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-emerald-100 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 flex flex-col min-w-0 max-w-full">
        {currentTab === 'studio' && (
          <div className="flex-1 flex flex-col min-h-0 w-full">
            {studioStep === 'trends' ? (
              <div className="flex-1 flex flex-col min-h-0 space-y-4 w-full">
                {/* Step 1 Top Guidance Banner */}
                <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-indigo-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 w-full">
                  <div className="space-y-1.5 w-full sm:w-auto">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black bg-rose-500 text-white shadow-2xs">
                        1단계
                      </span>
                      <span className="text-[11px] sm:text-xs font-bold text-indigo-200">빅데이터 화제의 인물 실시간 레이더</span>
                    </div>
                    <h2 className="text-base sm:text-xl font-black tracking-tight leading-snug">
                      쇼츠 또는 인스타 캐러셀로 제작할 인물을 선택하면 전용 스튜디오로 이동합니다
                    </h2>
                    <p className="text-[11px] sm:text-xs text-indigo-200/90 font-medium">
                      유튜브 쇼츠 100만 뷰 이상 급상승, 네이버 실시간 검색, 인스타 릴스 바이럴 지표 기반 인물을 클릭하세요.
                    </p>
                  </div>

                  <div className="flex items-center justify-center space-x-2 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl sm:rounded-2xl border border-white/15 text-[11px] sm:text-xs font-bold text-amber-300 w-full sm:w-auto shrink-0">
                    <span>인물 카드 선택</span>
                    <span>➔</span>
                    <span className="text-white">쇼츠 또는 캐러셀 제작</span>
                  </div>
                </div>

                {/* Full-width Trend Radar */}
                <div className="flex-1 min-h-[600px] flex flex-col w-full">
                  <TrendRadar
                    figures={figures}
                    selectedFigure={selectedFigure}
                    onSelectFigure={(fig) => {
                      setSelectedFigure(fig);
                      if (!currentProject || currentProject.figureName !== fig.name) {
                        const draftProj: ShortsProject = {
                          id: `proj-${Date.now()}`,
                          figureName: fig.name,
                          category: fig.category,
                          targetPersona: '4060_emotional',
                          targetDuration: 60,
                          videoTone: 'Cinematic',
                          hooks: [
                            {
                              type: 'question',
                              label: '질문형 후킹',
                              text: `여러분은 ${fig.name} 님이 가장 절망적이었던 순간을 어떻게 이겨냈는지 아십니까?`
                            },
                            {
                              type: 'provocative',
                              label: '도발/논란형 후킹',
                              text: `모두가 불가능하다고 손가락질했지만, ${fig.name} 님은 단 한마디 말도 없이 증명해냈습니다.`
                            },
                            {
                              type: 'emotional',
                              label: '감성/공감형 후킹',
                              text: `가장 밑바닥에 떨어졌던 그날 밤, ${fig.name} 님이 홀로 삼켰던 눈물의 의미.`
                            }
                          ],
                          selectedHookIndex: 0,
                          titles: [
                            `${fig.name}의 아무도 몰랐던 충격적인 인생 역전 실화 #shorts`,
                            `단 1분 만에 보는 ${fig.name}의 숨겨진 비하인드 스토리 #감동실화`,
                            `모두가 포기하라 했을 때 ${fig.name}이 보여준 기적 같은 반전 #동기부여`
                          ],
                          hashtags: ['#shorts', `#${fig.name}`, '#인생역전', '#비하인드'],
                          description: `${fig.name}의 비하인드 스토리와 역경 극복 드라마를 2차 창작으로 조명한 감동 숏폼입니다.`,
                          pinnedComment: `여러분도 포기하고 싶은 순간이 있으셨나요? ${fig.name} 님의 이야기를 보고 느낀 점을 댓글로 나눠주세요!`,
                          fullScript: `여러분은 ${fig.name} 님이 가장 밑바닥에 있던 순간을 아십니까?\n\n화려한 지금의 모습 뒤에는, 끝없는 거절과 차가운 냉대를 견뎌낸 10년의 긴 무명이 있었습니다.\n\n"너는 절대 안 된다"는 주변의 비수 같은 말들이 가슴을 후벼팠지만, 그는 결코 물러서지 않았습니다.\n\n남들이 모두 잠든 새벽, 차가운 연습실에서 하루 3시간만 자며 피나는 연습을 거듭했습니다.\n\n단돈 몇 푼이 없어 컵라면으로 끼니를 때우면서도, 가슴 속 꿈의 불꽃만은 꺼뜨리지 않았습니다.\n\n포기하고 싶어 무너져 내리던 날 밤, 낡은 가족사진을 보며 눈물을 훔치고 다시 일어섰습니다.\n\n기회는 예고 없이 찾아왔고, 그는 지난 10년간 갈고닦은 모든 것을 그 한 무대에 쏟아부었습니다.\n\n마침내 단 한 번의 무대로 대한민국 대중들의 시선을 단숨에 사로잡았습니다.\n\n모두가 불가능하다고 손가락질했던 그 청년이, 지금은 수많은 이들의 롤모델이 되었습니다.\n\n정상에 오른 지금도 그는 "그때의 눈물과 땀방울이 없었다면 오늘의 나는 없었다"고 고백합니다.\n\n진정한 승리는 결코 요행이나 우연으로 완성되지 않는다는 것을 그는 온몸으로 증명했습니다.\n\n오늘 홀로 버티고 있는 당신의 땀방울도 결코 헛되지 않을 것입니다. 당신의 꿈을 진심으로 응원합니다.`,
                          scenes: [
                            {
                              sceneNumber: 1,
                              timeRange: '00:00 - 00:05',
                              narration: `여러분은 ${fig.name} 님이 가장 밑바닥에 있던 순간을 아십니까?`,
                              visualGuide: `${fig.name}의 대표 사진 클로즈업과 임팩트 있는 타이틀`,
                              imageSearchKeyword: `${fig.name} 고화질`,
                              visualEffect: '슬로우 줌인 + 사운드 컷',
                              uploadedImageUrl: fig.imageUrl,
                              motionEffect: 'zoom_in'
                            },
                            {
                              sceneNumber: 2,
                              timeRange: '00:05 - 00:10',
                              narration: '화려한 지금의 모습 뒤에는, 끝없는 거절과 차가운 냉대를 견뎌낸 10년의 긴 무명이 있었습니다.',
                              visualGuide: '어두운 무명 시절 아카이브 흑백 사진과 묵묵한 연습',
                              imageSearchKeyword: `${fig.name} 과거 무명시절 흑백`,
                              visualEffect: '좌측 패닝',
                              motionEffect: 'pan_left'
                            },
                            {
                              sceneNumber: 3,
                              timeRange: '00:10 - 00:15',
                              narration: '"너는 절대 안 된다"는 주변의 비수 같은 말들이 가슴을 후벼팠지만, 그는 결코 물러서지 않았습니다.',
                              visualGuide: '시련과 편견에 맞서며 홀로 버티는 결연한 표정',
                              imageSearchKeyword: `${fig.name} 신인시절 인터뷰`,
                              visualEffect: '천천히 줌인',
                              motionEffect: 'zoom_in'
                            },
                            {
                              sceneNumber: 4,
                              timeRange: '00:15 - 00:20',
                              narration: '남들이 모두 잠든 새벽, 차가운 연습실에서 하루 3시간만 자며 피나는 연습을 거듭했습니다.',
                              visualGuide: '새벽 연습실의 땀방울과 악바리 같은 열정',
                              imageSearchKeyword: `${fig.name} 연습실 연습 열정`,
                              visualEffect: '우측 패닝',
                              motionEffect: 'pan_right'
                            },
                            {
                              sceneNumber: 5,
                              timeRange: '00:20 - 00:25',
                              narration: '단돈 몇 푼이 없어 컵라면으로 끼니를 때우면서도, 가슴 속 꿈의 불꽃만은 꺼뜨리지 않았습니다.',
                              visualGuide: '소박하고 눈물겨운 단칸방 시절의 흔적',
                              imageSearchKeyword: `${fig.name} 청년 시절 고생`,
                              visualEffect: '슬로우 줌아웃',
                              motionEffect: 'zoom_out'
                            },
                            {
                              sceneNumber: 6,
                              timeRange: '00:25 - 00:30',
                              narration: '포기하고 싶어 무너져 내리던 날 밤, 낡은 가족사진을 보며 눈물을 훔치고 다시 일어섰습니다.',
                              visualGuide: '가족에 대한 사랑과 눈물을 삼키는 아련한 표정',
                              imageSearchKeyword: `${fig.name} 가족 인터뷰 눈물`,
                              visualEffect: '따뜻한 비네팅 줌인',
                              motionEffect: 'zoom_in'
                            },
                            {
                              sceneNumber: 7,
                              timeRange: '00:30 - 00:35',
                              narration: '기회는 예고 없이 찾아왔고, 그는 지난 10년간 갈고닦은 모든 것을 그 한 무대에 쏟아부었습니다.',
                              visualGuide: '운명을 바꾼 단 한 번의 결정적 무대 순간',
                              imageSearchKeyword: `${fig.name} 데뷔 무대 레전드`,
                              visualEffect: '다이내믹 줌인',
                              motionEffect: 'zoom_in'
                            },
                            {
                              sceneNumber: 8,
                              timeRange: '00:35 - 00:40',
                              narration: '마침내 단 한 번의 무대로 대한민국 대중들의 시선을 단숨에 사로잡았습니다.',
                              visualGuide: '대중들의 폭발적인 환호와 찬사',
                              imageSearchKeyword: `${fig.name} 방송 출연 화제`,
                              visualEffect: '좌측 패닝',
                              motionEffect: 'pan_left'
                            },
                            {
                              sceneNumber: 9,
                              timeRange: '00:40 - 00:45',
                              narration: '모두가 불가능하다고 손가락질했던 그 청년이, 지금은 수많은 이들의 롤모델이 되었습니다.',
                              visualGuide: '시상식에서 당당히 트로피를 들어올리는 모습',
                              imageSearchKeyword: `${fig.name} 시상식 대상 수상 고화질`,
                              visualEffect: '화려한 줌아웃',
                              motionEffect: 'zoom_out'
                            },
                            {
                              sceneNumber: 10,
                              timeRange: '00:45 - 00:50',
                              narration: '정상에 오른 지금도 그는 "그때의 눈물과 땀방울이 없었다면 오늘의 나는 없었다"고 고백합니다.',
                              visualGuide: '겸손하고 진솔한 현재의 인터뷰 모습',
                              imageSearchKeyword: `${fig.name} 최근 인터뷰 미소`,
                              visualEffect: '천천히 줌인',
                              motionEffect: 'zoom_in'
                            },
                            {
                              sceneNumber: 11,
                              timeRange: '00:50 - 00:55',
                              narration: '진정한 승리는 결코 요행이나 우연으로 완성되지 않는다는 것을 그는 온몸으로 증명했습니다.',
                              visualGuide: '팬들의 열광과 벅찬 감동의 순간',
                              imageSearchKeyword: `${fig.name} 전성기 콘서트 무대`,
                              visualEffect: '우측 패닝',
                              motionEffect: 'pan_right'
                            },
                            {
                              sceneNumber: 12,
                              timeRange: '00:55 - 01:00',
                              narration: '오늘 홀로 버티고 있는 당신의 땀방울도 결코 헛되지 않을 것입니다. 당신의 꿈을 진심으로 응원합니다.',
                              visualGuide: '시청자에게 깊은 용기를 주는 따뜻한 미소와 구독 유도',
                              imageSearchKeyword: `${fig.name} 따뜻한 미소 클로즈업`,
                              visualEffect: '엔딩 페이드 아웃 + 구독 유도',
                              motionEffect: 'zoom_out'
                            }
                          ],
                          copyrightDefenseNote: '2차 저작물 공정 이용(Fair Use) 가이드라인 100% 준수',
                          charCount: 430,
                          estimatedSeconds: 60,
                          createdAt: new Date().toISOString(),
                          isSaved: false,
                          selectedVoiceId: 'voice-1',
                          voiceSpeedMultiplier: 1.1,
                          photoAspectRatio: '1:1',
                          backdropStyle: 'blur'
                        };
                        setCurrentProject(draftProj);
                        setRenderingProject(draftProj);
                      }
                      setStudioStep('editor');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    onSelectFigureForCarousel={(fig) => {
                      setSelectedFigure(fig);
                      setViralTopic(fig.name);
                      setCurrentTab('carousel');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    onRefreshTrends={handleRefreshTrends}
                    onAnalyzeCustomFigure={handleAnalyzeCustomFigure}
                    isLoading={isLoadingTrends}
                  />
                </div>
              </div>
            ) : studioStep === 'editor' ? (
              <div className="flex-1 flex flex-col min-h-0 space-y-4">
                {/* Step 2 Header Navigation Bar (Responsive on Mobile & Desktop) */}
                <div className="bg-white rounded-2xl border border-slate-200 p-2 sm:p-4 shadow-2xs flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-1.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => {
                        setStudioStep('trends');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="flex items-center space-x-1 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs transition border border-slate-200 cursor-pointer shadow-2xs shrink-0"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="hidden xs:inline">인물 재선택</span>
                      <span className="xs:hidden">인물 변경</span>
                    </button>

                    <div className="flex items-center space-x-1 min-w-0 overflow-hidden shrink">
                      <span className="text-[11px] sm:text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-1 rounded-xl border border-indigo-200 truncate">
                        {selectedFigure ? selectedFigure.name : '인물 미선택'}
                      </span>
                      {selectedFigure && (
                        <span className="text-[10px] sm:text-[11px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full border border-rose-200 flex items-center gap-0.5 shrink-0">
                          <Flame className="w-3 h-3 fill-rose-500 text-rose-500 shrink-0" />
                          <span>{selectedFigure.viralityScore}점</span>
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (currentProject) {
                          setRenderingProject(currentProject);
                          setStudioStep('renderer');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 via-indigo-600 to-indigo-700 hover:from-rose-600 hover:to-indigo-800 text-white font-black text-[11px] sm:text-xs shadow-xs shrink-0 flex items-center space-x-1 cursor-pointer"
                    >
                      <span>영상 제작</span>
                      <span>➔</span>
                    </button>
                  </div>

                  {/* Step Progress Indicators (Optimized for Mobile & Desktop) */}
                  <div className="flex items-center justify-between sm:justify-start space-x-1.5 sm:space-x-2 text-[11px] sm:text-xs font-bold text-slate-500 bg-slate-50 sm:bg-transparent p-1.5 sm:p-0 rounded-xl sm:rounded-none border border-slate-200 sm:border-0">
                    <button
                      type="button"
                      onClick={() => {
                        setStudioStep('trends');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-slate-500 hover:text-indigo-600 transition cursor-pointer"
                    >
                      <span className="sm:hidden">1. 인물</span>
                      <span className="hidden sm:inline">1단계: 인물 선택</span>
                    </button>
                    <span className="text-slate-300">➔</span>
                    <span className="text-indigo-600 font-black bg-indigo-50 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border border-indigo-200">
                      <span className="sm:hidden">2. 대본</span>
                      <span className="hidden sm:inline">2단계: 쇼츠 대본 스튜디오</span>
                    </span>
                    <span className="text-slate-300">➔</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (currentProject) {
                          setRenderingProject(currentProject);
                          setStudioStep('renderer');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      className="text-slate-500 hover:text-indigo-600 transition cursor-pointer"
                    >
                      <span className="sm:hidden">3. 영상</span>
                      <span className="hidden sm:inline">3단계: 영상 변환 & 저장</span>
                    </button>
                  </div>
                </div>

                {/* Full-width ScriptStudio */}
                <div className="flex-1 min-h-[720px] flex flex-col">
                  <ScriptStudio
                    selectedFigure={selectedFigure}
                    currentProject={currentProject}
                    onGenerateScript={handleGenerateScript}
                    onSaveProject={handleSaveProject}
                    onUpdateProject={(updated) => {
                      setCurrentProject(updated);
                      setDraftProject(updated);
                    }}
                    onOpenVideoRenderer={handleOpenVideoRenderer}
                    onOpenViralStudio={(topic) => {
                      setViralTopic(topic);
                      setCurrentTab('viral');
                    }}
                    onBackToTrends={() => setStudioStep('trends')}
                    isGenerating={isGeneratingScript}
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0 space-y-4">
                {/* Step 3: 쇼츠 영상 렌더링 & 변환 풀 페이지 */}
                <VideoRendererModal
                  isOpen={true}
                  isPageMode={true}
                  onClose={() => {
                    setStudioStep('editor');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onBackToEditor={() => {
                    setStudioStep('editor');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onBackToTrends={() => {
                    setStudioStep('trends');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  project={renderingProject || currentProject || SAMPLE_PROJECT}
                  onUpdateProject={(updated) => {
                    setCurrentProject(updated);
                    setRenderingProject(updated);
                  }}
                  onSaveProject={handleSaveProject}
                />
              </div>
            )}
          </div>
        )}

        {currentTab === 'carousel' && (
          <CarouselStudio
            initialTopic={selectedFigure?.name || currentProject?.figureName || viralTopic}
            initialCategory={selectedFigure?.category || 'entertainment'}
            initialScript={currentProject?.fullScript || (currentProject?.scenes ? currentProject.scenes.map(s => s.narration).join('\n') : '')}
            onBackToStudio={() => {
              setCurrentTab('studio');
              setStudioStep('trends');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentTab === 'viral' && (
          <ViralStudio
            initialTopic={selectedFigure?.name || currentProject?.figureName || viralTopic}
            initialCategory={selectedFigure?.category || 'entertainment'}
            initialScript={currentProject?.fullScript || (currentProject?.scenes ? currentProject.scenes.map(s => s.narration).join('\n') : '')}
            onBackToStudio={() => setCurrentTab('studio')}
          />
        )}

        {currentTab === 'todo' && <DailyRoutineChecklist />}
        {currentTab === 'roadmap' && <CpoExecutiveView />}

        {currentTab === 'architecture' && (
          <ArchitectureView
            sqlSchema={RAW_SUPABASE_SCHEMA}
            onBackToStudio={() => setCurrentTab('studio')}
          />
        )}

        {currentTab === 'saved' && (
          <SavedProjectsView
            projects={savedProjects}
            draftProject={draftProject}
            onOpenProject={handleOpenProject}
            onDeleteProject={handleDeleteProject}
            onSyncRefresh={handleSyncRefresh}
            onImportProjects={handleImportProjects}
          />
        )}
      </main>

      {/* Creator-Centric Footer pinned cleanly to the bottom */}
      <footer className="border-t border-slate-200/90 bg-white/95 backdrop-blur-md py-4 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 mt-auto shrink-0 w-full z-20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-slate-600">
            <span className="font-extrabold text-slate-900 tracking-tight">AutoShorts AI 2.0</span>
            <span>•</span>
            <span>화제의 인물 숏폼 초고속 제작 스튜디오</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
              2차 저작물성 100% 가이드 준수
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-slate-600">
            <button
              onClick={() => setCurrentTab('studio')}
              className={`hover:text-indigo-600 transition font-medium ${
                currentTab === 'studio' ? 'text-indigo-600 font-bold' : ''
              }`}
            >
              제작 스튜디오
            </button>
            <span className="text-slate-300">·</span>
            <button
              onClick={() => setCurrentTab('carousel')}
              className={`hover:text-rose-600 transition font-medium ${
                currentTab === 'carousel' ? 'text-rose-600 font-bold' : ''
              }`}
            >
              인스타 캐러셀
            </button>
            <span className="text-slate-300">·</span>
            <button
              onClick={() => setCurrentTab('viral')}
              className={`hover:text-amber-600 transition font-medium ${
                currentTab === 'viral' ? 'text-amber-600 font-bold' : ''
              }`}
            >
              썸네일 & 카피
            </button>
            <span className="text-slate-300">·</span>
            <button
              onClick={() => setCurrentTab('todo')}
              className={`hover:text-rose-600 transition font-medium ${
                currentTab === 'todo' ? 'text-rose-600 font-bold' : ''
              }`}
            >
              데일리 루틴 To-Do
            </button>
            <span className="text-slate-300">·</span>
            <button
              onClick={() => setCurrentTab('roadmap')}
              className={`hover:text-amber-600 transition font-medium ${
                currentTab === 'roadmap' ? 'text-amber-600 font-bold' : ''
              }`}
            >
              수익 전략 & 로드맵
            </button>
            <span className="text-slate-300">·</span>
            <button
              onClick={() => setCurrentTab('saved')}
              className={`hover:text-slate-900 transition font-medium ${
                currentTab === 'saved' ? 'text-slate-900 font-bold' : ''
              }`}
            >
              보관함
            </button>
            <span className="text-slate-300">|</span>
            {/* Secondary technical architecture button */}
            <button
              onClick={() => setCurrentTab('architecture')}
              className="flex items-center space-x-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 px-2.5 py-1 rounded-lg transition"
              title="Next.js & Supabase DB 아키텍처 명세서 (개발자/시스템 참조용)"
            >
              <Database className="w-3.5 h-3.5 text-slate-400" />
              <span>시스템 아키텍처 & DB</span>
            </button>
          </div>
        </div>
      </footer>

      {/* In-Browser Video Renderer Modal (1080p / 720p Shorts Generator) */}
      {renderingProject && (
        <ErrorBoundary fallbackTitle="비디오 렌더러 복구" onReset={() => setIsVideoRendererOpen(false)}>
          <VideoRendererModal
            isOpen={isVideoRendererOpen}
            onClose={() => setIsVideoRendererOpen(false)}
            project={renderingProject}
            onUpdateProject={(updated) => {
              setCurrentProject(updated);
              setRenderingProject(updated);
            }}
            onSaveProject={handleSaveProject}
          />
        </ErrorBoundary>
      )}
    </div>
  );
}
