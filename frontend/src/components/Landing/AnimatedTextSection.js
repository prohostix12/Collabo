import React, { useRef } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, useScroll, useTransform } from 'framer-motion';
import { useQuery } from 'react-query';
import api from '../../services/api';

const AnimatedTextSection = () => {
  const containerRef = useRef(null);

  const staggerContainer = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const wordVariants = {
    hidden: { 
      opacity: 0, 
      y: 40,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        duration: 0.8, 
        ease: [0.22, 1, 0.36, 1] 
      }
    }
  };

  const imagePillVariants = {
    hidden: { 
      opacity: 0, 
      y: 40,
      scale: 0.8 
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1, 
      transition: { 
        duration: 0.8, 
        ease: [0.22, 1, 0.36, 1] 
      }
    }
  };

  const { data: landingContent } = useQuery(
    'landing-content',
    async () => {
      const response = await api.get('/landing/content/');
      return response.data;
    },
    { retry: false, refetchOnWindowFocus: false }
  );

  const hero = landingContent?.hero || {};
  const rawText = hero.anim_text || "Maximize Your {img1} Brand's\nGrowth and {img2}{img3}{img4} Skyrocket Sales\nby Leveraging the Potential\nof Creator Marketing";
  const img1 = hero.anim_image1 || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=200&fit=crop";
  const img2 = hero.anim_image2 || "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop";
  const img3 = hero.anim_image3 || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop";
  const img4 = hero.anim_image4 || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop";

  const lines = rawText.split('\n');

  return (
    <section className="bg-black py-10 sm:py-16 px-4 sm:px-6 lg:px-8 overflow-hidden rounded-[2rem] sm:rounded-[3rem] mx-4 sm:mx-10 mb-12 relative">
      <div className="absolute inset-0 bg-black z-0" />
      
      <div className="max-w-[1200px] mx-auto relative z-10">
        <motion.div 
          ref={containerRef}
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="flex flex-col items-center"
        >
          {lines.map((line, lineIdx) => {
            const isLatest = lineIdx === lines.length - 1;
            const tokens = line.split(/({img\d+}|{.*?})/g).filter(Boolean);

            return (
              <div 
                key={lineIdx} 
                className={`flex flex-wrap justify-center items-center gap-x-2 sm:gap-x-4 mb-2 sm:mb-2 text-center ${isLatest ? 'opacity-30' : 'opacity-100'}`}
              >
                {tokens.map((token, tokenIdx) => {
                  if (token.match(/^{img\d+}$/)) {
                    if (token === '{img2}' || token === '{img3}' || token === '{img4}') {
                      if (token === '{img2}') {
                        const group = [img2, img3, img4];
                        return (
                          <motion.div key={tokenIdx} variants={imagePillVariants} className="flex -space-x-3 sm:-space-x-4 mx-2 align-middle">
                            {group.map((url, i) => (
                              <div key={i} className="w-8 h-8 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-[60px] lg:h-[60px] rounded-full border-[2px] border-black overflow-hidden bg-gray-900 shrink-0">
                                <img src={url} alt="" className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </motion.div>
                        );
                      }
                      return null;
                    }
                    
                    return (
                      <motion.div 
                        key={tokenIdx} 
                        variants={imagePillVariants}
                        className="inline-flex relative mx-1 overflow-hidden align-middle shrink-0 rounded-full border border-white/5"
                      >
                        <div className="w-16 h-8 sm:w-20 sm:h-10 md:w-24 md:h-12 lg:w-[110px] lg:h-[55px] relative">
                          <img src={img1} alt="" className="w-full h-full object-cover" />
                        </div>
                      </motion.div>
                    );
                  }

                  const isGradient = token.startsWith('{') && token.endsWith('}');
                  const textContent = isGradient ? token.slice(1, -1) : token;
                  
                  return textContent.split(' ').filter(Boolean).map((word, wordIdx) => (
                    <motion.span
                      key={`${tokenIdx}-${wordIdx}`}
                      variants={wordVariants}
                      style={isGradient ? {
                        background: 'linear-gradient(to right, #8915A0, #DB2777)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        color: 'transparent',
                        fontWeight: 900,
                      } : undefined}
                      className={`text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black tracking-tighter leading-tight ${isGradient ? '' : 'text-white'}`}
                    >
                      {word}
                    </motion.span>
                  ));
                })}
              </div>
            );
          })}
        </motion.div>
      </div>

    </section>
  );
};

export default AnimatedTextSection;
