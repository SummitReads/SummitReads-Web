"use client";
import { useState } from 'react';

const GOALS = [
  { key: 'habits', label: 'Build better habits' },
  { key: 'focus', label: 'Improve focus & clarity' },
  { key: 'confidence', label: 'Build confidence' },
  { key: 'career', label: 'Career advancement' },
  { key: 'productivity', label: 'Boost productivity' },
  { key: 'finances', label: 'Financial wellness' },
  { key: 'communication', label: 'Improve communication' },
  { key: 'energy', label: 'Increase energy' }
];

const MINUTES_OPTIONS = [5, 10, 20];

export default function GoalPickerModal({ open, onClose, initialValues, onSave }) {
  console.log('GoalPickerModal render - open:', open, 'initialValues:', initialValues);

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    goal_key: initialValues?.goal_key || '',
    goal_label: initialValues?.goal_label || '',
    minutes_per_day: initialValues?.minutes_per_day || 10,
    reminder_time: initialValues?.reminder_time || '20:00',
    timezone: initialValues?.timezone || 'America/Denver'
  });

  if (!open) {
    console.log('Modal not open, returning null');
    return null;
  }

  console.log('Modal is open, rendering...');

  const handleGoalSelect = (goal) => {
    console.log('Goal selected:', goal);
    setFormData({ ...formData, goal_key: goal.key, goal_label: goal.label });
    setStep(2);
  };

  const handleMinutesSelect = (minutes) => {
    console.log('Minutes selected:', minutes);
    setFormData({ ...formData, minutes_per_day: minutes });
    setStep(3);
  };

  const handleTimeChange = (e) => {
    setFormData({ ...formData, reminder_time: e.target.value });
  };

  const handleSave = () => {
    console.log('Saving goal:', formData);
    onSave(formData);
    handleClose();
  };

  const handleClose = () => {
    console.log('Closing modal');
    setStep(1);
    onClose();
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleBackdropClick = (e) => {
    // Only close if clicking the backdrop, not the modal content
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'rgba(15, 23, 42, 0.98)',
          border: '1px solid rgba(25, 190, 227, 0.3)',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          animation: 'modalSlideIn 0.3s ease-out'
        }}
      >
        <style jsx>{`
          @keyframes modalSlideIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: 'white' }}>
              {initialValues ? 'Update Your Goal' : 'Set Your Goal'}
            </h2>
            <button
              onClick={handleClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '1.5rem',
                cursor: 'pointer',
                padding: '4px',
                lineHeight: 1
              }}
            >
              ×
            </button>
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Step {step} of 3
          </p>
        </div>

        {/* Progress Bar */}
        <div style={{ 
          height: '4px', 
          background: 'rgba(255,255,255,0.1)', 
          borderRadius: '2px',
          marginBottom: '32px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            background: 'var(--brand-teal)',
            width: `${(step / 3) * 100}%`,
            transition: 'width 0.3s ease'
          }} />
        </div>

        {/* Step 1: Choose Goal */}
        {step === 1 && (
          <div>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1.125rem', color: 'white' }}>
              What's your main focus?
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {GOALS.map((goal) => (
                <button
                  key={goal.key}
                  onClick={() => handleGoalSelect(goal)}
                  style={{
                    padding: '16px 20px',
                    background: formData.goal_key === goal.key 
                      ? 'rgba(25, 190, 227, 0.2)' 
                      : 'rgba(255,255,255,0.05)',
                    border: formData.goal_key === goal.key
                      ? '2px solid var(--brand-teal)'
                      : '2px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textAlign: 'left',
                    backdropFilter: 'blur(8px)'
                  }}
                  onMouseEnter={(e) => {
                    if (formData.goal_key !== goal.key) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                      e.currentTarget.style.borderColor = 'rgba(25, 190, 227, 0.4)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(25, 190, 227, 0.2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (formData.goal_key !== goal.key) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  {goal.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Choose Minutes */}
        {step === 2 && (
          <div>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1.125rem', color: 'white' }}>
              How many minutes per day?
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {MINUTES_OPTIONS.map((minutes) => (
                <button
                  key={minutes}
                  onClick={() => handleMinutesSelect(minutes)}
                  style={{
                    padding: '20px',
                    background: formData.minutes_per_day === minutes 
                      ? 'rgba(25, 190, 227, 0.2)' 
                      : 'rgba(255,255,255,0.05)',
                    border: formData.minutes_per_day === minutes
                      ? '2px solid var(--brand-teal)'
                      : '2px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '1.125rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textAlign: 'center',
                    backdropFilter: 'blur(8px)'
                  }}
                  onMouseEnter={(e) => {
                    if (formData.minutes_per_day !== minutes) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                      e.currentTarget.style.borderColor = 'rgba(25, 190, 227, 0.4)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(25, 190, 227, 0.2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (formData.minutes_per_day !== minutes) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  {minutes} minutes
                </button>
              ))}
            </div>
            <button
              onClick={handleBack}
              style={{
                marginTop: '20px',
                padding: '12px',
                width: '100%',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: 'var(--text-muted)',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(8px)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              ← Back
            </button>
          </div>
        )}

        {/* Step 3: Set Reminder Time */}
        {step === 3 && (
          <div>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1.125rem', color: 'white' }}>
              When should we remind you?
            </h3>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '0.875rem', 
                color: 'var(--text-muted)',
                fontWeight: '500'
              }}>
                Daily reminder time
              </label>
              <input
                type="time"
                value={formData.reminder_time}
                onChange={handleTimeChange}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '2px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--brand-teal)';
                  e.currentTarget.style.background = 'rgba(25, 190, 227, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }}
              />
            </div>

            {/* Summary */}
            <div style={{ 
              padding: '16px',
              background: 'rgba(25, 190, 227, 0.1)',
              border: '1px solid rgba(25, 190, 227, 0.2)',
              borderRadius: '12px',
              marginBottom: '24px'
            }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
                Your Goal
              </p>
              <p style={{ margin: '0 0 12px 0', fontSize: '1rem', color: 'white', fontWeight: '600' }}>
                {formData.goal_label}
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{
                  padding: '6px 12px',
                  background: 'rgba(25, 190, 227, 0.2)',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  color: 'var(--brand-teal)',
                  fontWeight: '600'
                }}>
                  {formData.minutes_per_day} min/day
                </span>
                <span style={{
                  padding: '6px 12px',
                  background: 'rgba(25, 190, 227, 0.2)',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  color: 'var(--brand-teal)',
                  fontWeight: '600'
                }}>
                  {new Date(`2000-01-01T${formData.reminder_time}`).toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                  })} reminder
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleBack}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: 'var(--text-muted)',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(8px)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.borderColor = 'rgba(25, 190, 227, 0.4)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(25, 190, 227, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.color = 'var(--text-muted)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                ← Back
              </button>
              <button
                onClick={handleSave}
                style={{
                  flex: 2,
                  padding: '14px',
                  background: 'linear-gradient(135deg, rgba(25, 190, 227, 0.9), rgba(28, 168, 201, 0.9))',
                  border: '1px solid rgba(25, 190, 227, 0.3)',
                  borderRadius: '8px',
                  color: 'rgba(15, 23, 42, 0.9)',
                  fontSize: '1rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 4px 12px rgba(25, 190, 227, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(28, 168, 201, 1), rgba(25, 190, 227, 1))';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(25, 190, 227, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(25, 190, 227, 0.9), rgba(28, 168, 201, 0.9))';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(25, 190, 227, 0.2)';
                }}
              >
                {initialValues ? 'Update Goal' : 'Set Goal & View Journeys'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
