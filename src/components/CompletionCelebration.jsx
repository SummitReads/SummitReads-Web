"use client";
import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import './CompletionCelebration.css';

/**
 * Day complete modal.
 * Days 1–6 → next day preview.
 * Day 7 → sprint complete + pull into next skill (or library).
 */
export default function CompletionCelebration({
  isOpen,
  onClose,
  dayNum,
  bookTitle,
  nextDayTitle,
  nextDayPreview,
  nextDayUrl,
  /** Optional: { id, title } suggested next sprint after Day 7 */
  suggestedNext = null,
  lastWriteSnippet = null,
}) {
  const [step, setStep] = useState(1); // 1: celebration, 2: preview / sprint complete

  useEffect(() => {
    if (isOpen) setStep(1);
  }, [isOpen, dayNum]);

  useEffect(() => {
    if (isOpen && step === 1) {
      // Confetti only on Day 7 — the sprint completion milestone.
      if (dayNum === 7) {
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
      }

      const timer = setTimeout(() => setStep(2), 2500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, step, dayNum]);

  if (!isOpen) return null;

  const nextHref = suggestedNext?.id
    ? `/summit/${suggestedNext.id}/day/0`
    : '/library';

  return (
    <div className="celebration-overlay" onClick={(e) => e.target.className === 'celebration-overlay' && onClose()}>
      <div className="celebration-modal">

        {/* Step 1: Celebration */}
        {step === 1 && (
          <div className="celebration-step fade-in">
            <h2 className="celebration-title">
              {dayNum === 7 ? 'Summit complete.' : `Day ${dayNum} complete.`}
            </h2>
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

        {/* Step 2: Sprint Complete (Day 7) — open next loop */}
        {step === 2 && dayNum === 7 && (
          <div className="celebration-step fade-in">
            <div className="preview-badge">Sprint complete</div>
            <h2 className="celebration-title">You finished the Summit.</h2>
            <p className="celebration-subtitle">
              Seven days of real practice on {bookTitle}.
            </p>
            {lastWriteSnippet && (
              <p className="next-day-preview" style={{ fontStyle: 'italic', opacity: 0.9 }}>
                “{lastWriteSnippet}”
              </p>
            )}
            {!lastWriteSnippet && (
              <p className="completion-message">
                Close one loop. Open the next skill.
              </p>
            )}

            <div className="button-group" style={{ flexDirection: 'column', gap: 10, width: '100%' }}>
              {suggestedNext?.title && (
                <button
                  type="button"
                  className="btn-primary-celebration"
                  style={{ width: '100%' }}
                  onClick={() => {
                    onClose();
                    window.location.href = nextHref;
                  }}
                >
                  Next skill: {suggestedNext.title} →
                </button>
              )}
              <button
                type="button"
                className={suggestedNext?.title ? 'btn-ghost' : 'btn-primary-celebration'}
                style={{ width: '100%' }}
                onClick={() => {
                  onClose();
                  window.location.href = '/library';
                }}
              >
                {suggestedNext?.title ? 'Browse all sprints' : 'Explore more sprints →'}
              </button>
              <button
                type="button"
                className="btn-ghost"
                style={{ width: '100%' }}
                onClick={() => {
                  onClose();
                  window.location.href = '/dashboard';
                }}
              >
                Back to dashboard
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
