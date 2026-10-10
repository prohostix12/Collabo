import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { ArrowRight, User, ChevronDown } from 'lucide-react';

const InfluencerHero = ({ influencer, onViewAnalytics, onViewProfile }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [imageError, setImageError] = useState(false);
  const controls = useAnimation();

  useEffect(() => {
    controls.start('visible');
  }, [controls]);

  // Track mouse position for parallax effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
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

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  const floatingAnimation = {
    y: [0, -15, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  };

  // Default data if no influencer prop
  const defaultInfluencer = {
    username: 'Creative Influencer',
    tagline: 'Lifestyle & Tech Content Creator',
    bio: 'Passionate about creating authentic content that inspires and connects. Specializing in lifestyle, technology, and creative storytelling.',
    profile_image: null,
    category: 'Lifestyle',
  };

  const data = influencer || defaultInfluencer;

  const formatFollowers = (count) => {
    if (!count || count === 0) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toLocaleString();
  };

  // Reset image error when influencer changes
  React.useEffect(() => {
    setImageError(false);
  }, [influencer?.profile_image]);



  return (
    <section className="relative min-h-[70vh] flex items-center overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Large Background Typography Watermark */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.03 }}
          transition={{ duration: 1.5 }}
          className="text-[20rem] sm:text-[25rem] lg:text-[30rem] font-black text-gray-900 select-none whitespace-nowrap"
          style={{ lineHeight: 1 }}
        >
          {data.category?.toUpperCase() || 'CREATOR'}
        </motion.div>
      </div>

      {/* Decorative Background Shapes */}
      <motion.div
        className="absolute top-20 right-20 w-64 h-64 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute bottom-20 left-20 w-80 h-80 bg-accent-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
        animate={{
          x: [0, -50, 0],
          y: [0, -30, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }}></div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16 sm:py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Left Side - Text Content */}
          <motion.div
              variants={containerVariants}
              initial="hidden"
              animate={controls}
              className="space-y-6 -mt-8"
            >
            {/* Small Label */}
            <motion.div variants={itemVariants} className="inline-flex">
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-primary-600 text-white text-sm font-medium shadow-lg">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                <span>{data.category || 'Lifestyle'} Content Creator</span>
              </div>
            </motion.div>

            {/* Main Heading */}
            <motion.div variants={itemVariants}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 leading-tight tracking-tight">
                {data.username}
              </h1>
            </motion.div>

            {/* Intro Paragraph */}
            <motion.div variants={itemVariants}>
              <p className="text-base text-gray-600 leading-relaxed max-w-xl">
                {data.bio}
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-3"
            >
              <motion.button
                onClick={onViewAnalytics}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group relative px-6 py-3 bg-gray-900 text-white rounded-full font-semibold text-base overflow-hidden shadow-xl hover:shadow-2xl transition-shadow"
              >
                <motion.div
                  className="absolute inset-0 bg-primary-600"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
                <span className="relative flex items-center justify-center space-x-2">
                  <span>View Analytics</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </motion.button>

              <motion.button
                onClick={onViewProfile}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group px-6 py-3 bg-white border-2 border-gray-900 text-gray-900 rounded-full font-semibold text-base hover:bg-gray-900 hover:text-white transition-all duration-300 shadow-lg"
              >
                <span className="flex items-center justify-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Profile</span>
                </span>
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Right Side - Image */}
          <motion.div
            variants={imageVariants}
            initial="hidden"
            animate={controls}
            className="relative flex items-center justify-center"
          >
            {/* Floating Image Container */}
            <motion.div
              animate={floatingAnimation}
              className="relative"
              style={{
                x: mousePosition.x * 0.5,
                y: mousePosition.y * 0.5,
              }}
            >
              {/* Decorative Circle Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-accent-400 rounded-full blur-3xl opacity-20 scale-110"></div>

              {/* Main Image Container */}
              <div className="relative w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96">
                {/* Decorative Ring */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-gray-900"
                  animate={{
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  style={{
                    borderStyle: 'dashed',
                  }}
                />

                {/* Image */}
                <div className="absolute inset-4 rounded-full overflow-hidden shadow-2xl bg-gradient-to-br from-gray-100 to-gray-200">

                  
                  {data.profile_image && !imageError ? (
                    <img
                      src={data.profile_image}
                      alt={data.username}
                      className="w-full h-full object-cover"
                      onLoad={() => {
                        console.log('✅ Profile image loaded successfully');
                      }}
                      onError={(e) => {
                        console.error('❌ Failed to load profile image:', data.profile_image);
                        console.error('Image element:', e.target);
                        setImageError(true);
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                      <span className="text-8xl font-black text-white">
                        {data.username ? data.username.charAt(0).toUpperCase() : 'U'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Decorative Dots */}
                <motion.div
                  className="absolute -top-3 -right-3 w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center shadow-xl"
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <span className="text-white font-bold text-xs">{formatFollowers(data.followers_count)}</span>
                </motion.div>

                <motion.div
                  className="absolute -bottom-3 -left-3 w-14 h-14 bg-accent-500 rounded-full flex items-center justify-center shadow-xl"
                  animate={{
                    scale: [1, 1.15, 1],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 0.5,
                  }}
                >
                  <span className="text-white font-bold text-xs">TOP</span>
                </motion.div>
              </div>

              {/* Decorative Shapes */}
              <motion.div
                className="absolute top-8 -left-8 w-20 h-20 border-2 border-gray-900 rounded-lg"
                animate={{
                  rotate: [0, 90, 0],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <motion.div
                className="absolute bottom-8 -right-8 w-16 h-16 bg-gray-900 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Down Indicator */}
      <motion.div
        className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center space-y-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
      >
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          Scroll Down
        </span>
        <motion.div
          animate={{
            y: [0, 6, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <ChevronDown className="w-5 h-5 text-gray-900" />
        </motion.div>
      </motion.div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
    </section>
  );
};

export default InfluencerHero;
