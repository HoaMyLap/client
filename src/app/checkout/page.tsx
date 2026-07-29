'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { useLanguage } from '@/lib/i18n';
import { 
  ShieldCheck, CreditCard, QrCode, Sparkles, CheckCircle2, 
  ArrowLeft, Copy, Check, Ticket, AlertCircle, Building2, Lock
} from 'lucide-react';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language } = useLanguage();

  const planType = searchParams.get('plan') || 'PRO';
  const billing = searchParams.get('billing') || 'annual';

  const [paymentMethod, setPaymentMethod] = useState<'qr' | 'momo' | 'card'>('qr');
  const [voucherCode, setVoucherCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedVoucher, setAppliedVoucher] = useState('');
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Price calculations
  const basePrice = planType === 'ENTERPRISE' 
    ? (billing === 'annual' ? 399000 : 499000)
    : (billing === 'annual' ? 159000 : 199000);

  const finalPrice = Math.max(0, basePrice * (1 - discount));

  const handleApplyVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (voucherCode.trim().toUpperCase() === 'HOMIX2026') {
      setDiscount(0.2); // 20% discount
      setAppliedVoucher('HOMIX2026 (-20%)');
    } else {
      alert(language === 'vi' ? 'Mã giảm giá không hợp lệ!' : 'Invalid voucher code!');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentSuccess(true);
    }, 2000);
  };

  return (
    <main className="max-w-6xl mx-auto px-6 py-12 w-full">
      {/* Back button */}
      <Link href="/pricing" className="inline-flex items-center gap-2 text-xs font-bold text-secondary hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        <span>{t('back')} {t('pricing')}</span>
      </Link>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Side: Payment Details */}
        <div className="flex-1 space-y-6">
          <div className="glass p-8 rounded-3xl border border-border shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-6 border-b border-border-subtle">
              <div>
                <h1 className="text-2xl font-bold font-display text-heading flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  {t('checkoutTitle')}
                </h1>
                <p className="text-xs text-secondary mt-1">Giao dịch an toàn mã hóa SSL 256-bit</p>
              </div>

              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" /> SSL Secured
              </span>
            </div>

            {/* Payment Method Selector Tabs */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-heading uppercase tracking-wider block">
                {t('paymentMethod')}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('qr')}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                    paymentMethod === 'qr'
                      ? 'border-primary bg-primary/10 text-primary shadow-md'
                      : 'border-border bg-surface/50 text-secondary hover:border-primary/40'
                  }`}
                >
                  <QrCode className="h-6 w-6" />
                  <div>
                    <div className="text-xs font-bold">VietQR Bank Transfer</div>
                    <div className="text-[10px] opacity-70">Quét mã chuyển khoản tức thì</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('momo')}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                    paymentMethod === 'momo'
                      ? 'border-pink-500 bg-pink-500/10 text-pink-400 shadow-md'
                      : 'border-border bg-surface/50 text-secondary hover:border-pink-500/40'
                  }`}
                >
                  <Sparkles className="h-6 w-6 text-pink-400" />
                  <div>
                    <div className="text-xs font-bold">Ví MoMo</div>
                    <div className="text-[10px] opacity-70">Thanh toán MoMo QR</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400 shadow-md'
                      : 'border-border bg-surface/50 text-secondary hover:border-blue-500/40'
                  }`}
                >
                  <CreditCard className="h-6 w-6 text-blue-400" />
                  <div>
                    <div className="text-xs font-bold">Thẻ Quốc Tế</div>
                    <div className="text-[10px] opacity-70">Visa / Mastercard</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Payment Details Container */}
            {paymentMethod === 'qr' && (
              <div className="p-6 rounded-2xl bg-surface/60 border border-border space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* QR Image Simulation */}
                  <div className="p-3 bg-white rounded-2xl shadow-lg shrink-0 text-center">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=HOMIX2026_${planType}_${finalPrice}`} 
                      alt="VietQR Payment Code"
                      className="w-40 h-40 object-contain mx-auto"
                    />
                    <span className="text-[10px] font-bold text-zinc-800 mt-1 block">VietQR Pro Payment</span>
                  </div>

                  <div className="space-y-2.5 text-xs text-secondary flex-1 w-full">
                    <div className="flex justify-between py-1 border-b border-border-subtle">
                      <span>{t('accountOwner')}</span>
                      <strong className="text-heading">CÔNG TY CỔ PHẦN HOMIX ECOSYSTEM</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border-subtle">
                      <span>{t('bankName')}</span>
                      <strong className="text-heading">MB BANK (Ngân Hàng Quân Đội)</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border-subtle">
                      <span>{t('accountNo')}</span>
                      <div className="flex items-center gap-1.5 font-mono font-bold text-primary">
                        <span>999988886666</span>
                        <button type="button" onClick={() => handleCopy('999988886666')} className="hover:text-heading">
                          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>{t('contentTransfer')}</span>
                      <strong className="text-primary font-mono">HOMIX {planType} VIP</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'momo' && (
              <div className="p-6 rounded-2xl bg-pink-500/5 border border-pink-500/20 text-center space-y-3">
                <Sparkles className="h-10 w-10 text-pink-400 mx-auto" />
                <h4 className="text-sm font-bold text-heading">Thanh toán qua Ví MoMo</h4>
                <p className="text-xs text-secondary max-w-md mx-auto">
                  Mở ứng dụng MoMo trên điện thoại và quét mã QR hoặc chuyển khoản đến số điện thoại MoMo VIP: <strong>0909888999</strong> (Chủ TK: Homix Support).
                </p>
              </div>
            )}

            {paymentMethod === 'card' && (
              <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-3 text-xs">
                <div>
                  <label className="ui-label text-[10px] uppercase mb-1">Số thẻ Visa / Mastercard</label>
                  <input type="text" placeholder="4123 4567 8901 2345" className="ui-input px-3 py-2 text-xs font-mono" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="ui-label text-[10px] uppercase mb-1">Hạn hết (MM/YY)</label>
                    <input type="text" placeholder="12/28" className="ui-input px-3 py-2 text-xs font-mono" />
                  </div>
                  <div>
                    <label className="ui-label text-[10px] uppercase mb-1">Mã CVC / CVV</label>
                    <input type="text" placeholder="888" className="ui-input px-3 py-2 text-xs font-mono" />
                  </div>
                </div>
              </div>
            )}

            {/* Confirm Button */}
            <button
              type="button"
              onClick={handleConfirmPayment}
              disabled={isProcessing || paymentSuccess}
              className="w-full ui-btn-primary py-3.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-xl shadow-primary/25 hover:scale-[1.01] transition-all cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
                  <span>Đang xác minh giao dịch...</span>
                </>
              ) : paymentSuccess ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <span>Thanh toán thành công! Đã nâng cấp {planType}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-5 w-5" />
                  <span>{t('confirmPayment')} ({finalPrice.toLocaleString('vi-VN')} VNĐ)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Side: Order Summary */}
        <div className="w-full lg:w-96 space-y-6 shrink-0">
          <div className="glass p-6 rounded-3xl border border-border shadow-xl space-y-5">
            <h3 className="text-sm font-bold text-heading uppercase tracking-wider border-b border-border-subtle pb-3">
              {t('orderSummary')}
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-secondary">{t('selectedPackage')}</span>
                <strong className="text-primary font-bold">{planType} Package</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">{t('billingCycle')}</span>
                <strong className="text-heading uppercase font-bold">{billing}</strong>
              </div>
              {appliedVoucher && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Ưu đãi Voucher:</span>
                  <span>{appliedVoucher}</span>
                </div>
              )}
            </div>

            {/* Voucher input form */}
            <form onSubmit={handleApplyVoucher} className="pt-3 border-t border-border-subtle flex gap-2">
              <div className="relative flex-1">
                <Ticket className="h-4 w-4 text-muted absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  placeholder="Mã voucher (ví dụ HOMIX2026)"
                  className="ui-input pl-9 pr-3 py-2 text-xs uppercase font-mono"
                />
              </div>
              <button type="submit" className="ui-btn-secondary px-3 py-2 text-xs font-bold shrink-0">
                {t('applyCode')}
              </button>
            </form>

            {/* Total Price Card */}
            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-muted uppercase font-bold">{t('totalAmount')}</div>
                <div className="text-xl font-black font-display text-primary">
                  {finalPrice.toLocaleString('vi-VN')} VNĐ
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                Đã gồm thuế VAT
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Suspense fallback={<div className="p-12 text-center text-xs font-bold">Đang tải thông tin thanh toán...</div>}>
          <CheckoutContent />
        </Suspense>
      </div>
    </div>
  );
}
