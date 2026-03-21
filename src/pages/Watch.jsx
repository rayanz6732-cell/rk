import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Mic, Captions, RotateCw } from 'lucide-react';
import CommentsSection from '../components/anime/CommentsSection';
import { recordWatchActivity } from '../lib/streakAndBadges';
import { blockIframeAds } from '../lib/adBlocker';
import { JikanAPI } from '../lib/jikan';
import { base44 } from '@/api/base44Client';

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
  const [refreshing, setRefreshing] = useState(false);
  const [gogoSrc, setGogoSrc] = useState(null);
  const [gogoLoading, setGogoLoading] = useState(false);
  const [gogoError, setGogoError] = useState(null);
  const iframeRef = useRef(null);

  // Fetch Jikan episodes (metadata) + Aniwatch episode count (faster updates)
  // Merge: use Jikan for titles/filler, Aniwatch to surface episodes Jikan hasn't listed yet
  const fetchEpisodes = async () => {
    if (!mal_id) return;
    setRefreshing(true);
    try {
      // Fetch Jikan metadata and Aniwatch count in parallel
      const [firstPage, aniwatchRes] = await Promise.all([
        JikanAPI.getEpisodes(mal_id, 1),
        base44.functions.invoke('aniwatchProxy', { title }).catch(() => null),
      ]);

      let jikanEps = firstPage.data || [];
      const totalPages = firstPage.pagination?.last_visible_page || 1;
      if (totalPages > 1) {
        const rest = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, i) => JikanAPI.getEpisodes(mal_id, i + 2))
        );
        rest.forEach(r => { jikanEps = jikanEps.concat(r.data || []); });
      }

      // Aniwatch episodes (faster source — may have newer eps)
      const aniwatchEps = aniwatchRes?.data?.episodes || [];
      const aniwatchCount = aniwatchEps.length;

      // Build merged list: Jikan episodes enriched with aniwatch, plus any extras aniwatch has
      const jikanNums = new Set(jikanEps.map(e => e.mal_id));
      const extras = [];
      for (let i = jikanEps.length + 1; i <= aniwatchCount; i++) {
        if (!jikanNums.has(i)) {
          const aw = aniwatchEps.find(e => e.number === i);
          extras.push({
            mal_id: i,
            title: aw?.title || `Episode ${i}`,
            isFiller: aw?.isFiller || false,
            fromAniwatch: true,
          });
        }
      }

      setEpisodes([...jikanEps, ...extras]);
    } catch (err) {
      console.error('Failed to fetch episodes:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEpisodes();
    recordWatchActivity().catch(() => {});

    // Auto-refresh every 30 minutes to pick up new episodes from Aniwatch
    const interval = setInterval(fetchEpisodes, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [mal_id]);

  useEffect(() => {
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

  const embedUrl = server === 'vidsrc'
    ? `https://vidsrc.cc/v2/embed/anime/${mal_id}/${ep}/${audioType}?ads=false`
    : server === '2embed'
    ? `https://vidsrc.cc/v2/embed/anime/${mal_id}/${ep}/${audioType}?source=2&ads=false`
    : `https://2anime.xyz/embed/${mal_id}/${ep}`;

  const currentEpNum = parseInt(ep);
  const nextEps = episodes.filter(e => e.mal_id > currentEpNum).slice(0, 15);

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
              onClick={() => setServer('2anime')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                server === '2anime' ? 'bg-emerald-500 text-black' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              S3
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
            <iframe
              ref={iframeRef}
              key={`${mal_id}-${ep}-${audioType}-${server}`}
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

            {/* Up Next — mobile/below player */}
            {nextEps.length > 0 && (
              <div className="mt-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Up Next</h3>
                  <button
                    onClick={fetchEpisodes}
                    disabled={refreshing}
                    className="text-xs text-zinc-600 hover:text-emerald-500 transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    <RotateCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {nextEps.map(e => (
                    <Link
                      key={e.mal_id}
                      to={`/Watch?id=${mal_id}&ep=${e.mal_id}&title=${encodeURIComponent(title)}`}
                      className="group relative block rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/50 hover:border-emerald-500/60 transition-all"
                    >
                      <div className="px-3 py-3 flex items-center gap-3">
                        <span className="text-emerald-500 font-black text-lg w-7 flex-shrink-0">{e.mal_id}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <p className="text-[11px] font-medium text-zinc-500">Episode {e.mal_id}</p>
                            {e.fromAniwatch && <span className="px-1 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400">NEW</span>}
                          </div>
                          <p className="text-xs text-zinc-300 line-clamp-1 group-hover:text-emerald-400 transition-colors">
                            {e.title || `Episode ${e.mal_id}`}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <CommentsSection mal_id={mal_id} episode={ep} />
          </div>
        </div>

        {/* Up Next Sidebar — desktop only */}
        {nextEps.length > 0 && (
          <div className="hidden lg:flex flex-col w-80 xl:w-96 flex-shrink-0 border-l border-zinc-900" style={{ height: 'calc(100vh - 53px)', overflowY: 'auto' }}>
            <div className="px-4 py-3 border-b border-zinc-900 sticky top-0 bg-[#0a0a0a] z-10 flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Up Next</h3>
              <button
                onClick={fetchEpisodes}
                disabled={refreshing}
                className="text-xs text-zinc-600 hover:text-emerald-500 transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                <RotateCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="flex flex-col gap-2 p-3">
              {nextEps.map(e => (
                <Link
                  key={e.mal_id}
                  to={`/Watch?id=${mal_id}&ep=${e.mal_id}&title=${encodeURIComponent(title)}`}
                  className="group flex items-center gap-3 rounded-xl bg-zinc-900 border border-zinc-800/50 hover:border-emerald-500/60 transition-all px-3 py-3"
                >
                  <span className="text-emerald-500 font-black text-lg w-7 flex-shrink-0">{e.mal_id}</span>
                  <div className="flex flex-col justify-center min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[11px] text-zinc-500">Episode {e.mal_id}</p>
                      {e.fromAniwatch && <span className="px-1 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400">NEW</span>}
                    </div>
                    <p className="text-xs text-zinc-300 line-clamp-2 group-hover:text-emerald-400 transition-colors">{e.title || `Episode ${e.mal_id}`}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}