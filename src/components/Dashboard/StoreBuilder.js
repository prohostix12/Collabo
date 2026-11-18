import React, { useState, useEffect } from 'react';
import { Store, ImagePlus, Upload, Plus, X, Clock, ArrowLeft } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onloadend = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

// sellerId (admin mode): lets an admin edit any seller's store on their behalf via the
// admin-only endpoint instead of the seller's own. onClose (admin mode): back button.
const StoreBuilder = ({ sellerId, sellerLabel, onClose }) => {
  const { user } = useAuth();
  const [form, setForm] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const profileEndpoint = sellerId ? `/auth/admin/seller-store/${sellerId}/` : '/auth/seller-profile/';
  const targetId = sellerId || user?.id;

  useEffect(() => {
    if (!targetId) return;
    setLoading(true);
    Promise.all([
      api.get(profileEndpoint),
      api.get(`/ecommerce/products/?seller=${targetId}&page_size=200`),
    ])
      .then(([profileRes, productsRes]) => {
        setForm({
          store_name: profileRes.data.store_name || '',
          store_slug: profileRes.data.store_slug || '',
          store_logo: profileRes.data.store_logo || '',
          store_banner: profileRes.data.store_banner || '',
          store_banner_height: profileRes.data.store_banner_height || 'md',
          store_tagline: profileRes.data.store_tagline || '',
          store_description: profileRes.data.store_description || '',
          store_theme_color: profileRes.data.store_theme_color || '#f97316',
          featured_product_ids: profileRes.data.featured_product_ids || [],
          store_sections: profileRes.data.store_sections || [],
          verification_status: profileRes.data.verification_status,
        });
        const data = productsRes.data.results || productsRes.data;
        setProducts(Array.isArray(data) ? data : []);
      })
      .catch(() => toast.error('Could not load this store'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setVal = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleFeatured = (id) => setForm((f) => {
    const has = f.featured_product_ids.includes(id);
    return { ...f, featured_product_ids: has ? f.featured_product_ids.filter((x) => x !== id) : [...f.featured_product_ids, id] };
  });

  const handleImageFile = async (key, file) => {
    if (!file) return;
    if (file.size > MAX_IMAGE_SIZE) { toast.error('Image must be under 5MB'); return; }
    try { setVal(key, await fileToDataUrl(file)); } catch { toast.error('Could not read that image'); }
  };

  const genId = () => `sec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const SECTION_DEFAULTS = {
    carousel: () => ({ id: genId(), type: 'carousel', size: 'md', slides: [] }),
    featured: () => ({ id: genId(), type: 'featured', title: 'Featured', product_ids: [], columns: 4 }),
    promo: () => ({ id: genId(), type: 'promo', size: 'md', image: '', title: '', subtitle: '', link: '' }),
    category_strip: () => ({ id: genId(), type: 'category_strip', categories: [] }),
    tile_grid: () => ({ id: genId(), type: 'tile_grid', tiles: [] }),
  };
  const addSection = (type) => setForm((f) => ({ ...f, store_sections: [...f.store_sections, SECTION_DEFAULTS[type]()] }));
  const updateSection = (id, patch) => setForm((f) => ({
    ...f, store_sections: f.store_sections.map((s) => (s.id === id ? { ...s, ...patch } : s)),
  }));
  const removeSection = (id) => setForm((f) => ({ ...f, store_sections: f.store_sections.filter((s) => s.id !== id) }));
  const moveSection = (id, dir) => setForm((f) => {
    const list = [...f.store_sections];
    const i = list.findIndex((s) => s.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return f;
    [list[i], list[j]] = [list[j], list[i]];
    return { ...f, store_sections: list };
  });

  const save = async () => {
    setSaving(true);
    try {
      const { verification_status, ...payload } = form;
      const res = await api.patch(profileEndpoint, payload);
      setForm((f) => ({ ...f, store_slug: res.data.store_slug }));
      toast.success('Store saved');
    } catch (e) {
      toast.error(e.response?.data?.store_slug?.[0] || e.response?.data?.store_name?.[0] || 'Could not save this store');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) {
    return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" /></div>;
  }

  const inputCls = 'w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400/60 transition-shadow';
  const sectionCls = 'bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-4 shadow-sm';
  const THEME_SWATCHES = ['#f97316', '#ea580c', '#2563eb', '#059669', '#db2777', '#7c3aed', '#0f172a', '#dc2626'];

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-4 items-start">
      <div className="space-y-4">
        {onClose && (
          <button onClick={onClose} className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to sellers
          </button>
        )}
        {sellerLabel && (
          <p className="text-xs text-gray-500">Editing storefront for <b className="text-gray-800 dark:text-gray-100">{sellerLabel}</b> as admin.</p>
        )}
        {form.verification_status !== 'approved' && (
          <div className="flex items-start gap-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl p-3.5 text-xs text-amber-700 dark:text-amber-300">
            <Clock className="w-4 h-4 shrink-0 mt-0.5" />
            <span>This storefront only goes live to the public once the seller account is approved.</span>
          </div>
        )}

        <div className={sectionCls}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5"><Store className="w-4 h-4 text-orange-500" /> Store identity</h3>
            {form.store_slug && (
              <a href={`/store/${form.store_slug}`} target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-orange-600 hover:underline whitespace-nowrap">
                View live store ↗
              </a>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Store name</span>
              <input className={inputCls} value={form.store_name} onChange={set('store_name')} placeholder="e.g. Skin By Beauty" />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Store URL</span>
              <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus-within:ring-2 focus-within:ring-orange-400/60 transition-shadow overflow-hidden">
                <span className="pl-3 text-xs text-gray-400 whitespace-nowrap">/store/</span>
                <input className="flex-1 min-w-0 px-1.5 py-2 text-sm bg-transparent focus:outline-none" value={form.store_slug} onChange={set('store_slug')} placeholder="auto-generated" />
              </div>
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Tagline</span>
            <input className={inputCls} value={form.store_tagline} onChange={set('store_tagline')} placeholder="A short line under your store name" maxLength={200} />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Description</span>
            <textarea className={inputCls} rows={3} value={form.store_description} onChange={set('store_description')} placeholder="Tell buyers what this store is about" />
          </label>
        </div>

        <div className={sectionCls}>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5"><ImagePlus className="w-4 h-4 text-orange-500" /> Look &amp; feel</h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Logo</span>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                  {form.store_logo ? <img src={form.store_logo} alt="Logo" className="w-full h-full object-cover" /> : <Store className="w-6 h-6 text-gray-300" />}
                </div>
                <div className="flex-1 space-y-1.5 min-w-0">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors">
                    <Upload className="w-3.5 h-3.5" /> Upload
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { handleImageFile('store_logo', e.target.files[0]); e.target.value = ''; }} />
                  </label>
                  {form.store_logo && <button type="button" onClick={() => setVal('store_logo', '')} className="text-[11px] text-red-500 hover:underline block">Remove</button>}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Banner</span>
              <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 h-16 flex items-center justify-center relative"
                   style={{ background: form.store_banner ? undefined : `linear-gradient(135deg, ${form.store_theme_color}, ${form.store_theme_color}99)` }}>
                {form.store_banner && <img src={form.store_banner} alt="Banner" className="w-full h-full object-cover absolute inset-0" />}
                <label className="relative cursor-pointer inline-flex items-center gap-1.5 bg-black/60 hover:bg-black/75 text-white font-semibold text-xs px-3 py-1.5 rounded-lg backdrop-blur-sm transition-colors">
                  <Upload className="w-3.5 h-3.5" /> Upload
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { handleImageFile('store_banner', e.target.files[0]); e.target.value = ''; }} />
                </label>
              </div>
              <div className="flex items-center justify-between gap-2">
                {form.store_banner && <button type="button" onClick={() => setVal('store_banner', '')} className="text-[11px] text-red-500 hover:underline">Remove banner</button>}
                <label className="flex items-center gap-1.5 text-[11px] text-gray-500 ml-auto">
                  Height
                  <select
                    value={form.store_banner_height || 'md'}
                    onChange={(e) => setVal('store_banner_height', e.target.value)}
                    className="border border-gray-200 dark:border-gray-700 rounded-md px-1.5 py-0.5 text-[11px] bg-white dark:bg-gray-900"
                  >
                    <option value="sm">Small</option>
                    <option value="md">Medium</option>
                    <option value="lg">Large</option>
                  </select>
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Theme color</span>
            <div className="flex items-center gap-2 flex-wrap">
              {THEME_SWATCHES.map((c) => (
                <button key={c} type="button" onClick={() => setVal('store_theme_color', c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${form.store_theme_color === c ? 'border-gray-900 dark:border-white' : 'border-transparent'}`}
                  style={{ backgroundColor: c }} />
              ))}
              <input type="color" className="h-7 w-7 rounded-full border border-gray-200 dark:border-gray-700 cursor-pointer" value={form.store_theme_color} onChange={set('store_theme_color')} />
            </div>
          </div>
        </div>

        <div className={sectionCls}>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Featured products</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">Pick products to highlight at the top of the store page.</p>
          </div>
          {products.length === 0 ? (
            <p className="text-xs text-gray-400">No products yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {products.map((p) => {
                const checked = form.featured_product_ids.includes(p.id);
                return (
                  <label key={p.id} className={`flex items-center gap-2 border rounded-xl px-2.5 py-2 text-xs cursor-pointer transition-colors ${checked ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                    <input type="checkbox" checked={checked} onChange={() => toggleFeatured(p.id)} className="accent-orange-500" />
                    {p.image && <img src={p.image} alt="" className="w-6 h-6 rounded object-cover shrink-0" />}
                    <span className="truncate">{p.name}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className={sectionCls}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Page sections</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Build out the store page with banners, promos, and product grids &mdash; like a mini homepage.</p>
            </div>
            <div className="relative group shrink-0">
              <button type="button" className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add section
              </button>
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-20">
                {[
                  ['carousel', 'Moving banner carousel'],
                  ['featured', 'Featured product grid'],
                  ['promo', 'Promo / ad banner'],
                  ['category_strip', 'Category strip'],
                  ['tile_grid', 'Promo tile grid'],
                ].map(([type, label]) => (
                  <button key={type} type="button" onClick={() => addSection(type)} className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900">
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {form.store_sections.length === 0 ? (
            <p className="text-xs text-gray-400">No sections yet. Use "Add section" to build out the page.</p>
          ) : (
            <div className="space-y-3">
              {form.store_sections.map((sec, i) => (
                <SectionEditor
                  key={sec.id}
                  section={sec}
                  products={products}
                  isFirst={i === 0}
                  isLast={i === form.store_sections.length - 1}
                  onChange={(patch) => updateSection(sec.id, patch)}
                  onRemove={() => removeSection(sec.id)}
                  onMove={(dir) => moveSection(sec.id, dir)}
                />
              ))}
            </div>
          )}
        </div>

        <button onClick={save} disabled={saving} className="px-5 py-2.5 text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl disabled:opacity-50 transition-colors shadow-sm">
          {saving ? 'Saving...' : 'Save store'}
        </button>
      </div>

      {/* Live preview */}
      <div className="lg:sticky lg:top-4 space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Preview</p>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
          <div className="h-20 relative" style={{ background: form.store_banner ? undefined : `linear-gradient(135deg, ${form.store_theme_color}, ${form.store_theme_color}99)` }}>
            {form.store_banner && <img src={form.store_banner} alt="" className="w-full h-full object-cover absolute inset-0" />}
            <div className="absolute inset-0 bg-black/25" />
          </div>
          <div className="px-3 -mt-6 pb-4">
            <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-800 border-2 border-white dark:border-gray-800 shadow overflow-hidden flex items-center justify-center">
              {form.store_logo ? <img src={form.store_logo} alt="" className="w-full h-full object-cover" /> : <Store className="w-5 h-5 text-gray-300" />}
            </div>
            <p className="text-sm font-black text-gray-900 dark:text-white mt-2 truncate">{form.store_name || 'Store name'}</p>
            {form.store_tagline && <p className="text-[11px] text-gray-500 truncate">{form.store_tagline}</p>}
            <p className="text-[10px] text-gray-400 mt-1.5 truncate">collabo.co.in/store/{form.store_slug || '...'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const SECTION_LABELS = { carousel: 'Moving banner carousel', featured: 'Featured product grid', promo: 'Promo / ad banner', category_strip: 'Category strip', tile_grid: 'Promo tile grid' };

const SectionEditor = ({ section, products, isFirst, isLast, onChange, onRemove, onMove }) => {
  const inputCls = 'w-full border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400/60 transition-shadow';

  const uploadImage = async (file, cb) => {
    if (!file) return;
    if (file.size > MAX_IMAGE_SIZE) { toast.error('Image must be under 5MB'); return; }
    try { cb(await fileToDataUrl(file)); } catch { toast.error('Could not read that image'); }
  };

  const Header = () => (
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold text-gray-800 dark:text-gray-100">{SECTION_LABELS[section.type]}</span>
      <div className="flex items-center gap-1">
        <button type="button" disabled={isFirst} onClick={() => onMove(-1)} className="p-1 rounded text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed">↑</button>
        <button type="button" disabled={isLast} onClick={() => onMove(1)} className="p-1 rounded text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed">↓</button>
        <button type="button" onClick={onRemove} className="p-1 rounded text-red-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );

  const SizeSelect = () => (
    <label className="block space-y-1 w-28">
      <span className="text-[11px] font-semibold text-gray-500">Height</span>
      <select className={inputCls} value={section.size || 'md'} onChange={(e) => onChange({ size: e.target.value })}>
        <option value="sm">Small</option>
        <option value="md">Medium</option>
        <option value="lg">Large</option>
      </select>
    </label>
  );

  if (section.type === 'carousel') {
    const slides = section.slides || [];
    const updateSlide = (i, patch) => onChange({ slides: slides.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) });
    const removeSlide = (i) => onChange({ slides: slides.filter((_, idx) => idx !== i) });
    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 space-y-3 bg-gray-50/60 dark:bg-gray-900/30">
        <Header />
        <SizeSelect />
        <div className="space-y-2">
          {slides.map((s, i) => (
            <div key={i} className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2">
              <div className="w-14 h-10 rounded bg-gray-100 dark:bg-gray-900 overflow-hidden flex items-center justify-center shrink-0">
                {s.image ? <img src={s.image} alt="" className="w-full h-full object-cover" /> : <ImagePlus className="w-4 h-4 text-gray-300" />}
              </div>
              <label className="cursor-pointer text-[11px] font-semibold text-orange-600 hover:underline shrink-0">
                Upload
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { uploadImage(e.target.files[0], (data) => updateSlide(i, { image: data })); e.target.value = ''; }} />
              </label>
              <input className={inputCls} placeholder="Title (optional)" value={s.title || ''} onChange={(e) => updateSlide(i, { title: e.target.value })} />
              <input className={inputCls} placeholder="Links to product id or /path" value={s.link || ''} onChange={(e) => updateSlide(i, { link: e.target.value })} />
              <button type="button" onClick={() => removeSlide(i)} className="text-red-400 hover:text-red-600 shrink-0"><X className="w-3.5 h-3.5" /></button>
            </div>
          ))}
          <button type="button" onClick={() => onChange({ slides: [...slides, { image: '', title: '', link: '' }] })} className="text-[11px] font-semibold text-orange-600 hover:underline">+ Add slide</button>
        </div>
      </div>
    );
  }

  if (section.type === 'featured') {
    const ids = section.product_ids || [];
    const toggle = (id) => onChange({ product_ids: ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id] });
    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 space-y-3 bg-gray-50/60 dark:bg-gray-900/30">
        <Header />
        <div className="flex gap-3">
          <label className="block space-y-1 flex-1">
            <span className="text-[11px] font-semibold text-gray-500">Section title</span>
            <input className={inputCls} value={section.title || ''} onChange={(e) => onChange({ title: e.target.value })} placeholder="e.g. Best sellers" />
          </label>
          <label className="block space-y-1 w-24">
            <span className="text-[11px] font-semibold text-gray-500">Columns</span>
            <select className={inputCls} value={section.columns || 4} onChange={(e) => onChange({ columns: Number(e.target.value) })}>
              <option value={3}>3</option><option value={4}>4</option><option value={5}>5</option>
            </select>
          </label>
        </div>
        {products.length === 0 ? (
          <p className="text-xs text-gray-400">No products yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
            {products.map((p) => {
              const checked = ids.includes(p.id);
              return (
                <label key={p.id} className={`flex items-center gap-2 border rounded-lg px-2 py-1.5 text-xs cursor-pointer transition-colors ${checked ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                  <input type="checkbox" checked={checked} onChange={() => toggle(p.id)} className="accent-orange-500" />
                  <span className="truncate">{p.name}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (section.type === 'promo') {
    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 space-y-3 bg-gray-50/60 dark:bg-gray-900/30">
        <Header />
        <div className="flex items-center gap-3">
          <div className="w-20 h-14 rounded-lg bg-gray-100 dark:bg-gray-900 overflow-hidden flex items-center justify-center shrink-0">
            {section.image ? <img src={section.image} alt="" className="w-full h-full object-cover" /> : <ImagePlus className="w-5 h-5 text-gray-300" />}
          </div>
          <label className="cursor-pointer inline-flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors shrink-0">
            <Upload className="w-3.5 h-3.5" /> Upload
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { uploadImage(e.target.files[0], (data) => onChange({ image: data })); e.target.value = ''; }} />
          </label>
          <SizeSelect />
        </div>
        <div className="grid sm:grid-cols-2 gap-2">
          <input className={inputCls} placeholder="Title, e.g. Flat 20% off" value={section.title || ''} onChange={(e) => onChange({ title: e.target.value })} />
          <input className={inputCls} placeholder="Subtitle (optional)" value={section.subtitle || ''} onChange={(e) => onChange({ subtitle: e.target.value })} />
        </div>
        <input className={inputCls} placeholder="Links to product id or /path (optional)" value={section.link || ''} onChange={(e) => onChange({ link: e.target.value })} />
      </div>
    );
  }

  if (section.type === 'category_strip') {
    const cats = section.categories || [];
    const updateCat = (i, patch) => onChange({ categories: cats.map((c, idx) => (idx === i ? { ...c, ...patch } : c)) });
    const removeCat = (i) => onChange({ categories: cats.filter((_, idx) => idx !== i) });
    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 space-y-3 bg-gray-50/60 dark:bg-gray-900/30">
        <Header />
        <p className="text-[11px] text-gray-500">Leave empty to auto-show categories from the products. Add tiles here to customize the image/order.</p>
        <div className="space-y-2">
          {cats.map((c, i) => (
            <div key={i} className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2">
              <div className="w-10 h-10 rounded bg-gray-100 dark:bg-gray-900 overflow-hidden flex items-center justify-center shrink-0">
                {c.image ? <img src={c.image} alt="" className="w-full h-full object-cover" /> : <ImagePlus className="w-4 h-4 text-gray-300" />}
              </div>
              <label className="cursor-pointer text-[11px] font-semibold text-orange-600 hover:underline shrink-0">
                Upload
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { uploadImage(e.target.files[0], (data) => updateCat(i, { image: data })); e.target.value = ''; }} />
              </label>
              <input className={inputCls} placeholder="Category name" value={c.name || ''} onChange={(e) => updateCat(i, { name: e.target.value })} />
              <button type="button" onClick={() => removeCat(i)} className="text-red-400 hover:text-red-600 shrink-0"><X className="w-3.5 h-3.5" /></button>
            </div>
          ))}
          <button type="button" onClick={() => onChange({ categories: [...cats, { name: '', image: '' }] })} className="text-[11px] font-semibold text-orange-600 hover:underline">+ Add category tile</button>
        </div>
      </div>
    );
  }

  // tile_grid
  const tiles = section.tiles || [];
  const updateTile = (i, patch) => onChange({ tiles: tiles.map((t, idx) => (idx === i ? { ...t, ...patch } : t)) });
  const removeTile = (i) => onChange({ tiles: tiles.filter((_, idx) => idx !== i) });
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 space-y-3 bg-gray-50/60 dark:bg-gray-900/30">
      <Header />
      <p className="text-[11px] text-gray-500">Mix a large tile with smaller ones, like Amazon's store banners grid. Mark one tile "Large" to feature it.</p>
      <div className="space-y-2">
        {tiles.map((t, i) => (
          <div key={i} className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2">
            <div className="w-12 h-9 rounded bg-gray-100 dark:bg-gray-900 overflow-hidden flex items-center justify-center shrink-0">
              {t.image ? <img src={t.image} alt="" className="w-full h-full object-cover" /> : <ImagePlus className="w-4 h-4 text-gray-300" />}
            </div>
            <label className="cursor-pointer text-[11px] font-semibold text-orange-600 hover:underline shrink-0">
              Upload
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { uploadImage(e.target.files[0], (data) => updateTile(i, { image: data })); e.target.value = ''; }} />
            </label>
            <input className={inputCls} placeholder="Title (optional)" value={t.title || ''} onChange={(e) => updateTile(i, { title: e.target.value })} />
            <input className={inputCls} placeholder="Links to product id or /path" value={t.link || ''} onChange={(e) => updateTile(i, { link: e.target.value })} />
            <select className={`${inputCls} w-24 shrink-0`} value={t.span || 'normal'} onChange={(e) => updateTile(i, { span: e.target.value })}>
              <option value="normal">Normal</option>
              <option value="large">Large</option>
            </select>
            <button type="button" onClick={() => removeTile(i)} className="text-red-400 hover:text-red-600 shrink-0"><X className="w-3.5 h-3.5" /></button>
          </div>
        ))}
        <button type="button" onClick={() => onChange({ tiles: [...tiles, { image: '', title: '', link: '', span: 'normal' }] })} className="text-[11px] font-semibold text-orange-600 hover:underline">+ Add tile</button>
      </div>
    </div>
  );
};

export default StoreBuilder;
