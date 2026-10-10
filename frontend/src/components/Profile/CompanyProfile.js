import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Edit3,
  Save,
  X,
  Building2,
  Globe,
  Users,
  Briefcase,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  MapPin,
  // eslint-disable-next-line no-unused-vars
  Plus,
  BarChart3,
  Calendar,
  Award
} from 'lucide-react';

const CompanyProfile = () => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const { data: profile, isLoading } = useQuery('company-profile', () =>
    api.get('/auth/company-profile/').then(res => res.data),
    {
      refetchOnWindowFocus: false,
      staleTime: 60000
    }
  );

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    mode: 'onBlur',
    reValidateMode: 'onBlur'
  });

  const updateProfileMutation = useMutation(
    (data) => {
      console.log('CompanyProfile - Sending to API:', data);
      return api.put('/auth/company-profile/', data);
    },
    {
      onMutate: async (newData) => {
        console.log('CompanyProfile - onMutate called');
        // Cancel outgoing refetches
        await queryClient.cancelQueries('company-profile');
        
        // Snapshot previous value
        const previousProfile = queryClient.getQueryData('company-profile');
        
        // Optimistically update to new value
        queryClient.setQueryData('company-profile', old => ({
          ...old,
          ...newData
        }));
        
        return { previousProfile };
      },
      onSuccess: (response) => {
        console.log('CompanyProfile - Update successful:', response.data);
        queryClient.setQueryData('company-profile', response.data);
        toast.success('Profile updated successfully!');
      },
      onError: (error, newData, context) => {
        console.error('CompanyProfile - Update failed:', error);
        console.error('Error response:', error.response?.data);
        
        // Rollback on error
        if (context?.previousProfile) {
          queryClient.setQueryData('company-profile', context.previousProfile);
        }
        
        toast.error(error.response?.data?.message || 'Failed to update profile');
        setIsEditing(true); // Re-enable editing on error
      }
    }
  );

  const industries = [
    { value: 'fashion', label: 'Fashion & Apparel', icon: '👗' },
    { value: 'beauty', label: 'Beauty & Cosmetics', icon: '💄' },
    { value: 'tech', label: 'Technology', icon: '💻' },
    { value: 'food', label: 'Food & Beverage', icon: '🍕' },
    { value: 'fitness', label: 'Fitness & Health', icon: '💪' },
    { value: 'travel', label: 'Travel & Tourism', icon: '✈️' },
    { value: 'automotive', label: 'Automotive', icon: '🚗' },
    { value: 'finance', label: 'Finance & Banking', icon: '💰' },
    { value: 'entertainment', label: 'Entertainment', icon: '🎬' },
    { value: 'education', label: 'Education', icon: '📚' },
  ];

  const companySizes = [
    { value: '1-10', label: '1-10 employees', description: 'Startup' },
    { value: '11-50', label: '11-50 employees', description: 'Small Business' },
    { value: '51-200', label: '51-200 employees', description: 'Medium Business' },
    { value: '201-500', label: '201-500 employees', description: 'Large Business' },
    { value: '500+', label: '500+ employees', description: 'Enterprise' },
  ];

  const getIndustryInfo = (industry) => {
    return industries.find(ind => ind.value === industry) || { 
      label: industry, 
      icon: '🏢'
    };
  };

  const getCompanySizeInfo = (size) => {
    return companySizes.find(cs => cs.value === size) || { 
      label: size, 
      description: 'Company' 
    };
  };

  const onSubmit = (data) => {
    console.log('CompanyProfile - Form submitted with data:', data);
    
    // Immediately exit edit mode for instant feedback
    setIsEditing(false);
    
    // Show loading toast
    const loadingToast = toast.loading('Saving profile...');
    
    // Submit in background
    updateProfileMutation.mutate(data, {
      onSettled: () => {
        toast.dismiss(loadingToast);
      }
    });
  };

  const handleEdit = useCallback(() => {
    setIsEditing(true);
    reset(profile);
  }, [profile, reset]);

  const getProfileCompleteness = () => {
    if (!profile) return 0;
    const fields = ['company_name', 'industry', 'description', 'website', 'company_size'];
    const filledFields = fields.filter(field => profile[field] && profile[field].trim() !== '');
    return Math.round((filledFields.length / fields.length) * 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  const completeness = getProfileCompleteness();
  const industryInfo = getIndustryInfo(profile?.industry);
  const sizeInfo = getCompanySizeInfo(profile?.company_size);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {!isEditing ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Profile Header Section */}
            <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                <div className="flex items-start gap-5">
                  {/* Company Avatar */}
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-md flex-shrink-0">
                    {profile?.company_name?.charAt(0)?.toUpperCase() || ''}
                  </div>
                  
                  {/* Company Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-2xl font-bold text-gray-900">
                        {profile?.company_name || ''}
                      </h1>
                      {profile?.verified && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 rounded-md">
                          <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                          <span className="text-xs font-medium text-green-700">Verified</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      {profile?.industry && (
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="w-4 h-4" />
                          <span>{industryInfo.label}</span>
                        </div>
                      )}
                      {profile?.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" />
                          <span>{profile.location}</span>
                        </div>
                      )}
                      {profile?.company_size && (
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4" />
                          <span>{sizeInfo.label}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button
                    onClick={handleEdit}
                    className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium shadow-sm"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </button>
                </div>
              </div>
            </motion.div>

            {/* About Company Section */}
            <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">About Company</h2>
              </div>
              
              {profile?.description ? (
                <p className="text-gray-700 leading-relaxed max-w-3xl">
                  {profile.description}
                </p>
              ) : (
                <p className="text-gray-500 italic">No company description provided yet.</p>
              )}
            </motion.div>

            {/* Additional Info Section */}
            <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Company Details</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Website */}
                {profile?.website && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                      <Globe className="w-4 h-4" />
                      <span>Website</span>
                    </div>
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-purple-600 hover:text-purple-700 font-medium group"
                    >
                      <span className="truncate">{profile.website.replace(/^https?:\/\//, '')}</span>
                      <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </a>
                  </div>
                )}

                {/* Company Size */}
                {profile?.company_size && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>Company Size</span>
                    </div>
                    <div className="text-gray-900 font-medium">{sizeInfo.label}</div>
                  </div>
                )}

                {/* Industry */}
                {profile?.industry && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                      <Briefcase className="w-4 h-4" />
                      <span>Industry</span>
                    </div>
                    <div className="text-gray-900 font-medium">{industryInfo.label}</div>
                  </div>
                )}

                {/* Founded Year */}
                {profile?.founded_year && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Founded</span>
                    </div>
                    <div className="text-gray-900 font-medium">{profile.founded_year}</div>
                  </div>
                )}

                {/* Location */}
                {profile?.location && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>Location</span>
                    </div>
                    <div className="text-gray-900 font-medium">{profile.location}</div>
                  </div>
                )}

                {/* Profile Completion */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                    <Award className="w-4 h-4" />
                    <span>Profile Completion</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-gray-900 font-medium">{completeness}%</div>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-500"
                        style={{ width: `${completeness}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          /* Edit Form */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-8"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Edit3 className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Edit Company Profile</h2>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Company Name */}
                <div className="lg:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2">
                    <Building2 className="w-4 h-4" />
                    <span>Company Name</span>
                  </label>
                  <input
                    type="text"
                    {...register('company_name', { required: 'Company name is required' })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900"
                    placeholder="Enter your company name"
                  />
                  {errors.company_name && (
                    <p className="flex items-center gap-1 text-red-600 text-sm mt-1.5">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.company_name.message}</span>
                    </p>
                  )}
                </div>

                {/* Industry */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2">
                    <Briefcase className="w-4 h-4" />
                    <span>Industry</span>
                  </label>
                  <select
                    {...register('industry', { required: 'Industry is required' })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none cursor-pointer text-gray-900"
                  >
                    <option value="">Select your industry</option>
                    {industries.map((industry) => (
                      <option key={industry.value} value={industry.value}>
                        {industry.label}
                      </option>
                    ))}
                  </select>
                  {errors.industry && (
                    <p className="flex items-center gap-1 text-red-600 text-sm mt-1.5">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.industry.message}</span>
                    </p>
                  )}
                </div>

                {/* Company Size */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2">
                    <Users className="w-4 h-4" />
                    <span>Company Size</span>
                  </label>
                  <select
                    {...register('company_size')}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none cursor-pointer text-gray-900"
                  >
                    <option value="">Select company size</option>
                    {companySizes.map((size) => (
                      <option key={size.value} value={size.value}>
                        {size.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location */}
                <div className="lg:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2">
                    <MapPin className="w-4 h-4" />
                    <span>Location</span>
                  </label>
                  <input
                    type="text"
                    {...register('location')}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900"
                    placeholder="City, Country (e.g., Mumbai, India)"
                  />
                </div>

                {/* Website */}
                <div className="lg:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2">
                    <Globe className="w-4 h-4" />
                    <span>Website</span>
                  </label>
                  <input
                    type="url"
                    {...register('website')}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900"
                    placeholder="https://yourcompany.com"
                  />
                </div>

                {/* Description */}
                <div className="lg:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2">
                    <Briefcase className="w-4 h-4" />
                    <span>Company Description</span>
                  </label>
                  <textarea
                    {...register('description', { required: 'Description is required' })}
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none text-gray-900"
                    placeholder="Tell influencers about your company, mission, and what makes you unique..."
                  />
                  {errors.description && (
                    <p className="flex items-center gap-1 text-red-600 text-sm mt-1.5">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.description.message}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={updateProfileMutation.isLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-sm"
                >
                  {updateProfileMutation.isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CompanyProfile;
