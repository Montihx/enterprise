
import { api } from '@/lib/api';

export interface Anime {
    id: string;
    slug: string;
    title: string;
    title_en?: string;
    description?: string;
    poster_url?: string;
    cover_url?: string;
    kind?: string;
    status?: string;
    score?: number;
    episodes_total?: number;
    episodes_aired?: number;
    year?: number;
    genres?: string[];
    next_episode_at?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        page: number;
        per_page: number;
        total: number;
        total_pages: number;
    };
}

export interface AnimeListParams {
    page?: number;
    limit?: number;
    kind?: string;
    status?: string;
    genre?: string;
    year?: number;
    min_score?: number;
    q?: string;
}

export const animeService = {
    async getAnimeList(params: AnimeListParams = {}): Promise<PaginatedResponse<Anime>> {
        const { data } = await api.get<PaginatedResponse<Anime>>('/anime', { params });
        return data;
    },

    async getAnimeDetails(slug: string): Promise<{ data: Anime }> {
        const { data } = await api.get<{ data: Anime }>(`/anime/${slug}`);
        return data;
    },

    async getUniqueGenres(): Promise<string[]> {
        const { data } = await api.get<string[]>('/anime/genres');
        return data;
    }
};
