'use client'

import Link from 'next/link'

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p style={{ color: 'rgba(238,242,247,0.58)', fontSize: '1rem', lineHeight: 1.7, marginBottom: '48px' }}>
          These Terms of Service govern your use of SummitSkills and the services provided through summitskills.io. By creating an account or purchasing a subscription, you agree to these terms.
        </p>

        <Section title="1. Who We Are">
          <p>SummitSkills is a brand operated by SSK LLC, a Utah limited liability company, doing business as SummitSkills. You can reach us at <a href="mailto:support@summitskills.io" style={{ color: '#17B8E0' }}>support@summitskills.io</a> with any questions about these terms.</p>
        </Section>

        <Section title="2. What SummitSkills Provides">
          <p>SummitSkills is a professional skill development platform that delivers structured 7-stage skill sprints. The platform includes written reflection requirements at each stage, a Stage 7 deliverable, an AI coaching companion, and (for team plans) a manager dashboard with reflection logs and sprint assignment tools.</p>
          <p>We reserve the right to modify, update, or discontinue any feature of the platform at any time. We will make reasonable efforts to notify users of material changes.</p>
        </Section>

        <Section title="3. Accounts and Access">
          <p>You must provide accurate information when creating an account. You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account.</p>
          <p>You may not share your account credentials with others or allow multiple individuals to access the platform through a single account. Team plans require a separate seat for each user.</p>
          <p>We reserve the right to suspend or terminate accounts that violate these terms or that we reasonably believe are being misused.</p>
        </Section>

        <Section title="4. Subscriptions and Billing">
          <p><strong style={{ color: '#EEF2F7' }}>Individual plans</strong> are billed monthly or annually depending on the option selected at checkout. Annual plans are billed in full at the start of the subscription period.</p>
          <p><strong style={{ color: '#EEF2F7' }}>Team plans</strong> are billed annually under a signed Master Services Agreement (MSA). Payment is collected via Stripe only after the MSA has been countersigned by both parties. Your per-seat rate is locked for the duration of the contract term.</p>
          <p>All payments are processed securely by Stripe. SummitSkills does not store your payment card information.</p>
          <p>Prices are listed in USD and are subject to change. We will provide reasonable advance notice of price changes to existing subscribers.</p>
        </Section>

        <Section title="5. Free Trial">
          <p>SummitSkills offers a 14-day free trial for team plans. Free trials include up to 5 seats and do not require a credit card. At the end of the trial period, access will be suspended unless a team plan is purchased under a signed Master Services Agreement.</p>
          <p>Free trials are limited to one per organization. Trial data, including sprint progress and reflection responses, is retained for 30 days after trial expiration to allow for account recovery if a plan is purchased.</p>
        </Section>

        <Section title="6. Refund Policy">
          <p><strong style={{ color: '#EEF2F7' }}>Individual plans:</strong> All fees are non-refundable. We encourage individual subscribers to take advantage of any available trial period before purchasing.</p>
          <p><strong style={{ color: '#EEF2F7' }}>Team plans:</strong> All fees under a signed Master Services Agreement are non-refundable. Access to the Platform is granted immediately upon execution of the MSA. We encourage all teams to complete a free trial before signing.</p>
          <p>Notwithstanding the above, refunds may be issued where required by applicable law.</p>
        </Section>

        <Section title="7. Cancellation">
          <p><strong style={{ color: '#EEF2F7' }}>Individual plans</strong> may be cancelled at any time. Cancellation takes effect at the end of the current billing period. No refunds are issued for unused time.</p>
          <p><strong style={{ color: '#EEF2F7' }}>Team plans</strong> are governed by the cancellation and renewal provisions of the signed MSA.</p>
        </Section>

        <Section title="8. Acceptable Use">
          <p>You agree to use SummitSkills only for lawful purposes and in a manner consistent with these terms. You may not:</p>
          <ul style={{ color: 'rgba(238,242,247,0.58)', lineHeight: 2, paddingLeft: '20px' }}>
            <li>Reproduce, resell, or redistribute SummitSkills content without written permission</li>
            <li>Use automated tools to scrape, download, or systematically extract content from the platform</li>
            <li>Attempt to reverse-engineer, decompile, or otherwise access the underlying code or systems</li>
            <li>Use the platform in any way that could damage, disable, or impair its operation</li>
            <li>Misrepresent your identity or affiliation when creating an account</li>
          </ul>
        </Section>

        <Section title="9. Intellectual Property">
          <p>All content on SummitSkills — including sprint curricula, coaching content, stage structure, and AI-generated coaching responses — is original and proprietary. It is protected by copyright and may not be reproduced, distributed, or used outside the platform without express written permission.</p>
          <p>Your written reflection responses remain your own. You grant SummitSkills a limited license to store and display your responses within the platform for the purpose of delivering the service, including making them visible to your designated manager if you are on a team plan.</p>
        </Section>

        <Section title="10. Privacy">
          <p>Your use of SummitSkills is also governed by our <Link href="/privacy-policy" style={{ color: '#17B8E0' }}>Privacy Policy</Link>, which is incorporated into these terms by reference.</p>
        </Section>

        <Section title="11. Disclaimers">
          <p>SummitSkills is provided "as is" without warranties of any kind, express or implied. We do not guarantee that the platform will be available at all times, error-free, or that results from using it will meet any specific expectations.</p>
          <p>SummitSkills is an educational and professional development tool. It is not a substitute for professional coaching, therapy, or legal, financial, or medical advice.</p>
        </Section>

        <Section title="12. Limitation of Liability">
          <p>To the maximum extent permitted by law, SummitSkills and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the platform, even if we have been advised of the possibility of such damages.</p>
          <p>Our total liability to you for any claim arising out of or relating to these terms or your use of SummitSkills shall not exceed the amount you paid us in the 12 months preceding the claim.</p>
        </Section>

        <Section title="13. Governing Law">
          <p>These terms are governed by the laws of the State of Utah, without regard to its conflict of law principles. Any disputes arising under these terms shall be resolved in the state or federal courts located in Utah, and you consent to the exclusive jurisdiction of those courts.</p>
        </Section>

        <Section title="14. Changes to These Terms">
          <p>We may update these terms from time to time. When we do, we will update the "Last updated" date at the top of this page and notify active subscribers by email for material changes. Continued use of SummitSkills after changes take effect constitutes acceptance of the updated terms.</p>
        </Section>

        <Section title="15. Contact">
          <p>Questions about these terms? Email us at <a href="mailto:support@summitskills.io" style={{ color: '#17B8E0' }}>support@summitskills.io</a>. We respond within one business day.</p>
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
