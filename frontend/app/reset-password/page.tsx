'use client';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';
  const uid = searchParams.get('uid') || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('');
    if (newPassword !== confirm) { setError('Пароли не совпадают'); return; }
    if (newPassword.length < 8) { setError('Минимум 8 символов'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/reset-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: uid, token, new_password: newPassword }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Ссылка недействительна');
      }
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  if (!token || !uid) return (
    <div className="text-center text-red-400">
      Недействительная ссылка. <Link href="/forgot-password" className="text-purple-400">Запросить новую</Link>
    </div>
  );

  if (success) return (
    <div className="text-center">
      <div className="text-5xl mb-4">✅</div>
      <h2 className="text-xl font-bold text-white mb-2">Пароль изменён</h2>
      <p className="text-neutral-400">Перенаправление...</p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
        required placeholder="Новый пароль" minLength={8} autoComplete="new-password"
        className="w-full px-4 py-3 rounded-lg border border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500" />
      <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
        required placeholder="Повторите пароль" autoComplete="new-password"
        className={`w-full px-4 py-3 rounded-lg border bg-neutral-900 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500 ${confirm && newPassword !== confirm ? 'border-red-500' : 'border-neutral-700'}`} />
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button type="submit" disabled={loading || !newPassword || newPassword !== confirm}
        className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors">
        {loading ? 'Изменение...' : 'Установить новый пароль'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Новый пароль</h1>
          <p className="text-neutral-400">Придумайте надёжный пароль</p>
        </div>
        <Suspense fallback={<div className="text-neutral-400 text-center">Загрузка...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
