'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import Sidebar from '@/components/Sidebar';
import { Shield, Lock, FileText, ArrowRight, Sparkles } from 'lucide-react';

export default function TermsPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderTermsContent = (showCTA = true) => (
    <>
      {/* Hero Section */}
      <section className="max-w-4xl mx-auto text-center relative z-10 pb-12">
        <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-3.5 py-1.5 rounded-full border border-primary/20">
          Pháp lý & Bảo mật
        </span>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight font-display text-heading mt-6 leading-tight">
          Điều khoản Sử dụng & Chính sách Bảo mật
        </h1>
        <p className="text-secondary text-xs mt-4 max-w-xl mx-auto leading-relaxed">
          Cam kết bảo vệ dữ liệu dự án và quyền riêng tư phân tích của trợ lý trí tuệ nhân tạo.
        </p>
      </section>

      {/* Document content */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 relative z-10 mt-6">
        {/* Sidebar Table of Contents */}
        <aside className="md:col-span-1 space-y-3.5 text-xs font-semibold text-secondary sticky top-28 self-start hidden md:block">
          <div className="text-muted text-[10px] uppercase font-bold tracking-wider mb-2">Mục lục tài liệu</div>
          <a href="#dieu-khoan" className="block hover:text-primary transition-all pb-1 border-l-2 border-border pl-3 active-border-l">1. Điều khoản dịch vụ</a>
          <a href="#quy-rieng-tu" className="block hover:text-primary transition-all pb-1 border-l-2 border-border pl-3">2. Quyền riêng tư dữ liệu</a>
          <a href="#nhat-ky-logs" className="block hover:text-primary transition-all pb-1 border-l-2 border-border pl-3">3. Nhật ký hoạt động logs</a>
          <a href="#bao-mat-ai" className="block hover:text-primary transition-all pb-1 border-l-2 border-border pl-3">4. Dữ liệu phân tích AI</a>
        </aside>

        {/* Text Area */}
        <article className="md:col-span-3 space-y-12 text-secondary text-xs md:text-sm leading-relaxed">
          {/* Section 1 */}
          <section id="dieu-khoan" className="space-y-4 scroll-mt-24">
            <h2 className="text-base font-bold text-heading font-display flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              1. Điều khoản Dịch vụ
            </h2>
            <p>
              Chào mừng bạn đến với **SmartManager v2.0**. Bằng cách truy cập vào trang web của chúng tôi hoặc sử dụng bất kỳ dịch vụ nào,
              bạn đồng ý tuân thủ và chịu sự ràng buộc bởi các điều khoản sử dụng này. Hệ thống được phát triển nhằm mục đích phục vụ quản trị công việc
              cho cá nhân và tổ chức. Mọi hành vi lạm dụng, tấn công mạng hoặc sử dụng sai mục đích đều bị nghiêm cấm.
            </p>
          </section>

          {/* Section 2 */}
          <section id="quy-rieng-tu" className="space-y-4 scroll-mt-24">
            <h2 className="text-base font-bold text-heading font-display flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              2. Quyền riêng tư dữ liệu
            </h2>
            <p>
              Chúng tôi hiểu rằng dữ liệu dự án là tài sản tối mật của bạn. Chúng tôi cam kết bảo mật tuyệt đối các thông tin về:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Thông tin tài khoản đăng nhập (Email được mã hóa, mật khẩu được băm bằng thuật toán BCrypt cường độ cao).</li>
              <li>Danh sách thẻ công việc, mô tả công việc và các checklist liên quan.</li>
              <li>Tập tin đính kèm và các bình luận thảo luận nội bộ.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section id="nhat-ky-logs" className="space-y-4 scroll-mt-24">
            <h2 className="text-base font-bold text-heading font-display flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              3. Nhật ký hoạt động logs
            </h2>
            <p>
              Để phục vụ cho tính năng vẽ biểu đồ hoạt động và lập báo cáo của AI, hệ thống tự động ghi lại lịch sử thao tác của các thành viên trong dự án:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Ghi nhận hành động: Tạo việc, Di chuyển thẻ Kanban, Sửa đổi thông tin, Đặt deadline, hoặc Hoàn thành công việc.</li>
              <li>Dữ liệu log chỉ lưu trữ các thông số cơ bản (Người thực hiện, Loại hành động, Giá trị trước và sau khi thay đổi, Thời gian).</li>
              <li>Lịch sử logs sẽ được lưu giữ tối đa 30 ngày và tự động giải phóng để bảo vệ quyền riêng tư của nhân sự.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section id="bao-mat-ai" className="space-y-4 scroll-mt-24">
            <h2 className="text-base font-bold text-heading font-display flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              4. Dữ liệu phân tích AI
            </h2>
            <p>
              Tính năng Báo cáo tiến độ và Phân rã công việc của trợ lý AI sử dụng dịch vụ thông qua OpenRouter API:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Chúng tôi **không sử dụng** dữ liệu dự án của bạn để huấn luyện (train) bất kỳ mô hình AI công cộng nào.</li>
              <li>Dữ liệu gửi đến AI chỉ bao gồm danh sách tiêu đề công việc và danh sách logs hoạt động ẩn danh trong 24 giờ qua.</li>
              <li>Các yêu cầu này được truyền tải dưới dạng mã hóa đầu cuối và bị xóa ngay lập tức khỏi bộ nhớ đệm của AI sau khi kết thúc phiên phản hồi báo cáo.</li>
            </ul>
          </section>
        </article>
      </div>

      {/* Footer CTA */}
      {showCTA && (
        <section className="max-w-4xl mx-auto px-6 py-12 text-center relative z-10 border-t border-border mt-20">
          <div className="flex flex-col items-center gap-4">
            <p className="text-secondary text-xs">Bạn có bất kỳ thắc mắc nào về pháp lý hoặc chính sách bảo mật?</p>
            <Link href="/contact" className="ui-btn-primary px-5 py-2.5 text-xs flex items-center gap-1.5 shadow-md">
              Liên hệ bộ phận Hỗ trợ <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}
    </>
  );

  // --- RENDERING FOR LOGGED-IN USERS (WITH SIDEBAR) ---
  if (isLoggedIn) {
    return (
      <div className="flex min-h-screen w-full bg-background text-foreground relative font-sans overflow-x-hidden">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] rounded-full glow-orb-primary blur-[140px] pointer-events-none opacity-20" />
        <div className="absolute bottom-0 left-0 w-[50%] h-[50%] rounded-full glow-orb-accent blur-[140px] pointer-events-none opacity-15" />
        
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0 min-h-screen relative z-10 overflow-y-auto px-6 py-8 md:px-12">
          {renderTermsContent(false)}
        </div>
      </div>
    );
  }

  // --- RENDERING FOR GUEST USERS (WITH TOP HEADER) ---
  return (
    <div className="min-h-screen w-full bg-background text-foreground relative overflow-x-hidden font-sans pb-20">
      {/* Background glow orbs */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] rounded-full glow-orb-primary blur-[140px] pointer-events-none opacity-35" />
      <div className="absolute bottom-0 left-0 w-[50%] h-[50%] rounded-full glow-orb-accent blur-[140px] pointer-events-none opacity-25" />

      {/* Navigation bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-header/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
              S
            </div>
            <span className="font-bold text-lg font-display tracking-tight text-heading">SmartManager</span>
          </Link>

          <div className="flex items-center gap-6">
            <Link href="/features" className="text-sm font-semibold text-secondary hover:text-primary transition-all">
              Tính năng
            </Link>
            <Link href="/pricing" className="text-sm font-semibold text-secondary hover:text-primary transition-all">
              Bảng giá
            </Link>
            <Link href="/terms" className="text-sm font-bold text-primary transition-all">
              Điều khoản
            </Link>
            <Link href="/contact" className="text-sm font-semibold text-secondary hover:text-primary transition-all">
              Liên hệ
            </Link>
            <ThemeToggle />
            <Link href="/login" className="text-sm font-semibold text-secondary hover:text-primary transition-all">
              Đăng nhập
            </Link>
          </div>
        </div>
      </header>

      {renderTermsContent(true)}
    </div>
  );
}
