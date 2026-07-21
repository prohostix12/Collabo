import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, ShoppingBag, Heart, User, Star, ArrowRight, ShieldCheck,
  ChevronRight, Plus, Minus, Trash2, CheckCircle2, Package,
  MapPin, CreditCard, Sparkles, Filter, LayoutDashboard, ShoppingCart,
  Percent, Tag, Eye, Info, Clock, BarChart3, RefreshCw, X,
  Check, Copy, LogOut, Lock, LogIn, Award, TrendingUp, Users, Settings, PlusCircle,
  Edit, EyeOff, Phone, Zap, Store, Sun, Moon,
  LayoutGrid, Cpu, Smartphone, Shirt, ShoppingBasket, Home as HomeIcon,
  Armchair, Dumbbell, BookOpen, Gamepad2, Plug, Film, Download,
  Mail, Shield, Calendar, Headphones, HeartPulse, Droplets, Bath, Truck, Share2, Menu, ChevronLeft,
  Baby, Flower2, Gift
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import Footer from '../Layout/Footer';
import ChangePasswordModal from '../Layout/ChangePasswordModal';
import ChangeUsernameModal from '../Layout/ChangeUsernameModal';
import DeleteAccountModal from '../Layout/DeleteAccountModal';

const InfluencerHub = lazy(() => import('../Dashboard/InfluencerDashboard'));

const CATEGORIES = [
  { name: 'All', icon: '🌟' },
  { name: 'Electronics', icon: '💻' },
  { name: 'Mobiles', icon: '📱' },
  { name: 'Fashion', icon: '👗' },
  { name: 'Grocery', icon: '🍏' },
  { name: 'Home & Kitchen', icon: '🍳' },
  { name: 'Beauty', icon: '💄' },
  { name: 'Furniture', icon: '🪑' },
  { name: 'Sports', icon: '⚽' },
  { name: 'Books', icon: '📚' },
  { name: 'Toys', icon: '🧸' },
  { name: 'Appliances', icon: '🔌' },
  { name: 'Kids', icon: '🧒' }
];

const BRANDS = [];

const CAT_ICON_MAP = {
  'All':           { Icon: LayoutGrid,     color: 'text-slate-900 dark:text-white', bg: 'bg-slate-100 dark:bg-slate-700' },
  'Electronics':   { Icon: Cpu,            color: 'text-slate-900 dark:text-white', bg: 'bg-slate-100 dark:bg-slate-700' },
  'Mobiles':       { Icon: Smartphone,     color: 'text-slate-900 dark:text-white', bg: 'bg-slate-100 dark:bg-slate-700' },
  'Fashion':       { Icon: Shirt,          color: 'text-slate-900 dark:text-white', bg: 'bg-slate-100 dark:bg-slate-700' },
  'Grocery':       { Icon: ShoppingBasket, color: 'text-slate-900 dark:text-white', bg: 'bg-slate-100 dark:bg-slate-700' },
  'Home & Kitchen':{ Icon: HomeIcon,       color: 'text-slate-900 dark:text-white', bg: 'bg-slate-100 dark:bg-slate-700' },
  'Beauty':        { Icon: Sparkles,       color: 'text-slate-900 dark:text-white', bg: 'bg-slate-100 dark:bg-slate-700' },
  'Furniture':     { Icon: Armchair,       color: 'text-slate-900 dark:text-white', bg: 'bg-slate-100 dark:bg-slate-700' },
  'Sports':        { Icon: Dumbbell,       color: 'text-slate-900 dark:text-white', bg: 'bg-slate-100 dark:bg-slate-700' },
  'Books':         { Icon: BookOpen,       color: 'text-slate-900 dark:text-white', bg: 'bg-slate-100 dark:bg-slate-700' },
  'Toys':          { Icon: Gamepad2,       color: 'text-slate-900 dark:text-white', bg: 'bg-slate-100 dark:bg-slate-700' },
  'Appliances':    { Icon: Plug,           color: 'text-slate-900 dark:text-white', bg: 'bg-slate-100 dark:bg-slate-700' },
  'Mobile Accessories': { Icon: Headphones, color: 'text-slate-900 dark:text-white', bg: 'bg-slate-100 dark:bg-slate-700' },
  'Health & Personal Care': { Icon: HeartPulse, color: 'text-slate-900 dark:text-white', bg: 'bg-slate-100 dark:bg-slate-700' },
  'Laundry & Garment Care': { Icon: Droplets, color: 'text-slate-900 dark:text-white', bg: 'bg-slate-100 dark:bg-slate-700' },
  'Beauty & Personal Care': { Icon: Bath, color: 'text-slate-900 dark:text-white', bg: 'bg-slate-100 dark:bg-slate-700' },
  'Kids':              { Icon: Baby,           color: 'text-slate-900 dark:text-white', bg: 'bg-slate-100 dark:bg-slate-700' },
  'Korean Products':   { Icon: Flower2,        color: 'text-slate-900 dark:text-white', bg: 'bg-slate-100 dark:bg-slate-700' },
};
const getCatIcon = (name) => CAT_ICON_MAP[name] || { Icon: LayoutGrid, color: 'text-slate-900 dark:text-white', bg: 'bg-slate-100 dark:bg-slate-700' };

const PROMO_CARDS_DEFAULT = [
  { badge: 'MEGA SALE', title: 'Up to 60% Off', subtitle: 'Home & Kitchen essentials', cta: 'Shop Now', category: 'Home & Kitchen', bg: 'from-amber-500 to-orange-600' },
  { badge: 'NEW ARRIVALS', title: 'Kids Collection', subtitle: 'Toys & educational picks', cta: 'Explore', category: 'Kids', bg: 'from-violet-600 to-purple-700' },
  { badge: 'BEST SELLERS', title: 'Tech Gadgets', subtitle: 'Premium electronics', cta: 'View Deals', category: 'Electronics', bg: 'from-sky-500 to-blue-600' },
  { badge: 'TRENDING', title: 'Beauty Picks', subtitle: 'Skincare must-haves', cta: 'Shop Beauty', category: 'Beauty & Personal Care', bg: 'from-rose-500 to-pink-600' },
];

const ShopByCategoryAdCarousel = ({ setFilterCategory, setCurrentView, categoryProducts, allProductsList, setSelectedProduct, promoCards }) => {
  const [adIndex, setAdIndex] = useState(0);
  const ads = promoCards && promoCards.length > 0 ? promoCards : PROMO_CARDS_DEFAULT;

  useEffect(() => {
    const timer = setInterval(() => setAdIndex(prev => (prev + 1) % ads.length), 2000);
    return () => clearInterval(timer);
  }, [ads.length]);

  const ad = ads[adIndex];
  const catProducts = (allProductsList || []).filter(p => p.category === ad.category).slice(0, 4);
  const adImages = (categoryProducts[ad.category] || []).slice(0, 4);

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow h-full">
      {ads.map((a, i) => (
        <div key={i} className={`absolute inset-0 bg-gradient-to-b ${a.bg} transition-opacity duration-700 ${i === adIndex ? 'opacity-100' : 'opacity-0'}`} />
      ))}
      <div className="relative z-10 h-full flex flex-col justify-between p-4">
        <div>
          <span className="inline-block bg-white/25 backdrop-blur-sm text-white text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full mb-1.5">{ad.badge}</span>
          <h3 className="text-base font-black text-white leading-snug">{ad.title}</h3>
          <p className="text-[10px] text-white/75 font-medium">{ad.subtitle}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 my-3 flex-1">
          {adImages.map((img, i) => {
            const product = catProducts[i];
            return (
              <div
                key={i}
                onClick={() => { if (product) { setSelectedProduct(product); setCurrentView('details'); } else { setFilterCategory(ad.category); setCurrentView('listing'); } }}
                className="bg-white rounded-lg p-1 flex items-center justify-center shadow-xl hover:shadow-2xl transition-shadow hover:scale-105 transform duration-200 cursor-pointer border-2 border-white/80"
              >
                <img src={img} alt="" className="w-full h-[110px] object-cover rounded-md" />
              </div>
            );
          })}
        </div>
        <span
          onClick={() => { setFilterCategory(ad.category); setCurrentView('listing'); }}
          className="self-start text-[10px] font-black text-white bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm cursor-pointer hover:bg-white/30 transition-colors"
        >{ad.cta} →</span>
      </div>
    </div>
  );
};

const CollaboAdBanner = ({ handleInviteFriendsClick }) => {
  return (
    <div className="w-full relative group overflow-hidden rounded-[32px] my-12 shadow-md h-[320px] md:h-[350px]">
      {/* ── Background Gradients ── */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-600 via-orange-500 to-rose-500" />
      
      {/* ── Glowing Mesh Orbs ── */}
      <div className="absolute -top-24 -left-20 w-80 h-80 bg-yellow-400/25 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-24 right-1/4 w-96 h-96 bg-red-500/20 rounded-full blur-3xl" />
      
      {/* ── Grid Pattern Overlay ── */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="absolute inset-0 flex flex-col md:flex-row w-full h-full p-8 md:p-12 z-10">
        <div className="flex-1 flex flex-col items-start justify-center text-white px-0 md:pl-8 space-y-4">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter uppercase drop-shadow-md leading-none">
            Refer & Earn<br/>
            <span className="text-yellow-200">Forever</span>
          </h2>
          <p className="text-xs sm:text-sm md:text-base font-bold text-orange-50/90 max-w-xl leading-relaxed">
            Invite your friends to shop and earn up to <span className="text-white font-extrabold">10% commission</span> on every order they place! Plus, your friends get instant discounts on sign up.
          </p>
          <button
            onClick={handleInviteFriendsClick}
            className="bg-white text-orange-600 hover:bg-orange-50 font-black text-xs sm:text-sm px-8 py-4 rounded-2xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 uppercase tracking-widest mt-2 flex items-center gap-2">
            <Gift className="w-4 h-4 text-orange-600 animate-bounce" /> Invite Friends Now
          </button>
        </div>
        <div className="flex-1 hidden md:flex items-center justify-end pr-4 md:pr-8 relative">
          <img src="/collabo-logo.png" alt="Collabo" className="h-32 lg:h-48 object-contain drop-shadow-2xl transform group-hover:scale-110 transition-all duration-700 scale-[1.5] origin-right" />
        </div>
      </div>
    </div>
  );
};

const CollabEarnBanner = ({ handleInviteFriendsClick }) => {
  return (
    <div className="w-full relative overflow-hidden rounded-[28px] my-8" style={{minHeight:'335px',boxShadow:'0 24px 70px rgba(0,90,120,0.45)'}}>

      {/* ── BG: peacock blue gradient ── */}
      <div className="absolute inset-0" style={{background:'linear-gradient(115deg,#002136 0%,#004e6e 28%,#007a9a 55%,#00a4b4 78%,#00c8c0 100%)'}} />

      {/* glow orbs */}
      <div className="absolute" style={{top:'-100px',right:'30%',width:'420px',height:'420px',borderRadius:'50%',background:'rgba(0,200,192,0.15)',filter:'blur(80px)'}} />
      <div className="absolute" style={{bottom:'-80px',left:'-80px',width:'380px',height:'380px',borderRadius:'50%',background:'rgba(0,60,100,0.4)',filter:'blur(70px)'}} />

      {/* dot pattern */}
      <div className="absolute inset-0" style={{opacity:0.04,backgroundImage:'radial-gradient(circle,#fff 1px,transparent 1px)',backgroundSize:'24px 24px'}} />

      {/* image fade-in mask on the right */}
      <div className="absolute inset-y-0 right-0 w-2/5 hidden lg:block" style={{background:'linear-gradient(to right,transparent 0%,rgba(0,40,70,0.15) 100%)'}} />

      {/* ── MODEL IMAGE ── positioned right side, bottom-anchored */}
      <img
        src="/affiliate-girl.jpg"
        alt="Collabo Partner"
        className="absolute bottom-0 right-0 hidden lg:block object-cover select-none pointer-events-none"
        style={{height:'105%',width:'340px',objectPosition:'center top',maskImage:'linear-gradient(to left,rgba(0,0,0,0.92) 45%,transparent 100%)',WebkitMaskImage:'linear-gradient(to left,rgba(0,0,0,0.92) 45%,transparent 100%)'}}
      />

      {/* ── MAIN CONTENT ── */}
      <div className="relative z-10 flex flex-col lg:flex-row items-stretch" style={{minHeight:'335px'}}>

        {/* LEFT: ad copy */}
        <div className="flex-1 flex flex-col justify-center pl-8 pr-8 pt-7 pb-7 gap-3.5 lg:max-w-[62%]">

          {/* Logo + urgency badge */}
          <div className="flex items-center gap-3 flex-wrap">
            <img src="/collabo-logo.png" alt="Collabo" className="h-9 object-contain drop-shadow" style={{filter:'brightness(0) invert(1)'}} />
            <div className="w-px h-4" style={{background:'rgba(255,255,255,0.25)'}} />
            <span className="text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full animate-pulse"
              style={{background:'linear-gradient(90deg,#ff6b35,#f7931e)',color:'#fff',boxShadow:'0 2px 12px rgba(255,107,53,0.5)'}}>
              🔥 Now Open — Apply Today
            </span>
          </div>

          {/* Headline */}
          <div className="space-y-3">
            <style>{`
              @keyframes shareMoreMove {
                0%, 100% { transform: translateX(0); }
                50% { transform: translateX(12px); }
              }
              .share-more-animate {
                display: inline-block;
                animation: shareMoreMove 3s ease-in-out infinite;
              }
            `}</style>
            <p className="text-[18px] font-semibold italic leading-relaxed whitespace-nowrap" style={{color:'rgba(0,235,220,0.95)'}}>
              "Why should buying only cost money? What if it could also earn you money?"
            </p>
            <h2 className="font-black leading-[0.95] tracking-tighter unstoppable-text" style={{fontSize:'clamp(2.5rem,4.8vw,3.9rem)',color:'rgba(255,255,255,0.72)'}}>
              Shop Smart<br/>
              <span className="share-more-animate" style={{WebkitTextStroke:'1.5px rgba(255,255,255,0.35)',color:'transparent'}}>Share More</span><br/>
              Earn Forever
            </h2>
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {['bg-pink-400','bg-yellow-400','bg-blue-400','bg-green-400'].map((c,i) => (
                <div key={i} className={`w-8 h-8 rounded-full border-2 border-white/30 ${c} flex items-center justify-center text-[11px] font-black text-white`}>{['R','S','A','P'][i]}</div>
              ))}
            </div>
            <p className="text-[14px] font-semibold" style={{color:'rgba(255,255,255,0.75)'}}>
              <span className="text-white font-black">2,400+ creators</span> already earning with Collabo
            </p>
          </div>

          {/* CTA */}
          <div className="flex items-center">
            <button
              onClick={handleInviteFriendsClick}
              className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 hover:scale-[1.05] active:scale-[0.98] hover:shadow-2xl hover:shadow-orange-500/20 flex items-center gap-2 text-white"
              style={{
                background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
                boxShadow: '0 8px 30px rgba(247, 147, 30, 0.45)'
              }}
            >
              <Gift className="w-4 h-4 text-white animate-bounce" /> Invite Friends
            </button>
          </div>

        </div>

        {/* RIGHT: floating glassmorphic stats — absolutely positioned to the left of the girl image */}
        <div className="hidden lg:flex flex-col justify-center gap-2.5" style={{position:'absolute',right:'310px',top:'60%',transform:'translateY(-50%)',width:'180px',zIndex:20}}>
          <div className="rounded-2xl p-4 space-y-3"
            style={{background:'rgba(255,255,255,0.1)',backdropFilter:'blur(28px)',WebkitBackdropFilter:'blur(28px)',border:'1px solid rgba(255,255,255,0.22)',boxShadow:'0 12px 40px rgba(0,0,0,0.25),inset 0 1px 0 rgba(255,255,255,0.2)'}}>
            {[['₹50K+','Paid Last Month'],['10%','Max Commission'],['24hrs','Approval Time']].map(([val,lbl]) => (
              <div key={lbl} className="text-center py-2.5 rounded-xl" style={{background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.1)'}}>
                <div className="text-base font-black text-white">{val}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider mt-0.5" style={{color:'rgba(255,255,255,0.55)'}}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

const KoreKartSection = ({ allProducts, setSelectedProduct, setCurrentView, setFilterCategory }) => {
  const [adIndex, setAdIndex] = useState(0);
  const koreanProducts = allProducts.filter(p => p.category === 'Korean Products');

  useEffect(() => {
    if (koreanProducts.length <= 4) return;
    const timer = setInterval(() => {
      setAdIndex(prev => (prev + 1) % Math.ceil(koreanProducts.length / 4));
    }, 4000); // Rotate groups of 4 products every 4 seconds
    return () => clearInterval(timer);
  }, [koreanProducts.length]);

  if (koreanProducts.length === 0) return null;

  // Get current group of 4 products for the left side preview
  const groupStart = adIndex * 4;
  const adProducts = koreanProducts.slice(groupStart, groupStart + 4);
  const favorites = koreanProducts.slice(0, 8); // Top 8 favorites on the right grid

  return (
    <div className="flex flex-col lg:flex-row gap-4 mt-12">
      
      {/* Left: Accent changing card (w-[400px]) */}
      <div className="w-full lg:w-[400px] flex-shrink-0">
        <div className="relative rounded-[32px] overflow-hidden shadow-md hover:shadow-lg transition-shadow h-full p-6 flex flex-col justify-between bg-gradient-to-br from-violet-500 via-purple-400 to-pink-400">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-purple-300/30 rounded-full blur-2xl animate-pulse" />
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-pink-300/30 rounded-full blur-2xl animate-pulse" />
          
          <div className="relative z-10">
            <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full mb-3 animate-bounce">🌸 KoreKart Special</span>
            <h3 className="text-xl sm:text-2xl font-black text-white leading-tight mb-1">Trending K-Beauty & Finds</h3>
            <p className="text-[11px] text-white/80 font-medium">Handpicked pastel treats, kawaii aesthetics & viral skincare! ✨</p>
          </div>

          <div className="grid grid-cols-2 gap-3 my-4 flex-1 relative z-10">
            {adProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => { setSelectedProduct(product); setCurrentView('details'); }}
                className="bg-white rounded-2xl p-2 flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-105 transform duration-350 cursor-pointer border border-white/60 aspect-square animate-in fade-in slide-in-from-bottom-2"
              >
                <img src={product.image} alt={product.name} className="max-h-full max-w-full object-contain rounded-lg p-1" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Products Grid (flex-1) */}
      <div className="flex-1 min-w-0 space-y-5 lg:pl-4">
        <div>
          <span className="text-[10px] font-black tracking-widest text-purple-600 uppercase">Browse Collections</span>
          <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">Korean Favorites</h2>
        </div>
        
        <div style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="overflow-x-auto scrollbar-hide pb-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {favorites.map((product) => (
              <button
                key={product.id}
                onClick={() => { setSelectedProduct(product); setCurrentView('details'); }}
                className="flex flex-col items-center group cursor-pointer"
              >
                <div className="w-[120px] h-[120px] sm:w-[135px] sm:h-[135px] rounded-2xl overflow-hidden bg-white dark:bg-slate-800 shadow-sm group-hover:shadow-lg transition-all group-hover:-translate-y-1 border border-slate-200 dark:border-slate-700 p-2.5 flex items-center justify-center">
                  <img src={product.image} alt={product.name} className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-300" />
                </div>
                <span className="mt-2 text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-purple-600 transition-colors text-center leading-tight line-clamp-1 w-28">{product.name}</span>
                <span className="text-xs font-black text-purple-600 mt-0.5">₹{product.discount_price || product.price}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default function EcommerceMarketplace({ inlineMode = false, onBackToSelect = null }) {
  const navigate = useNavigate();

  // Capture referral URL params immediately at render time (before any history effects strip the query string)
  const [initialRefCode] = useState(() => new URLSearchParams(window.location.search).get('ref') || '');
  const [initialPidParam] = useState(() => new URLSearchParams(window.location.search).get('pid') || '');
  // Signup/recruitment affiliate code from an "Invite Friends" link (?affiliate=CODE).
  // Persisted to localStorage so it survives browsing around before the visitor actually
  // registers (mirrors how referral_map persists for product referral links).
  const [signupAffiliateCode] = useState(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('affiliate');
    if (fromUrl) {
      localStorage.setItem('signup_affiliate_code', fromUrl);
      return fromUrl;
    }
    return localStorage.getItem('signup_affiliate_code') || '';
  });

  // Navigation State
  const [currentView, setCurrentView] = useState(inlineMode ? 'dashboard' : 'home'); // home | listing | details | cart | checkout | success | wishlist | profile | tracking | dashboard | auth
  const [showHub, setShowHub] = useState(() => window.location.hash === '#hub');
  
  // App Core State
  const { user, login, logout, register } = useAuth();
  const isLoggedIn = !!user;

  const [cart, setCart] = useState([]);
  const [isCategorySticky, setIsCategorySticky] = useState(false);
  // Shrinks the mobile Categories-page top strip once it's pinned under scroll,
  // Flipkart-app style — icons/text get smaller, not just stuck in place.
  const [isCatPageStripCompact, setIsCatPageStripCompact] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setIsCategorySticky(prev => prev ? y > 150 : y > 300);
      setIsCatPageStripCompact(prev => prev ? y > 20 : y > 60);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const tickerExtraMessages = [
    'Login and earn upto 10% made by your friend.',
    'Refer, Re-Refer & Earn — Manage all in one place.',
    'Referral and redeem — earn more, spend smart.',
  ];
  // Per-product "Refer & Earn" link generation (any logged-in user, any product)
  const [referModalData, setReferModalData] = useState(null);
  const [referLoading, setReferLoading] = useState(false);
  const handleReferProduct = async (product) => {
    if (!isLoggedIn) { setCurrentView('auth'); return; }
    setReferLoading(true);
    try {
      // If this user themselves arrived at this product via someone else's referral link,
      // pass that code along so the backend can record them as this new link's upline.
      const refMap = JSON.parse(localStorage.getItem('referral_map') || '{}');
      const incomingCode = refMap[String(product.id)] || localStorage.getItem('referral_code') || '';
      const res = await api.post('/ecommerce/referral-links/generate/', { product: product.id, referral_code: incomingCode });
      setReferModalData(res.data);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to generate referral link');
    } finally {
      setReferLoading(false);
    }
  };
  const [showInviteModal, setShowInviteModal] = useState(false);
  const handleInviteFriendsClick = () => {
    if (!isLoggedIn) { setCurrentView('auth'); return; }
    setShowInviteModal(true);
  };
  const [walletData, setWalletData] = useState(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletPayouts, setWalletPayouts] = useState([]);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [withdrawAccountName, setWithdrawAccountName] = useState('');
  const [withdrawAccountNumber, setWithdrawAccountNumber] = useState('');
  const [withdrawIfsc, setWithdrawIfsc] = useState('');
  const [editBankDetails, setEditBankDetails] = useState(false);
  const fetchWalletData = () => {
    if (!isLoggedIn) return;
    api.get('/ecommerce/wallet/').then(res => setWalletData(res.data)).catch(() => {});
    api.get('/ecommerce/wallet/payouts/').then(res => setWalletPayouts(res.data.results || res.data || [])).catch(() => {});
  };
  useEffect(() => {
    if ((currentView === 'profile' || currentView === 'checkout') && isLoggedIn) {
      fetchWalletData();
    }
  }, [currentView, isLoggedIn]);
  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      showToast('Enter a valid amount');
      return;
    }
    const hasSavedBank = !!walletData?.bank_details;
    const needsBankFields = !hasSavedBank || editBankDetails;
    if (needsBankFields && (!withdrawAccountName.trim() || !withdrawAccountNumber.trim() || !withdrawIfsc.trim())) {
      showToast('Bank account holder name, account number, and IFSC code are required');
      return;
    }
    setWithdrawing(true);
    try {
      await api.post('/ecommerce/wallet/withdraw/', {
        amount,
        account_holder_name: needsBankFields ? withdrawAccountName.trim() : '',
        account_number: needsBankFields ? withdrawAccountNumber.trim() : '',
        ifsc_code: needsBankFields ? withdrawIfsc.trim() : '',
      });
      showToast('Withdrawal requested! Admin will process it shortly.');
      setWithdrawAmount('');
      setWithdrawAccountName('');
      setWithdrawAccountNumber('');
      setWithdrawIfsc('');
      setEditBankDetails(false);
      setShowWithdrawForm(false);
      fetchWalletData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to request withdrawal');
    } finally {
      setWithdrawing(false);
    }
  };
  const [tickerMsgIndex, setTickerMsgIndex] = useState(0);
  useEffect(() => {
    const total = 1 + tickerExtraMessages.length; // admin coupon slot + the extra messages
    const id = setInterval(() => {
      setTickerMsgIndex(prev => (prev + 1) % total);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      const flag = localStorage.getItem('collabo_new_user') === '1';
      setIsNewUser(flag);
      if (flag) localStorage.removeItem('collabo_new_user');
    } else {
      setIsNewUser(false);
    }
  }, [isLoggedIn]);

  const [dealTimeLeft, setDealTimeLeft] = useState(4 * 3600 + 18 * 60 + 52);

  useEffect(() => {
    const timer = setInterval(() => {
      setDealTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return {
      h: h.toString().padStart(2, '0'),
      m: m.toString().padStart(2, '0'),
      s: s.toString().padStart(2, '0')
    };
  };
  const [wishlist, setWishlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem('collabo_wishlist') || '[]'); } catch { return []; }
  });
  useEffect(() => {
    localStorage.setItem('collabo_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);
  useEffect(() => {
    if (user) {
      api.get('/ecommerce/wishlist/ids/').then(res => {
        if (Array.isArray(res.data) && res.data.length > 0) setWishlist(res.data);
      }).catch(() => {});
    }
  }, [user]);
  const [productsList, setProductsList] = useState([]);
  const [sellerProducts, setSellerProducts] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressFormData, setAddressFormData] = useState({
    name: '', phone: '', street_address: '', city: '', district: '', state: '', postal_code: '', is_default: false
  });
  const [customerOrders, setCustomerOrders] = useState([]);
  const [sellerOrders, setSellerOrders] = useState([]);
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [createdOrderId, setCreatedOrderId] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [activeProfileModal, setActiveProfileModal] = useState(null); // 'username' | 'password' | 'delete' | null
  const [cancelModal, setCancelModal] = useState(null); // order object or null
  const [cancelReason, setCancelReason] = useState('');
  const [cancelComment, setCancelComment] = useState('');
  const [cancelFiles, setCancelFiles] = useState([]);
  const [cancellingOrder, setCancellingOrder] = useState(false);
  const CANCEL_REASONS = [
    'Changed my mind',
    'Ordered by mistake / Duplicate order',
    'Found a better price elsewhere',
    'Delivery is taking too long',
    'Wrong item selected',
    'Wrong delivery address entered',
    'Item no longer needed',
    'Payment issue / Want to repay',
    'Other',
  ];
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  // Initialize directly from localStorage so the save effect never fires with []
  const [selectedCartItems, setSelectedCartItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cart_selected_items') || '[]'); } catch { return []; }
  });

  // Save selections to localStorage on every change
  useEffect(() => {
    localStorage.setItem('cart_selected_items', JSON.stringify(selectedCartItems));
  }, [selectedCartItems]);

  const cartInitializedRef = useRef(false);
  const cartFetchedOnceRef = useRef(false);
  useEffect(() => {
    const cartIds = cart.map(i => i.id);
    if (!cartInitializedRef.current) {
      // Wait for the real initial fetchCart() API call to resolve — not just for
      // cartIds to be non-empty, since an empty cart is a valid initial state too
      // (e.g. a first-time "Buy Now" adds the very first item right after this
      // resolves, and that item must be treated as newly-added, not as part of
      // session restore).
      if (!cartFetchedOnceRef.current) return;
      cartInitializedRef.current = true;
      // Filter restored selection to only IDs still in cart (removes stale IDs from old sessions)
      setSelectedCartItems(prev => prev.filter(id => cartIds.includes(id)));
      return;
    }
    // After init: keep existing selections, remove deleted items, auto-select newly added items
    setSelectedCartItems(prev => {
      const valid = prev.filter(id => cartIds.includes(id));
      const newlyAdded = cartIds.filter(id => !prev.includes(id));
      return [...valid, ...newlyAdded];
    });
  }, [cart]);
  const [pincodeInput, setPincodeInput] = useState('');
  const [pincodeResult, setPincodeResult] = useState(null);

  const handleCheckPincode = () => {
    if (pincodeInput.length !== 6 || isNaN(Number(pincodeInput))) {
      setPincodeResult('invalid');
      return;
    }
    setPincodeResult('checking');
    setTimeout(() => {
      // Mock logic: 80% chance of delivery available
      if (Math.random() > 0.2) {
        setPincodeResult('success');
      } else {
        setPincodeResult('error');
      }
    }, 1000);
  };

  const [recentlyViewed, setRecentlyViewed] = useState(() => {
    try {
      const saved = localStorage.getItem('recently_viewed');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // Track recently viewed products & persist product ID in hash
  useEffect(() => {
    if (selectedProduct) {
      setRecentlyViewed(prev => {
        const filtered = prev.filter(p => p.id !== selectedProduct.id);
        const updated = [selectedProduct, ...filtered].slice(0, 10);
        localStorage.setItem('recently_viewed', JSON.stringify(updated));
        return updated;
      });
      if (currentView === 'details' && !inlineMode && window.location.hash.startsWith('#details')) {
        window.history.replaceState({ view: 'details', pid: selectedProduct.id }, '', `#details:${selectedProduct.id}`);
      }
    }
  }, [selectedProduct, currentView, inlineMode]);

  const [pendingSelectProductId, setPendingSelectProductId] = useState(null);
  const [activeReferral, setActiveReferral] = useState(null); // { product_id, referral_code, discount_percent, custom_price }

  const autoApplyCouponCode = (code) => {
    if (!isLoggedIn) {
      toast.error('Please login to apply coupon');
      setPostAuthView('home');
      setCurrentView('auth');
      return;
    }
    setCouponCode(code);
    const coupons = storeSettings.coupon_codes || [];
    const found = coupons.find(c => c.code?.toUpperCase() === code.toUpperCase());
    if (found) {
      setCouponApplied(true);
      setCouponDiscount((found.discount_percent || 0) / 100);
    }
    navigator.clipboard.writeText(code).catch(() => {});
    toast.success(`Coupon ${code} applied!`);
  };
  const openStorefront = (seller) => { setCurrentView('home'); };

  const openMediaUpload = async (product) => {
    setMediaUploadProduct(product);
    setMediaUploadFiles([]);
    setMediaUploadType('image');
    setMediaUploadTitle('');
    try {
      const res = await api.get(`/ecommerce/products/${product.id}/influencer-media/`);
      setProductMediaList(res.data || []);
    } catch { setProductMediaList([]); }
  };

  const handleMediaUpload = async () => {
    if (!mediaUploadFiles.length || !mediaUploadProduct) return;
    setMediaUploading(true);
    try {
      for (const file of mediaUploadFiles) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('media_type', file.type.startsWith('video') ? 'video' : 'image');
        fd.append('title', mediaUploadTitle || file.name);
        await api.post(`/ecommerce/products/${mediaUploadProduct.id}/influencer-media/upload/`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      showToast('Media uploaded successfully!', 'success');
      const res = await api.get(`/ecommerce/products/${mediaUploadProduct.id}/influencer-media/`);
      setProductMediaList(res.data || []);
      setMediaUploadFiles([]);
      setMediaUploadTitle('');
    } catch (err) {
      showToast(err.response?.data?.error || 'Upload failed', 'error');
    } finally { setMediaUploading(false); }
  };

  const deleteMedia = async (mediaId) => {
    try {
      await api.delete(`/ecommerce/influencer-media/${mediaId}/delete/`);
      setProductMediaList(prev => prev.filter(m => m.id !== mediaId));
      showToast('Media deleted');
    } catch { showToast('Failed to delete', 'error'); }
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const [darkMode, setDarkMode] = useState(false);

  // Filters State
  const [trendingPhoneBrand, setTrendingPhoneBrand] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterBrand, setFilterBrand] = useState('All');
  const [filterMinPrice, setFilterMinPrice] = useState(0);
  const [filterPrice, setFilterPrice] = useState(100000);
  const [filterRating, setFilterRating] = useState(0);
  const [filterDiscount, setFilterDiscount] = useState(0);
  const [filterInStock, setFilterInStock] = useState(false);
  const [filterFreeDelivery, setFilterFreeDelivery] = useState(false);
  const [sortBy, setSortBy] = useState('trending');
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // Checkout & Interactive Timeline States
  const [selectedAddress, setSelectedAddress] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState('upi');
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [redeemPoints, setRedeemPoints] = useState(false);
  const [redeemWallet, setRedeemWallet] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [supportTickets, setSupportTickets] = useState([]);
  const [supportSubject, setSupportSubject] = useState('');
  const [supportCategory, setSupportCategory] = useState('technical');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportPriority, setSupportPriority] = useState('medium');
  const [supportSubmitting, setSupportSubmitting] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);
  const [catalogSearch, setCatalogSearch] = useState('');

  const fetchSupportTickets = async () => {
    if (!user) return;
    try {
      const res = await api.get('/support/tickets/');
      setSupportTickets(Array.isArray(res.data) ? res.data : (res.data.results || []));
    } catch (err) { console.error('Error fetching tickets:', err); }
  };

  const submitSupportTicket = async () => {
    if (!supportSubject.trim() || !supportMessage.trim()) { toast.error('Subject and message are required'); return; }
    setSupportSubmitting(true);
    try {
      await api.post('/support/tickets/', { subject: supportSubject, category: supportCategory, message: supportMessage, priority: supportPriority });
      toast.success('Support ticket submitted!');
      setSupportSubject(''); setSupportMessage(''); setSupportCategory('technical'); setSupportPriority('medium');
      fetchSupportTickets();
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.subject?.[0] || data?.message?.[0] || data?.detail || data?.error || 'Failed to submit ticket';
      toast.error(msg);
    }
    finally { setSupportSubmitting(false); }
  };

  // Image gallery details view state
  const [activeDetailImage, setActiveDetailImage] = useState('');
  const [lightboxImage, setLightboxImage] = useState(null);

  // Auth state
  const [authMode, setAuthMode] = useState('login'); // login | signup | otp
  const [postAuthView, setPostAuthView] = useState('home'); // view to return to after successful auth
  const [authEmail, setAuthEmail] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [authPhone, setAuthPhone] = useState('');

  // Dashboard state — restore the last-viewed admin tab so a page reload doesn't
  // dump the admin back on the overview tab.
  const [adminView, setAdminView] = useState(() => {
    try { return localStorage.getItem('admin_view_tab') || 'overview'; } catch { return 'overview'; }
  }); // overview | products | orders | categories | brands | store-settings | affiliates | tickets | broadcast
  useEffect(() => {
    try { localStorage.setItem('admin_view_tab', adminView); } catch { /* ignore */ }
  }, [adminView]);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState('all'); // 'all' | 'buyers' | 'sellers'
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailResult, setEmailResult] = useState(null);
  const [subscriberCount, setSubscriberCount] = useState(null);
  const [subscriberList, setSubscriberList] = useState([]);
  const [subscriberListLoading, setSubscriberListLoading] = useState(false);
  const [adminWallets, setAdminWallets] = useState(null);
  const [expandedWalletLinkId, setExpandedWalletLinkId] = useState(null);
  const [adminWalletPayouts, setAdminWalletPayouts] = useState([]);
  const [processingPayoutId, setProcessingPayoutId] = useState(null);

  // --- History API for Back Button Support ---
  const prevViewRef = useRef(currentView);

  useEffect(() => {
    if (inlineMode) return;

    if (prevViewRef.current !== currentView) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      const hashVal = currentView === 'details' && selectedProduct ? `details:${selectedProduct.id}` : currentView;
      if (window.history.state?.view !== currentView) {
        const newUrl = currentView === 'home' ? window.location.pathname : `#${hashVal}`;
        window.history.pushState({ view: currentView, pid: selectedProduct?.id || null }, '', newUrl);
      }
      prevViewRef.current = currentView;
    }
  }, [currentView, inlineMode, selectedProduct]);

  useEffect(() => {
    if (inlineMode) return;

    const rawHash = window.location.hash.replace('#', '');
    // #hub opens the influencer hub overlay — handle before anything else
    if (rawHash === 'hub') {
      setShowHub(true);
      window.history.replaceState({ view: 'hub' }, '', '#hub');
    }
    const [hashView, hashPid] = rawHash.includes(':') ? rawHash.split(':') : [rawHash, null];
    const validViews = ['home', 'listing', 'details', 'cart', 'checkout', 'success', 'wishlist', 'profile', 'tracking', 'orders', 'dashboard', 'auth', 'support'];

    if (rawHash !== 'hub' && hashView && hashView !== 'home' && validViews.includes(hashView)) {
      setCurrentView(hashView);
      if (hashView === 'details' && hashPid) {
        setPendingSelectProductId(hashPid);
      }
      // Always insert a clean home entry first so browser back → marketplace home, not out of the SPA
      window.history.replaceState({ view: 'home' }, '', window.location.pathname + window.location.search);
      window.history.pushState({ view: hashView, pid: hashPid || null }, '', `#${rawHash}`);
    } else if (window.history.state?.view && window.history.state.view !== 'home') {
      setCurrentView(window.history.state.view);
      if (window.history.state.view === 'details' && window.history.state.pid) {
        setPendingSelectProductId(window.history.state.pid);
      }
    } else {
      // Preserve query string so referral params (?ref=&pid=) are still readable by the referral effect
      window.history.replaceState({ view: 'home' }, '', window.location.pathname + window.location.search);
    }

    const handlePopState = (event) => {
      const currentHash = window.location.hash.replace('#', '');
      // Handle hub overlay open/close via back/forward
      if (currentHash === 'hub') {
        setShowHub(true);
        return;
      }
      setShowHub(false);

      if (event.state && event.state.view) {
        setCurrentView(event.state.view);
        if (event.state.view === 'details' && event.state.pid) {
          setPendingSelectProductId(event.state.pid);
        }
      } else {
        const fb = currentHash;
        const [fbView, fbPid] = fb.includes(':') ? fb.split(':') : [fb, null];
        if (fbView && validViews.includes(fbView)) {
          setCurrentView(fbView);
          if (fbView === 'details' && fbPid) setPendingSelectProductId(fbPid);
        } else {
          setCurrentView('home');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [inlineMode]);
  // -------------------------------------------

  // Store Settings state (all admin-editable storefront content)
  const [storeSettings, setStoreSettings] = useState({
    ticker_text: 'Limited Offer: Get 20% off all tech products using coupon code COLLABO20',
    ticker_coupon_highlight: 'COLLABO20',
    hero_badge_text: 'Curated Digital Marketplace',
    hero_headline: 'Architectural Utility & Style',
    hero_subheadline: 'Premium goods and tech gear handpicked by leading designers. Balanced aesthetics for your workspace, fashion, and lifestyle.',
    hero_cta_primary: 'Browse Catalog',
    hero_cta_secondary: 'Product Spotlight',
    category_images: {},
    deals_product_ids: [],
    trending_product_ids: [],
    trending_phones_title: 'Trending Phones',
    trending_phones_subtitle: 'MOBILES',
    trending_phones_product_ids: [],
    coupon_codes: [
      { code: 'COLLABO20', discount_percent: 20, description: '20% off on all tech products' },
      { code: 'FIRSTBUY', discount_percent: 10, description: '10% off for first-time buyers' },
    ],
    product_ads: [
      { id: 1, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff', name: 'Nike Running Shoes', discountPrice: 2590, price: 6999, discountText: '63% OFF', linkId: '1' }
    ],
    testimonials: [
      { name: 'Kunal Verma', title: 'Verified Buyer', rating: 5, text: 'Absolutely flawless delivery! The Aero X1 Pro smartphone is an absolute beast. Battery lasts two full days of heavy usage.' },
      { name: 'Megha Sen', title: 'Verified Buyer', rating: 5, text: 'The organic matcha powder ceremony grade is incredibly rich. Exactly like the high-grade matcha I drank in Kyoto.' },
      { name: 'Advait Rao', title: 'Verified Buyer', rating: 4, text: 'Elysian office chair provides amazing back support. Setup was easy. Soft mesh is extremely breathable during summer.' },
      { name: 'Priya Sharma', title: 'Verified Buyer', rating: 5, text: 'Ordered the NovaPro ANC Wireless and the noise cancellation is absolutely incredible. Best headphones I have ever owned!' },
      { name: 'Rohan Mehta', title: 'Verified Buyer', rating: 5, text: 'The StealthPro keyboard is a game changer. Tactile feedback is perfect and the RGB lighting looks stunning on my desk setup.' },
    ],
    footer_tagline: 'Designed for visual excellence and premium utility. Inspired by modern SaaS platforms.',
    copyright_text: '© 2026 Collabo Marketplace Inc. All rights reserved.',
    hero_card_carousel_enabled: false,
    hero_card_slides: [],
    hero_sidecars: [],
    trusted_partners: [],
    trusted_partners_title: 'Allied Global Brands',
    promo_cards: [],
    shipping_charge: 99,
    free_shipping_threshold: 1500,
  });
  // Store settings edit state
  const [editSettings, setEditSettings] = useState(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [heroCardSlide, setHeroCardSlide] = useState(0);
  const carouselRef = React.useRef(null);
  useEffect(() => {
    if (currentView !== 'home') return;
    const interval = setInterval(() => {
      if (carouselRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          carouselRef.current.scrollBy({ left: clientWidth, behavior: 'smooth' });
        }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [currentView, storeSettings.coupon_codes]);
  // Testimonials carousel active slide
  const [testimonialSlide, setTestimonialSlide] = useState(0);
  // Product Ads carousel active slide
  const [activeAdIndex, setActiveAdIndex] = useState(0);
  useEffect(() => {
    if (currentView === 'details' && storeSettings.product_ads && storeSettings.product_ads.length > 0) {
      const interval = setInterval(() => {
        setActiveAdIndex((prev) => (prev + 1) % storeSettings.product_ads.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [currentView, storeSettings.product_ads]);
  
  const [activeSidecarIndex, setActiveSidecarIndex] = useState(0);
  useEffect(() => {
    if (currentView === 'home') {
      const interval = setInterval(() => {
        setActiveSidecarIndex(prev => prev + 1);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [currentView]);

  // Categories and Brands dynamic list states
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [categoriesList, setCategoriesList] = useState([]);
  const [brandsList, setBrandsList] = useState([]);
  const [dynamicCategories, setDynamicCategories] = useState([{ name: 'All', icon: '🌟' }]);
  const [dynamicBrands, setDynamicBrands] = useState(BRANDS);

  // New Category & Brand creation states
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('📦');
  const [newBrandName, setNewBrandName] = useState('');

  // Add Product states
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Electronics');
  const [newProdBrand, setNewProdBrand] = useState('');
  const [newProdDiscountPrice, setNewProdDiscountPrice] = useState('');
  const [newProdRating, setNewProdRating] = useState('4.5');
  const [newProdReviewsCount, setNewProdReviewsCount] = useState('10');
  const [newProdImage, setNewProdImage] = useState('');
  const [newProdDescription, setNewProdDescription] = useState('');
  const [newProdStock, setNewProdStock] = useState('10');
  const [newProdShippingCharge, setNewProdShippingCharge] = useState('49');
  const [newProdDelivery, setNewProdDelivery] = useState('Free delivery by Tomorrow');
  const [newProdCommissionRate, setNewProdCommissionRate] = useState('10');
  const [newProdLinkDiscount, setNewProdLinkDiscount] = useState('0');

  // Influencer Media Upload states
  const [mediaUploadProduct, setMediaUploadProduct] = useState(null);
  const [mediaUploadFiles, setMediaUploadFiles] = useState([]);
  const [mediaUploadType, setMediaUploadType] = useState('image');
  const [mediaUploadTitle, setMediaUploadTitle] = useState('');
  const [mediaUploading, setMediaUploading] = useState(false);
  const [productMediaList, setProductMediaList] = useState([]);

  // Edit Product states
  const [editingProduct, setEditingProduct] = useState(null);
  const [editProdName, setEditProdName] = useState('');
  const [editProdPrice, setEditProdPrice] = useState('');
  const [editProdCategory, setEditProdCategory] = useState('Electronics');
  const [editProdBrand, setEditProdBrand] = useState('');
  const [editProdDiscountPrice, setEditProdDiscountPrice] = useState('');
  const [editProdRating, setEditProdRating] = useState('4.5');
  const [editProdReviewsCount, setEditProdReviewsCount] = useState('10');
  const [editProdImage, setEditProdImage] = useState('');
  const [newProdImages, setNewProdImages] = useState([]);
  const [editProdImages, setEditProdImages] = useState([]);
  const [editProdDescription, setEditProdDescription] = useState('');
  const [editProdStock, setEditProdStock] = useState('10');
  const [editProdShippingCharge, setEditProdShippingCharge] = useState('49');
  const [editProdDelivery, setEditProdDelivery] = useState('Free delivery by Tomorrow');
  const [editProdCommissionRate, setEditProdCommissionRate] = useState('10');
  const [editProdLinkDiscount, setEditProdLinkDiscount] = useState('0');

  // Extended features for Flipkart-style Product Details
  const [newProdSellerInfo, setNewProdSellerInfo] = useState('');
  const [editProdSellerInfo, setEditProdSellerInfo] = useState('');
  const [newProdHighlights, setNewProdHighlights] = useState('');
  const [editProdHighlights, setEditProdHighlights] = useState('');
  const [newProdOffers, setNewProdOffers] = useState('');
  const [editProdOffers, setEditProdOffers] = useState('');
  const [newProdSpecifications, setNewProdSpecifications] = useState('');
  const [editProdSpecifications, setEditProdSpecifications] = useState('');
  const [newProdQaSection, setNewProdQaSection] = useState('');
  const [editProdQaSection, setEditProdQaSection] = useState('');

  // Product reviews in details view
  const [productReviews, setProductReviews] = useState([]);
  const [customerReviews, setCustomerReviews] = useState([]);
  const [newCustomerReviewRating, setNewCustomerReviewRating] = useState(5);
  const [newCustomerReviewComment, setNewCustomerReviewComment] = useState('');
  const [newCustomerReviewImage, setNewCustomerReviewImage] = useState('');
  const [reviewImagePreview, setReviewImagePreview] = useState('');

  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const showToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Fetch Store Settings
  const fetchStoreSettings = async () => {
    try {
      const res = await api.get('/ecommerce/store-settings/');
      setStoreSettings(res.data);
      setEditSettings(res.data);
    } catch (err) {
      console.error('Error fetching store settings:', err);
    }
  };

  // Fetch Categories and Brands from backend
  const fetchCategoriesAndBrands = async () => {
    try {
      const catResponse = await api.get('/ecommerce/categories/');
      const catData = Array.isArray(catResponse.data) ? catResponse.data : (catResponse.data.results || []);
      setCategoriesList(catData);
      setDynamicCategories([{ name: 'All', icon: '🌟' }, ...catData]);
      setCategoriesLoaded(true);
      
      const brandResponse = await api.get('/ecommerce/brands/?page_size=1000');
      const brandData = Array.isArray(brandResponse.data) ? brandResponse.data : (brandResponse.data.results || []);
      setBrandsList(brandData);
      setDynamicBrands(brandData.map(b => b.name));
    } catch (err) {
      console.error("Error fetching categories and brands:", err);
    }
  };

  // Load details image helper
  useEffect(() => {
    if (selectedProduct) {
      setActiveDetailImage(selectedProduct.image);
      // Clear referral state if the newly selected product doesn't match the active referral
      if (activeReferral && String(activeReferral.product_id) !== String(selectedProduct.id)) {
        setActiveReferral(null);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProduct]);

  // Sync / fetch products
  const [allProducts, setAllProducts] = useState([]);

  const fetchProducts = async () => {
    try {
      const params = { page_size: 1000 };
      if (searchQuery) params.search = searchQuery;

      const response = await api.get('/ecommerce/products/', { params });
      const results = response.data.results || response.data;

      const formatted = results.map(p => ({
        ...p,
        discountPrice: Number(p.discount_price),
        discountPercent: p.discount_percent,
        reviewsCount: p.reviews_count,
        price: Number(p.price)
      }));
      setAllProducts(formatted);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  useEffect(() => {
    let filtered = allProducts;
    if (filterCategory && filterCategory !== 'All') {
      filtered = filtered.filter(p => p.category === filterCategory);
    }
    if (filterBrand && filterBrand !== 'All') {
      filtered = filtered.filter(p => p.brand === filterBrand);
    }
    if (filterMinPrice > 0) {
      filtered = filtered.filter(p => p.discountPrice >= filterMinPrice);
    }
    if (filterPrice) {
      filtered = filtered.filter(p => p.discountPrice <= filterPrice);
    }
    if (filterRating) {
      filtered = filtered.filter(p => p.rating >= filterRating);
    }
    if (filterInStock) {
      filtered = filtered.filter(p => p.stock > 0);
    }
    setProductsList(filtered);

    const urlPid = new URLSearchParams(window.location.search).get('pid');
    const targetId = pendingSelectProductId || (!selectedProduct && urlPid ? urlPid : null);
    if (targetId) {
      const found = filtered.find(p => p.id === targetId || String(p.id) === String(targetId) || Number(p.id) === Number(targetId));
      if (found) {
        setSelectedProduct(found);
        setCurrentView('details');
        if (pendingSelectProductId) setPendingSelectProductId(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allProducts, filterCategory, filterBrand, filterMinPrice, filterPrice, filterRating, filterInStock]);

  // Sync / fetch seller's products (admins see all products; sellers see only their own)
  const fetchSellerProducts = async () => {
    if (!user) return;
    try {
      const isAdmin = user.is_staff || user.user_type === 'admin';
      const url = isAdmin
        ? '/ecommerce/products/?page_size=1000'
        : `/ecommerce/products/?seller=${user.id}&page_size=1000`;
      const response = await api.get(url);
      const results = response.data.results || response.data;
      const formatted = results.map(p => ({
        ...p,
        discountPrice: Number(p.discount_price),
        discountPercent: p.discount_percent,
        reviewsCount: p.reviews_count,
        price: Number(p.price)
      }));
      setSellerProducts(formatted);
    } catch (err) {
      console.error("Error fetching seller products:", err);
    }
  };

  const handleEditProduct = (p) => {
    setEditingProduct(p);
    setEditProdName(p.name);
    setEditProdCategory(p.category);
    setEditProdBrand(p.brand);
    setEditProdPrice(p.price);
    setEditProdDiscountPrice(p.discount_price || p.price);
    setEditProdRating(p.rating || '4.5');
    setEditProdReviewsCount(p.reviewsCount || '10');
    setEditProdImage(p.image);
    setEditProdImages(Array.isArray(p.images) ? [...p.images] : []);
    setEditProdDescription(p.description || '');
    setEditProdStock(p.stock || '10');
    setEditProdShippingCharge(p.product_shipping_charge || '49');
    setEditProdDelivery(p.delivery || 'Free delivery by Tomorrow');
    setEditProdCommissionRate(p.commission_rate || '10');
    setEditProdLinkDiscount(p.link_discount_percent ?? '0');
    setEditProdSellerInfo(p.seller_info || '');
    setEditProdHighlights(Array.isArray(p.highlights) ? p.highlights.join('\n') : (p.highlights || ''));
    setEditProdOffers(Array.isArray(p.offers) ? p.offers.join('\n') : (p.offers || ''));
    setEditProdSpecifications(typeof p.specifications === 'string' ? p.specifications : JSON.stringify(p.specifications || {}));
    setEditProdQaSection(typeof p.qa_section === 'string' ? p.qa_section : JSON.stringify(p.qa_section || []));
  };

  // Sync / fetch cart
  const fetchCart = async () => {
    if (!user) return;
    try {
      const response = await api.get('/ecommerce/cart/');
      const items = response.data.items || [];
      const formatted = items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        product: {
          ...item.product_details,
          discountPrice: Number(item.product_details.discount_price),
          discountPercent: item.product_details.discount_percent,
          reviewsCount: item.product_details.reviews_count,
          price: Number(item.product_details.price)
        }
      }));
      setCart(formatted);
    } catch (err) {
      console.error("Error fetching cart:", err);
    } finally {
      cartFetchedOnceRef.current = true;
    }
  };

  // Sync / fetch addresses
  const fetchAddresses = async () => {
    if (!user) return;
    try {
      const response = await api.get('/ecommerce/addresses/');
      // Safely extract array — handles both plain array and paginated {results:[]} responses
      const addrList = Array.isArray(response.data)
        ? response.data
        : (response.data.results || []);

      setAddresses(addrList);
    } catch (err) {
      console.error("Error fetching addresses:", err);
      setAddresses([]); // ensure it stays an array on error
    }
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      if (editingAddressId) {
        await api.put(`/ecommerce/addresses/${editingAddressId}/`, addressFormData);
      } else {
        await api.post('/ecommerce/addresses/', addressFormData);
      }
      setShowAddressForm(false);
      setEditingAddressId(null);
      setAddressFormData({ name: '', phone: '', street_address: '', city: '', district: '', state: '', postal_code: '', is_default: false });
      fetchAddresses();
    } catch (err) {
      console.error("Error saving address:", err);
      showToast("Failed to save address. Please try again.", 'error');
    }
  };

  const handleDeleteAddress = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this address?")) return;
    try {
      await api.delete(`/ecommerce/addresses/${id}/`);
      fetchAddresses();
    } catch (err) {
      console.error("Error deleting address:", err);
    }
  };

  const handleEditAddress = (addr, e) => {
    e.stopPropagation();
    setAddressFormData({
      name: addr.name,
      phone: addr.phone,
      street_address: addr.street_address,
      city: addr.city,
      district: addr.district || '',
      state: addr.state,
      postal_code: addr.postal_code,
      is_default: addr.is_default
    });
    setEditingAddressId(addr.id);
    setShowAddressForm(true);
  };

  // Sync / fetch customer orders
  const fetchCustomerOrders = async () => {
    if (!user) return;
    try {
      const response = await api.get('/ecommerce/orders/');
      setCustomerOrders(response.data.results || response.data);
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  // Sync / fetch seller orders
  const fetchSellerOrders = async () => {
    if (!user) return;
    try {
      const response = await api.get('/ecommerce/orders/?role=seller');
      setSellerOrders(response.data.results || response.data);
    } catch (err) {
      console.error("Error fetching seller orders:", err);
    }
  };

  const fetchAdminWallets = async () => {
    if (!user || (!user.is_staff && user.user_type !== 'admin')) return;
    try {
      const response = await api.get('/ecommerce/admin/wallets/');
      setAdminWallets(response.data);
    } catch (err) {
      console.error("Error fetching admin wallets:", err);
    }
  };

  // Poll admin wallets if the user is on the wallets tab
  useEffect(() => {
    let interval;
    if (adminView === 'wallets' && user && (user.is_staff || user.user_type === 'admin')) {
      fetchAdminWallets();
      interval = setInterval(() => {
        fetchAdminWallets();
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [adminView, user]);

  const fetchAdminWalletPayouts = async () => {
    if (!user || (!user.is_staff && user.user_type !== 'admin')) return;
    try {
      const response = await api.get('/ecommerce/admin/wallet-payouts/');
      setAdminWalletPayouts(response.data.results || response.data || []);
    } catch (err) {
      console.error("Error fetching admin wallet payouts:", err);
    }
  };

  useEffect(() => {
    let interval;
    if (adminView === 'wallets' && user && (user.is_staff || user.user_type === 'admin')) {
      fetchAdminWalletPayouts();
      interval = setInterval(() => {
        fetchAdminWalletPayouts();
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [adminView, user]);

  const processWalletPayout = async (payoutId, action) => {
    setProcessingPayoutId(payoutId);
    try {
      const bank_reference = action === 'complete' ? (window.prompt('Bank reference / transaction ID (optional):') || '') : '';
      await api.post(`/ecommerce/admin/wallet-payouts/${payoutId}/process/`, { action, bank_reference });
      showToast(`Payout ${action === 'complete' ? 'completed' : 'rejected'}`);
      fetchAdminWalletPayouts();
      fetchAdminWallets();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to process payout');
    } finally {
      setProcessingPayoutId(null);
    }
  };

  // Capture referral code from URL query parameter
  useEffect(() => {
    const ref = initialRefCode;
    const pid = initialPidParam;

    if (ref) {
      // -- Real Click Tracking --------------------------------------
      const trackKey = `tracked_click_${ref}`;
      const lastTracked = localStorage.getItem(trackKey);
      const now = Date.now();
      const cooldown = 5000; // 5 seconds cooldown for testing instead of 24h
      if (!lastTracked || now - parseInt(lastTracked, 10) > cooldown) {
        // Set it optimistically to prevent React StrictMode from double-firing
        localStorage.setItem(trackKey, String(now));
        api.post('/ecommerce/track-click/', { referral_code: ref })
          .then(res => {
            console.log('Referral click tracked:', ref);
          })
          .catch(err => {
            console.error('Failed to track referral click:', err);
            // Revert on failure
            localStorage.removeItem(trackKey);
          });
      }
      // -------------------------------------------------------------

      // Resolve the referral code to verify which product it applies to
      api.get(`/ecommerce/resolve-referral/?ref=${ref}`)
        .then(response => {
          const data = response.data;
          const resolvedProductId = data.product_id;
          const resolvedProductName = data.product_name;

          // Save in the referral_map in localStorage
          const refMap = JSON.parse(localStorage.getItem('referral_map') || '{}');
          refMap[resolvedProductId] = ref;
          localStorage.setItem('referral_map', JSON.stringify(refMap));
          
          const discountMap = JSON.parse(localStorage.getItem('referral_discount_map') || '{}');
          discountMap[resolvedProductId] = (data.discount_percent !== undefined && data.discount_percent !== null) ? data.discount_percent : 10;
          localStorage.setItem('referral_discount_map', JSON.stringify(discountMap));

          // Store influencer custom price if set
          const customPriceMap = JSON.parse(localStorage.getItem('referral_price_map') || '{}');
          if (data.custom_price !== null && data.custom_price !== undefined) {
            customPriceMap[resolvedProductId] = data.custom_price;
          } else {
            delete customPriceMap[resolvedProductId];
          }
          localStorage.setItem('referral_price_map', JSON.stringify(customPriceMap));

          // Legacy support (still set global referral code)
          localStorage.setItem('referral_code', ref);

          // Store active referral in React state for immediate reliable re-render
          setActiveReferral({
            product_id: resolvedProductId,
            referral_code: ref,
            discount_percent: (data.discount_percent != null && data.discount_percent > 0) ? data.discount_percent : 0,
            custom_price: (data.custom_price != null) ? Number(data.custom_price) : null,
            influencer: data.influencer || '',
          });

          const hasOffer = data.custom_price != null || (data.discount_percent != null && data.discount_percent > 0);
          showToast(
            data.custom_price != null
              ? `✨ Special price ₹${Number(data.custom_price).toLocaleString()} applied for ${resolvedProductName}!`
              : hasOffer
                ? `✨ ${data.discount_percent}% off applied for ${resolvedProductName}!`
                : `✨ Affiliate link active for ${resolvedProductName}. Your purchase supports the creator!`
          );

          // Clean referral params and insert home entry so browser back → marketplace home
          window.history.replaceState({ view: 'home' }, '', window.location.pathname);
          window.history.pushState({ view: 'details', pid: resolvedProductId }, '', `#details:${resolvedProductId}`);

          // Navigate to the product details page
          setPendingSelectProductId(resolvedProductId);
          setCurrentView('details');
        })
        .catch(err => {
          console.error('Failed to resolve referral code:', err);
          // Fallback if resolve fails but we had a pid in the URL
          if (pid) {
            window.history.replaceState({ view: 'home' }, '', window.location.pathname);
            window.history.pushState({ view: 'details', pid }, '', `#details:${pid}`);
            setPendingSelectProductId(pid);
            setCurrentView('details');
          }
        });
    } else if (pid) {
      setPendingSelectProductId(pid);
      setCurrentView('details');
    }

    const view = new URLSearchParams(window.location.search).get('view');
    if (view) {
      setCurrentView(view);
    }
  }, []);

  // Fetch reviews for the selected product
  const fetchProductReviews = async (productId) => {
    try {
      const response = await api.get(`/ecommerce/reviews/?product=${productId}`);
      const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setProductReviews(data);
    } catch (err) {
      console.error("Error fetching product reviews:", err);
      setProductReviews([]);
    }
    try {
      const response = await api.get(`/ecommerce/customer-reviews/?product=${productId}`);
      const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setCustomerReviews(data);
    } catch (err) {
      console.error("Error fetching customer reviews:", err);
      setCustomerReviews([]);
    }
  };

  const submitCustomerReview = async (e) => {
    e.preventDefault();
    if (!newCustomerReviewComment.trim()) return;
    try {
      await api.post('/ecommerce/customer-reviews/', {
        product: selectedProduct.id,
        rating: newCustomerReviewRating,
        comment: newCustomerReviewComment,
        image: newCustomerReviewImage || ''
      });
      setNewCustomerReviewComment('');
      setNewCustomerReviewRating(5);
      setNewCustomerReviewImage('');
      setReviewImagePreview('');
      showToast('Review submitted successfully!');
      fetchProductReviews(selectedProduct.id);
    } catch (err) {
      console.error("Error submitting review:", err);
      const msg = err.response?.data?.detail || err.response?.data?.error || err.response?.data?.[0] || "Failed to submit review.";
      showToast(msg);
    }
  };

  useEffect(() => {
    if (selectedProduct && currentView === 'details') {
      fetchProductReviews(selectedProduct.id);
    }
  }, [selectedProduct, currentView]);

  useEffect(() => {
    if (pendingSelectProductId && productsList.length > 0) {
      const found = productsList.find(p => p.id === pendingSelectProductId || String(p.id) === String(pendingSelectProductId));
      if (found) {
        setSelectedProduct(found);
        setCurrentView('details');
        setPendingSelectProductId(null);
      }
    }
  }, [pendingSelectProductId, productsList]);

  // Initial loads — categories and settings once, products on search change
  useEffect(() => {
    fetchCategoriesAndBrands();
    fetchStoreSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Auto-advance hero card carousel
  useEffect(() => {
    const slides = storeSettings.hero_card_slides || [];
    if (!storeSettings.hero_card_carousel_enabled || slides.length < 2) return;
    const timer = setInterval(() => {
      setHeroCardSlide(prev => (prev + 1) % slides.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [storeSettings.hero_card_carousel_enabled, storeSettings.hero_card_slides]);

  // Auto-advance testimonials carousel every 5 seconds
  useEffect(() => {
    const reviews = storeSettings.testimonials || [];
    if (reviews.length < 2) return;
    const timer = setInterval(() => {
      setTestimonialSlide(prev => (prev + 1) % reviews.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [storeSettings.testimonials]);

  useEffect(() => {
    if (user) {
      fetchCart();
      fetchAddresses();
      fetchCustomerOrders();
      fetchSellerProducts();
      fetchSellerOrders();
      fetchSupportTickets();
    } else {
      setCart([]);
      setAddresses([]);
      setCustomerOrders([]);
      setSellerProducts([]);
      setSellerOrders([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Handle Search suggestions
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.trim()) {
      const filtered = productsList.filter(p =>
        (p.name || '').toLowerCase().includes(value.toLowerCase()) ||
        (p.category || '').toLowerCase().includes(value.toLowerCase())
      ).map(p => p.name).slice(0, 5);
      setSearchSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const executeSearch = (query) => {
    setSearchQuery(query);
    setShowSuggestions(false);
    setCurrentView('listing');
  };

  // Add to Cart helper
  const addToCart = async (product) => {
    if (!isLoggedIn) {
      setPostAuthView('details'); // after login, return to this product's details
      setCurrentView('auth');
      return false;
    }
    try {
      const response = await api.post('/ecommerce/cart/add/', {
        product: product.id,
        quantity: 1
      });
      const items = response.data.items || [];
      const formatted = items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        product: {
          ...item.product_details,
          discountPrice: Number(item.product_details.discount_price),
          discountPercent: item.product_details.discount_percent,
          reviewsCount: item.product_details.reviews_count,
          price: Number(item.product_details.price)
        }
      }));
      setCart(formatted);
      showToast(`${product.name} added to cart successfully!`);
      setCurrentView('cart');
      return true;
    } catch (err) {
      console.error("Error adding to cart:", err);
      showToast(err.response?.data?.error || "Failed to add item to cart");
      return false;
    }
  };

  const toggleWishlist = (product) => {
    if (!isLoggedIn) { setPostAuthView('home'); setCurrentView('auth'); return; }
    setWishlist(prev =>
      prev.includes(product.id) ? prev.filter(id => id !== product.id) : [...prev, product.id]
    );
    api.post('/ecommerce/wishlist/', { product: product.id }).catch(() => {});
  };

  // Cart summary calculations
  const cartSubtotal = cart.reduce((sum, item) => {
    if (!selectedCartItems.includes(item.id)) return sum;
    const refMap = JSON.parse(localStorage.getItem('referral_map') || '{}');
    const customPriceMap = JSON.parse(localStorage.getItem('referral_price_map') || '{}');
    const hasRef = !!refMap[item.product.id] || !!refMap[String(item.product.id)];
    const customPrice = hasRef ? (customPriceMap[item.product.id] ?? customPriceMap[String(item.product.id)] ?? null) : null;
    const price = (customPrice !== null && customPrice !== undefined) ? Number(customPrice) : item.product.discountPrice;
    return sum + (price * item.quantity);
  }, 0);
  
  // Calculate referral discount per product based on referral_map
  const referralDiscountAmount = cart.reduce((sum, item) => {
    if (!selectedCartItems.includes(item.id)) return sum;
    const refMap = JSON.parse(localStorage.getItem('referral_map') || '{}');
    const customPriceMap = JSON.parse(localStorage.getItem('referral_price_map') || '{}');
    const discountMap = JSON.parse(localStorage.getItem('referral_discount_map') || '{}');
    const hasRef = !!refMap[item.product.id] || !!refMap[String(item.product.id)];
    if (!hasRef) return sum;
    const customPrice = customPriceMap[item.product.id] ?? customPriceMap[String(item.product.id)] ?? null;
    if (customPrice !== null && customPrice !== undefined) {
      // custom price already applied to cartSubtotal, no referral percentage discount
      return sum;
    }
    const pct = discountMap[item.product.id] !== undefined ? discountMap[item.product.id] : (discountMap[String(item.product.id)] !== undefined ? discountMap[String(item.product.id)] : 10);
    return sum + Math.round(item.product.discountPrice * (pct / 100)) * item.quantity;
  }, 0);

  const cartDiscount = (couponApplied ? Math.round(cartSubtotal * couponDiscount) : 0) + referralDiscountAmount;
  const freeShippingThreshold = storeSettings.free_shipping_threshold ?? 500;
  const cartProductShipping = cartSubtotal === 0 || cartSubtotal >= freeShippingThreshold ? 0 : cart.filter(item => selectedCartItems.includes(item.id)).reduce((sum, item) => {
    const charge = Number(item.product?.product_shipping_charge || 0);
    return sum + (charge > 0 ? charge : (storeSettings.shipping_charge ?? 49));
  }, 0);
  const cartDelivery = cartProductShipping;
  const cartTotal = cartSubtotal - cartDiscount + cartDelivery;

  // Seller stats calculations
  const sellerRevenue = sellerOrders.reduce((sum, ord) => {
    const orderRevenue = (ord.items || []).reduce((itemSum, item) => {
      const isAdmin = user?.is_staff || user?.user_type === 'admin';
      if (isAdmin || item.product_details?.seller === user?.id) {
        return itemSum + (Number(item.price) * item.quantity);
      }
      return itemSum;
    }, 0);
    return sum + orderRevenue;
  }, 0);

  const lowStockCount = sellerProducts.filter(p => p.stock < 5).length;

  // Dynamic monthly chart calculations (last 6 months)
  const getMonthlyRevenueData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIndex = new Date().getMonth();
    
    // Get last 6 months
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const idx = (currentMonthIndex - i + 12) % 12;
      last6Months.push({ month: months[idx], index: idx, value: 0 });
    }

    // Accumulate order revenues
    sellerOrders.forEach(ord => {
      const orderDate = new Date(ord.created_at);
      const orderMonth = orderDate.getMonth();
      const match = last6Months.find(m => m.index === orderMonth);
      if (match) {
        const orderRevenue = (ord.items || []).reduce((itemSum, item) => {
          const isAdmin = user?.is_staff || user?.user_type === 'admin';
          if (isAdmin || item.product_details?.seller === user?.id) {
            return itemSum + (Number(item.price) * item.quantity);
          }
          return itemSum;
        }, 0);
        match.value += orderRevenue;
      }
    });

    // Find max value to scale graph height (with default to avoid division by zero)
    const maxVal = Math.max(...last6Months.map(m => m.value), 1000);
    return last6Months.map(m => ({
      month: m.month,
      // scale value to percentage (max 90% height to leave spacing)
      val: Math.max(10, Math.round((m.value / maxVal) * 90)),
      revenue: m.value
    }));
  };

  const monthlyRevenueData = getMonthlyRevenueData();

  // Filter products logic
  const filteredProducts = productsList
    .filter(p => filterDiscount === 0 || (p.discountPercent || 0) >= filterDiscount)
    .filter(p => !filterFreeDelivery || (p.delivery || '').toLowerCase().includes('free'))
    .sort((a, b) => {
      if (sortBy === 'low-high') return a.discountPrice - b.discountPrice;
      if (sortBy === 'high-low') return b.discountPrice - a.discountPrice;
      if (sortBy === 'rating') return b.rating - a.rating;
      return b.rating - a.rating;
    });

  const updateCartItemQuantity = async (itemId, newQuantity) => {
    try {
      const response = await api.patch(`/ecommerce/cart/items/${itemId}/`, {
        quantity: newQuantity
      });
      const items = response.data.items || [];
      const formatted = items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        product: {
          ...item.product_details,
          discountPrice: Number(item.product_details.discount_price),
          discountPercent: item.product_details.discount_percent,
          reviewsCount: item.product_details.reviews_count,
          price: Number(item.product_details.price)
        }
      }));
      setCart(formatted);
    } catch (err) {
      console.error("Error updating cart quantity:", err);
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const response = await api.delete(`/ecommerce/cart/items/${itemId}/`);
      const items = response.data.items || [];
      const formatted = items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        product: {
          ...item.product_details,
          discountPrice: Number(item.product_details.discount_price),
          discountPercent: item.product_details.discount_percent,
          reviewsCount: item.product_details.reviews_count,
          price: Number(item.product_details.price)
        }
      }));
      setCart(formatted);
    } catch (err) {
      console.error("Error removing from cart:", err);
    }
  };

  const applyCoupon = () => {
    const code = couponCode.toUpperCase();
    const coupons = storeSettings.coupon_codes || [];
    const found = coupons.find(c => c.code.toUpperCase() === code);
    if (found) {
      setCouponDiscount(found.discount_percent / 100);
      setCouponApplied(true);
    } else {
      showToast('Invalid Promo Code', 'error');
    }
  };

  const removeCoupon = () => {
    setCouponApplied(false);
    setCouponCode('');
    setCouponDiscount(0);
  };

  const updateOrderStatus = async (orderId, newStatus, trackingNumber, shippingProvider) => {
    try {
      const payload = { status: newStatus };
      if (trackingNumber) payload.tracking_number = trackingNumber;
      if (shippingProvider) payload.shipping_provider = shippingProvider;
      await api.patch(`/ecommerce/orders/${orderId}/status/`, payload);
      fetchSellerOrders();
      fetchCustomerOrders();
      toast.success(`Order status updated to ${newStatus.toUpperCase()}`);
    } catch (err) {
      console.error("Error updating order status:", err);
      toast.error(err.response?.data?.error || "Failed to update order status");
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelModal || !cancelReason) {
      toast.error('Please select a reason for cancellation');
      return;
    }
    if (cancelReason === 'Other' && !cancelComment.trim()) {
      toast.error('Please describe your reason');
      return;
    }
    setCancellingOrder(true);
    try {
      const finalReason = cancelReason === 'Other' ? cancelComment.trim() : cancelReason;
      const finalComment = cancelReason === 'Other' ? cancelComment.trim() : (cancelComment.trim() || cancelReason);
      const formData = new FormData();
      formData.append('reason', finalReason);
      formData.append('comment', finalComment);
      cancelFiles.forEach(f => formData.append('attachments', f));
      await api.post(`/ecommerce/orders/${cancelModal.id}/cancel/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Order cancelled successfully');
      setCancelModal(null);
      setCancelReason('');
      setCancelComment('');
      setCancelFiles([]);
      fetchCustomerOrders();
      if (trackedOrder?.id === cancelModal.id) {
        setTrackedOrder(prev => ({ ...prev, status: 'cancelled' }));
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel order');
    } finally {
      setCancellingOrder(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 pb-20 md:pb-0 ${darkMode ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'}`}>
      
      {!inlineMode && (
        <>
          {/* Fixed Top Header Wrapper */}
          <div className="w-full sticky top-0 z-50">
            {/* Sticky Glassmorphic Navbar */}
            <nav className="w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 py-2 px-3 sm:px-8 shadow-sm transition-all">
              <div className="flex items-center justify-between gap-2 sm:gap-4">

                {/* Logo */}
                <div className="flex items-center shrink-0">
                  <button
                    onClick={() => setCurrentView('home')}
                    className="flex items-center group transition-all hover:opacity-90"
                  >
                    <img src="/collabo-logo.png" alt="Collabo" className="h-8 sm:h-12 object-contain scale-[2.0] sm:scale-[2.2] origin-left transform" />
                  </button>
                </div>

                {/* Smart Search Bar */}
                <div ref={searchContainerRef} className="relative flex-1 max-w-md hidden md:block">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      onFocus={() => setSearchFocused(true)}
                      onKeyDown={(e) => e.key === 'Enter' && executeSearch(searchQuery)}
                      placeholder="Search catalog..."
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full py-2 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all dark:text-white"
                    />
                    <Search className="absolute left-3.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  </div>
                  {/* Search suggestions */}
                  {showSuggestions && searchSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-2 z-50">
                      {searchSuggestions.map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => { executeSearch(s); setSearchFocused(false); }}
                          className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Category dropdown on focus (Amazon-style) */}
                  {searchFocused && !searchQuery && categoriesLoaded && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
                      <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-700">
                        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Browse Categories</span>
                      </div>
                      <div className="py-1">
                        {dynamicCategories.filter(c => c.name !== 'All').map((cat, idx) => {
                          const { Icon } = getCatIcon(cat.name);
                          return (
                            <button
                              key={idx}
                              onClick={() => { setFilterCategory(cat.name); setCurrentView('listing'); setSearchFocused(false); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 dark:hover:bg-slate-700 transition-colors group"
                            >
                              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center group-hover:bg-orange-100 dark:group-hover:bg-orange-900/30 transition-colors">
                                <Icon className="w-4 h-4 text-slate-600 dark:text-slate-300 group-hover:text-orange-600" strokeWidth={1.5} />
                              </div>
                              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-orange-600 transition-colors">{cat.name}</span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-300 ml-auto group-hover:text-orange-400" />
                            </button>
                          );
                        })}
                      </div>
                      <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                        <button
                          onClick={() => { setFilterCategory('All'); setCurrentView('listing'); setSearchFocused(false); }}
                          className="text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors"
                        >
                          View All Products →
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-1.5 sm:space-x-3">

                  <button onClick={() => setCurrentView('orders')} className="hidden md:block p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-300 relative font-bold text-xs transition-colors">Orders</button>
                  <a href="/sell" target="_blank" rel="noopener noreferrer" className="hidden md:block p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-300 relative font-bold text-xs transition-colors">Sell</a>

                  <button onClick={() => setCurrentView('wishlist')} className="hidden sm:block p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-300 relative">
                    <Heart className="w-4 h-4" />
                    {wishlist.length > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-orange-500 text-[10px] font-black text-white rounded-full flex items-center justify-center">{wishlist.length}</span>}
                  </button>

                  <button onClick={() => setCurrentView('cart')} className="hidden md:block p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-300 relative">
                    <ShoppingCart className="w-4 h-4" />
                    {cart.length > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-orange-500 text-[10px] font-black text-white rounded-full flex items-center justify-center">{cart.reduce((s, i) => s + i.quantity, 0)}</span>}
                  </button>

                  {(user?.is_staff || user?.user_type === 'admin') && (
                    <button onClick={() => navigate('/dashboard')} className="hidden sm:flex p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-300 items-center gap-1">
                      <LayoutDashboard className="w-4 h-4 text-orange-500" />
                      <span className="hidden lg:inline text-xs font-bold uppercase tracking-wider">Admin</span>
                    </button>
                  )}

                  <button onClick={() => isLoggedIn ? setCurrentView('profile') : setCurrentView('auth')} className="hidden sm:block bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 py-1.5 px-3 rounded-xl text-[11px] font-extrabold transition-all border border-slate-200/20">
                    {isLoggedIn ? "My Account" : "Login"}
                  </button>

                  {isLoggedIn && user?.user_type === 'influencer' && (
                    <button onClick={() => { setShowHub(true); window.history.pushState({ view: 'hub' }, '', '#hub'); }} className="hidden sm:flex bg-[#1B5E6B] hover:bg-[#164E5A] dark:bg-[#1B5E6B] dark:hover:bg-[#164E5A] text-white py-1.5 px-3.5 rounded-xl shadow-md transition-all items-center gap-1.5 border border-[#164E5A]">
                      <Award className="w-3.5 h-3.5 text-white" />
                      <span className="text-[10px] font-black uppercase tracking-wider">Collab Hub</span>
                    </button>
                  )}

                  <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="sm:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-300">
                    {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Mobile Search */}
              <div className="md:hidden mt-2">
                <div className="relative">
                  <input type="text" value={searchQuery} onChange={handleSearchChange} onKeyDown={(e) => e.key === 'Enter' && executeSearch(searchQuery)} placeholder="Search catalog..." className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full py-2 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all dark:text-white" />
                  <Search className="absolute left-3.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                </div>
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div className="absolute left-3 right-3 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-2 z-50">
                    {searchSuggestions.map((s, idx) => (<button key={idx} onClick={() => executeSearch(s)} className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-colors">{s}</button>))}
                  </div>
                )}
              </div>

              {/* Mobile Dropdown Menu */}
              {mobileMenuOpen && (
                <div className="sm:hidden mt-2 border-t border-slate-100 dark:border-slate-800 pt-3 pb-1 space-y-1">
                  <button onClick={() => { setCurrentView('orders'); setMobileMenuOpen(false); }} className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-3"><Package className="w-4 h-4 text-slate-400" />Orders</button>
                  <a href="/sell" target="_blank" rel="noopener noreferrer" className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-3"><Store className="w-4 h-4 text-slate-400" />Sell</a>
                  <button onClick={() => { setCurrentView('wishlist'); setMobileMenuOpen(false); }} className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-3"><Heart className="w-4 h-4 text-slate-400" />Wishlist {wishlist.length > 0 && `(${wishlist.length})`}</button>
                  <button onClick={() => { isLoggedIn ? setCurrentView('profile') : setCurrentView('auth'); setMobileMenuOpen(false); }} className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-3"><User className="w-4 h-4 text-slate-400" />{isLoggedIn ? 'My Account' : 'Login'}</button>
                  {(user?.is_staff || user?.user_type === 'admin') && (
                    <button onClick={() => { navigate('/dashboard'); setMobileMenuOpen(false); }} className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-3"><LayoutDashboard className="w-4 h-4 text-orange-500" />Admin Dashboard</button>
                  )}
                  {isLoggedIn && user?.user_type === 'influencer' && (
                    <button onClick={() => { setShowHub(true); window.history.pushState({ view: 'hub' }, '', '#hub'); setMobileMenuOpen(false); }} className="w-full text-left px-3 py-2.5 rounded-xl bg-[#1B5E6B]/5 hover:bg-[#1B5E6B]/10 text-sm font-bold text-[#1B5E6B] flex items-center gap-3"><Award className="w-4 h-4" />Collab Hub</button>
                  )}
                </div>
              )}
            </nav>

          {/* Ticker bar */}
          <div className={`w-full bg-slate-950 transition-all duration-300 overflow-hidden ${isCategorySticky ? 'lg:max-h-40 max-h-0' : 'max-h-40'}`}>
            {isLoggedIn && user && (
              <div className={`bg-gradient-to-r from-orange-50 to-amber-50 dark:from-slate-800 dark:to-slate-800 border border-orange-100 dark:border-slate-700 rounded-none px-5 flex items-center justify-between transition-all duration-300 overflow-hidden ${isCategorySticky ? 'max-h-0 py-0 border-0' : 'max-h-20 py-1.5'}`}>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white font-black text-xs flex-shrink-0">
                    {(user.username || user.email || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      {isNewUser ? 'Welcome, ' : 'Welcome back, '}
                      <span className="text-orange-500">{user.username || user.email}</span>! 👋
                    </span>
                    <span className="hidden sm:inline text-[10px] text-slate-400 dark:text-slate-500 ml-2 font-medium">
                      {user.user_type === 'admin' ? '· Admin' : user.user_type === 'influencer' ? '· Influencer' : '· Happy shopping'}
                    </span>
                    {user.reward_points >= 0 && (
                      <button onClick={() => setShowRewardModal(true)} className="hidden sm:inline-flex items-center gap-1 ml-3 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-black px-2 py-0.5 rounded-full hover:bg-amber-200 dark:hover:bg-amber-800/40 transition-colors cursor-pointer">
                        <Award className="w-3 h-3" /> {user.reward_points} Points
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="text-white py-3 px-4 flex items-center justify-between text-sm font-bold overflow-hidden shadow-inner max-w-7xl mx-auto w-full">
              <div key={tickerMsgIndex} className="flex items-center gap-2 min-w-0" style={{ animation: 'tickerFade 0.5s ease' }}>
                <Tag className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                {tickerMsgIndex === 0 ? (
                  <span className="truncate flex items-center gap-2">
                    <span>
                      {storeSettings.ticker_text?.replace(storeSettings.ticker_coupon_highlight, '')}
                      {storeSettings.ticker_coupon_highlight && (
                        <span className="bg-orange-500 text-white px-2 py-0.5 rounded-md font-black ml-1">{storeSettings.ticker_coupon_highlight}</span>
                      )}
                    </span>
                    {storeSettings.ticker_coupon_highlight && (
                      <button
                        onClick={() => autoApplyCouponCode(storeSettings.ticker_coupon_highlight)}
                        className="p-1 hover:bg-white/10 rounded-md transition-colors flex-shrink-0" title="Copy & Apply"
                      >
                        <Copy className="w-3 h-3 text-white/70 hover:text-white" />
                      </button>
                    )}
                  </span>
                ) : (
                  <span className="truncate flex items-center gap-2">
                    <span className="truncate">{tickerExtraMessages[tickerMsgIndex - 1]}</span>
                    <button
                      onClick={handleInviteFriendsClick}
                      className="hidden sm:inline-flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white px-2.5 py-1 rounded-md font-black text-[10px] uppercase tracking-wide flex-shrink-0 transition-colors"
                    >
                      <Gift className="w-3 h-3" /> Invite Friends
                    </button>
                  </span>
                )}
              </div>
            </div>
          </div>
          <style>{`
            @keyframes tickerFade {
              0% { opacity: 0; transform: translateY(6px); }
              100% { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          {/* Sticky Category Bar - text only, appears below navbar after scroll */}
          {currentView === 'home' && isCategorySticky && categoriesLoaded && (
            <div className="w-full bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shadow-sm">
              <div style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="flex items-center justify-between sm:justify-evenly overflow-x-auto overflow-y-hidden scrollbar-hide px-4 sm:px-6 w-full max-w-7xl mx-auto">
                {dynamicCategories.map((cat, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setFilterCategory(cat.name); setCurrentView('listing'); }}
                    className="flex-shrink-0 px-1 sm:px-2.5 py-1 group"
                  >
                    <span className="text-[9px] sm:text-[11px] font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap group-hover:text-orange-500 border-b-2 border-transparent group-hover:border-orange-500 pb-0.5 transition-colors">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          </div>
        </>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 space-y-4 py-2">

        {/* VIEW: HOME */}
        {currentView === 'home' && (
          <div className="space-y-8">

            {/* Flipkart Style Hero Section */}
            <div className="space-y-2 pt-0">
              {/* Normal Category Strip with icons */}
              <div className="w-full bg-transparent">
                <div style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="flex items-center justify-between sm:justify-evenly overflow-x-auto overflow-y-hidden scrollbar-hide gap-4 sm:gap-6 px-4 sm:px-6 py-0.5 w-full max-w-7xl mx-auto snap-x">
                  {!categoriesLoaded ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="flex flex-col items-center gap-1 min-w-[48px] animate-pulse">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-200 dark:bg-slate-700" />
                        <div className="w-10 h-2 rounded bg-slate-200 dark:bg-slate-700" />
                      </div>
                    ))
                  ) : (
                    dynamicCategories.map((cat, idx) => {
                      const catIconData = CAT_ICON_MAP[cat.name];
                      const { Icon } = getCatIcon(cat.name);
                      const hasSpecificIcon = !!catIconData;
                      return (
                        <button
                          key={idx}
                          onClick={() => { setFilterCategory(cat.name); setCurrentView('listing'); }}
                          className="flex flex-col items-center group min-w-[56px] flex-shrink-0 snap-center"
                        >
                          <div className="w-10 h-10 flex items-center justify-center transition-transform group-hover:scale-105 relative">
                            <div className="absolute w-5 h-5 bg-orange-400/90 dark:bg-orange-500/90 rounded-[6px] transform rotate-12 top-1.5 right-1.5 z-0"></div>
                            {cat.image ? (
                              <img src={cat.image} alt={cat.name} className="w-full h-full object-contain relative z-10" />
                            ) : hasSpecificIcon ? (
                              <Icon className="w-8 h-8 text-slate-900 dark:text-slate-100 relative z-10" strokeWidth={1.25} />
                            ) : cat.icon ? (
                              <span className="text-[32px] leading-none relative z-10 font-normal">{cat.icon}</span>
                            ) : (
                              <Icon className="w-8 h-8 text-slate-900 dark:text-slate-100 relative z-10" strokeWidth={1.25} />
                            )}
                          </div>
                          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 group-hover:text-orange-600 transition-colors whitespace-nowrap mt-0.5">{cat.name}</span>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Promo Banners Layout */}
              <div className="flex flex-col lg:flex-row gap-4 items-stretch">
                {/* 70% width Main Carousel */}
                <div className="w-full lg:w-[70%] h-[180px] sm:h-[240px] relative overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                <div ref={carouselRef} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide h-full">
                  {storeSettings.coupon_codes && storeSettings.coupon_codes.length > 0 ? (
                    storeSettings.coupon_codes.map((coupon, i) => {
                      // Determine image: Custom image > Product image > fallback
                      let imageUrl = coupon.image || "";
                      let linkedProduct = null;
                      if (!coupon.image && coupon.product_id) {
                          linkedProduct = productsList.find(p => String(p.id) === String(coupon.product_id));
                          if (linkedProduct && linkedProduct.image) imageUrl = linkedProduct.image;
                      }
                      
                      let finalImageUrl = imageUrl;
                      let isFallbackImage = false;
                      if (!finalImageUrl) {
                          isFallbackImage = true;
                          finalImageUrl = i % 2 === 0 ? '/ecommerce_products_collage.png' : '/wow_person_offer.png';
                      }

                      return (
                      <div key={i} className="flex-none w-full h-full snap-center relative group overflow-hidden">
                        {/* Background Gradient */}
                        <div className={`absolute inset-0 bg-gradient-to-r ${i % 2 === 0 ? 'from-orange-500 to-pink-500' : 'from-blue-600 to-indigo-600'}`} />
                        
                        {/* Split Layout: Left Text, Right Image */}
                        <div className="relative flex flex-row h-full w-full">
                          <div className="flex-1 flex flex-col items-start justify-center h-full text-white pl-4 sm:pl-16 space-y-1.5 sm:space-y-2 z-10">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider mb-1">
                              <Zap className="w-3 h-3 text-yellow-300" fill="currentColor" />
                              Mega Savings Festival
                            </div>
                            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight uppercase drop-shadow-md leading-none">{coupon.discount_percent}% OFF</h2>
                            <h3 className="text-xs sm:text-lg font-extrabold text-white/95 drop-shadow-sm leading-tight max-w-[150px] sm:max-w-xs">
                              Premium Collection
                            </h3>
                            <button 
                              onClick={() => {
                                autoApplyCouponCode(coupon.code);
                                if (linkedProduct) {
                                  setSelectedProduct(linkedProduct);
                                  setCurrentView('details');
                                }
                              }} 
                              className="sm:hidden mt-2 bg-white text-slate-900 px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl"
                            >
                              {linkedProduct ? 'Shop Now' : 'Apply Now'}
                            </button>
                          </div>
                          
                          {/* Center: Frosted CTA Block (Visible on sm+) */}
                          <div className="hidden sm:flex flex-col items-center justify-center z-10 space-y-3 px-4">
                            <p className="text-[11px] lg:text-xs text-white/90 max-w-xs text-center font-medium drop-shadow-sm leading-relaxed">
                              Upgrade your lifestyle with our top-tier catalog. Discover exclusive deals today!
                            </p>
                            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-2.5 rounded-2xl border border-white/20 shadow-xl">
                              <div className="flex flex-col items-start pl-2">
                                <span className="text-[9px] font-bold text-white/80 uppercase tracking-widest">Use Code</span>
                                <span className="text-sm font-black text-white tracking-widest mt-0.5">{coupon.code}</span>
                              </div>
                              <button 
                                onClick={() => {
                                  autoApplyCouponCode(coupon.code);
                                  if (linkedProduct) {
                                    setSelectedProduct(linkedProduct);
                                    setCurrentView('details');
                                  }
                                }} 
                                className="bg-white text-slate-900 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-transform"
                              >
                                {linkedProduct ? 'Shop Now' : 'Apply Now'}
                              </button>
                            </div>
                          </div>
                          
                          {/* Right side image */}
                          <div className="flex items-center justify-end pr-3 sm:pr-16 relative w-32 sm:w-auto sm:flex-1 h-full z-0">
                             {finalImageUrl && (
                               <img 
                                 src={finalImageUrl} 
                                 alt="Promo" 
                                 className="max-h-[95%] sm:h-[120%] sm:absolute sm:right-8 sm:top-1/2 sm:-translate-y-1/2 object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-700" 
                               />
                             )}
                          </div>
                        </div>
                      </div>
                    )})
                  ) : (
                    <div className="flex-none w-full h-full snap-center relative group overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-rose-500" />
                        <div className="relative flex flex-row h-full w-full">
                          <div className="flex-1 flex flex-col items-start justify-center h-full text-white pl-4 sm:pl-16 space-y-1.5 sm:space-y-2 z-10">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider mb-1">
                              <Sparkles className="w-3 h-3 text-yellow-300" fill="currentColor" />
                              Welcome Offer
                            </div>
                            <h2 className="text-xl sm:text-4xl lg:text-5xl font-black tracking-tight uppercase drop-shadow-sm leading-tight max-w-[150px] sm:max-w-xl">{storeSettings.hero_headline}</h2>
                            <h3 className="text-[10px] sm:text-sm font-extrabold text-white/90 drop-shadow-sm leading-tight">Join today for benefits</h3>
                            <button className="sm:hidden mt-2 bg-white text-slate-900 px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl">Explore</button>
                          </div>
                          
                          <div className="hidden sm:flex flex-col items-center justify-center z-10 space-y-3 px-4">
                            <p className="text-[11px] lg:text-xs text-white/90 max-w-xs text-center font-medium drop-shadow-sm leading-relaxed">{storeSettings.hero_subheadline}</p>
                            <button className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-transform hover:bg-white hover:text-slate-900">Explore Catalog</button>
                          </div>

                          <div className="flex items-center justify-end pr-3 sm:pr-16 relative w-32 sm:w-auto sm:flex-1 h-full z-0">
                             <img src="/ecommerce_products_collage.png" alt="Tech" className="max-h-[95%] sm:h-[130%] sm:absolute sm:right-8 sm:top-1/2 sm:-translate-y-1/2 object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-700" />
                          </div>
                        </div>
                    </div>
                  )}

                  {/* Refer & Earn slide */}
                  <div className="flex-none w-full h-full snap-center relative group overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600" />
                    <div className="relative flex flex-row h-full w-full">
                      <div className="flex-1 flex flex-col items-start justify-center h-full text-white pl-4 sm:pl-16 space-y-1.5 sm:space-y-2 z-10">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider mb-1">
                          <Gift className="w-3 h-3 text-yellow-300" />
                          Refer & Earn
                        </div>
                        <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight uppercase drop-shadow-sm leading-none">Earn Upto 10%</h2>
                        <h3 key={tickerMsgIndex} className="text-[10px] sm:text-sm font-extrabold text-white/95 drop-shadow-sm leading-tight max-w-[150px] sm:max-w-xs truncate w-full" style={{ animation: 'tickerFade 0.5s ease' }}>
                          {tickerExtraMessages[tickerMsgIndex % tickerExtraMessages.length]}
                        </h3>
                        <button
                          onClick={handleInviteFriendsClick}
                          className="sm:hidden mt-2 bg-white text-slate-900 px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-transform"
                        >
                          Invite Friends
                        </button>
                      </div>

                      {/* Center: Frosted CTA Block (Visible on sm+) */}
                      <div className="hidden sm:flex flex-col items-center justify-center z-10 space-y-3 px-4">
                        <p className="text-[11px] lg:text-xs text-white/90 max-w-xs text-center font-medium drop-shadow-sm leading-relaxed line-clamp-2">
                          Share your referral link, wallet & redeem rewards every time a friend shops.
                        </p>
                        <button
                          onClick={handleInviteFriendsClick}
                          className="bg-white text-slate-900 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-transform"
                        >
                          Invite Friends
                        </button>
                      </div>

                      {/* Right side image */}
                      <div className="flex items-center justify-end pr-3 sm:pr-16 relative w-32 sm:w-auto sm:flex-1 h-full z-0">
                        <img
                          src="/images/refer-earn-girl.svg"
                          alt="Refer and Earn"
                          className="max-h-[95%] sm:h-[130%] sm:absolute sm:right-8 sm:top-1/2 sm:-translate-y-1/2 object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-700"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 30% width Sidecar Banners Carousel */}
              <div className="hidden lg:flex w-[30%] flex-col flex-shrink-0 relative overflow-hidden">
                 {(() => {
                   let sidecars = storeSettings.hero_sidecars || [];
                   if (sidecars.length === 0) {
                     sidecars = [
                       { title: 'Deal of the Day', subtitle: 'Extra 50% Off Top Brands', product_id: productsList[3]?.id || productsList[0]?.id },
                       { title: 'New Arrivals', subtitle: 'Extra 50% Off Top Brands', product_id: productsList[4]?.id || productsList[1]?.id }
                     ];
                   }

                   const scIndex = activeSidecarIndex % sidecars.length;
                   const sc = sidecars[scIndex];

                   let linkedProduct = null;
                   if (sc.product_id) {
                     linkedProduct = productsList.find(p => String(p.id) === String(sc.product_id));
                   }
                   const title = sc.title || (linkedProduct ? linkedProduct.name.substring(0, 20) + '...' : "Offer");
                   const subtitle = sc.subtitle || (linkedProduct ? linkedProduct.category : "Shop Now");
                   return (
                     <div key="sidecar-carousel" onClick={() => { if (linkedProduct) { setSelectedProduct(linkedProduct); setCurrentView('details'); } }} className={`flex-1 w-full h-full bg-[#fdfbf6] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-row relative shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden group transition-opacity duration-300 ${linkedProduct ? 'cursor-pointer' : ''}`}>
                        {/* Ad Banner Content */}
                        <div className="w-[55%] p-4 sm:p-6 flex flex-col justify-center z-10">
                          <h3 className="text-xl sm:text-2xl font-black mb-1 leading-tight text-slate-900 dark:text-white line-clamp-2">{title}</h3>
                          <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3 sm:mb-4 line-clamp-2">{subtitle}</p>
                        </div>

                        {/* Ad Banner Image & Shapes */}
                        <div className="w-[45%] relative z-0 flex items-center justify-center p-2 sm:p-4">
                          <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-orange-400 dark:bg-orange-500 rounded-full blur-2xl opacity-20 pointer-events-none" />
                          <div className="absolute right-0 bottom-0 w-full h-full overflow-hidden pointer-events-none">
                            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-orange-500 rounded-full opacity-10" />
                          </div>

                          {linkedProduct && linkedProduct.image ? (
                             <img src={linkedProduct.image} className="w-full h-full max-w-[110px] sm:max-w-[160px] object-contain drop-shadow-xl group-hover:scale-105 transition-transform duration-500 relative z-10" />
                          ) : (
                             <div className="text-orange-300 dark:text-orange-900/50 group-hover:scale-105 transition-transform relative z-10">
                               <Zap className="w-16 h-16 sm:w-24 sm:h-24" fill="currentColor" />
                             </div>
                          )}
                        </div>

                        {/* AD Badge */}
                        <div className="absolute bottom-2 right-2 bg-slate-200/80 dark:bg-slate-800/80 px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-bold text-slate-500 dark:text-slate-400 z-20 backdrop-blur-sm shadow-sm">
                          AD
                        </div>
                     </div>
                   );
                 })()}
              </div>
            </div>

              {/* 3 Smaller Offer Products Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
                {(() => {
                  let slides = storeSettings.hero_card_slides && storeSettings.hero_card_slides.length > 0 
                    ? storeSettings.hero_card_slides 
                    : [];

                  if (slides.length === 0 && productsList.length > 0) {
                    slides = productsList.slice(0, 3).map(p => ({
                      title: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
                      subtitle: p.category,
                      image: p.image,
                      product_id: p.id
                    }));
                  }
                  
                  if (slides.length === 0) return null;
                      
                  return slides.slice(0, 3).map((offer, idx) => {
                    const colors = ['text-blue-600', 'text-rose-600', 'text-orange-600'];
                    const colorClass = offer.color || colors[idx % 3];
                    
                    let linkedProduct = null;
                    if (offer.product_id) {
                      linkedProduct = productsList.find(p => String(p.id) === String(offer.product_id));
                    }

                    const imgSrc = offer.image || (linkedProduct ? linkedProduct.image : "");
                    const title = offer.title || (linkedProduct ? linkedProduct.name.substring(0, 20) + '...' : "Offer");
                    const subtitle = offer.subtitle || (linkedProduct ? linkedProduct.category : "Shop Now");

                    return (
                      <div 
                        key={idx} 
                        onClick={() => {
                          if (linkedProduct) {
                            setSelectedProduct(linkedProduct);
                            setCurrentView('details');
                          }
                        }}
                        className="relative rounded-[24px] overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 cursor-pointer group aspect-[4/3] w-full"
                      >
                        {/* Background Image */}
                        <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800">
                          {imgSrc ? (
                            <img 
                              src={imgSrc} 
                              alt={title} 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" 
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800" />
                          )}
                        </div>
                        
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/5 opacity-80 group-hover:opacity-90 transition-opacity duration-300" />
                        
                        {/* Content Overlay */}
                        <div className="absolute inset-0 p-6 flex flex-col justify-end text-white z-10 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                          <p className={`text-[10px] font-black uppercase tracking-widest mb-1.5 ${colorClass.replace('-600', '-400')}`}>
                            {subtitle}
                          </p>
                          <h3 className="font-extrabold text-xl sm:text-2xl leading-tight tracking-tight mb-3">
                            {title}
                          </h3>
                          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest border-b-2 border-white/30 hover:border-white pb-0.5 w-max transition-colors">
                            <span>Shop Now</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                        
                        {/* AD Badge */}
                        <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] font-bold text-white z-20 border border-white/30 shadow-sm">
                          AD
                        </div>
                      </div>
                    );
                  });
                })()}      
              </div>


            </div>

            {/* Flash Sale / Deals Section */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-850 p-6 sm:p-8 rounded-[40px] shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 bg-orange-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Hourly Discount Offers</span>
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">Deals of the Day</h2>
                </div>
                {/* Custom Countdown Timer */}
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <span>EXPIRING IN</span>
                  <div className="flex items-center gap-1 font-mono text-sm font-black text-orange-500 bg-[#FFFBF5] dark:bg-slate-800 px-3 py-1 rounded-xl border border-orange-200/40">
                    <span>{formatTime(dealTimeLeft).h}</span>:<span>{formatTime(dealTimeLeft).m}</span>:<span>{formatTime(dealTimeLeft).s}</span>
                  </div>
                </div>
              </div>

              {/* Product grid for deals */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-6">
                {(storeSettings.deals_product_ids && storeSettings.deals_product_ids.length > 0
                  ? productsList.filter(p => storeSettings.deals_product_ids.includes(p.id)).slice(0, 4)
                  : productsList.slice(0, 4)
                ).map((prod) => (

                  <div 
                    key={prod.id} 
                    className="bg-[#FFFBF5]/20 dark:bg-slate-900/40 rounded-[28px] border border-slate-200/40 dark:border-slate-800/40 p-4 relative group hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                  >
                    {/* Discount Tag */}
                    <div className="absolute top-3 left-3 bg-orange-500 text-white text-[9px] font-black px-2.5 py-1 rounded-full z-10">
                      -{prod.discountPercent}% OFF
                    </div>
                    {/* Wishlist Icon */}
                    <button 
                      onClick={() => toggleWishlist(prod)}
                      className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-slate-850/90 backdrop-blur-md rounded-xl shadow-sm text-slate-400 hover:text-orange-500 transition-colors z-10"
                    >
                      <Heart className={`w-3.5 h-3.5 ${wishlist.includes(prod.id) ? 'fill-orange-500 text-orange-500' : ''}`} />
                    </button>

                    {/* Image */}
                    <div 
                      onClick={() => { setSelectedProduct(prod); setCurrentView('details'); }}
                      className="w-full aspect-square rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800 cursor-pointer mb-4"
                    >
                      <img src={prod.image} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>

                    {/* Info */}
                    <div className="space-y-1.5 sm:space-y-2">
                      <span className="hidden sm:block text-[9px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">{prod.brand}</span>
                      <h3 
                        onClick={() => { setSelectedProduct(prod); setCurrentView('details'); }}
                        className="font-bold text-xs sm:text-base tracking-tight line-clamp-2 sm:line-clamp-1 cursor-pointer hover:text-orange-500 transition-colors dark:text-white"
                      >
                        {prod.name}
                      </h3>

                      {/* Stars */}
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-orange-500 text-orange-500" />
                        <span className="text-xs sm:text-sm font-black dark:text-slate-200">{prod.rating}</span>
                        <span className="hidden sm:inline text-[10px] sm:text-xs font-medium text-slate-400">({prod.reviewsCount})</span>
                      </div>

                      {/* Pricing */}
                      <div className="flex items-baseline gap-1 sm:gap-2">
                        <span className="text-sm sm:text-base font-black dark:text-white">₹{prod.discountPrice.toLocaleString()}</span>
                        <span className="text-[10px] sm:text-xs text-slate-400 line-through">₹{prod.price.toLocaleString()}</span>
                      </div>

                      {/* Stock scale */}
                      {(() => {
                        const stock = prod.stock || 0;
                        if (stock === 0) {
                          return (
                            <div className="space-y-0.5 sm:space-y-1">
                              <div className="flex justify-between text-[8px] sm:text-[9px] font-black text-slate-400">
                                <span>Sold: 100%</span>
                                <span className="text-red-500 font-bold">Out of stock</span>
                              </div>
                              <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-red-500" style={{ width: '100%' }} />
                              </div>
                            </div>
                          );
                        }
                        const seed = (prod.id || 1) % 7;
                        const multipliers = [1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9];
                        const mult = multipliers[seed];
                        const initialStock = Math.round(stock * mult) + ((prod.id || 1) % 15) + 5;
                        const sold = initialStock - stock;
                        const percent = Math.min(95, Math.max(10, Math.round((sold / initialStock) * 100)));
                        return (
                          <div className="space-y-0.5 sm:space-y-1">
                            <div className="flex justify-between text-[8px] sm:text-[9px] font-black text-slate-400">
                              <span>Sold: {percent}%</span>
                              <span className="text-orange-500">{stock} left</span>
                            </div>
                            <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-orange-500" style={{ width: `${percent}%` }} />
                            </div>
                          </div>
                        );
                      })()}

                      {/* Action */}
                      <button 
                        onClick={() => addToCart(prod)}
                        className="hidden sm:block w-full bg-slate-950 hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-extrabold text-[10px] sm:text-xs uppercase tracking-wider py-2 sm:py-3 rounded-lg sm:rounded-xl transition-colors mt-1 sm:mt-2"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

              {/* Micro-Section: Trust Badges / Bank Offers */}
              <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
                 <div
                    onClick={handleInviteFriendsClick}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleInviteFriendsClick(); }}
                    className="relative overflow-hidden flex items-center gap-4 bg-[#fdfbf6] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow group cursor-pointer"
                  >
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-orange-400 dark:bg-orange-500 rounded-full blur-2xl opacity-20 pointer-events-none transition-opacity group-hover:opacity-30" />
                    <div className="text-3xl sm:text-4xl flex-shrink-0 drop-shadow-sm z-10 relative group-hover:scale-110 transition-transform">🎁</div>
                    <div className="z-10 relative flex flex-col justify-center">
                      <div className="flex items-center gap-1 mb-1">
                        <img src="/collabo-logo.png" alt="Collabo" className="h-7 sm:h-8 object-contain scale-[1.8] origin-left" />
                      </div>
                      <p className="text-sm font-black text-slate-900 dark:text-white leading-tight mb-0.5">Refer & Earn</p>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 line-clamp-1">Invite Friends, Get Rewards</p>
                    </div>
                 </div>
                 <div className="relative overflow-hidden hidden sm:flex items-center gap-4 bg-[#fdfbf6] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow group">
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-400 dark:bg-blue-500 rounded-full blur-2xl opacity-20 pointer-events-none transition-opacity group-hover:opacity-30" />
                    <div className="text-3xl sm:text-4xl flex-shrink-0 drop-shadow-sm z-10 relative group-hover:scale-110 transition-transform">🚚</div>
                    <div className="z-10 relative flex flex-col justify-center">
                      <div className="flex items-center gap-1 mb-1">
                        <img src="/collabo-logo.png" alt="Collabo" className="h-7 sm:h-8 object-contain scale-[1.8] origin-left" />
                      </div>
                      <p className="text-sm font-black text-slate-900 dark:text-white leading-tight mb-0.5">Free Fast Delivery</p>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 line-clamp-1">On all orders over ₹499</p>
                    </div>
                 </div>
                 <div className="relative overflow-hidden hidden sm:flex items-center gap-4 bg-[#fdfbf6] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow group">
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-400 dark:bg-emerald-500 rounded-full blur-2xl opacity-20 pointer-events-none transition-opacity group-hover:opacity-30" />
                    <div className="text-3xl sm:text-4xl flex-shrink-0 drop-shadow-sm z-10 relative group-hover:scale-110 transition-transform">🛡️</div>
                    <div className="z-10 relative flex flex-col justify-center">
                      <div className="flex items-center gap-1 mb-1">
                        <img src="/collabo-logo.png" alt="Collabo" className="h-7 sm:h-8 object-contain scale-[1.8] origin-left" />
                      </div>
                      <p className="text-sm font-black text-slate-900 dark:text-white leading-tight mb-0.5">Secure Payments</p>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 line-clamp-1">Quick Withdrawals, Zero Hassle</p>
                    </div>
                 </div>
              </div>

            {/* Trending Section */}
            <div className="space-y-6">
              <div>
                <span className="text-[10px] font-black tracking-widest text-orange-500 uppercase">Popular Picks</span>
                <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">Trending Products</h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-6">
                {(() => {
                  let trending = storeSettings.trending_product_ids && storeSettings.trending_product_ids.length > 0
                    ? productsList.filter(p => storeSettings.trending_product_ids.includes(p.id)).slice(0, 4)
                    : productsList.slice(4, 8);
                  // Always show at least 4 — backfill from the general catalog if the
                  // curated/sliced list came up short (e.g. a picked product was removed).
                  if (trending.length < 4) {
                    const usedIds = new Set(trending.map(p => p.id));
                    const fillers = productsList.filter(p => !usedIds.has(p.id)).slice(0, 4 - trending.length);
                    trending = [...trending, ...fillers];
                  }
                  return trending;
                })().map((prod) => (

                  <div 
                    key={prod.id} 
                    className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200/50 dark:border-slate-800/50 p-4 relative group hover:shadow-xl transition-all"
                  >
                    <button 
                      onClick={() => toggleWishlist(prod)}
                      className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-slate-850/90 backdrop-blur-md rounded-xl shadow-sm text-slate-400 hover:text-orange-500 transition-colors z-10"
                    >
                      <Heart className={`w-3.5 h-3.5 ${wishlist.includes(prod.id) ? 'fill-orange-500 text-orange-500' : ''}`} />
                    </button>

                    {/* Image */}
                    <div 
                      onClick={() => { setSelectedProduct(prod); setCurrentView('details'); }}
                      className="w-full aspect-square rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800 cursor-pointer mb-4"
                    >
                      <img src={prod.image} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>

                    {/* Info */}
                    <div className="space-y-1.5 sm:space-y-2">
                      <span className="hidden sm:block text-[9px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">{prod.brand}</span>
                      <h3 
                        onClick={() => { setSelectedProduct(prod); setCurrentView('details'); }}
                        className="font-bold text-xs sm:text-base tracking-tight line-clamp-2 sm:line-clamp-1 cursor-pointer hover:text-orange-500 transition-colors dark:text-white"
                      >
                        {prod.name}
                      </h3>

                      {/* Stars */}
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-orange-500 text-orange-500" />
                        <span className="text-xs sm:text-sm font-black dark:text-slate-200">{prod.rating}</span>
                        <span className="hidden sm:inline text-[10px] sm:text-xs font-medium text-slate-400">({prod.reviewsCount})</span>
                      </div>

                      {/* Pricing */}
                      <div className="flex items-baseline gap-1 sm:gap-2">
                        <span className="text-sm sm:text-base font-black dark:text-white">₹{prod.discountPrice.toLocaleString()}</span>
                        <span className="text-[10px] sm:text-xs text-slate-400 line-through">₹{prod.price.toLocaleString()}</span>
                      </div>

                      <button 
                        onClick={() => addToCart(prod)}
                        className="hidden sm:block w-full bg-slate-950 hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-extrabold text-[10px] sm:text-xs uppercase tracking-wider py-2 sm:py-3 rounded-lg sm:rounded-xl transition-colors mt-1"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trending Phones */}
            {(() => {
              const allMobiles = productsList.filter(p =>
                (p.category || '').toLowerCase() === 'mobiles'
              );
              const pinnedIds = storeSettings.trending_phones_product_ids || [];
              const phoneProducts = pinnedIds.length > 0
                ? pinnedIds.map(id => productsList.find(p => p.id === id || String(p.id) === String(id))).filter(Boolean)
                : allMobiles;
              if (phoneProducts.length === 0) return null;

              const phoneBrands = ['All', ...Array.from(new Set(phoneProducts.map(p => p.brand).filter(Boolean)))];
              const KNOWN_BRANDS = ['Apple', 'Samsung', 'OnePlus', 'Xiaomi', 'Realme', 'Vivo', 'Oppo', 'Nothing', 'Google'];
              const orderedBrands = [
                'All',
                ...KNOWN_BRANDS.filter(b => phoneBrands.includes(b)),
                ...phoneBrands.filter(b => b !== 'All' && !KNOWN_BRANDS.includes(b)),
              ];

              const displayed = (trendingPhoneBrand === 'All'
                ? phoneProducts
                : phoneProducts.filter(p => p.brand === trendingPhoneBrand)
              ).slice(0, 6);

              return (
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="text-[10px] font-black tracking-widest text-orange-500 uppercase">{storeSettings.trending_phones_subtitle || 'MOBILES'}</span>
                      <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">{storeSettings.trending_phones_title || 'Trending Phones'}</h2>
                    </div>
                    <button
                      onClick={() => { setFilterCategory('Mobiles'); setCurrentView('listing'); }}
                      className="flex items-center gap-1.5 text-xs font-black text-orange-500 hover:text-orange-600 transition-colors"
                    >
                      Shop All <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Brand chips */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {orderedBrands.map(brand => (
                      <button
                        key={brand}
                        onClick={() => setTrendingPhoneBrand(brand)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                          trendingPhoneBrand === brand
                            ? 'bg-slate-950 text-white border-slate-950 dark:bg-orange-500 dark:border-orange-500'
                            : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
                        }`}
                      >
                        {brand}
                      </button>
                    ))}
                  </div>

                  {/* Phone cards */}
                  {displayed.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                      {displayed.map(prod => (
                        <div
                          key={prod.id}
                          onClick={() => { setSelectedProduct(prod); setCurrentView('details'); }}
                          className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-3 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all group"
                        >
                          {/* Discount badge */}
                          {prod.discountPercent > 0 && (
                            <div className="flex justify-end mb-1">
                              <span className="text-[9px] font-black bg-orange-500 text-white px-1.5 py-0.5 rounded-full">
                                -{prod.discountPercent}%
                              </span>
                            </div>
                          )}
                          {!prod.discountPercent && <div className="h-4 mb-1" />}

                          {/* Image */}
                          <div className="aspect-square rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800 mb-3">
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>

                          {/* Info */}
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide truncate">{prod.brand}</p>
                          <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight mt-0.5 mb-1.5">
                            {prod.name}
                          </p>
                          <div className="flex items-center gap-1 mb-1.5">
                            <Star className="w-3 h-3 fill-orange-500 text-orange-500" />
                            <span className="text-[10px] font-black dark:text-slate-200">{prod.rating}</span>
                            <span className="text-[9px] text-slate-400">({prod.reviewsCount})</span>
                          </div>
                          <p className="text-sm font-black text-slate-900 dark:text-white">
                            ₹{prod.discountPrice.toLocaleString()}
                          </p>
                          {prod.price !== prod.discountPrice && (
                            <p className="text-xs text-slate-400 line-through">₹{prod.price.toLocaleString()}</p>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); addToCart(prod); }}
                            className="w-full mt-2 bg-slate-950 hover:bg-orange-500 dark:bg-slate-800 dark:hover:bg-orange-500 text-white font-extrabold text-[9px] uppercase tracking-wider py-1.5 rounded-lg transition-colors"
                          >
                            Add to Cart
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-slate-400 text-sm font-semibold">
                      No {trendingPhoneBrand} phones available right now.
                    </div>
                  )}
                </div>
              );
            })()}



            {/* Kids Category Highlight Banner */}
            {(() => {
              const kidsProducts = allProducts.filter(p => p.category === 'Kids').slice(0, 4);
              if (kidsProducts.length === 0) return null;
              return (
                <div className="w-full rounded-2xl overflow-hidden bg-gradient-to-r from-pink-500 via-pink-400 to-rose-400 shadow-lg">
                  <div className="flex flex-col lg:flex-row">
                    {/* Left side - Text content */}
                    <div className="lg:w-[35%] p-6 sm:p-8 lg:p-10 flex flex-col justify-center relative overflow-hidden">
                      <div className="absolute -top-10 -left-10 w-40 h-40 bg-pink-300/30 rounded-full blur-2xl" />
                      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-rose-300/30 rounded-full blur-2xl" />
                      <div className="relative z-10">
                        <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full mb-3">Kids Special</span>
                        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight mb-2">Best Toys<br/>for Your<br/>Little Ones</h3>
                        <p className="text-white/80 text-sm sm:text-base mb-5">Fun, safe & educational picks your little ones will love</p>
                        <button
                          onClick={() => { setFilterCategory('Kids'); setCurrentView('listing'); }}
                          className="bg-white text-pink-600 font-black text-xs sm:text-sm px-6 py-3 rounded-xl hover:bg-pink-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 uppercase tracking-wider">
                          Explore Kids Store →
                        </button>
                      </div>
                    </div>
                    {/* Right side - Product grid */}
                    <div className="lg:w-[65%] p-4 sm:p-6">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {kidsProducts.map((product) => (
                          <button
                            key={product.id}
                            onClick={() => { setSelectedProduct(product); setCurrentView('details'); }}
                            className="bg-white rounded-xl p-3 flex flex-col items-center text-center group hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer"
                          >
                            <div className="w-full aspect-square rounded-lg overflow-hidden bg-pink-50 mb-2">
                              <img src={product.image} alt={product.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300 p-1" />
                            </div>
                            <p className="text-[11px] sm:text-xs font-bold text-slate-800 line-clamp-2 leading-tight mb-1">{product.name}</p>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-black text-pink-600">₹{product.discount_price || product.price}</span>
                              {product.discount_price && <span className="text-[10px] text-slate-400 line-through">₹{product.price}</span>}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* KoreKart Category Highlight Banner */}
            <KoreKartSection
              allProducts={allProducts}
              setSelectedProduct={setSelectedProduct}
              setCurrentView={setCurrentView}
              setFilterCategory={setFilterCategory}
            />

            <CollaboAdBanner handleInviteFriendsClick={handleInviteFriendsClick} />

            <CollabEarnBanner
              handleInviteFriendsClick={handleInviteFriendsClick}
            />

            {/* Shop By Category Grid + Side Ad */}
            {(() => {
              const categoryImages = {};
              allProducts.forEach(p => {
                if (!categoryImages[p.category]) categoryImages[p.category] = [];
                if (p.image) categoryImages[p.category].push(p.image);
              });
              const registeredCats = dynamicCategories.filter(c => c.name !== 'All' && categoryImages[c.name] && categoryImages[c.name].length > 0);
              if (registeredCats.length === 0) return null;
              return (
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Left: Category Grid */}
                  <div className="flex-1 min-w-0 space-y-5">
                    <div>
                      <span className="text-[10px] font-black tracking-widest text-orange-500 uppercase">Browse Collections</span>
                      <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">Shop By Category</h2>
                    </div>
                    <div style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="overflow-x-auto scrollbar-hide">
                      <div className="grid grid-rows-2 grid-flow-col auto-cols-[140px] sm:auto-cols-[160px] gap-4 pb-2">
                        {registeredCats.map((cat) => {
                          const imgs = categoryImages[cat.name] || [];
                          const coverImg = imgs[0];
                          return (
                            <button
                              key={cat.name}
                              onClick={() => { setFilterCategory(cat.name); setCurrentView('listing'); }}
                              className="flex flex-col items-center group cursor-pointer"
                            >
                              <div className="w-[120px] h-[120px] sm:w-[135px] sm:h-[135px] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-sm group-hover:shadow-lg transition-all group-hover:-translate-y-1 border border-slate-200 dark:border-slate-700">
                                <img src={coverImg} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                              </div>
                              <span className="mt-2 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-orange-600 transition-colors text-center leading-tight">{cat.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  {/* Right: Ad Carousel (desktop only) */}
                  <div className="hidden lg:block w-[400px] flex-shrink-0 self-stretch mt-14">
                    <ShopByCategoryAdCarousel setFilterCategory={setFilterCategory} setCurrentView={setCurrentView} categoryProducts={categoryImages} allProductsList={allProducts} setSelectedProduct={setSelectedProduct} promoCards={storeSettings.promo_cards} />
                  </div>
                </div>
              );
            })()}

            {/* Customer Feedbacks */}
            <div className="space-y-6">
              <div>
                <span className="text-[10px] font-black tracking-widest text-orange-500 uppercase">Testimonials</span>
                <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">Customer Reviews</h2>
              </div>

              {(() => {
                const reviews = storeSettings.testimonials || [];
                if (reviews.length === 0) return null;
                // Always show 3 cards; compute which 3 are visible
                const total = reviews.length;
                const visible = [0, 1, 2].map(offset => reviews[(testimonialSlide + offset) % total]);
                return (
                  <div className="relative overflow-hidden">
                    {/* Cards row — slides left on each tick */}
                    <div
                      key={testimonialSlide}
                      className="grid grid-cols-1 md:grid-cols-3 gap-6"
                      style={{ animation: 'testimonial-slide-in 0.55s cubic-bezier(0.4,0,0.2,1)' }}
                    >
                      {visible.map((rev, idx) => (
                        <div key={`${testimonialSlide}-${idx}`} className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-[28px] relative hover:shadow-xl transition-all">
                          <div className="flex items-center gap-1.5 mb-3.5">
                            {[...Array(Number(rev.rating) || 5)].map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                            ))}
                          </div>
                          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold leading-relaxed mb-4">"{rev.text}"</p>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center font-black text-xs text-orange-500">
                              {rev.name?.[0]}
                            </div>
                            <div>
                              <h4 className="font-extrabold text-xs dark:text-white">{rev.name}</h4>
                              <span className="text-[9px] text-emerald-500 font-bold flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" />
                                <span>{rev.title}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Dot indicators */}
                    <div className="flex items-center justify-center gap-1.5 mt-5">
                      {reviews.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setTestimonialSlide(i)}
                          className={`rounded-full transition-all duration-300 ${
                            i === testimonialSlide
                              ? 'w-5 h-1.5 bg-orange-500'
                              : 'w-1.5 h-1.5 bg-slate-300 dark:bg-slate-600 hover:bg-orange-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            <Footer />

          </div>
        )}

        {/* VIEW: CATEGORIES (Mobile Flipkart-style layout) */}
        {currentView === 'categories' && (
          <div className="flex flex-col min-h-[calc(100vh-140px)] -mx-4 sm:-mx-6 -mt-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            {/* Top Category Strip (Flipkart-style) — shrinks once pinned by scroll */}
            <div className="sticky top-0 z-20 shrink-0 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shadow-sm">
              <div className={`flex overflow-x-auto hide-scrollbar transition-all duration-200 ${isCatPageStripCompact ? 'gap-2 px-3 py-1.5' : 'gap-3 px-3 py-2.5'}`}>
                {['All', ...categoriesList.map(c => c.name)].filter(cat => cat === 'All' || productsList.some(p => (p.category || '').toLowerCase() === (cat || '').toLowerCase())).map((cat, idx) => {
                  const { Icon } = getCatIcon(cat);
                  return (
                    <button
                      key={idx}
                      onClick={() => setFilterCategory(cat)}
                      className={`flex flex-col items-center shrink-0 transition-all duration-200 ${isCatPageStripCompact ? 'gap-0.5 w-10' : 'gap-1 w-14'}`}
                    >
                      <div className={`rounded-full flex items-center justify-center transition-all duration-200 ${isCatPageStripCompact ? 'w-7 h-7' : 'w-11 h-11'} ${filterCategory === cat ? 'bg-orange-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                        <Icon className={`transition-all duration-200 ${isCatPageStripCompact ? 'w-3.5 h-3.5' : 'w-5 h-5'}`} />
                      </div>
                      <span className={`text-center font-bold leading-tight line-clamp-2 transition-all duration-200 ${isCatPageStripCompact ? 'text-[6px]' : 'text-[8px]'} ${filterCategory === cat ? 'text-orange-600 dark:text-orange-400' : 'text-slate-500 dark:text-slate-400'}`}>
                        {cat}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Product Grid */}
            <div className="flex-1 overflow-y-auto hide-scrollbar pb-24">
              <div className="grid grid-cols-2 gap-2 sm:gap-3 p-3">
                 {productsList.filter(p => filterCategory === 'All' || p.category === filterCategory).map(prod => (
                    <div 
                      key={prod.id} 
                      onClick={() => { setSelectedProduct(prod); setCurrentView('details'); }}
                      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden cursor-pointer flex flex-col hover:shadow-md transition-shadow"
                    >
                      {/* Taller Image */}
                      <div className="w-full aspect-[4/5] bg-slate-50 dark:bg-slate-800 relative">
                        <img src={prod.image} alt={prod.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleWishlist(prod); }}
                          className="absolute top-1.5 right-1.5 p-1.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full text-slate-400 shadow-sm"
                        >
                          <Heart className={`w-3 h-3 ${wishlist.includes(prod.id) ? 'fill-orange-500 text-orange-500' : ''}`} />
                        </button>
                      </div>
                      
                      {/* Compact Details */}
                      <div className="p-2 space-y-1">
                        <h3 className="font-bold text-[10px] tracking-tight line-clamp-2 dark:text-white leading-snug">
                          {prod.name}
                        </h3>
                        <div className="flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-orange-500 text-orange-500" />
                          <span className="text-[9px] font-black dark:text-slate-200">{prod.rating}</span>
                        </div>
                        <div className="flex items-baseline gap-1 pt-0.5">
                          <span className="text-[11px] font-black dark:text-white">₹{prod.discountPrice.toLocaleString()}</span>
                          {prod.price > prod.discountPrice && (
                            <span className="text-[8px] text-slate-400 line-through">₹{prod.price.toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                 ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW: PRODUCT LISTING */}
        {currentView === 'listing' && (
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Sidebar Filters */}
            <div className={`w-full lg:w-64 shrink-0 ${showMobileFilter ? 'block' : 'hidden lg:block'}`}>
              <div className="lg:sticky lg:top-16 space-y-6 lg:max-h-[calc(100vh-80px)] lg:overflow-y-auto lg:scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
              <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-[32px] space-y-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-black text-xs uppercase tracking-wider flex items-center gap-1.5 dark:text-white">
                    <Filter className="w-4 h-4 text-orange-500" />
                    <span>Filters</span>
                  </h3>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => {
                        setFilterCategory('All');
                        setFilterBrand('All');
                        setFilterMinPrice(0);
                        setFilterPrice(100000);
                        setFilterRating(0);
                        setFilterDiscount(0);
                        setFilterInStock(false);
                        setFilterFreeDelivery(false);
                      }}
                      className="text-[9px] font-black text-orange-500 uppercase tracking-widest hover:underline"
                    >
                      Reset
                    </button>
                    <button 
                      onClick={() => setShowMobileFilter(false)}
                      className="lg:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-widest">Category</h4>
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                    {dynamicCategories.map((cat, idx) => (
                      <button
                        key={idx}
                        onClick={() => setFilterCategory(cat.name)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${filterCategory === cat.name ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 font-extrabold' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
                      >
                        <span>{cat.name}</span>
                        {filterCategory === cat.name && <Check className="w-3.5 h-3.5 text-orange-500" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Brand */}
                <div className="space-y-2">
                  <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-widest">Brand</h4>
                  <select
                    value={filterBrand}
                    onChange={(e) => setFilterBrand(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-white"
                  >
                    <option value="All">All Brands</option>
                    {dynamicBrands.map((b, idx) => (
                      <option key={idx} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div className="space-y-3">
                  <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-widest">Price Range</h4>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <p className="text-[9px] text-slate-400 font-bold mb-1">Min (₹)</p>
                      <input
                        type="number"
                        min="0"
                        max={filterPrice - 1}
                        value={filterMinPrice}
                        onChange={(e) => setFilterMinPrice(Number(e.target.value))}
                        placeholder="0"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-1.5 px-2.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-white"
                      />
                    </div>
                    <span className="text-slate-300 text-xs mt-4">—</span>
                    <div className="flex-1">
                      <p className="text-[9px] text-slate-400 font-bold mb-1">Max (₹)</p>
                      <input
                        type="number"
                        min={filterMinPrice + 1}
                        max="100000"
                        value={filterPrice}
                        onChange={(e) => setFilterPrice(Number(e.target.value))}
                        placeholder="100000"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-1.5 px-2.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-white"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="100000"
                    step="500"
                    value={filterPrice}
                    onChange={(e) => setFilterPrice(Number(e.target.value))}
                    className="w-full accent-orange-500"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-black">
                    <span>₹500</span>
                    <span className="text-orange-500">₹{filterPrice.toLocaleString()}</span>
                  </div>
                </div>

                {/* Discount */}
                <div className="space-y-2">
                  <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-widest">Discount</h4>
                  <div className="space-y-1">
                    {[
                      { label: 'Any Discount', value: 0 },
                      { label: '10% or more', value: 10 },
                      { label: '20% or more', value: 20 },
                      { label: '30% or more', value: 30 },
                      { label: '50% or more', value: 50 },
                    ].map(({ label, value }) => (
                      <button
                        key={value}
                        onClick={() => setFilterDiscount(value)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${filterDiscount === value ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
                      >
                        <span>{label}</span>
                        {filterDiscount === value && <Check className="w-3.5 h-3.5 text-orange-500" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Customer Rating */}
                <div className="space-y-2">
                  <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-widest">Customer Rating</h4>
                  <div className="space-y-1">
                    {[4, 3, 2, 1].map((num) => (
                      <button
                        key={num}
                        onClick={() => setFilterRating(filterRating === num ? 0 : num)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${filterRating === num ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
                      >
                        <span className="flex items-center gap-1">
                          {'★'.repeat(num)}{'☆'.repeat(5 - num)}
                          <span className="ml-1">&amp; above</span>
                        </span>
                        {filterRating === num && <Check className="w-3.5 h-3.5 text-orange-500" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Availability */}
                <div className="space-y-2">
                  <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-widest">Availability</h4>
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <div
                      onClick={() => setFilterInStock(!filterInStock)}
                      className={`w-9 h-5 rounded-full relative transition-colors ${filterInStock ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${filterInStock ? 'left-4' : 'left-0.5'}`} />
                    </div>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">In Stock Only</span>
                  </label>
                </div>

                {/* Delivery */}
                <div className="space-y-2">
                  <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-widest">Delivery</h4>
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <div
                      onClick={() => setFilterFreeDelivery(!filterFreeDelivery)}
                      className={`w-9 h-5 rounded-full relative transition-colors ${filterFreeDelivery ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${filterFreeDelivery ? 'left-4' : 'left-0.5'}`} />
                    </div>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Free Delivery</span>
                  </label>
                </div>

              </div>
              </div>
            </div>

            {/* Product Listing Grid Area */}
            <div className="flex-1 space-y-6">
              
              {/* Toolbar */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-[24px] flex flex-col shadow-sm overflow-hidden mb-2">
                <div className="flex items-center justify-between p-3.5 sm:px-6 sm:py-3.5 border-b border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => window.history.back()}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-orange-500 transition-colors shrink-0"
                  >
                    <ChevronRight className="w-3.5 h-3.5 rotate-180" />Back
                  </button>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500">
                    <span className="text-slate-950 dark:text-white font-extrabold">{filteredProducts.length}</span> Products
                  </span>
                </div>
                
                {/* Mobile Filter & Sort row */}
                <div className="flex sm:hidden bg-slate-50 dark:bg-slate-800/50">
                  <button 
                    onClick={() => setShowMobileFilter(!showMobileFilter)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 border-r border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors active:bg-slate-200 dark:active:bg-slate-700"
                  >
                    <Filter className="w-4 h-4 text-orange-500" />
                    Filters
                  </button>
                  <div className="flex-1 flex items-center justify-center gap-2 py-3">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none text-center"
                    >
                      <option value="trending">Trending</option>
                      <option value="low-high">Price: Low-High</option>
                      <option value="high-low">Price: High-Low</option>
                      <option value="rating">Highest Rated</option>
                    </select>
                  </div>
                </div>

                {/* Desktop Sort Row */}
                <div className="hidden sm:flex items-center justify-end gap-3 px-6 py-3 bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-xs font-bold text-slate-400">Sort By:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-1.5 px-3.5 text-xs font-bold focus:outline-none dark:text-white"
                  >
                    <option value="trending">Trending (Default)</option>
                    <option value="low-high">Price: Low to High</option>
                    <option value="high-low">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                  </select>
                </div>
              </div>

              {/* Grid of Product Cards */}
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-3 gap-2 sm:gap-6">
                  {filteredProducts.map((prod) => (
                    <div 
                      key={prod.id} 
                      className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200/50 dark:border-slate-800/50 p-4 relative group hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                    >
                      {prod.discountPercent > 15 && (
                        <div className="absolute top-3 left-3 bg-orange-500 text-white text-[9px] font-black px-2.5 py-1 rounded-full z-10">
                          -{prod.discountPercent}% OFF
                        </div>
                      )}
                      
                      <button 
                        onClick={() => toggleWishlist(prod)}
                        className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-slate-850/90 backdrop-blur-md rounded-xl shadow-sm text-slate-400 hover:text-orange-500 transition-colors z-10"
                      >
                        <Heart className={`w-3.5 h-3.5 ${wishlist.includes(prod.id) ? 'fill-orange-500 text-orange-500' : ''}`} />
                      </button>

                      {/* Image */}
                      <div 
                        onClick={() => { setSelectedProduct(prod); setCurrentView('details'); }}
                        className="w-full aspect-square rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800 cursor-pointer mb-4"
                      >
                        <img src={prod.image} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>

                      {/* Details */}
                      <div className="space-y-1.5 sm:space-y-2">
                        <div className="hidden sm:flex justify-between items-center text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">
                          <span className="truncate pr-1">{prod.brand}</span>
                          <span className="truncate pl-1 text-right">{prod.category}</span>
                        </div>
                        
                        <h3 
                          onClick={() => { setSelectedProduct(prod); setCurrentView('details'); }}
                          className="font-bold text-xs sm:text-base tracking-tight line-clamp-2 sm:line-clamp-1 cursor-pointer hover:text-orange-500 transition-colors dark:text-white"
                        >
                          {prod.name}
                        </h3>

                        {/* Rating */}
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-orange-500 text-orange-500" />
                          <span className="text-xs sm:text-sm font-black dark:text-slate-200">{prod.rating}</span>
                          <span className="hidden sm:inline text-[10px] sm:text-xs font-medium text-slate-400">({prod.reviewsCount})</span>
                        </div>

                        {/* Pricing */}
                        <div className="flex items-baseline gap-1 sm:gap-2 pt-0.5 sm:pt-1">
                          <span className="text-sm sm:text-base font-black dark:text-white">₹{prod.discountPrice.toLocaleString()}</span>
                          {prod.price > prod.discountPrice && (
                            <span className="text-[10px] sm:text-xs text-slate-400 line-through">₹{prod.price.toLocaleString()}</span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="hidden sm:flex flex-col xl:flex-row gap-1.5 sm:gap-2 pt-1.5 sm:pt-2">
                          <button 
                            onClick={() => { setSelectedProduct(prod); setCurrentView('details'); }}
                            className="flex-1 bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-extrabold text-[10px] sm:text-xs uppercase tracking-wider py-2 sm:py-3 rounded-lg sm:rounded-xl transition-colors"
                          >
                            Details
                          </button>
                          <button 
                            onClick={() => addToCart(prod)}
                            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-[10px] sm:text-xs uppercase tracking-wider py-2 sm:py-3 rounded-lg sm:rounded-xl transition-colors"
                          >
                            Add Cart
                          </button>
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-12 rounded-[32px] text-center max-w-sm mx-auto space-y-4 shadow-sm">
                  <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
                    <Filter className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-base dark:text-white">No products match</h3>
                  <p className="text-slate-500 text-xs font-medium leading-relaxed">
                    Adjust price sliding levels, minimum rating, or category selection to locate items.
                  </p>
                  <button 
                    onClick={() => {
                      setFilterCategory('All');
                      setFilterBrand('All');
                      setFilterPrice(100000);
                      setFilterRating(0);
                    }}
                    className="bg-slate-950 text-white dark:bg-slate-800 hover:bg-slate-900 font-bold text-xs py-2.5 px-5 rounded-xl transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              )}

            </div>

          </div>
        )}

        {/* VIEW: PRODUCT DETAILS PAGE */}
        {currentView === 'details' && !selectedProduct && (
          pendingSelectProductId ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
              <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
              <p className="text-sm text-slate-400 font-semibold">Loading product...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
              <Package className="w-16 h-16 text-slate-300 dark:text-slate-700" />
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Product Not Found</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Please select a product from the catalog.</p>
              <button onClick={() => setCurrentView('listing')} className="bg-[#ff9f00] hover:bg-[#ff9f00]/90 text-white px-6 py-2.5 rounded-xl font-bold transition-colors">
                Go to Catalog
              </button>
            </div>
          )
        )}

        {currentView === 'details' && selectedProduct && (
          <div className="space-y-8">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
              <button onClick={() => setCurrentView('home')} className="hover:text-orange-500">Home</button>
              <ChevronRight className="w-3 h-3" />
              <button onClick={() => { setFilterCategory(selectedProduct.category); setCurrentView('listing'); }} className="hover:text-orange-500">{selectedProduct.category}</button>
              <ChevronRight className="w-3 h-3" />
              <span className="truncate max-w-xs dark:text-slate-200">{selectedProduct.name}</span>
            </div>

            {/* Main grid: left=gallery, right=product info + reviews */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:items-start">

              {/* LEFT -- Gallery + sub-images */}
              <div className="lg:col-span-6 lg:sticky lg:top-20 self-start">
                <div className="flex gap-4">
                  {selectedProduct.images && selectedProduct.images.length > 1 && (
                    <div className="flex flex-col gap-3 overflow-y-auto max-h-[500px] hide-scrollbar w-16 shrink-0">
                      {selectedProduct.images.map((img, idx) => (
                        <button key={idx} onClick={() => setActiveDetailImage(img)}
                          className={`shrink-0 w-16 h-16 bg-white dark:bg-slate-900 border rounded-2xl p-1 overflow-hidden transition-all ${activeDetailImage === img ? 'border-orange-500 scale-105 shadow-sm' : 'border-slate-200 dark:border-slate-800'}`}>
                          <img src={img} className="w-full h-full object-cover rounded-xl" alt="thumb" />
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex-1 relative bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-[32px] overflow-hidden aspect-[5/4] flex items-center justify-center p-6 shadow-sm">
                    <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                      <button onClick={() => toggleWishlist(selectedProduct)} className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm hover:shadow-md transition-all" title="Add to Wishlist">
                        <Heart className={`w-4 h-4 ${wishlist.includes(selectedProduct.id) ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
                      </button>
                      <button onClick={() => { if (navigator.share) { navigator.share({ title: selectedProduct.name, text: `Check out ${selectedProduct.name} on Collabo!`, url: window.location.href }); } else { navigator.clipboard.writeText(window.location.href); showToast('Link copied!'); } }} className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm hover:shadow-md transition-all" title="Share">
                        <Share2 className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                    <button onClick={() => handleReferProduct(selectedProduct)} disabled={referLoading} className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-black px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-all" title="Refer & Earn">
                      <Gift className="w-3.5 h-3.5" /> Refer
                    </button>
                    <img src={activeDetailImage} alt={selectedProduct.name} className="max-h-full object-cover rounded-2xl" />
                  </div>
                </div>
                {selectedProduct.images && selectedProduct.images.length > 1 && (
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    {selectedProduct.images.filter(img => img !== selectedProduct.image).map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => setLightboxImage(img)}
                        className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl overflow-hidden aspect-square flex items-center justify-center p-4 cursor-pointer hover:border-orange-400 hover:shadow-md transition-all group"
                      >
                        <img src={img} alt={`${selectedProduct.name} ${idx + 1}`} className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* RIGHT -- Product Info + Reviews */}
              <div className="lg:col-span-6 space-y-5">
              
                {/* Product Ad Carousel */}
                {storeSettings.product_ads && storeSettings.product_ads.length > 0 && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center gap-3 group animate-fadeIn"
                       onClick={() => {
                         const ad = storeSettings.product_ads[activeAdIndex];
                         if (ad) {
                           const linkedProd = productsList.find(p => p.id === parseInt(ad.linkId) || p.id === ad.linkId);
                           if (linkedProd) {
                             setSelectedProduct(linkedProd);
                           } else {
                             window.open('#', '_blank');
                           }
                         }
                       }}>
                    <div className="absolute top-1.5 right-1.5 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[8px] font-black px-1 rounded uppercase tracking-widest z-10">AD</div>
                    
                    <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 shadow-sm relative">
                      {storeSettings.product_ads.map((ad, idx) => (
                        <img 
                          key={ad.id} 
                          src={ad.image} 
                          alt="Ad" 
                          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${idx === activeAdIndex ? 'opacity-100' : 'opacity-0'}`} 
                        />
                      ))}
                    </div>
                    <div className="flex-1 space-y-0.5 min-w-0 pr-4 relative h-12">
                      {storeSettings.product_ads.map((ad, idx) => (
                        <div key={ad.id} className={`absolute inset-0 transition-opacity duration-500 flex flex-col justify-center ${idx === activeAdIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                          <h4 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">{ad.name}</h4>
                          <div className="flex items-center gap-1.5">
                            <span className="text-emerald-600 font-black text-xs">₹{Number(ad.discountPrice || 0).toLocaleString()}</span>
                            {ad.price > ad.discountPrice && (
                              <span className="text-slate-400 line-through text-[9px]">₹{Number(ad.price || 0).toLocaleString()}</span>
                            )}
                            {ad.discountText && (
                              <span className="text-[8px] font-black text-orange-500 bg-orange-50 dark:bg-orange-950/20 px-1 py-0.5 rounded">{ad.discountText}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Product Info Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-[28px] shadow-sm space-y-4">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{selectedProduct.brand}</span>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-tight dark:text-white">{selectedProduct.name}</h1>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1 bg-green-600 text-white px-1.5 py-0.5 rounded text-[11px] font-bold">
                        <span>{selectedProduct.rating}</span>
                        <Star className="w-2.5 h-2.5 fill-white text-white" />
                      </div>
                      <span className="text-xs text-slate-400 font-medium">{selectedProduct.reviewsCount} ratings</span>
                      <span className="text-emerald-600 text-[10px] font-bold flex items-center gap-0.5">
                        <ShieldCheck className="w-3.5 h-3.5" />{selectedProduct.stock > 0 ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>
                  </div>

                  <hr className="border-slate-100 dark:border-slate-800" />

                  {/* Pricing */}
                  {(() => {
                    // Prefer React state (set when referral link resolves); fall back to localStorage for page-refresh persistence
                    const pid = selectedProduct.id;
                    const stateMatch = activeReferral && (String(activeReferral.product_id) === String(pid));
                    let isReferred = stateMatch;
                    let customPrice = stateMatch ? activeReferral.custom_price : null;
                    let refDiscountPct = stateMatch ? activeReferral.discount_percent : 0;

                    if (!isReferred) {
                      // fallback: check localStorage (persists across page refreshes)
                      const refMap = JSON.parse(localStorage.getItem('referral_map') || '{}');
                      const discountMap = JSON.parse(localStorage.getItem('referral_discount_map') || '{}');
                      const customPriceMap = JSON.parse(localStorage.getItem('referral_price_map') || '{}');
                      isReferred = !!refMap[pid] || !!refMap[String(pid)];
                      if (isReferred) {
                        customPrice = customPriceMap[pid] ?? customPriceMap[String(pid)] ?? null;
                        const storedPct = discountMap[pid] !== undefined ? discountMap[pid] : discountMap[String(pid)];
                        refDiscountPct = storedPct !== undefined ? storedPct : 0;
                      }
                    }

                    // Custom price set by influencer
                    if (isReferred && customPrice !== null) return (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-purple-600 bg-purple-50 dark:bg-purple-950/20 p-2 rounded-xl"><Sparkles className="w-3.5 h-3.5" /><span className="font-bold">Special Influencer Price!</span></div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black dark:text-white">₹{Number(customPrice).toLocaleString()}</span>
                          <span className="text-slate-400 line-through text-sm">₹{selectedProduct.discountPrice.toLocaleString()}</span>
                          <span className="text-xs font-bold text-emerald-600">Exclusive Deal</span>
                        </div>
                      </div>
                    );

                    // Percentage discount via referral link
                    if (isReferred && refDiscountPct > 0) {
                      const refDiscountPrice = Math.round(selectedProduct.discountPrice * (1 - refDiscountPct / 100));
                      return (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-orange-600 bg-orange-50 dark:bg-orange-950/20 p-2 rounded-xl"><Sparkles className="w-3.5 h-3.5" /><span className="font-bold">{refDiscountPct}% Referral Discount!</span></div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black dark:text-white">₹{refDiscountPrice.toLocaleString()}</span>
                            <span className="text-slate-400 line-through text-sm">₹{selectedProduct.discountPrice.toLocaleString()}</span>
                            <span className="text-xs font-bold text-emerald-600">Extra {refDiscountPct}% OFF</span>
                          </div>
                        </div>
                      );
                    }

                    // Referral link active but no special price — show affiliate badge + normal price
                    if (isReferred) return (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-teal-600 bg-teal-50 dark:bg-teal-950/20 p-2 rounded-xl"><Sparkles className="w-3.5 h-3.5" /><span className="font-bold">Affiliate Link Active — your purchase supports the creator!</span></div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black dark:text-white">₹{selectedProduct.discountPrice.toLocaleString()}</span>
                          {selectedProduct.price > selectedProduct.discountPrice && (<><span className="text-slate-400 line-through text-sm">₹{selectedProduct.price.toLocaleString()}</span><span className="text-xs font-black text-orange-500 bg-orange-50 dark:bg-orange-950/20 px-2 py-0.5 rounded">-{selectedProduct.discountPercent}% OFF</span></>)}
                        </div>
                      </div>
                    );

                    // Normal price (no referral)
                    return (
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black dark:text-white">₹{selectedProduct.discountPrice.toLocaleString()}</span>
                        {selectedProduct.price > selectedProduct.discountPrice && (<><span className="text-slate-400 line-through text-sm">₹{selectedProduct.price.toLocaleString()}</span><span className="text-xs font-black text-orange-500 bg-orange-50 dark:bg-orange-950/20 px-2 py-0.5 rounded">-{selectedProduct.discountPercent}% OFF</span></>)}
                      </div>
                    );
                  })()}

                  {(() => {
                    let offersList = [];
                    if (Array.isArray(selectedProduct.offers)) {
                      offersList = selectedProduct.offers;
                    } else if (typeof selectedProduct.offers === 'string') {
                      try {
                        offersList = JSON.parse(selectedProduct.offers.replace(/'/g, '"'));
                      } catch {
                        // ignore
                      }
                    }
                    if (!offersList || offersList.length === 0) return null;
                    return (
                      <div className="space-y-2 py-1">
                        <h4 className="font-black text-[11px] text-green-600 uppercase tracking-widest flex items-center gap-1"><Tag className="w-3 h-3" /> Available Offers</h4>
                        {offersList.map((offer, i) => (
                          <div key={i} className="flex items-start gap-2 text-[13px] font-semibold text-slate-600 dark:text-slate-300 leading-snug"><span className="text-green-500 font-bold">▶</span> {offer}</div>
                        ))}
                      </div>
                    );
                  })()}

                  <div className="space-y-4 pt-2">
                    <h4 className="font-extrabold text-[15px] text-slate-800 dark:text-slate-200">Delivery details</h4>
                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden text-sm">
                      <div className="flex gap-3 p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <div className="flex-1 flex justify-between items-center flex-wrap gap-2">
                          {pincodeResult === 'success' ? (
                            <span className="font-semibold dark:text-white">Delivery to {pincodeInput}</span>
                          ) : (
                            <span className="font-semibold dark:text-white">Location not set</span>
                          )}
                          <div className="flex gap-2">
                            <input type="text" maxLength="6" placeholder="Pincode" value={pincodeInput} onChange={(e) => { setPincodeInput(e.target.value); setPincodeResult(null); }} className="w-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs outline-none focus:border-blue-500" />
                            <button onClick={handleCheckPincode} className="text-blue-600 font-bold text-xs hover:underline">Check</button>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3 p-3 border-b border-slate-200 dark:border-slate-700">
                        <Package className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold dark:text-white">{selectedProduct.delivery}</span>
                          {Number(selectedProduct.product_shipping_charge) > 0 ? (
                            <p className="text-[10px] text-slate-500 mt-0.5">Shipping: <span className="font-bold text-slate-700 dark:text-slate-300">₹{selectedProduct.product_shipping_charge}</span> · <span className="text-emerald-600 font-bold">Free above ₹{storeSettings.free_shipping_threshold ?? 500}</span></p>
                          ) : (
                            <p className="text-[10px] text-emerald-600 font-bold mt-0.5">Free Shipping</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-3 p-3 text-xs text-slate-500 dark:text-slate-400">
                        <Store className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <p>Fulfilled by <span className="text-blue-600 font-semibold cursor-pointer">Collabo Verified Seller</span></p>
                          <p className="mt-0.5">4.0 ★ • Trusted Seller • <span className="text-blue-600 font-semibold cursor-pointer">See other sellers</span></p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedProduct.highlights && selectedProduct.highlights.length > 0 && (
                    <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/60 dark:to-slate-900/60 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                          <Zap className="w-3.5 h-3.5 text-orange-500" />
                        </div>
                        <h3 className="text-sm font-black text-slate-800 dark:text-white tracking-tight">Product Highlights</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                        {selectedProduct.highlights.map((hl, i) => (
                          <div key={i} className="flex items-start gap-2 group">
                            <div className="mt-0.5 w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/40 transition-colors">
                              <Check className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <span className="text-[13px] font-semibold text-slate-600 dark:text-slate-300 leading-snug">{hl}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedProduct.seller_info && (
                    <div className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/20">
                      <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 shadow-sm"><ShieldCheck className="w-4 h-4 text-blue-500" /></div>
                      <p className="text-[12px] font-semibold text-slate-600 dark:text-slate-300 leading-snug flex-1">{selectedProduct.brand} products come with a standard brand warranty of 6 months. {selectedProduct.seller_info}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-around py-4">
                    <div className="flex flex-col items-center gap-1.5 text-center">
                      <div className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center bg-white dark:bg-slate-800 shadow-sm"><RefreshCw className="w-5 h-5 text-blue-500" /></div>
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">10-Day<br/>Return</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 text-center">
                      <div className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center bg-white dark:bg-slate-800 shadow-sm"><CreditCard className="w-5 h-5 text-emerald-500" /></div>
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Cash on<br/>Delivery</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 text-center">
                      <div className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center bg-white dark:bg-slate-800 shadow-sm"><ShieldCheck className="w-5 h-5 text-blue-500" /></div>
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Collabo<br/>Assured</span>
                    </div>
                  </div>

                  {selectedProduct.description && <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">{selectedProduct.description}</p>}

                  {(() => {
                    let specs = [];
                    if (Array.isArray(selectedProduct.specifications)) {
                      specs = selectedProduct.specifications;
                    } else if (typeof selectedProduct.specifications === 'string') {
                      try {
                        const parsed = JSON.parse(selectedProduct.specifications);
                        if (Array.isArray(parsed)) specs = parsed;
                        else specs = Object.entries(parsed).map(([name, value]) => ({name, value}));
                      } catch {
                        specs = selectedProduct.specifications.split('\n').filter(s => s.includes(':')).map(s => {
                          const [name, ...val] = s.split(':');
                          return {name: name.trim(), value: val.join(':').trim()};
                        });
                      }
                    }
                    if (!specs || specs.length === 0) return null;
                    return (
                      <div className="space-y-2">
                        <h4 className="font-black text-sm text-slate-400 uppercase tracking-widest">Specifications</h4>
                        <div className="grid grid-cols-2 gap-4 text-base">
                          {specs.map((spec, idx) => (
                            <div key={idx} className="flex flex-col gap-1 border-b border-slate-100 dark:border-slate-800 pb-2">
                              <span className="text-slate-400 font-bold">{spec.name || spec.key}</span>
                              <span className="font-extrabold text-lg text-slate-800 dark:text-slate-200">{spec.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {(() => {
                    let qaList = [];
                    if (Array.isArray(selectedProduct.qa_section)) {
                      qaList = selectedProduct.qa_section;
                    } else if (typeof selectedProduct.qa_section === 'string') {
                      try { qaList = JSON.parse(selectedProduct.qa_section); } catch {}
                    }
                    if (!qaList || qaList.length === 0) return null;
                    return (
                      <div className="space-y-2 mt-4">
                        <h4 className="font-black text-[11px] text-slate-400 uppercase tracking-widest">Questions & Answers</h4>
                        <div className="space-y-3">
                          {qaList.map((qa, idx) => (
                            <div key={idx} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50">
                              <p className="text-[13px] font-extrabold text-slate-800 dark:text-white pb-1.5 border-b border-slate-200 dark:border-slate-700 mb-1.5 flex gap-1"><span className="text-blue-500">Q:</span> <span>{qa.q}</span></p>
                              <p className="text-[13px] font-semibold text-slate-600 dark:text-slate-300 flex gap-1"><span className="text-slate-400">A:</span> <span>{qa.a}</span></p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Add to Cart / Buy Now Action Bar */}
                  <div className="fixed bottom-0 left-0 right-0 md:sticky md:bottom-0 z-[60] bg-white dark:bg-slate-900 p-3 md:p-4 border-t border-slate-200/50 dark:border-slate-800/50 md:-mx-6 md:-mb-6 md:rounded-b-[28px] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)]">
                    <div className="flex gap-2 md:gap-3">
                      <button onClick={async () => { const ok = await addToCart(selectedProduct); if (ok) setCurrentView('cart'); }}
                        className="flex-1 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 font-black text-xs md:text-[13px] uppercase tracking-widest py-3.5 md:py-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2">
                        <ShoppingCart className="w-4 h-4" /> Add to Cart
                      </button>
                      <button onClick={async () => { const ok = await addToCart(selectedProduct); if (ok) setCurrentView('checkout'); }}
                        className="flex-1 bg-[#ff9f00] hover:bg-[#ff9f00]/90 text-white font-black text-xs md:text-[13px] uppercase tracking-widest py-3.5 md:py-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2">
                        <Zap className="w-4 h-4" /> Buy Now
                      </button>
                      <button onClick={() => toggleWishlist(selectedProduct)}
                        className="hidden md:flex p-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 transition-colors items-center justify-center">
                        <Heart className={`w-5 h-5 ${wishlist.includes(selectedProduct.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>

              {/* Reviews — Flipkart-style Ratings & Reviews */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-[28px] shadow-sm overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 pt-6 pb-4">
                    <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">Ratings & Reviews</h3>
                    {isLoggedIn && user?.user_type !== 'influencer' && !customerReviews.some(r => r.username === user.username) && customerOrders.some(o => o.items?.some(it => it.product_details?.id === selectedProduct?.id || it.product === selectedProduct?.id)) && (
                      <button onClick={() => document.getElementById('write-review-section')?.scrollIntoView({ behavior: 'smooth' })} className="text-xs font-bold text-white bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 px-4 py-2 rounded-lg transition-colors">Rate Product</button>
                    )}
                  </div>

                  {/* Rating summary row */}
                  <div className="flex items-start gap-6 px-6 pb-5 border-b border-slate-100 dark:border-slate-800">
                    <div className="text-center shrink-0 min-w-[80px]">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="text-[40px] font-black leading-none text-slate-900 dark:text-white">{selectedProduct.rating}</span>
                        <Star className="w-6 h-6 fill-green-600 text-green-600" />
                      </div>
                      <p className="text-[11px] text-slate-400 font-semibold mt-1">{selectedProduct.reviewsCount} Ratings &</p>
                      <p className="text-[11px] text-slate-400 font-semibold">{customerReviews.length} Reviews</p>
                    </div>
                    <div className="flex-1 space-y-2 pt-1">
                      {[5,4,3,2,1].map(star => {
                        const count = customerReviews.filter(r => Math.round(r.rating) === star).length;
                        const pct = customerReviews.length ? Math.round(count / customerReviews.length * 100) : 0;
                        return (
                          <div key={star} className="flex items-center gap-2.5">
                            <span className="text-[11px] text-slate-600 dark:text-slate-400 font-bold w-5 text-right">{star}<span className="text-[9px]">★</span></span>
                            <div className="flex-1 h-[6px] bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-500 ${star >= 4 ? 'bg-green-500' : star === 3 ? 'bg-yellow-400' : 'bg-red-400'}`} style={{ width: pct + '%' }} />
                            </div>
                            <span className="text-[10px] text-slate-400 w-8 font-semibold">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Customer Reviews List */}
                  <div className="px-6 py-4">
                    {customerReviews.length === 0 ? (
                      <p className="text-sm text-slate-400 font-semibold py-6 text-center">No reviews yet. Be the first!</p>
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {customerReviews.map((rev) => (
                          <div key={rev.id} className="py-4 first:pt-0 last:pb-0 space-y-2.5">
                            <div className="flex items-center gap-3">
                              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold text-white ${rev.rating >= 4 ? 'bg-green-600' : rev.rating === 3 ? 'bg-yellow-500' : 'bg-red-500'}`}>
                                {rev.rating}<Star className="w-2.5 h-2.5 fill-white text-white" />
                              </div>
                              <p className="text-[13px] text-slate-700 dark:text-slate-200 leading-relaxed flex-1">{rev.comment}</p>
                              {(user?.is_staff || user?.user_type === 'admin') && (
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <button
                                    onClick={async () => {
                                      const newComment = prompt('Edit review comment:', rev.comment);
                                      if (newComment !== null && newComment.trim()) {
                                        const newRating = prompt('Edit rating (1-5):', rev.rating);
                                        try {
                                          await api.patch(`/ecommerce/customer-reviews/${rev.id}/`, { comment: newComment.trim(), rating: Number(newRating) || rev.rating });
                                          const res = await api.get(`/ecommerce/customer-reviews/?product=${selectedProduct.id}`);
                                          setCustomerReviews(res.data.results || res.data);
                                          toast.success('Review updated');
                                        } catch (err) { toast.error('Failed to update review'); }
                                      }
                                    }}
                                    className="p-1 text-slate-400 hover:text-blue-500 transition-colors" title="Edit review"
                                  ><Edit className="w-3.5 h-3.5" /></button>
                                  <button
                                    onClick={async () => {
                                      if (window.confirm(`Delete review by ${rev.username}?`)) {
                                        try {
                                          await api.delete(`/ecommerce/customer-reviews/${rev.id}/`);
                                          const res = await api.get(`/ecommerce/customer-reviews/?product=${selectedProduct.id}`);
                                          setCustomerReviews(res.data.results || res.data);
                                          toast.success('Review deleted');
                                        } catch (err) { toast.error('Failed to delete review'); }
                                      }
                                    }}
                                    className="p-1 text-slate-400 hover:text-red-500 transition-colors" title="Delete review"
                                  ><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              )}
                            </div>
                            {rev.image && (
                              <div className="pl-9">
                                <img src={rev.image} alt="Review" className="h-20 w-20 rounded-lg object-cover border border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setLightboxImage(rev.image)} />
                              </div>
                            )}
                            <div className="flex items-center gap-2 pl-9">
                              <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[9px] font-black text-slate-500 dark:text-slate-400">{(rev.username || '?')[0].toUpperCase()}</div>
                              <span className="text-[11px] text-slate-400 font-semibold">{rev.username}</span>
                              <span className="text-[10px] text-slate-300 dark:text-slate-600">•</span>
                              <span className="text-[11px] text-slate-400">{new Date(rev.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3" />Verified</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Write review */}
                  <div id="write-review-section" className="px-6 pb-6">
                    {isLoggedIn && user?.user_type !== 'influencer' ? (() => {
                      const alreadyReviewed = customerReviews.some(r => r.username === user.username);
                      const hasPurchased = customerOrders.some(o => o.items?.some(it => it.product_details?.id === selectedProduct?.id || it.product === selectedProduct?.id));
                      if (alreadyReviewed) return <div className="flex items-center gap-2 text-xs text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 rounded-xl"><CheckCircle2 className="w-4 h-4" />You have already reviewed this product. Thank you!</div>;
                      if (!hasPurchased) return <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700"><Lock className="w-3.5 h-3.5" />Purchase this product to leave a review.</div>;
                      return (
                        <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-4">
                          <h4 className="text-sm font-black text-slate-800 dark:text-white">Rate this product</h4>
                          <form onSubmit={submitCustomerReview} className="space-y-4">
                            <div className="flex items-center gap-1">
                              {[1,2,3,4,5].map(num => <button key={num} type="button" onClick={() => setNewCustomerReviewRating(num)} className="hover:scale-110 transition-transform p-0.5"><Star className={`w-7 h-7 ${num <= newCustomerReviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200 dark:text-slate-700'}`} /></button>)}
                              <span className="ml-2 text-xs text-slate-400 font-semibold">{['', 'Very Bad', 'Bad', 'Good', 'Very Good', 'Excellent'][newCustomerReviewRating]}</span>
                            </div>
                            <div>
                              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block">Review Description</label>
                              <textarea value={newCustomerReviewComment} onChange={e => setNewCustomerReviewComment(e.target.value)} placeholder="Description" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:outline-none focus:border-orange-400 dark:text-white resize-none h-24" />
                            </div>
                            <div className="flex items-center gap-3">
                              <label className="cursor-pointer flex items-center gap-2 bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600 hover:border-orange-400 text-slate-500 hover:text-orange-500 rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors">
                                <ShoppingBag className="w-4 h-4" />{reviewImagePreview ? 'Change Photo' : 'Add Photo'}
                                <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files[0]; if (!f) return; if (f.size > 5*1024*1024) { showToast('Max 5MB'); return; } const r = new FileReader(); r.onloadend = () => { setNewCustomerReviewImage(r.result); setReviewImagePreview(r.result); }; r.readAsDataURL(f); }} />
                              </label>
                              {reviewImagePreview && <div className="relative"><img src={reviewImagePreview} className="w-14 h-14 rounded-lg object-cover border border-slate-200" alt="preview" /><button type="button" onClick={() => { setNewCustomerReviewImage(''); setReviewImagePreview(''); }} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm"><X className="w-3 h-3" /></button></div>}
                            </div>
                            <button type="submit" disabled={!newCustomerReviewComment.trim()} className="bg-[#ff9f00] hover:bg-[#ff9f00]/90 text-white font-bold text-sm uppercase tracking-wide px-8 py-3 rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"><Star className="w-4 h-4" />Submit Review</button>
                          </form>
                        </div>
                      );
                    })() : !isLoggedIn ? (
                      <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700">
                        <Lock className="w-3.5 h-3.5" /><button onClick={() => setCurrentView('auth')} className="text-orange-500 hover:underline font-bold">Login</button>&nbsp;to write a review.
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>


            {/* Similar Items */}
            {(() => {
              let similar = productsList.filter(p => p.id !== selectedProduct.id && p.category === selectedProduct.category).slice(0, 6);
              if (!similar.length) {
                similar = productsList.filter(p => p.id !== selectedProduct.id).slice(0, 6);
              }
              if (!similar.length) return null;
              return (
                <div className="space-y-4 pt-4">
                  <h2 className="text-lg font-black tracking-tight dark:text-white">Similar Items</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    {similar.map(prod => (
                      <div key={prod.id} onClick={() => { setSelectedProduct(prod); setActiveDetailImage(prod.image); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-[20px] p-3 cursor-pointer hover:shadow-lg hover:border-orange-300 dark:hover:border-orange-700 transition-all group">
                        <div className="aspect-square rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800 mb-2.5 flex items-center justify-center">
                          <img src={prod.image} alt={prod.name} className="max-h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                        </div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white line-clamp-2 leading-snug mb-1">{prod.name}</p>
                        <span className="text-[10px] bg-green-600 text-white px-1 py-0.5 rounded font-bold">{prod.rating}★</span>
                        <p className="text-xs font-black text-slate-900 dark:text-white mt-1">₹{prod.discountPrice.toLocaleString()}</p>
                        {prod.discountPercent > 0 && <p className="text-[10px] font-bold text-green-600">{prod.discountPercent}% off</p>}
                        <button 
                          onClick={(e) => { e.stopPropagation(); addToCart(prod); }} 
                          className="mt-3 w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-2 rounded-xl text-xs font-black hover:bg-orange-500 transition-colors">
                          Add to Cart
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Recently Viewed Items */}
            {(() => {
              const recent = recentlyViewed.filter(p => p.id !== selectedProduct.id).slice(0, 6);
              if (!recent.length) return null;
              return (
                <div className="space-y-4 pt-8">
                  <h2 className="text-lg font-black tracking-tight dark:text-white">Recently Viewed</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    {recent.map(prod => (
                      <div key={prod.id} onClick={() => { setSelectedProduct(prod); setActiveDetailImage(prod.image); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-[20px] p-3 cursor-pointer hover:shadow-lg hover:border-orange-300 dark:hover:border-orange-700 transition-all group">
                        <div className="aspect-square rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800 mb-2.5 flex items-center justify-center">
                          <img src={prod.image} alt={prod.name} className="max-h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                        </div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white line-clamp-2 leading-snug mb-1">{prod.name}</p>
                        <span className="text-[10px] bg-green-600 text-white px-1 py-0.5 rounded font-bold">{prod.rating}★</span>
                        <p className="text-xs font-black text-slate-900 dark:text-white mt-1">₹{prod.discountPrice.toLocaleString()}</p>
                        {prod.discountPercent > 0 && <p className="text-[10px] font-bold text-green-600">{prod.discountPercent}% off</p>}
                        <button 
                          onClick={(e) => { e.stopPropagation(); addToCart(prod); }} 
                          className="mt-3 w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-2 rounded-xl text-xs font-black hover:bg-orange-500 transition-colors">
                          Add to Cart
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}


        {/* VIEW: SHOPPING CART */}
        {currentView === 'cart' && (
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <button onClick={() => window.history.back()} className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
                <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </button>
              <h1 className="text-2xl font-black tracking-tight dark:text-white">Shopping Cart</h1>
            </div>

            {cart.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Cart Items (Left) */}
                <div className="lg:col-span-8 space-y-4">
                  {cart.map((item, idx) => {
                    const refMap = JSON.parse(localStorage.getItem('referral_map') || '{}');
                    const discountMap = JSON.parse(localStorage.getItem('referral_discount_map') || '{}');
                    const customPriceMap = JSON.parse(localStorage.getItem('referral_price_map') || '{}');
                    const hasRef = !!refMap[item.product.id] || !!refMap[String(item.product.id)];
                    const customPrice = hasRef ? (customPriceMap[item.product.id] ?? customPriceMap[String(item.product.id)] ?? null) : null;
                    const baseUnitPrice = (customPrice !== null && customPrice !== undefined) ? Number(customPrice) : item.product.discountPrice;
                    
                    const refDiscountPct = hasRef ? (discountMap[item.product.id] !== undefined ? discountMap[item.product.id] : (discountMap[String(item.product.id)] !== undefined ? discountMap[String(item.product.id)] : 10)) : 0;
                    const refDiscountUnit = (hasRef && customPrice === null) ? Math.round(item.product.discountPrice * (refDiscountPct / 100)) : 0;
                    const couponDiscountUnit = couponApplied ? Math.round(baseUnitPrice * couponDiscount) : 0;
                    const finalUnitPrice = baseUnitPrice - refDiscountUnit - couponDiscountUnit;
                    const unitStoreDiscount = item.product.price - item.product.discountPrice;
                    const hasDiscounts = unitStoreDiscount > 0 || hasRef || couponApplied;
                    const totalSavings = ((item.product.price - finalUnitPrice) * item.quantity);

                    return (
                      <div 
                        key={idx} 
                        className={`bg-white dark:bg-slate-900 border ${selectedCartItems.includes(item.id) ? 'border-orange-500' : 'border-slate-200/50 dark:border-slate-800/50'} p-5 rounded-[24px] flex flex-col sm:flex-row sm:items-start justify-between gap-4 shadow-sm transition-colors`}
                      >
                        <div className="flex items-start gap-4 flex-1">
                          <div className="flex h-16 items-center shrink-0">
                            <input 
                              type="checkbox" 
                              checked={selectedCartItems.includes(item.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedCartItems(prev => [...prev, item.id]);
                                } else {
                                  setSelectedCartItems(prev => prev.filter(id => id !== item.id));
                                }
                              }}
                              className="w-5 h-5 accent-orange-500 rounded border-slate-300 dark:border-slate-700 cursor-pointer"
                            />
                          </div>
                          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-xl overflow-hidden shrink-0 flex items-center justify-center border border-slate-100 dark:border-slate-800">
                            <img src={item.product.image} className="max-h-full object-cover" alt={item.product.name} />
                          </div>
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest">{item.product.brand}</span>
                            <h3 className="font-extrabold text-xs line-clamp-1 dark:text-white">{item.product.name}</h3>
                            
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className="text-base font-black dark:text-white">₹{finalUnitPrice.toLocaleString()}</span>
                              {hasDiscounts && (
                                <>
                                  <span className="text-xs text-slate-400 line-through">₹{item.product.price.toLocaleString()}</span>
                                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-md">
                                    Save ₹{totalSavings.toLocaleString()}
                                  </span>
                                </>
                              )}
                            </div>

                            {/* Detailed Price Breakdown */}
                            {hasDiscounts && (
                              <div className="mt-2.5 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/40 space-y-1.5 text-[10px] max-w-sm">
                                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                                  <span>Base Price:</span>
                                  <span className="font-semibold text-slate-700 dark:text-slate-300">₹{item.product.price.toLocaleString()} each</span>
                                </div>
                                {unitStoreDiscount > 0 && (
                                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                                    <span>Store Discount:</span>
                                    <span className="text-emerald-500 font-bold">-₹{unitStoreDiscount.toLocaleString()}</span>
                                  </div>
                                )}
                                {hasRef && (
                                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                                    <span>Referral Discount ({refDiscountPct}%):</span>
                                    <span className="text-emerald-500 font-bold">-₹{refDiscountUnit.toLocaleString()}</span>
                                  </div>
                                )}
                                {couponApplied && (
                                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                                    <span>Coupon Discount ({couponDiscount * 100}%):</span>
                                    <span className="text-emerald-500 font-bold">-₹{couponDiscountUnit.toLocaleString()}</span>
                                  </div>
                                )}
                                {item.quantity > 1 && (
                                  <div className="pt-1.5 border-t border-slate-200/50 dark:border-slate-800 flex justify-between font-bold text-slate-800 dark:text-slate-200">
                                    <span>Subtotal ({item.quantity} items):</span>
                                    <span>₹{(finalUnitPrice * item.quantity).toLocaleString()}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Quantity and Actions */}
                        <div className="flex items-center gap-4 self-end sm:self-start shrink-0">
                          <div className="flex items-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-0.5">
                            <button 
                              onClick={() => {
                                if (item.quantity > 1) {
                                  updateCartItemQuantity(item.id, item.quantity - 1);
                                }
                              }}
                              className="p-1 text-slate-500 hover:text-orange-550"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-bold dark:text-white">{item.quantity}</span>
                            <button 
                              onClick={() => {
                                updateCartItemQuantity(item.id, item.quantity + 1);
                              }}
                              className="p-1 text-slate-500 hover:text-orange-555"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button 
                            onClick={() => {
                              removeFromCart(item.id);
                            }}
                            className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl border border-rose-100 dark:border-rose-900/30"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>

                {/* Summary (Right) */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-[32px] space-y-6 shadow-sm">
                    <h3 className="font-extrabold text-sm dark:text-white">Order Summary</h3>

                    {/* Coupon */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Apply Coupon</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          placeholder="Code: COLLABO20"
                          className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs font-bold uppercase focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-white"
                        />
                        <button 
                          onClick={applyCoupon}
                          className="bg-slate-950 text-white dark:bg-slate-800 hover:bg-slate-900 text-xs font-black px-4 rounded-xl transition-colors"
                        >
                          Apply
                        </button>
                      </div>
                      {couponApplied && (
                        <p className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Coupon discount verified!</span>
                        </p>
                      )}
                    </div>

                    <div className="space-y-3.5 text-xs font-semibold text-slate-500">
                      <div className="flex justify-between">
                        <span>Items Subtotal</span>
                        <span className="text-slate-800 dark:text-white font-bold">₹{cartSubtotal.toLocaleString()}</span>
                      </div>
                      {couponApplied && (
                        <div className="flex justify-between text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 p-2 rounded-xl">
                          <span>Coupon Discount ({couponDiscount * 100}%)</span>
                          <span>-₹{Math.round(cartSubtotal * couponDiscount).toLocaleString()}</span>
                        </div>
                      )}
                      {referralDiscountAmount > 0 && (
                        <div className="flex justify-between text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 p-2 rounded-xl">
                          <span>Referral Discount</span>
                          <span>-₹{referralDiscountAmount.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Standard Shipping</span>
                        <span className="text-slate-800 dark:text-white font-bold">{cartDelivery === 0 ? "FREE" : `₹${cartDelivery}`}</span>
                      </div>
                      <hr className="border-slate-100 dark:border-slate-800" />
                      <div className="flex justify-between font-black text-sm text-slate-900 dark:text-white">
                        <span>Total Payable</span>
                        <span>₹{cartTotal.toLocaleString()}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        if (selectedCartItems.length === 0) {
                          showToast('Please select at least one item to proceed.', 'error');
                          return;
                        }
                        setCurrentView('checkout')
                      }}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs py-3.5 rounded-2xl shadow-md transition-colors text-center block"
                    >
                      Proceed to Checkout
                    </button>

                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-12 rounded-[32px] text-center max-w-sm mx-auto space-y-4 shadow-sm">
                <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-base dark:text-white">Shopping Cart Empty</h3>
                <p className="text-slate-500 text-xs font-medium leading-relaxed">
                  Browse category grids and select high-fidelity products.
                </p>
                <button 
                  onClick={() => { setFilterCategory('All'); setCurrentView('listing'); }}
                  className="bg-slate-950 text-white dark:bg-slate-800 hover:bg-slate-900 font-bold text-xs py-2.5 px-6 rounded-xl transition-colors"
                >
                  Start Shopping
                </button>
              </div>
            )}

            {/* Items Related to Your Cart */}
            {(() => {
              const cartProductIds = cart.map(item => item.product.id);
              const cartCategories = [...new Set(cart.map(item => item.product.category))];
              const related = allProducts
                .filter(p => !cartProductIds.includes(p.id) && cartCategories.includes(p.category))
                .slice(0, 6);
              if (!related.length) return null;
              return (
                <div className="space-y-4 pt-4">
                  <h2 className="text-lg font-black tracking-tight dark:text-white">Items Related to Your Cart</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    {related.map(prod => (
                      <div key={prod.id} onClick={() => { setSelectedProduct(prod); setCurrentView('details'); }}
                        className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-[20px] p-3 cursor-pointer hover:shadow-lg hover:border-orange-300 dark:hover:border-orange-700 transition-all group">
                        <div className="aspect-square rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800 mb-2.5 flex items-center justify-center">
                          <img src={prod.image} alt={prod.name} className="max-h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                        </div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white line-clamp-2 leading-snug mb-1">{prod.name}</p>
                        <span className="text-[10px] bg-green-600 text-white px-1 py-0.5 rounded font-bold">{prod.rating}★</span>
                        <p className="text-xs font-black text-slate-900 dark:text-white mt-1">₹{prod.discountPrice.toLocaleString()}</p>
                        {prod.discountPercent > 0 && <p className="text-[10px] font-bold text-green-600">{prod.discountPercent}% off</p>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Recently Viewed */}
            {(() => {
              const cartProductIds = cart.map(item => item.product.id);
              const recent = recentlyViewed.filter(p => !cartProductIds.includes(p.id)).slice(0, 6);
              if (!recent.length) return null;
              return (
                <div className="space-y-4 pt-4">
                  <h2 className="text-lg font-black tracking-tight dark:text-white">Recently Viewed</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    {recent.map(prod => (
                      <div key={prod.id} onClick={() => { setSelectedProduct(prod); setCurrentView('details'); }}
                        className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-[20px] p-3 cursor-pointer hover:shadow-lg hover:border-orange-300 dark:hover:border-orange-700 transition-all group">
                        <div className="aspect-square rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800 mb-2.5 flex items-center justify-center">
                          <img src={prod.image} alt={prod.name} className="max-h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                        </div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white line-clamp-2 leading-snug mb-1">{prod.name}</p>
                        <span className="text-[10px] bg-green-600 text-white px-1 py-0.5 rounded font-bold">{prod.rating}★</span>
                        <p className="text-xs font-black text-slate-900 dark:text-white mt-1">₹{prod.discountPrice.toLocaleString()}</p>
                        {prod.discountPercent > 0 && <p className="text-[10px] font-bold text-green-600">{prod.discountPercent}% off</p>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* VIEW: CHECKOUT */}
        {currentView === 'checkout' && (
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <button onClick={() => window.history.back()} className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
                <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </button>
              <h1 className="text-2xl font-black tracking-tight dark:text-white">Secure Checkout</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Form details (Left) */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Delivery address */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-[28px] space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-xs uppercase tracking-wider dark:text-white flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-orange-500" />
                      <span>Delivery Address</span>
                    </h3>
                    {!showAddressForm && (
                      <button onClick={() => setShowAddressForm(true)} className="flex items-center gap-1 text-orange-500 hover:text-orange-600 font-bold text-[10px]">
                        <Plus className="w-3 h-3" /> Add New
                      </button>
                    )}
                  </div>
                  
                  {showAddressForm ? (
                    <form onSubmit={handleSaveAddress} className="space-y-3 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <div className="grid grid-cols-2 gap-3">
                        <input required type="text" placeholder="Full Name" value={addressFormData.name} onChange={e => setAddressFormData({...addressFormData, name: e.target.value})} className="w-full text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none" />
                        <input required type="text" placeholder="Phone Number" value={addressFormData.phone} onChange={e => setAddressFormData({...addressFormData, phone: e.target.value})} className="w-full text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none" />
                      </div>
                      <input required type="text" placeholder="Street Address" value={addressFormData.street_address} onChange={e => setAddressFormData({...addressFormData, street_address: e.target.value})} className="w-full text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none" />
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <input required type="text" placeholder="City" value={addressFormData.city} onChange={e => setAddressFormData({...addressFormData, city: e.target.value})} className="w-full text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none" />
                        <input type="text" placeholder="District" value={addressFormData.district || ''} onChange={e => setAddressFormData({...addressFormData, district: e.target.value})} className="w-full text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none" />
                        <input required type="text" placeholder="State" value={addressFormData.state} onChange={e => setAddressFormData({...addressFormData, state: e.target.value})} className="w-full text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none" />
                        <input required type="text" placeholder="PIN Code" value={addressFormData.postal_code} onChange={e => setAddressFormData({...addressFormData, postal_code: e.target.value})} className="w-full text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none" />
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors">
                          {editingAddressId ? 'Update Address' : 'Save Address'}
                        </button>
                        <button type="button" onClick={() => { setShowAddressForm(false); setEditingAddressId(null); setAddressFormData({name:'', phone:'', street_address:'', city:'', district:'', state:'', postal_code:'', is_default: false}); }} className="bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors">
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(Array.isArray(addresses) ? addresses : []).map((addr, idx) => (
                        <div 
                          key={addr.id || idx}
                          onClick={() => setSelectedAddress(idx)}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all ${selectedAddress === idx ? 'border-orange-500 bg-orange-500/5' : 'border-slate-200 dark:border-slate-800'}`}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">{addr.is_default ? 'Default' : 'Shipping'}</span>
                            <div className="flex items-center gap-3">
                              <button onClick={(e) => handleEditAddress(addr, e)} className="text-slate-400 hover:text-orange-500 transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                              <button onClick={(e) => handleDeleteAddress(addr.id, e)} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                              {selectedAddress === idx && <CheckCircle2 className="w-4 h-4 text-orange-500 ml-1" />}
                            </div>
                          </div>
                          <h4 className="font-extrabold text-xs dark:text-white mb-1">{addr.name}</h4>
                          <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mb-2">
                            {addr.street_address}, {addr.city}{addr.district ? `, ${addr.district}` : ''}, {addr.state} - {addr.postal_code}
                          </p>
                          <span className="text-[9px] text-slate-400 font-bold">{addr.phone}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Payment Selection */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-[28px] space-y-4 shadow-sm">
                  <h3 className="font-black text-xs uppercase tracking-wider dark:text-white flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-orange-500" />
                    <span>Payment Method</span>
                  </h3>
                  
                  <div className="space-y-3">
                    {[
                      { id: 'upi', label: 'UPI (Paytm / GooglePay / PhonePe)', desc: 'Instant UPI link verification' },
                      { id: 'card', label: 'Credit or Debit Card', desc: 'Secure encryption' },
                      { id: 'cod', label: 'Cash on Delivery (COD)', desc: 'Pay with cash at door' }
                    ].map((pm) => (
                      <div 
                        key={pm.id}
                        onClick={() => setSelectedPayment(pm.id)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${selectedPayment === pm.id ? 'border-orange-500 bg-orange-500/5' : 'border-slate-200 dark:border-slate-800'}`}
                      >
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-xs dark:text-white">{pm.label}</h4>
                          <p className="text-[10px] text-slate-500 font-semibold">{pm.desc}</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedPayment === pm.id ? 'border-orange-500 bg-orange-500' : 'border-slate-350'}`}>
                          {selectedPayment === pm.id && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Right Panel Summary */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-[32px] space-y-5 shadow-sm">
                  <h3 className="font-extrabold text-sm dark:text-white">Review Summary</h3>

                  {/* Items list — only selected items */}
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {cart.filter(item => selectedCartItems.includes(item.id)).map((item, i) => (
                      <div key={i} className="flex items-center gap-2.5 text-xs">
                        <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                          <img src={item.product?.image || item.image} alt="" className="max-h-full object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 dark:text-white truncate text-[11px]">{item.product?.name || item.name}</p>
                          <p className="text-[9px] text-slate-400">Qty: {item.quantity}</p>
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-300 shrink-0">₹{((item.product?.discount_price || item.product?.price || item.price) * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  <hr className="border-slate-100 dark:border-slate-800" />

                  <div className="space-y-2.5 text-xs font-semibold text-slate-500">
                    <div className="flex justify-between">
                      <span>Subtotal ({cart.filter(i => selectedCartItems.includes(i.id)).reduce((s, i) => s + i.quantity, 0)} items)</span>
                      <span>₹{cartSubtotal.toLocaleString()}</span>
                    </div>
                    {couponApplied ? (
                      <div className="flex justify-between items-center text-emerald-500">
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          Coupon ({couponCode})
                        </span>
                        <span className="flex items-center gap-2">
                          -₹{Math.round(cartSubtotal * couponDiscount).toLocaleString()}
                          <button
                            onClick={removeCoupon}
                            className="text-slate-400 hover:text-rose-500 underline text-[10px] font-bold"
                          >
                            Remove
                          </button>
                        </span>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          placeholder="Have a coupon code?"
                          className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-1.5 px-3 text-[10px] font-bold uppercase focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-white"
                        />
                        <button
                          onClick={applyCoupon}
                          className="bg-slate-950 text-white dark:bg-slate-800 hover:bg-slate-900 text-[10px] font-black px-3 rounded-xl transition-colors"
                        >
                          Apply
                        </button>
                      </div>
                    )}
                    {referralDiscountAmount > 0 && (
                      <div className="flex justify-between text-emerald-500 font-bold">
                        <span>Referral Discount</span>
                        <span>-₹{referralDiscountAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Standard Shipping</span>
                      <span className={cartDelivery === 0 ? 'text-emerald-500 font-bold' : ''}>{cartDelivery === 0 ? "FREE" : `₹${cartDelivery}`}</span>
                    </div>
                    {/* Reward Points Redemption */}
                    {user?.reward_points >= 100 && (
                      <div className="flex items-center justify-between py-1">
                        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-xs font-semibold">
                          <Award className="w-3.5 h-3.5 text-slate-400" /> {user.reward_points} Reward Points
                          <button onClick={() => setShowRewardModal(true)} className="text-[9px] text-slate-400 hover:text-slate-600 hover:underline ml-1">
                            <Info className="w-3 h-3" />
                          </button>
                        </span>
                        <button
                          onClick={() => setRedeemPoints(!redeemPoints)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors ${redeemPoints ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
                        >
                          {redeemPoints ? 'Applied ✓' : 'Redeem'}
                        </button>
                      </div>
                    )}
                    {redeemPoints && user?.reward_points >= 100 && (
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                        <span>Reward Points Discount</span>
                        <span>-₹{Math.min(user.reward_points, Math.round(cartTotal)).toLocaleString()}</span>
                      </div>
                    )}
                    {user && user.reward_points < 100 && user.reward_points > 0 && (
                      <div className="flex items-center justify-between py-1">
                        <span className="flex items-center gap-1.5 text-slate-500 text-[10px] font-semibold">
                          <Award className="w-3 h-3 text-slate-400" /> {user.reward_points} points
                        </span>
                        <button onClick={() => setShowRewardModal(true)} className="text-[9px] text-slate-400 font-bold hover:underline flex items-center gap-1">
                          <Info className="w-3 h-3" /> How to earn more?
                        </button>
                      </div>
                    )}
                    {/* Referral Wallet Redemption — applied after reward points, on whatever remains */}
                    {walletData?.balance > 0 && (() => {
                      const amountAfterPoints = redeemPoints ? Math.max(0, cartTotal - Math.min(user?.reward_points || 0, cartTotal)) : cartTotal;
                      const walletRedeemable = Math.min(walletData.balance, amountAfterPoints);
                      return (
                        <>
                          <div className="flex items-center justify-between py-1">
                            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-xs font-semibold">
                              <Gift className="w-3.5 h-3.5 text-violet-500" /> ₹{walletData.balance.toLocaleString()} Referral Wallet
                              <button onClick={() => setShowWalletModal(true)} className="text-[9px] text-slate-400 hover:text-slate-600 hover:underline ml-1">
                                <Info className="w-3 h-3" />
                              </button>
                            </span>
                            <button
                              onClick={() => setRedeemWallet(!redeemWallet)}
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors ${redeemWallet ? 'bg-violet-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
                            >
                              {redeemWallet ? 'Applied ✓' : 'Redeem'}
                            </button>
                          </div>
                          {redeemWallet && (
                            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                              <span>Referral Wallet Discount</span>
                              <span>-₹{walletRedeemable.toLocaleString()}</span>
                            </div>
                          )}
                        </>
                      );
                    })()}
                    <hr className="border-slate-100 dark:border-slate-800" />
                    <div className="flex justify-between font-black text-sm text-slate-950 dark:text-white">
                      <span>Grand Total</span>
                      <span>₹{(() => {
                        const amountAfterPoints = redeemPoints ? Math.max(0, cartTotal - Math.min(user?.reward_points || 0, cartTotal)) : cartTotal;
                        const amountAfterWallet = redeemWallet ? Math.max(0, amountAfterPoints - Math.min(walletData?.balance || 0, amountAfterPoints)) : amountAfterPoints;
                        return amountAfterWallet.toLocaleString();
                      })()}</span>
                    </div>
                    {cartDiscount > 0 && (
                      <p className="text-[10px] text-emerald-500 font-bold text-right">You save ₹{cartDiscount.toLocaleString()} on this order!</p>
                    )}
                    <p className="text-[8px] text-slate-300 dark:text-slate-600 text-center pt-1">
                      By placing this order you agree to our <a href="/return-policy" className="underline hover:text-slate-400">Return Policy</a>
                    </p>
                  </div>

                  {addresses.length === 0 && (
                    <p className="text-[10px] text-red-500 font-bold text-center">Please add a delivery address to place your order.</p>
                  )}
                  <button
                    disabled={placingOrder || addresses.length === 0}
                    onClick={async () => {
                      if (placingOrder) return;
                      const selectedAddrObj = addresses[selectedAddress];
                      if (!selectedAddrObj) {
                        toast.error("Please select a shipping address");
                        return;
                      }
                      setPlacingOrder(true);

                      const refMap = JSON.parse(localStorage.getItem('referral_map') || '{}');
                      const refCode = localStorage.getItem('referral_code') || '';

                      if (selectedPayment === 'cod') {
                        // Cash on Delivery direct placement
                        setTimeout(async () => {
                          try {
                            const response = await api.post('/ecommerce/orders/', {
                              address: selectedAddrObj.id,
                              coupon_code: couponApplied ? couponCode : '',
                              payment_method: selectedPayment,
                              referral_code: refCode,
                              referral_map: refMap,
                              selected_items: selectedCartItems,
                              redeem_points: redeemPoints,
                              redeem_wallet: redeemWallet
                            });
                            localStorage.removeItem('referral_discount_map');
                            setCreatedOrderId(response.data.order_id);
                            setCart(prevCart => prevCart.filter(item => !selectedCartItems.includes(item.id)));
                            setSelectedCartItems([]);
                            fetchCustomerOrders();
                            setCurrentView('success');
                            toast.success('Order placed successfully!');
                          } catch (err) {
                            console.error("Error placing order:", err);
                            toast.error(err.response?.data?.error || "Error placing order");
                          } finally {
                            setPlacingOrder(false);
                          }
                        }, 50);
                      } else {
                        // Razorpay Payment (Card / UPI) — load the SDK on demand, only when
                        // actually needed, instead of on every single page load
                        try {
                          if (!window.Razorpay) {
                            await new Promise((resolve) => {
                              const script = document.createElement('script');
                              script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                              script.onload = () => resolve(true);
                              script.onerror = () => resolve(false);
                              document.body.appendChild(script);
                            });
                          }
                          const amountAfterPoints = redeemPoints ? Math.max(0, cartTotal - Math.min(user?.reward_points || 0, cartTotal)) : cartTotal;
                          const finalAmount = redeemWallet ? Math.max(0, amountAfterPoints - Math.min(walletData?.balance || 0, amountAfterPoints)) : amountAfterPoints;
                          const orderRes = await api.post('/ecommerce/razorpay/create-order/', {
                            amount: finalAmount
                          });

                          if (orderRes.data.is_mock || typeof window.Razorpay === 'undefined') {
                            toast('Simulating Razorpay payment...', { icon: '⏳' });
                            setTimeout(async () => {
                              try {
                                const verifyRes = await api.post('/ecommerce/razorpay/verify-payment/', {
                                  razorpay_order_id: orderRes.data.rzp_order_id,
                                  razorpay_payment_id: 'pay_mock_' + Math.random().toString(36).substring(2, 11),
                                  razorpay_signature: 'mock_signature',
                                  address: selectedAddrObj.id,
                                  coupon_code: couponApplied ? couponCode : '',
                                  referral_code: refCode,
                                  referral_map: refMap,
                                  selected_items: selectedCartItems,
                                  redeem_points: redeemPoints,
                                  redeem_wallet: redeemWallet
                                });
                                localStorage.removeItem('referral_discount_map');
                                setCreatedOrderId(verifyRes.data.order_id);
                                setCart(prevCart => prevCart.filter(item => !selectedCartItems.includes(item.id)));
                                setSelectedCartItems([]);
                                fetchCustomerOrders();
                                setCurrentView('success');
                                toast.success('Mock Payment Successful!');
                              } catch (err) {
                                toast.error(err.response?.data?.error || "Mock verification failed");
                              } finally {
                                setPlacingOrder(false);
                              }
                            }, 1500);
                          } else {
                            const options = {
                              key: orderRes.data.key_id,
                              amount: orderRes.data.amount,
                              currency: orderRes.data.currency,
                              name: 'Collabo',
                              description: 'Secure Order Payment',
                              image: '/collabo-logo.png',
                              order_id: orderRes.data.rzp_order_id,
                              handler: async function (responseRzp) {
                                try {
                                  const verifyRes = await api.post('/ecommerce/razorpay/verify-payment/', {
                                    razorpay_order_id: responseRzp.razorpay_order_id,
                                    razorpay_payment_id: responseRzp.razorpay_payment_id,
                                    razorpay_signature: responseRzp.razorpay_signature,
                                    address: selectedAddrObj.id,
                                    coupon_code: couponApplied ? couponCode : '',
                                    referral_code: refCode,
                                    referral_map: refMap,
                                    selected_items: selectedCartItems,
                                    redeem_points: redeemPoints,
                                    redeem_wallet: redeemWallet
                                  });
                                  localStorage.removeItem('referral_discount_map');
                                  setCreatedOrderId(verifyRes.data.order_id);
                                  setCart(prevCart => prevCart.filter(item => !selectedCartItems.includes(item.id)));
                                  setSelectedCartItems([]);
                                  fetchCustomerOrders();
                                  setCurrentView('success');
                                  toast.success('Payment successful!');
                                } catch (err) {
                                  console.error("Payment verification failed:", err);
                                  toast.error(err.response?.data?.error || "Payment verification failed");
                                } finally {
                                  setPlacingOrder(false);
                                }
                              },
                              prefill: {
                                name: user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username,
                                email: user?.email,
                                contact: selectedAddrObj.phone
                              },
                              theme: {
                                color: '#8915A0'
                              },
                              modal: {
                                ondismiss: function () {
                                  setPlacingOrder(false);
                                  toast.error('Payment cancelled');
                                }
                              }
                            };
                            const rzp = new window.Razorpay(options);
                            rzp.open();
                          }
                        } catch (err) {
                          console.error("Error initiating Razorpay checkout:", err);
                          toast.error(err.response?.data?.error || "Failed to initiate payment");
                          setPlacingOrder(false);
                        }
                      }
                    }}
                    className="w-full bg-slate-950 hover:bg-slate-900 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-black text-xs uppercase tracking-wider py-4 rounded-2xl shadow-lg transition-colors text-center disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {placingOrder ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : 'Place Secure Order'}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* VIEW: ORDER SUCCESS */}
        {currentView === 'success' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-8 sm:p-12 rounded-[40px] text-center max-w-md mx-auto space-y-6 shadow-2xl">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-500">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-black tracking-tight dark:text-white">Order Placed Successfully!</h1>
              <p className="text-slate-500 text-xs font-semibold">Your premium items are being prepared for dispatch.</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl space-y-2 text-xs font-bold border border-slate-100 dark:border-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-400">Order ID:</span>
              <span className="text-slate-800 dark:text-slate-200">{createdOrderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Delivery:</span>
                <span className="text-slate-850 dark:text-slate-250">Tomorrow by 8 PM</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                onClick={() => {
                  const found = customerOrders.find(o => o.order_id === createdOrderId);
                  if (found) {
                    setTrackedOrder(found);
                    setCurrentView('tracking');
                  } else {
                    setCurrentView('profile');
                  }
                }}
                className="bg-orange-500 hover:bg-orange-660 text-white font-extrabold text-xs py-3 px-6 rounded-xl shadow-md transition-colors"
              >
                Track Shipping
              </button>
              <button 
                onClick={() => setCurrentView('home')}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs py-3 px-6 rounded-xl transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}

        {/* VIEW: ORDERS */}
        {currentView === 'orders' && (
          <div className="space-y-6 animate-fade-in-up pb-12">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => window.history.back()} className="flex shrink-0 items-center justify-center w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
                  <ChevronLeft className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                </button>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Your Orders</h2>
                  <p className="text-sm text-slate-500 font-medium mt-1">View and track all your recent purchases.</p>
                </div>
              </div>
              <button 
                onClick={() => setCurrentView('home')}
                className="p-2 sm:px-4 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Continue Shopping
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[24px] sm:rounded-[32px] p-4 sm:p-8 border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
              <div className="space-y-4">
                {customerOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No orders yet</h3>
                    <p className="text-sm text-slate-500 mt-1">When you buy items, they will appear here.</p>
                  </div>
                ) : (
                  customerOrders.map((ord, idx) => {
                    const orderDate = new Date(ord.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                    
                    return (
                      <div key={idx} className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
                        {/* Order Header */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex flex-col sm:flex-row sm:gap-8 gap-2">
                            <div>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Order Placed</span>
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{orderDate}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total</span>
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">₹{Number(ord.final_amount).toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Order ID</span>
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">{ord.order_id}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${ord.status === 'delivered' ? 'bg-emerald-50 text-emerald-500' : 'bg-orange-50 text-orange-500'}`}>
                              {ord.status}
                            </span>
                            <button 
                              onClick={() => {
                                setTrackedOrder(ord);
                                setCurrentView('tracking');
                              }}
                              className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors"
                            >
                              Track Order
                            </button>
                          </div>
                        </div>
                        
                        {/* Order Items */}
                        <div className="p-4 sm:p-6 bg-white dark:bg-slate-900">
                          <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider">Items in Order</h4>
                          <div className="space-y-4">
                            {ord.items && ord.items.map((item, iIdx) => (
                              <div key={iIdx} className="flex items-start gap-4 pb-4 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 dark:bg-slate-800 rounded-xl flex-shrink-0 flex items-center justify-center border border-slate-100 dark:border-slate-700 overflow-hidden">
                                  {item.product_details?.image ? (
                                    <img src={item.product_details.image} alt={item.product_details.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <ShoppingBag className="w-6 h-6 text-slate-300" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <h5 className="text-sm font-bold text-slate-800 dark:text-white line-clamp-2">{item.product_details?.name || 'Product'}</h5>
                                  <div className="mt-1 flex items-center gap-3 text-xs font-semibold">
                                    <span className="text-slate-500 dark:text-slate-400">Qty: {item.quantity}</span>
                                    <span className="text-slate-900 dark:text-slate-200">₹{Number(item.price).toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW: WISHLIST */}
        {currentView === 'wishlist' && (
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <button onClick={() => window.history.back()} className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
                <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </button>
              <h1 className="text-2xl font-black tracking-tight dark:text-white">My Wishlist</h1>
            </div>

            {wishlist.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-6">
                {productsList.filter(p => wishlist.includes(p.id)).map((prod) => (
                  <div 
                    key={prod.id} 
                    className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200/50 dark:border-slate-800/50 p-4 relative group hover:shadow-xl transition-all"
                  >
                    <button 
                      onClick={() => toggleWishlist(prod)}
                      className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-slate-850/90 backdrop-blur-md rounded-xl shadow-sm text-orange-550 transition-colors z-10"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div 
                      onClick={() => { setSelectedProduct(prod); setCurrentView('details'); }}
                      className="w-full aspect-square rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800 cursor-pointer mb-4"
                    >
                      <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <span className="hidden sm:block text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest truncate">{prod.brand}</span>
                      <h3 
                        onClick={() => { setSelectedProduct(prod); setCurrentView('details'); }}
                        className="font-bold text-xs sm:text-base tracking-tight line-clamp-2 sm:line-clamp-1 cursor-pointer hover:text-orange-500 dark:text-white"
                      >
                        {prod.name}
                      </h3>

                      <div className="flex items-baseline gap-1 sm:gap-2">
                        <span className="text-sm sm:text-base font-black dark:text-white">₹{prod.discountPrice.toLocaleString()}</span>
                      </div>

                      <button 
                        onClick={() => {
                          addToCart(prod);
                          toggleWishlist(prod);
                        }}
                        className="w-full bg-slate-950 hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-extrabold text-[10px] sm:text-xs uppercase tracking-wider py-2 sm:py-3 rounded-lg sm:rounded-xl transition-colors mt-1 sm:mt-2"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-12 rounded-[32px] text-center max-w-sm mx-auto space-y-4 shadow-sm">
                <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
                  <Heart className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-base dark:text-white">Wishlist is Empty</h3>
                <p className="text-slate-500 text-xs font-medium leading-relaxed">
                  Start tracking premium devices and apparel you love.
                </p>
                <button 
                  onClick={() => setCurrentView('home')}
                  className="bg-slate-950 text-white dark:bg-slate-800 hover:bg-slate-900 font-bold text-xs py-2.5 px-6 rounded-xl transition-colors"
                >
                  Start Shop
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW: ORDER TRACKING */}
        {currentView === 'tracking' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 sm:p-10 rounded-[36px] max-w-xl mx-auto space-y-8 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-4">
                <button onClick={() => window.history.back()} className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
                  <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </button>
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Courier Tracker</span>
                  <h2 className="text-2xl font-black tracking-tight dark:text-white">{trackedOrder?.order_id || 'ORD-XYZ'}</h2>
                </div>
              </div>
              <span className={`text-[10px] font-black px-3.5 py-1 rounded-full border uppercase ${
                trackedOrder?.status === 'delivered' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 border-emerald-100' :
                trackedOrder?.status === 'cancelled' ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-500 border-rose-100' :
                'bg-orange-50 dark:bg-orange-950/20 text-orange-500 border-orange-100 animate-pulse'
              }`}>
                {trackedOrder?.status || 'IN TRANSIT'}
              </span>
            </div>

            {/* Interactive shipping timeline */}
            <div className="relative space-y-6 pl-8">
              <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-800" />

              {(() => {
                const status = trackedOrder?.status || 'pending';
                const isCancelled = status === 'cancelled';
                const orderDate = trackedOrder?.created_at ? new Date(trackedOrder.created_at) : new Date();
                const fmtDate = (d) => d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
                const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

                const expectedDelivery = trackedOrder?.expected_delivery_date
                  ? new Date(trackedOrder.expected_delivery_date)
                  : addDays(orderDate, 5);

                const confirmedDate = orderDate;
                const processingDate = addDays(orderDate, 1);
                const transitDate = addDays(orderDate, 2);
                const outForDeliveryDate = addDays(expectedDelivery, -1);
                const deliveryDate = expectedDelivery;

                const steps = isCancelled ? [
                  { title: 'Order Confirmed', time: 'Completed', desc: 'Secure checkout processed.', date: fmtDate(confirmedDate), active: true },
                  { title: 'Order Cancelled', time: 'Cancelled', desc: 'This order has been cancelled.', date: '', active: true, current: true }
                ] : [
                  { title: 'Order Confirmed', time: 'Completed', desc: 'Secure checkout completed.', date: fmtDate(confirmedDate), active: true, current: status === 'pending' },
                  { title: 'Processing', time: (status === 'processing' || status === 'shipped' || status === 'delivered') ? 'Completed' : 'Pending', desc: 'Preparing package and dispatch details.', date: fmtDate(processingDate), active: status === 'processing' || status === 'shipped' || status === 'delivered', current: status === 'processing' },
                  { title: 'In Transit', time: (status === 'shipped' || status === 'delivered') ? 'In progress' : 'Pending', desc: 'Parcel on the way to carrier terminal.', date: fmtDate(transitDate), active: status === 'shipped' || status === 'delivered', current: status === 'shipped' },
                  { title: 'Out for Delivery', time: status === 'delivered' ? 'Completed' : 'Pending', desc: 'Local delivery agent assigned.', date: fmtDate(outForDeliveryDate), active: status === 'delivered', current: false },
                  { title: 'Delivered Successfully', time: status === 'delivered' ? 'Arrived' : 'Expected', desc: 'Package dropped off at destination.', date: fmtDate(deliveryDate), active: status === 'delivered', current: status === 'delivered' }
                ];

                return steps.map((step, idx) => (
                  <div key={idx} className="relative space-y-1">
                    <div className={`absolute -left-8 top-1 w-7 h-7 rounded-full flex items-center justify-center border-4 ${step.current ? 'bg-orange-500 border-orange-100 dark:border-orange-950 text-white scale-110 shadow animate-pulse' : step.active ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950 border-slate-100 dark:border-slate-900' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800'}`}>
                      {step.active ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <div className="w-1.5 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full" />
                      )}
                    </div>

                    <h4 className={`font-black text-xs ${step.current ? 'text-orange-500' : 'text-slate-900 dark:text-white'}`}>{step.title}</h4>
                    <span className="text-[9px] text-slate-400 font-bold">{step.time}</span>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">{step.desc}</p>
                    {step.date && (
                      <p className={`text-[10px] font-bold ${step.active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                        📅 {step.active ? '' : 'Expected by '}{step.date}
                      </p>
                    )}
                  </div>
                ));
              })()}
            </div>

            {trackedOrder && ['pending', 'processing', 'shipped'].includes(trackedOrder.status) && (
              <button
                onClick={() => { setCancelModal(trackedOrder); setCancelComment(''); }}
                className="w-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 font-bold text-xs py-3.5 rounded-2xl transition-all border border-rose-200 dark:border-rose-800"
              >
                Cancel Order
              </button>
            )}

            <button
              onClick={() => setCurrentView('home')}
              className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-white font-bold text-xs py-3.5 rounded-2xl transition-all text-center block"
            >
              Continue Shopping
            </button>
          </div>
        )}

        {/* VIEW: USER PROFILE */}
        {currentView === 'profile' && (
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <button onClick={() => window.history.back()} className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
                <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </button>
              <h1 className="text-2xl font-black tracking-tight dark:text-white">My Profile</h1>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4 space-y-4">
                {/* Profile Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-5 flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-rose-500 rounded-full flex items-center justify-center text-white font-black text-xl flex-shrink-0 shadow-md">
                      {(user?.username || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-base dark:text-white truncate">{user?.username}</h3>
                      <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                      {user?.reward_points >= 500 ? (
                        <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-md">
                          <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> Gold Member
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded-md">
                          Member
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Reward Points Card */}
                {user?.reward_points >= 0 && (
                  <button onClick={() => setShowRewardModal(true)} className="w-full bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-4 hover:shadow-md transition-all text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                          <Award className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reward Points</p>
                          <p className="text-lg font-black text-slate-800 dark:text-white">{user.reward_points}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </div>
                    <p className="text-[9px] text-slate-400 mt-2">₹100 spent = 1 pt | Review = 5 pts | Tap for details</p>
                  </button>
                )}

                {/* Referral Wallet Card */}
                {walletData && (
                  <button onClick={() => setShowWalletModal(true)} className="w-full bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-4 hover:shadow-md transition-all text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center">
                          <Gift className="w-5 h-5 text-violet-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Referral Wallet</p>
                          <p className="text-lg font-black text-slate-800 dark:text-white">₹{walletData.balance}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </div>
                    <p className="text-[9px] text-slate-400 mt-2">
                      {walletData.pending > 0 ? `₹${walletData.pending} pending · ` : ''}Refer products you love and earn on every sale
                    </p>
                  </button>
                )}

                {/* Account Info */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-4 space-y-3">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Info</h4>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[9px] text-slate-400 font-bold">Email</p>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{user?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Shield className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold">Role</p>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 capitalize">{user?.user_type || 'Customer'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold">Member Since</p>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '2026'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl overflow-hidden">
                  <button onClick={() => setActiveProfileModal('username')} className="w-full text-left px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition-colors border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5"><Edit className="w-4 h-4 text-slate-400" /><span>Change Username</span></div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                  </button>
                  <button onClick={() => setActiveProfileModal('password')} className="w-full text-left px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition-colors border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5"><Lock className="w-4 h-4 text-slate-400" /><span>Change Password</span></div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                  </button>
                  <button onClick={() => { fetchSupportTickets(); setCurrentView('support'); }} className="w-full text-left px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 flex items-center justify-between transition-colors border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5"><Mail className="w-4 h-4 text-orange-500" /><span>Contact Support</span></div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                  </button>
                  <button onClick={() => { logout(); setWishlist([]); localStorage.removeItem('collabo_wishlist'); setCurrentView('home'); }} className="w-full text-left px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition-colors border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5"><LogOut className="w-4 h-4 text-slate-400" /><span>Sign Out</span></div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                  </button>
                  <button onClick={() => setActiveProfileModal('delete')} className="w-full text-left px-4 py-3 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-2.5"><Trash2 className="w-4 h-4 text-rose-400" /><span>Delete Account</span></div>
                    <ChevronRight className="w-3.5 h-3.5 text-rose-300" />
                  </button>
                </div>
              </div>
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-[32px] space-y-6 shadow-sm">
              <h3 className="font-extrabold text-sm dark:text-white">Recent Purchases</h3>

              <div className="space-y-4">
                {customerOrders.length === 0 ? (
                  <p className="text-xs text-slate-500 font-semibold text-center py-4">No recent purchases found.</p>
                ) : (
                  customerOrders.map((ord, idx) => {
                    const firstItem = ord.items?.[0];
                    const prodName = firstItem ? firstItem.product_details.name : 'Unknown Product';
                    const prodImage = firstItem?.product_details?.image || '';
                    const itemsCount = ord.items?.length || 0;
                    const displayTitle = itemsCount > 1 ? `${prodName} + ${itemsCount - 1} other item${itemsCount > 2 ? 's' : ''}` : prodName;
                    const orderDate = new Date(ord.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                    
                    const getStatusColor = (status) => {
                      switch (status?.toLowerCase()) {
                        case 'delivered': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
                        case 'processing': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
                        case 'shipped': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400';
                        case 'cancelled': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400';
                        default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
                      }
                    };
                    
                    return (
                      <div key={idx} className="p-4 bg-white dark:bg-slate-800/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between border border-slate-200/60 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow gap-4 text-xs">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 flex items-center justify-center overflow-hidden shrink-0">
                            {prodImage ? (
                              <img src={prodImage} alt={prodName} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-6 h-6 text-slate-300" />
                            )}
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Order ID: {ord.order_id}</span>
                            <h4 className="font-extrabold text-slate-800 dark:text-white line-clamp-1">{displayTitle}</h4>
                            <span className="text-[10px] text-slate-500 font-semibold">{orderDate} • <span className="text-slate-700 dark:text-slate-300">₹{Number(ord.final_amount).toLocaleString()}</span></span>
                            {ord.payment_method === 'cod' && (
                              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 uppercase tracking-wider">
                                Cash on Delivery {ord.payment_status === 'pending' ? '• Pay on arrival' : '• Paid'}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 sm:shrink-0 mt-2 sm:mt-0 flex-wrap">
                          <span className={`text-[9px] font-black px-2.5 py-1 rounded-md uppercase ${getStatusColor(ord.status)}`}>
                            {ord.status}
                          </span>
                          <button
                            onClick={() => {
                              setTrackedOrder(ord);
                              setCurrentView('tracking');
                            }}
                            className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm"
                          >
                            Track Order
                          </button>
                          {['pending', 'processing', 'shipped'].includes(ord.status) && (
                            <button
                              onClick={() => { setCancelModal(ord); setCancelComment(''); }}
                              className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
          </div>
        )}

        {/* VIEW: AUTH */}
        {currentView === 'auth' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-8 sm:p-10 rounded-[36px] max-w-md mx-auto space-y-6 shadow-2xl mt-12 sm:mt-16">
            
            <div className="text-center space-y-1 relative">
              <button onClick={() => window.history.back()} className="absolute -left-2 sm:-left-4 top-1 flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
                <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </button>
              <h2 className="text-2xl font-black tracking-tight dark:text-white">
                {authMode === 'login' ? 'Welcome Back' : authMode === 'signup' ? 'Create Account' : 'Verify Security OTP'}
              </h2>
              <p className="text-slate-400 text-xs font-semibold">
                {authMode === 'login' ? 'Access your buyer dashboard credentials' : authMode === 'signup' ? 'Join premium rewards selection' : 'Check security code sent to phone'}
              </p>
            </div>

            {authMode === 'otp' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Security Pin</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="1234" 
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 text-center font-mono font-bold tracking-widest text-sm focus:outline-none dark:text-white"
                    />
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setCurrentView('home');
                  }}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition-colors"
                >
                  Verify Access Pin
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                  <div className="relative">
                    <input 
                      type="email" 
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="name@company.com" 
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-white"
                    />
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                {authMode === 'signup' && (
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={authUsername}
                        onChange={(e) => setAuthUsername(e.target.value)}
                        placeholder="Your name"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-white"
                      />
                      <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                )}

                {authMode === 'signup' && (
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mobile Number</label>
                    <div className="flex">
                      <div className="flex items-center px-3 bg-slate-100 dark:bg-slate-700 border border-r-0 border-slate-200 dark:border-slate-700 rounded-l-xl">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">+91</span>
                      </div>
                      <input
                        type="tel"
                        value={authPhone}
                        onChange={(e) => setAuthPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="10 digit number"
                        className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-r-xl py-2.5 px-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-white"
                        maxLength={10}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                  <div className="relative">
                    <input 
                      type={showAuthPassword ? "text" : "password"} 
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••" 
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-10 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-white"
                    />
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <button 
                      type="button" 
                      onClick={() => setShowAuthPassword(!showAuthPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      {showAuthPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {authMode === 'login' ? (
                  <button 
                    onClick={async () => {
                      if (!authEmail || !authPassword) {
                        showToast("Please enter email and password", 'error');
                        return;
                      }
                      const result = await login(authEmail, authPassword);
                      if (result.success) {
                        setCurrentView(postAuthView || 'home');
                        setPostAuthView('home');
                      } else {
                        showToast(result.error || "Login failed", 'error');
                      }
                    }}
                    className="w-full bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Log In</span>
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      if (!authUsername.trim()) { toast.error('Please enter your name'); return; }
                      if (!authEmail || !authPassword) { toast.error('Please enter email and password'); return; }
                      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authEmail)) { toast.error('Please enter a valid email address'); return; }
                      if (authPhone && authPhone.length !== 10) { toast.error('Mobile number must be exactly 10 digits'); return; }
                      if (authPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
                      localStorage.setItem('collabo_new_user', '1');
                      const result = await register({
                        email: authEmail,
                        username: authUsername.trim(),
                        password: authPassword,
                        password_confirm: authPassword,
                        phone: authPhone ? `+91${authPhone}` : '',
                        user_type: 'buyer',
                        // Prefer a personal "Invite Friends" code; fall back to whatever
                        // product referral link brought this visitor here, so a brand-new
                        // signup via either link type binds to whoever sent it.
                        referred_by_code: signupAffiliateCode || localStorage.getItem('referral_code') || ''
                      });
                      if (result.success) {
                        localStorage.removeItem('signup_affiliate_code');
                        setCurrentView(postAuthView || 'home');
                        setPostAuthView('home');
                      } else {
                        localStorage.removeItem('collabo_new_user');
                        toast.error(result.error || 'Registration failed');
                      }
                    }}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition-colors"
                  >
                    Register
                  </button>
                )}

                <div className="text-center pt-2">
                  {authMode === 'login' ? (
                    <button onClick={() => setAuthMode('signup')} className="text-[10px] text-slate-400 font-bold hover:text-orange-500 hover:underline">
                      Create Member Account
                    </button>
                  ) : (
                    <button onClick={() => setAuthMode('login')} className="text-[10px] text-slate-400 font-bold hover:text-orange-500 hover:underline">
                      Have account? Log In
                    </button>
                  )}
                </div>

              </div>
            )}

          </div>
        )}

        {/* VIEW: SUPPORT TICKETS */}
        {currentView === 'support' && (
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <button onClick={() => window.history.back()} className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
                <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </button>
              <h1 className="text-2xl font-black tracking-tight dark:text-white">Contact Support</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Raise Ticket Form */}
              <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-[28px] space-y-4 shadow-sm">
                <h3 className="font-black text-xs uppercase tracking-wider dark:text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-orange-500" />
                  <span>Raise a Ticket</span>
                </h3>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="font-bold text-[11px] text-slate-400">Subject</label>
                    <input type="text" value={supportSubject} onChange={e => setSupportSubject(e.target.value)} placeholder="Brief summary of your issue" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-[11px] text-slate-400">Category</label>
                      <select value={supportCategory} onChange={e => setSupportCategory(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs font-bold dark:text-white">
                        <option value="technical">Technical</option>
                        <option value="payment">Payment</option>
                        <option value="account">Account</option>
                        <option value="campaign">Campaign</option>
                        <option value="partnership">Partnership</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-[11px] text-slate-400">Priority</label>
                      <select value={supportPriority} onChange={e => setSupportPriority(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs font-bold dark:text-white">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-[11px] text-slate-400">Message</label>
                    <textarea value={supportMessage} onChange={e => setSupportMessage(e.target.value)} rows={5} placeholder="Describe your issue in detail..." className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-white resize-none" />
                  </div>
                  <button onClick={submitSupportTicket} disabled={supportSubmitting} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black text-xs py-3 rounded-xl transition-colors disabled:opacity-50">
                    {supportSubmitting ? 'Submitting...' : 'Submit Ticket'}
                  </button>
                </div>
              </div>

              {/* My Tickets */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-[28px] space-y-4 shadow-sm">
                <h3 className="font-black text-xs uppercase tracking-wider dark:text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-orange-500" />
                  <span>My Tickets</span>
                </h3>
                {supportTickets.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">No tickets yet. Submit a ticket and we'll get back to you.</p>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {supportTickets.map(ticket => (
                      <div key={ticket.id} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{ticket.ticket_number}</span>
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${ticket.status === 'open' ? 'bg-blue-100 text-blue-700' : ticket.status === 'in_progress' ? 'bg-amber-100 text-amber-700' : ticket.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{ticket.status}</span>
                        </div>
                        <h4 className="text-xs font-bold dark:text-white">{ticket.subject}</h4>
                        <p className="text-[10px] text-slate-500 line-clamp-2">{ticket.message}</p>
                        <div className="flex items-center gap-3 text-[9px] text-slate-400">
                          <span className="capitalize">{ticket.category}</span>
                          <span>•</span>
                          <span className={`font-bold ${ticket.priority === 'high' ? 'text-red-500' : ticket.priority === 'medium' ? 'text-amber-500' : 'text-slate-400'}`}>{ticket.priority} priority</span>
                          <span>•</span>
                          <span>{new Date(ticket.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        {ticket.admin_reply && (
                          <div className="mt-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">Admin Reply</span>
                            <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-1">{ticket.admin_reply}</p>
                          </div>
                        )}
                        {(ticket.status === 'open' || ticket.status === 'in_progress') && (
                          <button
                            onClick={() => setConfirmModal({
                              title: 'Cancel Ticket',
                              message: `Are you sure you want to cancel ticket ${ticket.ticket_number}? This action cannot be undone.`,
                              confirmText: 'Yes, Cancel Ticket',
                              confirmColor: 'bg-rose-500 hover:bg-rose-600',
                              onConfirm: async () => {
                                try {
                                  await api.patch(`/support/tickets/${ticket.id}/`, { status: 'closed' });
                                  fetchSupportTickets();
                                  toast.success('Ticket cancelled');
                                } catch (err) { toast.error('Failed to cancel ticket'); }
                                setConfirmModal(null);
                              }
                            })}
                            className="text-[10px] font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 self-start"
                          >
                            <X className="w-3 h-3" /> Cancel Ticket
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW: SELLER PORTAL */}
        {currentView === 'dashboard' && (
          <div className="space-y-3">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-1 px-4 sm:py-1.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm">
              <div className="flex items-center gap-3">
                {!inlineMode && (
                  <button onClick={() => window.history.back()} className="flex shrink-0 items-center justify-center w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
                    <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                  </button>
                )}
                <div>
                  <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Collabo Store Portal</h1>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                {inlineMode && onBackToSelect && (
                  <button 
                    onClick={onBackToSelect}
                    className="text-[11px] font-medium text-slate-650 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
                  >
                    <span>← Back to Portals</span>
                  </button>
                )}
                <div className="bg-slate-950 dark:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 shadow-sm">
                  <Shield className="w-3.5 h-3.5 text-orange-500" /> Store Admin
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <nav className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1.5 sticky top-0 z-10 shadow-sm">
              <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar">
                {[
                  { id: 'overview', label: 'Metrics', icon: BarChart3 },
                  { id: 'products', label: 'Inventories', icon: Package },
                  { id: 'orders', label: 'Orders', icon: ShoppingBag },
                  ...(user?.is_staff || user?.user_type === 'admin' ? [
                    { id: 'categories', label: 'Categories', icon: Tag },
                    { id: 'brands', label: 'Brands', icon: Award },
                    { id: 'store-settings', label: 'Store Settings', icon: Settings },
                    { id: 'wallets', label: 'Referral Wallets', icon: Gift },
                    { id: 'tickets', label: 'Tickets', icon: Mail },
                    { id: 'broadcast', label: 'Broadcast', icon: Sparkles }
                  ] : [])
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = adminView === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        if (tab.id === 'store-settings') {
                          if (!editSettings) setEditSettings(storeSettings);
                        } else if (tab.id === 'tickets') {
                          fetchSupportTickets();
                        }
                        setAdminView(tab.id);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap ${
                        isActive
                          ? 'bg-slate-950 text-white dark:bg-slate-800 dark:text-white shadow-sm'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* OVERVIEW METRICS */}
            {adminView === 'overview' && (
              <div className="space-y-6">
                
                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { title: 'Revenue Earned', value: `₹${sellerRevenue.toLocaleString()}`, change: 'Real-time sales revenue', icon: TrendingUp, color: 'text-orange-500' },
                    { title: 'Merchant Orders', value: sellerOrders.length.toString(), change: 'Total orders received', icon: Package, color: 'text-indigo-500' },
                    { title: 'Active Listings', value: sellerProducts.length.toString(), change: 'Products in catalog', icon: Users, color: 'text-cyan-500' },
                    { title: 'Low Inventory Alert', value: `${lowStockCount} items warning`, change: lowStockCount > 0 ? 'Requires attention' : 'All items well stocked', icon: Info, color: 'text-rose-500' }
                  ].map((stat, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl space-y-2.5 shadow-sm hover:shadow-md transition-all">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{stat.title}</span>
                        <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                      </div>
                      <div className="space-y-0.5">
                        <h3 className="text-lg font-bold dark:text-white">{stat.value}</h3>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{stat.change}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sales Chart using orange/coral themes */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-xl space-y-4 shadow-sm">
                  <h3 className="font-semibold text-xs dark:text-white flex items-center gap-1.5 uppercase tracking-wider text-slate-450">
                    <BarChart3 className="w-4 h-4 text-orange-500" />
                    <span>Monthly Revenue Statistics (Last 6 Months)</span>
                  </h3>
                  
                  <div className="w-full aspect-[4/1] bg-[#FFFDF9] dark:bg-slate-850 rounded-xl p-4 flex items-end justify-between gap-3 border border-orange-200/10">
                    {monthlyRevenueData.map((bar, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                        <div 
                          className="w-full bg-gradient-to-t from-orange-500 to-amber-500 rounded-t-lg transition-all duration-1000"
                          style={{ height: `${bar.val}%` }}
                          title={`₹${bar.revenue.toLocaleString()}`}
                        />
                        <span className="text-[9px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest">{bar.month}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* INVENTORY */}
            {adminView === 'products' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Add/Edit product Form */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-3xl space-y-4 shadow-sm">
                  <h3 className="font-black text-xs uppercase tracking-wider dark:text-white flex items-center gap-2">
                    <PlusCircle className="w-4 h-4 text-orange-500" />
                    <span>{editingProduct ? 'Edit Catalog Entry' : 'New Catalog Entry'}</span>
                    {editingProduct && <span className="text-[10px] font-black text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-lg">#{[...sellerProducts].sort((a, b) => a.id - b.id).findIndex(p => p.id === editingProduct.id) + 1}</span>}
                  </h3>
                  
                  <div className="space-y-3.5 text-xs max-h-[600px] overflow-y-auto pr-1">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-450 dark:text-slate-400">Item Name</label>
                      <input 
                        type="text" 
                        value={editingProduct ? editProdName : newProdName}
                        onChange={(e) => editingProduct ? setEditProdName(e.target.value) : setNewProdName(e.target.value)}
                        placeholder="e.g. AuraPure Humidifier 2" 
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none dark:text-white font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-450 dark:text-slate-400">Brand (Optional)</label>
                        <input
                          type="text"
                          value={editingProduct ? editProdBrand : newProdBrand}
                          onChange={(e) => editingProduct ? setEditProdBrand(e.target.value) : setNewProdBrand(e.target.value)}
                          placeholder="e.g. Samsung, Nike (optional)"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none dark:text-white font-bold text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-450 dark:text-slate-400">Category Selection</label>
                        <select 
                          value={editingProduct ? editProdCategory : newProdCategory}
                          onChange={(e) => editingProduct ? setEditProdCategory(e.target.value) : setNewProdCategory(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none dark:text-white font-bold text-xs"
                        >
                          {dynamicCategories.slice(1).map((cat, idx) => (
                            <option key={idx} value={cat.name}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-450 dark:text-slate-400">Retail Price (INR)</label>
                        <input 
                          type="number" 
                          value={editingProduct ? editProdPrice : newProdPrice}
                          onChange={(e) => editingProduct ? setEditProdPrice(e.target.value) : setNewProdPrice(e.target.value)}
                          placeholder="4999" 
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none dark:text-white font-bold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-450 dark:text-slate-400">Discount Price (INR)</label>
                        <input 
                          type="number" 
                          value={editingProduct ? editProdDiscountPrice : newProdDiscountPrice}
                          onChange={(e) => editingProduct ? setEditProdDiscountPrice(e.target.value) : setNewProdDiscountPrice(e.target.value)}
                          placeholder="3999" 
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none dark:text-white font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-450 dark:text-slate-400">Rating (0-5)</label>
                        <input 
                          type="number" 
                          step="0.1" 
                          value={editingProduct ? editProdRating : newProdRating}
                          onChange={(e) => editingProduct ? setEditProdRating(e.target.value) : setNewProdRating(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none dark:text-white font-bold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-450 dark:text-slate-400">Stock</label>
                        <input
                          type="number"
                          value={editingProduct ? editProdStock : newProdStock}
                          onChange={(e) => editingProduct ? setEditProdStock(e.target.value) : setNewProdStock(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none dark:text-white font-bold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-450 dark:text-slate-400">Shipping Charge (₹)</label>
                        <input
                          type="number"
                          value={editingProduct ? editProdShippingCharge : newProdShippingCharge}
                          onChange={(e) => editingProduct ? setEditProdShippingCharge(e.target.value) : setNewProdShippingCharge(e.target.value)}
                          placeholder="0 for free shipping"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none dark:text-white font-bold"
                        />
                        <p className="text-[9px] text-slate-400">Free shipping on orders above ₹{storeSettings.free_shipping_threshold ?? 500}</p>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-450 dark:text-slate-400">Link Discount %</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={editingProduct ? editProdLinkDiscount : newProdLinkDiscount}
                          onChange={(e) => editingProduct ? setEditProdLinkDiscount(e.target.value) : setNewProdLinkDiscount(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none dark:text-white font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="font-bold text-slate-450 dark:text-slate-400">Main Image URL</label>
                        <span className="text-[10px] text-slate-400 font-bold">Or upload file</span>
                      </div>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={editingProduct ? editProdImage : newProdImage}
                          onChange={(e) => editingProduct ? setEditProdImage(e.target.value) : setNewProdImage(e.target.value)}
                          placeholder="Image URL"
                          className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none dark:text-white font-bold text-xs"
                        />
                        <label className="cursor-pointer bg-slate-950 hover:bg-slate-900 text-white font-black text-xs px-4 rounded-xl flex items-center justify-center transition-colors">
                          <span>Browse</span>
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  if (editingProduct) {
                                    setEditProdImage(reader.result);
                                  } else {
                                    setNewProdImage(reader.result);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="hidden" 
                          />
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="font-bold text-slate-450 dark:text-slate-400">Sub Images</label>
                        <span className="text-[10px] text-slate-400 font-bold">{(editingProduct ? editProdImages : newProdImages).length} added</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(editingProduct ? editProdImages : newProdImages).map((img, i) => (
                          <div key={i} className="relative group">
                            <img src={img} alt={`Sub ${i+1}`} className="w-14 h-14 rounded-lg object-cover border border-slate-200 dark:border-slate-700" />
                            <button
                              type="button"
                              onClick={() => {
                                if (editingProduct) {
                                  setEditProdImages(prev => prev.filter((_, idx) => idx !== i));
                                } else {
                                  setNewProdImages(prev => prev.filter((_, idx) => idx !== i));
                                }
                              }}
                              className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}
                        <label className="w-14 h-14 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center cursor-pointer hover:border-orange-400 transition-colors">
                          <Plus className="w-5 h-5 text-slate-400" />
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => {
                              const files = Array.from(e.target.files);
                              files.forEach(file => {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  if (editingProduct) {
                                    setEditProdImages(prev => [...prev, reader.result]);
                                  } else {
                                    setNewProdImages(prev => [...prev, reader.result]);
                                  }
                                };
                                reader.readAsDataURL(file);
                              });
                              e.target.value = '';
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <input
                        type="text"
                        placeholder="Or paste image URL and press Enter"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.target.value.trim()) {
                            e.preventDefault();
                            const url = e.target.value.trim();
                            if (editingProduct) {
                              setEditProdImages(prev => [...prev, url]);
                            } else {
                              setNewProdImages(prev => [...prev, url]);
                            }
                            e.target.value = '';
                          }
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none dark:text-white font-bold text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="font-bold text-slate-450 dark:text-slate-400">Delivery Information</label>
                        <span className="text-[10px] text-slate-400 font-bold">Or pick a delivery date</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input 
                          type="text" 
                          value={editingProduct ? editProdDelivery : newProdDelivery}
                          onChange={(e) => editingProduct ? setEditProdDelivery(e.target.value) : setNewProdDelivery(e.target.value)}
                          placeholder="e.g. Free delivery by Tomorrow"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none dark:text-white font-bold"
                        />
                        <input 
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          onChange={(e) => {
                            const dateVal = e.target.value;
                            if (dateVal) {
                              const d = new Date(dateVal);
                              const options = { weekday: 'long', month: 'short', day: 'numeric' };
                              const formatted = `Delivery by ${d.toLocaleDateString('en-US', options)}`;
                              if (editingProduct) {
                                setEditProdDelivery(formatted);
                              } else {
                                setNewProdDelivery(formatted);
                              }
                            }
                          }}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none dark:text-white font-bold text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-450 dark:text-slate-400">Commission Rate (%)</label>
                      <input 
                        type="number" 
                        min="0"
                        max="100"
                        value={editingProduct ? editProdCommissionRate : newProdCommissionRate}
                        onChange={(e) => editingProduct ? setEditProdCommissionRate(e.target.value) : setNewProdCommissionRate(e.target.value)}
                        placeholder="e.g. 10" 
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none dark:text-white font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-450 dark:text-slate-400">Product Description</label>
                      <textarea 
                        rows="3"
                        value={editingProduct ? editProdDescription : newProdDescription}
                        onChange={(e) => editingProduct ? setEditProdDescription(e.target.value) : setNewProdDescription(e.target.value)}
                        placeholder="Write detailed specifications or features..."
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none dark:text-white font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-450 dark:text-slate-400">Seller Info & Policy</label>
                      <input 
                        type="text" 
                        value={editingProduct ? editProdSellerInfo : newProdSellerInfo}
                        onChange={(e) => editingProduct ? setEditProdSellerInfo(e.target.value) : setNewProdSellerInfo(e.target.value)}
                        placeholder="e.g. Sold by Appario Retail (4.8 ★). 7 Days Replacement Policy."
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none dark:text-white font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-450 dark:text-slate-400">Highlights (One per line)</label>
                        <textarea 
                          rows="3"
                          value={editingProduct ? editProdHighlights : newProdHighlights}
                          onChange={(e) => editingProduct ? setEditProdHighlights(e.target.value) : setNewProdHighlights(e.target.value)}
                          placeholder="8GB RAM&#10;5000mAh Battery"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none dark:text-white font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-slate-450 dark:text-slate-400">Offers (One per line)</label>
                        <textarea 
                          rows="3"
                          value={editingProduct ? editProdOffers : newProdOffers}
                          onChange={(e) => editingProduct ? setEditProdOffers(e.target.value) : setNewProdOffers(e.target.value)}
                          placeholder="Bank Offer: 5% Cashback&#10;Special Price: Extra ₹500 off"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none dark:text-white font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-450 dark:text-slate-400">Specifications (JSON or Key:Value per line)</label>
                      <textarea 
                        rows="3"
                        value={editingProduct ? editProdSpecifications : newProdSpecifications}
                        onChange={(e) => editingProduct ? setEditProdSpecifications(e.target.value) : setNewProdSpecifications(e.target.value)}
                        placeholder='{"Brand": "Apple", "Color": "Red"} OR&#10;Brand: Apple&#10;Color: Red'
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none dark:text-white font-bold text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-450 dark:text-slate-400">Q&A Section (JSON array of {"{q, a}"})</label>
                      <textarea 
                        rows="3"
                        value={editingProduct ? editProdQaSection : newProdQaSection}
                        onChange={(e) => editingProduct ? setEditProdQaSection(e.target.value) : setNewProdQaSection(e.target.value)}
                        placeholder='[{"q": "Is this original?", "a": "Yes"}]'
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none dark:text-white font-bold text-xs font-mono"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button 
                        onClick={async () => {
                          const nameVal = editingProduct ? editProdName : newProdName;
                          const priceVal = editingProduct ? editProdPrice : newProdPrice;
                          
                          if (nameVal.trim() && priceVal) {
                            try {
                              const parseSpecs = (val) => {
                                if (!val) return [];
                                if (typeof val !== 'string') return val;
                                try { 
                                  const parsed = JSON.parse(val); 
                                  if (Array.isArray(parsed)) return parsed;
                                  return Object.entries(parsed).map(([name, value]) => ({name, value}));
                                } catch {
                                  return val.split('\n').filter(s => s.includes(':')).map(s => {
                                    const [k, ...v] = s.split(':');
                                    return { name: k.trim(), value: v.join(':').trim() };
                                  });
                                }
                              };
                              const parseQa = (val) => {
                                if (!val) return [];
                                if (typeof val !== 'string') return val;
                                try { return JSON.parse(val); } catch { return []; }
                              };

                              if (editingProduct) {
                                // Update Product Details
                                await api.patch(`/ecommerce/products/${editingProduct.id}/`, {
                                  name: editProdName,
                                  category: editProdCategory,
                                  brand: editProdBrand,
                                  price: Number(editProdPrice),
                                  discount_price: editProdDiscountPrice ? Number(editProdDiscountPrice) : Number(editProdPrice),
                                  rating: Number(editProdRating),
                                  reviews_count: Number(editProdReviewsCount),
                                  description: editProdDescription,
                                  image: editProdImage,
                                  images: editProdImages,
                                  stock: Number(editProdStock),
                                  product_shipping_charge: Number(editProdShippingCharge) || 0,
                                  delivery: editProdDelivery,
                                  commission_rate: Number(editProdCommissionRate),
                                  link_discount_percent: Number(editProdLinkDiscount),
                                  seller_info: editProdSellerInfo,
                                  highlights: editProdHighlights.split('\n').filter(s=>s.trim()),
                                  offers: editProdOffers.split('\n').filter(s=>s.trim()),
                                  specifications: parseSpecs(editProdSpecifications),
                                  qa_section: parseQa(editProdQaSection)
                                });
                                setEditingProduct(null);
                              } else {
                                // Add Product Details
                                await api.post('/ecommerce/products/', {
                                  name: newProdName,
                                  category: newProdCategory,
                                  brand: newProdBrand,
                                  price: Number(newProdPrice),
                                  discount_price: newProdDiscountPrice ? Number(newProdDiscountPrice) : Number(newProdPrice),
                                  rating: Number(newProdRating),
                                  reviews_count: Number(newProdReviewsCount),
                                  description: newProdDescription || `Premium listed product: ${newProdName}`,
                                  image: newProdImage || '',
                                  images: newProdImages,
                                  stock: Number(newProdStock),
                                  product_shipping_charge: Number(newProdShippingCharge) || 0,
                                  delivery: newProdDelivery || 'Free delivery by Tomorrow',
                                  commission_rate: Number(newProdCommissionRate),
                                  link_discount_percent: Number(newProdLinkDiscount),
                                  seller_info: newProdSellerInfo,
                                  highlights: newProdHighlights.split('\n').filter(s=>s.trim()),
                                  offers: newProdOffers.split('\n').filter(s=>s.trim()),
                                  specifications: parseSpecs(newProdSpecifications),
                                  qa_section: parseQa(newProdQaSection)
                                });
                                // Clear Add Product form
                                setNewProdName('');
                                setNewProdPrice('');
                                setNewProdDiscountPrice('');
                                setNewProdDescription('');
                                setNewProdStock('10');
                                setNewProdRating('4.5');
                                setNewProdReviewsCount('10');
                                setNewProdCommissionRate('10');
                                setNewProdLinkDiscount('0');
                                setNewProdSellerInfo('');
                                setNewProdHighlights('');
                                setNewProdOffers('');
                                setNewProdSpecifications('');
                                setNewProdQaSection('');
                                setNewProdImages([]);
                              }
                              fetchSellerProducts();
                              fetchProducts();
                            } catch (err) {
                                console.error("Error saving product:", err);
                                let errorMsg = "Failed to save product details";
                                if (err.response && err.response.data) {
                                  errorMsg = typeof err.response.data === 'object'
                                    ? JSON.stringify(err.response.data)
                                    : err.response.data;
                                }
                                showToast(errorMsg);
                            }
                          }
                        }}
                        className="flex-1 bg-slate-950 hover:bg-slate-900 text-white font-black text-xs py-3 rounded-xl transition-colors"
                      >
                        {editingProduct ? 'Update Listing' : 'Publish Listing'}
                      </button>
                      
                      {editingProduct && (
                        <button 
                          onClick={() => setEditingProduct(null)}
                          className="px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-black text-xs py-3 rounded-xl transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Products list */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-3xl space-y-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-extrabold text-sm dark:text-white">Active Catalog Listing</h3>
                    <div className="relative flex-1 max-w-xs">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      {/* eslint-disable-next-line no-undef */}
                      <input
                        type="text"
                        placeholder="Search products..."
                        value={catalogSearch || ''} // eslint-disable-line no-undef
                        onChange={(e) => setCatalogSearch(e.target.value)} // eslint-disable-line no-undef
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-1.5 pl-8 pr-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                    {sellerProducts.length === 0 ? (
                      <p className="text-xs text-slate-500 font-semibold text-center py-4">No active products found.</p>
                    ) : (
                      [...sellerProducts].sort((a, b) => a.id - b.id).filter(p => !catalogSearch || p.name?.toLowerCase().includes(catalogSearch.toLowerCase()) || p.category?.toLowerCase().includes(catalogSearch.toLowerCase()) || String(p.id).includes(catalogSearch)).map((p, idx) => ( // eslint-disable-line no-undef
                        <div key={idx} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-slate-700/50 text-xs">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 w-12 text-center shrink-0">ID: {p.id}</span>
                            <div
                              className="w-10 h-10 bg-slate-200 rounded-xl overflow-hidden shrink-0 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-orange-400 transition-all"
                              onClick={() => setLightboxImage(p.image)}
                            >
                              <img src={p.image} className="max-h-full object-cover" alt="prod" />
                            </div>
                            <div className="space-y-0.5 font-bold flex-1 min-w-0">
                              <h4 
                                onClick={() => handleEditProduct(p)}
                                className="font-extrabold text-slate-800 dark:text-white line-clamp-1 text-xs hover:text-orange-500 cursor-pointer transition-colors"
                              >
                                {p.name}
                              </h4>
                              <span className="text-[10px] text-slate-400 font-semibold">{p.brand} • {p.category} • stock: {p.stock}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-850 dark:text-slate-200 mr-2">₹{p.discountPrice.toLocaleString()}</span>
                            
                            <button
                              onClick={() => openMediaUpload(p)}
                              className="p-1.5 text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950/20 rounded-lg border border-violet-100 dark:border-violet-900/30"
                              title="Upload Media for Influencers"
                            >
                              <Film className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleEditProduct(p)}
                              className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900/30"
                              title="Edit Product"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button 
                              onClick={async () => {
                                if (window.confirm("Are you sure you want to delete this listing?")) {
                                  try {
                                    await api.delete(`/ecommerce/products/${p.id}/`);
                                    fetchSellerProducts();
                                    fetchProducts();
                                  } catch (err) {
                                    console.error("Error deleting product:", err);
                                    showToast("Failed to delete product", 'error');
                                  }
                                }
                              }}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg border border-rose-100 dark:border-rose-900/30"
                              title="Delete Product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* ORDERS MANAGEMENT */}
            {adminView === 'orders' && (
              <div className="space-y-6">
                <h3 className="font-extrabold text-sm dark:text-white">Customer Orders Management</h3>
                
                <div className="space-y-4">
                  {sellerOrders.filter(ord => {
                    const isAdmin = user?.is_staff || user?.user_type === 'admin';
                    const myItems = (ord.items || []).filter(item => isAdmin || item.product_details?.seller === user?.id);
                    return myItems.length > 0;
                  }).length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-12 rounded-[32px] text-center max-w-sm mx-auto space-y-4 shadow-sm">
                      <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
                        <Package className="w-6 h-6" />
                      </div>
                      <h3 className="font-extrabold text-base dark:text-white">No Orders Received</h3>
                      <p className="text-slate-500 text-xs font-medium leading-relaxed">
                        When clients purchase your products, they will appear here.
                      </p>
                    </div>
                  ) : (
                    sellerOrders.map((ord, idx) => {
                      const isAdmin = user?.is_staff || user?.user_type === 'admin';
                      const myItems = (ord.items || []).filter(item => isAdmin || item.product_details?.seller === user?.id);
                      const sellerSubtotal = myItems.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
                      const orderDate = new Date(ord.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      if (myItems.length === 0) return null;

                      return (
                        <div 
                          key={idx} 
                          className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-[28px] shadow-sm hover:shadow-md transition-all space-y-4"
                        >
                          {/* Order Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID: {ord.order_id}</span>
                                <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                                  ord.status === 'delivered' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500' :
                                  ord.status === 'shipped' ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-500' :
                                  ord.status === 'cancelled' ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-500' :
                                  'bg-orange-50 dark:bg-orange-950/20 text-orange-500'
                                }`}>
                                  {ord.status}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 font-semibold">{orderDate} • Customer: <span className="text-slate-800 dark:text-slate-200 font-extrabold">{ord.address_details?.name || ord.user_username}</span></p>
                              {ord.payment_method === 'cod' && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 uppercase tracking-wider mt-0.5">
                                  💵 COD — Collect Cash on Delivery
                                </span>
                              )}
                            </div>
                            <div className="text-left sm:text-right">
                              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Seller Payout</span>
                              <span className="font-black text-sm text-slate-900 dark:text-white">₹{sellerSubtotal.toLocaleString()}</span>
                              {Number(ord.discount_amount) > 0 && (
                                <p className="text-[9px] text-emerald-500 font-bold mt-0.5">
                                  Buyer paid ₹{Number(ord.final_amount).toLocaleString()} (₹{Number(ord.discount_amount).toLocaleString()} referral/coupon discount)
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Order Items */}
                          <div className="space-y-3">
                            {myItems.map((item, itemIdx) => (
                              <div key={itemIdx} className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden shrink-0 flex items-center justify-center border border-slate-100 dark:border-slate-700/50">
                                  <img src={item.product_details?.image} className="max-h-full object-cover" alt="item" />
                                </div>
                                <div className="space-y-0.5 font-bold">
                                  <h4 className="font-extrabold text-slate-800 dark:text-white line-clamp-1 text-xs">{item.product_details?.name}</h4>
                                  <span className="text-[10px] text-slate-400 font-semibold">Qty: {item.quantity} • Unit Price: ₹{Number(item.price).toLocaleString()}</span>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Shipping Details */}
                          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/30 text-xs font-semibold text-slate-600 dark:text-slate-350 space-y-1">
                            <h5 className="font-black text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-extrabold">
                              <MapPin className="w-3.5 h-3.5 text-orange-500" />
                              <span>Shipping Destination</span>
                            </h5>
                            <p className="font-bold dark:text-white">{ord.address_details?.name} ({ord.address_details?.phone})</p>
                            <p>{ord.address_details?.street_address}</p>
                            <p>{ord.address_details?.city}{ord.address_details?.district ? `, ${ord.address_details.district}` : ''}, {ord.address_details?.state} - {ord.address_details?.postal_code}</p>
                          </div>

                          {/* Cancellation Details — shown to seller/admin when order is cancelled */}
                          {ord.status === 'cancelled' && ord.cancel_reason && (
                            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/50 rounded-2xl p-4 space-y-2">
                              <h5 className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
                                <span>🚫</span> Cancellation Details
                              </h5>
                              <div className="space-y-1.5 text-xs">
                                <div className="flex items-start gap-2">
                                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide shrink-0 pt-0.5">Reason:</span>
                                  <span className="font-bold text-slate-800 dark:text-white">{ord.cancel_reason}</span>
                                </div>
                                {ord.cancel_comment && ord.cancel_comment !== ord.cancel_reason && (
                                  <div className="flex items-start gap-2">
                                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide shrink-0 pt-0.5">Details:</span>
                                    <span className="font-semibold text-slate-600 dark:text-slate-300">{ord.cancel_comment}</span>
                                  </div>
                                )}
                                {ord.cancelled_at && (
                                  <div className="flex items-start gap-2">
                                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide shrink-0 pt-0.5">Cancelled at:</span>
                                    <span className="font-semibold text-slate-600 dark:text-slate-300">{new Date(ord.cancelled_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                )}
                                {Array.isArray(ord.cancel_attachments) && ord.cancel_attachments.length > 0 && (
                                  <div className="space-y-1 pt-1">
                                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide">Attachments ({ord.cancel_attachments.length}):</span>
                                    <div className="flex flex-wrap gap-2 pt-1">
                                      {ord.cancel_attachments.map((url, ai) => {
                                        const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
                                        const isVideo = typeof url === 'string' && (url.endsWith('.mp4') || url.endsWith('.mov') || url.endsWith('.webm'));
                                        return (
                                          <a key={ai} href={fullUrl} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800/50 rounded-xl px-3 py-1.5 text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
                                            {isVideo ? '🎥' : '🖼️'} View {isVideo ? 'Video' : 'Image'} {ai + 1}
                                          </a>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Status Management Actions */}
                          <div className="space-y-3 pt-2">
                            <div className="flex flex-wrap items-center gap-3">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-450 font-black uppercase tracking-wider">Update Status:</span>
                                <select
                                  value={ord.status}
                                  onChange={(e) => updateOrderStatus(ord.id, e.target.value)}
                                  className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl py-1.5 px-3 text-xs font-bold text-slate-750 dark:text-white focus:outline-none"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="processing">Processing</option>
                                  <option value="shipped">Shipped</option>
                                  <option value="delivered">Delivered</option>
                                  <option value="cancelled">Cancelled</option>
                                  <option value="returned">Returned</option>
                                  <option value="refunded">Refunded</option>
                                </select>
                              </div>

                              <div className="flex items-center gap-2">
                                {ord.status === 'processing' && (
                                  <button
                                    onClick={() => {
                                      const tracking = prompt('Enter tracking number (optional):');
                                      const provider = prompt('Enter shipping provider (e.g. Delhivery, BlueDart, Shiprocket):');
                                      updateOrderStatus(ord.id, 'shipped', tracking || '', provider || '');
                                    }}
                                    className="bg-blue-500 hover:bg-blue-600 text-white font-extrabold text-[10px] uppercase tracking-wider px-4 py-2 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                                  >
                                    <Truck className="w-3.5 h-3.5" /> Mark as Shipped
                                  </button>
                                )}
                                {ord.status === 'shipped' && (
                                  <button
                                    onClick={() => updateOrderStatus(ord.id, 'delivered')}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-[10px] uppercase tracking-wider px-4 py-2 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Mark as Delivered
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Tracking info display */}
                            {(ord.tracking_number || ord.shipping_provider) && (
                              <div className="flex items-center gap-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-2">
                                <Truck className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                <div className="text-xs">
                                  {ord.shipping_provider && <span className="font-black text-blue-700 dark:text-blue-300">{ord.shipping_provider}</span>}
                                  {ord.tracking_number && <span className="ml-2 font-semibold text-slate-600 dark:text-slate-400">Tracking: {ord.tracking_number}</span>}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* CATEGORIES MANAGEMENT */}
            {adminView === 'categories' && (user?.is_staff || user?.user_type === 'admin') && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
                {/* Add category */}
                <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-3xl space-y-4 shadow-sm">
                  <h3 className="font-black text-xs uppercase tracking-wider dark:text-white flex items-center gap-2">
                    <PlusCircle className="w-4 h-4 text-orange-500" />
                    <span>Create Category</span>
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-450 dark:text-slate-400">Category Name</label>
                      <input 
                        type="text" 
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="e.g. Health & Fitness" 
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none dark:text-white font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-450 dark:text-slate-400">Icon / Emoji</label>
                      <input 
                        type="text" 
                        value={newCatIcon}
                        onChange={(e) => setNewCatIcon(e.target.value)}
                        placeholder="e.g. 🧘" 
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none dark:text-white font-bold"
                      />
                    </div>
                    <button 
                      onClick={async () => {
                        if (newCatName.trim()) {
                          try {
                            await api.post('/ecommerce/categories/', {
                              name: newCatName,
                              icon: newCatIcon
                            });
                            setNewCatName('');
                            setNewCatIcon('📦');
                            fetchCategoriesAndBrands();
                          } catch (err) {
                            console.error("Error creating category:", err);
                            showToast("Failed to add category", 'error');
                          }
                        }
                      }}
                      className="w-full bg-slate-950 hover:bg-slate-900 text-white font-black text-xs py-3 rounded-xl transition-colors mt-2"
                    >
                      Save Category
                    </button>
                  </div>
                </div>

                {/* Categories List */}
                <div className="lg:col-span-8 bg-white dark:bg-slate-905 border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-3xl space-y-4 shadow-sm">
                  <h3 className="font-extrabold text-sm dark:text-white">Active Product Categories</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-1">
                    {categoriesList.length === 0 ? (
                      <p className="text-xs text-slate-500 font-semibold text-center col-span-2 py-4">No categories found.</p>
                    ) : (
                      categoriesList.map((cat, idx) => (
                        <div key={idx} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-slate-700/50 text-xs">
                          <div className="flex items-center gap-3 font-bold">
                            <span className="text-2xl">{cat.icon}</span>
                            <span className="dark:text-white">{cat.name}</span>
                          </div>
                          <button 
                            onClick={async () => {
                              if (window.confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
                                try {
                                  await api.delete(`/ecommerce/categories/${cat.id}/`);
                                  fetchCategoriesAndBrands();
                                } catch (err) {
                                  console.error("Error deleting category:", err);
                                  showToast("Failed to delete category", 'error');
                                }
                              }
                            }}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg border border-rose-100 dark:border-rose-900/30"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* BRANDS MANAGEMENT */}
            {adminView === 'brands' && (user?.is_staff || user?.user_type === 'admin') && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
                {/* Add brand */}
                <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-3xl space-y-4 shadow-sm">
                  <h3 className="font-black text-xs uppercase tracking-wider dark:text-white flex items-center gap-2">
                    <PlusCircle className="w-4 h-4 text-orange-500" />
                    <span>Create Brand</span>
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-450 dark:text-slate-400">Brand Name</label>
                      <input 
                        type="text" 
                        value={newBrandName}
                        onChange={(e) => setNewBrandName(e.target.value)}
                        placeholder="e.g. ZenFit" 
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none dark:text-white font-bold"
                      />
                    </div>
                    <button 
                      onClick={async () => {
                        if (newBrandName.trim()) {
                          try {
                            await api.post('/ecommerce/brands/', {
                              name: newBrandName
                            });
                            setNewBrandName('');
                            fetchCategoriesAndBrands();
                          } catch (err) {
                            console.error("Error creating brand:", err);
                            showToast("Failed to add brand", 'error');
                          }
                        }
                      }}
                      className="w-full bg-slate-950 hover:bg-slate-900 text-white font-black text-xs py-3 rounded-xl transition-colors mt-2"
                    >
                      Save Brand
                    </button>
                  </div>
                </div>

                {/* Brands List */}
                <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-3xl space-y-4 shadow-sm">
                  <h3 className="font-extrabold text-sm dark:text-white">Active Product Brands</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-1">
                    {brandsList.length === 0 ? (
                      <p className="text-xs text-slate-500 font-semibold text-center col-span-3 py-4">No brands found.</p>
                    ) : (
                      brandsList.map((brand, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-slate-700/50 text-xs">
                          <span className="font-bold dark:text-white">{brand.name}</span>
                          <button 
                            onClick={async () => {
                              if (window.confirm(`Are you sure you want to delete brand "${brand.name}"?`)) {
                                try {
                                  await api.delete(`/ecommerce/brands/${brand.id}/`);
                                  fetchCategoriesAndBrands();
                                  toast.success(`Brand "${brand.name}" deleted`);
                                } catch (err) {
                                  console.error("Error deleting brand:", err);
                                  toast.error(err.response?.data?.detail || err.response?.data?.error || "Failed to delete brand");
                                }
                              }
                            }}
                            className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg border border-rose-100 dark:border-rose-900/30"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STORE SETTINGS MANAGEMENT */}
            {adminView === 'store-settings' && (user?.is_staff || user?.user_type === 'admin') && editSettings && (
              <div className="space-y-8 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-lg dark:text-white flex items-center gap-2">
                      <Settings className="w-5 h-5 text-orange-500" />
                      Store Settings
                    </h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">All changes here are reflected live on the storefront homepage.</p>
                  </div>
                  <button
                    onClick={async () => {
                      setSettingsSaving(true);
                      try {
                        const res = await api.post('/ecommerce/store-settings/', editSettings);
                        setStoreSettings(res.data);
                        setEditSettings(res.data);
                        showToast('Store settings saved successfully!');
                      } catch (err) {
                        console.error('Error saving store settings:', err);
                        showToast('Failed to save settings. Please try again.');
                      } finally {
                        setSettingsSaving(false);
                      }
                    }}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs uppercase tracking-wider px-6 py-3 rounded-2xl shadow-md transition-all flex items-center gap-2"
                    disabled={settingsSaving}
                  >
                    <Check className="w-4 h-4" />
                    {settingsSaving ? 'Saving...' : 'Save All Changes'}
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* Ticker / Banner */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-3xl space-y-4 shadow-sm">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <Tag className="w-4 h-4 text-orange-500" />
                      <h4 className="font-black text-xs uppercase tracking-wider dark:text-white">Promo Ticker Bar</h4>
                    </div>
                    <div className="space-y-3 text-xs">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-400">Full Ticker Message</label>
                        <textarea
                          value={editSettings.ticker_text || ''}
                          onChange={e => setEditSettings(prev => ({ ...prev, ticker_text: e.target.value }))}
                          rows={2}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-white font-semibold resize-none"
                          placeholder="e.g. Limited Offer: 20% off using COLLABO20"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-slate-400">Highlighted Coupon/Word (shown in orange)</label>
                        <input
                          type="text"
                          value={editSettings.ticker_coupon_highlight || ''}
                          onChange={e => setEditSettings(prev => ({ ...prev, ticker_coupon_highlight: e.target.value }))}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-white font-bold"
                          placeholder="e.g. COLLABO20"
                        />
                      </div>
                    </div>
                    <div className="bg-slate-950 text-white py-2 px-4 rounded-xl flex items-center gap-2 text-xs font-bold">
                      <Tag className="w-3 h-3 text-orange-500" />
                      <span>
                        {editSettings.ticker_text?.replace(editSettings.ticker_coupon_highlight, '')}
                        <span className="text-orange-400">{editSettings.ticker_coupon_highlight}</span>
                      </span>
                    </div>
                  </div>

                  {/* Hero Section */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-3xl space-y-4 shadow-sm">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <Sparkles className="w-4 h-4 text-orange-500" />
                      <h4 className="font-black text-xs uppercase tracking-wider dark:text-white">Hero Section</h4>
                    </div>
                    <div className="space-y-3 text-xs">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-400">Badge Text</label>
                        <input type="text" value={editSettings.hero_badge_text || ''} onChange={e => setEditSettings(prev => ({ ...prev, hero_badge_text: e.target.value }))}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-white font-bold" placeholder="e.g. Curated Digital Marketplace" />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-slate-400">Main Headline</label>
                        <input type="text" value={editSettings.hero_headline || ''} onChange={e => setEditSettings(prev => ({ ...prev, hero_headline: e.target.value }))}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-white font-bold" placeholder="e.g. Architectural Utility & Style" />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-slate-400">Subheadline / Description</label>
                        <textarea value={editSettings.hero_subheadline || ''} onChange={e => setEditSettings(prev => ({ ...prev, hero_subheadline: e.target.value }))}
                          rows={2} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-white font-semibold resize-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-400">Primary CTA Button</label>
                          <input type="text" value={editSettings.hero_cta_primary || ''} onChange={e => setEditSettings(prev => ({ ...prev, hero_cta_primary: e.target.value }))}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-white font-bold" />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-400">Secondary CTA Button</label>
                          <input type="text" value={editSettings.hero_cta_secondary || ''} onChange={e => setEditSettings(prev => ({ ...prev, hero_cta_secondary: e.target.value }))}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-white font-bold" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* -- Top Rated Card Editor -- */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-3xl space-y-4 shadow-sm lg:col-span-2">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-orange-500" />
                        <h4 className="font-black text-xs uppercase tracking-wider dark:text-white">Top Rated Hero Card (right-side dark card)</h4>
                      </div>
                      {/* Carousel toggle */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Carousel</span>
                        <button
                          onClick={() => setEditSettings(prev => ({ ...prev, hero_card_carousel_enabled: !prev.hero_card_carousel_enabled }))}
                          className={`relative w-10 h-5 rounded-full transition-colors duration-300 focus:outline-none ${editSettings.hero_card_carousel_enabled ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300 ${editSettings.hero_card_carousel_enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                        <span className={`text-[10px] font-bold ${editSettings.hero_card_carousel_enabled ? 'text-orange-500' : 'text-slate-400'}`}>
                          {editSettings.hero_card_carousel_enabled ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 font-semibold">
                      Add one or more slides for the dark hero card. If empty, defaults are shown. Enable carousel to auto-advance between slides.
                    </p>

                    {/* Slides list */}
                    <div className="space-y-4">
                      {(editSettings.hero_card_slides || []).map((slide, idx) => (
                        <div key={idx} className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 space-y-3 border border-slate-200 dark:border-slate-700">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Slide #{idx + 1}</span>
                            <button
                              onClick={() => {
                                const slides = [...(editSettings.hero_card_slides || [])];
                                slides.splice(idx, 1);
                                setEditSettings(prev => ({ ...prev, hero_card_slides: slides }));
                              }}
                              className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 p-1 rounded-lg transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                            <div className="space-y-1">
                              <label className="font-bold text-slate-400">Title</label>
                              <input
                                type="text"
                                value={slide.title || ''}
                                placeholder="e.g. Top Rated"
                                onChange={e => {
                                  const slides = [...(editSettings.hero_card_slides || [])];
                                  slides[idx] = { ...slides[idx], title: e.target.value };
                                  setEditSettings(prev => ({ ...prev, hero_card_slides: slides }));
                                }}
                                className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl py-1.5 px-3 font-bold focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-white"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="font-bold text-slate-400">Label / Badge</label>
                              <input
                                type="text"
                                value={slide.label || ''}
                                placeholder="e.g. 4.8 Rating"
                                onChange={e => {
                                  const slides = [...(editSettings.hero_card_slides || [])];
                                  slides[idx] = { ...slides[idx], label: e.target.value };
                                  setEditSettings(prev => ({ ...prev, hero_card_slides: slides }));
                                }}
                                className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl py-1.5 px-3 font-bold focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-white"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="font-bold text-slate-400">Image URL</label>
                              <input
                                type="text"
                                value={slide.image || ''}
                                placeholder="https://... (optional)"
                                onChange={e => {
                                  const slides = [...(editSettings.hero_card_slides || [])];
                                  slides[idx] = { ...slides[idx], image: e.target.value };
                                  setEditSettings(prev => ({ ...prev, hero_card_slides: slides }));
                                }}
                                className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl py-1.5 px-3 font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-white"
                              />
                            </div>
                          </div>

                          <div className="space-y-1 text-xs">
                            <label className="font-bold text-slate-400">Subtitle / Description</label>
                            <textarea
                              value={slide.subtitle || ''}
                              placeholder="e.g. Voted best acoustic audio product of the year by global reviewers."
                              rows={2}
                              onChange={e => {
                                const slides = [...(editSettings.hero_card_slides || [])];
                                slides[idx] = { ...slides[idx], subtitle: e.target.value };
                                setEditSettings(prev => ({ ...prev, hero_card_slides: slides }));
                              }}
                              className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl py-1.5 px-3 font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-white resize-none"
                            />
                          </div>

                          {/* Live mini-preview */}
                          {(slide.title || slide.subtitle || slide.label) && (
                            <div className="mt-1">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Preview</span>
                              <div className="mt-1 bg-slate-950 text-white p-3 rounded-xl relative overflow-hidden max-w-xs">
                                {slide.image && (
                                  <div className="absolute inset-0 rounded-xl overflow-hidden">
                                    <img src={slide.image} alt={slide.title} className="w-full h-full object-cover opacity-30" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/30" />
                                  </div>
                                )}
                                <div className="relative z-10 space-y-1">
                                  <TrendingUp className="w-4 h-4 text-orange-500" />
                                  <p className="text-sm font-black leading-tight">{slide.title || 'Top Rated'}</p>
                                  <p className="text-white/60 text-[9px] leading-relaxed">{slide.subtitle || ''}</p>
                                </div>
                                <div className="relative z-10 flex items-center justify-between mt-2">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-orange-500">{slide.label || ''}</span>
                                  <ArrowRight className="w-3 h-3 text-white" />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      <button
                        onClick={() => {
                          const slides = [...(editSettings.hero_card_slides || []), {
                            title: 'Top Rated',
                            subtitle: 'Voted best acoustic audio product of the year by global reviewers.',
                            label: '4.8 Rating',
                            image: ''
                          }];
                          setEditSettings(prev => ({ ...prev, hero_card_slides: slides }));
                        }}
                        className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-orange-500/10 border border-dashed border-slate-300 dark:border-slate-600 hover:border-orange-400 text-slate-500 dark:text-slate-400 hover:text-orange-500 font-bold text-xs py-2.5 rounded-2xl transition-all flex items-center justify-center gap-2"
                      >
                        <PlusCircle className="w-4 h-4" />
                        Add Slide
                      </button>

                      {(editSettings.hero_card_slides || []).length > 0 && (
                        <button
                          onClick={() => setEditSettings(prev => ({ ...prev, hero_card_slides: [] }))}
                          className="w-full text-[10px] text-rose-500 font-bold hover:underline"
                        >
                          Clear all slides (use defaults)
                        </button>
                      )}
                    </div>
                  </div>

                  {/* -- Hero Sidecar Banners Editor -- */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-3xl space-y-4 shadow-sm lg:col-span-2">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-orange-500" />
                        <h4 className="font-black text-xs uppercase tracking-wider dark:text-white">Hero Sidecar Banners (Right Side Stacked)</h4>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 font-semibold">
                      Add up to 2 sidecar banners that appear next to the main carousel.
                    </p>

                    <div className="space-y-4">
                      {(editSettings.hero_sidecars || []).map((slide, idx) => (
                        <div key={idx} className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 space-y-3 border border-slate-200 dark:border-slate-700">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Sidecar #{idx + 1}</span>
                            <button
                              onClick={() => {
                                const slides = [...(editSettings.hero_sidecars || [])];
                                slides.splice(idx, 1);
                                setEditSettings(prev => ({ ...prev, hero_sidecars: slides }));
                              }}
                              className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 p-1 rounded-lg transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                            <div className="space-y-1">
                              <label className="font-bold text-slate-400">Title</label>
                              <input
                                type="text"
                                value={slide.title || ''}
                                placeholder="e.g. Deal of the Day"
                                onChange={e => {
                                  const slides = [...(editSettings.hero_sidecars || [])];
                                  slides[idx] = { ...slides[idx], title: e.target.value };
                                  setEditSettings(prev => ({ ...prev, hero_sidecars: slides }));
                                }}
                                className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl py-1.5 px-3 font-bold focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-white"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="font-bold text-slate-400">Subtitle</label>
                              <input
                                type="text"
                                value={slide.subtitle || ''}
                                placeholder="e.g. Extra 50% Off"
                                onChange={e => {
                                  const slides = [...(editSettings.hero_sidecars || [])];
                                  slides[idx] = { ...slides[idx], subtitle: e.target.value };
                                  setEditSettings(prev => ({ ...prev, hero_sidecars: slides }));
                                }}
                                className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl py-1.5 px-3 font-bold focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-white"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="font-bold text-slate-400">Product ID</label>
                              <input
                                type="number"
                                value={slide.product_id || ''}
                                placeholder="e.g. 5"
                                onChange={e => {
                                  const val = parseInt(e.target.value);
                                  const slides = [...(editSettings.hero_sidecars || [])];
                                  slides[idx] = { ...slides[idx], product_id: isNaN(val) ? '' : val };
                                  setEditSettings(prev => ({ ...prev, hero_sidecars: slides }));
                                }}
                                className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl py-1.5 px-3 font-bold focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-white"
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      <button
                        onClick={() => {
                          const slides = [...(editSettings.hero_sidecars || [])];
                          if (slides.length >= 2) return;
                          slides.push({ title: '', subtitle: '', product_id: '' });
                          setEditSettings(prev => ({ ...prev, hero_sidecars: slides }));
                        }}
                        disabled={(editSettings.hero_sidecars || []).length >= 2}
                        className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold py-2 rounded-xl transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Sidecar Banner
                      </button>

                      {(editSettings.hero_sidecars || []).length > 0 && (
                        <button
                          onClick={() => setEditSettings(prev => ({ ...prev, hero_sidecars: [] }))}
                          className="w-full text-[10px] text-rose-500 font-bold hover:underline"
                        >
                          Clear all sidecars (use defaults)
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Featured Products: Deals of the Day */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-3xl space-y-4 shadow-sm">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <Percent className="w-4 h-4 text-orange-500" />
                      <h4 className="font-black text-xs uppercase tracking-wider dark:text-white">Deals of the Day (pick up to 4)</h4>
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold">If empty, the first 4 products from your catalog are shown automatically.</p>
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {productsList.map(p => {
                        const isSelected = (editSettings.deals_product_ids || []).includes(p.id);
                        return (
                          <div key={p.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all text-xs ${isSelected ? 'border-orange-500 bg-orange-500/5' : 'border-slate-200 dark:border-slate-700 hover:border-orange-300'}`}
                            onClick={() => {
                              const cur = editSettings.deals_product_ids || [];
                              if (isSelected) {
                                setEditSettings(prev => ({ ...prev, deals_product_ids: cur.filter(id => id !== p.id) }));
                              } else if (cur.length < 4) {
                                setEditSettings(prev => ({ ...prev, deals_product_ids: [...cur, p.id] }));
                              }
                            }}>
                            <img src={p.image} alt={p.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-bold dark:text-white truncate">{p.name}</p>
                              <p className="text-slate-400">₹{Number(p.discountPrice).toLocaleString()} · {p.category}</p>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-orange-500 shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-orange-500 font-bold">{(editSettings.deals_product_ids || []).length}/4 selected</p>
                    {(editSettings.deals_product_ids || []).length > 0 && (
                      <button onClick={() => setEditSettings(prev => ({ ...prev, deals_product_ids: [] }))}
                        className="text-[10px] text-rose-500 font-bold hover:underline">Clear selection (use auto-defaults)</button>
                    )}
                  </div>

                  {/* Featured Products: Trending */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-3xl space-y-4 shadow-sm">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <TrendingUp className="w-4 h-4 text-orange-500" />
                      <h4 className="font-black text-xs uppercase tracking-wider dark:text-white">Trending Products (pick up to 4)</h4>
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold">If empty, products 5–8 from your catalog are shown automatically.</p>
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {productsList.map(p => {
                        const isSelected = (editSettings.trending_product_ids || []).includes(p.id);
                        return (
                          <div key={p.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all text-xs ${isSelected ? 'border-orange-500 bg-orange-500/5' : 'border-slate-200 dark:border-slate-700 hover:border-orange-300'}`}
                            onClick={() => {
                              const cur = editSettings.trending_product_ids || [];
                              if (isSelected) {
                                setEditSettings(prev => ({ ...prev, trending_product_ids: cur.filter(id => id !== p.id) }));
                              } else if (cur.length < 4) {
                                setEditSettings(prev => ({ ...prev, trending_product_ids: [...cur, p.id] }));
                              }
                            }}>
                            <img src={p.image} alt={p.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-bold dark:text-white truncate">{p.name}</p>
                              <p className="text-slate-400">₹{Number(p.discountPrice).toLocaleString()} · {p.category}</p>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-orange-500 shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-orange-500 font-bold">{(editSettings.trending_product_ids || []).length}/4 selected</p>
                    {(editSettings.trending_product_ids || []).length > 0 && (
                      <button onClick={() => setEditSettings(prev => ({ ...prev, trending_product_ids: [] }))}
                        className="text-[10px] text-rose-500 font-bold hover:underline">Clear selection (use auto-defaults)</button>
                    )}
                  </div>

                  {/* Trending Phones Section Editor */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-3xl space-y-5 shadow-sm">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <Phone className="w-4 h-4 text-orange-500" />
                      <h4 className="font-black text-xs uppercase tracking-wider dark:text-white">Trending Phones Section</h4>
                    </div>

                    {/* Title & Subtitle */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-500 dark:text-slate-400">Section Title</label>
                        <input
                          type="text"
                          value={editSettings.trending_phones_title || ''}
                          placeholder="e.g. Trending Phones"
                          onChange={e => setEditSettings(prev => ({ ...prev, trending_phones_title: e.target.value }))}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 font-bold focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-slate-500 dark:text-slate-400">Subtitle / Tag</label>
                        <input
                          type="text"
                          value={editSettings.trending_phones_subtitle || ''}
                          placeholder="e.g. MOBILES"
                          onChange={e => setEditSettings(prev => ({ ...prev, trending_phones_subtitle: e.target.value }))}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 font-bold focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Product Picker */}
                    <div className="space-y-2">
                      <p className="text-[10px] text-slate-400 font-semibold">
                        Pin specific phones to feature (up to 8). Leave empty to auto-show all Mobiles products.
                      </p>
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {productsList
                          .filter(p => (p.category || '').toLowerCase() === 'mobiles')
                          .map(p => {
                            const isSelected = (editSettings.trending_phones_product_ids || []).some(id => String(id) === String(p.id));
                            return (
                              <div
                                key={p.id}
                                onClick={() => {
                                  const cur = editSettings.trending_phones_product_ids || [];
                                  if (isSelected) {
                                    setEditSettings(prev => ({ ...prev, trending_phones_product_ids: cur.filter(id => String(id) !== String(p.id)) }));
                                  } else if (cur.length < 8) {
                                    setEditSettings(prev => ({ ...prev, trending_phones_product_ids: [...cur, p.id] }));
                                  }
                                }}
                                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all text-xs ${isSelected ? 'border-orange-500 bg-orange-500/5' : 'border-slate-200 dark:border-slate-700 hover:border-orange-300'}`}
                              >
                                <img src={p.image} alt={p.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold dark:text-white truncate">{p.name}</p>
                                  <p className="text-slate-400">{p.brand} · ₹{Number(p.discountPrice).toLocaleString()}</p>
                                </div>
                                {isSelected && <Check className="w-4 h-4 text-orange-500 shrink-0" />}
                              </div>
                            );
                          })}
                        {productsList.filter(p => (p.category || '').toLowerCase() === 'mobiles').length === 0 && (
                          <p className="text-slate-400 text-xs italic py-4 text-center">No Mobiles products in inventory yet.</p>
                        )}
                      </div>
                      <p className="text-[10px] text-orange-500 font-bold">
                        {(editSettings.trending_phones_product_ids || []).length}/8 pinned
                      </p>
                      {(editSettings.trending_phones_product_ids || []).length > 0 && (
                        <button
                          onClick={() => setEditSettings(prev => ({ ...prev, trending_phones_product_ids: [] }))}
                          className="text-[10px] text-rose-500 font-bold hover:underline"
                        >
                          Clear selection (show all Mobiles automatically)
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Coupon Codes Manager */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-3xl space-y-4 shadow-sm">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <Tag className="w-4 h-4 text-orange-500" />
                      <h4 className="font-black text-xs uppercase tracking-wider dark:text-white">Coupon Codes</h4>
                    </div>
                    <div className="space-y-3">
                      {(editSettings.coupon_codes || []).map((coupon, idx) => (
                        <div key={idx} className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Coupon #{idx + 1}</span>
                            <button onClick={() => {
                              const coupons = [...(editSettings.coupon_codes || [])];
                              coupons.splice(idx, 1);
                              setEditSettings(prev => ({ ...prev, coupon_codes: coupons }));
                            }} className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 p-1 rounded-lg transition-colors">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="space-y-1">
                              <label className="font-bold text-slate-400">Code</label>
                              <input type="text" value={coupon.code} onChange={e => {
                                const coupons = [...(editSettings.coupon_codes || [])];
                                coupons[idx] = { ...coupons[idx], code: e.target.value.toUpperCase() };
                                setEditSettings(prev => ({ ...prev, coupon_codes: coupons }));
                              }} className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl py-1.5 px-3 font-bold focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-white uppercase" />
                            </div>
                            <div className="space-y-1">
                              <label className="font-bold text-slate-400">Discount %</label>
                              <input type="number" min="1" max="100" value={coupon.discount_percent} onChange={e => {
                                const coupons = [...(editSettings.coupon_codes || [])];
                                coupons[idx] = { ...coupons[idx], discount_percent: Number(e.target.value) };
                                setEditSettings(prev => ({ ...prev, coupon_codes: coupons }));
                              }} className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl py-1.5 px-3 font-bold focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-white" />
                            </div>
                          </div>
                          <div className="space-y-1 text-xs">
                            <label className="font-bold text-slate-400">Description</label>
                            <input type="text" value={coupon.description || ''} onChange={e => {
                              const coupons = [...(editSettings.coupon_codes || [])];
                              coupons[idx] = { ...coupons[idx], description: e.target.value };
                              setEditSettings(prev => ({ ...prev, coupon_codes: coupons }));
                            }} className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl py-1.5 px-3 font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-white" placeholder="e.g. 20% off all tech products" />
                          </div>
                        </div>
                      ))}
                      <button onClick={() => {
                        const coupons = [...(editSettings.coupon_codes || []), { code: 'NEWCODE', discount_percent: 10, description: 'New coupon code' }];
                        setEditSettings(prev => ({ ...prev, coupon_codes: coupons }));
                      }} className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-orange-500/10 border border-dashed border-slate-300 dark:border-slate-600 hover:border-orange-400 text-slate-500 dark:text-slate-400 hover:text-orange-500 font-bold text-xs py-2.5 rounded-2xl transition-all flex items-center justify-center gap-2">
                        <PlusCircle className="w-4 h-4" />
                        Add New Coupon Code
                      </button>
                    </div>
                  </div>

                  {/* Product Ads Manager */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-3xl space-y-4 shadow-sm lg:col-span-2">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <Sparkles className="w-4 h-4 text-orange-500" />
                      <h4 className="font-black text-xs uppercase tracking-wider dark:text-white">Product Ads (Details Page)</h4>
                    </div>
                    <div className="space-y-3">
                      {(editSettings.product_ads || []).map((ad, idx) => (
                        <div key={idx} className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 space-y-3 relative group">
                          <button onClick={() => {
                            const ads = [...(editSettings.product_ads || [])];
                            ads.splice(idx, 1);
                            setEditSettings(prev => ({ ...prev, product_ads: ads }));
                          }} className="absolute top-3 right-3 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 p-1 rounded-lg transition-colors z-10">
                            <X className="w-4 h-4" />
                          </button>
                          
                          <div className="flex flex-col sm:flex-row gap-4">
                             <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-white shrink-0 border border-slate-200 dark:border-slate-700">
                               <img src={ad.image || 'https://via.placeholder.com/80'} className="w-full h-full object-cover" alt="Ad thumb" />
                             </div>
                             <div className="flex-1 space-y-2 text-xs">
                               <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                 <div className="space-y-1">
                                   <label className="font-bold text-slate-400">Product Name</label>
                                   <input type="text" value={ad.name} onChange={e => {
                                      const ads = [...(editSettings.product_ads || [])];
                                      ads[idx] = { ...ads[idx], name: e.target.value };
                                      setEditSettings(prev => ({ ...prev, product_ads: ads }));
                                   }} className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl py-1.5 px-3 font-bold focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-white" />
                                 </div>
                                 <div className="space-y-1">
                                   <label className="font-bold text-slate-400">Image URL</label>
                                   <input type="text" value={ad.image} onChange={e => {
                                      const ads = [...(editSettings.product_ads || [])];
                                      ads[idx] = { ...ads[idx], image: e.target.value };
                                      setEditSettings(prev => ({ ...prev, product_ads: ads }));
                                   }} className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl py-1.5 px-3 font-bold focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-white" />
                                 </div>
                               </div>
                               <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                 <div className="space-y-1">
                                   <label className="font-bold text-slate-400">Price (₹)</label>
                                   <input type="number" value={ad.price} onChange={e => {
                                      const ads = [...(editSettings.product_ads || [])];
                                      ads[idx] = { ...ads[idx], price: Number(e.target.value) };
                                      setEditSettings(prev => ({ ...prev, product_ads: ads }));
                                   }} className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl py-1.5 px-3 font-bold focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-white" />
                                 </div>
                                 <div className="space-y-1">
                                   <label className="font-bold text-slate-400">Discount Price</label>
                                   <input type="number" value={ad.discountPrice} onChange={e => {
                                      const ads = [...(editSettings.product_ads || [])];
                                      ads[idx] = { ...ads[idx], discountPrice: Number(e.target.value) };
                                      setEditSettings(prev => ({ ...prev, product_ads: ads }));
                                   }} className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl py-1.5 px-3 font-bold focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-white" />
                                 </div>
                                 <div className="space-y-1">
                                   <label className="font-bold text-slate-400">Discount Text</label>
                                   <input type="text" value={ad.discountText} onChange={e => {
                                      const ads = [...(editSettings.product_ads || [])];
                                      ads[idx] = { ...ads[idx], discountText: e.target.value };
                                      setEditSettings(prev => ({ ...prev, product_ads: ads }));
                                   }} placeholder="e.g. 50% OFF" className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl py-1.5 px-3 font-bold focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-white" />
                                 </div>
                                 <div className="space-y-1">
                                   <label className="font-bold text-slate-400">Link Product ID</label>
                                   <input type="text" value={ad.linkId} onChange={e => {
                                      const ads = [...(editSettings.product_ads || [])];
                                      ads[idx] = { ...ads[idx], linkId: e.target.value };
                                      setEditSettings(prev => ({ ...prev, product_ads: ads }));
                                   }} placeholder="e.g. 1" className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl py-1.5 px-3 font-bold focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-white" />
                                 </div>
                               </div>
                             </div>
                          </div>
                        </div>
                      ))}
                      <button onClick={() => {
                        setEditSettings(prev => ({
                          ...prev,
                          product_ads: [...(prev.product_ads || []), { id: Date.now(), name: 'New Ad', image: '', price: 1000, discountPrice: 500, discountText: '50% OFF', linkId: '1' }]
                        }))
                      }} className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-orange-500/10 border border-dashed border-slate-300 dark:border-slate-600 hover:border-orange-400 text-slate-500 dark:text-slate-400 hover:text-orange-500 font-bold text-xs py-2.5 rounded-2xl transition-all flex items-center justify-center gap-2">
                        <PlusCircle className="w-4 h-4" />
                        Add New Product Ad
                      </button>
                    </div>
                  </div>

                  {/* Promo Cards (Category Sidebar Ads) */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-3xl space-y-4 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-orange-500" />
                        <h4 className="font-black text-xs uppercase tracking-wider dark:text-white">Promo Cards (Category Sidebar)</h4>
                      </div>
                      <button onClick={() => setEditSettings({...editSettings, promo_cards: [...(editSettings.promo_cards || []), {badge: 'NEW', title: 'Sale Title', subtitle: 'Description', cta: 'Shop Now', category: 'All', bg: 'from-orange-500 to-rose-500'}]})} className="text-[10px] font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1"><PlusCircle className="w-3 h-3" /> Add Card</button>
                    </div>
                    {(editSettings.promo_cards || []).map((card, idx) => (
                      <div key={idx} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-2 relative">
                        <button onClick={() => { const c = [...editSettings.promo_cards]; c.splice(idx, 1); setEditSettings({...editSettings, promo_cards: c}); }} className="absolute top-2 right-2 text-slate-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                        <div className="grid grid-cols-2 gap-2">
                          <div><label className="font-bold text-slate-400 text-[10px]">Badge</label><input className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs dark:bg-slate-800 dark:text-white" value={card.badge} onChange={e => { const c = [...editSettings.promo_cards]; c[idx] = {...c[idx], badge: e.target.value}; setEditSettings({...editSettings, promo_cards: c}); }} /></div>
                          <div><label className="font-bold text-slate-400 text-[10px]">Title</label><input className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs dark:bg-slate-800 dark:text-white" value={card.title} onChange={e => { const c = [...editSettings.promo_cards]; c[idx] = {...c[idx], title: e.target.value}; setEditSettings({...editSettings, promo_cards: c}); }} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div><label className="font-bold text-slate-400 text-[10px]">Subtitle</label><input className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs dark:bg-slate-800 dark:text-white" value={card.subtitle} onChange={e => { const c = [...editSettings.promo_cards]; c[idx] = {...c[idx], subtitle: e.target.value}; setEditSettings({...editSettings, promo_cards: c}); }} /></div>
                          <div><label className="font-bold text-slate-400 text-[10px]">CTA Button</label><input className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs dark:bg-slate-800 dark:text-white" value={card.cta} onChange={e => { const c = [...editSettings.promo_cards]; c[idx] = {...c[idx], cta: e.target.value}; setEditSettings({...editSettings, promo_cards: c}); }} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div><label className="font-bold text-slate-400 text-[10px]">Category</label><select className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs dark:bg-slate-800 dark:text-white" value={card.category} onChange={e => { const c = [...editSettings.promo_cards]; c[idx] = {...c[idx], category: e.target.value}; setEditSettings({...editSettings, promo_cards: c}); }}>{dynamicCategories.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}</select></div>
                          <div><label className="font-bold text-slate-400 text-[10px]">Gradient</label><select className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs dark:bg-slate-800 dark:text-white" value={card.bg} onChange={e => { const c = [...editSettings.promo_cards]; c[idx] = {...c[idx], bg: e.target.value}; setEditSettings({...editSettings, promo_cards: c}); }}><option value="from-amber-500 to-orange-600">Orange</option><option value="from-violet-600 to-purple-700">Purple</option><option value="from-sky-500 to-blue-600">Blue</option><option value="from-rose-500 to-pink-600">Pink</option><option value="from-emerald-500 to-teal-600">Green</option><option value="from-slate-700 to-slate-900">Dark</option></select></div>
                        </div>
                      </div>
                    ))}
                    {(!editSettings.promo_cards || editSettings.promo_cards.length === 0) && <p className="text-xs text-slate-400 text-center py-2">No promo cards configured. Default cards will be used.</p>}
                  </div>

                  {/* Shipping Settings */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-3xl space-y-4 shadow-sm">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <Package className="w-4 h-4 text-orange-500" />
                      <h4 className="font-black text-xs uppercase tracking-wider dark:text-white">Shipping Settings</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-400">Shipping Charge (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={editSettings.shipping_charge ?? 99}
                          onChange={e => setEditSettings(prev => ({ ...prev, shipping_charge: Number(e.target.value) }))}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-white font-bold"
                          placeholder="e.g. 99"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-slate-400">Free Shipping Above (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={editSettings.free_shipping_threshold ?? 1500}
                          onChange={e => setEditSettings(prev => ({ ...prev, free_shipping_threshold: Number(e.target.value) }))}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-white font-bold"
                          placeholder="e.g. 1500"
                        />
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl py-2 px-3 text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                      Orders above ₹{editSettings.free_shipping_threshold ?? 1500} get free shipping; others are charged ₹{editSettings.shipping_charge ?? 99}.
                    </div>
                  </div>

                  {/* Testimonials Editor */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-3xl space-y-4 shadow-sm">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <Users className="w-4 h-4 text-orange-500" />
                      <h4 className="font-black text-xs uppercase tracking-wider dark:text-white">Customer Testimonials</h4>
                    </div>
                    <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                      {(editSettings.testimonials || []).map((t, idx) => (
                        <div key={idx} className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Testimonial #{idx + 1}</span>
                            <div className="flex items-center gap-2">
                              <button onClick={() => {
                                const tests = [...(editSettings.testimonials || []), { name: 'New Reviewer', title: 'Verified Buyer', rating: 5, text: 'Great product!' }];
                                setEditSettings(prev => ({ ...prev, testimonials: tests }));
                              }} className="text-[10px] text-orange-500 font-bold hover:underline flex items-center gap-1">
                                <PlusCircle className="w-3 h-3" /> Add
                              </button>
                              {(editSettings.testimonials || []).length > 1 && (
                                <button onClick={() => {
                                  const tests = [...(editSettings.testimonials || [])];
                                  tests.splice(idx, 1);
                                  setEditSettings(prev => ({ ...prev, testimonials: tests }));
                                }} className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 p-1 rounded-lg transition-colors">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="space-y-1">
                              <label className="font-bold text-slate-400">Name</label>
                              <input type="text" value={t.name || ''} onChange={e => {
                                const tests = [...(editSettings.testimonials || [])];
                                tests[idx] = { ...tests[idx], name: e.target.value };
                                setEditSettings(prev => ({ ...prev, testimonials: tests }));
                              }} className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl py-1.5 px-3 font-bold focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-white" />
                            </div>
                            <div className="space-y-1">
                              <label className="font-bold text-slate-400">Title / Role</label>
                              <input type="text" value={t.title || ''} onChange={e => {
                                const tests = [...(editSettings.testimonials || [])];
                                tests[idx] = { ...tests[idx], title: e.target.value };
                                setEditSettings(prev => ({ ...prev, testimonials: tests }));
                              }} className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl py-1.5 px-3 font-bold focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-white" />
                            </div>
                          </div>
                          <div className="space-y-1 text-xs">
                            <label className="font-bold text-slate-400">Rating (1–5)</label>
                            <div className="flex gap-1">
                              {[1,2,3,4,5].map(star => (
                                <button key={star} onClick={() => {
                                  const tests = [...(editSettings.testimonials || [])];
                                  tests[idx] = { ...tests[idx], rating: star };
                                  setEditSettings(prev => ({ ...prev, testimonials: tests }));
                                }} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${Number(t.rating) >= star ? 'bg-orange-500 text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-400'}`}>
                                  <Star className="w-3.5 h-3.5" />
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-1 text-xs">
                            <label className="font-bold text-slate-400">Review Text</label>
                            <textarea value={t.text || ''} onChange={e => {
                              const tests = [...(editSettings.testimonials || [])];
                              tests[idx] = { ...tests[idx], text: e.target.value };
                              setEditSettings(prev => ({ ...prev, testimonials: tests }));
                            }} rows={2} className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl py-1.5 px-3 font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-white resize-none" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer Settings */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-3xl space-y-4 shadow-sm lg:col-span-2">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <Info className="w-4 h-4 text-orange-500" />
                      <h4 className="font-black text-xs uppercase tracking-wider dark:text-white">Footer Content</h4>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-400">Brand Tagline (below logo)</label>
                        <textarea value={editSettings.footer_tagline || ''} onChange={e => setEditSettings(prev => ({ ...prev, footer_tagline: e.target.value }))}
                          rows={2} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-white font-semibold resize-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-slate-400">Copyright Text</label>
                        <input type="text" value={editSettings.copyright_text || ''} onChange={e => setEditSettings(prev => ({ ...prev, copyright_text: e.target.value }))}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-white font-bold" placeholder="© 2026 YourStore. All rights reserved." />
                      </div>
                    </div>
                  </div>


                </div>

                {/* Save button at the bottom */}
                <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={async () => {
                      setSettingsSaving(true);
                      try {
                        const res = await api.post('/ecommerce/store-settings/', editSettings);
                        setStoreSettings(res.data);
                        setEditSettings(res.data);
                        showToast('Store settings saved successfully!');
                      } catch (err) {
                        console.error('Error saving store settings:', err);
                        showToast('Failed to save settings. Please try again.');
                      } finally {
                        setSettingsSaving(false);
                      }
                    }}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs uppercase tracking-wider px-8 py-3.5 rounded-2xl shadow-lg transition-all flex items-center gap-2"
                    disabled={settingsSaving}
                  >
                    <Check className="w-4 h-4" />
                    {settingsSaving ? 'Saving...' : 'Save All Store Settings'}
                  </button>
                </div>
              </div>
            )}

            {adminView === 'wallets' && (user?.is_staff || user?.user_type === 'admin') && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-lg dark:text-white flex items-center gap-2">
                      <Gift className="w-5 h-5 text-violet-500" />
                      Customer Referral Wallets
                    </h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">
                      Every customer-generated referral link, who referred whom, and every wallet reward paid out.
                    </p>
                  </div>
                  <button
                    onClick={fetchAdminWallets}
                    className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs py-2 px-4 rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Refresh
                  </button>
                </div>

                {adminWallets && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Links</p>
                      <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{adminWallets.summary.total_links}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Paid Out</p>
                      <p className="text-2xl font-black text-emerald-600 mt-1">₹{adminWallets.summary.total_paid.toLocaleString()}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending</p>
                      <p className="text-2xl font-black text-amber-500 mt-1">₹{adminWallets.summary.total_pending.toLocaleString()}</p>
                    </div>
                  </div>
                )}

                {/* Cash Withdrawal Requests */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl overflow-hidden shadow-sm">
                  <div className="px-4 pt-4">
                    <h4 className="font-black text-[11px] text-slate-800 dark:text-white uppercase tracking-wider">Cash Withdrawal Requests</h4>
                    <p className="text-[9px] text-slate-400 font-semibold mt-0.5 mb-2">Users can request to withdraw their referral wallet balance any time — review and process each request below.</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800 text-slate-400 uppercase tracking-widest font-black text-[9px] border-b border-slate-100 dark:border-slate-800">
                          <th className="py-3 px-4">User</th>
                          <th className="py-3 px-4 text-right">Amount</th>
                          <th className="py-3 px-4 text-center">Status</th>
                          <th className="py-3 px-4 text-center">Requested</th>
                          <th className="py-3 px-4">Bank Account (pay out to)</th>
                          <th className="py-3 px-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-600 dark:text-slate-300">
                        {adminWalletPayouts.length > 0 ? (
                          adminWalletPayouts.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                              <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">@{p.username}</td>
                              <td className="py-2.5 px-4 text-right font-black text-slate-900 dark:text-white">₹{Number(p.amount).toLocaleString()}</td>
                              <td className="py-2.5 px-4 text-center">
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${p.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : p.status === 'rejected' ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-500' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'}`}>
                                  {p.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-4 text-center text-[10px] text-slate-500 font-bold">{new Date(p.requested_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                              <td className="py-2.5 px-4 text-[10px]">
                                {p.account_holder_name ? (
                                  <div>
                                    <p className="font-bold text-slate-700 dark:text-slate-200">{p.account_holder_name}</p>
                                    <p className="text-slate-400 font-mono">{p.account_number} · {p.ifsc_code}</p>
                                    {(p.bank_reference || p.admin_note) && (
                                      <p className="text-slate-400 italic mt-0.5">{p.bank_reference || p.admin_note}</p>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-400">— no bank details (legacy request)</span>
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                {p.status === 'pending' ? (
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => processWalletPayout(p.id, 'complete')}
                                      disabled={processingPayoutId === p.id}
                                      className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-[10px] py-1.5 px-3 rounded-lg font-bold transition-all"
                                    >
                                      Complete
                                    </button>
                                    <button
                                      onClick={() => processWalletPayout(p.id, 'reject')}
                                      disabled={processingPayoutId === p.id}
                                      className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 text-slate-700 dark:text-slate-200 text-[10px] py-1.5 px-3 rounded-lg font-bold transition-all"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-400">—</span>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-400 italic">No withdrawal requests yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Referral Links table */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800 text-slate-400 uppercase tracking-widest font-black text-[9px] border-b border-slate-100 dark:border-slate-800">
                          <th className="py-4 px-4">Referrer</th>
                          <th className="py-4 px-4">Referred By (Upline)</th>
                          <th className="py-4 px-4">Product</th>
                          <th className="py-4 px-4">Referral Code</th>
                          <th className="py-4 px-4 text-center">Clicks</th>
                          <th className="py-4 px-4 text-center">Conversions</th>
                          <th className="py-4 px-4 text-center">Discount %</th>
                          <th className="py-4 px-4 text-right">Paid</th>
                          <th className="py-4 px-4 text-right">Pending</th>
                          <th className="py-4 px-4 text-center">Created</th>
                          <th className="py-4 px-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-600 dark:text-slate-300">
                        {adminWallets && adminWallets.links.length > 0 ? (
                          adminWallets.links.map((link) => {
                            const isExpanded = expandedWalletLinkId === link.id;
                            return (
                              <React.Fragment key={link.id}>
                                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">@{link.referrer}</td>
                                  <td className="py-3 px-4">
                                    {link.referred_by ? (
                                      <span className="font-bold text-violet-600">@{link.referred_by}</span>
                                    ) : (
                                      <span className="text-slate-400 text-[10px]">—</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 font-bold">{link.product_name}</td>
                                  <td className="py-3 px-4 font-mono text-slate-500 text-[10px]">{link.referral_code}</td>
                                  <td className="py-3 px-4 text-center">
                                    <span className={`font-black text-sm ${link.clicks > 0 ? 'text-violet-600' : 'text-slate-400'}`}>{link.clicks}</span>
                                  </td>
                                  <td className="py-3 px-4 text-center font-black text-slate-900 dark:text-white">{link.conversions}</td>
                                  <td className="py-3 px-4 text-center font-bold text-violet-500">{link.link_discount_percent}%</td>
                                  <td className="py-3 px-4 text-right font-black text-emerald-600">₹{Number(link.total_paid).toLocaleString()}</td>
                                  <td className="py-3 px-4 text-right font-black text-amber-500">₹{Number(link.pending).toLocaleString()}</td>
                                  <td className="py-3 px-4 text-center text-[10px] text-slate-500 font-bold">{link.created_at}</td>
                                  <td className="py-3 px-4 text-center">
                                    <button
                                      onClick={() => setExpandedWalletLinkId(isExpanded ? null : link.id)}
                                      className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] py-1.5 px-3 rounded-lg font-bold transition-all text-slate-600 dark:text-slate-350"
                                    >
                                      {isExpanded ? 'Hide' : `Show (${link.buyers.length})`}
                                    </button>
                                  </td>
                                </tr>
                                {isExpanded && (
                                  <tr className="bg-slate-50/30 dark:bg-slate-900/30">
                                    <td colSpan={11} className="py-4 px-8 border-t border-b border-slate-100 dark:border-slate-800">
                                      <div className="space-y-3">
                                        <h4 className="font-black text-[9px] uppercase tracking-wider text-slate-400">Buyer Purchase Logs</h4>
                                        {link.buyers.length > 0 ? (
                                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {link.buyers.map((buyer, bIdx) => (
                                              <div key={bIdx} className="bg-white dark:bg-slate-850 p-3.5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col gap-1 text-[11px]">
                                                <div className="flex justify-between items-center">
                                                  <span className="font-bold text-slate-900 dark:text-white">{buyer.username}</span>
                                                  <span className="text-[10px] text-slate-400 font-bold">{buyer.date}</span>
                                                </div>
                                                <span className="text-slate-400 font-mono text-[10px]">{buyer.order_id}</span>
                                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 font-bold">
                                                  <span className="text-slate-400 font-bold">Order:</span>
                                                  <span className="text-slate-900 dark:text-white font-bold">₹{buyer.order_amount.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between items-center font-bold">
                                                  <span className="text-slate-400 font-bold">Reward:</span>
                                                  <span className={`font-black ${buyer.status === 'completed' ? 'text-emerald-600' : 'text-amber-500'}`}>₹{buyer.reward.toLocaleString()} ({buyer.status})</span>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <p className="text-slate-400 text-xs italic">No buyers have purchased using this link yet.</p>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={11} className="py-12 text-center text-slate-400 italic">No customer referral links generated yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Full transaction ledger */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl overflow-hidden shadow-sm">
                  <div className="px-4 pt-4">
                    <h4 className="font-black text-[11px] text-slate-800 dark:text-white uppercase tracking-wider">Full Wallet Ledger</h4>
                    <p className="text-[9px] text-slate-400 font-semibold mt-0.5 mb-2">Every credit — direct referrals and upline bonuses — across all users.</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800 text-slate-400 uppercase tracking-widest font-black text-[9px] border-b border-slate-100 dark:border-slate-800">
                          <th className="py-3 px-4">User</th>
                          <th className="py-3 px-4 text-center">Level</th>
                          <th className="py-3 px-4">Product</th>
                          <th className="py-3 px-4">Buyer</th>
                          <th className="py-3 px-4">Order</th>
                          <th className="py-3 px-4 text-right">Amount</th>
                          <th className="py-3 px-4 text-center">Status</th>
                          <th className="py-3 px-4 text-center">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-600 dark:text-slate-300">
                        {adminWallets && adminWallets.ledger.length > 0 ? (
                          adminWallets.ledger.map((tx) => (
                            <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                              <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">@{tx.user}</td>
                              <td className="py-2.5 px-4 text-center">
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${tx.level === 2 ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                  {tx.level === 2 ? 'Upline' : 'Direct'}
                                </span>
                              </td>
                              <td className="py-2.5 px-4">{tx.product_name || '—'}</td>
                              <td className="py-2.5 px-4 text-slate-500">{tx.buyer ? `@${tx.buyer}` : '—'}</td>
                              <td className="py-2.5 px-4 font-mono text-[10px] text-slate-500">{tx.order_id || '—'}</td>
                              <td className="py-2.5 px-4 text-right font-black text-slate-900 dark:text-white">₹{Number(tx.amount).toLocaleString()}</td>
                              <td className="py-2.5 px-4 text-center">
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${tx.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : tx.status === 'pending' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-500'}`}>
                                  {tx.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-4 text-center text-[10px] text-slate-500 font-bold">{tx.created_at}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={8} className="py-12 text-center text-slate-400 italic">No wallet transactions yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* BROADCAST MESSAGES */}
            {adminView === 'broadcast' && (user?.is_staff || user?.user_type === 'admin') && (
              <div className="space-y-6 animate-fadeIn max-w-2xl">
                <div>
                  <h3 className="font-extrabold text-sm dark:text-white flex items-center gap-2">📢 Broadcast WhatsApp Message</h3>
                  <p className="text-[11px] text-slate-500 mt-1">Send a message to all users or a specific group via Gupshup WhatsApp.</p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 space-y-5 shadow-sm">

                  {/* Target audience */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Send To</label>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { key: 'all', label: '👥 All Users' },
                        { key: 'buyers', label: '🛒 Buyers Only' },
                        { key: 'sellers', label: '🏪 Sellers Only' },
                      ].map(opt => (
                        <button key={opt.key} onClick={() => setBroadcastTarget(opt.key)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${broadcastTarget === opt.key ? 'bg-green-600 text-white border-green-600' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-green-400'}`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message templates */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quick Templates</label>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { label: '🎉 Sale Offer', msg: `Hi! 🎉 Big Sale is LIVE on Collabo!\n\nGet up to 50% OFF on top products. Limited time only!\n\n👉 Shop now: collabo.co.in\n\nUse code *SALE50* at checkout.` },
                        { label: '🆕 New Arrivals', msg: `Hi! 🆕 New products just dropped on Collabo!\n\nCheck out the latest arrivals — fresh styles, unbeatable prices.\n\n👉 collabo.co.in` },
                        { label: '⏰ Flash Deal', msg: `⚡ FLASH DEAL ALERT!\n\nHurry! Exclusive deals for the next 24 hours only on Collabo.\n\nDon't miss out 👉 collabo.co.in` },
                      ].map((t, i) => (
                        <button key={i} onClick={() => setBroadcastMessage(t.msg)}
                          className="text-left px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-green-400 hover:bg-green-50/30 dark:hover:bg-green-900/10 transition-all">
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message editor */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Message *</label>
                    <textarea
                      rows={7}
                      value={broadcastMessage}
                      onChange={e => setBroadcastMessage(e.target.value)}
                      placeholder="Type your WhatsApp message here...&#10;&#10;Tip: Use *bold* for emphasis."
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-800 dark:text-white outline-none focus:border-green-400 resize-none transition-colors"
                    />
                    <p className="text-[10px] text-slate-400">{broadcastMessage.length} characters</p>
                  </div>

                  {/* Result */}
                  {broadcastResult && (
                    <div className={`rounded-2xl px-4 py-3 text-xs font-bold flex items-center gap-2 ${broadcastResult.error ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600' : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400'}`}>
                      {broadcastResult.error ? '❌' : '✅'} {broadcastResult.message || broadcastResult.error}
                      {!broadcastResult.error && broadcastResult.sent !== undefined && (
                        <span className="ml-auto text-slate-500 font-semibold">Sent: {broadcastResult.sent} | Failed: {broadcastResult.failed}</span>
                      )}
                    </div>
                  )}

                  {/* Send button */}
                  <button
                    onClick={async () => {
                      if (!broadcastMessage.trim()) { toast.error('Please write a message first'); return; }
                      if (!window.confirm(`Send this message to ${broadcastTarget === 'all' ? 'ALL users' : broadcastTarget === 'buyers' ? 'all buyers' : 'all sellers'}?`)) return;
                      setBroadcastSending(true);
                      setBroadcastResult(null);
                      try {
                        const res = await api.post('/ecommerce/admin/broadcast-offer/', {
                          message: broadcastMessage,
                          target: broadcastTarget,
                        });
                        setBroadcastResult(res.data);
                        toast.success(`Sent to ${res.data.sent} users!`);
                      } catch (err) {
                        const errMsg = err.response?.data?.error || 'Failed to send broadcast';
                        setBroadcastResult({ error: errMsg });
                        toast.error(errMsg);
                      } finally {
                        setBroadcastSending(false);
                      }
                    }}
                    disabled={broadcastSending || !broadcastMessage.trim()}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs py-4 rounded-2xl transition-colors flex items-center justify-center gap-2"
                  >
                    {broadcastSending ? (
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
                    ) : (
                      <>📤 Send WhatsApp Broadcast</>
                    )}
                  </button>
                </div>

                {/* Info box */}
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-4 text-xs font-semibold text-amber-700 dark:text-amber-400 space-y-1">
                  <p className="font-black">⚠️ How this works</p>
                  <p>• Messages are sent via Gupshup WhatsApp API to each user's registered phone number.</p>
                  <p>• Only users who have a saved delivery address with a phone number will receive the message.</p>
                  <p>• Sending to large lists takes a few seconds — wait for the result before closing.</p>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3 pt-2">
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">or</span>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                </div>

                {/* Email Newsletter Broadcast */}
                <div>
                  <h3 className="font-extrabold text-sm dark:text-white flex items-center gap-2">✉️ Email Newsletter Broadcast</h3>
                  <p className="text-[11px] text-slate-500 mt-1">Send a promotional email to all newsletter subscribers.</p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 space-y-5 shadow-sm">

                  {/* Subscriber list */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        📧 Subscribers
                        {subscriberCount !== null && (
                          <span className="ml-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full text-[9px]">
                            {subscriberCount} active
                          </span>
                        )}
                      </label>
                      <button
                        onClick={async () => {
                          setSubscriberListLoading(true);
                          try {
                            const res = await api.get('/ecommerce/newsletter/broadcast/');
                            setSubscriberList(res.data.subscribers || []);
                            setSubscriberCount(res.data.count);
                          } catch { setSubscriberList([]); }
                          finally { setSubscriberListLoading(false); }
                        }}
                        className="text-[10px] font-black text-blue-600 hover:text-blue-800 dark:text-blue-400 underline"
                      >
                        {subscriberListLoading ? 'Loading...' : subscriberList.length === 0 ? 'Load Subscribers →' : 'Refresh'}
                      </button>
                    </div>

                    {subscriberList.length > 0 && (
                      <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                        <div className="max-h-56 overflow-y-auto">
                          <table className="w-full text-xs">
                            <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800">
                              <tr>
                                <th className="text-left px-4 py-2.5 font-black text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">#</th>
                                <th className="text-left px-4 py-2.5 font-black text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">Email</th>
                                <th className="text-left px-4 py-2.5 font-black text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">Subscribed</th>
                                <th className="text-left px-4 py-2.5 font-black text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {subscriberList.map((sub, i) => (
                                <tr key={sub.id} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                  <td className="px-4 py-2.5 font-bold text-slate-400">{i + 1}</td>
                                  <td className="px-4 py-2.5 font-semibold text-slate-700 dark:text-slate-300">{sub.email}</td>
                                  <td className="px-4 py-2.5 font-semibold text-slate-400 whitespace-nowrap">{sub.subscribed_at}</td>
                                  <td className="px-4 py-2.5">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${sub.is_active ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                      {sub.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 text-[10px] font-semibold text-slate-400 border-t border-slate-200 dark:border-slate-700">
                          {subscriberList.length} total · {subscriberCount} active · emails will be sent to active subscribers only
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick email templates */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quick Templates</label>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { label: '🎉 Sale Offer', subject: '🎉 Big Sale is LIVE on Collabo!', msg: `Hi there!\n\nBig Sale is LIVE on Collabo right now!\n\nGet up to 50% OFF on top products. Limited time only — don't miss out!\n\n👉 Shop now: https://collabo.co.in\n\nUse code SALE50 at checkout for extra savings.\n\nHappy Shopping,\nTeam Collabo` },
                        { label: '🆕 New Arrivals', subject: '🆕 New Products Just Dropped on Collabo!', msg: `Hi there!\n\nExciting news — new products just dropped on Collabo!\n\nCheck out the latest arrivals — fresh styles, unbeatable prices.\n\n👉 Browse now: https://collabo.co.in\n\nBe the first to grab them before they sell out!\n\nHappy Shopping,\nTeam Collabo` },
                        { label: '⚡ Flash Deal', subject: '⚡ Flash Deal Alert — 24 Hours Only!', msg: `Hi there!\n\nFLASH DEAL ALERT!\n\nExclusive deals available for the next 24 hours only on Collabo.\n\nHurry — stock is limited!\n\n👉 Shop now: https://collabo.co.in\n\nDon't miss out!\n\nTeam Collabo` },
                      ].map((t, i) => (
                        <button key={i} onClick={() => { setEmailSubject(t.subject); setEmailMessage(t.msg); }}
                          className="text-left px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all">
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject *</label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={e => setEmailSubject(e.target.value)}
                      placeholder="e.g. Big Sale is LIVE on Collabo!"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-800 dark:text-white outline-none focus:border-blue-400 transition-colors"
                    />
                  </div>

                  {/* Message */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Message *</label>
                    <textarea
                      rows={8}
                      value={emailMessage}
                      onChange={e => setEmailMessage(e.target.value)}
                      placeholder="Write your email message here..."
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-800 dark:text-white outline-none focus:border-blue-400 resize-none transition-colors"
                    />
                    <p className="text-[10px] text-slate-400">{emailMessage.length} characters</p>
                  </div>

                  {/* Result */}
                  {emailResult && (
                    <div className={`rounded-2xl px-4 py-3 text-xs font-bold flex items-center gap-2 ${emailResult.error ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600' : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400'}`}>
                      {emailResult.error ? '❌' : '✅'} {emailResult.message || emailResult.error}
                      {!emailResult.error && emailResult.sent !== undefined && (
                        <span className="ml-auto text-slate-500 font-semibold">Sent: {emailResult.sent} | Failed: {emailResult.failed}</span>
                      )}
                    </div>
                  )}

                  {/* Send button */}
                  <button
                    onClick={async () => {
                      if (!emailSubject.trim()) { toast.error('Please enter a subject'); return; }
                      if (!emailMessage.trim()) { toast.error('Please write a message'); return; }
                      if (!window.confirm(`Send this email to all newsletter subscribers?`)) return;
                      setEmailSending(true);
                      setEmailResult(null);
                      try {
                        const res = await api.post('/ecommerce/newsletter/broadcast/', {
                          subject: emailSubject.trim(),
                          message: emailMessage.trim(),
                        });
                        setEmailResult(res.data);
                        setSubscriberCount(null);
                        toast.success(`Email sent to ${res.data.sent} subscribers!`);
                      } catch (err) {
                        const errMsg = err.response?.data?.error || 'Failed to send email';
                        setEmailResult({ error: errMsg });
                        toast.error(errMsg);
                      } finally {
                        setEmailSending(false);
                      }
                    }}
                    disabled={emailSending || !emailSubject.trim() || !emailMessage.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs py-4 rounded-2xl transition-colors flex items-center justify-center gap-2"
                  >
                    {emailSending ? (
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending Emails...</>
                    ) : (
                      <>✉️ Send Email to All Subscribers</>
                    )}
                  </button>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 rounded-2xl p-4 text-xs font-semibold text-blue-700 dark:text-blue-400 space-y-1">
                  <p className="font-black">📧 How email broadcast works</p>
                  <p>• Sends to all subscribers who signed up via the newsletter form in the footer.</p>
                  <p>• Requires Gmail SMTP or Brevo SMTP configured in server settings.</p>
                  <p>• Large lists may take 1-2 minutes — don't close the page until you see the result.</p>
                </div>
              </div>
            )}

            {/* Admin Ticket Management */}
            {adminView === 'tickets' && (user?.is_staff || user?.user_type === 'admin') && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h3 className="font-black text-lg dark:text-white flex items-center gap-2">
                    <Mail className="w-5 h-5 text-rose-500" /> Support Tickets
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">Manage customer support tickets. Reply and update status.</p>
                </div>
                {supportTickets.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">No support tickets found.</p>
                ) : (
                  <div className="space-y-4">
                    {supportTickets.map(ticket => (
                      <div key={ticket.id} className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-5 space-y-3 shadow-sm">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{ticket.ticket_number}</span>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${ticket.priority === 'high' ? 'bg-red-100 text-red-700' : ticket.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>{ticket.priority}</span>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${ticket.status === 'open' ? 'bg-blue-100 text-blue-700' : ticket.status === 'in_progress' ? 'bg-amber-100 text-amber-700' : ticket.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{ticket.status}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={ticket.status}
                              onChange={async (e) => {
                                try {
                                  await api.patch(`/support/tickets/${ticket.id}/`, { status: e.target.value });
                                  fetchSupportTickets();
                                  toast.success('Ticket status updated');
                                } catch (err) { toast.error('Failed to update status'); }
                              }}
                              className="text-[10px] font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 dark:text-white"
                            >
                              <option value="open">Open</option>
                              <option value="in_progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                              <option value="closed">Closed</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold dark:text-white">{ticket.subject}</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">By: {ticket.user_details?.username || 'User'} ({ticket.user_details?.email}) • {ticket.category} • {new Date(ticket.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-xl p-3">{ticket.message}</p>
                        {ticket.admin_reply && (
                          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                            <span className="text-[9px] font-black text-emerald-600 uppercase">Your Reply</span>
                            <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-1">{ticket.admin_reply}</p>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Type your reply..."
                            id={`reply-${ticket.id}`}
                            className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-white"
                          />
                          <button
                            onClick={async () => {
                              const input = document.getElementById(`reply-${ticket.id}`);
                              const reply = input?.value?.trim();
                              if (!reply) { toast.error('Please type a reply'); return; }
                              try {
                                await api.patch(`/support/tickets/${ticket.id}/`, { admin_reply: reply, status: 'resolved' });
                                input.value = '';
                                fetchSupportTickets();
                                toast.success('Reply sent & ticket resolved');
                              } catch (err) { toast.error('Failed to send reply'); }
                            }}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] px-4 py-2 rounded-xl transition-colors"
                          >
                            Reply & Resolve
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </main>

      {/* Media Upload Modal for Admin */}
      {mediaUploadProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-black text-sm dark:text-white">Upload Media for Influencers</h3>
                <p className="text-[10px] text-slate-400 font-semibold">{mediaUploadProduct.name}</p>
              </div>
              <button onClick={() => setMediaUploadProduct(null)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {/* Existing media */}
              {productMediaList.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Uploaded Media ({productMediaList.length})</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {productMediaList.map((m) => (
                      <div key={m.id} className="relative group rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                        {m.media_type === 'video' ? (
                          <div className="aspect-square flex items-center justify-center bg-slate-900">
                            <video src={m.file_url || m.file} className="w-full h-full object-cover" muted />
                            <div className="absolute inset-0 flex items-center justify-center"><Film className="w-5 h-5 text-white/70" /></div>
                          </div>
                        ) : (
                          <img src={m.file_url || m.file} alt={m.title} className="aspect-square w-full object-cover" />
                        )}
                        <button
                          onClick={() => deleteMedia(m.id)}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-black"
                        >X</button>
                        {m.title && <p className="text-[8px] text-slate-400 p-1 truncate">{m.title}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload new */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Upload New</p>
                <div className="flex gap-2">
                  <select value={mediaUploadType} onChange={(e) => setMediaUploadType(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs font-bold focus:outline-none dark:text-white">
                    <option value="image">Photo</option>
                    <option value="video">Video</option>
                  </select>
                  <input type="text" value={mediaUploadTitle} onChange={(e) => setMediaUploadTitle(e.target.value)}
                    placeholder="Title (optional)"
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs font-bold focus:outline-none dark:text-white" />
                </div>
                <label className="flex flex-col items-center justify-center gap-2 py-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <Film className="w-5 h-5 text-slate-400" />
                  <span className="text-xs font-bold text-slate-400">
                    {mediaUploadFiles.length > 0
                      ? mediaUploadFiles.map(f => f.name).join(', ')
                      : 'Click to select photos or videos'}
                  </span>
                  <input type="file" className="hidden" multiple
                    accept="image/*,video/*"
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      if (files.length > 0) {
                        setMediaUploadFiles(files);
                        if (files[0].type.startsWith('video')) setMediaUploadType('video');
                        else setMediaUploadType('image');
                      }
                    }} />
                </label>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
              <button onClick={() => setMediaUploadProduct(null)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors">
                Close
              </button>
              <button onClick={handleMediaUpload} disabled={mediaUploading || !mediaUploadFiles.length}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
                {mediaUploading ? 'Uploading...' : <><Film className="w-3.5 h-3.5" /> Upload</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {cancelModal && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => { setCancelModal(null); setCancelReason(''); setCancelComment(''); setCancelFiles([]); }}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="bg-rose-50 dark:bg-rose-950/30 px-6 pt-6 pb-4 text-center border-b border-rose-100 dark:border-rose-900/40">
              <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                <span className="text-2xl">🚫</span>
              </div>
              <h3 className="font-black text-base dark:text-white">Cancel Order</h3>
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Order ID: <span className="font-black text-slate-700 dark:text-slate-300">{cancelModal.order_id}</span></p>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">

              {/* Step 1: Reason dropdown */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <span className="w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] flex items-center justify-center font-black">1</span>
                  Select reason for cancellation *
                </label>
                <div className="relative">
                  <select
                    value={cancelReason}
                    onChange={e => { setCancelReason(e.target.value); if (e.target.value !== 'Other') setCancelComment(''); }}
                    className={`w-full appearance-none bg-slate-50 dark:bg-slate-800 border rounded-xl px-4 py-3 text-xs font-semibold outline-none transition-colors cursor-pointer pr-10 ${cancelReason ? 'border-rose-400 text-slate-800 dark:text-white' : 'border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'} focus:border-rose-400`}
                  >
                    <option value="" disabled>— Choose a reason —</option>
                    {CANCEL_REASONS.map(reason => (
                      <option key={reason} value={reason}>{reason}</option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </span>
                </div>
                {cancelReason && cancelReason !== 'Other' && (
                  <p className="text-[10px] font-semibold text-rose-500 flex items-center gap-1 pl-1">✓ Selected: {cancelReason}</p>
                )}
              </div>

              {/* Step 2: Additional details */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <span className="w-4 h-4 bg-slate-400 text-white rounded-full text-[9px] flex items-center justify-center font-black">2</span>
                  {cancelReason === 'Other' ? 'Describe your reason *' : 'Additional comments (optional)'}
                </label>
                <textarea
                  rows={3}
                  placeholder={cancelReason === 'Other' ? 'Please describe your reason...' : 'Any additional details? (optional)'}
                  value={cancelComment}
                  onChange={e => setCancelComment(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-white outline-none focus:border-rose-400 resize-none transition-colors"
                />
              </div>

              {/* Step 3: Attachments */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <span className="w-4 h-4 bg-slate-400 text-white rounded-full text-[9px] flex items-center justify-center font-black">3</span>
                  Attach proof — screenshots / images / videos (optional)
                </label>
                <label className="flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl py-4 px-3 cursor-pointer hover:border-rose-300 dark:hover:border-rose-700 hover:bg-rose-50/40 dark:hover:bg-rose-950/10 transition-all">
                  <span className="text-xl">📎</span>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Click to upload images or videos</span>
                  <span className="text-[9px] text-slate-400">JPG, PNG, MP4, MOV — max 10MB each</span>
                  <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={e => setCancelFiles(prev => [...prev, ...Array.from(e.target.files)])} />
                </label>
                {cancelFiles.length > 0 && (
                  <div className="space-y-1.5">
                    {cancelFiles.map((f, i) => (
                      <div key={i} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm shrink-0">{f.type.startsWith('video') ? '🎥' : '🖼️'}</span>
                          <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 truncate">{f.name}</span>
                          <span className="text-[9px] text-slate-400 shrink-0">{(f.size / 1024 / 1024).toFixed(1)}MB</span>
                        </div>
                        <button onClick={() => setCancelFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-rose-500 ml-2 font-black text-xs shrink-0 transition-colors">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-3 px-6 pb-6 pt-2">
              <button
                onClick={() => { setCancelModal(null); setCancelReason(''); setCancelComment(''); setCancelFiles([]); }}
                className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-bold text-xs py-3.5 rounded-xl transition-colors"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={cancellingOrder || !cancelReason || (cancelReason === 'Other' && !cancelComment.trim())}
                className="flex-1 bg-rose-500 hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs py-3.5 rounded-xl transition-colors shadow-sm"
              >
                {cancellingOrder ? 'Cancelling...' : 'Yes, Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {activeProfileModal === 'username' && (
        <ChangeUsernameModal isOpen={true} onClose={() => setActiveProfileModal(null)} />
      )}
      {activeProfileModal === 'password' && (
        <ChangePasswordModal isOpen={true} onClose={() => setActiveProfileModal(null)} />
      )}
      {activeProfileModal === 'delete' && (
        <DeleteAccountModal isOpen={true} onClose={() => setActiveProfileModal(null)} />
      )}

      {/* Confirm Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setConfirmModal(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto">
                <Info className="w-6 h-6 text-rose-500" />
              </div>
              <h3 className="text-base font-black text-slate-800 dark:text-white">{confirmModal.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{confirmModal.message}</p>
            </div>
            <div className="flex border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setConfirmModal(null)} className="flex-1 py-3 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                Go Back
              </button>
              <button onClick={confirmModal.onConfirm} className={`flex-1 py-3 text-xs font-bold text-white ${confirmModal.confirmColor || 'bg-rose-500 hover:bg-rose-600'} transition-colors`}>
                {confirmModal.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reward Points Modal */}
      {showRewardModal && user && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowRewardModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden max-h-[90vh] overflow-y-auto" style={{ scrollbarWidth: 'none' }} onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-4 flex items-center gap-3 relative">
              <button onClick={() => setShowRewardModal(false)} className="absolute top-3 right-3 text-white/70 hover:text-white"><X className="w-4 h-4" /></button>
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm flex-shrink-0">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white leading-none">{user.reward_points} <span className="text-sm font-bold text-white/80">Points</span></h2>
                <p className="text-[10px] text-white/70 font-semibold">Collabo Reward Points</p>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <h3 className="font-black text-[11px] text-slate-800 dark:text-white uppercase tracking-wider">How to Earn Points</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg p-2.5">
                  <div className="w-7 h-7 rounded-md bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                    <LogIn className="w-3.5 h-3.5 text-violet-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-bold text-slate-800 dark:text-white">Signup Bonus</p>
                    <p className="text-[9px] text-slate-500">Create a new account and get <span className="font-black text-violet-600">+10 points</span> instantly as a welcome gift!</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg p-2.5">
                  <div className="w-7 h-7 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-bold text-slate-800 dark:text-white">Purchase Rewards</p>
                    <p className="text-[9px] text-slate-500">For every <span className="font-black text-blue-600">₹100 you spend</span>, you earn <span className="font-black text-blue-600">1 reward point (₹1)</span>. Points are added automatically after your order is placed.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg p-2.5">
                  <div className="w-7 h-7 rounded-md bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                    <Star className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-bold text-slate-800 dark:text-white">Write a Review</p>
                    <p className="text-[9px] text-slate-500">Share your experience! You earn <span className="font-black text-emerald-600">+5 points</span> for every product review you write after purchasing.</p>
                  </div>
                </div>
              </div>

              <hr className="border-slate-100 dark:border-slate-800" />

              <h3 className="font-black text-[11px] text-slate-800 dark:text-white uppercase tracking-wider">How to Redeem</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2.5">
                  <div className="w-7 h-7 rounded-md bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-bold text-slate-800 dark:text-white">Apply at Checkout</p>
                    <p className="text-[9px] text-slate-500">Once you reach <span className="font-black text-amber-600">100 points</span>, a "Redeem" button appears at checkout. Each point = ₹1 discount on your order total.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 bg-rose-50 dark:bg-rose-900/20 rounded-lg p-2.5">
                  <div className="w-7 h-7 rounded-md bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center flex-shrink-0">
                    <Info className="w-3.5 h-3.5 text-rose-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-bold text-slate-800 dark:text-white">Important</p>
                    <p className="text-[9px] text-slate-500">Minimum <span className="font-black text-rose-600">100 points</span> needed to redeem. Points below 100 cannot be used. Keep shopping & reviewing to reach the threshold!</p>
                  </div>
                </div>
              </div>

              <hr className="border-slate-100 dark:border-slate-800" />

              <h3 className="font-black text-[11px] text-slate-800 dark:text-white uppercase tracking-wider">Examples</h3>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2.5 space-y-1.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-500">Create a new account</span>
                  <span className="font-black text-violet-600">+10 points (₹10)</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-500">Purchase worth ₹500</span>
                  <span className="font-black text-blue-600">+5 points (₹5)</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-500">Purchase worth ₹1,000</span>
                  <span className="font-black text-blue-600">+10 points (₹10)</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-500">Write a product review</span>
                  <span className="font-black text-emerald-600">+5 points (₹5)</span>
                </div>
                <hr className="border-slate-200 dark:border-slate-700" />
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-500 font-bold">Redeem 150 points</span>
                  <span className="font-black text-amber-600">₹150 off your order</span>
                </div>
              </div>

              <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-2.5 text-center">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                  {user.reward_points >= 100
                    ? <span className="text-emerald-600 dark:text-emerald-400 font-black">You can redeem ₹{user.reward_points} off at checkout!</span>
                    : <span>Earn <span className="font-black text-amber-600">{100 - user.reward_points} more</span> points to start redeeming.</span>
                  }
                </p>
              </div>

              <button
                onClick={() => { setShowRewardModal(false); setCurrentView('home'); }}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-[11px] py-2.5 rounded-xl hover:opacity-90 transition-opacity"
              >
                Shop & Earn More Points
              </button>
            </div>
          </div>
        </div>
      )}

      {referModalData && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setReferModalData(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-4 flex items-center gap-3 relative">
              <button onClick={() => setReferModalData(null)} className="absolute top-4 right-4 text-white/70 hover:text-white"><X className="w-4 h-4" /></button>
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm flex-shrink-0">
                <Gift className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-black text-white leading-tight">Refer & Earn</h2>
                <p className="text-[10px] text-white/80 font-medium">Earn wallet cash rewards</p>
              </div>
            </div>
            
            <div className="p-5 space-y-4">
              {/* Product Summary */}
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl p-3 flex gap-3 items-center">
                <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                  <Gift className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Product</p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{referModalData.product_name}</p>
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-3.5">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">How it works</p>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 flex items-center justify-center text-xs font-black shrink-0">
                      1
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-200">Copy your link</h4>
                      <p className="text-[10px] text-slate-400">Get the unique referral link generated for your account.</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 flex items-center justify-center text-xs font-black shrink-0">
                      2
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-200">Share it with friends</h4>
                      <p className="text-[10px] text-slate-400">Send the link to others or post it on social media platforms.</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-black shrink-0">
                      3
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                        Earn <span className="text-emerald-600 dark:text-emerald-400 font-black">{referModalData.link_discount_percent}% Cash Reward</span>
                      </h4>
                      <p className="text-[10px] text-slate-400">Get {referModalData.link_discount_percent}% of the order amount in your wallet when someone buys through your link.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Link Container */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Your Referral Link</p>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5">
                  <span className="flex-1 text-[10px] font-mono text-slate-600 dark:text-slate-300 truncate select-all">{referModalData.referral_link}</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(referModalData.referral_link); showToast('Referral link copied!'); }}
                    className="flex-shrink-0 p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors"
                    title="Copy link"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Share button */}
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: `${referModalData.product_name} on Collabo`,
                      text: `Check out ${referModalData.product_name} on Collabo! Use my link and we both benefit 🎁`,
                      url: referModalData.referral_link,
                    }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(referModalData.referral_link);
                    showToast('Referral link copied!');
                  }
                  setReferModalData(null);
                }}
                className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-black text-xs py-3 rounded-xl hover:opacity-95 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
              >
                <Share2 className="w-4 h-4" />
                Share & Earn
              </button>
            </div>
          </div>
        </div>
      )}

      {showInviteModal && user && (() => {
        const inviteLink = `${window.location.origin}/register?affiliate=${user.affiliate_code}`;
        return (
          <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowInviteModal(false)}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 px-7 py-6 flex items-center gap-4 relative">
                <button onClick={() => setShowInviteModal(false)} className="absolute top-4 right-4 text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm flex-shrink-0">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white leading-tight">Invite Friends</h2>
                  <p className="text-sm text-white/70 font-semibold">Your personal invite link</p>
                </div>
              </div>
              <div className="p-7 space-y-5">
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Share this link with friends and contacts who don't have an account yet. When they sign up through it, you earn a wallet reward on <span className="font-bold text-slate-700 dark:text-slate-200">every order they ever place</span> — and if you were invited by someone, they earn half of that too. 2 levels deep.
                </p>
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-4">
                  <span className="flex-1 text-sm font-mono text-slate-600 dark:text-slate-300 truncate">{inviteLink}</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(inviteLink); showToast('Invite link copied!'); }}
                    className="flex-shrink-0 p-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white transition-colors"
                    title="Copy link"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: 'Join me on Collabo',
                        text: 'Join Collabo using my invite link — sign up and start shopping!',
                        url: inviteLink,
                      }).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(inviteLink);
                      showToast('Invite link copied!');
                    }
                    setShowInviteModal(false);
                  }}
                  className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-black text-sm py-3.5 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Share2 className="w-5 h-5" />
                  Copy & Share
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {showWalletModal && walletData && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowWalletModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] overflow-y-auto" style={{ scrollbarWidth: 'none' }} onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 px-7 py-6 flex items-center gap-4 relative">
              <button onClick={() => setShowWalletModal(false)} className="absolute top-4 right-4 text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm flex-shrink-0">
                <Gift className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white leading-none">₹{walletData.balance}</h2>
                <p className="text-sm text-white/70 font-semibold">Referral Wallet Balance{walletData.pending > 0 ? ` · ₹${walletData.pending} pending` : ''}</p>
              </div>
            </div>
            <div className="p-7 space-y-5">
              <div className="flex items-center gap-3.5 bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                <div className="w-9 h-9 rounded-md bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                  <Gift className="w-4.5 h-4.5 text-violet-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800 dark:text-white">How it works</p>
                  <p className="text-xs text-slate-500">Tap "Refer & Earn" on any product to get your link. When someone buys through it, you earn a wallet reward — and if you were referred by someone, they earn half of that too.</p>
                </div>
              </div>

              {/* Withdraw as cash — redeemable any time, independent of checkout */}
              <div className="border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-violet-700 dark:text-violet-300">Withdraw as Cash</p>
                  {walletData.balance > 0 && (
                    <button
                      onClick={() => {
                        if (!showWithdrawForm) setWithdrawAmount(String(walletData.balance));
                        setShowWithdrawForm(!showWithdrawForm);
                      }}
                      className="text-xs font-black text-violet-600 hover:underline"
                    >
                      {showWithdrawForm ? 'Cancel' : 'Claim'}
                    </button>
                  )}
                </div>
                {walletData.balance <= 0 ? (
                  <p className="text-xs text-slate-500">You have ₹0 to withdraw right now — refer a product to start earning.</p>
                ) : showWithdrawForm ? (
                  <div className="space-y-3">
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      max={walletData.balance}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder={`Amount — up to ₹${walletData.balance}`}
                      className="w-full text-sm bg-white dark:bg-slate-800 border border-violet-200 dark:border-violet-700 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:text-white"
                    />

                    {walletData.bank_details && !editBankDetails ? (
                      <div className="flex items-center justify-between bg-white dark:bg-slate-800 border border-violet-200 dark:border-violet-700 rounded-lg px-3.5 py-3">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{walletData.bank_details.account_holder_name}</p>
                          <p className="text-xs text-slate-400 font-mono">••••{walletData.bank_details.account_number.slice(-4)} · {walletData.bank_details.ifsc_code}</p>
                        </div>
                        <button
                          onClick={() => {
                            setEditBankDetails(true);
                            setWithdrawAccountName(walletData.bank_details.account_holder_name);
                            setWithdrawAccountNumber(walletData.bank_details.account_number);
                            setWithdrawIfsc(walletData.bank_details.ifsc_code);
                          }}
                          className="text-xs font-black text-violet-600 hover:underline flex-shrink-0 ml-2"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <>
                        <input
                          type="text"
                          value={withdrawAccountName}
                          onChange={(e) => setWithdrawAccountName(e.target.value)}
                          placeholder="Account holder name"
                          className="w-full text-sm bg-white dark:bg-slate-800 border border-violet-200 dark:border-violet-700 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:text-white"
                        />
                        <input
                          type="text"
                          value={withdrawAccountNumber}
                          onChange={(e) => setWithdrawAccountNumber(e.target.value.replace(/\D/g, ''))}
                          placeholder="Bank account number"
                          className="w-full text-sm bg-white dark:bg-slate-800 border border-violet-200 dark:border-violet-700 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:text-white"
                        />
                        <input
                          type="text"
                          value={withdrawIfsc}
                          onChange={(e) => setWithdrawIfsc(e.target.value.toUpperCase())}
                          placeholder="IFSC code"
                          className="w-full text-sm bg-white dark:bg-slate-800 border border-violet-200 dark:border-violet-700 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:text-white uppercase"
                        />
                      </>
                    )}

                    <p className="text-xs text-slate-400">
                      {walletData.bank_details ? "This is a one-time save — you won't be asked again unless you tap Change." : "Saved after your first request — you won't need to enter it again."}
                    </p>

                    <button
                      onClick={handleWithdraw}
                      disabled={withdrawing}
                      className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-black px-4 py-3 rounded-lg transition-colors"
                    >
                      {withdrawing ? 'Requesting...' : 'Request Withdrawal'}
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Request a cash withdrawal any time — an admin reviews and processes it to your bank.</p>
                )}
              </div>

              {walletPayouts.length > 0 && (
                <>
                  <h3 className="font-black text-sm text-slate-800 dark:text-white uppercase tracking-wider pt-1">Withdrawal Requests</h3>
                  <div className="space-y-2">
                    {walletPayouts.map(p => (
                      <div key={p.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-lg p-3.5">
                        <div>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">₹{p.amount}</p>
                          <p className="text-xs text-slate-400">{new Date(p.requested_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <span className={`text-xs font-black px-2.5 py-1 rounded-full ${p.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : p.status === 'rejected' ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-500' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'}`}>
                          {p.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <h3 className="font-black text-sm text-slate-800 dark:text-white uppercase tracking-wider pt-1">Recent Activity</h3>
              {walletData.transactions.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No referral earnings yet — start sharing product links!</p>
              ) : (
                <div className="space-y-2">
                  {walletData.transactions.map(tx => (
                    <div key={tx.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-lg p-3.5">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{tx.reason}</p>
                        <p className="text-xs text-slate-400">{new Date(tx.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {tx.level === 0 ? 'Redeemed' : tx.level === 2 ? 'Upline bonus' : 'Direct referral'}</p>
                      </div>
                      <span className={`text-sm font-black flex-shrink-0 ml-2 ${tx.amount < 0 ? 'text-rose-500' : tx.status === 'completed' ? 'text-emerald-600' : tx.status === 'pending' ? 'text-amber-500' : 'text-slate-400 line-through'}`}>{tx.amount < 0 ? '-' : '+'}₹{Math.abs(tx.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 px-6 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-md z-50 flex items-center gap-3 animate-slideIn ${
          toastType === 'error'
            ? 'bg-red-600/95 dark:bg-red-500/95 text-white border-red-700 dark:border-red-400'
            : 'bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-950 border-slate-800 dark:border-slate-200'
        }`}>
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs text-white shrink-0 ${toastType === 'error' ? 'bg-white/20' : 'bg-orange-500'}`}>
            {toastType === 'error' ? '✕' : '✓'}
          </div>
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {lightboxImage && (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxImage}
            alt="Preview"
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Mobile Bottom Navigation (Flipkart Style) */}
      {!inlineMode && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-around items-center h-16 z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button onClick={() => setCurrentView('home')} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${currentView === 'home' ? 'text-orange-500' : 'text-slate-500 dark:text-slate-400'}`}>
            <HomeIcon className="w-5 h-5" />
            <span className="text-[10px] font-bold">Home</span>
          </button>
          <button onClick={() => setCurrentView('categories')} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${currentView === 'categories' ? 'text-orange-500' : 'text-slate-500 dark:text-slate-400'}`}>
            <LayoutGrid className="w-5 h-5" />
            <span className="text-[10px] font-bold">Categories</span>
          </button>
          <button onClick={() => setCurrentView('cart')} className={`relative flex flex-col items-center justify-center w-full h-full space-y-1 ${currentView === 'cart' ? 'text-orange-500' : 'text-slate-500 dark:text-slate-400'}`}>
            <div className="relative">
              <ShoppingCart className="w-5 h-5" />
              {cart.length > 0 && <span className="absolute -top-1.5 -right-2.5 w-4 h-4 bg-orange-500 text-[9px] font-black text-white rounded-full flex items-center justify-center">{cart.reduce((s, i) => s + i.quantity, 0)}</span>}
            </div>
            <span className="text-[10px] font-bold">Cart</span>
          </button>
          <button onClick={() => isLoggedIn ? setCurrentView('profile') : setCurrentView('auth')} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${['profile', 'auth'].includes(currentView) ? 'text-orange-500' : 'text-slate-500 dark:text-slate-400'}`}>
            <User className="w-5 h-5" />
            <span className="text-[10px] font-bold">Account</span>
          </button>
        </div>
      )}

      {/* Influencer Collab Hub Overlay — shown via "Collab Hub" button, closed by browser back */}
      {showHub && user?.user_type === 'influencer' && (
        <div className="fixed inset-0 z-[200] bg-white overflow-auto">
          <Suspense fallback={<div className="flex items-center justify-center h-screen text-sm text-gray-500">Loading...</div>}>
            <InfluencerHub onClose={() => { setShowHub(false); window.history.back(); }} />
          </Suspense>
        </div>
      )}

    </div>
  );
}
