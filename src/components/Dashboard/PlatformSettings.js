import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import api from '../../services/api';
import { 
  // eslint-disable-next-line no-unused-vars
  Settings, Shield, Zap, Lock, Globe, 
  // eslint-disable-next-line no-unused-vars
  Bell, Database, Cpu, Cloud, RefreshCw, 
  // eslint-disable-next-line no-unused-vars
  ToggleRight, Moon, Sun, Monitor, Save,
  // eslint-disable-next-line no-unused-vars
  AlertTriangle, Key, Mail, Smartphone,
  // eslint-disable-next-line no-unused-vars
  Activity, Server, HardDrive, Layout,
  // eslint-disable-next-line no-unused-vars
  Cpu as Processor, Radio, Terminal
} from 'lucide-react';
import toast from 'react-hot-toast';

const PlatformSettings = () => {
  const [loading, setLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('general');

  const [settings, setSettings] = useState({
    siteName: 'Collabo Platform',
    maintenanceMode: false,
    registrationOpen: true,
    emailNotifications: true,
    platformFee: 5.0,
    twoFactorAuth: false,
    apiRateLimit: 1000,
    sessionTimeout: 60,
    storageEngine: 'AWS S3',
    cacheType: 'Redis',
    debugMode: false,
    logLevel: 'info',
    backupFrequency: 'Daily',
    globalCommissionRate: 10
  });

  const fetchGlobalSettings = async () => {
    try {
      const response = await api.get('/ecommerce/settings/');
      if (response.data && response.data.global_commission_rate !== undefined) {
        setSettings(prev => ({
          ...prev,
          globalCommissionRate: response.data.global_commission_rate
        }));
      }
    } catch (err) {
      console.error("Error fetching global settings:", err);
    }
  };

  useEffect(() => {
    fetchGlobalSettings();
  }, []);

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.post('/ecommerce/settings/', {
        global_commission_rate: Number(settings.globalCommissionRate)
      });
      toast.promise(
        new Promise(resolve => setTimeout(resolve, 1000)),
        {
          loading: 'Uploading configurations to core...',
          success: 'Platform settings updated successfully!',
          error: 'Failed to apply configuration change'
        },
        {
          style: {
            borderRadius: '16px',
            background: '#18181b',
            color: '#fff',
            fontWeight: '900',
            fontSize: '10px',
            textTransform: 'uppercase'
          }
        }
      );
    } catch (err) {
      console.error("Error saving global settings:", err);
      toast.error("Failed to save settings to core");
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  };

  const subTabs = [
    { id: 'general', label: 'Systems', icon: Globe },
    { id: 'security', label: 'Protections', icon: Shield },
    { id: 'infra', label: 'Database', icon: Database },
    { id: 'logs', label: 'Handshake', icon: Terminal },
  ];

  const systemStatus = [
    { name: 'Core API Gateway', status: 'online', latency: '42ms', load: '14%' },
    { name: 'SQLite Core Storage', status: 'online', latency: '2ms', load: '12%' },
    { name: 'Redis Cache Node', status: 'online', latency: '2ms', load: '8%' },
    { name: 'Stripe Webhooks', status: 'operational', latency: 'N/A', load: 'N/A' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Platform Configuration</h2>
          <p className="text-gray-600 dark:text-gray-400">Manage global system parameters and core protocols</p>
        </div>

        <button 
          onClick={handleSave}
          disabled={loading}
          className="px-8 py-3 bg-violet-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-violet-700 transition-all shadow-xl shadow-violet-500/20 flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Commit Changes</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
           {subTabs.map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveSubTab(tab.id)}
               className={`w-full flex items-center space-x-3 px-6 py-4 rounded-2xl text-xs font-black transition-all border ${
                 activeSubTab === tab.id 
                 ? 'bg-violet-600 text-white border-violet-500 shadow-lg shadow-violet-500/20' 
                 : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
               }`}
             >
               <tab.icon className={`w-4 h-4 ${activeSubTab === tab.id ? 'text-white' : 'text-gray-400'}`} />
               <span className="uppercase tracking-widest">{tab.label}</span>
             </button>
           ))}

           <div className="mt-8 p-6 bg-amber-50 dark:bg-amber-900/10 rounded-[2rem] border border-amber-100 dark:border-amber-800">
             <div className="flex items-center space-x-2 text-amber-600 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Warning</span>
             </div>
             <p className="text-[10px] text-amber-700 dark:text-amber-300 font-bold leading-relaxed">
               Modifying core configurations may cause brief platform outages. Always sync and verify production status after changes.
             </p>
           </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6">
           {activeSubTab === 'general' && (
             <div className="space-y-6">
                <section className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 p-8">
                   <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8">System Environment</h3>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                         <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-600">
                            <div>
                               <p className="text-xs font-black text-gray-900 dark:text-white uppercase">Maintenance Mode</p>
                               <p className="text-[9px] text-gray-400 font-bold uppercase">Lock all non-admin access</p>
                            </div>
                            <button 
                              onClick={() => handleToggle('maintenanceMode')}
                              className={`w-12 h-6 rounded-full transition-all flex items-center px-1 ${settings.maintenanceMode ? 'bg-violet-600 justify-end' : 'bg-gray-200 dark:bg-gray-600 justify-start'}`}
                            >
                               <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                            </button>
                         </div>
                         <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-600">
                            <div>
                               <p className="text-xs font-black text-gray-900 dark:text-white uppercase">Open Registration</p>
                               <p className="text-[9px] text-gray-400 font-bold uppercase">Allow new accounts</p>
                            </div>
                            <button 
                              onClick={() => handleToggle('registrationOpen')}
                              className={`w-12 h-6 rounded-full transition-all flex items-center px-1 ${settings.registrationOpen ? 'bg-violet-600 justify-end' : 'bg-gray-200 dark:bg-gray-600 justify-start'}`}
                            >
                               <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                            </button>
                         </div>
                      </div>

                      <div className="space-y-4">
                         <div className="p-5 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-600">
                            <p className="text-[9px] text-gray-400 font-black uppercase mb-1">Platform Fee Cap (%)</p>
                            <input 
                              type="number"
                              value={settings.platformFee}
                              onChange={(e) => setSettings({...settings, platformFee: e.target.value})}
                              className="w-full bg-transparent text-lg font-black text-gray-900 dark:text-white border-none p-0 focus:ring-0"
                            />
                         </div>
                         <div className="p-5 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-600">
                            <p className="text-[9px] text-gray-400 font-black uppercase mb-1">Session Timeout (Mins)</p>
                            <input 
                              type="number"
                              value={settings.sessionTimeout}
                              onChange={(e) => setSettings({...settings, sessionTimeout: e.target.value})}
                              className="w-full bg-transparent text-lg font-black text-gray-900 dark:text-white border-none p-0 focus:ring-0"
                            />
                         </div>
                         <div className="p-5 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-600">
                            <p className="text-[9px] text-gray-400 font-black uppercase mb-1">Global Default Commission Rate (%)</p>
                            <input 
                              type="number"
                              value={settings.globalCommissionRate}
                              onChange={(e) => setSettings({...settings, globalCommissionRate: e.target.value})}
                              className="w-full bg-transparent text-lg font-black text-gray-900 dark:text-white border-none p-0 focus:ring-0"
                            />
                         </div>
                      </div>
                   </div>
                </section>

                <section className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 p-8">
                   <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8">Node Live Status</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {systemStatus.map(node => (
                        <div key={node.name} className="p-5 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-600">
                           <div className="flex items-center justify-between mb-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              <span className="text-[9px] font-black text-emerald-600 uppercase">{node.status}</span>
                           </div>
                           <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase truncate">{node.name}</p>
                           <div className="flex justify-between items-center mt-3">
                              <span className="text-[9px] text-gray-400 uppercase font-bold">Lat: {node.latency}</span>
                              <span className="text-[9px] text-gray-400 uppercase font-bold">Load: {node.load}</span>
                           </div>
                        </div>
                      ))}
                   </div>
                </section>
             </div>
           )}

           {activeSubTab === 'security' && (
             <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 p-8 space-y-8">
                <div className="flex items-center justify-between border-b border-gray-50 dark:border-gray-700 pb-8">
                   <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-600 border border-violet-200 dark:border-violet-700">
                         <Lock className="w-6 h-6" />
                      </div>
                      <div>
                         <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Access Control & Auth</h3>
                         <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Manage platform identity protocols</p>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-800">
                      <div className="flex items-center justify-between mb-4">
                         <h4 className="text-xs font-black text-blue-700 dark:text-blue-300 uppercase underline decoration-2 underline-offset-4">2FA Policy</h4>
                         <Switch checked={settings.twoFactorAuth} onClick={() => handleToggle('twoFactorAuth')} />
                      </div>
                      <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold leading-relaxed">
                         Enforce two-factor authentication for all administrative accounts and company profiles with verified funds.
                      </p>
                   </div>
                   <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100 dark:border-emerald-800">
                      <div className="flex items-center justify-between mb-4">
                         <h4 className="text-xs font-black text-emerald-700 dark:text-emerald-300 uppercase underline decoration-2 underline-offset-4">Password Hashing</h4>
                         <span className="text-[9px] font-black text-emerald-600 bg-white dark:bg-emerald-900 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 uppercase tracking-widest">Argon2id</span>
                      </div>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold leading-relaxed">
                         Platform is utilizing the latest Argon2id algorithm for irreversible identity shadowing.
                      </p>
                   </div>
                </div>

                <div className="space-y-4">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Restricted Global IP List</label>
                   <textarea 
                     rows="3"
                     className="w-full bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-600 rounded-3xl p-5 text-sm font-black text-gray-700 dark:text-white focus:ring-2 focus:ring-violet-500"
                     placeholder="192.168.1.1, 10.0.0.1 (Separate with commas)"
                   ></textarea>
                </div>
             </div>
           )}

           {activeSubTab === 'infra' && (
             <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 p-12 text-center space-y-8">
                <div className="w-24 h-24 bg-gray-50 dark:bg-gray-700/50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                   <Server className="w-12 h-12" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Database Architecture</h3>
                  <p className="text-gray-500 max-w-sm mx-auto mt-2 font-medium">Currently utilizing an optimized SQLite engine. All systems are balanced and responsive.</p>

                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                   <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-600">
                      <p className="text-[8px] text-gray-400 font-black uppercase mb-1">Engine</p>
                       <p className="text-xs font-black text-gray-900 dark:text-white">SQLite 3.x</p>

                   </div>
                   <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-600">
                      <p className="text-[8px] text-gray-400 font-black uppercase mb-1">Cache</p>
                      <p className="text-xs font-black text-gray-900 dark:text-white">Redis 7.0</p>
                   </div>
                   <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-600">
                      <p className="text-[8px] text-gray-400 font-black uppercase mb-1">Storage</p>
                      <p className="text-xs font-black text-gray-900 dark:text-white">AWS EBS/S3</p>
                   </div>
                   <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-600">
                      <p className="text-[8px] text-gray-400 font-black uppercase mb-1">Sync</p>
                      <p className="text-xs font-black text-emerald-600">99.99%</p>
                   </div>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

const Switch = ({ checked, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-12 h-6 rounded-full transition-all flex items-center px-1 ${checked ? 'bg-violet-600 justify-end' : 'bg-gray-200 dark:bg-gray-600 justify-start'}`}
  >
     <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
  </button>
)

export default PlatformSettings;
