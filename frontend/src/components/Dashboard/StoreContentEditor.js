import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import ProductMediaManager from './ProductMediaManager';
import {
  Save,
  Tag,
  Sparkles,
  Users,
  ShoppingBag,
  TrendingUp,
  FileText,
  Settings,
  PlusCircle,
  X,
  Star,
  Percent,
  Image,
  RefreshCw,
  Eye,
  Loader2,
  Film,
  Upload,
} from 'lucide-react';

// Ensure only admins can edit store settings. Non-admin users will see a read‑only view.

// ─── tiny helpers ────────────────────────────────────────────────────────────

const Field = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
      {label}
    </label>
    {children}
  </div>
);

const inputCls =
  'w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white placeholder-gray-300';

const textareaCls = inputCls + ' resize-none';

const Card = ({ icon: Icon, title, color = 'text-orange-500', children, fullWidth = false }) => (
  <div className={`bg-white rounded-xl border border-gray-200 p-4 space-y-3 ${fullWidth ? 'lg:col-span-2' : ''}`}>
    <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
      <Icon className={`w-4 h-4 ${color}`} />
      <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">{title}</h3>
    </div>
    {children}
  </div>
);

// ─── component ───────────────────────────────────────────────────────────────

const StoreContentEditor = () => {
  const { user } = useAuth();
  const isAdmin = user?.is_staff || user?.user_type === 'admin';
  const [settings, setSettings] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Media manager modal state
  const [mediaManagerProduct, setMediaManagerProduct] = useState(null);
  // Admin-configurable max media file size (MB)
  const [maxFileSizeMB, setMaxFileSizeMB] = useState(20);
  const [mediaCountMap, setMediaCountMap] = useState({}); // { productId: count }

  // ── fetch ────────────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsRes, productsRes] = await Promise.all([
        api.get('/ecommerce/store-settings/'),
        api.get('/ecommerce/products/'),
      ]);
      const s = settingsRes.data;
      setSettings(s);
      const prods = productsRes.data.results ?? productsRes.data;
      const prodArr = Array.isArray(prods) ? prods : [];
      setProducts(prodArr);
      // fetch media counts per product in parallel
      const counts = {};
      await Promise.all(
        prodArr.map(async (p) => {
          try {
            const res = await api.get(`/ecommerce/products/${p.id}/influencer-media/`);
            counts[p.id] = Array.isArray(res.data) ? res.data.length : 0;
          } catch {
            counts[p.id] = 0;
          }
        })
      );
      setMediaCountMap(counts);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load store settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── helpers ──────────────────────────────────────────────────────────────

  const set = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

  const setJson = (key, idx, patch) =>
    setSettings(prev => {
      const arr = [...(prev[key] || [])];
      arr[idx] = { ...arr[idx], ...patch };
      return { ...prev, [key]: arr };
    });

  const removeJson = (key, idx) =>
    setSettings(prev => {
      const arr = [...(prev[key] || [])];
      arr.splice(idx, 1);
      return { ...prev, [key]: arr };
    });

  const addJson = (key, template) =>
    setSettings(prev => ({ ...prev, [key]: [...(prev[key] || []), template] }));

  const toggleProduct = (key, id, max) =>
    setSettings(prev => {
      const cur = prev[key] || [];
      if (cur.includes(id)) return { ...prev, [key]: cur.filter(x => x !== id) };
      if (cur.length >= max) return prev;
      return { ...prev, [key]: [...cur, id] };
    });

  // ── save ─────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.post('/ecommerce/store-settings/', settings);
      setSettings(res.data);
      toast.success('Store content saved!');
      // Notify other components to refresh store settings
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storeSettingsUpdated'));
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save store content');
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-orange-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading store settings…</p>
        </div>
      </div>
    );
  }

  if (!settings) return null;
  // Restrict editor to admin users only
  if (!isAdmin) {
    return (
      <div className="p-4 text-center text-gray-500">
        You do not have permission to edit store content. Admins only.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-orange-500" />
            Store Content Editor
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            All changes are reflected live on the storefront homepage after saving.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAll}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-2 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reload
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-bold px-5 py-2 rounded-xl shadow-sm transition-colors"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Saving…' : 'Save All Changes'}
          </button>
        </div>
      </div>

      {/* ── Live ticker preview ── */}
      <div className="bg-gray-900 text-white rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center gap-2">
        <Tag className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
        <span>
          {(settings.ticker_text || '').replace(settings.ticker_coupon_highlight || '', '')}
          <span className="text-orange-400">{settings.ticker_coupon_highlight}</span>
        </span>
        <span className="ml-auto text-[10px] text-gray-500 font-normal">Live ticker preview</span>
      </div>

      {/* ── Grid of cards ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Promo Ticker */}
        <Card icon={Tag} title="Promo Ticker Bar">
          <div className="space-y-3">
            <Field label="Full message">
              <textarea
                rows={2}
                value={settings.ticker_text || ''}
                onChange={e => set('ticker_text', e.target.value)}
                className={textareaCls}
                placeholder="Limited Offer: Get 20% off using COLLABO20"
              />
            </Field>
            <Field label="Word to highlight in orange">
              <input
                type="text"
                value={settings.ticker_coupon_highlight || ''}
                onChange={e => set('ticker_coupon_highlight', e.target.value)}
                className={inputCls}
                placeholder="COLLABO20"
              />
            </Field>
          </div>
        </Card>

        {/* Hero Section */}
        <Card icon={Sparkles} title="Hero Section">
          <div className="space-y-3">
            <Field label="Badge text">
              <input type="text" value={settings.hero_badge_text || ''} onChange={e => set('hero_badge_text', e.target.value)} className={inputCls} placeholder="e.g. ✨ YOUR ALL-IN-ONE MARKETPLACE" />
            </Field>
            <Field label="Main headline">
              <input type="text" value={settings.hero_headline || ''} onChange={e => set('hero_headline', e.target.value)} className={inputCls} placeholder="e.g. Premium Tech, Fashion & Daily Essentials" />
            </Field>
            <Field label="Sub-headline / description">
              <textarea rows={2} value={settings.hero_subheadline || ''} onChange={e => set('hero_subheadline', e.target.value)} className={textareaCls} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Primary CTA button">
                <input type="text" value={settings.hero_cta_primary || ''} onChange={e => set('hero_cta_primary', e.target.value)} className={inputCls} placeholder="Browse Catalog" />
              </Field>
              <Field label="Secondary CTA button">
                <input type="text" value={settings.hero_cta_secondary || ''} onChange={e => set('hero_cta_secondary', e.target.value)} className={inputCls} placeholder="Product Spotlight" />
              </Field>
            </div>
          </div>
        </Card>

        {/* Deals of the Day */}
        <Card icon={Percent} title="Deals of the Day (pick up to 4)">
          <p className="text-xs text-gray-400">Leave empty to auto-show the first 4 products.</p>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {products.map(p => {
              const selected = (settings.deals_product_ids || []).includes(p.id);
              return (
                <div
                  key={p.id}
                  onClick={() => toggleProduct('deals_product_ids', p.id, 4)}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all text-xs ${selected ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/40'}`}
                >
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Image className="w-4 h-4 text-gray-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{p.name}</p>
                    <p className="text-gray-400">₹{Number(p.discount_price || p.price).toLocaleString()} · {p.category}</p>
                  </div>
                  {selected && <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0"><span className="text-white text-[9px] font-black">✓</span></div>}
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-orange-500 font-bold">{(settings.deals_product_ids || []).length}/4 selected</span>
            {(settings.deals_product_ids || []).length > 0 && (
              <button onClick={() => set('deals_product_ids', [])} className="text-red-400 hover:underline font-semibold">Clear</button>
            )}
          </div>
        </Card>

        {/* Trending Products */}
        <Card icon={TrendingUp} title="Trending Products (pick up to 4)">
          <p className="text-xs text-gray-400">Leave empty to auto-show products 5–8 from your catalog.</p>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {products.map(p => {
              const selected = (settings.trending_product_ids || []).includes(p.id);
              return (
                <div
                  key={p.id}
                  onClick={() => toggleProduct('trending_product_ids', p.id, 4)}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all text-xs ${selected ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/40'}`}
                >
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Image className="w-4 h-4 text-gray-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{p.name}</p>
                    <p className="text-gray-400">₹{Number(p.discount_price || p.price).toLocaleString()} · {p.category}</p>
                  </div>
                  {selected && <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0"><span className="text-white text-[9px] font-black">✓</span></div>}
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-orange-500 font-bold">{(settings.trending_product_ids || []).length}/4 selected</span>
            {(settings.trending_product_ids || []).length > 0 && (
              <button onClick={() => set('trending_product_ids', [])} className="text-red-400 hover:underline font-semibold">Clear</button>
            )}
          </div>
        </Card>

        {/* Coupon Codes */}
        <Card icon={Tag} title="Coupon Codes">
          <div className="space-y-3">
            {(settings.coupon_codes || []).map((coupon, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-3 space-y-2 border border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Coupon #{idx + 1}</span>
                  <button
                    onClick={() => removeJson('coupon_codes', idx)}
                    className="p-1 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Code">
                    <input
                      type="text"
                      value={coupon.code || ''}
                      onChange={e => setJson('coupon_codes', idx, { code: e.target.value.toUpperCase() })}
                      className={inputCls + ' uppercase font-bold'}
                    />
                  </Field>
                  <Field label="Discount %">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={coupon.discount_percent || ''}
                      onChange={e => setJson('coupon_codes', idx, { discount_percent: Number(e.target.value) })}
                      className={inputCls}
                    />
                  </Field>
                </div>
                <Field label="Description">
                  <input
                    type="text"
                    value={coupon.description || ''}
                    onChange={e => setJson('coupon_codes', idx, { description: e.target.value })}
                    className={inputCls}
                    placeholder="e.g. 20% off all tech products"
                  />
                </Field>
              </div>
            ))}
            <button
              onClick={() => addJson('coupon_codes', { code: 'NEWCODE', discount_percent: 10, description: 'New coupon' })}
              className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-orange-500 hover:text-orange-700 border border-dashed border-orange-300 hover:border-orange-500 rounded-xl py-2.5 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Add Coupon Code
            </button>
          </div>
        </Card>
        {/* Mini Offer Cards (Uses hero_card_slides) */}
        <Card icon={Sparkles} title="Mini Offer Cards (3 Cards below Carousel)">
          <div className="space-y-3">
            {(settings.hero_card_slides || []).map((card, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-3 space-y-2 border border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Card #{idx + 1}</span>
                  <button
                    onClick={() => removeJson('hero_card_slides', idx)}
                    className="p-1 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Title">
                    <input type="text" value={card.title || ''} onChange={e => setJson('hero_card_slides', idx, { title: e.target.value })} className={inputCls} placeholder="e.g. Top Audio Deals" />
                  </Field>
                  <Field label="Subtitle">
                    <input type="text" value={card.subtitle || ''} onChange={e => setJson('hero_card_slides', idx, { subtitle: e.target.value })} className={inputCls} placeholder="e.g. Min. 50% Off" />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Ad Image URL">
                    <input type="text" value={card.image || ''} onChange={e => setJson('hero_card_slides', idx, { image: e.target.value })} className={inputCls} placeholder="https://..." />
                  </Field>
                  <Field label="Link to Product">
                    <select value={card.product_id || ''} onChange={e => setJson('hero_card_slides', idx, { product_id: e.target.value })} className={inputCls}>
                      <option value="">-- No Product --</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </Field>
                </div>
              </div>
            ))}
            {(settings.hero_card_slides || []).length < 3 && (
              <button
                onClick={() => addJson('hero_card_slides', { title: 'New Offer', subtitle: 'Special Promo', image: '', product_id: '' })}
                className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-orange-500 hover:text-orange-700 border border-dashed border-orange-300 hover:border-orange-500 rounded-xl py-2.5 transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                Add Offer Card
              </button>
            )}
          </div>
        </Card>


        {/* Testimonials */}
        <Card icon={Users} title="Customer Testimonials">
          <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
            {(settings.testimonials || []).map((t, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Testimonial #{idx + 1}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => addJson('testimonials', { name: 'New Reviewer', title: 'Verified Buyer', rating: 5, text: 'Great product!' })}
                      className="text-xs text-orange-500 font-semibold hover:underline flex items-center gap-1"
                    >
                      <PlusCircle className="w-3 h-3" /> Add
                    </button>
                    {(settings.testimonials || []).length > 1 && (
                      <button onClick={() => removeJson('testimonials', idx)} className="p-1 rounded-lg text-red-400 hover:bg-red-50 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Name">
                    <input type="text" value={t.name || ''} onChange={e => setJson('testimonials', idx, { name: e.target.value })} className={inputCls} />
                  </Field>
                  <Field label="Title / Role">
                    <input type="text" value={t.title || ''} onChange={e => setJson('testimonials', idx, { title: e.target.value })} className={inputCls} />
                  </Field>
                </div>
                <Field label="Star Rating">
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => setJson('testimonials', idx, { rating: star })}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${Number(t.rating) >= star ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-400 hover:bg-orange-100'}`}
                      >
                        <Star className="w-3.5 h-3.5" fill={Number(t.rating) >= star ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                    <span className="text-xs text-gray-500 ml-1">{t.rating}/5</span>
                  </div>
                </Field>
                <Field label="Review Text">
                  <textarea
                    rows={2}
                    value={t.text || ''}
                    onChange={e => setJson('testimonials', idx, { text: e.target.value })}
                    className={textareaCls}
                  />
                </Field>
              </div>
            ))}
          </div>
          {(settings.testimonials || []).length === 0 && (
            <button
              onClick={() => addJson('testimonials', { name: 'New Reviewer', title: 'Verified Buyer', rating: 5, text: 'Great product!' })}
              className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-orange-500 hover:text-orange-700 border border-dashed border-orange-300 hover:border-orange-500 rounded-xl py-2.5 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Add Testimonial
            </button>
          )}
        </Card>

        {/* Category Image Overrides */}
        <Card icon={Image} title="Category Background Images" fullWidth>
          <p className="text-xs text-gray-400">
            Provide a URL for each category to override the default background image on the storefront. Leave blank to use defaults.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {['Electronics', 'Fashion', 'Grocery', 'Home', 'Kitchen', 'Beauty', 'Books', 'Toys', 'Appliances', 'Health', 'Personal Care', 'Audio', 'Cleaning', 'Hardware', 'Accessories', 'Laundry'].map(cat => (
              <div key={cat} className="space-y-1">
                <label className="text-xs font-semibold text-gray-500">{cat}</label>
                <input
                  type="text"
                  value={(settings.category_images || {})[cat] || ''}
                  onChange={e => set('category_images', { ...(settings.category_images || {}), [cat]: e.target.value })}
                  placeholder="https://..."
                  className={inputCls + ' text-xs'}
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Footer */}
        <Card icon={FileText} title="Footer Content" fullWidth>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Field label="Brand tagline (below logo)">
              <textarea
                rows={2}
                value={settings.footer_tagline || ''}
                onChange={e => set('footer_tagline', e.target.value)}
                className={textareaCls}
              />
            </Field>
            <Field label="Copyright text">
              <input
                type="text"
                value={settings.copyright_text || ''}
                onChange={e => set('copyright_text', e.target.value)}
                className={inputCls}
                placeholder="© 2026 YourStore. All rights reserved."
              />
            </Field>
          </div>
        </Card>

        {/* ─ Marketing Media ─ */}
        <Card icon={Film} title="Marketing Media" color="text-violet-600" fullWidth>
          {/* Max file size config */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <Film className="w-4 h-4 text-violet-500 flex-shrink-0" />
            <p className="text-xs text-violet-700 font-semibold flex-1">
              Upload product photos &amp; videos that only approved influencers can view for collaboration.
            </p>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-violet-600 whitespace-nowrap">Max file size (MB)</label>
              <input
                type="number"
                min="1"
                max="500"
                value={maxFileSizeMB}
                onChange={e => setMaxFileSizeMB(Math.max(1, Number(e.target.value)))}
                className="w-20 text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white text-[11px] font-medium text-gray-700"
              />
            </div>
          </div>

          {/* Product grid */}
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {products.length === 0 ? (
              <div className="flex flex-col items-center py-8 gap-2">
                <ShoppingBag className="w-8 h-8 text-gray-300" />
                <p className="text-xs text-gray-400">No products found.</p>
              </div>
            ) : products.map(p => {
              const count = mediaCountMap[p.id] ?? 0;
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all group"
                >
                  {/* Thumbnail */}
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-gray-200" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Image className="w-5 h-5 text-gray-300" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.category} · ₹{Number(p.discount_price || p.price).toLocaleString()}</p>
                  </div>

                  {/* Media count badge */}
                  {count > 0 && (
                    <div className="flex items-center gap-1 bg-gray-100 text-gray-700 text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0">
                      <Film className="w-3 h-3" />
                      {count}
                    </div>
                  )}

                  {/* Manage button */}
                  <button
                    onClick={() => setMediaManagerProduct(p)}
                    className="flex items-center gap-1.5 text-xs font-bold text-white bg-gray-900 hover:bg-gray-800 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0 opacity-80 group-hover:opacity-100"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Manage Media
                  </button>
                </div>
              );
            })}
          </div>
        </Card>

      </div>

      {/* ── Sticky bottom save bar ── */}
      <div className="sticky bottom-4 flex justify-end z-10">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white text-[11px] font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : 'Save All Changes'}
        </button>
      </div>

      {/* ── Product Media Manager Modal ── */}
      {mediaManagerProduct && (
        <ProductMediaManager
          product={mediaManagerProduct}
          maxFileSizeMB={maxFileSizeMB}
          onClose={() => {
            setMediaManagerProduct(null);
            // refresh counts after closing
            (async () => {
              try {
                const res = await api.get(`/ecommerce/products/${mediaManagerProduct.id}/influencer-media/`);
                setMediaCountMap(prev => ({ ...prev, [mediaManagerProduct.id]: Array.isArray(res.data) ? res.data.length : 0 }));
              } catch { /* ignore */ }
            })();
          }}
        />
      )}
    </div>
  );
};

export default StoreContentEditor;
