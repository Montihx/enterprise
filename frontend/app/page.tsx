'use client';

import { Hero } from '@/components/Hero';
import { ContinueWatching } from '@/components/ContinueWatching';
import { FeaturedSection } from '@/components/FeaturedSection';
import { HorizontalSection } from '@/components/HorizontalSection';
import { Top10Section } from '@/components/Top10Section';
import { AnimeCard } from '@/components/AnimeCard';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import {
  Flame, Sparkles, Clock, Star, ChevronRight, TrendingUp, Calendar
} from 'lucide-react';
import { useAnimeList } from '@/hooks/queries';

export default function Home() {
  const { data: trendingResponse, isLoading: trendingLoading } = useAnimeList({ limit: 14, min_score: 8.0 });
  const { data: ongoingResponse, isLoading: ongoingLoading } = useAnimeList({ limit: 14, status: 'ongoing' });
  const { data: recentResponse, isLoading: recentLoading } = useAnimeList({ limit: 14 });

  const trendingAnime = trendingResponse?.data || [];
  const ongoingAnime = ongoingResponse?.data || [];
  const recentAnime = recentResponse?.data || [];

  return (
    <div className="pb-16">
      {/* Hero with autoplay, parallax, mute */}
      <Hero />

      {/* Continue Watching (horizontal scroll) */}
      <ContinueWatching />

      {/* Trending — horizontal scroll with arrows */}
      <div className="border-b border-[var(--border)]">
        <HorizontalSection
          title="Trending Now"
          subtitle="Most popular titles this week"
          icon={<Flame className="w-5 h-5 text-red-400" />}
          badge="HOT"
          isLoading={trendingLoading}
          items={trendingAnime}
          showNew={false}
          viewAllHref="/catalog?min_score=8"
        />
      </div>

      {/* New This Week — horizontal scroll with "NEW" badges */}
      <div className="bg-[var(--bg-secondary)]/30 border-b border-[var(--border)]">
        <HorizontalSection
          title="New This Week"
          subtitle="Fresh simulcasts and recent additions"
          icon={<Sparkles className="w-5 h-5 text-green-400" />}
          badge="NEW"
          isLoading={recentLoading}
          items={recentAnime}
          showNew={true}
          viewAllHref="/catalog"
        />
      </div>

      {/* Featured — 3D flip cards */}
      <FeaturedSection />

      {/* Top 10 + Ongoing side by side on desktop */}
      <div className="border-t border-[var(--border)] bg-[var(--bg-secondary)]/20">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 xl:gap-12">
            {/* Top 10 — takes 2 columns */}
            <div className="xl:col-span-2">
              <Top10Section />
            </div>

            {/* Ongoing section — takes 3 columns */}
            <div className="xl:col-span-3">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 rounded-xl bg-green-500/10 border border-green-500/20">
                  <Clock className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white" style={{ fontFamily: 'var(--font-display)' }}>
                    Currently Airing
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">Live simulcasts from Japan</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {ongoingLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="aspect-[2/3] w-full rounded-xl bg-[var(--bg-secondary)]" />
                      <Skeleton className="h-3.5 w-3/4 rounded bg-[var(--bg-secondary)]" />
                    </div>
                  ))
                ) : ongoingAnime.slice(0, 6).map((anime) => (
                  <AnimeCard key={anime.id} anime={anime} isNew />
                ))}
              </div>
              {!ongoingLoading && ongoingAnime.length > 6 && (
                <div className="mt-6 text-center">
                  <Link href="/catalog?status=ongoing"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--border)] text-sm font-bold text-[var(--text-secondary)] hover:text-white hover:border-violet-500/40 hover:bg-violet-500/5 transition-all">
                    View All Ongoing
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Browse by genre quick links */}
      <section className="py-14 container mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <Star className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white" style={{ fontFamily: 'var(--font-display)' }}>Browse by Genre</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Find your next obsession</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {[
            { label: '⚔️ Action', href: '/catalog?genre=Action', color: '#ef4444' },
            { label: '💕 Romance', href: '/catalog?genre=Romance', color: '#ec4899' },
            { label: '🚀 Sci-Fi', href: '/catalog?genre=Sci-Fi', color: '#3b82f6' },
            { label: '😱 Horror', href: '/catalog?genre=Horror', color: '#a855f7' },
            { label: '😂 Comedy', href: '/catalog?genre=Comedy', color: '#f59e0b' },
            { label: '🎭 Drama', href: '/catalog?genre=Drama', color: '#14b8a6' },
            { label: '⚡ Fantasy', href: '/catalog?genre=Fantasy', color: '#8b5cf6' },
            { label: '🏆 Sports', href: '/catalog?genre=Sports', color: '#22c55e' },
            { label: '🕵️ Mystery', href: '/catalog?genre=Mystery', color: '#6366f1' },
            { label: '🤖 Mecha', href: '/catalog?genre=Mecha', color: '#06b6d4' },
          ].map((g) => (
            <Link key={g.href} href={g.href}>
              <button
                className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm font-bold text-[var(--text-secondary)] hover:text-white hover:scale-105 transition-all"
                style={{ background: `${g.color}10`, borderColor: `${g.color}25` }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = `${g.color}20`;
                  (e.currentTarget as HTMLElement).style.borderColor = `${g.color}50`;
                  (e.currentTarget as HTMLElement).style.color = g.color;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = `${g.color}10`;
                  (e.currentTarget as HTMLElement).style.borderColor = `${g.color}25`;
                  (e.currentTarget as HTMLElement).style.color = '';
                }}
              >
                {g.label}
              </button>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
