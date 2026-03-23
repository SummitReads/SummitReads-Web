'use client'

import Link from 'next/link'

export default function PrivacyPolicyPage() {
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
          Last updated: March 19, 2026
        </p>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 700, marginBottom: '12px', letterSpacing: '-0.02em' }}>
          Privacy Policy
        </h1>
        <p style={{ color: 'rgba(238,242,247,0.58)', fontSize: '1rem', lineHeight: 1.7, marginBottom: '48px' }}>
          This Privacy Policy explains how SummitSkills collects, uses, and protects your personal information when you use our platform. We take your privacy seriously and are committed to handling your data with care.
        </p>

        <Section title="1. Who This Policy Applies To">
          <p>This policy applies to all users of SummitSkills, including individual subscribers, team members, and managers who access the platform through summitskills.io.</p>
        </Section>

        <Section title="2. What Information We Collect">
          <p><strong style={{ color: '#EEF2F7' }}>Account information:</strong> When you create an account, we collect your name, email address, and password (stored as a hashed value — we never store your plain-text password).</p>
          <p><strong style={{ color: '#EEF2F7' }}>Usage data:</strong> We collect information about how you use the platform, including which sprints you've started or completed, your stage-by-stage progress, and the written reflection responses you submit.</p>
          <p><strong style={{ color: '#EEF2F7' }}>Team data:</strong> If you are on a team plan, your manager can view your sprint progress and written reflection responses through the manager dashboard. This is a core feature of the team plan and is disclosed at the time of account creation.</p>
          <p><strong style={{ color: '#EEF2F7' }}>Payment information:</strong> We do not store your payment card details. All payments are processed by Stripe, a PCI-compliant payment processor. Stripe's privacy policy governs the handling of your payment information.</p>
          <p><strong style={{ color: '#EEF2F7' }}>Communications:</strong> If you contact us by email, we retain that correspondence to help resolve your inquiry.</p>
        </Section>

        <Section title="3. How We Use Your Information">
          <p>We use the information we collect to:</p>
          <ul style={{ color: 'rgba(238,242,247,0.58)', lineHeight: 2, paddingLeft: '20px' }}>
            <li>Deliver the SummitSkills service and maintain your account</li>
            <li>Track your sprint progress and unlock stages as you complete reflections</li>
            <li>Make your reflection responses visible to your designated manager (team plans only)</li>
            <li>Send transactional emails such as sprint assignment notifications and stage completion confirmations</li>
            <li>Respond to support requests</li>
            <li>Improve the platform based on usage patterns</li>
          </ul>
          <p>We do not sell your personal information to third parties. We do not use your data for advertising purposes.</p>
        </Section>

        <Section title="4. Written Reflection Responses">
          <p>Your written reflection responses are personal and substantive. We treat them with care.</p>
          <p>On <strong style={{ color: '#EEF2F7' }}>individual plans</strong>, your responses are visible only to you and are used to deliver the AI coaching experience.</p>
          <p>On <strong style={{ color: '#EEF2F7' }}>team plans</strong>, your responses are visible to the manager or administrator who assigned your sprint. This visibility is a core feature of the team plan and is communicated clearly before you begin a sprint. If you have questions about who can see your responses, contact your account administrator or email us.</p>
        </Section>

        <Section title="5. How We Share Your Information">
          <p>We do not sell or rent your personal information. We share data only in the following circumstances:</p>
          <p><strong style={{ color: '#EEF2F7' }}>Service providers:</strong> We use a small number of trusted third-party services to operate the platform, including Supabase (database and authentication), Stripe (payments), OpenAI (AI coaching responses), and Resend (transactional email). Each of these providers processes data only as necessary to deliver their service.</p>
          <p><strong style={{ color: '#EEF2F7' }}>Legal requirements:</strong> We may disclose your information if required to do so by law or in response to a valid legal request from a government authority.</p>
          <p><strong style={{ color: '#EEF2F7' }}>Business transfers:</strong> If SSK LLC (doing business as SummitSkills) is acquired or merges with another company, your information may be transferred as part of that transaction. We will notify you before your data is transferred and becomes subject to a different privacy policy.</p>
        </Section>

        <Section title="6. Data Retention">
          <p>We retain your account information and usage data for as long as your account is active. If you cancel your subscription, we retain your data for 90 days before deletion to allow for account recovery if needed.</p>
          <p>You may request deletion of your account and associated data at any time by emailing <a href="mailto:support@summitskills.io" style={{ color: '#17B8E0' }}>support@summitskills.io</a>. We will process deletion requests within 30 days.</p>
        </Section>

        <Section title="7. Security">
          <p>We take reasonable measures to protect your information, including encrypted connections (HTTPS), hashed password storage, and row-level security on our database so that users can only access their own data.</p>
          <p>No system is completely secure. If you believe your account has been compromised, contact us immediately at <a href="mailto:support@summitskills.io" style={{ color: '#17B8E0' }}>support@summitskills.io</a>.</p>
        </Section>

        <Section title="8. Cookies">
          <p>SummitSkills uses cookies and similar technologies to maintain your session and keep you logged in. We do not use tracking cookies for advertising or behavioral profiling.</p>
        </Section>

        <Section title="9. Children's Privacy">
          <p>SummitSkills is intended for professional use by adults. We do not knowingly collect personal information from anyone under the age of 18. If you believe we have inadvertently collected such information, please contact us and we will delete it promptly.</p>
        </Section>

        <Section title="10. Your Rights">
          <p>You have the right to access, correct, or delete your personal information. To exercise these rights, email us at <a href="mailto:support@summitskills.io" style={{ color: '#17B8E0' }}>support@summitskills.io</a>. We will respond within 30 days.</p>
          <p>If you are located in the European Economic Area, you may have additional rights under GDPR, including the right to data portability and the right to lodge a complaint with a supervisory authority.</p>
        </Section>

        <Section title="11. Changes to This Policy">
          <p>We may update this Privacy Policy from time to time. When we do, we will update the "Last updated" date at the top of this page. For material changes, we will notify active users by email. Continued use of SummitSkills after changes take effect constitutes acceptance of the updated policy.</p>
        </Section>

        <Section title="12. Contact">
          <p>Questions about this Privacy Policy? Email us at <a href="mailto:support@summitskills.io" style={{ color: '#17B8E0' }}>support@summitskills.io</a>. We respond within one business day.</p>
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
