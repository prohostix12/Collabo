import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const NAVY = '#101A35';

const ACTION_LABELS = {
  created: 'Created',
  updated: 'Updated',
  deleted: 'Deleted',
  image_added: 'Image Added',
  image_removed: 'Image Removed',
};

const ActionBadge = ({ action }) => {
  const colorMap = {
    created: 'bg-green-50 text-green-700',
    updated: 'bg-blue-50 text-blue-700',
    deleted: 'bg-red-50 text-red-700',
    image_added: 'bg-purple-50 text-purple-700',
    image_removed: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${colorMap[action] || 'bg-gray-100 text-gray-600'}`}>
      {ACTION_LABELS[action] || action}
    </span>
  );
};

export default function AdminVariantHistory() {
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  const [product, setProduct] = useState('');
  const [sku, setSku] = useState('');
  const [action, setAction] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const pageSize = 10;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page };
      if (product.trim()) params.product = product.trim();
      if (sku.trim()) params.sku = sku.trim();
      if (action !== 'all') params.action = action;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const res = await api.get('/ecommerce/variant-change-log/', { params });
      setRows(res.data.results || []);
      setCount(res.data.count || 0);
    } catch (err) {
      toast.error('Failed to load variant change history');
    } finally {
      setLoading(false);
    }
  }, [page, product, sku, action, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [product, sku, action, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-bold" style={{ color: NAVY }}>Variant Change History</h2>
        <span className="text-xs text-gray-500">{count} record{count === 1 ? '' : 's'} — read-only audit trail</span>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-3 flex flex-wrap gap-2 items-end">
        <input
          value={product} onChange={e => setProduct(e.target.value)}
          placeholder="Product ID" className="w-24 text-xs border border-gray-200 rounded px-2 py-2"
        />
        <input
          value={sku} onChange={e => setSku(e.target.value)}
          placeholder="SKU" className="w-32 text-xs border border-gray-200 rounded px-2 py-2"
        />
        <select value={action} onChange={e => setAction(e.target.value)} className="text-xs border border-gray-200 rounded px-2 py-2">
          <option value="all">All change types</option>
          {Object.entries(ACTION_LABELS).map(([k, label]) => (
            <option key={k} value={k}>{label}</option>
          ))}
        </select>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border border-gray-200 rounded px-2 py-2 text-xs" />
          <span>to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border border-gray-200 rounded px-2 py-2 text-xs" />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wide text-gray-400" style={{ backgroundColor: '#F5F6FA' }}>
                <th className="px-3 py-2">Date/Time</th>
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Seller</th>
                <th className="px-3 py-2">Changed By</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Change Type</th>
                <th className="px-3 py-2">Fields Changed</th>
                <th className="px-3 py-2">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr><td colSpan={9} className="px-3 py-6 text-center text-gray-400">Loading…</td></tr>
              )}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={9} className="px-3 py-6 text-center text-gray-400">No audit records match these filters.</td></tr>
              )}
              {!loading && rows.map(row => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{new Date(row.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2 text-gray-700 max-w-[140px] truncate">{row.product_name || '—'} {row.product_id ? `(#${row.product_id})` : ''}</td>
                  <td className="px-3 py-2 font-mono text-gray-600">{row.variant_sku || '—'}</td>
                  <td className="px-3 py-2 text-gray-600">{row.seller_username || '—'}</td>
                  <td className="px-3 py-2 text-gray-600">{row.actor_username || 'System'}</td>
                  <td className="px-3 py-2 text-gray-500">{row.actor_role || '—'}</td>
                  <td className="px-3 py-2"><ActionBadge action={row.action} /></td>
                  <td className="px-3 py-2 text-gray-500">{Object.keys(row.changes || {}).join(', ') || '—'}</td>
                  <td className="px-3 py-2">
                    <button onClick={() => setDetail(row)} className="text-[11px] font-semibold" style={{ color: NAVY }}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Page {page} of {totalPages}</span>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="p-1.5 rounded border border-gray-200 disabled:opacity-40">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="p-1.5 rounded border border-gray-200 disabled:opacity-40">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {detail && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[85vh] overflow-y-auto p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold" style={{ color: NAVY }}>Change History Details</h3>
              <button onClick={() => setDetail(null)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <div className="space-y-2 text-xs mb-4">
              <div className="flex justify-between py-1 border-b border-gray-50"><span className="text-gray-400">Product</span><span className="font-medium">{detail.product_name} (#{detail.product_id})</span></div>
              <div className="flex justify-between py-1 border-b border-gray-50"><span className="text-gray-400">SKU</span><span className="font-medium">{detail.variant_sku || '—'}</span></div>
              <div className="flex justify-between py-1 border-b border-gray-50"><span className="text-gray-400">Seller</span><span className="font-medium">{detail.seller_username || '—'}</span></div>
              <div className="flex justify-between py-1 border-b border-gray-50"><span className="text-gray-400">Changed by</span><span className="font-medium">{detail.actor_username || 'System'} ({detail.actor_role || '—'})</span></div>
              <div className="flex justify-between py-1 border-b border-gray-50"><span className="text-gray-400">When</span><span className="font-medium">{new Date(detail.created_at).toLocaleString()}</span></div>
              <div className="flex justify-between py-1 border-b border-gray-50"><span className="text-gray-400">Change type</span><ActionBadge action={detail.action} /></div>
            </div>
            <div className="text-[11px] font-semibold text-gray-500 mb-2">Field Changes</div>
            <div className="border border-gray-100 rounded divide-y divide-gray-100">
              {Object.entries(detail.changes || {}).map(([field, { old, new: newVal }]) => (
                <div key={field} className="flex items-center justify-between px-3 py-2 text-xs">
                  <span className="font-medium text-gray-600 capitalize">{field.replace(/_/g, ' ')}</span>
                  <span className="text-gray-400">
                    <span className="line-through">{old === null || old === undefined ? '—' : String(old)}</span>
                    {' → '}
                    <span className="text-gray-700 font-semibold">{newVal === null || newVal === undefined ? '—' : String(newVal)}</span>
                  </span>
                </div>
              ))}
              {Object.keys(detail.changes || {}).length === 0 && (
                <div className="px-3 py-2 text-xs text-gray-400">No field-level details recorded.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
