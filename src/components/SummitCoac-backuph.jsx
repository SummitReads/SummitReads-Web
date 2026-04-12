"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';

// ── Constants ─────────────────────────────────────────────────────────────────

const INITIAL_GREETING = `I'm your Summit Coach for this journey. I'm here to help you think through today's insight, work through the mission, or just talk about what's coming up for you. What's on your mind?`;

const EXPLORE_GREETING = `You're in the Explore Further section. Ask me anything about what you just read — how it applies to your situation, what to do with it, or what it connects to from earlier in the sprint.`;

// Day view chips — unchanged
function getQuickChips(dayNum) {
  const day = Number(dayNum) || 1;
  const chips = [
    { label: 'Help me get started',  prompt: "I just opened today's stage. Help me understand what I should be focusing on." },
    { label: 'About the Ascent',     prompt: "Help me understand today's ascent — what's the core idea and why does it matter?" },
    { label: 'Help with milepost',   prompt: "I'm not sure what to write for the milepost. Can you help me figure it out?" },
    { label: 'Help with mission',    prompt: "Help me make today's mission feel more concrete and doable." },
    { label: "I'm stuck",            prompt: "I'm stuck on today's stage. Help me figure out what's getting in the way." },
  ];
  if (day >= 3) chips.push({ label: 'I tried it',       prompt: "I tried today's mission. Here's what happened..." });
  if (day >= 5) chips.push({ label: 'What changed?',    prompt: "Help me name what's actually shifted for me across this sprint so far." });
  if (day === 7) chips.push({ label: 'Carry it forward', prompt: "Help me figure out how to carry what I've learned beyond this sprint." });
  return chips;
}

// Explore Further chips — always show the four section labels
function getExploreChips() {
  return [
    { label: 'Worth Knowing',     prompt: "Let's talk about the Worth Knowing section — help me understand it better or connect it to my situation." },
    { label: 'In Practice',       prompt: "I want to dig into the In Practice examples — help me find the one that fits my situation." },
    { label: 'Think About This',  prompt: "Help me work through one of the Think About This reflection questions." },
    { label: 'Try This',          prompt: "I want to try one of the challenges in the Try This section — help me figure out where to start." },
  ];
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SummitCoach({ bookId, dayNum, userId, context = 'day', activeSection = null }) {
  const [isOpen,    setIsOpen]    = useState(false);
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [error,     setError]     = useState(null);
  const [showChips, setShowChips] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const abortRef       = useRef(null);

  const isExplore = context === 'explore';
  const greeting  = isExplore ? EXPLORE_GREETING : INITIAL_GREETING;
  const chips     = isExplore ? getExploreChips() : getQuickChips(dayNum);
  const hasUserMessages = messages.some(m => m.role === 'user');

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, streaming]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && inputRef.current) setTimeout(() => inputRef.current?.focus(), 150);
  }, [isOpen]);

  // Initial greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ role: 'assistant', content: greeting }]);
      setShowChips(true);
    }
  }, [isOpen]);

  // Reset chips/greeting when activeSection changes (explore mode only)
  useEffect(() => {
    if (isExplore && isOpen && activeSection) {
      setMessages([{ role: 'assistant', content: greeting }]);
      setShowChips(true);
      setError(null);
    }
  }, [activeSection]);

  // Cleanup
  useEffect(() => () => abortRef.current?.abort(), []);

  const sendPrompt = useCallback(async (promptText) => {
    const text = promptText.trim();
    if (!text || loading || streaming) return;

    setShowChips(false);
    setError(null);
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);

    const recentHistory = messages
      .filter(m => m?.content && m.content !== greeting)
      .slice(-6);

    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/coach', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        signal:  abortRef.current.signal,
        body: JSON.stringify({
          bookId,
          dayNum,
          userId,
          userMessage: text,
          conversationHistory: recentHistory,
          context,
          activeSection,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error || 'Failed to reach coach');
      }

      const contentType = res.headers.get('content-type') || '';

      if (contentType.includes('text/plain')) {
        // Streaming
        setLoading(false);
        setStreaming(true);
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
        const reader  = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: 'assistant', content: updated[updated.length - 1].content + chunk };
            return updated;
          });
        }
        setStreaming(false);
      } else {
        // JSON
        const data = await res.json();
        setLoading(false);
        setMessages(prev => [...prev, { role: 'assistant', content: data?.message || "What feels most true for you about today's stage?" }]);
      }

    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Coach error:', err);
      setError(err.message || 'Something went wrong. Try again.');
      setLoading(false);
      setStreaming(false);
    }
  }, [messages, loading, streaming, bookId, dayNum, userId, context, activeSection, greeting]);

  const handleSend    = () => sendPrompt(input);
  const handleChip    = (chip) => sendPrompt(chip.prompt);
  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };
  const handleReset   = () => { setMessages([{ role: 'assistant', content: greeting }]); setShowChips(true); setError(null); };

  // Subtitle shown under "Summit Coach" in the panel header
  const subtitle = isExplore
    ? activeSection === 'reading'     ? 'Worth Knowing'
    : activeSection === 'examples'    ? 'In Practice'
    : activeSection === 'reflections' ? 'Think About This'
    : activeSection === 'challenges'  ? 'Try This'
    : 'Explore Further'
    : `Stage ${dayNum} of 7`;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(o => !o)}
        aria-label={isOpen ? 'Close Summit Coach' : 'Open Summit Coach'}
        style={{
          position: 'fixed', bottom: '28px', right: '28px',
          width: '56px', height: '56px', borderRadius: '50%',
          background: isOpen ? 'rgba(15,23,42,0.95)' : 'var(--brand-teal)',
          border: isOpen ? '1px solid rgba(25,190,227,0.4)' : 'none',
          color: isOpen ? 'var(--brand-teal)' : '#0F172A',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: isOpen ? '0 0 20px rgba(25,190,227,0.25)' : '0 4px 20px rgba(25,190,227,0.45)',
          transition: 'all 0.25s ease', zIndex: 1000,
        }}
      >
        {isOpen ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        )}
      </button>

      {/* Label */}
      {!isOpen && (
        <div style={{
          position: 'fixed', bottom: '92px', right: '20px',
          background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(25,190,227,0.25)',
          borderRadius: '8px', padding: '5px 11px',
          color: 'rgba(148,163,184,0.9)', fontSize: '0.72rem', fontWeight: '600',
          letterSpacing: '0.4px', zIndex: 999, pointerEvents: 'none', backdropFilter: 'blur(8px)',
        }}>
          Summit Coach
        </div>
      )}

      {/* Panel */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: '96px', right: '28px',
          width: '360px', height: '520px',
          background: 'rgba(10,18,35,0.97)', border: '1px solid rgba(25,190,227,0.18)',
          borderRadius: '20px', display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 40px rgba(25,190,227,0.08)',
          zIndex: 999, overflow: 'hidden',
          animation: 'coachSlideUp 0.25s ease',
        }}>

          {/* Header */}
          <div style={{
            padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0,
          }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '50%',
              background: 'rgba(25,190,227,0.12)', border: '1px solid rgba(25,190,227,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand-teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'white', fontWeight: '700', fontSize: '0.9rem', fontFamily: 'var(--font-sans)' }}>Summit Coach</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '1px' }}>{subtitle}</div>
            </div>
            {hasUserMessages && (
              <button onClick={handleReset} style={{
                background: 'transparent', border: 'none',
                color: 'rgba(148,163,184,0.45)', cursor: 'pointer',
                fontSize: '0.68rem', fontFamily: 'var(--font-sans)', padding: '4px',
              }}>
                Reset
              </button>
            )}
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '16px',
            display: 'flex', flexDirection: 'column', gap: '10px',
            scrollbarWidth: 'thin', scrollbarColor: 'rgba(25,190,227,0.2) transparent',
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', animation: 'coachFadeIn 0.2s ease' }}>
                <div style={{
                  maxWidth: '88%', padding: '10px 14px',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.role === 'user' ? 'var(--brand-teal)' : 'rgba(30,41,59,0.8)',
                  border: msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  color: msg.role === 'user' ? '#0F172A' : 'var(--text-main)',
                  fontSize: '0.875rem', lineHeight: '1.6',
                  fontFamily: 'var(--font-sans)', fontWeight: msg.role === 'user' ? '600' : '400',
                  whiteSpace: 'pre-wrap',
                }}>
                  {msg.content}
                  {streaming && i === messages.length - 1 && msg.role === 'assistant' && (
                    <span style={{ display: 'inline-block', width: '2px', height: '13px', background: 'var(--brand-teal)', marginLeft: '2px', verticalAlign: 'middle', animation: 'coachBlink 0.8s ease infinite' }} />
                  )}
                </div>
              </div>
            ))}

            {/* Quick chips */}
            {showChips && !hasUserMessages && messages.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                <div style={{ fontSize: '0.63rem', color: 'rgba(148,163,184,0.45)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  Quick starts
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {chips.map(chip => (
                    <button key={chip.label} onClick={() => handleChip(chip)}
                      style={{
                        padding: '6px 11px', borderRadius: '999px',
                        border: '1px solid rgba(25,190,227,0.22)',
                        background: 'rgba(25,190,227,0.05)',
                        color: 'rgba(148,163,184,0.85)', cursor: 'pointer',
                        fontSize: '0.76rem', fontFamily: 'var(--font-sans)',
                        fontWeight: '500', lineHeight: 1.2, transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(25,190,227,0.5)'; e.currentTarget.style.background = 'rgba(25,190,227,0.12)'; e.currentTarget.style.color = 'white'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(25,190,227,0.22)'; e.currentTarget.style.background = 'rgba(25,190,227,0.05)'; e.currentTarget.style.color = 'rgba(148,163,184,0.85)'; }}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Loading dots */}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '10px 16px', borderRadius: '16px 16px 16px 4px', background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '5px', alignItems: 'center' }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--brand-teal)', opacity: 0.4, animation: `coachPulse 1.2s ease ${i * 0.18}s infinite` }} />
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{ padding: '9px 13px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: '0.78rem', textAlign: 'center' }}>
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(15,23,42,0.6)', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask your coach..."
                rows={1}
                style={{
                  flex: 1, padding: '10px 14px',
                  background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px', color: 'white', fontSize: '0.875rem',
                  fontFamily: 'var(--font-sans)', outline: 'none', resize: 'none',
                  minHeight: '40px', maxHeight: '96px', lineHeight: '1.5', transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(25,190,227,0.4)'}
                onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading || streaming}
                aria-label="Send"
                style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: input.trim() && !loading && !streaming ? 'var(--brand-teal)' : 'rgba(25,190,227,0.15)',
                  border: 'none',
                  color: input.trim() && !loading && !streaming ? '#0F172A' : 'rgba(25,190,227,0.4)',
                  cursor: input.trim() && !loading && !streaming ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s', flexShrink: 0,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
            <div style={{ marginTop: '6px', textAlign: 'center', fontSize: '0.63rem', color: 'rgba(148,163,184,0.3)', fontFamily: 'var(--font-sans)' }}>
              Enter to send · Shift+Enter for new line
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes coachSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes coachFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes coachPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%      { opacity: 1;   transform: scale(1.25); }
        }
        @keyframes coachBlink {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0; }
        }
      `}</style>
    </>
  );
}
