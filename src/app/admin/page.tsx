'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import { useLanguage } from '@/lib/i18n';
import { 
  Shield, Users, CreditCard, DollarSign, Award, Briefcase, 
  Folder, ArrowLeft, Search, Filter, RefreshCw, CheckCircle2, 
  AlertCircle, Sparkles, Edit3, KeyRound, ChevronDown, Check, X,
  TrendingUp, Activity
} from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { t, language } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [accessError, setAccessError] = useState('');

  // Stats data
  const [stats, setStats] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [paymentsList, setPaymentsList] = useState<any[]>([]);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'USERS' | 'PAYMENTS'>('OVERVIEW');

  // Search & Filter state
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');

  // Edit User VIP Modal state
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editPlan, setEditPlan] = useState('PRO');
  const [editRole, setEditRole] = useState('USER');
  const [editDays, setEditDays] = useState(365);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    checkAdminAndLoadData();
  }, []);

  const checkAdminAndLoadData = async () => {
    try {
      setLoading(true);
      setAccessError('');

      // Check current user systemRole
      const currentUser = await api.users.me();
      if (currentUser.systemRole !== 'ADMIN') {
        setIsAdmin(false);
        setAccessError(
          language === 'vi' 
            ? 'Quyền truy cập bị từ chối. Chỉ tài khoản Admin Hệ Thống mới có quyền sử dụng trang này.' 
            : 'Access Denied. Only System Administrator accounts can access this panel.'
        );
        return;
      }

      setIsAdmin(true);

      // Load Admin Stats, Users, Payments concurrently
      const [statsRes, usersRes, paymentsRes] = await Promise.all([
        api.admin.getStats(),
        api.admin.getUsers(),
        api.admin.getPayments()
      ]);

      setStats(statsRes);
      setUsersList(usersRes || []);
      setPaymentsList(paymentsRes || []);
    } catch (err: any) {
      console.error(err);
      setAccessError(err.message || (language === 'vi' ? 'Không thể tải dữ liệu trang quản trị.' : 'Failed to load admin data.'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditUser = (user: any) => {
    setSelectedUser(user);
    setEditPlan(user.subscriptionPlan || 'FREE');
    setEditRole(user.systemRole || 'USER');
    setEditDays(365);
    setActionMessage('');
    setActionError('');
    setShowEditModal(true);
  };

  const handleSaveUserChanges = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    setActionMessage('');
    setActionError('');

    try {
      // Update plan if changed
      if (editPlan !== selectedUser.subscriptionPlan) {
        await api.admin.updateUserPlan(selectedUser.id, editPlan, editDays);
      }
      // Update system role if changed
      if (editRole !== selectedUser.systemRole) {
        await api.admin.updateUserRole(selectedUser.id, editRole);
      }

      setActionMessage(language === 'vi' ? 'Cập nhật tài khoản thành công!' : 'User updated successfully!');
      setTimeout(() => {
        setShowEditModal(false);
        checkAdminAndLoadData();
      }, 1200);
    } catch (err: any) {
      setActionError(err.message || (language === 'vi' ? 'Lỗi khi cập nhật tài khoản.' : 'Failed to update user.'));
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const filteredUsers = usersList.filter((u) => {
    const matchesSearch = 
      u.fullname?.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchUserQuery.toLowerCase());
    const matchesPlan = planFilter === 'ALL' || u.subscriptionPlan === planFilter;
    return matchesSearch && matchesPlan;
  });

  const filteredPayments = paymentsList.filter((p) => {
    if (paymentFilter === 'ALL') return true;
    return p.paymentMethod === paymentFilter || p.status === paymentFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin || accessError) {
    return (
      <div className="flex h-screen w-full bg-background text-foreground relative font-sans items-center justify-center">
        <Sidebar />
        <div className="flex-1 text-center p-8 max-w-md mx-auto relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/20 shadow-lg">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold font-display text-heading mb-2">
            {language === 'vi' ? 'Quyền truy cập bị từ chối' : 'Access Denied'}
          </h2>
          <p className="text-secondary text-xs mb-6 leading-relaxed">
            {accessError || (language === 'vi' ? 'Bạn cần tài khoản Admin Hệ Thống để truy cập trang này.' : 'You need a System Admin account to view this page.')}
          </p>
          <button
            onClick={() => router.push('/')}
            className="ui-btn-primary px-5 py-2.5 text-xs font-bold rounded-xl"
          >
            {language === 'vi' ? 'Về Trang chủ' : 'Return Home'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background text-foreground relative font-sans overflow-hidden">
      <div className="absolute top-0 right-0 w-[50%] h-[40%] rounded-full glow-orb-primary blur-[140px] pointer-events-none opacity-20" />

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 h-screen relative z-10 overflow-y-auto pb-12">
        <div className="max-w-6xl w-full mx-auto px-6 mt-6">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-secondary hover:text-foreground transition-colors text-xs font-semibold"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
            {language === 'vi' ? 'TRANG CHỦ' : 'HOME'}
          </button>
        </div>

        <main className="max-w-6xl mx-auto px-6 mt-6 space-y-8 w-full">
          {/* Header Banner */}
          <div className="glass p-6 md:p-8 rounded-3xl border border-border relative overflow-hidden shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                    <Shield className="h-3 w-3" /> System Administrator Panel
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black font-display text-heading tracking-tight flex items-center gap-3">
                  {language === 'vi' ? 'Bảng Quản Trị Hệ Thống Homix' : 'Homix System Admin Dashboard'}
                </h1>
                <p className="text-secondary text-xs md:text-sm mt-1 max-w-xl leading-relaxed">
                  {language === 'vi' 
                    ? 'Quản lý toàn bộ người dùng, cấp/nâng gói VIP thủ công, theo dõi đơn hàng và tổng doanh thu hệ thống' 
                    : 'Manage system users, manually grant VIP plans, track payment transactions, and system revenue'}
                </p>
              </div>

              <button
                onClick={checkAdminAndLoadData}
                className="ui-btn-secondary px-4 py-2.5 text-xs font-bold flex items-center gap-2 border-primary/30 text-primary hover:bg-primary/10 rounded-xl"
              >
                <RefreshCw className="h-4 w-4" />
                {language === 'vi' ? 'Làm mới dữ liệu' : 'Refresh Data'}
              </button>
            </div>

            {/* 4 Stats Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-border-subtle">
              {/* Card 1: Total Revenue */}
              <div className="bg-surface/50 border border-border p-4 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between text-muted mb-1">
                  <span className="text-[11px] font-bold uppercase">{language === 'vi' ? 'Tổng doanh thu' : 'Total Revenue'}</span>
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="text-xl md:text-2xl font-black font-mono text-emerald-400">
                  {Number(stats?.totalRevenue || 0).toLocaleString('vi-VN')} VNĐ
                </div>
                <p className="text-[10px] text-muted mt-1">{stats?.totalOrders || 0} {language === 'vi' ? 'giao dịch hoàn tất' : 'completed orders'}</p>
              </div>

              {/* Card 2: Total Users */}
              <div className="bg-surface/50 border border-border p-4 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between text-muted mb-1">
                  <span className="text-[11px] font-bold uppercase">{language === 'vi' ? 'Người dùng hệ thống' : 'Total Users'}</span>
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div className="text-xl md:text-2xl font-black font-display text-heading">
                  {stats?.totalUsers || 0}
                </div>
                <p className="text-[10px] text-muted mt-1">
                  <span className="text-amber-400 font-bold">{stats?.proUsers || 0} Pro</span> | <span className="text-purple-400 font-bold">{stats?.enterpriseUsers || 0} Enterprise</span>
                </p>
              </div>

              {/* Card 3: Workspaces & Projects */}
              <div className="bg-surface/50 border border-border p-4 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between text-muted mb-1">
                  <span className="text-[11px] font-bold uppercase">{language === 'vi' ? 'Workspace & Dự án' : 'Workspaces & Projects'}</span>
                  <Briefcase className="h-4 w-4 text-cyan-400" />
                </div>
                <div className="text-xl md:text-2xl font-black font-display text-heading">
                  {stats?.totalWorkspaces || 0} / {stats?.totalProjects || 0}
                </div>
                <p className="text-[10px] text-muted mt-1">{language === 'vi' ? 'Không gian làm việc & Dự án' : 'Active workspaces & projects'}</p>
              </div>

              {/* Card 4: Total Orders */}
              <div className="bg-surface/50 border border-border p-4 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between text-muted mb-1">
                  <span className="text-[11px] font-bold uppercase">{language === 'vi' ? 'Đơn hàng thanh toán' : 'Total Orders'}</span>
                  <CreditCard className="h-4 w-4 text-amber-400" />
                </div>
                <div className="text-xl md:text-2xl font-black font-display text-heading">
                  {stats?.totalOrders || 0}
                </div>
                <p className="text-[10px] text-muted mt-1">{language === 'vi' ? 'Giao dịch qua VNPay / PayPal' : 'Transactions via VNPay / PayPal'}</p>
              </div>
            </div>
          </div>

          {/* Management Navigation Tabs */}
          <div className="flex border-b border-border gap-6">
            <button
              onClick={() => setActiveTab('OVERVIEW')}
              className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer border-0 bg-transparent ${
                activeTab === 'OVERVIEW'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-secondary hover:text-foreground'
              }`}
            >
              <Activity className="h-4.5 w-4.5" />
              {language === 'vi' ? 'Tổng Quan & Doanh Thu' : 'Overview & Revenue'}
            </button>

            <button
              onClick={() => setActiveTab('USERS')}
              className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer border-0 bg-transparent ${
                activeTab === 'USERS'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-secondary hover:text-foreground'
              }`}
            >
              <Users className="h-4.5 w-4.5" />
              {language === 'vi' ? `Quản Lý Người Dùng (${usersList.length})` : `User Management (${usersList.length})`}
            </button>

            <button
              onClick={() => setActiveTab('PAYMENTS')}
              className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer border-0 bg-transparent ${
                activeTab === 'PAYMENTS'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-secondary hover:text-foreground'
              }`}
            >
              <CreditCard className="h-4.5 w-4.5" />
              {language === 'vi' ? `Tất Cả Đơn Hàng (${paymentsList.length})` : `All Payments (${paymentsList.length})`}
            </button>
          </div>

          {/* TAB 1: OVERVIEW & RECENT TRANSACTIONS */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              <div className="glass p-6 rounded-3xl border border-border shadow-xl space-y-4">
                <h3 className="text-base font-bold font-display text-heading flex items-center gap-2 border-b border-border-subtle pb-3">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                  {language === 'vi' ? 'Các Giao Dịch Thanh Toán Gần Đây' : 'Recent Payment Transactions'}
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border-subtle text-muted text-[11px] uppercase tracking-wider">
                        <th className="py-3 px-3">Mã giao dịch</th>
                        <th className="py-3 px-3">Mã người dùng</th>
                        <th className="py-3 px-3">Gói VIP</th>
                        <th className="py-3 px-3">Cổng thanh toán</th>
                        <th className="py-3 px-3">Số tiền</th>
                        <th className="py-3 px-3">Thời gian</th>
                        <th className="py-3 px-3 text-right">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle text-secondary">
                      {(stats?.recentOrders || []).map((order: any) => (
                        <tr key={order.id} className="hover:bg-surface/50 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-primary">{order.transactionId}</td>
                          <td className="py-3 px-3 font-mono text-muted truncate max-w-[120px]">{order.userId}</td>
                          <td className="py-3 px-3 font-bold text-heading">{order.planType}</td>
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
                              {order.status === 'COMPLETED' ? 'Thành công' : 'Chờ xử lý'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USER MANAGEMENT */}
          {activeTab === 'USERS' && (
            <div className="glass p-6 rounded-3xl border border-border shadow-xl space-y-5">
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border-subtle pb-4">
                <div className="relative w-full sm:w-72">
                  <input
                    type="text"
                    value={searchUserQuery}
                    onChange={(e) => setSearchUserQuery(e.target.value)}
                    placeholder={language === 'vi' ? 'Tìm theo tên hoặc Email...' : 'Search by name or email...'}
                    className="ui-input px-4 py-2 text-xs pl-10 w-full"
                  />
                  <Search className="h-4 w-4 text-muted absolute left-3.5 top-2.5" />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Filter className="h-4 w-4 text-muted" />
                  <select
                    value={planFilter}
                    onChange={(e) => setPlanFilter(e.target.value)}
                    className="ui-input px-3 py-2 text-xs rounded-xl bg-surface"
                  >
                    <option value="ALL">{language === 'vi' ? 'Tất cả các gói' : 'All Plans'}</option>
                    <option value="FREE">FREE</option>
                    <option value="PRO">PRO VIP</option>
                    <option value="ENTERPRISE">ENTERPRISE VIP</option>
                  </select>
                </div>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border-subtle text-muted text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-3">{language === 'vi' ? 'Người dùng' : 'User'}</th>
                      <th className="py-3 px-3">Email</th>
                      <th className="py-3 px-3">{language === 'vi' ? 'Gói hiện tại' : 'Current Plan'}</th>
                      <th className="py-3 px-3">{language === 'vi' ? 'Hạn sử dụng' : 'Expires At'}</th>
                      <th className="py-3 px-3">{language === 'vi' ? 'Quyền hệ thống' : 'System Role'}</th>
                      <th className="py-3 px-3">{language === 'vi' ? 'Ngày tham gia' : 'Joined Date'}</th>
                      <th className="py-3 px-3 text-right">{language === 'vi' ? 'Thao tác' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle text-secondary">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-surface/50 transition-colors">
                        <td className="py-3 px-3 flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs overflow-hidden shrink-0">
                            {u.avatarUrl ? (
                              <img src={u.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <span>{u.fullname?.charAt(0).toUpperCase() || 'U'}</span>
                            )}
                          </div>
                          <span className="font-bold text-heading">{u.fullname}</span>
                        </td>
                        <td className="py-3 px-3 font-mono">{u.email}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            u.subscriptionPlan === 'ENTERPRISE' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                            u.subscriptionPlan === 'PRO' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            'bg-surface text-muted border-border'
                          }`}>
                            {u.subscriptionPlan || 'FREE'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-muted">{formatDate(u.subscriptionExpiresAt)}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            u.systemRole === 'ADMIN' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-muted'
                          }`}>
                            {u.systemRole || 'USER'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-muted">{formatDate(u.createdAt)}</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleOpenEditUser(u)}
                            className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all text-xs font-bold flex items-center gap-1.5 ml-auto cursor-pointer border-0"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span>{language === 'vi' ? 'Quản lý / Nâng VIP' : 'Manage / Set VIP'}</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ALL PAYMENTS */}
          {activeTab === 'PAYMENTS' && (
            <div className="glass p-6 rounded-3xl border border-border shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-border-subtle pb-4">
                <h3 className="text-base font-bold font-display text-heading flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-amber-400" />
                  {language === 'vi' ? 'Toàn Bộ Lịch Sử Đơn Hàng Thanh Toán' : 'All System Payment Transactions'}
                </h3>

                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="ui-input px-3 py-1.5 text-xs rounded-xl bg-surface"
                >
                  <option value="ALL">{language === 'vi' ? 'Tất cả phương thức' : 'All Methods & Status'}</option>
                  <option value="VNPAY">VNPay</option>
                  <option value="PAYPAL">PayPal</option>
                  <option value="CARD">Visa/Mastercard</option>
                  <option value="COMPLETED">COMPLETED (Thành công)</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border-subtle text-muted text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-3">Mã giao dịch</th>
                      <th className="py-3 px-3">Mã người dùng (User ID)</th>
                      <th className="py-3 px-3">Gói nâng cấp</th>
                      <th className="py-3 px-3">Chu kỳ</th>
                      <th className="py-3 px-3">Phương thức</th>
                      <th className="py-3 px-3">Số tiền</th>
                      <th className="py-3 px-3">Thời gian tạo</th>
                      <th className="py-3 px-3 text-right">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle text-secondary">
                    {filteredPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-surface/50 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-primary">{p.transactionId}</td>
                        <td className="py-3 px-3 font-mono text-muted truncate max-w-[120px]">{p.userId}</td>
                        <td className="py-3 px-3 font-bold text-heading">{p.planType}</td>
                        <td className="py-3 px-3 uppercase text-[11px]">{p.billingCycle}</td>
                        <td className="py-3 px-3 font-semibold">{p.paymentMethod}</td>
                        <td className="py-3 px-3 font-mono font-bold text-heading">
                          {Number(p.amount).toLocaleString('vi-VN')} VNĐ
                        </td>
                        <td className="py-3 px-3 text-muted">{formatDate(p.createdAt)}</td>
                        <td className="py-3 px-3 text-right">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                            p.status === 'COMPLETED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {p.status === 'COMPLETED' ? 'Thành công' : 'Chờ xác nhận'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>

        {/* Modal: Edit User VIP Plan & System Role */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="glass p-6 md:p-8 rounded-3xl border border-border max-w-md w-full shadow-2xl space-y-5 relative">
              <button
                onClick={() => setShowEditModal(false)}
                className="absolute top-4 right-4 text-muted hover:text-foreground transition-colors p-1 border-0 bg-transparent cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-heading font-display">
                    {language === 'vi' ? 'Quản lý Gói VIP & Quyền Quản Trị' : 'Manage User VIP & Role'}
                  </h3>
                  <p className="text-xs text-secondary mt-0.5">{selectedUser.email}</p>
                </div>
              </div>

              {actionError && <div className="ui-alert-error text-xs">{actionError}</div>}
              {actionMessage && <div className="ui-alert-success text-xs">{actionMessage}</div>}

              <div className="space-y-4">
                <div>
                  <label className="ui-label">{language === 'vi' ? 'Cấp Gói VIP' : 'Subscription Plan'}</label>
                  <select
                    value={editPlan}
                    onChange={(e) => setEditPlan(e.target.value)}
                    className="ui-input px-4 py-2.5 text-xs w-full bg-surface"
                  >
                    <option value="FREE">FREE PLAN (Gói Miễn phí)</option>
                    <option value="PRO">PRO PLAN (VIP Cao cấp)</option>
                    <option value="ENTERPRISE">ENTERPRISE PLAN (VIP Doanh nghiệp)</option>
                  </select>
                </div>

                {editPlan !== 'FREE' && (
                  <div>
                    <label className="ui-label">{language === 'vi' ? 'Số ngày hiệu lực Gói VIP' : 'Validity Duration (Days)'}</label>
                    <input
                      type="number"
                      value={editDays}
                      onChange={(e) => setEditDays(Number(e.target.value))}
                      placeholder="365"
                      className="ui-input px-4 py-2.5 text-xs w-full"
                    />
                  </div>
                )}

                <div>
                  <label className="ui-label">{language === 'vi' ? 'Vai trò Hệ Thống (System Role)' : 'System Role'}</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="ui-input px-4 py-2.5 text-xs w-full bg-surface"
                  >
                    <option value="USER">USER (Người dùng thông thường)</option>
                    <option value="ADMIN">ADMIN (Quản trị viên toàn hệ thống)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-border-subtle flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="ui-btn-secondary px-4 py-2.5 text-xs font-semibold rounded-xl"
                >
                  {language === 'vi' ? 'Hủy' : 'Cancel'}
                </button>

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleSaveUserChanges}
                  className="ui-btn-primary px-5 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 border-0 cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  {actionLoading 
                    ? (language === 'vi' ? 'Đang lưu...' : 'Saving...') 
                    : (language === 'vi' ? 'Lưu thay đổi' : 'Save Changes')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
