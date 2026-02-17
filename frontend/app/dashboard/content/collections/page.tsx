
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Trash2, 
  Loader2,
  Library,
  Star,
  Globe,
  Lock,
  Pencil
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuTrigger, 
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function CollectionsDashboardPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: collections, isLoading } = useQuery({
    queryKey: ['adminCollections'],
    queryFn: async () => {
      const { data } = await api.get('/interactions/collections');
      return data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/interactions/collections/${id}`);
    },
    onSuccess: () => {
      toast.success('Collection purged from registry');
      queryClient.invalidateQueries({ queryKey: ['adminCollections'] });
    }
  });

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Library className="h-8 w-8 text-accent-primary" />
            User Collections
          </h1>
          <p className="text-text-muted uppercase text-[10px] font-black tracking-widest mt-1">Curation & Audience Engagement</p>
        </div>
        <Button className="bg-accent-primary font-bold h-12 rounded-xl px-8 shadow-xl shadow-accent-primary/20">
          <Plus className="mr-2 h-5 w-5" /> Feature Collection
        </Button>
      </div>

      <div className="bg-bg-secondary p-4 rounded-3xl border border-border flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input 
            placeholder="Search collections by title or slug..." 
            className="pl-12 bg-bg-primary/50 border-border h-12 rounded-2xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-[32px] border border-border bg-bg-secondary overflow-hidden shadow-2xl">
        <Table>
          <TableHeader className="bg-bg-tertiary/30">
            <TableRow className="hover:bg-transparent h-16">
              <TableHead className="font-black uppercase tracking-widest text-[10px] text-text-muted pl-10">Collection Metadata</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px] text-text-muted">Visibility</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px] text-text-muted">Items</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px] text-text-muted">Metrics</TableHead>
              <TableHead className="text-right pr-10 font-black uppercase tracking-widest text-[10px] text-text-muted">Ops</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow><TableCell colSpan={5} className="h-64 text-center opacity-20"><Loader2 className="animate-spin h-10 w-10 mx-auto" /></TableCell></TableRow>
            ) : collections && collections.length > 0 ? (
              collections.map((col: any) => (
                <TableRow key={col.id} className="h-20 hover:bg-bg-tertiary/30 border-border group transition-colors">
                  <TableCell className="pl-10">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-bg-tertiary flex items-center justify-center border border-white/5 overflow-hidden">
                        {col.cover_url ? <img src={col.cover_url} className="w-full h-full object-cover" /> : <Library className="h-5 w-5 text-text-muted" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-white group-hover:text-accent-primary transition-colors truncate max-w-[200px]">{col.title}</div>
                        <div className="text-[10px] font-mono text-text-muted uppercase mt-0.5">SLUG: {col.slug}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {col.is_public ? (
                      <Badge className="bg-accent-success/10 text-accent-success border-accent-success/20 gap-1.5 font-black text-[9px] uppercase tracking-widest">
                        <Globe className="h-3 w-3" /> Public
                      </Badge>
                    ) : (
                      <Badge className="bg-text-muted/10 text-text-muted border-text-muted/20 gap-1.5 font-black text-[9px] uppercase tracking-widest">
                        <Lock className="h-3 w-3" /> Private
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-sm text-white">{col.items_count} <span className="text-[10px] text-text-muted font-normal uppercase tracking-tighter">Titles</span></div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-[10px] font-black text-text-muted uppercase">
                        <Star className="h-3 w-3 text-accent-warning" /> {col.likes_count} Likes
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-black text-text-muted uppercase">
                        <Globe className="h-3 w-3 text-accent-primary" /> {col.views_count} Views
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-text-muted hover:text-white rounded-xl"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-bg-secondary border-border shadow-2xl p-2 w-48">
                        <DropdownMenuItem className="cursor-pointer gap-3 font-bold text-xs p-2.5"><Star className="h-4 w-4 text-accent-warning" /> Mark Featured</DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer gap-3 font-bold text-xs p-2.5"><Pencil className="h-4 w-4" /> Edit Archive</DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-border" />
                        <DropdownMenuItem 
                          onClick={() => deleteMutation.mutate(col.id)}
                          className="cursor-pointer text-accent-danger gap-3 font-bold text-xs p-2.5"
                        >
                          <Trash2 className="h-4 w-4" /> Purge
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                   <div className="flex flex-col items-center gap-3 opacity-20 italic">
                    <Library className="h-12 w-12" />
                    <p className="font-black uppercase tracking-widest text-xs">Registry Empty</p>
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
