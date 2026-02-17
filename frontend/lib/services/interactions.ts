
import { api } from '@/lib/api';
import { Anime } from './anime';

export interface Collection {
    id: string;
    slug: string;
    title: string;
    is_public: boolean;
    user_id: string;
    items?: CollectionItem[];
}

export interface CollectionItem {
    anime_id: string;
    notes?: string;
    anime?: Anime;
}

export interface Favorite {
    id: string;
    user_id: string;
    anime_id: string;
    category: string;
    anime?: Anime;
}

export interface WatchProgress {
    episode_id: string;
    position: number;
    total: number;
    updated_at: string;
    anime?: Anime; // Assuming backend joins this or we fetch separately
    episode?: any;
}

export const interactionsService = {
    async getFavorites(category?: string): Promise<Favorite[]> {
        const { data } = await api.get<Favorite[]>('/interactions/favorites', {
            params: { category }
        });
        return data;
    },

    async toggleFavorite(animeId: string, category: string = 'like'): Promise<Favorite> {
        const { data } = await api.post<Favorite>('/interactions/favorites', {
            anime_id: animeId,
            category
        });
        return data;
    },

    async getCollections(): Promise<Collection[]> {
        const { data } = await api.get<Collection[]>('/interactions/collections');
        return data;
    },

    async getContinueWatching(): Promise<WatchProgress[]> {
        const { data } = await api.get<WatchProgress[]>('/interactions/watch-progress/continue');
        return data;
    }
};
