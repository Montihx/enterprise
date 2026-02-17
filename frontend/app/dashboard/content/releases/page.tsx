'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import { 
  Plus, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Loader2,
  ExternalLink,
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Pagination } from '@/components/ui/pagination';
import { useDeleteRelease } from '@/hooks/mutations';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function ReleasesContentPage() {
  const [page, setPage] = useState(1);
  const deleteMutation = useDeleteRelease();

  const { data: releases, isLoading } = useQuery({
    queryKey: ['releases', page],
    queryFn: async () => {
      const { data } = await api.get('/releases/', { params: { skip: (page - 1) * 20, limit: 20 } });
      return data;
    }
  });

  const handleDelete = async (id: string) => {
    if (confirm('Execute catastrophic purge of this video distribution node?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Release Network</h1>
          <p className="text-text-muted font-medium mt-1 uppercase text-xs tracking-widest">Global Distribution Points</p>
        </div>
        <Link href="/dashboard/content/releases/new">
          <Button className="bg-accent-primary hover:bg-accent-primary/90 font-bold px-6 shadow-xl shadow-accent-primary/20">
            <Plus className="mr-2 h-5 w-5" /> Deploy Source
          </Button>
        </Link>
      </div>

      <div className="rounded-3xl border border-border bg-bg-secondary overflow-hidden shadow-2xl">
        <Table>
          <TableHeader className="bg-bg-tertiary/30">
            <TableRow className="hover:bg-transparent border-border h-14">
              <TableHead className="font-black uppercase tracking-widest text-[10px] text-text-muted pl-6">Cdn Provider</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px] text-text-muted">Bandwidth / Resolution</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px] text-text-muted">Translation Layer</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px] text-text-muted">Status</TableHead>
              <TableHead className="text-right pr-6 font-black uppercase tracking-widest text-[10px] text-text-muted">Operations</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-border">
                  <TableCell colSpan={6} className="h-20 animate-pulse text-center opacity-20">CONNECTING_NODE...</TableCell>
                </TableRow>
              ))
            ) : releases && releases.length > 0 ? (
              releases.map((rel: any) => (
                <TableRow key={rel.id} className="hover:bg-bg-tertiary/30 border-border group transition-colors h-20">
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-3">
                       <div className="h-10 w-10 rounded-xl bg-bg-tertiary flex items-center justify-center border border-white/5">
                          <Globe className="h-5 w-5 text-accent-primary" />
                       </div>
                       <div className="flex flex-col">
                          <span className="capitalize font-black text-white text-sm tracking-tight">{rel.source}</span>
                          <span className="text-[9px] font-mono text-text-muted uppercase">Endpoint: {rel.id.substring(0, 8)}</span>
                       </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <Zap className="h-3.5 w-3.5 text-accent-warning" />
                       <Badge className="bg-bg-tertiary text-text-secondary border-border font-mono text-xs">{rel.quality || 'N/A'}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-3.5 w-3.5 text-accent-success" />
                        <span className="font-bold text-white text-sm">{rel.translation_team || 'SYSTEM_CORE'}</span>
                      </div>
                      <span className="text-[10px] text-text-muted uppercase tracking-widest font-black ml-5">{rel.translation_type}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {rel.is_active ? (
                      <div className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-accent-success animate-pulse" />
                         <span className="text-[10px] font-black uppercase text-accent-success tracking-[0.2em]">Operational</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-text-muted" />
                         <span className="text-[10px] font-black uppercase text-text-muted tracking-[0.2em]">Decommissioned</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-9 w-9 p-0 text-text-muted hover:text-white hover:bg-bg-tertiary rounded-xl transition-all">
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-bg-secondary border-border shadow-2xl rounded-2xl p-2 w-52">
                        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-text-muted p-2">Node Operations</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-border" />
                        <DropdownMenuItem 
                          onClick={() => window.open(rel.url, '_blank')}
                          className="cursor-pointer rounded-lg font-bold text-xs gap-3 p-2.5"
                        >
                          <ExternalLink className="h-4 w-4 text-text-muted" /> Ping Endpoint
                        </DropdownMenuItem>
                        <Link href={`/dashboard/content/releases/${rel.id}/edit`}>
                          <DropdownMenuItem className="cursor-pointer rounded-lg font-bold text-xs gap-3 p-2.5">
                            <Pencil className="h-4 w-4 text-accent-primary" /> Patch Logic
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuSeparator className="bg-border" />
                        <DropdownMenuItem 
                          className="cursor-pointer rounded-lg font-bold text-xs gap-3 p-2.5 text-accent-danger focus:text-accent-danger focus:bg-accent-danger/10" 
                          onClick={() => handleDelete(rel.id)}
                        >
                          <Trash2 className="h-4 w-4" /> Purge Node
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-40">
                  <div className="flex flex-col items-center gap-3 opacity-20">
                    <Globe className="w-12 h-12" />
                    <p className="font-black uppercase tracking-[0.3em] text-xs">No Assets Provisioned</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex justify-center mt-8">
        <Pagination currentPage={page} totalPages={10} onPageChange={setPage} isLoading={isLoading} />
      </div>
    </div>
  );
}