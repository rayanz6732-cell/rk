import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const HIANIME_BASE = "https://hianime.to";

async function searchHiAnime(title) {
  try {
    const res = await fetch(
      `${HIANIME_BASE}/search?keyword=${encodeURIComponent(title)}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml",
          "Referer": "https://hianime.to"
        }
      }
    );
    const html = await res.text();
    const slugMatch = html.match(/href="\/([a-z0-9-]+-\d+)"[^>]*class="[^"]*film-name[^"]*"/);
    const epMatch = html.match(/class="tick-eps[^"]*"[^>]*>(\d+)</);
    return {
      slug: slugMatch ? slugMatch[1] : null,
      latestEpisode: epMatch ? parseInt(epMatch[1]) : null
    };
  } catch (err) {
    console.error(`[HiAnime] searchHiAnime error for "${title}":`, err.message);
    return { slug: null, latestEpisode: null };
  }
}

async function getLatestEpisodeFromHiAnime(title) {
  const { slug, latestEpisode } = await searchHiAnime(title);
  if (!slug) return null;

  try {
    const res = await fetch(`${HIANIME_BASE}/${slug}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://hianime.to"
      }
    });
    const html = await res.text();
    const epCountMatch = html.match(/class="tick-eps[^"]*"[^>]*>(\d+)<\/span>/);
    const subCountMatch = html.match(/class="tick-sub[^"]*"[^>]*>(\d+)<\/span>/);
    return {
      slug,
      latestEpisode: epCountMatch ? parseInt(epCountMatch[1]) : latestEpisode,
      subEpisodes: subCountMatch ? parseInt(subCountMatch[1]) : null
    };
  } catch (err) {
    console.error(`[HiAnime] getLatestEpisode error for "${title}":`, err.message);
    return { slug, latestEpisode };
  }
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Admin only' }, { status: 403 });
  }

  // Fetch all ongoing anime from DB
  const allAnime = await base44.asServiceRole.entities.Anime.filter({ status: 'ongoing' });
  console.log(`[HiAnime] Syncing ${allAnime.length} ongoing anime...`);

  const updated = [];
  const skipped = [];
  const errors = [];

  for (const anime of allAnime) {
    try {
      const data = await getLatestEpisodeFromHiAnime(anime.title);

      if (data?.latestEpisode && data.latestEpisode > (anime.latest_episode || 0)) {
        await base44.asServiceRole.entities.Anime.update(anime.id, {
          latest_episode: data.latestEpisode,
          ...(data.subEpisodes && { sub_episodes: data.subEpisodes })
        });
        updated.push({ title: anime.title, previous: anime.latest_episode, updated: data.latestEpisode });
        console.log(`[HiAnime] Updated "${anime.title}": ep ${anime.latest_episode} → ${data.latestEpisode}`);
      } else {
        skipped.push(anime.title);
      }

      await new Promise(r => setTimeout(r, 1500));
    } catch (err) {
      console.error(`[HiAnime] Failed for "${anime.title}":`, err.message);
      errors.push({ title: anime.title, error: err.message });
    }
  }

  console.log(`[HiAnime] Sync complete. Updated ${updated.length} anime.`);
  return Response.json({
    total: allAnime.length,
    summary: {
      updated: updated.length,
      skipped: skipped.length,
      errors: errors.length
    },
    updated,
    errors
  });
});