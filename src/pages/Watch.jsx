import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, SkipForward, Mic, Captions } from 'lucide-react';
import { Button } from '@/components/ui/button';

const INTRO_DURATION = 90; // seconds — skip to this point on "Skip Intro"

export default function Watch() {
  const urlParams = new URLSearchParams(window.location.search);
  const mal_id = urlParams.get('id');
  const ep = urlParams.get('ep') || '1';
  const title = decodeURIComponent(urlParams.get('title') || 'Anime');

  const storageKey = `rk_progress_${mal_id}_ep${ep}`;

  const [audioType, setAudioType] = useState('sub'); // 'sub' | 'dub'
  const [showSkipIntro, setShowSkipIntro] = useState(true);
  const [resumeTime, setResumeTime] = useState(0);
  const iframeRef = useRef(null);

  // Load saved progress
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const t = parseInt(saved, 10);
      if (t > 10) setResumeTime(t);
    }
  }, [storageKey]);

  // Save progress every 10s via message from iframe (best-effort)
  // Also save a timestamp via interval as fallback
  useEffect(() => {
    const interval = setInterval(() => {
      // We can't access iframe internals cross-origin, so we track wall-clock time
      // as a rough proxy. Store current session start + elapsed.
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Track wall-clock time as fallback for progress
  const sessionStartRef = useRef(Date.now());
  useEffect(() => {
    sessionStartRef.current = Date.now() + (resumeTime * 1000);
    const save = () => {
      const elapsed = Math.floor((Date.now() - sessionStartRef.current + (resumeTime * 1000)) / 1000);
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

  // Hide skip intro after intro window passes (roughly 90s of watch time)
  useEffect(() => {
    if (!showSkipIntro) return;
    const timer = setTimeout(() => setShowSkipIntro(false), (INTRO_DURATION + 30) * 1000);
    return () => clearTimeout(timer);
  }, [showSkipIntro]);

  // Build embed URL — using vidsrc.me which has better availability
  // sub/dub param supported by some sources
  const getEmbedUrl = () => {
    const base = `https://vidsrc.me/embed/anime`;
    return `${base}?mal=${mal_id}&ep=${ep}&lang=${audioType}`;
  };

  const handleSkipIntro = () => {
    // We store the skip point so next time we note user is past intro
    localStorage.setItem(storageKey, String(INTRO_DURATION));
    setResumeTime(INTRO_DURATION);
    setShowSkipIntro(false);
    // Reload iframe with start time param
    if (iframeRef.current) {
      iframeRef.current.src = getEmbedUrl() + `&t=${INTRO_DURATION}`;
    }
  };

  const handleAudioSwitch = (type) => {
    setAudioType(type);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 md:px-8 py-3 border-b border-zinc-900 flex-shrink-0">
        <Link
          to={`/AnimeDetail?id=${mal_id}`}
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="text-sm text-zinc-400 font-medium truncate max-w-xs md:max-w-md text-center">
          <span className="text-white">{title}</span>
          <span className="text-zinc-600 mx-1.5">·</span>
          Episode {ep}
        </div>
        {/* Sub / Dub toggle */}
        <div className="flex items-center gap-1 bg-zinc-900 rounded-lg p-1 border border-zinc-800">
          <button
            onClick={() => handleAudioSwitch('sub')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              audioType === 'sub'
                ? 'bg-emerald-500 text-black'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Captions className="w-3.5 h-3.5" /> SUB
          </button>
          <button
            onClick={() => handleAudioSwitch('dub')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              audioType === 'dub'
                ? 'bg-emerald-500 text-black'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Mic className="w-3.5 h-3.5" /> DUB
          </button>
        </div>
      </div>

      {/* Video Player */}
      <div className="relative w-full bg-black flex-shrink-0" style={{ paddingTop: 'min(56.25%, 75vh)' }}>
        <iframe
          ref={iframeRef}
          key={`${mal_id}-${ep}-${audioType}`}
          src={getEmbedUrl() + (resumeTime > 10 ? `&t=${resumeTime}` : '')}
          className="absolute inset-0 w-full h-full"
          allowFullScreen
          allow="fullscreen; autoplay; encrypted-media; picture-in-picture"
          frameBorder="0"
          title={`${title} Episode ${ep}`}
        />

        {/* Skip Intro button */}
        {showSkipIntro && (
          <div className="absolute bottom-14 right-4">
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

      {/* Info bar */}
      <div className="px-4 md:px-8 py-4 border-t border-zinc-900">
        <p className="text-white font-semibold">{title}</p>
        <p className="text-zinc-500 text-sm mt-0.5">
          Episode {ep}
          {resumeTime > 10 && (
            <span className="ml-3 text-emerald-500/70 text-xs">
              ● Resuming from {Math.floor(resumeTime / 60)}m {resumeTime % 60}s
            </span>
          )}
        </p>
      </div>
    </div>
  );
}