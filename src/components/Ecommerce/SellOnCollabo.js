import React, { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import {
  Store, TrendingUp, Shield, Truck, BarChart3, Users, Package,
  ArrowRight, ArrowLeft, CheckCircle, ChevronDown, ChevronUp, Eye, EyeOff,
  Mail, Lock, User, Phone, AlertCircle, Upload
} from 'lucide-react';

const STEPS_INFO = [
  { step: '01', title: 'Create Account', desc: 'Sign up with email and phone. Takes under 2 minutes.' },
  { step: '02', title: 'Complete KYC', desc: 'Add GST, bank details, and upload verification documents.' },
  { step: '03', title: 'List Products', desc: 'Add products manually or bulk import via CSV from Shopify.' },
  { step: '04', title: 'Start Earning', desc: 'Receive orders, ship via Shiprocket, get paid to your bank.' },
];

const BENEFITS = [
  { icon: Users, title: 'Crores of Customers', desc: 'Instant visibility to our growing buyer base across India.' },
  { icon: TrendingUp, title: 'Influencer Marketing', desc: 'Creators promote your products. Pay only on actual sales.' },
  { icon: Truck, title: 'Easy Shipping', desc: 'Shiprocket integration with 17+ couriers. Auto-tracking.' },
  { icon: Shield, title: 'Secure Payments', desc: '7-day settlement. Transparent fees. Withdraw anytime.' },
  { icon: BarChart3, title: 'Seller Dashboard', desc: 'Real-time analytics, orders, inventory, and earnings.' },
  { icon: Package, title: 'Bulk Import', desc: 'Upload products from Shopify or any platform via CSV.' },
];

const FAQS = [
  { q: 'What documents do I need?', a: 'GST/Tax ID, bank account (number + IFSC), and a KYC document (PAN, Aadhaar, or business registration certificate).' },
  { q: 'What are the fees?', a: '10% platform commission per sale. No listing fees, no monthly charges.' },
  { q: 'How do I receive payments?', a: 'Earnings tracked in real-time. Withdraw anytime (min ₹100) to your bank account.' },
  { q: 'How does shipping work?', a: 'Use integrated Shiprocket (auto AWB + pickup) or enter your own tracking number.' },
];

function SellerRegistrationWidget() {
  const { register, user, fetchUser } = useAuth();
  const [phase, setPhase] = useState(user ? 'kyc' : 'register');
  const [regForm, setRegForm] = useState({ email: '', username: '', password: '', phone: '' });
  const [showPw, setShowPw] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');

  const [kycStep, setKycStep] = useState(1);
  const [storeName, setStoreName] = useState(user?.seller_profile?.store_name || '');
  const [businessAddress, setBusinessAddress] = useState(user?.seller_profile?.business_address || '');
  const [taxId, setTaxId] = useState(user?.seller_profile?.tax_id || '');
  const [bankName, setBankName] = useState(user?.seller_profile?.bank_name || '');
  const [bankAccount, setBankAccount] = useState(user?.seller_profile?.bank_account_number || '');
  const [bankIfsc, setBankIfsc] = useState(user?.seller_profile?.bank_ifsc || '');
  const [idType, setIdType] = useState('aadhaar');
  const [idNumber, setIdNumber] = useState('');
  const [kycDoc, setKycDoc] = useState(null);
  const [bankDoc, setBankDoc] = useState(null);
  const [kycError, setKycError] = useState('');
  const [kycSubmitting, setKycSubmitting] = useState(false);

  const handleFileUpload = useCallback((e, setter) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setKycError('File must be under 5MB'); return; }
    setter(file);
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError('');
    if (!regForm.email.trim()) { setRegError('Email is required'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regForm.email)) { setRegError('Please enter a valid email address'); return; }
    if (!regForm.username.trim()) { setRegError('Username is required'); return; }
    if (regForm.username.trim().length < 3) { setRegError('Username must be at least 3 characters'); return; }
    if (regForm.phone && !/^\d{10}$/.test(regForm.phone.replace(/\D/g, ''))) { setRegError('Phone number must be exactly 10 digits'); return; }
    if (regForm.password.length < 8) { setRegError('Password must be at least 8 characters'); return; }
    setRegLoading(true);
    const result = await register({
      ...regForm, password_confirm: regForm.password, user_type: 'buyer',
      phone: regForm.phone ? `+91${regForm.phone.replace(/^0+/, '')}` : '',
    });
    if (result.success) { setPhase('kyc'); }
    else { setRegError(result.error || 'Registration failed'); }
    setRegLoading(false);
  };

  const handleKycSubmit = async () => {
    setKycError('');
    if (kycStep === 1) {
      if (!storeName.trim()) return setKycError('Store name is required');
      if (storeName.trim().length < 3) return setKycError('Store name must be at least 3 characters');
      if (!businessAddress.trim()) return setKycError('Business address is required');
      if (businessAddress.trim().length < 10) return setKycError('Please enter a complete business address');
      setKycStep(2);
    } else if (kycStep === 2) {
      if (!taxId.trim() && !idNumber.trim()) return setKycError('Provide Tax ID (GSTIN/PAN) or Aadhaar/Voter ID number');
      if (taxId.trim()) {
        const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!gstRegex.test(taxId.trim().toUpperCase()) && !panRegex.test(taxId.trim().toUpperCase())) {
          return setKycError('Invalid Tax ID. Enter a valid 15-digit GSTIN or 10-character PAN (e.g. ABCDE1234F)');
        }
      }
      if (idNumber.trim()) {
        if (idType === 'aadhaar') {
          const cleaned = idNumber.replace(/\s/g, '');
          if (!/^\d{12}$/.test(cleaned)) return setKycError('Aadhaar number must be exactly 12 digits');
        } else if (idType === 'voter') {
          if (!/^[A-Z]{3}\d{7}$/.test(idNumber.trim().toUpperCase())) return setKycError('Voter ID must be 3 letters followed by 7 digits (e.g. ABC1234567)');
        } else if (idType === 'pan') {
          if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(idNumber.trim().toUpperCase())) return setKycError('PAN must be 10 characters: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)');
        }
      }
      if (!kycDoc) return setKycError('Please upload your ID proof document');
      setKycStep(3);
    } else if (kycStep === 3) {
      if (!bankName.trim()) return setKycError('Bank name is required');
      if (!bankIfsc.trim()) return setKycError('IFSC code is required');
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankIfsc.trim().toUpperCase())) return setKycError('Invalid IFSC code. Must be 11 characters (e.g. HDFC0001234)');
      if (!bankAccount.trim()) return setKycError('Account number is required');
      if (!/^\d{9,18}$/.test(bankAccount.trim())) return setKycError('Account number must be 9-18 digits');
      setKycStep(4);
    } else {
      setKycSubmitting(true);
      try {
        const fd = new FormData();
        fd.append('store_name', storeName);
        fd.append('tax_id', taxId || `${idType.toUpperCase()}: ${idNumber}`);
        fd.append('bank_name', bankName);
        fd.append('bank_account_number', bankAccount);
        fd.append('bank_ifsc', bankIfsc);
        fd.append('business_address', businessAddress);
        if (kycDoc instanceof File) fd.append('kyc_document_file', kycDoc);
        if (bankDoc instanceof File) fd.append('bank_document_file', bankDoc);
        await api.post('/auth/seller-profile/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        await fetchUser();
        setPhase('done');
      } catch (err) {
        setKycError(err.response?.data?.store_name?.[0] || err.response?.data?.detail || 'Submission failed');
      } finally { setKycSubmitting(false); }
    }
  };

  const sp = user?.seller_profile;
  const status = sp?.verification_status;

  if (status === 'approved' || user?.user_type === 'seller') {
    return (
      <div className="space-y-4">
        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 text-center space-y-2">
          <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
          <p className="text-sm font-semibold text-emerald-800">Your seller account is active</p>
          <p className="text-[11px] text-emerald-600">You can now list products and manage orders</p>
        </div>
        <a href="/" className="block w-full bg-orange-600 hover:bg-orange-700 text-white text-[12px] font-medium py-2.5 rounded-lg transition-colors text-center">
          Open Seller Dashboard
        </a>
      </div>
    );
  }

  if (status === 'pending' || phase === 'done') {
    return (
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 text-center space-y-2">
          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center mx-auto"><Store className="w-4 h-4 text-amber-600" /></div>
          <p className="text-sm font-semibold text-amber-800">Application submitted</p>
          <p className="text-[11px] text-amber-600">Our team will review your profile within 24-48 hours. We'll notify you once approved.</p>
        </div>
        <div className="flex gap-2">
          {['Registered', 'Under Review', 'Start Selling'].map((s, i) => (
            <div key={i} className={`flex-1 text-center py-2.5 rounded-lg text-[10px] font-medium ${i <= 1 ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-400'}`}>
              {i <= 1 && <CheckCircle className="w-3 h-3 mx-auto mb-0.5 text-amber-500" />}
              {s}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (status === 'rejected') {
    if (phase !== 'kyc') setPhase('kyc');
  }

  if (!user && phase === 'register') {
    return (
      <form onSubmit={handleRegister} className="space-y-3">
        <p className="text-[10px] text-gray-400 uppercase font-medium">Step 1 of 2 — Create Account</p>
        {regError && <div className="bg-red-50 border border-red-100 rounded-lg p-2.5 text-[11px] text-red-600 flex items-start gap-2"><AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />{regError}</div>}
        <div>
          <label className="block text-[10px] text-gray-500 font-medium mb-1">Business Name</label>
          <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input type="text" required value={regForm.username} onChange={e => setRegForm({...regForm, username: e.target.value})} placeholder="Your name or store name" className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:ring-1 focus:ring-orange-400" /></div>
        </div>
        <div>
          <label className="block text-[10px] text-gray-500 font-medium mb-1">Email</label>
          <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input type="email" required value={regForm.email} onChange={e => setRegForm({...regForm, email: e.target.value})} placeholder="you@business.com" className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:ring-1 focus:ring-orange-400" /></div>
        </div>
        <div>
          <label className="block text-[10px] text-gray-500 font-medium mb-1">Phone</label>
          <div className="flex"><div className="flex items-center px-3 bg-gray-50 border border-r-0 border-gray-200 rounded-l-lg"><span className="text-[11px] text-gray-500">+91</span></div>
          <input type="tel" value={regForm.phone} onChange={e => setRegForm({...regForm, phone: e.target.value.replace(/\D/g,'').slice(0,10)})} placeholder="10 digits" className="flex-1 px-3 py-2.5 border border-gray-200 rounded-r-lg text-[12px] focus:outline-none focus:ring-1 focus:ring-orange-400" /></div>
        </div>
        <div>
          <label className="block text-[10px] text-gray-500 font-medium mb-1">Password</label>
          <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input type={showPw?'text':'password'} required value={regForm.password} onChange={e => setRegForm({...regForm, password: e.target.value})} placeholder="Min 8 characters" className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:ring-1 focus:ring-orange-400" />
          <button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPw?<EyeOff className="w-3.5 h-3.5"/>:<Eye className="w-3.5 h-3.5"/>}</button></div>
        </div>
        <button type="submit" disabled={regLoading} className="w-full bg-orange-600 hover:bg-orange-700 text-white text-[12px] font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50">
          {regLoading ? 'Creating...' : 'Create Account & Continue'}
        </button>
        <p className="text-[9px] text-gray-400 text-center">Already have an account? <a href="/" className="text-orange-600 font-medium hover:underline">Login on store</a></p>
      </form>
    );
  }

  const inputCls = "w-full bg-white border border-gray-200 rounded-lg py-2.5 px-3 text-[12px] focus:outline-none focus:ring-1 focus:ring-orange-400";
  const labelCls = "block text-[10px] text-gray-500 font-medium mb-1";

  return (
    <div className="space-y-4">
      <p className="text-[10px] text-gray-400 uppercase font-medium">Step 2 of 2 — Seller Verification</p>
      {/* Progress */}
      <div className="flex gap-1.5">
        {[1,2,3,4].map(s => (
          <div key={s} className={`h-1 rounded-full flex-1 transition-all ${kycStep >= s ? 'bg-orange-500' : 'bg-gray-200'}`} />
        ))}
      </div>
      <p className="text-[11px] font-medium text-gray-700">
        {kycStep === 1 ? 'Store Profile' : kycStep === 2 ? 'Compliance & KYC' : kycStep === 3 ? 'Bank Details' : 'Review & Submit'}
      </p>

      {status === 'rejected' && kycStep === 1 && (
        <div className="bg-red-50 border border-red-100 rounded-lg p-2.5 text-[10px] text-red-600">
          <span className="font-medium">Rejected:</span> {sp?.rejection_reason || 'Please update your details and re-apply.'}
        </div>
      )}
      {kycError && <div className="bg-red-50 border border-red-100 rounded-lg p-2.5 text-[11px] text-red-600 flex items-start gap-2"><AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />{kycError}</div>}

      {kycStep === 1 && (
        <div className="space-y-3">
          <div><label className={labelCls}>Store Name *</label><input type="text" value={storeName} onChange={e=>setStoreName(e.target.value)} placeholder="e.g. My Premium Store" className={inputCls} /></div>
          <div><label className={labelCls}>Business Address *</label><textarea value={businessAddress} onChange={e=>setBusinessAddress(e.target.value)} placeholder="Full registered address" rows={2} className={inputCls + " resize-none"} /></div>
        </div>
      )}
      {kycStep === 2 && (
        <div className="space-y-3">
          <div><label className={labelCls}>Tax ID (GSTIN / PAN)</label><input type="text" value={taxId} onChange={e=>setTaxId(e.target.value)} placeholder="e.g. 27AAAAA1111A1Z1" className={inputCls} />
          <p className="text-[9px] text-gray-400 mt-0.5">Optional if you have Aadhaar/Voter ID below</p></div>
          <div>
            <label className={labelCls}>Identity Verification *</label>
            <div className="flex gap-2 mb-2">
              {[{id:'aadhaar',label:'Aadhaar Card'},{id:'voter',label:'Voter ID'},{id:'pan',label:'PAN Card'}].map(t=>(
                <button key={t.id} type="button" onClick={()=>setIdType(t.id)}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-medium transition-colors border ${
                    idType===t.id ? 'bg-orange-50 border-orange-300 text-orange-700' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}>{t.label}</button>
              ))}
            </div>
            <input type="text" value={idNumber} onChange={e=>setIdNumber(e.target.value)}
              placeholder={idType==='aadhaar'?'e.g. 1234 5678 9012':idType==='voter'?'e.g. ABC1234567':'e.g. ABCDE1234F'}
              className={inputCls} />
            <p className="text-[9px] text-gray-400 mt-0.5">{idType==='aadhaar'?'12-digit Aadhaar number':idType==='voter'?'Voter ID (EPIC) number':'10-character PAN number'}</p>
          </div>
          <div><label className={labelCls}>Upload ID Proof (PDF or Image) *</label><input type="file" accept=".pdf,image/*" onChange={e=>handleFileUpload(e,setKycDoc)} className={inputCls} />
          {kycDoc && <p className="text-[10px] text-emerald-600 mt-1">Attached: {kycDoc.name}</p>}
          <p className="text-[9px] text-gray-400 mt-0.5">Clear photo or scan of your {idType==='aadhaar'?'Aadhaar card (front & back)':idType==='voter'?'Voter ID card':' PAN card'}</p></div>
        </div>
      )}
      {kycStep === 3 && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Bank Name *</label><input type="text" value={bankName} onChange={e=>setBankName(e.target.value)} placeholder="e.g. HDFC Bank" className={inputCls} /></div>
            <div><label className={labelCls}>IFSC Code *</label><input type="text" value={bankIfsc} onChange={e=>setBankIfsc(e.target.value)} placeholder="e.g. HDFC0001234" className={inputCls} /></div>
          </div>
          <div><label className={labelCls}>Account Number *</label><input type="text" value={bankAccount} onChange={e=>setBankAccount(e.target.value)} placeholder="e.g. 50100234567890" className={inputCls} /></div>
          <div><label className={labelCls}>Bank Proof (Cheque / Statement)</label><input type="file" accept=".pdf,image/*" onChange={e=>handleFileUpload(e,setBankDoc)} className={inputCls} />
          {bankDoc && <p className="text-[10px] text-emerald-600 mt-1">Attached: {bankDoc.name}</p>}</div>
        </div>
      )}
      {kycStep === 4 && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-[11px]">
          {[
            ['Store', storeName], ['Address', businessAddress],
            ...(taxId ? [['Tax ID', taxId]] : []),
            ...(idNumber ? [[idType === 'aadhaar' ? 'Aadhaar' : idType === 'voter' ? 'Voter ID' : 'PAN', idNumber]] : []),
            ['Bank', `${bankName} — ${bankIfsc}`], ['Account', bankAccount],
          ].map(([l,v]) => (
            <div key={l} className="flex justify-between py-1 border-b border-gray-100 last:border-0">
              <span className="text-gray-500">{l}</span>
              <span className="font-medium text-gray-900 text-right max-w-[200px] truncate">{v}</span>
            </div>
          ))}
          {kycDoc && <p className="text-[10px] text-gray-500">KYC: {kycDoc.name}</p>}
          {bankDoc && <p className="text-[10px] text-gray-500">Bank proof: {bankDoc.name}</p>}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        {kycStep > 1 && (
          <button onClick={()=>{setKycError('');setKycStep(s=>s-1)}} className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-[12px] font-bold hover:bg-slate-200 transition-colors flex items-center gap-1.5 border border-slate-200">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        )}
        <button onClick={handleKycSubmit} disabled={kycSubmitting}
          className="flex-1 bg-orange-600 hover:bg-orange-700 text-white text-[12px] font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
          {kycSubmitting ? 'Submitting...' : kycStep === 4 ? <><CheckCircle className="w-4 h-4" /> Submit Application</> : <>Next <ArrowRight className="w-3.5 h-3.5" /></>}
        </button>
      </div>
    </div>
  );
}

export default function SellOnCollabo() {
  const [openFaq, setOpenFaq] = useState(null);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-lg font-semibold text-gray-900">Collabo</a>
            <span className="text-[9px] font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded">Seller Hub</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" className="text-[11px] font-medium text-gray-500 hover:text-gray-900 transition-colors hidden sm:inline">Continue shopping</a>
            {user ? (
              <a href="/" className="text-[11px] font-medium text-white bg-orange-600 px-4 py-1.5 rounded-lg hover:bg-orange-700 transition-colors">Go to Store</a>
            ) : (
              <a href="#register" className="text-[11px] font-medium text-white bg-orange-600 px-4 py-1.5 rounded-lg hover:bg-orange-700 transition-colors">Start Selling</a>
            )}
          </div>
        </div>
      </nav>

      <section className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div className="pt-4">
              <div className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1 mb-4">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                <span className="text-[10px] font-medium text-gray-600">Trusted by 500+ sellers across India</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-4">
                Sell online to crores of buyers on <span className="text-orange-600">Collabo</span>
              </h1>
              <p className="text-sm text-gray-500 leading-relaxed mb-6 max-w-md">
                Create your account, complete verification, and start selling. Zero listing fees. Get orders from day one.
              </p>
              <div className="space-y-3 mb-6">
                {['No listing fees — pay only 10% when you sell','Integrated shipping with Shiprocket (17+ couriers)','Influencers promote your products for free','7-day payment settlement to your bank'].map((t,i) => (
                  <div key={i} className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /><span className="text-[12px] text-gray-600">{t}</span></div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[{v:'500+',l:'Active Sellers'},{v:'₹2Cr+',l:'Monthly GMV'},{v:'50K+',l:'Products Listed'}].map(s=>(
                  <div key={s.l} className="text-center"><p className="text-lg font-bold text-gray-900">{s.v}</p><p className="text-[10px] text-gray-400">{s.l}</p></div>
                ))}
              </div>
            </div>
            <div id="register" className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm lg:sticky lg:top-20">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center"><Store className="w-4.5 h-4.5 text-orange-600" /></div>
                <div><h2 className="text-sm font-semibold text-gray-900">Become a Seller</h2><p className="text-[10px] text-gray-400">Complete all steps to start selling</p></div>
              </div>
              <SellerRegistrationWidget />
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
          <div className="text-center mb-10"><h2 className="text-xl font-semibold text-gray-900">How it works</h2><p className="text-xs text-gray-400 mt-1">4 steps to start selling</p></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STEPS_INFO.map((s,i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-5 border border-gray-100 relative">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mb-3"><span className="text-[11px] font-bold text-orange-600">{s.step}</span></div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">{s.title}</h3>
                <p className="text-[11px] text-gray-500 leading-relaxed">{s.desc}</p>
                {i < STEPS_INFO.length -1 && <ArrowRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 z-10" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
          <div className="text-center mb-10"><h2 className="text-xl font-semibold text-gray-900">Why sell on Collabo</h2></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BENEFITS.map((b,i) => (<div key={i} className="bg-white rounded-xl p-5 border border-gray-200"><b.icon className="w-5 h-5 text-gray-400 mb-3" /><h3 className="text-sm font-semibold text-gray-900 mb-1">{b.title}</h3><p className="text-[11px] text-gray-500 leading-relaxed">{b.desc}</p></div>))}
          </div>
        </div>
      </section>

      <section className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
          <div className="text-center mb-10"><h2 className="text-xl font-semibold text-gray-900">Simple pricing</h2></div>
          <div className="max-w-md mx-auto bg-white rounded-xl border border-gray-200 overflow-hidden">
            {[{l:'Listing Fee',v:'Free',h:true},{l:'Monthly Charge',v:'Free',h:true},{l:'Commission',v:'10% per sale',h:false},{l:'Settlement',v:'7 business days',h:false},{l:'Min Withdrawal',v:'₹100',h:false}].map((f,i)=>(
              <div key={i} className={`flex items-center justify-between px-5 py-3 ${i<4?'border-b border-gray-100':''}`}>
                <span className="text-[11px] text-gray-600">{f.l}</span>
                <span className={`text-[11px] font-semibold ${f.h?'text-emerald-600':'text-gray-900'}`}>{f.v}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
          <div className="text-center mb-10"><h2 className="text-xl font-semibold text-gray-900">FAQ</h2></div>
          <div className="max-w-2xl mx-auto space-y-2">
            {FAQS.map((f,i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button onClick={()=>setOpenFaq(openFaq===i?null:i)} className="w-full text-left px-5 py-3.5 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-gray-900">{f.q}</span>
                  {openFaq===i?<ChevronUp className="w-4 h-4 text-gray-400 shrink-0"/>:<ChevronDown className="w-4 h-4 text-gray-400 shrink-0"/>}
                </button>
                {openFaq===i && <div className="px-5 pb-3.5"><p className="text-[11px] text-gray-500 leading-relaxed">{f.a}</p></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Ready to grow your business?</h2>
          <p className="text-xs text-gray-400 mb-6">Join thousands of sellers on Collabo</p>
          <a href="#register" className="inline-block bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-8 py-2.5 rounded-lg transition-colors">Start Selling Now</a>
        </div>
      </section>

      <footer className="border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[10px] text-gray-400">Collabo Inc. All rights reserved. | support@collabo.com | +91 84481 19359</span>
          <div className="flex items-center gap-4 text-[10px] text-gray-400">
            <a href="/privacy" className="hover:text-gray-600">Privacy</a>
            <a href="/terms" className="hover:text-gray-600">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
