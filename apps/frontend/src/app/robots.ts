import type { MetadataRoute } from 'next';

const baseUrl = 'https://coparent-global.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/invite', '/reset-password', '/verify-email', '/offline'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
