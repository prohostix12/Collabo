import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Store, ArrowLeft } from 'lucide-react';
import api from '../../services/api';

const StorePage = () => {
  const { slug } = useParams();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading store...</div>;
  }
  if (notFound || !store) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-gray-500">
        <Store className="w-10 h-10 text-gray-300" />
        <p>This store doesn't exist or isn't live yet.</p>
        <Link to="/" className="text-orange-600 font-semibold hover:underline">Back to Collabo</Link>
      </div>
    );
  }

  const featuredIds = new Set(store.featured_product_ids || []);
  const featured = products.filter((p) => featuredIds.has(p.id));
  const rest = products.filter((p) => !featuredIds.has(p.id));
  const theme = store.store_theme_color || '#f97316';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800"><ArrowLeft className="w-3.5 h-3.5" /> Back to Collabo</Link>
        </div>
      </div>

      <div className="relative h-48 sm:h-64 w-full overflow-hidden" style={{ background: store.store_banner ? undefined : theme }}>
        {store.store_banner && <img src={store.store_banner} alt="" className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 max-w-6xl mx-auto px-4 flex items-end pb-5">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-white shadow-lg overflow-hidden flex items-center justify-center flex-shrink-0">
              {store.store_logo ? <img src={store.store_logo} alt={store.store_name} className="w-full h-full object-cover" /> : <Store className="w-8 h-8 text-gray-300" />}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white drop-shadow">{store.store_name}</h1>
              {store.store_tagline && <p className="text-white/90 text-sm font-medium drop-shadow">{store.store_tagline}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        {store.store_description && (
          <p className="text-sm text-gray-600 max-w-3xl">{store.store_description}</p>
        )}

        {featured.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-gray-900 mb-3">Featured</h2>
            <ProductGrid products={featured} />
          </section>
        )}

        <section>
          <h2 className="text-sm font-bold text-gray-900 mb-3">All products ({products.length})</h2>
          {products.length === 0 ? (
            <p className="text-sm text-gray-400 py-10 text-center">This store hasn't listed any products yet.</p>
          ) : (
            <ProductGrid products={rest.length ? rest : products} />
          )}
        </section>
      </div>
    </div>
  );
};

const ProductGrid = ({ products }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
    {products.map((p) => (
      <Link key={p.id} to={`/?product=${p.id}`} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        <div className="aspect-square bg-gray-100">
          {p.image && <img src={p.image} alt={p.name} className="w-full h-full object-cover" />}
        </div>
        <div className="p-2.5">
          <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug">{p.name}</p>
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
