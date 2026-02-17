import React from 'react';
import '../globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Toaster } from 'sonner';

export const metadata = {
  title: {
    default: 'Kitsu Enterprise | Next-Gen Anime Streaming',
    template: '%s | Kitsu Enterprise'
  },
  description: 'The ultimate anime streaming platform with lightning-fast updates, high-quality distributed video assets, and advanced community features.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=no',
  themeColor: '#0a0a0f',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://kitsu.io',
    siteName: 'Kitsu Enterprise',
    title: 'Kitsu Enterprise | Watch Anime Online',
    description: 'Next-generation anime platform built for enthusiasts.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kitsu Enterprise',
    description: 'Next-generation anime platform built for enthusiasts.',
    images: ['/og-image.jpg'],
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-bg-primary text-text-primary antialiased min-h-screen flex flex-col">
        <ErrorBoundary>
          <QueryProvider>
            <header role="banner">
              <Navbar />
            </header>
            <main id="main-content" className="flex-1" role="main" aria-label="Main Content">
              <PageTransition>
                {children}
              </PageTransition>
            </main>
            <footer role="contentinfo">
              <Footer />
            </footer>
            <Toaster theme="dark" position="bottom-right" expand={false} richColors closeButton />
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
