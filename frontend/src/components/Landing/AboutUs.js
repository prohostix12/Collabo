import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, Users, Target, Award } from 'lucide-react';

const AboutUs = () => {
  const ref = useRef(null);
  const inView = useInView(ref, {
    once: true,
    amount: 0.2,
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  const stats = [
    { icon: Users, value: '10K+', label: 'Influencers' },
    { icon: Target, value: '5K+', label: 'Campaigns' },
    { icon: Award, value: '98%', label: 'Success Rate' },
  ];

  return (
    <section id="about-section" className="relative py-12 sm:py-16 lg:py-20 bg-white overflow-hidden">
      {/* Large Background Typography Watermark */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 0.03 } : {}}
          transition={{ duration: 1.5 }}
          className="text-[15rem] sm:text-[20rem] lg:text-[25rem] font-black text-gray-900 select-none whitespace-nowrap"
          style={{ lineHeight: 1 }}
        >
          ABOUT
        </motion.div>
      </div>

      {/* Decorative Top Divider */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>

      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }}></div>

      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* Left Side - Text Content */}
          <motion.div
            ref={ref}
            variants={containerVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="space-y-6"
          >
            {/* Section Label */}
            <motion.div variants={itemVariants}>
              <span className="text-xs font-bold text-accent-600 uppercase tracking-[0.2em] bg-accent-50 px-3 py-1 rounded-full border border-accent-100">
                ABOUT US
              </span>
            </motion.div>

            {/* Large Bold Heading */}
            <motion.div variants={itemVariants}>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 leading-tight tracking-tight mt-4">
                Connecting Brands with{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-600">Authentic Voices</span>
              </h2>
            </motion.div>

            {/* Descriptive Paragraphs */}
            <motion.div variants={itemVariants} className="space-y-4">
              <p className="text-base text-gray-600 leading-relaxed">
                We are a leading influencer marketing platform that bridges the gap between innovative brands and creative content creators. Our mission is to make influencer collaborations seamless, transparent, and impactful.
              </p>
              <p className="text-base text-gray-600 leading-relaxed">
                With cutting-edge technology and a passion for authentic storytelling, we empower businesses to reach their target audiences through trusted influencer partnerships.
              </p>
            </motion.div>

            {/* Stats Grid */}
            <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
              {stats.map((stat, index) => {
                const StatIcon = stat.icon;
                return (
                  <div key={index} className="text-center lg:text-left">
                    <div className="flex items-center justify-center lg:justify-start mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center">
                        <StatIcon className="w-5 h-5 text-accent-500" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-gray-900">{stat.value}</div>
                    <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">{stat.label}</div>
                  </div>
                );
              })}
            </motion.div>

            {/* CTA Button */}
            <motion.div variants={itemVariants} className="pt-6">
              <button className="group relative inline-flex items-center space-x-2 text-gray-900 font-semibold text-base py-3 px-6 bg-white rounded-full border border-gray-200 hover:border-gray-300 transition-all hover:bg-gray-50 shadow-sm">
                <span>Discover our story</span>
                <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300 text-accent-500" />
              </button>
            </motion.div>
          </motion.div>

          {/* Right Side - Image */}
          <motion.div
            variants={imageVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="relative mt-8 lg:mt-0"
          >
            {/* Decorative Background Shape */}
            <div className="absolute -inset-3 bg-gradient-to-br from-primary-500 to-accent-500 rounded-3xl opacity-10 blur-2xl"></div>

            {/* Main Image Container */}
            <div className="relative group">
              {/* Image Wrapper */}
              <div className="relative overflow-hidden rounded-[32px] shadow-2xl border border-gray-100">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="relative aspect-[4/5] max-w-md mx-auto"
                >
                  <img
                    src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80"
                    alt="Collabo Platform"
                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent opacity-80" />
                </motion.div>
              </div>

              {/* Decorative Corner Element */}
              <div className="absolute -bottom-4 -right-4 w-24 h-24 border-2 border-accent-200 rounded-[20px] -z-10"></div>
              
              {/* Decorative Dot Pattern */}
              <div className="absolute -top-4 -left-4 w-20 h-20 grid grid-cols-4 gap-2 -z-10 opacity-30">
                {[...Array(16)].map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 bg-accent-500 rounded-full"></div>
                ))}
              </div>
            </div>

            {/* Floating Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="absolute -bottom-6 -left-6 bg-white/90 backdrop-blur-md rounded-[20px] shadow-xl p-4 border border-gray-100"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-md">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-xl font-black text-gray-900">5+ Years</div>
                  <div className="text-sm text-gray-600 font-medium">Industry Experience</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Decorative Divider */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
    </section>
  );
};

export default AboutUs;
