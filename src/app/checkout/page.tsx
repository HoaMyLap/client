'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { useLanguage } from '@/lib/i18n';
import { api } from '@/lib/api';
import { 
  ShieldCheck, CreditCard, QrCode, Sparkles, CheckCircle2, 
  ArrowLeft, Copy, Check, Ticket, AlertCircle, Building2, Lock,
  HelpCircle, ExternalLink, RefreshCw, Smartphone, Globe, Info
} from 'lucide-react';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language } = useLanguage();

  const planType = searchParams.get('plan') || 'PRO';
  const billing = searchParams.get('billing') || 'annual';

  const [paymentMethod, setPaymentMethod] = useState<'VNPAY' | 'MOMO' | 'PAYPAL' | 'CREDIT_CARD'>('VNPAY');
  const [voucherCode, setVoucherCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedVoucher, setAppliedVoucher] = useState('');
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [showConfigGuide, setShowConfigGuide] = useState(false);

  // Active Order State
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');

  // Price calculations
  const basePrice = planType === 'ENTERPRISE' 
    ? (billing === 'annual' ? 399000 : 499000)
    : (billing === 'annual' ? 159000 : 199000);

  const finalPrice = Math.max(0, Math.round(basePrice * (1 - discount)));

  // Auto Create Order on paymentMethod or Voucher change
  useEffect(() => {
    handleCreateOrder();
  }, [paymentMethod, appliedVoucher]);

  // PayPal Smart Buttons SDK Loader & Renderer
  useEffect(() => {
    if (paymentMethod !== 'PAYPAL' || !activeOrder) return;

    const clientId = 'AULIBK_ava0E1QxLYbRUHI-PkmzzAtCkgKUfBa8O-6MRh2ukhB_Rp4n6Zbl86cXNATk-p6pvC2POzZ7Y';
    const scriptId = 'paypal-js-sdk-script';

    const renderPayPalButtons = () => {
      if ((window as any).paypal && document.getElementById('paypal-button-container')) {
        const container = document.getElementById('paypal-button-container');
        if (container) container.innerHTML = '';

        try {
          (window as any).paypal.Buttons({
            style: {
              layout: 'vertical',
              color: 'gold',
              shape: 'rect',
              label: 'paypal'
            },
            createOrder: (data: any, actions: any) => {
              const usdVal = planType === 'ENTERPRISE' ? '19.99' : '7.99';
              return actions.order.create({
                purchase_units: [{
                  amount: {
                    currency_code: 'USD',
                    value: usdVal
                  },
                  description: `Homix ${planType} VIP Package (${billing})`
                }]
              });
            },
            onApprove: async (data: any, actions: any) => {
              try {
                await actions.order.capture();
                if (activeOrder) {
                  await api.payments.confirmPayment({ orderId: activeOrder.id });
                }
                setPaymentSuccess(true);
              } catch (e) {
                console.error('PayPal capture error:', e);
              }
            },
            onError: (err: any) => {
              console.error('PayPal Smart Button error:', err);
            }
          }).render('#paypal-button-container');
        } catch (e) {
          console.error('Error rendering PayPal buttons:', e);
        }
      }
    };

    if ((window as any).paypal) {
      setTimeout(renderPayPalButtons, 300);
      return;
    }

    const existingScript = document.getElementById(scriptId);
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
      script.async = true;
      script.onload = () => {
        setTimeout(renderPayPalButtons, 300);
      };
      document.body.appendChild(script);
    } else {
      setTimeout(renderPayPalButtons, 300);
    }
  }, [paymentMethod, activeOrder, planType, billing]);

  // Auto Polling Transaction Verification (Tự động check giao dịch mỗi 3s)
  useEffect(() => {
    if (!activeOrder || activeOrder.status === 'COMPLETED' || paymentSuccess) return;

    const intervalId = setInterval(async () => {
      try {
        const statusRes = await api.payments.getOrderStatus(activeOrder.id);
        if (statusRes && statusRes.status === 'COMPLETED') {
          setPaymentSuccess(true);
          setActiveOrder((prev: any) => ({ ...prev, status: 'COMPLETED' }));
          clearInterval(intervalId);
        }
      } catch (err) {
        // Silent poll
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [activeOrder, paymentSuccess]);

  const handleCreateOrder = async () => {
    setIsCreatingOrder(true);
    try {
      const order = await api.payments.createOrder({
        planType,
        billingCycle: billing,
        paymentMethod,
        voucherCode: appliedVoucher ? 'HOMIX2026' : undefined
      });
      setActiveOrder(order);
    } catch (err: any) {
      console.error('Lỗi tạo đơn hàng thanh toán:', err);
    } finally {
      setIsCreatingOrder(false);
    }
  };

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

  // Direct manual / simulate confirm button
  const handleConfirmPayment = async () => {
    if (!activeOrder) return;
    setIsProcessing(true);
    try {
      const completedOrder = await api.payments.confirmPayment({ orderId: activeOrder.id });
      setActiveOrder(completedOrder);
      setPaymentSuccess(true);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xác minh thanh toán.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-6 py-10 w-full">
      {/* Back button */}
      <Link href="/pricing" className="inline-flex items-center gap-2 text-xs font-bold text-secondary hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        <span>{t('back')} {t('pricing')}</span>
      </Link>

      {/* Guide Banner for Beneficiary / Merchant Account Configuration */}
      <div className="mb-8 p-4 rounded-2xl bg-primary/10 border border-primary/20 text-xs text-secondary space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-heading font-bold">
            <Info className="h-4 w-4 text-primary" />
            <span>Hướng dẫn cung cấp thông tin tài khoản thụ hưởng cổng thanh toán</span>
          </div>
          <button
            type="button"
            onClick={() => setShowConfigGuide(!showConfigGuide)}
            className="text-[11px] font-bold text-primary hover:underline bg-transparent border-0 cursor-pointer"
          >
            {showConfigGuide ? 'Ẩn hướng dẫn ▲' : 'Xem chi tiết hướng dẫn ▼'}
          </button>
        </div>

        {showConfigGuide && (
          <div className="pt-3 border-t border-primary/15 space-y-2.5 text-[11px] leading-relaxed">
            <p>Để hoàn tất cấu hình tài khoản nhận tiền thực tế cho doanh nghiệp của bạn, vui lòng cung cấp các tham số API từ các cổng thanh toán tương ứng:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="p-2.5 rounded-xl bg-surface border border-border">
                <strong className="text-primary block font-bold">🇻🇳 VNPay Merchant:</strong>
                <span>Cung cấp: <code>VNPAY_TMN_CODE</code>, <code>VNPAY_HASH_SECRET</code>, <code>VNPAY_URL</code>.</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface border border-border">
                <strong className="text-pink-400 block font-bold">📱 Ví MoMo Business:</strong>
                <span>Cung cấp: <code>MOMO_PARTNER_CODE</code>, <code>MOMO_ACCESS_KEY</code>, <code>MOMO_SECRET_KEY</code>.</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface border border-border">
                <strong className="text-blue-400 block font-bold">🅿️ PayPal Business:</strong>
                <span>Cung cấp: <code>PAYPAL_CLIENT_ID</code>, <code>PAYPAL_CLIENT_SECRET</code>, <code>PAYPAL_MODE</code>.</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface border border-border">
                <strong className="text-emerald-400 block font-bold">💳 VietQR / Ngân Hàng Thụ Hưởng:</strong>
                <span>Cung cấp: Số tài khoản, Tên chủ tài khoản, Tên Ngân hàng (MB, VCB...).</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Side: Payment Methods & Process */}
        <div className="flex-1 space-y-6">
          <div className="glass p-8 rounded-3xl border border-border shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-6 border-b border-border-subtle">
              <div>
                <h1 className="text-2xl font-bold font-display text-heading flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  {t('checkoutTitle')}
                </h1>
                <p className="text-xs text-secondary mt-1">Hệ thống kiểm tra giao dịch tự động 24/7 qua Webhook & IPN</p>
              </div>

              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" /> Auto Check IPN
              </span>
            </div>

            {/* 4 Payment Method Selector Tabs */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-heading uppercase tracking-wider block">
                1. Chọn hình thức thanh toán
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* VNPay */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('VNPAY')}
                  className={`p-3.5 rounded-2xl border text-center flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                    paymentMethod === 'VNPAY'
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400 font-bold shadow-md scale-[1.02]'
                      : 'border-border bg-surface/50 text-secondary hover:border-blue-500/40'
                  }`}
                >
                  <Globe className="h-6 w-6 text-blue-400" />
                  <div className="text-xs font-bold">VNPay</div>
                  <div className="text-[9px] opacity-70">Quét mã / ATM</div>
                </button>

                {/* MoMo */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('MOMO')}
                  className={`p-3.5 rounded-2xl border text-center flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                    paymentMethod === 'MOMO'
                      ? 'border-pink-500 bg-pink-500/10 text-pink-400 font-bold shadow-md scale-[1.02]'
                      : 'border-border bg-surface/50 text-secondary hover:border-pink-500/40'
                  }`}
                >
                  <Smartphone className="h-6 w-6 text-pink-400" />
                  <div className="text-xs font-bold">Ví MoMo</div>
                  <div className="text-[9px] opacity-70">App MoMo</div>
                </button>

                {/* PayPal */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('PAYPAL')}
                  className={`p-3.5 rounded-2xl border text-center flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                    paymentMethod === 'PAYPAL'
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 font-bold shadow-md scale-[1.02]'
                      : 'border-border bg-surface/50 text-secondary hover:border-indigo-500/40'
                  }`}
                >
                  <CreditCard className="h-6 w-6 text-indigo-400" />
                  <div className="text-xs font-bold">PayPal</div>
                  <div className="text-[9px] opacity-70">USD / Quốc tế</div>
                </button>

                {/* Credit Card */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CREDIT_CARD')}
                  className={`p-3.5 rounded-2xl border text-center flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                    paymentMethod === 'CREDIT_CARD'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold shadow-md scale-[1.02]'
                      : 'border-border bg-surface/50 text-secondary hover:border-emerald-500/40'
                  }`}
                >
                  <CreditCard className="h-6 w-6 text-emerald-400" />
                  <div className="text-xs font-bold">Thẻ Quốc Tế</div>
                  <div className="text-[9px] opacity-70">Visa/Mastercard</div>
                </button>
              </div>
            </div>

            {/* Payment Details Container */}
            <div className="p-6 rounded-2xl bg-surface/60 border border-border space-y-4">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <span className="text-xs font-bold text-heading uppercase">
                  2. Mã QR Thanh toán & Thông tin giao dịch
                </span>
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 animate-pulse">
                  <RefreshCw className="h-3 w-3 animate-spin" /> Tự động kiểm tra giao dịch mỗi 3 giây
                </span>
              </div>

              {isCreatingOrder ? (
                <div className="flex flex-col items-center justify-center py-10 text-xs text-muted gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary/20 border-t-primary" />
                  Đang khởi tạo mã giao dịch tự động...
                </div>
              ) : activeOrder ? (
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* QR Image */}
                  <div className="p-3 bg-white rounded-2xl shadow-lg shrink-0 text-center">
                    <img 
                      src={activeOrder.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${activeOrder.transactionId}`} 
                      alt="Payment QR Code"
                      className="w-40 h-40 object-contain mx-auto"
                    />
                    <span className="text-[10px] font-bold text-zinc-800 mt-1 block">
                      Mã QR {paymentMethod}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-secondary flex-1 w-full">
                    <div className="flex justify-between py-1 border-b border-border-subtle">
                      <span>Mã giao dịch:</span>
                      <strong className="text-primary font-mono">{activeOrder.transactionId}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border-subtle">
                      <span>Đơn vị thụ hưởng:</span>
                      <strong className="text-heading">
                        {paymentMethod === 'PAYPAL' ? 'PayPal App: Homix' : 'CÔNG TY CỔ PHẦN HOMIX ECOSYSTEM'}
                      </strong>
                    </div>
                    {paymentMethod === 'PAYPAL' && (
                      <div className="flex justify-between py-1 border-b border-border-subtle">
                        <span>PayPal Client ID:</span>
                        <span className="font-mono text-[10px] text-indigo-400 font-bold truncate max-w-[200px]" title="AULIBK_ava0E1QxLYbRUHI-PkmzzAtCkgKUfBa8O-6MRh2ukhB_Rp4n6Zbl86cXNATk-p6pvC2POzZ7Y">
                          AULIBK_ava0E...pOzZ7Y
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between py-1 border-b border-border-subtle">
                      <span>Hình thức:</span>
                      <strong className="text-heading">{paymentMethod}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border-subtle">
                      <span>Số tiền thanh toán:</span>
                      <strong className="text-primary font-mono text-sm">{finalPrice.toLocaleString('vi-VN')} VNĐ</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Nội dung chuyển khoản:</span>
                      <div className="flex items-center gap-1.5 font-mono font-bold text-primary">
                        <span>{activeOrder.transactionId}</span>
                        <button type="button" onClick={() => handleCopy(activeOrder.transactionId)} className="hover:text-heading border-0 bg-transparent cursor-pointer">
                          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    {activeOrder.paymentUrl && (
                      <div className="pt-2">
                        <a
                          href={activeOrder.paymentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2 px-3 rounded-xl bg-primary/20 text-primary hover:bg-primary/30 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors no-underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Mở cổng thanh toán {paymentMethod} trong cửa sổ mới
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {/* PayPal Smart Payment Buttons */}
              {paymentMethod === 'PAYPAL' && (
                <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 space-y-3 text-xs mt-4">
                  <div className="flex items-center justify-between font-bold text-xs text-indigo-400">
                    <span>Thanh toán trực tiếp bằng nút PayPal / Thẻ quốc tế:</span>
                    <span className="text-[10px] text-muted font-normal">PayPal SDK Sandbox</span>
                  </div>
                  <div id="paypal-button-container" className="w-full min-h-[120px] relative z-10"></div>
                </div>
              )}

              {/* Credit Card Input Form if CREDIT_CARD is chosen */}
              {paymentMethod === 'CREDIT_CARD' && (
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-3 text-xs mt-4">
                  <h5 className="font-bold text-emerald-400 text-xs">Thông tin thẻ Visa / Mastercard / JCB:</h5>
                  <div>
                    <label className="ui-label text-[10px] uppercase mb-1">Số thẻ quốc tế</label>
                    <input 
                      type="text" 
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4123 4567 8901 2345" 
                      className="ui-input px-3 py-2 text-xs font-mono" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="ui-label text-[10px] uppercase mb-1">Tên chủ thẻ (Viết hoa không dấu)</label>
                      <input 
                        type="text" 
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="NGUYEN VAN A" 
                        className="ui-input px-3 py-2 text-xs font-mono uppercase" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="ui-label text-[10px] uppercase mb-1">Hạn hết</label>
                        <input 
                          type="text" 
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="12/28" 
                          className="ui-input px-3 py-2 text-xs font-mono" 
                        />
                      </div>
                      <div>
                        <label className="ui-label text-[10px] uppercase mb-1">CVC/CVV</label>
                        <input 
                          type="text" 
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          placeholder="888" 
                          className="ui-input px-3 py-2 text-xs font-mono" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm & Status Alert Button */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={isProcessing || paymentSuccess || !activeOrder}
                className="w-full ui-btn-primary py-3.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-xl shadow-primary/25 hover:scale-[1.01] transition-all cursor-pointer border-0"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
                    <span>Đang kiểm tra và xác minh giao dịch tự động...</span>
                  </>
                ) : paymentSuccess ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <span>Thanh toán thành công! Đã kích hoạt gói {planType}</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-5 w-5" />
                    <span>Xác nhận đã chuyển khoản ({finalPrice.toLocaleString('vi-VN')} VNĐ)</span>
                  </>
                )}
              </button>

              {paymentSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold text-center animate-fadeIn space-y-2">
                  <p>🎉 Chúc mừng bạn! Giao dịch {paymentMethod} đã được hệ thống kiểm tra và tự động nâng cấp thành công.</p>
                  <Link href="/workspace" className="inline-block px-4 py-1.5 rounded-xl bg-emerald-500 text-white font-bold text-xs no-underline shadow-md">
                    Truy cập Workspace ngay
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Order Summary & Voucher */}
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
              <button type="submit" className="ui-btn-secondary px-3 py-2 text-xs font-bold shrink-0 border-0 rounded-xl cursor-pointer">
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
