import React, { useEffect, useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { BADGES } from '../lib/streakAndBadges';
import { Flame, Tv, Award, User, Clock, Edit3, X, Camera, MapPin, Heart, MessageCircle, UserPlus, UserCheck, Zap, Star } from 'lucide-react';
import AdminSyncPanel from '../components/anime/AdminSyncPanel';

// ─── Fonts ────────────────────────────────────────────────────────────────────
if (!document.head.querySelector('link[href*="Plus+Jakarta"]')) {
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Bebas+Neue&display=swap';
  document.head.appendChild(l);
}

// ─── Themes ───────────────────────────────────────────────────────────────────
const THEMES = [
  {
    id: 'cherry',
    name: 'Cherry Blossom',
    desc: 'Soft pink sakura tones',
    banner: 'linear-gradient(135deg,#1a0a1a 0%,#2d0a2a 40%,#1a0d2e 100%)',
    accent: '#f472b6',
    accent2: '#a855f7',
    ring: 'linear-gradient(135deg,#f472b6,#ec4899,#a855f7)',
    cardGrads: [
      'linear-gradient(135deg,#2d0a2a 0%,#1a0a1a 100%)',
      'linear-gradient(135deg,#1a0d2e 0%,#0d0a1a 100%)',
      'linear-gradient(135deg,#2a0a1a 0%,#1a0a2d 100%)',
      'linear-gradient(135deg,#0d0a2a 0%,#1a0a1a 100%)',
    ],
    colors: { primary: '340 82% 52%', bg: '0 0% 4%' },
  },
  {
    id: 'neon',
    name: 'Neon Tokyo',
    desc: 'Electric cyberpunk vibes',
    banner: 'linear-gradient(135deg,#0a001a 0%,#1a0033 40%,#001a1a 100%)',
    accent: '#a855f7',
    accent2: '#22d3ee',
    ring: 'linear-gradient(135deg,#a855f7,#6366f1,#22d3ee)',
    cardGrads: [
      'linear-gradient(135deg,#1a0033 0%,#0a001a 100%)',
      'linear-gradient(135deg,#001a1a 0%,#001a33 100%)',
      'linear-gradient(135deg,#0a0033 0%,#001a1a 100%)',
      'linear-gradient(135deg,#001a33 0%,#0a001a 100%)',
    ],
    colors: { primary: '280 90% 50%', bg: '0 0% 2%' },
  },
  {
    id: 'aurora',
    name: 'Aurora Borealis',
    desc: 'Northern lights colors',
    banner: 'linear-gradient(135deg,#001a0d 0%,#001a1a 50%,#0a0d1a 100%)',
    accent: '#34d399',
    accent2: '#06b6d4',
    ring: 'linear-gradient(135deg,#34d399,#06b6d4,#6366f1)',
    cardGrads: [
      'linear-gradient(135deg,#001a0d 0%,#001a1a 100%)',
      'linear-gradient(135deg,#001a1a 0%,#0a0d1a 100%)',
      'linear-gradient(135deg,#001a0d 0%,#0a0d1a 100%)',
      'linear-gradient(135deg,#0a0d1a 0%,#001a0d 100%)',
    ],
    colors: { primary: '162 73% 46%', bg: '0 0% 4%' },
  },
  {
    id: 'default',
    name: 'Default',
    desc: 'Clean green aesthetic',
    banner: 'linear-gradient(135deg,#0d0d1a 0%,#1a1a2e 50%,#0d0d1a 100%)',
    accent: '#4ade80',
    accent2: '#22c55e',
    ring: 'linear-gradient(135deg,#4ade80,#22c55e,#16a34a)',
    cardGrads: [
      'linear-gradient(135deg,#0d1a0d 0%,#0d0d1a 100%)',
      'linear-gradient(135deg,#0d0d1a 0%,#0d1a0d 100%)',
      'linear-gradient(135deg,#0a1a0d 0%,#0d0d1a 100%)',
      'linear-gradient(135deg,#0d0d1a 0%,#0a1a0d 100%)',
    ],
    colors: { primary: '142 71% 45%', bg: '0 0% 4%' },
  },
];

// ─── Animated Counter ─────────────────────────────────────────────────────────
function useCountUp(target, duration = 1500, active = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active || !target) return;
    let start = null;
    const tick = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(Math.floor((1 - Math.pow(1 - p, 4)) * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, active]);
  return val;
}

// ─── Stat Card — redesigned with proper proportions ──────────────────────────
function StatCard({ label, value, icon: Icon, accent, accent2, gradBg, active, delay = 0 }) {
  const numeric = typeof value === 'number';
  const count = useCountUp(numeric ? value : 0, 1400, active);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (active) setTimeout(() => setVisible(true), delay);
  }, [active]);

  return (
    <div style={{
      background: gradBg,
      border: `1px solid ${accent}22`,
      borderRadius: 18,
      padding: '20px 22px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      cursor: 'default',
      position: 'relative',
      overflow: 'hidden',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.97)',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.border = `1px solid ${accent}55`;
        e.currentTarget.style.transform = 'translateY(-3px) scale(1.01)';
        e.currentTarget.style.boxShadow = `0 12px 36px ${accent}18, inset 0 1px 0 ${accent}22`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.border = `1px solid ${accent}22`;
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Background glow blob */}
      <div style={{
        position: 'absolute', top: -24, right: -24,
        width: 90, height: 90, borderRadius: '50%',
        background: `radial-gradient(circle, ${accent}18 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Icon pill */}
      <div style={{
        width: 44, height: 44, borderRadius: 14, flexShrink: 0,
        background: `linear-gradient(135deg, ${accent}25, ${accent2}18)`,
        border: `1px solid ${accent}33`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={19} style={{ color: accent }} />
      </div>

      {/* Text */}
      <div>
        <div style={{
          fontFamily: 'Bebas Neue, sans-serif',
          fontSize: 30,
          color: '#ffffff',
          lineHeight: 1,
          letterSpacing: '0.5px',
        }}>
          {numeric ? count.toLocaleString() : value}
        </div>
        <div style={{
          fontSize: 11,
          color: accent,
          fontWeight: 700,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          marginTop: 3,
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          opacity: 0.8,
        }}>
          {label}
        </div>
      </div>
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({ user, theme, onSave, onClose }) {
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    username: user?.username || '',
    bio: user?.bio || '',
    location: user?.location || '',
    favorite_anime: user?.favorite_anime || '',
    avatar_url: user?.avatar_url || '',
    banner_url: user?.banner_url || '',
  });
  const avatarRef = useRef();
  const { accent } = theme;

  const readFile = (file, key) => {
    const r = new FileReader();
    r.onload = (e) => setForm(f => ({ ...f, [key]: e.target.result }));
    r.readAsDataURL(file);
  };

  const fields = [
    { key: 'full_name', label: 'Display Name', placeholder: 'Your name' },
    { key: 'username', label: 'Username', placeholder: 'rayanz' },
    { key: 'bio', label: 'Bio', placeholder: 'Tell the community about yourself...', multi: true },
    { key: 'location', label: 'Location', placeholder: 'Toronto, Canada' },
    { key: 'favorite_anime', label: 'Favourite Anime', placeholder: 'Attack on Titan' },
  ];

  const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 11,
    padding: '10px 14px',
    color: '#e2e8f0',
    fontSize: 14,
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    outline: 'none',
    width: '100%',
    transition: 'border-color 0.2s',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: '#0c0c15', border: `1px solid ${accent}33`, borderRadius: 22, width: '92%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', boxShadow: `0 40px 100px rgba(0,0,0,0.95), 0 0 80px ${accent}15`, fontFamily: 'Plus Jakarta Sans, sans-serif' }} onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 18, fontWeight: 800, color: '#f1f5f9' }}>Edit Profile</span>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 8, color: '#64748b', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#f87171'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#64748b'; }}>
            <X size={15} />
          </button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Avatar + banner row */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: accent + '22', border: `3px solid ${accent}55`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {form.avatar_url ? <img src={form.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <User size={28} style={{ color: accent }} />}
              </div>
              <button onClick={() => avatarRef.current.click()} style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.65)', color: '#fff', cursor: 'pointer', opacity: 0, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2, fontSize: 10, fontWeight: 700 }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                <Camera size={16} /><span>Change</span>
              </button>
              <input ref={avatarRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files[0] && readFile(e.target.files[0], 'avatar_url')} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: 1.2 }}>Banner</span>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: accent + '15', border: `1px solid ${accent}33`, color: accent, fontSize: 12, fontWeight: 700, cursor: 'pointer', width: 'fit-content' }}>
                <Camera size={12} /> Upload Banner
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files[0] && readFile(e.target.files[0], 'banner_url')} />
              </label>
              {form.banner_url && <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 600 }}>✓ Uploaded</span>}
            </div>
          </div>

          {fields.map(({ key, label, placeholder, multi }) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: 1.2 }}>{label}</label>
              {multi
                ? <textarea value={form[key]} placeholder={placeholder} rows={3} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }}
                    onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'} />
                : <input value={form[key]} placeholder={placeholder} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={inputStyle}
                    onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'} />
              }
            </div>
          ))}
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Cancel</button>
          <button onClick={() => { onSave(form); onClose(); }} style={{ padding: '9px 22px', borderRadius: 10, background: `linear-gradient(135deg, ${accent}, ${theme.accent2})`, border: 'none', color: '#000', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif', boxShadow: `0 4px 20px ${accent}44` }}>Save Changes</button>
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
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsActive(true); }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [isLoading]);

  const theme = THEMES.find(t => t.id === activeThemeId) || THEMES[0];
  const { accent, accent2 } = theme;

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
    <div style={{ minHeight: '100vh', background: '#06060d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, border: '3px solid rgba(255,255,255,0.07)', borderTopColor: accent, borderRadius: '50%', animation: 'rkSpin 0.8s linear infinite' }} />
    </div>
  );

  const merged         = { ...user, ...localProfile };
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

  // Stat card definitions
  const stats = [
    { label: 'Episodes Watched', value: merged?.total_episodes_watched || 0,  icon: Tv,    grad: theme.cardGrads[0], delay: 0   },
    { label: 'Watch Time',       value: merged?.total_watch_minutes ? `${Math.round(merged.total_watch_minutes / 60)}h` : '0h', icon: Clock, grad: theme.cardGrads[1], delay: 80  },
    { label: 'Day Streak',       value: merged?.watch_streak || 0,             icon: Flame, grad: theme.cardGrads[2], delay: 160 },
    { label: 'Badges Earned',    value: earnedBadges.length,                   icon: Award, grad: theme.cardGrads[3], delay: 240 },
  ];

  const TABS = [
    { id: 'badges', label: '🏆 Badges' },
    { id: 'stats',  label: '📊 Stats'  },
    { id: 'theme',  label: '🎨 Theme'  },
    { id: 'admin',  label: '⚙️ Admin'  },
  ];

  return (
    <>
      <style>{`
        @keyframes rkSpin   { to{transform:rotate(360deg)} }
        @keyframes rkGlow   { 0%,100%{box-shadow:0 0 22px ${accent}55,0 0 55px ${accent}1a}50%{box-shadow:0 0 38px ${accent}88,0 0 80px ${accent}2a} }
        @keyframes rkFloat  { 0%,100%{opacity:.25;transform:translateY(0) scale(1)}50%{opacity:.7;transform:translateY(-9px) scale(1.1)} }
        @keyframes rkShimmer{ 0%{background-position:200% center}100%{background-position:-200% center} }
        .rk4 *{box-sizing:border-box}
        .rk4-glass{
          background:rgba(255,255,255,0.025);
          border:1px solid rgba(255,255,255,0.07);
          border-radius:18px;
          backdrop-filter:blur(14px);
          transition:border-color .3s;
        }
        .rk4-glass:hover{border-color:${accent}28}
        .rk4-tab{
          padding:8px 15px;border:none;border-radius:9px;
          font-family:'Plus Jakarta Sans',sans-serif;
          font-size:12px;cursor:pointer;transition:all .2s;
          white-space:nowrap;font-weight:700;
        }
        .rk4-tc{
          border-radius:14px;padding:14px;
          border:2px solid transparent;cursor:pointer;
          transition:all .25s;background:rgba(255,255,255,0.025);
        }
        .rk4-tc:hover{border-color:${accent}44;background:rgba(255,255,255,0.04)}
        .rk4-badge{
          display:inline-flex;align-items:center;gap:5px;
          padding:5px 11px;border-radius:20px;
          font-size:12px;font-weight:600;cursor:default;
          font-family:'Plus Jakarta Sans',sans-serif;
        }
        @media(max-width:580px){
          .rk4-statgrid{grid-template-columns:1fr!important}
        }
      `}</style>

      <div className="rk4" style={{ minHeight: '100vh', background: '#06060d', color: '#e2e8f0', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>

        {/* ── Banner ── */}
        <div style={{ position: 'relative', height: 220, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, ...bannerStyle, transition: 'all 0.5s' }} />
          {!merged?.banner_url && [...Array(12)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              width: i % 4 === 0 ? 4 : i % 3 === 0 ? 3 : 2,
              height: i % 4 === 0 ? 4 : i % 3 === 0 ? 3 : 2,
              borderRadius: '50%',
              background: i % 2 === 0 ? accent : accent2,
              left: `${5 + i * 8}%`,
              top: `${12 + (i % 5) * 16}%`,
              animation: `rkFloat ${2 + i * 0.3}s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`,
              boxShadow: `0 0 10px ${i % 2 === 0 ? accent : accent2}, 0 0 20px ${i % 2 === 0 ? accent : accent2}44`,
            }} />
          ))}
          {/* fade bottom */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,transparent 0%,rgba(6,6,13,0.5) 60%,#06060d 100%)' }} />
          {/* edit btn */}
          <button onClick={() => setEditing(true)}
            style={{ position: 'absolute', top: 14, right: 14, display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, background: 'rgba(0,0,0,.6)', border: '1px solid rgba(255,255,255,.1)', color: '#cbd5e1', fontSize: 12, fontWeight: 700, cursor: 'pointer', backdropFilter: 'blur(10px)', fontFamily: 'Plus Jakarta Sans, sans-serif', transition: 'all .2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = accent + '28'; e.currentTarget.style.borderColor = accent + '55'; e.currentTarget.style.color = accent; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,.6)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.1)'; e.currentTarget.style.color = '#cbd5e1'; }}>
            <Edit3 size={12} /> Edit Profile
          </button>
        </div>

        {/* ── Avatar + Identity ── */}
        <div style={{ padding: '0 24px', marginTop: -56, position: 'relative', zIndex: 10 }}>
          {/* glowing ring avatar */}
          <div style={{ width: 110, height: 110, borderRadius: '50%', padding: 3, background: theme.ring, animation: 'rkGlow 3.5s ease-in-out infinite', position: 'relative', display: 'inline-block' }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '3px solid #06060d', overflow: 'hidden', background: '#111120', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {merged?.avatar_url
                ? <img src={merged.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="avatar" />
                : <User size={36} style={{ color: accent }} />}
            </div>
            {/* online pip */}
            <div style={{ position: 'absolute', bottom: 7, right: 7, width: 13, height: 13, borderRadius: '50%', background: '#22c55e', border: '2px solid #06060d', boxShadow: '0 0 8px #22c55e88' }} />
          </div>

          {/* name */}
          <div style={{ marginTop: 13 }}>
            <h1 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1.1, margin: 0 }}>
              {merged?.full_name || 'Anime Fan'}
            </h1>
            {/* username with gradient shimmer */}
            {merged?.username
              ? <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4, background: `linear-gradient(90deg, ${accent}, ${accent2}, ${accent})`, backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'rkShimmer 3s linear infinite' }}>
                  @{merged.username}
                </div>
              : merged?.email && <div style={{ fontSize: 13, color: '#334155', marginTop: 4 }}>{merged.email}</div>
            }
            {merged?.bio && <p style={{ fontSize: 13, color: '#475569', marginTop: 8, lineHeight: 1.65, maxWidth: 460 }}>{merged.bio}</p>}
            {(merged?.location || merged?.favorite_anime) && (
              <div style={{ display: 'flex', gap: 14, marginTop: 7, flexWrap: 'wrap' }}>
                {merged.location && <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#334155' }}><MapPin size={11} style={{ color: accent }} />{merged.location}</div>}
                {merged.favorite_anime && <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#334155' }}><Heart size={11} style={{ color: accent }} />{merged.favorite_anime}</div>}
              </div>
            )}
          </div>

          {/* action buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            <button
              onClick={() => setFollowed(f => !f)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '9px 22px', borderRadius: 11,
                background: followed ? 'rgba(255,255,255,0.04)' : `linear-gradient(135deg, ${accent}, ${accent2})`,
                border: followed ? `1px solid ${accent}33` : 'none',
                color: followed ? accent : '#000',
                fontSize: 13, fontWeight: 800, cursor: 'pointer',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                boxShadow: followed ? 'none' : `0 4px 20px ${accent}44`,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              {followed ? <UserCheck size={14} /> : <UserPlus size={14} />}
              {followed ? 'Following' : '+ Follow'}
            </button>
            <button
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 20px', borderRadius: 11, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: '#94a3b8', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              <MessageCircle size={14} /> Message
            </button>
          </div>
        </div>

        {/* ── STAT CARDS ── */}
        {/*
          Base44 field mapping:
          total_episodes_watched → Episodes Watched
          total_watch_minutes    → Watch Time (÷60h)
          watch_streak           → Day Streak
        */}
        <div
          className="rk4-statgrid"
          ref={statsRef}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, padding: '24px 24px 0' }}
        >
          {stats.map((s, i) => (
            <StatCard
              key={i}
              label={s.label}
              value={s.value}
              icon={s.icon}
              accent={accent}
              accent2={accent2}
              gradBg={s.grad}
              active={statsActive}
              delay={s.delay}
            />
          ))}
        </div>

        {/* ── Tabs ── */}
        <div style={{ padding: '24px 24px 0' }}>
          <div style={{ display: 'flex', gap: 3, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '4px', width: 'fit-content' }}>
            {TABS.map(tab => (
              <button key={tab.id} className="rk4-tab" onClick={() => setActiveTab(tab.id)}
                style={{
                  background: activeTab === tab.id ? `linear-gradient(135deg,${accent},${accent2})` : 'transparent',
                  color: activeTab === tab.id ? '#000' : '#334155',
                  boxShadow: activeTab === tab.id ? `0 2px 14px ${accent}44` : 'none',
                }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab Content ── */}
        <div style={{ padding: '18px 24px 52px' }}>

          {/* Badges */}
          {activeTab === 'badges' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {earnedBadges.length > 0 && (
                <div className="rk4-glass" style={{ padding: 18 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: accent, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Earned — {earnedBadges.length}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {earnedBadges.map(b => <div key={b.id} className="rk4-badge" style={{ background: accent + '18', border: `1px solid ${accent}33`, color: accent }}>{b.icon || '🏅'} {b.name}</div>)}
                  </div>
                </div>
              )}
              {unearnedBadges.length > 0 && (
                <div className="rk4-glass" style={{ padding: 18 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#1e293b', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Locked — {unearnedBadges.length}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {unearnedBadges.map(b => <div key={b.id} className="rk4-badge" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: '#1e293b', filter: 'grayscale(1)' }}>{b.icon || '🔒'} {b.name}</div>)}
                  </div>
                </div>
              )}
              {!earnedBadges.length && !unearnedBadges.length && (
                <div className="rk4-glass" style={{ padding: 32, textAlign: 'center', color: '#1e293b', fontSize: 14 }}>Start watching to earn badges! 🎌</div>
              )}
            </div>
          )}

          {/* Stats */}
          {activeTab === 'stats' && (
            <div className="rk4-glass" style={{ padding: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: accent, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>Watching Stats</div>
              {[
                { label: 'Episodes Completed', value: merged?.total_episodes_watched || 0,                                                    icon: '✅' },
                { label: 'Total Watch Time',   value: merged?.total_watch_minutes ? `${Math.round(merged.total_watch_minutes / 60)}h` : '0h', icon: '⏱️' },
                { label: 'Current Streak',     value: `${merged?.watch_streak || 0} days`,                                                    icon: '🔥' },
                { label: 'Badges Earned',      value: earnedBadges.length,                                                                    icon: '🏅' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><span style={{ fontSize: 16 }}>{item.icon}</span><span style={{ fontSize: 13, color: '#475569' }}>{item.label}</span></div>
                  <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 20, color: accent, letterSpacing: '0.5px' }}>{item.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Theme */}
          {activeTab === 'theme' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: accent, letterSpacing: 2, textTransform: 'uppercase' }}>Choose Your Theme</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
                {THEMES.map(t => (
                  <div key={t.id} className="rk4-tc"
                    onClick={async () => {
                      setActiveThemeId(t.id);
                      try { await base44.auth.updateMe({ theme: t.id }); } catch {
                        try { await base44.entities.User.updateMe({ theme: t.id }); } catch {}
                      }
                    }}
                    style={{ borderColor: activeThemeId === t.id ? t.accent : 'transparent', background: activeThemeId === t.id ? t.accent + '10' : 'rgba(255,255,255,0.02)' }}>
                    <div style={{ height: 40, borderRadius: 9, marginBottom: 9, background: t.banner }} />
                    <div style={{ height: 4, borderRadius: 2, marginBottom: 8, background: t.ring, width: '55%' }} />
                    <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13, fontWeight: 800, color: '#f1f5f9' }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: '#334155', marginTop: 2 }}>{t.desc}</div>
                    {activeThemeId === t.id && <div style={{ marginTop: 7, fontSize: 10, fontWeight: 700, color: t.accent, letterSpacing: 1 }}>✓ ACTIVE</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admin */}
          {activeTab === 'admin' && (
            <div className="rk4-glass" style={{ padding: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: accent, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>Admin Panel</div>
              <AdminSyncPanel />
            </div>
          )}
        </div>

        {editing && <EditModal user={merged} theme={theme} onSave={handleSave} onClose={() => setEditing(false)} />}
      </div>
    </>
  );
                  }
