from django.shortcuts import get_object_or_404
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from ecommerce.models import Product

from .models import CompetitorLink
from .serializers import ProductComparisonSerializer


class ProductPriceComparisonView(APIView):
    """GET /api/pricing/compare/<product_id>/ — public, read-only. Returns
    Collabo's own current price (untouched by this app) next to whichever
    Amazon/Flipkart links an admin has mapped for the product, using each
    link's last Bright Data check. Never triggers a live fetch — that only
    happens from the every-12h Celery task — so this stays fast regardless
    of Bright Data latency."""

    permission_classes = [permissions.AllowAny]

    def get(self, request, product_id):
        product = get_object_or_404(Product, pk=product_id)
        competitors = CompetitorLink.objects.filter(product=product, is_active=True).order_by('platform')

        data = {
            'product_id': product.id,
            'collabo_price': product.discount_price,
            'collabo_currency': 'INR',
            'competitors': competitors,
        }
        serializer = ProductComparisonSerializer(data)
        return Response(serializer.data)
