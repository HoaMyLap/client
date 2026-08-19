'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/i18n';
import ThemeToggle from '@/components/ThemeToggle';
import { 
  Shield, Users, CreditCard, DollarSign, Award, Briefcase, 
  Folder, ArrowLeft, Search, Filter, RefreshCw, CheckCircle2, 
  AlertCircle, Sparkles, Edit3, KeyRound, ChevronDown, Check, X,
  TrendingUp, Activity, Server, Database, HardDrive, Cpu, Layers,
  LogOut, Home, ArrowUpRight, BarChart3, Settings, Bell, Download
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function StandaloneAdminPortal() {
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [accessError, setAccessError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Stats data
  const [stats, setStats] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [paymentsList, setPaymentsList] = useState<any[]>([]);

  // Active Admin View Section
  const [activeSection, setActiveSection] = useState<'OVERVIEW' | 'USERS' | 'PAYMENTS' | 'SYSTEM'>('OVERVIEW');

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

      // Verify System Admin Role
      const user = await api.users.me();
      setCurrentUser(user);

      if (user.systemRole !== 'ADMIN') {
        setIsAdmin(false);
        setAccessError(
          language === 'vi' 
            ? 'Quyền truy cập bị từ chối. Trang này dành riêng cho Quản Trị Viên Hệ Thống Homix.' 
            : 'Access Denied. This standalone portal is reserved for Homix System Administrators.'
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
      setAccessError(err.message || (language === 'vi' ? 'Không thể kết nối đến hệ thống quản trị.' : 'Failed to connect to admin system.'));
    } finally {
      setLoading(false);
    }
  };

  // Dynamic Currency Formatter: 1 USD ≈ 25,000 VND
  const formatCurrency = (amountVnd: number) => {
    if (!amountVnd || isNaN(amountVnd)) {
      return language === 'vi' ? '0 VNĐ' : '$0.00';
    }
    if (language === 'en') {
      const usd = amountVnd / 25000;
      return `$${usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `${amountVnd.toLocaleString('vi-VN')} VNĐ`;
  };

  const translateStatus = (status: string) => {
    if (!status) return '—';
    const s = status.toUpperCase();
    if (s === 'COMPLETED') return language === 'vi' ? 'Thành công' : 'Completed';
    if (s === 'PENDING') return language === 'vi' ? 'Chờ xử lý' : 'Pending';
    if (s === 'CANCELLED') return language === 'vi' ? 'Đã hủy' : 'Cancelled';
    if (s === 'FAILED') return language === 'vi' ? 'Thất bại' : 'Failed';
    return status;
  };

  const translateMethod = (method: string) => {
    if (!method) return '—';
    const m = method.toUpperCase();
    if (m === 'VNPAY') return language === 'vi' ? 'Cổng VNPay' : 'VNPay Gateway';
    if (m === 'PAYPAL') return language === 'vi' ? 'Cổng PayPal' : 'PayPal Gateway';
    if (m === 'CREDIT_CARD') return language === 'vi' ? 'Thẻ Quốc Tế (Visa/Master)' : 'Credit Card';
    return method;
  };

  const translateBillingCycle = (cycle: string) => {
    if (!cycle) return '—';
    const c = cycle.toLowerCase();
    if (c === 'monthly') return language === 'vi' ? 'Hàng tháng' : 'Monthly';
    if (c === 'annual' || c === 'yearly') return language === 'vi' ? 'Hàng năm' : 'Annual';
    return cycle;
  };

  const translateRole = (role: string) => {
    if (role === 'ADMIN') return language === 'vi' ? 'ADMIN Hệ Thống' : 'System Admin';
    return language === 'vi' ? 'Người Dùng' : 'Standard User';
  };

  // Export Excel function for Users
  const handleExportUsersExcel = () => {
    try {
      const dataToExport = filteredUsers.map((u, idx) => ({
        'STT': idx + 1,
        'Họ và Tên / Full Name': u.fullname || '—',
        'Email': u.email || '—',
        'Gói VIP / Plan': u.subscriptionPlan || 'FREE',
        'Hạn Sử Dụng / Expiration': formatDate(u.subscriptionExpiresAt),
        'Vai Trò / System Role': translateRole(u.systemRole),
        'Ngày Đăng Ký / Joined Date': formatDate(u.createdAt)
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
      XLSX.writeFile(workbook, `Homix_Danh_Sach_Nguoi_Dung_${new Date().toISOString().slice(0,10)}.xlsx`);
    } catch (e) {
      console.error('Export users Excel error:', e);
    }
  };

  // Export Excel function for Payments
  const handleExportPaymentsExcel = () => {
    try {
      const dataToExport = filteredPayments.map((p, idx) => ({
        'STT': idx + 1,
        'Mã Giao Dịch / Transaction ID': p.transactionId || '—',
        'User ID': p.userId || '—',
        'Gói Nâng Cấp / Plan': p.planType || '—',
        'Chu Kỳ / Billing Cycle': translateBillingCycle(p.billingCycle),
        'Cổng Thanh Toán / Gateway': translateMethod(p.paymentMethod),
        'Số Tiền (VNĐ)': p.amount ? Number(p.amount) : 0,
        'Số Tiền (USD)': p.amount ? Number(p.amount) / 25000 : 0,
        'Trạng Thái / Status': translateStatus(p.status),
        'Thời Gian / Created Date': formatDate(p.createdAt)
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Payments');
      XLSX.writeFile(workbook, `Homix_Bao_Cao_Doanh_Thu_${new Date().toISOString().slice(0,10)}.xlsx`);
    } catch (e) {
      console.error('Export payments Excel error:', e);
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
      if (editPlan !== selectedUser.subscriptionPlan) {
        await api.admin.updateUserPlan(selectedUser.id, editPlan, editDays);
      }
      if (editRole !== selectedUser.systemRole) {
        await api.admin.updateUserRole(selectedUser.id, editRole);
      }

      setActionMessage(language === 'vi' ? 'Cập nhật tài khoản thành công!' : 'Account updated successfully!');
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

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
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
      <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="text-xs text-muted font-mono">{language === 'vi' ? 'Đang tải Bảng Quản Trị Homix Admin...' : 'Loading Homix Admin Console...'}</p>
        </div>
      </div>
    );
  }

  if (!isAdmin || accessError) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground p-4 font-sans relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-error-muted rounded-full blur-[140px] pointer-events-none" />
        <div className="glass p-8 rounded-3xl border border-error/30 max-w-md w-full text-center space-y-5 relative z-10 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-error-muted text-error border border-error/30 flex items-center justify-center mx-auto shadow-lg">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-heading mb-2">
              {language === 'vi' ? 'Quyền truy cập bị từ chối' : 'Access Denied'}
            </h2>
            <p className="text-secondary text-xs leading-relaxed">
              {accessError || (language === 'vi' ? 'Bạn cần tài khoản Admin Hệ Thống để truy cập trang quản trị này.' : 'You need System Admin credentials to access this portal.')}
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 rounded-xl bg-surface hover:bg-surface-elevated text-heading text-xs font-bold transition-all cursor-pointer border border-border"
          >
            {language === 'vi' ? 'Quay lại Trang Chủ Platform' : 'Return to Home Platform'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background text-foreground font-sans overflow-hidden">
      {/* Background Decorative Ambient Orbs */}
      <div className="absolute top-0 right-0 w-[60%] h-[50%] rounded-full glow-orb-primary blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[50%] h-[40%] rounded-full glow-orb-accent blur-[160px] pointer-events-none" />

      {/* ========================================================================= */}
      {/* 1. DEDICATED SYSTEM ADMIN SIDEBAR */}
      {/* ========================================================================= */}
      <aside className="w-64 h-screen bg-surface/90 backdrop-blur-xl border-r border-border flex flex-col justify-between shrink-0 z-30 select-none">
        <div>
          {/* Admin Portal Brand Header with Mini Logo */}
          <div className="p-4 border-b border-border flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-surface-elevated border border-border flex items-center justify-center shadow-md shrink-0 p-1">
              <img src="/minilogo.png" alt="Homix Admin Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-black font-display text-sm tracking-wide text-heading">HOMIX ADMIN</h1>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">PRO</span>
              </div>
              <p className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {language === 'vi' ? 'Hệ Thống Sẵn Sàng' : 'System Online'}
              </p>
            </div>
          </div>

          {/* System Navigation Menu */}
          <div className="p-4 space-y-1.5">
            <div className="text-[9px] font-bold text-muted uppercase tracking-wider px-3 mb-2">
              {language === 'vi' ? 'Quản Trị Hệ Thống' : 'System Console'}
            </div>

            <button
              onClick={() => setActiveSection('OVERVIEW')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border-0 cursor-pointer text-left ${
                activeSection === 'OVERVIEW'
                  ? 'bg-primary/15 text-primary border border-primary/30 shadow-md'
                  : 'text-secondary hover:bg-hover hover:text-heading'
              }`}
            >
              <BarChart3 className="w-4.5 h-4.5 shrink-0" />
              <span>{language === 'vi' ? 'Tổng Quan & Doanh Thu' : 'Overview & Revenue'}</span>
            </button>

            <button
              onClick={() => setActiveSection('USERS')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border-0 cursor-pointer text-left ${
                activeSection === 'USERS'
                  ? 'bg-primary/15 text-primary border border-primary/30 shadow-md'
                  : 'text-secondary hover:bg-hover hover:text-heading'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4.5 h-4.5 shrink-0" />
                <span>{language === 'vi' ? 'Quản Lý Người Dùng' : 'Users Directory'}</span>
              </div>
              <span className="text-[10px] bg-card px-2 py-0.5 rounded-full text-foreground font-mono">
                {usersList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSection('PAYMENTS')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border-0 cursor-pointer text-left ${
                activeSection === 'PAYMENTS'
                  ? 'bg-primary/15 text-primary border border-primary/30 shadow-md'
                  : 'text-secondary hover:bg-hover hover:text-heading'
              }`}
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-4.5 h-4.5 shrink-0" />
                <span>{language === 'vi' ? 'Nhật Ký Đơn Hàng' : 'Payment Orders Audit'}</span>
              </div>
              <span className="text-[10px] bg-card px-2 py-0.5 rounded-full text-foreground font-mono">
                {paymentsList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSection('SYSTEM')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border-0 cursor-pointer text-left ${
                activeSection === 'SYSTEM'
                  ? 'bg-primary/15 text-primary border border-primary/30 shadow-md'
                  : 'text-secondary hover:bg-hover hover:text-heading'
              }`}
            >
              <Server className="w-4.5 h-4.5 shrink-0" />
              <span>{language === 'vi' ? 'Hạ Tầng & Server' : 'Infrastructure & Server'}</span>
            </button>
          </div>
        </div>

        {/* Admin Sidebar Bottom Controls */}
        <div className="p-4 border-t border-border space-y-3">
          {/* Admin User Card */}
          <div className="p-3 rounded-2xl bg-card border border-border flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
              {currentUser?.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{currentUser?.fullname?.charAt(0).toUpperCase() || 'A'}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-xs text-heading truncate">{currentUser?.fullname}</div>
              <div className="text-[10px] text-muted truncate">{currentUser?.email}</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-1.5 pt-1">
            <Link
              href="/"
              className="w-full py-2 px-3 rounded-xl bg-surface hover:bg-surface-elevated text-heading text-xs font-semibold flex items-center justify-center gap-2 no-underline transition-all border border-border"
            >
              <Home className="w-3.5 h-3.5 text-primary" />
              <span>{language === 'vi' ? 'Về Nền Tảng Người Dùng' : 'Back to User Platform'}</span>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full py-2 px-3 rounded-xl bg-error-muted text-error hover:bg-error hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer border border-error/20"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{language === 'vi' ? 'Đăng xuất' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. DEDICATED MAIN ADMIN CONTENT CONTAINER */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 h-screen relative z-10 overflow-y-auto">
        {/* Dedicated Admin Top Header Bar */}
        <header className="h-16 border-b border-border bg-header/60 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-muted uppercase tracking-widest">CONSOLE /</span>
            <h2 className="text-sm font-bold font-display text-heading uppercase tracking-wider">
              {activeSection === 'OVERVIEW' && (language === 'vi' ? 'Tổng Quan Báo Cáo Doanh Thu' : 'Revenue & Metrics Overview')}
              {activeSection === 'USERS' && (language === 'vi' ? 'Quản Lý Người Dùng & Gói VIP' : 'User Management & VIP Access')}
              {activeSection === 'PAYMENTS' && (language === 'vi' ? 'Nhật Ký Đơn Hàng Thanh Toán' : 'All Payment Transactions Log')}
              {activeSection === 'SYSTEM' && (language === 'vi' ? 'Trạng Thái Hạ Tầng Server' : 'Infrastructure & Server Status')}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switcher Button */}
            <button
              type="button"
              onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
              className="px-3 py-1.5 rounded-xl border border-border bg-surface hover:border-primary/40 text-xs font-bold text-heading transition-all cursor-pointer"
              title="Change Language"
            >
              <span>{language === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN'}</span>
            </button>

            {/* Dark / Light Mode Toggle Button */}
            <ThemeToggle className="rounded-xl border border-border bg-surface hover:border-primary/40 text-heading transition-all cursor-pointer" />

            {/* Refresh Data Button */}
            <button
              onClick={checkAdminAndLoadData}
              className="px-3 py-1.5 rounded-xl border border-border bg-surface text-heading hover:border-primary/40 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Refresh console data"
            >
              <RefreshCw className="w-3.5 h-3.5 text-primary" />
              <span className="hidden sm:inline">{language === 'vi' ? 'Làm mới' : 'Refresh'}</span>
            </button>
          </div>
        </header>

        {/* Main Section Content Area */}
        <main className="p-8 max-w-7xl w-full mx-auto space-y-8 flex-1">
          {/* SECTION 1: OVERVIEW & REVENUE METRICS */}
          {activeSection === 'OVERVIEW' && (
            <div className="space-y-8">
              {/* 4 System Master KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Master Card 1: Total Revenue */}
                <div className="p-5 rounded-3xl bg-surface/80 border border-success/30 relative overflow-hidden shadow-xl">
                  <div className="flex items-center justify-between text-secondary mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">{language === 'vi' ? 'Tổng Doanh Thu' : 'Total Revenue'}</span>
                    <DollarSign className="w-5 h-5 text-success" />
                  </div>
                  <div className="text-2xl lg:text-3xl font-black font-mono text-success">
                    {formatCurrency(Number(stats?.totalRevenue || 0))}
                  </div>
                  <div className="text-[11px] text-secondary mt-2 flex items-center justify-between pt-2 border-t border-border">
                    <span>{language === 'vi' ? 'Giao dịch thành công:' : 'Completed orders:'}</span>
                    <strong className="text-heading font-mono">{stats?.totalOrders || 0}</strong>
                  </div>
                </div>

                {/* Master Card 2: Total Users */}
                <div className="p-5 rounded-3xl bg-surface/80 border border-primary/30 relative overflow-hidden shadow-xl">
                  <div className="flex items-center justify-between text-secondary mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">{language === 'vi' ? 'Tổng Người Dùng' : 'Total System Users'}</span>
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-2xl lg:text-3xl font-black font-display text-heading">
                    {stats?.totalUsers || 0}
                  </div>
                  <div className="text-[11px] text-secondary mt-2 flex items-center justify-between pt-2 border-t border-border">
                    <span>Pro / Enterprise:</span>
                    <strong className="text-primary font-mono">{stats?.proUsers || 0} Pro / {stats?.enterpriseUsers || 0} Ent</strong>
                  </div>
                </div>

                {/* Master Card 3: Workspaces & Projects */}
                <div className="p-5 rounded-3xl bg-surface/80 border border-accent/30 relative overflow-hidden shadow-xl">
                  <div className="flex items-center justify-between text-secondary mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">{language === 'vi' ? 'Workspace & Dự Án' : 'Workspaces & Projects'}</span>
                    <Briefcase className="w-5 h-5 text-accent" />
                  </div>
                  <div className="text-2xl lg:text-3xl font-black font-display text-heading">
                    {stats?.totalWorkspaces || 0} <span className="text-muted text-lg font-normal">/ {stats?.totalProjects || 0}</span>
                  </div>
                  <div className="text-[11px] text-secondary mt-2 flex items-center justify-between pt-2 border-t border-border">
                    <span>{language === 'vi' ? 'Dự án đang hoạt động:' : 'Active projects:'}</span>
                    <strong className="text-accent font-mono">{stats?.totalProjects || 0}</strong>
                  </div>
                </div>

                {/* Master Card 4: Total Transactions */}
                <div className="p-5 rounded-3xl bg-surface/80 border border-warning/30 relative overflow-hidden shadow-xl">
                  <div className="flex items-center justify-between text-secondary mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">{language === 'vi' ? 'Đơn Hàng Thanh Toán' : 'Total Orders Log'}</span>
                    <CreditCard className="w-5 h-5 text-warning" />
                  </div>
                  <div className="text-2xl lg:text-3xl font-black font-display text-heading">
                    {stats?.totalOrders || 0}
                  </div>
                  <div className="text-[11px] text-secondary mt-2 flex items-center justify-between pt-2 border-t border-border">
                    <span>{language === 'vi' ? 'Cổng VNPay & PayPal' : 'VNPay & PayPal Gateways'}</span>
                    <strong className="text-warning font-mono">100% Verified</strong>
                  </div>
                </div>
              </div>

              {/* Recent System Activity Stream Table */}
              <div className="bg-surface/80 p-6 rounded-3xl border border-border space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div>
                    <h3 className="text-base font-bold font-display text-heading flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-success" />
                      {language === 'vi' ? 'Nhật Ký Thanh Toán Gần Đây Toàn Hệ Thống' : 'Recent System Payment Log'}
                    </h3>
                    <p className="text-xs text-secondary mt-0.5">
                      {language === 'vi' ? 'Top 10 giao dịch mới nhất nhận từ các cổng thanh toán' : 'Top 10 latest transactions received from payment gateways'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleExportPaymentsExcel}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500 hover:text-black border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                      title="Export Excel"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{language === 'vi' ? 'Xuất Báo Cáo Excel' : 'Export Excel Report'}</span>
                    </button>

                    <button
                      onClick={() => setActiveSection('PAYMENTS')}
                      className="text-xs text-link font-bold hover:underline flex items-center gap-1 border-0 bg-transparent cursor-pointer"
                    >
                      <span>{language === 'vi' ? 'Xem tất cả ➔' : 'View all ➔'}</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border text-muted text-[11px] uppercase tracking-wider">
                        <th className="py-3 px-3">{language === 'vi' ? 'Mã đơn hàng' : 'Transaction ID'}</th>
                        <th className="py-3 px-3">{language === 'vi' ? 'Mã User ID' : 'User ID'}</th>
                        <th className="py-3 px-3">{language === 'vi' ? 'Gói dịch vụ' : 'Plan Type'}</th>
                        <th className="py-3 px-3">{language === 'vi' ? 'Cổng thanh toán' : 'Gateway'}</th>
                        <th className="py-3 px-3">{language === 'vi' ? 'Số tiền' : 'Amount'}</th>
                        <th className="py-3 px-3">{language === 'vi' ? 'Thời gian' : 'Created At'}</th>
                        <th className="py-3 px-3 text-right">{language === 'vi' ? 'Trạng thái' : 'Status'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 text-foreground">
                      {(stats?.recentOrders || []).map((order: any) => (
                        <tr key={order.id} className="hover:bg-hover transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-amber-400">{order.transactionId}</td>
                          <td className="py-3 px-3 font-mono text-muted truncate max-w-[140px]">{order.userId}</td>
                          <td className="py-3 px-3 font-bold text-heading">{order.planType}</td>
                          <td className="py-3 px-3 font-semibold">{translateMethod(order.paymentMethod)}</td>
                          <td className="py-3 px-3 font-mono font-bold text-heading">
                            {formatCurrency(Number(order.amount))}
                          </td>
                          <td className="py-3 px-3 text-secondary">{formatDate(order.createdAt)}</td>
                          <td className="py-3 px-3 text-right">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                              order.status === 'COMPLETED'
                                ? 'bg-success-muted text-success border border-success/30'
                                : 'bg-warning-muted text-warning border border-warning/30'
                            }`}>
                              {translateStatus(order.status)}
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

          {/* SECTION 2: USER MANAGEMENT */}
          {activeSection === 'USERS' && (
            <div className="bg-surface/80 p-6 rounded-3xl border border-border space-y-5 shadow-xl">
              {/* Search & Filter Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border pb-4">
                <div className="relative w-full sm:w-80">
                  <input
                    type="text"
                    value={searchUserQuery}
                    onChange={(e) => setSearchUserQuery(e.target.value)}
                    placeholder={language === 'vi' ? 'Tìm theo Tên hoặc Email người dùng...' : 'Search by user name or email...'}
                    className="w-full bg-input-bg border border-border rounded-xl px-4 py-2.5 text-xs text-foreground pl-10 focus:outline-none focus:border-primary/50"
                  />
                  <Search className="w-4 h-4 text-muted absolute left-3.5 top-3" />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={handleExportUsersExcel}
                    className="px-3.5 py-2 rounded-xl bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500 hover:text-black border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shrink-0"
                    title="Export Excel"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{language === 'vi' ? 'Xuất File Excel' : 'Export Excel'}</span>
                  </button>

                  <Filter className="w-4 h-4 text-muted" />
                  <select
                    value={planFilter}
                    onChange={(e) => setPlanFilter(e.target.value)}
                    className="bg-input-bg border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                  >
                    <option value="ALL">{language === 'vi' ? 'Tất cả các gói VIP' : 'All VIP Plans'}</option>
                    <option value="FREE">FREE PLAN</option>
                    <option value="PRO">PRO PLAN</option>
                    <option value="ENTERPRISE">ENTERPRISE PLAN</option>
                  </select>
                </div>
              </div>

              {/* Users Directory Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border text-muted text-[11px] uppercase tracking-wider">
                      <th className="py-3.5 px-3">{language === 'vi' ? 'Người dùng' : 'User'}</th>
                      <th className="py-3.5 px-3">Email</th>
                      <th className="py-3.5 px-3">{language === 'vi' ? 'Gói VIP hiện tại' : 'VIP Plan'}</th>
                      <th className="py-3.5 px-3">{language === 'vi' ? 'Hạn sử dụng' : 'Expires At'}</th>
                      <th className="py-3.5 px-3">{language === 'vi' ? 'Vai trò Hệ thống' : 'System Role'}</th>
                      <th className="py-3.5 px-3">{language === 'vi' ? 'Ngày gia nhập' : 'Joined Date'}</th>
                      <th className="py-3.5 px-3 text-right">{language === 'vi' ? 'Quản lý' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-foreground">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-hover transition-colors">
                        <td className="py-3.5 px-3 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-card border border-border text-primary font-bold flex items-center justify-center text-xs overflow-hidden shrink-0">
                            {u.avatarUrl ? (
                              <img src={u.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <span>{u.fullname?.charAt(0).toUpperCase() || 'U'}</span>
                            )}
                          </div>
                          <span className="font-bold text-heading">{u.fullname}</span>
                        </td>
                        <td className="py-3.5 px-3 font-mono text-secondary">{u.email}</td>
                        <td className="py-3.5 px-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            u.subscriptionPlan === 'ENTERPRISE' ? 'bg-purple-500/15 text-purple-400 border-purple-500/30' :
                            u.subscriptionPlan === 'PRO' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                            'bg-card text-muted border-border'
                          }`}>
                            {u.subscriptionPlan || 'FREE'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-secondary">{formatDate(u.subscriptionExpiresAt)}</td>
                        <td className="py-3.5 px-3">
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                            u.systemRole === 'ADMIN' ? 'bg-error-muted text-error border border-error/30' : 'text-secondary'
                          }`}>
                            {translateRole(u.systemRole)}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-secondary">{formatDate(u.createdAt)}</td>
                        <td className="py-3.5 px-3 text-right">
                          <button
                            onClick={() => handleOpenEditUser(u)}
                            className="px-3 py-1.5 rounded-xl bg-primary/15 text-primary hover:bg-primary hover:text-white transition-all text-xs font-bold flex items-center gap-1.5 ml-auto cursor-pointer border border-primary/30"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>{language === 'vi' ? 'Cấp / Sửa Gói VIP' : 'Manage VIP'}</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 3: ALL PAYMENTS AUDIT */}
          {activeSection === 'PAYMENTS' && (
            <div className="bg-surface/80 p-6 rounded-3xl border border-border space-y-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <h3 className="text-base font-bold font-display text-heading flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-warning" />
                  {language === 'vi' ? 'Nhật Ký Tất Cả Giao Dịch Thanh Toán' : 'All Payment Transactions Audit Log'}
                </h3>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleExportPaymentsExcel}
                    className="px-3.5 py-2 rounded-xl bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500 hover:text-black border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shrink-0"
                    title="Export Excel"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{language === 'vi' ? 'Xuất File Excel' : 'Export Excel'}</span>
                  </button>

                  <select
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value)}
                    className="bg-input-bg border border-border rounded-xl px-3.5 py-2 text-xs text-foreground focus:outline-none"
                  >
                    <option value="ALL">{language === 'vi' ? 'Tất cả phương thức' : 'All Payment Gateways'}</option>
                    <option value="VNPAY">{language === 'vi' ? 'Cổng VNPay' : 'VNPay Gateway'}</option>
                    <option value="PAYPAL">{language === 'vi' ? 'Cổng PayPal' : 'PayPal Gateway'}</option>
                    <option value="COMPLETED">{language === 'vi' ? 'Trạng thái Thành Công' : 'Completed Status'}</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border text-muted text-[11px] uppercase tracking-wider">
                      <th className="py-3.5 px-3">{language === 'vi' ? 'Mã giao dịch' : 'Transaction ID'}</th>
                      <th className="py-3.5 px-3">{language === 'vi' ? 'Mã User ID' : 'User ID'}</th>
                      <th className="py-3.5 px-3">{language === 'vi' ? 'Gói nâng cấp' : 'Plan Type'}</th>
                      <th className="py-3.5 px-3">{language === 'vi' ? 'Chu kỳ' : 'Billing Cycle'}</th>
                      <th className="py-3.5 px-3">{language === 'vi' ? 'Phương thức' : 'Gateway'}</th>
                      <th className="py-3.5 px-3">{language === 'vi' ? 'Số tiền' : 'Amount'}</th>
                      <th className="py-3.5 px-3">{language === 'vi' ? 'Thời gian tạo' : 'Created Date'}</th>
                      <th className="py-3.5 px-3 text-right">{language === 'vi' ? 'Trạng thái' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-foreground">
                    {filteredPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-hover transition-colors">
                        <td className="py-3.5 px-3 font-mono font-bold text-amber-400">{p.transactionId}</td>
                        <td className="py-3.5 px-3 font-mono text-secondary truncate max-w-[140px]">{p.userId}</td>
                        <td className="py-3.5 px-3 font-bold text-heading">{p.planType}</td>
                        <td className="py-3.5 px-3 uppercase text-[11px]">{translateBillingCycle(p.billingCycle)}</td>
                        <td className="py-3.5 px-3 font-semibold">{translateMethod(p.paymentMethod)}</td>
                        <td className="py-3.5 px-3 font-mono font-bold text-heading">
                          {formatCurrency(Number(p.amount))}
                        </td>
                        <td className="py-3.5 px-3 text-secondary">{formatDate(p.createdAt)}</td>
                        <td className="py-3.5 px-3 text-right">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                            p.status === 'COMPLETED'
                              ? 'bg-success-muted text-success border border-success/30'
                              : 'bg-warning-muted text-warning border border-warning/30'
                          }`}>
                            {translateStatus(p.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 4: INFRASTRUCTURE & SERVER MONITOR */}
          {activeSection === 'SYSTEM' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="bg-surface/80 p-5 rounded-3xl border border-border space-y-3 shadow-xl">
                  <div className="flex items-center justify-between text-secondary">
                    <span className="text-xs font-bold uppercase">{language === 'vi' ? 'Backend API Service' : 'Backend API Service'}</span>
                    <Server className="w-5 h-5 text-success" />
                  </div>
                  <div className="text-lg font-bold text-heading font-mono">Spring Boot 3.x</div>
                  <div className="text-[11px] text-success flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    {language === 'vi' ? 'Đang chạy cổng 8000' : 'Running on Port 8000'}
                  </div>
                </div>

                <div className="bg-surface/80 p-5 rounded-3xl border border-border space-y-3 shadow-xl">
                  <div className="flex items-center justify-between text-secondary">
                    <span className="text-xs font-bold uppercase">{language === 'vi' ? 'Cơ Sở Dữ Liệu RDBMS' : 'Database RDBMS'}</span>
                    <Database className="w-5 h-5 text-accent" />
                  </div>
                  <div className="text-lg font-bold text-heading font-mono">PostgreSQL 15</div>
                  <div className="text-[11px] text-accent flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-accent" />
                    {language === 'vi' ? 'Cổng 5433 (Hoạt động tốt)' : 'Port 5433 (Healthy)'}
                  </div>
                </div>

                <div className="bg-surface/80 p-5 rounded-3xl border border-border space-y-3 shadow-xl">
                  <div className="flex items-center justify-between text-secondary">
                    <span className="text-xs font-bold uppercase">{language === 'vi' ? 'Lưu Trữ Tệp MinIO' : 'Object Storage'}</span>
                    <HardDrive className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="text-lg font-bold text-heading font-mono">MinIO Storage</div>
                  <div className="text-[11px] text-purple-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    {language === 'vi' ? 'Cổng 9000 / Console 9001' : 'Port 9000 / Console 9001'}
                  </div>
                </div>

                <div className="bg-surface/80 p-5 rounded-3xl border border-border space-y-3 shadow-xl">
                  <div className="flex items-center justify-between text-secondary">
                    <span className="text-xs font-bold uppercase">{language === 'vi' ? 'Bộ Nhớ Đệm Redis' : 'Redis Cache'}</span>
                    <Layers className="w-5 h-5 text-warning" />
                  </div>
                  <div className="text-lg font-bold text-heading font-mono">Redis 7 Alpine</div>
                  <div className="text-[11px] text-warning flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-warning" />
                    {language === 'vi' ? 'Cổng 6379 (Sẵn sàng)' : 'Port 6379 (Active)'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal: Edit User VIP Plan & System Role */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-md animate-fadeIn">
          <div className="bg-surface border border-border p-6 md:p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-5 relative text-foreground">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 text-muted hover:text-heading transition-colors p-1 border-0 bg-transparent cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-heading font-display">
                  {language === 'vi' ? 'Quản lý Gói VIP & Quyền Hệ Thống' : 'Manage User VIP Plan'}
                </h3>
                <p className="text-xs text-secondary mt-0.5">{selectedUser.email}</p>
              </div>
            </div>

            {actionError && <div className="p-3 rounded-xl bg-error-muted border border-error/30 text-error text-xs">{actionError}</div>}
            {actionMessage && <div className="p-3 rounded-xl bg-success-muted border border-success/30 text-success text-xs">{actionMessage}</div>}

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-secondary block mb-1.5">{language === 'vi' ? 'Gói VIP Khởi Tạo' : 'VIP Plan'}</label>
                <select
                  value={editPlan}
                  onChange={(e) => setEditPlan(e.target.value)}
                  className="w-full bg-input-bg border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none"
                >
                  <option value="FREE">FREE PLAN ({language === 'vi' ? 'Gói Miễn Phí' : 'Free Tier'})</option>
                  <option value="PRO">PRO PLAN ({language === 'vi' ? 'Gói VIP Pro' : 'Pro VIP Tier'})</option>
                  <option value="ENTERPRISE">ENTERPRISE PLAN ({language === 'vi' ? 'Gói Doanh Nghiệp' : 'Enterprise Tier'})</option>
                </select>
              </div>

              {editPlan !== 'FREE' && (
                <div>
                  <label className="text-xs font-bold text-secondary block mb-1.5">{language === 'vi' ? 'Thời gian hiệu lực (Số ngày)' : 'Validity Days'}</label>
                  <input
                    type="number"
                    value={editDays}
                    onChange={(e) => setEditDays(Number(e.target.value))}
                    placeholder="365"
                    className="w-full bg-input-bg border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-secondary block mb-1.5">{language === 'vi' ? 'Vai trò Hệ Thống (System Role)' : 'System Role'}</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full bg-input-bg border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none"
                >
                  <option value="USER">USER ({language === 'vi' ? 'Người dùng tiêu chuẩn' : 'Standard User'})</option>
                  <option value="ADMIN">ADMIN ({language === 'vi' ? 'Quản trị viên toàn hệ thống' : 'System Administrator'})</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2.5 rounded-xl bg-card hover:bg-card-hover text-secondary text-xs font-semibold border-0 cursor-pointer"
              >
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </button>

              <button
                type="button"
                disabled={actionLoading}
                onClick={handleSaveUserChanges}
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center gap-2 border-0 cursor-pointer shadow-lg shadow-primary/20"
              >
                <Check className="w-4 h-4" />
                {actionLoading 
                  ? (language === 'vi' ? 'Đang lưu...' : 'Saving...') 
                  : (language === 'vi' ? 'Lưu thay đổi' : 'Save Changes')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
