import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
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
