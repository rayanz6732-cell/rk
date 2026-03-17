import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const BASE = 'https://api.jikan.moe/v4';

async function fetchDayAnime(day) {
  try {
    const res = await fetch(`${BASE}/anime?status=airing&order_by=score&sort=desc&limit=50`);
    if (res.ok) {
      const json = await res.json();
      const dayLower = day.toLowerCase();
      
      const anime = (json.data || [])
        .filter(raw => raw.broadcast?.day_of_week?.toLowerCase() === dayLower)
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .map(raw => ({
          mal_id: raw.mal_id,
          title: raw.title_english || raw.title,
          episodes: raw.episodes || 0,
          time: raw.broadcast?.time || '--:--',
        }));
      
      return anime;
    }
  } catch (e) {
    console.error('Error:', e);
  }
  return [];
}

export default function SeasonalCalendar() {
  const today = new Date().getDay();
  const todayIndex = today === 0 ? 6 : today - 1;
  const selectedDayName = DAY_NAMES[todayIndex];
  const [selectedDayIndex, setSelectedDayIndex] = useState(todayIndex);

  const { data: allDays = {}, isLoading } = useQuery({
    queryKey: ['all-schedules'],
    queryFn: async () => {
      const results = await Promise.all(DAYS.map(d => fetchDayAnime(d)));
      const map = {};
      DAYS.forEach((day, i) => {
        map[DAY_NAMES[i]] = results[i];
      });
      return map;
    },
    staleTime: 1000 * 60 * 30,
  });

  const dayAnime = allDays[DAY_NAMES[selectedDayIndex]] || [];

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Day selector */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => setSelectedDayIndex((selectedDayIndex - 1 + 7) % 7)}
            className="p-2 text-zinc-500 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex gap-2">
            {DAY_NAMES.map((day, i) => {
              const isActive = selectedDayIndex === i;
              const count = allDays[day]?.length || 0;
              
              // Get date for this day
              const date = new Date();
              const dayDiff = i - todayIndex;
              date.setDate(date.getDate() + dayDiff);
              const dateNum = date.getDate();
              
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDayIndex(i)}
                  className={`flex flex-col items-center px-3 py-2 rounded-lg transition-all ${
                    isActive
                      ? 'bg-emerald-500 text-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <span className="text-xs font-bold">{DAY_SHORT[i]}</span>
                  <span className="text-lg font-black">{dateNum}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setSelectedDayIndex((selectedDayIndex + 1) % 7)}
            className="p-2 text-zinc-500 hover:text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Anime list */}
        <div>
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
          ) : !dayAnime.length ? (
            <div className="text-center py-16 text-zinc-600">No anime scheduled for {DAY_NAMES[selectedDayIndex]}</div>
          ) : (
            <div className="space-y-2">
              {dayAnime.map((anime, idx) => (
                <Link
                  key={`${anime.mal_id}-${idx}`}
                  to={`/AnimeDetail?id=${anime.mal_id}`}
                  className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-zinc-800/50 transition-colors group"
                >
                  <span className="text-zinc-500 text-sm font-medium w-12 flex-shrink-0">{anime.time}</span>
                  <span className="text-zinc-300 group-hover:text-emerald-400 transition-colors flex-1 line-clamp-1">
                    {anime.title}
                  </span>
                  <span className="text-zinc-600 text-sm font-medium flex-shrink-0">EP {anime.episodes}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}