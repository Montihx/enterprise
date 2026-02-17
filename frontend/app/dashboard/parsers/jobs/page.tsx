'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Terminal, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export default function ParserJobsPage() {
  const [page, setPage] = useState(1);
  
  const { data: jobs, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['parserJobs', page],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/parsers/jobs', {
        params: { skip: (page - 1) * 20, limit: 20 }
      });
      return data;
    },
    refetchInterval: 5000 // Poll every 5s for updates
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-accent-success hover:bg-accent-success';
      case 'running': return 'bg-accent-primary hover:bg-accent-primary animate-pulse';
      case 'failed': return 'bg-accent-danger hover:bg-accent-danger';
      case 'pending': return 'bg-accent-warning hover:bg-accent-warning';
      default: return 'bg-bg-tertiary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Job History</h1>
          <p className="text-text-muted">Execution logs of parser tasks.</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isRefetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="rounded-md border border-border bg-bg-secondary overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Parser</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Results</TableHead>
              <TableHead>Started</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="flex justify-center"><Loader2 className="animate-spin text-accent-primary" /></div>
                </TableCell>
              </TableRow>
            ) : jobs && jobs.length > 0 ? (
              jobs.map((job: any) => (
                <TableRow key={job.id} className="hover:bg-bg-tertiary/50 group">
                  <TableCell className="capitalize font-bold text-white">{job.parser_name}</TableCell>
                  <TableCell className="capitalize text-text-secondary text-xs">{job.job_type.replace('_', ' ')}</TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(job.status)} text-white border-0 text-[10px] uppercase font-black`}>
                      {job.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="w-24 h-2 bg-bg-primary rounded-full overflow-hidden border border-white/5">
                      <div 
                        className="h-full bg-accent-primary transition-all duration-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]" 
                        style={{ width: `${job.progress}%` }} 
                      />
                    </div>
                    <span className="text-[10px] font-bold text-text-muted mt-1.5 block uppercase">{job.progress}% Complete</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-[10px] font-bold uppercase gap-1">
                      <span className="text-accent-success">+{job.items_created} Created</span>
                      <span className="text-accent-warning">~{job.items_updated} Updated</span>
                      {job.items_failed > 0 && <span className="text-accent-danger">!{job.items_failed} Failed</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-text-muted">
                    {job.created_at ? formatDistanceToNow(new Date(job.created_at), { addSuffix: true }) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/parsers/jobs/${job.id}/logs`}>
                      <Button variant="ghost" size="sm" className="h-8 gap-2 text-text-muted hover:text-accent-primary">
                        <Terminal className="h-3.5 w-3.5" />
                        <span className="text-xs font-bold uppercase tracking-widest hidden md:inline">Logs</span>
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-text-muted">
                  No job history found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}