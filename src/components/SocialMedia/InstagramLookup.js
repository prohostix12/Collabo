import React, { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Search, 
  Instagram, 
  Users, 
  TrendingUp, 
  ExternalLink,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Eye,
  Heart,
  // eslint-disable-next-line no-unused-vars
  MessageCircle
} from 'lucide-react';

const InstagramLookup = () => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);

  const handleLookup = async (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast.error('Please enter an Instagram username');
      return;
    }

    setLoading(true);
    setError('');
    setUserData(null);

    try {
      const response = await api.post('/social-media/lookup/instagram/', {
        username: username.trim(),
        method: 'api' // or 'scraping' for web scraping method
      });

      if (response.data.success) {
        setUserData(response.data.data);
        
        // Add to search history
        const newSearch = {
          username: response.data.username,
          timestamp: new Date(),
          follower_count: response.data.data.follower_count
        };
        
        setSearchHistory(prev => [newSearch, ...prev.slice(0, 4)]); // Keep last 5 searches
        
        toast.success(`Found @${response.data.username}!`);
      } else {
        setError(response.data.error || 'User not found');
        toast.error('User not found or unable to fetch data');
      }
    } catch (error) {
      console.error('Instagram lookup failed:', error);
      const errorMessage = error.response?.data?.error || 'Failed to lookup user';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen saas-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-accent-500 rounded-xl flex items-center justify-center mx-auto mb-6">
            <Instagram className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-landing-title text-gradient-primary mb-4">
            Instagram Lookup
          </h1>
          <p className="text-xl text-dark-200 max-w-2xl mx-auto">
            Get follower count and profile information for any Instagram username
          </p>
        </div>

        {/* Search Form */}
        <div className="glass-card rounded-2xl p-6 mb-8">
          <form onSubmit={handleLookup} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-900 text-sm">@</span>
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter Instagram username"
                  className="form-input w-full pl-8 pr-4 py-3 rounded-xl"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !username.trim()}
                className="btn-primary px-6 py-3 rounded-xl flex items-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
                <span>{loading ? 'Looking up...' : 'Lookup'}</span>
              </button>
            </div>
            
            <div className="text-sm text-gray-900">
              <p>Enter any public Instagram username to see their follower count and profile information.</p>
            </div>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="glass-card rounded-xl p-4 mb-8 border border-red-400/30 bg-red-400/10">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div>
                <p className="text-red-400 font-medium">Lookup Failed</p>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* User Data */}
        {userData && (
          <div className="glass-card rounded-2xl p-6 mb-8">
            <div className="flex items-start space-x-6 mb-6">
              {/* Profile Picture */}
              <div className="w-20 h-20 bg-gradient-to-br from-primary-600 to-accent-500 rounded-xl flex items-center justify-center flex-shrink-0">
                {userData.profile_picture_url ? (
                  <img 
                    src={userData.profile_picture_url} 
                    alt={`@${userData.username}`}
                    className="w-full h-full rounded-xl object-cover"
                  />
                ) : (
                  <Instagram className="w-10 h-10 text-white" />
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900">@{userData.username}</h2>
                  {userData.is_verified && (
                    <CheckCircle className="w-6 h-6 text-primary-400" />
                  )}
                  {userData.is_business && (
                    <span className="px-2 py-1 bg-primary-400/20 text-primary-400 text-xs font-medium rounded-full">
                      Business
                    </span>
                  )}
                </div>
                
                {userData.display_name && (
                  <p className="text-lg text-gray-900 mb-2">{userData.display_name}</p>
                )}
                
                {userData.bio && (
                  <p className="text-gray-900 mb-3">{userData.bio}</p>
                )}
                
                {userData.external_url && (
                  <a 
                    href={userData.external_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 text-primary-400 hover:text-primary-300 text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>{userData.external_url}</span>
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
                  {formatNumber(userData.follower_count)}
                </div>
                <div className="text-sm text-gray-900">Followers</div>
              </div>

              <div className="bg-dark-700/30 rounded-xl p-4 text-center">
                <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-primary-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <div className="text-xl font-bold text-gray-900 font-data">
                  {formatNumber(userData.following_count)}
                </div>
                <div className="text-sm text-gray-900">Following</div>
              </div>

              <div className="bg-dark-700/30 rounded-xl p-4 text-center">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <div className="text-xl font-bold text-gray-900 font-data">
                  {formatNumber(userData.posts_count)}
                </div>
                <div className="text-sm text-gray-900">Posts</div>
              </div>

              <div className="bg-dark-700/30 rounded-xl p-4 text-center">
                <div className="w-10 h-10 bg-gradient-to-br from-accent-600 to-primary-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div className="text-xl font-bold text-gray-900 font-data">
                  {userData.engagement_rate || '0.0'}%
                </div>
                <div className="text-sm text-gray-900">Engagement</div>
              </div>
            </div>

            {/* Data Source Info */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div className="flex items-center space-x-2">
                {(() => {
                  const sourceInfo = getDataSourceInfo(userData.data_source);
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
                Updated: {new Date(userData.last_updated * 1000).toLocaleString()}
              </div>
            </div>

            {/* Warnings */}
            {userData.warning && (
              <div className="mt-4 p-3 bg-yellow-400/10 border border-yellow-400/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-yellow-300">{userData.warning}</span>
                </div>
              </div>
            )}

            {userData.note && (
              <div className="mt-4 p-3 bg-gray-600/20 border border-gray-500/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-gray-900" />
                  <span className="text-sm text-gray-900">{userData.note}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search History */}
        {searchHistory.length > 0 && (
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-dashboard-section text-gray-900 mb-4">Recent Searches</h3>
            <div className="space-y-3">
              {searchHistory.map((search, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-dark-700/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Instagram className="w-5 h-5 text-primary-400" />
                    <span className="text-gray-900">@{search.username}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-900">
                      {formatNumber(search.follower_count)} followers
                    </span>
                    <button
                      onClick={() => {
                        setUsername(search.username);
                        handleLookup({ preventDefault: () => {} });
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

        {/* Info Card */}
        <div className="glass-card rounded-2xl p-6 mt-8">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-primary-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-900">
              <p className="font-medium mb-2">How it works:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-900">
                <li>Enter any public Instagram username to get their follower count</li>
                <li>Data is fetched using official Instagram APIs when possible</li>
                <li>Results are cached for better performance</li>
                <li>Only public profile information is accessible</li>
                <li>Rate limits apply to prevent abuse</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstagramLookup;