'use client'
import { useState, useEffect, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/app/supabaseClient'
import BookRow from '@/components/BookRow'
import OnboardingModal from '@/components/OnboardingModal'

// ── Loading skeleton ──────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div style={{ animation: 'pulse 1.6s ease-in-out infinite' }}>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .skel { background: rgba(255,255,255,0.07); border-radius: 8px; }
      `}</style>
      <div className="glass-panel" style={{ marginBottom: '48px', padding: '40px' }}>
        <div className="skel" style={{ width: '120px', height: '20px', marginBottom: '20px' }} />
        <div className="skel" style={{ width: '65%', height: '32px', marginBottom: '12px' }} />
        <div className="skel" style={{ width: '90%', height: '16px', marginBottom: '8px' }} />
        <div className="skel" style={{ width: '75%', height: '16px', marginBottom: '28px' }} />
        <div className="skel" style={{ width: '140px', height: '44px', borderRadius: '10px' }} />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ marginBottom: '48px' }}>
          <div className="skel" style={{ width: '180px', height: '22px', marginBottom: '16px' }} />
          <div style={{ display: 'flex', gap: '16px' }}>
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="skel" style={{ width: '200px', height: '260px', flexShrink: 0, borderRadius: '12px' }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Skill Passport ────────────────────────────────────────────────────────────
function SkillPassport({ userSkills }) {
  if (!userSkills || userSkills.length === 0) return null

  const visibleSkills = userSkills.slice(0, 3)
  const hasMore = userSkills.length > 3

  return (
    <section style={{ marginBottom: '48px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--brand-teal)', margin: 0 }}>
          Skills You're Building
        </p>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
        {hasMore && (
          <Link href="/dashboard" style={{ fontSize: '0.78rem', color: 'var(--brand-teal)', textDecoration: 'none', fontWeight: '600', flexShrink: 0, transition: 'opacity 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            View all →
          </Link>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {visibleSkills.map((skill) => {
          const isComplete  = skill.daysCompleted >= 7
          const progressPct = Math.round((skill.daysCompleted / 7) * 100)
          const resumeDay   = Math.min(skill.daysCompleted + 1, 7)
          return (
            <Link key={skill.bookId} href={`/summit/${skill.bookId}/day/${isComplete ? 7 : resumeDay}`} style={{ textDecoration: 'none' }}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 18px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', transition: 'all 0.2s ease', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(25,190,227,0.25)'; e.currentTarget.style.background = 'rgba(25,190,227,0.04)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(15, 23, 42, 0.6)' }}
              >
                <div style={{ flex: '1 1 auto', minWidth: 0, fontFamily: 'var(--font-sans)', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {skill.sprintSkill}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progressPct}%`, borderRadius: '2px', background: isComplete ? 'var(--brand-teal)' : 'linear-gradient(90deg, var(--brand-teal), rgba(25,190,227,0.6))', transition: 'width 0.4s ease' }} />
                  </div>
                </div>
                <div style={{ flex: '0 0 110px', textAlign: 'right', fontFamily: "'DM Mono', monospace", fontSize: '0.72rem', fontWeight: 600, color: isComplete ? 'var(--brand-teal)' : 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>
                  {isComplete ? 'Completed ✓' : `Day ${skill.daysCompleted} of 7`}
                </div>
                <div style={{ color: 'rgba(25,190,227,0.4)', fontSize: '0.85rem', flexShrink: 0 }}>→</div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

// ── Featured placeholder ──────────────────────────────────────────────────────
function FeaturedPlaceholder() {
  return (
    <section className="featured-section">
      <div className="featured-card glass-panel" style={{ display: 'block', minHeight: '290px', background: 'linear-gradient(135deg, rgba(25,190,227,0.06) 0%, transparent 60%)' }}>
        <div style={{ width: '122px', height: '24px', borderRadius: '999px', background: 'rgba(255,255,255,0.07)', marginBottom: '18px' }} />
        <div style={{ width: '52%', height: '38px', borderRadius: '10px', background: 'rgba(255,255,255,0.07)', marginBottom: '16px' }} />
        <div style={{ width: '94%', height: '16px', borderRadius: '999px', background: 'rgba(255,255,255,0.07)', marginBottom: '10px' }} />
        <div style={{ width: '82%', height: '16px', borderRadius: '999px', background: 'rgba(255,255,255,0.07)', marginBottom: '30px' }} />
        <div style={{ width: '142px', height: '42px', borderRadius: '10px', background: 'rgba(255,255,255,0.07)' }} />
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
]

function getCategoryShortName(category) {
  const shortNames = {
    'Productivity & Habits':           'Productivity',
    'Financial Intelligence':          'Finance',
    'Leadership & People Management':  'Leadership',
    'Sales, Persuasion & Negotiation': 'Sales',
    'Strategy & Innovation':           'Strategy',
    'Marketing, Branding & Storytelling': 'Marketing',
  }
  return shortNames[category] || category
}

function getCategoryPillColor(category) {
  if (!category) return 'var(--brand-teal)'
  const lower = category.toLowerCase()
  if (['financial', 'investing', 'money', 'wealth'].some(k => lower.includes(k)))        return '#10B981'
  if (['leadership', 'people management', 'management'].some(k => lower.includes(k)))    return '#6B8FD6'
  if (['productivity', 'habits', 'performance', 'minimal'].some(k => lower.includes(k))) return '#06B6D4'
  if (['marketing', 'branding', 'storytelling'].some(k => lower.includes(k)))            return '#84CC16'
  if (['sales', 'persuasion', 'negotiation', 'influence'].some(k => lower.includes(k)))  return '#FB7185'
  if (['strategy', 'innovation', 'business model'].some(k => lower.includes(k)))         return '#0EA5E9'
  if (['communication', 'conversation', 'writing'].some(k => lower.includes(k)))         return '#F43F5E'
  if (['mindset', 'psychology', 'mental', 'emotional'].some(k => lower.includes(k)))     return '#8B5CF6'
  if (['entrepreneurship', 'startup', 'founder'].some(k => lower.includes(k)))           return '#EF4444'
  if (['relationships', 'network', 'social'].some(k => lower.includes(k)))               return '#EAB308'
  return 'var(--brand-teal)'
}

// ── Inner component (needs useSearchParams so wrapped in Suspense) ────────────
function LibraryInner({ initialBooks, initialBooksByCategory, initialUserSkills, initialSprintCount }) {
  const router      = useRouter()
  const searchParams = useSearchParams()

  const [books,            setBooks]            = useState(initialBooks)
  const [booksByCategory,  setBooksByCategory]  = useState(initialBooksByCategory)
  const [userSkills,       setUserSkills]       = useState(initialUserSkills)
  const [sprintCount,      setSprintCount]      = useState(initialSprintCount)
  const [searchQuery,      setSearchQuery]      = useState('')
  const [selectedCategory,  setSelectedCategory]  = useState(searchParams?.get('category') ?? 'All')
  const [onboardingChecked, setOnboardingChecked] = useState(false)

  // Sync with URL on back/forward navigation
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
    return books.filter(book =>
      (book.sprint_title || '').toLowerCase().includes(q) ||
      (book.title        || '').toLowerCase().includes(q) ||
      (book.category     || '').toLowerCase().includes(q) ||
      (book.brief_content|| '').toLowerCase().includes(q)
    )
  }, [searchQuery, books])

  const isSearching = filteredBooks !== null

  const categoriesToShow = useMemo(() => {
    if (isSearching) {
      const grouped = filteredBooks.reduce((acc, book) => {
        const cat = book.category || 'Uncategorized'
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(book)
        return acc
      }, {})
      return Object.keys(grouped).sort((a, b) => {
        const ia = categoryOrder.indexOf(a), ib = categoryOrder.indexOf(b)
        if (ia !== -1 && ib !== -1) return ia - ib
        return a.localeCompare(b)
      }).map(cat => ({ category: cat, books: grouped[cat] }))
    }
    const cats = selectedCategory === 'All' ? sortedCategories : [selectedCategory]
    return cats.map(cat => ({ category: cat, books: booksByCategory[cat] || [] }))
  }, [isSearching, filteredBooks, selectedCategory, sortedCategories, booksByCategory])

  const featuredBook = useMemo(() => {
    if (!books.length) return null
    const explicit = books.find(b => b.featured)
    if (explicit) return explicit
    const rich = books.find(b => b.sprint_title && b.brief_content)
    return rich || books[0]
  }, [books])

  const sprintCountNumber = typeof sprintCount === 'number' ? sprintCount.toLocaleString('en-US') : ''
  const sprintCountLabel  = typeof sprintCount === 'number' ? `Skill Sprint${sprintCount === 1 ? '' : 's'}` : 'Skill Sprints'

  async function handleSignOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) { alert('Error signing out: ' + error.message) }
      else { router.replace('/') }
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  return (
    <>
      {!onboardingChecked && (
        <div style={{ position: 'fixed', inset: 0, background: '#0D1520', zIndex: 999 }} />
      )}

      <OnboardingModal
        onCheckComplete={() => setOnboardingChecked(true)}
        onCategorySelect={(cat) => {
        setSelectedCategory(cat)
        window.history.replaceState(null, '', `/library?category=${encodeURIComponent(cat)}`)
      }} />

      <nav className="glass-nav">
        <div className="nav-content">
          <Link href="/library" className="logo">
            <img src="/SummitSkills-Logo.png" alt="SummitSkills" className="logo-img" />
            Summit<span>Skills</span>
          </Link>
          <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="btn-primary small nav-btn-desktop" onClick={() => router.push('/dashboard')}>Dashboard</button>
            <button className="btn-primary small nav-btn-desktop" onClick={() => router.push('/settings')}>Settings</button>
            <button className="btn-primary small" onClick={handleSignOut}>Sign Out</button>
          </div>
        </div>
      </nav>

      <header className="hero">
        <div className="hero-badge" aria-live="polite" style={{ minHeight: '24px', visibility: 'visible', gap: '7px', paddingLeft: '16px', paddingRight: '16px' }}>
          <span className="pulse-dot"></span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ display: 'inline-block', minWidth: '2ch', textAlign: 'right', opacity: sprintCountNumber ? 1 : 0, transition: 'opacity 120ms ease' }}>
              {sprintCountNumber || '0'}
            </span>
            <span>{sprintCountLabel}</span>
          </span>
        </div>
        <h1>What do you want to <span className="text-gradient">work on?</span></h1>
        <p className="hero-sub">Find your next sprint below, or search by skill, topic, or goal.</p>
        <div className="search-wrapper">
          <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Search sprints: habits, leadership, money..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value)
              if (e.target.value) router.replace('/library', { scroll: false })
            }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: '1.1rem', lineHeight: 1, padding: '4px' }}
              aria-label="Clear search">×</button>
          )}
        </div>
      </header>

      {/* Category pills */}
      <div className="category-scroll">
        <button
          className={`pill ${selectedCategory === 'All' ? 'active' : ''}`}
          onClick={() => {
              setSearchQuery('')
              setSelectedCategory('All')
              window.history.replaceState(null, '', '/library')
            }}
        >
          All
        </button>
        {categoryOrder.filter(cat => booksByCategory[cat]?.length > 0).map(category => {
          const isActive   = selectedCategory === category
          const pillColor  = getCategoryPillColor(category)
          return (
            <button key={category} className="pill"
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory(category)
                window.history.replaceState(null, '', `/library?category=${encodeURIComponent(category)}`)
              }}
              style={isActive ? { background: pillColor, borderColor: pillColor, color: '#0F172A', fontWeight: '700', boxShadow: `0 0 12px ${pillColor}55` } : {}}
            >
              {getCategoryShortName(category)}
            </button>
          )
        })}
      </div>

      <main className="container">

        {/* Search results */}
        {isSearching && (
          <>
            <div style={{ marginBottom: '24px', color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem' }}>
              {filteredBooks.length > 0
                ? `${filteredBooks.length} sprint${filteredBooks.length !== 1 ? 's' : ''} matching "${searchQuery}"`
                : `No sprints found for "${searchQuery}"`}
            </div>
            {filteredBooks.length === 0 && (
              <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🔍</div>
                <p>Try a different keyword — like a skill, topic, or category.</p>
              </div>
            )}
            {categoriesToShow.map(({ category, books: catBooks }) => (
              <BookRow key={category} title={category} description={`${catBooks.length} match${catBooks.length !== 1 ? 'es' : ''}`} books={catBooks} />
            ))}
          </>
        )}

        {/* Normal view */}
        {!isSearching && (
          <>
            <SkillPassport userSkills={userSkills} />

            {featuredBook ? (
              <section className="featured-section">
                <div className="featured-card glass-panel" style={{
                  display: 'block',
                  background: (() => {
                    const c = featuredBook.category?.toLowerCase() || ''
                    if (c.includes('financial') || c.includes('money'))       return 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, transparent 60%)'
                    if (c.includes('leadership') || c.includes('management')) return 'linear-gradient(135deg, rgba(107,143,214,0.08) 0%, transparent 60%)'
                    if (c.includes('productivity') || c.includes('habit'))    return 'linear-gradient(135deg, rgba(6,182,212,0.10) 0%, transparent 60%)'
                    if (c.includes('sales') || c.includes('negotiation'))     return 'linear-gradient(135deg, rgba(251,113,133,0.08) 0%, transparent 60%)'
                    if (c.includes('strategy') || c.includes('innovation'))   return 'linear-gradient(135deg, rgba(14,165,233,0.08) 0%, transparent 60%)'
                    return 'linear-gradient(135deg, rgba(25,190,227,0.08) 0%, transparent 60%)'
                  })(),
                }}>
                  <span className="tag-featured"><span className="pulse-dot" />Featured Sprint</span>
                  <h2>{featuredBook.sprint_title || featuredBook.title}</h2>
                  <p className="featured-desc">
                    {featuredBook.brief_content || 'A 7-day skill sprint that turns professional concepts into real behavior change, one focused action at a time.'}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>Inspired by</span>
                    <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>{featuredBook.title}</span>
                  </div>
                  <Link href={`/summit/${featuredBook.id}/day/1`} className="btn-primary">Begin Sprint →</Link>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: '700', color: 'var(--brand-teal)' }}>7 days</span>
                      <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '600' }}>total</span>
                    </div>
                  </div>
                </div>
              </section>
            ) : (
              <FeaturedPlaceholder />
            )}

            {categoriesToShow.map(({ category, books: catBooks }) => (
              <BookRow key={category} title={category} description={`${catBooks.length} skill sprints`} books={catBooks} />
            ))}
          </>
        )}
      </main>
    </>
  )
}

// ── Export — wrapped in Suspense for useSearchParams ─────────────────────────
export default function LibraryClient(props) {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <LibraryInner {...props} />
    </Suspense>
  )
}
