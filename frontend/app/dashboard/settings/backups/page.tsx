'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  Database, 
  Download, 
  Trash2, 
  Plus, 
  Loader2, 
  FileArchive,
  HardDrive,
  RefreshCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function BackupsPage() {
  const queryClient = useQueryClient();

  const { data: backups, isLoading } = useQuery({
    queryKey: ['backups'],
    queryFn: async () => {
      const { data } = await api.get('/backups/');
      return data;
    }
  });

  const triggerMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/backups/');
      return data;
    },
    onSuccess: () => {
      toast.success('Database backup completed successfully');
      queryClient.invalidateQueries({ queryKey: ['backups'] });
    },
    onError: () => toast.error('Backup procedure failed')
  });

  const deleteMutation = useMutation({
    mutationFn: async (filename: string) => {
      await api.delete(`/backups/${filename}`);
    },
    onSuccess: () => {
      toast.success('Backup archive deleted');
      queryClient.invalidateQueries({ queryKey: ['backups'] });
    },
    onError: () => toast.error('Failed to delete archive')
  });

  const formatSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
             <Database className="w-8 h-8 text-accent-primary" />
             Disaster Recovery
          </h1>
          <p className="text-text-muted mt-1">Manage database snapshots and restore points.</p>
        </div>
        <Button 
           onClick={() => triggerMutation.mutate()} 
           disabled={triggerMutation.isPending}
           className="bg-accent-primary hover:bg-accent-primary/90 text-white shadow-lg shadow-accent-primary/20"
        >
          {triggerMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
          Trigger Manual Backup
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Info Sidebar */}
        <div className="md:col-span-4 space-y-6">
          <Card className="bg-bg-secondary border-border h-fit">
            <CardHeader>
              <CardTitle className="text-white text-lg">Retention Policy</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-text-muted space-y-4">
               <p>Automated daily backups are kept for <strong>30 days</strong>.</p>
               <p>Snapshots are stored in a compressed <code>.sql.gz</code> format containing full schema and data.</p>
               <div className="p-4 bg-bg-tertiary rounded-xl border border-border flex items-center gap-3">
                  <HardDrive className="h-5 w-5 text-accent-primary" />
                  <div>
                    <div className="text-white font-bold">Local Storage</div>
                    <div className="text-[10px] uppercase tracking-widest">/app/backups</div>
                  </div>
               </div>
            </CardContent>
          </Card>

          <div className="p-6 rounded-2xl bg-accent-warning/5 border border-accent-warning/20">
             <h4 className="font-bold text-accent-warning flex items-center gap-2 mb-2 uppercase text-xs tracking-widest">
               <RefreshCcw className="h-3.5 w-3.5" /> Recovery Note
             </h4>
             <p className="text-xs text-text-secondary leading-relaxed">
               Restoring a backup will overwrite current data. It is recommended to put the platform into maintenance mode before performing a restore.
             </p>
          </div>
        </div>

        {/* List Table */}
        <div className="md:col-span-8">
           <Card className="bg-bg-secondary border-border overflow-hidden">
             <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border">
                    <TableHead>Archive Name</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                   {isLoading ? (
                     <TableRow>
                       <TableCell colSpan={4} className="h-64 text-center">
                         <div className="flex justify-center"><Loader2 className="animate-spin text-accent-primary" /></div>
                       </TableCell>
                     </TableRow>
                   ) : backups && backups.length > 0 ? (
                     backups.map((backup: any) => (
                       <TableRow key={backup.filename} className="hover:bg-bg-tertiary/50 border-border">
                         <TableCell className="font-mono text-xs text-white">
                           <div className="flex items-center gap-2">
                             <FileArchive className="h-4 w-4 text-text-muted" />
                             {backup.filename}
                           </div>
                         </TableCell>
                         <TableCell className="text-xs font-bold">{formatSize(backup.size)}</TableCell>
                         <TableCell className="text-xs text-text-muted">
                           {format(new Date(backup.created_at), 'MMM dd, yyyy HH:mm')}
                         </TableCell>
                         <TableCell className="text-right">
                           <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-text-muted hover:text-white">
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-text-muted hover:text-accent-danger"
                                onClick={() => deleteMutation.mutate(backup.filename)}
                                disabled={deleteMutation.isPending}
                              >
                                {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                              </Button>
                           </div>
                         </TableCell>
                       </TableRow>
                     ))
                   ) : (
                     <TableRow>
                       <TableCell colSpan={4} className="h-64 text-center text-text-muted italic">
                         No backup archives found.
                       </TableCell>
                     </TableRow>
                   )}
                </TableBody>
             </Table>
           </Card>
        </div>
      </div>
    </div>
  );
}