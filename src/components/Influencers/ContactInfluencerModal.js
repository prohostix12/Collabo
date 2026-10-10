import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { X, Send, DollarSign, MessageCircle, Briefcase, Clock, Target, CheckCircle, ArrowRight, ArrowLeft, Users } from 'lucide-react';

const ContactInfluencerModal = ({ influencer, isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1); // 1: Contact Info, 2: Campaign Details
  
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm({
    defaultValues: {
      contact_type: 'collaboration',
      message: '',
      campaign_title: '',
      campaign_description: '',
      budget: '',
      timeline: '',
      deliverables: '',
      requirements: ''
    }
  });

  // Watch form values
  const messageValue = watch('message');
  const contactType = watch('contact_type');

  // Debug logging and form reset
  React.useEffect(() => {
    if (isOpen && influencer) {
      console.log('ContactInfluencerModal opened for:', influencer);
      console.log('Influencer keys:', Object.keys(influencer));
      console.log('Influencer.user:', influencer.user);
      console.log('Influencer.user_id:', influencer.user_id);
      console.log('Influencer.id:', influencer.id);
      
      // Check what ID we should use
      const influencerId = influencer.user; // This is the User ID
      console.log('Will use influencer ID:', influencerId);
      
      // Reset form when modal opens
      reset({
        contact_type: 'collaboration',
        message: '',
        campaign_title: '',
        campaign_description: '',
        budget: '',
        timeline: '',
        deliverables: '',
        requirements: ''
      });
      setStep(1);
    }
  }, [isOpen, influencer, reset]);

  const createCollaborationMutation = useMutation(
    (data) => {
      console.log('Creating collaboration request with data:', data);
      console.log('Influencer object for collaboration:', influencer);
      
      // Get the correct influencer ID
      const influencerId = influencer.user; // This is the User ID
      console.log('Using influencer ID for collaboration:', influencerId);
      
      return api.post('/collaborations/direct-requests/', {
        ...data,
        influencer: influencerId
      });
    },
    {
      onSuccess: (response) => {
        console.log('Collaboration request created successfully:', response);
        toast.success('Collaboration request sent successfully!');
        queryClient.invalidateQueries('collaboration-requests');
        reset();
        setStep(1); // Reset to first step
        onClose();
      },
      onError: (error) => {
        console.error('Collaboration request failed:', error);
        console.error('Error response:', error.response?.data);
        const errorMessage = error.response?.data?.detail || 
                           error.response?.data?.message || 
                           error.response?.data?.error ||
                           Object.values(error.response?.data || {}).flat().join(', ') ||
                           'Failed to send collaboration request';
        toast.error(errorMessage);
      }
    }
  );

  const sendMessageMutation = useMutation(
    (data) => {
      console.log('Sending message with data:', data);
      console.log('Influencer object for message:', influencer);
      
      // Get the correct influencer ID
      const influencerId = influencer.user; // This is the User ID
      console.log('Using influencer ID:', influencerId);
      
      if (!influencerId || typeof influencerId !== 'number') {
        throw new Error('Invalid influencer ID');
      }
      
      // For direct message, create a direct collaboration request
      const requestData = {
        influencer: influencerId,
        message: data.message,
        campaign_details: {
          title: 'Direct Message',
          type: 'message',
          description: 'Direct message communication'
        }
      };
      
      console.log('Sending request data:', requestData);
      return api.post('/collaborations/direct-requests/', requestData);
    },
    {
      onSuccess: (response) => {
        console.log('Message sent successfully:', response);
        toast.success('Message sent successfully!');
        reset();
        onClose();
      },
      onError: (error) => {
        console.error('Message send failed:', error);
        console.error('Error response:', error.response?.data);
        
        let errorMessage = 'Failed to send message';
        
        if (error.message === 'Invalid influencer ID') {
          errorMessage = 'Invalid influencer data. Please refresh the page and try again.';
        } else if (error.response?.data) {
          const data = error.response.data;
          if (data.detail) {
            errorMessage = data.detail;
          } else if (data.message) {
            errorMessage = data.message;
          } else if (data.error) {
            errorMessage = data.error;
          } else if (data.influencer) {
            errorMessage = `Influencer: ${Array.isArray(data.influencer) ? data.influencer.join(', ') : data.influencer}`;
          } else {
            // Try to extract any error messages from the response
            const errors = Object.entries(data).map(([key, value]) => {
              if (Array.isArray(value)) {
                return `${key}: ${value.join(', ')}`;
              }
              return `${key}: ${value}`;
            });
            if (errors.length > 0) {
              errorMessage = errors.join('; ');
            }
          }
        }
        
        toast.error(errorMessage);
      }
    }
  );

  // Calculate if button should be disabled (after mutations are defined)
  const isButtonDisabled = !messageValue || messageValue.trim().length < 10 || sendMessageMutation.isLoading;

  const onSubmit = (data) => {
    console.log('Form submitted with data:', data);
    console.log('Influencer object:', influencer);
    console.log('Contact type:', contactType);
    
    // Get the correct influencer ID
    const influencerId = influencer.user; // This is the User ID
    console.log('Using influencer ID:', influencerId);
    
    if (!influencerId || typeof influencerId !== 'number') {
      toast.error('Invalid influencer data. Please try again.');
      return;
    }
    
    if (contactType === 'collaboration') {
      // Create collaboration request
      const collaborationData = {
        influencer: influencerId,
        message: data.message,
        proposed_rate: parseFloat(data.budget) || null,
        campaign_details: {
          title: data.campaign_title,
          description: data.campaign_description,
          timeline: data.timeline,
          deliverables: data.deliverables,
          requirements: data.requirements
        }
      };
      console.log('Sending collaboration data:', collaborationData);
      createCollaborationMutation.mutate(collaborationData);
    } else {
      // Send direct message
      const messageData = {
        message: data.message
      };
      console.log('Sending message data:', messageData);
      sendMessageMutation.mutate(messageData);
    }
  };

  const nextStep = () => {
    console.log('nextStep called:', { contactType, messageLength: messageValue?.trim().length });
    
    // Validate message first
    if (!messageValue || messageValue.trim().length < 10) {
      toast.error('Please enter a message with at least 10 characters');
      return;
    }

    if (contactType === 'collaboration') {
      console.log('Moving to step 2 for collaboration');
      setStep(2);
    } else {
      console.log('Sending direct message');
      // For direct message, submit the form
      const formData = { message: messageValue.trim() };
      sendMessageMutation.mutate(formData);
    }
  };

  const prevStep = () => setStep(1);

  const handleClose = () => {
    reset();
    setStep(1);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[95vh] overflow-hidden shadow-2xl transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-lg">
                    {influencer.profile_image ? (
                      <img
                        src={influencer.profile_image}
                        alt={influencer.username}
                        className="w-20 h-20 rounded-2xl object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-white">
                        {influencer.username ? influencer.username.charAt(0).toUpperCase() : 'U'}
                      </span>
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-primary-500 rounded-full p-2 shadow-lg">
                    <MessageCircle className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Contact {influencer.username}
                  </h2>
                  <div className="flex items-center space-x-4 text-primary-100">
                    <span className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{influencer.followers_count?.toLocaleString()} followers</span>
                    </span>
                    <span>•</span>
                    <span className="capitalize">{influencer.category}</span>
                    <span>•</span>
                    <span>₹{influencer.rate_per_post || 0} per post</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-white hover:text-primary-200 bg-white bg-opacity-20 rounded-full p-3 hover:bg-opacity-30 transition-all duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Progress Indicator */}
            {contactType === 'collaboration' && (
              <div className="flex items-center space-x-4">
                <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-white' : 'text-primary-300'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-white text-primary-600' : 'bg-primary-500'}`}>
                    {step > 1 ? <CheckCircle className="h-5 w-5" /> : '1'}
                  </div>
                  <span className="font-medium">Contact Info</span>
                </div>
                <ArrowRight className="h-4 w-4 text-primary-300" />
                <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-white' : 'text-primary-300'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-white text-primary-600' : 'bg-primary-500'}`}>
                    2
                  </div>
                  <span className="font-medium">Campaign Details</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(95vh-200px)]">
          <form onSubmit={handleSubmit(onSubmit)} className="p-8">
            {step === 1 && (
              <div className="space-y-8 animate-fadeIn">
                {/* Contact Type Selection */}
                <div>
                  <label className="block text-lg font-semibold text-gray-900 mb-6">
                    What would you like to do?
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <label className="relative cursor-pointer group">
                      <input
                        type="radio"
                        value="collaboration"
                        {...register('contact_type')}
                        className="sr-only"
                      />
                      <div className={`p-6 border-2 rounded-2xl transition-all duration-300 ${
                        contactType === 'collaboration' 
                          ? 'border-primary-500 bg-primary-50 shadow-lg transform scale-105' 
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }`}>
                        <div className="flex items-center space-x-4">
                          <div className={`p-3 rounded-xl ${contactType === 'collaboration' ? 'bg-primary-600' : 'bg-gray-100 group-hover:bg-gray-200'}`}>
                            <Briefcase className={`h-8 w-8 ${contactType === 'collaboration' ? 'text-white' : 'text-gray-900'}`} />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">Start Collaboration</h3>
                            <p className="text-gray-900">Create a detailed campaign proposal with budget and deliverables</p>
                          </div>
                        </div>
                      </div>
                    </label>

                    <label className="relative cursor-pointer group">
                      <input
                        type="radio"
                        value="message"
                        {...register('contact_type')}
                        className="sr-only"
                      />
                      <div className={`p-6 border-2 rounded-2xl transition-all duration-300 ${
                        contactType === 'message' 
                          ? 'border-primary-500 bg-primary-50 shadow-lg transform scale-105' 
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }`}>
                        <div className="flex items-center space-x-4">
                          <div className={`p-3 rounded-xl ${contactType === 'message' ? 'bg-primary-600' : 'bg-gray-100 group-hover:bg-gray-200'}`}>
                            <MessageCircle className={`h-8 w-8 ${contactType === 'message' ? 'text-white' : 'text-gray-900'}`} />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">Send Message</h3>
                            <p className="text-gray-900">Start with a simple introduction or inquiry</p>
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Message Input */}
                <div>
                  <label className="block text-lg font-semibold text-gray-900 mb-3">
                    {contactType === 'collaboration' ? '✨ Introduction Message' : '💬 Your Message'}
                  </label>
                  <div className="relative">
                    <textarea
                      {...register('message', { 
                        required: 'Message is required',
                        minLength: { value: 10, message: 'Message must be at least 10 characters' }
                      })}
                      rows={6}
                      className="w-full border-2 border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 p-4 text-gray-900 placeholder-gray-500 transition-all duration-200"
                      placeholder={
                        contactType === 'collaboration' 
                          ? "Hi! I'm interested in collaborating with you on an exciting campaign. I believe your content style would be perfect for our brand..." 
                          : "Hi! I wanted to reach out to you about a potential opportunity. I've been following your content and..."
                      }
                    />
                    <div className="absolute bottom-4 right-4 text-sm text-gray-900">
                      {messageValue?.length || 0} characters
                    </div>
                  </div>
                  {errors.message && (
                    <p className="text-red-500 text-sm mt-2 flex items-center space-x-1">
                      <X className="h-4 w-4" />
                      <span>{errors.message.message}</span>
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-8 py-3 text-gray-900 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={isButtonDisabled}
                    className="px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2"
                  >
                    {sendMessageMutation.isLoading && contactType === 'message' ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Sending...</span>
                      </>
                    ) : contactType === 'collaboration' ? (
                      <>
                        <span>Next: Campaign Details</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {step === 2 && contactType === 'collaboration' && (
              <div className="space-y-8 animate-fadeIn">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="p-3 bg-primary-100 rounded-xl">
                    <Briefcase className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Campaign Details</h3>
                    <p className="text-gray-900">Tell us more about your collaboration idea</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Campaign Title *
                      </label>
                      <input
                        type="text"
                        {...register('campaign_title', { required: 'Campaign title is required' })}
                        className="w-full border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 p-4 text-gray-900 placeholder-gray-500 transition-all duration-200"
                        placeholder="e.g., Summer Fashion Collection 2024"
                      />
                      {errors.campaign_title && (
                        <p className="text-red-500 text-sm mt-2 flex items-center space-x-1">
                          <X className="h-4 w-4" />
                          <span>{errors.campaign_title.message}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Proposed Budget ($)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <DollarSign className="h-5 w-5 text-gray-900" />
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          {...register('budget')}
                          className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 placeholder-gray-500 transition-all duration-200"
                          placeholder={`Suggested: ₹${influencer.rate_per_post || 500}`}
                        />
                      </div>
                      <p className="text-sm text-gray-900 mt-2">
                        💡 Suggested rate: ₹{influencer.rate_per_post || 500} based on their profile
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Timeline
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Clock className="h-5 w-5 text-gray-900" />
                        </div>
                        <input
                          type="text"
                          {...register('timeline')}
                          className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 placeholder-gray-500 transition-all duration-200"
                          placeholder="e.g., 2 weeks, by end of March, flexible"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Campaign Description *
                      </label>
                      <textarea
                        {...register('campaign_description', { required: 'Campaign description is required' })}
                        rows={4}
                        className="w-full border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 p-4 text-gray-900 placeholder-gray-500 transition-all duration-200"
                        placeholder="Describe your campaign, brand story, and what makes this collaboration special..."
                      />
                      {errors.campaign_description && (
                        <p className="text-red-500 text-sm mt-2 flex items-center space-x-1">
                          <X className="h-4 w-4" />
                          <span>{errors.campaign_description.message}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Deliverables *
                      </label>
                      <div className="relative">
                        <div className="absolute top-4 left-4 pointer-events-none">
                          <Target className="h-5 w-5 text-gray-900" />
                        </div>
                        <textarea
                          {...register('deliverables', { required: 'Deliverables are required' })}
                          rows={3}
                          className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 placeholder-gray-500 transition-all duration-200"
                          placeholder="e.g., 2 Instagram posts, 1 story highlight, 1 reel with product showcase"
                        />
                      </div>
                      {errors.deliverables && (
                        <p className="text-red-500 text-sm mt-2 flex items-center space-x-1">
                          <X className="h-4 w-4" />
                          <span>{errors.deliverables.message}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Special Requirements
                      </label>
                      <textarea
                        {...register('requirements')}
                        rows={3}
                        className="w-full border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 p-4 text-gray-900 placeholder-gray-500 transition-all duration-200"
                        placeholder="Any specific hashtags, mentions, styling requirements, or brand guidelines..."
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between pt-8 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-8 py-3 text-gray-900 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium transition-all duration-200 flex items-center space-x-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back</span>
                  </button>
                  <div className="space-x-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-8 py-3 text-gray-900 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createCollaborationMutation.isLoading}
                      className="px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2"
                    >
                      {createCollaborationMutation.isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          <span>Send Collaboration Request</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactInfluencerModal;