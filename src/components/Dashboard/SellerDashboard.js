import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Store, Package, Plus, X, Clock, CheckCircle2, XCircle,
  IndianRupee, Boxes, ImagePlus, Upload, ShoppingBag, Pencil, Trash2, Truck,
  TrendingUp, ArrowUpCircle, ArrowDownCircle, ShoppingCart, LayoutGrid, Download, FileSpreadsheet, Search,
  LayoutDashboard, ClipboardList, Tag, Wallet, Star, RotateCcw, Ban, Calendar, Layers,
  Eye, EyeOff,
} from 'lucide-react';
import {
  ResponsiveContainer, ComposedChart, Area, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import StoreBuilder from './StoreBuilder';
import VariantManagerModal from './VariantManagerModal';

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
// Shown instead of "Live" the moment stock hits 0, so the seller sees it's out of stock without
// having to open the Update Stock popover. It reverts to "Live" automatically once stock is restocked.
const OUT_OF_STOCK_META = { label: 'Out of Stock', dot: 'bg-red-400', text: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' };
// Shown when the seller has deactivated an approved listing (is_active=false) — hidden from
// buyers but keeps its stock/order history, distinct from admin rejection.
const INACTIVE_META = { label: 'Inactive', dot: 'bg-red-400', text: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' };

const productStatusMeta = (p) => {
  if (p.status === 'approved' && p.is_active === false) return INACTIVE_META;
  if (p.status === 'approved' && Number(p.stock) <= 0) return OUT_OF_STOCK_META;
  return STATUS_META[p.status] || STATUS_META.pending;
};

const RevenueChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const fulfilled = payload.find(p => p.dataKey === 'revenue');
  const cancelled = payload.find(p => p.dataKey === 'cancelled_revenue');
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 px-4 py-3 space-y-1.5">
      <p className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">{label}</p>
      {fulfilled && (
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
          <span className="text-gray-500 dark:text-gray-400">Fulfilled</span>
          <span className="font-semibold text-gray-900 dark:text-white ml-auto">₹{Number(fulfilled.value).toLocaleString('en-IN')}</span>
        </div>
      )}
      {cancelled && (
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-gray-400 shrink-0" />
          <span className="text-gray-500 dark:text-gray-400">Cancelled</span>
          <span className="font-semibold text-gray-900 dark:text-white ml-auto">₹{Number(cancelled.value).toLocaleString('en-IN')}</span>
        </div>
      )}
    </div>
  );
};

const SellerDashboard = () => {
  const { user, updateUser } = useAuth();
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [productStatusFilter, setProductStatusFilter] = useState('all');
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [togglingActiveId, setTogglingActiveId] = useState(null);

  const productCategories = useMemo(
    () => Array.from(new Set(products.map(p => p.category).filter(Boolean))).sort(),
    [products]
  );
  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    return products.filter(p => {
      if (q && !p.name?.toLowerCase().includes(q)) return false;
      if (productCategoryFilter !== 'all' && p.category !== productCategoryFilter) return false;
      if (productStatusFilter !== 'all') {
        if (productStatusFilter === 'inactive') {
          if (!(p.status === 'approved' && p.is_active === false)) return false;
        } else if (productStatusFilter === 'approved') {
          if (!(p.status === 'approved' && p.is_active !== false && Number(p.stock) > 0)) return false;
        } else {
          const outOfStock = p.status === 'approved' && Number(p.stock) <= 0;
          const effectiveStatus = outOfStock ? 'out_of_stock' : p.status;
          if (effectiveStatus !== productStatusFilter) return false;
        }
      }
      return true;
    });
  }, [products, productSearch, productCategoryFilter, productStatusFilter]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [variantManagerProduct, setVariantManagerProduct] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [qaRows, setQaRows] = useState([emptyQaRow()]);
  // New-product variant builder: up to 2 options (e.g. Size, Color), each with
  // comma-separated values. Rows are the cartesian product, editable per-row
  // before the variants are actually created (right after the product itself).
  const [variantOption1, setVariantOption1] = useState({ name: '', values: '' });
  const [variantOption2, setVariantOption2] = useState({ name: '', values: '' });
  const [variantRowOverrides, setVariantRowOverrides] = useState({});
  // "Others" in the category dropdown lets a seller type a category name that
  // isn't in the admin-curated list yet — saved as free text on the product
  // (Product.category is a plain CharField, no FK, so this needs no new endpoint).
  const [isOtherCategory, setIsOtherCategory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [salesSearch, setSalesSearch] = useState('');
  const [salesSortBy, setSalesSortBy] = useState('revenue');

  // Earnings & payouts
  const [earnings, setEarnings] = useState(null);
  const [earningsLoading, setEarningsLoading] = useState(false);
  const [payouts, setPayouts] = useState(null);
  const [payoutsLoading, setPayoutsLoading] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  // Reviews
  const [reviews, setReviews] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Orders
  const [orders, setOrders] = useState(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  const filteredSalesProducts = useMemo(() => {
    if (!analytics?.products) return [];
    const q = salesSearch.trim().toLowerCase();
    const list = q ? analytics.products.filter(p => p.name?.toLowerCase().includes(q)) : [...analytics.products];
    const sorters = {
      revenue: (a, b) => b.revenue - a.revenue,
      units_sold: (a, b) => b.units_sold - a.units_sold,
      stock: (a, b) => a.stock - b.stock,
      name: (a, b) => (a.name || '').localeCompare(b.name || ''),
    };
    return list.sort(sorters[salesSortBy] || sorters.revenue);
  }, [analytics, salesSearch, salesSortBy]);
  const [stockProductId, setStockProductId] = useState(null);
  const [stockQty, setStockQty] = useState('1');
  const [stockExact, setStockExact] = useState('');
  const [stockSubmitting, setStockSubmitting] = useState(false);

  // Bulk upload (Excel / CSV)
  const [showBulk, setShowBulk] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkStock, setBulkStock] = useState('10');
  const [bulkPreview, setBulkPreview] = useState(null);
  const [bulkFilter, setBulkFilter] = useState('all');
  const [bulkBusy, setBulkBusy] = useState(false);

  const closeBulk = () => { setShowBulk(false); setBulkFile(null); setBulkPreview(null); setBulkFilter('all'); setBulkBusy(false); };

  const downloadTemplate = async (fileFormat) => {
    try {
      const res = await api.get('/ecommerce/products/import-template/', { params: { file_format: fileFormat }, responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `collabo-seller-template.${fileFormat}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error('Could not download the template. Please try again.');
    }
  };

  const sendBulk = async (dryRun) => {
    if (!bulkFile) { toast.error('Choose a file first'); return; }
    setBulkBusy(true);
    try {
      const body = new FormData();
      body.append('file', bulkFile);
      body.append('default_stock', bulkStock === '' ? '' : String(Math.max(0, parseInt(bulkStock, 10) || 0)));
      if (dryRun) body.append('dry_run', 'true');
      const res = await api.post('/ecommerce/products/import-csv/', body, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 });
      if (dryRun) {
        setBulkFilter('all');
        setBulkPreview(res.data);
      } else {
        toast.success(res.data.message || 'Products imported');
        fetchProducts();
        closeBulk();
      }
    } catch (err) {
      const d = err.response?.data;
      if (d?.items) setBulkPreview(d);
      toast.error(d?.error || 'Could not read that file. Please check it and try again.');
    } finally {
      setBulkBusy(false);
    }
  };

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
    api.get('/ecommerce/categories/?page_size=1000')
      .then(res => setCategories(res.data.results || res.data || []))
      .catch(() => setCategories([]));
  }, []);

  const fetchAnalytics = useCallback(() => {
    setAnalyticsLoading(true);
    api.get('/ecommerce/seller/analytics/')
      .then(res => setAnalytics(res.data))
      .catch(() => setAnalytics(null))
      .finally(() => setAnalyticsLoading(false));
  }, []);

  useEffect(() => {
    if ((activeTab === 'analytics' || activeTab === 'overview') && !analytics) fetchAnalytics();
  }, [activeTab, analytics, fetchAnalytics]);

  const [chartRange, setChartRange] = useState('6m');
  const [chartCustomStart, setChartCustomStart] = useState('');
  const [chartCustomEnd, setChartCustomEnd] = useState('');
  const [chartMonthly, setChartMonthly] = useState(null);
  const [chartLoading, setChartLoading] = useState(false);

  const fetchChartRange = useCallback((range, customStart, customEnd) => {
    const now = new Date();
    const toISO = (d) => d.toISOString().slice(0, 10);
    let start_date = null;
    let end_date = null;
    if (range === 'custom') {
      if (!customStart || !customEnd) return;
      start_date = customStart;
      end_date = customEnd;
    } else {
      const days = { '1d': 1, '7d': 7, '30d': 30, '90d': 90, '6m': 183, '12m': 365 }[range] || 183;
      const startD = new Date(now);
      startD.setDate(startD.getDate() - days);
      start_date = toISO(startD);
      end_date = toISO(now);
    }
    setChartLoading(true);
    api.get(`/ecommerce/seller/analytics/?start_date=${start_date}&end_date=${end_date}`)
      .then(res => setChartMonthly(res.data.monthly))
      .catch(() => {})
      .finally(() => setChartLoading(false));
  }, []);

  useEffect(() => {
    if (analytics && chartMonthly === null) setChartMonthly(analytics.monthly);
  }, [analytics, chartMonthly]);

  useEffect(() => {
    if (activeTab !== 'analytics' && activeTab !== 'overview') return;
    if (chartRange === '6m') {
      if (analytics) setChartMonthly(analytics.monthly);
    } else {
      fetchChartRange(chartRange, chartCustomStart, chartCustomEnd);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartRange, chartCustomStart, chartCustomEnd, activeTab]);

  const handleDownloadAnalytics = useCallback(() => {
    const rows = chartMonthly || analytics?.monthly || [];
    const rangeLabels = { '1d': '1 Day', '7d': '7 Days', '30d': '30 Days', '6m': '6 Months', '12m': '12 Months', 'custom': 'Custom Range' };
    const rangeLabel = chartRange === 'custom'
      ? `${chartCustomStart || '?'} to ${chartCustomEnd || '?'}`
      : (rangeLabels[chartRange] || chartRange);

    const lines = [];
    lines.push('Seller Analytics Export');
    lines.push(`Store,${user?.seller_profile?.store_name || ''}`);
    lines.push(`Range,${rangeLabel}`);
    lines.push(`Generated At,${new Date().toLocaleString('en-IN')}`);
    lines.push('');

    if (analytics?.summary) {
      lines.push('Summary (all-time)');
      lines.push('Total Revenue,Units Sold,Total Orders,Total Products,Total Stock');
      lines.push([
        analytics.summary.total_revenue,
        analytics.summary.total_units_sold,
        analytics.summary.total_orders,
        analytics.summary.total_products,
        analytics.summary.total_stock,
      ].join(','));
      lines.push('');
    }

    lines.push('Revenue Breakdown (selected range)');
    lines.push('Period,Fulfilled Revenue,Units,Cancelled Revenue');
    rows.forEach(r => {
      lines.push([r.month, r.revenue, r.units, r.cancelled_revenue].join(','));
    });

    if (analytics?.products?.length) {
      lines.push('');
      lines.push('Sales by Product (all-time)');
      lines.push('Product,Units Sold,Revenue,Stock');
      analytics.products.forEach(p => {
        const name = `"${String(p.name || '').replace(/"/g, '""')}"`;
        lines.push([name, p.units_sold, p.revenue, p.stock].join(','));
      });
    }

    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collabo-analytics-${chartRange}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [chartMonthly, analytics, chartRange, chartCustomStart, chartCustomEnd, user]);

  const renderRevenueChart = (gradientId) => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Revenue</h3>
        <div className="flex items-center gap-4 text-[11px] font-medium text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500" /> Fulfilled</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-400" /> Cancelled</span>
          <button
            onClick={handleDownloadAnalytics}
            disabled={!analytics}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download analytics for this range"
          >
            <Download className="w-3.5 h-3.5" /> Download
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {[
          { id: '1d', label: '1D' },
          { id: '7d', label: '7D' },
          { id: '30d', label: '30D' },
          { id: '6m', label: '6M' },
          { id: '12m', label: '12M' },
          { id: 'custom', label: 'Custom' },
        ].map(r => (
          <button
            key={r.id}
            onClick={() => setChartRange(r.id)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
              chartRange === r.id
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {r.label}
          </button>
        ))}
        {chartRange === 'custom' && (
          <div className="flex items-center gap-2 ml-1">
            <div className="relative">
              <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={chartCustomStart}
                max={chartCustomEnd || undefined}
                onChange={(e) => setChartCustomStart(e.target.value)}
                className="pl-6 pr-2 py-1.5 rounded-lg text-[11px] font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
            <span className="text-[11px] text-gray-400">to</span>
            <div className="relative">
              <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={chartCustomEnd}
                min={chartCustomStart || undefined}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setChartCustomEnd(e.target.value)}
                className="pl-6 pr-2 py-1.5 rounded-lg text-[11px] font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>
        )}
      </div>

      <div className="bg-[#FFFDF9] dark:bg-gray-900/40 rounded-xl p-3 relative">
        {chartLoading && (
          <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 flex items-center justify-center rounded-xl z-10">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin" />
          </div>
        )}
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={chartMonthly || analytics.monthly}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ea580c" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9ca3af" axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" axisLine={false} tickLine={false} />
            <Tooltip content={<RevenueChartTooltip />} cursor={{ stroke: '#ea580c', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Bar dataKey="units" barSize={10} fill="#e5e7eb" radius={[2, 2, 0, 0]} />
            <Area type="monotone" dataKey="revenue" stroke="#ea580c" strokeWidth={2} fill={`url(#${gradientId})`} dot={false} activeDot={{ r: 4, fill: '#ea580c', strokeWidth: 2, stroke: '#fff' }} />
            <Line type="monotone" dataKey="cancelled_revenue" stroke="#9ca3af" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#9ca3af', strokeWidth: 2, stroke: '#fff' }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const fetchEarnings = useCallback(() => {
    setEarningsLoading(true);
    api.get('/ecommerce/seller/earnings/')
      .then(res => setEarnings(res.data))
      .catch(() => setEarnings(null))
      .finally(() => setEarningsLoading(false));
  }, []);

  useEffect(() => {
    if ((activeTab === 'payouts' || activeTab === 'overview' || activeTab === 'products') && !earnings) fetchEarnings();
  }, [activeTab, earnings, fetchEarnings]);

  const fetchPayouts = useCallback(() => {
    setPayoutsLoading(true);
    api.get('/ecommerce/seller/payouts/')
      .then(res => setPayouts(res.data.results || res.data || []))
      .catch(() => setPayouts([]))
      .finally(() => setPayoutsLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab === 'payouts' && !payouts) fetchPayouts();
  }, [activeTab, payouts, fetchPayouts]);

  const handleWithdraw = async () => {
    const amount = Number(withdrawAmount);
    if (!amount || amount < 100) { toast.error('Minimum withdrawal is ₹100'); return; }
    if (earnings && amount > Number(earnings.available_balance)) { toast.error('Amount exceeds your available balance'); return; }
    setWithdrawing(true);
    try {
      await api.post('/ecommerce/seller/withdraw/', { amount });
      toast.success('Payout requested');
      setWithdrawAmount('');
      fetchEarnings();
      fetchPayouts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not request payout');
    } finally {
      setWithdrawing(false);
    }
  };

  const fetchReviews = useCallback(() => {
    if (!user?.id) return;
    setReviewsLoading(true);
    api.get(`/ecommerce/sellers/${user.id}/reviews/`)
      .then(res => setReviews(Array.isArray(res.data) ? res.data : []))
      .catch(() => setReviews([]))
      .finally(() => setReviewsLoading(false));
  }, [user?.id]);

  useEffect(() => {
    if (activeTab === 'reviews' && !reviews) fetchReviews();
  }, [activeTab, reviews, fetchReviews]);

  const fetchOrders = useCallback((statusFilter) => {
    setOrdersLoading(true);
    const params = statusFilter && statusFilter !== 'all' ? { status: statusFilter } : {};
    api.get('/ecommerce/seller/orders/', { params })
      .then(res => setOrders(res.data))
      .catch(() => setOrders({ counts: {}, results: [] }))
      .finally(() => setOrdersLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders(orderStatusFilter);
  }, [activeTab, orderStatusFilter, fetchOrders]);

  // Products tab also shows order/customer counts in its stat row — fetch once, lazily.
  useEffect(() => {
    if (activeTab === 'products' && !orders) fetchOrders(null);
  }, [activeTab, orders, fetchOrders]);

  const openStockPopover = (product) => {
    setStockProductId(product.id);
    setStockQty('1');
    setStockExact(String(product.stock));
  };

  const closeStockPopover = () => setStockProductId(null);

  const applyStockUpdate = (product, delta) => {
    if (!delta) {
      // Nothing actually changed (e.g. "Set Exact Stock" left at the current value) — say so
      // instead of the button silently doing nothing, which looked like it was broken.
      toast('Stock is already at that value', { icon: 'ℹ️' });
      closeStockPopover();
      return;
    }
    if (product.stock + delta < 0) { toast.error(`Only ${product.stock} in stock`); return; }
    setStockSubmitting(true);
    api.post(`/ecommerce/products/${product.id}/adjust-stock/`, { delta })
      .then(res => {
        setProducts(prev => prev.map(p => p.id === product.id ? res.data : p));
        setStockExact(String(res.data.stock));
        toast.success(delta > 0 ? `Added ${delta} to stock` : `Removed ${-delta} from stock`);
        if (analytics) fetchAnalytics();
      })
      .catch(err => toast.error(err.response?.data?.error || 'Failed to update stock'))
      .finally(() => setStockSubmitting(false));
  };

  const handleStockIn = (product) => applyStockUpdate(product, Number(stockQty) || 0);
  const handleStockOut = (product) => applyStockUpdate(product, -(Number(stockQty) || 0));
  const handleSetExactStock = (product) => {
    const target = Number(stockExact);
    if (!Number.isFinite(target) || target < 0) { toast.error('Enter a valid stock quantity'); return; }
    applyStockUpdate(product, target - product.stock);
  };

  const counts = {
    all: products.length,
    pending: products.filter(p => p.status === 'pending').length,
    approved: products.filter(p => p.status === 'approved').length,
    rejected: products.filter(p => p.status === 'rejected').length,
  };

  const productTabStats = {
    totalOrders: orders?.results ? new Set(orders.results.map(r => r.order_id)).size : 0,
    customers: orders?.results ? new Set(orders.results.map(r => r.buyer_username).filter(Boolean)).size : 0,
  };

  const resetForm = () => {
    setForm(emptyForm); setUploadedImages([]); setQaRows([emptyQaRow()]); setFormError(''); setEditingProduct(null);
    setVariantOption1({ name: '', values: '' }); setVariantOption2({ name: '', values: '' }); setVariantRowOverrides({});
    setIsOtherCategory(false);
  };

  const openAddForm = () => { resetForm(); setShowAddForm(true); };

  // Cartesian product of the two option value lists, e.g. Size: S,M and Color: Gray,Navy
  // becomes 4 rows ({Size: S, Color: Gray}, {Size: S, Color: Navy}, ...). Each row carries
  // a stable key so per-row price/stock edits (variantRowOverrides) survive re-typing values.
  const variantRows = useMemo(() => {
    const vals1 = variantOption1.name.trim() && variantOption1.values.trim()
      ? variantOption1.values.split(',').map(v => v.trim()).filter(Boolean) : [];
    const vals2 = variantOption2.name.trim() && variantOption2.values.trim()
      ? variantOption2.values.split(',').map(v => v.trim()).filter(Boolean) : [];
    if (vals1.length === 0) return [];
    const combos = vals2.length > 0
      ? vals1.flatMap(v1 => vals2.map(v2 => ({ [variantOption1.name.trim()]: v1, [variantOption2.name.trim()]: v2 })))
      : vals1.map(v1 => ({ [variantOption1.name.trim()]: v1 }));
    return combos.map(attributes => {
      const key = Object.entries(attributes).map(([k, v]) => `${k}:${v}`).join('|');
      const override = variantRowOverrides[key] || {};
      return {
        key,
        attributes,
        price: override.price ?? form.price ?? '',
        stock: override.stock ?? form.stock ?? '',
      };
    });
  }, [variantOption1, variantOption2, variantRowOverrides, form.price, form.stock]);

  const updateVariantRow = (key, field, value) => {
    setVariantRowOverrides(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

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
    setIsOtherCategory(!!product.category && !categories.some(c => c.name === product.category));
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

  const handleToggleActive = async (product) => {
    setTogglingActiveId(product.id);
    try {
      await api.post(`/ecommerce/products/${product.id}/toggle-active/`);
      toast.success(product.is_active === false ? 'Listing activated' : 'Listing deactivated');
      fetchProducts();
    } catch (err) {
      toast.error('Failed to update listing visibility');
    } finally {
      setTogglingActiveId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedProductIds.length} selected product(s)? This can't be undone.`)) return;
    for (const id of selectedProductIds) {
      try { await api.delete(`/ecommerce/products/${id}/`); } catch (err) { console.error('Delete failed', id, err); }
    }
    setSelectedProductIds([]);
    toast.success('Selected products deleted');
    fetchProducts();
  };

  const exportProductsCsv = (rows) => {
    const header = ['ID', 'Name', 'Category', 'Price', 'Sell Price', 'Stock', 'Status'];
    const lines = rows.map(p => [
      p.id, `"${(p.name || '').replace(/"/g, '""')}"`, p.category, p.price, p.discount_price || p.price, p.stock, productStatusMeta(p).label,
    ].join(','));
    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'my-products.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleLogoFile = async (file) => {
    if (!file) return;
    if (file.size > MAX_IMAGE_SIZE) { toast.error('Image must be under 5MB'); return; }
    setUploadingLogo(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      await api.patch('/auth/seller-profile/', { store_logo: dataUrl });
      updateUser({ seller_profile: { ...user.seller_profile, store_logo: dataUrl } });
      toast.success('Logo updated');
    } catch (err) {
      console.error(err);
      toast.error('Could not update logo');
    } finally {
      setUploadingLogo(false);
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
        const res = await api.post('/ecommerce/products/', payload);
        const newProductId = res.data.id;
        if (variantRows.length > 0) {
          let variantErrors = 0;
          for (const row of variantRows) {
            try {
              await api.post('/ecommerce/product-variants/', {
                product: newProductId,
                attributes: row.attributes,
                price: Number(row.price) || Number(form.price),
                stock: Number(row.stock) || 0,
              });
            } catch (err) {
              variantErrors += 1;
            }
          }
          if (variantErrors > 0) toast.error(`${variantErrors} of ${variantRows.length} variants failed to save`);
        }
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
        <div className="flex items-center gap-2.5">
          <label
            title="Upload store logo"
            className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-sm cursor-pointer overflow-hidden group shrink-0"
          >
            {user?.seller_profile?.store_logo ? (
              <img src={user.seller_profile.store_logo} alt="Store logo" className="w-full h-full object-cover" />
            ) : (
              <ShoppingBag className="w-4 h-4 stroke-[2.25]" />
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {uploadingLogo ? (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-3 h-3 text-white" />
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploadingLogo}
              onChange={(e) => { handleLogoFile(e.target.files[0]); e.target.value = ''; }}
            />
          </label>
          <div>
            <h1 className="text-base font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
              {user?.seller_profile?.store_name || 'Seller Dashboard'}
            </h1>
          </div>
        </div>
        {activeTab === 'products' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportProductsCsv(products)}
              className="flex items-center justify-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
            <button
              onClick={() => setShowBulk(true)}
              className="flex items-center justify-center gap-1 bg-white dark:bg-gray-800 border border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-gray-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <Upload className="w-3.5 h-3.5" /> Bulk Upload
            </button>
            <button
              onClick={openAddForm}
              className="flex items-center justify-center gap-1 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Add Product
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Sidebar */}
        <aside className="w-full lg:w-36 shrink-0 lg:sticky lg:top-4">
          <nav className="flex lg:flex-col gap-0.5 overflow-x-auto lg:overflow-visible">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'orders', label: 'Orders', icon: ClipboardList },
              { id: 'products', label: 'Products', icon: LayoutGrid },
              { id: 'inventory', label: 'Inventory', icon: Boxes },
              { id: 'pricing', label: 'Pricing & Discounts', icon: Tag },
              { id: 'payouts', label: 'Payouts', icon: Wallet },
              { id: 'reviews', label: 'Reviews', icon: Star },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp },
              { id: 'store', label: 'My Store', icon: Store },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                  activeTab === item.id
                    ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <item.icon className="w-3.5 h-3.5 shrink-0" /> {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-5">

      {activeTab === 'overview' && (
        <div className="space-y-5">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-3.5 text-xs text-blue-700 dark:text-blue-300">
            New products are reviewed by our team before they go live. Once approved, they'll appear in the store and buyers can purchase them right away.
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Listings', value: counts.all, icon: Package, card: 'bg-violet-100 dark:bg-violet-900/30', iconColor: 'text-violet-700 dark:text-violet-300' },
              { label: 'Pending Review', value: counts.pending, icon: Clock, card: 'bg-sky-100 dark:bg-sky-900/30', iconColor: 'text-sky-700 dark:text-sky-300' },
              { label: 'Live', value: counts.approved, icon: CheckCircle2, card: 'bg-orange-100 dark:bg-orange-900/30', iconColor: 'text-orange-700 dark:text-orange-300' },
              { label: 'Rejected', value: counts.rejected, icon: XCircle, card: 'bg-slate-200 dark:bg-slate-700/60', iconColor: 'text-slate-700 dark:text-slate-200' },
            ].map(s => (
              <div key={s.label} className={`rounded-2xl p-5 shadow-sm transition-all hover:shadow-md ${s.card}`}>
                <div className="flex items-start justify-between mb-4">
                  <span className="text-[11px] font-bold text-gray-700/70 dark:text-gray-200/70 uppercase tracking-wide">{s.label}</span>
                  <s.icon className={`w-4 h-4 shrink-0 ${s.iconColor}`} />
                </div>
                <p className="text-2xl font-extrabold text-gray-900 dark:text-white leading-none">{s.value}</p>
              </div>
            ))}
          </div>

          {earningsLoading ? (
            <div className="flex justify-center py-6">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            </div>
          ) : earnings && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Available Balance', value: `₹${Number(earnings.available_balance).toLocaleString('en-IN')}`, icon: Wallet, card: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-700 dark:text-emerald-300' },
                { label: 'Net Earnings', value: `₹${Number(earnings.net_earnings).toLocaleString('en-IN')}`, icon: IndianRupee, card: 'bg-violet-100 dark:bg-violet-900/30', iconColor: 'text-violet-700 dark:text-violet-300' },
                { label: 'Platform Commission', value: `${earnings.commission_rate}%`, icon: Tag, card: 'bg-sky-100 dark:bg-sky-900/30', iconColor: 'text-sky-700 dark:text-sky-300' },
                { label: 'Gross Revenue', value: `₹${Number(earnings.total_revenue).toLocaleString('en-IN')}`, icon: TrendingUp, card: 'bg-orange-100 dark:bg-orange-900/30', iconColor: 'text-orange-700 dark:text-orange-300' },
              ].map(s => (
                <div key={s.label} className={`rounded-2xl p-5 shadow-sm transition-all hover:shadow-md ${s.card}`}>
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-[11px] font-bold text-gray-700/70 dark:text-gray-200/70 uppercase tracking-wide">{s.label}</span>
                    <s.icon className={`w-4 h-4 shrink-0 ${s.iconColor}`} />
                  </div>
                  <p className="text-xl font-extrabold text-gray-900 dark:text-white leading-none">{s.value}</p>
                </div>
              ))}
            </div>
          )}

          {analytics?.monthly && renderRevenueChart('sellerRevenueFill')}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Orders</h3>
          </div>
          <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 dark:border-gray-700 overflow-x-auto">
            {[
              { id: 'all', label: 'All', icon: ClipboardList },
              { id: 'pending', label: 'Pending', icon: Clock },
              { id: 'processing', label: 'Processing', icon: Clock },
              { id: 'shipped', label: 'Shipped', icon: Truck },
              { id: 'delivered', label: 'Completed', icon: CheckCircle2 },
              { id: 'cancelled', label: 'Cancelled', icon: Ban },
              { id: 'return_requested', label: 'Return Requests', icon: RotateCcw },
            ].map(f => {
              const n = f.id === 'all'
                ? Object.values(orders?.counts || {}).reduce((a, b) => a + b, 0)
                : (orders?.counts?.[f.id] || 0);
              return (
                <button
                  key={f.id}
                  onClick={() => setOrderStatusFilter(f.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
                    orderStatusFilter === f.id
                      ? 'bg-gray-900 dark:bg-gray-700 text-white'
                      : 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <f.icon className="w-3.5 h-3.5" /> {f.label} <span className="opacity-70">({n})</span>
                </button>
              );
            })}
          </div>
          {ordersLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            </div>
          ) : !orders?.results?.length ? (
            <div className="text-center py-14">
              <ClipboardList className="w-14 h-14 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No orders here yet</p>
            </div>
          ) : (
            <div>
              <div className="hidden sm:flex items-center gap-3 px-5 py-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider bg-gray-50/60 dark:bg-gray-900/30">
                <span className="w-10 shrink-0" />
                <span className="flex-1 min-w-0">Product</span>
                <span className="shrink-0 w-28">Order ID</span>
                <span className="shrink-0 w-20 text-right">Qty</span>
                <span className="shrink-0 w-24 text-right">Amount</span>
                <span className="shrink-0 w-28 text-right">Status</span>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {orders.results.map(it => (
                  <div key={it.order_item_id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60 dark:hover:bg-gray-900/30 transition-colors">
                    <img src={it.product_image} alt={it.product_name} className="w-10 h-10 rounded-lg object-cover bg-gray-100 dark:bg-gray-700 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{it.product_name}</p>
                      {it.variant_sku && (
                        <p className="text-[10px] text-gray-400 truncate">
                          {Object.entries(it.variant_attributes || {}).map(([k, v]) => `${k}: ${v}`).join(' | ')} · SKU {it.variant_sku}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 shrink-0 w-28 truncate">{it.order_id}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 shrink-0 w-20 text-right">{it.quantity}</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white shrink-0 w-24 text-right">₹{(it.price * it.quantity).toLocaleString('en-IN')}</p>
                    <span className="shrink-0 w-28 text-right text-[10px] font-medium capitalize px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300">{it.order_status.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Inventory</h3>
          </div>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-14">
              <Boxes className="w-14 h-14 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">You haven't listed any products yet</p>
            </div>
          ) : (
            <div>
              <div className="hidden sm:flex items-center gap-3 px-5 py-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider bg-gray-50/60 dark:bg-gray-900/30">
                <span className="w-12 shrink-0" />
                <span className="flex-1 min-w-0">Product</span>
                <span className="shrink-0 w-24 text-right">Stock</span>
                <span className="shrink-0 w-28 text-right">Action</span>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {[...products].sort((a, b) => Number(a.stock) - Number(b.stock)).map(p => (
                  <div key={p.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60 dark:hover:bg-gray-900/30 transition-colors">
                    <img src={p.image} alt={p.name} className="w-12 h-12 rounded-lg object-cover bg-gray-100 dark:bg-gray-700 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.category}</p>
                    </div>
                    <p className={`text-sm font-semibold shrink-0 w-24 text-right ${Number(p.stock) <= 0 ? 'text-red-500' : Number(p.stock) < 10 ? 'text-amber-600' : 'text-gray-900 dark:text-white'}`}>
                      {p.stock}
                    </p>
                    <div className="shrink-0 w-28 text-right">
                      <button
                        onClick={() => openStockPopover(p)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:underline"
                      >
                        <Boxes className="w-3.5 h-3.5" /> Update
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'pricing' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Pricing & Discounts</h3>
          </div>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-14">
              <Tag className="w-14 h-14 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">You haven't listed any products yet</p>
            </div>
          ) : (
            <div>
              <div className="hidden sm:flex items-center gap-3 px-5 py-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider bg-gray-50/60 dark:bg-gray-900/30">
                <span className="w-12 shrink-0" />
                <span className="flex-1 min-w-0">Product</span>
                <span className="shrink-0 w-20 text-right">Price</span>
                <span className="shrink-0 w-20 text-right">Sale Price</span>
                <span className="shrink-0 w-16 text-right">Off</span>
                <span className="shrink-0 w-20 text-right">Edit</span>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {products.map(p => {
                  const price = Number(p.price) || 0;
                  const salePrice = Number(p.discount_price ?? p.price) || 0;
                  const off = price > 0 && salePrice < price ? Math.round(((price - salePrice) / price) * 100) : 0;
                  return (
                    <div key={p.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60 dark:hover:bg-gray-900/30 transition-colors">
                      <img src={p.image} alt={p.name} className="w-12 h-12 rounded-lg object-cover bg-gray-100 dark:bg-gray-700 shrink-0" />
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1 min-w-0">{p.name}</p>
                      <p className="text-xs text-gray-400 shrink-0 w-20 text-right line-through">{price !== salePrice ? `₹${price}` : ''}</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white shrink-0 w-20 text-right">₹{salePrice}</p>
                      <p className="text-xs text-emerald-600 font-semibold shrink-0 w-16 text-right">{off > 0 ? `${off}%` : '—'}</p>
                      <div className="shrink-0 w-20 text-right">
                        <button onClick={() => openEditForm(p)} className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:underline">
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'payouts' && (
        <div className="space-y-5">
          {earningsLoading ? (
            <div className="flex justify-center py-6">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            </div>
          ) : earnings && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Available Balance', value: `₹${Number(earnings.available_balance).toLocaleString('en-IN')}`, icon: Wallet, card: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-700 dark:text-emerald-300' },
                { label: 'Pending Payouts', value: `₹${Number(earnings.pending_payouts).toLocaleString('en-IN')}`, icon: Clock, card: 'bg-sky-100 dark:bg-sky-900/30', iconColor: 'text-sky-700 dark:text-sky-300' },
                { label: 'Completed Payouts', value: `₹${Number(earnings.completed_payouts).toLocaleString('en-IN')}`, icon: CheckCircle2, card: 'bg-orange-100 dark:bg-orange-900/30', iconColor: 'text-orange-700 dark:text-orange-300' },
                { label: 'Platform Commission', value: `${earnings.commission_rate}%`, icon: Tag, card: 'bg-slate-200 dark:bg-slate-700/60', iconColor: 'text-slate-700 dark:text-slate-200' },
              ].map(s => (
                <div key={s.label} className={`rounded-2xl p-5 shadow-sm transition-all hover:shadow-md ${s.card}`}>
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-[11px] font-bold text-gray-700/70 dark:text-gray-200/70 uppercase tracking-wide">{s.label}</span>
                    <s.icon className={`w-4 h-4 shrink-0 ${s.iconColor}`} />
                  </div>
                  <p className="text-xl font-extrabold text-gray-900 dark:text-white leading-none">{s.value}</p>
                </div>
              ))}
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Request a payout</h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="number" min="100" value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Amount (min ₹100)"
                className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-400"
              />
              <button
                disabled={withdrawing}
                onClick={handleWithdraw}
                className="px-5 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg disabled:opacity-50 transition-colors shrink-0"
              >
                {withdrawing ? 'Requesting...' : 'Request Payout'}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Payout History</h3>
            </div>
            {payoutsLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              </div>
            ) : !payouts?.length ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-10">No payout requests yet</p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {payouts.map(p => (
                  <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">₹{Number(p.amount).toLocaleString('en-IN')}</p>
                      <p className="text-xs text-gray-400">{new Date(p.requested_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <span className={`text-[10px] font-medium capitalize px-2 py-1 rounded-full shrink-0 ${
                      p.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' :
                      p.status === 'rejected' ? 'bg-red-50 dark:bg-red-900/20 text-red-500' :
                      'bg-amber-50 dark:bg-amber-900/20 text-amber-600'
                    }`}>{p.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Customer Reviews</h3>
          </div>
          {reviewsLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            </div>
          ) : !reviews?.length ? (
            <div className="text-center py-14">
              <Star className="w-14 h-14 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No reviews yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {reviews.map(r => (
                <div key={r.id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{r.buyer_username}</p>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200 dark:text-gray-600'}`} />
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{r.comment}</p>}
                  <p className="text-[10px] text-gray-400 mt-1">{new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'store' && <StoreBuilder />}

      {activeTab === 'analytics' && (
        <div className="space-y-4">
          {analyticsLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            </div>
          ) : !analytics ? (
            <div className="text-center py-14 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">Couldn't load analytics right now</p>
              <button onClick={fetchAnalytics} className="mt-3 text-xs font-semibold text-orange-600 hover:underline">Retry</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Total Revenue', value: `₹${analytics.summary.total_revenue.toLocaleString('en-IN')}`, icon: IndianRupee, card: 'bg-violet-100 dark:bg-violet-900/30', iconColor: 'text-violet-700 dark:text-violet-300' },
                  { label: 'Units Sold', value: analytics.summary.total_units_sold, icon: ShoppingCart, card: 'bg-sky-100 dark:bg-sky-900/30', iconColor: 'text-sky-700 dark:text-sky-300' },
                  { label: 'Orders', value: analytics.summary.total_orders, icon: Package, card: 'bg-orange-100 dark:bg-orange-900/30', iconColor: 'text-orange-700 dark:text-orange-300' },
                  { label: 'Total Stock', value: analytics.summary.total_stock, icon: Boxes, card: 'bg-slate-200 dark:bg-slate-700/60', iconColor: 'text-slate-700 dark:text-slate-200' },
                ].map(s => (
                  <div key={s.label} className={`rounded-2xl p-5 shadow-sm transition-all hover:shadow-md ${s.card}`}>
                    <div className="flex items-start justify-between mb-4">
                      <span className="text-[11px] font-bold text-gray-700/70 dark:text-gray-200/70 uppercase tracking-wide">{s.label}</span>
                      <s.icon className={`w-4 h-4 shrink-0 ${s.iconColor}`} />
                    </div>
                    <p className="text-2xl font-extrabold text-gray-900 dark:text-white leading-none">{s.value}</p>
                  </div>
                ))}
              </div>

              {renderRevenueChart('sellerRevenueFillAnalytics')}

              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Sales by Product</h3>
                </div>
                {analytics.products.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-10">No sales yet</p>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                      <div className="relative flex-1 min-w-[160px]">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input
                          type="text"
                          value={salesSearch}
                          onChange={(e) => setSalesSearch(e.target.value)}
                          placeholder="Search products..."
                          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-400"
                        />
                      </div>
                      <select
                        value={salesSortBy}
                        onChange={(e) => setSalesSortBy(e.target.value)}
                        className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-400"
                      >
                        <option value="revenue">Sort: Revenue (high to low)</option>
                        <option value="units_sold">Sort: Units sold (high to low)</option>
                        <option value="stock">Sort: Stock (low to high)</option>
                        <option value="name">Sort: Name (A-Z)</option>
                      </select>
                    </div>
                    {filteredSalesProducts.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-10">No products match your search</p>
                    ) : (
                      <div>
                        <div className="hidden sm:flex items-center gap-3 px-5 py-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider bg-gray-50/60 dark:bg-gray-900/30">
                          <span className="w-10 shrink-0" />
                          <span className="flex-1 min-w-0">Product</span>
                          <span className="shrink-0 w-20 text-right">Units Sold</span>
                          <span className="shrink-0 w-20 text-right">Stock</span>
                          <span className="shrink-0 w-24 text-right">Revenue</span>
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                          {filteredSalesProducts.map(p => (
                            <div key={p.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60 dark:hover:bg-gray-900/30 transition-colors">
                              <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-gray-100 dark:bg-gray-700 shrink-0" />
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1 min-w-0">{p.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 shrink-0 w-20 text-right">{p.units_sold} sold</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 shrink-0 w-20 text-right">{p.stock}</p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white shrink-0 w-24 text-right">₹{p.revenue.toLocaleString('en-IN')}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Products list */}
      {activeTab === 'products' && (
      <div className="space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Products', value: counts.all, icon: Package, card: 'bg-violet-100 dark:bg-violet-900/30', iconColor: 'text-violet-700 dark:text-violet-300' },
            { label: 'Total Revenue', value: earnings ? `₹${Number(earnings.total_revenue).toLocaleString('en-IN')}` : '—', icon: TrendingUp, card: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-700 dark:text-emerald-300' },
            { label: 'Total Orders', value: productTabStats.totalOrders, icon: ShoppingCart, card: 'bg-sky-100 dark:bg-sky-900/30', iconColor: 'text-sky-700 dark:text-sky-300' },
            { label: 'Customers', value: productTabStats.customers, icon: ShoppingBag, card: 'bg-orange-100 dark:bg-orange-900/30', iconColor: 'text-orange-700 dark:text-orange-300' },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl p-5 shadow-sm transition-all hover:shadow-md ${s.card}`}>
              <div className="flex items-start justify-between mb-4">
                <span className="text-[11px] font-bold text-gray-700/70 dark:text-gray-200/70 uppercase tracking-wide">{s.label}</span>
                <s.icon className={`w-4 h-4 shrink-0 ${s.iconColor}`} />
              </div>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white leading-none">{s.value}</p>
            </div>
          ))}
        </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">My Products</h3>
        </div>

        {!loading && products.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-2 px-5 py-3 border-b border-gray-100 dark:border-gray-700">
            <div className="relative flex-1 min-w-[160px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-400"
              />
            </div>
            <select
              value={productCategoryFilter}
              onChange={(e) => setProductCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-400"
            >
              <option value="all">All Categories</option>
              {productCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={productStatusFilter}
              onChange={(e) => setProductStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-400"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Review</option>
              <option value="approved">Live</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="inactive">Inactive</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        )}

        {!loading && products.length > 0 && (
          <div className="flex items-center gap-1.5 px-5 pb-3 overflow-x-auto scrollbar-hide">
            {[
              { key: 'all', label: 'All' },
              { key: 'approved', label: 'Active' },
              { key: 'pending', label: 'Drafts' },
              { key: 'inactive', label: 'Archived' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setProductStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors ${productStatusFilter === tab.key ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700/40'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

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
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-14">
            <Package className="w-14 h-14 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No products match your filters</p>
          </div>
        ) : (
          <div>
            <div className="hidden sm:flex items-center gap-3 px-5 py-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider bg-gray-50/60 dark:bg-gray-900/30">
              <span className="w-4 shrink-0">
                <input
                  type="checkbox"
                  checked={filteredProducts.length > 0 && filteredProducts.every(p => selectedProductIds.includes(p.id))}
                  onChange={(e) => {
                    const ids = filteredProducts.map(p => p.id);
                    setSelectedProductIds(prev => e.target.checked ? Array.from(new Set([...prev, ...ids])) : prev.filter(id => !ids.includes(id)));
                  }}
                  className="w-3.5 h-3.5 accent-orange-500"
                />
              </span>
              <span className="w-12 shrink-0" />
              <span className="flex-1 min-w-0">Product</span>
              <span className="shrink-0 w-28">ID &amp; Create Date</span>
              <span className="shrink-0 w-20 text-right">Price</span>
              <span className="shrink-0 w-16 text-right">Stock</span>
              <span className="shrink-0 w-24 text-center">Status</span>
              <span className="shrink-0 w-[112px] text-right">Actions</span>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filteredProducts.map(p => {
              const outOfStock = p.status === 'approved' && Number(p.stock) <= 0;
              const meta = productStatusMeta(p);
              return (
                <div key={p.id} onClick={() => openEditForm(p)} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60 dark:hover:bg-gray-900/30 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedProductIds.includes(p.id)}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setSelectedProductIds(prev => e.target.checked ? [...prev, p.id] : prev.filter(id => id !== p.id))}
                    className="w-3.5 h-3.5 shrink-0 accent-orange-500"
                  />
                  <img src={p.image} alt={p.name} className="w-12 h-12 rounded-lg object-cover bg-gray-100 dark:bg-gray-700 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.category}</p>
                    {p.status === 'rejected' && p.rejection_reason && (
                      <p className="text-[11px] text-red-500 mt-0.5">Reason: {p.rejection_reason}</p>
                    )}
                  </div>
                  <div className="shrink-0 w-28 text-xs text-gray-500 dark:text-gray-400">
                    <div className="font-semibold text-gray-700 dark:text-gray-300">#{p.id}</div>
                    <div className="text-[10px]">{p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</div>
                  </div>
                  <div className="shrink-0 w-20 text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">₹{p.discount_price || p.price}</p>
                    {p.discount_price && Number(p.discount_price) !== Number(p.price) && (
                      <p className="text-[10px] text-gray-400">MRP ₹{p.price}</p>
                    )}
                  </div>
                  <p className={`shrink-0 w-16 text-right text-sm font-semibold ${outOfStock ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>{p.stock}</p>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-medium capitalize px-2 py-1 rounded-full shrink-0 ${meta.bg} ${meta.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} /> {meta.label}
                  </span>
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {p.status === 'approved' && (
                      <button
                        onClick={() => handleToggleActive(p)}
                        disabled={togglingActiveId === p.id}
                        title={p.is_active === false ? 'Activate (show to buyers)' : 'Deactivate (hide from buyers, keep history)'}
                        className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${p.is_active === false ? 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/40'}`}
                      >
                        {p.is_active === false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    )}
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
          </div>
        )}
      </div>

      {selectedProductIds.length > 0 && (
        <div className="sticky bottom-2 flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2.5 rounded-xl shadow-lg w-fit mx-auto">
          <span className="text-xs font-bold">{selectedProductIds.length} Selected</span>
          <button onClick={() => exportProductsCsv(products.filter(p => selectedProductIds.includes(p.id)))} className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg hover:bg-white/10 dark:hover:bg-gray-900/10">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button onClick={handleBulkDelete} className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg hover:bg-white/10 dark:hover:bg-gray-900/10">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
          <button onClick={() => setSelectedProductIds([])} className="p-1 rounded-lg hover:bg-white/10 dark:hover:bg-gray-900/10">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      </div>
      )}

        </div>
      </div>

      {/* Bulk upload modal */}
      {showBulk && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeBulk}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2"><Upload className="w-4 h-4 text-orange-500" /> Bulk upload products</h2>
              <button onClick={closeBulk} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div className="rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 p-4 space-y-3">
                <p className="font-semibold text-gray-700 dark:text-gray-200 leading-relaxed">
                  1. Download the template, 2. fill in one row per product with the same details as the Add Product form (name, category, price, sale price, stock, photo links, description, delivery, highlights, specifications and more), 3. upload it here. You will see a preview before anything is saved.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => downloadTemplate('xlsx')} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-2 rounded-lg transition-colors">
                    <FileSpreadsheet className="w-3.5 h-3.5" /> Excel template (.xlsx)
                  </button>
                  <button onClick={() => downloadTemplate('csv')} className="flex items-center gap-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                    <Download className="w-3.5 h-3.5" /> CSV template
                  </button>
                </div>
              </div>

              <label className="block cursor-pointer text-center bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-600 hover:border-orange-400 rounded-xl py-5 px-3 font-semibold text-gray-500 dark:text-gray-300 transition-colors">
                {bulkFile ? `${bulkFile.name} (${(bulkFile.size / 1024).toFixed(0)} KB)` : 'Choose your Excel (.xlsx) or CSV file'}
                <input type="file" accept=".xlsx,.csv,text/csv" className="hidden" onChange={(e) => { setBulkFile(e.target.files[0] || null); setBulkPreview(null); e.target.value = ''; }} />
              </label>

              <div className="flex items-center gap-3">
                <label className="font-semibold text-gray-500 dark:text-gray-400 flex-1">
                  Stock to use when the file says 0 or blank
                </label>
                <input
                  type="number" min="0" value={bulkStock}
                  onChange={(e) => { setBulkStock(e.target.value); setBulkPreview(null); }}
                  className="w-24 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl py-2 px-3 font-semibold focus:outline-none dark:text-white"
                />
              </div>

              {bulkPreview && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { key: 'new', n: bulkPreview.new_count ?? bulkPreview.created_count ?? 0, label: bulkPreview.dry_run === false ? 'imported' : 'will be added', box: 'bg-emerald-50 dark:bg-emerald-900/20', num: 'text-emerald-600', lab: 'text-emerald-700 dark:text-emerald-300', ring: 'ring-emerald-400' },
                      { key: 'duplicate', n: bulkPreview.duplicate_count || 0, label: 'already exist', box: 'bg-amber-50 dark:bg-amber-900/20', num: 'text-amber-600', lab: 'text-amber-700 dark:text-amber-300', ring: 'ring-amber-400' },
                      { key: 'skipped', n: bulkPreview.skipped_count || 0, label: 'skipped (see why)', box: 'bg-gray-100 dark:bg-gray-900', num: 'text-gray-600 dark:text-gray-200', lab: 'text-gray-500', ring: 'ring-gray-400' },
                    ].map(t => (
                      <button
                        key={t.key} type="button" disabled={t.n === 0}
                        onClick={() => setBulkFilter(bulkFilter === t.key ? 'all' : t.key)}
                        className={`rounded-xl py-2 transition-all ${t.box} ${t.n === 0 ? 'opacity-60 cursor-default' : 'hover:shadow-md cursor-pointer'} ${bulkFilter === t.key ? `ring-2 ${t.ring}` : ''}`}
                      >
                        <div className={`text-lg font-bold ${t.num}`}>{t.n}</div>
                        <div className={`text-[10px] font-semibold ${t.lab}`}>{t.label}</div>
                      </button>
                    ))}
                  </div>
                  <div className="max-h-56 overflow-y-auto rounded-xl border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                    {(bulkPreview.items || []).filter(it => bulkFilter === 'all' || (bulkFilter === 'new' ? (it.status === 'new' || it.status === 'created') : it.status === bulkFilter)).map((it, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${it.status === 'new' || it.status === 'created' ? 'bg-emerald-500' : it.status === 'duplicate' ? 'bg-amber-500' : 'bg-gray-400'}`} />
                        <div className="w-11 h-11 rounded-lg bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 overflow-hidden flex items-center justify-center flex-shrink-0">
                          {it.image ? (
                            <img src={it.image} alt="" loading="lazy" referrerPolicy="no-referrer" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-gray-700 dark:text-gray-200 truncate">{it.name || it.handle}</div>
                          <div className="text-[10px] text-gray-400 font-medium whitespace-normal">
                            {it.status === 'new' || it.status === 'created'
                              ? `${it.category} · ₹${it.price} · stock ${it.stock} · ${it.images} photo${it.images === 1 ? '' : 's'}${it.variants > 1 ? ` · ${it.variants} options in file (first one imported)` : ''}`
                              : it.status === 'duplicate' && it.existing_id
                                ? `Already in your products as "${it.existing_name}" (ID ${it.existing_id}) · left unchanged`
                                : it.reason}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {bulkPreview.new_count > 0 && bulkPreview.dry_run && (
                    <p className="text-[11px] font-medium text-amber-600">New products are reviewed by our team before they go live.</p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button onClick={closeBulk} className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-semibold text-gray-600 dark:text-gray-300">Cancel</button>
                {bulkPreview && bulkPreview.dry_run && bulkPreview.new_count > 0 ? (
                  <button disabled={bulkBusy} onClick={() => sendBulk(false)} className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold disabled:opacity-50">
                    {bulkBusy ? 'Importing...' : `Import ${bulkPreview.new_count} product${bulkPreview.new_count === 1 ? '' : 's'}`}
                  </button>
                ) : (
                  <button disabled={bulkBusy || !bulkFile} onClick={() => sendBulk(true)} className="px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white font-semibold disabled:opacity-50">
                    {bulkBusy ? 'Checking...' : 'Preview'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Product — rendered as a full page, not a popup modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-gray-50 dark:bg-gray-900 z-50 overflow-y-auto">
          <div className="max-w-6xl w-full mx-auto min-h-screen">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
                <button type="submit" form="seller-product-form" disabled={submitting}
                  className="px-4 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg disabled:opacity-50 transition-colors">
                  {submitting ? 'Saving...' : editingProduct ? 'Save Changes' : 'Publish Product'}
                </button>
              </div>
            </div>

            <form id="seller-product-form" onSubmit={handleSubmit} className="p-6 space-y-5">
              {formError && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 text-xs font-medium px-3 py-2 rounded-lg">{formError}</div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
                {/* Column 1: Product Details */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Product Details</h3>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Product Name</label>
                    <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                      className="w-full mt-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-400" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Description</label>
                    <textarea rows={5} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                      className="w-full mt-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-400" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Product Type (Category)</label>
                    <select
                      value={isOtherCategory ? '__other__' : form.category}
                      onChange={e => {
                        if (e.target.value === '__other__') { setIsOtherCategory(true); setForm({ ...form, category: '' }); }
                        else { setIsOtherCategory(false); setForm({ ...form, category: e.target.value }); }
                      }}
                      className="w-full mt-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-400">
                      <option value="">Select...</option>
                      {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      <option value="__other__">Others (type your own)</option>
                    </select>
                    {isOtherCategory && (
                      <input type="text" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                        placeholder="Type a new category name"
                        autoFocus
                        className="w-full mt-2 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-400" />
                    )}
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Vendor / Brand (optional)</label>
                    <input type="text" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })}
                      className="w-full mt-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-400" />
                  </div>
                </div>

                {/* Column 2: Media */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5"><ImagePlus className="w-3.5 h-3.5" /> Media</h3>
                  <div className="aspect-square w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                    {form.image ? (
                      <img src={form.image} alt="Main preview" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-xs text-gray-400">No image yet</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="w-14 h-14 rounded-lg overflow-hidden border-2 border-orange-400 shrink-0">
                      {form.image && <img src={form.image} alt="Main" className="w-full h-full object-cover" />}
                    </div>
                    {uploadedImages.map((img, i) => (
                      <div key={i} className="relative group shrink-0">
                        <img src={img} alt={`Upload ${i + 1}`} className="w-14 h-14 rounded-lg object-cover border border-gray-200 dark:border-gray-700" />
                        <button type="button" onClick={() => setUploadedImages(prev => prev.filter((_, idx) => idx !== i))}
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                    <label className="w-14 h-14 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer hover:border-orange-400 transition-colors shrink-0">
                      <Upload className="w-4 h-4 text-gray-400" />
                      <input type="file" accept="image/*" multiple className="hidden"
                        onChange={e => { handleExtraImageFiles(e.target.files); e.target.value = ''; }} />
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <input type="text" value={form.image} onChange={e => setForm({ ...form, image: e.target.value })}
                      placeholder="Main image URL..."
                      className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-400" />
                    <label className="cursor-pointer bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs px-4 rounded-lg flex items-center justify-center transition-colors shrink-0">
                      <Upload className="w-3.5 h-3.5 mr-1.5" /> Browse
                      <input type="file" accept="image/*" className="hidden"
                        onChange={e => { handleMainImageFile(e.target.files[0]); e.target.value = ''; }} />
                    </label>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Additional Image URLs (optional)</label>
                    <input type="text" value={form.images} onChange={e => setForm({ ...form, images: e.target.value })}
                      placeholder="Paste URLs, comma-separated"
                      className="w-full mt-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-400" />
                  </div>
                </div>

                {/* Column 3: Pricing & Inventory + Variants */}
                <div className="space-y-5">
                  <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Pricing &amp; Inventory</h3>
                    <div className="grid grid-cols-2 gap-3">
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
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Stock</label>
                        <input type="number" min="0" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })}
                          className="w-full mt-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-400" />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Shipping Charge (₹)</label>
                        <input type="number" min="0" value={form.shipping_charge} onChange={e => setForm({ ...form, shipping_charge: e.target.value })}
                          placeholder="0 = free"
                          className="w-full mt-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-400" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-0.5"><Truck className="w-3 h-3" /> Delivery Estimate</label>
                      <input type="text" value={form.delivery} onChange={e => setForm({ ...form, delivery: e.target.value })}
                        placeholder="Free delivery by Tomorrow"
                        className="w-full mt-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-400" />
                    </div>
                  </div>

                  <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> Variants</h3>
                    {editingProduct ? (
                      <VariantManagerModal
                        embedded
                        product={editingProduct}
                        onChanged={fetchProducts}
                      />
                    ) : (
                      <>
                        <p className="text-[11px] text-gray-400">Optional. Add up to 2 options (e.g. Size, Color) with comma-separated values — each combination becomes a real, independently priced/stocked variant once you publish.</p>
                        <div className="grid grid-cols-2 gap-2">
                          <input type="text" value={variantOption1.name} onChange={e => setVariantOption1({ ...variantOption1, name: e.target.value })}
                            placeholder="Option name (e.g. Size)"
                            className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-400" />
                          <input type="text" value={variantOption1.values} onChange={e => setVariantOption1({ ...variantOption1, values: e.target.value })}
                            placeholder="Values (e.g. S, M, L)"
                            className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-400" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input type="text" value={variantOption2.name} onChange={e => setVariantOption2({ ...variantOption2, name: e.target.value })}
                            placeholder="Option name (e.g. Color)"
                            className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-400" />
                          <input type="text" value={variantOption2.values} onChange={e => setVariantOption2({ ...variantOption2, values: e.target.value })}
                            placeholder="Values (e.g. Gray, Navy)"
                            className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-400" />
                        </div>
                        {variantRows.length > 0 && (
                          <div className="border border-gray-100 dark:border-gray-700 rounded-lg overflow-hidden">
                            <div className="grid grid-cols-[1fr_72px_72px] gap-2 px-2 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wide bg-gray-50 dark:bg-gray-900/40">
                              <span>Variant</span><span>Price</span><span>Stock</span>
                            </div>
                            <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-48 overflow-y-auto">
                              {variantRows.map(row => (
                                <div key={row.key} className="grid grid-cols-[1fr_72px_72px] gap-2 px-2 py-1.5 items-center">
                                  <span className="text-xs text-gray-600 dark:text-gray-300 truncate">{Object.values(row.attributes).join(' / ')}</span>
                                  <input type="number" min="0" step="0.01" value={row.price}
                                    onChange={e => updateVariantRow(row.key, 'price', e.target.value)}
                                    className="w-full border border-gray-200 dark:border-gray-700 rounded px-1.5 py-1 text-xs bg-white dark:bg-gray-900" />
                                  <input type="number" min="0" value={row.stock}
                                    onChange={e => updateVariantRow(row.key, 'stock', e.target.value)}
                                    className="w-full border border-gray-200 dark:border-gray-700 rounded px-1.5 py-1 text-xs bg-white dark:bg-gray-900" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
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
            </form>

            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 dark:border-gray-700 text-[11px] text-gray-400 font-medium">
              <span>
                {editingProduct
                  ? `Product ID: P${String(editingProduct.id).padStart(5, '0')} · Last Edited: ${new Date(editingProduct.updated_at || editingProduct.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                  : 'Not yet published'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Update Stock Modal */}
      {stockProductId && (() => {
        const product = products.find(p => p.id === stockProductId);
        if (!product) return null;
        return (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeStockPopover}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 max-w-sm w-full" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Update Stock</h2>
                <button onClick={closeStockPopover} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <img src={product.image} alt={product.name} className="w-10 h-10 rounded-lg object-cover bg-gray-100 dark:bg-gray-700 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{product.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Current stock: {product.stock}</p>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Quantity</label>
                  <input type="number" min="1" value={stockQty} onChange={e => setStockQty(e.target.value)}
                    className="w-full mt-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-400" />
                  <div className="flex gap-2 mt-2">
                    <button type="button" disabled={stockSubmitting} onClick={() => handleStockIn(product)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors disabled:opacity-50">
                      <ArrowUpCircle className="w-3.5 h-3.5" /> Stock In
                    </button>
                    <button type="button" disabled={stockSubmitting} onClick={() => handleStockOut(product)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50">
                      <ArrowDownCircle className="w-3.5 h-3.5" /> Stock Out
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Or set exact stock</label>
                  <div className="flex gap-2 mt-1">
                    <input type="number" min="0" value={stockExact} onChange={e => setStockExact(e.target.value)}
                      className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-400" />
                    <button type="button" disabled={stockSubmitting} onClick={() => handleSetExactStock(product)}
                      className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg disabled:opacity-50 transition-colors">
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {variantManagerProduct && (
        <VariantManagerModal
          product={variantManagerProduct}
          onClose={() => setVariantManagerProduct(null)}
          onChanged={() => fetchProducts()}
        />
      )}
    </div>
  );
};

export default SellerDashboard;
