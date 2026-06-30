import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  TrendingUp, TrendingDown, DollarSign, Users, Target, Activity,
  Calendar, Download, Filter, BarChart3, Award, Eye,
  ChevronDown, FileText, FileSpreadsheet,
  X, CheckCircle, CreditCard, Briefcase, Zap, ArrowUpRight,
  ShoppingCart, Link2, Package
} from 'lucide-react';

const CompanyAnalytics = () => {
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState('30days');
  const [selectedCampaign, setSelectedCampaign] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCampaignDetails, setSelectedCampaignDetails] = useState(null);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [markingPayment, setMarkingPayment] = useState(false);
  const [animatedValues, setAnimatedValues] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalSpend: 0,
    totalRevenue: 0,
  });

  // Fetch campaigns
  const { data: campaignsData } = useQuery('company-campaigns', async () => {
    const res = await api.get('/collaborations/campaigns/');
    return res.data;
  }, { refetchInterval: 60000 });

  // Fetch admin ecommerce analytics — real aggregated data
  const { data: adminAnalytics, isLoading: analyticsLoading } = useQuery(
    'admin-ecommerce-analytics',
    async () => {
      const res = await api.get('/ecommerce/admin/analytics/');
      return res.data;
    },
    { refetchInterval: 60000, staleTime: 50000 }
  );

  const campaigns = campaignsData?.results || [];

  // Real campaign counts from actual data
  const completedCampaigns = campaigns.filter(c => c.status === 'completed').length;
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const pendingCampaigns = campaigns.filter(c => c.status === 'pending' || c.status === 'draft').length;
  const totalCampaigns = campaigns.length;
  const totalSpend = campaigns.reduce((sum, c) => sum + (parseFloat(c.budget) || 0), 0);

  // From backend analytics
  const totalRevenue = adminAnalytics?.orders?.total_revenue || 0;
  const totalOrders = adminAnalytics?.orders?.total || 0;
  const totalCommissions = adminAnalytics?.commissions?.total_paid || 0;
  const pendingCommissions = adminAnalytics?.commissions?.total_pending || 0;
  const topInfluencers = adminAnalytics?.commissions?.top_influencers || [];
  const monthlyData = adminAnalytics?.orders?.monthly || [];
  const totalProducts = adminAnalytics?.products?.total || 0;
  const totalAffiliate = adminAnalytics?.affiliates?.total_links || 0;
  const activeInfluencers = adminAnalytics?.affiliates?.active_influencers || 0;

  // Mark payment mutation
  const markPaymentCompletedMutation = useMutation(
    (campaignId) => api.post(`/collaborations/campaigns/${campaignId}/mark-payment-completed/`),
    {
      onSuccess: (res) => {
        toast.success('Payment marked as completed');
        setSelectedCampaignDetails(res.data.campaign);
        queryClient.invalidateQueries('company-campaigns');
        setMarkingPayment(false);
      },
      onError: (err) => {
        toast.error(err.response?.data?.error || 'Failed to mark payment as completed');
        setMarkingPayment(false);
      },
    }
  );

  const handleMarkPaymentCompleted = (campaignId) => {
    if (markingPayment) return;
    setMarkingPayment(true);
    markPaymentCompletedMutation.mutate(campaignId);
  };

  const handleExport = (format) => {
    if (format === 'csv') {
      const rows = [
        ['Campaign', 'Status', 'Budget', 'Type', 'Deadline'],
        ...campaigns.map(c => [c.title, c.status, c.budget, c.campaign_type, c.deadline]),
      ];
      const csv = rows.map(r => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'campaigns.csv'; a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV downloaded');
    } else {
      toast.success('PDF export — use browser Print → Save as PDF');
    }
  };

  // Animate on data load
  useEffect(() => {
    const duration = 1800;
    const steps = 60;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const p = step / steps;
      setAnimatedValues({
        totalCampaigns: Math.floor(totalCampaigns * p),
        activeCampaigns: Math.floor(activeCampaigns * p),
        totalSpend: Math.floor(totalSpend * p),
        totalRevenue: Math.floor(totalRevenue * p),
      });
      if (step >= steps) {
        clearInterval(timer);
        setAnimatedValues({ totalCampaigns, activeCampaigns, totalSpend, totalRevenue });
      }
    }, duration / steps);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalCampaigns, activeCampaigns, totalSpend, totalRevenue]);

  // Filter campaigns by date range
  const filteredCampaigns = campaigns.filter(c => {
    if (selectedCampaign !== 'all' && c.id !== parseInt(selectedCampaign)) return false;
    if (dateRange === '7days') return new Date(c.created_at) > new Date(Date.now() - 7 * 86400000);
    if (dateRange === '30days') return new Date(c.created_at) > new Date(Date.now() - 30 * 86400000);
    if (dateRange === '90days') return new Date(c.created_at) > new Date(Date.now() - 90 * 86400000);
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-cyan-50 to-lime-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-800 mb-2">Analytics Dashboard</h1>
            <p className="text-neutral-500">Real-time campaign, order, and affiliate performance</p>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 text-neutral-700 rounded-xl hover:bg-neutral-50 transition-colors shadow-sm">
              <Filter className="w-4 h-4" />
              <span className="font-medium">Filters</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </motion.button>
            <div className="relative group">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-cyan-500 text-white rounded-xl hover:from-violet-700 hover:to-cyan-600 transition-all shadow-lg">
                <Download className="w-4 h-4" />
                <span className="font-medium">Export</span>
              </motion.button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-neutral-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <button onClick={() => handleExport('csv')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors rounded-t-xl">
                  <FileSpreadsheet className="w-4 h-4 text-violet-600" />
                  <span className="text-neutral-800 font-medium">Export as CSV</span>
                </button>
                <button onClick={() => handleExport('pdf')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors rounded-b-xl">
                  <FileText className="w-4 h-4 text-violet-600" />
                  <span className="text-neutral-800 font-medium">Export as PDF</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">Date Range</label>
                  <select value={dateRange} onChange={e => setDateRange(e.target.value)}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-800 focus:outline-none focus:ring-2 focus:ring-violet-500">
                    <option value="7days">Last 7 days</option>
                    <option value="30days">Last 30 days</option>
                    <option value="90days">Last 90 days</option>
                    <option value="1year">All time</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">Campaign</label>
                  <select value={selectedCampaign} onChange={e => setSelectedCampaign(e.target.value)}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-800 focus:outline-none focus:ring-2 focus:ring-violet-500">
                    <option value="all">All Campaigns</option>
                    {campaigns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* KPI Cards — Campaign data (real) */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Total Campaigns" value={animatedValues.totalCampaigns} icon={BarChart3} gradient="from-violet-600 to-cyan-500" />
          <KPICard title="Active Campaigns" value={animatedValues.activeCampaigns} icon={Activity} gradient="from-cyan-500 to-lime-500" />
          <KPICard
            title="Campaign Spend"
            value={animatedValues.totalSpend >= 100000
              ? `₹${(animatedValues.totalSpend / 100000).toFixed(1)}L`
              : animatedValues.totalSpend >= 1000
              ? `₹${(animatedValues.totalSpend / 1000).toFixed(1)}K`
              : `₹${animatedValues.totalSpend}`}
            icon={DollarSign}
            gradient="from-lime-500 to-violet-600"
          />
          <KPICard
            title="Store Revenue"
            value={analyticsLoading ? '...'
              : animatedValues.totalRevenue >= 100000
              ? `₹${(animatedValues.totalRevenue / 100000).toFixed(1)}L`
              : animatedValues.totalRevenue >= 1000
              ? `₹${(animatedValues.totalRevenue / 1000).toFixed(1)}K`
              : `₹${animatedValues.totalRevenue}`}
            icon={ShoppingCart}
            gradient="from-orange-500 to-violet-600"
          />
        </motion.div>

        {/* Secondary stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Orders', value: totalOrders, icon: ShoppingCart, color: 'violet' },
            { label: 'Commissions Paid', value: `₹${totalCommissions.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, icon: Award, color: 'lime' },
            { label: 'Affiliate Links', value: totalAffiliate, icon: Link2, color: 'cyan' },
            { label: 'Active Influencers', value: activeInfluencers, icon: Users, color: 'orange' },
          ].map((item, i) => {
            const Icon = item.icon;
            const colors = {
              violet: 'bg-violet-50 border-violet-200 text-violet-700',
              cyan: 'bg-cyan-50 border-cyan-200 text-cyan-700',
              lime: 'bg-lime-50 border-lime-200 text-lime-700',
              orange: 'bg-orange-50 border-orange-200 text-orange-700',
            };
            return (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.35 + i * 0.05 }}
                className={`${colors[item.color]} border rounded-2xl p-4 flex items-center gap-3`}>
                <Icon className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold opacity-70">{item.label}</p>
                  <p className="text-xl font-bold">{analyticsLoading ? '...' : item.value}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Monthly Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-neutral-800 mb-1">Monthly Store Revenue</h2>
              <p className="text-sm text-neutral-500">Completed orders per month</p>
            </div>
          </div>
          {monthlyData.length > 0 ? (
            <MonthlyRevenueChart data={monthlyData} />
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-neutral-400 gap-2">
              <BarChart3 className="w-8 h-8 opacity-30" />
              <p className="text-sm">No completed orders yet</p>
            </div>
          )}
        </motion.div>

        {/* Campaign Status + Commission Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Campaign Status — real counts */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-neutral-800 mb-1">Campaign Status</h3>
                <p className="text-sm text-neutral-500">Distribution of your {totalCampaigns} campaigns</p>
              </div>
              <Target className="w-6 h-6 text-violet-600" />
            </div>
            {totalCampaigns > 0 ? (
              <div className="space-y-4">
                <StatusBar label="Completed" value={completedCampaigns} total={totalCampaigns} color="lime" />
                <StatusBar label="Active" value={activeCampaigns} total={totalCampaigns} color="cyan" />
                <StatusBar label="Pending / Draft" value={pendingCampaigns} total={totalCampaigns} color="orange" />
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-neutral-400 text-sm">No campaigns yet</div>
            )}
          </motion.div>

          {/* Commission Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-violet-600 to-cyan-500 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold mb-1">Affiliate Commission</h3>
                <p className="text-violet-100 text-sm">Paid out to influencers</p>
              </div>
              <Zap className="w-6 h-6 text-violet-200" />
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-5xl font-bold mb-1">
                  ₹{totalCommissions >= 100000
                    ? `${(totalCommissions / 100000).toFixed(1)}L`
                    : totalCommissions >= 1000
                    ? `${(totalCommissions / 1000).toFixed(1)}K`
                    : totalCommissions.toFixed(0)}
                </div>
                <div className="flex items-center gap-2 text-violet-100">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Completed commissions</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-violet-400/30">
                <div>
                  <p className="text-violet-200 text-sm mb-1">Pending Payout</p>
                  <p className="text-2xl font-bold">₹{pendingCommissions.toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-violet-200 text-sm mb-1">Products Listed</p>
                  <p className="text-2xl font-bold">{totalProducts}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Top Influencers + Recent Campaigns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Influencers — real data */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-neutral-800 mb-1">Top Influencers</h3>
                <p className="text-sm text-neutral-500">By commission earned</p>
              </div>
              <Award className="w-5 h-5 text-violet-600" />
            </div>
            {topInfluencers.length > 0 ? (
              <div className="space-y-3">
                {topInfluencers.slice(0, 5).map((inf, idx) => (
                  <motion.div
                    key={inf.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + idx * 0.1 }}
                    className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors">
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        {(inf.full_name || inf.username)[0].toUpperCase()}
                      </div>
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-violet-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                        {idx + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-neutral-800 truncate">{inf.full_name || inf.username}</h4>
                      <p className="text-xs text-neutral-500">@{inf.username} · {inf.conversions} sales</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-neutral-800">₹{inf.total_earned.toFixed(0)}</p>
                      <p className="text-xs text-neutral-500">{inf.total_clicks} clicks</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="h-32 flex flex-col items-center justify-center text-neutral-400 gap-2">
                <Users className="w-8 h-8 opacity-30" />
                <p className="text-sm">No commissions paid yet</p>
              </div>
            )}
          </motion.div>

          {/* Recent Campaigns — real */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="lg:col-span-2 bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-neutral-800 mb-1">
                  {selectedCampaign !== 'all' ? 'Filtered Campaigns' : 'Recent Campaigns'}
                </h3>
                <p className="text-sm text-neutral-500">Click to view details</p>
              </div>
              <Briefcase className="w-5 h-5 text-violet-600" />
            </div>
            {filteredCampaigns.length > 0 ? (
              <div className="space-y-3">
                {filteredCampaigns.slice(0, 5).map((campaign, idx) => (
                  <motion.div
                    key={campaign.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + idx * 0.1 }}
                    onClick={() => { setSelectedCampaignDetails(campaign); setShowCampaignModal(true); }}
                    className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-all cursor-pointer group">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-neutral-800 mb-1 group-hover:text-violet-600 transition-colors">
                        {campaign.title}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-neutral-500">
                        <span className="capitalize">{campaign.campaign_type}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(campaign.deadline).toLocaleDateString()}
                        </span>
                        {campaign.applications_count !== undefined && (
                          <>
                            <span>•</span>
                            <span>{campaign.applications_count} applicants</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-bold text-neutral-800">
                          ₹{campaign.budget >= 1000 ? `${(campaign.budget / 1000).toFixed(0)}K` : campaign.budget}
                        </p>
                        <p className="text-xs text-neutral-500">Budget</p>
                      </div>
                      <span className={`px-3 py-1 text-xs font-medium rounded-lg ${
                        campaign.status === 'active' ? 'bg-lime-100 text-lime-700' :
                        campaign.status === 'completed' ? 'bg-neutral-200 text-neutral-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {campaign.status}
                      </span>
                      <ArrowUpRight className="w-4 h-4 text-neutral-400 group-hover:text-violet-600 transition-colors" />
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-neutral-400 text-sm">No campaigns match the current filter</div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Campaign Details Modal — no Math.random() */}
      <AnimatePresence>
        {showCampaignModal && selectedCampaignDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => { setShowCampaignModal(false); setSelectedCampaignDetails(null); }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                <div>
                  <h2 className="text-2xl font-bold text-neutral-800">{selectedCampaignDetails.title}</h2>
                  <p className="text-sm text-neutral-500 capitalize">{selectedCampaignDetails.campaign_type?.replace('_', ' ')}</p>
                </div>
                <button onClick={() => { setShowCampaignModal(false); setSelectedCampaignDetails(null); }}
                  className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-neutral-100 transition-colors">
                  <X className="w-5 h-5 text-neutral-600" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatBox label="Status" color="violet">
                    <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-lg ${
                      selectedCampaignDetails.status === 'active' ? 'bg-lime-100 text-lime-700' :
                      selectedCampaignDetails.status === 'completed' ? 'bg-neutral-200 text-neutral-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>{selectedCampaignDetails.status}</span>
                  </StatBox>
                  <StatBox label="Budget" color="cyan">
                    <span className="text-xl font-bold text-cyan-900">₹{Number(selectedCampaignDetails.budget || 0).toLocaleString()}</span>
                  </StatBox>
                  <StatBox label="Payment" color="lime">
                    <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-lg ${
                      selectedCampaignDetails.payment_status === 'paid' ? 'bg-lime-100 text-lime-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {selectedCampaignDetails.payment_status === 'paid' ? 'Paid' : 'Pending'}
                    </span>
                  </StatBox>
                  <StatBox label="Deadline" color="orange">
                    <span className="text-sm font-bold text-orange-900">
                      {selectedCampaignDetails.deadline
                        ? new Date(selectedCampaignDetails.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'}
                    </span>
                  </StatBox>
                </div>

                {selectedCampaignDetails.description && (
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-violet-600" />
                      Description
                    </h3>
                    <p className="text-neutral-700 leading-relaxed">{selectedCampaignDetails.description}</p>
                  </div>
                )}

                {/* Real campaign stats from the object */}
                <div>
                  <h3 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-violet-600" />
                    Campaign Stats
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-violet-50 rounded-xl p-4 border border-violet-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-violet-600" />
                        <span className="text-sm text-violet-900">Applicants</span>
                      </div>
                      <div className="text-2xl font-bold text-violet-900">{selectedCampaignDetails.applications_count ?? '—'}</div>
                    </div>
                    <div className="bg-cyan-50 rounded-xl p-4 border border-cyan-200">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="w-4 h-4 text-cyan-600" />
                        <span className="text-sm text-cyan-900">Accepted</span>
                      </div>
                      <div className="text-2xl font-bold text-cyan-900">{selectedCampaignDetails.accepted_count ?? '—'}</div>
                    </div>
                    <div className="bg-lime-50 rounded-xl p-4 border border-lime-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="w-4 h-4 text-lime-600" />
                        <span className="text-sm text-lime-900">Type</span>
                      </div>
                      <div className="text-lg font-bold text-lime-900 capitalize">{selectedCampaignDetails.campaign_type?.replace('_', ' ') ?? '—'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-neutral-50 border-t border-neutral-200 px-6 py-4 flex items-center justify-between gap-3 rounded-b-2xl">
                <div>
                  {selectedCampaignDetails.status === 'completed' &&
                   selectedCampaignDetails.payment_status !== 'paid' && (
                    <button
                      onClick={() => handleMarkPaymentCompleted(selectedCampaignDetails.id)}
                      disabled={markingPayment}
                      className={`px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 ${
                        markingPayment ? 'bg-neutral-400 cursor-not-allowed text-white' : 'bg-lime-600 hover:bg-lime-700 text-white'
                      }`}>
                      <CreditCard className="w-4 h-4" />
                      {markingPayment ? 'Processing...' : 'Mark Payment Completed'}
                    </button>
                  )}
                </div>
                <button
                  onClick={() => { setShowCampaignModal(false); setSelectedCampaignDetails(null); }}
                  className="px-6 py-2.5 bg-white border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors font-medium">
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Sub-components ──────────────────────────────────────────────────────────

const KPICard = ({ title, value, change, icon: Icon, gradient }) => (
  <motion.div
    variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
    transition={{ duration: 0.5 }}
    whileHover={{ y: -4, scale: 1.02 }}
    className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm hover:shadow-md transition-all">
    <div className="flex items-center justify-between mb-4">
      <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      {change !== undefined && (
        <div className={`flex items-center gap-1 text-sm font-medium ${change > 0 ? 'text-lime-600' : 'text-red-600'}`}>
          {change > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span>{Math.abs(change)}%</span>
        </div>
      )}
    </div>
    <h3 className="text-3xl font-bold text-neutral-800 mb-1">{value}</h3>
    <p className="text-sm text-neutral-500 font-medium">{title}</p>
  </motion.div>
);

const StatBox = ({ label, color, children }) => {
  const bg = { violet: 'from-violet-50 to-cyan-50 border-violet-100', cyan: 'from-cyan-50 to-lime-50 border-cyan-100', lime: 'from-lime-50 to-violet-50 border-lime-100', orange: 'from-orange-50 to-violet-50 border-orange-100' };
  const text = { violet: 'text-violet-900', cyan: 'text-cyan-900', lime: 'text-lime-900', orange: 'text-orange-900' };
  return (
    <div className={`bg-gradient-to-br ${bg[color]} rounded-xl p-4 border`}>
      <div className={`text-sm ${text[color]} mb-2`}>{label}</div>
      {children}
    </div>
  );
};

const MonthlyRevenueChart = ({ data }) => {
  const maxVal = Math.max(...data.map(d => d.revenue), 1);
  return (
    <div className="flex items-end gap-3 h-48 pt-4">
      {data.map((item, i) => {
        const h = Math.max((item.revenue / maxVal) * 100, 2);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[10px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
              <div className="font-semibold">{item.month}</div>
              <div>₹{item.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              <div>{item.orders} orders</div>
            </div>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ delay: i * 0.08, duration: 0.6 }}
              className="w-full bg-gradient-to-t from-violet-600 to-cyan-400 rounded-t-lg min-h-[4px]"
              style={{ height: `${h}%` }}
            />
            <span className="text-[10px] text-neutral-500 truncate w-full text-center">{item.month}</span>
          </div>
        );
      })}
    </div>
  );
};

const StatusBar = ({ label, value, total, color }) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const colorClasses = {
    lime: 'from-lime-500 to-lime-600',
    cyan: 'from-cyan-500 to-cyan-600',
    orange: 'from-orange-500 to-orange-600',
  };
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-neutral-700 font-medium">{label}</span>
        <span className="text-neutral-800 font-bold">{value} <span className="text-neutral-400 font-normal text-xs">({percentage.toFixed(0)}%)</span></span>
      </div>
      <div className="relative h-2.5 bg-neutral-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, delay: 0.5 }}
          className={`absolute inset-y-0 left-0 bg-gradient-to-r ${colorClasses[color]} rounded-full`}
        />
      </div>
    </div>
  );
};

export default CompanyAnalytics;
