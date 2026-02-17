
'use client';

import { EpisodeForm } from '@/components/dashboard/episodes/EpisodeForm';
import { useCreateEpisode } from '@/hooks/mutations';

export default function CreateEpisodePage() {
  const mutation = useCreateEpisode();

  const handleSubmit = async (data: any) => {
    await mutation.mutateAsync(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Add New Episode</h1>
        <p className="text-text-muted">Manually add an episode to an anime.</p>
      </div>
      
      <div className="bg-bg-secondary p-6 rounded-lg border border-border">
        <EpisodeForm 
          mode="create" 
          isLoading={mutation.isPending} 
          onSubmit={handleSubmit} 
        />
      </div>
    </div>
  );
}
