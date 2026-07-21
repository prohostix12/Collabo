import React, { useState, useEffect } from 'react';
import { Heart, Star, ShoppingBag, ArrowRight } from 'lucide-react';

const WeeklyBestDealsSection = ({
  productsList = [],
  addToCart,
  toggleWishlist,
  wishlist = [],
  setSelectedProduct,
  setCurrentView,
  setFilterCategory,
  storeSettings = {}
}) => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [timeLeft, setTimeLeft] = useState(85420); // seconds for timer countdown

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 86400));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (totalSec) => {
    const days = Math.floor(totalSec / 86400);
    const hrs = Math.floor((totalSec % 86400) / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return {
      d: String(days).padStart(2, '0'),
      h: String(hrs).padStart(2, '0'),
      m: String(mins).padStart(2, '0'),
      s: String(secs).padStart(2, '0')
    };
  };

  const timer = formatCountdown(timeLeft);

  // Admin configurable product selection or auto fallback
  const adminDeals = storeSettings.weekly_deals_product_ids && storeSettings.weekly_deals_product_ids.length > 0
    ? productsList.filter(p => storeSettings.weekly_deals_product_ids.includes(p.id))
    : productsList;

  // Dynamically filter products based on selected tab pill
  const getFilteredProducts = () => {
    let res = [];
    if (activeFilter === 'Up to 70% Off') {
      res = productsList.filter(p => {
        const disc = p.discountPercent || (p.price && p.discountPrice && p.price > p.discountPrice ? Math.round(((p.price - p.discountPrice) / p.price) * 100) : 0);
        return disc >= 25;
      });
    } else if (activeFilter === 'Under ₹499') {
      res = productsList.filter(p => (p.discountPrice || p.price || 0) <= 499);
    } else if (activeFilter === 'Almost Sold Out') {
      res = productsList.filter(p => (p.stock || 10) <= 20);
    } else if (activeFilter !== 'All') {
      res = productsList.filter(p => p.category === activeFilter);
    } else {
      res = adminDeals.length > 0 ? adminDeals : productsList;
    }
    return res;
  };

  const filtered = getFilteredProducts();
  const displayProducts = filtered.length > 0 ? filtered.slice(0, 5) : productsList.slice(0, 5);

  // Banner data (admin editable with default fallbacks)
  const b1 = storeSettings.weekly_banner1 || {
    tag: '— Gadget Collection',
    title: 'FITNESS & SMART SPECIAL OFFERS',
    subtitle: 'Track health & stay connected everywhere',
    badge: 'Up to 60% OFF',
    category: 'Electronics'
  };

  const b2 = storeSettings.weekly_banner2 || {
    tag: '— Jewellery & Elegance',
    title: 'TIMLESS JEWELLERY SELECTION',
    subtitle: 'Earrings, jhumkas & designer pieces',
    badge: 'Starts @ ₹59',
    category: 'Jewellery'
  };

  const b3 = storeSettings.weekly_banner3 || {
    tag: '— Home Essentials',
    title: 'HOME & KITCHEN BESTSELLERS',
    subtitle: 'Choppers, mops & daily utility items',
    badge: 'Starts @ ₹149',
    category: 'Home & Kitchen'
  };

  const sampleImages = {
    b1: productsList.find(p => p.category === 'Electronics')?.image || productsList[0]?.image,
    b2: productsList.find(p => p.category === 'Jewellery')?.image || productsList[1]?.image,
    b3: productsList.find(p => p.category === 'Home & Kitchen')?.image || productsList[2]?.image,
  };

  return (
    <section className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] mt-8 sm:mt-12 mb-10">
      <div className="bg-gradient-to-r from-[#0F232D] via-[#1A3847] to-[#0F232D] rounded-none py-10 sm:py-14 px-4 sm:px-8 lg:px-12 shadow-xl relative overflow-hidden border-y border-cyan-900/30">
        {/* Background glow graphics */}
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-cyan-400/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto w-full">
          {/* Top Header: Title + Countdown Timer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
                {storeSettings.weekly_deals_title || 'Weekly Best Deals'}
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm font-medium mt-1">
                Handpicked top-rated products at unbeatable prices this week.
              </p>
            </div>

            {/* Countdown timer display */}
            <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-800 shadow-lg">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Limited time only!</span>
              <div className="flex items-center gap-1 font-mono text-xs sm:text-sm font-black">
                <span className="bg-rose-500 text-white px-2.5 py-1 rounded-lg shadow-sm">{timer.d}</span>
                <span className="text-rose-400 font-bold">:</span>
                <span className="bg-rose-500 text-white px-2.5 py-1 rounded-lg shadow-sm">{timer.h}</span>
                <span className="text-rose-400 font-bold">:</span>
                <span className="bg-rose-500 text-white px-2.5 py-1 rounded-lg shadow-sm">{timer.m}</span>
                <span className="text-rose-400 font-bold">:</span>
                <span className="bg-rose-500 text-white px-2.5 py-1 rounded-lg shadow-sm">{timer.s}</span>
              </div>
            </div>
          </div>

          {/* Filter Pills Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none relative z-10">
            {[
              'All',
              'Up to 70% Off',
              'Under ₹499',
              'Almost Sold Out',
              'Beauty & Personal Care',
              'Jewellery',
              'Electronics',
              'Home & Kitchen',
              'Mobile Accessories'
            ].map((pill) => {
              const isActive = activeFilter === pill;
              return (
                <button
                  key={pill}
                  onClick={() => setActiveFilter(pill)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 border ${
                    isActive
                      ? 'bg-orange-500 text-white border-orange-500 shadow-md scale-105'
                      : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-orange-500/50 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  {pill}
                </button>
              );
            })}
          </div>

        {/* 5 Product Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 sm:gap-4 mb-8 relative z-10">
          {displayProducts.map((product) => {
            const discount = product.discountPercent || (product.price && product.discountPrice && product.price > product.discountPrice ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 35);
            const inWishlist = wishlist.includes(product.id);
            return (
              <div
                key={product.id}
                className="bg-white dark:bg-slate-900 rounded-xl p-2.5 shadow-md hover:shadow-lg transition-all duration-300 flex flex-col justify-between group relative border border-white/20 dark:border-slate-800"
              >
                {/* Discount Tag */}
                <div className="absolute top-2 left-2 bg-rose-500 text-white text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded z-10 shadow-sm">
                  {discount}% OFF
                </div>

                {/* Wishlist Button */}
                <button
                  onClick={() => toggleWishlist(product)}
                  className="absolute top-2 right-2 p-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-md shadow-sm text-slate-400 hover:text-rose-500 transition-colors z-10 border border-slate-100 dark:border-slate-700"
                >
                  <Heart className={`w-3 h-3 ${inWishlist ? 'fill-rose-500 text-rose-500' : ''}`} />
                </button>

                {/* Product Image Container */}
                <div
                  onClick={() => { setSelectedProduct(product); setCurrentView('details'); }}
                  className="w-full aspect-square rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800/70 cursor-pointer mb-2 p-1.5 flex items-center justify-center border border-slate-100 dark:border-slate-800"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Minimal Meta Info */}
                <div className="space-y-2 pt-0.5">
                  {/* Category & Star Rating */}
                  <div className="flex items-center justify-between gap-1 text-[9px]">
                    <span className="font-bold text-cyan-800 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/80 px-1.5 py-0.5 rounded-full truncate max-w-[60%]">
                      {product.brand || product.category || 'Select'}
                    </span>
                    <div className="flex items-center gap-0.5 font-bold text-slate-700 dark:text-slate-200">
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      <span>{product.rating || 4.8}</span>
                    </div>
                  </div>

                  {/* Single Row: Price on Left + Add to Cart Button on Right */}
                  <div className="flex items-center justify-between gap-1 pt-0.5">
                    {/* Price Block */}
                    <div className="flex flex-col">
                      <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight">
                        ₹{Number(product.discountPrice || product.price).toLocaleString()}
                      </span>
                      {product.discountPrice && (
                        <span className="text-[8px] text-slate-400 line-through leading-none">
                          ₹{Number(product.price).toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Compact Add to Cart CTA */}
                    <button
                      onClick={() => addToCart(product)}
                      className="bg-orange-500 hover:bg-orange-600 text-white font-black text-[9px] sm:text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition-all hover:shadow-md uppercase tracking-wider whitespace-nowrap"
                    >
                      <ShoppingBag className="w-3 h-3" /> Add
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom 3 Promo Banners Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
          {/* Banner 1: Mint Teal / Electronics */}
          <div className="bg-[#EAF7F5] dark:bg-slate-900 border border-teal-100 dark:border-slate-800 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[160px] group shadow-sm hover:shadow-md transition-shadow">
            <div className="z-10 max-w-[65%]">
              <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider block mb-1">
                {b1.tag}
              </span>
              <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight mb-1">
                {b1.title}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                {b1.subtitle}
              </p>
              <button
                onClick={() => { setFilterCategory(b1.category); setCurrentView('listing'); }}
                className="bg-[#0B2E28] hover:bg-[#071F1B] text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-transform group-hover:translate-x-1"
              >
                Shop Now <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {sampleImages.b1 && (
              <img
                src={sampleImages.b1}
                alt=""
                className="absolute right-2 bottom-2 w-28 h-28 object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-300 pointer-events-none"
              />
            )}
          </div>

          {/* Banner 2: Warm Amber / Jewellery */}
          <div className="bg-[#FFF6E9] dark:bg-slate-900 border border-amber-100 dark:border-slate-800 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[160px] group shadow-sm hover:shadow-md transition-shadow">
            <div className="z-10 max-w-[65%]">
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block mb-1">
                {b2.tag}
              </span>
              <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight mb-1">
                {b2.title}
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300 font-bold mb-4">
                {b2.badge}
              </p>
              <button
                onClick={() => { setFilterCategory(b2.category); setCurrentView('listing'); }}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-transform group-hover:translate-x-1"
              >
                Shop Now <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {sampleImages.b2 && (
              <img
                src={sampleImages.b2}
                alt=""
                className="absolute right-2 bottom-2 w-28 h-28 object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-300 pointer-events-none"
              />
            )}
          </div>

          {/* Banner 3: Soft Blue / Home & Kitchen */}
          <div className="bg-[#EBF5FF] dark:bg-slate-900 border border-blue-100 dark:border-slate-800 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[160px] group shadow-sm hover:shadow-md transition-shadow">
            <div className="z-10 max-w-[65%]">
              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider block mb-1">
                {b3.tag}
              </span>
              <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight mb-1">
                {b3.title}
              </h4>
              <p className="text-xs text-blue-800 dark:text-blue-300 font-bold mb-4">
                {b3.badge}
              </p>
              <button
                onClick={() => { setFilterCategory(b3.category); setCurrentView('listing'); }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-transform group-hover:translate-x-1"
              >
                Shop Now <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {sampleImages.b3 && (
              <img
                src={sampleImages.b3}
                alt=""
                className="absolute right-2 bottom-2 w-28 h-28 object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-300 pointer-events-none"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  </section>
);
};

export default WeeklyBestDealsSection;
