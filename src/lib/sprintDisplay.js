/**
 * How sprint names appear on cards vs book attribution.
 *
 * Card title  = skill / outcome name (course-like). NEVER the book title.
 * Inspired by = book title only (library / featured attribution).
 */

/**
 * @param {{ sprint_title?: string, sprint_skill?: string, title?: string } | null} book
 * @returns {string}
 */
export function displaySprintTitle(book) {
  if (!book) return 'Skill Sprint';

  const titled = String(book.sprint_title || '').trim();
  if (titled) return titled;

  // Fallback only when sprint_title is empty — never use book.title
  const skill = String(book.sprint_skill || '').trim();
  if (skill) {
    let s = skill.split(/[.;]/)[0].trim();
    s = s.replace(
      /^(A first-time manager learns to|You can|Build and reinforce|Run short|Managers who|The manager who)\s+/i,
      ''
    );
    const words = s.split(/\s+/).filter(Boolean);
    if (words.length > 8) {
      s = `${words.slice(0, 8).join(' ')}…`;
    }
    if (!s) return 'Skill Sprint';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  return 'Skill Sprint';
}

/**
 * reflection_data is jsonb — may be a plain string or { text: "..." }.
 * Safe for dashboard / reflections list rendering.
 */
export function displayReflectionText(reflectionData) {
  if (reflectionData == null || reflectionData === '') return '';
  if (typeof reflectionData === 'string') return reflectionData.trim();
  if (typeof reflectionData === 'object') {
    if (reflectionData.text != null) return String(reflectionData.text).trim();
    if (reflectionData.reflection != null) return String(reflectionData.reflection).trim();
    try {
      const s = JSON.stringify(reflectionData);
      return s === '{}' ? '' : s;
    } catch {
      return '';
    }
  }
  return String(reflectionData);
}
