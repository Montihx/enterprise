'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const uid = searchParams.get('uid') || '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token || !uid) { setStatus('error'); setMessage('Недействительная ссылка'); return; }
    fetch(`/api/v1/auth/verify-email?token=${token}&uid=${uid}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.ok) { setStatus('success'); setMessage(data.message || 'Email подтверждён!'); }
        else { setStatus('error'); setMessage(data.detail || 'Ошибка верификации'); }
      })
      .catch(() => { setStatus('error'); setMessage('Ошибка сети'); });
  }, [token, uid]);

  return (
    <div className="text-center">
      {status === 'loading' && <><div className="animate-spin text-4xl mb-4">⟳</div><p className="text-neutral-400">Проверка...</p></>}
      {status === 'success' && (
        <><div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-white mb-2">Email подтверждён!</h2>
        <p className="text-neutral-400 mb-6">{message}</p>
        <Link href="/" className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">На главную</Link></>
      )}
      {status === 'error' && (
        <><div className="text-5xl mb-4">❌</div>
        <h2 className="text-2xl font-bold text-red-400 mb-2">Ошибка</h2>
        <p className="text-neutral-400 mb-6">{message}</p>
        <Link href="/profile/settings" className="text-purple-400 hover:text-purple-300">Запросить новое письмо</Link></>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <div className="max-w-md w-full">
        <Suspense fallback={<div className="text-neutral-400 text-center">Загрузка...</div>}>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
