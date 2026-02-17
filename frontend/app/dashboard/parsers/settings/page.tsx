
'use client';

import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeneralSettings } from '@/components/dashboard/parsers/tabs/GeneralSettings';
import { GrabbingSettings } from '@/components/dashboard/parsers/tabs/GrabbingSettings';
import { UpdatesSettings } from '@/components/dashboard/parsers/tabs/UpdatesSettings';
import { FieldsSettings } from '@/components/dashboard/parsers/tabs/FieldsSettings';
import { CategoriesSettings } from '@/components/dashboard/parsers/tabs/CategoriesSettings';
import { ImagesSettings } from '@/components/dashboard/parsers/tabs/ImagesSettings';
import { PlayerSettings } from '@/components/dashboard/parsers/tabs/PlayerSettings';
import { NotificationSettings } from '@/components/dashboard/parsers/tabs/NotificationSettings';
import { AdvancedSettings } from '@/components/dashboard/parsers/tabs/AdvancedSettings';
import { BlacklistSettings } from '@/components/dashboard/parsers/tabs/BlacklistSettings';
import { useUpdateParserSettings } from '@/hooks/mutations';
import { 
  Loader2, 
  Settings2, 
  RefreshCw,
  Target,
  Terminal,
  Library,
  ImageIcon,
  PlayCircle,
  Bell,
  Cpu,
  Ban,
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const TABS = [
  { id: 'general', label: 'General', icon: Settings2 },
  { id: 'grabbing', label: 'Grabbing', icon: Target },
  { id: 'updates', label: 'Updates', icon: RefreshCw },
  { id: 'fields', label: 'Fields', icon: Terminal },
  { id: 'categories', label: 'Categories', icon: Library },
  { id: 'images', label: 'Images', icon: ImageIcon },
  { id: 'player', label: 'Player', icon: PlayCircle },
  { id: 'notifications', label: 'Alerts', icon: Bell },
  { id: 'advanced', label: 'Engine', icon: Cpu },
  { id: 'blacklist', label: 'Security', icon: Ban },
] as const;

export default function ParserSettingsPage() {
  const [activeTab, setActiveTab] = useState<string>('general');
  const updateMutation = useUpdateParserSettings();

  const { data: settingsMap, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['parserSettings'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/parsers/settings');
      const map: Record<string, { config: any, description?: string }> = {};
      data.forEach((s: any) => {
        map[s.category] = { config: s.config, description: s.description };
      });
      return map;
    }
  });

  const handleSave = useCallback(async (category: string, values: { config: any, description: string }) => {
    await updateMutation.mutateAsync({ category, ...values });
  }, [updateMutation]);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-6">
        <div className="relative">
          <Loader2 className="animate-spin text-accent-primary h-16 w-16 opacity-20" />
          <Settings2 className="absolute inset-0 m-auto h-8 w-8 text-accent-primary animate-pulse" />
        </div>
        <div className="space-y-1 text-center">
          <span className="text-sm font-black uppercase tracking-[0.4em] text-white">Initializing Kernel</span>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Synchronizing distributed ingestion policies</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-32">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 border-b border-white/5 pb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/parsers">
             <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl bg-bg-secondary border border-border hover:bg-bg-tertiary transition-all shadow-lg group">
                <ChevronLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
             </Button>
          </Link>
          <div>
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Policy Registry</h1>
              {updateMutation.isPending && (
                <div className="flex items-center gap-2 text-accent-primary animate-pulse font-black text-[10px] uppercase tracking-widest bg-accent-primary/5 px-3 py-1 rounded-full border border-accent-primary/20">
                  <Loader2 className="h-3 w-3 animate-spin" /> IO_COMMIT
                </div>
              )}
            </div>
            <p className="text-text-muted mt-1 uppercase text-[10px] font-black tracking-[0.3em] italic opacity-70">Global Node Protocols & Infrastructure Logic</p>
          </div>
        </div>

        <Button 
          variant="outline" 
          onClick={() => refetch()} 
          disabled={isRefetching}
          className="h-12 border-border bg-bg-secondary hover:bg-bg-tertiary rounded-xl px-6 group transition-all shadow-lg"
        >
          <RefreshCw className={cn("mr-2 h-4 w-4 text-accent-primary", isRefetching && "animate-spin")} />
          <span className="font-bold uppercase text-[10px] tracking-widest">Re-Sync Node</span>
        </Button>
      </div>
      
      <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <div className="bg-bg-secondary/50 p-2 rounded-[2rem] border border-white/5 shadow-xl sticky top-4 z-40 backdrop-blur-2xl ring-1 ring-white/5 mx-auto max-w-6xl">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0 justify-center">
            {TABS.map(tab => (
              <TabsTrigger 
                key={tab.id}
                value={tab.id}
                className={cn(
                  "h-10 px-5 rounded-[1.25rem] border border-transparent flex items-center gap-2 transition-all duration-300 relative group",
                  "data-[state=active]:bg-accent-primary data-[state=active]:text-white data-[state=active]:shadow-[0_8px_20px_rgba(139,92,246,0.3)]",
                  "text-[10px] font-black uppercase tracking-widest hover:bg-white/5"
                )}
              >
                <tab.icon className={cn("h-3.5 w-3.5 transition-colors", activeTab === tab.id ? "text-white" : "text-text-muted group-hover:text-white")} />
                <span className="hidden md:inline">{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="active-settings-tab"
                    className="absolute inset-0 border border-white/20 rounded-[1.25rem] pointer-events-none"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        
        <div className="bg-bg-secondary/40 border border-border rounded-[3rem] p-8 lg:p-12 shadow-[0_40px_100px_-20px_rgba(0,0,0,1)] relative min-h-[600px] ring-1 ring-white/5 overflow-hidden mx-auto max-w-[1400px]">
          <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none transition-transform duration-1000 rotate-12 group-hover:rotate-0">
            <Settings2 className="w-[30rem] h-[30rem]" />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="w-full relative z-10"
            >
              <TabsContent value="general" className="mt-0 outline-none">
                <GeneralSettings
                  config={settingsMap?.general?.config}
                  description={settingsMap?.general?.description}
                  onSave={(values) => handleSave('general', values)}
                  isLoading={updateMutation.isPending}
                />
              </TabsContent>
              
              <TabsContent value="grabbing" className="mt-0 outline-none">
                <GrabbingSettings
                  config={settingsMap?.grabbing?.config}
                  description={settingsMap?.grabbing?.description}
                  onSave={(values) => handleSave('grabbing', values)}
                  isLoading={updateMutation.isPending}
                />
              </TabsContent>

              <TabsContent value="updates" className="mt-0 outline-none">
                <UpdatesSettings
                  config={settingsMap?.updates?.config}
                  description={settingsMap?.updates?.description}
                  onSave={(values) => handleSave('updates', values)}
                  isLoading={updateMutation.isPending}
                />
              </TabsContent>

              <TabsContent value="fields" className="mt-0 outline-none">
                <FieldsSettings
                  config={settingsMap?.fields?.config}
                  description={settingsMap?.fields?.description}
                  onSave={(values) => handleSave('fields', values)}
                  isLoading={updateMutation.isPending}
                />
              </TabsContent>

              <TabsContent value="categories" className="mt-0 outline-none">
                <CategoriesSettings
                  config={settingsMap?.categories?.config}
                  description={settingsMap?.categories?.description}
                  onSave={(values) => handleSave('categories', values)}
                  isLoading={updateMutation.isPending}
                />
              </TabsContent>

              <TabsContent value="images" className="mt-0 outline-none">
                <ImagesSettings
                  config={settingsMap?.images?.config}
                  description={settingsMap?.images?.description}
                  onSave={(values) => handleSave('images', values)}
                  isLoading={updateMutation.isPending}
                />
              </TabsContent>

              <TabsContent value="player" className="mt-0 outline-none">
                <PlayerSettings
                  config={settingsMap?.player?.config}
                  description={settingsMap?.player?.description}
                  onSave={(values) => handleSave('player', values)}
                  isLoading={updateMutation.isPending}
                />
              </TabsContent>

              <TabsContent value="notifications" className="mt-0 outline-none">
                <NotificationSettings
                  config={settingsMap?.notifications?.config}
                  description={settingsMap?.notifications?.description}
                  onSave={(values) => handleSave('notifications', values)}
                  isLoading={updateMutation.isPending}
                />
              </TabsContent>

              <TabsContent value="advanced" className="mt-0 outline-none">
                <AdvancedSettings
                  config={settingsMap?.advanced?.config}
                  description={settingsMap?.advanced?.description}
                  onSave={(values) => handleSave('advanced', values)}
                  isLoading={updateMutation.isPending}
                />
              </TabsContent>

              <TabsContent value="blacklist" className="mt-0 outline-none">
                <BlacklistSettings
                  config={settingsMap?.blacklist?.config}
                  description={settingsMap?.blacklist?.description}
                  onSave={(values) => handleSave('blacklist', values)}
                  isLoading={updateMutation.isPending}
                />
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </div>
      </Tabs>
    </div>
  );
}
