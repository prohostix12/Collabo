from django.urls import path

from .views import ProductPriceComparisonView

urlpatterns = [
    path('compare/<int:product_id>/', ProductPriceComparisonView.as_view(), name='pricing-compare'),
]
