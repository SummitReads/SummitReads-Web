// app/summit/[id]/day/[dayNum]/deep/page.jsx
// Route: /summit/:id/day/:dayNum/deep

"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/app/supabaseClient';
import SummitCoach from '@/components/SummitCoach';

export default function DeepDivePage({ params }) {
  const unwrappedParams = React.use(params);
  const id     = unwrappedParams.id;
  const dayNum = parseInt(unwrappedParams.dayNum);

  const [book,    setBook]    = useState(null);
  const [dayData, setDayData] = useState(null);
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [open,    setOpen]    = useState({ reading: true, examples: false, reflections: false, challenges: false });

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);

        const { data: bookData, error: bookErr } = await supabase
          .from('books').select('title, sprint_title, category').eq('id', id).single();
        const { data: dayRaw, error: dayErr } = await supabase
          .from('summit_days').select('title, bonus_content').eq('book_id', id).eq('day_number', dayNum).maybeSingle();

        if (bookErr || dayErr) { setError('Content not found'); setLoading(false); return; }
        setBook(bookData);
        setDayData(dayRaw);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }
    fetchData();
  }, [id, dayNum]);

  function toggle(key) {
    setOpen(prev => ({ ...prev, [key]: !prev[key] }));
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)' }}>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: 'var(--brand-teal)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        Loading…
      </div>
    </div>
  );

  if (error || !book || !dayData) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--text-main)', marginBottom: 8 }}>Content not found</div>
        <Link href={`/summit/${id}/day/${dayNum}`} style={{ color: 'var(--brand-teal)', fontSize: '0.875rem' }}>← Back to Stage {dayNum}</Link>
      </div>
    </div>
  );

  const bonus = dayData.bonus_content || {};
  const extReading   = bonus.extended_reading   || null;
  const realExamples = bonus.real_examples       || [];
  const reflections  = bonus.reflection_prompts  || [];
  const challenges   = bonus.action_challenges   || [];

  const sections = [
    {
      key: 'reading',
      label: 'Extended Reading',
      available: !!extReading,
      content: extReading ? (
        <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: 'var(--text-main)', margin: 0 }}>
          {extReading}
        </p>
      ) : null,
    },
    {
      key: 'examples',
      label: 'Real Examples',
      available: realExamples.length > 0,
      content: realExamples.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {realExamples.map((ex, i) => (
            <div key={i} style={{
              borderLeft: '2px solid rgba(25,190,227,0.4)',
              paddingLeft: 20,
              color: 'var(--text-main)',
              fontSize: '1.0rem',
              lineHeight: 1.8,
            }}>
              {typeof ex === 'string' ? ex : ex.story || ex.text || JSON.stringify(ex)}
            </div>
          ))}
        </div>
      ) : null,
    },
    {
      key: 'reflections',
      label: 'Reflection Prompts',
      available: reflections.length > 0,
      content: reflections.length > 0 ? (
        <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {reflections.map((r, i) => (
            <li key={i} style={{ color: 'var(--text-main)', fontSize: '1.0rem', lineHeight: 1.75 }}>
              {typeof r === 'string' ? r : r.prompt || JSON.stringify(r)}
            </li>
          ))}
        </ol>
      ) : null,
    },
    {
      key: 'challenges',
      label: 'Action Challenges',
      available: challenges.length > 0,
      content: challenges.length > 0 ? (
        <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {challenges.map((c, i) => (
            <li key={i} style={{ color: 'var(--text-main)', fontSize: '1.0rem', lineHeight: 1.75 }}>
              {typeof c === 'string' ? c : c.challenge || JSON.stringify(c)}
            </li>
          ))}
        </ol>
      ) : null,
    },
  ].filter(s => s.available);

  return (
    <>
      <div className="ambient-glow" />

      {/* Nav */}
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

      <main className="container" style={{ maxWidth: 720, paddingTop: 40, paddingBottom: 100 }}>

        {/* Back link */}
        <div style={{ marginBottom: 32 }}>
          <Link
            href={`/summit/${id}/day/${dayNum}`}
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '0.75rem',
              color: 'var(--brand-teal)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            ← Back to Stage {dayNum}
          </Link>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ marginBottom: 10 }}>
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '0.7rem',
              color: 'var(--brand-teal)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontWeight: 700,
            }}>
              Stage {dayNum} · Go Deeper
            </span>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '2.2rem',
            fontWeight: 800,
            color: 'var(--text-main)',
            margin: 0,
            lineHeight: 1.2,
          }}>
            {dayData.title}
          </h1>
          <p style={{
            marginTop: 10,
            fontSize: '0.95rem',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-sans)',
          }}>
            {book.sprint_title || book.title}
          </p>
        </div>

        {/* Intro note */}
        <div style={{
          background: 'rgba(25,190,227,0.05)',
          border: '1px solid rgba(25,190,227,0.15)',
          borderRadius: 12,
          padding: '16px 20px',
          marginBottom: 36,
          fontSize: '0.9rem',
          color: 'rgba(255,255,255,0.6)',
          lineHeight: 1.6,
        }}>
          This material is optional. Complete the stage mission first — then come back here when you want more context, real examples, or something to reflect on.
        </div>

        {/* Accordion sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sections.map(section => (
            <div
              key={section.key}
              className="glass-panel"
              style={{ padding: 0, overflow: 'hidden' }}
            >
              {/* Header row */}
              <button
                onClick={() => toggle(section.key)}
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: open[section.key] ? 'var(--brand-teal)' : 'rgba(255,255,255,0.55)',
                    transition: 'color 0.2s ease',
                  }}>
                    {section.label}
                  </span>
                </div>
                <span style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '0.9rem',
                  color: 'rgba(255,255,255,0.3)',
                  transform: open[section.key] ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.25s ease',
                  display: 'inline-block',
                }}>
                  ↓
                </span>
              </button>

              {/* Content */}
              {open[section.key] && (
                <div style={{
                  padding: '0 24px 24px 24px',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  paddingTop: 20,
                }}>
                  {section.content}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom nav */}
        <div style={{ marginTop: 48, display: 'flex', gap: 12 }}>
          <Link
            href={`/summit/${id}/day/${dayNum}`}
            className="btn-outline"
            style={{ flex: 1, textAlign: 'center' }}
          >
            ← Back to Stage {dayNum}
          </Link>
          {dayNum < 7 && (
            <Link
              href={`/summit/${id}/day/${dayNum + 1}`}
              className="btn-primary"
              style={{ flex: 1, textAlign: 'center' }}
            >
              <span style={{ fontFamily: "'DM Mono', monospace" }}>Stage {dayNum + 1} →</span>
            </Link>
          )}
        </div>

      </main>

      {/* Summit Coach — only mounted once user is resolved */}
      {user && <SummitCoach bookId={id} dayNum={dayNum} userId={user.id} />}
    </>
  );
}
