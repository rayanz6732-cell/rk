import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const ANIMEKAI_BASE = "https://animekai.to";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function fetchWithCookies(url, headers, cookieJar) {
  const h = { ...headers };
  if (Object.keys(cookieJar).length > 0) {
    h["Cookie"] = Object.entries(cookieJar).map(([k,v]) => `${k}=${v}`).join("; ");
  }
  const r = await fetch(url, { headers: h, redirect: "follow" });
  // Parse set-cookie
  const sc = r.headers.get("set-cookie");
  if (sc) {
    // crude multi-cookie parser
    for (const part of sc.split(",")) {
      const m = part.trim().match(/^([^=]+)=([^;]*)/);
      if (m) cookieJar[m[1].trim()] = m[2].trim();
    }
  }
  return r;
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
    const cookieJar = {};

    const baseHeaders = {
      "User-Agent": UA,
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
    };

    // Step 1: Load the watch page and capture cookies + extract ani_id and token
    const watchR = await fetchWithCookies(`${ANIMEKAI_BASE}/watch/${slug}`, {
      ...baseHeaders,
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }, cookieJar);
    const watchHtml = await watchR.text();

    // Extract _token (meta csrf)
    let csrfToken = null;
    const csrfMatch = watchHtml.match(/meta[^>]+name=["']csrf-token["'][^>]+content=["']([^"']+)["']/i)
      || watchHtml.match(/name=["']_token["'][^>]*value=["']([^"']+)["']/i)
      || watchHtml.match(/"_token"\s*:\s*"([^"]+)"/i)
      || watchHtml.match(/window\.__token\s*=\s*["']([^"']+)["']/i);
    if (csrfMatch) csrfToken = csrfMatch[1];

    // Extract ani_id = the short alphanum data-id on the main watch container
    // Look for the pattern around "episodes" or "ani" 
    const aniIdSnippet = watchHtml.match(/data-id="([a-z0-9]{4,8})"[^>]*>[\s\S]{0,200}episode/i)
      || watchHtml.match(/id="episodes"[^>]*>[\s\S]{0,500}data-id="([a-z0-9]{4,8})"/i);
    
    // Also look near specific divs
    const playerDiv = watchHtml.match(/class="[^"]*player[^"]*"[^>]*data-id="([^"]+)"/i)
      || watchHtml.match(/id="player"[^>]*data-id="([^"]+)"/i)
      || watchHtml.match(/data-id="([a-z0-9]{4,8})"[^>]*id="[^"]*(?:watch|ani|episode)[^"]*"/i);

    // Find the specific HTML region containing c4ey
    const c4eyIdx = watchHtml.indexOf('"c4ey"');
    const c4eyContext = c4eyIdx >= 0 ? watchHtml.slice(Math.max(0, c4eyIdx - 200), c4eyIdx + 300) : "not found";

    // Step 2: Try episodes AJAX with session cookies and CSRF token
    const ajaxHeaders = {
      ...baseHeaders,
      "Accept": "application/json, text/javascript, */*; q=0.01",
      "Referer": `${ANIMEKAI_BASE}/watch/${slug}`,
      "X-Requested-With": "XMLHttpRequest",
      "Origin": ANIMEKAI_BASE,
    };
    if (csrfToken) ajaxHeaders["X-CSRF-TOKEN"] = csrfToken;

    // Encode c4ey
    const encR = await fetch(`https://enc-dec.app/api/enc-kai?text=c4ey`, {
      headers: { "User-Agent": UA, "Referer": ANIMEKAI_BASE }
    });
    const encData = await encR.json();
    const encodedId = encData.result;

    const epR = await fetchWithCookies(
      `${ANIMEKAI_BASE}/ajax/episodes/list?ani_id=${encodeURIComponent(encodedId)}`,
      ajaxHeaders,
      cookieJar
    );
    const epRaw = await epR.text();

    return Response.json({
      watch_status: watchR.status,
      csrf_token: csrfToken,
      cookies: cookieJar,
      ani_id_snippet: aniIdSnippet ? aniIdSnippet[0].slice(0, 200) : null,
      player_div: playerDiv ? playerDiv[1] : null,
      c4ey_context: c4eyContext,
      encoded_id: encodedId,
      episodes_status: epR.status,
      episodes_raw: epRaw.slice(0, 1000),
    }, { headers: cors });
  } catch (err) {
    return Response.json({ error: err.message, stack: err.stack?.slice(0,500) }, { status: 500, headers: { "Access-Control-Allow-Origin": "*" } });
  }
});