import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CommentsSection({ mal_id, episode }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    const data = await base44.entities.Comment.filter({ anime_id: String(mal_id) }, '-created_date', 50);
    setComments(data);
  };

  useEffect(() => {
    fetchComments();
    const unsub = base44.entities.Comment.subscribe((event) => {
      if (event.data?.anime_id === String(mal_id)) {
        fetchComments();
      }
    });
    return () => unsub();
  }, [mal_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    await base44.entities.Comment.create({
      anime_id: String(mal_id),
      episode: String(episode),
      text: text.trim(),
      author_name: name.trim() || 'Anonymous',
    });
    setText('');
    setSubmitting(false);
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="mt-8 border-t border-zinc-900 pt-6">
      <div className="flex items-center gap-2 mb-5">
        <MessageCircle className="w-4 h-4 text-emerald-500" />
        <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">
          Comments <span className="text-zinc-600 font-normal normal-case">({comments.length})</span>
        </h3>
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="mb-6 space-y-2">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your name (optional)"
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
        />
        <div className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Write a comment or review..."
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
          <Button
            type="submit"
            disabled={submitting || !text.trim()}
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl px-4 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>

      {/* Comments list */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-zinc-600 text-sm text-center py-6">No comments yet. Be the first!</p>
        ) : (
          comments.map(c => (
            <div key={c.id} className="bg-zinc-900/60 border border-zinc-800/50 rounded-xl px-4 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-semibold text-emerald-400">{c.author_name || 'Anonymous'}</span>
                <div className="flex items-center gap-2">
                  {c.episode && (
                    <span className="text-[10px] text-zinc-600 bg-zinc-800 rounded px-1.5 py-0.5">Ep {c.episode}</span>
                  )}
                  <span className="text-[11px] text-zinc-600">{formatTime(c.created_date)}</span>
                </div>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">{c.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}