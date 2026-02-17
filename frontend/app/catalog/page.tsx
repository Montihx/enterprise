
'use client';

import { useState, useMemo } from 'react';
import { AnimeCard } from '@/components/AnimeCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, LayoutGrid, SlidersHorizontal, ArrowUpAz, AlertCircle, Tag } from 'lucide-react';
import { useAnimeList, useGenres } from '@/hooks/queries';
import { useDebounce } from '@/hooks/useDebounce';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { Pagination } from '@/components/ui/pagination';

// Fix: Casting motion components to any to avoid type errors
const MotionDiv = motion.div as any;

export default function CatalogPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('all');
  const [kind, setKind] = useState<string>('all');
  const [genre, setGenre] = useState<string>('all');
  const [orderBy, setOrderBy] = useState<string>('popularity');

  const { data: genres = [] } = useGenres();

  const queryParams = useMemo(() => {
    const params: any = {
      q: debouncedSearch,
      page,
      limit: 18,
    };
    if (status !== 'all') params.status = status;
    if (kind !== 'all') params.kind = kind;
    if (genre !== 'all') params.genre = genre;
    return params;
  }, [debouncedSearch, page, status, kind, genre]);

  const { data: response, isLoading, isError } = useAnimeList(queryParams);
  const animeList = response?.data || [];
  const meta = response?.meta || { total_pages: 1 };

  return (
    <div className="container mx-auto px-4 py-12 pb-24 min-h-screen">
      {/* Page Heading */}
      <div className="mb-12 space-y-2">
        <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
          <LayoutGrid className="w-10 h-10 text-accent-primary" />
          Catalog
        </h1>
        <p className="text-text-muted text-lg font-medium max-w-2xl leading-relaxed">
          Discover your next favorite series. Filter through thousands of curated titles.
        </p>
      </div>

      {/* Control Bar */}
      <div className="sticky top-20 z-30 mb-12 p-4 bg-bg-secondary/60 backdrop-blur-xl border border-border rounded-2xl shadow-2xl flex flex-col lg:flex-row gap-6 items-center">
        <div className="relative w-full lg:flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted group-focus-within:text-accent-primary transition-colors" />
          <Input 
            placeholder="Search titles, descriptions, staff..." 
            className="pl-12 h-14 bg-bg-primary/50 border-border text-lg font-medium focus:ring-accent-primary rounded-xl" 
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1); 
            }}
          />
        </div>
        
        <div className="flex flex-wrap gap-4 w-full lg:w-auto items-center">
          <Select value={genre} onValueChange={(v) => { setGenre(v); setPage(1); }}>
            <SelectTrigger className="w-[160px] h-12 bg-bg-primary/50 border-border font-bold">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-accent-primary" />
                <SelectValue placeholder="Genre" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-bg-secondary border-border text-white max-h-[400px]">
              <SelectItem value="all">All Genres</SelectItem>
              {genres.sort().map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-[140px] h-12 bg-bg-primary/50 border-border font-bold">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-bg-secondary border-border text-white">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ongoing">Ongoing</SelectItem>
              <SelectItem value="released">Released</SelectItem>
            </SelectContent>
          </Select>

          <Select value={kind} onValueChange={(v) => { setKind(v); setPage(1); }}>
            <SelectTrigger className="w-[140px] h-12 bg-bg-primary/50 border-border font-bold">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent className="bg-bg-secondary border-border text-white">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="tv">TV Series</SelectItem>
              <SelectItem value="movie">Movies</SelectItem>
              <SelectItem value="ova">OVA</SelectItem>
              <SelectItem value="ona">ONA</SelectItem>
            </SelectContent>
          </Select>

          <Select value={orderBy} onValueChange={setOrderBy}>
            <SelectTrigger className="w-[180px] h-12 bg-bg-primary/50 border-border font-bold">
              <div className="flex items-center gap-2">
                <ArrowUpAz className="w-4 h-4" />
                <SelectValue placeholder="Sort By" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-bg-secondary border-border text-white">
              <SelectItem value="popularity">Popularity</SelectItem>
              <SelectItem value="score">Score</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {isError ? (
        <div className="py-24 text-center">
          <AlertCircle className="h-16 w-16 text-accent-danger mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-white">System offline</h3>
          <Button onClick={() => window.location.reload()} className="mt-4 font-bold">Retry</Button>
        </div>
      ) : (
        <div className="space-y-16">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-12">
            <AnimatePresence mode="popLayout">
              {isLoading ? (
                Array.from({ length: 12 }).map((_, i) => (
                  <MotionDiv key={`skel-${i}`} className="space-y-4">
                    <Skeleton className="aspect-[2/3] w-full rounded-2xl bg-bg-secondary" />
                    <Skeleton className="h-5 w-full bg-bg-secondary" />
                  </MotionDiv>
                ))
              ) : animeList.length === 0 ? (
                <div className="col-span-full py-32 text-center text-text-muted">
                  <Search className="w-20 h-20 mx-auto opacity-10 mb-6" />
                  <p className="text-xl font-medium">No titles matching your criteria.</p>
                </div>
              ) : (
                animeList.map((anime) => (
                  <MotionDiv key={anime.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <AnimeCard anime={anime} />
                  </MotionDiv>
                ))
              )}
            </AnimatePresence>
          </div>
          
          {!isLoading && meta.total_pages > 1 && (
            <div className="pt-8 border-t border-border/50">
              <Pagination 
                currentPage={page} 
                totalPages={meta.total_pages} 
                onPageChange={setPage} 
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
