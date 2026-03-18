import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';

export default function SeasonCard({ entry, seasonNumber }) {
  const [imgUrl, setImgUrl] = useState('');

  useEffect(() => {
    // Fetch the actual cover image from Jikan
    fetch(`https://api.jikan.moe/v4/anime/${entry.mal_id}`)
      .then(r => r.json())
      .then(d => {
        const url = d?.data?.images?.jpg?.large_image_url || d?.data?.images?.jpg?.image_url || '';
        setImgUrl(url);
      })
      .catch(() => {});
  }, [entry.mal_id]);

  return (
    <Link
      to={`/AnimeDetail?id=${entry.mal_id}`}
      className="group bg-zinc-900 border border-zinc-800/50 hover:border-emerald-500/60 rounded-xl overflow-hidden transition-all"
    >
      <div className="aspect-[3/4] bg-zinc-800 relative overflow-hidden">
        {imgUrl ? (
          <img
            src={imgUrl}
            alt={entry.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-8 h-8 text-zinc-700" />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
          <span className="text-[10px] font-black text-emerald-400 uppercase">Season {seasonNumber}</span>
        </div>
      </div>
      <div className="p-2">
        <p className="text-xs text-zinc-300 font-medium line-clamp-2 group-hover:text-emerald-400 transition-colors">{entry.name}</p>
      </div>
    </Link>
  );
}