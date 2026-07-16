/**
 * SummitSkills semantic type scale.
 * Hierarchy = role (display / body / label / caption), not one-off rem values.
 * Keep this list small — successful SaaS products use ~4–6 text styles app-wide.
 */

export const type = {
  // Page / day titles
  display: {
    fontSize: '2.05rem',
    fontWeight: 800,
    letterSpacing: '-0.03em',
    lineHeight: 1.15,
  },

  // All primary reading: teaching, hook, thesis, mission, write-it-down prompt
  body: {
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: 1.65,
    color: 'var(--text-main)',
  },

  // Optional emphasis on body (weight only — same size as body)
  bodyEmphasis: {
    fontSize: '1rem',
    fontWeight: 500,
    lineHeight: 1.65,
    color: 'var(--text-main)',
  },

  // Secondary body (same size, quieter color)
  bodyMuted: {
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: 1.65,
    color: 'rgba(238,242,247,0.72)',
  },

  // Section labels: THE MOVE, WRITE IT DOWN, mono chrome
  label: {
    fontFamily: "'DM Mono', monospace",
    fontSize: '0.66rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--brand-teal)',
  },

  // Helpers: shape guide, hints, progress %, placeholders, quiet chrome
  caption: {
    fontSize: '0.8rem',
    fontWeight: 400,
    lineHeight: 1.5,
    color: 'rgba(238,242,247,0.45)',
  },

  // Number badges in lists (1–6 teachings, 1–4 practice)
  badge: {
    fontFamily: "'DM Mono', monospace",
    fontSize: '0.72rem',
    fontWeight: 700,
  },
};

/** Merge type role with optional overrides */
export function t(role, extra = {}) {
  return { ...type[role], ...extra };
}
