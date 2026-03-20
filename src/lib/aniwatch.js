import { base44 } from '@/api/base44Client';

export async function getEpisodesByTitle(title) {
  if (!title) return [];
  const res = await base44.functions.invoke('aniwatchProxy', { title });
  return res.data?.episodes || [];
}

export const AniwatchAPI = { getEpisodesByTitle };