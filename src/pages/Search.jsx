import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { JikanAPI, GENRE_IDS } from '../lib/jikan';
import AnimeCard from '../components/anime/AnimeCard';
import { Search as SearchIcon, Loader2, SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const GENRES = Object.keys(GENRE_IDS);
const STATUSES = [
  { label: 'Airing', value: 'airing' },
  { label: 'Completed', value: 'complete' },
  { label: 'Upcoming', value: 'upcoming' },
];
const TYPES = ['tv', 'movie', 'ova', 'ona', 'special'];
const RATINGS = [
  { label: 'PG-13', value: 'pg13' },
  { label: 'R-17', value: 'r17' },
  { label: 'PG', value: 'pg' },
  { label: 'G', value: 'g' },
];

export default function Search() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialQuery = urlParams.get('q') || '';
  const initialFilter = urlParams.get('filter') || '';

  const [searchText, setSearchText] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  // Determine fetch mode
  const isSearchMode = submittedQuery.trim().length > 0;
  const isGenreMode = !!selectedGenre;

  const searchFilters = {
    ...(selectedStatus && { status: selectedStatus }),
    ...(selectedType && { type: selectedType }),
    ...(selectedRating && { rating: selectedRating }),
  };

  // Search query
  const { data: searchResults, isLoading: loadingSearch } = useQuery({
    queryKey: ['anime-search', submittedQuery, page, searchFilters],
    queryFn: () => JikanAPI.search(submittedQuery, page, searchFilters),
    enabled: isSearchMode,
    staleTime: 1000 * 60 * 5,
  });

  // Genre browse
  const { data: genreResults, isLoading: loadingGenre } = useQuery({
    queryKey: ['anime-genre', selectedGenre, page],
    queryFn: () => JikanAPI.getByGenre(GENRE_IDS[selectedGenre], page),
    enabled: isGenreMode && !isSearchMode,
    staleTime: 1000 * 60 * 10,
  });

  // Default browse (no search, no genre)
  const { data: topAiring, isLoading: loadingDefault } = useQuery({
    queryKey: ['browse-default', initialFilter, page],
    queryFn: () => {
      if (initialFilter === 'popular') return JikanAPI.getMostPopular(page);
      if (initialFilter === 'top') return JikanAPI.getTopAiring(page);
      return JikanAPI.getCurrentSeason(page);
    },
    enabled: !isSearchMode && !isGenreMode,
    staleTime: 1000 * 60 * 10,
  });

  const isLoading = loadingSearch || loadingGenre || loadingDefault;
  const activeData = isSearchMode ? searchResults : isGenreMode ? genreResults : topAiring;
  const animeList = activeData?.data || [];
  const pagination = activeData?.pagination;
  const hasNextPage = pagination?.has_next_page;

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSubmittedQuery(searchText);
  };

  const clearAll = () => {
    setSearchText('');
    setSubmittedQuery('');
    setSelectedGenre('');
    setSelectedStatus('');
    setSelectedType('');
    setSelectedRating('');
    setPage(1);
  };

  const handleGenreToggle = (g) => {
    setSelectedGenre(prev => prev === g ? '' : g);
    setPage(1);
  };

  const pageTitle = () => {
    if (initialFilter === 'popular') return '🔥 Most Popular';
    if (initialFilter === 'top') return '⭐ Top Rated';
    if (initialFilter === 'season') return '📺 This Season';
    return 'Browse Anime';
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="bg-gradient-to-b from-emerald-950/20 to-transparent pt-8 pb-10 px-4">
        <div className="container mx-auto max-w-7xl">
          <h1 className="text-3xl md:text-4xl font-black text-white mb-1">{pageTitle()}</h1>
          <p className="text-zinc-500 text-sm mb-6">Powered by MyAnimeList · 25,000+ titles</p>

          <form onSubmit={handleSearch} className="flex gap-3 max-w-2xl">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <Input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search any anime..."
                className="pl-10 bg-zinc-900/80 border-zinc-800 text-white placeholder:text-zinc-600 h-11 rounded-xl focus-visible:ring-emerald-500/50"
              />
              {searchText && (
                <button type="button" onClick={() => { setSearchText(''); setSubmittedQuery(''); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Button type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-6 rounded-xl h-11">
              Search
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowFilters(!showFilters)}
              className={`border-zinc-800 rounded-xl h-11 px-3 ${showFilters ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-zinc-900/80 text-zinc-400 hover:text-white'}`}>
              <SlidersHorizontal className="w-4 h-4" />
            </Button>
          </form>

          {/* Filters panel */}
          {showFilters && (
            <div className="mt-4 p-5 bg-zinc-900/70 rounded-2xl border border-zinc-800/60 max-w-3xl space-y-5">
              {/* Genres */}
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2.5 font-semibold">Genre</p>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map(g => (
                    <button key={g} onClick={() => handleGenreToggle(g)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                        selectedGenre === g ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                      }`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2.5 font-semibold">Status</p>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map(s => (
                    <button key={s.value} onClick={() => setSelectedStatus(prev => prev === s.value ? '' : s.value)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                        selectedStatus === s.value ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                      }`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Type */}
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2.5 font-semibold">Type</p>
                <div className="flex flex-wrap gap-2">
                  {TYPES.map(t => (
                    <button key={t} onClick={() => setSelectedType(prev => prev === t ? '' : t)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium uppercase transition-all ${
                        selectedType === t ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                      }`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={clearAll} className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-red-400 transition-colors">
                <X className="w-3 h-3" /> Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 md:px-8 max-w-7xl pb-16">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : animeList.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-zinc-600">
                {submittedQuery ? `Results for "${submittedQuery}"` : selectedGenre ? `${selectedGenre} anime` : 'Showing anime'}
                {pagination && ` · Page ${page}`}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
              {animeList.map((anime) => (
                <AnimeCard key={anime.mal_id} anime={anime} />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-3 mt-10">
              <Button variant="outline" onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo(0, 0); }}
                disabled={page === 1}
                className="border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white gap-2 rounded-xl">
                <ChevronLeft className="w-4 h-4" /> Previous
              </Button>
              <span className="text-sm text-zinc-600 px-2">Page {page}</span>
              <Button variant="outline" onClick={() => { setPage(p => p + 1); window.scrollTo(0, 0); }}
                disabled={!hasNextPage}
                className="border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white gap-2 rounded-xl">
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </>
        ) : !isLoading && (
          <div className="text-center py-24">
            <p className="text-zinc-500 text-lg mb-1">No results found</p>
            <p className="text-zinc-700 text-sm">Try a different search term or filter</p>
          </div>
        )}
      </div>
    </div>
  );
}