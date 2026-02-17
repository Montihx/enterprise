
'use client';

import React, { useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Brackets, Info, FileText, Loader2, Code } from 'lucide-react';

interface FieldsSettingsProps {
  config: any;
  description?: string;
  onSave: (values: { config: any, description: string }) => void;
  isLoading?: boolean;
}

const PLACEHOLDERS = [
  '{title}', '{title_en}', '{year}', '{score}', 
  '{genres}', '{studios}', '{episodes_total}', 
  '{status}', '{shikimori_id}'
];

export function FieldsSettings({ config, description, onSave, isLoading }: FieldsSettingsProps) {
  const defaultValues = useMemo(() => ({
    tpl_title: config?.tpl_title || '{title} / {title_en}',
    tpl_description: config?.tpl_description || '{description}',
    tpl_meta_keywords: config?.tpl_meta_keywords || '{genres}, {studios}, anime {year}',
    custom_tag_prefix: config?.custom_tag_prefix || 'kitsu_',
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
              Mapping Logic Rationale
            </CardTitle>
            <CardDescription className="text-xs font-medium">Administrative justification for schema template mapping and SEO formatting.</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-text-muted">Node Rationale</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="e.g., SEO-optimized title mapping for Russian and English locales..." 
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
               <Brackets className="h-5 w-5 text-accent-primary" />
               Python Map Matrix
             </CardTitle>
             <CardDescription className="text-xs font-medium">Inject variables into database fields during ingestion pulse.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 pt-8">
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Available Pulse Keys</Label>
              <div className="flex flex-wrap gap-2 p-5 bg-bg-primary/50 rounded-2xl border border-border shadow-inner">
                 {PLACEHOLDERS.map(p => (
                   <Badge key={p} variant="outline" className="bg-bg-tertiary border-border text-accent-primary font-mono text-[10px] py-1 px-2.5">
                     {p}
                   </Badge>
                 ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
               {[
                 { id: 'tpl_title', label: 'Node Title Template' },
                 { id: 'tpl_meta_keywords', label: 'Meta Keywords Pattern' }
               ].map(item => (
                 <FormField key={item.id} control={form.control} name={item.id as any} render={({ field }) => (
                   <FormItem>
                     <FormLabel className="text-xs font-bold uppercase text-text-secondary">{item.label}</FormLabel>
                     <FormControl><Input {...field} className="bg-bg-primary border-border font-mono text-sm h-12 rounded-xl shadow-sm focus:ring-accent-primary/20" /></FormControl>
                   </FormItem>
                 )} />
               ))}
            </div>
            
            <FormField control={form.control} name="tpl_description" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase text-text-secondary">Full Body Template</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    className="bg-bg-primary border-border font-mono text-sm min-h-[140px] rounded-2xl shadow-sm focus:ring-accent-primary/20" 
                  />
                </FormControl>
              </FormItem>
            )} />
          </CardContent>
        </Card>

        <div className="flex justify-end pt-6 pb-12">
          <Button 
            type="submit" 
            disabled={isLoading} 
            className="h-14 px-12 font-black uppercase tracking-widest bg-accent-primary hover:bg-accent-primary/90 text-white rounded-xl shadow-2xl shadow-accent-primary/30 transition-all hover:scale-[1.02] active:scale-95"
          >
            {isLoading && <Loader2 className="mr-3 h-5 w-5 animate-spin" />}
            Enforce Schema Mapping
          </Button>
        </div>
      </form>
    </Form>
  );
}
