import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const ANIWATCH_BASE = 'https://aniwatch-api-production-dbc1.up.railway.app';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const { title } = await req.json();

  if (!title) {
    return Response.json({ episodes: [] });
  }

  // Search for the anime
  const searchRes = await fetch(
    `${ANIWATCH_BASE}/api/v2/hianime/search?q=${encodeURIComponent(title)}&page=1`,
    { headers: { 'User-Agent': 'Mozilla/5.0' } }
  );
  const searchData = await searchRes.json();
  const animes = searchData?.data?.animes || [];
  if (!animes.length) return Response.json({ episodes: [] });

  const aniwatchId = animes[0].id;

  // Fetch episodes
  const epRes = await fetch(
    `${ANIWATCH_BASE}/api/v2/hianime/anime/${aniwatchId}/episodes`,
    { headers: { 'User-Agent': 'Mozilla/5.0' } }
  );
  const epData = await epRes.json();
  const rawEps = epData?.data?.episodes || [];

  const episodes = rawEps.map(ep => ({
    number: ep.number,
    title: ep.title || `Episode ${ep.number}`,
    episodeId: ep.episodeId,
    isFiller: ep.isFiller,
  }));

  return Response.json({ episodes });
});