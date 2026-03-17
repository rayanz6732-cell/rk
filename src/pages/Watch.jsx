import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Mic, Captions, Play } from 'lucide-react';
import { JikanAPI } from '../lib/jikan';

export default function Watch() {
  const [searchParams] = useSearchParams();
  const mal_id = searchParams.get('id');
  const ep = searchParams.get('ep') || '1';
  const title = decodeURIComponent(searchParams.get('title') || 'Anime');

  const storageKey = `rk_progress_${mal_id}_ep${ep}`;

  const [audioType, setAudioType] = useState('sub');
  const [resumeTime, setResumeTime] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const t = parseInt(saved, 10);
      if (t > 10) setResumeTime(t);
    }
  }, [storageKey]);

  const sessionStartRef = useRef(Date.now());
  useEffect(() => {
    sessionStartRef.current = Date.now();
    const save = () => {
      const elapsed = Math.floor((Date.now() - sessionStartRef.current) / 1000) + resumeTime;
      if (elapsed > 10) localStorage.setItem(storageKey, String(elapsed));
    };
    window.addEventListener('beforeunload', save);
    const interval = setInterval(save, 15000);
    return () => {
      save();
      window.removeEventListener('beforeunload', save);
      clearInterval(interval);
    };
  }, [storageKey, resumeTime]);

  const embedUrl = `https://vidsrc.cc/v2/embed/anime/${mal_id}/${ep}/${audioType}`;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 md:px-8 py-3 border-b border-zinc-900 flex-shrink-0 gap-3">
        <Link
          to={`/AnimeDetail?id=${mal_id}`}
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-emerald-400 transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="text-sm text-zinc-400 font-medium truncate text-center">
          <span className="text-white">{title}</span>
          <span className="text-zinc-600 mx-1.5">·</span>
          Episode {ep}
        </div>
        <div className="flex items-center gap-1 bg-zinc-900 rounded-lg p-1 border border-zinc-800 flex-shrink-0">
          <button
            onClick={() => setAudioType('sub')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              audioType === 'sub' ? 'bg-emerald-500 text-black' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Captions className="w-3.5 h-3.5" /> SUB
          </button>
          <button
            onClick={() => setAudioType('dub')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              audioType === 'dub' ? 'bg-emerald-500 text-black' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Mic className="w-3.5 h-3.5" /> DUB
          </button>
        </div>
      </div>

      {/* Video Player */}
      <div className="relative w-full bg-black flex-shrink-0" style={{ paddingTop: 'min(56.25%, 80vh)' }}>
        <iframe
          key={`${mal_id}-${ep}-${audioType}`}
          src={embedUrl}
          className="absolute inset-0 w-full h-full"
          allowFullScreen
          allow="fullscreen; autoplay; encrypted-media; picture-in-picture"
          frameBorder="0"
          title={`${title} Episode ${ep}`}
        />
      </div>

      {/* Info */}
      <div className="px-4 md:px-8 py-4 border-t border-zinc-900">
        <p className="text-white font-semibold">{title}</p>
        <p className="text-zinc-500 text-sm mt-0.5">
          Episode {ep}
          {resumeTime > 10 && (
            <span className="ml-3 text-emerald-500/70 text-xs">
              ● Resumed {Math.floor(resumeTime / 60)}m {resumeTime % 60}s
            </span>
          )}
        </p>
      </div>
    </div>
  );
}