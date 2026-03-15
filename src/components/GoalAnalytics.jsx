"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/app/supabaseClient';

export default function GoalAnalytics({ compact = false }) {
  const [stats, setStats] = useState(null);
  const [weeklyProgress, setWeeklyProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGoalAnalytics();
  }, []);

  async function fetchGoalAnalytics() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch comprehensive stats using the SQL function
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_goal_stats', { p_user_id: user.id });

      if (statsError) throw statsError;

      // Fetch weekly progress
      const { data: weeklyData, error: weeklyError } = await supabase
        .rpc('get_weekly_goal_progress', { p_user_id: user.id });

      if (weeklyError) throw weeklyError;

      setStats(statsData?.[0] || null);
      setWeeklyProgress(weeklyData || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching goal analytics:', err);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading analytics...
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        No goal data available. Set a goal to start tracking!
      </div>
    );
  }

  if (compact) {
    return <CompactView stats={stats} />;
  }

  return <FullView stats={stats} weeklyProgress={weeklyProgress} />;
}

// Compact view for dropdown/small spaces
function CompactView({ stats }) {
  const getStatusColor = () => {
    if (stats.on_track) return 'var(--brand-teal)';
    if (stats.current_streak > 0) return '#fbbf24'; // amber
    return 'var(--text-muted)';
  };

  const getStatusText = () => {
    if (stats.on_track) return '✓ On track';
    if (stats.current_streak > 0) return '⚠ Complete today';
    return '○ Start today';
  };

  return (
    <div style={{
      padding: '16px',
      background: 'rgba(255,255,255,0.02)',
      borderRadius: '8px',
      border: '1px solid rgba(255,255,255,0.05)'
    }}>
      {/* Status */}
      <div style={{ marginBottom: '12px' }}>
        <span style={{
          fontSize: '0.875rem',
          color: getStatusColor(),
          fontWeight: '600'
        }}>
          {getStatusText()}
        </span>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Goal Streak
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'white' }}>
            {stats.current_streak} 🔥
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Completion Rate
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'white' }}>
            {stats.completion_rate}%
          </div>
        </div>
      </div>
    </div>
  );
}

// Full analytics dashboard view
function FullView({ stats, weeklyProgress }) {
  const GOAL_LABELS = {
    'habits': 'Build better habits',
    'focus': 'Improve focus & clarity',
    'confidence': 'Build confidence',
    'discipline': 'Strengthen discipline',
    'growth': 'Personal growth',
    'mindfulness': 'Practice mindfulness'
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'white', marginBottom: '8px' }}>
          Goal Analytics
        </h1>
        <p style={{ fontSize: '1.125rem', color: 'var(--text-muted)', margin: 0 }}>
          {GOAL_LABELS[stats.goal_key] || stats.goal_key}
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <MetricCard
          label="Current Streak"
          value={stats.current_streak}
          unit="days"
          icon="🔥"
          color="var(--brand-teal)"
        />
        <MetricCard
          label="Longest Streak"
          value={stats.longest_streak}
          unit="days"
          icon="⭐"
          color="#fbbf24"
        />
        <MetricCard
          label="Total Days"
          value={stats.total_days}
          unit="completed"
          icon="✓"
          color="#8b5cf6"
        />
        <MetricCard
          label="Books Completed"
          value={stats.books_completed}
          unit="toward goal"
          icon="📚"
          color="#ec4899"
        />
      </div>

      {/* Progress Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {/* Completion Rate */}
        <div style={{
          padding: '24px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: '600', color: 'white' }}>
            Completion Rate
          </h3>
          <div style={{ marginBottom: '12px' }}>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              color: stats.completion_rate >= 70 ? 'var(--brand-teal)' : stats.completion_rate >= 40 ? '#fbbf24' : 'var(--text-muted)'
            }}>
              {stats.completion_rate}%
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {stats.total_days} of {stats.days_since_set} days since goal set
            </p>
          </div>
          <div style={{
            height: '8px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${Math.min(stats.completion_rate, 100)}%`,
              background: `linear-gradient(90deg, var(--brand-teal), #1ca8c9)`,
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{
          padding: '24px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: '600', color: 'white' }}>
            Recent Activity
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Last 7 days</span>
              <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'white' }}>
                {stats.last_7_days}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Last 30 days</span>
              <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'white' }}>
                {stats.last_30_days}
              </span>
            </div>
            <div style={{
              marginTop: '8px',
              padding: '8px 12px',
              background: stats.on_track ? 'rgba(25, 190, 227, 0.1)' : 'rgba(251, 191, 36, 0.1)',
              borderRadius: '6px'
            }}>
              <p style={{
                margin: 0,
                fontSize: '0.875rem',
                color: stats.on_track ? 'var(--brand-teal)' : '#fbbf24',
                fontWeight: '600',
                textAlign: 'center'
              }}>
                {stats.on_track ? '✓ On track today' : '⚠ Complete today to maintain streak'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Progress Chart */}
      <div style={{
        padding: '24px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px'
      }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', fontWeight: '600', color: 'white' }}>
          8-Week Progress
        </h3>
        <WeeklyChart data={weeklyProgress} />
      </div>

      {/* Insights & Tips */}
      <div style={{
        marginTop: '32px',
        padding: '20px',
        background: 'rgba(25, 190, 227, 0.05)',
        border: '1px solid rgba(25, 190, 227, 0.2)',
        borderRadius: '12px'
      }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '0.875rem', fontWeight: '700', color: 'var(--brand-teal)' }}>
          💡 INSIGHTS
        </h4>
        <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.6' }}>
          {stats.completion_rate >= 80 && (
            <li>You're crushing it! Your {stats.completion_rate}% completion rate is exceptional.</li>
          )}
          {stats.current_streak >= 7 && (
            <li>Your {stats.current_streak}-day streak shows real commitment. Keep it going!</li>
          )}
          {stats.current_streak < 3 && stats.longest_streak >= 7 && (
            <li>You've done a {stats.longest_streak}-day streak before. You can do it again!</li>
          )}
          {stats.completion_rate < 50 && (
            <li>Try setting a reminder for the same time each day to build consistency.</li>
          )}
          {stats.books_completed === 0 && stats.total_days >= 7 && (
            <li>You're making progress! {7 - (stats.total_days % 7)} more days to complete your first book.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({ label, value, unit, icon, color }) {
  return (
    <div style={{
      padding: '20px',
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '12px',
      transition: 'all 0.3s ease'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = color;
      e.currentTarget.style.transform = 'translateY(-2px)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
      e.currentTarget.style.transform = 'translateY(0)';
    }}
    >
      <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '2rem', fontWeight: '700', color: color, marginBottom: '4px' }}>
        {value}
      </div>
      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        {unit}
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: '600' }}>
        {label}
      </div>
    </div>
  );
}

// Weekly Chart Component
function WeeklyChart({ data }) {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map(w => Math.max(w.completions_count, w.goal_target)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {data.map((week, idx) => {
        const weekDate = new Date(week.week_start);
        const weekLabel = weekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const percentage = week.percentage;
        const isComplete = percentage >= 100;
        const isPartial = percentage >= 50 && percentage < 100;

        return (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Week label */}
            <div style={{ width: '80px', fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: '500' }}>
              {weekLabel}
            </div>

            {/* Progress bar */}
            <div style={{ flex: 1, position: 'relative' }}>
              <div style={{
                height: '32px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '6px',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(percentage, 100)}%`,
                  background: isComplete 
                    ? 'linear-gradient(90deg, var(--brand-teal), #1ca8c9)'
                    : isPartial
                    ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
                    : 'linear-gradient(90deg, #6b7280, #4b5563)',
                  transition: 'width 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingRight: '8px'
                }} />
              </div>
              {/* Counts */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '8px',
                transform: 'translateY(-50%)',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: 'white',
                pointerEvents: 'none'
              }}>
                {week.completions_count} / {week.goal_target}
              </div>
            </div>

            {/* Percentage */}
            <div style={{ width: '60px', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600', color: 'white' }}>
              {percentage}%
            </div>
          </div>
        );
      })}
    </div>
  );
}
