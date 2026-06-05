import type { Metadata } from 'next';
import { Anton, Archivo, Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

// Self-hosted at build time (works with output: export).
const anton = Anton({ subsets: ['latin'], weight: '400', variable: '--font-anton', display: 'swap' });
const archivo = Archivo({ subsets: ['latin'], weight: ['600', '700', '800', '900'], variable: '--font-archivo', display: 'swap' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

const TITLE = 'Runfor101 — Build a Premier League XI & Beat the 101-Point Record';
const DESC =
  'Roll a real Premier League club, build your dream XI, and simulate 38 games to chase the 101-point record. A free football management game.';
const SITE_URL = 'https://runfor101.xyz';

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

// Runs before paint: honour a saved Light preference so there's no dark→light
// flash (the SSR default below is dark).
const THEME_INIT = `try{if(localStorage.getItem('runfor101-theme')==='light')document.documentElement.classList.remove('dark')}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${anton.variable} ${archivo.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
