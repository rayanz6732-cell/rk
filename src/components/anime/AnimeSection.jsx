import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import AnimeCard from './AnimeCard';

export default function AnimeSection({ title, anime, icon, viewAllLink }) {
  if (!anime?.length) return null;

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {icon && <span className="text-2xl">{icon}</span>}
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">{title}</h2>
        </div>
        {viewAllLink && (
          <Link
            to={viewAllLink}
            className="flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
          >
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
        {anime.map((item) => (
          <AnimeCard key={item.mal_id || item.id} anime={item} />
        ))}
      </div>
    </section>
  );
}