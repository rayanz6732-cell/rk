import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Star } from 'lucide-react';


export default function AnimeCard({ anime }) {
  const navigate = useNavigate();
  return (
    <div onClick={() => navigate(`/AnimeDetail?id=${anime.mal_id || anime.id}`)} className="group relative block cursor-pointer">
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-zinc-900">
        {anime.cover_image ? (
          <img
            src={anime.cover_image}
            alt={anime.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-900/40 to-zinc-900 flex items-center justify-center">
            <Play className="w-10 h-10 text-emerald-500/50" />
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Play button on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>

        {/* Top badges */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          {anime.quality && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-white">
              {anime.quality}
            </span>
          )}
          {anime.type && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 backdrop-blur-sm text-white">
              {anime.type}
            </span>
          )}
        </div>

        {/* Episode counts */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1.5">
          {anime.score > 0 && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/60 text-[10px] font-medium text-yellow-400 ml-auto">
              ★ {anime.score}
            </span>
          )}
          {anime.episodes > 0 && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-700/90 text-[10px] font-medium text-white">
              {anime.episodes} EP
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="mt-2.5 px-0.5">
        <h3 className="text-sm font-medium text-zinc-200 line-clamp-2 group-hover:text-emerald-400 transition-colors">
          {anime.title}
        </h3>
        {anime.score > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            <span className="text-xs text-zinc-500">{anime.score}</span>
          </div>
        )}
      </div>
    </Link>
  );
}