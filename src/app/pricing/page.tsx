'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { useLanguage } from '@/lib/i18n';
import { 
  Check, Sparkles, Shield, Zap, ArrowRight, Star, HelpCircle, 
  ChevronDown, MessageSquare, Headphones, Award
} from 'lucide-react';

export default function PricingPage() {
  const { t, language } = useLanguage();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const discountMultiplier = billingCycle === 'annual' ? 0.8 : 1;

  const faqs = [
    {
      q: language === 'vi' ? 'Tôi có thể đổi gói dịch vụ bất kỳ lúc nào không?' : 'Can I change my plan anytime?',
      a: language === 'vi' 
        ? 'Có, bạn có thể nâng cấp hoặc hạ cấp gói dịch vụ bất kỳ lúc nào. Số tiền chưa sử dụng của gói cũ sẽ được quy đổi trừ vào gói mới.' 
        : 'Yes, you can upgrade or downgrade your plan at any time. Unused credits from your previous plan will be credited.'
    },
    {
      q: language === 'vi' ? 'Các hình thức thanh toán được hỗ trợ là gì?' : 'What payment methods are supported?',
      a: language === 'vi' 
        ? 'Homix v2.0 hỗ trợ chuyển khoản ngân hàng qua VietQR, Ví MoMo, ZaloPay và Thẻ quốc tế Visa/Mastercard.' 
        : 'Homix v2.0 supports bank transfers via VietQR, MoMo e-wallet, ZaloPay, and Visa/Mastercard.'
    },
    {
      q: language === 'vi' ? 'Tính năng AI Assistant hoạt động như thế nào?' : 'How does the AI Assistant work?',
      a: language === 'vi' 
        ? 'Trợ lý AI tích hợp mô hình Google Gemini 2.0 Flash giúp phân tích báo cáo tiến độ, tự động tách nhỏ công việc (Subtasks) và tìm kiếm ngữ nghĩa thông minh.' 
        : 'The AI Assistant integrates Google Gemini 2.0 Flash to generate progress reports, breakdown subtasks, and perform semantic search.'
    },
    {
      q: language === 'vi' ? 'Dữ liệu của tôi có được bảo mật không?' : 'Is my data secure?',
      a: language === 'vi' 
        ? 'Tất cả dữ liệu được mã hóa SSL/TLS 256-bit, lưu trữ an toàn trên hạ tầng Docker & Cloudinary với bản sao lưu định kỳ hàng ngày.' 
        : 'All data is encrypted via 256-bit SSL/TLS and securely backed up daily on Docker & Cloudinary infrastructure.'
    }
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <main className="max-w-7xl mx-auto px-6 py-12 w-full">
          {/* Header Badge */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold shadow-sm">
              <Sparkles className="h-4 w-4" />
              <span>{language === 'vi' ? 'HỆ THỐNG HOMIX V2.0 ECOSYSTEM' : 'HOMIX V2.0 ECOSYSTEM'}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black font-display text-heading tracking-tight">
              {t('pricingTitle')}
            </h1>

            <p className="text-secondary text-sm sm:text-base leading-relaxed">
              {t('pricingSubtitle')}
            </p>

            {/* Monthly / Annual Toggle */}
            <div className="pt-6 flex items-center justify-center gap-4">
              <span className={`text-xs font-bold transition-colors ${billingCycle === 'monthly' ? 'text-heading font-black' : 'text-muted'}`}>
                {t('monthly')}
              </span>

              <button
                type="button"
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
                className="relative w-14 h-7 rounded-full bg-surface border border-border p-1 transition-colors cursor-pointer"
              >
                <div
                  className={`w-5 h-5 rounded-full bg-primary transition-transform shadow-md ${
                    billingCycle === 'annual' ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>

              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-bold transition-colors ${billingCycle === 'annual' ? 'text-heading font-black' : 'text-muted'}`}>
                  {t('annual')}
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {t('save20')}
                </span>
              </div>
            </div>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-14">
            {/* Free Plan */}
            <div className="glass p-8 rounded-3xl border border-border flex flex-col justify-between hover:border-primary/30 transition-all shadow-lg">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold font-display text-heading">{t('freePlan')}</h3>
                  <div className="p-2.5 rounded-2xl bg-secondary/10 text-secondary">
                    <Zap className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-xs text-secondary mt-2 min-h-[36px]">{t('freeDesc')}</p>

                <div className="mt-6 border-y border-border-subtle py-4">
                  <span className="text-3xl font-black font-display text-heading">{t('freePrice')}</span>
                  <span className="text-xs text-muted"> / {t('monthly').toLowerCase()}</span>
                </div>

                <ul className="mt-6 space-y-3 text-xs text-secondary">
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>{language === 'vi' ? 'Tối đa 3 Workspace & 5 Dự án' : 'Up to 3 Workspaces & 5 Projects'}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>{language === 'vi' ? 'Bảng Kanban quản lý công việc' : 'Real-time Kanban task management'}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>{language === 'vi' ? '50 MB Lưu trữ tài liệu đính kèm' : '50 MB Document storage'}</span>
                  </li>
                  <li className="flex items-center gap-2.5 opacity-50">
                    <Check className="h-4 w-4 text-muted shrink-0" />
                    <span className="line-through">{language === 'vi' ? 'Báo cáo AI & Tìm kiếm ngữ nghĩa' : 'AI Report & Semantic Search'}</span>
                  </li>
                  <li className="flex items-center gap-2.5 opacity-50">
                    <Check className="h-4 w-4 text-muted shrink-0" />
                    <span className="line-through">{language === 'vi' ? 'Nhập / Xuất Excel hàng loạt' : 'Batch Excel Import / Export'}</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <button type="button" disabled className="w-full py-3 rounded-2xl bg-surface border border-border text-xs font-bold text-muted cursor-not-allowed">
                  {t('currentPlan')}
                </button>
              </div>
            </div>

            {/* Pro Plan (Popular Choice) */}
            <div className="glass p-8 rounded-3xl border-2 border-primary/60 flex flex-col justify-between relative shadow-2xl shadow-primary/10 hover:scale-[1.02] transition-all bg-gradient-to-b from-primary/5 via-transparent to-transparent">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-md">
                {t('popularBadge')}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold font-display text-heading flex items-center gap-2">
                    {t('proPlan')}
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  </h3>
                  <div className="p-2.5 rounded-2xl bg-primary/20 text-primary">
                    <Sparkles className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-xs text-secondary mt-2 min-h-[36px]">{t('proDesc')}</p>

                <div className="mt-6 border-y border-primary/20 py-4">
                  <span className="text-3xl font-black font-display text-primary">
                    {billingCycle === 'annual' ? (language === 'vi' ? '159.000 VNĐ' : '$7.99') : (language === 'vi' ? '199.000 VNĐ' : '$9.99')}
                  </span>
                  <span className="text-xs text-muted"> / {t('monthly').toLowerCase()}</span>
                </div>

                <ul className="mt-6 space-y-3 text-xs text-secondary">
                  <li className="flex items-center gap-2.5 font-semibold text-heading">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>{language === 'vi' ? 'Workspace & Dự án KHÔNG GIỚI HẠN' : 'UNLIMITED Workspaces & Projects'}</span>
                  </li>
                  <li className="flex items-center gap-2.5 font-semibold text-heading">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>{language === 'vi' ? 'Trợ lý AI 24/7 (Báo cáo 5 phần & Smart Search)' : '24/7 AI Assistant (5-part Report & Smart Search)'}</span>
                  </li>
                  <li className="flex items-center gap-2.5 font-semibold text-heading">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>{language === 'vi' ? 'Nhập / Xuất Excel hàng loạt (.xlsx)' : 'Batch Excel Import / Export (.xlsx)'}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>{language === 'vi' ? '10 GB Lưu trữ đám mây Cloudinary' : '10 GB Cloudinary Storage'}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>{language === 'vi' ? 'Xuất báo cáo nghiệm thu In PDF' : 'Export Printable PDF Reports'}</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <Link
                  href={`/checkout?plan=PRO&billing=${billingCycle}`}
                  className="w-full ui-btn-primary py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:scale-[1.02] transition-transform"
                >
                  <span>{t('upgradeNow')}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Enterprise Plan */}
            <div className="glass p-8 rounded-3xl border border-border flex flex-col justify-between hover:border-primary/30 transition-all shadow-lg">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold font-display text-heading">{t('enterprisePlan')}</h3>
                  <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400">
                    <Shield className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-xs text-secondary mt-2 min-h-[36px]">{t('enterpriseDesc')}</p>

                <div className="mt-6 border-y border-border-subtle py-4">
                  <span className="text-3xl font-black font-display text-heading">
                    {billingCycle === 'annual' ? (language === 'vi' ? '399.000 VNĐ' : '$19.99') : (language === 'vi' ? '499.000 VNĐ' : '$24.99')}
                  </span>
                  <span className="text-xs text-muted"> / {t('monthly').toLowerCase()}</span>
                </div>

                <ul className="mt-6 space-y-3 text-xs text-secondary">
                  <li className="flex items-center gap-2.5 font-semibold text-heading">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>{language === 'vi' ? 'Tất cả tính năng của gói PRO' : 'All PRO Plan Features'}</span>
                  </li>
                  <li className="flex items-center gap-2.5 font-semibold text-heading">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>{language === 'vi' ? 'Server AI riêng biệt (Dedicated Gemini Node)' : 'Dedicated AI Node (Dedicated Gemini)'}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>{language === 'vi' ? 'Dung lượng lưu trữ 100 GB' : '100 GB Cloud Storage'}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>{language === 'vi' ? 'Tích hợp Đăng nhập SSO / SAML' : 'SSO / SAML Single Sign-On'}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>{language === 'vi' ? 'Hỗ trợ kỹ thuật ưu tiên VIP 24/7' : '24/7 VIP Priority Support'}</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <Link
                  href={`/checkout?plan=ENTERPRISE&billing=${billingCycle}`}
                  className="w-full ui-btn-secondary py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-hover transition-colors"
                >
                  <span>{t('choosePlan')}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* FAQs Accordion Section */}
          <div className="mt-20 max-w-4xl mx-auto">
            <div className="text-center space-y-2 mb-10">
              <h2 className="text-2xl font-bold font-display text-heading flex items-center justify-center gap-2">
                <HelpCircle className="h-6 w-6 text-primary" />
                <span>{language === 'vi' ? 'Câu Hỏi Thường Gặp (FAQs)' : 'Frequently Asked Questions'}</span>
              </h2>
              <p className="text-xs text-secondary">
                {language === 'vi' ? 'Giải đáp thắc mắc về đăng ký gói dịch vụ Homix v2.0' : 'Common questions regarding Homix v2.0 subscription'}
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div key={idx} className="glass rounded-2xl border border-border overflow-hidden transition-all">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-surface/50"
                  >
                    <span className="font-bold text-sm text-heading">{faq.q}</span>
                    <ChevronDown className={`h-4 w-4 text-secondary transition-transform ${openFaq === idx ? 'rotate-180 text-primary' : ''}`} />
                  </button>
                  {openFaq === idx && (
                    <div className="px-5 pb-5 text-xs text-secondary leading-relaxed border-t border-border-subtle pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
