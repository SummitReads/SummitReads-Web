'use client';
/**
 * Day 0 — "Before You Start" orientation.
 *
 * Presentation strategy (not raw markdown dump):
 *   1. Hook     — opening problem (strong lede)
 *   2. Thesis   — one-line sprint promise (callout)
 *   3. Learnings — six compact teaching cards (scannable)
 *   4. How it works — de-emphasized chrome (product, not book)
 *   5. Personal  — situation capture (the week’s spine)
 *   6. Handoff   — Day 1 question + CTA
 */
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';
import { type, t } from '@/lib/typeScale';

// ── Parse sprint_intro markdown into structured sections ───────────────────

function inlineBold(text, keyPrefix = 'ib') {
  if (!text) return null;
  const parts = [];
  const re = /\*\*([^*]+)\*\*/g;
  let last = 0;
  let m;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <strong key={`${keyPrefix}-${i++}`} style={{ fontWeight: 700, color: 'var(--text-main)' }}>
        {m[1]}
      </strong>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length ? parts : text;
}

/**
 * Split Day 0 markdown into:
 *   title, hookParagraphs[], thesis, learnIntro, teachings[{title,body}],
 *   howItWorks, beforeYouBegin[], day1Question
 */
function parseDay0(md) {
  const empty = {
    title: 'Before You Start',
    hookParagraphs: [],
    thesis: '',
    learnIntro: '',
    teachings: [],
    howItWorks: '',
    beforeYouBegin: [],
    day1Question: '',
  };
  if (!md || !String(md).trim()) return empty;

  const lines = String(md).replace(/\r\n/g, '\n').split('\n');
  let title = 'Before You Start';
  // Sections keyed by normalized ## header
  const sectionOrder = [];
  const sections = { _pre: [] };
  let current = '_pre';

  const norm = (h) => h.toLowerCase().replace(/['’]/g, "'").trim();

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const t = raw.trim();
    if (!t) {
      sections[current].push('');
      continue;
    }
    if (t.startsWith('# ') && !t.startsWith('## ')) {
      title = t.slice(2).trim();
      continue;
    }
    if (t.startsWith('## ')) {
      const name = t.slice(3).trim();
      const key = norm(name);
      current = key;
      if (!sections[current]) {
        sections[current] = [];
        sectionOrder.push(current);
      }
      continue;
    }
    if (!sections[current]) sections[current] = [];
    sections[current].push(t);
  }

  // Paragraphs from line arrays (blank line = break)
  function toParagraphs(arr) {
    const out = [];
    let buf = [];
    const flush = () => {
      const p = buf.join(' ').replace(/\s+/g, ' ').trim();
      if (p) out.push(p);
      buf = [];
    };
    for (const line of arr || []) {
      if (!line.trim()) flush();
      else buf.push(line.trim());
    }
    flush();
    return out;
  }

  // Teachings: **Title** + body (same line or following lines)
  function extractTeachings(arr) {
    const teachings = [];
    let learnIntro = '';
    let i = 0;
    const lines2 = arr || [];

    // Leading intro prose before first **
    const introBuf = [];
    while (i < lines2.length) {
      const t = lines2[i].trim();
      if (!t) {
        i += 1;
        continue;
      }
      if (t.startsWith('**')) break;
      introBuf.push(t);
      i += 1;
    }
    learnIntro = introBuf.join(' ').replace(/\s+/g, ' ').trim();

    while (i < lines2.length) {
      const t = lines2[i].trim();
      if (!t) {
        i += 1;
        continue;
      }
      // **Title** optional same-line body
      const m = t.match(/^\*\*([^*]+)\*\*\s*(.*)$/);
      if (m) {
        const teachTitle = m[1].trim();
        const sameLineBody = (m[2] || '').trim();
        i += 1;
        const bodyBuf = sameLineBody ? [sameLineBody] : [];
        while (i < lines2.length) {
          const n = lines2[i].trim();
          if (!n) {
            // allow single blank inside body; stop on double or next **
            i += 1;
            if (i < lines2.length && !lines2[i].trim()) break;
            continue;
          }
          if (n.startsWith('**')) break;
          bodyBuf.push(n);
          i += 1;
        }
        teachings.push({
          title: teachTitle,
          body: bodyBuf.join(' ').replace(/\s+/g, ' ').trim(),
        });
        continue;
      }
      i += 1;
    }
    return { learnIntro, teachings };
  }

  const preParas = toParagraphs(sections._pre);
  // Thesis: last pre paragraph that looks like the sprint promise
  let thesis = '';
  let hookParagraphs = preParas;
  if (preParas.length >= 2) {
    const last = preParas[preParas.length - 1];
    if (/^this sprint\b/i.test(last) || /\bteaches you\b/i.test(last)) {
      thesis = last;
      hookParagraphs = preParas.slice(0, -1);
    }
  }

  // Find learn section by fuzzy key
  const learnKey =
    sectionOrder.find((k) => k.includes('what you') && k.includes('learn')) ||
    sectionOrder.find((k) => k.includes('learn'));
  const howKey =
    sectionOrder.find((k) => k.includes('how the sprint') || k.includes('how it works')) ||
    sectionOrder.find((k) => k.includes('sprint works'));
  const beginKey =
    sectionOrder.find((k) => k.includes('before you begin') || k.includes('before you start'));
  const day1Key =
    sectionOrder.find((k) => k.includes('start day') || k.includes('day 1'));

  const { learnIntro, teachings } = extractTeachings(
    learnKey ? sections[learnKey] : []
  );

  const howParas = toParagraphs(howKey ? sections[howKey] : []);
  const beginParas = toParagraphs(beginKey ? sections[beginKey] : []);
  const day1Paras = toParagraphs(day1Key ? sections[day1Key] : []);

  return {
    title,
    hookParagraphs,
    thesis,
    learnIntro,
    teachings,
    howItWorks: howParas.join(' '),
    beforeYouBegin: beginParas,
    day1Question: day1Paras[0] || '',
  };
}

// ── UI pieces (semantic type scale — see lib/typeScale.js) ─────────────────

function SectionLabel({ children, style }) {
  return <div style={t('label', { marginBottom: 12, ...style })}>{children}</div>;
}

export default function Day0View({
  book,
  introMarkdown,
  bookId,
  situationText,
  onSituationChange,
  onSituationBlur,
  showSituation = true,
}) {
  const [localSituation, setLocalSituation] = useState(situationText || '');

  useEffect(() => {
    setLocalSituation(situationText || '');
  }, [situationText]);

  const doc = useMemo(() => parseDay0(introMarkdown), [introMarkdown]);

  return (
    <>
      <div className="ambient-glow" />
      <nav className="glass-nav">
        <div className="nav-content">
          <BrandLogo href="/library" />
          <div className="nav-actions">
            <Link href="/library" className="btn-outline small">
              Exit to Library
            </Link>
          </div>
        </div>
      </nav>

      <main
        className="container day-main"
        style={{ maxWidth: 680, paddingTop: 40, paddingBottom: 110 }}
      >
        {/* ── Chrome ─────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 28 }}>
          <div className="tag-featured" style={{ marginBottom: 12 }}>
            <div className="pulse-dot" />
            <span style={{ fontFamily: "'DM Mono', monospace" }}>Day 0</span>
            <span style={{ color: 'rgba(25,190,227,0.5)' }}>/</span>
            <span style={{ fontFamily: "'DM Mono', monospace" }}>7</span>
            <span style={{ color: 'rgba(25,190,227,0.5)', margin: '0 4px' }}>·</span>
            <span style={{ fontFamily: 'var(--font-sans)' }}>Orientation</span>
          </div>
          {/* Book title stays on library cards ("Inspired by") only — not inside the sprint */}
          <h1 className="text-gradient" style={t('display', { margin: 0 })}>
            {doc.title}
          </h1>
          <p style={t('caption', { margin: '10px 0 0 0', color: 'rgba(238,242,247,0.4)' })}>
            Read this once. Then Day 1 puts one idea on your real work.
          </p>
        </div>

        {/* ── 1. HOOK — same body size; first para emphasis via weight only ─ */}
        {doc.hookParagraphs.length > 0 && (
          <section style={{ marginBottom: 28 }}>
            {doc.hookParagraphs.map((p, idx) => (
              <p
                key={idx}
                style={
                  idx === 0
                    ? t('bodyEmphasis', { margin: '0 0 1.15rem 0', lineHeight: 1.72 })
                    : t('bodyMuted', { margin: '0 0 1rem 0', lineHeight: 1.72, color: 'rgba(238,242,247,0.82)' })
                }
              >
                {inlineBold(p, `hook${idx}`)}
              </p>
            ))}
          </section>
        )}

        {/* ── 2. THESIS callout ───────────────────────────────────────── */}
        {doc.thesis && (
          <div
            style={{
              marginBottom: 36,
              padding: '16px 18px',
              borderLeft: '3px solid var(--brand-teal)',
              background: 'rgba(25,190,227,0.07)',
              borderRadius: '0 12px 12px 0',
            }}
          >
            <div style={t('label', { marginBottom: 8, opacity: 0.9 })}>
              This sprint&apos;s bet
            </div>
            <p style={t('bodyEmphasis', { margin: 0, lineHeight: 1.6 })}>
              {inlineBold(doc.thesis, 'thesis')}
            </p>
          </div>
        )}

        {/* ── 3. WHAT YOU&apos;LL LEARN — six scannable cards ─────────── */}
        {doc.teachings.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <SectionLabel>What you&apos;ll practice</SectionLabel>
            {doc.learnIntro && (
              <p style={t('caption', { margin: '0 0 16px 0', color: 'rgba(238,242,247,0.5)' })}>
                {doc.learnIntro}
              </p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {doc.teachings.map((teach, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    gap: 14,
                    padding: '14px 16px',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(15, 23, 42, 0.55)',
                  }}
                >
                  <div
                    style={{
                      flexShrink: 0,
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: 'rgba(25,190,227,0.12)',
                      border: '1px solid rgba(25,190,227,0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      ...type.badge,
                      color: 'var(--brand-teal)',
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={t('bodyEmphasis', {
                        marginBottom: 4,
                        lineHeight: 1.35,
                        fontWeight: 700,
                      })}
                    >
                      {teach.title}
                    </div>
                    {teach.body && (
                      <p style={t('body', { margin: 0, color: 'rgba(238,242,247,0.72)' })}>
                        {teach.body}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── 4. HOW IT WORKS — product chrome, quiet (same size, muted) ─ */}
        {doc.howItWorks && (
          <section
            style={{
              marginBottom: 32,
              padding: '14px 16px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <SectionLabel style={{ marginBottom: 8, color: 'rgba(255,255,255,0.35)' }}>
              How each day works
            </SectionLabel>
            <p style={t('bodyMuted', { margin: 0, color: 'rgba(238,242,247,0.48)' })}>
              {doc.howItWorks}
            </p>
          </section>
        )}

        {/* ── 5–6. CLOSE: one personal ask + one handoff ───────────────── */}
        {showSituation && (
          <section
            className="glass-panel"
            style={{
              marginBottom: 16,
              padding: '20px 20px',
              borderColor: 'rgba(25,190,227,0.35)',
              background: 'rgba(25,190,227,0.06)',
            }}
          >
            <SectionLabel>Your situation this week</SectionLabel>
            <p style={t('bodyMuted', { margin: '0 0 14px 0', color: 'rgba(238,242,247,0.72)' })}>
              Name one real thread you will practice on — a person, habit, or
              friction at work. Every day comes back to this.
            </p>
            <textarea
              className="journal-input"
              value={localSituation}
              onChange={(e) => {
                setLocalSituation(e.target.value);
                onSituationChange?.(e.target.value);
              }}
              onBlur={() => onSituationBlur?.(localSituation)}
              placeholder="e.g. Status updates from Jordan that never land before standup"
              rows={2}
              style={{ minHeight: 68, marginBottom: 0, fontSize: type.body.fontSize }}
            />
          </section>
        )}

        {/* ── HANDOFF + CTA ──────────────────────────────────────────── */}
        <section
          className="glass-panel mission-panel highlighted"
          style={{ marginBottom: 24, padding: '22px 20px', textAlign: 'center' }}
        >
          <div style={t('label', { marginBottom: 10, justifyContent: 'center' })}>
            Day 1 starts here
          </div>
          {doc.day1Question ? (
            <p style={t('bodyEmphasis', { margin: '0 0 18px 0', lineHeight: 1.5 })}>
              {doc.day1Question}
            </p>
          ) : (
            <p style={t('bodyMuted', { margin: '0 0 18px 0', color: 'rgba(238,242,247,0.65)' })}>
              Fifteen minutes. One move. On real work.
            </p>
          )}
          <Link
            href={`/summit/${bookId}/day/1`}
            className="btn-primary-large"
            style={{ display: 'inline-flex', textDecoration: 'none' }}
          >
            Start Day 1
            <span className="arrow" style={{ fontSize: '1.1em' }}>
              →
            </span>
          </Link>
        </section>

        <div style={{ textAlign: 'center' }}>
          <Link
            href="/library"
            style={t('caption', { color: 'rgba(255,255,255,0.35)', textDecoration: 'none' })}
          >
            ← Back to library
          </Link>
        </div>
      </main>
    </>
  );
}
