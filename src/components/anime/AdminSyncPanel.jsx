import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { RefreshCw, CheckCircle, AlertCircle, Loader2, Database } from 'lucide-react';

export default function AdminSyncPanel() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSync = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await base44.functions.invoke('jikanSync', { action: 'sync' });
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
        <Database className="w-5 h-5 text-emerald-400" />
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">S3 — Jikan Sync</h2>
      </div>
      <p className="text-zinc-500 text-xs mb-5">
        Fetches currently airing &amp; seasonal anime from MyAnimeList (Jikan API) and syncs episode counts into the database.
      </p>

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
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
            <CheckCircle className="w-4 h-4" /> Sync complete — {result.total} anime processed
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-zinc-800 rounded-xl p-3 text-center">
              <p className="text-xl font-black text-emerald-400">{result.summary?.created ?? 0}</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">Created</p>
            </div>
            <div className="bg-zinc-800 rounded-xl p-3 text-center">
              <p className="text-xl font-black text-blue-400">{result.summary?.updated ?? 0}</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">Updated</p>
            </div>
            <div className="bg-zinc-800 rounded-xl p-3 text-center">
              <p className="text-xl font-black text-zinc-500">{result.summary?.skipped ?? 0}</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">Skipped</p>
            </div>
          </div>
          {result.errors?.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <p className="text-xs text-red-400 font-semibold mb-1">{result.errors.length} errors:</p>
              {result.errors.slice(0, 5).map((e, i) => (
                <p key={i} className="text-[11px] text-zinc-500">{e.title}: {e.error}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}