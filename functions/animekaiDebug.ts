import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

Deno.serve(async (req) => {
  const cors = { "Access-Control-Allow-Origin": "*" };
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401, headers: cors });

    // Test multiple gogoanime/alternative domains to find one that works
    const candidates = [
      "https://anitaku.by/search.html?keyword=one+piece",
      "https://gogoanime3.net/search.html?keyword=one+piece",
      "https://gogoanimes.fi/search.html?keyword=one+piece",
      "https://anitaku.io/search.html?keyword=one+piece",
    ];

    const results = await Promise.all(candidates.map(async (url) => {
      try {
        const r = await fetch(url, {
          headers: { "User-Agent": UA },
          signal: AbortSignal.timeout(8000)
        });
        const t = await r.text();
        // Check if it has real content by looking for category links
        const hasAnime = t.includes('/category/');
        return { url, status: r.status, len: t.length, hasAnime, snippet: t.slice(500, 800) };
      } catch (e) {
        return { url, error: e.message };
      }
    }));

    return Response.json({ results }, { headers: cors });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers: { "Access-Control-Allow-Origin": "*" } });
  }
});