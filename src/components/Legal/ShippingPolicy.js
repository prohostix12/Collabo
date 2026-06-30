import React, { useEffect } from 'react';

const S = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-sm font-semibold text-gray-900 mb-2 pb-2 border-b border-gray-100">{title}</h2>
    <div className="text-[12px] text-gray-600 leading-relaxed space-y-2">{children}</div>
  </div>
);

const ShippingPolicy = () => {
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
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Shipping Policy</h1>
        <p className="text-[11px] text-gray-400 mb-8">Effective Date: June 18, 2026 | Last Updated: June 18, 2026</p>

        <S title="1. Order Processing">
          <p>All orders are processed within <strong>1-2 business days</strong> after payment confirmation. Orders placed on weekends or public holidays will be processed on the next business day.</p>
          <p>You will receive:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>An order confirmation email/SMS immediately after placing the order</li>
            <li>A shipping confirmation with tracking number once the order is dispatched</li>
            <li>Delivery updates via email and WhatsApp notifications</li>
          </ul>
        </S>

        <S title="2. Shipping Methods and Delivery Times">
          <div className="bg-gray-50 rounded-lg overflow-hidden mt-2">
            {[
              { method: 'Standard Delivery', time: '5-7 business days', cost: 'Free on orders above ₹1,500; otherwise ₹99' },
              { method: 'Express Delivery', time: '2-3 business days', cost: '₹149 (where available)' },
              { method: 'Same-Day Delivery', time: 'Same day (order before 12 PM)', cost: '₹249 (select cities only)' },
            ].map((s, i) => (
              <div key={i} className={`flex items-center justify-between p-3 text-[11px] ${i < 2 ? 'border-b border-gray-100' : ''}`}>
                <div>
                  <p className="font-medium text-gray-900">{s.method}</p>
                  <p className="text-gray-500">{s.time}</p>
                </div>
                <span className="text-gray-700 font-medium text-right">{s.cost}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-gray-500">Delivery times are estimates from the date of dispatch, not the order date. Actual delivery may vary based on location and courier capacity.</p>
        </S>

        <S title="3. Shipping Partners">
          <p>We ship through the following courier partners via our Shiprocket integration:</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {['Delhivery', 'BlueDart', 'DTDC', 'Ecom Express', 'India Post', 'Shadowfax', 'Xpressbees'].map(c => (
              <span key={c} className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-[10px] font-medium text-gray-700">{c}</span>
            ))}
          </div>
          <p className="mt-2">The courier is automatically assigned based on your PIN code and the best available rates/speed.</p>
        </S>

        <S title="4. Delivery Areas">
          <p>We currently deliver to serviceable PIN codes across India. You can check delivery availability for your PIN code on any product page before placing an order.</p>
          <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
            <li><strong>Metro cities:</strong> Bangalore, Mumbai, Delhi, Chennai, Hyderabad, Kolkata, Pune — fastest delivery</li>
            <li><strong>Tier 2 cities:</strong> Jaipur, Lucknow, Chandigarh, Kochi, Indore, etc. — standard timelines</li>
            <li><strong>Remote areas:</strong> May take 2-5 additional business days</li>
          </ul>
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mt-2 text-[11px] text-amber-800">
            International shipping is not available at this time. We are working on expanding our delivery network.
          </div>
        </S>

        <S title="5. Shipping Charges">
          <div className="bg-gray-50 rounded-lg overflow-hidden mt-2">
            {[
              { condition: 'Orders above ₹1,500', charge: 'Free Standard Shipping' },
              { condition: 'Orders below ₹1,500', charge: '₹99 flat rate' },
              { condition: 'COD orders', charge: '₹49 additional handling fee' },
              { condition: 'Heavy/bulky items', charge: 'May incur additional charges (shown at checkout)' },
            ].map((s, i) => (
              <div key={i} className={`flex items-center justify-between p-3 text-[11px] ${i < 3 ? 'border-b border-gray-100' : ''}`}>
                <span className="text-gray-600">{s.condition}</span>
                <span className="text-gray-900 font-medium">{s.charge}</span>
              </div>
            ))}
          </div>
        </S>

        <S title="6. Order Tracking">
          <p>Once your order is shipped, you can track it through:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>My Orders page:</strong> Click on any order to view tracking details, shipping provider, and AWB number</li>
            <li><strong>Email/SMS:</strong> Tracking link sent with dispatch notification</li>
            <li><strong>Courier website:</strong> Use the AWB/tracking number on the courier's website directly</li>
          </ul>
        </S>

        <S title="7. Failed Delivery Attempts">
          <p>If delivery is attempted and you are unavailable:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>The courier will attempt delivery up to 2-3 times</li>
            <li>After failed attempts, the package will be returned to the seller</li>
            <li>For prepaid orders, a refund will be initiated after the package returns to the warehouse</li>
            <li>For COD orders, the order will be cancelled</li>
          </ul>
        </S>

        <S title="8. Damaged in Transit">
          <p>If your package arrives damaged:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Do NOT accept the package if visibly damaged — refuse delivery</li>
            <li>If damage is discovered after opening, take photos immediately</li>
            <li>File a return request within 48 hours with photos of the damage</li>
            <li>We will arrange a replacement or full refund at no additional cost</li>
          </ul>
        </S>

        <S title="9. Delays and Exceptions">
          <p>Delivery may be delayed due to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Natural disasters, extreme weather conditions</li>
            <li>Public holidays, regional festivals</li>
            <li>Courier capacity constraints or strikes</li>
            <li>Government restrictions or lockdowns</li>
            <li>Incorrect or incomplete delivery address</li>
          </ul>
          <p className="mt-2">We will notify you of significant delays via email. For orders delayed beyond 15 days, you may request a cancellation and full refund.</p>
        </S>

        <S title="10. Contact Us">
          <div className="bg-gray-50 rounded-lg p-3 text-[11px]">
            <p>For shipping-related queries:</p>
            <p className="mt-1"><strong>Email:</strong> <a href="mailto:support@collabo.com | +91 84481 19359" className="text-gray-900 underline">support@collabo.com | +91 84481 19359</a></p>
            <p><strong>Response Time:</strong> Within 24 hours on business days</p>
          </div>
        </S>
      </div>
    </div>
  );
};

export default ShippingPolicy;
