import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Watch() {
  const urlParams = new URLSearchParams(window.location.search);
  const mal_id = urlParams.get('id');
  const ep = urlParams.get('ep') || '1';
  const title = urlParams.get('title') || 'Episode ' + ep;

  // vidsrc.xyz supports MAL IDs via embed
  const embedUrl = `https://vidsrc.xyz/embed/anime?mal=${mal_id}&ep=${ep}`;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 md:px-8 py-4 border-b border-zinc-900">
        <Link
          to={`/AnimeDetail?id=${mal_id}`}
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Details
        </Link>
        <div className="text-sm text-zinc-400 font-medium truncate max-w-xs md:max-w-md text-right">
          {decodeURIComponent(title)} — Episode {ep}
        </div>
      </div>

      {/* Video Player */}
      <div className="w-full bg-black" style={{ aspectRatio: '16/9', maxHeight: '75vh' }}>
        <iframe
          src={embedUrl}
          className="w-full h-full"
          style={{ height: 'min(75vh, calc(100vw * 9 / 16))' }}
          allowFullScreen
          allow="fullscreen; autoplay"
          frameBorder="0"
          title={`Watch ${decodeURIComponent(title)} Episode ${ep}`}
        />
      </div>

      {/* Info bar */}
      <div className="px-4 md:px-8 py-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-900">
        <div>
          <p className="text-white font-semibold">{decodeURIComponent(title)}</p>
          <p className="text-zinc-500 text-sm">Episode {ep}</p>
        </div>
        <a
          href={`https://animekai.to/search?keyword=${title}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="outline" className="border-zinc-700 text-zinc-400 hover:text-white gap-2 text-sm">
            <ExternalLink className="w-3.5 h-3.5" /> Watch on AnimeKai
          </Button>
        </a>
      </div>
    </div>
  );
}