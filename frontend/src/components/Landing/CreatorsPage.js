import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../../services/api';
// eslint-disable-next-line no-unused-vars
import { Users, Star, ArrowRight } from 'lucide-react';
import LandingNavbar from './LandingNavbar';
import Footer from '../Layout/Footer';

const CATEGORIES = [
  { id: 'all', name: 'All', icon: '🌟' },
  { id: 'fashion', name: 'Fashion', icon: '👗' },
  { id: 'tech', name: 'Tech', icon: '💻' },
  { id: 'fitness', name: 'Fitness', icon: '💪' },
  { id: 'travel', name: 'Travel', icon: '✈️' },
  { id: 'food', name: 'Food', icon: '🍔' },
  { id: 'gaming', name: 'Gaming', icon: '🎮' },
  { id: 'lifestyle', name: 'Lifestyle', icon: '🌈' },
  { id: 'beauty', name: 'Beauty', icon: '💄' },
  { id: 'health', name: 'Health', icon: '🏥' }
];

const CreatorsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const observerRef = useRef(null);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query || query.trim() === '') {
      setSelectedCategory('all');
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (location.state?.searchQuery) {
      setSearchQuery(location.state.searchQuery);
    }
  }, [location.state]);

  const { data: influencersData, isLoading, error } = useQuery(
    ['creators-influencers', selectedCategory],
    async () => {
      console.log('CreatorsPage - Fetching influencers for category:', selectedCategory);
      try {
        const response = await api.get('/auth/influencers/', {
          params: {
            ordering: '-followers_count',
            category: selectedCategory !== 'all' ? selectedCategory : undefined
          }
        });
        console.log('CreatorsPage - Response received:', response.data);
        return response.data;
      } catch (err) {
        console.error('CreatorsPage - API Error:', err);
        throw err;
      }
    },
    { retry: false, refetchOnWindowFocus: false }
  );

  if (error) {
    console.error('CreatorsPage - Query error:', error);
  }

  const influencers = influencersData?.results || (Array.isArray(influencersData) ? influencersData : []);
  
  const displayedInfluencers = searchQuery && searchQuery.trim() !== ''
    ? influencers.filter(inf => 
        inf.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inf.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inf.bio?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : influencers;

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    const cards = document.querySelectorAll('.scroll-animate');
    cards.forEach((card) => observerRef.current?.observe(card));
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [displayedInfluencers]);

  const handleInfluencerClick = (influencer) => {
    navigate(`/influencer/${influencer.id}`);
  };

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  return (
    <div className="min-h-screen bg-white">
      <LandingNavbar onSearch={handleSearch} />

      <div className="bg-gradient-to-b from-primary-50 to-white pt-32 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Explore Creators</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">Discover and collaborate with the perfect match for your brand across various categories.</p>
        </div>
      </div>

      <section className="bg-white/80 backdrop-blur-md border-y border-gray-100 shadow-sm sticky top-[72px] lg:top-[88px] z-20 overflow-hidden">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3 max-w-full overflow-x-auto scrollbar-hide pb-2">
            {CATEGORIES.map((category) => (
              <button key={category.id} onClick={() => handleCategoryClick(category.id)}
                className={`flex items-center justify-center space-x-1.5 px-6 py-2 rounded-full whitespace-nowrap transition-all duration-300 font-medium border ${selectedCategory === category.id 
                  ? 'bg-accent-500 text-white border-transparent shadow-[0_4px_16px_rgba(236,72,153,0.3)]' 
                  : 'bg-gray-100 text-gray-600 border-gray-100 hover:text-gray-900 hover:bg-gray-200'
                  }`}>
                <span className="text-sm">{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            {searchQuery && searchQuery.trim() !== ''
              ? `Search Results for "${searchQuery}"` 
              : selectedCategory === 'all' 
                ? 'All Creators' 
                : `${CATEGORIES.find(c => c.id === selectedCategory)?.name} Creators`}
          </h2>
          <p className="text-gray-600 mt-2">
            {searchQuery && searchQuery.trim() !== ''
              ? `Found ${displayedInfluencers.length} creator${displayedInfluencers.length !== 1 ? 's' : ''}` 
              : `Showing ${displayedInfluencers.length} creators`}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-white rounded-[24px] p-4 border border-gray-100 animate-pulse shadow-sm">
                <div className="w-full aspect-square bg-gray-100 rounded-[16px] mb-4"></div>
                <div className="h-4 bg-gray-100 rounded mb-2"></div>
                <div className="h-3 bg-gray-50 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : displayedInfluencers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {displayedInfluencers.map((influencer, index) => (
              <div key={influencer.id} onClick={() => handleInfluencerClick(influencer)}
                className="scroll-animate opacity-0 cursor-pointer group"
                style={{ animationDelay: `${index * 0.05}s` }}>
                <div className="bg-white hover:bg-gray-50 rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 h-full flex flex-col group">
                  <div className="relative w-full aspect-[4/5] overflow-hidden bg-gray-50 p-2">
                    <div className="w-full h-full rounded-[16px] overflow-hidden relative">
                      {influencer.profile_image ? (
                        <img src={influencer.profile_image} alt={influencer.username}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                      ) : null}
                      <div className="w-full h-full bg-gradient-to-tr from-accent-100 to-primary-100 flex items-center justify-center text-gray-400 text-5xl font-bold"
                        style={{ display: influencer.profile_image ? 'none' : 'flex' }}>
                        {influencer.username ? influencer.username.charAt(0).toUpperCase() : 'C'}
                      </div>
                      
                      {/* Floating Details Inside Image */}
                      <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end z-10">
                         <div className="bg-white/80 backdrop-blur-md border border-gray-200 px-3 py-1.5 rounded-full">
                           <span className="text-gray-900 text-xs font-semibold capitalize">{influencer.category || 'Creator'}</span>
                         </div>
                         {influencer.followers_count >= 10000 && (
                           <div className="bg-white/80 backdrop-blur-md border border-gray-200 px-2.5 py-1.5 rounded-full flex items-center space-x-1">
                             <Star className="h-3 w-3 text-yellow-500 fill-current" />
                             <span className="text-gray-900 text-xs font-bold">Top</span>
                           </div>
                         )}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col pt-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-bold text-gray-900 mb-1 truncate group-hover:text-accent-600 transition-colors">
                        @{influencer.username}
                      </h3>
                    </div>
                    
                    <div className="flex items-center space-x-4 mb-4 mt-auto">
                      <div className="flex items-center space-x-1.5">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-bold text-gray-900">
                          {influencer.followers_count >= 1000000 ? `${(influencer.followers_count / 1000000).toFixed(1)}M`
                            : influencer.followers_count >= 1000 ? `${(influencer.followers_count / 1000).toFixed(1)}K`
                              : influencer.followers_count?.toLocaleString() || 0}
                        </span>
                        <span className="text-xs text-gray-500 hidden sm:inline">followers</span>
                      </div>
                    </div>
                    {influencer.rate_per_post > 0 && (
                      <div className="mt-auto w-full flex items-center justify-between border-t border-gray-100 pt-4">
                        <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Starting at</span>
                        <div className="text-accent-600 font-bold">
                          ₹{influencer.rate_per_post >= 1000
                            ? `${(influencer.rate_per_post / 1000).toFixed(1)}K`
                            : influencer.rate_per_post.toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-gray-50 rounded-[32px] border border-gray-100">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="h-10 w-10 text-gray-400" />
            </div>
            <p className="text-gray-900 text-xl font-bold mb-2">No creators found</p>
            <p className="text-gray-600">Try adjusting your filters or search terms</p>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
};

export default CreatorsPage;
