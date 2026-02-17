'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  Terminal, 
  ChevronLeft, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Info,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface LogEntry {
  id: string;
  level: string;
  message: string;
  details: any;
  created_at: string;
}

export default function JobLogsPage() {
  const params = useParams();
  const jobId = params.id as string;

  const { data: logs, isLoading, isError } = useQuery({
    queryKey: ['jobLogs', jobId],
    queryFn: async () => {
      const { data } = await api.get<LogEntry[]>(`/dashboard/parsers/jobs/${jobId}/logs`);
      return data;
    },
    refetchInterval: 3000 // Refresh logs every 3s
  });

  const getLevelStyles = (level: string) => {
    switch (level.toUpperCase()) {
      case 'ERROR': return 'text-accent-danger bg-accent-danger/10 border-accent-danger/20';
      case 'WARNING': return 'text-accent-warning bg-accent-warning/10 border-accent-warning/20';
      case 'DEBUG': return 'text-text-muted bg-bg-tertiary border-border';
      default: return 'text-accent-success bg-accent-success/10 border-accent-success/20';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level.toUpperCase()) {
      case 'ERROR': return <AlertCircle className="h-3 w-3" />;
      case 'WARNING': return <AlertCircle className="h-3 w-3" />;
      case 'DEBUG': return <Clock className="h-3 w-3" />;
      default: return <Info className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/parsers/jobs">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Terminal className="h-8 w-8 text-accent-primary" />
              Job Console
            </h1>
            <p className="text-text-muted font-mono text-xs mt-1">ID: {jobId}</p>
          </div>
        </div>
      </div>

      <div className="bg-black/40 rounded-xl border border-border overflow-hidden backdrop-blur-sm shadow-2xl">
        {/* Console Header */}
        <div className="bg-bg-tertiary/50 border-b border-border p-3 flex items-center justify-between">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-accent-danger" />
            <div className="w-3 h-3 rounded-full bg-accent-warning" />
            <div className="w-3 h-3 rounded-full bg-accent-success" />
          </div>
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
            {isLoading ? 'Connecting...' : `Logs Stream: ${logs?.length || 0} entries`}
          </div>
        </div>

        {/* Log Stream */}
        <div className="p-4 h-[600px] overflow-y-auto font-mono text-xs space-y-2 custom-scrollbar flex flex-col-reverse">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-text-muted gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Initializing stream...
            </div>
          ) : isError ? (
            <div className="h-full flex items-center justify-center text-accent-danger gap-2">
              <AlertCircle className="h-4 w-4" />
              Failed to connect to log node.
            </div>
          ) : logs && logs.length > 0 ? (
            logs.map((log) => (
              <div key={log.id} className="group hover:bg-white/5 p-2 rounded transition-colors flex gap-4">
                <span className="text-text-muted shrink-0 w-24">
                  {format(new Date(log.created_at), 'HH:mm:ss.SSS')}
                </span>
                <Badge variant="outline" className={cn("h-5 border font-black text-[10px] px-1 gap-1", getLevelStyles(log.level))}>
                   {getLevelIcon(log.level)}
                   {log.level}
                </Badge>
                <div className="flex-1 min-w-0">
                  <span className="text-text-secondary leading-relaxed break-words">{log.message}</span>
                  {log.details && (
                    <div className="mt-2 p-2 bg-black/50 rounded border border-white/5 text-[10px] text-text-muted overflow-x-auto">
                      <pre>{JSON.stringify(log.details, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex items-center justify-center text-text-muted italic opacity-50">
              Awaiting execution data...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}