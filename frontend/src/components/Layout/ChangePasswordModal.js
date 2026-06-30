import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import { X, Key, Check, AlertCircle, Eye, EyeOff, Shield } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ChangePasswordModal = ({ isOpen, onClose }) => {
  // eslint-disable-next-line no-unused-vars
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) {
      errors.push('At least 8 characters long');
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('At least one lowercase letter');
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('At least one uppercase letter');
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push('At least one number');
    }
    return errors;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear specific field errors
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};

    // Validate current password
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    // Validate new password
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else {
      const passwordErrors = validatePassword(formData.newPassword);
      if (passwordErrors.length > 0) {
        newErrors.newPassword = passwordErrors.join(', ');
      }
    }

    // Validate confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Check if new password is same as current
    if (formData.currentPassword && formData.newPassword && formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await api.post('/auth/change-password/', {
        old_password: formData.currentPassword,
        new_password: formData.newPassword
      });

      toast.success('Password updated successfully!');
      onClose();
    } catch (error) {
      console.error('Password change failed:', error);
      
      if (error.response?.data) {
        const responseErrors = {};
        
        if (error.response.data.old_password) {
          responseErrors.currentPassword = error.response.data.old_password[0];
        }
        if (error.response.data.new_password) {
          responseErrors.newPassword = error.response.data.new_password[0];
        }
        if (error.response.data.detail) {
          responseErrors.general = error.response.data.detail;
        }
        if (error.response.data.error) {
          responseErrors.general = error.response.data.error;
        }
        
        if (Object.keys(responseErrors).length > 0) {
          setErrors(responseErrors);
        } else {
          setErrors({ general: 'Failed to update password. Please try again.' });
        }
      } else {
        setErrors({ general: 'Failed to update password. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswords({
        current: false,
        new: false,
        confirm: false
      });
      setErrors({});
      onClose();
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/(?=.*[a-z])/.test(password)) score++;
    if (/(?=.*[A-Z])/.test(password)) score++;
    if (/(?=.*\d)/.test(password)) score++;
    if (/(?=.*[!@#$%^&*])/.test(password)) score++;
    
    if (score <= 2) return { strength: score * 20, label: 'Weak', color: 'bg-red-500' };
    if (score <= 3) return { strength: score * 20, label: 'Fair', color: 'bg-yellow-500' };
    if (score <= 4) return { strength: score * 20, label: 'Good', color: 'bg-blue-500' };
    return { strength: 100, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

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
        <div className="inline-block w-full max-w-[320px] p-4 my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-xl shadow-2xl border border-slate-100 relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg flex items-center justify-center shadow-sm">
                <Key className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                  Change Password
                </h3>
                <p className="text-[10px] font-medium text-slate-500 mt-0.5">
                  Update your account security
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
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current Password */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                Current Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={formData.currentPassword}
                  onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                  disabled={loading}
                  className={`w-full pl-10 pr-12 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:border-slate-500 focus:ring-1 focus:ring-slate-500 outline-none transition-all ${errors.currentPassword ? 'border-red-500' : ''}`}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPasswords.current ? (
                    <EyeOff className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                  ) : (
                    <Eye className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                  )}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="mt-1 text-sm text-red-400">{errors.currentPassword}</p>
              )}
            </div>

            {/* New Password */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(e) => handleInputChange('newPassword', e.target.value)}
                  disabled={loading}
                  className={`w-full pl-10 pr-12 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:border-slate-500 focus:ring-1 focus:ring-slate-500 outline-none transition-all ${errors.newPassword ? 'border-red-500' : ''}`}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPasswords.new ? (
                    <EyeOff className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                  ) : (
                    <Eye className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                  )}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.newPassword && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-900">Password Strength</span>
                    <span className={`text-xs font-medium ${
                      passwordStrength.label === 'Strong' ? 'text-green-400' :
                      passwordStrength.label === 'Good' ? 'text-blue-400' :
                      passwordStrength.label === 'Fair' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="w-full bg-gray-600/30 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${passwordStrength.strength}%` }}
                    />
                  </div>
                </div>
              )}
              
              {errors.newPassword && (
                <p className="mt-1 text-sm text-red-400">{errors.newPassword}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Check className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  disabled={loading}
                  className={`w-full pl-10 pr-12 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:border-slate-500 focus:ring-1 focus:ring-slate-500 outline-none transition-all ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                  ) : (
                    <Eye className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
              )}
            </div>

            {/* General Error */}
            {errors.general && (
              <div className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-400">{errors.general}</p>
              </div>
            )}

            {/* Password Requirements */}
            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
              <p className="text-[10px] font-bold text-slate-800 mb-1.5 uppercase tracking-wider">Password Requirements:</p>
              <ul className="text-[10px] text-slate-600 space-y-1 font-medium">
                <li className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-slate-400"></div>At least 8 characters long</li>
                <li className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-slate-400"></div>At least one uppercase letter</li>
                <li className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-slate-400"></div>At least one lowercase letter</li>
                <li className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-slate-400"></div>At least one number</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex space-x-2 pt-1">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs px-3 py-2 rounded-lg transition-all duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
                className="flex-[2] bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white font-bold text-xs px-3 py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all duration-200 disabled:opacity-50 shadow-md"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Update Password</span>
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

export default ChangePasswordModal;