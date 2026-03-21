import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const GOGO_BASE = "https://gogoanimes.fi";

async function getAnimeTitleFromAniList(malId) {
  const query = `
    query ($malId: Int) {
      Media(idMal: $malId, type: ANIME) {
        title { english romaji }
      }
    }
  `;
  try {
    const r = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ query, variables: { malId: parseInt(malId) } }),
    });
    const data = await r.json();
    return data?.data?.Media?.title?.english || data?.data?.Media?.title?.romaji || null;
  } catch {
    return null;
  }
}

async function searchGogoanime(query) {
  const r = await fetch(`${GOGO_BASE}/search.html?keyword=${encodeURIComponent(query)}`, {
    headers: { "User-Agent": UA }
  });
  const html = await r.text();
  const matches = [...html.matchAll(/href="\/category\/([^"]+)"/g)];
  return [...new Set(matches.map(m => m[1]))];
}

function pickSlug(slugs, isDub) {
  if (!slugs.length) return null;
  if (isDub) {
    return slugs.find(s => s.endsWith('-dub')) || slugs[0];
  }
  return slugs.find(s => !s.endsWith('-dub') && !s.endsWith('-tv')) || 
         slugs.find(s => !s.endsWith('-dub')) || 
         slugs[0];
}

async function getEpisodeSrc(slug, episode) {
  const epSlug = `${slug}-episode-${episode}`;
  const r = await fetch(`${GOGO_BASE}/${epSlug}`, {
    headers: { "User-Agent": UA, "Referer": GOGO_BASE }
  });
  if (!r.ok) return null;
  const html = await r.text();
  const iframeMatch = html.match(/data-video="([^"]+)"/);
  return iframeMatch ? iframeMatch[1] : null;
}

Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });

    const body = await req.json();
    const { mal_id, episode, audio_type = "sub", anime_title } = body;

    if (!mal_id || !episode) {
      return Response.json({ error: "mal_id and episode are required" }, { status: 400, headers: corsHeaders });
    }

    const isDub = audio_type === "dub";

    let searchTitle = anime_title;
    if (!searchTitle) {
      searchTitle = await getAnimeTitleFromAniList(mal_id);
    }
    if (!searchTitle) {
      return Response.json({ error: "Could not resolve anime title" }, { status: 404, headers: corsHeaders });
    }

    let slugs = await searchGogoanime(searchTitle);

    if (!slugs.length) {
      const shortTitle = searchTitle.split(' ').slice(0, 3).join(' ');
      slugs = await searchGogoanime(shortTitle);
    }

    if (!slugs.length) {
      return Response.json({ error: "Anime not found on streaming source", title: searchTitle }, { status: 404, headers: corsHeaders });
    }

    const slug = pickSlug(slugs, isDub);
    if (!slug) {
      return Response.json({ error: "No suitable server found" }, { status: 404, headers: corsHeaders });
    }

    const src = await getEpisodeSrc(slug, episode);
    if (!src) {
      for (const fallbackSlug of slugs.slice(1, 4)) {
        const fallbackSrc = await getEpisodeSrc(fallbackSlug, episode);
        if (fallbackSrc) {
          return Response.json({ src: fallbackSrc, slug: fallbackSlug, title: searchTitle }, { headers: corsHeaders });
        }
      }
      return Response.json({ error: "Episode not found", slug, title: searchTitle }, { status: 404, headers: corsHeaders });
    }

    return Response.json({ src, slug, title: searchTitle }, { headers: corsHeaders });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: { "Access-Control-Allow-Origin": "*" } });
  }
});