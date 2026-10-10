import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import { X, Trash2, AlertTriangle, Shield, Type } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const DeleteAccountModal = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const [step, setStep] = useState(1);
  const [confirmationText, setConfirmationText] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const requiredText = 'DELETE MY ACCOUNT';

  const handleClose = () => {
    if (!loading) {
      setStep(1);
      setConfirmationText('');
      setPassword('');
      setError('');
      onClose();
    }
  };

  const handleNextStep = () => {
    if (confirmationText === requiredText) {
      setStep(2);
      setError('');
    } else {
      setError('Please type the exact confirmation text');
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    
    if (!password) {
      setError('Password is required to delete your account');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/auth/delete-account/', {
        password: password
      });

      toast.success('Account deleted successfully');
      
      // Log out the user
      logout();
      
      // Close modal
      onClose();
    } catch (error) {
      console.error('Account deletion failed:', error);
      
      if (error.response?.data?.password) {
        setError(error.response.data.password[0]);
      } else if (error.response?.data?.detail) {
        setError(error.response.data.detail);
      } else if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError('Failed to delete account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[99999] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-black/70 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-2xl shadow-xl border border-red-100 relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-400">
                  Delete Account
                </h3>
                <p className="text-sm text-gray-900">
                  This action cannot be undone
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-gray-900" />
            </button>
          </div>

          {step === 1 ? (
            /* Step 1: Warning and Confirmation */
            <div className="space-y-6">
              {/* Warning */}
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-red-400 mb-2">
                      Warning: This action is permanent
                    </h4>
                    <ul className="text-sm text-red-300 space-y-1">
                      <li>• Your account will be permanently deleted</li>
                      <li>• All your data will be removed</li>
                      <li>• Your campaigns and collaborations will be cancelled</li>
                      <li>• This action cannot be undone</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Account Info */}
              <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Account to be deleted:</h4>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                    <p className="text-xs text-gray-900 capitalize">{user?.user_type} Account</p>
                  </div>
                </div>
              </div>

              {/* Confirmation Text Input */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Type <span className="font-bold text-red-400">{requiredText}</span> to confirm:
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Type className="h-5 w-5 text-gray-900" />
                  </div>
                  <input
                    type="text"
                    value={confirmationText}
                    onChange={(e) => {
                      setConfirmationText(e.target.value);
                      setError('');
                    }}
                    disabled={loading}
                    className={`form-input w-full pl-10 pr-4 py-3 rounded-xl ${error ? 'border-red-500/50' : ''}`}
                    placeholder={requiredText}
                    autoFocus
                  />
                </div>
                {error && (
                  <p className="mt-1 text-sm text-red-400">{error}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 btn-secondary px-4 py-3 rounded-xl transition-all duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={loading || confirmationText !== requiredText}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl transition-all duration-200 disabled:opacity-50 font-medium"
                >
                  Continue
                </button>
              </div>
            </div>
          ) : (
            /* Step 2: Password Confirmation */
            <form onSubmit={handleDeleteAccount} className="space-y-6">
              {/* Final Warning */}
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-red-400">
                      Final Step: Enter Your Password
                    </h4>
                    <p className="text-sm text-red-300 mt-1">
                      Enter your password to permanently delete your account.
                    </p>
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Enter your password to confirm deletion:
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Shield className="h-5 w-5 text-gray-900" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    disabled={loading}
                    className={`form-input w-full pl-10 pr-4 py-3 rounded-xl ${error ? 'border-red-500/50' : ''}`}
                    placeholder="Enter your password"
                    autoFocus
                  />
                </div>
                {error && (
                  <p className="mt-1 text-sm text-red-400">{error}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="flex-1 btn-secondary px-4 py-3 rounded-xl transition-all duration-200 disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || !password}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl flex items-center justify-center space-x-2 transition-all duration-200 disabled:opacity-50 font-medium"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Account</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DeleteAccountModal;