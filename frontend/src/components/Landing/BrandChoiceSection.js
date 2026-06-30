import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Link2, Film, Wallet, Star, TrendingUp, Package, Users, Copy, CheckCircle2, DollarSign, Calendar, Heart, Share2, Play, BarChart3, Search, ArrowRight } from 'lucide-react';

const STEPS = [
  {
    id: 'dashboard',
    step: '01',
    label: 'Your Dashboard',
    title: 'Your creator command center',
    description: 'See real-time earnings, pending payouts, follower count, and engagement rate at a glance. Track recent collaborations and jump into quick actions.',
    icon: LayoutDashboard,
    color: 'from-violet-500 to-purple-600',
  },
  {
    id: 'collab',
    step: '02',
    label: 'Pick & Collab',
    title: 'Browse products and generate links',
    description: 'Explore the product catalog, pick any item, rate it, write a quick review, and instantly generate your unique affiliate link with custom pricing.',
    icon: Link2,
    color: 'from-pink-500 to-rose-600',
  },
  {
    id: 'share',
    step: '03',
    label: 'Share & Promote',
    title: 'Download brand content and share everywhere',
    description: 'Brands upload approved photos and videos for each product. Download them or share directly to WhatsApp, Instagram, YouTube with your referral link.',
    icon: Share2,
    color: 'from-orange-500 to-amber-600',
  },
  {
    id: 'earn',
    step: '04',
    label: 'Track & Earn',
    title: 'Watch sales roll in and withdraw earnings',
    description: 'Track every click, conversion, and commission in real time. Request payouts directly to your bank account whenever you want.',
    icon: Wallet,
    color: 'from-emerald-500 to-green-600',
  },
];

const AUTOPLAY_INTERVAL = 5000;

/* ─── STEP 1: Dashboard Visual (two-phase: stats → product catalog) ─── */
const DashboardVisual = () => {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    setPhase(0);
    const t = setTimeout(() => setPhase(1), 2400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="w-full h-full flex flex-col gap-2 overflow-hidden">
      <AnimatePresence mode="wait">
        {phase === 0 ? (
          <motion.div key="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }} className="flex flex-col gap-2 flex-1">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: 'Total Earnings', value: '₹12,450', icon: DollarSign, gradient: 'from-violet-600 to-violet-500', change: '+12%' },
                { label: 'Pending', value: '₹3,200', icon: Calendar, gradient: 'from-gray-600 to-gray-500', change: '+5%' },
                { label: 'Followers', value: '24.5K', icon: Users, gradient: 'from-violet-500 to-purple-600', change: '+8%' },
                { label: 'Engagement', value: '4.8%', icon: Star, gradient: 'from-gray-700 to-gray-600', change: '+2%' },
              ].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.1 }} className="bg-white rounded-xl p-2.5 border border-gray-100 shadow-sm">
                  <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${s.gradient} flex items-center justify-center mb-1.5`}>
                    <s.icon className="w-3 h-3 text-white" />
                  </div>
                  <div className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">{s.label}</div>
                  <div className="text-sm font-black text-gray-900">{s.value}</div>
                  <div className="text-[8px] text-emerald-500 font-bold">{s.change} vs last month</div>
                </motion.div>
              ))}
            </div>
            {/* Recent Activity */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="bg-white rounded-xl p-2.5 border border-gray-100 shadow-sm flex-1">
              <div className="text-[8px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">Recent Activity</div>
              {['Brand Campaign - Nike', 'Collab with FreshSkin', 'Affiliate Sale #128'].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.75 + i * 0.1 }}
                  className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
                  <Heart className="w-3 h-3 text-violet-500" />
                  <span className="text-[9px] text-gray-700 font-semibold flex-1 truncate">{item}</span>
                  <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full ${i === 1 ? 'bg-yellow-50 text-yellow-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {i === 1 ? 'Pending' : 'Active'}
                  </span>
                </motion.div>
              ))}
            </motion.div>
            {/* Quick Actions */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }} className="flex gap-1.5">
              {['View Analytics', 'Update Profile', 'My Collabs'].map((a, i) => (
                <div key={i} className={`flex-1 py-2 rounded-lg text-center text-[8px] font-bold ${i === 0 ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{a}</div>
              ))}
            </motion.div>
          </motion.div>
        ) : (
          <motion.div key="catalog" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }} className="flex flex-col gap-2 flex-1">
            {/* Affiliated Marketing Header */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
              className="flex items-center gap-2 bg-violet-50 border border-violet-100 rounded-xl px-2.5 py-2">
              <div className="w-5 h-5 bg-violet-600 rounded-md flex items-center justify-center">
                <Link2 className="w-3 h-3 text-white" />
              </div>
              <span className="text-[9px] font-bold text-violet-700">Affiliated Marketing</span>
              <div className="flex-1" />
              <span className="text-[7px] text-violet-500 font-semibold">Explore Catalog →</span>
            </motion.div>
            {/* Product Grid */}
            <div className="grid grid-cols-2 gap-2 flex-1">
              {[
                { brand: 'NOVASOUND', name: 'NovaPro ANC Wireless', price: '₹14,999', discount: '10%', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=80' },
                { brand: 'AEROCORP', name: 'Aero X1 Pro Ultra', price: '₹79,999', discount: '12%', img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=300&q=80' },
              ].map((p, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.15 }}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                  <div className="h-24 bg-gray-50 flex items-center justify-center overflow-hidden">
                    <img src={p.img} alt={p.name} className="w-full h-full object-contain p-2" />
                  </div>
                  <div className="p-2 flex-1 flex flex-col">
                    <div className="text-[6px] text-gray-400 font-bold uppercase">{p.brand}</div>
                    <div className="text-[8px] font-bold text-gray-900 truncate">{p.name}</div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[9px] font-black text-gray-900">{p.price}</span>
                      <span className="text-[6px] font-bold text-violet-600 bg-violet-50 px-1 py-0.5 rounded-full">{p.discount}</span>
                    </div>
                    <div className="flex gap-1 mt-1.5">
                      <div className="flex-1 bg-gray-100 rounded-md py-1.5 text-center text-[7px] font-bold text-gray-500">Buy</div>
                      <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ delay: 0.7 + i * 0.2, duration: 0.5, repeat: 2 }}
                        className="flex-1 bg-gray-900 rounded-md py-1.5 text-center text-[7px] font-bold text-white flex items-center justify-center gap-0.5">
                        <Link2 className="w-2 h-2" /> Collab
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            {/* Bottom hint */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
              className="bg-gray-50 border border-gray-100 rounded-xl px-2.5 py-2 flex items-center gap-1.5">
              <ArrowRight className="w-3 h-3 text-violet-500 shrink-0" />
              <span className="text-[7px] text-gray-500 font-semibold">Click <strong className="text-gray-900">Collab</strong> on any product to generate your affiliate link</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── STEP 2: Pick & Collab Visual (cursor clicks Collab → modal appears) ─── */
const CollabVisual = () => {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    setPhase(0);
    const t1 = setTimeout(() => setPhase(1), 1800);
    const t2 = setTimeout(() => setPhase(2), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="w-full h-full flex flex-col gap-2 overflow-hidden relative">
      {/* Search Bar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2">
        <Search className="w-3 h-3 text-gray-400" />
        <span className="text-[9px] text-gray-400 font-semibold">Search products...</span>
      </motion.div>
      {/* Product Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-24 bg-gray-50 flex items-center justify-center overflow-hidden">
          <img src="https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=300&q=80" alt="Keyboard" className="w-full h-full object-cover" />
        </div>
        <div className="p-2.5">
          <div className="text-[8px] text-gray-400 font-bold uppercase">GHOSTKEY</div>
          <div className="text-[10px] font-bold text-gray-900 truncate">StealthPro Mechanical Keyboard</div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-black text-gray-900">₹8,999</span>
            <span className="text-[7px] font-bold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded-full">10% Commission</span>
          </div>
          <div className="flex gap-1.5 mt-2 relative">
            <div className="flex-1 bg-gray-100 rounded-lg py-1.5 text-center text-[8px] font-bold text-gray-600">Buy</div>
            <div className={`flex-1 rounded-lg py-1.5 text-center text-[8px] font-bold text-white flex items-center justify-center gap-1 transition-all duration-200 ${phase >= 1 ? 'bg-violet-600 ring-2 ring-violet-300 scale-105' : 'bg-gray-900'}`}>
              <Link2 className="w-2.5 h-2.5" /> Collab
            </div>
          </div>
        </div>
      </motion.div>

      {/* Animated Cursor — travels to Collab button then clicks */}
      <motion.div
        initial={{ opacity: 0, right: '50%', bottom: '55%' }}
        animate={
          phase === 0
            ? { opacity: [0, 1, 1], right: ['50%', '50%', '18%'], bottom: ['55%', '55%', '12%'] }
            : { opacity: 0, right: '18%', bottom: '12%', scale: 0.6 }
        }
        transition={
          phase === 0
            ? { duration: 1.6, delay: 0.5, times: [0, 0.2, 1], ease: 'easeInOut' }
            : { duration: 0.2 }
        }
        className="absolute z-30 pointer-events-none"
      >
        <svg width="24" height="28" viewBox="0 0 20 24" fill="none" className="drop-shadow-lg">
          <path d="M2 1L2 17L6.5 13L10.5 21L13.5 19.5L9.5 11.5L15 11L2 1Z" fill="white" stroke="#111" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
      </motion.div>

      {/* Click Ripple on Collab button */}
      <AnimatePresence>
        {phase === 1 && (
          <>
            <motion.div
              initial={{ opacity: 0.7, scale: 0.2 }}
              animate={{ opacity: 0, scale: 2 }}
              transition={{ duration: 0.6 }}
              className="absolute z-20 w-10 h-10 rounded-full bg-violet-400/30 pointer-events-none"
              style={{ right: '15%', bottom: '10%' }}
            />
            <motion.div
              initial={{ opacity: 0.5, scale: 0.3 }}
              animate={{ opacity: 0, scale: 2.5 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="absolute z-20 w-10 h-10 rounded-full border-2 border-violet-400 pointer-events-none"
              style={{ right: '15%', bottom: '10%' }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Modal slides up after click */}
      <AnimatePresence>
        {phase >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="bg-white rounded-xl border border-gray-200 shadow-xl p-2.5 flex-1"
          >
            <div className="text-[8px] font-black text-gray-900 mb-1.5">Create Affiliate Link</div>
            <div className="flex items-center gap-1 mb-1.5">
              {[1,2,3,4,5].map(n => (
                <motion.div key={n} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1 + n * 0.06 }}>
                  <Star className={`w-3 h-3 ${n <= 4 ? 'text-orange-400 fill-orange-400' : 'text-gray-200'}`} />
                </motion.div>
              ))}
              <span className="text-[7px] text-gray-400 ml-1">Your Rating</span>
            </div>
            <div className="bg-gray-50 rounded-lg p-1.5 mb-1.5">
              <motion.span initial={{ width: 0 }} animate={{ width: 'auto' }} className="text-[7px] text-gray-400 italic block overflow-hidden whitespace-nowrap">
                Great product, amazing build quality...
              </motion.span>
            </div>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
              className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[8px] font-black text-emerald-700">Link Generated!</div>
                <div className="text-[6px] text-emerald-600 font-mono truncate">collabo.com/?ref=cr-a8f2&pid=42</div>
              </div>
              <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ delay: 1.2, duration: 0.4 }}>
                <Copy className="w-3 h-3 text-emerald-600" />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── STEP 3: Share & Promote Visual ─── */
const ShareVisual = () => (
  <div className="w-full h-full flex flex-col gap-2 overflow-hidden">
    {/* Header */}
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="flex items-center gap-2">
      <Film className="w-3.5 h-3.5 text-orange-500" />
      <span className="text-[9px] font-bold text-gray-900">Promo Content (3 files)</span>
      <div className="flex-1" />
      <span className="text-[7px] text-gray-400 font-semibold">Brand Approved ✓</span>
    </motion.div>
    {/* Media Grid */}
    <div className="grid grid-cols-3 gap-1.5">
      {[
        { type: 'video', label: 'Product Demo' },
        { type: 'photo', label: 'Lifestyle Shot' },
        { type: 'photo', label: 'Close-up' },
      ].map((m, i) => (
        <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.15 }}
          className="bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl border border-gray-200 flex flex-col items-center justify-center relative overflow-hidden aspect-square">
          {m.type === 'video' ? (
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} className="w-8 h-8 bg-orange-500/10 rounded-full flex items-center justify-center">
              <Play className="w-4 h-4 text-orange-500" />
            </motion.div>
          ) : (
            <Heart className="w-5 h-5 text-gray-300" />
          )}
          <span className="text-[6px] text-gray-400 font-bold mt-1">{m.label}</span>
          <div className="absolute top-1 right-1 bg-white/80 rounded px-1 py-0.5 text-[5px] font-bold text-gray-500 uppercase">{m.type}</div>
        </motion.div>
      ))}
    </div>
    {/* Media Item Rows */}
    {[
      { name: 'Product Demo Video', type: 'VIDEO • 0:45', delay: 0.7 },
      { name: 'Lifestyle Photo Pack', type: 'IMAGE • 2 files', delay: 0.85 },
    ].map((m, i) => (
      <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: m.delay }}
        className="bg-white rounded-xl border border-gray-200 p-2 flex items-center gap-2">
        <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
          {i === 0 ? <Play className="w-4 h-4 text-gray-400" /> : <Heart className="w-4 h-4 text-gray-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[8px] font-bold text-gray-900">{m.name}</div>
          <div className="text-[7px] text-gray-400">{m.type}</div>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center">
            <ArrowRight className="w-3 h-3 text-gray-400" />
          </div>
          <motion.div animate={i === 0 ? { scale: [1, 1.15, 1] } : {}} transition={{ delay: 1.2, duration: 0.4 }}
            className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center">
            <Share2 className="w-3 h-3 text-orange-600" />
          </motion.div>
        </div>
      </motion.div>
    ))}
    {/* Share Buttons */}
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }} className="flex gap-1.5">
      {[
        { name: 'WhatsApp', color: 'bg-green-500', icon: '💬' },
        { name: 'Instagram', color: 'bg-gradient-to-br from-purple-500 to-pink-500', icon: '📸' },
        { name: 'YouTube', color: 'bg-red-500', icon: '▶️' },
        { name: 'Facebook', color: 'bg-blue-600', icon: '📘' },
      ].map((p, i) => (
        <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.1 + i * 0.1, type: 'spring' }}
          className={`flex-1 ${p.color} rounded-lg py-2.5 flex flex-col items-center justify-center gap-0.5 cursor-pointer hover:opacity-90 transition-opacity`}>
          <span className="text-xs">{p.icon}</span>
          <span className="text-[6px] text-white font-bold">{p.name}</span>
        </motion.div>
      ))}
    </motion.div>
    {/* Link attached note */}
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}
      className="bg-violet-50 border border-violet-100 rounded-lg px-2.5 py-2 flex items-center gap-1.5">
      <Link2 className="w-3 h-3 text-violet-500 shrink-0" />
      <span className="text-[7px] text-violet-600 font-semibold">Your referral link is auto-attached when sharing</span>
    </motion.div>
  </div>
);

/* ─── STEP 4: Track & Earn Visual ─── */
const EarnVisual = () => (
  <div className="w-full h-full flex flex-col gap-2 overflow-hidden">
    {/* Metric Cards */}
    <div className="grid grid-cols-3 gap-1.5">
      {[
        { label: 'Total Clicks', value: '1,847', bg: 'bg-violet-50', text: 'text-violet-700', icon: Users },
        { label: 'Conversions', value: '64', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: TrendingUp },
        { label: 'Commission', value: '₹12,450', bg: 'bg-violet-50', text: 'text-violet-700', icon: DollarSign },
      ].map((s, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.12 }}
          className={`${s.bg} rounded-xl p-2.5`}>
          <s.icon className={`w-3 h-3 ${s.text} mb-1`} />
          <div className={`text-sm font-black ${s.text}`}>{s.value}</div>
          <div className="text-[7px] text-gray-500 font-bold uppercase">{s.label}</div>
        </motion.div>
      ))}
    </div>
    {/* Affiliate Links List */}
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="bg-white rounded-xl border border-gray-100 shadow-sm p-2.5">
      <div className="text-[8px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">Your Affiliate Links</div>
      {[
        { name: 'Hydra-Glow Serum', clicks: 245, sales: 18, earned: '₹3,600', rating: 4 },
        { name: 'StealthPro Keyboard', clicks: 189, sales: 12, earned: '₹2,160', rating: 5 },
        { name: 'AeroPure Humidifier', clicks: 97, sales: 6, earned: '₹1,440', rating: 4 },
      ].map((ref, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 + i * 0.12 }}
          className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
          <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
            <Package className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[8px] font-bold text-gray-900 truncate">{ref.name}</div>
            <div className="flex items-center gap-1">
              {[...Array(ref.rating)].map((_, j) => <Star key={j} className="w-2 h-2 text-orange-400 fill-orange-400" />)}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[9px] font-black text-emerald-600">{ref.earned}</div>
            <div className="flex items-center gap-1">
              <span className="text-[6px] bg-gray-100 text-gray-500 font-bold px-1 py-0.5 rounded-full">{ref.clicks} clicks</span>
              <span className="text-[6px] bg-emerald-50 text-emerald-600 font-bold px-1 py-0.5 rounded-full">{ref.sales} sales</span>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
    {/* Link Copy Row */}
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.15 }}
      className="bg-white rounded-xl border border-gray-200 p-2 flex items-center gap-2">
      <div className="flex-1 bg-gray-50 rounded-lg px-2 py-1.5 flex items-center gap-1.5 overflow-hidden">
        <Link2 className="w-3 h-3 text-gray-400 shrink-0" />
        <span className="text-[7px] text-gray-500 font-mono truncate">collabo.com/?ref=cr-a8f2&pid=42</span>
      </div>
      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ delay: 1.4, duration: 0.3 }}
        className="text-[8px] font-black text-violet-600 bg-violet-50 px-2 py-1.5 rounded-lg cursor-pointer">COPY</motion.div>
    </motion.div>
    {/* Balance & Withdraw */}
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3 }}
      className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-3 border border-emerald-100">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[7px] text-emerald-600 font-bold uppercase tracking-wider">Available Balance</div>
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: 1.5, type: 'spring' }}
            className="text-lg font-black text-emerald-700">₹12,450</motion.div>
          <div className="text-[7px] text-emerald-500 font-semibold">After 10% platform fee</div>
        </div>
        <motion.div animate={{ scale: [1, 1.06, 1] }} transition={{ delay: 1.7, duration: 0.4 }}
          className="bg-emerald-600 text-white rounded-lg px-3 py-2 text-[8px] font-bold flex items-center gap-1 shadow-md">
          <Wallet className="w-3 h-3" /> Withdraw
        </motion.div>
      </div>
    </motion.div>
  </div>
);

const VISUALS = { dashboard: DashboardVisual, collab: CollabVisual, share: ShareVisual, earn: EarnVisual };

const BrandChoiceSection = () => {
  const [activeStep, setActiveStep] = useState(STEPS[0]);
  const [isPaused, setIsPaused] = useState(false);

  const goToNext = useCallback(() => {
    setActiveStep(prev => {
      const idx = STEPS.findIndex(s => s.id === prev.id);
      return STEPS[(idx + 1) % STEPS.length];
    });
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(goToNext, AUTOPLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [isPaused, goToNext]);

  const activeIdx = STEPS.findIndex(s => s.id === activeStep.id);

  return (
    <section className="py-12 sm:py-16 relative overflow-hidden bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div className="text-center mb-8">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full bg-primary-50 border border-primary-100 mb-3">
            <span className="text-primary-600 text-[11px] font-bold uppercase tracking-widest">How It Works</span>
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            className="text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 leading-tight tracking-tight">
            Start earning in{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-500">4 simple steps</span>
          </motion.h2>
          <motion.p initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
            className="text-gray-400 text-sm mt-2 max-w-md mx-auto">
            From signing up to getting paid — here's how creators grow with Collabo.
          </motion.p>
        </div>

        {/* Step Selector */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-4">
          {STEPS.map((step, idx) => (
            <motion.button key={step.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: 0.1 + idx * 0.08 }}
              onClick={() => { setActiveStep(step); setIsPaused(true); setTimeout(() => setIsPaused(false), 8000); }}
              className={`group flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-[11px] font-bold transition-all duration-300 border ${
                activeStep.id === step.id
                  ? 'bg-gray-900 text-white border-gray-900 shadow-lg shadow-gray-900/20'
                  : 'bg-white/60 text-gray-500 border-gray-200 hover:bg-white hover:border-gray-300'
              }`}>
              <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black ${
                activeStep.id === step.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'
              }`}>{step.step}</span>
              <span className="hidden sm:inline">{step.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Progress Bars */}
        <div className="flex items-center justify-center gap-1.5 mb-6">
          {STEPS.map((step, idx) => (
            <div key={step.id} className="h-[3px] flex-1 max-w-[50px] bg-gray-200 rounded-full overflow-hidden">
              {activeStep.id === step.id ? (
                <motion.div key={`${step.id}-bar`} initial={{ width: '0%' }} animate={{ width: '100%' }}
                  transition={{ duration: AUTOPLAY_INTERVAL / 1000, ease: 'linear' }}
                  className={`h-full rounded-full bg-gradient-to-r ${step.color}`} />
              ) : (
                <div className={`h-full rounded-full transition-all duration-300 ${idx < activeIdx ? `bg-gradient-to-r ${step.color}` : ''}`}
                  style={{ width: idx < activeIdx ? '100%' : '0%' }} />
              )}
            </div>
          ))}
        </div>

        {/* Content Card */}
        <AnimatePresence mode="wait">
          <motion.div key={activeStep.id}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            className="w-full bg-white/50 backdrop-blur-xl rounded-[28px] border border-white/60 shadow-[0_16px_48px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col lg:flex-row"
            onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>

            {/* Left: Info */}
            <div className="w-full lg:w-[45%] p-6 sm:p-8 flex flex-col justify-center">
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
                className={`w-9 h-9 rounded-xl bg-gradient-to-br ${activeStep.color} flex items-center justify-center mb-3 shadow-md`}>
                <activeStep.icon className="w-4.5 h-4.5 text-white" />
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
                className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                Step {activeStep.step} — {activeStep.label}
              </motion.div>
              <motion.h3 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="text-xl sm:text-2xl font-black text-gray-900 mb-2.5 leading-tight">
                {activeStep.title}
              </motion.h3>
              <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
                className="text-gray-500 text-xs mb-4 leading-relaxed max-w-sm">
                {activeStep.description}
              </motion.p>
              {/* Step Progress Dots */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex items-center gap-2">
                {STEPS.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full transition-all ${i <= activeIdx ? `bg-gradient-to-r ${s.color} shadow-sm` : 'bg-gray-200'}`} />
                    {i < STEPS.length - 1 && <div className={`w-6 h-[2px] rounded-full ${i < activeIdx ? 'bg-gray-300' : 'bg-gray-100'}`} />}
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right: Visual Mockup */}
            <div className="w-full lg:w-[55%] relative p-5 sm:p-6 lg:p-8 flex items-center justify-center bg-gradient-to-br from-gray-50/80 to-white/40">
              <div className="w-full max-w-[340px]">
                {React.createElement(VISUALS[activeStep.id])}
              </div>
              {/* Step Badge */}
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }}
                className="absolute top-3 right-3 bg-white border border-gray-100 shadow-md rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
                <div className={`w-5 h-5 rounded-md bg-gradient-to-br ${activeStep.color} flex items-center justify-center`}>
                  <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                </div>
                <div>
                  <div className="text-[7px] text-gray-400 font-bold uppercase">Step {activeStep.step}</div>
                  <div className="text-[9px] font-bold text-gray-900">{activeStep.label}</div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default BrandChoiceSection;
