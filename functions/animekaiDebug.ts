import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const BASE = "https://anitaku.pe";

Deno.serve(async (req) => {
  const cors = { "Access-Control-Allow-Origin": "*" };
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401, headers: cors });

    const body = await req.json();
    const step = body.step || "search";

    // Step 1: Search gogoanime by title
    if (step === "search") {
      const query = body.query || "one piece";
      const r = await fetch(`${BASE}/search.html?keyword=${encodeURIComponent(query)}`, {
        headers: { "User-Agent": UA }
      });
      const html = await r.text();
      const matches = [...html.matchAll(/href="\/category\/([^"]+)"/g)];
      const slugs = [...new Set(matches.map(m => m[1]))].slice(0, 5);
      return Response.json({ status: r.status, slugs }, { headers: cors });
    }

    // Step 2: Get episode page URL from slug + episode number
    if (step === "ep_url") {
      const slug = body.slug || "one-piece";
      const ep = body.episode || "1";
      const epSlug = `${slug}-episode-${ep}`;
      // Verify it exists
      const r = await fetch(`${BASE}/${epSlug}`, { headers: { "User-Agent": UA } });
      const html = await r.text();
      // Extract the gogoplay/vidstreaming iframe src
      const iframeMatch = html.match(/data-video="([^"]+)"/);
      const iframeSrc = iframeMatch ? iframeMatch[1] : null;
      return Response.json({ status: r.status, ep_slug: epSlug, iframe_src: iframeSrc }, { headers: cors });
    }

    // Step 3: get the embed sources from the episode's gogoplay embed
    if (step === "sources") {
      const slug = body.slug || "one-piece";
      const ep = body.episode || "1";
      const epSlug = `${slug}-episode-${ep}`;
      const epR = await fetch(`${BASE}/${epSlug}`, { headers: { "User-Agent": UA } });
      const html = await epR.text();
      const iframeMatch = html.match(/data-video="([^"]+)"/);
      if (!iframeMatch) return Response.json({ error: "No iframe found", slug, epSlug }, { headers: cors });
      const iframeSrc = iframeMatch[1].startsWith('//') ? 'https:' + iframeMatch[1] : iframeMatch[1];
      
      // Now fetch the gogoplay page to extract encryption keys + encrypted source
      const embedR = await fetch(iframeSrc, {
        headers: { "User-Agent": UA, "Referer": BASE }
      });
      const embedHtml = await embedR.text();
      
      // Extract data-value from script tag
      const dataValueMatch = embedHtml.match(/data-value="([^"]+)"/);
      const dataValue = dataValueMatch ? dataValueMatch[1] : null;
      
      return Response.json({ iframe_src: iframeSrc, data_value: dataValue, embed_len: embedHtml.length, embed_preview: embedHtml.slice(0, 800) }, { headers: cors });
    }

    return Response.json({ error: "Unknown step. Use: search, ep_url, sources" }, { headers: cors });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers: { "Access-Control-Allow-Origin": "*" } });
  }
});