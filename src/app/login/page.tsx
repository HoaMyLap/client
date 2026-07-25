'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import ThemeToggle from '@/components/ThemeToggle';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại email hoặc mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center relative bg-background text-foreground overflow-hidden px-4">
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full glow-orb-accent blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full glow-orb-primary blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md glass glass-glow rounded-2xl p-8 z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gradient-brand font-display">
            Đăng nhập
          </h1>
          <p className="text-secondary text-sm mt-2 font-sans">
            Chào mừng quay trở lại hệ thống quản trị công việc
          </p>
        </div>

        {error && <div className="ui-alert-error mb-6">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="ui-label tracking-wider">Email của bạn</label>
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
            <label className="ui-label tracking-wider">Mật khẩu</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="ui-input px-4 py-3 text-sm"
            />
          </div>

          <button type="submit" disabled={loading} className="ui-btn-primary w-full py-3.5 mt-2 text-sm">
            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>

        <p className="text-center text-sm text-secondary mt-6">
          Chưa có tài khoản?{' '}
          <Link href="/register" className="text-link hover:underline">
            Đăng ký tài khoản mới
          </Link>
        </p>
      </div>
    </main>
  );
}
