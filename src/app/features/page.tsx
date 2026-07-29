'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import Sidebar from '@/components/Sidebar';
import { useLanguage } from '@/lib/i18n';
import { 
  ArrowLeft, Sparkles, Zap, TrendingUp, CheckSquare, 
  MessageSquare, Calendar, Shield, Users, ArrowRight 
} from 'lucide-react';

export default function FeaturesPage() {
  const { t, language, setLanguage } = useLanguage();
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

  // Helper render for core features content
  const renderCoreFeatures = (showCTA = true) => (
    <>
      {/* Hero Section */}
      <section className="max-w-4xl mx-auto text-center relative z-10 pb-12">
        <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-3.5 py-1.5 rounded-full border border-primary/20">
          {t('discoverTech')}
        </span>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight font-display text-heading mt-6 leading-tight">
          {t('featuresPageTitle')}
        </h1>
        <p className="text-secondary text-sm mt-4 max-w-xl mx-auto leading-relaxed">
          {t('featuresPageSubtitle')}
        </p>
      </section>

      {/* Detailed Features Flow */}
      <div className="max-w-5xl mx-auto space-y-24 relative z-10 mt-6">
        {/* Feature 1: Realtime Kanban */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 text-primary font-bold text-xs bg-primary/10 px-3.5 py-1.5 rounded-xl">
              <Zap className="h-4.5 w-4.5" />
              {t('webSocketTech')}
            </div>
            <h2 className="text-xl md:text-2xl font-bold font-display text-heading leading-tight">
              {t('kanbanZeroDelayTitle')}
            </h2>
            <p className="text-secondary text-xs md:text-sm leading-relaxed">
              {t('kanbanZeroDelayDesc')}
            </p>
            <ul className="space-y-3.5 text-xs text-secondary">
              <li className="flex items-center gap-2.5">
                <div className="h-4 w-4 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">✓</div>
                <span>{t('autoLockCard')}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="h-4 w-4 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">✓</div>
                <span>{t('liveNotification')}</span>
              </li>
            </ul>
          </div>
          
          <div className="glass p-6 rounded-2xl border border-border shadow-lg relative overflow-hidden bg-gradient-to-tr from-surface/30 to-surface/10">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                <span className="text-[10px] font-bold text-muted uppercase">{t('kanbanSyncDiag')}</span>
                <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold">{t('activeConnection')}</span>
              </div>
              <div className="flex justify-between items-center gap-2 py-4">
                <div className="glass px-3 py-2 rounded-lg border border-border text-center text-[10px] w-28">
                  <div className="font-bold text-title">{t('memberA')}</div>
                  <div className="text-muted mt-1 text-[9px]">{t('dragCard')}</div>
                </div>
                <div className="flex-1 h-0.5 border-t-2 border-dashed border-primary relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-[8px] font-bold px-1.5 py-0.5 rounded animate-pulse">
                    WebSockets
                  </div>
                </div>
                <div className="glass px-3 py-2 rounded-lg border border-primary/30 text-center text-[10px] w-28 bg-primary/5">
                  <div className="font-bold text-primary">{t('memberB')}</div>
                  <div className="text-primary mt-1 text-[9px] font-semibold">{t('autoUpdate')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2: AI Report */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="md:order-2 space-y-5">
            <div className="inline-flex items-center gap-2 text-violet-500 font-bold text-xs bg-violet-500/10 px-3.5 py-1.5 rounded-xl">
              <Sparkles className="h-4.5 w-4.5 animate-pulse" />
              {t('openRouterApi')}
            </div>
            <h2 className="text-xl md:text-2xl font-bold font-display text-heading leading-tight">
              {t('aiReportBuildTitle')}
            </h2>
            <p className="text-secondary text-xs md:text-sm leading-relaxed">
              {t('aiReportBuildDesc')}
            </p>
            <ul className="space-y-3.5 text-xs text-secondary">
              <li className="flex items-center gap-2.5">
                <div className="h-4 w-4 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">✓</div>
                <span>{t('analyzeRisks')}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="h-4 w-4 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">✓</div>
                <span>{t('autoPdfExport')}</span>
              </li>
            </ul>
          </div>

          <div className="md:order-1 glass p-6 rounded-2xl border border-border shadow-lg bg-gradient-to-bl from-surface/30 to-surface/10">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-title border-b border-border-subtle pb-3">
                <TrendingUp className="w-4 h-4 text-violet-400" />
                {t('progressData')}
              </div>
              <div className="flex items-end justify-between h-32 pt-4 px-2">
                <div className="flex flex-col items-center gap-1.5 w-8">
                  <div className="w-full bg-primary/20 hover:bg-primary/30 transition-all rounded-t-md h-12" />
                  <span className="text-[9px] text-muted">Mon</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 w-8">
                  <div className="w-full bg-primary/20 hover:bg-primary/30 transition-all rounded-t-md h-16" />
                  <span className="text-[9px] text-muted">Tue</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 w-8">
                  <div className="w-full bg-primary/40 hover:bg-primary/50 transition-all rounded-t-md h-24" />
                  <span className="text-[9px] text-muted">Wed</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 w-8">
                  <div className="w-full bg-primary/60 hover:bg-primary/70 transition-all rounded-t-md h-20" />
                  <span className="text-[9px] text-muted">Thu</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 w-8">
                  <div className="w-full bg-gradient-to-t from-primary to-accent rounded-t-md h-28" />
                  <span className="text-[9px] text-muted font-bold text-primary">Today</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 3: AI Subtasks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 text-emerald-500 font-bold text-xs bg-emerald-500/10 px-3.5 py-1.5 rounded-xl">
              <CheckSquare className="h-4.5 w-4.5" />
              {t('smartBreakdown')}
            </div>
            <h2 className="text-xl md:text-2xl font-bold font-display text-heading leading-tight">
              {t('aiAutoSubtaskTitle')}
            </h2>
            <p className="text-secondary text-xs md:text-sm leading-relaxed">
              {t('aiAutoSubtaskDesc')}
            </p>
            <ul className="space-y-3.5 text-xs text-secondary">
              <li className="flex items-center gap-2.5">
                <div className="h-4 w-4 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">✓</div>
                <span>{t('initChecklist')}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="h-4 w-4 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">✓</div>
                <span>{t('tickComplete')}</span>
              </li>
            </ul>
          </div>

          <div className="glass p-6 rounded-2xl border border-border shadow-lg bg-gradient-to-tr from-surface/30 to-surface/10">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-4">
                <span className="text-xs font-bold text-title">{t('bigTaskSample')}</span>
                <span className="text-[9px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">{t('subtaskByAi')}</span>
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center gap-3 text-xs text-secondary opacity-75">
                  <div className="w-4 h-4 rounded border border-emerald-500 bg-emerald-500/20 flex items-center justify-center text-emerald-500 text-[10px] font-bold">✓</div>
                  <span className="line-through">{t('subtaskStep1')}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-secondary">
                  <div className="w-4 h-4 rounded border border-emerald-500 bg-emerald-500/20 flex items-center justify-center text-emerald-500 text-[10px] font-bold">✓</div>
                  <span className="line-through">{t('subtaskStep2')}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-title">
                  <div className="w-4 h-4 rounded border border-border shrink-0" />
                  <span>{t('subtaskStep3')}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-title">
                  <div className="w-4 h-4 rounded border border-border shrink-0" />
                  <span>{t('subtaskStep4')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to action */}
      {showCTA && (
        <section className="max-w-4xl mx-auto px-6 py-20 text-center relative z-10 border-t border-border mt-20">
          <h2 className="text-xl md:text-2xl font-bold font-display text-heading">
            {t('ctaExperienceTitle')}
          </h2>
          <p className="text-secondary text-xs mt-3 max-w-lg mx-auto">
            {t('ctaExperienceDesc')}
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/register" className="ui-btn-primary px-5 py-2.5 text-xs font-semibold flex items-center gap-2 shadow-lg">
              {t('register')} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/" className="ui-btn-secondary px-5 py-2.5 text-xs font-semibold">
              {t('backToHome')}
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
          {renderCoreFeatures(false)}
        </div>
      </div>
    );
  }

  // --- RENDERING FOR GUEST USERS (WITH TOP HEADER & CTA) ---
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
            <Link href="/features" className="text-sm font-bold text-primary transition-all">
              Tính năng
            </Link>
            <Link href="/pricing" className="text-sm font-semibold text-secondary hover:text-primary transition-all">
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

      {renderCoreFeatures(true)}
    </div>
  );
}
