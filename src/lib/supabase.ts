import { createClient } from '@supabase/supabase-js';
import { ShortsProject } from '../types';

const rawSupabaseUrl = 
  (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL)) || 
  '';
const supabaseUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

const supabaseAnonKey = 
  (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) || 
  '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl && 
    supabaseAnonKey && 
    !supabaseUrl.includes('placeholder') && 
    supabaseUrl.startsWith('https://')
  );
};

export const supabase = isSupabaseConfigured() 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Helper to convert any custom ID to a valid UUID format
export function toValidUUID(id: string): string {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) return id;

  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `a1b2c3d4-e5f6-4a7b-8c9d-${hex.padEnd(12, '0').slice(0, 12)}`;
}

// 1. Fetch saved projects from Supabase (or fallback to /api/projects)
export async function fetchProjectsFromSupabase(): Promise<ShortsProject[] | null> {
  // First try backend API endpoint (bypasses RLS cleanly on Vercel)
  try {
    const res = await fetch('/api/projects');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.projects) && data.projects.length > 0) {
        return data.projects;
      }
    }
  } catch (e) {
    // API endpoint might be offline in pure client, fallback to direct Supabase
  }

  if (!supabase) return null;

  try {
    // Try untold_projects table first
    const { data: untoldData, error: untoldErr } = await supabase
      .from('untold_projects')
      .select('data')
      .order('created_at', { ascending: false });

    if (!untoldErr && untoldData && untoldData.length > 0) {
      return untoldData.map((row: any) => row.data).filter(Boolean);
    }

    // Try relational shorts_projects table
    const { data: rows, error } = await supabase
      .from('shorts_projects')
      .select(`
        *,
        project_hooks (*),
        project_scenes (*),
        project_metadata (*)
      `)
      .order('created_at', { ascending: false });

    if (error || !rows || rows.length === 0) return null;

    return rows.map((row: any) => {
      const meta = Array.isArray(row.project_metadata) ? row.project_metadata[0] : row.project_metadata;
      const hooks = (row.project_hooks || []).map((h: any) => ({
        type: h.hook_type || 'question',
        label: h.label || '후킹',
        text: h.hook_text || '',
      }));

      const scenes = (row.project_scenes || [])
        .sort((a: any, b: any) => a.scene_number - b.scene_number)
        .map((s: any) => ({
          sceneNumber: s.scene_number,
          timeRange: s.time_range,
          narration: s.narration,
          visualGuide: s.visual_guide,
          imageSearchKeyword: s.image_search_keyword,
          visualEffect: s.visual_effect,
          bgmSuggestion: s.bgm_suggestion,
          uploadedImageUrl: s.uploaded_image_url || s.uploadedImageUrl || undefined,
          motionEffect: s.motion_effect || s.motionEffect || 'zoom_in',
        }));

      return {
        id: row.id,
        figureName: row.figure_name,
        category: row.category || 'entertainment',
        targetPersona: row.target_persona || '4060_emotional',
        targetDuration: row.target_duration || 60,
        selectedHookIndex: row.selected_hook_index || 0,
        hooks,
        titles: meta?.titles || [row.figure_name + ' 쇼츠'],
        hashtags: meta?.hashtags || ['#shorts', `#${row.figure_name}`],
        description: meta?.description || '',
        pinnedComment: meta?.pinned_comment || '',
        fullScript: row.full_script,
        scenes,
        copyrightDefenseNote: row.copyright_defense_note || '2차 저작물 보증',
        charCount: row.char_count || row.full_script?.length || 0,
        estimatedSeconds: row.estimated_seconds || row.target_duration || 60,
        createdAt: row.created_at,
        isSaved: true,
      };
    });
  } catch (err) {
    console.warn('Failed to fetch from Supabase client:', err);
    return null;
  }
}

// 2. Save/Sync project to Supabase
export async function saveProjectToSupabase(project: ShortsProject, syncCodeOverride?: string): Promise<boolean> {
  // First try backend API endpoint
  try {
    const activeSyncCode = syncCodeOverride || (typeof window !== 'undefined' ? localStorage.getItem('untold_paired_sync_code') : null);
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...project,
        sync_code: activeSyncCode || undefined,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) return true;
    }
  } catch (e) {
    // Continue to client-side fallback
  }

  if (!supabase) return false;

  try {
    const uuidId = toValidUUID(project.id);

    // Try untold_projects table
    const { error: untoldErr } = await supabase
      .from('untold_projects')
      .upsert(
        {
          id: project.id,
          figure_name: project.figureName,
          category: project.category,
          full_script: project.fullScript,
          data: { ...project, isSaved: true },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (!untoldErr) return true;

    // Relational shorts_projects table fallback
    const { error: projectErr } = await supabase
      .from('shorts_projects')
      .upsert(
        {
          id: uuidId,
          figure_name: project.figureName,
          category: project.category,
          target_persona: project.targetPersona,
          target_duration: project.targetDuration,
          selected_hook_index: project.selectedHookIndex,
          full_script: project.fullScript,
          char_count: project.charCount,
          estimated_seconds: project.estimatedSeconds,
          copyright_defense_note: project.copyrightDefenseNote,
          status: 'script_ready',
          is_bookmarked: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (projectErr) {
      console.warn('Direct Supabase insert error:', projectErr.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('Failed to save to Supabase:', err);
    return false;
  }
}

// 3. Delete project from Supabase
export async function deleteProjectFromSupabase(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/projects?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (res.ok) return true;
  } catch (e) {}

  if (!supabase) return false;

  try {
    const uuidId = toValidUUID(id);
    await supabase.from('untold_projects').delete().eq('id', id);
    await supabase.from('shorts_projects').delete().eq('id', uuidId);
    return true;
  } catch (err) {
    console.warn('Failed to delete from Supabase:', err);
    return false;
  }
}


// 4. Create 6-digit Sync Code for Mobile <-> PC instant sync
export async function createSyncCodeOnServer(projects: ShortsProject[]): Promise<string | null> {
  try {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_sync_code', projects }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.syncCode || null;
    }
  } catch (e) {
    console.warn('createSyncCodeOnServer error:', e);
  }
  return null;
}

// 5. Fetch projects by 6-digit Sync Code
export async function fetchProjectsBySyncCode(code: string): Promise<ShortsProject[] | null> {
  try {
    const res = await fetch(`/api/projects?sync_code=${encodeURIComponent(code)}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.projects)) {
        return data.projects;
      }
    }
  } catch (e) {
    console.warn('fetchProjectsBySyncCode error:', e);
  }
  return null;
}

// 6. Cloud Draft Auto-Save (Stores current active draft in server)
export async function saveDraftToServer(project: ShortsProject): Promise<boolean> {
  try {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'draft', project }),
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

// 7. Fetch active draft from server
export async function fetchDraftFromServer(): Promise<ShortsProject | null> {
  try {
    const res = await fetch('/api/projects?type=draft');
    if (res.ok) {
      const data = await res.json();
      return data.draft || null;
    }
  } catch (e) {
    return null;
  }
  return null;
}
