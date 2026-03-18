export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/auth/',
          '/library/',
          '/dashboard/',
        ],
      },
    ],
    sitemap: 'https://summitskills.io/sitemap.xml',
    host: 'https://summitskills.io',
  }
}
