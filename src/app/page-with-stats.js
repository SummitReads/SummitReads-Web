"use client";
import { useEffect, useState } from 'react';
import StatsHoverBanner from './StatsHoverBanner';

const trendingBooks = [
    {
        title: "Atomic Habits",
        author: "James Clear",
        category: "Psychology",
        rating: "4.9",
        image: "https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=600&auto=format&fit=crop&q=60"
    },
    {
        title: "The Psychology of Money",
        author: "Morgan Housel",
        category: "Finance",
        rating: "4.8",
        image: "https://images.unsplash.com/photo-1555252333-9f8e92e65df4?w=600&auto=format&fit=crop&q=60"
    },
    {
        title: "Deep Work",
        author: "Cal Newport",
        category: "Productivity",
        rating: "4.7",
        image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=60"
    },
    {
        title: "Thinking, Fast & Slow",
        author: "Daniel Kahneman",
        category: "Science",
        rating: "4.6",
        image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=60"
    }
];

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [totalSummaries, setTotalSummaries] = useState(1200);
  
  useEffect(() => {
    setMounted(true);
    
    // TODO: Fetch real count from Firestore/Supabase
    // const fetchCount = async () => {
    //   const { count } = await supabase
    //     .from('summaries')
    //     .select('*', { count: 'exact', head: true });
    //   setTotalSummaries(count);
    // };
    // fetchCount();
  }, []);

  if (!mounted) return null;

  return (
    <>
      <div className="ambient-glow"></div>

      <nav className="glass-nav">
        <div className="nav-content">
          <a href="#" className="logo">
            <img src="/SummitReads-Logo.png" alt="SummitReads" className="logo-img" />
            Summit<span>Reads</span>
          </a>
          
          <div className="nav-actions">
            <a href="#" className="nav-link">Library</a>
            <button className="btn-primary small">Sign Out</button>
          </div>
        </div>
      </nav>

      <header className="hero">
        {/* NEW: Animated Stats Banner */}
        <StatsHoverBanner totalSummaries={totalSummaries} />

        <div className="hero-badge">
          <span className="pulse-dot"></span>
          Updated Daily • 1,200+ Guides
        </div>
        <h1>
          Discover <span className="text-gradient">Wisdom</span>
        </h1>
        <p className="hero-sub">Curated summaries for the modern leader.</p>

        <div className="search-wrapper">
          <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.3-4.3"/>
          </svg>
          <input type="text" id="searchInput" placeholder="Search titles, authors, or topics..." />
        </div>
      </header>

      <div className="category-scroll">
        <button className="pill active">All</button>
        <button className="pill">Business</button>
        <button className="pill">Psychology</button>
        <button className="pill">Leadership</button>
        <button className="pill">Productivity</button>
        <button className="pill">Biographies</button>
      </div>

      <main className="container">
        
        <section className="featured-section">
          <div className="featured-card glass-panel">
            <div className="featured-content">
              <span className="tag-featured">Book of the Day</span>
              <h2>The Psychology of Money</h2>
              <p className="featured-desc">Timeless lessons on wealth, greed, and happiness. Doing well with money isn't necessarily about what you know. It's about how you behave.</p>
              <div className="featured-meta">
                <span>By Morgan Housel</span> • <span>15 min read</span>
              </div>
              <button className="btn-primary">Read Summary</button>
            </div>
            <div className="featured-image">
              <img src="https://images.unsplash.com/photo-1555252333-9f8e92e65df4?w=600&auto=format&fit=crop&q=60" alt="Featured Book" />
            </div>
          </div>
        </section>

        <div className="section-header">
          <h2>Trending Now</h2>
          <a href="#" className="btn-ghost">View All <span className="arrow">→</span></a>
        </div>

        <div className="grid" id="trending-grid">
          {trendingBooks.map((book, index) => (
            <div key={index} className="card">
              <div className="card-image-container">
                <img src={book.image} alt={book.title} loading="lazy" />
                <div className="card-overlay">
                  <button className="play-btn">
                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div className="card-content">
                <h3>{book.title}</h3>
                <p className="author">{book.author}</p>
                <div className="card-meta">
                  <span className="tag">{book.category}</span>
                  <span className="rating">★ {book.rating}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </main>
    </>
  );
}
