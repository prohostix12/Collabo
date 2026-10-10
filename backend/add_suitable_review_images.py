import os
import django
import sys
import random

sys.path.append(r'c:\Users\lenovo\Desktop\ProHostix\collab\collab\backend')
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "influencer_platform.settings")
django.setup()

from ecommerce.models import CustomerReview

# Define suitable image URLs based on product categories or names
CATEGORY_IMAGES = {
    'Electronics': [
        "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&q=80&w=300",
        "https://images.unsplash.com/photo-1526406915894-7bcd65f60845?auto=format&fit=crop&q=80&w=300"
    ],
    'Mobiles': [
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=300",
        "https://images.unsplash.com/photo-1585060544812-6b45742d762f?auto=format&fit=crop&q=80&w=300"
    ],
    'Fashion': [
        "https://images.unsplash.com/photo-1434389678369-183423d6a2be?auto=format&fit=crop&q=80&w=300",
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=300"
    ],
    'Home & Kitchen': [
        "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&q=80&w=300",
        "https://images.unsplash.com/photo-1584286595398-a59f21d313f5?auto=format&fit=crop&q=80&w=300",
        "https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&q=80&w=300"
    ],
    'Beauty': [
        "https://images.unsplash.com/photo-1596462502278-27bf85033e5a?auto=format&fit=crop&q=80&w=300",
        "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=300",
        "https://images.unsplash.com/photo-1571781926291-c477eb31f819?auto=format&fit=crop&q=80&w=300"
    ],
    'Furniture': [
        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=300",
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=300"
    ],
    'Sports': [
        "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=300"
    ],
    'Appliances': [
        "https://images.unsplash.com/photo-1584433144859-1fc3ab64a957?auto=format&fit=crop&q=80&w=300"
    ],
    'Laundry & Garment Care': [
        "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&q=80&w=300"
    ],
    'Beauty & Personal Care': [
        "https://images.unsplash.com/photo-1596462502278-27bf85033e5a?auto=format&fit=crop&q=80&w=300"
    ],
    'Default': [
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=300"
    ]
}

# Group reviews by product
reviews = CustomerReview.objects.select_related('product').all()
product_reviews = {}
for r in reviews:
    if r.product.id not in product_reviews:
        product_reviews[r.product.id] = []
    product_reviews[r.product.id].append(r)

updated_count = 0

for pid, revs in product_reviews.items():
    product = revs[0].product
    cat = product.category
    
    # Try to find images based on category, fallback to Default
    images_pool = CATEGORY_IMAGES.get(cat)
    if not images_pool:
        # Fallback keyword matching just in case
        lower_name = product.name.lower()
        if 'lint' in lower_name or 'clean' in lower_name:
            images_pool = CATEGORY_IMAGES['Laundry & Garment Care']
        elif 'ice' in lower_name or 'face' in lower_name or 'skin' in lower_name:
            images_pool = CATEGORY_IMAGES['Beauty']
        elif 'phone' in lower_name or 'audio' in lower_name or 'speaker' in lower_name:
            images_pool = CATEGORY_IMAGES['Electronics']
        else:
            images_pool = CATEGORY_IMAGES['Default']
    
    # Pick 1 or 2 reviews for this product to have an image
    num_to_update = random.randint(1, min(2, len(revs)))
    selected_revs = random.sample(revs, num_to_update)
    
    for rev in selected_revs:
        # Only overwrite if it currently doesn't have an image or has a generic one
        rev.image = random.choice(images_pool)
        rev.save()
        updated_count += 1

print(f"Successfully added suitable images to {updated_count} customer reviews!")
