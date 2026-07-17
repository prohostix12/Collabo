from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, InfluencerProfile, CompanyProfile, SellerProfile

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    referred_by_code = serializers.CharField(write_only=True, required=False, allow_blank=True)
    # Declared explicitly (rather than left to ModelSerializer) so the model's
    # auto-added UniqueValidator doesn't reject a blank value before we can
    # normalize it to None below.
    phone = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    # Declared explicitly too, so we control the uniqueness error message
    # instead of DRF's default "user with this email already exists."
    email = serializers.EmailField()

    class Meta:
        model = User
        fields = ('email', 'username', 'password', 'password_confirm', 'user_type', 'phone', 'referred_by_code')

    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("This email is already registered. Try logging in instead.")
        return value

    def validate_phone(self, value):
        value = (value or '').strip()
        if not value:
            return None
        if User.objects.filter(phone=value).exists():
            raise serializers.ValidationError("This mobile number is already registered. Try logging in instead.")
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        referred_by_code = validated_data.pop('referred_by_code', '').strip()
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        if referred_by_code:
            recruiter = User.objects.filter(affiliate_code=referred_by_code.upper()).first()
            if not recruiter:
                # Not a personal "Invite Friends" code — check if it's a product
                # referral link code instead (influencer review or customer
                # "Refer & Earn" link), so signing up via either link type binds
                # the new account to whoever sent it.
                from ecommerce.models import ProductReview, CustomerReferralLink
                review = ProductReview.objects.filter(referral_code=referred_by_code).first()
                if review:
                    recruiter = review.influencer
                else:
                    link = CustomerReferralLink.objects.filter(referral_code=referred_by_code).first()
                    if link:
                        recruiter = link.user
            if recruiter and recruiter.pk != user.pk:
                user.referred_by = recruiter
        user.save()
        return user

class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            user = authenticate(username=email, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            
            # Removed approval check - influencers can login regardless of approval status
            # Warning message will be shown in the dashboard instead
            
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('Must include email and password')

class InfluencerProfileSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    preferred_platforms_display = serializers.SerializerMethodField()
    
    # Override to accept both URLs and base64 data
    profile_image = serializers.CharField(allow_blank=True, required=False)
    cover_image = serializers.CharField(allow_blank=True, required=False)
    
    class Meta:
        model = InfluencerProfile
        fields = [
            'id', 'user', 'user_email', 'username', 'bio', 'category', 
            'preferred_platforms', 'preferred_platforms_display',
            'followers_count', 'engagement_rate',
            'rate_per_post', 'rate_per_story', 'rate_per_reel', 'rate_per_video',
            'instagram_handle', 'youtube_channel',
            'profile_image', 'cover_image', 'portfolio_images', 'portfolio_videos', 'website_url',
            'latest_product_review_link', 'latest_product_review_cover',
            'latest_product_review_views', 'latest_product_review_likes',
            'most_viewed_content_link', 'most_viewed_content_cover',
            'most_viewed_content_views', 'most_viewed_content_likes',
            'location', 'languages',
            'created_at', 'updated_at'
        ]
        read_only_fields = (
            'user', 'created_at', 'updated_at', 
            'followers_count', 'engagement_rate',
            'latest_product_review_views', 'latest_product_review_likes',
            'most_viewed_content_views', 'most_viewed_content_likes'
        )
    
    def validate(self, attrs):
        # Remove any TikTok/Twitter fields if they somehow get sent
        attrs.pop('tiktok_handle', None)
        attrs.pop('twitter_handle', None)
        return attrs
    
    def get_preferred_platforms_display(self, obj):
        """Return human-readable platform names"""
        platform_choices = dict(InfluencerProfile.SOCIAL_MEDIA_PLATFORMS)
        return [platform_choices.get(platform, platform) for platform in obj.preferred_platforms]

class CompanyProfileSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = CompanyProfile
        fields = '__all__'
        read_only_fields = ('user',)


class SellerProfileSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    kyc_document_url = serializers.SerializerMethodField()
    bank_document_url = serializers.SerializerMethodField()

    class Meta:
        model = SellerProfile
        fields = '__all__'
        read_only_fields = ('user', 'verification_status', 'rejection_reason',
                            'kyc_document_file', 'bank_document_file')

    def get_kyc_document_url(self, obj):
        if obj.kyc_document_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.kyc_document_file.url)
            return obj.kyc_document_file.url
        return obj.kyc_document or None

    def get_bank_document_url(self, obj):
        if obj.bank_document_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.bank_document_file.url)
            return obj.bank_document_file.url
        return obj.bank_document or None


class ApprovalAuditLogSerializer(serializers.ModelSerializer):
    admin_username = serializers.ReadOnlyField(source='admin.username', default=None)

    class Meta:
        from .models import ApprovalAuditLog
        model = ApprovalAuditLog
        fields = ('id', 'admin', 'admin_username', 'action', 'previous_status',
                  'new_status', 'reason', 'ip_address', 'timestamp')
        read_only_fields = fields


class UserSerializer(serializers.ModelSerializer):
    influencer_profile = InfluencerProfileSerializer(read_only=True)
    company_profile = CompanyProfileSerializer(read_only=True)
    seller_profile = SellerProfileSerializer(read_only=True)
    # See UserRegistrationSerializer.phone — declared explicitly so a blank
    # value can be normalized to None before the uniqueness check runs.
    phone = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'user_type', 'phone', 'is_verified',
                 'created_at', 'influencer_profile', 'company_profile', 'seller_profile',
                 'approval_status', 'is_approved', 'rejection_reason', 'approval_shown',
                 'reward_points', 'affiliate_code')
        read_only_fields = ('id', 'created_at', 'approval_status', 'is_approved',
                           'rejection_reason', 'approval_shown', 'user_type', 'affiliate_code')

    def validate_phone(self, value):
        value = (value or '').strip()
        if not value:
            return None
        qs = User.objects.filter(phone=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A user with this phone number already exists.")
        return value


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
    
    def validate_new_password(self, value):
        """
        Validate new password strength
        """
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        
        if not any(char.islower() for char in value):
            raise serializers.ValidationError("Password must contain at least one lowercase letter.")
        
        if not any(char.isupper() for char in value):
            raise serializers.ValidationError("Password must contain at least one uppercase letter.")
        
        if not any(char.isdigit() for char in value):
            raise serializers.ValidationError("Password must contain at least one number.")
        
        return value


class PendingInfluencerSerializer(serializers.ModelSerializer):
    """Serializer for pending influencer approval list"""
    influencer_profile = InfluencerProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'user_type', 'phone', 
                 'approval_status', 'created_at', 'influencer_profile')
        read_only_fields = fields


class ApprovalActionSerializer(serializers.Serializer):
    """Serializer for approval/rejection actions"""
    action = serializers.ChoiceField(choices=['approve', 'reject'], required=True)
    rejection_reason = serializers.CharField(required=False, allow_blank=True)