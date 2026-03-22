import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const BASE = "https://gogoanimes.fi";

async function searchAnime(query) {
  const r = await fetch(`${BASE}/search.html?keyword=${encodeURIComponent(query)}`, {
    headers: { "User-Agent": UA }
  });
  const html = await r.text();
  const matches = [...html.matchAll(/href="\/category\/([^"]+)"/g)];
  return [...new Set(matches.map(m => m[1]))];
}

async function getEpisodeSrc(slug, episode, isDub) {
  // For dub, append -dub to slug
  const epSlug = `${slug}-episode-${episode}`;
  const r = await fetch(`${BASE}/${epSlug}`, {
    headers: { "User-Agent": UA, "Referer": BASE }
  });
  const html = await r.text();
  const iframeMatch = html.match(/data-video="([^"]+)"/);
  return iframeMatch ? iframeMatch[1] : null;
}

Deno.serve(async (req) => {
  const cors = { "Access-Control-Allow-Origin": "*" };
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401, headers: cors });

    const body = await req.json();
    const step = body.step || "full";

    // Full test: search + get embed src
    if (step === "full") {
      const query = body.query || "one piece";
      const episode = body.episode || "1";
      const isDub = body.audio_type === "dub";
      
      const slugs = await searchAnime(query);
      if (!slugs.length) return Response.json({ error: "No results found" }, { headers: cors });
      
      // For dub, prefer slug ending in -dub
      let slug = slugs[0];
      if (isDub) {
        const dubSlug = slugs.find(s => s.endsWith('-dub'));
        if (dubSlug) slug = dubSlug;
      }
      
      const src = await getEpisodeSrc(slug, episode, isDub);
      return Response.json({ slug, src, all_slugs: slugs.slice(0, 5) }, { headers: cors });
    }

    return Response.json({ error: "Unknown step" }, { headers: cors });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers: { "Access-Control-Allow-Origin": "*" } });
  }
});