'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Loader2,
  ListVideo,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Pagination } from '@/components/ui/pagination';
import { useDeleteEpisode } from '@/hooks/mutations';
import { Badge } from '@/components/ui/badge';
import { useDebounce } from '@/hooks/useDebounce';

export default function EpisodesContentPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const deleteMutation = useDeleteEpisode();

  const { data: episodes, isLoading } = useQuery({
    queryKey: ['episodes', page, debouncedSearch],
    queryFn: async () => {
      const { data } = await api.get('/episodes/', { 
        params: { 
          skip: (page - 1) * 20, 
          limit: 20,
          q: debouncedSearch // Backend would handle simple filtering if implemented
        } 
      });
      return data;
    }
  });

  const handleDelete = async (id: string) => {
    if (confirm('Initiate destructive purge for this episode entity?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Episode Nodes</h1>
          <p className="text-text-muted font-medium mt-1 uppercase text-xs tracking-widest">Distributed Asset Registry</p>
        </div>
        <Link href="/dashboard/content/episodes/new">
          <Button className="bg-accent-primary hover:bg-accent-primary/90 font-bold px-6 shadow-xl shadow-accent-primary/20">
            <Plus className="mr-2 h-5 w-5" /> Provision Episode
          </Button>
        </Link>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-bg-secondary p-4 rounded-2xl border border-border shadow-lg">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted group-focus-within:text-accent-primary transition-colors" />
          <Input 
            placeholder="Search by episode title or ID..." 
            className="pl-10 bg-bg-primary/50 border-border h-12 rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-3xl border border-border bg-bg-secondary overflow-hidden shadow-2xl">
        <Table>
          <TableHeader className="bg-bg-tertiary/30">
            <TableRow className="hover:bg-transparent border-border h-14">
              <TableHead className="font-black uppercase tracking-widest text-[10px] text-text-muted pl-6">Index Placement</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px] text-text-muted">Title Metadata</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px] text-text-muted">Entity Map</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px] text-text-muted">Type Class</TableHead>
              <TableHead className="text-right pr-6 font-black uppercase tracking-widest text-[10px] text-text-muted">Operations</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-border">
                  <TableCell colSpan={5} className="h-20 animate-pulse text-center">
                    <div className="h-4 bg-bg-tertiary w-3/4 mx-auto rounded" />
                  </TableCell>
                </TableRow>
              ))
            ) : episodes && episodes.length > 0 ? (
              episodes.map((ep: any) => (
                <TableRow key={ep.id} className="hover:bg-bg-tertiary/30 border-border group transition-colors h-20">
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-3">
                       <div className="h-10 w-10 rounded-xl bg-accent-primary/10 flex items-center justify-center border border-accent-primary/20">
                          <span className="font-black text-accent-primary text-xs">S{ep.season}</span>
                       </div>
                       <div className="font-bold text-white text-lg">E{ep.episode}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                       <span className="font-bold text-white group-hover:text-accent-primary transition-colors">{ep.title || 'ARCHIVE_UNTITLED'}</span>
                       <span className="text-[10px] font-mono text-text-muted uppercase tracking-tighter">Cluster Segment</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-text-muted/30" />
                       <span className="font-mono text-xs text-text-muted">{ep.anime_id.substring(0, 13)}...</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {ep.is_filler ? (
                        <Badge className="bg-accent-warning/20 text-accent-warning border-0 font-black text-[9px] uppercase tracking-widest">Filler</Badge>
                      ) : ep.is_recap ? (
                        <Badge variant="outline" className="border-border text-text-muted font-black text-[9px] uppercase tracking-widest">Recap</Badge>
                      ) : (
                        <Badge className="bg-accent-success/20 text-accent-success border-0 font-black text-[9px] uppercase tracking-widest">Canon</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-9 w-9 p-0 text-text-muted hover:text-white hover:bg-bg-tertiary rounded-xl transition-all">
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-bg-secondary border-border shadow-2xl rounded-2xl p-2 w-48">
                        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-text-muted p-2">Segment Control</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-border" />
                        <Link href={`/dashboard/content/episodes/${ep.id}/edit`}>
                          <DropdownMenuItem className="cursor-pointer rounded-lg font-bold text-xs gap-3 p-2.5">
                            <Pencil className="h-4 w-4 text-accent-primary" /> Patch Metadata
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuSeparator className="bg-border" />
                        <DropdownMenuItem 
                          className="cursor-pointer rounded-lg font-bold text-xs gap-3 p-2.5 text-accent-danger focus:text-accent-danger focus:bg-accent-danger/10"
                          onClick={() => handleDelete(ep.id)}
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
                <TableCell colSpan={5} className="h-40 text-center">
                   <div className="flex flex-col items-center gap-3 opacity-20">
                    <ListVideo className="w-12 h-12" />
                    <p className="font-black uppercase tracking-[0.3em] text-xs">No Segments Indexed</p>
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