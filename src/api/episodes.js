// Vercel API route: /api/episodes
// Mirrors the old aniwatchProxy Base44 function

const ANIWATCH_BASE = 'https://api.anify.tv';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { title } = req.method === 'POST' ? req.body : req.query;
  if (!title) return res.status(400).json({ error: 'title is required' });

  try {
    // Search for the anime
    const searchRes = await fetch(`${ANIWATCH_BASE}/search?query=${encodeURIComponent(title)}&type=anime`);
    const searchData = await searchRes.json();
    const anime = searchData?.results?.[0];
    if (!anime) return res.status(404).json({ error: 'Anime not found', episodes: [] });

    // Fetch episodes
    const epRes = await fetch(`${ANIWATCH_BASE}/episodes/${anime.id}`);
    const epData = await epRes.json();

    const episodes = (epData || []).map(ep => ({
      id: ep.id,
      number: ep.number,
      title: ep.title || `Episode ${ep.number}`,
      isFiller: ep.isFiller || false,
    }));

    return res.status(200).json({ episodes });
  } catch (err) {
    return res.status(500).json({ error: err.message, episodes: [] });
  }
}