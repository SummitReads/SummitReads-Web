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
    a: <p>No. SummitReads is fully self-contained. Your team accesses sprints through a web browser — no app download, no LMS integration, no IT setup. You invite users by email and they're in.</p>,
  },
  {
    q: "What's the minimum seat count?",
    a: <p>One seat. No minimum. Volume pricing tiers kick in automatically at 25, 100, and 500 seats — no discount code needed, it's built into the calculator.</p>,
  },
  {
    q: 'Can we assign specific sprints to specific roles?',
    a: <p>Yes. From the manager dashboard you can assign any sprint from the 295-sprint library to individual team members or groups. You can run the whole team on the same sprint or run different sprints by role simultaneously.</p>,
  },
  {
    q: "What if someone doesn't finish?",
    a: <p>Their progress saves where they left off. There are no expiring assignments. The manager dashboard shows exactly who's active and where each person is in their sprint — so you can follow up directly if you want to.</p>,
  },
  {
    q: 'What does the contract commit us to?',
    a: <>
      <p>An annual subscription at the seat count and per-seat rate you select. The MSA covers term length, seat count, total price, and renewal terms. <strong>Your per-seat rate is locked for the full term</strong> — it won't increase at renewal without your agreement.</p>
      <p>Payment is collected via Stripe only after the MSA is countersigned. You're not charged until you've signed.</p>
    </>,
  },
  {
    q: 'Does this work for remote or distributed teams?',
    a: <p>Yes — it's built for async. No scheduled sessions, no time zones to coordinate. Each team member works through their sprint on their own schedule. The 15-minute format was designed specifically to fit into a real workday, not a blocked training afternoon.</p>,
  },
  {
    q: 'How is this different from a book summary app?',
    a: <>
      <p>Book summary apps optimize for information transfer. SummitReads optimizes for behavior change. The reflection gate at Stage 3 is the difference — it's not optional, it's not a quiz, and it can't be skipped. Your team member has to engage with the material in terms of their own work before moving forward.</p>
      <p><strong>The content is also original.</strong> SummitReads sprints aren't condensed books. They're coaching curricula built around professional skills — original writing, original examples, original structure.</p>
    </>,
  },
]

// ── Stage data ────────────────────────────────────────────────────────────────

const STAGES = [
  { n: '01', type: 'Ascent',   desc: 'Why small consistent actions outperform intense sporadic effort',           cls: 'is-done'   },
  { n: '02', type: 'Ascent',   desc: 'How your environment shapes your behavior more than willpower does',        cls: 'is-done'   },
  { n: '03', type: 'Basecamp', desc: 'Identify one habit loop already running in your work week',                 cls: 'is-active' },
  { n: '04', type: 'Ascent',   desc: 'Design friction out — make the right action the path of least resistance',  cls: ''          },
  { n: '05', type: 'Ascent',   desc: 'Linking new behaviors to existing routines you already do reliably',        cls: ''          },
  { n: '06', type: 'Ascent',   desc: 'The two-minute entry point — reduce any habit to its smallest start',       cls: ''          },
  { n: '07', type: 'Summit',   desc: 'Build your personal habit design system — a working tool, not a summary',   cls: ''          },
]

// ─────────────────────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter()

  // Auth redirect — logged-in users go to /library
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) router.replace('/library')
    })
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
      window.location.href = `mailto:sales@summitreads.com?subject=Enterprise%20Inquiry%20%E2%80%94%20${seats}%20Seats`
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
      alert(e.message + '\n\nOr email us directly: sales@summitreads.com')
    }
  }

  // FAQ state
  const [openFaq, setOpenFaq]       = useState(null)
  const [billingCycle, setBillingCycle] = useState('annual')

  // ── Render ──────────────────────────────────────────────────────────────────

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
      </Head>
      {/* ── NAV ── */}
      <nav>
        <a href="#" className="nav-logo">
          <img
            src="/SummitReads-Logo.png"
            alt="SummitReads"
            style={{ height: '28px', width: 'auto', filter: 'brightness(0) invert(1)', opacity: 0.9, marginRight: '8px', verticalAlign: 'middle' }}
            onError={e => { e.target.style.display = 'none' }}
          />
          Summit<em>Reads</em>
        </a>
        <div className="nav-links">
          <a href="#how"          className="nav-link">How it works</a>
          <a href="#team-pricing" className="nav-link nav-link-teams">For Teams</a>
          <a href="#pricing"      className="nav-link">Pricing</a>
          <a href="#faq"          className="nav-link">FAQ</a>
          <a href="#team-pricing" className="nav-cta">Get Started</a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div className="hero">
        <div className="hero-left">
          <div className="hero-stats-row">
            <div className="hero-stat-pill"><strong>295</strong> sprints</div>
            <div className="hero-stat-pill"><strong>8</strong> categories</div>
            <div className="hero-stat-pill"><strong>7</strong> stages</div>
            <div className="hero-stat-pill"><strong>Start</strong> today</div>
          </div>
          <h1>Real skills take<br />more than watching.<br /><em>We require the work.</em></h1>
          <p className="hero-sub">
            SummitReads builds professional skills through structured daily practice — not passive consumption.
            295 sprints across 8 categories. Every sprint requires a written response before advancing.
            No live sessions. No implementation calls.
          </p>
          <div className="hero-actions">
            <a href="#team-pricing" className="btn-primary">Get Team Access →</a>
            <a href="/auth/signup"  className="btn-ghost">Start as Individual</a>
          </div>
          <p className="hero-footnote">Teams: Signed MSA · Annual billing · 30-day refund &nbsp;·&nbsp; Individuals: No contract · Cancel anytime</p>
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
              <div className="hw-stage done"><span className="hw-stage-num">01</span><div className="hw-stage-label">Ascent</div></div>
              <div className="hw-stage done"><span className="hw-stage-num">02</span><div className="hw-stage-label">Ascent</div></div>
              <div className="hw-stage active"><span className="hw-stage-num">03</span><div className="hw-stage-label">Basecamp</div></div>
              <div className="hw-stage"><span className="hw-stage-num">04</span><div className="hw-stage-label">Ascent</div></div>
              <div className="hw-stage"><span className="hw-stage-num">05</span><div className="hw-stage-label">Ascent</div></div>
              <div className="hw-stage"><span className="hw-stage-num">06</span><div className="hw-stage-label">Ascent</div></div>
              <div className="hw-stage"><span className="hw-stage-num">07</span><div className="hw-stage-label">Summit</div></div>
            </div>
            <div className="hw-body">
              <div className="hw-body-label">Stage 3 · Basecamp</div>
              <div className="hw-body-heading">Before Stage 4 unlocks</div>
              <div className="hw-body-text">You've worked through the concept. Now connect it to something real before moving on — something in your own day, your own team.</div>
              <div className="hw-gate">
                <div className="hw-gate-label">Your response</div>
                <div className="hw-gate-text">Think about one behavior you already do reliably at work — something that happens almost automatically. What triggers it?</div>
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
              <h2>Skill development,<br /><em>not content delivery</em></h2>
              <p>Most platforms measure completion. SummitReads measures engagement — because a team member who can't articulate a concept in their own words hasn't learned it yet.</p>
            </div>
            <div className="mechanic-steps">
              <div className="mechanic-step reveal">
                <div className="mechanic-num">01</div>
                <div>
                  <h3>You assign a sprint from the library</h3>
                  <p>Choose from 295 sprints across Financial Intelligence, Leadership, Productivity, Marketing, Sales, Strategy, Mindset, and Communication. Assign to individuals or groups. They get an email and they're in — no app download, no LMS setup.</p>
                  <p className="aside">Setup takes less than an hour. We've verified this with every early customer.</p>
                </div>
              </div>
              <div className="mechanic-step reveal">
                <div className="mechanic-num">02</div>
                <div>
                  <h3>Each stage takes 15 minutes, then stops</h3>
                  <p>Each Ascent stage delivers one concept with direct workplace application — something they can use before the next stage opens. The pacing is deliberate. Skills build from daily practice, not a single afternoon of consumption.</p>
                </div>
              </div>
              <div className="mechanic-step reveal">
                <div className="mechanic-num">03</div>
                <div>
                  <h3>Every stage requires a response before advancing</h3>
                  <p>After each stage, your team member writes a response connecting the concept to their actual work — a real situation, a real pattern they've noticed. Not multiple choice. Not a slider. They have to think and articulate it before the next stage opens. Every response is logged to your manager dashboard.</p>
                </div>
              </div>
              <div className="mechanic-step reveal">
                <div className="mechanic-num">04</div>
                <div>
                  <h3>By day 7, they've built something</h3>
                  <p>The Summit stage produces a deliverable — a working application of the skill to their actual role, constructed from everything in the previous six stages. Not a quiz result. Not a certificate. Something they made, that applies to their job. Different for every person.</p>
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
            <h2>What skill-building looks like in practice.</h2>
            <div className="sprint-intro-aside">
              <p>Productivity &amp; Habits — one of 295 sprints. Every sprint follows the same structure.</p>
            </div>
          </div>
          <div className="sprint-wrap reveal">
            <div className="sprint-chrome">
              <div className="sprint-chrome-left">
                <div className="sprint-icon">
                  <img src="/SummitReads-Logo.png" alt="SummitReads" style={{ width: '22px', height: '22px', objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.9 }} />
                </div>
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
              <p>Every stage requires a written response before the next one unlocks — not just the midpoint. Stage 7 produces a deliverable, not a score. Every response is logged to your manager dashboard.</p>
              <a href="#pricing">Get access to see the full sprint →</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── DASHBOARD PREVIEW ── */}
      <section className="dashboard-preview">
        <div className="wrap">
          <div className="dashboard-preview-intro reveal">
            <h2>What you see<br />as a <em>manager.</em></h2>
            <p>Live sprint progress, stage-by-stage, for every team member. Reflection responses logged. Completion rates tracked. No manual reporting.</p>
          </div>
          <div className="dashboard-img-wrap reveal">
            <img src="/dashboard-preview.png" alt="SummitReads manager dashboard" />
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="pricing" id="pricing">
        <div className="wrap">
          <div className="pricing-header reveal">
            <h2>Simple, honest pricing.</h2>
            <p>For individuals building skills on their own, or teams that want accountability and manager visibility. All 295 sprints included in every plan.</p>
          </div>

          {/* ── INDIVIDUAL PLANS ── */}
          <div className="indiv-plans reveal">
            {/* Billing toggle */}
            <div className="billing-toggle">
              <button
                className={`billing-opt${billingCycle === 'monthly' ? ' active' : ''}`}
                onClick={() => setBillingCycle('monthly')}
              >Monthly</button>
              <button
                className={`billing-opt${billingCycle === 'annual' ? ' active' : ''}`}
                onClick={() => setBillingCycle('annual')}
              >Annual <span className="billing-save">Save 35%</span></button>
            </div>

            <div className="indiv-cards">
              {/* Individual card */}
              <div className="indiv-card">
                <div className="indiv-card-top">
                  <div className="indiv-plan-tag">Individual</div>
                  <div className="indiv-price">
                    <span className="indiv-amount">{billingCycle === 'monthly' ? '$19' : '$149'}</span>
                    <span className="indiv-period">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                  </div>
                  {billingCycle === 'annual' && (
                    <div className="indiv-equiv">$12.42/month, billed annually</div>
                  )}
                  <p className="indiv-desc">For professionals building skills on their own schedule. Pick any sprint, start today.</p>
                  <a href="/auth/signup" className="btn-primary" style={{ display: 'block', textAlign: 'center', marginTop: '20px' }}>
                    Start Today →
                  </a>
                  <p style={{ fontSize: '0.68rem', color: 'var(--faint)', textAlign: 'center', marginTop: '10px' }}>
                    No contract · Cancel anytime · 30-day refund
                  </p>
                </div>
                <ul className="indiv-features">
                  <li>All 295 skill sprints, all categories</li>
                  <li>AI coaching companion</li>
                  <li>Personal progress tracking</li>
                  <li>Stage 7 deliverable for every sprint</li>
                  <li>~15 min/day · Works on any device</li>
                </ul>
              </div>

              {/* Team card — summary, links to calculator below */}
              <div className="indiv-card indiv-card-team">
                <div className="indiv-card-top">
                  <div className="indiv-plan-tag" style={{ background: 'rgba(23,184,224,0.15)', borderColor: 'rgba(23,184,224,0.3)', color: 'var(--teal)' }}>Team</div>
                  <div className="indiv-price">
                    <span className="indiv-amount">$179</span>
                    <span className="indiv-period">/seat/yr</span>
                  </div>
                  <div className="indiv-equiv">Volume discounts from 25 seats</div>
                  <p className="indiv-desc">For managers who want to assign sprints, track team progress, and see reflection responses.</p>
                  <a href="#team-pricing" className="btn-primary" style={{ display: 'block', textAlign: 'center', marginTop: '20px' }}>
                    Calculate Team Price →
                  </a>
                  <p style={{ fontSize: '0.68rem', color: 'var(--faint)', textAlign: 'center', marginTop: '10px' }}>
                    Signed MSA · Annual billing · 30-day refund
                  </p>
                </div>
                <ul className="indiv-features">
                  <li>Everything in Individual, per seat</li>
                  <li>Manager dashboard &amp; analytics</li>
                  <li>Sprint assignment by person or group</li>
                  <li>Reflection responses visible to managers</li>
                  <li>Signed contract · Live in under 24 hours</li>
                </ul>
              </div>
            </div>
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
                <div className="plan-name">Full Library Access</div>
                <p className="plan-desc">Every seat gets every sprint. No content tiers, no per-sprint fees, no upsells. One annual price, one contract, everything included.</p>
                <ul className="plan-features">
                  <li>All 295 skill sprints, all categories</li>
                  <li>Manager dashboard &amp; per-user analytics</li>
                  <li>Sprint assignment by individual or group</li>
                  <li>AI coaching companion per seat</li>
                  <li>Reflection responses visible to managers</li>
                  <li>Self-guided setup — live in under an hour</li>
                  <li>Signed MSA included with every purchase</li>
                  <li>Annual price lock — no renewal surprises</li>
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

                <button className="btn-checkout" onClick={openModal}>
                  {total ? `Get Started — ${fmt(total)}/yr →` : 'Contact Sales →'}
                </button>
                <div className="checkout-note">Contract sent before payment. Signed MSA required.</div>
              </div>
            </div>

            <div className="pricing-bottom">
              <div className="pb-item">
                <h5>Signed Contract</h5>
                <p>Pre-filled MSA via Docuseal. Sign in under 2 minutes. No back-and-forth.</p>
              </div>
              <div className="pb-item">
                <h5>Live within 24 hours</h5>
                <p>Accounts provisioned, invites sent, dashboard ready after payment clears.</p>
              </div>
              <div className="pb-item">
                <h5>Price Lock</h5>
                <p>Your per-seat rate is locked for the contract term. No renewal surprises.</p>
              </div>
              <div className="pb-item">
                <h5>30-Day Refund</h5>
                <p>Not satisfied in the first 30 days, we refund in full. No questions asked.</p>
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
              <a href="mailto:support@summitreads.com" className="faq-email">support@summitreads.com →</a>
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
        <h2>Start with one team.<br /><em>See what happens in 7 days.</em></h2>
        <p>No implementation calls. A signed contract before payment. Live within 24 hours of signing.</p>
        <a href="#pricing" className="btn-primary">Get Team Access →</a>
        <p className="final-note">From 1 seat · Annual billing · 30-day refund policy</p>
      </section>

      {/* ── FOOTER ── */}
      <footer>
        <a href="#" className="footer-logo">Summit<em>Reads</em></a>
        <div className="footer-links">
          <a href="#">Product</a>
          <a href="#">Pricing</a>
          <a href="#">Security</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms</a>
          <a href="mailto:support@summitreads.com">Contact</a>
        </div>
        <div className="footer-copy">© 2026 SummitReads. All rights reserved.</div>
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
                  Sign at your convenience — takes under 2 minutes. Once signed, you'll receive a Stripe payment link automatically.
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
