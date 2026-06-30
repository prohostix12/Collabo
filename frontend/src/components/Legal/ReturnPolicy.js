import React, { useEffect } from 'react';

const S = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-sm font-semibold text-gray-900 mb-2 pb-2 border-b border-gray-100">{title}</h2>
    <div className="text-[12px] text-gray-600 leading-relaxed space-y-2">{children}</div>
  </div>
);

const ReturnPolicy = () => {
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
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Return & Refund Policy</h1>
        <p className="text-[11px] text-gray-400 mb-8">Effective Date: June 18, 2026 | Last Updated: June 18, 2026</p>

        <S title="1. Return Window">
          <p>We offer a <strong>7-day return window</strong> from the date of delivery. If 7 calendar days have passed since you received the item, we cannot offer a return or exchange.</p>
          <p>To be eligible for a return, the item must be:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Unused and in the same condition as received</li>
            <li>In its original packaging with all tags, labels, and accessories intact</li>
            <li>Accompanied by the order confirmation or invoice</li>
          </ul>
        </S>

        <S title="2. Items Eligible for Return">
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Product received is damaged, defective, or broken</li>
            <li>Wrong product was delivered (different from what was ordered)</li>
            <li>Product is materially different from the listing description or images</li>
            <li>Missing parts, components, or accessories</li>
            <li>Product malfunction within 7 days of delivery (manufacturing defect)</li>
          </ul>
        </S>

        <S title="3. Items NOT Eligible for Return">
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Items returned after the 7-day window</li>
            <li>Used, washed, altered, or damaged by the customer</li>
            <li>Items without original packaging, tags, or labels</li>
            <li>Digital products, gift cards, or downloadable content</li>
            <li>Perishable goods (food, beverages, flowers)</li>
            <li>Personal hygiene products (undergarments, beauty products opened/used)</li>
            <li>Customized or personalized products</li>
            <li>Products marked as "Non-Returnable" on the product page</li>
          </ul>
        </S>

        <S title="4. How to Initiate a Return">
          <div className="space-y-2">
            {[
              { n: '1', t: 'Go to My Orders in your account and select the order you want to return' },
              { n: '2', t: 'Click "Request Return" and select the reason from the dropdown' },
              { n: '3', t: 'Upload photos of the product (required for damaged/defective items)' },
              { n: '4', t: 'Submit the request — our team will review within 24-48 hours' },
              { n: '5', t: 'If approved, a courier pickup will be scheduled or return instructions provided' },
              { n: '6', t: 'Refund is processed after we receive and inspect the returned item' },
            ].map(s => (
              <div key={s.n} className="flex items-start gap-3">
                <span className="w-5 h-5 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 mt-0.5">{s.n}</span>
                <p>{s.t}</p>
              </div>
            ))}
          </div>
          <p className="mt-2">Alternatively, you can email <a href="mailto:support@collabo.com | +91 84481 19359" className="text-gray-900 underline">support@collabo.com | +91 84481 19359</a> with your order ID and reason for return.</p>
        </S>

        <S title="5. Refund Policy">
          <p>Once your return is received and inspected, we will notify you of the approval or rejection of your refund.</p>
          <div className="bg-gray-50 rounded-lg p-3 mt-2 space-y-2 text-[11px]">
            <div className="flex justify-between py-1 border-b border-gray-100"><span className="text-gray-500">Prepaid Orders (UPI/Card/Netbanking)</span><span className="font-medium text-gray-900">Refunded to original payment method within 5-7 business days</span></div>
            <div className="flex justify-between py-1 border-b border-gray-100"><span className="text-gray-500">Cash on Delivery (COD)</span><span className="font-medium text-gray-900">Refunded via bank transfer or store credit within 7-10 business days</span></div>
            <div className="flex justify-between py-1 border-b border-gray-100"><span className="text-gray-500">Wallet Payments</span><span className="font-medium text-gray-900">Credited back to wallet within 3-5 business days</span></div>
            <div className="flex justify-between py-1"><span className="text-gray-500">Reward Points Used</span><span className="font-medium text-gray-900">Points restored to your account immediately</span></div>
          </div>
          <p className="mt-2 text-[11px] text-gray-500">Note: Shipping charges are non-refundable unless the return is due to our error (wrong/defective item).</p>
        </S>

        <S title="6. Exchanges">
          <p>We currently offer exchanges only for defective or damaged products. If you received a defective item, we will replace it with the same product at no additional cost.</p>
          <p>For size/color changes, we recommend returning the original item and placing a new order.</p>
        </S>

        <S title="7. Return Shipping">
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Defective/wrong item:</strong> We cover the return shipping cost. A pickup will be arranged.</li>
            <li><strong>Change of mind:</strong> Customer bears the return shipping cost (deducted from refund).</li>
            <li><strong>Seller error:</strong> Full refund including original shipping charges.</li>
          </ul>
        </S>

        <S title="8. Cancellation Policy">
          <p>You may cancel an order before it is shipped:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Before shipping:</strong> Full refund, no questions asked</li>
            <li><strong>After shipping, before delivery:</strong> Subject to courier's ability to intercept the shipment</li>
            <li><strong>After delivery:</strong> Follow the return process described above</li>
          </ul>
          <p className="mt-2">Sellers may cancel an order if the product is out of stock. You will receive a full refund in such cases.</p>
        </S>

        <S title="9. Seller Return Obligations">
          <p>Sellers on Collabo are required to accept returns that meet the above criteria. Repeated refusal to process legitimate returns may result in account suspension.</p>
        </S>

        <S title="10. Contact Us">
          <div className="bg-gray-50 rounded-lg p-3 text-[11px]">
            <p>For return-related queries:</p>
            <p className="mt-1"><strong>Email:</strong> <a href="mailto:support@collabo.com | +91 84481 19359" className="text-gray-900 underline">support@collabo.com | +91 84481 19359</a></p>
            <p><strong>Response Time:</strong> Within 24 hours on business days</p>
          </div>
        </S>
      </div>
    </div>
  );
};

export default ReturnPolicy;
