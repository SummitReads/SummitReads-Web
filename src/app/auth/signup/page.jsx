"use client";
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/app/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isTrial = searchParams.get('trial') === 'true';
  const trialSeats = searchParams.get('seats') || '10';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSignup(e) {
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            company_name: companyName,
            is_trial: isTrial,
            trial_seats: isTrial ? parseInt(trialSeats) : null,
          }
        }
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      if (data.user && !data.session) {
        setSuccess(true);
        setLoading(false);
      } else {
        router.push('/');
      }
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

  const Nav = () => (
    <nav className="glass-nav">
      <div className="nav-content">
        <Link href="/" className="logo">
          <img src="/SummitSkills-Logo.png" alt="SummitSkills" className="logo-img" />
          Summit<span>Skills</span>
        </Link>
      </div>
    </nav>
  );

  if (success) {
    return (
      <>
        <div className="ambient-glow"></div>
        <Nav />
        <main className="container" style={{ maxWidth: '480px', paddingTop: '80px', paddingLeft: '16px', paddingRight: '16px' }}>
          <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '24px' }}>✉️</div>
            <h1 style={{ fontSize: '2rem', marginBottom: '16px' }}>Check Your Email</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px', lineHeight: '1.6' }}>
              We sent a confirmation link to <strong style={{ color: 'white' }}>{email}</strong>.
              Click the link to verify your account and start your first sprint.
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
      <Nav />
      <main className="container" style={{ maxWidth: '480px', paddingTop: '80px', paddingLeft: '16px', paddingRight: '16px' }}>
        <div className="glass-panel" style={{ padding: '48px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '12px' }}>
              {isTrial ? 'Start Your Free Trial' : 'Start Your Journey'}
            </h1>
            <p style={{ color: 'var(--text-muted)' }}>
              {isTrial
                ? '14 days free · No credit card · No contract'
                : 'Create an account to begin your first skill sprint'}
            </p>
          </div>

          <form onSubmit={handleSignup}>
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
              <label htmlFor="fullName" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Full Name</label>
              <input id="fullName" name="fullName" type="text" value={fullName}
                onChange={e => setFullName(e.target.value)} required autoComplete="name"
                placeholder="Jane Smith" style={inputStyle} />
            </div>

            {isTrial && (
              <div style={{ marginBottom: '24px' }}>
                <label htmlFor="companyName" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Company Name</label>
                <input id="companyName" name="companyName" type="text" value={companyName}
                  onChange={e => setCompanyName(e.target.value)} required autoComplete="organization"
                  placeholder="Acme Corp" style={inputStyle} />
              </div>
            )}

            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="email" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Email</label>
              <input id="email" name="email" type="email" value={email}
                onChange={e => setEmail(e.target.value)} required autoComplete="email"
                placeholder="you@example.com" style={inputStyle} />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="password" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Password</label>
              <input id="password" name="password" type="password" value={password}
                onChange={e => setPassword(e.target.value)} required autoComplete="new-password"
                placeholder="At least 6 characters" suppressHydrationWarning={true} style={inputStyle} />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Confirm Password</label>
              <input id="confirmPassword" name="confirmPassword" type="password" value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)} required autoComplete="new-password"
                placeholder="Re-enter your password" suppressHydrationWarning={true} style={inputStyle} />
            </div>

            <button type="submit" className="btn-primary-large" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link href="/auth/login" style={{ color: 'var(--brand-teal)', fontWeight: '600' }}>Sign in</Link>
          </div>
        </div>
      </main>
    </>
  );
}
