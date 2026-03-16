import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, TrendingUp } from 'lucide-react';

const tabs = [
  { label: 'Home', icon: Home, to: '/Home' },
  { label: 'Browse', icon: Search, to: '/Search' },
  { label: 'Trending', icon: TrendingUp, to: '/Search?filter=trending' },
];

export default function BottomTabBar() {
  const { pathname } = useLocation();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-zinc-800/50 flex"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {tabs.map(({ label, icon: Icon, to }) => {
        const active = pathname === to.split('?')[0];
        return (
          <Link
            key={label}
            to={to}
            className="flex-1 flex flex-col items-center justify-center py-3 gap-1 select-none"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <Icon className={`w-5 h-5 ${active ? 'text-emerald-400' : 'text-zinc-500'}`} />
            <span className={`text-[10px] font-medium ${active ? 'text-emerald-400' : 'text-zinc-500'}`}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}