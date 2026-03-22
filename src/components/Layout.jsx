import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import Navbar from './anime/Navbar';
import BottomTabBar from './anime/BottomTabBar';
import RKSidebar from './anime/RKSidebar';
import { Search, User, CalendarDays } from 'lucide-react';

const THEMES = [
  { id: 'default', colors: { primary: '142 71% 45%' } },
  { id: 'cherry',  colors: { primary: '340 82% 52%' } },
  { id: 'neon',    colors: { primary: '280 90% 50%' } },
  { id: 'aurora',  colors: { primary: '162 73% 46%' } },
  { id: 'ocean',   colors: { primary: '217 91% 60%' } },
  { id: 'sunset',  colors: { primary: '39 89% 49%'  } },
];

const HIDE_FOOTER_PAGES = ['/Watch'];

export default function Layout() {
  const location  = useLocation();
  const [user, setUser] = useState(null);
  const hideFooter = HIDE_FOOTER_PAGES.some(p => location.pathname.startsWith(p));

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        const themeId = me?.theme || 'default';
        const theme = THEMES.find(t => t.id === themeId);
        if (theme) applyTheme(theme);
      } catch {
        // not logged in — apply default theme
        applyTheme(THEMES[0]);
      }
    };
    loadTheme();
  }, []);

  const applyTheme = (theme) => {
    const root = document.documentElement;
    root.style.setProperty('--primary', theme.colors.primary);
    root.style.setProperty('--ring',    theme.colors.primary);
    let styleEl = document.getElementById('theme-override-style');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'theme-override-style';
      document.head.appendChild(styleEl);
    }
    const hslColor = `hsl(${theme.colors.primary})`;
    styleEl.textContent = `
      .text-emerald-400 { color: ${hslColor} !important; }
      .text-emerald-500 { color: ${hslColor} !important; }
      .bg-emerald-500 { background-color: ${hslColor} !important; }
      .bg-emerald-500\/20 { background-color: ${hslColor}20 !important; }
      .bg-emerald-500\/10 { background-color: ${hslColor}10 !important; }
      .border-emerald-500 { border-color: ${hslColor} !important; }
      .border-emerald-500\/30 { border-color: ${hslColor}30 !important; }
      .border-emerald-500\/40 { border-color: ${hslColor}40 !important; }
      .border-emerald-500\/60 { border-color: ${hslColor}60 !important; }
      .hover\\:text-emerald-400:hover { color: ${hslColor} !important; }
      .hover\\:border-emerald-500\\/40:hover { border-color: ${hslColor}40 !important; }
      .hover\\:border-emerald-500\\/60:hover { border-color: ${hslColor}60 !important; }
      .ring-emerald-500 { --tw-ring-color: ${hslColor} !important; }
    `;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <style>{`
        :root {
          --background: 0 0% 4%;
          --foreground: 0 0% 95%;
          --card: 0 0% 7%;
          --card-foreground: 0 0% 95%;
          --popover: 0 0% 7%;
          --popover-foreground: 0 0% 95%;
          --primary: 142 71% 45%;
          --primary-foreground: 0 0% 0%;
          --secondary: 0 0% 12%;
          --secondary-foreground: 0 0% 95%;
          --muted: 0 0% 12%;
          --muted-foreground: 0 0% 55%;
          --accent: 0 0% 12%;
          --accent-foreground: 0 0% 95%;
          --border: 0 0% 15%;
          --input: 0 0% 15%;
          --ring: 142 71% 45%;
        }
        body {
          background: #0a0a0a;
          overscroll-behavior: none;
        }

        /* Push page content right of the collapsed sidebar on desktop */
        @media (min-width: 769px) {
          .rk-page { margin-left: 68px; }
        }
        @media (max-width: 768px) {
          .rk-page { margin-left: 0; }
        }

        /* Slim top bar — desktop only */
        .rk-topbar {
          display: none;
        }
        @media (min-width: 769px) {
          .rk-topbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: fixed;
            top: 0; left: 68px; right: 0;
            height: 44px;
            background: rgba(10,10,10,0.85);
            backdrop-filter: blur(16px);
            border-bottom: 1px solid rgba(255,255,255,0.06);
            padding: 0 24px;
            z-index: 39;
          }
          .rk-page { margin-top: 44px; }
        }
        .rk-topbar-links {
          display: flex; align-items: center; gap: 24px;
        }
        .rk-topbar-link {
          font-size: 13px; font-weight: 600;
          color: #64748b; text-decoration: none;
          transition: color 0.2s;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .rk-topbar-link:hover { color: #f1f5f9; }
        .rk-topbar-right {
          display: flex; align-items: center; gap: 8px;
        }
        .rk-topbar-icon {
          width: 32px; height: 32px; border-radius: 9px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          display: flex; align-items: center; justify-content: center;
          color: #64748b; text-decoration: none;
          transition: all 0.2s;
        }
        .rk-topbar-icon:hover {
          background: rgba(255,255,255,0.08);
          color: #f1f5f9;
        }
      `}</style>

      {/* Sidebar — desktop only (self-hides on mobile via its own CSS) */}
      <RKSidebar user={user} />

      {/* Slim top bar — desktop only, sits to the right of the sidebar */}
      <div className="rk-topbar">
        <div className="rk-topbar-links">
          <Link to="/Home"                    className="rk-topbar-link">Home</Link>
          <Link to="/Search"                  className="rk-topbar-link">Browse</Link>
          <Link to="/Search?filter=trending"  className="rk-topbar-link">Trending</Link>
          <Link to="/Search?filter=new"       className="rk-topbar-link">New Releases</Link>
          <Link to="/SeasonalCalendar"        className="rk-topbar-link" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <CalendarDays size={13} /> Schedule
          </Link>
        </div>
        <div className="rk-topbar-right">
          <Link to="/Search" className="rk-topbar-icon" title="Search">
            <Search size={15} />
          </Link>
          <Link to="/Profile" className="rk-topbar-icon" title="Profile">
            <User size={15} />
          </Link>
        </div>
      </div>

      {/* Navbar — mobile only */}
      <div className="md:hidden">
        <Navbar />
      </div>

      {/* Page content */}
      <div className="rk-page">
        <main className="md:pt-0 pt-14 pb-safe-bottom">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        {!hideFooter && (
          <footer className="border-t border-zinc-800/50 mt-16 py-8 px-6 pb-20 md:pb-8">
            <div className="container mx-auto max-w-7xl text-center">
              <span className="text-2xl font-black text-white tracking-tighter select-none">
                R<span className="text-emerald-500">K</span>
              </span>
              <p className="text-xs text-zinc-600 mt-2">Your ultimate anime destination.</p>
            </div>
          </footer>
        )}
      </div>

      <BottomTabBar />
    </div>
  );
}
