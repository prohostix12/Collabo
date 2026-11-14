import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Store, Search, BadgeCheck, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Layout from '../Layout/Layout';

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
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center bg-gray-50">
          <div className="w-7 h-7 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }
  if (notFound || !store) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-gray-500 bg-gray-50">
          <Store className="w-10 h-10 text-gray-300" />
          <p className="font-medium">This store doesn't exist or isn't live yet.</p>
          <Link to="/" className="text-orange-600 font-semibold hover:underline text-sm">Back to Collabo</Link>
        </div>
      </Layout>
    );
  }

  const featuredIds = new Set(store.featured_product_ids || []);
  const featured = products.filter((p) => featuredIds.has(p.id));
  const theme = store.store_theme_color || '#f97316';
  const searching = q.trim().length > 0;
  const tabs = [{ key: 'all', label: 'Home' }, ...categories.map((c) => ({ key: c, label: c }))];

  return (
    <Layout>
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
    </Layout>
  );
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
