import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { JikanAPI } from '../lib/jikan';
import { Link } from 'react-router-dom';
import { Star, Tv, Clock } from 'lucide-react';
import { Loader2 } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function extractDay(broadcastStr) {
  if (!broadcastStr) return null;
  for (const day of DAYS) {
    if (broadcastStr.toLowerCase().includes(day.toLowerCase())) return day;
  }
  return null;
}

export default function SeasonalCalendar() {
  const [selectedDay, setSelectedDay] = useState(null);

  const { data: seasonData, isLoading } = useQuery({
    queryKey: ['season-calendar'],
    queryFn: async () => {
      const page1 = await JikanAPI.getCurrentSeason(1);
      const page2 = await JikanAPI.getCurrentSeason(2);
      return [...(page1.data || []), ...(page2.data || [])];
    },
    staleTime: 1000 * 60 * 30,
  });

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  const grouped = React.useMemo(() => {
    if (!seasonData) return {};
    const map = {};
    DAYS.forEach(d => map[d] = []);
    map['Unknown'] = [];
    seasonData.forEach(anime => {
      const day = extractDay(anime.broadcast);
      if (day) map[day].push(anime);
      else map['Unknown'].push(anime);
    });
    return map;
  }, [seasonData]);

  const activeDays = DAYS.filter(d => grouped[d]?.length > 0);
  const displayDay = selectedDay || today;

  if (isLoading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white mb-1">Seasonal Calendar</h1>
          <p className="text-zinc-500 text-sm">This season's airing schedule by day</p>
        </div>

        {/* Day tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
          {DAYS.map((day, i) => {
            const count = grouped[day]?.length || 0;
            const isToday = day === today;
            const isActive = displayDay === day;
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

        {/* Anime grid for selected day */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-bold text-white">{displayDay}</h2>
            {displayDay === today && (
              <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">Today</span>
            )}
            <span className="text-zinc-600 text-sm">{grouped[displayDay]?.length || 0} anime</span>
          </div>

          {(grouped[displayDay]?.length || 0) === 0 ? (
            <div className="text-center py-16 text-zinc-600">No anime airing on {displayDay} this season</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {grouped[displayDay].map(anime => (
                <Link
                  key={anime.mal_id}
                  to={`/AnimeDetail?id=${anime.mal_id}`}
                  className="group block"
                >
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
                    {anime.broadcast && (
                      <div className="absolute top-2 right-2 bg-emerald-500/90 text-black text-[9px] font-bold px-1.5 py-0.5 rounded">
                        {anime.broadcast.replace(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\w*\s*at\s*/i, '')}
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