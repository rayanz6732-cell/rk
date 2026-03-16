import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import AnimeCard from '../components/anime/AnimeCard';
import { Search as SearchIcon, Loader2, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const GENRES = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Romance', 'Sci-Fi', 'Shounen', 'Slice of Life', 'Sports', 'Thriller', 'Mystery'];
const STATUSES = ['ongoing', 'completed', 'upcoming'];
const TYPES = ['TV', 'Movie', 'OVA', 'ONA', 'Special'];

export default function Search() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialQuery = urlParams.get('q') || '';
  const initialFilter = urlParams.get('filter') || '';

  const [query, setQuery] = useState(initialQuery);
  const [searchText, setSearchText] = useState(initialQuery);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(initialFilter === 'ongoing' ? 'ongoing' : '');
  const [selectedType, setSelectedType] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [aiSearching, setAiSearching] = useState(false);

  const { data: allAnime = [], isLoading } = useQuery({
    queryKey: ['anime-search'],
    queryFn: () => base44.entities.Anime.list('-created_date', 200),
  });

  // Filter locally
  const filtered = allAnime.filter(anime => {
    const matchesQuery = !query || anime.title?.toLowerCase().includes(query.toLowerCase()) ||
      anime.description?.toLowerCase().includes(query.toLowerCase()) ||
      anime.genres?.some(g => g.toLowerCase().includes(query.toLowerCase()));
    const matchesGenre = !selectedGenre || anime.genres?.includes(selectedGenre);
    const matchesStatus = !selectedStatus || anime.status === selectedStatus;
    const matchesType = !selectedType || anime.type === selectedType;
    return matchesQuery && matchesGenre && matchesStatus && matchesType;
  });

  // Sort based on filter
  const sorted = [...filtered].sort((a, b) => {
    if (initialFilter === 'trending') return (b.is_trending ? 1 : 0) - (a.is_trending ? 1 : 0);
    if (initialFilter === 'new') return (b.release_year || 0) - (a.release_year || 0);
    return (b.score || 0) - (a.score || 0);
  });

  const handleSearch = (e) => {
    e.preventDefault();
    setQuery(searchText);
  };

  // AI-powered search for anime not in database
  const aiSearch = async () => {
    if (!query.trim()) return;
    setAiSearching(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Search for anime matching: "${query}". Return up to 10 anime results with these fields for each: title, description (2 sentences), genres (array), status (ongoing/completed/upcoming), type (TV/Movie/OVA/ONA/Special), rating, release_year, episodes, latest_episode, score (out of 10), quality (HD), sub_episodes, dub_episodes. Return realistic current data.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            results: {
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

      if (result?.results?.length) {
        const existingTitles = new Set(allAnime.map(a => a.title.toLowerCase()));
        const newAnime = result.results.filter(a => !existingTitles.has(a.title.toLowerCase()));
        if (newAnime.length > 0) {
          await base44.entities.Anime.bulkCreate(newAnime);
        }
        // Re-search after adding
        window.location.href = `/Search?q=${encodeURIComponent(query)}`;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiSearching(false);
    }
  };

  const clearFilters = () => {
    setSelectedGenre('');
    setSelectedStatus('');
    setSelectedType('');
    setQuery('');
    setSearchText('');
  };

  const hasActiveFilters = selectedGenre || selectedStatus || selectedType || query;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="bg-gradient-to-b from-emerald-950/20 to-transparent pt-8 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
            {initialFilter === 'trending' ? '🔥 Trending Now' : initialFilter === 'new' ? '✨ New Releases' : initialFilter === 'ongoing' ? '📺 Currently Airing' : 'Browse Anime'}
          </h1>
          <p className="text-zinc-500 text-sm mb-6">
            Discover your next favorite anime
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-3 max-w-2xl">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <Input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search by title, genre..."
                className="pl-10 bg-zinc-900/80 border-zinc-800 text-white placeholder:text-zinc-600 h-11 rounded-xl focus-visible:ring-emerald-500/50"
              />
            </div>
            <Button type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-6 rounded-xl h-11">
              Search
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:text-white rounded-xl h-11 px-3"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </Button>
          </form>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-zinc-900/60 rounded-xl border border-zinc-800/50 max-w-2xl space-y-4">
              {/* Genres */}
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2 font-medium">Genre</p>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map(g => (
                    <button
                      key={g}
                      onClick={() => setSelectedGenre(selectedGenre === g ? '' : g)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                        selectedGenre === g
                          ? 'bg-emerald-500 text-black'
                          : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2 font-medium">Status</p>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map(s => (
                    <button
                      key={s}
                      onClick={() => setSelectedStatus(selectedStatus === s ? '' : s)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                        selectedStatus === s
                          ? 'bg-emerald-500 text-black'
                          : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Type */}
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2 font-medium">Type</p>
                <div className="flex flex-wrap gap-2">
                  {TYPES.map(t => (
                    <button
                      key={t}
                      onClick={() => setSelectedType(selectedType === t ? '' : t)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                        selectedType === t
                          ? 'bg-emerald-500 text-black'
                          : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {hasActiveFilters && (
                <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-red-400 transition-colors">
                  <X className="w-3 h-3" /> Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 md:px-8 max-w-7xl pb-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : sorted.length > 0 ? (
          <>
            <p className="text-sm text-zinc-600 mb-6">{sorted.length} result{sorted.length !== 1 ? 's' : ''} found</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
              {sorted.map(anime => (
                <AnimeCard key={anime.id} anime={anime} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-zinc-500 mb-2">No anime found{query ? ` for "${query}"` : ''}</p>
            <p className="text-zinc-600 text-sm mb-4">Try searching the web for it</p>
            <Button
              onClick={aiSearch}
              disabled={aiSearching || !query.trim()}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold gap-2"
            >
              {aiSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <SearchIcon className="w-4 h-4" />}
              {aiSearching ? 'Searching...' : `Search web for "${query}"`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}