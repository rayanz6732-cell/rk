import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const ANIWATCH_BASE = 'https://aniwatch-api-production-dbc1.up.railway.app';
const UA = { 'User-Agent': 'Mozilla/5.0' };

async function searchAniwatch(title) {
  const r = await fetch(`${ANIWATCH_BASE}/api/v2/hianime/search?q=${encodeURIComponent(title)}&page=1`, { headers: UA });
  const data = await r.json();
  return data?.data?.animes || [];
}

async function getEpisodes(aniwatchId) {
  const r = await fetch(`${ANIWATCH_BASE}/api/v2/hianime/anime/${aniwatchId}/episodes`, { headers: UA });
  const data = await r.json();
  return data?.data?.episodes || [];
}

async function getSources(episodeId, category = 'sub') {
  // Try hd-2 first, fallback to hd-1
  for (const server of ['hd-2', 'hd-1']) {
    try {
      const url = `${ANIWATCH_BASE}/api/v2/hianime/episode/sources?animeEpisodeId=${encodeURIComponent(episodeId)}&server=${server}&category=${category}`;
      console.log(`[S3] Trying server=${server} category=${category} episodeId=${episodeId}`);
      const r = await fetch(url, { headers: UA });
      const data = await r.json();
      if (data?.status === 200 && data?.data?.sources?.length) {
        console.log(`[S3] Success with server=${server}`);
        return { sources: data.data.sources, subtitles: data.data.subtitles || [] };
      }
      console.log(`[S3] server=${server} failed: ${JSON.stringify(data)}`);
    } catch (e) {
      console.log(`[S3] server=${server} error: ${e.message}`);
    }
  }
  return null;
}

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });

    const body = await req.json();
    const { mal_id, episode, audio_type = 'sub', anime_title } = body;

    if (!anime_title || !episode) {
      return Response.json({ error: 'anime_title and episode are required' }, { status: 400, headers: corsHeaders });
    }

    console.log(`[S3] Looking up: "${anime_title}" ep=${episode} audio=${audio_type}`);

    // Search for anime
    let animes = await searchAniwatch(anime_title);

    // If no results, try a shorter title
    if (!animes.length) {
      const shortTitle = anime_title.split(' ').slice(0, 4).join(' ');
      console.log(`[S3] Retrying with short title: "${shortTitle}"`);
      animes = await searchAniwatch(shortTitle);
    }

    if (!animes.length) {
      console.log(`[S3] Anime not found in Aniwatch: "${anime_title}"`);
      return Response.json({ error: `Anime "${anime_title}" not found on S3 server` }, { status: 404, headers: corsHeaders });
    }

    const aniwatchId = animes[0].id;
    console.log(`[S3] Found anime: id=${aniwatchId} name=${animes[0].name}`);

    // Get episodes
    const episodes = await getEpisodes(aniwatchId);
    const epNum = parseInt(episode, 10);
    const targetEp = episodes.find(e => e.number === epNum);

    if (!targetEp) {
      console.log(`[S3] Episode ${epNum} not found. Available: ${episodes.map(e => e.number).join(', ')}`);
      return Response.json({ error: `Episode ${epNum} not available on S3 server yet` }, { status: 404, headers: corsHeaders });
    }

    console.log(`[S3] Found episode: id=${targetEp.episodeId}`);

    // Get streaming sources
    const category = audio_type === 'dub' ? 'dub' : 'sub';
    let result = await getSources(targetEp.episodeId, category);

    // If dub not found, fallback to sub
    if (!result && category === 'dub') {
      console.log(`[S3] Dub not found, falling back to sub`);
      result = await getSources(targetEp.episodeId, 'sub');
    }

    if (!result) {
      return Response.json({ error: 'Found anime but could not extract stream link from S3' }, { status: 404, headers: corsHeaders });
    }

    // Pick best source (prefer m3u8)
    const src = result.sources.find(s => s.isM3U8)?.url || result.sources[0]?.url;

    return Response.json({
      src,
      type: 'm3u8',
      subtitles: result.subtitles,
      aniwatchId,
      episodeId: targetEp.episodeId,
    }, { headers: corsHeaders });

  } catch (error) {
    console.error(`[S3] Unexpected error: ${error.message}`);
    return Response.json({ error: error.message }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
});