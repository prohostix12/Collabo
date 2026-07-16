import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, UserCheck, UserX, Clock, TrendingUp, 
  // eslint-disable-next-line no-unused-vars
  CheckCircle, XCircle, Search, Filter, Mail,
  // eslint-disable-next-line no-unused-vars
  Calendar, Eye, AlertCircle, Shield, Settings, 
  BarChart3, Activity, DollarSign, Layout, ShoppingBag, Store, Package
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import AdminSupportTickets from '../Support/AdminSupportTickets';
import LandingContentManager from './LandingContentManager';
import UserManagement from './UserManagement';
// eslint-disable-next-line no-unused-vars
import CampaignManagement from './CampaignManagement';
import PaymentManagement from './PaymentManagement';
import PlatformSettings from './PlatformSettings';
import EcommerceMarketplace from '../Ecommerce/EcommerceMarketplace';
import StoreContentEditor from './StoreContentEditor';

const AdminDashboard = () => {
  const { user } = useAuth();
  // Restore the last portal the admin had open so a page reload stays put
  // instead of dropping back to the portal-chooser screen.
  const [portalMode, setPortalMode] = useState(() => {
    try { return localStorage.getItem('admin_portal_mode') || 'select'; } catch { return 'select'; }
  }); // select | collabo | collabocart
  useEffect(() => {
    try { localStorage.setItem('admin_portal_mode', portalMode); } catch { /* ignore */ }
  }, [portalMode]);
  const [activeTab, setActiveTab] = useState('overview');
  const [influencers, setInfluencers] = useState([]);
  // New state for influencer creation modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newInfluencer, setNewInfluencer] = useState({ username: '', email: '', password: '' });
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [sellers, setSellers] = useState([]);
  const [loadingSellers, setLoadingSellers] = useState(false);
  const [selectedSellerDetails, setSelectedSellerDetails] = useState(null);
  const [analytics, setAnalytics] = useState({
    total_influencers: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInfluencer, setSelectedInfluencer] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [approvalTab, setApprovalTab] = useState('pending');
  const [sellerTab, setSellerTab] = useState('all');
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productTab, setProductTab] = useState('pending');
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);
  const [rejectingProduct, setRejectingProduct] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'approvals', label: 'Influencer Approvals', icon: UserCheck },
    { id: 'seller-approvals', label: 'Seller Approvals', icon: Store },
    { id: 'product-approvals', label: 'Product Approvals', icon: Package },
    { id: 'seller-payouts', label: 'Seller Payouts', icon: DollarSign },
    { id: 'landing', label: 'Landing Page', icon: Layout },
    { id: 'store', label: 'Store Content', icon: ShoppingBag },
    { id: 'support', label: 'Support Tickets', icon: AlertCircle },
    { id: 'payments', label: 'Payment Management', icon: DollarSign },
    { id: 'settings', label: 'Platform Settings', icon: Settings },
  ];

  const stats = [
    { name: 'Total Users', value: '2,847', icon: Users, change: '+12%', description: '1,234 Influencers, 567 Companies' },
    { name: 'Active Campaigns', value: '156', icon: TrendingUp, change: '+8%', description: '89 Running, 67 Pending' },
    { name: 'Platform Revenue', value: '₹45,678', icon: DollarSign, change: '+25%', description: 'This month' },
    { name: 'Success Rate', value: '94.2%', icon: Activity, change: '+2%', description: 'Campaign completion' },
  ];

  const recentActivities = [
    { type: 'user', action: 'New influencer registered', user: 'Sarah Johnson', time: '2 minutes ago', status: 'success' },
    { type: 'campaign', action: 'Campaign approved', user: 'TechCorp Inc.', time: '15 minutes ago', status: 'success' },
    { type: 'payment', action: 'Payment processed', user: 'Mike Chen', time: '1 hour ago', status: 'success' },
    { type: 'alert', action: 'Suspicious activity detected', user: 'System Alert', time: '2 hours ago', status: 'warning' },
    { type: 'user', action: 'Company profile updated', user: 'Fashion Brand Co.', time: '3 hours ago', status: 'info' },
  ];

  const systemHealth = [
    { name: 'API Response Time', value: '245ms', status: 'good', target: '< 500ms' },
    { name: 'Database Performance', value: '98.5%', status: 'excellent', target: '> 95%' },
    { name: 'Payment Gateway', value: '99.9%', status: 'excellent', target: '> 99%' },
    { name: 'Email Delivery', value: '97.2%', status: 'good', target: '> 95%' },
  ];

  useEffect(() => {
    if (activeTab === 'approvals') {
      fetchAnalytics();
      fetchInfluencers(approvalTab);
    } else if (activeTab === 'seller-approvals') {
      fetchSellers(sellerTab);
    } else if (activeTab === 'product-approvals') {
      fetchProducts(productTab);
    }
  }, [activeTab, approvalTab, sellerTab, productTab]);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/auth/admin/approval-stats/');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const fetchInfluencers = async (status) => {
    setLoading(true);
    try {
      const response = await api.get(`/auth/admin/all-influencers/?status=${status}`);
      // Handle both paginated (results array) and non-paginated responses
      const data = response.data.results || response.data;
      setInfluencers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch influencers:', error);
      toast.error('Failed to load influencers');
      setInfluencers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      await api.post(`/auth/admin/approve-influencer/${userId}/`);
      toast.success('Influencer approved successfully!');
      fetchAnalytics();
      fetchInfluencers(approvalTab);
      setShowConfirmModal(false);
    } catch (error) {
      console.error('Failed to approve influencer:', error);
      toast.error('Failed to approve influencer');
    }
  };

  const handleReject = async (userId) => {
    try {
      await api.post(`/auth/admin/reject-influencer/${userId}/`);
      toast.success('Influencer rejected');
      fetchAnalytics();
      fetchInfluencers(approvalTab);
      setShowConfirmModal(false);
    } catch (error) {
      console.error('Failed to reject influencer:', error);
      toast.error('Failed to reject influencer');
    }
  };

  const fetchSellers = async (status = 'all') => {
    setLoadingSellers(true);
    try {
      const query = status && status !== 'all' ? `?status=${status}` : '';
      const response = await api.get(`/auth/admin/all-sellers/${query}`);
      const data = response.data.results || response.data;
      setSellers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch sellers:', error);
      toast.error('Failed to load sellers');
      setSellers([]);
    } finally {
      setLoadingSellers(false);
    }
  };

  const handleApproveSeller = async (userId) => {
    try {
      await api.post(`/auth/admin/approve-seller/${userId}/`);
      toast.success('Seller approved successfully!');
      fetchSellers(sellerTab);
      setShowConfirmModal(false);
    } catch (error) {
      console.error('Failed to approve seller:', error);
      toast.error('Failed to approve seller');
    }
  };

  const handleRejectSeller = async (userId) => {
    try {
      await api.post(`/auth/admin/reject-seller/${userId}/`, { rejection_reason: 'Rejected by admin' });
      toast.success('Seller rejected');
      fetchSellers(sellerTab);
      setShowConfirmModal(false);
    } catch (error) {
      console.error('Failed to reject seller:', error);
      toast.error('Failed to reject seller');
    }
  };

  const fetchProducts = async (statusFilter = 'pending') => {
    setLoadingProducts(true);
    try {
      const query = statusFilter && statusFilter !== 'all' ? `&status=${statusFilter}` : '';
      const response = await api.get(`/ecommerce/products/?page_size=200${query}`);
      const data = response.data.results || response.data;
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast.error('Failed to load products');
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleApproveProduct = async (productId) => {
    try {
      await api.post(`/ecommerce/products/${productId}/approve/`);
      toast.success('Product approved — now live in the store');
      setSelectedProductDetails(null);
      fetchProducts(productTab);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to approve product');
    }
  };

  const submitRejectProduct = async () => {
    if (!rejectingProduct) return;
    try {
      await api.post(`/ecommerce/products/${rejectingProduct.id}/reject/`, { reason: rejectReason });
      toast.success('Product rejected');
      setRejectingProduct(null);
      setRejectReason('');
      setSelectedProductDetails(null);
      fetchProducts(productTab);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reject product');
    }
  };

  const openConfirmModal = (influencer, action) => {
    setSelectedInfluencer(influencer);
    setConfirmAction(action);
    setShowConfirmModal(true);
  };

  const approvalRate = analytics.total_influencers > 0 
    ? ((analytics.approved / analytics.total_influencers) * 100).toFixed(1)
    : 0;

  const filteredInfluencers = influencers.filter(inf =>
    inf.user_type === 'influencer' &&
    (inf.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inf.email?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (portalMode === 'select') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-xl w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Admin Console</h1>
            <p className="text-xs text-gray-400 mt-1">Select a workspace to continue</p>
          </div>

          {/* Portal Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <button onClick={() => setPortalMode('collabo')}
              className="group text-left p-5 rounded-xl border border-gray-200 hover:border-gray-900 bg-white hover:bg-gray-50 transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center">
                  <Users className="w-4.5 h-4.5 text-white" />
                </div>
                <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">Live</span>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Collabo Portal</h3>
              <p className="text-[11px] text-gray-400 leading-relaxed mb-4">
                Creator networks, approvals, payouts, support tickets & platform config.
              </p>
              <div className="flex items-center text-[11px] font-medium text-gray-900 group-hover:gap-2 gap-1 transition-all">
                Open dashboard <span className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
              </div>
            </button>

            <button onClick={() => setPortalMode('collabocart')}
              className="group text-left p-5 rounded-xl border border-gray-200 hover:border-gray-900 bg-white hover:bg-gray-50 transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center">
                  <ShoppingBag className="w-4.5 h-4.5 text-white" />
                </div>
                <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">Store</span>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Collabo Store</h3>
              <p className="text-[11px] text-gray-400 leading-relaxed mb-4">
                Inventory, orders, sales metrics, categories & store configuration.
              </p>
              <div className="flex items-center text-[11px] font-medium text-gray-900 group-hover:gap-2 gap-1 transition-all">
                Open store <span className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
              </div>
            </button>
          </div>

          {/* Footer info */}
          <div className="flex items-center justify-center gap-3 text-[10px] text-gray-400">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> System online</span>
            <span>·</span>
            <span>{user?.username || 'admin'}</span>
            <span>·</span>
            <span>Collabo Inc.</span>
          </div>
        </div>
      </div>
    );
  }

  if (portalMode === 'collabocart') {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100">
        <EcommerceMarketplace inlineMode={true} onBackToSelect={() => setPortalMode('select')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-5 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-sm font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">Platform management</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPortalMode('select')}
              className="text-[11px] font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Switch Portal
            </button>
            <div className="bg-gray-900 dark:bg-gray-700 text-white px-3 py-1.5 rounded-lg text-[11px] font-medium flex items-center gap-1.5">
              <Shield className="w-3 h-3" /> Admin
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="flex items-center gap-0.5 px-3 py-1.5 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gray-900 dark:bg-gray-600 text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}>
                <IconComponent className="w-3 h-3" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="p-4">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {stats.map((stat) => {
                const StatIcon = stat.icon;
                return (
                  <div key={stat.name} className="bg-white dark:bg-gray-800 rounded-xl p-3.5 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <StatIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-[10px] font-medium text-emerald-600">{stat.change}</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{stat.value}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{stat.name}</p>
                  </div>
                );
              })}
            </div>

            {/* Recent Activity + System Health */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-3">Recent Activity</h3>
                <div className="space-y-1.5">
                  {recentActivities.map((a, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${a.status === 'warning' ? 'bg-amber-400' : a.status === 'info' ? 'bg-blue-400' : 'bg-emerald-400'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-gray-900 dark:text-white truncate">{a.action}</p>
                        <p className="text-[10px] text-gray-400">{a.user} · {a.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-3">System Health</h3>
                <div className="space-y-2.5">
                  {systemHealth.map((m, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-600 dark:text-gray-400">{m.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-gray-900 dark:text-white">{m.value}</span>
                        <span className={`w-1.5 h-1.5 rounded-full ${m.status === 'excellent' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <UserManagement />
        )}

        {activeTab === 'approvals' && (
          <div className="space-y-3">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                { label: 'Total', value: analytics.total_influencers, icon: Users },
                { label: 'Pending', value: analytics.pending, icon: Clock },
                { label: 'Approved', value: analytics.approved, icon: UserCheck },
                { label: 'Rejected', value: analytics.rejected, icon: UserX },
                { label: 'Approval Rate', value: `${approvalRate}%`, icon: TrendingUp },
              ].map((s) => (
                <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl p-3.5 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <s.icon className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{s.value}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-1">
                  {['pending', 'approved', 'rejected'].map((tab) => (
                    <button key={tab} onClick={() => setApprovalTab(tab)}
                      className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                        approvalTab === tab ? 'bg-gray-900 dark:bg-gray-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
                  ))}
                  <button onClick={() => setShowCreateModal(true)}
                    className="ml-2 px-2.5 py-1.5 text-[10px] font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors">
                    + Create
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3" />
                  <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-[11px] bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-400 w-48" />
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                </div>
              ) : filteredInfluencers.length === 0 ? (
                <div className="text-center py-10 text-[11px] text-gray-400">No {approvalTab} influencers found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-700">
                        {['Profile', 'Email', 'Followers', 'Category', 'Joined', 'Status', 'Actions'].map(h => (
                          <th key={h} className="px-4 py-2.5 text-[10px] font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {filteredInfluencers.map((influencer, index) => (
                          <InfluencerRow key={influencer.id} influencer={influencer} index={index}
                            onApprove={() => openConfirmModal(influencer, 'approve')}
                            onReject={() => openConfirmModal(influencer, 'reject')}
                            activeTab={approvalTab} />
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'seller-approvals' && (
          <div className="space-y-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-1">
                  {['all', 'pending', 'approved', 'rejected'].map((tab) => (
                    <button key={tab} onClick={() => setSellerTab(tab)}
                      className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                        sellerTab === tab ? 'bg-gray-900 dark:bg-gray-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-500">{sellers.length} seller{sellers.length === 1 ? '' : 's'}</p>
              </div>

              {loadingSellers ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
                </div>
              ) : sellers.length === 0 ? (
                <div className="text-center py-12">
                  <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    No {sellerTab === 'all' ? '' : sellerTab + ' '}sellers found
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-700">
                        {['Store', 'User', 'Tax ID', 'Joined', 'Status', 'Actions'].map(h => (
                          <th key={h} className="px-4 py-2.5 text-[10px] font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {sellers.map((seller, index) => (
                          <SellerRow
                            key={seller.id}
                            seller={seller}
                            index={index}
                            onViewDetails={() => setSelectedSellerDetails(seller)}
                            onApprove={() => openConfirmModal(seller, 'approve-seller')}
                            onReject={() => openConfirmModal(seller, 'reject-seller')}
                          />
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'product-approvals' && (
          <div className="space-y-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-1">
                  {['all', 'pending', 'approved', 'rejected'].map((tab) => (
                    <button key={tab} onClick={() => setProductTab(tab)}
                      className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                        productTab === tab ? 'bg-gray-900 dark:bg-gray-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-500">{products.length} product{products.length === 1 ? '' : 's'}</p>
              </div>

              {loadingProducts ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    No {productTab === 'all' ? '' : productTab + ' '}products found
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-700">
                        {['Product', 'Seller', 'Category', 'Price', 'Status', 'Actions'].map(h => (
                          <th key={h} className="px-4 py-2.5 text-[10px] font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {products.map((product, index) => (
                          <ProductApprovalRow
                            key={product.id}
                            product={product}
                            index={index}
                            onViewDetails={() => setSelectedProductDetails(product)}
                            onApprove={() => handleApproveProduct(product.id)}
                            onReject={() => { setRejectingProduct(product); setRejectReason(''); }}
                          />
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'seller-payouts' && (
          <AdminSellerPayouts />
        )}


        {activeTab === 'payments' && (
          <PaymentManagement />
        )}

        {activeTab === 'support' && (
          <AdminSupportTickets />
        )}

        {activeTab === 'landing' && (
          <LandingContentManager />
        )}

        {activeTab === 'store' && (
          <>
            {user?.is_staff || user?.user_type === 'admin'
              ? <StoreContentEditor />
              : <div className="p-4 text-center text-gray-500">Access denied. Admins only.</div>}
          </>
        )}

        {activeTab === 'settings' && (
          <PlatformSettings />
        )}
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <ConfirmationModal
            influencer={selectedInfluencer}
            action={confirmAction}
            onConfirm={() => {
              if (confirmAction === 'approve') {
                handleApprove(selectedInfluencer.id);
              } else if (confirmAction === 'reject') {
                handleReject(selectedInfluencer.id);
              } else if (confirmAction === 'approve-seller') {
                handleApproveSeller(selectedInfluencer.user);
              } else if (confirmAction === 'reject-seller') {
                handleRejectSeller(selectedInfluencer.user);
              }
            }}
            onCancel={() => {
              setShowConfirmModal(false);
            }}
          />
        )}
      </AnimatePresence>
      {/* Seller Details Modal */}
      <AnimatePresence>
        {selectedSellerDetails && (
          <SellerDetailsModal
            seller={selectedSellerDetails}
            onClose={() => setSelectedSellerDetails(null)}
            onApprove={(seller) => {
              setSelectedSellerDetails(null);
              openConfirmModal(seller, 'approve-seller');
            }}
            onReject={(seller) => {
              setSelectedSellerDetails(null);
              openConfirmModal(seller, 'reject-seller');
            }}
          />
        )}
      </AnimatePresence>
      {/* Product Details Modal */}
      <AnimatePresence>
        {selectedProductDetails && (
          <ProductDetailsModal
            product={selectedProductDetails}
            onClose={() => setSelectedProductDetails(null)}
            onApprove={() => handleApproveProduct(selectedProductDetails.id)}
            onReject={() => { setRejectingProduct(selectedProductDetails); setRejectReason(''); }}
          />
        )}
      </AnimatePresence>
      {/* Reject Product Reason Modal */}
      <AnimatePresence>
        {rejectingProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
            onClick={() => setRejectingProduct(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 max-w-sm w-full p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Reject Product</h3>
              <p className="text-[11px] text-gray-500 mb-3">
                {rejectingProduct.name} — let the seller know why so they can fix and resubmit.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection (optional)"
                rows={3}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-[11px] bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400 mb-3"
              />
              <div className="flex gap-2">
                <button onClick={() => setRejectingProduct(null)}
                  className="flex-1 py-2 text-[11px] font-medium text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
                <button onClick={submitRejectProduct}
                  className="flex-1 py-2 text-[11px] font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
                  Reject Product
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Create Influencer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 max-w-sm w-full p-5" onClick={e => e.stopPropagation()}>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Create Influencer</h2>
            {createdCredentials ? (
              <div className="space-y-2">
                <p className="text-[11px] text-gray-500">Created. Share these credentials (shown once):</p>
                <div className="bg-gray-50 dark:bg-gray-700 p-2.5 rounded-lg text-[11px]"><span className="text-gray-500">Email:</span> <span className="font-mono font-medium text-gray-900 dark:text-white">{createdCredentials.email}</span></div>
                <div className="bg-gray-50 dark:bg-gray-700 p-2.5 rounded-lg text-[11px]"><span className="text-gray-500">Password:</span> <span className="font-mono font-medium text-gray-900 dark:text-white">{createdCredentials.password}</span></div>
                <button onClick={() => { setCreatedCredentials(null); setShowCreateModal(false); setNewInfluencer({ username: '', email: '', password: '' }); }}
                  className="w-full bg-gray-900 text-white py-2 rounded-lg text-[11px] font-medium mt-2">Done</button>
              </div>
            ) : (
              <form onSubmit={async (e) => { e.preventDefault(); setCreateLoading(true); try { const r = await api.post('/auth/admin/create-influencer/', newInfluencer); setCreatedCredentials({ email: r.data.email, password: r.data.password }); toast.success('Created'); } catch (err) { toast.error(err.response?.data?.error || 'Failed'); } finally { setCreateLoading(false); } }} className="space-y-2.5">
                <input type="text" placeholder="Username" value={newInfluencer.username} onChange={(e) => setNewInfluencer({ ...newInfluencer, username: e.target.value })}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white dark:bg-gray-800" required />
                <input type="email" placeholder="Email" value={newInfluencer.email} onChange={(e) => setNewInfluencer({ ...newInfluencer, email: e.target.value })}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white dark:bg-gray-800" required />
                <div className="flex gap-2">
                  <input type="text" placeholder="Password" value={newInfluencer.password} onChange={(e) => setNewInfluencer({ ...newInfluencer, password: e.target.value })}
                    className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white dark:bg-gray-800" required />
                  <button type="button" onClick={() => setNewInfluencer({ ...newInfluencer, password: Math.random().toString(36).slice(-10) })}
                    className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-[10px] font-medium text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 transition-colors">Auto</button>
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => { setShowCreateModal(false); setNewInfluencer({ username: '', email: '', password: '' }); }}
                    className="flex-1 py-2 text-[11px] font-medium text-gray-600 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
                  <button type="submit" disabled={createLoading}
                    className="flex-1 py-2 text-[11px] font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors">{createLoading ? 'Creating...' : 'Create'}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

const InfluencerRow = ({ influencer, index, onApprove, onReject, activeTab }) => (
  <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: index * 0.03 }}
    className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
    <td className="py-2.5 px-4">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-semibold text-gray-600 dark:text-gray-300">
          {influencer.username?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-[11px] font-medium text-gray-900 dark:text-white">{influencer.username}</p>
          <p className="text-[10px] text-gray-400">{influencer.influencer_profile?.category || 'No category'}</p>
        </div>
      </div>
    </td>
    <td className="py-2.5 px-4 text-[10px] text-gray-500">{influencer.email}</td>
    <td className="py-2.5 px-4 text-[11px] font-medium text-gray-700 dark:text-gray-300">{influencer.influencer_profile?.followers_count?.toLocaleString() || 0}</td>
    <td className="py-2.5 px-4 text-[10px] text-gray-500">{influencer.influencer_profile?.category || 'N/A'}</td>
    <td className="py-2.5 px-4 text-[10px] text-gray-500">{new Date(influencer.created_at).toLocaleDateString()}</td>
    <td className="py-2.5 px-4">
      <span className={`inline-flex items-center gap-1 text-[10px] font-medium capitalize ${
        influencer.approval_status === 'approved' ? 'text-emerald-600' : influencer.approval_status === 'rejected' ? 'text-red-500' : 'text-amber-600'
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${
          influencer.approval_status === 'approved' ? 'bg-emerald-400' : influencer.approval_status === 'rejected' ? 'bg-red-400' : 'bg-amber-400'
        }`} />
        {influencer.approval_status}
      </span>
    </td>
    <td className="py-2.5 px-4">
      <div className="flex gap-1">
        {activeTab === 'pending' && (
          <>
            <button onClick={onApprove} className="px-2 py-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 rounded-md hover:bg-emerald-100 transition-colors">Approve</button>
            <button onClick={onReject} className="px-2 py-1 text-[10px] font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors">Reject</button>
          </>
        )}
      </div>
    </td>
  </motion.tr>
);

// Confirmation Modal Component
const ConfirmationModal = ({ influencer, action, onConfirm, onCancel }) => {
  const isApprove = action?.startsWith('approve');
  const isSeller = action?.includes('seller');
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 max-w-sm w-full p-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
          {isApprove ? 'Approve' : 'Reject'} {isSeller ? 'Seller' : 'Influencer'}
        </h3>
        <p className="text-[11px] text-gray-500 mb-4">
          {isApprove
            ? `${influencer?.username || influencer?.store_name} will gain platform access.`
            : `${influencer?.username || influencer?.store_name} will receive a rejection notice.`}
        </p>
        <div className="flex gap-2">
          <button onClick={onCancel}
            className="flex-1 py-2 text-[11px] font-medium text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm}
            className={`flex-1 py-2 text-[11px] font-medium text-white rounded-lg transition-colors ${
              isApprove ? 'bg-gray-900 hover:bg-gray-800' : 'bg-red-600 hover:bg-red-700'
            }`}>
            {isApprove ? 'Approve' : 'Reject'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
const SellerRow = ({ seller, index, onApprove, onReject, onViewDetails }) => {
  const status = seller.verification_status || 'pending';
  return (
    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: index * 0.03 }}
      className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
      <td className="py-2.5 px-4">
        <button onClick={onViewDetails} className="flex items-center gap-2.5 hover:underline text-left">
          <div className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-semibold text-gray-600 dark:text-gray-300 shrink-0">
            {seller.store_name?.charAt(0).toUpperCase() || 'S'}
          </div>
          <p className="text-[11px] font-medium text-gray-900 dark:text-white">{seller.store_name || 'Unnamed'}</p>
        </button>
      </td>
      <td className="py-2.5 px-4">
        <p className="text-[11px] font-medium text-gray-700 dark:text-gray-300">{seller.username}</p>
        <p className="text-[10px] text-gray-400">{seller.user_email}</p>
      </td>
      <td className="py-2.5 px-4 text-[10px] text-gray-500 font-mono">{seller.tax_id || 'N/A'}</td>
      <td className="py-2.5 px-4 text-[10px] text-gray-500">{new Date(seller.created_at).toLocaleDateString()}</td>
      <td className="py-2.5 px-4">
        <span className={`inline-flex items-center gap-1 text-[10px] font-medium capitalize ${
          status === 'approved' ? 'text-emerald-600' : status === 'rejected' ? 'text-red-500' : 'text-amber-600'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            status === 'approved' ? 'bg-emerald-400' : status === 'rejected' ? 'bg-red-400' : 'bg-amber-400'
          }`} /> {status}
        </span>
      </td>
      <td className="py-2.5 px-4">
        <div className="flex gap-1">
          <button onClick={onViewDetails} className="px-2 py-1 text-[10px] font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">View</button>
          {status === 'pending' && (
            <>
              <button onClick={onApprove} className="px-2 py-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 rounded-md hover:bg-emerald-100 transition-colors">Approve</button>
              <button onClick={onReject} className="px-2 py-1 text-[10px] font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors">Reject</button>
            </>
          )}
        </div>
      </td>
    </motion.tr>
  );
};

const ProductApprovalRow = ({ product, index, onApprove, onReject, onViewDetails }) => {
  const status = product.status || 'pending';
  return (
    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: index * 0.03 }}
      className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
      <td className="py-2.5 px-4">
        <button onClick={onViewDetails} className="flex items-center gap-2.5 hover:underline text-left">
          <img src={product.image} alt={product.name} className="w-8 h-8 rounded-lg object-cover bg-gray-100 dark:bg-gray-700 shrink-0" />
          <p className="text-[11px] font-medium text-gray-900 dark:text-white line-clamp-1 max-w-[220px]">{product.name}</p>
        </button>
      </td>
      <td className="py-2.5 px-4 text-[11px] font-medium text-gray-700 dark:text-gray-300">{product.seller_username}</td>
      <td className="py-2.5 px-4 text-[10px] text-gray-500">{product.category}</td>
      <td className="py-2.5 px-4 text-[11px] font-medium text-gray-700 dark:text-gray-300">₹{product.discount_price || product.price}</td>
      <td className="py-2.5 px-4">
        <span className={`inline-flex items-center gap-1 text-[10px] font-medium capitalize ${
          status === 'approved' ? 'text-emerald-600' : status === 'rejected' ? 'text-red-500' : 'text-amber-600'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            status === 'approved' ? 'bg-emerald-400' : status === 'rejected' ? 'bg-red-400' : 'bg-amber-400'
          }`} /> {status}
        </span>
      </td>
      <td className="py-2.5 px-4">
        <div className="flex gap-1">
          <button onClick={onViewDetails} className="px-2 py-1 text-[10px] font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">View</button>
          {status === 'pending' && (
            <>
              <button onClick={onApprove} className="px-2 py-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 rounded-md hover:bg-emerald-100 transition-colors">Approve</button>
              <button onClick={onReject} className="px-2 py-1 text-[10px] font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors">Reject</button>
            </>
          )}
        </div>
      </td>
    </motion.tr>
  );
};

const ProductDetailsModal = ({ product, onClose, onApprove, onReject }) => {
  const status = product?.status || 'pending';
  if (!product) return null;

  const InfoRow = ({ label, value }) => (
    <div className="flex items-start justify-between py-3 border-b border-gray-100 dark:border-gray-700/60 last:border-0 gap-4">
      <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide shrink-0 pt-0.5 w-32">
        {label}
      </span>
      <span className="text-sm font-medium text-gray-800 dark:text-gray-100 text-right break-words">
        {value || <span className="text-gray-400 italic font-normal">N/A</span>}
      </span>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.94, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gray-50 dark:bg-gray-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden"
      >
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 rounded-t-3xl flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <img src={product.image} alt={product.name} className="w-11 h-11 rounded-xl object-cover bg-gray-100 dark:bg-gray-700 shrink-0" />
            <div className="min-w-0">
              <h2 className="text-base font-extrabold text-gray-900 dark:text-white leading-tight truncate">{product.name}</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1.5 capitalize">
                <span className={`w-1.5 h-1.5 rounded-full inline-block ${
                  status === 'approved' ? 'bg-emerald-400' : status === 'rejected' ? 'bg-red-400' : 'bg-orange-400'
                }`} />
                {status} &middot; by {product.seller_username}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors shrink-0">
            <XCircle className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {product.images?.length > 0 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((img, i) => (
                <img key={i} src={img} alt="" className="w-20 h-20 rounded-xl object-cover bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shrink-0" />
              ))}
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="px-5 py-1">
              <InfoRow label="Category" value={product.category} />
              <InfoRow label="Brand" value={product.brand} />
              <InfoRow label="Price" value={`₹${product.price}${product.discount_price && product.discount_price !== product.price ? ` (sale ₹${product.discount_price})` : ''}`} />
              <InfoRow label="Stock" value={product.stock} />
              <InfoRow label="Seller" value={product.seller_username} />
              {status === 'rejected' && product.rejection_reason && (
                <InfoRow label="Rejection Reason" value={product.rejection_reason} />
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="px-5 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
              <span className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Description</span>
            </div>
            <p className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{product.description}</p>
          </div>
        </div>

        {status === 'pending' && (
          <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 rounded-b-3xl flex items-center justify-between gap-3 shrink-0">
            <button onClick={onClose} className="px-5 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              Close
            </button>
            <div className="flex gap-3">
              <button onClick={onReject} className="px-5 py-2 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-700 text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors flex items-center gap-1.5">
                <XCircle className="w-4 h-4" /> Reject
              </button>
              <button onClick={onApprove} className="px-5 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors flex items-center gap-1.5 shadow-sm">
                <CheckCircle className="w-4 h-4" /> Approve Product
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

const AdminSellerPayouts = () => {
  const [payouts, setPayouts] = React.useState([]);
  const [statusFilter, setStatusFilter] = React.useState('pending');
  const [processing, setProcessing] = React.useState(null);
  const [bankRef, setBankRef] = React.useState('');

  const fetchPayouts = React.useCallback(() => {
    api.get(`/ecommerce/admin/seller-payouts/${statusFilter ? `?status=${statusFilter}` : ''}`)
      .then(res => setPayouts(res.data?.results || res.data || []))
      .catch(() => setPayouts([]));
  }, [statusFilter]);

  React.useEffect(() => { fetchPayouts(); }, [fetchPayouts]);

  const processAction = async (id, action) => {
    try {
      await api.post(`/ecommerce/admin/seller-payouts/${id}/process/`, {
        action, bank_reference: bankRef, admin_note: action === 'reject' ? 'Rejected by admin' : '',
      });
      toast.success(`Payout ${action === 'complete' ? 'completed' : 'rejected'}`);
      setProcessing(null); setBankRef('');
      fetchPayouts();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {['pending', 'processing', 'completed', 'rejected', ''].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${statusFilter === s ? 'bg-violet-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>
      {payouts.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">No payouts found.</p>
      ) : (
        <div className="space-y-3">
          {payouts.map(p => (
            <div key={p.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-gray-900 dark:text-white text-sm">₹{parseFloat(p.amount).toLocaleString()}</span>
                  <span className="text-xs text-gray-500 ml-2">by {p.seller_username}</span>
                  <span className="text-xs text-gray-400 ml-2">{new Date(p.requested_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    p.status === 'completed' ? 'bg-green-100 text-green-700' :
                    p.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    p.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{p.status}</span>
                  {p.status === 'pending' && processing !== p.id && (
                    <button onClick={() => setProcessing(p.id)} className="text-[10px] font-bold text-violet-600 hover:underline">Process</button>
                  )}
                </div>
              </div>
              {processing === p.id && (
                <div className="mt-3 flex gap-2 items-end border-t border-gray-100 dark:border-gray-700 pt-3">
                  <input type="text" value={bankRef} onChange={(e) => setBankRef(e.target.value)}
                    placeholder="Bank reference / UTR" className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg py-1.5 px-3 text-xs focus:outline-none dark:text-white" />
                  <button onClick={() => processAction(p.id, 'complete')} className="bg-green-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">Complete</button>
                  <button onClick={() => processAction(p.id, 'reject')} className="bg-red-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">Reject</button>
                  <button onClick={() => { setProcessing(null); setBankRef(''); }} className="text-[10px] text-gray-400 font-bold">Cancel</button>
                </div>
              )}
              {p.bank_reference && <p className="text-[10px] text-gray-400 mt-1">Ref: {p.bank_reference}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SellerDetailsModal = ({ seller, onClose, onApprove, onReject }) => {
  const [auditLogs, setAuditLogs] = React.useState([]);
  const status = seller?.verification_status || 'pending';
  const statusDot = status === 'approved' ? 'bg-emerald-400' : status === 'rejected' ? 'bg-red-400' : 'bg-orange-400';
  const statusLabel = status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Pending Approval';

  React.useEffect(() => {
    if (seller?.user) {
      api.get(`/auth/admin/seller-audit/${seller.user}/`)
        .then(res => setAuditLogs(res.data || []))
        .catch(() => setAuditLogs([]));
    }
  }, [seller?.user]);

  if (!seller) return null;

  const InfoRow = ({ label, value, mono = false }) => (
    <div className="flex items-start justify-between py-3 border-b border-gray-100 dark:border-gray-700/60 last:border-0 gap-4">
      <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide shrink-0 pt-0.5 w-36">
        {label}
      </span>
      <span className={`text-sm font-medium text-gray-800 dark:text-gray-100 text-right break-all ${mono ? 'font-mono' : ''}`}>
        {value || <span className="text-gray-400 italic font-normal">N/A</span>}
      </span>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gray-50 dark:bg-gray-900 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Sticky Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 rounded-t-3xl flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-lg font-black shadow-md select-none">
              {seller.store_name?.charAt(0).toUpperCase() || 'S'}
            </div>
            <div>
              <h2 className="text-base font-extrabold text-gray-900 dark:text-white leading-tight">
                {seller.store_name}
              </h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full inline-block ${statusDot}`} />
                {statusLabel} &middot; Seller Verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">

          {/* Business + Banking 2-col */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Business Information */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              <div className="flex items-center gap-2.5 px-5 py-3 bg-violet-50 dark:bg-violet-900/20 border-b border-gray-200 dark:border-gray-700">
                <Store className="w-4 h-4 text-violet-500" />
                <span className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Business Information</span>
              </div>
              <div className="px-5 py-1">
                <InfoRow label="Store Name" value={seller.store_name} />
                <InfoRow label="Registration No." value={seller.business_registration_number || seller.tax_id} mono />
                <InfoRow label="Address" value={seller.business_address || seller.company_address} />
                <InfoRow label="Associated User" value={seller.username ? `${seller.username} (${seller.user_email})` : seller.user_email} />
              </div>
            </div>

            {/* Banking Information */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              <div className="flex items-center gap-2.5 px-5 py-3 bg-emerald-50 dark:bg-emerald-900/20 border-b border-gray-200 dark:border-gray-700">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Banking Information</span>
              </div>
              <div className="px-5 py-1">
                <InfoRow label="Bank Name" value={seller.bank_name} />
                <InfoRow label="Account No." value={seller.bank_account_number} mono />
                <InfoRow label="IFSC / Routing" value={seller.bank_ifsc} mono />
              </div>
            </div>
          </div>

          {/* Verification Documents */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="flex items-center gap-2.5 px-5 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
              <Shield className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Verification Documents</span>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'KYC / Tax Document', src: seller.kyc_document_url || seller.kyc_document },
                  { label: 'Bank Details Document', src: seller.bank_document_url || seller.bank_document },
                ].map(({ label, src }) => {
                  const isPdf = src && (src.endsWith('.pdf') || src.startsWith('data:application/pdf'));
                  return (
                    <div key={label} className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className="bg-gray-50 dark:bg-gray-900/60 px-3.5 py-2.5 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">{label}</p>
                      </div>
                      {src ? (
                        isPdf ? (
                          <div className="w-full h-44 flex flex-col items-center justify-center gap-3 bg-gray-50 dark:bg-gray-800">
                            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
                              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                              </svg>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">PDF Document</p>
                            <a href={src} target="_blank" rel="noopener noreferrer"
                              className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-colors">
                              Open &amp; View
                            </a>
                          </div>
                        ) : (
                          <a href={src} target="_blank" rel="noopener noreferrer" title="Open full-size in a new tab"
                            className="group relative block w-full h-44 bg-gray-100 dark:bg-gray-800 overflow-hidden cursor-zoom-in">
                            <img src={src} alt={label} className="w-full h-full object-contain" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                              <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-violet-600 text-white text-xs font-bold px-4 py-1.5 rounded-lg">
                                Open &amp; View
                              </span>
                            </div>
                          </a>
                        )
                      ) : (
                        <div className="w-full h-44 bg-gray-50 dark:bg-gray-800 flex flex-col items-center justify-center gap-2">
                          <Shield className="w-7 h-7 text-gray-300 dark:text-gray-600" />
                          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">No document uploaded</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Audit Log */}
          {auditLogs.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              <div className="flex items-center gap-2.5 px-5 py-3 bg-gray-50 dark:bg-gray-700/40 border-b border-gray-200 dark:border-gray-700">
                <Activity className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Approval History</span>
              </div>
              <div className="px-5 py-3 space-y-0 max-h-40 overflow-y-auto">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-center gap-3 py-2.5 border-b border-gray-100 dark:border-gray-700/60 last:border-0 text-xs">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${log.action === 'approved' ? 'bg-green-500' : log.action === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                    <span className="font-bold text-gray-800 dark:text-gray-200 capitalize">{log.action}</span>
                    <span className="text-gray-400 dark:text-gray-500">by {log.admin_username || 'System'}</span>
                    {log.reason && <span className="text-gray-400 truncate">&#8212; {log.reason}</span>}
                    <span className="ml-auto text-gray-400 dark:text-gray-500 shrink-0 font-medium">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 rounded-b-3xl flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
          {status === 'pending' && (
            <div className="flex gap-3">
              <button
                onClick={() => onReject(seller)}
                className="px-5 py-2 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-700 text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
              <button
                onClick={() => onApprove(seller)}
                className="px-5 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle className="w-4 h-4" /> Approve Seller
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AdminDashboard;
