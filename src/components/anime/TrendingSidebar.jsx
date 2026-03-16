import React from 'react';
import { Link } from 'react-router-dom';
import { Flame, Star } from 'lucide-react';

export default function TrendingSidebar({ trending }) {
  if (!trending?.length) return null;

  return (
    <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/50 p-5">
      <div className="flex items-center gap-2 mb-5">
        <Flame className="w-5 h-5 text-orange-500" />
        <h3 className="text-lg font-bold text-white">Top Trending</h3>
        <span className="ml-auto px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
          NOW
        </span>
      </div>
      <div className="space-y-3">
        {trending.map((anime, index) => (
          <Link
            key={anime.id}
            to={`/AnimeDetail?id=${anime.mal_id || anime.id}`}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-800/60 transition-colors group"
          >
            <span className={`text-2xl font-black w-8 text-center ${
              index === 0 ? 'text-emerald-500' : index === 1 ? 'text-emerald-600/80' : index === 2 ? 'text-emerald-700/60' : 'text-zinc-700'
            }`}>
              {index + 1}
            </span>
            <div className="w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800">
              {anime.cover_image && (
                <img src={anime.cover_image} alt={anime.title} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-zinc-300 group-hover:text-emerald-400 transition-colors line-clamp-1">
                {anime.title}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                {anime.score > 0 && (
                  <span className="flex items-center gap-0.5 text-[10px] text-yellow-500">
                    <Star className="w-3 h-3 fill-yellow-500" /> {anime.score}
                  </span>
                )}
                {anime.type && (
                  <span className="text-[10px] text-zinc-600">{anime.type}</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}