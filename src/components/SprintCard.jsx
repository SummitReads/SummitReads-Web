'use client';

import { useState } from 'react';
import Link from 'next/link';
import { displaySprintTitle } from '@/lib/sprintDisplay';

/** Short category label for card chrome */
export function abbreviateCategory(category) {
  if (!category) return 'Skill';
  const abbr = {
    'leadership & people management': 'Leadership',
    'marketing, branding & storytelling': 'Marketing',
    'sales, persuasion & negotiation': 'Sales',
    'productivity & habits': 'Productivity',
    'strategy & innovation': 'Strategy',
    'financial intelligence': 'Finance',
    'coaching & development': 'Coaching',
    'setting direction & priorities': 'Priorities',
  };
  return abbr[category.toLowerCase()] || category.split(/[&,]/)[0].trim();
}

/**
 * Premium solid sprint card — shared by grid, carousel, and compact modes.
 * Book name only under "Inspired by".
 */
export default function SprintCard({
  book,
  href,
  ctaLabel = 'Start →',
  compact = false,
}) {
  const [hovered, setHovered] = useState(false);
  const title = displaySprintTitle(book);
  const categoryLabel = abbreviateCategory(book.category);
  const link = href || `/summit/${book.id}/day/0`;

  return (
    <Link
      href={link}
      style={{ textDecoration: 'none', display: 'flex', width: '100%', height: '100%' }}
    >
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: hovered ? 'rgba(26, 35, 50, 1)' : 'rgba(17, 24, 39, 0.95)',
          border: `1px solid ${hovered ? 'rgba(25,190,227,0.35)' : 'rgba(255,255,255,0.07)'}`,
          borderRadius: 12,
          cursor: 'pointer',
          transition: 'border-color 0.15s ease, background 0.15s ease, transform 0.15s ease',
          transform: hovered ? 'translateY(-1px)' : 'none',
          boxShadow: hovered ? '0 8px 24px rgba(0,0,0,0.35)' : '0 1px 0 rgba(255,255,255,0.04)',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          minHeight: compact ? 200 : 248,
          overflow: 'hidden',
        }}
      >
        {/* Left accent bar via top strip — brand teal only */}
        <div
          style={{
            height: 2,
            background: hovered
              ? 'var(--brand-teal)'
              : 'rgba(25,190,227,0.45)',
            flexShrink: 0,
          }}
        />

        <div
          style={{
            padding: compact ? '16px 16px 12px' : '18px 18px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            flex: 1,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.62rem',
              fontWeight: 600,
              color: 'rgba(25,190,227,0.85)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {categoryLabel}
          </div>

          <h3
            style={{
              fontSize: compact ? '0.98rem' : '1.05rem',
              fontWeight: 650,
              color: '#F8FAFC',
              fontFamily: 'var(--font-sans)',
              margin: 0,
              lineHeight: 1.35,
              letterSpacing: '-0.02em',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: compact ? '2.6em' : '2.7em',
            }}
          >
            {title}
          </h3>

          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.68rem',
              color: 'rgba(148, 163, 184, 0.9)',
              fontWeight: 500,
              letterSpacing: '0.02em',
            }}
          >
            7-day sprint
          </div>
        </div>

        <div
          style={{
            height: 1,
            background: 'rgba(255,255,255,0.06)',
            margin: '0 16px',
          }}
        />

        <div style={{ padding: '12px 16px 10px' }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.58rem',
              color: 'rgba(148, 163, 184, 0.75)',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            Inspired by
          </div>
          <div
            style={{
              fontSize: '0.8rem',
              color: 'rgba(226, 232, 240, 0.72)',
              fontStyle: 'italic',
              fontFamily: 'var(--font-sans)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {book.title}
          </div>
        </div>

        <div style={{ padding: '0 14px 14px' }}>
          <div
            style={{
              background: hovered ? 'var(--brand-teal)' : 'transparent',
              color: hovered ? '#0B1220' : 'var(--brand-teal)',
              border: `1px solid ${hovered ? 'var(--brand-teal)' : 'rgba(25,190,227,0.35)'}`,
              borderRadius: 8,
              padding: '9px 10px',
              textAlign: 'center',
              fontSize: '0.78rem',
              fontWeight: 650,
              fontFamily: 'var(--font-sans)',
              letterSpacing: '0.01em',
              transition: 'all 0.15s ease',
            }}
          >
            {ctaLabel}
          </div>
        </div>
      </div>
    </Link>
  );
}
