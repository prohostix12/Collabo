import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertCircle } from 'lucide-react';
import ContactSupportModal from '../Support/ContactSupportModal';

const ApprovalStatusAlert = ({ status }) => {
  const [showContactModal, setShowContactModal] = useState(false);
  
  if (status === 'approved') return null; // Don't show alert for approved users

  const statusConfig = {
    pending: {
      icon: Clock,
      title: 'Account Under Review',
      message: 'Your account is currently under review. Companies will not be able to view your profile until approval is completed.',
      gradient: 'from-yellow-50 to-orange-50',
      borderColor: 'border-yellow-200',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      textColor: 'text-yellow-900'
    },
    rejected: {
      icon: AlertCircle,
      title: 'Account Not Approved',
      message: 'We regret to inform you that your account has not been approved at this time. You may review your profile details and contact support if you require further clarification.',
      gradient: 'from-red-50 to-pink-50',
      borderColor: 'border-red-200',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      textColor: 'text-red-900'
    }
  };

  const config = statusConfig[status];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`bg-gradient-to-r ${config.gradient} border ${config.borderColor} rounded-xl p-6 shadow-md mb-6`}
      >
        <div className="flex items-start space-x-4">
          <div className={`${config.iconBg} p-3 rounded-lg flex-shrink-0`}>
            <Icon className={`w-6 h-6 ${config.iconColor}`} />
          </div>
          <div className="flex-1">
            <h3 className={`text-lg font-bold ${config.textColor} mb-2`}>
              {config.title}
            </h3>
            <p className={`${config.textColor} opacity-90 text-sm leading-relaxed`}>
              {config.message}
            </p>
            {status === 'rejected' && (
              <div className="mt-4">
                <button
                  onClick={() => setShowContactModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-white text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium shadow-sm"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Contact Support
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <ContactSupportModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
      />
    </>
  );
};

export default ApprovalStatusAlert;
