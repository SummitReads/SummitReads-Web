'use client'

import Link from 'next/link'

export default function SecurityPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0D1520',
      color: '#EEF2F7',
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      {/* Nav */}
      <nav style={{
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 40px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Link href="/" style={{
          color: '#EEF2F7',
          textDecoration: 'none',
          fontWeight: 700,
          fontSize: '1rem',
          letterSpacing: '-0.01em',
        }}>
          Summit<em style={{ color: '#17B8E0', fontStyle: 'italic' }}>Skills</em>
        </Link>
        <Link href="/" style={{
          color: 'rgba(238,242,247,0.58)',
          textDecoration: 'none',
          fontSize: '0.88rem',
        }}>
          ← Back to home
        </Link>
      </nav>

      {/* Content */}
      <div style={{
        maxWidth: '760px',
        margin: '0 auto',
        padding: '64px 40px 120px',
      }}>
        <p style={{ fontSize: '0.78rem', color: 'rgba(238,242,247,0.32)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Last updated: March 22, 2026
        </p>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 700, marginBottom: '12px', letterSpacing: '-0.02em' }}>
          Security
        </h1>
        <p style={{ color: 'rgba(238,242,247,0.58)', fontSize: '1rem', lineHeight: 1.7, marginBottom: '48px' }}>
          SummitSkills is built on infrastructure designed to keep your data private and your account secure. This page explains how we handle security across the platform.
        </p>

        <Section title="Encrypted Connections">
          <p>All traffic between your browser and SummitSkills is encrypted via HTTPS using TLS. We do not serve any part of the platform over unencrypted HTTP.</p>
        </Section>

        <Section title="Authentication and Passwords">
          <p>Passwords are never stored in plain text. All passwords are hashed using industry-standard cryptographic methods before being stored. We use Supabase Auth for account management, which handles authentication securely on our behalf.</p>
          <p>We recommend using a strong, unique password for your SummitSkills account. If you believe your account has been compromised, contact us immediately at <a href="mailto:support@summitskills.io" style={{ color: '#17B8E0' }}>support@summitskills.io</a>.</p>
        </Section>

        <Section title="Database Security">
          <p>Our database is hosted on Supabase and protected with row-level security (RLS). This means every database query is scoped at the database level — users can only read and write their own data, regardless of what the application layer requests. Team managers can access their team members' sprint progress and reflection responses as a defined, intentional exception to this rule.</p>
          <p>Database credentials are never exposed to the browser. All direct database access from the server uses environment variables stored securely outside of the codebase.</p>
        </Section>

        <Section title="Payment Security">
          <p>SummitSkills does not store payment card information. All payment processing is handled by <strong style={{ color: '#EEF2F7' }}>Stripe</strong>, a PCI DSS Level 1 certified payment processor — the highest level of certification available in the payments industry. Your card number, CVV, and billing details are entered directly into Stripe's systems and never pass through our servers.</p>
        </Section>

        <Section title="AI Coaching">
          <p>AI coaching responses are generated using OpenAI's API. Your written reflection responses may be sent to OpenAI to generate a contextual coaching reply. OpenAI processes this data under their API data usage policies, which do not use API inputs to train their models by default.</p>
          <p>We do not send your name, email, or identifying information to OpenAI — only the text of your reflection response and the relevant sprint context.</p>
        </Section>

        <Section title="Data Isolation">
          <p>Each organization on a team plan is fully isolated at the data level. Managers can only see data for users within their own organization. No cross-organization data access is possible through normal platform use.</p>
        </Section>

        <Section title="Infrastructure">
          <p>SummitSkills is deployed on <strong style={{ color: '#EEF2F7' }}>Vercel</strong>, which provides automatic HTTPS, DDoS protection, and edge network infrastructure. Our database and authentication layer run on <strong style={{ color: '#EEF2F7' }}>Supabase</strong>, which is hosted on AWS and SOC 2 Type II certified.</p>
        </Section>

        <Section title="Responsible Disclosure">
          <p>If you discover a security vulnerability in SummitSkills, please report it to us privately at <a href="mailto:support@summitskills.io" style={{ color: '#17B8E0' }}>support@summitskills.io</a> before disclosing it publicly. We will acknowledge your report within one business day and work to address valid issues promptly.</p>
          <p>We appreciate responsible disclosure and will not take legal action against researchers who follow this process in good faith.</p>
        </Section>

        <Section title="Questions">
          <p>Questions about how we handle security? Email us at <a href="mailto:support@summitskills.io" style={{ color: '#17B8E0' }}>support@summitskills.io</a>. We respond within one business day.</p>
        </Section>
      </div>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.07)',
        padding: '32px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <span style={{ color: 'rgba(238,242,247,0.32)', fontSize: '0.84rem' }}>© 2026 SummitSkills. All rights reserved.</span>
        <div style={{ display: 'flex', gap: '24px' }}>
          <Link href="/privacy-policy" style={{ color: 'rgba(238,242,247,0.58)', fontSize: '0.84rem', textDecoration: 'none' }}>Privacy Policy</Link>
          <Link href="/terms" style={{ color: 'rgba(238,242,247,0.58)', fontSize: '0.84rem', textDecoration: 'none' }}>Terms</Link>
          <a href="mailto:support@summitskills.io" style={{ color: 'rgba(238,242,247,0.58)', fontSize: '0.84rem', textDecoration: 'none' }}>Contact</a>
        </div>
      </footer>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '40px' }}>
      <h2 style={{
        fontSize: '1.05rem',
        fontWeight: 700,
        color: '#EEF2F7',
        marginBottom: '12px',
        paddingBottom: '10px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        {title}
      </h2>
      <div style={{
        color: 'rgba(238,242,247,0.58)',
        fontSize: '0.92rem',
        lineHeight: 1.75,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        {children}
      </div>
    </div>
  )
}
