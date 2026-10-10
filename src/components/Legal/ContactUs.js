import React, { useEffect } from 'react';

const ContactUs = () => {
  // SEO meta tags
  useEffect(() => {
    document.title = "Contact Us - Collabo";
    const meta = document.createElement('meta');
    meta.name = "description";
    meta.content = "Get in touch with Collabo Marketplace. Support email, phone number, and office address for assistance.";
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  return (
    <section className="min-h-screen bg-white py-12 sm:py-16 lg:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Contact Us</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Support Email</h2>
            <p className="text-gray-600"><a href="mailto:support@collabo.com" className="text-blue-600 hover:underline">support@collabo.com</a></p>
            <h2 className="text-xl font-semibold text-gray-800 mt-6">Phone</h2>
            <p className="text-gray-600"><a href="tel:+918448119359" className="text-blue-600 hover:underline">+91 84481 19359</a></p>
          </div>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Office / Billing Address</h2>
            <p className="text-gray-600">
              Collabo Marketplace Inc.<br />
              H-123, Sector 63,<br />
              Noida, Uttar Pradesh, 201301<br />
              India
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactUs;
