import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, Play, Star, Captions, Mic, Calendar, Tv, Tag, Clock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function AnimeDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');

  const { data: anime, isLoading } = useQuery({
    queryKey: ['anime-detail', id],
    queryFn: async () => {
      const list = await base44.entities.Anime.filter({ id });
      return list[0] || null;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="h-[50vh] bg-zinc-900 animate-pulse" />
        <div className="container mx-auto max-w-7xl px-6 -mt-32 relative z-10 space-y-4">
          <Skeleton className="h-10 w-96 bg-zinc-800" />
          <Skeleton className="h-4 w-64 bg-zinc-800" />
          <Skeleton className="h-24 w-full max-w-2xl bg-zinc-800" />
        </div>
      </div>
    );
  }

  if (!anime) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
        <p className="text-zinc-500">Anime not found</p>
        <Link to="/Home">
          <Button variant="outline" className="border-zinc-800 text-zinc-400 gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Banner */}
      <div className="relative h-[50vh] min-h-[360px]">
        {anime.banner_image || anime.cover_image ? (
          <img
            src={anime.banner_image || anime.cover_image}
            alt={anime.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-950 to-zinc-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/80 to-transparent" />
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-7xl px-4 md:px-8 -mt-48 relative z-10">
        <Link to="/Home" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-emerald-400 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <div className="w-48 md:w-56 flex-shrink-0">
            <div className="aspect-[3/4] rounded-xl overflow-hidden bg-zinc-900 shadow-2xl shadow-black/50">
              {anime.cover_image ? (
                <img src={anime.cover_image} alt={anime.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-emerald-900/30 to-zinc-900 flex items-center justify-center">
                  <Play className="w-12 h-12 text-emerald-500/30" />
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            {/* Tags */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {anime.rating && (
                <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {anime.rating}
                </span>
              )}
              {anime.quality && (
                <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-violet-500/20 text-violet-400">
                  {anime.quality}
                </span>
              )}
              {anime.type && (
                <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-800 text-zinc-400">
                  {anime.type}
                </span>
              )}
              {anime.status && (
                <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                  anime.status === 'ongoing' ? 'bg-blue-500/20 text-blue-400' :
                  anime.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                  'bg-orange-500/20 text-orange-400'
                }`}>
                  {anime.status.charAt(0).toUpperCase() + anime.status.slice(1)}
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight mb-4">
              {anime.title}
            </h1>

            {/* Score */}
            {anime.score > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <span className="text-xl font-bold text-white">{anime.score}</span>
                <span className="text-sm text-zinc-600">/ 10</span>
              </div>
            )}

            {/* Genres */}
            {anime.genres?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {anime.genres.map(g => (
                  <Link
                    key={g}
                    to={`/Search?q=${encodeURIComponent(g)}`}
                    className="px-3 py-1 rounded-lg text-xs font-medium bg-zinc-800/80 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 transition-colors"
                  >
                    {g}
                  </Link>
                ))}
              </div>
            )}

            {/* Info grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {anime.release_year && (
                <div className="bg-zinc-900/60 rounded-xl p-3 border border-zinc-800/50">
                  <div className="flex items-center gap-1.5 text-zinc-600 text-xs mb-1">
                    <Calendar className="w-3 h-3" /> Release
                  </div>
                  <p className="text-white font-semibold">{anime.release_year}</p>
                </div>
              )}
              {anime.episodes > 0 && (
                <div className="bg-zinc-900/60 rounded-xl p-3 border border-zinc-800/50">
                  <div className="flex items-center gap-1.5 text-zinc-600 text-xs mb-1">
                    <Tv className="w-3 h-3" /> Episodes
                  </div>
                  <p className="text-white font-semibold">{anime.episodes}</p>
                </div>
              )}
              {anime.sub_episodes > 0 && (
                <div className="bg-zinc-900/60 rounded-xl p-3 border border-zinc-800/50">
                  <div className="flex items-center gap-1.5 text-violet-400 text-xs mb-1">
                    <Captions className="w-3 h-3" /> Sub
                  </div>
                  <p className="text-white font-semibold">{anime.sub_episodes} eps</p>
                </div>
              )}
              {anime.dub_episodes > 0 && (
                <div className="bg-zinc-900/60 rounded-xl p-3 border border-zinc-800/50">
                  <div className="flex items-center gap-1.5 text-blue-400 text-xs mb-1">
                    <Mic className="w-3 h-3" /> Dub
                  </div>
                  <p className="text-white font-semibold">{anime.dub_episodes} eps</p>
                </div>
              )}
            </div>

            {/* Description */}
            {anime.description && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">Synopsis</h3>
                <p className="text-zinc-400 leading-relaxed">{anime.description}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              {anime.watch_url && (
                <a href={anime.watch_url} target="_blank" rel="noopener noreferrer">
                  <Button className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-8 py-5 rounded-xl gap-2 shadow-lg shadow-emerald-500/20">
                    <Play className="w-4 h-4 fill-black" /> Watch Now
                  </Button>
                </a>
              )}
              <a href={`https://animekai.to/search?keyword=${encodeURIComponent(anime.title)}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="border-zinc-700 bg-white/5 hover:bg-white/10 text-zinc-300 px-6 py-5 rounded-xl gap-2">
                  <ExternalLink className="w-4 h-4" /> Watch on AnimeKai
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}