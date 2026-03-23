"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/app/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Notification prefs (localStorage)
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [prefsSaved, setPrefsSaved] = useState(false);

  // Password reset
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);

  useEffect(() => {
    setMounted(true);

    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }
      setUser(session.user);
      setLoadingUser(false);
    }
    checkUser();

    // Load saved prefs from localStorage
    const savedReminder = localStorage.getItem('sr_reminder_enabled');
    const savedTime = localStorage.getItem('sr_reminder_time');
    if (savedReminder !== null) setReminderEnabled(savedReminder === 'true');
    if (savedTime) setReminderTime(savedTime);
  }, []);

  function savePreferences() {
    localStorage.setItem('sr_reminder_enabled', reminderEnabled);
    localStorage.setItem('sr_reminder_time', reminderTime);
    setPrefsSaved(true);
    setTimeout(() => setPrefsSaved(false), 2500);
  }

  async function handlePasswordReset() {
    if (!user?.email) return;
    setPasswordResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });
    if (!error) setPasswordResetSent(true);
    setPasswordResetLoading(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  if (!mounted) return null;

  const sectionStyle = {
    marginBottom: '24px',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    color: 'rgba(255,255,255,0.35)',
    marginBottom: '6px',
  };

  const valueStyle = {
    fontSize: '1rem',
    color: 'rgba(255,255,255,0.85)',
  };

  const dividerStyle = {
    borderTop: '1px solid rgba(255,255,255,0.07)',
    margin: '32px 0',
  };

  return (
    <>
      <div className="ambient-glow"></div>
      <nav className="glass-nav">
        <div className="nav-content">
          <Link href="/library" className="logo">
            <img src="/SummitReads-Logo.png" alt="SummitReads" className="logo-img" />
            Summit<span>Reads</span>
          </Link>
          <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="btn-primary small" onClick={() => router.push('/settings')}>
              Settings
            </button>
            <button className="btn-primary small" onClick={handleSignOut}>
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="container" style={{ maxWidth: '600px', paddingTop: '80px', paddingLeft: '16px', paddingRight: '16px' }}>

        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '6px' }}>Settings</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage your account and preferences</p>
        </div>

        {/* ── Account ────────────────────────────────────────────────────────── */}
        <div className="glass-panel" style={{ padding: '32px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '24px', color: 'var(--brand-teal)' }}>
            Account
          </h2>

          <div style={sectionStyle}>
            <span style={labelStyle}>Email</span>
            {loadingUser ? (
              <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '6px', height: '20px', width: '200px' }} />
            ) : (
              <span style={valueStyle}>{user?.email}</span>
            )}
          </div>

          <div style={dividerStyle} />

          <div>
            <span style={labelStyle}>Password</span>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.875rem', marginBottom: '16px' }}>
              We'll email you a secure link to set a new password.
            </p>

            {passwordResetSent ? (
              <div style={{
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '8px', padding: '12px 16px',
                color: '#4ade80', fontSize: '0.875rem',
              }}>
                ✓ Reset link sent — check your email.
              </div>
            ) : (
              <button
                className="btn-ghost small"
                onClick={handlePasswordReset}
                disabled={passwordResetLoading}
              >
                {passwordResetLoading ? 'Sending...' : 'Send Password Reset Email'}
              </button>
            )}
          </div>
        </div>

        {/* ── Notifications ──────────────────────────────────────────────────── */}
        <div className="glass-panel" style={{ padding: '32px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '24px', color: 'var(--brand-teal)' }}>
            Daily Reminder
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <p style={{ fontWeight: '600', marginBottom: '4px' }}>Email reminders</p>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.45)' }}>
                Get a nudge each day to complete your sprint task
              </p>
            </div>
            {/* Toggle */}
            <button
              onClick={() => setReminderEnabled(!reminderEnabled)}
              style={{
                width: '48px', height: '26px', borderRadius: '13px', border: 'none',
                cursor: 'pointer', flexShrink: 0, position: 'relative', transition: 'background 0.2s',
                background: reminderEnabled ? 'var(--brand-teal)' : 'rgba(255,255,255,0.15)',
              }}
              aria-label="Toggle reminder"
            >
              <span style={{
                position: 'absolute', top: '3px',
                left: reminderEnabled ? '25px' : '3px',
                width: '20px', height: '20px', borderRadius: '50%',
                background: 'white', transition: 'left 0.2s',
              }} />
            </button>
          </div>

          {reminderEnabled && (
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle} htmlFor="reminderTime">Preferred time</label>
              <input
                id="reminderTime"
                type="time"
                value={reminderTime}
                onChange={e => setReminderTime(e.target.value)}
                style={{
                  padding: '10px 14px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '1rem',
                  colorScheme: 'dark',
                }}
              />
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="btn-primary small" onClick={savePreferences}>
              Save Preferences
            </button>
            {prefsSaved && (
              <span style={{ color: '#4ade80', fontSize: '0.875rem' }}>✓ Saved</span>
            )}
          </div>
        </div>

        {/* ── Sign out ───────────────────────────────────────────────────────── */}
        <div className="glass-panel" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '12px', color: 'rgba(255,255,255,0.6)' }}>
            Sign Out
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.35)', marginBottom: '20px' }}>
            You'll be returned to the home page.
          </p>
          <button className="btn-ghost small" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>

      </main>
    </>
  );
}
