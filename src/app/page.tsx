'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import ThemeToggle from '@/components/ThemeToggle';
import Sidebar from '@/components/Sidebar';
import { useLanguage } from '@/lib/i18n';
import { 
  Plus, Folder, Users, Briefcase, Sparkles, Zap, 
  TrendingUp, MessageSquare, Calendar, ArrowRight, 
  ChevronRight, Shield, Activity, CheckSquare, Search, Building, Clock, ArrowUpRight 
} from 'lucide-react';

interface Workspace {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  createdAt: string;
}

const getWorkspaceGradient = (name: string) => {
  const gradients = [
    'from-violet-600 to-indigo-600 shadow-indigo-500/20',
    'from-blue-600 to-cyan-600 shadow-cyan-500/20',
    'from-emerald-600 to-teal-600 shadow-teal-500/20',
    'from-amber-500 to-orange-600 shadow-orange-500/20',
    'from-rose-600 to-pink-600 shadow-pink-500/20',
    'from-purple-600 to-rose-600 shadow-purple-500/20',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
};

export default function WorkspacesPage() {
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDesc, setNewWorkspaceDesc] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      loadWorkspaces();
    } else {
      setIsLoggedIn(false);
      setLoading(false);
    }
  }, []);

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      const data = await api.workspaces.list();
      setWorkspaces(data || []);
    } catch (err) {
      console.error(err);
      localStorage.clear();
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setModalLoading(true);

    try {
      await api.workspaces.create({
        name: newWorkspaceName,
        description: newWorkspaceDesc,
      });
      setShowModal(false);
      setNewWorkspaceName('');
      setNewWorkspaceDesc('');
      loadWorkspaces();
    } catch (err: any) {
      setModalError(err.message || 'Lỗi khi tạo workspace.');
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // --- RENDERING LANDING PAGE FOR GUEST USERS ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen w-full bg-background text-foreground relative overflow-x-hidden font-sans">
        {/* Background glow orbs */}
        <div className="absolute top-0 right-0 w-[50%] h-[50%] rounded-full glow-orb-primary blur-[140px] pointer-events-none opacity-40" />
        <div className="absolute bottom-0 left-0 w-[50%] h-[50%] rounded-full glow-orb-accent blur-[140px] pointer-events-none opacity-30" />

        {/* Navigation bar */}
        <header className="sticky top-0 z-50 border-b border-border bg-header/80 backdrop-blur-md px-6 py-1 h-20 flex items-center">
          <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <img src="/logo2.png" alt="Logo" style={{ transform: 'scale(1.3)', transformOrigin: 'left center' }} className="h-18 w-auto object-contain" />
            </Link>

            <div className="flex items-center gap-6">
              <Link href="/features" className="text-sm font-semibold text-secondary hover:text-primary transition-all">
                {t('features')}
              </Link>
              <Link href="/pricing" className="text-sm font-semibold text-secondary hover:text-primary transition-all">
                {t('pricing')}
              </Link>
              <Link href="/terms" className="text-sm font-semibold text-secondary hover:text-primary transition-all font-sans">
                {t('terms')}
              </Link>
              <Link href="/contact" className="text-sm font-semibold text-secondary hover:text-primary transition-all">
                {t('contact')}
              </Link>

              {/* Language Selector Pill */}
              <button
                type="button"
                onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface hover:border-primary/40 text-xs font-bold text-heading transition-all shadow-sm"
                title="Đổi ngôn ngữ / Change language"
              >
                <span>{language === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN'}</span>
              </button>

              <ThemeToggle />
              <Link href="/login" className="text-sm font-semibold text-secondary hover:text-primary transition-all">
                {t('login')}
              </Link>
              <Link href="/register" className="ui-btn-primary px-4 py-2 text-sm shadow-md shadow-primary/10">
                {t('startFree')}
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-6 animate-pulse">
            <Sparkles className="h-3.5 w-3.5" />
            {t('heroBadge')}
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tight font-display text-heading leading-[1.1] max-w-4xl mx-auto">
            {t('heroTitlePart1')}<span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{t('heroTitlePart2')}</span>
          </h1>
          
          <p className="text-secondary text-base md:text-lg mt-6 max-w-2xl mx-auto leading-relaxed">
            {t('heroSubtitle')}
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/register" className="ui-btn-primary px-6 py-3.5 text-sm flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
              {t('startFree')} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="ui-btn-secondary px-6 py-3.5 text-sm hover:scale-[1.02] transition-transform">
              {t('loginAccount')}
            </Link>
          </div>

          {/* Interactive Feature Visual Preview */}
          <div className="mt-16 relative mx-auto max-w-4xl glass p-3.5 rounded-3xl border border-border shadow-2xl">
            <div className="rounded-2xl overflow-hidden border border-border bg-surface/50 p-6 text-left">
              <div className="flex items-center justify-between pb-4 border-b border-border-subtle mb-6">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-xs text-muted ml-2">localhost:3000/project/demo-board</span>
                </div>
                <div className="flex gap-2">
                  <span className="w-16 h-4 rounded-md bg-border-subtle" />
                  <span className="w-8 h-4 rounded-md bg-primary/10" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Column 1 */}
                <div className="bg-background/80 p-4 rounded-xl border border-border-subtle">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">Cần thực hiện</span>
                    <span className="text-[10px] bg-surface px-1.5 py-0.5 rounded text-muted">2</span>
                  </div>
                  <div className="space-y-3">
                    <div className="glass p-3 rounded-lg border border-border-subtle shadow-sm">
                      <div className="text-xs font-bold text-title">Thiết kế database hệ thống</div>
                      <div className="text-[10px] text-muted mt-2">Hạn chót: 28/7/2026</div>
                    </div>
                    <div className="glass p-3 rounded-lg border border-border-subtle shadow-sm">
                      <div className="text-xs font-bold text-title">Xây dựng API xác thực JWT</div>
                      <div className="text-[10px] text-muted mt-2">Hạn chót: 30/7/2026</div>
                    </div>
                  </div>
                </div>

                {/* Column 2 */}
                <div className="bg-background/80 p-4 rounded-xl border border-border-subtle">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-500">Đang tiến hành</span>
                    <span className="text-[10px] bg-surface px-1.5 py-0.5 rounded text-muted">1</span>
                  </div>
                  <div className="glass p-3 rounded-lg border border-primary/20 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-1 h-full bg-primary" />
                    <div className="text-xs font-bold text-title">Ghép giao diện Kanban Board</div>
                    <div className="text-[10px] text-primary font-semibold mt-2 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 animate-pulse" /> AI đang phân tích
                    </div>
                  </div>
                </div>

                {/* Column 3 */}
                <div className="bg-background/80 p-4 rounded-xl border border-border-subtle">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">Hoàn thành</span>
                    <span className="text-[10px] bg-surface px-1.5 py-0.5 rounded text-muted">1</span>
                  </div>
                  <div className="glass p-3 rounded-lg border border-border-subtle opacity-75 shadow-sm">
                    <div className="text-xs font-bold text-title line-through text-muted">Khởi tạo khung xương dự án</div>
                    <div className="text-[10px] text-emerald-500 font-bold mt-2">Đã xong</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Key Features Grid */}
        <section className="max-w-6xl mx-auto px-6 py-20 border-t border-border/80 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight font-display text-heading">Các tính năng đột phá</h2>
            <p className="text-secondary text-sm mt-2 max-w-xl mx-auto">
              Được trang bị những công nghệ hiện đại giúp tối ưu hóa hiệu năng và tăng hiệu suất làm việc nhóm
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="glass p-8 rounded-2xl border border-border hover:border-primary/20 transition-all group">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-title mb-2">Bảng Kanban Realtime</h3>
              <p className="text-secondary text-sm leading-relaxed">
                Tương tác kéo thả thẻ công việc mượt mà và đồng bộ ngay lập tức cho tất cả thành viên trong nhóm qua giao thức WebSockets.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass p-8 rounded-2xl border border-border hover:border-primary/20 transition-all group">
              <div className="h-10 w-10 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-title mb-2">Báo cáo & Biểu đồ AI</h3>
              <p className="text-secondary text-sm leading-relaxed">
                Trợ lý AI phân tích nhật ký hoạt động dự án trong 24 giờ qua để vẽ biểu đồ thống kê thực tế và đưa ra các đề xuất cải tiến sâu sắc.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass p-8 rounded-2xl border border-border hover:border-primary/20 transition-all group">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <CheckSquare className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-title mb-2">AI Phân rã Công việc</h3>
              <p className="text-secondary text-sm leading-relaxed">
                Giải quyết các việc lớn dễ dàng nhờ AI tự động bóc tách và tạo lập danh sách các công việc con (subtasks) thực thi chi tiết.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="glass p-8 rounded-2xl border border-border hover:border-primary/20 transition-all group">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-title mb-2">Không gian cộng tác</h3>
              <p className="text-secondary text-sm leading-relaxed">
                Tạo lập nhiều Workspace khác nhau, quản lý thành viên, phân quyền vai trò (Admin/Member) và gán trách nhiệm rõ ràng.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="glass p-8 rounded-2xl border border-border hover:border-primary/20 transition-all group">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-title mb-2">Thảo luận thời gian thực</h3>
              <p className="text-secondary text-sm leading-relaxed">
                Trò chuyện, góp ý và phản hồi ngay dưới thẻ công việc giúp tập trung luồng thông tin và giải quyết vướng mắc nhanh chóng.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="glass p-8 rounded-2xl border border-border hover:border-primary/20 transition-all group">
              <div className="h-10 w-10 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-title mb-2">Giao diện Đen / Sáng</h3>
              <p className="text-secondary text-sm leading-relaxed">
                Trải nghiệm mượt mà với Dark/Light Mode chuyển đổi tức thì, kết hợp các tông màu dịu mắt để bảo vệ thị lực của bạn.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Footer Section */}
        <section className="max-w-5xl mx-auto px-6 py-20 text-center relative z-10">
          <div className="glass p-12 rounded-3xl border border-border shadow-xl bg-gradient-to-b from-surface/50 to-surface/20">
            <h2 className="text-3xl font-bold tracking-tight font-display text-heading mb-4">
              Sẵn sàng tối ưu hóa quy trình làm việc?
            </h2>
            <p className="text-secondary text-sm max-w-lg mx-auto mb-8">
              Bắt đầu tạo không gian làm việc cho doanh nghiệp hoặc cá nhân bạn chỉ trong chưa đầy 1 phút. Hoàn toàn miễn phí.
            </p>
            <Link href="/register" className="ui-btn-primary px-8 py-3.5 text-sm inline-flex items-center gap-2 hover:scale-[1.02] transition-transform">
              Đăng ký tài khoản ngay <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          
          {/* Sitemap Footer Links */}
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-xs text-secondary mt-12 mb-6">
            <Link href="/features" className="hover:text-primary transition-all font-medium">Tính năng chi tiết</Link>
            <Link href="/pricing" className="hover:text-primary transition-all font-medium">Gói dịch vụ & Bảng giá</Link>
            <Link href="/contact" className="hover:text-primary transition-all font-medium">Liên hệ hỗ trợ</Link>
            <Link href="/terms" className="hover:text-primary transition-all font-medium font-sans">Điều khoản & Bảo mật</Link>
          </div>

          <div className="text-center text-[10px] text-muted">
            © 2026 Homix v2.0. Hệ thống quản lý công việc và tiến độ dự án thông minh.
          </div>
        </section>
      </div>
    );
  }

  // --- RENDERING WORKSPACES PAGE FOR LOGGED IN USERS ---
  const filteredWorkspaces = workspaces.filter(
    (ws) =>
      ws.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ws.description && ws.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex h-screen w-full bg-background text-foreground relative font-sans overflow-hidden">
      <div className="absolute top-0 right-0 w-[40%] h-[40%] rounded-full glow-orb-primary blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] rounded-full glow-orb-accent blur-[140px] pointer-events-none" />

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 h-screen relative z-10 overflow-y-auto">
        <main className="max-w-6xl w-full mx-auto px-6 mt-10 pb-12">
          {/* Header Banner */}
          <div className="glass p-6 md:p-8 rounded-3xl border border-border shadow-xl mb-8 relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Homix v2.0 Workspace Hub
                  </span>
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> {workspaces.length} Không gian
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight font-display text-heading">
                  Không Gian Làm Việc Của Bạn
                </h2>
                <p className="text-secondary text-xs md:text-sm mt-1 max-w-lg leading-relaxed">
                  Lựa chọn không gian làm việc để truy cập danh sách dự án, bảng Kanban và báo cáo tiến độ AI
                </p>
              </div>

              <button
                onClick={() => setShowModal(true)}
                className="ui-btn-primary flex items-center gap-2 px-5 py-3 text-xs font-bold shadow-xl hover:scale-[1.02] transition-transform shrink-0"
              >
                <Plus className="h-4 w-4" />
                Tạo Workspace Mới
              </button>
            </div>

            {/* Live Search Bar */}
            {workspaces.length > 0 && (
              <div className="mt-6 pt-6 border-t border-border-subtle flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm kiếm không gian làm việc theo tên hoặc mô tả..."
                    className="ui-input pl-10 pr-4 py-2 text-xs font-medium w-full"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-foreground"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <span className="text-xs text-muted font-medium hidden sm:inline">
                  Hiển thị {filteredWorkspaces.length}/{workspaces.length} kết quả
                </span>
              </div>
            )}
          </div>

          {workspaces.length === 0 ? (
            <div className="glass rounded-3xl p-12 text-center border border-border max-w-md mx-auto mt-12 shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 border border-primary/20">
                <Briefcase className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-heading">Chưa có Workspace nào</h3>
              <p className="text-secondary text-xs leading-relaxed mb-6">
                Bạn chưa tham gia không gian làm việc nào. Hãy tạo mới ngay để quản lý dự án!
              </p>
              <button onClick={() => setShowModal(true)} className="ui-btn-primary px-6 py-2.5 text-xs font-bold">
                + Tạo Workspace đầu tiên
              </button>
            </div>
          ) : filteredWorkspaces.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center border border-border max-w-md mx-auto mt-8">
              <Search className="h-8 w-8 text-muted mx-auto mb-2" />
              <h4 className="text-sm font-bold text-heading">Không tìm thấy kết quả phù hợp</h4>
              <p className="text-secondary text-xs mt-1 mb-4">Không tìm thấy Workspace nào khớp với "{searchTerm}"</p>
              <button onClick={() => setSearchTerm('')} className="ui-btn-secondary px-3.5 py-1.5 text-xs">
                Xóa từ khóa tìm kiếm
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWorkspaces.map((ws) => {
                const gradient = getWorkspaceGradient(ws.name);
                const firstChar = ws.name.charAt(0).toUpperCase();

                return (
                  <Link key={ws.id} href={`/workspace/${ws.id}`}>
                    <div className="glass hover:border-primary/50 p-6 rounded-2xl transition-all cursor-pointer group hover:-translate-y-1 flex flex-col justify-between h-[200px] border border-border shadow-sm hover:shadow-2xl relative overflow-hidden">
                      {/* Top Accent line on hover */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity" />

                      <div>
                        <div className="flex items-center gap-3">
                          {/* Gradient Avatar Icon */}
                          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center font-black text-white text-base shadow-md uppercase shrink-0`}>
                            {firstChar}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h3 className="font-bold text-base group-hover:text-primary transition-colors text-title truncate font-display">
                                {ws.name}
                              </h3>
                            </div>
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-secondary bg-surface px-2 py-0.5 rounded-full border border-border mt-0.5">
                              <Building className="w-3 h-3 text-primary" /> Workspace
                            </span>
                          </div>
                        </div>

                        {/* Fixed height description guarantees 100% equal card height */}
                        <p className="text-secondary text-xs mt-3.5 h-10 leading-relaxed line-clamp-2 overflow-hidden">
                          {ws.description || 'Chưa có mô tả chi tiết cho không gian làm việc này.'}
                        </p>
                      </div>

                      {/* Footer Info & Action */}
                      <div className="flex items-center justify-between text-xs text-muted pt-3 border-t border-border-subtle mt-auto">
                        <span className="flex items-center gap-1 text-secondary group-hover:text-primary font-bold text-xs transition-colors">
                          Vào Workspace <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-muted">
                          <Clock className="h-3 w-3" />
                          {new Date(ws.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </main>

      {showModal && (
        <div className="ui-modal-overlay">
          <div className="w-full max-w-md glass p-8 rounded-2xl relative">
            <h3 className="text-xl font-bold mb-6 font-display text-heading">Tạo Workspace mới</h3>

            {modalError && <div className="ui-alert-error mb-4 text-sm">{modalError}</div>}

            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="ui-label tracking-wider">Tên Workspace</label>
                <input
                  type="text"
                  required
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  placeholder="Ví dụ: Team Marketing, Project Alpha..."
                  className="ui-input px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="ui-label tracking-wider">Mô tả chi tiết</label>
                <textarea
                  value={newWorkspaceDesc}
                  onChange={(e) => setNewWorkspaceDesc(e.target.value)}
                  placeholder="Tóm tắt mục tiêu hoặc phòng ban tham gia..."
                  rows={3}
                  className="ui-input px-4 py-2.5 text-sm resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="ui-btn-secondary px-4 py-2 text-sm">
                  Hủy
                </button>
                <button type="submit" disabled={modalLoading} className="ui-btn-primary px-5 py-2 text-sm">
                  {modalLoading ? 'Đang tạo...' : 'Tạo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
