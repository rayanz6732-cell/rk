import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

async function fetchAiringAnime() {
  const query = `
    query {
      Page(perPage: 50) {
        airingSchedules(sort: TIME, notYetAired: false) {
          id
          episode
          airingAt
          media {
            id
            title {
              english
              romaji
            }
            coverImage {
              large
            }
          }
        }
      }
    }
  `;

  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.data?.Page?.airingSchedules) {
        // Group by day of week
        const grouped = {};
        for (let i = 0; i < 7; i++) {
          grouped[i] = [];
        }

        data.data.Page.airingSchedules.forEach(schedule => {
          const airDate = new Date(schedule.airingAt * 1000);
          const dayOfWeek = airDate.getDay();
          
          grouped[dayOfWeek].push({
            id: schedule.id,
            episode: schedule.episode,
            airingAt: schedule.airingAt,
            title: schedule.media.title.english || schedule.media.title.romaji,
            mediaId: schedule.media.id,
            cover: schedule.media.coverImage?.large,
            time: airDate.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            }),
          });
        });

        // Sort each day by time
        Object.keys(grouped).forEach(day => {
          grouped[day].sort((a, b) => a.airingAt - b.airingAt);
        });

        return grouped;
      }
    }
  } catch (e) {
    console.error('Error fetching from AniList:', e);
  }

  return { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
}

export default function SeasonalCalendar() {
  const today = new Date().getDay();
  const [selectedDay, setSelectedDay] = useState(today);

  const { data: scheduleByDay = {}, isLoading } = useQuery({
    queryKey: ['airing-schedule'],
    queryFn: fetchAiringAnime,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  const dayAnime = scheduleByDay[selectedDay] || [];

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Day selector */}
        <div className="flex items-center justify-between mb-8 gap-2">
          <button
            onClick={() => setSelectedDay((selectedDay - 1 + 7) % 7)}
            className="p-2 text-zinc-500 hover:text-white transition-colors flex-shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex gap-2 flex-1 overflow-x-auto justify-center">
            {DAY_NAMES.map((day, i) => (
              <button
                key={day}
                onClick={() => setSelectedDay(i)}
                className={`flex flex-col items-center px-3 py-2 rounded-lg transition-all flex-shrink-0 ${
                  selectedDay === i
                    ? 'bg-emerald-500 text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span className="text-xs font-bold">{DAY_SHORT[i]}</span>
                <span className="text-lg font-black">{day.slice(0, 1)}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setSelectedDay((selectedDay + 1) % 7)}
            className="p-2 text-zinc-500 hover:text-white transition-colors flex-shrink-0"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Anime list */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">{DAY_NAMES[selectedDay]}</h2>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
          ) : !dayAnime.length ? (
            <div className="text-center py-16 text-zinc-600">
              No anime airing on {DAY_NAMES[selectedDay]}
            </div>
          ) : (
            <div className="space-y-2">
              {dayAnime.map((anime) => (
                <Link
                  key={anime.id}
                  to={`/AnimeDetail?id=${anime.mediaId}`}
                  className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-zinc-800/50 transition-colors group"
                >
                  <span className="text-zinc-500 text-sm font-medium w-12 flex-shrink-0">
                    {anime.time}
                  </span>
                  <span className="text-zinc-300 group-hover:text-emerald-400 transition-colors flex-1 line-clamp-1">
                    {anime.title}
                  </span>
                  <span className="text-zinc-600 text-sm font-medium flex-shrink-0">
                    EP {anime.episode}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}