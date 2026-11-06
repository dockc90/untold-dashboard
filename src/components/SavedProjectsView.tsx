import React, { useState, useRef } from 'react';
import { 
  FolderHeart, 
  Trash2, 
  ArrowUpRight, 
  Copy, 
  Check, 
  Clock, 
  Film, 
  Cloud, 
  Database,
  RefreshCw,
  Smartphone,
  Laptop,
  Download,
  Upload,
  Sparkles,
  Zap,
  X
} from 'lucide-react';
import { ShortsProject } from '../types';
import { 
  createSyncCodeOnServer, 
  fetchProjectsBySyncCode 
} from '../lib/supabase';

// Helper: Format date AND time with seconds (YYYY.MM.DD HH:mm:ss)
export const formatDateTime = (dateStr?: string | number | Date): string => {
  if (!dateStr) return '기록 없음';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${yyyy}.${mm}.${dd} ${hh}:${min}:${ss}`;
  } catch {
    return String(dateStr);
  }
};

interface SavedProjectsViewProps {
  projects: ShortsProject[];
  draftProject?: ShortsProject | null;
  onOpenProject: (project: ShortsProject) => void;
  onDeleteProject: (id: string) => void;
  onSyncRefresh?: () => Promise<void>;
  onImportProjects?: (imported: ShortsProject[]) => void;
}

export const SavedProjectsView: React.FC<SavedProjectsViewProps> = ({
  projects,
  draftProject,
  onOpenProject,
  onDeleteProject,
  onSyncRefresh,
  onImportProjects,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncPanelOpen, setIsSyncPanelOpen] = useState(false);
  const [generatedSyncCode, setGeneratedSyncCode] = useState<string | null>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [inputSyncCode, setInputSyncCode] = useState('');
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [pairedSyncCode, setPairedSyncCode] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('untold_paired_sync_code') : null;
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRefresh = async () => {
    if (!onSyncRefresh) return;
    setIsRefreshing(true);
    try {
      await onSyncRefresh();
      setSyncStatusMsg('✅ 최신 보관함 프로젝트와 실시간 동기화되었습니다!');
    } catch {
      setSyncStatusMsg('동기화 새로고침 중 오류가 발생했습니다.');
    } finally {
      setIsRefreshing(false);
      setTimeout(() => setSyncStatusMsg(null), 3000);
    }
  };

  // Generate 6-digit Sync Code to transfer Mobile -> PC or PC -> Mobile
  const handleGenerateSyncCode = async () => {
    setIsGeneratingCode(true);
    setSyncStatusMsg(null);
    try {
      const code = await createSyncCodeOnServer(projects);
      if (code) {
        const clean = code.replace(/[^0-9]/g, '');
        setGeneratedSyncCode(code);
        setPairedSyncCode(clean);
        localStorage.setItem('untold_paired_sync_code', clean);
        setSyncStatusMsg(`🔑 연동 채널 등록 완료: [ ${code} ] (이제 새로고침만 해도 바로 최신 내용이 자동 동기화됩니다!)`);
      } else {
        setSyncStatusMsg('동기화 코드 생성에 실패했습니다. 다시 시도해 주세요.');
      }
    } catch {
      setSyncStatusMsg('동기화 코드 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingCode(false);
    }
  };

  // Fetch projects from 6-digit Sync Code and permanently pair this device
  const handleApplySyncCode = async () => {
    const cleanCode = inputSyncCode.replace(/[^0-9]/g, '');
    if (cleanCode.length !== 6) {
      setSyncStatusMsg('⚠️ 6자리 숫자 코드를 정확히 입력해 주세요.');
      return;
    }

    setSyncStatusMsg('⏳ 동기화 코드 프로젝트 조회 및 기기 페어링 중...');
    try {
      const imported = await fetchProjectsBySyncCode(cleanCode);
      if (imported && imported.length > 0) {
        onImportProjects?.(imported);
        setPairedSyncCode(cleanCode);
        localStorage.setItem('untold_paired_sync_code', cleanCode);
        setSyncStatusMsg(`🎉 성공! [${cleanCode.slice(0, 3)}-${cleanCode.slice(3)}] 채널이 기기에 영구 연동되었습니다! (앞으로 새로고침만 해도 최신 내용이 자동 유지됩니다)`);
        setInputSyncCode('');
      } else {
        setSyncStatusMsg('❌ 해당 코드의 프로젝트를 찾을 수 없거나 만료되었습니다.');
      }
    } catch {
      setSyncStatusMsg('동기화 적용 중 오류가 발생했습니다.');
    }
    setTimeout(() => setSyncStatusMsg(null), 5000);
  };

  const handleUnpairSyncCode = () => {
    localStorage.removeItem('untold_paired_sync_code');
    setPairedSyncCode(null);
    setSyncStatusMsg('🔓 기기 연동이 해제되었습니다.');
    setTimeout(() => setSyncStatusMsg(null), 3000);
  };

  // Export full backup as JSON
  const handleExportJson = () => {
    const dataStr = JSON.stringify(projects, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Untold_Projects_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON backup
  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          onImportProjects?.(parsed);
          setSyncStatusMsg(`📂 백업 파일에서 ${parsed.length}개 프로젝트를 성공적으로 불러왔습니다!`);
        } else {
          setSyncStatusMsg('올바른 백업 파일 형식이 아닙니다.');
        }
      } catch {
        setSyncStatusMsg('파일 파싱 중 오류가 발생했습니다.');
      }
      setTimeout(() => setSyncStatusMsg(null), 4000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="w-full min-w-0 max-w-full space-y-6 text-slate-800">
      {/* Hidden file input for JSON import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImportJsonFile}
      />

      {/* Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200">
            <FolderHeart className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">쇼츠 프로젝트 보관함</h2>
            <p className="text-xs text-slate-500 font-medium">
              모바일과 PC 간 언제 어디서나 실시간 연동되는 Untold 클라우드 보관함입니다.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onSyncRefresh && (
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition active:scale-95 cursor-pointer"
              title="클라우드 실시간 동기화 새로고침"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>새로고침</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsSyncPanelOpen(!isSyncPanelOpen)}
            className={`flex items-center space-x-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition shadow-2xs cursor-pointer ${
              isSyncPanelOpen
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>↔</span>
            <Laptop className="w-3.5 h-3.5" />
            <span>모바일-PC 연동</span>
          </button>

          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
            총 {projects.length}개 보관
          </span>
        </div>
      </div>

      {/* Paired Sync Channel Persistent Badge */}
      {pairedSyncCode && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-300/80 rounded-2xl p-3 sm:p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-2xs">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-black text-slate-800">
                기기 간 자동 연동 중:
              </span>
              <span className="font-mono font-black text-sm text-indigo-700 bg-white px-2 py-0.5 rounded-lg border border-indigo-200">
                {pairedSyncCode.length === 6 ? `${pairedSyncCode.slice(0, 3)}-${pairedSyncCode.slice(3)}` : pairedSyncCode}
              </span>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                ⚡ 새로고침 시 바로 최신 동기화
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-2.5 py-1 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200 transition cursor-pointer flex items-center space-x-1"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>동기화</span>
            </button>
            <button
              type="button"
              onClick={handleUnpairSyncCode}
              className="px-2 py-1 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 font-bold text-xs transition cursor-pointer"
              title="연동 해제 시 개별 보관함으로 복귀합니다"
            >
              연동 해제
            </button>
          </div>
        </div>
      )}

      {/* Sync Status Banner */}
      {syncStatusMsg && (
        <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-bold flex items-center justify-between shadow-2xs animate-fadeIn">
          <span>{syncStatusMsg}</span>
          <button onClick={() => setSyncStatusMsg(null)} className="text-indigo-500 hover:text-indigo-800">✕</button>
        </div>
      )}

      {/* Mobile <-> PC Sync Panel */}
      {isSyncPanelOpen && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/70 border border-indigo-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2 min-w-0">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <h3 className="text-xs sm:text-sm font-black text-slate-900 truncate">모바일 ↔ PC 보관함 즉시 연동 도구</h3>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <span className="hidden md:inline-block text-[11px] font-bold text-indigo-600 bg-white px-2.5 py-0.5 rounded-full border border-indigo-200">
                클라우드 실시간 동기화
              </span>
              <button
                type="button"
                onClick={() => setIsSyncPanelOpen(false)}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-slate-200/80 hover:bg-rose-100 text-slate-700 hover:text-rose-600 font-black text-xs transition cursor-pointer active:scale-95 shadow-2xs"
                title="패널 닫기"
              >
                <X className="w-3.5 h-3.5 text-slate-600" />
                <span>닫기</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Box 1: Export / Generate Code */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                  <span>1. 모바일에서 PC로 보내기 (코드 발급)</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                현재 보관된 프로젝트들을 6자리 코드로 묶어 PC나 다른 기기에서 즉시 불러올 수 있습니다.
              </p>
              
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleGenerateSyncCode}
                  disabled={isGeneratingCode || projects.length === 0}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl transition shadow-xs cursor-pointer flex items-center space-x-1.5"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>{isGeneratingCode ? '생성 중...' : '🔑 6자리 연동 코드 발급'}</span>
                </button>

                {generatedSyncCode && (
                  <button
                    type="button"
                    onClick={() => handleCopy(generatedSyncCode, 'sync-code')}
                    className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-black rounded-xl transition cursor-pointer flex items-center space-x-1"
                  >
                    {copiedId === 'sync-code' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{generatedSyncCode} 복사</span>
                  </button>
                )}
              </div>
            </div>

            {/* Box 2: Import Code */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2.5 shadow-2xs">
              <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5 text-purple-600" />
                <span>2. PC에서 코드 입력하여 즉시 가져오기</span>
              </span>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                모바일에서 발급받은 6자리 숫자를 입력하면 보관함이 자동으로 통합됩니다.
              </p>

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  maxLength={7}
                  placeholder="예: 123-456"
                  value={inputSyncCode}
                  onChange={(e) => setInputSyncCode(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-black tracking-widest text-slate-900 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleApplySyncCode}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold rounded-xl transition shadow-xs cursor-pointer"
                >
                  가져오기
                </button>
              </div>
            </div>
          </div>

          {/* Backup / Restore JSON buttons */}
          <div className="flex flex-wrap items-center justify-between pt-2 border-t border-indigo-100 text-[11px] text-slate-500">
            <span>백업 파일(.json)을 직접 이동하여 영구 보관할 수도 있습니다:</span>
            <div className="flex items-center space-x-2 mt-1 sm:mt-0">
              <button
                type="button"
                onClick={handleExportJson}
                className="flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 transition"
              >
                <Download className="w-3 h-3 text-slate-500" />
                <span>JSON 백업 다운로드</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 transition"
              >
                <Upload className="w-3 h-3 text-slate-500" />
                <span>JSON 파일 불러오기</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-saved Temporary Draft Banner (Feature 3: Auto-save without manual save) */}
      {draftProject && draftProject.fullScript && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-500/10 border-2 border-amber-300 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-black text-slate-900">
                    ⚡ 현재 작업 중인 실시간 임시저장 프로젝트
                  </h3>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                    자동 저장됨
                  </span>
                </div>
                <p className="text-xs text-amber-900 font-bold mt-0.5">
                  [{draftProject.figureName}] {draftProject.titles?.[0] || '쇼츠 대본'} ({draftProject.scenes?.length || 0}씬)
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-amber-800 font-semibold flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                <span>임시저장 일시: {formatDateTime(draftProject.autoSavedAt || draftProject.updatedAt || draftProject.createdAt)}</span>
              </span>

              <button
                type="button"
                onClick={() => onOpenProject(draftProject)}
                className="flex items-center space-x-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-black rounded-xl shadow-md transition cursor-pointer active:scale-95"
              >
                <span>이어서 편집하기</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-700 font-medium line-clamp-2 bg-white/80 p-3 rounded-2xl border border-amber-200/80 leading-relaxed">
            {draftProject.fullScript}
          </p>
        </div>
      )}

      {/* Projects List */}
      {projects.length === 0 ? (
        <div className="py-20 text-center space-y-3 bg-white rounded-3xl border border-slate-200 shadow-2xs">
          <Film className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-extrabold text-slate-700">보관된 프로젝트가 없습니다.</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
            대본을 수정하거나 생성할 때 실시간으로 자동 임시 저장되며, [보관함에 보관]을 누르면 언제든지 영구 보관됩니다.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-slate-300 space-y-3.5 transition flex flex-col justify-between shadow-2xs hover:shadow-xs"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{proj.figureName}</h3>
                    <p className="text-xs text-indigo-700 font-bold line-clamp-1">
                      {proj.titles?.[0] || '쇼츠 프로젝트'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {(() => {
                      const photoCount = proj.scenes?.filter((s) => Boolean(s.uploadedImageUrl)).length || 0;
                      return photoCount > 0 ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                          📷 사진 {photoCount}장
                        </span>
                      ) : null;
                    })()}
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {proj.targetDuration}초 ({proj.scenes?.length || 0}씬)
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-200 font-medium">
                  {proj.fullScript}
                </p>

                {/* Date AND Time Record Display (YYYY.MM.DD HH:mm:ss) */}
                <div className="space-y-0.5 text-[11px] text-slate-500 font-medium pt-1">
                  <div className="flex items-center space-x-1.5 text-slate-700 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>생성일시: {formatDateTime(proj.createdAt)}</span>
                  </div>
                  {proj.updatedAt && proj.updatedAt !== proj.createdAt && (
                    <div className="text-[10px] text-slate-400 pl-5">
                      (최종수정: {formatDateTime(proj.updatedAt)})
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  onClick={() => onDeleteProject(proj.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition cursor-pointer"
                  title="삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCopy(proj.fullScript, proj.id)}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-xl transition cursor-pointer"
                  >
                    {copiedId === proj.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>대본 복사</span>
                  </button>

                  <button
                    onClick={() => onOpenProject(proj)}
                    className="flex items-center space-x-1 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-xs font-extrabold text-white rounded-xl transition shadow-sm cursor-pointer"
                  >
                    <span>열기</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
