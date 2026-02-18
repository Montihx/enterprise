'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error('Ошибка сервера');
      setSent(true);
    } catch { setError('Ошибка. Попробуйте позже.'); }
    finally { setLoading(false); }
  }

  if (sent) return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-5xl mb-4">📧</div>
        <h2 className="text-2xl font-bold text-white mb-2">Письмо отправлено</h2>
        <p className="text-neutral-400 mb-6">
          Если аккаунт с почтой <strong className="text-white">{email}</strong> существует,
          вы получите инструкции по сбросу пароля.
        </p>
        <Link href="/login" className="text-purple-400 hover:text-purple-300 text-sm">← Вернуться ко входу</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Сброс пароля</h1>
          <p className="text-neutral-400">Введите email, и мы отправим ссылку для сброса.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            placeholder="your@email.com"
            className="w-full px-4 py-3 rounded-lg border border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500" />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={loading || !email}
            className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors">
            {loading ? 'Отправка...' : 'Отправить ссылку'}
          </button>
          <div className="text-center">
            <Link href="/login" className="text-neutral-400 hover:text-white text-sm">← Вернуться ко входу</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
