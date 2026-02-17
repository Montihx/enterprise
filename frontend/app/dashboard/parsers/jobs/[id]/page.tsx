'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  Activity, 
  Terminal, 
  ChevronLeft, 
  Loader2, 
  PlusCircle, 
  RefreshCw, 
  AlertCircle,
  Clock,
  History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useParserSocket } from '@/hooks/useParserSocket';
import { cn } from '@/lib/utils';

export default function JobDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: job, isLoading: isJobLoading } = useQuery({
    queryKey: ['parserJob', id],
    queryFn: async () => {
      const { data } = await api.get(`/dashboard/parsers/jobs/${id}`);
      return data;
    },
  });

  const { telemetry, status: wsStatus } = useParserSocket(id);

  // Merge server data with live telemetry
  const displayProgress = telemetry?.progress ?? job?.progress ?? 0;
  const displayStats = telemetry?.stats ?? {
    create: job?.items_created ?? 0,
    update: job?.items_updated ?? 0,
    fail: job?.items_failed ?? 0,
    skip: job?.items_skipped ?? 0,
    proc: job?.items_processed ?? 0
  };

  if (isJobLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/parsers/jobs">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3 uppercase">
               Ingestion Node {id.substring(0, 8)}
            </h1>
            <div className="flex items-center gap-2 mt-1">
               <Badge className={cn(
                 "text-[10px] uppercase font-black tracking-widest px-2 py-0.5 border-0",
                 wsStatus === 'connected' ? "bg-accent-success text-white" : "bg-accent-warning text-white"
               )}>
                 {wsStatus === 'connected' ? 'Live Telemetry' : 'Syncing state...'}
               </Badge>
               <span className="text-text-muted text-[10px] font-mono">Cluster: Shikimori-V1</span>
            </div>
          </div>
        </div>
        <Link href={`/dashboard/parsers/jobs/${id}/logs`}>
          <Button variant="outline" className="border-accent-primary text-accent-primary hover:bg-accent-primary hover:text-white font-black text-xs uppercase tracking-widest gap-2">
            <Terminal className="h-4 w-4" /> System Console
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Progress Controller */}
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-bg-secondary border border-border rounded-3xl p-8 shadow-2xl relative overflow-hidden">
             <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-xl font-bold text-white">Reconciliation Stream</h3>
                  <p className="text-sm text-text-muted">Master metadata alignment progress</p>
                </div>
                <div className="text-4xl font-black text-accent-primary">{displayProgress}%</div>
             </div>
             
             <Progress value={displayProgress} className="h-4 bg-bg-tertiary" />
             
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10">
                <div className="p-4 bg-bg-tertiary/50 rounded-2xl border border-border">
                   <div className="text-[10px] font-black uppercase text-text-muted tracking-widest mb-1">Created</div>
                   <div className="text-2xl font-bold text-accent-success">+{displayStats.create}</div>
                </div>
                <div className="p-4 bg-bg-tertiary/50 rounded-2xl border border-border">
                   <div className="text-[10px] font-black uppercase text-text-muted tracking-widest mb-1">Updated</div>
                   <div className="text-2xl font-bold text-accent-warning">~{displayStats.update}</div>
                </div>
                <div className="p-4 bg-bg-tertiary/50 rounded-2xl border border-border">
                   <div className="text-[10px] font-black uppercase text-text-muted tracking-widest mb-1">Skipped</div>
                   <div className="text-2xl font-bold text-text-muted">{displayStats.skip}</div>
                </div>
                <div className="p-4 bg-bg-tertiary/50 rounded-2xl border border-border">
                   <div className="text-[10px] font-black uppercase text-text-muted tracking-widest mb-1">Errors</div>
                   <div className="text-2xl font-bold text-accent-danger">!{displayStats.fail}</div>
                </div>
             </div>
           </div>

           <div className="bg-bg-secondary border border-border rounded-3xl p-8 shadow-2xl">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-tight">
                 <History className="h-5 w-5 text-accent-primary" /> Recent Log Segments
              </h3>
              <div className="space-y-3">
                 {/* In a real implementation, we would query the last 5 logs here */}
                 <div className="text-center py-10 text-text-muted italic opacity-50">
                    Console stream established. Logs routing to separate node.
                 </div>
              </div>
           </div>
        </div>

        {/* Node Manifest */}
        <div className="space-y-6">
           <div className="bg-bg-secondary border border-border rounded-3xl p-8 shadow-2xl">
              <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-tight">Node Manifest</h3>
              <div className="space-y-6">
                 <div className="flex justify-between items-center pb-4 border-b border-border">
                    <span className="text-sm font-medium text-text-muted">Status</span>
                    <Badge className={cn(
                      "uppercase font-black text-[9px] px-2",
                      job.status === 'completed' ? "bg-accent-success" : "bg-accent-primary"
                    )}>{job.status}</Badge>
                 </div>
                 <div className="flex justify-between items-center pb-4 border-b border-border">
                    <span className="text-sm font-medium text-text-muted">Parser Provider</span>
                    <span className="text-sm font-bold text-white uppercase">{job.parser_name}</span>
                 </div>
                 <div className="flex justify-between items-center pb-4 border-b border-border">
                    <span className="text-sm font-medium text-text-muted">Ingestion Type</span>
                    <span className="text-sm font-bold text-white uppercase">{job.job_type.replace('_', ' ')}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-text-muted">Initiated At</span>
                    <span className="text-sm font-bold text-white">{new Date(job.created_at).toLocaleTimeString()}</span>
                 </div>
              </div>
           </div>

           <div className="p-6 rounded-3xl bg-accent-primary/5 border border-accent-primary/20">
              <h4 className="font-bold text-accent-primary mb-2 flex items-center gap-2 text-sm uppercase">
                 <Activity className="h-4 w-4" /> Telemetry Note
              </h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                 Progress tracking is powered by Redis Pub/Sub v2. WebSocket frequency is throttled to 1Hz to maintain cluster stability.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
