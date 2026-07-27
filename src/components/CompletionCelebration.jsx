"use client";
import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { sprintDayJobLine } from '@/lib/sprintDisplay';
import './CompletionCelebration.css';

/**
 * Day complete modal.
 * Days 1–6 → plant tomorrow (open loop) + dual CTAs.
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
  /** Optional personal situation thread for tomorrow plant */
  situationSnippet = null,
  /** Optional last "what I did" line */
  lastDidSnippet = null,
}) {
  const [step, setStep] = useState(1); // 1: celebration, 2: preview / sprint complete

  useEffect(() => {
    if (isOpen) setStep(1);
  }, [isOpen, dayNum]);

  useEffect(() => {
    if (isOpen && step === 1) {
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

      const timer = setTimeout(() => setStep(2), 2200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, step, dayNum]);

  if (!isOpen) return null;

  const nextHref = suggestedNext?.id
    ? `/summit/${suggestedNext.id}/day/0`
    : '/library';

  const tomorrowNum = dayNum + 1;
  const jobLine = sprintDayJobLine(tomorrowNum, nextDayTitle);
  const hasThread = !!(situationSnippet || lastDidSnippet);

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

        {/* Step 2: Tomorrow is ready (Days 1-6) — plant the open loop */}
        {step === 2 && dayNum < 7 && (
            <div className="celebration-step fade-in">
              <div className="preview-badge">Tomorrow is ready</div>
              <h2 className="celebration-title" style={{ fontSize: '1.35rem' }}>
                Day {tomorrowNum}{nextDayTitle ? ` · ${nextDayTitle}` : ''}
              </h2>
              <p className="next-day-preview" style={{ fontWeight: 500, opacity: 0.95 }}>
                {jobLine}
              </p>

              {hasThread && (
                <div
                  style={{
                    textAlign: 'left',
                    width: '100%',
                    margin: '8px 0 4px',
                    padding: '12px 14px',
                    borderRadius: 10,
                    background: 'rgba(23,184,224,0.08)',
                    border: '1px solid rgba(23,184,224,0.2)',
                    fontSize: '0.85rem',
                    lineHeight: 1.5,
                    color: 'rgba(238,242,247,0.85)',
                  }}
                >
                  {situationSnippet && (
                    <p style={{ margin: '0 0 6px' }}>
                      <span style={{ color: 'rgba(23,184,224,0.9)' }}>Working with · </span>
                      {situationSnippet}
                    </p>
                  )}
                  {lastDidSnippet && (
                    <p style={{ margin: 0 }}>
                      <span style={{ color: 'rgba(23,184,224,0.9)' }}>You just · </span>
                      {lastDidSnippet}
                    </p>
                  )}
                </div>
              )}

              {!hasThread && nextDayPreview && (
                <p className="next-day-preview">{nextDayPreview}</p>
              )}

              <p
                style={{
                  margin: '12px 0 0',
                  fontSize: '0.8rem',
                  color: 'rgba(238,242,247,0.45)',
                }}
              >
                About 15 minutes on real work. Your thread stays open.
              </p>

              <div className="button-group" style={{ flexDirection: 'column', gap: 10, width: '100%', marginTop: 16 }}>
                <button
                  onClick={() => { onClose(); window.location.href = nextDayUrl; }}
                  className="btn-primary-celebration"
                  style={{ width: '100%' }}
                >
                  Start Day {tomorrowNum} now →
                </button>
                <button
                  onClick={() => {
                    onClose();
                    window.location.href = '/dashboard';
                  }}
                  className="btn-ghost"
                  style={{ width: '100%' }}
                >
                  Done for today — I&apos;ll pick it up tomorrow
                </button>
              </div>
            </div>
        )}

        {/* Step 2: Sprint Complete (Day 7) */}
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
                  window.location.href = '/dashboard';
                }}
              >
                {suggestedNext?.title ? 'Back to dashboard' : 'Back to dashboard →'}
              </button>
              <button
                type="button"
                className="btn-ghost"
                style={{ width: '100%' }}
                onClick={() => {
                  onClose();
                  window.location.href = '/library';
                }}
              >
                Browse more sprints
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
