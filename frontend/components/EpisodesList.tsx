
'use client';

import { useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface EpisodesListProps {
  episodes: any[];
  currentEpisode: any;
  onSelect: (episode: any) => void;
}

export function EpisodesList({ episodes, currentEpisode, onSelect }: EpisodesListProps) {
  const [search, setSearch] = useState('');
  
  // Mock data generation if episodes is empty
  const displayEpisodes = episodes.length > 0 ? episodes : Array.from({ length: 12 }).map((_, i) => ({
    id: `ep-${i+1}`,
    episode: i + 1,
    title: `Episode ${i + 1}`,
    thumbnail: null
  }));

  const filteredEpisodes = displayEpisodes.filter(ep => 
    ep.title?.toLowerCase().includes(search.toLowerCase()) || 
    ep.episode.toString().includes(search)
  );

  return (
    <div className="flex flex-col h-full bg-bg-secondary">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h3 className="font-bold text-white mb-2 flex items-center justify-between">
          Episodes
          <span className="text-xs font-normal text-text-muted">{displayEpisodes.length} Total</span>
        </h3>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-text-muted" />
          <Input 
            placeholder="Search episode..." 
            className="pl-8 h-9 bg-bg-tertiary border-transparent focus:bg-bg-primary"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredEpisodes.map((ep) => (
          <button
            key={ep.id}
            onClick={() => onSelect(ep)}
            className={cn(
              "w-full flex items-center gap-3 p-3 hover:bg-bg-tertiary transition-colors border-l-2",
              currentEpisode?.id === ep.id 
                ? "bg-bg-tertiary border-accent-primary" 
                : "border-transparent"
            )}
          >
            <div className="relative w-24 aspect-video bg-black rounded overflow-hidden flex-shrink-0">
               {/* Thumbnail Placeholder */}
               <div className="absolute inset-0 flex items-center justify-center text-xs text-text-muted">
                 EP {ep.episode}
               </div>
               {ep.thumbnail && <img src={ep.thumbnail} className="absolute inset-0 w-full h-full object-cover" />}
               
               {/* Progress bar mock */}
               <div className="absolute bottom-0 left-0 h-1 bg-accent-success" style={{ width: '0%' }} />
            </div>
            
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className={cn(
                  "font-medium text-sm truncate",
                  currentEpisode?.id === ep.id ? "text-accent-primary" : "text-white"
                )}>
                  Episode {ep.episode}
                </span>
                <span className="text-[10px] text-text-muted">24m</span>
              </div>
              <p className="text-xs text-text-muted truncate">
                {ep.title || `Episode ${ep.episode}`}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
