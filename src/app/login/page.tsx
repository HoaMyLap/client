'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import ThemeToggle from '@/components/ThemeToggle';
import { useLanguage } from '@/lib/i18n';
import { ArrowLeft } from 'lucide-react';

declare global {
  interface Window {
    google: any;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load Google Identity Services SDK
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: '698168901753-34k3ie4eobqr5ucnidn7v34o07h4hdis.apps.googleusercontent.com',
          callback: handleGoogleResponse,
        });

        const targetDiv = document.getElementById('googleSignInDiv');
        if (targetDiv) {
          window.google.accounts.id.renderButton(targetDiv, {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'continue_with',
            shape: 'rectangular',
          });
        }
      }
    };
    document.body.appendChild(script);

    return () => {
      try {
        document.body.removeChild(script);
      } catch (e) {}
    };
  }, []);

  const handleGoogleResponse = async (googleRes: any) => {
    if (googleRes && googleRes.credential) {
      setLoading(true);
      setError('');
      try {
        const response = await api.auth.google(googleRes.credential);
        localStorage.setItem('token', response.token);
        localStorage.setItem('email', response.email);
        localStorage.setItem('fullname', response.fullname);
        localStorage.setItem('userId', response.userId);

        const userProfile = await api.users.me();
        if (userProfile && userProfile.systemRole === 'ADMIN') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      } catch (err: any) {
        setError(err.message || (language === 'vi' ? 'Đăng nhập bằng Google thất bại.' : 'Google Login failed.'));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.auth.login({ email, password });
      localStorage.setItem('token', response.token);
      localStorage.setItem('email', response.email);
      localStorage.setItem('fullname', response.fullname);
      localStorage.setItem('userId', response.userId);

      const userProfile = await api.users.me();
      if (userProfile && userProfile.systemRole === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || (language === 'vi' ? 'Đăng nhập thất bại. Vui lòng kiểm tra lại email hoặc mật khẩu.' : 'Login failed. Please check your credentials.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center relative bg-background text-foreground overflow-hidden px-4 font-sans py-12">
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
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full glow-orb-accent blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full glow-orb-primary blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md glass glass-glow rounded-2xl p-8 z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gradient-brand font-display">
            {t('loginPageTitle')}
          </h1>
          <p className="text-secondary text-sm mt-2 font-sans">
            {t('loginPageSubtitle')}
          </p>
        </div>

        {error && <div className="ui-alert-error mb-6 text-xs">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="ui-label tracking-wider">{t('yourEmail')}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
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

          <button type="submit" disabled={loading} className="ui-btn-primary w-full py-3.5 mt-2 text-sm font-bold shadow-md cursor-pointer border-0">
            {loading ? t('processing') : t('loginPageTitle')}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-3 text-muted font-bold text-[10px]">
              {language === 'vi' ? 'HOẶC ĐĂNG NHẬP VỚI' : 'OR CONTINUE WITH'}
            </span>
          </div>
        </div>

        {/* Google OAuth Button Container */}
        <div className="w-full flex justify-center min-h-[44px]">
          <div id="googleSignInDiv" className="w-full flex justify-center"></div>
        </div>

        <p className="text-center text-sm text-secondary mt-6">
          {t('noAccountYet')}{' '}
          <Link href="/register" className="text-link hover:underline font-semibold">
            {t('registerNewAccount')}
          </Link>
        </p>
      </div>
    </main>
  );
}
