"use client";
import { useState } from 'react';
import { supabase } from '@/app/supabaseClient';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleReset(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  if (success) {
    return (
      <>
        <div className="ambient-glow"></div>
        <nav className="glass-nav">
          <div className="nav-content">
            <Link href="/" className="logo">
              <img src="/SummitSkills-Logo.png" alt="SummitSkills" className="logo-img" />
              Summit<span>Reads</span>
            </Link>
          </div>
        </nav>

        <main className="container" style={{ maxWidth: '480px', paddingTop: '80px' }}>
          <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '24px' }}>✉️</div>
            <h1 style={{ fontSize: '2rem', marginBottom: '16px' }}>Check Your Email</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
              We've sent a password reset link to <strong>{email}</strong>. 
              Click the link in the email to reset your password.
            </p>
            <Link href="/auth/login" className="btn-primary">
              Back to Login
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <div className="ambient-glow"></div>
      <nav className="glass-nav">
        <div className="nav-content">
          <Link href="/" className="logo">
            <img src="/SummitSkills-Logo.png" alt="SummitSkills" className="logo-img" />
            Summit<span>Reads</span>
          </Link>
        </div>
      </nav>

      <main className="container" style={{ maxWidth: '480px', paddingTop: '80px' }}>
        <div className="glass-panel" style={{ padding: '48px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '12px' }}>Reset Password</h1>
            <p style={{ color: 'var(--text-muted)' }}>Enter your email and we'll send you a reset link</p>
          </div>

          <form onSubmit={handleReset}>
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

            <button 
              type="submit" 
              className="btn-primary-large" 
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-muted)' }}>
            Remember your password?{' '}
            <Link href="/auth/login" style={{ color: 'var(--brand-teal)', fontWeight: '600' }}>
              Sign in
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
