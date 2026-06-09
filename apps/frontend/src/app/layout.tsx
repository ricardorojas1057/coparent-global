import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Coparent Global',
  description: 'Coparentalidad clara, segura y centrada en los hijos.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-AR">
      <body>{children}</body>
    </html>
  );
}
