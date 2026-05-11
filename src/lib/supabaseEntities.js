// Drop-in replacements for base44.entities calls
import { supabase } from '@/lib/supabaseClient';

// ── Comments ──────────────────────────────────────────────────────────────────
export const Comments = {
  async filter({ anime_id }, order = '-created_at', limit = 50) {
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('anime_id', anime_id)
      .order('created_at', { ascending: false })
      .limit(limit);
    return data || [];
  },

  async create(payload) {
    const { data } = await supabase.from('comments').insert(payload).select().single();
    return data;
  },

  subscribe(callback) {
    const channel = supabase
      .channel('comments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, (payload) => {
        callback({ type: payload.eventType, data: payload.new, id: payload.new?.id });
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  },
};

// ── UserRatings ───────────────────────────────────────────────────────────────
export const UserRatings = {
  async filter({ mal_id }, order = '-created_at', limit = 1) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from('user_ratings')
      .select('*')
      .eq('mal_id', mal_id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);
    return data || [];
  },

  async create(payload) {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from('user_ratings')
      .insert({ ...payload, user_id: user?.id })
      .select().single();
    return data;
  },

  async update(id, payload) {
    const { data } = await supabase
      .from('user_ratings')
      .update(payload)
      .eq('id', id)
      .select().single();
    return data;
  },
};