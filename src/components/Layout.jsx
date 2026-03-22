import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import Navbar from './anime/Navbar';
import BottomTabBar from './anime/BottomTabBar';
import Sidebar from './anime/Sidebar';

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
    const loadUser = async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        const themeId = me?.theme || 'default';
        const theme = THEMES.find(t => t.id === themeId);
        if (theme) applyTheme(theme);
      } catch {}
    };
    loadUser();
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

        /* On desktop, push content right by the collapsed sidebar width (68px) */
        @media (min-width: 769px) {
          .rk-main-content { margin-left: 68px; }
        }
        /* On mobile, no margin — sidebar is hidden, Navbar + BottomTabBar take over */
        @media (max-width: 768px) {
          .rk-main-content { margin-left: 0; }
        }
      `}</style>

      {/* Sidebar — desktop only (hidden on mobile via its own CSS) */}
      <Sidebar user={user} />

      {/* Navbar — mobile only (hidden on desktop via Tailwind) */}
      <div className="md:hidden">
        <Navbar />
      </div>

      {/* Main content area */}
      <div className="rk-main-content">
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
