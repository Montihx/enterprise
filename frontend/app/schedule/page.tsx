
'use client';

import { useEffect, useState } from 'react';
import { animeService, Anime } from '@/lib/services/anime';
import { AnimeCard } from '@/components/AnimeCard';
import { Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function SchedulePage() {
    const [schedule, setSchedule] = useState<Record<string, Anime[]>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSchedule = async () => {
            try {
                // Fetch ongoing anime
                // In a real scenario, we might want a dedicated endpoint or filtered query
                // For now, fetching a larger list of 'ongoing' and filtering client-side or mocked
                const { data } = await animeService.getAnimeList({
                    status: 'ongoing',
                    limit: 100
                });

                const grouped: Record<string, Anime[]> = {};
                DAYS.forEach(day => grouped[day] = []);

                data.forEach(anime => {
                    if (anime.next_episode_at) {
                        const date = parseISO(anime.next_episode_at);
                        const dayName = format(date, 'EEEE');
                        if (grouped[dayName]) {
                            grouped[dayName].push(anime);
                        }
                    }
                });

                setSchedule(grouped);
            } catch (error) {
                console.error('Failed to fetch schedule', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSchedule();
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
            <h1 className="text-4xl font-black text-white mb-8 tracking-tighter">
                WEEKLY <span className="text-accent-primary">SCHEDULE</span>
            </h1>

            <div className="space-y-12">
                {DAYS.map((day) => (
                    <div key={day} className="space-y-4">
                        <h2 className="text-2xl font-bold text-white border-b border-white/10 pb-2">
                            {day}
                        </h2>

                        {schedule[day]?.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                {schedule[day].map((anime) => (
                                    <AnimeCard key={anime.id} anime={anime} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-text-muted italic">No releases scheduled.</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
