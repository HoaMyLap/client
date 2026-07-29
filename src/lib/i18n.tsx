'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'vi' | 'en';

export const translations = {
  vi: {
    // Navigation & General
    home: 'Trang chủ',
    features: 'Tính năng',
    pricing: 'Bảng giá',
    terms: 'Điều khoản',
    contact: 'Liên hệ',
    workspace: 'Không gian làm việc',
    projects: 'Dự án',
    notifications: 'Thông báo',
    profile: 'Hồ sơ cá nhân',
    logout: 'Đăng xuất',
    login: 'Đăng nhập',
    register: 'Đăng ký',
    searchAi: 'Tìm kiếm AI...',
    aiReport: 'Báo cáo tiến độ AI',
    searchPlaceholder: 'Tìm kiếm công việc, dự án...',
    
    // Actions & Buttons
    create: 'Tạo mới',
    save: 'Lưu lại',
    cancel: 'Hủy bỏ',
    delete: 'Xóa',
    edit: 'Chỉnh sửa',
    upload: 'Tải lên',
    download: 'Tải về',
    confirm: 'Xác nhận',
    back: 'Quay lại',
    close: 'Đóng',
    upgradePro: 'Nâng cấp Pro',

    // Statuses
    todo: 'Cần làm',
    inProgress: 'Đang làm',
    done: 'Đã hoàn thành',
    urgent: 'Khẩn cấp',
    high: 'Cao',
    medium: 'Trung bình',
    low: 'Thấp',

    // Pricing Page
    pricingTitle: 'Bảng Giá Dịch Vụ Homix v2.0',
    pricingSubtitle: 'Lựa chọn gói dịch vụ tối ưu cho cá nhân, nhóm và doanh nghiệp của bạn',
    monthly: 'Thanh toán hàng tháng',
    annual: 'Thanh toán hàng năm',
    save20: 'Tiết kiệm 20%',
    freePlan: 'Cá Nhân (Miễn Phí)',
    freePrice: '0 VNĐ',
    freeDesc: 'Hoàn hảo cho sinh viên và cá nhân quản lý công việc hàng ngày',
    proPlan: 'Chuyên Nghiệp (Pro)',
    proPrice: '199.000 VNĐ',
    proDesc: 'Dành cho nhóm phát triển với sức mạnh AI 24/7 và Excel Import/Export',
    enterprisePlan: 'Doanh Nghiệp (Enterprise)',
    enterprisePrice: '499.000 VNĐ',
    enterpriseDesc: 'Giải pháp toàn diện cho doanh nghiệp lớn với Server AI riêng biệt',
    popularBadge: 'ĐƯỢC YÊU THÍCH NHẤT',
    currentPlan: 'Gói hiện tại',
    choosePlan: 'Bắt đầu ngay',
    upgradeNow: 'Nâng cấp ngay',
    contactSales: 'Liên hệ tư vấn',

    // Checkout Page
    checkoutTitle: 'Xác Nhận Thanh Toán & Nâng Cấp',
    orderSummary: 'Tóm tắt đơn hàng',
    selectedPackage: 'Gói dịch vụ đã chọn:',
    billingCycle: 'Chu kỳ thanh toán:',
    totalAmount: 'Tổng tiền thanh toán:',
    discountCode: 'Mã giảm giá / Voucher',
    applyCode: 'Áp dụng',
    paymentMethod: 'Phương thức thanh toán',
    qrBank: 'Chuyển khoản QR Bank (VietQR)',
    momo: 'Ví MoMo',
    card: 'Thẻ Quốc tế (Visa / Mastercard)',
    confirmPayment: 'Xác nhận đã thanh toán',
    scanToPay: 'Quét mã QR để hoàn tất thanh toán',
    accountOwner: 'Chủ tài khoản:',
    bankName: 'Ngân hàng:',
    accountNo: 'Số tài khoản:',
    contentTransfer: 'Nội dung chuyển khoản:',

    // Contact Page
    contactTitle: 'Liên Hệ & Hỗ Trợ Homix v2.0',
    contactSubtitle: 'Chúng tôi luôn sẵn sàng lắng nghe và giải đáp mọi thắc mắc của bạn 24/7',
    fullName: 'Họ và tên',
    email: 'Địa chỉ Email',
    phone: 'Số điện thoại',
    subject: 'Chủ đề liên hệ',
    message: 'Nội dung tin nhắn',
    sendContact: 'Gửi tin nhắn liên hệ',
    supportTech: 'Hỗ trợ kỹ thuật',
    supportBilling: 'Tư vấn gói Pro / Enterprise',
    feedback: 'Góp ý tính năng',
    reportBug: 'Báo lỗi hệ thống',
    address: 'Địa chỉ văn phòng',
    hotline: 'Tổng đài hỗ trợ',
    workHours: 'Giờ làm việc',
  },
  en: {
    // Navigation & General
    home: 'Home',
    features: 'Features',
    pricing: 'Pricing',
    terms: 'Terms',
    contact: 'Contact',
    workspace: 'Workspace',
    projects: 'Projects',
    notifications: 'Notifications',
    profile: 'Profile',
    logout: 'Logout',
    login: 'Login',
    register: 'Register',
    searchAi: 'AI Search...',
    aiReport: 'AI Progress Report',
    searchPlaceholder: 'Search tasks, projects...',

    // Actions & Buttons
    create: 'Create',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    upload: 'Upload',
    download: 'Download',
    confirm: 'Confirm',
    back: 'Back',
    close: 'Close',
    upgradePro: 'Upgrade Pro',

    // Statuses
    todo: 'To Do',
    inProgress: 'In Progress',
    done: 'Done',
    urgent: 'Urgent',
    high: 'High',
    medium: 'Medium',
    low: 'Low',

    // Pricing Page
    pricingTitle: 'Homix v2.0 Service Pricing',
    pricingSubtitle: 'Choose the optimal plan tailored for individuals, teams, and enterprise',
    monthly: 'Monthly Billing',
    annual: 'Annual Billing',
    save20: 'Save 20%',
    freePlan: 'Free Tier',
    freePrice: '$0',
    freeDesc: 'Perfect for students and individuals managing personal tasks',
    proPlan: 'Professional (Pro)',
    proPrice: '$9.99',
    proDesc: 'Ideal for agile teams with 24/7 AI power & Excel batch import/export',
    enterprisePlan: 'Enterprise',
    enterprisePrice: '$24.99',
    enterpriseDesc: 'Comprehensive solution for large orgs with Dedicated AI Server',
    popularBadge: 'MOST POPULAR',
    currentPlan: 'Current Plan',
    choosePlan: 'Get Started',
    upgradeNow: 'Upgrade Now',
    contactSales: 'Contact Sales',

    // Checkout Page
    checkoutTitle: 'Checkout & Subscription Upgrade',
    orderSummary: 'Order Summary',
    selectedPackage: 'Selected Plan:',
    billingCycle: 'Billing Cycle:',
    totalAmount: 'Total Payment:',
    discountCode: 'Voucher / Coupon Code',
    applyCode: 'Apply',
    paymentMethod: 'Payment Method',
    qrBank: 'VietQR / Bank Transfer',
    momo: 'MoMo E-Wallet',
    card: 'Credit / Debit Card (Visa / Mastercard)',
    confirmPayment: 'Confirm Payment',
    scanToPay: 'Scan QR code to complete payment',
    accountOwner: 'Account Holder:',
    bankName: 'Bank:',
    accountNo: 'Account Number:',
    contentTransfer: 'Transfer Note:',

    // Contact Page
    contactTitle: 'Contact & Support Homix v2.0',
    contactSubtitle: 'We are here to assist you and answer any questions 24/7',
    fullName: 'Full Name',
    email: 'Email Address',
    phone: 'Phone Number',
    subject: 'Subject',
    message: 'Message Content',
    sendContact: 'Send Message',
    supportTech: 'Technical Support',
    supportBilling: 'Pro / Enterprise Consultation',
    feedback: 'Feature Request',
    reportBug: 'Report a Bug',
    address: 'Office Address',
    hotline: 'Support Hotline',
    workHours: 'Working Hours',
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['vi']) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'vi',
  setLanguage: () => {},
  t: (key) => translations.vi[key] || key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('vi');

  useEffect(() => {
    const savedLang = localStorage.getItem('homix_lang') as Language;
    if (savedLang === 'vi' || savedLang === 'en') {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('homix_lang', lang);
  };

  const t = (key: keyof typeof translations['vi']): string => {
    return translations[language]?.[key] || translations['vi']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
