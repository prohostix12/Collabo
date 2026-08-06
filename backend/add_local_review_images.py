import os
import django
import sys
import random

sys.path.append(r'c:\Users\lenovo\Desktop\ProHostix\collab\collab\backend')
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "influencer_platform.settings")
django.setup()

from ecommerce.models import CustomerReview

TARGETS = {
    6: "/reviews/review_mop.png", # Mop/sponge
    4: "/reviews/review_lint.png", # Fabric/lint
    8: "/reviews/review_fan.png"  # Small fan
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

print(f"Added generated local user photos to {updated} specific product reviews!")
