
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Check, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useAnimeList, useEpisodes } from '@/hooks/queries';
import { useDebounce } from '@/hooks/useDebounce';
import { ReleaseCreate, ReleaseUpdate } from '@/hooks/mutations';

interface ReleaseFormProps {
  initialData?: any;
  onSubmit: (data: ReleaseCreate | ReleaseUpdate) => Promise<void>;
  isLoading: boolean;
  mode: 'create' | 'edit';
}

function SimpleCheckbox({ checked, onCheckedChange, id }: { checked: boolean, onCheckedChange: (c: boolean) => void, id: string }) {
  return (
    <input 
      type="checkbox" 
      id={id}
      checked={checked} 
      onChange={(e) => onCheckedChange(e.target.checked)} 
      className="h-4 w-4 rounded border-border bg-bg-secondary text-accent-primary focus:ring-accent-primary"
    />
  );
}

export function ReleaseForm({ initialData, onSubmit, isLoading, mode }: ReleaseFormProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: initialData || {
      episode_id: '',
      source: 'kodik',
      quality: '1080p',
      translation_type: 'voice',
      translation_team: '',
      url: '',
      is_active: true,
    }
  });

  // State for Cascading Select
  const [selectedAnimeId, setSelectedAnimeId] = useState<string>('');
  
  // Anime Search
  const [openAnime, setOpenAnime] = useState(false);
  const [animeSearch, setAnimeSearch] = useState('');
  const debouncedAnimeSearch = useDebounce(animeSearch, 500);
  const { data: animeList } = useAnimeList({ q: debouncedAnimeSearch, limit: 10 });
  
  // Episode Fetch (Dependent on selectedAnimeId)
  // When editing, we might not know the animeId initially unless we fetch it from the episodeId. 
  // For simplicity in this vertical slice, we assume user navigates correctly or we just show episode ID if simple.
  // Ideally: Retrieve Episode -> Retrieve Anime -> Set States.
  const { data: episodesList } = useEpisodes(selectedAnimeId);

  const selectedEpisodeId = watch('episode_id');
  const selectedAnime = animeList?.find(a => a.id === selectedAnimeId);
  const isActive = watch('is_active');

  const sourceValue = watch('source');
  const qualityValue = watch('quality');
  const translationTypeValue = watch('translation_type');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
      <div className="space-y-6">
        
        {/* Anime Selection (Only needed for Create or if we want to change episode) */}
        {mode === 'create' && (
          <div className="space-y-2 flex flex-col">
            <Label>1. Select Anime</Label>
            <Popover open={openAnime} onOpenChange={setOpenAnime}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openAnime}
                  className="w-full justify-between bg-bg-secondary border-border"
                >
                  {selectedAnimeId
                    ? (selectedAnime?.title || "Anime Selected")
                    : "Select anime..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0 bg-bg-secondary border-border">
                <Command>
                  <CommandInput 
                    placeholder="Search anime..." 
                    value={animeSearch}
                    onValueChange={setAnimeSearch}
                  />
                  <CommandList>
                    <CommandEmpty>No anime found.</CommandEmpty>
                    <CommandGroup>
                      {animeList?.map((anime) => (
                        <CommandItem
                          key={anime.id}
                          value={anime.title}
                          onSelect={() => {
                            setSelectedAnimeId(anime.id);
                            setOpenAnime(false);
                            setValue('episode_id', ''); // Reset episode on anime change
                          }}
                          className="cursor-pointer hover:bg-bg-tertiary"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedAnimeId === anime.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex items-center gap-2">
                             <img src={anime.poster_url} className="h-8 w-6 object-cover rounded" />
                             <span>{anime.title}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* Episode Selection */}
        <div className="space-y-2">
          <Label>2. Select Episode</Label>
          <Select 
            value={selectedEpisodeId} 
            onValueChange={(v) => setValue('episode_id', v)}
            disabled={!selectedAnimeId && mode === 'create'}
          >
            <SelectTrigger className="w-full bg-bg-secondary border-border">
              <SelectValue placeholder={mode === 'edit' ? "Current Episode" : "Select episode..."} />
            </SelectTrigger>
            <SelectContent>
              {episodesList?.map((ep: any) => (
                <SelectItem key={ep.id} value={ep.id}>
                  Episode {ep.episode} {ep.season > 1 ? `(Season ${ep.season})` : ''} - {ep.title || 'Untitled'}
                </SelectItem>
              ))}
              {(!episodesList || episodesList.length === 0) && (
                <SelectItem value="none" disabled>No episodes found for this anime</SelectItem>
              )}
            </SelectContent>
          </Select>
          <input type="hidden" {...register('episode_id', { required: 'Episode is required' })} />
          {errors.episode_id && <p className="text-xs text-accent-danger">{errors.episode_id.message as string}</p>}
        </div>

        {/* Release Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Source</Label>
            <Select value={sourceValue} onValueChange={(v) => setValue('source', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kodik">Kodik</SelectItem>
                <SelectItem value="aniboom">Aniboom</SelectItem>
                <SelectItem value="sibnet">Sibnet</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Quality</Label>
            <Select value={qualityValue} onValueChange={(v) => setValue('quality', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Quality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1080p">1080p</SelectItem>
                <SelectItem value="720p">720p</SelectItem>
                <SelectItem value="480p">480p</SelectItem>
                <SelectItem value="360p">360p</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Translation Type</Label>
            <Select value={translationTypeValue} onValueChange={(v) => setValue('translation_type', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="voice">Voice</SelectItem>
                <SelectItem value="subtitles">Subtitles</SelectItem>
                <SelectItem value="raw">Raw</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="translation_team">Team / Author</Label>
            <Input id="translation_team" {...register('translation_team')} placeholder="e.g. AniLibria" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="url">Video URL</Label>
          <Input id="url" {...register('url', { required: 'URL is required' })} placeholder="https://..." />
          {errors.url && <p className="text-xs text-accent-danger">{errors.url.message as string}</p>}
        </div>

        <div className="flex items-center gap-2 pt-2">
          <SimpleCheckbox 
            id="is_active" 
            checked={isActive} 
            onCheckedChange={(v) => setValue('is_active', v)} 
          />
          <Label htmlFor="is_active" className="cursor-pointer">Active</Label>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button variant="outline" type="button" onClick={() => history.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === 'create' ? 'Create Release' : 'Update Release'}
        </Button>
      </div>
    </form>
  );
}
