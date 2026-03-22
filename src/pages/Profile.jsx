import React, { useEffect, useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { BADGES } from '../lib/streakAndBadges';
import { Flame, Tv, Award, User, Clock, Calendar, Edit3, X, Camera, MapPin, Heart, MessageCircle, UserPlus, UserCheck } from 'lucide-react';
import AdminSyncPanel from '../components/anime/AdminSyncPanel';

// ─── Google Fonts ─────────────────────────────────────────────────────────────
if (!document.head.querySelector('link[href*="Syne"]')) {
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500;700&display=swap';
  document.head.appendChild(l);
}

// ─── Themes ───────────────────────────────────────────────────────────────────
const THEMES = [
  {
    id: 'default',
    name: 'Default',
    desc: 'Clean green aesthetic',
    banner: 'linear-gradient(135deg, #0d0d1a 0%, #1a1a2e 50%, #0d0d1a 100%)',
    accent: '#4ade80',
    ring: 'linear-gradient(135deg, #4ade80, #22c55e, #16a34a)',
    colors: { primary: '142 71% 45%', bg: '0 0% 4%' },
  },
  {
    id: 'cherry',
    name: 'Cherry Blossom',
    desc: 'Soft pink tones inspired by sakura',
    banner: 'linear-gradient(135deg, #1a0a1a 0%, #2d0a2a 40%, #1a0d2e 100%)',
    accent: '#f472b6',
    ring: 'linear-gradient(135deg, #f472b6, #ec4899, #a855f7)',
    colors: { primary: '340 82% 52%', bg: '0 0% 4%' },
  },
  {
    id: 'neon',
    name: 'Neon Tokyo',
    desc: 'Electric neon cyberpunk vibes',
    banner: 'linear-gradient(135deg, #0a001a 0%, #1a0033 40%, #001a1a 100%)',
    accent: '#a855f7',
    ring: 'linear-gradient(135deg, #a855f7, #6366f1, #22d3ee)',
    colors: { primary: '280 90% 50%', bg: '0 0% 2%' },
  },
  {
    id: 'aurora',
    name: 'Aurora Borealis',
    desc: 'Northern lights dancing colors',
    banner: 'linear-gradient(135deg, #001a0d 0%, #001a1a 50%, #0a0d1a 100%)',
    accent: '#34d399',
    ring: 'linear-gradient(135deg, #34d399, #06b6d4, #6366f1)',
    colors: { primary: '162 73% 46%', bg: '0 0% 4%' },
  },
];

// ─── Animated Counter ─────────────────────────────────────────────────────────
function useCountUp(target, duration = 1600, active = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active || !target) return;
    let start = null;
    const tick = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(Math.floor((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, active]);
  return val;
}

// ─── Stat Card — fixed proportions ───────────────────────────────────────────
function StatCard({ label, value, accent, active }) {
  const numeric = typeof value === 'number';
  const count = useCountUp(numeric ? value : 0, 1600, active);
  return (
    <div
      style={{
        background: '#13131c',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16,
        // KEY FIX: use aspect-ratio + padding instead of fixed tall height
        padding: '22px 20px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        transition: 'all 0.25s',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 110,   // compact height — was way too tall before
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = accent + '50';
        e.currentTarget.style.background = '#1a1a26';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = `0 8px 30px ${accent}18`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
        e.currentTarget.style.background = '#13131c';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* subtle radial glow in corner */}
      <div style={{ position: 'absolute', top: -20, right: -20, width: 70, height: 70, borderRadius: '50%', background: accent + '0e', pointerEvents: 'none' }} />

      {/* Number — KEY FIX: reduced from 48px to 32px, tighter */}
      <div style={{
        fontFamily: 'Syne, sans-serif',
        fontSize: 32,
        fontWeight: 800,
        color: accent,
        lineHeight: 1,
        letterSpacing: '-0.5px',
      }}>
        {numeric ? count.toLocaleString() : value}
      </div>

      {/* Label — tighter letter spacing, smaller */}
      <div style={{
        fontSize: 10,
        color: '#4a5568',
        fontWeight: 700,
        letterSpacing: 1.8,
        textTransform: 'uppercase',
        fontFamily: 'DM Sans, sans-serif',
        textAlign: 'center',
      }}>
        {label}
      </div>
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({ user, theme, onSave, onClose }) {
  const [form, setForm] = useState({
    full_name:      user?.full_name      || '',
    username:       user?.username       || '',
    bio:            user?.bio            || '',
    location:       user?.location       || '',
    favorite_anime: user?.favorite_anime || '',
    avatar_url:     user?.avatar_url     || '',
    banner_url:     user?.banner_url     || '',
  });
  const avatarRef = useRef();
  const { accent } = theme;

  const readFile = (file, key) => {
    const r = new FileReader();
    r.onload = (e) => setForm(f => ({ ...f, [key]: e.target.result }));
    r.readAsDataURL(file);
  };

  const fields = [
    { key: 'full_name',      label: 'Display Name',   placeholder: 'Your name' },
    { key: 'username',       label: 'Username',        placeholder: 'rayanz' },
    { key: 'bio',            label: 'Bio',             placeholder: 'Tell the community about yourself...', multi: true },
    { key: 'location',       label: 'Location',        placeholder: 'Toronto, Canada' },
    { key: 'favorite_anime', label: 'Favourite Anime', placeholder: 'Attack on Titan' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: '#0d0d17', border: `1px solid ${accent}44`, borderRadius: 22, width: '92%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', boxShadow: `0 32px 80px rgba(0,0,0,0.9), 0 0 60px ${accent}18`, fontFamily: 'DM Sans, sans-serif' }} onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color: '#f1f5f9' }}>Edit Profile</span>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 8, color: '#64748b', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#f87171'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#64748b'; }}>
            <X size={15} />
          </button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: 82, height: 82, borderRadius: '50%', background: accent + '22', border: `3px solid ${accent}66`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {form.avatar_url ? <img src={form.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <User size={30} style={{ color: accent }} />}
              </div>
              <button onClick={() => avatarRef.current.click()} style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.65)', color: '#fff', cursor: 'pointer', opacity: 0, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2, fontSize: 10, fontWeight: 700 }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                <Camera size={16} /><span>Change</span>
              </button>
              <input ref={avatarRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files[0] && readFile(e.target.files[0], 'avatar_url')} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: 1.5 }}>Banner Image</span>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: accent + '15', border: `1px solid ${accent}44`, color: accent, fontSize: 13, fontWeight: 600, cursor: 'pointer', width: 'fit-content' }}>
                <Camera size={13} /> Upload Banner
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files[0] && readFile(e.target.files[0], 'banner_url')} />
              </label>
              {form.banner_url && <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 600 }}>✓ Banner uploaded</span>}
            </div>
          </div>

          {fields.map(({ key, label, placeholder, multi }) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: 1.5 }}>{label}</label>
              {multi
                ? <textarea value={form[key]} placeholder={placeholder} rows={3} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 11, padding: '10px 14px', color: '#e2e8f0', fontSize: 14, fontFamily: 'DM Sans, sans-serif', outline: 'none', resize: 'vertical', width: '100%' }}
                    onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'} />
                : <input value={form[key]} placeholder={placeholder} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 11, padding: '10px 14px', color: '#e2e8f0', fontSize: 14, fontFamily: 'DM Sans, sans-serif', outline: 'none', width: '100%' }}
                    onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'} />
              }
            </div>
          ))}
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Cancel</button>
          <button onClick={() => { onSave(form); onClose(); }} style={{ padding: '9px 22px', borderRadius: 10, background: accent, border: 'none', color: '#000', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', boxShadow: `0 4px 18px ${accent}55` }}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Profile ─────────────────────────────────────────────────────────────
export default function Profile() {
  const [user, setUser]                   = useState(null);
  const [isLoading, setIsLoading]         = useState(true);
  const [activeThemeId, setActiveThemeId] = useState('cherry');
  const [activeTab, setActiveTab]         = useState('badges');
  const [editing, setEditing]             = useState(false);
  const [followed, setFollowed]           = useState(false);
  const [statsActive, setStatsActive]     = useState(false);
  const [localProfile, setLocalProfile]   = useState({});
  const statsRef = useRef();

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        if (me?.theme) setActiveThemeId(me.theme);
      } catch {}
      setIsLoading(false);
    })();
  }, []);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsActive(true); }, { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [isLoading]);

  const theme = THEMES.find(t => t.id === activeThemeId) || THEMES[1];

  useEffect(() => {
    let s = document.getElementById('rk-theme-style');
    if (!s) { s = document.createElement('style'); s.id = 'rk-theme-style'; document.head.appendChild(s); }
    const c = `hsl(${theme.colors.primary})`;
    s.textContent = `
      .text-emerald-400,.text-emerald-500{color:${c}!important}
      .bg-emerald-500{background-color:${c}!important}
      .bg-emerald-500\\/20{background-color:${c}20!important}
      .bg-emerald-500\\/10{background-color:${c}10!important}
      .border-emerald-500{border-color:${c}!important}
      .border-emerald-500\\/30{border-color:${c}30!important}
      .border-emerald-500\\/40{border-color:${c}40!important}
      .border-emerald-500\\/60{border-color:${c}60!important}
      .hover\\:text-emerald-400:hover{color:${c}!important}
      .hover\\:border-emerald-500\\/40:hover{border-color:${c}40!important}
      .hover\\:border-emerald-500\\/60:hover{border-color:${c}60!important}
      .ring-emerald-500{--tw-ring-color:${c}!important}
    `;
  }, [activeThemeId]);

  if (isLoading) return (
    <div style={{ minHeight: '100vh', background: '#07070e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, border: '3px solid rgba(255,255,255,0.07)', borderTopColor: theme.accent, borderRadius: '50%', animation: 'rk-spin 0.8s linear infinite' }} />
    </div>
  );

  const merged         = { ...user, ...localProfile };
  const accent         = theme.accent;
  const earnedBadges   = merged ? BADGES.filter(b =>  (merged.badges || []).includes(b.id)) : [];
  const unearnedBadges = BADGES.filter(b => !earnedBadges.find(e => e.id === b.id));

  const handleSave = async (form) => {
    setLocalProfile(form);
    const payload = { bio: form.bio, avatar_url: form.avatar_url, username: form.username, location: form.location, favorite_anime: form.favorite_anime, banner_url: form.banner_url };
    try { await base44.auth.updateMe(payload); } catch {
      try { await base44.entities.User.updateMe(payload); } catch {}
    }
  };

  const bannerStyle = merged?.banner_url
    ? { backgroundImage: `url(${merged.banner_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: theme.banner };

  const TABS = [
    { id: 'badges', label: '🏆 Badges' },
    { id: 'stats',  label: '📊 Stats'  },
    { id: 'theme',  label: '🎨 Theme'  },
    { id: 'admin',  label: '⚙️ Admin'  },
  ];

  return (
    <>
      <style>{`
        @keyframes rk-spin     { to { transform: rotate(360deg) } }
        @keyframes rk-glow     { 0%,100%{box-shadow:0 0 20px ${accent}55,0 0 50px ${accent}18}50%{box-shadow:0 0 32px ${accent}88,0 0 70px ${accent}28} }
        @keyframes rk-particle { 0%,100%{opacity:.3;transform:translateY(0)}50%{opacity:.8;transform:translateY(-7px)} }
        .rk3 * { box-sizing: border-box; }
        .rk3-glass { background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);border-radius:16px;backdrop-filter:blur(10px);transition:border-color .25s; }
        .rk3-glass:hover { border-color:${accent}30; }
        .rk3-tab  { padding:8px 16px;border:none;border-radius:9px;font-family:'DM Sans',sans-serif;font-size:13px;cursor:pointer;transition:all .2s;white-space:nowrap;font-weight:600; }
        .rk3-badge{ display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:600;cursor:default; }
        .rk3-tc   { border-radius:14px;padding:14px;border:2px solid transparent;cursor:pointer;transition:all .2s;background:rgba(255,255,255,0.025); }
        .rk3-tc:hover { border-color:${accent}44;background:rgba(255,255,255,0.045); }
        @media(max-width:580px){ .rk3-sg{grid-template-columns:repeat(2,1fr)!important} }
      `}</style>

      <div className="rk3" style={{ minHeight: '100vh', background: '#07070e', color: '#e2e8f0', fontFamily: 'DM Sans, sans-serif' }}>

        {/* ── Banner ── */}
        <div style={{ position: 'relative', height: 240, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, ...bannerStyle, transition: 'all 0.5s' }} />
          {!merged?.banner_url && [...Array(9)].map((_, i) => (
            <div key={i} style={{ position: 'absolute', width: i%3===0?3:2, height: i%3===0?3:2, borderRadius: '50%', background: accent, left: `${8+i*10}%`, top: `${18+(i%4)*16}%`, animation: `rk-particle ${2+i*.4}s ease-in-out infinite`, animationDelay: `${i*.22}s`, boxShadow: `0 0 8px ${accent},0 0 16px ${accent}44` }} />
          ))}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(7,7,14,0) 0%,rgba(7,7,14,.35) 55%,rgba(7,7,14,1) 100%)' }} />
          <button onClick={() => setEditing(true)}
            style={{ position: 'absolute', top: 16, right: 16, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: 'rgba(0,0,0,.55)', border: '1px solid rgba(255,255,255,.12)', color: '#e2e8f0', fontSize: 13, fontWeight: 700, cursor: 'pointer', backdropFilter: 'blur(10px)', fontFamily: 'DM Sans, sans-serif', transition: 'all .2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = accent+'28'; e.currentTarget.style.borderColor = accent+'66'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,.55)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.12)'; }}>
            ✏️ Edit Profile
          </button>
        </div>

        {/* ── Avatar + Name ── */}
        <div style={{ padding: '0 28px', marginTop: -58, position: 'relative', zIndex: 10 }}>
          {/* Avatar */}
          <div style={{ width: 116, height: 116, borderRadius: '50%', padding: 3, background: theme.ring, animation: 'rk-glow 3.5s ease-in-out infinite', position: 'relative', display: 'inline-block' }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '3px solid #07070e', overflow: 'hidden', background: '#12121e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {merged?.avatar_url
                ? <img src={merged.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="avatar" />
                : <User size={38} style={{ color: accent }} />}
            </div>
            <div style={{ position: 'absolute', bottom: 8, right: 8, width: 14, height: 14, borderRadius: '50%', background: '#22c55e', border: '3px solid #07070e', boxShadow: '0 0 8px #22c55e,0 0 18px #22c55e44' }} />
          </div>

          {/* Name block */}
          <div style={{ marginTop: 14 }}>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1.1, margin: 0 }}>
              {merged?.full_name || 'Anime Fan'}
            </h1>
            {merged?.username
              ? <div style={{ fontSize: 15, color: accent, fontWeight: 700, marginTop: 4 }}>@{merged.username}</div>
              : merged?.email && <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>{merged.email}</div>
            }
            {merged?.bio && <p style={{ fontSize: 13, color: '#64748b', marginTop: 8, lineHeight: 1.6, maxWidth: 480 }}>{merged.bio}</p>}
            {merged?.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 12, color: '#475569' }}>
                <MapPin size={12} style={{ color: accent }} /> {merged.location}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
            <button
              onClick={() => setFollowed(f => !f)}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 24px', borderRadius: 12, background: followed ? 'rgba(255,255,255,0.05)' : accent, border: followed ? `1px solid ${accent}44` : 'none', color: followed ? accent : '#000', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'Syne, sans-serif', boxShadow: followed ? 'none' : `0 4px 20px ${accent}44`, transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              {followed ? <UserCheck size={15} /> : <UserPlus size={15} />}
              {followed ? 'Following' : '+ Follow'}
            </button>
            <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 22px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              <MessageCircle size={15} /> Message
            </button>
          </div>
        </div>

        {/* ── STATS — 2×2 grid, compact & balanced ── */}
        {/*
          Base44 schema field mapping:
            total_episodes_watched → stat value
            total_watch_minutes    → converted to hours
            watch_streak           → day streak
        */}
        <div
          className="rk3-sg"
          ref={statsRef}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, padding: '26px 28px 0' }}
        >
          <StatCard label="Episodes Watched" value={merged?.total_episodes_watched || 0}  accent={accent} active={statsActive} />
          <StatCard label="Watch Time"        value={merged?.total_watch_minutes ? `${Math.round(merged.total_watch_minutes / 60)}h` : '0h'} accent={accent} active={statsActive} />
          <StatCard label="Day Streak"        value={merged?.watch_streak || 0}            accent={accent} active={statsActive} />
          <StatCard label="Badges Earned"     value={earnedBadges.length}                  accent={accent} active={statsActive} />
        </div>

        {/* ── Tabs ── */}
        <div style={{ padding: '26px 28px 0' }}>
          <div style={{ display: 'flex', gap: 3, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 4, width: 'fit-content' }}>
            {TABS.map(tab => (
              <button key={tab.id} className="rk3-tab" onClick={() => setActiveTab(tab.id)}
                style={{ background: activeTab===tab.id ? accent : 'transparent', color: activeTab===tab.id ? '#000' : '#4a5568', boxShadow: activeTab===tab.id ? `0 2px 12px ${accent}44` : 'none', fontWeight: activeTab===tab.id ? 800 : 600 }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab Panels ── */}
        <div style={{ padding: '18px 28px 52px' }}>

          {/* Badges */}
          {activeTab === 'badges' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {earnedBadges.length > 0 && (
                <div className="rk3-glass" style={{ padding: 18 }}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 10, fontWeight: 700, color: accent, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Earned ({earnedBadges.length})</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {earnedBadges.map(b => <div key={b.id} className="rk3-badge" style={{ background: accent+'18', border: `1px solid ${accent}44`, color: accent }}>{b.icon||'🏅'} {b.name}</div>)}
                  </div>
                </div>
              )}
              {unearnedBadges.length > 0 && (
                <div className="rk3-glass" style={{ padding: 18 }}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 10, fontWeight: 700, color: '#2d3748', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Locked ({unearnedBadges.length})</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {unearnedBadges.map(b => <div key={b.id} className="rk3-badge" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', color: '#2d3748', filter: 'grayscale(1)' }}>{b.icon||'🔒'} {b.name}</div>)}
                  </div>
                </div>
              )}
              {!earnedBadges.length && !unearnedBadges.length && (
                <div className="rk3-glass" style={{ padding: 30, textAlign: 'center', color: '#2d3748' }}>No badges yet — start watching to earn some! 🎌</div>
              )}
            </div>
          )}

          {/* Stats */}
          {activeTab === 'stats' && (
            <div className="rk3-glass" style={{ padding: 22 }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 10, fontWeight: 700, color: accent, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 18 }}>Watching Stats</div>
              {[
                { label: 'Episodes Completed', value: merged?.total_episodes_watched || 0,                                                    icon: '✅' },
                { label: 'Total Watch Time',   value: merged?.total_watch_minutes ? `${Math.round(merged.total_watch_minutes/60)}h` : '0h',   icon: '⏱️' },
                { label: 'Current Streak',     value: `${merged?.watch_streak||0} days`,                                                      icon: '🔥' },
                { label: 'Badges Earned',      value: earnedBadges.length,                                                                    icon: '🏅' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', borderBottom: i<3 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontSize: 17 }}>{item.icon}</span><span style={{ fontSize: 14, color: '#64748b' }}>{item.label}</span></div>
                  <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 800, color: accent }}>{item.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Theme */}
          {activeTab === 'theme' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 10, fontWeight: 700, color: accent, letterSpacing: 2, textTransform: 'uppercase' }}>Choose Your Theme</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
                {THEMES.map(t => (
                  <div key={t.id} className="rk3-tc"
                    onClick={async () => {
                      setActiveThemeId(t.id);
                      try { await base44.auth.updateMe({ theme: t.id }); } catch {
                        try { await base44.entities.User.updateMe({ theme: t.id }); } catch {}
                      }
                    }}
                    style={{ borderColor: activeThemeId===t.id ? t.accent : 'transparent', background: activeThemeId===t.id ? t.accent+'10' : 'rgba(255,255,255,0.025)' }}>
                    <div style={{ height: 44, borderRadius: 9, marginBottom: 9, background: t.banner }} />
                    <div style={{ height: 4, borderRadius: 2, marginBottom: 9, background: t.ring, width: '50%' }} />
                    <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 800, color: '#f1f5f9' }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: '#4a5568', marginTop: 2 }}>{t.desc}</div>
                    {activeThemeId===t.id && <div style={{ marginTop: 7, fontSize: 11, fontWeight: 700, color: t.accent }}>✓ Active</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admin */}
          {activeTab === 'admin' && (
            <div className="rk3-glass" style={{ padding: 22 }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 10, fontWeight: 700, color: accent, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>Admin Panel</div>
              <AdminSyncPanel />
            </div>
          )}
        </div>

        {editing && <EditModal user={merged} theme={theme} onSave={handleSave} onClose={() => setEditing(false)} />}
      </div>
    </>
  );
}
