import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, SkipForward, Mic, Captions, Loader2 } from 'lucide-react';

const INTRO_DURATION = 90;

async function getAnilistId(malId) {
  const query = `
    query ($idMal: Int) {
      Media(idMal: $idMal, type: ANIME) {
        id
      }
    }
  `;
  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query, variables: { idMal: parseInt(malId) } }),
  });
  const data = await res.json();
  return data?.data?.Media?.id;
}

export default function Watch() {
  const urlParams = new URLSearchParams(window.location.search);
  const mal_id = urlParams.get('id');
  const ep = urlParams.get('ep') || '1';
  const title = decodeURIComponent(urlParams.get('title') || 'Anime');

  const storageKey = `rk_progress_${mal_id}_ep${ep}`;

  const [audioType, setAudioType] = useState('sub');
  const [showSkipIntro, setShowSkipIntro] = useState(true);
  const [resumeTime, setResumeTime] = useState(0);
  const [anilistId, setAnilistId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const iframeRef = useRef(null);

  // Fetch AniList ID from MAL ID
  useEffect(() => {
    setLoading(true);
    setError(false);
    getAnilistId(mal_id)
      .then((id) => {
        if (id) setAnilistId(id);
        else setError(true);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [mal_id]);

  // Load saved progress
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const t = parseInt(saved, 10);
      if (t > 10) setResumeTime(t);
    }
  }, [storageKey]);

  // Save progress via wall-clock time tracking
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

  // Hide skip intro after ~2 minutes
  useEffect(() => {
    if (!showSkipIntro) return;
    const timer = setTimeout(() => setShowSkipIntro(false), (INTRO_DURATION + 30) * 1000);
    return () => clearTimeout(timer);
  }, [showSkipIntro]);

  // vidsrc.icu anime embed: /embed/anime/{anilist_id}/{episode}/{dub}
  // dub: 0 = sub, 1 = dub
  const getEmbedUrl = (aniId) => {
    const dubFlag = audioType === 'dub' ? 1 : 0;
    return `https://vidsrc.icu/embed/anime/${aniId}/${ep}/${dubFlag}`;
  };

  const handleSkipIntro = () => {
    localStorage.setItem(storageKey, String(INTRO_DURATION));
    setResumeTime(INTRO_DURATION);
    setShowSkipIntro(false);
  };

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
        {/* Sub / Dub toggle */}
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
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              <p className="text-zinc-500 text-sm">Loading player...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950">
            <div className="text-center space-y-3">
              <p className="text-zinc-400">Could not load this episode.</p>
              <Link
                to={`/AnimeDetail?id=${mal_id}`}
                className="text-emerald-400 text-sm hover:underline"
              >
                ← Back to anime
              </Link>
            </div>
          </div>
        )}

        {!loading && !error && anilistId && (
          <>
            <iframe
              ref={iframeRef}
              key={`${anilistId}-${ep}-${audioType}`}
              src={getEmbedUrl(anilistId)}
              className="absolute inset-0 w-full h-full"
              allowFullScreen
              allow="fullscreen; autoplay; encrypted-media; picture-in-picture"
              frameBorder="0"
              title={`${title} Episode ${ep}`}
            />
            {/* Skip Intro button */}
            {showSkipIntro && (
              <div className="absolute bottom-14 right-4 z-10">
                <button
                  onClick={handleSkipIntro}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-900/90 border border-zinc-600 hover:border-emerald-500 text-white text-sm font-semibold rounded-lg backdrop-blur-sm transition-all hover:bg-zinc-800 shadow-lg"
                >
                  <SkipForward className="w-4 h-4 text-emerald-400" />
                  Skip Intro
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Info bar */}
      <div className="px-4 md:px-8 py-4 border-t border-zinc-900">
        <p className="text-white font-semibold">{title}</p>
        <p className="text-zinc-500 text-sm mt-0.5">
          Episode {ep}
          {resumeTime > 10 && (
            <span className="ml-3 text-emerald-500/70 text-xs">
              ● Resumed from {Math.floor(resumeTime / 60)}m {resumeTime % 60}s
            </span>
          )}
        </p>
      </div>
    </div>
  );
}