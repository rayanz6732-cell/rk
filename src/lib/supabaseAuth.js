// Supabase auth helpers — drop-in replacements for base44.auth calls
import { supabase } from '@/lib/supabaseClient';

export async function getMe() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile ? { ...user, ...profile } : user;
}

export async function updateMe(data) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Upsert profile row
  await supabase.from('profiles').upsert({ id: user.id, ...data });
}

export function redirectToLogin(nextUrl) {
  window.location.href = nextUrl
    ? `/login?next=${encodeURIComponent(nextUrl)}`
    : '/login';
}

export async function logout() {
  await supabase.auth.signOut();
  window.location.href = '/';
}