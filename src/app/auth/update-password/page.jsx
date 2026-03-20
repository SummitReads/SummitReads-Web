"use client";
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/app/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState(false);

  // Use a ref so the timeout callback always reads the latest value —
  // fixes the stale closure bug that was firing sessionError too early
  const sessionReadyRef = useRef(false);

  useEffect(() => {
    // ── 1. PKCE flow: Supabase sends ?code=xxx, exchange it for a session ──
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          setSessionError(true);
        } else {
          sessionReadyRef.current = true;
          setSessionReady(true);
        }
      });
      return;
    }

    // ── 2. Implicit/hash flow: listen for PASSWORD_RECOVERY event ──
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        sessionReadyRef.current = true;
        setSessionReady(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        sessionReadyRef.current = true;
        setSessionReady(true);
      }
    });

    // ── 3. Timeout — only show error if session never arrived ──
    const timeout = setTimeout(() => {
      if (!sessionReadyRef.current) {
        setSessionError(true);
      }
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function handleUpdatePassword(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      setSuccess(true);
      setLoading(false);
      setTimeout(() => router.push('/'), 3000);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    color: 'white',
    fontSize: '1rem',
    boxSizing: 'border-box',
  };

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
        <div className="glass-panel" style={{ padding: '48px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '12px' }}>New Password</h1>
            <p style={{ color: 'var(--text-muted)' }}>Enter your new secure password below</p>
          </div>

          {/* Success */}
          {success && (
            <div style={{
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '8px', padding: '16px',
              textAlign: 'center', color: '#4ade80', lineHeight: '1.6',
            }}>
              Password updated! Redirecting you now...
            </div>
          )}

          {/* Expired / invalid link */}
          {!success && sessionError && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px', padding: '16px',
                color: '#ef4444', marginBottom: '24px', lineHeight: '1.6',
              }}>
                This reset link has expired or is invalid. Please request a new one.
              </div>
              <Link href="/auth/reset-password" className="btn-primary">
                Request New Link
              </Link>
            </div>
          )}

          {/* Verifying */}
          {!success && !sessionError && !sessionReady && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>
              Verifying reset link...
            </div>
          )}

          {/* Form */}
          {!success && !sessionError && sessionReady && (
            <form onSubmit={handleUpdatePassword}>
              {error && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px', padding: '12px',
                  marginBottom: '24px', color: '#ef4444',
                }}>
                  {error}
                </div>
              )}

              <div style={{ marginBottom: '24px' }}>
                <label htmlFor="password" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  New Password
                </label>
                <input id="password" type="password" value={password}
                  onChange={e => setPassword(e.target.value)}
                  required placeholder="At least 6 characters"
                  suppressHydrationWarning={true} style={inputStyle} />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Confirm New Password
                </label>
                <input id="confirmPassword" type="password" value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required placeholder="Re-enter password"
                  suppressHydrationWarning={true} style={inputStyle} />
              </div>

              <button type="submit" className="btn-primary-large"
                disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </main>
    </>
  );
}
