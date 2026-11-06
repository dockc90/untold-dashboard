import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

// Memory store for serverless environment & cross-device sync
const globalStore = globalThis as any;
if (!globalStore.__untoldProjectsStore) {
  globalStore.__untoldProjectsStore = new Map<string, any>();
}
if (!globalStore.__untoldSyncCodes) {
  globalStore.__untoldSyncCodes = new Map<string, { projects: any[]; expiresAt: number }>();
}
if (!globalStore.__untoldActiveDraft) {
  globalStore.__untoldActiveDraft = null;
}

const memProjects: Map<string, any> = globalStore.__untoldProjectsStore;
const memSyncCodes: Map<string, { projects: any[]; expiresAt: number }> = globalStore.__untoldSyncCodes;

const TMP_FILE = path.join('/tmp', 'untold_projects_store.json');
const TMP_DRAFT_FILE = path.join('/tmp', 'untold_draft_store.json');
const TMP_SYNC_CODES_FILE = path.join('/tmp', 'untold_sync_codes_store.json');

// Helper to load file persistence into memory
function loadDiskStore() {
  try {
    if (fs.existsSync(TMP_FILE)) {
      const content = fs.readFileSync(TMP_FILE, 'utf8');
      const list = JSON.parse(content);
      if (Array.isArray(list)) {
        for (const p of list) {
          if (p && p.id && !memProjects.has(p.id)) {
            memProjects.set(p.id, p);
          }
        }
      }
    }
  } catch (e) {
    // Silently continue if /tmp not accessible
  }

  try {
    if (fs.existsSync(TMP_SYNC_CODES_FILE)) {
      const content = fs.readFileSync(TMP_SYNC_CODES_FILE, 'utf8');
      const obj = JSON.parse(content);
      if (obj && typeof obj === 'object') {
        for (const [k, v] of Object.entries(obj)) {
          if (v && !memSyncCodes.has(k)) {
            memSyncCodes.set(k, v as any);
          }
        }
      }
    }
  } catch (e) {}

  try {
    if (!globalStore.__untoldActiveDraft && fs.existsSync(TMP_DRAFT_FILE)) {
      const content = fs.readFileSync(TMP_DRAFT_FILE, 'utf8');
      globalStore.__untoldActiveDraft = JSON.parse(content);
    }
  } catch (e) {}
}

function saveDiskStore() {
  try {
    const list = Array.from(memProjects.values());
    fs.writeFileSync(TMP_FILE, JSON.stringify(list), 'utf8');
  } catch (e) {}

  try {
    const syncObj: Record<string, any> = {};
    for (const [k, v] of memSyncCodes.entries()) {
      syncObj[k] = v;
    }
    fs.writeFileSync(TMP_SYNC_CODES_FILE, JSON.stringify(syncObj), 'utf8');
  } catch (e) {}
}

function saveDraftDisk(draft: any) {
  try {
    fs.writeFileSync(TMP_DRAFT_FILE, JSON.stringify(draft), 'utf8');
  } catch (e) {}
}

loadDiskStore();

// Helper: Ensure valid UUID format for PostgreSQL UUID column
function toValidUUID(id: string): string {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) return id;

  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  const timestamp = Date.now().toString(16).padStart(12, '0').slice(-12);
  return `a1b2c3d4-e5f6-4a7b-8c9d-${hex}${timestamp.slice(-4)}`;
}

export async function GET(req: Request) {
  try {
    loadDiskStore();
    const { searchParams } = new URL(req.url);

    // 1. Sync Code lookup (Mobile to PC direct cloud transfer)
    const syncCode = searchParams.get('sync_code');
    if (syncCode) {
      const codeKey = syncCode.replace(/[^0-9]/g, '');
      const entry = memSyncCodes.get(codeKey);
      if (entry) {
        if (Date.now() > entry.expiresAt) {
          memSyncCodes.delete(codeKey);
          return NextResponse.json({ error: '만료된 동기화 코드입니다.', projects: [] }, { status: 404 });
        }
        return NextResponse.json({ success: true, projects: entry.projects });
      }
      return NextResponse.json({ error: '동기화 코드를 찾을 수 없습니다.', projects: [] }, { status: 404 });
    }

    // 2. Draft check (Auto-save draft for cross-device continuation)
    const isDraftReq = searchParams.get('type') === 'draft';
    if (isDraftReq) {
      return NextResponse.json({ success: true, draft: globalStore.__untoldActiveDraft });
    }

    // 3. Regular projects listing
    const projectMap = new Map<string, any>();

    // Load from memory/disk store first
    for (const [id, proj] of memProjects.entries()) {
      projectMap.set(id, proj);
    }

    // Load from Supabase if configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
      try {
        const { data: jsonProjects, error: jsonErr } = await supabaseAdmin
          .from('untold_projects')
          .select('data')
          .order('created_at', { ascending: false });

        if (!jsonErr && jsonProjects && jsonProjects.length > 0) {
          for (const row of jsonProjects) {
            if (row.data && row.data.id) {
              projectMap.set(row.data.id, row.data);
            }
          }
        }
      } catch (e) {
        // Fallback to relational or server store
      }

      try {
        const { data: rows } = await supabaseAdmin
          .from('shorts_projects')
          .select(`
            *,
            project_hooks (*),
            project_scenes (*),
            project_metadata (*)
          `)
          .order('created_at', { ascending: false });

        if (rows && rows.length > 0) {
          rows.forEach((row: any) => {
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

            const p = {
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

            if (!projectMap.has(p.id)) {
              projectMap.set(p.id, p);
            }
          });
        }
      } catch (e) {}
    }

    const projects = Array.from(projectMap.values()).sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    return NextResponse.json({ projects, source: 'cloud_sync_ready' });
  } catch (err: any) {
    console.error('Error in GET /api/projects:', err);
    return NextResponse.json({ error: err.message, projects: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body) {
      return NextResponse.json({ error: 'Empty payload' }, { status: 400 });
    }

    // A. Create 6-digit Sync Code for Mobile <-> PC instant sync
    if (body.action === 'create_sync_code' && Array.isArray(body.projects)) {
      const rawCode = Math.floor(100000 + Math.random() * 900000).toString();
      memSyncCodes.set(rawCode, {
        projects: body.projects,
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000, // 365 days permanent sync
      });
      // Also register all these projects into memProjects
      for (const p of body.projects) {
        if (p && p.id) {
          memProjects.set(p.id, { ...p, isSaved: true, updatedAt: p.updatedAt || new Date().toISOString() });
        }
      }
      saveDiskStore();
      return NextResponse.json({
        success: true,
        syncCode: `${rawCode.slice(0, 3)}-${rawCode.slice(3)}`,
        rawCode,
        count: body.projects.length,
      });
    }

    // B. Save Draft (Auto-save without pressing manual save)
    if (body.type === 'draft' && body.project) {
      const draft = {
        ...body.project,
        autoSavedAt: new Date().toISOString(),
      };
      globalStore.__untoldActiveDraft = draft;
      saveDraftDisk(draft);
      return NextResponse.json({ success: true, autoSavedAt: draft.autoSavedAt });
    }

    // C. Regular Save / Sync Project
    const project = body;
    if (!project || !project.figureName) {
      return NextResponse.json({ error: 'Invalid project payload' }, { status: 400 });
    }

    const projectId = project.id || `proj-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const enrichedProject = {
      ...project,
      id: projectId,
      createdAt: project.createdAt || nowIso,
      updatedAt: nowIso,
      isSaved: true,
    };

    // 1. Save in server-side memory & disk cache (guarantees cross-device sync even without DB)
    memProjects.set(projectId, enrichedProject);

    // 1-b. If a persistent sync_code was provided, also update that device pair channel!
    const activeSyncCode = body.sync_code || body.syncCode;
    if (activeSyncCode) {
      const codeKey = String(activeSyncCode).replace(/[^0-9]/g, '');
      if (codeKey.length === 6) {
        const entry = memSyncCodes.get(codeKey);
        if (entry) {
          const pIdx = entry.projects.findIndex((p: any) => p && p.id === projectId);
          if (pIdx >= 0) {
            entry.projects[pIdx] = enrichedProject;
          } else {
            entry.projects.unshift(enrichedProject);
          }
          entry.expiresAt = Date.now() + 365 * 24 * 60 * 60 * 1000;
          memSyncCodes.set(codeKey, entry);
        } else {
          memSyncCodes.set(codeKey, {
            projects: [enrichedProject],
            expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
          });
        }
      }
    }
    saveDiskStore();

    // 2. Upsert to Supabase if credentials exist
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
      try {
        await supabaseAdmin
          .from('untold_projects')
          .upsert(
            {
              id: projectId,
              figure_name: enrichedProject.figureName,
              category: enrichedProject.category || 'entertainment',
              full_script: enrichedProject.fullScript || '',
              data: enrichedProject,
              updated_at: nowIso,
            },
            { onConflict: 'id' }
          );
      } catch (e) {
        console.warn('Supabase save skipped/failed:', e);
      }
    }

    return NextResponse.json({
      success: true,
      savedId: projectId,
      savedAt: nowIso,
      source: 'server_cloud_sync',
    });
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

    // Remove from memory & disk
    memProjects.delete(id);
    saveDiskStore();

    // Remove from Supabase if configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
      try {
        const uuidId = toValidUUID(id);
        await supabaseAdmin.from('untold_projects').delete().eq('id', id);
        await supabaseAdmin.from('shorts_projects').delete().eq('id', uuidId);
      } catch (e) {}
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    console.error('Error in DELETE /api/projects:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
