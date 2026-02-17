
'use client';

import { useEffect, useState } from 'react';
import { animeService, Anime } from '@/lib/services/anime';
import { AnimeCard } from '@/components/AnimeCard';
import { Loader2, Trophy } from 'lucide-react';

export default function TopsPage() {
    const [topAnime, setTopAnime] = useState<Anime[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTops = async () => {
            try {
                // Fetch top rated anime (default sort in backend is usually score/popularity)
                const { data } = await animeService.getAnimeList({
                    limit: 50,
                    min_score: 8.0
                });
                setTopAnime(data);
            } catch (error) {
                console.error('Failed to fetch top anime', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTops();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-accent-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center gap-4 mb-8">
                <Trophy className="w-10 h-10 text-accent-primary" />
                <h1 className="text-4xl font-black text-white tracking-tighter">
                    TOP <span className="text-accent-primary">RATED</span>
                </h1>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {topAnime.map((anime, index) => (
                    <div key={anime.id} className="relative group">
                        {/* Rank Badge */}
                        <div className="absolute -top-3 -left-3 z-10 w-8 h-8 flex items-center justify-center bg-accent-primary text-white font-bold rounded-full shadow-lg border-2 border-bg-primary">
                            #{index + 1}
                        </div>
                        <AnimeCard anime={anime} />
                    </div>
                ))}
            </div>
        </div>
    );
}
