import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { JikanAPI } from '../lib/jikan';
import TrendingSidebar from '../components/anime/TrendingSidebar';
import SignupSection from '../components/anime/SignupSection.jsx';
import { Loader2, Play, Plus, Star, ChevronRight, Search, Flame, Clock, TrendingUp, Calendar } from 'lucide-react';

// ─── Fonts ────────────────────────────────────────────────────────────────────
if (!document.head.querySelector('link[href*="Plus+Jakarta"]')) {
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Bebas+Neue&display=swap';
  document.head.appendChild(l);
}

const GENRES = ['All', 'Action', 'Romance', 'Fantasy', 'Thriller', 'Sci-Fi', 'Slice of Life', 'Horror', 'Sports', 'Mecha', 'Mystery', 'Comedy'];

// ─── Hero Banner ──────────────────────────────────────────────────────────────
function HeroBanner({ featured }) {
  const [active, setActive] = useState(0);
  const [fading, setFading] = useState(false);
  const timerRef = useRef();

  const goTo = (i) => {
    setFading(true);
    setTimeout(() => { setActive(i); setFading(false); }, 300);
  };

  useEffect(() => {
    if (!featured.length) return;
    timerRef.current = setInterval(() => {
      setFading(true);
      setTimeout(() => { setActive(p => (p + 1) % Math.min(featured.length, 6)); setFading(false); }, 300);
    }, 6000);
    return () => clearInterval(timerRef.current);
  }, [featured.length]);

  if (!featured.length) return null;
  const anime = featured[active];

  return (
    <div style={{ position: 'relative', height: 'clamp(420px, 56vh, 580px)', overflow: 'hidden', background: '#06060d' }}>
      {/* Background image */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${anime.images?.jpg?.large_image_url || anime.cover_image})`,
        backgroundSize: 'cover', backgroundPosition: 'center top',
        opacity: fading ? 0 : 0.35,
        transition: 'opacity 0.4s ease',
        filter: 'blur(2px) saturate(1.4)',
        transform: 'scale(1.05)',
      }} />
      {/* Gradient overlays */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, #06060d 35%, rgba(6,6,13,0.5) 65%, rgba(6,6,13,0.1) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(6,6,13,0.8) 75%, #06060d 100%)' }} />
      {/* Floating particles */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {[...Array(8)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: i % 3 === 0 ? 3 : 2, height: i % 3 === 0 ? 3 : 2,
            borderRadius: '50%',
            background: i % 2 === 0 ? '#f472b6' : '#a855f7',
            left: `${6 + i * 11}%`, top: `${15 + (i % 4) * 18}%`,
            animation: `hkFloat ${2.5 + i * 0.35}s ease-in-out infinite`,
            animationDelay: `${i * 0.3}s`,
            boxShadow: `0 0 8px ${i % 2 === 0 ? '#f472b6' : '#a855f7'}`,
          }} />
        ))}
      </div>

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 2,
        height: '100%', display: 'flex', alignItems: 'flex-end',
        padding: '0 clamp(20px, 5vw, 56px) clamp(40px, 6vh, 64px)',
        opacity: fading ? 0 : 1, transition: 'opacity 0.3s ease',
      }}>
        <div style={{ maxWidth: 560 }}>
          {/* Featured badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: 'rgba(244,114,182,0.15)', border: '1px solid rgba(244,114,182,0.35)', color: '#f472b6', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>
            ✦ Featured
          </div>
          {/* Title */}
          <h1 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'clamp(28px,4vw,46px)', fontWeight: 800, color: '#fff', lineHeight: 1.1, marginBottom: 12 }}>
            {anime.title}
          </h1>
          {/* Meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#fbbf24', fontSize: 13, fontWeight: 700 }}>
              <Star size={13} fill="#fbbf24" /> {anime.score || '?'}
            </div>
            {anime.episodes && <span style={{ fontSize: 12, color: '#475569' }}>{anime.episodes} eps</span>}
            {(anime.genres || []).slice(0, 3).map(g => (
              <span key={g.name || g} style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
                {g.name || g}
              </span>
            ))}
          </div>
          {/* Synopsis */}
          <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.65, marginBottom: 22, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {anime.synopsis || anime.description || 'No synopsis available.'}
          </p>
          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link
              to={`/Watch?id=${anime.mal_id}&ep=1&title=${encodeURIComponent(anime.title)}`}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 24px', borderRadius: 12, background: 'linear-gradient(135deg,#f472b6,#a855f7)', color: '#000', fontSize: 13, fontWeight: 800, textDecoration: 'none', boxShadow: '0 4px 24px rgba(244,114,182,0.4)', transition: 'transform 0.2s', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <Play size={14} fill="black" /> Watch Now
            </Link>
            <Link
              to={`/Anime/${anime.mal_id}`}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              <Plus size={14} /> More Info
            </Link>
          </div>
        </div>
      </div>

      {/* Dot indicators */}
      <div style={{ position: 'absolute', bottom: 20, right: 28, display: 'flex', gap: 6, zIndex: 3 }}>
        {featured.slice(0, 6).map((_, i) => (
          <button key={i} onClick={() => goTo(i)} style={{ width: i === active ? 20 : 6, height: 6, borderRadius: 3, border: 'none', cursor: 'pointer', background: i === active ? '#f472b6' : 'rgba(255,255,255,0.2)', transition: 'all 0.3s', padding: 0 }} />
        ))}
      </div>
    </div>
  );
}

// ─── Search Bar ───────────────────────────────────────────────────────────────
function SearchBar() {
  const [val, setVal] = useState('');
  const [focused, setFocused] = useState(false);

  const handleSearch = () => {
    const trimmed = val.trim();
    if (trimmed) {
      window.location.href = `/Search?q=${encodeURIComponent(trimmed)}`;
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="hk-search" style={{ padding: '24px 28px 0' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${focused ? 'rgba(244,114,182,0.5)' : 'rgba(255,255,255,0.09)'}`,
        borderRadius: 14, padding: '12px 18px',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxShadow: focused ? '0 0 0 3px rgba(244,114,182,0.1)' : 'none',
      }}>
        <Search size={16} style={{ color: focused ? '#f472b6' : '#334155', flexShrink: 0, transition: 'color 0.2s', cursor: 'pointer' }} onClick={handleSearch} />
        <input
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search anime, genres, studios..."
          style={{
            flex: 1, background: 'none', border: 'none', outline: 'none',
            color: '#e2e8f0', fontSize: 14,
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            caretColor: '#f472b6',
          }}
        />
        {val.trim() && (
          <button
            onClick={handleSearch}
            style={{
              flexShrink: 0, padding: '5px 14px', borderRadius: 9,
              background: 'linear-gradient(135deg,#f472b6,#a855f7)',
              border: 'none', color: '#000', fontSize: 12, fontWeight: 800,
              cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = 0.85}
            onMouseLeave={e => e.currentTarget.style.opacity = 1}
          >
            Search
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Genre Filter Chips ───────────────────────────────────────────────────────
function GenreChips({ active, onChange }) {
  return (
    <div className="hk-genres" style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '18px 28px 0', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
      {GENRES.map(g => (
        <button key={g} onClick={() => onChange(g)}
          style={{
            flexShrink: 0, padding: '6px 16px', borderRadius: 20,
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            border: active === g ? 'none' : '1px solid rgba(255,255,255,0.08)',
            background: active === g ? 'linear-gradient(135deg,#f472b6,#a855f7)' : 'rgba(255,255,255,0.03)',
            color: active === g ? '#000' : '#475569',
            boxShadow: active === g ? '0 2px 14px rgba(244,114,182,0.35)' : 'none',
            transition: 'all 0.2s',
          }}>
          {g}
        </button>
      ))}
    </div>
  );
}

// ─── Anime Card ───────────────────────────────────────────────────────────────
function AnimeCard({ anime, showProgress, lastEpisode }) {
  const img = anime.images?.jpg?.large_image_url || anime.cover_image;
  return (
    <Link
      to={`/Watch?id=${anime.mal_id}&ep=${lastEpisode || 1}&title=${encodeURIComponent(anime.title)}`}
      style={{ textDecoration: 'none', flexShrink: 0, width: 130, display: 'block' }}
    >
      <div style={{
        borderRadius: 14, overflow: 'hidden',
        background: '#111120', border: '1px solid rgba(255,255,255,0.06)',
        transition: 'all 0.25s', cursor: 'pointer',
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'; e.currentTarget.style.borderColor = 'rgba(244,114,182,0.45)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(244,114,182,0.18)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.boxShadow = 'none'; }}>
        {/* Thumb */}
        <div style={{ height: 170, position: 'relative', overflow: 'hidden', background: '#1a1a2e' }}>
          {img && <img src={img} alt={anime.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }} />}
          {/* Score badge */}
          {anime.score && (
            <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.75)', borderRadius: 8, padding: '2px 7px', fontSize: 11, fontWeight: 700, color: '#fbbf24', backdropFilter: 'blur(4px)' }}>
              ★ {anime.score}
            </div>
          )}
          {/* New/Hot badge */}
          {anime.airing && (
            <div style={{ position: 'absolute', top: 8, left: 8, background: 'linear-gradient(135deg,#f472b6,#a855f7)', borderRadius: 6, padding: '2px 7px', fontSize: 10, fontWeight: 800, color: '#000' }}>
              LIVE
            </div>
          )}
          {/* Play overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.4)'; e.currentTarget.querySelector('.play-btn').style.opacity = 1; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0)'; e.currentTarget.querySelector('.play-btn').style.opacity = 0; }}>
            <div className="play-btn" style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(244,114,182,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}>
              <Play size={14} fill="black" style={{ color: 'black', marginLeft: 2 }} />
            </div>
          </div>
        </div>
        {/* Info */}
        <div style={{ padding: '10px 10px 12px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            {anime.title}
          </div>
          <div style={{ fontSize: 10, color: '#334155', marginTop: 3, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            {anime.type || 'TV'} {anime.episodes ? `· ${anime.episodes} eps` : ''}
          </div>
          {/* Progress bar for continue watching */}
          {showProgress && lastEpisode && anime.episodes && (
            <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg,#f472b6,#a855f7)', width: `${Math.min((lastEpisode / anime.episodes) * 100, 100)}%` }} />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Wide Card (for Continue Watching) ───────────────────────────────────────
function WideCard({ anime, lastEpisode }) {
  const img = anime.images?.jpg?.large_image_url || anime.cover_image;
  return (
    <Link
      to={`/Watch?id=${anime.mal_id}&ep=${lastEpisode || 1}&title=${encodeURIComponent(anime.title)}`}
      style={{ textDecoration: 'none', flexShrink: 0, width: 200, display: 'block' }}
    >
      <div style={{
        borderRadius: 16, overflow: 'hidden',
        background: '#111120', border: '1px solid rgba(255,255,255,0.06)',
        transition: 'all 0.25s',
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'rgba(244,114,182,0.4)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(244,114,182,0.15)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.boxShadow = 'none'; }}>
        <div style={{ height: 110, position: 'relative', overflow: 'hidden', background: '#1a1a2e' }}>
          {img && <img src={img} alt={anime.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,transparent 40%,rgba(0,0,0,0.65))' }} />
          <div style={{ position: 'absolute', bottom: 8, right: 8, width: 30, height: 30, borderRadius: '50%', background: 'rgba(244,114,182,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Play size={12} fill="black" style={{ color: 'black', marginLeft: 1 }} />
          </div>
        </div>
        <div style={{ padding: '10px 12px 14px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {anime.title}
          </div>
          <div style={{ fontSize: 11, color: '#475569', marginTop: 3 }}>Ep {lastEpisode}</div>
          <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg,#f472b6,#a855f7)', width: `${Math.min(((lastEpisode || 1) / (anime.episodes || 12)) * 100, 95)}%` }} />
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Section Row ──────────────────────────────────────────────────────────────
function SectionRow({ title, icon: Icon, anime = [], viewAllLink, accent = '#f472b6' }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="hk-section" style={{ padding: '0 28px', marginBottom: 32, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)', transition: 'opacity 0.5s ease, transform 0.5s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: `linear-gradient(135deg,${accent},#a855f7)` }} />
          {Icon && <Icon size={15} style={{ color: accent }} />}
          <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{title}</span>
        </div>
        {viewAllLink && (
          <Link to={viewAllLink} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: accent, fontWeight: 700, textDecoration: 'none', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            onMouseEnter={e => e.currentTarget.style.opacity = 0.7}
            onMouseLeave={e => e.currentTarget.style.opacity = 1}>
            See all <ChevronRight size={13} />
          </Link>
        )}
      </div>
      <div style={{ overflowX: 'auto', overflowY: 'visible', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ display: 'flex', gap: 12, paddingBottom: 6 }}>
          {anime.slice(0, 12).map(a => (
            <AnimeCard key={a.mal_id} anime={a} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Home ────────────────────────────────────────────────────────────────
export default function Home() {
  const [continueWatching, setContinueWatching] = useState([]);
  const [activeGenre, setActiveGenre] = useState('All');

  // Restore continue watching from localStorage (unchanged logic)
  useEffect(() => {
    const allKeys = Object.keys(localStorage).filter(k => k.startsWith('rk_progress_'));
    const watching = allKeys.map(k => {
      const match = k.match(/rk_progress_(\d+)_ep(\d+)/);
      if (!match) return null;
      return { mal_id: parseInt(match[1]), episode: parseInt(match[2]) };
    }).filter(Boolean);
    const byAnime = {};
    watching.forEach(({ mal_id, episode }) => { if (!byAnime[mal_id] || episode > byAnime[mal_id]) byAnime[mal_id] = episode; });
    const uniqueIds = Object.keys(byAnime).slice(0, 6);
    if (uniqueIds.length > 0) {
      Promise.all(uniqueIds.map(id => JikanAPI.getById(id).catch(() => null)))
        .then(results => {
          const enriched = results.filter(Boolean).map(a => ({ ...a, lastEpisode: byAnime[a.mal_id] }));
          setContinueWatching(enriched);
        }).catch(() => {});
    }
  }, []);

  const { data: currentSeason, isLoading: loadingSeason } = useQuery({
    queryKey: ['current-season'],
    queryFn: () => JikanAPI.getCurrentSeason(),
    staleTime: 1000 * 60 * 60,
  });
  const { data: topAiring, isLoading: loadingTop } = useQuery({
    queryKey: ['top-airing'],
    queryFn: () => JikanAPI.getTopAiring(),
    staleTime: 1000 * 60 * 60,
  });
  const { data: mostPopular } = useQuery({
    queryKey: ['most-popular'],
    queryFn: () => JikanAPI.getMostPopular(),
    staleTime: 1000 * 60 * 60,
  });
  const { data: upcoming } = useQuery({
    queryKey: ['upcoming'],
    queryFn: () => JikanAPI.getTopUpcoming(),
    staleTime: 1000 * 60 * 60,
  });

  if (loadingSeason && loadingTop) return (
    <div style={{ minHeight: '100vh', background: '#06060d', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
      <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.07)', borderTopColor: '#f472b6', borderRadius: '50%', animation: 'hkSpin 0.8s linear infinite' }} />
      <p style={{ color: '#334155', fontSize: 13, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Loading live anime data...</p>
      <style>{`@keyframes hkSpin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const featured      = topAiring?.data?.slice(0, 8) || [];
  const trending      = topAiring?.data?.slice(0, 12) || [];
  const latestUpdates = currentSeason?.data || [];
  const popular       = mostPopular?.data || [];
  const upcomingList  = upcoming || [];

  // Genre filter helper
  const filterByGenre = (list) => {
    if (activeGenre === 'All') return list;
    return list.filter(a => (a.genres || []).some(g => (g.name || g) === activeGenre));
  };

  return (
    <>
      <style>{`
        @keyframes hkSpin  { to{transform:rotate(360deg)} }
        @keyframes hkFloat { 0%,100%{opacity:.3;transform:translateY(0) scale(1)}50%{opacity:.75;transform:translateY(-8px) scale(1.15)} }

        /* Desktop: sidebar beside content */
        .hk-layout { flex-direction: row; }
        .hk-sidebar { width: 272px; flex-shrink: 0; position: sticky; top: 80px; }
        .hk-sidebar-mobile { display: none; }

        /* Mobile: stack sidebar below content */
        @media (max-width: 768px) {
          .hk-layout { flex-direction: column; padding: 16px 16px 0 !important; gap: 0 !important; }
          .hk-sidebar { display: none; }
          .hk-sidebar-mobile { display: block; padding: 24px 16px 0 !important; }
          .hk-search  { padding: 16px 16px 0 !important; }
          .hk-genres  { padding: 14px 16px 0 !important; }
          .hk-signup  { padding: 16px 16px 0 !important; }
          .hk-live    { padding: 10px 16px 0 !important; }
          .hk-section { padding: 0 !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#06060d', color: '#e2e8f0', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>

        {/* ── Hero ── */}
        <HeroBanner featured={featured} />

        {/* ── Live indicator ── */}
        <div className="hk-live" style={{ display: 'flex', justifyContent: 'flex-end', padding: '14px 28px 0' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#4ade80', fontWeight: 700, letterSpacing: 0.5 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', animation: 'hkFloat 2s ease-in-out infinite', boxShadow: '0 0 6px #4ade80' }} />
            Live from MyAnimeList
          </span>
        </div>

        {/* ── Search ── */}
        <SearchBar />

        {/* ── Genre chips ── */}
        <GenreChips active={activeGenre} onChange={setActiveGenre} />

        {/* ── Signup nudge ── */}
        <div className="hk-signup" style={{ padding: '24px 28px 0' }}>
          <SignupSection />
        </div>

        {/* ── Main layout ── */}
        <div className="hk-layout" style={{ display: 'flex', gap: 28, padding: '28px 28px 0', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Continue Watching */}
            {continueWatching.length > 0 && (
              <div style={{ marginBottom: 32, padding: '0 0 0 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '0 0' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'linear-gradient(135deg,#f472b6,#a855f7)' }} />
                  <Clock size={15} style={{ color: '#f472b6' }} />
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Continue Watching</span>
                </div>
                <div style={{ overflowX: 'auto', overflowY: 'visible', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                  <div style={{ display: 'flex', gap: 12, paddingBottom: 6 }}>
                    {continueWatching.map(a => <WideCard key={a.mal_id} anime={a} lastEpisode={a.lastEpisode} />)}
                  </div>
                </div>
              </div>
            )}

            {/* Dynamic sections — filtered by genre */}
            <SectionRow
              title="Currently Airing This Season"
              icon={Flame}
              anime={filterByGenre(latestUpdates.slice(0, 12))}
              viewAllLink="/Search?filter=season"
              accent="#f472b6"
            />
            <SectionRow
              title="Top Rated Right Now"
              icon={Star}
              anime={filterByGenre(trending.slice(0, 12))}
              viewAllLink="/Search?filter=top"
              accent="#fbbf24"
            />
            <SectionRow
              title="Most Popular"
              icon={TrendingUp}
              anime={filterByGenre(popular.slice(0, 12))}
              viewAllLink="/Search?filter=popular"
              accent="#a855f7"
            />
            {upcomingList.length > 0 && (
              <SectionRow
                title="Coming Soon"
                icon={Calendar}
                anime={filterByGenre(upcomingList.slice(0, 12))}
                accent="#34d399"
              />
            )}
          </div>

          {/* Sidebar — hidden on mobile, shown on desktop */}
          <div className="hk-sidebar">
            <TrendingSidebar trending={trending} />
          </div>
        </div>

        {/* Trending on mobile — shown below main content */}
        <div className="hk-sidebar-mobile" style={{ padding: '0 28px' }}>
          <TrendingSidebar trending={trending} />
        </div>

        <div style={{ height: 60 }} />
      </div>
    </>
  );
}
