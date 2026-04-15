"use client";
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/app/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function SkeletonBlock({ width = '100%', height = '20px', style = {} }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.07)', borderRadius: '6px',
      width, height, ...style,
      animation: 'pulse 1.6s ease-in-out infinite',
    }} />
  );
}

const categoryColors = {
  'Productivity & Habits':              '#06B6D4',
  'Financial Intelligence':             '#10B981',
  'Leadership & People Management':     '#6B8FD6',
  'Sales, Persuasion & Negotiation':    '#F43F5E',
  'Strategy & Innovation':              '#0EA5E9',
  'Marketing, Branding & Storytelling': '#EAB308',
};
function categoryColor(cat) { return categoryColors[cat] || 'var(--brand-teal)'; }

const PAGE_SIZE = 10;

export default function ReflectionsPage() {
  const router = useRouter();
  const [mounted,     setMounted]     = useState(false);
  const [profile,     setProfile]     = useState(null);
  const [allProgress, setAllProgress] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [page,        setPage]        = useState(0);

  useEffect(() => {
    setMounted(true);
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth/login'); return; }
      const uid = session.user.id;

      const [profileRes, progressRes] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', uid).single(),
        supabase
          .from('user_progress')
          .select('*, books(id, title, author, category, sprint_title)')
          .eq('user_id', uid)
          .not('reflection_data', 'is', null)
          .order('unlocked_at', { ascending: false }),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (progressRes.data) setAllProgress(progressRes.data.filter(p => p.reflection_data));
      setLoading(false);
    }
    load();
  }, []);

  // All categories that have at least one reflection
  const categories = useMemo(() => {
    const cats = new Set();
    allProgress.forEach(p => { if (p.books?.category) cats.add(p.books.category); });
    return ['All', ...Array.from(cats).sort()];
  }, [allProgress]);

  // Group by sprint, apply search + category filter
  const reflectionsBySprint = useMemo(() => {
    const q = search.toLowerCase().trim();
    const map = {};

    allProgress.forEach(p => {
      if (!p.books) return;
      if (activeCategory !== 'All' && p.books.category !== activeCategory) return;
      if (q) {
        const haystack = [
          p.reflection_data,
          p.books.sprint_title,
          p.books.title,
          p.books.author,
          p.books.category,
        ].join(' ').toLowerCase();
        if (!haystack.includes(q)) return;
      }

      const id = p.book_id;
      if (!map[id]) map[id] = { book: p.books, entries: [] };
      map[id].entries.push({
        day_number:   p.day_number,
        text:         p.reflection_data,
        unlocked_at:  p.unlocked_at,
        completed:    p.completed,
      });
    });

    return Object.values(map)
      .map(s => ({ ...s, entries: s.entries.sort((a, b) => a.day_number - b.day_number) }))
      .sort((a, b) =>
        new Date(b.entries[b.entries.length - 1].unlocked_at) -
        new Date(a.entries[a.entries.length - 1].unlocked_at)
      );
  }, [allProgress, search, activeCategory]);

  // Pagination
  const totalPages  = Math.ceil(reflectionsBySprint.length / PAGE_SIZE);
  const paginated   = reflectionsBySprint.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset to page 0 when filter/search changes
  useEffect(() => { setPage(0); }, [search, activeCategory]);

  const totalReflections = useMemo(() =>
    allProgress.filter(p => p.reflection_data).length,
  [allProgress]);

  if (!mounted) return null;

  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  return (
    <>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .ref-search::placeholder { color: rgba(238,242,247,0.25); }
        .ref-search:focus { outline: none; border-color: rgba(23,184,224,0.4); }
        .cat-pill { cursor: pointer; border: 1px solid rgba(255,255,255,0.1); border-radius: 99px; padding: 5px 14px; font-size: 0.78rem; font-weight: 600; background: transparent; color: rgba(238,242,247,0.5); transition: all 0.15s; font-family: var(--font-sans); }
        .cat-pill:hover { border-color: rgba(255,255,255,0.25); color: rgba(238,242,247,0.8); }
        .cat-pill.active { background: var(--brand-teal); border-color: var(--brand-teal); color: #0D1520; }
      `}</style>

      <div className="ambient-glow" />
      <nav className="glass-nav">
        <div className="nav-content">
          <Link href="/library" className="logo">
            <img src="/SummitSkills-Logo.png" alt="SummitSkills" className="logo-img" />
            Summit<span>Skills</span>
          </Link>
          <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="btn-primary small" onClick={() => router.push('/settings')}>Settings</button>
            <button className="btn-primary small" onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}>Sign Out</button>
          </div>
        </div>
      </nav>

      <main className="container" style={{ paddingTop: '80px', maxWidth: '900px', paddingLeft: '16px', paddingRight: '16px' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: '32px' }}>
          <Link href="/dashboard" style={{ fontSize: '0.8rem', color: 'var(--brand-teal)', textDecoration: 'none', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '16px' }}>
            ← Back to Dashboard
          </Link>
          <p style={{ color: 'var(--text-muted)', marginBottom: '4px', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '700' }}>
            Your Work
          </p>
          {loading
            ? <SkeletonBlock width="280px" height="36px" />
            : <h1 style={{ fontSize: '2rem', margin: '0 0 8px' }}>
                {totalReflections} reflection{totalReflections !== 1 ? 's' : ''} across {reflectionsBySprint.length} sprint{reflectionsBySprint.length !== 1 ? 's' : ''}
              </h1>
          }
        </div>

        {/* ── Search ── */}
        <div style={{ marginBottom: '20px' }}>
          <input
            className="ref-search"
            type="text"
            placeholder="Search your reflections..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '12px 16px',
              background: 'rgba(15,23,42,0.6)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px', color: 'white',
              fontSize: '0.9rem', boxSizing: 'border-box',
              fontFamily: 'var(--font-sans)',
              transition: 'border-color 0.2s',
            }}
          />
        </div>

        {/* ── Category filter pills ── */}
        {!loading && categories.length > 2 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '28px' }}>
            {categories.map(cat => (
              <button
                key={cat}
                className={`cat-pill${activeCategory === cat ? ' active' : ''}`}
                onClick={() => setActiveCategory(cat)}
                style={activeCategory === cat && cat !== 'All' ? {
                  background: categoryColor(cat),
                  borderColor: categoryColor(cat),
                  color: '#0D1520',
                } : {}}
              >
                {cat === 'All' ? 'All' : cat.split(',')[0].split('&')[0].trim()}
              </button>
            ))}
          </div>
        )}

        {/* ── Results ── */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[1,2,3].map(i => <SkeletonBlock key={i} height="120px" style={{ borderRadius: '12px' }} />)}
          </div>
        ) : paginated.length === 0 ? (
          <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '0' }}>
              {search || activeCategory !== 'All'
                ? 'No reflections match your search.'
                : "You haven't written any reflections yet."}
            </p>
            {!search && activeCategory === 'All' && (
              <Link href="/library" className="btn-primary" style={{ display: 'inline-block', marginTop: '20px' }}>
                Start a sprint →
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {paginated.map(({ book, entries }) => {
              if (!book) return null;
              const color = categoryColor(book.category);
              return (
                <div key={book.id} className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                  {/* Sprint header */}
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <div style={{ fontWeight: '600', fontSize: '0.9rem', flex: 1 }}>{book.sprint_title || book.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>{book.author}</div>
                  </div>
                  {/* Entries */}
                  {entries.map((entry, i) => (
                    <Link
                      key={entry.day_number}
                      href={`/summit/${book.id}/day/${entry.day_number}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <div
                        style={{
                          padding: '14px 20px',
                          borderBottom: i < entries.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                          display: 'flex', gap: '14px', alignItems: 'flex-start',
                          transition: 'background 0.15s', cursor: 'pointer',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--brand-teal)', whiteSpace: 'nowrap', paddingTop: '2px', minWidth: '52px' }}>
                          Stage {entry.day_number}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'rgba(238,242,247,0.6)', lineHeight: 1.6, flex: 1 }}>
                          {entry.text}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)', paddingTop: '2px', flexShrink: 0 }}>→</div>
                      </div>
                    </Link>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '32px', marginBottom: '40px' }}>
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: page === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(238,242,247,0.7)', cursor: page === 0 ? 'default' : 'pointer', fontFamily: 'var(--font-sans)', fontSize: '0.85rem', transition: 'all 0.15s' }}
            >
              ← Prev
            </button>
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)' }}>
              {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: page === totalPages - 1 ? 'rgba(255,255,255,0.2)' : 'rgba(238,242,247,0.7)', cursor: page === totalPages - 1 ? 'default' : 'pointer', fontFamily: 'var(--font-sans)', fontSize: '0.85rem', transition: 'all 0.15s' }}
            >
              Next →
            </button>
          </div>
        )}

      </main>
    </>
  );
}
