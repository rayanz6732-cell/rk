import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './anime/Navbar';

export default function Layout() {
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
        body { background: #0a0a0a; }
      `}</style>
      <Navbar />
      <main className="pt-16">
        <Outlet />
      </main>
      {/* Footer */}
      <footer className="border-t border-zinc-800/50 mt-16 py-8 px-6">
        <div className="container mx-auto max-w-7xl text-center">
          <span className="text-2xl font-black text-white tracking-tighter">
            R<span className="text-emerald-500">K</span>
          </span>
          <p className="text-xs text-zinc-600 mt-2">Your ultimate anime destination. Powered by AnimeKai data.</p>
        </div>
      </footer>
    </div>
  );
}