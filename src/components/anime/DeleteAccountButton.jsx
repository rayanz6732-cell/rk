import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Trash2 } from 'lucide-react';

export default function DeleteAccountButton() {
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await base44.auth.deleteAccount();
      base44.auth.logout('/');
    } catch {
      setDeleting(false);
      setConfirm(false);
    }
  };

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="flex items-center gap-2 text-xs text-zinc-600 hover:text-red-400 transition-colors select-none"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <Trash2 className="w-3 h-3" /> Delete Account
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-zinc-500">Are you sure?</span>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="text-xs text-red-400 font-semibold hover:text-red-300 transition-colors select-none"
      >
        {deleting ? 'Deleting...' : 'Yes, delete'}
      </button>
      <button
        onClick={() => setConfirm(false)}
        className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors select-none"
      >
        Cancel
      </button>
    </div>
  );
}