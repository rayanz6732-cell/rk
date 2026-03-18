import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// Scrape from Zoro.to
async function getFromZoro(title, episode) {
  try {
    const searchUrl = `https://zoro.to/search?keyword=${encodeURIComponent(title)}`;
    const res = await fetch(searchUrl, { 
      headers: { "User-Agent": UA },
      redirect: "follow"
    });
    const html = await res.text();
    
    // Extract first anime link - look for /watch/ URLs
    const animeMatch = html.match(/href="(\/watch\/[^"]+\/)"/);
    if (!animeMatch) return null;
    
    const animeUrl = `https://zoro.to${animeMatch[1]}?ep=${episode}`;
    const epRes = await fetch(animeUrl, { 
      headers: { "User-Agent": UA, "Referer": "https://zoro.to" },
      redirect: "follow"
    });
    const epHtml = await epRes.text();
    
    // Extract data-src from iframe or player
    let iframeMatch = epHtml.match(/data-src="([^"]+)"/);
    if (!iframeMatch) {
      iframeMatch = epHtml.match(/src="([^"]*(?:rapid|gogocdn|voe)[^"]*)/i);
    }
    
    return iframeMatch ? iframeMatch[1] : null;
  } catch (err) {
    console.error("Zoro error:", err.message);
    return null;
  }
}

// Scrape from Animixplay
async function getFromAnimixplay(title, episode) {
  try {
    const searchUrl = `https://animixplay.to/?s=${encodeURIComponent(title)}`;
    const res = await fetch(searchUrl, { 
      headers: { "User-Agent": UA },
      redirect: "follow"
    });
    const html = await res.text();
    
    // Extract anime URL from search results
    const animeMatch = html.match(/href="(\/anime\/[^"]+)"/);
    if (!animeMatch) return null;
    
    const animeSlug = animeMatch[1];
    const epNum = String(episode).padStart(2, '0');
    const videoUrl = `https://animixplay.to${animeSlug}?ep=${epNum}`;
    
    const epRes = await fetch(videoUrl, { 
      headers: { "User-Agent": UA, "Referer": "https://animixplay.to" },
      redirect: "follow"
    });
    const epHtml = await epRes.text();
    
    // Look for iframe src
    let iframeMatch = epHtml.match(/src="([^"]*(?:rapid|gogocdn|vidstream)[^"]*)/i);
    if (!iframeMatch) {
      iframeMatch = epHtml.match(/id="embed" src="([^"]+)/i);
    }
    
    return iframeMatch ? iframeMatch[1] : null;
  } catch (err) {
    console.error("Animixplay error:", err.message);
    return null;
  }
}

// Scrape from 9Anime
async function getFrom9Anime(title, episode) {
  try {
    const searchUrl = `https://9animetv.to/search?keyword=${encodeURIComponent(title)}`;
    const res = await fetch(searchUrl, { 
      headers: { "User-Agent": UA },
      redirect: "follow"
    });
    const html = await res.text();
    
    const animeMatch = html.match(/href="(\/watch\/[^"]+)"/);
    if (!animeMatch) return null;
    
    const animeUrl = `https://9animetv.to${animeMatch[1]}?ep=${episode}`;
    const epRes = await fetch(animeUrl, { 
      headers: { "User-Agent": UA, "Referer": "https://9animetv.to" },
      redirect: "follow"
    });
    const epHtml = await epRes.text();
    
    // Extract player iframe
    const iframeMatch = epHtml.match(/id="player"[^>]*src="([^"]+)/i) || 
                        epHtml.match(/src="([^"]*(?:streamtape|mixdrop)[^"]*)/i);
    
    return iframeMatch ? iframeMatch[1] : null;
  } catch (err) {
    console.error("9Anime error:", err.message);
    return null;
  }
}

// Scrape from GogoAnime (fastest updates)
async function getFromGogoAnime(title, episode) {
  try {
    // GogoAnime search
    const searchUrl = `https://gogoanimes.fi/search.html?keyword=${encodeURIComponent(title)}`;
    const res = await fetch(searchUrl, { 
      headers: { "User-Agent": UA },
      redirect: "follow"
    });
    const html = await res.text();
    
    const animeMatch = html.match(/href="\/category\/([^"]+)"/);
    if (!animeMatch) return null;
    
    const slug = animeMatch[1];
    const epSlug = `${slug}-episode-${episode}`;
    const epUrl = `https://gogoanimes.fi/${epSlug}`;
    
    const epRes = await fetch(epUrl, { 
      headers: { "User-Agent": UA, "Referer": "https://gogoanimes.fi" },
      redirect: "follow"
    });
    const epHtml = await epRes.text();
    
    // Extract iframe source - GogoAnime uses data-video attribute
    const iframeMatch = epHtml.match(/data-video="([^"]+)"/);
    
    return iframeMatch ? iframeMatch[1] : null;
  } catch (err) {
    console.error("GogoAnime error:", err.message);
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

    // Try multiple sources in priority order (fastest update sites first)
    let src = await getFromGogoAnime(title, episode);
    if (!src) src = await getFromZoro(title, episode);
    if (!src) src = await getFromAnimixplay(title, episode);
    if (!src) src = await getFrom9Anime(title, episode);

    if (!src) {
      return Response.json({ 
        error: "Episode not found on available sources. Try a different server or check if episode has been released.", 
        title 
      }, { status: 404, headers: cors });
    }

    return Response.json({ src, title, source: "scraper" }, { headers: cors });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: cors });
  }
});