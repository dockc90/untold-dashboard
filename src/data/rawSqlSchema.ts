export const RAW_SUPABASE_SCHEMA = `-- ==============================================================================
-- AutoShorts (우체국) SaaS - Supabase (PostgreSQL) Production Schema
-- Description: AI 기반 화제의 인물 유튜브 쇼츠 자동 제작 플랫폼 데이터베이스 구조
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM TYPES
CREATE TYPE content_category AS ENUM (
    'entertainment', 'actor', 'sports', 'economy', 'social', 'global'
);

CREATE TYPE target_persona AS ENUM (
    '4060_emotional', '1020_dopamine', '3040_success', 'mystery_twist'
);

CREATE TYPE subscription_tier AS ENUM ('free', 'starter', 'pro', 'agency');
CREATE TYPE project_status AS ENUM ('draft', 'script_ready', 'editing', 'rendered', 'published');

-- 3. USERS & PROFILES TABLE (Supabase Auth 연동)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    channel_name TEXT,
    subscription_tier subscription_tier DEFAULT 'starter' NOT NULL,
    daily_generations_count INT DEFAULT 0 NOT NULL,
    max_daily_generations INT DEFAULT 10 NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 4. TRENDING FIGURES TABLE (우체국 트렌드 레이더 데이터)
CREATE TABLE IF NOT EXISTS public.trending_figures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    category content_category NOT NULL,
    virality_score INT NOT NULL CHECK (virality_score BETWEEN 1 AND 100),
    timeframe VARCHAR(10) NOT NULL CHECK (timeframe IN ('24h', '48h', '7d')),
    buzz_summary TEXT NOT NULL,
    controversy_or_issue TEXT,
    suggested_angle TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    image_url TEXT,
    source_articles_count INT DEFAULT 0,
    is_hot BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 5. SHORTS PROJECTS TABLE (생성된 쇼츠 프로젝트 및 대본 본문)
CREATE TABLE IF NOT EXISTS public.shorts_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    figure_id UUID REFERENCES public.trending_figures(id) ON DELETE SET NULL,
    figure_name TEXT NOT NULL,
    category content_category NOT NULL,
    target_persona target_persona NOT NULL,
    target_duration INT NOT NULL CHECK (target_duration IN (45, 60)),
    selected_hook_index INT DEFAULT 0 NOT NULL,
    full_script TEXT NOT NULL,
    char_count INT NOT NULL,
    estimated_seconds INT NOT NULL,
    copyright_defense_note TEXT NOT NULL,
    status project_status DEFAULT 'draft' NOT NULL,
    is_bookmarked BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 6. PROJECT HOOKS TABLE (3초 후킹 3단 다변화 옵션)
CREATE TABLE IF NOT EXISTS public.project_hooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.shorts_projects(id) ON DELETE CASCADE,
    hook_type VARCHAR(20) NOT NULL CHECK (hook_type IN ('question', 'provocative', 'emotional')),
    label TEXT NOT NULL,
    hook_text TEXT NOT NULL,
    is_selected BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 7. PROJECT SCENES TABLE (3초 단위 씬별 에셋 가이드 & 연출 지침)
CREATE TABLE IF NOT EXISTS public.project_scenes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.shorts_projects(id) ON DELETE CASCADE,
    scene_number INT NOT NULL,
    time_range VARCHAR(30) NOT NULL,
    narration TEXT NOT NULL,
    visual_guide TEXT NOT NULL,
    image_search_keyword TEXT NOT NULL,
    visual_effect TEXT NOT NULL,
    bgm_suggestion TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 8. PROJECT METADATA TABLE (유튜브 쇼츠 업로드용 제목/태그/고정댓글)
CREATE TABLE IF NOT EXISTS public.project_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.shorts_projects(id) ON DELETE CASCADE UNIQUE,
    titles TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    selected_title TEXT,
    hashtags TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    description TEXT,
    pinned_comment TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 9. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trending_figures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shorts_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_hooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Anyone can view trending figures" ON public.trending_figures FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Users can manage own shorts projects" ON public.shorts_projects FOR ALL USING (auth.uid() = user_id);
`;
