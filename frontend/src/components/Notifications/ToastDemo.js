import React from 'react';
import { useToast } from '../../contexts/ToastContext';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

/**
 * Demo component to showcase the Toast notification system
 * This component can be used for testing or as a reference
 */
const ToastDemo = () => {
  const { toast } = useToast();

  const examples = [
    {
      type: 'success',
      icon: CheckCircle,
      color: 'green',
      title: 'Success Toast',
      examples: [
        {
          label: 'Profile Saved',
          action: () => toast.success('Profile Updated', 'Your profile changes have been saved successfully.')
        },
        {
          label: 'Payment Complete',
          action: () => toast.success('Payment Successful', 'Your payment of ₹5,000 has been processed.')
        },
        {
          label: 'Title Only',
          action: () => toast.success('Changes Saved!')
        }
      ]
    },
    {
      type: 'error',
      icon: XCircle,
      color: 'red',
      title: 'Error Toast',
      examples: [
        {
          label: 'Login Failed',
          action: () => toast.error('Login Failed', 'Invalid email or password. Please try again.')
        },
        {
          label: 'Network Error',
          action: () => toast.error('Connection Error', 'Unable to connect to server. Check your internet connection.')
        },
        {
          label: 'No Auto-Dismiss',
          action: () => toast.error('Critical Error', 'This error requires immediate attention.', 0)
        }
      ]
    },
    {
      type: 'warning',
      icon: AlertTriangle,
      color: 'orange',
      title: 'Warning Toast',
      examples: [
        {
          label: 'Unsaved Changes',
          action: () => toast.warning('Unsaved Changes', 'You have unsaved changes. Are you sure you want to leave?')
        },
        {
          label: 'Storage Limit',
          action: () => toast.warning('Storage Almost Full', 'You are using 90% of your storage quota.')
        },
        {
          label: 'Long Duration',
          action: () => toast.warning('Important Notice', 'This notification will stay for 8 seconds.', 8000)
        }
      ]
    },
    {
      type: 'info',
      icon: Info,
      color: 'blue',
      title: 'Info Toast',
      examples: [
        {
          label: 'New Feature',
          action: () => toast.info('New Feature Available', 'Check out our new analytics dashboard!')
        },
        {
          label: 'System Update',
          action: () => toast.info('Scheduled Maintenance', 'System will be down for maintenance on Sunday at 2 AM.')
        },
        {
          label: 'Message Only',
          action: () => toast.info(null, 'This is an informational message without a title.')
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Toast Notification System
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A standardized notification system with consistent styling, smooth animations, 
            and accessibility features. Click any button below to see it in action.
          </p>
        </div>

        {/* Features */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              'Auto-dismiss after 4 seconds',
              'Pause on hover',
              'Smooth slide-in animation',
              'Progress bar indicator',
              'Accessible (ARIA labels)',
              'Keyboard focusable',
              'Responsive design',
              'Consistent styling',
              'Customizable duration'
            ].map((feature, index) => (
              <div key={index} className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-sm text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Toast Examples */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {examples.map((category) => {
            const Icon = category.icon;
            return (
              <div
                key={category.type}
                className="bg-white rounded-xl shadow-md border border-gray-200 p-6"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`p-2 rounded-lg bg-${category.color}-100`}>
                    <Icon className={`w-6 h-6 text-${category.color}-600`} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {category.title}
                  </h3>
                </div>
                <div className="space-y-3">
                  {category.examples.map((example, index) => (
                    <button
                      key={index}
                      onClick={example.action}
                      className={`
                        w-full text-left px-4 py-3 rounded-lg border-2 
                        border-${category.color}-200 bg-${category.color}-50
                        hover:bg-${category.color}-100 hover:border-${category.color}-300
                        transition-all duration-200
                        text-sm font-medium text-gray-900
                      `}
                    >
                      {example.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Usage Code */}
        <div className="mt-8 bg-gray-900 rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-white mb-4">Usage Example</h2>
          <pre className="text-sm text-green-400 overflow-x-auto">
            <code>{`import { useToast } from '../../contexts/ToastContext';

function MyComponent() {
  const { toast } = useToast();

  const handleClick = () => {
    // Success notification
    toast.success('Success!', 'Operation completed successfully.');
    
    // Error notification
    toast.error('Error!', 'Something went wrong.');
    
    // Warning notification
    toast.warning('Warning!', 'This action cannot be undone.');
    
    // Info notification
    toast.info('Info', 'New features are available.');
    
    // Custom duration (6 seconds)
    toast.success('Saved!', 'Changes saved.', 6000);
    
    // No auto-dismiss
    toast.error('Critical', 'Requires attention.', 0);
  };

  return <button onClick={handleClick}>Show Toast</button>;
}`}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};

export default ToastDemo;
