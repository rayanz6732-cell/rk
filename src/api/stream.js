// Vercel API route: /api/stream
// Mirrors the old animekaiStream Base44 function

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const GOGO_BASE = "https://gogoanimes.fi";

async function getAnimeTitleFromAniList(malId) {
  const query = `query ($malId: Int) { Media(idMal: $malId, type: ANIME) { title { english romaji } } }`;
  try {
    const r = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { malId: parseInt(malId) } }),
    });
    const data = await r.json();
    return data?.data?.Media?.title?.english || data?.data?.Media?.title?.romaji || null;
  } catch { return null; }
}

async function searchGogoanime(query) {
  const r = await fetch(`${GOGO_BASE}/search.html?keyword=${encodeURIComponent(query)}`, { headers: { "User-Agent": UA } });
  const html = await r.text();
  const matches = [...html.matchAll(/href="\/category\/([^"]+)"/g)];
  return [...new Set(matches.map(m => m[1]))];
}

function pickSlug(slugs, isDub) {
  if (!slugs.length) return null;
  if (isDub) return slugs.find(s => s.endsWith('-dub')) || slugs[0];
  return slugs.find(s => !s.endsWith('-dub') && !s.endsWith('-tv')) || slugs.find(s => !s.endsWith('-dub')) || slugs[0];
}

async function getEpisodeSrc(slug, episode) {
  const r = await fetch(`${GOGO_BASE}/${slug}-episode-${episode}`, { headers: { "User-Agent": UA, "Referer": GOGO_BASE } });
  if (!r.ok) return null;
  const html = await r.text();
  const m = html.match(/data-video="([^"]+)"/);
  return m ? m[1] : null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { mal_id, episode, audio_type = 'sub', anime_title } = req.body;
  if (!mal_id || !episode) return res.status(400).json({ error: 'mal_id and episode are required' });

  const isDub = audio_type === 'dub';
  let searchTitle = anime_title || await getAnimeTitleFromAniList(mal_id);
  if (!searchTitle) return res.status(404).json({ error: 'Could not resolve anime title' });

  let slugs = await searchGogoanime(searchTitle);
  if (!slugs.length) slugs = await searchGogoanime(searchTitle.split(' ').slice(0, 3).join(' '));
  if (!slugs.length) return res.status(404).json({ error: 'Anime not found on streaming source', title: searchTitle });

  const slug = pickSlug(slugs, isDub);
  const src = await getEpisodeSrc(slug, episode);

  if (!src) {
    for (const fallback of slugs.slice(1, 4)) {
      const fallbackSrc = await getEpisodeSrc(fallback, episode);
      if (fallbackSrc) return res.status(200).json({ src: fallbackSrc, slug: fallback, title: searchTitle });
    }
    return res.status(404).json({ error: 'Episode not found', slug, title: searchTitle });
  }

  return res.status(200).json({ src, slug, title: searchTitle });
}