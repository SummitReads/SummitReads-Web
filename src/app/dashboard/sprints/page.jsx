"use client";
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/app/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppNav from '@/components/AppNav';
import { displaySprintTitle, computeSprintProgress } from '@/lib/sprintDisplay';

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
  'Coaching & Development':             '#06B6D4',
  'Performance & Accountability':       '#F59E0B',
};
function categoryColor(cat) { return categoryColors[cat] || 'var(--brand-teal)'; }

function sortByRecent(a, b) {
  return new Date(b.lastTouched || 0) - new Date(a.lastTouched || 0);
}

function SprintRow({ book, completedDays, nextDay, pct, isComplete, isLast, quiet }) {
  if (!book) return null;
  const color = categoryColor(book.category);

  return (
    <Link
      href={`/summit/${book.id}/day/${isComplete ? 7 : nextDay}`}
      style={{ textDecoration: 'none' }}
    >
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: '16px',
          padding: quiet ? '14px 20px' : '16px 24px',
          borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)',
          transition: 'background 0.15s', cursor: 'pointer',
          opacity: quiet ? 0.88 : 1,
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <div style={{
          width: '10px', height: '10px', borderRadius: '50%',
          background: isComplete ? '#4ade80' : color,
          flexShrink: 0,
          opacity: quiet ? 0.7 : 1,
        }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: '600',
            fontSize: quiet ? '0.88rem' : '0.9rem',
            marginBottom: '4px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: quiet ? 'rgba(238,242,247,0.75)' : '#EEF2F7',
          }}>
            {displaySprintTitle(book)}
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '99px',
            height: '3px',
            overflow: 'hidden',
            maxWidth: '260px',
          }}>
            <div style={{
              width: `${pct}%`,
              height: '100%',
              background: isComplete ? '#4ade80' : 'var(--brand-teal)',
              borderRadius: '99px',
              transition: 'width 0.4s',
            }} />
          </div>
        </div>

        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'flex-end', gap: '4px', flexShrink: 0,
        }}>
          <div style={{
            fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase',
            letterSpacing: '0.5px', borderRadius: '99px', padding: '2px 10px',
            background: isComplete ? 'rgba(34,197,94,0.12)' : 'rgba(23,184,224,0.1)',
            border: isComplete ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(23,184,224,0.25)',
            color: isComplete ? '#4ade80' : '#17B8E0',
          }}>
            {isComplete
              ? 'Completed'
              : completedDays === 0
                ? 'Just started'
                : 'In progress'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)' }}>
            {isComplete
              ? '7 of 7 days finished'
              : completedDays === 0
                ? 'Day 1 of 7 · open it'
                : `${completedDays} of 7 finished · up next Day ${nextDay}`}
          </div>
        </div>
      </div>
    </Link>
  );
}

function Section({ title, count, children, quiet }) {
  return (
    <section style={{ marginBottom: quiet ? 40 : 32 }}>
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginBottom: 12,
        gap: 12,
      }}>
        <h2 style={{
          margin: 0,
          fontFamily: 'var(--font-sans)',
          fontSize: '0.72rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: quiet ? 'rgba(148,163,184,0.7)' : 'var(--brand-teal)',
        }}>
          {title}
        </h2>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.7rem',
          color: 'rgba(148,163,184,0.55)',
        }}>
          {count}
        </span>
      </div>
      <div className="glass-panel" style={{
        padding: '8px 0',
        opacity: quiet ? 0.92 : 1,
        borderColor: quiet ? 'rgba(255,255,255,0.05)' : undefined,
      }}>
        {children}
      </div>
    </section>
  );
}

export default function SprintsPage() {
  const router = useRouter();
  const [mounted,     setMounted]     = useState(false);
  const [allProgress, setAllProgress] = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    setMounted(true);
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }
      const uid = user.id;

      const progressRes = await supabase
        .from('user_progress')
        .select('*, books(id, title, category, sprint_title, review_status, summit_days(count))')
        .eq('user_id', uid)
        .order('unlocked_at', { ascending: false });

      if (progressRes.data) setAllProgress(progressRes.data);
      setLoading(false);
    }
    load();
  }, []);

  // Only shippable (approved) books
  const sprintList = useMemo(() => {
    const map = {};
    allProgress.forEach(p => {
      const id = p.book_id;
      const book = p.books;
      if (!book?.id) return;
      if (book.review_status && book.review_status !== 'approved') return;
      if (!String(book.sprint_title || '').trim()) return;
      const hasDays = (book.summit_days?.[0]?.count ?? 0) > 0;
      if (!hasDays || !id) return;
      if (!map[id]) map[id] = { book, rows: [] };
      map[id].rows.push(p);
    });

    return Object.values(map).map(({ book, rows }) => {
      const progress = computeSprintProgress(rows);
      return { book, ...progress };
    });
  }, [allProgress]);

  // Keep active and completed in separate lists — never mixed
  const activeSprints = useMemo(
    () => sprintList.filter(s => !s.isComplete).sort(sortByRecent),
    [sprintList],
  );
  const completedSprints = useMemo(
    () => sprintList.filter(s => s.isComplete).sort(sortByRecent),
    [sprintList],
  );

  if (!mounted) return null;

  return (
    <>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .view-all-link { transition: opacity 0.15s; }
        .view-all-link:hover { opacity: 0.7; }
      `}</style>

      <div className="ambient-glow" />
      <AppNav active="sprints" />

      <main className="container" style={{ paddingTop: '80px', maxWidth: '900px', paddingLeft: '16px', paddingRight: '16px' }}>

        <div style={{ marginBottom: '32px' }}>
          <Link href="/dashboard" className="view-all-link" style={{
            fontSize: '0.8rem', color: 'var(--brand-teal)', textDecoration: 'none',
            fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '16px',
          }}>
            ← Back to Dashboard
          </Link>
          <p style={{
            color: 'var(--text-muted)', marginBottom: '4px', fontSize: '0.875rem',
            textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '700',
          }}>
            Your progress
          </p>
          {loading
            ? <SkeletonBlock width="220px" height="36px" />
            : (
              <h1 style={{ fontSize: '2rem', margin: '0 0 8px' }}>
                My Sprints
              </h1>
            )
          }
          {!loading && (
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(238,242,247,0.45)' }}>
              {activeSprints.length > 0
                ? `${activeSprints.length} open · ${completedSprints.length} completed`
                : completedSprints.length > 0
                  ? `${completedSprints.length} completed · start another from the library`
                  : 'Start a sprint from the library — it will show up here.'}
            </p>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3].map(i => <SkeletonBlock key={i} height="88px" style={{ borderRadius: '12px' }} />)}
          </div>
        ) : sprintList.length === 0 ? (
          <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '12px', fontSize: '1.2rem' }}>No sprints yet</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
              Pick a 7-day skill from the library. Your open loop will live here.
            </p>
            <button type="button" className="btn-primary" onClick={() => router.push('/library')}>
              Browse library →
            </button>
          </div>
        ) : (
          <>
            {/* ── In progress (primary) ── */}
            {activeSprints.length > 0 && (
              <Section
                title="In progress"
                count={`${activeSprints.length}`}
              >
                {activeSprints.map((s, i) => (
                  <SprintRow
                    key={s.book.id}
                    book={s.book}
                    completedDays={s.completedDays}
                    nextDay={s.nextDay}
                    pct={s.pct}
                    isComplete={false}
                    isLast={i === activeSprints.length - 1}
                  />
                ))}
              </Section>
            )}

            {activeSprints.length === 0 && completedSprints.length > 0 && (
              <div className="glass-panel" style={{ padding: '28px 24px', marginBottom: 32, textAlign: 'center' }}>
                <p style={{ margin: '0 0 8px', fontWeight: 600, color: '#E2E8F0' }}>
                  Nothing in progress
                </p>
                <p style={{ margin: '0 0 16px', fontSize: '0.9rem', color: 'rgba(238,242,247,0.5)' }}>
                  Start your next skill from the library.
                </p>
                <button type="button" className="btn-primary" onClick={() => router.push('/library')}>
                  Browse library →
                </button>
              </div>
            )}

            {/* ── Completed (separate, quieter) ── */}
            {completedSprints.length > 0 && (
              <Section
                title="Completed"
                count={`${completedSprints.length}`}
                quiet
              >
                {completedSprints.map((s, i) => (
                  <SprintRow
                    key={s.book.id}
                    book={s.book}
                    completedDays={7}
                    nextDay={7}
                    pct={100}
                    isComplete
                    isLast={i === completedSprints.length - 1}
                    quiet
                  />
                ))}
              </Section>
            )}
          </>
        )}

        <div style={{ marginBottom: '40px' }} />
      </main>
    </>
  );
}
