import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const ANIMEKAI_BASE = "https://animekai.to";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "application/json, text/html, */*",
  "Accept-Language": "en-US,en;q=0.9",
  "Referer": "https://animekai.to/",
  "X-Requested-With": "XMLHttpRequest",
};

async function encodeToken(text) {
  const r = await fetch(`https://enc-dec.app/api/enc-kai?text=${encodeURIComponent(text)}`, {
    headers: { "User-Agent": HEADERS["User-Agent"], "Referer": "https://animekai.to/" }
  });
  const data = await r.json();
  return { status: r.status, result: data };
}

Deno.serve(async (req) => {
  const cors = { "Access-Control-Allow-Origin": "*" };
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401, headers: cors });

    const body = await req.json();
    const step = body.step || "search";
    const input = body.input;

    if (step === "search") {
      const url = `${ANIMEKAI_BASE}/ajax/anime/search?keyword=${encodeURIComponent(input)}`;
      const r = await fetch(url, { headers: HEADERS });
      const raw = await r.text();
      return Response.json({ status: r.status, raw_length: raw.length, raw: raw.slice(0, 3000) }, { headers: cors });
    }

    if (step === "watch_page") {
      const url = `${ANIMEKAI_BASE}/watch/${input}`;
      const r = await fetch(url, { headers: { ...HEADERS, "X-Requested-With": undefined } });
      const raw = await r.text();
      // Find data-id patterns
      const dataIds = [...raw.matchAll(/data-id="([^"]+)"/g)].map(m => m[1]);
      const aniIds = [...raw.matchAll(/ani_id["\s:=]+["']?([^"'\s,]+)/g)].map(m => m[1]);
      return Response.json({ status: r.status, raw_length: raw.length, data_ids: dataIds.slice(0, 20), ani_ids: aniIds.slice(0, 10), snippet: raw.slice(0, 2000) }, { headers: cors });
    }

    if (step === "encode") {
      const result = await encodeToken(input);
      return Response.json(result, { headers: cors });
    }

    if (step === "episodes") {
      // input = encoded ani_id token
      const url = `${ANIMEKAI_BASE}/ajax/episodes/list?ani_id=${encodeURIComponent(input)}`;
      const r = await fetch(url, { headers: HEADERS });
      const raw = await r.text();
      return Response.json({ status: r.status, raw: raw.slice(0, 3000) }, { headers: cors });
    }

    if (step === "links") {
      // input = encoded ep_id token
      const url = `${ANIMEKAI_BASE}/ajax/links/list?ep_id=${encodeURIComponent(input)}`;
      const r = await fetch(url, { headers: HEADERS });
      const raw = await r.text();
      return Response.json({ status: r.status, raw: raw.slice(0, 3000) }, { headers: cors });
    }

    if (step === "view") {
      // input = encoded link id token
      const url = `${ANIMEKAI_BASE}/ajax/links/view?id=${encodeURIComponent(input)}`;
      const r = await fetch(url, { headers: HEADERS });
      const raw = await r.text();
      return Response.json({ status: r.status, raw: raw.slice(0, 3000) }, { headers: cors });
    }

    return Response.json({ error: "Unknown step" }, { headers: cors });
  } catch (err) {
    return Response.json({ error: err.message, stack: err.stack }, { status: 500, headers: { "Access-Control-Allow-Origin": "*" } });
  }
});