import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { RefreshCw, CheckCircle, AlertCircle, Loader2, Database, Tv } from 'lucide-react';

function SyncResultStats({ summary, errors, total }) {
  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
        <CheckCircle className="w-4 h-4" /> Sync complete — {total} anime processed
      </div>
      <div className="grid grid-cols-3 gap-3">
        {summary?.created !== undefined && (
          <div className="bg-zinc-800 rounded-xl p-3 text-center">
            <p className="text-xl font-black text-emerald-400">{summary.created ?? 0}</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">Created</p>
          </div>
        )}
        <div className="bg-zinc-800 rounded-xl p-3 text-center">
          <p className="text-xl font-black text-blue-400">{summary?.updated ?? 0}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Updated</p>
        </div>
        <div className="bg-zinc-800 rounded-xl p-3 text-center">
          <p className="text-xl font-black text-zinc-500">{summary?.skipped ?? 0}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Skipped</p>
        </div>
      </div>
      {errors?.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
          <p className="text-xs text-red-400 font-semibold mb-1">{errors.length} errors:</p>
          {errors.slice(0, 5).map((e, i) => (
            <p key={i} className="text-[11px] text-zinc-500">{e.title}: {e.error}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function SyncPanel({ icon: Icon, label, description, onSync }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSync = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await onSync();
      setResult(res.data);
    } catch (err) {
      setError(err.message || 'Sync failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <Icon className="w-5 h-5 text-emerald-400" />
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">{label}</h2>
      </div>
      <p className="text-zinc-500 text-xs mb-5">{description}</p>

      <button
        onClick={handleSync}
        disabled={loading}
        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 text-black font-bold rounded-xl text-sm transition-colors"
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Syncing…</>
          : <><RefreshCw className="w-4 h-4" /> Sync Now</>
        }
      </button>

      {error && (
        <div className="mt-4 flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {result && (
        <SyncResultStats
          summary={result.summary}
          errors={result.errors}
          total={result.total}
        />
      )}
    </div>
  );
}

export default function AdminSyncPanel() {
  return (
    <div className="space-y-4">
      <SyncPanel
        icon={Database}
        label="Jikan Sync (MAL)"
        description="Fetches currently airing & seasonal anime from MyAnimeList (Jikan API) and syncs episode counts into the database."
        onSync={() => base44.functions.invoke('jikanSync', { action: 'sync' })}
      />
      <SyncPanel
        icon={Tv}
        label="HiAnime Sync (Episode Scraper)"
        description="Scrapes HiAnime.to for the latest episode counts on all ongoing anime in the database. More accurate for sub episode numbers."
        onSync={() => base44.functions.invoke('hianimeSync', {})}
      />
    </div>
  );
}