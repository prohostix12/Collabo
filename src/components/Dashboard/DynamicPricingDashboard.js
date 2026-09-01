import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Package, ShoppingBag, TrendingDown, Clock, AlertTriangle,
  RefreshCw, Power, LineChart,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CARD_STYLES = {
  blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
  orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600',
  yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600',
  emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600',
  amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600',
  red: 'bg-red-100 dark:bg-red-900/30 text-red-600',
};

const formatMoney = (value) => {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

const formatTime = (iso) => {
  if (!iso) return null;
  return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
};

const DynamicPricingDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [summaryRes, tableRes] = await Promise.all([
        api.get('/pricing/dynamic-pricing/dashboard/'),
        api.get('/pricing/dynamic-pricing/comparison/'),
      ]);
      setSummary(summaryRes.data);
      setRows(tableRes.data);
    } catch (err) {
      toast.error('Failed to load dynamic pricing dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const cards = summary ? [
    { label: 'Products Monitored', value: summary.products_monitored, icon: Package, color: 'blue' },
    { label: 'Amazon Checked', value: summary.amazon_checked, icon: ShoppingBag, color: 'orange' },
    { label: 'Flipkart Checked', value: summary.flipkart_checked, icon: ShoppingBag, color: 'yellow' },
    { label: 'Prices Changed', value: summary.prices_changed, icon: TrendingDown, color: 'emerald' },
    { label: 'Pending Approval', value: summary.pending_approval, icon: Clock, color: 'amber' },
    { label: 'API Failures', value: summary.api_failures, icon: AlertTriangle, color: 'red' },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <LineChart className="w-5 h-5 text-emerald-600" />
            Dynamic Pricing
          </h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 mt-1">
            <span className="flex items-center gap-1">
              <Power className={`w-3.5 h-3.5 ${summary?.global_auto_pricing_enabled ? 'text-emerald-500' : 'text-slate-400'}`} />
              Automatic Pricing: <strong className={summary?.global_auto_pricing_enabled ? 'text-emerald-600' : 'text-slate-500'}>
                {summary?.global_auto_pricing_enabled ? 'ON' : 'OFF'}
              </strong>
            </span>
            <span>Last Sync: {formatTime(summary?.last_sync_completed_at) || 'Never run yet'}</span>
            <span>Sync Frequency: Every 6 hours</span>
          </div>
        </div>
        <button
          onClick={() => fetchAll(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((card) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4"
          >
            <div className={`inline-flex p-2 rounded-lg mb-2 ${CARD_STYLES[card.color]}`}>
              <card.icon className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{card.value.toLocaleString()}</div>
            <div className="text-xs text-slate-500">{card.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Competitor Price Comparison</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-right">Amazon</th>
                <th className="px-4 py-3 text-right">Flipkart</th>
                <th className="px-4 py-3 text-right">Collabo</th>
                <th className="px-4 py-3 text-right">Suggested</th>
                <th className="px-4 py-3 text-left">Last Checked</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.product_id} className="border-t border-slate-100 dark:border-slate-700">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {row.product_image && (
                        <img src={row.product_image} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                      )}
                      <span className="font-medium text-slate-900 dark:text-white truncate max-w-[200px]">{row.product_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">
                    {formatMoney(row.amazon_price) || <span className="text-slate-300 dark:text-slate-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">
                    {formatMoney(row.flipkart_price) || <span className="text-slate-300 dark:text-slate-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-white">
                    {formatMoney(row.collabo_price)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.suggested_price ? (
                      <span className="font-semibold text-emerald-600">{formatMoney(row.suggested_price)}</span>
                    ) : (
                      <span className="text-xs text-slate-400">{row.has_valid_data ? '—' : 'No valid data'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {formatTime(row.last_checked) || 'Not checked yet'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rows.length === 0 && (
          <div className="py-12 text-center text-slate-500">
            <LineChart className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            No products are currently monitored. Enable automatic pricing on a verified competitor mapping to see it here.
          </div>
        )}
      </div>
    </div>
  );
};

export default DynamicPricingDashboard;
