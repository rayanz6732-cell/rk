import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { JikanAPI } from '../lib/jikan';
import HeroBanner from '../components/anime/HeroBanner';
import AnimeSection from '../components/anime/AnimeSection';
import TrendingSidebar from '../components/anime/TrendingSidebar';
import { Loader2, Play } from 'lucide-react';
import SignupSection from '../components/anime/SignupSection.jsx';

export default function Home() {
  const [continueWatching, setContinueWatching] = useState([]);

  useEffect(() => {
    const allKeys = Object.keys(localStorage).filter(key => key.startsWith('rk_progress_'));
    const watching = allKeys.map(key => {
      const match = key.match(/rk_progress_(\d+)_ep(\d+)/);
      if (!match) return null;
      return { mal_id: parseInt(match[1]), episode: parseInt(match[2]) };
    }).filter(Boolean);

    // Get highest episode per anime
    const byAnime = {};
    watching.forEach(({ mal_id, episode }) => {
      if (!byAnime[mal_id] || episode > byAnime[mal_id]) byAnime[mal_id] = episode;
    });

    const uniqueIds = Object.keys(byAnime).slice(0, 6);
    if (uniqueIds.length > 0) {
      Promise.all(uniqueIds.map(id => JikanAPI.getById(id).catch(() => null)))
        .then(results => {
          const enriched = results.filter(Boolean).map(a => ({ ...a, lastEpisode: byAnime[a.mal_id] }));
          setContinueWatching(enriched);
        })
        .catch(() => {});
    }
  }, []);

  const { data: currentSeason, isLoading: loadingSeason } = useQuery({
    queryKey: ['current-season'],
    queryFn: () => JikanAPI.getCurrentSeason(),
    staleTime: 1000 * 60 * 60, // 1 hour cache
  });

  const { data: topAiring, isLoading: loadingTop } = useQuery({
    queryKey: ['top-airing'],
    queryFn: () => JikanAPI.getTopAiring(),
    staleTime: 1000 * 60 * 60,
  });

  const { data: mostPopular } = useQuery({
    queryKey: ['most-popular'],
    queryFn: () => JikanAPI.getMostPopular(),
    staleTime: 1000 * 60 * 60,
  });

  const { data: upcoming } = useQuery({
    queryKey: ['upcoming'],
    queryFn: () => JikanAPI.getTopUpcoming(),
    staleTime: 1000 * 60 * 60,
  });

  const isLoading = loadingSeason && loadingTop;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-zinc-500 text-sm">Loading live anime data...</p>
      </div>
    );
  }

  const featured = topAiring?.data?.slice(0, 8) || [];
  const trending = topAiring?.data?.slice(0, 10) || [];
  const latestUpdates = currentSeason?.data || [];
  const popular = mostPopular?.data || [];
  const upcomingList = upcoming || [];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <HeroBanner featured={featured} />

      <div className="container mx-auto px-4 md:px-8 max-w-7xl -mt-12 relative z-10">
        {/* Live indicator */}
        <div className="flex items-center gap-2 justify-end mb-4">
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live data from MyAnimeList
          </span>
        </div>

        {/* Signup Section */}
        <SignupSection />

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 min-w-0">
            {continueWatching.length > 0 && (
              <div className="mb-12">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  Continue Watching
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {continueWatching.map((anime) => (
                    <Link
                      key={anime.mal_id}
                      to={`/AnimeDetail?id=${anime.mal_id}`}
                      className="group relative block rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/50 hover:border-emerald-500/60 transition-all"
                    >
                      <div className="relative aspect-[3/4]">
                        <img
                          src={anime.cover_image}
                          alt={anime.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-10 h-10 rounded-full bg-emerald-500/90 flex items-center justify-center shadow-lg">
                            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                          </div>
                        </div>
                      </div>
                      <div className="px-2 py-2">
                        <p className="text-xs text-zinc-400 line-clamp-2 group-hover:text-emerald-400 transition-colors">
                          {anime.title}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            <AnimeSection
              title="Currently Airing This Season"
              anime={latestUpdates.slice(0, 12)}
              viewAllLink="/Search?filter=season"
            />
            <AnimeSection
              title="Top Rated Right Now"
              anime={trending.slice(0, 12)}
              viewAllLink="/Search?filter=top"
            />
            <AnimeSection
              title="Most Popular"
              anime={popular.slice(0, 12)}
              viewAllLink="/Search?filter=popular"
            />
            {upcomingList.length > 0 && (
              <AnimeSection
                title="Coming Soon"
                anime={upcomingList.slice(0, 6)}
                icon="🗓️"
              />
            )}
          </div>

          <div className="w-full lg:w-72 xl:w-80 flex-shrink-0">
            <div className="sticky top-20">
              <TrendingSidebar trending={trending} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}