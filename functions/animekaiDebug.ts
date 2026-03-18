import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

Deno.serve(async (req) => {
  const cors = { "Access-Control-Allow-Origin": "*" };
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401, headers: cors });

    const body = await req.json();
    const step = body.step || "test_apis";

    const endpoints = [
      "https://anify.tv/api/search?query=one+piece&type=anime",
      "https://animepahe.ru/api?m=search&q=one+piece",
      "https://anitaku.pe/search.html?keyword=one+piece",
    ];
    const results = await Promise.all(endpoints.map(async (url) => {
      try {
        const r = await fetch(url, { headers: { "User-Agent": UA, "Referer": url.split('/').slice(0,3).join('/') }, signal: AbortSignal.timeout(6000) });
        const t = await r.text();
        return { url, status: r.status, len: t.length, body: t.slice(0, 200) };
      } catch (e) {
        return { url, error: e.message };
      }
    }));
    return Response.json({ results }, { headers: cors });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers: { "Access-Control-Allow-Origin": "*" } });
  }
});