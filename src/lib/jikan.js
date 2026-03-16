// Jikan API v4 - Unofficial MyAnimeList API (free, no auth needed)
const BASE = 'https://api.jikan.moe/v4';

// Rate limit: 3 requests/second, 60/minute — add small delay between calls
const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function jikanFetch(path, params = {}) {
  const url = new URL(`${BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Jikan API error: ${res.status}`);
  return res.json();
}

// Map raw Jikan anime object to our app's shape
export function mapAnime(raw) {
  return {
    mal_id: raw.mal_id,
    title: raw.title_english || raw.title,
    title_japanese: raw.title_japanese,
    description: raw.synopsis || '',
    genres: [
      ...(raw.genres || []).map(g => g.name),
      ...(raw.themes || []).map(t => t.name),
      ...(raw.demographics || []).map(d => d.name),
    ],
    status: raw.airing ? 'ongoing' : raw.status === 'Not yet aired' ? 'upcoming' : 'completed',
    type: raw.type || 'TV',
    rating: raw.rating?.replace(' - ', ' ')?.split(' ')[0] || '',
    release_year: raw.aired?.prop?.from?.year || null,
    episodes: raw.episodes || 0,
    score: raw.score || 0,
    scored_by: raw.scored_by || 0,
    rank: raw.rank || 0,
    popularity: raw.popularity || 0,
    members: raw.members || 0,
    cover_image: raw.images?.jpg?.large_image_url || raw.images?.jpg?.image_url || '',
    trailer_url: raw.trailer?.embed_url || '',
    studios: (raw.studios || []).map(s => s.name),
    season: raw.season || '',
    broadcast: raw.broadcast?.string || '',
    duration: raw.duration || '',
    source: raw.source || '',
    is_airing: raw.airing || false,
    aired_string: raw.aired?.string || '',
  };
}

export const JikanAPI = {
  // Currently airing this season
  async getCurrentSeason(page = 1) {
    const data = await jikanFetch('/seasons/now', { limit: 25, page });
    return { data: data.data.map(mapAnime), pagination: data.pagination };
  },

  // Top airing anime (by score)
  async getTopAiring(page = 1) {
    const data = await jikanFetch('/top/anime', { filter: 'airing', limit: 25, page });
    return { data: data.data.map(mapAnime), pagination: data.pagination };
  },

  // Top all time
  async getTopAllTime(page = 1) {
    const data = await jikanFetch('/top/anime', { limit: 25, page });
    return { data: data.data.map(mapAnime), pagination: data.pagination };
  },

  // Top upcoming
  async getTopUpcoming() {
    const data = await jikanFetch('/top/anime', { filter: 'upcoming', limit: 10 });
    return data.data.map(mapAnime);
  },

  // Most popular (by members)
  async getMostPopular(page = 1) {
    const data = await jikanFetch('/top/anime', { filter: 'bypopularity', limit: 25, page });
    return { data: data.data.map(mapAnime), pagination: data.pagination };
  },

  // Search anime
  async search(query, page = 1, filters = {}) {
    const params = { q: query, limit: 24, page, sfw: true, ...filters };
    const data = await jikanFetch('/anime', params);
    return { data: data.data.map(mapAnime), pagination: data.pagination };
  },

  // Get anime by ID
  async getById(mal_id) {
    const data = await jikanFetch(`/anime/${mal_id}/full`);
    return mapAnime(data.data);
  },

  // Get anime episodes
  async getEpisodes(mal_id, page = 1) {
    const data = await jikanFetch(`/anime/${mal_id}/episodes`, { page });
    return data;
  },

  // Get anime characters
  async getCharacters(mal_id) {
    const data = await jikanFetch(`/anime/${mal_id}/characters`);
    return data.data?.slice(0, 12) || [];
  },

  // Get recommendations for an anime
  async getRecommendations(mal_id) {
    const data = await jikanFetch(`/anime/${mal_id}/recommendations`);
    return (data.data || []).slice(0, 12).map(r => mapAnime(r.entry));
  },

  // Get seasonal schedule
  async getSeasonList() {
    const data = await jikanFetch('/seasons');
    return data.data?.slice(0, 10) || [];
  },

  // Get anime by genre
  async getByGenre(genreId, page = 1) {
    const data = await jikanFetch('/anime', { genres: genreId, limit: 24, page, order_by: 'score', sort: 'desc' });
    return { data: data.data.map(mapAnime), pagination: data.pagination };
  },
};

export const GENRE_IDS = {
  'Action': 1, 'Adventure': 2, 'Comedy': 4, 'Drama': 8, 'Fantasy': 10,
  'Horror': 14, 'Mystery': 7, 'Romance': 22, 'Sci-Fi': 24, 'Shounen': 27,
  'Slice of Life': 36, 'Sports': 30, 'Supernatural': 37, 'Thriller': 41,
  'Ecchi': 9, 'Mecha': 18, 'Music': 19, 'Psychological': 40, 'Seinen': 42,
  'Shoujo': 25, 'Isekai': 62, 'School': 23,
};