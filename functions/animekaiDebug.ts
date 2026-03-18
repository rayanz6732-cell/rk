import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const ANIMEKAI_BASE = "https://animekai.to";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// Fetch with cookies: first get homepage to grab session cookie + token, then use it
async function getSessionData() {
  const r = await fetch(`${ANIMEKAI_BASE}/`, {
    headers: {
      "User-Agent": UA,
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  const html = await r.text();
  // Extract _token (Laravel CSRF)
  const tokenMatch = html.match(/name="_token"\s+value="([^"]+)"/);
  const token = tokenMatch ? tokenMatch[1] : null;
  // Get Set-Cookie headers
  const cookies = r.headers.get("set-cookie");
  return { token, cookies, raw_snippet: html.slice(0, 500) };
}

// Try episodes list with token + cookie
async function fetchEpisodesWithSession(encodedAniId, token, cookie) {
  const url = `${ANIMEKAI_BASE}/ajax/episodes/list?ani_id=${encodeURIComponent(encodedAniId)}`;
  const headers = {
    "User-Agent": UA,
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": `${ANIMEKAI_BASE}/watch/one-piece-dk6r`,
    "X-Requested-With": "XMLHttpRequest",
    "Origin": ANIMEKAI_BASE,
  };
  if (token) headers["X-CSRF-TOKEN"] = token;
  if (cookie) headers["Cookie"] = cookie;

  const r = await fetch(url, { headers });
  const raw = await r.text();
  return { status: r.status, headers_sent: headers, raw: raw.slice(0, 1000) };
}

Deno.serve(async (req) => {
  const cors = { "Access-Control-Allow-Origin": "*" };
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401, headers: cors });

    const body = await req.json();
    const step = body.step;

    if (step === "session") {
      const data = await getSessionData();
      return Response.json(data, { headers: cors });
    }

    if (step === "episodes_with_session") {
      const session = await getSessionData();
      const result = await fetchEpisodesWithSession(body.encoded_ani_id, session.token, session.cookies);
      return Response.json({ session_token: session.token, has_cookie: !!session.cookies, result }, { headers: cors });
    }

    // Test: try fetching the watch page and then episodes in one flow
    if (step === "full_flow") {
      // 1. Get watch page to get cookies + token
      const watchR = await fetch(`${ANIMEKAI_BASE}/watch/${body.slug}`, {
        headers: {
          "User-Agent": UA,
          "Accept": "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });
      const watchHtml = await watchR.text();
      const setCookie = watchR.headers.get("set-cookie") || "";
      
      // Extract CSRF token
      const tokenMatch = watchHtml.match(/meta\s+name="csrf-token"\s+content="([^"]+)"/i) ||
                         watchHtml.match(/name="_token"\s+value="([^"]+)"/);
      const csrfToken = tokenMatch ? tokenMatch[1] : null;
      
      // Extract ani_id: look for data-id on .watchpage or .ani_id or specific player div
      const aniIdMatch = watchHtml.match(/class="[^"]*watchpage[^"]*"[^>]*data-id="([^"]+)"/i) ||
                         watchHtml.match(/<div[^>]+id="watch-section"[^>]+data-id="([^"]+)"/i) ||
                         watchHtml.match(/<div[^>]+data-id="([a-z0-9]{4,8})"[^>]*class="[^"]*player/i);
      
      // More targeted: find the div with a short alphanumeric data-id that appears near "episodes"
      const allDataIds = [...watchHtml.matchAll(/data-id="([a-z0-9]{4,8})"/g)].map(m => m[1]);
      const uniqueIds = [...new Set(allDataIds)];
      
      return Response.json({
        watch_status: watchR.status,
        csrf_token: csrfToken,
        cookie: setCookie.slice(0, 200),
        ani_id_match: aniIdMatch ? aniIdMatch[1] : null,
        all_short_data_ids: uniqueIds,
        html_snippet: watchHtml.slice(5000, 7000),
      }, { headers: cors });
    }

    return Response.json({ error: "Unknown step" }, { headers: cors });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers: { "Access-Control-Allow-Origin": "*" } });
  }
});