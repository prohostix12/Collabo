import React, { useEffect } from 'react';

const S = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-sm font-semibold text-gray-900 mb-2 pb-2 border-b border-gray-100">{title}</h2>
    <div className="text-[12px] text-gray-600 leading-relaxed space-y-2">{children}</div>
  </div>
);

const TermsConditions = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="text-lg font-semibold text-gray-900">Collabo</a>
          <a href="/" className="text-[11px] font-bold text-white bg-gray-900 hover:bg-gray-800 px-4 py-1.5 rounded-full transition-colors">Continue shopping</a>
        </div>
      </nav>
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Terms of Service</h1>
        <p className="text-[11px] text-gray-400 mb-8">Effective Date: June 18, 2026 | Last Updated: June 18, 2026</p>

        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-8 text-[11px] text-amber-800">
          Please read these Terms carefully before using Collabo. By creating an account or placing an order, you agree to be bound by these Terms.
        </div>

        <S title="1. Acceptance of Terms">
          <p>By accessing or using the Collabo platform ("Platform"), you confirm that you are at least 18 years of age, have the legal capacity to enter into a binding agreement, and agree to comply with these Terms of Service ("Terms") and our Privacy Policy.</p>
        </S>

        <S title="2. Definitions">
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>"Buyer"</strong> — any user who purchases products on the Platform</li>
            <li><strong>"Seller"</strong> — any user approved to list and sell products on the Platform</li>
            <li><strong>"Influencer"</strong> — any user who promotes products through affiliate/referral links</li>
            <li><strong>"Platform"</strong> — the Collabo website, mobile app, and all related services</li>
            <li><strong>"Content"</strong> — text, images, videos, reviews, and other materials uploaded to the Platform</li>
          </ul>
        </S>

        <S title="3. Account Registration">
          <p>You must register for an account to buy, sell, or promote products. You agree to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Provide accurate, current, and complete registration information</li>
            <li>Keep your credentials confidential and not share them with others</li>
            <li>Notify us immediately of any unauthorized access to your account</li>
            <li>Accept responsibility for all activities that occur under your account</li>
          </ul>
          <p className="mt-2">We reserve the right to suspend or terminate accounts that violate these Terms or contain false information.</p>
        </S>

        <S title="4. Buyer Terms">
          <p>As a buyer, you agree that:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>All orders are subject to product availability and delivery serviceability to your PIN code</li>
            <li>Prices are listed in Indian Rupees (INR) and include applicable taxes unless stated otherwise</li>
            <li>Payment must be completed at the time of order (for prepaid orders) or at delivery (for COD)</li>
            <li>Order cancellation, returns, and refunds are governed by our Return Policy</li>
            <li>Product images are representative; actual products may vary slightly in appearance</li>
            <li>Delivery timelines are estimates and may vary due to factors beyond our control</li>
          </ul>
        </S>

        <S title="5. Seller Terms">
          <p>Sellers must complete KYC verification and be approved by our admin team before listing products. As a seller, you agree to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Provide accurate product information, descriptions, images, and pricing</li>
            <li>Maintain adequate stock for listed products</li>
            <li>Ship orders within the committed timeline (1-2 business days)</li>
            <li>Accept and process returns/refunds in accordance with our Return Policy</li>
            <li>Pay the platform commission (currently 10%) on each completed sale</li>
            <li>Comply with all applicable laws, including GST regulations and consumer protection laws</li>
            <li>Not list prohibited, illegal, counterfeit, or restricted items</li>
          </ul>
          <p className="mt-2">Collabo reserves the right to delist products, suspend seller accounts, or withhold payouts for policy violations.</p>
        </S>

        <S title="6. Influencer/Affiliate Terms">
          <p>Influencers who promote products through referral links agree to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Promote products honestly and not make false or misleading claims</li>
            <li>Disclose paid partnerships and affiliate relationships as required by applicable advertising regulations</li>
            <li>Not artificially inflate clicks, conversions, or commission earnings</li>
            <li>Accept the commission rates set by the platform/seller for each product</li>
          </ul>
          <p className="mt-2">Commission payouts are processed per the schedule in your seller/influencer dashboard. We reserve the right to reverse commissions from fraudulent or cancelled orders.</p>
        </S>

        <S title="7. Payments">
          <p>We use Razorpay as our payment processor. By making a payment, you also agree to Razorpay's terms of service. We support UPI, credit/debit cards, net banking, wallets, and Cash on Delivery (COD).</p>
          <p>Seller payouts are settled within 7 business days of order delivery. Minimum withdrawal amount is INR 100.</p>
        </S>

        <S title="8. Intellectual Property">
          <p>All content on the Platform — including logos, text, graphics, UI design, and software — is the property of Collabo or its licensors and is protected by applicable intellectual property laws.</p>
          <p>By uploading content (product images, reviews, etc.), you grant Collabo a non-exclusive, royalty-free, worldwide license to use, display, and distribute that content in connection with operating the Platform.</p>
        </S>

        <S title="9. Prohibited Conduct">
          <p>You must not:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Use the Platform for any unlawful purpose</li>
            <li>Post false, misleading, defamatory, or fraudulent content</li>
            <li>Impersonate any person, entity, or Collabo representative</li>
            <li>Attempt to gain unauthorized access to our systems or other user accounts</li>
            <li>Use automated tools (bots, scrapers) without written permission</li>
            <li>Manipulate product ratings, reviews, or affiliate metrics</li>
            <li>Sell counterfeit, prohibited, or stolen goods</li>
          </ul>
        </S>

        <S title="10. Limitation of Liability">
          <p>To the fullest extent permitted by law, Collabo shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities, arising from your use of the Platform.</p>
          <p>Our total liability for any claim shall not exceed the amount you paid to Collabo in the 12 months preceding the claim.</p>
        </S>

        <S title="11. Disclaimer of Warranties">
          <p>The Platform is provided "as is" and "as available" without warranties of any kind, express or implied. We do not warrant that the Platform will be uninterrupted, error-free, secure, or free of viruses.</p>
        </S>

        <S title="12. Indemnification">
          <p>You agree to indemnify and hold harmless Collabo, its officers, directors, employees, and agents from any claims, damages, losses, or expenses (including legal fees) arising from your violation of these Terms or misuse of the Platform.</p>
        </S>

        <S title="13. Termination">
          <p>We may suspend or terminate your account at any time, with or without notice, for conduct that violates these Terms, is harmful to other users, or is otherwise objectionable. Upon termination, your right to use the Platform ceases immediately.</p>
        </S>

        <S title="14. Governing Law and Dispute Resolution">
          <p>These Terms are governed by the laws of India. Any disputes shall be resolved through binding arbitration in accordance with the Arbitration and Conciliation Act, 1996, with proceedings held in Bangalore, Karnataka. The language of arbitration shall be English.</p>
        </S>

        <S title="15. Changes to These Terms">
          <p>We may modify these Terms at any time. Material changes will be communicated via email or a prominent notice on the Platform at least 15 days before taking effect. Continued use after the effective date constitutes acceptance of the revised Terms.</p>
        </S>

        <S title="16. Contact Us">
          <div className="bg-gray-50 rounded-lg p-3 text-[11px]">
            <p><strong>Collabo Marketplace Inc.</strong></p>
            <p>Email: <a href="mailto:legal@collabo.com | +91 84481 19359" className="text-gray-900 underline">legal@collabo.com | +91 84481 19359</a></p>
            <p>Support: <a href="mailto:support@collabo.com" className="text-gray-900 underline">support@collabo.com</a></p>
          </div>
        </S>
      </div>
    </div>
  );
};

export default TermsConditions;
