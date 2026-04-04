'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Head from 'next/head'
import { supabase } from '@/app/supabaseClient'
import './landing.css'

// ── Pricing ──────────────────────────────────────────────────────────────────

const TIERS = [
  { min: 1,   max: 24,    price: 179,  label: '1–24 seats'    },
  { min: 25,  max: 99,    price: 149,  label: '25–99 seats'   },
  { min: 100, max: 499,   price: 119,  label: '100–499 seats' },
  { min: 500, max: 99999, price: null, label: '500+ seats'    },
]
const BASE_PRICE = 179
const getTier = n => TIERS.find(t => n >= t.min && n <= t.max)
const fmt = n => '$' + n.toLocaleString('en-US')

// ── FAQ content ───────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
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
    a: <p>Yes. From the manager dashboard you can assign any sprint to individual team members or groups. You can run the whole team on the same sprint, useful for a shared skill gap, or run different sprints by role simultaneously. 295 sprints are available across leadership, communication, productivity, strategy, sales, and more.</p>,
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
    a: <p>Yes. It's built for async. No scheduled sessions, no time zones to coordinate. Each team member works through their sprint on their own schedule. The 15-minute format is built for a real workday, not a blocked training afternoon.</p>,
  },
  {
    q: 'How is this different from a course library or passive learning platform?',
    a: <>
      <p>Most learning platforms optimize for content consumption: watch a video, click through slides, mark complete. SummitSkills optimizes for behavior change.</p>
      <p>The difference is the written reflection gate. At every stage, the employee writes a response connecting the concept to something real in their work before the next stage opens. It can't be skipped or bypassed. Every response is logged to the manager dashboard.</p>
      <p>By Stage 7, the employee has produced a real work deliverable, not a certificate or a score. Passive learning tells you what people watched. SummitSkills shows you what people actually engaged with.</p>
    </>,
  },
  {
    q: 'What does the written reflection actually look like?',
    a: <p>Each prompt connects the stage's concept to the employee's actual work. They're not asked to summarize the material. They're asked to apply it. Identify a real situation. Describe how they'd approach a challenge differently. Draft a tool they'll actually use. Managers can read every response in the dashboard. They reveal how team members actually think, not just whether they clicked through a course.</p>,
  },
]

// ── Stage data ────────────────────────────────────────────────────────────────

const STAGES = [
  { n: '01', type: 'Anchor',      desc: 'Attach the behavior to one existing moment that already happens',              cls: 'is-done'   },
  { n: '02', type: 'Environment', desc: 'Design your space so the cue is visible before you can drift past it',         cls: 'is-done'   },
  { n: '03', type: 'Small Start', desc: 'Write the smallest version of the behavior that still counts',                 cls: 'is-active' },
  { n: '04', type: 'Specify',     desc: 'Lock in the exact day, time, place, and action so there is no room for drift', cls: ''          },
  { n: '05', type: 'Track',       desc: 'Create a simple mark-right-after loop so finished work stays visible',         cls: ''          },
  { n: '06', type: 'Adjust',      desc: 'Review what actually happened and tighten the plan based on reality',          cls: ''          },
  { n: '07', type: 'Commit',      desc: 'Choose one repeatable next-week move based on what the week produced',         cls: ''          },
]

// ─────────────────────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter()

  // Checkout state — declared early so useEffects can reference it
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  // Auth redirect — logged-in users go to /library
  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (session?.user) router.replace('/library')
      })
  }, [])

  // Reset checkout loading on mount (handles browser back button)
  useEffect(() => {
    setCheckoutLoading(false)
    // Also reset when user navigates back to this tab/page
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

  // Scroll reveal
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target) }
      }),
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el))
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

  function openModal() {
    if (!tier?.price) {
      window.location.href = `mailto:sales@summitskills.io?subject=Enterprise%20Inquiry%20%E2%80%94%20${seats}%20Seats`
      return
    }
    setModalSuccess(false)
    setForm({ name: '', company: '', email: '' })
    setModalOpen(true)
  }

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
    // Scrolls to the pricing calculator so the user picks their seat count
    // before being sent to Stripe. The calculator CTA (handleTeamCheckout)
    // then fires the actual Stripe session with the 14-day trial.
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
    // TODO: When Docuseal is ready, replace this with openModal() to collect
    // name/company/email, generate the MSA, and trigger Stripe after signing.
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

  // ── Render ──────────────────────────────────────────────────────────────────

  // Hold render until we know the user isn't logged in.
  // Prevents the landing page from flashing for logged-in users before
  // the /library redirect fires.

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
    '--sans':     "'DM Sans', system-ui, sans-serif",
    '--serif':    "'Playfair Display', serif",
    '--mono':     "'DM Mono', monospace",
    '--max':      '1120px',
  }

  return (
    <div className="landing-page" style={cssVars}>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Playfair+Display:ital,wght@0,700;0,800;1,700;1,800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
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

          /* ── Best Fit Section ── */
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

          /* ── Dashboard Annotations ── */
          .dashboard-annotations {
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
            margin-top: 20px;
            justify-content: space-between;
          }
          .dash-annotation {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            max-width: 280px;
          }
          .dash-ann-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--teal);
            flex-shrink: 0;
            margin-top: 5px;
          }
          .dash-ann-text {
            font-family: var(--sans);
            font-size: 0.8rem;
            color: var(--muted);
            line-height: 1.5;
          }
        `}</style>
      </Head>
      {/* ── NAV ── */}
      <nav>
        <a href="#" className="logo">
          <img
            src="/SummitSkills-Logo.png"
            alt="SummitSkills"
            className="logo-img"
            onError={e => { e.target.style.display = 'none' }}
          />
          Summit<span>Skills</span>
        </a>
        <div className="nav-links">
          <a href="#how"          className="nav-link">How it works</a>
          <a href="#team-pricing" className="nav-link nav-link-teams">For Managers</a>
          <a href="#pricing"      className="nav-link">Pricing</a>
          <a href="#faq"          className="nav-link">FAQ</a>
          <a href="/auth/login" className="nav-login">Log in</a>
          <button onClick={handleFreeTrialSignup} className="nav-cta">Start Team Pilot</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div className="hero">
        <div className="hero-left">
          <div className="hero-stats-row">
            <div className="hero-stat-pill"><strong>15</strong> min/day</div>
            <div className="hero-stat-pill"><strong>7-stage</strong> sprints</div>
            <div className="hero-stat-pill">Written reflection <strong>required</strong></div>
            <div className="hero-stat-pill"><strong>Manager</strong> dashboard</div>
          </div>
          <h1>Real skills take<br />more than watching.<br /><em>We require the work.</em></h1>
          <p className="hero-sub">
            Skill development built around required written reflection and real behavior change. Managers assign sprints, see every written response, and track actual progress by individual. Built-in coaching support helps team members apply the work as they go. Teams set up in minutes, no implementation call, no LMS.
          </p>
          <div className="hero-actions">
            <button onClick={handleFreeTrialSignup} className="btn-primary">Start Your Team's First Sprint →</button>
            <a href="#team-pricing" className="btn-ghost">See Pricing →</a>
          </div>
          <p className="hero-footnote">14-day team pilot · Card required · MSA required · No charge until day 15</p>
        </div>

        <div className="hero-right">
          <div className="hero-widget">
            <div className="hw-chrome">
              <div className="hw-dots">
                <div className="hw-dot" /><div className="hw-dot" /><div className="hw-dot" />
              </div>
              <div className="hw-title">Building Consistent Habits · Stage 3 of 7</div>
            </div>
            <div className="hw-stages">
              <div className="hw-stage done"><span className="hw-stage-num">01</span><div className="hw-stage-label">Anchor</div></div>
              <div className="hw-stage done"><span className="hw-stage-num">02</span><div className="hw-stage-label">Environment</div></div>
              <div className="hw-stage active"><span className="hw-stage-num">03</span><div className="hw-stage-label">Small Start</div></div>
              <div className="hw-stage"><span className="hw-stage-num">04</span><div className="hw-stage-label">Specify</div></div>
              <div className="hw-stage"><span className="hw-stage-num">05</span><div className="hw-stage-label">Track</div></div>
              <div className="hw-stage"><span className="hw-stage-num">06</span><div className="hw-stage-label">Adjust</div></div>
              <div className="hw-stage"><span className="hw-stage-num">07</span><div className="hw-stage-label">Commit</div></div>
            </div>
            <div className="hw-body">
              <div className="hw-body-label">Stage 3 · Small Start</div>
              <div className="hw-body-heading">Before Stage 4 unlocks</div>
              <div className="hw-body-text">You've worked through the concept. Now connect it to something real before moving on. Something in your own day, your own team.</div>
              <div className="hw-gate">
                <div className="hw-gate-label">Your response</div>
                <div className="hw-gate-text">Think about one behavior you already do reliably at work. Something that happens almost automatically. What triggers it?</div>
                <div className="hw-gate-btn">Submit response to unlock Stage 4 →</div>
              </div>
            </div>
            <div className="hw-footer">
              <div className="hw-footer-stat">Progress <strong>3/7</strong></div>
              <div className="hw-footer-stat">Logged to <strong>manager dashboard</strong></div>
            </div>
          </div>
        </div>
      </div>

      <hr className="section-divider" />

      {/* ── MECHANIC ── */}
      <section className="mechanic" id="how">
        <div className="wrap">
          <div className="mechanic-inner">
            <div className="mechanic-lede reveal">
              <h2>Not content delivery.<br /><em>A skill-building system.</em></h2>
              <p>Completion rates tell you who clicked through. Written reflection logs tell you who actually engaged. SummitSkills is built around the second kind of evidence.</p>
            </div>
            <div className="mechanic-steps">
              <div className="mechanic-step reveal">
                <div className="mechanic-num">01</div>
                <div>
                  <h3>Assign a sprint to your team</h3>
                  <p>Pick any sprint and assign it to individuals, a role group, or your full team. Team members get an email and they're in. No app, no LMS, no IT ticket.</p>
                  <p className="aside">✓ Live within minutes</p>
                </div>
              </div>
              <div className="mechanic-step reveal">
                <div className="mechanic-num">02</div>
                <div>
                  <h3>One 15-minute stage per day</h3>
                  <p>Each stage delivers one applied concept. The next stage doesn't open until they've engaged with the current one. Paced for a real workday, not a blocked training afternoon.</p>
                  <p className="aside">✓ Async. No scheduling, no time zones.</p>
                </div>
              </div>
              <div className="mechanic-step reveal">
                <div className="mechanic-num">03</div>
                <div>
                  <h3>Every stage requires a written response. No skipping.</h3>
                  <p>Before the next stage opens, they connect the concept to something real in their work. Not multiple choice. They write it out. Every response is logged. Managers see the actual writing, stage by stage.</p>
                </div>
              </div>
              <div className="mechanic-step reveal">
                <div className="mechanic-num">04</div>
                <div>
                  <h3>Stage 7 produces a real work deliverable</h3>
                  <p>A prioritization framework, a communication plan, a habit system built from their own reflections. Not a certificate. Something they made for their actual job.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SPRINT EXAMPLE ── */}
      <section className="sprint-section">
        <div className="wrap">
          <div className="sprint-intro reveal">
            <h2>What a completed sprint produces.</h2>
          </div>
          <div className="sprint-wrap reveal">
            <div className="sprint-chrome">
              <div className="sprint-chrome-left">
                <div>
                  <div className="sprint-name">Building Consistent Habits</div>
                  <div className="sprint-cat">Productivity &amp; Habits · 7-Stage Skill Sprint</div>
                </div>
              </div>
              <div className="sprint-chrome-right">
                <div className="sprint-stat"><strong>7</strong> stages</div>
                <div className="sprint-stat"><strong>~15</strong> min / day</div>
                <div className="sprint-stat">Reflection-gated</div>
              </div>
            </div>

            <div className="stage-grid">
              {STAGES.map(s => (
                <div key={s.n} className={`stage-col ${s.cls}`}>
                  <span className="stage-n">{s.n}</span>
                  <div className="stage-type">{s.type}</div>
                  <div className="stage-desc">{s.desc}</div>
                </div>
              ))}
            </div>

            <div className="sprint-footer-line">
              <p>Same structure, every sprint. Stage 7 always produces a real work deliverable.</p>
              <a href="#pricing">See pricing →</a>
            </div>
            <div className="sprint-deliverable">
              <div className="sprint-deliverable-label">Stage 7 Deliverable</div>
              <div className="sprint-deliverable-title">A personal behavior framework</div>
              <div className="sprint-deliverable-desc">
                Built from their own reflections across the sprint, including the patterns they identified, the friction they removed, the approaches they'll actually use. A working reference for their job, not a template filled in for them.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DASHBOARD PREVIEW ── */}
      <section className="dashboard-preview">
        <div className="wrap">
          <div className="dashboard-preview-intro reveal">
            <h2>For managers who want<br />more than a <em>completion report.</em></h2>
            <p>Written reflection responses, stage-by-stage progress, and sprint assignment in one dashboard. No manual reporting, no waiting for a post-training survey.</p>
          </div>
          <div className="dashboard-img-wrap reveal">
            <img src="/dashboard-preview.png" alt="SummitSkills manager dashboard" />
          </div>
        </div>
      </section>

      {/* ── CREDIBILITY ── */}
      <section className="credibility">
        <div className="wrap">
          <div className="credibility-inner reveal">
            <h2>Why completion rates<br /><em>aren't enough.</em></h2>
            <p className="credibility-sub">Most corporate training gets completed. Almost none of it changes how people work on Monday.</p>
            <div className="credibility-grid">
              <div className="credibility-item">
                <div className="credibility-stat">Written.</div>
                <div className="credibility-label">Written responses are required before the next stage opens. No quiz, no multiple choice. The actual thinking, in their own words.</div>
              </div>
              <div className="credibility-item">
                <div className="credibility-stat">Logged.</div>
                <div className="credibility-label">Every response goes to the manager dashboard. The writing, not a completion percentage. You see what your team actually thinks, stage by stage.</div>
              </div>
              <div className="credibility-item">
                <div className="credibility-stat">Delivered.</div>
                <div className="credibility-label">Stage 7 ends with a real work output built from their own reflections. Not a certificate to file away. A tool they'll actually use.</div>
              </div>
            </div>
            <div className="credibility-pull">
              Written reflection isn't a comprehension check. It's what separates content someone consumed from a skill they actually built.
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="pricing" id="pricing">
        <div className="wrap">
          <div className="pricing-header reveal">
            <h2>Straightforward team pricing.</h2>
            <p>One annual price per seat. Manager dashboard, reflection logging, and sprint assignment built in. No content tiers, no per-sprint fees, no implementation costs.</p>
          </div>

          {/* ── TEAM CALCULATOR ── */}
          <div className="team-calc-header reveal" id="team-pricing">
            <h3>Team pricing calculator</h3>
            <p>Volume discounts apply automatically. No negotiation required.</p>
          </div>
          <div className="pricing-card">
            <div className="pricing-top">
              <div className="plan-info">
                <div className="plan-tag">Team Plan · Annual</div>
                <div className="plan-name">Team Skill Development Plan</div>
                <ul className="plan-features">
                  <li>Manager dashboard: reflection logs, progress tracking, sprint assignment</li>
                  <li>Written reflection at every stage, logged and manager-visible</li>
                  <li>Stage 7 work deliverable per sprint, not a certificate</li>
                  <li>Assign by individual, role, or full team</li>
                  <li>Built-in coaching support per seat</li>
                  <li>Self-serve setup, live in minutes</li>
                  <li>295 sprints across leadership, communication, productivity, and more</li>
                  <li>Signed MSA · Annual price lock · No renewal surprises</li>
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
                <div className="checkout-note">14-day team pilot · Card required · MSA required · Billed on day 15</div>

                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <button
                    onClick={handleIndividualCheckout}
                    disabled={checkoutLoading}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: '0.78rem', color: 'var(--faint)', textDecoration: 'underline', textUnderlineOffset: '3px' }}
                  >
                    Individual access also available · $149/yr · 7-day free trial →
                  </button>
                </div>
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

      {/* ── FAQ ── */}
      <section className="faq" id="faq">
        <div className="wrap">
          <div className="faq-layout">
            <div className="faq-lede reveal">
              <h2>Questions we <em>actually</em> get</h2>
              <p>If something's not covered here, email us. We respond within one business day.</p>
              <a href="mailto:support@summitskills.io" className="faq-email">support@summitskills.io →</a>
            </div>
            <div className="faq-list">
              {FAQ_ITEMS.map((item, i) => (
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

      {/* ── FINAL CTA ── */}
      <section className="final-cta">
        <h2>Your team could finish a sprint<br /><em>in the next 7 days.</em></h2>
        <p>No implementation call, no LMS, no IT ticket. Your team is live in minutes.</p>
        <button onClick={handleFreeTrialSignup} className="btn-primary">Start Team Pilot →</button>
        <p className="final-note">14-day team pilot · Card required · MSA required · Billed on day 15</p>
      </section>

      {/* ── FOOTER ── */}
      <footer>
        <a href="#" className="footer-logo">Summit<em>Skills</em></a>
        <div className="footer-links">
          <a href="#how">Product</a>
          <a href="#pricing">Pricing</a>
          <a href="/security">Security</a>
          <a href="/privacy-policy">Privacy Policy</a>
          <a href="/terms">Terms</a>
          <a href="mailto:support@summitskills.io">Contact</a>
        </div>
        <div className="footer-copy">© 2026 SummitSkills. All rights reserved.</div>
      </footer>

      {/* ── CHECKOUT MODAL ── */}
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
