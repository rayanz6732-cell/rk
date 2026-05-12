import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { UserRatings } from '@/lib/db';

export default function StarRating({ mal_id, animeTitle }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      UserRatings.getForAnime(mal_id, user.id).then(existing => {
        if (existing?.rating) setRating(existing.rating);
      });
    });
  }, [mal_id]);

  const handleRate = async (val) => {
    if (!userId || saving) return;
    setSaving(true);
    setRating(val);
    await UserRatings.upsert({ mal_id: String(mal_id), anime_title: animeTitle, rating: val, user_id: userId });
    setSaving(false);
  };

  return (
    <div className="flex items-center gap-2 mt-3">
      <span className="text-xs text-zinc-500 font-medium">Your Rating:</span>
      <div className="flex items-center gap-0.5">
        {[1,2,3,4,5,6,7,8,9,10].map(i => (
          <button
            key={i}
            disabled={saving}
            onClick={() => handleRate(i)}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform hover:scale-110 disabled:opacity-50"
          >
            <Star
              className={`w-4 h-4 ${i <= (hover || rating) ? 'text-yellow-500 fill-yellow-500' : 'text-zinc-700'}`}
            />
          </button>
        ))}
      </div>
      {rating > 0 && <span className="text-xs text-zinc-500">{rating}/10</span>}
    </div>
  );
}