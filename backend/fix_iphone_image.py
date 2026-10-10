import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'influencer_platform.settings')
django.setup()

from ecommerce.models import Product

FIXES = [
    {
        'name': 'Apple iPhone 16 Pro Max',
        'image': 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=600&q=80',
        'images': [
            'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80',
        ],
    },
]

for fix in FIXES:
    try:
        p = Product.objects.get(name=fix['name'])
        p.image = fix['image']
        p.images = fix['images']
        p.save()
        print(f"UPDATED: {fix['name']}")
    except Product.DoesNotExist:
        print(f"NOT FOUND: {fix['name']}")
