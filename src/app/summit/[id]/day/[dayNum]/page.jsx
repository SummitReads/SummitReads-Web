"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { supabase } from '@/app/supabaseClient';
import CompletionCelebration from '@/components/CompletionCelebration';
import SummitCoach from '@/components/SummitCoach';
import Day0View from '@/components/Day0View';
// import PacingNudge from '@/components/PacingNudge'; // Disabled — friction without proven value. Re-enable if completion data shows binge-and-forget pattern.

// ── Phase 1: Practice-day layout ─────────────────────────────────────────────
// When true, "Today's Move" renders as four labeled beats (drill script) instead
// of one equal prose blob. Milepost / mission / coach / complete are unchanged.
// Rollback: set to false and hard-refresh — no DB or API changes.
const PRACTICE_DAY_V2 = true;

// ── Phase 2 preview: return loop (continuity + proof) ────────────────────────
// Two visible pieces so the "come back" vision is tangible:
//   1) Your situation this week — saved on Day 1 (progress_notes), echoed Days 2–7
//   2) What I did — optional mission proof (action_commitment), shown as
//      "Yesterday you…" on the next day
// Uses existing user_progress columns only. Still non-blocking for complete.
// Rollback: set false.
const RETURN_LOOP_V1 = true;

// Beat labels + visual weight. Keys match summit_days v2 columns.
const PRACTICE_BEATS = [
  {
    key: 'framework',
    label: 'The move',
    // Slightly stronger — this is the claim the day hangs on.
    panelStyle: {},
    bodyStyle: { fontSize: '1.05rem', lineHeight: 1.65, fontWeight: 500 },
  },
  {
    key: 'demonstration',
    label: 'Watch this',
    panelStyle: { background: 'rgba(25,190,227,0.03)' },
    bodyStyle: { fontSize: '1rem', lineHeight: 1.65 },
  },
  {
    key: 'failure_mode',
    label: 'Where it dies',
    // Soft warning tint — post-mortem energy without alarm red.
    panelStyle: {
      borderColor: 'rgba(251, 146, 60, 0.22)',
      background: 'rgba(251, 146, 60, 0.04)',
    },
    bodyStyle: { fontSize: '0.98rem', lineHeight: 1.6 },
  },
  {
    key: 'application',
    label: 'Your turn',
    // Bridges into milepost/mission — slightly tighter, action-adjacent.
    panelStyle: {
      borderColor: 'rgba(25,190,227,0.28)',
      background: 'rgba(25,190,227,0.05)',
    },
    bodyStyle: { fontSize: '1rem', lineHeight: 1.6, fontWeight: 500 },
  },
];

export default function SummitDayPage({ params }) {
  const router = useRouter();
  const unwrappedParams = React.use(params);
  const id      = unwrappedParams.id;
  // parseInt('0') === 0 — do not treat 0 as missing (Day 0 orientation).
  const dayNum  = parseInt(unwrappedParams.dayNum, 10);
  const isDay0  = dayNum === 0;

  const [book,                setBook]                = useState(null);
  const [dayData,             setDayData]             = useState(null);
  const [allDays,             setAllDays]             = useState([]);
  const [loading,             setLoading]             = useState(true);
  const [error,               setError]               = useState(null);
  const [day0Missing,         setDay0Missing]         = useState(false);
  const [reflectionText,      setReflectionText]      = useState('');
  const [missionComplete,     setMissionComplete]     = useState(false);
  const [user,                setUser]                = useState(null);
  const [previousDayProgress, setPreviousDayProgress] = useState(null);
  const [showCelebration,     setShowCelebration]     = useState(false);
  const [nextDayData,         setNextDayData]         = useState(null);
  const [pacingDismissed,     setPacingDismissed]     = useState(false);
  const [coachOpen,           setCoachOpen]           = useState(false);

  // ── Return loop (situation + mission proof) ─────────────────────────
  const [situationText,       setSituationText]       = useState('');
  const [missionNote,         setMissionNote]         = useState('');
  const [yesterdayNote,       setYesterdayNote]       = useState('');

  // ── Second-look state (Phase 2) ──────────────────────────────────────
  const [coachObservation,     setCoachObservation]     = useState('');
  const [secondLookLoading,    setSecondLookLoading]    = useState(false);
  const [secondLookStreaming,  setSecondLookStreaming]  = useState(false);
  const [showCoachPanel,       setShowCoachPanel]       = useState(false);
  const [secondLookError,      setSecondLookError]      = useState(null);
  const secondLookAbortRef = useRef(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);
        if (!id || Number.isNaN(dayNum)) {
          setError('Missing parameters');
          setLoading(false);
          return;
        }

        const { data: bookData, error: bookError } = await supabase
          .from('books')
          .select('*')
          .eq('id', id)
          .single();

        if (bookError || !bookData) {
          setError('Book not found');
          setLoading(false);
          return;
        }
        setBook(bookData);

        // ── Day 0: orientation from books.sprint_intro (not summit_days) ──
        if (isDay0) {
          const intro = (bookData.sprint_intro || '').trim();
          if (!intro) {
            // No Day 0 generated for this book — fall through to Day 1
            setDay0Missing(true);
            setLoading(false);
            return;
          }
          // Hydrate situation from Day 1 progress_notes (shared week field)
          if (currentUser && RETURN_LOOP_V1) {
            const { data: day1Progress } = await supabase
              .from('user_progress')
              .select('progress_notes')
              .eq('user_id', currentUser.id)
              .eq('book_id', id)
              .eq('day_number', 1)
              .maybeSingle();
            if (day1Progress?.progress_notes) {
              setSituationText(String(day1Progress.progress_notes).trim());
            }
          }
          setLoading(false);
          return;
        }

        // ── Days 1–7 ────────────────────────────────────────────────────
        const { data: daysData } = await supabase
          .from('summit_days')
          .select('day_number, title, skill_focus')
          .eq('book_id', id)
          .order('day_number', { ascending: true });
        const { data: currentDayData, error: dayError } = await supabase
          .from('summit_days')
          .select('*')
          .eq('book_id', id)
          .eq('day_number', dayNum)
          .maybeSingle();
        if (dayNum < 7) {
          const { data: nextDay } = await supabase
            .from('summit_days')
            .select('title, framework, demonstration, failure_mode, application')
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
          if (prevProgress?.action_commitment) {
            setYesterdayNote(String(prevProgress.action_commitment).trim());
          }
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
            if (currentProgress.action_commitment) {
              setMissionNote(String(currentProgress.action_commitment).trim());
            }
            if (currentProgress.coach_observation) {
              setCoachObservation(currentProgress.coach_observation);
              setShowCoachPanel(true);
            }
            if (dayNum === 1 && currentProgress.progress_notes) {
              setSituationText(String(currentProgress.progress_notes).trim());
            }
          }
          if (RETURN_LOOP_V1 && dayNum > 1) {
            const { data: day1Progress } = await supabase
              .from('user_progress')
              .select('progress_notes')
              .eq('user_id', currentUser.id)
              .eq('book_id', id)
              .eq('day_number', 1)
              .maybeSingle();
            if (day1Progress?.progress_notes) {
              setSituationText(String(day1Progress.progress_notes).trim());
            }
          }
          if (dayNum === 1) {
            supabase
              .from('profiles')
              .update({ onboarding_completed: true })
              .eq('id', currentUser.id)
              .then(() => {});
          }
        }
        if (dayError) setError('Day content not found');
        setDayData(currentDayData);
        setAllDays(daysData || []);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }
    fetchData();
  }, [id, dayNum, isDay0]);

  // Cleanup any in-flight second-look request on unmount
  useEffect(() => () => secondLookAbortRef.current?.abort(), []);

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

  // Week-long situation: always written to Day 1 so every day can read it back.
  async function saveSituation() {
    if (!user || !RETURN_LOOP_V1) return;
    const text = situationText.trim();
    try {
      await supabase.from('user_progress').upsert({
        user_id:         user.id,
        book_id:         id,
        day_number:      1,
        progress_notes:  text || null,
      }, { onConflict: 'user_id,book_id,day_number' });
    } catch (err) { console.error('Error saving situation:', err?.message ?? err); }
  }

  // Mission proof: what they actually did on real work (optional).
  async function saveMissionNote() {
    if (!user || !RETURN_LOOP_V1) return;
    const text = missionNote.trim();
    try {
      await supabase.from('user_progress').upsert({
        user_id:            user.id,
        book_id:            id,
        day_number:         dayNum,
        action_commitment:  text || null,
      }, { onConflict: 'user_id,book_id,day_number' });
    } catch (err) { console.error('Error saving mission note:', err?.message ?? err); }
  }

  // ── Second-look handler (Phase 2) ────────────────────────────────────
  async function getSecondLook() {
    if (!user) { alert('Please sign in to use the coach.'); return; }
    if (!reflectionText.trim()) { return; }
    if (secondLookLoading || secondLookStreaming) return;

    // Make sure the milepost is saved before the coach reads it
    await saveReflection();

    setShowCoachPanel(true);
    setCoachObservation('');
    setSecondLookError(null);
    setSecondLookLoading(true);

    secondLookAbortRef.current = new AbortController();

    try {
      const res = await fetch('/api/coach', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        signal:  secondLookAbortRef.current.signal,
        body: JSON.stringify({
          bookId:           id,
          dayNum,
          userId:           user.id,
          interaction_type: 'second_look',
          milepostText:     reflectionText.trim(),
          context:          'day',
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error || 'Coach unavailable. Try again.');
      }

      setSecondLookLoading(false);
      setSecondLookStreaming(true);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setCoachObservation(prev => prev + chunk);
      }

      setSecondLookStreaming(false);

      // Persist the observation so it shows on revisit
      try {
        await supabase.from('user_progress').upsert({
          user_id:           user.id,
          book_id:           id,
          day_number:        dayNum,
          coach_observation: accumulated,
        }, { onConflict: 'user_id,book_id,day_number' });
      } catch (saveErr) {
        console.error('Failed to persist coach observation:', saveErr?.message ?? saveErr);
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Second-look error:', err);
      setSecondLookError(err.message || 'Something went wrong. Try again.');
      setSecondLookLoading(false);
      setSecondLookStreaming(false);
    }
  }

  async function toggleMission() {
    if (!user) { alert('Please sign in to save progress.'); return; }
    const newState = !missionComplete;
    if (newState) {
      const now = new Date().toISOString();
      setMissionComplete(true);
      try {
        const payload = {
          user_id:      user.id,
          book_id:      id,
          day_number:   dayNum,
          completed:    true,
          completed_at: now,
        };
        // Carry optional mission proof into the complete write so Day N+1 can show it.
        if (RETURN_LOOP_V1 && missionNote.trim()) {
          payload.action_commitment = missionNote.trim();
        }
        const { error } = await supabase.from('user_progress').upsert(payload, { onConflict: 'user_id,book_id,day_number' });
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
                nextStageTitle: nextDayData?.title || `Day ${dayNum + 1}`,
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

  // Day 0 without intro → send learner to Day 1 (hook must stay above any return)
  useEffect(() => {
    if (!loading && isDay0 && day0Missing && book) {
      router.replace(`/summit/${id}/day/1`);
    }
  }, [loading, isDay0, day0Missing, book, id, router]);

  // ─── Loading / error states ──────────────────────────────────────────────
  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)' }}>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: 'var(--brand-teal)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        Loading
      </div>
    </div>
  );

  if (isDay0 && day0Missing) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)' }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: 'var(--brand-teal)' }}>
          Opening Day 1…
        </div>
      </div>
    );
  }

  // ── Day 0 orientation ────────────────────────────────────────────────────
  if (isDay0 && book?.sprint_intro) {
    return (
      <Day0View
        book={book}
        introMarkdown={book.sprint_intro}
        bookId={id}
        situationText={situationText}
        showSituation={RETURN_LOOP_V1}
        onSituationChange={setSituationText}
        onSituationBlur={(text) => {
          setSituationText(text);
          // saveSituation reads situationText from state — write explicitly
          if (!user || !RETURN_LOOP_V1) return;
          const t = (text || '').trim();
          supabase.from('user_progress').upsert({
            user_id: user.id,
            book_id: id,
            day_number: 1,
            progress_notes: t || null,
          }, { onConflict: 'user_id,book_id,day_number' }).then(() => {}, (err) => {
            console.error('Error saving situation from Day 0:', err?.message ?? err);
          });
        }}
      />
    );
  }

  if (error || !book || !dayData) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--text-main)', marginBottom: 8 }}>Content not found</div>
        <Link href="/library" style={{ color: 'var(--brand-teal)', fontSize: '0.875rem' }}>← Back to library</Link>
      </div>
    </div>
  );

  const progressPercent = Math.round(((dayNum - 1) / 7) * 100);
  // ── Next-day preview — assemble the same v2 components (space-joined for a
  // short teaser) rather than the dropped v1 ascent_content field. ──
  const nextStageText = ['framework', 'demonstration', 'failure_mode', 'application']
    .map(k => nextDayData?.[k])
    .filter(v => typeof v === 'string' && v.trim().length > 0)
    .join(' ');
  const nextStagePreview = nextStageText
    ? nextStageText.substring(0, 150) + '…'
    : 'Continue to the next day.';

  const hasMilepostText = reflectionText.trim().length > 0;
  const secondLookBusy  = secondLookLoading || secondLookStreaming;

  // ── "Today's Move" — v1 single blob (used when PRACTICE_DAY_V2 is false, or
  // as fallback when no per-component fields are present). ──
  const todaysMove = ['framework', 'demonstration', 'failure_mode', 'application']
    .map(k => dayData[k])
    .filter(v => typeof v === 'string' && v.trim().length > 0)
    .join('\n\n');

  // Phase 1 beats: only include components that have text so partial/legacy
  // days don't show empty panels.
  const practiceBeats = PRACTICE_BEATS
    .map(beat => ({
      ...beat,
      text: typeof dayData[beat.key] === 'string' ? dayData[beat.key].trim() : '',
    }))
    .filter(beat => beat.text.length > 0);
  const usePracticeLayout = PRACTICE_DAY_V2 && practiceBeats.length > 0;

  // ── Milepost hints, sourced from summit_days.hints (jsonb array). Render all
  // of them; if the array is missing or empty, render nothing. ──
  const milepostHints = Array.isArray(dayData.hints)
    ? dayData.hints.map(h => String(h)).filter(h => h.trim().length > 0)
    : [];

  return (
    <>
      <div className="ambient-glow" />
      <nav className="glass-nav">
        <div className="nav-content">
          <Link href="/library" className="logo">
            <img src="/SummitSkills-Logo.png" alt="SummitSkills" className="logo-img" />
            Summit<span>Skills</span>
          </Link>
          <div className="nav-actions">
            <Link href="/library" className="btn-outline small">Exit to Library</Link>
          </div>
        </div>
      </nav>
      {/* ── maxWidth scaled down to standard blog width (768px) to reduce zoomed-in feel ── */}
      <main className={`container day-main ${coachOpen ? 'day-main-with-coach' : ''}`} style={{ maxWidth: 768, paddingTop: 40, paddingBottom: 80 }}>
        {/* Sprint header */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ marginBottom: 28 }}>
            <div className="tag-featured" style={{ marginBottom: 16 }}>
              <div className="pulse-dot" />
              <span style={{ fontFamily: "'DM Mono', monospace" }}>Day {dayNum}</span>
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
              {[1,2,3,4,5,6,7].map(stage => {
                const stageData  = allDays.find(d => d.day_number === stage);
                const isComplete = stage < dayNum;
                const isCurrent  = stage === dayNum;
                const skill      = stageData?.skill_focus;
                return (
                  <div
                    key={stage}
                    title={skill ? `Day ${stage}: ${skill}` : undefined}
                    style={{
                      flex: 1,
                      height: 5,
                      borderRadius: 3,
                      background: isComplete
                        ? 'var(--brand-teal)'
                        : isCurrent
                        ? 'rgba(25,190,227,0.5)'
                        : 'rgba(255,255,255,0.08)',
                      transition: 'background 0.3s ease',
                      cursor: skill ? 'default' : undefined,
                    }}
                  />
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>Progress</span>
              <span style={{ fontFamily: "'DM Mono', monospace", color: 'var(--brand-teal)', fontWeight: 600 }}>
                {progressPercent}% complete
              </span>
            </div>
          </div>
        </div>
        
        {/* Stage content */}
        <div style={{ marginBottom: 40, textAlign: 'left' }}>
          {/* ── Title font scaled down from 2.75rem to 2rem ── */}
          <h2 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 10 }}>
            {dayData.title}
          </h2>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(25,190,227,0.5)', margin: 0 }}>
            Day {dayNum} of 7
          </p>
          {/* Skill focus tag — only renders once skill_focus is populated in the DB */}
          {dayData.skill_focus && (
            <div style={{
              display: 'inline-block',
              marginTop: 12,
              fontFamily: "'DM Mono', monospace",
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'rgba(25,190,227,0.55)',
              border: '1px solid rgba(25,190,227,0.2)',
              borderRadius: 20,
              padding: '4px 14px',
            }}>
              {dayData.skill_focus}
            </div>
          )}
        </div>

        {/* ── Return loop: continuity strip (Days 2–7) ───────────────── */}
        {RETURN_LOOP_V1 && dayNum > 1 && (situationText || yesterdayNote) && (
          <div
            className="glass-panel"
            style={{
              marginBottom: 20,
              padding: '14px 18px',
              borderColor: 'rgba(25,190,227,0.28)',
              background: 'rgba(25,190,227,0.06)',
            }}
          >
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '0.66rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--brand-teal)',
              marginBottom: 8,
            }}>
              Still your week
            </div>
            {situationText && (
              <p style={{ margin: '0 0 6px 0', fontSize: '0.95rem', lineHeight: 1.5, color: 'var(--text-main)' }}>
                <span style={{ color: 'rgba(255,255,255,0.45)' }}>Working with: </span>
                {situationText}
              </p>
            )}
            {yesterdayNote && (
              <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.5, color: 'rgba(238,242,247,0.75)' }}>
                <span style={{ color: 'rgba(255,255,255,0.45)' }}>Yesterday you: </span>
                {yesterdayNote}
              </p>
            )}
          </div>
        )}

        {/* ── Return loop: name the situation (Day 1) ─────────────────── */}
        {RETURN_LOOP_V1 && dayNum === 1 && (
          <div className="glass-panel" style={{ marginBottom: 20, padding: '18px 20px' }}>
            <div className="tag-featured" style={{ marginBottom: 10 }}>
              Your situation this week
            </div>
            <p style={{
              fontSize: '0.88rem',
              lineHeight: 1.5,
              color: 'rgba(238,242,247,0.55)',
              margin: '0 0 12px 0',
            }}>
              One person, habit, or thread you will keep in mind all seven days.
              Days 2–7 will come back to this — so the week is about <em>your</em> work, not generic tips.
            </p>
            <textarea
              className="journal-input"
              value={situationText}
              onChange={e => setSituationText(e.target.value)}
              onBlur={saveSituation}
              placeholder="e.g. Status updates from Jordan that never land before standup"
              rows={2}
              style={{ minHeight: 64, marginBottom: 0 }}
            />
          </div>
        )}

        {/* Today's Move — Phase 1 practice layout (flag) or legacy single blob */}
        {usePracticeLayout ? (
          <div style={{ marginBottom: 24 }}>
            <div className="tag-featured" style={{ marginBottom: 14 }}>
              <div className="pulse-dot" />
              Today&apos;s Move
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {practiceBeats.map((beat) => (
                <div
                  key={beat.key}
                  className="glass-panel"
                  style={{
                    marginBottom: 0,
                    padding: '18px 20px',
                    ...beat.panelStyle,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: '0.66rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: beat.key === 'failure_mode'
                        ? 'rgba(251, 146, 60, 0.85)'
                        : 'var(--brand-teal)',
                      marginBottom: 10,
                    }}
                  >
                    {beat.label}
                  </div>
                  <div
                    style={{
                      whiteSpace: 'pre-wrap',
                      color: 'var(--text-main)',
                      ...beat.bodyStyle,
                    }}
                  >
                    {beat.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="glass-panel" style={{ marginBottom: 24 }}>
            <div className="tag-featured">
              <div className="pulse-dot" />
              Today&apos;s Move
            </div>
            <div style={{ fontSize: '1rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', color: 'var(--text-main)' }}>
              {todaysMove}
            </div>
          </div>
        )}
        {/* Milepost */}
        {dayData.milepost && (
          <div className="glass-panel" style={{
            marginBottom: 24,
            ...(dayNum === 7 && {
              borderColor: 'rgba(25,190,227,0.35)',
              boxShadow: '0 0 24px rgba(25,190,227,0.08)',
            })
          }}>
            <div className="tag-featured">
              {dayNum === 7 ? 'Your Commitment' : 'Milepost'}
            </div>
            <p style={{ fontSize: '1rem', fontStyle: 'italic', marginBottom: 16, color: 'var(--text-main)', lineHeight: 1.5 }}>
              {dayData.milepost}
            </p>
            {/* Milepost hints, sourced from summit_days.hints (jsonb array) */}
            {milepostHints.map((hint, i) => (
              <p key={i} style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)', marginBottom: 16, lineHeight: 1.5 }}>
                {hint}
              </p>
            ))}
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

            {/* Stuck hint — appears when the user has typed little or nothing.
                Clicking opens the Summit Coach widget. */}
            {reflectionText.trim().length < 20 && (
              <button
                type="button"
                onClick={() => setCoachOpen(true)}
                style={{
                  margin: '10px 0 0 0',
                  padding: 0,
                  background: 'none',
                  border: 'none',
                  fontSize: '0.78rem',
                  color: 'rgba(25,190,227,0.7)',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--brand-teal)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(25,190,227,0.7)'}
              >
                Stuck? Ask your Summit Coach for a draft. →
              </button>
            )}

            {/* ── Second-look button row (Phase 2) ──────────────────── */}
            <div style={{
              marginTop: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
            }}>
              <button
                type="button"
                onClick={getSecondLook}
                disabled={!hasMilepostText || secondLookBusy}
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  padding: '9px 16px',
                  borderRadius: 10,
                  border: '1px solid rgba(25,190,227,0.35)',
                  background: hasMilepostText && !secondLookBusy ? 'rgba(25,190,227,0.08)' : 'rgba(25,190,227,0.03)',
                  color: hasMilepostText && !secondLookBusy ? 'var(--brand-teal)' : 'rgba(25,190,227,0.4)',
                  cursor: hasMilepostText && !secondLookBusy ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
                onMouseEnter={e => {
                  if (hasMilepostText && !secondLookBusy) {
                    e.currentTarget.style.background    = 'rgba(25,190,227,0.14)';
                    e.currentTarget.style.borderColor   = 'rgba(25,190,227,0.55)';
                  }
                }}
                onMouseLeave={e => {
                  if (hasMilepostText && !secondLookBusy) {
                    e.currentTarget.style.background    = 'rgba(25,190,227,0.08)';
                    e.currentTarget.style.borderColor   = 'rgba(25,190,227,0.35)';
                  }
                }}
              >
                {secondLookLoading
                  ? 'Coach is reading...'
                  : secondLookStreaming
                  ? 'Coach is responding...'
                  : coachObservation
                  ? 'Get another look'
                  : 'Get a second look'}
              </button>

              {/* Optional helper text on the right */}
              <span style={{
                fontSize: '0.72rem',
                color: 'rgba(255,255,255,0.35)',
                fontFamily: 'var(--font-sans)',
              }}>
                Optional. Your coach reads it and gives one observation.
              </span>
            </div>

            {/* ── Coach observation panel ─────────────────────────────── */}
            {showCoachPanel && (
              <div style={{
                marginTop: 16,
                padding: '16px 18px',
                borderRadius: 12,
                background: 'rgba(25,190,227,0.05)',
                border: '1px solid rgba(25,190,227,0.18)',
                position: 'relative',
                animation: 'coachPanelFadeIn 0.25s ease',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                }}>
                  <div style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: '0.66rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--brand-teal)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}>
                    <span className="pulse-dot" />
                    Summit Coach
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCoachPanel(false)}
                    aria-label="Dismiss"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'rgba(255,255,255,0.35)',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      padding: '2px 6px',
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>

                {secondLookLoading && !coachObservation && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0' }}>
                    {[0,1,2].map(i => (
                      <span key={i} style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: 'var(--brand-teal)', opacity: 0.4,
                        animation: `coachPanelPulse 1.2s ease ${i * 0.18}s infinite`,
                      }} />
                    ))}
                  </div>
                )}

                {coachObservation && (
                  <div style={{
                    fontSize: '0.95rem',
                    lineHeight: 1.65,
                    color: 'var(--text-main)',
                    fontFamily: 'var(--font-sans)',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {coachObservation}
                    {secondLookStreaming && (
                      <span style={{
                        display: 'inline-block',
                        width: 2,
                        height: 14,
                        background: 'var(--brand-teal)',
                        marginLeft: 2,
                        verticalAlign: 'middle',
                        animation: 'coachPanelBlink 0.8s ease infinite',
                      }} />
                    )}
                  </div>
                )}

                {secondLookError && (
                  <div style={{
                    fontSize: '0.85rem',
                    color: '#f87171',
                    marginTop: 4,
                  }}>
                    {secondLookError}
                  </div>
                )}
              </div>
            )}

            {/* Day 7 nudge */}
            {dayNum === 7 && (
              <p style={{ fontSize: '0.78rem', color: 'rgba(25,190,227,0.6)', marginTop: 12, lineHeight: 1.5 }}>
                This is the one sentence that makes next week different. Take 60 seconds and write yours.
              </p>
            )}
          </div>
        )}
        {/* Mission */}
        {dayData.summit_mission && (
          <div className="glass-panel mission-panel highlighted" style={{ marginBottom: 32 }}>
            <div className="tag-featured">Today&apos;s Mission</div>
            <p style={{ fontSize: '1rem', marginBottom: RETURN_LOOP_V1 ? 16 : 28, lineHeight: 1.6, color: 'var(--text-main)' }}>
              {dayData.summit_mission}
            </p>
            {/* Optional proof — still non-blocking. Tomorrow opens on this line. */}
            {RETURN_LOOP_V1 && (
              <div style={{ marginBottom: 20 }}>
                <label style={{
                  display: 'block',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '0.66rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'rgba(25,190,227,0.75)',
                  marginBottom: 8,
                }}>
                  What I did <span style={{ fontWeight: 500, opacity: 0.7 }}>(optional — one line)</span>
                </label>
                <textarea
                  className="journal-input"
                  value={missionNote}
                  onChange={e => setMissionNote(e.target.value)}
                  onBlur={saveMissionNote}
                  placeholder="e.g. Put the one-line routine at the top of Todoist before standup"
                  rows={2}
                  style={{ minHeight: 56, marginBottom: 6 }}
                />
                <p style={{
                  margin: 0,
                  fontSize: '0.72rem',
                  color: 'rgba(255,255,255,0.35)',
                  lineHeight: 1.4,
                }}>
                  Write what you actually did on real work. Tomorrow will show this back to you.
                </p>
              </div>
            )}
            <button
              onClick={toggleMission}
              className="btn-primary-large"
            >
              {missionComplete ? (
                <>
                  <Check size={20} strokeWidth={2.5} />
                  Day Complete
                </>
              ) : (
                <>
                  Mark Day Complete
                  <span className="arrow" style={{ fontSize: '1.1em' }}>→</span>
                </>
              )}
            </button>
          </div>
        )}
        
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
                e.currentTarget.style.color       = 'var(--brand-teal)';
                e.currentTarget.style.borderColor = 'rgba(25,190,227,0.35)';
                e.currentTarget.style.background  = 'rgba(25,190,227,0.05)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color       = 'rgba(25,190,227,0.45)';
                e.currentTarget.style.borderColor = 'rgba(25,190,227,0.15)';
                e.currentTarget.style.background  = 'transparent';
              }}
            >
              Explore Further →
            </Link>
          </div>
        )}
        {/* Stage navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginTop: 40 }}>
          {dayNum > 1 ? (
            <Link href={`/summit/${id}/day/${dayNum - 1}`} className="btn-outline" style={{ textAlign: 'center' }}>
              <span style={{ fontFamily: "'DM Mono', monospace" }}>← Day {dayNum - 1}</span>
            </Link>
          ) : dayNum === 1 && book?.sprint_intro ? (
            <Link href={`/summit/${id}/day/0`} className="btn-outline" style={{ textAlign: 'center' }}>
              <span style={{ fontFamily: "'DM Mono', monospace" }}>← Day 0</span>
            </Link>
          ) : (
            <div /> /* ── Spacer on Day 1 so the Next button stays right-anchored ── */
          )}
          {dayNum < 7 && missionComplete && (
            <Link href={`/summit/${id}/day/${dayNum + 1}`} className="btn-primary" style={{ textAlign: 'center' }}>
              <span style={{ fontFamily: "'DM Mono', monospace" }}>Day {dayNum + 1} →</span>
            </Link>
          )}
        </div>
      </main>
      <CompletionCelebration
        isOpen={showCelebration}
        onClose={handleCloseCelebration}
        dayNum={dayNum}
        bookTitle={book.sprint_title || book.title}
        nextDayTitle={nextDayData?.title || `Day ${dayNum + 1}`}
        nextDayPreview={nextStagePreview}
        nextDayUrl={`/summit/${id}/day/${dayNum + 1}`}
      />
      <SummitCoach
        bookId={id}
        dayNum={dayNum}
        userId={user?.id}
        isOpen={coachOpen}
        onOpenChange={setCoachOpen}
      />
      {/* Pacing nudge — disabled. Was creating friction for motivated users (gating Day 2 within an hour of Day 1). Re-enable if engagement data shows users binge through the sprint and don't return.
      {!pacingDismissed && dayNum > 1 && (
        <PacingNudge
          dayNum={dayNum}
          previousDayProgress={previousDayProgress}
          onContinue={() => setPacingDismissed(true)}
        />
      )}
      */}

      {/* Animations for the second-look panel */}
      <style>{`
        @keyframes coachPanelFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes coachPanelPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%      { opacity: 1;   transform: scale(1.25); }
        }
        @keyframes coachPanelBlink {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0; }
        }
      `}</style>
    </>
  );
} 