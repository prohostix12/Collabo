import React, { useState } from 'react';
import { Mail, Phone, MapPin, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    try {
      const res = await api.post('/ecommerce/newsletter/subscribe/', { email: email.trim() });
      setStatus('success');
      setMessage(res.data.message || 'Successfully subscribed!');
      setEmail('');
      setTimeout(() => setStatus('idle'), 4000);
    } catch (err) {
      setStatus('error');
      const errMsg = err.response?.data?.error || err.response?.data?.email?.[0] || 'Something went wrong.';
      setMessage(errMsg);
      setTimeout(() => setStatus('idle'), 4000);
    }
  };

  return (
    <footer className="mt-auto">
      {/* Newsletter strip */}
      <div className="bg-[#1B5E6B]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-black text-white tracking-tight">Get updates on new deals & offers</h4>
            <p className="text-[11px] text-white/70 font-medium mt-0.5">Subscribe for the latest arrivals, exclusive discounts & more.</p>
          </div>
          <form onSubmit={handleSubscribe} className="flex gap-2 w-full sm:w-auto">
            <input
              type="email"
              required
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === 'loading'}
              className="flex-1 sm:w-64 bg-white text-slate-800 placeholder-slate-400 text-xs font-medium rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#ff9f00] transition-all disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="bg-[#ff9f00] hover:bg-[#e88f00] text-white text-xs font-bold px-5 py-2.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm whitespace-nowrap disabled:opacity-60"
            >
              {status === 'loading' ? (
                <><Loader2 className="w-3 h-3 animate-spin" /> Subscribing...</>
              ) : status === 'success' ? (
                <><CheckCircle2 className="w-3 h-3" /> Subscribed!</>
              ) : (
                <>Subscribe <ArrowRight className="w-3 h-3" /></>
              )}
            </button>
          </form>
          {status !== 'idle' && status !== 'loading' && (
            <p className={`text-[11px] font-semibold w-full sm:w-auto text-center sm:text-right ${status === 'success' ? 'text-emerald-200' : 'text-red-200'}`}>{message}</p>
          )}
        </div>
      </div>

      {/* Main footer */}
      <div className="bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand + Contact */}
            <div>
              <img src="/collabo-logo.png" alt="Collabo" className="h-20 object-contain mb-3 scale-[1.6] origin-left transform" />
              <p className="text-[12px] text-slate-500 leading-relaxed mb-5">
                Your one-stop marketplace for quality products. Shop smart, sell easy.
              </p>
              <div className="space-y-3">
                <a href="mailto:support@collabo.com" className="flex items-center gap-2.5 text-[12px] text-slate-500 hover:text-[#1B5E6B] transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-[#1B5E6B]/5 group-hover:bg-[#1B5E6B]/10 flex items-center justify-center shrink-0 transition-colors">
                    <Mail className="w-3.5 h-3.5 text-[#1B5E6B]" />
                  </div>
                  support@collabo.com
                </a>
                <a href="tel:+918448119359" className="flex items-center gap-2.5 text-[12px] text-slate-500 hover:text-[#1B5E6B] transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-[#1B5E6B]/5 group-hover:bg-[#1B5E6B]/10 flex items-center justify-center shrink-0 transition-colors">
                    <Phone className="w-3.5 h-3.5 text-[#1B5E6B]" />
                  </div>
                  +91 84481 19359
                </a>
                <div className="flex items-start gap-2.5 text-[12px] text-slate-500">
                  <div className="w-8 h-8 rounded-lg bg-[#1B5E6B]/5 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-[#1B5E6B]" />
                  </div>
                  <span>Collabo Marketplace Inc.,<br/>H-123, Sector 63, Noida,<br/>Uttar Pradesh, 201301, India</span>
                </div>
              </div>
            </div>

            {/* Shop */}
            <div>
              <h4 className="text-[11px] font-black text-[#1B5E6B] uppercase tracking-widest mb-4 pb-2 border-b-2 border-[#ff9f00] inline-block">Shop</h4>
              <ul className="space-y-3">
                <li><Link to="/" className="text-[12px] text-slate-500 hover:text-[#1B5E6B] transition-colors font-medium">Browse Products</Link></li>
                <li><Link to="/sell" className="text-[12px] text-slate-500 hover:text-[#1B5E6B] transition-colors font-medium">Sell on Collabo</Link></li>
                <li><Link to="/collab" className="text-[12px] text-slate-500 hover:text-[#1B5E6B] transition-colors font-medium">For Creators</Link></li>
                <li><Link to="/dashboard" className="text-[12px] text-slate-500 hover:text-[#1B5E6B] transition-colors font-medium">Dashboard</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-[11px] font-black text-[#1B5E6B] uppercase tracking-widest mb-4 pb-2 border-b-2 border-[#ff9f00] inline-block">Support</h4>
              <ul className="space-y-3">
                <li><a href="/#support" className="text-[12px] text-slate-500 hover:text-[#1B5E6B] transition-colors font-medium">Contact Support</a></li>
                <li><a href="tel:+918448119359" className="text-[12px] text-slate-500 hover:text-[#1B5E6B] transition-colors font-medium">Call Us</a></li>
                <li><Link to="/shipping-policy" className="text-[12px] text-slate-500 hover:text-[#1B5E6B] transition-colors font-medium">Shipping Info</Link></li>
                <li><Link to="/return-policy" className="text-[12px] text-slate-500 hover:text-[#1B5E6B] transition-colors font-medium">Returns & Refunds</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-[11px] font-black text-[#1B5E6B] uppercase tracking-widest mb-4 pb-2 border-b-2 border-[#ff9f00] inline-block">Legal</h4>
              <ul className="space-y-3">
                <li><Link to="/privacy" className="text-[12px] text-slate-500 hover:text-[#1B5E6B] transition-colors font-medium">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-[12px] text-slate-500 hover:text-[#1B5E6B] transition-colors font-medium">Terms of Service</Link></li>
                <li><Link to="/return-policy" className="text-[12px] text-slate-500 hover:text-[#1B5E6B] transition-colors font-medium">Return Policy</Link></li>
                <li><Link to="/shipping-policy" className="text-[12px] text-slate-500 hover:text-[#1B5E6B] transition-colors font-medium">Shipping Policy</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-100 bg-slate-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[10px] text-slate-400 font-medium">
              &copy; {currentYear} Collabo Marketplace Inc. All rights reserved.
            </p>
            <p className="text-[10px] text-slate-400 font-medium text-right sm:text-left">
              support@collabo.com &middot; +91 84481 19359<br/>
              Address: H-123, Sector 63, Noida, UP, 201301, India
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
