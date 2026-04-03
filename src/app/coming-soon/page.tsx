import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SummitSkills — Coming Soon',
  description: 'A new kind of skill development platform. Launching soon.',
}

export default function ComingSoon() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,800;1,700&family=DM+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .cs-page {
          min-height: 100vh;
          background: #0D1520;
          color: #EEF2F7;
          font-family: 'DM Sans', system-ui, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
          text-align: center;
          -webkit-font-smoothing: antialiased;
          position: relative;
          overflow: hidden;
        }

        /* Subtle radial glow behind content */
        .cs-page::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -60%);
          width: 700px;
          height: 700px;
          background: radial-gradient(ellipse at center, rgba(23,184,224,0.07) 0%, transparent 70%);
          pointer-events: none;
        }

        .cs-inner {
          position: relative;
          max-width: 560px;
          width: 100%;
        }

        .cs-logo {
          font-family: 'DM Sans', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          color: rgba(255,255,255,0.25);
          letter-spacing: -0.5px;
          margin-bottom: 64px;
          display: block;
        }
        .cs-logo em {
          font-style: normal;
          color: rgba(23,184,224,0.5);
        }

        .cs-eyebrow {
          display: inline-block;
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem;
          font-weight: 500;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: #17B8E0;
          margin-bottom: 24px;
          padding: 5px 14px;
          border: 1px solid rgba(23,184,224,0.2);
          border-radius: 20px;
          background: rgba(23,184,224,0.06);
        }

        .cs-heading {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2.4rem, 6vw, 3.8rem);
          font-weight: 800;
          line-height: 1.08;
          letter-spacing: -0.03em;
          color: #EEF2F7;
          margin-bottom: 24px;
        }
        .cs-heading em {
          font-style: italic;
          color: #17B8E0;
        }

        .cs-sub {
          font-size: 1rem;
          color: rgba(238,242,247,0.52);
          line-height: 1.75;
          max-width: 400px;
          margin: 0 auto 48px;
        }

        .cs-divider {
          width: 40px;
          height: 1px;
          background: rgba(255,255,255,0.1);
          margin: 0 auto 48px;
        }

        .cs-pills {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          flex-wrap: nowrap;
          margin-bottom: 56px;
        }
        .cs-pill {
          font-size: 0.72rem;
          font-weight: 500;
          color: rgba(255,255,255,0.32);
          padding-right: 18px;
          margin-right: 18px;
          border-right: 1px solid rgba(255,255,255,0.08);
          white-space: nowrap;
          line-height: 1;
        }
        .cs-pill:last-child {
          border-right: none;
          padding-right: 0;
          margin-right: 0;
        }
        .cs-pill strong {
          color: rgba(255,255,255,0.75);
          font-weight: 700;
          font-family: 'DM Mono', monospace;
          font-size: 0.8rem;
        }

        .cs-contact {
          font-size: 0.8rem;
          color: rgba(238,242,247,0.28);
          line-height: 1.6;
        }
        .cs-contact a {
          color: #17B8E0;
          text-decoration: none;
          opacity: 0.7;
          transition: opacity 0.15s;
        }
        .cs-contact a:hover { opacity: 1; }

        .cs-footer {
          position: absolute;
          bottom: 28px;
          left: 0; right: 0;
          text-align: center;
          font-size: 0.68rem;
          color: rgba(255,255,255,0.12);
          font-family: 'DM Sans', sans-serif;
        }

        @media (max-width: 480px) {
          .cs-pills { flex-wrap: wrap; gap: 12px; }
          .cs-pill { border-right: none; padding-right: 0; margin-right: 0; }
        }
      `}</style>

      <div className="cs-page">
        <div className="cs-inner">

          <span className="cs-logo">Summit<em>Skills</em></span>

          <span className="cs-eyebrow">Coming Soon</span>

          <h1 className="cs-heading">
            Real skills take more<br />
            than watching.<br />
            <em>We require the work.</em>
          </h1>

          <p className="cs-sub">
            Skill development built around written reflection, manager-visible progress, and real behavior change. Launching soon.
          </p>

          <div className="cs-divider" />

          <div className="cs-pills">
            <div className="cs-pill"><strong>15</strong> min / day</div>
            <div className="cs-pill"><strong>7-stage</strong> sprints</div>
            <div className="cs-pill"><strong>295</strong> sprints</div>
            <div className="cs-pill">No LMS required</div>
          </div>

          <p className="cs-contact">
            Early access or questions?{' '}
            <a href="mailto:sales@summitskills.io">sales@summitskills.io</a>
          </p>

        </div>

        <div className="cs-footer">© 2026 SummitSkills</div>
      </div>
    </>
  )
}
