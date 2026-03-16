import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Info, ChevronLeft, ChevronRight, Captions, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

export default function HeroBanner({ featured }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (featured.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % featured.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [featured.length]);

  if (!featured.length) return null;

  const anime = featured[current];

  return (
    <div className="relative w-full h-[70vh] min-h-[480px] max-h-[700px] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={anime.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          {anime.banner_image || anime.cover_image ? (
            <img
              src={anime.banner_image || anime.cover_image}
              alt={anime.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-emerald-950 to-zinc-950" />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-black/30" />

      {/* Content */}
      <div className="absolute inset-0 flex items-center">
        <div className="container mx-auto px-6 md:px-12 max-w-7xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={anime.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl"
            >
              {/* Tags */}
              <div className="flex items-center gap-2 mb-4">
                {anime.rating && (
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {anime.rating}
                  </span>
                )}
                {anime.type && (
                  <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-white/10 text-zinc-300">
                    {anime.type}
                  </span>
                )}
                {anime.quality && (
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-violet-500/20 text-violet-400">
                    {anime.quality}
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight mb-4">
                {anime.title}
              </h1>

              {/* Genre badges */}
              {anime.genres?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {anime.genres.map((g) => (
                    <span key={g} className="text-xs text-zinc-400 font-medium">
                      {g}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-sm md:text-base text-zinc-400 line-clamp-3 mb-6 leading-relaxed max-w-xl">
                {anime.description}
              </p>

              {/* Info row */}
              <div className="flex items-center gap-4 mb-6 text-sm text-zinc-500">
                {anime.release_year && <span>{anime.release_year}</span>}
                {anime.sub_episodes > 0 && (
                  <span className="flex items-center gap-1 text-violet-400">
                    <Captions className="w-3.5 h-3.5" /> CC {anime.sub_episodes}
                  </span>
                )}
                {anime.dub_episodes > 0 && (
                  <span className="flex items-center gap-1 text-blue-400">
                    <Mic className="w-3.5 h-3.5" /> {anime.dub_episodes}
                  </span>
                )}
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3">
                <Link to={`/AnimeDetail?id=${anime.id}`}>
                  <Button className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-6 py-5 rounded-xl gap-2 shadow-lg shadow-emerald-500/20">
                    <Play className="w-4 h-4 fill-black" /> WATCH NOW
                  </Button>
                </Link>
                <Link to={`/AnimeDetail?id=${anime.id}`}>
                  <Button variant="outline" className="border-zinc-700 bg-white/5 hover:bg-white/10 text-zinc-300 px-6 py-5 rounded-xl gap-2 backdrop-blur-sm">
                    <Info className="w-4 h-4" /> Details
                  </Button>
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Slide indicators */}
      {featured.length > 1 && (
        <div className="absolute bottom-8 right-8 flex items-center gap-3">
          <button onClick={() => setCurrent((prev) => (prev - 1 + featured.length) % featured.length)}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center backdrop-blur-sm transition-colors">
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          <div className="flex gap-1.5">
            {featured.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === current ? 'w-8 bg-emerald-500' : 'w-2 bg-white/30'
                }`}
              />
            ))}
          </div>
          <button onClick={() => setCurrent((prev) => (prev + 1) % featured.length)}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center backdrop-blur-sm transition-colors">
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}