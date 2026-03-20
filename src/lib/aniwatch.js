const ANIWATCH_BASE = 'https://aniwatch-api-production-dbc1.up.railway.app';

async function searchAniwatchId(title) {
  if (!title) return null;
  try {
    const res = await fetch(
      `${ANIWATCH_BASE}/api/v2/hianime/search?q=${encodeURIComponent(title)}&page=1`
    );
    const data = await res.json();
    const animes = data?.data?.animes || [];
    if (!animes.length) return null;
    return animes[0].id;
  } catch (err) {
    console.error('Aniwatch search failed:', err);
    return null;
  }
}

async function getAniwatchEpisodes(aniwatchId) {
  if (!aniwatchId) return [];
  try {
    const res = await fetch(
      `${ANIWATCH_BASE}/api/v2/hianime/anime/${aniwatchId}/episodes`
    );
    const data = await res.json();
    return data?.data?.episodes || [];
  } catch (err) {
    console.error('Aniwatch episodes failed:', err);
    return [];
  }
}

export async function getEpisodesByTitle(title) {
  const id = await searchAniwatchId(title);
  if (!id) return [];
  const episodes = await getAniwatchEpisodes(id);
  return episodes.map(ep => ({
    mal_id: ep.number,
    number: ep.number,
    title: ep.title || `Episode ${ep.number}`,
    episodeId: ep.episodeId,
    isFiller: ep.isFiller,
  }));
}

export const AniwatchAPI = { searchAniwatchId, getAniwatchEpisodes, getEpisodesByTitle };
