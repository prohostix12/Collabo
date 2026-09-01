"""Lightweight test-data builders for the pricing test suite. Not a real
factory library (none is used anywhere else in this project) — just small
functions that create the minimum valid fixtures each model needs, matching
the fields ecommerce.Product and accounts.User actually require."""

from decimal import Decimal

from django.utils import timezone

from accounts.models import User
from ecommerce.models import Product
from pricing.models import CompetitorPrice, CompetitorProductMapping, ProductPricingConfig

_counter = {'n': 0}


def _next_n():
    _counter['n'] += 1
    return _counter['n']


def make_admin_user(email=None):
    n = _next_n()
    email = email or f'admin{n}@pricingtests.local'
    return User.objects.create_user(
        username=f'admin{n}', email=email, password='testpass123',
        user_type='admin', is_staff=True,
    )


def make_non_admin_user(email=None):
    n = _next_n()
    email = email or f'buyer{n}@pricingtests.local'
    return User.objects.create_user(
        username=f'buyer{n}', email=email, password='testpass123',
        user_type='buyer', is_staff=False,
    )


def make_seller_user(email=None):
    n = _next_n()
    email = email or f'seller{n}@pricingtests.local'
    return User.objects.create_user(
        username=f'seller{n}', email=email, password='testpass123',
        user_type='seller',
    )


def make_product(seller=None, name=None, price=Decimal('1000.00'), discount_price=None, category='Electronics', brand=''):
    n = _next_n()
    seller = seller or make_seller_user()
    return Product.objects.create(
        seller=seller,
        name=name or f'Test Product {n}',
        category=category,
        brand=brand,
        price=price,
        discount_price=discount_price if discount_price is not None else price,
        description='Test product description',
        status='approved',
    )


def make_mapping(product, platform='amazon', external_id=None, verified=True, active=True, match_method='manual'):
    n = _next_n()
    return CompetitorProductMapping.objects.create(
        product=product,
        platform=platform,
        external_product_id=external_id or f'{platform.upper()}TEST{n}',
        match_method=match_method,
        is_verified=verified,
        is_active=active,
    )


def make_price(mapping, price, availability='available', succeeded=True, fetched_at=None, currency='INR', original_price=None):
    return CompetitorPrice.objects.create(
        product=mapping.product,
        mapping=mapping,
        platform=mapping.platform,
        external_product_id=mapping.external_product_id,
        price=price,
        original_price=original_price,
        currency=currency,
        availability=availability,
        fetch_succeeded=succeeded,
        fetched_at=fetched_at or timezone.now(),
    )


def make_config(product, **kwargs):
    defaults = dict(
        auto_pricing_enabled=True,
        pricing_strategy=ProductPricingConfig.STRATEGY_MATCH_LOWEST,
        max_auto_decrease_percent=Decimal('10.00'),
        max_auto_increase_percent=Decimal('10.00'),
    )
    defaults.update(kwargs)
    return ProductPricingConfig.objects.create(product=product, **defaults)
