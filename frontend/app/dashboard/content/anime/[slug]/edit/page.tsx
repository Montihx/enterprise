
'use client';

import { useParams } from 'next/navigation';
import { AnimeForm } from '@/components/dashboard/anime/AnimeForm';
import { useUpdateAnime } from '@/hooks/mutations';
import { useAnime } from '@/hooks/queries';
import { Loader2 } from 'lucide-react';

export default function EditAnimePage() {
  const params = useParams();
  const slug = params.slug as string;
  
  // Fetch existing data by slug (or ID if your backend supports UUID lookup in same route)
  const { data: anime, isLoading: isFetching } = useAnime(slug);
  const mutation = useUpdateAnime(anime?.id || '');

  const handleSubmit = async (data: any) => {
    if (anime?.id) {
       await mutation.mutateAsync(data);
    }
  };

  if (isFetching) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent-primary" />
      </div>
    );
  }

  if (!anime) {
    return <div>Anime not found</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Edit Anime</h1>
        <p className="text-text-muted">Update details for {anime.title}</p>
      </div>
      
      <div className="bg-bg-secondary p-6 rounded-lg border border-border">
        <AnimeForm 
          mode="edit" 
          initialData={anime}
          isLoading={mutation.isPending} 
          onSubmit={handleSubmit} 
        />
      </div>
    </div>
  );
}
