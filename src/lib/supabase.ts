// ============================================================
// Supabase Mock Client (Transition 100% Cloudflare D1)
// Évite les erreurs réseau "ERR_NAME_NOT_RESOLVED" et WebSockets orphelins
// ============================================================

const createChainableQuery = () => {
  const queryObj: any = {
    select: () => queryObj,
    insert: () => Promise.resolve({ data: null, error: null }),
    upsert: () => Promise.resolve({ data: null, error: null }),
    update: () => queryObj,
    delete: () => queryObj,
    eq: () => queryObj,
    neq: () => queryObj,
    gt: () => queryObj,
    lt: () => queryObj,
    order: () => queryObj,
    limit: () => queryObj,
    single: () => Promise.resolve({ data: null, error: null }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    then: (resolve: any) => resolve({ data: [], error: null, count: 0 }),
    catch: () => queryObj,
  };
  return queryObj;
};

export const supabase: any = {
  from: () => createChainableQuery(),
  channel: () => ({
    on: () => ({ subscribe: () => ({}) }),
    subscribe: () => ({}),
  }),
  removeChannel: () => Promise.resolve(),
  storage: {
    from: () => ({
      upload: () => Promise.resolve({ data: null, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
    }),
  },
  auth: {
    getSession: () => Promise.resolve({ data: { session: null } }),
    signInWithPassword: () => Promise.resolve({ data: {}, error: null }),
    signUp: () => Promise.resolve({ data: {}, error: null }),
    signOut: () => Promise.resolve({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
};

export async function testConnection(): Promise<{ ok: boolean; error?: string }> {
  return { ok: true };
}

export interface DbStudent {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  gender?: string;
  matricule: string;
  class_name: string;
  school_year: string;
  birth_date?: string;
  birth_place?: string;
  exam_center?: string;
  photo_url?: string;
  expiration_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DbSchoolInfo {
  id?: string;
  user_id: string;
  name: string;
  logo_url?: string | null;
  signature_url?: string | null;
  stamp_url?: string | null;
  card_colors?: any;
  updated_at?: string;
}
