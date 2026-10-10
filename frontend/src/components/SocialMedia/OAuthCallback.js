import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const { platform } = useParams();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    handleOAuthCallback();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOAuthCallback = async () => {
    try {
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        setStatus('error');
        setMessage(errorDescription || `OAuth error: ${error}`);
        toast.error('Failed to connect account');
        return;
      }

      if (!code) {
        setStatus('error');
        setMessage('No authorization code received');
        toast.error('Invalid OAuth response');
        return;
      }

      setMessage('Connecting your account...');

      const response = await api.post('/social-media/connect/', {
        platform: platform,
        auth_code: code
      });

      if (response.status === 200 || response.status === 201) {
        setStatus('success');
        setMessage('Account connected successfully!');
        toast.success(`${platform.charAt(0).toUpperCase() + platform.slice(1)} account connected!`);
        
        // Redirect after a short delay
        setTimeout(() => {
          navigate('/social-media');
        }, 2000);
      } else {
        throw new Error('Unexpected response status');
      }

    } catch (error) {
      console.error('OAuth callback error:', error);
      setStatus('error');
      
      let errorMessage = 'Failed to connect account';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setMessage(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleRetry = () => {
    navigate('/social-media');
  };

  const getPlatformName = (platform) => {
    return platform.charAt(0).toUpperCase() + platform.slice(1);
  };

  return (
    <div className="min-h-screen saas-background flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="glass-card rounded-2xl p-8 text-center">
          {status === 'processing' && (
            <>
              <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-accent-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <RefreshCw className="w-8 h-8 text-white animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Connecting {getPlatformName(platform)}
              </h2>
              <p className="text-gray-900 mb-6">
                Please wait while we connect your {getPlatformName(platform)} account...
              </p>
              <div className="w-full bg-dark-700 rounded-full h-2">
                <div className="bg-gradient-to-r from-primary-400 to-accent-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-accent-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Account Connected!
              </h2>
              <p className="text-gray-900 mb-6">
                Your {getPlatformName(platform)} account has been successfully connected. 
                Follower data will be synced automatically.
              </p>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-900">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Redirecting to dashboard...</span>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Connection Failed
              </h2>
              <p className="text-gray-900 mb-6">
                {message}
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleRetry}
                  className="w-full btn-primary py-3 rounded-xl"
                >
                  Try Again
                </button>
                <button
                  onClick={() => navigate('/social-media')}
                  className="w-full btn-secondary py-3 rounded-xl"
                >
                  Back to Social Media
                </button>
              </div>
            </>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-900">
            Having trouble? Make sure you have the required account type:
          </p>
          <ul className="text-xs text-gray-900 mt-2 space-y-1">
            <li>• Instagram: Business or Creator account</li>
            <li>• YouTube: Public channel with content</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OAuthCallback;