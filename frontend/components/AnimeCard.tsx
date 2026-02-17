
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Play, Plus, Bookmark, Star, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
  };
}

// Fix: Casting motion components to any to avoid type errors
const MotionDiv = motion.div as any;

export function AnimeCard({ anime }: AnimeCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <MotionDiv
      className="group relative w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -8, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.8)' }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Link href={`/anime/${anime.slug}`}>
        <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-bg-secondary border border-border shadow-xl group-hover:shadow-2xl group-hover:shadow-accent-primary/50 group-hover:border-accent-primary/50 transition-all duration-300">
          {/* Poster */}
          <img
            src={anime.poster_url || 'https://via.placeholder.com/300x450'}
            alt={anime.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
          
          {/* Overlay Badges */}
          <div className="absolute top-3 right-3 z-10">
            <Badge className="bg-black/60 backdrop-blur-md border-white/10 text-white font-bold gap-1.5 px-2 py-1">
              <Star className="w-3.5 h-3.5 fill-accent-warning text-accent-warning" />
              {anime.score || 'N/A'}
            </Badge>
          </div>

          <div className="absolute top-3 left-3 z-10">
            <Badge variant="outline" className="bg-black/40 backdrop-blur-sm border-white/5 text-white/90 text-[10px] uppercase tracking-wider font-black">
              {anime.kind || 'TV'}
            </Badge>
          </div>
          
          {/* Hover Actions Overlay */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent flex flex-col items-center justify-center p-6 transition-opacity duration-300",
            isHovered ? "opacity-100" : "opacity-0"
          )}>
            {/* Center Play Button */}
            <MotionDiv
              initial={{ scale: 0.8, opacity: 0 }}
              animate={isHovered ? { scale: 1, opacity: 1 } : {}}
              className="bg-accent-primary p-5 rounded-full shadow-[0_0_20px_rgba(139,92,246,0.6)] mb-6"
            >
              <Play className="h-8 w-8 fill-current text-white ml-1" />
            </MotionDiv>
            
            {/* Action Buttons Row */}
            <div className="flex gap-3">
              <Button size="icon" variant="secondary" className="h-10 w-10 rounded-full bg-white/10 hover:bg-accent-primary backdrop-blur-md border-white/10 text-white transition-all">
                <Plus className="h-5 w-5" />
              </Button>
              <Button size="icon" variant="secondary" className="h-10 w-10 rounded-full bg-white/10 hover:bg-accent-primary backdrop-blur-md border-white/10 text-white transition-all">
                <Bookmark className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Bottom Info Info */}
            <div className="absolute bottom-6 left-4 right-4 text-center space-y-2">
               <div className="flex flex-wrap justify-center gap-1.5">
                {anime.genres?.slice(0, 3).map((genre) => (
                  <Badge key={genre} variant="secondary" className="bg-accent-primary/20 text-accent-primary border-accent-primary/20 font-bold uppercase px-2 py-0.5 text-[10px]">
                    {genre}
                  </Badge>
                ))}
               </div>
            </div>
          </div>
        </div>
        
        {/* Title and Metadata */}
        <div className="mt-4 space-y-1.5 px-1">
          <h3 className="font-bold text-base leading-snug text-text-primary group-hover:text-accent-primary transition-colors line-clamp-2">
            {anime.title}
          </h3>
          <div className="flex items-center gap-3 text-xs font-semibold text-text-muted">
             <span className="flex items-center gap-1">
               <Calendar className="w-3 h-3" />
               {anime.year || 'Unknown'}
             </span>
             <span className="h-1 w-1 bg-border rounded-full" />
             <span>{anime.episodes_total ? `${anime.episodes_total} Episodes` : 'Ongoing'}</span>
          </div>
        </div>
      </Link>
    </MotionDiv>
  );
}