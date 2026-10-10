import os
import django
import sys
import random

sys.path.append(r'c:\Users\lenovo\Desktop\ProHostix\collab\collab\backend')
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "influencer_platform.settings")
django.setup()

from ecommerce.models import CustomerReview

TARGETS = {
    6: "https://images.unsplash.com/photo-1583947581924-860bda6a45df?auto=format&fit=crop&q=80&w=300", # Mop/sponge
    4: "https://images.unsplash.com/photo-1601600576337-c1d8a0d1373c?auto=format&fit=crop&q=80&w=300", # Fabric/lint
    8: "https://images.unsplash.com/photo-1618365908648-701389aa311a?auto=format&fit=crop&q=80&w=300"  # Small fan
}

updated = 0
for pid, img_url in TARGETS.items():
    # Find a review for this product
    reviews = list(CustomerReview.objects.filter(product_id=pid))
    if reviews:
        rev = random.choice(reviews)
        rev.image = img_url
        rev.save()
        updated += 1

print(f"Added custom user photos to {updated} specific product reviews!")
