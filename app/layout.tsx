import type { Metadata } from 'next';
import { Anton, Archivo, Inter } from 'next/font/google';
import './globals.css';

// Self-hosted at build time (works with output: export).
const anton = Anton({ subsets: ['latin'], weight: '400', variable: '--font-anton', display: 'swap' });
const archivo = Archivo({ subsets: ['latin'], weight: ['600', '700', '800', '900'], variable: '--font-archivo', display: 'swap' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

const TITLE = 'Runfor101 — Can you reach 101 points?';
const DESC =
  'Draft an all-time Premier League XI, simulate a 38-game season, and chase the 101-point record.';
const SITE_URL = 'https://runfor101.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESC,
  applicationName: 'Runfor101',
  openGraph: {
    title: TITLE,
    description: DESC,
    url: SITE_URL,
    siteName: 'Runfor101',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESC,
  },
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${anton.variable} ${archivo.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
