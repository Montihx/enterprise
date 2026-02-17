
'use client';

import React, { useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Network, Settings2, Loader2, Lock, FileText, RefreshCcw } from 'lucide-react';

interface GeneralSettingsProps {
  config: any;
  description?: string;
  onSave: (values: { config: any, description: string }) => void;
  isLoading?: boolean;
}

export function GeneralSettings({ config, description, onSave, isLoading }: GeneralSettingsProps) {
  const defaultValues = useMemo(() => ({
    shikimori_api_domain: config?.shikimori_api_domain || 'https://shikimori.one/',
    proxy_enabled: config?.proxy_enabled ?? false,
    proxy_address: config?.proxy_address || '',
    proxy_port: config?.proxy_port || '',
    admin_path_pattern: config?.admin_path_pattern || '/admin.php',
    kodik_api_key: config?.kodik_api_key || '',
    cron_key: config?.cron_key || '',
    user_agent: config?.user_agent || 'KitsuEngine/2.0 (Python/3.12)',
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
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <Card className="bg-bg-secondary border-border shadow-inner ring-1 ring-white/5 overflow-hidden group">
          <div className="absolute inset-0 bg-accent-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 font-black uppercase text-xl tracking-tighter">
              <FileText className="w-5 h-5 text-accent-primary" />
              Node Configuration Rationale
            </CardTitle>
            <CardDescription className="text-xs font-medium">Administrative justification for this ingestion cluster's network policy.</CardDescription>
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
                      placeholder="e.g., Primary cluster utilizing residential proxies to bypass provider rate limits..." 
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
                <Network className="w-4 h-4 text-accent-primary" />
                Network Gateway
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="shikimori_api_domain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-text-muted">Target API Endpoint</FormLabel>
                    <FormControl><Input {...field} placeholder="https://shikimori.one/" className="bg-bg-primary border-border rounded-xl h-12" /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="proxy_enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between p-5 rounded-2xl border border-border bg-bg-primary/40">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-bold">Proxy Relay</FormLabel>
                      <div className="text-[10px] uppercase font-bold text-text-muted tracking-tighter">Route requests via external cluster node</div>
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
                <Settings2 className="w-4 h-4 text-accent-success" />
                Control Hub
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="admin_path_pattern"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-text-muted">Admin Control Path</FormLabel>
                    <FormControl><Input {...field} placeholder="/admin.php" className="bg-bg-primary border-border font-mono text-sm rounded-xl h-12" /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="user_agent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-text-muted">Engine User-Agent</FormLabel>
                    <FormControl><Input {...field} className="bg-bg-primary border-border font-mono text-xs rounded-xl h-12" /></FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="bg-bg-secondary border-border md:col-span-2 shadow-sm rounded-[2rem]">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-3 font-black uppercase tracking-tight">
                <Lock className="w-4 h-4 text-accent-warning" />
                Security Layer
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-8 md:grid-cols-2">
              <FormField
                control={form.control}
                name="kodik_api_key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-text-muted">Kodik CDN Access Token</FormLabel>
                    <FormControl><Input type="password" {...field} className="bg-bg-primary border-border rounded-xl h-12" /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cron_key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-text-muted">Internal Cron Key</FormLabel>
                    <div className="flex gap-3">
                      <FormControl><Input {...field} className="bg-bg-primary border-border font-mono text-sm rounded-xl h-12 flex-1" /></FormControl>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon"
                        onClick={() => form.setValue('cron_key', crypto.randomUUID())} 
                        className="rounded-xl border-border h-12 w-12 hover:bg-white/5"
                      >
                        <RefreshCcw className="h-4 w-4 text-accent-primary" />
                      </Button>
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
            className="h-14 px-12 font-black uppercase tracking-widest bg-accent-primary hover:bg-accent-primary/90 text-white rounded-xl shadow-2xl shadow-accent-primary/30 transition-all hover:scale-[1.02] active:scale-95"
          >
            {isLoading && <Loader2 className="mr-3 h-5 w-5 animate-spin" />}
            Synchronize Node State
          </Button>
        </div>
      </form>
    </Form>
  );
}
