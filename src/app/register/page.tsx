'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import ThemeToggle from '@/components/ThemeToggle';

export default function RegisterPage() {
  const router = useRouter();
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
      setError(err.message || 'Đăng ký thất bại, vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center relative bg-background text-foreground overflow-hidden px-4">
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full glow-orb-primary blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full glow-orb-accent blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md glass glass-glow rounded-2xl p-8 z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gradient-brand font-display">
            Tạo tài khoản
          </h1>
          <p className="text-secondary text-sm mt-2">
            Đăng ký để quản lý dự án và công việc thời gian thực
          </p>
        </div>

        {error && <div className="ui-alert-error mb-6">{error}</div>}
        {success && <div className="ui-alert-success mb-6">Đăng ký thành công! Đang chuyển hướng đăng nhập...</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="ui-label tracking-wider">Họ và tên</label>
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

          <button type="submit" disabled={loading || success} className="ui-btn-primary w-full py-3.5 mt-2 text-sm">
            {loading ? 'Đang xử lý...' : 'Đăng ký'}
          </button>
        </form>

        <p className="text-center text-sm text-secondary mt-6">
          Đã có tài khoản?{' '}
          <Link href="/login" className="text-link hover:underline">
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </main>
  );
}
