import type {Metadata} from 'next';
import {SpeedInsights} from '@vercel/speed-insights/next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'VectorStock Pro - Free Vectors, Images & SVGs',
  description: 'Download high-quality free vectors, SVGs, illustrations, and images for your next project.',
  keywords: 'vectors, free vectors, svg, illustrations, backgrounds, images, download',
  verification: {
    // Google Search Console Verification Code (Replace this with your actual code)
    google: 'YOUR_GOOGLE_VERIFICATION_CODE_HERE',
  },
  openGraph: {
    title: 'VectorStock Pro',
    description: 'Download high-quality free vectors, SVGs, and images.',
    type: 'website',
  }
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
