import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mal_id, episode } = await req.json();

    if (!mal_id || !episode) {
      return Response.json({ error: 'Missing mal_id or episode' }, { status: 400 });
    }

    // Try multiple sources and return first working one
    const sources = [
      () => scrapeVidplay(mal_id, episode),
      () => scrapeVidstream(mal_id, episode),
      () => scrapeEmbedly(mal_id, episode),
    ];

    for (const source of sources) {
      const result = await source();
      if (result?.src) return Response.json(result);
    }

    return Response.json({ 
      error: 'Episode not found',
      src: null 
    }, { status: 404 });
  } catch (error) {
    console.error('Scraper error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function scrapeVidplay(mal_id, episode) {
  try {
    const url = `https://vidplay.online/rapi/source/search?query=mal_id:${mal_id}%20ep:${episode}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.result && data.result.length > 0) {
      return { src: data.result[0].url };
    }
    return null;
  } catch (err) {
    console.error('Vidplay failed:', err);
    return null;
  }
}

async function scrapeVidstream(mal_id, episode) {
  try {
    const streamUrl = `https://vidstream.pro/anime/${mal_id}/episode/${episode}`;
    const res = await fetch(streamUrl);
    
    if (res.ok) {
      const html = await res.text();
      const srcMatch = html.match(/src\s*=\s*["']([^"']*\.m3u8[^"']*)["']/);
      if (srcMatch) {
        return { src: srcMatch[1] };
      }
    }
    return null;
  } catch (err) {
    console.error('Vidstream failed:', err);
    return null;
  }
}

async function scrapeEmbedly(mal_id, episode) {
  try {
    const streamUrl = `https://embedfly.org/anime/${mal_id}/${episode}`;
    const res = await fetch(streamUrl);
    
    if (res.ok) {
      const html = await res.text();
      const srcMatch = html.match(/src\s*=\s*["']([^"']*)["']/);
      if (srcMatch) {
        return { src: srcMatch[1] };
      }
    }
    return null;
  } catch (err) {
    console.error('Embedly failed:', err);
    return null;
  }
}