import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Mic, Captions, Play } from 'lucide-react';
import { JikanAPI } from '../lib/jikan';
import CommentsSection from '../components/anime/CommentsSection';
import { recordWatchActivity } from '../lib/streakAndBadges';
import { blockIframeAds } from '../lib/adBlocker';


export default function Watch() {
  const [searchParams] = useSearchParams();
  const mal_id = searchParams.get('id');
  const ep = searchParams.get('ep') || '1';
  const title = decodeURIComponent(searchParams.get('title') || 'Anime');

  const storageKey = `rk_progress_${mal_id}_ep${ep}`;

  const [audioType, setAudioType] = useState('sub');
  const [server, setServer] = useState('vidsrc');
  const [resumeTime, setResumeTime] = useState(0);
  const [episodes, setEpisodes] = useState([]);

  const iframeRef = useRef(null);

  useEffect(() => {
    if (mal_id) {
      JikanAPI.getEpisodes(mal_id).then(data => setEpisodes(data?.data || []));
    }
    recordWatchActivity().catch(() => {});
  }, [mal_id, ep]);

  useEffect(() => {
    // Block ads on the video player iframe
    if (iframeRef.current) {
      blockIframeAds(iframeRef.current);
    }
  }, [mal_id, ep, audioType, server]);

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

  const embedUrl = server === 's3' && s3Src
    ? s3Src
    : server === 'vidsrc'
    ? `https://vidsrc.cc/v2/embed/anime/${mal_id}/${ep}/${audioType}?ads=false`
    : `https://vidsrc.cc/v2/embed/anime/${mal_id}/${ep}/${audioType}?source=2&ads=false`;

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
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Server switcher */}
          <div className="flex items-center gap-1 bg-zinc-900 rounded-lg p-1 border border-zinc-800">
            <button
              onClick={() => setServer('vidsrc')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                server === 'vidsrc' ? 'bg-emerald-500 text-black' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              S1
            </button>
            <button
              onClick={() => setServer('2embed')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                server === '2embed' ? 'bg-emerald-500 text-black' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              S2
            </button>
            <button
              onClick={() => {
                if (server !== 's3') {
                  setServer('s3');
                  setS3Loading(true);
                  setS3Error(null);
                  base44.functions.invoke('animeStreamScraper', { title, episode: ep })
                    .then(res => {
                      setS3Src(res.data?.src);
                      setS3Error(null);
                    })
                    .catch(err => {
                      setS3Error(err.response?.data?.error || 'Failed to load stream');
                      setServer('vidsrc');
                    })
                    .finally(() => setS3Loading(false));
                }
              }}
              disabled={s3Loading}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                server === 's3' ? 'bg-emerald-500 text-black' : 'text-zinc-500 hover:text-zinc-300'
              } disabled:opacity-50`}
            >
              {s3Loading ? '...' : 'S3'}
            </button>
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
      </div>

      {/* Main content: player + sidebar */}
      <div className="flex flex-col lg:flex-row flex-1">
        {/* Video + info */}
        <div className="flex-1 min-w-0">
          <div className="relative w-full bg-black" style={{ paddingTop: 'min(56.25%, 75vh)' }}>
            {server === 's3' && s3Loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full mx-auto mb-3" />
                  <p className="text-zinc-400 text-sm">Searching anime sites...</p>
                </div>
              </div>
            ) : server === 's3' && s3Error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="text-red-500 text-sm font-medium">Episode not found</div>
                <p className="text-zinc-500 text-xs text-center max-w-xs">{s3Error}</p>
                <button
                  onClick={() => setServer('vidsrc')}
                  className="text-emerald-500 text-xs hover:text-emerald-400 underline"
                >
                  Try Server 1
                </button>
              </div>
            ) : (
              <iframe
                ref={iframeRef}
                key={`${mal_id}-${ep}-${audioType}-${server}`}
                src={embedUrl}
                className="absolute inset-0 w-full h-full"
                allowFullScreen
                allow="fullscreen; autoplay; encrypted-media; picture-in-picture"
                sandbox="allow-same-origin allow-scripts allow-presentation allow-fullscreen"
                frameBorder="0"
                title={`${title} Episode ${ep}`}
              />
            )}
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
                            <div className="px-3 py-3 flex items-center gap-3">
                            <span className="text-emerald-500 font-black text-lg w-7 flex-shrink-0">{e.mal_id}</span>
                            <div className="min-w-0">
                              <p className="text-[11px] font-medium text-zinc-500 mb-0.5">Episode {e.mal_id}</p>
                              <p className="text-xs text-zinc-300 line-clamp-1 group-hover:text-emerald-400 transition-colors">
                                {e.title || `Episode ${e.mal_id}`}
                              </p>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            <CommentsSection mal_id={mal_id} episode={ep} />
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
                      className="group flex items-center gap-3 rounded-xl bg-zinc-900 border border-zinc-800/50 hover:border-emerald-500/60 transition-all px-3 py-3"
                    >
                      <span className="text-emerald-500 font-black text-lg w-7 flex-shrink-0">{e.mal_id}</span>
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