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
    sitemap: 'https://summitreads.io/sitemap.xml',
    host: 'https://summitreads.io',
  }
}
