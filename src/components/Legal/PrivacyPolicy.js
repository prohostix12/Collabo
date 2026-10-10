import React, { useEffect } from 'react';

const S = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-sm font-semibold text-gray-900 mb-2 pb-2 border-b border-gray-100">{title}</h2>
    <div className="text-[12px] text-gray-600 leading-relaxed space-y-2">{children}</div>
  </div>
);

const PrivacyPolicy = () => {
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
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Privacy Policy</h1>
        <p className="text-[11px] text-gray-400 mb-8">Effective Date: June 18, 2026 | Last Updated: June 18, 2026</p>

        <S title="1. Introduction">
          <p>Collabo Marketplace Inc. ("Collabo", "we", "us", or "our") operates the website and mobile application at collabo.com (the "Platform"). This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you visit or use our Platform.</p>
          <p>By accessing or using Collabo, you agree to the terms of this Privacy Policy. If you do not agree, please discontinue use of the Platform immediately.</p>
        </S>

        <S title="2. Information We Collect">
          <p><strong>a) Information You Provide Directly:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Account registration details: full name, email address, phone number, username, password</li>
            <li>Seller KYC information: GST/Tax ID, Aadhaar/Voter ID/PAN, bank account details, business address</li>
            <li>Delivery addresses: name, phone, street address, city, state, PIN code</li>
            <li>Payment information: payment method selection (we do not store card numbers — processed by Razorpay)</li>
            <li>Communications: support tickets, chat messages, product reviews, ratings</li>
          </ul>
          <p className="mt-2"><strong>b) Information Collected Automatically:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Device information: browser type, operating system, screen resolution</li>
            <li>Usage data: pages visited, products viewed, search queries, session duration</li>
            <li>IP address, approximate location (city-level), referral URLs</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>
          <p className="mt-2"><strong>c) Information from Third Parties:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Payment verification data from Razorpay</li>
            <li>Shipping and delivery status from courier partners (Shiprocket, Delhivery, etc.)</li>
            <li>Social media profile data if you connect Instagram, YouTube, or Facebook accounts</li>
          </ul>
        </S>

        <S title="3. How We Use Your Information">
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>To create, maintain, and secure your account</li>
            <li>To process orders, payments, returns, and refunds</li>
            <li>To verify seller identity through KYC documentation</li>
            <li>To deliver products to your shipping address</li>
            <li>To send order confirmations, shipping updates, and delivery notifications (email, SMS, WhatsApp)</li>
            <li>To personalize your shopping experience and product recommendations</li>
            <li>To calculate and distribute influencer/affiliate commissions</li>
            <li>To detect and prevent fraud, abuse, and security incidents</li>
            <li>To comply with legal obligations and respond to lawful requests</li>
            <li>To improve Platform performance, fix bugs, and develop new features</li>
            <li>To send promotional communications (with your consent; you may opt out at any time)</li>
          </ul>
        </S>

        <S title="4. Information Sharing and Disclosure">
          <p>We do not sell, rent, or trade your personal information. We may share data with:</p>
          <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
            <li><strong>Payment Processors:</strong> Razorpay processes payments on our behalf. They receive only the data necessary to complete transactions.</li>
            <li><strong>Shipping Partners:</strong> Courier services (Shiprocket, Delhivery, BlueDart, etc.) receive your delivery address and phone number to fulfill orders.</li>
            <li><strong>Sellers:</strong> When you place an order, the seller receives your name, delivery address, and order details to fulfill the shipment.</li>
            <li><strong>Communication Services:</strong> WhatsApp (via Gupshup API) and email services for transactional notifications.</li>
            <li><strong>Legal Authorities:</strong> When required by law, court order, or to protect our rights and safety.</li>
            <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets.</li>
          </ul>
        </S>

        <S title="5. Data Retention">
          <p>We retain your personal information for as long as your account is active or as needed to provide services. After account deletion, we may retain certain data for up to 5 years for legal, tax, and audit purposes. Anonymized analytics data may be retained indefinitely.</p>
        </S>

        <S title="6. Cookies and Tracking">
          <p>We use cookies and local storage to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Maintain your login session (JWT authentication tokens)</li>
            <li>Remember your cart contents and preferences</li>
            <li>Track referral codes for affiliate commission attribution</li>
            <li>Analyze usage patterns to improve the Platform</li>
          </ul>
          <p className="mt-2">You can control cookies through your browser settings. Disabling cookies may affect Platform functionality.</p>
        </S>

        <S title="7. Data Security">
          <p>We implement industry-standard security measures including:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>HTTPS/SSL encryption for all data in transit</li>
            <li>Password hashing using bcrypt</li>
            <li>JWT token-based authentication with expiration</li>
            <li>AWS RDS PostgreSQL with SSL certificate verification</li>
            <li>Role-based access controls for admin, seller, and buyer accounts</li>
            <li>File upload validation and size limits for KYC documents</li>
          </ul>
          <p className="mt-2">No method of electronic transmission or storage is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.</p>
        </S>

        <S title="8. Your Rights">
          <p>You have the right to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
            <li><strong>Correction:</strong> Update or correct inaccurate information</li>
            <li><strong>Deletion:</strong> Request deletion of your account and personal data</li>
            <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
            <li><strong>Opt-out:</strong> Unsubscribe from marketing communications at any time</li>
            <li><strong>Withdraw Consent:</strong> Where processing is based on consent, you may withdraw it at any time</li>
          </ul>
          <p className="mt-2">To exercise these rights, email us at <a href="mailto:privacy@collabo.com | +91 84481 19359" className="text-gray-900 underline">privacy@collabo.com | +91 84481 19359</a>. We will respond within 30 days.</p>
        </S>

        <S title="9. Children's Privacy">
          <p>Collabo is not intended for individuals under 18 years of age. We do not knowingly collect personal information from minors. If we discover that a child under 18 has provided personal data, we will delete it promptly.</p>
        </S>

        <S title="10. International Users">
          <p>Collabo is based in India. If you access the Platform from outside India, your information may be transferred to and processed in India. By using the Platform, you consent to such transfer.</p>
        </S>

        <S title="11. Changes to This Policy">
          <p>We may update this Privacy Policy from time to time. Material changes will be notified via email or a prominent notice on the Platform. The "Last Updated" date at the top reflects the most recent revision. Continued use after changes constitutes acceptance.</p>
        </S>

        <S title="12. Grievance Officer">
          <p>In accordance with the Information Technology Act, 2000 and the rules made thereunder, the Grievance Officer for the purpose of this Privacy Policy is:</p>
          <div className="bg-gray-50 rounded-lg p-3 mt-2 text-[11px]">
            <p><strong>Name:</strong> Collabo Privacy Team</p>
            <p><strong>Email:</strong> <a href="mailto:privacy@collabo.com | +91 84481 19359" className="text-gray-900 underline">privacy@collabo.com | +91 84481 19359</a></p>
            <p><strong>Address:</strong> Collabo Marketplace Inc., India</p>
            <p className="mt-1 text-gray-400">Response time: Within 30 days of receiving the grievance</p>
          </div>
        </S>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
