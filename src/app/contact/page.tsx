'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import Sidebar from '@/components/Sidebar';
import { 
  ArrowLeft, MessageSquare, Mail, Phone, MapPin, 
  Send, CheckCircle2 
} from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('support');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [appLoading, setAppLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    setAppLoading(false);
  }, []);

  if (appLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API submission
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setName('');
      setEmail('');
      setMessage('');
      setTimeout(() => setSuccess(false), 3000);
    }, 1000);
  };

  const renderContactContent = () => (
    <>
      {/* Hero Section */}
      <section className="max-w-4xl mx-auto text-center relative z-10 pb-12">
        <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-3.5 py-1.5 rounded-full border border-primary/20">
          Kết nối & Hợp tác
        </span>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight font-display text-heading mt-6 leading-tight">
          Chúng tôi luôn sẵn sàng <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">lắng nghe bạn</span>
        </h1>
        <p className="text-secondary text-xs mt-4 max-w-xl mx-auto leading-relaxed">
          Gửi yêu cầu demo doanh nghiệp, phản hồi tính năng hoặc yêu cầu hỗ trợ kỹ thuật bất cứ lúc nào.
        </p>
      </section>

      {/* Contact Main Content */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10 mt-6">
        {/* Left Side: Contact Form Card */}
        <div className="glass p-6 md:p-8 rounded-3xl border border-border shadow-xl bg-gradient-to-b from-surface/40 to-transparent">
          <h2 className="text-lg font-bold font-display text-heading mb-6">Gửi tin nhắn phản hồi</h2>
          
          {success && (
            <div className="ui-alert-success mb-6 flex items-center gap-2 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Gửi tin nhắn thành công! Chúng tôi sẽ phản hồi sớm nhất.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="ui-label text-[10px] uppercase font-bold tracking-wider mb-1.5">Họ và tên</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nguyen Van A"
                className="ui-input px-4 py-2.5 text-xs"
              />
            </div>

            <div>
              <label className="ui-label text-[10px] uppercase font-bold tracking-wider mb-1.5">Email liên hệ</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="ui-input px-4 py-2.5 text-xs"
              />
            </div>

            <div>
              <label className="ui-label text-[10px] uppercase font-bold tracking-wider mb-1.5">Chủ đề yêu cầu</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="ui-input px-4 py-2.5 text-xs"
              >
                <option value="support">Hỗ trợ kỹ thuật & Lỗi</option>
                <option value="demo">Yêu cầu Demo doanh nghiệp</option>
                <option value="feedback">Góp ý phát triển tính năng</option>
                <option value="other">Hợp tác thương mại khác</option>
              </select>
            </div>

            <div>
              <label className="ui-label text-[10px] uppercase font-bold tracking-wider mb-1.5">Nội dung chi tiết</label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Hãy viết câu hỏi hoặc yêu cầu của bạn tại đây..."
                className="ui-input px-4 py-2.5 text-xs resize-none"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="ui-btn-primary w-full py-3 text-xs flex items-center justify-center gap-2 shadow-lg"
            >
              {loading ? 'Đang gửi...' : (
                <>
                  Gửi tin nhắn <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Side: Contact info details */}
        <div className="flex flex-col justify-center space-y-8">
          <div className="space-y-6">
            <h2 className="text-lg font-bold font-display text-heading">Thông tin liên lạc trực tiếp</h2>
            <p className="text-secondary text-xs leading-relaxed">
              Nếu bạn cần hỗ trợ khẩn cấp hoặc muốn thảo luận chuyên sâu về giải pháp tùy biến Private AI cho tổ chức,
              hãy liên hệ với chúng tôi qua các kênh trực tiếp dưới đây:
            </p>
          </div>

          <div className="space-y-4">
            {/* Direct 1 */}
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-title">Email hỗ trợ khách hàng</h4>
                <p className="text-secondary text-xs mt-1">support@smartmanager.io</p>
              </div>
            </div>

            {/* Direct 2 */}
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-title">Hotline tư vấn doanh nghiệp</h4>
                <p className="text-secondary text-xs mt-1">+84 (24) 3456-7890 (Hà Nội)</p>
              </div>
            </div>

            {/* Direct 3 */}
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-title">Văn phòng chính (R&D)</h4>
                <p className="text-secondary text-xs mt-1">Tầng 12, Tòa nhà công nghệ SmartTech, Cầu Giấy, Hà Nội</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // --- RENDERING FOR LOGGED-IN USERS (WITH SIDEBAR) ---
  if (isLoggedIn) {
    return (
      <div className="flex h-screen w-full bg-background text-foreground relative font-sans overflow-hidden">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] rounded-full glow-orb-primary blur-[140px] pointer-events-none opacity-20" />
        <div className="absolute bottom-0 left-0 w-[50%] h-[50%] rounded-full glow-orb-accent blur-[140px] pointer-events-none opacity-15" />
        
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0 h-screen relative z-10 overflow-y-auto px-6 py-8 md:px-12 pb-12">
          {renderContactContent()}
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
      <header className="sticky top-0 z-50 border-b border-border bg-header/80 backdrop-blur-md px-6 py-1 h-20 flex items-center">
        <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center group">
            <img src="/logo2.png" alt="Logo" style={{ transform: 'scale(1.3)', transformOrigin: 'left center' }} className="h-18 w-auto object-contain group-hover:scale-[1.02] transition-transform" />
          </Link>

          <div className="flex items-center gap-6">
            <Link href="/features" className="text-sm font-semibold text-secondary hover:text-primary transition-all">
              Tính năng
            </Link>
            <Link href="/pricing" className="text-sm font-semibold text-secondary hover:text-primary transition-all">
              Bảng giá
            </Link>
            <Link href="/terms" className="text-sm font-semibold text-secondary hover:text-primary transition-all">
              Điều khoản
            </Link>
            <Link href="/contact" className="text-sm font-bold text-primary transition-all">
              Liên hệ
            </Link>
            <ThemeToggle />
            <Link href="/login" className="text-sm font-semibold text-secondary hover:text-primary transition-all">
              Đăng nhập
            </Link>
          </div>
        </div>
      </header>

      {renderContactContent()}
    </div>
  );
}
