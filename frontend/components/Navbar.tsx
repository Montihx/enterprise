'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search, Bell, Menu, X, User, LayoutGrid, CalendarDays, Trophy,
  LogOut, Settings, UserCog, Database, ChevronDown, Flame, Star,
  Clock, Film, Tv, PlayCircle, BookOpen, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchModal } from './SearchModal';
import { NotificationPopover } from './NotificationPopover';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/store/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const MotionDiv = motion.div as any;

const CATEGORIES = [
  {
    label: 'By Genre',
    items: [
      { label: 'Action', href: '/catalog?genre=Action', icon: Flame },
      { label: 'Romance', href: '/catalog?genre=Romance', icon: Star },
      { label: 'Sci-Fi', href: '/catalog?genre=Sci-Fi', icon: TrendingUp },
      { label: 'Drama', href: '/catalog?genre=Drama', icon: Film },
      { label: 'Horror', href: '/catalog?genre=Horror', icon: Tv },
      { label: 'Comedy', href: '/catalog?genre=Comedy', icon: PlayCircle },
    ]
  },
  {
    label: 'By Type',
    items: [
      { label: 'TV Series', href: '/catalog?kind=tv', icon: Tv },
      { label: 'Movies', href: '/catalog?kind=movie', icon: Film },
      { label: 'OVA', href: '/catalog?kind=ova', icon: PlayCircle },
      { label: 'ONA', href: '/catalog?kind=ona', icon: Database },
      { label: 'Specials', href: '/catalog?kind=special', icon: Star },
      { label: 'Music', href: '/catalog?kind=music', icon: Clock },
    ]
  },
  {
    label: 'Curated',
    items: [
      { label: 'Top Rated', href: '/tops', icon: Star },
      { label: 'Trending', href: '/catalog?min_score=8', icon: TrendingUp },
      { label: 'Ongoing', href: '/catalog?status=ongoing', icon: Clock },
      { label: 'Completed', href: '/catalog?status=released', icon: BookOpen },
      { label: 'Schedule', href: '/schedule', icon: CalendarDays },
      { label: 'Collections', href: '/collections', icon: Database },
    ]
  },
];

export function Navbar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, user, logout, hydrate } = useAuthStore();

  useEffect(() => { hydrate(); }, [hydrate]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setIsSearchOpen(true); }
      if (e.key === 'Escape') { setIsSearchOpen(false); setIsMegaMenuOpen(false); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (megaMenuRef.current && !megaMenuRef.current.contains(e.target as Node)) {
        setIsMegaMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => { setIsMegaMenuOpen(false); setIsMobileMenuOpen(false); }, [pathname]);

  const handleLogout = () => { logout(); router.push('/login'); };

  const navLinks = [
    { href: '/catalog', label: 'Catalog', icon: LayoutGrid },
    { href: '/schedule', label: 'Schedule', icon: CalendarDays },
    { href: '/tops', label: 'Top Anime', icon: Trophy },
  ];

  return (
    <>
      <nav className={cn(
        'sticky top-0 z-50 h-16 transition-all duration-500 border-b',
        scrolled
          ? 'bg-[var(--bg-primary)]/90 backdrop-blur-2xl border-[var(--border)] shadow-[0_4px_32px_rgba(0,0,0,0.5)]'
          : 'bg-transparent border-transparent'
      )}>
        <div className="container mx-auto h-full px-4">
          <div className="flex h-full items-center justify-between gap-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 text-2xl font-black text-white shrink-0 group">
              <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:shadow-violet-500/50 transition-all group-hover:scale-105">
                <span className="text-white text-xl font-black" style={{ fontFamily: 'var(--font-display)' }}>K</span>
              </div>
              <span className="hidden sm:block tracking-tighter font-black" style={{ fontFamily: 'var(--font-display)' }}>
                KITSU<span className="text-violet-400">.</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/');
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'px-4 py-2 text-sm font-bold tracking-wide rounded-lg transition-all duration-200',
                      isActive
                        ? 'text-violet-400 bg-violet-500/10'
                        : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/5'
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}

              {/* Categories Mega Menu */}
              <div ref={megaMenuRef} className="relative">
                <button
                  onClick={() => setIsMegaMenuOpen(!isMegaMenuOpen)}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2 text-sm font-bold tracking-wide rounded-lg transition-all duration-200',
                    isMegaMenuOpen
                      ? 'text-violet-400 bg-violet-500/10'
                      : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/5'
                  )}
                >
                  Categories
                  <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', isMegaMenuOpen && 'rotate-180')} />
                </button>

                <AnimatePresence>
                  {isMegaMenuOpen && (
                    <MotionDiv
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="absolute top-full mt-2 -left-4 w-[600px] rounded-2xl overflow-hidden shadow-2xl shadow-black/60 border border-[var(--glass-border)]"
                      style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(24px)' }}
                    >
                      <div className="p-6 grid grid-cols-3 gap-6">
                        {CATEGORIES.map((cat) => (
                          <div key={cat.label}>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mb-3 pb-2 border-b border-[var(--border)]">
                              {cat.label}
                            </p>
                            <div className="space-y-1">
                              {cat.items.map((item) => (
                                <Link
                                  key={item.href}
                                  href={item.href}
                                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-white hover:bg-violet-500/10 transition-all group"
                                >
                                  <item.icon className="h-3.5 w-3.5 text-violet-400 group-hover:scale-110 transition-transform" />
                                  {item.label}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="px-6 py-3 border-t border-[var(--border)] bg-[var(--bg-secondary)]/50 flex items-center justify-between">
                        <span className="text-xs text-[var(--text-muted)]">Browse our full library</span>
                        <Link href="/catalog" className="text-xs font-bold text-violet-400 hover:text-violet-300 transition-colors">
                          View All →
                        </Link>
                      </div>
                    </MotionDiv>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Search button with Cmd+K hint */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-[var(--border)] hover:border-violet-500/30 hover:bg-white/8 transition-all text-[var(--text-muted)] hover:text-white"
              >
                <Search className="h-4 w-4" />
                <span className="text-xs font-medium">Search</span>
                <kbd className="ml-1 text-[10px] font-black px-1.5 py-0.5 rounded bg-white/5 border border-[var(--border)]">⌘K</kbd>
              </button>

              <button
                onClick={() => setIsSearchOpen(true)}
                className="md:hidden p-2 rounded-lg text-[var(--text-secondary)] hover:text-violet-400 hover:bg-white/5 transition-all"
              >
                <Search className="h-5 w-5" />
              </button>

              {isLoggedIn && <NotificationPopover />}

              {isLoggedIn ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/5 transition-all group">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-violet-500/20">
                        {user?.username?.[0]?.toUpperCase() || 'U'}
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-[var(--bg-secondary)] border-[var(--border)] shadow-2xl rounded-xl" align="end">
                    <DropdownMenuLabel>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-sm font-bold text-white">{user?.username || 'User'}</p>
                        <p className="text-xs text-[var(--text-muted)]">{user?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-[var(--border)]" />
                    <DropdownMenuItem asChild className="text-[var(--text-secondary)] focus:bg-[var(--bg-tertiary)] focus:text-white cursor-pointer rounded-lg">
                      <Link href="/profile"><UserCog className="mr-2 h-4 w-4" />Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="text-[var(--text-secondary)] focus:bg-[var(--bg-tertiary)] focus:text-white cursor-pointer rounded-lg">
                      <Link href="/profile/settings"><Settings className="mr-2 h-4 w-4" />Settings</Link>
                    </DropdownMenuItem>
                    {user?.is_superuser && (
                      <>
                        <DropdownMenuSeparator className="bg-[var(--border)]" />
                        <DropdownMenuItem asChild className="text-violet-400 focus:bg-violet-500/10 focus:text-violet-300 cursor-pointer rounded-lg">
                          <Link href="/dashboard"><LayoutGrid className="mr-2 h-4 w-4" />Admin Panel</Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator className="bg-[var(--border)]" />
                    <DropdownMenuItem onClick={handleLogout} className="text-[var(--accent-danger)] focus:bg-red-500/10 focus:text-red-400 cursor-pointer rounded-lg">
                      <LogOut className="mr-2 h-4 w-4" />Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="hidden sm:flex gap-2">
                  <Link href="/login">
                    <Button variant="ghost" size="sm" className="text-[var(--text-secondary)] hover:text-white hover:bg-white/5 font-bold">Login</Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm" className="bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 text-white font-bold shadow-lg shadow-violet-500/20 border-0">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}

              <button
                className="md:hidden p-2 rounded-lg text-[var(--text-secondary)] hover:bg-white/5 transition-all"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <MotionDiv
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="md:hidden overflow-hidden border-t border-[var(--border)]"
              style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(24px)' }}
            >
              <div className="container mx-auto px-4 py-6 flex flex-col gap-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--text-secondary)] hover:text-white hover:bg-white/5 transition-all font-semibold"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <link.icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/catalog"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--text-secondary)] hover:text-white hover:bg-white/5 transition-all font-semibold"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <LayoutGrid className="h-5 w-5" />
                  Categories
                </Link>
                {!isLoggedIn && (
                  <div className="pt-4 border-t border-[var(--border)] grid grid-cols-2 gap-3">
                    <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full border-[var(--border)] hover:border-violet-500/40">Login</Button>
                    </Link>
                    <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button className="w-full bg-gradient-to-r from-violet-600 to-violet-700">Sign Up</Button>
                    </Link>
                  </div>
                )}
                {isLoggedIn && (
                  <div className="pt-4 border-t border-[var(--border)] space-y-2">
                    <Link href="/profile" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--text-secondary)] hover:text-white hover:bg-white/5 font-semibold" onClick={() => setIsMobileMenuOpen(false)}>
                      <UserCog className="h-5 w-5" /> Profile
                    </Link>
                    <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-[var(--accent-danger)] hover:bg-red-500/10 font-semibold transition-all">
                      <LogOut className="h-5 w-5" /> Log out
                    </button>
                  </div>
                )}
              </div>
            </MotionDiv>
          )}
        </AnimatePresence>
      </nav>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
