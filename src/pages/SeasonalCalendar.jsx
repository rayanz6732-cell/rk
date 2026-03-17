import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

async function fetchAiringAnime() {
  // Get current time and week boundaries
  const now = new Date();
  const currentDay = now.getDay();
  
  // Start of current week (Sunday)
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - currentDay);
  weekStart.setHours(0, 0, 0, 0);
  
  // End of current week (Saturday)
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  const startTimestamp = Math.floor(weekStart.getTime() / 1000);
  const endTimestamp = Math.floor(weekEnd.getTime() / 1000);

  const query = `
    query {
      Page(perPage: 100) {
        airingSchedules(
          sort: TIME
          airingAt_greater: ${startTimestamp}
          airingAt_lesser: ${endTimestamp}
        ) {
          id
          episode
          airingAt
          media {
            id
            title {
              english
              romaji
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
        // Group by day of week, avoiding duplicates
        const grouped = {};
        const seenPerDay = {}; // Track title+time combinations to avoid duplicates
        
        for (let i = 0; i < 7; i++) {
          grouped[i] = [];
          seenPerDay[i] = new Set();
        }

        data.data.Page.airingSchedules.forEach(schedule => {
          const airDate = new Date(schedule.airingAt * 1000);
          const dayOfWeek = airDate.getDay();
          const title = schedule.media.title.english || schedule.media.title.romaji;
          const timeStr = airDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });
          const uniqueKey = `${title}|${timeStr}`; // Unique key for title + time combo
          
          // Only add if we haven't seen this title at this time on this day yet
          if (!seenPerDay[dayOfWeek].has(uniqueKey)) {
            seenPerDay[dayOfWeek].add(uniqueKey);
            
            grouped[dayOfWeek].push({
              id: `${schedule.id}-${schedule.media.id}`,
              episode: schedule.episode,
              airingAt: schedule.airingAt,
              title: title,
              mediaId: schedule.media.id,
              time: timeStr,
            });
          }
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

        {/* Coming soon */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">{DAY_NAMES[selectedDay]}</h2>
          <div className="text-center py-16">
            <p className="text-xl font-semibold text-emerald-400">Coming Soon!!</p>
          </div>
        </div>
      </div>
    </div>
  );
}