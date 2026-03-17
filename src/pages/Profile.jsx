import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { BADGES } from '../lib/streakAndBadges';
import { Flame, Tv, Award, User, Clock, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  if (!user) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-zinc-800 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );

  const earnedBadges = BADGES.filter(b => (user.badges || []).includes(b.id));
  const unearnedBadges = BADGES.filter(b => !(user.badges || []).includes(b.id));

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Profile Header */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
            {user.avatar_url
              ? <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover rounded-2xl" />
              : <User className="w-9 h-9 text-emerald-400" />
            }
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">{user.full_name || 'Anime Fan'}</h1>
            <p className="text-zinc-500 text-sm">{user.email}</p>
            {user.bio && <p className="text-zinc-400 text-sm mt-1">{user.bio}</p>}
          </div>
        </div>

        {/* Quick links */}
        <Link to="/SeasonalCalendar" className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 rounded-2xl p-4 transition-all group">
          <Calendar className="w-6 h-6 text-emerald-400" />
          <div>
            <p className="text-white font-bold text-sm group-hover:text-emerald-400 transition-colors">Seasonal Calendar</p>
            <p className="text-zinc-600 text-xs">This season's airing schedule</p>
          </div>
        </Link>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
            <Flame className="w-6 h-6 text-orange-400 mx-auto mb-1" />
            <p className="text-2xl font-black text-white">{user.watch_streak || 0}</p>
            <p className="text-xs text-zinc-500">Day Streak</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
            <Tv className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
            <p className="text-2xl font-black text-white">{user.total_episodes_watched || 0}</p>
            <p className="text-xs text-zinc-500">Episodes</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
            <Award className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
            <p className="text-2xl font-black text-white">{earnedBadges.length}</p>
            <p className="text-xs text-zinc-500">Badges</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
            <Clock className="w-6 h-6 text-blue-400 mx-auto mb-1" />
            <p className="text-2xl font-black text-white">
              {Math.floor((user.total_watch_minutes || 0) / 60)}
              <span className="text-sm font-normal text-zinc-500">h</span>
            </p>
            <p className="text-xs text-zinc-500">Watch Time</p>
          </div>
        </div>

        {/* Badges */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Badges</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {earnedBadges.map(b => (
              <div key={b.id} className="bg-zinc-800 border border-emerald-500/30 rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">{b.emoji}</div>
                <p className="text-xs font-bold text-emerald-400">{b.label}</p>
                <p className="text-[10px] text-zinc-600 mt-0.5">{b.desc}</p>
              </div>
            ))}
            {unearnedBadges.map(b => (
              <div key={b.id} className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-3 text-center opacity-40">
                <div className="text-2xl mb-1 grayscale">{b.emoji}</div>
                <p className="text-xs font-bold text-zinc-500">{b.label}</p>
                <p className="text-[10px] text-zinc-700 mt-0.5">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Streak info */}
        {(user.watch_streak || 0) > 0 && (
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 flex items-center gap-3">
            <Flame className="w-8 h-8 text-orange-400 flex-shrink-0" />
            <div>
              <p className="text-white font-bold">{user.watch_streak} day streak! 🔥</p>
              <p className="text-zinc-500 text-sm">Keep watching daily to maintain your streak.</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}