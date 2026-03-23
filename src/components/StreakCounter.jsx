"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/app/supabaseClient';
import { useRouter } from 'next/navigation';
import GoalPickerModal from './GoalPickerModal';
import './StreakCounter.css';

export default function StreakCounter() {
  const router = useRouter();
  const [showStats, setShowStats] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [stats, setStats] = useState({
    currentStreak: 0,
    longestStreak: 0,
    booksCompleted: 0,
    totalDays: 0
  });
  const [continueUrl, setContinueUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch user stats
      const { data: userStats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (userStats) {
        setStats({
          currentStreak: userStats.current_streak || 0,
          longestStreak: userStats.longest_streak || 0,
          booksCompleted: userStats.books_completed || 0,
          totalDays: userStats.total_days_active || 0
        });
      }

      // Find the most recent book that's NOT completed
      const { data: allProgress } = await supabase
        .from('user_progress')
        .select('book_id, day_number, completed, updated_at')
        .order('updated_at', { ascending: false });

      if (allProgress && allProgress.length > 0) {
        const bookProgress = {};
        
        allProgress.forEach(p => {
          if (!bookProgress[p.book_id] || p.day_number > bookProgress[p.book_id].maxDay) {
            bookProgress[p.book_id] = {
              maxDay: p.day_number,
              updated_at: p.updated_at,
              book_id: p.book_id
            };
          }
        });

        let mostRecentBook = null;
        for (const bookId in bookProgress) {
          const book = bookProgress[bookId];
          if (book.maxDay < 7) {
            if (!mostRecentBook || book.updated_at > mostRecentBook.updated_at) {
              mostRecentBook = book;
            }
          }
        }

        if (!mostRecentBook && allProgress[0]) {
          mostRecentBook = {
            book_id: allProgress[0].book_id,
            maxDay: allProgress[0].day_number
          };
        }

        if (mostRecentBook) {
          const nextDay = mostRecentBook.maxDay < 7 ? mostRecentBook.maxDay + 1 : mostRecentBook.maxDay;
          setContinueUrl(`/summit/${mostRecentBook.book_id}/day/${nextDay}`);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  }

  function handleContinue() {
    if (continueUrl) {
      router.push(continueUrl);
      setShowStats(false);
    } else {
      router.push('/library');
      setShowStats(false);
    }
  }

  function handleOpenGoalModal() {
    setShowGoalModal(true);
    setShowStats(false);
  }

  if (loading) {
    return (
      <div className="streak-counter" onClick={() => setShowStats(!showStats)}>
        <span className="streak-flame">🔥</span>
        <span className="streak-number">...</span>
      </div>
    );
  }

  return (
    <>
      <div className="streak-counter" onClick={() => setShowStats(!showStats)}>
        <span className="streak-flame">🔥</span>
        <span className="streak-number">{stats.currentStreak} Day{stats.currentStreak !== 1 ? 's' : ''}</span>
      </div>

      {showStats && (
        <>
          <div className="stats-backdrop" onClick={() => setShowStats(false)} />
          <div className="stats-panel">
            <div className="stats-section">
              <h3>Your Goal</h3>
              <p className="stats-description">Set a goal to get personalized 7-day journeys.</p>
              <button 
                className="stats-btn stats-btn-primary" 
                onClick={handleOpenGoalModal}
                onMouseDown={(e) => e.stopPropagation()}
              >
                Set my goal
              </button>
            </div>

            <div className="stats-section">
              <h3>Your Progress</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-label">Current Streak</div>
                  <div className="stat-value">
                    <span className="streak-flame">🔥</span>
                    <span>{stats.currentStreak} Day{stats.currentStreak !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Longest Streak</div>
                  <div className="stat-value">{stats.longestStreak} Day{stats.longestStreak !== 1 ? 's' : ''}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Sprints Completed</div>
                  <div className="stat-value">{stats.booksCompleted}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Total Days Active</div>
                  <div className="stat-value">{stats.totalDays}</div>
                </div>
              </div>
              <button 
                className="stats-btn stats-btn-secondary" 
                onClick={handleContinue}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {continueUrl ? 'Keep going!' : 'Browse Library'}
              </button>
            </div>
          </div>
        </>
      )}

      <GoalPickerModal 
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        onGoalSelected={() => {
          setShowGoalModal(false);
          fetchStats(); // Refresh stats after goal is set
        }}
      />
    </>
  );
}