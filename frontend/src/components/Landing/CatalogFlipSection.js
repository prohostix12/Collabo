import React, { useState, useEffect, useRef } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from 'react-query';
import api from '../../services/api';

const CatalogFlipSection = () => {
  const [index, setIndex] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  // eslint-disable-next-line no-unused-vars
  const timerRef = useRef(null);

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX - innerWidth / 2) / 30;
    const y = (clientY - innerHeight / 2) / 30;
    setMousePos({ x, y });
  };

  const { data: landingContent } = useQuery(
    'landing-content',
    async () => {
      const response = await api.get('/landing/content/');
      return response.data;
    },
    { retry: false, refetchOnWindowFocus: false }
  );

  const catalogImages = landingContent?.catalog_images || [];
  
  useEffect(() => {
    if (catalogImages.length === 0) return;

    const cycle = () => {
      setIndex((prev) => (prev + 1) % catalogImages.length);
    };

    const timeoutId = setInterval(cycle, 600); 
    return () => clearInterval(timeoutId);
  }, [catalogImages.length]);

  const [isHovered, setIsHovered] = useState(null);

  const smoothTransition = {
    type: "spring",
    stiffness: 1500,
    damping: 80,
    mass: 0.1,
    restDelta: 0.001,
  };

  return (
    <div 
      onMouseMove={handleMouseMove}
      className="relative w-full bg-transparent py-16 overflow-hidden flex flex-col items-center justify-center min-h-[500px] sm:min-h-[650px]"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Premium Ambient Background - Subtler overlay to let global background through */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Subtle Noise Texture */}
        <div 
          className="absolute inset-0 opacity-[0.02] contrast-150 mix-blend-overlay z-20 pointer-events-none" 
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
        />
      </div>

      {/* Main Container for the Interactive Stack */}
      <div className="relative w-full h-[400px] sm:h-[550px] flex items-center justify-center perspective-[3500px]">
        <div className="absolute inset-0 flex items-center justify-center">
           {catalogImages.map((card, i) => {
             let offset = i - index;
             const total = catalogImages.length;
             
             if (offset > total / 2) offset -= total;
             if (offset < -total / 2) offset += total;
             
             const absOffset = Math.abs(offset);
             if (absOffset > 7) return null; 

             const isCenter = absOffset < 0.5;
             const zIndex = 200 - Math.round(absOffset * 10);
             const hoverActive = isHovered === i;
             
             return (
               <motion.div 
                 key={card.id || i}
                 drag="x"
                 dragConstraints={{ left: 0, right: 0 }}
                 onDragEnd={(_, info) => {
                   if (info.offset.x > 100) setIndex((prev) => (prev - 1 + total) % total);
                   else if (info.offset.x < -100) setIndex((prev) => (prev + 1) % total);
                 }}
                 initial={{ opacity: 0, x: 400, scale: 0.8 }}
                 animate={{ 
                   x: (offset * 110) + (mousePos.x * (1 - absOffset * 0.1)), 
                   // Uniform alignment: Reverting the 'popup' lift
                   y: (hoverActive ? -40 : (absOffset * 12)) + (mousePos.y * (1 - absOffset * 0.1)), 
                   scale: (isCenter ? 1.05 : 1.0 - (absOffset * 0.05)),
                   rotateY: 0, 
                   rotateX: (mousePos.y * -0.5),
                   rotateZ: 0, 
                   opacity: 1, 
                   z: isCenter ? 250 : -absOffset * 150,
                 }}
                 whileTap={{ scale: 1.1, cursor: 'grabbing' }}
                 onHoverStart={() => setIsHovered(i)}
                 onHoverEnd={() => setIsHovered(null)}
                 transition={smoothTransition}
                 style={{ zIndex, cursor: 'grab' }}
                 className="absolute w-[150px] sm:w-[260px] aspect-[9/16] transform-gpu will-change-transform"
                 onClick={() => setIndex(i)}
               >
                  <motion.div
                    className="w-full h-full"
                    animate={{ y: [0, -1, 0] }}
                    transition={{ duration: 1.0, repeat: Infinity, ease: "easeInOut", delay: i * 0.05 }}
                  >
                     <div className={`relative w-full h-full rounded-[3.5rem] sm:rounded-[4.5rem] overflow-hidden transition-all duration-700 
                       ${isCenter 
                         ? 'shadow-[0_60px_100px_-20px_rgba(137,21,160,0.2)] bg-white/90 backdrop-blur-xl' 
                         : 'shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] bg-white/40 backdrop-blur-md'
                       } 
                       ${hoverActive ? 'shadow-primary-300' : ''}`}
                     >
                       <div className="w-full h-full rounded-[3.3rem] sm:rounded-[4.3rem] overflow-hidden m-0">
                        <img 
                          src={card?.image_url || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=800&fit=crop'} 
                          alt=""
                          className="w-full h-full object-cover select-none"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1534126416832-a88fdf2911c2?w=800&q=80';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-transparent to-black/20 pointer-events-none" />
                       </div>
                     </div>
                  </motion.div>
               </motion.div>
             );
           })}
        </div>
      </div>
    </div>
  );
};

export default CatalogFlipSection;
