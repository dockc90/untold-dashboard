import React from 'react';
import { FolderHeart, Trash2, ArrowUpRight, Copy, Check, Clock, Film, Cloud, Database } from 'lucide-react';
import { ShortsProject } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';

interface SavedProjectsViewProps {
  projects: ShortsProject[];
  onOpenProject: (project: ShortsProject) => void;
  onDeleteProject: (id: string) => void;
}

export const SavedProjectsView: React.FC<SavedProjectsViewProps> = ({
  projects,
  onOpenProject,
  onDeleteProject,
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full min-w-0 max-w-full space-y-6 text-slate-800">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200">
            <FolderHeart className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">내 쇼츠 프로젝트 보관함</h2>
            <p className="text-xs text-slate-500 font-medium">
              제작 완료되거나 저장된 Untold 화제의 인물 쇼츠 대본 아카이브입니다.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {isSupabaseConfigured() ? (
            <span className="hidden sm:inline-flex items-center space-x-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
              <Cloud className="w-3.5 h-3.5 text-emerald-600" />
              <span>Supabase Cloud 실시간 연동</span>
            </span>
          ) : (
            <span className="hidden sm:inline-flex items-center space-x-1.5 text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              <Database className="w-3.5 h-3.5 text-slate-500" />
              <span>로컬 스토리지 보관</span>
            </span>
          )}
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            총 {projects.length}개 보관됨
          </span>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="py-20 text-center space-y-3 bg-white rounded-3xl border border-slate-200 shadow-2xs">
          <Film className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-extrabold text-slate-700">보관된 프로젝트가 없습니다.</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
            제작 스튜디오에서 대본을 생성한 후 [프로젝트 보관함에 저장]을 누르면 여기에 안전하게 보관됩니다.
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
                      {proj.titles[0] || '쇼츠 대본'}
                    </p>
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {proj.targetDuration}초 ({proj.scenes.length}씬)
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-200 font-medium">
                  {proj.fullScript}
                </p>

                <div className="flex items-center space-x-1 text-[11px] text-slate-500 font-medium">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>생성일: {new Date(proj.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  onClick={() => onDeleteProject(proj.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition"
                  title="삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCopy(proj.fullScript, proj.id)}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-xl transition"
                  >
                    {copiedId === proj.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>대본 복사</span>
                  </button>

                  <button
                    onClick={() => onOpenProject(proj)}
                    className="flex items-center space-x-1 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-xs font-extrabold text-white rounded-xl transition shadow-sm"
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
