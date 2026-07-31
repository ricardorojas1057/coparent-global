import type { MetadataRoute } from 'next';

const baseUrl = 'https://coparent-global.vercel.app';

const publicRoutes = [
  '/',
  '/install',
  '/padres-separados',
  '/calendario-de-cuidado',
  '/gastos-de-hijos',
  '/abogados',
  '/mediadores',
  '/privacy',
  '/terms',
  '/support',
  '/account-deletion',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return publicRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: route === '/' ? 'weekly' : 'monthly',
    priority: route === '/' ? 1 : 0.7,
  }));
}
