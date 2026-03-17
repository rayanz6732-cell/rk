import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Star } from 'lucide-react';

export default function StarRating({ mal_id, animeTitle }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [existingId, setExistingId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.UserRating.filter({ mal_id: String(mal_id) }, '-created_date', 1)
      .then(results => {
        if (results.length > 0) {
          setRating(results[0].rating);
          setExistingId(results[0].id);
        }
      }).catch(() => {});
  }, [mal_id]);

  const handleRate = async (value) => {
    setSaving(true);
    setRating(value);
    if (existingId) {
      await base44.entities.UserRating.update(existingId, { rating: value });
    } else {
      const created = await base44.entities.UserRating.create({
        mal_id: String(mal_id),
        anime_title: animeTitle,
        rating: value,
      });
      setExistingId(created.id);
    }
    setSaving(false);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs text-zinc-500 font-medium">Your Rating</p>
      <div className="flex items-center gap-1">
        {[1,2,3,4,5,6,7,8,9,10].map(i => (
          <button
            key={i}
            onClick={() => handleRate(i)}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            disabled={saving}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`w-5 h-5 transition-colors ${
                i <= (hover || rating)
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-zinc-700'
              }`}
            />
          </button>
        ))}
        {rating > 0 && (
          <span className="ml-2 text-sm font-bold text-yellow-400">{rating}/10</span>
        )}
      </div>
    </div>
  );
}