import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, User, Settings, ChevronLeft, ChevronRight } from 'lucide-react';

const MENU_ITEMS = [
  { icon: Search, label: 'Search', path: '/Search' },
  { icon: User, label: 'Profile', path: '/Profile' },
  { icon: Settings, label: 'Settings', path: '/Settings' }
];

export default function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const { pathname } = useLocation();

  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-screen bg-zinc-900 border-r border-zinc-800 z-40 transition-all duration-300 flex flex-col pt-20 ${
          expanded ? 'w-48' : 'w-20'
        }`}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <nav className="flex-1 px-3 py-4 space-y-2">
          {MENU_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-emerald-500 text-black'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {expanded && <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Toggle button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mx-3 mb-4 flex items-center justify-center p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors"
        >
          {expanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Main content shift */}
      <div className={`transition-all duration-300 ${expanded ? 'ml-48' : 'ml-20'}`} />
    </>
  );
}