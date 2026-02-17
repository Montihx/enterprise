
'use client';

import React, { useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Library, FileText, Loader2, Workflow } from 'lucide-react';

interface CategoriesSettingsProps {
  config: any;
  description?: string;
  onSave: (values: { config: any, description: string }) => void;
  isLoading?: boolean;
}

export function CategoriesSettings({ config, description, onSave, isLoading }: CategoriesSettingsProps) {
  const defaultValues = useMemo(() => ({
    auto_assign_genres: config?.auto_assign_genres ?? true,
    create_missing_studios: config?.create_missing_studios ?? true,
    sync_franchise_taxonomy: config?.sync_franchise_taxonomy ?? true,
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
              Taxonomy Rationale
            </CardTitle>
            <CardDescription className="text-xs font-medium">Document the justification for automatic genre mapping and studio creation policies.</CardDescription>
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
                      placeholder="e.g., Unified genre taxonomy mapping to site categories during incremental sync..." 
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

        <Card className="bg-bg-secondary border-border shadow-sm overflow-hidden rounded-[2rem]">
          <CardHeader className="bg-bg-tertiary/20 border-b border-white/5">
             <CardTitle className="text-white text-lg flex items-center gap-3 font-black uppercase tracking-tight">
               <Workflow className="h-5 w-5 text-accent-success" />
               Taxonomy Automation
             </CardTitle>
             <CardDescription className="text-xs font-medium">Automatic reconciliation of distributed metadata classifications.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-8">
             {[
               { id: 'auto_assign_genres', label: 'Genre Auto-Binding', desc: 'Map incoming genres to site categories' },
               { id: 'create_missing_studios', label: 'Studio Registry Pulse', desc: 'Auto-provision missing studio entities' },
               { id: 'sync_franchise_taxonomy', label: 'Franchise Linkage', desc: 'Reconcile series franchises and relations' }
             ].map(item => (
               <FormField key={item.id} control={form.control} name={item.id as any} render={({ field }) => (
                 <FormItem className="flex items-center justify-between p-5 border border-border rounded-2xl bg-bg-primary/40 group hover:border-accent-success/30 transition-colors">
                   <div className="space-y-0.5">
                     <FormLabel className="text-sm font-bold uppercase tracking-tight">{item.label}</FormLabel>
                     <FormDescription className="text-[10px] uppercase font-black text-text-muted">{item.desc}</FormDescription>
                   </div>
                   <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                 </FormItem>
               )} />
             ))}
          </CardContent>
        </Card>

        <div className="flex justify-end pt-6 pb-12">
          <Button 
            type="submit" 
            disabled={isLoading} 
            className="h-14 px-12 font-black uppercase tracking-widest bg-accent-primary hover:bg-accent-primary/90 text-white rounded-xl shadow-2xl shadow-accent-primary/30 transition-all hover:scale-[1.02] active:scale-95"
          >
            {isLoading && <Loader2 className="mr-3 h-5 w-5 animate-spin" />}
            Synchronize Taxonomy
          </Button>
        </div>
      </form>
    </Form>
  );
}
