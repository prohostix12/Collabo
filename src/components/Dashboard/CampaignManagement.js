import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  // eslint-disable-next-line no-unused-vars
  BarChart3, Search, Filter, Calendar, 
  // eslint-disable-next-line no-unused-vars
  MapPin, User, Building2, ExternalLink,
  // eslint-disable-next-line no-unused-vars
  CheckCircle2, AlertCircle, Clock, Trash2,
  // eslint-disable-next-line no-unused-vars
  TrendingUp, IndianRupee, PieChart, Layers,
  // eslint-disable-next-line no-unused-vars
  X, Briefcase, FileText, Target, Users, Map,
  // eslint-disable-next-line no-unused-vars
  ArrowRightLeft, Star, MessageSquare, ShieldCheck,
  ChevronRight, ArrowUpRight, Activity, Percent
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CampaignManagement = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [collaborations, setCollaborations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('campaigns');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [selectedCollab, setSelectedCollab] = useState(null);
  const [isCollabModalOpen, setIsCollabModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSubTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeSubTab === 'campaigns') {
        const response = await api.get('/collaborations/admin/campaigns/');
        setCampaigns(response.data.results || response.data);
      } else {
        const response = await api.get('/collaborations/admin/collaborations/');
        setCollaborations(response.data.results || response.data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const filteredCampaigns = campaigns.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCollabs = collaborations.filter(c => 
    c.campaign_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.influencer_username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': case 'ongoing': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'draft': case 'pending': return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400';
      case 'completed': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'cancelled': case 'rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    }
  };

  const handleCampaignClick = (campaign) => {
    setSelectedCampaign(campaign);
    setIsCampaignModalOpen(true);
  };

  const handleCollabClick = (collab) => {
    setSelectedCollab(collab);
    setIsCollabModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">Campaign Oversight</h2>
          <p className="text-gray-600 dark:text-gray-400">Monitor and manage all platform brand collaborations</p>
        </div>

        <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl border border-gray-200 dark:border-gray-700">
          <button 
            onClick={() => setActiveSubTab('campaigns')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${activeSubTab === 'campaigns' ? 'bg-white dark:bg-gray-700 text-violet-600 dark:text-violet-400 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            CAMPAIGNS
          </button>
          <button 
            onClick={() => setActiveSubTab('collaborations')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${activeSubTab === 'collaborations' ? 'bg-white dark:bg-gray-700 text-violet-600 dark:text-violet-400 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            COLLABORATIONS
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-600 dark:text-violet-400 mb-4">
            <Layers className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Global Campaigns</p>
          <h4 className="text-2xl font-black text-gray-900 dark:text-white">{campaigns.length}</h4>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
            <IndianRupee className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Funds</p>
          <h4 className="text-2xl font-black text-gray-900 dark:text-white">
            ₹{campaigns.reduce((sum, c) => sum + parseFloat(c.budget || 0), 0).toLocaleString()}
          </h4>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
            <Users className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Creators</p>
          <h4 className="text-2xl font-black text-gray-900 dark:text-white">{new Set(collaborations.map(c => c.influencer_username)).size}</h4>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4">
            <Activity className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Market Size</p>
          <h4 className="text-2xl font-black text-gray-900 dark:text-white">{collaborations.length} Acts</h4>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text"
              placeholder={`Search ${activeSubTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-3 bg-gray-50 dark:bg-gray-700/50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-violet-500 transition-all font-medium"
            />
          </div>
          <button className="flex items-center space-x-2 px-6 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-2xl text-xs font-black text-gray-600 dark:text-gray-300 hover:bg-gray-100 transition-all uppercase tracking-widest">
            <Filter className="w-4 h-4" />
            <span>Sort By</span>
          </button>
        </div>

        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin"></div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Processing Dashboard...</p>
          </div>
        ) : activeSubTab === 'campaigns' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-700/20">
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Campaign</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Budget</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Deadline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {filteredCampaigns.map((c) => (
                  <tr 
                    key={c.id} 
                    onClick={() => handleCampaignClick(c)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group cursor-pointer"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-black text-base shadow-lg shadow-violet-500/20">
                          {c.title.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900 dark:text-white group-hover:text-violet-600 transition-colors uppercase tracking-tight">{c.title}</p>
                          <p className="text-xs text-gray-500 flex items-center mt-1 font-bold">
                            <Building2 className="w-3 h-3 mr-1.5 text-gray-400" />
                            {c.company_name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">₹{parseFloat(c.budget).toLocaleString()}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Budget Cap</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-black text-gray-600 dark:text-gray-300 uppercase tracking-wider bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600">
                        {c.campaign_type?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] ${getStatusColor(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <p className="text-sm font-black text-gray-900 dark:text-white">{new Date(c.deadline).toLocaleDateString()}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Final Date</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-700/20">
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Partnership</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Rate</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Agreement</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Started</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {filteredCollabs.map((c) => (
                  <tr 
                    key={c.id} 
                    onClick={() => handleCollabClick(c)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group cursor-pointer"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-black text-base shadow-lg shadow-blue-500/20">
                          {c.campaign_title?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{c.campaign_title}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">{c.company_name}</span>
                            <ArrowRightLeft className="w-2.5 h-2.5 text-gray-300" />
                            <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase">{c.influencer_username}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">₹{parseFloat(c.final_rate).toLocaleString()}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Contract Total</p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase tracking-wider px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-lg inline-block">
                        {c.agreement_type || 'Direct'}
                      </p>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] ${getStatusColor(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <p className="text-sm font-black text-gray-900 dark:text-white">{new Date(c.created_at).toLocaleDateString()}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Campaign Detail Modal */}
      <AnimatePresence>
        {isCampaignModalOpen && selectedCampaign && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-6 bg-gradient-to-r from-violet-600 to-purple-600 text-white flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="flex items-center space-x-4 relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl font-black shadow-inner">
                    {selectedCampaign.title.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight">{selectedCampaign.title}</h3>
                    <div className="flex items-center space-x-3 mt-1">
                      <p className="text-white/80 flex items-center text-xs font-bold uppercase tracking-wider">
                        <Building2 className="w-3.5 h-3.5 mr-2" /> {selectedCampaign.company_name}
                      </p>
                      <span className="w-1 h-1 bg-white/30 rounded-full"></span>
                      <p className="text-white/80 flex items-center text-xs font-bold uppercase tracking-wider">
                        ID: #{selectedCampaign.id}
                      </p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsCampaignModalOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors relative z-10"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto max-h-[80vh] custom-scrollbar">
                {/* Progress Tracking Section */}
                <div className="mb-10">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                      <Activity className="w-4 h-4 mr-2 text-violet-500" />
                      Live Campaign Progress
                    </h4>
                    <span className="text-[10px] font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest bg-violet-50 dark:bg-violet-900/20 px-3 py-1 rounded-full border border-violet-100 dark:border-violet-800">
                      Target: {selectedCampaign.progress?.accepted_requests || 0} / {selectedCampaign.progress?.total_requests || 0} Hires
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-2xl border border-gray-100 dark:border-gray-600 relative overflow-hidden group">
                       <Percent className="absolute -right-2 -bottom-2 w-16 h-16 text-gray-200 dark:text-gray-600 opacity-20 group-hover:scale-110 transition-transform" />
                       <p className="text-[9px] text-gray-400 font-black uppercase mb-1">Hiring Rate</p>
                       <p className="text-lg font-black text-gray-900 dark:text-white">{Math.round(selectedCampaign.progress?.hiring_rate || 0)}%</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-2xl border border-gray-100 dark:border-gray-600 relative overflow-hidden group">
                       <TrendingUp className="absolute -right-2 -bottom-2 w-16 h-16 text-emerald-200 dark:text-emerald-600 opacity-20 group-hover:scale-110 transition-transform" />
                       <p className="text-[9px] text-gray-400 font-black uppercase mb-1">Budget Burn</p>
                       <p className="text-lg font-black text-emerald-600">₹{selectedCampaign.progress?.budget_spent.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-2xl border border-gray-100 dark:border-gray-600 relative overflow-hidden group">
                       <Users className="absolute -right-2 -bottom-2 w-16 h-16 text-blue-200 dark:text-blue-600 opacity-20 group-hover:scale-110 transition-transform" />
                       <p className="text-[9px] text-gray-400 font-black uppercase mb-1">Active Collabs</p>
                       <p className="text-lg font-black text-blue-600">{selectedCampaign.progress?.active_collabs || 0}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-2xl border border-gray-100 dark:border-gray-600 relative overflow-hidden group">
                       <CheckCircle2 className="absolute -right-2 -bottom-2 w-16 h-16 text-violet-200 dark:text-violet-600 opacity-20 group-hover:scale-110 transition-transform" />
                       <p className="text-[9px] text-gray-400 font-black uppercase mb-1">Completed</p>
                       <p className="text-lg font-black text-violet-600">{selectedCampaign.progress?.completed_collabs || 0}</p>
                    </div>
                  </div>

                  <div className="relative h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden border border-gray-200 dark:border-gray-600">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${selectedCampaign.progress?.completion_rate || 0}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-violet-500 to-purple-600 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                    ></motion.div>
                  </div>
                  <div className="flex justify-between mt-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Workload Intensity</p>
                    <p className="text-[10px] font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest">{Math.round(selectedCampaign.progress?.completion_rate || 0)}% Fully Completed</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   {/* Left Col: Info */}
                   <div className="space-y-8">
                      <section>
                        <h4 className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
                          <FileText className="w-4 h-4 mr-2 text-violet-500" />
                          Detailed Brief
                        </h4>
                        <div className="p-6 rounded-[2rem] bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-600">
                          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium capitalize">
                            {selectedCampaign.description}
                          </p>
                        </div>
                      </section>

                      <section>
                        <h4 className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
                          <ShieldCheck className="w-4 h-4 mr-2 text-violet-500" />
                          Requirements Grid
                        </h4>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm">
                           <ul className="space-y-3">
                              {selectedCampaign.requirements.split('\n').filter(r => r.trim()).map((req, i) => (
                                <li key={i} className="flex items-start text-xs font-bold text-gray-600 dark:text-gray-300">
                                   <ChevronRight className="w-3.5 h-3.5 mr-2 text-violet-500 mt-0.5 flex-shrink-0" />
                                   {req}
                                </li>
                              ))}
                           </ul>
                        </div>
                      </section>
                   </div>

                   {/* Right Col: Targets */}
                   <div className="space-y-8">
                      <section>
                        <h4 className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
                          <Target className="w-4 h-4 mr-2 text-violet-500" />
                          Strategy & Focus
                        </h4>
                        <div className="grid grid-cols-1 gap-4">
                           <div className="p-5 rounded-2xl bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800">
                              <p className="text-[9px] font-black text-violet-400 uppercase tracking-widest mb-1">Core Audience</p>
                              <p className="text-sm font-black text-violet-700 dark:text-violet-300">{selectedCampaign.target_audience}</p>
                           </div>
                           <div className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800">
                              <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Deliverables Bundle</p>
                              <p className="text-sm font-black text-blue-700 dark:text-blue-300 capitalize">{selectedCampaign.deliverables}</p>
                           </div>
                        </div>
                      </section>

                      <section>
                        <h4 className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
                          <Calendar className="w-4 h-4 mr-2 text-violet-500" />
                          Campaign Schedule
                        </h4>
                        <div className="bg-gray-50 dark:bg-gray-700/30 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-600 flex items-center justify-between">
                           <div>
                             <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Launch Date</p>
                             <p className="text-sm font-black text-gray-900 dark:text-white">{new Date(selectedCampaign.created_at).toLocaleDateString()}</p>
                           </div>
                           <ArrowRightLeft className="w-5 h-5 text-gray-300" />
                           <div className="text-right">
                             <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Final Deadline</p>
                             <p className="text-sm font-black text-violet-600">{new Date(selectedCampaign.deadline).toLocaleDateString()}</p>
                           </div>
                        </div>
                      </section>
                   </div>
                </div>

                <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-6">
                   <div className="flex items-center space-x-4">
                      <div className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] ${getStatusColor(selectedCampaign.status)}`}>
                        Platform Status: {selectedCampaign.status}
                      </div>
                      <div className="px-5 py-2.5 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-100 dark:border-emerald-800">
                        Budget: ₹{parseFloat(selectedCampaign.budget).toLocaleString()}
                      </div>
                   </div>
                   <div className="flex space-x-3 w-full md:w-auto">
                      <button className="flex-1 md:flex-none px-10 py-4 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all">
                        Archive
                      </button>
                      <button 
                        onClick={async () => {
                          await toast.promise(
                            new Promise(res => {
                              setTimeout(async () => {
                                await fetchData();
                                res();
                              }, 1500);
                            }),
                            {
                              loading: 'Establishing Secure Control Protocol...',
                              success: 'Administrative protocols executed! Dashboard sync complete.',
                              error: 'Protocol handshake failed.',
                            },
                            {
                              style: {
                                minWidth: '280px',
                                borderRadius: '16px',
                                background: '#18181b',
                                color: '#fafafa',
                                border: '1px solid #27272a',
                                fontWeight: '900',
                                textTransform: 'uppercase',
                                fontSize: '10px',
                                letterSpacing: '0.1em'
                              },
                              success: {
                                duration: 3000,
                                icon: '🛡️',
                              },
                            }
                          );
                        }}
                        className="flex-1 md:flex-none px-10 py-4 bg-violet-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-violet-700 transition-all shadow-xl shadow-violet-500/20 flex items-center justify-center space-x-2"
                      >
                        <span>Execute Controls</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Collaboration Detail Modal */}
      <AnimatePresence>
        {isCollabModalOpen && selectedCollab && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden"
            >
              <div className="p-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl font-black">
                    <ArrowRightLeft className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight">Contract Overview</h3>
                    <p className="text-white/80 flex items-center text-sm font-bold truncate max-w-[400px]">
                       {selectedCollab.campaign_title}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsCollabModalOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto max-h-[75vh] custom-scrollbar">
                <div className="flex items-center justify-between mb-10 p-6 bg-gray-50 dark:bg-gray-700/30 rounded-[2.5rem] border border-dashed border-gray-200 dark:border-gray-500">
                   <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-xl mx-auto mb-2">
                        {selectedCollab.company_name?.charAt(0)}
                      </div>
                      <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Brand Partner</p>
                      <p className="text-sm font-black text-gray-900 dark:text-white">{selectedCollab.company_name}</p>
                   </div>
                   <div className="flex flex-col items-center">
                      <div className="flex items-center space-x-2 text-gray-300">
                         <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                         <div className="h-0.5 w-24 bg-gradient-to-r from-blue-500 to-violet-500"></div>
                         <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-200 dark:border-gray-600 flex items-center justify-center">
                           <Activity className="w-5 h-5 text-gray-400" />
                         </div>
                         <div className="h-0.5 w-24 bg-gradient-to-r from-violet-500 to-blue-500"></div>
                         <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></div>
                      </div>
                      <span className={`mt-4 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(selectedCollab.status)}`}>
                        {selectedCollab.status}
                      </span>
                   </div>
                   <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-600 dark:text-violet-400 font-black text-xl mx-auto mb-2">
                        {selectedCollab.influencer_username?.charAt(0)}
                      </div>
                      <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Lead Creator</p>
                      <p className="text-sm font-black text-gray-900 dark:text-white">{selectedCollab.influencer_username}</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                  <div className="space-y-6">
                    <section>
                      <h4 className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
                        <IndianRupee className="w-4 h-4 mr-2 text-emerald-500" />
                        Settlement Info
                      </h4>
                      <div className="bg-emerald-50 dark:bg-emerald-900/10 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                         <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-emerald-600">Contract Rate</span>
                            <span className="text-lg font-black text-emerald-700 dark:text-emerald-300">₹{parseFloat(selectedCollab.final_rate).toLocaleString()}</span>
                         </div>
                         <p className="text-[10px] text-emerald-500 font-bold uppercase">Payment held in platform escrow</p>
                      </div>
                    </section>
                    
                    <section>
                      <h4 className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
                        <Star className="w-4 h-4 mr-2 text-amber-500" />
                        Engagement Terms
                      </h4>
                      <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/30 text-sm text-gray-600 dark:text-gray-300 font-medium border border-gray-100 dark:border-gray-600">
                        Creator is bound to the strict deliverables listed in the parent campaign. Dispute window opens upon content submission.
                      </div>
                    </section>
                  </div>

                  <div className="space-y-6">
                    <section>
                      <h4 className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
                        <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                        Agreed Timeline
                      </h4>
                      <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-800">
                         <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-blue-600">Established</span>
                            <span className="text-sm font-black text-blue-700 dark:text-blue-300">{new Date(selectedCollab.created_at).toLocaleDateString()}</span>
                         </div>
                         <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-blue-600">Last Synced</span>
                            <span className="text-sm font-black text-blue-700 dark:text-blue-300">{new Date(selectedCollab.updated_at).toLocaleDateString()}</span>
                         </div>
                      </div>
                    </section>

                    <section>
                      <h4 className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
                        <ShieldCheck className="w-4 h-4 mr-2 text-blue-500" />
                        Safety & Compliance
                      </h4>
                      <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-600">
                         <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-600">
                           <CheckCircle2 className="w-4 h-4" />
                         </div>
                         <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tighter">Verified Agreement</span>
                      </div>
                    </section>
                  </div>
                </div>

                <div className="mt-10 pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center gap-4">
                   <button className="px-8 py-3 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all">
                      View Chat Log
                   </button>
                   <div className="flex space-x-3">
                      <button className="px-6 py-3 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all">
                         Dispute
                      </button>
                      <button className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">
                        Release Payment
                      </button>
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CampaignManagement;
