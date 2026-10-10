import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import LandingNavbar from './LandingNavbar';
import OurServices from './OurServices';
import Footer from '../Layout/Footer';
import { 
  BarChart3, 
  Users, 
  Zap, 
  Target, 
  ArrowRight,
  TrendingUp,
  Globe
} from 'lucide-react';

const ServicesPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const detailedServices = [
    {
      icon: Target,
      title: "Strategic Campaign Planning",
      description: "We don't just launch campaigns; we architect them. From defining KPIs to selecting the perfect cohort of creators, our strategy is built on data and brand goals.",
      features: ["Niche targeting", "Content guidelines", "KPI setting", "Budget optimization"],
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      icon: Users,
      title: "Creator Management",
      description: "End-to-end management of creator relationships. We handle the outreach, negotiation, and contract management so you can focus on the big picture.",
      features: ["Relationship building", "Contract handling", "Negotiation", "Escrow payments"],
      color: "text-purple-600",
      bg: "bg-purple-50"
    },
    {
      icon: BarChart3,
      title: "Real-time Analytics",
      description: "Transparency in every metric. Track engagement rates, reach, conversions, and ROI in real-time with our proprietary analytics dashboard.",
      features: ["ROAS tracking", "Audience sentiment", "Engagement heatmaps", "Competitive analysis"],
      color: "text-accent-600",
      bg: "bg-accent-50"
    },
    {
      icon: Globe,
      title: "Global Distribution",
      description: "Scale your message across borders. Our network of 10K+ verified creators spans across 50+ countries and multiple social platforms.",
      features: ["Multi-platform campaigns", "Cross-cultural reach", "Verified followers", "Authentic content"],
      color: "text-green-600",
      bg: "bg-green-50"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <LandingNavbar />

      {/* Services Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-white">
        {/* Decorative elements */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent-500/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gray-50 border border-gray-100 mb-8"
          >
            <Zap className="w-4 h-4 text-accent-500" />
            <span className="text-sm font-bold text-gray-700 uppercase tracking-widest">Solutions for Growth</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl sm:text-7xl font-black text-gray-900 leading-tight mb-8"
          >
            Infrastructure Built for <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-600">High-Performance</span> Marketing
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-12"
          >
            Collabo provides the end-to-end framework brands need to discover, manage, and scale creator partnerships with mathematical precision and creative flair.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <button className="px-8 py-4 bg-accent-500 text-white rounded-full font-bold text-lg hover:bg-accent-600 transition-all shadow-lg shadow-accent-500/25">
              Launch Your Strategy
            </button>
            <button className="px-8 py-4 bg-white text-gray-900 border border-gray-200 rounded-full font-bold text-lg hover:bg-gray-50 transition-all">
              View Case Studies
            </button>
          </motion.div>
        </div>
      </section>

      {/* Main Services Overview (Reusing the existing OurServices component but logic here) */}
      <OurServices />

      {/* Detailed Solutions Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Enterprise-Grade Features</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Everything you need to orchestrate multi-channel influencer success.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {detailedServices.map((service, idx) => {
              const ServiceIcon = service.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col items-start group"
                >
                  <div className={`w-16 h-16 ${service.bg} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500`}>
                    <ServiceIcon className={`w-8 h-8 ${service.color}`} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{service.title}</h3>
                  <p className="text-gray-600 leading-relaxed mb-8 flex-1">{service.description}</p>
                  
                  <ul className="grid grid-cols-2 gap-y-3 gap-x-6 w-full mb-8">
                    {service.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-center space-x-2 text-sm font-medium text-gray-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button className="flex items-center space-x-2 text-primary-600 font-bold hover:text-primary-700 transition-colors group/btn">
                    <span>Learn more</span>
                    <ArrowRight className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Social Proof Stats */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-900 rounded-[64px] p-12 sm:p-20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary-500/10 via-transparent to-transparent" />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
              <div>
                <h2 className="text-4xl text-white font-black mb-8 leading-tight">Measurable Results <br/> for the <span className="text-accent-400">Modern Brand</span></h2>
                <p className="text-gray-400 text-lg leading-relaxed mb-10">
                  We've helped thousands of brands move away from vanity metrics and towards real, trackable revenue growth. 
                </p>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <div className="text-4xl font-black text-white mb-2">3.5x</div>
                    <div className="text-gray-500 font-bold uppercase tracking-widest text-xs">Avg. ROAS</div>
                  </div>
                  <div>
                    <div className="text-4xl font-black text-white mb-2">50%</div>
                    <div className="text-gray-500 font-bold uppercase tracking-widest text-xs">Lower CPA</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[40px] p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="text-white font-bold">Performance Summary</div>
                  <div className="text-accent-400 text-sm font-bold flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    +12% this month
                  </div>
                </div>
                <div className="space-y-6">
                  {[
                    { label: "Content Engagement", value: "88%", color: "bg-accent-500" },
                    { label: "Conversion Rate", value: "12%", color: "bg-primary-500" },
                    { label: "Audience Trust", value: "94%", color: "bg-green-500" }
                  ].map((metric, mIdx) => (
                    <div key={mIdx}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">{metric.label}</span>
                        <span className="text-white font-bold">{metric.value}</span>
                      </div>
                      <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          whileInView={{ width: metric.value }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className={`h-full ${metric.color}`} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Bottom Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-8 leading-tight">Ready to transform your <br/> marketing engine?</h2>
          <p className="text-xl text-gray-600 mb-12">Join the brands who are already scaling with Collabo's state-of-the-art infrastructure.</p>
          <button className="px-12 py-5 bg-gray-900 border-2 border-transparent text-white rounded-full font-bold text-xl hover:bg-white hover:text-gray-900 hover:border-gray-900 transition-all duration-300 transform hover:-translate-y-1 shadow-2xl">
            Get Started Now
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ServicesPage;
