import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import { X, Edit3, Check, AlertCircle, User } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ChangeUsernameModal = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuth();
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newUsername.trim()) {
      setError('Username cannot be empty');
      return;
    }

    if (newUsername.trim() === user?.username) {
      setError('New username must be different from current username');
      return;
    }

    if (newUsername.length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
      setError('Username can only contain letters, numbers, and underscores');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.patch('/auth/profile/', {
        username: newUsername.trim()
      });

      // Update user context
      updateUser({ ...user, username: newUsername.trim() });
      
      toast.success('Username updated successfully!');
      onClose();
    } catch (error) {
      console.error('Username update failed:', error);
      
      if (error.response?.data?.username) {
        setError(error.response.data.username[0]);
      } else if (error.response?.data?.detail) {
        setError(error.response.data.detail);
      } else if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError('Failed to update username. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setNewUsername(user?.username || '');
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[99999] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-2xl shadow-xl border border-gray-100 relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-accent-500 rounded-xl flex items-center justify-center">
                <Edit3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Change Username
                </h3>
                <p className="text-sm text-gray-900">
                  Update your display name
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Username */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Current Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-900" />
                </div>
                <input
                  type="text"
                  value={user?.username || ''}
                  disabled
                  className="form-input w-full pl-10 pr-4 py-3 rounded-xl bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>

            {/* New Username */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                New Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Edit3 className="h-5 w-5 text-gray-900" />
                </div>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => {
                    setNewUsername(e.target.value);
                    setError('');
                  }}
                  disabled={loading}
                  className="form-input w-full pl-10 pr-4 py-3 rounded-xl"
                  placeholder="Enter new username"
                  autoFocus
                />
              </div>
              <div className="mt-2 text-xs text-gray-900">
                Username must be at least 3 characters and contain only letters, numbers, and underscores.
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

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
                type="submit"
                disabled={loading || !newUsername.trim() || newUsername === user?.username}
                className="flex-1 btn-primary px-4 py-3 rounded-xl flex items-center justify-center space-x-2 transition-all duration-200 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Update Username</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ChangeUsernameModal;