"use client";
import GoalAnalytics from '@/components/GoalAnalytics';

export default function AnalyticsPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--background)',
      padding: '40px 20px'
    }}>
      <GoalAnalytics />
    </div>
  );
}
