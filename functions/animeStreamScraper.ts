import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// Scrape from Zoro.to (uses Rapid Cloud)
async function getFromZoro(title, episode) {
  try {
    const searchUrl = `https://zoro.to/search?keyword=${encodeURIComponent(title)}`;
    const res = await fetch(searchUrl, { headers: { "User-Agent": UA } });
    const html = await res.text();
    
    // Extract first anime link
    const match = html.match(/href="(\/watch\/[^"]+)"/);
    if (!match) return null;
    
    const animeUrl = `https://zoro.to${match[1]}`;
    const animeRes = await fetch(animeUrl, { headers: { "User-Agent": UA } });
    const animeHtml = await animeRes.text();
    
    // Extract episode link
    const epRegex = new RegExp(`href="([^"]*ep=${episode}[^"]*)"`, 'i');
    const epMatch = animeHtml.match(epRegex);
    if (!epMatch) return null;
    
    const epUrl = epMatch[1].startsWith('http') ? epMatch[1] : `https://zoro.to${epMatch[1]}`;
    const epRes = await fetch(epUrl, { headers: { "User-Agent": UA } });
    const epHtml = await epRes.text();
    
    // Extract iframe src
    const iframeMatch = epHtml.match(/data-src="([^"]+)"/);
    return iframeMatch ? iframeMatch[1] : null;
  } catch (err) {
    return null;
  }
}

// Scrape from Animixplay
async function getFromAnimixplay(title, episode) {
  try {
    const searchUrl = `https://animixplay.to/?s=${encodeURIComponent(title)}`;
    const res = await fetch(searchUrl, { headers: { "User-Agent": UA } });
    const html = await res.text();
    
    // Extract anime slug from search results
    const match = html.match(/href="(\/anime\/[^"]+)"/);
    if (!match) return null;
    
    const animeSlug = match[1];
    const epNum = String(episode).padStart(2, '0');
    const videoUrl = `https://animixplay.to${animeSlug.slice(0, -1)}?ep=${epNum}`;
    
    const epRes = await fetch(videoUrl, { headers: { "User-Agent": UA } });
    const epHtml = await epRes.text();
    
    // Look for iframe or embed
    const iframeMatch = epHtml.match(/src="([^"]*(?:rapid|gogocdn|mixdrop)[^"]*)" allow/i);
    return iframeMatch ? iframeMatch[1] : null;
  } catch (err) {
    return null;
  }
}

// Fallback: Try to get from 9anime
async function getFrom9Anime(title, episode) {
  try {
    const searchUrl = `https://9animetv.to/search?keyword=${encodeURIComponent(title)}`;
    const res = await fetch(searchUrl, { headers: { "User-Agent": UA } });
    const html = await res.text();
    
    const match = html.match(/href="(\/watch\/[^"]+)"/);
    if (!match) return null;
    
    const animeUrl = `https://9animetv.to${match[1]}?ep=${episode}`;
    const epRes = await fetch(animeUrl, { headers: { "User-Agent": UA } });
    const epHtml = await epRes.text();
    
    const iframeMatch = epHtml.match(/src="([^"]*(?:streamtape|mixdrop|doodstream)[^"]*)?"/i);
    return iframeMatch ? iframeMatch[1] : null;
  } catch (err) {
    return null;
  }
}

Deno.serve(async (req) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401, headers: cors });

    const body = await req.json();
    const { title, episode } = body;

    if (!title || !episode) {
      return Response.json({ error: "title and episode required" }, { status: 400, headers: cors });
    }

    // Try multiple sources in order
    let src = await getFromZoro(title, episode);
    if (!src) src = await getFromAnimixplay(title, episode);
    if (!src) src = await getFrom9Anime(title, episode);

    if (!src) {
      return Response.json({ error: "Stream not found on available sources", title }, { status: 404, headers: cors });
    }

    return Response.json({ src, title }, { headers: cors });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: cors });
  }
});