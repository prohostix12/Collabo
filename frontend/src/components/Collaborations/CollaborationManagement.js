import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Check, 
  X, 
  Calendar, 
  DollarSign, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  PlayCircle,
  Users,
  MessageCircle,
  ExternalLink,
  Filter,
  Search,
  TrendingUp,
  FileText,
  Sparkles,
  MoreHorizontal
} from 'lucide-react';
import { showConfirmToast } from '../../utils/toastHelpers';

const CollaborationManagement = () => {
  // eslint-disable-next-line no-unused-vars
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('pending');

  const { data: requests, isLoading } = useQuery('collaboration-requests', () =>
    api.get('/collaborations/requests/').then(res => res.data)
  );

  const { data: directRequests, isLoading: directRequestsLoading } = useQuery('direct-requests', () =>
    api.get('/collaborations/direct-requests/').then(res => res.data)
  );

  const { data: collaborations } = useQuery('collaborations', () =>
    api.get('/collaborations/collaborations/').then(res => res.data)
  );

  const acceptRequestMutation = useMutation(
    ({ id, data }) => api.post(`/collaborations/requests/${id}/accept/`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('collaboration-requests');
        queryClient.invalidateQueries('collaborations');
        toast.success('🎉 Request accepted successfully!');
      },
      onError: (error) => {
        toast.error('Failed to accept request');
      }
    }
  );

  const updateRequestMutation = useMutation(
    ({ id, data }) => api.put(`/collaborations/requests/${id}/`, data),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('collaboration-requests');
        
        // Show specific success message based on status
        const status = response.data.status;
        if (status === 'rejected') {
          toast.success('❌ Request rejected successfully. The influencer has been notified.');
        } else {
          toast.success('✅ Request updated successfully!');
        }
      },
      onError: (error) => {
        console.error('Update request failed:', error);
        let errorMessage = 'Failed to update request';
        
        if (error.response?.status === 404) {
          errorMessage = 'Request not found or you do not have permission to update it';
        } else if (error.response?.status === 400) {
          errorMessage = 'Invalid request data';
        } else if (error.response?.data?.detail) {
          errorMessage = error.response.data.detail;
        }
        
        toast.error(errorMessage);
      }
    }
  );

  const handleAcceptRequest = (request) => {
    const startDate = prompt('📅 Enter start date (YYYY-MM-DD):');
    const endDate = prompt('📅 Enter end date (YYYY-MM-DD):');
    
    if (startDate && endDate) {
      acceptRequestMutation.mutate({
        id: request.id,
        data: {
          start_date: startDate,
          end_date: endDate
        }
      });
    }
  };

  const handleRejectRequest = (request) => {
    const reason = prompt('💬 Please provide a reason for rejection (optional):');
    
    showConfirmToast(`Are you sure you want to reject the request from ${request.influencer_username}?`, () => {
      const updateData = { 
        status: 'rejected'
      };
      
      // Add rejection reason to the message if provided
      if (reason && reason.trim()) {
        updateData.message = `${request.message}\n\n[REJECTION REASON]: ${reason.trim()}`;
      }
      
      updateRequestMutation.mutate({
        id: request.id,
        data: updateData
      });
    }, "Reject");
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-400/20 text-gray-900 border-yellow-500/30',
      accepted: 'bg-primary-400/20 text-primary-600 border-primary-500/30',
      rejected: 'bg-red-500/20 text-gray-900 border-red-600/30',
      in_progress: 'bg-accent-400/20 text-accent-600 border-accent-500/30',
      completed: 'bg-primary-500/20 text-primary-600 border-primary-600/30',
      cancelled: 'bg-gray-600/20 text-gray-900 border-gray-700/30'
    };
    return colors[status] || 'bg-yellow-400/20 text-gray-900 border-yellow-500/30';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="w-4 h-4" />,
      accepted: <CheckCircle className="w-4 h-4" />,
      rejected: <XCircle className="w-4 h-4" />,
      in_progress: <PlayCircle className="w-4 h-4" />,
      completed: <CheckCircle className="w-4 h-4" />,
      cancelled: <XCircle className="w-4 h-4" />
    };
    return icons[status] || <AlertCircle className="w-4 h-4" />;
  };

  const filteredRequests = requests?.results?.filter(request => {
    const matchesSearch = request.campaign_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.influencer_username?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const pendingRequests = filteredRequests.filter(req => req.status === 'pending');
  const activeCollaborations = collaborations?.results?.filter(col => col.status === 'in_progress') || [];
  const allRequests = filteredRequests;
  
  // Process direct requests
  const directRequestsList = directRequests?.results || [];
  const pendingDirectRequests = directRequestsList.filter(req => req.status === 'pending');

  const tabs = [
    { id: 'pending', label: 'Pending Requests', count: pendingRequests.length, icon: Clock, color: 'text-yellow-600' },
    { id: 'direct', label: 'Sent Proposals', count: pendingDirectRequests.length, icon: MessageCircle, color: 'text-purple-600' },
    { id: 'active', label: 'Active Collaborations', count: activeCollaborations.length, icon: PlayCircle, color: 'text-green-600' },
    { id: 'history', label: 'Request History', count: allRequests.length, icon: FileText, color: 'text-blue-600' }
  ];

  if (isLoading) {
    return (
      <div className="saas-background connection-lines flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-12 h-12 mx-auto mb-4"></div>
          <p className="text-gray-900">Loading collaboration requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50">
      <div className="w-full py-4 sm:py-8">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                Collaboration Management
              </h1>
              <p className="text-sm sm:text-base text-gray-900">Manage influencer requests and active collaborations</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{pendingRequests.length}</div>
                  <div className="text-xs sm:text-sm text-gray-900">Pending</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <PlayCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{activeCollaborations.length}</div>
                  <div className="text-xs sm:text-sm text-gray-900">Active</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                    ₹{activeCollaborations.reduce((sum, col) => sum + parseFloat(col.final_rate || 0), 0).toLocaleString()}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-900">Active Value</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{allRequests.length}</div>
                  <div className="text-xs sm:text-sm text-gray-900">Total Requests</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 mb-4 sm:mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto scrollbar-hide" aria-label="Tabs">
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-shrink-0 flex items-center space-x-1 sm:space-x-2 py-3 sm:py-4 px-3 sm:px-6 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-900 hover:text-gray-900 hover:border-gray-300'
                    }`}
                  >
                    <TabIcon className={`w-3 h-3 sm:w-4 sm:h-4 ${activeTab === tab.id ? tab.color : 'text-gray-900'}`} />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">
                      {tab.id === 'pending' ? 'Pending' : tab.id === 'direct' ? 'Direct' : tab.id === 'active' ? 'Active' : 'History'}
                    </span>
                    {tab.count > 0 && (
                      <span className={`ml-1 sm:ml-2 py-0.5 px-1.5 sm:px-2 rounded-full text-xs ${
                        activeTab === tab.id
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
                );
              })}
            </nav>
          </div>

          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-3 sm:space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-900 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="text"
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              {activeTab === 'history' && (
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-900 w-4 h-4 sm:w-5 sm:h-5" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full pl-9 sm:pl-10 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none cursor-pointer min-w-32 sm:min-w-40"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
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

        {/* Content */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-6">
          {activeTab === 'pending' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Pending Requests</h2>
                <span className="text-sm text-gray-600">{pendingRequests.length} requests</span>
              </div>
              
              {pendingRequests.length > 0 ? (
                <div className="space-y-4 sm:space-y-6">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="glass-card card-hover rounded-2xl shadow-lg p-4 sm:p-6 relative overflow-hidden group">
                      {/* Background decoration */}
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-black/5 to-gray-500/10 rounded-full opacity-10 blur-2xl group-hover:opacity-20 transition-opacity duration-300 -mr-12 -mt-12"></div>
                      
                      <div className="relative z-10">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="w-12 h-12 bg-gradient-dark rounded-2xl flex items-center justify-center shadow-lg">
                                <Sparkles className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <h4 className="text-lg sm:text-xl heading-card text-gray-100">
                                  {request.campaign_title}
                                </h4>
                                <p className="text-sm dashboard-text text-gray-900">
                                  by @{request.influencer_username}
                                </p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                              <div className="bg-gradient-to-r from-primary-400/20 to-accent-400/20 rounded-xl p-3">
                                <div className="flex items-center space-x-2">
                                  <DollarSign className="w-4 h-4 text-primary-400" />
                                  <span className="text-sm font-medium text-gray-900">Proposed Rate</span>
                                </div>
                                <div className="text-lg font-bold text-gray-900">₹{request.proposed_rate}</div>
                              </div>
                              
                              <div className="bg-gradient-to-r from-accent-400/20 to-primary-400/20 rounded-xl p-3">
                                <div className="flex items-center space-x-2">
                                  <Calendar className="w-4 h-4 text-accent-400" />
                                  <span className="text-sm font-medium text-gray-900">Applied</span>
                                </div>
                                <div className="text-sm font-semibold text-gray-900">
                                  {new Date(request.created_at).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            
                            {request.message && (
                              <div className="bg-gradient-to-r from-gray-600/20 to-gray-500/20 rounded-xl p-4 mb-4">
                                <div className="flex items-center space-x-2 mb-2">
                                  <MessageCircle className="w-4 h-4 text-primary-400" />
                                  <span className="text-sm font-medium text-gray-900">Message</span>
                                </div>
                                <p className="text-sm text-gray-900 leading-relaxed">{request.message}</p>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col sm:flex-row lg:flex-col space-y-2 sm:space-y-0 sm:space-x-3 lg:space-x-0 lg:space-y-2 lg:ml-6">
                            <button
                              onClick={() => handleAcceptRequest(request)}
                              disabled={acceptRequestMutation.isLoading}
                              className="btn-primary flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl disabled:opacity-50"
                            >
                              <Check className="w-4 h-4" />
                              <span className="text-sm font-medium">Accept</span>
                            </button>
                            <button
                              onClick={() => handleRejectRequest(request)}
                              disabled={updateRequestMutation.isLoading}
                              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white px-4 py-2.5 rounded-xl hover:from-gray-700 hover:to-gray-800 disabled:opacity-50 transition-all duration-200 transform hover:scale-105 shadow-lg"
                            >
                              <X className="w-4 h-4" />
                              <span className="text-sm font-medium">Reject</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Clock className="w-16 h-16 text-gray-900 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No pending requests</h3>
                  <p className="text-gray-900">New collaboration requests will appear here</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'direct' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Sent Proposals to Influencers</h2>
                <div className="flex items-center space-x-2 text-sm text-gray-900">
                  <MessageCircle className="w-4 h-4" />
                  <span>{directRequestsList.length} total sent</span>
                </div>
              </div>

              {directRequestsLoading ? (
                <div className="text-center py-8">
                  <div className="spinner w-8 h-8 mx-auto mb-4"></div>
                  <p className="text-gray-900">Loading sent proposals...</p>
                </div>
              ) : directRequestsList.length > 0 ? (
                <div className="space-y-4">
                  {directRequestsList.map((request) => (
                    <div key={request.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center">
                            <MessageCircle className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {request.campaign_title || 'Direct Message'}
                            </h3>
                            <p className="text-sm text-gray-900">
                              From: {request.company_name || ''}
                            </p>
                            <p className="text-sm text-gray-900">
                              To: {request.influencer_username}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                            {request.status}
                          </span>
                          <span className="text-xs text-gray-900">
                            {new Date(request.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-gray-900 text-sm leading-relaxed">
                          {request.message}
                        </p>
                      </div>

                      {request.proposed_rate && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4 text-gray-900" />
                            <span className="text-sm font-medium text-gray-900">
                              Proposed Rate: ₹{request.proposed_rate}
                            </span>
                          </div>
                        </div>
                      )}

                      {request.rejection_reason && (
                        <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-200 rounded-lg">
                          <p className="text-sm text-gray-800 italic">
                            <strong>Reason:</strong> {request.rejection_reason}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Campaign: {request.campaign_details?.title || 'General'}</span>
                        {request.status === 'accepted' && (
                           <span className="text-green-600 font-bold flex items-center gap-1">
                             <CheckCircle className="w-3 h-3" /> Accepted
                           </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageCircle className="w-16 h-16 text-gray-900 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No sent proposals</h3>
                  <p className="text-gray-900">Direct proposals sent to influencers will appear here</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'active' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Active Collaborations</h2>
                <span className="text-sm text-gray-900">{activeCollaborations.length} active</span>
              </div>
              
              {activeCollaborations.length > 0 ? (
                <div className="space-y-4 sm:space-y-6">
                  {activeCollaborations.map((collaboration) => (
                    <div key={collaboration.id} className="glass-card card-hover rounded-2xl shadow-lg p-4 sm:p-6 relative overflow-hidden group">
                      {/* Background decoration */}
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-black/5 to-gray-500/10 rounded-full opacity-10 blur-2xl group-hover:opacity-20 transition-opacity duration-300 -mr-12 -mt-12"></div>
                      
                      <div className="relative z-10">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="w-12 h-12 bg-gradient-dark rounded-2xl flex items-center justify-center shadow-lg">
                                <PlayCircle className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <h4 className="text-lg sm:text-xl font-bold text-gray-900">
                                  {collaboration.campaign_title}
                                </h4>
                                <p className="text-sm text-gray-900">
                                  with @{collaboration.influencer_username}
                                </p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                              <div className="bg-gradient-to-r from-primary-400/20 to-accent-400/20 rounded-xl p-3">
                                <div className="flex items-center space-x-2">
                                  <DollarSign className="w-4 h-4 text-primary-400" />
                                  <span className="text-sm font-medium text-gray-900">Final Rate</span>
                                </div>
                                <div className="text-lg font-bold text-gray-900">₹{collaboration.final_rate}</div>
                              </div>
                              
                              <div className="bg-gradient-to-r from-accent-400/20 to-primary-400/20 rounded-xl p-3">
                                <div className="flex items-center space-x-2">
                                  <Calendar className="w-4 h-4 text-accent-400" />
                                  <span className="text-sm font-medium text-gray-900">Duration</span>
                                </div>
                                <div className="text-sm font-semibold text-gray-900">
                                  {new Date(collaboration.start_date).toLocaleDateString()} - {new Date(collaboration.end_date).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            
                            {collaboration.deliverable_urls?.length > 0 && (
                              <div className="bg-gradient-to-r from-gray-600/20 to-gray-500/20 rounded-xl p-4 mb-4">
                                <div className="flex items-center space-x-2 mb-3">
                                  <ExternalLink className="w-4 h-4 text-primary-400" />
                                  <span className="text-sm font-medium text-gray-900">Deliverables</span>
                                </div>
                                <div className="space-y-2">
                                  {collaboration.deliverable_urls.map((url, index) => (
                                    <a
                                      key={index}
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center space-x-2 text-sm text-primary-400 hover:text-primary-300 transition-colors duration-200"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      <span className="truncate">{url}</span>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {collaboration.notes && (
                              <div className="bg-gradient-to-r from-gray-600/20 to-gray-500/20 rounded-xl p-4">
                                <div className="flex items-center space-x-2 mb-2">
                                  <FileText className="w-4 h-4 text-gray-900" />
                                  <span className="text-sm font-medium text-gray-900">Notes</span>
                                </div>
                                <p className="text-sm text-gray-900 leading-relaxed">{collaboration.notes}</p>
                              </div>
                            )}
                          </div>
                          
                          <div className="lg:ml-6">
                            <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(collaboration.status)}`}>
                              {getStatusIcon(collaboration.status)}
                              {collaboration.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <PlayCircle className="w-16 h-16 text-gray-900 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No active collaborations</h3>
                  <p className="text-gray-900">Accepted requests will appear here as active collaborations</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Request History</h2>
                <span className="text-sm text-gray-900">{allRequests.length} total requests</span>
              </div>
              
              {allRequests.length > 0 ? (
                <div className="space-y-4">
                  {allRequests.map((request) => (
                    <div key={request.id} className="glass-card card-hover rounded-xl shadow-lg p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-base sm:text-lg font-semibold text-gray-900">
                              {request.campaign_title}
                            </h4>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                              {getStatusIcon(request.status)}
                              {request.status}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-gray-900">
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span>@{request.influencer_username}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span>₹{request.proposed_rate}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span>{new Date(request.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          {request.message && request.message.includes('[REJECTION REASON]') && (
                            <div className="mt-3 p-3 bg-gray-600/20 border-l-4 border-gray-400 rounded-lg">
                              <p className="text-sm text-gray-900">
                                <strong>Rejection Reason:</strong> {request.message.split('[REJECTION REASON]:')[1]?.trim()}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <button className="self-start sm:self-center p-2 text-gray-900 hover:text-gray-900 rounded-lg hover:bg-gray-50">
                          <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <FileText className="w-16 h-16 text-gray-900 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No request history</h3>
                  <p className="text-gray-900">All collaboration requests will appear here</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollaborationManagement;