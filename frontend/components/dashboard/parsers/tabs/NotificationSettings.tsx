
'use client';

import React, { useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Mail, Webhook, BellRing, Loader2, FileText } from 'lucide-react';

interface NotificationSettingsProps {
  config: any;
  description?: string;
  onSave: (values: { config: any; description: string }) => void;
  isLoading?: boolean;
}

export function NotificationSettings({ config, description, onSave, isLoading }: NotificationSettingsProps) {
  const defaultValues = useMemo(() => ({
    email_notifications: config?.email_notifications ?? false,
    admin_email: config?.admin_email || '',
    webhook_enabled: config?.webhook_enabled ?? false,
    webhook_url: config?.webhook_url || '',
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

  const emailEnabled = form.watch('email_notifications');
  const webhookEnabled = form.watch('webhook_enabled');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8 animate-in fade-in duration-500">
        <Card className="bg-bg-secondary border-border shadow-inner ring-1 ring-white/5 overflow-hidden group">
          <div className="absolute inset-0 bg-accent-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 font-black uppercase text-xl tracking-tighter">
              <FileText className="w-5 h-5 text-accent-primary" />
              Alert Subsystem Rationale
            </CardTitle>
            <CardDescription className="text-xs font-medium">Define the justification for alerting thresholds and relay protocols.</CardDescription>
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
                      placeholder="e.g., Routing critical ingestion failures to internal Slack and engineering email..." 
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
                <Mail className="w-4 h-4 text-accent-primary" />
                Email Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="email_notifications"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between p-5 rounded-2xl border border-border bg-bg-primary/40">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-bold">SMTP Relay</FormLabel>
                      <div className="text-[10px] uppercase font-bold text-text-muted">Broadcast critical faults via email</div>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )}
              />
              
              {emailEnabled && (
                <FormField
                  control={form.control}
                  name="admin_email"
                  render={({ field }) => (
                    <FormItem className="animate-in slide-in-from-top-2 duration-300">
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-text-muted">Admin Recipient</FormLabel>
                      <FormControl><Input {...field} placeholder="ops@kitsu.io" className="bg-bg-primary border-border rounded-xl h-12" /></FormControl>
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          <Card className="bg-bg-secondary border-border shadow-sm rounded-[2rem]">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-3 font-black uppercase tracking-tight">
                <Webhook className="w-4 h-4 text-accent-success" />
                Webhook Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="webhook_enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between p-5 rounded-2xl border border-border bg-bg-primary/40">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-bold">Webhook Gateway</FormLabel>
                      <div className="text-[10px] uppercase font-bold text-text-muted">Push event payloads to external URLs</div>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )}
              />
              
              {webhookEnabled && (
                <FormField
                  control={form.control}
                  name="webhook_url"
                  render={({ field }) => (
                    <FormItem className="animate-in slide-in-from-top-2 duration-300">
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-text-muted">Gateway URL</FormLabel>
                      <FormControl><Input {...field} placeholder="https://hooks.slack.com/services/..." className="bg-bg-primary border-border rounded-xl h-12 font-mono text-xs" /></FormControl>
                    </FormItem>
                  )}
                />
              )}
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
            Deploy Alert Policies
          </Button>
        </div>
      </form>
    </Form>
  );
}
