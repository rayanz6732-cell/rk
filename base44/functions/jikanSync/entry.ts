import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const JIKAN_BASE = 'https://api.jikan.moe/v4';

async function jikanGet(path) {
  const res = await fetch(`${JIKAN_BASE}${path}`);
  if (!res.ok) throw new Error(`Jikan error: ${res.status}`);
  return res.json();
}

async function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Admin only' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const action = body.action || 'sync';

  if (action === 'latest-episodes') {
    // Return currently airing schedule from Jikan
    const data = await jikanGet('/schedules?filter=monday,tuesday,wednesday,thursday,friday,saturday,sunday&limit=25');
    const episodes = (data.data || []).map(a => ({
      mal_id: a.mal_id,
      title: a.title,
      latest_episode: a.episodes || null,
      cover_image: a.images?.jpg?.large_image_url || a.images?.jpg?.image_url,
      score: a.score,
      status: 'ongoing',
    }));
    return Response.json({ episodes });
  }

  // action === 'sync': fetch current season airing anime and upsert into Anime entity
  const synced = [];
  const errors = [];

  // Fetch current season airing
  let page = 1;
  let hasNext = true;
  const allAnime = [];

  while (hasNext && page <= 3) {
    const data = await jikanGet(`/seasons/now?page=${page}&limit=25`);
    const items = data.data || [];
    allAnime.push(...items);
    hasNext = data.pagination?.has_next_page || false;
    page++;
    if (hasNext) await delay(400); // respect rate limit
  }

  // Also fetch top airing
  await delay(400);
  const topAiring = await jikanGet('/top/anime?filter=airing&limit=25');
  for (const a of topAiring.data || []) {
    if (!allAnime.find(x => x.mal_id === a.mal_id)) {
      allAnime.push(a);
    }
  }

  // Get existing anime from DB
  const existing = await base44.asServiceRole.entities.Anime.list('-updated_date', 200);
  const existingMap = {};
  for (const e of existing) {
    if (e.mal_id) existingMap[String(e.mal_id)] = e;
  }

  for (const a of allAnime) {
    try {
      const malId = String(a.mal_id);
      const latestEp = a.episodes_aired ?? a.episodes ?? null;

      const payload = {
        title: a.title,
        description: a.synopsis || '',
        genres: (a.genres || []).map(g => g.name),
        status: a.status === 'Currently Airing' ? 'ongoing' : a.status === 'Finished Airing' ? 'completed' : 'upcoming',
        type: ['TV', 'Movie', 'OVA', 'ONA', 'Special'].includes(a.type) ? a.type : 'TV',
        release_year: a.aired?.from ? new Date(a.aired.from).getFullYear() : null,
        episodes: a.episodes || null,
        latest_episode: latestEp,
        cover_image: a.images?.jpg?.large_image_url || a.images?.jpg?.image_url || '',
        score: a.score || null,
        is_trending: a.rank ? a.rank <= 50 : false,
        mal_id: malId,
      };

      if (existingMap[malId]) {
        // Only update latest_episode if changed
        if (existingMap[malId].latest_episode !== latestEp) {
          await base44.asServiceRole.entities.Anime.update(existingMap[malId].id, { latest_episode: latestEp, score: a.score || null });
          synced.push({ mal_id: malId, title: a.title, action: 'updated' });
        } else {
          synced.push({ mal_id: malId, title: a.title, action: 'skipped' });
        }
      } else {
        await base44.asServiceRole.entities.Anime.create(payload);
        synced.push({ mal_id: malId, title: a.title, action: 'created' });
      }

      await delay(100);
    } catch (err) {
      errors.push({ title: a.title, error: err.message });
    }
  }

  return Response.json({
    total: allAnime.length,
    synced,
    errors,
    summary: {
      created: synced.filter(s => s.action === 'created').length,
      updated: synced.filter(s => s.action === 'updated').length,
      skipped: synced.filter(s => s.action === 'skipped').length,
    }
  });
});