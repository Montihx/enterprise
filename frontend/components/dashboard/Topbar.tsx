'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Bell, Settings, LogOut, User, Sun, Moon, ExternalLink, Home } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/lib/store/auth';
import { NotificationPopover } from '@/components/NotificationPopover';
import Link from 'next/link';

export function Topbar() {
  const [search, setSearch] = useState('');
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => { logout(); router.push('/login'); };

  return (
    <header
      className="h-16 border-b px-5 flex items-center justify-between sticky top-0 z-30 flex-shrink-0"
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', backdropFilter: 'blur(12px)' }}
    >
      {/* Search */}
      <div className="relative w-72 hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search admin content..."
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-sm text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-violet-500/50 transition-all"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black px-1.5 py-0.5 rounded bg-white/5 border border-[var(--border)] text-[var(--text-muted)]">
          ⌘K
        </kbd>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Visit site */}
        <Link href="/" target="_blank"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs font-bold text-[var(--text-muted)] hover:text-white hover:border-violet-500/30 hover:bg-violet-500/5 transition-all">
          <Home className="h-3.5 w-3.5" />
          View Site
          <ExternalLink className="h-3 w-3 opacity-50" />
        </Link>

        {/* Notifications */}
        <NotificationPopover />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/5 transition-all">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-violet-500/20">
                {user?.username?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-white leading-tight">{user?.username || 'Admin'}</p>
                <p className="text-[10px] text-[var(--text-muted)] leading-tight">Administrator</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-52 rounded-xl border-[var(--border)] shadow-2xl" align="end"
            style={{ background: 'var(--bg-secondary)' }}>
            <DropdownMenuLabel>
              <p className="text-sm font-bold text-white">{user?.username}</p>
              <p className="text-xs text-[var(--text-muted)]">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator style={{ background: 'var(--border)' }} />
            <DropdownMenuItem asChild className="cursor-pointer rounded-lg text-[var(--text-secondary)] focus:bg-[var(--bg-tertiary)] focus:text-white">
              <Link href="/profile"><User className="mr-2 h-4 w-4" />Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer rounded-lg text-[var(--text-secondary)] focus:bg-[var(--bg-tertiary)] focus:text-white">
              <Settings className="mr-2 h-4 w-4" />Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator style={{ background: 'var(--border)' }} />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer rounded-lg text-red-400 focus:bg-red-500/10 focus:text-red-400">
              <LogOut className="mr-2 h-4 w-4" />Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
