'use client'
import { useState, useEffect, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import BookRow from '@/components/BookRow'
import SprintCard from '@/components/SprintCard'
import OnboardingModal from '@/components/OnboardingModal'
import AppNav from '@/components/AppNav'
import {
  displaySprintTitle,
  sprintArcLine,
  sprintDayJobLine,
  sprintOpenLoopLine,
} from '@/lib/sprintDisplay'

const GRID_THRESHOLD = 8

// ── Loading skeleton ──────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div style={{ animation: 'pulse 1.6s ease-in-out infinite' }}>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .skel { background: rgba(255,255,255,0.06); border-radius: 10px; }
      `}</style>
      <div
        style={{
          marginBottom: 40,
          padding: 28,
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(17,24,39,0.9)',
        }}
      >
        <div className="skel" style={{ width: 100, height: 14, marginBottom: 16 }} />
        <div className="skel" style={{ width: '55%', height: 28, marginBottom: 12 }} />
        <div className="skel" style={{ width: '80%', height: 14, marginBottom: 8 }} />
        <div className="skel" style={{ width: 120, height: 40, marginTop: 20, borderRadius: 8 }} />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        {[1, 2, 3, 4].map((j) => (
          <div key={j} className="skel" style={{ height: 248, borderRadius: 12 }} />
        ))}
      </div>
    </div>
  )
}

// ── Today's practice (open-loop pull) ───────────────────────────────────────
// Primary return surface: unfinished personal thread + today's job + hard CTA.
// Secondary rows for other in-progress sprints stay compact.
function ContinueSection({ userSkills, practiceStreak }) {
  if (!userSkills?.length) return null
  const active = userSkills.filter((s) => !s.isComplete && (s.daysCompleted < 7 || s.nextDay))
  if (!active.length) return null

  const primary = active[0]
  const rest = active.slice(1, 3)
  const hasMore = active.length > 3

  const nextDay = primary.nextDay || Math.min((primary.daysCompleted || 0) + 1, 7)
  const progressPct =
    typeof primary.pct === 'number'
      ? primary.pct
      : Math.round(((primary.daysCompleted || 0) / 7) * 100)
  const label = displaySprintTitle({
    sprint_title: primary.sprintTitle,
    sprint_skill: primary.sprintSkill,
  })
  const jobLine = sprintDayJobLine(nextDay, primary.nextDayTitle)
  const openLoop = sprintOpenLoopLine({
    situation: primary.situation,
    lastDid: primary.lastDid,
    lastOutcome: primary.lastOutcome,
    nextDay,
  })
  const arc = sprintArcLine(nextDay, primary.daysCompleted || 0)
  const nearSummit = nextDay >= 6
  const streak = practiceStreak?.streak || 0
  const streakPaused = !!practiceStreak?.paused
  const cta =
    nextDay === 7
      ? 'Close your Summit →'
      : primary.lastDid && !primary.lastOutcome
        ? 'See what happened →'
        : `Do Day ${nextDay} now →`

  return (
    <section style={{ marginBottom: 44 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
          gap: 12,
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.72rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--brand-teal)',
            margin: 0,
          }}
        >
          Today&apos;s practice
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {streak > 0 && (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                fontWeight: 600,
                color: streakPaused ? 'rgba(251,191,36,0.9)' : 'rgba(23,184,224,0.9)',
                letterSpacing: '0.02em',
              }}
            >
              {streakPaused
                ? `Streak paused · ${streak}d`
                : `Practice streak · ${streak} day${streak === 1 ? '' : 's'}`}
            </span>
          )}
          {hasMore && (
            <Link
              href="/dashboard"
              style={{
                fontSize: '0.78rem',
                color: 'rgba(148,163,184,0.95)',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              All in progress →
            </Link>
          )}
        </div>
      </div>

      {/* Primary open-loop hero */}
      <Link
        href={`/summit/${primary.bookId}/day/${nextDay}`}
        style={{ textDecoration: 'none', display: 'block', marginBottom: rest.length ? 10 : 0 }}
      >
        <div
          style={{
            padding: '22px 22px 20px',
            borderRadius: 14,
            background: nearSummit
              ? 'linear-gradient(145deg, rgba(23,184,224,0.14) 0%, rgba(17,24,39,0.98) 42%, rgba(17,24,39,1) 100%)'
              : 'linear-gradient(145deg, rgba(23,184,224,0.09) 0%, rgba(17,24,39,0.98) 38%, rgba(17,24,39,1) 100%)',
            border: nearSummit
              ? '1px solid rgba(23,184,224,0.38)'
              : '1px solid rgba(23,184,224,0.22)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.28)',
            transition: 'border-color 0.15s ease, transform 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(25,190,227,0.5)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = nearSummit
              ? 'rgba(23,184,224,0.38)'
              : 'rgba(23,184,224,0.22)'
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 10,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--brand-teal)',
              }}
            >
              Your open loop · Day {nextDay} of 7
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                color: 'rgba(148,163,184,0.95)',
              }}
            >
              {primary.daysCompleted || 0}/7 days done
            </div>
          </div>

          <h3
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '1.35rem',
              fontWeight: 700,
              color: '#F8FAFC',
              margin: '0 0 10px',
              lineHeight: 1.25,
              letterSpacing: '-0.02em',
            }}
          >
            {label}
          </h3>

          <p
            style={{
              margin: '0 0 12px',
              fontSize: '0.95rem',
              lineHeight: 1.5,
              color: 'rgba(238,242,247,0.88)',
              fontWeight: 500,
            }}
          >
            {jobLine}
          </p>

          {openLoop && (
            <p
              style={{
                margin: '0 0 14px',
                fontSize: '0.86rem',
                lineHeight: 1.5,
                color: 'rgba(23,184,224,0.92)',
                padding: '10px 12px',
                borderRadius: 10,
                background: 'rgba(23,184,224,0.07)',
                border: '1px solid rgba(23,184,224,0.18)',
              }}
            >
              {openLoop}
            </p>
          )}

          {!openLoop && arc && (
            <p
              style={{
                margin: '0 0 14px',
                fontSize: '0.86rem',
                lineHeight: 1.45,
                color: 'rgba(238,242,247,0.5)',
              }}
            >
              {arc}
            </p>
          )}

          {/* 7-day dots */}
          <div
            style={{
              display: 'flex',
              gap: 6,
              marginBottom: 16,
              alignItems: 'center',
            }}
            aria-hidden
          >
            {[1, 2, 3, 4, 5, 6, 7].map((d) => {
              const done = d <= (primary.daysCompleted || 0)
              const current = d === nextDay
              return (
                <div
                  key={d}
                  style={{
                    flex: 1,
                    height: 4,
                    borderRadius: 2,
                    background: done
                      ? 'var(--brand-teal)'
                      : current
                        ? 'rgba(23,184,224,0.55)'
                        : 'rgba(255,255,255,0.1)',
                    boxShadow: current ? '0 0 10px rgba(23,184,224,0.35)' : 'none',
                  }}
                />
              )
            })}
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div
              style={{
                fontSize: '0.78rem',
                color: 'rgba(148,163,184,0.9)',
              }}
            >
              About 15 minutes · real work, not reading
              {progressPct > 0 ? ` · ${progressPct}% through` : ''}
            </div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '11px 18px',
                borderRadius: 10,
                background: 'var(--brand-teal)',
                color: '#0B1220',
                fontWeight: 700,
                fontSize: '0.9rem',
                letterSpacing: '-0.01em',
              }}
            >
              {cta}
            </span>
          </div>
        </div>
      </Link>

      {/* Secondary in-progress (compact) */}
      {rest.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rest.map((skill) => {
            const nd = skill.nextDay || Math.min((skill.daysCompleted || 0) + 1, 7)
            const lbl = displaySprintTitle({
              sprint_title: skill.sprintTitle,
              sprint_skill: skill.sprintSkill,
            })
            const sub =
              sprintOpenLoopLine({
                situation: skill.situation,
                lastDid: skill.lastDid,
                lastOutcome: skill.lastOutcome,
                nextDay: nd,
              }) || sprintArcLine(nd, skill.daysCompleted || 0)
            return (
              <Link
                key={skill.bookId}
                href={`/summit/${skill.bookId}/day/${nd}`}
                style={{ textDecoration: 'none' }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '12px 14px',
                    borderRadius: 10,
                    background: 'rgba(17, 24, 39, 0.95)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        color: '#F8FAFC',
                        fontSize: '0.9rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {lbl}
                    </div>
                    {sub && (
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'rgba(238,242,247,0.45)',
                          marginTop: 3,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {sub}
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.68rem',
                      color: 'rgba(148,163,184,0.95)',
                      flexShrink: 0,
                    }}
                  >
                    Day {nd}/7
                  </div>
                  <div style={{ color: 'var(--brand-teal)', fontWeight: 600, fontSize: '0.8rem' }}>
                    Continue →
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}

// ── Featured ──────────────────────────────────────────────────────────────────
function FeaturedSprint({ book }) {
  if (!book) return null
  const desc = book.brief_content
    ? book.brief_content.length > 160
      ? book.brief_content.slice(0, 160).trimEnd() + '…'
      : book.brief_content
    : 'A focused 7-day sprint: learn one move, practice it on real work.'

  return (
    <section style={{ marginBottom: 48 }}>
      <div
        style={{
          display: 'block',
          padding: '28px 28px 24px',
          borderRadius: 14,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(17, 24, 39, 0.98)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--brand-teal)',
            marginBottom: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--brand-teal)',
              boxShadow: '0 0 0 3px rgba(25,190,227,0.2)',
            }}
          />
          Featured
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(1.45rem, 3vw, 1.85rem)',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: '#F8FAFC',
            margin: '0 0 12px',
            lineHeight: 1.2,
          }}
        >
          {displaySprintTitle(book)}
        </h2>
        <p
          style={{
            fontSize: '0.95rem',
            lineHeight: 1.55,
            color: 'rgba(148, 163, 184, 0.95)',
            margin: '0 0 16px',
            maxWidth: 520,
          }}
        >
          {desc}
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 22,
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.62rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'rgba(148,163,184,0.75)',
            }}
          >
            Inspired by
          </span>
          <span
            style={{
              fontSize: '0.9rem',
              color: 'rgba(226,232,240,0.75)',
              fontStyle: 'italic',
            }}
          >
            {book.title}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Link href={`/summit/${book.id}/day/0`} className="btn-primary">
            Start sprint →
          </Link>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              color: 'rgba(148,163,184,0.8)',
              fontWeight: 500,
            }}
          >
            7 days
          </span>
        </div>
      </div>
    </section>
  )
}

// ── Category helpers ──────────────────────────────────────────────────────────
const categoryOrder = [
  'Productivity & Habits',
  'Financial Intelligence',
  'Leadership & People Management',
  'Sales, Persuasion & Negotiation',
  'Strategy & Innovation',
  'Marketing, Branding & Storytelling',
  'Coaching & Development',
  'Setting Direction & Priorities',
  'Performance & Accountability',
  'Hard Conversations',
  'Team Dynamics',
]

function getCategoryShortName(category) {
  const shortNames = {
    'Productivity & Habits': 'Productivity',
    'Financial Intelligence': 'Finance',
    'Leadership & People Management': 'Leadership',
    'Sales, Persuasion & Negotiation': 'Sales',
    'Strategy & Innovation': 'Strategy',
    'Marketing, Branding & Storytelling': 'Marketing',
    'Coaching & Development': 'Coaching',
    'Setting Direction & Priorities': 'Priorities',
    'Performance & Accountability': 'Performance',
    'Hard Conversations': 'Conversations',
    'Team Dynamics': 'Teams',
  }
  return shortNames[category] || category.split(/[&,]/)[0].trim()
}

/** Only shippable rows — belt-and-suspenders if bad data slips into props */
function isShippableBook(book) {
  if (!book?.id) return false
  if (book.review_status && book.review_status !== 'approved') return false
  return String(book.sprint_title || book.sprint_skill || '').trim().length > 0
}

// ── Inner component ───────────────────────────────────────────────────────────
function LibraryInner({
  initialBooks,
  initialBooksByCategory,
  initialUserSkills,
  initialSprintCount,
  initialPracticeStreak = { streak: 0, paused: false },
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Harden: never list non-approved / untitled sprints in the public library
  const [books] = useState(() => (initialBooks || []).filter(isShippableBook))
  const [booksByCategory] = useState(() => {
    const allowed = new Set((initialBooks || []).filter(isShippableBook).map((b) => b.id))
    const next = {}
    Object.entries(initialBooksByCategory || {}).forEach(([cat, list]) => {
      const filtered = (list || []).filter((b) => allowed.has(b.id) && isShippableBook(b))
      if (filtered.length) next[cat] = filtered
    })
    return next
  })
  const [userSkills] = useState(() => {
    const allowed = new Set((initialBooks || []).filter(isShippableBook).map((b) => b.id))
    return (initialUserSkills || []).filter((s) => allowed.has(s.bookId))
  })
  const [sprintCount] = useState(() => {
    const n = (initialBooks || []).filter(isShippableBook).length
    return typeof initialSprintCount === 'number' ? Math.min(initialSprintCount, n) : n
  })
  const [practiceStreak] = useState(initialPracticeStreak)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams?.get('category') ?? 'All'
  )
  const [onboardingChecked, setOnboardingChecked] = useState(false)

  useEffect(() => {
    const cat = searchParams?.get('category')
    setSelectedCategory(cat ?? 'All')
  }, [searchParams])

  const sortedCategories = useMemo(() => {
    return Object.keys(booksByCategory).sort((a, b) => {
      const ia = categoryOrder.indexOf(a)
      const ib = categoryOrder.indexOf(b)
      if (ia !== -1 && ib !== -1) return ia - ib
      return a.localeCompare(b)
    })
  }, [booksByCategory])

  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return null
    const q = searchQuery.toLowerCase()
    return books.filter(
      (book) =>
        (book.sprint_title || '').toLowerCase().includes(q) ||
        (book.title || '').toLowerCase().includes(q) ||
        (book.category || '').toLowerCase().includes(q) ||
        (book.brief_content || '').toLowerCase().includes(q) ||
        (book.sprint_skill || '').toLowerCase().includes(q)
    )
  }, [searchQuery, books])

  const isSearching = filteredBooks !== null

  const browseBooks = useMemo(() => {
    if (isSearching) return filteredBooks || []
    if (selectedCategory === 'All') return books
    return booksByCategory[selectedCategory] || []
  }, [isSearching, filteredBooks, selectedCategory, books, booksByCategory])

  const inProgressIds = useMemo(
    () =>
      new Set(
        (userSkills || [])
          .filter((s) => !s.isComplete && (s.daysCompleted < 7 || s.nextDay))
          .map((s) => s.bookId)
      ),
    [userSkills]
  )

  const featuredBook = useMemo(() => {
    if (!books.length || isSearching) return null
    // Prefer a shippable sprint the user is NOT already mid-way through
    const candidates = books.filter((b) => !inProgressIds.has(b.id))
    const pool = candidates.length ? candidates : books
    const explicit = pool.find((b) => b.featured)
    if (explicit) return explicit
    const rich = pool.find((b) => b.sprint_title && b.brief_content)
    return rich || pool[0]
  }, [books, inProgressIds, isSearching])

  // Browse: exclude featured (when All) AND sprints already in Today's practice
  const browseWithoutFeatured = useMemo(() => {
    let list = browseBooks.filter((b) => isShippableBook(b) && !inProgressIds.has(b.id))
    if (!isSearching && selectedCategory === 'All' && featuredBook) {
      list = list.filter((b) => b.id !== featuredBook.id)
    }
    return list
  }, [browseBooks, featuredBook, isSearching, selectedCategory, inProgressIds])

  const useFlatGrid =
    !isSearching &&
    selectedCategory === 'All' &&
    books.length < GRID_THRESHOLD

  const sprintCountNumber =
    typeof sprintCount === 'number' ? sprintCount.toLocaleString('en-US') : ''
  const sprintCountLabel =
    typeof sprintCount === 'number'
      ? `sprint${sprintCount === 1 ? '' : 's'}`
      : 'sprints'

  const catsWithBooks = categoryOrder.filter((cat) => booksByCategory[cat]?.length > 0)
  // Also include categories not in order list
  sortedCategories.forEach((c) => {
    if (!catsWithBooks.includes(c) && booksByCategory[c]?.length) catsWithBooks.push(c)
  })

  return (
    <>
      {!onboardingChecked && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: '#0D1520',
            zIndex: 999,
          }}
        />
      )}

      <OnboardingModal
        onCheckComplete={() => setOnboardingChecked(true)}
        onCategorySelect={(cat) => {
          setSelectedCategory(cat)
          window.history.replaceState(
            null,
            '',
            `/library?category=${encodeURIComponent(cat)}`
          )
        }}
      />

      <AppNav active="library" />

      {/* Tighter page header */}
      <header
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          padding: '36px 24px 8px',
          textAlign: 'left',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.68rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(148,163,184,0.9)',
            marginBottom: 10,
          }}
        >
          <span style={{ color: 'var(--brand-teal)', opacity: sprintCountNumber ? 1 : 0.5 }}>
            {sprintCountNumber || '—'}
          </span>{' '}
          {sprintCountLabel}
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(1.65rem, 3.5vw, 2.1rem)',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: '#F8FAFC',
            margin: '0 0 8px',
            lineHeight: 1.15,
          }}
        >
          What do you want to work on?
        </h1>
        <p
          style={{
            fontSize: '0.95rem',
            color: 'rgba(148,163,184,0.95)',
            margin: '0 0 20px',
            maxWidth: 480,
            lineHeight: 1.5,
          }}
        >
          Pick a 7-day skill sprint. Practice on real work — not just reading.
        </p>
        <div className="search-wrapper" style={{ maxWidth: 480, margin: 0 }}>
          <svg
            className="search-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Search skills or topics…"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              if (e.target.value) router.replace('/library', { scroll: false })
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.4)',
                fontSize: '1.1rem',
                lineHeight: 1,
                padding: 4,
              }}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </header>

      {/* Quiet category chips — teal only when active */}
      {!isSearching && catsWithBooks.length > 1 && (
        <div
          className="category-scroll"
          style={{
            maxWidth: 1120,
            margin: '0 auto',
            paddingTop: 16,
            paddingBottom: 8,
          }}
        >
          <button
            type="button"
            className={`pill ${selectedCategory === 'All' ? 'active' : ''}`}
            onClick={() => {
              setSearchQuery('')
              setSelectedCategory('All')
              window.history.replaceState(null, '', '/library')
            }}
            style={
              selectedCategory === 'All'
                ? {
                    background: 'rgba(25,190,227,0.15)',
                    borderColor: 'rgba(25,190,227,0.45)',
                    color: 'var(--brand-teal)',
                    fontWeight: 650,
                    boxShadow: 'none',
                  }
                : undefined
            }
          >
            All
          </button>
          {catsWithBooks.map((category) => {
            const isActive = selectedCategory === category
            return (
              <button
                key={category}
                type="button"
                className="pill"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory(category)
                  window.history.replaceState(
                    null,
                    '',
                    `/library?category=${encodeURIComponent(category)}`
                  )
                }}
                style={
                  isActive
                    ? {
                        background: 'rgba(25,190,227,0.15)',
                        borderColor: 'rgba(25,190,227,0.45)',
                        color: 'var(--brand-teal)',
                        fontWeight: 650,
                        boxShadow: 'none',
                      }
                    : undefined
                }
              >
                {getCategoryShortName(category)}
              </button>
            )
          })}
        </div>
      )}

      <main className="container" style={{ maxWidth: 1120, paddingTop: 28, paddingBottom: 80 }}>
        {isSearching && (
          <>
            <div
              style={{
                marginBottom: 20,
                color: 'rgba(148,163,184,0.95)',
                fontSize: '0.85rem',
              }}
            >
              {filteredBooks.length > 0
                ? `${filteredBooks.length} result${filteredBooks.length !== 1 ? 's' : ''} for “${searchQuery}”`
                : `No sprints match “${searchQuery}”`}
            </div>
            {filteredBooks.length === 0 ? (
              <div
                style={{
                  padding: '48px 24px',
                  textAlign: 'center',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.07)',
                  background: 'rgba(17,24,39,0.9)',
                  color: 'rgba(148,163,184,0.95)',
                }}
              >
                <p style={{ margin: '0 0 8px', fontWeight: 600, color: '#E2E8F0' }}>
                  Nothing matched
                </p>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>
                  Try a skill word — coaching, habits, priorities, feedback.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: 16,
                }}
              >
                {filteredBooks.map((book) => (
                  <SprintCard key={book.id} book={book} />
                ))}
              </div>
            )}
          </>
        )}

        {!isSearching && (
          <>
            {/* 1. Today's practice (open-loop pull) — owns the page when in progress */}
            <ContinueSection userSkills={userSkills} practiceStreak={practiceStreak} />

            {/* 2–3. Discovery: demoted when a sprint is open */}
            {(() => {
              const inPractice = (userSkills || []).some(
                (s) => !s.isComplete && (s.daysCompleted < 7 || s.nextDay)
              )
              return (
                <div
                  style={
                    inPractice
                      ? {
                          marginTop: 8,
                          paddingTop: 28,
                          borderTop: '1px solid rgba(255,255,255,0.06)',
                          opacity: 0.92,
                        }
                      : undefined
                  }
                >
                  {inPractice && selectedCategory === 'All' && (
                    <p
                      style={{
                        margin: '0 0 18px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: 'rgba(148,163,184,0.65)',
                      }}
                    >
                      Explore when you&apos;re ready
                    </p>
                  )}

            {/* Featured only when not mid-sprint — practice hero owns attention */}
            {selectedCategory === 'All' && !inPractice && (
              <FeaturedSprint book={featuredBook} />
            )}

            {/* Browse */}
            <section>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  marginBottom: 16,
                }}
              >
                <h2
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'rgba(148,163,184,0.9)',
                    margin: 0,
                  }}
                >
                  {selectedCategory === 'All'
                    ? inPractice
                      ? 'More sprints'
                      : 'Browse'
                    : getCategoryShortName(selectedCategory)}
                </h2>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.7rem',
                    color: 'rgba(148,163,184,0.7)',
                  }}
                >
                  {browseWithoutFeatured.length} available
                </span>
              </div>

              {browseWithoutFeatured.length === 0 ? (
                <p style={{ color: 'rgba(148,163,184,0.8)', fontSize: '0.9rem' }}>
                  {inProgressIds.size > 0 && selectedCategory === 'All'
                    ? 'You’re mid-sprint above — finish that open loop, or check back as we ship more skills.'
                    : 'No sprints in this category yet.'}
                </p>
              ) : useFlatGrid || selectedCategory !== 'All' ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: 16,
                  }}
                >
                  {browseWithoutFeatured.map((book) => (
                    <SprintCard key={book.id} book={book} />
                  ))}
                </div>
              ) : (
                // Many sprints: group by category shelves
                sortedCategories
                  .filter((cat) => (booksByCategory[cat] || []).length > 0)
                  .map((cat) => {
                    const list = (booksByCategory[cat] || []).filter(
                      (b) => !featuredBook || b.id !== featuredBook.id
                    )
                    if (!list.length) return null
                    return (
                      <BookRow
                        key={cat}
                        title={getCategoryShortName(cat)}
                        description={`${list.length} sprint${list.length !== 1 ? 's' : ''}`}
                        books={list}
                      />
                    )
                  })
              )}
            </section>
                </div>
              )
            })()}
          </>
        )}
      </main>
    </>
  )
}

export default function LibraryClient(props) {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <LibraryInner {...props} />
    </Suspense>
  )
}
