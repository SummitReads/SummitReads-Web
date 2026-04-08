"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { supabase } from '@/app/supabaseClient';
import DayGuard from '@/components/DayGuard';
import CompletionCelebration from '@/components/CompletionCelebration';
import SummitCoach from '@/components/SummitCoach';
import PacingNudge from '@/components/PacingNudge';

export default function SummitDayPage({ params }) {
  const unwrappedParams = React.use(params);
  const id      = unwrappedParams.id;
  const dayNum  = parseInt(unwrappedParams.dayNum);

  const [book,                setBook]                = useState(null);
  const [dayData,             setDayData]             = useState(null);
  const [allDays,             setAllDays]             = useState([]);
  const [loading,             setLoading]             = useState(true);
  const [error,               setError]               = useState(null);
  const [reflectionText,      setReflectionText]      = useState('');
  const [missionComplete,     setMissionComplete]     = useState(false);
  const [user,                setUser]                = useState(null);
  const [previousDayProgress, setPreviousDayProgress] = useState(null);
  const [showCelebration,     setShowCelebration]     = useState(false);
  const [nextDayData,         setNextDayData]         = useState(null);
  const [pacingDismissed,     setPacingDismissed]     = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);

        if (!id || !dayNum) {
          setError('Missing parameters');
          setLoading(false);
          return;
        }

        const { data: bookData,       error: bookError } = await supabase.from('books').select('*').eq('id', id).single();
        const { data: daysData }                          = await supabase.from('summit_days').select('day_number, title').eq('book_id', id).order('day_number', { ascending: true });
        const { data: currentDayData, error: dayError  } = await supabase.from('summit_days').select('*').eq('book_id', id).eq('day_number', dayNum).maybeSingle();

        if (dayNum < 7) {
          const { data: nextDay } = await supabase
            .from('summit_days')
            .select('title, ascent_content')
            .eq('book_id', id)
            .eq('day_number', dayNum + 1)
            .maybeSingle();
          setNextDayData(nextDay);
        }

        if (currentUser && dayNum > 1) {
          const { data: prevProgress } = await supabase
            .from('user_progress')
            .select('completed_at, completed, action_commitment, unlocked_at')
            .eq('user_id', currentUser.id)
            .eq('book_id', id)
            .eq('day_number', dayNum - 1)
            .maybeSingle();
          setPreviousDayProgress(prevProgress);
        }

        if (currentUser) {
          const { data: currentProgress } = await supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', currentUser.id)
            .eq('book_id', id)
            .eq('day_number', dayNum)
            .maybeSingle();

          if (currentProgress) {
            setReflectionText(currentProgress.reflection_data || '');
            setMissionComplete(currentProgress.completed || false);
          }
        }

        if (bookError) setError('Book not found');
        if (dayError)  setError('Stage content not found');

        setBook(bookData);
        setDayData(currentDayData);
        setAllDays(daysData || []);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }
    fetchData();
  }, [id, dayNum]);

  async function saveReflection() {
    if (!user || !reflectionText.trim()) return;
    try {
      await supabase.from('user_progress').upsert({
        user_id:         user.id,
        book_id:         id,
        day_number:      dayNum,
        reflection_data: reflectionText,
      }, { onConflict: 'user_id,book_id,day_number' });
    } catch (err) { console.error('Error saving reflection:', err?.message ?? err); }
  }

  async function toggleMission() {
    if (!user) { alert('Please sign in to save progress.'); return; }

    const newState = !missionComplete;

    if (newState) {
      const now = new Date().toISOString();
      setMissionComplete(true);
      try {
        const { error } = await supabase.from('user_progress').upsert({
          user_id:      user.id,
          book_id:      id,
          day_number:   dayNum,
          completed:    true,
          completed_at: now,
        }, { onConflict: 'user_id,book_id,day_number' });

        if (error) { console.error('Toggle error:', error?.message ?? JSON.stringify(error)); setMissionComplete(false); return; }

        // ── Fire stage-complete email (only if there's a next stage) ──
        if (dayNum < 7 && user?.email) {
          try {
            await fetch('/api/send-stage-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email:          user.email,
                bookTitle:      book?.title,
                currentStage:   dayNum,
                nextStage:      dayNum + 1,
                nextStageTitle: nextDayData?.title || `Stage ${dayNum + 1}`,
                bookId:         id,
                reflection:     reflectionText.trim() || null,
              }),
            });
          } catch (emailErr) {
            console.error('Email send failed:', emailErr);
          }
        }

        setShowCelebration(true);
      } catch (err) { console.error('Critical error:', err?.message ?? err); setMissionComplete(false); }
    } else {
      setMissionComplete(false);
      try {
        const { error } = await supabase.from('user_progress').upsert({
          user_id:      user.id,
          book_id:      id,
          day_number:   dayNum,
          completed:    false,
          completed_at: null,
        }, { onConflict: 'user_id,book_id,day_number' });
        if (error) { console.error('Toggle error:', error?.message ?? JSON.stringify(error)); setMissionComplete(true); }
      } catch (err) { console.error('Critical error:', err?.message ?? err); }
    }
  }

  function handleCloseCelebration() {
    setShowCelebration(false);
    if (dayNum === 7) window.location.href = '/library';
  }

  // ─── Loading / error states ──────────────────────────────────────────────
  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: 'var(--brand-teal)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
          Loading
        </div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--text-muted)' }}>
          Your journey…
        </div>
      </div>
    </div>
  );

  if (error || !book || !dayData) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--text-main)', marginBottom: 8 }}>Content not found</div>
        <Link href="/library" style={{ color: 'var(--brand-teal)', fontSize: '0.875rem' }}>← Back to library</Link>
      </div>
    </div>
  );

  const progressPercent = Math.round(((dayNum - 1) / 7) * 100);
  const nextStagePreview = nextDayData?.ascent_content
    ? nextDayData.ascent_content.substring(0, 150) + '…'
    : 'Continue your transformation journey.';

  return (
    <>
      <div className="ambient-glow" />

      <nav className="glass-nav">
        <div className="nav-content">
          <Link href="/" className="logo">
            <img src="/SummitSkills-Logo.png" alt="SummitSkills" className="logo-img" />
            Summit<span>Skills</span>
          </Link>
          <div className="nav-actions">
            <Link href="/library" className="btn-outline small">Exit to Library</Link>
          </div>
        </div>
      </nav>

      <main className="container" style={{ maxWidth: 900, paddingTop: 40, paddingBottom: 80 }}>

        {/* Sprint header */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ marginBottom: 28 }}>
            <div className="tag-featured" style={{ marginBottom: 16 }}>
              <div className="pulse-dot" />
              <span style={{ fontFamily: "'DM Mono', monospace" }}>Stage {dayNum}</span>
              <span style={{ color: 'rgba(25,190,227,0.5)' }}>/</span>
              <span style={{ fontFamily: "'DM Mono', monospace" }}>7</span>
              {book.category && <span style={{ color: 'rgba(25,190,227,0.5)', margin: '0 4px' }}>·</span>}
              {book.category && <span style={{ fontFamily: 'var(--font-sans)' }}>{book.category}</span>}
            </div>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--brand-teal)', margin: 0 }}>
              {book.sprint_title || book.title}
            </p>
          </div>

          {/* Progress bar */}
          <div className="progress-bar-container">
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {[1,2,3,4,5,6,7].map(stage => (
                <div key={stage} style={{
                  flex: 1,
                  height: 5,
                  borderRadius: 3,
                  background: stage < dayNum
                    ? 'var(--brand-teal)'
                    : stage === dayNum
                    ? 'rgba(25,190,227,0.5)'
                    : 'rgba(255,255,255,0.08)',
                  transition: 'background 0.3s ease',
                }} />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>Your journey</span>
              <span style={{ fontFamily: "'DM Mono', monospace", color: 'var(--brand-teal)', fontWeight: 600 }}>
                {progressPercent}% complete
              </span>
            </div>
          </div>
        </div>

        {/* Stage content — gated by DayGuard */}
        <DayGuard
          userId={user?.id}
          bookId={id}
          currentDay={dayNum}
          previousDayProgress={previousDayProgress}
        >
          {/* Stage title */}
          <div style={{ marginBottom: 48, textAlign: 'center' }}>
            <h2 className="text-gradient" style={{ fontSize: '2.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              {dayData.title}
            </h2>
          </div>

          {/* Today's insight */}
          <div className="glass-panel" style={{ marginBottom: 32 }}>
            <div className="tag-featured">
              <div className="pulse-dot" />
              Today's Ascent
            </div>
            <div style={{ fontSize: '1.1rem', lineHeight: 1.85, whiteSpace: 'pre-wrap', color: 'var(--text-main)' }}>
              {dayData.ascent_content}
            </div>
          </div>

          {/* Milepost */}
          {dayData.milepost && (
            <div className="glass-panel" style={{
              marginBottom: 32,
              ...(dayNum === 7 && {
                borderColor: 'rgba(25,190,227,0.35)',
                boxShadow: '0 0 24px rgba(25,190,227,0.08)',
              })
            }}>
              <div className="tag-featured">
                {dayNum === 7 ? '🏔 Your Commitment' : 'Milepost'}
              </div>

              <p style={{ fontSize: '1.25rem', fontStyle: 'italic', marginBottom: 16, color: 'var(--text-main)', lineHeight: 1.6 }}>
                {dayData.milepost}
              </p>

              {/* Hint line — the three ingredients */}
              <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', marginBottom: 16, lineHeight: 1.5 }}>
                The best ones are specific. Include:{' '}
                <span style={{ color: 'rgba(255,255,255,0.55)' }}>when</span>
                {' '}(after my 9am standup) +{' '}
                <span style={{ color: 'rgba(255,255,255,0.55)' }}>what</span>
                {' '}(I will open the tracker) +{' '}
                <span style={{ color: 'rgba(255,255,255,0.55)' }}>where</span>
                {' '}(on my second monitor)
              </p>

              <textarea
                className="journal-input"
                value={reflectionText}
                onChange={e => setReflectionText(e.target.value)}
                onBlur={saveReflection}
                placeholder={
                  dayData.madlib_template
                    ? dayData.madlib_template
                    : dayNum === 7
                    ? 'For the next two weeks, I will check my habit tracker after I pour my morning coffee.'
                    : 'After I close the 9am standup, I will open the budget sheet on my second monitor.'
                }
                style={{
                  ...(dayNum === 7 && { minHeight: '100px' })
                }}
              />

              {/* Soft skip note — Days 1–6 only */}
              {dayNum < 7 && (
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)', marginTop: 10, textAlign: 'right' }}>
                  Writing it down helps it stick — but you can skip and continue below.
                </p>
              )}

              {/* Day 7 nudge */}
              {dayNum === 7 && (
                <p style={{ fontSize: '0.82rem', color: 'rgba(25,190,227,0.6)', marginTop: 12, lineHeight: 1.5 }}>
                  This is the one sentence that makes next week different. Take 60 seconds and write yours.
                </p>
              )}
            </div>
          )}

          {/* Mission */}
          {dayData.summit_mission && (
            <div className="glass-panel mission-panel highlighted" style={{ marginBottom: 32 }}>
              <div className="tag-featured">Stage Mission</div>
              <p style={{ fontSize: '1.15rem', marginBottom: 28, lineHeight: 1.7, color: 'var(--text-main)' }}>
                {dayData.summit_mission}
              </p>
              <button
                onClick={toggleMission}
                className="btn-primary-large"
              >
                {missionComplete ? (
                  <>
                    <Check size={20} strokeWidth={2.5} />
                    Stage Complete
                  </>
                ) : (
                  <>
                    Complete This Stage
                    <span className="arrow" style={{ fontSize: '1.1em' }}>→</span>
                  </>
                )}
              </button>
            </div>
          )}
        </DayGuard>

        {/* Explore Further link — only shown once stage is complete */}
        {missionComplete && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Link
              href={`/summit/${id}/day/${dayNum}/deep`}
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '0.75rem',
                color: 'rgba(25,190,227,0.45)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 20,
                border: '1px solid rgba(25,190,227,0.15)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--brand-teal)';
                e.currentTarget.style.borderColor = 'rgba(25,190,227,0.35)';
                e.currentTarget.style.background = 'rgba(25,190,227,0.05)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'rgba(25,190,227,0.45)';
                e.currentTarget.style.borderColor = 'rgba(25,190,227,0.15)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              Explore Further →
            </Link>
          </div>
        )}

        {/* Stage navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginTop: 40 }}>
          {dayNum > 1 && (
            <Link href={`/summit/${id}/day/${dayNum - 1}`} className="btn-outline" style={{ flex: 1, textAlign: 'center' }}>
              <span style={{ fontFamily: "'DM Mono', monospace" }}>← Stage {dayNum - 1}</span>
            </Link>
          )}
          {dayNum < 7 && missionComplete && (
            <Link href={`/summit/${id}/day/${dayNum + 1}`} className="btn-primary" style={{ flex: 1, textAlign: 'center' }}>
              <span style={{ fontFamily: "'DM Mono', monospace" }}>Stage {dayNum + 1} →</span>
            </Link>
          )}
        </div>

      </main>

      <CompletionCelebration
        isOpen={showCelebration}
        onClose={handleCloseCelebration}
        dayNum={dayNum}
        bookTitle={book.title}
        nextDayTitle={nextDayData?.title || `Stage ${dayNum + 1}`}
        nextDayPreview={nextStagePreview}
        nextDayUrl={`/summit/${id}/day/${dayNum + 1}`}
      />

      <SummitCoach bookId={id} dayNum={dayNum} userId={user?.id} />

      {/* Pacing nudge — shown if user is rushing */}
      {!pacingDismissed && dayNum > 1 && (
        <PacingNudge
          dayNum={dayNum}
          previousDayProgress={previousDayProgress}
          onContinue={() => setPacingDismissed(true)}
        />
      )}
    </>
  );
}
