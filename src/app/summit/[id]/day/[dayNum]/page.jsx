"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { supabase } from '@/app/supabaseClient';
import CompletionCelebration from '@/components/CompletionCelebration';
import SummitCoach from '@/components/SummitCoach';
import Day0View from '@/components/Day0View';
import PracticeProse from '@/components/PracticeProse';
import BrandLogo from '@/components/BrandLogo';
import {
  displaySprintTitle,
  displayReflectionText,
  progressNotesToText,
  progressNotesToDb,
} from '@/lib/sprintDisplay';
import { type, t } from '@/lib/typeScale';
// import PacingNudge from '@/components/PacingNudge'; // Disabled — friction without proven value. Re-enable if completion data shows binge-and-forget pattern.

// ── Phase 1: Practice-day layout ─────────────────────────────────────────────
// When true, "Today's Move" renders as labeled beats instead of one prose blob.
// Rollback: set to false and hard-refresh — no DB or API changes.
const PRACTICE_DAY_V2 = true;

// ── Lean day loop ────────────────────────────────────────────────────────────
// One teach path: skill → example → common miss → write once → do once → done.
// Hides the redundant "application" beat (overlaps Write it down / Do it now),
// shows only one of hint OR shape guide, and bridges mission to the milepost line.
// Rollback: set false.
const LEAN_DAY_V1 = true;

// ── Practice / return loop (continuity + proof + outcome) ───────────────────
// Behavioral change loop (non-blocking — never gates "Mark day complete"):
//   1) Situation this week — Day 1 progress_notes, echoed Days 2–7 when set
//   2) What I did — optional action_commitment; shown next day only if filled
//   3) What happened — optional evening_reflection on the day of the attempt;
//      prompted on Day N+1 only when yesterday has a "What I did"
// Empty prior fields → no blank chrome (strip only renders when there is content).
// Rollback: set false.
const RETURN_LOOP_V1 = true;

// ── Explore Further (deep dive) entry point ──────────────────────────────────
// Render-only kill switch for the "Explore Further" link that leads to the
// /deep view (bonus_content: extended_reading / real_examples / reflection_prompts
// / action_challenges). Hidden for now so the day ends cleanly after "What I did".
// The /deep route, its data, and all Supabase queries are untouched.
// Re-enable: set true and hard-refresh — no DB or API changes.
const SHOW_EXPLORE = false;

// Beat labels. Hierarchy = number badge + label color + card chrome, NOT body size.
// All practice prose uses type.body (SaaS type-scale rule).
// Lean mode shows only the first three (application is folded into Write / Do).
const PRACTICE_BEATS = [
  { key: 'framework',     label: 'The skill',    num: 1, accent: 'teal' },
  { key: 'demonstration', label: 'In practice',  num: 2, accent: 'teal' },
  { key: 'failure_mode',  label: 'Common miss',  num: 3, accent: 'amber' },
  { key: 'application',   label: 'Apply it',     num: 4, accent: 'teal' },
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
  const [suggestedNext,       setSuggestedNext]       = useState(null);
  const [pacingDismissed,     setPacingDismissed]     = useState(false);
  const [coachOpen,           setCoachOpen]           = useState(false);

  // ── Return loop (situation + mission proof + outcome) ───────────────
  const [situationText,       setSituationText]       = useState('');
  const [missionNote,         setMissionNote]         = useState('');
  const [yesterdayNote,       setYesterdayNote]       = useState('');
  // Outcome of *yesterday's* attempt (stored on prior day as evening_reflection)
  const [yesterdayOutcome,    setYesterdayOutcome]    = useState('');
  // Optional same-day outcome if they already know what happened
  const [todayOutcome,        setTodayOutcome]        = useState('');
  // Completed days 1–7 for this book (progress bar = completion, not page position)
  const [completedDaysCount,  setCompletedDaysCount]  = useState(0);
  /** Day numbers 1–7 with completed === true (progress bar — not dayNum-1) */
  const [completedDayNumbers, setCompletedDayNumbers] = useState([]);

  // ── Second-look state (Phase 2) ──────────────────────────────────────
  const [coachObservation,     setCoachObservation]     = useState('');
  const [secondLookLoading,    setSecondLookLoading]    = useState(false);
  const [secondLookStreaming,  setSecondLookStreaming]  = useState(false);
  const [showCoachPanel,       setShowCoachPanel]       = useState(false);
  const [secondLookError,      setSecondLookError]      = useState(null);
  const [startingDay1,         setStartingDay1]         = useState(false);
  const secondLookAbortRef = useRef(null);

  // Latest draft text — always read from here on save/flush so navigation
  // never depends on a stale render closure or a lost blur race.
  const draftsRef = useRef({
    reflection: '',
    situation: '',
    missionNote: '',
    yesterdayOutcome: '',
    todayOutcome: '',
    yesterdayNote: '',
  });
  const userRef = useRef(null);
  userRef.current = user;

  function setDraft(field, value) {
    draftsRef.current[field] = value;
  }

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
        // Public product: only shippable sprints (review_status=approved).
        // Sprints in repair stay in admin pipeline until every day clears ≥ 8.5.
        if (bookData.review_status && bookData.review_status !== 'approved') {
          setError('This skill sprint is not available yet. Pick one from the library.');
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
            if (day1Progress?.progress_notes != null) {
              const s = progressNotesToText(day1Progress.progress_notes);
              setSituationText(s);
              setDraft('situation', s);
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
        // Prefer individual_contributor (canonical context); fall back to any row
        // if an older/default context was written.
        let dayQuery = await supabase
          .from('summit_days')
          .select('*')
          .eq('book_id', id)
          .eq('day_number', dayNum)
          .eq('learner_context', 'individual_contributor')
          .maybeSingle();
        let currentDayData = dayQuery.data;
        let dayError = dayQuery.error;
        if (!currentDayData && !dayError) {
          dayQuery = await supabase
            .from('summit_days')
            .select('*')
            .eq('book_id', id)
            .eq('day_number', dayNum)
            .limit(1)
            .maybeSingle();
          currentDayData = dayQuery.data;
          dayError = dayQuery.error;
        }
        if (dayNum < 7) {
          let nextQuery = await supabase
            .from('summit_days')
            .select('title, framework, demonstration, failure_mode, application')
            .eq('book_id', id)
            .eq('day_number', dayNum + 1)
            .eq('learner_context', 'individual_contributor')
            .maybeSingle();
          if (!nextQuery.data) {
            nextQuery = await supabase
              .from('summit_days')
              .select('title, framework, demonstration, failure_mode, application')
              .eq('book_id', id)
              .eq('day_number', dayNum + 1)
              .limit(1)
              .maybeSingle();
          }
          setNextDayData(nextQuery.data || null);
        }
        // Day 7: suggest another approved sprint for the post-Summit loop
        if (dayNum === 7) {
          const { data: otherBooks } = await supabase
            .from('books')
            .select('id, sprint_title, sprint_skill, title, category')
            .eq('review_status', 'approved')
            .neq('id', id)
            .limit(40);
          if (otherBooks?.length) {
            const sameCat = bookData.category
              ? otherBooks.filter((b) => b.category === bookData.category)
              : [];
            const pool = sameCat.length ? sameCat : otherBooks;
            const pick = pool[Math.floor(Math.random() * pool.length)];
            setSuggestedNext({
              id: pick.id,
              title: displaySprintTitle(pick),
            });
          }
        }
        if (currentUser && dayNum > 1) {
          const { data: prevProgress } = await supabase
            .from('user_progress')
            .select('completed_at, completed, action_commitment, evening_reflection, unlocked_at')
            .eq('user_id', currentUser.id)
            .eq('book_id', id)
            .eq('day_number', dayNum - 1)
            .maybeSingle();
          setPreviousDayProgress(prevProgress);
          const yn = prevProgress?.action_commitment
            ? String(prevProgress.action_commitment).trim()
            : '';
          const yo = prevProgress?.evening_reflection
            ? String(prevProgress.evening_reflection).trim()
            : '';
          setYesterdayNote(yn);
          setDraft('yesterdayNote', yn);
          setYesterdayOutcome(yo);
          setDraft('yesterdayOutcome', yo);
        } else {
          setPreviousDayProgress(null);
          setYesterdayNote('');
          setDraft('yesterdayNote', '');
          setYesterdayOutcome('');
          setDraft('yesterdayOutcome', '');
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
            // reflection_data is jsonb — normalize to string for the controlled field
            const refRaw = currentProgress.reflection_data;
            const refText = typeof refRaw === 'string'
              ? refRaw
              : (refRaw?.text != null ? String(refRaw.text) : (refRaw ? String(refRaw) : ''));
            setReflectionText(refText);
            setDraft('reflection', refText);
            setMissionComplete(currentProgress.completed === true);
            if (currentProgress.action_commitment) {
              const mn = String(currentProgress.action_commitment).trim();
              setMissionNote(mn);
              setDraft('missionNote', mn);
            } else {
              setMissionNote('');
              setDraft('missionNote', '');
            }
            if (currentProgress.evening_reflection) {
              const to = String(currentProgress.evening_reflection).trim();
              setTodayOutcome(to);
              setDraft('todayOutcome', to);
            } else {
              setTodayOutcome('');
              setDraft('todayOutcome', '');
            }
            if (currentProgress.coach_observation) {
              setCoachObservation(currentProgress.coach_observation);
              setShowCoachPanel(true);
            }
            if (dayNum === 1 && currentProgress.progress_notes != null) {
              const s = progressNotesToText(currentProgress.progress_notes);
              setSituationText(s);
              setDraft('situation', s);
            }
          } else {
            // Fresh day — clear day-scoped drafts so we don't leak previous day
            setReflectionText('');
            setDraft('reflection', '');
            setMissionNote('');
            setDraft('missionNote', '');
            setTodayOutcome('');
            setDraft('todayOutcome', '');
            setMissionComplete(false);
            setCoachObservation('');
            setShowCoachPanel(false);
          }
          // Week thread always lives on day 1 — hydrate for Day 1 revisit AND Days 2–7.
          // (Day 1 previously only read notes from currentProgress; if that row lacked
          // progress_notes after a partial upsert, the field rendered blank though data existed.)
          if (RETURN_LOOP_V1) {
            const { data: day1Progress } = await supabase
              .from('user_progress')
              .select('progress_notes')
              .eq('user_id', currentUser.id)
              .eq('book_id', id)
              .eq('day_number', 1)
              .maybeSingle();
            if (day1Progress?.progress_notes != null) {
              const s = progressNotesToText(day1Progress.progress_notes);
              setSituationText(s);
              setDraft('situation', s);
            }
          }
          // Progress bar: completed days among 1–7 (not "current day position")
          const { data: allProg } = await supabase
            .from('user_progress')
            .select('day_number, completed')
            .eq('user_id', currentUser.id)
            .eq('book_id', id);
          if (allProg) {
            const doneNums = allProg
              .filter(
                (r) =>
                  Number(r.day_number) >= 1 &&
                  Number(r.day_number) <= 7 &&
                  r.completed === true
              )
              .map((r) => Number(r.day_number));
            setCompletedDayNumbers(doneNums);
            setCompletedDaysCount(doneNums.length);
          }
          if (dayNum === 1) {
            supabase
              .from('profiles')
              .update({ onboarding_completed: true })
              .eq('id', currentUser.id)
              .then(() => {});
          }
        }
        if (dayError) {
          setError(`Day content not found (${dayError.message || 'query error'})`);
        } else if (!currentDayData) {
          setError(
            `Day ${dayNum} is not loaded for this book yet. ` +
            `Regenerate and run: python3 reload_sprints.py --books "Book Title" --apply`
          );
        }
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

  /**
   * Persist drafts from an explicit snapshot (not render state).
   * Used by blur, unmount/day-change flush, and Day 0 → Day 1 CTA.
   */
  async function persistDrafts({
    userId,
    bookId,
    dayNumber,
    isDay0Page,
    drafts,
  }) {
    if (!userId || !bookId) return;
    const ops = [];

    // Week situation always lives on day 1 progress_notes (until runs model).
    // Only write non-empty — null upsert would wipe a saved thread when flush
    // races with an empty draft snapshot (nav away mid-type / exit).
    if (RETURN_LOOP_V1) {
      const sit = String(drafts.situation ?? '').trim();
      if (sit) {
        ops.push(
          supabase.from('user_progress').upsert({
            user_id: userId,
            book_id: bookId,
            day_number: 1,
            progress_notes: progressNotesToDb(sit),
          }, { onConflict: 'user_id,book_id,day_number' })
        );
      }
    }

    // Day-scoped fields only on practice days 1–7
    if (!isDay0Page && dayNumber >= 1 && dayNumber <= 7) {
      const reflection = String(drafts.reflection ?? '');
      if (reflection.trim()) {
        ops.push(
          supabase.from('user_progress').upsert({
            user_id: userId,
            book_id: bookId,
            day_number: dayNumber,
            reflection_data: reflection,
          }, { onConflict: 'user_id,book_id,day_number' })
        );
      }
      if (RETURN_LOOP_V1) {
        const mission = String(drafts.missionNote ?? '').trim();
        ops.push(
          supabase.from('user_progress').upsert({
            user_id: userId,
            book_id: bookId,
            day_number: dayNumber,
            action_commitment: mission || null,
          }, { onConflict: 'user_id,book_id,day_number' })
        );
        if (mission) {
          const today = String(drafts.todayOutcome ?? '').trim();
          ops.push(
            supabase.from('user_progress').upsert({
              user_id: userId,
              book_id: bookId,
              day_number: dayNumber,
              evening_reflection: today || null,
            }, { onConflict: 'user_id,book_id,day_number' })
          );
        }
        // Yesterday's outcome is stored on the prior day row
        if (dayNumber > 1 && String(drafts.yesterdayNote ?? '').trim()) {
          const yo = String(drafts.yesterdayOutcome ?? '').trim();
          ops.push(
            supabase.from('user_progress').upsert({
              user_id: userId,
              book_id: bookId,
              day_number: dayNumber - 1,
              evening_reflection: yo || null,
            }, { onConflict: 'user_id,book_id,day_number' })
          );
        }
      }
    }

    if (!ops.length) return;
    const results = await Promise.all(ops);
    for (const r of results) {
      if (r?.error) console.error('Draft persist error:', r.error?.message ?? r.error);
    }
  }

  async function flushCurrentDrafts() {
    const u = userRef.current;
    if (!u) return;
    await persistDrafts({
      userId: u.id,
      bookId: id,
      dayNumber: dayNum,
      isDay0Page: isDay0,
      drafts: { ...draftsRef.current },
    });
  }

  // Flush previous day's drafts when day/book changes or the page unmounts.
  // Snapshot dayNum/id in the effect so cleanup still targets the day we left.
  useEffect(() => {
    const snapDay = dayNum;
    const snapId = id;
    const snapIsDay0 = isDay0;
    return () => {
      const u = userRef.current;
      if (!u || !snapId) return;
      void persistDrafts({
        userId: u.id,
        bookId: snapId,
        dayNumber: snapDay,
        isDay0Page: snapIsDay0,
        drafts: { ...draftsRef.current },
      });
    };
  }, [id, dayNum, isDay0]);

  // Also flush when the tab is hidden / page is unloading (hard nav, close).
  useEffect(() => {
    function onHide() {
      if (document.visibilityState !== 'hidden') return;
      const u = userRef.current;
      if (!u || !id) return;
      void persistDrafts({
        userId: u.id,
        bookId: id,
        dayNumber: dayNum,
        isDay0Page: isDay0,
        drafts: { ...draftsRef.current },
      });
    }
    function onPageHide() {
      const u = userRef.current;
      if (!u || !id) return;
      void persistDrafts({
        userId: u.id,
        bookId: id,
        dayNumber: dayNum,
        isDay0Page: isDay0,
        drafts: { ...draftsRef.current },
      });
    }
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [id, dayNum, isDay0]);

  async function saveReflection() {
    const text = String(draftsRef.current.reflection ?? '');
    if (!user || !text.trim()) return;
    try {
      await supabase.from('user_progress').upsert({
        user_id:         user.id,
        book_id:         id,
        day_number:      dayNum,
        reflection_data: text,
      }, { onConflict: 'user_id,book_id,day_number' });
    } catch (err) { console.error('Error saving reflection:', err?.message ?? err); }
  }

  // Week-long situation: always written to Day 1 so every day can read it back.
  async function saveSituation(explicitText) {
    if (!user || !RETURN_LOOP_V1) return;
    const text = String(
      explicitText !== undefined ? explicitText : draftsRef.current.situation ?? ''
    ).trim();
    // Do not upsert null — clears a good row when blur/flush races with empty draft.
    if (!text) return;
    try {
      const { error } = await supabase.from('user_progress').upsert({
        user_id:         user.id,
        book_id:         id,
        day_number:      1,
        // text[] column — plain string fails with 22P02 and silently discards
        progress_notes:  progressNotesToDb(text),
      }, { onConflict: 'user_id,book_id,day_number' });
      if (error) console.error('Error saving situation:', error?.message ?? error);
    } catch (err) { console.error('Error saving situation:', err?.message ?? err); }
  }

  // Mission proof: what they actually did on real work (optional).
  async function saveMissionNote() {
    if (!user || !RETURN_LOOP_V1) return;
    const text = String(draftsRef.current.missionNote ?? '').trim();
    try {
      await supabase.from('user_progress').upsert({
        user_id:            user.id,
        book_id:            id,
        day_number:         dayNum,
        action_commitment:  text || null,
      }, { onConflict: 'user_id,book_id,day_number' });
    } catch (err) { console.error('Error saving mission note:', err?.message ?? err); }
  }

  // Outcome of yesterday's attempt — stored on prior day (optional, never gates complete).
  async function saveYesterdayOutcome() {
    if (!user || !RETURN_LOOP_V1 || dayNum <= 1) return;
    if (!String(draftsRef.current.yesterdayNote ?? '').trim()) return;
    const text = String(draftsRef.current.yesterdayOutcome ?? '').trim();
    try {
      await supabase.from('user_progress').upsert({
        user_id:             user.id,
        book_id:             id,
        day_number:          dayNum - 1,
        evening_reflection:  text || null,
      }, { onConflict: 'user_id,book_id,day_number' });
    } catch (err) { console.error('Error saving outcome:', err?.message ?? err); }
  }

  // Same-day outcome if they already know what happened (optional).
  async function saveTodayOutcome() {
    if (!user || !RETURN_LOOP_V1) return;
    if (!String(draftsRef.current.missionNote ?? '').trim()) return;
    const text = String(draftsRef.current.todayOutcome ?? '').trim();
    try {
      await supabase.from('user_progress').upsert({
        user_id:             user.id,
        book_id:             id,
        day_number:          dayNum,
        evening_reflection:  text || null,
      }, { onConflict: 'user_id,book_id,day_number' });
    } catch (err) { console.error('Error saving today outcome:', err?.message ?? err); }
  }

  /** Day 0 → Day 1: await situation save, then navigate. No race with <Link>. */
  async function handleStartDay1(situationFromChild) {
    if (startingDay1) return;
    setStartingDay1(true);
    const text = String(
      situationFromChild !== undefined
        ? situationFromChild
        : draftsRef.current.situation ?? ''
    );
    setDraft('situation', text);
    setSituationText(text);
    try {
      if (user && RETURN_LOOP_V1) {
        const { error } = await supabase.from('user_progress').upsert({
          user_id: user.id,
          book_id: id,
          day_number: 1,
          progress_notes: progressNotesToDb(text),
        }, { onConflict: 'user_id,book_id,day_number' });
        if (error) {
          console.error('Day 0 situation save failed:', error?.message ?? error);
          // Still navigate — better to land on Day 1 than trap the user.
          // Thread may be empty; they can re-enter on Day 1.
        }
      }
      router.push(`/summit/${id}/day/1`);
    } finally {
      setStartingDay1(false);
    }
  }

  // ── Second-look handler (Phase 2) ────────────────────────────────────
  async function getSecondLook() {
    if (!user) { alert('Please sign in to use the coach.'); return; }
    const milepost = String(draftsRef.current.reflection ?? '').trim();
    if (!milepost) { return; }
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
          milepostText:     milepost,
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

  /**
   * Mark day complete — one click, one write.
   * Primary button does NOT uncomplete (that was the two-click trap: first click
   * toggled false when state was already true, second click completed).
   * Flush drafts first, then a single upsert with completed: true last.
   */
  async function toggleMission() {
    if (!user) { alert('Please sign in to save progress.'); return; }
    // Already complete: no-op on primary CTA (avoid accidental uncomplete).
    if (missionComplete) {
      setShowCelebration(true);
      return;
    }
    const now = new Date().toISOString();
    setMissionComplete(true);
    try {
      // 1) Flush draft fields first (must not race after completed write)
      await flushCurrentDrafts();
      // 2) Single complete write — completed:true is authoritative
      const payload = {
        user_id:      user.id,
        book_id:      id,
        day_number:   dayNum,
        completed:    true,
        completed_at: now,
      };
      const missionSnap = String(draftsRef.current.missionNote ?? '').trim();
      const todaySnap = String(draftsRef.current.todayOutcome ?? '').trim();
      const reflectionSnap = String(draftsRef.current.reflection ?? '').trim();
      if (reflectionSnap) payload.reflection_data = reflectionSnap;
      if (RETURN_LOOP_V1 && missionSnap) payload.action_commitment = missionSnap;
      if (RETURN_LOOP_V1 && todaySnap) payload.evening_reflection = todaySnap;
      const { error } = await supabase
        .from('user_progress')
        .upsert(payload, { onConflict: 'user_id,book_id,day_number' });
      if (error) {
        console.error('Complete error:', error?.message ?? JSON.stringify(error));
        setMissionComplete(false);
        return;
      }
      setCompletedDayNumbers((prev) => {
        if (prev.includes(dayNum)) {
          setCompletedDaysCount(prev.length);
          return prev;
        }
        const next = [...prev, dayNum].sort((a, b) => a - b);
        setCompletedDaysCount(next.length);
        return next;
      });
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
              reflection:     reflectionSnap || null,
            }),
          });
        } catch (emailErr) {
          console.error('Email send failed:', emailErr);
        }
      }
      setShowCelebration(true);
    } catch (err) {
      console.error('Critical error:', err?.message ?? err);
      setMissionComplete(false);
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
        startingDay1={startingDay1}
        onSituationChange={(text) => {
          setDraft('situation', text);
          setSituationText(text);
        }}
        onSituationBlur={(text) => {
          setDraft('situation', text);
          setSituationText(text);
          void saveSituation(text);
        }}
        onStartDay1={handleStartDay1}
        onExitFlush={() => {
          void flushCurrentDrafts();
        }}
      />
    );
  }

  if (error || !book || (!isDay0 && !dayData)) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--text-main)', marginBottom: 8 }}>
          Content not found
        </div>
        <p style={{ fontSize: '0.9rem', color: 'rgba(238,242,247,0.55)', lineHeight: 1.5, marginBottom: 16 }}>
          {error || (book ? `No Day ${dayNum} row in summit_days for this book.` : 'Book not found.')}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {book?.sprint_intro && (
            <Link href={`/summit/${id}/day/0`} style={{ color: 'var(--brand-teal)', fontSize: '0.875rem' }}>
              Open Day 0 →
            </Link>
          )}
          <Link href="/library" style={{ color: 'var(--brand-teal)', fontSize: '0.875rem' }}>← Back to library</Link>
        </div>
      </div>
    </div>
  );

  // Completion-based progress (finished sprint revisited on Day 1 shows ~100%, not 0%)
  const progressPercent = Math.min(100, Math.round((completedDaysCount / 7) * 100));
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
  // days don't show empty panels. Lean mode drops application (covered by
  // Write it down + Do it now) and renumbers 1..n.
  const practiceBeats = PRACTICE_BEATS
    .filter(beat => !(LEAN_DAY_V1 && beat.key === 'application'))
    .map(beat => ({
      ...beat,
      text: typeof dayData[beat.key] === 'string' ? dayData[beat.key].trim() : '',
    }))
    .filter(beat => beat.text.length > 0)
    .map((beat, i) => ({ ...beat, num: i + 1 }));
  const usePracticeLayout = PRACTICE_DAY_V2 && practiceBeats.length > 0;

  // Milepost helpers — lean: ONE of hint OR shape guide, never both.
  const milepostHints = Array.isArray(dayData.hints)
    ? dayData.hints.map(h => String(h)).filter(h => h.trim().length > 0)
    : [];
  const primaryHint = milepostHints[0] || '';
  const madlibShape = typeof dayData.madlib_template === 'string'
    ? dayData.madlib_template.trim()
    : '';
  const showHint = Boolean(primaryHint);
  const showShapeGuide = Boolean(madlibShape) && !(LEAN_DAY_V1 && showHint);

  return (
    <>
      <div className="ambient-glow" />
      <nav className="glass-nav">
        <div className="nav-content">
          <BrandLogo href="/library" />
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
          {/* Book title stays on library cards ("Inspired by") only — not on practice days */}
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
          {/* Quiet progress — completed_days/7 only (never dayNum-1 position) */}
          <div style={{ display: 'flex', gap: 5, marginBottom: 6 }}>
            {[1, 2, 3, 4, 5, 6, 7].map(stage => {
              const stageData = allDays.find(d => d.day_number === stage);
              const isComplete = completedDayNumbers.includes(stage);
              const isCurrent = stage === dayNum && !isComplete;
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
            {completedDaysCount} of 7 days complete · {progressPercent}%
          </div>
        </div>

        {/* ── Continuity (Days 2–7) — only when there is something to show ─ */}
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
              <p style={t('caption', { margin: yesterdayOutcome ? '0 0 10px 0' : 0, color: 'rgba(238,242,247,0.55)' })}>
                <span style={{ color: 'rgba(255,255,255,0.35)' }}>Yesterday you · </span>
                {yesterdayNote}
              </p>
            )}
            {/* Close the loop only when they logged an attempt yesterday — never required */}
            {yesterdayNote && (
              <div style={{ marginTop: yesterdayOutcome ? 0 : 10 }}>
                <label style={t('label', {
                  display: 'block',
                  marginBottom: 6,
                  color: 'rgba(255,255,255,0.35)',
                })}>
                  What happened when you tried it?{' '}
                  <span style={{ fontWeight: 500, opacity: 0.65 }}>(optional)</span>
                </label>
                <textarea
                  className="journal-input"
                  value={yesterdayOutcome}
                  onChange={e => {
                    const v = e.target.value;
                    setDraft('yesterdayOutcome', v);
                    setYesterdayOutcome(v);
                  }}
                  onBlur={() => { void saveYesterdayOutcome(); }}
                  placeholder="e.g. Worked Mon; Tue the meeting ran long and I skipped · or: not yet"
                  rows={2}
                  style={{ minHeight: 48, marginBottom: 0 }}
                />
              </div>
            )}
          </div>
        )}

        {/* ── Day 1 situation — ALWAYS same DOM tree (no empty/filled remount) ─
            Bug: helper <p> unmounted on first keystroke, shifting textarea sibling
            index → focus loss + discarded input. Keep helper in tree; hide only. */}
        {RETURN_LOOP_V1 && dayNum === 1 && (
          <div
            className="glass-panel"
            style={{
              marginBottom: 24,
              padding: '18px 18px',
              borderColor: 'rgba(25,190,227,0.3)',
              background: 'rgba(25,190,227,0.05)',
            }}
          >
            <div style={t('label', {
              marginBottom: 10,
              color: 'rgba(255,255,255,0.35)',
            })}>
              Your situation this week
            </div>
            <p
              style={t('bodyMuted', {
                margin: '0 0 12px 0',
                color: 'rgba(238,242,247,0.72)',
                // Hide when filled — do NOT unmount (preserves textarea focus)
                display: situationText.trim() ? 'none' : 'block',
              })}
            >
              Name one real thread you will practice on — a person, habit, or friction at work.
              Every day comes back to this.
            </p>
            <textarea
              className="journal-input"
              value={situationText}
              onChange={e => {
                const v = e.target.value;
                setDraft('situation', v);
                setSituationText(v);
              }}
              onBlur={() => { void saveSituation(); }}
              placeholder="e.g. Status updates from Jordan that never land before standup"
              rows={2}
              style={{
                minHeight: 56,
                marginBottom: 0,
              }}
            />
          </div>
        )}

        {/* ── Today&apos;s practice — numbered beats ─────────────────── */}
        {usePracticeLayout ? (
          <section style={{ marginBottom: LEAN_DAY_V1 ? 24 : 32 }}>
            <div style={t('label', { marginBottom: 14 })}>Today&apos;s practice</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {practiceBeats.map((beat) => {
                const isFail = beat.accent === 'amber';
                return (
                  <div
                    key={beat.key}
                    style={{
                      display: 'flex',
                      gap: 14,
                      padding: '14px 16px',
                      borderRadius: 12,
                      border: isFail
                        ? '1px solid rgba(251, 146, 60, 0.22)'
                        : '1px solid rgba(255,255,255,0.08)',
                      background: isFail
                        ? 'rgba(251, 146, 60, 0.04)'
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
                        marginBottom: 10,
                        color: isFail ? 'rgba(251, 146, 60, 0.85)' : 'var(--brand-teal)',
                      })}>
                        {beat.label}
                      </div>
                      <PracticeProse
                        text={beat.text}
                        variant={
                          beat.key === 'framework'
                            ? 'skill'
                            : beat.key === 'failure_mode'
                            ? 'fail'
                            : beat.key === 'demonstration'
                            ? 'demo'
                            : 'default'
                        }
                      />
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
            {/* Lean: one helper only — prefer hint; else shape guide */}
            {showHint && (
              <p style={t('caption', { margin: '0 0 12px 0', color: 'rgba(255,255,255,0.38)' })}>
                {primaryHint}
              </p>
            )}
            {showShapeGuide && (
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
                  {madlibShape}
                </p>
              </div>
            )}
            <textarea
              className="journal-input"
              value={reflectionText}
              onChange={e => {
                const v = e.target.value;
                setDraft('reflection', v);
                setReflectionText(v);
              }}
              onBlur={() => { void saveReflection(); }}
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

            {/* Help — quiet, only when empty or after they write (second look) */}
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
                  title="Summit Coach — open chat about today's practice"
                >
                  Stuck? Ask Summit Coach →
                </button>
              )}
              {hasMilepostText && (
                <button
                  type="button"
                  onClick={getSecondLook}
                  disabled={secondLookBusy}
                  style={{
                    margin: 0,
                    padding: 0,
                    background: 'none',
                    border: 'none',
                    ...type.caption,
                    color: secondLookBusy ? 'rgba(25,190,227,0.35)' : 'rgba(25,190,227,0.55)',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 500,
                    cursor: secondLookBusy ? 'not-allowed' : 'pointer',
                  }}
                  title="Second look — critique only what you just wrote under Write it down"
                >
                  {secondLookLoading
                    ? 'Reading…'
                    : secondLookStreaming
                    ? 'Responding…'
                    : coachObservation
                    ? 'Another second look →'
                    : 'Second look on this answer →'}
                </button>
              )}
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
                  <div>
                    <div style={t('label', { display: 'inline-flex', alignItems: 'center', gap: 6 })}>
                      Second look
                    </div>
                    <p style={t('caption', {
                      margin: '4px 0 0 0',
                      color: 'rgba(255,255,255,0.4)',
                      lineHeight: 1.4,
                    })}>
                      Critique of the line you just wrote — not the open Summit Coach chat.
                    </p>
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

        {/* ── Do it + complete ───────────────────────────────────────── */}
        {dayData.summit_mission && (
          <section
            className="glass-panel mission-panel highlighted"
            style={{ marginBottom: 28, padding: '20px 18px' }}
          >
            <div style={t('label', { marginBottom: 10 })}>Do it now</div>
            <p style={t('bodyEmphasis', { margin: '0 0 10px 0', lineHeight: 1.55 })}>
              {dayData.summit_mission}
            </p>
            {LEAN_DAY_V1 && (
              <p style={t('caption', {
                margin: '0 0 14px 0',
                color: 'rgba(238,242,247,0.45)',
                lineHeight: 1.45,
              })}>
                {hasMilepostText
                  ? 'Use the line you just wrote — put it where this asks. No need to rewrite it.'
                  : 'Write your line above first, then place that same line where this asks.'}
              </p>
            )}
            {LEAN_DAY_V1 && hasMilepostText && (
              <div
                style={{
                  marginBottom: 14,
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: 'rgba(25,190,227,0.06)',
                  border: '1px solid rgba(25,190,227,0.18)',
                }}
              >
                <div style={t('label', {
                  marginBottom: 6,
                  color: 'rgba(25,190,227,0.7)',
                  fontSize: '0.6rem',
                })}>
                  Your line
                </div>
                <p style={t('caption', {
                  margin: 0,
                  color: 'rgba(238,242,247,0.75)',
                  whiteSpace: 'pre-wrap',
                })}>
                  {reflectionText.trim()}
                </p>
              </div>
            )}
            {RETURN_LOOP_V1 && (
              <div style={{ marginBottom: 16 }}>
                <label style={t('label', {
                  display: 'block',
                  marginBottom: 8,
                  color: 'rgba(255,255,255,0.35)',
                })}>
                  What I did <span style={{ fontWeight: 500, opacity: 0.65 }}>(optional)</span>
                </label>
                <textarea
                  className="journal-input"
                  value={missionNote}
                  onChange={e => {
                    const v = e.target.value;
                    setDraft('missionNote', v);
                    setMissionNote(v);
                  }}
                  onBlur={() => { void saveMissionNote(); }}
                  placeholder="One line on what you actually did…"
                  rows={2}
                  style={{ minHeight: 48, marginBottom: 0 }}
                />
                {/* Always visible — do not gate behind "What I did" (two-click trap) */}
                <div style={{ marginTop: 12 }}>
                  <label style={t('label', {
                    display: 'block',
                    marginBottom: 8,
                    color: 'rgba(255,255,255,0.35)',
                  })}>
                    What happened?{' '}
                    <span style={{ fontWeight: 500, opacity: 0.65 }}>(optional)</span>
                  </label>
                  <textarea
                    className="journal-input"
                    value={todayOutcome}
                    onChange={e => {
                      const v = e.target.value;
                      setDraft('todayOutcome', v);
                      setTodayOutcome(v);
                    }}
                    onBlur={() => { void saveTodayOutcome(); }}
                    placeholder="What resulted — or not yet / missed with why"
                    rows={2}
                    style={{ minHeight: 48, marginBottom: 0 }}
                  />
                </div>
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
        {SHOW_EXPLORE && missionComplete && (
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
        bookTitle={displaySprintTitle(book) || book.sprint_title || book.title}
        nextDayTitle={nextDayData?.title || `Day ${dayNum + 1}`}
        nextDayPreview={nextStagePreview}
        nextDayUrl={`/summit/${id}/day/${dayNum + 1}`}
        suggestedNext={suggestedNext}
        lastWriteSnippet={
          dayNum === 7
            ? (displayReflectionText(reflectionText) || '').slice(0, 180) || null
            : null
        }
        situationSnippet={
          dayNum < 7 && situationText?.trim()
            ? situationText.trim().slice(0, 120)
            : null
        }
        lastDidSnippet={
          dayNum < 7 && missionNote?.trim()
            ? missionNote.trim().slice(0, 120)
            : null
        }
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