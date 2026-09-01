import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, X, Save, Link2, CheckCircle, XCircle, ExternalLink, Search, RefreshCw, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PLATFORM_LABELS = { amazon: 'Amazon India', flipkart: 'Flipkart India' };
const MATCH_METHOD_LABELS = {
  gtin: 'GTIN / UPC / EAN',
  brand_mpn: 'Brand + MPN',
  sku: 'SKU mapping',
  external_id: 'Marketplace product ID',
  normalized_name: 'Normalized name + brand',
  manual: 'Manual admin mapping',
};

const emptyForm = {
  product: null,
  platform: 'amazon',
  external_product_id: '',
  external_url: '',
  match_method: 'manual',
  is_active: true,
};

const CompetitorMapping = () => {
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [platformFilter, setPlatformFilter] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingMapping, setEditingMapping] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productQuery, setProductQuery] = useState('');
  const [productResults, setProductResults] = useState([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetchingId, setFetchingId] = useState(null);
  const searchDebounce = useRef(null);

  const fetchMappings = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (platformFilter) params.platform = platformFilter;
      if (verifiedFilter) params.is_verified = verifiedFilter;
      const res = await api.get('/pricing/competitor-mappings/', { params });
      setMappings(Array.isArray(res.data) ? res.data : (res.data.results || []));
    } catch (err) {
      toast.error('Failed to load competitor mappings');
    } finally {
      setLoading(false);
    }
  }, [platformFilter, verifiedFilter]);

  useEffect(() => { fetchMappings(); }, [fetchMappings]);

  const openModal = (mapping = null) => {
    if (mapping) {
      setEditingMapping(mapping);
      setFormData({
        product: mapping.product,
        platform: mapping.platform,
        external_product_id: mapping.external_product_id,
        external_url: mapping.external_url || '',
        match_method: mapping.match_method,
        is_active: mapping.is_active,
      });
      setSelectedProduct({ id: mapping.product, name: mapping.product_name, image: mapping.product_image, price: mapping.product_price });
    } else {
      setEditingMapping(null);
      setFormData(emptyForm);
      setSelectedProduct(null);
    }
    setProductQuery('');
    setProductResults([]);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingMapping(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleProductSearch = (value) => {
    setProductQuery(value);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (!value || value.trim().length < 2) {
      setProductResults([]);
      return;
    }
    searchDebounce.current = setTimeout(async () => {
      try {
        setSearchingProducts(true);
        const res = await api.get('/ecommerce/products/', { params: { search: value, page_size: 8 } });
        const results = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setProductResults(results);
      } catch (err) {
        // silent — search box just shows no results
      } finally {
        setSearchingProducts(false);
      }
    }, 350);
  };

  const pickProduct = (product) => {
    setSelectedProduct(product);
    setFormData((prev) => ({ ...prev, product: product.id }));
    setProductQuery('');
    setProductResults([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.product) {
      toast.error('Select a Collabo product to map first');
      return;
    }
    setSaving(true);
    try {
      if (editingMapping) {
        await api.put(`/pricing/competitor-mappings/${editingMapping.id}/`, formData);
        toast.success('Mapping updated');
      } else {
        await api.post('/pricing/competitor-mappings/', formData);
        toast.success('Mapping created');
      }
      closeModal();
      fetchMappings();
    } catch (err) {
      const data = err?.response?.data;
      const message = data ? Object.values(data).flat().join(' ') : 'Failed to save mapping';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this competitor mapping? Its price history will be kept.')) return;
    try {
      await api.delete(`/pricing/competitor-mappings/${id}/`);
      toast.success('Mapping deleted');
      fetchMappings();
    } catch (err) {
      toast.error('Failed to delete mapping');
    }
  };

  const toggleVerified = async (mapping) => {
    try {
      const action = mapping.is_verified ? 'unverify' : 'verify';
      await api.post(`/pricing/competitor-mappings/${mapping.id}/${action}/`);
      toast.success(mapping.is_verified ? 'Mapping unverified' : 'Mapping verified');
      fetchMappings();
    } catch (err) {
      toast.error('Failed to update verification status');
    }
  };

  const handleFetchPrice = async (mapping) => {
    setFetchingId(mapping.id);
    try {
      const res = await api.post(`/pricing/competitor-mappings/${mapping.id}/fetch-price/`);
      const row = res.data;
      if (row.fetch_succeeded) {
        toast.success(`${PLATFORM_LABELS[mapping.platform] || mapping.platform}: ₹${row.price}`);
      } else {
        toast.error(row.error_message || 'Fetch failed');
      }
      fetchMappings();
    } catch (err) {
      toast.error('Failed to fetch competitor price');
    } finally {
      setFetchingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Competitor Product Mapping</h2>
          <p className="text-sm text-slate-500">
            Map Collabo products to their Amazon ASIN / Flipkart product ID. Only verified, active mappings are used for pricing.
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Mapping
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200"
        >
          <option value="">All platforms</option>
          <option value="amazon">Amazon India</option>
          <option value="flipkart">Flipkart India</option>
        </select>
        <select
          value={verifiedFilter}
          onChange={(e) => setVerifiedFilter(e.target.value)}
          className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200"
        >
          <option value="">All statuses</option>
          <option value="true">Verified only</option>
          <option value="false">Unverified only</option>
        </select>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-left">Platform</th>
                <th className="px-4 py-3 text-left">External ID</th>
                <th className="px-4 py-3 text-left">Match Method</th>
                <th className="px-4 py-3 text-left">Latest Price</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {mappings.map((m) => (
                  <motion.tr
                    key={m.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-t border-slate-100 dark:border-slate-700"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {m.product_image && (
                          <img src={m.product_image} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="font-medium text-slate-900 dark:text-white truncate max-w-[220px]">{m.product_name}</div>
                          <div className="text-xs text-slate-500">₹{m.product_price}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{PLATFORM_LABELS[m.platform] || m.platform}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-mono text-xs">
                        {m.external_product_id}
                        {m.external_url && (
                          <a href={m.external_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{MATCH_METHOD_LABELS[m.match_method] || m.match_method}</td>
                    <td className="px-4 py-3">
                      {m.latest_price != null ? (
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">₹{m.latest_price}</div>
                          {m.latest_price_fetched_at && (
                            <div className="text-xs text-slate-400">{new Date(m.latest_price_fetched_at).toLocaleString()}</div>
                          )}
                        </div>
                      ) : m.latest_price_error ? (
                        <div className="flex items-center gap-1 text-xs text-red-500" title={m.latest_price_error}>
                          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate max-w-[140px]">{m.latest_price_error}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Not fetched yet</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => toggleVerified(m)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                            m.is_verified
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}
                        >
                          {m.is_verified ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {m.is_verified ? 'Verified' : 'Unverified'}
                        </button>
                        {!m.is_active && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                            Inactive
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleFetchPrice(m)}
                          disabled={fetchingId === m.id}
                          title="Fetch price now"
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-700 rounded-md disabled:opacity-50"
                        >
                          <RefreshCw className={`w-4 h-4 ${fetchingId === m.id ? 'animate-spin' : ''}`} />
                        </button>
                        <button onClick={() => openModal(m)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-md">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(m.id)} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 rounded-md">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {mappings.length === 0 && (
          <div className="py-12 text-center text-slate-500">
            <Link2 className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            No competitor mappings yet. Click &apos;Add Mapping&apos; to map a product to Amazon or Flipkart.
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={closeModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl w-full max-w-lg relative z-10 border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                {editingMapping ? 'Edit Competitor Mapping' : 'Add Competitor Mapping'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Collabo Product
                  </label>
                  {selectedProduct ? (
                    <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                      <div className="flex items-center gap-2 min-w-0">
                        {selectedProduct.image && <img src={selectedProduct.image} alt="" className="w-8 h-8 rounded object-cover" />}
                        <span className="text-sm text-slate-900 dark:text-white truncate">{selectedProduct.name}</span>
                      </div>
                      {!editingMapping && (
                        <button
                          type="button"
                          onClick={() => { setSelectedProduct(null); setFormData((p) => ({ ...p, product: null })); }}
                          className="text-xs text-red-500 hover:text-red-600 flex-shrink-0"
                        >
                          Change
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={productQuery}
                        onChange={(e) => handleProductSearch(e.target.value)}
                        placeholder="Search Collabo products by name, brand, category..."
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
                      />
                      {(searchingProducts || productResults.length > 0) && (
                        <div className="absolute z-20 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-56 overflow-y-auto">
                          {searchingProducts && (
                            <div className="px-3 py-2 text-xs text-slate-400">Searching...</div>
                          )}
                          {productResults.map((p) => (
                            <button
                              type="button"
                              key={p.id}
                              onClick={() => pickProduct(p)}
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-left"
                            >
                              {p.image && <img src={p.image} alt="" className="w-6 h-6 rounded object-cover" />}
                              <span className="text-sm text-slate-800 dark:text-slate-200 truncate">{p.name}</span>
                              <span className="ml-auto text-xs text-slate-400">₹{p.price}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Platform</label>
                    <select
                      name="platform"
                      value={formData.platform}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
                    >
                      <option value="amazon">Amazon India</option>
                      <option value="flipkart">Flipkart India</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Match Method</label>
                    <select
                      name="match_method"
                      value={formData.match_method}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
                    >
                      {Object.entries(MATCH_METHOD_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {formData.platform === 'amazon' ? 'Amazon ASIN' : 'Flipkart Product ID'}
                  </label>
                  <input
                    type="text"
                    name="external_product_id"
                    value={formData.external_product_id}
                    onChange={handleInputChange}
                    placeholder={formData.platform === 'amazon' ? 'e.g. B01N5IB20Q' : 'e.g. MOBFWQ6BYZJTGXHM'}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Listing URL <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="url"
                    name="external_url"
                    value={formData.external_url}
                    onChange={handleInputChange}
                    placeholder="https://www.amazon.in/dp/..."
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
                  />
                </div>

                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  Active (used for pricing once verified)
                </label>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 text-slate-700 dark:text-slate-300 font-medium bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-60"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : (editingMapping ? 'Save Changes' : 'Add Mapping')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CompetitorMapping;
