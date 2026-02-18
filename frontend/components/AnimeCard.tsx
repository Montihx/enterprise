'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Play, Bookmark, Share2, Heart, Star, TrendingUp, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AnimeCardProps {
  anime: {
    id: string;
    slug: string;
    title: string;
    poster_url: string;
    score: number;
    year: number;
    kind: string;
    episodes_total: number;
    genres: string[];
    status?: string;
    episodes_aired?: number;
  };
  rank?: number;
  watchProgress?: number;
  isNew?: boolean;
}

const MotionDiv = motion.div as any;

export function AnimeCard({ anime, rank, watchProgress, isNew }: AnimeCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const scoreColor = anime.score >= 8.5
    ? '#10b981'
    : anime.score >= 7
    ? '#d97706'
    : '#ef4444';

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLiked(!liked);
    toast(liked ? 'Removed from liked' : 'Added to liked ❤️', { duration: 1500 });
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBookmarked(!bookmarked);
    toast(bookmarked ? 'Removed from watchlist' : 'Added to watchlist 🔖', { duration: 1500 });
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({ title: anime.title, url: `/anime/${anime.slug}` });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/anime/${anime.slug}`);
      toast('Link copied to clipboard 🔗', { duration: 1500 });
    }
  };

  return (
    <MotionDiv
      className="group relative w-full"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {/* Rank number overlay (Top-10 style) */}
      {rank !== undefined && (
        <div className="absolute -left-3 -bottom-2 z-20 text-[4rem] font-black leading-none select-none pointer-events-none"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'transparent',
            WebkitTextStroke: '2px rgba(124,58,237,0.4)',
          }}>
          {rank}
        </div>
      )}

      {/* New badge */}
      {isNew && (
        <div className="absolute -top-2 -right-2 z-20 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-lg">
          NEW
        </div>
      )}

      <Link href={`/anime/${anime.slug}`} className="block">
        <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] group-hover:border-violet-500/30 transition-all duration-300 shadow-lg group-hover:shadow-violet-500/20 group-hover:shadow-2xl">
          {/* Poster */}
          <img
            src={anime.poster_url || 'https://via.placeholder.com/300x450/1a1a2e/7c3aed?text=No+Image'}
            alt={anime.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-108"
            loading="lazy"
          />

          {/* Score badge — top right */}
          <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 px-2 py-1 rounded-lg backdrop-blur-md border text-xs font-black"
            style={{ background: 'rgba(0,0,0,0.7)', borderColor: `${scoreColor}40`, color: scoreColor }}>
            <Star className="w-3 h-3 fill-current" />
            {anime.score?.toFixed(1) || 'N/A'}
          </div>

          {/* Type badge — top left */}
          <div className="absolute top-2.5 left-2.5 z-10 px-2 py-1 rounded-lg backdrop-blur-md bg-black/60 border border-white/10 text-[10px] font-black uppercase tracking-wider text-white/80">
            {anime.kind?.toUpperCase() || 'TV'}
          </div>

          {/* Ongoing indicator */}
          {anime.status === 'ongoing' && (
            <div className="absolute top-9 left-2.5 z-10 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-green-500/20 border border-green-500/30 text-[10px] font-black text-green-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Airing
            </div>
          )}

          {/* Info panel — slides up from bottom on hover */}
          <div className={cn(
            'absolute inset-x-0 bottom-0 transition-all duration-350 ease-out',
            isHovered ? 'translate-y-0' : 'translate-y-full'
          )}>
            <div className="px-4 py-4 space-y-3" style={{ background: 'linear-gradient(to top, rgba(7,7,16,0.98) 0%, rgba(7,7,16,0.92) 100%)' }}>
              {/* Genres */}
              <div className="flex flex-wrap gap-1">
                {anime.genres?.slice(0, 3).map((g) => (
                  <span key={g} className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-violet-500/20 text-violet-400 border border-violet-500/20">
                    {g}
                  </span>
                ))}
              </div>

              {/* Quick action buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLike}
                    className={cn(
                      'p-2 rounded-lg transition-all hover:scale-110',
                      liked ? 'bg-pink-500/20 text-pink-400' : 'bg-white/10 text-white/60 hover:text-pink-400'
                    )}
                  >
                    <Heart className={cn('h-3.5 w-3.5', liked && 'fill-current')} />
                  </button>
                  <button
                    onClick={handleBookmark}
                    className={cn(
                      'p-2 rounded-lg transition-all hover:scale-110',
                      bookmarked ? 'bg-violet-500/20 text-violet-400' : 'bg-white/10 text-white/60 hover:text-violet-400'
                    )}
                  >
                    <Bookmark className={cn('h-3.5 w-3.5', bookmarked && 'fill-current')} />
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-2 rounded-lg bg-white/10 text-white/60 hover:text-blue-400 transition-all hover:scale-110"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Play button */}
                <Link href={`/anime/${anime.slug}/watch`} onClick={(e) => e.stopPropagation()}>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all hover:scale-105">
                    <Play className="h-3 w-3 fill-current" />
                    Watch
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Center play on hover (above info panel) */}
          <div className={cn(
            'absolute inset-0 flex items-center justify-center transition-all duration-300',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}>
            <div className="p-4 rounded-full bg-violet-600/90 shadow-2xl shadow-violet-500/40 scale-75 group-hover:scale-100 transition-transform duration-300">
              <Play className="h-7 w-7 fill-current text-white ml-0.5" />
            </div>
          </div>

          {/* Watch progress bar */}
          {watchProgress !== undefined && watchProgress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
              <div
                className="h-full progress-shimmer rounded-full"
                style={{ width: `${watchProgress}%` }}
              />
            </div>
          )}
        </div>

        {/* Card info below poster */}
        <div className="mt-3 space-y-1 px-0.5">
          <h3 className="font-bold text-sm leading-snug text-[var(--text-primary)] group-hover:text-violet-400 transition-colors line-clamp-2" style={{ fontFamily: 'var(--font-display)' }}>
            {anime.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-medium">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {anime.year || '—'}
            </span>
            {anime.episodes_total > 0 && (
              <>
                <span className="w-0.5 h-0.5 rounded-full bg-[var(--text-muted)]" />
                <span>{anime.episodes_total} ep</span>
              </>
            )}
            {anime.status === 'ongoing' && anime.episodes_aired && (
              <>
                <span className="w-0.5 h-0.5 rounded-full bg-[var(--text-muted)]" />
                <span className="text-green-400">{anime.episodes_aired} aired</span>
              </>
            )}
          </div>
        </div>
      </Link>
    </MotionDiv>
  );
}
