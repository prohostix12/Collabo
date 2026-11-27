import React, { useState, useMemo, useEffect } from 'react';
import { Heart, Star, ShoppingBag, Sparkles, Flame } from 'lucide-react';

/**
 * Genuine product-discovery sections driven by real data, not static banner
 * text: "New Arrivals" sorts by actual listing creation date, "Best Sellers"
 * sorts by actual units sold (Product.purchase_count from confirmed orders).
 */
const DiscoverySections = ({ productsList = [], addToCart, toggleWishlist, wishlist = [], setSelectedProduct, setCurrentView, showNewArrivals = true, showBestSellers = true }) => {
  const [tab, setTab] = useState(showNewArrivals ? 'new' : 'best');

  useEffect(() => {
    if (tab === 'new' && !showNewArrivals) setTab('best');
    else if (tab === 'best' && !showBestSellers) setTab('new');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showNewArrivals, showBestSellers]);

  const newArrivals = useMemo(() => {
    return [...productsList]
      .filter(p => p.stock > 0)
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 10);
  }, [productsList]);

  const bestSellers = useMemo(() => {
    return [...productsList]
      .filter(p => (p.purchaseCount || 0) > 0)
      .sort((a, b) => (b.purchaseCount || 0) - (a.purchaseCount || 0))
      .slice(0, 10);
  }, [productsList]);

  if (!showNewArrivals && !showBestSellers) return null;

  const display = tab === 'new' ? newArrivals : bestSellers;
  if (newArrivals.length === 0 && bestSellers.length === 0) return null;

  return (
    <section className="mt-8 sm:mt-12 mb-10">
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-2">
          {showNewArrivals && (
            <button
              onClick={() => setTab('new')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-black transition-all border ${tab === 'new' ? 'bg-slate-950 text-white border-slate-950 shadow-md' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700'}`}
            >
              <Sparkles className="w-3.5 h-3.5" /> New Arrivals
            </button>
          )}
          {showBestSellers && (
            <button
              onClick={() => setTab('best')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-black transition-all border ${tab === 'best' ? 'bg-slate-950 text-white border-slate-950 shadow-md' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700'}`}
            >
              <Flame className="w-3.5 h-3.5" /> Best Sellers
            </button>
          )}
        </div>
        <p className="hidden sm:block text-[11px] text-slate-400 font-semibold">
          {tab === 'new' ? 'Freshly listed products, newest first' : 'Ranked by units actually sold'}
        </p>
      </div>

      {display.length === 0 ? (
        <p className="text-xs text-slate-400 font-semibold">
          {tab === 'new' ? 'No new arrivals right now.' : 'No sales yet — check back soon.'}
        </p>
      ) : (
        <div className="flex gap-3.5 sm:gap-4 overflow-x-auto pb-2 scrollbar-none">
          {display.map((product, idx) => {
            const inWishlist = wishlist.includes(product.id);
            return (
              <div
                key={product.id}
                className="shrink-0 w-[150px] sm:w-[180px] bg-white dark:bg-slate-900 rounded-xl p-2.5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group relative border border-slate-100 dark:border-slate-800"
              >
                {tab === 'best' && (
                  <div className="absolute top-2 left-2 bg-rose-500 text-white text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded z-10 shadow-sm">
                    #{idx + 1} Seller
                  </div>
                )}
                {tab === 'new' && (
                  <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded z-10 shadow-sm">
                    NEW
                  </div>
                )}

                <button
                  onClick={() => toggleWishlist(product)}
                  className="absolute top-2 right-2 p-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-md shadow-sm text-slate-400 hover:text-rose-500 transition-colors z-10 border border-slate-100 dark:border-slate-700"
                >
                  <Heart className={`w-3 h-3 ${inWishlist ? 'fill-rose-500 text-rose-500' : ''}`} />
                </button>

                <div
                  onClick={() => { setSelectedProduct(product); setCurrentView('details'); }}
                  className="w-full aspect-square rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800/70 cursor-pointer mb-2 p-1.5 flex items-center justify-center border border-slate-100 dark:border-slate-800"
                >
                  <img loading="lazy" src={product.image} alt={product.name} className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300" />
                </div>

                <div className="space-y-1.5 pt-0.5">
                  <h4
                    onClick={() => { setSelectedProduct(product); setCurrentView('details'); }}
                    className="text-[11px] font-bold text-slate-700 dark:text-slate-200 line-clamp-1 cursor-pointer"
                  >
                    {product.name}
                  </h4>
                  <div className="flex items-center justify-between gap-1 text-[9px]">
                    <div className="flex items-center gap-0.5 font-bold text-slate-700 dark:text-slate-200">
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      <span>{product.rating || 4.5}</span>
                    </div>
                    {tab === 'best' && product.purchaseCount > 0 && (
                      <span className="text-slate-400 font-semibold">{product.purchaseCount} bought</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-1 pt-0.5">
                    <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight">
                      ₹{Number(product.discountPrice || product.price).toLocaleString()}
                    </span>
                    <button
                      onClick={() => addToCart(product)}
                      className="bg-orange-500 hover:bg-orange-600 text-white font-black text-[9px] px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition-all"
                    >
                      <ShoppingBag className="w-3 h-3" /> Add
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default DiscoverySections;
