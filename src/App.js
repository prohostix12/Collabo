import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import ToastContainer from './components/Notifications/ToastContainer';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ForgotPassword from './components/Auth/ForgotPassword';
import CompanyDashboard from './components/Dashboard/CompanyDashboard';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import Layout from './components/Layout/Layout';
import LandingPage from './components/Landing/LandingPage';
import AboutPage from './components/Landing/AboutPage';
import ServicesPage from './components/Landing/ServicesPage';
import InfluencerDetailPage from './components/Landing/InfluencerDetailPage';
import CreatorsPage from './components/Landing/CreatorsPage';
import OAuthCallback from './components/SocialMedia/OAuthCallback';
import EcommerceMarketplace from './components/Ecommerce/EcommerceMarketplace';
import SellOnCollabo from './components/Ecommerce/SellOnCollabo';
import ShippingPolicy from './components/Legal/ShippingPolicy';
import ReturnPolicy from './components/Legal/ReturnPolicy';
import PrivacyPolicy from './components/Legal/PrivacyPolicy';
import TermsConditions from './components/Legal/TermsConditions';
import CollabHub from './components/Collab/CollabHub';

function ProtectedRoute({ children, allowedUserTypes }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (allowedUserTypes && !allowedUserTypes.includes(user.user_type)) {
    return <Navigate to="/unauthorized" />;
  }
  
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<EcommerceMarketplace />} />
      <Route path="/sell" element={<SellOnCollabo />} />
      <Route path="/collab" element={user?.user_type === 'company' ? <CollabHub /> : user?.user_type === 'influencer' ? <Navigate to="/" replace /> : <LandingPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/creators" element={<CreatorsPage />} />
      <Route path="/shipping-policy" element={<ShippingPolicy />} />
      <Route path="/return-policy" element={<ReturnPolicy />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsConditions />} />
      <Route path="/influencer/:id" element={<InfluencerDetailPage />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/register" element={<Navigate to="/" replace />} />
      <Route path="/forgot-password" element={<Navigate to="/" replace />} />
      
      {/* OAuth Callback Routes */}
      <Route path="/auth/:platform/callback" element={
        <ProtectedRoute>
          <OAuthCallback />
        </ProtectedRoute>
      } />
      
      {/* Dashboard Route */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          {user?.user_type === 'buyer' ? (
            <Navigate to="/" replace />
          ) : user?.user_type === 'influencer' ? (
            <Navigate to="/#hub" replace />
          ) : (
            <Layout>
              {user?.user_type === 'company' && <CompanyDashboard />}
              {user?.user_type === 'admin' && <AdminDashboard />}
            </Layout>
          )}
        </ProtectedRoute>
      } />
      
      <Route path="/influencer/*" element={
        <ProtectedRoute allowedUserTypes={['influencer']}>
          <Navigate to="/#hub" replace />
        </ProtectedRoute>
      } />
      
      <Route path="/company/*" element={
        <ProtectedRoute allowedUserTypes={['company']}>
          <Layout>
            <CompanyDashboard />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/admin/*" element={
        <ProtectedRoute allowedUserTypes={['admin']}>
          <Layout>
            <AdminDashboard />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/unauthorized" element={
        <div className="flex justify-center items-center h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">Unauthorized</h1>
            <p className="mt-2">You don't have permission to access this page.</p>
          </div>
        </div>
      } />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <div className="App">
            <AppRoutes />
            <ToastContainerWrapper />
            {/* React Hot Toast for standard notifications */}
            <Toaster
              position="top-right"
              reverseOrder={false}
              gutter={8}
              containerStyle={{
                top: 20,
                right: 20,
              }}
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#ffffff',
                  color: '#0f172a',
                  padding: '12px 20px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '600',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #f1f5f9',
                  maxWidth: '400px',
                  wordBreak: 'break-word',
                },
                success: {
                  duration: 4000,
                  style: {
                    borderLeft: '4px solid #10B981',
                  },
                  iconTheme: {
                    primary: '#10B981',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 4000,
                  style: {
                    borderLeft: '4px solid #EF4444',
                  },
                  iconTheme: {
                    primary: '#EF4444',
                    secondary: '#fff',
                  },
                },
                loading: {
                  style: {
                    borderLeft: '4px solid #3B82F6',
                  },
                  iconTheme: {
                    primary: '#3B82F6',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </div>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

// Toast Container Wrapper Component
function ToastContainerWrapper() {
  const { toasts, removeToast } = useToast();
  return <ToastContainer toasts={toasts} removeToast={removeToast} />;
}

export default App;