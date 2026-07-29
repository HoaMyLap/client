'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useLanguage } from '@/lib/i18n';
import { api } from '@/lib/api';
import { 
  Mail, Phone, MapPin, Clock, Send, MessageSquare, 
  Sparkles, CheckCircle2, Headphones, HelpCircle, ShieldCheck
} from 'lucide-react';

export default function ContactPage() {
  const { t, language } = useLanguage();

  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('Hỗ trợ kỹ thuật');
  const [message, setMessage] = useState('');
  
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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
        setSuccessMsg(res.message || 'Cảm ơn bạn đã gửi liên hệ! Đội ngũ Homix v2.0 sẽ phản hồi trong 24h.');
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

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <main className="max-w-7xl mx-auto px-6 py-12 w-full">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold shadow-sm">
              <Headphones className="h-4 w-4" />
              <span>{language === 'vi' ? 'HỖ TRỢ KHÁCH HÀNG 24/7' : 'CUSTOMER SUPPORT 24/7'}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black font-display text-heading tracking-tight">
              {t('contactTitle')}
            </h1>

            <p className="text-secondary text-sm sm:text-base leading-relaxed">
              {t('contactSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-14">
            {/* Contact Information Cards */}
            <div className="space-y-6">
              <div className="glass p-6 rounded-3xl border border-border shadow-lg space-y-4">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary w-fit">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-heading">{t('address')}</h3>
                  <p className="text-xs text-secondary mt-1 leading-relaxed">
                    Tầng 12, Tòa nhà Homix Innovation Tower, 180 Nguyễn Thị Minh Khai, Quận 3, TP. Hồ Chí Minh, Việt Nam
                  </p>
                </div>
              </div>

              <div className="glass p-6 rounded-3xl border border-border shadow-lg space-y-4">
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 w-fit">
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-heading">{t('hotline')}</h3>
                  <p className="text-xs text-secondary mt-1 font-mono font-bold text-emerald-400">
                    1900 6868 - (028) 7300 9999
                  </p>
                  <p className="text-[10px] text-muted mt-0.5">Miễn phí cước gọi từ mọi nhà mạng</p>
                </div>
              </div>

              <div className="glass p-6 rounded-3xl border border-border shadow-lg space-y-4">
                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 w-fit">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-heading">{t('workHours')}</h3>
                  <p className="text-xs text-secondary mt-1">
                    Thứ 2 - Thứ 7: 08:00 - 20:00<br />
                    Chủ nhật: 09:00 - 17:00 (Kỹ thuật trực 24/7)
                  </p>
                </div>
              </div>
            </div>

            {/* Main Contact Form */}
            <div className="lg:col-span-2">
              <div className="glass p-8 rounded-3xl border border-border shadow-xl space-y-6">
                <div className="flex items-center justify-between pb-6 border-b border-border-subtle">
                  <div>
                    <h2 className="text-xl font-bold font-display text-heading flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      Gửi Tin Nhắn Cho Chúng Tôi
                    </h2>
                    <p className="text-xs text-secondary mt-1">
                      Điền thông tin bên dưới, chuyên viên hỗ trợ sẽ liên hệ lại với bạn trong vòng 24 giờ.
                    </p>
                  </div>
                </div>

                {successMsg && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {errorMsg && (
                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                    <span>⚠️ {errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="ui-label text-[10px] uppercase tracking-wider mb-1.5 block">
                        {t('fullName')} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={fullname}
                        onChange={(e) => setFullname(e.target.value)}
                        placeholder="Nguyễn Văn A"
                        className="ui-input px-3.5 py-2.5 text-xs"
                      />
                    </div>

                    <div>
                      <label className="ui-label text-[10px] uppercase tracking-wider mb-1.5 block">
                        {t('email')} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nguyenvana@gmail.com"
                        className="ui-input px-3.5 py-2.5 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="ui-label text-[10px] uppercase tracking-wider mb-1.5 block">
                        {t('phone')}
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0901234567"
                        className="ui-input px-3.5 py-2.5 text-xs"
                      />
                    </div>

                    <div>
                      <label className="ui-label text-[10px] uppercase tracking-wider mb-1.5 block">
                        {t('subject')}
                      </label>
                      <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="ui-select px-3.5 py-2.5 text-xs"
                      >
                        <option value="Hỗ trợ kỹ thuật">{t('supportTech')}</option>
                        <option value="Tư vấn gói Pro / Enterprise">{t('supportBilling')}</option>
                        <option value="Góp ý tính năng">{t('feedback')}</option>
                        <option value="Báo lỗi hệ thống">{t('reportBug')}</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="ui-label text-[10px] uppercase tracking-wider mb-1.5 block">
                      {t('message')} <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Mô tả chi tiết nội dung cần hỗ trợ..."
                      className="ui-textarea px-3.5 py-2.5 text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full sm:w-auto ui-btn-primary px-8 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:scale-[1.02] transition-transform cursor-pointer"
                  >
                    {sending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
                        <span>Đang gửi tin nhắn...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>{t('sendContact')}</span>
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
