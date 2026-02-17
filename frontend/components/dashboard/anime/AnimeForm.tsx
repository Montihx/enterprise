
'use client';

import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { AnimeCreate, AnimeUpdate } from '@/hooks/mutations';

interface AnimeFormProps {
  initialData?: any; // Should be typed properly with Anime schema
  onSubmit: (data: AnimeCreate | AnimeUpdate) => Promise<void>;
  isLoading: boolean;
  mode: 'create' | 'edit';
}

export function AnimeForm({ initialData, onSubmit, isLoading, mode }: AnimeFormProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: initialData || {
      title: '',
      slug: '',
      kind: 'tv',
      status: 'released',
      score: 0,
      episodes_total: 12,
      description: '',
      poster_url: '',
      year: new Date().getFullYear(),
    }
  });

  const kindValue = watch('kind');
  const statusValue = watch('status');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-3xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" {...register('title', { required: 'Title is required' })} />
          {errors.title && <p className="text-xs text-accent-danger">{errors.title.message as string}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" {...register('slug', { required: 'Slug is required' })} />
          {errors.slug && <p className="text-xs text-accent-danger">{errors.slug.message as string}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="kind">Type</Label>
          <Select value={kindValue} onValueChange={(v) => setValue('kind', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tv">TV Series</SelectItem>
              <SelectItem value="movie">Movie</SelectItem>
              <SelectItem value="ova">OVA</SelectItem>
              <SelectItem value="ona">ONA</SelectItem>
              <SelectItem value="special">Special</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={statusValue} onValueChange={(v) => setValue('status', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ongoing">Ongoing</SelectItem>
              <SelectItem value="released">Released</SelectItem>
              <SelectItem value="announced">Announced</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="score">Score</Label>
          <Input 
            id="score" 
            type="number" 
            step="0.1" 
            min="0" 
            max="10" 
            {...register('score', { valueAsNumber: true })} 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="year">Year</Label>
          <Input 
            id="year" 
            type="number" 
            {...register('year', { valueAsNumber: true })} 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="episodes_total">Episodes Total</Label>
          <Input 
            id="episodes_total" 
            type="number" 
            {...register('episodes_total', { valueAsNumber: true })} 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="poster_url">Poster URL</Label>
          <Input id="poster_url" {...register('poster_url')} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea 
          id="description" 
          rows={5} 
          {...register('description')} 
          className="bg-bg-secondary"
        />
      </div>

      <div className="flex justify-end gap-4">
        <Button variant="outline" type="button" onClick={() => history.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === 'create' ? 'Create Anime' : 'Update Anime'}
        </Button>
      </div>
    </form>
  );
}
