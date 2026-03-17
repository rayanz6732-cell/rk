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
  const [episodes, setEpisodes] = useState([]);

  useEffect(() => {
    JikanAPI.getEpisodes(mal_id).then(data => setEpisodes(data?.data || []));
  }, [mal_id]);

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
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col overflow-hidden">
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

      {/* Main content: player + sidebar */}
      <div className="flex flex-col lg:flex-row flex-1">
        {/* Video + info */}
        <div className="flex-1 min-w-0">
          <div className="relative w-full bg-black" style={{ paddingTop: 'min(56.25%, 75vh)' }}>
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
          <div className="px-4 md:px-6 py-4 border-t border-zinc-900">
            <p className="text-white font-semibold">{title}</p>
            <p className="text-zinc-500 text-sm mt-0.5">
              Episode {ep}
              {resumeTime > 10 && (
                <span className="ml-3 text-emerald-500/70 text-xs">
                  ● Resumed {Math.floor(resumeTime / 60)}m {resumeTime % 60}s
                </span>
              )}
            </p>

            {/* Next Episodes — mobile/below player */}
            {episodes.length > 0 && (() => {
              const currentEpNum = parseInt(ep);
              const nextEps = episodes.filter(e => e.mal_id > currentEpNum).slice(0, 10);
              const coverThumb = `https://img.anili.st/media/${mal_id}`;
              if (!nextEps.length) return null;
              return (
                <div className="mt-5">
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Up Next</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {nextEps.map(e => {
                      const thumb = e.images?.jpg?.image_url;
                      return (
                        <Link
                          key={e.mal_id}
                          to={`/Watch?id=${mal_id}&ep=${e.mal_id}&title=${encodeURIComponent(title)}`}
                          className="group relative block rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/50 hover:border-emerald-500/60 transition-all"
                        >
                          <div className="relative aspect-video">
                            <img src={thumb || coverThumb} alt={`Ep ${e.mal_id}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="w-9 h-9 rounded-full bg-emerald-500/90 flex items-center justify-center">
                                <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                              </div>
                            </div>
                            <div className="absolute bottom-1.5 right-2 text-white font-black text-base drop-shadow-lg">{e.mal_id}</div>
                          </div>
                          <div className="px-2 py-1.5">
                            <p className="text-[11px] font-medium text-zinc-500 mb-0.5">Episode {e.mal_id}</p>
                            <p className="text-xs text-zinc-300 line-clamp-1 group-hover:text-emerald-400 transition-colors">
                              {e.title || `Episode ${e.mal_id}`}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Up Next Sidebar — desktop only */}
        {episodes.length > 0 && (() => {
          const currentEpNum = parseInt(ep);
          const nextEps = episodes.filter(e => e.mal_id > currentEpNum).slice(0, 15);
          if (!nextEps.length) return null;
          return (
            <div className="hidden lg:flex flex-col w-80 xl:w-96 flex-shrink-0 border-l border-zinc-900" style={{ height: 'calc(100vh - 53px)', overflowY: 'auto' }}>
              <div className="px-4 py-3 border-b border-zinc-900 sticky top-0 bg-[#0a0a0a] z-10">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Up Next</h3>
              </div>
              <div className="flex flex-col gap-2 p-3">
                {nextEps.map(e => {
                  const thumb = e.images?.jpg?.image_url;
                  return (
                    <Link
                      key={e.mal_id}
                      to={`/Watch?id=${mal_id}&ep=${e.mal_id}&title=${encodeURIComponent(title)}`}
                      className="group flex gap-3 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/50 hover:border-emerald-500/60 transition-all p-2"
                    >
                      <div className="relative w-28 flex-shrink-0 aspect-video rounded-lg overflow-hidden">
                        {thumb
                          ? <img src={thumb} alt={`Ep ${e.mal_id}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          : <div className="w-full h-full bg-zinc-800 flex items-center justify-center"><Play className="w-4 h-4 text-zinc-600" /></div>
                        }
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-7 h-7 rounded-full bg-emerald-500/90 flex items-center justify-center">
                            <Play className="w-3 h-3 text-white fill-white ml-0.5" />
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col justify-center min-w-0">
                        <p className="text-[11px] text-zinc-500">Episode {e.mal_id}</p>
                        <p className="text-xs text-zinc-300 line-clamp-2 group-hover:text-emerald-400 transition-colors">{e.title || `Episode ${e.mal_id}`}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}