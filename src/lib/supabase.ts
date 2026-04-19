import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || supabaseUrl === 'https://your-project.supabase.co') {
  console.error('❌ VITE_SUPABASE_URL non configurée dans .env');
}
if (!supabaseAnonKey || supabaseAnonKey === 'your-anon-key') {
  console.error('❌ VITE_SUPABASE_ANON_KEY non configurée dans .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/** Teste la connexion à Supabase — retourne true si OK */
export async function testConnection(): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('school_info').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found, c'est normal
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Erreur inconnue' };
  }
}

// ─── Types DB ────────────────────────────────────────────────────────────────

export interface DbStudent {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  matricule: string;
  class_name: string;
  school_year: string;
  birth_date?: string;
  birth_place?: string;
  exam_center?: string;
  photo_url?: string;
  qr_code_data?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DbSchoolInfo {
  id?: string;
  user_id: string;
  name: string;
  logo_url?: string;
  signature_url?: string;
  card_colors?: {
    headerBg: string;
    headerText: string;
    footerBar: string;
    matriculeText: string;
  };
  updated_at?: string;
}
