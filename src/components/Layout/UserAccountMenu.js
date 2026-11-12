import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  User, 
  Settings, 
  Key, 
  Trash2, 
  LogOut, 
  ChevronDown,
  Edit3,
  Shield
} from 'lucide-react';
import ChangeUsernameModal from './ChangeUsernameModal';
import ChangePasswordModal from './ChangePasswordModal';
import DeleteAccountModal from './DeleteAccountModal';

const UserAccountMenu = () => {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    setIsDropdownOpen(false);
    logout();
  };

  const openModal = (modalType) => {
    setIsDropdownOpen(false);
    setActiveModal(modalType);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const getDisplayName = () => {
    if (user?.user_type === 'company' && user?.company_profile?.company_name) {
      return user.company_profile.company_name;
    }
    return user?.username || '';
  };

  const getDisplayInitials = () => {
    const displayName = getDisplayName();
    return displayName ? displayName.charAt(0).toUpperCase() : 'U';
  };

  const getUserTypeColor = (userType) => {
    switch (userType) {
      case 'admin':
        return 'from-primary-600 to-primary-700';
      case 'company':
        return 'from-primary-500 to-primary-600';
      case 'influencer':
        return 'from-primary-600 to-primary-700';
      default:
        return 'from-primary-600 to-primary-700';
    }
  };

  const getUserTypeIcon = (userType) => {
    switch (userType) {
      case 'admin':
        return Shield;
      case 'company':
        return Settings;
      case 'influencer':
        return User;
      default:
        return User;
    }
  };

  const menuItems = [
    {
      id: 'change-username',
      label: 'Change Username',
      icon: Edit3,
      action: () => openModal('username'),
      description: 'Update your display name'
    },
    {
      id: 'change-password',
      label: 'Change Password',
      icon: Key,
      action: () => openModal('password'),
      description: 'Update your account password'
    },
    {
      id: 'delete-account',
      label: 'Delete Account',
      icon: Trash2,
      action: () => openModal('delete'),
      description: 'Permanently delete your account',
      danger: true
    }
  ];

  const UserTypeIcon = getUserTypeIcon(user?.user_type);

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Avatar Button */}
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500/40 group"
          aria-label="User account menu"
          aria-expanded={isDropdownOpen}
          aria-haspopup="true"
        >
          {/* Avatar */}
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getUserTypeColor(user?.user_type)} flex items-center justify-center text-white font-semibold text-xs shrink-0`}>
            {getDisplayInitials()}
          </div>

          {/* User Info (Hidden on mobile) */}
          <div className="hidden sm:flex flex-col items-start min-w-0 leading-tight">
            <span className="text-xs font-semibold text-gray-900 truncate max-w-28 lg:max-w-36">
              {getDisplayName()}
            </span>
            <div className="flex items-center gap-1">
              <UserTypeIcon className="w-2.5 h-2.5 text-gray-400" />
              <span className="text-[10px] text-gray-500 capitalize">
                {user?.user_type}
              </span>
            </div>
          </div>

          <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 z-[9999] overflow-hidden origin-top-right animate-fadeIn">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900 truncate">
                {getDisplayName()}
              </p>
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {user?.email || `${user?.user_type} account`}
              </p>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={item.action}
                    className={`w-full px-4 py-2 flex items-center space-x-3 transition-colors duration-150 group ${
                      item.danger ? 'hover:bg-red-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 flex-shrink-0 ${
                      item.danger 
                        ? 'text-red-500 group-hover:text-red-600' 
                        : 'text-gray-400 group-hover:text-gray-500'
                    }`} />
                    <span className={`text-sm font-medium truncate ${
                      item.danger ? 'text-red-600' : 'text-gray-700 group-hover:text-gray-900'
                    }`}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Logout Section */}
            <div className="border-t border-gray-100 py-1">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 flex items-center space-x-3 hover:bg-gray-50 transition-colors duration-150 group"
              >
                <LogOut className="w-4 h-4 flex-shrink-0 text-gray-400 group-hover:text-gray-500" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 truncate">
                  Sign Out
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {activeModal === 'username' && (
        <ChangeUsernameModal isOpen={true} onClose={closeModal} />
      )}
      {activeModal === 'password' && (
        <ChangePasswordModal isOpen={true} onClose={closeModal} />
      )}
      {activeModal === 'delete' && (
        <DeleteAccountModal isOpen={true} onClose={closeModal} />
      )}
    </>
  );
};

export default UserAccountMenu;