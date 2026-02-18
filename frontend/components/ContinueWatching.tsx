'use client';

import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, X, Clock, Loader2, BookmarkCheck } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useContinueWatching } from '@/hooks/queries';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const MotionDiv = motion.div as any;

export function ContinueWatching() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);
  const queryClient = useQueryClient();

  const { data: progressItems, isLoading } = useContinueWatching();

  const updateArrows = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeft(scrollLeft > 10);
    setShowRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  useEffect(() => {
    updateArrows();
    const el = scrollRef.current;
    el?.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows, { passive: true });
    return () => {
      el?.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, [progressItems]);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -380 : 380, behavior: 'smooth' });
  };

  const handleRemove = async (e: React.MouseEvent, itemId: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.delete(`/interactions/watch-progress/${itemId}`);
      queryClient.invalidateQueries({ queryKey: ['watchProgress', 'continue'] });
      toast.success('Removed from history');
    } catch {
      toast.error('Failed to remove');
    }
  };

  if (isLoading) {
    return (
      <section className="py-10 container mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
            <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
          </div>
          <div className="h-6 w-44 bg-[var(--bg-secondary)] animate-pulse rounded" />
        </div>
      </section>
    );
  }

  if (!progressItems || progressItems.length === 0) return null;

  return (
    <section className="py-12 group/section animate-fade-in-up stagger-1">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-7">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <Clock className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white" style={{ fontFamily: 'var(--font-display)' }}>
                Continue Watching
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Pick up right where you left off</p>
            </div>
          </div>

          <div className="flex gap-1.5 opacity-0 group-hover/section:opacity-100 transition-opacity">
            <button onClick={() => scroll('left')} disabled={!showLeft}
              className="w-8 h-8 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-muted)] hover:text-white hover:border-violet-500/40 hover:bg-violet-500/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => scroll('right')} disabled={!showRight}
              className="w-8 h-8 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-muted)] hover:text-white hover:border-violet-500/40 hover:bg-violet-500/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto scrollbar-hide pb-3"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {progressItems.map((item) => (
            <MotionDiv
              key={item.id}
              className="group/card relative flex-shrink-0"
              style={{ width: 320, scrollSnapAlign: 'start' }}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <Link href={`/anime/${item.anime.slug}/watch?episode=${item.episode.episode}`}>
                {/* 16:9 card */}
                <div className="relative rounded-xl overflow-hidden border border-[var(--border)] group-hover/card:border-violet-500/30 transition-all shadow-lg group-hover/card:shadow-violet-500/10 group-hover/card:shadow-xl"
                  style={{ aspectRatio: '16/9' }}>
                  <img
                    src={item.anime.poster_url}
                    alt={item.anime.title}
                    className="w-full h-full object-cover opacity-80 group-hover/card:opacity-100 transition-all duration-500 group-hover/card:scale-105"
                  />

                  {/* Gradient overlay */}
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(7,7,16,0.95) 0%, rgba(7,7,16,0.3) 60%, transparent 100%)' }} />

                  {/* Watch later badge */}
                  {item.percentage < 10 && (
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-600/80 backdrop-blur-sm text-[10px] font-black text-white">
                      <BookmarkCheck className="h-3 w-3" />
                      Watch Later
                    </div>
                  )}

                  {/* Time remaining */}
                  <div className="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur-md text-[10px] font-bold text-white px-2 py-1 rounded-lg border border-white/10">
                    {Math.floor((item.total_seconds - item.position_seconds) / 60)}m left
                  </div>

                  {/* Progress bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                    <div
                      className="h-full progress-shimmer rounded-r-full transition-all duration-1000"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>

                  {/* Hover — play button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all duration-250">
                    <div className="flex items-center gap-3">
                      <div className="p-3.5 rounded-full bg-violet-600/90 backdrop-blur-sm shadow-2xl shadow-violet-500/40 scale-90 group-hover/card:scale-100 transition-transform duration-200">
                        <Play className="h-6 w-6 fill-current text-white ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={(e) => handleRemove(e, item.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover/card:opacity-100 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm text-[var(--text-muted)] hover:text-white hover:bg-red-500/80 flex items-center justify-center transition-all border border-white/10"
                    style={{ top: item.percentage < 10 ? '2.5rem' : undefined }}
                    aria-label="Remove from history"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Card footer */}
                <div className="mt-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-white group-hover/card:text-violet-400 transition-colors line-clamp-1" style={{ fontFamily: 'var(--font-display)' }}>
                      {item.anime.title}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Episode {item.episode.episode} · {Math.round(item.percentage)}% watched
                    </p>
                  </div>
                  {/* Resume button */}
                  <div className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 group-hover/card:bg-violet-500/20 transition-all">
                    <Play className="h-2.5 w-2.5 fill-current" />
                    Resume
                  </div>
                </div>
              </Link>
            </MotionDiv>
          ))}
        </div>
      </div>
    </section>
  );
}
