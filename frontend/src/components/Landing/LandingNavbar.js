import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Globe, ChevronDown, ShoppingBag, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
// eslint-disable-next-line no-unused-vars
import { Search } from 'lucide-react';

const LandingNavbar = ({ onSearch }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // eslint-disable-next-line no-unused-vars
  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (location.pathname !== '/') {
      navigate('/', { state: { searchQuery: query } });
    } else {
      if (onSearch) onSearch(query);
      setTimeout(() => {
        const section = document.getElementById('influencers-grid');
        if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleSearchInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (location.pathname === '/' && onSearch) {
      onSearch(query);
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'py-4 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100' : 'py-6 bg-transparent'} px-4 sm:px-12`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Logo - Extreme Left */}
        <div className="flex items-center shrink-0">
          <button
            onClick={() => navigate('/')}
            className="flex items-center group"
          >
            <img src="/collabo-logo.png" alt="Collabo" className="h-10 sm:h-12 object-contain transition-transform duration-300 scale-[2.0] origin-left transform group-hover:scale-[2.1]" />
          </button>
        </div>

        {/* Floating Center Pill - Metapic Style */}
        <div className="hidden md:flex items-center bg-white/40 backdrop-blur-2xl border border-white/40 rounded-full px-1.5 py-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.03)] ml-16 mr-4">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/')}
              className="px-5 py-2 rounded-full text-[13px] font-bold text-gray-700 transition-all duration-300 hover:bg-gradient-to-r hover:from-primary-500 hover:to-accent-500 hover:text-white hover:shadow-md hover:border-transparent"
            >
              Home
            </button>
            
            {/* Highlighted Link Capsule with Dropdown */}
            <div className="relative group">
              <button
                onClick={() => {
                  navigate('/services');
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center space-x-2 bg-white px-5 py-2 rounded-full text-[13px] font-bold text-gray-900 shadow-sm border border-gray-100 transition-all duration-300 hover:bg-gradient-to-r hover:from-primary-500 hover:to-accent-500 hover:text-white hover:border-transparent hover:shadow-md peer"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-accent-500 group-hover:bg-white transition-colors duration-300"></span>
                <span>For Brands</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-white transition-colors duration-300" />
              </button>
              
              {/* Dropdown Menu */}
              <div className="absolute top-full left-0 mt-2 w-40 bg-white border border-gray-100 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 overflow-hidden py-2">
                <button
                  onClick={() => {
                    navigate('/services');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-5 py-2.5 text-[13px] font-bold text-gray-700 hover:text-accent-600 hover:bg-gray-50 transition-colors"
                >
                  Services
                </button>
                <button
                  onClick={() => {
                    navigate('/about');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-5 py-2.5 text-[13px] font-bold text-gray-700 hover:text-accent-600 hover:bg-gray-50 transition-colors"
                >
                  About
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                navigate('/creators');
              }}
              className="px-5 py-2 rounded-full text-[13px] font-bold text-gray-700 transition-all duration-300 hover:bg-gradient-to-r hover:from-primary-500 hover:to-accent-500 hover:text-white hover:shadow-md hover:border-transparent">
              Creators
            </button>
          </div>
        </div>

        {/* Global/Language & CTA - Extreme Right */}
        <div className="hidden md:flex items-center space-x-6">
          <button className="flex items-center space-x-1.5 text-gray-700 hover:text-black transition-colors">
            <Globe className="w-4 h-4" />
            <span className="text-[13px] font-bold">En</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {user?.user_type === 'influencer' ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-gradient-to-r from-primary-500 to-accent-600 hover:opacity-90 text-white px-6 py-2.5 rounded-full text-[13px] font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              My Dashboard
            </button>
          ) : (
            <button
              onClick={() => navigate('/register')}
              className="bg-[#0F172A] hover:bg-black text-white px-6 py-2.5 rounded-full text-[13px] font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Join the Club
            </button>
          )}

          {/* E-Commerce Store Toggle */}
          <button 
            onClick={() => navigate('/')}
            className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border border-slate-200/40 flex items-center justify-center"
            title="Go to E-Commerce Store"
          >
            <ShoppingBag className="w-4.5 h-4.5 text-indigo-600 animate-pulse" />
          </button>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-full text-gray-900 hover:bg-gray-100 transition-colors"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div className={`md:hidden absolute top-[80px] left-4 right-4 bg-white/95 backdrop-blur-xl border border-gray-100 rounded-[24px] shadow-2xl transition-all duration-300 overflow-hidden ${isMobileMenuOpen ? 'max-h-[400px] opacity-100 py-6' : 'max-h-0 opacity-0 py-0 border-0'}`}>
        <div className="px-6 space-y-4">
          <button
            onClick={() => { navigate('/'); setIsMobileMenuOpen(false); }}
            className="w-full text-left px-4 py-3 text-gray-900 font-bold rounded-2xl transition-all duration-300 hover:bg-gradient-to-r hover:from-primary-500 hover:to-accent-500 hover:text-white hover:shadow-md"
          >
            Home
          </button>
          <div className="space-y-1">
            <button
              onClick={() => { navigate('/services'); setIsMobileMenuOpen(false); }}
              className="w-full text-left px-4 py-3 text-gray-900 font-bold rounded-2xl transition-all duration-300 hover:bg-gradient-to-r hover:from-primary-500 hover:to-accent-500 hover:text-white hover:shadow-md flex items-center justify-between group"
            >
              <span>Brands - Services</span>
              <span className="w-2 h-2 rounded-full bg-accent-500 group-hover:bg-white transition-colors duration-300"></span>
            </button>
            <button
              onClick={() => { navigate('/about'); setIsMobileMenuOpen(false); }}
              className="w-full text-left px-4 py-3 text-gray-900 font-bold rounded-2xl transition-all duration-300 hover:bg-gradient-to-r hover:from-primary-500 hover:to-accent-500 hover:text-white hover:shadow-md flex items-center justify-between group"
            >
              <span>Brands - About</span>
              <span className="w-2 h-2 rounded-full bg-accent-500 group-hover:bg-white transition-colors duration-300"></span>
            </button>
          </div>
          <button
            onClick={() => {
              navigate('/creators');
              setIsMobileMenuOpen(false);
            }}
            className="w-full text-left px-4 py-3 text-gray-900 font-bold rounded-2xl transition-all duration-300 hover:bg-gradient-to-r hover:from-primary-500 hover:to-accent-500 hover:text-white hover:shadow-md"
          >
            Explore Creators
          </button>
          
          <div className="pt-4 border-t border-gray-100 flex flex-col space-y-3">
            {user?.user_type === 'influencer' ? (
              <button
                onClick={() => { navigate('/dashboard'); setIsMobileMenuOpen(false); }}
                className="w-full bg-gradient-to-r from-primary-500 to-accent-600 text-white px-6 py-4 rounded-full font-bold shadow-lg flex items-center justify-center gap-2"
              >
                <LayoutDashboard className="w-4.5 h-4.5" />
                My Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }}
                  className="w-full px-4 py-3 text-center text-gray-900 font-bold"
                >
                  Sign In
                </button>
                <button
                  onClick={() => { navigate('/register'); setIsMobileMenuOpen(false); }}
                  className="w-full bg-[#0F172A] text-white px-6 py-4 rounded-full font-bold shadow-lg"
                >
                  Join the Club
                </button>
              </>
            )}
            <button
              onClick={() => { navigate('/'); setIsMobileMenuOpen(false); }}
              className="w-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-6 py-4 rounded-full font-bold shadow-sm flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4.5 h-4.5" />
              <span>Go to E-Commerce Store</span>
            </button>
          </div>
        </div>
      </div>
    </nav>

  );
};

export default LandingNavbar;

