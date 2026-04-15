"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/app/supabaseClient';

export default function SetupPage() {
  const router = useRouter();

  const [firstName,       setFirstName]       = useState('');
  const [lastName,        setLastName]        = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState('');

  // Guard: if no active session, the invite token wasn't valid — send to login
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace('/auth/login?error=invalid_invite');
    });
  }, []);

  async function handleSetup(e) {
    e.preventDefault();
    setError('');

    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter your first and last name.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      // 1. Set the password
      const { error: passwordError } = await supabase.auth.updateUser({ password });
      if (passwordError) throw passwordError;

      // 2. Write full_name to the profiles table
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Session lost — please try again.');

      const fullName = `${firstName.trim()} ${lastName.trim()}`;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 3. Done — into the app
      router.push('/library');

    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
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
    outline: 'none',
    fontFamily: 'var(--font-sans)',
  };

  return (
    <>
      <div className="ambient-glow" />

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
            <h1 style={{ fontSize: '2rem', marginBottom: '12px' }}>Set up your account</h1>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
              You're almost in. Enter your name and choose a password to get started.
            </p>
          </div>

          <form onSubmit={handleSetup}>

            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '24px',
                color: '#ef4444',
                fontSize: '0.9rem',
              }}>
                {error}
              </div>
            )}

            {/* Name row */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
              <div style={{ flex: 1 }}>
                <label htmlFor="firstName" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.95rem' }}>
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  required
                  autoComplete="given-name"
                  placeholder="Jane"
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="lastName" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.95rem' }}>
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  required
                  autoComplete="family-name"
                  placeholder="Smith"
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="password" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.95rem' }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="At least 6 characters"
                style={inputStyle}
                suppressHydrationWarning
              />
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.95rem' }}>
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Re-enter your password"
                style={inputStyle}
                suppressHydrationWarning
              />
            </div>

            <button
              type="submit"
              className="btn-primary-large"
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? 'Setting up your account…' : 'Enter SummitSkills →'}
            </button>

          </form>
        </div>
      </main>
    </>
  );
}
