
'use client';

import React, { useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Ban, Loader2, FileText, Tag, AlertTriangle } from 'lucide-react';

interface BlacklistSettingsProps {
  config: any;
  description?: string;
  onSave: (values: { config: any; description: string }) => void;
  isLoading?: boolean;
}

export function BlacklistSettings({ config, description, onSave, isLoading }: BlacklistSettingsProps) {
  const defaultValues = useMemo(() => ({
    banned_genres: config?.banned_genres || 'Hentai, Yaoi, Yuri, Boys Love, Girls Love',
    banned_keywords: config?.banned_keywords || 'camrip, ts, gambling',
    description: description || ''
  }), [config, description]);

  const form = useForm({ defaultValues });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const handleFormSubmit = (data: any) => {
    const { description, ...configValues } = data;
    onSave({ config: configValues, description: description || '' });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8 animate-in fade-in duration-500">
        <Card className="bg-bg-secondary border-border shadow-inner ring-1 ring-white/5 overflow-hidden group">
          <div className="absolute inset-0 bg-accent-danger/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 font-black uppercase text-xl tracking-tighter">
              <FileText className="w-5 h-5 text-accent-danger" />
              Exclusion Protocol Rationale
            </CardTitle>
            <CardDescription className="text-xs font-medium">Justification for content node blocking and genre filtering.</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-text-muted">Registry Documentation</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="e.g., Explicit exclusion of unauthorized genres to comply with policy..." 
                      className="bg-bg-primary border-border min-h-[100px] text-white focus:ring-accent-danger rounded-2xl transition-all" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="grid gap-8 md:grid-cols-2">
          <Card className="bg-bg-secondary border-border shadow-sm rounded-[2rem]">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-3 font-black uppercase tracking-tight">
                <Tag className="w-4 h-4 text-accent-danger" />
                Banned Genres
              </CardTitle>
              <div className="text-[10px] uppercase font-bold text-text-muted">Comma-separated registry strings</div>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="banned_genres"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        className="bg-bg-primary border-border min-h-[140px] text-white focus:ring-accent-danger rounded-2xl"
                        placeholder="Hentai, Yaoi, Yuri..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="bg-bg-secondary border-border shadow-sm rounded-[2rem]">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-3 font-black uppercase tracking-tight">
                <AlertTriangle className="w-4 h-4 text-accent-warning" />
                Banned Keywords
              </CardTitle>
              <div className="text-[10px] uppercase font-bold text-text-muted">Blocked strings in titles or descriptions</div>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="banned_keywords"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        className="bg-bg-primary border-border min-h-[140px] text-white focus:ring-accent-warning rounded-2xl"
                        placeholder="camrip, ts, gambling..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-6 pb-12">
          <Button 
            type="submit" 
            disabled={isLoading} 
            className="h-14 px-12 font-black uppercase tracking-widest bg-accent-danger hover:bg-accent-danger/90 text-white rounded-xl shadow-2xl shadow-accent-danger/30 transition-all hover:scale-[1.02] active:scale-95"
          >
            {isLoading && <Loader2 className="mr-3 h-5 w-5 animate-spin" />}
            Enforce Node Blacklist
          </Button>
        </div>
      </form>
    </Form>
  );
}
