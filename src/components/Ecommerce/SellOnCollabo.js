import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import {
  Store, TrendingUp, Shield, Truck, BarChart3, Users, Package,
  ArrowRight, ArrowLeft, ArrowUp, CheckCircle, ChevronDown, ChevronUp, Eye, EyeOff,
  Mail, Lock, User, Phone, AlertCircle, Upload, X, MapPin,
  FileText, CreditCard, Building2, Layers, Megaphone, Tag, UploadCloud, LayoutDashboard, Wallet,
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

function SellerSupportIllustration() {
  return (
    <svg viewBox="0 0 420 340" fill="none" className="w-full max-w-[380px] mx-auto" aria-hidden="true">
      {/* Soft warm peach/orange halo backdrop */}
      <circle cx="222" cy="175" r="132" fill="#FFF7ED" />
      <circle cx="222" cy="175" r="102" fill="#FFEDD5" fillOpacity="0.65" />

      {/* Subtle decorative motion arcs */}
      <path d="M98 228C88 242 96 266 118 274" stroke="#1B2741" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="88" cy="218" r="3" fill="#F97316" />
      <path d="M352 132C362 152 362 178 352 198" stroke="#1B2741" strokeWidth="1.8" strokeLinecap="round" strokeDasharray="3 5" />

      {/* Floating chat bubbles (top-left) */}
      <path
        d="M110 74C110 64.6 121 57 134.5 57H162C175.5 57 186.5 64.6 186.5 74C186.5 83.4 175.5 91 162 91H134.5L118 100L121.5 88.5C114.5 85.4 110 80.1 110 74Z"
        fill="#FB923C"
      />
      <path
        d="M142 104C142 94.6 153 87 166.5 87H196C209.5 87 220.5 94.6 220.5 104C220.5 113.4 209.5 121 196 121H170L155 130L158.5 118.5C148.5 115.6 142 110.2 142 104Z"
        fill="#FFFFFF"
        stroke="#FDBA74"
        strokeWidth="1.6"
      />
      <path d="M162 102H196M162 109H184" stroke="#1B2741" strokeWidth="2.2" strokeLinecap="round" />

      {/* Floating support icons (top-right) */}
      <g transform="translate(262 46)">
        <circle cx="20" cy="20" r="19" fill="#FFFFFF" stroke="#1B2741" strokeWidth="1.8" />
        <path
          d="M15.2 13.8C15.7 13.3 16.5 13.3 17 13.8L18.6 15.4C19.1 15.9 19.1 16.7 18.6 17.2L17.6 18.2C18.3 19.6 19.4 20.7 20.8 21.4L21.8 20.4C22.3 19.9 23.1 19.9 23.6 20.4L25.2 22C25.7 22.5 25.7 23.3 25.2 23.8L24.1 24.9C23.1 25.9 21.5 26.2 20.2 25.6C17.2 24.2 14.8 21.8 13.4 18.8C12.8 17.5 13.1 15.9 14.1 14.9L15.2 13.8Z"
          fill="#F97316"
        />
      </g>
      <g transform="translate(306 72)">
        <circle cx="19" cy="19" r="18" fill="#FFFFFF" stroke="#1B2741" strokeWidth="1.8" />
        <rect x="10.5" y="13" width="17" height="12" rx="2" fill="#F97316" />
        <path d="M11.5 14L19 19.5L26.5 14" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g transform="translate(328 118)">
        <circle cx="20" cy="20" r="19" fill="#FFFFFF" stroke="#1B2741" strokeWidth="1.8" />
        <text x="20" y="24" textAnchor="middle" fill="#EA580C" fontSize="11" fontWeight="800" fontFamily="sans-serif">
          24/7
        </text>
      </g>

      {/* Support Agent */}
      {/* Body / Orange sweater */}
      <path
        d="M150 264C150 226 172 194 206 188L248 188C284 194 316 220 318 264H150Z"
        fill="#F97316"
      />
      {/* Left waving arm */}
      <path
        d="M174 204L142 184L130 162"
        stroke="#F97316"
        strokeWidth="22"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Waving hand */}
      <path
        d="M126 164L116 146C115 144 117 141.5 119.5 143L126 148V137C126 135 129 135 129.5 137L131.5 146L134 138C134.5 136 137.5 136.5 137.5 139L136.5 152C136.5 158 132 164 126 164Z"
        fill="#FFFFFF"
        stroke="#1B2741"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Neck & Collar */}
      <path d="M214 174V192C214 198 228 198 228 192V174" fill="#FFFFFF" stroke="#1B2741" strokeWidth="1.8" />
      {/* Head */}
      <ellipse cx="222" cy="150" rx="20" ry="24" fill="#FFFFFF" stroke="#1B2741" strokeWidth="2" />
      {/* Hair */}
      <path
        d="M201 146C198 130 208 118 224 118C236 118 244 125 244 137C238 131 230 132 224 137C217 143 207 144 201 146Z"
        fill="#1B2741"
      />
      {/* Headset */}
      <path d="M202 146C202 128 211 118 223 118C235 118 243 128 243 145" stroke="#1B2741" strokeWidth="2.4" strokeLinecap="round" />
      <rect x="239" y="140" width="8" height="14" rx="4" fill="#F97316" stroke="#1B2741" strokeWidth="1.6" />
      <path d="M242 154C240 162 232 165 224 164" stroke="#1B2741" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="223" cy="164" r="2.2" fill="#1B2741" />

      {/* Right resting hand */}
      <path
        d="M294 252C298 246 312 246 316 254C319 260 315 266 306 266H292"
        fill="#FFFFFF"
        stroke="#1B2741"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Desktop Monitor */}
      <path d="M188 262L180 284H224L216 262" fill="#FED7AA" stroke="#1B2741" strokeWidth="2" strokeLinejoin="round" />
      <path d="M168 284H236" stroke="#1B2741" strokeWidth="2.4" strokeLinecap="round" />
      <path
        d="M128 190C128 185.6 131.6 182 136 182H250C254.4 182 258 185.6 258 190V256C258 260.4 254.4 264 250 264H136C131.6 264 128 260.4 128 256V190Z"
        fill="#FFFFFF"
        stroke="#1B2741"
        strokeWidth="2.2"
      />
      {/* Monitor Collabo orange badge */}
      <circle cx="193" cy="223" r="14" fill="#FFF7ED" stroke="#F97316" strokeWidth="2" />
      <path d="M187 223L191 227L199 219" stroke="#F97316" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />

      {/* Desk surface */}
      <path d="M84 284H344" stroke="#1B2741" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
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
              <p className="text-sm text-gray-600 leading-relaxed mt-2.5 max-w-lg">
                Have a question about onboarding, KYC, shipping, or payouts? Raise a ticket with the Collabo Seller Support team and track replies directly in your account.
              </p>
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
                {!user && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-orange-900">
                      Log in to raise a support ticket linked to your Collabo account.
                    </p>
                    <a
                      href="/"
                      className="shrink-0 bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold px-3.5 py-1.5 rounded-lg transition-colors"
                    >
                      Login
                    </a>
                  </div>
                )}

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

export default function SellOnCollabo() {
  const [openFaq, setOpenFaq] = useState(null);
  const { user } = useAuth();
  const [hubStats, setHubStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [storeSettings, setStoreSettings] = useState(null);
  const [showGoTop, setShowGoTop] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);
  // Keep the form collapsed on first load; show it once the seller taps "Start Selling",
  // or immediately if they're already logged in / mid-application (so they can resume).
  const [showRegister, setShowRegister] = useState(!!user);

  const revealRegister = () => {
    setSelectedTool(null);
    setShowRegister(true);
    const el = document.getElementById('register');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    api.get('/ecommerce/seller-hub-stats/').then(res => setHubStats(res.data)).catch(() => {});
    api.get('/ecommerce/categories/?page_size=1000').then(res => setCategories((res.data.results || res.data || []).slice(0, 12))).catch(() => {});
    api.get('/ecommerce/store-settings/').then(res => setStoreSettings(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const onScroll = () => setShowGoTop(window.scrollY > 420);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const heroBannerSrc = storeSettings?.seller_hub_banner_image || '/images/seller-hero-banner.jpg';

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Top Utility Strip */}
      <div className="bg-[#F4F6F8] border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-4 text-[12px] text-gray-600">
          <p className="truncate">
            Already selling on Collabo?{' '}
            <a href={user ? '/dashboard' : '/'} className="text-[#027CD5] hover:underline font-medium">
              {user ? 'Open your Seller Dashboard to manage orders and payouts' : 'Sign in to manage your store, orders, and payouts'}
            </a>
          </p>
          <a href="/" className="hidden sm:inline text-[11px] font-medium text-gray-500 hover:text-orange-600 transition-colors shrink-0">
            ← Back to Collabo Store
          </a>
        </div>
      </div>

      {/* Main Sticky Header */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="max-w-7xl mx-auto pl-4 sm:pl-6 pr-0 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-8 min-w-0">
            <a href="/" className="flex items-center gap-3 shrink-0">
              <span className="inline-flex items-center h-10 w-[108px] sm:w-[122px] overflow-hidden shrink-0">
                <img
                  src="/collabo-logo.png"
                  alt="Collabo"
                  className="h-10 sm:h-11 w-auto object-contain scale-[1.9] origin-left"
                />
              </span>
              <div className="leading-none border-l border-gray-200 pl-3">
                <span className="block text-[10px] font-semibold text-gray-500 tracking-wide">Sell on</span>
                <span className="block text-[15px] font-extrabold text-[#1B2741] tracking-tight">Collabo</span>
              </div>
            </a>

            <div className="hidden lg:flex items-center gap-7">
              <a href="#how-it-works" className="text-[13px] font-medium text-gray-700 hover:text-orange-600 transition-colors">
                How It Works
              </a>
              <a href="#pricing" className="text-[13px] font-medium text-gray-700 hover:text-orange-600 transition-colors">
                Pricing
              </a>
              <a href="#benefits" className="text-[13px] font-medium text-gray-700 hover:text-orange-600 transition-colors">
                Seller Tools
              </a>
              <a href="#categories" className="text-[13px] font-medium text-gray-700 hover:text-orange-600 transition-colors">
                Categories
              </a>
              <a href="#support" className="text-[13px] font-medium text-gray-700 hover:text-orange-600 transition-colors">
                Support
              </a>
            </div>
          </div>

          <div className="flex items-center h-full shrink-0">
            <a
              href={user ? '/dashboard' : '/'}
              className="px-4 sm:px-6 text-[13px] font-semibold text-gray-700 hover:text-[#027CD5] transition-colors"
            >
              {user ? 'Dashboard' : 'Login'}
            </a>
            {user ? (
              <a
                href="/dashboard"
                className="h-full px-6 sm:px-8 bg-orange-500 hover:bg-orange-600 text-white text-[13px] sm:text-[14px] font-bold flex items-center justify-center transition-colors"
              >
                Go to Dashboard
              </a>
            ) : (
              <button
                type="button"
                onClick={revealRegister}
                className="h-full px-6 sm:px-8 bg-orange-500 hover:bg-orange-600 text-white text-[13px] sm:text-[14px] font-bold flex items-center justify-center transition-colors"
              >
                Start Selling
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Full-Width Photographic Hero Banner (Flipkart Seller Hub style) */}
      <section className="relative w-full bg-[#1B2741] overflow-hidden">
        <div className="relative w-full h-[320px] sm:h-[390px] lg:h-[440px] max-w-[1600px] mx-auto">
          <img
            src={heroBannerSrc}
            alt="Sell on Collabo"
            className="w-full h-full object-cover object-[20%_center] sm:object-center"
          />
          {/* Clean readability gradient on the right half for crisp HTML typography */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A]/25 via-[#0F172A]/55 to-[#0F172A]/90 sm:from-transparent sm:via-[#0F172A]/40 sm:to-[#0F172A]/92" />

          <div className="absolute inset-0 max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-end">
            <div className="w-full sm:w-[54%] lg:w-[46%] text-left sm:pl-6 space-y-4">
              <div>
                <p className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.45)]">
                  0%
                </p>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-white uppercase tracking-tight leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)] mt-1">
                  Commission Charge<span className="text-orange-400">*</span>
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <div>
                  <span className="inline-block bg-[#1B2741] border border-white/15 text-white text-xs sm:text-sm lg:text-base font-bold px-4 py-1.5 -skew-x-6 shadow-lg">
                    <span className="inline-block skew-x-6">₹0 listing cost &amp; 0% commission on sales</span>
                  </span>
                </div>
                <div>
                  <span className="inline-block bg-orange-500 text-white text-xs sm:text-sm lg:text-base font-extrabold px-4 py-1.5 -skew-x-6 shadow-lg">
                    <span className="inline-block skew-x-6">Launch your store &amp; reach buyers with creators</span>
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={revealRegister}
                  className="bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-bold px-6 py-3 rounded-lg shadow-lg transition-colors inline-flex items-center gap-2"
                >
                  Start Selling <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href="#pricing"
                  className="bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white border border-white/30 text-xs sm:text-sm font-semibold px-5 py-3 rounded-lg transition-colors"
                >
                  View Fees
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Column Stats Bar (Flipkart Seller Hub style — 100% real backend stats & policies) */}
      <section className="bg-white border-b border-gray-200 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-7">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-5 lg:gap-y-0 lg:divide-x divide-gray-200">
            {[
              { v: '24×7', l: 'Seller Support' },
              { v: '0%', l: 'Platform Commission' },
              { v: hubStats ? String(hubStats.products_listed) : '—', l: 'Products Listed' },
              { v: '7 Days', l: 'Payment Settlement' },
            ].map((s) => (
              <div key={s.l} className="text-center px-3">
                <p className="text-2xl sm:text-[30px] font-bold text-[#027CD5] tracking-tight leading-tight">{s.v}</p>
                <p className="text-xs sm:text-[13px] font-medium text-gray-600 mt-1">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Seller Onboarding & Registration Section (preserves 100% of SellerRegistrationWidget logic) */}
      <section id="register" className="bg-[#F5F7FA] border-b border-gray-200 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-6 space-y-6 pt-1">
              <div>
                <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-[#027CD5] bg-blue-50 border border-blue-100 px-3 py-1 rounded-full mb-3">
                  Collabo Seller Hub
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#1B2741] leading-snug">
                  Start selling online on <span className="text-orange-600">Collabo</span> in minutes
                </h1>
                <p className="text-sm text-gray-600 leading-relaxed mt-2.5">
                  Create your seller account, submit your KYC details, and list your products with zero listing charges.
                </p>
              </div>

              {/* Documents Checklist (Flipkart Seller Hub style) */}
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
      </section>

      {/* Top Categories Section (with Rounded Line icons) */}
      {categories.length > 0 && (
        <section id="categories" className="bg-white border-b border-gray-200 scroll-mt-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
            <div className="text-center mb-9">
              <h2 className="text-2xl font-bold text-[#1B2741]">Sell across top categories</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1.5">List products in categories shoppers browse on Collabo</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
              {categories.map((c) => {
                const IconComp = getRoundedCategoryIcon(c.name);
                return (
                  <div
                    key={c.id}
                    className="bg-[#F8FAFC] border border-gray-200/80 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:border-[#027CD5]/40 hover:bg-blue-50/30 hover:shadow-sm transition-all"
                  >
                    <IconComp className="w-9 h-9 text-[#1B2741] mb-2.5" />
                    <p className="text-[12px] font-semibold text-gray-800 leading-tight">{c.name}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* How It Works — 4-Step Flipkart Seller Journey */}
      <section id="how-it-works" className="bg-[#F5F7FA] border-b border-gray-200 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-[#1B2741]">How selling on Collabo works</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1.5">4 simple steps from registration to your first payout</p>
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
      </section>

      {/* Access Our Tools to Grow Faster (Flipkart Seller Hub style) */}
      <section id="benefits" className="relative bg-gradient-to-b from-[#EFF7FF] via-[#F4F9FF] to-[#E9F3FF] border-b border-blue-100/80 overflow-hidden scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-16">
          <div className="max-w-3xl">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              <span className="text-[#027CD5]">Built-in tools to scale your store</span>{' '}
              <span className="text-[#1B2741]">on Collabo</span>
            </h2>
            <p className="text-sm sm:text-[15px] text-gray-600 leading-relaxed mt-3">
              Everything you need to run your storefront smoothly — from quick catalog upload and creator-driven discovery to doorstep shipping and timely bank payouts.
            </p>
          </div>

          {/* Signature faded watermark display text peeking behind the cards */}
          <div
            aria-hidden="true"
            className="select-none pointer-events-none mt-6 sm:mt-8 leading-none font-extrabold tracking-tight text-5xl sm:text-7xl lg:text-[84px] bg-gradient-to-b from-[#027CD5]/45 via-[#027CD5]/18 to-transparent bg-clip-text text-transparent"
          >
            Seller Tools
          </div>

          {/* 3x2 Floating White Tool Cards */}
          <div className="relative z-10 -mt-5 sm:-mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {SELLER_GROWTH_TOOLS.map((tool) => (
              <div
                key={tool.id}
                className="bg-white rounded-2xl p-6 shadow-[0_8px_28px_rgba(15,23,42,0.06)] border border-white/90 hover:shadow-[0_14px_36px_rgba(2,124,213,0.12)] hover:-translate-y-0.5 transition-all flex flex-col justify-between min-h-[210px]"
              >
                <div>
                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-[#EBF5FF] border border-blue-100 flex items-center justify-center shrink-0">
                      <tool.icon className="w-5 h-5 text-[#027CD5]" strokeWidth={1.8} />
                    </div>
                    <h3 className="text-[16px] font-bold text-gray-900 leading-snug">{tool.title}</h3>
                  </div>
                  <p className="text-[13px] text-gray-600 leading-relaxed">{tool.desc}</p>
                </div>
                <div className="pt-5">
                  <button
                    type="button"
                    onClick={() => setSelectedTool(tool)}
                    className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-gray-800 hover:text-[#027CD5] transition-colors cursor-pointer"
                  >
                    Learn More <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fees & Commission — Collabo Branded 2-Column Showcase */}
      <section id="pricing" className="bg-[#F5F7FA] border-b border-gray-200 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 border border-orange-200 px-3 py-1 rounded-full mb-3">
              Transparent Pricing
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1B2741] tracking-tight">
              Keep more of every sale on <span className="text-orange-500">Collabo</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-2">
              No hidden subscriptions, no listing charges, and 0% commission — built for growing Indian sellers.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left: Collabo Zero-Commission Spotlight Card */}
            <div className="lg:col-span-5 bg-gradient-to-br from-[#1B2741] via-[#1E2E4D] to-[#111A2E] text-white rounded-2xl p-7 sm:p-8 shadow-xl relative overflow-hidden flex flex-col justify-between">
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-orange-500/20 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-44 h-44 rounded-full bg-sky-500/15 blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-5">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-orange-300 bg-orange-500/15 border border-orange-400/30 px-3 py-1 rounded-full">
                  Collabo Seller Plan
                </span>

                <div>
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-5xl sm:text-6xl font-black tracking-tight text-white leading-none">0%</span>
                    <span className="text-lg font-bold text-orange-400">Commission</span>
                  </div>
                  <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed mt-3">
                    List your catalog for free and receive payouts straight to your bank account every 7 business days.
                  </p>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-white/10">
                  {[
                    'Unlimited product listings with ₹0 upfront fee',
                    'No monthly or annual subscription charges',
                    'Full Seller Dashboard, analytics & CSV import',
                    'Direct bank withdrawals starting at ₹100',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2.5 text-[12.5px] text-slate-200">
                      <CheckCircle className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative z-10 pt-7">
                <button
                  type="button"
                  onClick={revealRegister}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold py-3 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
                >
                  Start Selling for ₹0 <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right: Quick Metric Tiles + Detailed Fee Table */}
            <div className="lg:col-span-7 flex flex-col gap-5">
              <div className="grid grid-cols-3 gap-3.5">
                {[
                  { value: '₹0', label: 'Listing & Setup', accent: 'text-orange-600 bg-orange-50 border-orange-100' },
                  { value: '7 Days', label: 'Bank Settlement', accent: 'text-[#027CD5] bg-blue-50 border-blue-100' },
                  { value: '₹100', label: 'Min. Withdrawal', accent: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                ].map((tile) => (
                  <div key={tile.label} className="bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-5 text-center shadow-sm">
                    <span className={`inline-block text-lg sm:text-2xl font-extrabold px-2.5 py-0.5 rounded-lg border ${tile.accent}`}>
                      {tile.value}
                    </span>
                    <p className="text-[11px] sm:text-xs font-semibold text-gray-600 mt-2">{tile.label}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden flex-1 flex flex-col">
                <div className="px-6 py-4 bg-[#F8FAFC] border-b border-gray-200/80 flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-[#1B2741]">Complete Fee Breakdown</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    No Hidden Charges
                  </span>
                </div>
                <div className="divide-y divide-gray-100 flex-1">
                  {[
                    { l: 'Listing Fee', sub: 'Add products manually or via bulk CSV import', v: 'Free', h: true },
                    { l: 'Monthly Charge', sub: 'Zero recurring store or platform subscription', v: 'Free', h: true },
                    { l: 'Platform Commission', sub: '0% commission charge on your product sales', v: '0% Commission', h: true },
                    { l: 'Payment Settlement', sub: 'Credited to your verified bank after delivery', v: '7 business days', h: false },
                    { l: 'Minimum Withdrawal', sub: 'Withdraw available balance anytime', v: '₹100', h: false },
                  ].map((f) => (
                    <div key={f.l} className="px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                      <div>
                        <p className="text-[13px] font-semibold text-gray-900">{f.l}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">{f.sub}</p>
                      </div>
                      <span
                        className={`text-[12px] font-bold px-3 py-1 rounded-full shrink-0 ${
                          f.h
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                            : 'bg-slate-100 text-[#1B2741]'
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
        </div>
      </section>

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
                <div className="w-11 h-11 rounded-xl bg-white border border-blue-100 shadow-sm flex items-center justify-center shrink-0">
                  <selectedTool.icon className="w-5 h-5 text-[#027CD5]" strokeWidth={1.9} />
                </div>
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
