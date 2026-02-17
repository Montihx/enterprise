
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
import { ImageIcon, FileText, Loader2, Sparkles, HardDriveDownload } from 'lucide-react';

interface ImagesSettingsProps {
  config: any;
  description?: string;
  onSave: (values: { config: any, description: string }) => void;
  isLoading?: boolean;
}

export function ImagesSettings({ config, description, onSave, isLoading }: ImagesSettingsProps) {
  const defaultValues = useMemo(() => ({
    localize_images: config?.localize_images ?? true,
    optimize_webp: config?.optimize_webp ?? true,
    quality_percent: config?.quality_percent ?? 85,
    max_width: config?.max_width ?? 1200,
    enable_watermark: config?.enable_watermark ?? false,
    watermark_text: config?.watermark_text || 'KITSU',
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
              Asset Pipeline Rationale
            </CardTitle>
            <CardDescription className="text-xs font-medium">Justification for image localization and sovereign storage policies.</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-text-muted">Forensic Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="e.g., Localizing all artwork to optimized WebP for sovereign DMCA protection and load performance..." 
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

        <div className="grid gap-8 md:grid-cols-2">
          <Card className="bg-bg-secondary border-border shadow-sm rounded-[2rem]">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-3 font-black uppercase tracking-tight">
                <HardDriveDownload className="w-4 h-4 text-accent-primary" />
                Localization Pipeline
              </CardTitle>
              <CardDescription className="text-xs">Sovereign asset hosting configuration.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="localize_images"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between p-5 rounded-2xl border border-border bg-bg-primary/40 group hover:border-accent-primary/30 transition-colors">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-bold">Node Ingestion</FormLabel>
                      <FormDescription className="text-[10px] uppercase font-bold text-text-muted">Pull artwork into local cluster storage</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="optimize_webp"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between p-5 rounded-2xl border border-border bg-bg-primary/40 group hover:border-accent-primary/30 transition-colors">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-bold">WebP Transcoding</FormLabel>
                      <FormDescription className="text-[10px] uppercase font-bold text-text-muted">Convert all payloads to optimized WebP</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="bg-bg-secondary border-border shadow-sm rounded-[2rem]">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-3 font-black uppercase tracking-tight">
                <Sparkles className="w-4 h-4 text-accent-success" />
                Transformation Specs
              </CardTitle>
              <CardDescription className="text-xs">Image quality and resolution benchmarks.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <FormField
                control={form.control}
                name="quality_percent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center justify-between">
                       <span className="text-xs font-bold uppercase">Transcode Quality</span>
                       <span className="font-mono text-accent-success font-black">{field.value}%</span>
                    </FormLabel>
                    <FormControl>
                      <Slider min={10} max={100} step={1} value={[field.value]} onValueChange={v => field.onChange(v[0])} className="py-4" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="max_width"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-wider">LANCZOS Max Resolution (px)</FormLabel>
                    <FormControl><Input type="number" {...field} onChange={e => field.onChange(+e.target.value)} className="bg-bg-primary border-border h-12 rounded-xl font-mono" /></FormControl>
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
            className="h-14 px-12 font-black uppercase tracking-widest bg-accent-primary hover:bg-accent-primary/90 text-white rounded-xl shadow-2xl shadow-accent-primary/30 transition-all hover:scale-[1.02] active:scale-95"
          >
            {isLoading && <Loader2 className="mr-3 h-5 w-5 animate-spin" />}
            Deploy Image Rules
          </Button>
        </div>
      </form>
    </Form>
  );
}
