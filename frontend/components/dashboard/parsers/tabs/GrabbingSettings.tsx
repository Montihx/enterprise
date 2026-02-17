
'use client';

import React, { useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Zap, Calendar, ListChecks, FileText, Loader2 } from 'lucide-react';

interface GrabbingSettingsProps {
  config: any;
  description?: string;
  onSave: (values: { config: any, description: string }) => void;
  isLoading?: boolean;
}

const ALL_KINDS = [
  { id: 'tv', label: 'TV Series' },
  { id: 'movie', label: 'Movies' },
  { id: 'ova', label: 'OVA' },
  { id: 'ona', label: 'ONA' },
  { id: 'special', label: 'Special' },
  { id: 'music', label: 'Music' },
];

export function GrabbingSettings({ config, description, onSave, isLoading }: GrabbingSettingsProps) {
  const defaultValues = useMemo(() => ({
    min_score: config?.min_score ?? 6.0,
    if_camrip: config?.if_camrip ?? false,
    if_lgbt: config?.if_lgbt ?? true,
    year_start: config?.year_start ?? 1990,
    year_end: config?.year_end ?? new Date().getFullYear(),
    kinds_allowed: config?.kinds_allowed ?? ['tv', 'movie', 'ova', 'ona'],
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
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
        <Card className="bg-bg-secondary border-border shadow-inner ring-1 ring-white/5 overflow-hidden group">
          <div className="absolute inset-0 bg-accent-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 font-black uppercase text-xl tracking-tighter">
              <FileText className="w-5 h-5 text-accent-primary" />
              Grabbing Logic Rationale
            </CardTitle>
            <CardDescription className="text-xs font-medium">Define content quality benchmarks and filtering rules for ingestion.</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-text-muted">Policy Justification</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="e.g., Filtering for high-score content and omitting low-quality pirate releases..." 
                      className="bg-bg-primary border-border min-h-[100px] text-white focus:ring-accent-primary rounded-2xl transition-all" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-bg-secondary border-border shadow-sm rounded-[2rem]">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-3 font-black uppercase tracking-tight">
                <Zap className="w-4 h-4 text-accent-success" />
                Quality Gates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <FormField
                control={form.control}
                name="min_score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center justify-between mb-2">
                       <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Minimum Score</span>
                       <span className="font-mono text-accent-success font-black text-sm">{field.value}</span>
                    </FormLabel>
                    <FormControl>
                      <Slider min={0} max={10} step={0.1} value={[field.value]} onValueChange={(val) => field.onChange(val[0])} className="py-4" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="if_camrip"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-5 rounded-2xl border border-border bg-bg-primary/40">
                      <FormLabel className="text-xs uppercase font-bold">CAMRip</FormLabel>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="if_lgbt"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-5 rounded-2xl border border-border bg-bg-primary/40">
                      <FormLabel className="text-xs uppercase font-bold">LGBT Filter</FormLabel>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-bg-secondary border-border shadow-sm rounded-[2rem]">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-3 font-black uppercase tracking-tight">
                <Calendar className="w-4 h-4 text-accent-warning" />
                Temporal Range
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <FormField
                  control={form.control}
                  name="year_start"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">From</FormLabel>
                      <FormControl><Input type="number" {...field} className="bg-bg-primary h-12 rounded-xl text-sm font-mono" /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="year_end"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">To</FormLabel>
                      <FormControl><Input type="number" {...field} className="bg-bg-primary h-12 rounded-xl text-sm font-mono" /></FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <FormDescription className="text-[10px] uppercase font-bold tracking-tighter text-text-muted italic px-1">Titles outside this window are dropped automatically.</FormDescription>
            </CardContent>
          </Card>

          <Card className="bg-bg-secondary border-border md:col-span-2 shadow-sm rounded-[2rem]">
            <CardHeader>
               <CardTitle className="text-white text-lg flex items-center gap-3 font-black uppercase tracking-tight">
                 <ListChecks className="w-4 h-4 text-accent-primary" />
                 Permitted Kinds
               </CardTitle>
            </CardHeader>
            <CardContent>
               <FormField
                control={form.control}
                name="kinds_allowed"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                      {ALL_KINDS.map((kind) => (
                        <div key={kind.id} className="flex items-center space-x-3 p-5 bg-bg-primary/40 border border-border rounded-2xl group/kind hover:border-accent-primary/30 transition-all cursor-pointer">
                          <Checkbox
                            id={`kind-${kind.id}`}
                            checked={field.value?.includes(kind.id)}
                            onCheckedChange={(checked) => {
                              const updated = checked
                                ? [...(field.value || []), kind.id]
                                : field.value?.filter((val: string) => val !== kind.id);
                              field.onChange(updated);
                            }}
                          />
                          <label htmlFor={`kind-${kind.id}`} className="text-[10px] font-black uppercase text-white cursor-pointer select-none tracking-widest">{kind.label}</label>
                        </div>
                      ))}
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-6">
          <Button 
            type="submit" 
            disabled={isLoading} 
            className="h-14 px-12 font-black uppercase tracking-widest bg-accent-primary hover:bg-accent-primary/90 text-white rounded-2xl shadow-2xl shadow-accent-primary/30 transition-all hover:scale-[1.02] active:scale-95"
          >
            {isLoading && <Loader2 className="mr-3 h-5 w-5 animate-spin" />}
            Commit Filter Node
          </Button>
        </div>
      </form>
    </Form>
  );
}
