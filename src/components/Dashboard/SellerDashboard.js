import React, { useState, useEffect, useCallback } from 'react';
import {
  Store, Package, Plus, X, Clock, CheckCircle2, XCircle,
  IndianRupee, Boxes, ImagePlus,
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
};

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
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

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

  const resetForm = () => { setForm(emptyForm); setFormError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim()) return setFormError('Product name is required');
    if (!form.category) return setFormError('Please select a category');
    if (!form.price || Number(form.price) <= 0) return setFormError('Enter a valid price');
    if (!form.image.trim()) return setFormError('A main image URL is required');
    if (!form.description.trim()) return setFormError('Description is required');

    setSubmitting(true);
    try {
      const extraImages = form.images.split(',').map(s => s.trim()).filter(Boolean);
      await api.post('/ecommerce/products/', {
        name: form.name.trim(),
        category: form.category,
        brand: form.brand.trim(),
        price: Number(form.price),
        discount_price: form.discount_price ? Number(form.discount_price) : Number(form.price),
        stock: Number(form.stock) || 0,
        image: form.image.trim(),
        images: [form.image.trim(), ...extraImages],
        description: form.description.trim(),
      });
      toast.success('Product submitted for admin review');
      resetForm();
      setShowAddForm(false);
      fetchProducts();
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.error || data?.name?.[0] || data?.price?.[0] || data?.detail || 'Failed to submit product';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <Store className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              {user?.seller_profile?.store_name || 'Seller Dashboard'}
            </h1>
            <p className="text-xs text-gray-400">Manage your product listings</p>
          </div>
        </div>
        <button
          onClick={() => { setShowAddForm(true); resetForm(); }}
          className="flex items-center justify-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Listings', value: counts.all, icon: Boxes },
          { label: 'Pending Review', value: counts.pending, icon: Clock },
          { label: 'Live', value: counts.approved, icon: CheckCircle2 },
          { label: 'Rejected', value: counts.rejected, icon: XCircle },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <s.icon className="w-4 h-4 text-gray-400 mb-2" />
            <p className="text-lg font-bold text-gray-900 dark:text-white">{s.value}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
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
            <button onClick={() => setShowAddForm(true)} className="mt-3 text-xs font-semibold text-orange-600 hover:underline">
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
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Add Product</h2>
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
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-0.5"><ImagePlus className="w-3 h-3" /> Main Image URL</label>
                <input type="text" value={form.image} onChange={e => setForm({ ...form, image: e.target.value })}
                  placeholder="https://..."
                  className="w-full mt-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-400" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Additional Image URLs (optional, comma-separated)</label>
                <input type="text" value={form.images} onChange={e => setForm({ ...form, images: e.target.value })}
                  placeholder="https://..., https://..."
                  className="w-full mt-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-400" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Description</label>
                <textarea rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full mt-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-400" />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowAddForm(false)}
                  className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg disabled:opacity-50 transition-colors">
                  {submitting ? 'Submitting...' : 'Submit for Review'}
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
