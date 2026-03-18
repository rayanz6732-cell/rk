import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, AlertCircle } from 'lucide-react';

export default function AnimeKaiPlayer({ mal_id, episode, audioType, animeTitle }) {
  const [streamSrc, setStreamSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setStreamSrc(null);
    setError(null);
    setLoading(true);

    base44.functions.invoke('animekaiStream', {
      mal_id,
      episode,
      audio_type: audioType,
    })
      .then(res => {
        const src = res.data?.src;
        if (!src) throw new Error(res.data?.error || 'No stream found');
        setStreamSrc(src);
      })
      .catch(err => setError(err.message || 'Failed to load stream'))
      .finally(() => setLoading(false));
  }, [mal_id, episode, audioType]);

  if (loading) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black gap-3">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-zinc-400 text-sm">Loading stream...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black gap-3 px-6 text-center">
        <AlertCircle className="w-10 h-10 text-red-500" />
        <p className="text-zinc-300 text-sm font-medium">Stream unavailable</p>
        <p className="text-zinc-600 text-xs">{error}</p>
        <p className="text-zinc-600 text-xs">Try Server 1 or Server 2</p>
      </div>
    );
  }

  // If it's an m3u8, use a video tag; if it's an embed URL, use iframe
  const isEmbed = streamSrc.startsWith('http') && !streamSrc.includes('.m3u8');

  return isEmbed ? (
    <iframe
      key={streamSrc}
      src={streamSrc}
      className="absolute inset-0 w-full h-full"
      allowFullScreen
      allow="fullscreen; autoplay; encrypted-media; picture-in-picture"
      sandbox="allow-same-origin allow-scripts allow-presentation allow-fullscreen"
      frameBorder="0"
      title="AnimeKai Player"
    />
  ) : (
    <video
      key={streamSrc}
      className="absolute inset-0 w-full h-full"
      controls
      autoPlay
      src={streamSrc}
    >
      Your browser does not support the video tag.
    </video>
  );
}