
'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { VideoPlayer } from '@/components/VideoPlayer';
import { Comments } from '@/components/Comments';
import { useAnime, useEpisodes } from '@/hooks/queries';
import { api } from '@/lib/api';
import { ChevronDown, Share2, ChevronLeft, Loader2, ListVideo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function WatchPage() {
  const { slug } = useParams();
  const searchParams = useSearchParams();
  const initialEp = parseInt(searchParams.get('episode') || '1');

  const { data: anime, isLoading: animeLoading } = useAnime(slug as string);
  const { data: episodes, isLoading: epLoading } = useEpisodes(anime?.id || '');
  
  const [currentEpisode, setCurrentEpisode] = useState<any>(null);
  const [releases, setReleases] = useState<any[]>([]);
  const [selectedRelease, setSelectedRelease] = useState<any>(null);
  const [loadingReleases, setLoadingReleases] = useState(false);

  // Sync initial episode or selection change
  useEffect(() => {
    if (episodes && episodes.length > 0) {
      const ep = episodes.find((e: any) => e.episode === initialEp) || episodes[0];
      setCurrentEpisode(ep);
    }
  }, [episodes, initialEp]);

  // Fetch releases for selected episode
  useEffect(() => {
    if (currentEpisode?.id) {
      setLoadingReleases(true);
      api.get(`/episodes/${currentEpisode.id}/releases`)
        .then(({ data }) => {
          setReleases(data);
          // Auto-select best release (e.g. 1080p from Kodik)
          const best = data.sort((a: any, b: any) => (b.quality === '1080p' ? 1 : -1))[0];
          setSelectedRelease(best);
        })
        .finally(() => setLoadingReleases(false));
    }
  }, [currentEpisode]);

  if (animeLoading || epLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-bg-primary">
        <Loader2 className="h-10 w-10 animate-spin text-accent-primary" />
        <p className="text-text-muted animate-pulse font-black uppercase tracking-widest text-xs">Syncing with Content Node</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary pb-20">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <Link href={`/anime/${slug}`} className="flex items-center gap-2 text-text-muted hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest">
          <ChevronLeft className="h-4 w-4" /> Back to details
        </Link>

        <section className="space-y-4">
          {/* CDN Selection - Dynamically populated from Releases */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 border-b border-white/5">
            {releases.map(rel => (
              <button 
                key={rel.id} 
                onClick={() => setSelectedRelease(rel)}
                className={cn(
                  "whitespace-nowrap px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all border border-transparent",
                  selectedRelease?.id === rel.id 
                    ? "bg-accent-primary text-white shadow-lg shadow-accent-primary/20" 
                    : "text-text-muted hover:text-white hover:bg-white/5"
                )}
              >
                {rel.source} {rel.quality} {rel.translation_team && `[${rel.translation_team}]`}
              </button>
            ))}
            {releases.length === 0 && !loadingReleases && (
              <span className="text-[10px] text-text-muted uppercase font-black tracking-widest italic">No video sources available for this segment.</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 py-2">
            <div className="flex gap-2">
              <button className="h-11 px-5 bg-bg-secondary border border-border rounded-xl flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-white hover:border-accent-primary transition-all">
                Season {currentEpisode?.season || 1} <ChevronDown className="h-4 w-4 text-text-muted" />
              </button>
              <button className="h-11 px-5 bg-bg-secondary border border-border rounded-xl flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-white hover:border-accent-primary transition-all">
                Episode {currentEpisode?.episode || 1} <ChevronDown className="h-4 w-4 text-text-muted" />
              </button>
            </div>
            
            <button 
              disabled={!episodes || episodes.indexOf(currentEpisode) === episodes.length - 1}
              onClick={() => {
                const idx = episodes.indexOf(currentEpisode);
                if (idx < episodes.length - 1) setCurrentEpisode(episodes[idx+1]);
              }}
              className="h-11 px-6 bg-bg-secondary border border-border rounded-xl text-[11px] font-black uppercase tracking-widest text-text-muted hover:text-white transition-all disabled:opacity-20"
            >
              Next Episode
            </button>
            
            <div className="flex-1" />
            
            <div className="hidden sm:flex items-center gap-6">
               <div className="flex items-center gap-2 px-4 py-2 bg-accent-primary/10 border border-accent-primary/20 rounded-xl">
                  <span className="text-[10px] font-black uppercase tracking-widest text-accent-primary">Kitsu Enterprise</span>
                  <span className="text-[8px] font-black uppercase text-accent-primary/50">SECURE_GATEWAY</span>
               </div>
               <button className="p-2 text-text-muted hover:text-white transition-colors"><Share2 className="h-5 w-5" /></button>
            </div>
          </div>

          {/* CINEMATIC PLAYER */}
          {loadingReleases ? (
            <div className="aspect-video bg-black rounded-[40px] flex items-center justify-center border border-white/5">
              <Loader2 className="h-12 w-12 animate-spin text-accent-primary opacity-20" />
            </div>
          ) : (
            <VideoPlayer 
              episodeId={currentEpisode?.id} 
              sourceUrl={selectedRelease?.url || ''} 
              embedUrl={selectedRelease?.embed_url}
              onEnded={() => {}} 
            />
          )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-10">
          <div className="lg:col-span-2 space-y-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                 <Badge className="bg-accent-primary/20 text-accent-primary border-0 text-[10px] font-black uppercase tracking-widest">Now Streaming</Badge>
                 <span className="text-text-muted text-xs font-mono">SEGMENT_ID: {currentEpisode?.id?.substring(0, 13)}...</span>
              </div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
                {anime?.title} <span className="text-accent-primary opacity-40">—</span> Segment {currentEpisode?.episode}
              </h1>
              <p className="text-text-secondary leading-relaxed max-w-3xl">
                {currentEpisode?.title || anime?.description}
              </p>
            </div>
            <div className="border-t border-white/5 pt-12">
              <h3 className="text-2xl font-black uppercase tracking-tight mb-8">Terminal Discussion</h3>
              <Comments animeId={anime?.id || ''} episodeId={currentEpisode?.id} />
            </div>
          </div>
          
          <div className="space-y-8">
             <div className="glass-card p-8 rounded-[40px] border border-white/10 shadow-2xl">
                <h3 className="text-xl font-black uppercase tracking-widest text-white mb-6">Archive Segments</h3>
                <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                   {episodes?.map((ep: any) => (
                     <button 
                       key={ep.id}
                       onClick={() => setCurrentEpisode(ep)}
                       className={cn(
                         "w-full p-4 rounded-2xl flex items-center gap-4 transition-all text-left group border",
                         currentEpisode?.id === ep.id 
                           ? "bg-accent-primary border-accent-primary shadow-xl" 
                           : "bg-bg-primary border-white/5 hover:bg-bg-tertiary"
                       )}
                     >
                       <div className={cn(
                         "h-10 w-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0",
                         currentEpisode?.id === ep.id ? "bg-white/20 text-white" : "bg-bg-secondary text-text-muted group-hover:text-white"
                       )}>
                         {ep.episode}
                       </div>
                       <div className="min-w-0">
                         <div className={cn("text-sm font-bold truncate", currentEpisode?.id === ep.id ? "text-white" : "text-text-secondary")}>
                           {ep.title || `Segment ${ep.episode}`}
                         </div>
                         <div className={cn("text-[9px] font-black uppercase tracking-widest", currentEpisode?.id === ep.id ? "text-white/60" : "text-text-muted")}>
                           S{ep.season} • 24M • FHD
                         </div>
                       </div>
                     </button>
                   ))}
                </div>
                <div className="mt-10 pt-8 border-t border-white/5 text-center">
                   <div className="text-6xl font-black text-white">{anime?.score || '8.6'}</div>
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted mt-4">Node Aggregate Rating</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Badge } from '@/components/ui/badge';
