import { base44 } from '@/api/base44Client';

export const BADGES = [
  { id: 'first_watch', label: 'First Watch', emoji: '🎬', desc: 'Watched your first episode' },
  { id: 'ep_10', label: 'Getting Started', emoji: '📺', desc: 'Watched 10 episodes' },
  { id: 'ep_50', label: 'Binge Watcher', emoji: '🍿', desc: 'Watched 50 episodes' },
  { id: 'ep_100', label: 'Anime Addict', emoji: '🔥', desc: 'Watched 100 episodes' },
  { id: 'ep_500', label: 'Veteran', emoji: '⚔️', desc: 'Watched 500 episodes' },
  { id: 'streak_3', label: '3-Day Streak', emoji: '📅', desc: '3 days in a row' },
  { id: 'streak_7', label: 'Week Warrior', emoji: '🗓️', desc: '7 days in a row' },
  { id: 'streak_30', label: 'Monthly Master', emoji: '🏆', desc: '30 days in a row' },
  { id: 'night_owl', label: 'Night Owl', emoji: '🦉', desc: 'Watched after midnight' },
];

function getBadgesToAward(totalEps, streak, isNightOwl, existingBadges = []) {
  const earned = new Set(existingBadges);
  const newBadges = [];

  const check = (id) => {
    if (!earned.has(id)) { newBadges.push(id); earned.add(id); }
  };

  if (totalEps >= 1) check('first_watch');
  if (totalEps >= 10) check('ep_10');
  if (totalEps >= 50) check('ep_50');
  if (totalEps >= 100) check('ep_100');
  if (totalEps >= 500) check('ep_500');
  if (streak >= 3) check('streak_3');
  if (streak >= 7) check('streak_7');
  if (streak >= 30) check('streak_30');
  if (isNightOwl) check('night_owl');

  return { allBadges: [...earned], newBadges };
}

export async function recordWatchActivity() {
  const user = await base44.auth.me();
  if (!user) return;

  const today = new Date().toISOString().split('T')[0];
  const lastDate = user.last_watched_date;
  const isNightOwl = new Date().getHours() >= 0 && new Date().getHours() < 5;

  let streak = user.watch_streak || 0;

  if (lastDate === today) {
    // Already watched today, just increment episodes
  } else if (lastDate) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split('T')[0];
    streak = lastDate === yStr ? streak + 1 : 1;
  } else {
    streak = 1;
  }

  const totalEps = (user.total_episodes_watched || 0) + 1;
  const { allBadges } = getBadgesToAward(totalEps, streak, isNightOwl, user.badges || []);

  await base44.auth.updateMe({
    watch_streak: streak,
    last_watched_date: today,
    total_episodes_watched: totalEps,
    badges: allBadges,
  });
}