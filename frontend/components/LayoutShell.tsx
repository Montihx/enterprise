'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import PageTransition from './PageTransition';

// Routes that have their own full-page layout (no navbar/footer)
const FULLSCREEN_ROUTES = ['/dashboard'];

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullscreen = FULLSCREEN_ROUTES.some((r) => pathname.startsWith(r));

  if (isFullscreen) {
    return <>{children}</>;
  }

  return (
    <>
      <header role="banner">
        <Navbar />
      </header>
      <main id="main-content" className="flex-1" role="main">
        <PageTransition>{children}</PageTransition>
      </main>
      <footer role="contentinfo">
        <Footer />
      </footer>
    </>
  );
}
