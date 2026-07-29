'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import Sidebar from '@/components/Sidebar';
import { useLanguage } from '@/lib/i18n';
import { Shield, Lock, FileText, ArrowRight, Sparkles } from 'lucide-react';

export default function TermsPage() {
  const { t } = useLanguage();
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
          {t('legalPrivacy')}
        </span>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight font-display text-heading mt-6 leading-tight">
          {t('termsPageTitle')}
        </h1>
        <p className="text-secondary text-xs mt-4 max-w-xl mx-auto leading-relaxed">
          {t('termsPageSubtitle')}
        </p>
      </section>

      {/* Document content */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 relative z-10 mt-6">
        {/* Sidebar Table of Contents */}
        <aside className="md:col-span-1 space-y-3.5 text-xs font-semibold text-secondary sticky top-28 self-start hidden md:block">
          <div className="text-muted text-[10px] uppercase font-bold tracking-wider mb-2">{t('toc')}</div>
          <a href="#dieu-khoan" className="block hover:text-primary transition-all pb-1 border-l-2 border-border pl-3 active-border-l">{t('termsSec1Title')}</a>
          <a href="#quy-rieng-tu" className="block hover:text-primary transition-all pb-1 border-l-2 border-border pl-3">{t('privacySec2Title')}</a>
          <a href="#nhat-ky-logs" className="block hover:text-primary transition-all pb-1 border-l-2 border-border pl-3">{t('logsSec3Title')}</a>
          <a href="#bao-mat-ai" className="block hover:text-primary transition-all pb-1 border-l-2 border-border pl-3">{t('aiSec4Title')}</a>
        </aside>

        {/* Text Area */}
        <article className="md:col-span-3 space-y-12 text-secondary text-xs md:text-sm leading-relaxed">
          {/* Section 1 */}
          <section id="dieu-khoan" className="space-y-4 scroll-mt-24">
            <h2 className="text-base font-bold text-heading font-display flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {t('termsSec1Title')}
            </h2>
            <p>
              {t('termsSec1Content')}
            </p>
          </section>

          {/* Section 2 */}
          <section id="quy-rieng-tu" className="space-y-4 scroll-mt-24">
            <h2 className="text-base font-bold text-heading font-display flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              {t('privacySec2Title')}
            </h2>
            <p>
              {t('privacySec2Content')}
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>{t('accountCreds')}</li>
              <li>{t('taskLists')}</li>
              <li>{t('fileAttachments')}</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section id="nhat-ky-logs" className="space-y-4 scroll-mt-24">
            <h2 className="text-base font-bold text-heading font-display flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              {t('logsSec3Title')}
            </h2>
            <p>
              {t('logsSec3Content')}
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>{t('actionLogDetails')}</li>
              <li>{t('logDataFields')}</li>
              <li>{t('logRetention')}</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section id="bao-mat-ai" className="space-y-4 scroll-mt-24">
            <h2 className="text-base font-bold text-heading font-display flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              {t('aiSec4Title')}
            </h2>
            <p>
              {t('aiSec4Content')}
            </p>
          </section>
        </article>
      </div>

      {/* Footer CTA */}
      {showCTA && (
        <section className="max-w-4xl mx-auto px-6 py-12 text-center relative z-10 border-t border-border mt-20">
          <div className="flex flex-col items-center gap-4">
            <p className="text-secondary text-xs">{t('sitemapContact')}</p>
            <Link href="/contact" className="ui-btn-primary px-5 py-2.5 text-xs flex items-center gap-1.5 shadow-md">
              {t('contact')} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}
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
