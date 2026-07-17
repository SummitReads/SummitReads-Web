'use client';

import { type, t } from '@/lib/typeScale';

/**
 * Turn flat teaching prose into glanceable structure for practice days.
 * No content rewrite required — parses numbered steps + lead sentence client-side.
 *
 * - Lead takeaway (first sentence) — optional callout on framework
 * - Supporting paragraphs
 * - Numbered steps as a real list when present (1. 2. 3.)
 */

function splitSentences(text) {
  const s = (text || '').trim();
  if (!s) return [];
  const parts = s.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g);
  return (parts || [s]).map((p) => p.trim()).filter(Boolean);
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

  // Numbered steps: "1. …" on their own lines or after a blank line.
  // Require 2+ steps so "1. something" mid-prose alone doesn't false-trigger.
  const stepLineRe = /^\s*(\d+)\.\s+(.+?)\s*$/gm;
  const steps = [];
  let m;
  while ((m = stepLineRe.exec(text)) !== null) {
    steps.push({ n: m[1], text: m[2].trim(), index: m.index });
  }

  let prose = text;
  let bridge = '';

  if (steps.length >= 2) {
    const firstIdx = steps[0].index;
    prose = text.slice(0, firstIdx).trim();
    // Drop a short "Here is how:" bridge before the list
    const bridgeMatch = prose.match(
      /(?:^|\n)((?:Here is how|How(?: to)?|The steps?|Do this|The move is[^.]*\.)\s*:?)\s*$/i
    );
    if (bridgeMatch) {
      bridge = bridgeMatch[1].replace(/:$/, '').trim();
      prose = prose.slice(0, bridgeMatch.index).trim();
    } else {
      // Common: "The move is to …. Here is how:"
      prose = prose
        .replace(/\n*(?:Here is how|How to|The steps?|Do this)\s*:?\s*$/i, '')
        .trim();
    }
  } else {
    // Not a real list — ignore stray single "1."
    steps.length = 0;
  }

  // Paragraphs first, then sentence lead from the first paragraph
  const paras = prose
    ? prose.split(/\n\n+/).map((p) => p.replace(/\n/g, ' ').trim()).filter(Boolean)
    : [];

  let lead = '';
  const support = [];

  if (paras.length === 0) {
    // steps-only block
  } else if (paras.length === 1) {
    const sentences = splitSentences(paras[0]);
    if (sentences.length <= 1) {
      lead = sentences[0] || paras[0];
    } else {
      lead = sentences[0];
      support.push(sentences.slice(1).join(' '));
    }
  } else {
    const firstSentences = splitSentences(paras[0]);
    if (firstSentences.length <= 1) {
      lead = paras[0];
      support.push(...paras.slice(1));
    } else {
      lead = firstSentences[0];
      const restFirst = firstSentences.slice(1).join(' ');
      if (restFirst) support.push(restFirst);
      support.push(...paras.slice(1));
    }
  }

  return {
    lead,
    support,
    steps: steps.map(({ n, text: stepText }) => ({ n, text: stepText })),
    bridge,
  };
}

/** For skill blocks without numbered steps: break support into glanceable lines. */
function supportAsLines(supportParas) {
  const lines = [];
  for (const para of supportParas) {
    const sentences = splitSentences(para);
    if (sentences.length >= 2) {
      lines.push(...sentences);
    } else if (para) {
      lines.push(para);
    }
  }
  return lines;
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

  // Skill + no steps: stack support sentences as quiet points (scan-friendly)
  const skillPoints =
    isSkill && steps.length === 0 ? supportAsLines(support) : [];
  const showSupportParas = !(isSkill && steps.length === 0 && skillPoints.length > 0);

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

      {showSupportParas &&
        support.map((para, i) => (
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

      {skillPoints.length > 0 && (
        <ul
          style={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {skillPoints.map((line, i) => (
            <li
              key={`pt-${i}`}
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  marginTop: 8,
                  background: 'rgba(25,190,227,0.45)',
                }}
              />
              <span
                style={t('body', {
                  margin: 0,
                  lineHeight: 1.5,
                  color: 'rgba(238,242,247,0.72)',
                  flex: 1,
                  minWidth: 0,
                })}
              >
                {line}
              </span>
            </li>
          ))}
        </ul>
      )}

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
