import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { DollarSign, Users, Calendar, Star, TrendingUp, Award, Heart, BarChart3, Link2, X, Search, CheckCircle2, Copy, ShoppingBag, Globe, Download, Film, Image, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProfileSetup from '../Profile/InfluencerProfile';
import CollaborationList from '../Collaborations/CollaborationList';
import InfluencerAnalytics from '../Analytics/InfluencerAnalytics';
import InfluencerHero from '../Influencer/InfluencerHero';
import ApprovalStatusAlert from './ApprovalStatusAlert';
import ApprovalSuccessModal from './ApprovalSuccessModal';
import { useAuth } from '../../contexts/AuthContext';

const InfluencerDashboard = ({ onClose } = {}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Affiliate Marketing States
  const [referralsData, setReferralsData] = useState({
    referrals: [],
    affiliate_code: '',
    downline_count: 0,
    summary: { total_referrals: 0, total_clicks: 0, total_conversions: 0, total_earned: 0, direct_pending: 0, upline_earned: 0, upline_pending: 0, total_combined: 0 }
  });
  const [pollIntervalId, setPollIntervalId] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [collabModalProduct, setCollabModalProduct] = useState(null);
  const [collabMedia, setCollabMedia] = useState([]);
  const [collabMediaLoading, setCollabMediaLoading] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(null);
  const [generatedLink, setGeneratedLink] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [customDiscount, setCustomDiscount] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchReferrals = async () => {
    try {
      const res = await api.get('/ecommerce/reviews/my-referrals/');
      // Ensure newest referrals first based on created_at or id
      const sorted = (res.data.referrals || []).sort((a, b) => {
        const da = new Date(a.created_at || 0);
        const db = new Date(b.created_at || 0);
        return db - da; // descending
      });
      setReferralsData({
        referrals: sorted,
        affiliate_code: res.data.affiliate_code || '',
        downline_count: res.data.downline_count || 0,
        summary: res.data.summary || {}
      });
    } catch (err) {
      console.error("Error fetching referrals:", err);
    }
  };

  const fetchAllProducts = async () => {
    try {
      const res = await api.get('/ecommerce/products/?page_size=1000');
      const results = res.data.results || res.data;
      setProducts(results);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  useEffect(() => {
    fetchAllProducts();
  }, []);

  useEffect(() => {
    let interval;
    if (activeTab === 'affiliate') {
      fetchReferrals();
      // Poll every 5 seconds to update stats ASAP
      interval = setInterval(() => {
        fetchReferrals();
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTab]);

  // eslint-disable-next-line no-unused-vars
  const handleCreateReferral = async (e) => {
    e.preventDefault();
    if (!selectedProductId) {
      toast.error("Please select a product");
      return;
    }
    if (!comment.trim()) {
      toast.error("Please enter a comment/review");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/ecommerce/reviews/', {
        product: Number(selectedProductId),
        rating: Number(rating),
        comment: comment,
        custom_discount_percent: customDiscount ? Number(customDiscount) : null
      });
      // Reset form
      setSelectedProductId('');
      setRating(5);
      setComment('');
      setCustomDiscount('');
      toast.success("Affiliate review and link created successfully!");
    } catch (err) {
      console.error("Error creating referral:", err);
      toast.error(err.response?.data?.error || "Failed to create affiliate review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const { data: profile } = useQuery('influencer-profile', () =>
    api.get('/auth/influencer-profile/').then(res => res.data)
  );

  const { data: earnings } = useQuery('earnings', () =>
    api.get('/payments/earnings/').then(res => res.data)
  );

  const { data: collaborations } = useQuery('collaborations', () =>
    api.get('/collaborations/collaborations/').then(res => res.data)
  );

  // Real‑time polling for affiliate stats when on the affiliate tab
  useEffect(() => {
    if (activeTab === 'affiliate') {
      fetchReferrals(); // initial fetch
      const intervalId = setInterval(fetchReferrals, 30000); // every 30 seconds
      return () => clearInterval(intervalId);
    }
  }, [activeTab]);

  useEffect(() => {
    if (collabModalProduct?.id) {
      setCollabMedia([]);
      setCollabMediaLoading(true);
      api.get(`/ecommerce/products/${collabModalProduct.id}/influencer-media/`)
        .then(res => setCollabMedia(res.data || []))
        .catch(() => setCollabMedia([]))
        .finally(() => setCollabMediaLoading(false));
    }
  }, [collabModalProduct?.id]);

  // Handle tab change with scroll to top
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const tabs = [
    { id: 'overview', label: 'Home', icon: TrendingUp },
    { id: 'affiliate', label: 'Affiliated Marketing', icon: Link2 },
    { id: 'profile', label: 'Profile', icon: Users },
    { id: 'collaborations', label: 'My Collaborations', icon: Heart },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const stats = [
    {
      name: 'Total Earnings',
      value: `₹${earnings?.total_earnings || 0}`,
      icon: DollarSign,
      gradient: 'from-primary-600 to-primary-500',
      bgGradient: 'from-primary-50 to-primary-100',
      change: '+12%',
      changeType: 'positive'
    },
    {
      name: 'Pending Earnings',
      value: `₹${earnings?.pending_earnings || 0}`,
      icon: Calendar,
      gradient: 'from-gray-500 to-gray-600',
      bgGradient: 'from-gray-50 to-gray-100',
      change: '+5%',
      changeType: 'positive'
    },
    {
      name: 'Followers',
      value: profile?.followers_count?.toLocaleString() || 0,
      icon: Users,
      gradient: 'from-primary-500 to-primary-600',
      bgGradient: 'from-primary-50 to-primary-100',
      change: '+8%',
      changeType: 'positive'
    },
    {
      name: 'Engagement Rate',
      value: `${profile?.engagement_rate || 0}%`,
      icon: Star,
      gradient: 'from-gray-600 to-gray-700',
      bgGradient: 'from-gray-50 to-gray-100',
      change: '+2%',
      changeType: 'positive'
    },
  ];

  const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))].sort();
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
    const matchesSearch = searchQuery ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    return matchesCategory && matchesSearch;
  });

  const handleBuy = (product) => {
    // Open the product details page in the marketplace, replacing the dashboard in browser history
    // so the back button returns to wherever the user was before the dashboard (not back here)
    window.location.replace(`/?pid=${product.id}`);
  };

  const renderCatalog = () => (
    <div className="mb-8 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-gray-900">Explore Catalog to Collab</h3>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 focus:outline-none text-xs font-bold text-gray-700"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          </div>
          <div className="w-full sm:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 focus:outline-none text-xs font-bold text-gray-700"
            >
              <option value="">-- All Categories --</option>
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow group cursor-pointer" onClick={() => window.location.replace(`/?pid=${p.id}`)}>
            <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
              <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-black text-violet-650 shadow-sm">
                {p.link_discount_percent ?? 0}% Discount for Link
              </div>
            </div>
            <div className="p-4 flex flex-col flex-1">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{p.brand}</div>
              <h4 className="font-bold text-gray-900 text-sm line-clamp-2 mb-2 flex-1">{p.name}</h4>
              <div className="flex items-end justify-between mt-auto pt-4">
                <div>
                  {p.discount_price && p.discount_price < p.price ? (
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400 line-through font-bold">₹{parseFloat(p.price).toLocaleString()}</span>
                      <span className="text-sm font-black text-gray-900">₹{parseFloat(p.discount_price).toLocaleString()}</span>
                    </div>
                  ) : (
                    <span className="text-sm font-black text-gray-900">₹{parseFloat(p.price).toLocaleString()}</span>
                  )}
                </div>
                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => handleBuy(p)}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg flex items-center transition-colors"
                  >
                    Buy
                  </button>
                  {(() => {
                    const existingRef = referralsData.referrals?.find(r => r.product === p.id || r.product?.id === p.id);
                    if (existingRef) {
                      return (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(existingRef.referral_link);
                            toast.success("Link copied!");
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Copy Link
                        </button>
                      );
                    } else {
                      return (
                        <button
                          onClick={() => {
                            setCollabModalProduct(p);
                            setGeneratedLink(null);
                            setRating(5);
                            setComment('');
                            setCustomDiscount('');
                            setCustomPrice('');
                          }}
                          className="bg-gray-900 hover:bg-gray-800 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                        >
                          <Link2 className="w-3.5 h-3.5" />
                          Collab
                        </button>
                      );
                    }
                  })()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Compact Header Section with Navigation */}
      <div className="relative bg-gradient-to-br from-primary-50 via-white to-accent-50 border-b border-gray-200 overflow-hidden w-full sticky top-0 z-10 shadow-sm">
        <div className="relative w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-2">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Welcome Section */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center text-white text-xs sm:text-sm font-bold shadow-lg">
                {profile?.user?.first_name?.charAt(0)?.toUpperCase() || 'I'}
              </div>
              <div>
                <h1 className="text-xs sm:text-sm lg:text-base font-bold text-gray-900">
                  Welcome, {profile?.user?.first_name || 'Influencer'}
                </h1>
                <p className="text-xs text-gray-600 flex items-center space-x-1">
                  <span className="hidden sm:inline text-xs">Manage your collaborations</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-semibold bg-primary-100 text-primary-700">
                    Pro
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

            {/* Right: Landing Page + CollaborCart */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => onClose ? onClose() : navigate('/', { replace: true })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 shadow-sm"
                style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">CollaborCart</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Approval Status Alert - Show on all tabs */}
      {user && (user.approval_status === 'pending' || user.approval_status === 'rejected') && (
        <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 pt-6">
          <ApprovalStatusAlert 
            status={user.approval_status}
          />
        </div>
      )}

      {activeTab === 'overview' && (
        <>
          {/* Premium Hero Section - Full Width, No Padding */}
          {(() => {
            // Handle profile image - check if it's base64 or URL
            let profileImageUrl = null;
            if (profile?.profile_image) {
              // If it's already a data URL, use as-is
              if (profile.profile_image.startsWith('data:')) {
                profileImageUrl = profile.profile_image;
              }
              // If it's a full URL, use as-is
              else if (profile.profile_image.startsWith('http')) {
                profileImageUrl = profile.profile_image;
              }
              // If it's a relative path, prepend API URL
              else if (profile.profile_image.startsWith('/')) {
                profileImageUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${profile.profile_image}`;
              }
              // Otherwise, it might be just a filename
              else {
                profileImageUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/media/profiles/${profile.profile_image}`;
              }
            }
            
            const heroData = {
              username: profile?.user?.username || 'Creative Influencer',
              tagline: `${profile?.category || 'Lifestyle'} Content Creator`,
              bio: profile?.bio || 'Passionate about creating authentic content that inspires and connects.',
              profile_image: profileImageUrl,
              category: profile?.category,
              followers_count: profile?.followers_count || 0,
            };
            
            return (
              <InfluencerHero 
                influencer={heroData}
                onViewAnalytics={() => handleTabChange('analytics')}
                onViewProfile={() => handleTabChange('profile')}
              />
            );
          })()}
          
          {/* Rest of Overview Content - With Padding */}
          <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-6 sm:py-8">
            <div className="space-y-6 sm:space-y-8 animate-fadeIn">
              {/* Modern SaaS Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {stats.map((stat, index) => {
                const StatIcon = stat.icon;
                return (
                  <div
                    key={stat.name}
                    className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-shadow duration-300"
                  >
                    {/* Card Header */}
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

                    {/* Card Content */}
                    <div className="flex-1">
                      <h3 className="text-xs sm:text-sm font-medium text-gray-600 mb-1 uppercase tracking-wide">
                        {stat.name}
                      </h3>
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

            {/* Modern Activity and Quick Actions Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Activity */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">Recent Activity</h3>
                  <button className="text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors duration-200">
                    View All
                  </button>
                </div>
                
                {collaborations?.results?.length > 0 ? (
                  <div className="space-y-4">
                    {collaborations.results.slice(0, 5).map((collaboration, index) => (
                      <div
                        key={collaboration.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 border border-gray-200"
                      >
                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-accent-500 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Heart className="w-5 h-5 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900 line-clamp-1 text-base">
                              {collaboration.campaign_title}
                            </p>
                            <p className="text-sm text-gray-600">
                              Status: <span className={`font-medium ${
                                collaboration.status === 'accepted' ? 'text-primary-600' :
                                collaboration.status === 'pending' ? 'text-gray-700' :
                                'text-gray-700'
                              }`}>
                                {collaboration.status}
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-lg font-bold text-primary-600">
                            ₹{collaboration.final_rate}
                          </span>
                          <p className="text-xs text-gray-600">Rate</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-900 text-lg font-semibold">No recent activity</p>
                    <p className="text-gray-600 text-sm">Start applying to campaigns to see your activity here</p>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h3>
                <div className="space-y-4">
                  <button
                    onClick={() => handleTabChange('analytics')}
                    className="w-full bg-primary-600 text-white p-4 rounded-lg hover:bg-primary-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
                  >
                    <BarChart3 className="w-5 h-5 mx-auto mb-2" />
                    <span>View Analytics</span>
                  </button>
                  
                  <button
                    onClick={() => handleTabChange('profile')}
                    className="w-full bg-gray-700 text-white p-4 rounded-lg hover:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
                  >
                    <Users className="w-5 h-5 mx-auto mb-2" />
                    <span>Update Profile</span>
                  </button>
                  
                  <button
                    onClick={() => handleTabChange('collaborations')}
                    className="w-full bg-gray-800 text-white p-4 rounded-lg hover:bg-gray-900 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
                  >
                    <Heart className="w-5 h-5 mx-auto mb-2" />
                    <span>My Collaborations</span>
                  </button>
                </div>

                {/* Profile Completion */}
                <div className="mt-6 p-4 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg border border-primary-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-900">Profile Completion</span>
                    <span className="text-sm font-bold text-primary-600">85%</span>
                  </div>
                  <div className="w-full bg-white rounded-full h-2">
                    <div className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                  <p className="text-xs text-gray-700 mt-2">Complete your profile to get more opportunities!</p>
                </div>
              </div>
            </div>
            </div>

            {/* Catalog placed in Home Tab */}
            <div className="mt-8">
              {renderCatalog()}
            </div>
          </div>
        </>
      )}

      {activeTab === 'analytics' && (
        <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-6 sm:py-8">
          <InfluencerAnalytics />
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-6 sm:py-8">
          <ProfileSetup />
        </div>
      )}
      
      {activeTab === 'collaborations' && (
        <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-6 sm:py-8">
          <CollaborationList />
        </div>
      )}

      {activeTab === 'affiliate' && (
        <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-6 sm:py-8">
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Link2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Affiliated Marketing</h2>
                  <p className="text-sm text-gray-600">Earn commissions by promoting products</p>
                </div>
              </div>

              {/* Recruit Link Banner */}
              {referralsData.affiliate_code && (
                <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-bold text-emerald-800">Your Affiliate Recruitment Link</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">{referralsData.downline_count} recruited</span>
                  </div>
                  <p className="text-xs text-emerald-700 mb-2">Share this link. When someone you recruit makes a sale, you earn 50% of their commission.</p>
                  <div className="flex items-center gap-2 bg-white border border-emerald-200 px-3 py-1.5 rounded-lg">
                    <span className="text-[11px] font-mono text-gray-600 truncate flex-1">
                      {window.location.origin}/register?affiliate={referralsData.affiliate_code}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/register?affiliate=${referralsData.affiliate_code}`);
                        toast.success('Recruitment link copied!');
                      }}
                      className="text-[10px] font-black text-emerald-600 hover:underline uppercase shrink-0"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}

              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-4 border border-primary-200">
                  <div className="text-sm text-gray-600 mb-1">Total Clicks</div>
                  <div className="text-3xl font-bold text-gray-900">{referralsData.summary?.total_clicks || 0}</div>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">Orders</div>
                  <div className="text-3xl font-bold text-gray-900">{referralsData.summary?.total_conversions || 0}</div>
                </div>
                <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-4 border border-primary-200">
                  <div className="text-sm text-gray-600 mb-1">Direct Earnings</div>
                  <div className="text-3xl font-bold text-gray-900">₹{(referralsData.summary?.total_earned || 0).toLocaleString()}</div>
                  {(referralsData.summary?.direct_pending || 0) > 0 && (
                    <div className="text-[11px] text-amber-600 font-semibold mt-1">
                      + ₹{(referralsData.summary.direct_pending).toLocaleString()} pending
                    </div>
                  )}
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-4 border border-emerald-200">
                  <div className="text-sm text-emerald-700 mb-1">Upline Bonus</div>
                  <div className="text-3xl font-bold text-emerald-700">₹{(referralsData.summary?.upline_earned || 0).toLocaleString()}</div>
                  {(referralsData.summary?.upline_pending || 0) > 0 && (
                    <div className="text-[11px] text-amber-600 font-semibold mt-1">
                      + ₹{(referralsData.summary.upline_pending).toLocaleString()} pending
                    </div>
                  )}
                  <div className="text-[10px] text-emerald-600 mt-0.5">From your recruits' sales</div>
                </div>
              </div>

              {/* Product Catalog Grid */}
              {renderCatalog()}

              {/* Affiliate Links Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Your Affiliate Links</h3>
                
                {referralsData.referrals && referralsData.referrals.length > 0 ? (
                  <div className="space-y-4">
                    {referralsData.referrals.map((ref) => (
                      <div key={ref.id} className="p-5 bg-gray-50 rounded-xl border border-gray-250 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                            <img src={ref.product_image} className="max-h-full object-cover" alt="product" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm">{ref.product_name}</h4>
                            <div className="flex items-center gap-1 my-0.5">
                              {[1,2,3,4,5].map((s) => (
                                <Star key={s} className={`w-3 h-3 ${s <= ref.rating ? 'fill-orange-500 text-orange-500' : 'text-gray-300'}`} />
                              ))}
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-1 italic">"{ref.comment}"</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col md:items-end gap-2 w-full md:w-auto">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] text-gray-700 bg-gray-200 px-2 py-0.5 rounded-full font-bold">Clicks: {ref.clicks}</span>
                            <span className="text-[10px] text-emerald-700 bg-emerald-105 px-2 py-0.5 rounded-full font-bold">Sales: {ref.conversions}</span>
                            <span className="text-[10px] text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full font-bold">Earned: ₹{(ref.earned_commission || 0).toLocaleString()}{(ref.pending_commission || 0) > 0 ? ` + ₹${Number(ref.pending_commission).toLocaleString()} pending` : ''}</span>
                          </div>
                          <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-xl justify-between w-full md:w-80 shadow-sm">
                            <span className="text-[10px] font-mono text-gray-600 truncate w-52">{ref.referral_link}</span>
                            <button 
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(ref.referral_link);
                                toast.success("Link copied!");
                              }}
                              className="text-[10px] font-black text-primary-600 hover:underline uppercase shrink-0"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Empty State */
                  <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <Link2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">No Affiliate Links Yet</h4>
                    <p className="text-gray-600 mb-4 max-w-md mx-auto">
                      Select a product from the catalog form above, submit a rating and write an endorsement to get your unique referral links.
                    </p>
                  </div>
                )}
              </div>

              {/* How It Works */}
              <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">How Affiliate Marketing Works</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Create Link</h4>
                      <p className="text-sm text-gray-600">Generate unique affiliate links for products</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Share & Promote</h4>
                      <p className="text-sm text-gray-600">Share links with your audience on social media</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Earn Commission</h4>
                      <p className="text-sm text-gray-600">Get paid when people purchase through your link</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collab Modal */}
      {collabModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-slideUp border border-gray-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
              <h3 className="text-base font-black text-gray-900">Create Affiliate Link</h3>
              <button
                onClick={() => { setCollabModalProduct(null); setGeneratedLink(null); setShareMenuOpen(null); }}
                className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <img src={collabModalProduct.image} alt={collabModalProduct.name} className="w-12 h-12 object-cover rounded-lg shadow-sm" />
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{collabModalProduct.name}</h4>
                  <p className="text-xs text-gray-500 font-bold">{collabModalProduct.brand}</p>
                  <p className="text-xs font-black text-violet-650">{collabModalProduct.link_discount_percent ?? 0}% Discount for Link</p>
                </div>
              </div>

              {/* Collab Media from Admin */}
              {collabMediaLoading ? (
                <div className="flex items-center justify-center py-3">
                  <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  <span className="ml-2 text-xs text-gray-500">Loading media...</span>
                </div>
              ) : collabMedia.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-primary-500" />
                    Promo Content ({collabMedia.length} files)
                  </h4>
                  <div className="space-y-2">
                    {collabMedia.map((m) => (
                      <div key={m.id} className="relative flex items-center gap-3 p-2 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                          {m.media_type === 'video' ? (
                            <>
                              <video src={m.file} className="w-full h-full object-cover" muted />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <Film className="w-4 h-4 text-white" />
                              </div>
                            </>
                          ) : (
                            <img src={m.file} alt={m.title || 'Media'} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-gray-800 truncate">{m.title || (m.media_type === 'video' ? 'Video' : 'Photo')}</p>
                          <p className="text-[9px] text-gray-400 uppercase font-semibold">{m.media_type}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={async () => {
                              try {
                                const response = await fetch(m.file);
                                const blob = await response.blob();
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = m.title || `${m.media_type === 'video' ? 'video' : 'image'}_${m.id}.${m.file.split('.').pop().split('?')[0] || 'mp4'}`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                window.URL.revokeObjectURL(url);
                              } catch (err) {
                                window.open(m.file, '_blank');
                              }
                            }}
                            className="p-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-600 transition-colors" title="Download">
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setShareMenuOpen(shareMenuOpen === m.id ? null : m.id)}
                            className="p-1.5 rounded-lg bg-primary-100 hover:bg-primary-200 text-primary-600 transition-colors" title="Share">
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {/* Share dropdown */}
                        {shareMenuOpen === m.id && (() => {
                          const refLink = generatedLink || `${window.location.origin}/?pid=${collabModalProduct.id}`;
                          const videoUrl = m.file;
                          const productName = collabModalProduct.name;
                          const shareText = `${productName}\n\nWatch the product video: ${videoUrl}\n\nShop now with my link: ${refLink}`;

                          const handleNativeShare = async () => {
                            try {
                              const response = await fetch(videoUrl);
                              const blob = await response.blob();
                              const file = new File([blob], m.title || 'video.mp4', { type: blob.type });
                              if (navigator.canShare && navigator.canShare({ files: [file] })) {
                                await navigator.share({ title: productName, text: `Shop now: ${refLink}`, files: [file] });
                                return true;
                              }
                            } catch (err) { /* fallback below */ }
                            return false;
                          };

                          return (
                        <div className="absolute right-2 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-2 space-y-1 min-w-[180px]">
                          {typeof navigator.share === 'function' && (
                            <button
                              onClick={async () => {
                                const shared = await handleNativeShare();
                                if (!shared) {
                                  navigator.clipboard.writeText(shareText);
                                  toast.success('Video link & referral link copied!');
                                }
                                setShareMenuOpen(null);
                              }}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-purple-50 text-xs font-bold text-gray-700 transition-colors w-full"
                            >
                              <Share2 className="w-4 h-4 text-purple-500" />
                              Share with Video
                            </button>
                          )}
                          <a
                            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`}
                            target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-green-50 text-xs font-bold text-gray-700 transition-colors w-full"
                          >
                            <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                            WhatsApp
                          </a>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(shareText);
                              toast.success('Video link & affiliate link copied! Paste in Instagram story/post.');
                              setShareMenuOpen(null);
                            }}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-pink-50 text-xs font-bold text-gray-700 transition-colors w-full"
                          >
                            <svg className="w-4 h-4 text-pink-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                            Instagram
                          </button>
                          <a
                            href={`https://www.youtube.com/upload`}
                            target="_blank" rel="noopener noreferrer"
                            onClick={() => {
                              navigator.clipboard.writeText(shareText);
                              toast.success('Video link & affiliate link copied! Paste in YouTube description.');
                            }}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 text-xs font-bold text-gray-700 transition-colors w-full"
                          >
                            <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                            YouTube
                          </a>
                          <a
                            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(refLink)}&quote=${encodeURIComponent(`Check out ${productName}!\nWatch: ${videoUrl}`)}`}
                            target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 text-xs font-bold text-gray-700 transition-colors w-full"
                          >
                            <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                            Facebook
                          </a>
                          <hr className="border-gray-100" />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(shareText);
                              toast.success('All links copied to clipboard!');
                              setShareMenuOpen(null);
                            }}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-xs font-bold text-gray-700 transition-colors w-full"
                          >
                            <Copy className="w-4 h-4 text-gray-400" />
                            Copy All Links
                          </button>
                        </div>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                  <p className="text-[9px] text-gray-400 mt-1.5">Download or share these assets on your social platforms with your referral link.</p>
                </div>
              )}

              {generatedLink ? (
                <div className="flex flex-col items-center justify-center py-6 space-y-4">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900">Link Generated!</h4>
                  <p className="text-sm text-gray-600 text-center max-w-sm">
                    Your unique affiliate link is ready. Share it to start earning commissions.
                  </p>
                  <div className="w-full flex items-center gap-2 bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl mt-4">
                    <span className="text-xs font-mono text-gray-600 truncate flex-1">{generatedLink}</span>
                    <button 
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedLink);
                        toast.success("Link copied!");
                      }}
                      className="text-xs font-black text-primary-600 hover:underline uppercase shrink-0 px-2 py-1 bg-primary-50 rounded-lg"
                    >
                      Copy
                    </button>
                  </div>
                  <button
                    onClick={() => { setCollabModalProduct(null); setGeneratedLink(null); setShareMenuOpen(null); }}
                    className="w-full bg-gray-900 text-white font-bold text-sm py-3.5 px-6 rounded-xl shadow-lg transition-all hover:bg-gray-800 mt-2"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const basePrice = parseFloat(collabModalProduct.discount_price || collabModalProduct.price);
                  if (customPrice !== '' && parseFloat(customPrice) < basePrice) {
                    toast.error(`Custom price cannot be lower than the product price (₹${basePrice.toLocaleString()}). You can only increase the price.`);
                    return;
                  }
                  setIsSubmitting(true);
                  try {
                    const res = await api.post('/ecommerce/reviews/', {
                      product: collabModalProduct.id,
                      rating: rating,
                      comment: comment,
                      custom_discount_percent: customDiscount ? Number(customDiscount) : null,
                      custom_price: customPrice !== '' ? parseFloat(customPrice) : null
                    });
                    setReferralsData(prev => ({
                      ...prev,
                      referrals: [res.data, ...prev.referrals]
                    }));
                    setGeneratedLink(res.data.referral_link);
                    setComment('');
                    setRating(5);
                    setCustomDiscount('');
                    setCustomPrice('');
                  } catch (err) {
                    console.error("Error creating referral:", err);
                    toast.error(err.response?.data?.error || "Failed to generate link");
                  } finally {
                    setIsSubmitting(false);
                  }
                }} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Your Rating (1-5 Stars)</label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          type="button"
                          key={num}
                          onClick={() => setRating(num)}
                          className="p-1 bg-gray-50 hover:bg-orange-50 rounded-lg text-gray-300 hover:text-orange-500 transition-colors"
                        >
                          <Star className={`w-5 h-5 ${num <= rating ? 'fill-orange-500 text-orange-500' : ''}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Your Endorsement Review</label>
                    <textarea
                      rows="2"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Write your genuine product experience to encourage referrals..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm font-medium text-gray-900 resize-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Discount for Buyers (%) - Optional</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={customDiscount}
                        onChange={(e) => setCustomDiscount(e.target.value)}
                        placeholder="e.g. 15"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm font-medium text-gray-900 transition-all"
                      />
                      <p className="text-[10px] text-gray-500">Sacrifice commission for discount.</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Custom Price (₹) - Optional</label>
                      <input
                        type="number"
                        min={parseFloat(collabModalProduct.discount_price || collabModalProduct.price)}
                        step="0.01"
                        value={customPrice}
                        onChange={(e) => setCustomPrice(e.target.value)}
                        placeholder={`Min ₹${parseFloat(collabModalProduct.discount_price || collabModalProduct.price).toLocaleString()}`}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm font-medium text-gray-900 transition-all"
                      />
                      <p className="text-[10px] text-gray-500">Can only increase above ₹{parseFloat(collabModalProduct.discount_price || collabModalProduct.price).toLocaleString()}.</p>
                    </div>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gray-900 text-white font-bold text-sm py-3 px-6 rounded-xl shadow-lg transition-all hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? 'Generating...' : (
                        <>
                          <Link2 className="w-4 h-4" />
                          Generate Referral Link
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approval Success Modal */}
      <ApprovalSuccessModal 
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
      />
    </div>
  );
};

export default InfluencerDashboard;