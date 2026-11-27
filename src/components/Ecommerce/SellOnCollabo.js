import React, { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import {
  Store, TrendingUp, Shield, Truck, BarChart3, Users, Package,
  ArrowRight, ArrowLeft, ArrowUp, CheckCircle, ChevronDown, ChevronUp, Eye, EyeOff,
  Mail, Lock, User, Phone, AlertCircle, Upload, X, MapPin,
  FileText, CreditCard, Building2, Layers, Megaphone, Tag, UploadCloud, LayoutDashboard, Wallet,
  Headphones, Percent, Gift, Clock, Zap,
} from 'lucide-react';
import { SELLER_TERMS_INTRO, SELLER_TERMS_SECTIONS } from './sellerTerms';
import { getRoundedCategoryIcon } from './CategoryIcons';

const STEPS_INFO = [
  { step: '01', title: 'Create Account', desc: 'Sign up with email and phone. Takes under 2 minutes.' },
  { step: '02', title: 'Complete KYC', desc: 'Add GST, bank details, and upload verification documents.' },
  { step: '03', title: 'List Products', desc: 'Add products manually or bulk import via CSV from Shopify.' },
  { step: '04', title: 'Start Earning', desc: 'Receive orders, ship via Shiprocket, get paid to your bank.' },
];

const BENEFITS = [
  { icon: Users, title: 'Growing Customer Base', desc: 'Instant visibility to our active buyer community.' },
  { icon: TrendingUp, title: 'Influencer Marketing', desc: 'Creators promote your products. Pay only on actual sales.' },
  { icon: Truck, title: 'Major Courier Partners', desc: 'Shiprocket integration with top delivery partners. Auto-tracking.' },
  { icon: Shield, title: 'Secure Payments', desc: '7-day settlement. Transparent fees. Withdraw anytime.' },
  { icon: BarChart3, title: 'Seller Dashboard', desc: 'Real-time analytics, orders, inventory, and earnings.' },
  { icon: Package, title: 'Bulk Import', desc: 'Upload products from Shopify or any platform via CSV.' },
];

const SELLING_CATEGORY_OPTIONS = [
  'Home & Kitchen', 'Fashion & Apparel', 'Electronics', 'Mobile & Accessories',
  'Health & Personal Care', 'Beauty & Personal Care', 'Kids', 'Korean Products',
  'Jewellery', 'Furniture', 'Home Improvement', 'Toys & Games', 'Industrial & Scientific',
];

const FAQS = [
  {
    q: 'What documents do I need to register as a seller?',
    a: 'You need a valid 15-character GSTIN, a 10-character PAN number with a clear photo or PDF of your PAN card, an active bank account (account number + IFSC code, with optional cheque/statement proof), and your business or warehouse pickup address.',
  },
  {
    q: 'What are the selling fees and commission on Collabo?',
    a: 'Collabo charges 0% platform commission, ₹0 listing fees, and no monthly subscription charges.',
  },
  {
    q: 'How do Collabo Product Ads and the 10,000 free credits work?',
    a: 'Every first-time seller gets 10,000 free ad credits to run sponsored product ads on Collabo. When a shopper clicks your product ad, 15 credits are deducted. Once your free starter credits are used, you can continue with flexible paid ad plans.',
  },
  {
    q: 'How long does seller KYC verification take?',
    a: 'After you verify your email and submit your seller KYC details, our team reviews your application within 24–48 hours. You will be notified as soon as your seller account is approved.',
  },
  {
    q: 'How and when do I receive payments?',
    a: 'Your order earnings are tracked in real time inside your Seller Dashboard. Settlements follow a 7-business-day cycle after delivery, and you can withdraw directly to your verified bank account anytime (minimum withdrawal ₹100).',
  },
  {
    q: 'How do shipping, tracking, and returns work?',
    a: 'You pack and dispatch orders from your registered pickup/warehouse address using integrated Shiprocket (auto AWB + doorstep pickup) or your own preferred courier by entering the tracking number. Sellers also define and manage their own return and cancellation policy.',
  },
  {
    q: 'Can I upload products in bulk?',
    a: 'Yes. Once your seller account is active, you can add products manually one by one or bulk import your catalog via CSV (including exports from Shopify or standard spreadsheets) from your Seller Dashboard.',
  },
];

const SELLER_GROWTH_TOOLS = [
  {
    id: 'collabo-ads',
    icon: TrendingUp,
    title: 'Collabo Product Ads',
    desc: 'Promote your products across Collabo with sponsored ads. New sellers get 10,000 free ad credits to start — just 15 credits per click.',
    badge: '10,000 Free Starter Credits',
    overview: 'Put your products in front of high-intent shoppers on Collabo. Every first-time seller gets 10,000 free ad credits to test sponsored placements, with flexible paid ad plans available once you are ready to scale.',
    steps: [
      'Receive 10,000 free starter ad credits automatically as a new seller on Collabo.',
      'Select the products you want to feature as sponsored ads across the Collabo storefront.',
      'Pay only for actual shopper interest — 15 credits are deducted only when a user clicks your product ad.',
      'After using your 10,000 free credits, upgrade anytime with flexible Collabo Ad Plans to keep growing.',
    ],
    highlights: ['10,000 Free First Credits', '15 Credits Per Click', 'Flexible Ad Plans'],
  },
  {
    id: 'creators',
    icon: Megaphone,
    title: 'Creator Promotions',
    desc: 'Let Collabo creators and influencers feature your products to active shoppers — pay commission only on actual sales.',
    badge: 'Zero Upfront Ad Spend',
    overview: 'Collabo connects marketplace products with creators and affiliates who share curated picks with their followers, driving organic discovery without prepaid ad budgets.',
    steps: [
      'List your products with clear photos, accurate pricing, and stock quantities.',
      'Creators discover and share your products with their audiences via Collabo referral links.',
      'Orders generated through creator links are tracked automatically in the platform.',
      'You keep full control over fulfillment and pay commission only on completed sales.',
    ],
    highlights: ['Pay Only On Sales', 'Organic Creator Reach', 'Automatic Order Tracking'],
  },
  {
    id: 'deals',
    icon: Tag,
    title: 'Deals & Coupon Campaigns',
    desc: 'Run store discounts, promo codes, and featured deal placements so your products stand out to buyers.',
    badge: 'Higher Conversion',
    overview: 'Control your own pricing and discount offers across your catalog while staying compliant with MRP guidelines, helping your listings stand out on the Collabo storefront.',
    steps: [
      'Set your MRP and discounted selling price when creating or editing any product listing.',
      'Discount percentages (% off) display automatically on product cards and detail pages.',
      'Participate in storefront coupon campaigns and seasonal deal sections to reach high-intent buyers.',
      'Update prices or stock levels anytime directly from your Seller Dashboard.',
    ],
    highlights: ['Self-Serve Pricing', 'Automatic % Off Badges', 'Storefront Promo Visibility'],
  },
  {
    id: 'csv',
    icon: UploadCloud,
    title: 'Bulk CSV Import',
    desc: 'Bring your existing catalog from Shopify or spreadsheets in minutes via CSV upload, or add items one by one.',
    badge: 'Fast Onboarding',
    overview: 'Whether you are launching with 5 products or 200+, Collabo lets you upload your catalog quickly without manual copy-pasting.',
    steps: [
      'Prepare your product sheet or export your existing catalog CSV from Shopify or another store.',
      'Upload the CSV file inside your Seller Dashboard to import titles, descriptions, prices, and stock.',
      'Review imported items, verify category assignments, and fine-tune images or variants.',
      'Publish live to the Collabo marketplace with ₹0 listing fees.',
    ],
    highlights: ['Shopify CSV Compatible', 'Single or Bulk Upload', '₹0 Listing Fee'],
  },
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    title: 'Seller Dashboard',
    desc: 'Manage inventory, track orders, monitor product performance, and review earnings in real time from one place.',
    badge: 'All-in-One Control',
    overview: 'Once your seller KYC application is verified (typically within 24–48 hours), your Seller Dashboard becomes your daily command center.',
    steps: [
      'Complete the 2-step onboarding: create your account and submit Store Profile, GSTIN/PAN, Bank Details, and Selling Preferences.',
      'Wait for quick team verification (24–48 hours) — status updates automatically in your account.',
      'Manage product listings, stock counts, incoming orders, shipping updates, and returns from one panel.',
      'Track total sales, commissions, and withdrawable balance in real time.',
    ],
    highlights: ['24–48 Hr KYC Review', 'Live Order & Stock Control', 'Real-Time Earnings'],
  },
  {
    id: 'settlements',
    icon: Wallet,
    title: '7-Day Bank Settlements',
    desc: 'Zero listing fees, 0% commission charge on sales, and direct withdrawals (min ₹100) to your bank account.',
    badge: 'Transparent Payouts',
    overview: 'Collabo keeps selling simple and rewarding: no monthly subscription, no listing charges, 0% commission charge, and direct settlement to your verified bank account.',
    steps: [
      'Add your bank account number, IFSC code, and optional bank proof during seller verification.',
      'When an order is delivered and completed, your order earnings (with 0% platform commission) are credited to your seller balance.',
      'Payouts follow a 7-business-day settlement cycle with full per-order breakdown.',
      'Withdraw available funds directly to your registered bank account anytime (minimum ₹100).',
    ],
    highlights: ['₹0 Monthly Fee', '0% Commission Charge', 'Min ₹100 Withdrawal'],
  },
];

const SUPPORT_TOPICS = [
  { value: 'account', label: 'Seller Account & KYC' },
  { value: 'payment', label: 'Payments & Settlements' },
  { value: 'technical', label: 'Technical & Listing Issue' },
  { value: 'campaign', label: 'Creator Promotions & Deals' },
  { value: 'partnership', label: 'Business & Partnership' },
  { value: 'other', label: 'Other Query' },
];

const STEP_ILLUSTRATION_IMAGES = {
  account: '/images/seller-step-1-account.jpg',
  kyc: '/images/seller-step-2-kyc.jpg',
  list: '/images/seller-step-3-products.jpg',
  earn: '/images/seller-step-4-earning.jpg',
};

function StepIllustration({ type, alt = '' }) {
  return (
    <img
      src={STEP_ILLUSTRATION_IMAGES[type]}
      alt={alt}
      loading="lazy"
      className="w-[148px] h-[148px] object-contain mix-blend-multiply select-none pointer-events-none"
    />
  );
}

function ToolBadgeIcon({ id, className = 'w-11 h-11' }) {
  switch (id) {
    case 'collabo-ads':
      return (
        <svg viewBox="0 0 44 44" fill="none" className={className} aria-hidden="true">
          <rect width="44" height="44" rx="14" fill="#EAF5F5" />
          <rect x="10" y="25" width="5" height="9" rx="2" fill="#8CCAC7" />
          <rect x="18" y="20" width="5" height="14" rx="2" fill="#1B6B6B" />
          <rect x="26" y="15" width="5" height="19" rx="2" fill="#F26B3A" />
          <path d="M11 20L19.5 13.5L25 16.5L33 9.5" stroke="#0C2538" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M27.5 9.5H33V15" stroke="#0C2538" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="34.5" cy="22" r="2.2" fill="#FBBF24" />
        </svg>
      );
    case 'creators':
      return (
        <svg viewBox="0 0 44 44" fill="none" className={className} aria-hidden="true">
          <rect width="44" height="44" rx="14" fill="#FFF3EE" />
          <path d="M11 20.5C11 18.8 12.3 17.5 14 17.5H17.5L28 12.2C29.1 11.6 30.5 12.4 30.5 13.7V28.3C30.5 29.6 29.1 30.4 28 29.8L17.5 24.5H14C12.3 24.5 11 23.2 11 21.5V20.5Z" fill="#FFFFFF" stroke="#0C2538" strokeWidth="2.1" strokeLinejoin="round" />
          <path d="M17.5 17.5V24.5L28 29.8C29.1 30.4 30.5 29.6 30.5 28.3V13.7C30.5 12.4 29.1 11.6 28 12.2L17.5 17.5Z" fill="#F26B3A" fillOpacity="0.22" />
          <path d="M15 24.5L16.8 31.2C17.1 32.3 18.2 33 19.3 32.7C20.4 32.4 21 31.3 20.7 30.2L19.2 25.4" stroke="#0C2538" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M34 16.5C35.8 18 36.5 20.2 36 22.8" stroke="#F26B3A" strokeWidth="2.3" strokeLinecap="round" />
          <path d="M33.5 10.5L34.3 12.4L36.2 13.2L34.3 14L33.5 15.9L32.7 14L30.8 13.2L32.7 12.4Z" fill="#1B6B6B" />
        </svg>
      );
    case 'deals':
      return (
        <svg viewBox="0 0 44 44" fill="none" className={className} aria-hidden="true">
          <rect width="44" height="44" rx="14" fill="#EAF5F5" />
          <path d="M12 13.5C12 11.8 13.3 10.5 15 10.5H22.2C23.1 10.5 23.9 10.8 24.5 11.5L33.2 20.2C34.5 21.5 34.5 23.6 33.2 24.9L25.4 32.7C24.1 34 22 34 20.7 32.7L12 24C11.3 23.4 11 22.6 11 21.7V14.5C11 13.9 11.4 13.5 12 13.5Z" fill="#FFFFFF" stroke="#0C2538" strokeWidth="2.1" strokeLinejoin="round" />
          <circle cx="16.8" cy="16.3" r="2.1" fill="#F26B3A" />
          <path d="M19.5 26.5L26.5 19.5" stroke="#1B6B6B" strokeWidth="2.3" strokeLinecap="round" />
          <circle cx="20.2" cy="20.5" r="1.5" fill="#1B6B6B" />
          <circle cx="25.8" cy="25.5" r="1.5" fill="#F26B3A" />
          <path d="M33.5 11.5L34.2 13.2L35.9 13.9L34.2 14.6L33.5 16.3L32.8 14.6L31.1 13.9L32.8 13.2Z" fill="#F26B3A" />
        </svg>
      );
    case 'csv':
      return (
        <svg viewBox="0 0 44 44" fill="none" className={className} aria-hidden="true">
          <rect width="44" height="44" rx="14" fill="#FFF3EE" />
          <path d="M15.2 28.5H13.5C10.5 28.5 8.5 26.3 8.5 23.6C8.5 21.2 10.2 19.1 12.6 18.8C13.6 14.5 17.4 11.5 22 11.5C27.2 11.5 31.3 15.5 31.5 20.6C33.8 21.1 35.5 23 35.5 25.3C35.5 27.1 34.3 28.5 32.3 28.5H28.8" fill="#FFFFFF" stroke="#0C2538" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="22" cy="27.5" r="6.8" fill="#1B6B6B" />
          <path d="M22 30.8V24.5M19.2 27L22 24.2L24.8 27" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="31.5" cy="13.5" r="2.2" fill="#F26B3A" />
        </svg>
      );
    case 'dashboard':
      return (
        <svg viewBox="0 0 44 44" fill="none" className={className} aria-hidden="true">
          <rect width="44" height="44" rx="14" fill="#EAF5F5" />
          <rect x="9.5" y="10.5" width="25" height="23" rx="5" fill="#FFFFFF" stroke="#0C2538" strokeWidth="2.1" />
          <path d="M9.5 17.5H34.5" stroke="#0C2538" strokeWidth="1.9" />
          <circle cx="13.8" cy="14" r="1.3" fill="#F26B3A" />
          <circle cx="17.8" cy="14" r="1.3" fill="#FBBF24" />
          <circle cx="21.8" cy="14" r="1.3" fill="#1B6B6B" />
          <rect x="13" y="21" width="7.5" height="8.5" rx="2" fill="#EAF5F5" stroke="#1B6B6B" strokeWidth="1.6" />
          <rect x="23.5" y="21" width="7.5" height="4" rx="1.5" fill="#F26B3A" />
          <rect x="23.5" y="26.8" width="7.5" height="2.7" rx="1.2" fill="#0C2538" fillOpacity="0.25" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 44 44" fill="none" className={className} aria-hidden="true">
          <rect width="44" height="44" rx="14" fill="#FFF3EE" />
          <rect x="9.5" y="15.5" width="24" height="17.5" rx="4.5" fill="#FFFFFF" stroke="#0C2538" strokeWidth="2.1" />
          <path d="M12.5 15.5V13.8C12.5 12.1 13.8 11 15.5 11H28.5" stroke="#0C2538" strokeWidth="2.1" strokeLinecap="round" />
          <rect x="23.5" y="21.2" width="10" height="6" rx="3" fill="#1B6B6B" />
          <circle cx="26.8" cy="24.2" r="1.2" fill="#FFFFFF" />
          <circle cx="30.5" cy="13.5" r="5.8" fill="#F26B3A" stroke="#FFFFFF" strokeWidth="1.8" />
          <text x="30.5" y="16.4" textAnchor="middle" fill="#FFFFFF" fontSize="8.5" fontWeight="800" fontFamily="sans-serif">₹</text>
        </svg>
      );
  }
}

const GROWING_GRAPH_CSS = `
@keyframes cg-bar-1 {
  0%, 4%   { transform: scaleY(0); opacity: 0; }
  16%, 86% { transform: scaleY(1); opacity: 1; }
  94%, 100%{ transform: scaleY(0); opacity: 0; }
}
@keyframes cg-bar-2 {
  0%, 11%  { transform: scaleY(0); opacity: 0; }
  23%, 86% { transform: scaleY(1); opacity: 1; }
  94%, 100%{ transform: scaleY(0); opacity: 0; }
}
@keyframes cg-bar-3 {
  0%, 18%  { transform: scaleY(0); opacity: 0; }
  30%, 86% { transform: scaleY(1); opacity: 1; }
  94%, 100%{ transform: scaleY(0); opacity: 0; }
}
@keyframes cg-bar-4 {
  0%, 25%  { transform: scaleY(0); opacity: 0; }
  37%, 86% { transform: scaleY(1); opacity: 1; }
  94%, 100%{ transform: scaleY(0); opacity: 0; }
}
@keyframes cg-bar-5 {
  0%, 32%  { transform: scaleY(0); opacity: 0; }
  44%, 86% { transform: scaleY(1); opacity: 1; }
  94%, 100%{ transform: scaleY(0); opacity: 0; }
}
@keyframes cg-arrow-reveal {
  0%, 16%  { transform: translateX(-235px); }
  52%, 86% { transform: translateX(0px); }
  94%, 100%{ transform: translateX(-235px); }
}
@keyframes cg-arrow-fade {
  0%, 16%  { opacity: 0; }
  22%, 86% { opacity: 1; }
  94%, 100%{ opacity: 0; }
}
@keyframes cg-sparkle {
  0%, 46%  { transform: scale(0); opacity: 0; }
  56%      { transform: scale(1.2); opacity: 1; }
  64%, 86% { transform: scale(1); opacity: 0.9; }
  94%, 100%{ transform: scale(0); opacity: 0; }
}
.cg-bar { transform-box: fill-box; transform-origin: 50% 100%; }
.cg-b1 { animation: cg-bar-1 5s cubic-bezier(0.22, 1, 0.36, 1) infinite; }
.cg-b2 { animation: cg-bar-2 5s cubic-bezier(0.22, 1, 0.36, 1) infinite; }
.cg-b3 { animation: cg-bar-3 5s cubic-bezier(0.22, 1, 0.36, 1) infinite; }
.cg-b4 { animation: cg-bar-4 5s cubic-bezier(0.22, 1, 0.36, 1) infinite; }
.cg-b5 { animation: cg-bar-5 5s cubic-bezier(0.22, 1, 0.36, 1) infinite; }
.cg-arrow-clip-rect { animation: cg-arrow-reveal 5s cubic-bezier(0.35, 0, 0.2, 1) infinite; }
.cg-arrow-group { animation: cg-arrow-fade 5s ease-in-out infinite; }
.cg-spark { transform-box: fill-box; transform-origin: center; animation: cg-sparkle 5s ease-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .cg-b1, .cg-b2, .cg-b3, .cg-b4, .cg-b5, .cg-arrow-clip-rect, .cg-arrow-group, .cg-spark {
    animation: none !important;
    transform: none !important;
    opacity: 1 !important;
  }
}
`;

function GrowingGraphIllustration() {
  return (
    <div className="w-full max-w-[320px] mx-auto select-none pointer-events-none">
      <style>{GROWING_GRAPH_CSS}</style>
      <svg viewBox="0 0 340 270" fill="none" className="w-full h-auto" aria-hidden="true">
        <defs>
          <linearGradient id="cg-front" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#35A7A7" />
            <stop offset="55%" stopColor="#1B6B6B" />
            <stop offset="100%" stopColor="#0E4450" />
          </linearGradient>
          <linearGradient id="cg-side" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#145663" />
            <stop offset="100%" stopColor="#092E38" />
          </linearGradient>
          <linearGradient id="cg-top" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#72D1CE" />
            <stop offset="100%" stopColor="#2B8E8E" />
          </linearGradient>
          <linearGradient id="cg-arrow" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#E05524" />
            <stop offset="50%" stopColor="#F26B3A" />
            <stop offset="100%" stopColor="#FF965A" />
          </linearGradient>
          <radialGradient id="cg-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#BCE4E4" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#BCE4E4" stopOpacity="0" />
          </radialGradient>
          <filter id="cg-shadow" x="-15%" y="-15%" width="130%" height="135%">
            <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#0C2538" floodOpacity="0.16" />
          </filter>
          <clipPath id="cg-arrow-clip">
            <rect className="cg-arrow-clip-rect" x="40" y="0" width="235" height="175" />
          </clipPath>
        </defs>

        {/* Soft ambient teal glow */}
        <circle cx="176" cy="148" r="112" fill="url(#cg-glow)" />

        {/* Warm subtle ground pedestal */}
        <ellipse cx="172" cy="238" rx="134" ry="15" fill="#FDE4D6" fillOpacity="0.8" />
        <ellipse cx="172" cy="236" rx="116" ry="9" fill="#0C2538" fillOpacity="0.06" />

        {/* 5 Rising 3D Isometric Collabo Teal Bars (animated 1 -> 5) */}
        {[
          { x: 52, y: 174, h: 60, cls: 'cg-b1' },
          { x: 100, y: 152, h: 82, cls: 'cg-b2' },
          { x: 148, y: 128, h: 106, cls: 'cg-b3' },
          { x: 196, y: 102, h: 132, cls: 'cg-b4' },
          { x: 244, y: 74, h: 160, cls: 'cg-b5' },
        ].map((b, i) => (
          <g key={i} className={`cg-bar ${b.cls}`} filter="url(#cg-shadow)">
            {/* Front face */}
            <rect x={b.x} y={b.y} width="30" height={b.h} rx="2" fill="url(#cg-front)" />
            {/* Right 3D side face */}
            <polygon
              points={`${b.x + 30},${b.y} ${b.x + 40},${b.y - 7} ${b.x + 40},${b.y + b.h - 7} ${b.x + 30},${b.y + b.h}`}
              fill="url(#cg-side)"
            />
            {/* Top 3D cap */}
            <polygon
              points={`${b.x},${b.y} ${b.x + 10},${b.y - 7} ${b.x + 40},${b.y - 7} ${b.x + 30},${b.y}`}
              fill="url(#cg-top)"
            />
          </g>
        ))}

        {/* Sweeping 3D Coral-Orange Upward Growth Arrow (bottom-left -> top-right) */}
        <g clipPath="url(#cg-arrow-clip)" className="cg-arrow-group" filter="url(#cg-shadow)">
          <path
            d="M54 148 C118 128 176 92 224 38 L208 35 C205 34.5 204.5 30.5 207.2 29.2 L248 14 C251 12.8 254.2 15.5 253.4 18.6 L243 60 C242.2 63 238.4 63.5 236.8 60.8 L229 48 C184 102 126 136 58 153 C53.5 154.2 50.5 149.2 54 148 Z"
            fill="url(#cg-arrow)"
          />
        </g>

        {/* Crisp minimal sparkle accents */}
        <circle className="cg-spark" cx="96" cy="92" r="3" fill="#F26B3A" opacity="0.85" />
        <circle className="cg-spark" cx="298" cy="54" r="3.5" fill="#1B6B6B" opacity="0.7" />
        <path className="cg-spark" d="M168 46L170 51L175 53L170 55L168 60L166 55L161 53L166 51Z" fill="#F26B3A" opacity="0.85" />
      </svg>
    </div>
  );
}

function WhyCollaboIcon({ type }) {
  if (type === 'ease') {
    return (
      <svg viewBox="0 0 52 52" fill="none" className="w-[52px] h-[52px] shrink-0" aria-hidden="true">
        <defs>
          <linearGradient id="wc-bolt" x1="16" y1="10" x2="36" y2="42" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FF9154" />
            <stop offset="55%" stopColor="#F26B3A" />
            <stop offset="100%" stopColor="#D94E1F" />
          </linearGradient>
        </defs>
        <circle cx="26" cy="26" r="25" fill="#FFF2EB" stroke="#FFE0D1" strokeWidth="1.2" />
        <path
          d="M28.6 11.5L16.8 27.6C16.2 28.4 16.8 29.5 17.8 29.5H24.6L22.6 39.8C22.4 40.9 23.8 41.6 24.5 40.7L35.4 24.8C36 24 35.4 22.9 34.4 22.9H27.7L30.5 12.6C30.8 11.5 29.3 10.6 28.6 11.5Z"
          fill="url(#wc-bolt)"
        />
        <circle cx="37.5" cy="15.5" r="2" fill="#FBBF24" />
      </svg>
    );
  }
  if (type === 'influencers') {
    return (
      <svg viewBox="0 0 52 52" fill="none" className="w-[52px] h-[52px] shrink-0" aria-hidden="true">
        <defs>
          <linearGradient id="wc-teal" x1="14" y1="14" x2="38" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2B8E8E" />
            <stop offset="100%" stopColor="#0E4754" />
          </linearGradient>
        </defs>
        <circle cx="26" cy="26" r="25" fill="#EBF6F7" stroke="#CFE9EB" strokeWidth="1.2" />
        {/* Side silhouettes */}
        <circle cx="16.5" cy="22.5" r="3.4" fill="#5CB3B3" />
        <path d="M11 33.5C11 30.2 13.4 28 16.5 28C18.2 28 19.6 28.7 20.6 29.8" fill="#5CB3B3" />
        <circle cx="35.5" cy="22.5" r="3.4" fill="#5CB3B3" />
        <path d="M41 33.5C41 30.2 38.6 28 35.5 28C33.8 28 32.4 28.7 31.4 29.8" fill="#5CB3B3" />
        {/* Front center creator */}
        <circle cx="26" cy="20" r="4.6" fill="url(#wc-teal)" />
        <path d="M17.5 35.5C17.5 30.6 21.1 27.2 26 27.2C30.9 27.2 34.5 30.6 34.5 35.5C34.5 36.3 33.8 37 33 37H19C18.2 37 17.5 36.3 17.5 35.5Z" fill="url(#wc-teal)" />
        <circle cx="35.5" cy="14" r="2" fill="#F26B3A" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 52 52" fill="none" className="w-[52px] h-[52px] shrink-0" aria-hidden="true">
      <defs>
        <linearGradient id="wc-mega" x1="16" y1="14" x2="38" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF9154" />
          <stop offset="55%" stopColor="#F26B3A" />
          <stop offset="100%" stopColor="#D94E1F" />
        </linearGradient>
      </defs>
      <circle cx="26" cy="26" r="25" fill="#FFF2EB" stroke="#FFE0D1" strokeWidth="1.2" />
      {/* Handle */}
      <path d="M17.5 27.5L19.8 35.6C20.2 36.8 21.5 37.5 22.7 37.1C23.8 36.8 24.4 35.6 24.1 34.4L22.2 28" fill="#135562" />
      {/* Mouthpiece */}
      <rect x="12.5" y="21.5" width="7.5" height="7.5" rx="3" fill="#0C2538" />
      {/* Bold Coral Megaphone Cone */}
      <path
        d="M19.5 21.5L32.8 14.2C34.1 13.5 35.6 14.4 35.6 15.9V34.1C35.6 35.6 34.1 36.5 32.8 35.8L19.5 28.5V21.5Z"
        fill="url(#wc-mega)"
      />
      {/* Soundwaves */}
      <path d="M38.8 20.5C40.6 22.3 41.2 24.9 40.4 27.5" stroke="#1B6B6B" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M38.2 15.8L39.2 17.5L41 18.2L39.2 19L38.2 20.8L37.4 19L35.6 18.2L37.4 17.5Z" fill="#F26B3A" />
    </svg>
  );
}

const SUPPORT_SCENE_CSS = `
@keyframes sup-float-a {
  0%, 100% { transform: translateY(0px); }
  50%      { transform: translateY(-7px); }
}
@keyframes sup-float-b {
  0%, 100% { transform: translateY(0px); }
  50%      { transform: translateY(7px); }
}
@keyframes sup-msg-1 {
  0%, 4%   { opacity: 0; transform: translateY(10px) scale(0.96); }
  14%, 88% { opacity: 1; transform: translateY(0px) scale(1); }
  95%, 100%{ opacity: 0; transform: translateY(-6px) scale(0.98); }
}
@keyframes sup-typing {
  0%, 18%  { opacity: 0; transform: scale(0.9); }
  24%, 40% { opacity: 1; transform: scale(1); }
  45%, 100%{ opacity: 0; transform: scale(0.9); }
}
@keyframes sup-msg-2 {
  0%, 42%  { opacity: 0; transform: translateY(10px) scale(0.96); }
  52%, 88% { opacity: 1; transform: translateY(0px) scale(1); }
  95%, 100%{ opacity: 0; transform: translateY(-6px) scale(0.98); }
}
@keyframes sup-status {
  0%, 58%  { opacity: 0; transform: translateY(8px) scale(0.95); }
  66%, 88% { opacity: 1; transform: translateY(0px) scale(1); }
  95%, 100%{ opacity: 0; transform: translateY(4px) scale(0.95); }
}
@keyframes sup-dot {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.45; }
  40%           { transform: translateY(-3.5px); opacity: 1; }
}
.sup-float-a { animation: sup-float-a 4.2s ease-in-out infinite; }
.sup-float-b { animation: sup-float-b 4.8s ease-in-out infinite; }
.sup-msg-1   { animation: sup-msg-1 6.5s cubic-bezier(0.22, 1, 0.36, 1) infinite; }
.sup-typing  { animation: sup-typing 6.5s ease-in-out infinite; }
.sup-msg-2   { animation: sup-msg-2 6.5s cubic-bezier(0.22, 1, 0.36, 1) infinite; }
.sup-status  { animation: sup-status 6.5s cubic-bezier(0.22, 1, 0.36, 1) infinite; }
.sup-dot-1   { animation: sup-dot 1.1s ease-in-out infinite; }
.sup-dot-2   { animation: sup-dot 1.1s ease-in-out 0.16s infinite; }
.sup-dot-3   { animation: sup-dot 1.1s ease-in-out 0.32s infinite; }
@media (prefers-reduced-motion: reduce) {
  .sup-float-a, .sup-float-b, .sup-msg-1, .sup-msg-2, .sup-status {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
  .sup-typing { display: none !important; }
}
`;

function SellerSupportIllustration() {
  return (
    <div className="relative w-full max-w-[430px] mx-auto py-8 px-3 sm:px-6 select-none pointer-events-none" aria-hidden="true">
      <style>{SUPPORT_SCENE_CSS}</style>

      {/* Soft ambient Collabo teal & coral glow orbs */}
      <div className="absolute top-6 left-4 w-52 h-52 rounded-full bg-[#1B6B6B]/12 blur-3xl" />
      <div className="absolute bottom-4 right-4 w-52 h-52 rounded-full bg-[#F26B3A]/14 blur-3xl" />

      {/* Top-Left Floating 24x7 Badge */}
      <div className="sup-float-a absolute top-1 left-0 sm:-left-2 z-20 bg-white rounded-2xl px-3.5 py-2.5 shadow-[0_10px_28px_rgba(12,37,56,0.12)] border border-slate-100 flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-xl bg-[#EAF5F5] text-[#1B6B6B] flex items-center justify-center">
          <Headphones className="w-4 h-4" strokeWidth={2.2} />
        </span>
        <div className="leading-tight">
          <p className="text-[11px] font-extrabold text-[#0C2538]">24×7 Support</p>
          <p className="text-[9.5px] font-medium text-emerald-600 flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            Desk Online
          </p>
        </div>
      </div>

      {/* Top-Right Floating Ticket Mail Badge */}
      <div className="sup-float-b absolute top-4 right-0 sm:-right-2 z-20 bg-white rounded-2xl px-3.5 py-2 shadow-[0_10px_28px_rgba(12,37,56,0.12)] border border-slate-100 flex items-center gap-2">
        <span className="w-7 h-7 rounded-lg bg-[#FFF3EE] text-[#F26B3A] flex items-center justify-center">
          <Mail className="w-3.5 h-3.5" strokeWidth={2.2} />
        </span>
        <span className="text-[10.5px] font-bold text-[#0C2538]">Direct Replies</span>
      </div>

      {/* Central Interactive-Style Support Desk Card */}
      <div className="relative z-10 bg-white rounded-2xl shadow-[0_20px_52px_rgba(12,37,56,0.11)] border border-slate-200/80 overflow-hidden mt-4">
        {/* Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-[#0C2538] via-[#134652] to-[#1B6B6B] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white p-1 shadow-xs flex items-center justify-center shrink-0">
              <img src="/favicon-192.png" alt="Collabo" className="w-full h-full object-contain" />
            </div>
            <div className="leading-tight">
              <p className="text-[11.5px] font-bold text-white">Collabo Seller Support</p>
              <p className="text-[9.5px] text-teal-100/90 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Active ticket desk
              </p>
            </div>
          </div>
          <span className="text-[9.5px] font-bold text-white/90 bg-white/15 px-2.5 py-0.5 rounded-full">
            Live Help
          </span>
        </div>

        {/* Animated Conversation Area */}
        <div className="p-4 sm:p-5 bg-[#F8FBFD] space-y-3 min-h-[215px] relative">
          {/* Seller Message */}
          <div className="sup-msg-1 flex justify-end">
            <div className="max-w-[82%] bg-[#F26B3A] text-white rounded-2xl rounded-br-sm px-3.5 py-2.5 shadow-sm">
              <p className="text-[11.5px] font-medium leading-snug">
                Hi! How can I bulk upload my catalog &amp; track payouts?
              </p>
              <p className="text-[9px] text-orange-100/90 text-right mt-1">Seller · Just now</p>
            </div>
          </div>

          {/* Typing Indicator (briefly shown before support replies) */}
          <div className="sup-typing absolute left-4 sm:left-5 top-[88px] flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white border border-slate-200 p-0.5 shadow-xs flex items-center justify-center shrink-0">
              <img src="/favicon-192.png" alt="Collabo" className="w-full h-full object-contain" />
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl rounded-bl-sm px-3 py-2 shadow-xs flex items-center gap-1">
              <span className="sup-dot-1 w-1.5 h-1.5 rounded-full bg-[#1B6B6B]" />
              <span className="sup-dot-2 w-1.5 h-1.5 rounded-full bg-[#1B6B6B]" />
              <span className="sup-dot-3 w-1.5 h-1.5 rounded-full bg-[#1B6B6B]" />
            </div>
          </div>

          {/* Collabo Support Reply */}
          <div className="sup-msg-2 flex items-end gap-2">
            <div className="w-6 h-6 rounded-full bg-white border border-slate-200 p-0.5 shadow-xs flex items-center justify-center shrink-0">
              <img src="/favicon-192.png" alt="Collabo" className="w-full h-full object-contain" />
            </div>
            <div className="max-w-[82%] bg-white border border-slate-200/80 text-[#0C2538] rounded-2xl rounded-bl-sm px-3.5 py-2.5 shadow-xs">
              <p className="text-[11.5px] leading-snug">
                Import your CSV directly in <span className="font-bold text-[#1B6B6B]">Seller Dashboard</span> — payouts settle to your bank in 7 days!
              </p>
              <p className="text-[9px] text-gray-400 mt-1">Collabo Support · Instant</p>
            </div>
          </div>

          {/* Animated Ticket Status Pill */}
          <div className="sup-status pt-1 flex items-center justify-between bg-emerald-50 border border-emerald-200/80 rounded-xl px-3 py-2">
            <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold text-emerald-800">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              Ticket Tracked in Dashboard
            </span>
            <span className="font-mono text-[10px] font-bold text-[#1B6B6B] bg-white px-2 py-0.5 rounded border border-emerald-200/70">
              #TKT-LIVE
            </span>
          </div>
        </div>
      </div>

      {/* Bottom-Right Floating Shield Trust Pill */}
      <div className="sup-float-a absolute bottom-1 right-2 sm:right-0 z-20 bg-white rounded-full px-3.5 py-1.5 shadow-[0_8px_24px_rgba(12,37,56,0.12)] border border-slate-100 flex items-center gap-1.5">
        <Shield className="w-3.5 h-3.5 text-[#F26B3A]" />
        <span className="text-[10.5px] font-bold text-[#0C2538]">Dedicated Seller Team</span>
      </div>
    </div>
  );
}

function SellerSupportSection({ user }) {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('medium');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdTicket, setCreatedTicket] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!user) {
      setError('Please log in to your Collabo account to raise a support ticket.');
      return;
    }
    if (!category) {
      setError('Please select a topic for your query.');
      return;
    }
    if (subject.trim().length < 5) {
      setError('Subject must be at least 5 characters long.');
      return;
    }
    if (message.trim().length < 10) {
      setError('Message must be at least 10 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('subject', subject.trim());
      fd.append('category', category);
      fd.append('message', message.trim());
      fd.append('priority', priority);

      const res = await api.post('/support/tickets/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCreatedTicket(res.data?.ticket || { ticket_number: 'Submitted' });
      setSubject('');
      setCategory('');
      setPriority('medium');
      setMessage('');
    } catch (err) {
      const data = err.response?.data;
      const msg =
        data?.detail ||
        data?.message ||
        (Array.isArray(data?.subject) && data.subject[0]) ||
        (Array.isArray(data?.message) && data.message[0]) ||
        'Could not submit your ticket right now. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="support" className="bg-white border-b border-gray-200 scroll-mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left: Heading & Support Ticket Form */}
          <div className="lg:col-span-6 space-y-5">
            <div>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#1B2741] leading-tight">
                Still wondering? <span className="text-orange-500">Let&apos;s talk</span>
              </h2>
            </div>

            {createdTicket ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-3 max-w-md">
                <div className="flex items-center gap-2.5">
                  <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-emerald-900">Support ticket raised!</p>
                    <p className="text-xs text-emerald-700">
                      Ticket ID: <span className="font-mono font-bold">{createdTicket.ticket_number}</span>
                    </p>
                  </div>
                </div>
                <p className="text-xs text-emerald-800/80 leading-relaxed">
                  Our support team has received your query. You can track replies anytime in your Collabo Support Tickets.
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setCreatedTicket(null)}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    Raise Another Query
                  </button>
                  <a href="/dashboard" className="text-xs font-semibold text-[#1B2741] hover:text-orange-600 transition-colors">
                    View My Tickets →
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5 max-w-md">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5 text-xs text-red-600 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Subject of your ticket *"
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <select
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="sm:col-span-2 w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-[13px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
                  >
                    <option value="">Choose a category *</option>
                    {SUPPORT_TOPICS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    aria-label="Priority"
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-[13px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>

                <div>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe how we can help *"
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all resize-none"
                  />
                </div>

                <div className="pt-1 flex items-center gap-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-[13px] font-bold px-8 py-2.5 rounded-lg shadow-sm transition-colors"
                  >
                    {submitting ? 'Submitting...' : 'Raise Support Ticket'}
                  </button>
                  {user && (
                    <span className="text-[11px] text-gray-400">
                      Raising as <strong className="text-gray-600">{user.email || user.username}</strong>
                    </span>
                  )}
                </div>
              </form>
            )}
          </div>

          {/* Right: Collabo-themed Support Illustration */}
          <div className="lg:col-span-6 flex items-center justify-center">
            <SellerSupportIllustration />
          </div>
        </div>
      </div>
    </section>
  );
}

function SellerRegistrationWidget() {
  const { register, user, fetchUser } = useAuth();
  const [phase, setPhase] = useState(user ? 'kyc' : 'register');
  const [regForm, setRegForm] = useState({ email: '', username: '', password: '', phone: '' });
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');
  const [regAgreedToTerms, setRegAgreedToTerms] = useState(false);
  const [regMarketingConsent, setRegMarketingConsent] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');

  const [kycStep, setKycStep] = useState(1);
  const [storeName, setStoreName] = useState(user?.seller_profile?.store_name || '');
  const [addressLine1, setAddressLine1] = useState(user?.seller_profile?.address_line1 || '');
  const [addressLine2, setAddressLine2] = useState(user?.seller_profile?.address_line2 || '');
  const [country, setCountry] = useState(user?.seller_profile?.country || 'India');
  const [stateName, setStateName] = useState(user?.seller_profile?.state || '');
  const [city, setCity] = useState(user?.seller_profile?.city || '');
  const [district, setDistrict] = useState(user?.seller_profile?.district || '');
  const [pincode, setPincode] = useState(user?.seller_profile?.pincode || '');
  const [warehouseSameAsBusiness, setWarehouseSameAsBusiness] = useState(user?.seller_profile?.warehouse_same_as_business ?? true);
  const [warehouseLine1, setWarehouseLine1] = useState(user?.seller_profile?.warehouse_address_line1 || '');
  const [warehouseLine2, setWarehouseLine2] = useState(user?.seller_profile?.warehouse_address_line2 || '');
  const [warehouseCountry, setWarehouseCountry] = useState(user?.seller_profile?.warehouse_country || 'India');
  const [warehouseState, setWarehouseState] = useState(user?.seller_profile?.warehouse_state || '');
  const [warehouseCity, setWarehouseCity] = useState(user?.seller_profile?.warehouse_city || '');
  const [warehouseDistrict, setWarehouseDistrict] = useState(user?.seller_profile?.warehouse_district || '');
  const [warehousePincode, setWarehousePincode] = useState(user?.seller_profile?.warehouse_pincode || '');
  const [taxId, setTaxId] = useState(user?.seller_profile?.tax_id || '');
  const [bankName, setBankName] = useState(user?.seller_profile?.bank_name || '');
  const [bankAccount, setBankAccount] = useState(user?.seller_profile?.bank_account_number || '');
  const [bankAccountConfirm, setBankAccountConfirm] = useState('');
  const [bankIfsc, setBankIfsc] = useState(user?.seller_profile?.bank_ifsc || '');
  const [idNumber, setIdNumber] = useState('');
  const [kycDoc, setKycDoc] = useState(null);
  const [bankDoc, setBankDoc] = useState(null);
  const [kycError, setKycError] = useState('');
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [verifyResendBusy, setVerifyResendBusy] = useState(false);
  const [verifyResendError, setVerifyResendError] = useState('');

  // Selling preferences
  const [sellingCategories, setSellingCategories] = useState(user?.seller_profile?.selling_categories || []);
  const [expectedProductCount, setExpectedProductCount] = useState(user?.seller_profile?.expected_product_count || '');
  const [preferredCourier, setPreferredCourier] = useState(user?.seller_profile?.preferred_courier || '');
  const [returnSameAsWarehouse, setReturnSameAsWarehouse] = useState(user?.seller_profile?.return_address_same_as_warehouse ?? true);
  const [returnLine1, setReturnLine1] = useState(user?.seller_profile?.return_address_line1 || '');
  const [returnCity, setReturnCity] = useState(user?.seller_profile?.return_address_city || '');
  const [returnState, setReturnState] = useState(user?.seller_profile?.return_address_state || '');
  const [returnPincode, setReturnPincode] = useState(user?.seller_profile?.return_address_pincode || '');

  const toggleSellingCategory = (cat) => {
    setSellingCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const handleFileUpload = useCallback((e, setter) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setKycError('File must be under 5MB'); return; }
    setter(file);
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError('');
    if (!regForm.email.trim()) { setRegError('Email is required'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regForm.email)) { setRegError('Please enter a valid email address'); return; }
    if (!regForm.username.trim()) { setRegError('Username is required'); return; }
    if (regForm.username.trim().length < 3) { setRegError('Username must be at least 3 characters'); return; }
    if (regForm.phone && !/^\d{10}$/.test(regForm.phone.replace(/\D/g, ''))) { setRegError('Phone number must be exactly 10 digits'); return; }
    if (regForm.password.length < 8) { setRegError('Password must be at least 8 characters'); return; }
    if (regForm.password !== regPasswordConfirm) { setRegError('Passwords do not match'); return; }
    if (!regAgreedToTerms) { setRegError('Please agree to the Terms & Conditions and Privacy Policy'); return; }
    setRegLoading(true);
    const result = await register({
      ...regForm, password_confirm: regPasswordConfirm, user_type: 'buyer',
      agreed_to_terms: regAgreedToTerms, marketing_consent: regMarketingConsent,
      phone: regForm.phone ? `+91${regForm.phone.replace(/^0+/, '')}` : '',
    });
    if (result.success) { setPhase('awaiting-verification'); }
    else { setRegError(result.error || 'Registration failed'); }
    setRegLoading(false);
  };

  const handleKycSubmit = async () => {
    setKycError('');
    if (kycStep === 1) {
      if (!storeName.trim()) return setKycError('Store name is required');
      if (storeName.trim().length < 3) return setKycError('Store name must be at least 3 characters');
      if (!addressLine1.trim()) return setKycError('Address line 1 is required');
      if (!city.trim()) return setKycError('City is required');
      if (!stateName.trim()) return setKycError('State is required');
      if (!/^\d{6}$/.test(pincode.trim())) return setKycError('PIN code must be exactly 6 digits');
      if (!warehouseSameAsBusiness) {
        if (!warehouseLine1.trim()) return setKycError('Warehouse/pickup address line 1 is required');
        if (!warehouseCity.trim()) return setKycError('Warehouse/pickup city is required');
        if (!warehouseState.trim()) return setKycError('Warehouse/pickup state is required');
        if (!/^\d{6}$/.test(warehousePincode.trim())) return setKycError('Warehouse/pickup PIN code must be exactly 6 digits');
      }
      setKycStep(2);
    } else if (kycStep === 2) {
      if (!taxId.trim()) return setKycError('GSTIN is required');
      {
        const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
        if (!gstRegex.test(taxId.trim().toUpperCase())) {
          return setKycError('Invalid GSTIN. Enter a valid 15-character GSTIN (e.g. 27AAAAA1111A1Z1)');
        }
      }
      if (!idNumber.trim()) return setKycError('PAN number is required');
      if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(idNumber.trim().toUpperCase())) return setKycError('PAN must be 10 characters: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)');
      if (!kycDoc) return setKycError('Please upload your PAN card');
      setKycStep(3);
    } else if (kycStep === 3) {
      if (!bankName.trim()) return setKycError('Bank name is required');
      if (!bankIfsc.trim()) return setKycError('IFSC code is required');
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankIfsc.trim().toUpperCase())) return setKycError('Invalid IFSC code. Must be 11 characters (e.g. HDFC0001234)');
      if (!bankAccount.trim()) return setKycError('Account number is required');
      if (!/^\d{9,18}$/.test(bankAccount.trim())) return setKycError('Account number must be 9-18 digits');
      if (bankAccount.trim() !== bankAccountConfirm.trim()) return setKycError('Account numbers do not match');
      setKycStep(4);
    } else if (kycStep === 4) {
      if (sellingCategories.length === 0) return setKycError('Select at least one category you plan to sell in');
      if (!returnSameAsWarehouse) {
        if (!returnLine1.trim()) return setKycError('Return address line 1 is required');
        if (!returnCity.trim()) return setKycError('Return address city is required');
        if (!returnState.trim()) return setKycError('Return address state is required');
        if (!/^\d{6}$/.test(returnPincode.trim())) return setKycError('Return address PIN code must be exactly 6 digits');
      }
      setKycStep(5);
    } else {
      if (!agreedToTerms) return setKycError('Please agree to the Seller Terms & Conditions to continue');
      setKycSubmitting(true);
      try {
        const fd = new FormData();
        fd.append('store_name', storeName);
        fd.append('tax_id', taxId || `PAN: ${idNumber}`);
        fd.append('bank_name', bankName);
        fd.append('bank_account_number', bankAccount);
        fd.append('bank_ifsc', bankIfsc);
        fd.append('address_line1', addressLine1);
        fd.append('address_line2', addressLine2);
        fd.append('country', country);
        fd.append('state', stateName);
        fd.append('city', city);
        fd.append('district', district);
        fd.append('pincode', pincode);
        fd.append('warehouse_same_as_business', warehouseSameAsBusiness);
        if (!warehouseSameAsBusiness) {
          fd.append('warehouse_address_line1', warehouseLine1);
          fd.append('warehouse_address_line2', warehouseLine2);
          fd.append('warehouse_country', warehouseCountry);
          fd.append('warehouse_state', warehouseState);
          fd.append('warehouse_city', warehouseCity);
          fd.append('warehouse_district', warehouseDistrict);
          fd.append('warehouse_pincode', warehousePincode);
        }
        fd.append('selling_categories', JSON.stringify(sellingCategories));
        fd.append('expected_product_count', expectedProductCount);
        fd.append('preferred_courier', preferredCourier);
        fd.append('return_address_same_as_warehouse', returnSameAsWarehouse);
        if (!returnSameAsWarehouse) {
          fd.append('return_address_line1', returnLine1);
          fd.append('return_address_city', returnCity);
          fd.append('return_address_state', returnState);
          fd.append('return_address_pincode', returnPincode);
        }
        if (kycDoc instanceof File) fd.append('kyc_document_file', kycDoc);
        if (bankDoc instanceof File) fd.append('bank_document_file', bankDoc);
        await api.post('/auth/seller-profile/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        await fetchUser();
        setPhase('done');
      } catch (err) {
        setKycError(err.response?.data?.store_name?.[0] || err.response?.data?.detail || 'Submission failed');
      } finally { setKycSubmitting(false); }
    }
  };

  const sp = user?.seller_profile;
  const status = sp?.verification_status;

  // While an application is under review — or the account is still unverified —
  // poll so the admin's decision or the verification click shows up without a refresh.
  useEffect(() => {
    if (status !== 'pending' && phase !== 'done' && user?.is_verified !== false) return;
    const interval = setInterval(() => { fetchUser(); }, 15000);
    return () => clearInterval(interval);
  }, [status, phase, user?.is_verified, fetchUser]);

  if (status === 'approved' || user?.user_type === 'seller') {
    return (
      <div className="space-y-4">
        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 text-center space-y-2">
          <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
          <p className="text-sm font-semibold text-emerald-800">Your seller account is active</p>
          <p className="text-[11px] text-emerald-600">You can now list products and manage orders</p>
        </div>
        <a href="/dashboard" className="block w-full bg-orange-600 hover:bg-orange-700 text-white text-[12px] font-medium py-2.5 rounded-lg transition-colors text-center">
          Open Seller Dashboard
        </a>
      </div>
    );
  }

  if (status === 'pending' || phase === 'done') {
    return (
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 text-center space-y-2">
          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center mx-auto"><Store className="w-4 h-4 text-amber-600" /></div>
          <p className="text-sm font-semibold text-amber-800">Application submitted</p>
          <p className="text-[11px] text-amber-600">Our team will review your profile within 24-48 hours. We'll notify you once approved.</p>
        </div>
        <div className="flex gap-2">
          {['Registered', 'Under Review', 'Start Selling'].map((s, i) => (
            <div key={i} className={`flex-1 text-center py-2.5 rounded-lg text-[10px] font-medium ${i <= 1 ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-400'}`}>
              {i <= 1 && <CheckCircle className="w-3 h-3 mx-auto mb-0.5 text-amber-500" />}
              {s}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (user && !user.is_verified) {
    return (
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 text-center space-y-2">
          <Mail className="w-8 h-8 text-amber-600 mx-auto" />
          <p className="text-sm font-semibold text-amber-800">Please verify your email first</p>
          <p className="text-[11px] text-amber-600">
            We sent a verification link to <strong>{user.email}</strong>. Click it before continuing your seller application.
          </p>
        </div>
        {verifyResendError && <div className="bg-red-50 border border-red-100 rounded-lg p-2.5 text-[11px] text-red-600 flex items-start gap-2"><AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />{verifyResendError}</div>}
        <button
          type="button"
          disabled={verifyResendBusy}
          onClick={async () => {
            setVerifyResendError('');
            setVerifyResendBusy(true);
            try {
              await api.post('/auth/resend-verification/', { email: user.email });
              setVerifyResendError('');
            } catch {
              setVerifyResendError('Could not resend right now. Please try again shortly.');
            } finally {
              setVerifyResendBusy(false);
            }
          }}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white text-[12px] font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {verifyResendBusy ? 'Sending...' : 'Resend verification email'}
        </button>
      </div>
    );
  }

  if (status === 'rejected') {
    if (phase !== 'kyc') setPhase('kyc');
  }

  if (!user && phase === 'awaiting-verification') {
    return (
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 text-center space-y-2">
          <Mail className="w-8 h-8 text-amber-600 mx-auto" />
          <p className="text-sm font-semibold text-amber-800">Check your email</p>
          <p className="text-[11px] text-amber-600">
            We sent a verification link to <strong>{regForm.email}</strong>. Verify it, then log in to continue your seller application.
          </p>
        </div>
        {verifyResendError && <div className="bg-red-50 border border-red-100 rounded-lg p-2.5 text-[11px] text-red-600 flex items-start gap-2"><AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />{verifyResendError}</div>}
        <button
          type="button"
          disabled={verifyResendBusy}
          onClick={async () => {
            setVerifyResendError('');
            setVerifyResendBusy(true);
            try {
              await api.post('/auth/resend-verification/', { email: regForm.email });
            } catch {
              setVerifyResendError('Could not resend right now. Please try again shortly.');
            } finally {
              setVerifyResendBusy(false);
            }
          }}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white text-[12px] font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {verifyResendBusy ? 'Sending...' : 'Resend verification email'}
        </button>
        <p className="text-[9px] text-gray-400 text-center">Already verified? <a href="/" className="text-orange-600 font-medium hover:underline">Login on store</a></p>
      </div>
    );
  }

  if (!user && phase === 'register') {
    return (
      <form onSubmit={handleRegister} className="space-y-3">
        <p className="text-[10px] text-gray-400 uppercase font-medium">Step 1 of 2 — Create Account</p>
        {regError && <div className="bg-red-50 border border-red-100 rounded-lg p-2.5 text-[11px] text-red-600 flex items-start gap-2"><AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />{regError}</div>}
        <div>
          <label className="block text-[10px] text-gray-500 font-medium mb-1">Business Name</label>
          <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input type="text" required value={regForm.username} onChange={e => setRegForm({...regForm, username: e.target.value})} placeholder="Your name or store name" className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:ring-1 focus:ring-orange-400" /></div>
        </div>
        <div>
          <label className="block text-[10px] text-gray-500 font-medium mb-1">Email</label>
          <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input type="email" required value={regForm.email} onChange={e => setRegForm({...regForm, email: e.target.value})} placeholder="you@business.com" className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:ring-1 focus:ring-orange-400" /></div>
        </div>
        <div>
          <label className="block text-[10px] text-gray-500 font-medium mb-1">Phone</label>
          <div className="flex"><div className="flex items-center px-3 bg-gray-50 border border-r-0 border-gray-200 rounded-l-lg"><span className="text-[11px] text-gray-500">+91</span></div>
          <input type="tel" value={regForm.phone} onChange={e => setRegForm({...regForm, phone: e.target.value.replace(/\D/g,'').slice(0,10)})} placeholder="10 digits" className="flex-1 px-3 py-2.5 border border-gray-200 rounded-r-lg text-[12px] focus:outline-none focus:ring-1 focus:ring-orange-400" /></div>
        </div>
        <div>
          <label className="block text-[10px] text-gray-500 font-medium mb-1">Password</label>
          <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input type={showPw?'text':'password'} required value={regForm.password} onChange={e => setRegForm({...regForm, password: e.target.value})} placeholder="Min 8 characters" className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:ring-1 focus:ring-orange-400" />
          <button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPw?<EyeOff className="w-3.5 h-3.5"/>:<Eye className="w-3.5 h-3.5"/>}</button></div>
        </div>
        <div>
          <label className="block text-[10px] text-gray-500 font-medium mb-1">Confirm Password</label>
          <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input type={showPw?'text':'password'} required value={regPasswordConfirm} onChange={e => setRegPasswordConfirm(e.target.value)} placeholder="Re-enter your password" className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:ring-1 focus:ring-orange-400" /></div>
        </div>
        <label className="flex items-start gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={regAgreedToTerms} onChange={e => setRegAgreedToTerms(e.target.checked)}
            className="mt-0.5 w-3.5 h-3.5 shrink-0 rounded border-gray-300 text-orange-600 focus:ring-1 focus:ring-orange-400" />
          <span className="text-[11px] text-gray-600">
            I agree to the <a href="/terms" className="text-orange-600 font-medium hover:underline">Terms &amp; Conditions</a> and <a href="/privacy" className="text-orange-600 font-medium hover:underline">Privacy Policy</a>
          </span>
        </label>
        <label className="flex items-start gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={regMarketingConsent} onChange={e => setRegMarketingConsent(e.target.checked)}
            className="mt-0.5 w-3.5 h-3.5 shrink-0 rounded border-gray-300 text-orange-600 focus:ring-1 focus:ring-orange-400" />
          <span className="text-[11px] text-gray-600">Send me promotional emails and SMS offers (optional)</span>
        </label>
        <button type="submit" disabled={regLoading} className="w-full bg-orange-600 hover:bg-orange-700 text-white text-[12px] font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50">
          {regLoading ? 'Creating...' : 'Create Account & Continue'}
        </button>
        <p className="text-[9px] text-gray-400 text-center">Already have an account? <a href="/" className="text-orange-600 font-medium hover:underline">Login on store</a></p>
      </form>
    );
  }

  const inputCls = "w-full bg-white border border-gray-200 rounded-lg py-2.5 px-3 text-[12px] focus:outline-none focus:ring-1 focus:ring-orange-400";
  const labelCls = "block text-[10px] text-gray-500 font-medium mb-1";

  return (
    <div className="space-y-4">
      <p className="text-[10px] text-gray-400 uppercase font-medium">Step 2 of 2 — Seller Verification</p>
      {/* Progress */}
      <div className="flex gap-1.5">
        {[1,2,3,4,5].map(s => (
          <div key={s} className={`h-1 rounded-full flex-1 transition-all ${kycStep >= s ? 'bg-orange-500' : 'bg-gray-200'}`} />
        ))}
      </div>
      <p className="text-[11px] font-medium text-gray-700">
        {kycStep === 1 ? 'Store Profile' : kycStep === 2 ? 'Compliance & KYC' : kycStep === 3 ? 'Bank Details' : kycStep === 4 ? 'Selling Preferences' : 'Review & Submit'}
      </p>

      {status === 'rejected' && kycStep === 1 && (
        <div className="bg-red-50 border border-red-100 rounded-lg p-2.5 text-[10px] text-red-600">
          <span className="font-medium">Rejected:</span> {sp?.rejection_reason || 'Please update your details and re-apply.'}
        </div>
      )}
      {kycError && <div className="bg-red-50 border border-red-100 rounded-lg p-2.5 text-[11px] text-red-600 flex items-start gap-2"><AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />{kycError}</div>}

      {kycStep === 1 && (
        <div className="space-y-3">
          <div><label className={labelCls}>Store Name *</label><input type="text" value={storeName} onChange={e=>setStoreName(e.target.value)} placeholder="e.g. My Premium Store" className={inputCls} /></div>

          <p className="text-[10px] text-gray-400 uppercase font-medium pt-1">Registered Business Address</p>
          <div><label className={labelCls}>Address Line 1 *</label><input type="text" value={addressLine1} onChange={e=>setAddressLine1(e.target.value)} placeholder="Building, street" className={inputCls} /></div>
          <div><label className={labelCls}>Address Line 2</label><input type="text" value={addressLine2} onChange={e=>setAddressLine2(e.target.value)} placeholder="Area, landmark (optional)" className={inputCls} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>City *</label><input type="text" value={city} onChange={e=>setCity(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>District</label><input type="text" value={district} onChange={e=>setDistrict(e.target.value)} className={inputCls} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>State *</label><input type="text" value={stateName} onChange={e=>setStateName(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>PIN Code *</label><input type="text" value={pincode} onChange={e=>setPincode(e.target.value.replace(/\D/g,'').slice(0,6))} maxLength={6} className={inputCls} /></div>
          </div>
          <div><label className={labelCls}>Country *</label><input type="text" value={country} onChange={e=>setCountry(e.target.value)} className={inputCls} /></div>

          <label className="flex items-start gap-2 cursor-pointer select-none pt-1">
            <input type="checkbox" checked={warehouseSameAsBusiness} onChange={e=>setWarehouseSameAsBusiness(e.target.checked)}
              className="mt-0.5 w-3.5 h-3.5 shrink-0 rounded border-gray-300 text-orange-600 focus:ring-1 focus:ring-orange-400" />
            <span className="text-[11px] text-gray-600">My warehouse / pickup address is the same as my business address</span>
          </label>

          {!warehouseSameAsBusiness && (
            <div className="space-y-3 pt-1">
              <p className="text-[10px] text-gray-400 uppercase font-medium">Warehouse / Pickup Address</p>
              <div><label className={labelCls}>Address Line 1 *</label><input type="text" value={warehouseLine1} onChange={e=>setWarehouseLine1(e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Address Line 2</label><input type="text" value={warehouseLine2} onChange={e=>setWarehouseLine2(e.target.value)} className={inputCls} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>City *</label><input type="text" value={warehouseCity} onChange={e=>setWarehouseCity(e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>District</label><input type="text" value={warehouseDistrict} onChange={e=>setWarehouseDistrict(e.target.value)} className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>State *</label><input type="text" value={warehouseState} onChange={e=>setWarehouseState(e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>PIN Code *</label><input type="text" value={warehousePincode} onChange={e=>setWarehousePincode(e.target.value.replace(/\D/g,'').slice(0,6))} maxLength={6} className={inputCls} /></div>
              </div>
              <div><label className={labelCls}>Country *</label><input type="text" value={warehouseCountry} onChange={e=>setWarehouseCountry(e.target.value)} className={inputCls} /></div>
            </div>
          )}
        </div>
      )}
      {kycStep === 2 && (
        <div className="space-y-3">
          <div><label className={labelCls}>GSTIN *</label><input type="text" value={taxId} onChange={e=>setTaxId(e.target.value)} placeholder="e.g. 27AAAAA1111A1Z1" maxLength={15} className={inputCls} />
          <p className="text-[9px] text-gray-400 mt-0.5">15-character GST number (required)</p></div>
          <div>
            <label className={labelCls}>PAN Number *</label>
            <input type="text" value={idNumber} onChange={e=>setIdNumber(e.target.value)}
              placeholder="e.g. ABCDE1234F"
              className={inputCls} />
            <p className="text-[9px] text-gray-400 mt-0.5">10-character PAN number (required)</p>
          </div>
          <div><label className={labelCls}>Upload PAN Card (PDF or Image) *</label><input type="file" accept=".pdf,image/*" onChange={e=>handleFileUpload(e,setKycDoc)} className={inputCls} />
          {kycDoc && <p className="text-[10px] text-emerald-600 mt-1">Attached: {kycDoc.name}</p>}
          <p className="text-[9px] text-gray-400 mt-0.5">Clear photo or scan of your PAN card</p></div>
        </div>
      )}
      {kycStep === 3 && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Bank Name *</label><input type="text" value={bankName} onChange={e=>setBankName(e.target.value)} placeholder="e.g. HDFC Bank" className={inputCls} /></div>
            <div><label className={labelCls}>IFSC Code *</label><input type="text" value={bankIfsc} onChange={e=>setBankIfsc(e.target.value)} placeholder="e.g. HDFC0001234" className={inputCls} /></div>
          </div>
          <div><label className={labelCls}>Account Number *</label><input type="text" value={bankAccount} onChange={e=>setBankAccount(e.target.value)} placeholder="e.g. 50100234567890" className={inputCls} /></div>
          <div><label className={labelCls}>Confirm Account Number *</label><input type="text" value={bankAccountConfirm} onChange={e=>setBankAccountConfirm(e.target.value)} placeholder="Re-enter account number" className={inputCls} /></div>
          <div><label className={labelCls}>Bank Proof (Cheque / Statement)</label><input type="file" accept=".pdf,image/*" onChange={e=>handleFileUpload(e,setBankDoc)} className={inputCls} />
          {bankDoc && <p className="text-[10px] text-emerald-600 mt-1">Attached: {bankDoc.name}</p>}</div>
        </div>
      )}
      {kycStep === 4 && (
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Product Categories You'll Sell *</label>
            <div className="grid grid-cols-2 gap-1.5 mt-1">
              {SELLING_CATEGORY_OPTIONS.map(cat => (
                <label key={cat} className="flex items-center gap-1.5 text-[11px] text-gray-600 cursor-pointer select-none">
                  <input type="checkbox" checked={sellingCategories.includes(cat)} onChange={()=>toggleSellingCategory(cat)}
                    className="w-3.5 h-3.5 shrink-0 rounded border-gray-300 text-orange-600 focus:ring-1 focus:ring-orange-400" />
                  {cat}
                </label>
              ))}
            </div>
          </div>
          <div><label className={labelCls}>Expected Number of Products</label>
            <select value={expectedProductCount} onChange={e=>setExpectedProductCount(e.target.value)} className={inputCls}>
              <option value="">Select a range (optional)</option>
              <option value="1-10">1-10</option>
              <option value="10-50">10-50</option>
              <option value="50-200">50-200</option>
              <option value="200+">200+</option>
            </select>
          </div>
          <div><label className={labelCls}>Preferred Courier</label><input type="text" value={preferredCourier} onChange={e=>setPreferredCourier(e.target.value)} placeholder="e.g. Delhivery, Bluedart (optional)" className={inputCls} /></div>

          <label className="flex items-start gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={returnSameAsWarehouse} onChange={e=>setReturnSameAsWarehouse(e.target.checked)}
              className="mt-0.5 w-3.5 h-3.5 shrink-0 rounded border-gray-300 text-orange-600 focus:ring-1 focus:ring-orange-400" />
            <span className="text-[11px] text-gray-600">My returns should go to my warehouse / pickup address</span>
          </label>

          {!returnSameAsWarehouse && (
            <div className="space-y-3">
              <p className="text-[10px] text-gray-400 uppercase font-medium">Return Address</p>
              <div><label className={labelCls}>Address Line 1 *</label><input type="text" value={returnLine1} onChange={e=>setReturnLine1(e.target.value)} className={inputCls} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>City *</label><input type="text" value={returnCity} onChange={e=>setReturnCity(e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>State *</label><input type="text" value={returnState} onChange={e=>setReturnState(e.target.value)} className={inputCls} /></div>
              </div>
              <div><label className={labelCls}>PIN Code *</label><input type="text" value={returnPincode} onChange={e=>setReturnPincode(e.target.value.replace(/\D/g,'').slice(0,6))} maxLength={6} className={inputCls} /></div>
            </div>
          )}
        </div>
      )}
      {kycStep === 5 && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-[11px]">
          {[
            ['Store', storeName], ['Address', `${addressLine1}, ${city}, ${stateName} ${pincode}`],
            ...(taxId ? [['Tax ID', taxId]] : []),
            ['PAN', idNumber],
            ['Bank', `${bankName} — ${bankIfsc}`], ['Account', bankAccount],
            ['Categories', sellingCategories.join(', ') || '—'],
          ].map(([l,v]) => (
            <div key={l} className="flex justify-between py-1 border-b border-gray-100 last:border-0">
              <span className="text-gray-500">{l}</span>
              <span className="font-medium text-gray-900 text-right max-w-[200px] truncate">{v}</span>
            </div>
          ))}
          {kycDoc && <p className="text-[10px] text-gray-500">KYC: {kycDoc.name}</p>}
          {bankDoc && <p className="text-[10px] text-gray-500">Bank proof: {bankDoc.name}</p>}
        </div>
      )}

      {kycStep === 5 && (
        <label className="flex items-start gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={e => setAgreedToTerms(e.target.checked)}
            className="mt-0.5 w-3.5 h-3.5 shrink-0 rounded border-gray-300 text-orange-600 focus:ring-1 focus:ring-orange-400"
          />
          <span className="text-[11px] text-gray-600">
            I have read and agree to the{' '}
            <button type="button" onClick={() => setShowTermsModal(true)} className="text-orange-600 font-medium hover:underline">
              Seller Terms &amp; Conditions
            </button>
          </span>
        </label>
      )}

      <div className="flex gap-2 pt-1">
        {kycStep > 1 && (
          <button onClick={()=>{setKycError('');setKycStep(s=>s-1)}} className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-[12px] font-bold hover:bg-slate-200 transition-colors flex items-center gap-1.5 border border-slate-200">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        )}
        <button onClick={handleKycSubmit} disabled={kycSubmitting || (kycStep === 5 && !agreedToTerms)}
          className="flex-1 bg-orange-600 hover:bg-orange-700 text-white text-[12px] font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
          {kycSubmitting ? 'Submitting...' : kycStep === 5 ? <><CheckCircle className="w-4 h-4" /> Submit Application</> : <>Next <ArrowRight className="w-3.5 h-3.5" /></>}
        </button>
      </div>

      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowTermsModal(false)}>
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <h3 className="text-sm font-bold text-gray-900">Seller Terms &amp; Conditions</h3>
              <button type="button" onClick={() => setShowTermsModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-4 space-y-4">
              <p className="text-[11px] text-gray-600 leading-relaxed">{SELLER_TERMS_INTRO}</p>
              {SELLER_TERMS_SECTIONS.map(section => (
                <div key={section.title}>
                  <p className="text-[12px] font-bold text-gray-900 mb-1.5">{section.title}</p>
                  <ul className="space-y-1 list-disc pl-4">
                    {section.points.map((point, i) => (
                      <li key={i} className="text-[11px] text-gray-600 leading-relaxed">{point}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-gray-100 shrink-0">
              <button
                type="button"
                onClick={() => { setAgreedToTerms(true); setShowTermsModal(false); }}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white text-[12px] font-medium py-2.5 rounded-lg transition-colors"
              >
                I Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SellOnCollabo({ page = 'home' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isHowItWorksPage = page === 'how-it-works' || location.pathname === '/sell/how-it-works';

  const [openFaq, setOpenFaq] = useState(null);
  const { user } = useAuth();
  const [hubStats, setHubStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [storeSettings, setStoreSettings] = useState(null);
  const [showGoTop, setShowGoTop] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);
  // Keep the form collapsed on first load; show it once the seller taps "Start Selling",
  // or immediately if they're already logged in / mid-application (so they can resume).
  const [showRegister, setShowRegister] = useState(!!user || location.hash === '#register');

  const revealRegister = () => {
    setSelectedTool(null);
    setShowRegister(true);
    if (!isHowItWorksPage) {
      navigate('/sell/how-it-works#register');
      return;
    }
    setTimeout(() => {
      const el = document.getElementById('register');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const goToSellSection = (hash) => (e) => {
    e.preventDefault();
    if (isHowItWorksPage) {
      navigate(`/sell#${hash}`);
      return;
    }
    const el = document.getElementById(hash);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    api.get('/ecommerce/seller-hub-stats/').then(res => setHubStats(res.data)).catch(() => {});
    api.get('/ecommerce/categories/?page_size=1000').then(res => setCategories((res.data.results || res.data || []).slice(0, 12))).catch(() => {});
    api.get('/ecommerce/store-settings/').then(res => setStoreSettings(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setShowGoTop(window.scrollY > 420);
      setIsScrolled(window.scrollY > 24);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (location.hash === '#register') {
      setShowRegister(true);
    }
    if (location.hash) {
      const targetId = location.hash.replace('#', '');
      const timer = setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
      return () => clearTimeout(timer);
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname, location.hash]);

  const heroBannerSrc = storeSettings?.seller_hub_banner_image || '/images/seller-hero-modern.jpg';

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Main Header — Transparent over Hero at top, frosted white on scroll */}
      <nav
        className={`z-50 transition-all duration-200 ${
          !isHowItWorksPage
            ? isScrolled
              ? 'fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs'
              : 'fixed top-0 left-0 right-0 bg-transparent border-b border-transparent'
            : 'sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-[72px] flex items-center justify-between gap-4">
          <a href="/" className="flex items-center shrink-0">
            <span className="inline-flex items-center h-10 w-[118px] sm:w-[132px] overflow-hidden shrink-0">
              <img
                src="/collabo-logo.png"
                alt="Collabo"
                className="h-10 sm:h-11 w-auto object-contain scale-[1.95] origin-left"
              />
            </span>
          </a>

          <div className="hidden lg:flex items-center gap-8">
            <Link
              to="/sell"
              className={`text-[13.5px] transition-colors pb-1 ${
                !isHowItWorksPage
                  ? 'font-bold text-[#0C2538] border-b-2 border-[#F26B3A]'
                  : 'font-medium text-gray-600 hover:text-[#0C2538]'
              }`}
            >
              Sell Online
            </Link>
            <Link
              to="/sell/how-it-works"
              className={`text-[13.5px] transition-colors pb-1 ${
                isHowItWorksPage
                  ? 'font-bold text-[#0C2538] border-b-2 border-[#F26B3A]'
                  : 'font-medium text-gray-600 hover:text-[#0C2538]'
              }`}
            >
              How It Works
            </Link>
            <a href="/sell#benefits" onClick={goToSellSection('benefits')} className="text-[13.5px] font-medium text-gray-600 hover:text-[#0C2538] transition-colors">
              Seller Benefits
            </a>
            <a href="/sell#pricing" onClick={goToSellSection('pricing')} className="text-[13.5px] font-medium text-gray-600 hover:text-[#0C2538] transition-colors">
              Pricing
            </a>
            <a href="/sell#support" onClick={goToSellSection('support')} className="text-[13.5px] font-medium text-gray-600 hover:text-[#0C2538] transition-colors">
              Support
            </a>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <a
              href={user ? '/dashboard' : '/'}
              className="px-4 sm:px-5 py-2 rounded-full bg-white/85 backdrop-blur-xs border border-[#0C2538] text-[#0C2538] hover:bg-white text-[12.5px] sm:text-[13px] font-semibold transition-colors"
            >
              Seller Login
            </a>
            {user ? (
              <a
                href="/dashboard"
                className="px-5 sm:px-6 py-2 rounded-full bg-[#F26B3A] hover:bg-[#E05A2B] text-white text-[12.5px] sm:text-[13px] font-bold shadow-sm transition-colors"
              >
                Start Selling
              </a>
            ) : (
              <button
                type="button"
                onClick={revealRegister}
                className="px-5 sm:px-6 py-2 rounded-full bg-[#F26B3A] hover:bg-[#E05A2B] text-white text-[12.5px] sm:text-[13px] font-bold shadow-sm transition-colors"
              >
                Start Selling
              </button>
            )}
          </div>
        </div>
      </nav>

      {isHowItWorksPage ? (
        <>
          {/* Dedicated How It Works Page — 4-Step Journey + Collabo Seller Hub Onboarding */}
          <section id="how-it-works" className="bg-[#F5F7FA] border-b border-gray-200">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-14">
              <div>
                <div className="text-center mb-10">
                  <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-[#1B6B6B] bg-teal-50 border border-teal-200 px-3 py-1 rounded-full mb-3">
                    Step-by-Step Guide
                  </span>
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0C2538] tracking-tight">
                    How selling on <span className="text-[#1B6B6B]">Collabo</span> works
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 mt-2">
                    4 simple steps from registration to your first payout
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {STEPS_INFO.map((s, i) => (
                    <div key={i} className="bg-white rounded-xl p-6 border border-gray-200 relative shadow-sm">
                      <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center mb-4">
                        <span className="text-xs font-extrabold text-[#027CD5]">{s.step}</span>
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 mb-1.5">{s.title}</h3>
                      <p className="text-[12px] text-gray-500 leading-relaxed">{s.desc}</p>
                      {i < STEPS_INFO.length - 1 && (
                        <ArrowRight className="hidden lg:block absolute -right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#027CD5] bg-[#F5F7FA] rounded-full p-0.5 z-10" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Collabo Seller Hub — Onboarding & Registration (preserves 100% of SellerRegistrationWidget logic) */}
              <div id="register" className="pt-10 border-t border-gray-200/80 scroll-mt-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                  <div className="lg:col-span-6 space-y-6 pt-1">
                    <div>
                      <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-[#027CD5] bg-blue-50 border border-blue-100 px-3 py-1 rounded-full mb-3">
                        Collabo Seller Hub
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-bold text-[#1B2741] leading-snug">
                        Start selling online on <span className="text-orange-600">Collabo</span> in minutes
                      </h2>
                      <p className="text-sm text-gray-600 leading-relaxed mt-2.5">
                        Create your seller account, submit your KYC details, and list your products with zero listing charges.
                      </p>
                    </div>

                    {/* Documents Checklist */}
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                        All you need to sell on Collabo
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { icon: FileText, title: 'GSTIN & PAN', desc: 'Valid 15-digit GSTIN and 10-character PAN card' },
                          { icon: CreditCard, title: 'Bank Account', desc: 'Active bank account with IFSC for 7-day payouts' },
                          { icon: Building2, title: 'Pickup Address', desc: 'Business or warehouse address for courier pickup' },
                          { icon: Layers, title: 'Product Catalog', desc: 'Add items manually or bulk import via CSV' },
                        ].map((item) => (
                          <div key={item.title} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#027CD5] flex items-center justify-center shrink-0">
                              <item.icon className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-900">{item.title}</p>
                              <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Real Platform Highlights */}
                    <div className="space-y-2.5 pt-1">
                      {[
                        '0% commission charge & zero listing fees',
                        'Integrated shipping with Shiprocket courier partners',
                        'Creators & influencers can promote your products',
                        '7-day payment settlement directly to your bank account',
                      ].map((t, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                          <span className="text-[13px] text-gray-700">{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-6 bg-white rounded-2xl border border-gray-200/90 shadow-[0_10px_34px_rgba(15,23,42,0.07)] overflow-hidden lg:sticky lg:top-20">
                    {/* Top brand accent bar */}
                    <div className="h-1.5 w-full bg-gradient-to-r from-[#1B2741] via-[#027CD5] to-orange-500" />

                    {/* Structured Card Header */}
                    <div className="px-6 sm:px-7 py-5 bg-[#F8FAFC] border-b border-gray-200/80 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 bg-white border border-orange-200/80 rounded-xl shadow-sm flex items-center justify-center shrink-0">
                          <Store className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <h2 className="text-[16px] font-bold text-[#1B2741] leading-snug">Become a Collabo Seller</h2>
                          <p className="text-[11px] text-gray-500 mt-0.5">Official seller onboarding &amp; KYC verification</p>
                        </div>
                      </div>
                      <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full shrink-0">
                        <CheckCircle className="w-3 h-3" /> Free Setup
                      </span>
                    </div>

                    <div className="p-6 sm:p-7">
                      {showRegister ? (
                        <SellerRegistrationWidget />
                      ) : (
                        <div className="space-y-6">
                          {/* 3-Step Onboarding Preview */}
                          <div className="space-y-3.5">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                              Quick Onboarding Process
                            </p>
                            {[
                              { num: '1', title: 'Create Seller Account', desc: 'Sign up with your business name, email, and 10-digit phone number.' },
                              { num: '2', title: 'Submit Business & KYC Details', desc: 'Add store address, GSTIN, PAN card, bank account, and categories.' },
                              { num: '3', title: 'Approval & Start Selling', desc: 'Profile reviewed within 24–48 hours — start listing with ₹0 fees.' },
                            ].map((step) => (
                              <div key={step.num} className="flex items-start gap-3">
                                <span className="w-6 h-6 rounded-full bg-blue-50 border border-blue-200 text-[#027CD5] text-[11px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                                  {step.num}
                                </span>
                                <div>
                                  <p className="text-[13px] font-semibold text-gray-900 leading-snug">{step.title}</p>
                                  <p className="text-[11.5px] text-gray-500 leading-relaxed mt-0.5">{step.desc}</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Key Factual Terms Strip */}
                          <div className="grid grid-cols-3 divide-x divide-gray-200 bg-[#F8FAFC] border border-gray-200/80 rounded-xl py-3 text-center">
                            <div>
                              <p className="text-sm font-extrabold text-[#1B2741]">₹0</p>
                              <p className="text-[10px] font-medium text-gray-500 mt-0.5">Listing Fee</p>
                            </div>
                            <div>
                              <p className="text-sm font-extrabold text-[#1B2741]">0%</p>
                              <p className="text-[10px] font-medium text-gray-500 mt-0.5">Commission</p>
                            </div>
                            <div>
                              <p className="text-sm font-extrabold text-[#1B2741]">7 Days</p>
                              <p className="text-[10px] font-medium text-gray-500 mt-0.5">Settlement</p>
                            </div>
                          </div>

                          {/* Primary CTA */}
                          <div className="space-y-3">
                            <button
                              type="button"
                              onClick={() => setShowRegister(true)}
                              className="w-full bg-orange-500 hover:bg-orange-600 text-white text-[14px] font-bold py-3.5 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
                            >
                              Start Selling <ArrowRight className="w-4 h-4" />
                            </button>

                            <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                              <span className="inline-flex items-center gap-1.5">
                                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                                Secure KYC verification
                              </span>
                              <span>
                                Already a seller?{' '}
                                <a href="/" className="text-[#027CD5] font-semibold hover:underline">
                                  Login
                                </a>
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      ) : (
        <>
          {/* Full-Viewport Hero Wrapper: Navbar + Split Hero + 5-Column Strip = exact 100vh on desktop */}
          <div className="lg:h-screen lg:min-h-[600px] lg:max-h-[960px] flex flex-col bg-white">
            {/* Modern Collabo Split Editorial Hero Section (fills viewport above 5-column bar) */}
            <section className="relative bg-white overflow-hidden lg:flex-1 lg:flex">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full lg:flex lg:items-stretch">
                <div className="grid grid-cols-1 lg:grid-cols-12 items-center w-full lg:h-full">
                  {/* Left: Bold Headline & Pill CTAs (subtext removed) */}
                  <div className="lg:col-span-6 relative z-20 pt-24 pb-10 sm:pt-28 sm:pb-12 lg:py-20 lg:pr-4">
                    <h1 className="text-4xl sm:text-5xl lg:text-[58px] font-extrabold text-[#0C2538] leading-[1.08] tracking-tight">
                      Grow your business
                      <br />
                      with <span className="text-[#1B6B6B]">Collabo</span>
                    </h1>

                    <div className="mt-8 sm:mt-9 flex flex-wrap items-center gap-3.5">
                      <button
                        type="button"
                        onClick={revealRegister}
                        className="bg-[#F26B3A] hover:bg-[#E05A2B] text-white text-sm font-bold px-7 py-3.5 rounded-full shadow-[0_8px_22px_rgba(242,107,58,0.28)] transition-all inline-flex items-center gap-2"
                      >
                        Start Selling <ArrowRight className="w-4 h-4" />
                      </button>
                      <a
                        href="#benefits"
                        onClick={goToSellSection('benefits')}
                        className="border border-[#0C2538] text-[#0C2538] hover:bg-slate-50 text-sm font-bold px-7 py-3.5 rounded-full transition-colors"
                      >
                        Explore Seller Benefits
                      </a>
                    </div>
                  </div>

                  {/* Right: Close-up Seller Photo with Smooth Half-Circle Edge & Tucked Teal/Coral Arc */}
                  <div className="lg:col-span-6 relative h-[310px] sm:h-[390px] lg:h-full -mx-4 sm:-mx-6 lg:mx-0">
                    {/* Bold Coral + Deep Teal True Half-Circle tucked cleanly behind the curved photo edge */}
                    <div
                      aria-hidden="true"
                      className="hidden lg:block absolute -left-28 -bottom-[220px] w-[440px] h-[440px] rounded-full bg-[#F26B3A] z-10 pointer-events-none overflow-hidden"
                    >
                      <div className="absolute inset-3.5 rounded-full bg-[#135562]" />
                    </div>

                    {/* Photo container with full-height smooth semi-circle left edge */}
                    <div className="relative z-20 w-full lg:w-[calc(100%+max(0px,(100vw-80rem)/2)+1.5rem)] h-full overflow-hidden lg:rounded-tl-[100vh]">
                      <img
                        src={heroBannerSrc}
                        alt="Grow your business with Collabo"
                        className="w-full h-full object-cover object-[85%_18%] scale-[1.22] origin-[82%_26%]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 5-Column Icon Highlights Bar — pinned flush to the bottom of the 100vh hero */}
            <section className="shrink-0 bg-white border-y border-gray-200/90">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-y-5 lg:gap-y-0 lg:divide-x divide-gray-200">
                  {[
                    { icon: Headphones, v: '24×7', l: 'seller support' },
                    { icon: MapPin, v: '19,000+', l: 'pincodes served' },
                    { icon: Percent, v: '0%', l: 'commission' },
                    { icon: Gift, v: 'Free', l: 'product listing' },
                    { icon: Users, v: '1 lakh+', l: 'influencers across India' },
                  ].map((item) => (
                    <div key={item.l} className="flex items-center justify-center gap-3 px-3">
                      <item.icon className="w-7 h-7 text-[#0C2538] shrink-0" strokeWidth={1.6} />
                      <div className="text-left leading-tight">
                        <p className="text-[15px] sm:text-[16px] font-extrabold text-[#0C2538]">{item.v}</p>
                        <p className="text-[12px] text-gray-600 mt-0.5">{item.l}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* A Platform Built for Sellers Strip (right below Hero) */}
          <section className="bg-white pt-8 sm:pt-10 pb-2">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="bg-[#F4F7FA] border border-slate-200/75 rounded-2xl px-6 sm:px-9 py-6 sm:py-7 flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
                {/* Left: Bold 2-line Headline */}
                <div className="text-center lg:text-left shrink-0">
                  <h2 className="text-xl sm:text-[23px] font-extrabold text-[#0C2538] leading-snug tracking-tight">
                    A platform built
                    <br />
                    for sellers, by <span className="text-[#1B6B6B]">India</span>
                  </h2>
                </div>

                {/* Hairline Vertical Divider */}
                <div className="hidden lg:block w-px h-12 bg-slate-300/80 shrink-0" />

                {/* Center: Description */}
                <p className="text-[13px] sm:text-[14px] text-slate-600 leading-relaxed text-center lg:text-left max-w-md">
                  From fashion to home essentials, beauty to electronics — list your products across diverse categories on Collabo and reach customers nationwide.
                </p>

                {/* Right: 5 Circular Studio Product Showcase Medallions */}
                <div className="flex items-center justify-center gap-2.5 sm:gap-3 shrink-0 flex-wrap">
                  {[
                    { src: '/images/seller-strip-dress.jpg', alt: 'Fashion & Apparel', bg: 'bg-[#E8F4FA]' },
                    { src: '/images/seller-strip-sofa.jpg', alt: 'Furniture & Home', bg: 'bg-[#FAF1EB]' },
                    { src: '/images/seller-strip-headphones.jpg', alt: 'Electronics', bg: 'bg-[#EDF2F7]' },
                    { src: '/images/seller-strip-beauty.jpg', alt: 'Beauty & Personal Care', bg: 'bg-[#FFF0EC]' },
                    { src: '/images/seller-strip-teddy.jpg', alt: 'Kids & Toys', bg: 'bg-[#F2F4F7]' },
                  ].map((prod) => (
                    <div
                      key={prod.alt}
                      title={prod.alt}
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full ${prod.bg} border-2 border-white shadow-xs overflow-hidden flex items-center justify-center transition-transform duration-200 hover:scale-105`}
                    >
                      <img
                        src={prod.src}
                        alt={prod.alt}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* How Selling on Collabo Works — 4 Illustrated Pastel Cards (Collabo Theme) */}
          <section className="bg-white border-b border-gray-200">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
              <div className="text-center mb-24">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0C2538] tracking-tight">
                  How selling on <span className="text-[#1B6B6B]">Collabo</span> works
                </h2>
                <div className="w-14 h-1 rounded-full bg-gradient-to-r from-[#F26B3A] to-[#1B6B6B] mx-auto mt-3" />
                <p className="text-xs sm:text-sm text-gray-500 mt-2.5">
                  4 simple steps from registration to your first payout
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-24 pt-2">
                {[
                  {
                    ...STEPS_INFO[0],
                    type: 'account',
                    cardBg: 'bg-[#FFF5F0] border-[#FDE0D2]',
                    cta: 'Start Registration',
                    onClick: revealRegister,
                  },
                  {
                    ...STEPS_INFO[1],
                    type: 'kyc',
                    cardBg: 'bg-[#FFF9EB] border-[#FDE8BE]',
                    cta: 'KYC Checklist',
                    onClick: () => navigate('/sell/how-it-works#register'),
                  },
                  {
                    ...STEPS_INFO[2],
                    type: 'list',
                    cardBg: 'bg-[#EDF8F7] border-[#CBEBE8]',
                    cta: 'Explore Tools',
                    onClick: goToSellSection('benefits'),
                  },
                  {
                    ...STEPS_INFO[3],
                    type: 'earn',
                    cardBg: 'bg-[#F0F6FF] border-[#D6E6FF]',
                    cta: 'View Payouts',
                    onClick: goToSellSection('pricing'),
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className={`relative rounded-2xl border ${item.cardBg} px-5 pt-24 pb-7 text-center flex flex-col justify-between transition-all hover:shadow-md hover:-translate-y-0.5`}
                  >
                    {/* Overlapping Studio-Grade Collabo Illustration */}
                    <div className="absolute -top-[74px] left-1/2 -translate-x-1/2">
                      <StepIllustration type={item.type} alt={item.title} />
                    </div>

                    <div className="pt-2">
                      <span className="inline-block text-[10px] font-extrabold tracking-widest uppercase text-[#1B6B6B] mb-1.5">
                        Step {item.step}
                      </span>
                      <h3 className="text-[17px] font-extrabold text-[#0C2538] mb-2.5">
                        {item.title}
                      </h3>
                      <p className="text-[13px] text-gray-600 leading-relaxed min-h-[58px]">
                        {item.desc}
                      </p>
                    </div>

                    <div className="pt-5">
                      <button
                        type="button"
                        onClick={item.onClick}
                        className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-[#F26B3A] text-[#0C2538] hover:text-white border border-[#F26B3A]/40 hover:border-[#F26B3A] text-[11.5px] font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg shadow-xs transition-colors"
                      >
                        {item.cta} <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Why Collaborate with Collabo? — 3-Column Showcase (right after How Selling Works) */}
          <section className="relative bg-gradient-to-r from-white via-[#F7FBFD] to-[#EFF7FA] border-b border-slate-200/80 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-6 items-center">
                {/* Left: Heading, Copy & Pill CTA */}
                <div className="lg:col-span-4 space-y-5 text-center lg:text-left">
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0C2538] leading-[1.12] tracking-tight">
                    Why Collaborate
                    <br />
                    with <span className="text-[#F26B3A]">Collabo?</span>
                  </h2>
                  <p className="text-sm sm:text-[15px] text-gray-600 leading-relaxed max-w-sm mx-auto lg:mx-0">
                    Join a growing community of sellers and take your business to the next level.
                  </p>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={revealRegister}
                      className="bg-[#F26B3A] hover:bg-[#E05A2B] text-white text-sm font-bold px-8 py-3.5 rounded-full shadow-[0_8px_22px_rgba(242,107,58,0.28)] transition-all inline-flex items-center gap-2"
                    >
                      Start Selling <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Center: 3D Growing Graph Only */}
                <div className="lg:col-span-4 flex items-center justify-center">
                  <GrowingGraphIllustration />
                </div>

                {/* Right: 3 Stacked Highlight Cards */}
                <div className="lg:col-span-4 space-y-4">
                  {[
                    {
                      type: 'ease',
                      title: 'Ease of Doing Business',
                      desc: 'Simple registration, smooth onboarding and a seller-friendly platform.',
                    },
                    {
                      type: 'influencers',
                      title: 'Grow – High Volume Influencers',
                      desc: 'Reach more customers with our 1 lakh+ influencer network.',
                    },
                    {
                      type: 'support',
                      title: 'Additional Support',
                      desc: 'Run powerful promotional campaigns with 0% commission & ₹0 registration fee.',
                    },
                  ].map((card) => (
                    <div
                      key={card.title}
                      className="bg-white rounded-2xl px-5 py-4 shadow-[0_8px_26px_rgba(12,37,56,0.06)] border border-slate-100 flex items-center gap-4 hover:shadow-[0_12px_30px_rgba(27,107,107,0.1)] hover:-translate-y-0.5 transition-all"
                    >
                      <WhyCollaboIcon type={card.type} />
                      <div className="min-w-0">
                        <h3 className="text-[14.5px] font-bold text-[#0C2538] leading-snug">{card.title}</h3>
                        <p className="text-[12.5px] text-gray-500 leading-relaxed mt-0.5">{card.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Built-in Tools to Scale Your Store on Collabo — Split Cards + Laptop Showcase */}
          <section id="benefits" className="relative bg-gradient-to-br from-[#F4FAFC] via-[#F8FBFD] to-[#ECF5F8] border-b border-slate-200/80 overflow-hidden scroll-mt-16">
            {/* Subtle bottom-left Collabo teal + coral corner arc */}
            <svg
              aria-hidden="true"
              viewBox="0 0 180 120"
              className="hidden lg:block absolute left-0 bottom-0 w-40 h-28 pointer-events-none"
            >
              <path d="M0,20 C65,25 120,62 155,120 L0,120 Z" fill="#F26B3A" />
              <path d="M0,34 C58,40 108,72 138,120 L0,120 Z" fill="#135562" />
            </svg>

            {/* Sweeping soft teal backdrop curve behind the right laptop */}
            <div
              aria-hidden="true"
              className="hidden lg:block absolute -right-24 top-6 w-[440px] h-[440px] rounded-tl-[260px] rounded-bl-[120px] bg-[#1B6B6B]/12 pointer-events-none"
            />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
                {/* Left 8 cols: Heading + Compact 3x2 Horizontal Tool Cards */}
                <div className="lg:col-span-8 space-y-8">
                  <div className="max-w-2xl">
                    <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-[#0C2538]">
                      Built-in tools to scale your store on{' '}
                      <span className="text-[#1B6B6B]">Collabo</span>
                    </h2>
                    <p className="text-sm sm:text-[15px] text-gray-600 leading-relaxed mt-2.5">
                      Everything you need to run your storefront smoothly — from quick catalog upload to creator-driven discovery and timely payouts.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {SELLER_GROWTH_TOOLS.map((tool) => (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => setSelectedTool(tool)}
                        className="group text-left bg-white rounded-2xl p-4 sm:p-5 shadow-[0_6px_22px_rgba(12,37,56,0.05)] border border-slate-200/70 hover:border-[#1B6B6B]/40 hover:shadow-[0_12px_30px_rgba(27,107,107,0.11)] hover:-translate-y-0.5 transition-all flex items-start gap-3.5"
                      >
                        <div className="shrink-0 transition-transform duration-200 group-hover:scale-105">
                          <ToolBadgeIcon id={tool.id} className="w-12 h-12" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-[14px] font-bold text-[#0C2538] leading-snug group-hover:text-[#1B6B6B] transition-colors">
                            {tool.title}
                          </h3>
                          <p className="text-[12px] text-gray-500 leading-relaxed mt-1 line-clamp-2">
                            {tool.desc}
                          </p>
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#F26B3A] mt-2.5">
                            Learn More <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right 4 cols: Crisp Collabo Seller Dashboard Laptop Showcase */}
                <div className="lg:col-span-4 relative flex items-center justify-center pt-4 lg:pt-6">
                  {/* Decorative teal leaves behind laptop */}
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 80 120"
                    className="hidden sm:block absolute -left-3 bottom-6 w-14 h-24 text-[#135562] pointer-events-none"
                  >
                    <path d="M40 115 C38 80 36 45 34 10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" fill="none" />
                    <ellipse cx="22" cy="82" rx="12" ry="6" transform="rotate(-30 22 82)" fill="currentColor" />
                    <ellipse cx="52" cy="68" rx="12" ry="6" transform="rotate(28 52 68)" fill="currentColor" opacity="0.85" />
                    <ellipse cx="20" cy="52" rx="11" ry="5.5" transform="rotate(-32 20 52)" fill="currentColor" opacity="0.9" />
                    <ellipse cx="48" cy="36" rx="10" ry="5" transform="rotate(26 48 36)" fill="currentColor" opacity="0.8" />
                  </svg>

                  {/* Laptop Mockup */}
                  <div className="relative w-full max-w-[340px]">
                    {/* Floating Top-Right Growth Card */}
                    <div className="absolute -top-6 -right-3 z-20 bg-white rounded-xl p-3 shadow-[0_10px_28px_rgba(12,37,56,0.14)] border border-slate-100">
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#F26B3A]" />
                      <svg viewBox="0 0 64 42" className="w-14 h-9" aria-hidden="true">
                        <path d="M6 22 L24 14 L38 18 L56 6" stroke="#1B6B6B" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        <path d="M48 6 H56 V14" stroke="#1B6B6B" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        <rect x="8" y="28" width="8" height="10" rx="2" fill="#CCEBE8" />
                        <rect x="21" y="24" width="8" height="14" rx="2" fill="#8CCAC7" />
                        <rect x="34" y="21" width="8" height="17" rx="2" fill="#1B6B6B" />
                        <rect x="47" y="16" width="8" height="22" rx="2" fill="#F26B3A" />
                      </svg>
                    </div>

                    {/* Screen Frame */}
                    <div className="relative z-10 rounded-t-2xl border-[6px] border-[#0C2538] bg-white shadow-[0_18px_40px_rgba(12,37,56,0.16)] overflow-hidden">
                      {/* Mini Dashboard Top Bar */}
                      <div className="px-3.5 py-2.5 bg-[#F8FAFC] border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#F26B3A]" />
                          <span className="text-[10px] font-extrabold text-[#0C2538] tracking-tight">Collabo Seller</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-10 h-1.5 rounded-full bg-slate-200" />
                          <span className="w-4 h-4 rounded-full bg-[#EAF5F5] border border-[#1B6B6B]/20" />
                        </div>
                      </div>

                      {/* Mini Dashboard Content */}
                      <div className="p-3.5 space-y-3">
                        <div className="grid grid-cols-12 gap-2.5">
                          {/* Mini Stats + Chart */}
                          <div className="col-span-7 bg-[#F8FAFC] rounded-xl p-2.5 border border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-bold text-gray-500">Store Growth</span>
                              <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">0% Fee</span>
                            </div>
                            <div className="flex items-end gap-1.5 h-12 pt-1">
                              {[32, 48, 40, 66, 58, 84, 96].map((h, i) => (
                                <div
                                  key={i}
                                  style={{ height: `${h}%` }}
                                  className={`flex-1 rounded-t-sm ${i >= 5 ? 'bg-[#F26B3A]' : 'bg-[#1B6B6B]/75'}`}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Mini Featured Product */}
                          <div className="col-span-5 bg-[#FFF5F0] rounded-xl p-2.5 border border-[#FDE2D5] flex flex-col items-center justify-center text-center">
                            <div className="w-10 h-10 rounded-xl bg-white shadow-xs flex items-center justify-center mb-1.5">
                              <Headphones className="w-5 h-5 text-[#0C2538]" />
                            </div>
                            <span className="text-[8.5px] font-bold text-[#0C2538]">Top Product</span>
                            <span className="text-[8px] font-semibold text-[#F26B3A]">Sponsored Ad</span>
                          </div>
                        </div>

                        {/* Mini Bottom Product Strip */}
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { bg: 'bg-[#FFF5F0]', dot: 'bg-[#F26B3A]' },
                            { bg: 'bg-[#EDF8F7]', dot: 'bg-[#1B6B6B]' },
                            { bg: 'bg-[#FFF9EB]', dot: 'bg-amber-400' },
                            { bg: 'bg-[#F0F6FF]', dot: 'bg-[#027CD5]' },
                          ].map((tile, i) => (
                            <div key={i} className={`${tile.bg} rounded-lg p-2 flex flex-col items-center gap-1`}>
                              <span className={`w-4 h-4 rounded-md ${tile.dot} opacity-80`} />
                              <span className="w-7 h-1 rounded-full bg-slate-300/80" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Silver Laptop Base */}
                    <div className="relative z-10 -mx-4 h-3.5 bg-gradient-to-b from-slate-200 via-slate-100 to-slate-300 rounded-b-xl border-t border-slate-300 flex items-center justify-center shadow-md">
                      <span className="w-14 h-1 rounded-full bg-slate-400/50" />
                    </div>
                    <div className="mx-2 h-2 bg-slate-900/10 blur-md rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Fees & Commission — Compact, Standard Collabo Split Card */}
          <section id="pricing" className="bg-[#F6FAFB] border-b border-slate-200/80 scroll-mt-16">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
                <div>
                  <span className="inline-block text-[10.5px] font-bold uppercase tracking-wider text-[#1B6B6B] bg-[#EAF5F5] border border-[#CBEBE8] px-2.5 py-0.5 rounded-full mb-2">
                    Transparent Pricing
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0C2538] tracking-tight">
                    Keep more of every sale on <span className="text-[#1B6B6B]">Collabo</span>
                  </h2>
                </div>
                <p className="text-xs sm:text-[13px] text-gray-500 max-w-sm">
                  No hidden subscriptions, no listing charges, and 0% commission.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_10px_30px_rgba(12,37,56,0.06)] overflow-hidden grid grid-cols-1 lg:grid-cols-12">
                {/* Left: Collabo Teal-Navy 0% Commission Panel */}
                <div className="lg:col-span-5 bg-gradient-to-br from-[#0C2538] via-[#123F4B] to-[#1B6B6B] text-white p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between gap-5">
                  <div className="absolute -top-14 -right-14 w-40 h-40 rounded-full bg-[#F26B3A]/20 blur-3xl pointer-events-none" />

                  <div className="relative z-10 space-y-4">
                    <div className="flex items-baseline gap-2.5">
                      <span className="text-5xl font-black tracking-tight text-white leading-none">0%</span>
                      <span className="text-base font-bold text-[#FF965A]">Commission</span>
                    </div>
                    <p className="text-xs sm:text-[13px] text-slate-200/90 leading-relaxed">
                      List your catalog for free and receive payouts straight to your bank every 7 business days.
                    </p>
                    <div className="space-y-2 pt-2 border-t border-white/15">
                      {[
                        'Unlimited product listings with ₹0 upfront fee',
                        'Zero monthly or annual subscription charges',
                        'Full Seller Dashboard, analytics & CSV import',
                      ].map((item) => (
                        <div key={item} className="flex items-center gap-2 text-[12px] text-slate-100">
                          <CheckCircle className="w-3.5 h-3.5 text-[#FF965A] shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="relative z-10">
                    <button
                      type="button"
                      onClick={revealRegister}
                      className="w-full sm:w-auto bg-[#F26B3A] hover:bg-[#E05A2B] text-white text-xs sm:text-sm font-bold px-7 py-2.5 rounded-full shadow-md transition-colors inline-flex items-center justify-center gap-2"
                    >
                      Start Selling for ₹0 <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Right: Compact Complete Fee Breakdown */}
                <div className="lg:col-span-7 p-6 sm:p-7 flex flex-col justify-center">
                  <div className="flex items-center justify-between gap-2 pb-3.5 mb-1 border-b border-slate-100">
                    <span className="text-sm font-bold text-[#0C2538]">Complete Fee Breakdown</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#1B6B6B] bg-[#EAF5F5] border border-[#CBEBE8] px-2.5 py-0.5 rounded-full">
                      No Hidden Charges
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {[
                      { l: 'Listing Fee', sub: 'Manual or bulk CSV catalog upload', v: 'Free', h: true },
                      { l: 'Monthly Charge', sub: 'No recurring store subscription', v: 'Free', h: true },
                      { l: 'Platform Commission', sub: 'Zero commission on product sales', v: '0% Commission', h: true },
                      { l: 'Payment Settlement', sub: 'Direct bank transfer after delivery', v: '7 business days', h: false },
                      { l: 'Minimum Withdrawal', sub: 'Withdraw available balance anytime', v: '₹100', h: false },
                    ].map((f) => (
                      <div key={f.l} className="py-2.5 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <span className="text-[13px] font-semibold text-[#0C2538]">{f.l}</span>
                          <span className="hidden sm:inline text-[11.5px] text-gray-400 ml-2">· {f.sub}</span>
                        </div>
                        <span
                          className={`text-[11.5px] font-bold px-3 py-0.5 rounded-full shrink-0 ${
                            f.h
                              ? 'bg-[#EAF5F5] text-[#1B6B6B] border border-[#CBEBE8]'
                              : 'bg-slate-100 text-[#0C2538]'
                          }`}
                        >
                          {f.v}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* FAQ */}
      <section id="faq" className="bg-white border-b border-gray-200 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1B2741]">Frequently Asked Questions</h2>
          </div>
          <div className="max-w-2xl mx-auto space-y-2.5">
            {FAQS.map((f, i) => (
              <div
                key={i}
                className={`rounded-xl border transition-colors overflow-hidden ${
                  openFaq === i ? 'bg-orange-50/40 border-orange-200' : 'bg-[#F8FAFC] border-gray-200 hover:border-gray-300'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4"
                >
                  <span className="text-[13px] font-semibold text-[#1B2741]">{f.q}</span>
                  {openFaq === i ? <ChevronUp className="w-4 h-4 text-orange-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-[12.5px] text-gray-600 leading-relaxed">{f.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* We Are Happy to Help You — Support Ticket Section (connected to /support/tickets/) */}
      <SellerSupportSection user={user} />

      {/* Bottom CTA Banner */}
      <section className="bg-[#1B2741]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Ready to grow your business online?</h2>
          <p className="text-xs sm:text-sm text-slate-300 mb-6">Register your store on Collabo with ₹0 listing fees</p>
          <button
            type="button"
            onClick={revealRegister}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-8 py-3 rounded-lg shadow-lg transition-colors"
          >
            Start Selling Now <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[11px] text-gray-500">Collabo Inc. All rights reserved. | support@collabo.com | +91 84481 19359</span>
          <div className="flex items-center gap-5 text-[11px] text-gray-500">
            <a href="/privacy" className="hover:text-gray-800">Privacy Policy</a>
            <a href="/terms" className="hover:text-gray-800">Terms &amp; Conditions</a>
          </div>
        </div>
      </footer>

      {selectedTool && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-[2px]"
          onClick={() => setSelectedTool(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 bg-[#F4F9FF] border-b border-blue-100 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <ToolBadgeIcon id={selectedTool.id} className="w-12 h-12 shrink-0" />
                <div>
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-[#027CD5] bg-blue-100/70 px-2 py-0.5 rounded mb-1">
                    {selectedTool.badge}
                  </span>
                  <h3 className="text-lg font-bold text-[#1B2741] leading-snug">{selectedTool.title}</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTool(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
              <p className="text-[13px] text-gray-600 leading-relaxed">{selectedTool.overview}</p>

              <div className="flex flex-wrap gap-2">
                {selectedTool.highlights.map((h) => (
                  <span
                    key={h}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#1B2741] bg-slate-100 px-2.5 py-1 rounded-full"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    {h}
                  </span>
                ))}
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">
                  How it works on Collabo
                </p>
                <ol className="space-y-2.5">
                  {selectedTool.steps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-[13px] text-gray-700 leading-relaxed">
                      <span className="w-5 h-5 rounded-full bg-orange-50 border border-orange-200 text-orange-600 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedTool(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-200/70 transition-colors"
              >
                Close
              </button>
              {user && (user.seller_profile?.verification_status === 'approved' || user.user_type === 'seller') ? (
                <a
                  href="/dashboard"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1.5"
                >
                  Open Seller Dashboard <ArrowRight className="w-3.5 h-3.5" />
                </a>
              ) : (
                <button
                  type="button"
                  onClick={revealRegister}
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1.5"
                >
                  Start Selling <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showGoTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-40 bg-white/95 hover:bg-white text-[#027CD5] border border-blue-100 shadow-[0_6px_20px_rgba(2,124,213,0.16)] rounded-full px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 transition-all"
        >
          <ArrowUp className="w-3.5 h-3.5" /> Go to Top
        </button>
      )}
    </div>
  );
}
