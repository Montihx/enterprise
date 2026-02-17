
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterSchema, RegisterCredentials, authService } from '@/lib/services/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function RegisterPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterCredentials>({
        resolver: zodResolver(RegisterSchema),
    });

    const onSubmit = async (data: RegisterCredentials) => {
        setIsLoading(true);
        try {
            await authService.register(data);
            toast.success('Account created! Please log in.');
            router.push('/login');
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.detail || 'Failed to create account.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-bg-secondary p-8 rounded-2xl border border-border shadow-2xl">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-black text-white uppercase tracking-tighter">
                        Создать аккаунт
                    </h2>
                    <p className="mt-2 text-sm text-text-secondary">
                        Join the community and start tracking your anime journey
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <div className="rounded-md shadow-sm space-y-4">
                        <div>
                            <label htmlFor="email-address" className="sr-only">Email address</label>
                            <input
                                aria-label="Email address"
                                {...register('email')}
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-border bg-bg-tertiary placeholder-text-muted text-white focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent sm:text-sm"
                                placeholder="Email address"
                            />
                            {errors.email && (
                                <p className="mt-1 text-xs text-accent-danger">{errors.email.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="username" className="sr-only">Username</label>
                            <input
                                aria-label="Username"
                                {...register('username')}
                                id="username"
                                name="username"
                                type="text"
                                autoComplete="username"
                                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-border bg-bg-tertiary placeholder-text-muted text-white focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent sm:text-sm"
                                placeholder="Username"
                            />
                            {errors.username && (
                                <p className="mt-1 text-xs text-accent-danger">{errors.username.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <input
                                aria-label="Password"
                                {...register('password')}
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-border bg-bg-tertiary placeholder-text-muted text-white focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent sm:text-sm"
                                placeholder="Password"
                            />
                            <p className="mt-1 text-xs text-text-secondary">Пароль должен содержать как минимум 8 символов</p>
                            {errors.password && (
                                <p className="mt-1 text-xs text-accent-danger">{errors.password.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="full_name" className="sr-only">Full Name (Optional)</label>
                            <input
                                {...register('full_name')}
                                id="full_name"
                                name="full_name"
                                type="text"
                                autoComplete="name"
                                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-border bg-bg-tertiary placeholder-text-muted text-white focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent sm:text-sm"
                                placeholder="Full Name (Optional)"
                            />
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
                                "Создать аккаунт"
                            )}
                        </button>
                    </div>
                </form>

                <div className="text-center mt-4">
                    <p className="text-sm text-text-secondary">
                        Already have an account?{' '}
                        <Link href="/login" className="font-bold text-white hover:text-accent-primary transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
