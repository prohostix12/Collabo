from rest_framework import generics, status, permissions, filters, parsers
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import check_password
from django.utils import timezone
from .models import User, InfluencerProfile, CompanyProfile, SellerProfile
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, 
    UserSerializer, InfluencerProfileSerializer, CompanyProfileSerializer,
    ChangePasswordSerializer, PendingInfluencerSerializer, ApprovalActionSerializer,
    SellerProfileSerializer
)
from .youtube_service import VideoStatsService

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Create profile based on user type
        if user.user_type == 'influencer':
            profile_data = {
                'bio': request.data.get('bio', ''),
                'category': request.data.get('category', ''),
                'preferred_platforms': request.data.get('preferred_platforms', []),
            }
            profile = InfluencerProfile.objects.create(user=user, **profile_data)
            
            # Auto-create social media accounts if handles provided
            self._auto_create_social_accounts_on_register(user, request.data)
            
        elif user.user_type == 'company':
            CompanyProfile.objects.create(user=user)
        
        # Welcome bonus: 10 reward points for new signup
        user.reward_points = 10
        user.save(update_fields=['reward_points'])

        # Send welcome email
        try:
            from .email_service import send_welcome_email
            send_welcome_email(user)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Welcome email failed for {user.email}: {e}")

        # Send welcome WhatsApp message
        try:
            from ecommerce.gupshup import notify_welcome
            notify_welcome(user)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Welcome WhatsApp failed for {user.phone}: {e}")

        # Generate tokens
        refresh = RefreshToken.for_user(user)

        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)
    
    def _auto_create_social_accounts_on_register(self, user, data):
        """
        Auto-create social media accounts during registration
        """
        from social_media.models import SocialMediaAccount
        from django.utils import timezone
        import logging
        
        logger = logging.getLogger(__name__)
        
        # Handle Instagram
        instagram_handle = data.get('instagram_handle', '').strip().lstrip('@')
        if instagram_handle:
            try:
                SocialMediaAccount.objects.create(
                    user=user,
                    platform='instagram',
                    platform_user_id=instagram_handle,
                    username=instagram_handle,
                    encrypted_access_token='auto_created',
                    status='active',
                    connected_at=timezone.now()
                )
                logger.info(f"Instagram account created during registration for {user.username}")
            except Exception as e:
                logger.error(f"Failed to create Instagram account during registration: {e}")
        
        # Handle YouTube
        youtube_channel = data.get('youtube_channel', '').strip().lstrip('@')
        if youtube_channel:
            try:
                SocialMediaAccount.objects.create(
                    user=user,
                    platform='youtube',
                    platform_user_id=youtube_channel,
                    username=youtube_channel,
                    encrypted_access_token='auto_created',
                    status='active',
                    connected_at=timezone.now()
                )
                logger.info(f"YouTube account created during registration for {user.username}")
            except Exception as e:
                logger.error(f"Failed to create YouTube account during registration: {e}")

class LoginView(generics.GenericAPIView):
    serializer_class = UserLoginSerializer
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        
        if user.reward_points is None:
            user.reward_points = 0
            user.save(update_fields=['reward_points'])

        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        })

class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user

class InfluencerProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = InfluencerProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        profile, created = InfluencerProfile.objects.get_or_create(user=self.request.user)
        return profile
    
    def update(self, request, *args, **kwargs):
        # Log the incoming data for debugging
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Received data: {request.data}")
        
        try:
            response = super().update(request, *args, **kwargs)
            
            # Auto-create social media accounts after successful profile update
            self._auto_create_social_accounts(request)
            
            return response
        except Exception as e:
            logger.error(f"Update error: {str(e)}")
            raise
    
    def _auto_create_social_accounts(self, request):
        """
        Automatically create or update social media account connections
        based on profile data (Instagram handle, YouTube channel)
        """
        from social_media.models import SocialMediaAccount
        from django.utils import timezone
        import logging
        
        logger = logging.getLogger(__name__)
        user = request.user
        profile = self.get_object()
        
        # Handle Instagram
        instagram_handle = request.data.get('instagram_handle') or profile.instagram_handle
        if instagram_handle:
            instagram_handle = instagram_handle.strip().lstrip('@')
            if instagram_handle:
                try:
                    account, created = SocialMediaAccount.objects.get_or_create(
                        user=user,
                        platform='instagram',
                        defaults={
                            'platform_user_id': instagram_handle,
                            'username': instagram_handle,
                            'encrypted_access_token': 'auto_created',
                            'status': 'active',
                            'connected_at': timezone.now()
                        }
                    )
                    if not created:
                        # Update existing account
                        account.username = instagram_handle
                        account.platform_user_id = instagram_handle
                        account.status = 'active'
                        account.save()
                    
                    logger.info(f"Instagram account {'created' if created else 'updated'} for user {user.username}")
                    
                    # Create initial follower history if needed
                    if created and profile.followers_count:
                        from social_media.models import FollowerHistory
                        FollowerHistory.objects.create(
                            social_account=account,
                            follower_count=profile.followers_count,
                            engagement_rate=profile.engagement_rate or 0,
                            sync_source='profile_data'
                        )
                except Exception as e:
                    logger.error(f"Failed to create Instagram account: {e}")
        
        # Handle YouTube
        youtube_channel = request.data.get('youtube_channel') or profile.youtube_channel
        if youtube_channel:
            youtube_channel = youtube_channel.strip().lstrip('@')
            if youtube_channel:
                try:
                    account, created = SocialMediaAccount.objects.get_or_create(
                        user=user,
                        platform='youtube',
                        defaults={
                            'platform_user_id': youtube_channel,
                            'username': youtube_channel,
                            'encrypted_access_token': 'auto_created',
                            'status': 'active',
                            'connected_at': timezone.now()
                        }
                    )
                    if not created:
                        # Update existing account
                        account.username = youtube_channel
                        account.platform_user_id = youtube_channel
                        account.status = 'active'
                        account.save()
                    
                    logger.info(f"YouTube account {'created' if created else 'updated'} for user {user.username}")
                    
                    # Create initial follower history if needed
                    if created and profile.followers_count:
                        from social_media.models import FollowerHistory
                        FollowerHistory.objects.create(
                            social_account=account,
                            follower_count=profile.followers_count,
                            engagement_rate=profile.engagement_rate or 0,
                            sync_source='profile_data'
                        )
                except Exception as e:
                    logger.error(f"Failed to create YouTube account: {e}")

class CompanyProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = CompanyProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        profile, created = CompanyProfile.objects.get_or_create(user=self.request.user)
        return profile

class InfluencerListView(generics.ListAPIView):
    queryset = InfluencerProfile.objects.all()
    serializer_class = InfluencerProfileSerializer
    permission_classes = [AllowAny]  # Allow public access for landing page
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__username', 'bio', 'category']
    ordering_fields = ['followers_count', 'engagement_rate', 'rate_per_post']
    ordering = ['-followers_count']  # Default ordering
    
    def get_queryset(self):
        # Only return APPROVED influencer profiles
        # This ensures only approved influencers appear on landing page and company searches
        queryset = super().get_queryset().filter(
            user__user_type='influencer',
            user__approval_status='approved'
        )
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category=category)
        return queryset

class InfluencerDetailView(generics.RetrieveAPIView):
    queryset = InfluencerProfile.objects.all()
    serializer_class = InfluencerProfileSerializer
    permission_classes = [AllowAny]  # Allow public access for viewing profiles
    lookup_field = 'id'
    
    def get_queryset(self):
        # Only allow viewing APPROVED influencer profiles
        # Prevents companies from accessing pending/rejected influencer data
        return super().get_queryset().filter(user__approval_status='approved')

class CompanyListView(generics.ListAPIView):
    queryset = CompanyProfile.objects.all()
    serializer_class = CompanyProfileSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['company_name', 'description', 'industry']


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """
    Change user password
    """
    serializer = ChangePasswordSerializer(data=request.data)
    
    if serializer.is_valid():
        user = request.user
        old_password = serializer.validated_data['old_password']
        new_password = serializer.validated_data['new_password']
        
        # Check if old password is correct
        if not check_password(old_password, user.password):
            return Response({
                'old_password': ['Current password is incorrect.']
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Set new password
        user.set_password(new_password)
        user.save()
        
        return Response({
            'message': 'Password updated successfully.'
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def delete_account(request):
    """
    Delete user account
    """
    user = request.user
    password = request.data.get('password')
    
    if not password:
        return Response({
            'password': ['Password is required to delete account.']
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Verify password
    if not check_password(password, user.password):
        return Response({
            'password': ['Password is incorrect.']
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Delete the user account
    user.delete()
    
    return Response({
        'message': 'Account deleted successfully.'
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def fetch_video_stats(request):
    """
    Fetch and update video statistics for the current user's profile (YouTube & Instagram)
    """
    try:
        profile = InfluencerProfile.objects.get(user=request.user)
    except InfluencerProfile.DoesNotExist:
        return Response({
            'error': 'Influencer profile not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Update video stats
    updated = VideoStatsService.update_profile_video_stats(profile)
    
    if updated:
        # Return updated profile data
        serializer = InfluencerProfileSerializer(profile)
        return Response({
            'message': 'Video statistics updated successfully',
            'profile': serializer.data
        }, status=status.HTTP_200_OK)
    else:
        return Response({
            'error': 'No video links found or failed to fetch statistics'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_video_stats(request):
    """
    Get video statistics for a specific URL (YouTube or Instagram)
    Query param: url (video URL)
    """
    video_url = request.query_params.get('url')
    
    if not video_url:
        return Response({
            'error': 'Video URL is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    stats = VideoStatsService.get_stats(video_url)
    
    if stats:
        return Response(stats, status=status.HTTP_200_OK)
    else:
        return Response({
            'error': 'Failed to fetch video statistics'
        }, status=status.HTTP_400_BAD_REQUEST)


# ============================================
@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_create_influencer(request):
    """
    Admin endpoint to create an influencer account with provided credentials.
    Returns the created influencer's email and password once.
    """
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    if not all([username, email, password]):
        return Response({'error': 'username, email and password are required'}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(email=email).exists():
        return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        user_type='influencer',
        approval_status='approved',
        is_approved=True,
    )
    InfluencerProfile.objects.create(user=user)
    return Response({'email': email, 'password': password, 'message': 'Influencer created and approved'}, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_convert_to_influencer(request, user_id):
    """Convert an existing buyer/user to an influencer account."""
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    if user.user_type == 'influencer':
        return Response({'error': 'User is already an influencer'}, status=status.HTTP_400_BAD_REQUEST)

    if user.user_type == 'admin' or user.is_staff:
        return Response({'error': 'Cannot convert admin accounts'}, status=status.HTTP_400_BAD_REQUEST)

    user.user_type = 'influencer'
    user.approval_status = 'approved'
    user.is_approved = True
    user.save(update_fields=['user_type', 'approval_status', 'is_approved'])

    if not hasattr(user, 'influencer_profile'):
        InfluencerProfile.objects.create(user=user)

    return Response({
        'message': f'{user.username} has been converted to an approved influencer',
        'user_id': user.id,
        'username': user.username,
        'email': user.email,
        'user_type': user.user_type,
    })


# ADMIN APPROVAL SYSTEM
# ============================================

class PendingInfluencersListView(generics.ListAPIView):
    """
    List all pending influencer accounts awaiting approval
    Only accessible by superadmin
    """
    serializer_class = PendingInfluencerSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'email']
    ordering_fields = ['created_at', 'username']
    ordering = ['-created_at']  # Newest first
    
    def get_queryset(self):
        return User.objects.filter(
            user_type='influencer',
            approval_status='pending'
        ).select_related('influencer_profile')


class AllUsersListView(generics.ListAPIView):
    """
    List all registered users (Influencers and Companies)
    Only accessible by superadmin
    """
    queryset = User.objects.all().exclude(user_type='admin').select_related('influencer_profile', 'company_profile')
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'email', 'user_type']
    ordering_fields = ['created_at', 'username', 'user_type']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user_type = self.request.query_params.get('user_type', None)
        if user_type:
            queryset = queryset.filter(user_type=user_type)
        return queryset

class AllInfluencersListView(generics.ListAPIView):
    """
    List all influencer accounts (pending, approved, rejected)
    Only accessible by superadmin
    """
    serializer_class = PendingInfluencerSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'email']
    ordering_fields = ['created_at', 'username', 'approval_status']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = User.objects.filter(
            user_type='influencer'
        ).select_related('influencer_profile')
        
        # Filter by approval status if provided
        status_filter = self.request.query_params.get('status', None)
        if status_filter in ['pending', 'approved', 'rejected']:
            queryset = queryset.filter(approval_status=status_filter)
        
        return queryset


@api_view(['POST'])
@permission_classes([IsAdminUser])
def approve_influencer(request, user_id):
    """
    Approve a pending influencer account
    """
    from .models import ApprovalAuditLog
    from .email_service import ApprovalEmailService
    import logging
    
    logger = logging.getLogger(__name__)
    
    try:
        user = User.objects.get(id=user_id, user_type='influencer')
    except User.DoesNotExist:
        return Response({
            'error': 'Influencer not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    if user.approval_status == 'approved':
        return Response({
            'message': 'Influencer is already approved'
        }, status=status.HTTP_200_OK)
    
    # Store previous status for audit log
    previous_status = user.approval_status
    
    # Approve the influencer
    user.is_approved = True
    user.approval_status = 'approved'
    user.approved_at = timezone.now()
    user.approved_by = request.user
    user.rejection_reason = ''  # Clear any previous rejection reason
    user.save()
    
    # Create audit log
    try:
        # Get client IP address
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[0]
        else:
            ip_address = request.META.get('REMOTE_ADDR')
        
        ApprovalAuditLog.objects.create(
            user=user,
            admin=request.user,
            action='approved',
            previous_status=previous_status,
            new_status='approved',
            reason='',
            ip_address=ip_address
        )
        logger.info(f"Audit log created for approval of {user.username}")
    except Exception as e:
        logger.error(f"Failed to create audit log: {e}")
    
    # Email sending removed as per requirements
    
    return Response({
        'message': 'Influencer approved successfully',
        'user': PendingInfluencerSerializer(user).data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def reject_influencer(request, user_id):
    """
    Reject a pending influencer account
    """
    from .models import ApprovalAuditLog
    from .email_service import ApprovalEmailService
    import logging
    
    logger = logging.getLogger(__name__)
    
    try:
        user = User.objects.get(id=user_id, user_type='influencer')
    except User.DoesNotExist:
        return Response({
            'error': 'Influencer not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Store previous status for audit log
    previous_status = user.approval_status
    
    # Reject the influencer - no rejection reason required
    user.is_approved = False
    user.approval_status = 'rejected'
    user.rejection_reason = ''  # Clear any previous rejection reason
    user.approved_at = None
    user.approved_by = None
    user.save()
    
    # Create audit log
    try:
        # Get client IP address
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[0]
        else:
            ip_address = request.META.get('REMOTE_ADDR')
        
        ApprovalAuditLog.objects.create(
            user=user,
            admin=request.user,
            action='rejected',
            previous_status=previous_status,
            new_status='rejected',
            reason='',
            ip_address=ip_address
        )
        logger.info(f"Audit log created for rejection of {user.username}")
    except Exception as e:
        logger.error(f"Failed to create audit log: {e}")
    
    # Email sending removed as per requirements
    
    return Response({
        'message': 'Influencer rejected successfully',
        'user': PendingInfluencerSerializer(user).data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def bulk_approve_influencers(request):
    """
    Bulk approve multiple influencers
    Expects: { "user_ids": [1, 2, 3, ...] }
    """
    from .models import ApprovalAuditLog
    from .email_service import ApprovalEmailService
    import logging
    
    logger = logging.getLogger(__name__)
    
    user_ids = request.data.get('user_ids', [])
    
    if not user_ids or not isinstance(user_ids, list):
        return Response({
            'error': 'user_ids must be a non-empty list'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    users = User.objects.filter(
        id__in=user_ids,
        user_type='influencer',
        approval_status='pending'
    )
    
    # Get client IP address
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip_address = x_forwarded_for.split(',')[0]
    else:
        ip_address = request.META.get('REMOTE_ADDR')
    
    approved_count = 0
    for user in users:
        previous_status = user.approval_status
        
        user.is_approved = True
        user.approval_status = 'approved'
        user.approved_at = timezone.now()
        user.approved_by = request.user
        user.rejection_reason = ''
        user.save()
        
        # Create audit log
        try:
            ApprovalAuditLog.objects.create(
                user=user,
                admin=request.user,
                action='approved',
                previous_status=previous_status,
                new_status='approved',
                reason='Bulk approval',
                ip_address=ip_address
            )
        except Exception as e:
            logger.error(f"Failed to create audit log for {user.username}: {e}")
        
        # Send approval email
        try:
            ApprovalEmailService.send_approval_email(user)
        except Exception as e:
            logger.error(f"Failed to send approval email to {user.email}: {e}")
        
        approved_count += 1
    
    return Response({
        'message': f'{approved_count} influencer(s) approved successfully',
        'approved_count': approved_count
    }, status=status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def delete_influencer(request, user_id):
    """
    Delete any user account. Despite the name (originally built just for
    rejected influencer applications), this is now the general-purpose
    delete action behind the admin User Management page, which lists and
    deletes users of every type — so it must not be restricted to influencers.
    """
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({
            'error': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)

    if user.id == request.user.id:
        return Response({
            'error': 'You cannot delete your own account'
        }, status=status.HTTP_400_BAD_REQUEST)

    username = user.username
    user.delete()

    return Response({
        'message': f'User {username} deleted successfully'
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_reset_password(request, user_id):
    """
    Admin endpoint to reset any user's password.
    Expects: { "new_password": "..." }
    """
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({
            'error': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)

    new_password = request.data.get('new_password', '').strip()

    if not new_password or len(new_password) < 6:
        return Response({
            'error': 'Password must be at least 6 characters long.'
        }, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save()

    return Response({
        'message': f'Password for {user.username} ({user.email}) has been reset successfully.'
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def approval_stats(request):
    """
    Get statistics about influencer approvals
    """
    total_influencers = User.objects.filter(user_type='influencer').count()
    pending_count = User.objects.filter(user_type='influencer', approval_status='pending').count()
    approved_count = User.objects.filter(user_type='influencer', approval_status='approved').count()
    rejected_count = User.objects.filter(user_type='influencer', approval_status='rejected').count()
    
    return Response({
        'total_influencers': total_influencers,
        'pending': pending_count,
        'approved': approved_count,
        'rejected': rejected_count
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def platform_overview(request):
    """
    Real platform-wide stats + recent activity for the Admin Dashboard
    Overview tab — no placeholder/demo numbers.
    """
    from django.db.models import Sum
    from collaborations.models import Campaign, Collaboration
    from payments.models import Payment
    from .models import ApprovalAuditLog

    total_users = User.objects.exclude(user_type='admin').count()
    total_influencers = User.objects.filter(user_type='influencer').count()
    total_companies = User.objects.filter(user_type='company').count()

    active_campaigns = Campaign.objects.filter(status='active').count()
    pending_campaigns = Campaign.objects.filter(status='draft').count()

    now = timezone.now()
    platform_revenue_month = Payment.objects.filter(
        status='completed', created_at__year=now.year, created_at__month=now.month
    ).aggregate(total=Sum('platform_fee'))['total'] or 0

    total_collabs = Collaboration.objects.count()
    completed_collabs = Collaboration.objects.filter(status='completed').count()
    success_rate = round((completed_collabs / total_collabs) * 100, 1) if total_collabs else 0

    activities = []
    for log in ApprovalAuditLog.objects.select_related('user').order_by('-timestamp')[:5]:
        activities.append({
            'type': 'user',
            'action': f"{log.user.get_full_name() or log.user.username} {log.action}",
            'user': log.admin.username if log.admin else 'System',
            'time': log.timestamp,
            'status': 'success' if log.action == 'approved' else 'warning' if log.action == 'rejected' else 'info',
        })
    for u in User.objects.exclude(user_type='admin').order_by('-created_at')[:5]:
        activities.append({
            'type': 'user',
            'action': f'New {u.get_user_type_display()} registered',
            'user': u.username,
            'time': u.created_at,
            'status': 'success',
        })
    for p in Payment.objects.filter(status='completed').select_related('payee').order_by('-created_at')[:5]:
        activities.append({
            'type': 'payment',
            'action': 'Payment processed',
            'user': p.payee.username,
            'time': p.created_at,
            'status': 'success',
        })
    activities.sort(key=lambda a: a['time'], reverse=True)
    activities = activities[:6]
    for a in activities:
        a['time'] = a['time'].isoformat()

    return Response({
        'total_users': total_users,
        'total_influencers': total_influencers,
        'total_companies': total_companies,
        'active_campaigns': active_campaigns,
        'pending_campaigns': pending_campaigns,
        'platform_revenue_month': str(platform_revenue_month),
        'success_rate': success_rate,
        'recent_activities': activities,
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_approval_shown(request):
    """
    Mark that the approval popup has been shown to the user
    """
    user = request.user
    
    if user.user_type != 'influencer':
        return Response({
            'error': 'Only influencers can mark approval as shown'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if user.approval_status != 'approved':
        return Response({
            'error': 'User is not approved'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    user.approval_shown = True
    user.save()
    
    return Response({
        'message': 'Approval popup marked as shown'
    }, status=status.HTTP_200_OK)


# ============================================
# SELLER ONBOARDING & VERIFICATION SYSTEM
# ============================================

class SellerProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = SellerProfileSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_object(self):
        profile, created = SellerProfile.objects.get_or_create(user=self.request.user)
        return profile

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def post(self, request, *args, **kwargs):
        profile, created = SellerProfile.objects.get_or_create(user=request.user)

        MAX_SIZE = 5 * 1024 * 1024
        ALLOWED = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']

        kyc_file = request.FILES.get('kyc_document_file')
        bank_file = request.FILES.get('bank_document_file')

        if kyc_file:
            if kyc_file.size > MAX_SIZE:
                return Response({'error': 'KYC document must be under 5MB'}, status=status.HTTP_400_BAD_REQUEST)
            if kyc_file.content_type not in ALLOWED:
                return Response({'error': 'KYC document must be PDF, PNG, or JPG'}, status=status.HTTP_400_BAD_REQUEST)
            if profile.kyc_document_file:
                profile.kyc_document_file.delete(save=False)
            profile.kyc_document_file = kyc_file

        if bank_file:
            if bank_file.size > MAX_SIZE:
                return Response({'error': 'Bank document must be under 5MB'}, status=status.HTTP_400_BAD_REQUEST)
            if bank_file.content_type not in ALLOWED:
                return Response({'error': 'Bank document must be PDF, PNG, or JPG'}, status=status.HTTP_400_BAD_REQUEST)
            if profile.bank_document_file:
                profile.bank_document_file.delete(save=False)
            profile.bank_document_file = bank_file

        serializer = self.get_serializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user, verification_status='pending', rejection_reason=None)
        return Response(serializer.data, status=status.HTTP_200_OK)


class PendingSellersListView(generics.ListAPIView):
    serializer_class = SellerProfileSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['store_name', 'user__email', 'user__username']
    ordering_fields = ['created_at', 'store_name']
    ordering = ['-created_at']

    def get_queryset(self):
        return SellerProfile.objects.filter(verification_status='pending').select_related('user')


class AllSellersListView(generics.ListAPIView):
    """
    List all seller accounts (pending, approved, rejected).
    Only accessible by superadmin.
    """
    serializer_class = SellerProfileSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['store_name', 'user__email', 'user__username']
    ordering_fields = ['created_at', 'store_name']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = SellerProfile.objects.all().select_related('user')
        status_filter = self.request.query_params.get('status', None)
        if status_filter in ['pending', 'approved', 'rejected']:
            queryset = queryset.filter(verification_status=status_filter)
        return queryset


@api_view(['POST'])
@permission_classes([IsAdminUser])
def approve_seller(request, user_id):
    from .models import ApprovalAuditLog
    from .email_service import ApprovalEmailService

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    try:
        profile = SellerProfile.objects.get(user=user)
    except SellerProfile.DoesNotExist:
        return Response({'error': 'Seller profile not found'}, status=status.HTTP_404_NOT_FOUND)

    previous_status = profile.verification_status
    profile.verification_status = 'approved'
    profile.rejection_reason = None
    profile.save()

    user.user_type = 'seller'
    user.save(update_fields=['user_type'])

    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    ip = x_forwarded.split(',')[0].strip() if x_forwarded else request.META.get('REMOTE_ADDR')
    try:
        ApprovalAuditLog.objects.create(
            user=user, admin=request.user, action='approved',
            previous_status=previous_status, new_status='approved',
            reason='', ip_address=ip,
        )
    except Exception:
        pass

    try:
        ApprovalEmailService.send_seller_approval_email(user, profile.store_name)
    except Exception:
        pass

    return Response({
        'message': 'Seller approved successfully',
        'profile': SellerProfileSerializer(profile).data
    })


@api_view(['POST'])
@permission_classes([IsAdminUser])
def reject_seller(request, user_id):
    from .models import ApprovalAuditLog
    from .email_service import ApprovalEmailService

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    try:
        profile = SellerProfile.objects.get(user=user)
    except SellerProfile.DoesNotExist:
        return Response({'error': 'Seller profile not found'}, status=status.HTTP_404_NOT_FOUND)

    reason = request.data.get('rejection_reason', 'Compliance or document details verification failed.')
    previous_status = profile.verification_status
    profile.verification_status = 'rejected'
    profile.rejection_reason = reason
    profile.save()

    if user.user_type == 'seller':
        user.user_type = 'buyer'
        user.save(update_fields=['user_type'])

    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    ip = x_forwarded.split(',')[0].strip() if x_forwarded else request.META.get('REMOTE_ADDR')
    try:
        ApprovalAuditLog.objects.create(
            user=user, admin=request.user, action='rejected',
            previous_status=previous_status, new_status='rejected',
            reason=reason, ip_address=ip,
        )
    except Exception:
        pass

    try:
        ApprovalEmailService.send_seller_rejection_email(user, profile.store_name, reason)
    except Exception:
        pass

    return Response({
        'message': 'Seller application rejected',
        'profile': SellerProfileSerializer(profile).data
    })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def seller_audit_log(request, user_id):
    from .models import ApprovalAuditLog
    from .serializers import ApprovalAuditLogSerializer
    logs = ApprovalAuditLog.objects.filter(user_id=user_id).order_by('-timestamp')
    return Response(ApprovalAuditLogSerializer(logs, many=True).data)