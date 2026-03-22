import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, CalendarDays, User, Flame } from 'lucide-react';

const NAV_ITEMS = [
  { icon: Home, label: 'Home', to: '/Home' },
  { icon: Search, label: 'Browse', to: '/Search' },
  { icon: Flame, label: 'Trending', to: '/Search?filter=trending' },
  { icon: CalendarDays, label: 'Schedule', to: '/SeasonalCalendar' },
  { icon: User, label: 'Profile', to: '/Profile' },
];

export default function Sidebar({ user }) {
  const { pathname } = useLocation();
  const [hovered, setHovered] = useState(null);

  return (
    <aside
      className="hidden md:flex flex-col fixed left-0 top-0 h-full z-40 bg-[#0a0a0a] border-r border-zinc-800/50"
      style={{ width: 68 }}
    >
      {/* Logo */}
      <div className="flex items-center justify-center h-16 border-b border-zinc-800/50 flex-shrink-0">
        <Link to="/Home">
          <span className="text-xl font-black text-white tracking-tighter select-none">
            R<span className="text-emerald-500">K</span>
          </span>
        </Link>
      </div>

      {/* Nav Items */}
      <nav className="flex flex-col items-center gap-1 pt-4 flex-1">
        {NAV_ITEMS.map(({ icon: Icon, label, to }) => {
          const active = pathname === to || pathname.startsWith(to.split('?')[0]);
          return (
            <div key={to} className="relative group">
              <Link
                to={to}
                onMouseEnter={() => setHovered(label)}
                onMouseLeave={() => setHovered(null)}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                  active
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                <Icon className="w-5 h-5" />
              </Link>
              {/* Tooltip */}
              {hovered === label && (
                <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-zinc-800 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg whitespace-nowrap pointer-events-none z-50 border border-zinc-700">
                  {label}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}