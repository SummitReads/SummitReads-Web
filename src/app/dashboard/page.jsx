"use client";
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/app/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppNav from '@/components/AppNav';
import { displaySprintTitle, displayReflectionText, computeSprintProgress } from '@/lib/sprintDisplay';

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
          .select('*, books(id, title, category, sprint_title, cover_url, summit_days(count))')
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
  // A sprint = one book. Progress uses days 1–7 only (Day 0 does not count).
  // nextDay = first incomplete day 1–7 — never "count of completed rows + 1".
  const sprintList = useMemo(() => {
    const byBook = {};
    allProgress.forEach(p => {
      const id = p.book_id;
      const hasDays = (p.books?.summit_days?.[0]?.count ?? 0) > 0;
      if (!hasDays || !id) return;
      if (!byBook[id]) byBook[id] = { book: p.books, rows: [] };
      byBook[id].rows.push(p);
    });
    return Object.values(byBook).map(({ book, rows }) => {
      const progress = computeSprintProgress(rows);
      // Most recent write-it-down (days 1–7), for continue hero pull
      let lastWrite = null;
      let lastWriteDay = null;
      const withText = rows
        .filter(r => {
          const n = Number(r.day_number);
          return n >= 1 && n <= 7 && displayReflectionText(r.reflection_data);
        })
        .sort((a, b) => {
          const da = Number(a.day_number) || 0;
          const db = Number(b.day_number) || 0;
          if (db !== da) return db - da;
          return new Date(b.unlocked_at || 0) - new Date(a.unlocked_at || 0);
        });
      if (withText[0]) {
        lastWrite = displayReflectionText(withText[0].reflection_data);
        lastWriteDay = Number(withText[0].day_number);
      }
      return { book, rows, lastWrite, lastWriteDay, ...progress };
    });
  }, [allProgress]);

  // Total finished practice days (days 1–7 only) across all sprints
  const daysCompletedCount = useMemo(
    () => sprintList.reduce((sum, s) => sum + s.completedDays, 0),
    [sprintList],
  );

  const sprintsStarted = sprintList.length;
  const sprintsCompleted = sprintList.filter(s => s.isComplete).length;
  const sprintsInProgress = useMemo(() => {
    return sprintList
      .filter(s => !s.isComplete)
      .sort((a, b) => new Date(b.lastTouched || 0) - new Date(a.lastTouched || 0));
  }, [sprintList]);

  // Primary sprint for pull hero (most recently touched, still open)
  const continueHero = sprintsInProgress[0] || null;

  function arcLine(s) {
    if (!s) return null;
    const n = s.nextDay;
    if (s.completedDays === 0) return 'Day 1 is ready — one skill, about 15 minutes.';
    if (n <= 2) return 'Early days. Lay the foundation before it gets real.';
    if (n === 3 || n === 4) return 'Halfway. This is where it sticks — or stays theory.';
    if (n === 5) return 'Past the midpoint. Two more days to your Summit.';
    if (n === 6) return 'Tomorrow is Summit day — you produce the real output.';
    if (n === 7) return 'Summit day. Close the loop with something you can use at work.';
    return null;
  }

  // Recently completed sprints (all 7 days done)
  const recentlyCompleted = useMemo(() =>
    sprintList
      .filter(s => s.isComplete)
      .slice(0, 3),
  [sprintList]);

  // Categories explored
  const categoriesExplored = useMemo(() => {
    const cats = {};
    sprintList.forEach(({ book, isComplete }) => {
      if (!book?.category) return;
      if (!cats[book.category]) cats[book.category] = { started: 0, completed: 0 };
      cats[book.category].started++;
      if (isComplete) cats[book.category].completed++;
    });
    return Object.entries(cats).sort((a, b) => b[1].started - a[1].started);
  }, [sprintList]);

  // Reflections grouped by sprint, most recent sprint first
  const reflectionsBySprint = useMemo(() => {
    const map = {};
    allProgress.forEach(p => {
      if (!p.books) return;
      const text = displayReflectionText(p.reflection_data);
      if (!text) return;
      const id = p.book_id;
      if (!map[id]) map[id] = { book: p.books, entries: [] };
      map[id].entries.push({ day_number: p.day_number, text, unlocked_at: p.unlocked_at });
    });
    return Object.values(map)
      .filter(s => s.entries.length > 0)
      .map(s => ({ ...s, entries: s.entries.sort((a, b) => a.day_number - b.day_number) }))
      .sort((a, b) => new Date(b.entries[b.entries.length - 1].unlocked_at) - new Date(a.entries[a.entries.length - 1].unlocked_at));
  }, [allProgress]);

  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  return (
    <>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .view-all-link { transition: opacity 0.15s; }
        .view-all-link:hover { opacity: 0.7; }
        .continue-hero {
          position: relative;
          overflow: hidden;
          border-radius: 16px;
          padding: 28px 28px 24px;
          background:
            radial-gradient(ellipse 80% 120% at 100% 0%, rgba(23,184,224,0.18), transparent 55%),
            linear-gradient(145deg, rgba(16,28,44,0.98), rgba(13,21,32,0.99));
          border: 1px solid rgba(23,184,224,0.28);
          box-shadow: 0 0 0 1px rgba(255,255,255,0.03), 0 24px 48px rgba(0,0,0,0.35);
        }
        .continue-hero:hover { border-color: rgba(23,184,224,0.45); }
        .continue-hero-cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 20px;
          padding: 12px 22px;
          border-radius: 10px;
          background: var(--brand-teal);
          color: #0D1520;
          font-weight: 700;
          font-size: 0.95rem;
          text-decoration: none;
          border: none;
          cursor: pointer;
          font-family: var(--font-sans);
          transition: opacity 0.15s, transform 0.15s;
        }
        .continue-hero-cta:hover { opacity: 0.9; transform: translateY(-1px); }
      `}</style>

      <div className="ambient-glow"></div>
      <AppNav active="dashboard" />

      <main className="container" style={{ paddingTop: '80px', maxWidth: '900px', paddingLeft: '16px', paddingRight: '16px' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: '28px' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '4px', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '700' }}>
            Your Dashboard
          </p>
          {loading
            ? <SkeletonBlock width="260px" height="36px" />
            : <h1 style={{ fontSize: '2rem', margin: 0 }}>Welcome back, {firstName}</h1>
          }
        </div>

        {/* ── Continue hero (pull) ── */}
        {loading ? (
          <SkeletonBlock height="180px" style={{ borderRadius: '16px', marginBottom: '32px' }} />
        ) : continueHero?.book ? (
          <section style={{ marginBottom: '32px' }}>
            <Link
              href={`/summit/${continueHero.book.id}/day/${continueHero.nextDay}`}
              style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
            >
              <div className="continue-hero">
                <div style={{
                  display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px',
                  marginBottom: '12px',
                }}>
                  <span style={{
                    fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em',
                    textTransform: 'uppercase', color: 'var(--brand-teal)',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {continueHero.completedDays === 0
                      ? 'Ready to start'
                      : `Continue · Day ${continueHero.nextDay} of 7`}
                  </span>
                  <span style={{
                    fontSize: '0.72rem', color: 'rgba(238,242,247,0.35)',
                  }}>
                    {continueHero.completedDays} of 7 finished
                  </span>
                </div>

                <h2 style={{
                  fontSize: '1.45rem', fontWeight: 800, margin: '0 0 8px',
                  letterSpacing: '-0.02em', lineHeight: 1.25, color: '#EEF2F7',
                }}>
                  {displaySprintTitle(continueHero.book)}
                </h2>

                {arcLine(continueHero) && (
                  <p style={{
                    fontSize: '0.88rem', color: 'rgba(238,242,247,0.55)',
                    margin: '0 0 16px', lineHeight: 1.5,
                  }}>
                    {arcLine(continueHero)}
                  </p>
                )}

                {continueHero.lastWrite && (
                  <div style={{
                    background: 'rgba(0,0,0,0.25)',
                    borderLeft: '3px solid var(--brand-teal)',
                    borderRadius: '0 10px 10px 0',
                    padding: '12px 16px',
                    marginBottom: '4px',
                  }}>
                    <div style={{
                      fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em',
                      textTransform: 'uppercase', color: 'rgba(238,242,247,0.35)',
                      marginBottom: '6px',
                    }}>
                      {continueHero.lastWriteDay
                        ? `You wrote on Day ${continueHero.lastWriteDay}`
                        : 'Your last write-up'}
                    </div>
                    <p style={{
                      margin: 0, fontSize: '0.92rem', lineHeight: 1.55,
                      color: 'rgba(238,242,247,0.78)',
                      fontStyle: 'italic',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      “{continueHero.lastWrite}”
                    </p>
                  </div>
                )}

                {/* Progress */}
                <div style={{
                  marginTop: '18px', background: 'rgba(255,255,255,0.08)',
                  borderRadius: '99px', height: '5px', overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${continueHero.pct}%`, height: '100%',
                    background: 'var(--brand-teal)', borderRadius: '99px',
                    transition: 'width 0.4s',
                  }} />
                </div>

                <span className="continue-hero-cta">
                  {continueHero.completedDays === 0
                    ? 'Start Day 1 →'
                    : `Continue Day ${continueHero.nextDay} →`}
                </span>
              </div>
            </Link>
            {sprintsInProgress.length > 1 && (
              <div style={{ marginTop: '12px', textAlign: 'right' }}>
                <Link href="/dashboard/sprints" className="view-all-link" style={{
                  fontSize: '0.8rem', color: 'var(--brand-teal)',
                  textDecoration: 'none', fontWeight: 600,
                }}>
                  All sprints ({sprintsInProgress.length} open) →
                </Link>
              </div>
            )}
          </section>
        ) : null}

        {/* ── Stat cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '40px' }}>
          {loading ? (
            [1, 2, 3].map(i => <SkeletonBlock key={i} height="100px" style={{ borderRadius: '12px' }} />)
          ) : (
            <>
              <StatCard
                label="Sprints Started"
                value={sprintsStarted}
                sub={`${sprintsCompleted} completed`}
              />
              <StatCard
                label="Days Finished"
                value={daysCompletedCount}
                sub="sprint days marked complete"
                color="#34D399"
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

        {/* ── Other open sprints (if more than hero) ── */}
        {!loading && sprintsInProgress.length > 1 && (
          <section style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>
                Also in progress
              </h2>
              <Link href="/dashboard/sprints" className="view-all-link" style={{ fontSize: '0.8rem', color: 'var(--brand-teal)', textDecoration: 'none', fontWeight: '600' }}>View all →</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
              {sprintsInProgress.slice(1, 4).map(({ book, completedDays: cd, nextDay, pct }) => {
                if (!book) return null;
                return (
                  <Link
                    key={book.id}
                    href={`/summit/${book.id}/day/${nextDay}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <div className="glass-panel" style={{ padding: '20px', cursor: 'pointer', transition: 'border-color 0.15s' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--brand-teal)', marginBottom: '8px' }}>
                        {cd === 0 ? 'Start Day 1 of 7' : `Continue · Day ${nextDay} of 7`}
                      </div>
                      <div style={{ fontWeight: '600', marginBottom: '4px', fontSize: '0.95rem' }}>
                        {displaySprintTitle(book)}
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '99px', height: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--brand-teal)', borderRadius: '99px', transition: 'width 0.4s' }} />
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', marginTop: '6px' }}>
                        {cd} of 7 days finished
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Recently Completed ── */}
        {(loading || recentlyCompleted.length > 0) && (
          <section style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>
                Recently Completed
              </h2>
              <Link href="/dashboard/sprints" className="view-all-link" style={{ fontSize: '0.8rem', color: 'var(--brand-teal)', textDecoration: 'none', fontWeight: '600' }}>View all →</Link>
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
                        {displaySprintTitle(book)}
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
              <Link href="/dashboard/reflections" className="view-all-link" style={{ fontSize: '0.8rem', color: 'var(--brand-teal)', textDecoration: 'none', fontWeight: '600' }}>View all →</Link>
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
                        <div style={{ fontWeight: '600', fontSize: '0.9rem', flex: 1 }}>{displaySprintTitle(book)}</div>
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
                              Day {entry.day_number}
                            </div>
                            <div style={{
                              fontSize: '0.85rem', color: 'rgba(238,242,247,0.6)', lineHeight: 1.6, flex: 1,
                              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                            }}>
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
