"use client";
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/supabaseClient';
import BookRow from '@/components/BookRow';

const BOOKS_CACHE_KEY = 'ss_books';
const BOOKS_BY_CATEGORY_CACHE_KEY = 'ss_booksByCategory';

// ── Helpers ──────────────────────────────────────────────────────────────────
function groupBooksByCategory(booksData) {
  return booksData.reduce((acc, book) => {
    const category = book.category || 'Uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(book);
    return acc;
  }, {});
}

function buildUserSkills(progressData, booksData) {
  if (!progressData || progressData.length === 0) return [];

  const daysByBook = progressData.reduce((acc, row) => {
    if (!acc[row.book_id]) acc[row.book_id] = 0;
    if (row.completed) acc[row.book_id] += 1;
    return acc;
  }, {});

  return Object.entries(daysByBook)
    .map(([bookId, daysCompleted]) => {
      const book = booksData.find((b) => b.id === bookId);
      if (!book || !book.sprint_skill) return null;

      return {
        bookId,
        bookTitle: book.title,
        sprintSkill: book.sprint_skill,
        daysCompleted,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const aComplete = a.daysCompleted >= 7;
      const bComplete = b.daysCompleted >= 7;
      if (aComplete && !bComplete) return 1;
      if (!aComplete && bComplete) return -1;
      return b.daysCompleted - a.daysCompleted;
    });
}

function getCachedLibraryState() {
  try {
    const cachedBooksRaw = sessionStorage.getItem(BOOKS_CACHE_KEY);
    const cachedByCategoryRaw = sessionStorage.getItem(BOOKS_BY_CATEGORY_CACHE_KEY);

    if (!cachedBooksRaw || !cachedByCategoryRaw) return null;

    const cachedBooks = JSON.parse(cachedBooksRaw);
    const cachedByCategory = JSON.parse(cachedByCategoryRaw);

    if (!Array.isArray(cachedBooks) || !cachedByCategory || typeof cachedByCategory !== 'object') {
      return null;
    }

    return {
      books: cachedBooks,
      booksByCategory: cachedByCategory,
    };
  } catch {
    return null;
  }
}

// ── Loading skeleton for featured card + rows ────────────────────────────────
function LoadingSkeleton() {
  return (
    <div style={{ animation: 'pulse 1.6s ease-in-out infinite' }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
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
              <div
                key={j}
                className="skel"
                style={{ width: '200px', height: '260px', flexShrink: 0, borderRadius: '12px' }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Skill Passport ───────────────────────────────────────────────────────────
function SkillPassport({ userSkills }) {
  if (!userSkills || userSkills.length === 0) return null;

  return (
    <section style={{ marginBottom: '48px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '16px',
        }}
      >
        <p
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '0.7rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--brand-teal)',
            margin: 0,
          }}
        >
          Skills You're Building
        </p>
        <div
          style={{
            flex: 1,
            height: '1px',
            background: 'rgba(255,255,255,0.06)',
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {userSkills.map((skill) => {
          const isComplete = skill.daysCompleted >= 7;
          const progressPct = Math.round((skill.daysCompleted / 7) * 100);
          const resumeDay = Math.min(skill.daysCompleted + 1, 7);

          return (
            <Link
              key={skill.bookId}
              href={`/summit/${skill.bookId}/day/${isComplete ? 7 : resumeDay}`}
              style={{ textDecoration: 'none' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '14px 18px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '12px',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(25,190,227,0.25)';
                  e.currentTarget.style.background = 'rgba(25,190,227,0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.background = 'rgba(15, 23, 42, 0.6)';
                }}
              >
                <div
                  style={{
                    flex: '1 1 auto',
                    minWidth: 0,
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {skill.sprintSkill}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      height: '4px',
                      borderRadius: '2px',
                      background: 'rgba(255,255,255,0.08)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${progressPct}%`,
                        borderRadius: '2px',
                        background: isComplete
                          ? 'var(--brand-teal)'
                          : 'linear-gradient(90deg, var(--brand-teal), rgba(25,190,227,0.6))',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    flex: '0 0 110px',
                    textAlign: 'right',
                    fontFamily: "'DM Mono', monospace",
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: isComplete ? 'var(--brand-teal)' : 'rgba(255,255,255,0.4)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isComplete ? 'Completed ✓' : `Day ${skill.daysCompleted} of 7`}
                </div>

                <div
                  style={{
                    color: 'rgba(25,190,227,0.4)',
                    fontSize: '0.85rem',
                    flexShrink: 0,
                  }}
                >
                  →
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

// ── Main library page ────────────────────────────────────────────────────────
export default function Library() {
  const router = useRouter();

  const [books, setBooks] = useState([]);
  const [booksByCategory, setBooksByCategory] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [userSkills, setUserSkills] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function initLibrary() {
      try {
        setErrorMessage('');

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (!session?.user) {
          router.replace('/auth/login');
          return;
        }

        const cachedState = getCachedLibraryState();
        if (cachedState && isMounted) {
          setBooks(cachedState.books);
          setBooksByCategory(cachedState.booksByCategory);
          setLoading(false);
          setRefreshing(true);
        }

        const { data: booksData, error: booksError } = await supabase
          .from('books')
          .select('*')
          .eq('review_status', 'approved')
          .order('created_at', { ascending: false });

        if (booksError) throw booksError;

        const safeBooks = Array.isArray(booksData) ? booksData : [];
        const grouped = groupBooksByCategory(safeBooks);

        if (!isMounted) return;

        setBooks(safeBooks);
        setBooksByCategory(grouped);

        try {
          sessionStorage.setItem(BOOKS_CACHE_KEY, JSON.stringify(safeBooks));
          sessionStorage.setItem(BOOKS_BY_CATEGORY_CACHE_KEY, JSON.stringify(grouped));
        } catch {
          // Non-blocking cache write failure
        }

        const { data: progressData, error: progressError } = await supabase
          .from('user_progress')
          .select('book_id, day_number, completed')
          .eq('user_id', session.user.id);

        if (!isMounted) return;

        if (progressError) {
          console.error('Error loading user progress:', progressError);
          setUserSkills([]);
        } else {
          const safeProgress = Array.isArray(progressData) ? progressData : [];
          setUserSkills(buildUserSkills(safeProgress, safeBooks));
        }

        setLoading(false);
        setRefreshing(false);
      } catch (err) {
        if (!isMounted) return;

        console.error('Error loading library:', err);
        setErrorMessage(err?.message || 'Unable to load your library right now.');
        setLoading(false);
        setRefreshing(false);
      }
    }

    initLibrary();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.replace('/auth/login');
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  async function handleSignOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        alert('Error signing out: ' + error.message);
      } else {
        router.replace('/');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }

  const getCategoryShortName = (category) => {
    const shortNames = {
      'Habits & Self-Discipline': 'Habits',
      'Money & Investing': 'Money',
      'Productivity & Performance': 'Productivity',
      'Mindset & Mental Toughness': 'Mindset',
      'Strategic Thinking': 'Strategy',
      'Communication & Influence': 'Communication',
      'Leadership & Business': 'Leadership',
      'Philosophy & Wisdom': 'Philosophy',
      'Health & Wellness': 'Health',
    };
    return shortNames[category] || category;
  };

  const getCategoryPillColor = (category) => {
    if (!category) return 'var(--brand-teal)';
    const lower = category.toLowerCase();
    if (['financial', 'investing', 'money', 'wealth'].some((k) => lower.includes(k))) return '#10B981';
    if (['leadership', 'people management', 'management'].some((k) => lower.includes(k))) return '#6B8FD6';
    if (['productivity', 'habits', 'performance', 'minimal'].some((k) => lower.includes(k))) return '#06B6D4';
    if (['marketing', 'branding', 'storytelling'].some((k) => lower.includes(k))) return '#84CC16';
    if (['sales', 'persuasion', 'negotiation', 'influence'].some((k) => lower.includes(k))) return '#FB7185';
    if (['strategy', 'innovation', 'business model'].some((k) => lower.includes(k))) return '#0EA5E9';
    if (['communication', 'conversation', 'writing'].some((k) => lower.includes(k))) return '#F43F5E';
    if (['mindset', 'psychology', 'mental', 'emotional'].some((k) => lower.includes(k))) return '#8B5CF6';
    if (['entrepreneurship', 'startup', 'founder'].some((k) => lower.includes(k))) return '#EF4444';
    if (['relationships', 'network', 'social'].some((k) => lower.includes(k))) return '#EAB308';
    return 'var(--brand-teal)';
  };

  const categoryOrder = [
    'Habits & Self-Discipline',
    'Money & Investing',
    'Productivity & Performance',
    'Mindset & Mental Toughness',
    'Strategic Thinking',
    'Communication & Influence',
    'Leadership & Business',
    'Philosophy & Wisdom',
    'Health & Wellness',
  ];

  const sortedCategories = useMemo(() => {
    return Object.keys(booksByCategory).sort((a, b) => {
      const indexA = categoryOrder.indexOf(a);
      const indexB = categoryOrder.indexOf(b);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      return a.localeCompare(b);
    });
  }, [booksByCategory]);

  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return books.filter((book) =>
      (book.sprint_title || '').toLowerCase().includes(q) ||
      (book.title || '').toLowerCase().includes(q) ||
      (book.author || '').toLowerCase().includes(q) ||
      (book.category || '').toLowerCase().includes(q) ||
      (book.brief_content || '').toLowerCase().includes(q)
    );
  }, [searchQuery, books]);

  const isSearching = filteredBooks !== null;

  const categoriesToShow = useMemo(() => {
    if (isSearching) {
      const grouped = filteredBooks.reduce((acc, book) => {
        const cat = book.category || 'Uncategorized';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(book);
        return acc;
      }, {});

      return Object.keys(grouped)
        .sort((a, b) => {
          const ia = categoryOrder.indexOf(a);
          const ib = categoryOrder.indexOf(b);
          if (ia !== -1 && ib !== -1) return ia - ib;
          return a.localeCompare(b);
        })
        .map((cat) => ({ category: cat, books: grouped[cat] }));
    }

    const cats = selectedCategory === 'All' ? sortedCategories : [selectedCategory];
    return cats.map((cat) => ({ category: cat, books: booksByCategory[cat] || [] }));
  }, [isSearching, filteredBooks, selectedCategory, sortedCategories, booksByCategory]);

  const featuredBook = useMemo(() => {
    if (!books.length) return null;
    const explicit = books.find((b) => b.featured);
    if (explicit) return explicit;
    const rich = books.find((b) => b.sprint_title && b.brief_content);
    return rich || books[0];
  }, [books]);

  return (
    <>
      <nav className="glass-nav">
        <div className="nav-content">
          <Link href="/library" className="logo">
            <img src="/SummitSkills-Logo.png" alt="SummitSkills" className="logo-img" />
            Summit<span>Skills</span>
          </Link>
          <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="btn-primary small nav-btn-desktop" onClick={() => router.push('/dashboard')}>
              Dashboard
            </button>
            <button className="btn-primary small nav-btn-desktop" onClick={() => router.push('/settings')}>
              Settings
            </button>
            <button className="btn-primary small" onClick={handleSignOut}>
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <header className="hero">
        <h1>
          What do you want to <span className="text-gradient">work on?</span>
        </h1>
        <p className="hero-sub">Find your next sprint below, or search by skill, topic, or goal.</p>

        <div className="search-wrapper">
          <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Search sprints: habits, leadership, money..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value) setSelectedCategory('All');
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.4)',
                fontSize: '1.1rem',
                lineHeight: 1,
                padding: '4px',
              }}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </header>

      <div
        className="category-scroll"
        style={{
          opacity: loading ? 0.45 : 1,
          transition: 'opacity 180ms ease',
        }}
      >
        <button
          className={`pill ${selectedCategory === 'All' ? 'active' : ''}`}
          onClick={() => {
            if (loading) return;
            setSearchQuery('');
            setSelectedCategory('All');
          }}
          style={loading ? { pointerEvents: 'none' } : {}}
        >
          All
        </button>

        {categoryOrder.map((category) => {
          const isActive = selectedCategory === category;
          const pillColor = getCategoryPillColor(category);

          return (
            <button
              key={category}
              className="pill"
              onClick={() => {
                if (loading) return;
                setSearchQuery('');
                setSelectedCategory(category);
              }}
              style={{
                ...(loading ? { pointerEvents: 'none' } : {}),
                ...(isActive && !loading
                  ? {
                      background: pillColor,
                      borderColor: pillColor,
                      color: '#0F172A',
                      fontWeight: '700',
                      boxShadow: `0 0 12px ${pillColor}55`,
                    }
                  : {}),
              }}
            >
              {getCategoryShortName(category)}
            </button>
          );
        })}
      </div>

      <main className="container">
        {errorMessage && (
          <div
            className="glass-panel"
            style={{
              marginBottom: '24px',
              padding: '16px 18px',
              border: '1px solid rgba(248,113,113,0.22)',
              background: 'rgba(248,113,113,0.06)',
              color: 'rgba(255,255,255,0.8)',
            }}
          >
            {books.length > 0
              ? 'We could not fully refresh your library just now. Showing the last loaded view.'
              : errorMessage}
          </div>
        )}

        {loading && <LoadingSkeleton />}

        {!loading && isSearching && (
          <>
            <div style={{ marginBottom: '24px', color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem' }}>
              {filteredBooks.length > 0
                ? `${filteredBooks.length} sprint${filteredBooks.length !== 1 ? 's' : ''} matching "${searchQuery}"`
                : `No sprints found for "${searchQuery}"`}
            </div>

            {filteredBooks.length === 0 && (
              <div
                className="glass-panel"
                style={{ padding: '60px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🔍</div>
                <p>Try a different keyword — like a skill, topic, or author name.</p>
              </div>
            )}

            {categoriesToShow.map(({ category, books: catBooks }) => (
              <BookRow
                key={category}
                title={category}
                description={`${catBooks.length} match${catBooks.length !== 1 ? 'es' : ''}`}
                books={catBooks}
              />
            ))}
          </>
        )}

        {!loading && !isSearching && (
          <>
            <SkillPassport userSkills={userSkills} />

            <section className="featured-section">
              {featuredBook ? (
                <div
                  className="featured-card glass-panel"
                  style={{
                    display: 'block',
                    background: (() => {
                      const c = featuredBook.category?.toLowerCase() || '';
                      if (c.includes('financial') || c.includes('money')) return 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, transparent 60%)';
                      if (c.includes('leadership') || c.includes('management')) return 'linear-gradient(135deg, rgba(107,143,214,0.08) 0%, transparent 60%)';
                      if (c.includes('productivity') || c.includes('habit')) return 'linear-gradient(135deg, rgba(6,182,212,0.10) 0%, transparent 60%)';
                      if (c.includes('sales') || c.includes('negotiation')) return 'linear-gradient(135deg, rgba(251,113,133,0.08) 0%, transparent 60%)';
                      if (c.includes('strategy') || c.includes('innovation')) return 'linear-gradient(135deg, rgba(14,165,233,0.08) 0%, transparent 60%)';
                      return 'linear-gradient(135deg, rgba(25,190,227,0.08) 0%, transparent 60%)';
                    })(),
                  }}
                >
                  <span className="tag-featured">
                    <span className="pulse-dot" />
                    Featured Sprint
                  </span>

                  <h2>{featuredBook.sprint_title || featuredBook.title}</h2>

                  <p className="featured-desc">
                    {featuredBook.brief_content ||
                      'A 7-day skill sprint that turns professional concepts into real behavior change, one focused action at a time.'}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px' }}>
                    <span
                      style={{
                        fontSize: '0.78rem',
                        color: 'rgba(255,255,255,0.35)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        fontWeight: '700',
                      }}
                    >
                      Inspired by
                    </span>
                    <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>
                      {featuredBook.title}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                    <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)' }}>
                      {featuredBook.author}
                    </span>
                  </div>

                  <Link href={`/summit/${featuredBook.id}/day/1`} className="btn-primary">
                    Begin Sprint →
                  </Link>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
                    {[
                      { num: '~15 min', label: 'per day' },
                      { num: '7 days', label: 'total' },
                    ].map(({ num, label }, i) => (
                      <div key={num} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {i > 0 && <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '1rem' }}>·</span>}
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.85rem',
                              fontWeight: '700',
                              color: 'var(--brand-teal)',
                            }}
                          >
                            {num}
                          </span>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              color: 'rgba(255,255,255,0.35)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.8px',
                              fontWeight: '600',
                            }}
                          >
                            {label}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div
                  className="glass-panel"
                  style={{ padding: '80px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}
                >
                  No sprints available yet.
                </div>
              )}
            </section>

            {categoriesToShow.map(({ category, books: catBooks }) => (
              <BookRow
                key={category}
                title={category}
                description={`${catBooks.length} skill sprints`}
                books={catBooks}
              />
            ))}
          </>
        )}
      </main>
    </>
  );
}