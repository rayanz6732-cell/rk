import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const ANIMEKAI_BASE = "https://animekai.to";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

async function encodeToken(text) {
  const r = await fetch(`https://enc-dec.app/api/enc-kai?text=${encodeURIComponent(text)}`, {
    headers: { "User-Agent": UA, "Referer": ANIMEKAI_BASE }
  });
  const data = await r.json();
  return data.result;
}

Deno.serve(async (req) => {
  const cors = { "Access-Control-Allow-Origin": "*" };
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401, headers: cors });

    const body = await req.json();
    const step = body.step || "test_headers";

    if (step === "test_headers") {
      // Test multiple header combinations to see what breaks the 403
      const encodedAniId = await encodeToken("c4ey");
      const url = `${ANIMEKAI_BASE}/ajax/episodes/list?ani_id=${encodeURIComponent(encodedAniId)}`;
      const slug = "one-piece-dk6r";
      
      const tests = [
        {
          label: "minimal",
          headers: { "User-Agent": UA }
        },
        {
          label: "with_referer",
          headers: { "User-Agent": UA, "Referer": `${ANIMEKAI_BASE}/watch/${slug}` }
        },
        {
          label: "with_xhr",
          headers: { "User-Agent": UA, "Referer": `${ANIMEKAI_BASE}/watch/${slug}`, "X-Requested-With": "XMLHttpRequest" }
        },
        {
          label: "with_accept",
          headers: { "User-Agent": UA, "Referer": `${ANIMEKAI_BASE}/watch/${slug}`, "X-Requested-With": "XMLHttpRequest", "Accept": "application/json, text/javascript, */*; q=0.01" }
        },
        {
          label: "no_user_agent",
          headers: { "Referer": `${ANIMEKAI_BASE}/watch/${slug}`, "X-Requested-With": "XMLHttpRequest" }
        },
      ];

      const results = [];
      for (const t of tests) {
        const r = await fetch(url, { headers: t.headers });
        const text = await r.text();
        let parsed;
        try { parsed = JSON.parse(text); } catch { parsed = null; }
        results.push({ label: t.label, http_status: r.status, api_status: parsed?.status, message: parsed?.message, has_html: !!(parsed?.result?.html) });
      }
      return Response.json({ encoded_ani_id: encodedAniId, results }, { headers: cors });
    }

    // Try fetching from a known public anime API proxy to see if AnimeKai is accessible
    if (step === "check_accessible") {
      const r = await fetch(`${ANIMEKAI_BASE}/ajax/anime/search?keyword=naruto`, {
        headers: { "User-Agent": UA, "X-Requested-With": "XMLHttpRequest" }
      });
      const text = await r.text();
      return Response.json({ status: r.status, body: text.slice(0, 500) }, { headers: cors });
    }

    return Response.json({ error: "Unknown step" }, { headers: cors });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers: { "Access-Control-Allow-Origin": "*" } });
  }
});