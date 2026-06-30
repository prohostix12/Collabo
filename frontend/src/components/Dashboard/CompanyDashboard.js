import React, { useState } from 'react';
import { useQuery } from 'react-query';
import api from '../../services/api';
import { DollarSign, Calendar, TrendingUp, Building2, Target, Search, UserCheck, Plus, ArrowUpRight, BarChart3, Headphones } from 'lucide-react';
import CompanyProfile from '../Profile/CompanyProfile';
import CampaignManagement from '../Campaigns/CampaignManagement';
import InfluencerSearch from '../Influencers/InfluencerSearch';
import CollaborationManagement from '../Collaborations/CollaborationManagement';
import CompanyAnalytics from '../Analytics/CompanyAnalytics';
import CompanyHero from '../Company/CompanyHero';
import CompanySupportTickets from '../Support/CompanySupportTickets';

const CompanyDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: profile } = useQuery('company-profile', () =>
    api.get('/auth/company-profile/').then(res => res.data)
  );

  // eslint-disable-next-line no-unused-vars
  const { data: earnings } = useQuery('company-earnings', () =>
    api.get('/payments/earnings/').then(res => res.data)
  );

  const { data: campaigns } = useQuery('company-campaigns', () =>
    api.get('/collaborations/campaigns/').then(res => res.data)
  );

  // Handle tab change with scroll to top
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const tabs = [
    { id: 'overview', label: 'Home', icon: TrendingUp },
    { id: 'profile', label: 'Company Profile', icon: Building2 },
    { id: 'campaigns', label: 'My Campaigns', icon: Target },
    { id: 'influencers', label: 'Find Influencers', icon: Search },
    { id: 'collaborations', label: 'Collaborations', icon: UserCheck },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'support', label: 'Support', icon: Headphones },
  ];

  const stats = [
    {
      name: 'Total Spent',
      value: `₹${profile?.total_spend?.toLocaleString() || 0}`,
      icon: DollarSign,
      gradient: 'from-primary-600 to-primary-500',
      bgGradient: 'from-primary-50 to-primary-100',
      change: '+15%',
      changeType: 'positive'
    },
    {
      name: 'Pending Payments',
      value: `₹${profile?.pending_payment?.toLocaleString() || 0}`,
      icon: Calendar,
      gradient: 'from-yellow-500 to-yellow-600',
      bgGradient: 'from-yellow-50 to-yellow-100',
      change: '-3%',
      changeType: 'negative'
    },
    {
      name: 'Active Campaigns',
      value: campaigns?.results?.filter(c => c.status === 'active').length || 0,
      icon: TrendingUp,
      gradient: 'from-primary-500 to-primary-600',
      bgGradient: 'from-primary-50 to-primary-100',
      change: '+25%',
      changeType: 'positive'
    },
    {
      name: 'Total Campaigns',
      value: campaigns?.results?.length || 0,
      icon: Target,
      gradient: 'from-gray-600 to-gray-700',
      bgGradient: 'from-gray-50 to-gray-100',
      change: '+10%',
      changeType: 'positive'
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Compact Header Section with Navigation - Matching Influencer Style */}
      <div className="relative bg-gradient-to-br from-primary-50 via-white to-accent-50 border-b border-gray-200 overflow-hidden w-full sticky top-0 z-10 shadow-sm">
        <div className="relative w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-2">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Welcome Section */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center text-white text-xs sm:text-sm font-bold shadow-lg">
                {profile?.company_name?.charAt(0)?.toUpperCase() || 'C'}
              </div>
              <div>
                <h1 className="text-xs sm:text-sm lg:text-base font-bold text-gray-900">
                  Welcome, {profile?.company_name || 'Company'}
                </h1>
                <p className="text-xs text-gray-600 flex items-center space-x-1">
                  <span className="hidden sm:inline text-xs">Manage your campaigns</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-semibold bg-primary-100 text-primary-700">
                    Business
                  </span>
                </p>
              </div>
            </div>

            {/* Center: Navigation Tabs */}
            <nav className="flex-1 flex items-center justify-center overflow-x-auto scrollbar-hide">
              <div className="flex space-x-2 min-w-max">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`flex items-center space-x-1.5 px-2 sm:px-2.5 py-2.5 font-medium text-sm transition-all duration-200 border-b-2 whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'border-primary-600 text-primary-600'
                          : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                      <span className="hidden md:inline">{tab.label}</span>
                      <span className="md:hidden">{tab.label.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* Right: Badge */}
            <div className="flex items-center flex-shrink-0">
              <div className="bg-white border border-gray-200 px-2 py-1 rounded-lg text-xs font-medium text-gray-700 shadow-sm">
                <Building2 className="w-3 h-3 inline mr-1 text-primary-600" />
                <span className="hidden sm:inline">Company</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Premium Hero Section - Full Width, No Padding */}
          <CompanyHero company={profile} />
          
          {/* Rest of Overview Content - With Padding */}
          <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-6 sm:py-8">
            <div className="space-y-6 sm:space-y-8">
              {/* Clean Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {stats.map((stat, index) => {
                const StatIcon = stat.icon;
                return (
                  <div
                    key={stat.name}
                    className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-shadow duration-300"
                  >
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className={`p-2 sm:p-3 rounded-lg bg-gradient-to-br ${stat.gradient}`}>
                        <StatIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div className={`text-xs font-semibold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full ${
                        stat.changeType === 'positive' 
                          ? 'text-primary-600 bg-primary-50' 
                          : 'text-gray-700 bg-gray-100'
                      }`}>
                        {stat.change}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 uppercase tracking-wide">
                        {stat.name}
                      </p>
                      <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                        {stat.value}
                      </p>
                      <p className="text-xs text-gray-600">
                        vs last month
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Recent Campaigns Card */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">Recent Campaigns</h3>
                  <button
                    onClick={() => handleTabChange('campaigns')}
                    className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center space-x-1 transition-colors duration-200"
                  >
                    <span>View All</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
                
                {campaigns?.results?.length > 0 ? (
                  <div className="space-y-3">
                    {campaigns.results.slice(0, 5).map((campaign) => (
                      <div
                        key={campaign.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200 border border-gray-200"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Target className="w-5 h-5 text-white" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">
                              {campaign.title}
                            </p>
                            <p className="text-sm text-gray-600">
                              Budget: <span className="font-semibold text-primary-600">₹{campaign.budget}</span>
                            </p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 text-xs rounded-lg font-semibold whitespace-nowrap ${
                          campaign.status === 'active' 
                            ? 'bg-primary-100 text-primary-700'
                            : campaign.status === 'draft'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {campaign.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Target className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-900 text-lg font-semibold mb-2">No campaigns yet</p>
                    <p className="text-gray-600 text-sm mb-6">Create your first campaign to start collaborating</p>
                    <button
                      onClick={() => handleTabChange('campaigns')}
                      className="inline-flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Campaign</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Actions Card */}
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => handleTabChange('campaigns')}
                    className="w-full bg-primary-600 text-white p-4 rounded-lg hover:bg-primary-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
                  >
                    <Plus className="w-5 h-5 mx-auto mb-1" />
                    <span>Create Campaign</span>
                  </button>
                  
                  <button
                    onClick={() => handleTabChange('influencers')}
                    className="w-full bg-gray-700 text-white p-4 rounded-lg hover:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
                  >
                    <Search className="w-5 h-5 mx-auto mb-1" />
                    <span>Find Influencers</span>
                  </button>
                  
                  <button
                    onClick={() => handleTabChange('collaborations')}
                    className="w-full bg-gray-800 text-white p-4 rounded-lg hover:bg-gray-900 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
                  >
                    <UserCheck className="w-5 h-5 mx-auto mb-1" />
                    <span>Manage Collaborations</span>
                  </button>
                </div>

                {/* Performance Metrics */}
                <div className="mt-6 p-4 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg border border-primary-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-900">Success Rate</span>
                    <span className="text-lg font-bold text-primary-600">92%</span>
                  </div>
                  <div className="w-full bg-white rounded-full h-2.5">
                    <div className="bg-gradient-to-r from-primary-500 to-primary-600 h-2.5 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                  <p className="text-xs text-gray-700 mt-2">Excellent performance this month</p>
                </div>

                {/* ROI Card */}
                <div className="mt-4 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-semibold text-gray-700">Average ROI</span>
                      <p className="text-3xl font-bold text-primary-600">4.2x</p>
                    </div>
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-primary-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </>
        )}

        {activeTab === 'analytics' && (
          <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-6 sm:py-8">
            <CompanyAnalytics />
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-6 sm:py-8">
            <CompanyProfile />
          </div>
        )}
        
        {activeTab === 'campaigns' && (
          <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-6 sm:py-8">
            <CampaignManagement />
          </div>
        )}
        
        {activeTab === 'influencers' && (
          <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-6 sm:py-8">
            <InfluencerSearch />
          </div>
        )}
        
        {activeTab === 'collaborations' && (
          <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-6 sm:py-8">
            <CollaborationManagement />
          </div>
        )}

        {activeTab === 'support' && (
          <CompanySupportTickets />
        )}
    </div>
  );
};

export default CompanyDashboard;