import React, { useState } from 'react';
import { 
  Database, 
  Terminal, 
  Layers, 
  Copy, 
  Check, 
  ExternalLink, 
  Globe, 
  Key,
  FileCode,
  ArrowLeft
} from 'lucide-react';

interface ArchitectureViewProps {
  sqlSchema: string;
  onBackToStudio?: () => void;
}

export const ArchitectureView: React.FC<ArchitectureViewProps> = ({ sqlSchema, onBackToStudio }) => {
  const [activeSubTab, setActiveSubTab] = useState<'supabase' | 'nextjs' | 'env'>('supabase');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const nextFiles: Record<string, string> = {
    'package.json': `{
  "name": "autoshorts-heypapa",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "@google/genai": "^2.25.0",
    "@supabase/supabase-js": "^2.48.1",
    "next": "^15.1.6",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "lucide-react": "^0.475.0"
  }
}`,
    'app/api/shorts/route.ts': `import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
});

export async function POST(req: Request) {
  const { figureName, targetPersona, duration } = await req.json();
  const prompt = \`Untold 화제의 인물 "\${figureName}" 60초 쇼츠 대본 및 3초 씬별 에셋 가이드 생성\`;
  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });
  return NextResponse.json(JSON.parse(response.text || '{}'));
}`,
    'lib/supabase.ts': `import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);`,
    'vercel.json': `{
  "framework": "nextjs",
  "buildCommand": "next build",
  "installCommand": "npm install"
}`
  };

  const [selectedNextFile, setSelectedNextFile] = useState<string>('package.json');

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-slate-800">
      {onBackToStudio && (
        <div>
          <button
            onClick={onBackToStudio}
            className="inline-flex items-center space-x-2 text-xs font-bold text-slate-700 hover:text-indigo-600 bg-white hover:bg-indigo-50/50 border border-slate-200 px-3.5 py-2 rounded-xl transition shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← 제작 스튜디오(메인)로 돌아가기</span>
          </button>
        </div>
      )}
      {/* Top Banner */}
      <div className="p-7 rounded-3xl bg-gradient-to-r from-indigo-50 via-white to-slate-50 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-100 text-indigo-800 border border-indigo-200">
              풀스택 아키텍처
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Supabase + Next.js + Vercel
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            Untold AutoShorts 엔지니어링 스펙 & 배포 패키지
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            CPO 보고 및 즉시 프로덕션 Vercel 배포가 가능한 PostgreSQL 스키마 및 Next.js App Router 코드입니다.
          </p>
        </div>

        {/* Sub Navigation */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs">
          <button
            onClick={() => setActiveSubTab('supabase')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl font-bold transition ${
              activeSubTab === 'supabase'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Supabase DB 스키마</span>
          </button>

          <button
            onClick={() => setActiveSubTab('nextjs')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl font-bold transition ${
              activeSubTab === 'nextjs'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Next.js & Vercel 코드</span>
          </button>

          <button
            onClick={() => setActiveSubTab('env')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl font-bold transition ${
              activeSubTab === 'env'
                ? 'bg-amber-500 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>배포 환경변수 가이드</span>
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: SUPABASE DB SCHEMA */}
      {activeSubTab === 'supabase' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between font-extrabold text-slate-900">
                <span className="flex items-center gap-1.5 text-indigo-700">
                  <Database className="w-4 h-4" />
                  profiles (사용자)
                </span>
                <span className="text-[10px] text-slate-400">Auth Users 연동</span>
              </div>
              <p className="text-slate-600 leading-relaxed font-medium">
                Supabase Auth 회원가입 시 자동 트리거되어 채널명, 구독 등급, 일일 생성량 쿼터를 관리합니다.
              </p>
              <div className="text-[11px] text-slate-500 font-mono">
                PK: id (UUID) | RLS: 본인만 수정
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between font-extrabold text-slate-900">
                <span className="flex items-center gap-1.5 text-amber-600">
                  <Database className="w-4 h-4" />
                  trending_figures (Untold)
                </span>
                <span className="text-[10px] text-slate-400">트렌드 레이더</span>
              </div>
              <p className="text-slate-600 leading-relaxed font-medium">
                24h/48h/7d 급상승 화제 인물, 화제성 점수(1~100), 2차 창작 스토리텔링 서사 앵글을 저장합니다.
              </p>
              <div className="text-[11px] text-slate-500 font-mono">
                Index: virality_score, timeframe
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between font-extrabold text-slate-900">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <Database className="w-4 h-4" />
                  shorts_projects (대본 & 씬)
                </span>
                <span className="text-[10px] text-slate-400">1:N 하위 릴레이션</span>
              </div>
              <p className="text-slate-600 leading-relaxed font-medium">
                프로젝트 본문과 1:N으로 연결된 hooks, scenes, metadata를 안전하게 보관 및 RLS로 격리합니다.
              </p>
              <div className="text-[11px] text-slate-500 font-mono">
                FK: user_id ➔ profiles.id (Cascade)
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs">
                <Terminal className="w-4 h-4 text-emerald-600" />
                <span className="font-extrabold text-slate-900">supabase/schema.sql</span>
                <span className="text-slate-500 font-medium">PostgreSQL DDL + RLS Policies</span>
              </div>
              <button
                onClick={() => handleCopy(sqlSchema, 'sql-schema')}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-2xs"
              >
                {copiedKey === 'sql-schema' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Supabase SQL 복사</span>
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-emerald-900 bg-slate-900 text-emerald-400 overflow-x-auto max-h-[520px] leading-relaxed rounded-b-3xl">
              {sqlSchema}
            </pre>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: NEXT.JS & VERCEL CODE */}
      {activeSubTab === 'nextjs' && (
        <div className="space-y-6">
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
            {Object.keys(nextFiles).map((fileName) => (
              <button
                key={fileName}
                onClick={() => setSelectedNextFile(fileName)}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl font-mono font-bold transition border ${
                  selectedNextFile === fileName
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>{fileName}</span>
              </button>
            ))}
          </div>

          <div className="rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs">
                <Globe className="w-4 h-4 text-indigo-600" />
                <span className="font-extrabold text-slate-900">{selectedNextFile}</span>
                <span className="text-slate-500 font-medium">Vercel & Next.js App Router 프로덕션 코드</span>
              </div>
              <button
                onClick={() => handleCopy(nextFiles[selectedNextFile], selectedNextFile)}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-2xs"
              >
                {copiedKey === selectedNextFile ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>파일 내용 복사</span>
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-indigo-200 bg-slate-900 overflow-x-auto max-h-[520px] leading-relaxed rounded-b-3xl">
              {nextFiles[selectedNextFile]}
            </pre>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: ENV & DEPLOYMENT GUIDE */}
      {activeSubTab === 'env' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-500" />
              Vercel 배포 시 필요한 환경 변수 (Environment Variables)
            </h3>
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-indigo-600 font-bold">GEMINI_API_KEY</span>
                <p className="text-slate-500 text-[11px]">AI 쇼츠 대본 및 씬별 에셋 가이드 생성을 위한 API 키</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-emerald-700 font-bold">NEXT_PUBLIC_SUPABASE_URL</span>
                <p className="text-slate-500 text-[11px]">Supabase 프로젝트 URL</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-emerald-700 font-bold">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
                <p className="text-slate-500 text-[11px]">Supabase Anonymous Public Key</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-indigo-600" />
              Vercel 3단계 배포 실행 절차
            </h3>
            <ol className="space-y-3 text-slate-600 list-decimal list-inside leading-relaxed font-medium">
              <li className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <strong className="text-slate-900">Supabase 스키마 실행:</strong> Supabase 대시보드 SQL Editor에 본 스키마를 붙여넣고 Run 클릭.
              </li>
              <li className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <strong className="text-slate-900">GitHub 저장소 푸시:</strong> 생성된 Next.js 프로젝트 코드를 본인의 GitHub 레포에 Push.
              </li>
              <li className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <strong className="text-slate-900">Vercel 원클릭 배포:</strong> Vercel에서 레포를 Import하고 환경변수 3개를 등록한 뒤 Deploy 클릭!
              </li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};
