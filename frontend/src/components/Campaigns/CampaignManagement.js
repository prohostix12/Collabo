import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  DollarSign, 
  Calendar, 
  Target, 
  // eslint-disable-next-line no-unused-vars
  Users, 
  FileText, 
  Briefcase,
  AlertCircle,
  CheckCircle,
  // eslint-disable-next-line no-unused-vars
  Clock,
  Play,
  Pause,
  // eslint-disable-next-line no-unused-vars
  Eye,
  TrendingUp,
  Sparkles,
  Filter,
  Search,
  // eslint-disable-next-line no-unused-vars
  MoreHorizontal,
  // eslint-disable-next-line no-unused-vars
  ExternalLink,
  MessageSquare,
  Star,
  Award,
  Camera,
  Gift,
  CreditCard
} from 'lucide-react';
import { showConfirmToast } from '../../utils/toastHelpers';

const CampaignManagement = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [markingPayment, setMarkingPayment] = useState({});
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const { data: campaigns, isLoading } = useQuery('company-campaigns', () =>
    api.get('/collaborations/campaigns/').then(res => res.data)
  );

  // Mark payment as completed mutation
  const markPaymentCompletedMutation = useMutation(
    (campaignId) => api.post(`/collaborations/campaigns/${campaignId}/mark-payment-completed/`),
    {
      onSuccess: (response, campaignId) => {
        toast.success('Payment marked as completed');
        queryClient.invalidateQueries('company-campaigns');
        queryClient.invalidateQueries('company-profile');
        setMarkingPayment(prev => ({ ...prev, [campaignId]: false }));
      },
      onError: (error, campaignId) => {
        const errorMessage = error.response?.data?.error || 'Failed to mark payment as completed';
        toast.error(errorMessage);
        setMarkingPayment(prev => ({ ...prev, [campaignId]: false }));
      }
    }
  );

  const handleMarkPaymentCompleted = (campaignId) => {
    if (markingPayment[campaignId]) return;
    
    setMarkingPayment(prev => ({ ...prev, [campaignId]: true }));
    markPaymentCompletedMutation.mutate(campaignId);
  };

  const campaignTypes = [
    { value: 'sponsored_post', label: 'Sponsored Post', icon: MessageSquare, color: 'from-primary-600 to-accent-500', description: 'Promote products through social media posts' },
    { value: 'product_review', label: 'Product Review', icon: Star, color: 'from-accent-500 to-primary-600', description: 'Honest reviews of your products' },
    { value: 'brand_ambassador', label: 'Brand Ambassador', icon: Award, color: 'from-primary-500 to-accent-600', description: 'Long-term brand representation' },
    { value: 'event_coverage', label: 'Event Coverage', icon: Camera, color: 'from-accent-600 to-primary-500', description: 'Live event documentation and promotion' },
    { value: 'giveaway', label: 'Giveaway', icon: Gift, color: 'from-primary-400 to-accent-500', description: 'Contest and giveaway campaigns' },
  ];

  const statusOptions = [
    { value: 'draft', label: 'Draft', icon: FileText, color: 'bg-gray-100 text-gray-900' },
    { value: 'active', label: 'Active', icon: Play, color: 'bg-primary-400/20 text-primary-400' },
    { value: 'paused', label: 'Paused', icon: Pause, color: 'bg-gray-400/20 text-gray-900' },
    { value: 'completed', label: 'Completed', icon: CheckCircle, color: 'bg-accent-400/20 text-accent-400' },
    { value: 'cancelled', label: 'Cancelled', icon: X, color: 'bg-gray-500/20 text-gray-900' },
  ];

  const createCampaignMutation = useMutation(
    (data) => {
      console.log('Creating campaign with data:', data);
      return api.post('/collaborations/campaigns/', data);
    },
    {
      onSuccess: (response) => {
        console.log('Campaign created successfully:', response.data);
        queryClient.invalidateQueries('company-campaigns');
        toast.success('Campaign created successfully!', {
          duration: 3000,
          position: 'top-right',
          icon: '🎉',
          style: {
            background: '#10B981',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
          },
        });
        setShowCreateForm(false);
        reset();
      },
      onError: (error) => {
        console.error('Campaign creation failed:', error);
        console.error('Error response:', error.response?.data);
        
        let errorMessage = 'Failed to create campaign';
        
        if (error.response?.data) {
          if (typeof error.response.data === 'string') {
            errorMessage = error.response.data;
          } else if (error.response.data.detail) {
            errorMessage = error.response.data.detail;
          } else if (error.response.data.message) {
            errorMessage = error.response.data.message;
          } else {
            // Handle field-specific errors
            const fieldErrors = [];
            Object.keys(error.response.data).forEach(field => {
              if (Array.isArray(error.response.data[field])) {
                fieldErrors.push(`${field}: ${error.response.data[field].join(', ')}`);
              } else {
                fieldErrors.push(`${field}: ${error.response.data[field]}`);
              }
            });
            if (fieldErrors.length > 0) {
              errorMessage = fieldErrors.join('; ');
            }
          }
        }
        
        toast.error(errorMessage, {
          duration: 4000,
          position: 'top-right',
          style: {
            background: '#EF4444',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
          },
        });
      }
    }
  );

  const updateCampaignMutation = useMutation(
    ({ id, data }) => api.put(`/collaborations/campaigns/${id}/`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('company-campaigns');
        toast.success('Campaign updated successfully!', {
          duration: 3000,
          position: 'top-right',
          icon: '✅',
          style: {
            background: '#10B981',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
          },
        });
        setEditingCampaign(null);
        reset();
        setShowCreateForm(false);
      },
      onError: (error) => {
        toast.error('Failed to update campaign', {
          duration: 4000,
          position: 'top-right',
          style: {
            background: '#EF4444',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
          },
        });
      }
    }
  );

  const deleteCampaignMutation = useMutation(
    (id) => api.delete(`/collaborations/campaigns/${id}/`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('company-campaigns');
        toast.success('Campaign deleted successfully!', {
          duration: 3000,
          position: 'top-right',
          icon: '🗑️',
          style: {
            background: '#10B981',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
          },
        });
      },
      onError: (error) => {
        toast.error('Failed to delete campaign', {
          duration: 4000,
          position: 'top-right',
          style: {
            background: '#EF4444',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
          },
        });
      }
    }
  );

  // Check if user is a company (after hooks)
  if (user && user.user_type !== 'company') {
    return (
      <div className="saas-background connection-lines flex items-center justify-center">
        <div className="text-center glass-card rounded-2xl shadow-xl p-8">
          <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-900">Only company users can manage campaigns.</p>
        </div>
      </div>
    );
  }

  const getCampaignTypeInfo = (type) => {
    return campaignTypes.find(ct => ct.value === type) || { 
      label: type, 
      icon: '📂', 
      color: 'from-gray-500 to-gray-600',
      description: 'Campaign type'
    };
  };

  const getStatusInfo = (status) => {
    return statusOptions.find(s => s.value === status) || statusOptions[0];
  };

  const getTimeUntilDeadline = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: 'Expired', color: 'text-red-600', urgent: true };
    if (diffDays === 0) return { text: 'Today', color: 'text-red-600', urgent: true };
    if (diffDays === 1) return { text: '1 day left', color: 'text-orange-600', urgent: true };
    if (diffDays <= 7) return { text: `${diffDays} days left`, color: 'text-yellow-600', urgent: false };
    return { text: `${diffDays} days left`, color: 'text-green-600', urgent: false };
  };

  const onSubmit = (data) => {
    console.log('Form submitted with data:', data);
    console.log('Editing campaign:', editingCampaign);
    
    // Transform datetime-local to ISO format
    if (data.deadline) {
      data.deadline = new Date(data.deadline).toISOString();
    }
    
    // Ensure budget is a string with proper decimal format
    if (data.budget) {
      data.budget = parseFloat(data.budget).toFixed(2);
    }
    
    console.log('Transformed data:', data);
    
    if (editingCampaign) {
      updateCampaignMutation.mutate({ id: editingCampaign.id, data });
    } else {
      createCampaignMutation.mutate(data);
    }
  };

  const handleEdit = (campaign) => {
    setEditingCampaign(campaign);
    // Format deadline for datetime-local input
    const formattedCampaign = {
      ...campaign,
      deadline: campaign.deadline ? new Date(campaign.deadline).toISOString().slice(0, 16) : ''
    };
    reset(formattedCampaign);
    setShowCreateForm(true);
  };

  const handleDelete = (campaign) => {
    showConfirmToast(`Are you sure you want to delete "${campaign.title}"? This action cannot be undone.`, () => {
      deleteCampaignMutation.mutate(campaign.id);
    }, "Delete");
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    setEditingCampaign(null);
    reset();
  };

  const filteredCampaigns = campaigns?.results?.filter(campaign => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  if (isLoading) {
    return (
      <div className="saas-background connection-lines flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-12 h-12 mx-auto mb-4"></div>
          <p className="text-gray-900">Loading your campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full py-4 sm:py-8">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                Campaign Management
              </h1>
              <p className="text-sm sm:text-base text-gray-600">Create and manage your influencer marketing campaigns</p>
            </div>
            
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium text-sm sm:text-base whitespace-nowrap"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Create Campaign</span>
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{campaigns?.results?.length || 0}</div>
                  <div className="text-xs sm:text-sm text-gray-600">Total Campaigns</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                    {campaigns?.results?.filter(c => c.status === 'active').length || 0}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">Active</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                    ₹{campaigns?.results?.reduce((sum, c) => sum + parseFloat(c.budget || 0), 0).toLocaleString() || '0'}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">Total Budget</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                    {campaigns?.results?.filter(c => getTimeUntilDeadline(c.deadline).urgent).length || 0}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">Urgent</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showCreateForm && (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex items-center space-x-3 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                {editingCampaign ? <Edit3 className="w-4 h-4 sm:w-5 sm:h-5 text-white" /> : <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Campaign Title */}
                <div className="lg:col-span-2">
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-900 mb-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Campaign Title</span>
                  </label>
                  <input
                    type="text"
                    {...register('title', { required: 'Campaign title is required' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="Enter an engaging campaign title"
                  />
                  {errors.title && (
                    <p className="flex items-center space-x-1 text-red-600 text-sm mt-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.title.message}</span>
                    </p>
                  )}
                </div>

                {/* Campaign Type */}
                <div>
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-900 mb-2">
                    <Briefcase className="w-4 h-4" />
                    <span>Campaign Type</span>
                  </label>
                  <select
                    {...register('campaign_type', { required: 'Campaign type is required' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Select campaign type</option>
                    {campaignTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {errors.campaign_type && (
                    <p className="flex items-center space-x-1 text-red-600 text-sm mt-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.campaign_type.message}</span>
                    </p>
                  )}
                </div>

                {/* Budget */}
                <div>
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-900 mb-2">
                    <DollarSign className="w-4 h-4" />
                    <span>Budget</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('budget', { required: 'Budget is required' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="0.00"
                  />
                  {errors.budget && (
                    <p className="flex items-center space-x-1 text-red-600 text-sm mt-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.budget.message}</span>
                    </p>
                  )}
                </div>

                {/* Deadline */}
                <div>
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-900 mb-2">
                    <Calendar className="w-4 h-4" />
                    <span>Deadline</span>
                  </label>
                  <input
                    type="datetime-local"
                    {...register('deadline', { required: 'Deadline is required' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                  {errors.deadline && (
                    <p className="flex items-center space-x-1 text-red-600 text-sm mt-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.deadline.message}</span>
                    </p>
                  )}
                </div>

                {/* Target Audience */}
                <div>
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-900 mb-2">
                    <Target className="w-4 h-4" />
                    <span>Target Audience</span>
                  </label>
                  <input
                    type="text"
                    {...register('target_audience', { required: 'Target audience is required' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="e.g., Young adults 18-35, Fashion enthusiasts"
                  />
                  {errors.target_audience && (
                    <p className="flex items-center space-x-1 text-red-600 text-sm mt-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.target_audience.message}</span>
                    </p>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-900 mb-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Status</span>
                  </label>
                  <select
                    {...register('status')}
                    defaultValue="draft"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                  >
                    {statusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div className="lg:col-span-2">
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-900 mb-2">
                    <FileText className="w-4 h-4" />
                    <span>Campaign Description</span>
                  </label>
                  <textarea
                    {...register('description', { required: 'Description is required' })}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                    placeholder="Describe your campaign goals, brand message, and what makes it unique..."
                  />
                  {errors.description && (
                    <p className="flex items-center space-x-1 text-red-600 text-sm mt-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.description.message}</span>
                    </p>
                  )}
                </div>

                {/* Requirements */}
                <div className="lg:col-span-2">
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-900 mb-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Requirements</span>
                  </label>
                  <textarea
                    {...register('requirements', { required: 'Requirements are required' })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                    placeholder="List specific requirements for influencers (follower count, demographics, content style, etc.)"
                  />
                  {errors.requirements && (
                    <p className="flex items-center space-x-1 text-red-600 text-sm mt-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.requirements.message}</span>
                    </p>
                  )}
                </div>

                {/* Deliverables */}
                <div className="lg:col-span-2">
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-900 mb-2">
                    <Target className="w-4 h-4" />
                    <span>Deliverables</span>
                  </label>
                  <textarea
                    {...register('deliverables', { required: 'Deliverables are required' })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                    placeholder="Specify what influencers need to deliver (number of posts, stories, videos, etc.)"
                  />
                  {errors.deliverables && (
                    <p className="flex items-center space-x-1 text-red-600 text-sm mt-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.deliverables.message}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4 sm:pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={createCampaignMutation.isLoading || updateCampaignMutation.isLoading}
                  className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-200 disabled:opacity-50 shadow-md hover:shadow-lg font-medium text-sm sm:text-base"
                >
                  {(createCampaignMutation.isLoading || updateCampaignMutation.isLoading) ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{editingCampaign ? 'Updating...' : 'Creating...'}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{editingCampaign ? 'Update Campaign' : 'Create Campaign'}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium text-sm sm:text-base"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Campaign List */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Your Campaigns</h3>
            
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-3 sm:space-x-4">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-10 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none cursor-pointer"
                >
                  <option value="all">All Status</option>
                  {statusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {filteredCampaigns.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {filteredCampaigns.map((campaign) => {
                const typeInfo = getCampaignTypeInfo(campaign.campaign_type);
                const statusInfo = getStatusInfo(campaign.status);
                const timeInfo = getTimeUntilDeadline(campaign.deadline);
                const TypeIcon = typeInfo.icon;
                const StatusIcon = statusInfo.icon;
                
                return (
                  <div key={campaign.id} className="bg-gray-50 rounded-lg border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-shadow duration-300">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br ${typeInfo.color} flex items-center justify-center shadow-md flex-shrink-0`}>
                          <TypeIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-base sm:text-lg font-bold text-gray-900 line-clamp-1">{campaign.title}</h4>
                          <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0 ml-2">
                        <button
                          onClick={() => handleEdit(campaign)}
                          className="p-1.5 sm:p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                          title="Edit campaign"
                        >
                          <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(campaign)}
                          className="p-1.5 sm:p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete campaign"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-700 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 leading-relaxed">
                      {campaign.description}
                    </p>

                    {/* Campaign Type Badge */}
                    <div className="mb-3 sm:mb-4">
                      <span className={`inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-semibold bg-gradient-to-r ${typeInfo.color} text-white shadow-sm`}>
                        <TypeIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">{typeInfo.label}</span>
                        <span className="sm:hidden">{typeInfo.label.split(' ')[0]}</span>
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4">
                      <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200">
                        <div className="flex items-center space-x-1 sm:space-x-2 mb-1">
                          <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-primary-600" />
                          <span className="text-xs sm:text-sm font-semibold text-gray-700">Budget</span>
                        </div>
                        <div className="text-sm sm:text-lg font-bold text-gray-900 truncate">₹{parseFloat(campaign.budget).toLocaleString()}</div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200">
                        <div className="flex items-center space-x-1 sm:space-x-2 mb-1">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-primary-600" />
                          <span className="text-xs sm:text-sm font-semibold text-gray-700">Deadline</span>
                        </div>
                        <div className={`text-xs sm:text-sm font-bold ${timeInfo.color}`}>
                          {timeInfo.text}
                        </div>
                      </div>
                    </div>

                    {/* Payment Status - Show only for completed campaigns */}
                    {campaign.status === 'completed' && (
                      <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200 mb-3 sm:mb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center space-x-1 sm:space-x-2 mb-1">
                              <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 text-primary-600" />
                              <span className="text-xs sm:text-sm font-semibold text-gray-700">Payment Status</span>
                            </div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                              campaign.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {campaign.payment_status === 'paid' ? 'Paid' : 'Pending'}
                            </span>
                          </div>
                          
                          {campaign.payment_status === 'pending' && (
                            <button
                              onClick={() => handleMarkPaymentCompleted(campaign.id)}
                              disabled={markingPayment[campaign.id]}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                                markingPayment[campaign.id]
                                  ? 'bg-gray-400 cursor-not-allowed text-white'
                                  : 'bg-green-600 hover:bg-green-700 text-white'
                              }`}
                            >
                              <CheckCircle className="w-3 h-3" />
                              {markingPayment[campaign.id] ? 'Processing...' : 'Mark Paid'}
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Target Audience */}
                    <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200">
                      <div className="flex items-center space-x-1 sm:space-x-2 mb-1">
                        <Target className="w-3 h-3 sm:w-4 sm:h-4 text-primary-600" />
                        <span className="text-xs sm:text-sm font-semibold text-gray-700">Target Audience</span>
                      </div>
                      <div className="text-xs sm:text-sm text-gray-900 line-clamp-1">{campaign.target_audience}</div>
                    </div>

                    {/* Urgent Badge */}
                    {timeInfo.urgent && (
                      <div className="mt-2 sm:mt-3">
                        <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Urgent
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {searchTerm || statusFilter !== 'all' ? 'No campaigns found' : 'No campaigns yet'}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Create your first campaign to start collaborating with influencers'
                }
              </p>
              {(!searchTerm && statusFilter === 'all') && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Your First Campaign</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignManagement;