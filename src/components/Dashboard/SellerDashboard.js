import React, { useState, useEffect, useCallback } from 'react';
import {
  Store, Package, Plus, X, Clock, CheckCircle2, XCircle,
  IndianRupee, Boxes, ImagePlus, Upload, ShoppingBag, Pencil, Trash2, Truck,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const emptyForm = {
  name: '',
  category: '',
  brand: '',
  price: '',
  discount_price: '',
  stock: '10',
  image: '',
  images: '',
  description: '',
  delivery: 'Free delivery by Tomorrow',
  shipping_charge: '0',
  seller_info: '',
  highlights: '',
  offers: '',
  specifications: '',
};

const emptyQaRow = () => ({ q: '', a: '' });

// Matches the "Key: Value" per-line format the admin product form also
// accepts — kept plain-text only here since sellers shouldn't need to author
// raw JSON to list a product.
const parseSpecifications = (val) => val.split('\n')
  .filter(line => line.includes(':'))
  .map(line => {
    const [k, ...v] = line.split(':');
    return { name: k.trim(), value: v.join(':').trim() };
  })
  .filter(s => s.name);

const specsToText = (specs) => (specs || []).map(s => `${s.name}: ${s.value}`).join('\n');

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onloadend = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const STATUS_META = {
  pending: { label: 'Pending Review', dot: 'bg-amber-400', text: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  approved: { label: 'Live', dot: 'bg-emerald-400', text: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  rejected: { label: 'Rejected', dot: 'bg-red-400', text: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
};

const SellerDashboard = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [qaRows, setQaRows] = useState([emptyQaRow()]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const fetchProducts = useCallback(() => {
    if (!user?.id) return;
    setLoading(true);
    api.get(`/ecommerce/products/?seller=${user.id}&page_size=200`)
      .then(res => {
        const data = res.data.results || res.data;
        setProducts(Array.isArray(data) ? data : []);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    api.get('/ecommerce/categories/')
      .then(res => setCategories(res.data.results || res.data || []))
      .catch(() => setCategories([]));
  }, []);

  const counts = {
    all: products.length,
    pending: products.filter(p => p.status === 'pending').length,
    approved: products.filter(p => p.status === 'approved').length,
    rejected: products.filter(p => p.status === 'rejected').length,
  };

  const resetForm = () => { setForm(emptyForm); setUploadedImages([]); setQaRows([emptyQaRow()]); setFormError(''); setEditingProduct(null); };

  const openAddForm = () => { resetForm(); setShowAddForm(true); };

  const openEditForm = (product) => {
    const [main, ...extra] = product.images?.length ? product.images : [product.image];
    setForm({
      name: product.name || '',
      category: product.category || '',
      brand: product.brand || '',
      price: String(product.price ?? ''),
      discount_price: product.discount_price != null && product.discount_price !== product.price ? String(product.discount_price) : '',
      stock: String(product.stock ?? '0'),
      image: main || product.image || '',
      images: extra.filter(img => img !== product.image).join(', '),
      description: product.description || '',
      delivery: product.delivery || 'Free delivery by Tomorrow',
      shipping_charge: String(product.product_shipping_charge ?? '0'),
      seller_info: product.seller_info || '',
      highlights: (product.highlights || []).join('\n'),
      offers: (product.offers || []).join('\n'),
      specifications: specsToText(product.specifications),
    });
    setUploadedImages([]);
    setQaRows(product.qa_section?.length ? product.qa_section.map(r => ({ q: r.q || '', a: r.a || '' })) : [emptyQaRow()]);
    setFormError('');
    setEditingProduct(product);
    setShowAddForm(true);
  };

  const updateQaRow = (i, field, value) => setQaRows(rows => rows.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  const addQaRow = () => setQaRows(rows => [...rows, emptyQaRow()]);
  const removeQaRow = (i) => setQaRows(rows => rows.length > 1 ? rows.filter((_, idx) => idx !== i) : rows);

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This can't be undone.`)) return;
    setDeletingId(product.id);
    try {
      await api.delete(`/ecommerce/products/${product.id}/`);
      toast.success('Product deleted');
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete product');
    } finally {
      setDeletingId(null);
    }
  };

  const handleMainImageFile = async (file) => {
    if (!file) return;
    if (file.size > MAX_IMAGE_SIZE) { setFormError('Image must be under 5MB'); return; }
    const dataUrl = await fileToDataUrl(file);
    setForm(f => ({ ...f, image: dataUrl }));
  };

  const handleExtraImageFiles = async (files) => {
    for (const file of Array.from(files)) {
      if (file.size > MAX_IMAGE_SIZE) { setFormError(`${file.name} is over 5MB and was skipped`); continue; }
      const dataUrl = await fileToDataUrl(file);
      setUploadedImages(prev => [...prev, dataUrl]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim()) return setFormError('Product name is required');
    if (!form.category) return setFormError('Please select a category');
    if (!form.price || Number(form.price) <= 0) return setFormError('Enter a valid price');
    if (!form.image.trim()) return setFormError('A main image (URL or upload) is required');
    if (!form.description.trim()) return setFormError('Description is required');

    setSubmitting(true);
    try {
      const extraUrls = form.images.split(',').map(s => s.trim()).filter(Boolean);
      const payload = {
        name: form.name.trim(),
        category: form.category,
        brand: form.brand.trim(),
        price: Number(form.price),
        discount_price: form.discount_price ? Number(form.discount_price) : Number(form.price),
        stock: Number(form.stock) || 0,
        image: form.image.trim(),
        images: [form.image.trim(), ...extraUrls, ...uploadedImages],
        description: form.description.trim(),
        delivery: form.delivery.trim() || 'Free delivery by Tomorrow',
        product_shipping_charge: Number(form.shipping_charge) || 0,
        seller_info: form.seller_info.trim(),
        highlights: form.highlights.split('\n').map(s => s.trim()).filter(Boolean),
        offers: form.offers.split('\n').map(s => s.trim()).filter(Boolean),
        specifications: parseSpecifications(form.specifications),
        qa_section: qaRows.filter(r => r.q.trim() && r.a.trim()).map(r => ({ q: r.q.trim(), a: r.a.trim() })),
      };
      if (editingProduct) {
        await api.patch(`/ecommerce/products/${editingProduct.id}/`, payload);
        toast.success('Product updated');
      } else {
        await api.post('/ecommerce/products/', payload);
        toast.success('Product submitted for admin review');
      }
      resetForm();
      setShowAddForm(false);
      fetchProducts();
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.error || data?.name?.[0] || data?.price?.[0] || data?.detail || 'Failed to save product';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20 dark:shadow-none">
            <ShoppingBag className="w-5.5 h-5.5 stroke-[2.25]" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {user?.seller_profile?.store_name || 'Seller Dashboard'}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Manage your product listings</p>
          </div>
        </div>
        <button
          onClick={openAddForm}
          className="flex items-center justify-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Listings', value: counts.all, icon: Package, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 border-blue-100 dark:border-blue-800' },
          { label: 'Pending Review', value: counts.pending, icon: Clock, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 border-amber-100 dark:border-amber-800' },
          { label: 'Live', value: counts.approved, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800' },
          { label: 'Rejected', value: counts.rejected, icon: XCircle, color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-400 border-rose-100 dark:border-rose-800' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-150 dark:border-gray-700 shadow-sm flex items-center gap-3.5 transition-all hover:shadow-md">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${s.color}`}>
              <s.icon className="w-5 h-5 stroke-[2.25]" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white leading-none">{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* A note about the review flow */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-3.5 text-xs text-blue-700 dark:text-blue-300">
        New products are reviewed by our team before they go live. Once approved, they'll appear in the store and buyers can purchase them right away.
      </div>

      {/* Products list */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-xs font-semibold text-gray-900 dark:text-white">My Products</h3>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-14">
            <Package className="w-14 h-14 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">You haven't listed any products yet</p>
            <button onClick={openAddForm} className="mt-3 text-xs font-semibold text-orange-600 hover:underline">
              Add your first product
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {products.map(p => {
              const meta = STATUS_META[p.status] || STATUS_META.pending;
              return (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                  <img src={p.image} alt={p.name} className="w-12 h-12 rounded-lg object-cover bg-gray-100 dark:bg-gray-700 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.category} &middot; Stock: {p.stock}</p>
                    {p.status === 'rejected' && p.rejection_reason && (
                      <p className="text-[11px] text-red-500 mt-0.5">Reason: {p.rejection_reason}</p>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white shrink-0">₹{p.discount_price || p.price}</p>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-medium capitalize px-2 py-1 rounded-full shrink-0 ${meta.bg} ${meta.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} /> {meta.label}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditForm(p)}
                      title="Edit"
                      className="p-2 rounded-lg text-gray-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      disabled={deletingId === p.id}
                      title="Delete"
                      className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddForm(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              {formError && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 text-xs font-medium px-3 py-2 rounded-lg">{formError}</div>
              )}
              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Product Name</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full mt-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full mt-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-400">
                    <option value="">Select...</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Brand (optional)</label>
                  <input type="text" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })}
                    className="w-full mt-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-400" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-0.5"><IndianRupee className="w-3 h-3" /> Price</label>
                  <input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                    className="w-full mt-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-400" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Sale Price</label>
                  <input type="number" min="0" step="0.01" value={form.discount_price} onChange={e => setForm({ ...form, discount_price: e.target.value })}
                    placeholder="Optional"
                    className="w-full mt-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-400" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Stock</label>
                  <input type="number" min="0" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })}
                    className="w-full mt-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-400" />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-0.5"><ImagePlus className="w-3 h-3" /> Main Image</label>
                  <span className="text-[10px] text-gray-400 font-semibold">Paste a URL or upload a file</span>
                </div>
                <div className="flex gap-2 mt-1">
                  <input type="text" value={form.image} onChange={e => setForm({ ...form, image: e.target.value })}
                    placeholder="https://..."
                    className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-400" />
                  <label className="cursor-pointer bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs px-4 rounded-lg flex items-center justify-center transition-colors shrink-0">
                    <Upload className="w-3.5 h-3.5 mr-1.5" /> Browse
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => { handleMainImageFile(e.target.files[0]); e.target.value = ''; }} />
                  </label>
                </div>
                {form.image && (
                  <img src={form.image} alt="Main preview" className="w-16 h-16 rounded-lg object-cover border border-gray-200 dark:border-gray-700 mt-2" />
                )}
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Additional Images (optional)</label>
                <input type="text" value={form.images} onChange={e => setForm({ ...form, images: e.target.value })}
                  placeholder="Paste URLs, comma-separated"
                  className="w-full mt-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-400" />
                <div className="flex flex-wrap gap-2 mt-2">
                  {uploadedImages.map((img, i) => (
                    <div key={i} className="relative group">
                      <img src={img} alt={`Upload ${i + 1}`} className="w-14 h-14 rounded-lg object-cover border border-gray-200 dark:border-gray-700" />
                      <button type="button" onClick={() => setUploadedImages(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                  <label className="w-14 h-14 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer hover:border-orange-400 transition-colors">
                    <Upload className="w-4 h-4 text-gray-400" />
                    <input type="file" accept="image/*" multiple className="hidden"
                      onChange={e => { handleExtraImageFiles(e.target.files); e.target.value = ''; }} />
                  </label>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Description</label>
                <textarea rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full mt-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-400" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-0.5"><Truck className="w-3 h-3" /> Delivery Estimate</label>
                  <input type="text" value={form.delivery} onChange={e => setForm({ ...form, delivery: e.target.value })}
                    placeholder="Free delivery by Tomorrow"
                    className="w-full mt-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-400" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Shipping Charge (₹)</label>
                  <input type="number" min="0" value={form.shipping_charge} onChange={e => setForm({ ...form, shipping_charge: e.target.value })}
                    placeholder="0 = free shipping"
                    className="w-full mt-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-400" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Seller Info & Policy (optional)</label>
                <input type="text" value={form.seller_info} onChange={e => setForm({ ...form, seller_info: e.target.value })}
                  placeholder="e.g. 7-day replacement on manufacturing defects"
                  className="w-full mt-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-400" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Highlights (one per line)</label>
                  <textarea rows={3} value={form.highlights} onChange={e => setForm({ ...form, highlights: e.target.value })}
                    placeholder={'Lightweight design\n1 year warranty'}
                    className="w-full mt-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-400" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Offers (optional, one per line)</label>
                  <textarea rows={3} value={form.offers} onChange={e => setForm({ ...form, offers: e.target.value })}
                    placeholder="Only list offers you can actually honor"
                    className="w-full mt-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-400" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Specifications (optional, one per line)</label>
                <textarea rows={3} value={form.specifications} onChange={e => setForm({ ...form, specifications: e.target.value })}
                  placeholder={'Material: Stainless Steel\nColor: Black'}
                  className="w-full mt-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-400 font-mono text-xs" />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Questions & Answers (optional)</label>
                <div className="space-y-2 mt-1">
                  {qaRows.map((row, i) => (
                    <div key={i} className="flex gap-2">
                      <div className="flex-1 space-y-1">
                        <input type="text" value={row.q} onChange={e => updateQaRow(i, 'q', e.target.value)}
                          placeholder="Question"
                          className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-400" />
                        <input type="text" value={row.a} onChange={e => updateQaRow(i, 'a', e.target.value)}
                          placeholder="Answer"
                          className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-400" />
                      </div>
                      <button type="button" onClick={() => removeQaRow(i)}
                        className="self-start p-2 text-gray-400 hover:text-red-600 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={addQaRow}
                    className="flex items-center gap-1 text-xs font-semibold text-orange-600 hover:underline">
                    <Plus className="w-3.5 h-3.5" /> Add question
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowAddForm(false)}
                  className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg disabled:opacity-50 transition-colors">
                  {submitting ? 'Saving...' : editingProduct ? 'Save Changes' : 'Submit for Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;
