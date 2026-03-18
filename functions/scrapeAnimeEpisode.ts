import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mal_id, episode, audio_type } = await req.json();

    if (!mal_id || !episode) {
      return Response.json({ error: 'Missing mal_id or episode' }, { status: 400 });
    }

    // Try Zoro first (fast updates, good quality)
    const zoro = await scrapeZoro(mal_id, episode, audio_type);
    if (zoro) return Response.json(zoro);

    // Try Gogoanime as fallback
    const gogo = await scrapeGogoanime(mal_id, episode, audio_type);
    if (gogo) return Response.json(gogo);

    // Try Animixplay as secondary fallback
    const animix = await scrapeAnimixplay(mal_id, episode, audio_type);
    if (animix) return Response.json(animix);

    return Response.json({ 
      error: 'Episode not found on any source',
      src: null 
    }, { status: 404 });
  } catch (error) {
    console.error('Scraper error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function scrapeZoro(mal_id, episode, audioType) {
  try {
    const res = await fetch(`https://zoro.to/search?keyword=mal_id:${mal_id}`);
    const html = await res.text();
    
    // Parse and extract anime URL
    const match = html.match(/href="([^"]*\/anime\/[^"]+)"/);
    if (!match) return null;

    const animeUrl = `https://zoro.to${match[1]}`;
    const epRes = await fetch(`${animeUrl}?ep=${episode}`);
    const epHtml = await epRes.text();

    // Extract embed URL
    const embedMatch = epHtml.match(/src="([^"]*(?:rapidcloud|filemoon)[^"]*)"/);
    if (!embedMatch) return null;

    return { src: embedMatch[1] };
  } catch (err) {
    console.error('Zoro scrape failed:', err);
    return null;
  }
}

async function scrapeGogoanime(mal_id, episode, audioType) {
  try {
    const res = await fetch(`https://gogoanime.bid/?s=${mal_id}`);
    const html = await res.text();

    // Extract anime slug
    const slugMatch = html.match(/href="([^"]*\/category\/[^"]+)"/);
    if (!slugMatch) return null;

    const animeUrl = slugMatch[1];
    const epNum = String(episode).padStart(5, '0');
    const epUrl = `${animeUrl}-episode-${episode}`;

    const epRes = await fetch(epUrl);
    const epHtml = await epRes.text();

    // Extract stream iframe
    const iframeMatch = epHtml.match(/src="([^"]*(?:goload|vidcdn)[^"]*)"/);
    if (!iframeMatch) return null;

    return { src: iframeMatch[1] };
  } catch (err) {
    console.error('Gogoanime scrape failed:', err);
    return null;
  }
}

async function scrapeAnimixplay(mal_id, episode, audioType) {
  try {
    const res = await fetch(`https://animixplay.to/?q=${mal_id}`);
    const html = await res.text();

    // Extract anime link
    const linkMatch = html.match(/href="([^"]*\/anime\/[^"]+)"/);
    if (!linkMatch) return null;

    const animeUrl = `https://animixplay.to${linkMatch[1]}`;
    const epRes = await fetch(`${animeUrl}?ep=${episode}`);
    const epHtml = await epRes.text();

    // Extract player embed
    const playerMatch = epHtml.match(/src="([^"]*player[^"]*)"/);
    if (!playerMatch) return null;

    return { src: playerMatch[1] };
  } catch (err) {
    console.error('Animixplay scrape failed:', err);
    return null;
  }
}