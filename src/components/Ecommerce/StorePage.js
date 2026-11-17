import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Store, Search, BadgeCheck, Share2, ShoppingCart, Heart, User } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Footer from '../Layout/Footer';

const CollaboNavbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [siteSearch, setSiteSearch] = useState('');

  const submitSearch = (e) => {
    e.preventDefault();
    if (siteSearch.trim()) navigate(`/?search=${encodeURIComponent(siteSearch.trim())}`);
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3 sm:gap-5">
        <Link to="/" className="flex items-center shrink-0 w-[90px] sm:w-[130px]">
          <img src="/collabo-logo.png" alt="Collabo" className="h-7 sm:h-9 object-contain scale-[2.0] origin-left transform" />
        </Link>
        <form onSubmit={submitSearch} className="relative flex-1 max-w-md hidden sm:block">
          <input
            value={siteSearch} onChange={(e) => setSiteSearch(e.target.value)}
            placeholder="Search catalog..."
            className="w-full bg-gray-50 border border-gray-200 rounded-full py-2 pl-9 pr-4 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
          />
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
        </form>
        <div className="flex items-center gap-1 ml-auto">
          <Link to="/?view=wishlist" className="p-2 rounded-xl hover:bg-gray-100 text-gray-500" title="Wishlist"><Heart className="w-4 h-4" /></Link>
          <Link to="/?view=cart" className="p-2 rounded-xl hover:bg-gray-100 text-gray-500" title="Cart"><ShoppingCart className="w-4 h-4" /></Link>
          <Link to={user ? '/?view=profile' : '/?view=auth'} className="hidden sm:flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 py-1.5 px-3 rounded-xl text-[11px] font-extrabold transition-colors">
            <User className="w-3.5 h-3.5" /> {user ? 'My Account' : 'Login'}
          </Link>
        </div>
      </div>
    </div>
  );
};

const StorePage = () => {
  const { slug } = useParams();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [q, setQ] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await api.get(`/auth/store/${slug}/`);
        if (cancelled) return;
        setStore(res.data);
        const prodRes = await api.get('/ecommerce/products/', { params: { seller: res.data.seller_id, status: 'approved', page_size: 100 } });
        if (cancelled) return;
        setProducts(prodRes.data.results || prodRes.data || []);
      } catch (e) {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  const categories = useMemo(() => {
    const seen = new Map();
    products.forEach((p) => { if (p.category) seen.set(p.category, (seen.get(p.category) || 0) + 1); });
    return [...seen.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name]) => name);
  }, [products]);

  const filtered = useMemo(() => {
    let list = products;
    if (activeTab !== 'all') list = list.filter((p) => p.category === activeTab);
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      list = list.filter((p) => (p.name || '').toLowerCase().includes(needle) || (p.category || '').toLowerCase().includes(needle));
    }
    return list;
  }, [products, q, activeTab]);

  const shareStore = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) { await navigator.share({ title: store.store_name, url }); return; }
      await navigator.clipboard.writeText(url);
      toast.success('Store link copied');
    } catch { /* user cancelled share sheet — nothing to do */ }
  };

  if (loading) {
    return (
      <>
        <CollaboNavbar />
        <div className="min-h-[60vh] flex items-center justify-center bg-gray-50">
          <div className="w-7 h-7 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      </>
    );
  }
  if (notFound || !store) {
    return (
      <>
        <CollaboNavbar />
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-gray-500 bg-gray-50">
          <Store className="w-10 h-10 text-gray-300" />
          <p className="font-medium">This store doesn't exist or isn't live yet.</p>
          <Link to="/" className="text-orange-600 font-semibold hover:underline text-sm">Back to Collabo</Link>
        </div>
      </>
    );
  }

  const featuredIds = new Set(store.featured_product_ids || []);
  const featured = products.filter((p) => featuredIds.has(p.id));
  const theme = store.store_theme_color || '#f97316';
  const searching = q.trim().length > 0;
  const tabs = [{ key: 'all', label: 'Home' }, ...categories.map((c) => ({ key: c, label: c }))];

  return (
    <>
    <CollaboNavbar />
    <div className="min-h-screen bg-gray-50">
      {/* Full-bleed banner */}
      <div className="relative h-36 sm:h-52 w-full overflow-hidden" style={{ background: store.store_banner ? undefined : `linear-gradient(135deg, ${theme}, ${theme}aa)` }}>
        {store.store_banner && <img src={store.store_banner} alt="" className="w-full h-full object-cover" />}
      </div>

      {/* Store identity + actions row */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white shadow border border-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
            {store.store_logo ? <img src={store.store_logo} alt={store.store_name} className="w-full h-full object-cover" /> : <Store className="w-5 h-5 text-gray-300" />}
          </div>
          <div className="min-w-0 mr-auto">
            <h1 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-1.5 truncate">
              {store.store_name}
              <BadgeCheck className="w-4 h-4 text-orange-500 shrink-0" />
            </h1>
            {store.store_tagline && <p className="text-gray-500 text-xs truncate">{store.store_tagline}</p>}
          </div>
          <button onClick={shareStore} className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors shrink-0" title="Share this store">
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tab nav + search, Amazon-storefront style */}
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-4 overflow-x-auto">
          <div className="flex items-center gap-5 shrink-0">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`py-2.5 text-xs font-bold uppercase tracking-wide whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === t.key ? 'text-gray-900' : 'text-gray-400 border-transparent hover:text-gray-600'
                }`}
                style={activeTab === t.key ? { borderColor: theme } : undefined}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[160px] max-w-xs ml-auto my-2">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              value={q} onChange={(e) => setQ(e.target.value)}
              placeholder={`Search ${store.store_name}`}
              className="w-full bg-gray-100 rounded-full pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:bg-white transition-colors"
            />
          </div>
        </div>
      </div>

      {activeTab === 'all' && !searching && (store.store_sections || []).length > 0 && (
        <div className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
          {store.store_sections.map((sec) => (
            <CustomSection key={sec.id} section={sec} products={products} categories={categories} onCategoryClick={setActiveTab} />
          ))}
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        {store.store_description && activeTab === 'all' && !searching && (
          <p className="text-sm text-gray-600 max-w-2xl">{store.store_description}</p>
        )}

        {activeTab === 'all' && !searching && featured.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5">
              <span className="w-1 h-4 rounded-full" style={{ backgroundColor: theme }} /> Featured
            </h2>
            <ProductGrid products={featured} />
          </section>
        )}

        <section>
          <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5">
            <span className="w-1 h-4 rounded-full bg-gray-300" />
            {searching ? `Results for "${q}"` : activeTab === 'all' ? 'All products' : activeTab} ({filtered.length})
          </h2>
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 py-16 text-center">
              {products.length === 0 ? "This store hasn't listed any products yet." : 'No products match here.'}
            </p>
          ) : (
            <ProductGrid products={activeTab === 'all' && !searching && featured.length ? filtered.filter((p) => !featuredIds.has(p.id)) : filtered} />
          )}
        </section>
      </div>
    </div>
    <Footer />
    </>
  );
};

const SIZE_H = { sm: 'h-32 sm:h-44', md: 'h-44 sm:h-64', lg: 'h-56 sm:h-80' };

const resolveLink = (link) => {
  if (!link) return null;
  if (/^\d+$/.test(link.trim())) return { to: `/?pid=${link.trim()}` };
  if (/^https?:\/\//i.test(link)) return { href: link };
  return { to: link };
};

const SectionLink = ({ link, className, children }) => {
  const resolved = resolveLink(link);
  if (!resolved) return <div className={className}>{children}</div>;
  if (resolved.href) return <a href={resolved.href} target="_blank" rel="noreferrer" className={className}>{children}</a>;
  return <Link to={resolved.to} className={className}>{children}</Link>;
};

const CarouselSection = ({ section }) => {
  const slides = (section.slides || []).filter((s) => s.image);
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % slides.length), 4000);
    return () => clearInterval(t);
  }, [slides.length]);
  if (slides.length === 0) return null;
  const h = SIZE_H[section.size || 'md'];
  return (
    <div className={`relative ${h} w-full rounded-2xl overflow-hidden group`}>
      {slides.map((s, i) => (
        <SectionLink key={i} link={s.link} className={`absolute inset-0 transition-opacity duration-500 ${i === idx ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <img src={s.image} alt={s.title || ''} className="w-full h-full object-cover" />
          {s.title && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
              <p className="text-white font-bold text-sm sm:text-base">{s.title}</p>
            </div>
          )}
        </SectionLink>
      ))}
      {slides.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)} className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? 'w-4 bg-white' : 'bg-white/50'}`} />
          ))}
        </div>
      )}
    </div>
  );
};

const PromoSection = ({ section }) => {
  if (!section.image) return null;
  const h = SIZE_H[section.size || 'md'];
  return (
    <SectionLink link={section.link} className={`relative ${h} w-full rounded-2xl overflow-hidden block`}>
      <img src={section.image} alt={section.title || ''} className="w-full h-full object-cover" />
      {(section.title || section.subtitle) && (
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/10 to-transparent flex flex-col justify-center px-5 sm:px-8">
          {section.title && <p className="text-white font-black text-lg sm:text-2xl max-w-xs">{section.title}</p>}
          {section.subtitle && <p className="text-white/90 text-xs sm:text-sm mt-1 max-w-xs">{section.subtitle}</p>}
        </div>
      )}
    </SectionLink>
  );
};

const FeaturedSection = ({ section, products }) => {
  const ids = section.product_ids || [];
  const items = ids.map((id) => products.find((p) => p.id === id)).filter(Boolean);
  if (items.length === 0) return null;
  const colClass = { 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-3 md:grid-cols-4', 5: 'sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5' }[section.columns || 4];
  return (
    <section>
      {section.title && <h2 className="text-sm font-bold text-gray-900 mb-3">{section.title}</h2>}
      <div className={`grid grid-cols-2 ${colClass} gap-3`}>
        {items.map((p) => (
          <Link key={p.id} to={`/?pid=${p.id}`} className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <div className="aspect-square bg-gray-100 overflow-hidden">
              {p.image && <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />}
            </div>
            <div className="p-2.5">
              <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug min-h-[2rem]">{p.name}</p>
              <span className="text-sm font-black text-gray-900">₹{p.discount_price || p.price}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

const CategoryStripSection = ({ section, categories, onCategoryClick }) => {
  const tiles = (section.categories || []).filter((c) => c.name).length > 0
    ? section.categories.filter((c) => c.name)
    : categories.map((name) => ({ name, image: '' }));
  if (tiles.length === 0) return null;
  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-1">
      {tiles.map((c, i) => (
        <button key={i} onClick={() => onCategoryClick(c.name)} className="flex flex-col items-center gap-1.5 shrink-0 group">
          <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center group-hover:border-orange-300 transition-colors">
            {c.image ? <img src={c.image} alt="" className="w-full h-full object-cover" /> : <Store className="w-5 h-5 text-gray-300" />}
          </div>
          <span className="text-[11px] font-semibold text-gray-700 max-w-[72px] truncate">{c.name}</span>
        </button>
      ))}
    </div>
  );
};

const CustomSection = ({ section, products, categories, onCategoryClick }) => {
  if (section.type === 'carousel') return <CarouselSection section={section} />;
  if (section.type === 'promo') return <PromoSection section={section} />;
  if (section.type === 'featured') return <FeaturedSection section={section} products={products} />;
  if (section.type === 'category_strip') return <CategoryStripSection section={section} categories={categories} onCategoryClick={onCategoryClick} />;
  return null;
};

const ProductGrid = ({ products }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
    {products.map((p) => (
      <Link key={p.id} to={`/?pid=${p.id}`} className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all">
        <div className="aspect-square bg-gray-100 overflow-hidden">
          {p.image && <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />}
        </div>
        <div className="p-2.5">
          <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug min-h-[2rem]">{p.name}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-sm font-black text-gray-900">₹{p.discount_price || p.price}</span>
            {p.discount_price && Number(p.discount_price) < Number(p.price) && (
              <span className="text-[10px] text-gray-400 line-through">₹{p.price}</span>
            )}
          </div>
        </div>
      </Link>
    ))}
  </div>
);

export default StorePage;
