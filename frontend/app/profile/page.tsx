
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, User } from '@/lib/services/auth';
import { interactionsService, Favorite, WatchProgress } from '@/lib/services/interactions';
import { AnimeCard } from '@/components/AnimeCard';
import { Loader2, User as UserIcon, LogOut, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/lib/store/auth';

export default function ProfilePage() {
    const router = useRouter();
    const { user, isLoading: isAuthLoading, logout } = useAuthStore();
    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const [history, setHistory] = useState<WatchProgress[]>([]);
    const [isDataLoading, setIsDataLoading] = useState(true);

    useEffect(() => {
        const initData = async () => {
            if (isAuthLoading) return;

            if (!user) {
                router.push('/login');
                return;
            }

            try {
                const [favData, historyData] = await Promise.all([
                    interactionsService.getFavorites(),
                    interactionsService.getContinueWatching()
                ]);

                setFavorites(favData);
                setHistory(historyData);
            } catch (error) {
                console.error('Failed to load profile data', error);
            } finally {
                setIsDataLoading(false);
            }
        };

        initData();
    }, [user, isAuthLoading, router]);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    if (isAuthLoading || isDataLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-accent-primary" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header Profile */}
            <div className="bg-bg-secondary rounded-2xl p-8 mb-8 border border-border flex flex-col md:flex-row items-center gap-8">
                <Avatar className="w-32 h-32 border-4 border-accent-primary">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} />
                    <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>

                <div className="flex-1 text-center md:text-left space-y-2">
                    <h1 className="text-3xl font-black text-white tracking-tighter">{user.username}</h1>
                    <p className="text-text-secondary">{user.email}</p>
                    <div className="flex items-center justify-center md:justify-start gap-4 mt-4">
                        <Button variant="outline" size="sm" className="gap-2">
                            <Settings className="w-4 h-4" /> Settings
                        </Button>
                        <Button variant="destructive" size="sm" className="gap-2" onClick={handleLogout}>
                            <LogOut className="w-4 h-4" /> Logout
                        </Button>
                    </div>
                </div>

                <div className="flex gap-8 text-center bg-bg-tertiary p-6 rounded-xl">
                    <div>
                        <div className="text-2xl font-bold text-white">{favorites.length}</div>
                        <div className="text-xs text-text-muted uppercase tracking-wider">Favorites</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-white">{history.length}</div>
                        <div className="text-xs text-text-muted uppercase tracking-wider">Watched</div>
                    </div>
                </div>
            </div>

            {/* Tabs Content */}
            <Tabs defaultValue="favorites" className="w-full">
                <TabsList className="w-full justify-start bg-transparent border-b border-white/10 mb-8 rounded-none p-0 h-auto">
                    <TabsTrigger
                        value="favorites"
                        className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-accent-primary data-[state=active]:text-accent-primary rounded-none px-6 py-3 text-lg font-bold"
                    >
                        Favorites
                    </TabsTrigger>
                    <TabsTrigger
                        value="history"
                        className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-accent-primary data-[state=active]:text-accent-primary rounded-none px-6 py-3 text-lg font-bold"
                    >
                        History
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="favorites" className="mt-0">
                    {favorites.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                            {favorites.map((fav) => (
                                // Assuming fav.anime is populated. If not, we might need a separate component or fetch
                                fav.anime ? <AnimeCard key={fav.id} anime={fav.anime} /> : null
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 text-text-muted">
                            No favorites yet. Go explore the catalog!
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="history" className="mt-0">
                    {history.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                            {history.map((item) => (
                                item.anime ? <AnimeCard key={item.episode_id} anime={item.anime} /> : null
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 text-text-muted">
                            You haven't watched anything yet.
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
