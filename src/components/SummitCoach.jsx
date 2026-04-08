"use client";
import React, { useState, useRef, useEffect, useMemo } from 'react';

const INITIAL_GREETING = `I'm your Summit Coach for this journey. I'm here to help you think through today's insight, work through the mission, or just talk about what's coming up for you. What's on your mind?`;

function getPrimaryQuickActions(dayNum) {
  const day = Number(dayNum) || 1;

  if (day <= 2) {
    return [
      {
        label: 'Getting started',
        prompt: "Help me get started with today's stage. What should I pay attention to first?"
      },
      {
        label: 'What does this mean?',
        prompt: "Help me understand what today's idea looks like in real life."
      },
      {
        label: 'Help with milepost',
        prompt: "Help me with today's milepost. I'm not sure what to write yet."
      },
      {
        label: 'Explore further',
        action: 'toggleExplore'
      }
    ];
  }

  if (day <= 4) {
    return [
      {
        label: 'Getting started',
        prompt: "Help me get started with today's stage."
      },
      {
        label: 'Help with milepost',
        prompt: "Help me with today's milepost. I'm not sure what to write yet."
      },
      {
        label: 'Help with mission',
        prompt: "Help me with today's mission and make it feel more doable."
      },
      {
        label: "I'm stuck",
        prompt: "I'm stuck on today's stage. Help me figure out what's getting in the way."
      },
      {
        label: 'Explore further',
        action: 'toggleExplore'
      }
    ];
  }

  if (day <= 6) {
    return [
      {
        label: 'Help with mission',
        prompt: "Help me sharpen today's mission so it feels more realistic."
      },
      {
        label: 'I tried this',
        prompt: "I tried this and it felt a little off. Help me make sense of it."
      },
      {
        label: "What should I notice?",
        prompt: "What should I be noticing right now as I work on this stage?"
      },
      {
        label: 'Explore further',
        action: 'toggleExplore'
      }
    ];
  }

  return [
    {
      label: 'Reflect on the sprint',
      prompt: 'Help me reflect on what changed for me during this sprint.'
    },
    {
      label: 'What really changed?',
      prompt: 'Help me name what genuinely changed for me in this sprint.'
    },
    {
      label: 'Carry it forward',
      prompt: 'Help me carry this forward after the sprint ends.'
    },
    {
      label: 'Explore further',
      action: 'toggleExplore'
    }
  ];
}

function getExploreQuickActions(dayNum) {
  const day = Number(dayNum) || 1;

  const common = [
    {
      label: 'Apply this at work',
      prompt: 'Help me apply this at work in a real situation.'
    },
    {
      label: 'Turn this into one sentence',
      prompt: 'Help me turn this into one clear sentence I can actually use.'
    },
    {
      label: 'Make this smaller',
      prompt: 'Help me make this feel smaller and easier to do.'
    }
  ];

  if (day <= 2) {
    return [
      ...common,
      {
        label: 'Where does this show up?',
        prompt: 'Help me notice where this shows up in my real life.'
      }
    ];
  }

  if (day <= 4) {
    return [
      ...common,
      {
        label: 'Help me write it',
        prompt: "I'm not sure what to write. Help me draft my response for today's milepost."
      }
    ];
  }

  if (day <= 6) {
    return [
      ...common,
      {
        label: 'Adjust what I did',
        prompt: 'Help me adjust what I tried so it works better next time.'
      }
    ];
  }

  return [
    ...common,
    {
      label: 'Help me reflect',
      prompt: 'Help me reflect on the most important shift from this sprint.'
    }
  ];
}

function QuickActionChips({ title, actions, onAction, onClose }) {
  return (
    <div
      style={{
        marginBottom: '14px',
        padding: '14px',
        borderRadius: '14px',
        background: 'rgba(30, 41, 59, 0.45)',
        border: '1px solid rgba(255,255,255,0.06)'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          marginBottom: '10px'
        }}
      >
        <div style={{ color: 'white', fontSize: '0.82rem', fontWeight: '600' }}>{title}</div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.75rem',
              padding: 0
            }}
          >
            Hide
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => onAction(action)}
            style={{
              padding: '9px 12px',
              borderRadius: '999px',
              border: '1px solid rgba(25, 190, 227, 0.28)',
              background: 'rgba(15, 23, 42, 0.72)',
              color: 'var(--text-main)',
              cursor: 'pointer',
              fontSize: '0.78rem',
              lineHeight: 1.2,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(25, 190, 227, 0.5)';
              e.currentTarget.style.background = 'rgba(25, 190, 227, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(25, 190, 227, 0.28)';
              e.currentTarget.style.background = 'rgba(15, 23, 42, 0.72)';
            }}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SummitCoach({ bookId, dayNum, userId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showExplore, setShowExplore] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const primaryQuickActions = useMemo(() => getPrimaryQuickActions(dayNum), [dayNum]);
  const exploreQuickActions = useMemo(() => getExploreQuickActions(dayNum), [dayNum]);
  const hasUserMessages = messages.some((msg) => msg.role === 'user');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, showExplore]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: INITIAL_GREETING,
        },
      ]);
    }
  }, [isOpen, messages.length]);

  async function sendPrompt(promptText) {
    const trimmedInput = promptText.trim();
    if (!trimmedInput || loading) return;

    const userMsg = { role: 'user', content: trimmedInput };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);
    setShowExplore(false);

    try {
      const recentHistory = messages
        .filter((msg) => msg?.content && msg.content !== INITIAL_GREETING)
        .slice(-4);

      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId,
          dayNum,
          userId,
          userMessage: trimmedInput,
          conversationHistory: recentHistory,
        }),
      });

      if (!res.ok) {
        let errData = null;
        try {
          errData = await res.json();
        } catch (parseError) {
          errData = null;
        }
        throw new Error(errData?.error || 'Failed to reach coach');
      }

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data?.message || "What feels most true for you about today's stage?",
        },
      ]);
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    await sendPrompt(input);
  }

  function handleQuickAction(action) {
    if (action.action === 'toggleExplore') {
      setShowExplore((prev) => !prev);
      return;
    }

    if (action.prompt) {
      sendPrompt(action.prompt);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '32px',
          right: '32px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'var(--brand-teal)',
          border: 'none',
          color: '#0F172A',
          cursor: 'pointer',
          display: isOpen ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 24px rgba(25, 190, 227, 0.4)',
          transition: 'all 0.3s ease',
          zIndex: 1000,
          backdropFilter: 'blur(12px)',
        }}
        aria-label="Open Summit Coach"
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      {!isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '100px',
            right: '24px',
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(25, 190, 227, 0.3)',
            borderRadius: '8px',
            padding: '6px 12px',
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
            fontWeight: '600',
            letterSpacing: '0.5px',
            zIndex: 999,
            backdropFilter: 'blur(8px)',
            pointerEvents: 'none',
            opacity: 0.8,
          }}
        >
          Summit Coach
        </div>
      )}

      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '380px',
            maxWidth: 'calc(100vw - 48px)',
            height: '560px',
            maxHeight: '75vh',
            borderRadius: '20px',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(25, 190, 227, 0.25)',
            boxShadow:
              '0 24px 48px rgba(0, 0, 0, 0.5), 0 0 40px rgba(25, 190, 227, 0.1)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 999,
            overflow: 'hidden',
            animation: 'coachSlideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <div
            style={{
              padding: '20px 24px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'rgba(30, 41, 59, 0.4)',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(25, 190, 227, 0.15)',
                border: '1px solid rgba(25, 190, 227, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--brand-teal)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '0.95rem',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Summit Coach
              </div>
              <div
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.75rem',
                }}
              >
                Day {dayNum} of 7
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
              }}
              aria-label="Close coach"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(25, 190, 227, 0.3) transparent',
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  animation: 'coachFadeIn 0.25s ease',
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '12px 16px',
                    borderRadius:
                      msg.role === 'user'
                        ? '18px 18px 4px 18px'
                        : '18px 18px 18px 4px',
                    background:
                      msg.role === 'user'
                        ? 'var(--brand-teal)'
                        : 'rgba(30, 41, 59, 0.7)',
                    border:
                      msg.role === 'assistant'
                        ? '1px solid rgba(255,255,255,0.06)'
                        : 'none',
                    color: msg.role === 'user' ? '#0F172A' : 'var(--text-main)',
                    fontSize: '0.9rem',
                    lineHeight: '1.55',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: msg.role === 'user' ? '600' : '400',
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {!hasUserMessages && (
              <QuickActionChips
                title="Quick ways to start"
                actions={primaryQuickActions}
                onAction={handleQuickAction}
              />
            )}

            {!hasUserMessages && showExplore && (
              <QuickActionChips
                title="Explore further"
                actions={exploreQuickActions}
                onAction={handleQuickAction}
                onClose={() => setShowExplore(false)}
              />
            )}

            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div
                  style={{
                    padding: '12px 18px',
                    borderRadius: '18px 18px 18px 4px',
                    background: 'rgba(30, 41, 59, 0.7)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    gap: '6px',
                    alignItems: 'center',
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: 'var(--brand-teal)',
                        opacity: 0.4,
                        animation: `coachPulse 1.2s ease ${i * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#f87171',
                  fontSize: '0.8rem',
                  textAlign: 'center',
                }}
              >
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div
            style={{
              padding: '16px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(15, 23, 42, 0.6)',
            }}
          >
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask your coach..."
                rows={1}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '0.9rem',
                  fontFamily: 'var(--font-sans)',
                  outline: 'none',
                  resize: 'none',
                  minHeight: '44px',
                  maxHeight: '100px',
                  lineHeight: '1.5',
                  transition: 'border-color 0.2s',
                  borderColor: input
                    ? 'rgba(25, 190, 227, 0.3)'
                    : 'rgba(255,255,255,0.1)',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(25, 190, 227, 0.5)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = input
                    ? 'rgba(25, 190, 227, 0.3)'
                    : 'rgba(255,255,255,0.1)';
                }}
              />

              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background:
                    input.trim() && !loading
                      ? 'var(--brand-teal)'
                      : 'rgba(25, 190, 227, 0.2)',
                  border: 'none',
                  color:
                    input.trim() && !loading
                      ? '#0F172A'
                      : 'rgba(25, 190, 227, 0.5)',
                  cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  flexShrink: 0,
                }}
                aria-label="Send message"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>

            <div
              style={{
                marginTop: '8px',
                color: 'var(--text-muted)',
                fontSize: '0.7rem',
                textAlign: 'center',
                opacity: 0.6,
              }}
            >
              Press Enter to send
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes coachSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes coachFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes coachPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </>
  );
}
