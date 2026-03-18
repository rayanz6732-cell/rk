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
    const step = body.step || "anify_search";

    // Test Anify API
    if (step === "anify_search") {
      const r = await fetch(`https://anify.tv/api/search?query=one+piece&type=anime`, {
        headers: { "User-Agent": UA }
      });
      const text = await r.text();
      return Response.json({ status: r.status, body: text.slice(0, 500) }, { headers: cors });
    }

    // Test if any other public streaming API is available
    if (step === "test_apis") {
      const endpoints = [
        "https://anify.tv/api/search?query=one+piece&type=anime",
        "https://api.anify.tv/search/one+piece?type=anime",
        "https://anify-api.vercel.app/search?query=one+piece&type=anime",
        // Mochi? 
        "https://api.mochi.tv/v1/anime/search?q=one+piece",
      ];
      const results = await Promise.all(endpoints.map(async (url) => {
        try {
          const r = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(5000) });
          const t = await r.text();
          return { url, status: r.status, body: t.slice(0, 200) };
        } catch (e) {
          return { url, error: e.message };
        }
      }));
      return Response.json({ results }, { headers: cors });
    }

    // Test the animpahe API - a less common one that might be accessible
    if (step === "animepahe") {
      const r = await fetch(`https://animepahe.ru/api?m=search&q=one+piece`, {
        headers: { "User-Agent": UA, "Referer": "https://animepahe.ru" }
      });
      const data = await r.json();
      return Response.json({ status: r.status, data: JSON.stringify(data).slice(0, 500) }, { headers: cors });
    }

    // Test 9anime via consumet-style endpoint
    if (step === "test_direct") {
      // Try gogoanime ajax endpoint which is less protected
      const r = await fetch(`https://anitaku.pe/search.html?keyword=one+piece`, {
        headers: { "User-Agent": UA }
      });
      const html = await r.text();
      // Extract anime links
      const matches = [...html.matchAll(/href="\/category\/([^"]+)"/g)];
      return Response.json({ status: r.status, html_len: html.length, slugs: matches.slice(0, 5).map(m => m[1]) }, { headers: cors });
    }

    return Response.json({ error: "Unknown step" }, { headers: cors });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers: { "Access-Control-Allow-Origin": "*" } });
  }
});