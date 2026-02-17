'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  Terminal, 
  RefreshCw, 
  Loader2, 
  AlertCircle, 
  Clock,
  Info,
  ChevronDown,
  ChevronUp,
  Search,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface LogEntry {
  id: string;
  parser_job_id: string;
  level: string;
  message: string;
  details: any;
  created_at: string;
}

export default function GlobalParserLogsPage() {
  const [filterLevel, setFilterLevel] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: logs, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['globalParserLogs'],
    queryFn: async () => {
      const { data } = await api.get<LogEntry[]>('/dashboard/parsers/logs', {
        params: { limit: 200 }
      });
      return data;
    },
    refetchInterval: 5000 
  });

  const getLevelStyles = (level: string) => {
    switch (level.toUpperCase()) {
      case 'ERROR': return 'text-accent-danger bg-accent-danger/10 border-accent-danger/20';
      case 'WARNING': return 'text-accent-warning bg-accent-warning/10 border-accent-warning/20';
      case 'DEBUG': return 'text-text-muted bg-bg-tertiary border-border';
      default: return 'text-accent-success bg-accent-success/10 border-accent-success/20';
    }
  };

  const filteredLogs = logs?.filter(log => {
    const matchesLevel = !filterLevel || log.level.toUpperCase() === filterLevel;
    const matchesSearch = !search || 
      log.message.toLowerCase().includes(search.toLowerCase()) || 
      log.parser_job_id.toLowerCase().includes(search.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Terminal className="h-8 w-8 text-accent-primary" />
            System Control Feed
          </h1>
          <p className="text-text-muted mt-1 uppercase text-[10px] font-black tracking-widest">
            Cross-Node Ingestion Telemetry
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()} 
            disabled={isRefetching}
            className="border-border text-text-muted hover:text-white gap-2 h-10 px-4"
          >
            <RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
            {isRefetching ? 'Polling Cluster...' : 'Force Sync Feed'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted group-focus-within:text-accent-primary transition-colors" />
          <Input 
            placeholder="Filter logs by message, job ID or metadata..." 
            className="pl-12 bg-bg-secondary border-border h-12 rounded-xl focus:ring-accent-primary"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="lg:col-span-4 flex gap-2">
          {['ERROR', 'WARNING', 'INFO'].map(level => (
            <Button
              key={level}
              variant="outline"
              size="sm"
              onClick={() => setFilterLevel(filterLevel === level ? null : level)}
              className={cn(
                "flex-1 h-12 rounded-xl border-border font-black text-[10px] uppercase tracking-widest transition-all",
                filterLevel === level ? "bg-accent-primary border-accent-primary text-white shadow-lg shadow-accent-primary/30" : "text-text-muted hover:bg-bg-secondary"
              )}
            >
              {level}
            </Button>
          ))}
        </div>
      </div>

      <div className="bg-black/60 rounded-[32px] border border-border overflow-hidden backdrop-blur-xl shadow-[0_40px_100px_-20px_rgba(0,0,0,1)] ring-1 ring-white/5">
        <div className="bg-bg-tertiary/50 border-b border-border p-4 flex items-center justify-between shrink-0">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-accent-danger shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
            <div className="w-3 h-3 rounded-full bg-accent-warning shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
            <div className="w-3 h-3 rounded-full bg-accent-success shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black uppercase text-text-muted tracking-[0.4em]">Node: Kernel v2.4.1-STABLE</span>
            <div className="h-4 w-px bg-white/5" />
            <span className="text-[10px] font-bold text-accent-primary uppercase tracking-widest flex items-center gap-2">
              <Activity className="h-3 w-3 animate-pulse" /> Operational
            </span>
          </div>
        </div>

        <div className="p-6 h-[700px] overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1.5 custom-scrollbar flex flex-col">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-text-muted gap-4 opacity-50 italic">
              <Loader2 className="h-8 w-8 animate-spin text-accent-primary" />
              Establishing link to ingestion nodes...
            </div>
          ) : isError ? (
            <div className="h-full flex flex-col items-center justify-center text-accent-danger gap-3">
              <AlertCircle className="h-10 w-10" />
              <p className="font-black uppercase tracking-widest">Registry Link Failure</p>
            </div>
          ) : filteredLogs && filteredLogs.length > 0 ? (
            filteredLogs.map((log) => (
              <div key={log.id} className="flex flex-col">
                <div 
                  className={cn(
                    "group hover:bg-white/5 p-2 rounded-lg transition-colors flex items-start gap-4 cursor-pointer",
                    expandedId === log.id && "bg-white/5"
                  )}
                  onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                >
                  <span className="text-text-muted/40 shrink-0 w-20 select-none">
                    {format(new Date(log.created_at), 'HH:mm:ss')}
                  </span>
                  <Badge variant="outline" className={cn("h-5 shrink-0 border font-black text-[9px] px-1.5 gap-1 tracking-tighter uppercase", getLevelStyles(log.level))}>
                     {log.level}
                  </Badge>
                  <span className="text-text-muted shrink-0 w-16 font-mono text-[9px] truncate opacity-30 select-none">
                    [{log.parser_job_id.substring(0,6)}]
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-white/80 group-hover:text-white transition-colors">{log.message}</span>
                  </div>
                  {log.details && (
                    <div className="shrink-0 text-text-muted">
                      {expandedId === log.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </div>
                  )}
                </div>
                {expandedId === log.id && log.details && (
                  <div className="ml-44 mr-6 mb-4 mt-1 p-4 bg-black/40 rounded-xl border border-white/5 text-[10px] text-text-muted overflow-x-auto shadow-inner animate-in slide-in-from-top-2 duration-200">
                    <pre className="whitespace-pre-wrap leading-tight">{JSON.stringify(log.details, null, 2)}</pre>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-20 italic space-y-4">
              <Terminal className="h-12 w-12" />
              <p className="font-black uppercase tracking-widest">Log Buffer Empty</p>
            </div>
          )}
        </div>
        
        <div className="bg-bg-tertiary/30 border-t border-border p-3 flex items-center justify-between text-[9px] font-black text-text-muted uppercase tracking-widest px-8">
           <span>Total Records: {logs?.length || 0}</span>
           <span>Memory Utilization: {Math.round(((logs?.length || 0) / 200) * 100)}%</span>
           <span className="text-accent-primary">Secure Socket: Node-Log-Hub</span>
        </div>
      </div>
    </div>
  );
}
