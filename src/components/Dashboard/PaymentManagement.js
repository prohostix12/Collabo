import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Users, Package, Clock, CheckCircle, XCircle, Search, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PaymentManagement = () => {
  const [analytics, setAnalytics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [sellerPayouts, setSellerPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [analyticsRes, ordersRes, payoutsRes] = await Promise.all([
        api.get('/ecommerce/admin/analytics/'),
        api.get('/ecommerce/orders/'),
        api.get('/ecommerce/admin/seller-payouts/').catch(() => ({ data: [] })),
      ]);
      setAnalytics(analyticsRes.data);
      setOrders((ordersRes.data.results || ordersRes.data || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      setSellerPayouts(payoutsRes.data?.results || payoutsRes.data || []);
    } catch {
      toast.error('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" /></div>;
  }

  const completedOrders = orders.filter(o => o.payment_status === 'completed');
  const totalRevenue = completedOrders.reduce((s, o) => s + parseFloat(o.final_amount || 0), 0);
  const platformFee = totalRevenue * 0.10;
  const totalRefunds = orders.filter(o => o.status === 'refunded').reduce((s, o) => s + parseFloat(o.final_amount || 0), 0);
  const influencerCommissions = analytics?.commissions?.total_paid || 0;
  const pendingCommissions = analytics?.commissions?.total_pending || 0;
  const pendingPayouts = sellerPayouts.filter(p => p.status === 'pending');

  const filteredOrders = orders.filter(o => {
    if (orderStatusFilter !== 'all' && o.payment_status !== orderStatusFilter) return false;
    if (searchQuery && !o.order_id?.toLowerCase().includes(searchQuery.toLowerCase()) && !o.user_username?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Financial Overview</h2>
          <p className="text-[11px] text-gray-500">Real-time payment and revenue data</p>
        </div>
        <button onClick={fetchAll} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1">
        {['overview', 'orders', 'commissions', 'payouts'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors ${tab === t ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: DollarSign, sub: `${completedOrders.length} completed orders` },
              { label: 'Platform Earnings', value: `₹${platformFee.toLocaleString()}`, icon: TrendingUp, sub: '10% commission' },
              { label: 'Influencer Payouts', value: `₹${influencerCommissions.toLocaleString()}`, icon: Users, sub: `₹${pendingCommissions.toLocaleString()} pending` },
              { label: 'Refunds Issued', value: `₹${totalRefunds.toLocaleString()}`, icon: XCircle, sub: `${orders.filter(o => o.status === 'refunded').length} orders` },
            ].map(s => (
              <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl p-3.5 border border-gray-200 dark:border-gray-700">
                <s.icon className="w-4 h-4 text-gray-400 mb-2" />
                <p className="text-lg font-bold text-gray-900 dark:text-white">{s.value}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
                <p className="text-[9px] text-gray-400 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Monthly Revenue */}
          {analytics?.orders?.monthly && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-3">Monthly Revenue</h3>
              <div className="space-y-2">
                {analytics.orders.monthly.map((m, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-500 w-20">{m.month}</span>
                    <div className="flex-1 mx-3 bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div className="bg-gray-900 dark:bg-white h-full rounded-full" style={{ width: `${totalRevenue > 0 ? (m.revenue / totalRevenue) * 100 : 0}%` }} />
                    </div>
                    <span className="text-gray-900 dark:text-white font-medium w-24 text-right">₹{m.revenue.toLocaleString()}</span>
                    <span className="text-gray-400 w-16 text-right">{m.orders} orders</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Seller Payouts */}
          {pendingPayouts.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-3">Pending Seller Payouts ({pendingPayouts.length})</h3>
              <div className="space-y-2">
                {pendingPayouts.map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700 last:border-0">
                    <div>
                      <p className="text-[11px] font-medium text-gray-900 dark:text-white">{p.seller_username}</p>
                      <p className="text-[10px] text-gray-400">{new Date(p.requested_at).toLocaleDateString()}</p>
                    </div>
                    <span className="text-[11px] font-semibold text-gray-900 dark:text-white">₹{parseFloat(p.amount).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ORDERS TAB */}
      {tab === 'orders' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-1">
              {['all', 'completed', 'pending', 'failed'].map(f => (
                <button key={f} onClick={() => setOrderStatusFilter(f)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors ${orderStatusFilter === f ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                  {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search order ID or customer..."
                className="w-full pl-8 pr-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-[11px] focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white dark:bg-gray-800" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  {['Order', 'Customer', 'Amount', 'Payment', 'Status', 'Date'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-[10px] font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {filteredOrders.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-[11px] text-gray-400">No orders found</td></tr>
                ) : filteredOrders.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-2.5 text-[11px] font-mono text-gray-700 dark:text-gray-300">{o.order_id}</td>
                    <td className="px-4 py-2.5 text-[11px] text-gray-700 dark:text-gray-300">{o.user_username}</td>
                    <td className="px-4 py-2.5 text-[11px] font-medium text-gray-900 dark:text-white">₹{parseFloat(o.final_amount).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-[10px] text-gray-500 uppercase">{o.payment_method}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${
                        o.payment_status === 'completed' ? 'text-emerald-600' : o.payment_status === 'failed' ? 'text-red-500' : 'text-amber-600'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${o.payment_status === 'completed' ? 'bg-emerald-400' : o.payment_status === 'failed' ? 'bg-red-400' : 'bg-amber-400'}`} />
                        {o.payment_status}
                        {o.status === 'refunded' && <span className="text-red-500 ml-1">(Refunded)</span>}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[10px] text-gray-500">{new Date(o.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* COMMISSIONS TAB */}
      {tab === 'commissions' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Paid', value: `₹${influencerCommissions.toLocaleString()}`, color: 'text-emerald-600' },
              { label: 'Pending', value: `₹${pendingCommissions.toLocaleString()}`, color: 'text-amber-600' },
              { label: 'Active Influencers', value: analytics?.affiliates?.active_influencers || 0, color: 'text-gray-900' },
            ].map(s => (
              <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl p-3.5 border border-gray-200 dark:border-gray-700">
                <p className={`text-lg font-bold ${s.color} dark:text-white`}>{s.value}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Top Influencers */}
          {analytics?.commissions?.top_influencers?.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-xs font-semibold text-gray-900 dark:text-white">Top Earning Influencers</h3>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    {['Influencer', 'Clicks', 'Conversions', 'Earned'].map(h => (
                      <th key={h} className="px-4 py-2 text-[10px] font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                  {analytics.commissions.top_influencers.map((inf, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-4 py-2.5">
                        <p className="text-[11px] font-medium text-gray-900 dark:text-white">{inf.full_name || inf.username}</p>
                        <p className="text-[10px] text-gray-400">@{inf.username}</p>
                      </td>
                      <td className="px-4 py-2.5 text-[11px] text-gray-600">{inf.total_clicks?.toLocaleString() || 0}</td>
                      <td className="px-4 py-2.5 text-[11px] text-gray-600">{inf.conversions}</td>
                      <td className="px-4 py-2.5 text-[11px] font-semibold text-emerald-600">₹{inf.total_earned.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* PAYOUTS TAB */}
      {tab === 'payouts' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-gray-900 dark:text-white">Seller Withdrawal Requests</h3>
            <span className="text-[10px] text-gray-400">{sellerPayouts.length} total</span>
          </div>
          {sellerPayouts.length === 0 ? (
            <div className="px-4 py-8 text-center text-[11px] text-gray-400">No payout requests yet</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  {['Seller', 'Amount', 'Status', 'Requested', 'Reference'].map(h => (
                    <th key={h} className="px-4 py-2 text-[10px] font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {sellerPayouts.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-2.5 text-[11px] font-medium text-gray-900 dark:text-white">{p.seller_username}</td>
                    <td className="px-4 py-2.5 text-[11px] font-semibold text-gray-900 dark:text-white">₹{parseFloat(p.amount).toLocaleString()}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${
                        p.status === 'completed' ? 'text-emerald-600' : p.status === 'rejected' ? 'text-red-500' : p.status === 'processing' ? 'text-blue-600' : 'text-amber-600'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          p.status === 'completed' ? 'bg-emerald-400' : p.status === 'rejected' ? 'bg-red-400' : p.status === 'processing' ? 'bg-blue-400' : 'bg-amber-400'
                        }`} />
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[10px] text-gray-500">{new Date(p.requested_at).toLocaleDateString()}</td>
                    <td className="px-4 py-2.5 text-[10px] text-gray-500 font-mono">{p.bank_reference || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentManagement;
