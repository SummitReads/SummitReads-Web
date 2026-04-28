"use client";
import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import './CompletionCelebration.css';

export default function CompletionCelebration({
  isOpen,
  onClose,
  dayNum,
  bookTitle,
  nextDayTitle,
  nextDayPreview,
  nextDayUrl,
}) {
  const [step, setStep] = useState(1); // 1: celebration, 2: preview / sprint complete

  useEffect(() => {
    if (isOpen && step === 1) {
      const duration = 2000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#00D9FF', '#0EA5E9', '#06B6D4']
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#00D9FF', '#0EA5E9', '#06B6D4']
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();

      const timer = setTimeout(() => setStep(2), 2500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, step]);

  if (!isOpen) return null;

  return (
    <div className="celebration-overlay" onClick={(e) => e.target.className === 'celebration-overlay' && onClose()}>
      <div className="celebration-modal">

        {/* Step 1: Celebration */}
        {step === 1 && (
          <div className="celebration-step fade-in">
            <h2 className="celebration-title">Day {dayNum} complete.</h2>
            <p className="celebration-book">{bookTitle}</p>
            <div className="progress-circle">
              <svg viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00D9FF" />
                    <stop offset="100%" stopColor="#0EA5E9" />
                  </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="45" className="progress-bg" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  className="progress-fill"
                  style={{
                    strokeDasharray: `${(dayNum / 7) * 283} 283`,
                    animation: 'progressFill 1s ease-out forwards'
                  }}
                />
              </svg>
              <div className="progress-text">{Math.round((dayNum / 7) * 100)}%</div>
            </div>
          </div>
        )}

        {/* Step 2: Next Day Preview (Days 1-6) */}
        {step === 2 && dayNum < 7 && (
          <div className="celebration-step fade-in">
            <div className="preview-badge">Up Next</div>
            <h2 className="celebration-title">Day {dayNum + 1}</h2>
            <h3 className="next-day-title">{nextDayTitle}</h3>
            <p className="next-day-preview">{nextDayPreview}</p>

            <div style={{
              background: 'rgba(0, 217, 255, 0.05)',
              border: '1px solid rgba(0, 217, 255, 0.2)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px',
              textAlign: 'left'
            }}>
              <p style={{ color: 'rgba(255, 255, 255, 0.9)', margin: 0, fontSize: '0.95rem', lineHeight: '1.5' }}>
                Day {dayNum + 1} is ready when you are. Complete today's mission to unlock it.
              </p>
            </div>

            <div className="button-group">
              <button onClick={onClose} className="btn-ghost">
                Back to Library
              </button>
              <button
                onClick={() => { onClose(); window.location.href = nextDayUrl; }}
                className="btn-primary-celebration"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Sprint Complete (Day 7) */}
        {step === 2 && dayNum === 7 && (
          <div className="celebration-step fade-in">
            <div className="progress-circle">
              <svg viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00D9FF" />
                    <stop offset="100%" stopColor="#0EA5E9" />
                  </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="45" className="progress-bg" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  className="progress-fill"
                  style={{
                    strokeDasharray: `283 283`,
                    animation: 'progressFill 1s ease-out forwards'
                  }}
                />
              </svg>
              <div className="progress-text">100%</div>
            </div>
            <h2 className="celebration-title">Sprint Complete.</h2>
            <p className="celebration-subtitle">
              You've completed all 7 days of {bookTitle}.
            </p>
            <p className="completion-message">
              Seven days, done.
            </p>
            <button onClick={onClose} className="btn-primary-celebration">
              Explore More Sprints
            </button>
          </div>
        )}

      </div>
    </div>
  );
}