import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const BASE = "https://gogoanimes.fi";

Deno.serve(async (req) => {
  const cors = { "Access-Control-Allow-Origin": "*" };
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401, headers: cors });

    const body = await req.json();
    const step = body.step || "search";

    // Step 1: Search
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

    // Step 2: Get episode iframe src
    if (step === "ep") {
      const slug = body.slug || "one-piece";
      const ep = body.episode || "1";
      const epSlug = `${slug}-episode-${ep}`;
      const r = await fetch(`${BASE}/${epSlug}`, { headers: { "User-Agent": UA, "Referer": BASE } });
      const html = await r.text();
      const iframeMatch = html.match(/data-video="([^"]+)"/);
      const iframeSrc = iframeMatch ? iframeMatch[1] : null;
      // Also try to find li.active a href
      const videoMatch = html.match(/<li[^>]*class="[^"]*active[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"/);
      return Response.json({ status: r.status, ep_slug: epSlug, iframe_src: iframeSrc, alt_match: videoMatch?.[1], snippet: html.slice(1000, 2500) }, { headers: cors });
    }

    return Response.json({ error: "Unknown step" }, { headers: cors });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers: { "Access-Control-Allow-Origin": "*" } });
  }
});