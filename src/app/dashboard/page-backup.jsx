"use client";
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/app/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// ── Helpers ───────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = 'var(--brand-teal)' }) {
  return (
    <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2.2rem', fontWeight: '700', color, marginBottom: '4px' }}>
        {value}
      </div>
      <div style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(255,255,255,0.4)', marginBottom: sub ? '4px' : 0 }}>
        {label}
      </div>
      {sub && <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)' }}>{sub}</div>}
    </div>
  );
}

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
  'Productivity & Habits':           '#06B6D4',
  'Financial Intelligence':          '#10B981',
  'Leadership & People Management':  '#6B8FD6',
  'Sales, Persuasion & Negotiation': '#F43F5E',
  'Strategy & Innovation':           '#0EA5E9',
  'Marketing, Branding & Storytelling': '#EAB308',
};
function categoryColor(cat) { return categoryColors[cat] || 'var(--brand-teal)'; }

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [allProgress, setAllProgress] = useState([]);   // user_progress rows + book data
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);

    async function load() {
      // ── Auth guard ──────────────────────────────────────────────────────────
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth/login'); return; }
      const uid = session.user.id;
      setUser(session.user);

      // ── Parallel fetches ────────────────────────────────────────────────────
      const [profileRes, progressRes] = await Promise.all([
        supabase.from('profiles').select('full_name, email').eq('id', uid).single(),
        supabase
          .from('user_progress')
          .select('*, books(id, title, author, category, sprint_title, cover_url, summit_days(count))')
          .eq('user_id', uid)
          .order('unlocked_at', { ascending: false }),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (progressRes.data) setAllProgress(progressRes.data);

      setLoading(false);
    }
    load();
  }, []);

  // ── Derived data ──────────────────────────────────────────────────────────
  const completedDays = useMemo(() =>
    allProgress.filter(p => p.completed), [allProgress]);

  // A sprint = one book. "Started" = any day touched. "Completed" = all 7 days done.
  // Only include books that actually have summit_days content.
  const sprintMap = useMemo(() => {
    const map = {};
    allProgress.forEach(p => {
      const id = p.book_id;
      const hasDays = (p.books?.summit_days?.[0]?.count ?? 0) > 0;
      if (!hasDays) return;
      if (!map[id]) map[id] = { book: p.books, days: [], completedDays: 0 };
      map[id].days.push(p.day_number);
      if (p.completed) map[id].completedDays++;
    });
    return map;
  }, [allProgress]);

  const sprintList = useMemo(() => Object.values(sprintMap), [sprintMap]);
  const sprintsStarted = sprintList.length;
  const sprintsCompleted = sprintList.filter(s => s.completedDays >= 7).length;
  const sprintsInProgress = sprintList.filter(s => s.completedDays > 0 && s.completedDays < 7);

  // Recently completed sprints (full 7-day)
  const recentlyCompleted = useMemo(() =>
    sprintList
      .filter(s => s.completedDays >= 7)
      .slice(0, 3),
  [sprintList]);

  // Categories explored
  const categoriesExplored = useMemo(() => {
    const cats = {};
    sprintList.forEach(({ book, completedDays: cd }) => {
      if (!book?.category) return;
      if (!cats[book.category]) cats[book.category] = { started: 0, completed: 0 };
      cats[book.category].started++;
      if (cd >= 7) cats[book.category].completed++;
    });
    return Object.entries(cats).sort((a, b) => b[1].started - a[1].started);
  }, [sprintList]);

  // Reflections grouped by sprint, most recent sprint first
  const reflectionsBySprint = useMemo(() => {
    const map = {};
    allProgress.forEach(p => {
      if (!p.reflection_data || !p.books) return;
      const id = p.book_id;
      if (!map[id]) map[id] = { book: p.books, entries: [] };
      map[id].entries.push({ day_number: p.day_number, text: p.reflection_data, unlocked_at: p.unlocked_at });
    });
    return Object.values(map)
      .map(s => ({ ...s, entries: s.entries.sort((a, b) => a.day_number - b.day_number) }))
      .sort((a, b) => new Date(b.entries[b.entries.length - 1].unlocked_at) - new Date(a.entries[a.entries.length - 1].unlocked_at));
  }, [allProgress]);

  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  return (
    <>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      <div className="ambient-glow"></div>
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
        <div style={{ marginBottom: '40px' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '4px', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '700' }}>
            Your Dashboard
          </p>
          {loading
            ? <SkeletonBlock width="260px" height="36px" />
            : <h1 style={{ fontSize: '2rem', margin: 0 }}>Welcome back, {firstName}</h1>
          }
        </div>

        {/* ── Stat cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '40px' }}>
          {loading ? (
            [1,2].map(i => <SkeletonBlock key={i} height="100px" style={{ borderRadius: '12px' }} />)
          ) : (
            <>
              <StatCard
                label="Sprints Started"
                value={sprintsStarted}
                sub={`${sprintsCompleted} completed`}
              />
              <StatCard
                label="Categories"
                value={categoriesExplored.length}
                sub="areas explored"
                color="#8B5CF6"
              />
            </>
          )}
        </div>

        {/* ── In Progress ── */}
        {(loading || sprintsInProgress.length > 0) && (
          <section style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>
                Continue Where You Left Off
              </h2>
              {sprintsInProgress.length > 3 && (
                <Link href="/dashboard/sprints" style={{ fontSize: '0.8rem', color: 'var(--brand-teal)', textDecoration: 'none', fontWeight: '600' }}>View all →</Link>
              )}
            </div>
            {loading ? (
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {[1,2].map(i => <SkeletonBlock key={i} width="260px" height="120px" style={{ borderRadius: '12px' }} />)}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                {sprintsInProgress.slice(0, 3).map(({ book, completedDays: cd }) => {
                  if (!book) return null;
                  const nextDay = cd + 1;
                  const pct = Math.round((cd / 7) * 100);
                  return (
                    <Link
                      key={book.id}
                      href={`/summit/${book.id}/day/${nextDay}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <div className="glass-panel" style={{ padding: '20px', cursor: 'pointer', transition: 'transform 0.15s', ':hover': { transform: 'translateY(-2px)' } }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--brand-teal)', marginBottom: '8px' }}>
                          Day {nextDay} of 7
                        </div>
                        <div style={{ fontWeight: '600', marginBottom: '4px', fontSize: '0.95rem' }}>
                        {book.sprint_title || book.title}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginBottom: '14px' }}>
                          {book.author}
                        </div>
                        {/* Progress bar */}
                        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '99px', height: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--brand-teal)', borderRadius: '99px', transition: 'width 0.4s' }} />
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', marginTop: '6px' }}>{pct}% complete</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ── Recently Completed ── */}
        {(loading || recentlyCompleted.length > 0) && (
          <section style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>
                Recently Completed
              </h2>
              {recentlyCompleted.length > 3 && (
                <Link href="/dashboard/sprints" style={{ fontSize: '0.8rem', color: 'var(--brand-teal)', textDecoration: 'none', fontWeight: '600' }}>View all →</Link>
              )}
            </div>
            {loading ? (
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {[1,2,3].map(i => <SkeletonBlock key={i} width="200px" height="80px" style={{ borderRadius: '12px' }} />)}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                {recentlyCompleted.map(({ book }) => {
                  if (!book) return null;
                  return (
                    <div key={book.id} className="glass-panel" style={{ padding: '20px' }}>
                      <div style={{
                        display: 'inline-block', fontSize: '0.68rem', fontWeight: '700',
                        textTransform: 'uppercase', letterSpacing: '0.6px',
                        background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)',
                        color: '#4ade80', borderRadius: '99px', padding: '2px 10px', marginBottom: '10px'
                      }}>
                        ✓ Completed
                      </div>
                      <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '4px' }}>
                        {book.sprint_title || book.title}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)' }}>
                        {book.author}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ── Categories Explored ── */}
        {(loading || categoriesExplored.length > 0) && (
          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px' }}>
              Skills Explored
            </h2>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[1,2,3].map(i => <SkeletonBlock key={i} height="52px" style={{ borderRadius: '10px' }} />)}
              </div>
            ) : (
              <div className="glass-panel" style={{ padding: '8px 0' }}>
                {categoriesExplored.map(([cat, { started, completed }], i) => {
                  const color = categoryColor(cat);
                  return (
                    <Link
                      key={cat}
                      href={`/library?category=${encodeURIComponent(cat)}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '16px',
                        padding: '14px 24px',
                        borderBottom: i < categoriesExplored.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                        <div style={{ flex: 1, fontWeight: '500', fontSize: '0.9rem', color: 'var(--text-main)' }}>{cat}</div>
                        <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>
                          {completed} completed · {started} started
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--brand-teal)', marginLeft: '8px' }}>→</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ── Your Work ── */}
        {(loading || reflectionsBySprint.length > 0) && (
          <section style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>
                Your Work
              </h2>
              {reflectionsBySprint.length > 3 && (
                <Link href="/dashboard/reflections" style={{ fontSize: '0.8rem', color: 'var(--brand-teal)', textDecoration: 'none', fontWeight: '600' }}>View all →</Link>
              )}
            </div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[1,2].map(i => <SkeletonBlock key={i} height="80px" style={{ borderRadius: '10px' }} />)}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {reflectionsBySprint.slice(0, 3).map(({ book, entries }) => {
                  if (!book) return null;
                  const color = categoryColor(book.category);
                  return (
                    <div key={book.id} className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                      {/* Sprint header */}
                      <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                        <div style={{ fontWeight: '600', fontSize: '0.9rem', flex: 1 }}>{book.sprint_title || book.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>{book.author}</div>
                      </div>
                      {/* Reflection entries */}
                      {entries.map((entry, i) => (
                        <Link
                          key={entry.day_number}
                          href={`/summit/${book.id}/day/${entry.day_number}`}
                          style={{ textDecoration: 'none' }}
                        >
                          <div style={{
                            padding: '14px 20px',
                            borderBottom: i < entries.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                            display: 'flex', gap: '14px', alignItems: 'flex-start',
                            transition: 'background 0.15s', cursor: 'pointer',
                          }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <div style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--brand-teal)', whiteSpace: 'nowrap', paddingTop: '2px', minWidth: '52px' }}>
                              Stage {entry.day_number}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'rgba(238,242,247,0.6)', lineHeight: 1.6, flex: 1 }}>
                              {entry.text}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)', paddingTop: '2px' }}>→</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ── Empty state ── */}
        {!loading && sprintsStarted === 0 && (
          <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
            
            <h2 style={{ marginBottom: '12px' }}>Your journey starts here</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '28px' }}>
              Pick your first sprint from the library and start building skills today.
            </p>
            <Link href="/library" className="btn-primary">Browse Sprints →</Link>
          </div>
        )}

      </main>
    </>
  );
}
