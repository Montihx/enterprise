'use client';

import { useState } from 'react';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Pencil, 
  Trash2,
  Filter,
  Loader2,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Pagination } from '@/components/ui/pagination';
import { useAnimeList } from '@/hooks/queries';
import { useDeleteAnime, useBulkAction } from '@/hooks/mutations';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

export default function AnimeContentPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 500);
  const { data: response, isLoading } = useAnimeList({ page, limit: 12, q: debouncedSearch });
  const animeList = response?.data || [];
  
  const deleteMutation = useDeleteAnime();
  const bulkMutation = useBulkAction('anime');

  const handleBulkDelete = async () => {
    if (confirm(`Execute destructive purge on ${selectedIds.length} entities?`)) {
      await bulkMutation.mutateAsync({ ids: selectedIds, action: 'delete' });
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Content Archives</h1>
          <p className="text-text-muted uppercase text-[10px] font-black tracking-[0.2em] mt-1 italic">Distributed Meta-Registry</p>
        </div>
        <div className="flex gap-4">
           {selectedIds.length > 0 && (
             <Button 
               variant="destructive" 
               onClick={handleBulkDelete}
               className="h-12 px-6 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-accent-danger/20"
             >
               <Trash2 className="mr-2 h-4 w-4" /> Purge ({selectedIds.length})
             </Button>
           )}
           <Link href="/dashboard/content/anime/new">
             <Button className="bg-accent-primary font-bold h-12 rounded-xl px-8 shadow-xl shadow-accent-primary/20">
               <Plus className="mr-2 h-5 w-5" /> Provision Entity
             </Button>
           </Link>
        </div>
      </div>

      <div className="flex gap-4 bg-bg-secondary p-4 rounded-3xl border border-border">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input 
            placeholder="Query records by title or slug..." 
            className="pl-12 bg-bg-primary/50 border-border h-12 rounded-2xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-[32px] border border-border bg-bg-secondary overflow-hidden shadow-2xl">
        <Table>
          <TableHeader className="bg-bg-tertiary/30 border-b border-border">
            <TableRow className="hover:bg-transparent h-16">
              <TableHead className="w-12 pl-6">
                <Checkbox 
                  checked={selectedIds.length === animeList.length && animeList.length > 0}
                  onCheckedChange={(checked) => {
                    setSelectedIds(checked ? animeList.map(a => a.id) : []);
                  }}
                />
              </TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px] text-text-muted">Entity Identification</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px] text-text-muted">Gateway Status</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px] text-text-muted">Class</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px] text-text-muted">Rank</TableHead>
              <TableHead className="text-right pr-6 font-black uppercase tracking-widest text-[10px] text-text-muted">Ops</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow><TableCell colSpan={6} className="h-64 text-center opacity-20"><Loader2 className="animate-spin h-10 w-10 mx-auto" /></TableCell></TableRow>
            ) : animeList.map((anime) => (
              <TableRow key={anime.id} className="h-20 hover:bg-bg-tertiary/30 border-border group transition-colors">
                <TableCell className="pl-6">
                  <Checkbox checked={selectedIds.includes(anime.id)} onCheckedChange={() => toggleSelect(anime.id)} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-9 rounded-lg overflow-hidden flex-shrink-0 border border-white/5">
                       <img src={anime.poster_url} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-white group-hover:text-accent-primary transition-colors truncate max-w-[200px]">{anime.title}</div>
                      <div className="text-[9px] font-mono text-text-muted uppercase mt-0.5">{anime.id.substring(0,8)}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell><Badge variant="outline" className="capitalize font-black text-[9px] tracking-widest">{anime.status}</Badge></TableCell>
                <TableCell className="uppercase text-text-secondary text-[9px] font-black tracking-widest">{anime.kind}</TableCell>
                <TableCell><span className="font-mono text-xs font-black text-accent-warning">★ {anime.score}</span></TableCell>
                <TableCell className="text-right pr-6">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-text-muted hover:text-white rounded-xl"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-bg-secondary border-border shadow-2xl p-2 w-48">
                      <Link href={`/dashboard/content/anime/${anime.slug}/edit`}><DropdownMenuItem className="cursor-pointer gap-3 font-bold text-xs p-2.5"><Pencil className="h-4 w-4" /> Patch Node</DropdownMenuItem></Link>
                      <DropdownMenuSeparator className="bg-border" />
                      <DropdownMenuItem onClick={() => setDeleteId(anime.id)} className="cursor-pointer text-accent-danger gap-3 font-bold text-xs p-2.5"><Trash2 className="h-4 w-4" /> Purge Entity</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
