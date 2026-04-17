import { DM_Sans, Playfair_Display, DM_Mono } from 'next/font/google'
import './globals.css'

// ── Fonts ─────────────────────────────────────────────────────────────────────
// These match the fonts used in landing.css.
// If you want to keep Geist instead, revert these and update landing.css to match.
const dmSans = DM_Sans({
  variable: '--font-geist-sans', // keeps compatibility with any globals.css references
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const playfair = Playfair_Display({
  variable: '--font-serif',
  subsets: ['latin'],
  weight: ['700', '800'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const dmMono = DM_Mono({
  variable: '--font-geist-mono', // keeps compatibility with any globals.css references
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
})

// ── Metadata ──────────────────────────────────────────────────────────────────
export const metadata = {
  metadataBase: new URL('https://summitskills.io'),
  viewport: 'width=device-width, initial-scale=1',

  title: {
    default: 'SummitSkills — Skill Development That Actually Sticks',
    template: '%s | SummitSkills',
  },

  description:
    '295 structured skill sprints for individuals and teams. 15 minutes a day. Reflection-gated stages that build real workplace skills — not passive content consumption.',

  keywords: [
    'professional development platform',
    'skill development for teams',
    'employee training software',
    'microlearning platform',
    'leadership development',
    'team learning platform',
    'online skill sprints',
    'professional growth',
    'SummitSkills',
  ],

  authors: [{ name: 'SummitSkills', url: 'https://summitskills.io' }],
  creator: 'SummitSkills',
  publisher: 'SummitSkills',

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://summitskills.io',
    siteName: 'SummitSkills',
    title: 'SummitSkills — Skill Development That Actually Sticks',
    description:
      '295 structured skill sprints. 15 minutes a day. Reflection-gated stages that build real workplace skills — not passive content consumption.',
    images: [
      {
        // [PLACEHOLDER] Create a 1200×630px branded image at /public/og-image.png
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SummitSkills — Skill Development That Actually Sticks',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'SummitSkills — Skill Development That Actually Sticks',
    description:
      '295 structured skill sprints. 15 minutes a day. Real deliverables, not quiz scores.',
    images: ['/og-image.png'], // [PLACEHOLDER] same image as OG above
    // creator: '@[PLACEHOLDER]', // add your Twitter/X handle when ready
  },

  alternates: {
    canonical: 'https://summitskills.io',
  },

  icons: {
    icon: '/favicon.ico',
    // [PLACEHOLDER] add these to /public if you have them:
    // shortcut: '/favicon-16x16.png',
    // apple: '/apple-touch-icon.png',
  },

  // [PLACEHOLDER] Uncomment and add token after connecting Google Search Console:
  // verification: {
  //   google: 'YOUR_GOOGLE_VERIFICATION_TOKEN',
  // },
}

// ── Root Layout ───────────────────────────────────────────────────────────────
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${playfair.variable} ${dmMono.variable}`}>
        {children}
      </body>
    </html>
  )
}
