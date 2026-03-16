import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/Search?q=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
      setQuery('');
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-zinc-800/50">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/Home" className="flex items-center gap-1.5">
            <span className="text-2xl font-black text-white tracking-tighter">
              R<span className="text-emerald-500">K</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/Home" className="text-sm text-zinc-400 hover:text-emerald-400 transition-colors font-medium">Home</Link>
            <Link to="/Search" className="text-sm text-zinc-400 hover:text-emerald-400 transition-colors font-medium">Browse</Link>
            <Link to="/Search?filter=trending" className="text-sm text-zinc-400 hover:text-emerald-400 transition-colors font-medium">Trending</Link>
            <Link to="/Search?filter=new" className="text-sm text-zinc-400 hover:text-emerald-400 transition-colors font-medium">New Releases</Link>
          </div>

          {/* Search + Mobile Toggle */}
          <div className="flex items-center gap-3">
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center">
                <Input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search anime..."
                  className="w-48 md:w-64 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 text-sm h-9 rounded-lg focus-visible:ring-emerald-500/50"
                />
                <button
                  type="button"
                  onClick={() => { setSearchOpen(false); setQuery(''); }}
                  className="ml-2 text-zinc-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="w-9 h-9 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 flex items-center justify-center transition-colors"
              >
                <Search className="w-4 h-4 text-zinc-400" />
              </button>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-9 h-9 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 flex items-center justify-center"
            >
              {mobileOpen ? <X className="w-4 h-4 text-zinc-400" /> : <Menu className="w-4 h-4 text-zinc-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-zinc-800/50 px-6 py-4 space-y-3">
          <Link to="/Home" onClick={() => setMobileOpen(false)} className="block text-sm text-zinc-300 hover:text-emerald-400 py-2">Home</Link>
          <Link to="/Search" onClick={() => setMobileOpen(false)} className="block text-sm text-zinc-300 hover:text-emerald-400 py-2">Browse</Link>
          <Link to="/Search?filter=trending" onClick={() => setMobileOpen(false)} className="block text-sm text-zinc-300 hover:text-emerald-400 py-2">Trending</Link>
          <Link to="/Search?filter=new" onClick={() => setMobileOpen(false)} className="block text-sm text-zinc-300 hover:text-emerald-400 py-2">New Releases</Link>
        </div>
      )}
    </nav>
  );
}