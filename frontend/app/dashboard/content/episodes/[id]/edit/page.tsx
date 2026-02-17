
'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { EpisodeForm } from '@/components/dashboard/episodes/EpisodeForm';
import { useUpdateEpisode } from '@/hooks/mutations';
import { Loader2 } from 'lucide-react';

export default function EditEpisodePage() {
  const params = useParams();
  const id = params.id as string;
  const mutation = useUpdateEpisode(id);

  const { data: episode, isLoading } = useQuery({
    queryKey: ['episode', id],
    queryFn: async () => {
      const { data } = await api.get(`/episodes/${id}`);
      return data;
    }
  });

  const handleSubmit = async (data: any) => {
    await mutation.mutateAsync(data);
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-accent-primary" /></div>;
  }

  if (!episode) return <div>Episode not found</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Edit Episode</h1>
        <p className="text-text-muted">S{episode.season} E{episode.episode}</p>
      </div>
      
      <div className="bg-bg-secondary p-6 rounded-lg border border-border">
        <EpisodeForm 
          mode="edit" 
          initialData={episode}
          isLoading={mutation.isPending} 
          onSubmit={handleSubmit} 
        />
      </div>
    </div>
  );
}
