import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, Space_Mono } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  variable: '--font-space-mono',
  weight: ['400', '700'],
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#1c1c24',
};

export const metadata: Metadata = {
  title: 'PeakIQ — Can you guess the elevation?',
  description: 'A daily geography game where you guess the elevation of world-famous locations. Five rounds, one slider. A new challenge every day.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PeakIQ',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${spaceMono.variable}`}>
      <body className="bg-charcoal-900 text-white font-sans min-h-screen">
        {children}
      </body>
    </html>
  );
}
