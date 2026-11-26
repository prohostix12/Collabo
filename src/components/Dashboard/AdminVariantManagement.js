import React, { useState, useEffect, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, X, Image as ImageIcon, Power, PowerOff } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const NAVY = '#101A35';
const ORANGE = '#FF8A24';

const StatusBadge = ({ active }) => (
  <span
    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
      active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
    }`}
  >
    <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-500' : 'bg-gray-400'}`} />
    {active ? 'Active' : 'Inactive'}
  </span>
);

const StockBadge = ({ stock, threshold }) => {
  if (stock <= 0) return <span className="text-[11px] font-semibold text-red-600">Out of stock</span>;
  if (stock <= threshold) return <span className="text-[11px] font-semibold text-amber-600">Low ({stock})</span>;
  return <span className="text-[11px] text-gray-600">{stock}</span>;
};

export default function AdminVariantManagement() {
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [stock, setStock] = useState('all');
  const [colour, setColour] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [ordering, setOrdering] = useState('-updated_at');

  const pageSize = 10;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, ordering };
      if (search.trim()) params.search = search.trim();
      if (status !== 'all') params.status = status;
      if (stock !== 'all') params.stock = stock;
      if (colour.trim()) params.colour = colour.trim();
      if (priceMin) params.price_min = priceMin;
      if (priceMax) params.price_max = priceMax;
      const res = await api.get('/ecommerce/product-variants/', { params });
      setRows(res.data.results || []);
      setCount(res.data.count || 0);
    } catch (err) {
      toast.error('Failed to load variants');
    } finally {
      setLoading(false);
    }
  }, [page, ordering, search, status, stock, colour, priceMin, priceMax]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, status, stock, colour, priceMin, priceMax]);

  const toggleActive = async (row) => {
    try {
      const action = row.is_active ? 'deactivate' : 'activate';
      const res = await api.post(`/ecommerce/product-variants/${row.id}/${action}/`);
      setRows(prev => prev.map(r => (r.id === row.id ? res.data : r)));
      toast.success(row.is_active ? 'Variant deactivated' : 'Variant activated');
    } catch (err) {
      toast.error('Action failed');
    }
  };

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-bold" style={{ color: NAVY }}>Variant Management</h2>
        <span className="text-xs text-gray-500">{count} variant{count === 1 ? '' : 's'} across all sellers</span>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 flex flex-wrap gap-2 items-end">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search product name, ID or SKU"
            className="w-full pl-8 pr-2 py-2 text-xs border border-gray-200 rounded"
          />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)} className="text-xs border border-gray-200 rounded px-2 py-2">
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select value={stock} onChange={e => setStock(e.target.value)} className="text-xs border border-gray-200 rounded px-2 py-2">
          <option value="all">All stock</option>
          <option value="in">In stock</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </select>
        <input
          value={colour}
          onChange={e => setColour(e.target.value)}
          placeholder="Colour / HEX"
          className="w-28 text-xs border border-gray-200 rounded px-2 py-2"
        />
        <input
          type="number" value={priceMin} onChange={e => setPriceMin(e.target.value)}
          placeholder="Min ₹" className="w-20 text-xs border border-gray-200 rounded px-2 py-2"
        />
        <input
          type="number" value={priceMax} onChange={e => setPriceMax(e.target.value)}
          placeholder="Max ₹" className="w-20 text-xs border border-gray-200 rounded px-2 py-2"
        />
        <select value={ordering} onChange={e => setOrdering(e.target.value)} className="text-xs border border-gray-200 rounded px-2 py-2">
          <option value="-updated_at">Recently modified</option>
          <option value="price">Price: low to high</option>
          <option value="-price">Price: high to low</option>
          <option value="stock">Stock: low to high</option>
          <option value="-created_at">Newest first</option>
        </select>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wide text-gray-400" style={{ backgroundColor: '#F5F6FA' }}>
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2">Seller</th>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Colour</th>
                <th className="px-3 py-2">Attributes</th>
                <th className="px-3 py-2">MRP</th>
                <th className="px-3 py-2">Price</th>
                <th className="px-3 py-2">Discount</th>
                <th className="px-3 py-2">Stock</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Modified</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr><td colSpan={12} className="px-3 py-6 text-center text-gray-400">Loading…</td></tr>
              )}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={12} className="px-3 py-6 text-center text-gray-400">No variants match these filters.</td></tr>
              )}
              {!loading && rows.map(row => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {row.product_image ? (
                        <img src={row.product_image} alt="" className="w-7 h-7 rounded object-cover border border-gray-200" />
                      ) : (
                        <div className="w-7 h-7 rounded bg-gray-100 flex items-center justify-center">
                          <ImageIcon className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-gray-700 max-w-[140px] truncate">{row.product_name || `Product #${row.product}`}</div>
                        <div className="text-[10px] text-gray-400">#{row.product}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-gray-600">{row.seller_store_name || row.seller_username || '—'}</td>
                  <td className="px-3 py-2 font-mono text-gray-600">{row.sku}</td>
                  <td className="px-3 py-2">
                    {row.hex_code ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded-full border border-gray-300" style={{ backgroundColor: row.hex_code }} />
                        <span className="text-gray-500">{row.hex_code}</span>
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-3 py-2 text-gray-500 max-w-[120px] truncate">
                    {Object.entries(row.attributes || {}).map(([k, v]) => `${k}: ${v}`).join(', ') || '—'}
                  </td>
                  <td className="px-3 py-2 text-gray-500">{row.regular_price ? `₹${Number(row.regular_price).toLocaleString()}` : '—'}</td>
                  <td className="px-3 py-2 font-semibold text-gray-700">₹{Number(row.price).toLocaleString()}</td>
                  <td className="px-3 py-2">
                    {row.discount_percent > 0 ? (
                      <span className="font-semibold" style={{ color: ORANGE }}>{row.discount_percent}%</span>
                    ) : '—'}
                  </td>
                  <td className="px-3 py-2"><StockBadge stock={row.stock} threshold={row.low_stock_threshold} /></td>
                  <td className="px-3 py-2"><StatusBadge active={row.is_active} /></td>
                  <td className="px-3 py-2 text-gray-400">{row.updated_at ? new Date(row.updated_at).toLocaleDateString() : '—'}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setDetail(row)} className="text-[11px] font-semibold" style={{ color: NAVY }}>View</button>
                      <button
                        onClick={() => toggleActive(row)}
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold ${row.is_active ? 'text-red-600' : 'text-green-600'}`}
                      >
                        {row.is_active ? <PowerOff className="w-3 h-3" /> : <Power className="w-3 h-3" />}
                        {row.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Page {page} of {totalPages}</span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="p-1.5 rounded border border-gray-200 disabled:opacity-40"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded border border-gray-200 disabled:opacity-40"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Detail drawer */}
      {detail && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[85vh] overflow-y-auto p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold" style={{ color: NAVY }}>Variant Details</h3>
              <button onClick={() => setDetail(null)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <div className="space-y-2 text-xs">
              <Row label="Product" value={`${detail.product_name || ''} (#${detail.product})`} />
              <Row label="Seller" value={detail.seller_store_name || detail.seller_username} />
              <Row label="SKU" value={detail.sku} />
              <Row label="Attributes" value={Object.entries(detail.attributes || {}).map(([k, v]) => `${k}: ${v}`).join(', ') || '—'} />
              <Row label="Regular Price (MRP)" value={detail.regular_price ? `₹${detail.regular_price}` : '—'} />
              <Row label="Selling Price" value={`₹${detail.price}`} />
              <Row label="Discount" value={`${detail.discount_percent}%`} />
              <Row label="Stock" value={detail.stock} />
              <Row label="Status" value={detail.is_active ? 'Active' : 'Inactive'} />
              <Row label="Last Modified" value={detail.updated_at ? new Date(detail.updated_at).toLocaleString() : '—'} />
            </div>
            {detail.gallery_images && detail.gallery_images.length > 0 && (
              <div className="mt-4">
                <div className="text-[11px] font-semibold text-gray-500 mb-2">Image Gallery</div>
                <div className="flex gap-2 flex-wrap">
                  {detail.gallery_images.map(img => (
                    <img key={img.id} src={img.image} alt="" className="w-14 h-14 rounded object-cover border border-gray-200" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const Row = ({ label, value }) => (
  <div className="flex justify-between gap-3 py-1 border-b border-gray-50">
    <span className="text-gray-400">{label}</span>
    <span className="text-gray-700 font-medium text-right">{value}</span>
  </div>
);
