import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Edit3, Save, X, Users, TrendingUp, DollarSign, Instagram, Youtube,
  MessageCircle, Camera, Award, MapPin, Upload, Link as LinkIcon,
  Globe, Target, Heart, Eye, Play, RefreshCw, CheckCircle,
  AlertCircle, Loader
} from 'lucide-react';

const InfluencerProfile = () => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  // Social media auto-fetch state
  const [igStats, setIgStats] = useState(null);       // fetched Instagram stats
  const [ytStats, setYtStats] = useState(null);       // fetched YouTube stats
  const [igLoading, setIgLoading] = useState(false);  // loading Instagram fetch
  const [ytLoading, setYtLoading] = useState(false);  // loading YouTube fetch
  const [igError, setIgError] = useState('');         // Instagram error message
  const [ytError, setYtError] = useState('');         // YouTube error message

  
  // File upload states
  const [latestReviewCoverFile, setLatestReviewCoverFile] = useState(null);
  const [latestReviewCoverPreview, setLatestReviewCoverPreview] = useState(null);
  const [mostViewedCoverFile, setMostViewedCoverFile] = useState(null);
  const [mostViewedCoverPreview, setMostViewedCoverPreview] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [uploadingCover, setUploadingCover] = useState(false);
  
  // Profile picture upload state
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(null);

  // Cover/banner image upload state
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState(null);

  // Recent affiliate links state
  const [recentLinks, setRecentLinks] = useState([]);
  const [linkStats, setLinkStats] = useState({ total_clicks: 0, total_conversions: 0, total_earned: 0 });

  // Scroll to top + fetch affiliate links on mount
  React.useEffect(() => {
    window.scrollTo(0, 0);
    api.get('/ecommerce/reviews/my-referrals/').then(res => {
      setRecentLinks((res.data.referrals || []).slice(0, 4));
      setLinkStats(res.data.summary || {});
    }).catch(() => {});
  }, []);

  const { data: profile, isLoading } = useQuery(
    'influencer-profile',
    () => api.get('/auth/influencer-profile/').then(res => res.data)
  );

  const { register, handleSubmit, reset, setValue, getValues, formState: { errors } } = useForm();


  // Handle cover image file upload
  const handleCoverImageUpload = async (file, type) => {
    if (!file) return null;

    const formData = new FormData();
    formData.append('image', file);

    try {
      setUploadingCover(true);
      const response = await api.post('/auth/upload-image/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.url;
    } catch (error) {
      toast.error('Failed to upload cover image');
      return null;
    } finally {
      setUploadingCover(false);
    }
  };

  // Handle file selection for latest review cover
  const handleLatestReviewCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLatestReviewCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLatestReviewCoverPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle file selection for most viewed cover
  const handleMostViewedCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMostViewedCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMostViewedCoverPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle profile picture selection
  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      setProfilePicFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateProfileMutation = useMutation(
    async (data) => {
      // Upload profile picture if file is selected
      if (profilePicFile) {
        const formData = new FormData();
        formData.append('image', profilePicFile);
        
        try {
          const response = await api.post('/auth/upload-image/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          data.profile_image = response.data.url;
        } catch (error) {
          console.error('Failed to upload profile picture:', error);
        }
      }
      
      // Upload cover images if files are selected
      if (latestReviewCoverFile) {
        const coverUrl = await handleCoverImageUpload(latestReviewCoverFile, 'latest_review');
        if (coverUrl) {
          data.latest_product_review_cover = coverUrl;
        }
      }
      
      if (mostViewedCoverFile) {
        const coverUrl = await handleCoverImageUpload(mostViewedCoverFile, 'most_viewed');
        if (coverUrl) {
          data.most_viewed_content_cover = coverUrl;
        }
      }

      if (coverImageFile) {
        const formData = new FormData();
        formData.append('image', coverImageFile);
        try {
          const response = await api.post('/auth/upload-image/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          data.cover_image = response.data.url;
        } catch (error) {
          console.error('Failed to upload cover image:', error);
        }
      }

      return api.put('/auth/influencer-profile/', data);
    },
    {
      onMutate: async (newData) => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries('influencer-profile');
        
        // Snapshot previous value
        const previousProfile = queryClient.getQueryData('influencer-profile');
        
        // Optimistically update to new value
        queryClient.setQueryData('influencer-profile', old => ({
          ...old,
          ...newData
        }));
        
        return { previousProfile };
      },
      onSuccess: (response) => {
        queryClient.setQueryData('influencer-profile', response.data);
        toast.dismiss(); // Dismiss "Saving..." message
        toast.success('Profile updated!');
        // Clear file states
        setProfilePicFile(null);
        setProfilePicPreview(null);
        setLatestReviewCoverFile(null);
        setLatestReviewCoverPreview(null);
        setMostViewedCoverFile(null);
        setMostViewedCoverPreview(null);
        setCoverImageFile(null);
        setCoverImagePreview(null);
      },
      onError: (error, newData, context) => {
        // Rollback on error
        if (context?.previousProfile) {
          queryClient.setQueryData('influencer-profile', context.previousProfile);
        }
        toast.dismiss(); // Dismiss "Saving..." message
        toast.error('Failed to update profile');
        setIsEditing(true); // Re-enable editing on error
      }
    }
  );

  // fetchSocialStats: calls backend to fetch real social media stats and auto-populates form fields
  const fetchSocialStats = async (platform) => {
    const handle = getValues(platform === 'instagram' ? 'instagram_handle' : 'youtube_channel');
    if (!handle || !handle.trim()) {
      toast.error(`Please enter your ${platform === 'instagram' ? 'Instagram handle' : 'YouTube channel URL'} first`);
      return;
    }

    if (platform === 'instagram') {
      setIgLoading(true);
      setIgError('');
      setIgStats(null);
    } else {
      setYtLoading(true);
      setYtError('');
      setYtStats(null);
    }

    try {
      const resp = await api.post('/social-media/fetch-handle-stats/', { platform, handle: handle.trim() });
      const data = resp.data;

      if (platform === 'instagram') {
        setIgStats(data);
        // Auto-populate followers_count and engagement_rate
        setValue('followers_count', data.followers);
        setValue('engagement_rate', data.engagement_rate);
        toast.success(`Instagram stats fetched! ${data.followers?.toLocaleString()} followers`);
      } else {
        setYtStats(data);
        // If no instagram stats set yet, use YouTube subscribers
        if (!igStats) {
          setValue('followers_count', data.subscribers);
          setValue('engagement_rate', data.engagement_rate);
        }
        toast.success(`YouTube stats fetched! ${data.subscribers?.toLocaleString()} subscribers`);
      }
    } catch (err) {
      const errMsg = err?.response?.data?.error || 'Failed to fetch stats';
      if (platform === 'instagram') {
        setIgError(errMsg);
      } else {
        setYtError(errMsg);
      }
      toast.error(errMsg);
    } finally {
      if (platform === 'instagram') setIgLoading(false);
      else setYtLoading(false);
    }
  };

  const onSubmit = (data) => {

    console.log('InfluencerProfile - Form submitted with data:', data);
    
    // Immediately exit edit mode for instant feedback
    setIsEditing(false);
    
    // Show optimistic success message
    toast.success('Saving profile...');
    
    // Submit in background
    updateProfileMutation.mutate(data);
  };

  const handleCoverImageChange = async (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setCoverImagePreview(reader.result);
    reader.readAsDataURL(file);
    setCoverImageFile(file);
    const formData = new FormData();
    formData.append('image', file);
    try {
      toast.loading('Uploading cover...');
      const res = await api.post('/auth/upload-image/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await api.put('/auth/influencer-profile/', { ...profile, cover_image: res.data.url });
      queryClient.invalidateQueries('influencer-profile');
      setCoverImageFile(null);
      setCoverImagePreview(null);
      toast.dismiss();
      toast.success('Cover updated!');
    } catch {
      toast.dismiss();
      toast.error('Failed to upload cover');
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    reset(profile);
    // Clear file uploads
    setLatestReviewCoverFile(null);
    setLatestReviewCoverPreview(null);
    setMostViewedCoverFile(null);
    setMostViewedCoverPreview(null);
    setProfilePicFile(null);
    setProfilePicPreview(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your portfolio...</p>
        </div>
      </div>
    );
  }

  // Helper function to format numbers
  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const profileScore = Math.min(100, [
    profile?.bio ? 15 : 0,
    profile?.profile_image ? 15 : 0,
    profile?.instagram_handle ? 15 : 0,
    profile?.youtube_channel ? 15 : 0,
    profile?.followers_count > 0 ? 15 : 0,
    profile?.engagement_rate > 0 ? 10 : 0,
    profile?.rate_per_post > 0 ? 10 : 0,
    profile?.category ? 5 : 0,
  ].reduce((a, b) => a + b, 0));

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      {!isEditing ? (
        /* ── PROFILE VIEW ── */
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full space-y-4">

          {/* ── HERO CARD ── */}
          <div className="bg-white shadow-sm border-b border-gray-200 overflow-hidden">
            {/* Banner */}
            <div className="h-40 sm:h-52 relative overflow-hidden group/banner">
              {(coverImagePreview || profile?.cover_image) ? (
                <img src={coverImagePreview || profile.cover_image} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <>
                  {/* Purple gradient base */}
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #581c87 0%, #7c3aed 35%, #a855f7 65%, #c026d3 100%)' }} />
                  {/* Soft radial glow top-left */}
                  <div className="absolute -top-10 -left-10 w-64 h-64 rounded-full opacity-30" style={{ background: 'radial-gradient(circle, #e879f9 0%, transparent 70%)' }} />
                  {/* Soft radial glow bottom-right */}
                  <div className="absolute -bottom-8 right-16 w-56 h-56 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #818cf8 0%, transparent 70%)' }} />
                  {/* Diagonal mesh lines */}
                  <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="diag" width="32" height="32" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                        <line x1="0" y1="0" x2="0" y2="32" stroke="white" strokeWidth="1"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#diag)" />
                  </svg>
                </>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              {/* Change cover button — appears on hover */}
              <label className="absolute bottom-3 right-4 cursor-pointer opacity-0 group-hover/banner:opacity-100 transition-opacity">
                <input type="file" accept="image/*" className="hidden" onChange={e => handleCoverImageChange(e.target.files[0])} />
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-sm border border-white/20 text-white text-[11px] font-semibold hover:bg-black/60 transition-colors">
                  <Camera className="w-3.5 h-3.5" />
                  Change Cover
                </div>
              </label>
              {/* Inline stats on banner — top right */}
              <div className="absolute top-4 right-6 flex items-center gap-2">
                {profile?.followers_count > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 backdrop-blur-sm border border-white/20">
                    <Users className="w-3 h-3 text-white" />
                    <span className="text-white text-[12px] font-semibold">{formatNumber(profile.followers_count)}</span>
                    <span className="text-white/70 text-[10px]">followers</span>
                  </div>
                )}
                {profile?.engagement_rate > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 backdrop-blur-sm border border-white/20">
                    <TrendingUp className="w-3 h-3 text-white" />
                    <span className="text-white text-[12px] font-semibold">{profile.engagement_rate}%</span>
                    <span className="text-white/70 text-[10px]">engagement</span>
                  </div>
                )}
              </div>
            </div>

            {/* Profile info */}
            <div className="px-6 sm:px-10 pb-5">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-14 mb-4">
                <div className="relative w-24 h-24 rounded-2xl ring-4 ring-white shadow-2xl overflow-hidden flex-shrink-0">
                  {profile?.profile_image ? (
                    <img src={profile.profile_image} alt={profile?.username} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                      <span className="text-4xl font-black text-white">{profile?.username?.charAt(0)?.toUpperCase() || 'U'}</span>
                    </div>
                  )}
                  <div className="absolute bottom-1.5 right-1.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white shadow" />
                </div>
                <button onClick={handleEdit}
                  className="self-start sm:self-auto inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold tracking-wide hover:bg-gray-700 transition-colors shadow">
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Profile
                </button>
              </div>

              <div className="mb-3">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">{profile?.username || 'Influencer'}</h1>
                  {profile?.category && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase" style={{ background:'#ede9fe', color:'#6d28d9' }}>
                      {profile.category}
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-gray-400 font-medium mb-2">@{profile?.username || 'username'}</p>
                {profile?.bio && <p className="text-[13px] text-gray-600 leading-relaxed max-w-3xl">{profile.bio}</p>}
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {profile?.location && (
                  <span className="inline-flex items-center gap-1 text-[12px] text-gray-500">
                    <MapPin className="w-3 h-3 text-gray-400" />{profile.location}
                  </span>
                )}
                {profile?.instagram_handle && (
                  <a href={`https://instagram.com/${profile.instagram_handle.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-white"
                    style={{ background:'linear-gradient(135deg,#e1306c,#833ab4)' }}>
                    <Instagram className="w-2.5 h-2.5" />{profile.instagram_handle}
                  </a>
                )}
                {profile?.youtube_channel && (
                  <a href={profile.youtube_channel} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors">
                    <Youtube className="w-2.5 h-2.5" />YouTube
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* ── BODY ── */}
          <div className="px-6 sm:px-10 space-y-4 pb-8">

            {/* About + Rates */}
            <div className="grid lg:grid-cols-2 gap-4">
              {/* About */}
              <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">About</p>
                <p className="text-[13px] text-gray-600 leading-relaxed mb-3">
                  {profile?.bio || 'No bio yet. Click Edit Profile to add your story.'}
                </p>
                <div className="space-y-2">
                  {profile?.category && (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style={{ background:'#ede9fe' }}>
                        <Target className="w-3 h-3" style={{ color:'#7c3aed' }} />
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Niche</p>
                        <p className="text-[12px] font-semibold text-gray-800">{profile.category.charAt(0).toUpperCase()+profile.category.slice(1)}</p>
                      </div>
                    </div>
                  )}
                  {profile?.location && (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style={{ background:'#dbeafe' }}>
                        <MapPin className="w-3 h-3 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Location</p>
                        <p className="text-[12px] font-semibold text-gray-800">{profile.location}</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Rates */}
              <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Rates & Pricing</p>
                {(profile?.rate_per_post > 0 || profile?.rate_per_story > 0 || profile?.rate_per_reel > 0) ? (
                  <div>
                    {profile?.rate_per_post > 0 && (
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-[12px] text-gray-500">Per Post</span>
                        <span className="text-[13px] font-bold" style={{ color:'#7c3aed' }}>₹{Number(profile.rate_per_post).toLocaleString()}</span>
                      </div>
                    )}
                    {profile?.rate_per_story > 0 && (
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-[12px] text-gray-500">Per Story</span>
                        <span className="text-[13px] font-bold" style={{ color:'#7c3aed' }}>₹{Number(profile.rate_per_story).toLocaleString()}</span>
                      </div>
                    )}
                    {profile?.rate_per_reel > 0 && (
                      <div className="flex items-center justify-between py-2">
                        <span className="text-[12px] text-gray-500">Per Reel</span>
                        <span className="text-[13px] font-bold" style={{ color:'#7c3aed' }}>₹{Number(profile.rate_per_reel).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <DollarSign className="w-6 h-6 text-gray-200 mx-auto mb-1" />
                    <p className="text-[12px] text-gray-400 mb-1">No rates set yet</p>
                    <button onClick={handleEdit} className="text-[11px] font-semibold hover:underline" style={{ color:'#7c3aed' }}>Add rates →</button>
                  </div>
                )}
              </motion.div>

            </div>

            {/* Featured Content — smaller horizontal cards */}
            {(profile?.latest_product_review_link || profile?.most_viewed_content_link) && (
              <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25 }}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Featured Content</p>
                <div className="grid md:grid-cols-2 gap-3">
                  {profile?.latest_product_review_link && (
                    <a href={profile.latest_product_review_link} target="_blank" rel="noopener noreferrer"
                      className="group flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 hover:border-violet-200 hover:bg-violet-50/30 transition-all">
                      <div className="w-16 h-12 rounded-md overflow-hidden flex-shrink-0 relative bg-gray-100">
                        {profile?.latest_product_review_cover ? (
                          <img src={profile.latest_product_review_cover} alt="Latest Review" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ background:'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                            <Play className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Play className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-gray-900 mb-0.5">Latest Product Review</p>
                        <div className="flex gap-2 text-[10px] text-gray-400">
                          <span className="flex items-center gap-0.5"><Eye className="w-2.5 h-2.5" />{formatNumber(profile?.latest_product_review_views||0)}</span>
                          <span className="flex items-center gap-0.5"><Heart className="w-2.5 h-2.5" />{formatNumber(profile?.latest_product_review_likes||0)}</span>
                        </div>
                      </div>
                    </a>
                  )}
                  {profile?.most_viewed_content_link && (
                    <a href={profile.most_viewed_content_link} target="_blank" rel="noopener noreferrer"
                      className="group flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 hover:border-pink-200 hover:bg-pink-50/30 transition-all">
                      <div className="w-16 h-12 rounded-md overflow-hidden flex-shrink-0 relative bg-gray-100">
                        {profile?.most_viewed_content_cover ? (
                          <img src={profile.most_viewed_content_cover} alt="Most Viewed" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ background:'linear-gradient(135deg,#ec4899,#f43f5e)' }}>
                            <Play className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Play className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-gray-900 mb-0.5">Most Viewed Content</p>
                        <div className="flex gap-2 text-[10px] text-gray-400">
                          <span className="flex items-center gap-0.5"><Eye className="w-2.5 h-2.5" />{formatNumber(profile?.most_viewed_content_views||0)}</span>
                          <span className="flex items-center gap-0.5"><Heart className="w-2.5 h-2.5" />{formatNumber(profile?.most_viewed_content_likes||0)}</span>
                        </div>
                      </div>
                    </a>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      ) : (
          /* MODERN EDIT FORM */
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sm:p-12">
              {/* Form Header */}
              <div className="mb-8 pb-6 border-b border-gray-200">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Edit Profile</h1>
                <p className="text-gray-600">Update your portfolio information and showcase your best work</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              
              {/* Profile Picture Upload */}
              <div className="pb-8 border-b border-gray-200">
                <label className="block text-lg font-bold text-gray-900 mb-4">
                  <Camera className="w-5 h-5 inline mr-2" />
                  Profile Picture
                </label>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  {/* Current/Preview Image */}
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-gray-200 shadow-lg">
                      {profilePicPreview || profile?.profile_image ? (
                        <img
                          src={profilePicPreview || profile?.profile_image}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                          <span className="text-4xl font-black text-white">
                            {profile?.username?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Remove button */}
                    {(profilePicPreview || profile?.profile_image) && (
                      <button
                        type="button"
                        onClick={() => {
                          setProfilePicFile(null);
                          setProfilePicPreview(null);
                        }}
                        className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Upload Button */}
                  <div className="flex-1">
                    <input
                      id="profile-pic-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePicChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('profile-pic-upload').click()}
                      className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors shadow-md font-medium"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      <span>Upload New Photo</span>
                    </button>
                    <p className="text-sm text-gray-600 mt-3">
                      JPG, PNG or GIF. Max size 5MB. Recommended: 400x400px
                    </p>
                  </div>
                </div>
              </div>

              {/* Bio Section */}
              <div className="pb-8 border-b border-gray-200">
                <label className="block text-lg font-bold text-gray-900 mb-4">
                  <MessageCircle className="w-5 h-5 inline mr-2" />
                  Bio
                </label>
                <textarea
                  {...register('bio', { required: 'Bio is required' })}
                  rows={5}
                  className="w-full px-5 py-4 border border-gray-300 rounded-2xl resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="Tell your audience about yourself, your content style, and what makes you unique..."
                />
                {errors.bio && <p className="text-red-500 text-sm mt-2">{errors.bio.message}</p>}
              </div>

              {/* Basic Info Section */}
              <div className="pb-8 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Category</label>
                    <select 
                      {...register('category')} 
                      className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    >
                      <option value="">Select Category</option>
                      <option value="fashion">Fashion</option>
                      <option value="beauty">Beauty</option>
                      <option value="fitness">Fitness</option>
                      <option value="food">Food</option>
                      <option value="travel">Travel</option>
                      <option value="tech">Technology</option>
                      <option value="lifestyle">Lifestyle</option>
                      <option value="gaming">Gaming</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Location
                    </label>
                    <input
                      type="text"
                      {...register('location')}
                      className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="City, Country"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      <Users className="w-4 h-4 inline mr-1" />
                      Total Followers
                    </label>
                    <input
                      type="number"
                      {...register('followers_count')}
                      className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      <TrendingUp className="w-4 h-4 inline mr-1" />
                      Engagement Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('engagement_rate')}
                      className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Rates & Pricing Section */}
              <div className="pb-8 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-primary-600" />
                  Rates & Pricing (₹)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Rate per Post</label>
                    <input 
                      type="number" 
                      {...register('rate_per_post')} 
                      className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" 
                      placeholder="5000" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Rate per Story</label>
                    <input 
                      type="number" 
                      {...register('rate_per_story')} 
                      className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" 
                      placeholder="2000" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Rate per Reel</label>
                    <input 
                      type="number" 
                      {...register('rate_per_reel')} 
                      className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" 
                      placeholder="8000" 
                    />
                  </div>
                </div>
              </div>

              {/* Social Media Connect Section */}
              <div className="pb-8 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary-600" />
                  Social Media Handles
                </h3>
                <p className="text-sm text-gray-500 mb-5">
                  Enter your handle or URL, then click <strong>Fetch Stats</strong> to automatically pull your followers, likes, comments and engagement rate.
                </p>

                <div className="space-y-6">

                  {/* ── Instagram ── */}
                  <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-5 border border-pink-100">
                    <div className="flex items-center gap-2 mb-3">
                      <Instagram className="w-5 h-5 text-pink-500" />
                      <label className="text-sm font-bold text-gray-900">Instagram Handle</label>
                    </div>

                    <div className="flex gap-3">
                      <input
                        type="text"
                        {...register('instagram_handle')}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all text-sm"
                        placeholder="@username"
                      />
                      <button
                        type="button"
                        onClick={() => fetchSocialStats('instagram')}
                        disabled={igLoading}
                        className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg disabled:opacity-60 transition-all whitespace-nowrap"
                      >
                        {igLoading ? (
                          <><Loader className="w-4 h-4 animate-spin" /> Fetching...</>
                        ) : (
                          <><RefreshCw className="w-4 h-4" /> Fetch Stats</>
                        )}
                      </button>
                    </div>

                    {/* Instagram error */}
                    {igError && (
                      <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                        <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-red-600">{igError}</p>
                      </div>
                    )}

                    {/* Instagram stats preview */}
                    {igStats && !igError && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 bg-white rounded-xl border border-pink-200 p-4 shadow-sm"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-xs font-bold text-green-700 uppercase tracking-wide">Live Stats Fetched</span>
                          <span className="ml-auto text-xs text-gray-400">via instaloader</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="text-center bg-pink-50 rounded-lg p-2">
                            <p className="text-lg font-black text-gray-900">{igStats.followers?.toLocaleString() || '0'}</p>
                            <p className="text-xs text-gray-500">Followers</p>
                          </div>
                          <div className="text-center bg-purple-50 rounded-lg p-2">
                            <p className="text-lg font-black text-gray-900">{igStats.following?.toLocaleString() || '0'}</p>
                            <p className="text-xs text-gray-500">Following</p>
                          </div>
                          <div className="text-center bg-rose-50 rounded-lg p-2">
                            <p className="text-lg font-black text-gray-900">{igStats.likes?.toLocaleString() || '0'}</p>
                            <p className="text-xs text-gray-500">Avg Likes</p>
                          </div>
                          <div className="text-center bg-indigo-50 rounded-lg p-2">
                            <p className="text-lg font-black text-gray-900">{igStats.engagement_rate}%</p>
                            <p className="text-xs text-gray-500">Engagement</p>
                          </div>
                        </div>
                        <div className="flex gap-3 mt-3 text-xs text-gray-500">
                          <span>{igStats.posts?.toLocaleString()} posts</span>
                          <span>·</span>
                          <span>{igStats.comments} avg comments</span>
                          {igStats.is_verified && <span className="text-blue-500 font-bold">· Verified</span>}
                          {igStats.is_private && <span className="text-orange-500 font-bold">· Private</span>}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Followers & engagement auto-populated in your profile stats</p>
                      </motion.div>
                    )}
                  </div>

                  {/* ── YouTube ── */}
                  <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-5 border border-red-100">
                    <div className="flex items-center gap-2 mb-3">
                      <Youtube className="w-5 h-5 text-red-500" />
                      <label className="text-sm font-bold text-gray-900">YouTube Channel</label>
                    </div>

                    <div className="flex gap-3">
                      <input
                        type="text"
                        {...register('youtube_channel')}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all text-sm"
                        placeholder="https://youtube.com/@channel or Channel URL"
                      />
                      <button
                        type="button"
                        onClick={() => fetchSocialStats('youtube')}
                        disabled={ytLoading}
                        className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-semibold text-sm hover:shadow-lg disabled:opacity-60 transition-all whitespace-nowrap"
                      >
                        {ytLoading ? (
                          <><Loader className="w-4 h-4 animate-spin" /> Fetching...</>
                        ) : (
                          <><RefreshCw className="w-4 h-4" /> Fetch Stats</>
                        )}
                      </button>
                    </div>

                    {/* YouTube API key warning */}
                    <p className="mt-2 text-xs text-orange-600">
                      Requires a valid <strong>YOUTUBE_API_KEY</strong> in the server .env file. Contact your admin to set it up.
                    </p>

                    {/* YouTube error */}
                    {ytError && (
                      <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                        <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-red-600">{ytError}</p>
                      </div>
                    )}

                    {/* YouTube stats preview */}
                    {ytStats && !ytError && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 bg-white rounded-xl border border-red-200 p-4 shadow-sm"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-xs font-bold text-green-700 uppercase tracking-wide">Live Stats Fetched</span>
                          <span className="ml-auto text-xs text-gray-400">via YouTube Data API</span>
                        </div>
                        {ytStats.thumbnail && (
                          <div className="flex items-center gap-3 mb-3">
                            <img src={ytStats.thumbnail} alt={ytStats.title} className="w-10 h-10 rounded-full" />
                            <div>
                              <p className="font-bold text-sm text-gray-900">{ytStats.title}</p>
                              <a href={ytStats.profile_url} target="_blank" rel="noopener noreferrer" className="text-xs text-red-500 hover:underline">{ytStats.profile_url}</a>
                            </div>
                          </div>
                        )}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="text-center bg-red-50 rounded-lg p-2">
                            <p className="text-lg font-black text-gray-900">{ytStats.subscribers?.toLocaleString() || '0'}</p>
                            <p className="text-xs text-gray-500">Subscribers</p>
                          </div>
                          <div className="text-center bg-orange-50 rounded-lg p-2">
                            <p className="text-lg font-black text-gray-900">{ytStats.total_views?.toLocaleString() || '0'}</p>
                            <p className="text-xs text-gray-500">Total Views</p>
                          </div>
                          <div className="text-center bg-yellow-50 rounded-lg p-2">
                            <p className="text-lg font-black text-gray-900">{ytStats.likes?.toLocaleString() || '0'}</p>
                            <p className="text-xs text-gray-500">Avg Likes</p>
                          </div>
                          <div className="text-center bg-amber-50 rounded-lg p-2">
                            <p className="text-lg font-black text-gray-900">{ytStats.engagement_rate}%</p>
                            <p className="text-xs text-gray-500">Engagement</p>
                          </div>
                        </div>
                        <div className="flex gap-3 mt-3 text-xs text-gray-500">
                          <span>{ytStats.video_count?.toLocaleString()} videos</span>
                          <span>·</span>
                          <span>{ytStats.comments} avg comments</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Subscribers & engagement auto-populated in your profile stats</p>
                      </motion.div>
                    )}
                  </div>

                </div>
              </div>


              {/* Featured Content Section */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Featured Content</h3>
                <div className="space-y-6">
                  {/* Latest Product Review */}
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                    <h4 className="text-base font-bold text-gray-900 mb-4">Latest Product Review</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Video Link
                        </label>
                        <input 
                          type="url" 
                          {...register('latest_product_review_link')} 
                          className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" 
                          placeholder="https://youtube.com/..." 
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Cover Image
                        </label>
                        
                        {/* Tab buttons for URL or Upload */}
                        <div className="flex space-x-2 mb-3">
                          <button
                            type="button"
                            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-xl bg-primary-100 text-primary-700 border border-primary-200"
                          >
                            <LinkIcon className="w-4 h-4" />
                            <span>URL</span>
                          </button>
                          <button
                            type="button"
                            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-xl bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors"
                            onClick={() => document.getElementById('latest-review-cover-upload').click()}
                          >
                            <Upload className="w-4 h-4" />
                            <span>Upload File</span>
                          </button>
                        </div>

                        {/* URL Input */}
                        <input 
                          type="url" 
                          {...register('latest_product_review_cover')} 
                          className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all mb-2" 
                          placeholder="https://... or leave empty for auto" 
                        />

                        {/* File Upload (Hidden) */}
                        <input
                          id="latest-review-cover-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleLatestReviewCoverChange}
                          className="hidden"
                        />

                        {/* Preview */}
                        {latestReviewCoverPreview && (
                          <div className="mt-3 relative">
                            <img 
                              src={latestReviewCoverPreview} 
                              alt="Cover preview" 
                              className="w-full h-40 object-cover rounded-xl"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setLatestReviewCoverFile(null);
                                setLatestReviewCoverPreview(null);
                              }}
                              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        <p className="text-sm text-gray-600 mt-2">
                          Enter URL, upload an image, or leave empty to auto-fetch from YouTube
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          View Count
                        </label>
                        <input 
                          type="number" 
                          {...register('latest_product_review_views', { valueAsNumber: true })} 
                          className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" 
                          placeholder="125000"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Like Count
                        </label>
                        <input 
                          type="number" 
                          {...register('latest_product_review_likes', { valueAsNumber: true })} 
                          className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" 
                          placeholder="8500"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Most Viewed Content */}
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                    <h4 className="text-base font-bold text-gray-900 mb-4">Most Viewed Content</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Video Link
                        </label>
                        <input 
                          type="url" 
                          {...register('most_viewed_content_link')} 
                          className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" 
                          placeholder="https://youtube.com/..." 
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Cover Image
                        </label>
                        
                        {/* Tab buttons for URL or Upload */}
                        <div className="flex space-x-2 mb-3">
                          <button
                            type="button"
                            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-xl bg-primary-100 text-primary-700 border border-primary-200"
                          >
                            <LinkIcon className="w-4 h-4" />
                            <span>URL</span>
                          </button>
                          <button
                            type="button"
                            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-xl bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors"
                            onClick={() => document.getElementById('most-viewed-cover-upload').click()}
                          >
                            <Upload className="w-4 h-4" />
                            <span>Upload File</span>
                          </button>
                        </div>

                        {/* URL Input */}
                        <input 
                          type="url" 
                          {...register('most_viewed_content_cover')} 
                          className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all mb-2" 
                          placeholder="https://... or leave empty for auto" 
                        />

                        {/* File Upload (Hidden) */}
                        <input
                          id="most-viewed-cover-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleMostViewedCoverChange}
                          className="hidden"
                        />

                        {/* Preview */}
                        {mostViewedCoverPreview && (
                          <div className="mt-3 relative">
                            <img 
                              src={mostViewedCoverPreview} 
                              alt="Cover preview" 
                              className="w-full h-40 object-cover rounded-xl"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setMostViewedCoverFile(null);
                                setMostViewedCoverPreview(null);
                              }}
                              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        <p className="text-sm text-gray-600 mt-2">
                          Enter URL, upload an image, or leave empty to auto-fetch from YouTube
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          View Count
                        </label>
                        <input 
                          type="number" 
                          {...register('most_viewed_content_views', { valueAsNumber: true })} 
                          className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" 
                          placeholder="156000"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Like Count
                        </label>
                        <input 
                          type="number" 
                          {...register('most_viewed_content_likes', { valueAsNumber: true })} 
                          className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" 
                          placeholder="12000"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6">
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)} 
                  className="inline-flex items-center justify-center px-8 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={updateProfileMutation.isLoading} 
                  className="inline-flex items-center justify-center px-8 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateProfileMutation.isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfluencerProfile;
