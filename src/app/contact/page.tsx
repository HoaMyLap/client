'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import { useLanguage } from '@/lib/i18n';
import { api } from '@/lib/api';
import { 
  Mail, Phone, MapPin, Clock, Send, MessageSquare, 
  Sparkles, CheckCircle2, Headphones, HelpCircle, ShieldCheck,
  Building, Copy, Check, MessageCircle, Zap, ExternalLink, ArrowRight,
  Globe2, LifeBuoy, FileText
} from 'lucide-react';

export default function ContactPage() {
  const { t, language, setLanguage } = useLanguage();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('Hỗ trợ kỹ thuật');
  const [message, setMessage] = useState('');

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    setLoading(false);
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await api.request('/contact', {
        method: 'POST',
        body: JSON.stringify({ fullname, email, phone, subject, message }),
      });
      if (res && res.success) {
        setSuccessMsg(res.message || (language === 'vi' 
          ? 'Cảm ơn bạn đã gửi liên hệ! Đội ngũ Homix v2.0 đã nhận thông tin và sẽ phản hồi trong 24h.' 
          : 'Thank you for reaching out! Homix v2.0 support team will reply within 24h.'));
        setFullname('');
        setEmail('');
        setPhone('');
        setMessage('');
      } else {
        setErrorMsg(res?.error || 'Lỗi gửi tin nhắn liên hệ.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể kết nối đến máy chủ.');
    } finally {
      setSending(false);
    }
  };

  const subjects = [
    { id: 'Hỗ trợ kỹ thuật', label: t('supportTech'), icon: Zap, color: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10' },
    { id: 'Tư vấn gói Pro / Enterprise', label: t('supportBilling'), icon: Sparkles, color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
    { id: 'Góp ý tính năng', label: t('feedback'), icon: MessageSquare, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
    { id: 'Báo lỗi hệ thống', label: t('reportBug'), icon: HelpCircle, color: 'text-rose-400 border-rose-500/30 bg-rose-500/10' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderContactContent = () => (
    <main className="max-w-7xl mx-auto px-6 py-12 w-full space-y-16">
      {/* Header Hero Section */}
      <div className="text-center max-w-3xl mx-auto space-y-5">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary/20 via-violet-500/20 to-primary/20 border border-primary/30 text-primary text-xs font-black tracking-wide shadow-lg shadow-primary/10">
          <Headphones className="h-4 w-4 animate-bounce" />
          <span>{language === 'vi' ? 'TRUNG TÂM HỖ TRỢ DỊCH VỤ 24/7' : '24/7 GLOBAL SUPPORT CENTER'}</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black font-display text-heading tracking-tight leading-tight">
          {t('contactTitle')}
        </h1>

        <p className="text-secondary text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
          {t('contactSubtitle')}
        </p>
      </div>

      {/* Quick Support Channels Banner Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass p-5 rounded-2xl border border-border hover:border-primary/40 transition-all duration-300 shadow-lg group">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Email Hỗ Trợ</p>
              <p className="text-xs font-bold text-heading mt-0.5">homixspace@gmail.com</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleCopy('homixspace@gmail.com', 'email')}
            className="mt-3 w-full py-1.5 px-3 rounded-xl bg-surface border border-border hover:border-primary/30 text-[11px] font-bold text-secondary hover:text-primary flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            {copiedField === 'email' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copiedField === 'email' ? (language === 'vi' ? 'Đã sao chép!' : 'Copied!') : (language === 'vi' ? 'Sao chép Email' : 'Copy Email')}</span>
          </button>
        </div>

        <div className="glass p-5 rounded-2xl border border-border hover:border-emerald-500/40 transition-all duration-300 shadow-lg group">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted">{t('hotline')}</p>
              <p className="text-xs font-bold text-heading mt-0.5">090 123 4567</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleCopy('0901234567', 'phone')}
            className="mt-3 w-full py-1.5 px-3 rounded-xl bg-surface border border-border hover:border-emerald-500/30 text-[11px] font-bold text-secondary hover:text-emerald-400 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            {copiedField === 'phone' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copiedField === 'phone' ? (language === 'vi' ? 'Đã sao chép!' : 'Copied!') : (language === 'vi' ? 'Sao chép Hotline' : 'Copy Hotline')}</span>
          </button>
        </div>

        <div className="glass p-5 rounded-2xl border border-border hover:border-violet-500/40 transition-all duration-300 shadow-lg group">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-violet-500/10 text-violet-400 group-hover:scale-110 transition-transform">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted">{t('address')}</p>
              <p className="text-xs font-bold text-heading mt-0.5 truncate max-w-[180px]">Quận 1, TP. Hồ Chí Minh</p>
            </div>
          </div>
          <a
            href="https://maps.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 w-full py-1.5 px-3 rounded-xl bg-surface border border-border hover:border-violet-500/30 text-[11px] font-bold text-secondary hover:text-violet-400 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>{language === 'vi' ? 'Xem bản đồ' : 'View Map'}</span>
          </a>
        </div>

        <div className="glass p-5 rounded-2xl border border-border hover:border-amber-500/40 transition-all duration-300 shadow-lg group">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                {language === 'vi' ? 'Giờ làm việc' : 'Working Hours'}
              </p>
              <p className="text-xs font-bold text-heading mt-0.5">8:00 - 20:00 (T2 - T7)</p>
            </div>
          </div>
          <div className="mt-3 w-full py-1.5 px-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] font-bold text-amber-400 text-center">
            {language === 'vi' ? '⚡ Phản hồi trong 1-2h' : '⚡ 1-2h Response Time'}
          </div>
        </div>
      </div>

      {/* Main Grid Section: Contact Form & Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Direct Info & Guarantees */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass p-8 rounded-3xl border border-border shadow-xl space-y-6 bg-gradient-to-b from-surface/80 via-surface/40 to-surface/80">
            <div className="flex items-center gap-3 border-b border-border-subtle pb-5">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                <LifeBuoy className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-display text-heading">
                  {language === 'vi' ? 'Cam kết chất lượng dịch vụ' : 'Service SLA Commitment'}
                </h3>
                <p className="text-xs text-secondary mt-0.5">Homix v2.0 Customer Care</p>
              </div>
            </div>

            <ul className="space-y-4 text-xs text-secondary">
              <li className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-heading block font-semibold">{language === 'vi' ? 'Bảo mật thông tin tuyệt đối' : 'Strict Data Privacy'}</strong>
                  <span className="text-muted leading-relaxed">{language === 'vi' ? 'Mọi yêu cầu gửi qua biểu mẫu đều được mã hóa đầu cuối và chuyển trực tiếp tới hộp thư quản trị viên.' : 'All messages are encrypted and delivered directly to our admin inbox.'}</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-violet-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-heading block font-semibold">{language === 'vi' ? 'Hỗ trợ kỹ thuật chuyên sâu' : 'Expert Tech Assistance'}</strong>
                  <span className="text-muted leading-relaxed">{language === 'vi' ? 'Đội ngũ kỹ sư trực tiếp kiểm tra và hỗ trợ giải quyết sự cố tích hợp API hoặc nạp xuất Excel.' : 'Our engineers directly resolve API integration or Excel import queries.'}</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Globe2 className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-heading block font-semibold">{language === 'vi' ? 'Đa ngôn ngữ 24/7' : '24/7 Multi-language Support'}</strong>
                  <span className="text-muted leading-relaxed">{language === 'vi' ? 'Tiếp nhận và phản hồi bằng cả Tiếng Việt và Tiếng Anh.' : 'We welcome inquiries in both Vietnamese and English.'}</span>
                </div>
              </li>
            </ul>
          </div>

          <div className="glass p-6 rounded-3xl border border-primary/30 bg-primary/5 shadow-xl flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-heading">{language === 'vi' ? 'Bạn cần trao đổi trực tiếp?' : 'Need a direct call?'}</h4>
              <p className="text-xs text-secondary">{language === 'vi' ? 'Gọi ngay Hotline hotline chăm sóc khách hàng' : 'Call our customer care hotline'}</p>
            </div>
            <a
              href="tel:0901234567"
              className="ui-btn-primary px-4 py-2 text-xs font-bold flex items-center gap-2 shrink-0 shadow-lg shadow-primary/20"
            >
              <Phone className="h-4 w-4" />
              <span>Gọi ngay</span>
            </a>
          </div>
        </div>

        {/* Right Column: High-End Contact Form */}
        <div className="lg:col-span-7">
          <div className="glass p-8 sm:p-10 rounded-3xl border border-border shadow-2xl space-y-8 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-border-subtle pb-6">
              <div>
                <h3 className="text-xl font-extrabold font-display text-heading flex items-center gap-2.5">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  {language === 'vi' ? 'Gửi Yêu Cầu Cho Chúng Tôi' : 'Send Us a Message'}
                </h3>
                <p className="text-xs text-secondary mt-1">
                  {language === 'vi' ? 'Điền thông tin bên dưới, chúng tôi sẽ phản hồi lại ngay qua Email' : 'Fill out the form below, we will respond via email'}
                </p>
              </div>
            </div>

            {/* Alert Feedback Messages */}
            {successMsg && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-3 animate-fade-in">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}
            {errorMsg && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-3 animate-fade-in">
                <HelpCircle className="h-5 w-5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Subject Selector Pills */}
              <div>
                <label className="ui-label text-[11px] font-bold uppercase tracking-wider mb-2.5 block text-heading">
                  {t('subject')} <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2">
                  {subjects.map((item) => {
                    const IconComp = item.icon;
                    const isSelected = subject === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSubject(item.id)}
                        className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2.5 transition-all text-left cursor-pointer ${
                          isSelected
                            ? 'border-primary bg-primary/15 text-primary shadow-md'
                            : 'border-border bg-surface/50 text-secondary hover:border-primary/30'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg border ${item.color}`}>
                          <IconComp className="h-3.5 w-3.5" />
                        </div>
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form Input Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="ui-label text-[11px] font-bold uppercase tracking-wider mb-1.5 block text-heading">
                    {t('fullName')} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="ui-input px-4 py-3 text-xs focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div>
                  <label className="ui-label text-[11px] font-bold uppercase tracking-wider mb-1.5 block text-heading">
                    {t('email')} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="ui-input px-4 py-3 text-xs focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div>
                <label className="ui-label text-[11px] font-bold uppercase tracking-wider mb-1.5 block text-heading">
                  {t('phone')}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0901234567"
                  className="ui-input px-4 py-3 text-xs focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="w-full">
                <label className="ui-label text-[11px] font-bold uppercase tracking-wider mb-1.5 block text-heading">
                  {t('message')} <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Nhập nội dung chi tiết yêu cầu hỗ trợ hoặc thắc mắc của bạn..."
                  className="w-full ui-textarea px-4 py-3.5 text-xs focus:ring-2 focus:ring-primary/40 resize-y min-h-[140px] leading-relaxed rounded-2xl block"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full ui-btn-primary py-4 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2.5 shadow-xl shadow-primary/25 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
                    <span>Đang gửi thông điệp tới Homix...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4.5 w-4.5" />
                    <span>{t('sendContact')}</span>
                    <ArrowRight className="h-4 w-4 ml-1 opacity-70" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );

  // LOGGED IN VIEW WITH SIDEBAR
  if (isLoggedIn) {
    return (
      <div className="flex min-h-screen bg-background text-foreground font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto relative">
          {/* Background Decorative Glow Gradients */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full filter blur-[120px] pointer-events-none -z-10" />
          <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full filter blur-[140px] pointer-events-none -z-10" />

          {renderContactContent()}
        </div>
      </div>
    );
  }

  // GUEST LANDING VIEW WITH TOP NAVIGATION BAR
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
              {t('features')}
            </Link>
            <Link href="/pricing" className="text-sm font-semibold text-secondary hover:text-primary transition-all">
              {t('pricing')}
            </Link>
            <Link href="/terms" className="text-sm font-semibold text-secondary hover:text-primary transition-all font-sans">
              {t('terms')}
            </Link>
            <Link href="/contact" className="text-sm font-bold text-primary transition-all">
              {t('contact')}
            </Link>

            {/* Language Selector Pill */}
            <button
              type="button"
              onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface hover:border-primary/40 text-xs font-bold text-heading transition-all shadow-sm cursor-pointer"
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

      <div className="relative z-10">
        {renderContactContent()}
      </div>
    </div>
  );
}
