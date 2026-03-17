import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const THEMES = [
  {
    id: 'default',
    name: 'Default',
    desc: 'Pure white clean aesthetic',
    gradient: 'from-gray-300 to-gray-400',
    colors: { primary: '142 71% 45%', bg: '0 0% 4%' }
  },
  {
    id: 'cherry',
    name: 'Cherry Blossom',
    desc: 'Soft pink tones inspired by sakura',
    gradient: 'from-pink-400 to-purple-400',
    colors: { primary: '340 82% 52%', bg: '0 0% 4%' }
  },
  {
    id: 'neon',
    name: 'Neon Tokyo',
    desc: 'Electric neon cyberpunk vibes',
    gradient: 'from-purple-500 to-cyan-400',
    colors: { primary: '280 90% 50%', bg: '0 0% 2%' }
  },
  {
    id: 'aurora',
    name: 'Aurora Borealis',
    desc: 'Northern lights dancing colors',
    gradient: 'from-green-400 to-cyan-500',
    colors: { primary: '162 73% 46%', bg: '0 0% 4%' }
  },
  {
    id: 'ocean',
    name: 'Deep Ocean',
    desc: 'Mysterious underwater depths',
    gradient: 'from-blue-500 to-blue-600',
    colors: { primary: '217 91% 60%', bg: '0 0% 3%' }
  },
  {
    id: 'sunset',
    name: 'Golden Sunset',
    desc: 'Warm sunset dreamy palette',
    gradient: 'from-yellow-400 via-orange-500 to-red-500',
    colors: { primary: '39 89% 49%', bg: '0 0% 4%' }
  }
];

export default function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState('default');

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setSelectedTheme(u.theme || 'default');
    });
  }, []);

  const handleThemeChange = async (themeId) => {
    setSelectedTheme(themeId);
    await base44.auth.updateMe({ theme: themeId });
    
    const theme = THEMES.find(t => t.id === themeId);
    document.documentElement.style.setProperty('--primary', theme.colors.primary);
    document.documentElement.style.setProperty('--background', theme.colors.bg);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-emerald-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div>
            <h1 className="text-3xl font-black text-white">Settings</h1>
            <p className="text-zinc-500 text-sm">Customize your viewing experience</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-zinc-800 overflow-x-auto pb-2">
          <button className="px-4 py-2 rounded-lg bg-emerald-500 text-black text-sm font-semibold transition-all">
            Appearance
          </button>
        </div>

        {/* Appearance Section */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-white mb-2">Appearance</h2>
          <p className="text-zinc-500 text-sm mb-6">Choose your visual theme</p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {THEMES.map(theme => (
              <button
                key={theme.id}
                onClick={() => handleThemeChange(theme.id)}
                className={`relative rounded-2xl overflow-hidden transition-all ${
                  selectedTheme === theme.id ? 'ring-2 ring-emerald-500 scale-105' : 'hover:scale-102'
                }`}
              >
                <div className={`h-32 bg-gradient-to-r ${theme.gradient}`} />
                <div className="bg-zinc-800 px-4 py-3">
                  <p className="text-sm font-bold text-white text-left">{theme.name}</p>
                  <p className="text-xs text-zinc-500 text-left leading-tight">{theme.desc}</p>
                </div>
                {selectedTheme === theme.id && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                      <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}