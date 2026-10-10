import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../../services/api';
// eslint-disable-next-line no-unused-vars
import { Sparkles, ArrowRight } from 'lucide-react';

const gradientStyle = {
  background: 'linear-gradient(to right, #8915A0, #DB2777)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  color: 'transparent',
};

const ModernHero = () => {
  const navigate = useNavigate();

  const { data: landingContent } = useQuery(
    'landing-content',
    async () => {
      const response = await api.get('/landing/content/');
      return response.data;
    },
    { retry: false, refetchOnWindowFocus: false }
  );

  const hero = landingContent?.hero || {
    title: "Where Teams Connect,\nCollaborate, and Create",
    subtitle: "Partner with creators who turn content into conversions and help brands grow through real-world performance.",
    creator_button_text: "Sign up as a Creator",
    brand_button_text: "Sign up as a Brand"
  };

  const cards = landingContent?.cards || [];
  // Double for seamless loop — keyframe goes to -50%
  const marqueeCards = [...cards, ...cards];

  return (
    <section className="relative bg-transparent overflow-hidden pt-20 sm:pt-24 lg:pt-28 pb-0 flex flex-col items-center">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center flex flex-col items-center mb-0">

        {/* Line-by-line reveal — far fewer animated elements than word-by-word */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tighter leading-[0.9] mb-4 text-black max-w-4xl overflow-hidden">
          {hero.title.split('\n').map((line, lineIndex) => (
            <motion.div
              key={lineIndex}
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                duration: 0.6,
                delay: 0.1 + lineIndex * 0.15,
                ease: [0.215, 0.61, 0.355, 1],
              }}
              className="block py-1"
            >
              {line.split(' ').map((word, wordIndex) => {
                const isGradient = word.startsWith('{') || word.endsWith('}') || word === 'Collabo';
                const cleanWord = word.replace(/{|}/g, '');
                return (
                  <span key={wordIndex} className="inline-block mr-[0.2em]">
                    {isGradient ? (
                      <span style={gradientStyle}>{cleanWord}</span>
                    ) : (
                      cleanWord
                    )}
                  </span>
                );
              })}
            </motion.div>
          ))}
        </h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.6, ease: 'easeOut' }}
          className="max-w-xl mx-auto text-sm sm:text-base text-gray-500 mb-4 sm:mb-5 leading-relaxed font-medium"
        >
          {hero.subtitle}
        </motion.p>

        {/* CTAs removed */}
      </div>

      {/* Marquee */}
      <div className="w-full mt-2 sm:mt-3 lg:mt-4 relative h-[200px] overflow-hidden flex flex-col justify-end pb-4">
        <div className="flex overflow-hidden mb-0">
          <div
            className="flex gap-10 items-end"
            style={{ willChange: 'transform', animation: 'marquee 40s linear infinite', display: 'flex', width: 'fit-content' }}
          >
            {marqueeCards.map((card, index) => {
              const baseIndex = index % (cards.length || 1);
              const cardWidth = 'w-[80px] sm:w-[100px]';
              const cardHeight = 'h-[80px] sm:h-[100px]';
              const offsets = ['mb-4', 'mb-12', 'mb-0', 'mb-16', 'mb-6', 'mb-20', 'mb-2'];
              const offset = offsets[baseIndex % offsets.length];
              const getBgStyle = (color) => color?.startsWith('#') ? { backgroundColor: color } : {};
              const getTextStyle = (color) => color?.startsWith('#') ? { color: color } : {};
              const bgClass = !card.background_color?.startsWith('#') ? card.background_color : '';
              const textClass = !card.text_color?.startsWith('#') ? card.text_color : '';

              return (
                <div
                  key={index}
                  className={`relative flex-shrink-0 ${cardWidth} ${cardHeight} ${offset} cursor-pointer`}
                >
                  <div
                    style={getBgStyle(card.background_color)}
                    className={`w-full h-full rounded-[2.5rem] overflow-hidden shadow-md border border-white/60 relative ${bgClass || 'bg-white'}`}
                  >
                    {!card.image_url || card.image_url.includes('undefined') || card.image_url.includes('null') ? (
                      <div className="w-full h-full flex items-center justify-center p-6 text-center bg-gradient-to-br from-primary-50 to-accent-50">
                        <span
                          style={getTextStyle(card.text_color)}
                          className={`font-black text-[10px] sm:text-[11px] uppercase tracking-tighter leading-tight ${textClass || 'text-gray-900'}`}
                        >
                          {card.label}
                        </span>
                      </div>
                    ) : (
                      <img
                        src={card.image_url}
                        alt={card.label}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          e.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center p-6 text-center bg-gradient-to-br from-primary-50 to-accent-50"><span class="font-black text-[10px] uppercase tracking-tighter leading-tight text-gray-900">${card.label}</span></div>`;
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0%   { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
      `}} />
    </section>
  );
};

export default ModernHero;
