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
    const slug = body.slug || "one-piece-dk6r";

    // Step 1: Fetch watch page, extract token and anime_id
    const watchR = await fetch(`${ANIMEKAI_BASE}/watch/${slug}`, {
      headers: {
        "User-Agent": UA,
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    const html = await watchR.text();

    // Extract CSRF token from script block
    const tokenMatch = html.match(/token['"]\s*[=:]\s*['"]([a-f0-9]{32})['"]/)
      || html.match(/\\"token\\":\\"([a-f0-9]{32})\\"/);
    const csrfToken = tokenMatch ? tokenMatch[1] : null;

    // Extract anime_id from JSON script
    const animeJsonMatch = html.match(/\{"page":"episode"[^}]+\}/);
    let animeId = null;
    if (animeJsonMatch) {
      try {
        const parsed = JSON.parse(animeJsonMatch[0]);
        animeId = parsed.anime_id;
      } catch {}
    }

    if (!animeId || !csrfToken) {
      return Response.json({ error: "Missing animeId or token", animeId, csrfToken }, { headers: cors });
    }

    // Step 2: Encode the ani_id
    const encodedAniId = await encodeToken(animeId);

    // Step 3: Fetch episodes with CSRF token
    const epUrl = `${ANIMEKAI_BASE}/ajax/episodes/list?ani_id=${encodeURIComponent(encodedAniId)}`;
    const epR = await fetch(epUrl, {
      headers: {
        "User-Agent": UA,
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": `${ANIMEKAI_BASE}/watch/${slug}`,
        "X-Requested-With": "XMLHttpRequest",
        "X-CSRF-TOKEN": csrfToken,
        "Origin": ANIMEKAI_BASE,
      },
    });
    const epData = await epR.json();

    // Examine episode HTML structure
    const epHtml = epData?.result?.html || "";
    const firstEps = epHtml.slice(0, 1500);

    return Response.json({
      csrf_token: csrfToken,
      anime_id: animeId,
      encoded_ani_id: encodedAniId,
      episodes_status: epR.status,
      episodes_api_status: epData?.status,
      episodes_message: epData?.message,
      ep_html_snippet: firstEps,
    }, { headers: cors });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers: { "Access-Control-Allow-Origin": "*" } });
  }
});