import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Trash2, Pencil, Save, AlertCircle, Search, Upload } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const emptyForm = { id: null, attributesText: '', sku: '', price: '', stock: '', low_stock_threshold: '5', image: '', is_active: true };

const MAX_VARIANT_IMAGE_SIZE = 5 * 1024 * 1024;
const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onloadend = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const attrsToText = (attrs) => Object.entries(attrs || {}).map(([k, v]) => `${k}: ${v}`).join(', ');
const textToAttrs = (text) => {
  const out = {};
  text.split(',').forEach(part => {
    const [k, ...rest] = part.split(':');
    const key = (k || '').trim();
    const val = rest.join(':').trim();
    if (key && val) out[key] = val;
  });
  return out;
};

const VariantManagerModal = ({ product, onClose, onChanged, embedded = false }) => {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState(''); // '', 'low', 'out'
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [bulkRows, setBulkRows] = useState({}); // { [id]: {price, stock} } pending edits for bulk save
  const [bulkSaving, setBulkSaving] = useState(false);

  const fetchVariants = useCallback(() => {
    setLoading(true);
    const params = { product: product.id };
    if (search) params.search = search;
    if (stockFilter) params.stock = stockFilter;
    api.get('/ecommerce/product-variants/', { params })
      .then(res => setVariants(res.data.results || res.data))
      .catch(() => toast.error('Could not load variants'))
      .finally(() => setLoading(false));
  }, [product.id, search, stockFilter]);

  useEffect(() => { fetchVariants(); }, [fetchVariants]);

  const openAddForm = () => { setForm(emptyForm); setError(''); setShowForm(true); };
  const openEditForm = (v) => {
    setForm({
      id: v.id, attributesText: attrsToText(v.attributes), sku: v.sku,
      price: v.price, stock: v.stock, low_stock_threshold: v.low_stock_threshold,
      image: v.image || '', is_active: v.is_active,
    });
    setError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    setError('');
    const attributes = textToAttrs(form.attributesText);
    if (Object.keys(attributes).length === 0) return setError('Enter at least one attribute, e.g. "size: M, color: Black"');
    if (!form.price || Number(form.price) <= 0) return setError('Enter a valid price');
    if (form.stock === '' || Number(form.stock) < 0) return setError('Enter a valid stock quantity');

    setSaving(true);
    const payload = {
      product: product.id,
      attributes,
      sku: form.sku.trim(),
      price: form.price,
      stock: form.stock,
      low_stock_threshold: form.low_stock_threshold || 5,
      image: form.image,
      is_active: form.is_active,
    };
    try {
      if (form.id) {
        await api.patch(`/ecommerce/product-variants/${form.id}/`, payload);
        toast.success('Variant updated');
      } else {
        await api.post('/ecommerce/product-variants/', payload);
        toast.success('Variant added');
      }
      setShowForm(false);
      fetchVariants();
      onChanged();
    } catch (err) {
      const data = err.response?.data;
      setError(data?.sku?.[0] || data?.non_field_errors?.[0] || data?.detail || 'Could not save variant');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (v) => {
    if (!window.confirm(`Remove variant "${attrsToText(v.attributes)}" (SKU ${v.sku})? This cannot be undone.`)) return;
    try {
      await api.delete(`/ecommerce/product-variants/${v.id}/`);
      toast.success('Variant removed');
      fetchVariants();
      onChanged();
    } catch {
      toast.error('Could not remove variant — it may already be referenced by past orders. Try deactivating it instead.');
    }
  };

  const handleQuickStockAdjust = async (v, delta) => {
    try {
      await api.post(`/ecommerce/product-variants/${v.id}/adjust-stock/`, { delta });
      fetchVariants();
      onChanged();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not adjust stock');
    }
  };

  const setBulkField = (id, field, value) => {
    setBulkRows(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const handleBulkSave = async () => {
    const updates = Object.entries(bulkRows)
      .map(([id, fields]) => ({ id: Number(id), ...fields }))
      .filter(row => row.price !== undefined || row.stock !== undefined);
    if (updates.length === 0) return;
    setBulkSaving(true);
    try {
      const res = await api.post('/ecommerce/product-variants/bulk-update/', { updates });
      toast.success(`Updated ${res.data.updated.length} variant(s)`);
      if (res.data.errors?.length) toast.error(`${res.data.errors.length} row(s) failed`);
      setBulkRows({});
      fetchVariants();
      onChanged();
    } catch {
      toast.error('Bulk update failed');
    } finally {
      setBulkSaving(false);
    }
  };

  const inputCls = "w-full text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-400 dark:text-white";

  const content = (
    <>
        {!embedded && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Manage Variants</h3>
            <p className="text-[11px] text-gray-400">{product.name}</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="w-4 h-4" />
          </button>
        </div>
        )}

        <div className={`flex gap-2 px-5 py-3 border-b border-gray-100 dark:border-gray-700 shrink-0 ${embedded ? 'flex-col' : 'flex-col sm:flex-row'}`}>
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by SKU..."
              className="w-full pl-8 pr-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-xs bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-400 dark:text-white"
            />
          </div>
          <div className={`flex items-center gap-1.5 ${embedded ? 'justify-between' : ''}`}>
            <div className="flex gap-1 flex-wrap">
              {[{ id: '', label: 'All' }, { id: 'low', label: 'Low stock' }, { id: 'out', label: 'Out of stock' }].map(f => (
                <button type="button" key={f.id} onClick={() => setStockFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors ${stockFilter === f.id ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                  {f.label}
                </button>
              ))}
            </div>
            <button type="button" onClick={openAddForm} className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-[11px] font-bold rounded-lg transition-colors shrink-0 whitespace-nowrap">
              <Plus className="w-3.5 h-3.5" /> Add Variant
            </button>
          </div>
        </div>

        <div className={embedded ? 'max-h-80 overflow-y-auto px-5 py-3' : 'flex-1 overflow-y-auto px-5 py-3'}>
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin" />
            </div>
          ) : variants.length === 0 ? (
            <div className="text-center py-10 space-y-1">
              <p className="text-xs text-gray-400">No variants yet.</p>
              <p className="text-[11px] text-gray-400">Add one to start tracking size/colour-level price and stock — leave SKU blank to auto-generate it.</p>
            </div>
          ) : embedded ? (
            // Narrower, stacked card layout — the side-column Variants panel is too
            // narrow for the 5-column row layout used in the standalone modal.
            <div className="space-y-2">
              {variants.map(v => {
                const statusBadge = !v.is_active
                  ? <span className="text-[9px] font-bold text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">Inactive</span>
                  : v.stock === 0
                  ? <span className="text-[9px] font-bold text-red-600 bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded-full">Out</span>
                  : v.is_low_stock
                  ? <span className="text-[9px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-full">Low</span>
                  : <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full">OK</span>;
                return (
                  <div key={v.id} className={`p-2.5 rounded-lg border space-y-2 ${!v.is_active ? 'border-gray-100 dark:border-gray-700 opacity-60' : v.stock === 0 ? 'border-red-100 bg-red-50/40 dark:border-red-900/40' : v.is_low_stock ? 'border-amber-100 bg-amber-50/40 dark:border-amber-900/40' : 'border-gray-100 dark:border-gray-700'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-800 dark:text-white truncate">{attrsToText(v.attributes)}</p>
                        <p className="text-[10px] text-gray-400 font-mono truncate">{v.sku}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {statusBadge}
                        <button type="button" onClick={() => openEditForm(v)} className="p-1.5 rounded-md text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20">
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button type="button" onClick={() => handleDelete(v)} className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Price</label>
                        <input
                          type="number" defaultValue={v.price}
                          onChange={e => setBulkField(v.id, 'price', e.target.value)}
                          className={inputCls + ' mt-0.5'}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Stock</label>
                        <div className="flex items-center gap-1 mt-0.5">
                          <button type="button" onClick={() => handleQuickStockAdjust(v, -1)} className="shrink-0 w-6 h-6 flex items-center justify-center rounded border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-red-500">-</button>
                          <input
                            type="number" defaultValue={v.stock}
                            onChange={e => setBulkField(v.id, 'stock', e.target.value)}
                            className={inputCls + ' text-center'}
                          />
                          <button type="button" onClick={() => handleQuickStockAdjust(v, 1)} className="shrink-0 w-6 h-6 flex items-center justify-center rounded border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-emerald-500">+</button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="hidden sm:flex items-center gap-2 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                <span className="flex-1">Attributes / SKU</span>
                <span className="w-24 text-right">Price</span>
                <span className="w-28 text-right">Stock</span>
                <span className="w-20 text-right">Status</span>
                <span className="w-20 text-right">Actions</span>
              </div>
              {variants.map(v => (
                <div key={v.id} className={`flex items-center gap-2 px-2 py-2 rounded-lg border ${!v.is_active ? 'border-gray-100 dark:border-gray-700 opacity-50' : v.stock === 0 ? 'border-red-100 bg-red-50/40 dark:border-red-900/40' : v.is_low_stock ? 'border-amber-100 bg-amber-50/40 dark:border-amber-900/40' : 'border-gray-100 dark:border-gray-700'}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 dark:text-white truncate">{attrsToText(v.attributes)}</p>
                    <p className="text-[10px] text-gray-400 font-mono">{v.sku}</p>
                  </div>
                  <div className="w-24 text-right">
                    <input
                      type="number" defaultValue={v.price}
                      onChange={e => setBulkField(v.id, 'price', e.target.value)}
                      className={inputCls + ' text-right'}
                    />
                  </div>
                  <div className="w-28 flex items-center justify-end gap-1">
                    <button type="button" onClick={() => handleQuickStockAdjust(v, -1)} className="text-gray-400 hover:text-red-500 px-1">-</button>
                    <input
                      type="number" defaultValue={v.stock}
                      onChange={e => setBulkField(v.id, 'stock', e.target.value)}
                      className={inputCls + ' text-right w-14'}
                    />
                    <button type="button" onClick={() => handleQuickStockAdjust(v, 1)} className="text-gray-400 hover:text-emerald-500 px-1">+</button>
                  </div>
                  <div className="w-20 text-right">
                    {!v.is_active ? (
                      <span className="text-[9px] font-bold text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">Inactive</span>
                    ) : v.stock === 0 ? (
                      <span className="text-[9px] font-bold text-red-600 bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded-full">Out</span>
                    ) : v.is_low_stock ? (
                      <span className="text-[9px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-full">Low</span>
                    ) : (
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full">OK</span>
                    )}
                  </div>
                  <div className="w-20 flex items-center justify-end gap-1">
                    <button type="button" onClick={() => openEditForm(v)} className="p-1.5 rounded-md text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20">
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button type="button" onClick={() => handleDelete(v)} className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {Object.keys(bulkRows).length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between shrink-0 bg-orange-50/50 dark:bg-orange-900/10">
            <p className="text-[11px] text-gray-600 dark:text-gray-300">{Object.keys(bulkRows).length} variant(s) changed</p>
            <button type="button" onClick={handleBulkSave} disabled={bulkSaving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-[11px] font-bold rounded-lg disabled:opacity-50 transition-colors">
              <Save className="w-3.5 h-3.5" /> {bulkSaving ? 'Saving...' : 'Save Price/Stock Changes'}
            </button>
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 z-[10000] bg-black/40 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-5 space-y-3" onClick={e => e.stopPropagation()}>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">{form.id ? 'Edit Variant' : 'Add Variant'}</h4>
              {error && <div className="bg-red-50 border border-red-100 rounded-lg p-2 text-[11px] text-red-600 flex items-start gap-1.5"><AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />{error}</div>}
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Attributes *</label>
                <input type="text" value={form.attributesText} onChange={e => setForm(f => ({ ...f, attributesText: e.target.value }))}
                  placeholder="size: M, color: Black" className={inputCls + ' mt-1'} />
                <p className="text-[9px] text-gray-400 mt-0.5">Comma-separated "key: value" pairs</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">SKU</label>
                <input type="text" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                  placeholder="Leave blank to auto-generate" className={inputCls + ' mt-1'} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Price *</label>
                  <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className={inputCls + ' mt-1'} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Stock *</label>
                  <input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} className={inputCls + ' mt-1'} />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Variant Image (optional)</label>
                <div className="flex gap-2 mt-1">
                  <input type="text" value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
                    placeholder="Paste a URL or upload a file" className={inputCls + ' flex-1'} />
                  <label className="cursor-pointer bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs px-3 rounded-lg flex items-center justify-center transition-colors shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <input type="file" accept="image/*" className="hidden"
                      onChange={async e => {
                        const file = e.target.files[0];
                        e.target.value = '';
                        if (!file) return;
                        if (file.size > MAX_VARIANT_IMAGE_SIZE) { toast.error('Image must be under 5MB'); return; }
                        const dataUrl = await fileToDataUrl(file);
                        setForm(f => ({ ...f, image: dataUrl }));
                      }} />
                  </label>
                </div>
                {form.image && (
                  <img src={form.image} alt="Variant preview" className="w-14 h-14 rounded-lg object-cover border border-gray-200 dark:border-gray-700 mt-2" />
                )}
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-3.5 h-3.5" />
                <span className="text-[11px] text-gray-600 dark:text-gray-300">Active (visible to buyers)</span>
              </label>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 text-xs font-bold text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  Cancel
                </button>
                <button type="button" onClick={handleSave} disabled={saving} className="flex-1 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-lg disabled:opacity-50 transition-colors">
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
    </>
  );

  if (embedded) return content;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {content}
      </div>
    </div>
  );
};

export default VariantManagerModal;
