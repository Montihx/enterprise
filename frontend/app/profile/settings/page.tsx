'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ProfileSettingsPage() {
  const [tab, setTab] = useState<'profile' | 'password' | 'account'>('profile');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Profile
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const fileInputRef = typeof document !== 'undefined' ? document.createElement('input') : null;

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const clearMessages = () => { setSuccess(''); setError(''); };

  async function callApi(endpoint: string, method: string, body: object) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const res = await fetch(`/api/v1${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || `HTTP ${res.status}`);
    }
    return res.json();
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault(); clearMessages(); setLoading(true);
    try {
      // Upload avatar file first if selected
      let finalAvatarUrl = avatarUrl;
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        const res = await fetch('/api/v1/users/me/avatar', {
          method: 'POST',
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          finalAvatarUrl = data.avatar_url;
        } else {
          throw new Error('Не удалось загрузить аватар');
        }
      }
      await callApi('/users/me', 'PUT', { bio, ...(finalAvatarUrl ? { avatar_url: finalAvatarUrl } : {}) });
      setSuccess('Профиль обновлён');
    } catch (err: any) {
      setError(err.message);
    } finally { setLoading(false); }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault(); clearMessages();
    if (newPassword !== confirmPassword) { setError('Пароли не совпадают'); return; }
    if (newPassword.length < 8) { setError('Минимум 8 символов'); return; }
    setLoading(true);
    try {
      await callApi('/auth/change-password', 'POST', {
        current_password: currentPassword, new_password: newPassword,
      });
      setSuccess('Пароль изменён'); setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err: any) {
      setError(err.message);
    } finally { setLoading(false); }
  }

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-neutral-700 bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500';

  return (
    <div className="min-h-screen bg-neutral-950 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/profile" className="text-neutral-400 hover:text-white text-sm">← Профиль</Link>
          <h1 className="text-2xl font-bold text-white">Настройки</h1>
        </div>

        <div className="flex gap-1 mb-6 border-b border-neutral-800">
          {(['profile', 'password', 'account'] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); clearMessages(); }}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t ? 'border-purple-500 text-purple-400' : 'border-transparent text-neutral-400 hover:text-white'
              }`}>
              {{ profile: 'Профиль', password: 'Пароль', account: 'Аккаунт' }[t]}
            </button>
          ))}
        </div>

        {success && <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">✓ {success}</div>}
        {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">✕ {error}</div>}

        {tab === 'profile' && (
          <form onSubmit={handleProfileSave} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Аватар (URL)</label>
              <input type="url" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://api.dicebear.com/7.x/avataaars/svg?seed=yourname" className={inputCls} />
              {avatarUrl && (
                <img src={avatarUrl} alt="Preview"
                  className="mt-2 w-16 h-16 rounded-full object-cover border border-neutral-700"
                  onError={(e) => (e.currentTarget.style.display = 'none')} />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">О себе</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} maxLength={500}
                placeholder="Расскажите о себе..."
                className={`${inputCls} resize-none`} />
              <p className="text-xs text-neutral-500 mt-1">{bio.length}/500</p>
            </div>
            <button type="submit" disabled={loading}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors">
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </form>
        )}

        {tab === 'password' && (
          <form onSubmit={handlePasswordChange} className="space-y-5">
            {[
              { label: 'Текущий пароль', value: currentPassword, setter: setCurrentPassword, auto: 'current-password' },
              { label: 'Новый пароль', value: newPassword, setter: setNewPassword, auto: 'new-password' },
              { label: 'Повторите пароль', value: confirmPassword, setter: setConfirmPassword, auto: 'new-password' },
            ].map(({ label, value, setter, auto }) => (
              <div key={label}>
                <label className="block text-sm font-medium text-neutral-300 mb-1">{label}</label>
                <input type="password" value={value} onChange={(e) => setter(e.target.value)}
                  required autoComplete={auto} className={inputCls} />
              </div>
            ))}
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-400">Пароли не совпадают</p>
            )}
            <button type="submit"
              disabled={loading || !currentPassword || !newPassword || newPassword !== confirmPassword}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors">
              {loading ? 'Изменение...' : 'Изменить пароль'}
            </button>
          </form>
        )}

        {tab === 'account' && (
          <div className="space-y-6">
            <div className="p-4 rounded-lg border border-neutral-700 bg-neutral-900">
              <h3 className="font-medium text-white mb-2">Верификация email</h3>
              <p className="text-sm text-neutral-400 mb-3">Подтвердите почту для доступа ко всем функциям.</p>
              <button onClick={async () => {
                clearMessages();
                try {
                  await callApi('/auth/send-verification', 'POST', {});
                  setSuccess('Письмо отправлено. Проверьте почту.');
                } catch (err: any) { setError(err.message); }
              }} className="px-4 py-2 text-sm border border-neutral-600 text-neutral-300 rounded-lg hover:bg-neutral-800 transition-colors">
                Отправить письмо верификации
              </button>
            </div>
            <div className="p-4 rounded-lg border border-red-500/20 bg-red-500/5">
              <h3 className="font-medium text-red-400 mb-2">Опасная зона</h3>
              <p className="text-sm text-neutral-400 mb-3">Удаление аккаунта необратимо.</p>
              <button onClick={() => setError('Для удаления обратитесь в поддержку.')}
                className="px-4 py-2 text-sm bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors">
                Удалить аккаунт
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
