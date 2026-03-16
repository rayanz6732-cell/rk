import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, SkipForward, Mic, Captions, RefreshCw } from 'lucide-react';

const INTRO_DURATION = 90;

async function getAnilistId(malId) {
  try {
    const query = `query ($idMal: Int) { Media(idMal: $idMal, type: ANIME) { id } }`;
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { idMal: parseInt(malId) } }),
    });
    const data = await res.json();
    return data?.data?.Media?.id || null;
  } catch {
    return null;
  }
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
  const [sourceIndex, setSourceIndex] = useState(0);
  const iframeRef = useRef(null);

  // Sources - built lazily since some need anilistId
  const getSources = (alId) => [
    // Source 1: vidlink.pro — MAL ID directly, most reliable for anime
    `https://vidlink.pro/anime/${mal_id}/${ep}/${audioType}`,
    // Source 2: vidsrc.icu — needs AniList ID
    alId ? `https://vidsrc.icu/embed/anime/${alId}/${ep}/${audioType === 'dub' ? 1 : 0}` : null,
    // Source 3: 2embed.skin
    `https://www.2embed.skin/embedanime/${mal_id}/${ep}`,
    // Source 4: vidlink with dub fallback
    `https://vidlink.pro/anime/${mal_id}/${ep}/sub`,
  ].filter(Boolean);

  // Fetch AniList ID in background for source 2
  useEffect(() => {
    getAnilistId(mal_id).then(setAnilistId);
  }, [mal_id]);

  // Load saved progress
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const t = parseInt(saved, 10);
      if (t > 10) setResumeTime(t);
    }
  }, [storageKey]);

  // Save progress via wall-clock time
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

  // Hide skip intro after intro window
  useEffect(() => {
    if (!showSkipIntro) return;
    const timer = setTimeout(() => setShowSkipIntro(false), (INTRO_DURATION + 30) * 1000);
    return () => clearTimeout(timer);
  }, [showSkipIntro]);

  const sources = getSources(anilistId);
  const currentSrc = sources[sourceIndex] || sources[0];

  const handleSkipIntro = () => {
    localStorage.setItem(storageKey, String(INTRO_DURATION));
    setResumeTime(INTRO_DURATION);
    setShowSkipIntro(false);
  };

  const handleNextSource = () => {
    const next = (sourceIndex + 1) % sources.length;
    setSourceIndex(next);
  };

  const handleAudioSwitch = (type) => {
    setAudioType(type);
    setSourceIndex(0); // reset to best source when switching
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
            onClick={() => handleAudioSwitch('sub')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              audioType === 'sub' ? 'bg-emerald-500 text-black' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Captions className="w-3.5 h-3.5" /> SUB
          </button>
          <button
            onClick={() => handleAudioSwitch('dub')}
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
          ref={iframeRef}
          key={`${mal_id}-${ep}-${audioType}-${sourceIndex}`}
          src={currentSrc}
          className="absolute inset-0 w-full h-full"
          allowFullScreen
          allow="fullscreen; autoplay; encrypted-media; picture-in-picture"
          frameBorder="0"
          title={`${title} Episode ${ep}`}
        />

        {/* Skip Intro */}
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
      </div>

      {/* Info + source switcher */}
      <div className="px-4 md:px-8 py-4 border-t border-zinc-900 flex flex-wrap items-center justify-between gap-3">
        <div>
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

        {/* Try different server button */}
        <button
          onClick={handleNextSource}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white text-sm rounded-lg transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try different server
          <span className="text-zinc-700 text-xs">({sourceIndex + 1}/{sources.length})</span>
        </button>
      </div>
    </div>
  );
}