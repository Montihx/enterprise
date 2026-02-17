
'use client';

import React, { useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { PlayCircle, FileText, Loader2, Database, Layers } from 'lucide-react';

interface PlayerSettingsProps {
  config: any;
  description?: string;
  onSave: (values: { config: any, description: string }) => void;
  isLoading?: boolean;
}

export function PlayerSettings({ config, description, onSave, isLoading }: PlayerSettingsProps) {
  const defaultValues = useMemo(() => ({
    primary_source: config?.primary_source || 'kodik',
    fallback_source: config?.fallback_source || 'aniboom',
    default_quality: config?.default_quality || '1080p',
    auto_next: config?.auto_next ?? true,
    skip_opening: config?.skip_opening ?? false,
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
              CDN Hierarchy Rationale
            </CardTitle>
            <CardDescription className="text-xs font-medium">Justification for provider prioritization and streaming logic nodes.</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-text-muted">Policy Documentation</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="e.g., Prioritizing Kodik as primary source for high-bitrate distributed streams..." 
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
                <Database className="w-4 h-4 text-accent-primary" />
                Provider Priority
              </CardTitle>
              <CardDescription className="text-xs">Source fallback orchestration.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="primary_source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-wider">Primary Gateway</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger className="bg-bg-primary border-border h-12 rounded-xl text-white font-bold"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent className="bg-bg-secondary border-border text-white">
                        <SelectItem value="kodik">Kodik CDN</SelectItem>
                        <SelectItem value="aniboom">Aniboom Pulse</SelectItem>
                        <SelectItem value="sibnet">Sibnet Cloud</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fallback_source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-wider">Fallback Node</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger className="bg-bg-primary border-border h-12 rounded-xl text-white font-bold"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent className="bg-bg-secondary border-border text-white">
                        <SelectItem value="aniboom">Aniboom Pulse</SelectItem>
                        <SelectItem value="sibnet">Sibnet Cloud</SelectItem>
                        <SelectItem value="none">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="bg-bg-secondary border-border shadow-sm rounded-[2rem]">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-3 font-black uppercase tracking-tight">
                <Layers className="w-4 h-4 text-accent-success" />
                Stream Logic
              </CardTitle>
              <CardDescription className="text-xs">Runtime streaming benchmarks.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="default_quality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-wider">Target Bandwidth</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger className="bg-bg-primary border-border h-12 rounded-xl text-white font-bold"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent className="bg-bg-secondary border-border text-white">
                        <SelectItem value="1080p">UHD (1080p)</SelectItem>
                        <SelectItem value="720p">HD (720p)</SelectItem>
                        <SelectItem value="480p">SD (480p)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <div className="pt-2 grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="auto_next"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-5 border border-border rounded-2xl bg-bg-primary/40">
                      <FormLabel className="text-[10px] font-black uppercase tracking-tight">Auto Next</FormLabel>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="skip_opening"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-5 border border-border rounded-2xl bg-bg-primary/40">
                      <FormLabel className="text-[10px] font-black uppercase tracking-tight">Auto Skip</FormLabel>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )}
                />
              </div>
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
            Provision Player Logic
          </Button>
        </div>
      </form>
    </Form>
  );
}
