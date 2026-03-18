import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Scrape AnimeKai to get the watch URL for a given MAL ID and episode
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const body = await req.json();
  const { mal_id, episode, type, title } = body;

  if (!mal_id || !episode) {
    return Response.json({ error: 'mal_id and episode are required' }, { status: 400 });
  }

  const audioType = type || 'sub';
  const searchKeyword = title || String(mal_id);

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'X-Requested-With': 'XMLHttpRequest',
    'Referer': 'https://animekai.to/',
  };

  try {
    // Step 1: Search AnimeKai by title
    const searchRes = await fetch(
      `https://animekai.to/ajax/anime/search?keyword=${encodeURIComponent(searchKeyword)}`,
      { headers }
    );

    if (!searchRes.ok) {
      return Response.json({ error: 'AnimeKai search failed' }, { status: 502 });
    }

    const searchData = await searchRes.json();
    const searchHtml = searchData?.result?.html || '';

    // Extract all watch slugs from results
    const slugMatches = [...searchHtml.matchAll(/href="\/watch\/([^"]+)"/g)].map(m => m[1]);
    if (!slugMatches.length) {
      return Response.json({ error: 'Anime not found on AnimeKai' }, { status: 404 });
    }

    // Step 2: Verify correct anime by matching data-mal-id on the page
    let slug = null;
    for (const candidate of slugMatches.slice(0, 5)) {
      const pageRes = await fetch(`https://animekai.to/watch/${candidate}`, {
        headers: { 'User-Agent': headers['User-Agent'] }
      });
      if (!pageRes.ok) continue;
      const pageHtml = await pageRes.text();
      if (pageHtml.includes(`data-mal-id="${mal_id}"`)) {
        slug = candidate;
        break;
      }
    }

    if (!slug) {
      return Response.json({ error: 'Anime not found on AnimeKai' }, { status: 404 });
    }

    const animeId = slug.split('-').pop(); // e.g. "dk6r" from "one-piece-dk6r"

    // Step 3: Get episode list to find the episode token
    const epListRes = await fetch(`https://animekai.to/ajax/episodes?id=${animeId}`, {
      headers: { ...headers, Referer: `https://animekai.to/watch/${slug}` }
    });

    const watchUrl = `https://animekai.to/watch/${slug}#ep=${episode}`;

    if (!epListRes.ok) {
      return Response.json({ watch_url: watchUrl, slug, anime_id: animeId });
    }

    const epData = await epListRes.json();
    const epHtml = String(epData?.result?.html || epData?.result || '');

    // Find ep_id for requested episode: data-id="TOKEN" ... data-ep="N"
    const epPattern = new RegExp(`data-id="([^"]+)"[^>]*data-ep="${episode}"`);
    const epMatch = epHtml.match(epPattern);

    if (!epMatch) {
      return Response.json({ watch_url: watchUrl, slug, anime_id: animeId });
    }

    const epId = epMatch[1];

    // Step 4: Get video server links
    const typeNum = audioType === 'dub' ? 2 : 1; // 1=sub/hardsub, 2=dub
    const linksRes = await fetch(
      `https://animekai.to/ajax/links?ani_id=${animeId}&ep_id=${epId}&type=${typeNum}`,
      { headers: { ...headers, Referer: `https://animekai.to/watch/${slug}` } }
    );

    if (!linksRes.ok) {
      return Response.json({ watch_url: watchUrl, slug, anime_id: animeId, ep_id: epId });
    }

    const linksData = await linksRes.json();

    return Response.json({
      slug,
      anime_id: animeId,
      ep_id: epId,
      links: linksData?.result || [],
      watch_url: watchUrl,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});