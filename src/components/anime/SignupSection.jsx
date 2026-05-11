import React from 'react';
import { base44 } from '@/api/base44Client';

export default function SignupSection() {
  const handleSignUp = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <div className="mb-12 bg-gradient-to-r from-emerald-600/20 to-emerald-500/10 border border-emerald-500/30 rounded-2xl p-8 md:p-12">
      <div className="max-w-2xl">
        <h2 className="text-3xl font-black text-white mb-2">Join RKAnime</h2>
        <p className="text-zinc-400 mb-6">Be part of the ultimate anime community. Get personalized recommendations, track your watch list, and connect with fellow anime fans.</p>
        <button
          onClick={handleSignUp}
          className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg transition-colors"
        >
          Sign Up / Sign In
        </button>
      </div>
    </div>
  );
}