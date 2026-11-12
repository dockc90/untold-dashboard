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

  const handleCopy = async (text: string, id: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.warn('Clipboard copy error:', e);
    }
  };

  const handleRefresh = async () => {
    if (!onSyncRefresh) return;
    setIsRefreshing(true);
    try {
      await onSyncRefresh();
      setSyncStatusMsg('✅ 최신 보관함 프로젝트와 실시간 동기화되었습니다!');
    } catch {
      setSyncStatusMsg('동기화 중 오류가 발생했습니다.');
    } finally {
      setIsRefreshing(false);
      setTimeout(() => setSyncStatusMsg(null), 3000);
    }
  };

  // Generate 6-digit Sync Code
  const handleGenerateSyncCode = async () => {
    setIsGeneratingCode(true);
    try {
      const code = await createSyncCodeOnServer(projects);
      setGeneratedSyncCode(code);
      setSyncStatusMsg(`🔑 연동 코드 [${code}]가 생성되었습니다. 다른 기기에서 입력하세요.`);
    } catch (err: any) {
      console.error(err);
      setSyncStatusMsg('연동 코드 생성 실패');
    } finally {
      setIsGeneratingCode(false);
      setTimeout(() => setSyncStatusMsg(null), 5000);
    }
  };

  // Apply Sync Code
  const handleApplySyncCode = async () => {
    if (!inputSyncCode.trim()) return;
    try {
      const fetched = await fetchProjectsBySyncCode(inputSyncCode.trim());
      if (fetched && fetched.length > 0) {
        onImportProjects?.(fetched);
        setPairedSyncCode(inputSyncCode.trim());
        if (typeof window !== 'undefined') {
          localStorage.setItem('untold_paired_sync_code', inputSyncCode.trim());
        }
        setSyncStatusMsg(`✨ [${inputSyncCode.trim()}] 연동 코드로 ${fetched.length}개의 프로젝트를 가져왔습니다!`);
        setInputSyncCode('');
      } else {
        setSyncStatusMsg('해당 연동 코드에 유효한 프로젝트가 없습니다.');
      }
    } catch (err) {
      setSyncStatusMsg('연동 코드 확인 중 오류가 발생했습니다.');
    } finally {
      setTimeout(() => setSyncStatusMsg(null), 4000);
    }
  };

  // Export JSON backup
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(projects, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `Untold_Projects_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(dataStr);
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
    <div className="w-full min-w-0 max-w-full space-y-6 text-[#37352F]">
      {/* Hidden file input for JSON import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImportJsonFile}
      />

      {/* Main Header: Notion Minimalist Style */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#EDEDEB] pb-4 gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#F1F1EF] border border-[#E3E2DE] text-[#37352F] flex items-center justify-center shrink-0">
            <FolderHeart className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#191919]">쇼츠 프로젝트 보관함</h2>
            <p className="text-xs text-[#787774] font-normal">
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
              className="flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-white hover:bg-[#F1F1EF] text-[#37352F] border border-[#E3E2DE] shadow-xs transition active:scale-95 cursor-pointer"
              title="클라우드 실시간 동기화 새로고침"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#787774] ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>새로고침</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsSyncPanelOpen(!isSyncPanelOpen)}
            className={`flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition shadow-xs cursor-pointer ${
              isSyncPanelOpen
                ? 'bg-[#23272A] text-white border-[#23272A]'
                : 'bg-[#F1F1EF] hover:bg-white text-[#37352F] border-[#E3E2DE]'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>↔</span>
            <Laptop className="w-3.5 h-3.5" />
            <span>모바일-PC 연동</span>
          </button>
        </div>
      </div>

      {/* Sync Status Toast */}
      {syncStatusMsg && (
        <div className="p-3 bg-[#23272A] text-white rounded-xl text-xs font-medium flex items-center justify-between shadow-xs animate-fadeIn">
          <span>{syncStatusMsg}</span>
          <button onClick={() => setSyncStatusMsg(null)} className="text-neutral-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Mobile-PC Sync Panel */}
      {isSyncPanelOpen && (
        <div className="p-5 rounded-2xl bg-white border border-[#E9E9E7] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-[#191919]">기기간 원클릭 실시간 동기화</h3>
            </div>
            {pairedSyncCode && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-semibold">
                페어링됨: {pairedSyncCode}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Box 1: Generate Code */}
            <div className="p-4 rounded-xl bg-[#FBFBFA] border border-[#EDEDEB] space-y-2.5">
              <span className="text-xs font-bold text-[#191919] flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                <span>1. 모바일에서 코드 생성</span>
              </span>
              <p className="text-[11px] text-[#787774] font-normal leading-relaxed">
                현재 기기의 보관함 프로젝트를 다른 기기로 전송할 수 있는 6자리 보안 연동 코드를 발급합니다.
              </p>
              <div className="flex items-center space-x-2 pt-1">
                <button
                  type="button"
                  onClick={handleGenerateSyncCode}
                  disabled={isGeneratingCode}
                  className="px-3.5 py-2 bg-[#23272A] hover:bg-[#111213] text-white text-xs font-semibold rounded-xl transition shadow-xs cursor-pointer flex items-center space-x-1.5"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>{isGeneratingCode ? '생성 중...' : '🔑 6자리 연동 코드 발급'}</span>
                </button>

                {generatedSyncCode && (
                  <button
                    type="button"
                    onClick={() => handleCopy(generatedSyncCode, 'sync-code')}
                    className="px-3 py-2 bg-white hover:bg-[#F1F1EF] text-[#37352F] border border-[#E3E2DE] text-xs font-semibold rounded-xl transition cursor-pointer flex items-center space-x-1"
                  >
                    {copiedId === 'sync-code' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{generatedSyncCode} 복사</span>
                  </button>
                )}
              </div>
            </div>

            {/* Box 2: Import Code */}
            <div className="p-4 rounded-xl bg-[#FBFBFA] border border-[#EDEDEB] space-y-2.5">
              <span className="text-xs font-bold text-[#191919] flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5 text-purple-600" />
                <span>2. PC에서 코드 입력하여 즉시 가져오기</span>
              </span>
              <p className="text-[11px] text-[#787774] font-normal leading-relaxed">
                모바일에서 발급받은 6자리 숫자를 입력하면 보관함이 자동으로 통합됩니다.
              </p>

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  maxLength={7}
                  placeholder="예: 123-456"
                  value={inputSyncCode}
                  onChange={(e) => setInputSyncCode(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-[#E3E2DE] rounded-xl text-xs font-bold tracking-widest text-[#37352F] focus:outline-none focus:border-[#23272A]"
                />
                <button
                  type="button"
                  onClick={handleApplySyncCode}
                  className="px-3.5 py-2 bg-[#23272A] hover:bg-[#111213] text-white text-xs font-semibold rounded-xl transition shadow-xs cursor-pointer"
                >
                  가져오기
                </button>
              </div>
            </div>
          </div>

          {/* Backup / Restore JSON buttons */}
          <div className="flex flex-wrap items-center justify-between pt-2 border-t border-[#EDEDEB] text-[11px] text-[#787774]">
            <span>백업 파일(.json)을 직접 이동하여 영구 보관할 수도 있습니다:</span>
            <div className="flex items-center space-x-2 mt-1 sm:mt-0">
              <button
                type="button"
                onClick={handleExportJson}
                className="flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-[#F1F1EF] border border-[#E3E2DE] rounded-lg font-medium text-[#37352F] transition"
              >
                <Download className="w-3 h-3 text-[#787774]" />
                <span>JSON 백업 다운로드</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-[#F1F1EF] border border-[#E3E2DE] rounded-lg font-medium text-[#37352F] transition"
              >
                <Upload className="w-3 h-3 text-[#787774]" />
                <span>JSON 파일 불러오기</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-saved Temporary Draft Banner */}
      {draftProject && draftProject.fullScript && (
        <div className="p-5 rounded-2xl bg-white border border-amber-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-amber-500/10 text-amber-700 border border-amber-200/60 rounded-xl shadow-2xs">
                <Zap className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-[#191919]">
                    현재 작업 중인 실시간 임시저장 프로젝트
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80">
                    자동 저장됨
                  </span>
                </div>
                <p className="text-xs text-[#787774] font-medium mt-0.5">
                  [{draftProject.figureName}] {draftProject.titles?.[0] || '쇼츠 대본'} ({draftProject.scenes?.length || 0}씬)
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-[#787774] font-medium flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-[#787774]" />
                <span>임시저장: {formatDateTime(draftProject.autoSavedAt || draftProject.updatedAt || draftProject.createdAt)}</span>
              </span>

              <button
                type="button"
                onClick={() => onOpenProject(draftProject)}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#23272A] hover:bg-[#111213] text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer active:scale-95"
              >
                <span>이어서 편집하기</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <p className="text-xs text-[#787774] font-normal line-clamp-2 bg-[#FBFBFA] p-3 rounded-xl border border-[#EDEDEB] leading-relaxed">
            {draftProject.fullScript}
          </p>
        </div>
      )}

      {/* Projects List */}
      {projects.length === 0 ? (
        <div className="py-20 text-center space-y-3 bg-white rounded-2xl border border-[#E9E9E7] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <Film className="w-10 h-10 text-[#D3D1CB] mx-auto" />
          <h3 className="text-base font-bold text-[#37352F]">보관된 프로젝트가 없습니다.</h3>
          <p className="text-xs text-[#787774] max-w-sm mx-auto font-normal">
            대본을 수정하거나 생성할 때 실시간으로 자동 임시 저장되며, [보관함에 보관]을 누르면 언제든지 영구 보관됩니다.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="p-5 rounded-2xl bg-white border border-[#E9E9E7] hover:border-[#D3D1CB] space-y-3.5 transition flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-xs"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-[#191919] text-base">{proj.figureName}</h3>
                    <p className="text-xs text-indigo-600 font-medium line-clamp-1">
                      {proj.titles?.[0] || '쇼츠 프로젝트'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {(() => {
                      const photoCount = proj.scenes?.filter((s) => Boolean(s.uploadedImageUrl)).length || 0;
                      return photoCount > 0 ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200/60">
                          📷 사진 {photoCount}장
                        </span>
                      ) : null;
                    })()}
                    <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#F1F1EF] text-[#37352F] border border-[#E3E2DE]">
                      {proj.targetDuration}초 ({proj.scenes?.length || 0}씬)
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[#787774] line-clamp-3 leading-relaxed bg-[#FBFBFA] p-3 rounded-xl border border-[#EDEDEB] font-normal">
                  {proj.fullScript}
                </p>

                {/* Date AND Time Record Display (YYYY.MM.DD HH:mm:ss) */}
                <div className="space-y-0.5 text-[11px] text-[#787774] font-normal pt-1">
                  <div className="flex items-center space-x-1.5 text-[#37352F] font-medium">
                    <Clock className="w-3.5 h-3.5 text-[#787774] shrink-0" />
                    <span>생성일시: {formatDateTime(proj.createdAt)}</span>
                  </div>
                  {proj.updatedAt && proj.updatedAt !== proj.createdAt && (
                    <div className="text-[10px] text-[#9B9A97] pl-5">
                      (최종수정: {formatDateTime(proj.updatedAt)})
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2.5 border-t border-[#EDEDEB]">
                <button
                  onClick={() => onDeleteProject(proj.id)}
                  className="p-1.5 text-[#9B9A97] hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                  title="삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCopy(proj.fullScript, proj.id)}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-[#F1F1EF] hover:bg-white border border-[#E3E2DE] text-xs font-medium text-[#37352F] rounded-xl transition cursor-pointer"
                  >
                    {copiedId === proj.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>대본 복사</span>
                  </button>

                  <button
                    onClick={() => onOpenProject(proj)}
                    className="flex items-center space-x-1 px-3.5 py-1.5 bg-[#23272A] hover:bg-[#111213] text-xs font-semibold text-white rounded-xl transition shadow-xs cursor-pointer"
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
