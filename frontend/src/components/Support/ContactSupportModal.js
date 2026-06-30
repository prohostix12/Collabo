import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// eslint-disable-next-line no-unused-vars
import { X, Upload, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ContactSupportModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    subject: '',
    category: 'technical',
    message: '',
    priority: 'medium',
  });
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');

  const categories = [
    { value: 'technical', label: 'Technical Issue', icon: '🔧' },
    { value: 'payment', label: 'Payment', icon: '💳' },
    { value: 'campaign', label: 'Campaign', icon: '📢' },
    { value: 'account', label: 'Account', icon: '👤' },
    { value: 'partnership', label: 'Partnership', icon: '🤝' },
    { value: 'other', label: 'Other', icon: '💬' },
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'text-gray-600 bg-gray-100' },
    { value: 'medium', label: 'Medium', color: 'text-blue-600 bg-blue-100' },
    { value: 'high', label: 'High', color: 'text-red-600 bg-red-100' },
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleScreenshotChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Screenshot size should be less than 5MB');
        return;
      }
      setScreenshot(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.subject.trim().length < 5) {
      toast.error('Subject must be at least 5 characters long');
      return;
    }
    
    if (formData.message.trim().length < 10) {
      toast.error('Message must be at least 10 characters long');
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append('subject', formData.subject);
      submitData.append('category', formData.category);
      submitData.append('message', formData.message);
      submitData.append('priority', formData.priority);
      
      if (screenshot) {
        submitData.append('screenshot', screenshot);
      }

      const response = await api.post('/support/tickets/', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setTicketNumber(response.data.ticket.ticket_number);
      setShowSuccess(true);
      toast.success('Support ticket created successfully!');
      
      // Reset form
      setFormData({
        subject: '',
        category: 'technical',
        message: '',
        priority: 'medium',
      });
      setScreenshot(null);
      setScreenshotPreview(null);
    } catch (error) {
      console.error('Failed to create support ticket:', error);
      toast.error(error.response?.data?.message || 'Failed to create support ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setShowSuccess(false);
      setTicketNumber('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {!showSuccess ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-accent-50">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Contact Support</h2>
                  <p className="text-sm text-gray-600 mt-1">We're here to help you</p>
                </div>
                <button
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-88px)]">
                <div className="space-y-5">
                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      placeholder="Brief description of your issue"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    >
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.icon} {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Priority <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    >
                      {priorities.map((priority) => (
                        <option key={priority.value} value={priority.value}>
                          {priority.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      placeholder="Please describe your issue in detail..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                    />
                  </div>

                  {/* Screenshot Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Screenshot (Optional)
                    </label>
                    <div className="space-y-3">
                      <input
                        id="screenshot-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleScreenshotChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById('screenshot-upload').click()}
                        className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary-500 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-primary-600"
                      >
                        <Upload className="w-5 h-5" />
                        <span className="font-medium">Upload Screenshot</span>
                      </button>
                      {screenshotPreview && (
                        <div className="relative">
                          <img
                            src={screenshotPreview}
                            alt="Screenshot preview"
                            className="w-full h-48 object-cover rounded-xl border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setScreenshot(null);
                              setScreenshotPreview(null);
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isSubmitting}
                      className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-accent-500 text-white rounded-xl hover:from-primary-700 hover:to-accent-600 transition-all font-medium shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <span>Submit Ticket</span>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </>
          ) : (
            /* Success Message */
            <div className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle className="w-12 h-12 text-green-600" />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Ticket Created Successfully!</h3>
              <p className="text-gray-600 mb-6">
                Your support ticket has been created. Our team will review it and respond as soon as possible.
              </p>
              <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-gray-600 mb-1">Your Ticket Number</p>
                <p className="text-2xl font-bold text-primary-600">{ticketNumber}</p>
              </div>
              <button
                onClick={handleClose}
                className="px-8 py-3 bg-gradient-to-r from-primary-600 to-accent-500 text-white rounded-xl hover:from-primary-700 hover:to-accent-600 transition-all font-medium shadow-lg"
              >
                Close
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ContactSupportModal;
