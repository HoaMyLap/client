'use client';

import React from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { 
  ArrowLeft, Sparkles, Zap, TrendingUp, CheckSquare, 
  MessageSquare, Calendar, Shield, Users, ArrowRight 
} from 'lucide-react';

export default function FeaturesPage() {
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
            <Link href="/features" className="text-sm font-bold text-primary transition-all">
              Tính năng
            </Link>
            <Link href="/pricing" className="text-sm font-semibold text-secondary hover:text-primary transition-all">
              Bảng giá
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

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center relative z-10">
        <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-3.5 py-1.5 rounded-full border border-primary/20">
          Khám phá Công nghệ
        </span>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight font-display text-heading mt-6 leading-tight">
          Tính năng được tối ưu hóa bằng <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Trí tuệ Nhân tạo</span>
        </h1>
        <p className="text-secondary text-sm md:text-base mt-4 max-w-xl mx-auto leading-relaxed">
          Chúng tôi mang đến bộ công cụ đột phá kết hợp giữa tốc độ truyền tải thời gian thực và sức mạnh phân tích chuyên sâu của AI.
        </p>
      </section>

      {/* Detailed Features Flow */}
      <main className="max-w-5xl mx-auto px-6 space-y-24 relative z-10 mt-10">
        {/* Feature 1: Realtime Kanban */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 text-primary font-bold text-sm bg-primary/10 px-3.5 py-1.5 rounded-xl">
              <Zap className="h-4.5 w-4.5" />
              Công nghệ WebSockets Stomp
            </div>
            <h2 className="text-2xl md:text-3xl font-bold font-display text-heading leading-tight">
              Bảng Kanban Realtime Không Độ Trễ
            </h2>
            <p className="text-secondary text-sm leading-relaxed">
              Không cần tải lại trang. Bất cứ khi nào thành viên trong nhóm kéo thả thẻ, thay đổi mức độ ưu tiên,
              hoặc thêm bình luận mới, thông tin sẽ được cập nhật tức thời cho tất cả mọi người thông qua kênh truyền WebSocket bảo mật.
            </p>
            <ul className="space-y-3.5 text-sm text-secondary">
              <li className="flex items-center gap-2.5">
                <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">✓</div>
                <span>Tự động khóa thẻ khi có người đang kéo thả.</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">✓</div>
                <span>Hiển thị thông báo tức thời (Live Notifications).</span>
              </li>
            </ul>
          </div>
          
          <div className="glass p-6 rounded-2xl border border-border shadow-lg relative overflow-hidden bg-gradient-to-tr from-surface/30 to-surface/10">
            {/* Visual simulation */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                <span className="text-xs font-bold text-muted uppercase">Sơ đồ đồng bộ Kanban</span>
                <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold">Active Connection</span>
              </div>
              <div className="flex justify-between items-center gap-2 py-4">
                <div className="glass px-3 py-2 rounded-lg border border-border text-center text-[10px] w-28">
                  <div className="font-bold text-title">Thành viên A</div>
                  <div className="text-muted mt-1 text-[9px]">Kéo thả thẻ</div>
                </div>
                <div className="flex-1 h-0.5 border-t-2 border-dashed border-primary relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-[8px] font-bold px-1.5 py-0.5 rounded animate-pulse">
                    WebSockets
                  </div>
                </div>
                <div className="glass px-3 py-2 rounded-lg border border-primary/30 text-center text-[10px] w-28 bg-primary/5">
                  <div className="font-bold text-primary">Thành viên B</div>
                  <div className="text-primary mt-1 text-[9px] font-semibold">Tự động Cập nhật</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2: AI Report */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center md:flex-row-reverse">
          <div className="md:order-2 space-y-5">
            <div className="inline-flex items-center gap-2 text-violet-500 font-bold text-sm bg-violet-500/10 px-3.5 py-1.5 rounded-xl">
              <Sparkles className="h-4.5 w-4.5 animate-pulse" />
              Trí tuệ Nhân tạo (OpenRouter API)
            </div>
            <h2 className="text-2xl md:text-3xl font-bold font-display text-heading leading-tight">
              Lập Báo Cáo & Dựng Biểu Đồ AI
            </h2>
            <p className="text-secondary text-sm leading-relaxed">
              Trợ lý AI sẽ tự động phân tích tất cả các công việc hiện tại, đi kèm với nhật ký logs hoạt động 24h qua.
              Chỉ với một click, AI sẽ trả về báo cáo tiến độ chi tiết, đi kèm việc tự động vẽ biểu đồ thống kê thực tế
              (Biểu đồ cột, biểu đồ tròn, biểu đồ đường) trực quan.
            </p>
            <ul className="space-y-3.5 text-sm text-secondary">
              <li className="flex items-center gap-2.5">
                <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">✓</div>
                <span>Phân tích rủi ro tiềm ẩn của dự án.</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">✓</div>
                <span>Tự động xuất file in ấn hoặc PDF xuất sắc.</span>
              </li>
            </ul>
          </div>

          <div className="md:order-1 glass p-6 rounded-2xl border border-border shadow-lg bg-gradient-to-bl from-surface/30 to-surface/10">
            {/* Visual simulation of chart */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-title border-b border-border-subtle pb-3">
                <TrendingUp className="w-4 h-4 text-violet-400" />
                Dữ liệu phân tích tiến độ
              </div>
              <div className="flex items-end justify-between h-32 pt-4 px-2">
                <div className="flex flex-col items-center gap-1.5 w-8">
                  <div className="w-full bg-primary/20 hover:bg-primary/30 transition-all rounded-t-md h-12" />
                  <span className="text-[9px] text-muted">T.Hai</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 w-8">
                  <div className="w-full bg-primary/20 hover:bg-primary/30 transition-all rounded-t-md h-16" />
                  <span className="text-[9px] text-muted">T.Ba</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 w-8">
                  <div className="w-full bg-primary/40 hover:bg-primary/50 transition-all rounded-t-md h-24" />
                  <span className="text-[9px] text-muted">T.Tư</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 w-8">
                  <div className="w-full bg-primary/60 hover:bg-primary/70 transition-all rounded-t-md h-20" />
                  <span className="text-[9px] text-muted">T.Năm</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 w-8">
                  <div className="w-full bg-gradient-to-t from-primary to-accent rounded-t-md h-28" />
                  <span className="text-[9px] text-muted font-bold text-primary">H.Nay</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 3: AI Subtasks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 text-emerald-500 font-bold text-sm bg-emerald-500/10 px-3.5 py-1.5 rounded-xl">
              <CheckSquare className="h-4.5 w-4.5" />
              Phân rã việc thông minh
            </div>
            <h2 className="text-2xl md:text-3xl font-bold font-display text-heading leading-tight">
              AI Tự Động Phân Rã Việc Nhỏ
            </h2>
            <p className="text-secondary text-sm leading-relaxed">
              Bạn gặp một nhiệm vụ phức tạp và không biết bắt đầu từ đâu? Hãy để AI giúp bạn.
              Nút phân tách AI sẽ tự động phân rã thẻ công việc lớn thành tối đa 5 bước công việc con chi tiết
              với mô tả thực tế, giúp bạn giảm tải áp lực tinh thần và hoàn thành việc nhanh hơn.
            </p>
            <ul className="space-y-3.5 text-sm text-secondary">
              <li className="flex items-center gap-2.5">
                <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">✓</div>
                <span>Khởi tạo trực tiếp vào checklist của thẻ.</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">✓</div>
                <span>Thành viên có thể tick chọn hoàn thành từng phần dễ dàng.</span>
              </li>
            </ul>
          </div>

          <div className="glass p-6 rounded-2xl border border-border shadow-lg bg-gradient-to-tr from-surface/30 to-surface/10">
            {/* Visual simulation of checklist */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-4">
                <span className="text-xs font-bold text-title">Công việc lớn: Ghép cổng API</span>
                <span className="text-[9px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">Phân rã bởi AI</span>
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center gap-3 text-xs text-secondary opacity-75">
                  <div className="w-4 h-4 rounded border border-emerald-500 bg-emerald-500/20 flex items-center justify-center text-emerald-500 text-[10px] font-bold">✓</div>
                  <span className="line-through">Bước 1: Nghiên cứu tài liệu kết nối API</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-secondary">
                  <div className="w-4 h-4 rounded border border-emerald-500 bg-emerald-500/20 flex items-center justify-center text-emerald-500 text-[10px] font-bold">✓</div>
                  <span className="line-through">Bước 2: Viết hàm config Header & Token</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-title">
                  <div className="w-4 h-4 rounded border border-border shrink-0" />
                  <span>Bước 3: Thực hiện gọi hàm thử nghiệm và handle lỗi</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-title">
                  <div className="w-4 h-4 rounded border border-border shrink-0" />
                  <span>Bước 4: Viết unit tests kiểm thử các mã trạng thái</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Call to action */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center relative z-10 border-t border-border mt-20">
        <h2 className="text-2xl md:text-3xl font-bold font-display text-heading">
          Trải nghiệm toàn bộ công nghệ đột phá này ngay hôm nay
        </h2>
        <p className="text-secondary text-xs md:text-sm mt-3 max-w-lg mx-auto">
          Tạo tài khoản miễn phí để thiết lập Workspace đầu tiên của đội ngũ bạn.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/register" className="ui-btn-primary px-6 py-3 text-sm font-semibold flex items-center gap-2 shadow-lg">
            Đăng ký tài khoản <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/" className="ui-btn-secondary px-5 py-3 text-sm font-semibold">
            Về trang chủ
          </Link>
        </div>
      </section>
    </div>
  );
}
