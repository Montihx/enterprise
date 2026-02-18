'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, X, Loader2, TrendingUp, Star, ChevronRight, ArrowRight } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { PaginatedResponse, Anime } from '@/hooks/queries';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MotionDiv = motion.div as any;

const TRENDING_SEARCHES = ['Attack on Titan', 'Jujutsu Kaisen', 'Demon Slayer', 'One Piece', 'Chainsaw Man'];

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Anime[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 280);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(-1);
      setTimeout(() => inputRef.current?.focus(), 80);
      if (typeof window !== 'undefined') {
        const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
        setRecentSearches(recent);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (debouncedQuery.length < 2) { setResults([]); return; }
    const search = async () => {
      setIsLoading(true);
      try {
        const { data } = await api.get<PaginatedResponse<Anime>>(`/anime/?q=${encodeURIComponent(debouncedQuery)}&limit=8`);
        setResults(data.data || []);
      } catch { setResults([]); }
      finally { setIsLoading(false); }
    };
    search();
  }, [debouncedQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex((p) => Math.min(p + 1, results.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex((p) => Math.max(p - 1, -1)); }
      if (e.key === 'Enter' && selectedIndex >= 0 && results[selectedIndex]) handleSelect(results[selectedIndex]);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  const handleSelect = (anime: Anime) => {
    const updated = [anime.title, ...recentSearches.filter((s) => s !== anime.title)].slice(0, 5);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
    router.push(`/anime/${anime.slug}`);
    onClose();
  };

  const handleSearchSubmit = () => {
    if (!query.trim()) return;
    const updated = [query.trim(), ...recentSearches.filter((s) => s !== query.trim())].slice(0, 5);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
    router.push(`/catalog?q=${encodeURIComponent(query.trim())}`);
    onClose();
  };

  const clearRecent = () => {
    localStorage.setItem('recentSearches', '[]');
    setRecentSearches([]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Full-screen backdrop */}
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-[70]"
            style={{ background: 'rgba(7,7,16,0.85)', backdropFilter: 'blur(16px)' }}
          />

          {/* Modal */}
          <div className="fixed inset-x-0 top-0 z-[80] flex justify-center pt-16 px-4 pb-8">
            <MotionDiv
              initial={{ opacity: 0, y: -20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.97 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="w-full max-w-2xl"
            >
              <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black border border-[var(--glass-border)]"
                style={{ background: 'rgba(15,15,26,0.95)', backdropFilter: 'blur(24px)' }}>

                {/* Search input row */}
                <div className="flex items-center gap-4 p-5 border-b border-[var(--border)]">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                    <Search className="h-5 w-5 text-violet-400" />
                  </div>
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setSelectedIndex(-1); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                    placeholder="Search anime, genres, studios..."
                    className="flex-1 bg-transparent border-none outline-none text-lg font-medium text-white placeholder:text-[var(--text-muted)]"
                  />
                  <div className="flex items-center gap-2">
                    {query && (
                      <button onClick={() => setQuery('')} className="p-1.5 rounded-lg hover:bg-white/5 text-[var(--text-muted)] hover:text-white transition-all">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                    <kbd className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-[var(--border)] text-[10px] font-black text-[var(--text-muted)]">ESC</kbd>
                  </div>
                </div>

                {/* Results area */}
                <div className="max-h-[65vh] overflow-y-auto">
                  {/* Loading */}
                  {isLoading && (
                    <div className="py-12 flex flex-col items-center gap-3 text-[var(--text-muted)]">
                      <Loader2 className="h-7 w-7 animate-spin text-violet-400" />
                      <span className="text-xs font-bold uppercase tracking-widest">Searching...</span>
                    </div>
                  )}

                  {/* Results */}
                  {!isLoading && results.length > 0 && (
                    <div className="p-2">
                      <p className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Results</p>
                      {results.map((result, index) => (
                        <button
                          key={result.id}
                          onClick={() => handleSelect(result)}
                          onMouseEnter={() => setSelectedIndex(index)}
                          className={cn(
                            'w-full flex items-center gap-4 p-3 rounded-xl transition-all text-left group',
                            index === selectedIndex ? 'bg-violet-500/10 border border-violet-500/20' : 'hover:bg-white/5 border border-transparent'
                          )}
                        >
                          <div className="w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-[var(--bg-tertiary)] shadow-lg">
                            {result.poster_url && (
                              <img src={result.poster_url} alt={result.title} className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn('font-bold text-base truncate transition-colors', index === selectedIndex ? 'text-violet-400' : 'text-white')}>
                              {result.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-[var(--text-muted)] uppercase font-medium">{result.kind}</span>
                              <span className="text-[var(--text-muted)]">·</span>
                              <span className="text-xs text-[var(--text-muted)]">{result.year || 'N/A'}</span>
                              {result.score > 0 && (
                                <>
                                  <span className="text-[var(--text-muted)]">·</span>
                                  <span className="flex items-center gap-1 text-xs text-yellow-500 font-bold">
                                    <Star className="h-3 w-3 fill-current" />
                                    {result.score.toFixed(1)}
                                  </span>
                                </>
                              )}
                            </div>
                            {result.genres?.length > 0 && (
                              <div className="flex gap-1 mt-1.5">
                                {result.genres.slice(0, 3).map((g) => (
                                  <span key={g} className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-violet-500/10 text-violet-400 border border-violet-500/15">
                                    {g}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <ChevronRight className={cn('h-4 w-4 flex-shrink-0 transition-colors', index === selectedIndex ? 'text-violet-400' : 'text-[var(--text-muted)]')} />
                        </button>
                      ))}

                      {/* See all results */}
                      <button
                        onClick={handleSearchSubmit}
                        className="w-full flex items-center justify-center gap-2 p-3 mt-1 rounded-xl border border-dashed border-[var(--border)] hover:border-violet-500/30 text-[var(--text-muted)] hover:text-violet-400 transition-all text-sm font-bold"
                      >
                        <ArrowRight className="h-4 w-4" />
                        See all results for "{query}"
                      </button>
                    </div>
                  )}

                  {/* No results */}
                  {!isLoading && query.length >= 2 && results.length === 0 && (
                    <div className="py-14 flex flex-col items-center gap-3 text-[var(--text-muted)]">
                      <Search className="h-12 w-12 opacity-10" />
                      <p className="font-bold text-sm">No results found for "{query}"</p>
                      <p className="text-xs">Try different keywords or browse the catalog</p>
                    </div>
                  )}

                  {/* Empty state: recent + trending */}
                  {query.length < 2 && (
                    <div className="p-4 space-y-5">
                      {/* Recent searches */}
                      {recentSearches.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Recent</p>
                            <button onClick={clearRecent} className="text-[10px] font-bold text-[var(--text-muted)] hover:text-violet-400 transition-colors">
                              Clear all
                            </button>
                          </div>
                          <div className="space-y-1">
                            {recentSearches.map((s) => (
                              <button key={s} onClick={() => setQuery(s)}
                                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-white/5 text-left transition-all group">
                                <Clock className="h-4 w-4 text-[var(--text-muted)] group-hover:text-violet-400 transition-colors" />
                                <span className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-white transition-colors">{s}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Trending */}
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">Trending</p>
                        <div className="flex flex-wrap gap-2">
                          {TRENDING_SEARCHES.map((s, i) => (
                            <button key={s} onClick={() => setQuery(s)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-violet-500/10 border border-[var(--border)] hover:border-violet-500/30 text-sm text-[var(--text-secondary)] hover:text-violet-400 transition-all font-medium">
                              <TrendingUp className="h-3 w-3" />
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-[var(--border)] flex items-center justify-between bg-[var(--bg-secondary)]/50">
                  <div className="flex items-center gap-4 text-[10px] text-[var(--text-muted)]">
                    <span className="flex items-center gap-1.5">
                      <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-[var(--border)] font-mono">↑↓</kbd>
                      Navigate
                    </span>
                    <span className="flex items-center gap-1.5">
                      <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-[var(--border)] font-mono">↵</kbd>
                      Select
                    </span>
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {results.length > 0 ? `${results.length} results` : 'Type to search'}
                  </span>
                </div>
              </div>
            </MotionDiv>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
