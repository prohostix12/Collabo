from rest_framework import serializers

from .models import CompetitorPrice, CompetitorProductMapping, PendingPriceApproval


class CompetitorPriceSerializer(serializers.ModelSerializer):
    platform_display = serializers.CharField(source='get_platform_display', read_only=True)
    availability_display = serializers.CharField(source='get_availability_display', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = CompetitorPrice
        fields = [
            'id', 'product', 'product_name', 'mapping', 'platform', 'platform_display',
            'external_product_id', 'price', 'original_price', 'currency',
            'availability', 'availability_display', 'seller_info', 'product_url',
            'fetch_succeeded', 'error_message', 'fetched_at', 'created_at',
        ]
        # Fully read-only — rows are only ever created by pricing.fetch_service,
        # never edited by hand, so the history stays a truthful audit trail.
        read_only_fields = fields


class CompetitorProductMappingSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.CharField(source='product.image', read_only=True)
    product_price = serializers.DecimalField(
        source='product.price', max_digits=12, decimal_places=2, read_only=True
    )
    platform_display = serializers.CharField(source='get_platform_display', read_only=True)
    match_method_display = serializers.CharField(source='get_match_method_display', read_only=True)
    latest_price = serializers.SerializerMethodField()
    latest_price_currency = serializers.SerializerMethodField()
    latest_price_availability = serializers.SerializerMethodField()
    latest_price_fetched_at = serializers.SerializerMethodField()
    latest_price_error = serializers.SerializerMethodField()

    class Meta:
        model = CompetitorProductMapping
        fields = [
            'id', 'product', 'product_name', 'product_image', 'product_price',
            'platform', 'platform_display', 'external_product_id', 'external_url',
            'match_method', 'match_method_display', 'is_verified', 'is_active',
            'latest_price', 'latest_price_currency', 'latest_price_availability',
            'latest_price_fetched_at', 'latest_price_error',
            'created_at', 'updated_at',
        ]
        # is_verified is intentionally not writable here — it only changes via
        # the verify/unverify actions, so "verified" always means an admin
        # took an explicit, logged action rather than it slipping in on a
        # routine edit of the URL or match method.
        read_only_fields = ['is_verified', 'created_at', 'updated_at']

    def _latest_price_row(self, obj):
        # views.py prefetches price_records ordered by -fetched_at, so
        # obj.price_records.all() reads from that cache instead of issuing
        # a query per row in a list response.
        if not hasattr(obj, '_latest_price_cache'):
            records = list(obj.price_records.all())
            obj._latest_price_cache = records[0] if records else None
        return obj._latest_price_cache

    def get_latest_price(self, obj):
        row = self._latest_price_row(obj)
        return row.price if row and row.fetch_succeeded else None

    def get_latest_price_currency(self, obj):
        row = self._latest_price_row(obj)
        return row.currency if row and row.fetch_succeeded else None

    def get_latest_price_availability(self, obj):
        row = self._latest_price_row(obj)
        return row.availability if row else None

    def get_latest_price_fetched_at(self, obj):
        row = self._latest_price_row(obj)
        return row.fetched_at if row else None

    def get_latest_price_error(self, obj):
        row = self._latest_price_row(obj)
        return row.error_message if row and not row.fetch_succeeded else None

    def validate(self, attrs):
        product = attrs.get('product') or getattr(self.instance, 'product', None)
        platform = attrs.get('platform') or getattr(self.instance, 'platform', None)
        external_product_id = attrs.get('external_product_id') or getattr(
            self.instance, 'external_product_id', None
        )

        duplicate_for_product = CompetitorProductMapping.objects.filter(
            product=product, platform=platform
        )
        duplicate_for_external_id = CompetitorProductMapping.objects.filter(
            platform=platform, external_product_id=external_product_id
        )
        if self.instance:
            duplicate_for_product = duplicate_for_product.exclude(pk=self.instance.pk)
            duplicate_for_external_id = duplicate_for_external_id.exclude(pk=self.instance.pk)

        if duplicate_for_product.exists():
            platform_label = dict(CompetitorProductMapping._meta.get_field('platform').choices).get(
                platform, platform
            )
            raise serializers.ValidationError(
                {'platform': f'This product is already mapped to a {platform_label} listing.'}
            )
        if duplicate_for_external_id.exists():
            raise serializers.ValidationError(
                {'external_product_id': 'This marketplace product ID is already mapped to another Collabo product.'}
            )
        return attrs


class PendingPriceApprovalSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.CharField(source='product.image', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    reviewed_by_email = serializers.CharField(source='reviewed_by.email', read_only=True, default=None)

    class Meta:
        model = PendingPriceApproval
        fields = [
            'id', 'product', 'product_name', 'product_image',
            'current_price', 'suggested_price', 'change_percent', 'lowest_competitor_price',
            'reason', 'status', 'status_display', 'reviewed_by', 'reviewed_by_email',
            'reviewed_at', 'rejection_reason', 'created_at', 'updated_at',
        ]
        # Fully read-only from the outside — the only way status/reviewed_by
        # change is through the approve/reject actions below, so every
        # transition is deliberate and logged, never a side effect of a
        # generic PATCH.
        read_only_fields = fields
