import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import LandingNavbar from './LandingNavbar';
import AboutUs from './AboutUs';
import Footer from '../Layout/Footer';
// eslint-disable-next-line no-unused-vars
import { Target, Users, Zap, Award, Globe, Heart, Sparkles, ShieldCheck } from 'lucide-react';

const AboutPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const values = [
    {
      icon: Target,
      title: "Precision Matching",
      description: "We use data-driven insights to connect brands with creators who share their exact values and audience profile.",
      color: "text-blue-500",
      bg: "bg-blue-50"
    },
    {
      icon: Users,
      title: "Real Community",
      description: "Our platform is built on relationships, not just transactions. We foster a supportive ecosystem for creators to thrive.",
      color: "text-purple-500",
      bg: "bg-purple-50"
    },
    {
      icon: Zap,
      title: "Future-Ready",
      description: "Always innovating, we provide the tools needed to navigate the ever-evolving landscape of digital marketing.",
      color: "text-accent-500",
      bg: "bg-accent-50"
    },
    {
      icon: ShieldCheck,
      title: "Built on Trust",
      description: "Transparency is our core pillar. Every creator is verified, and every metric is authenticated in real-time.",
      color: "text-green-500",
      bg: "bg-green-50"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <LandingNavbar />

      {/* About Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-gray-50">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm mb-6"
            >
              <Sparkles className="w-4 h-4 text-accent-500" />
              <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Our Story</span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl sm:text-7xl font-black text-gray-900 leading-tight mb-8"
            >
              Building the Future of <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-600">Influence Marketing</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-600 leading-relaxed mb-12"
            >
              Collabo was born from a simple idea: that authentic connections are the heartbeat of the internet. 
              We've built a platform where creativity meets scale, empowering both brands and creators to win.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Core Mission Sub-Section */}
      <AboutUs />

      {/* Our Values Section */}
      <section className="py-24 bg-gray-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Values That Guide Us</h2>
            <p className="text-xl text-gray-600">The core principles behind every decision we make at Collabo.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, idx) => {
              const ValueIcon = value.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  <div className={`w-14 h-14 ${value.bg} rounded-2xl flex items-center justify-center mb-6`}>
                    <ValueIcon className={`w-7 h-7 ${value.color}`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{value.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{value.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Global Impact Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-extrabold text-gray-900 mb-6 leading-tight">Empowering a <span className="text-accent-500">Global Community</span> of Creators</h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Whether you're a startup in Berlin or an influencer in Mumbai, Collabo provides the infrastructure to build, track, and scale your digital presence. 
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center mt-1 shrink-0">
                    <Globe className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-1">Worldwide Reach</h4>
                    <p className="text-gray-600">Connecting brands to multi-cultural audiences across 50+ countries.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center mt-1 shrink-0">
                    <Heart className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-1">Human-Centric</h4>
                    <p className="text-gray-600">Technology designed to augment creativity, not replace it.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-accent-500/10 rounded-[40px] blur-2xl" />
              <img 
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                alt="Our Team"
                className="relative z-10 w-full rounded-[40px] shadow-2xl grayscale hover:grayscale-0 transition-all duration-700" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Static Footer (Already included in Footer.js but here for context if needed, though usually just import it) */}
      <Footer />
    </div>
  );
};

export default AboutPage;
