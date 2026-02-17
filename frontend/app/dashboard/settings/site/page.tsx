'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  Globe, 
  ShieldAlert, 
  Palette, 
  Settings2, 
  Loader2, 
  CheckCircle2, 
  Search,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export default function SiteSettingsPage() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['siteSettings'],
    queryFn: async () => {
      const { data } = await api.get('/system/settings/site');
      return data;
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: any) => {
      await api.patch('/system/settings/site', updates);
    },
    onSuccess: () => {
      toast.success('Site configuration synchronized with kernel');
      queryClient.invalidateQueries({ queryKey: ['siteSettings'] });
    },
    onError: () => toast.error('Fault detected in settings pipeline')
  });

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-accent-primary" /></div>;
  }

  const handleToggle = (key: string, current: any) => {
    updateMutation.mutate({ [key]: !current });
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <Globe className="w-8 h-8 text-accent-primary" />
          Site Configuration
        </h1>
        <p className="text-text-muted mt-1 uppercase text-[10px] font-black tracking-widest">Global Platform Node Policies</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Core Controls */}
        <Card className="bg-bg-secondary border-border shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-white/5 bg-bg-tertiary/20">
            <CardTitle className="text-white flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-accent-danger" />
              Runtime Safeguards
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8 space-y-6">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-bg-primary/50 border border-border">
               <div className="space-y-0.5">
                  <Label className="text-sm font-bold text-white">Maintenance Mode</Label>
                  <p className="text-[10px] text-text-muted uppercase font-black tracking-tighter">Disable public access for updates</p>
               </div>
               <Switch 
                 checked={settings?.maintenance_mode || false} 
                 onCheckedChange={() => handleToggle('maintenance_mode', settings?.maintenance_mode)} 
                 disabled={updateMutation.isPending}
               />
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-bg-primary/50 border border-border">
               <div className="space-y-0.5">
                  <Label className="text-sm font-bold text-white">Guest Registration</Label>
                  <p className="text-[10px] text-text-muted uppercase font-black tracking-tighter">Allow new users to join the cluster</p>
               </div>
               <Switch 
                 checked={settings?.allow_registration ?? true} 
                 onCheckedChange={() => handleToggle('allow_registration', settings?.allow_registration)} 
                 disabled={updateMutation.isPending}
               />
            </div>
          </CardContent>
        </Card>

        {/* SEO & Discovery */}
        <Card className="bg-bg-secondary border-border shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-white/5 bg-bg-tertiary/20">
            <CardTitle className="text-white flex items-center gap-2">
              <Search className="h-5 w-5 text-accent-primary" />
              SEO & Identity
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8 space-y-6">
            <div className="space-y-2">
               <Label className="text-[10px] font-black uppercase text-text-muted tracking-widest ml-1">Platform Name</Label>
               <Input 
                 defaultValue={settings?.site_name || 'Kitsu Enterprise'} 
                 onBlur={(e) => updateMutation.mutate({ site_name: e.target.value })}
                 className="bg-bg-primary border-border h-12 rounded-xl"
               />
            </div>
            <div className="space-y-2">
               <Label className="text-[10px] font-black uppercase text-text-muted tracking-widest ml-1">Global Meta Description</Label>
               <textarea 
                 defaultValue={settings?.site_description || ''} 
                 onBlur={(e) => updateMutation.mutate({ site_description: e.target.value })}
                 className="w-full bg-bg-primary border border-border rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary transition-all min-h-[100px]"
               />
            </div>
          </CardContent>
        </Card>

        {/* Theme Overrides */}
        <Card className="bg-bg-secondary border-border shadow-2xl rounded-3xl overflow-hidden md:col-span-2">
          <CardHeader className="border-b border-white/5 bg-bg-tertiary/20">
            <CardTitle className="text-white flex items-center gap-2">
              <Palette className="h-5 w-5 text-accent-secondary" />
              Visual Matrix Overrides
            </CardTitle>
            <CardDescription>Customize the interface CSS variables dynamically.</CardDescription>
          </CardHeader>
          <CardContent className="pt-8 grid grid-cols-1 sm:grid-cols-3 gap-8">
             <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Accent Primary</Label>
                <div className="flex gap-3">
                   <div className="h-12 w-12 rounded-xl border border-white/10" style={{ backgroundColor: settings?.accent_primary || '#8b5cf6' }} />
                   <Input 
                     defaultValue={settings?.accent_primary || '#8b5cf6'} 
                     className="bg-bg-primary font-mono text-xs uppercase"
                     onBlur={(e) => updateMutation.mutate({ accent_primary: e.target.value })}
                   />
                </div>
             </div>

             <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Accent Danger</Label>
                <div className="flex gap-3">
                   <div className="h-12 w-12 rounded-xl border border-white/10" style={{ backgroundColor: settings?.accent_danger || '#ef4444' }} />
                   <Input 
                     defaultValue={settings?.accent_danger || '#ef4444'} 
                     className="bg-bg-primary font-mono text-xs uppercase"
                     onBlur={(e) => updateMutation.mutate({ accent_danger: e.target.value })}
                   />
                </div>
             </div>

             <div className="flex flex-col justify-center gap-2">
                <div className="p-4 bg-accent-primary/5 rounded-2xl border border-accent-primary/10 flex items-center gap-4">
                   <Zap className="h-6 w-6 text-accent-primary" />
                   <div>
                     <div className="text-sm font-bold text-white uppercase tracking-tight">Hot Patching</div>
                     <div className="text-[9px] text-text-muted uppercase font-black">Changes reflect instantly via Global Context</div>
                   </div>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="pt-10 flex justify-center">
         <div className="px-6 py-3 bg-bg-tertiary rounded-full border border-border flex items-center gap-3 shadow-xl">
           {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin text-accent-primary" /> : <CheckCircle2 className="h-4 w-4 text-accent-success" />}
           <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
             {updateMutation.isPending ? 'Propagating logic...' : 'All node settings synced'}
           </span>
         </div>
      </div>
    </div>
  );
}
