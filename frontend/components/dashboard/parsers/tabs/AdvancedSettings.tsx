
'use client';

import React, { useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Cpu, Loader2, FileText, Zap } from 'lucide-react';

interface AdvancedSettingsProps {
  config: any;
  description?: string;
  onSave: (values: { config: any; description: string }) => void;
  isLoading?: boolean;
}

export function AdvancedSettings({ config, description, onSave, isLoading }: AdvancedSettingsProps) {
  const defaultValues = useMemo(() => ({
    async_semaphores: config?.async_semaphores ?? 5,
    request_delay_ms: config?.request_delay_ms ?? 200,
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
          <div className="absolute inset-0 bg-accent-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 font-black uppercase text-xl tracking-tighter">
              <FileText className="w-5 h-5 text-accent-primary" />
              Engine Kernel Rationale
            </CardTitle>
            <CardDescription className="text-xs font-medium">Justification for low-level temporal and concurrency node constraints.</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-text-muted">Kernel Documentation</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="e.g., Throttling pool to 5 semaphores to respect provider rate limiting..." 
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

        <Card className="bg-bg-secondary border-border shadow-sm rounded-[2rem]">
          <CardHeader>
            <CardTitle className="text-white text-lg flex items-center gap-3 font-black uppercase tracking-tight">
              <Cpu className="w-4 h-4 text-accent-primary" />
              Ingestion Orchestration
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-12 md:grid-cols-2">
            <FormField
              control={form.control}
              name="async_semaphores"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-text-muted">Concurrency Level</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Zap className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-accent-primary opacity-50" />
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                        className="bg-bg-primary border-border rounded-xl h-12 pl-12 font-mono" 
                      />
                    </div>
                  </FormControl>
                  <div className="text-[10px] uppercase font-bold text-text-muted mt-2">Async workers in cluster pool</div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="request_delay_ms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-text-muted">Request Delay (ms)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                      className="bg-bg-primary border-border rounded-xl h-12 font-mono" 
                    />
                  </FormControl>
                  <div className="text-[10px] uppercase font-bold text-text-muted mt-2">Temporal window between provider probes</div>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end pt-6 pb-12">
          <Button 
            type="submit" 
            disabled={isLoading} 
            className="h-14 px-12 font-black uppercase tracking-widest bg-accent-primary hover:bg-accent-primary/90 text-white rounded-xl shadow-2xl shadow-accent-primary/30 transition-all hover:scale-[1.02] active:scale-95"
          >
            {isLoading && <Loader2 className="mr-3 h-5 w-5 animate-spin" />}
            Commit Engine Logic
          </Button>
        </div>
      </form>
    </Form>
  );
}
