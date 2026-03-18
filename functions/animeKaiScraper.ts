import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Scrape AnimeKai to get the embed/watch URL for a given MAL ID and episode
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const { mal_id, episode, type } = await req.json();

  if (!mal_id || !episode) {
    return Response.json({ error: 'mal_id and episode are required' }, { status: 400 });
  }

  const audioType = type || 'sub'; // sub or dub

  try {
    // Step 1: Search AnimeKai by title, then verify by MAL ID on the anime page
    const { title } = await req.json().catch(() => ({}));
    const searchKeyword = title || String(mal_id);

    const searchRes = await fetch(`https://animekai.to/ajax/anime/search?keyword=${encodeURIComponent(searchKeyword)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': 'https://animekai.to/',
      }
    });

    if (!searchRes.ok) {
      return Response.json({ error: 'AnimeKai search failed' }, { status: 502 });
    }

    const searchData = await searchRes.json();
    const html = searchData?.result?.html || '';

    // Extract all watch slugs from the search results
    const slugMatches = [...html.matchAll(/href="\/watch\/([^"]+)"/g)].map(m => m[1]);
    if (!slugMatches.length) {
      return Response.json({ error: 'Anime not found on AnimeKai' }, { status: 404 });
    }

    // Find the correct anime by checking data-mal-id on each candidate page
    let slug = null;
    for (const candidate of slugMatches.slice(0, 5)) {
      const pageRes = await fetch(`https://animekai.to/watch/${candidate}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      if (!pageRes.ok) continue;
      const pageHtml = await pageRes.text();
      if (pageHtml.includes(`data-mal-id="${mal_id}"`)) {
        slug = candidate;
        break;
      }
    }

    if (!slug) {
      return Response.json({ error: 'Anime not found on AnimeKai (MAL ID mismatch)' }, { status: 404 });
    }

    const animeId = slug.split('-').pop(); // e.g. "dk6r"

    // Step 2: Get episode list to find the ep_id token
    const epListRes = await fetch(`https://animekai.to/ajax/episodes?id=${animeId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': `https://animekai.to/watch/${slug}`,
      }
    });

    if (!epListRes.ok) {
      // Fallback: return direct watch URL as iframe src
      const watchUrl = `https://animekai.to/watch/${slug}#ep=${episode}`;
      return Response.json({ watch_url: watchUrl, slug, anime_id: animeId });
    }

    const epData = await epListRes.json();
    const epHtml = epData?.result?.html || epData?.result || '';

    // Look for the ep_id for the requested episode number
    // Format in HTML: data-id="TOKEN" data-ep="1"
    const epPattern = new RegExp(`data-id="([^"]+)"[^>]*data-ep="${episode}"`);
    const epMatch = String(epHtml).match(epPattern);

    if (!epMatch) {
      // Return direct watch URL as fallback
      const watchUrl = `https://animekai.to/watch/${slug}#ep=${episode}`;
      return Response.json({ watch_url: watchUrl, slug, anime_id: animeId });
    }

    const epId = epMatch[1];

    // Step 3: Get server links for the episode
    const typeNum = audioType === 'dub' ? 2 : audioType === 'softsub' ? 3 : 1; // 1=hardsub, 2=dub, 3=softsub
    const linksRes = await fetch(`https://animekai.to/ajax/links?ani_id=${animeId}&ep_id=${epId}&type=${typeNum}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': `https://animekai.to/watch/${slug}`,
      }
    });

    if (!linksRes.ok) {
      const watchUrl = `https://animekai.to/watch/${slug}#ep=${episode}`;
      return Response.json({ watch_url: watchUrl, slug, anime_id: animeId });
    }

    const linksData = await linksRes.json();

    return Response.json({
      slug,
      anime_id: animeId,
      ep_id: epId,
      links: linksData?.result || [],
      watch_url: `https://animekai.to/watch/${slug}#ep=${episode}`,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});