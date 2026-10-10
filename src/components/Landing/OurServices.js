import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const OurServices = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const services = [
    {
      number: "01",
      title: "Targeted Campaigns",
      description: "Connect with the right creators to drive authentic, high-impact campaigns tailored to your goals.",
      color: "from-accent-500 to-primary-500"
    },
    {
      number: "02",
      title: "Creator Partnerships",
      description: "Build strategic, long-term relationships with influencers who genuinely align with your brand's core values.",
      color: "from-primary-500 to-accent-300"
    },
    {
      number: "03",
      title: "Deep Analytics",
      description: "Gain granular insights and robust performance metrics to measure ROAS and campaign effectiveness.",
      color: "from-gray-300 to-accent-500"
    },
    {
      number: "04",
      title: "Secure Payouts",
      description: "Automated, safe, and transparent payment processing with creator escrow services included.",
      color: "from-purple-500 to-pink-500"
    }
  ];

  // Container animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  // Card animation variants
  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 40 
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  return (
    <section id="services-section" className="w-full bg-gray-50 py-24 relative overflow-hidden">
      
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        {/* Section Header */}
        <motion.div 
          className="mb-20 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="inline-block px-4 py-1.5 rounded-full border border-gray-200 bg-white mb-4 shadow-sm">
              <span className="text-primary-600 text-sm font-semibold uppercase tracking-wider">Our Solutions</span>
          </motion.div>
          <motion.h2 
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight mt-4"
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            How We Deliver <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-500 to-primary-600">Value</span>
          </motion.h2>
          <motion.p 
            className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Comprehensive infrastructure designed specifically for scaling modern influencer marketing strategies.
          </motion.p>
        </motion.div>

        {/* Services Grid */}
        <motion.div 
          ref={ref}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {services.map((service, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              className="group relative bg-white border border-gray-200 rounded-[32px] p-8 cursor-pointer overflow-hidden transition-all duration-500 hover:-translate-y-3 hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] hover:border-transparent"
            >
              {/* Hover Background Gradient Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-[1]`} />

              {/* Glowing border Top */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-[2]" />

              {/* Large Background Number */}
              <div className="absolute top-4 right-4 text-7xl font-black text-gray-100 select-none pointer-events-none leading-none group-hover:text-white/20 group-hover:-translate-y-2 group-hover:scale-110 transition-all duration-500 z-0 tracking-tighter">
                {service.number}
              </div>

              {/* Content */}
              <div className="relative z-10 pt-4 flex flex-col h-full">
                {/* Service Number Accent */}
                <div className="text-accent-600 font-bold mb-6 text-sm tracking-widest bg-accent-50 inline-block px-3 py-1 rounded-full border border-accent-100 w-fit group-hover:border-transparent group-hover:bg-white/20 group-hover:text-white transition-all duration-300">
                  {service.number}
                </div>

                {/* Service Title */}
                <h3 className="text-2xl font-bold text-gray-900 mb-4 leading-tight group-hover:text-white transition-colors duration-300">
                  {service.title}
                </h3>

                {/* Divider Line */}
                <div className="h-px w-12 bg-gray-200 mb-6 group-hover:w-24 group-hover:bg-white/50 transition-all duration-500" />

                {/* Service Description */}
                <p className="text-base text-gray-600 leading-relaxed group-hover:text-white/90 transition-colors duration-300 pb-4">
                  {service.description}
                </p>
                
                {/* Interaction indicator */}
                <div className="mt-auto pt-6 flex justify-end">
                   <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:bg-white/20 group-hover:border-transparent transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                     <svg className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                     </svg>
                   </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default OurServices;
