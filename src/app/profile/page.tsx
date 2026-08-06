'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import { 
  User, Mail, Camera, Save, ArrowLeft, Shield, 
  CheckCircle2, Sparkles, Upload, Image as ImageIcon,
  CreditCard, Calendar, Clock, Award, History, ArrowUpRight, Zap
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [subscriptionPlan, setSubscriptionPlan] = useState('FREE');
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState('');
  const [paymentOrders, setPaymentOrders] = useState<any[]>([]);

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
      setError('Không thể tải thông tin hồ sơ.');
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

  // Helper date formatters
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Chưa kích hoạt';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' });
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
      <div className="absolute top-0 right-0 w-[50%] h-[40%] rounded-full glow-orb-primary blur-[140px] pointer-events-none" />

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 h-screen relative z-10 overflow-y-auto pb-12">
        <div className="max-w-5xl w-full mx-auto px-6 mt-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-secondary hover:text-foreground transition-colors text-xs font-semibold"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
            QUAY LẠI
          </button>
        </div>

        <main className="max-w-5xl mx-auto px-6 mt-8 space-y-8 w-full">
          {/* Header */}
          <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold font-display text-heading flex items-center gap-3">
                <User className="h-7 w-7 text-primary" />
                Hồ sơ & Tài khoản của bạn
              </h1>
              <p className="text-secondary text-sm mt-1">
                Quản lý thông tin cá nhân, ảnh đại diện và chi tiết gói dịch vụ VIP
              </p>
            </div>

            <Link href="/pricing" className="ui-btn-primary px-4 py-2 text-xs font-bold flex items-center gap-2 rounded-xl no-underline shrink-0">
              <Zap className="h-4 w-4" /> Nâng cấp Gói dịch vụ
            </Link>
          </div>

          {error && <div className="ui-alert-error text-xs">{error}</div>}
          {message && <div className="ui-alert-success text-xs">{message}</div>}

          {/* Section 1: VIP Subscription Banner Card */}
          <div className={`p-6 rounded-3xl border shadow-xl relative overflow-hidden ${
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
                  <span className="text-xs uppercase font-bold tracking-wider text-muted">Trạng thái Gói dịch vụ hiện tại</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl font-black font-display text-heading uppercase tracking-wide flex items-center gap-2">
                    {subscriptionPlan} PLAN
                  </h2>

                  {subscriptionPlan !== 'FREE' ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 animate-pulse">
                      <Sparkles className="h-3.5 w-3.5" /> ĐANG HOẠT ĐỘNG
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-surface text-secondary border border-border text-xs font-bold">
                      GÓI MẶC ĐỊNH
                    </span>
                  )}
                </div>

                <p className="text-xs text-secondary max-w-xl">
                  {subscriptionPlan === 'ENTERPRISE'
                    ? 'Bạn đang sở hữu gói Cao cấp nhất với toàn bộ tính năng AI, lưu trữ không giới hạn và hỗ trợ ưu tiên 24/7.'
                    : subscriptionPlan === 'PRO'
                    ? 'Tài khoản của bạn đã được nâng cấp bản Pro VIP. Bạn có thể sử dụng tất cả tính năng quản lý dự án, chat nhóm và đính kèm tài liệu nâng cao.'
                    : 'Bạn đang sử dụng gói Miễn phí. Hãy nâng cấp lên bản Pro để mở khóa toàn bộ tính năng nâng cao!'}
                </p>
              </div>

              {/* Expiration Card */}
              {subscriptionPlan !== 'FREE' && (
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2 text-xs shrink-0 w-full md:w-64">
                  <div className="flex justify-between items-center text-muted text-[11px]">
                    <span>Hạn sử dụng gói:</span>
                    <Clock className="h-3.5 w-3.5 text-amber-400" />
                  </div>
                  <div className="text-lg font-bold font-mono text-heading">
                    {formatDate(subscriptionExpiresAt)}
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/10">
                    <span>Thời gian còn lại:</span>
                    <strong className="text-emerald-400 font-bold">{daysLeft} ngày</strong>
                  </div>
                </div>
              )}
            </div>
          </div>

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
                </div>

                <div className="pt-4 border-t border-border-subtle flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="ui-btn-primary px-6 py-2.5 flex items-center gap-2 text-xs font-semibold cursor-pointer border-0"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Section 2: Payment Orders History Table */}
          <div className="glass p-6 rounded-3xl border border-border space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-4">
              <div>
                <h3 className="text-base font-bold font-display text-heading flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Lịch sử Thanh toán & Đơn hàng
                </h3>
                <p className="text-xs text-secondary mt-0.5">Danh sách các giao dịch nâng cấp gói trả phí của bạn</p>
              </div>

              <span className="text-xs text-muted font-bold">
                Tổng cộng: {paymentOrders.length} đơn hàng
              </span>
            </div>

            {paymentOrders.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted space-y-2">
                <CreditCard className="h-8 w-8 text-muted mx-auto opacity-50" />
                <p>Bạn chưa có lịch sử thanh toán nào.</p>
                <Link href="/pricing" className="text-primary font-bold hover:underline inline-block">
                  Nâng cấp gói dịch vụ đầu tiên ➔
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border-subtle text-muted text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-3">Mã đơn hàng</th>
                      <th className="py-3 px-3">Gói</th>
                      <th className="py-3 px-3">Chu kỳ</th>
                      <th className="py-3 px-3">Phương thức</th>
                      <th className="py-3 px-3">Số tiền</th>
                      <th className="py-3 px-3">Thời gian</th>
                      <th className="py-3 px-3 text-right">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle text-secondary">
                    {paymentOrders.map((order) => (
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
                            {order.status === 'COMPLETED' ? 'Thành công' : 'Chờ xác nhận'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
