'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Flame, Star, Play, Info, TrendingUp, Award } from 'lucide-react';
import { useAnimeList } from '@/hooks/queries';

const MotionDiv = motion.div as any;

const PARTICLES = ['✦', '⋆', '✧', '·', '✦'];

function ParticleEffect({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="particle absolute text-xs bottom-0"
          style={{ left: `${15 + i * 18}%`, color, animationDelay: `${i * 0.4}s` }}
        >
          {p}
        </span>
      ))}
    </div>
  );
}

interface FeaturedCardProps {
  anime: {
    id: string;
    slug: string;
    title: string;
    poster_url: string;
    score: number;
    year: number;
    kind: string;
    genres: string[];
    description?: string;
  };
  rank: number;
}

function FeaturedCard({ anime, rank }: FeaturedCardProps) {
  const [flipped, setFlipped] = useState(false);

  const accentColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];
  const color = accentColors[rank % accentColors.length];

  return (
    <div
      className="card-flip-container w-full aspect-[3/4]"
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
    >
      <div className={`card-flip-inner w-full h-full rounded-2xl ${flipped ? '[transform:rotateY(180deg)]' : ''}`}
        style={{ transition: 'transform 0.7s cubic-bezier(0.4,0,0.2,1)', transformStyle: 'preserve-3d', position: 'relative' }}>

        {/* Front face */}
        <div className="card-face w-full h-full rounded-2xl overflow-hidden relative border border-[var(--border)]"
          style={{ backfaceVisibility: 'hidden' }}>
          <img
            src={anime.poster_url}
            alt={anime.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(7,7,16,0.95) 0%, rgba(7,7,16,0.4) 50%, transparent 100%)' }} />

          {/* Rank badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black text-white"
              style={{ background: color, boxShadow: `0 4px 16px ${color}60` }}>
              #{rank + 1}
            </div>
          </div>

          {/* Score */}
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-xs font-black text-yellow-400">
            <Star className="h-3 w-3 fill-current" />
            {anime.score?.toFixed(1)}
          </div>

          {/* Flame icon for top 3 */}
          {rank < 3 && (
            <div className="absolute top-14 left-3 animate-flame text-2xl">🔥</div>
          )}

          <ParticleEffect color={color} />

          {/* Bottom info */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-black text-white text-base leading-tight line-clamp-2 mb-1"
              style={{ fontFamily: 'var(--font-display)' }}>
              {anime.title}
            </h3>
            <p className="text-xs text-[var(--text-muted)] font-medium">
              {anime.kind?.toUpperCase()} · {anime.year}
            </p>
          </div>
        </div>

        {/* Back face */}
        <div
          className="card-back w-full h-full rounded-2xl overflow-hidden border"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: 'var(--bg-card)',
            borderColor: `${color}40`,
          }}
        >
          {/* Gradient border glow */}
          <div className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ boxShadow: `inset 0 0 40px ${color}15` }} />

          <div className="h-full flex flex-col p-5">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color }}>
                  Featured #{rank + 1}
                </p>
                <h3 className="font-black text-white text-lg leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
                  {anime.title}
                </h3>
              </div>
              <div className="flex items-center gap-1 text-yellow-400">
                <Star className="h-4 w-4 fill-current" />
                <span className="text-sm font-black">{anime.score?.toFixed(1)}</span>
              </div>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {anime.genres?.slice(0, 4).map((g) => (
                <span key={g} className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border"
                  style={{ background: `${color}15`, borderColor: `${color}30`, color }}>
                  {g}
                </span>
              ))}
            </div>

            {/* Description */}
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed flex-1 line-clamp-5">
              {anime.description || 'An outstanding anime title that has captivated audiences worldwide with its compelling storyline and exceptional animation quality.'}
            </p>

            {/* Actions */}
            <div className="flex gap-2 pt-4 mt-auto">
              <Link href={`/anime/${anime.slug}/watch`} className="flex-1">
                <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:scale-105"
                  style={{ background: color, boxShadow: `0 4px 20px ${color}40` }}>
                  <Play className="h-4 w-4 fill-current" />
                  Watch
                </button>
              </Link>
              <Link href={`/anime/${anime.slug}`}>
                <button className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold border border-[var(--border)] hover:bg-white/5 transition-all">
                  <Info className="h-4 w-4" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FeaturedSection() {
  const { data, isLoading } = useAnimeList({ limit: 6, min_score: 8.5 });
  const animeList = data?.data || [];

  if (isLoading) return null;
  if (animeList.length < 3) return null;

  return (
    <section className="py-16 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent 70%)' }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-5 w-5 text-yellow-500" />
              <p className="text-xs font-black uppercase tracking-widest text-yellow-500">Hall of Fame</p>
            </div>
            <h2 className="text-3xl font-black text-white" style={{ fontFamily: 'var(--font-display)' }}>
              Featured Picks
            </h2>
            <p className="text-sm text-[var(--text-muted)] mt-1">Hover to flip and discover — our handpicked selection</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {animeList.slice(0, 6).map((anime, i) => (
            <FeaturedCard key={anime.id} anime={anime} rank={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
