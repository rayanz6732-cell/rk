import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { JikanAPI } from '../lib/jikan';
import HeroBanner from '../components/anime/HeroBanner';
import AnimeSection from '../components/anime/AnimeSection';
import TrendingSidebar from '../components/anime/TrendingSidebar';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { data: currentSeason, isLoading: loadingSeason } = useQuery({
    queryKey: ['current-season'],
    queryFn: () => JikanAPI.getCurrentSeason(),
    staleTime: 1000 * 60 * 15, // 15 min cache
  });

  const { data: topAiring, isLoading: loadingTop } = useQuery({
    queryKey: ['top-airing'],
    queryFn: () => JikanAPI.getTopAiring(),
    staleTime: 1000 * 60 * 15,
  });

  const { data: mostPopular, isLoading: loadingPopular } = useQuery({
    queryKey: ['most-popular'],
    queryFn: () => JikanAPI.getMostPopular(),
    staleTime: 1000 * 60 * 30,
  });

  const { data: upcoming } = useQuery({
    queryKey: ['upcoming'],
    queryFn: () => JikanAPI.getTopUpcoming(),
    staleTime: 1000 * 60 * 30,
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

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 min-w-0">
            <AnimeSection
              title="Currently Airing This Season"
              anime={latestUpdates.slice(0, 12)}
              icon="📺"
              viewAllLink="/Search?filter=season"
            />
            <AnimeSection
              title="Top Rated Right Now"
              anime={trending.slice(0, 12)}
              icon="⭐"
              viewAllLink="/Search?filter=top"
            />
            <AnimeSection
              title="Most Popular"
              anime={popular.slice(0, 12)}
              icon="🔥"
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