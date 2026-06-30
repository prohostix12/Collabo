import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  DollarSign, 
  Search, 
  Filter, 
  TrendingUp, 
  // eslint-disable-next-line no-unused-vars
  ArrowRight, 
  Building2, 
  // eslint-disable-next-line no-unused-vars
  Sparkles,
  Timer,
  AlertCircle
} from 'lucide-react';

const CampaignList = () => {
  const [filters, setFilters] = useState({
    search: '',
    campaign_type: '',
    ordering: '-created_at'
  });
  // eslint-disable-next-line no-unused-vars
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  const queryClient = useQueryClient();
  const { user } = useAuth();

  const campaignTypes = [
    { value: 'sponsored_post', label: 'Sponsored Post', icon: '📱', color: 'from-primary-600 to-accent-500' },
    { value: 'product_review', label: 'Product Review', icon: '⭐', color: 'from-accent-500 to-primary-600' },
    { value: 'brand_ambassador', label: 'Brand Ambassador', icon: '👑', color: 'from-primary-500 to-accent-600' },
    { value: 'event_coverage', label: 'Event Coverage', icon: '📸', color: 'from-accent-600 to-primary-500' },
    { value: 'giveaway', label: 'Giveaway', icon: '🎁', color: 'from-primary-400 to-accent-500' },
  ];

  const { data: campaigns, isLoading } = useQuery(
    ['campaigns', filters],
    () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      return api.get(`/collaborations/campaigns/?${params}`).then(res => res.data);
    }
  );

  const applyToCampaignMutation = useMutation(
    (data) => api.post('/collaborations/requests/', data),
    {
      onSuccess: () => {
        toast.success('🎉 Application submitted successfully!');
        queryClient.invalidateQueries('collaboration-requests');
      },
      onError: (error) => {
        console.error('Apply to campaign failed:', error);
        let errorMessage = 'Failed to apply to campaign';
        
        if (error.response?.status === 403) {
          errorMessage = 'Only influencers can apply to campaigns. Companies should create their own campaigns.';
        } else if (error.response?.data?.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        }
        
        toast.error(errorMessage);
      }
    }
  );

  // eslint-disable-next-line no-unused-vars
  const handleApply = (campaign) => {
    setSelectedCampaign(campaign);
    const proposedRate = prompt(`💰 Enter your proposed rate for "${campaign.title}":\n\nCampaign Budget: ₹${campaign.budget}\nSuggested Range: ₹${Math.floor(campaign.budget * 0.3)} - ₹${Math.floor(campaign.budget * 0.8)}`);
    
    if (proposedRate && !isNaN(proposedRate) && parseFloat(proposedRate) > 0) {
      applyToCampaignMutation.mutate({
        campaign: campaign.id,
        proposed_rate: parseFloat(proposedRate),
        message: `Hi! I'm excited about your "${campaign.title}" campaign. I believe my content style and audience would be a perfect match for this collaboration. Looking forward to working together! 🚀`
      });
    } else if (proposedRate !== null) {
      toast.error('Please enter a valid rate amount');
    }
    setSelectedCampaign(null);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getCampaignTypeInfo = (type) => {
    return campaignTypes.find(ct => ct.value === type) || { 
      label: type, 
      icon: '📂', 
      color: 'from-gray-500 to-gray-600' 
    };
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

  if (isLoading) {
    return (
      <div className="min-h-screen saas-background flex items-center justify-center">
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="spinner w-12 h-12 mx-auto mb-4"></div>
          <p className="text-dark-200">Discovering amazing campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen saas-background py-8">
      <div className="w-full px-6 lg:px-12 xl:px-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-landing-title text-gradient-primary mb-4">
            Available Campaigns
          </h1>
          <p className="text-xl text-dark-200 max-w-2xl mx-auto">
            Discover exciting collaboration opportunities with top brands
          </p>
        </div>

        {/* Filters Section */}
        <div className="glass-card rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-dark-300 w-5 h-5" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="form-input w-full pl-12 pr-4 py-3 rounded-xl"
              />
            </div>

            {/* Campaign Type Filter */}
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-dark-300 w-5 h-5" />
              <select
                value={filters.campaign_type}
                onChange={(e) => handleFilterChange('campaign_type', e.target.value)}
                className="form-input w-full pl-12 pr-8 py-3 rounded-xl appearance-none cursor-pointer"
              >
                <option value="">All Types</option>
                {campaignTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="relative">
              <TrendingUp className="absolute left-4 top-1/2 transform -translate-y-1/2 text-dark-300 w-5 h-5" />
              <select
                value={filters.ordering}
                onChange={(e) => handleFilterChange('ordering', e.target.value)}
                className="form-input w-full pl-12 pr-8 py-3 rounded-xl appearance-none cursor-pointer"
              >
                <option value="-created_at">Newest</option>
                <option value="created_at">Oldest</option>
                <option value="-budget">High Budget</option>
                <option value="budget">Low Budget</option>
                <option value="deadline">Urgent</option>
              </select>
            </div>
          </div>

          {/* Quick Filter Tags */}
          <div className="flex flex-wrap gap-3 mt-6">
            {campaignTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => handleFilterChange('campaign_type', filters.campaign_type === type.value ? '' : type.value)}
                className={`flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  filters.campaign_type === type.value
                    ? 'bg-accent-500 text-white shadow-lg'
                    : 'bg-dark-700/30 text-dark-200 hover:bg-dark-700/50'
                }`}
              >
                <span className="mr-2">{type.icon}</span>
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Campaign Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns?.results?.map((campaign, index) => {
            const typeInfo = getCampaignTypeInfo(campaign.campaign_type);
            const timeInfo = getTimeUntilDeadline(campaign.deadline);
            
            return (
              <div
                key={campaign.id}
                className="glass-card rounded-xl overflow-hidden card-hover group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Card Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center text-white text-xl flex-shrink-0">
                        {typeInfo.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-md mb-1 ${
                          campaign.status === 'active' 
                            ? 'bg-primary-400/20 text-primary-400'
                            : 'bg-gray-600/20 text-gray-800'
                        }`}>
                          {campaign.status === 'active' ? 'Active' : campaign.status}
                        </span>
                        <p className="text-xs text-gray-800 capitalize">{typeInfo.label}</p>
                      </div>
                    </div>
                    {timeInfo.urgent && (
                      <span className="px-2 py-1 text-xs font-medium bg-red-400/20 text-red-400 rounded-md">
                        Urgent
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-dashboard-card text-gray-900 mb-3 line-clamp-2">
                    {campaign.title}
                  </h3>
                  
                  <p className="text-gray-800 text-sm line-clamp-2 leading-relaxed">
                    {campaign.description}
                  </p>
                </div>

                {/* Card Content */}
                <div className="px-6 pb-6">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-dark-700/30 rounded-lg p-3">
                      <div className="flex items-center gap-1 mb-1">
                        <DollarSign className="w-3 h-3 text-primary-400" />
                        <span className="text-xs text-gray-800">Budget</span>
                      </div>
                      <span className="text-sm font-data text-gray-900">₹{campaign.budget?.toLocaleString()}</span>
                    </div>
                    
                    <div className="bg-dark-700/30 rounded-lg p-3">
                      <div className="flex items-center gap-1 mb-1">
                        <Timer className="w-3 h-3 text-gray-800" />
                        <span className="text-xs text-gray-800">Deadline</span>
                      </div>
                      <span className={`text-xs font-medium ${timeInfo.color.replace('text-', 'text-')}`}>
                        {timeInfo.text}
                      </span>
                    </div>
                  </div>

                  {/* Company */}
                  <div className="flex items-center gap-2 mb-4 p-2 bg-dark-700/20 rounded-lg">
                    <Building2 className="w-4 h-4 text-gray-800 flex-shrink-0" />
                    <span className="text-sm text-gray-900 truncate">{campaign.company_name}</span>
                  </div>

                  {/* Action Button */}
                  {user?.user_type === 'influencer' ? (
                    <div className="w-full py-4 px-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                      <p className="text-sm font-semibold text-gray-700 mb-1">Invitation Only</p>
                      <p className="text-[10px] text-gray-500 uppercase font-black leading-tight">
                        Only brands can initiate collaborations. Complete your profile to get noticed!
                      </p>
                    </div>
                  ) : user?.user_type === 'company' ? (
                    <div className="text-center py-3 bg-gray-600/20 rounded-lg">
                      <div className="flex items-center justify-center mb-1">
                        <Building2 className="w-4 h-4 text-gray-800 mr-2" />
                        <span className="text-sm font-medium text-gray-800">Company Campaign</span>
                      </div>
                      <p className="text-xs text-gray-800">Only influencers can apply</p>
                    </div>
                  ) : (
                    <div className="text-center py-3 bg-primary-600/20 rounded-lg">
                      <div className="flex items-center justify-center mb-1">
                        <AlertCircle className="w-4 h-4 text-primary-400 mr-2" />
                        <span className="text-sm font-medium text-primary-400">Login Required</span>
                      </div>
                      <p className="text-xs text-primary-300">Please log in as an influencer</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {campaigns?.results?.length === 0 && (
          <div className="text-center py-16">
            <div className="glass-card rounded-2xl p-12 max-w-md mx-auto">
              <div className="w-24 h-24 bg-dark-700/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-12 h-12 text-dark-300" />
              </div>
              <h3 className="text-page-title text-dark-100 mb-2">No campaigns found</h3>
              <p className="text-dark-200 mb-6">
                We couldn't find any campaigns matching your criteria. Try adjusting your filters or check back later for new opportunities.
              </p>
              <button
                onClick={() => setFilters({ search: '', campaign_type: '', ordering: '-created_at' })}
                className="btn-primary px-6 py-3 rounded-xl"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Stats Footer */}
        {campaigns?.results?.length > 0 && (
          <div className="mt-12 glass-card rounded-2xl p-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-section-title text-data text-accent-500">{campaigns.results.length}</div>
                <div className="text-sm text-dark-200">Available Campaigns</div>
              </div>
              <div>
                <div className="text-section-title text-data text-primary-400">
                  ₹{campaigns.results.reduce((sum, c) => sum + parseFloat(c.budget || 0), 0).toLocaleString()}
                </div>
                <div className="text-sm text-dark-200">Total Budget</div>
              </div>
              <div>
                <div className="text-section-title text-data text-gray-800">
                  {new Set(campaigns.results.map(c => c.company_name)).size}
                </div>
                <div className="text-sm text-dark-200">Unique Brands</div>
              </div>
              <div>
                <div className="text-section-title text-data text-gray-800">
                  {campaigns.results.filter(c => getTimeUntilDeadline(c.deadline).urgent).length}
                </div>
                <div className="text-sm text-dark-200">Urgent Campaigns</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignList;