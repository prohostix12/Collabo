import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../../services/api';
import { motion } from 'framer-motion';
// eslint-disable-next-line no-unused-vars
import { Users, Star, ArrowRight, CheckCircle, Zap, Target, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import LandingNavbar from './LandingNavbar';
import ModernHero from './ModernHero';
import AnimatedTextSection from './AnimatedTextSection';
import CatalogFlipSection from './CatalogFlipSection';
import BrandChoiceSection from './BrandChoiceSection';
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

const InfluencerCarouselRow = ({ influencers, onInfluencerClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const cardsPerPage = 4;
  const maxIndex = Math.max(0, influencers.length - cardsPerPage);

  const handlePrev = () => setCurrentIndex(prev => (prev > 0 ? prev - 1 : 0));
  const handleNext = () => setCurrentIndex(prev => (prev < maxIndex ? prev + 1 : maxIndex));
  
  const displayed = influencers.slice(currentIndex, currentIndex + cardsPerPage);

  useEffect(() => {
    setCurrentIndex(0);
  }, [influencers]);

  if (influencers.length === 0) return null;

  return (
    <motion.div 
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.1 }
        }
      }}
      className="relative group/carousel w-full py-4 px-4 sm:px-14 mb-6 sm:mb-8"
    >
      {currentIndex > 0 && (
        <button 
          onClick={handlePrev}
          className="absolute left-0 sm:-left-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-white backdrop-blur-md border border-gray-200 shadow-xl flex items-center justify-center hover:bg-gray-50 hover:text-accent-600 transition-all duration-300 hover:scale-110 opacity-0 group-hover/carousel:opacity-100"
        >
          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700 hover:text-accent-600" />
        </button>
      )}
      
      <div className="flex flex-col sm:flex-row w-full gap-4 sm:gap-6 h-auto sm:h-[450px]">
        {displayed.map((influencer, index) => (
          <motion.div 
            key={influencer.id} 
            onClick={() => onInfluencerClick(influencer)}
            variants={{
              hidden: { opacity: 0, scale: 0.9, y: 20 },
              visible: { opacity: 1, scale: 1, y: 0 }
            }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className="cursor-pointer group relative flex-1 hover:flex-[3] transition-all duration-700 ease-in-out rounded-[32px] overflow-hidden shadow-sm hover:shadow-2xl border border-white/40 min-h-[400px] sm:min-h-0"
          >
            
            <div className="absolute inset-0 bg-gray-100">
              {influencer.profile_image ? (
                <img src={influencer.profile_image} alt={influencer.username}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
              ) : null}
              <div className="w-full h-full bg-gradient-to-tr from-accent-100 to-primary-100 flex items-center justify-center text-gray-400 text-6xl font-black"
                style={{ display: influencer.profile_image ? 'none' : 'flex' }}>
                {influencer.username ? influencer.username.charAt(0).toUpperCase() : 'C'}
              </div>
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/5 opacity-80 group-hover:opacity-100 transition-opacity duration-700" />
            
            <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 text-white z-10 transition-transform duration-700 ease-out transform translate-y-2 group-hover:translate-y-0">
              <div className="flex items-center space-x-2 mb-3">
                <span className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/90 border border-white/20">
                  {influencer.category || 'Creator'}
                </span>
                {influencer.followers_count >= 10000 && (
                  <span className="bg-yellow-500/20 backdrop-blur-md px-2 py-1.5 rounded-full flex items-center space-x-1 border border-yellow-500/30">
                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                  </span>
                )}
              </div>
              
              <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2 truncate group-hover:whitespace-normal relative z-10 transition-all duration-700 group-hover:text-accent-300">
                @{influencer.username}
              </h3>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 opacity-0 group-hover:opacity-100 h-0 group-hover:h-auto overflow-hidden transition-all duration-700 ease-in-out transform translate-y-4 group-hover:translate-y-0 mt-2">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-accent-400" />
                  <span className="font-bold text-lg">
                    {influencer.followers_count >= 1000000 ? `${(influencer.followers_count / 1000000).toFixed(1)}M`
                      : influencer.followers_count >= 1000 ? `${(influencer.followers_count / 1000).toFixed(1)}K`
                        : influencer.followers_count?.toLocaleString() || 0}
                  </span>
                </div>
                {influencer.rate_per_post > 0 && (
                  <div className="flex items-center space-x-2 sm:border-l border-white/20 sm:pl-4">
                    <span className="text-white/60 text-xs uppercase tracking-wider font-semibold">Starts at</span>
                    <span className="font-bold text-accent-400">₹{influencer.rate_per_post >= 1000 ? `${(influencer.rate_per_post / 1000).toFixed(1)}K` : influencer.rate_per_post.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {currentIndex < maxIndex && (
        <button 
          onClick={handleNext}
          className="absolute right-0 sm:-right-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-white backdrop-blur-md border border-gray-200 shadow-xl flex items-center justify-center hover:bg-gray-50 hover:text-accent-600 transition-all duration-300 hover:scale-110 opacity-0 group-hover/carousel:opacity-100"
        >
          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700 hover:text-accent-600" />
        </button>
      )}
    </motion.div>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAllInfluencers, setShowAllInfluencers] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [searchQuery, setSearchQuery] = useState('');
  const observerRef = useRef(null);

  const handleSearch = (query) => {
    if (query && query.trim() !== '') {
      navigate('/creators', { state: { searchQuery: query } });
    }
  };

  const { data: influencersData, isLoading } = useQuery(
    ['landing-influencers', selectedCategory],
    async () => {
      const response = await api.get('/auth/influencers/', {
        params: {
          ordering: '-followers_count',
          category: selectedCategory !== 'all' ? selectedCategory : undefined
        }
      });
      return response.data;
    },
    { retry: false, refetchOnWindowFocus: false }
  );

  const influencers = influencersData?.results || (Array.isArray(influencersData) ? influencersData : []);
  
  // Filter influencers by search query
  const filteredInfluencers = searchQuery && searchQuery.trim() !== ''
    ? influencers.filter(inf => 
        inf.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inf.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inf.bio?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : influencers;

  useEffect(() => {
    if (location.state?.scrollTo) {
      setTimeout(() => {
        const element = document.getElementById(location.state.scrollTo);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // Clear state after scrolling
          navigate(location.pathname, { replace: true, state: {} });
        }
      }, 500); // Wait for components to mount
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, navigate]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up');
            entry.target.classList.remove('opacity-0');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    const elements = document.querySelectorAll('.scroll-animate');
    elements.forEach((el) => observerRef.current?.observe(el));
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [filteredInfluencers]);

  const handleInfluencerClick = (influencer) => {
    navigate(`/influencer/${influencer.id}`);
  };

  // eslint-disable-next-line no-unused-vars
  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
    setShowAllInfluencers(false);
    setTimeout(() => {
      document.getElementById('influencers-grid')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleViewAll = () => {
    navigate('/creators');
  };

  return (
    <div className="min-h-screen bg-transparent relative overflow-hidden selection:bg-primary-100 selection:text-primary-900">
      <LandingNavbar onSearch={handleSearch} />

      {/* Static background — no continuous animations, no backdrop-blur on full-page overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[#FDFCFE] overflow-hidden">
        <div className="absolute top-[-25%] left-[-15%] w-[110%] h-[110%] bg-gradient-to-br from-[#8915A0]/20 via-[#DB2777]/10 to-transparent rounded-full blur-[140px]" />
        <div className="absolute top-1/4 left-1/4 w-[60%] h-[60%] bg-[#8915A0]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[80%] h-[80%] bg-[#8915A0]/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 font-sans">
        <ModernHero />


        <BrandChoiceSection />

        <AnimatedTextSection />

        <section id="features" className="bg-transparent py-24 relative overflow-hidden mt-12">
          {/* Decorative Purple Blobs */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-100/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent-100/20 rounded-full blur-[120px]" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
              <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="inline-block px-4 py-1.5 rounded-full border border-primary-100 bg-white mb-4 shadow-sm">
                <span className="text-primary-600 text-sm font-semibold uppercase tracking-wider">Features</span>
              </motion.div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">Why Choose Collabo?</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">The modern platform engineered for creator growth and brand scale.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: Zap, title: 'Fast & Easy', content: 'Find and connect with influencers in minutes. Our streamlined process makes collaboration effortless.', color: 'accent' },
                { icon: Target, title: 'Targeted Reach', content: 'Filter by category, followers, and engagement to find the perfect match for your brand.', color: 'primary' },
                { icon: CheckCircle, title: 'Verified Profiles', content: 'All creators are verified with real-time follower counts and authentic engagement metrics.', color: 'green' }
              ].map((feature, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ 
                    y: -10,
                    scale: 1.02,
                    boxShadow: "0 25px 50px -12px rgba(137, 21, 160, 0.15)"
                  }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 400, 
                    damping: 25,
                    delay: i * 0.1
                  }}
                  viewport={{ once: true }}
                  className="bg-white/40 backdrop-blur-md rounded-[32px] p-8 border border-white/60 hover:border-primary-200 transition-all duration-300 group shadow-sm relative overflow-hidden"
                >
                  {/* Decorative Glow Pulse On Hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500/0 via-primary-500/0 to-primary-500/0 group-hover:from-primary-500/5 group-hover:to-accent-500/5 transition-all duration-700" />
                  
                  <div className={`w-16 h-16 bg-${feature.color}-50 rounded-2xl mb-6 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner`}>
                    <feature.icon className={`h-8 w-8 text-${feature.color}-500`} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed text-lg">{feature.content}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="cta" className="bg-transparent py-24 border-t border-white/40 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary-500/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="bg-white/30 backdrop-blur-md rounded-[48px] p-12 sm:p-20 text-center shadow-[0_20px_60px_rgba(137,21,160,0.1)] border border-white/80">
              <h2 className="text-5xl sm:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight">Ready to innovate?</h2>
              <p className="text-xl text-gray-600 mb-12 leading-relaxed max-w-2xl mx-auto">Join the next generation of brands and creators scaling their reach together.</p>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <button onClick={() => navigate('/register?type=influencer')}
                  className="w-full sm:w-auto bg-primary-600 text-white px-10 py-5 rounded-full font-bold text-lg hover:bg-primary-700 transition-all duration-300 shadow-[0_4px_24px_rgba(137,21,160,0.3)] transform hover:-translate-y-1 inline-flex items-center justify-center space-x-2">
                  <span>Join as Creator</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
                <button onClick={() => navigate('/register?type=company')}
                  className="w-full sm:w-auto bg-white/60 backdrop-blur-sm hover:bg-white text-gray-900 px-10 py-5 rounded-full font-bold text-lg border border-white/40 transition-all duration-300 transform hover:-translate-y-1 inline-flex items-center justify-center space-x-2 shadow-sm">
                  <span>Join as Brand</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <CatalogFlipSection />
        <Footer />
      </div>
    </div>
  );
};

export default LandingPage;
