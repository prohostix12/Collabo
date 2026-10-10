import React, { useEffect, useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const Toast = ({ 
  id,
  type = 'info', 
  title, 
  message, 
  duration = 4000,
  onClose 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(100);

  // Toast type configurations
  const toastConfig = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600',
      titleColor: 'text-green-900',
      messageColor: 'text-green-700',
      progressColor: 'bg-green-600'
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-600',
      titleColor: 'text-red-900',
      messageColor: 'text-red-700',
      progressColor: 'bg-red-600'
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      iconColor: 'text-orange-600',
      titleColor: 'text-orange-900',
      messageColor: 'text-orange-700',
      progressColor: 'bg-orange-600'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-900',
      messageColor: 'text-blue-700',
      progressColor: 'bg-blue-600'
    }
  };

  const config = toastConfig[type] || toastConfig.info;
  const Icon = config.icon;

  // Auto-dismiss timer with pause on hover
  useEffect(() => {
    if (isHovered || duration === 0) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining === 0) {
        onClose(id);
      }
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [id, duration, isHovered, onClose]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ 
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative w-full max-w-sm rounded-xl border shadow-lg overflow-hidden
        ${config.bgColor} ${config.borderColor}
        backdrop-blur-sm
      `}
      role="alert"
      aria-live="polite"
    >
      {/* Main Content */}
      <div className="p-4 pr-10">
        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className={`flex-shrink-0 ${config.iconColor}`}>
            <Icon className="w-5 h-5" />
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0">
            {title && (
              <h4 className={`text-sm font-semibold ${config.titleColor} mb-1`}>
                {title}
              </h4>
            )}
            {message && (
              <p className={`text-sm ${config.messageColor} leading-relaxed`}>
                {message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Close Button */}
      <button
        onClick={() => onClose(id)}
        className={`
          absolute top-3 right-3 p-1 rounded-lg
          ${config.iconColor} hover:bg-white/50
          transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400
        `}
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress Bar */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30">
          <motion.div
            className={`h-full ${config.progressColor}`}
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.016, ease: 'linear' }}
          />
        </div>
      )}
    </motion.div>
  );
};

export default Toast;
