'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import Sidebar from '@/components/Sidebar';
import { 
  ArrowLeft, Check, Sparkles, Zap, ArrowRight, Shield 
} from 'lucide-react';

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
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

  const plans = [
    {
      name: 'Free',
      description: 'Dành cho cá nhân hoặc các nhóm nhỏ bắt đầu lập kế hoạch dự án.',
      price: 0,
      features: [
        'Tối đa 1 Không gian làm việc (Workspace)',
        'Tối đa 2 Dự án',
        'Bảng Kanban thời gian thực (Realtime)',
        'Checklist & Bình luận thảo luận',
        'Báo cáo AI cơ bản (3 lượt chạy/ngày)',
        'Bộ lọc Dark/Light Mode',
      ],
      cta: 'Bắt đầu miễn phí',
      href: '/register',
      popular: false,
    },
    {
      name: 'Pro',
      description: 'Dành cho các đội ngũ hiệu suất cao cần trợ lý AI tối đa công suất.',
      price: billingPeriod === 'monthly' ? 12 : 9.6,
      features: [
        'Không giới hạn Không gian làm việc',
        'Không giới hạn Dự án & Nhiệm vụ',
        'Bảng Kanban thời gian thực',
        'Phân rã công việc bằng AI không giới hạn',
        'Báo cáo AI & Vẽ biểu đồ tự động (Không giới hạn)',
        'Tải báo cáo PDF chất lượng cao',
        'Hỗ trợ khách hàng ưu tiên (24/7)',
      ],
      cta: 'Trải nghiệm Pro ngay',
      href: '/register',
      popular: true,
    },
    {
      name: 'Enterprise',
      description: 'Bảo mật tuyệt đối, phân tích AI tùy biến sâu cho các tổ chức lớn.',
      price: 'Liên hệ',
      features: [
        'Toàn bộ tính năng gói Pro',
        'Tích hợp Private LLM Model riêng biệt',
        'Quản lý quyền truy cập bảo mật SSO/SAML',
        'Cam kết băng thông riêng biệt cho WebSockets',
        'Chuyên viên tư vấn triển khai dự án',
        'Thỏa thuận cam kết dịch vụ (SLA 99.9%)',
      ],
      cta: 'Liên hệ kinh doanh',
      href: '/contact',
      popular: false,
    },
  ];

  const renderPricingContent = () => (
    <>
      {/* Hero Section */}
      <section className="max-w-4xl mx-auto text-center relative z-10 pb-12">
        <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-3.5 py-1.5 rounded-full border border-primary/20">
          Minh bạch & Linh hoạt
        </span>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight font-display text-heading mt-6 leading-tight">
          Chọn gói dịch vụ phù hợp với <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">nhu cầu của bạn</span>
        </h1>
        <p className="text-secondary text-sm mt-4 max-w-xl mx-auto leading-relaxed">
          Tối ưu hóa năng suất làm việc nhóm với sự hỗ trợ của trợ lý AI thông minh nhất.
        </p>

        {/* Toggle billing period */}
        <div className="mt-8 flex justify-center items-center gap-3">
          <span className={`text-xs ${billingPeriod === 'monthly' ? 'font-bold text-title' : 'text-muted'}`}>Thanh toán hàng tháng</span>
          <button
            onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
            className="w-12 h-6 rounded-full bg-primary/20 border border-primary/30 p-1 flex items-center transition-all cursor-pointer"
          >
            <div className={`w-4 h-4 rounded-full bg-primary transition-all ${billingPeriod === 'yearly' ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
          <span className={`text-xs ${billingPeriod === 'yearly' ? 'font-bold text-title' : 'text-muted'} flex items-center gap-1.5`}>
            Thanh toán hàng năm 
            <span className="text-[9px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
              Tiết kiệm 20%
            </span>
          </span>
        </div>
      </section>

      {/* Pricing Cards Grid */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10 mt-6 items-stretch">
        {plans.map((plan, idx) => (
          <div 
            key={idx} 
            className={`glass p-6 rounded-3xl border flex flex-col justify-between relative transition-all duration-300 hover:scale-[1.01] ${
              plan.popular 
                ? 'border-primary/50 bg-gradient-to-b from-primary/5 via-transparent to-transparent shadow-xl shadow-primary/5' 
                : 'border-border'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-accent text-white text-[9px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md">
                Phổ biến nhất
              </div>
            )}

            <div>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold font-display text-heading">{plan.name}</h3>
              </div>
              <p className="text-secondary text-xs leading-relaxed mb-6 h-12">
                {plan.description}
              </p>
              
              <div className="mb-6 flex items-baseline gap-1">
                {typeof plan.price === 'number' ? (
                  <>
                    <span className="text-3xl font-black text-title">${plan.price}</span>
                    <span className="text-muted text-[10px]">/thành viên/tháng</span>
                  </>
                ) : (
                  <span className="text-2xl font-black text-title">{plan.price}</span>
                )}
              </div>

              <div className="border-t border-border-subtle pt-6 mb-6">
                <ul className="space-y-4 text-xs text-secondary">
                  {plan.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2.5">
                      <div className="h-4.5 w-4.5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="h-3 w-3" />
                      </div>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Link 
              href={plan.href}
              className={`w-full py-3 rounded-2xl text-xs font-bold text-center block transition-all ${
                plan.popular 
                  ? 'ui-btn-primary shadow-lg shadow-primary/20' 
                  : 'ui-btn-secondary'
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      <div className="max-w-md mx-auto text-center mt-12 flex items-center justify-center gap-2 text-xs text-muted">
        <Shield className="h-4 w-4 text-primary" />
        <span>Cam kết bảo mật dữ liệu cấp doanh nghiệp & An toàn logs</span>
      </div>
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
          {renderPricingContent()}
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
            <Link href="/pricing" className="text-sm font-bold text-primary transition-all">
              Bảng giá
            </Link>
            <Link href="/terms" className="text-sm font-semibold text-secondary hover:text-primary transition-all">
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

      {renderPricingContent()}
    </div>
  );
}
