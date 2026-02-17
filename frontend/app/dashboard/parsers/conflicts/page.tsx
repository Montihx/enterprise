
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  ArrowRightLeft,
  Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useResolveConflict } from '@/hooks/mutations';

interface Conflict {
  id: string;
  conflict_type: string;
  item_type: string;
  item_id: string;
  existing_data: any;
  incoming_data: any;
  created_at: string;
}

export default function ConflictsPage() {
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null);
  const resolveMutation = useResolveConflict();

  const { data: conflicts, isLoading } = useQuery({
    queryKey: ['parserConflicts'],
    queryFn: async () => {
      const { data } = await api.get<Conflict[]>('/dashboard/parsers/conflicts');
      return data;
    }
  });

  const handleResolve = async (strategy: string) => {
    if (selectedConflict) {
      await resolveMutation.mutateAsync({ id: selectedConflict.id, strategy });
      setSelectedConflict(null);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-accent-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <AlertTriangle className="w-8 h-8 text-accent-warning" />
          Metadata Conflicts
        </h1>
        <p className="text-text-muted mt-1 uppercase text-[10px] font-black tracking-widest">Reconciliation Queue</p>
      </div>

      <div className="grid gap-4">
        {conflicts && conflicts.length > 0 ? (
          conflicts.map((conflict) => (
            <Card key={conflict.id} className="bg-bg-secondary border-border hover:border-accent-primary/20 transition-all group">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-accent-warning/10 border border-accent-warning/20">
                    <AlertTriangle className="h-6 w-6 text-accent-warning" />
                  </div>
                  <div>
                    <h4 className="font-black text-white uppercase text-sm tracking-tight">
                      {conflict.conflict_type.replace(/,/g, ' + ')}
                    </h4>
                    <p className="text-sm text-text-muted mt-1">
                      Discrepancy detected for <span className="text-white font-bold">{conflict.existing_data?.title || 'Unknown Node'}</span>
                    </p>
                    <div className="flex gap-3 mt-3">
                      <Badge variant="outline" className="border-border text-text-muted uppercase text-[9px] font-black tracking-widest h-6 px-3 bg-white/5">
                        {conflict.item_type}
                      </Badge>
                      <span className="text-[10px] font-mono text-text-muted mt-1 opacity-50">
                        {new Date(conflict.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={() => setSelectedConflict(conflict)}
                  className="bg-accent-primary hover:bg-accent-primary/90 font-black uppercase text-[10px] tracking-widest px-8 rounded-xl h-11 shadow-xl shadow-accent-primary/20"
                >
                  Review Delta
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-32 border-2 border-dashed border-border rounded-[40px] bg-bg-secondary/50">
            <CheckCircle className="h-16 w-16 mx-auto mb-6 text-accent-success opacity-20" />
            <h3 className="text-2xl font-black text-white tracking-tight uppercase">Registry Synchronized</h3>
            <p className="text-text-muted font-medium mt-2">All incoming metadata pulses match the local state.</p>
          </div>
        )}
      </div>

      <Dialog open={!!selectedConflict} onOpenChange={(o) => !o && setSelectedConflict(null)}>
        <DialogContent className="max-w-4xl bg-bg-secondary border-border text-white rounded-3xl p-10 shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] ring-1 ring-white/10">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
               <div className="p-2 bg-accent-warning/20 rounded-xl"><AlertTriangle className="h-5 w-5 text-accent-warning" /></div>
               <DialogTitle className="text-2xl font-black tracking-tight uppercase">Reconciliation Interface</DialogTitle>
            </div>
            <DialogDescription className="text-text-muted font-medium">Compare the current registry state with the incoming provider pulse.</DialogDescription>
          </DialogHeader>
          
          {selectedConflict && (
            <div className="grid grid-cols-2 gap-8 my-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-text-muted" />
                   <h4 className="font-black text-text-muted uppercase text-[10px] tracking-widest">Active Registry Node</h4>
                </div>
                <div className="p-6 rounded-2xl bg-bg-primary/50 border border-border space-y-4 shadow-inner">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Title</span>
                    <p className="font-bold text-white leading-tight">{selectedConflict.existing_data.title}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Episodes</span>
                      <p className="font-mono text-accent-success font-black">{selectedConflict.existing_data.eps || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Score</span>
                      <p className="font-mono text-accent-warning font-black">{selectedConflict.existing_data.score || '0.0'}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Registry ID</span>
                    <p className="font-mono text-[10px] text-text-muted truncate">{selectedConflict.item_id}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse" />
                   <h4 className="font-black text-accent-primary uppercase text-[10px] tracking-widest">Incoming Pulse Data</h4>
                </div>
                <div className="p-6 rounded-2xl bg-accent-primary/5 border border-accent-primary/20 space-y-4 shadow-xl">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Title</span>
                    <p className="font-bold text-white leading-tight">{selectedConflict.incoming_data.title}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Episodes</span>
                      <p className="font-mono text-accent-success font-black">{selectedConflict.incoming_data.episodes_total}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Score</span>
                      <p className="font-mono text-accent-warning font-black">{selectedConflict.incoming_data.score}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Provider ID</span>
                    <p className="font-mono text-[10px] text-text-muted truncate">SHIKI__{selectedConflict.incoming_data.shikimori_id}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-4 sm:justify-between pt-6 border-t border-white/5">
            <Button 
              variant="outline" 
              onClick={() => handleResolve('ignore')}
              disabled={resolveMutation.isPending}
              className="h-12 border-border text-text-muted hover:text-white font-black uppercase text-[10px] tracking-widest px-8 rounded-xl"
            >
              <XCircle className="mr-2 h-4 w-4" /> Drop Incoming
            </Button>
            <Button 
              onClick={() => handleResolve('replace')}
              disabled={resolveMutation.isPending}
              className="h-12 bg-accent-primary hover:bg-accent-primary/90 text-white font-black uppercase text-[10px] tracking-widest px-10 rounded-xl shadow-2xl shadow-accent-primary/30"
            >
              {resolveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRightLeft className="mr-2 h-4 w-4" />}
              Execute Patch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
