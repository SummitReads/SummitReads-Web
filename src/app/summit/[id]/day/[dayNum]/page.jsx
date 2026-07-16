"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { supabase } from '@/app/supabaseClient';
import CompletionCelebration from '@/components/CompletionCelebration';
import SummitCoach from '@/components/SummitCoach';
import Day0View from '@/components/Day0View';
import { type, t } from '@/lib/typeScale';
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

// Beat labels. Hierarchy = number badge + label color + card chrome, NOT body size.
// All practice prose uses type.body (SaaS type-scale rule).
const PRACTICE_BEATS = [
  { key: 'framework',     label: 'The move',      num: 1, accent: 'teal' },
  { key: 'demonstration', label: 'Watch this',    num: 2, accent: 'teal' },
  { key: 'failure_mode',  label: 'Where it dies', num: 3, accent: 'amber' },
  { key: 'application',   label: 'Your turn',     num: 4, accent: 'teal' },
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

  // Milepost hints — show at most one quiet helper (not a rubric wall).
  const milepostHints = Array.isArray(dayData.hints)
    ? dayData.hints.map(h => String(h)).filter(h => h.trim().length > 0)
    : [];
  const primaryHint = milepostHints[0] || '';

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
      {/* Day 0-aligned reading width */}
      <main className={`container day-main ${coachOpen ? 'day-main-with-coach' : ''}`} style={{ maxWidth: 680, paddingTop: 40, paddingBottom: 100 }}>
        {/* ── Header (matches Day 0 chrome) ──────────────────────────── */}
        <div style={{ marginBottom: 28 }}>
          <div className="tag-featured" style={{ marginBottom: 12 }}>
            <div className="pulse-dot" />
            <span style={{ fontFamily: "'DM Mono', monospace" }}>Day {dayNum}</span>
            <span style={{ color: 'rgba(25,190,227,0.5)' }}>/</span>
            <span style={{ fontFamily: "'DM Mono', monospace" }}>7</span>
            <span style={{ color: 'rgba(25,190,227,0.5)', margin: '0 4px' }}>·</span>
            <span style={{ fontFamily: 'var(--font-sans)' }}>Practice</span>
          </div>
          <p style={t('label', { margin: '0 0 6px 0', color: 'rgba(25,190,227,0.7)' })}>
            {book.sprint_title || book.title}
          </p>
          <h1
            className="text-gradient"
            style={t('display', { margin: '0 0 10px 0' })}
          >
            {dayData.title}
          </h1>
          {/* Practice N of 6 when skill_focus is the bound teaching name (spine mode) */}
          {dayData.skill_focus && dayNum >= 1 && dayNum <= 6 && (
            <p style={t('bodyMuted', {
              margin: '0 0 8px 0',
              color: 'rgba(238,242,247,0.65)',
              lineHeight: 1.4,
            })}>
              <span style={t('label', {
                display: 'inline',
                marginRight: 8,
                color: 'var(--brand-teal)',
              })}>
                Practice {dayNum} of 6
              </span>
              {dayData.skill_focus}
            </p>
          )}
          {dayData.skill_focus && dayNum === 7 && (
            <p style={t('caption', { margin: '0 0 16px 0', color: 'rgba(238,242,247,0.5)' })}>
              {dayData.skill_focus}
            </p>
          )}
          {/* Quiet progress — secondary to content */}
          <div style={{ display: 'flex', gap: 5, marginBottom: 6 }}>
            {[1, 2, 3, 4, 5, 6, 7].map(stage => {
              const stageData = allDays.find(d => d.day_number === stage);
              const isComplete = stage < dayNum;
              const isCurrent = stage === dayNum;
              return (
                <div
                  key={stage}
                  title={stageData?.skill_focus ? `Day ${stage}: ${stageData.skill_focus}` : `Day ${stage}`}
                  style={{
                    flex: 1,
                    height: 3,
                    borderRadius: 2,
                    background: isComplete
                      ? 'var(--brand-teal)'
                      : isCurrent
                      ? 'rgba(25,190,227,0.55)'
                      : 'rgba(255,255,255,0.08)',
                  }}
                />
              );
            })}
          </div>
          <div style={t('caption', {
            fontFamily: "'DM Mono', monospace",
            fontSize: '0.65rem',
            color: 'rgba(255,255,255,0.28)',
            letterSpacing: '0.04em',
          })}>
            {progressPercent}% through the sprint
          </div>
        </div>

        {/* ── Continuity (Days 2–7) — quiet, like Day 0 chrome ───────── */}
        {RETURN_LOOP_V1 && dayNum > 1 && (situationText || yesterdayNote) && (
          <div
            style={{
              marginBottom: 24,
              padding: '12px 14px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div style={t('label', { marginBottom: 8, color: 'rgba(255,255,255,0.35)' })}>
              Still your week
            </div>
            {situationText && (
              <p style={t('bodyMuted', { margin: '0 0 4px 0', lineHeight: 1.45, color: 'rgba(238,242,247,0.75)' })}>
                <span style={{ color: 'rgba(255,255,255,0.35)' }}>Working with · </span>
                {situationText}
              </p>
            )}
            {yesterdayNote && (
              <p style={t('caption', { margin: 0, color: 'rgba(238,242,247,0.55)' })}>
                <span style={{ color: 'rgba(255,255,255,0.35)' }}>Yesterday · </span>
                {yesterdayNote}
              </p>
            )}
          </div>
        )}

        {/* ── Day 1 situation (same voice as Day 0) ──────────────────── */}
        {RETURN_LOOP_V1 && dayNum === 1 && !situationText && (
          <div
            className="glass-panel"
            style={{
              marginBottom: 24,
              padding: '18px 18px',
              borderColor: 'rgba(25,190,227,0.3)',
              background: 'rgba(25,190,227,0.05)',
            }}
          >
            <div style={t('label', { marginBottom: 10 })}>Your situation this week</div>
            <p style={t('bodyMuted', { margin: '0 0 12px 0', color: 'rgba(238,242,247,0.72)' })}>
              Name one real thread you will practice on — a person, habit, or friction at work.
              Every day comes back to this.
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
        {/* If already set on Day 0, show a quiet reminder they can edit */}
        {RETURN_LOOP_V1 && dayNum === 1 && situationText && (
          <div
            style={{
              marginBottom: 24,
              padding: '12px 14px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div style={t('label', { marginBottom: 6, color: 'rgba(255,255,255,0.35)' })}>
              Your situation this week
            </div>
            <textarea
              className="journal-input"
              value={situationText}
              onChange={e => setSituationText(e.target.value)}
              onBlur={saveSituation}
              rows={2}
              style={{ minHeight: 52, marginBottom: 0, background: 'transparent' }}
            />
          </div>
        )}

        {/* ── Today&apos;s practice — numbered beats (Day 0 card language) ─ */}
        {usePracticeLayout ? (
          <section style={{ marginBottom: 32 }}>
            <div style={t('label', { marginBottom: 14 })}>Today&apos;s practice</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {practiceBeats.map((beat) => {
                const isFail = beat.accent === 'amber';
                const isApp = beat.key === 'application';
                return (
                  <div
                    key={beat.key}
                    style={{
                      display: 'flex',
                      gap: 14,
                      padding: isApp ? '16px 16px' : '14px 16px',
                      borderRadius: 12,
                      border: isFail
                        ? '1px solid rgba(251, 146, 60, 0.22)'
                        : isApp
                        ? '1px solid rgba(25,190,227,0.28)'
                        : '1px solid rgba(255,255,255,0.08)',
                      background: isFail
                        ? 'rgba(251, 146, 60, 0.04)'
                        : isApp
                        ? 'rgba(25,190,227,0.05)'
                        : 'rgba(15, 23, 42, 0.55)',
                    }}
                  >
                    <div
                      style={{
                        flexShrink: 0,
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: isFail
                          ? 'rgba(251, 146, 60, 0.12)'
                          : 'rgba(25,190,227,0.12)',
                        border: isFail
                          ? '1px solid rgba(251, 146, 60, 0.3)'
                          : '1px solid rgba(25,190,227,0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        ...type.badge,
                        color: isFail ? 'rgba(251, 146, 60, 0.95)' : 'var(--brand-teal)',
                      }}
                    >
                      {beat.num}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={t('label', {
                        marginBottom: 6,
                        color: isFail ? 'rgba(251, 146, 60, 0.85)' : 'var(--brand-teal)',
                      })}>
                        {beat.label}
                      </div>
                      {/* Same body size for all four steps — hierarchy via badge/label/card */}
                      <div style={t('body', { whiteSpace: 'pre-wrap' })}>
                        {beat.text}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          <div className="glass-panel" style={{ marginBottom: 24 }}>
            <div style={t('label', { marginBottom: 12 })}>Today&apos;s practice</div>
            <div style={t('body', { whiteSpace: 'pre-wrap' })}>
              {todaysMove}
            </div>
          </div>
        )}

        {/* ── Write it down (milepost) — one prompt, one field ───────── */}
        {dayData.milepost && (
          <section
            className="glass-panel"
            style={{
              marginBottom: 16,
              padding: '18px 18px',
              ...(dayNum === 7 ? {
                borderColor: 'rgba(25,190,227,0.35)',
              } : {}),
            }}
          >
            <div style={t('label', { marginBottom: 10 })}>
              {dayNum === 7 ? 'Your commitment' : 'Write it down'}
            </div>
            <p style={t('bodyEmphasis', { margin: '0 0 12px 0', lineHeight: 1.5 })}>
              {dayData.milepost}
            </p>
            {primaryHint && (
              <p style={t('caption', { margin: '0 0 12px 0', color: 'rgba(255,255,255,0.38)' })}>
                {primaryHint}
              </p>
            )}
            {/* Full madlib as quiet shape guide — not a large input placeholder */}
            {dayData.madlib_template && (
              <div
                style={{
                  marginBottom: 10,
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div style={t('label', {
                  marginBottom: 6,
                  color: 'rgba(255,255,255,0.32)',
                  fontSize: '0.6rem',
                })}>
                  Shape guide
                </div>
                <p style={t('caption', { margin: 0, color: 'rgba(238,242,247,0.48)' })}>
                  {dayData.madlib_template}
                </p>
              </div>
            )}
            <textarea
              className="journal-input"
              value={reflectionText}
              onChange={e => setReflectionText(e.target.value)}
              onBlur={saveReflection}
              placeholder={
                dayNum === 7
                  ? 'Write your commitment in one or two lines…'
                  : 'Write yours from real work…'
              }
              style={{
                minHeight: dayNum === 7 ? 100 : 72,
                marginBottom: 0,
                fontSize: type.body.fontSize,
              }}
            />

            {/* Coach — secondary, not competing with the practice */}
            <div style={{
              marginTop: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              flexWrap: 'wrap',
            }}>
              {reflectionText.trim().length < 20 && (
                <button
                  type="button"
                  onClick={() => setCoachOpen(true)}
                  style={{
                    margin: 0,
                    padding: 0,
                    background: 'none',
                    border: 'none',
                    ...type.caption,
                    color: 'rgba(25,190,227,0.55)',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Stuck? Ask coach →
                </button>
              )}
              <button
                type="button"
                onClick={getSecondLook}
                disabled={!hasMilepostText || secondLookBusy}
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: type.caption.fontSize,
                  fontWeight: 600,
                  padding: '7px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(25,190,227,0.25)',
                  background: 'transparent',
                  color: hasMilepostText && !secondLookBusy ? 'rgba(25,190,227,0.85)' : 'rgba(25,190,227,0.35)',
                  cursor: hasMilepostText && !secondLookBusy ? 'pointer' : 'not-allowed',
                }}
              >
                {secondLookLoading
                  ? 'Reading…'
                  : secondLookStreaming
                  ? 'Responding…'
                  : coachObservation
                  ? 'Another look'
                  : 'Second look'}
              </button>
            </div>

            {showCoachPanel && (
              <div style={{
                marginTop: 14,
                padding: '14px 16px',
                borderRadius: 12,
                background: 'rgba(25,190,227,0.05)',
                border: '1px solid rgba(25,190,227,0.15)',
                animation: 'coachPanelFadeIn 0.25s ease',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}>
                  <div style={t('label', { display: 'inline-flex', alignItems: 'center', gap: 6 })}>
                    Coach
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
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: 'var(--brand-teal)', opacity: 0.4,
                        animation: `coachPanelPulse 1.2s ease ${i * 0.18}s infinite`,
                      }} />
                    ))}
                  </div>
                )}
                {coachObservation && (
                  <div style={t('body', { whiteSpace: 'pre-wrap' })}>
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
                  <div style={t('caption', { color: '#f87171', marginTop: 4 })}>
                    {secondLookError}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* ── Do it + complete (Day 0 CTA energy) ────────────────────── */}
        {dayData.summit_mission && (
          <section
            className="glass-panel mission-panel highlighted"
            style={{ marginBottom: 28, padding: '20px 18px' }}
          >
            <div style={t('label', { marginBottom: 10 })}>Do it now</div>
            <p style={t('bodyEmphasis', { margin: '0 0 16px 0', lineHeight: 1.55 })}>
              {dayData.summit_mission}
            </p>
            {RETURN_LOOP_V1 && (
              <div style={{ marginBottom: 16 }}>
                <label style={t('label', {
                  display: 'block',
                  marginBottom: 8,
                  color: 'rgba(25,190,227,0.7)',
                })}>
                  What I did <span style={{ fontWeight: 500, opacity: 0.65 }}>(optional)</span>
                </label>
                <textarea
                  className="journal-input"
                  value={missionNote}
                  onChange={e => setMissionNote(e.target.value)}
                  onBlur={saveMissionNote}
                  placeholder="One line on what you actually did…"
                  rows={2}
                  style={{ minHeight: 52, marginBottom: 0 }}
                />
              </div>
            )}
            <button
              onClick={toggleMission}
              className="btn-primary-large"
              style={{ width: '100%' }}
            >
              {missionComplete ? (
                <>
                  <Check size={20} strokeWidth={2.5} />
                  Day complete
                </>
              ) : (
                <>
                  Mark day complete
                  <span className="arrow" style={{ fontSize: '1.1em' }}>→</span>
                </>
              )}
            </button>
          </section>
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