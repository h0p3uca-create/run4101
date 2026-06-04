import type { Metadata } from 'next';
import './globals.css';

const TITLE = 'Gofor101 — Can you reach 101 points?';
const DESC =
  'Draft an all-time Premier League XI, simulate a 38-game season, and chase the 101-point record.';
const SITE_URL = 'https://gofor101.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESC,
  applicationName: 'Gofor101',
  openGraph: {
    title: TITLE,
    description: DESC,
    url: SITE_URL,
    siteName: 'Gofor101',
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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
