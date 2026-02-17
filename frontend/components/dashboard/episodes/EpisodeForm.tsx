
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Check, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useAnimeList } from '@/hooks/queries';
import { useDebounce } from '@/hooks/useDebounce';
import { EpisodeCreate, EpisodeUpdate } from '@/hooks/mutations';

interface EpisodeFormProps {
  initialData?: any;
  onSubmit: (data: EpisodeCreate | EpisodeUpdate) => Promise<void>;
  isLoading: boolean;
  mode: 'create' | 'edit';
}

// Add Checkbox component inline if missing or import it
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

export function EpisodeForm({ initialData, onSubmit, isLoading, mode }: EpisodeFormProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: initialData || {
      anime_id: '',
      season: 1,
      episode: 1,
      title: '',
      thumbnail_url: '',
      is_filler: false,
      is_recap: false,
    }
  });

  // Anime Search
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const { data: animeList, isLoading: isSearching } = useAnimeList({ q: debouncedSearch, limit: 10 });
  
  const selectedAnimeId = watch('anime_id');
  const selectedAnime = animeList?.find(a => a.id === selectedAnimeId);

  const isFiller = watch('is_filler');
  const isRecap = watch('is_recap');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
      <div className="space-y-4">
        {/* Anime Selector */}
        <div className="space-y-2 flex flex-col">
          <Label>Anime</Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between bg-bg-secondary border-border"
                disabled={mode === 'edit'} // Disable changing anime on edit for simplicity
              >
                {selectedAnimeId
                  ? (selectedAnime?.title || initialData?.anime_title || "Selected Anime")
                  : "Select anime..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0 bg-bg-secondary border-border">
              <Command>
                <CommandInput 
                  placeholder="Search anime..." 
                  value={search}
                  onValueChange={setSearch}
                />
                <CommandList>
                  <CommandEmpty>No anime found.</CommandEmpty>
                  <CommandGroup>
                    {animeList?.map((anime) => (
                      <CommandItem
                        key={anime.id}
                        value={anime.title}
                        onSelect={() => {
                          setValue('anime_id', anime.id);
                          setOpen(false);
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
          <input type="hidden" {...register('anime_id', { required: 'Anime is required' })} />
          {errors.anime_id && <p className="text-xs text-accent-danger">{errors.anime_id.message as string}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="season">Season</Label>
            <Input id="season" type="number" {...register('season', { valueAsNumber: true, min: 1 })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="episode">Episode Number</Label>
            <Input id="episode" type="number" {...register('episode', { valueAsNumber: true, min: 1 })} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Episode Title</Label>
          <Input id="title" {...register('title')} placeholder="e.g. The Beginning" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
          <Input id="thumbnail_url" {...register('thumbnail_url')} />
        </div>

        <div className="flex gap-6 pt-2">
          <div className="flex items-center gap-2">
            <SimpleCheckbox 
              id="is_filler" 
              checked={isFiller} 
              onCheckedChange={(v) => setValue('is_filler', v)} 
            />
            <Label htmlFor="is_filler" className="cursor-pointer">Filler</Label>
          </div>
          <div className="flex items-center gap-2">
            <SimpleCheckbox 
              id="is_recap" 
              checked={isRecap} 
              onCheckedChange={(v) => setValue('is_recap', v)} 
            />
            <Label htmlFor="is_recap" className="cursor-pointer">Recap</Label>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button variant="outline" type="button" onClick={() => history.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === 'create' ? 'Create Episode' : 'Update Episode'}
        </Button>
      </div>
    </form>
  );
}
