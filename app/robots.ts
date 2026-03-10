import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/terms', '/privacy'],
        disallow: [
          '/api/',
          '/auth/',
          '/portal/',
          '/dashboard/',
          '/register',
          '/login',
          '/reset-password',
          '/onboarding/',
          '/my-gym',
          '/s/',
          '/_next/',
          '/offline',
          '/error',
          '/qr-not-found',
        ],
      },
      {
        userAgent: 'GPTBot',
        allow: ['/'],
        disallow: ['/api/', '/portal/', '/dashboard/'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: ['/'],
        disallow: ['/api/', '/portal/', '/dashboard/'],
      },
      {
        userAgent: 'Google-Extended',
        allow: ['/'],
        disallow: ['/api/', '/portal/', '/dashboard/'],
      },
      {
        userAgent: 'Anthropic-AI',
        allow: ['/'],
        disallow: ['/api/', '/portal/', '/dashboard/'],
      },
      {
        userAgent: 'Claude-Web',
        allow: ['/'],
        disallow: ['/api/', '/portal/', '/dashboard/'],
      },
      {
        userAgent: 'CCBot',
        allow: ['/'],
        disallow: ['/api/', '/portal/', '/dashboard/'],
      },
      // Block known malicious/aggressive bots
      {
        userAgent: 'AhrefsBot',
        disallow: ['/'],
      },
      {
        userAgent: 'SemrushBot',
        disallow: ['/'],
      },
      {
        userAgent: 'MJ12bot',
        disallow: ['/'],
      },
      {
        userAgent: 'DotBot',
        disallow: ['/'],
      },
      {
        userAgent: 'BLEXBot',
        disallow: ['/'],
      },
      {
        userAgent: 'DataForSeoBot',
        disallow: ['/'],
      },
      {
        userAgent: 'PetalBot',
        disallow: ['/'],
      },
    ],
    sitemap: 'https://inkuity.com/sitemap.xml',
  }
}
