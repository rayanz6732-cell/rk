import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './anime/Navbar';
import BottomTabBar from './anime/BottomTabBar';
import Sidebar from './Sidebar';

const HIDE_FOOTER_PAGES = ['/Watch'];

export default function Layout() {
  const location = useLocation();
  const hideFooter = HIDE_FOOTER_PAGES.some(p => location.pathname.startsWith(p));

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
      `}</style>
      <Navbar />
      <Sidebar />
      <main className="pt-14 pb-safe-bottom">
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
      <BottomTabBar />
    </div>
  );
}