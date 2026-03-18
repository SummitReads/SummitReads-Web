"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/supabaseClient'; 
import BookRow from '@/components/BookRow'; 
import StatsHoverBanner from '@/components/StatsHoverBanner';
import StreakCounter from '@/components/StreakCounter';
import OnboardingModal from '@/components/OnboardingModal';

export default function Library() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [books, setBooks] = useState([]); 
  const [booksByCategory, setBooksByCategory] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  useEffect(() => {
    setMounted(true);
    
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    }
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

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

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        alert('Error signing out: ' + error.message);
      } else {
        router.push('/');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }

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

  const getCategoryPillColor = (category) => {
    if (!category) return 'var(--brand-teal)';
    const lower = category.toLowerCase();
    if (['financial', 'investing', 'money', 'wealth'].some(k => lower.includes(k)))        return '#10B981';
    if (['leadership', 'people management', 'management'].some(k => lower.includes(k)))    return '#6B8FD6';
    if (['productivity', 'habits', 'performance', 'minimal'].some(k => lower.includes(k))) return '#06B6D4';
    if (['marketing', 'branding', 'storytelling'].some(k => lower.includes(k)))            return '#84CC16';
    if (['sales', 'persuasion', 'negotiation', 'influence'].some(k => lower.includes(k)))  return '#FB7185';
    if (['strategy', 'innovation', 'business model'].some(k => lower.includes(k)))         return '#0EA5E9';
    if (['communication', 'conversation', 'writing'].some(k => lower.includes(k)))         return '#F43F5E';
    if (['mindset', 'psychology', 'mental', 'emotional'].some(k => lower.includes(k)))     return '#8B5CF6';
    if (['entrepreneurship', 'startup', 'founder'].some(k => lower.includes(k)))           return '#EF4444';
    if (['relationships', 'network', 'social'].some(k => lower.includes(k)))               return '#EAB308';
    return 'var(--brand-teal)';
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
      <OnboardingModal />
      <div className="ambient-glow"></div>
      <nav className="glass-nav">
        <div className="nav-content">
          <Link href="/library" className="logo">
            <img src="/SummitSkills-Logo.png" alt="SummitSkills" className="logo-img" />
            Summit<span>Reads</span>
          </Link>
          <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <StreakCounter />
            <button className="btn-primary small" onClick={handleSignOut}>
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <header className="hero">
        <StatsHoverBanner totalSummaries={books.length} />
        <div className="hero-badge">
          <span className="pulse-dot"></span>
          <span>295 Skill Sprints • Ready to Start Today</span>
        </div>
        <h1>What do you want to <span className="text-gradient">work on?</span></h1>
        <p className="hero-sub">Find your next sprint below, or search by skill, topic, or goal.</p>
        <div className="search-wrapper">
          <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input type="text" placeholder="Search sprints — habits, leadership, money..." />
        </div>
      </header>

      <div className="category-scroll">
        <button
          className={`pill ${selectedCategory === 'All' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('All')}
        >
          All
        </button>
        {sortedCategories.map((category) => {
          const isActive = selectedCategory === category;
          const pillColor = getCategoryPillColor(category);
          return (
            <button
              key={category}
              className="pill"
              onClick={() => setSelectedCategory(category)}
              style={isActive ? {
                background: pillColor,
                borderColor: pillColor,
                color: '#0F172A',
                fontWeight: '700',
                boxShadow: `0 0 12px ${pillColor}55`,
              } : {}}
            >
              {getCategoryShortName(category)}
            </button>
          );
        })}
      </div>

      <main className="container">
        <section className="featured-section">
          {books.length > 0 ? (() => {
            const featured = books.find(b => b.featured) || books[0];
            const heroTitle = featured.sprint_title || featured.title;
            const heroDesc = featured.brief_content ||
              `A 7-day skill sprint that turns professional concepts into real behavior change — one focused action at a time.`;
            return (
              <div className="featured-card glass-panel" style={{ display: 'block' }}>
                <span className="tag-featured">
                  <span className="pulse-dot" />
                  Featured Sprint
                </span>
                <h2>{heroTitle}</h2>
                <p className="featured-desc">{heroDesc}</p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>
                    Inspired by
                  </span>
                  <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>
                    {featured.title}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                  <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)' }}>
                    {featured.author}
                  </span>
                </div>

                <Link href={`/summit/${featured.id}/day/1`} className="btn-primary">
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
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: '700', color: 'var(--brand-teal)' }}>{num}</span>
                        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '600' }}>{label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })() : (
            <div className="glass-panel" style={{ padding: '80px', textAlign: 'center' }}>
              {loading ? "Loading your library..." : "No sprints available yet."}
            </div>
          )}
        </section>

        {books.length > 0 && categoriesToShow.map((category) => (
          <BookRow 
            key={category}
            title={category}
            description={`${booksByCategory[category].length} skill sprints`}
            books={booksByCategory[category]}
          />
        ))}
      </main>
    </>
  );
}
