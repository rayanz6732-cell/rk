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

    if (step === "search") {
      const query = body.query || "one piece";
      const r = await fetch(`${BASE}/search.html?keyword=${encodeURIComponent(query)}`, {
        headers: { "User-Agent": UA }
      });
      const html = await r.text();
      // Log the actual HTML snippet to understand the response structure
      return Response.json({ status: r.status, html_len: html.length, snippet: html.slice(0, 2000) }, { headers: cors });
    }

    return Response.json({ error: "Unknown step" }, { headers: cors });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers: { "Access-Control-Allow-Origin": "*" } });
  }
});