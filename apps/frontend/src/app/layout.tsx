import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PwaRegister } from './pwa-register';

const siteUrl = 'https://coparent-global.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'App de coparentalidad para padres separados | Coparent Global',
    template: '%s | Coparent Global',
  },
  description:
    'Organizá calendario de cuidado, mensajes, gastos compartidos y acuerdos familiares en una app segura para padres separados, abogados y mediadores.',
  applicationName: 'Coparent Global',
  manifest: '/manifest.webmanifest',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: 'Coparent Global',
    title: 'App de coparentalidad para padres separados | Coparent Global',
    description:
      'Centralizá calendarios, mensajes, gastos y registros familiares en un espacio privado, organizado y trazable.',
    locale: 'es_AR',
    images: [
      {
        url: '/icons/icon-512.png',
        width: 512,
        height: 512,
        alt: 'Coparent Global',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'App de coparentalidad para padres separados | Coparent Global',
    description:
      'Calendario, mensajes, gastos y acuerdos familiares para familias separadas y profesionales.',
    images: ['/icons/icon-512.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Coparent Global',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0f766e',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-AR">
      <body><PwaRegister />{children}</body>
    </html>
  );
}
