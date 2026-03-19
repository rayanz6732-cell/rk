import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { BADGES } from '../lib/streakAndBadges';
import { Flame, Tv, Award, User, Clock, Calendar, Palette } from 'lucide-react';
import AdminSyncPanel from '../components/anime/AdminSyncPanel';
import { Link } from 'react-router-dom';

const THEMES = [
  {
    id: 'default',
    name: 'Default',
    desc: 'Pure white clean aesthetic',
    gradient: 'from-gray-300 to-gray-400',
    colors: { primary: '142 71% 45%', bg: '0 0% 4%' }
  },
  {
    id: 'cherry',
    name: 'Cherry Blossom',
    desc: 'Soft pink tones inspired by sakura',
    gradient: 'from-pink-400 to-purple-400',
    colors: { primary: '340 82% 52%', bg: '0 0% 4%' }
  },
  {
    id: 'neon',
    name: 'Neon Tokyo',
    desc: 'Electric neon cyberpunk vibes',
    gradient: 'from-purple-500 to-cyan-400',
    colors: { primary: '280 90% 50%', bg: '0 0% 2%' }
  },
  {
    id: 'aurora',
    name: 'Aurora Borealis',
    desc: 'Northern lights dancing colors',
    gradient: 'from-green-400 to-cyan-500',
    colors: { primary: '162 73% 46%', bg: '0 0% 4%' }
  },
  {
    id: 'ocean',
    name: 'Deep Ocean',
    desc: 'Mysterious underwater depths',
    gradient: 'from-blue-500 to-blue-600',
    colors: { primary: '217 91% 60%', bg: '0 0% 3%' }
  },
  {
    id: 'sunset',
    name: 'Golden Sunset',
    desc: 'Warm sunset dreamy palette',
    gradient: 'from-yellow-400 via-orange-500 to-red-500',
    colors: { primary: '39 89% 49%', bg: '0 0% 4%' }
  }
];

export default function Profile() {
  const [user, setUser] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState('cherry');
  const [showAppearance, setShowAppearance] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    base44.auth.me()
      .then(u => {
        setUser(u);
        setSelectedTheme(u?.theme || 'cherry');
      })
      .catch(() => {
        // User not signed in, show guest profile
        setUser(false);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleThemeChange = async (themeId) => {
    setSelectedTheme(themeId);
    if (user) {
      await base44.auth.updateMe({ theme: themeId });
    }
    
    const theme = THEMES.find(t => t.id === themeId);
    const root = document.documentElement;
    root.style.setProperty('--primary', theme.colors.primary);
    root.style.setProperty('--ring', theme.colors.primary);
    
    // Inject CSS to override emerald colors with theme color
    let styleEl = document.getElementById('theme-override-style');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'theme-override-style';
      document.head.appendChild(styleEl);
    }
    
    const hslColor = `hsl(${theme.colors.primary})`;
    styleEl.textContent = `
      .text-emerald-400 { color: ${hslColor} !important; }
      .text-emerald-500 { color: ${hslColor} !important; }
      .bg-emerald-500 { background-color: ${hslColor} !important; }
      .bg-emerald-500\/20 { background-color: ${hslColor}20 !important; }
      .bg-emerald-500\/10 { background-color: ${hslColor}10 !important; }
      .border-emerald-500 { border-color: ${hslColor} !important; }
      .border-emerald-500\/30 { border-color: ${hslColor}30 !important; }
      .border-emerald-500\/40 { border-color: ${hslColor}40 !important; }
      .border-emerald-500\/60 { border-color: ${hslColor}60 !important; }
      .hover\:text-emerald-400:hover { color: ${hslColor} !important; }
      .hover\:border-emerald-500\/40:hover { border-color: ${hslColor}40 !important; }
      .hover\:border-emerald-500\/60:hover { border-color: ${hslColor}60 !important; }
      .ring-emerald-500 { --tw-ring-color: ${hslColor} !important; }
    `;
  };

  if (isLoading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-zinc-800 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );

  const earnedBadges = user ? BADGES.filter(b => (user.badges || []).includes(b.id)) : [];
  const unearnedBadges = BADGES.filter(b => !earnedBadges.find(eb => eb.id === b.id));

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Profile Header */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
            {user && user.avatar_url
              ? <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover rounded-2xl" />
              : <User className="w-9 h-9 text-emerald-400" />
            }
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">{user ? user.full_name || 'Anime Fan' : 'Guest Profile'}</h1>
            {user && <p className="text-zinc-500 text-sm">{user.email}</p>}
            {user && user.bio && <p className="text-zinc-400 text-sm mt-1">{user.bio}</p>}
            {!user && <p className="text-zinc-500 text-sm">Sign in to save your stats and preferences</p>}
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
        {user && (user.watch_streak || 0) > 0 && (
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 flex items-center gap-3">
            <Flame className="w-8 h-8 text-orange-400 flex-shrink-0" />
            <div>
              <p className="text-white font-bold">{user.watch_streak} day streak! 🔥</p>
              <p className="text-zinc-500 text-sm">Keep watching daily to maintain your streak.</p>
            </div>
          </div>
        )}

        {/* Appearance Button */}
        <button
          onClick={() => setShowAppearance(!showAppearance)}
          className="flex items-center gap-3 w-full bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 rounded-2xl p-4 transition-all group"
        >
          <Palette className="w-6 h-6 text-emerald-400 flex-shrink-0" />
          <div className="text-left">
            <p className="text-white font-bold text-sm group-hover:text-emerald-400 transition-colors">Appearance</p>
            <p className="text-zinc-600 text-xs">Customize your theme</p>
          </div>
        </button>

        {/* Appearance Section */}
        {showAppearance && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Choose Theme</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {THEMES.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeChange(theme.id)}
                  className={`relative rounded-xl overflow-hidden transition-all ${
                    selectedTheme === theme.id ? 'ring-2 ring-emerald-500 scale-105' : 'hover:scale-102'
                  }`}
                >
                  <div className={`h-24 bg-gradient-to-r ${theme.gradient}`} />
                  <div className="bg-zinc-800 px-3 py-2">
                    <p className="text-xs font-bold text-white text-left">{theme.name}</p>
                    <p className="text-[10px] text-zinc-500 text-left">{theme.desc}</p>
                  </div>
                  {selectedTheme === theme.id && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                        <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        </div>
        </div>
        );
        }