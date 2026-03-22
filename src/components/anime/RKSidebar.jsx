import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Play, Bookmark, List, Users, BarChart2, CalendarDays } from 'lucide-react';

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
      { label: 'Home',      sub: 'Your feed',       icon: Home,         to: '/Home' },
      { label: 'Search',    sub: 'Find anime',       icon: Search,       to: '/Search' },
      { label: 'Watch',     sub: 'Resume watching',  icon: Play,         to: '/Watch',                 badge: 'HOT', badgeType: 'hot' },
      { label: 'My List',   sub: 'Saved anime',      icon: Bookmark,     to: '/Search?filter=mylist' },
    ],
  },
  {
    section: 'Discover',
    items: [
      { label: 'Browse',    sub: 'All genres',       icon: List,         to: '/Search' },
      { label: 'Schedule',  sub: 'Airing calendar',  icon: CalendarDays, to: '/SeasonalCalendar' },
      { label: 'Community', sub: 'Forums & lists',   icon: Users,        to: '/Search?filter=trending' },
      { label: 'My Stats',  sub: 'Watch history',    icon: BarChart2,    to: '/Profile', badge: 'NEW', badgeType: 'new' },
    ],
  },
];

const PARTICLES = [
  { left: '18%', dur: 4.2, delay: 0,   size: 2 },
  { left: '55%', dur: 5.8, delay: 0.8, size: 3 },
  { left: '32%', dur: 3.9, delay: 1.6, size: 2 },
  { left: '72%', dur: 5.2, delay: 2.4, size: 2 },
  { left: '12%', dur: 4.7, delay: 0.4, size: 3 },
  { left: '85%', dur: 6.1, delay: 1.2, size: 2 },
  { left: '44%', dur: 4.4, delay: 3.0, size: 2 },
  { left: '62%', dur: 5.5, delay: 1.8, size: 3 },
  { left: '28%', dur: 3.8, delay: 2.8, size: 2 },
  { left: '78%', dur: 4.9, delay: 0.6, size: 2 },
  { left: '8%',  dur: 5.0, delay: 3.5, size: 2 },
  { left: '50%', dur: 4.3, delay: 2.0, size: 3 },
];

// Alternate particles between accent and accent2 colors using CSS
const PARTICLE_COLORS = ['var(--rk-accent)', '#a855f7', '#ec4899'];

export default function RKSidebar({ user }) {
  const { pathname } = useLocation();

  return (
    <>
      <style>{`
        /* ── All sidebar colours driven by --rk-accent set in Layout.jsx ── */
        :root { --rk-accent: #f472b6; } /* fallback if Layout hasn't set it yet */

        @keyframes rksbFall {
          0%   { opacity: 0; transform: translateY(-8px); }
          10%  { opacity: 0.8; }
          85%  { opacity: 0.4; }
          100% { opacity: 0; transform: translateY(620px); }
        }
        @keyframes rksbGlow {
          0%,100% { box-shadow: 0 0 8px color-mix(in srgb, var(--rk-accent) 50%, transparent); }
          50%     { box-shadow: 0 0 20px color-mix(in srgb, var(--rk-accent) 80%, transparent); }
        }
        @keyframes rksbShimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }

        .rksb {
          position: fixed; left: 0; top: 0; bottom: 0; z-index: 40;
          width: 68px;
          background: #08080f;
          border-right: 1px solid rgba(255,255,255,0.05);
          display: flex; flex-direction: column;
          transition: width 0.35s cubic-bezier(0.4,0,0.2,1);
          overflow: hidden;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .rksb:hover { width: 230px; }
        @media (max-width: 768px) { .rksb { display: none !important; } }

        /* Glows — use accent variable */
        .rksb-glow-t {
          position: absolute; top: 0; left: 0; right: 0; height: 160px;
          background: radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--rk-accent) 12%, transparent) 0%, transparent 70%);
          pointer-events: none; z-index: 0; transition: background 0.4s;
        }
        .rksb-glow-b {
          position: absolute; bottom: 0; left: 0; right: 0; height: 100px;
          background: radial-gradient(ellipse at 50% 100%, rgba(168,85,247,0.08) 0%, transparent 70%);
          pointer-events: none; z-index: 0;
        }

        .rksb-particle {
          position: absolute; border-radius: 50%;
          pointer-events: none; z-index: 1;
          animation: rksbFall linear infinite;
          /* Color set per element via style prop */
        }

        /* Logo — reactive */
        .rksb-logo {
          display: flex; align-items: center; gap: 14px;
          padding: 20px 20px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          flex-shrink: 0; position: relative; z-index: 2;
          text-decoration: none; cursor: pointer;
          transition: opacity 0.2s;
        }
        .rksb-logo:hover { opacity: 0.85; }
        .rksb-logo-mark {
          width: 28px; height: 28px; border-radius: 10px; flex-shrink: 0;
          background: linear-gradient(135deg, var(--rk-accent), #a855f7);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Bebas Neue', sans-serif; font-size: 14px;
          color: #000; letter-spacing: 1px;
          transition: background 0.4s;
        }
        .rksb-logo-txt {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 22px; letter-spacing: 3px; white-space: nowrap;
          opacity: 0; transition: opacity 0.2s 0.1s;
          background: linear-gradient(90deg, var(--rk-accent), #a855f7, var(--rk-accent));
          background-size: 200% auto;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: rksbShimmer 3s linear infinite;
        }
        .rksb:hover .rksb-logo-txt { opacity: 1; }

        /* Nav */
        .rksb-nav {
          flex: 1; padding: 8px 10px;
          display: flex; flex-direction: column; gap: 2px;
          overflow: hidden; position: relative; z-index: 2;
        }
        .rksb-section {
          font-size: 9px; font-weight: 700;
          color: rgba(255,255,255,0.13);
          letter-spacing: 2px; text-transform: uppercase;
          padding: 8px 10px 3px; white-space: nowrap;
          opacity: 0; transition: opacity 0.15s;
        }
        .rksb:hover .rksb-section { opacity: 1; }

        .rksb-item {
          display: flex; align-items: center; gap: 13px;
          padding: 9px 10px; border-radius: 12px; cursor: pointer;
          transition: background 0.2s; position: relative;
          text-decoration: none;
        }
        .rksb-item:hover { background: rgba(255,255,255,0.05); }
        .rksb-item.active { background: color-mix(in srgb, var(--rk-accent) 12%, transparent); }
        .rksb-item.active::after {
          content: ''; position: absolute; left: 0; top: 20%; bottom: 20%;
          width: 3px; border-radius: 0 3px 3px 0;
          background: linear-gradient(to bottom, var(--rk-accent), #a855f7);
          transition: background 0.4s;
        }

        .rksb-icon {
          width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          transition: all 0.3s;
        }
        .rksb-item.active .rksb-icon {
          background: linear-gradient(135deg, color-mix(in srgb, var(--rk-accent) 25%, transparent), rgba(168,85,247,0.15));
          border-color: color-mix(in srgb, var(--rk-accent) 40%, transparent);
        }
        .rksb-item:hover:not(.active) .rksb-icon { background: rgba(255,255,255,0.08); }

        .rksb-txt { flex: 1; min-width: 0; opacity: 0; transition: opacity 0.18s 0.05s; white-space: nowrap; }
        .rksb:hover .rksb-txt { opacity: 1; }
        .rksb-label { font-size: 13px; font-weight: 700; color: #94a3b8; transition: color 0.3s; }
        .rksb-item.active .rksb-label { color: #f1f5f9; }
        .rksb-sub   { font-size: 10px; color: #334155; margin-top: 1px; }

        /* Active icon color — uses accent variable */
        .rksb-item.active .rksb-icon svg { color: var(--rk-accent) !important; stroke: var(--rk-accent) !important; }

        .rksb-badge {
          flex-shrink: 0; opacity: 0; transition: opacity 0.18s 0.05s;
          padding: 2px 7px; border-radius: 20px; font-size: 10px; font-weight: 800;
        }
        .rksb:hover .rksb-badge { opacity: 1; }
        .rksb-badge-hot {
          background: color-mix(in srgb, var(--rk-accent) 20%, transparent);
          color: var(--rk-accent);
          border: 1px solid color-mix(in srgb, var(--rk-accent) 40%, transparent);
          transition: all 0.4s;
        }
        .rksb-badge-new {
          background: rgba(52,211,153,0.2); color: #34d399;
          border: 1px solid rgba(52,211,153,0.3);
        }

        .rksb-divider { height: 1px; background: rgba(255,255,255,0.04); margin: 5px 10px; position: relative; z-index: 2; }

        /* User footer — accent reactive */
        .rksb-user {
          padding: 12px 10px;
          border-top: 1px solid rgba(255,255,255,0.04);
          display: flex; align-items: center; gap: 12px;
          cursor: pointer; transition: background 0.2s;
          position: relative; z-index: 2; text-decoration: none;
        }
        .rksb-user:hover { background: rgba(255,255,255,0.03); }

        /* Avatar ring — accent reactive */
        .rksb-avatar-ring {
          width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
          padding: 2px;
          background: linear-gradient(135deg, var(--rk-accent), #a855f7);
          animation: rksbGlow 3s ease-in-out infinite;
          transition: background 0.4s;
        }
        .rksb-avatar-inner {
          width: 100%; height: 100%; border-radius: 50%;
          background: #1a1a2e; overflow: hidden;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 800;
          color: var(--rk-accent);
          border: 1.5px solid #08080f;
          transition: color 0.4s;
        }

        .rksb-uinfo { opacity: 0; transition: opacity 0.18s 0.05s; min-width: 0; }
        .rksb:hover .rksb-uinfo { opacity: 1; }
        .rksb-uname { font-size: 12px; font-weight: 800; color: #f1f5f9; white-space: nowrap; }
        .rksb-utag  { font-size: 10px; color: #334155; white-space: nowrap; margin-top: 1px; }
        .rksb-admin {
          font-size: 9px; font-weight: 800;
          color: var(--rk-accent);
          background: color-mix(in srgb, var(--rk-accent) 15%, transparent);
          border: 1px solid color-mix(in srgb, var(--rk-accent) 30%, transparent);
          padding: 1px 6px; border-radius: 20px;
          display: inline-block; margin-top: 3px;
          transition: all 0.4s;
        }
      `}</style>

      <div className="rksb">
        <div className="rksb-glow-t" />
        <div className="rksb-glow-b" />

        {/* Falling particles — alternate accent colors */}
        {PARTICLES.map((p, i) => (
          <div key={i} className="rksb-particle" style={{
            width: p.size, height: p.size,
            left: p.left, top: '-4px',
            background: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
          }} />
        ))}

        {/* Logo — links to homepage */}
        <Link to="/Home" className="rksb-logo">
          <div className="rksb-logo-mark">RK</div>
          <span className="rksb-logo-txt">RK</span>
        </Link>

        {/* Nav groups */}
        <div className="rksb-nav">
          {NAV.map((group, gi) => (
            <React.Fragment key={gi}>
              {gi > 0 && <div className="rksb-divider" />}
              <div className="rksb-section">{group.section}</div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.to
                  || (item.to === '/Home' && pathname === '/')
                  || (item.to !== '/Search' && pathname.startsWith(item.to));
                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    className={`rksb-item${isActive ? ' active' : ''}`}
                  >
                    <div className="rksb-icon">
                      <Icon
                        size={15}
                        style={{
                          color: isActive ? 'var(--rk-accent)' : '#64748b',
                          strokeWidth: isActive ? 2.5 : 2,
                          transition: 'color 0.3s',
                        }}
                      />
                    </div>
                    <div className="rksb-txt">
                      <div className="rksb-label">{item.label}</div>
                      <div className="rksb-sub">{item.sub}</div>
                    </div>
                    {item.badge && (
                      <span className={`rksb-badge rksb-badge-${item.badgeType}`}>
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
        <Link to="/Profile" className="rksb-user">
          <div className="rksb-avatar-ring">
            <div className="rksb-avatar-inner">
              {user?.avatar_url
                ? <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (user?.full_name?.[0]?.toUpperCase() || 'RK')
              }
            </div>
          </div>
          <div className="rksb-uinfo">
            <div className="rksb-uname">{user?.full_name || 'Anime Fan'}</div>
            <div className="rksb-utag">{user?.email ? `@${user.email.split('@')[0]}` : '@user'}</div>
            {user?.role === 'admin' && <div className="rksb-admin">👑 Admin</div>}
          </div>
        </Link>
      </div>
    </>
  );
}
