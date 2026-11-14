import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Store, ArrowLeft, Search, BadgeCheck, Package } from 'lucide-react';
import api from '../../services/api';

const StorePage = () => {
  const { slug } = useParams();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [q, setQ] = useState('');

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

  const filtered = useMemo(() => {
    if (!q.trim()) return products;
    const needle = q.trim().toLowerCase();
    return products.filter((p) => (p.name || '').toLowerCase().includes(needle) || (p.category || '').toLowerCase().includes(needle));
  }, [products, q]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-7 h-7 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }
  if (notFound || !store) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-gray-500 bg-gray-50">
        <Store className="w-10 h-10 text-gray-300" />
        <p className="font-medium">This store doesn't exist or isn't live yet.</p>
        <Link to="/" className="text-orange-600 font-semibold hover:underline text-sm">Back to Collabo</Link>
      </div>
    );
  }

  const featuredIds = new Set(store.featured_product_ids || []);
  const featured = products.filter((p) => featuredIds.has(p.id));
  const theme = store.store_theme_color || '#f97316';
  const searching = q.trim().length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between gap-4">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 shrink-0">
            <ArrowLeft className="w-3.5 h-3.5" /> Collabo
          </Link>
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              value={q} onChange={(e) => setQ(e.target.value)}
              placeholder={`Search in ${store.store_name}`}
              className="w-full bg-gray-100 rounded-full pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:bg-white transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Banner + identity */}
      <div className="relative h-40 sm:h-56 w-full overflow-hidden" style={{ background: store.store_banner ? undefined : `linear-gradient(135deg, ${theme}, ${theme}aa)` }}>
        {store.store_banner && <img src={store.store_banner} alt="" className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-end gap-4 -mt-10 sm:-mt-12 relative z-10">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white shadow-lg overflow-hidden flex items-center justify-center flex-shrink-0 border-4 border-white">
            {store.store_logo ? <img src={store.store_logo} alt={store.store_name} className="w-full h-full object-cover" /> : <Store className="w-8 h-8 text-gray-300" />}
          </div>
          <div className="pb-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-1.5 truncate">
              {store.store_name}
              <BadgeCheck className="w-4 h-4 text-orange-500 shrink-0" />
            </h1>
            {store.store_tagline && <p className="text-gray-500 text-xs sm:text-sm font-medium truncate">{store.store_tagline}</p>}
          </div>
        </div>

        {/* Stats strip */}
        <div className="flex items-center gap-5 mt-4 pb-4 border-b border-gray-200 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1.5"><Package className="w-3.5 h-3.5 text-gray-400" /> <b className="text-gray-800">{products.length}</b> products</span>
          {store.store_description && <span className="hidden sm:inline text-gray-400">·</span>}
          {store.store_description && <p className="hidden sm:block text-gray-600 truncate max-w-xl">{store.store_description}</p>}
        </div>
        {store.store_description && (
          <p className="sm:hidden text-xs text-gray-600 pt-3">{store.store_description}</p>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        {!searching && featured.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5">
              <span className="w-1 h-4 rounded-full" style={{ backgroundColor: theme }} /> Featured
            </h2>
            <ProductGrid products={featured} />
          </section>
        )}

        <section>
          <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5">
            <span className="w-1 h-4 rounded-full bg-gray-300" /> {searching ? `Results for "${q}"` : 'All products'} ({filtered.length})
          </h2>
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 py-16 text-center">
              {products.length === 0 ? "This store hasn't listed any products yet." : 'No products match your search.'}
            </p>
          ) : (
            <ProductGrid products={!searching && featured.length ? filtered.filter((p) => !featuredIds.has(p.id)) : filtered} />
          )}
        </section>
      </div>
    </div>
  );
};

const ProductGrid = ({ products }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
    {products.map((p) => (
      <Link key={p.id} to={`/?product=${p.id}`} className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all">
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
