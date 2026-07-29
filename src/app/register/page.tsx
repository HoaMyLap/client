'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import ThemeToggle from '@/components/ThemeToggle';
import { useLanguage } from '@/lib/i18n';
import { ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullname, setFullname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullname)}`;
      await api.auth.register({ email, password, fullname, avatarUrl });
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err: any) {
      setError(err.message || (language === 'vi' ? 'Đăng ký thất bại, vui lòng kiểm tra lại thông tin.' : 'Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center relative bg-background text-foreground overflow-hidden px-4 font-sans">
      {/* Top Left: Back to Home */}
      <div className="absolute top-6 left-6 z-20">
        <Link href="/" className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card/60 text-secondary hover:text-primary transition-all text-xs font-semibold shadow-sm">
          <ArrowLeft className="w-4 h-4" />
          {t('backToHome')}
        </Link>
      </div>

      {/* Top Right: Language Switcher & Theme Toggle */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface hover:border-primary/40 text-xs font-bold text-heading transition-all shadow-sm cursor-pointer"
          title="Đổi ngôn ngữ / Change language"
        >
          <span>{language === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN'}</span>
        </button>
        <ThemeToggle />
      </div>

      {/* Background Decorative Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full glow-orb-primary blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full glow-orb-accent blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md glass glass-glow rounded-2xl p-8 z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gradient-brand font-display">
            {t('registerPageTitle')}
          </h1>
          <p className="text-secondary text-sm mt-2 font-sans">
            {t('registerPageSubtitle')}
          </p>
        </div>

        {error && <div className="ui-alert-error mb-6">{error}</div>}
        {success && <div className="ui-alert-success mb-6">{t('registerSuccessRedirect')}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="ui-label tracking-wider">{t('fullName')}</label>
            <input
              type="text"
              required
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              placeholder="Nguyen Van A"
              className="ui-input px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label className="ui-label tracking-wider">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="ui-input px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label className="ui-label tracking-wider">{t('password')}</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="ui-input px-4 py-3 text-sm"
            />
          </div>

          <button type="submit" disabled={loading || success} className="ui-btn-primary w-full py-3.5 mt-2 text-sm font-bold">
            {loading ? t('processing') : t('register')}
          </button>
        </form>

        <p className="text-center text-sm text-secondary mt-6">
          {t('alreadyHaveAccount')}{' '}
          <Link href="/login" className="text-link hover:underline font-semibold">
            {t('loginNow')}
          </Link>
        </p>
      </div>
    </main>
  );
}
