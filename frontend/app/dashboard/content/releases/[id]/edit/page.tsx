
'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ReleaseForm } from '@/components/dashboard/releases/ReleaseForm';
import { useUpdateRelease } from '@/hooks/mutations';
import { Loader2 } from 'lucide-react';

export default function EditReleasePage() {
  const params = useParams();
  const id = params.id as string;
  const mutation = useUpdateRelease(id);

  const { data: release, isLoading } = useQuery({
    queryKey: ['release', id],
    queryFn: async () => {
      const { data } = await api.get(`/releases/${id}`);
      return data;
    }
  });

  const handleSubmit = async (data: any) => {
    await mutation.mutateAsync(data);
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-accent-primary" /></div>;
  }

  if (!release) return <div>Release not found</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Edit Release</h1>
        <p className="text-text-muted">{release.source} - {release.quality}</p>
      </div>
      
      <div className="bg-bg-secondary p-6 rounded-lg border border-border">
        <ReleaseForm 
          mode="edit" 
          initialData={release}
          isLoading={mutation.isPending} 
          onSubmit={handleSubmit} 
        />
      </div>
    </div>
  );
}
