
import { create } from 'zustand';
import { storage } from '@/lib/storage';
import { authService, User } from '@/lib/services/auth';

interface AuthState {
    user: User | null;
    isLoggedIn: boolean;
    isLoading: boolean;
    login: (user: User) => void;
    logout: () => void;
    hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoggedIn: false,
    isLoading: true,

    login: (user) => {
        set({ user, isLoggedIn: true });
    },

    logout: () => {
        authService.logout();
        set({ user: null, isLoggedIn: false });
    },

    hydrate: async () => {
        const token = storage.getToken();
        if (!token) {
            set({ user: null, isLoggedIn: false, isLoading: false });
            return;
        }

        try {
            const user = await authService.getCurrentUser();
            set({ user, isLoggedIn: true, isLoading: false });
        } catch (error) {
            console.error('Failed to hydrate auth state', error);
            storage.clearToken();
            set({ user: null, isLoggedIn: false, isLoading: false });
        }
    }
}));
