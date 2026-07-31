'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import { 
  User, Mail, Camera, Save, ArrowLeft, Shield, 
  CheckCircle2, Sparkles, Upload, Image as ImageIcon
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const user = await api.users.me();
      setFullname(user.fullname || '');
      setEmail(user.email || '');
      setAvatarUrl(user.avatarUrl || '');
    } catch (err: any) {
      setError('Không thể tải thông tin hồ sơ.');
    } finally {
      setLoading(false);
    }
  };

  // Upload image to Cloudinary via Spring Boot backend service
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP).');
      return;
    }

    setUploading(true);
    setError('');
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.uploadImage(formData);
      if (res && res.url) {
        setAvatarUrl(res.url);
        setMessage('Đã tải ảnh lên hệ thống MinIO thành công! Nhớ bấm "Lưu thay đổi".');
      } else {
        throw new Error('Tải ảnh thất bại');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Lỗi khi tải ảnh lên hệ thống lưu trữ.');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);

    try {
      const updated = await api.users.update({
        fullname,
        avatarUrl,
      });
      setFullname(updated.fullname);
      setAvatarUrl(updated.avatarUrl || '');
      localStorage.setItem('fullname', updated.fullname);
      setMessage('Cập nhật hồ sơ thành công!');
    } catch (err: any) {
      setError(err.message || 'Cập nhật thất bại.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background text-foreground relative font-sans overflow-hidden">
      <div className="absolute top-0 right-0 w-[50%] h-[40%] rounded-full glow-orb-primary blur-[140px] pointer-events-none" />

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 h-screen relative z-10 overflow-y-auto pb-12">
        <div className="max-w-4xl w-full mx-auto px-6 mt-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-secondary hover:text-foreground transition-colors text-xs font-semibold"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
            QUAY LẠI
          </button>
        </div>

        <main className="max-w-4xl mx-auto px-6 mt-8 space-y-6 w-full">
          {/* Header */}
          <div className="border-b border-border pb-6">
            <h1 className="text-2xl font-bold font-display text-heading flex items-center gap-3">
              <User className="h-7 w-7 text-primary" />
              Hồ sơ Cá nhân
            </h1>
            <p className="text-secondary text-sm mt-1">
              Quản lý thông tin tài khoản và ảnh đại diện của bạn
            </p>
          </div>

          {error && <div className="ui-alert-error text-xs">{error}</div>}
          {message && <div className="ui-alert-success text-xs">{message}</div>}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Card: Avatar Preview & Upload */}
            <div className="glass p-6 rounded-2xl border border-border flex flex-col items-center text-center space-y-4">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full border-2 border-primary/30 overflow-hidden bg-primary/10 flex items-center justify-center text-primary font-bold text-4xl shadow-xl relative">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{fullname ? fullname.charAt(0).toUpperCase() : 'U'}</span>
                  )}
                </div>

                <label className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white text-xs font-semibold gap-1">
                  <Camera className="h-6 w-6 text-primary" />
                  <span>Đổi ảnh</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <h3 className="font-bold text-base text-heading font-display">{fullname}</h3>
                <p className="text-xs text-secondary mt-0.5">{email}</p>
              </div>

              <div className="w-full pt-4 border-t border-border-subtle">
                <label className="ui-btn-secondary w-full py-2.5 flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer">
                  <Upload className="h-4 w-4 text-primary" />
                  {uploading ? 'Đang tải lên...' : 'Tải ảnh từ máy tính'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-[10px] text-muted mt-2">Hỗ trợ JPG, PNG, WEBP. Tối đa 5MB.</p>
              </div>
            </div>

            {/* Right Card: Profile Edit Form */}
            <div className="md:col-span-2 glass p-6 rounded-2xl border border-border">
              <h3 className="text-base font-bold font-display text-heading mb-6 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Thông tin Tài khoản
              </h3>

              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div>
                  <label className="ui-label">Họ và tên</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={fullname}
                      onChange={(e) => setFullname(e.target.value)}
                      placeholder="Nhập họ và tên đầy đủ..."
                      className="ui-input px-4 py-2.5 text-xs pl-10"
                    />
                    <User className="h-4 w-4 text-muted absolute left-3.5 top-3" />
                  </div>
                </div>

                <div>
                  <label className="ui-label">Địa chỉ Email (Không thể thay đổi)</label>
                  <div className="relative">
                    <input
                      type="email"
                      disabled
                      value={email}
                      className="ui-input px-4 py-2.5 text-xs pl-10 opacity-60 cursor-not-allowed bg-surface"
                    />
                    <Mail className="h-4 w-4 text-muted absolute left-3.5 top-3" />
                  </div>
                </div>

                <div>
                  <label className="ui-label">Đường dẫn ảnh đại diện (Avatar URL)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                      className="ui-input px-4 py-2.5 text-xs pl-10"
                    />
                    <ImageIcon className="h-4 w-4 text-muted absolute left-3.5 top-3" />
                  </div>
                  <p className="text-[10px] text-muted mt-1">
                    Bạn có thể tự nhập URL ảnh từ bên ngoài hoặc tải ảnh từ máy tính ở khung bên trái.
                  </p>
                </div>

                <div className="pt-4 border-t border-border-subtle flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="ui-btn-primary px-6 py-2.5 flex items-center gap-2 text-xs font-semibold"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
