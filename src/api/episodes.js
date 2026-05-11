// Vercel serverless function — replaces base44 aniwatchProxy
// Deploy this to Vercel: /api/episodes

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });

  try {
    // Search AniWatch for the anime
    const searchRes = await fetch(
      `https://aniwatch-api-v1.vercel.app/api/v2/hianime/search?q=${encodeURIComponent(title)}&page=1`,
      { headers: { 'Accept': 'application/json' } }
    );
    const searchData = await searchRes.json();
    const firstResult = searchData?.data?.animes?.[0];
    if (!firstResult) return res.json({ episodes: [] });

    // Get episodes for first result
    const epRes = await fetch(
      `https://aniwatch-api-v1.vercel.app/api/v2/hianime/anime/${firstResult.id}/episodes`,
      { headers: { 'Accept': 'application/json' } }
    );
    const epData = await epRes.json();
    const episodes = (epData?.data?.episodes || []).map(e => ({
      number: e.number,
      title: e.title,
      isFiller: e.isFiller || false,
    }));

    return res.json({ episodes });
  } catch (err) {
    return res.status(500).json({ error: err.message, episodes: [] });
  }
}