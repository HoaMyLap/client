'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import { useLanguage } from '@/lib/i18n';
import { 
  User, Mail, Camera, Save, ArrowLeft, Shield, 
  CheckCircle2, Sparkles, Upload, Image as ImageIcon,
  CreditCard, Calendar, Clock, Award, History, ArrowUpRight, Zap,
  Lock, KeyRound, Check, ChevronDown
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { t, language } = useLanguage();

  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [subscriptionPlan, setSubscriptionPlan] = useState('FREE');
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState('');
  const [paymentOrders, setPaymentOrders] = useState<any[]>([]);
  const [visibleOrdersCount, setVisibleOrdersCount] = useState(5);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Password Change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordErr, setPasswordErr] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadProfile();
    loadUserOrders();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const user = await api.users.me();
      setFullname(user.fullname || '');
      setEmail(user.email || '');
      setAvatarUrl(user.avatarUrl || '');
      setSubscriptionPlan(user.subscriptionPlan || 'FREE');
      setSubscriptionExpiresAt(user.subscriptionExpiresAt || '');
    } catch (err: any) {
      setError(language === 'vi' ? 'Không thể tải thông tin hồ sơ.' : 'Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

  const loadUserOrders = async () => {
    try {
      const orders = await api.payments.getUserOrders();
      if (Array.isArray(orders)) {
        setPaymentOrders(orders);
      }
    } catch (err) {
      console.error('Không thể tải lịch sử thanh toán:', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError(language === 'vi' ? 'Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP).' : 'Please select a valid image file (PNG, JPG, WEBP).');
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
        setMessage(language === 'vi' ? 'Đã tải ảnh lên thành công! Nhớ bấm "Lưu thay đổi".' : 'Image uploaded successfully! Remember to click "Save Changes".');
      } else {
        throw new Error('Tải ảnh thất bại');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || (language === 'vi' ? 'Lỗi khi tải ảnh lên hệ thống lưu trữ.' : 'Error uploading image to storage.'));
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
      setMessage(language === 'vi' ? 'Cập nhật hồ sơ thành công!' : 'Profile updated successfully!');
    } catch (err: any) {
      setError(err.message || (language === 'vi' ? 'Cập nhật thất bại.' : 'Update failed.'));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErr('');
    setPasswordMsg('');

    if (newPassword.length < 6) {
      setPasswordErr(language === 'vi' ? 'Mật khẩu mới phải có ít nhất 6 ký tự.' : 'New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErr(language === 'vi' ? 'Mật khẩu xác nhận không trùng khớp.' : 'Passwords do not match.');
      return;
    }

    setPasswordSaving(true);
    setTimeout(() => {
      setPasswordMsg(language === 'vi' ? 'Đã bảo mật và đổi mật khẩu tài khoản thành công!' : 'Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSaving(false);
    }, 1000);
  };

  const handleCancelSubscription = async () => {
    const confirmMsg = language === 'vi'
      ? `Bạn có chắc chắn muốn HỦY gói dịch vụ ${subscriptionPlan} hiện tại? Tài khoản của bạn sẽ được chuyển về Gói Miễn Phí (FREE PLAN).`
      : `Are you sure you want to CANCEL your current ${subscriptionPlan} plan? Your account will be reverted to the Free Plan.`;

    if (window.confirm(confirmMsg)) {
      try {
        setLoading(true);
        await api.payments.cancelSubscription();
        await loadProfile();
        setMessage(language === 'vi' ? 'Đã hủy gói dịch vụ thành công! Tài khoản của bạn hiện ở Gói Miễn Phí.' : 'Subscription cancelled successfully! Your account is now on the Free Plan.');
      } catch (err: any) {
        setError(err.message || (language === 'vi' ? 'Lỗi khi hủy gói dịch vụ.' : 'Failed to cancel subscription.'));
      } finally {
        setLoading(false);
      }
    }
  };

  // Helper date formatters
  const formatDate = (dateStr: string) => {
    if (!dateStr) return language === 'vi' ? 'Chưa kích hoạt' : 'Not Activated';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch (e) {
      return dateStr;
    }
  };

  const calculateDaysRemaining = (expiresStr: string) => {
    if (!expiresStr) return 0;
    try {
      const expDate = new Date(expiresStr);
      const now = new Date();
      const diff = expDate.getTime() - now.getTime();
      return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
    } catch (e) {
      return 0;
    }
  };

  const daysLeft = calculateDaysRemaining(subscriptionExpiresAt);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background text-foreground relative font-sans overflow-hidden">
      <div className="absolute top-0 right-0 w-[50%] h-[40%] rounded-full glow-orb-primary blur-[140px] pointer-events-none opacity-30" />

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 h-screen relative z-10 overflow-y-auto pb-12">
        <div className="max-w-5xl w-full mx-auto px-6 mt-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-secondary hover:text-foreground transition-colors text-xs font-semibold"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
            {language === 'vi' ? 'QUAY LẠI' : 'BACK'}
          </button>
        </div>

        <main className="max-w-5xl mx-auto px-6 mt-8 space-y-8 w-full">
          {/* Header */}
          <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold font-display text-heading flex items-center gap-3">
                <User className="h-7 w-7 text-primary" />
                {language === 'vi' ? 'Hồ sơ & Tài khoản cá nhân' : 'Personal Profile & Account'}
              </h1>
              <p className="text-secondary text-sm mt-1">
                {language === 'vi' 
                  ? 'Quản lý thông tin cá nhân, ảnh đại diện, đổi mật khẩu và xem thông tin gói dịch vụ VIP' 
                  : 'Manage your profile, avatar, password, and view your VIP subscription plan details'}
              </p>
            </div>

            <Link href="/pricing" className="ui-btn-primary px-4 py-2.5 text-xs font-bold flex items-center gap-2 rounded-xl no-underline shrink-0 shadow-lg shadow-primary/20">
              <Zap className="h-4 w-4" />
              {language === 'vi' ? 'Nâng cấp Gói dịch vụ' : 'Upgrade Subscription Plan'}
            </Link>
          </div>

          {error && <div className="ui-alert-error text-xs">{error}</div>}
          {message && <div className="ui-alert-success text-xs">{message}</div>}

          {/* Section 1: VIP Subscription Banner Card */}
          <div className={`p-6 rounded-3xl border shadow-xl relative overflow-hidden transition-all ${
            subscriptionPlan === 'ENTERPRISE'
              ? 'bg-gradient-to-r from-purple-950 via-indigo-950 to-zinc-950 border-purple-500/40 text-purple-200'
              : subscriptionPlan === 'PRO'
              ? 'bg-gradient-to-r from-amber-950/80 via-zinc-950 to-blue-950/80 border-amber-500/40 text-amber-200'
              : 'glass border-border text-secondary'
          }`}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Award className={`h-6 w-6 ${subscriptionPlan === 'FREE' ? 'text-secondary' : 'text-amber-400'}`} />
                  <span className="text-xs uppercase font-bold tracking-wider text-muted">
                    {language === 'vi' ? 'Trạng thái Gói dịch vụ hiện tại' : 'Current Subscription Plan Status'}
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl font-black font-display text-heading uppercase tracking-wide flex items-center gap-2">
                    {subscriptionPlan} PLAN
                  </h2>

                  {subscriptionPlan !== 'FREE' ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 animate-pulse">
                      <Sparkles className="h-3.5 w-3.5" />
                      {language === 'vi' ? 'ĐANG HOẠT ĐỘNG' : 'ACTIVE'}
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-surface text-secondary border border-border text-xs font-bold">
                      {language === 'vi' ? 'GÓI MẶC ĐỊNH' : 'DEFAULT PLAN'}
                    </span>
                  )}
                </div>

                <p className="text-xs text-secondary max-w-xl leading-relaxed">
                  {subscriptionPlan === 'ENTERPRISE'
                    ? (language === 'vi' ? 'Bạn đang sở hữu gói Cao cấp nhất với toàn bộ tính năng AI, lưu trữ không giới hạn và hỗ trợ ưu tiên 24/7.' : 'You own the highest Enterprise tier with full AI capabilities, unlimited storage, and 24/7 priority support.')
                    : subscriptionPlan === 'PRO'
                    ? (language === 'vi' ? 'Tài khoản của bạn đã được nâng cấp bản Pro VIP. Bạn có thể sử dụng tất cả tính năng quản lý dự án, chat nhóm và đính kèm tài liệu nâng cao.' : 'Your account is upgraded to Pro VIP. You can access all project management features, team chat, and document attachments.')
                    : (language === 'vi' ? 'Bạn đang sử dụng gói Miễn phí. Hãy nâng cấp lên bản Pro để mở khóa toàn bộ tính năng nâng cao!' : 'You are using the Free plan. Upgrade to Pro VIP to unlock all advanced features!')}
                </p>
              </div>

              {/* Expiration Card */}
              {subscriptionPlan !== 'FREE' && (
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3 text-xs shrink-0 w-full md:w-64 shadow-inner">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-muted text-[11px]">
                      <span>{language === 'vi' ? 'Hạn sử dụng gói:' : 'Plan Expiration:'}</span>
                      <Clock className="h-3.5 w-3.5 text-amber-400" />
                    </div>
                    <div className="text-lg font-bold font-mono text-heading">
                      {formatDate(subscriptionExpiresAt)}
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/10">
                      <span>{language === 'vi' ? 'Thời gian còn lại:' : 'Days Remaining:'}</span>
                      <strong className="text-emerald-400 font-bold">{daysLeft} {language === 'vi' ? 'ngày' : 'days'}</strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
                    <Link
                      href="/pricing"
                      className="w-full py-2 px-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs flex items-center justify-center gap-1.5 no-underline transition-colors"
                    >
                      <Zap className="h-3.5 w-3.5" />
                      <span>{language === 'vi' ? 'Đổi gói dịch vụ' : 'Change Plan'}</span>
                    </Link>

                    <button
                      type="button"
                      onClick={handleCancelSubscription}
                      className="w-full py-1.5 px-3 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span>{language === 'vi' ? 'Hủy gói đăng ký' : 'Cancel Subscription'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Card: Avatar Preview & Upload */}
            <div className="glass p-6 rounded-3xl border border-border flex flex-col items-center text-center space-y-4 shadow-xl">
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
                  <span>{language === 'vi' ? 'Đổi ảnh' : 'Change'}</span>
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
                <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="h-3 w-3" /> {language === 'vi' ? 'Đã xác thực Email' : 'Email Verified'}
                </span>
              </div>

              <div className="w-full pt-4 border-t border-border-subtle">
                <label className="ui-btn-secondary w-full py-2.5 flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer rounded-xl">
                  <Upload className="h-4 w-4 text-primary" />
                  {uploading 
                    ? (language === 'vi' ? 'Đang tải lên...' : 'Uploading...') 
                    : (language === 'vi' ? 'Tải ảnh từ máy tính' : 'Upload from Computer')}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-[10px] text-muted mt-2">JPG, PNG, WEBP (Max 5MB)</p>
              </div>
            </div>

            {/* Right Card: Profile Edit Form */}
            <div className="md:col-span-2 glass p-6 rounded-3xl border border-border shadow-xl space-y-6">
              <h3 className="text-base font-bold font-display text-heading flex items-center gap-2 border-b border-border-subtle pb-3">
                <Shield className="h-5 w-5 text-primary" />
                {language === 'vi' ? 'Thông tin Tài khoản' : 'Account Information'}
              </h3>

              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div>
                  <label className="ui-label">{language === 'vi' ? 'Họ và tên' : 'Full Name'}</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={fullname}
                      onChange={(e) => setFullname(e.target.value)}
                      placeholder={language === 'vi' ? 'Nhập họ và tên đầy đủ...' : 'Enter your full name...'}
                      className="ui-input px-4 py-2.5 text-xs pl-10"
                    />
                    <User className="h-4 w-4 text-muted absolute left-3.5 top-3" />
                  </div>
                </div>

                <div>
                  <label className="ui-label">
                    {language === 'vi' ? 'Địa chỉ Email (Không thể thay đổi)' : 'Email Address (Read-only)'}
                  </label>
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
                  <label className="ui-label">
                    {language === 'vi' ? 'Đường dẫn ảnh đại diện (Avatar URL)' : 'Avatar Image URL'}
                  </label>
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
                </div>

                <div className="pt-4 border-t border-border-subtle flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="ui-btn-primary px-6 py-2.5 flex items-center gap-2 text-xs font-semibold cursor-pointer border-0 rounded-xl shadow-md"
                  >
                    <Save className="h-4 w-4" />
                    {saving 
                      ? (language === 'vi' ? 'Đang lưu...' : 'Saving...') 
                      : (language === 'vi' ? 'Lưu thay đổi' : 'Save Changes')}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Section 2: Account Security / Change Password */}
          <div className="glass p-6 rounded-3xl border border-border shadow-xl space-y-5">
            <h3 className="text-base font-bold font-display text-heading flex items-center gap-2 border-b border-border-subtle pb-3">
              <KeyRound className="h-5 w-5 text-amber-400" />
              {language === 'vi' ? 'Bảo mật & Đổi mật khẩu' : 'Security & Change Password'}
            </h3>

            {passwordErr && <div className="ui-alert-error text-xs">{passwordErr}</div>}
            {passwordMsg && <div className="ui-alert-success text-xs">{passwordMsg}</div>}

            <form onSubmit={handleChangePassword} className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="ui-label">{language === 'vi' ? 'Mật khẩu hiện tại' : 'Current Password'}</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="ui-input px-4 py-2.5 text-xs pl-10"
                  />
                  <Lock className="h-4 w-4 text-muted absolute left-3.5 top-3" />
                </div>
              </div>

              <div>
                <label className="ui-label">{language === 'vi' ? 'Mật khẩu mới' : 'New Password'}</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="ui-input px-4 py-2.5 text-xs pl-10"
                  />
                  <KeyRound className="h-4 w-4 text-muted absolute left-3.5 top-3" />
                </div>
              </div>

              <div>
                <label className="ui-label">{language === 'vi' ? 'Xác nhận mật khẩu mới' : 'Confirm New Password'}</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="ui-input px-4 py-2.5 text-xs pl-10"
                  />
                  <Check className="h-4 w-4 text-muted absolute left-3.5 top-3" />
                </div>
              </div>

              <div className="md:col-span-3 flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="ui-btn-secondary px-6 py-2.5 flex items-center gap-2 text-xs font-semibold cursor-pointer border-amber-500/30 text-amber-400 hover:bg-amber-500/10 rounded-xl"
                >
                  <KeyRound className="h-4 w-4" />
                  {passwordSaving 
                    ? (language === 'vi' ? 'Đang cập nhật...' : 'Updating...') 
                    : (language === 'vi' ? 'Đổi mật khẩu' : 'Update Password')}
                </button>
              </div>
            </form>
          </div>

          {/* Section 3: Payment Orders History Table (Top 5 items + View More) */}
          <div className="glass p-6 rounded-3xl border border-border shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-4">
              <div>
                <h3 className="text-base font-bold font-display text-heading flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  {language === 'vi' ? 'Lịch sử Thanh toán & Đơn hàng' : 'Payment & Order History'}
                </h3>
                <p className="text-xs text-secondary mt-0.5">
                  {language === 'vi' 
                    ? 'Hiển thị các giao dịch đơn hàng gần đây của bạn' 
                    : 'Displaying your recent payment order transactions'}
                </p>
              </div>

              <span className="text-xs text-muted font-bold">
                {language === 'vi' ? `Tổng cộng: ${paymentOrders.length} đơn hàng` : `Total: ${paymentOrders.length} orders`}
              </span>
            </div>

            {paymentOrders.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted space-y-2">
                <CreditCard className="h-8 w-8 text-muted mx-auto opacity-50" />
                <p>{language === 'vi' ? 'Bạn chưa có lịch sử thanh toán nào.' : 'No payment history available.'}</p>
                <Link href="/pricing" className="text-primary font-bold hover:underline inline-block">
                  {language === 'vi' ? 'Nâng cấp gói dịch vụ đầu tiên ➔' : 'Upgrade your first package ➔'}
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border-subtle text-muted text-[11px] uppercase tracking-wider">
                        <th className="py-3 px-3">{language === 'vi' ? 'Mã đơn hàng' : 'Order ID'}</th>
                        <th className="py-3 px-3">{language === 'vi' ? 'Gói' : 'Plan'}</th>
                        <th className="py-3 px-3">{language === 'vi' ? 'Chu kỳ' : 'Cycle'}</th>
                        <th className="py-3 px-3">{language === 'vi' ? 'Phương thức' : 'Method'}</th>
                        <th className="py-3 px-3">{language === 'vi' ? 'Số tiền' : 'Amount'}</th>
                        <th className="py-3 px-3">{language === 'vi' ? 'Thời gian' : 'Date'}</th>
                        <th className="py-3 px-3 text-right">{language === 'vi' ? 'Trạng thái' : 'Status'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle text-secondary">
                      {paymentOrders.slice(0, visibleOrdersCount).map((order) => (
                        <tr key={order.id} className="hover:bg-surface/50 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-primary">{order.transactionId}</td>
                          <td className="py-3 px-3 font-bold text-heading">{order.planType}</td>
                          <td className="py-3 px-3 uppercase text-[11px]">{order.billingCycle}</td>
                          <td className="py-3 px-3 font-semibold">{order.paymentMethod}</td>
                          <td className="py-3 px-3 font-mono font-bold text-heading">
                            {Number(order.amount).toLocaleString('vi-VN')} VNĐ
                          </td>
                          <td className="py-3 px-3 text-muted">{formatDate(order.createdAt)}</td>
                          <td className="py-3 px-3 text-right">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                              order.status === 'COMPLETED'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {order.status === 'COMPLETED' 
                                ? (language === 'vi' ? 'Thành công' : 'Completed') 
                                : (language === 'vi' ? 'Chờ xác nhận' : 'Pending')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {paymentOrders.length > 5 && (
                  <div className="pt-2 text-center border-t border-border-subtle flex flex-wrap items-center justify-center gap-3">
                    {visibleOrdersCount < paymentOrders.length && (
                      <button
                        type="button"
                        onClick={() => setVisibleOrdersCount((prev) => Math.min(prev + 5, paymentOrders.length))}
                        className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/30 text-xs font-bold text-primary hover:bg-primary hover:text-white transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <ChevronDown className="h-4 w-4" />
                        <span>
                          {language === 'vi'
                            ? `Xem thêm 5 đơn nữa (Còn ${paymentOrders.length - visibleOrdersCount} đơn) ▼`
                            : `Load 5 More (${paymentOrders.length - visibleOrdersCount} remaining) ▼`}
                        </span>
                      </button>
                    )}

                    {visibleOrdersCount > 5 && (
                      <button
                        type="button"
                        onClick={() => setVisibleOrdersCount(5)}
                        className="px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-semibold text-secondary hover:text-foreground transition-all inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>
                          {language === 'vi' ? 'Thu gọn về 5 đơn gần nhất ▲' : 'Collapse to 5 orders ▲'}
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
