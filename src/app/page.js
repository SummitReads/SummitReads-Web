'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/supabaseClient'
import BrandLogo, { LogoWordmark } from '@/components/BrandLogo'
import './landing.css'

// ── Pricing ──────────────────────────────────────────────────────────────────

const TIERS = [
  { min: 1,   max: 24,    price: 199,  label: '1–24 seats'    },
  { min: 25,  max: 99,    price: 169,  label: '25–99 seats'   },
  { min: 100, max: 499,   price: 119,  label: '100–499 seats' },
  { min: 500, max: 99999, price: null, label: '500+ seats'    },
]
const BASE_PRICE = 199
const getTier = n => TIERS.find(t => n >= t.min && n <= t.max)
const fmt = n => '$' + n.toLocaleString('en-US')

// ── FAQ content ───────────────────────────────────────────────────────────────

const getFaqItems = sprintCountLabel => [
  {
    q: 'Do we need an LMS or other software?',
    a: <p>No. SummitSkills is fully self-contained. Your team accesses sprints through a web browser. No app download, no LMS integration, no IT setup. You invite users by email and they're in.</p>,
  },
  {
    q: "What's the minimum seat count?",
    a: <p>One seat. No minimum. Volume pricing tiers kick in automatically at 25, 100, and 500 seats. No discount code needed, it's built into the calculator.</p>,
  },
  {
    q: 'Can we assign specific sprints to specific roles?',
    a: <p>Yes. From the manager dashboard you can assign any sprint to individual team members or groups. You can run the whole team on the same sprint, useful for a shared skill gap, or run different sprints by role simultaneously. {sprintCountLabel !== '—' ? `${sprintCountLabel} sprints are` : 'Sprints are'} available across leadership, communication, productivity, strategy, sales, and more.</p>,
  },
  {
    q: "What if someone doesn't finish?",
    a: <p>Their progress saves where they left off. There are no expiring assignments. The manager dashboard shows exactly who's active and where each person is in their sprint, so you can follow up directly if you want to.</p>,
  },
  {
    q: 'What does the contract commit us to?',
    a: <>
      <p>An annual subscription at the seat count and per-seat rate you select. The MSA covers term length, seat count, total price, and renewal terms. <strong>Your per-seat rate is locked for the full term.</strong> It won't increase at renewal without your agreement.</p>
      <p>Payment is collected via Stripe only after the MSA is countersigned. You're not charged until you've signed.</p>
    </>,
  },
  {
    q: 'Does this work for remote or distributed teams?',
    a: <p>Yes. It's built for async. No scheduled sessions, no time zones to coordinate. Each team member works through their sprint on their own schedule. It's built for a real workday, not a blocked training afternoon.</p>,
  },
  {
    q: 'How is this different from a course library or passive learning platform?',
    a: <>
      <p>Most learning platforms optimize for content consumption: watch a video, click through slides, mark complete. SummitSkills optimizes for behavior change.</p>
      <p>The difference is the written reflection prompt. At every day, the employee is asked to connect the concept to something real in their work before moving on. Every response is logged to the manager dashboard.</p>
      <p>By Day 7, the employee has produced a real work deliverable, not a certificate or a score. Passive learning tells you what people watched. SummitSkills shows you what people actually engaged with.</p>
    </>,
  },
  {
    q: 'What does the written reflection actually look like?',
    a: <p>Each prompt connects the day's concept to the employee's actual work. They're not asked to summarize the material. They're asked to apply it. Identify a real situation. Describe how they'd approach a challenge differently. Draft a tool they'll actually use. Managers can read every response in the dashboard. They reveal how team members actually think, not just whether they clicked through a course.</p>,
  },
]

// ── Stage data ────────────────────────────────────────────────────────────────

// Hero mock mirrors current product (skill → how → write), not old stage labels
const HERO_HOW = [
  'Name one specific behavior you want to do consistently.',
  'Identify the physical or digital condition that blocks it.',
  'Change that condition now, before tomorrow morning.',
]

// ─────────────────────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter()

  // Checkout state — declared early so useEffects can reference it
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  // Seed with null so the pill shows "..." until Supabase returns the live count.
  const [sprintCount, setSprintCount] = useState(null)

  // Auth redirect — logged-in users go to /library
  // NOTE: For a flash-free experience, also handle this in middleware.js so
  // the redirect happens server-side before this page renders at all.
  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (session?.user) router.replace('/library')
      })
  }, [])

  // Fetch live approved sprint count
  useEffect(() => {
    let isMounted = true

    supabase
      .from('books')
      .select('id', { count: 'exact', head: true })
      .eq('review_status', 'approved')
      .then(({ count, error }) => {
        if (!isMounted || error) return
        if (typeof count === 'number') setSprintCount(count)
      })

    return () => {
      isMounted = false
    }
  }, [])

  // Reset checkout loading on mount (handles browser back button)
  useEffect(() => {
    setCheckoutLoading(false)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        setCheckoutLoading(false)
      }
    }
    const handlePageShow = () => setCheckoutLoading(false)
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('pageshow', handlePageShow)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [])

  // FIX #4: Scroll reveal — pre-scan elements already in the viewport on
  // refresh before handing them to the observer, so a mid-page refresh
  // doesn't leave visible elements stuck in their hidden state.
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target) }
      }),
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )
    document.querySelectorAll('.reveal').forEach(el => {
      if (el.getBoundingClientRect().top < window.innerHeight) {
        el.classList.add('visible')
      } else {
        obs.observe(el)
      }
    })
    return () => obs.disconnect()
  }, [])

  // Pricing state
  const [seats, setSeats]     = useState(10)
  const tier  = getTier(seats)
  const total = tier?.price ? seats * tier.price : null
  const saved = total ? seats * BASE_PRICE - total : 0

  // Modal state
  const [modalOpen,    setModalOpen]    = useState(false)
  const [modalSuccess, setModalSuccess] = useState(false)
  const [form,         setForm]         = useState({ name: '', company: '', email: '' })
  const [submitting,   setSubmitting]   = useState(false)

  async function submitContract() {
    if (!form.name || !form.company || !form.email) { alert('Please fill in all fields.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { alert('Please enter a valid email address.'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/create-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, seats, pricePerSeat: tier.price, total }),
      })
      if (res.ok) {
        setModalSuccess(true)
      } else {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Something went wrong. Please try again.')
      }
    } catch (e) {
      setSubmitting(false)
      alert(e.message + '\n\nOr email us directly: sales@summitskills.io')
    }
  }

  // FAQ state
  const [openFaq, setOpenFaq] = useState(null)

  function handleFreeTrialSignup() {
    const el = document.getElementById('pricing')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function handleIndividualCheckout() {
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'individual', billingCycle: 'annual' }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Something went wrong')
      }
    } catch (e) {
      alert(e.message)
      setCheckoutLoading(false)
    }
  }

  async function handleTeamCheckout() {
    if (!tier?.price) {
      window.location.href = `mailto:sales@summitskills.io?subject=Enterprise%20Inquiry%20%E2%80%94%20${seats}%20Seats`
      return
    }
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'team', seats }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Something went wrong')
      }
    } catch (e) {
      alert(e.message)
      setCheckoutLoading(false)
    }
  }

  const sprintCountLabel =
    typeof sprintCount === 'number'
      ? sprintCount.toLocaleString('en-US')
      : '—'

  const faqItems = getFaqItems(sprintCountLabel)

  const cssVars = {
    '--ink':      '#0D1520',
    '--ink-2':    '#101C2C',
    '--surface':  '#0F1B2B',
    '--border':   'rgba(255,255,255,0.07)',
    '--border-2': 'rgba(255,255,255,0.12)',
    '--teal':     '#17B8E0',
    '--text':     '#EEF2F7',
    '--muted':    'rgba(238,242,247,0.58)',
    '--faint':    'rgba(238,242,247,0.32)',
    '--sans':     "var(--font-geist-sans)",
    '--serif':    "var(--font-serif)",
    '--mono':     "var(--font-geist-mono)",
    '--max':      '1120px',
  }

  return (
    <div className="landing-page" style={cssVars}>
      {/*
        FIX #1: Replaced <Head> (next/head — Pages Router only, ignored during
        SSR in App Router) with a plain <style> element. This guarantees the
        fonts and supplementary CSS are present on every render without a FOUC.

      */}
      <style>{`
        .hero-footnote-indiv {
          font-family: var(--sans);
          font-size: 0.78rem;
          color: var(--faint);
          margin-top: 8px;
          line-height: 1.5;
        }
        .manager-usecases {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 24px;
          margin-top: 48px;
        }
        .manager-usecase {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 28px 24px;
        }
        .manager-usecase h4 {
          font-family: var(--sans);
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--teal);
          margin: 0 0 10px;
        }
        .manager-usecase p {
          font-family: var(--sans);
          font-size: 0.88rem;
          color: var(--muted);
          line-height: 1.6;
          margin: 0;
        }

        .best-fit {
          padding: 72px 0;
          background: rgba(255,255,255,0.015);
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }
        .best-fit-inner {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 56px;
          align-items: start;
        }
        .best-fit-intro {
          margin-bottom: 40px;
        }
        .best-fit-intro h2 {
          font-family: var(--serif);
          font-size: clamp(1.6rem, 3vw, 2.2rem);
          color: var(--text);
          line-height: 1.25;
          margin-bottom: 0;
        }
        .best-fit-intro h2 em { color: var(--teal); font-style: italic; }
        .best-fit-grid {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .best-fit-card {
          display: flex;
          gap: 18px;
          align-items: flex-start;
        }
        .best-fit-num {
          font-family: var(--mono);
          font-size: 0.7rem;
          font-weight: 500;
          color: var(--teal);
          background: rgba(23,184,224,0.1);
          border: 1px solid rgba(23,184,224,0.2);
          border-radius: 6px;
          padding: 4px 8px;
          min-width: 32px;
          text-align: center;
          margin-top: 2px;
          flex-shrink: 0;
        }
        .best-fit-card h4 {
          font-family: var(--sans);
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text);
          margin: 0 0 6px;
        }
        .best-fit-card p {
          font-family: var(--sans);
          font-size: 0.84rem;
          color: var(--muted);
          line-height: 1.65;
          margin: 0;
        }
        .best-fit-not {
          font-family: var(--sans);
          font-size: 0.84rem;
          color: var(--faint);
          line-height: 1.6;
          padding: 16px 20px;
          border: 1px solid var(--border);
          border-radius: 8px;
          margin-top: 32px;
        }
        .best-fit-not-label {
          font-weight: 600;
          color: var(--muted);
          margin-right: 6px;
        }
        .best-fit-right { position: sticky; top: 100px; }
        .best-fit-visual {
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 28px 28px 24px;
        }
        .bfv-label {
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--faint);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 20px;
        }
        .bfv-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
        }
        .bfv-cat { font-size: 0.8rem; color: var(--muted); width: 130px; flex-shrink: 0; }
        .bfv-bar-wrap { flex: 1; height: 4px; background: rgba(255,255,255,0.07); border-radius: 2px; overflow: hidden; }
        .bfv-bar { height: 100%; background: var(--teal); border-radius: 2px; opacity: 0.7; }
        .bfv-n { font-family: var(--mono); font-size: 0.75rem; color: var(--faint); width: 24px; text-align: right; }
        @media (max-width: 768px) {
          .best-fit-inner { grid-template-columns: 1fr; gap: 48px; }
          .best-fit-right { position: static; }
        }

        .coach-callout {
          padding: 80px 0;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }
        .coach-callout-inner {
          max-width: 640px;
          margin: 0 auto;
          text-align: center;
        }
        .coach-callout-eyebrow {
          font-family: var(--mono);
          font-size: 0.65rem;
          font-weight: 500;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: var(--teal);
          margin-bottom: 20px;
          display: inline-block;
          padding: 5px 14px;
          border: 1px solid rgba(23,184,224,0.2);
          border-radius: 20px;
          background: rgba(23,184,224,0.06);
        }
        .coach-callout-heading {
          font-family: var(--serif);
          font-size: clamp(1.8rem, 3.5vw, 2.6rem);
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: -0.02em;
          color: var(--text);
          margin-bottom: 24px;
        }
        .coach-callout-heading em {
          font-style: italic;
          color: var(--teal);
        }
        .coach-callout-body {
          font-family: var(--sans);
          font-size: 1rem;
          color: var(--muted);
          line-height: 1.8;
          max-width: 520px;
          margin: 0 auto;
        }

        .individual-cta {
          padding: 64px 0;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }
        .individual-cta-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 48px;
        }
        .individual-cta-heading {
          font-family: var(--serif);
          font-size: clamp(1.4rem, 2.5vw, 1.8rem);
          font-weight: 800;
          color: var(--text);
          margin-bottom: 12px;
          line-height: 1.2;
        }
        .individual-cta-body {
          font-family: var(--sans);
          font-size: 0.9rem;
          color: var(--muted);
          line-height: 1.7;
          max-width: 420px;
        }
        .individual-cta-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 12px;
          flex-shrink: 0;
        }
        .individual-cta-price {
          font-family: var(--mono);
          font-size: 2rem;
          font-weight: 700;
          color: var(--text);
        }
        .individual-cta-price span {
          font-size: 1rem;
          color: var(--muted);
          font-weight: 400;
        }
        .individual-cta-btn {
          background: var(--teal);
          color: var(--ink);
          border: none;
          border-radius: 8px;
          padding: 12px 24px;
          font-family: var(--sans);
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.15s;
          white-space: nowrap;
        }
        .individual-cta-btn:hover { opacity: 0.88; }
        .individual-cta-btn:disabled { opacity: 0.5; cursor: wait; }
        .individual-cta-note {
          font-family: var(--sans);
          font-size: 0.72rem;
          color: var(--faint);
        }
        @media (max-width: 640px) {
          .individual-cta-inner { flex-direction: column; align-items: flex-start; }
          .individual-cta-right { align-items: flex-start; }
        }
      `}</style>
      <nav>
        <BrandLogo
          href="#"
          as="a"
          onImgError={e => { e.target.style.display = 'none' }}
        />
        <div className="nav-links">
          <a href="#how" className="nav-link">How it works</a>
          <a href="#pricing" className="nav-link">Pricing</a>
          <a href="#faq" className="nav-link">FAQ</a>
          <a href="/auth/login" className="nav-login">Log in</a>
          <button type="button" onClick={handleFreeTrialSignup} className="nav-cta">Start team pilot</button>
        </div>
      </nav>

      <div className="hero">
        <div className="hero-left">
          <div className="hero-eyebrow">
            <span className="hero-eyebrow-dot" />
            7-day skill sprints for managers &amp; teams
          </div>
          <h1>
            Real skills take more than watching.
            <br />
            <em>This is the practice.</em>
          </h1>
          <p className="hero-sub">
            Assign a sprint. One skill a day. Write it down on real work, then do it.
            You see progress and every written response — not a completion percentage.
          </p>
          <div className="hero-actions">
            <button type="button" onClick={handleFreeTrialSignup} className="btn-primary">
              Start team pilot →
            </button>
            <a href="#how" className="btn-ghost">How it works</a>
          </div>
          <p className="hero-footnote">
            14-day pilot · No charge until day 15 ·{' '}
            <span style={{ opacity: 0.9 }}>
              {sprintCountLabel !== '—' ? `${sprintCountLabel} sprints` : 'Skill sprints'} live
            </span>
          </p>
          <div className="hero-trust">
            <div className="hero-trust-item">No LMS</div>
            <div className="hero-trust-item">Async by design</div>
            <div className="hero-trust-item">Live in minutes</div>
          </div>
        </div>

        <div className="hero-right">
          <div className="hero-widget hero-widget-v2">
            <div className="hw-chrome">
              <div className="hw-dots">
                <div className="hw-dot" /><div className="hw-dot" /><div className="hw-dot" />
              </div>
              <div className="hw-title">Make Good Work Automatic · Day 1 of 7</div>
            </div>
            <div className="hw-progress">
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <div
                  key={d}
                  className={`hw-prog-seg${d === 1 ? ' is-current' : ''}${d < 1 ? ' is-done' : ''}`}
                />
              ))}
            </div>
            <div className="hw-body hw-body-v2">
              <div className="hw-meta">Day 1 · Practice</div>
              <div className="hw-day-title">Design Beats Discipline</div>

              <div className="hw-beat">
                <div className="hw-beat-label">The skill</div>
                <div className="hw-takeaway">
                  <span className="hw-takeaway-kicker">Takeaway</span>
                  You are building a setup that makes the right move the default one.
                </div>
                <div className="hw-how-label">How</div>
                <ol className="hw-how">
                  {HERO_HOW.map((step, i) => (
                    <li key={i}>
                      <span className="hw-how-n">{i + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="hw-beat hw-beat-write">
                <div className="hw-beat-label">Write it down</div>
                <div className="hw-gate">
                  <div className="hw-gate-text">
                    The behavior I keep missing is <em>opening email before my task list</em>, and the condition I&rsquo;m changing is <em>browser homepage → tasks</em>.
                  </div>
                </div>
              </div>

              <div className="hw-beat-do">
                <span className="hw-do-label">Do it now</span>
                <span className="hw-do-text">Change one default so tomorrow&rsquo;s first screen points at the work.</span>
              </div>
            </div>
            <div className="hw-footer">
              <div className="hw-footer-stat">Logged to <strong>manager dashboard</strong></div>
              <div className="hw-footer-stat">Inspired by <strong>Atomic Habits</strong></div>
            </div>
          </div>
        </div>
      </div>

      <section className="proof-bar" aria-label="Product highlights">
        <div className="wrap proof-bar-inner">
          <div className="proof-item">
            <strong>Skill first</strong>
            <span>Clear takeaway + numbered how — not a video library</span>
          </div>
          <div className="proof-item">
            <strong>Write &amp; do</strong>
            <span>Every day ends on real work, not a quiz</span>
          </div>
          <div className="proof-item">
            <strong>Visible to managers</strong>
            <span>Progress and written responses in one dashboard</span>
          </div>
        </div>
      </section>

      <section className="mechanic" id="how">
        <div className="wrap">
          <div className="mechanic-inner mechanic-inner-v2">
            <div className="mechanic-lede reveal">
              <p className="label">How it works</p>
              <h2>Not content delivery.<br /><em>A skill-building system.</em></h2>
              <p>Most tools report who clicked through. SummitSkills shows who practiced on real work.</p>
            </div>
            <div className="mechanic-steps mechanic-steps-3">
              <div className="mechanic-step reveal">
                <div className="mechanic-num">01</div>
                <div>
                  <h3>Assign a sprint</h3>
                  <p>Pick a skill sprint and assign it to people or the whole team. They get email access — no app, no LMS, no IT ticket.</p>
                </div>
              </div>
              <div className="mechanic-step reveal">
                <div className="mechanic-num">02</div>
                <div>
                  <h3>Practice one skill a day</h3>
                  <p>Teach the move, see it in practice, write it on their work, then do it. Async. Built for a real workday.</p>
                </div>
              </div>
              <div className="mechanic-step reveal">
                <div className="mechanic-num">03</div>
                <div>
                  <h3>See what they wrote</h3>
                  <p>Day-by-day progress and every written response land on your dashboard — not a completion percentage.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sprint-section" id="product">
        <div className="wrap">
          <div className="sprint-intro reveal">
            <p className="label">Inside a day</p>
            <h2>Seven days. One skill. Real output.</h2>
            <p className="sprint-intro-sub">
              Same structure every sprint: the skill, how to do it, where it fails, write it down, do it now.
            </p>
          </div>
          <div className="day-structure reveal">
            <div className="day-structure-card">
              <div className="dsc-n">1</div>
              <h3>The skill</h3>
              <p>Takeaway + numbered how. What to do, not a monologue.</p>
            </div>
            <div className="day-structure-card">
              <div className="dsc-n">2</div>
              <h3>In practice</h3>
              <p>One concrete workplace scene so the move is visible.</p>
            </div>
            <div className="day-structure-card">
              <div className="dsc-n">3</div>
              <h3>Common miss</h3>
              <p>Where the move dies under pressure — so they catch it.</p>
            </div>
            <div className="day-structure-card">
              <div className="dsc-n">4</div>
              <h3>Write &amp; do</h3>
              <p>Pin it to their work, then one real action outside the app.</p>
            </div>
          </div>
          <p className="sprint-footer-line reveal">
            Day 7 ties the week into one run-through on a live situation.
            <a href="#pricing"> See pricing →</a>
          </p>
        </div>
      </section>

      <section className="dashboard-preview">
        <div className="wrap">
          <div className="dashboard-preview-intro reveal">
            <p className="label">For managers</p>
            <h2>More than a <em>completion report.</em></h2>
            <p>Assign sprints, track day-by-day progress, and read every written response in one place.</p>
          </div>
          <div className="dashboard-img-wrap reveal">
            <img src="/dashboard-preview.png" alt="SummitSkills manager dashboard" />
          </div>
        </div>
      </section>

      <section className="credibility credibility-v2">
        <div className="wrap">
          <div className="credibility-inner reveal">
            <h2>Completion isn&rsquo;t the goal.<br /><em>Behavior is.</em></h2>
            <div className="credibility-grid">
              <div className="credibility-item">
                <div className="credibility-stat">Write</div>
                <div className="credibility-label">Each day connects the skill to something real in their work — in their own words.</div>
              </div>
              <div className="credibility-item">
                <div className="credibility-stat">Do</div>
                <div className="credibility-label">A concrete next action outside the app so the skill leaves the page.</div>
              </div>
              <div className="credibility-item">
                <div className="credibility-stat">See</div>
                <div className="credibility-label">Managers see progress and writing, not a green checkmark alone.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pricing" id="pricing">
        <div className="wrap">
          <div className="pricing-header reveal">
            <h2>Straightforward team pricing.</h2>
            <p>One annual price per seat. Manager dashboard and sprint assignment built in. No content tiers, no per-sprint fees, no implementation costs.</p>
          </div>

          <div className="team-calc-header reveal" id="team-pricing">
            <h3>Team pricing calculator</h3>
            <p>Volume discounts apply automatically. No negotiation required.</p>
          </div>
          <div className="pricing-card">
            <div className="pricing-top">
              <div className="plan-info">
                <div className="plan-tag">Team Plan · Annual</div>
                <div className="plan-name">Skill Sprints for Teams</div>
                <ul className="plan-features">
                  <li>Manager dashboard: progress tracking, reflection logs, sprint assignment</li>
                  <li>Built-in coach per seat, trained on each sprint</li>
                  <li>Day 7 work deliverable per sprint</li>
                  <li>Assign by individual, role, or full team</li>
                  <li>Self-serve setup, live in minutes</li>
                  <li>{typeof sprintCount === 'number' ? `${sprintCountLabel} sprints` : 'Sprints'} across leadership, sales, productivity, and more</li>
                  <li>Annual price lock · No renewal surprises</li>
                </ul>
              </div>

              <div className="calc-side">
                <div className="calc-label">Number of Seats</div>
                <div className="seat-row">
                  <button className="seat-btn" onClick={() => setSeats(s => Math.max(1, s - 1))}>−</button>
                  <input
                    type="number"
                    className="seat-input"
                    value={seats}
                    min="1"
                    max="9999"
                    onChange={e => setSeats(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                  <button className="seat-btn" onClick={() => setSeats(s => s + 1)}>+</button>
                </div>

                <div className="price-box">
                  <div className="price-per">
                    {tier?.price ? `${fmt(tier.price)} per seat / year` : '500+ seats — contact us'}
                  </div>
                  <div className="price-total">
                    {total ? <>{fmt(total)} <sub>/ year</sub></> : <>Custom <sub>pricing</sub></>}
                  </div>
                  <div className="price-breakdown">
                    {total
                      ? `${seats} seat${seats !== 1 ? 's' : ''} × ${fmt(tier.price)}`
                      : 'Volume pricing available'}
                  </div>
                  {saved > 0 && (
                    <div className="price-save">{`You save ${fmt(saved)}/yr vs standard rate`}</div>
                  )}
                </div>

                <div className="tier-list">
                  {TIERS.map(t => {
                    const active = seats >= t.min && seats <= t.max
                    const disc   = t.price && t.price < BASE_PRICE
                      ? Math.round((BASE_PRICE - t.price) / BASE_PRICE * 100)
                      : null
                    return (
                      <div key={t.min} className={`tier${active ? ' active' : ''}`}>
                        <span className={`tier-seats${active ? ' active' : ''}`}>{t.label}</span>
                        <div className="tier-right">
                          <span className="tier-price">{t.price ? `${fmt(t.price)}/seat` : 'Custom'}</span>
                          {disc   && <span className="tier-disc">Save {disc}%</span>}
                          {!t.price && <span className="tier-disc">Contact us</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <button
                  className="btn-checkout"
                  onClick={handleTeamCheckout}
                  disabled={checkoutLoading}
                  style={{ cursor: checkoutLoading ? 'wait' : 'pointer' }}
                >
                  {checkoutLoading ? 'Loading…' : 'Start Team Pilot →'}
                </button>
                <div className="checkout-note">14-day pilot · Simple contract · No charge until day 15</div>


              </div>
            </div>

            <div className="pricing-bottom">
              <div className="pb-item">
                <h5>Signed Contract</h5>
                <p>Pre-filled MSA via Docuseal. Sign in under 2 minutes. No back-and-forth.</p>
              </div>
              <div className="pb-item">
                <h5>Live within minutes</h5>
                <p>Accounts provisioned, invites sent, dashboard ready. Your team can start their first sprint the same day.</p>
              </div>
              <div className="pb-item">
                <h5>Price Lock</h5>
                <p>Your per-seat rate is locked for the contract term. No renewal surprises.</p>
              </div>
              <div className="pb-item">
                <h5>14-Day Team Pilot</h5>
                <p>Full team access from day one. Card collected at signup. No charge until your pilot ends on day 15.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="individual-cta individual-cta-quiet">
        <div className="wrap">
          <div className="individual-cta-inner reveal">
            <div className="individual-cta-left">
              <h3 className="individual-cta-heading">For individuals</h3>
              <p className="individual-cta-body">
                Full library and coach, no team required.
              </p>
            </div>
            <div className="individual-cta-right">
              <div className="individual-cta-price">
                $149 <span>/ year</span>
              </div>
              <button
                type="button"
                onClick={handleIndividualCheckout}
                disabled={checkoutLoading}
                className="individual-cta-btn"
              >
                {checkoutLoading ? 'Loading…' : 'Start free trial →'}
              </button>
              <div className="individual-cta-note">7-day trial · Cancel anytime</div>
            </div>
          </div>
        </div>
      </section>

      <section className="faq" id="faq">
        <div className="wrap">
          <div className="faq-layout">
            <div className="faq-lede reveal">
              <h2>Questions we <em>actually</em> get</h2>
              <p>If something's not covered here, email us. We respond within one business day.</p>
              <a href="mailto:support@summitskills.io" className="faq-email">support@summitskills.io →</a>
            </div>
            <div className="faq-list">
              {faqItems.map((item, i) => (
                <div key={i} className="faq-item">
                  <button
                    className={`faq-q${openFaq === i ? ' open' : ''}`}
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    {item.q}
                    <span className="faq-chevron">▾</span>
                  </button>
                  <div className={`faq-a${openFaq === i ? ' open' : ''}`}>
                    <div className="faq-a-inner">{item.a}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="final-cta">
        <h2>
          Your team could be a week in
          <br />
          <em>by this time next week.</em>
        </h2>
        <p>No LMS. No IT ticket. Invite them and start the first sprint.</p>
        <button type="button" onClick={handleFreeTrialSignup} className="btn-primary">
          Start team pilot →
        </button>
        <p className="final-note">14-day pilot · First charge on day 15</p>
      </section>

      <footer>
        <a href="#" className="footer-logo">
          <LogoWordmark />
        </a>
        <div className="footer-links">
          <a href="#how">Product</a>
          <a href="#pricing">Pricing</a>
          <a href="/security">Security</a>
          <a href="/privacy-policy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href="mailto:support@summitskills.io">Contact</a>
        </div>
        <div className="footer-copy">© 2026 SummitSkills. All rights reserved.</div>
      </footer>

      {modalOpen && (
        <div
          className="modal-overlay open"
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}
        >
          <div className="modal">
            <button className="modal-close" onClick={() => setModalOpen(false)}>×</button>

            {modalSuccess ? (
              <div className="success-state">
                <div className="success-icon">✓</div>
                <h3>Contract sent!</h3>
                <p>
                  Your MSA is on its way to <strong style={{ color: '#fff' }}>{form.email}</strong>.<br /><br />
                  Sign at your convenience. Takes under 2 minutes. Once signed, you'll receive a Stripe payment link automatically.
                </p>
                <button className="btn-done" onClick={() => setModalOpen(false)}>Done</button>
              </div>
            ) : (
              <>
                <div className="modal-eyebrow">Almost there</div>
                <h3>Set up your contract</h3>
                <p className="modal-sub">We'll generate a pre-filled MSA and send it to your email for e-signature. Payment follows only after you sign.</p>

                <div className="order-summary">
                  <div>
                    <div className="order-label">{seats} seat{seats !== 1 ? 's' : ''} · Annual</div>
                    <div className="order-price">{fmt(total)} <sub>/ year</sub></div>
                  </div>
                  <div className="order-seats">{fmt(tier.price)}/seat</div>
                </div>

                <div className="form-fields">
                  <div>
                    <label className="field-label" htmlFor="fName">Full Name *</label>
                    <input id="fName" className="field-input" type="text" placeholder="Jane Smith"
                      value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="fCompany">Company Name *</label>
                    <input id="fCompany" className="field-input" type="text" placeholder="Acme Corp"
                      value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="fEmail">Work Email *</label>
                    <input id="fEmail" className="field-input" type="email" placeholder="jane@acmecorp.com"
                      value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                </div>

                <button className="btn-send-contract" onClick={submitContract} disabled={submitting}>
                  {submitting ? 'Sending contract…' : 'Send My Contract →'}
                </button>
                <div className="modal-footnote">
                  Your MSA will arrive via Docuseal within minutes.<br />
                  Payment collected only after you sign.
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
