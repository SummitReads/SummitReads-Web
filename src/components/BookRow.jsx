"use client";
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useState, useRef } from 'react';
import Link from 'next/link';

const CATEGORY_RULES = [
  // Emerald — wealth, growth, financial confidence
  { keywords: ['financial', 'investing', 'money', 'wealth'],         color: '#10B981', tint: 'rgba(16,185,129,0.04)'  },
  // Slate blue — authority, trust, institutional leadership
  { keywords: ['leadership', 'people management', 'management'],     color: '#6B8FD6', tint: 'rgba(107,143,214,0.04)' },
  // Cyan — focus, clarity, output-oriented
  { keywords: ['productivity', 'habits', 'performance', 'minimal'],  color: '#06B6D4', tint: 'rgba(6,182,212,0.04)'   },
  // Lime — visibility, creativity, stand-out energy — fits branding/storytelling
  { keywords: ['marketing', 'branding', 'storytelling'],             color: '#84CC16', tint: 'rgba(132,204,22,0.04)'  },
  // Amber — premium energy, revenue, boardroom confidence
  { keywords: ['sales', 'persuasion', 'negotiation', 'influence'],   color: '#FB7185', tint: 'rgba(251,113,133,0.04)'  },
  // Sky blue — elevated thinking, vision, clarity at altitude
  { keywords: ['strategy', 'innovation', 'business model'],          color: '#0EA5E9', tint: 'rgba(14,165,233,0.04)'  },
  // Rose — warmth, human connection, interpersonal energy
  { keywords: ['communication', 'conversation', 'writing'],          color: '#F43F5E', tint: 'rgba(244,63,94,0.04)'   },
  // Violet — depth, self-awareness, internal work
  { keywords: ['mindset', 'psychology', 'mental', 'emotional'],      color: '#8B5CF6', tint: 'rgba(139,92,246,0.04)'  },
  // Red-orange — boldness, risk, building from scratch
  { keywords: ['entrepreneurship', 'startup', 'founder'],            color: '#EF4444', tint: 'rgba(239,68,68,0.04)'   },
  // Gold — human connection, warmth, long-term trust
  { keywords: ['relationships', 'network', 'social'],                color: '#EAB308', tint: 'rgba(234,179,8,0.04)'   },
];

const DEFAULT_TINT  = 'rgba(25,190,227,0.03)';
const DEFAULT_COLOR = '#19BEE3';

function getCategoryMatch(category) {
  if (!category) return null;
  const lower = category.toLowerCase();
  return CATEGORY_RULES.find(rule => rule.keywords.some(kw => lower.includes(kw))) || null;
}

function getCategoryTint(category)  { return getCategoryMatch(category)?.tint  || DEFAULT_TINT;  }
function getCategoryColor(category) { return getCategoryMatch(category)?.color || DEFAULT_COLOR; }

// Abbreviate long category names so they never wrap
function abbreviateCategory(category) {
  if (!category) return 'Growth';
  const abbr = {
    'leadership & people management': 'Leadership',
    'marketing, branding & storytelling': 'Marketing & Branding',
    'sales, persuasion & negotiation': 'Sales & Negotiation',
    'productivity & habits': 'Productivity',
    'strategy & innovation': 'Strategy',
  };
  return abbr[category.toLowerCase()] || category;
}

function BookRow({ title, books, description }) {
  const [showLeftArrow,  setShowLeftArrow]  = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const scrollContainerRef = useRef(null);

  const scroll = (direction) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTo({
      left: direction === 'left'
        ? container.scrollLeft - (window.innerWidth < 768 ? 280 : 480)
        : container.scrollLeft + (window.innerWidth < 768 ? 280 : 480),
      behavior: 'smooth'
    });
  };

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    setShowLeftArrow(container.scrollLeft > 10);
    setShowRightArrow(container.scrollLeft < container.scrollWidth - container.clientWidth - 10);
  };

  return (
    <div style={{ position: 'relative', marginBottom: '56px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{
            fontSize: '1.4rem', fontWeight: '700', color: 'white',
            fontFamily: 'var(--font-serif)', margin: 0, letterSpacing: '-0.01em',
          }}>
            {title}
          </h2>
          {description && (
            <p style={{ fontSize: '0.8rem', color: '#475569', margin: '5px 0 0' }}>
              {description}
            </p>
          )}
        </div>
        <Link
          href="/library"
          style={{ fontSize: '0.78rem', color: 'var(--brand-teal)', textDecoration: 'none', fontWeight: '600', flexShrink: 0, transition: 'opacity 0.15s' }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          View all →
        </Link>
      </div>

      <div style={{ position: 'relative' }}>
        {showLeftArrow && (
          <button onClick={() => scroll('left')} style={{
            position: 'absolute', left: '-14px', top: '50%',
            transform: 'translateY(-50%)', zIndex: 10,
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'rgba(10,16,30,0.95)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--brand-teal)'; e.currentTarget.style.color = 'var(--brand-teal)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
          >
            <ChevronLeft size={14} />
          </button>
        )}
        {showRightArrow && (
          <button onClick={() => scroll('right')} style={{
            position: 'absolute', right: '-14px', top: '50%',
            transform: 'translateY(-50%)', zIndex: 10,
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'rgba(10,16,30,0.95)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--brand-teal)'; e.currentTarget.style.color = 'var(--brand-teal)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
          >
            <ChevronRight size={14} />
          </button>
        )}

        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="scrollbar-hide"
          style={{ display: 'flex', gap: '14px', overflowX: 'auto', paddingBottom: '4px', alignItems: 'stretch' }}
        >
          {books.map((book) => (
            <div key={book.id} style={{ flexShrink: 0, width: '230px', display: 'flex' }}>
              <SprintCard book={book} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SprintCard({ book }) {
  const [hovered, setHovered] = useState(false);

  const categoryColor = getCategoryColor(book.category);
  const categoryTint  = getCategoryTint(book.category);
  const categoryLabel = abbreviateCategory(book.category);

  const shortDesc = book.description
    ? book.description.length > 80
      ? book.description.substring(0, 80).trimEnd() + '…'
      : book.description
    : null;

  // Muted version of category color for the filled button state
  const buttonFillColor = `${categoryColor}CC`; // 80% opacity so it's not so saturated

  return (
    <Link href={`/summit/${book.id}/day/1`} style={{ textDecoration: 'none', display: 'flex', width: '100%' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: hovered ? 'rgba(255,255,255,0.05)' : categoryTint,
          border: `1px solid ${hovered ? `${categoryColor}55` : 'rgba(255,255,255,0.08)'}`,
          borderRadius: '12px',
          cursor: 'pointer',
          transition: 'border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease',
          boxShadow: hovered
            ? `0 0 0 1px ${categoryColor}18, inset 0 0 40px ${categoryColor}08`
            : 'none',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          overflow: 'hidden',
        }}
      >
        {/* Top accent line — 3px, category color */}
        <div style={{
          height: '3px',
          background: hovered
            ? `linear-gradient(90deg, ${categoryColor}, transparent)`
            : `linear-gradient(90deg, ${categoryColor}70, transparent)`,
          transition: 'opacity 0.2s ease',
          flexShrink: 0,
        }} />

        {/* Card body */}
        <div style={{ padding: '18px 18px 14px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>

          {/* Tag — specific to this book, not the section header */}
          <div style={{
            fontSize: '0.62rem',
            fontWeight: '800',
            color: categoryColor,
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {book.sprint_skill || categoryLabel}
          </div>

          {/* Sprint title */}
          <h3 style={{
            fontSize: '1.08rem',
            fontWeight: '750',
            color: 'white',
            fontFamily: 'var(--font-serif)',
            margin: 0,
            lineHeight: 1.3,
            letterSpacing: '-0.01em',
          }}>
            {book.sprint_title || book.title}
          </h3>

          {/* 7-Day Sprint */}
          <div style={{
            fontSize: '0.7rem',
            color: 'rgba(255,255,255,0.4)',
            fontWeight: '600',
            letterSpacing: '0.2px',
          }}>
            7-Day Sprint
          </div>

          {shortDesc && (
            <p style={{
              fontSize: '0.78rem',
              color: 'rgba(255,255,255,0.42)',
              margin: '4px 0 0',
              lineHeight: 1.55,
            }}>
              {shortDesc}
            </p>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0 18px' }} />

        {/* Attribution — author bold, book title italic below */}
        <div style={{ padding: '12px 18px 14px' }}>
          <div style={{
            fontSize: '0.62rem',
            color: 'rgba(255,255,255,0.35)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontWeight: '700',
            marginBottom: '5px',
          }}>
            Inspired by
          </div>
          {/* Book title — italic, fulfills the "Inspired by" label */}
          <div style={{
            fontSize: '0.8rem',
            color: 'rgba(255,255,255,0.75)',
            fontStyle: 'italic',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {book.title}
          </div>
        </div>

        {/* CTA */}
        <div style={{ padding: '0 14px 14px' }}>
          <div style={{
            background: hovered ? buttonFillColor : 'transparent',
            color: hovered ? '#0F172A' : categoryColor,
            border: `1px solid ${hovered ? buttonFillColor : `${categoryColor}45`}`,
            borderRadius: '7px',
            padding: '9px',
            textAlign: 'center',
            fontSize: '0.78rem',
            fontWeight: '700',
            letterSpacing: '0.3px',
            transition: 'all 0.2s ease',
          }}>
            Start Sprint →
          </div>
        </div>
      </div>
    </Link>
  );
}

export default BookRow;
