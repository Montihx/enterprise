
'use client';

import React, { useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Zap, ShieldAlert, FileText, Loader2 } from 'lucide-react';

interface UpdatesSettingsProps {
  config: any;
  description?: string;
  onSave: (values: { config: any, description: string }) => void;
  isLoading?: boolean;
}

export function UpdatesSettings({ config, description, onSave, isLoading }: UpdatesSettingsProps) {
  const defaultValues = useMemo(() => ({
    auto_update: config?.auto_update ?? true,
    update_frequency: config?.update_frequency || 'hourly',
    detect_episode_change: config?.detect_episode_change ?? true,
    detect_metadata_change: config?.detect_metadata_change ?? false,
    force_shikimori_score: config?.force_shikimori_score ?? true,
    notify_on_fail: config?.notify_on_fail ?? true,
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
              Heartbeat Registry Rationale
            </CardTitle>
            <CardDescription className="text-xs font-medium">Define the justification for automated content reconciliation intervals.</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-text-muted">Policy Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="e.g., Ensuring the site state matches Shikimori updates every 60 minutes..." 
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

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-bg-secondary border-border shadow-sm rounded-[2rem]">
            <CardHeader>
              <CardTitle className="text-white text-lg font-black uppercase tracking-tight">Drift Detection</CardTitle>
              <CardDescription className="text-xs">Identify anomalies in external metadata.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { id: 'detect_episode_change', label: 'Episode Progression' },
                { id: 'detect_metadata_change', label: 'Deep Metadata Sync' },
                { id: 'force_shikimori_score', label: 'Global Score Authority' }
              ].map(item => (
                <FormField key={item.id} control={form.control} name={item.id as any} render={({ field: f }) => (
                  <FormItem className="flex items-center justify-between p-5 border border-border rounded-2xl bg-bg-primary/40">
                    <FormLabel className="text-xs font-bold uppercase">{item.label}</FormLabel>
                    <FormControl><Switch checked={f.value} onCheckedChange={f.onChange} /></FormControl>
                  </FormItem>
                )} />
              ))}
            </CardContent>
          </Card>

          <Card className="bg-bg-secondary border-border shadow-sm rounded-[2rem]">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2 font-black uppercase tracking-tight">
                <Zap className="w-4 h-4 text-accent-warning" />
                Pulse Strategy
              </CardTitle>
              <CardDescription className="text-xs">Configure the automated sync heart.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField control={form.control} name="auto_update" render={({ field }) => (
                <FormItem className="flex items-center justify-between p-5 border border-border rounded-2xl bg-bg-primary/40">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm font-bold">Autonomous Sync</FormLabel>
                    <FormDescription className="text-[10px] uppercase font-black text-text-muted">Background workers active</FormDescription>
                  </div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="update_frequency" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider">Interval Hierarchy</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger className="bg-bg-primary border-border h-12 rounded-xl text-white font-bold"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent className="bg-bg-secondary border-border text-white">
                      <SelectItem value="hourly">Every 60 Minutes</SelectItem>
                      <SelectItem value="daily">Every 24 Hours</SelectItem>
                      <SelectItem value="weekly">Weekly Pulse</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4 pb-12">
          <Button 
            type="submit" 
            disabled={isLoading} 
            className="h-14 px-12 font-black uppercase tracking-widest bg-accent-primary hover:bg-accent-primary/90 text-white rounded-xl shadow-2xl shadow-accent-primary/30 transition-all hover:scale-[1.02] active:scale-95"
          >
            {isLoading && <Loader2 className="mr-3 h-5 w-5 animate-spin" />}
            Provision Heartbeat
          </Button>
        </div>
      </form>
    </Form>
  );
}
