'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Play, 
  Star, 
  Calendar, 
  Clock, 
  Layers, 
  Share2, 
  Plus, 
  Check, 
  Flame, 
  Loader2,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useToggleFavorite } from '@/hooks/mutations';
import { useFavorites } from '@/hooks/queries';
import { toast } from 'sonner';

interface AnimeInfoProps {
  anime: {
    id: string;
    slug: string;
    title: string;
    title_en?: string;
    title_jp?: string;
    description: string;
    poster_url: string;
    cover_url?: string;
    score: number;
    kind: string;
    status: string;
    year: number;
    episodes_total: number;
    episodes_aired: number;
    duration?: number;
    genres: string[];
    studios: string[];
    rating: string;
  };
}

const MotionDiv = motion.div as any;
const MotionH1 = motion.h1 as any;

const LIST_CATEGORIES = [
  { id: 'watching', label: 'Watching', color: 'text-accent-primary' },
  { id: 'completed', label: 'Completed', color: 'text-accent-success' },
  { id: 'planned', label: 'Plan to Watch', color: 'text-text-muted' },
  { id: 'dropped', label: 'Dropped', color: 'text-accent-danger' },
  { id: 'on_hold', label: 'On Hold', color: 'text-accent-warning' },
];

export function AnimeInfo({ anime }: AnimeInfoProps) {
  const { data: userFavorites } = useFavorites();
  const toggleFavorite = useToggleFavorite();
  
  const currentFavorite = userFavorites?.find(f => f.anime_id === anime.id);

  const handleUpdateList = (category: string) => {
    toggleFavorite.mutate({ anime_id: anime.id, category });
  };

  return (
    <div className="relative w-full overflow-hidden">
      {/* Panoramic Cover Background */}
      <div className="absolute inset-0 h-[650px] -z-10">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000"
          style={{ 
            backgroundImage: `url(${anime.cover_url || anime.poster_url})`,
            filter: 'blur(20px) brightness(0.4) saturate(1.2)' 
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg-primary via-transparent to-bg-primary" />
      </div>

      <div className="container mx-auto px-4 pt-32 pb-16">
        <div className="flex flex-col lg:flex-row gap-12 lg:items-start">
          
          {/* Main Visual Column */}
          <div className="w-full lg:w-[350px] space-y-6 shrink-0">
            <MotionDiv 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="relative aspect-[2/3] rounded-2xl overflow-hidden border border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)]"
            >
              <img 
                src={anime.poster_url} 
                alt={anime.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
              <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-1">
                 <div className="text-[10px] uppercase font-black text-white/60 tracking-[0.3em]">Aggregate Node</div>
                 <div className="text-lg font-bold text-white leading-tight uppercase tracking-tighter">Sovereign Asset</div>
              </div>
            </MotionDiv>
            
            <div className="grid grid-cols-1 gap-3">
              <Link href={`/anime/${anime.slug}/watch`}>
                <Button size="lg" className="w-full h-16 text-xl font-black tracking-wider shadow-2xl shadow-accent-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                  <Play className="mr-3 h-7 w-7 fill-current" /> WATCH NOW
                </Button>
              </Link>
              <div className="grid grid-cols-2 gap-3">
                <DropdownMenu>
                   <DropdownMenuTrigger asChild>
                    <Button variant="secondary" className={cn(
                      "h-14 font-bold bg-white/5 border-white/10 hover:bg-white/10 transition-all",
                      currentFavorite ? "text-accent-primary border-accent-primary/30" : "text-white"
                    )}>
                      {toggleFavorite.isPending ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : currentFavorite ? (
                        <Check className="mr-2 h-5 w-5" />
                      ) : (
                        <Plus className="mr-2 h-5 w-5" />
                      )}
                      {currentFavorite ? 'In List' : 'Add to List'}
                      <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
                    </Button>
                   </DropdownMenuTrigger>
                   <DropdownMenuContent className="bg-bg-secondary border-border min-w-[200px] rounded-2xl p-2 shadow-2xl">
                      {LIST_CATEGORIES.map(cat => (
                        <DropdownMenuItem 
                          key={cat.id} 
                          onClick={() => handleUpdateList(cat.id)}
                          className={cn(
                            "cursor-pointer rounded-xl h-10 px-4 font-bold text-xs uppercase tracking-widest flex items-center justify-between group",
                            currentFavorite?.category === cat.id ? "bg-accent-primary/10 text-white" : "text-text-muted hover:bg-white/5 hover:text-white"
                          )}
                        >
                          <span className={cn(cat.color)}>{cat.label}</span>
                          {currentFavorite?.category === cat.id && <Check className="h-4 w-4 text-accent-primary" />}
                        </DropdownMenuItem>
                      ))}
                   </DropdownMenuContent>
                </DropdownMenu>

                <Button 
                  variant="secondary" 
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success('Link copied to gateway clipboard');
                  }}
                  className="h-14 font-bold bg-white/5 border-white/10 text-white hover:bg-white/10"
                >
                  <Share2 className="mr-2 h-5 w-5" /> Share
                </Button>
              </div>
            </div>
          </div>

          {/* Metadata Column */}
          <div className="flex-1 space-y-10">
            <div className="space-y-4">
              <MotionDiv 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap items-center gap-3"
              >
                <Badge className="bg-accent-danger text-white uppercase text-[10px] font-black px-2 py-1 tracking-widest gap-1.5 border-0">
                  <Flame className="w-3 h-3" /> #5 Trending
                </Badge>
                <Badge variant="outline" className="border-accent-primary text-accent-primary uppercase text-[10px] font-black tracking-widest bg-accent-primary/5">
                  Top Rated
                </Badge>
              </MotionDiv>

              <MotionH1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl md:text-7xl font-black text-white leading-[0.95] tracking-tighter"
              >
                {anime.title}
              </MotionH1>
              
              <MotionDiv 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap items-center gap-6 text-text-muted text-lg font-bold"
              >
                {anime.title_en && <span className="text-white/80">{anime.title_en}</span>}
                {anime.title_jp && <span className="font-japanese opacity-40">{anime.title_jp}</span>}
              </MotionDiv>
            </div>

            {/* Cinematic Stats Section */}
            <div className="flex flex-wrap items-center gap-10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-accent-warning/20 flex items-center justify-center border border-accent-warning/30 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                  <Star className="h-8 w-8 text-accent-warning fill-accent-warning" />
                </div>
                <div>
                  <div className="text-2xl font-black text-white">{anime.score}</div>
                  <div className="text-xs uppercase font-black text-text-muted tracking-widest">Global Score</div>
                </div>
              </div>

              <div className="h-10 w-px bg-border hidden sm:block" />

              <div className="flex flex-wrap gap-8">
                <div className="space-y-1">
                   <div className="text-sm font-black text-text-muted uppercase tracking-widest flex items-center gap-2">
                     <Layers className="w-3.5 h-3.5" /> Type
                   </div>
                   <div className="text-lg font-bold text-white uppercase">{anime.kind}</div>
                </div>
                <div className="space-y-1">
                   <div className="text-sm font-black text-text-muted uppercase tracking-widest flex items-center gap-2">
                     <Calendar className="w-3.5 h-3.5" /> Year
                   </div>
                   <div className="text-lg font-bold text-white">{anime.year}</div>
                </div>
                <div className="space-y-1">
                   <div className="text-sm font-black text-text-muted uppercase tracking-widest flex items-center gap-2">
                     <Clock className="w-3.5 h-3.5" /> Duration
                   </div>
                   <div className="text-lg font-bold text-white">{anime.duration || 24} min</div>
                </div>
              </div>
            </div>

            {/* Genres & Tags */}
            <div className="flex flex-wrap gap-2.5">
              {anime.genres.map((genre) => (
                <Badge key={genre} variant="secondary" className="bg-bg-tertiary hover:bg-accent-primary hover:text-white transition-all text-sm font-bold px-4 py-1.5 rounded-xl border border-border">
                  {genre}
                </Badge>
              ))}
            </div>

            {/* Synopsis */}
            <div className="space-y-4">
               <h3 className="text-xl font-bold text-white flex items-center gap-2">
                 <Plus className="w-5 h-5 text-accent-primary" /> Synopsis
               </h3>
               <div className="prose prose-invert max-w-none text-text-secondary text-lg leading-relaxed font-medium">
                 <p>{anime.description}</p>
               </div>
            </div>

            {/* Production Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 p-8 rounded-2xl bg-bg-secondary/40 border border-border backdrop-blur-sm shadow-inner">
              <div className="space-y-1">
                <span className="block text-text-muted text-xs uppercase font-black tracking-widest mb-1">Status</span>
                <span className="text-lg font-bold text-accent-success uppercase tracking-wider">{anime.status}</span>
              </div>
              <div className="space-y-1">
                <span className="block text-text-muted text-xs uppercase font-black tracking-widest mb-1">Studios</span>
                <span className="text-lg font-bold text-white">{anime.studios.join(', ') || 'Various'}</span>
              </div>
              <div className="space-y-1">
                <span className="block text-text-muted text-xs uppercase font-black tracking-widest mb-1">Rating</span>
                <span className="text-lg font-bold text-white uppercase">{anime.rating.replace('_', '-')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
