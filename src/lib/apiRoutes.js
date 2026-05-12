// Vercel API route callers — replace base44.functions.invoke(...)

export async function fetchEpisodes(title) {
  try {
    const res = await fetch('/api/episodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) return { episodes: [] };
    const data = await res.json();
    return data;
  } catch {
    return { episodes: [] };
  }
}

export async function fetchStreamSrc({ mal_id, episode, audio_type, anime_title }) {
  const res = await fetch('/api/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mal_id, episode, audio_type, anime_title }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to load stream');
  }
  return res.json();
}