"""
Social Media API Views
Handles social media account connections, OAuth flows, and sync operations
"""

import uuid
import logging
from datetime import datetime, timedelta
from django.utils import timezone
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from django.core.cache import cache

from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.views import APIView

import requests
from .models import SocialMediaAccount, FollowerHistory, SyncJob, WebhookEvent
from .serializers import (
    SocialMediaAccountSerializer, 
    FollowerHistorySerializer, 
    SyncJobSerializer,
    ConnectAccountSerializer
)
from .sync_service import sync_service
from .tasks import sync_user_social_accounts, sync_single_social_account
from .api_clients import get_api_client, APIError

# Legacy imports for backward compatibility
from accounts.models import InfluencerProfile
from .services import SocialMediaService

User = get_user_model()
logger = logging.getLogger(__name__)


class SocialMediaAccountViewSet(ModelViewSet):
    """ViewSet for managing social media accounts"""
    
    serializer_class = SocialMediaAccountSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return SocialMediaAccount.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def sync(self, request, pk=None):
        """Trigger sync for a specific account"""
        account = self.get_object()
        
        # Trigger async sync task
        task = sync_single_social_account.delay(account.id)
        
        return Response({
            'message': 'Sync started',
            'task_id': task.id,
            'account_id': account.id
        })
    
    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """Get follower history for an account"""
        account = self.get_object()
        limit = int(request.query_params.get('limit', 50))
        
        history = account.follower_history.all()[:limit]
        serializer = FollowerHistorySerializer(history, many=True)
        
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def refresh_token(self, request, pk=None):
        """Refresh access token for an account"""
        account = self.get_object()
        
        try:
            success = sync_service._refresh_account_token(account)
            
            if success:
                return Response({
                    'message': 'Token refreshed successfully',
                    'expires_at': account.token_expires_at
                })
            else:
                return Response({
                    'error': 'Failed to refresh token'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['delete'])
    def disconnect(self, request, pk=None):
        """Disconnect a social media account"""
        account = self.get_object()
        
        # Mark as revoked instead of deleting to maintain history
        account.status = 'revoked'
        account.save()
        
        return Response({
            'message': 'Account disconnected successfully'
        })


class ConnectSocialAccountView(APIView):
    """Handle OAuth flow for connecting social media accounts"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """Complete OAuth flow and connect account"""
        serializer = ConnectAccountSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        platform = serializer.validated_data['platform']
        auth_code = serializer.validated_data.get('auth_code')
        access_token = serializer.validated_data.get('access_token')
        refresh_token = serializer.validated_data.get('refresh_token')
        
        try:
            # If auth_code is provided, exchange it for tokens
            if auth_code and not access_token:
                access_token, refresh_token, expires_at = self._exchange_auth_code(
                    platform, auth_code
                )
            else:
                expires_at = timezone.now() + timedelta(seconds=serializer.validated_data.get('expires_in', 3600))
            
            # Get user profile from API
            client = get_api_client(platform, access_token, refresh_token)
            profile = client.get_user_profile()
            
            # Create or update social media account
            with transaction.atomic():
                account, created = SocialMediaAccount.objects.update_or_create(
                    user=request.user,
                    platform=platform,
                    defaults={
                        'platform_user_id': profile.get('id', ''),
                        'username': profile.get('username', ''),
                        'display_name': profile.get('name', profile.get('title', '')),
                        'profile_picture_url': profile.get('profile_picture_url', profile.get('thumbnail', '')),
                        'token_expires_at': expires_at,
                        'status': 'active',
                        'scopes': serializer.validated_data.get('scopes', []),
                        'sync_error_count': 0,
                        'last_error': ''
                    }
                )
                
                # Set encrypted tokens
                account.set_access_token(access_token)
                if refresh_token:
                    account.set_refresh_token(refresh_token)
                account.save()
                
                # Trigger initial sync
                sync_single_social_account.delay(account.id)
            
            return Response({
                'message': 'Account connected successfully',
                'account_id': account.id,
                'created': created
            }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
        
        except APIError as e:
            return Response({
                'error': f'Failed to connect account: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            logger.error(f"Failed to connect social account: {e}")
            return Response({
                'error': 'Failed to connect account'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _exchange_auth_code(self, platform: str, auth_code: str):
        """Exchange authorization code for access tokens"""
        if platform == 'instagram':
            return self._exchange_instagram_code(auth_code)
        elif platform == 'youtube':
            return self._exchange_youtube_code(auth_code)
        else:
            raise ValueError(f"Unsupported platform: {platform}")
    
    def _exchange_instagram_code(self, auth_code: str):
        """Exchange Instagram authorization code for tokens"""
        # First, get short-lived token
        token_url = "https://api.instagram.com/oauth/access_token"
        data = {
            'client_id': settings.INSTAGRAM_CLIENT_ID,
            'client_secret': settings.INSTAGRAM_CLIENT_SECRET,
            'grant_type': 'authorization_code',
            'redirect_uri': settings.INSTAGRAM_REDIRECT_URI,
            'code': auth_code
        }
        
        response = requests.post(token_url, data=data, timeout=30)
        
        if response.status_code != 200:
            raise APIError(f"Failed to exchange Instagram code: {response.text}")
        
        token_data = response.json()
        short_token = token_data['access_token']
        
        # Exchange for long-lived token
        long_token_url = "https://graph.instagram.com/access_token"
        params = {
            'grant_type': 'ig_exchange_token',
            'client_secret': settings.INSTAGRAM_CLIENT_SECRET,
            'access_token': short_token
        }
        
        long_response = requests.get(long_token_url, params=params, timeout=30)
        
        if long_response.status_code != 200:
            raise APIError(f"Failed to get Instagram long-lived token: {long_response.text}")
        
        long_data = long_response.json()
        access_token = long_data['access_token']
        expires_in = long_data.get('expires_in', 5184000)  # 60 days default
        expires_at = timezone.now() + timedelta(seconds=expires_in)
        
        return access_token, "", expires_at
    
    def _exchange_youtube_code(self, auth_code: str):
        """Exchange YouTube authorization code for tokens"""
        token_url = "https://oauth2.googleapis.com/token"
        data = {
            'client_id': settings.YOUTUBE_CLIENT_ID,
            'client_secret': settings.YOUTUBE_CLIENT_SECRET,
            'code': auth_code,
            'grant_type': 'authorization_code',
            'redirect_uri': settings.YOUTUBE_REDIRECT_URI
        }
        
        response = requests.post(token_url, data=data, timeout=30)
        
        if response.status_code != 200:
            raise APIError(f"Failed to exchange YouTube code: {response.text}")
        
        token_data = response.json()
        access_token = token_data['access_token']
        refresh_token = token_data.get('refresh_token', '')
        expires_in = token_data.get('expires_in', 3600)
        expires_at = timezone.now() + timedelta(seconds=expires_in)
        
        return access_token, refresh_token, expires_at


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def sync_user_accounts(request):
    """Trigger sync for all user's social media accounts"""
    user = request.user
    
    # Trigger async sync task
    task = sync_user_social_accounts.delay(user.id)
    
    return Response({
        'message': 'User account sync started',
        'task_id': task.id,
        'user_id': user.id
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def sync_status(request, task_id):
    """Get status of a sync task"""
    from celery.result import AsyncResult
    
    result = AsyncResult(task_id)
    
    return Response({
        'task_id': task_id,
        'status': result.status,
        'result': result.result if result.ready() else None
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def follower_stats(request):
    """Get aggregated follower statistics for the user"""
    user = request.user
    accounts = user.social_accounts.filter(status='active')
    
    total_followers = 0
    total_engagement = 0
    account_count = 0
    platform_stats = {}
    
    for account in accounts:
        latest_history = account.follower_history.first()
        if latest_history:
            total_followers += latest_history.follower_count
            total_engagement += float(latest_history.engagement_rate)
            account_count += 1
            
            platform_stats[account.platform] = {
                'followers': latest_history.follower_count,
                'engagement_rate': float(latest_history.engagement_rate),
                'last_updated': latest_history.recorded_at
            }
    
    avg_engagement = total_engagement / account_count if account_count > 0 else 0
    
    return Response({
        'total_followers': total_followers,
        'average_engagement_rate': round(avg_engagement, 2),
        'connected_accounts': account_count,
        'platform_breakdown': platform_stats,
        'last_sync': max([stats.get('last_updated') for stats in platform_stats.values()]) if platform_stats else None
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def sync_history(request):
    """Get sync job history for the user"""
    user = request.user
    limit = int(request.query_params.get('limit', 20))
    
    jobs = SyncJob.objects.filter(user=user).order_by('-created_at')[:limit]
    serializer = SyncJobSerializer(jobs, many=True)
    
    return Response(serializer.data)


class WebhookView(APIView):
    """Handle webhooks from social media platforms"""
    
    permission_classes = []  # Webhooks don't use user authentication
    
    def post(self, request, platform):
        """Handle incoming webhook"""
        try:
            # Verify webhook signature (implementation depends on platform)
            if not self._verify_webhook_signature(request, platform):
                return Response({'error': 'Invalid signature'}, status=status.HTTP_401_UNAUTHORIZED)
            
            # Store webhook event
            webhook_event = WebhookEvent.objects.create(
                platform=platform,
                event_type=self._determine_event_type(request.data, platform),
                platform_user_id=self._extract_user_id(request.data, platform),
                raw_data=request.data
            )
            
            # Process webhook asynchronously
            self._process_webhook_async(webhook_event)
            
            return Response({'status': 'received'})
        
        except Exception as e:
            logger.error(f"Webhook processing failed: {e}")
            return Response({'error': 'Processing failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _verify_webhook_signature(self, request, platform):
        """Verify webhook signature (implement per platform requirements)"""
        # This is a placeholder - implement actual signature verification
        return True
    
    def _determine_event_type(self, data, platform):
        """Determine the type of webhook event"""
        # This is a placeholder - implement based on platform webhook structure
        return 'follower_update'
    
    def _extract_user_id(self, data, platform):
        """Extract platform user ID from webhook data"""
        # This is a placeholder - implement based on platform webhook structure
        return data.get('user_id', '')
    
    def _process_webhook_async(self, webhook_event):
        """Process webhook event asynchronously"""
        # This would trigger a Celery task to process the webhook
        pass


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def admin_sync_stats(request):
    """Get sync statistics for admin dashboard"""
    days = int(request.query_params.get('days', 7))
    stats = sync_service.get_sync_statistics(days)
    
    return Response(stats)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def lookup_instagram_user(request):
    """
    Lookup public Instagram user information by username
    """
    from .public_lookup import public_lookup_service
    
    username = request.data.get('username', '').strip()
    method = request.data.get('method', 'api')  # 'api' or 'scraping'
    
    if not username:
        return Response({
            'error': 'Username is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user_data = public_lookup_service.lookup_instagram_user(username, method)
        
        if user_data:
            return Response({
                'success': True,
                'data': user_data,
                'username': username,
                'method_used': method
            })
        else:
            return Response({
                'success': False,
                'error': 'User not found or unable to fetch data',
                'username': username
            }, status=status.HTTP_404_NOT_FOUND)
    
    except Exception as e:
        logger.error(f"Instagram lookup failed for @{username}: {e}")
        return Response({
            'success': False,
            'error': 'Lookup service temporarily unavailable',
            'username': username
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def lookup_youtube_channel(request):
    """
    Lookup public YouTube channel information
    """
    from .public_lookup import public_lookup_service
    
    channel_name = request.data.get('channel_name', '').strip()
    
    if not channel_name:
        return Response({
            'error': 'Channel name is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        channel_data = public_lookup_service.lookup_youtube_channel(channel_name)
        
        if channel_data:
            return Response({
                'success': True,
                'data': channel_data,
                'channel_name': channel_name
            })
        else:
            return Response({
                'success': False,
                'error': 'Channel not found or unable to fetch data',
                'channel_name': channel_name
            }, status=status.HTTP_404_NOT_FOUND)
    
    except Exception as e:
        logger.error(f"YouTube lookup failed for {channel_name}: {e}")
        return Response({
            'success': False,
            'error': 'Lookup service temporarily unavailable',
            'channel_name': channel_name
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def bulk_lookup_influencers(request):
    """
    Lookup multiple influencers at once
    """
    from .public_lookup import public_lookup_service
    
    usernames = request.data.get('usernames', [])
    platform = request.data.get('platform', 'instagram')
    method = request.data.get('method', 'api')
    
    if not usernames or not isinstance(usernames, list):
        return Response({
            'error': 'Usernames list is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if len(usernames) > 10:
        return Response({
            'error': 'Maximum 10 usernames allowed per request'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    results = []
    
    for username in usernames:
        try:
            if platform == 'instagram':
                user_data = public_lookup_service.lookup_instagram_user(username, method)
            elif platform == 'youtube':
                user_data = public_lookup_service.lookup_youtube_channel(username)
            else:
                user_data = None
            
            results.append({
                'username': username,
                'success': user_data is not None,
                'data': user_data,
                'platform': platform
            })
            
            # Add delay between requests to be respectful
            import time
            time.sleep(0.5)
            
        except Exception as e:
            logger.error(f"Bulk lookup failed for {username}: {e}")
            results.append({
                'username': username,
                'success': False,
                'error': str(e),
                'platform': platform
            })
    
    return Response({
        'results': results,
        'total_requested': len(usernames),
        'successful': len([r for r in results if r['success']]),
        'failed': len([r for r in results if not r['success']])
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def search_influencers(request):
    """
    Search for influencers by various criteria
    """
    query = request.query_params.get('q', '').strip()
    platform = request.query_params.get('platform', 'instagram')
    min_followers = request.query_params.get('min_followers', 0)
    max_followers = request.query_params.get('max_followers', None)
    category = request.query_params.get('category', '')
    
    if not query:
        return Response({
            'error': 'Search query is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Search in connected accounts first
        connected_accounts = SocialMediaAccount.objects.filter(
            platform=platform,
            status='active'
        )
        
        if query:
            connected_accounts = connected_accounts.filter(
                username__icontains=query
            )
        
        results = []
        
        for account in connected_accounts:
            latest_history = account.follower_history.first()
            follower_count = latest_history.follower_count if latest_history else 0
            
            # Apply follower filters
            if int(min_followers) > 0 and follower_count < int(min_followers):
                continue
            if max_followers and follower_count > int(max_followers):
                continue
            
            # Get user profile info
            user_profile = None
            if hasattr(account.user, 'influencer_profile'):
                user_profile = account.user.influencer_profile
                
                # Apply category filter
                if category and user_profile.category != category:
                    continue
            
            results.append({
                'username': account.username,
                'display_name': account.display_name,
                'platform': account.platform,
                'follower_count': follower_count,
                'engagement_rate': float(latest_history.engagement_rate) if latest_history else 0,
                'profile_picture_url': account.profile_picture_url,
                'category': user_profile.category if user_profile else None,
                'rate_per_post': float(user_profile.rate_per_post) if user_profile else None,
                'last_updated': latest_history.recorded_at if latest_history else None,
                'is_connected': True
            })
        
        return Response({
            'results': results,
            'total_found': len(results),
            'query': query,
            'platform': platform,
            'filters': {
                'min_followers': min_followers,
                'max_followers': max_followers,
                'category': category
            }
        })
    
    except Exception as e:
        logger.error(f"Influencer search failed: {e}")
        return Response({
            'error': 'Search service temporarily unavailable'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Legacy API endpoints for backward compatibility
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_my_followers(request):
    """Legacy endpoint - trigger follower count update for the current user"""
    try:
        # Try new system first
        user = request.user
        if user.social_accounts.filter(status='active').exists():
            task = sync_user_social_accounts.delay(user.id)
            return Response({
                'message': 'Follower update started (new system)',
                'task_id': task.id,
                'estimated_completion': '30-60 seconds'
            })
        
        # Fall back to legacy system
        profile = InfluencerProfile.objects.get(user=request.user)
        from .tasks import update_single_influencer_followers
        task = update_single_influencer_followers.delay(profile.id, notify_frontend=True)
        
        return Response({
            'message': 'Follower update started (legacy system)',
            'task_id': task.id,
            'profile_id': profile.id,
            'estimated_completion': '30-60 seconds'
        })
    except InfluencerProfile.DoesNotExist:
        return Response(
            {'error': 'Influencer profile not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_followers_sync(request):
    """Legacy endpoint - synchronously update follower counts"""
    try:
        # Try new system first
        user = request.user
        accounts = user.social_accounts.filter(status='active')
        
        if accounts.exists():
            # Use new sync service
            total_followers = 0
            results = {}
            
            for account in accounts:
                success = sync_service.sync_single_account_by_id(account.id)
                if success:
                    latest_history = account.follower_history.first()
                    if latest_history:
                        total_followers += latest_history.follower_count
                        results[account.platform] = {
                            'followers': latest_history.follower_count,
                            'success': True
                        }
                else:
                    results[account.platform] = {'success': False}
            
            return Response({
                'message': 'Followers updated successfully (new system)',
                'results': results,
                'current_followers': total_followers,
                'updated_at': timezone.now()
            })
        
        # Fall back to legacy system
        profile = InfluencerProfile.objects.get(user=request.user)
        old_followers = profile.followers_count
        
        results = SocialMediaService.update_follower_counts(profile)
        profile.refresh_from_db()
        
        return Response({
            'message': 'Followers updated successfully (legacy system)',
            'results': results,
            'old_followers': old_followers,
            'current_followers': profile.followers_count,
            'change': profile.followers_count - (old_followers or 0),
            'instagram_handle': profile.instagram_handle,
            'youtube_channel': profile.youtube_channel,
            'updated_at': profile.updated_at
        })
    except InfluencerProfile.DoesNotExist:
        return Response(
            {'error': 'Influencer profile not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error in sync follower update: {str(e)}")
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Alias for backward compatibility
get_follower_stats = follower_stats


class FetchHandleStatsView(APIView):
    """
    POST /api/social/fetch-handle-stats/
    Fetches real public stats for an Instagram handle or YouTube channel URL.
    No OAuth required — uses instaloader for Instagram, YouTube Data API v3 for YouTube.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        platform = request.data.get('platform', '').lower().strip()
        handle = request.data.get('handle', '').strip()

        if not platform or not handle:
            return Response({'error': 'Both platform and handle are required'},
                            status=status.HTTP_400_BAD_REQUEST)
        if platform not in ('instagram', 'youtube'):
            return Response({'error': 'Platform must be "instagram" or "youtube"'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            if platform == 'instagram':
                data = self._fetch_instagram_stats(handle)
            else:
                data = self._fetch_youtube_stats(handle)

            if data:
                data['fetched_at'] = timezone.now().isoformat()
                return Response(data)
            else:
                return Response(
                    {'error': f'Could not fetch stats for {handle}. The account may be private, not found, or temporarily rate-limited.'},
                    status=status.HTTP_404_NOT_FOUND
                )
        except Exception as e:
            logger.error(f"FetchHandleStatsView error for {platform}/{handle}: {e}")
            return Response({'error': 'Stats fetch service temporarily unavailable.'},
                            status=status.HTTP_503_SERVICE_UNAVAILABLE)

    def _fetch_instagram_stats(self, handle: str):
        """Fetch public Instagram profile stats using instaloader (no API key needed)."""
        try:
            import instaloader
            username = handle.lstrip('@').strip()

            loader = instaloader.Instaloader(
                quiet=True, download_pictures=False,
                download_video_thumbnails=False, download_geotags=False,
                download_comments=False, save_metadata=False, compress_json=False,
            )
            profile = instaloader.Profile.from_username(loader.context, username)

            followers = profile.followers
            following = profile.followees
            posts_count = profile.mediacount

            total_likes = 0
            total_comments = 0
            sampled = 0
            try:
                for post in profile.get_posts():
                    total_likes += post.likes
                    total_comments += post.comments
                    sampled += 1
                    if sampled >= 12:
                        break
            except Exception:
                pass

            avg_likes = int(total_likes / sampled) if sampled > 0 else 0
            avg_comments = int(total_comments / sampled) if sampled > 0 else 0
            engagement_rate = round(
                ((avg_likes + avg_comments) / followers * 100) if followers > 0 else 0, 2
            )

            return {
                'platform': 'instagram',
                'handle': username,
                'followers': followers,
                'following': following,
                'posts': posts_count,
                'likes': avg_likes,
                'comments': avg_comments,
                'posts_sampled': sampled,
                'engagement_rate': engagement_rate,
                'profile_url': f'https://instagram.com/{username}',
                'is_private': profile.is_private,
                'is_verified': profile.is_verified,
                'bio': profile.biography[:200] if profile.biography else '',
                'source': 'instaloader',
            }
        except Exception as e:
            logger.warning(f"instaloader fetch failed for @{handle}: {e}")
            return None

    def _fetch_youtube_stats(self, channel_input: str):
        """Fetch YouTube channel stats using YouTube Data API v3."""
        try:
            api_key = getattr(settings, 'YOUTUBE_API_KEY', None)
            if not api_key or api_key == 'your_youtube_api_key_here':
                logger.warning("YOUTUBE_API_KEY not configured — YouTube stats unavailable")
                return None

            from googleapiclient.discovery import build
            youtube = build('youtube', 'v3', developerKey=api_key)

            channel_id = self._resolve_youtube_channel_id(youtube, channel_input)
            if not channel_id:
                return None

            ch_resp = youtube.channels().list(
                part='statistics,snippet', id=channel_id
            ).execute()
            if not ch_resp.get('items'):
                return None

            item = ch_resp['items'][0]
            stats = item.get('statistics', {})
            snippet = item.get('snippet', {})

            subscribers = int(stats.get('subscriberCount', 0))
            total_views = int(stats.get('viewCount', 0))
            video_count = int(stats.get('videoCount', 0))
            title = snippet.get('title', channel_input)
            description = snippet.get('description', '')[:200]
            thumbnail = snippet.get('thumbnails', {}).get('default', {}).get('url', '')

            total_likes = 0
            total_comments = 0
            sampled = 0
            try:
                search_resp = youtube.search().list(
                    part='id', channelId=channel_id, type='video',
                    order='date', maxResults=10
                ).execute()
                video_ids = [i['id']['videoId'] for i in search_resp.get('items', [])]
                if video_ids:
                    vids_resp = youtube.videos().list(
                        part='statistics', id=','.join(video_ids)
                    ).execute()
                    for vid in vids_resp.get('items', []):
                        vstats = vid.get('statistics', {})
                        total_likes += int(vstats.get('likeCount', 0))
                        total_comments += int(vstats.get('commentCount', 0))
                        sampled += 1
            except Exception as e:
                logger.warning(f"YouTube engagement sampling failed: {e}")

            avg_likes = int(total_likes / sampled) if sampled > 0 else 0
            avg_comments = int(total_comments / sampled) if sampled > 0 else 0
            engagement_rate = round(
                ((avg_likes + avg_comments) / subscribers * 100) if subscribers > 0 else 0, 2
            )

            import re
            handle_match = re.search(r'@([a-zA-Z0-9_.-]+)', channel_input)
            handle = handle_match.group(1) if handle_match else title

            return {
                'platform': 'youtube',
                'handle': handle,
                'title': title,
                'description': description,
                'thumbnail': thumbnail,
                'channel_id': channel_id,
                'followers': subscribers,
                'subscribers': subscribers,
                'total_views': total_views,
                'video_count': video_count,
                'likes': avg_likes,
                'comments': avg_comments,
                'posts_sampled': sampled,
                'engagement_rate': engagement_rate,
                'profile_url': f'https://youtube.com/channel/{channel_id}',
                'source': 'youtube_data_api_v3',
            }
        except Exception as e:
            logger.error(f"YouTube Data API fetch failed for '{channel_input}': {e}")
            return None

    def _resolve_youtube_channel_id(self, youtube_client, channel_input: str):
        """Resolve a YouTube channel URL, @handle, or ID to a channel ID string."""
        import re

        if re.match(r'^UC[a-zA-Z0-9_-]{22}$', channel_input):
            return channel_input

        patterns = [
            r'youtube\.com/channel/([a-zA-Z0-9_-]+)',
            r'youtube\.com/@([a-zA-Z0-9_.-]+)',
            r'youtube\.com/c/([a-zA-Z0-9_.-]+)',
            r'youtube\.com/user/([a-zA-Z0-9_.-]+)',
        ]
        extracted = None
        for pattern in patterns:
            match = re.search(pattern, channel_input)
            if match:
                extracted = match.group(1)
                break

        if extracted:
            if re.match(r'^UC[a-zA-Z0-9_-]{22}$', extracted):
                return extracted
            try:
                resp = youtube_client.channels().list(
                    part='id', forHandle=f'@{extracted.lstrip("@")}'
                ).execute()
                if resp.get('items'):
                    return resp['items'][0]['id']
            except Exception:
                pass
            try:
                resp = youtube_client.channels().list(
                    part='id', forUsername=extracted
                ).execute()
                if resp.get('items'):
                    return resp['items'][0]['id']
            except Exception:
                pass

        try:
            query = re.sub(r'https?://(www\.)?', '', channel_input)
            resp = youtube_client.search().list(
                part='id', q=query, type='channel', maxResults=1
            ).execute()
            if resp.get('items'):
                return resp['items'][0]['id']['channelId']
        except Exception as e:
            logger.warning(f"YouTube channel search fallback failed: {e}")

        return None