
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { PaginatedResponse, Anime } from '@/hooks/queries';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Fix: Casting motion components to any to avoid type errors
const MotionDiv = motion.div as any;

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Anime[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const debouncedQuery = useDebounce(query, 300);
  
  // Load recent searches
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
      setRecentSearches(recent);
    }
  }, [isOpen]);
  
  // Auto-focus on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);
  
  // Search
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      return;
    }
    
    const search = async () => {
      setIsLoading(true);
      try {
        const { data } = await api.get<PaginatedResponse<Anime>>(`/anime/?q=${debouncedQuery}&limit=5`);
        setResults(data.data || []);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    search();
  }, [debouncedQuery]);
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => 
          Math.min(prev + 1, results.length - 1)
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);
  
  const handleSelect = (anime: Anime) => {
    const updated = [
      anime.title,
      ...recentSearches.filter((s) => s !== anime.title)
    ].slice(0, 5);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
    setRecentSearches(updated);
    
    router.push(`/anime/${anime.slug}`);
    onClose();
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
          />
          
          {/* Modal */}
          <MotionDiv
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-20 z-[70] w-full max-w-2xl -translate-x-1/2 px-4"
          >
            <div className="rounded-2xl border border-border bg-bg-secondary shadow-2xl overflow-hidden ring-1 ring-white/10">
              {/* Header */}
              <div className="flex items-center gap-4 border-b border-border p-5">
                <Search className="h-6 w-6 text-accent-primary" />
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  placeholder="Quick search titles..."
                  className="border-0 bg-transparent focus:ring-0 text-xl h-12 p-0 placeholder:text-text-muted"
                />
                <button 
                  onClick={onClose}
                  className="rounded-lg bg-bg-tertiary px-3 py-1.5 text-xs font-black text-text-muted hover:text-white transition-colors"
                >
                  ESC
                </button>
              </div>
              
              {/* Results */}
              <div className="max-h-[60vh] overflow-y-auto p-3 custom-scrollbar">
                {isLoading && (
                  <div className="py-12 text-center text-sm text-text-muted flex flex-col justify-center items-center gap-3">
                    <Loader2 className="animate-spin h-8 w-8 text-accent-primary" /> 
                    <span className="font-bold tracking-widest uppercase">Initializing Probe</span>
                  </div>
                )}
                
                {!isLoading && query.length >= 2 && results.length === 0 && (
                  <div className="py-12 text-center text-text-muted flex flex-col items-center gap-3">
                    <X className="h-10 w-10 opacity-20" />
                    <span className="font-bold tracking-widest uppercase">No Records Found</span>
                  </div>
                )}
                
                {results.length > 0 && (
                  <div className="space-y-1.5">
                    {results.map((result, index) => (
                      <button
                        key={result.id}
                        onClick={() => handleSelect(result)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={cn(
                          "w-full rounded-xl p-4 text-left transition-all flex items-center gap-4 group",
                          index === selectedIndex
                            ? "bg-accent-primary/10 border border-accent-primary/30"
                            : "hover:bg-bg-tertiary border border-transparent"
                        )}
                      >
                        <div className="h-16 w-12 bg-bg-tertiary rounded-lg overflow-hidden flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform">
                          {result.poster_url && (
                            <img
                              src={result.poster_url}
                              alt={result.title}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "font-bold text-lg truncate transition-colors", 
                            index === selectedIndex ? "text-accent-primary" : "text-white"
                          )}>
                            {result.title}
                          </p>
                          <p className="text-sm text-text-muted truncate font-medium uppercase tracking-wider">
                            {result.kind} • {result.year || 'N/A'} • ★ {result.score || '0.0'}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Recent searches */}
                {query.length === 0 && recentSearches.length > 0 && (
                  <div className="space-y-2 p-2">
                    <p className="px-2 py-1 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
                      Recent Archives
                    </p>
                    {recentSearches.map((search) => (
                      <button
                        key={search}
                        onClick={() => setQuery(search)}
                        className="flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-bg-tertiary text-text-secondary hover:text-white transition-colors group"
                      >
                        <Clock className="h-4 w-4 text-text-muted group-hover:text-accent-primary transition-colors" />
                        <span className="font-medium">{search}</span>
                      </button>
                    ))}
                  </div>
                )}

                {query.length === 0 && recentSearches.length === 0 && (
                  <div className="py-20 text-center text-text-muted italic flex flex-col items-center gap-4">
                     <Search className="h-12 w-12 opacity-5" />
                     <p className="font-medium">Enter query to begin indexing.</p>
                  </div>
                )}
              </div>
            </div>
          </MotionDiv>
        </>
      )}
    </AnimatePresence>
  );
}
