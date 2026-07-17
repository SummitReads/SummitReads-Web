'use client';

import { type, t } from '@/lib/typeScale';

/**
 * Turn flat teaching prose into glanceable structure for practice days.
 *
 * - Takeaway = the skill (not a problem hook or 3-word fragment)
 * - Numbered / First–Second–Third steps as a real HOW list
 * - Support stays as short paragraphs, not one bullet per sentence
 */

function splitSentences(text) {
  const s = (text || '').trim();
  if (!s) return [];
  const parts = s.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g);
  return (parts || [s]).map((p) => p.trim()).filter(Boolean);
}

const ORDINAL_TO_N = {
  first: '1',
  second: '2',
  third: '3',
  fourth: '4',
  fifth: '5',
};

const BRIDGE_RE =
  /^(here is how|how to apply|the steps?|do this|apply that to your own)/i;
const PROBLEM_HOOK_RE =
  /^(most |the hard part|willpower is not|the problem|you already know|routines fail)/i;
const SKILLISH_RE =
  /\b(attach|place|name |change |pause|count |put |arrange|set |build|make the|the skill is|decision rule|default)\b/i;

/**
 * Pick a takeaway that names the skill, not a hook or fragment.
 */
function pickTakeaway(sentences) {
  const usable = sentences.filter((s) => s.length >= 28 && !BRIDGE_RE.test(s));
  if (!usable.length) return sentences[0] || '';

  // Prefer an explicit skill sentence
  const skillish = usable.filter((s) => SKILLISH_RE.test(s) && !PROBLEM_HOOK_RE.test(s));
  if (skillish.length) {
    // Prefer shorter, punchy skill lines among skillish
    return skillish.sort((a, b) => a.length - b.length)[0];
  }

  // Prefer a closing definition-style line ("You are building…")
  const closing = usable.find((s) => /^you are\b/i.test(s));
  if (closing) return closing;

  // Skip problem hooks for the callout
  const nonHook = usable.find((s) => !PROBLEM_HOOK_RE.test(s));
  return nonHook || usable[0];
}

/**
 * Extract "1. …" / "2. …" line-style steps.
 */
function extractDigitSteps(text) {
  const stepLineRe = /^\s*(\d+)\.\s+(.+?)\s*$/gm;
  const steps = [];
  let m;
  while ((m = stepLineRe.exec(text)) !== null) {
    steps.push({ n: m[1], text: m[2].trim(), index: m.index });
  }
  if (steps.length < 2) return { steps: [], prose: text };
  const firstIdx = steps[0].index;
  let prose = text.slice(0, firstIdx).trim();
  prose = prose
    .replace(/\n*(?:Here is how|How to|The steps?|Do this)[^.]*\.?\s*:?\s*$/i, '')
    .trim();
  return {
    steps: steps.map(({ n, text: stepText }) => ({ n, text: stepText })),
    prose,
  };
}

/**
 * Extract "First, … Second, … Third, …" inline steps (common writer pattern).
 */
function extractOrdinalSteps(text) {
  const re =
    /\b(First|Second|Third|Fourth|Fifth),\s+([^.!?]+[.!?]?)/gi;
  const steps = [];
  let m;
  let firstIndex = -1;
  while ((m = re.exec(text)) !== null) {
    if (firstIndex < 0) firstIndex = m.index;
    const n = ORDINAL_TO_N[m[1].toLowerCase()];
    if (!n) continue;
    steps.push({ n, text: m[2].trim().replace(/\.+$/, '') + '.', index: m.index, end: m.index + m[0].length });
  }
  if (steps.length < 2) return { steps: [], prose: text, after: '' };

  // Require ascending 1,2,3… roughly in order
  const nums = steps.map((s) => parseInt(s.n, 10));
  if (nums[0] !== 1) return { steps: [], prose: text, after: '' };

  const last = steps[steps.length - 1];
  let before = text.slice(0, firstIndex).trim();
  const after = text.slice(last.end).trim();

  // Strip bridge before First
  before = before
    .replace(
      /\s*(?:Here is how(?: to apply that to your own work)?|How to apply that to your own work|The steps?|Do this)\.?\s*:?\s*$/i,
      ''
    )
    .trim();

  return {
    steps: steps.map(({ n, text: stepText }) => ({ n, text: stepText })),
    prose: before,
    after,
  };
}

/**
 * @returns {{ lead: string, support: string[], steps: { n: string, text: string }[], bridge: string }}
 */
export function parsePracticeProse(raw) {
  const text = String(raw || '')
    .replace(/\r\n/g, '\n')
    .replace(/\u00a0/g, ' ')
    .trim();
  if (!text) {
    return { lead: '', support: [], steps: [], bridge: '' };
  }

  // Prefer digit steps; else First/Second/Third
  let digit = extractDigitSteps(text);
  let steps = digit.steps;
  let prose = digit.prose;
  let afterSteps = '';

  if (steps.length < 2) {
    const ord = extractOrdinalSteps(text);
    if (ord.steps.length >= 2) {
      steps = ord.steps;
      prose = ord.prose;
      afterSteps = ord.after || '';
    }
  }

  // Flatten prose to sentences for lead + support
  const flatProse = prose.replace(/\n+/g, ' ').trim();
  const sentences = splitSentences(flatProse);
  const afterSentences = splitSentences(afterSteps.replace(/\n+/g, ' ').trim());

  const lead = pickTakeaway(
    sentences.length ? [...sentences, ...afterSentences] : afterSentences
  );

  function keepSupport(s) {
    if (!s || s === lead) return false;
    if (BRIDGE_RE.test(s)) return false;
    if (s.length < 36) return false; // drop fragments: "The setup is."
    if (PROBLEM_HOOK_RE.test(s) && s.length < 50) return false;
    return true;
  }

  const support = [];
  for (const s of sentences) {
    if (keepSupport(s)) support.push(s);
  }
  for (const s of afterSentences) {
    if (keepSupport(s)) support.push(s);
  }

  // Capitalize step starts ("name one…" → "Name one…")
  const cleanSteps = steps.map((st) => ({
    n: st.n,
    text: st.text.replace(/^[a-z]/, (c) => c.toUpperCase()),
  }));

  const supportDedup = support.filter((s, i, arr) => arr.indexOf(s) === i);

  return {
    lead,
    support: supportDedup,
    steps: cleanSteps,
    bridge: cleanSteps.length ? 'How' : '',
  };
}

/**
 * @param {{ text: string, variant?: 'skill' | 'demo' | 'fail' | 'default' }} props
 */
export default function PracticeProse({ text, variant = 'default' }) {
  const { lead, support, steps, bridge } = parsePracticeProse(text);
  const isSkill = variant === 'skill';
  const isFail = variant === 'fail';

  const bodyColor = isFail
    ? 'rgba(238,242,247,0.82)'
    : 'var(--text-main)';

  // Fallback: nothing parsed usefully
  if (!lead && support.length === 0 && steps.length === 0) {
    return (
      <div style={t('body', { whiteSpace: 'pre-wrap', color: bodyColor })}>
        {text}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isSkill ? 12 : 10 }}>
      {/* Lead takeaway — strongest on the skill block */}
      {lead && isSkill && (
        <div
          style={{
            padding: '10px 12px',
            borderRadius: 10,
            background: 'rgba(25,190,227,0.08)',
            borderLeft: '3px solid rgba(25,190,227,0.55)',
          }}
        >
          <div
            style={t('label', {
              marginBottom: 6,
              color: 'rgba(25,190,227,0.65)',
              fontSize: '0.58rem',
            })}
          >
            Takeaway
          </div>
          <p
            style={t('bodyEmphasis', {
              margin: 0,
              lineHeight: 1.5,
              color: 'rgba(238,242,247,0.95)',
            })}
          >
            {lead}
          </p>
        </div>
      )}

      {lead && !isSkill && (
        <p
          style={t('bodyEmphasis', {
            margin: 0,
            lineHeight: 1.55,
            color: isFail ? 'rgba(251, 196, 140, 0.95)' : bodyColor,
          })}
        >
          {lead}
        </p>
      )}

      {/* Support as short paragraphs — not one bullet per sentence */}
      {support.map((para, i) => (
        <p
          key={`p-${i}`}
          style={t('body', {
            margin: 0,
            lineHeight: 1.6,
            color: 'rgba(238,242,247,0.72)',
          })}
        >
          {para}
        </p>
      ))}

      {(bridge || steps.length > 0) && (
        <div style={{ marginTop: support.length || lead ? 2 : 0 }}>
          {(bridge || (isSkill && steps.length > 0)) && (
            <div
              style={t('label', {
                marginBottom: 8,
                color: isFail
                  ? 'rgba(251, 146, 60, 0.7)'
                  : 'rgba(25,190,227,0.55)',
                fontSize: '0.58rem',
              })}
            >
              {bridge || 'How'}
            </div>
          )}
          {steps.length > 0 && (
            <ol
              style={{
                margin: 0,
                padding: 0,
                listStyle: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {steps.map((step) => (
                <li
                  key={step.n}
                  style={{
                    display: 'flex',
                    gap: 10,
                    alignItems: 'flex-start',
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 1,
                      background: isFail
                        ? 'rgba(251, 146, 60, 0.12)'
                        : 'rgba(25,190,227,0.12)',
                      border: isFail
                        ? '1px solid rgba(251, 146, 60, 0.28)'
                        : '1px solid rgba(25,190,227,0.22)',
                      ...type.badge,
                      fontSize: '0.65rem',
                      color: isFail
                        ? 'rgba(251, 146, 60, 0.95)'
                        : 'var(--brand-teal)',
                    }}
                  >
                    {step.n}
                  </span>
                  <span
                    style={t('body', {
                      margin: 0,
                      lineHeight: 1.5,
                      color: bodyColor,
                      flex: 1,
                      minWidth: 0,
                    })}
                  >
                    {step.text}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
