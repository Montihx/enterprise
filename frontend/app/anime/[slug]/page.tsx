
'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { AnimeInfo } from '@/components/AnimeInfo';
import { Comments } from '@/components/Comments';
import { Loader2, AlertTriangle, ChevronLeft } from 'lucide-react';
import { useAnime } from '@/hooks/queries';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { motion } from 'framer-motion';

// Metadata is handled by Next.js Server Components, but since this is a 'use client' 
// for the vertical slice, we ensure the UI handles the title and information correctly.

// Fix: Casting motion components to any to avoid type errors
const MotionDiv = motion.div as any;

export default function AnimePage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const { data: anime, isLoading, isError } = useAnime(slug);

  // Update document title for SEO on client side
  React.useEffect(() => {
    if (anime?.title) {
      document.title = `${anime.title} | Watch Online | Kitsu Enterprise`;
    }
  }, [anime]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-bg-primary">
        <Loader2 className="h-10 w-10 animate-spin text-accent-primary" />
        <p className="text-text-muted animate-pulse font-black uppercase tracking-widest text-xs">Accessing Grid Registry</p>
      </div>
    );
  }

  if (isError || !anime) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 space-y-6">
        <div className="p-6 bg-accent-warning/10 rounded-full border border-accent-warning/20">
          <AlertTriangle className="h-16 w-16 text-accent-warning" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white tracking-tight uppercase">Title De-indexed</h2>
          <p className="text-text-muted max-w-md mx-auto text-sm leading-relaxed font-medium">
            The requested node is not present in the current cluster topology. It may have been archived or purged.
          </p>
        </div>
        <Link href="/catalog">
          <Button size="lg" className="h-12 px-8 font-bold bg-accent-primary hover:bg-accent-primary/90 rounded-xl">
            <ChevronLeft className="mr-2 h-5 w-5" /> Return to Catalog
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <MotionDiv 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-bg-primary"
    >
      <AnimeInfo anime={{
        ...anime,
        genres: anime.genres || [],
        studios: anime.studios || [],
        rating: anime.rating || 'N/A',
        description: anime.description || 'No detailed log provided for this entity.',
        status: anime.status || 'Unknown',
        episodes_aired: anime.episodes_aired || 0,
        score: anime.score || 0,
      }} />
      
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl">
          <div className="flex items-center gap-4 mb-12">
            <div className="h-12 w-1.5 bg-accent-primary rounded-full shadow-[0_0_15px_rgba(139,92,246,0.5)]" />
            <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Terminal Feed</h2>
            <div className="flex-1 border-b border-white/5 ml-2" />
          </div>
          <Comments animeId={anime.id} />
        </div>
      </section>
    </MotionDiv>
  );
}
