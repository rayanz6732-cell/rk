import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function SignupSection() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      await base44.users.inviteUser(email, 'user');
      setMessage('✓ Account created! Check your email to log in.');
      setEmail('');
    } catch (error) {
      setMessage('Error: ' + (error.message || 'Failed to create account'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-12 bg-gradient-to-r from-emerald-600/20 to-emerald-500/10 border border-emerald-500/30 rounded-2xl p-8 md:p-12">
      <div className="max-w-2xl">
        <h2 className="text-3xl font-black text-white mb-2">Join RKAnime</h2>
        <p className="text-zinc-400 mb-6">Be part of the ultimate anime community. Get personalized recommendations, track your watch list, and connect with fellow anime fans.</p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
            required
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 text-black font-bold rounded-lg transition-colors flex-shrink-0 flex items-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? 'Creating...' : 'Sign Up'}
          </button>
        </form>
        {message && (
          <p className={`mt-3 text-sm ${message.startsWith('✓') ? 'text-emerald-400' : 'text-red-400'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}