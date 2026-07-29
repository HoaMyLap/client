'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useLanguage } from '@/lib/i18n';
import { api } from '@/lib/api';
import { 
  Mail, Phone, MapPin, Clock, Send, MessageSquare, 
  Sparkles, CheckCircle2, Headphones, HelpCircle, ShieldCheck,
  Building, Copy, Check, MessageCircle, Zap, ExternalLink, ArrowRight,
  Globe2, LifeBuoy, FileText
} from 'lucide-react';

export default function ContactPage() {
  const { t, language } = useLanguage();

  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('Hỗ trợ kỹ thuật');
  const [message, setMessage] = useState('');

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto relative">
        {/* Background Decorative Glow Gradients */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full filter blur-[120px] pointer-events-none -z-10" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full filter blur-[140px] pointer-events-none -z-10" />

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
                  <LifeBuoy className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-heading">Live Chat 24/7</div>
                  <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Đang hoạt động
                  </div>
                </div>
              </div>
            </div>

            <div className="glass p-5 rounded-2xl border border-border hover:border-emerald-500/40 transition-all duration-300 shadow-lg group">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-heading">Email Support</div>
                  <div className="text-[10px] text-secondary mt-0.5">homixspace@gmail.com</div>
                </div>
              </div>
            </div>

            <div className="glass p-5 rounded-2xl border border-border hover:border-amber-500/40 transition-all duration-300 shadow-lg group">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-heading">Hotline Hỗ Trợ</div>
                  <div className="text-[10px] text-amber-400 font-mono font-bold mt-0.5">1900 6868</div>
                </div>
              </div>
            </div>

            <div className="glass p-5 rounded-2xl border border-border hover:border-violet-500/40 transition-all duration-300 shadow-lg group">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-violet-500/10 text-violet-400 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-heading">SLA Đảm Bảo</div>
                  <div className="text-[10px] text-secondary mt-0.5">Cam kết phản hồi &lt; 24h</div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Layout Grid: Left Cards + Right Contact Form */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Info Column (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Card 1: Office Locations */}
              <div className="glass p-7 rounded-3xl border border-border shadow-xl space-y-5 relative overflow-hidden">
                <div className="flex items-center gap-3 border-b border-border-subtle pb-4">
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                    <Building className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-display text-heading">{t('address')}</h3>
                    <p className="text-xs text-secondary">Trụ sở chính & Chi nhánh đại diện</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-2xl bg-surface/50 border border-border hover:border-primary/30 transition-all space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-heading">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-primary" /> TP. Hồ Chí Minh (Trụ sở chính)
                      </span>
                      <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">HQ</span>
                    </div>
                    <p className="text-secondary leading-relaxed pl-5">
                      Tầng 12, Homix Innovation Tower, 180 Nguyễn Thị Minh Khai, Phường Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-surface/50 border border-border hover:border-primary/30 transition-all space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-heading">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-violet-400" /> Hà Nội (Chi nhánh phía Bắc)
                      </span>
                      <span className="text-[9px] font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20">Branch</span>
                    </div>
                    <p className="text-secondary leading-relaxed pl-5">
                      Tầng 8, Tòa nhà Keangnam Landmark 72, Đường Phạm Hùng, Quận Nam Từ Liêm, Hà Nội
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Contact Details with Click-to-Copy */}
              <div className="glass p-7 rounded-3xl border border-border shadow-xl space-y-5">
                <div className="flex items-center gap-3 border-b border-border-subtle pb-4">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-display text-heading">Thông Tin Trực Tuyến</h3>
                    <p className="text-xs text-secondary">Bấm để sao chép liên hệ nhanh</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Email row */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface/50 border border-border hover:border-emerald-500/30 transition-all">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-emerald-400 shrink-0" />
                      <div>
                        <div className="text-[10px] text-muted font-bold">EMAIL HỖ TRỢ</div>
                        <div className="font-mono font-bold text-heading">homixspace@gmail.com</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy('homixspace@gmail.com', 'email')}
                      className="p-2 rounded-xl bg-surface border border-border hover:border-emerald-500/40 text-secondary hover:text-emerald-400 transition-colors"
                      title="Sao chép email"
                    >
                      {copiedField === 'email' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Phone row */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface/50 border border-border hover:border-amber-500/30 transition-all">
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-amber-400 shrink-0" />
                      <div>
                        <div className="text-[10px] text-muted font-bold">HOTLINE CỨU HỘ</div>
                        <div className="font-mono font-bold text-heading">1900 6868 - (028) 7300 9999</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy('19006868', 'phone')}
                      className="p-2 rounded-xl bg-surface border border-border hover:border-amber-500/40 text-secondary hover:text-amber-400 transition-colors"
                      title="Sao chép Hotline"
                    >
                      {copiedField === 'phone' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Form Column (7 Cols) */}
            <div className="lg:col-span-7">
              <div className="glass p-8 sm:p-10 rounded-3xl border-2 border-primary/30 shadow-2xl space-y-8 relative bg-gradient-to-b from-card via-card to-card/90">
                <div className="flex items-center justify-between pb-6 border-b border-border-subtle">
                  <div>
                    <h2 className="text-2xl font-black font-display text-heading flex items-center gap-2.5">
                      <MessageCircle className="h-6 w-6 text-primary" />
                      Gửi Thông Điệp Hỗ Trợ
                    </h2>
                    <p className="text-xs text-secondary mt-1">
                      Chúng tôi cam kết phản hồi thư của bạn trong thời gian sớm nhất qua Email
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold uppercase tracking-wider hidden sm:inline-block">
                    Direct Form
                  </span>
                </div>

                {/* Banner Status Notifications */}
                {successMsg && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-3 animate-fade-in shadow-lg">
                    <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-400" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {errorMsg && (
                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-3 animate-fade-in shadow-lg">
                    <HelpCircle className="h-6 w-6 shrink-0 text-rose-400" />
                    <span>⚠️ {errorMsg}</span>
                  </div>
                )}

                {/* Form Controls */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Subject Selector Pills */}
                  <div>
                    <label className="ui-label text-[11px] font-bold uppercase tracking-wider mb-2.5 block text-heading">
                      {t('subject')} <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {subjects.map((item) => {
                        const Icon = item.icon;
                        const isSelected = subject === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setSubject(item.id)}
                            className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2.5 transition-all text-left cursor-pointer ${
                              isSelected
                                ? 'border-primary bg-primary/15 text-primary shadow-md scale-[1.01]'
                                : 'border-border bg-surface/40 text-secondary hover:border-primary/40'
                            }`}
                          >
                            <div className={`p-1.5 rounded-xl border ${item.color}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <span className="truncate">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Input Fields Row */}
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
                        placeholder="nguyenvana@gmail.com"
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

                  <div>
                    <label className="ui-label text-[11px] font-bold uppercase tracking-wider mb-1.5 block text-heading">
                      {t('message')} <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Nhập nội dung chi tiết yêu cầu hỗ trợ hoặc thắc mắc của bạn..."
                      className="ui-textarea px-4 py-3 text-xs focus:ring-2 focus:ring-primary/40 resize-none leading-relaxed"
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
      </div>
    </div>
  );
}
