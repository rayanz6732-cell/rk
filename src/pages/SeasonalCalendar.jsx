import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Star, Tv, Loader2 } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_PARAM = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const BASE = 'https://api.jikan.moe/v4';

async function fetchScheduleDay(day) {
  const res = await fetch(`${BASE}/schedules?filter=${day}&limit=25`);
  if (!res.ok) return [];
  const json = await res.json();
  return (json.data || []).map(raw => ({
    mal_id: raw.mal_id,
    title: raw.title_english || raw.title,
    cover_image: raw.images?.jpg?.large_image_url || raw.images?.jpg?.image_url || '',
    score: raw.score || 0,
    episodes: raw.episodes || 0,
    broadcast: raw.broadcast?.string || '',
    type: raw.type || 'TV',
  }));
}

export default function SeasonalCalendar() {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const [selectedDay, setSelectedDay] = useState(today);

  // Fetch all days in parallel on mount for counts, selected day for display
  const { data: allCounts } = useQuery({
    queryKey: ['schedule-counts'],
    queryFn: async () => {
      const results = await Promise.all(DAY_PARAM.map(d => fetchScheduleDay(d)));
      const map = {};
      DAYS.forEach((day, i) => { map[day] = results[i].length; });
      return map;
    },
    staleTime: 1000 * 60 * 30,
  });

  const selectedDayParam = DAY_PARAM[DAYS.indexOf(selectedDay)] || 'monday';

  const { data: dayAnime, isLoading } = useQuery({
    queryKey: ['schedule-day', selectedDay],
    queryFn: () => fetchScheduleDay(selectedDayParam),
    staleTime: 1000 * 60 * 15,
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white mb-1">Airing Schedule</h1>
          <p className="text-zinc-500 text-sm">Currently airing anime by day of the week</p>
        </div>

        {/* Day tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8">
          {DAYS.map((day, i) => {
            const count = allCounts?.[day] ?? '—';
            const isToday = day === today;
            const isActive = selectedDay === day;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`flex-shrink-0 flex flex-col items-center px-4 py-3 rounded-2xl border transition-all ${
                  isActive
                    ? 'bg-emerald-500 border-emerald-500 text-black'
                    : isToday
                    ? 'bg-zinc-800 border-emerald-500/40 text-white'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600'
                }`}
              >
                <span className="text-xs font-bold">{DAY_SHORT[i]}</span>
                <span className={`text-lg font-black leading-tight ${isActive ? 'text-black' : 'text-white'}`}>{count}</span>
                {isToday && !isActive && <span className="text-[9px] text-emerald-400 font-bold mt-0.5">TODAY</span>}
              </button>
            );
          })}
        </div>

        {/* Anime grid */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-bold text-white">{selectedDay}</h2>
            {selectedDay === today && (
              <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">Today</span>
            )}
            {dayAnime && <span className="text-zinc-600 text-sm">{dayAnime.length} anime</span>}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
          ) : !dayAnime?.length ? (
            <div className="text-center py-16 text-zinc-600">No anime scheduled for {selectedDay}</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {dayAnime.map(anime => (
                <Link key={anime.mal_id} to={`/AnimeDetail?id=${anime.mal_id}`} className="group block">
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/50 group-hover:border-emerald-500/50 transition-all mb-2">
                    {anime.cover_image
                      ? <img src={anime.cover_image} alt={anime.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      : <div className="w-full h-full bg-zinc-800 flex items-center justify-center"><Tv className="w-8 h-8 text-zinc-600" /></div>
                    }
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    {anime.score > 0 && (
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 rounded px-1.5 py-0.5">
                        <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                        <span className="text-[10px] text-yellow-300 font-bold">{anime.score}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-medium text-zinc-300 line-clamp-2 group-hover:text-emerald-400 transition-colors leading-tight">
                    {anime.title}
                  </p>
                  {anime.episodes > 0 && (
                    <p className="text-[10px] text-zinc-600 mt-0.5">{anime.episodes} eps</p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}