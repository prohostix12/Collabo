from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CompetitorPriceViewSet,
    CompetitorProductMappingViewSet,
    DynamicPricingComparisonView,
    DynamicPricingDashboardView,
    PendingPriceApprovalViewSet,
    SuggestedPriceView,
)

router = DefaultRouter()
router.register('competitor-mappings', CompetitorProductMappingViewSet, basename='competitor-mappings')
router.register('competitor-prices', CompetitorPriceViewSet, basename='competitor-prices')
router.register('pending-approvals', PendingPriceApprovalViewSet, basename='pending-approvals')

urlpatterns = [
    path('', include(router.urls)),
    path('products/<int:product_id>/suggested-price/', SuggestedPriceView.as_view(), name='suggested-price'),
    path('dynamic-pricing/dashboard/', DynamicPricingDashboardView.as_view(), name='dynamic-pricing-dashboard'),
    path('dynamic-pricing/comparison/', DynamicPricingComparisonView.as_view(), name='dynamic-pricing-comparison'),
]
