'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/supabaseClient';

const TYPED_TEXT = "My morning coffee ritual. I start the machine before I even think about it. The trigger is walking into the kitchen.";
const COACH_IMG = 'data:image/png;base64,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';

// ── Step icon components ──────────────────────────────────────────────────────

function LogoIcon() {
  return (
    <div style={{
      width: '48px', height: '48px', borderRadius: '12px',
      background: 'rgba(23,184,224,0.1)', border: '1px solid rgba(23,184,224,0.2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      marginBottom: '16px',
    }}>
      <img src="/SummitSkills-Logo.png" alt="SummitSkills"
        style={{ width: '26px', height: '26px', objectFit: 'contain',
          filter: 'brightness(0) invert(1) sepia(1) saturate(3) hue-rotate(160deg)', opacity: 0.9 }}
        onError={e => { e.target.style.display = 'none'; }}
      />
    </div>
  );
}

function StepIcon({ label }) {
  return (
    <div style={{
      width: '48px', height: '48px', borderRadius: '12px',
      background: 'rgba(23,184,224,0.1)', border: '1px solid rgba(23,184,224,0.2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      marginBottom: '16px',
      fontFamily: 'var(--mono)', fontSize: '0.78rem', fontWeight: 700,
      color: '#17B8E0', letterSpacing: '-0.02em',
    }}>
      {label}
    </div>
  );
}

function CoachIcon() {
  return (
    <div style={{
      width: '52px', height: '52px', borderRadius: '50%',
      background: '#17B8E0',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      marginBottom: '16px',
      boxShadow: '0 0 20px rgba(23,184,224,0.4)',
    }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0D1520" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    </div>
  );
}

// ── Stages preview (step 2) ───────────────────────────────────────────────────

function StagesPreview() {
  const stages = ['Anchor', 'Apply', 'Reflect', 'Specify', 'Track', 'Adjust', 'Commit'];
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px 20px', margin: '0 0 24px' }}>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
        {stages.map((s, i) => (
          <div key={i} style={{ flex: 1, height: '4px', borderRadius: '2px', background: i < 2 ? '#17B8E0' : i === 2 ? 'rgba(23,184,224,0.4)' : 'rgba(255,255,255,0.08)' }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {stages.map((s, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: '0.52rem', color: i < 2 ? '#17B8E0' : i === 2 ? 'rgba(23,184,224,0.5)' : 'rgba(238,242,247,0.2)', fontWeight: i === 6 ? 700 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {i === 6 ? 'Summit' : s}
          </div>
        ))}
      </div>
      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '0.75rem', color: 'rgba(238,242,247,0.4)', lineHeight: 1.6 }}>
        Stage 7 is where it comes together. You leave with something you actually made.
      </div>
    </div>
  );
}

// ── Coach preview (step 4) ────────────────────────────────────────────────────

function CoachPreview() {
  const messages = [
    { role: 'coach', text: "You mentioned your morning coffee ritual as a trigger. What is it about that moment that makes it so automatic for you?" },
    { role: 'user',  text: "Honestly I think I've just done it so many times. My hands do it before I've even decided to." },
    { role: 'coach', text: "That's exactly how habits solidify. Which other parts of your workday feel that automatic right now?" },
  ];
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden', margin: '0 0 24px' }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#17B8E0', boxShadow: '0 0 6px rgba(23,184,224,0.6)' }} />
        <span style={{ fontSize: '0.68rem', color: 'rgba(238,242,247,0.4)', fontFamily: 'monospace' }}>Summit Coach · Stage 3</span>
      </div>
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ maxWidth: '85%', padding: '8px 12px', borderRadius: m.role === 'coach' ? '4px 12px 12px 12px' : '12px 4px 12px 12px', background: m.role === 'coach' ? 'rgba(23,184,224,0.08)' : 'rgba(255,255,255,0.06)', border: m.role === 'coach' ? '1px solid rgba(23,184,224,0.15)' : '1px solid rgba(255,255,255,0.08)', fontSize: '0.75rem', color: m.role === 'coach' ? 'rgba(238,242,247,0.75)' : 'rgba(238,242,247,0.55)', lineHeight: 1.6 }}>
              {m.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Animated reflection preview ───────────────────────────────────────────────

function ReflectionPreview() {
  const [typed,    setTyped]    = useState('');
  const [done,     setDone]     = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const timerRef = useRef(null);

  function runAnimation() {
    let i = 0;
    setTyped(''); setDone(false); setUnlocked(false);
    timerRef.current = setInterval(() => {
      i++;
      setTyped(TYPED_TEXT.slice(0, i));
      if (i >= TYPED_TEXT.length) {
        clearInterval(timerRef.current);
        setDone(true);
        setTimeout(() => setUnlocked(true), 600);
        setTimeout(() => runAnimation(), 3800);
      }
    }, 28);
  }

  useEffect(() => {
    runAnimation();
    return () => clearInterval(timerRef.current);
  }, []);

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden', margin: '0 0 16px' }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#17B8E0', animation: 'pulse 2s ease infinite' }} />
        <span style={{ fontSize: '0.68rem', color: 'rgba(238,242,247,0.4)', fontFamily: 'monospace' }}>Stage 3 · Building Consistent Habits</span>
      </div>
      <div style={{ padding: '14px 16px 0' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#17B8E0', margin: '0 0 6px' }}>Reflect on This</p>
        <p style={{ fontSize: '0.82rem', color: 'rgba(238,242,247,0.65)', lineHeight: 1.6, fontStyle: 'italic', margin: '0 0 12px' }}>
          "Think about one behavior you already do reliably at work, something that happens almost automatically. What triggers it?"
        </p>
        <div style={{ minHeight: '72px', background: 'rgba(15,23,42,0.8)', border: `1px solid ${typed.length > 0 ? 'rgba(23,184,224,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '8px', padding: '10px 12px', fontSize: '0.78rem', color: 'rgba(238,242,247,0.75)', lineHeight: 1.65, marginBottom: '12px', transition: 'border-color 0.3s ease' }}>
          {typed}
          {!done && <span style={{ display: 'inline-block', width: '2px', height: '13px', background: '#17B8E0', marginLeft: '1px', verticalAlign: 'middle', animation: 'blink 0.8s step-end infinite' }} />}
        </div>
          <div style={{ padding: '0 0 14px' }}>
            <div style={{ width: '100%', padding: '10px', borderRadius: '8px', background: done ? '#17B8E0' : 'rgba(23,184,224,0.08)', border: `1px solid ${done ? '#17B8E0' : 'rgba(23,184,224,0.15)'}`, color: done ? '#0D1520' : 'rgba(23,184,224,0.4)', fontSize: '0.75rem', fontWeight: 700, textAlign: 'center', transition: 'all 0.4s ease', transform: unlocked ? 'scale(1.02)' : 'scale(1)' }}>
              Continue to Stage 4 →
            </div>
          </div>
      </div>
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(0.75)}}@media(max-width:480px){.onboarding-inner{padding:24px 20px 24px!important}}`}</style>
    </div>
  );
}

// ── Steps ─────────────────────────────────────────────────────────────────────

const STEPS = [
  { tag: 'Welcome',             title: null,                           body: null,                                                                                                                                                                         icon: 'none',  hasPreview: false },
  { tag: 'How it works',        title: '7 stages. One real output.',   body: "Each sprint has 7 stages. The first six build the concept one layer at a time. Stage 7 is the Summit, where you produce something concrete that applies to your actual job.", icon: 'none',  hasPreview: 'stages' },
  { tag: 'The reflection gate', title: 'You write your way through.',  body: "Each stage ends with a reflection prompt. No multiple choice, no ratings. Just your honest thinking in your own words. That's what makes it actually land. Here's what it looks like:", icon: 'gate',  hasPreview: 'reflection' },
  { tag: 'Your coach',          title: 'A coach in your corner.',      body: "Each sprint comes with an AI coach that knows your content. It won't give you the answers. It'll push you to find them. Use it when something clicks, when you're stuck, or when you want to go further.", icon: 'coach', hasPreview: 'coach' },
  { tag: "Let's go",            title: null,                           body: null,                                                                                                                                                                         icon: 'none',  hasPreview: false, isFinal: true },
];

function renderIcon(icon) {
  if (icon === 'logo')  return <LogoIcon />;
  if (icon === 'coach') return <CoachIcon />;
  if (icon === 'gate')  return <StepIcon label="✦" />;
  if (icon === 'none')  return null;
  return null;
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function OnboardingModal({ assignedSprint = null, managerName = null }) {
  const router = useRouter();
  const [step,      setStep]      = useState(0);
  const [visible,   setVisible]   = useState(false);
  const [exiting,   setExiting]   = useState(false);
  const [userId,    setUserId]    = useState(null);
  const [firstName, setFirstName] = useState(null);

  useEffect(() => {
    async function checkOnboarding() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const uid = session.user.id;
      setUserId(uid);

      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed, full_name')
        .eq('id', uid)
        .single();

      if (profile?.full_name) {
        setFirstName(profile.full_name.split(' ')[0]);
      }

      if (!profile?.onboarding_completed && !sessionStorage.getItem('summitskills_onboarding_skipped')) {
        setTimeout(() => setVisible(true), 400);
      }
    }
    checkOnboarding();
  }, []);

  async function dismiss() {
    setExiting(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('summitskills_onboarding_skipped', '1');
    }
    setTimeout(() => {
      setVisible(false);
      setExiting(false);
    }, 300);
  }

  function handleNext() {
    if (step < STEPS.length - 1) { setStep(s => s + 1); }
    else {
      dismiss();
      if (assignedSprint) router.push(`/summit/${assignedSprint.id}/day/1`);
    }
  }

  if (!visible) return null;

  const greeting    = firstName ? `Good to have you, ${firstName}.` : 'Skills that actually stick.';
  const welcomeBody = 'Most skill-building fails because it stops at reading. Every sprint here asks you to actually do something. A small, specific action that connects the idea to your real work.';
  const isLastStep  = step === STEPS.length - 1;
  const current     = STEPS[step];
  const finalTitle  = assignedSprint ? `${managerName ? `${managerName} has` : 'Your manager has'} assigned you a sprint.` : `${firstName ? `What do you want to get better at, ${firstName}?` : 'What do you want to get better at?'}`;
  const finalBody   = assignedSprint ? `You've been assigned "${assignedSprint.title}". Hit the button below to start Stage 1.` : "Pick something relevant to where you are right now. You can always start another one when you're done.";
  const finalCTA    = assignedSprint ? `Start "${assignedSprint.title}" →` : 'Pick your first sprint →';

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) dismiss(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(14px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '16px', overflowY: 'auto', minHeight: '100dvh', opacity: exiting ? 0 : 1, transition: 'opacity 0.3s ease' }}
    >
      <div className="onboarding-inner" style={{ background: '#101C2C', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: current.hasPreview ? '36px 40px 32px' : '48px', maxWidth: current.hasPreview ? '520px' : '480px', width: '100%', position: 'relative', transform: exiting ? 'translateY(12px)' : 'translateY(0)', transition: 'transform 0.3s ease', margin: 'auto' }}>

        {/* Back button */}
        {step > 0 && !isLastStep && (
          <button onClick={() => setStep(s => s - 1)}
            style={{ position: 'absolute', top: '18px', left: '20px', background: 'transparent', border: 'none', color: 'rgba(238,242,247,0.3)', fontSize: '0.75rem', cursor: 'pointer', padding: '4px 8px', fontFamily: 'var(--font-sans)', transition: 'color 0.15s' }}
            onMouseEnter={e => e.target.style.color = 'rgba(238,242,247,0.6)'}
            onMouseLeave={e => e.target.style.color = 'rgba(238,242,247,0.3)'}>
            ← Back
          </button>
        )}

        {/* Skip */}
        <button onClick={dismiss} style={{ position: 'absolute', top: '18px', right: '20px', background: 'transparent', border: 'none', color: 'rgba(238,242,247,0.3)', fontSize: '0.75rem', cursor: 'pointer', padding: '4px 8px', fontFamily: 'var(--font-sans)', transition: 'color 0.15s' }}
          onMouseEnter={e => e.target.style.color = 'rgba(238,242,247,0.6)'}
          onMouseLeave={e => e.target.style.color = 'rgba(238,242,247,0.3)'}>
          Skip
        </button>

        {/* Progress */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '28px' }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ height: '3px', flex: 1, borderRadius: '2px', background: i <= step ? '#17B8E0' : 'rgba(255,255,255,0.08)', transition: 'background 0.3s ease' }} />
          ))}
        </div>

        {renderIcon(current.icon)}

        <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: '#17B8E0', margin: '0 0 8px', fontFamily: 'var(--font-sans)' }}>{current.tag}</p>

        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', fontWeight: 800, lineHeight: 1.15, color: '#EEF2F7', margin: '0 0 12px', letterSpacing: '-0.02em' }}>
          {isLastStep ? finalTitle : step === 0 ? greeting : current.title}
        </h2>

        <p style={{ fontSize: '0.88rem', color: 'rgba(238,242,247,0.62)', lineHeight: 1.75, margin: `0 0 ${current.hasPreview ? '20px' : '32px'}`, fontFamily: 'var(--font-sans)' }}>
          {isLastStep ? finalBody : step === 0 ? welcomeBody : current.body}
        </p>

        {current.hasPreview === 'stages'     && <StagesPreview />}
        {current.hasPreview === 'reflection' && <ReflectionPreview />}
        {current.hasPreview === 'coach'      && <CoachPreview />}

        {current.hasPreview === 'reflection' && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '12px 14px', marginBottom: '20px' }}>
            <p style={{ fontSize: '0.75rem', color: 'rgba(238,242,247,0.45)', lineHeight: 1.65, margin: 0 }}>
              <strong style={{ color: 'rgba(238,242,247,0.65)' }}>Tip:</strong> Try to connect the concept to something specific in your own work. A real example is always more useful than a general one.
            </p>
          </div>
        )}

        {isLastStep && !assignedSprint ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: 'Productivity & Habits',           short: 'Productivity & Habits',      color: '#06B6D4' },
              { label: 'Financial Intelligence',          short: 'Financial Intelligence',     color: '#10B981' },
              { label: 'Leadership & People Management',  short: 'Leadership & Management',    color: '#6B8FD6' },
              { label: 'Sales, Persuasion & Negotiation', short: 'Sales & Negotiation',        color: '#F43F5E' },
              { label: 'Strategy & Innovation',           short: 'Strategy & Innovation',      color: '#0EA5E9' },
              { label: 'Marketing, Branding & Storytelling', short: 'Marketing & Branding',   color: '#EAB308' },
            ].map(({ label, short, color }) => (
              <button key={label}
                onClick={() => { dismiss(); router.push(`/library?category=${encodeURIComponent(label)}`); }}
                style={{ width: '100%', padding: '13px 16px', borderRadius: '10px', border: `1px solid ${color}33`, background: `${color}11`, color: '#EEF2F7', fontSize: '0.88rem', fontWeight: 600, fontFamily: 'var(--font-sans)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '10px' }}
                onMouseEnter={e => { e.currentTarget.style.background = `${color}22`; e.currentTarget.style.borderColor = `${color}66`; }}
                onMouseLeave={e => { e.currentTarget.style.background = `${color}11`; e.currentTarget.style.borderColor = `${color}33`; }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                {short}
              </button>
            ))}
          </div>
        ) : (
          <button onClick={handleNext}
            style={{ width: '100%', padding: '13px', borderRadius: '10px', border: 'none', background: '#17B8E0', color: '#0D1520', fontSize: '0.93rem', fontWeight: 700, fontFamily: 'var(--font-sans)', cursor: 'pointer', transition: 'opacity 0.15s' }}
            onMouseEnter={e => e.target.style.opacity = '0.88'}
            onMouseLeave={e => e.target.style.opacity = '1'}>
            {isLastStep ? finalCTA : step === STEPS.length - 2 ? 'Got it →' : 'Next →'}
          </button>
        )}

        <p style={{ textAlign: 'center', fontSize: '0.65rem', color: 'rgba(238,242,247,0.2)', marginTop: '14px', fontFamily: 'monospace' }}>
          {step + 1} / {STEPS.length}
        </p>
      </div>
    </div>
  );
}
