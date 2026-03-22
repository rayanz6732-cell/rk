import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Play, Bookmark, List, Users, BarChart2, CalendarDays } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// ─── Fonts ────────────────────────────────────────────────────────────────────
if (!document.head.querySelector('link[href*="Plus+Jakarta"]')) {
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Bebas+Neue&display=swap';
  document.head.appendChild(l);
}

const NAV = [
  {
    section: 'Menu',
    items: [
      { label: 'Home',         sub: 'Your feed',        icon: Home,        to: '/Home' },
      { label: 'Search',       sub: 'Find anime',       icon: Search,      to: '/Search' },
      { label: 'Watch',        sub: 'Resume watching',  icon: Play,        to: '/Watch',                badge: 'HOT',  badgeType: 'hot' },
      { label: 'My List',      sub: 'Saved anime',      icon: Bookmark,    to: '/Search?filter=mylist',  badge: null },
    ],
  },
  {
    section: 'Discover',
    items: [
      { label: 'Browse',       sub: 'All genres',       icon: List,        to: '/Search' },
      { label: 'Schedule',     sub: 'Airing calendar',  icon: CalendarDays,to: '/SeasonalCalendar' },
      { label: 'Community',    sub: 'Forums & lists',   icon: Users,       to: '/Search?filter=trending', badge: null },
      { label: 'My Stats',     sub: 'Watch history',    icon: BarChart2,   to: '/Profile',               badge: 'NEW',  badgeType: 'new' },
    ],
  },
];

const BADGE_STYLES = {
  hot: { background: 'rgba(244,114,182,0.2)', color: '#f472b6', border: '1px solid rgba(244,114,182,0.3)' },
  new: { background: 'rgba(52,211,153,0.2)',  color: '#34d399', border: '1px solid rgba(52,211,153,0.3)'  },
  num: { background: 'rgba(168,85,247,0.2)',  color: '#c084fc', border: '1px solid rgba(168,85,247,0.3)'  },
};

const PARTICLES = [
  { left: '18%', dur: 4.2, delay: 0,   size: 2, color: '#f472b6' },
  { left: '55%', dur: 5.8, delay: 0.8, size: 3, color: '#a855f7' },
  { left: '32%', dur: 3.9, delay: 1.6, size: 2, color: '#ec4899' },
  { left: '72%', dur: 5.2, delay: 2.4, size: 2, color: '#f472b6' },
  { left: '12%', dur: 4.7, delay: 0.4, size: 3, color: '#a855f7' },
  { left: '85%', dur: 6.1, delay: 1.2, size: 2, color: '#f472b6' },
  { left: '44%', dur: 4.4, delay: 3.0, size: 2, color: '#ec4899' },
  { left: '62%', dur: 5.5, delay: 1.8, size: 3, color: '#a855f7' },
  { left: '28%', dur: 3.8, delay: 2.8, size: 2, color: '#f472b6' },
  { left: '78%', dur: 4.9, delay: 0.6, size: 2, color: '#ec4899' },
  { left: '8%',  dur: 5.0, delay: 3.5, size: 2, color: '#a855f7' },
  { left: '50%', dur: 4.3, delay: 2.0, size: 3, color: '#f472b6' },
];

export default function Sidebar({ user }) {
  const { pathname } = useLocation();
  const [hovered, setHovered] = useState(false);
  const [accentColor, setAccentColor] = useState('#f472b6');

  // Pick accent from theme
  useEffect(() => {
    const THEME_ACCENTS = {
      default: '#4ade80', cherry: '#f472b6',
      neon: '#a855f7', aurora: '#34d399',
      ocean: '#38bdf8', sunset: '#fb923c',
    };
    if (user?.theme) setAccentColor(THEME_ACCENTS[user.theme] || '#f472b6');
  }, [user]);

  const accent  = accentColor;
  const accent2 = '#a855f7';

  return (
    <>
      <style>{`
        @keyframes sbFall {
          0%   { opacity: 0; transform: translateY(-8px); }
          10%  { opacity: 0.8; }
          85%  { opacity: 0.4; }
          100% { opacity: 0; transform: translateY(100vh); }
        }
        @keyframes sbGlow {
          0%,100% { box-shadow: 0 0 8px ${accent}55; }
          50%      { box-shadow: 0 0 20px ${accent}99; }
        }
        @keyframes sbShimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        .rk-sb {
          position: fixed; left: 0; top: 0; bottom: 0; z-index: 40;
          width: 68px;
          background: #08080f;
          border-right: 1px solid rgba(255,255,255,0.05);
          display: flex; flex-direction: column;
          transition: width 0.35s cubic-bezier(0.4,0,0.2,1);
          overflow: hidden;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .rk-sb:hover { width: 230px; }

        /* Hide on mobile — BottomTabBar handles nav there */
        @media (max-width: 768px) { .rk-sb { display: none; } }

        .rk-sb-particle {
          position: absolute; border-radius: 50%; pointer-events: none; z-index: 0;
          animation: sbFall linear infinite;
        }
        .rk-sb-glow-top {
          position: absolute; top: 0; left: 0; right: 0; height: 160px;
          background: radial-gradient(ellipse at 50% 0%, ${accent}16 0%, transparent 70%);
          pointer-events: none; z-index: 0;
        }
        .rk-sb-glow-bot {
          position: absolute; bottom: 0; left: 0; right: 0; height: 100px;
          background: radial-gradient(ellipse at 50% 100%, ${accent2}11 0%, transparent 70%);
          pointer-events: none; z-index: 0;
        }
        .rk-sb-logo {
          display: flex; align-items: center; gap: 14px;
          padding: 20px 20px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          flex-shrink: 0; position: relative; z-index: 2;
        }
        .rk-sb-logo-mark {
          width: 28px; height: 28px; border-radius: 10px; flex-shrink: 0;
          background: linear-gradient(135deg, ${accent}, ${accent2});
          display: flex; align-items: center; justify-content: center;
          font-family: 'Bebas Neue', sans-serif; font-size: 14px;
          color: #000; letter-spacing: 1px; font-weight: 900;
        }
        .rk-sb-logo-txt {
          font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: 3px;
          white-space: nowrap; opacity: 0; transition: opacity 0.2s 0.1s;
          background: linear-gradient(90deg, ${accent}, ${accent2}, ${accent});
          background-size: 200% auto;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: sbShimmer 3s linear infinite;
        }
        .rk-sb:hover .rk-sb-logo-txt { opacity: 1; }

        .rk-sb-nav {
          flex: 1; padding: 8px 10px;
          display: flex; flex-direction: column; gap: 2px;
          overflow: hidden; position: relative; z-index: 2;
        }
        .rk-sb-section-label {
          font-size: 9px; font-weight: 700;
          color: rgba(255,255,255,0.13);
          letter-spacing: 2px; text-transform: uppercase;
          padding: 8px 10px 3px; white-space: nowrap;
          opacity: 0; transition: opacity 0.15s;
        }
        .rk-sb:hover .rk-sb-section-label { opacity: 1; }

        .rk-sb-item {
          display: flex; align-items: center; gap: 13px;
          padding: 9px 10px; border-radius: 12px; cursor: pointer;
          transition: background 0.2s; position: relative;
          text-decoration: none;
        }
        .rk-sb-item:hover { background: rgba(255,255,255,0.05); }
        .rk-sb-item.active { background: ${accent}18; }
        .rk-sb-item.active::after {
          content: ''; position: absolute; left: 0; top: 20%; bottom: 20%;
          width: 3px; border-radius: 0 3px 3px 0;
          background: linear-gradient(to bottom, ${accent}, ${accent2});
        }

        .rk-sb-icon {
          width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          transition: all 0.2s;
        }
        .rk-sb-item.active .rk-sb-icon {
          background: linear-gradient(135deg, ${accent}30, ${accent2}20);
          border-color: ${accent}44;
        }
        .rk-sb-item:hover:not(.active) .rk-sb-icon { background: rgba(255,255,255,0.08); }

        .rk-sb-txt { flex: 1; min-width: 0; opacity: 0; transition: opacity 0.18s 0.05s; white-space: nowrap; }
        .rk-sb:hover .rk-sb-txt { opacity: 1; }
        .rk-sb-label { font-size: 13px; font-weight: 700; color: #94a3b8; }
        .rk-sb-item.active .rk-sb-label { color: #f1f5f9; }
        .rk-sb-sublabel { font-size: 10px; color: #334155; margin-top: 1px; }

        .rk-sb-badge {
          flex-shrink: 0; opacity: 0; transition: opacity 0.18s 0.05s;
          padding: 2px 7px; border-radius: 20px; font-size: 10px; font-weight: 800;
        }
        .rk-sb:hover .rk-sb-badge { opacity: 1; }

        .rk-sb-divider { height: 1px; background: rgba(255,255,255,0.04); margin: 5px 10px; position: relative; z-index: 2; }

        .rk-sb-user {
          padding: 12px 10px;
          border-top: 1px solid rgba(255,255,255,0.04);
          display: flex; align-items: center; gap: 12px; cursor: pointer;
          transition: background 0.2s; position: relative; z-index: 2;
          text-decoration: none;
        }
        .rk-sb-user:hover { background: rgba(255,255,255,0.03); }
        .rk-sb-avatar-ring {
          width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
          padding: 2px;
          background: linear-gradient(135deg, ${accent}, ${accent2});
          animation: sbGlow 3s ease-in-out infinite;
        }
        .rk-sb-avatar-inner {
          width: 100%; height: 100%; border-radius: 50%;
          background: #1a1a2e; overflow: hidden;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 800; color: ${accent};
          border: 1.5px solid #06060d;
        }
        .rk-sb-user-info { opacity: 0; transition: opacity 0.18s 0.05s; min-width: 0; }
        .rk-sb:hover .rk-sb-user-info { opacity: 1; }
        .rk-sb-user-name { font-size: 12px; font-weight: 800; color: #f1f5f9; white-space: nowrap; }
        .rk-sb-user-tag  { font-size: 10px; color: #334155; white-space: nowrap; margin-top: 1px; }
        .rk-sb-admin {
          font-size: 9px; font-weight: 800; color: ${accent};
          background: ${accent}18; border: 1px solid ${accent}33;
          padding: 1px 6px; border-radius: 20px;
          display: inline-block; margin-top: 3px;
        }
      `}</style>

      <div className="rk-sb" id="rk-sidebar">
        {/* Glows */}
        <div className="rk-sb-glow-top" />
        <div className="rk-sb-glow-bot" />

        {/* Falling particles */}
        {PARTICLES.map((p, i) => (
          <div key={i} className="rk-sb-particle" style={{
            width: p.size, height: p.size,
            left: p.left, top: '-4px',
            background: p.color,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
            boxShadow: `0 0 5px ${p.color}, 0 0 10px ${p.color}66`,
          }} />
        ))}

        {/* Logo */}
        <div className="rk-sb-logo">
          <div className="rk-sb-logo-mark">RK</div>
          <span className="rk-sb-logo-txt">RK</span>
        </div>

        {/* Nav */}
        <div className="rk-sb-nav">
          {NAV.map((group, gi) => (
            <React.Fragment key={gi}>
              {gi > 0 && <div className="rk-sb-divider" />}
              <div className="rk-sb-section-label">{group.section}</div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.to || pathname.startsWith(item.to + '?') || (item.to === '/Home' && pathname === '/');
                return (
                  <Link key={item.to + item.label} to={item.to} className={`rk-sb-item${isActive ? ' active' : ''}`}>
                    <div className="rk-sb-icon">
                      <Icon size={15} style={{ color: isActive ? accent : '#64748b', strokeWidth: isActive ? 2.5 : 2 }} />
                    </div>
                    <div className="rk-sb-txt">
                      <div className="rk-sb-label">{item.label}</div>
                      <div className="rk-sb-sublabel">{item.sub}</div>
                    </div>
                    {item.badge && (
                      <span className="rk-sb-badge" style={BADGE_STYLES[item.badgeType] || BADGE_STYLES.num}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        {/* User */}
        <Link to="/Profile" className="rk-sb-user">
          <div className="rk-sb-avatar-ring">
            <div className="rk-sb-avatar-inner">
              {user?.avatar_url
                ? <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (user?.full_name?.[0] || 'RK')
              }
            </div>
          </div>
          <div className="rk-sb-user-info">
            <div className="rk-sb-user-name">{user?.full_name || 'Anime Fan'}</div>
            <div className="rk-sb-user-tag">{user?.email ? `@${user.email.split('@')[0]}` : '@user'}</div>
            {user?.role === 'admin' && <div className="rk-sb-admin">👑 Admin</div>}
          </div>
        </Link>
      </div>
    </>
  );
}
