import Link from 'next/link';

export default function Navigation() {
  return (
    <nav className="glass-nav">
      <div className="nav-content">
        <Link href="/" className="logo">
          <img src="/SummitSkills-Logo.png" alt="SummitSkills" className="logo-img" />
          Summit<span>Reads</span>
        </Link>
        
        <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/library" className="btn-outline small">Library</Link>
          <button 
            className="btn-primary small"
            onClick={async () => {
              const { supabase } = await import('@/app/supabaseClient');
              await supabase.auth.signOut();
              window.location.href = '/';
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}
