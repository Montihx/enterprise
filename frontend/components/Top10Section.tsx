'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star, Play, TrendingUp } from 'lucide-react';
import { useAnimeList } from '@/hooks/queries';
import { Skeleton } from './ui/skeleton';

const MotionDiv = motion.div as any;

export function Top10Section() {
  const { data, isLoading } = useAnimeList({ limit: 10, min_score: 7.5 });
  const items = data?.data || [];

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/20">
            <TrendingUp className="h-5 w-5 text-yellow-500" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white" style={{ fontFamily: 'var(--font-display)' }}>
              Top 10 This Week
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Ranked by popularity and score</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {isLoading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                <Skeleton className="w-10 h-10 rounded-lg bg-[var(--bg-tertiary)]" />
                <Skeleton className="w-14 h-20 rounded-lg bg-[var(--bg-tertiary)]" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4 rounded bg-[var(--bg-tertiary)]" />
                  <Skeleton className="h-3 w-1/2 rounded bg-[var(--bg-tertiary)]" />
                </div>
              </div>
            ))
          ) : items.map((anime, i) => {
            const rankColors = ['#ef4444', '#f97316', '#eab308'];
            const rankColor = rankColors[i] || 'var(--text-muted)';
            const isTop3 = i < 3;

            return (
              <MotionDiv
                key={anime.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/anime/${anime.slug}`} className="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-violet-500/30 hover:bg-[var(--bg-tertiary)] transition-all group">
                  {/* Rank number */}
                  <div className="w-10 flex-shrink-0 text-center">
                    <span
                      className="text-2xl font-black"
                      style={{
                        fontFamily: 'var(--font-display)',
                        color: isTop3 ? rankColor : 'var(--text-muted)',
                        textShadow: isTop3 ? `0 0 20px ${rankColor}60` : 'none',
                      }}
                    >
                      {i + 1}
                    </span>
                  </div>

                  {/* Poster */}
                  <div className="w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-[var(--bg-tertiary)]">
                    <img src={anime.poster_url} alt={anime.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-white group-hover:text-violet-400 transition-colors line-clamp-1" style={{ fontFamily: 'var(--font-display)' }}>
                      {anime.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-[var(--text-muted)]">
                      <span>{anime.kind?.toUpperCase()}</span>
                      <span>·</span>
                      <span>{anime.year}</span>
                      {anime.score > 0 && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-0.5 text-yellow-500 font-bold">
                            <Star className="h-3 w-3 fill-current" />
                            {anime.score?.toFixed(1)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Play icon */}
                  <div className="w-8 h-8 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-[var(--border)] group-hover:border-violet-500/30 group-hover:bg-violet-500/10">
                    <Play className="h-3.5 w-3.5 text-violet-400 fill-current ml-0.5" />
                  </div>
                </Link>
              </MotionDiv>
            );
          })}
        </div>
      </div>
    </section>
  );
}
