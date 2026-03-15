"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/app/supabaseClient'; 
import BookRow from '@/components/BookRow'; 
import StatsHoverBanner from '@/components/StatsHoverBanner';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [books, setBooks] = useState([]); 
  const [booksByCategory, setBooksByCategory] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  useEffect(() => {
    setMounted(true);
    async function fetchBooks() {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setBooks(data);
        const grouped = data.reduce((acc, book) => {
          const category = book.category || 'Uncategorized';
          if (!acc[category]) acc[category] = [];
          acc[category].push(book);
          return acc;
        }, {});
        setBooksByCategory(grouped);
      }
      setLoading(false);
    }
    fetchBooks();
  }, []);

  if (!mounted) return null;

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
      'Health & Wellness': 'Health'
    };
    return shortNames[category] || category;
  };

  const categoryOrder = [
    'Habits & Self-Discipline', 'Money & Investing', 'Productivity & Performance',
    'Mindset & Mental Toughness', 'Strategic Thinking', 'Communication & Influence',
    'Leadership & Business', 'Philosophy & Wisdom', 'Health & Wellness'
  ];
  
  const sortedCategories = Object.keys(booksByCategory).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    return a.localeCompare(b);
  });

  const categoriesToShow = selectedCategory === 'All' ? sortedCategories : [selectedCategory];

  return (
    <>
      <div className="ambient-glow"></div>
      <nav className="glass-nav">
        <div className="nav-content">
          <Link href="/" className="logo">
            <img src="/SummitReads-Logo.png" alt="SummitReads" className="logo-img" />
            Summit<span>Reads</span>
          </Link>
          <div className="nav-actions">
            <Link href="/library" className="btn-outline small">Library</Link>
            <button className="btn-primary small" onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = '/';
            }}>
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <header className="hero">
        <StatsHoverBanner totalSummaries={books.length} />

        <div className="hero-badge">
          <span className="pulse-dot"></span>
          <span>Your Growth Journey • {books.length} Books Ready</span>
        </div>
        <h1>Transform Books Into <span className="text-gradient">Action</span></h1>
        <p className="hero-sub">7-day journeys that turn ideas into real change. Daily insights, personal reflection, and actions you'll actually take.</p>

        <div className="search-wrapper">
          <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input type="text" placeholder="What do you want to change? Habits, money, mindset..." />
        </div>
      </header>

      <div className="category-scroll">
        <button className={`pill ${selectedCategory === 'All' ? 'active' : ''}`} onClick={() => setSelectedCategory('All')}>All</button>
        {sortedCategories.map((category) => (
          <button key={category} className={`pill ${selectedCategory === category ? 'active' : ''}`} onClick={() => setSelectedCategory(category)}>
            {getCategoryShortName(category)}
          </button>
        ))}
      </div>

      <main className="container">
        <section className="featured-section">
          {books.length > 0 ? (
            <div className="featured-card glass-panel">
              <div className="featured-content">
                <span className="tag-featured">Start Your Transformation</span>
                <h2>{books[0].title}</h2>
                <p className="featured-desc italic text-gray-300">
                  {books[0].brief_content || `Begin a 7-day journey with ${books[0].title}. Daily insights, personal reflection, and real action steps.`}
                </p>
                <div className="featured-meta">
                  <span>by {books[0].author}</span> • <span>7-Day Journey</span>
                </div>
                <Link href={`/summit/${books[0].id}/day/1`} className="btn-primary">
                  Begin Day 1
                </Link>
              </div>
              <div className="featured-image">
                <img 
                  src={books[0].cover_url || books[0].image || "/placeholder-book.png"} 
                  alt={books[0].title}
                  onError={(e) => { e.target.src = "/placeholder-book.png" }}
                />
              </div>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '80px', textAlign: 'center' }}>
              {loading ? "Loading your library..." : "No books available yet."}
            </div>
          )}
        </section>

        {books.length > 0 && categoriesToShow.map((category) => (
          <BookRow 
            key={category}
            title={category}
            description={`${booksByCategory[category].length} transformation journeys`}
            books={booksByCategory[category]}
          />
        ))}
      </main>
    </>
  );
}
