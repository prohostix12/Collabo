from rest_framework import serializers

from .models import CompetitorLink


class CompetitorLinkSerializer(serializers.ModelSerializer):
    platform_label = serializers.CharField(source='get_platform_display', read_only=True)

    class Meta:
        model = CompetitorLink
        fields = [
            'platform', 'platform_label', 'product_url',
            'last_price', 'last_currency', 'last_in_stock', 'last_checked_at',
        ]


class ProductComparisonSerializer(serializers.Serializer):
    """Read-only shape returned by GET /api/pricing/compare/<product_id>/ —
    Collabo's own (unmodified) price alongside each mapped competitor."""

    product_id = serializers.IntegerField()
    collabo_price = serializers.DecimalField(max_digits=12, decimal_places=2)
    collabo_currency = serializers.CharField(default='INR')
    competitors = CompetitorLinkSerializer(many=True)
