import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  PlayCircle,
  Filter,
  Search,
  Building2,
  FileText,
  TrendingUp,
  Eye,
  MoreHorizontal,
  MessageCircle,
  X,
  Check,
  Link2,
  ShoppingBag,
  Users,
  Copy,
  ChevronDown,
  ChevronUp,
  Star,
  Package,
  Percent,
  Inbox,
} from 'lucide-react';
import { showConfirmToast } from '../../utils/toastHelpers';

// ─── Helpers ────────────────────────────────────────────────────────────────

const getStatusColor = (status) => {
  const colors = {
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    accepted: 'bg-green-50 text-green-700 border-green-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
    in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
    completed: 'bg-purple-50 text-purple-700 border-purple-200',
    cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-600 border-gray-200';
};

const getStatusIcon = (status) => {
  const icons = {
    pending: <Clock className="w-3.5 h-3.5" />,
    accepted: <CheckCircle className="w-3.5 h-3.5" />,
    rejected: <XCircle className="w-3.5 h-3.5" />,
    in_progress: <PlayCircle className="w-3.5 h-3.5" />,
    completed: <CheckCircle className="w-3.5 h-3.5" />,
    cancelled: <XCircle className="w-3.5 h-3.5" />,
  };
  return icons[status] || <AlertCircle className="w-3.5 h-3.5" />;
};

// ─── Expandable buyer list for a referral link ───────────────────────────────

const BuyersList = ({ referralCode }) => {
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery(
    ['referral-buyers', referralCode],
    () =>
      api.get(`/ecommerce/reviews/link-buyers/?referral_code=${encodeURIComponent(referralCode)}`).then((res) => res.data),
    { enabled: open, staleTime: 0, refetchOnWindowFocus: true }
  );

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-medium text-purple-600 hover:text-purple-800 transition-colors"
      >
        <Users className="w-3.5 h-3.5" />
        View Buyers
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {open && (
        <div className="mt-2 rounded-lg border border-gray-200 overflow-hidden text-xs">
          {isLoading ? (
            <div className="p-3 text-gray-500">Loading...</div>
          ) : data && data.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Buyer</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Amount</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Commission</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((buyer, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-800 font-medium">{buyer.username}</td>
                    <td className="px-3 py-2 text-green-700 font-semibold">
                      ₹{Number(buyer.amount).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-purple-700 font-semibold">
                      ₹{Number(buyer.commission || 0).toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-gray-500">{buyer.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-3 text-gray-500">No buyers yet through this link.</div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Single product link card ────────────────────────────────────────────────

const ReferralCard = ({ item }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(item.referral_link);
    toast.success('Link copied!');
  };

  const discount = item.custom_discount_percent ?? 10;
  const commission = item.custom_commission_rate ?? item.commission_rate ?? 10;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-3">
      {/* Product info */}
      <div className="flex items-center gap-2 mb-3">
        {item.product_image ? (
          <img
            src={item.product_image}
            alt={item.product_name}
            className="w-10 h-10 rounded-lg object-cover border border-gray-100 flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0 border border-purple-100">
            <Package className="w-5 h-5 text-purple-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm truncate">{item.product_name}</h3>
          <div className="flex items-center gap-0.5 mt-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-2.5 h-2.5 ${
                  i < item.rating
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-200 fill-gray-200'
                }`}
              />
            ))}
            <span className="text-[10px] text-gray-500 ml-1">{item.rating}/5</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{item.comment}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-1.5 mb-2">
        <div className="bg-purple-50 rounded-lg p-1.5 text-center">
          <Percent className="w-3 h-3 text-purple-500 mx-auto mb-0.5" />
          <div className="text-xs font-bold text-purple-700">{discount}%</div>
          <div className="text-[9px] text-purple-500 leading-tight">Buyer Discount</div>
        </div>
        <div className="bg-green-50 rounded-lg p-1.5 text-center">
          <DollarSign className="w-3 h-3 text-green-500 mx-auto mb-0.5" />
          <div className="text-xs font-bold text-green-700">{commission}%</div>
          <div className="text-[9px] text-green-500 leading-tight">Commission Rate</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-1.5 text-center">
          <Eye className="w-3 h-3 text-blue-500 mx-auto mb-0.5" />
          <div className="text-xs font-bold text-blue-700">{item.clicks}</div>
          <div className="text-[9px] text-blue-500 leading-tight">Link Clicks</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-1.5 text-center">
          <ShoppingBag className="w-3 h-3 text-orange-500 mx-auto mb-0.5" />
          <div className="text-xs font-bold text-orange-700">{item.conversions}</div>
          <div className="text-[9px] text-orange-500 leading-tight">Purchases</div>
        </div>
      </div>

      {/* Earned */}
      <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg px-3 py-1.5 mb-2 border border-green-100">
        <span className="text-xs font-medium text-gray-700">Commission Earned</span>
        <span className="text-sm font-bold text-green-700">
          ₹{item.earned_commission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      {/* Referral link */}
      <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-2.5 py-1.5 border border-gray-200">
        <Link2 className="w-3 h-3 text-gray-400 flex-shrink-0" />
        <span className="text-[10px] text-gray-600 truncate flex-1">{item.referral_link}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] font-medium text-purple-600 hover:text-purple-800 transition-colors flex-shrink-0"
        >
          <Copy className="w-3 h-3" />
          Copy
        </button>
      </div>

      <BuyersList referralCode={item.referral_code} />
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

const CollaborationList = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('links');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // ── Queries (all preserved) ──────────────────────────────────────────────

  const { data: collaborations, isLoading: collabLoading } = useQuery(
    'collaborations',
    () => api.get('/collaborations/collaborations/').then((res) => res.data)
  );

  const { data: requests, isLoading: requestsLoading } = useQuery(
    'collaboration-requests',
    () => api.get('/collaborations/requests/').then((res) => res.data)
  );

  const { data: directRequests, isLoading: directRequestsLoading } = useQuery(
    'direct-requests',
    () => api.get('/collaborations/direct-requests/').then((res) => res.data)
  );

  const { data: referralsData, isLoading: referralsLoading } = useQuery(
    'my-referrals',
    () => api.get('/ecommerce/reviews/my-referrals/').then((res) => res.data),
    { staleTime: 0, refetchOnWindowFocus: true, refetchInterval: 15000 }
  );

  // ── Mutations (all preserved) ────────────────────────────────────────────

  const acceptDirectRequestMutation = useMutation(
    ({ id, data }) => api.post(`/collaborations/direct-requests/${id}/accept/`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('direct-requests');
        queryClient.invalidateQueries('collaborations');
        toast.success('🎉 Proposal accepted! Collaboration created.');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to accept proposal');
      },
    }
  );

  const rejectDirectRequestMutation = useMutation(
    ({ id, data }) => api.post(`/collaborations/direct-requests/${id}/reject/`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('direct-requests');
        toast.success('Proposal rejected');
      },
      onError: () => {
        toast.error('Failed to reject proposal');
      },
    }
  );

  // ── Handlers (all preserved) ─────────────────────────────────────────────

  const handleAcceptDirectRequest = (request) => {
    const startDate = prompt(
      '📅 Enter start date (YYYY-MM-DD):',
      new Date().toISOString().split('T')[0]
    );
    const endDate = prompt('📅 Enter end date (YYYY-MM-DD):');
    if (startDate && endDate) {
      acceptDirectRequestMutation.mutate({
        id: request.id,
        data: { start_date: startDate, end_date: endDate },
      });
    }
  };

  const handleRejectDirectRequest = (request) => {
    const reason = prompt('💬 Please provide a reason for rejection (optional):');
    showConfirmToast(`Are you sure you want to reject this proposal from ${request.company_name}?`, () => {
      rejectDirectRequestMutation.mutate({
        id: request.id,
        data: { rejection_reason: reason || '' },
      });
    }, "Reject");
  };

  // ── Derived data ──────────────────────────────────────────────────────────

  const referrals = referralsData?.referrals || [];
  const summary = referralsData?.summary || {};

  const filteredReferrals = referrals.filter((r) =>
    r.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingDirectRequests =
    directRequests?.results?.filter((r) => r.status === 'pending') || [];

  const filteredCollaborations = (collaborations?.results || []).filter(
    (c) =>
      c.campaign_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRequests = (requests?.results || []).filter((r) => {
    const matchSearch =
      r.campaign_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const historyItems = [
    ...filteredRequests
      .filter((r) => r.status !== 'pending')
      .map((r) => ({ ...r, _type: 'application' })),
    ...(directRequests?.results || [])
      .filter((r) => r.status !== 'pending')
      .map((r) => ({ ...r, _type: 'direct' })),
  ];

  // ── Tabs ─────────────────────────────────────────────────────────────────

  const tabs = [
    {
      id: 'links',
      label: 'My Product Links',
      shortLabel: 'Links',
      icon: Link2,
      count: referrals.length,
      color: 'text-purple-600',
    },
    {
      id: 'requests',
      label: 'Review Requests',
      shortLabel: 'Requests',
      icon: Inbox,
      count: pendingDirectRequests.length,
      color: 'text-orange-500',
    },
    {
      id: 'active',
      label: 'Active Collaborations',
      shortLabel: 'Active',
      icon: PlayCircle,
      count: filteredCollaborations.length,
      color: 'text-blue-600',
    },
    {
      id: 'history',
      label: 'History',
      shortLabel: 'History',
      icon: FileText,
      count: historyItems.length,
      color: 'text-gray-500',
    },
  ];

  const isLoading =
    collabLoading || requestsLoading || directRequestsLoading || referralsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your collaborations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">My Collaborations</h1>
        <p className="text-sm text-gray-500">
          Track your product links, commissions, buyers, and company requests
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Link2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">
                {summary.total_referrals ?? referrals.length}
              </div>
              <div className="text-xs text-gray-500">Active Links</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">{summary.total_clicks ?? 0}</div>
              <div className="text-xs text-gray-500">Total Clicks</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <ShoppingBag className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">
                {summary.total_conversions ?? 0}
              </div>
              <div className="text-xs text-gray-500">Total Purchases</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-green-700">
                ₹
                {Number(summary.total_earned ?? 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div className="text-xs text-gray-500">Total Commission</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar + search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 py-3.5 px-4 sm:px-6 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'border-purple-600 text-purple-700'
                      : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                  }`}
                >
                  <TabIcon
                    className={`w-4 h-4 ${
                      activeTab === tab.id ? tab.color : 'text-gray-400'
                    }`}
                  />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.shortLabel}</span>
                  {tab.count > 0 && (
                    <span
                      className={`py-0.5 px-2 rounded-full text-[10px] font-semibold ${
                        activeTab === tab.id
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Search / filter */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>
            {activeTab === 'history' && (
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none min-w-36 outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MY PRODUCT LINKS ── */}
      {activeTab === 'links' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">My Product Links</h2>
            <span className="text-sm text-gray-500">
              {filteredReferrals.length} link{filteredReferrals.length !== 1 ? 's' : ''}
            </span>
          </div>

          {filteredReferrals.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredReferrals.map((item) => (
                <ReferralCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 text-center py-16 px-4">
              <Link2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-700 mb-1">No product links yet</h3>
              <p className="text-sm text-gray-500">
                Write a product review in the marketplace to generate your referral link with
                discount and commission.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── REVIEW REQUESTS ── */}
      {activeTab === 'requests' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Product Review Requests</h2>
            <span className="text-sm text-gray-500">{pendingDirectRequests.length} pending</span>
          </div>

          {pendingDirectRequests.length > 0 ? (
            <div className="space-y-4">
              {pendingDirectRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4 sm:p-5"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{request.company_name}</h3>
                          <p className="text-xs text-gray-500">
                            {request.campaign_title &&
                            request.campaign_title !== 'Untitled Campaign'
                              ? request.campaign_title
                              : 'Product Review Request'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 mb-3">
                        {request.proposed_rate && (
                          <div className="flex items-center gap-1.5 bg-green-50 border border-green-100 rounded-full px-3 py-1">
                            <DollarSign className="w-3.5 h-3.5 text-green-600" />
                            <span className="text-sm font-semibold text-green-700">
                              ₹{Number(request.proposed_rate).toLocaleString()}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                          <Calendar className="w-3.5 h-3.5" />
                          Received: {new Date(request.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      {request.message && (
                        <div className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                          <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                            <MessageCircle className="w-3 h-3" />
                            Message
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed italic">
                            "{request.message}"
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex sm:flex-col gap-2 lg:w-32">
                      <button
                        onClick={() => handleAcceptDirectRequest(request)}
                        disabled={acceptDirectRequestMutation.isLoading}
                        className="flex-1 sm:flex-none py-2.5 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
                      >
                        <Check className="w-4 h-4" />
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectDirectRequest(request)}
                        disabled={rejectDirectRequestMutation.isLoading}
                        className="flex-1 sm:flex-none py-2.5 bg-white text-gray-600 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        Ignore
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 text-center py-16 px-4">
              <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-700 mb-1">No pending requests</h3>
              <p className="text-sm text-gray-500">
                Companies will send you product review requests here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── ACTIVE COLLABORATIONS ── */}
      {activeTab === 'active' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Active Collaborations</h2>
            <span className="text-sm text-gray-500">{filteredCollaborations.length} active</span>
          </div>

          {filteredCollaborations.length > 0 ? (
            <div className="space-y-4">
              {filteredCollaborations.map((collaboration) => (
                <div
                  key={collaboration.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4 sm:p-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {collaboration.campaign_title}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                            collaboration.status
                          )}`}
                        >
                          {getStatusIcon(collaboration.status)}
                          {collaboration.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span>{collaboration.company_name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4 text-green-500" />
                          <span className="font-semibold text-green-700">
                            ₹{Number(collaboration.final_rate || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(collaboration.start_date).toLocaleDateString()} →{' '}
                          {new Date(collaboration.end_date).toLocaleDateString()}
                        </div>
                      </div>

                      {collaboration.notes && (
                        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 border border-gray-100">
                          {collaboration.notes}
                        </div>
                      )}
                    </div>

                    <button className="self-start p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 text-center py-16 px-4">
              <PlayCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-700 mb-1">
                No active collaborations
              </h3>
              <p className="text-sm text-gray-500">
                Your accepted collaborations will appear here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY ── */}
      {activeTab === 'history' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Collaboration History</h2>
            <span className="text-sm text-gray-500">{historyItems.length} items</span>
          </div>

          {historyItems.length > 0 ? (
            <div className="space-y-3">
              {historyItems.map((item) => (
                <div
                  key={`${item._type}-${item.id}`}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {item._type === 'direct'
                            ? `Direct Proposal from ${item.company_name}`
                            : item.campaign_title}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                            item.status
                          )}`}
                        >
                          {getStatusIcon(item.status)}
                          {item.status}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${
                            item._type === 'direct'
                              ? 'bg-indigo-100 text-indigo-600'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {item._type === 'direct' ? 'Direct' : 'Application'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          {item.company_name}
                        </div>
                        {item.proposed_rate && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5" />
                            ₹{Number(item.proposed_rate).toLocaleString()}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(item.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      {item._type === 'direct' && item.rejection_reason && (
                        <div className="mt-2 p-2.5 bg-red-50 border-l-4 border-red-300 rounded text-xs text-gray-700">
                          <strong>Rejection reason:</strong> {item.rejection_reason}
                        </div>
                      )}
                      {item._type === 'application' &&
                        item.message?.includes('[REJECTION REASON]') && (
                          <div className="mt-2 p-2.5 bg-red-50 border-l-4 border-red-300 rounded text-xs text-gray-700">
                            <strong>Rejection reason:</strong>{' '}
                            {item.message.split('[REJECTION REASON]:')[1]?.trim()}
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 text-center py-16 px-4">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-700 mb-1">No history yet</h3>
              <p className="text-sm text-gray-500">
                Your completed and past requests will appear here.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CollaborationList;
