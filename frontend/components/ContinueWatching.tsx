
'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, X, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useContinueWatching } from '@/hooks/queries';

// Fix: Casting motion components to any to avoid type errors
const MotionDiv = motion.div as any;

export function ContinueWatching() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const { data: progressItems, isLoading } = useContinueWatching();

  const updateArrows = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeft(scrollLeft > 10);
    setShowRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  useEffect(() => {
    updateArrows();
    window.addEventListener('resize', updateArrows);
    return () => window.removeEventListener('resize', updateArrows);
  }, [progressItems]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 400; 
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  if (isLoading) {
    return (
      <section className="py-12 container mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
           <div className="p-2 bg-bg-secondary rounded-lg">
             <Loader2 className="w-6 h-6 animate-spin text-accent-primary" />
           </div>
           <div className="h-8 w-48 bg-bg-secondary animate-pulse rounded" />
        </div>
      </section>
    );
  }

  if (!progressItems || progressItems.length === 0) return null;
  
  return (
    <section className="py-12 container mx-auto px-4 group/section animate-in fade-in duration-700">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent-primary/20 rounded-lg text-accent-primary border border-accent-primary/20">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Continue Watching</h2>
            <p className="text-text-muted text-sm mt-0.5">Pick up right where you left off</p>
          </div>
        </div>
        <div className="flex gap-2 opacity-0 group-hover/section:opacity-100 transition-opacity">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => scroll('left')}
            disabled={!showLeft}
            className="rounded-full border-border bg-bg-secondary hover:bg-accent-primary hover:text-white transition-all disabled:opacity-20"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => scroll('right')}
            disabled={!showRight}
            className="rounded-full border-border bg-bg-secondary hover:bg-accent-primary hover:text-white transition-all disabled:opacity-20"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      <div
        ref={scrollRef}
        onScroll={updateArrows}
        className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4 custom-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {progressItems.map((item) => (
          <MotionDiv
            key={item.id}
            className="group relative flex-shrink-0 w-[340px]"
            whileHover={{ y: -4 }}
          >
            <Link href={`/anime/${item.anime.slug}/watch?episode=${item.episode.episode}`}>
              <div className="relative aspect-video overflow-hidden rounded-xl bg-bg-secondary border border-border shadow-xl">
                <img
                  src={item.anime.poster_url}
                  alt={item.anime.title}
                  className="h-full w-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105"
                />
                
                <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-[10px] font-bold text-white px-1.5 py-0.5 rounded border border-white/10">
                  {Math.floor(item.total_seconds / 60)}:00
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10 overflow-hidden">
                  <div 
                    className="h-full bg-accent-primary shadow-[0_0_10px_rgba(139,92,246,0.8)] transition-all duration-1000" 
                    style={{ width: `${item.percentage}%` }} 
                  />
                </div>
                
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
                  <div className="bg-accent-primary p-4 rounded-full shadow-2xl scale-75 group-hover:scale-100 transition-transform">
                    <Play className="h-8 w-8 fill-current text-white ml-1" />
                  </div>
                </div>
                
                <button
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all rounded-full h-8 w-8 bg-black/50 backdrop-blur-md text-white hover:bg-accent-danger hover:scale-110 flex items-center justify-center border border-white/10"
                  onClick={(e) => {
                    e.preventDefault();
                    // Optional: Call delete API here
                  }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <div className="mt-4 flex justify-between items-start">
                <div className="min-w-0">
                  <h3 className="font-bold text-white text-lg group-hover:text-accent-primary transition-colors line-clamp-1">
                    {item.anime.title}
                  </h3>
                  <p className="text-sm font-medium text-text-muted mt-0.5 truncate">
                    Episode {item.episode.episode} <span className="mx-1.5 opacity-30">•</span> {Math.round(item.percentage)}% Watched
                  </p>
                </div>
              </div>
            </Link>
          </MotionDiv>
        ))}
      </div>
    </section>
  );
}
