"use client";
import { useState } from 'react';
import { supabase } from '@/app/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      // Success - redirect to home
      router.push('/');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <>
      <div className="ambient-glow"></div>
      <nav className="glass-nav">
        <div className="nav-content">
          <Link href="/" className="logo">
            <img src="/SummitSkills-Logo.png" alt="SummitSkills" className="logo-img" />
            Summit<span>Skills</span>
          </Link>
        </div>
      </nav>

      <main className="container" style={{ maxWidth: '480px', paddingTop: '80px', paddingLeft: '16px', paddingRight: '16px' }}>
        <div className="glass-panel" style={{ padding: 'clamp(24px, 5vw, 48px)' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '12px' }}>Welcome Back</h1>
            <p style={{ color: 'var(--text-muted)' }}>Sign in to continue your skill development</p>
          </div>

          <form onSubmit={handleLogin}>
            {error && (
              <div style={{ 
                background: 'rgba(239, 68, 68, 0.1)', 
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '24px',
                color: '#ef4444'
              }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="email" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="password" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                suppressHydrationWarning={true}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ textAlign: 'right', marginBottom: '24px' }}>
              <Link href="/auth/reset-password" style={{ color: 'var(--brand-teal)', fontSize: '0.9rem' }}>
                Forgot password?
              </Link>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                width: '100%',
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.25)',
                background: 'transparent',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading ? 'wait' : 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'var(--font-sans)',
              }}
              onMouseEnter={e => {
                e.target.style.borderColor = '#17B8E0'
                e.target.style.color = '#17B8E0'
              }}
              onMouseLeave={e => {
                e.target.style.borderColor = 'rgba(255,255,255,0.25)'
                e.target.style.color = '#fff'
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link href="/auth/signup" style={{ color: 'var(--brand-teal)', fontWeight: '600' }}>
              Sign up
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}