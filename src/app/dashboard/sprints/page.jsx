"use client";
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/app/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function SkeletonBlock({ width = '100%', height = '20px', style = {} }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.07)', borderRadius: '6px',
      width, height, ...style,
      animation: 'pulse 1.6s ease-in-out infinite',
    }} />
  );
}

const categoryColors = {
  'Productivity & Habits':              '#06B6D4',
  'Financial Intelligence':             '#10B981',
  'Leadership & People Management':     '#6B8FD6',
  'Sales, Persuasion & Negotiation':    '#F43F5E',
  'Strategy & Innovation':              '#0EA5E9',
  'Marketing, Branding & Storytelling': '#EAB308',
};
function categoryColor(cat) { return categoryColors[cat] || 'var(--brand-teal)'; }

function statusBadge(completedDays) {
  if (completedDays >= 7) return { label: 'Completed', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.25)', color: '#4ade80' };
  if (completedDays === 0) return { label: 'Just Started', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.12)', color: 'rgba(238,242,247,0.4)' };
  return { label: 'In Progress', bg: 'rgba(23,184,224,0.1)', border: 'rgba(23,184,224,0.25)', color: '#17B8E0' };
}

const FILTERS = ['All', 'In Progress', 'Completed', 'Just Started'];

export default function SprintsPage() {
  const router = useRouter();
  const [mounted,     setMounted]     = useState(false);
  const [profile,     setProfile]     = useState(null);
  const [allProgress, setAllProgress] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState('All');

  useEffect(() => {
    setMounted(true);
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth/login'); return; }
      const uid = session.user.id;

      const [profileRes, progressRes] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', uid).single(),
        supabase
          .from('user_progress')
          .select('*, books(id, title, author, category, sprint_title, summit_days(count))')
          .eq('user_id', uid)
          .order('unlocked_at', { ascending: false }),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (progressRes.data) setAllProgress(progressRes.data);
      setLoading(false);
    }
    load();
  }, []);

  // Build sprint list — one entry per book, only books with content
  const sprintList = useMemo(() => {
    const map = {};
    allProgress.forEach(p => {
      const id = p.book_id;
      const hasDays = (p.books?.summit_days?.[0]?.count ?? 0) > 0;
      if (!hasDays) return;
      if (!map[id]) map[id] = { book: p.books, completedDays: 0, lastTouched: p.unlocked_at };
      if (p.completed) map[id].completedDays++;
      if (p.unlocked_at > map[id].lastTouched) map[id].lastTouched = p.unlocked_at;
    });

    return Object.values(map).sort((a, b) => {
      // In Progress first, then Completed, then Just Started
      const order = (cd) => cd > 0 && cd < 7 ? 0 : cd >= 7 ? 1 : 2;
      const diff = order(a.completedDays) - order(b.completedDays);
      if (diff !== 0) return diff;
      return new Date(b.lastTouched) - new Date(a.lastTouched);
    });
  }, [allProgress]);

  const filtered = useMemo(() => {
    if (filter === 'All') return sprintList;
    if (filter === 'In Progress') return sprintList.filter(s => s.completedDays > 0 && s.completedDays < 7);
    if (filter === 'Completed')   return sprintList.filter(s => s.completedDays >= 7);
    if (filter === 'Just Started') return sprintList.filter(s => s.completedDays === 0);
    return sprintList;
  }, [sprintList, filter]);

  if (!mounted) return null;

  const showFilters = sprintList.length >= 5;

  return (
    <>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .sprint-filter { cursor: pointer; border: 1px solid rgba(255,255,255,0.1); border-radius: 99px; padding: 5px 14px; font-size: 0.78rem; font-weight: 600; background: transparent; color: rgba(238,242,247,0.5); transition: all 0.15s; font-family: var(--font-sans); }
        .sprint-filter:hover { border-color: rgba(255,255,255,0.25); color: rgba(238,242,247,0.8); }
        .sprint-filter.active { background: var(--brand-teal); border-color: var(--brand-teal); color: #0D1520; }
      `}</style>

      <div className="ambient-glow" />
      <nav className="glass-nav">
        <div className="nav-content">
          <Link href="/library" className="logo">
            <img src="/SummitSkills-Logo.png" alt="SummitSkills" className="logo-img" />
            Summit<span>Skills</span>
          </Link>
          <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="btn-primary small" onClick={() => router.push('/settings')}>Settings</button>
            <button className="btn-primary small" onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}>Sign Out</button>
          </div>
        </div>
      </nav>

      <main className="container" style={{ paddingTop: '80px', maxWidth: '900px', paddingLeft: '16px', paddingRight: '16px' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: '32px' }}>
          <Link href="/dashboard" style={{ fontSize: '0.8rem', color: 'var(--brand-teal)', textDecoration: 'none', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '16px' }}>
            ← Back to Dashboard
          </Link>
          <p style={{ color: 'var(--text-muted)', marginBottom: '4px', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '700' }}>
            All Sprints
          </p>
          {loading
            ? <SkeletonBlock width="220px" height="36px" />
            : <h1 style={{ fontSize: '2rem', margin: '0 0 8px' }}>
                {sprintList.length} sprint{sprintList.length !== 1 ? 's' : ''} started
              </h1>
          }
        </div>

        {/* ── Filter pills ── */}
        {!loading && showFilters && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '28px' }}>
            {FILTERS.map(f => (
              <button
                key={f}
                className={`sprint-filter${filter === f ? ' active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        )}

        {/* ── Sprint list ── */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1,2,3,4].map(i => <SkeletonBlock key={i} height="88px" style={{ borderRadius: '12px' }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>
              No sprints match this filter.
            </p>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '8px 0' }}>
            {filtered.map(({ book, completedDays, lastTouched }, i) => {
              if (!book) return null;
              const pct      = Math.round((completedDays / 7) * 100);
              const nextDay  = Math.min(completedDays + 1, 7);
              const color    = categoryColor(book.category);
              const badge    = statusBadge(completedDays);
              const isLast   = i === filtered.length - 1;

              return (
                <Link
                  key={book.id}
                  href={`/summit/${book.id}/day/${nextDay}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', gap: '16px',
                      padding: '16px 24px',
                      borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)',
                      transition: 'background 0.15s', cursor: 'pointer',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Color dot */}
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, flexShrink: 0 }} />

                    {/* Title + progress */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {book.sprint_title || book.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginBottom: '8px' }}>
                        {book.author}
                      </div>
                      {/* Progress bar */}
                      <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '99px', height: '3px', overflow: 'hidden', maxWidth: '260px' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: completedDays >= 7 ? '#4ade80' : 'var(--brand-teal)', borderRadius: '99px', transition: 'width 0.4s' }} />
                      </div>
                    </div>

                    {/* Badge + day count */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                      <div style={{
                        fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase',
                        letterSpacing: '0.5px', borderRadius: '99px', padding: '2px 10px',
                        background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color,
                      }}>
                        {badge.label}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)' }}>
                        Day {completedDays} of 7
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div style={{ marginBottom: '40px' }} />

      </main>
    </>
  );
}
