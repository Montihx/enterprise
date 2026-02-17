'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Library, Search, Loader2, Star, Globe, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function CollectionsExplorer() {
  const { data: collections, isLoading } = useQuery({
    queryKey: ['publicCollections'],
    queryFn: async () => {
      const { data } = await api.get('/interactions/collections/public');
      return data;
    }
  });

  return (
    <div className="container mx-auto px-4 py-12 min-h-screen space-y-12">
      <div className="flex flex-col gap-4">
        <h1 className="text-5xl font-black text-white tracking-tighter uppercase flex items-center gap-4">
          <Library className="h-12 w-12 text-accent-primary" />
          Community Archives
        </h1>
        <p className="text-text-muted text-lg font-medium max-w-2xl leading-relaxed">
          Curated libraries of distributed content assets maintained by the Kitsu collective.
        </p>
      </div>

      <div className="sticky top-20 z-30 p-4 bg-bg-secondary/60 backdrop-blur-xl border border-border rounded-2xl shadow-2xl flex gap-4">
         <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted group-focus-within:text-accent-primary transition-colors" />
            <Input 
              placeholder="Search collections..." 
              className="pl-12 h-14 bg-bg-primary/50 border-border text-lg rounded-xl"
            />
         </div>
         <Badge className="bg-accent-primary h-14 px-6 rounded-xl font-black uppercase text-xs tracking-widest hidden md:flex items-center gap-2">
           <TrendingUp className="h-4 w-4" /> Top Charts
         </Badge>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center opacity-20"><Loader2 className="animate-spin h-12 w-12 text-accent-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {collections?.map((col: any) => (
            <Link key={col.id} href={`/collections/${col.id}`}>
              <Card className="bg-bg-secondary border-border hover:border-accent-primary/50 transition-all group overflow-hidden shadow-2xl hover:-translate-y-2">
                <div className="aspect-video relative overflow-hidden bg-bg-tertiary">
                   {col.cover_url ? (
                     <img src={col.cover_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={col.title} />
                   ) : (
                     <div className="absolute inset-0 flex items-center justify-center opacity-5"><Library className="w-32 h-32" /></div>
                   )}
                   <div className="absolute inset-0 bg-gradient-to-t from-bg-secondary via-transparent to-transparent" />
                   <div className="absolute bottom-4 left-6 right-6 flex justify-between items-end">
                      <Badge className="bg-black/60 border-white/10 backdrop-blur-md text-[10px] font-black uppercase tracking-widest">{col.items_count} Assets</Badge>
                      <div className="flex items-center gap-2 text-white/50 text-[10px] font-black uppercase">
                        <Star className="h-3 w-3 text-accent-warning fill-accent-warning" /> {col.likes_count}
                      </div>
                   </div>
                </div>
                <CardContent className="p-8 space-y-3">
                  <h3 className="text-2xl font-black text-white group-hover:text-accent-primary transition-colors truncate uppercase tracking-tighter">{col.title}</h3>
                  <p className="text-text-muted text-sm line-clamp-2 leading-relaxed font-medium">{col.description || 'No registry summary provided.'}</p>
                  <div className="pt-4 flex items-center gap-3">
                     <div className="h-6 w-6 rounded-full bg-bg-tertiary border border-border" />
                     <span className="text-[10px] font-black uppercase text-text-muted tracking-widest">Shard User: 0x{col.user_id.substring(0, 8)}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
