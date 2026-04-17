"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/app/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [mounted,               setMounted]               = useState(false);
  const [user,                  setUser]                  = useState(null);
  const [profile,               setProfile]               = useState(null);
  const [loadingUser,           setLoadingUser]           = useState(true);

  // Notification prefs (localStorage)
  const [reminderEnabled,       setReminderEnabled]       = useState(false);
  const [reminderTime,          setReminderTime]          = useState('08:00');
  const [prefsSaved,            setPrefsSaved]            = useState(false);

  // Password reset
  const [passwordResetSent,     setPasswordResetSent]     = useState(false);
  const [passwordResetLoading,  setPasswordResetLoading]  = useState(false);
  const [passwordResetError,    setPasswordResetError]    = useState('');

  // Seat management
  const [seatCount,             setSeatCount]             = useState(1);
  const [seatLoading,           setSeatLoading]           = useState(false);
  const [seatSuccess,           setSeatSuccess]           = useState(false);
  const [seatError,             setSeatError]             = useState('');

  // Cancellation
  const [confirmCancel,         setConfirmCancel]         = useState(false);
  const [cancelLoading,         setCancelLoading]         = useState(false);
  const [cancelSuccess,         setCancelSuccess]         = useState(false);
  const [cancelError,           setCancelError]           = useState('');

  useEffect(() => {
    setMounted(true);

    async function loadUser() {
      // getUser() validates server-side — more secure than getSession()
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push('/auth/login');
        return;
      }
      setUser(currentUser);

      // Fetch profile for billing info
      const { data: profileData } = await supabase
        .from('profiles')
        .select('plan_type, seat_count, seats_used, subscription_status, trial_ends_at, stripe_subscription_id')
        .eq('id', currentUser.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setSeatCount(profileData.seat_count || 1);
      }

      setLoadingUser(false);
    }
    loadUser();

    // Load saved prefs from localStorage
    const savedReminder = localStorage.getItem('sr_reminder_enabled');
    const savedTime     = localStorage.getItem('sr_reminder_time');
    if (savedReminder !== null) setReminderEnabled(savedReminder === 'true');
    if (savedTime) setReminderTime(savedTime);
  }, []);

  function savePreferences() {
    localStorage.setItem('sr_reminder_enabled', reminderEnabled.toString());
    localStorage.setItem('sr_reminder_time', reminderTime);
    setPrefsSaved(true);
    setTimeout(() => setPrefsSaved(false), 2500);
  }

  async function handlePasswordReset() {
    if (!user?.email) return;
    setPasswordResetLoading(true);
    setPasswordResetError('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) {
        const msg = error.message?.toLowerCase().includes('rate limit')
          ? 'Too many reset emails sent recently. Please wait a few minutes and try again.'
          : error.message;
        setPasswordResetError(msg);
      } else {
        setPasswordResetSent(true);
      }
    } catch (err) {
      setPasswordResetError(err.message);
    } finally {
      setPasswordResetLoading(false);
    }
  }

  async function handleUpdateSeats() {
    setSeatLoading(true);
    setSeatError('');
    setSeatSuccess(false);
    try {
      const res = await fetch('/api/stripe/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_seats', seats: seatCount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update seats');
      setSeatSuccess(true);
      setProfile(prev => ({ ...prev, seat_count: seatCount }));
      setTimeout(() => setSeatSuccess(false), 3000);
    } catch (err) {
      setSeatError(err.message);
    } finally {
      setSeatLoading(false);
    }
  }

  async function handleCancel() {
    setCancelLoading(true);
    setCancelError('');
    try {
      const res = await fetch('/api/stripe/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel subscription');
      setCancelSuccess(true);
      setProfile(prev => ({ ...prev, subscription_status: 'canceling' }));
      setConfirmCancel(false);
    } catch (err) {
      setCancelError(err.message);
    } finally {
      setCancelLoading(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  if (!mounted) return null;

  // ── Helpers ──────────────────────────────────────────────────────────────
  function formatDate(iso) {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  function getPlanLabel(planType) {
    if (planType === 'team')       return 'Team Plan';
    if (planType === 'individual') return 'Individual Plan';
    return 'Free';
  }

  function getStatusLabel(status) {
    if (status === 'trialing')  return { label: '14-Day Trial',  color: '#17B8E0' };
    if (status === 'active')    return { label: 'Active',        color: '#10B981' };
    if (status === 'canceling') return { label: 'Canceling',     color: '#F59E0B' };
    if (status === 'canceled')  return { label: 'Canceled',      color: '#EF4444' };
    if (status === 'past_due')  return { label: 'Payment Due',   color: '#EF4444' };
    return { label: 'Unknown', color: 'rgba(255,255,255,0.35)' };
  }

  const sectionStyle = { marginBottom: '24px' };
  const labelStyle = {
    display: 'block', fontSize: '0.75rem', fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: '0.8px',
    color: 'rgba(255,255,255,0.35)', marginBottom: '6px',
  };
  const valueStyle = { fontSize: '1rem', color: 'rgba(255,255,255,0.85)' };
  const dividerStyle = { borderTop: '1px solid rgba(255,255,255,0.07)', margin: '32px 0' };

  const statusInfo = getStatusLabel(profile?.subscription_status);
  const trialEndFormatted = formatDate(profile?.trial_ends_at);
  const isTeam = profile?.plan_type === 'team';
  const isCanceling = profile?.subscription_status === 'canceling';
  const isCanceled = profile?.subscription_status === 'canceled';
  const hasSubscription = !!profile?.stripe_subscription_id;

  return (
    <>
      <div className="ambient-glow" />
      <nav className="glass-nav">
        <div className="nav-content">
          <Link href="/library" className="logo">
            <img src="/SummitSkills-Logo.png" alt="SummitSkills" className="logo-img" />
            Summit<span>Skills</span>
          </Link>
          <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="btn-primary small" onClick={() => router.push('/dashboard')}>Dashboard</button>
            <button className="btn-primary small" onClick={() => router.push('/library')}>Library</button>
            <button className="btn-primary small" onClick={handleSignOut}>Sign Out</button>
          </div>
        </div>
      </nav>

      <main className="container" style={{ maxWidth: '600px', paddingTop: '80px', paddingLeft: '16px', paddingRight: '16px' }}>

        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '6px' }}>Settings</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage your account and preferences</p>
        </div>

        {/* ── Account ──────────────────────────────────────────────────────── */}
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
              <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px', padding: '12px 16px', color: '#4ade80', fontSize: '0.875rem' }}>
                ✓ Reset link sent to <strong>{user?.email}</strong> — check your inbox.
              </div>
            ) : (
              <>
                {passwordResetError && (
                  <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px 16px', color: '#ef4444', fontSize: '0.875rem', marginBottom: '12px' }}>
                    {passwordResetError}
                  </div>
                )}
                <button className="btn-primary small" onClick={handlePasswordReset}
                  disabled={passwordResetLoading || loadingUser}
                  style={{ opacity: (passwordResetLoading || loadingUser) ? 0.6 : 1 }}>
                  {passwordResetLoading ? 'Sending...' : 'Send Password Reset Email'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Plan & Billing ───────────────────────────────────────────────── */}
        {!loadingUser && hasSubscription && (
          <div className="glass-panel" style={{ padding: '32px', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '24px', color: 'var(--brand-teal)' }}>
              Plan & Billing
            </h2>

            {/* Plan and status */}
            <div style={{ display: 'flex', gap: '32px', marginBottom: '24px' }}>
              <div>
                <span style={labelStyle}>Plan</span>
                <span style={valueStyle}>{getPlanLabel(profile?.plan_type)}</span>
              </div>
              <div>
                <span style={labelStyle}>Status</span>
                <span style={{ ...valueStyle, color: statusInfo.color, fontWeight: '700' }}>
                  {statusInfo.label}
                </span>
              </div>
              {trialEndFormatted && profile?.subscription_status === 'trialing' && (
                <div>
                  <span style={labelStyle}>Trial ends</span>
                  <span style={valueStyle}>{trialEndFormatted}</span>
                </div>
              )}
            </div>

            {/* Seats — team only */}
            {isTeam && (
              <>
                <div style={dividerStyle} />
                <div>
                  <span style={labelStyle}>Seats</span>
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.875rem', marginBottom: '16px' }}>
                    {profile?.seats_used ?? 0} of {profile?.seat_count ?? 1} seats used.
                    Adding seats will be prorated and billed immediately.
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <button
                      onClick={() => setSeatCount(c => Math.max(1, c - 1))}
                      disabled={seatCount <= (profile?.seats_used ?? 1)}
                      style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'white', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: seatCount <= (profile?.seats_used ?? 1) ? 0.3 : 1 }}>
                      −
                    </button>
                    <span style={{ fontSize: '1.2rem', fontWeight: '700', minWidth: '32px', textAlign: 'center' }}>
                      {seatCount}
                    </span>
                    <button
                      onClick={() => setSeatCount(c => c + 1)}
                      style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'white', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      +
                    </button>
                    <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.35)' }}>seats</span>
                  </div>
                  {seatCount !== profile?.seat_count && (
                    <button className="btn-primary small" onClick={handleUpdateSeats}
                      disabled={seatLoading}
                      style={{ opacity: seatLoading ? 0.6 : 1 }}>
                      {seatLoading ? 'Updating...' : `Update to ${seatCount} seats`}
                    </button>
                  )}
                  {seatSuccess && (
                    <p style={{ color: '#4ade80', fontSize: '0.875rem', marginTop: '8px' }}>✓ Seats updated successfully</p>
                  )}
                  {seatError && (
                    <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '8px' }}>{seatError}</p>
                  )}
                </div>
              </>
            )}

            {/* Cancellation */}
            {!isCanceling && !isCanceled && (
              <>
                <div style={dividerStyle} />
                <div>
                  <span style={labelStyle}>Cancel Subscription</span>
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.875rem', marginBottom: '16px' }}>
                    {profile?.subscription_status === 'trialing'
                      ? `Your access continues until your trial ends${trialEndFormatted ? ` on ${trialEndFormatted}` : ''}. You won't be charged.`
                      : 'Your access continues until the end of the current billing period.'}
                  </p>
                  {!confirmCancel ? (
                    <button
                      onClick={() => setConfirmCancel(true)}
                      style={{ background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', color: 'rgba(239,68,68,0.7)', borderRadius: '8px', padding: '8px 16px', fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.6)'; e.currentTarget.style.color = '#ef4444'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; e.currentTarget.style.color = 'rgba(239,68,68,0.7)'; }}>
                      Cancel Subscription
                    </button>
                  ) : (
                    <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '16px' }}>
                      <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', marginBottom: '12px' }}>
                        Are you sure? Your access continues until {trialEndFormatted ?? 'the end of your billing period'}.
                      </p>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={handleCancel} disabled={cancelLoading}
                          style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', borderRadius: '8px', padding: '8px 16px', fontSize: '0.875rem', cursor: 'pointer', fontWeight: '600', fontFamily: 'var(--font-sans)', opacity: cancelLoading ? 0.6 : 1 }}>
                          {cancelLoading ? 'Canceling...' : 'Yes, cancel'}
                        </button>
                        <button onClick={() => setConfirmCancel(false)}
                          style={{ background: 'rgba(23,184,224,0.08)', border: '1px solid rgba(23,184,224,0.3)', color: '#17B8E0', borderRadius: '8px', padding: '8px 16px', fontSize: '0.875rem', cursor: 'pointer', fontWeight: '600', fontFamily: 'var(--font-sans)' }}>
                          Keep my plan
                        </button>
                      </div>
                      {cancelError && (
                        <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '8px' }}>{cancelError}</p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Canceling state */}
            {isCanceling && (
              <>
                <div style={dividerStyle} />
                <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '10px', padding: '16px' }}>
                  <p style={{ fontSize: '0.875rem', color: 'rgba(245,158,11,0.9)', margin: 0 }}>
                    Your subscription is set to cancel. Access continues until {trialEndFormatted ?? 'the end of your billing period'}.
                  </p>
                </div>
              </>
            )}

            {cancelSuccess && (
              <div style={{ marginTop: '16px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px', padding: '12px 16px', color: '#4ade80', fontSize: '0.875rem' }}>
                ✓ Subscription canceled. Your access continues until {trialEndFormatted ?? 'the end of your billing period'}.
              </div>
            )}
          </div>
        )}

        {/* ── Daily Reminder ───────────────────────────────────────────────── */}
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
            <button onClick={() => setReminderEnabled(!reminderEnabled)}
              style={{ width: '48px', height: '26px', borderRadius: '13px', border: 'none', cursor: 'pointer', flexShrink: 0, position: 'relative', transition: 'background 0.2s', background: reminderEnabled ? 'var(--brand-teal)' : 'rgba(255,255,255,0.15)' }}
              aria-label="Toggle reminder">
              <span style={{ position: 'absolute', top: '3px', left: reminderEnabled ? '25px' : '3px', width: '20px', height: '20px', borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
            </button>
          </div>

          {reminderEnabled && (
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle} htmlFor="reminderTime">Preferred time</label>
              <input id="reminderTime" type="time" value={reminderTime}
                onChange={e => setReminderTime(e.target.value)}
                style={{ padding: '10px 14px', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '1rem', colorScheme: 'dark' }}
              />
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="btn-primary small" onClick={savePreferences}>Save Preferences</button>
            {prefsSaved && <span style={{ color: '#4ade80', fontSize: '0.875rem' }}>✓ Saved</span>}
          </div>
        </div>

        {/* ── Sign Out ─────────────────────────────────────────────────────── */}
        <div className="glass-panel" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '12px', color: 'rgba(255,255,255,0.6)' }}>
            Sign Out
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.35)', marginBottom: '20px' }}>
            You'll be returned to the home page.
          </p>
          <button className="btn-primary small" onClick={handleSignOut}>Sign Out</button>
        </div>

      </main>
    </>
  );
}
