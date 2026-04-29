'use client';
import { useState, useEffect } from 'react';

// Triggers if:
// 1. User completed 2+ stages today, OR
// 2. Previous stage was completed less than 1 hour ago

export default function PacingNudge({ dayNum, previousDayProgress, onContinue }) {
  const [show,     setShow]     = useState(false);
  const [exiting,  setExiting]  = useState(false);
  const [reason,   setReason]   = useState(null); // 'tooFast' | 'tooMany'

  useEffect(() => {
    if (!previousDayProgress?.completed_at) return;

    const prevCompleted = new Date(previousDayProgress.completed_at);
    const now           = new Date();
    const minutesSince  = (now - prevCompleted) / 1000 / 60;

    // Check: completed within last 60 minutes
    if (minutesSince < 60) {
      setReason('tooFast');
      setShow(true);
      return;
    }

    // Check: completed 2+ stages today
    // We determine this by checking if prev stage was completed today
    const today     = new Date();
    const prevDate  = new Date(previousDayProgress.completed_at);
    const sameDay   =
      prevDate.getFullYear() === today.getFullYear() &&
      prevDate.getMonth()    === today.getMonth()    &&
      prevDate.getDate()     === today.getDate();

    // If they're on stage 3+ and previous was completed today, that's 2+ today
    if (sameDay && dayNum >= 3) {
      setReason('tooMany');
      setShow(true);
    }
  }, [previousDayProgress, dayNum]);

  function handleContinue() {
    setExiting(true);
    setTimeout(() => {
      setShow(false);
      setExiting(false);
      onContinue?.();
    }, 300);
  }

  if (!show) return null;

  const messages = {
    tooFast: {
      headline: 'Your brain is still processing.',
      body:     `You completed Stage ${dayNum - 1} less than an hour ago. The insight from that stage needs time to settle before new ones land properly. That's not a metaphor — it's how memory consolidation works. Come back in a bit and Stage ${dayNum} will hit harder.`,
      cta:      'I\'ll come back later',
      secondary: 'I understand — continue anyway',
    },
    tooMany: {
      headline: 'You\'re moving fast.',
      body:     `You've already completed multiple stages today. SummitSkills is designed for daily practice — not a single session. Each stage is meant to be tried in real life before the next one opens. If you rush, you'll finish the sprint but miss the point.`,
      cta:      'Good point — I\'ll pace myself',
      secondary: 'Continue anyway',
    },
  };

  const msg = messages[reason] || messages.tooFast;

  return (
    <div
      style={{
        position:       'fixed',
        inset:          0,
        zIndex:         900,
        background:     'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(10px)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '24px',
        opacity:        exiting ? 0 : 1,
        transition:     'opacity 0.3s ease',
      }}
    >
      <div
        style={{
          background:   '#101C2C',
          border:       '1px solid rgba(23,184,224,0.2)',
          borderRadius: '20px',
          padding:      '44px',
          maxWidth:     '460px',
          width:        '100%',
          transform:    exiting ? 'translateY(12px)' : 'translateY(0)',
          transition:   'transform 0.3s ease',
        }}
      >
        {/* Coach icon */}
        <div
          style={{
            width:          '48px',
            height:         '48px',
            borderRadius:   '12px',
            background:     'rgba(23,184,224,0.1)',
            border:         '1px solid rgba(23,184,224,0.2)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontSize:       '20px',
            marginBottom:   '20px',
          }}
        >
          🧠
        </div>

        {/* Tag */}
        <p
          style={{
            fontSize:      '0.65rem',
            fontWeight:    700,
            textTransform: 'uppercase',
            letterSpacing: '2px',
            color:         '#17B8E0',
            margin:        '0 0 10px',
            fontFamily:    'var(--font-sans)',
          }}
        >
          A word from your coach
        </p>

        {/* Headline */}
        <h2
          style={{
            fontFamily:    'var(--font-serif)',
            fontSize:      '1.5rem',
            fontWeight:    800,
            color:         '#EEF2F7',
            margin:        '0 0 14px',
            lineHeight:    1.2,
            letterSpacing: '-0.02em',
          }}
        >
          {msg.headline}
        </h2>

        {/* Body */}
        <p
          style={{
            fontSize:   '0.88rem',
            color:      'rgba(238,242,247,0.62)',
            lineHeight: 1.78,
            margin:     '0 0 32px',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {msg.body}
        </p>

        {/* Primary CTA — recommended action */}
        <button
          onClick={handleContinue}
          style={{
            width:        '100%',
            padding:      '13px',
            borderRadius: '10px',
            border:       'none',
            background:   '#17B8E0',
            color:        '#0D1520',
            fontSize:     '0.92rem',
            fontWeight:   700,
            fontFamily:   'var(--font-sans)',
            cursor:       'pointer',
            marginBottom: '10px',
            transition:   'opacity 0.15s',
          }}
          onMouseEnter={e => e.target.style.opacity = '0.88'}
          onMouseLeave={e => e.target.style.opacity = '1'}
        >
          {msg.cta}
        </button>

        {/* Secondary CTA — continue anyway */}
        <button
          onClick={handleContinue}
          style={{
            width:        '100%',
            padding:      '11px',
            borderRadius: '10px',
            border:       '1px solid rgba(255,255,255,0.1)',
            background:   'transparent',
            color:        'rgba(238,242,247,0.4)',
            fontSize:     '0.82rem',
            fontWeight:   500,
            fontFamily:   'var(--font-sans)',
            cursor:       'pointer',
            transition:   'all 0.15s',
          }}
          onMouseEnter={e => { e.target.style.color = 'rgba(238,242,247,0.7)'; e.target.style.borderColor = 'rgba(255,255,255,0.2)'; }}
          onMouseLeave={e => { e.target.style.color = 'rgba(238,242,247,0.4)'; e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
        >
          {msg.secondary}
        </button>
      </div>
    </div>
  );
}
