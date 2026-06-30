import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Users, Heart, Eye, TrendingUp, TrendingDown,
  ThumbsUp, MessageCircle, Share2, BarChart3,
  Camera, Sun, RefreshCw, AlertCircle, DollarSign, Target,
  Zap, Award, Activity, X, Link2
} from 'lucide-react';
import ConnectAccounts from '../SocialMedia/ConnectAccounts';

const InfluencerAnalytics = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [animatedValues, setAnimatedValues] = useState({
    totalFollowers: 0,
    engagementRate: 0,
    totalClicks: 0,
    totalEarnings: 0,
  });

  // Fetch influencer profile data
  const { data: profile } = useQuery('influencer-profile', async () => {
    const res = await api.get('/auth/influencer-profile/');
    return res.data;
  });

  // Fetch collaborations data
  const { data: collaborationsData } = useQuery('influencer-collaborations', async () => {
    const res = await api.get('/collaborations/collaborations/');
    return res.data;
  });

  // Fetch real affiliate/commission data
  const { data: referralsData, refetch: refetchReferrals } = useQuery(
    'influencer-referrals-analytics',
    async () => {
      const res = await api.get('/ecommerce/reviews/my-referrals/');
      return res.data;
    },
    { refetchInterval: 60000, staleTime: 50000 }
  );

  // Fetch real-time social analytics data
  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics,
  } = useQuery(
    'influencer-analytics-realtime',
    async () => {
      const res = await api.get('/social-media/analytics/influencer/');
      return res.data;
    },
    {
      refetchInterval: 300000,
      refetchOnWindowFocus: true,
      staleTime: 240000,
      retry: 2,
      onError: (err) => console.log('Analytics API error:', err?.response?.data || err.message),
    }
  );

  const noAccountsConnected =
    analyticsError?.response?.status === 404 &&
    analyticsError?.response?.data?.error === 'No connected social media accounts found';

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await api.post('/social-media/analytics/refresh/');
      toast.success('Refreshing analytics data...');
      setTimeout(async () => {
        await refetchAnalytics();
        await refetchReferrals();
        setIsRefreshing(false);
        toast.success('Analytics data updated!');
      }, 30000);
    } catch {
      await refetchReferrals();
      setIsRefreshing(false);
      toast.error('Social refresh failed — commission data updated.');
    }
  };

  const collaborations = collaborationsData?.results || [];
  const realTimeData = analyticsData?.data;
  const summary = referralsData?.summary || {};
  const referrals = referralsData?.referrals || [];

  // Real values — social data when available, profile fallback, then 0
  const totalFollowers =
    realTimeData?.kpi?.total_followers || parseFloat(profile?.followers_count) || 0;
  const engagementRate =
    realTimeData?.kpi?.engagement_rate || parseFloat(profile?.engagement_rate) || 0;
  const totalClicks = summary.total_clicks || 0;
  const totalEarnings = summary.total_earned || 0;
  const totalConversions = summary.total_conversions || 0;
  const followersChange = realTimeData?.kpi?.follower_growth || null;
  const engagementChange = realTimeData?.kpi?.engagement_change || null;

  // Build monthly earnings chart from real referral commission data
  const buildMonthlyEarnings = () => {
    if (!referrals.length) return [];
    const map = {};
    referrals.forEach(r => {
      if (!r.created_at) return;
      const d = new Date(r.created_at);
      const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      map[key] = (map[key] || 0) + (r.earned_commission || 0);
    });
    return Object.entries(map)
      .slice(-6)
      .map(([month, earnings]) => ({ month, earnings, clicks: 0 }));
  };

  // Use social growth trends when available, otherwise use earnings-based months
  const growthData =
    realTimeData?.growth_trends?.slice(-6).map(trend => ({
      month: new Date(trend.date).toLocaleDateString('en-US', { month: 'short' }),
      followers: trend.followers || 0,
      engagement: parseFloat(trend.engagement_rate) || 0,
    })) || [];

  const earningsChartData = buildMonthlyEarnings();
  const hasGrowthData = growthData.length > 0;
  const hasEarningsData = earningsChartData.length > 0;

  // Top content — social API when available, otherwise affiliate referrals
  const topContent =
    analyticsData?.top_content?.slice(0, 4).map((content, index) => ({
      id: content.id || index + 1,
      title: content.title || content.caption?.substring(0, 50) || 'Untitled Content',
      type: content.media_type || 'Post',
      icon: content.media_type === 'VIDEO' || content.media_type === 'REEL' ? Camera : Sun,
      views: content.impressions || content.reach || 0,
      likes: content.like_count || 0,
      comments: content.comments_count || 0,
    })) ||
    referrals.slice(0, 4).map((r, i) => ({
      id: r.id || i + 1,
      title: r.product_name || 'Affiliate Product',
      type: 'Affiliate Link',
      icon: Link2,
      views: r.clicks || 0,
      likes: r.conversions || 0,
      comments: 0,
    }));

  // Animate counters whenever the real values arrive
  useEffect(() => {
    const duration = 1800;
    const steps = 60;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const p = step / steps;
      setAnimatedValues({
        totalFollowers: Math.floor(totalFollowers * p),
        engagementRate: parseFloat((engagementRate * p).toFixed(1)),
        totalClicks: Math.floor(totalClicks * p),
        totalEarnings: Math.floor(totalEarnings * p),
      });
      if (step >= steps) {
        clearInterval(timer);
        setAnimatedValues({ totalFollowers, engagementRate, totalClicks, totalEarnings });
      }
    }, duration / steps);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalFollowers, engagementRate, totalClicks, totalEarnings]);

  if (analyticsLoading && !profile && !referralsData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-violet-50 via-cyan-50 to-lime-50">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-violet-600 animate-spin mx-auto mb-4" />
          <p className="text-neutral-600">Loading analytics data...</p>
        </div>
      </div>
    );
  }

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
            <p className="text-neutral-500">
              {realTimeData ? 'Live data from connected accounts' : 'Affiliate & collaboration performance'}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-cyan-500 text-white rounded-xl hover:from-violet-700 hover:to-cyan-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="font-medium">{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
          </motion.button>
        </motion.div>

        {/* No social accounts alert */}
        {noAccountsConnected && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-orange-50 border-2 border-orange-300 rounded-xl p-5 flex items-start gap-4 shadow-sm">
            <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-orange-900 mb-1">Connect Your Social Media Accounts</h3>
              <p className="text-sm text-orange-800 mb-4">
                Connect Instagram or YouTube to unlock real-time follower analytics, engagement tracking, and reach insights.
              </p>
              <button
                onClick={() => setShowConnectModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white text-sm font-semibold rounded-lg transition-all shadow-md">
                <Share2 className="w-4 h-4" />
                Connect Account Now
              </button>
            </div>
          </motion.div>
        )}

        {/* KPI Cards — all real data */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Followers"
            value={totalFollowers > 0 ? animatedValues.totalFollowers.toLocaleString() : '—'}
            change={followersChange}
            icon={Users}
            gradient="from-violet-600 to-cyan-500"
            note={!totalFollowers ? 'Connect social account' : null}
          />
          <KPICard
            title="Engagement Rate"
            value={engagementRate > 0 ? `${animatedValues.engagementRate.toFixed(1)}%` : '—'}
            change={engagementChange}
            icon={Heart}
            gradient="from-cyan-500 to-lime-500"
            note={!engagementRate ? 'Connect social account' : null}
          />
          <KPICard
            title="Total Link Clicks"
            value={animatedValues.totalClicks.toLocaleString()}
            icon={Eye}
            gradient="from-lime-500 to-violet-600"
          />
          <KPICard
            title="Commission Earned"
            value={`₹${animatedValues.totalEarnings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            icon={DollarSign}
            gradient="from-orange-500 to-violet-600"
          />
        </motion.div>

        {/* Affiliate Summary Strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Affiliate Links', value: referrals.length, icon: Link2, color: 'violet' },
            { label: 'Conversions', value: totalConversions, icon: Target, color: 'cyan' },
            { label: 'Active Collabs', value: collaborations.length, icon: Award, color: 'lime' },
            { label: 'Avg per Click', value: totalClicks > 0 ? `₹${(totalEarnings / totalClicks).toFixed(1)}` : '₹0', icon: Zap, color: 'orange' },
          ].map((item, i) => {
            const Icon = item.icon;
            const colors = {
              violet: 'bg-violet-50 border-violet-200 text-violet-700',
              cyan: 'bg-cyan-50 border-cyan-200 text-cyan-700',
              lime: 'bg-lime-50 border-lime-200 text-lime-700',
              orange: 'bg-orange-50 border-orange-200 text-orange-700',
            };
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.35 + i * 0.05 }}
                className={`${colors[item.color]} border rounded-2xl p-4 flex items-center gap-3`}>
                <Icon className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold opacity-70">{item.label}</p>
                  <p className="text-xl font-bold">{item.value}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Follower Growth (social) or message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-neutral-800">Follower Growth</h2>
                <p className="text-xs text-neutral-500">From connected social accounts</p>
              </div>
              <BarChart3 className="w-5 h-5 text-violet-500" />
            </div>
            {hasGrowthData ? (
              <GrowthChart data={growthData} valueKey="followers" label="followers" color="#7c3aed" />
            ) : (
              <EmptyChart message="Connect a social account to see follower growth" />
            )}
          </motion.div>

          {/* Monthly Commission Earnings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-neutral-800">Commission Earnings</h2>
                <p className="text-xs text-neutral-500">By month from affiliate link sales</p>
              </div>
              <DollarSign className="w-5 h-5 text-orange-500" />
            </div>
            {hasEarningsData ? (
              <EarningsChart data={earningsChartData} />
            ) : (
              <EmptyChart message="Generate affiliate links and make sales to see earnings over time" />
            )}
          </motion.div>
        </div>

        {/* Engagement Breakdown & Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-neutral-800">Affiliate Breakdown</h3>
                <p className="text-sm text-neutral-500">Performance across your affiliate links</p>
              </div>
              <Activity className="w-6 h-6 text-violet-600" />
            </div>
            <div className="space-y-4">
              <EngagementBar label="Total Clicks" value={totalClicks} max={Math.max(totalClicks, 1)} color="cyan" icon={Eye} />
              <EngagementBar label="Conversions" value={totalConversions} max={Math.max(totalConversions, totalClicks, 1)} color="lime" icon={ThumbsUp} />
              <EngagementBar label="Active Links" value={referrals.length} max={Math.max(referrals.length, 1)} color="violet" icon={Link2} />
              <EngagementBar label="Paid Commission" value={Math.round(totalEarnings)} max={Math.max(Math.round(totalEarnings), 1)} color="orange" icon={DollarSign} displayPrefix="₹" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-violet-600 to-cyan-500 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold mb-1">Conversion Rate</h3>
                <p className="text-violet-100 text-sm">Clicks that led to a purchase</p>
              </div>
              <Zap className="w-6 h-6 text-violet-200" />
            </div>
            <div className="space-y-6">
              <div>
                <div className="text-5xl font-bold mb-2">
                  {totalClicks > 0 ? `${((totalConversions / totalClicks) * 100).toFixed(1)}%` : '0%'}
                </div>
                <div className="flex items-center gap-2 text-violet-100">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">
                    {totalConversions} sale{totalConversions !== 1 ? 's' : ''} from {totalClicks} click{totalClicks !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-violet-400/30">
                <div>
                  <p className="text-violet-200 text-sm mb-1">Avg Commission</p>
                  <p className="text-2xl font-bold">
                    {totalConversions > 0 ? `₹${(totalEarnings / totalConversions).toFixed(0)}` : '₹0'}
                  </p>
                </div>
                <div>
                  <p className="text-violet-200 text-sm mb-1">Active Collabs</p>
                  <p className="text-2xl font-bold">{collaborations.length}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Top Performing Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-neutral-800">
                {analyticsData?.top_content ? 'Top Performing Content' : 'Top Affiliate Products'}
              </h3>
              <p className="text-sm text-neutral-500">
                {analyticsData?.top_content ? 'Your best posts' : 'Products with the most clicks or conversions'}
              </p>
            </div>
            <Target className="w-5 h-5 text-violet-600" />
          </div>
          {topContent.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topContent.map((content, index) => {
                const IconComponent = content.icon;
                return (
                  <motion.div
                    key={content.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="flex items-center gap-4 p-4 bg-gradient-to-br from-neutral-50 to-white rounded-xl border border-neutral-100 hover:border-violet-200 hover:shadow-md transition-all cursor-pointer group">
                    <div className="relative flex-shrink-0">
                      <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <IconComponent className="w-7 h-7 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-violet-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-neutral-800 truncate mb-1 group-hover:text-violet-600 transition-colors">
                        {content.title}
                      </h4>
                      <p className="text-xs text-neutral-500 mb-2">{content.type}</p>
                      <div className="flex items-center gap-3 text-xs text-neutral-600">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {content.views >= 1000 ? `${(content.views / 1000).toFixed(1)}K` : content.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" />
                          {content.likes >= 1000 ? `${(content.likes / 1000).toFixed(1)}K` : content.likes}
                        </span>
                        {content.comments > 0 && (
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            {content.comments}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-neutral-400">
              <Link2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Create affiliate links from the Affiliated Marketing tab to see performance here.</p>
            </div>
          )}
        </motion.div>

        {/* Monthly Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-br from-violet-600 via-cyan-500 to-lime-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold mb-1">Summary</h3>
              <p className="text-violet-100 text-sm">Your overall affiliate performance</p>
            </div>
            <Award className="w-6 h-6 text-violet-200" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-white/80 text-xs mb-1">Followers</p>
              <p className="text-2xl font-bold">
                {totalFollowers >= 1000 ? `${(totalFollowers / 1000).toFixed(1)}K` : totalFollowers || '—'}
              </p>
              {followersChange !== null && (
                <p className="text-xs text-white/70 mt-1 flex items-center gap-1">
                  {followersChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(followersChange).toFixed(1)}%
                </p>
              )}
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-white/80 text-xs mb-1">Engagement</p>
              <p className="text-2xl font-bold">{engagementRate > 0 ? `${engagementRate.toFixed(1)}%` : '—'}</p>
              {engagementChange !== null && (
                <p className="text-xs text-white/70 mt-1 flex items-center gap-1">
                  {engagementChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(engagementChange).toFixed(1)}%
                </p>
              )}
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-white/80 text-xs mb-1">Total Clicks</p>
              <p className="text-2xl font-bold">{totalClicks.toLocaleString()}</p>
              <p className="text-xs text-white/70 mt-1">{referrals.length} links active</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-white/80 text-xs mb-1">Commission Earned</p>
              <p className="text-2xl font-bold">₹{totalEarnings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
              <p className="text-xs text-white/70 mt-1">{totalConversions} conversions</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Connect Accounts Modal */}
      <AnimatePresence>
        {showConnectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowConnectModal(false)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b border-neutral-200 bg-gradient-to-r from-violet-50 to-cyan-50">
                <div>
                  <h2 className="text-2xl font-bold text-neutral-800">Connect Social Accounts</h2>
                  <p className="text-sm text-neutral-600 mt-1">Link your social media to track analytics</p>
                </div>
                <button onClick={() => setShowConnectModal(false)} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                  <X className="w-6 h-6 text-neutral-600" />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[calc(90vh-88px)]">
                <ConnectAccounts />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Sub-components ──────────────────────────────────────────────────────────

const KPICard = ({ title, value, change, icon: Icon, gradient, note }) => (
  <motion.div
    variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
    transition={{ duration: 0.5 }}
    whileHover={{ y: -4, scale: 1.02 }}
    className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm hover:shadow-md transition-all">
    <div className="flex items-center justify-between mb-4">
      <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      {change !== null && change !== undefined && (
        <div className={`flex items-center gap-1 text-sm font-medium ${change > 0 ? 'text-lime-600' : 'text-red-600'}`}>
          {change > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span>{Math.abs(change).toFixed(1)}%</span>
        </div>
      )}
    </div>
    <h3 className="text-3xl font-bold text-neutral-800 mb-1">{value}</h3>
    <p className="text-sm text-neutral-500 font-medium">{title}</p>
    {note && <p className="text-xs text-orange-500 mt-1">{note}</p>}
  </motion.div>
);

const EmptyChart = ({ message }) => (
  <div className="h-48 flex flex-col items-center justify-center text-neutral-400 gap-2">
    <BarChart3 className="w-8 h-8 opacity-30" />
    <p className="text-sm text-center max-w-xs">{message}</p>
  </div>
);

const GrowthChart = ({ data, valueKey, label, color }) => {
  const values = data.map(d => d[valueKey] || 0);
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const range = maxValue - minValue || 1;

  const points = data.map((item, i) => ({
    x: data.length > 1 ? (i / (data.length - 1)) * 100 : 50,
    y: 100 - ((( item[valueKey] || 0) - minValue) / range) * 85,
    ...item,
  }));

  return (
    <div className="relative h-48">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${valueKey}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.03" />
          </linearGradient>
        </defs>
        <motion.polygon
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          points={`0,100 ${points.map(p => `${p.x},${p.y}`).join(' ')} 100,100`}
          fill={`url(#grad-${valueKey})`}
        />
        <motion.polyline
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2 }}
          points={points.map(p => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-neutral-500 px-1">
        {data.map((item, i) => <span key={i}>{item.month}</span>)}
      </div>
    </div>
  );
};

const EarningsChart = ({ data }) => {
  const maxVal = Math.max(...data.map(d => d.earnings), 1);
  return (
    <div className="h-48 flex items-end gap-2 pt-4">
      {data.map((item, i) => {
        const h = Math.max((item.earnings / maxVal) * 100, 2);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[10px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
              ₹{item.earnings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ delay: i * 0.08, duration: 0.6 }}
              className="w-full bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-lg min-h-[4px]"
              style={{ height: `${h}%` }}
            />
            <span className="text-[10px] text-neutral-500 truncate w-full text-center">{item.month}</span>
          </div>
        );
      })}
    </div>
  );
};

const EngagementBar = ({ label, value, max, color, icon: Icon, displayPrefix = '' }) => {
  const percentage = Math.min((value / Math.max(max, 1)) * 100, 100);
  const colorClasses = {
    cyan: 'from-cyan-500 to-cyan-600',
    lime: 'from-lime-500 to-lime-600',
    violet: 'from-violet-500 to-violet-600',
    orange: 'from-orange-500 to-orange-600',
  };
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-neutral-600" />
          <span className="text-neutral-700 font-medium">{label}</span>
        </div>
        <span className="text-neutral-800 font-bold">{displayPrefix}{value.toLocaleString('en-IN')}</span>
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

export default InfluencerAnalytics;
