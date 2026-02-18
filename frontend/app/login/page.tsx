
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema, LoginCredentials, authService } from '@/lib/services/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginCredentials>({
        resolver: zodResolver(LoginSchema),
    });

    const onSubmit = async (data: LoginCredentials) => {
        setIsLoading(true);
        try {
            await authService.login(data);
            toast.success('Welcome back to Kitsu!');
            router.push('/');
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.detail || 'Failed to login. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-bg-secondary p-8 rounded-2xl border border-border shadow-2xl">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-black text-white uppercase tracking-tighter">
                        Вход в аккаунт
                    </h2>
                    <p className="mt-2 text-sm text-text-secondary">
                        Войдите, чтобы получить доступ к истории просмотра и коллекциям
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <div className="rounded-md shadow-sm space-y-4">
                        <div>
                            <label htmlFor="email-address" className="sr-only">Электронная почта</label>
                            <input
                                {...register('email')}
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-border bg-bg-tertiary placeholder-text-muted text-white focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent sm:text-sm"
                                placeholder="Электронная почта"
                            />
                            {errors.email && (
                                <p className="mt-1 text-xs text-accent-danger">{errors.email.message}</p>
                            )}
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Пароль</label>
                            <input
                                {...register('password')}
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-border bg-bg-tertiary placeholder-text-muted text-white focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent sm:text-sm"
                                placeholder="Пароль"
                            />
                            {errors.password && (
                                <p className="mt-1 text-xs text-accent-danger">{errors.password.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="text-sm">
                            <Link href="#" className="font-medium text-accent-primary hover:text-accent-primary/80 transition-colors">
                                Забыли пароль?
                            </Link>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-accent-primary hover:bg-accent-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary transition-all disabled:opacity-70"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                "ВОЙТИ"
                            )}
                        </button>
                    </div>
                </form>

                <div className="text-center mt-4">
                    <p className="text-sm text-text-secondary">
                        <a href="/forgot-password" className="text-sm text-neutral-400 hover:text-white">Забыли пароль?</a>
          Нет аккаунта?{' '}
                        <Link href="/register" className="font-bold text-white hover:text-accent-primary transition-colors">
                            Зарегистрируйтесь
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
