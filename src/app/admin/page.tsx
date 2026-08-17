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
  LogOut, Home, ArrowUpRight, BarChart3, Settings, Bell
} from 'lucide-react';

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
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-400 mx-auto"></div>
          <p className="text-xs text-slate-400 font-mono">Loading Homix Admin Console...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin || accessError) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-slate-200 p-4 font-sans relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="glass p-8 rounded-3xl border border-rose-500/30 max-w-md w-full text-center space-y-5 relative z-10 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto shadow-lg">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-white mb-2">
              {language === 'vi' ? 'Quyền truy cập bị từ chối' : 'Access Denied'}
            </h2>
            <p className="text-slate-400 text-xs leading-relaxed">
              {accessError || (language === 'vi' ? 'Bạn cần tài khoản Admin Hệ Thống để truy cập trang quản trị này.' : 'You need System Admin credentials to access this portal.')}
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer border border-slate-700"
          >
            {language === 'vi' ? 'Quay lại Trang Chủ Platform' : 'Return to Home Platform'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Background Decorative Ambient Orbs */}
      <div className="absolute top-0 right-0 w-[60%] h-[50%] rounded-full bg-indigo-900/20 blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[50%] h-[40%] rounded-full bg-amber-900/15 blur-[160px] pointer-events-none" />

      {/* ========================================================================= */}
      {/* 1. DEDICATED SYSTEM ADMIN SIDEBAR */}
      {/* ========================================================================= */}
      <aside className="w-64 h-screen bg-slate-900/90 backdrop-blur-xl border-r border-slate-800 flex flex-col justify-between shrink-0 z-30 select-none">
        <div>
          {/* Admin Portal Brand Header */}
          <div className="p-5 border-b border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 p-0.5 shadow-lg shrink-0">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-black font-display text-sm tracking-wide text-white">HOMIX ADMIN</h1>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">PRO</span>
              </div>
              <p className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                System Online
              </p>
            </div>
          </div>

          {/* System Navigation Menu */}
          <div className="p-4 space-y-1.5">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
              {language === 'vi' ? 'Quản Trị Hệ Thống' : 'System Console'}
            </div>

            <button
              onClick={() => setActiveSection('OVERVIEW')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border-0 cursor-pointer text-left ${
                activeSection === 'OVERVIEW'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-md'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-4.5 h-4.5 shrink-0" />
              <span>{language === 'vi' ? 'Tổng Quan & Doanh Thu' : 'Overview & Revenue'}</span>
            </button>

            <button
              onClick={() => setActiveSection('USERS')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border-0 cursor-pointer text-left ${
                activeSection === 'USERS'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-md'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4.5 h-4.5 shrink-0" />
                <span>{language === 'vi' ? 'Quản Lý Người Dùng' : 'Users Directory'}</span>
              </div>
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-300 font-mono">
                {usersList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSection('PAYMENTS')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border-0 cursor-pointer text-left ${
                activeSection === 'PAYMENTS'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-md'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-4.5 h-4.5 shrink-0" />
                <span>{language === 'vi' ? 'Nhật Ký Đơn Hàng' : 'Payment Orders Audit'}</span>
              </div>
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-300 font-mono">
                {paymentsList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSection('SYSTEM')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border-0 cursor-pointer text-left ${
                activeSection === 'SYSTEM'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-md'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Server className="w-4.5 h-4.5 shrink-0" />
              <span>{language === 'vi' ? 'Hạ Tầng & Server' : 'Infrastructure & Server'}</span>
            </button>
          </div>
        </div>

        {/* Admin Sidebar Bottom Controls */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          {/* Admin User Card */}
          <div className="p-3 rounded-2xl bg-slate-850 border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
              {currentUser?.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{currentUser?.fullname?.charAt(0).toUpperCase() || 'A'}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-xs text-white truncate">{currentUser?.fullname}</div>
              <div className="text-[10px] text-slate-400 truncate">{currentUser?.email}</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-1.5 pt-1">
            <Link
              href="/"
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 no-underline transition-all border border-slate-700"
            >
              <Home className="w-3.5 h-3.5 text-primary" />
              <span>{language === 'vi' ? 'Về Nền Tảng Người Dùng' : 'Back to User Platform'}</span>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full py-2 px-3 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer border border-rose-500/20"
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
        <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">CONSOLE /</span>
            <h2 className="text-sm font-bold font-display text-white uppercase tracking-wider">
              {activeSection === 'OVERVIEW' && (language === 'vi' ? 'Tổng Quan Báo Cáo Doanh Thu' : 'Revenue & Metrics Overview')}
              {activeSection === 'USERS' && (language === 'vi' ? 'Quản Lý Người Dùng & Gói VIP' : 'User Management & VIP Access')}
              {activeSection === 'PAYMENTS' && (language === 'vi' ? 'Nhật Ký Đơn Hàng Thanh Toán' : 'All Payment Transactions Log')}
              {activeSection === 'SYSTEM' && (language === 'vi' ? 'Trạng Thái Hạ Tầng Server' : 'Infrastructure & Server Status')}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
              className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:border-amber-500/40 text-xs font-bold text-slate-200 transition-all cursor-pointer"
            >
              <span>{language === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN'}</span>
            </button>

            <button
              onClick={checkAdminAndLoadData}
              className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:border-amber-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Refresh console data"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
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
                <div className="p-5 rounded-3xl bg-slate-900/80 border border-emerald-500/30 relative overflow-hidden shadow-xl">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">{language === 'vi' ? 'Tổng Doanh Thu' : 'Total Revenue'}</span>
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="text-2xl lg:text-3xl font-black font-mono text-emerald-400">
                    {Number(stats?.totalRevenue || 0).toLocaleString('vi-VN')} <span className="text-xs font-normal">VNĐ</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between pt-2 border-t border-slate-800">
                    <span>{language === 'vi' ? 'Giao dịch thành công:' : 'Completed orders:'}</span>
                    <strong className="text-white font-mono">{stats?.totalOrders || 0}</strong>
                  </div>
                </div>

                {/* Master Card 2: Total Users */}
                <div className="p-5 rounded-3xl bg-slate-900/80 border border-indigo-500/30 relative overflow-hidden shadow-xl">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">{language === 'vi' ? 'Tổng Người Dùng' : 'Total System Users'}</span>
                    <Users className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="text-2xl lg:text-3xl font-black font-display text-white">
                    {stats?.totalUsers || 0}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between pt-2 border-t border-slate-800">
                    <span>Pro / Enterprise:</span>
                    <strong className="text-amber-400 font-mono">{stats?.proUsers || 0} Pro / {stats?.enterpriseUsers || 0} Ent</strong>
                  </div>
                </div>

                {/* Master Card 3: Workspaces & Projects */}
                <div className="p-5 rounded-3xl bg-slate-900/80 border border-cyan-500/30 relative overflow-hidden shadow-xl">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">{language === 'vi' ? 'Workspace & Dự Án' : 'Workspaces & Projects'}</span>
                    <Briefcase className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="text-2xl lg:text-3xl font-black font-display text-white">
                    {stats?.totalWorkspaces || 0} <span className="text-slate-500 text-lg font-normal">/ {stats?.totalProjects || 0}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between pt-2 border-t border-slate-800">
                    <span>{language === 'vi' ? 'Dự án đang hoạt động:' : 'Active projects:'}</span>
                    <strong className="text-cyan-400 font-mono">{stats?.totalProjects || 0}</strong>
                  </div>
                </div>

                {/* Master Card 4: Total Transactions */}
                <div className="p-5 rounded-3xl bg-slate-900/80 border border-amber-500/30 relative overflow-hidden shadow-xl">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">{language === 'vi' ? 'Đơn Hàng Thanh Toán' : 'Total Orders Log'}</span>
                    <CreditCard className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="text-2xl lg:text-3xl font-black font-display text-white">
                    {stats?.totalOrders || 0}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between pt-2 border-t border-slate-800">
                    <span>Cổng VNPay & PayPal</span>
                    <strong className="text-amber-400 font-mono">100% Verified</strong>
                  </div>
                </div>
              </div>

              {/* Recent System Activity Stream Table */}
              <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                      {language === 'vi' ? 'Nhật Ký Thanh Toán Gần Đây Toàn Hệ Thống' : 'Recent System Payment Log'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Top 10 giao dịch mới nhất nhận từ các cổng thanh toán</p>
                  </div>

                  <button
                    onClick={() => setActiveSection('PAYMENTS')}
                    className="text-xs text-amber-400 font-bold hover:underline flex items-center gap-1 border-0 bg-transparent cursor-pointer"
                  >
                    <span>{language === 'vi' ? 'Xem tất cả đơn hàng ➔' : 'View all transactions ➔'}</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                        <th className="py-3 px-3">Mã đơn hàng</th>
                        <th className="py-3 px-3">Mã User ID</th>
                        <th className="py-3 px-3">Gói dịch vụ</th>
                        <th className="py-3 px-3">Cổng thanh toán</th>
                        <th className="py-3 px-3">Số tiền (VNĐ)</th>
                        <th className="py-3 px-3">Thời gian</th>
                        <th className="py-3 px-3 text-right">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {(stats?.recentOrders || []).map((order: any) => (
                        <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-amber-400">{order.transactionId}</td>
                          <td className="py-3 px-3 font-mono text-slate-400 truncate max-w-[140px]">{order.userId}</td>
                          <td className="py-3 px-3 font-bold text-white">{order.planType}</td>
                          <td className="py-3 px-3 font-semibold">{order.paymentMethod}</td>
                          <td className="py-3 px-3 font-mono font-bold text-white">
                            {Number(order.amount).toLocaleString('vi-VN')} VNĐ
                          </td>
                          <td className="py-3 px-3 text-slate-400">{formatDate(order.createdAt)}</td>
                          <td className="py-3 px-3 text-right">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                              order.status === 'COMPLETED'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
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

          {/* SECTION 2: USER MANAGEMENT */}
          {activeSection === 'USERS' && (
            <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 space-y-5 shadow-xl">
              {/* Search & Filter Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="relative w-full sm:w-80">
                  <input
                    type="text"
                    value={searchUserQuery}
                    onChange={(e) => setSearchUserQuery(e.target.value)}
                    placeholder={language === 'vi' ? 'Tìm theo Tên hoặc Email người dùng...' : 'Search by user name or email...'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white pl-10 focus:outline-none focus:border-amber-500/50"
                  />
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <select
                    value={planFilter}
                    onChange={(e) => setPlanFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
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
                    <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                      <th className="py-3.5 px-3">Người dùng</th>
                      <th className="py-3.5 px-3">Email</th>
                      <th className="py-3.5 px-3">Gói VIP hiện tại</th>
                      <th className="py-3.5 px-3">Hạn sử dụng</th>
                      <th className="py-3.5 px-3">Vai trò Hệ thống</th>
                      <th className="py-3.5 px-3">Ngày gia nhập</th>
                      <th className="py-3.5 px-3 text-right">Quản lý</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-3 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 text-amber-400 font-bold flex items-center justify-center text-xs overflow-hidden shrink-0">
                            {u.avatarUrl ? (
                              <img src={u.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <span>{u.fullname?.charAt(0).toUpperCase() || 'U'}</span>
                            )}
                          </div>
                          <span className="font-bold text-white">{u.fullname}</span>
                        </td>
                        <td className="py-3.5 px-3 font-mono text-slate-400">{u.email}</td>
                        <td className="py-3.5 px-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            u.subscriptionPlan === 'ENTERPRISE' ? 'bg-purple-500/15 text-purple-400 border-purple-500/30' :
                            u.subscriptionPlan === 'PRO' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                            'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {u.subscriptionPlan || 'FREE'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-slate-400">{formatDate(u.subscriptionExpiresAt)}</td>
                        <td className="py-3.5 px-3">
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                            u.systemRole === 'ADMIN' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-slate-400'
                          }`}>
                            {u.systemRole || 'USER'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-slate-400">{formatDate(u.createdAt)}</td>
                        <td className="py-3.5 px-3 text-right">
                          <button
                            onClick={() => handleOpenEditUser(u)}
                            className="px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-400 hover:bg-amber-500 hover:text-black transition-all text-xs font-bold flex items-center gap-1.5 ml-auto cursor-pointer border border-amber-500/30"
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
            <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 space-y-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-400" />
                  {language === 'vi' ? 'Nhật Ký Tất Cả Giao Dịch Thanh Toán' : 'All Payment Transactions Audit Log'}
                </h3>

                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="ALL">{language === 'vi' ? 'Tất cả phương thức' : 'All Methods'}</option>
                  <option value="VNPAY">Cổng VNPay</option>
                  <option value="PAYPAL">Cổng PayPal</option>
                  <option value="COMPLETED">Trạng thái Thành Công (COMPLETED)</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                      <th className="py-3.5 px-3">Mã giao dịch</th>
                      <th className="py-3.5 px-3">Mã User ID</th>
                      <th className="py-3.5 px-3">Gói nâng cấp</th>
                      <th className="py-3.5 px-3">Chu kỳ</th>
                      <th className="py-3.5 px-3">Phương thức</th>
                      <th className="py-3.5 px-3">Số tiền</th>
                      <th className="py-3.5 px-3">Thời gian tạo</th>
                      <th className="py-3.5 px-3 text-right">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-3 font-mono font-bold text-amber-400">{p.transactionId}</td>
                        <td className="py-3.5 px-3 font-mono text-slate-400 truncate max-w-[140px]">{p.userId}</td>
                        <td className="py-3.5 px-3 font-bold text-white">{p.planType}</td>
                        <td className="py-3.5 px-3 uppercase text-[11px]">{p.billingCycle}</td>
                        <td className="py-3.5 px-3 font-semibold">{p.paymentMethod}</td>
                        <td className="py-3.5 px-3 font-mono font-bold text-white">
                          {Number(p.amount).toLocaleString('vi-VN')} VNĐ
                        </td>
                        <td className="py-3.5 px-3 text-slate-400">{formatDate(p.createdAt)}</td>
                        <td className="py-3.5 px-3 text-right">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                            p.status === 'COMPLETED'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
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

          {/* SECTION 4: INFRASTRUCTURE & SERVER MONITOR */}
          {activeSection === 'SYSTEM' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="bg-slate-900/80 p-5 rounded-3xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-bold uppercase">Backend API Service</span>
                    <Server className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="text-lg font-bold text-white font-mono">Spring Boot 3.x</div>
                  <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Running on Port 8000
                  </div>
                </div>

                <div className="bg-slate-900/80 p-5 rounded-3xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-bold uppercase">Database RDBMS</span>
                    <Database className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="text-lg font-bold text-white font-mono">PostgreSQL 15</div>
                  <div className="text-[11px] text-cyan-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    Port 5433 (Healthy)
                  </div>
                </div>

                <div className="bg-slate-900/80 p-5 rounded-3xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-bold uppercase">Object Storage</span>
                    <HardDrive className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="text-lg font-bold text-white font-mono">MinIO Storage</div>
                  <div className="text-[11px] text-purple-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    Port 9000 / Console 9001
                  </div>
                </div>

                <div className="bg-slate-900/80 p-5 rounded-3xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-bold uppercase">Redis Cache</span>
                    <Layers className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="text-lg font-bold text-white font-mono">Redis 7 Alpine</div>
                  <div className="text-[11px] text-amber-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    Port 6379 (Active)
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal: Edit User VIP Plan & System Role */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 p-6 md:p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-5 relative text-slate-100">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1 border-0 bg-transparent cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white font-display">
                  {language === 'vi' ? 'Quản lý Gói VIP & Quyền Hệ Thống' : 'Manage User VIP Plan'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{selectedUser.email}</p>
              </div>
            </div>

            {actionError && <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs">{actionError}</div>}
            {actionMessage && <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs">{actionMessage}</div>}

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">{language === 'vi' ? 'Gói VIP Khởi Tạo' : 'VIP Plan'}</label>
                <select
                  value={editPlan}
                  onChange={(e) => setEditPlan(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                >
                  <option value="FREE">FREE PLAN (Gói Miễn Phí)</option>
                  <option value="PRO">PRO PLAN (VIP Pro)</option>
                  <option value="ENTERPRISE">ENTERPRISE PLAN (VIP Doanh Nghiệp)</option>
                </select>
              </div>

              {editPlan !== 'FREE' && (
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">{language === 'vi' ? 'Thời gian hiệu lực (Số ngày)' : 'Validity Days'}</label>
                  <input
                    type="number"
                    value={editDays}
                    onChange={(e) => setEditDays(Number(e.target.value))}
                    placeholder="365"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">{language === 'vi' ? 'Vai trò Hệ Thống (System Role)' : 'System Role'}</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                >
                  <option value="USER">USER (Người dùng tiêu chuẩn)</option>
                  <option value="ADMIN">ADMIN (Quản trị viên toàn hệ thống)</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border-0 cursor-pointer"
              >
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </button>

              <button
                type="button"
                disabled={actionLoading}
                onClick={handleSaveUserChanges}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-2 border-0 cursor-pointer shadow-lg shadow-amber-500/20"
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
