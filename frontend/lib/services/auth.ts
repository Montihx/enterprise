
import { api } from '@/lib/api';
import { storage } from '@/lib/storage';
import { z } from 'zod';

export const LoginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export const RegisterSchema = z.object({
    email: z.string().email('Invalid email address'),
    username: z.string().min(3, 'Username must be at least 3 characters'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    full_name: z.string().optional(),
});

export type LoginCredentials = z.infer<typeof LoginSchema>;
export type RegisterCredentials = z.infer<typeof RegisterSchema>;

export interface AuthResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

export interface User {
    id: string;
    email: string;
    username: string;
    is_active: boolean;
    is_superuser: boolean;
    full_name?: string;
}

export const authService = {
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const formData = new URLSearchParams();
        formData.append('username', credentials.email);
        formData.append('password', credentials.password);

        const { data } = await api.post<AuthResponse>('/auth/login/access-token', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        storage.setToken(data.access_token, data.refresh_token);
        // Trigger storage event for cross-tab sync and Navbar update
        window.dispatchEvent(new Event('storage'));
        return data;
    },

    async register(credentials: RegisterCredentials): Promise<User> {
        const { data } = await api.post<User>('/auth/register', credentials);
        return data;
    },

    logout() {
        storage.clearToken();
        window.dispatchEvent(new Event('storage'));
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
    },

    async getCurrentUser(): Promise<User> {
        const { data } = await api.get<User>('/users/me');
        return data;
    }
};
