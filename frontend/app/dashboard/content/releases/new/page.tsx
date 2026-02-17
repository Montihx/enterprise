
'use client';

import { ReleaseForm } from '@/components/dashboard/releases/ReleaseForm';
import { useCreateRelease } from '@/hooks/mutations';

export default function CreateReleasePage() {
  const mutation = useCreateRelease();

  const handleSubmit = async (data: any) => {
    await mutation.mutateAsync(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Add New Release</h1>
        <p className="text-text-muted">Add a video source for an episode.</p>
      </div>
      
      <div className="bg-bg-secondary p-6 rounded-lg border border-border">
        <ReleaseForm 
          mode="create" 
          isLoading={mutation.isPending} 
          onSubmit={handleSubmit} 
        />
      </div>
    </div>
  );
}
