
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Anime {
  id: string;
  slug: string;
  title: string;
  poster_url: string;
  score: number;
  year: number;
  kind: string;
  episodes_total: number;
  genres: string[];
  description?: string;
  title_en?: string;
  title_jp?: string;
  status?: string;
  studios?: string[];
  rating?: string;
  episodes_aired?: number; // ✅ добавить
}

export interface Comment {
  id: string;
  user_id: string;
  user: { username: string; avatar_url?: string };
  content: string;
  is_hidden: boolean;
  created_at: string;
  likes_count: number;
}

export interface WatchProgressItem {
  id: string;
  anime: Anime;
  episode: {
    id: string;
    episode: number;
    season: number;
    title: string;
  };
  position_seconds: number;
  total_seconds: number;
  percentage: number;
  updated_at: string;
}

interface AnimeListParams {
  page?: number;
  limit?: number;
  q?: string;
  kind?: string;
  status?: string;
  genre?: string;
  year?: number;
  min_score?: number;
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

export interface DataResponse<T> {
  data: T;
}

// --- Content Queries ---

export function useAnimeList(params: AnimeListParams = {}) {
  return useQuery({
    queryKey: ['anime', params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Anime>>('/anime/', { 
        params: {
          page: params.page || 1,
          limit: params.limit || 20,
          ...params
        }
      });
      return data;
    },
  });
}

export function useAnime(slug: string) {
  return useQuery({
    queryKey: ['anime', slug],
    queryFn: async () => {
      const { data } = await api.get<DataResponse<Anime>>(`/anime/${slug}`);
      return data.data;
    },
    enabled: !!slug,
  });
}

export function useEpisodes(animeId: string) {
  return useQuery({
    queryKey: ['anime', animeId, 'episodes'],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/anime/${animeId}/episodes`);
        return data;
      } catch {
        return [];
      }
    },
    enabled: !!animeId,
  });
}

export function useGenres() {
  return useQuery({
    queryKey: ['genres'],
    queryFn: async () => {
      const { data } = await api.get<string[]>('/anime/genres');
      return data;
    }
  });
}

// --- Interaction Queries ---

export function useComments(animeId?: string, episodeId?: string) {
  return useQuery({
    queryKey: ['comments', animeId, episodeId],
    queryFn: async () => {
      const { data } = await api.get<Comment[]>('/interactions/comments', {
        params: { anime_id: animeId, episode_id: episodeId }
      });
      return data;
    },
    enabled: !!animeId || !!episodeId
  });
}

export function useStaffComments(isHidden?: boolean) {
  return useQuery({
    queryKey: ['staffComments', isHidden],
    queryFn: async () => {
      const { data } = await api.get<Comment[]>('/interactions/comments/staff-queue', {
        params: { is_hidden: isHidden }
      });
      return data;
    }
  });
}

export function useContinueWatching() {
  return useQuery({
    queryKey: ['watchProgress', 'continue'],
    queryFn: async () => {
      const { data } = await api.get<WatchProgressItem[]>('/interactions/watch-progress/continue');
      return data;
    }
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get('/notifications/');
      return data;
    }
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unreadCount'],
    queryFn: async () => {
      const { data } = await api.get('/notifications/unread-count');
      return data;
    }
  });
}

export function useFavorites() {
  return useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const { data } = await api.get('/interactions/favorites');
      return data;
    }
  });
}

// --- Dash Queries ---

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/stats/overview');
      return data;
    }
  });
}

export function useDashboardCharts() {
  return useQuery({
    queryKey: ['dashboard', 'charts'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/stats/charts');
      return data;
    }
  });
}
