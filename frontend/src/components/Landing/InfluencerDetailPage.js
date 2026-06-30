import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import { motion, useInView, useAnimation, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import LandingNavbar from './LandingNavbar';
import Footer from '../Layout/Footer';
import {
  // eslint-disable-next-line no-unused-vars
  Users, TrendingUp, MapPin, Instagram, Youtube, Play, Eye, Heart,
  // eslint-disable-next-line no-unused-vars
  MessageCircle, Award, Briefcase, Globe, DollarSign, Calendar,
  // eslint-disable-next-line no-unused-vars
  CheckCircle, Target, Sparkles, BarChart3, Clock, ArrowUpRight, X
} from 'lucide-react';

const InfluencerDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);

  const { data: influencer, isLoading } = useQuery(
    ['influencer-detail', id],
    async () => {
      const response = await api.get(`/auth/influencers/${id}/`);
      return response.data;
    },
    { retry: false, refetchOnWindowFocus: false }
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const formatCount = (count) => {
    if (!count || count === 0) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const getYouTubeThumbnail = (url) => {
    if (!url || url === '#') return null;
    let videoId = null;
    if (url.includes('youtube.com/watch?v=')) videoId = url.split('v=')[1]?.split('&')[0];
    else if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1]?.split('?')[0];
    else if (url.includes('youtube.com/embed/')) videoId = url.split('embed/')[1]?.split('?')[0];
    if (videoId) return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  if (!influencer) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Influencer Not Found</h2>
          <button onClick={() => navigate('/')} className="text-gray-900 hover:text-gray-700 font-medium underline">
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const socialPlatforms = [
    { name: 'Instagram', icon: Instagram, handle: influencer.instagram_handle, 
      url: influencer.instagram_handle ? `https://instagram.com/${influencer.instagram_handle.replace('@', '')}` : null,
      followers: influencer.followers_count || 0 },
    { name: 'YouTube', icon: Youtube, handle: influencer.youtube_channel, 
      url: influencer.youtube_channel || null, followers: Math.floor((influencer.followers_count || 0) * 0.3) }
  ].filter(p => p.handle && p.url);

  // eslint-disable-next-line no-unused-vars
  const audienceData = {
    ageRanges: [
      { range: '18-24', percentage: 35 },
      { range: '25-34', percentage: 45 },
      { range: '35-44', percentage: 15 },
      { range: '45+', percentage: 5 }
    ],
    topLocations: ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad'],
    gender: { male: 45, female: 52, other: 3 },
    interests: ['Lifestyle', 'Fashion', 'Travel', 'Food', 'Technology']
  };

  const skills = ['Reels', 'Product Reviews', 'Storytelling', 'Brand Collaborations', 'Content Strategy'];
  const completedCampaigns = 12;
  const totalEarnings = 450000;
  const pendingPayment = 0;
  const experienceYears = 3;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <LandingNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/50 via-purple-100/50 to-pink-100/50"></div>
        
        <div className="relative max-w-6xl mx-auto px-6 sm:px-8 pt-24 sm:pt-32 pb-20 sm:pb-28">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-12 lg:gap-16">
            
            {/* Profile Image */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="flex-shrink-0">
              <div className="relative group">
                <div className="w-44 h-44 sm:w-52 sm:h-52 lg:w-64 lg:h-64 rounded-full overflow-hidden ring-4 ring-white/80 shadow-2xl transition-all duration-500 hover:scale-105 hover:ring-indigo-200">
                  {influencer.profile_image ? (
                    <img src={influencer.profile_image} alt={influencer.username} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center">
                      <span className="text-6xl sm:text-7xl lg:text-8xl font-black text-white">
                        {influencer.username ? influencer.username.charAt(0).toUpperCase() : 'U'}
                      </span>
                    </div>
                  )}
                </div>
                {/* Glow Effect */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 opacity-20 blur-2xl -z-10 group-hover:opacity-30 transition-opacity duration-500"></div>
              </div>
            </motion.div>

            {/* Profile Details */}
            <div className="flex-1 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-3 sm:mb-4 tracking-tight">
                  {influencer.username}
                </h1>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="text-xl sm:text-2xl lg:text-3xl text-indigo-600 font-semibold mb-6 sm:mb-8 capitalize">
                {influencer.category || 'Lifestyle'} Content Creator
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="text-base sm:text-lg lg:text-xl text-gray-700 leading-relaxed max-w-2xl mx-auto lg:mx-0 mb-8 sm:mb-10">
                {influencer.bio || `Creating engaging content that inspires and connects. Specializing in ${influencer.category || 'lifestyle'} content with a focus on authentic storytelling and brand partnerships.`}
              </motion.p>

              {/* Social Links */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center justify-center lg:justify-start gap-4 mb-10 sm:mb-12">
                {socialPlatforms.map((platform, index) => {
                  const Icon = platform.icon;
                  return (
                    <motion.a
                      key={platform.name}
                      href={platform.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.6 + index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                      whileHover={{ scale: 1.15, y: -3 }}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white shadow-lg hover:shadow-xl text-gray-700 hover:text-indigo-600 flex items-center justify-center transition-all duration-300">
                      <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                    </motion.a>
                  );
                })}
              </motion.div>

              {/* CTA Button */}
              {user?.user_type !== 'influencer' && (
                <motion.button
                  onClick={() => {
                    if (!user) {
                      navigate('/register');
                      return;
                    }
                    if (user.user_type === 'company') {
                      setIsProposalModalOpen(true);
                    } else {
                      navigate('/register');
                    }
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-full font-semibold hover:shadow-2xl transition-all duration-500 shadow-lg">
                  <span className="text-lg">
                    {user?.user_type === 'company' ? 'Send Direct Proposal' : 'Start Collaboration'}
                  </span>
                  <ArrowUpRight className="w-5 h-5" />
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Proposal Modal */}
      <DirectProposalModal 
        isOpen={isProposalModalOpen}
        onClose={() => setIsProposalModalOpen(false)}
        influencer={influencer}
        user={user}
      />

      {/* Profile Details Section */}
      <AnimatedSection>
        <section className="max-w-6xl mx-auto px-6 sm:px-8 py-16 sm:py-20">
          <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-12">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
              <DetailBlock label="Niche" value={influencer.category || 'Lifestyle'} icon={Target} />
              <DetailBlock label="Experience" value={`${experienceYears} Years`} icon={Award} />
              <DetailBlock label="Location" value={influencer.location || 'Mumbai, India'} icon={MapPin} />
              <DetailBlock label="Languages" value={influencer.languages?.join(', ') || 'English, Hindi'} icon={Globe} />
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Stats Section */}
      <AnimatedSection>
        <section className="max-w-6xl mx-auto px-6 sm:px-8 py-16 sm:py-20">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <StatBlock number={formatCount(influencer.followers_count || 0)} label="Followers" delay={0} />
            <StatBlock number={`${parseFloat(influencer.engagement_rate)?.toFixed(1) || 0}%`} label="Engagement" delay={0.1} />
            <StatBlock number={completedCampaigns} label="Campaigns" delay={0.2} />
            <StatBlock number={`₹${formatCount(totalEarnings)}`} label="Earnings" delay={0.3} />
          </div>
        </section>
      </AnimatedSection>

      {/* About Section */}
      <AnimatedSection>
        <section className="max-w-4xl mx-auto px-6 sm:px-8 py-16 sm:py-20">
          <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8 sm:mb-12">About</h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                {influencer.bio || `Passionate content creator with ${completedCampaigns}+ successful brand collaborations. Known for authentic storytelling and high engagement rates.`}
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Specializes in creating compelling {influencer.category || 'lifestyle'} content that resonates with audiences and drives real results for brands. With a focus on authenticity and creativity, every collaboration is crafted to tell a unique story.
              </p>
            </div>
            
            {/* Skills */}
            <div className="mt-12">
              <h3 className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-6">Expertise</h3>
              <div className="flex flex-wrap gap-3">
                {skills.map((skill, index) => (
                  <motion.span
                    key={skill}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 rounded-full text-sm font-medium hover:from-indigo-600 hover:to-purple-600 hover:text-white transition-all duration-300 cursor-default shadow-sm hover:shadow-md">
                    {skill}
                  </motion.span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Featured Work */}
      {(influencer.latest_product_review_link && influencer.latest_product_review_link !== '#') && (
        <AnimatedSection>
          <section className="max-w-5xl mx-auto px-6 sm:px-8 py-16 sm:py-20">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-12 sm:mb-16">Featured Work</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {influencer.latest_product_review_link && influencer.latest_product_review_link !== '#' && (
                <WorkCard
                  title="Latest Product Review"
                  thumbnail={influencer.latest_product_review_cover || getYouTubeThumbnail(influencer.latest_product_review_link)}
                  views={formatCount(influencer.latest_product_review_views || 0)}
                  likes={formatCount(influencer.latest_product_review_likes || 0)}
                  url={influencer.latest_product_review_link}
                />
              )}
              {influencer.most_viewed_content_link && influencer.most_viewed_content_link !== '#' && (
                <WorkCard
                  title="Most Viewed Content"
                  thumbnail={influencer.most_viewed_content_cover || getYouTubeThumbnail(influencer.most_viewed_content_link)}
                  views={formatCount(influencer.most_viewed_content_views || 0)}
                  likes={formatCount(influencer.most_viewed_content_likes || 0)}
                  url={influencer.most_viewed_content_link}
                />
              )}
            </div>
          </section>
        </AnimatedSection>
      )}

      {/* Analytics */}
      <AnimatedSection>
        <section className="max-w-5xl mx-auto px-6 sm:px-8 py-16 sm:py-20">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-12 sm:mb-16">Growth & Analytics</h2>
          <div className="grid md:grid-cols-2 gap-12">
            {/* Follower Growth */}
            <div>
              <h3 className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-8">Follower Growth</h3>
              <div className="h-64 flex items-end justify-between gap-3">
                {[65, 72, 78, 85, 92, 100].map((height, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ height: 0 }}
                    whileInView={{ height: `${height}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
                    className="flex-1 bg-gradient-to-t from-indigo-600 via-purple-600 to-pink-600 rounded-t-lg hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-300 cursor-pointer shadow-lg"
                  />
                ))}
              </div>
              <div className="flex justify-between mt-4 text-sm text-gray-600">
                <span>6 months ago</span>
                <span>Today</span>
              </div>
            </div>

            {/* Engagement Metrics */}
            <div className="space-y-6">
              <h3 className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-8">Engagement Metrics</h3>
              <MetricRow label="Average Likes" value={formatCount(Math.floor((influencer.followers_count || 0) * (influencer.engagement_rate || 5) / 100))} />
              <MetricRow label="Average Comments" value={formatCount(Math.floor((influencer.followers_count || 0) * 0.005))} />
              <MetricRow label="Story Views" value={formatCount(Math.floor((influencer.followers_count || 0) * 0.4))} />
              <MetricRow label="Reach Rate" value="45%" />
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Earnings */}
      <AnimatedSection>
        <section className="max-w-5xl mx-auto px-6 sm:px-8 py-16 sm:py-20">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-12 sm:mb-16">Earnings Summary</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <EarningsCard label="Total Earnings" value={`₹${formatCount(totalEarnings)}`} subtext="Lifetime revenue" />
            <EarningsCard label="Pending Payments" value={`₹${formatCount(pendingPayment)}`} subtext="Awaiting settlement" />
            <EarningsCard label="Avg per Campaign" value={`₹${formatCount(totalEarnings / completedCampaigns)}`} subtext={`Based on ${completedCampaigns} campaigns`} />
          </div>
        </section>
      </AnimatedSection>

      {/* Collaboration Rates */}
      {(influencer.rate_per_post > 0 || influencer.rate_per_story > 0 || influencer.rate_per_reel > 0) && (
        <AnimatedSection>
          <section className="max-w-5xl mx-auto px-6 sm:px-8 py-16 sm:py-20">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-12 sm:mb-16">Collaboration Rates</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {influencer.rate_per_post > 0 && (
                <RateCard label="Instagram Post" value={`₹${influencer.rate_per_post.toLocaleString()}`} />
              )}
              {influencer.rate_per_story > 0 && (
                <RateCard label="Instagram Story" value={`₹${influencer.rate_per_story.toLocaleString()}`} />
              )}
              {influencer.rate_per_reel > 0 && (
                <RateCard label="Instagram Reel" value={`₹${influencer.rate_per_reel.toLocaleString()}`} />
              )}
            </div>
          </section>
        </AnimatedSection>
      )}

      {/* Contact CTA */}
      <AnimatedSection>
        <section className="relative max-w-5xl mx-auto px-6 sm:px-8 py-20 sm:py-32 overflow-hidden">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 rounded-3xl -z-10"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-white/50 to-transparent rounded-3xl -z-10"></div>
          
          <div className="text-center relative">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 sm:mb-8">
              Let's Create Together
            </h2>
            <p className="text-lg sm:text-xl text-gray-700 max-w-2xl mx-auto mb-12 sm:mb-16">
              Ready to collaborate? Get in touch to discuss your next campaign and create content that resonates.
            </p>
            {user?.user_type !== 'influencer' && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <motion.button
                  onClick={() => {
                    if (!user) {
                      navigate('/register');
                    } else if (user.user_type === 'company') {
                      setIsProposalModalOpen(true);
                    } else {
                      navigate('/register');
                    }
                  }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-full font-semibold hover:shadow-2xl transition-all duration-500 shadow-lg">
                  <span>{user?.user_type === 'company' ? 'Send Direct Proposal' : 'Start Campaign'}</span>
                  <ArrowUpRight className="w-5 h-5" />
                </motion.button>
              </div>
            )}
          </div>
        </section>
      </AnimatedSection>

      <Footer />
    </div>
  );
};

// Animated Section Component
const AnimatedSection = ({ children }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
};

// Detail Block Component
const DetailBlock = ({ label, value, icon: Icon }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6 }}
    className="text-center lg:text-left">
    <Icon className="w-5 h-5 text-indigo-600 mb-3 mx-auto lg:mx-0" />
    <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-2">{label}</p>
    <p className="text-lg font-semibold text-gray-900 capitalize">{value}</p>
  </motion.div>
);

// Stat Block Component
const StatBlock = ({ number, label, delay }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start({ opacity: 1, y: 0 });
    }
  }, [isInView, controls]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={controls}
      transition={{ duration: 0.6, delay }}
      className="text-center lg:text-left">
      <motion.p
        initial={{ opacity: 0, scale: 0.5 }}
        animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
        transition={{ duration: 0.8, delay: delay + 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="text-4xl sm:text-5xl font-bold text-gray-900 mb-2">
        {number}
      </motion.p>
      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{label}</p>
    </motion.div>
  );
};

// Work Card Component
const WorkCard = ({ title, thumbnail, views, likes, url }) => (
  <motion.a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    whileHover={{ y: -8, scale: 1.02 }}
    transition={{ duration: 0.3 }}
    className="group block">
    <div className="relative aspect-[4/3] bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl overflow-hidden mb-4 shadow-lg hover:shadow-2xl transition-shadow duration-300">
      {thumbnail ? (
        <img src={thumbnail} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center">
          <Play className="w-16 h-16 text-white" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0 group-hover:from-black/60 transition-all duration-300 flex items-center justify-center">
        <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg" />
      </div>
    </div>
    <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">{title}</h3>
    <div className="flex items-center gap-4 text-sm text-gray-600">
      <span className="flex items-center gap-1">
        <Eye className="w-4 h-4" />
        {views}
      </span>
      <span className="flex items-center gap-1">
        <Heart className="w-4 h-4" />
        {likes}
      </span>
    </div>
  </motion.a>
);

// Metric Row Component
const MetricRow = ({ label, value }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6 }}
    className="flex items-center justify-between py-4 border-b border-indigo-100 last:border-0">
    <span className="text-gray-700">{label}</span>
    <span className="text-xl font-semibold text-gray-900">{value}</span>
  </motion.div>
);

// Earnings Card Component
const EarningsCard = ({ label, value, subtext }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6 }}
    whileHover={{ y: -4, scale: 1.02 }}
    className="p-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl hover:shadow-xl transition-all duration-300 border border-indigo-100">
    <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-3">{label}</p>
    <p className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{value}</p>
    <p className="text-sm text-gray-600">{subtext}</p>
  </motion.div>
);

// Rate Card Component
const RateCard = ({ label, value }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6 }}
    whileHover={{ y: -4, scale: 1.02 }}
    className="p-8 bg-white border-2 border-indigo-200 rounded-2xl hover:border-indigo-600 hover:shadow-xl transition-all duration-300">
    <p className="text-sm font-semibold text-indigo-600 mb-3">{label}</p>
    <p className="text-3xl font-bold text-gray-900">{value}</p>
  </motion.div>
);

export default InfluencerDetailPage;

// Direct Proposal Modal Component
const DirectProposalModal = ({ isOpen, onClose, influencer, user }) => {
  const [message, setMessage] = useState('');
  const [proposedRate, setProposedRate] = useState(influencer.rate_per_post || '');

  const sendProposalMutation = useMutation(
    (proposalData) => api.post('/collaborations/direct-requests/', proposalData),
    {
      onSuccess: () => {
        toast.success(`Proposal sent to @${influencer.username}!`);
        onClose();
        setMessage('');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to send proposal');
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    sendProposalMutation.mutate({
      influencer: influencer.id,
      message: message,
      proposed_rate: proposedRate,
      campaign_details: {
        title: `Direct Proposal for @${influencer.username}`,
        category: influencer.category
      }
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Send Proposal</h2>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-8 p-4 bg-indigo-50 rounded-2xl">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-indigo-200">
                  {influencer.profile_image ? (
                    <img src={influencer.profile_image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-indigo-600 font-bold">
                      {influencer.username.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-bold text-gray-900">@{influencer.username}</p>
                  <p className="text-sm text-indigo-600">{influencer.category} Creator</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Proposed Rate (₹)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={proposedRate}
                      onChange={(e) => setProposedRate(e.target.value)}
                      placeholder="Enter your proposed rate"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    placeholder="Briefly describe your collaboration idea..."
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={sendProposalMutation.isLoading}
                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 transition-all flex items-center justify-center gap-2"
                  >
                    {sendProposalMutation.isLoading ? (
                      <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Send Proposal</span>
                        <Sparkles className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
