import logging

from django.db.models import Prefetch
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from ecommerce.models import Product

from .apply_service import apply_admin_approved_price, reject_pending_approval
from .dashboard_service import get_comparison_table, get_dashboard_summary
from .fetch_service import fetch_price_for_mapping
from .models import CompetitorPrice, CompetitorProductMapping, PendingPriceApproval
from .permissions import IsAdminUser
from .pricing_service import calculate_suggested_price
from .safety_service import evaluate_pricing_result
from .serializers import (
    CompetitorPriceSerializer,
    CompetitorProductMappingSerializer,
    PendingPriceApprovalSerializer,
)

logger = logging.getLogger('pricing.views')


class CompetitorProductMappingViewSet(viewsets.ModelViewSet):
    """Manual product-mapping management. Fully admin-only — there is no
    public read here, unlike ecommerce.ProductViewSet, since mappings are an
    internal pricing-ops concern."""

    queryset = (
        CompetitorProductMapping.objects
        .select_related('product')
        .prefetch_related(
            Prefetch('price_records', queryset=CompetitorPrice.objects.order_by('-fetched_at'))
        )
        .all()
        .order_by('-created_at')
    )
    serializer_class = CompetitorProductMappingSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['platform', 'is_verified', 'is_active', 'product']
    ordering_fields = ['created_at', 'updated_at']

    def perform_create(self, serializer):
        mapping = serializer.save()
        logger.info(
            'Competitor mapping created: product_id=%s platform=%s external_id=%s by=%s',
            mapping.product_id, mapping.platform, mapping.external_product_id, self.request.user.email,
        )

    @action(detail=True, methods=['post'], url_path='verify')
    def verify(self, request, pk=None):
        mapping = self.get_object()
        mapping.is_verified = True
        mapping.save(update_fields=['is_verified', 'updated_at'])
        logger.info('Mapping %s verified by %s', mapping.id, request.user.email)
        return Response(self.get_serializer(mapping).data)

    @action(detail=True, methods=['post'], url_path='unverify')
    def unverify(self, request, pk=None):
        mapping = self.get_object()
        mapping.is_verified = False
        mapping.save(update_fields=['is_verified', 'updated_at'])
        logger.info('Mapping %s unverified by %s', mapping.id, request.user.email)
        return Response(self.get_serializer(mapping).data)

    @action(detail=True, methods=['post'], url_path='fetch-price')
    def fetch_price(self, request, pk=None):
        """Synchronous single-mapping fetch — this is the admin "test/refresh
        this mapping" action, not the scheduled bulk sync (that runs through
        Celery so it never blocks an HTTP request). One external API call is
        fast enough to do inline here."""
        mapping = self.get_object()
        price_row = fetch_price_for_mapping(mapping)
        return Response(CompetitorPriceSerializer(price_row).data)


class CompetitorPriceViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only history of fetched competitor prices — admin-only, mirrors
    what pricing.fetch_service has stored. Never written to directly."""

    queryset = CompetitorPrice.objects.select_related('product', 'mapping').all()
    serializer_class = CompetitorPriceSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['product', 'platform', 'mapping', 'fetch_succeeded', 'availability']
    ordering_fields = ['fetched_at', 'created_at']


class SuggestedPriceView(APIView):
    """Read-only preview of what pricing_service.calculate_suggested_price()
    suggests for one product, and what safety_service.evaluate_pricing_result()
    would decide about it, right now. This view does no calculation or
    decision logic itself — it only calls the two services and shapes the
    response. Nothing here writes to Product or creates a
    PendingPriceApproval; it is strictly a preview for an admin to look at."""

    permission_classes = [IsAdminUser]

    def get(self, request, product_id):
        product = get_object_or_404(Product, pk=product_id)
        result = calculate_suggested_price(product)
        decision = evaluate_pricing_result(product, result)

        # Decimal values are stringified explicitly — a plain dict handed to
        # Response() serializes Decimal as a JSON float (precision risk for
        # currency), unlike every other endpoint here which goes through a
        # DecimalField serializer and renders money as a string.
        def money(value):
            return str(value) if value is not None else None

        return Response({
            'product_id': result.product_id,
            'product_name': product.name,
            'current_price': money(result.current_price),
            'strategy': result.strategy,
            'has_valid_data': result.has_valid_data,
            'lowest_competitor_price': money(result.lowest_competitor_price),
            'lowest_competitor_platform': result.lowest_competitor_platform,
            'average_competitor_price': money(result.average_competitor_price),
            'suggested_price': money(result.suggested_price),
            'reason': result.reason,
            'quotes': [
                {
                    'platform': q.platform,
                    'price': str(q.price),
                    'fetched_at': q.fetched_at,
                    'mapping_id': q.mapping_id,
                }
                for q in result.quotes
            ],
            'safety': {
                'outcome': decision.outcome,
                'final_price': money(decision.final_price),
                'change_percent': money(decision.change_percent),
                'margin_clamped': decision.margin_clamped,
                'reason': decision.reason,
            },
        })


class DynamicPricingDashboardView(APIView):
    """Summary stats for the Dynamic Pricing admin dashboard — products
    monitored, Amazon/Flipkart checked, prices changed, pending approval,
    API failures. This view does no aggregation itself; it only calls
    dashboard_service.get_dashboard_summary() and returns it."""

    permission_classes = [IsAdminUser]

    def get(self, request):
        return Response(get_dashboard_summary())


class DynamicPricingComparisonView(APIView):
    """The Product / Amazon / Flipkart / Collabo / Suggested comparison
    table. No calculation here either — dashboard_service.get_comparison_table()
    does the work, this view only stringifies the Decimal fields for JSON."""

    permission_classes = [IsAdminUser]

    def get(self, request):
        def money(value):
            return str(value) if value is not None else None

        rows = get_comparison_table()
        return Response([
            {
                'product_id': row['product_id'],
                'product_name': row['product_name'],
                'product_image': row['product_image'],
                'amazon_price': money(row['amazon_price']),
                'flipkart_price': money(row['flipkart_price']),
                'collabo_price': money(row['collabo_price']),
                'suggested_price': money(row['suggested_price']),
                'has_valid_data': row['has_valid_data'],
                'last_checked': row['last_checked'],
            }
            for row in rows
        ])


class PendingPriceApprovalViewSet(viewsets.ReadOnlyModelViewSet):
    """The admin approval queue. Read-only list/retrieve plus two actions —
    approve and reject — are the only way a row's status ever changes. Both
    actions delegate the actual work to apply_service, never touching
    Product or PendingPriceApproval directly here."""

    queryset = (
        PendingPriceApproval.objects
        .select_related('product', 'reviewed_by')
        .all()
        .order_by('-created_at')
    )
    serializer_class = PendingPriceApprovalSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'product']

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        approval = self.get_object()
        try:
            apply_admin_approved_price(approval, request.user)
        except ValueError as exc:
            return Response({'error': str(exc)}, status=400)
        approval.refresh_from_db()
        logger.info('Pending approval %s approved by %s', approval.id, request.user.email)
        return Response(self.get_serializer(approval).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        approval = self.get_object()
        rejection_reason = request.data.get('rejection_reason', '')
        try:
            reject_pending_approval(approval, request.user, rejection_reason)
        except ValueError as exc:
            return Response({'error': str(exc)}, status=400)
        return Response(self.get_serializer(approval).data)
