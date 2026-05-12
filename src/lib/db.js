// Supabase data layer — replaces base44.entities.*
import { supabase } from '@/lib/supabase';

// ── Comments ──────────────────────────────────────────────────────────────────
export const Comments = {
  async list(mal_id) {
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('anime_id', String(mal_id))
      .order('created_at', { ascending: false })
      .limit(50);
    return data || [];
  },
  async create(payload) {
    const { data } = await supabase.from('comments').insert(payload).select().single();
    return data;
  },
  subscribe(mal_id, callback) {
    const channel = supabase
      .channel(`comments:${mal_id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'comments',
        filter: `anime_id=eq.${mal_id}`,
      }, callback)
      .subscribe();
    return () => supabase.removeChannel(channel);
  },
};

// ── User Ratings ──────────────────────────────────────────────────────────────
export const UserRatings = {
  async getForAnime(mal_id, userId) {
    const { data } = await supabase
      .from('user_ratings')
      .select('*')
      .eq('mal_id', String(mal_id))
      .eq('user_id', userId)
      .single();
    return data;
  },
  async upsert(payload) {
    const { data } = await supabase
      .from('user_ratings')
      .upsert(payload, { onConflict: 'mal_id,user_id' })
      .select()
      .single();
    return data;
  },
};

// ── Profiles (replaces base44.auth.updateMe for extra fields) ─────────────────
export const Profiles = {
  async get(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return data;
  },
  async update(userId, payload) {
    const { data } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId)
      .select()
      .single();
    return data;
  },
};