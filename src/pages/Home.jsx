import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import HeroBanner from '../components/anime/HeroBanner';
import AnimeSection from '../components/anime/AnimeSection';
import TrendingSidebar from '../components/anime/TrendingSidebar';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [syncing, setSyncing] = useState(false);

  const { data: allAnime = [], isLoading, refetch } = useQuery({
    queryKey: ['anime-all'],
    queryFn: () => base44.entities.Anime.list('-created_date', 100),
  });

  const featured = allAnime.filter(a => a.is_featured).slice(0, 10);
  const trending = allAnime.filter(a => a.is_trending).slice(0, 10);
  const latestUpdates = [...allAnime].sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date)).slice(0, 12);
  const ongoing = allAnime.filter(a => a.status === 'ongoing').slice(0, 12);
  const recommended = allAnime.filter(a => (a.score || 0) >= 7).slice(0, 12);

  const syncAnime = async () => {
    setSyncing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an anime database expert. Provide me a list of 20 currently popular and trending anime shows as of 2026, including ongoing shows and recent releases. For each anime provide:
- title (exact official English title)
- description (2-3 sentence synopsis)
- genres (array of genres like Action, Fantasy, etc.)
- status (ongoing, completed, or upcoming)
- type (TV, Movie, OVA, ONA, Special)
- rating (PG-13, R, etc.)
- release_year (number)
- episodes (total episodes so far)
- latest_episode (most recent episode number)
- score (rating out of 10, like 8.5)
- is_featured (true for top 5 most popular)
- is_trending (true for top 10 trending)
- quality (HD or FHD)
- sub_episodes (number of subbed episodes)
- dub_episodes (number of dubbed episodes, usually less than sub)

Include shows like: Hell's Paradise Season 2, Jujutsu Kaisen The Culling Game, Frieren Season 2, Fire Force Season 3, One Piece, Solo Leveling, Demon Slayer, Attack on Titan, Naruto, Bleach, My Hero Academia, and other currently popular anime. Make the data realistic and current.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            anime_list: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  genres: { type: "array", items: { type: "string" } },
                  status: { type: "string" },
                  type: { type: "string" },
                  rating: { type: "string" },
                  release_year: { type: "number" },
                  episodes: { type: "number" },
                  latest_episode: { type: "number" },
                  score: { type: "number" },
                  is_featured: { type: "boolean" },
                  is_trending: { type: "boolean" },
                  quality: { type: "string" },
                  sub_episodes: { type: "number" },
                  dub_episodes: { type: "number" }
                }
              }
            }
          }
        },
        model: "gemini_3_flash"
      });

      if (result?.anime_list?.length) {
        // Get existing titles to avoid duplicates
        const existingTitles = new Set(allAnime.map(a => a.title.toLowerCase()));
        const newAnime = result.anime_list.filter(a => !existingTitles.has(a.title.toLowerCase()));
        
        if (newAnime.length > 0) {
          await base44.entities.Anime.bulkCreate(newAnime);
        }
        
        refetch();
      }
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      setSyncing(false);
    }
  };

  // Auto-sync if empty
  useEffect(() => {
    if (!isLoading && allAnime.length === 0) {
      syncAnime();
    }
  }, [isLoading, allAnime.length]);

  if (isLoading || (syncing && allAnime.length === 0)) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-zinc-500 text-sm">{syncing ? 'Syncing anime data...' : 'Loading...'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero Banner */}
      <HeroBanner featured={featured.length > 0 ? featured : allAnime.slice(0, 5)} />

      {/* Main content */}
      <div className="container mx-auto px-4 md:px-8 max-w-7xl -mt-12 relative z-10">
        {/* Sync button */}
        <div className="flex justify-end mb-4">
          <Button
            onClick={syncAnime}
            disabled={syncing}
            variant="outline"
            size="sm"
            className="bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/30 gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Latest'}
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main column */}
          <div className="flex-1 min-w-0">
            <AnimeSection title="Latest Updates" anime={latestUpdates} icon="🔥" viewAllLink="/Search?filter=new" />
            <AnimeSection title="Recommended For You" anime={recommended} icon="⭐" />
            <AnimeSection title="Currently Airing" anime={ongoing} icon="📺" viewAllLink="/Search?filter=ongoing" />
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-72 xl:w-80 flex-shrink-0">
            <div className="sticky top-20">
              <TrendingSidebar trending={trending.length > 0 ? trending : allAnime.slice(0, 5)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}