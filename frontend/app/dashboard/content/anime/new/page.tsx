
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { debounce } from 'lodash';
import { Search, Loader2, Check, ChevronRight, AlertCircle, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { AnimeForm } from '@/components/dashboard/anime/AnimeForm';
import { useCreateAnime } from '@/hooks/mutations';

interface SearchResult {
  id: string;
  kodik_id?: string;
  shikimori_id?: number;
  title: string;
  title_original: string;
  poster_url: string;
  type: string;
  score: number;
  year: number;
  sources: {
    kodik: boolean;
    shikimori: boolean;
  };
}

export default function AddAnimePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedAnime, setSelectedAnime] = useState<any | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  
  const createMutation = useCreateAnime();

  // Debounced live search
  const debouncedSearch = useMemo(
    () =>
      debounce(async (query: string) => {
        if (query.length < 2) {
          setSearchResults([]);
          return;
        }
        
        setIsSearching(true);
        try {
          const response = await api.post('/dashboard/parsers/search-live', {
            query
          });
          setSearchResults(response.data.data);
        } catch (error) {
          console.error('Search error:', error);
          toast.error('Search failed');
        } finally {
          setIsSearching(false);
        }
      }, 500),
    []
  );
  
  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => debouncedSearch.cancel();
  }, [searchQuery, debouncedSearch]);
  
  // Auto-fill all fields when result selected
  const handleSelectAnime = async (result: SearchResult) => {
    setIsLoadingDetails(true);
    
    try {
      const response = await api.post('/dashboard/parsers/fetch-full', {
        kodik_id: result.kodik_id,
        shikimori_id: result.shikimori_id
      });
      
      setSelectedAnime(response.data.data);
      toast.success('Data auto-filled successfully!');
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load details');
    } finally {
      setIsLoadingDetails(false);
    }
  };
  
  const handleCreate = async (data: any) => {
    await createMutation.mutateAsync(data);
  };
  
  // If we have selected anime data, show the form populated
  if (selectedAnime) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Review & Create</h1>
            <p className="text-text-muted">Review the auto-filled data before saving.</p>
          </div>
          <Button variant="outline" onClick={() => setSelectedAnime(null)}>
            Change Selection
          </Button>
        </div>
        
        <div className="bg-bg-secondary p-6 rounded-lg border border-border">
          <AnimeForm 
            mode="create" 
            initialData={selectedAnime}
            isLoading={createMutation.isPending} 
            onSubmit={handleCreate} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Add New Anime</h1>
        <p className="text-text-muted">
          Search to auto-fill data from Shikimori & Kodik, or create manually.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* LIVE SEARCH */}
        <Card className="bg-bg-secondary border-border">
          <CardHeader>
            <CardTitle className="text-white">Live Search</CardTitle>
            <CardDescription>Start typing to find anime...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative mb-6">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
              <Input
                placeholder="Attack on Titan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-bg-primary"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-accent-primary" />
              )}
            </div>
            
            {/* LIVE RESULTS */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
              {searchResults.length > 0 ? (
                searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleSelectAnime(result)}
                    disabled={isLoadingDetails}
                    className="w-full p-3 border border-border rounded-lg hover:bg-bg-tertiary transition-colors text-left group flex gap-4 items-start"
                  >
                    {/* Poster */}
                    <div className="w-16 h-24 bg-bg-primary rounded overflow-hidden flex-shrink-0">
                      {result.poster_url ? (
                        <img
                          src={result.poster_url}
                          alt={result.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-text-muted">No Img</div>
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{result.title}</h3>
                      <p className="text-sm text-text-muted truncate">
                        {result.title_original}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline" className="text-[10px] h-5 border-border text-text-secondary uppercase">
                          {result.type}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] h-5 border-border text-text-secondary">
                          {result.year}
                        </Badge>
                        {result.score > 0 && (
                          <Badge variant="outline" className="text-[10px] h-5 border-accent-warning text-accent-warning">
                            ★ {result.score}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex gap-2 mt-2 text-[10px]">
                        {result.sources.kodik && (
                          <span className="text-accent-primary flex items-center gap-1">
                            <Check className="h-3 w-3" /> Kodik
                          </span>
                        )}
                        {result.sources.shikimori && (
                          <span className="text-accent-success flex items-center gap-1">
                            <Check className="h-3 w-3" /> Shikimori
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Arrow */}
                    <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {isLoadingDetails ? (
                        <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-accent-primary" />
                      )}
                    </div>
                  </button>
                ))
              ) : searchQuery.length > 2 && !isSearching ? (
                <div className="text-center py-8 text-text-muted">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No results found
                </div>
              ) : (
                <div className="text-center py-8 text-text-muted">
                  Type at least 2 characters...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* MANUAL CREATE */}
        <div className="flex flex-col gap-6">
          <Card className="bg-bg-secondary border-border h-fit">
            <CardHeader>
              <CardTitle className="text-white">Manual Creation</CardTitle>
              <CardDescription>Skip search and create from scratch.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full h-24 border-dashed border-2 flex flex-col gap-2 hover:bg-bg-tertiary hover:text-white hover:border-accent-primary"
                onClick={() => setSelectedAnime({})}
              >
                <Plus className="h-6 w-6" />
                <span>Create Empty Anime</span>
              </Button>
            </CardContent>
          </Card>
          
          <div className="p-4 rounded-lg bg-accent-primary/5 border border-accent-primary/20 text-sm text-text-secondary">
            <h4 className="font-semibold text-accent-primary mb-2">Did you know?</h4>
            <p>
              Using <strong>Live Search</strong> automatically links external IDs (Shikimori/Kodik), which enables:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-1">
              <li>Auto-updating episode counts</li>
              <li>Fetching high-quality artwork</li>
              <li>Syncing ratings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
