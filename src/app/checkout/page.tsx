'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
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
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Active Order State
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const paypalRenderedRef = useRef(false);

  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');

  // VNPay / Gateway Return URL Parameters
  const vnpResponseCode = searchParams.get('vnp_ResponseCode');
  const vnpTxnRef = searchParams.get('vnp_TxnRef');

  // Price calculations
  const basePrice = planType === 'ENTERPRISE' 
    ? (billing === 'annual' ? 399000 : 499000)
    : (billing === 'annual' ? 159000 : 199000);

  const finalPrice = Math.max(0, Math.round(basePrice * (1 - discount)));

  // Auto detect Gateway Redirect Return Callback (VNPay)
  useEffect(() => {
    const handleGatewayReturn = async () => {
      if (vnpResponseCode && vnpTxnRef) {
        setIsProcessing(true);
        try {
          if (vnpResponseCode === '00') {
            const completed = await api.payments.confirmPayment({ transactionId: vnpTxnRef });
            setActiveOrder(completed);
            setPaymentSuccess(true);
            setPaymentError(null);
          } else {
            setPaymentError(
              language === 'vi'
                ? `Giao dịch VNPay không thành công hoặc bị hủy (Mã lỗi: ${vnpResponseCode}). Vui lòng thử lại.`
                : `VNPay transaction failed or cancelled (Code: ${vnpResponseCode}).`
            );
          }
        } catch (err: any) {
          console.error('Lỗi kiểm tra VNPay callback:', err);
          setPaymentError(err.message || (language === 'vi' ? 'Không thể xác minh giao dịch VNPay.' : 'Failed to verify VNPay transaction.'));
        } finally {
          setIsProcessing(false);
        }
      }
    };

    handleGatewayReturn();
  }, [vnpResponseCode, vnpTxnRef, language]);

  // Auto Create Order on paymentMethod or Voucher change
  useEffect(() => {
    handleCreateOrder();
  }, [paymentMethod, appliedVoucher]);

  // PayPal Smart Buttons SDK Loader & Renderer
  useEffect(() => {
    if (paymentMethod !== 'PAYPAL' || !activeOrder) {
      paypalRenderedRef.current = false;
      return;
    }

    if (paypalRenderedRef.current) return;

    const clientId = 'AULIBK_ava0E1QxLYbRUHI-PkmzzAtCkgKUfBa8O-6MRh2ukhB_Rp4n6Zbl86cXNATk-p6pvC2POzZ7Y';
    const scriptId = 'paypal-js-sdk-script';

    const renderPayPalButtons = () => {
      const container = document.getElementById('paypal-button-container');
      if (!(window as any).paypal || !container) return;

      if (container.children.length > 0) {
        container.innerHTML = '';
      }

      try {
        paypalRenderedRef.current = true;
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
            console.warn('PayPal Smart Button notice:', err);
          }
        }).render('#paypal-button-container').catch((err: any) => {
          console.warn('Handled PayPal render exception:', err);
        });
      } catch (e) {
        console.warn('Error rendering PayPal buttons:', e);
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

  return (
    <main className="max-w-6xl mx-auto px-6 py-10 w-full">
      {/* Back button */}
      <Link href="/pricing" className="inline-flex items-center gap-2 text-xs font-bold text-secondary hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        <span>{language === 'vi' ? 'QUAY LẠI BẢNG GIÁ' : 'BACK TO PRICING'}</span>
      </Link>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Side: Payment Methods & Process */}
        <div className="flex-1 space-y-6">
          <div className="glass p-8 rounded-3xl border border-border shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-6 border-b border-border-subtle">
              <div>
                <h1 className="text-2xl font-bold font-display text-heading flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  {language === 'vi' ? 'Thanh toán Gói dịch vụ' : 'Checkout & Upgrade Plan'}
                </h1>
                <p className="text-xs text-secondary mt-1">
                  {language === 'vi' ? 'Hệ thống kiểm tra giao dịch tự động 24/7 qua Webhook & IPN' : '24/7 Automated Transaction Verification via Webhook & IPN'}
                </p>
              </div>

              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" /> Auto Check IPN
              </span>
            </div>

            {/* 4 Payment Method Selector Tabs */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-heading uppercase tracking-wider block">
                {language === 'vi' ? '1. Chọn hình thức thanh toán' : '1. Select Payment Method'}
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
                  <div className="text-[9px] opacity-70">{language === 'vi' ? 'Quét mã / ATM' : 'QR Scan / Local ATM'}</div>
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
                  <div className="text-[9px] opacity-70">{language === 'vi' ? 'Ví MoMo App' : 'MoMo App'}</div>
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
                  <div className="text-[9px] opacity-70">{language === 'vi' ? 'USD / Quốc tế' : 'USD / International'}</div>
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
                  <div className="text-xs font-bold">{language === 'vi' ? 'Thẻ Quốc Tế' : 'Credit Card'}</div>
                  <div className="text-[9px] opacity-70">Visa / Mastercard</div>
                </button>
              </div>
            </div>

            {/* Payment Details Container */}
            <div className="p-6 rounded-2xl bg-surface/60 border border-border space-y-4">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <span className="text-xs font-bold text-heading uppercase">
                  {language === 'vi' ? '2. Thông tin giao dịch thanh toán' : '2. Payment Transaction Details'}
                </span>
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 animate-pulse">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  {language === 'vi' ? 'Tự động kiểm tra giao dịch mỗi 3 giây' : 'Auto check transaction every 3s'}
                </span>
              </div>

              {isCreatingOrder ? (
                <div className="flex flex-col items-center justify-center py-10 text-xs text-muted gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary/20 border-t-primary" />
                  {language === 'vi' ? 'Đang khởi tạo mã giao dịch tự động...' : 'Initializing transaction order...'}
                </div>
              ) : activeOrder ? (
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* QR Image or PayPal Badge */}
                  {paymentMethod === 'PAYPAL' ? (
                    <div className="p-4 bg-gradient-to-br from-indigo-950 to-blue-900 border border-indigo-500/30 rounded-2xl shadow-lg shrink-0 text-center text-white space-y-2 w-44">
                      <CreditCard className="h-10 w-10 text-amber-400 mx-auto" />
                      <div className="text-xs font-bold font-display">PayPal Payment</div>
                      <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30 block">
                        Verified Merchant
                      </span>
                    </div>
                  ) : (
                    <div className="p-3 bg-white rounded-2xl shadow-lg shrink-0 text-center">
                      <img 
                        src={activeOrder.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${activeOrder.transactionId}`} 
                        alt="Payment QR Code"
                        className="w-40 h-40 object-contain mx-auto"
                      />
                      <span className="text-[10px] font-bold text-zinc-800 mt-1 block">
                        {paymentMethod} QR Code
                      </span>
                    </div>
                  )}

                  <div className="space-y-2 text-xs text-secondary flex-1 w-full">
                    <div className="flex justify-between py-1 border-b border-border-subtle">
                      <span>{language === 'vi' ? 'Mã giao dịch:' : 'Transaction ID:'}</span>
                      <strong className="text-primary font-mono">{activeOrder.transactionId}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border-subtle">
                      <span>{language === 'vi' ? 'Đơn vị thụ hưởng:' : 'Beneficiary:'}</span>
                      <strong className="text-heading">
                        {paymentMethod === 'PAYPAL' ? 'PayPal App: Homix' : 'HOMIX ECOSYSTEM JOINT STOCK COMPANY'}
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
                      <span>{language === 'vi' ? 'Hình thức:' : 'Payment Method:'}</span>
                      <strong className="text-heading">{paymentMethod}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border-subtle">
                      <span>{language === 'vi' ? 'Số tiền thanh toán:' : 'Payment Amount:'}</span>
                      <strong className="text-primary font-mono text-sm">{finalPrice.toLocaleString('vi-VN')} VNĐ ({planType === 'ENTERPRISE' ? '$19.99 USD' : '$7.99 USD'})</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>{language === 'vi' ? 'Nội dung chuyển khoản:' : 'Transfer Memo:'}</span>
                      <div className="flex items-center gap-1.5 font-mono font-bold text-primary">
                        <span>{activeOrder.transactionId}</span>
                        <button type="button" onClick={() => handleCopy(activeOrder.transactionId)} className="hover:text-heading border-0 bg-transparent cursor-pointer">
                          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                    {activeOrder.paymentUrl && (
                      <div className="pt-3 border-t border-border-subtle">
                        <a
                          href={activeOrder.paymentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/20 no-underline cursor-pointer"
                        >
                          <ExternalLink className="h-4 w-4" />
                          {language === 'vi' ? `Mở cổng thanh toán ${paymentMethod} trong cửa sổ mới ➔` : `Open ${paymentMethod} Gateway in New Window ➔`}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {/* PayPal Smart Payment Buttons */}
              {paymentMethod === 'PAYPAL' && (
                <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 space-y-4 text-xs mt-4">
                  <div className="flex items-center justify-between font-bold text-xs text-indigo-400 border-b border-indigo-500/20 pb-2">
                    <span>{language === 'vi' ? 'Thanh toán trực tiếp bằng nút PayPal chính thức:' : 'Direct Payment via Official PayPal Buttons:'}</span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      PayPal SDK Active
                    </span>
                  </div>

                  {/* PayPal Yellow Button Container */}
                  <div id="paypal-button-container" className="w-full min-h-[120px] relative z-10"></div>
                </div>
              )}

              {/* Credit Card Input Form if CREDIT_CARD is chosen */}
              {paymentMethod === 'CREDIT_CARD' && (
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-3 text-xs mt-4">
                  <h5 className="font-bold text-emerald-400 text-xs">
                    {language === 'vi' ? 'Thông tin thẻ Visa / Mastercard / JCB:' : 'International Card Details (Visa / Mastercard / JCB):'}
                  </h5>
                  <div>
                    <label className="ui-label text-[10px] uppercase mb-1">
                      {language === 'vi' ? 'Số thẻ quốc tế' : 'Card Number'}
                    </label>
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
                      <label className="ui-label text-[10px] uppercase mb-1">
                        {language === 'vi' ? 'Tên chủ thẻ (Viết hoa không dấu)' : 'Cardholder Name (UPPERCASE)'}
                      </label>
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
                        <label className="ui-label text-[10px] uppercase mb-1">
                          {language === 'vi' ? 'Hạn hết' : 'Expiry Date'}
                        </label>
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

            {/* Status Notifications & Dynamic Feedback Cards */}
            <div className="space-y-3 pt-2">
              {isProcessing && (
                <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold text-center flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary/20 border-t-primary" />
                  <span>
                    {language === 'vi' ? 'Đang kiểm tra và xác minh kết quả thanh toán từ hệ thống...' : 'Verifying payment result from gateway system...'}
                  </span>
                </div>
              )}

              {paymentSuccess && (
                <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold text-center animate-fadeIn space-y-3 shadow-xl">
                  <div className="flex items-center justify-center gap-2 text-base text-emerald-400 font-display">
                    <CheckCircle2 className="h-6 w-6" />
                    <span>{language === 'vi' ? 'THANH TOÁN THÀNH CÔNG!' : 'PAYMENT SUCCESSFUL!'}</span>
                  </div>
                  <p className="leading-relaxed font-normal text-emerald-300">
                    {language === 'vi' ? (
                      <>Giao dịch qua <strong>{paymentMethod}</strong> đã được hệ thống xác thực thành công. Gói dịch vụ <strong>{planType} ({billing})</strong> của bạn đã được tự động kích hoạt.</>
                    ) : (
                      <>Payment via <strong>{paymentMethod}</strong> verified successfully. Your <strong>{planType} ({billing})</strong> plan is now active.</>
                    )}
                  </p>
                  <div className="pt-1">
                    <Link href="/workspace" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs no-underline shadow-lg shadow-emerald-500/25 transition-all">
                      <span>{language === 'vi' ? 'Truy cập Workspace của bạn ngay' : 'Access Your Workspace Now'}</span> ➔
                    </Link>
                  </div>
                </div>
              )}

              {paymentError && (
                <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold text-center animate-fadeIn space-y-2.5 shadow-xl">
                  <div className="flex items-center justify-center gap-2 text-sm font-display text-rose-400">
                    <AlertCircle className="h-5 w-5" />
                    <span>{language === 'vi' ? 'THANH TOÁN THẤT BẠI HOẶC BỊ HỦY' : 'PAYMENT FAILED OR CANCELLED'}</span>
                  </div>
                  <p className="font-normal text-rose-300 leading-relaxed">{paymentError}</p>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentError(null);
                        handleCreateOrder();
                      }}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all border-0 cursor-pointer"
                    >
                      {language === 'vi' ? 'Thử lại giao dịch' : 'Retry Payment'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Order Summary & Voucher */}
        <div className="w-full lg:w-96 space-y-6 shrink-0">
          <div className="glass p-6 rounded-3xl border border-border shadow-xl space-y-5">
            <h3 className="text-sm font-bold text-heading uppercase tracking-wider border-b border-border-subtle pb-3">
              {language === 'vi' ? 'Tóm tắt đơn hàng' : 'Order Summary'}
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-secondary">{language === 'vi' ? 'Gói đã chọn' : 'Selected Package'}</span>
                <strong className="text-primary font-bold">{planType} Package</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">{language === 'vi' ? 'Chu kỳ thanh toán' : 'Billing Cycle'}</span>
                <strong className="text-heading uppercase font-bold">{billing}</strong>
              </div>
              {appliedVoucher && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>{language === 'vi' ? 'Ưu đãi Voucher:' : 'Voucher Discount:'}</span>
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
                  placeholder={language === 'vi' ? 'Mã voucher (ví dụ HOMIX2026)' : 'Voucher code (e.g. HOMIX2026)'}
                  className="ui-input pl-9 pr-3 py-2 text-xs uppercase font-mono"
                />
              </div>
              <button type="submit" className="ui-btn-secondary px-3 py-2 text-xs font-bold shrink-0 border-0 rounded-xl cursor-pointer">
                {language === 'vi' ? 'Áp dụng' : 'Apply'}
              </button>
            </form>

            {/* Total Price Card */}
            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-muted uppercase font-bold">
                  {language === 'vi' ? 'Tổng tiền thanh toán' : 'Total Amount'}
                </div>
                <div className="text-xl font-black font-display text-primary">
                  {finalPrice.toLocaleString('vi-VN')} VNĐ
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                {language === 'vi' ? 'Đã gồm thuế VAT' : 'VAT Inclusive'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  const { language } = useLanguage();
  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Suspense fallback={
          <div className="p-12 text-center text-xs font-bold">
            {language === 'vi' ? 'Đang tải thông tin thanh toán...' : 'Loading payment details...'}
          </div>
        }>
          <CheckoutContent />
        </Suspense>
      </div>
    </div>
  );
}
