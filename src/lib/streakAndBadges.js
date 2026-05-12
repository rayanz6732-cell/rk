import { supabase } from '@/lib/supabase';

export const BADGES = [
  { id: 'first_watch',  name: 'First Watch',     icon: '🎬', desc: 'Watched your first episode' },
  { id: 'ep_10',        name: 'Getting Started',  icon: '📺', desc: 'Watched 10 episodes' },
  { id: 'ep_50',        name: 'Binge Watcher',    icon: '🍿', desc: 'Watched 50 episodes' },
  { id: 'ep_100',       name: 'Anime Addict',     icon: '🔥', desc: 'Watched 100 episodes' },
  { id: 'ep_500',       name: 'Veteran',          icon: '⚔️', desc: 'Watched 500 episodes' },
  { id: 'streak_3',     name: '3-Day Streak',     icon: '📅', desc: '3 days in a row' },
  { id: 'streak_7',     name: 'Week Warrior',     icon: '🗓️', desc: '7 days in a row' },
  { id: 'streak_30',    name: 'Monthly Master',   icon: '🏆', desc: '30 days in a row' },
  { id: 'night_owl',    name: 'Night Owl',        icon: '🦉', desc: 'Watched after midnight' },
];

function getBadgesToAward(totalEps, streak, isNightOwl, existingBadges = []) {
  const earned = new Set(existingBadges);
  const newBadges = [];
  const check = (id) => { if (!earned.has(id)) { newBadges.push(id); earned.add(id); } };

  if (totalEps >= 1)   check('first_watch');
  if (totalEps >= 10)  check('ep_10');
  if (totalEps >= 50)  check('ep_50');
  if (totalEps >= 100) check('ep_100');
  if (totalEps >= 500) check('ep_500');
  if (streak >= 3)     check('streak_3');
  if (streak >= 7)     check('streak_7');
  if (streak >= 30)    check('streak_30');
  if (isNightOwl)      check('night_owl');

  return { allBadges: [...earned], newBadges };
}

export async function recordWatchActivity() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) return;

  const today = new Date().toISOString().split('T')[0];
  const isNightOwl = new Date().getHours() < 5;
  let streak = profile.watch_streak || 0;

  if (profile.last_watched_date && profile.last_watched_date !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    streak = profile.last_watched_date === yesterday.toISOString().split('T')[0] ? streak + 1 : 1;
  } else if (!profile.last_watched_date) {
    streak = 1;
  }

  const totalEps = (profile.total_episodes_watched || 0) + 1;
  const totalMinutes = (profile.total_watch_minutes || 0) + 24;
  const { allBadges } = getBadgesToAward(totalEps, streak, isNightOwl, profile.badges || []);

  await supabase.from('profiles').update({
    watch_streak: streak,
    last_watched_date: today,
    total_episodes_watched: totalEps,
    total_watch_minutes: totalMinutes,
    badges: allBadges,
  }).eq('id', user.id);
}