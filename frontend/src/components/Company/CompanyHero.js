import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'framer-motion';
// eslint-disable-next-line no-unused-vars
import { Building2, MapPin, Users, CheckCircle, Target, TrendingUp, Award, Briefcase } from 'lucide-react';

const CompanyHero = ({ company }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const controls = useAnimation();
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    }
  }, [controls, isInView]);

  // Track mouse position for subtle parallax effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 10,
        y: (e.clientY / window.innerHeight - 0.5) * 10,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  // eslint-disable-next-line no-unused-vars
  const headlineVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  // eslint-disable-next-line no-unused-vars
  const letterVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.8, x: 50 },
    visible: {
      opacity: 1,
      scale: 1,
      x: 0,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  // eslint-disable-next-line no-unused-vars
  const floatingAnimation = {
    y: [0, -20, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  };

  // eslint-disable-next-line no-unused-vars
  const headline = company?.company_name || '';

  // Company details - only use real data, no defaults
  const companyData = {
    name: company?.company_name || '',
    tagline: company?.tagline || null,
    description: company?.description || '',
    industry: company?.industry || '',
    location: company?.location || null,
    size: company?.company_size || '',
    verified: company?.verified || false,
    activeCampaigns: company?.active_campaigns || 0,
    influencersConnected: company?.influencers_connected || 0,
    totalReach: company?.total_reach || null,
  };

  console.log('CompanyHero - Company data:', companyData);

  return (
    <section
      ref={ref}
      className="relative min-h-[70vh] flex items-center overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 w-full"
    >
      {/* Animated Background Gradient Orbs */}
      <motion.div
        className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
        animate={{
          x: [0, -100, 0],
          y: [0, -50, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10"
        animate={{
          x: [-50, 50, -50],
          y: [-50, 50, -50],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Floating Abstract Shapes */}
      <motion.div
        className="absolute top-20 left-10 w-20 h-20 border-2 border-purple-400 rounded-lg opacity-20"
        animate={{
          rotate: [0, 360],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      <motion.div
        className="absolute bottom-40 right-20 w-16 h-16 border-2 border-pink-400 rounded-full opacity-20"
        animate={{
          scale: [1, 1.5, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute top-1/3 right-1/4 w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-10"
        animate={{
          y: [0, -50, 0],
          x: [0, 30, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20" />

      {/* Main Content Container */}
      <div className="relative z-10 w-full px-12 sm:px-16 lg:px-24 xl:px-32 py-10 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-full">
          {/* Left Content - Company Profile */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={controls}
            className="text-white space-y-5"
          >
            {/* Verification Badge */}
            {companyData.verified && (
              <motion.div variants={itemVariants} className="inline-flex">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-green-500/20 backdrop-blur-sm border border-green-400/30">
                  <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-xs font-medium text-green-300">
                    Verified Company
                  </span>
                </div>
              </motion.div>
            )}

            {/* Company Name */}
            <motion.h1
              variants={itemVariants}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight"
            >
              {companyData.name}
            </motion.h1>

            {/* Tagline */}
            <motion.p
              variants={itemVariants}
              className="text-lg sm:text-xl text-purple-300 font-medium"
            >
              {companyData.tagline}
            </motion.p>

            {/* Description */}
            <motion.p
              variants={itemVariants}
              className="text-sm sm:text-base text-gray-300 leading-relaxed max-w-xl"
            >
              {companyData.description}
            </motion.p>

            {/* Company Details */}
            <motion.div variants={itemVariants} className="space-y-2.5 pt-2">
              {companyData.industry && (
                <div className="flex items-center space-x-2.5">
                  <Briefcase className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span className="text-gray-200 text-sm">{companyData.industry}</span>
                </div>
              )}
              {companyData.location && (
                <div className="flex items-center space-x-2.5">
                  <MapPin className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span className="text-gray-200 text-sm">{companyData.location}</span>
                </div>
              )}
              {companyData.size && (
                <div className="flex items-center space-x-2.5">
                  <Users className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span className="text-gray-200 text-sm">{companyData.size}</span>
                </div>
              )}
            </motion.div>

            {/* Key Metrics */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10"
            >
              <div className="text-center">
                <Target className="w-5 h-5 text-purple-400 mx-auto mb-1.5" />
                <div className="text-2xl font-bold text-white">
                  {companyData.activeCampaigns}
                </div>
                <div className="text-xs text-gray-400">Active Campaigns</div>
              </div>
              <div className="text-center">
                <Users className="w-5 h-5 text-purple-400 mx-auto mb-1.5" />
                <div className="text-2xl font-bold text-white">
                  {companyData.influencersConnected}
                </div>
                <div className="text-xs text-gray-400">Influencers</div>
              </div>
              <div className="text-center">
                <TrendingUp className="w-5 h-5 text-purple-400 mx-auto mb-1.5" />
                <div className="text-2xl font-bold text-white">
                  {companyData.totalReach}
                </div>
                <div className="text-xs text-gray-400">Total Reach</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Content - Campaign Stats Dashboard */}
          <motion.div
            variants={imageVariants}
            initial="hidden"
            animate={controls}
            className="relative hidden lg:block"
          >
            {/* Floating Stats Container */}
            <motion.div
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="relative"
              style={{
                x: mousePosition.x,
                y: mousePosition.y,
              }}
            >
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur-3xl opacity-20" />

              {/* Main Stats Container */}
              <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-4.5 border border-white/20 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-4.5">
                  <div>
                    <h3 className="text-white font-bold text-base">Campaign Overview</h3>
                    <p className="text-gray-400 text-xs">Real-time performance</p>
                  </div>
                  <div className="w-8.5 h-8.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Award className="w-4.5 h-4.5 text-white" />
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4.5">
                  <motion.div
                    className="bg-gray-900/50 rounded-lg p-3.5 border border-white/10"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Target className="w-4 h-4 text-purple-400 mb-1.5" />
                    <div className="text-xl font-bold text-white">{companyData.activeCampaigns}</div>
                    <div className="text-xs text-gray-400">Active Campaigns</div>
                  </motion.div>

                  <motion.div
                    className="bg-gray-900/50 rounded-lg p-3.5 border border-white/10"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Users className="w-4 h-4 text-pink-400 mb-1.5" />
                    <div className="text-xl font-bold text-white">{companyData.influencersConnected}</div>
                    <div className="text-xs text-gray-400">Influencers</div>
                  </motion.div>

                  <motion.div
                    className="bg-gray-900/50 rounded-lg p-3.5 border border-white/10"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TrendingUp className="w-4 h-4 text-green-400 mb-1.5" />
                    <div className="text-xl font-bold text-white">{companyData.totalReach}</div>
                    <div className="text-xs text-gray-400">Total Reach</div>
                  </motion.div>

                  <motion.div
                    className="bg-gray-900/50 rounded-lg p-3.5 border border-white/10"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Award className="w-4 h-4 text-yellow-400 mb-1.5" />
                    <div className="text-xl font-bold text-white">92%</div>
                    <div className="text-xs text-gray-400">Success Rate</div>
                  </motion.div>
                </div>

                {/* Performance Chart - Increased Height */}
                <div className="bg-gray-900/50 rounded-lg p-3.5 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white text-sm font-semibold">Performance Trend</span>
                    <span className="text-green-400 text-xs font-medium">↑ 24%</span>
                  </div>
                  <div className="h-36 flex items-end justify-between space-x-1.5">
                    {[45, 60, 55, 75, 65, 85, 80].map((height, i) => (
                      <motion.div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-purple-500 to-pink-500 rounded-t"
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{
                          duration: 0.8,
                          delay: i * 0.1,
                          ease: 'easeOut',
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="mt-3.5 space-y-2">
                  {[
                    { label: 'New collaboration request', time: '2m ago', color: 'purple' },
                  ].map((activity, i) => (
                    <motion.div
                      key={i}
                      className="flex items-center space-x-2 bg-gray-900/30 rounded-lg p-2.5 border border-white/5"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1 + i * 0.1 }}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full bg-${activity.color}-400`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-medium truncate">{activity.label}</p>
                        <p className="text-gray-500 text-xs">{activity.time}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Floating Badge */}
              <motion.div
                className="absolute -top-3 -right-3 w-13 h-13 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-2xl flex items-center justify-center"
                animate={{
                  rotate: [0, 5, 0],
                  y: [0, -5, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <CheckCircle className="w-6.5 h-6.5 text-white" />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-900 to-transparent" />
    </section>
  );
};

export default CompanyHero;
