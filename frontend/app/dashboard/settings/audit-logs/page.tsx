'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
// Fix: Added missing Clock icon import from lucide-react
import { 
  ShieldCheck, 
  History, 
  Search, 
  RefreshCw, 
  Loader2, 
  User, 
  Database,
  Filter,
  Clock
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function AuditLogsPage() {
  const [search, setSearch] = useState('');

  const { data: logs, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['systemAuditLogs'],
    queryFn: async () => {
      const { data } = await api.get('/system/audit-logs'); // Note: Ensure this endpoint is added to backend/app/api/v1/endpoints/system.py
      return data;
    }
  });

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create': return 'text-accent-success bg-accent-success/10 border-accent-success/20';
      case 'delete': return 'text-accent-danger bg-accent-danger/10 border-accent-danger/20';
      case 'update': return 'text-accent-warning bg-accent-warning/10 border-accent-warning/20';
      default: return 'text-accent-primary bg-accent-primary/10 border-accent-primary/20';
    }
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-accent-primary" />
            Forensic Audit Trail
          </h1>
          <p className="text-text-muted mt-1 uppercase text-[10px] font-black tracking-widest">Administrative Mutation Registry</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => refetch()} 
          disabled={isRefetching}
          className="h-12 border-border bg-bg-secondary hover:bg-bg-tertiary rounded-2xl px-6 group transition-all"
        >
          <RefreshCw className={cn("mr-2 h-4 w-4 text-accent-primary", isRefetching && "animate-spin")} />
          <span className="font-bold uppercase text-[10px] tracking-widest">Refresh Feed</span>
        </Button>
      </div>

      <div className="bg-bg-secondary p-4 rounded-3xl border border-border flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted group-focus-within:text-accent-primary transition-colors" />
          <Input 
            placeholder="Query records by action, resource or actor ID..." 
            className="pl-12 bg-bg-primary/50 border-border h-12 rounded-2xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-12 border-border gap-2 rounded-2xl px-6 text-[10px] font-black uppercase tracking-widest">
           <Filter className="h-4 w-4" /> Advanced Filter
        </Button>
      </div>

      <div className="rounded-[32px] border border-border bg-bg-secondary overflow-hidden shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/5">
        <Table>
          <TableHeader className="bg-bg-tertiary/30">
            <TableRow className="hover:bg-transparent h-16">
              <TableHead className="font-black uppercase tracking-widest text-[10px] text-text-muted pl-10">Timestamp</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px] text-text-muted">Actor Node</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px] text-text-muted">Action Pulse</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px] text-text-muted">Target Entity</TableHead>
              <TableHead className="text-right pr-10 font-black uppercase tracking-widest text-[10px] text-text-muted">Network Origin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow><TableCell colSpan={5} className="h-64 text-center opacity-20"><Loader2 className="animate-spin h-10 w-10 mx-auto text-accent-primary" /></TableCell></TableRow>
            ) : logs && logs.length > 0 ? (
              logs.map((log: any) => (
                <TableRow key={log.id} className="h-20 hover:bg-bg-tertiary/30 border-border group transition-colors">
                  <TableCell className="pl-10">
                    <div className="flex items-center gap-3">
                       <Clock className="h-4 w-4 text-text-muted opacity-30" />
                       <span className="font-mono text-xs text-text-muted">{format(new Date(log.created_at), 'MMM dd, HH:mm:ss')}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                       <div className="h-8 w-8 rounded-lg bg-bg-tertiary flex items-center justify-center border border-white/5">
                          <User className="h-4 w-4 text-accent-primary" />
                       </div>
                       <div className="flex flex-col">
                          <span className="font-bold text-white text-xs tracking-tight">Root_Admin</span>
                          <span className="text-[9px] font-mono text-text-muted uppercase">0x{log.actor_id?.substring(0,8)}</span>
                       </div>
                    </div>
                  </TableCell>
                  <TableCell>
                     <Badge variant="outline" className={cn("font-black text-[9px] uppercase tracking-widest px-2", getActionColor(log.action))}>
                        {log.action}
                     </Badge>
                  </TableCell>
                  <TableCell>
                     <div className="flex items-center gap-3">
                        <Database className="h-3.5 w-3.5 text-text-muted opacity-50" />
                        <span className="text-xs font-bold text-white uppercase">{log.resource_type}</span>
                        <span className="text-[10px] font-mono text-text-muted opacity-40">:: {log.resource_id?.substring(0,8)}</span>
                     </div>
                  </TableCell>
                  <TableCell className="text-right pr-10">
                     <span className="text-[10px] font-mono text-text-muted bg-bg-primary/50 px-3 py-1 rounded-full border border-border">{log.actor_ip || '127.0.0.1'}</span>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                   <div className="flex flex-col items-center gap-3 opacity-20 italic">
                    <History className="h-12 w-12" />
                    <p className="font-black uppercase tracking-widest text-xs">Audit Buffer Empty</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
