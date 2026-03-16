import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, SkipForward, Mic, Captions, Server, Loader2 } from 'lucide-react';

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
  const [loadingAnilist, setLoadingAnilist] = useState(true);
  const [sourceIndex, setSourceIndex] = useState(0);

  const isDub = audioType === 'dub';

  useEffect(() => {
    setLoadingAnilist(true);
    getAnilistId(mal_id).then(id => {
      setAnilistId(id);
      setLoadingAnilist(false);
    });
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

  useEffect(() => {
    if (!showSkipIntro) return;
    const timer = setTimeout(() => setShowSkipIntro(false), 120000);
    return () => clearTimeout(timer);
  }, [showSkipIntro]);

  const al = anilistId;

  // All sources — MAL-based first (no conversion needed), then AniList-based
  const allSources = [
    // MAL-based (always available immediately)
    {
      name: 'VidLink',
      url: `https://vidlink.pro/anime/${mal_id}/${ep}/${audioType}?fallback=true&primaryColor=10b981`,
      needsAL: false,
    },
    {
      name: 'VidLink JW',
      url: `https://vidlink.pro/anime/${mal_id}/${ep}/${audioType}?fallback=true&player=jw`,
      needsAL: false,
    },
    // AniList-based
    {
      name: 'VidPlus',
      url: al ? `https://player.vidplus.to/embed/anime/${al}/${ep}?dub=${isDub}&primarycolor=10b981` : null,
      needsAL: true,
    },
    {
      name: 'VidSrc ICU',
      url: al ? `https://vidsrc.icu/embed/anime/${al}/${ep}/${isDub ? 1 : 0}` : null,
      needsAL: true,
    },
    {
      name: 'VidSrc.me',
      url: al ? `https://vidsrc.me/embed/anime?id=${al}&e=${ep}` : null,
      needsAL: true,
    },
    {
      name: 'Rive',
      url: al ? `https://rivestream.org/embed?type=anime&id=${al}&episode=${ep}&isDub=${isDub}` : null,
      needsAL: true,
    },
    {
      name: 'AniWatch',
      url: al ? `https://aniwatch.to/anime/watch?id=${al}&ep=${ep}` : null,
      needsAL: true,
    },
    {
      name: 'AnimeOwl',
      url: `https://animeowl.live/embed/${mal_id}/${ep}`,
      needsAL: false,
    },
  ];

  const availableSources = allSources.filter(s => !s.needsAL || (!loadingAnilist && s.url));
  const clampedIndex = Math.min(sourceIndex, availableSources.length - 1);
  const currentSource = availableSources[clampedIndex];

  const handleSkipIntro = () => {
    localStorage.setItem(storageKey, String(INTRO_DURATION));
    setResumeTime(INTRO_DURATION);
    setShowSkipIntro(false);
  };

  const handleAudioSwitch = (type) => {
    setAudioType(type);
    setSourceIndex(0);
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
        {currentSource ? (
          <iframe
            key={`${mal_id}-${ep}-${audioType}-${clampedIndex}-${al}`}
            src={currentSource.url}
            className="absolute inset-0 w-full h-full"
            allowFullScreen
            allow="fullscreen; autoplay; encrypted-media; picture-in-picture"
            frameBorder="0"
            title={`${title} Episode ${ep}`}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        )}

        {showSkipIntro && currentSource && (
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

      {/* Info + server selector */}
      <div className="px-4 md:px-8 py-4 border-t border-zinc-900">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
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

          <div className="flex flex-col gap-2">
            <p className="text-zinc-600 text-xs flex items-center gap-1.5">
              <Server className="w-3 h-3" />
              If video doesn't load, try another server
              {loadingAnilist && <Loader2 className="w-3 h-3 animate-spin ml-1" />}
            </p>
            <div className="flex flex-wrap gap-2">
              {availableSources.map((source, idx) => (
                <button
                  key={source.name}
                  onClick={() => setSourceIndex(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    clampedIndex === idx
                      ? 'bg-emerald-500 border-emerald-500 text-black'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white'
                  }`}
                >
                  {source.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}