import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Instagram, 
  Youtube, 
  Plus, 
  RefreshCw, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Users,
  TrendingUp
} from 'lucide-react';
import { showConfirmToast } from '../../utils/toastHelpers';

const ConnectAccounts = () => {
  // eslint-disable-next-line no-unused-vars
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState({});
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchAccounts();
    fetchStats();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await api.get('/social-media/accounts/');
      setAccounts(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
      toast.error('Failed to load connected accounts');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/social-media/stats/follower/');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleConnectInstagram = () => {
    const clientId = process.env.REACT_APP_INSTAGRAM_CLIENT_ID;
    const redirectUri = encodeURIComponent(window.location.origin + '/auth/instagram/callback');
    const scope = 'user_profile,user_media';
    
    const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
    
    window.location.href = authUrl;
  };

  const handleConnectYouTube = () => {
    const clientId = process.env.REACT_APP_YOUTUBE_CLIENT_ID;
    const redirectUri = encodeURIComponent(window.location.origin + '/auth/youtube/callback');
    const scope = 'https://www.googleapis.com/auth/youtube.readonly';
    
    const authUrl = `https://accounts.google.com/oauth2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&access_type=offline`;
    
    window.location.href = authUrl;
  };

  const handleSync = async (accountId) => {
    setSyncing(prev => ({ ...prev, [accountId]: true }));
    
    try {
      await api.post(`/social-media/accounts/${accountId}/sync/`);
      toast.success('Sync started! This may take a few moments.');
      
      // Refresh data after a delay
      setTimeout(() => {
        fetchAccounts();
        fetchStats();
      }, 3000);
    } catch (error) {
      toast.error('Failed to start sync');
    } finally {
      setSyncing(prev => ({ ...prev, [accountId]: false }));
    }
  };

  const handleDisconnect = async (accountId) => {
    showConfirmToast('Are you sure you want to disconnect this account?', async () => {
      try {
        await api.delete(`/social-media/accounts/${accountId}/disconnect/`);
        toast.success('Account disconnected successfully');
        fetchAccounts();
        fetchStats();
      } catch (error) {
        toast.error('Failed to disconnect account');
      }
    }, "Disconnect");
  };

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'instagram':
        return <Instagram className="w-6 h-6" />;
      case 'youtube':
        return <Youtube className="w-6 h-6" />;
      default:
        return <ExternalLink className="w-6 h-6" />;
    }
  };

  const getPlatformColor = (platform) => {
    switch (platform) {
      case 'instagram':
        return 'from-primary-600 to-accent-500';
      case 'youtube':
        return 'from-accent-500 to-primary-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-primary-400 bg-primary-400/20';
      case 'expired':
        return 'text-gray-900 bg-gray-400/20';
      case 'error':
        return 'text-gray-900 bg-gray-500/20';
      default:
        return 'text-gray-900 bg-gray-400/20';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen saas-background flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-12 h-12 mx-auto mb-4"></div>
          <p className="text-gray-900">Loading your social media accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen saas-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-landing-title text-gradient-primary mb-4">
            Social Media Accounts
          </h1>
          <p className="text-xl text-dark-200 max-w-2xl mx-auto">
            Connect your social media accounts for automatic follower tracking
          </p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="glass-card rounded-2xl p-6 mb-8">
            <h2 className="text-dashboard-section text-gray-900 mb-6">Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-accent-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900 font-data">
                  {stats.total_followers?.toLocaleString() || '0'}
                </div>
                <div className="text-sm text-gray-900">Total Followers</div>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-accent-500 to-primary-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900 font-data">
                  {stats.average_engagement_rate?.toFixed(1) || '0.0'}%
                </div>
                <div className="text-sm text-gray-900">Avg Engagement</div>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900 font-data">
                  {stats.connected_accounts || '0'}
                </div>
                <div className="text-sm text-gray-900">Connected Accounts</div>
              </div>
            </div>
          </div>
        )}

        {/* Connected Accounts */}
        <div className="glass-card rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-dashboard-section text-gray-900">Connected Accounts</h2>
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary px-4 py-2 rounded-xl flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>

          {accounts.length > 0 ? (
            <div className="space-y-4">
              {accounts.map((account) => (
                <div key={account.id} className="glass-card rounded-xl p-6 card-hover">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getPlatformColor(account.platform)} flex items-center justify-center text-white`}>
                        {getPlatformIcon(account.platform)}
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            @{account.username}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(account.status)}`}>
                            {account.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 capitalize">
                          {account.platform} • {account.follower_count?.toLocaleString() || '0'} followers
                        </p>
                        <p className="text-xs text-gray-900">
                          Last sync: {account.last_sync_ago}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleSync(account.id)}
                        disabled={syncing[account.id]}
                        className="btn-primary px-4 py-2 rounded-xl flex items-center space-x-2 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 ${syncing[account.id] ? 'animate-spin' : ''}`} />
                        <span>Sync</span>
                      </button>
                      
                      <button
                        onClick={() => handleDisconnect(account.id)}
                        className="btn-secondary px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-gray-600/50"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Disconnect</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-dark-700/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <ExternalLink className="w-8 h-8 text-dark-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No accounts connected</h3>
              <p className="text-gray-900 mb-6">
                Connect your social media accounts to start tracking followers automatically
              </p>
            </div>
          )}
        </div>

        {/* Connect New Account */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-dashboard-section text-gray-900 mb-6">Connect New Account</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Instagram */}
            <button
              onClick={handleConnectInstagram}
              className="flex items-center space-x-4 p-6 rounded-xl border-2 border-gray-600 hover:border-primary-400 bg-dark-700/30 hover:bg-primary-600/10 transition-all duration-200 transform hover:scale-105"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center text-white">
                <Instagram className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Instagram</h3>
                <p className="text-sm text-gray-900">Connect your Instagram Business account</p>
              </div>
              <Plus className="w-5 h-5 text-gray-900 ml-auto" />
            </button>

            {/* YouTube */}
            <button
              onClick={handleConnectYouTube}
              className="flex items-center space-x-4 p-6 rounded-xl border-2 border-gray-600 hover:border-primary-400 bg-dark-700/30 hover:bg-primary-600/10 transition-all duration-200 transform hover:scale-105"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-500 to-primary-600 flex items-center justify-center text-white">
                <Youtube className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">YouTube</h3>
                <p className="text-sm text-gray-900">Connect your YouTube channel</p>
              </div>
              <Plus className="w-5 h-5 text-gray-900 ml-auto" />
            </button>
          </div>

          <div className="mt-6 p-4 bg-primary-600/10 border border-primary-400/30 rounded-xl">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-primary-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-900">
                <p className="font-medium mb-1">Requirements:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-900">
                  <li>Instagram: Business or Creator account required</li>
                  <li>YouTube: Channel must be public</li>
                  <li>Follower counts update automatically every hour</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectAccounts;
