import { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
// eslint-disable-next-line no-unused-vars
import { Users, Star, DollarSign, Search, Filter, SortAsc, Grid3X3, List, Instagram, RefreshCw, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import ContactInfluencerModal from './ContactInfluencerModal';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const InfluencerSearch = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('search');
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    ordering: '-followers_count'
  });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedInfluencer, setSelectedInfluencer] = useState(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  
  // Instagram lookup states
  const [instagramUsername, setInstagramUsername] = useState('');
  const [instagramLoading, setInstagramLoading] = useState(false);
  const [instagramData, setInstagramData] = useState(null);
  const [instagramError, setInstagramError] = useState('');
  const [lookupHistory, setLookupHistory] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const { data: influencers, isLoading, error } = useQuery(
    ['influencers', { ...filters, search: debouncedSearch }],
    async () => {
      const params = new URLSearchParams();
      const searchFilters = { ...filters, search: debouncedSearch };
      
      Object.entries(searchFilters).forEach(([key, value]) => {
        if (value) {
          if (key === 'search') {
            params.append('search', value);
          } else if (key === 'ordering') {
            params.append('ordering', value);
          } else {
            params.append(key, value);
          }
        }
      });
      
      const url = `/auth/influencers/?${params}`;
      const response = await api.get(url);
      const data = response.data;
      return data.results && Array.isArray(data.results) ? data : { results: data, count: data.length };
    },
    { keepPreviousData: true }
  );

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleContactInfluencer = (influencer) => {
    if (user?.user_type !== 'company') {
      toast.error('Only companies can contact influencers');
      return;
    }
    setSelectedInfluencer(influencer);
    setIsContactModalOpen(true);
  };

  const closeContactModal = () => {
    setIsContactModalOpen(false);
    setSelectedInfluencer(null);
  };

  // Instagram lookup functionality
  const handleInstagramLookup = async (e) => {
    e.preventDefault();
    
    if (!instagramUsername.trim()) {
      toast.error('Please enter an Instagram username');
      return;
    }

    setInstagramLoading(true);
    setInstagramError('');
    setInstagramData(null);

    try {
      const response = await api.post('/social-media/lookup/instagram/', {
        username: instagramUsername.trim(),
        method: 'api'
      });

      if (response.data.success) {
        setInstagramData(response.data.data);
        
        // Add to lookup history
        const newLookup = {
          username: response.data.username,
          timestamp: new Date(),
          follower_count: response.data.data.follower_count
        };
        
        setLookupHistory(prev => [newLookup, ...prev.slice(0, 4)]); // Keep last 5 searches
        
        toast.success(`Found @${response.data.username}!`);
      } else {
        setInstagramError(response.data.error || 'User not found');
        toast.error('User not found or unable to fetch data');
      }
    } catch (error) {
      console.error('Instagram lookup failed:', error);
      const errorMessage = error.response?.data?.error || 'Failed to lookup user';
      setInstagramError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setInstagramLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num?.toLocaleString() || '0';
  };

  const getDataSourceInfo = (source) => {
    switch (source) {
      case 'api':
        return { text: 'Official API', color: 'text-primary-400', icon: CheckCircle };
      case 'web_scraping':
        return { text: 'Web Data', color: 'text-yellow-400', icon: AlertCircle };
      case 'mock':
        return { text: 'Demo Data', color: 'text-gray-900', icon: AlertCircle };
      default:
        return { text: 'Unknown', color: 'text-gray-900', icon: AlertCircle };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen saas-background flex items-center justify-center">
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-500 mx-auto mb-4"></div>
          <p className="text-dark-200">Loading influencers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen saas-background flex items-center justify-center">
        <div className="glass-card rounded-2xl p-8 text-center max-w-md">
          <p className="text-gray-900 mb-4">Error loading influencers: {error.message}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary px-6 py-3 rounded-xl"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen saas-background">
      <div className="w-full">
        <div className="flex items-center justify-center w-full">
          <div className="text-center w-full px-4 sm:px-6 lg:px-8 pt-2 pb-2">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-dark-100 mb-1">
              Discover Amazing <span className="text-gradient-primary">Influencers</span>
            </h1>
            <p className="text-xs sm:text-sm text-dark-200">
              Connect with top creators and build meaningful partnerships that drive results
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="glass-card rounded-xl sm:rounded-2xl p-2.5 sm:p-3 mb-3 sm:mb-4">
          <div className="flex space-x-1 bg-gray-100/50 rounded-xl p-1 mb-2.5 sm:mb-3 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab('search')}
              className={`flex-shrink-0 flex items-center space-x-1 sm:space-x-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg font-medium text-xs transition-all duration-200 ${
                activeTab === 'search'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-900 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <Search className="w-3 h-3" />
              <span>Search</span>
            </button>
            <button
              onClick={() => setActiveTab('instagram')}
              className={`flex-shrink-0 flex items-center space-x-1 sm:space-x-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg font-medium text-xs transition-all duration-200 ${
                activeTab === 'instagram'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-900 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <Instagram className="w-3 h-3" />
              <span>Instagram Lookup</span>
            </button>
          </div>

          {activeTab === 'search' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
              <div className="lg:col-span-2 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-dark-300" />
                </div>
                <input
                  type="text"
                  placeholder="Search influencers..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="form-input w-full pl-9 pr-3 py-2 rounded-xl text-sm"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-4 w-4 text-dark-300" />
                </div>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="form-input w-full pl-9 pr-8 py-2 rounded-xl appearance-none cursor-pointer text-sm"
                >
                  <option value="">All Categories</option>
                  <option value="fashion">Fashion</option>
                  <option value="beauty">Beauty</option>
                  <option value="fitness">Fitness</option>
                  <option value="food">Food</option>
                  <option value="travel">Travel</option>
                  <option value="tech">Technology</option>
                  <option value="lifestyle">Lifestyle</option>
                  <option value="gaming">Gaming</option>
                </select>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SortAsc className="h-4 w-4 text-dark-300" />
                </div>
                <select
                  value={filters.ordering}
                  onChange={(e) => handleFilterChange('ordering', e.target.value)}
                  className="form-input w-full pl-9 pr-8 py-2 rounded-xl appearance-none cursor-pointer text-sm"
                >
                  <option value="-followers_count">Most Followers</option>
                  <option value="followers_count">Least Followers</option>
                  <option value="-engagement_rate">High Engagement</option>
                  <option value="engagement_rate">Low Engagement</option>
                  <option value="rate_per_post">Low Rate</option>
                  <option value="-rate_per_post">High Rate</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'instagram' && (
            <div className="space-y-6">
              <form onSubmit={handleInstagramLookup} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-900 text-sm">@</span>
                    </div>
                    <input
                      type="text"
                      value={instagramUsername}
                      onChange={(e) => setInstagramUsername(e.target.value)}
                      placeholder="Enter Instagram username"
                      className="form-input w-full pl-8 pr-4 py-3 rounded-xl"
                      disabled={instagramLoading}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={instagramLoading || !instagramUsername.trim()}
                    className="btn-primary px-6 py-3 rounded-xl flex items-center space-x-2 disabled:opacity-50"
                  >
                    {instagramLoading ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Search className="w-5 h-5" />
                    )}
                    <span>{instagramLoading ? 'Looking up...' : 'Lookup'}</span>
                  </button>
                </div>
                
                <div className="text-sm text-gray-900">
                  <p>Enter any public Instagram username to see their follower count and profile information.</p>
                </div>
              </form>

              {/* Error Message */}
              {instagramError && (
                <div className="glass-card rounded-xl p-4 border border-red-400/30 bg-red-400/10">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <div>
                      <p className="text-red-400 font-medium">Lookup Failed</p>
                      <p className="text-red-300 text-sm">{instagramError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Instagram User Data */}
              {instagramData && (
                <div className="glass-card rounded-xl p-6">
                  <div className="flex items-start space-x-6 mb-6">
                    {/* Profile Picture */}
                    <div className="w-20 h-20 bg-gradient-to-br from-primary-600 to-accent-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      {instagramData.profile_picture_url ? (
                        <img 
                          src={instagramData.profile_picture_url} 
                          alt={`@${instagramData.username}`}
                          className="w-full h-full rounded-xl object-cover"
                        />
                      ) : (
                        <Instagram className="w-10 h-10 text-white" />
                      )}
                    </div>

                    {/* Profile Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h2 className="text-2xl font-bold text-gray-900">@{instagramData.username}</h2>
                        {instagramData.is_verified && (
                          <CheckCircle className="w-6 h-6 text-primary-400" />
                        )}
                        {instagramData.is_business && (
                          <span className="px-2 py-1 bg-primary-400/20 text-primary-400 text-xs font-medium rounded-full">
                            Business
                          </span>
                        )}
                      </div>
                      
                      {instagramData.display_name && (
                        <p className="text-lg text-gray-900 mb-2">{instagramData.display_name}</p>
                      )}
                      
                      {instagramData.bio && (
                        <p className="text-gray-900 mb-3">{instagramData.bio}</p>
                      )}
                      
                      {instagramData.external_url && (
                        <a 
                          href={instagramData.external_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-2 text-primary-400 hover:text-primary-300 text-sm"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>{instagramData.external_url}</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-dark-700/30 rounded-xl p-4 text-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-accent-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-xl font-bold text-gray-900 font-data">
                        {formatNumber(instagramData.follower_count)}
                      </div>
                      <div className="text-sm text-gray-900">Followers</div>
                    </div>

                    <div className="bg-dark-700/30 rounded-xl p-4 text-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-primary-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-xl font-bold text-gray-900 font-data">
                        {formatNumber(instagramData.following_count)}
                      </div>
                      <div className="text-sm text-gray-900">Following</div>
                    </div>

                    <div className="bg-dark-700/30 rounded-xl p-4 text-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <Instagram className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-xl font-bold text-gray-900 font-data">
                        {formatNumber(instagramData.posts_count)}
                      </div>
                      <div className="text-sm text-gray-900">Posts</div>
                    </div>

                    <div className="bg-dark-700/30 rounded-xl p-4 text-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-accent-600 to-primary-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <Star className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-xl font-bold text-gray-900 font-data">
                        {instagramData.engagement_rate || '0.0'}%
                      </div>
                      <div className="text-sm text-gray-900">Engagement</div>
                    </div>
                  </div>

                  {/* Data Source Info */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="flex items-center space-x-2">
                      {(() => {
                        const sourceInfo = getDataSourceInfo(instagramData.data_source);
                        const IconComponent = sourceInfo.icon;
                        return (
                          <>
                            <IconComponent className={`w-4 h-4 ${sourceInfo.color}`} />
                            <span className={`text-sm ${sourceInfo.color}`}>
                              Data Source: {sourceInfo.text}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                    <div className="text-sm text-gray-900">
                      Updated: {new Date(instagramData.last_updated * 1000).toLocaleString()}
                    </div>
                  </div>

                  {/* Warnings */}
                  {instagramData.warning && (
                    <div className="mt-4 p-3 bg-yellow-400/10 border border-yellow-400/30 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm text-yellow-300">{instagramData.warning}</span>
                      </div>
                    </div>
                  )}

                  {instagramData.note && (
                    <div className="mt-4 p-3 bg-gray-600/20 border border-gray-500/30 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-gray-900" />
                        <span className="text-sm text-gray-900">{instagramData.note}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Search History */}
              {lookupHistory.length > 0 && (
                <div className="glass-card rounded-xl p-6">
                  <h3 className="text-dashboard-section text-gray-900 mb-4">Recent Lookups</h3>
                  <div className="space-y-3">
                    {lookupHistory.map((lookup, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-dark-700/30 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Instagram className="w-5 h-5 text-primary-400" />
                          <span className="text-gray-900">@{lookup.username}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-900">
                            {formatNumber(lookup.follower_count)} followers
                          </span>
                          <button
                            onClick={() => {
                              setInstagramUsername(lookup.username);
                              handleInstagramLookup({ preventDefault: () => {} });
                            }}
                            className="text-primary-400 hover:text-primary-300 text-sm"
                          >
                            Lookup Again
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {activeTab === 'search' && (
          <>
            {influencers && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                <div className="glass-card rounded-xl px-4 py-2.5">
                  <div className="flex items-center space-x-3">
                    <Users className="h-4 w-4 text-accent-500" />
                    <span className="text-base font-semibold text-dark-100">
                      {influencers.count || influencers.results?.length || 0}
                    </span>
                    <span className="text-sm text-dark-200">
                      influencer{(influencers.count || influencers.results?.length || 0) !== 1 ? 's' : ''} found
                    </span>
                  </div>
                </div>

                <div className="glass-card rounded-xl p-1 flex">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                      viewMode === 'grid'
                        ? 'bg-accent-500 text-white shadow-sm'
                        : 'text-dark-200 hover:text-dark-100 hover:bg-dark-700/30'
                    }`}
                  >
                    <Grid3X3 className="h-4 w-4" />
                    <span className="text-sm font-medium">Grid</span>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                      viewMode === 'list'
                        ? 'bg-accent-500 text-white shadow-sm'
                        : 'text-dark-200 hover:text-dark-100 hover:bg-dark-700/30'
                    }`}
                  >
                    <List className="h-4 w-4" />
                    <span className="text-sm font-medium">List</span>
                  </button>
                </div>
              </div>
            )}

            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" 
              : "space-y-6"
            }>
              {influencers?.results?.map((influencer) => (
                <InfluencerCard 
                  key={influencer.id} 
                  influencer={influencer} 
                  viewMode={viewMode}
                  onContact={handleContactInfluencer}
                  onViewProfile={() => navigate(`/influencer/${influencer.id}`)}
                  userType={user?.user_type}
                />
              ))}
            </div>

            {influencers?.results?.length === 0 && (
              <div className="text-center py-16">
                <div className="glass-card rounded-2xl p-12 max-w-md mx-auto">
                  <div className="w-24 h-24 bg-dark-700/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users className="h-12 w-12 text-dark-300" />
                  </div>
                  <h3 className="text-xl font-semibold text-dark-100 mb-2">No influencers found</h3>
                  <p className="text-dark-200 mb-6">
                    Try adjusting your search criteria or browse all categories
                  </p>
                  <button
                    onClick={() => {
                      setFilters({ search: '', category: '', ordering: '-followers_count' });
                      setDebouncedSearch('');
                    }}
                    className="btn-primary px-6 py-3 rounded-xl"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'instagram' && (
          <div className="text-center py-16">
            <div className="glass-card rounded-2xl p-12 max-w-md mx-auto">
              <div className="w-24 h-24 bg-gradient-to-br from-primary-600 to-accent-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Instagram className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-dark-100 mb-2">Instagram Lookup</h3>
              <p className="text-dark-200 mb-6">
                Use the lookup form above to search for any Instagram username and get their follower count and profile information.
              </p>
              <div className="text-sm text-gray-900">
                <p className="mb-2">How it works:</p>
                <ul className="list-disc list-inside space-y-1 text-left">
                  <li>Enter any public Instagram username</li>
                  <li>Get real-time follower count and engagement data</li>
                  <li>View profile information and statistics</li>
                  <li>Results are cached for better performance</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <ContactInfluencerModal
        influencer={selectedInfluencer}
        isOpen={isContactModalOpen}
        onClose={closeContactModal}
      />
    </div>
  );
};

const InfluencerCard = ({ influencer, viewMode, onContact, onViewProfile, userType }) => {
  const formatFollowers = (count) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count?.toString() || '0';
  };

  const getEngagementColor = (rate) => {
    if (rate >= 5) return 'text-primary-400 bg-primary-400/10';
    if (rate >= 3) return 'text-gray-900 bg-gray-400/10';
    return 'text-gray-900 bg-gray-500/10';
  };

  const handleCardClick = (e) => {
    // Don't navigate if clicking on the contact button
    if (e.target.closest('button')) {
      return;
    }
    onViewProfile();
  };

  if (viewMode === 'list') {
    return (
      <div 
        onClick={handleCardClick}
        className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 p-6 cursor-pointer"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-white bg-gradient-to-br from-primary-500 to-accent-400 w-full h-full flex items-center justify-center">
                  {influencer.username ? influencer.username.charAt(0).toUpperCase() : 'U'}
                </span>
                {influencer.profile_image && (
                  <img
                    src={influencer.profile_image}
                    alt={influencer.username}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}
              </div>
              {influencer.followers_count > 10000 && (
                <div className="absolute -top-1 -right-1 bg-white p-1 rounded-full shadow-lg">
                  <Star className="h-3.5 w-3.5 text-primary-600 fill-current" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-gray-900 mb-1 truncate">
                {influencer.username}
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-900 capitalize">
                {influencer.category || 'Creator'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-1.5 text-gray-900">
              <Users className="h-3.5 w-3.5 text-primary-600" />
              <span className="text-xs font-semibold">{formatFollowers(influencer.followers_count)}</span>
              <span className="text-xs text-gray-900">followers</span>
            </div>
            {influencer.engagement_rate > 0 && (
              <div className="flex items-center gap-2">
                <Star className="h-3.5 w-3.5 text-gray-900" />
                <span className={`px-2 py-1 rounded-md text-xs font-medium ${getEngagementColor(influencer.engagement_rate)}`}>
                  {influencer.engagement_rate || 0}%
                </span>
              </div>
            )}
            {influencer.rate_per_post > 0 && (
              <div className="flex items-center space-x-1 text-xs text-primary-600 bg-primary-50 rounded-lg px-2 py-1">
                <span className="font-semibold">
                  ₹{influencer.rate_per_post >= 1000
                    ? `${(influencer.rate_per_post / 1000).toFixed(1)}K`
                    : influencer.rate_per_post.toLocaleString()}
                </span>
                <span className="text-gray-900">per post</span>
              </div>
            )}
          </div>

          <div className="flex-shrink-0 ml-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onContact(influencer);
              }}
              disabled={userType !== 'company'}
              className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 min-w-[140px] justify-center ${
                userType === 'company'
                  ? 'bg-primary-600 hover:bg-primary-700 text-white transform hover:scale-[1.02]'
                  : 'bg-gray-600/20 text-gray-900 cursor-not-allowed'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>{userType === 'company' ? 'Contact' : 'Company Only'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={handleCardClick}
      className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 h-full flex flex-col group cursor-pointer"
    >
      <div className="relative w-full aspect-square overflow-hidden bg-gradient-to-br from-primary-100 to-accent-100">
        <div className="w-full h-full bg-gradient-to-br from-primary-500 to-accent-400 flex items-center justify-center text-white text-3xl font-bold">
          {influencer.username ? influencer.username.charAt(0).toUpperCase() : 'U'}
        </div>
        {influencer.profile_image && (
          <img
            src={influencer.profile_image}
            alt={influencer.username}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        )}
        {influencer.followers_count > 10000 && (
          <div className="absolute top-1.5 right-1.5 bg-white/95 backdrop-blur-sm p-0.5 rounded-full shadow-lg">
            <Star className="h-2.5 w-2.5 text-primary-600 fill-current" />
          </div>
        )}
      </div>

      <div className="p-2 flex-1 flex flex-col">
        <h3 className="text-xs font-bold text-gray-900 mb-0.5 truncate group-hover:text-primary-600 transition-colors">
          {influencer.username}
        </h3>
        <div className="flex items-center justify-between mb-1">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-900 capitalize">
            {influencer.category || 'Creator'}
          </span>
        </div>
        <div className="flex items-center space-x-0.5 text-gray-900 mb-1.5">
          <Users className="h-2.5 w-2.5 text-primary-600" />
          <span className="text-[10px] font-semibold">
            {formatFollowers(influencer.followers_count)}
          </span>
          <span className="text-[10px] text-gray-900">followers</span>
        </div>
        
        {influencer.rate_per_post > 0 && (
          <div className="mt-auto flex items-center space-x-0.5 text-[10px] text-primary-600 bg-primary-50 rounded-md px-1.5 py-0.5 mb-1.5">
            <span className="font-semibold">
              ₹{influencer.rate_per_post >= 1000
                ? `${(influencer.rate_per_post / 1000).toFixed(1)}K`
                : influencer.rate_per_post.toLocaleString()}
            </span>
            <span className="text-gray-900">per post</span>
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onContact(influencer);
          }}
          disabled={userType !== 'company'}
          className={`w-full py-1.5 px-2 rounded-md font-medium text-[10px] transition-all duration-200 flex items-center justify-center gap-1 ${
            userType === 'company'
              ? 'bg-primary-600 hover:bg-primary-700 text-white hover:shadow-lg transform hover:scale-[1.02]'
              : 'bg-gray-600/20 text-gray-900 cursor-not-allowed'
          }`}
        >
          {userType === 'company' ? (
            <>
              <Users className="h-3 w-3" />
              <span>Contact</span>
            </>
          ) : (
            <>
              <Users className="h-3 w-3" />
              <span>Company Only</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default InfluencerSearch;