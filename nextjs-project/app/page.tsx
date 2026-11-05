'use client';

import React, { useState } from 'react';
import { Sparkles, Flame, Film, ArrowRight, Check, ExternalLink, Layers } from 'lucide-react';

export default function HomePage() {
  const [figureName, setFigureName] = useState('안성재 셰프');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/shorts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ figureName, targetPersona: '4060_emotional' }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="max-w-5xl mx-auto p-6 sm:p-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center font-black text-white">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              AutoShorts <span className="text-xs px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">Next.js + Supabase</span>
            </h1>
            <p className="text-xs text-slate-400">화제의 인물 숏폼 자동 제작 파이프라인</p>
          </div>
        </div>
      </div>

      {/* Input Hero */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <h2 className="text-base font-bold text-white">원하는 화제 인물 쇼츠 기획</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={figureName}
            onChange={(e) => setFigureName(e.target.value)}
            placeholder="인물 이름 입력 (예: 안성재, 손흥민, 변우석...)"
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center justify-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-indigo-500/20 disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'AI 쇼츠 생성 중...' : '60초 쇼츠 생성'}</span>
          </button>
        </div>
      </div>

      {/* Generated Result */}
      {result && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
          <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            생성 완료: {figureName} 쇼츠 대본 & 씬 가이드
          </h3>

          {/* Hooks */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {result.hooks?.map((h: any, i: number) => (
              <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                <span className="font-bold text-indigo-400">{h.label}</span>
                <p className="text-slate-300 font-medium">"{h.text}"</p>
              </div>
            ))}
          </div>

          {/* Script */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-400">전체 나레이션 대본</span>
            <p className="text-xs text-slate-200 whitespace-pre-line leading-relaxed font-mono">
              {result.fullScript}
            </p>
          </div>

          {/* Scenes */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-400">3초 단위 씬별 에셋 가이드 ({result.scenes?.length}씬)</span>
            <div className="grid grid-cols-1 gap-2.5">
              {result.scenes?.map((s: any) => (
                <div key={s.sceneNumber} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-indigo-400 mr-2">Scene {s.sceneNumber} ({s.timeRange})</span>
                    <span className="text-slate-300">{s.narration}</span>
                  </div>
                  <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-300 font-semibold border border-amber-500/20">
                    🔍 {s.imageSearchKeyword}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
