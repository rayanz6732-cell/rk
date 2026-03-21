import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { JikanAPI } from '../lib/jikan';
import AnimeCard from '../components/anime/AnimeCard';
import {
  ArrowLeft, Play, Star, Captions, Mic, Calendar, Tv,
  Clock, Users, TrendingUp, Award, ChevronDown, ChevronUp
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import StarRating from '../components/anime/StarRating';
import SeasonCard from '../components/anime/SeasonCard';

export default function AnimeDetail() {
  const [searchParams] = useSearchParams();
  const mal_id = searchParams.get('id');
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [epPage, setEpPage] = useState(1);
  const [epJump, setEpJump] = useState('');

  useEffect(() => {
    setShowFullDesc(false);
    setEpPage(1);
    window.scrollTo(0, 0);
  }, [mal_id]);

  const { data: anime, isLoading } = useQuery({
    queryKey: ['anime-detail', mal_id],
    queryFn: () => JikanAPI.getById(mal_id),
    enabled: !!mal_id,
    staleTime: 1000 * 60 * 60,
  });

  const { data: characters } = useQuery({
    queryKey: ['anime-chars', mal_id],
    queryFn: () => JikanAPI.getCharacters(mal_id),
    enabled: !!mal_id,
    staleTime: 1000 * 60 * 60,
  });

  const { data: recommendations } = useQuery({
    queryKey: ['anime-recs', mal_id],
    queryFn: () => JikanAPI.getRecommendations(mal_id),
    enabled: !!mal_id,
    staleTime: 1000 * 60 * 60,
  });

  const { data: relations } = useQuery({
    queryKey: ['anime-relations', mal_id],
    queryFn: async () => {
      const visited = new Set([String(mal_id)]);
      const allSequels = [];
      const queue = [mal_id];
      while (queue.length > 0) {
        const currentId = queue.shift();
        const data = await JikanAPI.getRelations(currentId);
        const sequels = (data || [])
          .filter(r => r.relation === 'Sequel')
          .flatMap(r => r.entry.filter(e => e.type === 'anime'));
        for (const s of sequels) {
          if (!visited.has(String(s.mal_id))) {
            visited.add(String(s.mal_id));
            allSequels.push(s);
            queue.push(s.mal_id);
          }
        }
      }
      return allSequels;
    },
    enabled: !!mal_id,
    staleTime: 1000 * 60 * 60,
  });

  const { data: episodesData } = useQuery({
    queryKey: ['anime-episodes', mal_id, epPage],
    queryFn: () => JikanAPI.getEpisodes(mal_id, epPage),
    enabled: !!mal_id,
    staleTime: 1000 * 60 * 60,
  });

  const seasonEntries = relations || [];
  const episodes = episodesData?.data || [];
  const hasNextEpPage = episodesData?.pagination?.has_next_page || false;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="h-[50vh] bg-zinc-900/50 animate-pulse" />
        <div className="container mx-auto max-w-7xl px-6 -mt-32 relative z-10 space-y-4">
          <Skeleton className="h-12 w-96 bg-zinc-800" />
          <Skeleton className="h-4 w-64 bg-zinc-800" />
          <Skeleton className="h-32 w-full max-w-2xl bg-zinc-800" />
        </div>
      </div>
    );
  }

  if (!anime) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
        <p className="text-zinc-500">Anime not found</p>
        <Link to="/Home"><Button variant="outline" className="border-zinc-800 text-zinc-400 gap-2"><ArrowLeft className="w-4 h-4" />Back</Button></Link>
      </div>
    );
  }

  const desc = anime.description || '';
  const shortDesc = desc.length > 400 ? desc.slice(0, 400) + '...' : desc;
  const statusColor = anime.status === 'ongoing' ? 'bg-blue-500/20 text-blue-400' : anime.status === 'upcoming' ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400';

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Banner */}
      <div className="relative h-[55vh] min-h-[380px]">
        {anime.cover_image ? (
          <>
            <img src={anime.cover_image} alt={anime.title} className="w-full h-full object-cover object-top" style={{ filter: 'blur(2px) brightness(0.4)' }} />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent" />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-950 to-zinc-950" />
        )}
      </div>

      <div className="container mx-auto max-w-7xl px-4 md:px-8 -mt-56 relative z-10">
        <Link to={-1} className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-emerald-400 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <div className="w-44 md:w-52 flex-shrink-0">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-900 shadow-2xl shadow-black/70 border border-zinc-800/50">
              {anime.cover_image
                ? <img src={anime.cover_image} alt={anime.title} className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-gradient-to-br from-emerald-900/30 to-zinc-900 flex items-center justify-center"><Play className="w-12 h-12 text-emerald-500/30" /></div>
              }
            </div>

            {anime.score > 0 && (
              <div className="mt-3 bg-zinc-900/80 rounded-xl p-3 border border-zinc-800/50 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-2xl font-black text-white">{anime.score}</span>
                </div>
                <p className="text-xs text-zinc-600">{(anime.scored_by / 1000).toFixed(0)}K ratings</p>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {anime.rating && <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">{anime.rating}</span>}
              {anime.type && <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-zinc-800 text-zinc-400">{anime.type}</span>}
              {anime.status && <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${statusColor}`}>{anime.status === 'ongoing' ? 'Currently Airing' : anime.status === 'upcoming' ? 'Upcoming' : 'Completed'}</span>}
              {anime.season && <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-violet-500/20 text-violet-400 capitalize">{anime.season} {anime.release_year}</span>}
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight mb-2">
              {anime.title}
            </h1>
            {anime.title_japanese && (
              <p className="text-zinc-600 text-sm mb-4">{anime.title_japanese}</p>
            )}

            {anime.genres?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {anime.genres.map(g => (
                  <Link key={g} to={`/Search?q=${encodeURIComponent(g)}`}
                    className="px-3 py-1 rounded-lg text-xs font-medium bg-zinc-800/80 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 transition-colors">
                    {g}
                  </Link>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {anime.release_year && (
                <div className="bg-zinc-900/60 rounded-xl p-3 border border-zinc-800/50">
                  <div className="flex items-center gap-1.5 text-zinc-600 text-xs mb-1"><Calendar className="w-3 h-3" /> Year</div>
                  <p className="text-white font-bold">{anime.release_year}</p>
                </div>
              )}
              {anime.episodes > 0 && (
                <div className="bg-zinc-900/60 rounded-xl p-3 border border-zinc-800/50">
                  <div className="flex items-center gap-1.5 text-zinc-600 text-xs mb-1"><Tv className="w-3 h-3" /> Episodes</div>
                  <p className="text-white font-bold">{anime.episodes}</p>
                </div>
              )}
              {anime.duration && (
                <div className="bg-zinc-900/60 rounded-xl p-3 border border-zinc-800/50">
                  <div className="flex items-center gap-1.5 text-zinc-600 text-xs mb-1"><Clock className="w-3 h-3" /> Duration</div>
                  <p className="text-white font-bold text-xs">{anime.duration}</p>
                </div>
              )}
              {anime.rank > 0 && (
                <div className="bg-zinc-900/60 rounded-xl p-3 border border-zinc-800/50">
                  <div className="flex items-center gap-1.5 text-zinc-600 text-xs mb-1"><Award className="w-3 h-3" /> MAL Rank</div>
                  <p className="text-white font-bold">#{anime.rank}</p>
                </div>
              )}
              {anime.members > 0 && (
                <div className="bg-zinc-900/60 rounded-xl p-3 border border-zinc-800/50">
                  <div className="flex items-center gap-1.5 text-zinc-600 text-xs mb-1"><Users className="w-3 h-3" /> Members</div>
                  <p className="text-white font-bold">{(anime.members / 1000).toFixed(0)}K</p>
                </div>
              )}
              {anime.studios?.length > 0 && (
                <div className="bg-zinc-900/60 rounded-xl p-3 border border-zinc-800/50 col-span-2">
                  <div className="flex items-center gap-1.5 text-zinc-600 text-xs mb-1"><TrendingUp className="w-3 h-3" /> Studio</div>
                  <p className="text-white font-bold text-sm">{anime.studios.join(', ')}</p>
                </div>
              )}
              {anime.broadcast && (
                <div className="bg-zinc-900/60 rounded-xl p-3 border border-zinc-800/50 col-span-2">
                  <div className="flex items-center gap-1.5 text-zinc-600 text-xs mb-1"><Tv className="w-3 h-3" /> Broadcast</div>
                  <p className="text-white font-bold text-xs">{anime.broadcast}</p>
                </div>
              )}
            </div>

            {desc && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">Synopsis</h3>
                <p className="text-zinc-400 leading-relaxed text-sm">
                  {showFullDesc ? desc : shortDesc}
                </p>
                {desc.length > 400 && (
                  <button onClick={() => setShowFullDesc(!showFullDesc)}
                    className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 mt-2 transition-colors">
                    {showFullDesc ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Read more</>}
                  </button>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-3 mb-4">
              <Link to={`/Watch?id=${mal_id}&ep=1&title=${encodeURIComponent(anime.title)}`}>
                <Button className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-8 py-5 rounded-xl gap-2 shadow-lg shadow-emerald-500/20">
                  <Play className="w-4 h-4 fill-black" /> Watch Now
                </Button>
              </Link>
            </div>

            <StarRating mal_id={mal_id} animeTitle={anime.title} />
          </div>
        </div>

        {/* Episodes */}
        <div className="mt-12">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-xl font-bold text-white">Episodes</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const num = parseInt(epJump, 10);
                if (num > 0) window.location.href = `/Watch?id=${mal_id}&ep=${num}&title=${encodeURIComponent(anime.title)}`;
              }}
              className="flex items-center gap-2"
            >
              <input
                type="number"
                min="1"
                value={epJump}
                onChange={e => setEpJump(e.target.value)}
                placeholder="Jump to ep..."
                className="w-32 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold rounded-xl transition-colors"
              >
                Go
              </button>
            </form>
          </div>

          {episodes.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {episodes.map((ep) => (
                  <Link
                    key={ep.mal_id}
                    to={`/Watch?id=${mal_id}&ep=${ep.episode_id || ep.mal_id}&title=${encodeURIComponent(anime.title)}`}
                    className="group relative block rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/50 hover:border-emerald-500/60 transition-all"
                  >
                    <div className="relative aspect-video">
                      <img
                        src={ep.images?.jpg?.image_url || anime.cover_image}
                        alt={`Episode ${ep.mal_id}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/90 flex items-center justify-center shadow-lg">
                          <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                        </div>
                      </div>
                      <div className="absolute bottom-2 right-2 text-white font-black text-lg leading-none drop-shadow-lg">
                        {ep.mal_id}
                      </div>
                      {ep.filler && (
                        <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-yellow-500/80 text-black">
                          FILLER
                        </div>
                      )}
                    </div>
                    <div className="px-2 py-2">
                      <p className="text-xs text-zinc-400 line-clamp-1 group-hover:text-emerald-400 transition-colors">
                        {ep.title || `Episode ${ep.mal_id}`}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
              {hasNextEpPage && (
                <Button
                  variant="outline"
                  onClick={() => setEpPage(p => p + 1)}
                  className="mt-4 border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white rounded-xl w-full"
                >
                  Load More Episodes
                </Button>
              )}
            </>
          ) : (
            <p className="text-zinc-600 text-sm">No episodes found.</p>
          )}
        </div>

        {/* Characters */}
        {characters?.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-white mb-4">Characters</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {characters.map((c) => (
                <div key={c.character?.mal_id} className="text-center">
                  <div className="aspect-square rounded-xl overflow-hidden bg-zinc-900 mb-2">
                    {c.character?.images?.jpg?.image_url
                      ? <img src={c.character.images.jpg.image_url} alt={c.character.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-zinc-800" />
                    }
                  </div>
                  <p className="text-xs text-zinc-500 line-clamp-1">{c.character?.name}</p>
                  <p className="text-[10px] text-zinc-700 line-clamp-1">{c.role}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Other Seasons */}
        {seasonEntries.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-white mb-4">More Seasons</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {seasonEntries.map((entry, idx) => (
                <SeasonCard key={entry.mal_id} entry={entry} seasonNumber={idx + 2} />
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommendations?.length > 0 && (
          <div className="mt-12 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">You Might Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {recommendations.slice(0, 12).map((rec) => (
                <AnimeCard key={rec.mal_id} anime={rec} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}