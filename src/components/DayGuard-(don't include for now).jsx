import { useState, useEffect } from 'react';
import { supabase } from '@/app/supabaseClient';

export default function DayGuard({ userId, bookId, currentDay, previousDayProgress, children }) {
  const [isLocked, setIsLocked]   = useState(currentDay !== 1);
  const [checking, setChecking]   = useState(currentDay !== 1);
  const [actionNote, setActionNote] = useState('');
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);

  useEffect(() => {
    if (currentDay === 1) {
      setIsLocked(false);
      setChecking(false);
      return;
    }

    // Use previousDayProgress passed from page.jsx — no extra query needed
    if (previousDayProgress !== null) {
      const isUnlocked = previousDayProgress?.completed ||
                         previousDayProgress?.action_commitment;
      setIsLocked(!isUnlocked);
      setChecking(false);
    } else if (previousDayProgress === null && currentDay > 1) {
      // No record yet for previous day — still locked
      setIsLocked(true);
      setChecking(false);
    }
  }, [previousDayProgress, currentDay]);

  async function submitAction() {
    if (!actionNote.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id:           userId,
          book_id:           bookId,
          day_number:        currentDay - 1,
          action_commitment: actionNote,
        }, { onConflict: 'user_id,book_id,day_number' });

      if (!error) {
        setSaved(true);
        setTimeout(() => setIsLocked(false), 800);
      } else {
        console.error('DayGuard save error:', error?.message ?? JSON.stringify(error));
      }
    } catch (err) {
      console.error('DayGuard error:', err?.message ?? err);
    } finally {
      setSaving(false);
    }
  }

  if (checking) {
    return (
      <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading your journey...</p>
      </div>
    );
  }

  return (
    <div className="day-guard-wrapper">
      {isLocked ? (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', maxWidth: '640px', margin: '0 auto' }}>

          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🔒</div>

          <h2 className="text-gradient" style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '12px' }}>
            One step before Day {currentDay}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.6', maxWidth: '480px', margin: '0 auto 36px' }}>
            To unlock this stage, share what you did with Day {currentDay - 1}'s action challenge.
            Even a small attempt counts — the point is that you tried.
          </p>

          <div style={{ textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--brand-teal)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
              ✍️ Your action from Day {currentDay - 1}
            </label>
            <textarea
              className="journal-input"
              placeholder="What did you do, attempt, or discover? A win, a struggle, or just what happened when you tried..."
              value={actionNote}
              onChange={(e) => setActionNote(e.target.value)}
              style={{ minHeight: '130px', width: '100%' }}
            />
            <button
              onClick={submitAction}
              disabled={!actionNote.trim() || saving || saved}
              className="btn-primary"
              style={{
                marginTop: '16px',
                width: '100%',
                fontSize: '1rem',
                padding: '14px',
                opacity: (!actionNote.trim() || saving) ? 0.5 : 1,
                transition: 'all 0.3s ease'
              }}
            >
              {saved
                ? '✓ Saved — unlocking...'
                : saving
                ? 'Saving...'
                : `Submit & Unlock Day ${currentDay} →`}
            </button>
          </div>

          <p style={{ marginTop: '24px', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Your response is saved to your journey notes and visible only to you.
          </p>
        </div>
      ) : (
        <>{children}</>
      )}
    </div>
  );
}
