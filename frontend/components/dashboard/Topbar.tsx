
'use client';

import { Search, Bell, User, Settings, LogOut } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export function Topbar() {
  return (
    <header className="h-16 border-b border-border bg-bg-secondary px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Search */}
      <div className="w-96 relative hidden md:block">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
        <Input 
          placeholder="Global search (Cmd+K)..." 
          className="pl-9 bg-bg-primary border-border focus:ring-accent-primary"
        />
        <div className="absolute right-3 top-2.5 flex gap-1">
          <kbd className="hidden sm:inline-block rounded border border-border bg-bg-tertiary px-1.5 text-[10px] font-medium text-text-muted opacity-100">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative text-text-muted hover:text-white">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-accent-danger border border-bg-secondary" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9 border border-border">
                <AvatarImage src="/avatars/admin.png" alt="Admin" />
                <AvatarFallback className="bg-accent-primary text-white">AD</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-bg-secondary border-border" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none text-white">Administrator</p>
                <p className="text-xs leading-none text-text-muted">admin@kitsu.io</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem className="text-text-secondary focus:bg-bg-tertiary focus:text-white cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-text-secondary focus:bg-bg-tertiary focus:text-white cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem className="text-accent-danger focus:bg-accent-danger/10 focus:text-accent-danger cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
