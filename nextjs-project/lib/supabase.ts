import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 
  process.env.NEXT_PUBLIC_SUPABASE_URL || 
  process.env.VITE_SUPABASE_URL || 
  process.env.SUPABASE_URL || 
  '';

const supabaseAnonKey = 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.VITE_SUPABASE_ANON_KEY || 
  process.env.SUPABASE_ANON_KEY || 
  '';

const supabaseServiceKey = 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  supabaseAnonKey;

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder');

export const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseServiceKey || supabaseAnonKey || 'placeholder', 
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  }
);
