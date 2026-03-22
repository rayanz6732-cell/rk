import React from 'react';
import { Link } from 'react-router-dom';
import { Flame, Star } from 'lucide-react';

export default function TrendingSidebar({ trending }) {
  if (!trending?.length) return null;

  return (
    <>
      <style>{`
        .ts-item { display: flex; align-items: center; gap: 12px; padding: 10px; border-radius: 12px; text-decoration: none; transition: background 0.2s; }
        .ts-item:hover { background: rgba(255,255,255,0.05); }
        .ts-item:hover .ts-title { color: #f472b6 !important; }

        /* On mobile, show as 2-column grid of compact items */
        @media (max-width: 768px) {
          .ts-list { display: grid !important; grid-template-columns: 1fr 1fr; gap: 8px !important; }
          .ts-item { padding: 8px !important; gap: 8px !important; }
          .ts-thumb { width: 40px !important; height: 54px !important; }
          .ts-rank  { font-size: 18px !important; width: 20px !important; }
        }
      `}</style>

      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 20,
        padding: '18px 16px',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Flame size={17} style={{ color: '#f472b6' }} />
          <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Top Trending</span>
          <div style={{ marginLeft: 'auto', padding: '3px 10px', borderRadius: 6, background: 'rgba(244,114,182,0.15)', border: '1px solid rgba(244,114,182,0.3)', fontSize: 10, fontWeight: 800, color: '#f472b6', letterSpacing: 1 }}>
            NOW
          </div>
        </div>

        {/* List */}
        <div className="ts-list" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {trending.slice(0, 10).map((anime, index) => (
            <Link
              key={anime.mal_id || anime.id}
              to={`/AnimeDetail?id=${anime.mal_id || anime.id}`}
              className="ts-item"
            >
              {/* Rank number */}
              <span className="ts-rank" style={{
                fontFamily: 'Bebas Neue, Plus Jakarta Sans, sans-serif',
                fontSize: 22,
                fontWeight: 900,
                width: 26,
                textAlign: 'center',
                flexShrink: 0,
                color: index === 0 ? '#f472b6'
                  : index === 1 ? '#a855f7'
                  : index === 2 ? '#6366f1'
                  : 'rgba(255,255,255,0.15)',
                lineHeight: 1,
              }}>
                {index + 1}
              </span>

              {/* Thumbnail */}
              <div className="ts-thumb" style={{
                width: 46, height: 62,
                borderRadius: 8, overflow: 'hidden',
                flexShrink: 0, background: '#1a1a2e',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                {(anime.cover_image || anime.images?.jpg?.image_url) && (
                  <img
                    src={anime.cover_image || anime.images?.jpg?.image_url}
                    alt={anime.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="ts-title" style={{
                  fontSize: 12, fontWeight: 700, color: '#e2e8f0',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  transition: 'color 0.2s',
                }}>
                  {anime.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  {anime.score > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, color: '#fbbf24' }}>
                      <Star size={10} fill="#fbbf24" /> {anime.score}
                    </span>
                  )}
                  {anime.type && (
                    <span style={{ fontSize: 10, color: '#334155', fontWeight: 600 }}>{anime.type}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
