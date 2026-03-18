import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const ANIMEKAI_BASE = "https://anikai.to";
const ENCDEC_ENC = "https://enc-dec.app/api/enc-kai";
const ENCDEC_DEC_KAI = "https://enc-dec.app/api/dec-kai";
const ENCDEC_DEC_MEGA = "https://enc-dec.app/api/dec-mega";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Referer": "https://anikai.to/",
};

const AJAX_HEADERS = {
  ...HEADERS,
  "X-Requested-With": "XMLHttpRequest",
};

async function encodeToken(text) {
  const r = await fetch(`${ENCDEC_ENC}?text=${encodeURIComponent(text)}`, { headers: HEADERS });
  const data = await r.json();
  return data.status === 200 ? data.result : null;
}

async function decodeKai(text) {
  const r = await fetch(ENCDEC_DEC_KAI, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const data = await r.json();
  return data.status === 200 ? data.result : null;
}

async function decodeMega(text) {
  const r = await fetch(ENCDEC_DEC_MEGA, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, agent: HEADERS["User-Agent"] }),
  });
  const data = await r.json();
  return data.status === 200 ? data.result : null;
}

// Search AnimeKai by keyword to find the slug
async function searchAnime(keyword) {
  const url = `${ANIMEKAI_BASE}/ajax/anime/search?keyword=${encodeURIComponent(keyword)}`;
  const r = await fetch(url, { headers: AJAX_HEADERS });
  const data = await r.json();
  const html = data?.result?.html || "";

  // Parse slug from HTML
  const matches = [...html.matchAll(/href="\/watch\/([^"]+)"/g)];
  if (matches.length === 0) return null;
  return matches[0][1]; // first result slug
}

// Get ani_id from anime page
async function getAniId(slug) {
  const url = `${ANIMEKAI_BASE}/watch/${slug}`;
  const r = await fetch(url, { headers: HEADERS });
  const html = await r.text();
  const match = html.match(/data-id="([^"]+)"/);
  return match ? match[1] : null;
}

// Get episode list and find the token for a specific episode number
async function getEpisodeToken(aniId, episodeNumber) {
  const encoded = await encodeToken(aniId);
  if (!encoded) return null;

  const url = `${ANIMEKAI_BASE}/ajax/episodes/list?ani_id=${encodeURIComponent(encoded)}`;
  const r = await fetch(url, { headers: AJAX_HEADERS });
  const data = await r.json();
  const html = data?.result?.html || "";

  // Parse episodes - each episode has data-id and data-num
  const epMatches = [...html.matchAll(/data-num="(\d+(?:\.\d+)?)"[^>]*data-id="([^"]+)"/g)];
  const altMatches = [...html.matchAll(/data-id="([^"]+)"[^>]*data-num="(\d+(?:\.\d+)?)"/g)];

  let token = null;
  for (const m of epMatches) {
    if (parseInt(m[1]) === parseInt(episodeNumber)) {
      token = m[2];
      break;
    }
  }
  if (!token) {
    for (const m of altMatches) {
      if (parseInt(m[2]) === parseInt(episodeNumber)) {
        token = m[1];
        break;
      }
    }
  }
  return token;
}

// Get servers for an episode token
async function getServers(epToken) {
  const encoded = await encodeToken(epToken);
  if (!encoded) return null;

  const url = `${ANIMEKAI_BASE}/ajax/links/list?ep_id=${encodeURIComponent(encoded)}`;
  const r = await fetch(url, { headers: AJAX_HEADERS });
  const data = await r.json();
  const html = data?.result?.html || "";

  // Extract link IDs - look for sub/dub server buttons
  const linkMatches = [...html.matchAll(/data-id="([^"]+)"[^>]*>(.*?)<\/button>/gs)];
  return linkMatches.map(m => ({ id: m[1], label: m[2].replace(/<[^>]+>/g, '').trim() }));
}

// Get the actual stream source from a link id
async function getSource(linkId) {
  const encoded = await encodeToken(linkId);
  if (!encoded) return null;

  const url = `${ANIMEKAI_BASE}/ajax/links/view?id=${encodeURIComponent(encoded)}`;
  const r = await fetch(url, { headers: AJAX_HEADERS });
  const data = await r.json();
  const result = data?.result;
  if (!result) return null;

  // Try decoding as kai first, then mega
  let decoded = await decodeKai(result);
  if (!decoded) decoded = await decodeMega(result);
  if (!decoded) return null;

  try {
    const parsed = JSON.parse(decoded);
    // Return the m3u8 or embed src
    return parsed.src || parsed.url || parsed.link || parsed.file || decoded;
  } catch {
    return decoded;
  }
}

Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    const { mal_id, episode, audio_type = "sub", anime_title } = body;

    if (!mal_id || !episode) {
      return Response.json({ error: "mal_id and episode are required" }, { status: 400, headers: corsHeaders });
    }

    // Step 1: Search for the anime on AnimeKai using the title
    const slug = await searchAnime(anime_title || String(mal_id));
    if (!slug) {
      return Response.json({ error: "Anime not found on AnimeKai" }, { status: 404, headers: corsHeaders });
    }

    // Step 2: Get ani_id from the anime page
    const aniId = await getAniId(slug);
    if (!aniId) {
      return Response.json({ error: "Could not get anime ID from AnimeKai" }, { status: 404, headers: corsHeaders });
    }

    // Step 3: Get episode token
    const epToken = await getEpisodeToken(aniId, episode);
    if (!epToken) {
      return Response.json({ error: "Episode not found on AnimeKai" }, { status: 404, headers: corsHeaders });
    }

    // Step 4: Get servers
    const servers = await getServers(epToken);
    if (!servers || servers.length === 0) {
      return Response.json({ error: "No servers found for this episode" }, { status: 404, headers: corsHeaders });
    }

    // Pick sub or dub server
    const preferDub = audio_type === "dub";
    let chosenServer = servers.find(s => preferDub
      ? s.label.toLowerCase().includes("dub")
      : s.label.toLowerCase().includes("sub")
    ) || servers[0];

    // Step 5: Get the actual stream source
    const streamSrc = await getSource(chosenServer.id);
    if (!streamSrc) {
      return Response.json({ error: "Could not resolve stream source" }, { status: 502, headers: corsHeaders });
    }

    return Response.json({ src: streamSrc, server_label: chosenServer.label }, { headers: corsHeaders });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: { "Access-Control-Allow-Origin": "*" } });
  }
});