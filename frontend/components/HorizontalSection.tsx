'use client';

import { useRef, useState, useEffect, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimeCard } from './AnimeCard';
import { Skeleton } from './ui/skeleton';

const MotionDiv = motion.div as any;

interface HorizontalSectionProps {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  badge?: string;
  isLoading: boolean;
  items: any[];
  showRanks?: boolean;
  showNew?: boolean;
  viewAllHref?: string;
}

export function HorizontalSection({
  title,
  subtitle,
  icon,
  badge,
  isLoading,
  items,
  showRanks = false,
  showNew = false,
  viewAllHref,
}: HorizontalSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

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
  }, [items]);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -360 : 360, behavior: 'smooth' });
  };

  return (
    <section className="py-12 group/section animate-fade-in-up">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border)]">
              {icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white" style={{ fontFamily: 'var(--font-display)' }}>
                  {title}
                </h2>
                {badge && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-gradient-to-r from-violet-600 to-pink-600 text-white">
                    {badge}
                  </span>
                )}
              </div>
              {subtitle && <p className="text-xs text-[var(--text-muted)] mt-0.5 font-medium">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Arrow navigation */}
            <div className="flex gap-1.5 opacity-0 group-hover/section:opacity-100 transition-opacity">
              <button
                onClick={() => scroll('left')}
                disabled={!showLeft}
                className="w-8 h-8 rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-muted)] hover:text-white hover:border-violet-500/40 hover:bg-violet-500/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => scroll('right')}
                disabled={!showRight}
                className="w-8 h-8 rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-muted)] hover:text-white hover:border-violet-500/40 hover:bg-violet-500/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {viewAllHref && (
              <a href={viewAllHref} className="text-xs font-bold text-[var(--text-muted)] hover:text-violet-400 transition-colors flex items-center gap-1">
                View all <ChevronRight className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Scroll container */}
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto scrollbar-hide pb-2"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-44 space-y-3" style={{ scrollSnapAlign: 'start' }}>
                <Skeleton className="aspect-[2/3] w-full rounded-xl bg-[var(--bg-secondary)]" />
                <Skeleton className="h-3.5 w-3/4 rounded bg-[var(--bg-secondary)]" />
                <Skeleton className="h-3 w-1/2 rounded bg-[var(--bg-secondary)]" />
              </div>
            ))
          ) : items.length > 0 ? (
            items.map((anime, i) => (
              <div key={anime.id} className="flex-shrink-0 w-44" style={{ scrollSnapAlign: 'start' }}>
                <AnimeCard
                  anime={anime}
                  rank={showRanks ? i + 1 : undefined}
                  isNew={showNew && i < 3}
                />
              </div>
            ))
          ) : (
            <div className="w-full py-16 text-center text-[var(--text-muted)] border border-dashed border-[var(--border)] rounded-xl">
              No titles available
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
