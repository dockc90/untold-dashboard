import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Helper: Ensure valid UUID format for PostgreSQL UUID column
function toValidUUID(id: string): string {
  // If already standard UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) return id;

  // Deterministically convert any custom string like 'proj-173000000' to a valid UUID format
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  const timestamp = Date.now().toString(16).padStart(12, '0').slice(-12);
  return `a1b2c3d4-e5f6-4a7b-8c9d-${hex}${timestamp.slice(-4)}`;
}

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      return NextResponse.json({ projects: [], source: 'unconfigured' });
    }

    // 1. Try fetching from untold_projects (JSONB table) first for richest schema fidelity
    try {
      const { data: jsonProjects, error: jsonErr } = await supabaseAdmin
        .from('untold_projects')
        .select('data')
        .order('created_at', { ascending: false });

      if (!jsonErr && jsonProjects && jsonProjects.length > 0) {
        const formatted = jsonProjects.map((row: any) => row.data).filter(Boolean);
        return NextResponse.json({ projects: formatted, source: 'untold_projects' });
      }
    } catch (e) {
      // Table might not exist yet, continue to relational schema
    }

    // 2. Fetch from relational shorts_projects
    const { data: rows, error } = await supabaseAdmin
      .from('shorts_projects')
      .select(`
        *,
        project_hooks (*),
        project_scenes (*),
        project_metadata (*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error querying shorts_projects:', error.message);
      return NextResponse.json({ projects: [], error: error.message });
    }

    // Map relational schema back to ShortsProject interface
    const projects = (rows || []).map((row: any) => {
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

    return NextResponse.json({ projects, source: 'shorts_projects' });
  } catch (err: any) {
    console.error('Error in GET /api/projects:', err);
    return NextResponse.json({ error: err.message, projects: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      return NextResponse.json({ error: 'Supabase URL not configured' }, { status: 400 });
    }

    const project = await req.json();
    if (!project || !project.figureName) {
      return NextResponse.json({ error: 'Invalid project payload' }, { status: 400 });
    }

    const projectId = project.id || `proj-${Date.now()}`;
    const uuidId = toValidUUID(projectId);

    // 1. Try saving to untold_projects table (stores full JSON payload including AI triggers)
    try {
      const { error: untoldErr } = await supabaseAdmin
        .from('untold_projects')
        .upsert(
          {
            id: projectId,
            figure_name: project.figureName,
            category: project.category || 'entertainment',
            full_script: project.fullScript || '',
            data: { ...project, id: projectId, isSaved: true },
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );

      if (!untoldErr) {
        return NextResponse.json({ success: true, savedId: projectId, source: 'untold_projects' });
      }
    } catch (e) {
      // Table might not exist, proceed to relational tables
    }

    // 2. Upsert into relational shorts_projects
    // Check if a profile exists to link user_id, or use null
    let userId: string | null = null;
    const { data: profiles } = await supabaseAdmin.from('profiles').select('id').limit(1);
    if (profiles && profiles.length > 0) {
      userId = profiles[0].id;
    }

    const { error: projectErr } = await supabaseAdmin
      .from('shorts_projects')
      .upsert(
        {
          id: uuidId,
          user_id: userId,
          figure_name: project.figureName,
          category: project.category || 'entertainment',
          target_persona: project.targetPersona || '4060_emotional',
          target_duration: project.targetDuration || 60,
          selected_hook_index: project.selectedHookIndex || 0,
          full_script: project.fullScript || '',
          char_count: project.charCount || project.fullScript?.length || 0,
          estimated_seconds: project.estimatedSeconds || project.targetDuration || 60,
          copyright_defense_note: project.copyrightDefenseNote || '2차 저작물 보증',
          status: 'script_ready',
          is_bookmarked: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (projectErr) {
      console.warn('Upsert into shorts_projects failed:', projectErr.message);
      return NextResponse.json({ success: false, error: projectErr.message });
    }

    // Metadata
    if (project.titles || project.hashtags || project.description || project.pinnedComment) {
      await supabaseAdmin.from('project_metadata').upsert(
        {
          project_id: uuidId,
          titles: project.titles || [],
          hashtags: project.hashtags || [],
          description: project.description || '',
          pinned_comment: project.pinnedComment || '',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'project_id' }
      );
    }

    // Scenes
    if (Array.isArray(project.scenes) && project.scenes.length > 0) {
      // Delete old scenes first to avoid duplicate numbers on update
      await supabaseAdmin.from('project_scenes').delete().eq('project_id', uuidId);

      const scenesToInsert = project.scenes.map((s: any) => ({
        project_id: uuidId,
        scene_number: s.sceneNumber,
        time_range: s.timeRange,
        narration: s.narration,
        visual_guide: s.visualGuide,
        image_search_keyword: s.imageSearchKeyword,
        visual_effect: s.visualEffect || '줌인',
        bgm_suggestion: s.bgmSuggestion || '',
      }));

      await supabaseAdmin.from('project_scenes').insert(scenesToInsert);
    }

    // Hooks
    if (Array.isArray(project.hooks) && project.hooks.length > 0) {
      await supabaseAdmin.from('project_hooks').delete().eq('project_id', uuidId);

      const hooksToInsert = project.hooks.map((h: any, idx: number) => ({
        project_id: uuidId,
        hook_type: h.type || 'question',
        label: h.label || '후킹',
        hook_text: h.text || '',
        is_selected: idx === (project.selectedHookIndex || 0),
      }));

      await supabaseAdmin.from('project_hooks').insert(hooksToInsert);
    }

    return NextResponse.json({ success: true, savedId: projectId });
  } catch (err: any) {
    console.error('Error in POST /api/projects:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    const uuidId = toValidUUID(id);

    // Try deleting from both tables
    await supabaseAdmin.from('untold_projects').delete().eq('id', id);
    await supabaseAdmin.from('shorts_projects').delete().eq('id', uuidId);

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    console.error('Error in DELETE /api/projects:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
