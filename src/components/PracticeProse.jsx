'use client';

import { type, t } from '@/lib/typeScale';

/**
 * Glanceable teaching structure for practice days.
 * Target shape (Atomic Habits Day 1):
 *   Takeaway (skill)
 *   1–2 support lines
 *   How → 1 / 2 / 3
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

// Negation / antithesis — never the takeaway
const NEGATION_TAKEAWAY_RE =
  /\bis not\b|\bisn't\b|\bnot a technique\b|\bnot about\b|\bnot the\b/i;

// Doable skill language
const SKILLISH_RE =
  /\b(before you|ask one|ask what|attach|place|name |change |count |put |arrange|set |build|make the|the skill is|decision rule|instead of|stop before|write |pick |choose |decline |hold )\b/i;

/**
 * Pick a takeaway that names the skill.
 */
function pickTakeaway(sentences) {
  const usable = sentences.filter(
    (s) =>
      s.length >= 28 &&
      !BRIDGE_RE.test(s) &&
      !NEGATION_TAKEAWAY_RE.test(s)
  );
  if (!usable.length) {
    // last resort: first long sentence even if imperfect
    return sentences.find((s) => s.length >= 28) || sentences[0] || '';
  }

  // Prefer first skillish sentence (often the real skill claim)
  const firstSkillish = usable.find(
    (s) => SKILLISH_RE.test(s) && !PROBLEM_HOOK_RE.test(s)
  );
  if (firstSkillish) return firstSkillish;

  // Prefer opening sentence if it's not a hook
  if (!PROBLEM_HOOK_RE.test(usable[0])) return usable[0];

  const nonHook = usable.find((s) => !PROBLEM_HOOK_RE.test(s));
  return nonHook || usable[0];
}

/**
 * Line-start numbered steps: "1. …" on its own line.
 */
function extractLineDigitSteps(text) {
  const stepLineRe = /^\s*(\d+)\.\s+(.+?)\s*$/gm;
  const steps = [];
  let m;
  while ((m = stepLineRe.exec(text)) !== null) {
    steps.push({ n: m[1], text: m[2].trim(), index: m.index });
  }
  if (steps.length < 2) return null;
  const firstIdx = steps[0].index;
  let prose = text.slice(0, firstIdx).trim();
  prose = prose
    .replace(/\n*(?:Here is how|How to|The steps?|Do this)[^.]*\.?\s*:?\s*$/i, '')
    .trim();
  return {
    steps: steps.map(({ n, text: stepText }) => ({ n, text: stepText })),
    prose,
    after: '',
  };
}

/**
 * Inline numbered steps in one paragraph:
 * "... Every time. 1. Stop. 2. Ask. 3. Wait."
 * (Common writer output; line-start regex misses these.)
 */
function extractInlineDigitSteps(text) {
  // Find "1. " then capture through sequential 2. 3. ...
  const start = text.search(/(?:^|[.!?]\s+|\n)\s*1\.\s+\S/);
  if (start < 0) return null;

  // Normalize start to the digit
  const digitStart = text.indexOf('1.', start);
  if (digitStart < 0) return null;

  const tail = text.slice(digitStart);
  const re = /(\d+)\.\s+([\s\S]*?)(?=\s+\d+\.\s+|$)/g;
  const steps = [];
  let m;
  while ((m = re.exec(tail)) !== null) {
    const n = m[1];
    let body = m[2].trim();
    // stop if numbering jumps or we got noise
    if (steps.length && parseInt(n, 10) !== steps.length + 1) break;
    if (parseInt(n, 10) !== steps.length + 1 && steps.length === 0 && n !== '1') break;
    // trim trailing sentence that belongs after steps (heuristic: if very long and has "You are")
    body = body.replace(/\s+$/, '');
    if (!body) continue;
    steps.push({ n, text: body.replace(/\.+$/, '') + (body.endsWith('.') ? '' : '.') });
    if (steps.length >= 5) break;
  }

  if (steps.length < 2) return null;

  // Clean step text: only keep first sentence if step blob absorbed later prose
  const cleanSteps = steps.map((st, i) => {
    let t = st.text.trim();
    // If last step ate trailing commentary, keep first 1–2 sentences
    if (i === steps.length - 1) {
      const sents = splitSentences(t);
      if (sents.length > 2) t = sents.slice(0, 2).join(' ');
    }
    // Single sentence preferred
    const one = splitSentences(t)[0] || t;
    return { n: st.n, text: one };
  });

  let prose = text.slice(0, digitStart).trim();
  // Drop trailing "Here is how" / "Every time."
  prose = prose
    .replace(/\s*(?:Here is how(?: to apply[^.]*)?|How to apply[^.]*)\.?\s*$/i, '')
    .trim();

  return { steps: cleanSteps, prose, after: '' };
}

/**
 * First, … Second, … Third, …
 */
function extractOrdinalSteps(text) {
  const re = /\b(First|Second|Third|Fourth|Fifth),\s+([^.!?]+[.!?]?)/gi;
  const steps = [];
  let m;
  let firstIndex = -1;
  while ((m = re.exec(text)) !== null) {
    if (firstIndex < 0) firstIndex = m.index;
    const n = ORDINAL_TO_N[m[1].toLowerCase()];
    if (!n) continue;
    steps.push({
      n,
      text: m[2].trim().replace(/\.+$/, '') + '.',
      index: m.index,
      end: m.index + m[0].length,
    });
  }
  if (steps.length < 2) return null;
  if (parseInt(steps[0].n, 10) !== 1) return null;

  const last = steps[steps.length - 1];
  let before = text.slice(0, firstIndex).trim();
  const after = text.slice(last.end).trim();
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

function extractSteps(text) {
  return (
    extractLineDigitSteps(text) ||
    extractInlineDigitSteps(text) ||
    extractOrdinalSteps(text) || {
      steps: [],
      prose: text,
      after: '',
    }
  );
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

  const extracted = extractSteps(text);
  let { steps, prose, after: afterSteps } = extracted;
  afterSteps = afterSteps || '';

  const sentences = splitSentences(prose.replace(/\n+/g, ' ').trim());
  const afterSentences = splitSentences(afterSteps.replace(/\n+/g, ' ').trim());

  const lead = pickTakeaway(
    sentences.length ? sentences : afterSentences
  );

  function keepSupport(s) {
    if (!s || s === lead) return false;
    if (BRIDGE_RE.test(s)) return false;
    if (NEGATION_TAKEAWAY_RE.test(s) && s.length < 90) return false;
    if (s.length < 36) return false;
    if (PROBLEM_HOOK_RE.test(s) && s.length < 50) return false;
    return true;
  }

  // Cap support so skill block stays scannable (takeaway + ≤2 lines + how)
  const support = [];
  for (const s of sentences) {
    if (keepSupport(s) && support.length < 2) support.push(s);
  }
  for (const s of afterSentences) {
    if (keepSupport(s) && support.length < 2) support.push(s);
  }

  const cleanSteps = steps.map((st) => ({
    n: st.n,
    text: st.text.replace(/^[a-z]/, (c) => c.toUpperCase()).replace(/\.\.+$/, '.'),
  }));

  return {
    lead,
    support: support.filter((s, i, arr) => arr.indexOf(s) === i),
    steps: cleanSteps,
    bridge: cleanSteps.length ? 'How' : '',
  };
}

/**
 * Demo / miss: light structure — lead + short body, not a bullet wall.
 */
function parseLooseProse(raw) {
  const text = String(raw || '').replace(/\r\n/g, '\n').trim();
  if (!text) return { lead: '', body: '' };
  const sentences = splitSentences(text.replace(/\n+/g, ' '));
  if (sentences.length <= 1) return { lead: text, body: '' };
  const lead = sentences[0];
  const body = sentences.slice(1).join(' ');
  return { lead, body };
}

/**
 * @param {{ text: string, variant?: 'skill' | 'demo' | 'fail' | 'default' }} props
 */
export default function PracticeProse({ text, variant = 'default' }) {
  const isSkill = variant === 'skill';
  const isFail = variant === 'fail';
  const isDemo = variant === 'demo';

  const bodyColor = isFail
    ? 'rgba(238,242,247,0.82)'
    : 'var(--text-main)';

  // Demo + common miss: tighter prose, not sentence bullets
  if (isDemo || isFail || variant === 'default') {
    if (!isSkill) {
      const { lead, body } = parseLooseProse(text);
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {lead && (
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
          {body && (
            <p
              style={t('body', {
                margin: 0,
                lineHeight: 1.6,
                color: 'rgba(238,242,247,0.72)',
              })}
            >
              {body}
            </p>
          )}
        </div>
      );
    }
  }

  const { lead, support, steps, bridge } = parsePracticeProse(text);

  if (!lead && support.length === 0 && steps.length === 0) {
    return (
      <div style={t('body', { whiteSpace: 'pre-wrap', color: bodyColor })}>
        {text}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {lead && (
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

      {steps.length > 0 && (
        <div>
          <div
            style={t('label', {
              marginBottom: 8,
              color: 'rgba(25,190,227,0.55)',
              fontSize: '0.58rem',
            })}
          >
            {bridge || 'How'}
          </div>
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
                style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}
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
                    background: 'rgba(25,190,227,0.12)',
                    border: '1px solid rgba(25,190,227,0.22)',
                    ...type.badge,
                    fontSize: '0.65rem',
                    color: 'var(--brand-teal)',
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
        </div>
      )}
    </div>
  );
}
