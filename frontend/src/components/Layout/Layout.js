import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Footer from './Footer';
import UserAccountMenu from './UserAccountMenu';
import { useAuth } from '../../contexts/AuthContext';

const Layout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.user_type === 'admin' || user?.is_staff;

  return (
    <div className="min-h-screen saas-background connection-lines flex flex-col">
      <nav className="glass-card sticky top-0 z-50 border-b border-dark-100/10">
        <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16">
          <div className="flex justify-between h-14">
            <div className="flex items-center">
              <Link to="/" className="flex items-center group hover:opacity-90 transition-opacity">
                <img src="/collabo-logo.png" alt="Collabo" className="h-10 object-contain scale-[2.0] origin-left transform" />
              </Link>
            </div>
            
            <div className="hidden sm:flex items-center">
              <UserAccountMenu />
            </div>

            {/* Mobile menu button */}
            <div className="sm:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md text-dark-200 hover:text-dark-100 hover:bg-primary-700/10 transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="sm:hidden border-t border-dark-100/10 glass-card-dark">
              <div className="px-2 pt-2 pb-3">
                <UserAccountMenu />
              </div>
            </div>
          )}
        </div>
      </nav>
      
      <main className="w-full flex-1">
        {children}
      </main>
      
      {!isAdmin && <Footer />}
    </div>
  );
};

export default Layout;