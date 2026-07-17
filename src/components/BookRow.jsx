'use client';

import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useState, useRef } from 'react';
import SprintCard from '@/components/SprintCard';

/**
 * Category section: grid when few cards, horizontal shelf when many.
 */
const GRID_THRESHOLD = 8;

function BookRow({ title, books, description, forceGrid = false }) {
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const scrollContainerRef = useRef(null);

  const useGrid = forceGrid || books.length < GRID_THRESHOLD;

  const scroll = (direction) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTo({
      left:
        direction === 'left'
          ? container.scrollLeft - (window.innerWidth < 768 ? 280 : 480)
          : container.scrollLeft + (window.innerWidth < 768 ? 280 : 480),
      behavior: 'smooth',
    });
  };

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    setShowLeftArrow(container.scrollLeft > 10);
    setShowRightArrow(
      container.scrollLeft <
        container.scrollWidth - container.clientWidth - 10
    );
  };

  return (
    <div style={{ position: 'relative', marginBottom: 48 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 16,
          gap: 12,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: '1.15rem',
              fontWeight: 650,
              color: '#F8FAFC',
              fontFamily: 'var(--font-sans)',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </h2>
          {description && (
            <p
              style={{
                fontSize: '0.8rem',
                color: 'rgba(148, 163, 184, 0.85)',
                margin: '4px 0 0',
              }}
            >
              {description}
            </p>
          )}
        </div>
      </div>

      {useGrid ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 16,
          }}
        >
          {books.map((book) => (
            <SprintCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          {showLeftArrow && (
            <button
              type="button"
              onClick={() => scroll('left')}
              aria-label="Scroll left"
              style={{
                position: 'absolute',
                left: -12,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.65)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChevronLeft size={14} />
            </button>
          )}
          {showRightArrow && (
            <button
              type="button"
              onClick={() => scroll('right')}
              aria-label="Scroll right"
              style={{
                position: 'absolute',
                right: -12,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.65)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChevronRight size={14} />
            </button>
          )}

          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="scrollbar-hide"
            style={{
              display: 'flex',
              gap: 16,
              overflowX: 'auto',
              paddingBottom: 4,
              alignItems: 'stretch',
            }}
          >
            {books.map((book) => (
              <div
                key={book.id}
                style={{ flexShrink: 0, width: 240, display: 'flex' }}
              >
                <SprintCard book={book} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default BookRow;
