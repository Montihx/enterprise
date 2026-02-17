'use client';

import { Hero } from '@/components/Hero';
import { ContinueWatching } from '@/components/ContinueWatching';
import { AnimeCard } from '@/components/AnimeCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { ChevronRight, Flame, Sparkles } from 'lucide-react';
import { useAnimeList } from '@/hooks/queries';

export default function Home() {
  const { data: trendingResponse, isLoading: trendingLoading } = useAnimeList({ 
    limit: 10,
    min_score: 8.0 
  });

  const { data: ongoingResponse, isLoading: ongoingLoading } = useAnimeList({ 
    limit: 10,
    status: 'ongoing'
  });

  const trendingAnime = trendingResponse?.data || [];
  const ongoingAnime = ongoingResponse?.data || [];

  return (
    <div className="pb-20">
      <Hero />
      
      {/* User Progress Section */}
      <ContinueWatching />

      {/* Trending Section */}
      <section className="py-12 container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-danger/20 rounded-lg">
              <Flame className="w-6 h-6 text-accent-danger" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Trending Now</h2>
              <p className="text-text-muted text-sm mt-0.5">Most popular titles this week</p>
            </div>
          </div>
          <Link href="/catalog?min_score=8">
            <Button variant="ghost" className="text-accent-primary hover:bg-accent-primary/10 font-bold">
              Explore All <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {trendingLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-[2/3] w-full rounded-2xl" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))
          ) : trendingAnime.length > 0 ? (
            trendingAnime.slice(0, 5).map((anime) => (
              <AnimeCard key={anime.id} anime={anime} />
            ))
          ) : (
            <div className="col-span-full text-center py-20 bg-bg-secondary/50 border border-dashed border-border rounded-2xl">
              <p className="text-text-muted font-medium">No trending titles found.</p>
            </div>
          )}
        </div>
      </section>

      {/* New Releases Section */}
      <section className="py-20 bg-bg-secondary/20 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent-success/20 rounded-lg">
                <Sparkles className="w-6 h-6 text-accent-success" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Latest Simulcasts</h2>
                <p className="text-text-muted text-sm mt-0.5">Freshly updated series from Japan</p>
              </div>
            </div>
            <Link href="/catalog?status=ongoing">
              <Button variant="ghost" className="text-accent-primary hover:bg-accent-primary/10 font-bold">
                Full Schedule <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
             {ongoingLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-[2/3] w-full rounded-2xl" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))
            ) : ongoingAnime.length > 0 ? (
              ongoingAnime.slice(0, 5).map((anime) => (
                <AnimeCard key={anime.id} anime={anime} />
              ))
            ) : (
              <div className="col-span-full text-center py-20 border border-dashed border-border rounded-2xl bg-bg-primary/50">
                <p className="text-text-muted font-medium">No ongoing titles found.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
