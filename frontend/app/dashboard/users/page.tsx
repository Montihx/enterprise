
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  Search, 
  Shield, 
  MoreHorizontal, 
  Ban, 
  CheckCircle2, 
  Loader2,
  UserCog
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';

interface User {
  id: string;
  username: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  role?: {
    id: string;
    name: string;
  };
  created_at: string;
}

interface Role {
  id: string;
  name: string;
}

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  
  // Dialog States
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');

  // Queries
  const { data: users, isLoading } = useQuery({
    queryKey: ['users', debouncedSearch],
    queryFn: async () => {
      // Note: Real implementation would pass 'q' param to backend
      const { data } = await api.get<User[]>('/users/');
      if (debouncedSearch) {
        return data.filter(u => 
          u.username.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
          u.email.toLowerCase().includes(debouncedSearch.toLowerCase())
        );
      }
      return data;
    }
  });

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data } = await api.get<Role[]>('/roles/');
      return data;
    }
  });

  // Mutations
  const toggleBanMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string, is_active: boolean }) => {
      if (is_active) {
        await api.post(`/users/${id}/ban`);
      } else {
        await api.post(`/users/${id}/unban`);
      }
    },
    onSuccess: () => {
      toast.success('User status updated');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => toast.error('Failed to update status')
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string, roleId: string }) => {
      await api.patch(`/users/${userId}`, { role_id: roleId });
    },
    onSuccess: () => {
      toast.success('User role updated');
      setIsRoleDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => toast.error('Failed to update role')
  });

  // Handlers
  const handleOpenRoleDialog = (user: User) => {
    setSelectedUser(user);
    setSelectedRoleId(user.role?.id || '');
    setIsRoleDialogOpen(true);
  };

  const handleUpdateRole = () => {
    if (selectedUser && selectedRoleId) {
      updateRoleMutation.mutate({ userId: selectedUser.id, roleId: selectedRoleId });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Users</h1>
          <p className="text-text-muted">Manage system access and permissions</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
          <Input 
            placeholder="Search users..." 
            className="pl-9 bg-bg-secondary border-border"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border border-border bg-bg-secondary">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex justify-center"><Loader2 className="animate-spin text-accent-primary" /></div>
                </TableCell>
              </TableRow>
            ) : users && users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.id} className="hover:bg-bg-tertiary/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} />
                        <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-white">{user.username}</div>
                        <div className="text-xs text-text-muted">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5 text-accent-primary" />
                      <span className="capitalize">{user.role?.name || 'User'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.is_active ? (
                      <Badge className="bg-accent-success/20 text-accent-success hover:bg-accent-success/30 border-0">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="bg-accent-danger/20 text-accent-danger hover:bg-accent-danger/30 border-0">
                        Banned
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-text-muted text-sm">
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-text-muted hover:text-white">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-bg-tertiary border-border text-white">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleOpenRoleDialog(user)} className="cursor-pointer hover:bg-bg-secondary">
                          <UserCog className="mr-2 h-4 w-4" /> Change Role
                        </DropdownMenuItem>
                        
                        {user.is_active ? (
                          <DropdownMenuItem 
                            onClick={() => toggleBanMutation.mutate({ id: user.id, is_active: true })}
                            className="cursor-pointer text-accent-danger hover:bg-accent-danger/10 hover:text-accent-danger"
                          >
                            <Ban className="mr-2 h-4 w-4" /> Ban User
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem 
                            onClick={() => toggleBanMutation.mutate({ id: user.id, is_active: false })}
                            className="cursor-pointer text-accent-success hover:bg-accent-success/10 hover:text-accent-success"
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" /> Unban User
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-text-muted">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Role Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="bg-bg-secondary border-border text-white">
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>
              Assign a new role to <strong>{selectedUser?.username}</strong>.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label className="mb-2 block">Role</Label>
            <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
              <SelectTrigger className="bg-bg-primary border-border">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent className="bg-bg-primary border-border">
                {roles?.map((role) => (
                  <SelectItem key={role.id} value={role.id} className="cursor-pointer focus:bg-bg-tertiary">
                    <div className="flex flex-col text-left">
                      <span className="font-medium capitalize">{role.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateRole} 
              disabled={updateRoleMutation.isPending}
            >
              {updateRoleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
