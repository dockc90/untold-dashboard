-- ==============================================================================
-- AutoShorts (우체국) SaaS - Supabase (PostgreSQL) Production Schema
-- Description: AI 기반 화제의 인물 유튜브 쇼츠 자동 제작 플랫폼 데이터베이스 구조
-- Includes: Auth Users, Profiles, Trending Figures, Shorts Projects, Hooks, Scenes, Metadata, RLS & Triggers
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. ENUM TYPES
-- ==============================================================================
DO $$ BEGIN
    CREATE TYPE content_category AS ENUM (
        'entertainment', -- 연예·가수
        'actor',         -- 배우·드라마
        'sports',        -- 스포츠 스타
        'economy',       -- 경제·기업인
        'social',        -- 사회·이슈
        'global'         -- 글로벌 셀럽
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE target_persona AS ENUM (
        '4060_emotional', -- 40~60대 감동 극복 비하인드
        '1020_dopamine',  -- 10~20대 숏폼 도파민/밈
        '3040_success',   -- 30~40대 동기부여 & 성공 공식
        'mystery_twist'   -- 반전 미스터리 & 진실
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_tier AS ENUM ('free', 'starter', 'pro', 'agency');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE project_status AS ENUM ('draft', 'script_ready', 'editing', 'rendered', 'published');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 3. USERS & PROFILES TABLE (Supabase Auth 연동)
-- ==============================================================================
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

-- ==============================================================================
-- 4. TRENDING FIGURES TABLE (우체국 트렌드 레이더 데이터)
-- ==============================================================================
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

CREATE INDEX IF NOT EXISTS idx_trending_figures_timeframe_cat ON public.trending_figures(timeframe, category);
CREATE INDEX IF NOT EXISTS idx_trending_figures_virality ON public.trending_figures(virality_score DESC);

-- ==============================================================================
-- 5. SHORTS PROJECTS TABLE (생성된 쇼츠 프로젝트 및 대본 본문)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.shorts_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
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

CREATE INDEX IF NOT EXISTS idx_shorts_projects_user_id ON public.shorts_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_shorts_projects_created_at ON public.shorts_projects(created_at DESC);

-- ==============================================================================
-- 6. PROJECT HOOKS TABLE (3초 후킹 3단 다변화 옵션)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.project_hooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.shorts_projects(id) ON DELETE CASCADE,
    hook_type VARCHAR(20) NOT NULL CHECK (hook_type IN ('question', 'provocative', 'emotional')),
    label TEXT NOT NULL, -- 질문형, 도발/논란형, 감성형
    hook_text TEXT NOT NULL,
    is_selected BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_project_hooks_project_id ON public.project_hooks(project_id);

-- ==============================================================================
-- 7. PROJECT SCENES TABLE (3초 단위 씬별 에셋 가이드 & 연출 지침)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.project_scenes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.shorts_projects(id) ON DELETE CASCADE,
    scene_number INT NOT NULL,
    time_range VARCHAR(30) NOT NULL, -- 예: "00:00 - 00:05"
    narration TEXT NOT NULL,
    visual_guide TEXT NOT NULL,
    image_search_keyword TEXT NOT NULL,
    visual_effect TEXT NOT NULL,
    bgm_suggestion TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_project_scenes_project_num ON public.project_scenes(project_id, scene_number);

-- ==============================================================================
-- 8. PROJECT METADATA TABLE (유튜브 쇼츠 업로드용 제목/태그/고정댓글)
-- ==============================================================================
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

-- ==============================================================================
-- 9. AUTOMATIC TRIGGER FOR PROFILES (Supabase Auth Signup)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', ''),
        COALESCE(new.raw_user_meta_data->>'avatar_url', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trending_figures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shorts_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_hooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_metadata ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only read & update their own record
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Trending figures: Anyone (authenticated) can read, only service role can insert/update
CREATE POLICY "Anyone can view trending figures"
    ON public.trending_figures FOR SELECT
    TO authenticated, anon
    USING (true);

-- Shorts Projects: Users manage only their own projects
CREATE POLICY "Users can view own shorts projects"
    ON public.shorts_projects FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shorts projects"
    ON public.shorts_projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shorts projects"
    ON public.shorts_projects FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own shorts projects"
    ON public.shorts_projects FOR DELETE
    USING (auth.uid() = user_id);

-- ==============================================================================
-- 10. UNTOLD FAST JSONB PROJECTS TABLE (쇼츠 대본 자동 동기화용)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.untold_projects (
    id TEXT PRIMARY KEY,
    user_id UUID,
    figure_name TEXT NOT NULL,
    category TEXT,
    target_persona TEXT,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.untold_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can select untold projects"
    ON public.untold_projects FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Anyone can insert untold projects"
    ON public.untold_projects FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Anyone can update untold projects"
    ON public.untold_projects FOR UPDATE
    TO anon, authenticated
    USING (true);

CREATE POLICY "Anyone can delete untold projects"
    ON public.untold_projects FOR DELETE
    TO anon, authenticated
    USING (true);

CREATE POLICY "Users can view project hooks"
    ON public.project_hooks FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.shorts_projects p
        WHERE p.id = project_hooks.project_id AND p.user_id = auth.uid()
    ));

CREATE POLICY "Users can modify project hooks"
    ON public.project_hooks FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.shorts_projects p
        WHERE p.id = project_hooks.project_id AND p.user_id = auth.uid()
    ));

CREATE POLICY "Users can view project scenes"
    ON public.project_scenes FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.shorts_projects p
        WHERE p.id = project_scenes.project_id AND p.user_id = auth.uid()
    ));

CREATE POLICY "Users can modify project scenes"
    ON public.project_scenes FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.shorts_projects p
        WHERE p.id = project_scenes.project_id AND p.user_id = auth.uid()
    ));

CREATE POLICY "Users can view project metadata"
    ON public.project_metadata FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.shorts_projects p
        WHERE p.id = project_metadata.project_id AND p.user_id = auth.uid()
    ));

CREATE POLICY "Users can modify project metadata"
    ON public.project_metadata FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.shorts_projects p
        WHERE p.id = project_metadata.project_id AND p.user_id = auth.uid()
    ));

-- ==============================================================================
-- 10. NEWSLETTER SUBSCRIBERS & DAILY 07:00 KST BRIEFING ISSUES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    send_hour_kst INT DEFAULT 7 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    last_sent_kst DATE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.newsletter_issues (
    issue_date DATE PRIMARY KEY,
    subject TEXT NOT NULL,
    summary TEXT,
    items_json JSONB DEFAULT '[]'::JSONB NOT NULL,
    upcoming_json JSONB DEFAULT '[]'::JSONB NOT NULL,
    html_body TEXT,
    sent_count INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);
