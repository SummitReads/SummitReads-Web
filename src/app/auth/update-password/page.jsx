"use client";
import { useState, useEffect } from 'react';
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

  // ── KEY FIX: wait for Supabase to establish the recovery session ────────────
  // When a user clicks the reset link, Supabase puts the token in the URL hash
  // and fires a PASSWORD_RECOVERY event. We must wait for that before calling
  // updateUser(), otherwise we get "Auth session missing!".
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState(false);

  useEffect(() => {
    // Check if there's already an active session (e.g. user navigated back)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });

    // Listen for the PASSWORD_RECOVERY event from the reset link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setSessionReady(true);
      }
      // If SIGNED_OUT fires without a recovery session, the link is invalid/expired
      if (event === 'SIGNED_OUT' && !sessionReady) {
        setSessionError(true);
      }
    });

    // Fallback: if no session event fires within 4s, show an error
    const timeout = setTimeout(() => {
      setSessionError(prev => {
        if (!sessionReady) return true;
        return prev;
      });
    }, 4000);

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

          {/* Success state */}
          {success && (
            <div style={{
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center',
              color: '#4ade80',
              lineHeight: '1.6',
            }}>
              Password updated! Redirecting you now...
            </div>
          )}

          {/* Invalid / expired link */}
          {!success && sessionError && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '16px',
                color: '#ef4444',
                marginBottom: '24px',
                lineHeight: '1.6',
              }}>
                This reset link has expired or is invalid. Please request a new one.
              </div>
              <Link href="/auth/reset-password" className="btn-primary">
                Request New Link
              </Link>
            </div>
          )}

          {/* Waiting for session */}
          {!success && !sessionError && !sessionReady && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>
              Verifying reset link...
            </div>
          )}

          {/* Form — only shown once session is confirmed */}
          {!success && !sessionError && sessionReady && (
            <form onSubmit={handleUpdatePassword}>
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
                <label htmlFor="password" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  New Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="At least 6 characters"
                  suppressHydrationWarning={true}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Re-enter password"
                  suppressHydrationWarning={true}
                  style={inputStyle}
                />
              </div>

              <button
                type="submit"
                className="btn-primary-large"
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </main>
    </>
  );
}
